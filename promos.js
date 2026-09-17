(function(){
  "use strict";
  if(document.querySelector('script[data-tramipago-backend="supabase"]'))return;
  const script=document.createElement("script");
  script.src="backend-sync.js?v=20260911-supabase-v1";
  script.defer=true;
  script.dataset.tramipagoBackend="supabase";
  document.head.appendChild(script);
})();

(function(){
  "use strict";

  const INTERVAL_MS=4000;
  const DESKTOP_BREAKPOINT=1120;
  let timer=null;
  let index=0;

  const originalPromos=[
    {image:"assets/promo-general-20260911.webp",alt:"TramiPago, trámites online y asistencia personalizada",message:"Quiero consultar por un trámite."},
    {image:"assets/promo-vehicular-20260911.webp",alt:"Informe vehicular de TramiPago",href:"#/tramite/informe-vehicular"},
    {image:"assets/promo-antecedentes-20260911.webp",alt:"Antecedentes Penales de TramiPago",href:"#/tramite/antecedentes-penales"},
    {image:"assets/promo-municipal-20260911.webp",alt:"Trámites municipales de San Miguel y José C. Paz: elegir municipio y gestión",href:"municipales.html"},
    {image:"assets/promo-art-20260911.webp",alt:"Consulta por accidente de trabajo o ART",message:"Quiero consultar por un accidente de trabajo o ART."}
  ];

  // Estas piezas se activan únicamente cuando el archivo aprobado existe y carga.
  // Así GitHub Pages nunca muestra una imagen rota antes de que se suban los WebP.
  const approvedPromos=[
    {image:"assets/promo-arca-20260916.webp",alt:"ARCA y Monotributo: altas, bajas, modificaciones y facturación",href:"#/familia/arca-monotributo"},
    {image:"assets/promo-apostillas-20260916.webp",alt:"Apostillado y legalizaciones: consultas y gestiones documentales",href:"#/familia/legalizaciones-apostillas"},
    {image:"assets/promo-abogado-20260916.webp",alt:"Consultá con abogado: ART, laboral, accidentes y sucesiones",href:"#/familia/atencion-abogado"}
  ];
  const verifiedImages=new Set();
  let promos=originalPromos.slice();

  function updateAvailablePromos(){
    const lawyerReady=verifiedImages.has("assets/promo-abogado-20260916.webp");
    promos=approvedPromos.filter(item=>verifiedImages.has(item.image)).concat(
      originalPromos.filter(item=>!lawyerReady||item.image!=="assets/promo-art-20260911.webp")
    );
    if(index>=promos.length)index=0;
    setContent();
  }

  originalPromos.forEach(item=>{const image=new Image();image.src=item.image;});
  approvedPromos.forEach(item=>{
    const image=new Image();
    image.onload=()=>{
      if(!image.naturalWidth||!image.naturalHeight)return;
      verifiedImages.add(item.image);
      updateAvailablePromos();
    };
    image.onerror=()=>{};
    image.src=item.image;
  });

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
      body.promo-rail-layout{display:grid!important;grid-template-columns:clamp(410px,31vw,460px) minmax(0,1fr);grid-template-rows:auto minmax(0,1fr) auto;min-height:100vh}
      body.promo-rail-layout>.site-header{grid-column:1/-1;grid-row:1}
      body.promo-rail-layout>.promo-side-rail{grid-column:1;grid-row:2}
      body.promo-rail-layout>.site-main{grid-column:2;grid-row:2;min-width:0}
      body.promo-rail-layout>.site-footer{grid-column:1/-1;grid-row:3;min-width:0}
      .home-main-heading{margin:0 0 15px;color:#082a47;font-size:clamp(1.15rem,2.2vw,1.45rem);font-weight:800;line-height:1.2;text-align:center}
      .button.button-primary,.family-service-card .button.button-primary{background:#198754!important;color:#fff!important}
      .main-nav button.nav-help{background:#198754!important;color:#fff!important}
      .site-footer .footer-menu-col h3{font-size:12px!important;line-height:1.35!important}
      .site-footer .footer-menu-col a{font-size:12px!important;line-height:1.45!important}
      .site-footer .footer-menu-bottom{font-size:11px!important;line-height:1.4!important}
      .promo-side-rail{position:relative;z-index:12;min-width:0;background:linear-gradient(180deg,#f8fbfd 0%,#edf4f8 100%);border-right:1px solid #bdcfdb}
      .promo-rail-inner{position:sticky;top:0;display:flex;flex-direction:column;align-items:center;gap:12px;padding:16px}
      .promo-rail-card{display:block;overflow:hidden;width:100%;max-width:428px;aspect-ratio:1;color:#fff;background:#fff;border:0;border-radius:14px;box-shadow:0 8px 24px rgba(8,42,71,.22);text-decoration:none;transition:transform .18s ease,box-shadow .18s ease}
      .promo-rail-card:hover,.promo-rail-card:focus-visible{box-shadow:0 11px 28px rgba(8,42,71,.32);transform:translateY(-2px);outline:3px solid rgba(41,182,246,.35)}
      .promo-rail-media{display:block;width:100%;height:100%;overflow:hidden;background:#fff}
      .promo-rail-media img{display:block;width:100%;height:100%;object-fit:cover}
      .promo-rail-controls{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;max-width:428px}
      .promo-rail-arrow{display:grid;place-items:center;width:42px;height:42px;min-height:42px;padding:0;color:#fff;background:#082a47;border:0;border-radius:8px;box-shadow:0 3px 8px rgba(0,0,0,.22);font:800 1.15rem/1 system-ui;cursor:pointer}
      .promo-rail-arrow:hover,.promo-rail-arrow:focus-visible{background:#1b6fa8;outline:3px solid rgba(41,182,246,.28)}
      .promo-rail-dots{display:flex;gap:6px}
      .promo-rail-dot{width:7px;height:7px;background:#aac0ce;border-radius:50%}
      .promo-rail-dot.is-active{background:#1b6fa8;transform:scale(1.25)}
      .promo-side-rail.is-mobile{margin:4px auto 16px;padding:0 42px;background:transparent;border:0}
      .promo-side-rail.is-mobile .promo-rail-inner{position:relative;padding:0}
      .promo-side-rail.is-mobile .promo-rail-card{width:min(390px,100%)}
      .promo-side-rail.is-mobile .promo-rail-controls{width:min(390px,100%)}
      .home-municipal-entry{grid-column:1/-1!important;order:3!important;display:flex;align-items:center;gap:12px;min-width:0;width:100%;margin:3px 0 0;padding:8px 12px;border:2px solid #156c60;border-radius:11px;background:linear-gradient(110deg,#ffffff,#e2f5e9);box-shadow:0 3px 10px rgba(8,42,71,.1);color:#082a47;text-decoration:none}
      .home-municipal-entry img{width:64px;height:64px;object-fit:cover;flex:0 0 64px;border-radius:8px}
      .home-municipal-entry span{display:flex;flex-direction:column;min-width:0;gap:2px}
      .home-municipal-entry strong{font-size:1rem;line-height:1.2}
      .home-municipal-entry small{font-size:.82rem;line-height:1.25}
      .home-municipal-entry b{margin-left:auto;white-space:nowrap;color:#126b3a;font-size:.86rem}
      .home-municipal-entry:hover,.home-municipal-entry:focus-visible{background:#d9f3e5;outline:3px solid #29b6f6;outline-offset:2px}
      @media(max-width:1119px){body.promo-rail-layout{display:block!important}.promo-side-rail{width:min(460px,100%)}}
      @media(max-width:680px){.main-nav a,.main-nav button{height:44px!important;min-height:44px!important}.promo-rail-arrow{width:44px;height:44px;min-height:44px}.home-municipal-entry{flex-wrap:wrap}.home-municipal-entry b{width:100%;margin-left:76px}}
      @media(max-width:520px){.home-main-heading{margin-bottom:12px;font-size:1.12rem}}
      @media(prefers-reduced-motion:reduce){.promo-rail-card{transition:none!important}}
    `;
    document.head.appendChild(style);
  }

  function ensureHomeHeading(){
    const container=document.querySelector(".home-catalog > .container");
    if(!container||container.querySelector(".home-main-heading"))return;
    const heading=document.createElement("h1");
    heading.className="home-main-heading";
    heading.textContent="Elegí el trámite que necesitás";
    container.insertBefore(heading,container.firstChild);
  }

  // Entrada destacada sin agregar tarjetas falsas al catálogo de nueve gestiones.
  function ensureMunicipalEntry(){
    const container=document.querySelector(".home-catalog > .container");
    if(!container||container.querySelector(".home-municipal-entry"))return;
    const link=document.createElement("a");
    link.className="home-municipal-entry";
    link.href="municipales.html";
    link.setAttribute("aria-label","Trámites municipales: ver opciones para San Miguel y José C. Paz");
    link.innerHTML='<img src="assets/promo-municipal-20260911.webp" alt="" loading="lazy"><span><strong>Trámites municipales</strong><small>San Miguel y José C. Paz · Elegí municipio y gestión</small></span><b>Ver opciones →</b>';
    container.appendChild(link);
  }

  function createRail(){
    const rail=document.createElement("aside");
    rail.id="tramipago-promos";
    rail.className="promo-side-rail";
    rail.setAttribute("aria-label","Publicidades de TramiPago");
    rail.innerHTML=`
      <div class="promo-rail-inner">
        <a class="promo-rail-card" href="#" aria-label="TramiPago, trámites online y asistencia personalizada">
          <span class="promo-rail-media"><img src="assets/promo-general-20260911.webp" width="1000" height="1000" decoding="sync" alt="TramiPago, trámites online y asistencia personalizada"></span>
        </a>
        <div class="promo-rail-controls">
          <button class="promo-rail-arrow prev" type="button" aria-label="Publicidad anterior">‹</button>
          <span class="promo-rail-dots" aria-hidden="true"></span>
          <button class="promo-rail-arrow next" type="button" aria-label="Publicidad siguiente">›</button>
        </div>
      </div>`;
    rail.querySelector(".prev").addEventListener("click",()=>{move(-1);start();});
    rail.querySelector(".next").addEventListener("click",()=>{move(1);start();});
    return rail;
  }

  function setContent(){
    const rail=document.getElementById("tramipago-promos");
    if(!rail)return;
    const item=promos[index];
    const card=rail.querySelector(".promo-rail-card");
    card.href=hrefFor(item);
    card.setAttribute("aria-label",item.alt);
    if(item.message){card.target="_blank";card.rel="noopener noreferrer";}else{card.removeAttribute("target");card.removeAttribute("rel");}
    const image=card.querySelector("img");
    image.src=item.image;
    image.alt=item.alt;
    rail.querySelector(".promo-rail-dots").innerHTML=promos.map((_,i)=>`<span class="promo-rail-dot${i===index?" is-active":""}"></span>`).join("");
  }

  function mount(){
    injectStyle();
    const current=document.getElementById("tramipago-promos");
    if(!isHome()){
      current?.remove();
      document.body.classList.remove("promo-rail-layout");
      return;
    }
    const main=document.getElementById("app");
    const catalog=document.querySelector(".home-catalog");
    if(!main||!catalog)return;
    ensureHomeHeading();
    ensureMunicipalEntry();
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
    setContent();
  }

  function move(direction){index=(index+direction+promos.length)%promos.length;setContent();}
  function stop(){if(timer){clearInterval(timer);timer=null;}}
  function start(){
    stop();
    if(document.hidden||!isHome())return;
    timer=setInterval(()=>move(1),INTERVAL_MS);
  }

  let resizeFrame=0;
  window.addEventListener("resize",()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(mount);},{passive:true});
  window.addEventListener("hashchange",()=>setTimeout(()=>{mount();start();},0));
  document.addEventListener("visibilitychange",()=>{document.hidden?stop():start();});
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