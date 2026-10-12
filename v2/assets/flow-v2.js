"use strict";
(() => {
  const q=(s,r=document)=>r.querySelector(s);
  const randomKey=(prefix)=>prefix+"-"+(crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random().toString(16).slice(2));
  const flow=document.body.dataset.v2Flow;
  const match=location.pathname.match(/^\/v2\/tramites\/([^/]+)\/(revisar|pago|confirmacion)\/?$/);
  const serviceId=match?.[1]||"";
  const output=q("[data-flow-message]");
  const main=q("[data-flow-content]");
  let schema=null;
  function progress(data){window.TramiPagoProgress?.render({stage:flow,requiresPayment:data.requiresPayment,status:data.status})}

  function message(text,kind="info"){
    if(!output)return;
    output.textContent=text;output.dataset.kind=kind;output.hidden=false;
  }
  function current(){
    try{
      const value=JSON.parse(sessionStorage.getItem("tramipago-v2-current")||"null");
      return value?.serviceId===serviceId?value:null;
    }catch{return null}
  }
  async function api(path,options={}){
    const response=await fetch(path,{
      credentials:"same-origin",
      ...options,
      headers:{
        Accept:"application/json",
        ...(options.body instanceof FormData?{}:options.body?{"Content-Type":"application/json"}:{}),
        ...(options.headers||{}),
      },
    });
    const raw=await response.text();let data=null;
    if(raw){try{data=JSON.parse(raw)}catch{data={error:"invalid_response"}}}
    if(!response.ok){const e=new Error(data?.error||"request_failed");e.status=response.status;throw e}
    return data;
  }
  function statusLabel(status){
    return ({draft:"Borrador",awaiting_payment:"Pago pendiente",payment_review:"Pago en revisión",payment_confirmed:"Pago confirmado",in_progress:"En proceso",needs_info:"Falta información",finalized:"Finalizado",cancelled:"Cancelado"})[status]||status||"";
  }
  function valueText(value){
    if(value===null||value===undefined||value==="")return "—";
    if(typeof value==="boolean")return value?"Sí":"No";
    if(Array.isArray(value))return value.join(", ");
    if(typeof value==="object")return JSON.stringify(value);
    return String(value);
  }
  function safeName(name){return String(name||"").replace(/[\\/:*?"<>|]+/g,"-").slice(0,120)||"tramipago-resultado"}

  async function loadDraft(active){
    return api("/v2/requests/"+encodeURIComponent(active.requestId)+"/draft",{
      method:"GET",
      headers:{"X-Request-Capability":active.capability},
    });
  }

  async function renderReview(active){
    const data=await loadDraft(active);
    progress(data);
    q("[data-flow-title]").textContent="Revisar "+data.serviceName;
    const summary=document.createElement("div");summary.className="status-box";
    const heading=document.createElement("h2");heading.textContent="Resumen de la solicitud";
    const dl=document.createElement("dl");dl.className="review-list";
    const add=(label,value)=>{
      const dt=document.createElement("dt");dt.textContent=label;
      const dd=document.createElement("dd");dd.textContent=valueText(value);
      dl.append(dt,dd);
    };
    add("Código",data.trackingCode);
    add("Estado",statusLabel(data.status));
    summary.append(heading,dl);
    const details=document.createElement("div");
    window.TramiPagoProgress?.summary(details,schema,{...data.payload,fullName:data.contact?.name,name:data.contact?.name,email:data.contact?.email,whatsapp:data.contact?.whatsapp});
    summary.append(details);
    main.replaceChildren(summary);

    if(data.status==="draft"){
      const actions=document.createElement("div");actions.className="flow-actions";
      const back=document.createElement("a");back.className="button secondary-button";back.href="/v2/tramites/"+serviceId+"/";back.textContent="Volver a editar";
      const submit=document.createElement("button");submit.className="button";submit.type="button";submit.textContent="Confirmar solicitud de prueba";
      if(schema?.fields?.some(field=>field.type==="file"&&field.required&&!active.uploadedFields?.[field.id])){
        submit.disabled=true;
        message("Falta adjuntar la documentación requerida. Volvé a los datos para completar la solicitud.");
      }
      submit.addEventListener("click",async()=>{
        submit.disabled=true;message("Confirmando solicitud…");
        try{
          const done=await api("/v2/requests/"+encodeURIComponent(active.requestId)+"/submit",{
            method:"POST",
            headers:{
              "Idempotency-Key":randomKey("submit-"+active.requestId),
              "X-Request-Capability":active.capability,
            },
            body:"{}",
          });
          location.href="/v2/tramites/"+serviceId+(done.requiresPayment?"/pago/":"/confirmacion/");
        }catch(e){message(e.status===409?"La solicitud ya avanzó de etapa.":"No se pudo confirmar la solicitud.","error");submit.disabled=false}
      });
      actions.append(back,submit);main.append(actions);
    }else{
      const next=document.createElement("a");next.className="button";next.href=data.requiresPayment?"/v2/tramites/"+serviceId+"/pago/":"/v2/tramites/"+serviceId+"/confirmacion/";next.textContent="Continuar →";main.append(next);
    }
  }

  async function renderPayment(active){
    const data=await loadDraft(active);
    progress(data);
    q("[data-flow-title]").textContent="Pago · "+data.serviceName;
    const box=document.createElement("div");box.className="status-box";
    box.innerHTML="<h2>Pago de la solicitud</h2><p>Entorno de prueba: no realices transferencias ni pagos reales.</p>";
    main.replaceChildren(box);

    if(data.status==="draft"){
      const a=document.createElement("a");a.className="button";a.href="/v2/tramites/"+serviceId+"/";a.textContent="Completar datos →";main.append(a);return;
    }
    if(!data.requiresPayment||["payment_review","payment_confirmed","in_progress","needs_info","finalized"].includes(data.status)){
      const a=document.createElement("a");a.className="button";a.href="/v2/tramites/"+serviceId+"/confirmacion/";a.textContent="Ver confirmación →";main.append(a);return;
    }

    const health=await api("/v2/health/dependencies",{method:"GET"}).catch(()=>null);
    const ready=health?.dependencies?.b2==="configured";
    const form=document.createElement("form");form.className="vertical";
    form.innerHTML='<label>Comprobante sintético PDF/JPEG/PNG<input name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" required></label><button class="button" type="submit">Enviar comprobante de prueba</button>';
    const button=q('button[type="submit"]',form);
    if(!ready){
      button.disabled=true;
      q('input[type="file"]',form).disabled=true;
      const p=document.createElement("p");p.className="notice";p.textContent="La carga de comprobantes todavía no está habilitada en esta versión de prueba. El pago sigue pendiente.";main.append(p);
    }
    form.addEventListener("submit",async(event)=>{
      event.preventDefault();const file=new FormData(form).get("file");if(!(file instanceof File))return;
      button.disabled=true;message("Cargando comprobante privado…");
      const body=new FormData();body.set("file",file);body.set("kind","payment_receipt");
      try{
        const uploaded=await api("/v2/requests/"+encodeURIComponent(active.requestId)+"/files",{
          method:"POST",
          headers:{"Idempotency-Key":randomKey("payment-file-"+active.requestId),"X-Request-Capability":active.capability},
          body,
        });
        await api("/v2/requests/"+encodeURIComponent(active.requestId)+"/payment-proof",{
          method:"POST",
          headers:{"Idempotency-Key":randomKey("payment-proof-"+active.requestId),"X-Request-Capability":active.capability},
          body:JSON.stringify({fileId:uploaded.fileId}),
        });
        location.href="/v2/tramites/"+serviceId+"/confirmacion/";
      }catch(e){message(e.status===503?"La carga de comprobantes aún no está disponible.":"No se pudo registrar el comprobante.","error");button.disabled=!ready}
    });
    main.append(form);
  }

  async function renderConfirmation(active){
    const data=await loadDraft(active);
    progress(data);
    q("[data-flow-title]").textContent=data.status==="draft"?"Solicitud pendiente":data.status==="awaiting_payment"?"Pago pendiente":data.status==="payment_review"?"Comprobante en revisión":"Solicitud enviada";
    const box=document.createElement("div");box.className="created-card";
    const h=document.createElement("h2");h.textContent=data.serviceName;
    const code=document.createElement("p");code.innerHTML="Código de seguimiento: <code></code>";q("code",code).textContent=data.trackingCode;
    const status=document.createElement("p");status.textContent="Estado: "+statusLabel(data.status);
    const a=document.createElement("a");a.className="button";a.href="/v2/seguimiento/?codigo="+encodeURIComponent(data.trackingCode);a.textContent="Ir a seguimiento →";
    box.append(h,code,status,a);main.replaceChildren(box);
    if(["draft","awaiting_payment"].includes(data.status)){
      const next=document.createElement("a");next.className="button secondary-button";next.href="/v2/tramites/"+serviceId+(data.status==="draft"?"/":"/pago/");next.textContent=data.status==="draft"?"Completar datos →":"Continuar al pago →";main.append(next);
    }
  }

  (async()=>{
    try{
      schema=await fetch("/v2/data/form-schema-v2.json").then(r=>r.json()).then(data=>data.services[serviceId]);
      window.TramiPagoProgress?.render({stage:flow,requiresPayment:!schema?.intakeOnly});
      const active=current();
      if(!active){
        message("Completá los datos para iniciar tu solicitud.");
        const a=document.createElement("a");a.className="button";a.href="/v2/tramites/"+serviceId+"/";a.textContent="Iniciar solicitud →";main.replaceChildren(a);return;
      }
      if(flow==="review")await renderReview(active);
      else if(flow==="payment")await renderPayment(active);
      else await renderConfirmation(active);
    }catch(e){
      message(e.status===401?"La autorización local de esta solicitud ya no es válida.":"No se pudo cargar esta etapa.","error");
    }
  })();
})();
