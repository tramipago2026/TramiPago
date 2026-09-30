(function(){
  "use strict";
  const form=document.getElementById("withdrawal-form")||document.getElementById("cancel-form");
  if(!form)return;
  const withdrawal=form.id==="withdrawal-form";
  form.addEventListener("submit",function(event){
    event.preventDefault();
    if(!form.reportValidity())return;
    const data=new FormData(form);
    const lines=[
      withdrawal?"SOLICITUD DE ARREPENTIMIENTO - TramiPago":"SOLICITUD DE BAJA DE SERVICIO - TramiPago",
      "Nombre y apellido: "+String(data.get("nombre")||"").trim(),
      "DNI: "+String(data.get("dni")||"").trim(),
      "Correo: "+String(data.get("email")||"").trim(),
      "WhatsApp: "+String(data.get("whatsapp")||"").trim(),
      "Código de solicitud/trámite: "+(String(data.get("codigo")||"").trim()||"No informado"),
      "Servicio: "+String(data.get("servicio")||"").trim(),
      "Observaciones: "+(String(data.get("comentario")||"").trim()||"Sin observaciones"),
      withdrawal
        ?"Solicito ejercer el derecho de arrepentimiento respecto de la contratación indicada."
        :"Solicito la baja del servicio indicado."
    ];
    window.location.href="https://wa.me/5491167083232?text="+encodeURIComponent(lines.join("\n"));
  });
})();
