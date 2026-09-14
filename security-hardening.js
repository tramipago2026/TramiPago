(function(){
  "use strict";

  const REQUESTS_KEY="tramipago_requests_v1";
  const TOKENS_KEY="tramipago_request_tokens_v1";
  const CORRECTION_KEY="tramipago_backend_correction_request_v1";
  const STORAGE_BUCKET="request-files";
  const MAX_FILE_BYTES=10*1024*1024;

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

  function readJSON(key,fallback){try{return JSON.parse(localStorage.getItem(key)||"")||fallback;}catch(_){return fallback;}}
  function writeJSON(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch(_){}}
  function requests(){return readJSON(REQUESTS_KEY,[]);}
  function tokens(){return readJSON(TOKENS_KEY,{});}
  function digits(value){return String(value||"").replace(/\D/g,"");}
  function findLocalByCode(code){const normalized=String(code||"").trim().toUpperCase();return requests().find(item=>String(item.code||"").toUpperCase()===normalized)||null;}
  function findLocalById(id){return requests().find(item=>item.id===id)||null;}
  function localTokenMeta(request){return request?tokens()[request.id]||null:null;}
  function phoneLast4For(request){
    const raw=request?.verificationLast4||request?.whatsapp||request?.answers?.whatsapp||"";
    const value=digits(raw);
    return value.length>=4?value.slice(-4):"";
  }
  function backendClient(){return window.TRAMIPAGO_BACKEND?.client||null;}
  function formatDate(value){if(!value)return "";try{return new Intl.DateTimeFormat("es-AR",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value));}catch(_){return String(value);}}
  function escapeHTML(value){return String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}

  function ensureTrackingVerificationField(){
    const form=document.getElementById("tracking-form");
    if(!form||form.querySelector('[name="trackingPhoneLast4"]'))return;
    const codeInput=form.elements.namedItem("trackingCode");
    if(!(codeInput instanceof HTMLInputElement))return;
    codeInput.placeholder="AP-000012-A1B2C3D4";
    codeInput.autocapitalize="characters";
    codeInput.spellcheck=false;

    const field=document.createElement("div");
    field.className="field tracking-verification-field";
    field.innerHTML='<label for="tracking-phone-last4">Últimos 4 números del WhatsApp</label><input class="form-control" id="tracking-phone-last4" name="trackingPhoneLast4" type="text" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" autocomplete="tel-national" aria-describedby="tracking-phone-help" placeholder="Ej.: 3232" /><small id="tracking-phone-help" class="text-small">Se usan solo para verificar que el código corresponde a tu trámite.</small>';
    const errorBox=form.querySelector(".form-error");
    form.insertBefore(field,errorBox||form.querySelector('button[type="submit"]'));
    const phoneInput=field.querySelector("input");

    const syncLocalVerification=()=>{
      const local=findLocalByCode(codeInput.value);
      const last4=phoneLast4For(local);
      if(last4&&phoneInput&&!phoneInput.dataset.userEdited)phoneInput.value=last4;
    };
    codeInput.addEventListener("input",syncLocalVerification);
    phoneInput?.addEventListener("input",()=>{
      phoneInput.value=digits(phoneInput.value).slice(0,4);
      phoneInput.dataset.userEdited="true";
    });
    syncLocalVerification();
  }

  async function secureLookup(code,last4){
    const client=backendClient();
    if(!client)throw new Error("backend_not_ready");
    const {data,error}=await client.rpc("get_public_request_status_secure",{
      p_tracking_code:String(code||"").trim().toUpperCase(),
      p_phone_last4:digits(last4).slice(-4)
    });
    if(error)throw error;
    return Array.isArray(data)?data[0]||null:data||null;
  }

  function redactFinalizedLocalRequest(request,row){
    const verificationLast4=phoneLast4For(request);
    return {
      id:request.id,
      code:row.tracking_code||request.code,
      serverId:request.serverId||null,
      serviceId:row.service_id||request.serviceId,
      serviceName:row.service_name||request.serviceName,
      status:"finalized",
      createdAt:row.created_at||request.createdAt,
      updatedAt:row.updated_at||request.updatedAt||new Date().toISOString(),
      verificationLast4,
      result:request.result||"",
      resultFile:request.resultFile||null,
      privacyRedactedAt:new Date().toISOString()
    };
  }

  function updateLocalFromStatus(row){
    const list=requests();
    const index=list.findIndex(item=>String(item.code||"").toUpperCase()===String(row.tracking_code||"").toUpperCase());
    if(index<0)return null;
    const request=list[index];
    if(row.status==="finalized"){
      const redacted=redactFinalizedLocalRequest(request,row);
      list[index]=redacted;
      writeJSON(REQUESTS_KEY,list);
      const tokenMap=tokens();
      if(request.id&&tokenMap[request.id]){delete tokenMap[request.id];writeJSON(TOKENS_KEY,tokenMap);}
      return redacted;
    }
    request.status=DB_TO_UI[row.status]||request.status;
    request.updatedAt=row.updated_at||request.updatedAt;
    if(row.status_note){
      request.observations=[{text:row.status_note,createdAt:row.updated_at||new Date().toISOString()},...(request.observations||[]).filter(x=>x?.text!==row.status_note)];
    }
    list[index]=request;
    writeJSON(REQUESTS_KEY,list);
    return request;
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

  function showTrackingError(form,message){
    const errorBox=form.querySelector(".form-error");
    if(errorBox){errorBox.textContent=message;errorBox.classList.add("visible");}
  }
  function clearTrackingError(form){const errorBox=form.querySelector(".form-error");if(errorBox){errorBox.textContent="";errorBox.classList.remove("visible");}}

  document.addEventListener("submit",async event=>{
    const form=event.target;
    if(!(form instanceof HTMLFormElement)||form.id!=="tracking-form")return;
    event.preventDefault();
    event.stopImmediatePropagation();
    clearTrackingError(form);
    const code=String(form.elements.namedItem("trackingCode")?.value||"").trim().toUpperCase();
    const local=findLocalByCode(code);
    const phoneInput=form.elements.namedItem("trackingPhoneLast4");
    const last4=digits(phoneInput?.value||phoneLast4For(local)).slice(-4);
    if(last4.length!==4){showTrackingError(form,"Ingresá los últimos 4 números del WhatsApp usado en el trámite.");phoneInput?.focus();return;}
    if(!backendClient()){showTrackingError(form,"El sistema todavía se está conectando. Intentá nuevamente en unos segundos.");return;}
    try{
      const row=await secureLookup(code,last4);
      if(!row){
        showTrackingError(form,"No pudimos validar esos datos. Revisá el código y los últimos 4 números del WhatsApp.");
        const panel=document.querySelector(".tracking-result");
        if(panel)panel.innerHTML='<div class="empty-state"><h2>Estado de la solicitud</h2><p>No pudimos validar los datos ingresados.</p></div>';
        return;
      }
      const updated=updateLocalFromStatus(row)||local;
      renderServerStatus(row,updated);
    }catch(error){
      console.error("TramiPago secure tracking:",error);
      showTrackingError(form,"No se pudo consultar el estado. Intentá nuevamente.");
    }
  },true);

  async function sha256Hex(value){
    const bytes=new TextEncoder().encode(value);
    const digest=await crypto.subtle.digest("SHA-256",bytes);
    return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
  }
  function safeName(name){return String(name||"archivo").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9._-]+/g,"-").replace(/^-+|-+$/g,"").slice(0,90)||"archivo";}
  async function uploadCorrectionFile(client,meta,kind,file,label){
    if(!file||file.size<1||file.size>MAX_FILE_BYTES)throw new Error("El archivo supera el límite permitido");
    const tokenHash=await sha256Hex(meta.raw);
    const filename=`${Date.now()}-${Math.random().toString(36).slice(2,8)}-${safeName(file.name)}`;
    const path=`${meta.code}/${tokenHash}/${filename}`;
    const {error}=await client.storage.from(STORAGE_BUCKET).upload(path,file,{contentType:file.type||"application/octet-stream",upsert:false,cacheControl:"3600"});
    if(error)throw error;
    const {error:registerError}=await client.rpc("register_public_request_file",{
      p_tracking_code:meta.code,p_public_token_hash:tokenHash,p_kind:kind,p_storage_path:path,
      p_original_name:file.name||label||"archivo",p_mime_type:file.type||null,p_size_bytes:file.size
    });
    if(registerError)throw registerError;
    return path;
  }

  document.addEventListener("submit",async event=>{
    const form=event.target;
    if(!(form instanceof HTMLFormElement)||form.id!=="correction-form")return;
    const correctionId=sessionStorage.getItem(CORRECTION_KEY)||"";
    const local=findLocalById(correctionId);
    const meta=localTokenMeta(local);
    const client=backendClient();
    if(!local||local.status!=="needs_info"||!meta||!client)return;
    const service=(window.TRAMI_SERVICES||[]).find(item=>item.id===local.serviceId);
    if(!service)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const errorBox=form.querySelector(".form-error");
    if(errorBox){errorBox.textContent="";errorBox.classList.remove("visible");}
    try{
      const patch={};
      for(const field of service.fields||[]){
        const element=form.elements.namedItem(field.id);
        if(!element)continue;
        if(field.type==="checkbox")patch[field.id]=Boolean(element.checked);
        else if(field.type==="file"){
          const file=element.files?.[0];
          if(file){
            const kind=/dni|documento/i.test(field.id)?"dni":"supporting_document";
            const path=await uploadCorrectionFile(client,meta,kind,file,field.id);
            patch[field.id]={name:file.name,size:file.size,type:file.type,storagePath:path};
          }
        }else patch[field.id]=String(element.value||"").trim();
      }
      const tokenHash=await sha256Hex(meta.raw);
      const {error}=await client.rpc("submit_public_request_correction",{p_tracking_code:meta.code,p_public_token_hash:tokenHash,p_patch:patch});
      if(error)throw error;
      const list=requests();
      const target=list.find(item=>item.id===local.id);
      if(target){target.answers={...(target.answers||{}),...patch};target.status="in_progress";writeJSON(REQUESTS_KEY,list);}
      sessionStorage.removeItem(CORRECTION_KEY);
      const row=await secureLookup(meta.code,phoneLast4For(local));
      location.hash="#/seguimiento";
      if(row)setTimeout(()=>{updateLocalFromStatus(row);renderServerStatus(row,findLocalByCode(meta.code));},60);
    }catch(error){
      console.error("TramiPago secure correction:",error);
      if(errorBox){errorBox.textContent="No se pudo enviar la corrección. Intentá nuevamente.";errorBox.classList.add("visible");}
    }
  },true);

  document.addEventListener("click",event=>{
    const button=event.target.closest?.("[data-tracking-new-query]");
    if(!button)return;
    const phone=document.querySelector('[name="trackingPhoneLast4"]');
    if(phone){phone.value="";delete phone.dataset.userEdited;}
  });

  function enhance(){ensureTrackingVerificationField();}
  let queued=false;
  new MutationObserver(()=>{
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;enhance();});
  }).observe(document.body,{childList:true,subtree:true});
  enhance();
})();