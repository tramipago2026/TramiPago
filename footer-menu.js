(function(){
  "use strict";

  const app=document.getElementById("app");
  const DRAFT_PREFIX="tramipago_draft_";
  const REQUESTS_KEY="tramipago_requests_v1";
  const ACTIVE_REQUEST_KEY="tramipago_active_request_v1";
  const DRAFT_MAX_AGE=7*24*60*60*1000;
  const MAX_UPLOAD_BYTES=Math.min(10485760,Number(window.TRAMI_CONFIG?.maxLocalFileBytes||10485760));
  const ALLOWED_FILE_TYPES=new Set(["image/jpeg","image/png","image/webp","application/pdf"]);
  const DRAFT_FILES_DB="tramipago_draft_files_v1";

  function readJSON(storage,key,fallback){
    try{const raw=storage.getItem(key);return raw?JSON.parse(raw):fallback;}catch(_){return fallback;}
  }

  function currentServiceId(){
    const match=(location.hash||"").match(/^#\/tramite\/([^/?]+)/);
    return match?match[1]:"";
  }

  function draftKey(){const id=currentServiceId();return id?DRAFT_PREFIX+id:"";}

  function activeRequest(){
    const ref=readJSON(localStorage,ACTIVE_REQUEST_KEY,null);
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
        <section class="footer-menu-col"><h3>TRÁMITES</h3><a href="index.html#/tramite/antecedentes-penales">Antecedentes Penales</a><a href="index.html#/tramite/constancias-anses">ANSES</a><a href="index.html#/familia/arca-monotributo">ARCA</a><a href="index.html#/tramite/informe-vehicular">Informe Vehicular</a><a href="index.html#/tramite/arba-inmobiliario">ARBA / Inmobiliario</a><a href="index.html#/familia/partidas-pba">Partidas</a><a href="index.html#/tramite/asistencia-digital">Asistencia Digital</a></section>
        <section class="footer-menu-col"><h3>ATENCIÓN</h3><a href="contacto.html">Contacto</a><a href="index.html#/seguimiento">Estado del trámite</a><a href="https://wa.me/5491167083232?text=Hola%2C%20necesito%20ayuda%20con%20TramiPago." target="_blank" rel="noopener noreferrer">WhatsApp</a></section>
        <section class="footer-menu-col"><h3>LEGAL</h3><a href="politica-privacidad.html">Política de Privacidad</a><a href="terminos-condiciones.html">Términos y Condiciones</a><a href="arrepentimiento.html">BOTÓN DE ARREPENTIMIENTO</a><a href="baja-servicio.html">BOTÓN DE BAJA DE SERVICIO</a><a href="https://www.argentina.gob.ar/servicio/iniciar-un-reclamo-ante-defensa-del-consumidor" target="_blank" rel="noopener noreferrer">Defensa del Consumidor</a></section>
      </div>
      <div class="footer-menu-bottom"><span>© 2026 TramiPago · Todos los derechos reservados</span><span>CUIT 20-25988733-0 · tramipago@gmail.com</span></div>`;
  }

  function addStyles(){
    if(document.getElementById("tramipago-audit-styles"))return;
    const style=document.createElement("style");
    style.id="tramipago-audit-styles";
    style.textContent=`
      html,body{background:#eaf2f7!important}.site-main{background:radial-gradient(circle at 88% 10%,rgba(41,182,246,.10),transparent 24%),linear-gradient(180deg,#e7f2f8 0%,#f2f7fa 54%,#eaf3f8 100%)!important}
      .home-hero-clean{background:linear-gradient(180deg,#f6fbfe 0%,#eaf2f7 100%)!important}
      .home-catalog,.process-shell,.family-page,.tracking-page{background:transparent!important}
      .panel,.family-heading,.family-service-card{background:#fbfdff!important}
      .service-summary-block{background:#f3f8fb!important}
      .button.button-primary,.family-service-card .button.button-primary{color:#fff!important;background:#23A85D!important;border:2px solid #050505!important;box-shadow:0 4px 9px rgba(5,5,5,.28)!important;cursor:pointer!important}
      .button.button-primary:hover,.button.button-primary:focus-visible,.family-service-card .button.button-primary:hover,.family-service-card .button.button-primary:focus-visible{color:#fff!important;background:#126B3A!important;border-color:#fff!important;box-shadow:0 0 0 3px rgba(35,168,93,.24),0 5px 11px rgba(5,5,5,.28)!important;outline:none!important;transform:translateY(-1px)!important}
      .button.button-secondary{color:#082A47!important;background:#dceef8!important;border:2px solid #050505!important;box-shadow:0 4px 9px rgba(5,5,5,.22)!important;cursor:pointer!important}
      .button.button-secondary:hover,.button.button-secondary:focus-visible{color:#fff!important;background:#082A47!important;border-color:#29B6F6!important;box-shadow:0 0 0 3px rgba(41,182,246,.24),0 5px 11px rgba(5,5,5,.28)!important;outline:none!important;transform:translateY(-1px)!important}
      .button[aria-busy="true"]{cursor:progress!important;opacity:.78!important;transform:none!important}
      .process-container{max-width:1040px!important}.process-top{margin-bottom:10px!important}.process-title h1{font-size:clamp(1.45rem,2.5vw,2rem)!important}.process-title p{font-size:.88rem!important;line-height:1.4!important}.process-content>.panel{padding:16px 18px!important}.panel-header{margin-bottom:10px!important}.panel-header h2{font-size:1.15rem!important}.panel-header p{font-size:.86rem!important}.service-summary{gap:8px!important;margin:10px 0!important}.service-summary-block{padding:9px 11px!important}.service-summary-block h3{font-size:.85rem!important;margin-bottom:5px!important}.service-summary-block li,.service-summary-option,.service-summary-row{font-size:.78rem!important;line-height:1.35!important}.form-grid{gap:9px 14px!important}.field label,.choice-field legend{font-size:.82rem!important}.form-control,.form-select{min-height:39px!important;padding:7px 9px!important;font-size:.88rem!important}.form-check{padding:7px 9px!important}.form-check-label,.privacy-help{font-size:.78rem!important;line-height:1.35!important}.step-actions{position:relative!important;z-index:2!important;margin-top:12px!important}.step-actions .button{min-height:40px!important}.stepper{margin:8px 0 12px!important}
      .payment-access{display:none!important}.payment-access-v2{grid-template-columns:minmax(210px,.78fr) minmax(300px,1.22fr)!important;gap:13px!important;margin:10px 0 12px!important}.payment-method-card{padding:12px!important;background:#f6fafc!important}.payment-method-card h3{margin-bottom:7px!important;font-size:.95rem!important}.payment-data-row{grid-template-columns:78px minmax(0,1fr) auto!important;padding:6px 0!important}.payment-data-row span{font-size:.75rem!important}.payment-data-row strong{font-size:.86rem!important}.payment-copy{min-height:28px!important;padding:3px 7px!important;box-shadow:none!important}
      .email-pair{grid-column:1/-1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px 14px}.email-pair>.field{min-width:0}.existing-file-note,.draft-restored-note,.payment-back-warning,.draft-save-status{display:block;margin-top:5px;padding:6px 8px;border-radius:7px;background:#eef8ff;border:1px solid #b8dbef;color:#103b68;font-size:.72rem;line-height:1.35}.draft-save-status{grid-column:1/-1;margin:0 0 4px}.draft-save-status.is-saved{background:#effaf4;border-color:#a8dfbd;color:#124c2d}.existing-file-note strong{overflow-wrap:anywhere}.field input:invalid.user-touched,.field select:invalid.user-touched,.field textarea:invalid.user-touched{border-color:#b42318!important;box-shadow:0 0 0 2px rgba(180,35,24,.12)!important}.field-error{display:none;margin-top:4px;color:#a51f2d;font-size:.72rem;font-weight:700;line-height:1.3}.field-error.visible{display:block}.form-error.visible{display:block!important}
      .form-stage-meta{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 2px;padding:7px 9px;background:#f3f8fb;border:1px solid #d2e3ec;border-radius:8px;color:#607789;font-size:.75rem}.form-stage-meta strong{color:#082A47}.form-stage-controls{display:flex;justify-content:space-between;gap:10px;margin-top:12px}.form-stage-controls .button{width:auto!important;min-width:130px!important}.form-grid>[data-form-stage]:not(.is-current-stage){display:none!important}.payment-total-emphasis{background:#effaf4!important;border:2px solid #23A85D!important}.payment-total-emphasis strong{font-size:1.2rem!important;color:#126B3A!important}
      .site-footer{padding:12px 0 8px!important;background:#082A47!important}.site-footer .footer-inner{display:block!important;width:min(1180px,calc(100% - clamp(30px,6vw,96px)))!important;max-width:none!important;margin-inline:auto!important;padding-inline:0!important}.footer-menu-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));column-gap:clamp(26px,5vw,78px);row-gap:18px;width:100%;align-items:start}.footer-menu-col{min-width:0;text-align:left}.footer-menu-col h3{margin:0 0 5px;color:#fff;font-size:10.5px;font-weight:650}.footer-menu-col a{display:block;margin:2px 0;color:rgba(255,255,255,.82);font-size:9.5px;font-weight:400;line-height:1.35;text-decoration:none;overflow-wrap:anywhere}.footer-menu-col a:hover,.footer-menu-col a:focus-visible{color:#29B6F6;text-decoration:underline;text-underline-offset:2px}.footer-menu-bottom{display:flex;justify-content:space-between;gap:18px;flex-wrap:wrap;width:100%;margin-top:10px;padding-top:6px;border-top:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.68);font-size:9px;line-height:1.3}
      .tramipago-error-box{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(8,42,71,.42)}.tramipago-error-card{width:min(460px,100%);padding:22px;border-radius:12px;background:#fff;border:1px solid #c8dae5;box-shadow:0 18px 48px rgba(0,0,0,.22);text-align:center}.tramipago-error-actions{display:flex;gap:10px;justify-content:center;margin-top:16px;flex-wrap:wrap}
      @media(max-width:900px){.site-footer .footer-inner{width:min(720px,calc(100% - 36px))!important}.footer-menu-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.service-summary{grid-template-columns:1fr!important}}
      @media(max-width:760px){.payment-access-v2,.email-pair{grid-template-columns:1fr!important}.process-content>.panel{padding:14px!important}.form-grid{grid-template-columns:1fr!important}}
      @media(max-width:520px){.footer-menu-grid{grid-template-columns:1fr;row-gap:14px}.footer-menu-bottom{display:block}.footer-menu-bottom span{display:block;margin-top:4px}}
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
    setTextIfDifferent(form?.querySelector('button[type="submit"]'),"Siguiente");
    const eligibility=document.querySelector("#eligibility-form");
    eligibility?.querySelector('[data-action="back-step"]')?.remove();
    const pay=document.querySelector("#payment-form");
    setTextIfDifferent(pay?.querySelector('[data-action="back-step"]'),"Modificar datos");
    setTextIfDifferent(pay?.querySelector('button[type="submit"]'),"Informar pago");
    document.querySelectorAll('.process-top [data-action="back-home"],.family-page .family-back[data-action="back-home"],.ineligible-panel [data-action="back-home"]').forEach(el=>el.remove());
  }

  function tidyPayment(){
    const form=document.getElementById("payment-form");
    const payment=document.querySelector(".payment-access-v2");
    if(payment){
      const cards=payment.querySelectorAll(".payment-method-card");
      setTextIfDifferent(cards[0]?.querySelector("h3"),"Pago por transferencia");
      if(form&&payment.nextElementSibling!==form)form.insertAdjacentElement("beforebegin",payment);
    }
    const panel=form?.closest(".panel");
    const items=panel?.querySelectorAll(".summary-item");
    if(items?.length)items[items.length-1].classList.add("payment-total-emphasis");
    panel?.querySelectorAll(".notice").forEach(note=>{
      if(/datos de pago:/i.test(note.textContent||""))note.remove();
    });
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

  function openDraftFilesDb(){
    return new Promise((resolve,reject)=>{
      if(!window.indexedDB)return reject(new Error("IndexedDB no disponible"));
      const request=indexedDB.open(DRAFT_FILES_DB,1);
      request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains("files"))request.result.createObjectStore("files",{keyPath:"key"});};
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error||new Error("No se pudo abrir el guardado local"));
    });
  }

  async function saveDraftFile(input){
    const serviceId=currentServiceId(),file=input?.files?.[0];
    if(!serviceId||!input?.name)return;
    try{
      const db=await openDraftFilesDb();
      const tx=db.transaction("files","readwrite");
      const store=tx.objectStore("files");
      const key=serviceId+":"+input.name;
      if(file)store.put({key,serviceId,name:input.name,fileName:file.name,type:file.type,lastModified:file.lastModified,savedAt:Date.now(),blob:file});
      else store.delete(key);
      await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
      db.close();
    }catch(_){}
  }

  async function restoreDraftFiles(form){
    if(!form||form.id!=="data-form"||form.dataset.filesRestored==="true")return;
    form.dataset.filesRestored="true";
    const serviceId=currentServiceId();
    if(!serviceId)return;
    try{
      const db=await openDraftFilesDb();
      for(const input of form.querySelectorAll('input[type="file"][name]')){
        const record=await new Promise((resolve,reject)=>{
          const tx=db.transaction("files","readonly");
          const req=tx.objectStore("files").get(serviceId+":"+input.name);
          req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);
        });
        if(!record)continue;
        if(Date.now()-Number(record.savedAt||0)>DRAFT_MAX_AGE){
          const tx=db.transaction("files","readwrite");tx.objectStore("files").delete(record.key);continue;
        }
        if(record.blob&&window.DataTransfer){
          const file=new File([record.blob],record.fileName||"archivo",{type:record.type||record.blob.type,lastModified:record.lastModified||Date.now()});
          const dt=new DataTransfer();dt.items.add(file);input.files=dt.files;
          const field=input.closest(".field");
          if(field&&!field.querySelector(".draft-file-restored")){
            const note=document.createElement("small");note.className="existing-file-note draft-file-restored";note.textContent="Recuperamos este archivo del avance guardado.";input.insertAdjacentElement("afterend",note);
          }
        }
      }
      db.close();
    }catch(_){}
  }

  async function clearDraftFiles(){
    const service=currentService();
    if(!service)return;
    try{
      const db=await openDraftFilesDb();
      const tx=db.transaction("files","readwrite"),store=tx.objectStore("files");
      for(const field of (service.fields||[]))if(field.type==="file")store.delete(service.id+":"+field.id);
      await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
      db.close();
    }catch(_){}
  }

  function ensureDraftStatus(form){
    if(!form||form.id!=="data-form")return null;
    let note=form.querySelector(".draft-save-status");
    if(!note){
      note=document.createElement("div");
      note.className="draft-save-status";
      note.setAttribute("role","status");
      note.textContent="Guardamos tu avance en este dispositivo mientras completás el trámite.";
      form.querySelector(".form-grid")?.prepend(note);
    }
    return note;
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
    try{
      localStorage.setItem(key,JSON.stringify({version:2,savedAt:Date.now(),serviceId:currentServiceId(),data}));
      const note=ensureDraftStatus(form);
      if(note){
        note.textContent="Avance guardado en este dispositivo.";
        note.classList.add("is-saved");
        clearTimeout(Number(note.dataset.timer||0));
        const timer=window.setTimeout(()=>{if(note.isConnected){note.textContent="Guardamos tu avance en este dispositivo mientras completás el trámite.";note.classList.remove("is-saved");}},1800);
        note.dataset.timer=String(timer);
      }
    }catch(_){}
  }

  function restoreDraft(){
    const form=document.getElementById("data-form"),key=draftKey();
    if(!form||!key||form.dataset.draftRestored==="true")return;
    form.dataset.draftRestored="true";
    ensureDraftStatus(form);
    restoreDraftFiles(form);
    const stored=readJSON(localStorage,key,null);
    if(!stored||typeof stored!=="object")return;
    const savedAt=Number(stored.savedAt||0);
    if(!savedAt||Date.now()-savedAt>DRAFT_MAX_AGE||stored.serviceId!==currentServiceId()){
      try{localStorage.removeItem(key);}catch(_){}
      return;
    }
    const data=stored.data&&typeof stored.data==="object"?stored.data:{};
    let restored=false;
    Object.entries(data).forEach(([name,value])=>{
      const field=form.elements.namedItem(name);
      if(!field)return;
      if(field instanceof RadioNodeList){
        [...field].forEach(el=>{if(el.type==="radio")el.checked=String(el.value)===String(value);});
        restored=true;
      }else if(field.type==="checkbox"){
        field.checked=Boolean(value);restored=true;
      }else if(!field.value&&value!==undefined&&value!==null&&String(value)!==""){
        field.value=String(value);restored=true;
      }
    });
    if(restored&&!form.querySelector(".draft-restored-note")){
      const note=document.createElement("div");
      note.className="draft-restored-note";
      note.textContent="Recuperamos el avance que habías guardado en este dispositivo.";
      form.querySelector(".form-grid")?.prepend(note);
      form.dispatchEvent(new Event("input",{bubbles:true}));
    }
  }

  function clearDraftWhenSaved(){
    if(!document.getElementById("payment-form"))return;
    const key=draftKey();
    if(key)try{localStorage.removeItem(key);}catch(_){}
    clearDraftFiles();
  }

  function fieldErrorNode(input){
    const field=input?.closest?.(".field,.choice-field,.form-check");
    if(!field)return null;
    let error=field.querySelector(":scope > .field-error");
    if(!error){
      error=document.createElement("small");
      error.className="field-error";
      error.setAttribute("role","alert");
      field.appendChild(error);
    }
    return error;
  }

  function setValidity(input,message){
    if(!input?.setCustomValidity)return;
    input.setCustomValidity(message||"");
    const error=fieldErrorNode(input);
    if(message){
      input.classList.add("user-touched");
      if(error){error.textContent=message;error.classList.add("visible");}
    }else{
      input.classList.remove("user-touched");
      if(error){error.textContent="";error.classList.remove("visible");}
    }
  }

  function validTaxId(digits){
    if(!/^\d{11}$/.test(digits)||/^(\d)\1{10}$/.test(digits))return false;
    const weights=[5,4,3,2,7,6,5,4,3,2];
    const sum=weights.reduce((acc,w,i)=>acc+Number(digits[i])*w,0);
    const mod=11-(sum%11);
    const check=mod===11?0:mod===10?9:mod;
    return check===Number(digits[10]);
  }

  function validPatent(raw){
    const value=String(raw||"").toUpperCase().replace(/[\s-]/g,"");
    return /^(?:[A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2}|[A-Z]\d{3}[A-Z]{3})$/.test(value);
  }

  function validateField(input){
    if(!input?.name)return true;
    const raw=String(input.value||"").trim(),digits=raw.replace(/\D/g,"");
    let message="";
    if(["cuil","cuit"].includes(input.name)&&raw&&!validTaxId(digits))message="Revisá el CUIL/CUIT: deben ser 11 dígitos y tener un dígito verificador válido.";
    if(input.name==="dni"&&raw&&(!/^\d{7,9}$/.test(digits)))message="Ingresá un DNI de 7 a 9 dígitos.";
    if(input.name==="whatsapp"&&raw&&(digits.length<10||digits.length>11))message="Ingresá código de área y número, sin +54 9.";
    if(input.type==="email"&&raw&&!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw))message="Ingresá un correo electrónico válido.";
    if(["fullName","fatherFullName","motherFullName"].includes(input.name)&&raw&&!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2}/.test(raw))message="Revisá este nombre.";
    if(input.name==="birthDate"&&raw){const d=new Date(raw+"T12:00:00");if(!Number.isFinite(d.getTime())||d>new Date())message="Revisá la fecha de nacimiento.";}
    if(input.name==="patent"&&raw&&!validPatent(raw))message="Ingresá una patente válida, por ejemplo ABC123 o AB123CD.";
    if(input.type==="file"&&input.files?.length){
      const file=input.files[0];
      if(file.size<1)message="El archivo está vacío.";
      else if(file.size>MAX_UPLOAD_BYTES&&!String(file.type||"").startsWith("image/"))message=`El archivo supera el máximo permitido de ${(MAX_UPLOAD_BYTES/1000000).toFixed(1)} MB.`;
      else if(file.type&&!ALLOWED_FILE_TYPES.has(file.type))message="Usá una imagen JPG, PNG, WebP o un PDF.";
    }
    setValidity(input,message);
    return !message;
  }

  function currentService(){
    const id=currentServiceId();
    return (window.TRAMI_SERVICES||[]).find(item=>item.id===id)||null;
  }

  function validateServiceRules(form){
    const service=currentService();
    const rules=service?.rules;
    if(!rules)return "";
    const hasValue=name=>{
      const field=form.elements.namedItem(name);
      if(!field)return false;
      if(field instanceof RadioNodeList)return [...field].some(el=>el.checked&&String(el.value||"").trim());
      if(field.type==="file")return Boolean(field.files?.length)||Boolean(activeRequest()?.answers?.[name]?.name);
      if(field.type==="checkbox")return field.checked;
      return Boolean(String(field.value||"").trim());
    };
    if(Array.isArray(rules.anyOf)&&rules.anyOf.length&&!rules.anyOf.some(hasValue))return rules.message||"Completá al menos una de las opciones requeridas.";
    if(Array.isArray(rules.oneOfGroups)&&rules.oneOfGroups.length&&!rules.oneOfGroups.some(group=>group.every(hasValue)))return rules.message||"Completá una de las alternativas requeridas.";
    return "";
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
    const ruleMessage=validateServiceRules(form);
    const box=form.querySelector(".form-error");
    if(ruleMessage&&box){box.textContent=ruleMessage;box.classList.add("visible");ok=false;}
    return ok;
  }

  function showInvalidSubmit(form){
    if(!form)return false;
    // Revalidar archivos con el archivo actual. Esto limpia errores que pudieron
    // quedar asociados a la imagen original antes de ser optimizada.
    form.querySelectorAll('input[type="file"]').forEach(input=>validateField(input));
    if(form.checkValidity())return false;
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

  function lockSubmit(form){
    if(!form||!["eligibility-form","data-form","correction-form","payment-form","tracking-form"].includes(form.id))return true;
    if(form.dataset.submitting==="true")return false;
    form.dataset.submitting="true";
    const buttons=[...form.querySelectorAll('button[type="submit"]')];
    buttons.forEach(button=>{button.disabled=true;button.setAttribute("aria-busy","true");});
    let observer=null;
    const unlock=()=>{
      if(observer){observer.disconnect();observer=null;}
      if(!form.isConnected)return;
      form.dataset.submitting="false";
      buttons.forEach(button=>{button.disabled=false;button.removeAttribute("aria-busy");});
    };
    const error=form.querySelector(".form-error");
    if(error){
      observer=new MutationObserver(()=>{
        if(error.classList.contains("visible")&&error.textContent.trim())unlock();
      });
      observer.observe(error,{attributes:true,childList:true,subtree:true,characterData:true});
    }
    window.setTimeout(unlock,10000);
    return true;
  }

  function validateStage(form,index){
    let ok=true;
    form.querySelectorAll(`[data-form-stage="${index}"] input,[data-form-stage="${index}"] select,[data-form-stage="${index}"] textarea`).forEach(el=>{
      validateField(el);
      if(!el.checkValidity()){el.classList.add("user-touched");ok=false;}
    });
    if(!ok){
      const first=form.querySelector(`[data-form-stage="${index}"] :invalid`);
      first?.focus();
      first?.reportValidity?.();
    }
    return ok;
  }

  function showFormStage(form,index){
    const total=Number(form.dataset.stageTotal||1);
    const next=Math.max(0,Math.min(index,total-1));
    form.dataset.stageCurrent=String(next);
    form.querySelectorAll("[data-form-stage]").forEach(node=>node.classList.toggle("is-current-stage",Number(node.dataset.formStage)===next));
    const meta=form.querySelector(".form-stage-meta");
    if(meta)meta.innerHTML=`<strong>Datos del trámite</strong><span>Parte ${next+1} de ${total}</span>`;
    const controls=form.querySelector(".form-stage-controls");
    if(controls){
      controls.querySelector("[data-stage-prev]").hidden=next===0;
      controls.querySelector("[data-stage-next]").hidden=next===total-1;
    }
    const actions=form.querySelector(".step-actions");
    if(actions)actions.hidden=next!==total-1;
  }

  function setupFormStages(){
    const form=document.getElementById("data-form");
    if(!form||form.dataset.stagesReady==="true")return;
    const grid=form.querySelector(".form-grid");
    if(!grid)return;
    const items=[...grid.children].filter(node=>node.matches?.(".field,.choice-field,.form-check,.email-pair")&&!node.classList.contains("draft-save-status")&&!node.classList.contains("draft-restored-note"));
    if(items.length<=10){form.dataset.stagesReady="true";return;}
    const chunk=6,total=Math.ceil(items.length/chunk);
    items.forEach((node,i)=>node.dataset.formStage=String(Math.floor(i/chunk)));
    const meta=document.createElement("div");
    meta.className="form-stage-meta";
    grid.prepend(meta);
    const controls=document.createElement("div");
    controls.className="form-stage-controls";
    controls.innerHTML='<button class="button button-secondary" type="button" data-stage-prev>Anterior</button><button class="button button-primary" type="button" data-stage-next>Continuar</button>';
    const error=form.querySelector(".form-error");
    if(error)error.insertAdjacentElement("beforebegin",controls);else form.appendChild(controls);
    form.dataset.stagesReady="true";
    form.dataset.stageTotal=String(total);
    showFormStage(form,0);
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
    box.innerHTML='<div class="tramipago-error-card" role="alert"><h2>No pudimos completar esta acción</h2><p>Lo que ya fue guardado no se modificó. Podés volver a intentar o regresar al inicio.</p><div class="tramipago-error-actions"><button class="button button-primary" type="button" data-error-retry>Reintentar</button><a class="button button-secondary" href="index.html#/">Ir al inicio</a></div></div>';
    document.body.appendChild(box);
  }

  function enhanceApp(){
    pairEmails();
    normalizeButtons();
    tidyPayment();
    showExistingFiles();
    restoreDraft();
    clearDraftWhenSaved();
    setupFormStages();
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
    if(e.target.matches?.('input[type="file"]'))validateField(e.target);
    const form=e.target.closest?.("#data-form");
    if(form){
      saveDraft(form);
      if(e.target.matches?.('input[type="file"]'))saveDraftFile(e.target);
    }
  });

  document.addEventListener("submit",e=>{
    const form=e.target;
    if(!validateBasics(form)){
      e.preventDefault();
      e.stopImmediatePropagation();
      showInvalidSubmit(form);
      return;
    }
    if(!lockSubmit(form)){
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  },true);

  document.addEventListener("click",e=>{
    const next=e.target.closest?.("[data-stage-next]");
    const prev=e.target.closest?.("[data-stage-prev]");
    if(next||prev){
      const form=(next||prev).closest("#data-form");
      if(form){
        e.preventDefault();
        const current=Number(form.dataset.stageCurrent||0);
        if(next&&!validateStage(form,current))return;
        showFormStage(form,current+(next?1:-1));
        form.scrollIntoView({behavior:"smooth",block:"start"});
      }
      return;
    }
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

  window.addEventListener("error",event=>{if(event?.error){window.TRAMI_REPORT_ERROR?.(event.error,{kind:"window_error"});showSafeError();}});
  window.addEventListener("unhandledrejection",event=>{window.TRAMI_REPORT_ERROR?.(event?.reason||"Promesa rechazada",{kind:"unhandled_rejection"});showSafeError();});

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