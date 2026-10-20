"use strict";
(() => {
  const q = (s, r=document) => r.querySelector(s);
  // Admin does not load the shared public shell; keep its skip link keyboard-functional.
  const skipLink=q(".skip-link"), main=q("main");
  if(skipLink && main){
    main.setAttribute("tabindex","-1");
    skipLink.addEventListener("click",event=>{
      event.preventDefault();
      main.focus({preventScroll:true});
      if(location.hash!=="#contenido")history.pushState(null,"","#contenido");
      main.scrollIntoView({block:"start"});
    });
  }
  const loginSection=q("[data-admin-login]"), appSection=q("[data-admin-app]");
  const loginForm=q("[data-admin-login-form]"), totpForm=q("[data-admin-totp-form]");
  const enrollForm=q("[data-admin-enroll-form]"), enrollSecret=q("[data-admin-enroll-secret]");
  const enrollVerify=q("[data-admin-enroll-verify]"), secretNode=q("[data-admin-totp-secret]"), qrNode=q("[data-admin-totp-qr]");
  const message=q("[data-admin-message]"), roleNode=q("[data-admin-role]");
  const list=q("[data-admin-list]"), detail=q("[data-admin-detail]");
  const statusForm=q("[data-admin-status-form]"), filter=q("[data-admin-status-filter]");
  const logout=q("[data-admin-logout]");
  const rejectProof=q("[data-admin-reject-payment]");
  const resultForm=q("[data-admin-result-form]");
  const resultState=q("[data-admin-result-state]");
  const resultMessage=q("[data-admin-result-message]");
  const notificationList=q("[data-admin-notifications]");
  const monthlyBackup=q("[data-admin-monthly-backup]");
  const signupForm=q("[data-admin-signup-form]"), signupOpen=q("[data-admin-signup-open]");
  let selectedId=null, role=null;
  document.querySelectorAll("[data-password-toggle]").forEach(button=>button.addEventListener("click",()=>{
    const input=button.parentElement?.querySelector('input[type="password"],input[type="text"]');
    if(!input)return;
    const visible=input.type==="text";input.type=visible?"password":"text";
    button.textContent=visible?"Mostrar contraseña":"Ocultar contraseña";
    button.setAttribute("aria-label",button.textContent);button.setAttribute("aria-pressed",String(!visible));
  }));

  async function request(path, options={}) {
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),12000);
    let response;
    try {response=await fetch(path,{credentials:"same-origin",...options,signal:controller.signal,headers:{Accept:"application/json",...(options.body && !(options.body instanceof FormData)?{"Content-Type":"application/json"}:{}),...(options.headers||{})}})}
    catch(e){const err=new Error(e?.name==="AbortError"?"request_timeout":"network_error");err.code=err.message;err.status=0;throw err}
    finally{clearTimeout(timeout)}
    const raw=await response.text(); let data=null;
    if(raw){try{data=JSON.parse(raw)}catch{data={error:"invalid_response"}}}
    if(!response.ok){const e=new Error(data?.error||"request_failed");e.status=response.status;e.code=data?.code||data?.error;e.data=data;throw e}
    return data;
  }
  function msg(text,kind="info"){message.textContent=text;message.dataset.kind=kind;message.hidden=false}
  function showLogin(){loginSection.hidden=false;appSection.hidden=true;logout.hidden=true;loginForm.hidden=false;totpForm.hidden=true;enrollForm.hidden=true;enrollSecret.hidden=true;signupForm.hidden=true;signupOpen.parentElement.hidden=false}
  function showApp(session){loginSection.hidden=true;appSection.hidden=false;logout.hidden=false;role=session.admin.role;roleNode.textContent=role+" · MFA activo";monthlyBackup.hidden=role!=="owner";statusForm.hidden=true;rejectProof.hidden=true;resultForm.hidden=true}
  function showEnroll(){loginForm.hidden=true;totpForm.hidden=true;enrollForm.hidden=false;enrollSecret.hidden=true;msg("Esta cuenta debe activar MFA antes de acceder al panel.")}
  function esc(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
  function statusLabel(s){return ({draft:"Borrador",awaiting_payment:"Pago pendiente",payment_review:"Pago en revisión",payment_confirmed:"Pago confirmado",in_progress:"En proceso",needs_info:"Falta información",finalized:"Finalizado",cancelled:"Cancelado"})[s]||s}
  const allowedStatusChanges=Object.freeze({
    draft:["awaiting_payment","cancelled"],
    awaiting_payment:["payment_review","cancelled"],
    payment_review:["payment_confirmed","awaiting_payment","needs_info","cancelled"],
    payment_confirmed:["in_progress","needs_info","cancelled"],
    in_progress:["needs_info","finalized","cancelled"],
    needs_info:["payment_review","in_progress","cancelled"],
    finalized:[],cancelled:[],
  });
  function resetStatusChoices(current){
    const select=statusForm.elements.namedItem("status");
    if(!select)return false;
    const allowed=allowedStatusChanges[current]||[];
    statusForm.dataset.currentStatus=current;
    let prompt=select.querySelector('option[value=""]');
    if(!prompt){
      prompt=document.createElement("option");
      prompt.value="";prompt.textContent="Seleccioná un nuevo estado";prompt.disabled=true;
      select.prepend(prompt);
    }
    for(const option of select.options)if(option!==prompt)option.disabled=!allowed.includes(option.value);
    select.value="";
    prompt.selected=true;
    statusForm.elements.namedItem("note").value="";
    statusForm.elements.namedItem("missingFields").value="";
    return allowed.length>0;
  }

  async function session(){
    try{const s=await request("/v2/admin/session");showApp(s);message.hidden=true;await loadList()}
    catch(e){if(e.code==="mfa_enrollment_required"){showEnroll();return}showLogin();if(e.code==="forbidden"){const profile=await request("/v2/auth/get-session").catch(()=>null);const userId=String(profile?.user?.id||"");msg(userId?"Cuenta V2 autenticada pero sin permisos Admin. Copiá este ID de activación (no es una contraseña): "+userId:"Cuenta V2 sin permiso Admin: falta vincular el rol owner en MySQL TEST.","error")}else if(e.code==="request_timeout"||e.code==="network_error")msg("No se pudo consultar la sesión. Podés crear tu cuenta o iniciar sesión igualmente.","error");else message.hidden=true}
  }
  let listSequence=0;
  async function loadList(){
    const sequence=++listSequence;
    list.textContent="Cargando…";
    const suffix=filter.value?"?status="+encodeURIComponent(filter.value)+"&limit=50":"?limit=50";
    try{
      const data=await request("/v2/admin/requests"+suffix);
      if(sequence!==listSequence)return;
      list.replaceChildren();
      if(!data.requests?.length){list.textContent="Sin solicitudes.";return}
      for(const row of data.requests){
        const b=document.createElement("button");b.type="button";b.className="text-card";b.dataset.requestId=row.id;b.setAttribute("aria-pressed",String(selectedId===row.id));
        b.innerHTML="<strong>"+esc(row.tracking_code)+"</strong><span>"+esc(statusLabel(row.status))+" · "+esc(row.service_id)+"</span>";
        b.addEventListener("click",()=>loadDetail(row.id));list.append(b);
      }
    }catch{if(sequence===listSequence)list.textContent="No se pudo cargar el listado."}
  }
  async function loadDetail(id){
    selectedId=id;statusForm.hidden=true;rejectProof.hidden=true;resultForm.hidden=true;
    list.querySelectorAll(".text-card").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.requestId===id)));detail.textContent="Cargando…";
    try{
      const data=await request("/v2/admin/requests/"+encodeURIComponent(id));
      if(selectedId!==id)return; // Ignore outdated response after switching requests.
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
      statusForm.hidden=role==="viewer" || !resetStatusChoices(r.status);
      rejectProof.hidden=role==="viewer" || r.status!=="payment_review";
      resultForm.hidden=role==="viewer";
      if(role!=="viewer"){
        const uploadButton=q('button[type="submit"]',resultForm);
        try{
          const health=await request("/v2/health/dependencies");
          if(selectedId!==id)return;
          const ready=health?.dependencies?.b2==="configured";
          uploadButton.disabled=!ready;
          q('input[name="file"]',resultForm).disabled=!ready;
          resultState.textContent=ready
            ?"B2 privado disponible. El archivo quedará asociado como resultado de esta solicitud."
            :"Backblaze B2 todavía no está configurado; la entrega permanece bloqueada de forma segura.";
        }catch{
          uploadButton.disabled=true;
          q('input[name="file"]',resultForm).disabled=true;
          resultState.textContent="No se pudo verificar el almacenamiento privado.";
        }
      }
    }catch{if(selectedId!==id)return;detail.textContent="No se pudo cargar el detalle.";statusForm.hidden=true;rejectProof.hidden=true;resultForm.hidden=true}
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

  signupOpen.addEventListener("click",()=>{loginForm.hidden=true;signupOpen.parentElement.hidden=true;signupForm.hidden=false;message.hidden=true});
  q("[data-admin-signup-cancel]").addEventListener("click",()=>{signupForm.hidden=true;loginForm.hidden=false;signupOpen.parentElement.hidden=false;signupForm.reset()});
  signupForm.addEventListener("submit",async e=>{
    e.preventDefault();const fd=new FormData(signupForm);const button=q('button[type="submit"]',signupForm);button.disabled=true;
    try {
      const created=await request("/v2/auth/sign-up/email",{method:"POST",body:JSON.stringify({email:String(fd.get("email")||"").trim().toLowerCase(),name:String(fd.get("name")||"").trim(),password:String(fd.get("password")||"")})});
      signupForm.reset();signupForm.hidden=true;signupOpen.parentElement.hidden=false;loginForm.hidden=false;
      const id=String(created?.user?.id||"");
      msg(id?"Cuenta V2 creada. Copiá este ID de activación y envialo para habilitar el rol owner: "+id+". No compartas contraseña ni códigos MFA.":"Cuenta V2 creada. Falta habilitar el rol owner antes de entrar al panel.","success");
    }catch(error){const code=String(error.code||"request_failed").replace(/[^a-zA-Z0-9_-]/g,"").slice(0,64);msg(error.code==="request_timeout"||error.code==="network_error"?"La solicitud de registro no obtuvo respuesta. No la repitas: comprobá primero si la cuenta se creó en MySQL.":"No se pudo registrar la cuenta ("+error.status+" · "+code+").","error")}
    finally{button.disabled=false}
  });
  loginForm.addEventListener("submit",async e=>{
    e.preventDefault(); const fd=new FormData(loginForm); msg("Verificando…");
    try{
      const data=await request("/v2/auth/sign-in/email",{method:"POST",body:JSON.stringify({email:String(fd.get("email")||"").trim(),password:String(fd.get("password")||"")})});
      loginForm.reset();
      if(data?.twoFactorRedirect){loginForm.hidden=true;totpForm.hidden=false;msg("Ingresá el código de tu autenticador.");return}
      await session();
    }catch(e){const code=String(e.code||"request_failed").replace(/[^a-zA-Z0-9_-]/g,"").slice(0,64);msg(e.status===401 && String(fd.get("email")||"").trim().toLowerCase()==="tramipago@gmail.com"?"Owner V2: correo o contraseña incorrectos. La cuenta ya existe. No crees otra cuenta ni desactives MFA. Para recuperar la clave usá el procedimiento privado de V2 con tu usuario GitHub, sin compartir contraseñas ni códigos.":"Error al iniciar sesión ("+e.status+" · "+code+").","error")}
  });
  totpForm.addEventListener("submit",async e=>{
    e.preventDefault(); const fd=new FormData(totpForm); msg("Verificando MFA…");
    try{await request("/v2/auth/two-factor/verify-totp",{method:"POST",body:JSON.stringify({code:String(fd.get("code")||"").trim(),trustDevice:false})});totpForm.reset();await session()}
    catch(e){if(e.status===401||e.status===403)showLogin();msg(e.status===401?"Sesión vencida. Volvé a ingresar correo y contraseña.":e.status===429?"Demasiados intentos. Esperá antes de reintentar.":e.status===403?"La verificación MFA no está disponible para esta sesión. Volvé a iniciar sesión.":"No se pudo verificar el MFA. Revisá el código de V2 y la etapa de inicio de sesión.","error")}
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
      qrNode.replaceChildren();
      if(typeof QRCode==="undefined")throw new Error("qr_library_missing");
      new QRCode(qrNode,{text:data.totpURI,width:220,height:220,colorDark:"#06164d",colorLight:"#ffffff",correctLevel:QRCode.CorrectLevel.M});
      enrollForm.hidden=true;enrollSecret.hidden=false;msg("Escaneá el QR con Google Authenticator (cuenta TramiPago V2) y confirmá su código de 6 dígitos.","success");
    }catch{msg("No se pudo iniciar la activación de MFA.","error")}
  });
  enrollVerify.addEventListener("submit",async e=>{
    e.preventDefault();const fd=new FormData(enrollVerify);msg("Confirmando MFA…");
    try{
      await request("/v2/auth/two-factor/verify-totp",{method:"POST",body:JSON.stringify({code:String(fd.get("code")||"").trim(),trustDevice:false})});
      secretNode.textContent="";qrNode.replaceChildren();enrollSecret.hidden=true;enrollVerify.reset();await session();
    }catch{msg("Código inválido. Revisá el autenticador e intentá nuevamente.","error")}
  });
  resultForm.addEventListener("submit",async e=>{
    e.preventDefault(); if(!selectedId)return;
    const file=new FormData(resultForm).get("file");
    if(!(file instanceof File))return;
    const ext=(file.name.toLowerCase().match(/\.[a-z0-9]+$/)||[])[0]||"";
    const mime={".pdf":"application/pdf",".jpg":"image/jpeg",".jpeg":"image/jpeg",".png":"image/png"}[ext];
    if(!file.size||file.size>10*1024*1024||!mime||mime!==file.type){
      resultMessage.textContent="Archivo inválido: PDF, JPG o PNG de hasta 10 MB.";
      resultMessage.dataset.kind="error";resultMessage.hidden=false;
      return;
    }
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
    const target=String(fd.get("status")||"");
    if(!allowedStatusChanges[statusForm.dataset.currentStatus||""]?.includes(target)){
      msg("Seleccioná un cambio de estado permitido.","error");return;
    }
    if(target==="needs_info"&&!missing.length){msg("Indicá los campos faltantes para solicitar la corrección.","error");return}
    try{
      const data=await request("/v2/admin/requests/"+encodeURIComponent(selectedId)+"/status",{method:"PATCH",body:JSON.stringify({status:fd.get("status"),note:String(fd.get("note")||"").trim()||undefined,missingFields:missing})});
      await loadDetail(selectedId);await loadList();
      msg("Estado actualizado: "+statusLabel(data.status),"success");
    }catch(e){msg(e.message==="invalid_transition"?"Transición de estado no permitida.":"No se pudo actualizar el estado.","error")}
  });
  rejectProof.addEventListener("click",async()=>{
    if(!selectedId || rejectProof.hidden) return;
    const note=String(statusForm.elements.namedItem("note")?.value||"").trim();
    if(!note){
      msg("Para rechazar el comprobante, escribí el motivo en Observación.","error");
      statusForm.elements.namedItem("note")?.focus();
      return;
    }
    rejectProof.disabled=true;
    try{
      const data=await request("/v2/admin/requests/"+encodeURIComponent(selectedId)+"/status",{
        method:"PATCH",body:JSON.stringify({status:"awaiting_payment",note}),
      });
      msg("Comprobante rechazado. El cliente puede subir uno nuevo con el mismo código.","success");
      await loadDetail(selectedId);await loadList();
    }catch{
      msg("No se pudo rechazar el comprobante. Comprobá el estado e intentá nuevamente.","error");
    }finally{rejectProof.disabled=false}
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