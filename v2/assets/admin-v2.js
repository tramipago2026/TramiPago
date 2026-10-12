"use strict";
(() => {
  const q = (s, r=document) => r.querySelector(s);
  const loginSection=q("[data-admin-login]"), appSection=q("[data-admin-app]");
  const loginForm=q("[data-admin-login-form]"), totpForm=q("[data-admin-totp-form]");
  const message=q("[data-admin-message]"), roleNode=q("[data-admin-role]");
  const list=q("[data-admin-list]"), detail=q("[data-admin-detail]");
  const statusForm=q("[data-admin-status-form]"), filter=q("[data-admin-status-filter]");
  const logout=q("[data-admin-logout]");
  let selectedId=null, role=null;

  async function request(path, options={}) {
    const response=await fetch(path,{credentials:"same-origin",...options,headers:{Accept:"application/json",...(options.body?{"Content-Type":"application/json"}:{}),...(options.headers||{})}});
    const raw=await response.text(); let data=null;
    if(raw){try{data=JSON.parse(raw)}catch{data={error:"invalid_response"}}}
    if(!response.ok){const e=new Error(data?.error||"request_failed");e.status=response.status;throw e}
    return data;
  }
  function msg(text,kind="info"){message.textContent=text;message.dataset.kind=kind;message.hidden=false}
  function showLogin(){loginSection.hidden=false;appSection.hidden=true;logout.hidden=true}
  function showApp(session){loginSection.hidden=true;appSection.hidden=false;logout.hidden=false;role=session.admin.role;roleNode.textContent=role+" · MFA activo";statusForm.hidden=role==="viewer"}
  function esc(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}

  async function session(){
    try{const s=await request("/v2/admin/session");showApp(s);await loadList()}
    catch{showLogin()}
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
        b.innerHTML="<strong>"+esc(row.tracking_code)+"</strong><span>"+esc(row.status)+" · "+esc(row.service_id)+"</span>";
        b.addEventListener("click",()=>loadDetail(row.id));list.append(b);
      }
    }catch{list.textContent="No se pudo cargar el listado."}
  }
  async function loadDetail(id){
    selectedId=id; detail.textContent="Cargando…";
    try{
      const data=await request("/v2/admin/requests/"+encodeURIComponent(id));
      const r=data.request||{};
      detail.innerHTML="<p><strong>"+esc(r.tracking_code)+"</strong></p><p>Servicio: "+esc(r.service_id)+"</p><p>Estado: "+esc(r.status)+"</p><p>Cliente: "+esc(r.client_name||"—")+"</p><p>WhatsApp: "+esc(r.whatsapp||"—")+"</p><p>Email: "+esc(r.email||"—")+"</p><p>Eventos: "+esc(data.events?.length||0)+" · Archivos: "+esc(data.files?.length||0)+"</p>";
      statusForm.hidden=role==="viewer";
    }catch{detail.textContent="No se pudo cargar el detalle.";statusForm.hidden=true}
  }

  loginForm.addEventListener("submit",async e=>{
    e.preventDefault(); const fd=new FormData(loginForm); msg("Verificando…");
    try{
      const data=await request("/v2/auth/sign-in/email",{method:"POST",body:JSON.stringify({email:String(fd.get("email")||"").trim(),password:String(fd.get("password")||"")})});
      if(data?.twoFactorRedirect){loginForm.hidden=true;totpForm.hidden=false;msg("Ingresá el código de tu autenticador.");return}
      await session();
    }catch{msg("No se pudo iniciar sesión.","error")}
  });
  totpForm.addEventListener("submit",async e=>{
    e.preventDefault(); const fd=new FormData(totpForm); msg("Verificando MFA…");
    try{await request("/v2/auth/two-factor/verify-totp",{method:"POST",body:JSON.stringify({code:String(fd.get("code")||"").trim(),trustDevice:false})});await session()}
    catch{msg("Código MFA inválido o vencido.","error")}
  });
  statusForm.addEventListener("submit",async e=>{
    e.preventDefault(); if(!selectedId)return;
    const fd=new FormData(statusForm);
    const missing=String(fd.get("missingFields")||"").split(",").map(x=>x.trim()).filter(Boolean);
    try{
      const data=await request("/v2/admin/requests/"+encodeURIComponent(selectedId)+"/status",{method:"PATCH",body:JSON.stringify({status:fd.get("status"),note:String(fd.get("note")||"").trim()||undefined,missingFields:missing})});
      msg("Estado actualizado: "+data.status,"success");await loadDetail(selectedId);await loadList();
    }catch(e){msg(e.message==="invalid_transition"?"Transición de estado no permitida.":"No se pudo actualizar el estado.","error")}
  });
  q("[data-admin-refresh]").addEventListener("click",loadList);
  filter.addEventListener("change",loadList);
  logout.addEventListener("click",async()=>{try{await request("/v2/auth/sign-out",{method:"POST",body:"{}"})}catch{}location.reload()});
  session();
})();