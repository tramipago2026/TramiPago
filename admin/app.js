const LOCAL_MODE=["localhost","127.0.0.1","::1"].includes(location.hostname);
const PROJECT_URL="https://injimzsxbnawnekybfpm.supabase.co";
const PUBLISHABLE_KEY="sb_publishable__bYVmN8G7g1fJG28C0SN0g_WbRJ23Ua";
const LABELS={
  draft:"Borrador",
  payment_pending:"Esperando pago",
  awaiting_payment:"Esperando pago",
  payment_review:"Pago en revisión",
  payment_confirmed:"Pago confirmado",
  in_progress:"En proceso",
  needs_info:"Necesitamos información",
  ready:"Listo",
  finalized:"Finalizado",
  cancelled:"Anulado"
};
const ADMIN_STATES=LOCAL_MODE?["in_progress","needs_info","finalized","cancelled"]:["payment_confirmed","in_progress","needs_info","finalized","cancelled"];
const $=selector=>document.querySelector(selector);
const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
const fmt=value=>value?new Intl.DateTimeFormat("es-AR",{dateStyle:"short",timeStyle:"short"}).format(new Date(value)):"—";
let supabase;
let requests=[];
let selectedId=null;
let mfaFactorId="";
let mfaChallengeId="";
let errorCount24h=0;
const detailCache=new Map();

async function localJson(path,options={}){
  const response=await fetch(path,{cache:"no-store",headers:{"Content-Type":"application/json",...(options.headers||{})},...options});
  let body={};try{body=await response.json();}catch(_){ }
  if(!response.ok)throw new Error(body.error||`Error ${response.status}`);
  return body;
}

async function boot(){
  if(LOCAL_MODE){
    $("#login-view").hidden=true;$("#dashboard-view").hidden=false;$("#logout").hidden=true;
    const obsolete=$('#filter option[value="payment_confirmed"]');if(obsolete)obsolete.remove();
    await loadRequests();return;
  }
  try{
    const {createClient}=await import("https://esm.sh/@supabase/supabase-js@2.105.0");
    supabase=createClient(PROJECT_URL,PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
    window.TRAMI_ADMIN_SUPABASE=supabase;
    const {data:{session}}=await supabase.auth.getSession();
    if(session)await enterDashboard();else showLogin();
  }catch(error){showLogin(error.message);}
}

function showLogin(message=""){$("#login-view").hidden=false;$("#mfa-view").hidden=true;$("#dashboard-view").hidden=true;$("#logout").hidden=true;$("#login-error").textContent=message;}


async function enrollNewAuthenticator(){
  $("#mfa-error").textContent="";
  $("#mfa-enroll").hidden=true;
  try{
    const {data:enrolled,error:enrollError}=await supabase.auth.mfa.enroll({
      factorType:"totp",
      friendlyName:"TramiPago Admin "+new Date().toISOString().slice(0,10)
    });
    if(enrollError)throw enrollError;
    const {data:challenge,error:challengeError}=await supabase.auth.mfa.challenge({factorId:enrolled.id});
    if(challengeError)throw challengeError;
    mfaFactorId=enrolled.id;
    mfaChallengeId=challenge.id;
    $("#mfa-enroll").hidden=false;
    if(enrolled.totp?.qr_code)$("#mfa-qr").src=enrolled.totp.qr_code;
    $("#mfa-secret").value=enrolled.totp?.secret||"";
    $("#mfa-error").textContent="Escaneá el QR con Google Authenticator y luego ingresá el código de 6 dígitos.";
  }catch(error){
    $("#mfa-error").textContent=error?.message||"No se pudo configurar un autenticador nuevo.";
  }
}

async function requireMfa(){
  const {data:aal,error:aalError}=await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if(aalError)throw aalError;
  if(aal?.currentLevel==="aal2")return true;

  const {data:factors,error:factorsError}=await supabase.auth.mfa.listFactors();
  if(factorsError)throw factorsError;
  let factor=(factors?.totp||[]).find(item=>item.status==="verified");
  $("#mfa-enroll").hidden=true;

  if(!factor){
    const {data:enrolled,error:enrollError}=await supabase.auth.mfa.enroll({factorType:"totp",friendlyName:"TramiPago Admin"});
    if(enrollError)throw enrollError;
    factor={id:enrolled.id};
    $("#mfa-enroll").hidden=false;
    if(enrolled.totp?.qr_code)$("#mfa-qr").src=enrolled.totp.qr_code;
    $("#mfa-secret").value=enrolled.totp?.secret||"";
  }

  const {data:challenge,error:challengeError}=await supabase.auth.mfa.challenge({factorId:factor.id});
  if(challengeError)throw challengeError;
  mfaFactorId=factor.id;
  mfaChallengeId=challenge.id;
  $("#login-view").hidden=true;$("#dashboard-view").hidden=true;$("#mfa-view").hidden=false;$("#logout").hidden=false;
  $("#mfa-error").textContent="";
  return false;
}

async function enterDashboard(){
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){showLogin();return;}
  const {data:admin,error}=await supabase.from("admin_users").select("user_id").eq("user_id",user.id).maybeSingle();
  if(error||!admin){await supabase.auth.signOut();showLogin("La cuenta no tiene permiso de administrador.");return;}
  try{if(!(await requireMfa()))return;}catch(error){showLogin("No se pudo validar la verificación en dos pasos.");return;}
  $("#login-view").hidden=true;$("#mfa-view").hidden=true;$("#dashboard-view").hidden=false;$("#logout").hidden=false;await loadRequests();
}

