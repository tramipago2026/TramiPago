(function () {
  "use strict";

  const app = document.getElementById("app");
  if (!app) return;
  const REQUESTS_KEY = "tramipago_requests_v1";
  const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

  function injectStyles() {
    if (document.getElementById("tramipago-site-review-styles")) return;
    const style = document.createElement("style");
    style.id = "tramipago-site-review-styles";
    style.textContent = `
      html, body { background:#edf4f8 !important; }
      .site-main { background:#edf4f8 !important; }
      .home-hero-clean { background:linear-gradient(180deg,#f8fbfd 0%,#edf4f8 100%) !important; }
      .home-catalog,.process-shell,.family-page,.tracking-page { background:#edf4f8 !important; }
      .panel,.family-heading,.family-service-card { background:#fff !important; }
      .home-catalog .home-tile { border:1px solid #d7e4ec !important; }

      .main-nav a.nav-home {
        background:#fff !important;
        color:#082A47 !important;
      }
      .main-nav a.nav-tracking {
        background:#29B6F6 !important;
        color:#050505 !important;
      }
      .main-nav button.nav-help {
        background:#23A85D !important;
        color:#fff !important;
      }
      .main-nav a.nav-home:hover,.main-nav a.nav-home:focus-visible { background:#dceaf3 !important; color:#082A47 !important; }
      .main-nav a.nav-tracking:hover,.main-nav a.nav-tracking:focus-visible { background:#1B6FA8 !important; color:#fff !important; }
      .main-nav button.nav-help:hover,.main-nav button.nav-help:focus-visible { background:#126B3A !important; color:#fff !important; }

      .service-summary {
        display:grid !important;
        grid-template-columns:repeat(3,minmax(0,1fr)) !important;
        gap:12px !important;
        align-items:start !important;
      }
      .service-summary-block {
        min-width:0;height:100%;margin:0 !important;padding:12px 14px !important;
        background:#f7fbfd !important;border:1px solid #d8e5ed !important;border-radius:10px !important;
      }
      .service-summary-block h3 { margin-top:0 !important; }
      .form-grid { grid-template-columns:repeat(2,minmax(0,1fr)) !important;gap:13px 16px !important; }
      .form-grid .field-full { grid-column:1 / -1 !important; }

      .anses-period-note {
        grid-column:1 / -1 !important;
        margin:0 0 2px;
        padding:10px 12px;
        border:1px solid #b8dbef;
        border-radius:9px;
        background:#eef8ff;
        color:#103b68;
        font-size:.9rem;
        line-height:1.4;
      }

      .payment-access { grid-template-columns:190px minmax(0,1fr) !important; }
      .payment-qr { width:166px !important;height:166px !important; }
      .tracking-new-query { margin-top:16px;color:#103b68 !important;background:#fff !important; }
      .eligibility-list { display:grid !important;grid-template-columns:repeat(2,minmax(0,1fr)) !important;gap:14px !important; }
      .eligibility-question { min-width:0;margin:0 !important;padding:13px 16px !important;border:2px solid #a8cde9 !important;border-radius:999px !important; }
      .eligibility-question legend { max-width:100%;margin:0 auto 6px;padding:0 8px;text-align:center;font-weight:700; }
      .eligibility-options { display:grid !important;grid-template-columns:repeat(2,minmax(0,1fr)) !important;gap:8px !important; }
      .eligibility-options .choice-option { justify-content:center;min-height:38px !important;padding:6px 10px !important;border-radius:999px !important; }

      .authority-direct-note {
        margin:14px 0 0;padding:11px 13px;color:#103b68;background:#eef8ff;
        border:1px solid #b8dbef;border-radius:9px;font-size:.88rem;line-height:1.45;
      }

      .site-footer .footer-inner { align-items:flex-start !important;gap:14px !important; }
      .site-footer .footer-inner > span:first-child,
      .site-footer .legal-links a {
        color:#fff !important;
        font-size:9.5px !important;
        font-weight:400 !important;
        line-height:1.25 !important;
      }
      .site-footer .legal-links {
        display:flex !important;flex-wrap:wrap !important;justify-content:flex-end !important;
        gap:3px 10px !important;max-width:760px;margin-left:auto;line-height:1.25;text-align:right;
      }
      .site-footer .legal-links a {
        text-decoration-thickness:1px !important;text-underline-offset:2px !important;white-space:nowrap;
      }
      .site-footer .legal-links a:hover,.site-footer .legal-links a:focus-visible { color:#29B6F6 !important; }
      .site-footer .consumer-legal-note {
        flex-basis:100%;color:rgba(255,255,255,.68);font-size:8.5px;font-weight:400;line-height:1.25;text-align:right;
      }

      @media (max-width:760px) {
        .service-summary,.form-grid { grid-template-columns:1fr !important; }
        .form-grid .field-full,.anses-period-note { grid-column:auto !important; }
      }
      @media (max-width:620px) {
        .payment-access { grid-template-columns:1fr !important; }
        .eligibility-list { grid-template-columns:1fr !important; }
        .site-footer .footer-inner { display:block !important; }
        .site-footer .legal-links { justify-content:flex-start !important;margin:7px 0 0 !important;text-align:left !important; }
        .site-footer .consumer-legal-note { text-align:left !important; }
      }
    `;
    document.head.appendChild(style);
  }

  function stripStoredFile(file) {
    if (!file || typeof file !== "object" || !file.dataUrl) return file;
    return { ...file, dataUrl:null, removedAt:new Date().toISOString() };
  }

  function cleanupExpiredFiles() {
    try {
      const requests = JSON.parse(localStorage.getItem(REQUESTS_KEY) || "[]");
      if (!Array.isArray(requests) || !requests.length) return;
      let changed = false;
      const now = Date.now();
      const next = requests.map((request) => {
        if (!["finalized", "cancelled"].includes(request.status)) return request;
        const closedAt = Date.parse(request.updatedAt || request.createdAt || "");
        if (!Number.isFinite(closedAt) || now - closedAt < RETENTION_MS) return request;
        const copy = { ...request };
        if (copy.payment?.dataUrl) { copy.payment = stripStoredFile(copy.payment); changed = true; }
        if (copy.resultFile?.dataUrl) { copy.resultFile = stripStoredFile(copy.resultFile); changed = true; }
        if (copy.answers && typeof copy.answers === "object") {
          const answers = { ...copy.answers };
          Object.keys(answers).forEach((key) => {
            if (answers[key]?.dataUrl) { answers[key] = stripStoredFile(answers[key]); changed = true; }
          });
          copy.answers = answers;
        }
        return copy;
      });
      if (changed) localStorage.setItem(REQUESTS_KEY, JSON.stringify(next));
    } catch (_) {}
  }

  function fixAdminLink() {
    document.querySelectorAll("a.local-admin-link").forEach((link) => {
      if (link.getAttribute("href") !== "admin/index.html") link.setAttribute("href", "admin/index.html");
    });
  }

  function ensureConsumerLinks() {
    const legalLinks = document.querySelector(".site-footer .legal-links");
    if (!legalLinks) return;
    const links = [
      { href:"arrepentimiento.html", text:"BOTÓN DE ARREPENTIMIENTO", key:"consumer-withdrawal" },
      { href:"baja-servicio.html", text:"BOTÓN DE BAJA DE SERVICIO", key:"consumer-cancel" }
    ];
    links.forEach((item) => {
      if (legalLinks.querySelector(`[data-legal-link="${item.key}"]`)) return;
      const anchor = document.createElement("a");
      anchor.href = item.href;
      anchor.textContent = item.text;
      anchor.setAttribute("data-legal-link", item.key);
      legalLinks.appendChild(anchor);
    });
    if (!legalLinks.querySelector(".consumer-legal-note")) {
      const note = document.createElement("span");
      note.className = "consumer-legal-note";
      note.textContent = "Revocación y baja por canal digital · sin registración previa · respuesta con código de solicitud dentro de 24 h.";
      legalLinks.appendChild(note);
    }
  }

  function ensureFamilyAvailability() {
    const families = window.TRAMI_FAMILIES || [];
    const services = window.TRAMI_SERVICES || [];
    families.forEach((family) => {
      const tile = document.querySelector(`.home-tile[data-family-id="${family.id}"]`);
      if (!tile) return;
      const hasAvailable = (family.serviceIds || []).some((id) => services.some((service) => service.id === id && service.active));
      if (hasAvailable || tile.dataset.familyChecked === "true") return;
      tile.dataset.familyChecked = "true";
      tile.removeAttribute("data-action");
      tile.disabled = true;
      tile.setAttribute("aria-disabled", "true");
      tile.classList.add("is-unavailable");
      if (!tile.querySelector(".catalog-card-badge")) {
        const badge = document.createElement("span");
        badge.className = "catalog-card-badge";
        badge.textContent = "Próximamente";
        tile.appendChild(badge);
      }
    });
  }

  function normalizeConsentCopy() {
    document.querySelectorAll('.form-check input[name="authorization"]').forEach((input) => {
      const label = input.closest("label")?.querySelector(".form-check-label");
      if (!label) return;
      label.textContent = "Leí y acepto los Términos y Condiciones y la Política de Privacidad. Autorizo a TramiPago a utilizar mis datos y documentos únicamente para gestionar el trámite solicitado.";
    });
  }

  function normalizeInputs() {
    document.querySelectorAll('input[name="cuil"]').forEach((input) => {
      if (input.dataset.cuilReady === "true") return;
      input.dataset.cuilReady = "true";
      input.addEventListener("input", () => {
        const digits = input.value.replace(/\D/g, "").slice(0, 11);
        if (digits.length <= 2) input.value = digits;
        else if (digits.length <= 10) input.value = `${digits.slice(0,2)}-${digits.slice(2)}`;
        else input.value = `${digits.slice(0,2)}-${digits.slice(2,10)}-${digits.slice(10)}`;
      });
    });
    document.querySelectorAll('input[name="patent"]').forEach((input) => {
      if (input.dataset.patentReady === "true") return;
      input.dataset.patentReady = "true";
      input.addEventListener("input", () => { input.value = input.value.toUpperCase(); });
    });
  }

  function monthLabel(value) {
    if (!/^\d{4}-\d{2}$/.test(value)) return value;
    const [year, month] = value.split("-").map(Number);
    return new Intl.DateTimeFormat("es-AR", { month:"long", year:"numeric" }).format(new Date(year, month - 1, 1));
  }

  function configureAnsesPeriod() {
    const from = document.querySelector('input[name="periodFrom"]');
    const to = document.querySelector('input[name="periodTo"]');
    if (!from || !to || from.dataset.periodReady === "true") return;
    from.dataset.periodReady = "true";
    const now = new Date();
    const max = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
    const minDate = new Date(now.getFullYear(), now.getMonth()-5, 1);
    const min = `${minDate.getFullYear()}-${String(minDate.getMonth()+1).padStart(2,"0")}`;
    from.value = min;
    to.value = max;
    from.min = min; from.max = max;
    to.min = min; to.max = max;
    const fromField = from.closest(".field");
    const toField = to.closest(".field");
    if (fromField) fromField.hidden = true;
    if (toField) toField.hidden = true;
    const formGrid = from.closest("form")?.querySelector(".form-grid");
    if (formGrid && !formGrid.querySelector(".anses-period-note")) {
      const note = document.createElement("div");
      note.className = "anses-period-note";
      note.innerHTML = `<strong>Período automático:</strong> ${monthLabel(min)} a ${monthLabel(max)}. No tenés que elegir fechas.`;
      formGrid.insertAdjacentElement("afterbegin", note);
    }
  }

  function protectAuthorityDirectResult() {
    const title = document.querySelector(".tracking-result .status-header h2")?.textContent.trim() || "";
    if (!/antecedentes penales/i.test(title)) return;
    document.querySelectorAll(".tracking-result .file-download").forEach((link) => link.remove());
    const finalizedText = document.querySelector(".tracking-result .finalization-box > p");
    if (finalizedText) finalizedText.textContent = "La gestión terminó. El Registro Nacional de Reincidencia envía el certificado directamente al correo del titular.";
    const result = document.querySelector(".tracking-result");
    if (!result || result.querySelector(".authority-direct-note")) return;
    const note = document.createElement("div");
    note.className = "authority-direct-note";
    note.textContent = "El certificado de antecedentes penales no se descarga ni se almacena en TramiPago. El Registro Nacional de Reincidencia lo envía directamente al correo del titular.";
    result.appendChild(note);
  }

  function enhanceTracking() {
    const form = document.getElementById("tracking-form");
    if (!form) return;
    const submit = form.querySelector('button[type="submit"], button[data-tracking-new-query]');
    if (!submit) return;
    const hasResult = Boolean(document.querySelector(".tracking-result .status-header"));
    if (hasResult && !submit.hasAttribute("data-tracking-new-query")) {
      submit.type = "button";
      submit.textContent = "Consultar otro código";
      submit.setAttribute("data-tracking-new-query", "true");
      submit.classList.add("button-secondary", "tracking-new-query");
      submit.classList.remove("button-primary");
      return;
    }
    if (!hasResult && submit.hasAttribute("data-tracking-new-query")) {
      submit.type = "submit";
      submit.textContent = "Consultar";
      submit.removeAttribute("data-tracking-new-query");
      submit.classList.add("button-primary");
      submit.classList.remove("button-secondary", "tracking-new-query");
    }
  }

  function enhance() {
    fixAdminLink();
    ensureConsumerLinks();
    ensureFamilyAvailability();
    normalizeConsentCopy();
    normalizeInputs();
    configureAnsesPeriod();
    protectAuthorityDirectResult();
    enhanceTracking();
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-tracking-new-query]");
    if (!button) return;
    event.preventDefault();
    const form = document.getElementById("tracking-form");
    const input = form?.elements.namedItem("trackingCode");
    if (!input) return;
    input.value = "";
    button.type = "submit";
    button.textContent = "Consultar";
    button.removeAttribute("data-tracking-new-query");
    button.classList.add("button-primary");
    button.classList.remove("button-secondary", "tracking-new-query");
    input.focus();
  });

  cleanupExpiredFiles();
  injectStyles();
  new MutationObserver(() => window.requestAnimationFrame(enhance)).observe(document.body, { childList:true, subtree:true });
  enhance();
})();
