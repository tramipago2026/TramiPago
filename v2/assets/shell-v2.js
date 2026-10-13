"use strict";
(() => {
  const header=document.querySelector("[data-v2-shared-header]");
  const footer=document.querySelector("[data-v2-shared-footer]");
  if(!header||!footer)return;
  const route=location.pathname;
  const links=[["/v2/","Inicio"],["/v2/tramites/","Trámites"],["/v2/seguimiento/","Seguimiento"],["/v2/ayuda/","Ayuda"]];
  const current=route.startsWith("/v2/seguimiento/")?"/v2/seguimiento/":route.startsWith("/v2/ayuda/")?"/v2/ayuda/":
    /\/v2\/(tramites|familias|categorias|buscar)\//.test(route)?"/v2/tramites/":route==="/v2/"?"/v2/":"";
  const nav=links.map(([href,title])=>'<a href="'+href+'"'+(href===current?' aria-current="page"':'')+'>'+title+'</a>').join("");
  const main=document.querySelector("main");if(main&&!main.id)main.id="contenido";
  const skip=document.createElement("a");skip.className="skip-link";skip.href="#contenido";skip.textContent="Saltar al contenido";header.before(skip);
  header.innerHTML='<a class="brand" href="/v2/" aria-label="TramiPago, ir al inicio"><img src="/v2/assets/logo-horizontal-opcion-c.png?v=2f7706b6" width="367" height="89" alt="TramiPago"></a><nav aria-label="Navegación principal">'+nav+'</nav>';
  footer.innerHTML='<div class="footer-benefits"><span>Atención personalizada</span><span>Seguimiento de tu trámite</span><span>Tus datos seguros</span><span>Asistencia personalizada</span></div>'
    +'<div class="footer-dark"><a href="/v2/" aria-label="Volver al inicio">TramiPago</a><a href="/v2/terminos-condiciones/">Términos y condiciones</a><a href="/v2/politica-privacidad/">Política de privacidad</a><a href="/v2/arrepentimiento/">BOTÓN DE ARREPENTIMIENTO</a><a href="/v2/baja-servicio/">BOTÓN DE BAJA DE SERVICIO</a><a href="/v2/contacto/">Contacto</a><span>© 2026 TramiPago</span></div>'
    +'<p class="private-note">Servicio privado de asistencia. TramiPago no es un organismo público.</p>';
})();