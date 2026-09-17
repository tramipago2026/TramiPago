/* Presentación propia para la familia de abogado. Reutiliza los cuatro formularios existentes.
   Sin datos de contacto, fotografías, logotipos ni promesas comerciales de terceros. */
(function(){
  "use strict";
  const ROUTE="#/familia/atencion-abogado";
  const STYLE_ID="tramipago-legal-landing-style";
  const iconPaths={
    work:'<path d="M3 20V8l5-4 5 4v12M13 10h8v10H3M7 12h2M7 16h2M16 14h2"/>',
    road:'<path d="M4 17h16l-2-7H6l-2 7ZM7 17v3M17 17v3M6 10l2-4h8l2 4M8 14h1M15 14h1"/>',
    health:'<path d="M3 12h4l3-7 4 14 3-7h4M7 3h10M7 21h10"/>',
    discharge:'<path d="M7 3h8l4 4v14H5V3h2ZM15 3v5h5M8 12h8M8 16h5"/>',
    amounts:'<path d="M3 7h18v12H3V7ZM3 10h18M7 15h3M15 14h3M7 4h10"/>',
    claim:'<path d="M5 3h14v18H5V3ZM8 8h8M8 12h4M8 16l2 2 5-5"/>'
  };
  const cases=[
    {title:"Accidente en el trabajo",desc:"Consultá por hechos ocurridos durante la jornada o al realizar tus tareas.",icon:"work"},
    {title:"Accidente de ida o vuelta",desc:"Contá lo ocurrido en el trayecto al trabajo o de regreso a casa.",icon:"road"},
    {title:"Enfermedad profesional",desc:"Planteá tu consulta si relacionás un problema de salud con tu actividad laboral.",icon:"health"},
    {title:"Alta médica con dudas",desc:"Un abogado puede revisar tu situación si no estás conforme con el alta.",icon:"discharge"},
    {title:"Oferta de indemnización",desc:"Solicitá que un profesional analice la propuesta y los antecedentes de tu caso.",icon:"amounts"},
    {title:"Rechazo o dificultades con la ART",desc:"Describí el rechazo, la demora o el problema para evaluar las alternativas.",icon:"claim"}
  ];
  const steps=[
    {n:"01",title:"Enviá tu consulta",desc:"Elegí el tema y completá un formulario breve con tus datos de contacto."},
    {n:"02",title:"Coordinación inicial",desc:"TramiPago recibe la solicitud y organiza el contacto con el profesional."},
    {n:"03",title:"Evaluación jurídica",desc:"El abogado estudia la situación y solicita la documentación que resulte necesaria."},
    {n:"04",title:"Próximos pasos",desc:"El profesional explica las alternativas y, cuando corresponda, los honorarios antes de avanzar."}
  ];
  const faqs=[
    {q:"¿Qué necesito para consultar por ART?",a:"Tu nombre, un WhatsApp de contacto y una descripción breve. El abogado indicará si necesita certificados, estudios, datos de la ART u otra documentación."},
    {q:"¿Puedo consultar si tuve un accidente camino al trabajo?",a:"Sí, podés describirlo en el formulario de ART. El profesional evaluará si el hecho encuadra en la cobertura aplicable."},
    {q:"¿Qué sucede si no estoy de acuerdo con el alta o con una oferta?",a:"Podés plantear tu situación. La conveniencia y la vía de cualquier reclamo dependen de los antecedentes y de la evaluación profesional."},
    {q:"¿La consulta genera un pago automático?",a:"No. En esta sección solo enviás una solicitud de contacto. Las condiciones de atención y los honorarios deben confirmarse con el abogado antes de contratar servicios profesionales."},
    {q:"¿Está garantizado el cobro de una indemnización?",a:"No. La procedencia de un reclamo, los plazos y cualquier importe dependen del caso y de las decisiones de los organismos o tribunales competentes."}
  ];
  function icon(key){return '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+iconPaths[key]+'</svg>';}
  function styles(){
    if(document.getElementById(STYLE_ID))return;
    const link=document.createElement("link");
    link.id=STYLE_ID;
    link.rel="stylesheet";
    link.href="legal-landing-20260917.css?v=20260917-legal1";
    document.head.appendChild(link);
  }
  function renderLanding(){
    if(location.hash!==ROUTE)return;
    const app=document.getElementById("app");
    const page=app?.querySelector(".family-page");
    const shell=page?.querySelector(".family-shell");
    const heading=shell?.querySelector(".family-heading");
    const grid=shell?.querySelector(".family-service-grid");
    if(!page||!shell||!heading||!grid||page.classList.contains("legal-landing"))return;
    if(grid.querySelectorAll('[data-service-id^="abogado-"]').length!==4)return;
    styles();
    page.classList.add("legal-landing");
    heading.insertAdjacentHTML("beforebegin",`
      <section class="legal-hero" aria-labelledby="legal-title">
        <div class="legal-hero-copy">
          <span class="legal-eyebrow">Atención jurídica coordinada por TramiPago</span>
          <h1 id="legal-title">Consultas por <span>ART y accidentes laborales</span></h1>
          <p class="legal-hero-lead">Contanos tu situación y coordinamos una consulta con el <strong>Dr. Francisco Liberatore</strong>.</p>
          <p>El abogado analiza cada caso y explica qué alternativas pueden corresponder. TramiPago organiza el contacto; no presta asesoramiento jurídico.</p>
          <div class="legal-hero-actions">
            <button type="button" class="button button-primary legal-primary" data-action="select-service" data-service-id="abogado-art">Consultar por ART</button>
            <button type="button" class="legal-secondary" data-legal-scroll="legal-consultas">Ver otras consultas</button>
          </div>
        </div>
        <div class="legal-hero-visual" aria-hidden="true">
          <img src="assets/header-consulta-legal-20260917.svg" alt="" width="480" height="240" loading="eager"/>
          <div class="legal-hero-visual-label">Consulta profesional · Gestión de contacto</div>
        </div>
      </section>
      <section class="legal-block" aria-labelledby="legal-casos-title">
        <div class="legal-section-head"><span class="legal-eyebrow">Reclamos ante ART</span><h2 id="legal-casos-title">¿Qué situación necesitás consultar?</h2><p>Elegí el motivo que más se parezca al tuyo. Todos estos temas llevan al formulario de ART.</p></div>
        <div class="legal-cases">${cases.map(item=>`<article class="legal-case"><span class="legal-case-icon" aria-hidden="true">${icon(item.icon)}</span><h3>${item.title}</h3><p>${item.desc}</p><button type="button" data-action="select-service" data-service-id="abogado-art">Consultar este tema <span aria-hidden="true">→</span></button></article>`).join("")}</div>
      </section>
      <section class="legal-block legal-choose" id="legal-consultas" aria-labelledby="legal-consultas-title"><div class="legal-section-head"><span class="legal-eyebrow">Otras consultas disponibles</span><h2 id="legal-consultas-title">Elegí la consulta que necesitás</h2><p>ART, accidentes no laborales, sucesiones y consultas laborales. Cada opción abre su propio formulario.</p></div></section>
    `);
    grid.insertAdjacentHTML("afterend",`
      <section class="legal-block legal-process" aria-labelledby="legal-process-title"><div class="legal-section-head"><span class="legal-eyebrow">Cómo funciona</span><h2 id="legal-process-title">De la consulta al contacto con el abogado</h2></div><div class="legal-steps">${steps.map(step=>`<article class="legal-step"><span>${step.n}</span><h3>${step.title}</h3><p>${step.desc}</p></article>`).join("")}</div></section>
      <section class="legal-block legal-faq" aria-labelledby="legal-faq-title"><div class="legal-section-head"><span class="legal-eyebrow">Información útil</span><h2 id="legal-faq-title">Preguntas frecuentes</h2></div><div class="legal-faq-list">${faqs.map(item=>`<details><summary>${item.q}</summary><p>${item.a}</p></details>`).join("")}</div><p class="legal-official">Más información sobre procedimientos ante ART y comisiones médicas: <a href="https://www.argentina.gob.ar/srt" target="_blank" rel="noopener noreferrer">Superintendencia de Riesgos del Trabajo</a>. Sitio oficial externo.</p></section>
      <section class="legal-contact" aria-labelledby="legal-contact-title"><div><span class="legal-eyebrow">Coordinación de consultas</span><h2 id="legal-contact-title">¿Querés consultar tu caso?</h2><p>Completá el formulario correspondiente. TramiPago recibe tus datos y coordina el contacto con el Dr. Francisco Liberatore.</p></div><button class="button button-primary legal-primary" type="button" data-action="select-service" data-service-id="abogado-art">Iniciar consulta por ART</button></section>
      <p class="legal-disclaimer">La información de esta página es orientativa. No garantiza la aceptación de un reclamo, un plazo ni el cobro de una indemnización. El asesoramiento jurídico y las condiciones de contratación corresponden al profesional interviniente.</p>
    `);
  }
  let queued=false;
  function queue(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;renderLanding();});
  }
  function init(){
    const app=document.getElementById("app");
    if(!app)return;
    new MutationObserver(queue).observe(app,{childList:true,subtree:true});
    document.addEventListener("click",event=>{
      const trigger=event.target.closest("[data-legal-scroll]");
      if(!trigger||location.hash!==ROUTE)return;
      const target=document.getElementById(trigger.dataset.legalScroll);
      target?.scrollIntoView({behavior:"smooth",block:"start"});
    });
    window.addEventListener("hashchange",queue);
    queue();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();