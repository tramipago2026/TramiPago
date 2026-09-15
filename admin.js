(function(){
  "use strict";

  const script=document.createElement("script");
  script.src="admin-mfa.js?v=20260915-security3";
  script.async=false;
  script.addEventListener("error",()=>{
    console.error("TramiPago Admin: no se pudo cargar el módulo seguro del panel.");
    const node=document.getElementById("login-message");
    if(node){
      node.textContent="No se pudo iniciar el panel seguro.";
      node.className="message error";
    }
  });
  document.head.appendChild(script);
})();
