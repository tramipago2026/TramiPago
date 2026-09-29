(function(){
  "use strict";

  const LOCAL_BACKEND_DISABLED=["localhost","127.0.0.1","::1"].includes(location.hostname)||window.__TRAMIPAGO_DISABLE_BACKEND===true;
  if(LOCAL_BACKEND_DISABLED)return;

  const PROJECT_URL="https://injimzsxbnawnekybfpm.supabase.co";
  const PUBLISHABLE_KEY="sb_publishable__bYVmN8G7g1fJG28C0SN0g_WbRJ23Ua";
  const SDK_URL="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.105.0/+esm";
  const REQUESTS_KEY="tramipago_requests_v1";
  const TOKENS_KEY="tramipago_request_tokens_v1";
  const START_KEY="tramipago_backend_started_at_v1";
  const CORRECTION_KEY="tramipago_backend_correction_request_v1";
  const STORAGE_BUCKET="request-files";
  const MAX_FILE_BYTES=10*1024*1024;
  const TOKEN_DB_NAME="tramipago_private_tokens_v1";
  const TOKEN_DB_STORE="tokens";

  let client=null;
  let syncing=false;
  let syncQueued=false;
  let internalWrite=false;
  let activationMs=0;
  let rerunRequested=false;

  const DB_TO_UI={
    draft:"draft",
    awaiting_payment:"payment_pending",
    payment_review:"payment_review",
    payment_confirmed:"in_progress",
    in_progress:"in_progress",
    needs_info:"needs_info",
    finalized:"finalized",
    cancelled:"cancelled"
  };

  const STATUS_LABELS={
    draft:"Borrador",
    awaiting_payment:"Pago pendiente",
    payment_review:"Pago en revisión",
    payment_confirmed:"Pago confirmado",
    in_progress:"En proceso",
    needs_info:"Falta información",
    finalized:"Finalizado",
    cancelled:"Anulado"
  };

  async function reportClientError(error,context={}){
    try{
      const message=String(error?.message||error||"Error desconocido").slice(0,1000);
      await fetch(PROJECT_URL+"/functions/v1/log-client-error",{method:"POST",headers:{"apikey":PUBLISHABLE_KEY,"Content-Type":"application/json"},body:JSON.stringify({code:"frontend",message,context:{page:location.pathname,route:location.hash||"#/",serviceId:(location.hash.match(/^#\/tramite\/([^/?]+)/)||[])[1]||null,...context}})});
    }catch(_){ }
  }
  window.TRAMI_REPORT_ERROR=reportClientError;

  function readJSON(key,fallback){
    try{return JSON.parse(localStorage.getItem(key)||"")||fallback;}catch(_){return fallback;}
  }

  function writeJSON(key,value){
    internalWrite=true;
    try{localStorage.setItem(key,JSON.stringify(value));}finally{internalWrite=false;}
  }

  function requests(){return readJSON(REQUESTS_KEY,[]);}

  function openTokenDb(){
    return new Promise((resolve,reject)=>{
      if(!window.indexedDB)return reject(new Error("IndexedDB no disponible"));
      const req=indexedDB.open(TOKEN_DB_NAME,1);
      req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(TOKEN_DB_STORE))req.result.createObjectStore(TOKEN_DB_STORE);};
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||new Error("No se pudo abrir el almacenamiento privado"));
    });
  }

  async function loadPersistedTokens(){
    try{
      const db=await openTokenDb();
      const value=await new Promise((resolve,reject)=>{
        const tx=db.transaction(TOKEN_DB_STORE,"readonly");
        const req=tx.objectStore(TOKEN_DB_STORE).get("active");
        req.onsuccess=()=>resolve(req.result||{});
        req.onerror=()=>reject(req.error);
      });
      db.close();
      return value&&typeof value==="object"?value:{};
    }catch(_){return {};}
  }

  async function persistTokens(value){
    try{
      const db=await openTokenDb();
      const tx=db.transaction(TOKEN_DB_STORE,"readwrite");
      tx.objectStore(TOKEN_DB_STORE).put(value,"active");
      await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
      db.close();
    }catch(_){}
  }

  function tokens(){
    try{
      const current=sessionStorage.getItem(TOKENS_KEY);
      return current?JSON.parse(current)||{}:{};
    }catch(_){return {};}
  }

  function saveTokens(value){
    sessionStorage.setItem(TOKENS_KEY,JSON.stringify(value));
    persistTokens(value);
    try{localStorage.removeItem(TOKENS_KEY);}catch(_){}
  }

  async function hydrateTokens(){
    const current=tokens();
    if(Object.keys(current).length)return current;
    const persisted=await loadPersistedTokens();
    if(Object.keys(persisted).length)sessionStorage.setItem(TOKENS_KEY,JSON.stringify(persisted));
    return persisted;
  }

  function saveRequests(value){writeJSON(REQUESTS_KEY,value);}

  function ensureActivationTime(){
    let value=localStorage.getItem(START_KEY);
    if(!value){
      value=new Date().toISOString();
      internalWrite=true;
      try{localStorage.setItem(START_KEY,value);}finally{internalWrite=false;}
    }
    const parsed=Date.parse(value);
    activationMs=Number.isFinite(parsed)?parsed:Date.now();
  }

  function isEligibleForBackend(request,tokenMap){
    if(tokenMap[request.id])return true;
    if(request.serverId)return false; // No recrear una ficha si se cerró la pestaña y expiró su token.
    const created=Date.parse(request.createdAt||"");
    return Number.isFinite(created)&&created>=activationMs-1000;
  }

  function randomToken(){
    const bytes=new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("");
  }

  async function sha256Hex(value){
    const bytes=new TextEncoder().encode(value);
    const digest=await crypto.subtle.digest("SHA-256",bytes);
    return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
  }

  function cloneWithoutDataUrls(value){
    if(Array.isArray(value))return value.map(cloneWithoutDataUrls);
    if(!value||typeof value!=="object")return value;
    const result={};
    Object.entries(value).forEach(([key,item])=>{
      if(key==="dataUrl")return;
      result[key]=cloneWithoutDataUrls(item);
    });
    return result;
  }

  function draftAuthorized(request){
    return request?.status!=="draft"||request?.answers?.authorization===true;
  }

  function payloadFor(request){
    if(!draftAuthorized(request))return {};
    return cloneWithoutDataUrls(request.answers||{});
  }

  function contactFor(request){
    if(!draftAuthorized(request))return {clientName:"",email:null,whatsapp:""};
    const answers=request.answers||{};
    return {
      clientName:request.clientName||answers.fullName||answers.name||"",
      email:answers.email||request.email||null,
      whatsapp:answers.whatsapp||request.whatsapp||""
    };
  }

  function quotedAmount(request){
    const raw=request?.pricing?.total;
    const value=Number(raw);
    return Number.isFinite(value)&&value>=0?value:null;
  }

  function dataUrlToBlob(dataUrl){
    const parts=String(dataUrl||"").split(",");
    if(parts.length<2)throw new Error("Archivo inválido");
    const meta=parts[0];
    const mime=(meta.match(/^data:([^;]+)/)||[])[1]||"application/octet-stream";
    const binary=atob(parts.slice(1).join(","));
    const bytes=new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
    return new Blob([bytes],{type:mime});
  }

  function safeName(name){
    return String(name||"archivo").normalize("NFD").replace(/[\u0300-\u036f]/g,"")
      .replace(/[^a-zA-Z0-9._-]+/g,"-").replace(/^-+|-+$/g,"").slice(0,90)||"archivo";
  }


  async function ensureServerRecord(request,tokenMap){
    let meta=tokenMap[request.id]||null;
    if(meta?.code&&meta?.raw){
      if(request.code!==meta.code||request.serverId!==meta.serverId){
        request.code=meta.code;
        request.serverId=meta.serverId||request.serverId||null;
      }
      return meta;
    }

    const intendedStatus=request.status;
    const {data,error}=await client.functions.invoke("create-request",{
      body:{
        serviceId:request.serviceId,
        complete:false
      }
    });
    if(error)throw error;
    if(data?.error)throw new Error(data.error);
    if(!data?.code||!data?.requestToken)throw new Error("El backend no devolvió los datos de la solicitud");

    meta={raw:data.requestToken,code:data.code,serverId:data.requestId||null,serverStatus:data.status||null,lastSignature:"",paymentUploaded:false,files:{},persistedAt:Date.now()};
    tokenMap[request.id]=meta;
    saveTokens(tokenMap);
    request.code=data.code;
    request.serverId=data.requestId||null;
    request.status=intendedStatus==="draft"?(DB_TO_UI[data.status]||"draft"):intendedStatus;
    request.createdAt=data.createdAt||request.createdAt;
    request.updatedAt=data.createdAt||request.updatedAt;
    if(data.amount!==null&&data.amount!==undefined&&Number.isFinite(Number(data.amount))&&request.pricing){request.pricing.total=Number(data.amount);}
    return meta;
  }

  async function updateServerDraft(request,meta,helpContext=null){
    if(!["draft","payment_pending","in_progress"].includes(request.status))return;
    if(meta.serverStatus&&!["draft","awaiting_payment"].includes(meta.serverStatus))return;
    const contact=contactFor(request);
    const complete=request.status!=="draft";
    const body={
      code:meta.code,
      requestToken:meta.raw,
      clientName:contact.clientName||"",
      email:contact.email||"",
      whatsapp:contact.whatsapp||"",
      formData:payloadFor(request),
      currentStep:request.currentStep||"data",
      completionPercent:Number.isFinite(Number(request.completionPercent))?Number(request.completionPercent):0,
      complete,
      helpContext:helpContext||null,
      missingFields:draftAuthorized(request)&&Array.isArray(request.missingFields)?request.missingFields:[]
    };
    const signature=JSON.stringify(body);
    if(!helpContext&&meta.lastSignature===signature)return;
    const {data,error}=await client.functions.invoke("update-request-draft",{body});
    if(error)throw error;
    if(data?.error)throw new Error(data.error);
    meta.serverStatus=data?.status||meta.serverStatus;
    request.status=DB_TO_UI[data?.status]||request.status;
    if(!helpContext)meta.lastSignature=signature;
  }

  async function uploadBlob(meta,kind,fileInfo,blob,label){
    if(!blob||blob.size<1||blob.size>MAX_FILE_BYTES)throw new Error("El archivo supera el límite permitido");
    const filename=fileInfo.name||label||(kind==="payment_receipt"?"comprobante":"archivo");
    const type=fileInfo.type||blob.type||"application/octet-stream";
    const file=blob instanceof File?blob:new File([blob],filename,{type});
    const form=new FormData();
    form.set("code",meta.code);
    form.set("requestToken",meta.raw);
    let functionName="upload-file";
    if(kind==="payment_receipt"){
      functionName="confirm-payment";
      form.set("receipt",file);
    }else{
      form.set("kind",kind);
      form.set("file",file);
    }
    const {data,error}=await client.functions.invoke(functionName,{body:form});
    if(error)throw error;
    if(data?.error)throw new Error(data.error);
    return data?.storagePath||null;
  }

  async function syncAnswerFiles(request,meta){
    if(!draftAuthorized(request))return;
    const answers=request.answers||{};
    meta.files=meta.files||{};
    for(const [fieldId,value] of Object.entries(answers)){
      if(!value||typeof value!=="object"||!value.dataUrl||meta.files[fieldId])continue;
      const blob=dataUrlToBlob(value.dataUrl);
      const kind=/dni|documento/i.test(fieldId)?"dni":"supporting_document";
      const path=await uploadBlob(meta,kind,value,blob,fieldId);
      meta.files[fieldId]=path;
      answers[fieldId]={name:value.name,size:value.size||blob.size,type:value.type||blob.type,storagePath:path};
    }
  }

  async function syncPayment(request,meta){
    const payment=request.payment;
    if(!payment?.dataUrl||meta.paymentUploaded)return;
    const blob=dataUrlToBlob(payment.dataUrl);
    const path=await uploadBlob(meta,"payment_receipt",{
      name:payment.receiptName||"comprobante",
      type:payment.type||blob.type
    },blob,"comprobante");
    meta.paymentUploaded=true;
    request.payment={receiptName:payment.receiptName||"comprobante",size:payment.size||blob.size,type:payment.type||blob.type,storagePath:path};
    request.status="payment_review";
  }

  async function syncOne(request,tokenMap){
    if(!request?.id||!request?.serviceId||!isEligibleForBackend(request,tokenMap))return;
    const meta=await ensureServerRecord(request,tokenMap);
    await syncAnswerFiles(request,meta);
    if(["draft","payment_pending","in_progress"].includes(request.status))await updateServerDraft(request,meta);
    if(request.status==="payment_review")await syncPayment(request,meta);
    delete request.backendSyncError;
    request.backendSyncedAt=new Date().toISOString();
  }

  async function syncAll(){
    if(!client)return;
    if(syncing){rerunRequested=true;return;}
    syncing=true;
    try{
      const list=requests();
      const tokenMap=tokens();
      let changed=false;
      for(const request of list){
        const before=JSON.stringify(request);
        try{await syncOne(request,tokenMap);}catch(error){
          console.error("TramiPago backend sync:",error);
          request.backendSyncError=String(error?.message||error||"Error de sincronización");
        }
        if(JSON.stringify(request)!==before)changed=true;
      }
      saveTokens(tokenMap);
      if(changed){
        saveRequests(list);
        if(!document.getElementById("data-form"))window.dispatchEvent(new HashChangeEvent("hashchange"));
        else window.dispatchEvent(new CustomEvent("tramipago:draft-synced"));
      }
    }finally{syncing=false;if(rerunRequested){rerunRequested=false;queueSync();}}
  }

  function queueSync(){
    if(syncQueued)return;
    syncQueued=true;
    setTimeout(()=>{syncQueued=false;syncAll();},80);
  }

  function patchStorage(){
    const original=Storage.prototype.setItem;
    if(original.__tramipagoPatched)return;
    function patched(key,value){
      const result=original.call(this,key,value);
      if(!internalWrite&&this===window.localStorage&&key===REQUESTS_KEY)queueSync();
      return result;
    }
    patched.__tramipagoPatched=true;
    Storage.prototype.setItem=patched;
  }

  function findLocalByCode(code){
    const normalized=String(code||"").trim().toUpperCase();
    return requests().find(item=>String(item.code||"").toUpperCase()===normalized)||null;
  }

  function findLocalById(id){return requests().find(item=>item.id===id)||null;}
  function localTokenMeta(request){return request?tokens()[request.id]||null:null;}

  function formatDate(value){
    if(!value)return "";
    try{return new Intl.DateTimeFormat("es-AR",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value));}catch(_){return value;}
  }

  function escapeHTML(value){
    return String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
      .replaceAll('"',"&quot;").replaceAll("'","&#039;");
  }

  function renderServerStatus(row,localRequest){
    const panel=document.querySelector(".tracking-result");
    if(!panel)return;
    const uiStatus=DB_TO_UI[row.status]||row.status;
    const localId=localRequest?.id||"";
    const canCorrect=uiStatus==="needs_info"&&localRequest&&localTokenMeta(localRequest);
    const canResume=uiStatus==="payment_pending"&&localRequest&&localTokenMeta(localRequest);
    panel.innerHTML=`
      <div class="status-header">
        <div><p class="eyebrow">${escapeHTML(row.tracking_code)}</p><h2>${escapeHTML(row.service_name)}</h2></div>
        <span class="status-badge">${escapeHTML(STATUS_LABELS[row.status]||"Estado pendiente")}</span>
      </div>
      <p class="text-small">Creada: ${escapeHTML(formatDate(row.created_at))}</p>
      <p class="text-small">Última actualización: ${escapeHTML(formatDate(row.updated_at))}</p>
      ${row.status_note?`<div class="notice"><strong>Observación:</strong> ${escapeHTML(row.status_note)}</div>`:""}
      ${row.estimated_completion_at?`<div class="notice"><strong>Fecha estimada:</strong> ${escapeHTML(formatDate(row.estimated_completion_at))}</div>`:""}
      ${canCorrect?`<div class="needs-info-box"><strong>Falta información.</strong><p>Revisá la observación y corregí los datos solicitados.</p><button class="button button-primary" type="button" data-action="correct-request" data-request-id="${escapeHTML(localId)}">Corregí información</button></div>`:""}
      ${canResume?`<div class="needs-info-box"><strong>Pago pendiente.</strong><p>Podés continuar con el mismo código desde este dispositivo.</p><button class="button button-primary" type="button" data-action="resume-payment" data-request-id="${escapeHTML(localId)}">Continuá con el pago</button></div>`:""}
    `;
  }

  function updateLocalFromStatus(row){
    const list=requests();
    const request=list.find(item=>String(item.code||"").toUpperCase()===String(row.tracking_code||"").toUpperCase());
    if(!request)return null;
    const nextStatus=DB_TO_UI[row.status]||request.status;
    request.status=nextStatus;
    request.updatedAt=row.updated_at||request.updatedAt;
    if(row.status_note){
      request.observations=[{text:row.status_note,createdAt:row.updated_at||new Date().toISOString()},...(request.observations||[]).filter(x=>x?.text!==row.status_note)];
    }
    saveRequests(list);
    return request;
  }

  async function lookupStatus(code){
    const local=findLocalByCode(code);
    const whatsapp=contactFor(local||{}).whatsapp||"";
    const last4=String(whatsapp).replace(/\D/g,"").slice(-4);
    if(last4.length!==4)return null;
    const {data,error}=await client.functions.invoke("track-request",{body:{code:String(code||"").trim().toUpperCase(),last4}});
    if(error)throw error;
    if(!data?.ok)return null;
    return {tracking_code:data.code,status:data.status};
  }

  function installTrackingInterceptor(){
    document.addEventListener("submit",async event=>{
      const form=event.target;
      if(!(form instanceof HTMLFormElement)||form.id!=="tracking-form"||!client)return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const input=form.elements.namedItem("trackingCode");
      const code=String(input?.value||"").trim().toUpperCase();
      const errorBox=form.querySelector(".form-error");
      if(errorBox){errorBox.textContent="";errorBox.classList.remove("visible");}
      try{
        const row=await lookupStatus(code);
        if(!row){
          if(errorBox){errorBox.textContent="No encontramos una solicitud con ese código.";errorBox.classList.add("visible");}
          const panel=document.querySelector(".tracking-result");
          if(panel)panel.innerHTML='<div class="empty-state"><h2>Estado de la solicitud</h2><p>No encontramos ese código.</p></div>';
          return;
        }
        const local=updateLocalFromStatus(row)||findLocalByCode(code);
        renderServerStatus(row,local);
      }catch(error){
        console.error("TramiPago tracking:",error);
        if(errorBox){errorBox.textContent="No se pudo consultar el estado. Intentá nuevamente.";errorBox.classList.add("visible");}
      }
    },true);
  }

  async function recordHelp(request,context={}){
    if(!client||!request)return null;
    await syncAll();
    const fresh=findLocalById(request.id)||request;
    const meta=localTokenMeta(fresh);
    if(!meta?.code||!meta?.raw)return null;
    const helpContext={
      source:"whatsapp",
      step:String(context.step||fresh.currentStep||"site").slice(0,80),
      route:String(location.hash||"#/").slice(0,160),
      serviceId:fresh.serviceId||null,
      requestedAt:new Date().toISOString()
    };
    const {data,error}=await client.functions.invoke("request-help",{
      body:{
        code:meta.code,
        requestToken:meta.raw,
        currentStep:helpContext.step,
        helpContext
      }
    });
    if(error)throw error;
    if(data?.error)throw new Error(data.error);
    const list=requests();
    const target=list.find(item=>item.id===fresh.id);
    if(target){
      target.helpContext=helpContext;
      target.updatedAt=new Date().toISOString();
      saveRequests(list);
    }
    return {request:target||fresh,helpContext};
  }

  function installRetryInterceptor(){
    document.addEventListener("click",event=>{
      const button=event.target.closest('[data-action="retry-backend-sync"]');
      if(!button)return;
      event.preventDefault();
      if(client){
        button.disabled=true;
        syncAll().finally(()=>{button.disabled=false;});
      }else{
        location.reload();
      }
    },true);
  }

  function installCorrectionInterceptor(){
    document.addEventListener("click",event=>{
      const button=event.target.closest('[data-action="correct-request"]');
      if(button?.dataset.requestId)sessionStorage.setItem(CORRECTION_KEY,button.dataset.requestId);
    },true);

    document.addEventListener("submit",async event=>{
      const form=event.target;
      if(!(form instanceof HTMLFormElement)||form.id!=="correction-form"||!client)return;
      const correctionId=sessionStorage.getItem(CORRECTION_KEY)||"";
      const local=findLocalById(correctionId);
      if(!local||local.status!=="needs_info"||!localTokenMeta(local))return;
      const meta=localTokenMeta(local);
      const service=(window.TRAMI_SERVICES||[]).find(item=>item.id===local.serviceId);
      if(!service)return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const errorBox=form.querySelector(".form-error");
      if(!form.checkValidity()){
        if(errorBox){errorBox.textContent="Completá los campos obligatorios antes de enviar la corrección.";errorBox.classList.add("visible");}
        form.reportValidity();
        return;
      }
      try{
        const patch={};
        for(const field of service.fields||[]){
          const element=form.elements.namedItem(field.id);
          if(!element)continue;
          if(field.type==="checkbox"){
            patch[field.id]=Boolean(element.checked);
          }else if(field.type==="file"){
            const file=element.files?.[0];
            if(file){
              const kind=/dni|documento/i.test(field.id)?"dni":"supporting_document";
              const path=await uploadBlob(meta,kind,{name:file.name,type:file.type},file,field.id);
              patch[field.id]={name:file.name,size:file.size,type:file.type,storagePath:path};
            }
          }else{
            patch[field.id]=String(element.value||"").trim();
          }
        }
        const {data,error}=await client.functions.invoke("submit-correction",{
          body:{code:meta.code,requestToken:meta.raw,formData:patch}
        });
        if(error)throw error;
        if(data?.error)throw new Error(data.error);
        const list=requests();
        const target=list.find(item=>item.id===local.id);
        if(target){target.answers={...(target.answers||{}),...patch};target.status="in_progress";saveRequests(list);}
        sessionStorage.removeItem(CORRECTION_KEY);
        const row=await lookupStatus(meta.code);
        if(row){updateLocalFromStatus(row);location.hash="#/seguimiento";setTimeout(()=>renderServerStatus(row,findLocalByCode(meta.code)),50);}
      }catch(error){
        console.error("TramiPago correction:",error);
        if(errorBox){errorBox.textContent="No se pudo enviar la corrección. Intentá nuevamente.";errorBox.classList.add("visible");}
      }
    },true);
  }

  function normalizeTrackingPlaceholder(){
    const input=document.getElementById("tracking-code");
    if(input)input.placeholder="AP-000012-A1B2C3D4";
  }

  function observeUI(){
    const app=document.getElementById("app");
    if(!app)return;
    const observer=new MutationObserver(()=>normalizeTrackingPlaceholder());
    observer.observe(app,{childList:true,subtree:true});
    normalizeTrackingPlaceholder();
  }

  async function init(){
    ensureActivationTime();
    patchStorage();
    installRetryInterceptor();
    installCorrectionInterceptor();
    observeUI();
    try{
      const module=await import(SDK_URL);
      client=module.createClient(PROJECT_URL,PUBLISHABLE_KEY,{
        auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
      });
      await hydrateTokens();
      window.TRAMIPAGO_BACKEND={client,projectUrl:PROJECT_URL,sync:syncAll,flush:syncAll,lookupStatus,recordHelp,queueSync};
      await syncAll();
    }catch(error){
      console.error("No se pudo iniciar Supabase para TramiPago:",error);
    }
  }

  init();
})();
