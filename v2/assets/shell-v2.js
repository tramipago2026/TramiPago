"use strict";
(() => {
  const navigation=[["/v2/","Inicio"],["/v2/tramites/","Trámites"],["/v2/seguimiento/","Seguimiento"],["/v2/ayuda/","Ayuda"]];
  const legal=[["terminos-condiciones","Términos y condiciones"],["politica-privacidad","Política de privacidad"],["arrepentimiento","BOTÓN DE ARREPENTIMIENTO"],["baja-servicio","BOTÓN DE BAJA DE SERVICIO"],["contacto","Contacto"]];
  const benefits=[["support","Atención personalizada","Te acompañamos en todo el proceso."],["document","Seguimiento de tu trámite","Siempre informado."],["shield","Tus datos seguros","Información protegida."],["people","Asistencia personalizada","Te ayudamos con tus consultas."]];
  function renderHeader(route="/v2/") {
    const current=route.startsWith("/v2/seguimiento/")?"/v2/seguimiento/":route.startsWith("/v2/ayuda/")?"/v2/ayuda/":
      /\/v2\/(tramites|familias|categorias|buscar)\//.test(route)?"/v2/tramites/":["/v2/","/v2/index.html"].includes(route)?"/v2/":"";
    const nav=navigation.map(([href,title])=>'<a href="'+href+'"'+(href===current?' aria-current="page"':'')+'>'+title+'</a>').join("");
    return '<a class="brand" href="/v2/" aria-label="TramiPago, ir al inicio"><img src="/v2/assets/logo-horizontal-opcion-c.png?v=2f7706b6" width="367" height="89" alt="TramiPago"></a><nav aria-label="Navegación principal">'+nav+'</nav>';
  }
  function renderFooter() {
    const features=benefits.map(([icon,title,text])=>'<div class="benefit"><svg class="benefit-icon" aria-hidden="true"><use href="/v2/assets/shell-icons-v2.svg#icon-'+icon+'"></use></svg><div><strong>'+title+'</strong><span>'+text+'</span></div></div>').join("");
    const links=legal.map(([slug,title])=>'<a href="/v2/'+slug+'/">'+title+'</a>').join("");
    return '<div class="footer-benefits">'+features+'</div><div class="footer-dark"><a href="/v2/" aria-label="Ir al inicio">TramiPago</a>'+links+'<span>© 2026 TramiPago</span></div><p class="private-note">Servicio privado de asistencia. TramiPago no es un organismo público.</p>';
  }
  // Shared public labels; Admin retains its more specific administrative terminology.
  const customerStatuses=Object.freeze({
    draft:"Datos sin enviar",
    awaiting_payment:"Pago pendiente",
    payment_review:"Pago en revisión",
    payment_confirmed:"Pago confirmado",
    in_progress:"En proceso",
    needs_info:"Falta información",
    finalized:"Finalizado",
    cancelled:"Cancelado",
  });
  const statusLabel=status=>customerStatuses[status]||status||"Sin estado";
  window.TramiPagoShell={header:renderHeader,footer:renderFooter,statusLabel};
  const header=document.querySelector("[data-v2-shared-header]"),footer=document.querySelector("[data-v2-shared-footer]");
  if(!header||!footer)return;
  const main=document.querySelector("main");if(main&&!main.id)main.id="contenido";
  if(!document.querySelector(".skip-link")){const skip=document.createElement("a");skip.className="skip-link";skip.href="#contenido";skip.textContent="Saltar al contenido";header.before(skip);}
  header.innerHTML=renderHeader(location.pathname);
  footer.innerHTML=renderFooter();
})();