async function loadRequests(){
  let data,error;
  if(LOCAL_MODE){
    try{data=(await localJson("/api/local/admin/requests")).requests||[];}catch(err){error=err;}
  }else{
    const result=await supabase.from("requests")
      .select("id,tracking_code,service_id,status,client_name,email,whatsapp,quoted_amount,status_note,estimated_completion_at,current_step,completion_percent,help_context,last_activity_at,created_at,updated_at,services(name)")
      .order("created_at",{ascending:false});
    data=result.data;error=result.error;
  }
  if(error){$("#request-list").innerHTML=`<p class="error empty-list">${esc(error.message)}</p>`;return;}
  requests=data||[];
  if(!LOCAL_MODE&&supabase){
    const since=new Date(Date.now()-24*60*60*1000).toISOString();
    const errorsResult=await supabase.from("client_error_logs").select("id",{count:"exact",head:true}).gte("created_at",since);
    errorCount24h=errorsResult.error?0:(errorsResult.count||0);
  }
  if(selectedId&&!requests.some(item=>item.id===selectedId))selectedId=null;
  renderMetrics();renderList();
  if(selectedId)await renderDetail(selectedId);
  else{$("#request-detail").classList.add("empty");$("#request-detail").innerHTML="Seleccioná una solicitud para ver la ficha.";}
}

function requiresAttention(item){
  const age=Date.now()-new Date(item.updated_at||item.created_at||0).getTime();
  if(item.status==="draft")return age>30*60*1000;
  if(item.status==="payment_review")return age>2*60*60*1000;
  if(item.status==="needs_info")return age>24*60*60*1000;
  if(item.status==="in_progress")return age>48*60*60*1000;
  return false;
}
function ageLabel(item){
  const age=Math.max(0,Date.now()-new Date(item.updated_at||item.created_at||Date.now()).getTime());
  const hours=Math.floor(age/3600000);
  if(hours<1)return "Actualizado hace menos de 1 h";
  if(hours<24)return `Actualizado hace ${hours} h`;
  return `Actualizado hace ${Math.floor(hours/24)} d`;
}
function renderMetrics(){
  const definitions=LOCAL_MODE
    ? [["draft","Borradores"],["awaiting_payment","Nuevos"],["payment_review","Por verificar"],["in_progress","En proceso"],["needs_info","Falta información"],["finalized","Finalizados"]]
    : [["draft","Borradores"],["awaiting_payment","Nuevos"],["payment_review","Por verificar"],["payment_confirmed","Pagos confirmados"],["in_progress","En proceso"],["needs_info","Falta información"],["finalized","Finalizados"]];
  const cards=definitions.map(([status,label])=>`<article class="metric ${status==="payment_review"?"urgent":""}"><strong>${requests.filter(item=>item.status===status).length}</strong><span>${label}</span></article>`);
  if(!LOCAL_MODE)cards.push(`<article class="metric ${errorCount24h?"urgent":""}"><strong>${errorCount24h}</strong><span>Errores técnicos 24 h</span></article>`);
  $("#metrics").innerHTML=cards.join("");
}

function allowedNextStates(item){
  const map={
    draft:["cancelled"],
    awaiting_payment:["cancelled"],
    payment_review:["payment_confirmed","cancelled"],
    payment_confirmed:["in_progress","cancelled"],
    in_progress:["needs_info","finalized","cancelled"],
    needs_info:["in_progress","cancelled"],
    finalized:[],
    cancelled:[]
  };
  return LOCAL_MODE?(map[item.status]||ADMIN_STATES):(map[item.status]||[]);
}

