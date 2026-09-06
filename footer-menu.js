(function(){
  "use strict";

  const app=document.getElementById("app");
  const DRAFT_PREFIX="tramipago_draft_";
  const REQUESTS_KEY="tramipago_requests_v1";
  const ACTIVE_REQUEST_KEY="tramipago_active_request_v1";

  function readJSON(storage,key,fallback){
    try{const raw=storage.getItem(key);return raw?JSON.parse(raw):fallback;}catch(_){return fallback;}
  }

  function currentServiceId(){
    const match=(location.hash||"").match(/^#\/tramite\/([^/?]+)/);
    return match?match[1]:"";
  }

  function draftKey(){const id=currentServiceId();return id?DRAFT_PREFIX+id:"";}

  function activeRequest(){
    const ref=readJSON(sessionStorage,ACTIVE_REQUEST_KEY,null);
    if(!ref)return null;
    const requests=readJSON(localStorage,REQUESTS_KEY,[]);
    return requests.find(r=>r.id===ref.id||r.code===ref.code)||null;
  }

  function buildFooter(){
    const footer=document.querySelector(".site-footer");
    const inner=footer?.querySelector(".footer-inner");
    if(!footer||!inner||inner.dataset.footerReady==="true")return;
    inner.dataset.footerReady="true";
    inner.innerHTML=`
      <div class="footer-menu-grid">
        <section class="footer-menu-col"><h3>TRAMIPAGO</h3><a href="tramites.html#como-funciona">Cómo funciona</a><a href="tramites.html">Todos los trámites</a><a href="opiniones.html">Opiniones</a></section>
        <section class="footer-menu-col"><h3>TRÁMITES</h3><a href="#/tramite/antecedentes-penales">Antecedentes Penales</a><a href="#/tramite/constancias-anses">ANSES</a><a href="#/tramite/informe-vehicular">Informe vehicular</a><a href="#/tramite/arba-inmobiliario">ARBA / Inmobiliario</a></section>
        <section class="footer-menu-col"><h3>ATENCIÓN</h3><a href="contacto.html">Contacto</a><a href="#/seguimiento">Estado del trámite</a><a href="https://wa.me/5491167083232" target="_blank" rel="noopener noreferrer">WhatsApp</a></section>
        <section class="footer-menu-col"><h3>LEGAL</h3><a href="politica-privacidad.html">Política de Privacidad</a><a href="terminos-condiciones.html">Términos y Condiciones</a><a href="arrepentimiento.html">BOTÓN DE ARREPENTIMIENTO</a><a href="baja-servicio.html">BOTÓN DE BAJA DE SERVICIO</a><a href="https://www.argentina.gob.ar/node/41160" target="_blank" rel="noopener noreferrer">Defensa del Consumidor</a></section>
      </div>
      <div class="footer-menu-bottom"><span>© 2026 TramiPago · Todos los derechos reservados</span><span>CUIT 20-25988733-0 · tramipago@gmail.com</span></div>`;
  }

  function addStyles(){
    if(document.getElementById("tramipago-audit-styles"))return;
    const style=document.createElement("style");
    style.id="tramipago-audit-styles";
    style.textContent=`
      html,body,.site-main{background:#eaf2f7!important}
      .home-hero-clean{background:linear-gradient(180deg,#f6fbfe 0%,#eaf2f7 100%)!important}
      .home-catalog,.process-shell,.family-page,.tracking-page{background:#eaf2f7!important}
      .panel,.family-heading,.family-service-card{background:#fbfdff!important}
      .service-summary-block{background:#f3f8fb!important}
      .button.button-primary,.family-service-card .button.button-primary{color:#fff!important;background:#23A85D!important;border:2px solid #050505!important;box-shadow:0 4px 9px rgba(5,5,5,.28)!important;cursor:pointer!important}
      .button.button-primary:hover,.button.button-primary:focus-visible,.family-service-card .button.button-primary:hover,.family-service-card .button.button-primary:focus-visible{color:#fff!important;background:#126B3A!important;border-color:#fff!important;box-shadow:0 0 0 3px rgba(35,168,93,.24),0 5px 11px rgba(5,5,5,.28)!important;outline:none!important;transform:translateY(-1px)!important}
      .button.button-secondary{color:#082A47!important;background:#dceef8!important;border:2px solid #050505!important;box-shadow:0 4px 9px rgba(5,5,5,.22)!important;cursor:pointer!important}
      .button.button-secondary:hover,.button.button-secondary:focus-visible{color:#fff!important;background:#082A47!important;border-color:#29B6F6!important;box-shadow:0 0 0 3px rgba(41,182,246,.24),0 5px 11px rgba(5,5,5,.28)!important;outline:none!important;transform:translateY(-1px)!important}
      .process-container{max-width:1040px!important}.process-top{margin-bottom:10px!important}.process-title h1{font-size:clamp(1.45rem,2.5vw,2rem)!important}.process-title p{font-size:.88rem!important;line-height:1.4!important}.process-content>.panel{padding:16px 18px!important}.panel-header{margin-bottom:10px!important}.panel-header h2{font-size:1.15rem!important}.panel-header p{font-size:.86rem!important}.service-summary{gap:8px!important;margin:10px 0!important}.service-summary-block{padding:9px 11px!important}.service-summary-block h3{font-size:.85rem!important;margin-bottom:5px!important}.service-summary-block li,.service-summary-option,.service-summary-row{font-size:.78rem!important;line-height:1.35!important}.form-grid{gap:9px 14px!important}.field label,.choice-field legend{font-size:.82rem!important}.form-control,.form-select{min-height:39px!important;padding:7px 9px!important;font-size:.88rem!important}.form-check{padding:7px 9px!important}.form-check-label,.privacy-help{font-size:.78rem!important;line-height:1.35!important}.step-actions{position:relative!important;z-index:2!important;margin-top:12px!important}.step-actions .button{min-height:40px!important}.stepper{margin:8px 0 12px!important}
      .payment-access{display:none!important}.payment-access-v2{grid-template-columns:minmax(210px,.78fr) minmax(300px,1.22fr)!important;gap:13px!important;margin:10px 0 12px!important}.payment-method-card{padding:12px!important;background:#f6fafc!important}.payment-method-card h3{margin-bottom:7px!important;font-size:.95rem!important}.payment-qr-image{width:176px!important;height:176px!important;margin:0 auto 6px!important;padding:0!important;border:0!important;background:transparent!important}.payment-data-row{grid-template-columns:78px minmax(0,1fr) auto!important;padding:6px 0!important}.payment-data-row span{font-size:.75rem!important}.payment-data-row strong{font-size:.86rem!important}.payment-copy{min-height:28px!important;padding:3px 7px!important;box-shadow:none!important}
      .email-pair{grid-column:1/-1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px 14px}.email-pair>.field{min-width:0}.existing-file-note,.draft-restored-note,.payment-back-warning{display:block;margin-top:5px;padding:6px 8px;border-radius:7px;background:#eef8ff;border:1px solid #b8dbef;color:#103b68;font-size:.72rem;line-height:1.35}.existing-file-note strong{overflow-wrap:anywhere}.field input:invalid.user-touched,.field select:invalid.user-touched,.field textarea:invalid.user-touched{border-color:#b42318!important;box-shadow:0 0 0 2px rgba(180,35,24,.12)!important}.form-error.visible{display:block!important}
      .site-footer{padding:12px 0 8px!important;background:#082A47!important}.site-footer .footer-inner{display:block!important;width:min(1180px,calc(100% - clamp(30px,6vw,96px)))!important;max-width:none!important;margin-inline:auto!important;padding-inline:0!important}.footer-menu-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));column-gap:clamp(26px,5vw,78px);row-gap:18px;width:100%;align-items:start}.footer-menu-col{min-width:0;text-align:left}.footer-menu-col h3{margin:0 0 5px;color:#fff;font-size:10.5px;font-weight:650}.footer-menu-col a{display:block;margin:2px 0;color:rgba(255,255,255,.82);font-size:9.5px;font-weight:400;line-height:1.35;text-decoration:none;overflow-wrap:anywhere}.footer-menu-col a:hover,.footer-menu-col a:focus-visible{color:#29B6F6;text-decoration:underline;text-underline-offset:2px}.footer-menu-bottom{display:flex;justify-content:space-between;gap:18px;flex-wrap:wrap;width:100%;margin-top:10px;padding-top:6px;border-top:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.68);font-size:9px;line-height:1.3}
      .tramipago-error-box{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(8,42,71,.42)}.tramipago-error-card{width:min(460px,100%);padding:22px;border-radius:12px;background:#fff;border:1px solid #c8dae5;box-shadow:0 18px 48px rgba(0,0,0,.22);text-align:center}.tramipago-error-actions{display:flex;gap:10px;justify-content:center;margin-top:16px;flex-wrap:wrap}
      @media(max-width:900px){.site-footer .footer-inner{width:min(720px,calc(100% - 36px))!important}.footer-menu-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.service-summary{grid-template-columns:1fr!important}}
      @media(max-width:760px){.payment-access-v2,.email-pair{grid-template-columns:1fr!important}.process-content>.panel{padding:14px!important}.form-grid{grid-template-columns:1fr!important}}
      @media(max-width:520px){.footer-menu-grid{grid-template-columns:1fr;row-gap:14px}.footer-menu-bottom{display:block}.footer-menu-bottom span{display:block;margin-top:4px}.payment-qr-image{width:160px!important;height:160px!important}}
    `;
    document.head.appendChild(style);
  }

  function setTextIfDifferent(element,text){
    if(element&&element.textContent!==text)element.textContent=text;
  }

  function pairEmails(){
    const email=document.querySelector('input[name="email"]');
    const confirm=document.querySelector('input[name="emailConfirm"]');
    const a=email?.closest(".field"),b=confirm?.closest(".field"),grid=a?.closest(".form-grid");
    if(!a||!b||!grid||a.parentElement?.classList.contains("email-pair"))return;
    const pair=document.createElement("div");
    pair.className="email-pair";
    grid.insertBefore(pair,a);
    pair.append(a,b);
  }

  function normalizeButtons(){
    const form=document.querySelector("#data-form");
    form?.querySelector('[data-action="back-step"]')?.remove();
    setTextIfDifferent(form?.querySelector('button[type="submit"]'),"Continuar");
    const eligibility=document.querySelector("#eligibility-form");
    eligibility?.querySelector('[data-action="back-step"]')?.remove();
    const pay=document.querySelector("#payment-form");
    setTextIfDifferent(pay?.querySelector('[data-action="back-step"]'),"Modificar datos");
    setTextIfDifferent(pay?.querySelector('button[type="submit"]'),"Informar pago");
    document.querySelectorAll('.process-top [data-action="back-home"],.family-page .family-back[data-action="back-home"],.ineligible-panel [data-action="back-home"]').forEach(el=>el.remove());
  }

  function tidyPayment(){
    const payment=document.querySelector(".payment-access-v2");
    if(!payment)return;
    const cards=payment.querySelectorAll(".payment-method-card");
    setTextIfDifferent(cards[0]?.querySelector("h3"),"Pago por QR");
    setTextIfDifferent(cards[1]?.querySelector("h3"),"Pago por transferencia");
  }

  function showExistingFiles(){
    const form=document.getElementById("data-form"),request=activeRequest();
    if(!form||!request?.answers)return;
    form.querySelectorAll('input[type="file"][name]').forEach(input=>{
      if(input.parentElement?.querySelector(".existing-file-note"))return;
      const stored=request.answers[input.name];
      if(!stored?.name)return;
      const note=document.createElement("small");
      note.className="existing-file-note";
      note.innerHTML=`Archivo ya cargado: <strong>${String(stored.name).replace(/[<>]/g,"")}</strong>. Si elegís otro, lo reemplaza.`;
      input.insertAdjacentElement("afterend",note);
    });
  }

  function saveDraft(form){
    const key=draftKey();
    if(!key||form?.id!=="data-form")return;
    const data={};
    form.querySelectorAll("input,select,textarea").forEach(el=>{
      if(!el.name||el.type==="file"||el.type==="password")return;
      if(el.type==="checkbox")data[el.name]=el.checked;
      else if(el.type==="radio"){if(el.checked)data[el.name]=el.value;}
      else data[el.name]=el.value;
    });
    try{sessionStorage.setItem(key,JSON.stringify(data));}catch(_){}
  }

  function restoreDraft(){
    const form=document.getElementById("data-form"),key=draftKey();
    if(!form||!key||form.dataset.draftRestored==="true")return;
    form.dataset.draftRestored="true";
    const data=readJSON(sessionStorage,key,null);
    if(!data||typeof data!=="object")return;
    let restored=false;
    Object.entries(data).forEach(([name,value])=>{
      const field=form.elements.namedItem(name);
      if(!field)return;
      if(field instanceof RadioNodeList){
        [...field].forEach(el=>{if(el.type==="radio")el.checked=String(el.value)===String(value);});
        restored=true;
      }else if(field.type==="checkbox"){
        field.checked=Boolean(value);restored=true;
      }else if(!field.value&&value){
        field.value=String(value);restored=true;
      }
    });
    if(restored&&!form.querySelector(".draft-restored-note")){
      const note=document.createElement("div");
      note.className="draft-restored-note";
      note.textContent="Recuperamos los datos que habías escrito en esta sesión.";
      form.querySelector(".form-grid")?.prepend(note);
    }
  }

  function clearDraftWhenSaved(){
    if(!document.getElementById("payment-form"))return;
    const key=draftKey();
    if(key)try{sessionStorage.removeItem(key);}catch(_){}
  }

  function setValidity(input,message){
    input.setCustomValidity(message||"");
    if(message)input.classList.add("user-touched");
  }

  function validateField(input){
    if(!input?.name)return true;
    const raw=String(input.value||"").trim(),digits=raw.replace(/\D/g,"");
    let message="";
    if(input.name==="cuil"&&raw&&digits.length!==11)message="Ingresá un CUIL de 11 dígitos.";
    if(input.name==="dni"&&raw&&(digits.length<7||digits.length>9))message="Revisá el DNI.";
    if(input.name==="whatsapp"&&raw&&(digits.length<10||digits.length>11))message="Ingresá código de área y número, sin +54 9.";
    if(["fullName","fatherFullName","motherFullName"].includes(input.name)&&raw&&!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2}/.test(raw))message="Revisá este nombre.";
    if(input.name==="birthDate"&&raw){const d=new Date(raw+"T12:00:00");if(!Number.isFinite(d.getTime())||d>new Date())message="Revisá la fecha de nacimiento.";}
    if(input.name==="patent"&&raw&&raw.replace(/[^A-Za-z0-9]/g,"").length<5)message="Revisá el dominio ingresado.";
    setValidity(input,message);
    return !message;
  }

  function validateBasics(form){
    if(!form||!["data-form","correction-form"].includes(form.id))return true;
    let ok=true;
    form.querySelectorAll("input,select,textarea").forEach(el=>{if(!validateField(el))ok=false;});
    const email=form.querySelector('input[name="email"]'),confirm=form.querySelector('input[name="emailConfirm"]');
    if(email&&confirm&&email.value.trim()&&confirm.value.trim()&&email.value.trim().toLowerCase()!==confirm.value.trim().toLowerCase()){
      setValidity(confirm,"Los correos electrónicos no coinciden.");
      ok=false;
    }
    return ok;
  }

  function showInvalidSubmit(form){
    if(!form||form.checkValidity())return false;
    const first=form.querySelector(":invalid");
    if(first)first.classList.add("user-touched");
    const error=form.querySelector(".form-error");
    if(error){
      error.textContent=form.id==="payment-form"?"Para continuar, cargá el comprobante de pago.":"Falta completar o corregir un campo. Revisá el dato marcado.";
      error.classList.add("visible");
    }
    if(first){
      first.scrollIntoView({behavior:"smooth",block:"center"});
      window.setTimeout(()=>{
        try{first.focus({preventScroll:true});}catch(_){first.focus();}
        form.reportValidity();
      },120);
    }else form.reportValidity();
    return true;
  }

  function simplifyStepper(){
    const stepper=document.querySelector(".stepper");
    if(!stepper||stepper.dataset.auditReady==="true")return;
    const steps=[...stepper.querySelectorAll(".step")],labels=["Datos","Pago","Finalización"];
    if(steps.length===3)steps.forEach((s,i)=>setTextIfDifferent(s.querySelector("span:last-child"),labels[i]));
    stepper.dataset.auditReady="true";
  }

  function simplifyTimeline(){
    const result=document.querySelector(".tracking-result"),timeline=result?.querySelector(".timeline"),badge=result?.querySelector(".status-badge");
    if(!timeline||timeline.dataset.auditReady==="true")return;
    const text=(badge?.textContent||"").toLowerCase();
    let current=0;
    if(/pago en revisión/.test(text))current=1;
    else if(/en proceso|falta información|listo para entregar/.test(text))current=2;
    else if(/finalizado/.test(text))current=3;
    const labels=["Solicitud","Pago","En gestión","Finalizado"];
    timeline.innerHTML=labels.map((label,i)=>`<div class="timeline-item ${i<current?"done":""} ${i===current?"current":""}"><span class="timeline-dot" aria-hidden="true"></span><div><strong>${label}</strong>${i===current?"<small>Estado actual</small>":""}</div></div>`).join("");
    timeline.dataset.auditReady="true";
  }

  function linkOpinion(){
    const link=document.querySelector(".final-opinion-cta a"),code=document.querySelector(".tracking-result .status-header .eyebrow")?.textContent?.trim();
    if(link&&code){
      const target="opiniones.html?codigo="+encodeURIComponent(code);
      if(link.getAttribute("href")!==target)link.href=target;
    }
  }

  function friendlyErrors(){
    document.querySelectorAll(".form-error").forEach(error=>{
      if(/quota|exceeded|storage|almacenamiento/i.test(error.textContent||"")){
        const text="No pudimos guardar el archivo en este dispositivo. Probá con una imagen más liviana o volvé a seleccionarla.";
        if(error.textContent!==text)error.textContent=text;
      }
    });
  }

  function showSafeError(){
    if(document.querySelector(".tramipago-error-box"))return;
    const box=document.createElement("div");
    box.className="tramipago-error-box";
    box.innerHTML='<div class="tramipago-error-card" role="alert"><h2>No pudimos completar esta acción</h2><p>Lo que ya fue guardado no se modificó. Podés volver a intentar o regresar al inicio.</p><div class="tramipago-error-actions"><button class="button button-primary" type="button" data-error-retry>Reintentar</button><a class="button button-secondary" href="#/">Ir al inicio</a></div></div>';
    document.body.appendChild(box);
  }

  function enhanceApp(){
    pairEmails();
    normalizeButtons();
    tidyPayment();
    showExistingFiles();
    restoreDraft();
    clearDraftWhenSaved();
    simplifyStepper();
    simplifyTimeline();
    linkOpinion();
    friendlyErrors();
  }

  document.addEventListener("input",e=>{
    const form=e.target.closest?.("#data-form");
    if(form)saveDraft(form);
    if(e.target.matches?.("input,select,textarea"))validateField(e.target);
  });

  document.addEventListener("change",e=>{
    const form=e.target.closest?.("#data-form");
    if(form)saveDraft(form);
  });

  document.addEventListener("submit",e=>{
    const form=e.target;
    if(!validateBasics(form)){
      e.preventDefault();
      e.stopImmediatePropagation();
      showInvalidSubmit(form);
    }
  },true);

  document.addEventListener("click",e=>{
    const submit=e.target.closest?.('form button[type="submit"]');
    if(submit){
      const form=submit.closest("form");
      if(showInvalidSubmit(form)){
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
    }
    const back=e.target.closest?.('#payment-form [data-action="back-step"]');
    if(back){
      const receipt=document.querySelector('#payment-form input[name="receipt"]');
      if(receipt?.files?.length&&!window.confirm("El comprobante todavía no fue enviado. Si modificás los datos tendrás que seleccionarlo nuevamente. ¿Querés continuar?")){
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
    }
    if(e.target.closest?.("[data-error-retry]")){
      document.querySelector(".tramipago-error-box")?.remove();
      location.reload();
    }
  },true);

  window.addEventListener("error",event=>{if(event?.error)showSafeError();});
  window.addEventListener("unhandledrejection",()=>showSafeError());

  addStyles();
  buildFooter();

  let enhanceQueued=false;
  function queueEnhance(){
    if(enhanceQueued)return;
    enhanceQueued=true;
    window.requestAnimationFrame(()=>{
      enhanceQueued=false;
      enhanceApp();
    });
  }

  if(app)new MutationObserver(queueEnhance).observe(app,{childList:true,subtree:true});
  window.addEventListener("hashchange",queueEnhance);
  enhanceApp();
})();
