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

  function fieldHasValue(form, id) {
    const controls = qsa('[name="' + CSS.escape(id) + '"]', form);
    if (!controls.length) return false;
    return controls.some((control) => {
      if (control.disabled) return false;
      if (control.type === "checkbox" || control.type === "radio") return control.checked;
      if (control.type === "file") return Boolean(control.files?.length);
      return String(control.value || "").trim().length > 0;
    });
  }

  function validateServiceRules(form, schema) {
    if (!schema?.rules) return null;
    const rules = schema.rules;
    if (Array.isArray(rules.anyOf) && !rules.anyOf.some((id) => fieldHasValue(form, id))) {
      return rules.message || "Completá al menos una de las opciones requeridas.";
    }
    if (Array.isArray(rules.oneOfGroups)) {
      const ok = rules.oneOfGroups.some((group) =>
        Array.isArray(group) && group.every((id) => fieldHasValue(form, id))
      );
      if (!ok) return rules.message || "Completá una de las alternativas requeridas.";
    }
    return null;
  }

  function makeSchemaField(field, b2Ready) {
    if (!field?.id || !field?.label || !field?.type) return null;

    if (field.type === "choice") {
      const fieldset = document.createElement("fieldset");
      fieldset.className = "wide choice-field";
      const legend = document.createElement("legend");
      legend.textContent = field.label;
      fieldset.append(legend);
      for (const option of field.options || []) {
        const label = document.createElement("label");
        label.className = "check-row";
        const input = document.createElement("input");
        input.type = "radio";
        input.name = field.id;
        input.value = option.value;
        input.required = Boolean(field.required);
        input.dataset.v2SchemaField = field.id;
        label.append(input, document.createTextNode(option.label));
        fieldset.append(label);
      }
      return fieldset;
    }

    if (field.type === "checkbox") {
      const label = document.createElement("label");
      label.className = "wide check-row";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = field.id;
      input.required = Boolean(field.required);
      input.dataset.v2SchemaField = field.id;
      label.append(input, document.createTextNode(field.label));
      return label;
    }

    const label = document.createElement("label");
    if (field.type === "textarea" || field.type === "file") label.className = "wide";
    label.append(document.createTextNode(field.label));

    let input;
    if (field.type === "textarea") {
      input = document.createElement("textarea");
      input.rows = 4;
    } else if (field.type === "select") {
      input = document.createElement("select");
      if (field.noDefault || field.required) {
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "Seleccioná una opción";
        placeholder.disabled = true;
        placeholder.selected = true;
        input.append(placeholder);
      }
      for (const option of field.options || []) {
        const item = document.createElement("option");
        item.value = option.value;
        item.textContent = option.label;
        input.append(item);
      }
    } else {
      input = document.createElement("input");
      input.type = ["email","tel","date","month","file"].includes(field.type) ? field.type : "text";
    }

    input.name = field.id;
    input.dataset.v2SchemaField = field.id;
    if (field.placeholder) input.placeholder = field.placeholder;
    if (field.autocomplete) input.autocomplete = field.autocomplete;
    if (field.inputmode) input.inputMode = field.inputmode;
    if (field.accept && input.type === "file") input.accept = field.accept;

    const isContactRequired = field.id === "fullName" || field.id === "whatsapp";
    input.required = Boolean(field.required || isContactRequired);

    if (input.type === "file") {
      input.dataset.v2FileField = field.id;
      input.dataset.originalRequired = field.required ? "true" : "false";
      if (!b2Ready) {
        input.disabled = true;
        input.required = false;
        const note = document.createElement("small");
        note.className = "muted";
        note.textContent = "Carga privada pendiente de habilitar B2 en STAGING.";
        label.append(input, note);
        return label;
      }
    }

    label.append(input);
    return label;
  }

  async function renderServiceSchema(form, serviceId) {
    let schema = null;
    let b2Ready = false;
    try {
      const dataset = await fetch("/v2/data/form-schema-v2.json", { cache: "no-store" }).then((r) => {
        if (!r.ok) throw new Error("schema_unavailable");
        return r.json();
      });
      schema = dataset?.services?.[serviceId] || null;
    } catch {}

    try {
      const health = await api("/v2/health/dependencies", { method: "GET" });
      b2Ready = health?.dependencies?.b2 === "configured";
    } catch {}

    if (!schema?.fields?.length) return { schema: null, b2Ready, submit: qs('button[type="submit"]', form) };

    form.replaceChildren();
    const fragment = document.createDocumentFragment();
    for (const field of schema.fields) {
      const control = makeSchemaField(field, b2Ready);
      if (control) fragment.append(control);
    }

    if (!b2Ready && schema.fields.some((field) => field.type === "file")) {
      const notice = document.createElement("p");
      notice.className = "wide notice";
      notice.textContent = "Los campos de documentos están preparados, pero permanecen deshabilitados hasta conectar el almacenamiento privado B2 de STAGING.";
      fragment.append(notice);
    }

    const action = document.createElement("div");
    action.className = "wide";
    const button = document.createElement("button");
    button.className = "button";
    button.type = "submit";
    button.textContent = "Crear y guardar solicitud de prueba";
    action.append(button);
    fragment.append(action);
    form.append(fragment);

    return { schema, b2Ready, submit: button };
  }

  function schemaPayload(form) {
    const payload = {};
    const skip = new Set(["fullName","name","whatsapp","email","emailConfirm","authorization","serviceFeeAcceptance"]);
    const names = new Set(qsa("[data-v2-schema-field]", form).map((node) => node.name).filter(Boolean));
    for (const name of names) {
      if (skip.has(name)) continue;
      const controls = qsa('[name="' + CSS.escape(name) + '"]', form);
      const first = controls[0];
      if (!first || first.disabled || first.type === "file") continue;
      if (first.type === "radio") {
        const checked = controls.find((node) => node.checked);
        payload[name] = checked ? checked.value : null;
      } else if (first.type === "checkbox") {
        payload[name] = Boolean(first.checked);
      } else {
        payload[name] = String(first.value || "").trim();
      }
    }
    return payload;
  }

  async function uploadSchemaFiles(form, active, b2Ready) {
    if (!b2Ready) return { uploaded: 0, skipped: qsa('input[type="file"]', form).length };
    let uploaded = 0;
    for (const input of qsa('input[type="file"][data-v2-file-field]', form)) {
      const file = input.files?.[0];
      if (!file) continue;
      const fieldId = input.dataset.v2FileField || input.name;
      const kind = /dni/i.test(fieldId) ? "dni" : "supporting_document";
      const body = new FormData();
      body.set("file", file);
      body.set("kind", kind);
      body.set("fieldId", fieldId);
      await api("/v2/requests/" + encodeURIComponent(active.requestId) + "/files", {
        method: "POST",
        headers: {
          "Idempotency-Key": randomKey("schema-file-" + active.requestId + "-" + fieldId),
          "X-Request-Capability": active.capability,
        },
        body,
      });
      uploaded += 1;
    }
    return { uploaded, skipped: 0 };
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

    const rendered = await renderServiceSchema(form, serviceId);
    const schema = rendered.schema;
    const b2Ready = rendered.b2Ready;
    const submit = rendered.submit;
    const output = qs("[data-v2-form-message]", form.closest(".content") || document);
    const result = qs("[data-v2-created]", form.closest(".content") || document);

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

      const ruleError = validateServiceRules(form, schema);
      if (ruleError) {
        setMessage(output, ruleError, "error");
        return;
      }

      const data = new FormData(form);
      const email = String(data.get("email") || "").trim();
      const emailConfirm = String(data.get("emailConfirm") || "").trim();
      if (emailConfirm && email.toLowerCase() !== emailConfirm.toLowerCase()) {
        setMessage(output, "Los correos electrónicos no coinciden.", "error");
        return;
      }

      submit.disabled = true;
      setMessage(output, "Creando y guardando solicitud de prueba…");

      const body = {
        serviceId,
        contact: {
          name: String(data.get("fullName") || data.get("name") || "").trim(),
          whatsapp: String(data.get("whatsapp") || "").trim(),
          email: email || undefined,
        },
        consent: true,
      };

      try {
        const created = await api("/v2/requests/drafts", {
          method: "POST",
          headers: { "Idempotency-Key": randomKey("create-" + serviceId) },
          body: JSON.stringify(body),
        });
        const active = {
          requestId: created.id,
          capability: created.capability,
          trackingCode: created.trackingCode,
          serviceId,
          serviceName,
        };
        sessionStorage.setItem("tramipago-v2-current", JSON.stringify(active));

        const payload = schemaPayload(form);
        if (Object.keys(payload).length) {
          await api("/v2/requests/" + encodeURIComponent(active.requestId) + "/draft", {
            method: "PATCH",
            headers: {
              "Idempotency-Key": randomKey("initial-draft-" + active.requestId),
              "X-Request-Capability": active.capability,
            },
            body: JSON.stringify({ currentStep: "datos", payload }),
          });
        }

        const uploads = await uploadSchemaFiles(form, active, b2Ready);
        const extra = uploads.uploaded
          ? " · " + uploads.uploaded + " archivo(s) privado(s) cargado(s)."
          : "";
        setMessage(output, "Solicitud y datos de prueba guardados en MySQL." + extra, "success");
        renderCreated(active);
        form.reset();
      } catch (error) {
        setMessage(output, error.status === 404
          ? "Este trámite todavía no está habilitado en la base V2."
          : error.status === 503
            ? "La solicitud quedó limitada por una dependencia externa todavía pendiente."
            : "No se pudo guardar la solicitud de prueba. Intentá nuevamente.", "error");
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
