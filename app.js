(function () {
  "use strict";

  const app = document.getElementById("app");
  if (!app) return;

  const REQUESTS_KEY = "tramipago_requests_v1";
  const COUNTER_KEY = "tramipago_counter_v1";
  const OVERRIDES_KEY = "tramipago_service_overrides_v1";
  const ACTIVE_REQUEST_KEY = "tramipago_active_request_v1";
  const MAX_LOCAL_FILE_BYTES = Number(window.TRAMI_CONFIG?.maxLocalFileBytes || 1500000);

  const STATUS_LABELS = Object.freeze({
    payment_pending: "Pago pendiente",
    payment_review: "Pago en revisión",
    in_progress: "En proceso",
    needs_info: "Falta información",
    ready: "Listo para entregar",
    finalized: "Finalizado",
    cancelled: "Cancelado"
  });

  const PROGRESS_STATUSES = ["payment_pending", "payment_review", "in_progress", "ready", "finalized"];

  const state = {
    route: "home",
    familyId: null,
    serviceId: null,
    step: null,
    draft: {},
    requestId: null,
    trackingCode: "",
    trackingResult: null,
    trackingError: "",
    returnHash: "#/"
  };

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

  function getRequests() {
    return readJSON(REQUESTS_KEY, []);
  }

  function saveRequests(requests) {
    writeJSON(REQUESTS_KEY, requests);
  }

  function getBaseService(serviceId) {
    return (window.TRAMI_SERVICES || []).find((item) => item.id === serviceId) || null;
  }

  function hasCommercialData(service) {
    if (!service) return false;
    if (service.officialFee === null || service.officialFee === undefined || service.officialFee === "") return false;
    if (!Array.isArray(service.priceOptions) || !service.priceOptions.length) return false;
    return service.priceOptions.every((option) => {
      const amountReady = option.amount !== null && option.amount !== undefined && option.amount !== "";
      const duration = String(option.duration || "").trim();
      return amountReady && duration && !/confirmar/i.test(duration);
    });
  }

  function getService(serviceId) {
    const base = getBaseService(serviceId);
    if (!base) return null;

    const override = readJSON(OVERRIDES_KEY, {})[serviceId] || {};
    const overrideOptions = override.priceOptions || {};
    const priceOptions = (base.priceOptions || []).map((option) => ({
      ...option,
      ...(overrideOptions[option.value] || {})
    }));
    const merged = { ...base, ...override, priceOptions };

    return {
      ...merged,
      active: Boolean(merged.active && (window.TRAMI_CONFIG?.demoMode || hasCommercialData(merged)))
    };
  }

  function getFamily(familyId) {
    return (window.TRAMI_FAMILIES || []).find((item) => item.id === familyId) || null;
  }

  function getRequest(requestId) {
    return getRequests().find((request) => request.id === requestId) || null;
  }

  function updateRequest(requestId, changes) {
    const requests = getRequests();
    const index = requests.findIndex((request) => request.id === requestId);
    if (index < 0) return null;
    requests[index] = { ...requests[index], ...changes, updatedAt: new Date().toISOString() };
    saveRequests(requests);
    return requests[index];
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatARS(amount) {
    if (amount === null || amount === undefined || amount === "") return "A confirmar";
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0
    }).format(Number(amount));
  }

  function formatDate(value) {
    if (!value) return "";
    return new Intl.DateTimeFormat("es-AR", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  }

  function statusLabel(status) {
    return STATUS_LABELS[status] || "Estado pendiente";
  }

  function selectedPriceOption(service, values) {
    if (!service?.priceOptions?.length) return null;
    const selected = service.priceField ? values?.[service.priceField] : null;
    return service.priceOptions.find((option) => option.value === selected) || service.priceOptions[0];
  }

  function getPricing(service, values) {
    const option = selectedPriceOption(service, values);
    const officialFee = service.officialFee;
    const serviceFee = option?.amount ?? null;
    const total = officialFee !== null && officialFee !== undefined && serviceFee !== null && serviceFee !== undefined
      ? Number(officialFee) + Number(serviceFee)
      : null;

    return {
      officialFee,
      serviceFee,
      total,
      optionLabel: option?.label || "A confirmar",
      duration: option?.duration || "Plazo a confirmar"
    };
  }

  function buildCode(prefix) {
    const current = Number(localStorage.getItem(COUNTER_KEY) || "0") + 1;
    localStorage.setItem(COUNTER_KEY, String(current));
    const suffix = Math.random().toString(36).slice(2, 4).toUpperCase();
    return `${prefix}-${String(current).padStart(5, "0")}-${suffix}`;
  }

  function createId() {
    return window.crypto?.randomUUID?.() || `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function createRequest(service, values) {
    const now = new Date().toISOString();
    const request = {
      id: createId(),
      code: buildCode(service.codePrefix),
      serviceId: service.id,
      serviceName: service.name,
      clientName: values.fullName || "",
      answers: values,
      pricing: getPricing(service, values),
      status: "payment_pending",
      observations: [],
      requestedFields: [],
      result: "",
      resultFile: null,
      payment: null,
      createdAt: now,
      updatedAt: now
    };
    const requests = getRequests();
    requests.unshift(request);
    saveRequests(requests);
    rememberActiveRequest(request);
    return request;
  }

  function rememberActiveRequest(request) {
    if (!request) return;
    sessionStorage.setItem(ACTIVE_REQUEST_KEY, JSON.stringify({
      id: request.id,
      code: request.code,
      serviceId: request.serviceId
    }));
  }

  function clearActiveRequest() {
    sessionStorage.removeItem(ACTIVE_REQUEST_KEY);
  }

  function activePendingRequest(serviceId = null) {
    try {
      const ref = JSON.parse(sessionStorage.getItem(ACTIVE_REQUEST_KEY) || "null");
      if (!ref) return null;
      const request = getRequests().find((item) => item.id === ref.id || item.code === ref.code) || null;
      if (!request || request.status !== "payment_pending") {
        clearActiveRequest();
        return null;
      }
      if (serviceId && request.serviceId !== serviceId) return null;
      return request;
    } catch (_) {
      clearActiveRequest();
      return null;
    }
  }

  function navigate(hash) {
    const target = hash || "#/";
    if (location.hash === target) render();
    else location.hash = target;
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function parseRoute() {
    const hash = location.hash || "#/";
    if (hash === "#/seguimiento") return { name: "tracking" };
    if (hash.startsWith("#/familia/")) return { name: "family", familyId: hash.slice("#/familia/".length) };
    if (hash.startsWith("#/tramite/")) return { name: "process", serviceId: hash.slice("#/tramite/".length) };
    return { name: "home" };
  }

  function renderHomeTile({ action, id, image, label, featured = false, available = true }) {
    const dataAttribute = action === "select-family"
      ? `data-family-id="${escapeHTML(id)}"`
      : `data-service-id="${escapeHTML(id)}"`;
    return `
      <button class="home-tile${featured ? " home-tile-featured" : ""}${available ? "" : " is-unavailable"}" type="button"
        ${available ? `data-action="${action}" ${dataAttribute}` : `${dataAttribute} disabled aria-disabled="true"`}
        aria-label="${escapeHTML(label)}${available ? "" : ", próximamente"}">
        ${featured
          ? `<span class="home-tile-media home-primary-logo" aria-hidden="true"></span>`
          : `<span class="home-tile-media"><img src="${escapeHTML(image)}" alt="" /></span>`}
        <span class="sr-only">${escapeHTML(label)}</span>
      </button>
    `;
  }

  function renderHome() {
    const directs = (window.TRAMI_DIRECTS || []).map((item) => renderHomeTile({
      action: "select-service",
      id: item.serviceId,
      image: item.image,
      label: item.name,
      available: Boolean(getService(item.serviceId)?.active)
    })).join("");

    const families = (window.TRAMI_FAMILIES || []).map((family) => renderHomeTile({
      action: "select-family",
      id: family.id,
      image: family.image,
      label: family.name
    })).join("");

    app.innerHTML = `
      <section class="home-hero home-hero-clean">
        <div class="container home-hero-inner">
          <div class="home-hero-copy"><h1>¿Qué trámite necesitás?</h1></div>
        </div>
      </section>

      <section class="home-catalog" aria-label="Trámites y categorías">
        <div class="container">
          <h2 class="home-section-title">Trámites directos</h2>
          <div class="home-direct-row">${directs}</div>
          <h2 class="home-section-title">Familias de trámites</h2>
          <div class="home-family-row">${families}</div>
        </div>
      </section>
    `;
  }

  function renderPriceOptions(service) {
    if (!service.priceOptions?.length) {
      return `<div class="service-summary-row"><span>Precio y plazo</span><strong>A confirmar</strong></div>`;
    }
    return service.priceOptions.map((option) => `
      <div class="service-summary-option">
        <div>
          <strong>${escapeHTML(option.label)}</strong>
          <small>${escapeHTML(option.duration || "Plazo a confirmar")}</small>
        </div>
        <strong>${formatARS(option.amount)}</strong>
      </div>
    `).join("");
  }

  function renderServiceSummary(service) {
    return `
      <div class="service-summary">
        ${(service.components || []).length ? `
          <div class="service-summary-block">
            <h3>Incluye</h3>
            <ul class="requirements">${service.components.map((item) => `<li>${escapeHTML(item)}</li>`).join("")}</ul>
          </div>
        ` : ""}
        <div class="service-summary-block">
          <h3>Requisitos</h3>
          <ul class="requirements">${(service.requirements || []).map((item) => `<li>${escapeHTML(item)}</li>`).join("")}</ul>
        </div>
        <div class="service-summary-block">
          <h3>Precio y plazo</h3>
          ${renderPriceOptions(service)}
          ${service.officialFee !== null && service.officialFee !== undefined
            ? `<div class="service-summary-row"><span>Costo oficial</span><strong>${formatARS(service.officialFee)}</strong></div>`
            : ""}
        </div>
      </div>
    `;
  }

  function renderFamily() {
    const family = getFamily(state.familyId);
    if (!family) return navigate("#/");

    const services = family.serviceIds.map(getService).filter(Boolean);
    app.innerHTML = `
      <section class="family-page">
        <div class="container family-shell">
          <button class="button button-secondary family-back" type="button" data-action="back-home">Volver</button>
          <div class="family-heading">
            <img src="${escapeHTML(family.image)}" alt="" />
            <div>
              <p class="eyebrow">Categoría</p>
              <h1>${escapeHTML(family.name)}</h1>
              <p>${escapeHTML(family.description)}</p>
            </div>
          </div>
          <div class="family-service-grid">${services.map(renderFamilyService).join("")}</div>
        </div>
      </section>
    `;
  }

  function renderFamilyService(service) {
    return `
      <article class="family-service-card">
        <div>
          <span class="service-tag">${service.active ? "Disponible" : "Próximamente"}</span>
          <h2>${escapeHTML(service.name)}</h2>
          <p>${escapeHTML(service.shortDescription)}</p>
          <div class="service-card-mini">${renderPriceOptions(service)}</div>
        </div>
        ${service.active
          ? `<button class="button button-primary" type="button" data-action="select-service" data-service-id="${escapeHTML(service.id)}">Elegir trámite</button>`
          : `<span class="family-unavailable">Servicio en preparación</span>`}
      </article>
    `;
  }

  function renderStepper(service) {
    if (["correction", "ineligible"].includes(state.step)) return "";
    const steps = [["data", "Datos"], ["payment", "Pago"], ["confirmation", "Finalización"]];
    const visibleStep = state.step === "eligibility" ? "data" : state.step;
    const currentIndex = steps.findIndex(([id]) => id === visibleStep);
    if (currentIndex < 0) return "";

    return `
      <div class="stepper" style="grid-template-columns:repeat(3,1fr)" aria-label="Progreso del trámite">
        ${steps.map(([id, label], index) => `
          <div class="step ${index === currentIndex ? "current" : ""} ${index < currentIndex ? "done" : ""}">
            <span class="step-number">${index < currentIndex ? "✓" : index + 1}</span>
            <span>${label}</span>
          </div>
        `).join("")}
      </div>
    `;
  }

  function renderProcess() {
    const service = getService(state.serviceId);
    if (!service || !service.active) return navigate("#/");

    app.innerHTML = `
      <section class="process-shell">
        <div class="container process-container">
          <div class="process-top">
            <div class="process-title">
              <p class="eyebrow">${state.step === "correction" ? "Corrección solicitada" : "Trámite"}</p>
              <h1>${escapeHTML(service.name)}</h1>
              <p>${escapeHTML(service.description)}</p>
            </div>
          </div>
          ${renderStepper(service)}
          <div class="process-content">${renderStage(service)}</div>
        </div>
      </section>
    `;
  }

  function renderStage(service) {
    if (state.step === "eligibility") return renderEligibilityStage(service);
    if (state.step === "ineligible") return renderIneligibleStage(service);
    if (state.step === "correction") return renderCorrectionStage(service);
    if (state.step === "payment") return renderPaymentStage(service);
    if (state.step === "confirmation") return renderConfirmationStage(service);
    state.step = "data";
    return renderDataStage(service);
  }

  function renderEligibilityStage(service) {
    const questions = service.eligibility?.questions || [];
    return `
      <div class="panel">
        <div class="panel-header">
          <h2>Confirmá los requisitos</h2>
          <p>Para continuar, ambas respuestas deben ser “Sí”.</p>
        </div>
        <form id="eligibility-form" novalidate>
          <div class="eligibility-list">
            ${questions.map((question) => `
              <fieldset class="eligibility-question">
                <legend>${escapeHTML(question.label)}</legend>
                <div class="eligibility-options">
                  <label class="choice-option compact-choice">
                    <input type="radio" name="${escapeHTML(question.id)}" value="yes" required />
                    <span><strong>Sí</strong></span>
                  </label>
                  <label class="choice-option compact-choice">
                    <input type="radio" name="${escapeHTML(question.id)}" value="no" required />
                    <span><strong>No</strong></span>
                  </label>
                </div>
              </fieldset>
            `).join("")}
          </div>
          <div class="form-error" role="alert"></div>
          ${renderActionBar("Atrás", "Continuar")}
        </form>
      </div>
    `;
  }

  function renderIneligibleStage(service) {
    return `
      <div class="panel ineligible-panel" role="alert">
        <div class="ineligible-icon" aria-hidden="true">⛔</div>
        <h2>Trámite no disponible</h2>
        <p>${escapeHTML(service.eligibility?.failureMessage || "No se cumplen los requisitos obligatorios para realizar este trámite.")}</p>
        <div class="hero-actions">
          <button class="button button-secondary" type="button" data-action="retry-eligibility">Revisar requisitos</button>
          <button class="button button-primary" type="button" data-action="back-home">Volver al inicio</button>
        </div>
      </div>
    `;
  }

  function renderActionBar(backLabel, submitLabel) {
    return `
      <div class="step-actions">
        <button class="button button-secondary" type="button" data-action="back-step">${backLabel}</button>
        <div class="step-actions-right">
          <button class="button button-primary" type="submit">${submitLabel}</button>
        </div>
      </div>
    `;
  }

  function renderDataStage(service) {
    return `
      <div class="panel">
        <div class="panel-header"><h2>Completá tus datos</h2></div>
        <div class="service-quick-summary">
          <strong>${escapeHTML(service.shortDescription || service.name)}</strong>
          <span>Completá los campos y tocá Siguiente.</span>
        </div>
        <form id="data-form" novalidate>
          <div class="form-grid">${(service.fields || []).map((field) => renderField(field, service)).join("")}</div>
          <div class="form-error" role="alert"></div>
          ${renderActionBar("Atrás", "Siguiente")}
        </form>
      </div>
    `;
  }

  function renderCorrectionStage(service) {
    const request = getRequest(state.requestId);
    if (!request) return "";

    const requested = request.requestedFields?.length
      ? request.requestedFields
      : (service.fields || []).map((field) => field.id);
    const fields = (service.fields || []).filter((field) => requested.includes(field.id));
    const lastNote = request.observations?.[0]?.text || "Necesitamos que revises la información indicada.";

    return `
      <div class="panel">
        <div class="panel-header"><h2>Corregí la información solicitada</h2><p>${escapeHTML(lastNote)}</p></div>
        <div class="notice correction-notice"><strong>Solo completá los datos que necesitan revisión.</strong></div>
        <form id="correction-form" novalidate>
          <div class="form-grid">${fields.map((field) => renderField(field, service, request.answers || {})).join("")}</div>
          <div class="form-error" role="alert"></div>
          <div class="step-actions">
            <button class="button button-secondary" type="button" data-action="back-tracking">Cancelar</button>
            <div class="step-actions-right"><button class="button button-primary" type="submit">Enviar corrección</button></div>
          </div>
        </form>
      </div>
    `;
  }

  function renderField(field, service, sourceValues = state.draft) {
    const value = sourceValues?.[field.id];
    const full = ["checkbox", "textarea", "file", "choice"].includes(field.type) ? "field-full" : "";
    const required = field.required ? "required" : "";
    const requiredMark = field.required && field.type !== "checkbox" ? " *" : "";

    if (field.type === "checkbox") {
      return `
        <div class="field ${full}">
          <label class="form-check">
            <input type="checkbox" name="${escapeHTML(field.id)}" ${value ? "checked" : ""} ${required} />
            <span class="form-check-label">${escapeHTML(field.label)}</span>
          </label>
          ${field.id === "authorization"
            ? `<small class="privacy-help"><a href="politica-privacidad.html" target="_blank" rel="noopener">Política de Privacidad</a> · <a href="terminos-condiciones.html" target="_blank" rel="noopener">Términos y Condiciones</a></small>`
            : ""}
        </div>
      `;
    }

    if (field.type === "choice") {
      return `
        <fieldset class="field field-full choice-field">
          <legend>${escapeHTML(field.label)}${requiredMark}</legend>
          <div class="choice-grid">
            ${(field.options || []).map((option, index) => `
              <label class="choice-option compact-choice">
                <input type="radio" name="${escapeHTML(field.id)}" value="${escapeHTML(option.value)}"
                  ${(value === option.value || (!value && index === 0)) ? "checked" : ""} ${required} />
                <span><strong>${escapeHTML(option.label)}</strong></span>
              </label>
            `).join("")}
          </div>
        </fieldset>
      `;
    }

    if (field.type === "select") {
      if (service.priceField === field.id && (service.priceOptions || []).length > 1) {
        return `
          <fieldset class="field field-full choice-field">
            <legend>${escapeHTML(field.label)}${requiredMark}</legend>
            <div class="choice-grid">
              ${service.priceOptions.map((option, index) => `
                <label class="choice-option">
                  <input type="radio" name="${escapeHTML(field.id)}" value="${escapeHTML(option.value)}"
                    ${(value === option.value || (!value && index === 0)) ? "checked" : ""} ${required} />
                  <span>
                    <strong>${escapeHTML(option.label)}</strong>
                    <small>${escapeHTML(option.duration || "Plazo a confirmar")} · ${formatARS(option.amount)}</small>
                  </span>
                </label>
              `).join("")}
            </div>
          </fieldset>
        `;
      }

      return `
        <div class="field ${full}">
          <label for="${escapeHTML(field.id)}">${escapeHTML(field.label)}${requiredMark}</label>
          <select class="form-select form-control" id="${escapeHTML(field.id)}" name="${escapeHTML(field.id)}" ${required}>
            <option value="">Seleccioná una opción</option>
            ${(field.options || []).map((option) => `
              <option value="${escapeHTML(option.value)}" ${value === option.value ? "selected" : ""}>${escapeHTML(option.label)}</option>
            `).join("")}
          </select>
        </div>
      `;
    }

    if (field.type === "textarea") {
      return `
        <div class="field ${full}">
          <label for="${escapeHTML(field.id)}">${escapeHTML(field.label)}${requiredMark}</label>
          <textarea class="form-control" id="${escapeHTML(field.id)}" name="${escapeHTML(field.id)}"
            placeholder="${escapeHTML(field.placeholder || "")}" ${required}>${escapeHTML(value || "")}</textarea>
        </div>
      `;
    }

    if (field.type === "file") {
      const existing = value?.name
        ? `<small class="existing-file">Archivo actual: ${escapeHTML(value.name)}. Si no elegís otro, se conserva.</small>`
        : "";
      return `
        <div class="field ${full}">
          <label for="${escapeHTML(field.id)}">${escapeHTML(field.label)}${requiredMark}</label>
          <input class="form-control" type="file" id="${escapeHTML(field.id)}" name="${escapeHTML(field.id)}"
            accept="${escapeHTML(field.accept || "")}" ${field.required && !value?.name ? "required" : ""} />
          ${existing}<small>Archivo máximo: ${Math.round(MAX_LOCAL_FILE_BYTES / 100000) / 10} MB.</small>
        </div>
      `;
    }

    const numericPattern = field.inputmode === "numeric"
      ? `pattern="[0-9\\s-]*" title="Usá solamente números, espacios o guiones."`
      : "";

    return `
      <div class="field ${full}">
        <label for="${escapeHTML(field.id)}">${escapeHTML(field.label)}${requiredMark}</label>
        <input class="form-control" type="${escapeHTML(field.type)}" id="${escapeHTML(field.id)}" name="${escapeHTML(field.id)}"
          value="${escapeHTML(value || "")}" placeholder="${escapeHTML(field.placeholder || "")}"
          ${field.inputmode ? `inputmode="${escapeHTML(field.inputmode)}"` : ""}
          ${field.autocomplete ? `autocomplete="${escapeHTML(field.autocomplete)}"` : ""}
          ${numericPattern} ${required} />
      </div>
    `;
  }

  function renderPaymentStage(service) {
    const request = getRequest(state.requestId);
    if (!request) {
      state.step = service.eligibility?.required ? "eligibility" : "data";
      return renderStage(service);
    }
    const pricing = request.pricing;
    const demoMode = Boolean(window.TRAMI_CONFIG?.demoMode);
    const demoWarning = demoMode
      ? `<div class="notice notice-danger"><strong>MODO PRUEBA:</strong> no realices una transferencia real desde esta versión.</div>`
      : "";

    return `
      <div class="panel">
        <div class="panel-header"><h2>Pago</h2><p>Tu solicitud ya existe. Guardá el código para consultar el estado.</p></div>
        <div class="summary-grid">
          <div class="summary-item"><small>Código</small><strong>${escapeHTML(request.code)}</strong></div>
          <div class="summary-item"><small>Servicio</small><strong>${escapeHTML(service.name)}</strong></div>
          <div class="summary-item"><small>Total</small><strong>${formatARS(pricing.total)}</strong></div>
        </div>
        ${demoWarning}
        ${demoMode ? "" : `<div class="notice"><strong>Datos de pago:</strong> alias ${escapeHTML(window.TRAMI_CONFIG.alias)} · titular ${escapeHTML(window.TRAMI_CONFIG.paymentHolder)}.</div>`}
        <form id="payment-form">
          ${demoMode ? `<input type="hidden" name="demoPayment" value="true" />` : `
            <div class="field field-full payment-file">
              <label for="receipt">Comprobante de pago *</label>
              <input class="form-control" type="file" id="receipt" name="receipt" accept="image/*,.pdf" required />
              <small>Archivo máximo: ${Math.round(MAX_LOCAL_FILE_BYTES / 100000) / 10} MB.</small>
            </div>`}
          <div class="form-error" role="alert"></div>
          ${renderActionBar("Revisar datos", demoMode ? "Simular pago" : "Informar pago")}
        </form>
      </div>
    `;
  }

  function renderConfirmationStage(service) {
    const request = getRequest(state.requestId);
    if (!request) return "";
    return `
      <div class="panel confirmation">
        <div class="confirmation-icon" aria-hidden="true">✓</div>
        <h2>Solicitud recibida</h2>
        <p>Guardá este código para consultar las actualizaciones.</p>
        <div class="request-code">${escapeHTML(request.code)}</div>
        <p><strong>${escapeHTML(service.name)}</strong><br />${escapeHTML(statusLabel(request.status))}</p>
        <div class="hero-actions confirmation-actions">
          <button class="button button-primary" type="button" data-action="track-request">Ver estado</button>
          <button class="button button-secondary" type="button" data-action="copy-code">Copiar código</button>
        </div>
      </div>
    `;
  }

  function progressIndex(status) {
    const normalized = status === "needs_info" ? "in_progress" : status;
    return PROGRESS_STATUSES.indexOf(normalized);
  }

  function renderTracking() {
    app.innerHTML = `
      <section class="tracking-page">
        <div class="container">
          <div class="section-heading">
            <div><h1>Seguimiento de trámite</h1></div>
            <p>Ingresá el código de tu solicitud.</p>
          </div>
          <div class="tracking-layout">
            <div class="panel">
              <form id="tracking-form">
                <div class="field">
                  <label for="tracking-code">Código de solicitud</label>
                  <input class="form-control tracking-code" id="tracking-code" name="trackingCode"
                    value="${escapeHTML(state.trackingCode)}" placeholder="AP-00125-X" autocomplete="off" required />
                </div>
                <div class="form-error ${state.trackingError ? "visible" : ""}" role="alert">${escapeHTML(state.trackingError)}</div>
                <button class="button button-primary" type="submit">Consultar</button>
              </form>
            </div>
            <div class="panel tracking-result" aria-live="polite">
              ${state.trackingResult
                ? renderTrackingResult(state.trackingResult)
                : `<div class="empty-state"><h2>Estado de la solicitud</h2><p>El resultado aparecerá acá.</p></div>`}
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderTrackingResult(request) {
    const currentIndex = progressIndex(request.status);
    const timeline = PROGRESS_STATUSES.map((status, index) => `
      <div class="timeline-item ${index < currentIndex ? "done" : ""} ${index === currentIndex ? "current" : ""}">
        <span class="timeline-dot" aria-hidden="true"></span>
        <div>
          <strong>${escapeHTML(statusLabel(status))}</strong>
          ${index === currentIndex ? `<small>Actualizado: ${escapeHTML(formatDate(request.updatedAt))}</small>` : ""}
        </div>
      </div>
    `).join("");

    const statusNotice = request.status === "needs_info"
      ? `<div class="needs-info-box"><strong>Falta información.</strong><p>Revisá la observación y corregí únicamente los datos solicitados.</p><button class="button button-primary" type="button" data-action="correct-request" data-request-id="${escapeHTML(request.id)}">Corregir información</button></div>`
      : request.status === "cancelled"
        ? `<div class="notice notice-danger"><strong>Solicitud cancelada.</strong> Revisá las observaciones para conocer el motivo.</div>`
        : request.status === "payment_pending"
          ? `<div class="needs-info-box"><strong>Pago pendiente.</strong><p>La solicitud ya fue creada. Podés continuar con el mismo código.</p><button class="button button-primary" type="button" data-action="resume-payment" data-request-id="${escapeHTML(request.id)}">Continuar con el pago</button></div>`
          : "";

    const observations = (request.observations || []).length
      ? `<div class="tracking-section"><h3>Observaciones</h3><ul class="requirements">${request.observations.map((item) => `<li>${escapeHTML(item.text || item)}</li>`).join("")}</ul></div>`
      : "";

    const resultText = request.result
      ? `<div class="notice"><strong>Resultado:</strong> ${escapeHTML(request.result)}</div>`
      : "";
    const resultFile = request.resultFile?.dataUrl
      ? `<a class="button button-primary file-download" href="${escapeHTML(request.resultFile.dataUrl)}" download="${escapeHTML(request.resultFile.name || "resultado")}">Descargar resultado</a>`
      : "";
    const result = resultText || resultFile
      ? `<div class="tracking-section"><h3>Resultado disponible</h3>${resultText}${resultFile}</div>`
      : "";

    return `
      <div class="status-header">
        <div><p class="eyebrow">${escapeHTML(request.code)}</p><h2>${escapeHTML(request.serviceName)}</h2></div>
        <span class="status-badge">${escapeHTML(statusLabel(request.status))}</span>
      </div>
      <p class="text-small">Creada: ${escapeHTML(formatDate(request.createdAt))}</p>
      ${request.payment?.receiptName ? `<p class="text-small">Comprobante: ${escapeHTML(request.payment.receiptName)}</p>` : ""}
      ${statusNotice}
      ${request.status !== "cancelled" ? `<div class="timeline">${timeline}</div>` : ""}
      ${observations}${result}
    `;
  }

  async function fileToStoredFile(file) {
    if (!file) return null;
    if (file.size > MAX_LOCAL_FILE_BYTES) {
      throw new Error(`El archivo ${file.name} supera el límite permitido.`);
    }
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error(`No se pudo leer ${file.name}.`));
      reader.readAsDataURL(file);
    });
    return { name: file.name, size: file.size, type: file.type, dataUrl };
  }

  async function collectFormData(form, service, existingValues = {}) {
    const values = { ...existingValues };
    for (const field of service.fields || []) {
      const element = form.elements.namedItem(field.id);
      if (!element) continue;

      if (field.type === "checkbox") values[field.id] = element.checked;
      else if (field.type === "file") {
        const file = element.files?.[0];
        if (file) values[field.id] = await fileToStoredFile(file);
        else if (!values[field.id]) values[field.id] = null;
      } else {
        values[field.id] = element.value.trim();
      }
    }
    return values;
  }

  function hasValue(value) {
    if (value && typeof value === "object") return Boolean(value.name);
    return value !== undefined && value !== null && String(value).trim() !== "";
  }

  function validateRules(service, values) {
    const anyOf = service.rules?.anyOf;
    if (anyOf && !anyOf.some((fieldId) => hasValue(values[fieldId]))) {
      return service.rules.message || "Completá al menos una de las opciones requeridas.";
    }

    const oneOfGroups = service.rules?.oneOfGroups;
    if (Array.isArray(oneOfGroups) && oneOfGroups.length) {
      const validGroup = oneOfGroups.some((group) =>
        Array.isArray(group) && group.length && group.every((fieldId) => hasValue(values[fieldId]))
      );
      if (!validGroup) {
        return service.rules.message || "Completá una de las alternativas requeridas.";
      }
    }
    return "";
  }

  function setFormError(form, message) {
    const error = form.querySelector(".form-error");
    if (!error) return;
    error.textContent = message;
    error.classList.toggle("visible", Boolean(message));
  }

  function startService(serviceId) {
    const service = getService(serviceId);
    if (!service?.active) return;

    state.returnHash = state.route === "family" && state.familyId ? `#/familia/${state.familyId}` : "#/";
    state.serviceId = serviceId;
    state.draft = {};

    const pending = activePendingRequest(serviceId);
    if (pending) {
      state.requestId = pending.id;
      state.draft = { ...(pending.answers || {}) };
      state.step = "payment";
    } else {
      state.requestId = null;
      state.step = service.eligibility?.required ? "eligibility" : "data";
    }

    navigate(`#/tramite/${serviceId}`);
  }

  function restoreProcessState(serviceId) {
    const service = getService(serviceId);
    if (!service) return;
    const pending = activePendingRequest(serviceId);
    if (pending) {
      state.requestId = pending.id;
      state.draft = { ...(pending.answers || {}) };
      state.step = "payment";
      return;
    }
    state.requestId = null;
    state.draft = {};
    state.step = service.eligibility?.required ? "eligibility" : "data";
  }

  function openWhatsApp() {
    const number = String(window.TRAMI_CONFIG?.whatsappNumber || "").replace(/\D/g, "");
    if (!number) return window.alert("Falta configurar el número de WhatsApp.");

    const request = state.requestId ? getRequest(state.requestId) : state.trackingResult;
    const message = request?.code
      ? `Necesito ayuda con mi trámite. Código: ${request.code}`
      : "Necesito ayuda para realizar un trámite.";
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
  }

  function render() {
    const route = parseRoute();
    const previousRoute = state.route;
    const previousService = state.serviceId;
    state.route = route.name;

    if (route.name === "process") {
      state.serviceId = route.serviceId;
      if (state.step !== "correction" && (!state.step || previousRoute !== "process" || previousService !== route.serviceId)) {
        restoreProcessState(route.serviceId);
      }
      return renderProcess();
    }

    if (route.name === "family") {
      state.familyId = route.familyId;
      return renderFamily();
    }

    if (route.name === "tracking") {
      if (state.trackingCode) {
        state.trackingResult = getRequests().find((item) => item.code.toUpperCase() === state.trackingCode.toUpperCase()) || state.trackingResult;
      }
      return renderTracking();
    }

    renderHome();
  }

  document.addEventListener("click", (event) => {
    const internal = event.target.closest('a[href^="#/"]');
    if (internal) {
      event.preventDefault();
      navigate(internal.getAttribute("href"));
      return;
    }

    const whatsapp = event.target.closest('[data-action="whatsapp"]');
    if (whatsapp) {
      event.preventDefault();
      openWhatsApp();
    }
  });

  app.addEventListener("click", async (event) => {
    const trigger = event.target.closest("[data-action]");
    if (!trigger) return;
    const action = trigger.dataset.action;
    if (action === "whatsapp") return;

    if (action === "select-family") {
      state.familyId = trigger.dataset.familyId;
      return navigate(`#/familia/${state.familyId}`);
    }

    if (action === "select-service") return startService(trigger.dataset.serviceId);
    if (action === "back-home") return navigate("#/");
    if (action === "back-tracking") return navigate("#/seguimiento");

    if (action === "retry-eligibility") {
      state.step = "eligibility";
      return render();
    }

    if (action === "back-step") {
      const service = getService(state.serviceId);
      if (state.step === "eligibility") return navigate(state.returnHash || "#/");
      if (state.step === "data") {
        if (service?.eligibility?.required) {
          state.step = "eligibility";
          return render();
        }
        return navigate(state.returnHash || "#/");
      }
      if (state.step === "payment") {
        state.step = "data";
        const request = getRequest(state.requestId);
        if (request) state.draft = { ...(request.answers || {}) };
        return render();
      }
      return navigate("#/");
    }

    if (action === "track-request") {
      const request = getRequest(state.requestId);
      if (request) {
        state.trackingCode = request.code;
        state.trackingResult = request;
      }
      return navigate("#/seguimiento");
    }

    if (action === "copy-code") {
      const request = getRequest(state.requestId);
      if (!request) return;
      try {
        await navigator.clipboard.writeText(request.code);
        window.alert("Código copiado.");
      } catch (_) {
        window.alert(`Tu código es: ${request.code}`);
      }
      return;
    }

    if (action === "correct-request") {
      const request = getRequest(trigger.dataset.requestId);
      if (!request) return;
      state.requestId = request.id;
      state.serviceId = request.serviceId;
      state.draft = { ...(request.answers || {}) };
      state.step = "correction";
      return navigate(`#/tramite/${request.serviceId}`);
    }

    if (action === "resume-payment") {
      const request = getRequest(trigger.dataset.requestId);
      if (!request || request.status !== "payment_pending") return;
      state.requestId = request.id;
      state.serviceId = request.serviceId;
      state.draft = { ...(request.answers || {}) };
      state.step = "payment";
      rememberActiveRequest(request);
      return navigate(`#/tramite/${request.serviceId}`);
    }
  });

  app.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.target;

    if (form.id === "eligibility-form") {
      if (!form.checkValidity()) {
        setFormError(form, "Respondé las dos preguntas antes de continuar.");
        form.reportValidity();
        return;
      }

      const service = getService(state.serviceId);
      const allMet = (service.eligibility?.questions || []).every((question) =>
        form.elements.namedItem(question.id)?.value === "yes"
      );
      state.step = allMet ? "data" : "ineligible";
      render();
      window.scrollTo(0, 0);
      return;
    }

    if (form.id === "data-form") {
      const service = getService(state.serviceId);
      if (!service) return;

      if (!form.checkValidity()) {
        setFormError(form, "Revisá los campos obligatorios marcados.");
        form.reportValidity();
        return;
      }

      try {
        const values = await collectFormData(form, service, state.draft);
        const validationError = validateRules(service, values);
        if (validationError) return setFormError(form, validationError);

        state.draft = values;
        const existing = state.requestId ? getRequest(state.requestId) : null;
        const request = existing?.status === "payment_pending"
          ? updateRequest(existing.id, {
              answers: values,
              clientName: values.fullName || existing.clientName || "",
              pricing: getPricing(service, values)
            })
          : createRequest(service, values);

        state.requestId = request.id;
        rememberActiveRequest(request);
        state.step = "payment";
        render();
        window.scrollTo(0, 0);
      } catch (error) {
        setFormError(form, error.message || "No se pudo guardar la solicitud.");
      }
      return;
    }

    if (form.id === "correction-form") {
      const request = getRequest(state.requestId);
      const service = getService(state.serviceId);
      if (!request || !service) return;

      if (!form.checkValidity()) {
        setFormError(form, "Completá los datos solicitados.");
        form.reportValidity();
        return;
      }

      try {
        const values = await collectFormData(form, service, request.answers || {});
        const validationError = validateRules(service, values);
        if (validationError) return setFormError(form, validationError);

        const updated = updateRequest(request.id, {
          answers: values,
          clientName: values.fullName || request.clientName || "",
          status: "in_progress",
          requestedFields: [],
          observations: [
            { text: "El cliente envió la información corregida.", createdAt: new Date().toISOString() },
            ...(request.observations || [])
          ]
        });

        state.trackingCode = updated.code;
        state.trackingResult = updated;
        state.step = null;
        navigate("#/seguimiento");
      } catch (error) {
        setFormError(form, error.message || "No se pudo enviar la corrección.");
      }
      return;
    }

    if (form.id === "payment-form") {
      const demoMode = Boolean(window.TRAMI_CONFIG?.demoMode);
      if (!form.checkValidity()) {
        setFormError(form, demoMode ? "No se pudo completar la simulación." : "Cargá el comprobante para continuar.");
        form.reportValidity();
        return;
      }

      try {
        const input = form.elements.namedItem("receipt");
        const stored = demoMode ? null : await fileToStoredFile(input?.files?.[0]);
        const updated = updateRequest(state.requestId, {
          status: "payment_review",
          payment: demoMode ? {
            receiptName: "Simulación de pago",
            size: 0,
            type: "demo",
            dataUrl: null
          } : (stored ? {
            receiptName: stored.name,
            size: stored.size,
            type: stored.type,
            dataUrl: stored.dataUrl
          } : null)
        });
        clearActiveRequest();
        state.trackingResult = updated;
        state.step = "confirmation";
        render();
        window.scrollTo(0, 0);
      } catch (error) {
        setFormError(form, error.message || (demoMode ? "No se pudo completar la simulación." : "No se pudo cargar el comprobante."));
      }
      return;
    }

    if (form.id === "tracking-form") {
      const code = form.elements.namedItem("trackingCode").value.trim().toUpperCase();
      const request = getRequests().find((item) => item.code.toUpperCase() === code) || null;
      state.trackingCode = code;
      state.trackingResult = request;
      state.trackingError = request ? "" : "No encontramos una solicitud con ese código.";
      render();
    }
  });

  window.addEventListener("hashchange", render);
  render();
})();
