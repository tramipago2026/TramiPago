"use strict";
(() => {
  const q = (s, r=document) => r.querySelector(s);
  const loginSection=q("[data-admin-login]"), appSection=q("[data-admin-app]");
  const loginForm=q("[data-admin-login-form]"), totpForm=q("[data-admin-totp-form]");
  const enrollForm=q("[data-admin-enroll-form]"), enrollSecret=q("[data-admin-enroll-secret]");
  const enrollVerify=q("[data-admin-enroll-verify]"), secretNode=q("[data-admin-totp-secret]");
  const message=q("[data-admin-message]"), roleNode=q("[data-admin-role]");
  const list=q("[data-admin-list]"), detail=q("[data-admin-detail]");
  const statusForm=q("[data-admin-status-form]"), filter=q("[data-admin-status-filter]");
  const logout=q("[data-admin-logout]");
  const resultForm=q("[data-admin-result-form]");
  const resultState=q("[data-admin-result-state]");
  const resultMessage=q("[data-admin-result-message]");
  const notificationList=q("[data-admin-notifications]");
  let selectedId=null, role=null;

  async function request(path, options={}) {
    const response=await fetch(path,{credentials:"same-origin",...options,headers:{Accept:"application/json",...(options.body && !(options.body instanceof FormData)?{"Content-Type":"application/json"}:{}),...(options.headers||{})}});
    const raw=await response.text(); let data=null;
    if(raw){try{data=JSON.parse(raw)}catch{data={error:"invalid_response"}}}
    if(!response.ok){const e=new Error(data?.error||"request_failed");e.status=response.status;e.code=data?.code||data?.error;e.data=data;throw e}
    return data;
  }
  function msg(text,kind="info"){message.textContent=text;message.dataset.kind=kind;message.hidden=false}
  function showLogin(){loginSection.hidden=false;appSection.hidden=true;logout.hidden=true}
  function showApp(session){loginSection.hidden=true;appSection.hidden=false;logout.hidden=false;role=session.admin.role;roleNode.textContent=role+" · MFA activo";statusForm.hidden=role==="viewer"}
  function showEnroll(){loginForm.hidden=true;totpForm.hidden=true;enrollForm.hidden=false;enrollSecret.hidden=true;msg("Esta cuenta debe activar MFA antes de acceder al panel.")}
  function esc(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
  function statusLabel(s){return ({draft:"Borrador",awaiting_payment:"Pago pendiente",payment_review:"Pago en revisión",payment_confirmed:"Pago confirmado",in_progress:"En proceso",needs_info:"Falta información",finalized:"Finalizado",cancelled:"Cancelado"})[s]||s}

  async function session(){
    try{const s=await request("/v2/admin/session");showApp(s);await loadList()}
    catch(e){if(e.code==="mfa_enrollment_required"){showEnroll();return}showLogin()}
  }
  async function loadList(){
    list.textContent="Cargando…";
    const suffix=filter.value?"?status="+encodeURIComponent(filter.value)+"&limit=50":"?limit=50";
    try{
      const data=await request("/v2/admin/requests"+suffix);
      list.replaceChildren();
      if(!data.requests?.length){list.textContent="Sin solicitudes.";return}
      for(const row of data.requests){
        const b=document.createElement("button");b.type="button";b.className="text-card";
        b.innerHTML="<strong>"+esc(row.tracking_code)+"</strong><span>"+esc(statusLabel(row.status))+" · "+esc(row.service_id)+"</span>";
        b.addEventListener("click",()=>loadDetail(row.id));list.append(b);
      }
    }catch{list.textContent="No se pudo cargar el listado."}
  }
  async function loadDetail(id){
    selectedId=id; detail.textContent="Cargando…";
    try{
      const data=await request("/v2/admin/requests/"+encodeURIComponent(id));
      const r=data.request||{};
      const wrap=document.createElement("div");
      wrap.innerHTML="<p><strong>"+esc(r.tracking_code)+"</strong></p><p>Servicio: "+esc(r.service_id)+"</p><p>Estado: "+esc(statusLabel(r.status))+"</p><p>Cliente: "+esc(r.client_name||"—")+"</p><p>WhatsApp: "+esc(r.whatsapp||"—")+"</p><p>Email: "+esc(r.email||"—")+"</p>";
      const files=document.createElement("div");
      files.innerHTML="<h3>Documentos</h3>";
      if(!data.files?.length){const p=document.createElement("p");p.className="muted";p.textContent="Sin archivos.";files.append(p)}
      for(const file of data.files||[]){
        const a=document.createElement("a");
        a.href="/v2/admin/files/"+encodeURIComponent(file.id)+"/download";
        a.target="_blank";a.rel="noopener";a.textContent=(file.kind||"archivo")+" · "+(file.original_name||file.id);
        const p=document.createElement("p");p.append(a);files.append(p);
      }
      const events=document.createElement("div");
      events.innerHTML="<h3>Historial</h3>";
      const ul=document.createElement("ul");
      for(const ev of data.events||[]){
        const li=document.createElement("li");
        li.textContent=(ev.status?statusLabel(ev.status)+" · ":"")+(ev.event_type||"evento")+(ev.note?" · "+ev.note:"");
        ul.append(li);
      }
      if(!ul.children.length){const li=document.createElement("li");li.textContent="Sin eventos.";ul.append(li)}
      events.append(ul);
      wrap.append(files,events);detail.replaceChildren(wrap);
      statusForm.hidden=role==="viewer";
      resultForm.hidden=role==="viewer";
      if(role!=="viewer"){
        const uploadButton=q('button[type="submit"]',resultForm);
        try{
          const health=await request("/v2/health/dependencies");
          const ready=health?.dependencies?.b2==="configured";
          uploadButton.disabled=!ready;
          resultState.textContent=ready
            ?"B2 privado disponible. El archivo quedará asociado como resultado de esta solicitud."
            :"Backblaze B2 todavía no está configurado; la entrega permanece bloqueada de forma segura.";
        }catch{
          uploadButton.disabled=true;
          resultState.textContent="No se pudo verificar el almacenamiento privado.";
        }
      }
    }catch{detail.textContent="No se pudo cargar el detalle.";statusForm.hidden=true;resultForm.hidden=true}
  }
  async function loadNotifications(){
    notificationList.textContent="Cargando…";
    try{
      const data=await request("/v2/admin/notifications");
      notificationList.replaceChildren();
      if(!data.notifications?.length){notificationList.textContent="Sin notificaciones.";return}
      const ul=document.createElement("ul");
      for(const n of data.notifications){
        const li=document.createElement("li");
        li.textContent=(n.template||"email")+" · "+(n.status||"")+(n.attempts?" · intentos "+n.attempts:"");
        ul.append(li);
      }
      notificationList.append(ul);
    }catch{notificationList.textContent="No se pudo cargar la cola."}
  }

  loginForm.addEventListener("submit",async e=>{
    e.preventDefault(); const fd=new FormData(loginForm); msg("Verificando…");
    try{
      const data=await request("/v2/auth/sign-in/email",{method:"POST",body:JSON.stringify({email:String(fd.get("email")||"").trim(),password:String(fd.get("password")||"")})});
      loginForm.reset();
      if(data?.twoFactorRedirect){loginForm.hidden=true;totpForm.hidden=false;msg("Ingresá el código de tu autenticador.");return}
      await session();
    }catch{msg("No se pudo iniciar sesión.","error")}
  });
  totpForm.addEventListener("submit",async e=>{
    e.preventDefault(); const fd=new FormData(totpForm); msg("Verificando MFA…");
    try{await request("/v2/auth/two-factor/verify-totp",{method:"POST",body:JSON.stringify({code:String(fd.get("code")||"").trim(),trustDevice:false})});totpForm.reset();await session()}
    catch{msg("Código MFA inválido o vencido.","error")}
  });
  enrollForm.addEventListener("submit",async e=>{
    e.preventDefault(); const fd=new FormData(enrollForm); msg("Generando configuración MFA…");
    try{
      const data=await request("/v2/auth/two-factor/enable",{method:"POST",body:JSON.stringify({password:String(fd.get("password")||""),method:"totp",issuer:"TramiPago"})});
      enrollForm.reset();
      const uri=new URL(data.totpURI);
      const secret=uri.searchParams.get("secret");
      if(!secret) throw new Error("missing_totp_secret");
      secretNode.textContent=secret;
      enrollForm.hidden=true;enrollSecret.hidden=false;msg("Configuración generada. Agregá la clave en tu autenticador y confirmá un código.","success");
    }catch{msg("No se pudo iniciar la activación de MFA.","error")}
  });
  enrollVerify.addEventListener("submit",async e=>{
    e.preventDefault();const fd=new FormData(enrollVerify);msg("Confirmando MFA…");
    try{
      await request("/v2/auth/two-factor/verify-totp",{method:"POST",body:JSON.stringify({code:String(fd.get("code")||"").trim(),trustDevice:false})});
      secretNode.textContent="";enrollSecret.hidden=true;enrollVerify.reset();await session();
    }catch{msg("Código inválido. Revisá el autenticador e intentá nuevamente.","error")}
  });
  resultForm.addEventListener("submit",async e=>{
    e.preventDefault(); if(!selectedId)return;
    const file=new FormData(resultForm).get("file");
    if(!(file instanceof File))return;
    const body=new FormData();body.set("file",file);
    const button=q('button[type="submit"]',resultForm);button.disabled=true;
    try{
      const uploaded=await request("/v2/admin/requests/"+encodeURIComponent(selectedId)+"/result",{
        method:"POST",
        headers:{"Idempotency-Key":"admin-result-"+selectedId+"-"+Date.now()},
        body,
      });
      msg("Resultado privado cargado.","success");
      resultMessage.textContent="Archivo registrado: "+uploaded.fileId;
      resultMessage.dataset.kind="success";resultMessage.hidden=false;
      resultForm.reset();await loadDetail(selectedId);
    }catch(e){
      resultMessage.textContent=e.status===503
        ?"B2 todavía no está disponible en STAGING."
        :"No se pudo cargar el resultado.";
      resultMessage.dataset.kind="error";resultMessage.hidden=false;
    }finally{
      const health=await request("/v2/health/dependencies").catch(()=>null);
      button.disabled=health?.dependencies?.b2!=="configured";
    }
  });

  statusForm.addEventListener("submit",async e=>{
    e.preventDefault(); if(!selectedId)return;
    const fd=new FormData(statusForm);
    const missing=String(fd.get("missingFields")||"").split(",").map(x=>x.trim()).filter(Boolean);
    try{
      const data=await request("/v2/admin/requests/"+encodeURIComponent(selectedId)+"/status",{method:"PATCH",body:JSON.stringify({status:fd.get("status"),note:String(fd.get("note")||"").trim()||undefined,missingFields:missing})});
      msg("Estado actualizado: "+statusLabel(data.status),"success");await loadDetail(selectedId);await loadList();
    }catch(e){msg(e.message==="invalid_transition"?"Transición de estado no permitida.":"No se pudo actualizar el estado.","error")}
  });
  q("[data-admin-refresh]").addEventListener("click",loadList);
  q("[data-admin-load-notifications]").addEventListener("click",loadNotifications);
  q("[data-admin-process-notifications]").addEventListener("click",async()=>{
    try{
      const data=await request("/v2/admin/notifications/process",{method:"POST",body:"{}"});
      msg("Notificaciones procesadas: "+data.processed+" · enviadas: "+data.sent+" · fallidas: "+data.failed,"success");await loadNotifications();
    }catch(e){msg(e.status===503?"Resend V2 todavía no está configurado. La cola permanece guardada.":"No se pudo procesar la cola.","error")}
  });
  filter.addEventListener("change",loadList);
  logout.addEventListener("click",async()=>{try{await request("/v2/auth/sign-out",{method:"POST",body:"{}"})}catch{}location.reload()});
  session();
})();