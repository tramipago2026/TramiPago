(function(){
  "use strict";

  function trimDescription(value){
    const text=String(value||"").replace(/\s+/g," ").trim();
    if(text.length<=150)return text;
    return text.slice(0,147).replace(/\s+\S*$/,"")+"…";
  }

  function createCard({name,description,href}){
    const article=document.createElement("article");
    article.className="card";

    const title=document.createElement("h2");
    title.textContent=name;

    const copy=document.createElement("p");
    copy.textContent=description;

    const action=document.createElement("a");
    action.className="action";
    action.href=href;
    action.textContent="Ver trámite";

    article.append(title,copy,action);
    return article;
  }

  function renderCatalog(){
    const root=document.getElementById("tramites-catalog-grid");
    if(!root)return;

    const services=Array.isArray(window.TRAMI_SERVICES)
      ? window.TRAMI_SERVICES.filter(service=>service&&service.active)
      : [];

    services
      .slice()
      .sort((a,b)=>String(a.name||"").localeCompare(String(b.name||""),"es",{sensitivity:"base"}))
      .forEach(service=>{
        root.append(createCard({
          name:service.name,
          description:trimDescription(service.shortDescription||service.description||"Consultá requisitos, alcance y condiciones antes de iniciar."),
          href:"/#/tramite/"+encodeURIComponent(service.id)
        }));
      });

    root.append(createCard({
      name:"Trámites municipales",
      description:"Consultas y gestiones disponibles para José C. Paz y San Miguel, según el servicio municipal correspondiente.",
      href:"municipales.html"
    }));
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",renderCatalog,{once:true});
  }else{
    renderCatalog();
  }
})();