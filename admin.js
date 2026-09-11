(async function(){
  "use strict";

  const PROJECT_URL="https://injimzsxbnawnekybfpm.supabase.co";
  const PUBLISHABLE_KEY="sb_publishable__bYVmN8G7g1fJG28C0SN0g_WbRJ23Ua";
  const SDK_URL="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.105.0/+esm";
  const STATUS_LABELS={
    awaiting_payment:"Pago pendiente",
    payment_review:"Pago en revisión",
    payment_confirmed:"Pago confirmado",
    in_progress:"En proceso",
    needs_info:"Falta información",
    finalized:"Finalizado"
  };
  const EDITABLE_STATUSES=["awaiting_payment","payment_review","in_progress","needs_info","finalized"];

  const loginPanel=document.getElementById("login-panel");
  const dashboard=document.getElementById("dashboard");
  const loginForm=document.getElementById("login-form");
  const loginMessage=document.getElementById("login-message");
  const dashboardMessage=document.getElementById("dashboard-message");
  const requestsNode=document.getElementById("requests");
  const countNode=document.getElementById("count");
  const sessionLabel=document.getElementById("session-label");
  const logoutButton=document.getElementById("logout");
  const refreshButton=document.getElementById("refresh");
  const searchInput=document.getElementById("search");
  const statusFilter=document.getElementById("status-filter");

  let supabase=null;
  let rows=[];
  let currentUser=null;

  function escapeHTML(value){
    return String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
      .replaceAll('"',"&quot;").replaceAll("'","&#039;");
  }

  function dateTime(value){
    if(!value)return "—";
    try{return new Intl.DateTimeFormat("es-AR",{dateStyle:"short",timeStyle:"short"}).format(new Date(value));}
    catch(_){return String(value);}
  }

  function money(value){
    if(value===null||value===undefined||value==="")return "—";
    return new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0}).format(Number(value));
  }

  function setMessage(node,text,type=""){
    node.textContent=text||"";
    node.className=`message${type?` ${type}`:""}`;
  }

  async function isAdmin(){
    const {data,error}=await supabase.from("admin_users").select("user_id").maybeSingle();
    if(error)throw error;
    return Boolean(data?.user_id);
  }

  async function showSession(session){
    currentUser=session?.user||null;
    if(!currentUser){
      loginPanel.hidden=false;
      dashboard.hidden=true;
      logoutButton.hidden=true;
      sessionLabel.textContent="";
      return;
    }

    let allowed=false;
    try{allowed=await isAdmin();}catch(error){console.error(error);}
    if(!allowed){
      await supabase.auth.signOut();
      setMessage(loginMessage,"La cuenta existe, pero todavía no está habilitada como administradora.","error");
      loginPanel.hidden=false;
      dashboard.hidden=true;
      logoutButton.hidden=true;
      return;
    }

    loginPanel.hidden=true;
    dashboard.hidden=false;
    logoutButton.hidden=false;
    sessionLabel.textContent=currentUser.email||"Administrador";
    await loadRequests();
  }

  async function loadRequests(){
    setMessage(dashboardMessage,"Cargando…");
    dashboard.classList.add("spinner");
    try{
      const {data,error}=await supabase
        .from("requests")
        .select("id,tracking_code,service_id,status,client_name,email,whatsapp,quoted_amount,status_note,estimated_completion_at,created_at,updated_at")
        .order("created_at",{ascending:false})
        .limit(300);
      if(error)throw error;
      rows=data||[];
      render();
      setMessage(dashboardMessage,"");
    }catch(error){
      console.error(error);
      setMessage(dashboardMessage,"No se pudieron cargar los trámites.","error");
    }finally{dashboard.classList.remove("spinner");}
  }

  function filteredRows(){
    const term=String(searchInput.value||"").trim().toLowerCase();
    const status=statusFilter.value;
    return rows.filter(row=>{
      if(status&&row.status!==status)return false;
      if(!term)return true;
      return [row.tracking_code,row.client_name,row.whatsapp,row.email,row.service_id]
        .some(value=>String(value||"").toLowerCase().includes(term));
    });
  }

  function statusOptions(current){
    const values=[...EDITABLE_STATUSES];
    if(current&&!values.includes(current))values.splice(2,0,current);
    return values.map(value=>`<option value="${escapeHTML(value)}" ${value===current?"selected":""}>${escapeHTML(STATUS_LABELS[value]||value)}</option>`).join("");
  }

  function card(row){
    return `
      <article class="card" data-request-id="${escapeHTML(row.id)}">
        <div class="card-head">
          <div><div class="code">${escapeHTML(row.tracking_code)}</div><div class="service">${escapeHTML(row.service_id)}</div></div>
          <span class="badge">${escapeHTML(STATUS_LABELS[row.status]||row.status)}</span>
        </div>
        <div class="meta">
          <div><strong>Cliente</strong>${escapeHTML(row.client_name||"—")}</div>
          <div><strong>WhatsApp</strong>${escapeHTML(row.whatsapp||"—")}</div>
          <div><strong>Importe</strong>${escapeHTML(money(row.quoted_amount))}</div>
          <div><strong>Actualizado</strong>${escapeHTML(dateTime(row.updated_at))}</div>
        </div>
        ${row.status_note?`<p class="muted"><strong>Observación:</strong> ${escapeHTML(row.status_note)}</p>`:""}
        <div class="card-actions"><button class="btn secondary" type="button" data-action="edit">Editar ficha</button></div>
        <form class="editor" hidden>
          <div class="grid">
            <div class="field"><label>Estado</label><select name="status">${statusOptions(row.status)}</select></div>
            <div class="field"><label>Fecha estimada</label><input name="estimated" type="datetime-local" value="${row.estimated_completion_at?escapeHTML(new Date(row.estimated_completion_at).toISOString().slice(0,16)):""}" /></div>
            <div class="field full"><label>Observación visible para el cliente</label><textarea name="note" maxlength="1000">${escapeHTML(row.status_note||"")}</textarea></div>
          </div>
          <div class="card-actions"><button class="btn success" type="submit">Guardar cambios</button><button class="btn secondary" type="button" data-action="close">Cancelar</button></div>
          <div class="message" role="status"></div>
        </form>
      </article>`;
  }

  function render(){
    const visible=filteredRows();
    countNode.textContent=`${visible.length} de ${rows.length} trámite${rows.length===1?"":"s"}`;
    requestsNode.innerHTML=visible.length?visible.map(card).join(""):'<div class="panel empty">No hay trámites para mostrar.</div>';
  }

  async function saveRow(form,requestId){
    const message=form.querySelector(".message");
    setMessage(message,"Guardando…");
    const status=form.elements.status.value;
    const note=String(form.elements.note.value||"").trim()||null;
    const estimatedRaw=form.elements.estimated.value;
    const estimated=estimatedRaw?new Date(estimatedRaw).toISOString():null;
    if(!EDITABLE_STATUSES.includes(status)){
      setMessage(message,"Ese estado no está habilitado para edición manual.","error");
      return;
    }
    const update={status,status_note:note,estimated_completion_at:estimated};
    const {data,error}=await supabase.from("requests").update(update).eq("id",requestId).select("id,tracking_code,service_id,status,client_name,email,whatsapp,quoted_amount,status_note,estimated_completion_at,created_at,updated_at").single();
    if(error){
      console.error(error);
      setMessage(message,"No se pudieron guardar los cambios.","error");
      return;
    }
    const index=rows.findIndex(row=>row.id===requestId);
    if(index>=0)rows[index]=data;
    render();
  }

  loginForm.addEventListener("submit",async event=>{
    event.preventDefault();
    setMessage(loginMessage,"Ingresando…");
    const email=String(loginForm.elements.email.value||"").trim();
    const password=loginForm.elements.password.value;
    const {data,error}=await supabase.auth.signInWithPassword({email,password});
    if(error){
      console.error(error);
      setMessage(loginMessage,"No se pudo iniciar sesión. Revisá correo y contraseña.","error");
      return;
    }
    setMessage(loginMessage,"");
    await showSession(data.session);
  });

  logoutButton.addEventListener("click",async()=>{await supabase.auth.signOut();await showSession(null);});
  refreshButton.addEventListener("click",loadRequests);
  searchInput.addEventListener("input",render);
  statusFilter.addEventListener("change",render);

  requestsNode.addEventListener("click",event=>{
    const button=event.target.closest("[data-action]");
    if(!button)return;
    const cardNode=button.closest(".card");
    const editor=cardNode?.querySelector(".editor");
    if(!editor)return;
    if(button.dataset.action==="edit")editor.hidden=false;
    if(button.dataset.action==="close")editor.hidden=true;
  });

  requestsNode.addEventListener("submit",async event=>{
    const form=event.target;
    if(!(form instanceof HTMLFormElement)||!form.classList.contains("editor"))return;
    event.preventDefault();
    const requestId=form.closest(".card")?.dataset.requestId;
    if(requestId)await saveRow(form,requestId);
  });

  try{
    const module=await import(SDK_URL);
    supabase=module.createClient(PROJECT_URL,PUBLISHABLE_KEY);
    const {data:{session}}=await supabase.auth.getSession();
    await showSession(session);
    supabase.auth.onAuthStateChange((_event,nextSession)=>{if(nextSession?.user?.id!==currentUser?.id)showSession(nextSession);});
  }catch(error){
    console.error(error);
    setMessage(loginMessage,"No se pudo conectar el panel con la base de datos.","error");
  }
})();
