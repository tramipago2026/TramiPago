(function(){
  "use strict";

  const STYLE_ID="tramipago-catalog-search-style";
  const SEARCH_ID="tramipago-catalog-search";

  function normalize(value){
    return String(value||"")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g,"")
      .toLowerCase()
      .trim();
  }

  function escapeHTML(value){
    return String(value??"")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function injectStyles(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      .catalog-search{max-width:700px;margin:0 auto 24px;padding:0 10px}
      .catalog-search-box{position:relative}
      .catalog-search label{display:block;margin:0 0 7px;color:#082A47;font-weight:800;text-align:center}
      .catalog-search input{width:100%;min-height:48px;padding:11px 14px;border:2px solid #0B3D66;border-radius:10px;background:#fff;color:#082A47;font:inherit;box-shadow:0 4px 12px rgba(8,42,71,.12)}
      .catalog-search input:focus{outline:3px solid rgba(41,182,246,.28);border-color:#1B6FA8}
      .catalog-search-results{display:grid;gap:7px;margin-top:8px}
      .catalog-search-result{display:block;padding:10px 12px;border:1px solid #c9dce8;border-radius:9px;background:#fff;color:#082A47;text-decoration:none;box-shadow:0 3px 9px rgba(8,42,71,.08)}
      .catalog-search-result:hover,.catalog-search-result:focus-visible{background:#eef8ff;border-color:#1B6FA8;outline:none}
      .catalog-search-result strong,.catalog-search-result span{display:block}
      .catalog-search-result span{margin-top:2px;color:#607789;font-size:.82rem}
      .catalog-search-empty{margin:8px 0 0;padding:9px 11px;color:#607789;text-align:center;font-size:.86rem}
      @media(max-width:620px){.catalog-search{margin-bottom:18px}.catalog-search input{min-height:46px}}
    `;
    document.head.appendChild(style);
  }

  function serviceById(id){
    return (window.TRAMI_SERVICES||[]).find(item=>item.id===id)||null;
  }

  function buildIndex(){
    const services=window.TRAMI_SERVICES||[];
    const directs=window.TRAMI_DIRECTS||[];
    const families=window.TRAMI_FAMILIES||[];
    const directIds=new Set(directs.map(item=>item.serviceId));
    const entries=[{
      type:"Categoría municipal",
      title:"Trámites municipales: San Miguel y José C. Paz",
      description:"Elegí el municipio. Boletas, deuda, opciones de pago y consulta de disponibilidad.",
      href:"municipales.html",
      text:"municipal municipio municipios municipalidad tasas boletas deuda pago pagos san miguel jose c paz jose cpaz rentas rodados patente multas servicios"
    }];

    directs.forEach(item=>{
      const service=serviceById(item.serviceId);
      if(!service||service.active===false)return;
      entries.push({
        type:"Trámite",
        title:item.name||service.name,
        description:service.shortDescription||service.description||"",
        href:`#/tramite/${encodeURIComponent(service.id)}`,
        text:[item.name,service.name,service.shortDescription,service.description,...(service.components||[]),...(service.requirements||[])].join(" ")
      });
    });

    families.forEach(family=>{
      const related=(family.serviceIds||[]).map(serviceById).filter(Boolean);
      entries.push({
        type:"Familia",
        title:family.name,
        description:family.description||related.map(item=>item.name).join(" · "),
        href:`#/familia/${encodeURIComponent(family.id)}`,
        text:[family.name,family.description,...related.flatMap(item=>[item.name,item.shortDescription,item.description,...(item.components||[])])].join(" ")
      });
    });

    services.forEach(service=>{
      if(!service?.id||service.active===false||directIds.has(service.id))return;
      const inFamily=families.some(family=>(family.serviceIds||[]).includes(service.id));
      if(inFamily)return;
      entries.push({
        type:"Trámite",
        title:service.name,
        description:service.shortDescription||service.description||"",
        href:`#/tramite/${encodeURIComponent(service.id)}`,
        text:[service.name,service.shortDescription,service.description,...(service.components||[]),...(service.requirements||[])].join(" ")
      });
    });

    return entries.map(entry=>({...entry,search:normalize(entry.text)}));
  }

  function ensureSearch(){
    if((location.hash||"#/")!=="#/"&&location.hash)return;
    const container=document.querySelector(".home-catalog .container");
    if(!container||document.getElementById(SEARCH_ID))return;
    injectStyles();

    const section=document.createElement("section");
    section.id=SEARCH_ID;
    section.className="catalog-search";
    section.setAttribute("aria-label","Buscador de trámites");
    section.innerHTML=`
      <div class="catalog-search-box">
        <label for="tramipago-search-input">¿Qué trámite necesitás?</label>
        <input id="tramipago-search-input" type="search" autocomplete="off" placeholder="Ej.: municipal, partida, monotributo, antecedentes" />
      </div>
      <div class="catalog-search-results" aria-live="polite"></div>
    `;
    container.insertBefore(section,container.firstChild);

    const input=section.querySelector("input");
    const results=section.querySelector(".catalog-search-results");
    const index=buildIndex();

    input.addEventListener("input",()=>{
      const term=normalize(input.value);
      if(term.length<2){results.innerHTML="";return;}
      const words=term.split(/\s+/).filter(Boolean);
      const matches=index.filter(entry=>words.every(word=>entry.search.includes(word))).slice(0,8);
      if(!matches.length){
        results.innerHTML='<p class="catalog-search-empty">No encontré ese trámite en el catálogo actual.</p>';
        return;
      }
      results.innerHTML=matches.map(entry=>`
        <a class="catalog-search-result" href="${escapeHTML(entry.href)}">
          <strong>${escapeHTML(entry.title)}</strong>
          <span>${escapeHTML(entry.type)}${entry.description?` · ${escapeHTML(entry.description)}`:""}</span>
        </a>
      `).join("");
    });
  }

  let queued=false;
  function queue(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;ensureSearch();});
  }

  new MutationObserver(queue).observe(document.body,{childList:true,subtree:true});
  window.addEventListener("hashchange",queue);
  queue();

  import("./commercial-display.js?v=20260915-prices1").catch(error=>console.error("TramiPago visual comercial:",error));
})();