function filteredRequests(){
  const term=$("#search").value.trim().toLowerCase();const status=$("#filter").value;
  return requests.filter(item=>(!status||(status==="__attention"?requiresAttention(item):item.status===status))&&(!term||[item.tracking_code,item.services?.name,item.whatsapp,item.client_name].some(value=>String(value||"").toLowerCase().includes(term))))
    .sort((a,b)=>Number(requiresAttention(b))-Number(requiresAttention(a))||String(b.created_at).localeCompare(String(a.created_at)));
}

function renderList(){
  const list=filteredRequests();
  $("#request-list").innerHTML=list.length?list.map(item=>`<button class="request-row ${selectedId===item.id?"active":""} ${requiresAttention(item)?"is-stale":""}" data-id="${item.id}" type="button"><span class="request-row-head"><strong>${esc(item.tracking_code)}</strong><span class="badge ${item.status}">${esc(LABELS[item.status]||item.status)}</span></span><span>${esc(item.services?.name||item.service_id)}</span><small>${fmt(item.created_at)}${item.whatsapp?` · ${esc(item.whatsapp)}`:""}</small><small class="${requiresAttention(item)?"attention":""}">${requiresAttention(item)?"Requiere revisión · ":""}${esc(ageLabel(item))}</small></button>`).join(""):'<div class="empty-list">No hay solicitudes con ese filtro.</div>';
}

async function fetchRequestDetail(id){
  if(detailCache.has(id))return detailCache.get(id);
  let data;
  if(LOCAL_MODE){data=(await localJson(`/api/local/admin/requests/${encodeURIComponent(id)}`)).request;}
  else{
    const result=await supabase.from("requests")
      .select("*,services(name),request_data(payload),request_files(id,kind,original_name,storage_path),request_events(id,event_type,status,note,created_at)")
      .eq("id",id).single();
    if(result.error)throw result.error;data=result.data;
  }
  detailCache.set(id,data);return data;
}

async function signedFileLink(file){
  if(LOCAL_MODE){const href=file.local_url||file.localFileUrl;if(!href)return `<span>${esc(file.original_name||file.kind)}</span>`;return `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(file.original_name||file.kind)}</a>`;}
  const {data}=await supabase.storage.from("request-files").createSignedUrl(file.storage_path,300);
  return data?.signedUrl?`<a href="${esc(data.signedUrl)}" target="_blank" rel="noopener">${esc(file.original_name||file.kind)}</a>`:`<span>${esc(file.original_name||file.kind)}</span>`;
}

async function renderDetail(id){
  selectedId=id;renderList();const detail=$("#request-detail");detail.classList.remove("empty");detail.innerHTML='<p class="empty-list">Cargando ficha…</p>';
  let item;try{item=await fetchRequestDetail(id);}catch(error){if(selectedId===id)detail.innerHTML=`<p class="error empty-list">${esc(error.message||"No se pudo cargar la ficha.")}</p>`;return;}
  if(selectedId!==id)return;
  const payload=item.request_data?.[0]?.payload||{};const files=await Promise.all((item.request_files||[]).map(signedFileLink));if(selectedId!==id)return;
  const events=[...(item.request_events||[])].sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));
  detail.innerHTML=`
    <div class="detail-head"><div><h2>${esc(item.tracking_code)}</h2><span class="badge ${item.status}">${esc(LABELS[item.status]||item.status)}</span></div><strong>${esc(item.services?.name||item.service_id)}</strong></div>
    <div class="detail-grid"><div class="field"><small>Cliente</small><strong>${esc(item.client_name||"—")}</strong></div><div class="field"><small>WhatsApp</small><strong>${esc(item.whatsapp||"—")}</strong></div><div class="field"><small>Correo</small><strong>${esc(item.email||"—")}</strong></div><div class="field"><small>Importe</small><strong>${item.quoted_amount==null?"—":`$ ${Number(item.quoted_amount).toLocaleString("es-AR")}`}</strong></div><div class="field"><small>Solicitud</small><strong>${fmt(item.created_at)}</strong></div><div class="field"><small>Última actividad</small><strong>${fmt(item.last_activity_at||item.updated_at)}</strong></div><div class="field"><small>Etapa actual</small><strong>${esc(item.current_step||"—")}</strong></div><div class="field"><small>Avance</small><strong>${item.completion_percent==null?"—":`${Number(item.completion_percent)} %`}</strong></div><div class="field"><small>Plazo estimado</small><strong>${fmt(item.estimated_completion_at)}</strong></div></div>${item.missing_fields?.length?`<div class="field help-context"><small>Datos que todavía faltan</small><strong>${esc(item.missing_fields.join(" · "))}</strong></div>`:""}${item.help_context?`<div class="field help-context"><small>Última solicitud de ayuda</small><strong>${esc(item.help_context.step||"Trámite")} · ${fmt(item.help_context.requestedAt)}</strong><span>${esc(item.help_context.route||"")}</span></div>`:""}
    <h3>Datos del formulario</h3><div class="dynamic-data">${Object.entries(payload).map(([key,value])=>`<div class="field"><small>${esc(key)}</small><strong>${esc(value&&typeof value==="object"?(value.name||JSON.stringify(value)):Array.isArray(value)?value.join(", "):value)}</strong></div>`).join("")||"<p>Sin datos adicionales.</p>"}</div>
    <div class="files"><h3>Archivos</h3>${files.join("")||"<p>Sin archivos.</p>"}</div>
    <form id="status-form" class="status-controls"><h3>Cambiar estado</h3><label>Plazo aproximado<input name="estimated" type="datetime-local" value="${item.estimated_completion_at?new Date(item.estimated_completion_at).toISOString().slice(0,16):""}"></label><label>Observación para el cliente<textarea name="note" placeholder="Indicación breve y concreta">${esc(item.status_note||"")}</textarea></label><div class="status-buttons">${allowedNextStates(item).map(status=>`<button type="submit" name="status" value="${status}" data-status="${status}">${esc(LABELS[status])}</button>`).join("")||"<p class=\"empty-list\">No hay cambios de estado disponibles.</p>"}</div></form>
    <div class="history"><h3>Historial</h3><ul>${events.map(event=>`<li><strong>${fmt(event.created_at)}</strong> · ${esc(LABELS[event.status]||event.event_type)}${event.note?` — ${esc(event.note)}`:""} <small>· ${event.created_by?"Administrador":"Sistema/cliente"}</small></li>`).join("")||"<li>Sin movimientos.</li>"}</ul></div>`;
}

