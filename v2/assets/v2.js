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

    const pathMatch = location.pathname.match(/\/v2\/tramites\/([^/]+)\/iniciar\/?$/);
    const serviceId = form.dataset.serviceId || pathMatch?.[1] || "";
    let serviceName = form.dataset.serviceName || serviceId;
    const titleNode = qs("[data-v2-service-title]");
    const backLink = qs("[data-v2-service-back]");
    try {
      const manifest = await fetch("/v2/rutas-v2.json", { cache: "no-store" }).then((r) => r.json());
      const service = (manifest.services || []).find((item) => item.id === serviceId);
      if (service) {
        serviceName = service.name;
        if (titleNode) titleNode.textContent = "Iniciar " + service.name;
        if (backLink) {
          backLink.href = service.href;
          backLink.textContent = "← " + service.name;
        }
      }
    } catch {}
    const output = qs("[data-v2-form-message]", form.closest(".content") || document);
    const result = qs("[data-v2-created]", form.closest(".content") || document);
    const submit = qs('button[type="submit"]', form);

    function currentSession() {
      try {
        const value = JSON.parse(sessionStorage.getItem("tramipago-v2-current") || "null");
        return value && value.serviceId === serviceId ? value : null;
      } catch { return null; }
    }

    function renderCreated(current) {
      if (!result || !current) return;
      result.hidden = false;
      const code = qs("[data-v2-tracking-code]", result);
      if (code) code.textContent = current.trackingCode;
      const link = qs("[data-v2-track-link]", result);
      if (link) link.href = "/v2/seguimiento/?codigo=" + encodeURIComponent(current.trackingCode);
      let draftForm = qs("[data-v2-draft-form]", result);
      if (!draftForm) {
        draftForm = document.createElement("form");
        draftForm.className = "vertical";
        draftForm.dataset.v2DraftForm = "";
        draftForm.innerHTML = '<label>Nota de prueba para el borrador<textarea name="notes" maxlength="1000" rows="3" placeholder="Dato sintético para comprobar guardado"></textarea></label><button class="button" type="submit">Guardar borrador de prueba</button><div class="status-box" data-v2-draft-message hidden aria-live="polite"></div>';
        result.append(draftForm);
        draftForm.addEventListener("submit", async (event) => {
          event.preventDefault();
          const active = currentSession();
          if (!active) return;
          const notes = String(new FormData(draftForm).get("notes") || "").trim();
          const draftMessage = qs("[data-v2-draft-message]", draftForm);
          try {
            const saved = await api("/v2/requests/" + encodeURIComponent(active.requestId) + "/draft", {
              method: "PATCH",
              headers: {
                "Idempotency-Key": randomKey("draft-" + active.requestId),
                "X-Request-Capability": active.capability,
              },
              body: JSON.stringify({ currentStep: "datos", payload: { notes } }),
            });
            setMessage(draftMessage, "Borrador guardado en MySQL. Paso: " + saved.currentStep + ".", "success");
          } catch {
            setMessage(draftMessage, "No se pudo guardar el borrador de prueba.", "error");
          }
        });
      }

      if (!qs("[data-v2-upload-form]", result)) {
        const uploadForm = document.createElement("form");
        uploadForm.className = "vertical";
        uploadForm.dataset.v2UploadForm = "";
        uploadForm.innerHTML = '<h3>Archivos de prueba</h3><p data-v2-storage-state class="muted">Verificando almacenamiento privado…</p><label>Tipo<select name="kind"><option value="supporting_document">Documento de apoyo</option><option value="payment_receipt">Comprobante de pago</option></select></label><label>Archivo PDF/JPEG/PNG<input name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" required></label><button class="button" type="submit">Subir archivo de prueba</button><div class="status-box" data-v2-upload-message hidden aria-live="polite"></div>';
        result.append(uploadForm);
        const state = qs("[data-v2-storage-state]", uploadForm);
        const uploadButton = qs('button[type="submit"]', uploadForm);
        api("/v2/health/dependencies", { method: "GET" })
          .then((health) => {
            const ready = health?.dependencies?.b2 === "configured";
            uploadButton.disabled = !ready;
            state.textContent = ready
              ? "Almacenamiento privado B2 disponible en STAGING."
              : "Carga real pendiente: Backblaze B2 todavía no está configurado. El resto del flujo continúa operativo.";
          })
          .catch(() => {
            uploadButton.disabled = true;
            state.textContent = "No se pudo verificar el almacenamiento; carga deshabilitada de forma segura.";
          });

        uploadForm.addEventListener("submit", async (event) => {
          event.preventDefault();
          const active = currentSession();
          if (!active) return;
          const fd = new FormData(uploadForm);
          const file = fd.get("file");
          const kind = String(fd.get("kind") || "supporting_document");
          const uploadMessage = qs("[data-v2-upload-message]", uploadForm);
          if (!(file instanceof File)) return;
          uploadButton.disabled = true;
          const body = new FormData();
          body.set("file", file);
          body.set("kind", kind);
          try {
            const uploaded = await api("/v2/requests/" + encodeURIComponent(active.requestId) + "/files", {
              method: "POST",
              headers: {
                "Idempotency-Key": randomKey("file-" + active.requestId),
                "X-Request-Capability": active.capability,
              },
              body,
            });
            if (kind === "payment_receipt") {
              const payment = await api("/v2/requests/" + encodeURIComponent(active.requestId) + "/payment-proof", {
                method: "POST",
                headers: {
                  "Idempotency-Key": randomKey("payment-" + active.requestId),
                  "X-Request-Capability": active.capability,
                },
                body: JSON.stringify({ fileId: uploaded.fileId }),
              });
              setMessage(uploadMessage, "Comprobante privado recibido. Estado: " + statusLabel(payment.status) + ".", "success");
            } else {
              setMessage(uploadMessage, "Archivo privado de prueba recibido correctamente.", "success");
            }
            uploadForm.reset();
          } catch (error) {
            setMessage(uploadMessage, error.status === 503
              ? "Almacenamiento privado todavía no disponible en STAGING."
              : "No se pudo subir el archivo de prueba.", "error");
          } finally {
            const health = await api("/v2/health/dependencies", { method: "GET" }).catch(() => null);
            uploadButton.disabled = health?.dependencies?.b2 !== "configured";
          }
        });
      }
    }

    renderCreated(currentSession());

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
        renderCreated({
          requestId: created.id,
          capability: created.capability,
          trackingCode: created.trackingCode,
          serviceId,
          serviceName,
        });
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
        const missing = Array.isArray(response.missingFields) ? response.missingFields : [];
        if (missingNode) {
          missingNode.textContent = missing.length ? "Información pendiente: " + missing.join(", ") : "";
          missingNode.hidden = !missing.length;
        }
        if (output) {
          output.hidden = false;
          const old = qs("[data-v2-correction-form]", output);
          if (old) old.remove();
          let current = null;
          try { current = JSON.parse(sessionStorage.getItem("tramipago-v2-current") || "null"); } catch {}
          const requestedCode = String(data.get("trackingCode") || "").trim().toUpperCase();
          if (response.canCorrect && missing.length && current?.trackingCode?.toUpperCase() === requestedCode && current?.capability) {
            const correction = document.createElement("form");
            correction.className = "vertical";
            correction.dataset.v2CorrectionForm = "";
            for (const field of missing) {
              const label = document.createElement("label");
              label.textContent = "Corregir: " + field;
              const input = document.createElement("input");
              input.name = field; input.required = true; input.maxLength = 1000;
              label.append(input); correction.append(label);
            }
            const save = document.createElement("button");
            save.type = "submit"; save.className = "button"; save.textContent = "Enviar corrección de prueba";
            correction.append(save);
            const msg = document.createElement("div");
            msg.className = "status-box"; msg.hidden = true; msg.setAttribute("aria-live","polite");
            correction.append(msg);
            correction.addEventListener("submit", async (ev) => {
              ev.preventDefault();
              const fd = new FormData(correction);
              const payload = Object.fromEntries(missing.map((field) => [field, String(fd.get(field) || "").trim()]));
              try {
                const updated = await api("/v2/requests/" + encodeURIComponent(current.requestId) + "/corrections", {
                  method: "POST",
                  headers: {
                    "Idempotency-Key": randomKey("correction-" + current.requestId),
                    "X-Request-Capability": current.capability,
                  },
                  body: JSON.stringify({ payload }),
                });
                setMessage(msg, "Corrección recibida. Nuevo estado: " + statusLabel(updated.status) + ".", "success");
                if (statusNode) statusNode.textContent = statusLabel(updated.status);
              } catch {
                setMessage(msg, "No se pudo enviar la corrección.", "error");
              }
            });
            output.append(correction);
          }
        }
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

  function initHelp() {
    const form = qs("[data-v2-help-form]");
    if (!form) return;
    const output = qs("[data-v2-help-message]");
    let current = null;
    try { current = JSON.parse(sessionStorage.getItem("tramipago-v2-current") || "null"); } catch {}
    const button = qs('button[type="submit"]', form);
    if (!current?.requestId || !current?.capability) {
      button.disabled = true;
      setMessage(output, "Primero creá una solicitud de prueba para asociar la consulta.", "info");
      return;
    }
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      button.disabled = true;
      try {
        await api("/v2/requests/" + encodeURIComponent(current.requestId) + "/help", {
          method: "POST",
          headers: {
            "Idempotency-Key": randomKey("help-" + current.requestId),
            "X-Request-Capability": current.capability,
          },
          body: JSON.stringify({
            topic: String(data.get("topic") || "").trim(),
            message: String(data.get("message") || "").trim(),
          }),
        });
        setMessage(output, "Consulta de prueba registrada en el trámite.", "success");
        form.reset();
      } catch {
        setMessage(output, "No se pudo registrar la consulta de prueba.", "error");
      } finally {
        button.disabled = false;
      }
    });
  }

  async function initServicePage() {
    const match = location.pathname.match(/^\/v2\/tramites\/([^/]+)\/?$/);
    if (!match) return;
    const serviceId = match[1];
    const content = qs(".content");
    const notice = qs(".content .notice");
    const start = qsa('.content a.button').find((a) => /\/iniciar\/?$/.test(a.getAttribute("href") || ""));
    if (notice) {
      notice.textContent = "Ficha V2 en construcción. El inicio de solicitud ya está conectado al backend MySQL de STAGING; sólo se muestran datos oficiales que superaron CONTROL 2.";
    }
    if (start) start.textContent = "Iniciar solicitud de prueba →";

    try {
      const dataset = await fetch("/v2/data/official-services-2026-10-12.json", { cache: "no-store" }).then((r) => {
        if (!r.ok) throw new Error("official_data_unavailable");
        return r.json();
      });
      const official = dataset?.services?.[serviceId];
      if (!official || official.control2 !== "confirmed" || !Array.isArray(official.facts)) return;

      const section = document.createElement("section");
      section.className = "verified-facts";
      const title = document.createElement("h2");
      title.textContent = "Información oficial verificada";
      const meta = document.createElement("p");
      meta.className = "muted";
      meta.textContent = "CONTROL 2 · verificación " + official.verifiedAt;
      const list = document.createElement("ul");
      for (const fact of official.facts) {
        const li = document.createElement("li");
        li.textContent = String(fact);
        list.append(li);
      }
      section.append(title, meta, list);
      if (start?.parentElement) start.parentElement.before(section);
      else content?.append(section);
    } catch {
      // La ficha sigue utilizable aun cuando el archivo documental no esté disponible.
    }
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
  initServicePage();
  initStartForm();
  initTracking();
  initHelp();
})();
