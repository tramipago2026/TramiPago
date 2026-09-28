(function(){
  "use strict";
  const REQUESTS_KEY="tramipago_requests_v1";
  const ACTIVE_REQUEST_KEY="tramipago_active_request_v1";
  const TOKENS_KEY="tramipago_request_tokens_v1";
  const TOKEN_DB_NAME="tramipago_private_tokens_v1";
  const TOKEN_DB_STORE="tokens";
  const PROJECT_URL="https://injimzsxbnawnekybfpm.supabase.co";
  const PUBLISHABLE_KEY="sb_publishable__bYVmN8G7g1fJG28C0SN0g_WbRJ23Ua";

  function read(storage,key,fallback){
    try{const raw=storage.getItem(key);return raw?JSON.parse(raw):fallback;}catch(_){return fallback;}
  }

  function activeRequest(){
    const ref=read(localStorage,ACTIVE_REQUEST_KEY,null);
    if(!ref?.id)return null;
    const requests=read(localStorage,REQUESTS_KEY,[]);
    return requests.find(item=>item.id===ref.id)||null;
  }

  function openDb(){
    return new Promise((resolve,reject)=>{
      if(!window.indexedDB)return reject(new Error("IndexedDB no disponible"));
      const req=indexedDB.open(TOKEN_DB_NAME,1);
      req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(TOKEN_DB_STORE))req.result.createObjectStore(TOKEN_DB_STORE);};
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error);
    });
  }

  async function tokenMeta(requestId){
    const session=read(sessionStorage,TOKENS_KEY,{});
    if(session?.[requestId])return session[requestId];
    try{
      const db=await openDb();
      const map=await new Promise((resolve,reject)=>{
        const tx=db.transaction(TOKEN_DB_STORE,"readonly");
        const req=tx.objectStore(TOKEN_DB_STORE).get("active");
        req.onsuccess=()=>resolve(req.result||{});
        req.onerror=()=>reject(req.error);
      });
      db.close();
      return map?.[requestId]||null;
    }catch(_){return null;}
  }

  async function registerHelp(request,step){
    if(!request?.code)return;
    const meta=await tokenMeta(request.id);
    if(!meta?.raw)return;
    const helpContext={
      source:"whatsapp",
      step:String(step||request.currentStep||location.pathname).slice(0,80),
      route:String(location.pathname+location.hash).slice(0,160),
      serviceId:request.serviceId||null,
      requestedAt:new Date().toISOString()
    };
    try{
      await fetch(PROJECT_URL+"/functions/v1/request-help",{
        method:"POST",
        headers:{apikey:PUBLISHABLE_KEY,"Content-Type":"application/json"},
        body:JSON.stringify({code:request.code,requestToken:meta.raw,currentStep:helpContext.step,helpContext})
      });
    }catch(_){}
  }

  function addContext(message,request,step){
    if(!request?.code||/\bCódigo(?: de trámite)?:/i.test(message))return message;
    return message.trim()+" Código: "+request.code+". Etapa: "+String(step||request.currentStep||"sitio")+".";
  }

  async function prepare(message,step){
    const request=activeRequest();
    if(request?.code)await registerHelp(request,step);
    return addContext(message,request,step);
  }

  window.TRAMIPAGO_WHATSAPP_CONTEXT={activeRequest,prepare};

  document.addEventListener("DOMContentLoaded",()=>{
    const request=activeRequest();
    const codeInput=document.querySelector('#codigo,input[name="codigo"]');
    if(request?.code&&codeInput&&!String(codeInput.value||"").trim())codeInput.value=request.code;
  });

  document.addEventListener("click",async event=>{
    const link=event.target.closest?.('a[href*="wa.me/"]');
    if(!link||link.dataset.noContext==="true")return;
    const request=activeRequest();
    if(!request?.code)return;
    event.preventDefault();
    try{
      const url=new URL(link.href);
      const original=url.searchParams.get("text")||"Hola, necesito ayuda con TramiPago.";
      const step=link.dataset.helpStep||document.body.dataset.page||location.pathname.replace(/^\//,"")||"sitio";
      url.searchParams.set("text",await prepare(original,step));
      window.open(url.toString(),link.target||"_blank","noopener");
    }catch(_){window.open(link.href,link.target||"_blank","noopener");}
  },true);
})();