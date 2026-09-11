(function(){
  "use strict";

  const INTERVAL_MS=5000;
  const DESKTOP_BREAKPOINT=1120;
  const reduceMotion=window.matchMedia("(prefers-reduced-motion: reduce)");
  let timer=null;
  let index=0;

  const promos=[
    {image:"assets/promo-antecedentes.webp",alt:"Publicidad de Antecedentes Penales de TramiPago",href:"#/tramite/antecedentes-penales"},
    {image:"assets/promo-vehicular.webp",alt:"Publicidad de Informe Vehicular de TramiPago",href:"#/tramite/informe-vehicular"},
    {image:"assets/promo-municipal.webp",alt:"Publicidad de consulta de deuda municipal de José C. Paz y San Miguel",message:"Quiero consultar deuda municipal de José C. Paz o San Miguel."},
    {image:"assets/promo-art.webp",alt:"Publicidad de consulta por accidente de trabajo o ART",message:"Quiero consultar por un accidente de trabajo o ART."}
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
      body.promo-rail-layout{display:grid!important;grid-template-columns:clamp(340px,26vw,380px) minmax(0,1fr);grid-template-rows:auto minmax(0,1fr) auto;min-height:100vh}
      body.promo-rail-layout>.site-header{grid-column:1/-1;grid-row:1}
      body.promo-rail-layout>.promo-side-rail{grid-column:1;grid-row:2/4}
      body.promo-rail-layout>.site-main{grid-column:2;grid-row:2;min-width:0}
      body.promo-rail-layout>.site-footer{grid-column:2;grid-row:3;min-width:0}
      .promo-side-rail{position:relative;z-index:12;min-width:0;background:linear-gradient(180deg,#f8fbfd 0%,#edf4f8 100%);border-right:1px solid #bdcfdb}
      .promo-rail-inner{position:sticky;top:0;display:flex;flex-direction:column;align-items:center;gap:11px;padding:18px 20px 22px}
      .promo-rail-title{align-self:stretch;margin:0;color:#082a47;font:800 1rem/1.2 system-ui,sans-serif;text-align:left}
      .promo-rail-card{display:block;overflow:hidden;width:100%;max-width:330px;aspect-ratio:1/1;background:#fff;border:0;border-radius:12px;box-shadow:0 8px 24px rgba(8,42,71,.22);transition:opacity .18s ease,transform .18s ease,box-shadow .18s ease}
      .promo-rail-card:hover,.promo-rail-card:focus-visible{box-shadow:0 11px 28px rgba(8,42,71,.32);transform:translateY(-2px);outline:3px solid rgba(41,182,246,.35)}
      .promo-rail-card.is-changing{opacity:.18}
      .promo-rail-card img{display:block;width:100%;height:100%;object-fit:cover}
      .promo-rail-controls{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;max-width:330px}
      .promo-rail-arrow{display:grid;place-items:center;width:36px;height:34px;min-height:34px;padding:0;color:#fff;background:#082a47;border:0;border-radius:8px;box-shadow:0 3px 8px rgba(0,0,0,.22);font:800 1.15rem/1 system-ui;cursor:pointer}
      .promo-rail-arrow:hover,.promo-rail-arrow:focus-visible{background:#1b6fa8;outline:3px solid rgba(41,182,246,.28)}
      .promo-rail-dots{display:flex;gap:6px}
      .promo-rail-dot{width:7px;height:7px;background:#aac0ce;border-radius:50%}
      .promo-rail-dot.is-active{background:#1b6fa8;transform:scale(1.25)}
      .promo-rail-note{align-self:stretch;margin:0;color:#607789;font:600 .76rem/1.35 system-ui,sans-serif;text-align:center}
      .promo-side-rail.is-mobile{margin:4px auto 16px;padding:0 42px;background:transparent;border:0}
      .promo-side-rail.is-mobile .promo-rail-inner{position:relative;padding:0}
      .promo-side-rail.is-mobile .promo-rail-title,.promo-side-rail.is-mobile .promo-rail-note{display:none}
      .promo-side-rail.is-mobile .promo-rail-card{width:min(340px,100%)}
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
        <a class="promo-rail-card" href="#"><img width="620" height="620" decoding="async" alt=""></a>
        <div class="promo-rail-controls">
          <button class="promo-rail-arrow prev" type="button" aria-label="Publicidad anterior">‹</button>
          <span class="promo-rail-dots" aria-hidden="true"></span>
          <button class="promo-rail-arrow next" type="button" aria-label="Publicidad siguiente">›</button>
        </div>
        <p class="promo-rail-note">Seleccioná una imagen para iniciar la consulta.</p>
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
    if(animate)card.classList.add("is-changing");
    window.setTimeout(()=>{
      card.href=hrefFor(item);
      card.setAttribute("aria-label",item.alt);
      if(item.message){card.target="_blank";card.rel="noopener noreferrer";}else{card.removeAttribute("target");card.removeAttribute("rel");}
      const image=card.querySelector("img");
      image.src=item.image;
      image.alt=item.alt;
      rail.querySelector(".promo-rail-dots").innerHTML=promos.map((_,i)=>`<span class="promo-rail-dot${i===index?" is-active":""}"></span>`).join("");
      card.classList.remove("is-changing");
    },animate&&!reduceMotion.matches?110:0);
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