async function updateStatus(status,form){
  if(!ADMIN_STATES.includes(status)||!selectedId)return;
  const note=form.elements.note.value.trim();const estimated=form.elements.estimated.value;
  if(status==="needs_info"&&!note){window.alert("Indicá qué dato necesita corregirse.");return;}
  if(status==="cancelled"&&!note){window.alert("Indicá el motivo de la anulación. La solicitud no se elimina y queda auditada.");return;}
  const id=selectedId;
  if(LOCAL_MODE){
    try{await localJson(`/api/local/admin/requests/${encodeURIComponent(id)}`,{method:"PATCH",body:JSON.stringify({status,note,estimatedCompletionAt:estimated?new Date(estimated).toISOString():null})});}
    catch(error){window.alert(error.message);return;}
  }else{
    const patch={status,status_note:note||null,estimated_completion_at:estimated?new Date(estimated).toISOString():null};
    if(status==="payment_confirmed")patch.paid_at=new Date().toISOString();if(status==="in_progress")patch.started_at=new Date().toISOString();if(status==="finalized")patch.finalized_at=new Date().toISOString();
    const {error}=await supabase.from("requests").update(patch).eq("id",id);if(error){window.alert(error.message);return;}
  }
  detailCache.delete(id);await loadRequests();
}

$("#login-form").addEventListener("submit",async event=>{event.preventDefault();if(LOCAL_MODE)return;$("#login-error").textContent="";const form=new FormData(event.currentTarget);const {error}=await supabase.auth.signInWithPassword({email:form.get("email"),password:form.get("password")});if(error){$("#login-error").textContent="Correo o contraseña incorrectos.";return;}await enterDashboard();});
$("#mfa-form").addEventListener("submit",async event=>{event.preventDefault();$("#mfa-error").textContent="";const code=String(new FormData(event.currentTarget).get("code")||"").replace(/\D/g,"").slice(0,6);if(code.length!==6){$("#mfa-error").textContent="Ingresá el código de 6 dígitos.";return;}const {error}=await supabase.auth.mfa.verify({factorId:mfaFactorId,challengeId:mfaChallengeId,code});if(error){$("#mfa-error").textContent="Código incorrecto o vencido.";return;}event.currentTarget.reset();await enterDashboard();});
$("#mfa-new-factor").addEventListener("click",enrollNewAuthenticator);

$("#logout").addEventListener("click",async()=>{if(!LOCAL_MODE&&supabase)await supabase.auth.signOut();showLogin();});
$("#refresh").addEventListener("click",async()=>{detailCache.clear();await loadRequests();});
$("#search").addEventListener("input",renderList);$("#filter").addEventListener("change",renderList);
$("#request-list").addEventListener("click",event=>{const row=event.target.closest("[data-id]");if(row)renderDetail(row.dataset.id);});
$("#request-detail").addEventListener("submit",event=>{if(event.target.id!=="status-form")return;event.preventDefault();const submitter=event.submitter;if(submitter)updateStatus(submitter.value,event.target);});
boot();
