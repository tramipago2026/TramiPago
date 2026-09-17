/* Cabecera TramiPago. Cada enlace se activa al hacer clic (hover solo visual). */
(function(){
  "use strict";
  const STYLE_ID="tramipago-header-fixed-20260917";
  const LEGAL_ID="tramipago-header-legal";
  const legalHref="#/familia/atencion-abogado";

  function loadStyles(){
    if(document.getElementById(STYLE_ID))return;
    const link=document.createElement("link");
    link.id=STYLE_ID;
    link.rel="stylesheet";
    link.href="header-fijo-20260917.css?v=20260917-art2";
    document.head.appendChild(link);
  }

  function updateCurrentPage(){
    const hash=location.hash||"#/";
    const home=document.querySelector(".site-header .nav-home");
    const tracking=document.querySelector(".site-header .nav-tracking");
    const legal=document.getElementById(LEGAL_ID);
    for(const link of [home,tracking,legal])link?.removeAttribute("aria-current");
    if(hash==="#/")home?.setAttribute("aria-current","page");
    if(hash==="#/seguimiento")tracking?.setAttribute("aria-current","page");
    if(hash===legalHref||hash.startsWith("#/tramite/abogado-"))legal?.setAttribute("aria-current","page");
  }

  function enhance(){
    const header=document.querySelector(".site-header");
    const row=header?.querySelector(".header-inner");
    const brand=row?.querySelector(".brand");
    const nav=row?.querySelector(".main-nav");
    const home=nav?.querySelector(".nav-home");
    const tracking=nav?.querySelector(".nav-tracking");
    const help=nav?.querySelector(".nav-help");
    if(!header||!row||!brand||!home||!tracking||!help)return;
    if(!(window.TRAMI_FAMILIES||[]).some(family=>family.id==="atencion-abogado"))return;
    loadStyles();
    if(!document.getElementById(LEGAL_ID)){
      const legal=document.createElement("a");
      legal.id=LEGAL_ID;
      legal.className="header-legal";
      legal.href=legalHref;
      legal.title="Abrir la sección de consultas por ART";
      legal.setAttribute("aria-label","Especialista en reclamos de ART. Abrir consultas con abogado.");
      legal.innerHTML='<span class="header-legal-copy"><strong class="header-legal-title" style="white-space:normal!important;font-size:15px!important;line-height:1.17!important">Especialista en <em>reclamos de ART</em></strong></span><img class="header-legal-art" src="assets/header-consulta-legal-20260917.svg" alt="" aria-hidden="true" width="240" height="120">';
      brand.insertAdjacentElement("afterend",legal);
    }
    if(!home.querySelector(".header-home-icon")){
      home.insertAdjacentHTML("afterbegin",'<svg class="nav-icon header-home-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 10 9-7 9 7"/><path d="M5 9v12h14V9M9 21v-7h6v7"/></svg>');
    }
    brand.href="#/";
    home.href="#/";
    tracking.href="#/seguimiento";
    help.dataset.action="whatsapp";
    row.classList.add("header-featured");
    header.classList.add("header-featured-active");
    updateCurrentPage();
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",enhance,{once:true});
  else enhance();
  window.addEventListener("hashchange",updateCurrentPage);
})();