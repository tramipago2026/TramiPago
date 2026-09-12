(async function(){
  "use strict";

  const PROJECT_URL="https://injimzsxbnawnekybfpm.supabase.co";
  const PUBLISHABLE_KEY="sb_publishable__bYVmN8G7g1fJG28C0SN0g_WbRJ23Ua";
  const SDK_URL="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.105.0/+esm";
  const STORAGE_BUCKET="request-files";
  const STATUS_LABELS={
    awaiting_payment:"Pago pendiente",
    payment_review:"Pago en revisión",
    payment_confirmed:"Pago confirmado",
    in_progress:"En proceso",
    needs_info:"Falta información",
    finalized:"Finalizado"
  };
  const EDITABLE_STATUSES=["awaiting_payment","payment_review","in_progress","needs_info","finalized"];
  const FILE_KIND_LABELS={payment_receipt:"Comprobante de pago",dni:"Documento / DNI",supporting_document:"Documento adjunto"};
  const FALLBACK_LABELS={
    fullName:"Nombre y apellido",name:"Nombre",email:"Correo electrónico",emailConfirm:"Confirmación de correo",whatsapp:"WhatsApp",
    cuil:"CUIL",cuit:"CUIT",dni:"DNI",dniTransaction:"Número de trámite del DNI",birthDate:"Fecha de nacimiento",
    address:"Domicilio",locality:"Localidad",district:"Partido / departamento",modality:"Modalidad",serviceOption:"Opción del servicio",
    patent:"Dominio / patente",vehicleType:"Tipo de vehículo",propertyDistrict:"Partido",propertyNumber:"Partida",
    authorization:"Autorización del cliente",serviceFeeAcceptance:"Aceptación del servicio de gestión"
  };

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

  function fileSize(value){
    const n=Number(value);
    if(!Number.isFinite(n)||n<=0)return "—";
    if(n<1024)return `${n} B`;
    if(n<1024*1024)return `${(n/1024).toFixed(1)} KB`;
    return `${(n/(1024*1024)).toFixed(1)} MB`;
  }

  function setMessage(node,text,type=""){
    node.textContent=text||"";
    node.className=`message${type?` ${type}`:""}`;
  }

  function serviceConfig(serviceId){
    return (window.TRAMI_SERVICES||[]).find(service=>service.id===serviceId)||null;
  }

  function fieldConfig(row,key){
    return serviceConfig(row.service_id)?.fields?.find(field=>field.id===key)||null;
  }

  function humanizeKey(key){
    if(FALLBACK_LABELS[key])return FALLBACK_LABELS[key];
    const text=String(key||"").replace(/([a-záéíóúñ])([A-Z])/g,"$1 $2").replace(/[_-]+/g," ").trim();
    return text?text.charAt(0).toUpperCase()+text.slice(1):"Dato";
  }

  function valueLabel(row,key,value){
    const field=fieldConfig(row,key);
    if(typeof value==="boolean")return value?"Sí":"No";
    if(value===null||value===undefined||value==="")return "—";
    if(Array.isArray(value))return value.map(item=>valueLabel(row,key,item)).join(", ");
    if(typeof value==="object"){
      if(value.name||value.storagePath){
        const parts=[value.name||"Archivo"];
        if(value.type)parts.push(value.type);
        if(value.size)parts.push(fileSize(value.size));
        return parts.join(" · ");
      }
      return JSON.stringify(value);
    }
    const option=field?.options?.find(item=>String(item.value)===String(value));
    return option?.label||String(value);
  }

  function payloadFor(row){
    const rd=Array.isArray(row.request_data)?row.request_data[0]:row.request_data;
    return rd?.payload&&typeof rd.payload==="object"?rd.payload:{};
  }

  function filesFor(row){
    return Array.isArray(row.request_files)?[...row.request_files].sort((a,b)=>new Date(a.created_at)-new Date(b.created_at)):[];
  }

  function eventsFor(row){
    return Array.isArray(row.request_events)?[...row.request_events].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)):[];
  }

  function serviceName(row){
    const related=Array.isArray(row.services)?row.services[0]:row.services;
    return related?.name||serviceConfig(row.service_id)?.name||row.service_id;
  }

  function payloadGrid(row){
    const payload=payloadFor(row);
    const entries=Object.entries(payload);
    if(!entries.length)return '<p class="muted">No hay datos adicionales del formulario.</p>';
    return `<div class="record-grid">${entries.map(([key,value])=>{
      const field=fieldConfig(row,key);
      const label=field?.label||humanizeKey(key);
      return `<div class="record-item"><strong>${escapeHTML(label)}</strong><span>${escapeHTML(valueLabel(row,key,value))}</span><small>${escapeHTML(key)}</small></div>`;
    }).join("")}</div>`;
  }

  function fileList(row){
    const files=filesFor(row);
    if(!files.length)return '<p class="muted">No hay archivos adjuntos registrados.</p>';
    return `<div class="file-list">${files.map(file=>`
      <div class="file-row">
        <div><strong>${escapeHTML(FILE_KIND_LABELS[file.kind]||file.kind)}</strong><span>${escapeHTML(file.original_name||"Archivo")}</span><small>${escapeHTML(file.mime_type||"Tipo no informado")} · ${escapeHTML(fileSize(file.size_bytes))} · ${escapeHTML(dateTime(file.created_at))}</small></div>
        <button class="btn secondary" type="button" data-action="open-file" data-path="${escapeHTML(file.storage_path)}">Abrir archivo</button>
      </div>`).join("")}</div>`;
  }

  function eventList(row){
    const events=eventsFor(row);
    if(!events.length)return '<p class="muted">Todavía no hay movimientos registrados.</p>';
    return `<div class="history">${events.map(event=>`
      <div class="history-row"><strong>${escapeHTML(STATUS_LABELS[event.status]||event.event_type||"Movimiento")}</strong><span>${escapeHTML(dateTime(event.created_at))}</span>${event.note?`<p>${escapeHTML(event.note)}</p>`:""}</div>`).join("")}</div>`;
  }

  function internalData(row){
    const items=[
      ["ID interno",row.id],["Código",row.tracking_code],["Servicio",serviceName(row)],["ID del servicio",row.service_id],
      ["Estado",STATUS_LABELS[row.status]||row.status],["Cliente",row.client_name],["Correo",row.email],["WhatsApp",row.whatsapp],
      ["Importe",money(row.quoted_amount)],["Referencia cliente",row.client_ref],["Formulario completado",dateTime(row.form_completed_at)],
      ["Comprobante cargado",dateTime(row.receipt_uploaded_at)],["Pago confirmado",dateTime(row.paid_at)],["Inicio de gestión",dateTime(row.started_at)],
      ["Finalizado",dateTime(row.finalized_at)],["Creado",dateTime(row.created_at)],["Última actualización",dateTime(row.updated_at)],
      ["Fecha estimada",dateTime(row.estimated_completion_at)],["Observación visible",row.status_note]
    ];
    return `<div class="record-grid internal-grid">${items.map(([label,value])=>`<div class="record-item"><strong>${escapeHTML(label)}</strong><span>${escapeHTML(value??"—")}</span></div>`).join("")}</div>`;
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
    setMessage(dashboardMessage,"Cargando fichas completas…");
    dashboard.classList.add("spinner");
    try{
      const {data,error}=await supabase.from("requests").select(`
        id,tracking_code,service_id,status,client_name,email,whatsapp,quoted_amount,status_note,estimated_completion_at,
        form_completed_at,receipt_uploaded_at,paid_at,started_at,finalized_at,created_at,updated_at,client_ref,
        services(name),request_data(payload,updated_at),
        request_files(id,kind,storage_path,original_name,mime_type,size_bytes,created_at),
        request_events(id,event_type,status,note,created_by,created_at)
      `).order("created_at",{ascending:false}).limit(300);
      if(error)throw error;
      rows=data||[];
      render();
      setMessage(dashboardMessage,"");
    }catch(error){
      console.error(error);
      setMessage(dashboardMessage,"No se pudieron cargar las fichas completas de los trámites.","error");
    }finally{dashboard.classList.remove("spinner");}
  }

  function filteredRows(){
    const term=String(searchInput.value||"").trim().toLowerCase();
    const status=statusFilter.value;
    return rows.filter(row=>{
      if(status&&row.status!==status)return false;
      if(!term)return true;
      const searchBlob=[row.tracking_code,row.client_name,row.whatsapp,row.email,row.service_id,serviceName(row),JSON.stringify(payloadFor(row))].join(" ").toLowerCase();
      return searchBlob.includes(term);
    });
  }

  function statusOptions(current){
    const values=[...EDITABLE_STATUSES];
    if(current&&!values.includes(current))values.splice(2,0,current);
    return values.map(value=>`<option value="${escapeHTML(value)}" ${value===current?"selected":""}>${escapeHTML(STATUS_LABELS[value]||value)}</option>`).join("");
  }

  function statusButtons(current){
    return `<div class="status-buttons">${EDITABLE_STATUSES.map(value=>`<button class="status-choice ${value===current?"active":""}" type="button" data-action="choose-status" data-status="${escapeHTML(value)}">${escapeHTML(STATUS_LABELS[value])}</button>`).join("")}</div>`;
  }

  function card(row){
    return `
      <article class="card" data-request-id="${escapeHTML(row.id)}">
        <div class="card-head">
          <div><div class="code">${escapeHTML(row.tracking_code)}</div><div class="service">${escapeHTML(serviceName(row))}</div></div>
          <span class="badge">${escapeHTML(STATUS_LABELS[row.status]||row.status)}</span>
        </div>
        <div class="meta">
          <div><strong>Cliente</strong>${escapeHTML(row.client_name||"—")}</div>
          <div><strong>Correo</strong>${escapeHTML(row.email||"—")}</div>
          <div><strong>WhatsApp</strong>${escapeHTML(row.whatsapp||"—")}</div>
          <div><strong>Importe</strong>${escapeHTML(money(row.quoted_amount))}</div>
          <div><strong>Creado</strong>${escapeHTML(dateTime(row.created_at))}</div>
          <div><strong>Actualizado</strong>${escapeHTML(dateTime(row.updated_at))}</div>
        </div>
        ${row.status_note?`<div class="notice"><strong>Observación visible:</strong> ${escapeHTML(row.status_note)}</div>`:""}

        <details class="full-record" open>
          <summary>Ficha completa del trámite</summary>
          <section class="record-section"><h3>Datos del formulario</h3>${payloadGrid(row)}</section>
          <section class="record-section"><h3>Archivos y comprobantes</h3>${fileList(row)}</section>
          <section class="record-section"><h3>Datos de control</h3>${internalData(row)}</section>
          <section class="record-section"><h3>Historial</h3>${eventList(row)}</section>
        </details>

        <div class="card-actions"><button class="btn primary" type="button" data-action="edit">Gestionar estado</button></div>
        <form class="editor" hidden>
          <h3>Estado del trámite</h3>
          ${statusButtons(row.status)}
          <div class="grid editor-grid">
            <div class="field"><label>Estado seleccionado</label><select name="status">${statusOptions(row.status)}</select></div>
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
    const {error}=await supabase.from("requests").update({status,status_note:note,estimated_completion_at:estimated}).eq("id",requestId);
    if(error){
      console.error(error);
      setMessage(message,"No se pudieron guardar los cambios.","error");
      return;
    }
    setMessage(message,"Cambios guardados.","ok");
    await loadRequests();
  }

  async function openPrivateFile(button){
    const path=button.dataset.path;
    if(!path)return;
    const original=button.textContent;
    button.disabled=true;
    button.textContent="Abriendo…";
    try{
      const {data,error}=await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(path,300);
      if(error)throw error;
      window.open(data.signedUrl,"_blank","noopener,noreferrer");
    }catch(error){
      console.error(error);
      alert("No se pudo abrir el archivo privado.");
    }finally{
      button.disabled=false;
      button.textContent=original;
    }
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

  requestsNode.addEventListener("click",async event=>{
    const button=event.target.closest("[data-action]");
    if(!button)return;
    if(button.dataset.action==="open-file"){
      await openPrivateFile(button);
      return;
    }
    const cardNode=button.closest(".card");
    const editor=cardNode?.querySelector(".editor");
    if(!editor)return;
    if(button.dataset.action==="edit"){
      editor.hidden=false;
      editor.scrollIntoView({behavior:"smooth",block:"nearest"});
    }
    if(button.dataset.action==="close")editor.hidden=true;
    if(button.dataset.action==="choose-status"){
      editor.elements.status.value=button.dataset.status||"";
      editor.querySelectorAll(".status-choice").forEach(item=>item.classList.toggle("active",item===button));
    }
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
