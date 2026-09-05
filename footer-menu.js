(function(){
  "use strict";

  if(window.TRAMI_CONFIG){
    window.TRAMI_CONFIG.alias="TRAMIPAGO";
  }

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
          <a href="opiniones.html">Opiniones</a>
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
          <span>Lun–vie 8–20 · Sáb–dom 16–20</span>
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
      .site-footer .footer-inner{display:block!important;width:min(1180px,calc(100% - clamp(30px,6vw,96px)))!important;max-width:none!important;margin-inline:auto!important;padding-inline:0!important}
      .footer-menu-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));column-gap:clamp(26px,5vw,78px);row-gap:22px;width:100%;align-items:start}
      .footer-menu-col{min-width:0;text-align:left}
      .footer-menu-col h3{margin:0 0 8px;color:#fff;font-size:10.5px;font-weight:650;letter-spacing:.02em}
      .footer-menu-col a,.footer-menu-col span{display:block;margin:4px 0;color:rgba(255,255,255,.82);font-size:9.5px;font-weight:400;line-height:1.35;text-decoration:none;overflow-wrap:anywhere}
      .footer-menu-col a:hover,.footer-menu-col a:focus-visible{color:#29B6F6;text-decoration:underline;text-underline-offset:2px}
      .footer-menu-bottom{display:flex;justify-content:space-between;align-items:center;gap:18px;flex-wrap:wrap;width:100%;margin-top:18px;padding-top:10px;border-top:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.68);font-size:9px;font-weight:400;line-height:1.3}

      .payment-access{display:none!important}
      .payment-access-v2{grid-template-columns:minmax(220px,.85fr) minmax(320px,1.35fr)!important;gap:16px!important;align-items:stretch!important}
      .payment-method-card{display:flex!important;flex-direction:column!important;justify-content:flex-start!important;background:#f8fbfd!important;border:1px solid #c8dae5!important;box-shadow:none!important}
      .payment-method-card h3{font-size:1.02rem!important;margin-bottom:10px!important}
      .payment-qr-image{width:190px!important;height:190px!important;margin:0 auto 10px!important;padding:4px!important;border:0!important;background:transparent!important}
      .payment-data-row{grid-template-columns:86px minmax(0,1fr) auto!important}
      .payment-data-row span{font-size:.78rem!important}
      .payment-data-row strong{font-size:.9rem!important}
      .payment-copy{min-height:30px!important;box-shadow:none!important}

      .email-pair{grid-column:1/-1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px 16px}
      .email-pair>.field{min-width:0}

      .button.button-primary,.step-actions .button-primary{background:#1B6FA8!important;color:#fff!important;border-color:#050505!important}
      .button.button-primary:hover,.button.button-primary:focus-visible,.step-actions .button-primary:hover,.step-actions .button-primary:focus-visible{background:#12537e!important}
      .main-nav button.nav-help{background:#25D366!important;color:#082A47!important}
      .main-nav button.nav-help:hover,.main-nav button.nav-help:focus-visible{background:#1fb657!important;color:#fff!important}

      .tramipago-error-box{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(8,42,71,.42)}
      .tramipago-error-card{width:min(460px,100%);padding:22px;border-radius:12px;background:#fff;border:1px solid #c8dae5;box-shadow:0 18px 48px rgba(0,0,0,.22);text-align:center}
      .tramipago-error-card h2{margin:0 0 8px;color:#082A47}
      .tramipago-error-actions{display:flex;gap:10px;justify-content:center;margin-top:16px;flex-wrap:wrap}

      @media(max-width:900px){.site-footer .footer-inner{width:min(720px,calc(100% - 36px))!important}.footer-menu-grid{grid-template-columns:repeat(2,minmax(0,1fr));column-gap:clamp(30px,9vw,90px)}}
      @media(max-width:760px){.payment-access-v2,.email-pair{grid-template-columns:1fr!important}}
      @media(max-width:520px){.site-footer .footer-inner{width:calc(100% - 30px)!important}.footer-menu-grid{grid-template-columns:1fr;row-gap:18px}.footer-menu-bottom{display:block}.footer-menu-bottom span{display:block;margin-top:4px}}
    `;
    document.head.appendChild(style);
  }

  function pairEmails(){
    const email=document.querySelector('input[name="email"]');
    const confirm=document.querySelector('input[name="emailConfirm"]');
    const emailField=email?.closest('.field');
    const confirmField=confirm?.closest('.field');
    const grid=emailField?.closest('.form-grid');
    if(!emailField||!confirmField||!grid||emailField.parentElement?.classList.contains('email-pair')) return;
    const pair=document.createElement('div');
    pair.className='email-pair';
    grid.insertBefore(pair,emailField);
    pair.append(emailField,confirmField);
  }

  function tidyPayment(){
    if(window.TRAMI_CONFIG) window.TRAMI_CONFIG.alias='TRAMIPAGO';
    const payment=document.querySelector('.payment-access-v2');
    if(!payment) return;
    const cards=payment.querySelectorAll('.payment-method-card');
    if(cards[0]){
      const title=cards[0].querySelector('h3');
      if(title) title.textContent='Pago por QR';
      const small=cards[0].querySelector('small');
      if(small) small.textContent='Escaneá el QR desde tu banco o billetera.';
    }
    if(cards[1]){
      const title=cards[1].querySelector('h3');
      if(title) title.textContent='Pago por transferencia';
      cards[1].querySelectorAll('.payment-data-row').forEach(row=>{
        const label=row.querySelector('span');
        const value=row.querySelector('strong');
        if(label&&/alias/i.test(label.textContent||'')) value.textContent='TRAMIPAGO';
      });
    }
  }

  function showSafeError(){
    if(document.querySelector('.tramipago-error-box')) return;
    const box=document.createElement('div');
    box.className='tramipago-error-box';
    box.innerHTML=`<div class="tramipago-error-card" role="alert"><h2>No pudimos completar esta acción</h2><p>Los datos que ya guardaste no se modificaron. Podés volver a intentar o regresar al inicio.</p><div class="tramipago-error-actions"><button class="button button-primary" type="button" data-error-retry>Reintentar</button><a class="button button-secondary" href="#/">Volver al inicio</a></div></div>`;
    document.body.appendChild(box);
    box.querySelector('[data-error-retry]')?.addEventListener('click',()=>location.reload());
  }

  addStyles();
  buildFooter();
  const enhance=()=>{buildFooter();pairEmails();tidyPayment();};
  new MutationObserver(()=>requestAnimationFrame(enhance)).observe(document.body,{childList:true,subtree:true});
  window.addEventListener('error',event=>{if(event?.error) showSafeError();});
  window.addEventListener('unhandledrejection',()=>showSafeError());
  enhance();
})();