(function(){"use strict";const form=document.getElementById("elegir-municipio"),results=document.getElementById("municipal-results");if(!form||!results)return;function choose(id,scroll){if(!["jose-paz","san-miguel"].includes(id))return;form.querySelectorAll('input[name="municipio"]').forEach(input=>input.checked=input.value===id);results.querySelectorAll(".town").forEach(section=>section.hidden=section.id!=="municipio-"+id);results.classList.add("is-selected");if(scroll)results.scrollIntoView({behavior:"smooth",block:"start"});}form.addEventListener("submit",event=>{event.preventDefault();const selected=form.querySelector('input[name="municipio"]:checked');if(selected)choose(selected.value,true);});const hash=location.hash.slice(1);if(hash==="san-miguel"||hash==="jose-paz")choose(hash,false);})();

(function(){"use strict";
  document.querySelectorAll(".municipal-consult-form").forEach(function(form){
    form.addEventListener("submit",function(event){
      event.preventDefault();
      const nombre=form.elements.namedItem("nombre").value.trim();
      const telefono=form.elements.namedItem("telefono").value.trim();
      const tramite=form.elements.namedItem("tramite").value.trim();
      if(!nombre||!telefono||!tramite){form.reportValidity();return;}
      const mensaje="Hola, vengo de TramiPago.\nMunicipio: "+form.dataset.municipio+"\nNombre: "+nombre+"\nTeléfono: "+telefono+"\nTrámite solicitado: "+tramite;
      window.location.assign("https://wa.me/5491167083232?text="+encodeURIComponent(mensaje));
    });
  });
})();
