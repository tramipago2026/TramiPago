"use strict";

(() => {
  const API = "";
  const qs = (s, root = document) => root.querySelector(s);
  const qsa = (s, root = document) => [...root.querySelectorAll(s)];
  const normalize = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const randomKey = (prefix) => prefix + "-" + (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + "-" + Math.random().toString(16).slice(2));

  async function api(path, options = {}) {
    const response = await fetch(API + path, {
      credentials: "same-origin",
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...(options.headers || {}),
      },
    });
    const raw = await response.text();
    let data = null;
    if (raw) {
      try { data = JSON.parse(raw); } catch { data = { error: "invalid_response" }; }
    }
    if (!response.ok) {
      const error = new Error(data?.message || data?.error || "request_failed");
      error.status = response.status;
      error.code = data?.code || data?.error;
      throw error;
    }
    return data;
  }

  function setMessage(node, text, kind = "info") {
    if (!node) return;
    node.textContent = text;
    node.dataset.kind = kind;
    node.hidden = false;
  }

  function statusLabel(status) {
    return ({
      draft: "Borrador",
      awaiting_payment: "Pago pendiente",
      payment_review: "Pago en revisión",
      payment_confirmed: "Pago confirmado",
      in_progress: "En proceso",
      needs_info: "Falta información",
      finalized: "Finalizado",
      cancelled: "Cancelado",
    })[status] || status || "Sin estado";
  }

  async function initSearch() {
    const results = qs("#v2-search-results");
    if (!results) return;
    const q = (new URLSearchParams(location.search).get("q") || "").trim();
    const term = qs("#search-term");
    if (term) term.textContent = q ? "Búsqueda: " + q : "Ingresá un trámite para buscar";

    let services = [];
    try {
      const manifest = await fetch("/v2/rutas-v2.json", { cache: "no-store" }).then((r) => r.json());
      services = manifest.services || [];
    } catch {
      setMessage(results, "No se pudo cargar el catálogo de prueba.", "error");
      return;
    }

    const aliases = {
      "antecedentes-penales": "penales certificado antecedentes",
      "constancias-anses": "anses constancia",
      "informe-vehicular": "vehiculo automotor auto dominio informe",
      "arba-inmobiliario": "arba inmobiliario provincia buenos aires",
      "partidas": "partida nacimiento matrimonio defuncion pba",
      "partidas-caba": "partida nacimiento matrimonio defuncion caba",
      "certificacion-estado-civil": "estado civil certificado",
      "certificado-domicilio-pba": "domicilio declaracion jurada pba",
      "asistencia-digital": "ayuda digital online",
      "arca-constancia": "arca afip constancia",
      "arca-vep": "arca afip vep pago",
      "arca-ccma": "arca afip deuda saldo ccma",
      "arca-reimputacion": "arca afip reimputacion pagos",
      "arca-informe-reimputacion": "arca afip deuda reimputacion",
      "arca-alta-monotributo": "arca afip monotributo alta",
      "arca-baja-monotributo": "arca afip monotributo baja",
      "arca-recategorizacion": "arca afip monotributo recategorizacion",
      "arca-dfe": "arca afip domicilio fiscal electronico",
      "arca-actualizacion": "arca afip datos actualizacion",
      "apostilla-tad": "apostilla apostillado tad",
      "legalizaciones": "legalizacion documentos",
      "abogado-art": "art accidente laboral abogado",
      "abogado-accidentes": "accidente abogado",
      "abogado-sucesiones": "sucesion herencia abogado",
      "abogado-laboral": "laboral trabajo abogado",
    };

    const nq = normalize(q);
    const matches = nq
      ? services.filter((item) => normalize([item.name, item.family || "", aliases[item.id] || ""].join(" ")).includes(nq))
      : [];

    results.replaceChildren();
    for (const item of matches) {
      const a = document.createElement("a");
      a.className = "text-card";
      a.href = item.href;
      const strong = document.createElement("strong");
      strong.textContent = item.name;
      a.append(strong);
      results.append(a);
    }
    if (!matches.length) {
      const p = document.createElement("p");
      p.textContent = q ? "No se encontraron coincidencias en el catálogo V2." : "Usá el buscador para encontrar un trámite.";
      results.append(p);
    }
  }

  async function initStartForm() {
    const form = qs("[data-v2-request-form]");
    if (!form) return;

    const serviceId = form.dataset.serviceId || "";
    const serviceName = form.dataset.serviceName || serviceId;
    const output = qs("[data-v2-form-message]", form.closest(".content") || document);
    const result = qs("[data-v2-created]", form.closest(".content") || document);
    const submit = qs('button[type="submit"]', form);

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      submit.disabled = true;
      setMessage(output, "Creando solicitud de prueba…");

      const data = new FormData(form);
      const body = {
        serviceId,
        contact: {
          name: String(data.get("name") || "").trim(),
          whatsapp: String(data.get("whatsapp") || "").trim(),
          email: String(data.get("email") || "").trim() || undefined,
        },
        consent: data.get("consent") === "on",
      };

      try {
        const created = await api("/v2/requests/drafts", {
          method: "POST",
          headers: { "Idempotency-Key": randomKey("create-" + serviceId) },
          body: JSON.stringify(body),
        });

        sessionStorage.setItem("tramipago-v2-current", JSON.stringify({
          requestId: created.id,
          capability: created.capability,
          trackingCode: created.trackingCode,
          serviceId,
          serviceName,
        }));

        setMessage(output, "Solicitud de prueba creada correctamente.", "success");
        if (result) {
          result.hidden = false;
          const code = qs("[data-v2-tracking-code]", result);
          if (code) code.textContent = created.trackingCode;
          const link = qs("[data-v2-track-link]", result);
          if (link) link.href = "/v2/seguimiento/?codigo=" + encodeURIComponent(created.trackingCode);
        }
        form.reset();
      } catch (error) {
        setMessage(output, error.status === 404
          ? "Este trámite todavía no está habilitado en la base V2."
          : "No se pudo crear la solicitud de prueba. Intentá nuevamente.", "error");
      } finally {
        submit.disabled = false;
      }
    });
  }

  function initTracking() {
    const form = qs("[data-v2-tracking-form]");
    if (!form) return;
    const output = qs("[data-v2-tracking-result]");
    const statusNode = qs("[data-v2-status]", output || document);
    const noteNode = qs("[data-v2-status-note]", output || document);
    const missingNode = qs("[data-v2-missing]", output || document);
    const codeInput = qs('[name="trackingCode"]', form);
    const paramCode = new URLSearchParams(location.search).get("codigo");
    if (paramCode && codeInput) codeInput.value = paramCode;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const button = qs('button[type="submit"]', form);
      button.disabled = true;
      if (output) output.hidden = true;

      const data = new FormData(form);
      try {
        const response = await api("/v2/requests/lookup", {
          method: "POST",
          body: JSON.stringify({
            trackingCode: String(data.get("trackingCode") || "").trim(),
            verification: String(data.get("verification") || "").trim(),
          }),
        });
        if (statusNode) statusNode.textContent = statusLabel(response.status);
        if (noteNode) {
          noteNode.textContent = response.statusNote || "";
          noteNode.hidden = !response.statusNote;
        }
        if (missingNode) {
          const missing = Array.isArray(response.missingFields) ? response.missingFields : [];
          missingNode.textContent = missing.length ? "Información pendiente: " + missing.join(", ") : "";
          missingNode.hidden = !missing.length;
        }
        if (output) output.hidden = false;
      } catch (error) {
        if (statusNode) statusNode.textContent = error.status === 429
          ? "Demasiados intentos. Probá más tarde."
          : "No encontramos una solicitud con esos datos.";
        if (noteNode) noteNode.hidden = true;
        if (missingNode) missingNode.hidden = true;
        if (output) output.hidden = false;
      } finally {
        button.disabled = false;
      }
    });
  }

  async function reportClientError(code, message) {
    try {
      await fetch("/v2/telemetry/client-errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: String(code || "FRONTEND_ERROR").slice(0, 100),
          message: String(message || "Error de frontend").slice(0, 500),
          context: { path: location.pathname, build: "v2" },
        }),
        keepalive: true,
      });
    } catch {}
  }

  window.addEventListener("error", (event) => {
    reportClientError("WINDOW_ERROR", event.message || "Error de frontend");
  });
  window.addEventListener("unhandledrejection", () => {
    reportClientError("UNHANDLED_REJECTION", "Promesa rechazada sin manejar");
  });

  initSearch();
  initStartForm();
  initTracking();
})();
