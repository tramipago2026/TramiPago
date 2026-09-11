(function(){
  "use strict";

  const INTERVAL_MS=5000;
  const MIN_SIDE_WIDTH=220;
  const MAX_SIDE_WIDTH=280;
  const SIDE_GAP=18;
  const reduceMotion=window.matchMedia("(prefers-reduced-motion: reduce)");
  let timer=null;
  let index=0;
  let sideMode=false;

  const promos=[
    {id:"antecedentes",image:"assets/promo-antecedentes.webp",alt:"Publicidad de Antecedentes Penales de TramiPago",href:"#/tramite/antecedentes-penales",external:false},
    {id:"vehicular",image:"assets/promo-vehicular.webp",alt:"Publicidad de Informe Vehicular de TramiPago",href:"#/tramite/informe-vehicular",external:false},
    {id:"municipal",image:"assets/promo-municipal.webp",alt:"Publicidad de consulta de deuda municipal de José C. Paz y San Miguel",message:"Quiero consultar deuda municipal de José C. Paz o San Miguel.",external:true},
    {id:"art",image:"assets/promo-art.webp",alt:"Publicidad de consulta por accidente de trabajo o ART",message:"Quiero consultar por un accidente de trabajo o ART.",external:true}
  ];

  function home(){return !location.hash||location.hash==="#/";}
  function whatsappUrl(message){
    const number=String(window.TRAMI_CONFIG?.whatsappNumber||"5491167083232").replace(/\D/g,"");
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  }
  function hrefFor(item){return item.external?whatsappUrl(item.message):item.href;}

  function injectStyle(){
    if(document.getElementById("tramipago-promos-style-v2"))return;
    const style=document.createElement("style");
    style.id="tramipago-promos-style-v2";
    style.textContent=`
      .home-catalog{position:relative}
      .promo-showcase-v2{z-index:12;pointer-events:none}
      .promo-showcase-v2.is-side{position:absolute;inset:0}
      .promo-side-slot{position:absolute;top:0;display:block;overflow:hidden;background:#fff;border:2px solid #fff;border-radius:12px;box-shadow:0 7px 20px rgba(8,42,71,.20);pointer-events:auto;transition:opacity .22s ease,transform .18s ease,box-shadow .18s ease,border-color .18s ease}
      .promo-side-slot:hover,.promo-side-slot:focus-visible{border-color:#29b6f6;box-shadow:0 10px 25px rgba(8,42,71,.30);transform:translateY(-2px);outline:none}
      .promo-side-slot img{display:block;width:100%;height:100%;object-fit:cover}
      .promo-side-slot.is-changing{opacity:.20}
      .promo-nav{position:absolute;z-index:3;top:50%;display:grid;place-items:center;width:34px;height:34px;min-height:34px;padding:0;color:#fff;background:#082a47;border:2px solid #fff;border-radius:50%;box-shadow:0 3px 9px rgba(0,0,0,.28);font:800 1.1rem/1 system-ui;cursor:pointer;pointer-events:auto;transform:translateY(-50%)}
      .promo-nav:hover,.promo-nav:focus-visible{background:#1b6fa8;outline:3px solid rgba(41,182,246,.28)}
      .promo-nav.prev{left:-13px}.promo-nav.next{right:-13px}
      .promo-mobile-wrap{display:none}
      .promo-showcase-v2.is-mobile{position:relative;width:min(330px,calc(100% - 70px));margin:4px auto 14px;pointer-events:auto}
      .promo-showcase-v2.is-mobile .promo-side-slot{display:none}
      .promo-showcase-v2.is-mobile .promo-mobile-wrap{position:relative;display:block}
      .promo-mobile-card{display:block;overflow:hidden;width:100%;aspect-ratio:1/1;background:#fff;border:2px solid #fff;border-radius:12px;box-shadow:0 6px 18px rgba(8,42,71,.20);transition:opacity .22s ease}
      .promo-mobile-card.is-changing{opacity:.20}
      .promo-mobile-card img{display:block;width:100%;height:100%;object-fit:cover}
      .promo-showcase-v2.is-mobile .promo-nav{top:50%}.promo-showcase-v2.is-mobile .promo-nav.prev{left:-38px}.promo-showcase-v2.is-mobile .promo-nav.next{right:-38px}
      @media(prefers-reduced-motion:reduce){.promo-side-slot,.promo-mobile-card{transition:none!important}}
    `;
    document.head.appendChild(style);
  }

  function cardLink(item,slot){
    const link=slot;
    link.href=hrefFor(item);
    link.setAttribute("aria-label",item.alt);
    if(item.external){link.target="_blank";link.rel="noopener noreferrer";}else{link.removeAttribute("target");link.removeAttribute("rel");}
    const img=link.querySelector("img");
    img.src=item.image;img.alt=item.alt;
  }

  function createSection(catalog){
    const section=document.createElement("section");
    section.id="tramipago-promos";
    section.className="promo-showcase-v2";
    section.setAttribute("aria-label","Destacados de TramiPago");
    section.innerHTML=`
      <a class="promo-side-slot promo-left" href="#"><img width="560" height="560" decoding="async" alt=""></a>
      <a class="promo-side-slot promo-right" href="#"><img width="560" height="560" decoding="async" alt=""></a>
      <button class="promo-nav prev" type="button" aria-label="Publicidad anterior">‹</button>
      <button class="promo-nav next" type="button" aria-label="Publicidad siguiente">›</button>
      <div class="promo-mobile-wrap"><a class="promo-mobile-card" href="#"><img width="560" height="560" decoding="async" alt=""></a></div>`;
    catalog.insertBefore(section,catalog.firstChild);
    section.querySelector(".prev").addEventListener("click",()=>move(-1));
    section.querySelector(".next").addEventListener("click",()=>move(1));
    return section;
  }

  function calculateSideLayout(section,catalog){
    const row=catalog.querySelector(".home-direct-row");
    if(!row)return false;
    const rowRect=row.getBoundingClientRect();
    const catalogRect=catalog.getBoundingClientRect();
    const availableLeft=rowRect.left-12;
    const availableRight=window.innerWidth-rowRect.right-12;
    const width=Math.min(MAX_SIDE_WIDTH,availableLeft-SIDE_GAP,availableRight-SIDE_GAP);
    if(window.innerWidth<1080||width<MIN_SIDE_WIDTH)return false;

    const top=Math.max(0,rowRect.top-catalogRect.top);
    const left=Math.max(8,rowRect.left-catalogRect.left-width-SIDE_GAP);
    const right=Math.max(8,catalogRect.right-rowRect.right-width-SIDE_GAP);
    const leftSlot=section.querySelector(".promo-left");
    const rightSlot=section.querySelector(".promo-right");
    [leftSlot,rightSlot].forEach(slot=>{slot.style.width=`${width}px`;slot.style.height=`${width}px`;slot.style.top=`${top}px`;});
    leftSlot.style.left=`${left}px`;leftSlot.style.right="auto";
    rightSlot.style.right=`${right}px`;rightSlot.style.left="auto";
    section.querySelector(".prev").style.left=`${Math.max(2,left-14)}px`;
    section.querySelector(".prev").style.top=`${top+width/2}px`;
    section.querySelector(".next").style.right=`${Math.max(2,right-14)}px`;
    section.querySelector(".next").style.top=`${top+width/2}px`;
    return true;
  }

  function pageCount(){return sideMode?2:promos.length;}

  function updateContent(animate=true){
    const section=document.getElementById("tramipago-promos");
    if(!section)return;
    const left=section.querySelector(".promo-left");
    const right=section.querySelector(".promo-right");
    const mobile=section.querySelector(".promo-mobile-card");
    const targets=sideMode?[left,right]:[mobile];
    if(animate)targets.forEach(node=>node?.classList.add("is-changing"));
    window.setTimeout(()=>{
      if(sideMode){
        const first=index*2;
        cardLink(promos[first],left);
        cardLink(promos[first+1],right);
      }else{
        cardLink(promos[index],mobile);
      }
      targets.forEach(node=>node?.classList.remove("is-changing"));
    },animate&&!reduceMotion.matches?120:0);
  }

  function layout(){
    if(!home()){
      document.getElementById("tramipago-promos")?.remove();
      return;
    }
    const catalog=document.querySelector(".home-catalog");
    if(!catalog)return;
    injectStyle();
    const section=document.getElementById("tramipago-promos")||createSection(catalog);
    const nextSideMode=calculateSideLayout(section,catalog);
    if(nextSideMode!==sideMode){index=0;sideMode=nextSideMode;}
    section.classList.toggle("is-side",sideMode);
    section.classList.toggle("is-mobile",!sideMode);
    if(sideMode){
      section.querySelector(".promo-mobile-wrap").style.display="none";
    }else{
      section.querySelector(".promo-mobile-wrap").style.display="block";
      section.querySelector(".prev").removeAttribute("style");
      section.querySelector(".next").removeAttribute("style");
    }
    index=Math.min(index,pageCount()-1);
    updateContent(false);
  }

  function move(direction){
    const total=pageCount();
    index=(index+direction+total)%total;
    updateContent(true);
  }

  function stop(){if(timer){clearInterval(timer);timer=null;}}
  function start(){
    stop();
    if(reduceMotion.matches||document.hidden||!home())return;
    timer=setInterval(()=>move(1),INTERVAL_MS);
  }

  let resizeFrame=0;
  function refresh(){
    cancelAnimationFrame(resizeFrame);
    resizeFrame=requestAnimationFrame(()=>{layout();if(!timer)start();});
  }

  window.addEventListener("resize",refresh,{passive:true});
  window.addEventListener("hashchange",()=>setTimeout(()=>{layout();start();},0));
  document.addEventListener("visibilitychange",()=>{document.hidden?stop():start();});
  reduceMotion.addEventListener?.("change",start);

  const app=document.getElementById("app");
  if(app){
    let queued=false;
    new MutationObserver(()=>{
      if(queued)return;
      queued=true;
      requestAnimationFrame(()=>{queued=false;layout();});
    }).observe(app,{childList:true,subtree:true});
  }

  layout();
  start();
})();
