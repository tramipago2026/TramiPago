/* Formulario jurídico compacto. No registra datos en localStorage ni genera pagos.
   El tema y los campos son opcionales. WhatsApp abre un mensaje editable: el usuario confirma el envío. */
(function(){
  'use strict';
  const ROUTE='#/familia/atencion-abogado';
  const STYLE_ID='tramipago-legal-landing-style';
  const topics=[
    {id:'art',name:'ART',desc:'Reclamos por accidentes de trabajo, enfermedades profesionales y gestiones ante la ART.'},
    {id:'accidentes',name:'Accidentes',desc:'Asesoramiento legal por accidentes de tránsito, choques y lesiones fuera del ámbito laboral.'},
    {id:'sucesiones',name:'Sucesiones',desc:'Asesoramiento en declaratoria de herederos, inicio y seguimiento del trámite sucesorio.'},
    {id:'laboral',name:'Laboral',desc:'Consultas por despidos, trabajo no registrado, diferencias salariales y otros conflictos laborales.'}
  ];
  function loadStyles(){
    if(!document.getElementById(STYLE_ID)){
      const link=document.createElement('link');link.id=STYLE_ID;link.rel='stylesheet';
      link.href='legal-landing-20260917.css?v=20260917-sinfotos1';document.head.appendChild(link);
    }
    let refresh=document.getElementById('tramipago-legal-visual-refresh');
    if(!refresh){
      refresh=document.createElement('link');refresh.id='tramipago-legal-visual-refresh';refresh.rel='stylesheet';
      refresh.href='legal-design-refresh-20260917.css?v=20260917-centro2';
    }
    /* Los overrides se agregan al final para preservar el diseño general. */
    document.head.appendChild(refresh);
    let photos=document.getElementById('tramipago-legal-photo-hd');
    if(!photos){
      photos=document.createElement('link');photos.id='tramipago-legal-photo-hd';photos.rel='stylesheet';
      photos.href='legal-photos-hd-20260918.css?v=20260918-integrado4';
    }
    document.head.appendChild(photos);
  }
  function composeMessage({topic='',name='',phone='',query=''}){
    const lines=['Hola, quiero iniciar una consulta jurídica mediante TramiPago para el Dr. Francisco Liberatore.'];
    if(topic)lines.push('Tema: '+topic);
    if(name)lines.push('Nombre y apellido: '+name);
    if(phone)lines.push('Teléfono de contacto: '+phone);
    if(query)lines.push('Consulta: '+query);
    if(!topic&&!name&&!phone&&!query)lines.push('Quisiera comunicarme para contar mi caso.');
    return lines.join('\n');
  }
  function renderLanding(){
    if(location.hash!==ROUTE)return;
    const page=document.querySelector('#app .family-page');
    const shell=page?.querySelector('.family-shell');
    if(!page||!shell||page.classList.contains('legal-landing'))return;
    if(!(window.TRAMI_FAMILIES||[]).some(f=>f.id==='atencion-abogado'))return;
    loadStyles();page.classList.add('legal-landing');
    shell.innerHTML=`
      <div class="legal-widget" id="legal-consultation">
        <header class="legal-branding legal-branding-photo">
          <div class="legal-banner-window"><img class="legal-approved-banner" src="assets/abogado-cabecera-fotografica-20260918.png" alt="" width="1774" height="294" fetchpriority="high"></div>
          <div class="legal-identity"><span class="legal-emblem" aria-hidden="true">⚖</span><span>DR. FRANCISCO<br><strong>LIBERATORE</strong><small>ABOGADO</small></span></div>
          <div class="legal-intro"><h1>Consulta con <span>abogado</span></h1><p class="legal-doctor">Dr. Francisco Liberatore</p><p class="legal-specialty">Especialista en reclamos de ART</p><p class="legal-areas">ART · ACCIDENTES · SUCESIONES · LABORAL</p></div>
          <img class="legal-header-art" src="assets/header-consulta-legal-20260917.svg" alt="" width="180" height="100" loading="lazy">
        </header>
        <section class="legal-widget-body" aria-labelledby="legal-topic-title">
          <div class="legal-line"><h2 id="legal-topic-title"><span class="legal-num">1</span> Elegí el tema de tu consulta</h2><p>Opcional: si seleccionás un tema, se incluye en el mensaje.</p></div>
          <div class="legal-topic-grid" role="group" aria-label="Seleccionar un tema opcional">
            ${topics.map(t=>`<article class="legal-topic" data-topic-card="${t.id}"><div class="legal-topic-copy"><h3>${t.name}</h3><p>${t.desc}</p><button type="button" class="legal-topic-select" data-legal-topic="${t.id}" aria-pressed="false">Seleccionar tema</button></div></article>`).join('')}
          </div>
          <form id="legal-whatsapp-form" autocomplete="on" novalidate>
            <div class="legal-line legal-form-line"><h2><span class="legal-num">2</span> Completá tus datos</h2><p>También podés iniciar la consulta sin seleccionar tema ni completar campos.</p></div>
            <div class="legal-inputs">
              <label>Nombre y apellido <span>(opcional)</span><input type="text" name="fullName" autocomplete="name" maxlength="110" placeholder="Nombre y apellido"></label>
              <label>Teléfono <span>(opcional)</span><input type="tel" name="phone" autocomplete="tel" inputmode="tel" maxlength="35" placeholder="Tu teléfono"></label>
              <label class="legal-query-label">Consulta breve <span>(opcional)</span><textarea name="query" rows="2" maxlength="1400" placeholder="Contanos tu situación"></textarea></label>
            </div>
            <button class="legal-send" type="submit">Iniciar consulta <span aria-hidden="true">↗</span></button>
          </form>
        </section>
      </div>`;
    const root=shell.querySelector('#legal-consultation');
    let chosen='';
    root.querySelectorAll('[data-legal-topic]').forEach(button=>button.addEventListener('click',()=>{
      chosen=chosen===button.dataset.legalTopic?'':button.dataset.legalTopic;
      root.querySelectorAll('[data-legal-topic]').forEach(candidate=>{
        const selected=candidate.dataset.legalTopic===chosen;
        candidate.setAttribute('aria-pressed',String(selected));
        candidate.closest('.legal-topic')?.classList.toggle('is-selected',selected);
        candidate.textContent=selected?'Tema seleccionado':'Seleccionar tema';
      });
    }));
    root.querySelector('#legal-whatsapp-form').addEventListener('submit',event=>{
      event.preventDefault();
      const form=event.currentTarget;
      const topic=topics.find(t=>t.id===chosen)?.name||'';
      const number=String(window.TRAMI_CONFIG?.whatsappNumber||'').replace(/\D/g,'');
      if(!number){window.alert('El WhatsApp de TramiPago no está configurado.');return;}
      const message=composeMessage({topic,name:form.elements.fullName.value.trim(),phone:form.elements.phone.value.trim(),query:form.elements.query.value.trim()});
      window.open('https://wa.me/'+number+'?text='+encodeURIComponent(message),'_blank','noopener,noreferrer');
    });
  }
  let queued=false;
  function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;renderLanding();});}
  function init(){
    const app=document.getElementById('app');if(!app)return;
    new MutationObserver(queue).observe(app,{childList:true,subtree:true});
    window.addEventListener('hashchange',queue);queue();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();