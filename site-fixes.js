(function () {
  "use strict";

  const app = document.getElementById("app");
  if (!app) return;

  const REQUESTS_KEY = "tramipago_requests_v1";
  const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
  const MAX_LOCAL_FILE_BYTES = Number(window.TRAMI_CONFIG?.maxLocalFileBytes || 1500000);
  const IMAGE_TARGET_BYTES = Math.min(1200000, Math.max(700000, MAX_LOCAL_FILE_BYTES - 150000));

  function injectStyles() {
    if (document.getElementById("tramipago-site-review-styles")) return;
    const style = document.createElement("style");
    style.id = "tramipago-site-review-styles";
    style.textContent = `
      html,body{background:radial-gradient(circle at 12% 8%,rgba(41,182,246,.12),transparent 28%),radial-gradient(circle at 88% 18%,rgba(35,168,93,.07),transparent 24%),linear-gradient(180deg,#f8fbfd 0%,#eaf3f8 100%) fixed!important}
      .site-main{background:transparent!important}
      .home-hero-clean{background:linear-gradient(180deg,rgba(255,255,255,.78) 0%,rgba(237,244,248,.30) 100%)!important}
      .home-catalog,.process-shell,.family-page,.tracking-page{background:transparent!important}
      .panel,.family-heading,.family-service-card{background:#fff!important}
      .home-catalog .home-tile{border:1px solid #d7e4ec!important}

      .main-nav a.nav-home{background:#fff!important;color:#082A47!important}
      .main-nav a.nav-tracking{background:#29B6F6!important;color:#050505!important}
      .main-nav button.nav-help{background:#23A85D!important;color:#fff!important}
      .main-nav a.nav-home:hover,.main-nav a.nav-home:focus-visible{background:#dceaf3!important;color:#082A47!important}
      .main-nav a.nav-tracking:hover,.main-nav a.nav-tracking:focus-visible{background:#1B6FA8!important;color:#fff!important}
      .main-nav button.nav-help:hover,.main-nav button.nav-help:focus-visible{background:#126B3A!important;color:#fff!important}

      .service-summary{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:12px!important;align-items:start!important}
      .service-summary-block{min-width:0;height:100%;margin:0!important;padding:12px 14px!important;background:#f7fbfd!important;border:1px solid #d8e5ed!important;border-radius:10px!important}
      .service-summary-block h3{margin-top:0!important}
      .form-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:13px 16px!important}
      .form-grid .field-full{grid-column:1/-1!important}

      .anses-period-note{grid-column:1/-1!important;margin:0 0 2px;padding:10px 12px;border:1px solid #b8dbef;border-radius:9px;background:#eef8ff;color:#103b68;font-size:.9rem;line-height:1.4}
      .payment-access-v2{display:grid;grid-template-columns:minmax(210px,.8fr) minmax(280px,1.4fr);gap:14px;margin:14px 0 16px}
      .payment-method-card{min-width:0;padding:14px;background:#f7fbfd;border:1px solid #c9dce8;border-radius:10px}
      .payment-method-card h3{margin:0 0 10px;color:#082A47;font-size:1rem}
      .payment-qr-image{display:block;width:172px;height:172px;max-width:100%;margin:2px auto 8px;padding:7px;background:#fff;border:1px solid #d5e2ea;border-radius:8px}
      .payment-method-card small{display:block;color:#607789;line-height:1.35}
      .payment-data-row{display:grid;grid-template-columns:78px minmax(0,1fr) auto;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid #e2ebf0}
      .payment-data-row:last-of-type{border-bottom:0}
      .payment-data-row span{font-size:.8rem;color:#607789}
      .payment-data-row strong{min-width:0;overflow-wrap:anywhere;color:#082A47}
      .payment-copy{min-height:30px;padding:4px 8px;border:1px solid #082A47;border-radius:6px;background:#fff;color:#082A47;font:inherit;font-size:.75rem;font-weight:700;cursor:pointer}
      .payment-copy:hover,.payment-copy:focus-visible{background:#082A47;color:#fff}
      .upload-optimizer-note{display:block;margin-top:5px;color:#607789;font-size:.78rem}
      .upload-optimizer-note.is-working{color:#1B6FA8;font-weight:650}
      .upload-optimizer-note.is-ready{color:#126B3A;font-weight:650}
      .payment-review-note,.final-opinion-cta{margin:14px 0 0;padding:12px 14px;border-radius:9px;line-height:1.45}
      .payment-review-note{background:#eef8ff;border:1px solid #b8dbef;color:#103b68}
      .final-opinion-cta{background:#effaf4;border:1px solid #a8dfbd;color:#124c2d}
      .final-opinion-cta a{display:inline-block;margin-top:7px;font-weight:700}

      .payment-access{grid-template-columns:190px minmax(0,1fr)!important}
      .payment-qr{width:166px!important;height:166px!important}
      .tracking-new-query{margin-top:16px;color:#103b68!important;background:#fff!important}
      .eligibility-list{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:14px!important}
      .eligibility-question{min-width:0;margin:0!important;padding:13px 16px!important;border:2px solid #a8cde9!important;border-radius:999px!important}
      .eligibility-question legend{max-width:100%;margin:0 auto 6px;padding:0 8px;text-align:center;font-weight:700}
      .eligibility-options{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}
      .eligibility-options .choice-option{justify-content:center;min-height:38px!important;padding:6px 10px!important;border-radius:999px!important}
      .authority-direct-note{margin:14px 0 0;padding:11px 13px;color:#103b68;background:#eef8ff;border:1px solid #b8dbef;border-radius:9px;font-size:.88rem;line-height:1.45}
      .step-actions{position:static!important;margin-top:18px!important}
      .service-quick-summary{display:flex;justify-content:space-between;gap:14px;align-items:center;margin:0 0 16px;padding:10px 12px;color:#103b68;background:#eef8ff;border:1px solid #b8dbef;border-radius:9px}
      .service-quick-summary strong{font-size:.93rem}
      .service-quick-summary span{color:#607789;font-size:.82rem;text-align:right}
      .demo-global-banner{padding:7px 14px;text-align:center;color:#6b2a00;background:#fff2d9;border-bottom:1px solid #e8b65d;font-size:.86rem;font-weight:800}
      .payment-demo-card{grid-column:1/-1;text-align:center;background:#fff8e8!important;border-color:#e8b65d!important}
      .site-footer{padding:18px 0!important}
      .home-catalog .catalog-card-badge{color:#fff!important;background:#607789!important;border-color:#31516a!important}

      @media(max-width:760px){.service-quick-summary{display:block}.service-quick-summary span{display:block;margin-top:4px;text-align:left}}
      @media(max-width:760px){.service-summary,.form-grid{grid-template-columns:1fr!important}.form-grid .field-full,.anses-period-note{grid-column:auto!important}.payment-access-v2{grid-template-columns:1fr}}
      @media(max-width:620px){.payment-access{grid-template-columns:1fr!important}.eligibility-list{grid-template-columns:1fr!important}.payment-data-row{grid-template-columns:72px minmax(0,1fr)}.payment-data-row .payment-copy{grid-column:2;justify-self:start}}
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

  function enhanceDemoMode() {
    if (!window.TRAMI_CONFIG?.demoMode) return;
    if (!document.querySelector(".demo-global-banner")) {
      const banner = document.createElement("div");
      banner.className = "demo-global-banner";
      banner.setAttribute("role", "status");
      banner.textContent = "Versión de prueba · No realices pagos ni cargues documentación real.";
      document.querySelector(".site-header")?.insertAdjacentElement("afterend", banner);
    }
    const receiptLabel = document.querySelector('#payment-form label[for="receipt"]');
    if (receiptLabel && receiptLabel.textContent !== "Comprobante de prueba *") receiptLabel.textContent = "Comprobante de prueba *";
  }

  function configureAdminLink() {
    document.querySelectorAll("a.local-admin-link").forEach((link) => {
      const local = ["", "localhost", "127.0.0.1"].includes(location.hostname);
      const privateBuild = /TramiPago-web/i.test(location.pathname);
      if (local || privateBuild) link.setAttribute("href", "admin/index.html");
      else link.hidden = true;
    });
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
      const copy = "Leí y acepto los Términos y Condiciones y la Política de Privacidad. Autorizo a TramiPago a utilizar mis datos y documentos únicamente para gestionar el trámite solicitado.";
      if (label && label.textContent !== copy) label.textContent = copy;
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

  function validateEmailPair() {
    const email = document.querySelector('input[name="email"]');
    const confirm = document.querySelector('input[name="emailConfirm"]');
    if (!email || !confirm || confirm.dataset.pairReady === "true") return;
    confirm.dataset.pairReady = "true";
    const validate = () => {
      confirm.setCustomValidity(email.value.trim().toLowerCase() === confirm.value.trim().toLowerCase() ? "" : "Los correos electrónicos no coinciden.");
    };
    email.addEventListener("input", validate);
    confirm.addEventListener("input", validate);
    validate();
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
    from.value = min; to.value = max; from.min = min; from.max = max; to.min = min; to.max = max;
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

  function markOfficialFeeIncluded() {
    document.querySelectorAll(".service-summary-row").forEach((row) => {
      const label = row.querySelector("span");
      const value = row.querySelector("strong");
      if (label && value && /costo oficial/i.test(label.textContent || "")) {
        label.textContent = "Tasas oficiales";
        value.textContent = "Incluidas";
      }
    });
  }

  function enhancePaymentStage() {
    const form = document.getElementById("payment-form");
    if (!form) return;
    const panel = form.closest(".panel");
    if (!panel || panel.querySelector(".payment-access-v2")) return;

    panel.querySelectorAll(".notice").forEach((notice) => {
      if (/datos de pago:/i.test(notice.textContent || "")) notice.remove();
    });

    const config = window.TRAMI_CONFIG || {};
    const wrap = document.createElement("div");
    wrap.className = "payment-access-v2";
    wrap.innerHTML = config.demoMode
      ? `<section class="payment-method-card payment-demo-card">
          <h3>Simulación de pago</h3>
          <p>Esta versión permite probar el recorrido, pero no recibe pagos reales.</p>
          <small>Usá solamente un archivo de prueba, sin datos personales.</small>
        </section>`
      : `
        <section class="payment-method-card">
          <h3>Pago con QR</h3>
          <img class="payment-qr-image" src="${config.paymentQr || ""}" alt="QR de transferencia TramiPago" />
          <small>Escaneá el QR desde tu banco o billetera.</small>
        </section>
        <section class="payment-method-card">
          <h3>Transferencia</h3>
          <div class="payment-data-row"><span>Alias</span><strong>${config.alias || "—"}</strong><button class="payment-copy" type="button" data-copy-payment="${config.alias || ""}">Copiar</button></div>
          <div class="payment-data-row"><span>CBU / CVU</span><strong>${config.paymentCvu || "—"}</strong><button class="payment-copy" type="button" data-copy-payment="${config.paymentCvu || ""}">Copiar</button></div>
          <div class="payment-data-row"><span>Titular</span><strong>${config.paymentHolder || "—"}</strong></div>
          <small>${config.paymentNote || "Transferí el total indicado y cargá el comprobante."}</small>
        </section>`;
    form.insertAdjacentElement("beforebegin", wrap);
  }

  function enhanceFileHints() {
    document.querySelectorAll('input[type="file"]').forEach((input) => {
      const field = input.closest(".field");
      if (!field || field.querySelector(".upload-optimizer-note")) return;
      const note = document.createElement("small");
      note.className = "upload-optimizer-note";
      note.textContent = input.accept?.includes("image")
        ? "Las imágenes grandes se optimizan automáticamente antes de guardarse."
        : `Archivo máximo: ${(MAX_LOCAL_FILE_BYTES/1000000).toFixed(1)} MB.`;
      field.appendChild(note);
    });
  }

  function protectAuthorityDirectResult() {
    const title = document.querySelector(".tracking-result .status-header h2")?.textContent.trim() || "";
    if (!/antecedentes penales/i.test(title)) return;
    document.querySelectorAll(".tracking-result .file-download").forEach((link) => link.remove());
    const finalizedText = document.querySelector(".tracking-result .finalization-box > p");
    const finalCopy = "La gestión terminó. El Registro Nacional de Reincidencia envía el certificado directamente al correo del titular.";
    if (finalizedText && finalizedText.textContent !== finalCopy) finalizedText.textContent = finalCopy;
    const result = document.querySelector(".tracking-result");
    if (!result || result.querySelector(".authority-direct-note")) return;
    const note = document.createElement("div");
    note.className = "authority-direct-note";
    note.textContent = "El certificado de antecedentes penales no se descarga ni se almacena en TramiPago. El Registro Nacional de Reincidencia lo envía directamente al correo del titular.";
    result.appendChild(note);
  }

  function enhanceConfirmation() {
    const confirmation = document.querySelector(".confirmation");
    if (!confirmation || confirmation.querySelector(".payment-review-note")) return;
    const note = document.createElement("div");
    note.className = "payment-review-note";
    note.innerHTML = window.TRAMI_CONFIG?.demoMode
      ? "<strong>Prueba completada.</strong> No se registró un pago real ni se envió documentación."
      : "<strong>Comprobante recibido.</strong> El pago queda en revisión. El plazo del trámite comienza cuando TramiPago confirma la acreditación.";
    confirmation.appendChild(note);
  }

  function enhanceTracking() {
    const form = document.getElementById("tracking-form");
    if (form) {
      const submit = form.querySelector('button[type="submit"],button[data-tracking-new-query]');
      if (submit) {
        const hasResult = Boolean(document.querySelector(".tracking-result .status-header"));
        if (hasResult && !submit.hasAttribute("data-tracking-new-query")) {
          submit.type = "button";
          submit.textContent = "Consultar otro código";
          submit.setAttribute("data-tracking-new-query", "true");
          submit.classList.add("button-secondary", "tracking-new-query");
          submit.classList.remove("button-primary");
        }
      }
    }

    const result = document.querySelector(".tracking-result");
    if (!result || result.querySelector(".final-opinion-cta")) return;
    const text = result.textContent || "";
    if (/finalizado/i.test(text)) {
      const cta = document.createElement("div");
      cta.className = "final-opinion-cta";
      cta.innerHTML = '<strong>Trámite finalizado.</strong><br>Si querés, podés calificar tu experiencia.<br><a href="opiniones.html">Dejar una opinión</a>';
      result.appendChild(cta);
    }
  }

  async function compressImage(file) {
    if (!file || !String(file.type || "").startsWith("image/") || file.size <= IMAGE_TARGET_BYTES) return file;
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
      reader.readAsDataURL(file);
    });
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("No se pudo procesar la imagen."));
      image.src = dataUrl;
    });
    const maxSide = 2000;
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
    canvas.height = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));
    const ctx = canvas.getContext("2d", { alpha:false });
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    let quality = .88;
    let blob = null;
    while (quality >= .5) {
      blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      if (blob && blob.size <= IMAGE_TARGET_BYTES) break;
      quality -= .08;
    }
    if (!blob) return file;
    const base = String(file.name || "imagen").replace(/\.[^.]+$/, "");
    return new File([blob], `${base}.jpg`, { type:"image/jpeg", lastModified:Date.now() });
  }

  async function optimizeSelectedImage(input) {
    const file = input.files?.[0];
    if (!file || !String(file.type || "").startsWith("image/") || file.size <= MAX_LOCAL_FILE_BYTES) return;
    const field = input.closest(".field");
    const note = field?.querySelector(".upload-optimizer-note");
    const form = input.closest("form");
    const buttons = Array.from(form?.querySelectorAll('button[type="submit"]') || []);
    buttons.forEach((button) => button.disabled = true);
    if (note) { note.textContent = "Optimizando imagen…"; note.className = "upload-optimizer-note is-working"; }
    try {
      const optimized = await compressImage(file);
      if (optimized.size > MAX_LOCAL_FILE_BYTES) throw new Error("No pudimos reducir la imagen lo suficiente.");
      const transfer = new DataTransfer();
      transfer.items.add(optimized);
      input.files = transfer.files;
      if (note) { note.textContent = `Imagen optimizada: ${(optimized.size/1000000).toFixed(1)} MB.`; note.className = "upload-optimizer-note is-ready"; }
    } catch (error) {
      input.value = "";
      if (note) { note.textContent = error.message || "No se pudo optimizar la imagen."; note.className = "upload-optimizer-note"; }
    } finally {
      buttons.forEach((button) => button.disabled = false);
    }
  }

  function enhance() {
    enhanceDemoMode();
    configureAdminLink();
    ensureFamilyAvailability();
    normalizeConsentCopy();
    normalizeInputs();
    validateEmailPair();
    enhancePaymentStage();
    enhanceFileHints();
    protectAuthorityDirectResult();
    enhanceConfirmation();
    enhanceTracking();
  }

  document.addEventListener("change", (event) => {
    const input = event.target.closest?.('input[type="file"]');
    if (input) optimizeSelectedImage(input);
  });

  document.addEventListener("click", async (event) => {
    const copy = event.target.closest?.("[data-copy-payment]");
    if (copy) {
      event.preventDefault();
      const value = copy.getAttribute("data-copy-payment") || "";
      try { await navigator.clipboard.writeText(value); copy.textContent = "Copiado"; setTimeout(() => copy.textContent = "Copiar", 1200); }
      catch (_) { window.prompt("Copiá este dato:", value); }
      return;
    }

    const button = event.target.closest?.("[data-tracking-new-query]");
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
  let enhanceQueued = false;
  new MutationObserver(() => {
    if (enhanceQueued) return;
    enhanceQueued = true;
    window.requestAnimationFrame(() => {
      enhanceQueued = false;
      enhance();
    });
  }).observe(document.body, { childList:true, subtree:true });
  enhance();
})();