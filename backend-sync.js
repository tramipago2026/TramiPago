(function(){
  "use strict";

  const PROJECT_URL="https://injimzsxbnawnekybfpm.supabase.co";
  const PUBLISHABLE_KEY="sb_publishable__bYVmN8G7g1fJG28C0SN0g_WbRJ23Ua";
  const SDK_URL="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.105.0/+esm";
  const REQUESTS_KEY="tramipago_requests_v1";
  const TOKENS_KEY="tramipago_request_tokens_v1";
  const STORAGE_BUCKET="request-files";
  const MAX_FILE_BYTES=10*1024*1024;

  let client=null;
  let syncing=false;
  let syncQueued=false;
  let internalWrite=false;

  const DB_TO_UI={
    awaiting_payment:"payment_pending",
    payment_review:"payment_review",
    payment_confirmed:"in_progress",
    in_progress:"in_progress",
    needs_info:"needs_info",
    finalized:"finalized"
  };

  const STATUS_LABELS={
    awaiting_payment:"Pago pendiente",
    payment_review:"Pago en revisión",
    payment_confirmed:"Pago confirmado",
    in_progress:"En proceso",
    needs_info:"Falta información",
    finalized:"Finalizado"
  };

  function readJSON(key,fallback){
    try{return JSON.parse(localStorage.getItem(key)||"")||fallback;}catch(_){return fallback;}
  }

  function writeJSON(key,value){
    internalWrite=true;
    try{localStorage.setItem(key,JSON.stringify(value));}finally{internalWrite=false;}
  }

  function requests(){return readJSON(REQUESTS_KEY,[]);}
  function tokens(){return readJSON(TOKENS_KEY,{});}
  function saveTokens(value){writeJSON(TOKENS_KEY,value);}
  function saveRequests(value){writeJSON(REQUESTS_KEY,value);}

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

  function payloadFor(request){return cloneWithoutDataUrls(request.answers||{});}

  function contactFor(request){
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

  async function rpc(name,args){
    const {data,error}=await client.rpc(name,args);
    if(error)throw error;
    return data;
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

    const raw=randomToken();
    const tokenHash=await sha256Hex(raw);
    const contact=contactFor(request);
    const data=await rpc("create_request_record",{
      p_service_id:request.serviceId,
      p_public_token_hash:tokenHash,
      p_client_name:contact.clientName||null,
      p_email:contact.email,
      p_whatsapp:contact.whatsapp,
      p_quoted_amount:quotedAmount(request),
      p_payload:payloadFor(request)
    });
    const row=Array.isArray(data)?data[0]:data;
    if(!row?.tracking_code)throw new Error("Supabase no devolvió el código del trámite");

    meta={raw,code:row.tracking_code,serverId:row.id,lastSignature:"",paymentUploaded:false,files:{}};
    tokenMap[request.id]=meta;
    saveTokens(tokenMap);
    request.code=row.tracking_code;
    request.serverId=row.id;
    request.status=DB_TO_UI[row.status]||request.status;
    request.createdAt=row.created_at||request.createdAt;
    request.updatedAt=row.created_at||request.updatedAt;
    return meta;
  }

  async function updateServerDraft(request,meta){
    if(request.status!=="payment_pending")return;
    const contact=contactFor(request);
    const tokenHash=await sha256Hex(meta.raw);
    const signature=JSON.stringify({c:contact,q:quotedAmount(request),p:payloadFor(request)});
    if(meta.lastSignature===signature)return;
    await rpc("update_public_request_draft",{
      p_tracking_code:meta.code,
      p_public_token_hash:tokenHash,
      p_client_name:contact.clientName||null,
      p_email:contact.email,
      p_whatsapp:contact.whatsapp,
      p_quoted_amount:quotedAmount(request),
      p_payload:payloadFor(request)
    });
    meta.lastSignature=signature;
  }

  async function uploadBlob(meta,kind,fileInfo,blob,label){
    if(!blob||blob.size<1||blob.size>MAX_FILE_BYTES)throw new Error("El archivo supera el límite permitido");
    const tokenHash=await sha256Hex(meta.raw);
    const filename=`${Date.now()}-${Math.random().toString(36).slice(2,8)}-${safeName(fileInfo.name)}`;
    const path=`${meta.code}/${tokenHash}/${filename}`;
    const {error}=await client.storage.from(STORAGE_BUCKET).upload(path,blob,{
      contentType:fileInfo.type||blob.type||"application/octet-stream",
      upsert:false,
      cacheControl:"3600"
    });
    if(error)throw error;

    if(kind==="payment_receipt"){
      await rpc("register_public_payment_receipt",{
        p_tracking_code:meta.code,
        p_public_token_hash:tokenHash,
        p_storage_path:path,
        p_original_name:fileInfo.name||label||"comprobante",
        p_mime_type:fileInfo.type||blob.type||null,
        p_size_bytes:blob.size
      });
    }else{
      await rpc("register_public_request_file",{
        p_tracking_code:meta.code,
        p_public_token_hash:tokenHash,
        p_kind:kind,
        p_storage_path:path,
        p_original_name:fileInfo.name||label||"archivo",
        p_mime_type:fileInfo.type||blob.type||null,
        p_size_bytes:blob.size
      });
    }
    return path;
  }

  async function syncAnswerFiles(request,meta){
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
    if(!request?.id||!request?.serviceId)return;
    const meta=await ensureServerRecord(request,tokenMap);
    await syncAnswerFiles(request,meta);
    if(request.status==="payment_pending")await updateServerDraft(request,meta);
    if(request.status==="payment_review")await syncPayment(request,meta);
    request.backendSyncedAt=new Date().toISOString();
  }

  async function syncAll(){
    if(!client||syncing)return;
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
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      }
    }finally{syncing=false;}
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
    const {data,error}=await client.rpc("get_public_request_status",{p_tracking_code:String(code||"").trim().toUpperCase()});
    if(error)throw error;
    return Array.isArray(data)?data[0]||null:data||null;
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

  function installCorrectionInterceptor(){
    document.addEventListener("submit",async event=>{
      const form=event.target;
      if(!(form instanceof HTMLFormElement)||form.id!=="correction-form"||!client)return;
      const local=requests().find(item=>item.status==="needs_info"&&localTokenMeta(item));
      if(!local)return;
      const meta=localTokenMeta(local);
      const service=(window.TRAMI_SERVICES||[]).find(item=>item.id===local.serviceId);
      if(!service)return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const errorBox=form.querySelector(".form-error");
      try{
        const patch={};
        for(const field of service.fields||[]){
          const element=form.elements.namedItem(field.id);
          if(!element)continue;
          if(field.type==="checkbox")patch[field.id]=Boolean(element.checked);
          else if(field.type!=="file")patch[field.id]=String(element.value||"").trim();
        }
        const tokenHash=await sha256Hex(meta.raw);
        await rpc("submit_public_request_correction",{
          p_tracking_code:meta.code,
          p_public_token_hash:tokenHash,
          p_patch:patch
        });
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
    if(input)input.placeholder="AP-000001";
  }

  function observeUI(){
    const app=document.getElementById("app");
    if(!app)return;
    const observer=new MutationObserver(()=>normalizeTrackingPlaceholder());
    observer.observe(app,{childList:true,subtree:true});
    normalizeTrackingPlaceholder();
  }

  async function init(){
    patchStorage();
    installTrackingInterceptor();
    installCorrectionInterceptor();
    observeUI();
    try{
      const module=await import(SDK_URL);
      client=module.createClient(PROJECT_URL,PUBLISHABLE_KEY,{
        auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
      });
      window.TRAMIPAGO_BACKEND={client,projectUrl:PROJECT_URL,sync:syncAll,lookupStatus};
      await syncAll();
    }catch(error){
      console.error("No se pudo iniciar Supabase para TramiPago:",error);
    }
  }

  init();
})();
