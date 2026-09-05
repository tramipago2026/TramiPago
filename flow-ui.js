(function () {
  "use strict";

  const REQUESTS_KEY = "tramipago_requests_v1";
  const OVERRIDES_KEY = "tramipago_service_overrides_v1";

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getRequestByCode(code) {
    const normalized = String(code || "").trim().toUpperCase();
    return readJSON(REQUESTS_KEY, []).find(function (item) {
      return String(item.code || "").toUpperCase() === normalized;
    }) || null;
  }

  function updateRequestByCode(code, changes) {
    const requests = readJSON(REQUESTS_KEY, []);
    const normalized = String(code || "").trim().toUpperCase();
    const index = requests.findIndex(function (item) {
      return String(item.code || "").toUpperCase() === normalized;
    });
    if (index < 0) return null;
    requests[index] = Object.assign({}, requests[index], changes, { updatedAt: new Date().toISOString() });
    writeJSON(REQUESTS_KEY, requests);
    return requests[index];
  }

  function isLocalEnvironment() {
    const hostname = String(window.location.hostname || "").toLowerCase();
    return ["", "localhost", "127.0.0.1", "[::1]", "fileserver"].includes(hostname) || hostname.endsWith(".local");
  }

  function injectStyles() {
    if (document.getElementById("tramipago-flow-styles")) return;
    const style = document.createElement("style");
    style.id = "tramipago-flow-styles";
    style.textContent = `
      .payment-access {
        display:grid;
        grid-template-columns:150px minmax(0,1fr);
        gap:20px;
        align-items:center;
        margin:18px 0;
        padding:18px;
        border:2px solid var(--navy, var(--ui-blue, #1769aa));
        border-radius:10px;
        background:var(--white, #fff);
        box-shadow:0 4px 9px rgba(5,5,5,.25);
      }
      .payment-qr-wrap { text-align:center; }
      .payment-qr { display:block; width:126px; height:126px; margin:0 auto 6px; }
      .payment-qr-wrap small,.payment-holder,.payment-hint { font-size:14px; }
      .payment-transfer-title { display:block; margin-bottom:8px; font-size:16px; }
      .payment-data-list { display:grid; gap:7px; margin:0; }
      .payment-data-row { display:grid; grid-template-columns:70px minmax(0,1fr); gap:8px; align-items:start; }
      .payment-data-row span { font-size:14px; }
      .payment-data-row strong { overflow-wrap:anywhere; font-size:16px; }
      .payment-copy {
        margin-top:12px;
        min-height:40px;
        padding:7px 14px;
        border:2px solid #050505;
        border-radius:8px;
        background:#fff;
        color:var(--navy-deep, #082A47);
        font:inherit;
        font-weight:750;
        cursor:pointer;
        box-shadow:0 4px 9px rgba(5,5,5,.25);
      }
      .payment-copy:hover,.payment-copy:focus-visible {
        background:var(--navy-deep, #082A47);
        color:#fff;
        border-color:#fff;
        outline:none;
      }
      .payment-hint { margin:12px 0 0; }

      .admin-flow-actions { display:flex; gap:10px; flex-wrap:wrap; margin:0 0 16px; }
      .admin-backup-tools { display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin:12px 0 20px; }
      .admin-backup-status { font-size:14px; font-weight:700; }
      .admin-status-control {
        padding:14px;
        margin-bottom:16px;
        border:2px solid var(--ui-border, #111827);
        border-radius:10px;
        background:#f7fafc;
        box-shadow:0 3px 8px rgba(5,5,5,.14);
      }
      .admin-status-control label {
        display:block;
        margin-bottom:7px;
        font-weight:800;
      }
      .admin-status-control select {
        min-height:44px;
        border:2px solid var(--ui-border, #111827);
        font-weight:750;
      }
      .admin-payment-preview {
        display:block;
        width:min(100%, 520px);
        max-height:520px;
        margin:12px 0 8px;
        object-fit:contain;
        border:2px solid var(--ui-border, #111827);
        border-radius:10px;
        background:#fff;
        box-shadow:0 4px 12px rgba(5,5,5,.18);
      }
      .admin-file-box h3,
      .admin-data-section h3 { margin-bottom:10px; }
      .local-admin-link {
        color:#fff;
        font-weight:800;
        text-decoration:underline;
        text-underline-offset:3px;
      }
      .local-admin-link:hover,.local-admin-link:focus-visible { color:var(--ui-cyan, #29B6F6); }

      @media (max-width:620px) {
        .payment-access { grid-template-columns:1fr; }
        .payment-data-row { grid-template-columns:1fr; gap:2px; }
      }
    `;
    document.head.appendChild(style);
  }

  function removeZeroOfficialFee() {
    const root = document.getElementById("app");
    if (!root) return;
    root.querySelectorAll(".service-summary-row, .summary-item").forEach(function (row) {
      const label = row.querySelector("span, small")?.textContent.trim().toLowerCase() || "";
      if (label !== "costo oficial") return;
      const value = row.querySelector("strong")?.textContent || "";
      const digits = value.replace(/[^0-9]/g, "");
      if (!digits || Number(digits) === 0) row.remove();
    });
  }

  function enhancePayment() {
    const form = document.getElementById("payment-form");
    if (!form) return;
    const panel = form.closest(".panel");
    if (!panel || panel.dataset.paymentReady === "true") return;

    const config = window.TRAMI_CONFIG || {};
    const alias = String(config.alias || "").trim();
    const cvu = String(config.paymentCvu || "").trim();
    const holder = String(config.paymentHolder || "").trim();
    if (!alias && !cvu) return;

    panel.querySelectorAll(".notice").forEach(function (notice) {
      const text = notice.textContent || "";
      if (/datos de pago:/i.test(text)) notice.remove();
      if (!config.demoMode && /modo prueba:/i.test(text)) notice.remove();
    });

    const box = document.createElement("div");
    box.className = "payment-access";
    box.innerHTML = `
      <div class="payment-qr-wrap">
        <img class="payment-qr" src="${String(config.paymentQr || "assets/qr-modo-prueba.svg")}" alt="QR con datos de transferencia" />
        <small>QR de transferencia</small>
      </div>
      <div class="payment-transfer">
        <strong class="payment-transfer-title">Transferencia</strong>
        <div class="payment-data-list">
          ${alias ? `<div class="payment-data-row"><span>Alias</span><strong>${alias}</strong></div>` : ""}
          ${cvu ? `<div class="payment-data-row"><span>CVU</span><strong>${cvu}</strong></div>` : ""}
          ${holder ? `<div class="payment-data-row"><span>Titular</span><strong>${holder}</strong></div>` : ""}
        </div>
        <button class="payment-copy" type="button" data-copy-payment>Copiá datos</button>
        <p class="payment-hint">Transferí el total indicado arriba y después cargá el comprobante.</p>
      </div>
    `;

    const summary = panel.querySelector(".summary-grid");
    if (summary) summary.insertAdjacentElement("afterend", box);
    else form.insertAdjacentElement("beforebegin", box);
    panel.dataset.paymentReady = "true";
  }

  async function copyPaymentData(button) {
    const config = window.TRAMI_CONFIG || {};
    const lines = [
      config.alias ? `Alias: ${config.alias}` : "",
      config.paymentCvu ? `CVU: ${config.paymentCvu}` : "",
      config.paymentHolder ? `Titular: ${config.paymentHolder}` : ""
    ].filter(Boolean);
    const text = lines.join("\n");
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      const previous = button.textContent;
      button.textContent = "Copiado";
      window.setTimeout(function () { button.textContent = previous; }, 1400);
    } catch (_) {
      button.textContent = "Seleccioná y copiá los datos";
    }
  }

  function adminRequestForForm(form) {
    const panel = form && form.closest(".panel");
    const code = panel && panel.querySelector(".panel-header .eyebrow")?.textContent.trim();
    return code ? getRequestByCode(code) : null;
  }

  function showAdminFormError(form, message) {
    const error = form.querySelector(".form-error");
    if (!error) return;
    error.textContent = message;
    error.classList.toggle("visible", Boolean(message));
  }

  function prepareAdminSave(event) {
    const form = event.target;
    if (!form || form.id !== "request-form") return;
    const status = form.elements.namedItem("status");
    if (!status) return;

    const request = adminRequestForForm(form);
    const resultText = String(form.elements.namedItem("result")?.value || "").trim();
    const newFile = form.elements.namedItem("resultFile")?.files?.[0] || null;
    const hasExistingResult = Boolean(request?.result || request?.resultFile?.dataUrl);
    const hasResult = Boolean(resultText || newFile || hasExistingResult);

    if (status.value === "finalized" && !hasResult) {
      event.preventDefault();
      event.stopImmediatePropagation();
      showAdminFormError(form, "Para finalizar el trámite, cargá un resultado o un archivo final.");
      return;
    }

    if (hasResult && !["needs_info", "cancelled"].includes(status.value)) {
      status.value = "finalized";
    }
  }

  function enhanceAdminFlow() {
    const form = document.getElementById("request-form");
    if (!form || form.dataset.flowReady === "true") return;
    const request = adminRequestForForm(form);
    if (!request) return;

    const status = form.elements.namedItem("status");
    if (status) {
      const field = status.closest(".field");
      if (field) {
        field.classList.add("admin-status-control");
        const label = field.querySelector("label");
        if (label) label.textContent = "Estado del trámite";
      }
    }

    const paymentBox = form.closest(".panel")?.querySelector(".admin-file-box");
    if (paymentBox && request.payment?.dataUrl && !paymentBox.querySelector(".admin-payment-preview")) {
      const type = String(request.payment.type || "").toLowerCase();
      if (type.startsWith("image/") || String(request.payment.dataUrl).startsWith("data:image/")) {
        const image = document.createElement("img");
        image.className = "admin-payment-preview";
        image.src = request.payment.dataUrl;
        image.alt = `Comprobante de pago ${request.code}`;
        paymentBox.appendChild(image);
      }
    }

    const dataTitle = form.closest(".panel")?.querySelector(".admin-data-section h3");
    if (dataTitle) dataTitle.textContent = "Ficha completa del trámite";

    if (request.status === "payment_review") {
      const actions = document.createElement("div");
      actions.className = "admin-flow-actions";
      actions.innerHTML = '<button class="button button-primary" type="button" data-admin-approve-payment>Aprobar pago e iniciar</button>';
      form.insertAdjacentElement("beforebegin", actions);
    }

    const submit = form.querySelector('button[type="submit"]');
    if (submit) submit.textContent = request.status === "finalized" ? "Guardar cambios" : "Guardar estado y cambios";
    form.dataset.flowReady = "true";
  }

  function updateAdminSubmitLabel(form) {
    if (!form || form.id !== "request-form") return;
    const submit = form.querySelector('button[type="submit"]');
    if (!submit) return;
    const resultText = String(form.elements.namedItem("result")?.value || "").trim();
    const file = form.elements.namedItem("resultFile")?.files?.[0] || null;
    if (resultText || file) submit.textContent = "Finalizar y entregar";
    else submit.textContent = "Guardar estado y cambios";
  }

  function approvePayment(button) {
    const form = document.getElementById("request-form");
    const request = adminRequestForForm(form);
    if (!request || request.status !== "payment_review") return;
    updateRequestByCode(request.code, { status: "in_progress", requestedFields: [] });
    button.disabled = true;
    window.dispatchEvent(new Event("storage"));
  }

  function enhanceAdminBackup() {
    const adminMain = document.getElementById("admin-app");
    if (!adminMain || document.querySelector(".admin-backup-tools")) return;
    const notice = adminMain.querySelector(".notice");
    if (!notice) return;
    const tools = document.createElement("div");
    tools.className = "admin-backup-tools";
    tools.innerHTML = `
      <button class="button button-secondary" type="button" data-export-backup>Exportar respaldo</button>
      <button class="button button-secondary" type="button" data-import-backup>Importar respaldo</button>
      <input type="file" accept="application/json,.json" data-import-backup-file hidden />
      <span class="admin-backup-status" aria-live="polite"></span>
    `;
    notice.insertAdjacentElement("afterend", tools);
  }

  function addLocalAdminAccess() {
    if (!isLocalEnvironment() || document.getElementById("admin-app") || document.querySelector(".local-admin-link")) return;
    const legalLinks = document.querySelector(".site-footer .legal-links");
    if (!legalLinks) return;
    const link = document.createElement("a");
    link.className = "local-admin-link";
    link.href = "admin/";
    link.textContent = "Panel Admin";
    legalLinks.appendChild(link);
  }

  function setBackupStatus(message) {
    const status = document.querySelector(".admin-backup-status");
    if (status) status.textContent = message;
  }

  function exportBackup() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      requests: readJSON(REQUESTS_KEY, []),
      serviceOverrides: readJSON(OVERRIDES_KEY, {})
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tramipago-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setBackupStatus("Respaldo exportado.");
  }

  async function importBackup(input) {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!Array.isArray(parsed.requests) || !parsed.serviceOverrides || typeof parsed.serviceOverrides !== "object") {
        throw new Error("Formato inválido");
      }
      writeJSON(REQUESTS_KEY, parsed.requests);
      writeJSON(OVERRIDES_KEY, parsed.serviceOverrides);
      setBackupStatus("Respaldo importado.");
      window.dispatchEvent(new Event("storage"));
    } catch (_) {
      setBackupStatus("No se pudo importar ese respaldo.");
    } finally {
      input.value = "";
    }
  }

  function refreshTrackingFromStorage(event) {
    if (event && event.key && event.key !== REQUESTS_KEY) return;
    if (location.hash !== "#/seguimiento") return;
    const form = document.getElementById("tracking-form");
    const input = form?.elements.namedItem("trackingCode");
    if (form && input && String(input.value || "").trim()) form.requestSubmit();
  }

  function enhance() {
    injectStyles();
    removeZeroOfficialFee();
    enhanceAdminFlow();
    enhanceAdminBackup();
    addLocalAdminAccess();
  }

  document.addEventListener("click", function (event) {
    const copyButton = event.target.closest("[data-copy-payment]");
    if (copyButton) {
      event.preventDefault();
      copyPaymentData(copyButton);
      return;
    }

    const approveButton = event.target.closest("[data-admin-approve-payment]");
    if (approveButton) {
      event.preventDefault();
      approvePayment(approveButton);
      return;
    }

    if (event.target.closest("[data-export-backup]")) {
      event.preventDefault();
      exportBackup();
      return;
    }

    if (event.target.closest("[data-import-backup]")) {
      event.preventDefault();
      document.querySelector("[data-import-backup-file]")?.click();
    }
  });

  document.addEventListener("input", function (event) {
    if (event.target.closest("#request-form")) updateAdminSubmitLabel(document.getElementById("request-form"));
  });

  document.addEventListener("change", function (event) {
    if (event.target.matches("[data-import-backup-file]")) {
      importBackup(event.target);
      return;
    }
    if (event.target.closest("#request-form")) updateAdminSubmitLabel(document.getElementById("request-form"));
  });

  document.addEventListener("submit", prepareAdminSave, true);
  window.addEventListener("storage", refreshTrackingFromStorage);

  [document.getElementById("app"), document.getElementById("admin-app")].filter(Boolean).forEach(function (root) {
    let enhanceQueued = false;
    new MutationObserver(function () {
      if (enhanceQueued) return;
      enhanceQueued = true;
      window.requestAnimationFrame(function () {
        enhanceQueued = false;
        enhance();
      });
    }).observe(root, { childList: true, subtree: true });
  });

  enhance();
})();

