(function(){
  "use strict";
  const FAMILY_ROUTE="#/familia/atencion-abogado";
  function sync(){
    const header=document.querySelector(".site-header");
    const row=header?.querySelector(".header-inner");
    const brand=row?.querySelector(".brand");
    if(!header||!row||!brand)return;
    let badge=document.getElementById("lawyer-header-badge");
    if(!badge){
      badge=document.createElement("a");
      badge.id="lawyer-header-badge";
      badge.className="lawyer-header-badge";
      badge.href=FAMILY_ROUTE;
      badge.setAttribute("aria-label","Abogado especialista en reclamos de ART. Abrir consulta.");
      badge.innerHTML='<span class="lawyer-header-badge-copy"><strong class="lawyer-header-badge-title">Abogado</strong><span class="lawyer-header-badge-subtitle">Especialista en<br><em>reclamos de ART</em></span></span><span class="lawyer-header-badge-photo" aria-hidden="true"></span>';
      brand.insertAdjacentElement("afterend",badge);
    }
    const hash=location.hash||"#/";
    const active=hash===FAMILY_ROUTE||hash.startsWith("#/tramite/abogado-");
    badge.hidden=!active;
    header.classList.toggle("lawyer-header-active",active);
    if(active)badge.setAttribute("aria-current",hash===FAMILY_ROUTE?"page":"true");else badge.removeAttribute("aria-current");
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",sync,{once:true});else sync();
  window.addEventListener("hashchange",sync);
})();