(function(){
  "use strict";

  function buildFooter(){
    const footer=document.querySelector('.site-footer');
    const inner=footer?.querySelector('.footer-inner');
    if(!footer||!inner||inner.dataset.footerReady==='true') return;
    inner.dataset.footerReady='true';
    inner.innerHTML=`
      <div class="footer-menu-grid">
        <section class="footer-menu-col">
          <h3>TRAMIPAGO</h3>
          <a href="tramites.html#como-funciona">Cómo funciona</a>
          <a href="tramites.html">Todos los trámites</a>
          <a href="opiniones.html">Tu opinión</a>
        </section>
        <section class="footer-menu-col">
          <h3>TRÁMITES</h3>
          <a href="#/tramite/antecedentes-penales">Antecedentes Penales</a>
          <a href="#/tramite/constancias-anses">ANSES</a>
          <a href="#/tramite/informe-vehicular">Informe vehicular</a>
          <a href="#/tramite/arba-inmobiliario">ARBA / Inmobiliario</a>
        </section>
        <section class="footer-menu-col">
          <h3>ATENCIÓN</h3>
          <a href="contacto.html">Contacto</a>
          <a href="#/seguimiento">Estado del trámite</a>
          <a href="contacto.html#ayuda">Ayuda por WhatsApp</a>
          <span>+54 9 11 6708-3232</span>
          <span>Lun a vie 8–20 h · Sáb y dom 16–20 h</span>
        </section>
        <section class="footer-menu-col">
          <h3>LEGAL</h3>
          <a href="politica-privacidad.html">Política de Privacidad</a>
          <a href="terminos-condiciones.html">Términos y Condiciones</a>
          <a href="arrepentimiento.html">BOTÓN DE ARREPENTIMIENTO</a>
          <a href="baja-servicio.html">BOTÓN DE BAJA DE SERVICIO</a>
          <a href="https://autogestion.produccion.gob.ar/consumidores" target="_blank" rel="noopener noreferrer">Defensa del Consumidor</a>
        </section>
      </div>
      <div class="footer-menu-bottom">
        <span>© 2026 TramiPago · Todos los derechos reservados</span>
        <span>CUIT 20-25988733-0 · tramipago@gmail.com</span>
      </div>`;
  }

  function addStyles(){
    if(document.getElementById('tramipago-footer-menu-styles')) return;
    const style=document.createElement('style');
    style.id='tramipago-footer-menu-styles';
    style.textContent=`
      .site-footer{padding:24px 0 12px!important;background:#082A47!important}
      .site-footer .footer-inner{
        display:block!important;
        width:min(1180px,calc(100% - clamp(30px,6vw,96px)))!important;
        max-width:none!important;
        margin-inline:auto!important;
        padding-inline:0!important;
      }
      .footer-menu-grid{
        display:grid;
        grid-template-columns:repeat(4,minmax(0,1fr));
        column-gap:clamp(26px,5vw,78px);
        row-gap:22px;
        width:100%;
        align-items:start;
      }
      .footer-menu-col{min-width:0;text-align:left}
      .footer-menu-col h3{margin:0 0 8px;color:#fff;font-size:10.5px;font-weight:650;letter-spacing:.02em}
      .footer-menu-col a,.footer-menu-col span{display:block;margin:4px 0;color:rgba(255,255,255,.82);font-size:9.5px;font-weight:400;line-height:1.35;text-decoration:none;overflow-wrap:anywhere}
      .footer-menu-col a:hover,.footer-menu-col a:focus-visible{color:#29B6F6;text-decoration:underline;text-underline-offset:2px}
      .footer-menu-bottom{display:flex;justify-content:space-between;align-items:center;gap:18px;flex-wrap:wrap;width:100%;margin-top:18px;padding-top:10px;border-top:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.68);font-size:9px;font-weight:400;line-height:1.3}
      @media(max-width:900px){
        .site-footer .footer-inner{width:min(720px,calc(100% - 36px))!important}
        .footer-menu-grid{grid-template-columns:repeat(2,minmax(0,1fr));column-gap:clamp(30px,9vw,90px)}
      }
      @media(max-width:520px){
        .site-footer .footer-inner{width:calc(100% - 30px)!important}
        .footer-menu-grid{grid-template-columns:1fr;row-gap:18px}
        .footer-menu-bottom{display:block}
        .footer-menu-bottom span{display:block;margin-top:4px}
      }
    `;
    document.head.appendChild(style);
  }

  addStyles();
  buildFooter();
})();