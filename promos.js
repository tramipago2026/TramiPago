(function(){
  "use strict";

  const INTERVAL_MS=4000;
  const DESKTOP_BREAKPOINT=1120;
  const reduceMotion=window.matchMedia("(prefers-reduced-motion: reduce)");
  let timer=null;
  let index=0;

  const promos=[
    {image:"assets/antecedentes-penales-v3.webp",alt:"Antecedentes Penales de TramiPago",eyebrow:"Gestión online",title:"Antecedentes Penales",subtitle:"Opciones de 1 o 6 horas",href:"#/tramite/antecedentes-penales"},
    {image:"assets/informe-vehicular-v3.webp",alt:"Informe Vehicular de TramiPago",eyebrow:"Antes de comprar",title:"Informe Vehicular",subtitle:"Dominio, infracciones y patentes",href:"#/tramite/informe-vehicular"},
    {image:"assets/promo-municipal.webp",alt:"Consulta de deuda municipal de José C. Paz y San Miguel",eyebrow:"Información municipal",title:"Deuda Municipal",subtitle:"José C. Paz y San Miguel",lowResolution:true,message:"Quiero consultar deuda municipal de José C. Paz o San Miguel."},
    {image:"assets/promo-art.webp",alt:"Consulta por accidente de trabajo o ART",eyebrow:"Consulta laboral",title:"Accidentes de Trabajo",subtitle:"Orientación sobre ART",lowResolution:true,message:"Quiero consultar por un accidente de trabajo o ART."}
  ];

  function isHome(){return !location.hash||location.hash==="#/";}
  function isDesktop(){return window.innerWidth>=DESKTOP_BREAKPOINT;}
  function whatsappUrl(message){
    const number=String(window.TRAMI_CONFIG?.whatsappNumber||"5491167083232").replace(/\D/g,"");
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  }
  function hrefFor(item){return item.message?whatsappUrl(item.message):item.href;}

  function injectStyle(){
    if(document.getElementById("tramipago-promo-rail-style"))return;
    const style=document.createElement("style");
    style.id="tramipago-promo-rail-style";
    style.textContent=`
      body.promo-rail-layout{display:grid!important;grid-template-columns:clamp(380px,29vw,420px) minmax(0,1fr);grid-template-rows:auto minmax(0,1fr) auto;min-height:100vh}
      body.promo-rail-layout>.site-header{grid-column:1/-1;grid-row:1}
      body.promo-rail-layout>.promo-side-rail{grid-column:1;grid-row:2/4}
      body.promo-rail-layout>.site-main{grid-column:2;grid-row:2;min-width:0}
      body.promo-rail-layout>.site-footer{grid-column:2;grid-row:3;min-width:0}
      .promo-side-rail{position:relative;z-index:12;min-width:0;background:linear-gradient(180deg,#f8fbfd 0%,#edf4f8 100%);border-right:1px solid #bdcfdb}
      .promo-rail-inner{position:sticky;top:0;display:flex;flex-direction:column;align-items:center;gap:11px;padding:18px}
      .promo-rail-title{align-self:stretch;margin:0;color:#082a47;font:800 1rem/1.2 system-ui,sans-serif;text-align:left}
      .promo-rail-card{display:flex;flex-direction:column;overflow:hidden;width:100%;max-width:380px;height:clamp(420px,calc(100vh - 310px),500px);color:#fff;background:#0b3d66;border:0;border-radius:14px;box-shadow:0 8px 24px rgba(8,42,71,.22);text-decoration:none;transition:opacity .18s ease,transform .18s ease,box-shadow .18s ease}
      .promo-rail-card:hover,.promo-rail-card:focus-visible{box-shadow:0 11px 28px rgba(8,42,71,.32);transform:translateY(-2px);outline:3px solid rgba(41,182,246,.35)}
      .promo-rail-card.is-changing{opacity:.18}
      .promo-rail-media{display:flex;flex:1 1 auto;min-height:0;align-items:center;justify-content:center;overflow:hidden;background:linear-gradient(145deg,#dff4ff,#b7deef)}
      .promo-rail-media img{display:block;width:100%;height:100%;object-fit:cover}
      .promo-rail-card.is-low-resolution .promo-rail-media{padding:16px;background:linear-gradient(145deg,#dff4ff,#eef7fb)}
      .promo-rail-card.is-low-resolution .promo-rail-media img{width:auto;height:auto;max-width:240px;max-height:240px;object-fit:contain;border-radius:10px;box-shadow:0 5px 16px rgba(8,42,71,.18)}
      .promo-rail-copy{display:flex;flex:0 0 140px;flex-direction:column;justify-content:center;padding:16px 18px;background:#082a47}
      .promo-rail-eyebrow{margin-bottom:4px;color:#29b6f6;font:800 .8rem/1.2 system-ui,sans-serif;text-transform:uppercase;letter-spacing:.04em}
      .promo-rail-heading{color:#fff;font:800 1.42rem/1.08 system-ui,sans-serif}
      .promo-rail-subtitle{margin-top:7px;color:#dff4ff;font:700 1rem/1.25 system-ui,sans-serif}
      .promo-rail-controls{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;max-width:380px}
      .promo-rail-arrow{display:grid;place-items:center;width:36px;height:34px;min-height:34px;padding:0;color:#fff;background:#082a47;border:0;border-radius:8px;box-shadow:0 3px 8px rgba(0,0,0,.22);font:800 1.15rem/1 system-ui;cursor:pointer}
      .promo-rail-arrow:hover,.promo-rail-arrow:focus-visible{background:#1b6fa8;outline:3px solid rgba(41,182,246,.28)}
      .promo-rail-dots{display:flex;gap:6px}
      .promo-rail-dot{width:7px;height:7px;background:#aac0ce;border-radius:50%}
      .promo-rail-dot.is-active{background:#1b6fa8;transform:scale(1.25)}
      .promo-side-rail.is-mobile{margin:4px auto 16px;padding:0 42px;background:transparent;border:0}
      .promo-side-rail.is-mobile .promo-rail-inner{position:relative;padding:0}
      .promo-side-rail.is-mobile .promo-rail-title{display:none}
      .promo-side-rail.is-mobile .promo-rail-card{width:min(350px,100%);height:440px}
      .promo-side-rail.is-mobile .promo-rail-controls{width:min(340px,100%)}
      @media(max-width:1119px){body.promo-rail-layout{display:block!important}.promo-side-rail{width:min(424px,100%)}}
      @media(prefers-reduced-motion:reduce){.promo-rail-card{transition:none!important}}
    `;
    document.head.appendChild(style);
  }

  function createRail(){
    const rail=document.createElement("aside");
    rail.id="tramipago-promos";
    rail.className="promo-side-rail";
    rail.setAttribute("aria-label","Destacados de TramiPago");
    rail.innerHTML=`
      <div class="promo-rail-inner">
        <h2 class="promo-rail-title">Destacados</h2>
        <a class="promo-rail-card" href="#">
          <span class="promo-rail-media"><img src="assets/antecedentes-penales-v3.webp" width="800" height="800" decoding="async" alt="Antecedentes Penales de TramiPago"></span>
          <span class="promo-rail-copy"><span class="promo-rail-eyebrow">Gestión online</span><strong class="promo-rail-heading">Antecedentes Penales</strong><span class="promo-rail-subtitle">Opciones de 1 o 6 horas</span></span>
        </a>
        <div class="promo-rail-controls">
          <button class="promo-rail-arrow prev" type="button" aria-label="Publicidad anterior">‹</button>
          <span class="promo-rail-dots" aria-hidden="true"></span>
          <button class="promo-rail-arrow next" type="button" aria-label="Publicidad siguiente">›</button>
        </div>
      </div>`;
    rail.querySelector(".prev").addEventListener("click",()=>move(-1));
    rail.querySelector(".next").addEventListener("click",()=>move(1));
    return rail;
  }

  function setContent(animate=true){
    const rail=document.getElementById("tramipago-promos");
    if(!rail)return;
    const item=promos[index];
    const card=rail.querySelector(".promo-rail-card");
    const apply=()=>{
      card.href=hrefFor(item);
      card.setAttribute("aria-label",item.alt);
      card.classList.toggle("is-low-resolution",Boolean(item.lowResolution));
      if(item.message){card.target="_blank";card.rel="noopener noreferrer";}else{card.removeAttribute("target");card.removeAttribute("rel");}
      const image=card.querySelector("img");
      image.src=item.image;
      image.alt=item.alt;
      card.querySelector(".promo-rail-eyebrow").textContent=item.eyebrow;
      card.querySelector(".promo-rail-heading").textContent=item.title;
      card.querySelector(".promo-rail-subtitle").textContent=item.subtitle;
      rail.querySelector(".promo-rail-dots").innerHTML=promos.map((_,i)=>`<span class="promo-rail-dot${i===index?" is-active":""}"></span>`).join("");
      card.classList.remove("is-changing");
    };
    if(animate&&!reduceMotion.matches){card.classList.add("is-changing");window.setTimeout(apply,110);}else{apply();}
  }

  function mount(){
    const current=document.getElementById("tramipago-promos");
    if(!isHome()){
      current?.remove();
      document.body.classList.remove("promo-rail-layout");
      return;
    }
    const main=document.getElementById("app");
    const catalog=document.querySelector(".home-catalog");
    if(!main||!catalog)return;
    injectStyle();
    const rail=current||createRail();
    if(isDesktop()){
      document.body.classList.add("promo-rail-layout");
      rail.classList.remove("is-mobile");
      if(rail.parentElement!==document.body)document.body.insertBefore(rail,main);
    }else{
      document.body.classList.remove("promo-rail-layout");
      rail.classList.add("is-mobile");
      if(rail.parentElement!==catalog)catalog.insertBefore(rail,catalog.firstChild);
    }
    setContent(false);
  }

  function move(direction){index=(index+direction+promos.length)%promos.length;setContent(true);}
  function stop(){if(timer){clearInterval(timer);timer=null;}}
  function start(){
    stop();
    if(reduceMotion.matches||document.hidden||!isHome())return;
    timer=setInterval(()=>move(1),INTERVAL_MS);
  }

  let resizeFrame=0;
  window.addEventListener("resize",()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(mount);},{passive:true});
  window.addEventListener("hashchange",()=>setTimeout(()=>{mount();start();},0));
  document.addEventListener("visibilitychange",()=>{document.hidden?stop():start();});
  reduceMotion.addEventListener?.("change",start);

  const app=document.getElementById("app");
  if(app){
    let queued=false;
    new MutationObserver(()=>{
      if(queued)return;
      queued=true;
      requestAnimationFrame(()=>{queued=false;mount();});
    }).observe(app,{childList:true,subtree:true});
  }

  mount();
  start();
})();
