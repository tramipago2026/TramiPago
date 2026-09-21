/* Ayuda de TramiPago: enlace al WhatsApp del propietario; el cliente decide si envía el mensaje. */
(function(){
  'use strict';
  const NUMBER='5491167083232';
  const REQUESTS_KEY='tramipago_requests_v1';
  const ACTIVE_KEY='tramipago_active_request_v1';
  const CODE=/^[A-Z0-9]{1,4}-[0-9]{5,6}(?:-[A-Z0-9]{1,8})?$/;
  const STATUS={payment_pending:'Pago pendiente',payment_review:'Pago en revisión',payment_confirmed:'Pago confirmado',in_progress:'En proceso',needs_info:'Falta información',ready:'Listo para entregar',finalized:'Finalizado',cancelled:'Cancelado'};
  const STAGES={eligibility:['Requisitos','Necesito ayuda con los requisitos'],data:['Carga de datos','No pude terminar el formulario'],payment:['Pago / comprobante','No pude terminar el pago o cargar el comprobante'],confirmation:['Confirmación','Quiero consultar por la solicitud registrada'],correction:['Corrección','Necesito ayuda para completar una corrección'],tracking:['Seguimiento','Quiero consultar el estado de mi trámite'],family:['Elección de trámite','Necesito orientación para elegir un trámite'],home:['Inicio','Necesito ayuda para comenzar un trámite']};
  function json(store,key,fallback){try{return JSON.parse(store.getItem(key)||'null')||fallback;}catch(_){return fallback;}}
  function text(value,max=140){return String(value||'').replace(/[\r\n\t]+/g,' ').replace(/\s+/g,' ').trim().slice(0,max);}
  function validCode(value){const code=text(value,30).toUpperCase();return CODE.test(code)?code:'';}
  function services(){return Array.isArray(window.TRAMI_SERVICES)?window.TRAMI_SERVICES:[];}
  function service(id){return services().find(item=>item.id===id)||null;}
  function families(){return Array.isArray(window.TRAMI_FAMILIES)?window.TRAMI_FAMILIES:[];}
  function route(){
    const hash=decodeURIComponent(location.hash||'');
    const process=hash.match(/^#\/tramite\/([a-z0-9-]+)$/i);
    if(process)return {kind:'process',id:process[1]};
    const family=hash.match(/^#\/familia\/([a-z0-9-]+)$/i);
    if(family)return {kind:'family',id:family[1]};
    return {kind:hash==='#/seguimiento'?'tracking':'home',id:''};
  }
  function currentStage(r){
    if(document.getElementById('correction-form'))return 'correction';
    if(document.getElementById('payment-form'))return 'payment';
    if(document.getElementById('eligibility-form'))return 'eligibility';
    if(document.getElementById('data-form'))return 'data';
    if(document.querySelector('.confirmation'))return 'confirmation';
    return r.kind==='process'?'data':r.kind;
  }
  function requestInfo(r){
    let code='';
    if(r.kind==='tracking'){
      code=validCode(document.querySelector('#tracking-form [name="trackingCode"]')?.value)
        ||validCode(document.querySelector('.tracking-result .status-header .eyebrow')?.textContent);
    }else if(r.kind==='process'){
      code=validCode(document.querySelector('.request-code')?.textContent)
        ||validCode(document.querySelector('.summary-grid .summary-item strong')?.textContent);
    }
    const active=json(sessionStorage,ACTIVE_KEY,null);
    const records=json(localStorage,REQUESTS_KEY,[]);
    const list=Array.isArray(records)?records:[];
    let request=code?list.find(item=>validCode(item?.code)===code):null;
    if(!request&&r.kind==='process'&&active&&active.serviceId===r.id){
      request=list.find(item=>item?.id===active.id&&item?.serviceId===r.id)||null;
    }
    if(request&&r.kind==='process'&&request.serviceId!==r.id)request=null;
    return {code:code||validCode(request?.code),request};
  }
  function sourceLabel(trigger){
    const label=text(trigger?.dataset?.whatsappSource||trigger?.getAttribute?.('aria-label')||trigger?.textContent,95);
    const card=trigger?.closest?.('article,.card,.family-service-card');
    const item=text(card?.querySelector?.('h2,h3')?.textContent,95);
    if(item)return `Botón de ${item}: ${label||'WhatsApp'}`;
    if(trigger?.classList?.contains('promo-rail-card'))return `Publicidad: ${label||'TramiPago'}`;
    if(trigger?.closest?.('.site-footer'))return 'WhatsApp del pie de página';
    if(trigger?.closest?.('.site-header'))return 'Ayuda del encabezado';
    return label?`Botón «${label}»`:'Ayuda de TramiPago';
  }
  function originalQuery(trigger){
    if(!trigger||trigger.tagName!=='A')return '';
    const href=trigger.href;
    if(trigger.dataset.tramipagoLastUrl===href)return trigger.dataset.tramipagoSeed||'';
    try{
      const u=new URL(href);
      const seed=u.hostname==='wa.me'?text(u.searchParams.get('text'),220):'';
      trigger.dataset.tramipagoSeed=seed;
      return seed;
    }catch(_){return '';}
  }
  function build(trigger,seed=''){
    const r=route(),stage=currentStage(r),info=requestInfo(r);
    const selected=service(r.id)||((info.request&&service(info.request.serviceId))||null);
    const family=families().find(item=>item.id===r.id);
    const step=STAGES[stage]||STAGES.home;
    const pieces=['Hola, me comunico desde TramiPago.',`Origen: ${sourceLabel(trigger)}.`];
    if(selected)pieces.push(`Trámite: ${text(selected.name)}.`);
    else if(family)pieces.push(`Categoría: ${text(family.name)}.`);
    else if(r.kind==='tracking')pieces.push('Sección: Ver estado del trámite.');
    else pieces.push(`Página: ${text(document.title.replace(/\s*\|\s*TramiPago\s*$/i,''),70)||'Inicio'}.`);
    pieces.push(`Etapa: ${step[0]}.`);
    if(info.code)pieces.push(`Código: ${info.code}.`);
    let status='';
    if(r.kind==='tracking')status=text(document.querySelector('.tracking-result .status-badge')?.textContent,55);
    if(!status&&info.request)status=STATUS[info.request.status]||'';
    if(status)pieces.push(`Estado mostrado: ${status}.`);
    pieces.push(`Consulta: ${seed&&!/^hola,?\s*me comunico desde tramipago/i.test(seed)?seed:step[1]}.`);
    pieces.push('Detalle adicional: [escribí acá qué necesitás].');
    return pieces.join('\n');
  }
  function url(trigger,seed=''){return `https://wa.me/${NUMBER}?text=${encodeURIComponent(build(trigger,seed))}`;}
  window.TRAMIPAGO_WHATSAPP={number:NUMBER,build,url};
  document.addEventListener('click',event=>{
    const target=event.target;
    if(!(target instanceof Element))return;
    const trigger=target.closest('[data-action="whatsapp"],a[href*="wa.me/"]');
    if(!trigger)return;
    const original=originalQuery(trigger);
    const targetUrl=url(trigger,original);
    if(trigger.tagName==='A'){
      trigger.href=targetUrl;
      trigger.target='_blank';
      trigger.rel='noopener noreferrer';
      trigger.dataset.tramipagoLastUrl=targetUrl;
      if(trigger.dataset.action==='whatsapp')event.stopPropagation();
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    const opened=window.open(targetUrl,'_blank','noopener,noreferrer');
    if(!opened)location.href=targetUrl;
  },true);
})();
