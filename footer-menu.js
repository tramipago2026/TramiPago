(function(){
  "use strict";

  const DRAFT_PREFIX="tramipago_draft_";

  if(window.TRAMI_CONFIG){
    window.TRAMI_CONFIG.alias="TRAMIPAGO";
  }

  function buildFooter(){
    const footer=document.querySelector('.site-footer');
    const inner=footer?.querySelector('.footer-inner');
    if(!footer||!inner||inner.dataset.footerReady==='true') return;
    inner.dataset.footerReady='true';
    inner.innerHTML=`
      <div class="footer-menu-grid">
        <section class="footer-menu-col"><h3>TRAMIPAGO</h3><a href="tramites.html#como-funciona">Cómo funciona</a><a href="tramites.html">Todos los trámites</a><a href="opiniones.html">Opiniones</a></section>
        <section class="footer-menu-col"><h3>TRÁMITES</h3><a href="#/tramite/antecedentes-penales">Antecedentes Penales</a><a href="#/tramite/constancias-anses">ANSES</a><a href="#/tramite/informe-vehicular">Informe vehicular</a><a href="#/tramite/arba-inmobiliario">ARBA / Inmobiliario</a></section>
        <section class="footer-menu-col"><h3>ATENCIÓN</h3><a href="contacto.html">Contacto</a><a href="#/seguimiento">Estado del trámite</a><a href="https://wa.me/5491167083232" target="_blank" rel="noopener noreferrer">WhatsApp 11 6708-3232</a></section>
        <section class="footer-menu-col"><h3>LEGAL</h3><a href="politica-privacidad.html">Política de Privacidad</a><a href="terminos-condiciones.html">Términos y Condiciones</a><a href="arrepentimiento.html">BOTÓN DE ARREPENTIMIENTO</a><a href="baja-servicio.html">BOTÓN DE BAJA DE SERVICIO</a><a href="https://autogestion.produccion.gob.ar/consumidores" target="_blank" rel="noopener noreferrer">Defensa del Consumidor</a></section>
      </div>
      <div class="footer-menu-bottom"><span>© 2026 TramiPago · Todos los derechos reservados</span><span>CUIT 20-25988733-0 · tramipago@gmail.com</span></div>`;
  }

  function addStyles(){
    if(document.getElementById('tramipago-footer-menu-styles')) return;
    const style=document.createElement('style');
    style.id='tramipago-footer-menu-styles';
    style.textContent=`
      .site-footer{padding:24px 0 12px!important;background:#082A47!important}.site-footer .footer-inner{display:block!important;width:min(1180px,calc(100% - clamp(30px,6vw,96px)))!important;max-width:none!important;margin-inline:auto!important;padding-inline:0!important}.footer-menu-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));column-gap:clamp(26px,5vw,78px);row-gap:22px;width:100%;align-items:start}.footer-menu-col{min-width:0;text-align:left}.footer-menu-col h3{margin:0 0 8px;color:#fff;font-size:10.5px;font-weight:650;letter-spacing:.02em}.footer-menu-col a,.footer-menu-col span{display:block;margin:4px 0;color:rgba(255,255,255,.82);font-size:9.5px;font-weight:400;line-height:1.35;text-decoration:none;overflow-wrap:anywhere}.footer-menu-col a:hover,.footer-menu-col a:focus-visible{color:#29B6F6;text-decoration:underline;text-underline-offset:2px}.footer-menu-bottom{display:flex;justify-content:space-between;align-items:center;gap:18px;flex-wrap:wrap;width:100%;margin-top:18px;padding-top:10px;border-top:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.68);font-size:9px;font-weight:400;line-height:1.3}
      .payment-access{display:none!important}.payment-access-v2{grid-template-columns:minmax(220px,.85fr) minmax(320px,1.35fr)!important;gap:16px!important;align-items:stretch!important}.payment-method-card{display:flex!important;flex-direction:column!important;justify-content:flex-start!important;background:#f8fbfd!important;border:1px solid #c8dae5!important;box-shadow:none!important}.payment-method-card h3{font-size:1.02rem!important;margin-bottom:10px!important}.payment-qr-image{width:190px!important;height:190px!important;margin:0 auto 10px!important;padding:4px!important;border:0!important;background:transparent!important}.payment-data-row{grid-template-columns:86px minmax(0,1fr) auto!important}.payment-data-row span{font-size:.78rem!important}.payment-data-row strong{font-size:.9rem!important}.payment-copy{min-height:30px!important;box-shadow:none!important}
      .email-pair{grid-column:1/-1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px 16px}.email-pair>.field{min-width:0}.button.button-primary,.step-actions .button-primary{background:#1B6FA8!important;color:#fff!important;border-color:#050505!important}.button.button-primary:hover,.button.button-primary:focus-visible,.step-actions .button-primary:hover,.step-actions .button-primary:focus-visible{background:#12537e!important}.main-nav button.nav-help{background:#25D366!important;color:#082A47!important}.main-nav button.nav-help:hover,.main-nav button.nav-help:focus-visible{background:#1fb657!important;color:#fff!important}
      .tramipago-error-box{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(8,42,71,.42)}.tramipago-error-card{width:min(460px,100%);padding:22px;border-radius:12px;background:#fff;border:1px solid #c8dae5;box-shadow:0 18px 48px rgba(0,0,0,.22);text-align:center}.tramipago-error-card h2{margin:0 0 8px;color:#082A47}.tramipago-error-actions{display:flex;gap:10px;justify-content:center;margin-top:16px;flex-wrap:wrap}
      .timeline.timeline-simple .timeline-item{min-height:54px}.draft-restored-note{grid-column:1/-1;margin:0 0 4px;padding:8px 10px;border:1px solid #b8dbef;border-radius:8px;background:#eef8ff;color:#103b68;font-size:.78rem}.field input:invalid.user-touched,.field select:invalid.user-touched,.field textarea:invalid.user-touched{border-color:#b42318!important;box-shadow:0 0 0 2px rgba(180,35,24,.08)!important}
      @media(max-width:900px){.site-footer .footer-inner{width:min(720px,calc(100% - 36px))!important}.footer-menu-grid{grid-template-columns:repeat(2,minmax(0,1fr));column-gap:clamp(30px,9vw,90px)}}@media(max-width:760px){.payment-access-v2,.email-pair{grid-template-columns:1fr!important}}@media(max-width:520px){.site-footer .footer-inner{width:calc(100% - 30px)!important}.footer-menu-grid{grid-template-columns:1fr;row-gap:18px}.footer-menu-bottom{display:block}.footer-menu-bottom span{display:block;margin-top:4px}}
    `;
    document.head.appendChild(style);
  }

  function pairEmails(){
    const email=document.querySelector('input[name="email"]');const confirm=document.querySelector('input[name="emailConfirm"]');const emailField=email?.closest('.field');const confirmField=confirm?.closest('.field');const grid=emailField?.closest('.form-grid');if(!emailField||!confirmField||!grid||emailField.parentElement?.classList.contains('email-pair')) return;const pair=document.createElement('div');pair.className='email-pair';grid.insertBefore(pair,emailField);pair.append(emailField,confirmField);
  }

  function tidyPayment(){
    if(window.TRAMI_CONFIG) window.TRAMI_CONFIG.alias='TRAMIPAGO';
    const payment=document.querySelector('.payment-access-v2');if(!payment) return;const cards=payment.querySelectorAll('.payment-method-card');
    if(cards[0]){const title=cards[0].querySelector('h3');if(title) title.textContent='Pago por QR';const small=cards[0].querySelector('small');if(small) small.textContent='Escaneá el QR desde tu banco o billetera.';}
    if(cards[1]){const title=cards[1].querySelector('h3');if(title) title.textContent='Pago por transferencia';cards[1].querySelectorAll('.payment-data-row').forEach(row=>{const label=row.querySelector('span');const value=row.querySelector('strong');if(label&&/alias/i.test(label.textContent||'')){if(value)value.textContent='TRAMIPAGO';const button=row.querySelector('[data-copy-payment]');if(button)button.setAttribute('data-copy-payment','TRAMIPAGO');}});}
    const back=document.querySelector('#payment-form [data-action="back-step"]');if(back)back.textContent='Volver a datos';
  }

  function linkOpinion(){
    const link=document.querySelector('.final-opinion-cta a');const code=document.querySelector('.tracking-result .status-header .eyebrow')?.textContent?.trim();if(link&&code)link.href=`opiniones.html?codigo=${encodeURIComponent(code)}`;
  }

  function simplifyProcessStepper(){
    const stepper=document.querySelector('.stepper');if(!stepper||stepper.dataset.simple==='true')return;const steps=[...stepper.querySelectorAll('.step')];if(steps.length===4){if(steps[0].classList.contains('current'))steps[1].classList.add('current');steps[0].remove();const visible=[...stepper.querySelectorAll('.step')];const labels=['Datos','Pago','Finalización'];visible.forEach((step,index)=>{const label=step.querySelector('span:last-child');const number=step.querySelector('.step-number');if(label)label.textContent=labels[index];if(number&&!number.textContent.includes('✓'))number.textContent=String(index+1);});stepper.style.gridTemplateColumns='repeat(3,1fr)';}else if(steps.length===3){const labels=['Datos','Pago','Finalización'];steps.forEach((step,index)=>{const label=step.querySelector('span:last-child');if(label)label.textContent=labels[index];});}stepper.dataset.simple='true';
  }

  function simplifyTrackingTimeline(){
    const result=document.querySelector('.tracking-result');const timeline=result?.querySelector('.timeline');const badge=result?.querySelector('.status-badge');if(!timeline||timeline.dataset.simple==='true')return;const text=(badge?.textContent||'').toLowerCase();let current=0;if(/pago en revisión/.test(text))current=1;else if(/en proceso|falta información|listo para entregar/.test(text))current=2;else if(/finalizado/.test(text))current=3;else current=0;const labels=['Solicitud','Pago','En gestión','Finalizado'];timeline.classList.add('timeline-simple');timeline.innerHTML=labels.map((label,index)=>`<div class="timeline-item ${index<current?'done':''} ${index===current?'current':''}"><span class="timeline-dot" aria-hidden="true"></span><div><strong>${label}</strong>${index===current?'<small>Estado actual</small>':''}</div></div>`).join('');timeline.dataset.simple='true';
  }

  function serviceKey(){const match=(location.hash||'').match(/^#\/tramite\/([^/?]+)/);return match?`${DRAFT_PREFIX}${match[1]}`:'';}

  function saveDraft(form){
    const key=serviceKey();if(!key||!form||form.id!=='data-form')return;const data={};form.querySelectorAll('input,select,textarea').forEach(el=>{if(!el.name||el.type==='file'||el.type==='password')return;if(el.type==='checkbox'||el.type==='radio'){if(el.type==='checkbox')data[el.name]=el.checked;else if(el.checked)data[el.name]=el.value;}else data[el.name]=el.value;});try{sessionStorage.setItem(key,JSON.stringify(data));}catch(_){}
  }

  function restoreDraft(){
    const form=document.getElementById('data-form');const key=serviceKey();if(!form||!key||form.dataset.draftRestored==='true')return;form.dataset.draftRestored='true';let data=null;try{data=JSON.parse(sessionStorage.getItem(key)||'null');}catch(_){data=null;}if(!data||typeof data!=='object')return;let restored=false;Object.entries(data).forEach(([name,value])=>{const field=form.elements.namedItem(name);if(!field)return;if(field instanceof RadioNodeList){[...field].forEach(el=>{if(el.type==='radio')el.checked=String(el.value)===String(value);});restored=true;return;}if(field.type==='checkbox'){field.checked=Boolean(value);restored=true;return;}if(!field.value&&value){field.value=String(value);restored=true;}});if(restored){const grid=form.querySelector('.form-grid');if(grid&&!grid.querySelector('.draft-restored-note')){const note=document.createElement('div');note.className='draft-restored-note';note.textContent='Recuperamos los datos que habías escrito en esta sesión.';grid.prepend(note);}}
  }

  function clearDraftOnPayment(){if(!document.getElementById('payment-form'))return;const key=serviceKey();if(key)try{sessionStorage.removeItem(key);}catch(_){} }

  function setValidity(input,message){input.setCustomValidity(message||'');if(message)input.classList.add('user-touched');}

  function validateField(input){
    if(!input?.name)return true;const raw=String(input.value||'').trim();const digits=raw.replace(/\D/g,'');let message='';
    if(input.name==='cuil'&&raw&&digits.length!==11)message='Ingresá un CUIL de 11 dígitos.';
    if(input.name==='dni'&&raw&&(digits.length<7||digits.length>9))message='Ingresá un DNI válido.';
    if(input.name==='whatsapp'&&raw&&(digits.length<10||digits.length>11))message='Ingresá un WhatsApp con código de área, sin +54 9.';
    if(['fullName','fatherFullName','motherFullName'].includes(input.name)&&raw&&!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2}/.test(raw))message='Revisá este nombre.';
    if(input.name==='birthDate'&&raw){const date=new Date(`${raw}T12:00:00`);if(!Number.isFinite(date.getTime())||date>new Date())message='Revisá la fecha de nacimiento.';else if(location.hash.includes('antecedentes-penales')){const now=new Date();let age=now.getFullYear()-date.getFullYear();const m=now.getMonth()-date.getMonth();if(m<0||(m===0&&now.getDate()<date.getDate()))age--;if(age<18)message='Para este trámite tenés que ser mayor de 18 años.';}}
    setValidity(input,message);return !message;
  }

  function validateFormBasics(form){
    if(!form||!['data-form','correction-form'].includes(form.id))return true;let ok=true;form.querySelectorAll('input,select,textarea').forEach(input=>{if(!validateField(input))ok=false;});const email=form.querySelector('input[name="email"]');const confirm=form.querySelector('input[name="emailConfirm"]');if(email&&confirm&&email.value.trim()&&confirm.value.trim()&&email.value.trim().toLowerCase()!==confirm.value.trim().toLowerCase()){setValidity(confirm,'Los correos electrónicos no coinciden.');ok=false;}return ok;
  }

  function friendlyErrors(){document.querySelectorAll('.form-error.visible,.form-error').forEach(error=>{const text=error.textContent||'';if(/quota|exceeded|storage|almacenamiento/i.test(text))error.textContent='No pudimos guardar el archivo en este dispositivo. Probá con una imagen más liviana o volvé a cargarla.';});}

  function showSafeError(){
    if(document.querySelector('.tramipago-error-box')) return;const box=document.createElement('div');box.className='tramipago-error-box';box.innerHTML=`<div class="tramipago-error-card" role="alert"><h2>No pudimos completar esta acción</h2><p>Los datos que ya guardaste no se modificaron. Podés volver a intentar o regresar al inicio.</p><div class="tramipago-error-actions"><button class="button button-primary" type="button" data-error-retry>Reintentar</button><a class="button button-secondary" href="#/">Volver al inicio</a></div></div>`;document.body.appendChild(box);box.querySelector('[data-error-retry]')?.addEventListener('click',()=>location.reload());
  }

  function enhance(){buildFooter();pairEmails();tidyPayment();linkOpinion();simplifyTrackingTimeline();restoreDraft();clearDraftOnPayment();friendlyErrors();}

  addStyles();buildFooter();
  document.addEventListener('input',event=>{const input=event.target.closest?.('#data-form input,#data-form select,#data-form textarea');if(input){input.classList.add('user-touched');validateField(input);saveDraft(input.form);}});
  document.addEventListener('change',event=>{const input=event.target.closest?.('#data-form input,#data-form select,#data-form textarea');if(input){input.classList.add('user-touched');validateField(input);saveDraft(input.form);}});
  document.addEventListener('submit',event=>{const form=event.target;if(!validateFormBasics(form)){event.preventDefault();event.stopImmediatePropagation();const error=form.querySelector('.form-error');if(error){error.textContent='Revisá los datos marcados antes de continuar.';error.classList.add('visible');}form.querySelector(':invalid')?.focus();return;}const submit=form.querySelector('button[type="submit"]');if(submit&&!submit.disabled){setTimeout(()=>{submit.disabled=true;},0);setTimeout(()=>{if(document.body.contains(submit))submit.disabled=false;},3500);}},true);
  new MutationObserver(()=>requestAnimationFrame(enhance)).observe(document.body,{childList:true,subtree:true});
  window.addEventListener('error',event=>{if(event?.error) showSafeError();});window.addEventListener('unhandledrejection',()=>showSafeError());enhance();
})();