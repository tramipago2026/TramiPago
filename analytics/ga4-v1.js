/* TramiPago V1 — GA4 (preparado, no activado). No envía datos sin consentimiento explícito.
 * Requiere ID real G-... y revisión/autorización de privacidad antes de integrarlo en HTML.
 * No lee formularios, códigos ni parámetros de URL. Una conexión posterior con Google
 * puede transmitir datos técnicos de red, como la IP, según sus condiciones.
 */
(function () {
  'use strict';
  const storageKey = 'tramipago_v1_internal_analytics_test';
  const w = window;
  let enabled = false;
  let loading = false;
  let currentId = '';

  function isTestBrowser() {
    try { return w.localStorage.getItem(storageKey) === '1'; } catch { return false; }
  }
  function markTestBrowser() {
    try { w.localStorage.setItem(storageKey, '1'); return true; } catch { return false; }
  }
  function unmarkTestBrowser() {
    try { w.localStorage.removeItem(storageKey); return true; } catch { return false; }
  }
  function pageLocation() {
    const hash = String(w.location.hash || '');
    const safeHash = hash === '#/' || hash === '' ? '#/'
      : /^#\/[a-z][a-z0-9-]*(?:\/[a-z][a-z0-9-]*){0,2}$/i.test(hash)
        ? hash : '#/otra';
    // Se excluyen query strings, códigos, WhatsApp y fragments no permitidos.
    return w.location.origin + w.location.pathname + safeHash;
  }
  function gtag() { w.dataLayer.push(arguments); }
  function pageView() {
    if (!enabled || !currentId) return;
    gtag('event', 'page_view', {
      page_location: pageLocation(),
      debug_mode: isTestBrowser(),
    });
  }
  function start(measurementId, options) {
    // Ningún Google script, cookie, ping ni evento sin señal positiva de consentimiento.
    if (!options || options.consentGranted !== true) return false;
    if (typeof measurementId !== 'string' || !/^G-[A-Z0-9]{4,15}$/.test(measurementId)) return false;
    if (enabled || loading) return false;
    currentId = measurementId;
    loading = true;
    w.dataLayer = w.dataLayer || [];
    gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
    });
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
    script.onload = function () {
      if (!loading) return; // No reactivar tras revocación en mitad de la carga.
      loading = false;
      enabled = true;
      gtag('consent', 'update', { analytics_storage: 'granted' });
      gtag('js', new Date());
      gtag('config', currentId, {
        send_page_view: false,
        debug_mode: isTestBrowser(),
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      });
      pageView();
    };
    script.onerror = function () { loading = false; currentId = ''; };
    document.head.appendChild(script);
    return true;
  }
  function revokeConsent() {
    enabled = false;
    loading = false;
    if (w.dataLayer) gtag('consent', 'update', { analytics_storage: 'denied' });
    currentId = '';
    // El sitio debe ofrecer gestión del consentimiento por una vía aprobada.
    // Esta función no promete borrar cookies GA previamente existentes.
  }
  w.addEventListener('hashchange', pageView);
  w.TramiPagoGA4 = Object.freeze({ start, revokeConsent, markTestBrowser, unmarkTestBrowser, isTestBrowser });
})();
