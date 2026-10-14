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
  let tariff=null;
  const formatARS=amount=>new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0}).format(amount);
  function showQuotedPrice(box,data){
    if(!data.requiresPayment)return;
    const p=document.createElement("p");
    p.textContent=data.quotedAmount===null||data.quotedAmount===undefined
      ?"Importe pendiente de cotización. No realices transferencias."
      :(tariff?.officialFeeIncluded?"Importe total cotizado: ":"Importe de gestión cotizado: ")+formatARS(Number(data.quotedAmount))+
      (tariff?.officialFeeExternal?". La tasa oficial, si corresponde, se informa por separado.":"");
    box.append(p);
  }
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
  function statusLabel(status) {
    return window.TramiPagoShell?.statusLabel(status) || status || "Sin estado";
  }
  function valueText(value){
    if(value===null||value===undefined||value==="")return "—";
    if(typeof value==="boolean")return value?"Sí":"No";
    if(Array.isArray(value))return value.join(", ");
    if(typeof value==="object")return JSON.stringify(value);
    return String(value);
  }
  function safeName(name){return String(name||"").replace(/[\\/:*?"<>|]+/g,"-").slice(0,120)||"tramipago-resultado"}
  function trackingHref(data){return "/v2/seguimiento/?codigo="+encodeURIComponent(data.trackingCode)}
  function nextAction(data){
    if(data.status==="cancelled")return {href:"/v2/tramites/"+serviceId+"/",text:"Volver al trámite"};
    if(data.status==="needs_info")return {href:trackingHref(data),text:"Completar información →"};
    return {href:"/v2/tramites/"+serviceId+(data.requiresPayment&&data.status==="awaiting_payment"?"/pago/":"/confirmacion/"),text:"Continuar →"};
  }

  async function loadDraft(active){
    return api("/v2/requests/"+encodeURIComponent(active.requestId)+"/draft",{
      method:"GET",
      headers:{"X-Request-Capability":active.capability},
    });
  }

  async function renderReview(active){
    const data=await loadDraft(active);
    progress(data);
    q("[data-flow-title]").textContent=data.status==="cancelled"?"Solicitud cancelada":"Revisar "+data.serviceName;
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
    if(data.requiresPayment)add("Importe cotizado",data.quotedAmount===null?"A confirmar":formatARS(Number(data.quotedAmount)));
    summary.append(heading,dl);
    if(data.requiresPayment&&tariff?.officialFeeExternal){
      const note=document.createElement("p");
      note.textContent="La tasa oficial se informa por separado cuando corresponda.";
      summary.append(note);
    }
    const details=document.createElement("div");
    window.TramiPagoProgress?.summary(details,schema,{...data.payload,fullName:data.contact?.name,name:data.contact?.name,email:data.contact?.email,whatsapp:data.contact?.whatsapp});
    summary.append(details);
    main.replaceChildren(summary);

    if(data.status==="draft"){
      const actions=document.createElement("div");actions.className="flow-actions";
      const back=document.createElement("a");back.className="button secondary-button";back.href="/v2/tramites/"+serviceId+"/";back.textContent="Volver a editar";
      const submit=document.createElement("button");submit.className="button";submit.type="button";submit.textContent="Confirmar solicitud";
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
      const action=nextAction(data);
      const next=document.createElement("a");next.className="button";next.href=action.href;next.textContent=action.text;main.append(next);
    }
  }

  async function renderPayment(active){
    const data=await loadDraft(active);
    progress(data);
    q("[data-flow-title]").textContent=data.status==="cancelled"?"Solicitud cancelada":data.status==="needs_info"?"Información pendiente":"Pago · "+data.serviceName;
    const box=document.createElement("div");box.className="status-box";
    const heading=document.createElement("h2");heading.textContent=data.requiresPayment?"Pago de la solicitud":"Solicitud sin pago";
    const state=document.createElement("p");state.textContent="Estado actual: "+statusLabel(data.status);
    box.append(heading,state);
    showQuotedPrice(box,data);
    main.replaceChildren(box);

    if(["cancelled","needs_info"].includes(data.status)){
      const action=nextAction(data);
      const a=document.createElement("a");a.className="button";a.href=action.href;a.textContent=action.text;main.append(a);return;
    }

    if(data.status==="draft"){
      const a=document.createElement("a");a.className="button";a.href="/v2/tramites/"+serviceId+"/";a.textContent="Completar datos →";main.append(a);return;
    }
    if(!data.requiresPayment||["payment_review","payment_confirmed","in_progress","needs_info","finalized"].includes(data.status)){
      const a=document.createElement("a");a.className="button";a.href="/v2/tramites/"+serviceId+"/confirmacion/";a.textContent="Ver confirmación →";main.append(a);return;
    }

    const health=await api("/v2/health/dependencies",{method:"GET"}).catch(()=>null);
    const method=await fetch("/v2/data/medio-pago-v1-v2.json").then(r=>r.ok?r.json():null).catch(()=>null);
    const ready=health?.dependencies?.b2==="configured" && health?.dependencies?.payments==="configured" &&
      method?.enabled===true && method?.provider==="transferencia" && data.quotedAmount!==null && data.quotedAmount!==undefined;
    if(ready){
      const destination=document.createElement("div");
      destination.className="status-box";
      const heading=document.createElement("h3");heading.textContent="Datos de transferencia";
      destination.append(heading);
      for(const [name,value] of [["Titular",method.holder],["Alias",method.alias],["CVU",method.cvu]]){
        const row=document.createElement("p");row.textContent=name+": "+value;destination.append(row);
      }
      main.append(destination);
    }
    const form=document.createElement("form");form.className="vertical";
    form.innerHTML='<label>Comprobante PDF/JPEG/PNG<input name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" required></label><button class="button" type="submit">Enviar comprobante</button>';
    const button=q('button[type="submit"]',form);
    if(!ready){
      button.disabled=true;
      q('input[type="file"]',form).disabled=true;
      const p=document.createElement("p");p.className="notice";p.textContent="El pago y la carga de comprobantes no están habilitados en este momento. No realices transferencias.";main.append(p);
    }
    form.addEventListener("submit",async(event)=>{
      event.preventDefault();const file=new FormData(form).get("file");if(!(file instanceof File))return;
      button.disabled=true;message("Enviando comprobante…");
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
    q("[data-flow-title]").textContent=({draft:"Solicitud pendiente",awaiting_payment:"Pago pendiente",payment_review:"Comprobante en revisión",payment_confirmed:"Pago confirmado",in_progress:"Solicitud en proceso",needs_info:"Información pendiente",finalized:"Solicitud finalizada",cancelled:"Solicitud cancelada"})[data.status]||"Estado de la solicitud";
    const box=document.createElement("div");box.className="created-card";
    const h=document.createElement("h2");h.textContent=data.serviceName;
    const code=document.createElement("p");code.innerHTML="Código de seguimiento: <code></code>";q("code",code).textContent=data.trackingCode;
    const status=document.createElement("p");status.textContent="Estado: "+statusLabel(data.status);
    const a=document.createElement("a");a.className="button";a.href=trackingHref(data);a.textContent=data.status==="needs_info"?"Completar información →":"Ir a seguimiento →";
    box.append(h,code,status,a);main.replaceChildren(box);
    if(["draft","awaiting_payment"].includes(data.status)){
      const next=document.createElement("a");next.className="button secondary-button";next.href="/v2/tramites/"+serviceId+(data.status==="draft"?"/":"/pago/");next.textContent=data.status==="draft"?"Completar datos →":"Continuar al pago →";main.append(next);
    }
  }

  (async()=>{
    try{
      schema=await fetch("/v2/data/form-schema-v2.json").then(r=>r.json()).then(data=>data.services[serviceId]);
      try {
        const prices=await fetch("/v2/data/tarifario-v1-v2.json").then(r=>r.ok?r.json():null);
        tariff=prices?.services?.[serviceId]||null;
      }catch{}
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
      message(e.status===401?"La autorización local de esta solicitud ya no es válida. Volvé a iniciar tu solicitud.":"No se pudo cargar esta etapa. Podés reintentar.","error");
      const retry=document.createElement("button");retry.className="button";retry.type="button";retry.textContent="Reintentar";retry.addEventListener("click",()=>location.reload());
      const back=document.createElement("a");back.className="button secondary-button";back.href="/v2/tramites/"+serviceId+"/";back.textContent="Volver al trámite";
      const actions=document.createElement("div");actions.className="flow-actions";actions.append(retry,back);main.replaceChildren(actions);
    }
  })();
})();
