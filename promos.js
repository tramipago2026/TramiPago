(function(){
  "use strict";

  const INTERVAL_MS=5000;
  const GAP=12;
  const MOBILE_QUERY="(max-width: 720px)";
  const reduceMotion=window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobile=window.matchMedia(MOBILE_QUERY);
  let timer=null;
  let page=0;

  const promos=[
    {id:"antecedentes",image:"assets/promo-antecedentes.webp",alt:"Publicidad de Antecedentes Penales de TramiPago",href:"#/tramite/antecedentes-penales",external:false},
    {id:"vehicular",image:"assets/promo-vehicular.webp",alt:"Publicidad de Informe Vehicular de TramiPago",href:"#/tramite/informe-vehicular",external:false},
    {id:"municipal",image:"assets/promo-municipal.webp",alt:"Publicidad de consulta de deuda municipal de José C. Paz y San Miguel",message:"Quiero consultar deuda municipal de José C. Paz o San Miguel.",external:true},
    {id:"art",image:"assets/promo-art.webp",alt:"Publicidad de consulta por accidente de trabajo o ART",message:"Quiero consultar por un accidente de trabajo o ART.",external:true}
  ];

  function whatsappUrl(message){
    const number=String(window.TRAMI_CONFIG?.whatsappNumber||"5491167083232").replace(/\D/g,"");
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  }

  function pagesCount(){return mobile.matches?promos.length:Math.ceil(promos.length/2);}
  function home(){return !location.hash||location.hash==="#/";}

  function injectStyle(){
    if(document.getElementById("tramipago-promos-style"))return;
    const style=document.createElement("style");
    style.id="tramipago-promos-style";
    style.textContent=`
      .promo-showcase{padding:4px 16px 14px;background:#edf4f8}
      .promo-shell{width:min(460px,100%);margin:0 auto;position:relative}
      .promo-title{margin:0 0 8px;color:#082a47;font-size:.92rem;font-weight:800;text-align:center;letter-spacing:.01em}
      .promo-viewport{overflow:hidden;border-radius:12px}
      .promo-track{display:grid;grid-auto-flow:column;grid-auto-columns:calc((100% - 12px)/2);gap:12px;transition:transform .45s ease;will-change:transform}
      .promo-card{display:block;overflow:hidden;aspect-ratio:1/1;background:#fff;border:2px solid transparent;border-radius:11px;box-shadow:0 5px 16px rgba(8,42,71,.18);text-decoration:none;transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease}
      .promo-card:hover,.promo-card:focus-visible{transform:translateY(-2px);border-color:#29b6f6;box-shadow:0 8px 21px rgba(8,42,71,.27);outline:none}
      .promo-card img{display:block;width:100%;height:100%;object-fit:cover}
      .promo-arrow{position:absolute;z-index:2;top:50%;width:34px;height:34px;min-height:34px;padding:0;display:grid;place-items:center;border:2px solid #fff;border-radius:50%;background:#082a47;color:#fff;box-shadow:0 3px 9px rgba(0,0,0,.28);font:700 1.15rem/1 system-ui;cursor:pointer;transform:translateY(-50%);transition:background .16s ease,transform .16s ease}
      .promo-arrow:hover,.promo-arrow:focus-visible{background:#1b6fa8;outline:3px solid rgba(41,182,246,.3)}
      .promo-arrow.prev{left:-17px}.promo-arrow.next{right:-17px}
      .promo-dots{display:flex;justify-content:center;gap:7px;margin-top:8px}
      .promo-dot{width:9px;height:9px;min-height:9px;padding:0;border:0;border-radius:50%;background:#9bb3c3;box-shadow:none;cursor:pointer}
      .promo-dot[aria-current="true"]{background:#1b6fa8;transform:scale(1.22)}
      @media(min-width:1041px){:root{--header-button-width:90px}.main-nav{gap:6px!important;transform:translateX(8px)!important}}
      @media(max-width:720px){.promo-showcase{padding:2px 42px 13px}.promo-shell{width:min(320px,100%)}.promo-track{grid-auto-columns:100%}.promo-title{font-size:.86rem}.promo-arrow.prev{left:-35px}.promo-arrow.next{right:-35px}}
      @media(prefers-reduced-motion:reduce){.promo-track,.promo-card,.promo-arrow{transition:none!important}}
    `;
    document.head.appendChild(style);
  }

  function cardMarkup(item,index){
    const href=item.external?whatsappUrl(item.message):item.href;
    const extra=item.external?' target="_blank" rel="noopener noreferrer"':'';
    const loading=index<2?"eager":"lazy";
    return `<a class="promo-card" href="${href}"${extra} aria-label="${item.alt}"><img src="${item.image}" alt="${item.alt}" loading="${loading}" decoding="async" width="360" height="360"></a>`;
  }

  function render(){
    if(!home()){
      document.getElementById("tramipago-promos")?.remove();
      stop();
      return;
    }
    const catalog=document.querySelector(".home-catalog");
    const hero=document.querySelector(".home-hero-clean");
    if(!catalog||!hero)return;
    injectStyle();
    let section=document.getElementById("tramipago-promos");
    if(!section){
      section=document.createElement("section");
      section.id="tramipago-promos";
      section.className="promo-showcase";
      section.setAttribute("aria-label","Destacados de TramiPago");
      section.innerHTML=`<div class="promo-shell"><h2 class="promo-title">Destacados</h2><button class="promo-arrow prev" type="button" aria-label="Publicidad anterior">‹</button><div class="promo-viewport"><div class="promo-track">${promos.map(cardMarkup).join("")}</div></div><button class="promo-arrow next" type="button" aria-label="Publicidad siguiente">›</button><div class="promo-dots" aria-label="Páginas del carrusel"></div></div>`;
      catalog.parentNode.insertBefore(section,catalog);
      bind(section);
    }
    page=Math.min(page,pagesCount()-1);
    draw(section);
    start(section);
  }

  function draw(section){
    const viewport=section.querySelector(".promo-viewport");
    const track=section.querySelector(".promo-track");
    if(!viewport||!track)return;
    track.style.transform=`translateX(-${page*(viewport.clientWidth+GAP)}px)`;
    const dots=section.querySelector(".promo-dots");
    const total=pagesCount();
    if(dots.children.length!==total){
      dots.innerHTML=Array.from({length:total},(_,i)=>`<button class="promo-dot" type="button" data-page="${i}" aria-label="Ver página ${i+1}"></button>`).join("");
    }
    [...dots.children].forEach((dot,i)=>dot.setAttribute("aria-current",String(i===page)));
  }

  function move(section,direction){
    const total=pagesCount();
    page=(page+direction+total)%total;
    draw(section);
  }

  function stop(){if(timer){clearInterval(timer);timer=null;}}
  function start(section){
    stop();
    if(reduceMotion.matches||document.hidden||!section)return;
    timer=setInterval(()=>move(section,1),INTERVAL_MS);
  }

  function bind(section){
    section.querySelector(".prev").addEventListener("click",()=>{move(section,-1);start(section)});
    section.querySelector(".next").addEventListener("click",()=>{move(section,1);start(section)});
    section.querySelector(".promo-dots").addEventListener("click",event=>{const dot=event.target.closest("[data-page]");if(!dot)return;page=Number(dot.dataset.page)||0;draw(section);start(section)});
    section.addEventListener("mouseenter",stop);
    section.addEventListener("mouseleave",()=>start(section));
    section.addEventListener("focusin",stop);
    section.addEventListener("focusout",event=>{if(!section.contains(event.relatedTarget))start(section)});
  }

  function refresh(){const section=document.getElementById("tramipago-promos");if(section)draw(section);else render()}
  mobile.addEventListener?.("change",()=>{page=0;refresh()});
  reduceMotion.addEventListener?.("change",()=>{const section=document.getElementById("tramipago-promos");start(section)});
  document.addEventListener("visibilitychange",()=>{const section=document.getElementById("tramipago-promos");document.hidden?stop():start(section)});
  window.addEventListener("resize",refresh,{passive:true});
  window.addEventListener("hashchange",()=>setTimeout(render,0));

  const app=document.getElementById("app");
  if(app){let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;render()})}).observe(app,{childList:true,subtree:true});}
  render();
})();
