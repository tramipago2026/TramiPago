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
    return window.TramiPagoShell?.statusLabel(status) || status || "Sin estado";
  }

  async function initSearch() {
    const results = qs("#v2-search-results");
    if (!results) return;
    const q = (new URLSearchParams(location.search).get("q") || "").trim();
    const term = qs("#search-term");
    if (term) term.textContent = q ? "Búsqueda: " + q : "Ingresá un trámite para buscar";
    if (!q) {
      const note = document.createElement("p");
      note.textContent = "Usá el buscador para encontrar un trámite.";
      results.replaceChildren(note);
      return;
    }

    let services = [];
    try {
      const manifest = await fetch("/v2/rutas-v2.json", { cache: "no-store" }).then((r) => {
        if (!r.ok) throw new Error("catalog_unavailable");
        return r.json();
      });
      if (!Array.isArray(manifest.services)) throw new Error("catalog_invalid");
      services = manifest.services;
    } catch {
      setMessage(results, "No se pudo cargar el catálogo.", "error");
      const retry = document.createElement("button");
      retry.type = "button"; retry.className = "button"; retry.textContent = "Reintentar";
      retry.addEventListener("click", () => location.reload());
      results.append(retry);
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

    // Buscar todas las palabras, independientemente de su orden, manteniendo
    // la normalización de tildes y los sinónimos de cada trámite.
    const terms = normalize(q).split(/\s+/).filter(Boolean);
    const matches = terms.length
      ? services.filter((item) => {
          const searchable = normalize([item.name, item.family || "", aliases[item.id] || ""].join(" "));
          return terms.every((term) => searchable.includes(term));
        })
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
      p.textContent = q ? "No encontramos trámites con esa búsqueda." : "Usá el buscador para encontrar un trámite.";
      results.append(p);
    }
  }

  function fieldHasValue(form, id) {
    const controls = qsa('[name="' + CSS.escape(id) + '"]', form);
    if (!controls.length) return false;
    return controls.some((control) => {
      if (control.disabled) return false;
      if (control.type === "checkbox" || control.type === "radio") return control.checked;
      if (control.type === "file") return Boolean(control.files?.length) || control.dataset.v2Uploaded === "true";
      return String(control.value || "").trim().length > 0;
    });
  }

  function validateServiceRules(form, schema) {
    if (schema?.blockedConditions?.some(condition => matchesCondition(form, condition))) return "Esta opción no está disponible en el flujo actual. Elegí otra opción o pedinos ayuda.";
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

  const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
  function whatsappHelp(serviceName, trackingCode = "") {
    const link = document.createElement("a");
    link.className = "button file-help-button";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.href = "https://wa.me/5491167083232?text=" + encodeURIComponent(
      "Hola, necesito ayuda con " + (serviceName || "mi trámite") +
      (trackingCode ? ". Código: " + trackingCode : "") + ". No puedo adjuntar la documentación."
    );
    link.textContent = "Necesito ayuda por WhatsApp →";
    return link;
  }
  function uploadIssue(file, accept = "") {
    if (!file || !file.size) return "Seleccioná un archivo válido.";
    if (file.size > MAX_UPLOAD_BYTES) return "El archivo supera los 10 MB permitidos.";
    const ext = file.name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] || "";
    const mime = {".pdf":"application/pdf",".jpg":"image/jpeg",".jpeg":"image/jpeg",".png":"image/png"}[ext];
    if (!mime || file.type !== mime || !accept.split(",").map(v => v.trim()).includes(mime)) {
      return "Formato no permitido. Usá PDF, JPG o PNG según lo indicado.";
    }
    return "";
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
      {
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

    const isContactRequired = field.id === "whatsapp";
    input.required = Boolean(field.required || isContactRequired);

    // Two priced alternatives are direct, accessible selection buttons;
    // the original select and value remain unchanged for the backend contract.
    if (field.type === "select" && ["modality","dataMode"].includes(field.id) && field.options?.length === 2) {
      const group = document.createElement("fieldset");
      group.className = "price-choice-group wide";
      const legend = document.createElement("legend");
      legend.textContent = field.label;
      group.append(legend);
      input.className = "price-choice-native";
      input.setAttribute("aria-label", field.label);
      group.append(input);
      const options = document.createElement("div");
      options.className = "price-choice-options";
      for (const option of field.options) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "price-choice-button";
        button.dataset.v2PriceOption = "";
        button.dataset.v2PriceFor = field.id;
        button.dataset.v2PriceValue = option.value;
        button.setAttribute("aria-pressed", "false");
        button.textContent = option.label;
        button.addEventListener("click", () => {
          input.value = option.value;
          input.dispatchEvent(new Event("change", {bubbles:true}));
        });
        options.append(button);
      }
      group.append(options);
      return group;
    }

    if (input.type === "file") {
      input.dataset.v2FileField = field.id;
      input.dataset.originalRequired = field.required ? "true" : "false";
      const limits = document.createElement("small");
      limits.className = "file-format-note";
      limits.textContent = "Formatos: " + (field.accept?.includes("application/pdf") ? "PDF, " : "") + "JPG o PNG · máximo 10 MB por archivo.";
      label.append(input, limits);
      if (!b2Ready) {
        input.disabled = true;
        input.required = false;
        const note = document.createElement("small");
        note.className = "muted";
        note.textContent = "Carga temporalmente deshabilitada. Si necesitás continuar, pedí ayuda.";
        label.append(note);
        return label;
      }
    }

    if (input.type !== "file") label.append(input);
    return label;
  }

  function matchesCondition(form, condition) {
    if (condition.all) return condition.all.every(item => matchesCondition(form, item));
    if (condition.any) return condition.any.some(item => matchesCondition(form, item));
    const controls = qsa('[name="' + CSS.escape(condition.field) + '"]', form);
    const selected = controls.find(node => node.type === "radio" ? node.checked : true)?.value || "";
    return condition.values ? condition.values.includes(selected) : condition.notEquals !== undefined ? Boolean(selected) && selected !== condition.notEquals : selected === condition.equals;
  }

  function applyFieldConditions(form, schema) {
    const value = (id) => {
      const controls = qsa('[name="' + CSS.escape(id) + '"]', form);
      return controls.find(node => node.type === "radio" ? node.checked : true)?.value || "";
    };
    const matches = condition => matchesCondition(form, condition);
    for (const [id, condition] of Object.entries(schema.fieldConditions || {})) {
      const wrapper = qs('[data-v2-field="' + CSS.escape(id) + '"]', form);
      if (!wrapper) continue;
      const visible = matches(condition);
      wrapper.hidden = !visible;
      for (const input of qsa("input,select,textarea", wrapper)) {
        input.disabled = !visible || input.dataset.v2Unavailable === "true";
        input.required = visible && !input.disabled && input.dataset.v2Required === "true";
      }
    }
    for (const [id, condition] of Object.entries(schema.fieldRequirements || {})) {
      const wrapper = qs('[data-v2-field="' + CSS.escape(id) + '"]', form);
      const field = schema.fields.find(item => item.id === id);
      if (!wrapper || !field) continue;
      const required = Boolean(field.required || matches(condition));
      for (const input of qsa("input,select,textarea", wrapper)) {
        input.required = !wrapper.hidden && !input.disabled && required;
        if (input.type === "file") input.dataset.originalRequired = required ? "true" : "false";
      }
      if (!field.required && !schema.fieldConditions?.[id] && !["fullName", "name", "email", "whatsapp", "authorization"].includes(id)) {
        const target = qs(required ? '[data-v2-group="service"]' : "[data-v2-optional-fields]", form);
        if (target && wrapper.parentElement !== target) target.append(wrapper);
      }
    }
    // When the applicant is the holder, ask their name once.
    const holder = value("applicantRole") === "holder";
    const name = qs('[name="fullName"]', form);
    const wrapper = qs('[data-v2-field="fullName"]', form);
    if (schema.fieldConditions?.thirdPartyDocument && name && wrapper) {
      wrapper.hidden = holder;
      name.disabled = holder;
      if (holder) name.value = value("recordHolderFullName");
    }
    const optional = qs(".request-optional", form);
    if (optional) optional.hidden = !qsa("[data-v2-field]", optional).some(node => !node.hidden);
  }

  async function renderServiceSchema(form, serviceId) {
    let schema = null, b2Ready = false;
    try {
      const [dataset, health] = await Promise.all([
        fetch("/v2/data/form-schema-v2.json", { cache: "no-store" }).then(r => {
          if (!r.ok) throw new Error("schema_unavailable");
          return r.json();
        }),
        api("/v2/health/dependencies", { method: "GET" }).catch(() => null),
      ]);
      schema = dataset?.services?.[serviceId] || null;
      b2Ready = health?.dependencies?.b2 === "configured";
    } catch {}
    form.replaceChildren();
    if (!schema?.fields?.length) return { schema: null, b2Ready, submit: null };

    const groups = new Map();
    const addGroup = (key, title) => {
      const group = document.createElement("fieldset");
      group.className = "request-group";
      const legend = document.createElement("legend");
      legend.textContent = title;
      const fields = document.createElement("div");
      fields.className = "request-fields";
      fields.dataset.v2Group = key;
      group.append(legend, fields);
      form.append(group);
      groups.set(key, fields);
    };
    addGroup("service", "Datos del trámite");
    addGroup("contact", "Contacto");
    addGroup("consent", "Autorización");
    const optional = document.createElement("details");
    optional.className = "request-optional";
    const optionalTitle = document.createElement("summary");
    optionalTitle.textContent = "Agregar información opcional";
    const optionalFields = document.createElement("div");
    optionalFields.className = "request-fields";
    optionalFields.dataset.v2OptionalFields = "";
    optional.append(optionalTitle, optionalFields);
    form.insertBefore(optional, groups.get("consent").parentElement);
    const contact = new Set(["fullName", "name", "whatsapp", "email", "emailAccess"]);
    const consent = new Set(["authorization", "serviceFeeAcceptance"]);
    const alternatives = new Set([...(schema.rules?.anyOf || []), ...(schema.rules?.oneOfGroups || []).flat()]);
    for (const field of schema.fields) {
      if (field.id === "emailConfirm") continue; // Email is checked in the inline summary.
      const control = makeSchemaField(field, b2Ready);
      if (!control) continue;
      control.dataset.v2Field = field.id;
      for (const input of qsa("input,select,textarea", control)) {
        input.dataset.v2Required = input.required ? "true" : "false";
        if (input.type === "file" && input.disabled) input.dataset.v2Unavailable = "true";
        if (input.name === "whatsapp") { input.minLength = 8; input.maxLength = 40; }
        if (["name", "fullName"].includes(input.name)) { input.minLength = 2; input.maxLength = 200; }
      }
      const group = consent.has(field.id) ? groups.get("consent") : contact.has(field.id) ? groups.get("contact") : field.required || alternatives.has(field.id) || schema.fieldConditions?.[field.id] ? groups.get("service") : optionalFields;
      group.append(control);
    }
    for (const fields of groups.values()) if (!fields.children.length) fields.parentElement.remove();
    if (!optionalFields.children.length && !Object.keys(schema.fieldRequirements || {}).length) optional.remove();
    if (!b2Ready && schema.fields.some(field => field.type === "file")) {
      const notice = document.createElement("p");
      notice.className = "notice";
      notice.textContent = "No se pueden adjuntar archivos por ahora. Podés guardar los datos, pero el trámite que requiera documentos no podrá completarse hasta habilitar la carga.";
      const help = document.createElement("div");
      help.className = "file-help-actions";
      help.append(whatsappHelp(qs("[data-v2-service-title]")?.textContent || serviceId));
      notice.append(help);
      form.append(notice);
    }
    const preview = document.createElement("details");
    preview.className = "request-preview";
    preview.dataset.v2Preview = "";
    const title = document.createElement("summary");
    title.textContent = "Revisar mis datos antes de continuar";
    const summary = document.createElement("div");
    summary.dataset.v2PreviewContent = "";
    preview.append(title, summary);
    form.append(preview);

    const action = document.createElement("div");
    action.className = "request-actions";
    const note = document.createElement("span");
    note.className = "muted";
    note.textContent = "Los datos se ingresan una sola vez. Podés revisarlos en esta misma pantalla.";
    const button = document.createElement("button");
    button.className = "button";
    button.type = "submit";
    button.textContent = schema.intakeOnly ? "Enviar consulta →" : "Continuar al pago →";
    action.append(note, button);
    form.append(action);
    applyFieldConditions(form, schema);
    return { schema, b2Ready, submit: button };
  }


  // Only the presentation changes: all 25 service schemas retain their backend contract.
  function setupFormWizard(form, schema, output) {
    const group = id => qs('[data-v2-group="' + id + '"]', form)?.closest(".request-group") || null;
    const contact = group("contact"), service = group("service"), consent = group("consent");
    const optional = qs(".request-optional", form), preview = qs("[data-v2-preview]", form);
    const actions = qs(".request-actions", form);
    if (!contact || !service || !actions) return { validateAll: () => form.reportValidity(), reset: () => {} };
    const serviceFirst = Boolean(schema.fieldConditions?.fullName || schema.fieldConditions?.thirdPartyDocument);
    if (!serviceFirst) form.insertBefore(contact, service);
    const steps = (serviceFirst ? [
      { id: "service", label: "Datos del trámite", nodes: [service, optional, ...qsa("p.notice", form)] },
      { id: "contact", label: "Tus datos", nodes: [contact] },
    ] : [
      { id: "contact", label: "Tus datos", nodes: [contact] },
      { id: "service", label: "Datos del trámite", nodes: [service, optional, ...qsa("p.notice", form)] },
    ]).concat([{ id: "review", label: "Revisar y confirmar", nodes: [consent, preview, actions] }]);
    for (const item of steps) item.nodes = item.nodes.filter(Boolean);
    const progress = document.createElement("nav");
    progress.className = "form-wizard-progress";
    progress.setAttribute("aria-label", "Pasos para completar el formulario");
    const list = document.createElement("ol");
    for (const item of steps) {
      const li = document.createElement("li");
      const number = document.createElement("strong");
      number.textContent = String(steps.indexOf(item) + 1);
      const label = document.createElement("span");
      label.textContent = item.label;
      li.append(number, label);
      list.append(li);
    }
    progress.append(list);
    form.prepend(progress);
    const navigation = document.createElement("div");
    navigation.className = "form-wizard-navigation";
    const back = document.createElement("button");
    back.type = "button"; back.className = "button secondary-button";
    back.textContent = "← Volver"; back.dataset.v2WizardBack = "";
    const next = document.createElement("button");
    next.type = "button"; next.className = "button";
    next.textContent = "Continuar →"; next.dataset.v2WizardNext = "";
    navigation.append(back, next);
    form.append(navigation);
    form.noValidate = true;
    let current = 0;
    const draw = index => {
      current = Math.max(0, Math.min(index, steps.length - 1));
      for (let i = 0; i < steps.length; i += 1) {
        for (const node of steps[i].nodes) node.classList.toggle("wizard-hidden", i !== current);
        const li = list.children[i];
        li.className = i < current ? "complete" : i === current ? "active" : "";
        if (i === current) li.setAttribute("aria-current", "step");
        else li.removeAttribute("aria-current");
      }
      back.hidden = current === 0;
      next.hidden = current === steps.length - 1;
      if (current === steps.length - 1 && preview) preview.open = true;
      form.dataset.v2WizardStep = String(current + 1);
    };
    const check = index => {
      draw(index);
      for (const node of steps[index].nodes) {
        for (const control of qsa("input,select,textarea", node)) {
          if (control.disabled || control.closest("[data-v2-field]")?.hidden) continue;
          if (!control.checkValidity()) {
            const details = control.closest("details");
            if (details) details.open = true;
            control.reportValidity();
            return false;
          }
        }
      }
      if (steps[index].id === "service") {
        const problem = validateServiceRules(form, schema);
        if (problem) {
          setMessage(output, problem, "error");
          return false;
        }
      }
      return true;
    };
    back.addEventListener("click", () => draw(current - 1));
    next.addEventListener("click", () => {
      if (check(current)) {
        setMessage(output, "");
        draw(current + 1);
      }
    });
    draw(0);
    return {
      reset: () => draw(0),
      validateAll: () => {
        for (let i = 0; i < steps.length; i += 1) if (!check(i)) return false;
        draw(steps.length - 1);
        return true;
      },
    };
  }

  function attachRequestContext(form, output, result, service, family) {
    // Real, text-free photography by topic; avoid cropped V1 advertising composites.
    const photoByFamily = {
      "partidas-certificados":"partidas",
      "arca":"arca",
      "legalizaciones-apostillas":"apostillas",
      "atencion-abogado":"abogado",
      "asistencia-digital":"digital",
    };
    const photoByService = {
      "antecedentes-penales":"partidas",
      "constancias-anses":"atencion",
      "informe-vehicular":"vehiculos",
      "arba-inmobiliario":"arca",
    };
    const photoId = photoByService[service?.id] || photoByFamily[family?.id] || "digital";
    if (!service || !form.parentElement) return;
    const layout = document.createElement("div");
    layout.className = "request-layout";
    const main = document.createElement("div");
    main.className = "request-layout-main";
    const aside = document.createElement("aside");
    aside.className = "request-context";
    aside.setAttribute("aria-label", "Información sobre el trámite seleccionado");
    const photo = document.createElement("img");
    photo.src = "/v2/photo/" + photoId + ".jpg";
    photo.addEventListener("error",()=>{photo.hidden=true;aside.classList.add("photo-unavailable");});
    photo.alt = "Imagen relacionada con " + service.name;
    photo.loading = "lazy";
    photo.decoding = "async";
    const content = document.createElement("div");
    content.className = "request-context-copy";
    const eyebrow = document.createElement("p");
    eyebrow.className = "muted";
    eyebrow.textContent = "Estás solicitando";
    const title = document.createElement("h2");
    title.textContent = service.name;
    const description = document.createElement("p");
    description.textContent = "Completá los datos y revisalos antes de continuar.";
    const help = document.createElement("a");
    help.href = "/v2/ayuda/";
    help.className = "request-context-help";
    help.textContent = "¿Necesitás ayuda? →";
    content.append(eyebrow, title, description, help);
    aside.append(photo, content);
    form.before(layout);
    layout.append(main, aside);
    main.append(form, output, result);
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
      if (input.disabled) continue;
      const file = input.files?.[0];
      if (!file) continue;
      const issue = uploadIssue(file, input.accept);
      if (issue) throw new Error(issue);
      const fieldId = input.dataset.v2FileField || input.name;
      const kind = /dni/i.test(fieldId) ? "dni" : "supporting_document";
      const body = new FormData();
      body.set("file", file);
      body.set("kind", kind);
      body.set("fieldId", fieldId);
      const uploadedFile = await api("/v2/requests/" + encodeURIComponent(active.requestId) + "/files", {
        method: "POST",
        headers: {
          "Idempotency-Key": randomKey("schema-file-" + active.requestId + "-" + fieldId),
          "X-Request-Capability": active.capability,
        },
        body,
      });
      active.uploadedFields ||= {};
      active.uploadedFields[fieldId] = uploadedFile.fileId;
      input.dataset.v2Uploaded = "true";
      input.required = false;
      input.value = "";
      uploaded += 1;
    }
    return { uploaded, skipped: 0 };
  }

  async function initStartForm() {
    const form = qs("[data-v2-request-form]");
    if (!form) return;
    form.inert = true;
    const pathMatch = location.pathname.match(/^\/v2\/tramites\/([^/]+)(?:\/iniciar)?\/?$/);
    const serviceId = form.dataset.serviceId || pathMatch?.[1] || "";
    let serviceName = serviceId;
    let serviceInfo = null, familyInfo = null;
    const titleNode = qs("[data-v2-service-title]");
    const backLink = qs("[data-v2-service-back]");
    const output = qs("[data-v2-form-message]");
    const result = qs("[data-v2-created]");
    try {
      const manifest = await fetch("/v2/rutas-v2.json", { cache: "no-store" }).then(r => r.json());
      const service = manifest.services.find(item => item.id === serviceId);
      if (service) {
        serviceName = service.name;
        serviceInfo = service;
        familyInfo = manifest.families?.find(item => item.id === service.family) || null;
      }
    } catch {}
    if (titleNode) titleNode.textContent = serviceName;
    if (backLink) { backLink.href = "/v2/tramites/"; backLink.textContent = "← Todos los trámites"; }
    const { schema, b2Ready, submit } = await renderServiceSchema(form, serviceId);
    if (!schema || !submit) {
      form.inert = false;
      setMessage(output, "No se pudo cargar el formulario. Volvé a intentarlo.", "error");
      if (output) {
        const retry = document.createElement("button");
        retry.type = "button"; retry.className = "button"; retry.textContent = "Reintentar";
        retry.addEventListener("click", () => location.reload());
        output.after(retry);
      }
      return;
    }
    // La referencia comercial es el tarifario existente de V1; el backend siempre recalcula el importe.
    let tariff = null;
    try {
      const snapshot = await fetch("/v2/data/tarifario-v1-v2.json", { cache: "no-store" }).then(r => r.ok ? r.json() : null);
      tariff = snapshot?.services?.[serviceId] || null;
    } catch {}
    const quoteNode = document.createElement("p");
    quoteNode.className = "muted";
    quoteNode.setAttribute("aria-live", "polite");
    submit.before(quoteNode);
    attachRequestContext(form, output, result, serviceInfo, familyInfo);
    const wizard = setupFormWizard(form, schema, output);
    const formatPrice = amount => new Intl.NumberFormat("es-AR", {
      style: "currency", currency: "ARS", maximumFractionDigits: 0,
    }).format(amount);
    const cacheKey = "tramipago-v2-form-" + serviceId;
    let active = null;
    try {
      const saved = JSON.parse(sessionStorage.getItem("tramipago-v2-current") || "null");
      if (saved?.serviceId === serviceId) active = saved;
    } catch {}
    let createKey = randomKey("create-" + serviceId);
    let submitting = false;
    let existingContact = null;
    let uploadedFields = active?.uploadedFields || {};

    const fields = () => qsa("[data-v2-schema-field]", form);
    function values() {
      const data = {};
      for (const input of fields()) {
        if (input.disabled && input.name !== "fullName") continue;
        if (input.type === "radio") { if (input.checked) data[input.name] = input.value; }
        else if (input.type === "checkbox") data[input.name] = input.checked;
        else if (input.type === "file") data[input.name] = input.files?.[0]?.name || (uploadedFields[input.name] ? "Documento recibido" : "");
        else data[input.name] = input.value.trim();
      }
      return data;
    }
    function fill(data) {
      for (const input of fields()) {
        if (input.type === "file" || data[input.name] === undefined) continue;
        if (input.type === "radio") input.checked = data[input.name] === input.value;
        else if (input.type === "checkbox") input.checked = data[input.name] === true;
        else input.value = String(data[input.name] ?? "");
      }
    }
    function missingDocuments() {
      return qsa('input[type="file"]', form).filter(input => input.dataset.originalRequired === "true" && !input.closest("[data-v2-field]").hidden && !input.files?.length && !uploadedFields[input.name]);
    }
    function refresh() {
      applyFieldConditions(form, schema);
      for (const input of qsa('input[type="file"]', form)) {
        if (uploadedFields[input.name]) { input.required = false; input.dataset.v2Uploaded = "true"; }
      }
      const missing = missingDocuments().length > 0;
      for (const option of qsa("[data-v2-price-option]", form)) {
        const selected = qs('[name="' + CSS.escape(option.dataset.v2PriceFor) + '"]', form)?.value;
        const active = selected === option.dataset.v2PriceValue;
        option.setAttribute("aria-pressed", String(active));
        option.classList.toggle("selected", active);
      }
      window.TramiPagoProgress?.render({ requiresPayment: !schema.intakeOnly, missingDocuments: missing, status: "draft" });
      submit.textContent = missing && !b2Ready ? "Guardar datos →" : schema.intakeOnly ? "Enviar consulta →" : "Continuar al pago →";
      const options = tariff?.options || [];
      const selected = options.length === 1 ? options[0] : options.find(
        option => String(values()[tariff?.selector] || "") === option.value,
      );
      quoteNode.textContent = !tariff
        ? "El importe se informará antes de habilitar el pago."
        : !options.length
          ? "Importe a confirmar según la gestión. No realices transferencias."
          : !selected
            ? "Seleccioná una modalidad para conocer el importe."
            : (tariff.officialFeeIncluded ? "Importe total del servicio: " : "Importe de gestión TramiPago: ") +
              formatPrice(selected.amount) +
              (tariff.officialFeeExternal ? ". La tasa oficial se informa y cobra por separado cuando corresponda." : "");
      window.TramiPagoProgress?.summary(qs("[data-v2-preview-content]", form), schema, values());
      try { sessionStorage.setItem(cacheKey, JSON.stringify(values())); } catch {}
    }
    function savedCard(data, pending = false) {
      result.hidden = false;
      result.replaceChildren();
      const heading = document.createElement("h2");
      heading.textContent = pending ? "Datos guardados" : "Ya tenés una solicitud en curso";
      const code = document.createElement("p");
      code.textContent = "Código: ";
      const tracking = document.createElement("code");
      tracking.dataset.v2TrackingCode = "";
      tracking.textContent = active.trackingCode;
      code.append(tracking);
      const note = document.createElement("p");
      note.textContent = pending ? "La documentación requerida sigue pendiente. Tus datos ya están guardados." : "Estado: " + statusLabel(data.status);
      result.append(heading, code, note);
      if (pending) {
        const actions = document.createElement("div");
        actions.className = "file-help-actions";
        actions.append(whatsappHelp(serviceName, active.trackingCode));
        result.append(actions);
      }
      if (!pending) {
        const next = document.createElement("a");
        next.className = "button";
        next.href = "/v2/tramites/" + serviceId + (data.status === "awaiting_payment" ? "/pago/" : "/confirmacion/");
        next.textContent = "Continuar mi solicitud →";
        const reset = document.createElement("button");
        reset.type = "button";
        reset.className = "button secondary-button";
        reset.textContent = "Iniciar otra solicitud";
        reset.addEventListener("click", () => {
          active = null; existingContact = null; uploadedFields = {};
          sessionStorage.removeItem("tramipago-v2-current"); sessionStorage.removeItem(cacheKey);
          createKey = randomKey("create-" + serviceId);
          form.reset(); form.hidden = false; result.hidden = true; wizard.reset(); refresh();
        });
        const actions = document.createElement("div");
        actions.className = "flow-actions";
        actions.append(next, reset);
        result.append(actions);
      }
    }
    let cached = null;
    try { cached = JSON.parse(sessionStorage.getItem(cacheKey) || "null"); } catch {}
    if (active) {
      try {
        const data = await api("/v2/requests/" + encodeURIComponent(active.requestId) + "/draft", { method: "GET", headers: { "X-Request-Capability": active.capability } });
        existingContact = active.contact || data.contact;
        if (data.status === "draft") {
          fill(cached || { ...data.payload, fullName: data.contact.name, name: data.contact.name, email: data.contact.email, whatsapp: data.contact.whatsapp });
        } else {
          form.hidden = true;
          savedCard(data);
          window.TramiPagoProgress?.render({ requiresPayment: data.requiresPayment, status: data.status });
        }
      } catch { active = null; }
    } else if (cached) fill(cached);
    if (!form.hidden) refresh();
    form.addEventListener("change", event => {
      const input = event.target;
      if (input?.type !== "file" || input.disabled || !input.files?.length) return;
      const error = uploadIssue(input.files[0], input.accept);
      if (error) {
        input.value = "";
        setMessage(output, error, "error");
      } else setMessage(output, "");
    }, true);
    form.addEventListener("input", refresh);
    form.addEventListener("change", refresh);
    form.addEventListener("invalid", event => {
      const details = event.target.closest("details");
      if (details) details.open = true;
    }, true);
    form.inert = false;
    form.dataset.v2Ready = "true";

    form.addEventListener("submit", async event => {
      event.preventDefault();
      if (submitting || !wizard.validateAll()) return;
      const ruleError = validateServiceRules(form, schema);
      if (ruleError) { setMessage(output, ruleError, "error"); return; }
      const data = new FormData(form);
      const contact = {
        name: String(data.get("fullName") || data.get("name") || (data.get("applicantRole") === "holder" ? data.get("recordHolderFullName") : "") || "").trim(),
        whatsapp: String(data.get("whatsapp") || "").trim(),
        email: String(data.get("email") || "").trim() || undefined,
      };
      // Contact is immutable in the existing draft API. Never silently change it.
      if (active && existingContact && ["name", "whatsapp", "email"].some(key => String(existingContact[key] || "") !== String(contact[key] || ""))) {
        setMessage(output, "Esta solicitud ya guardó sus datos de contacto. Conservá esos datos para continuar.", "error");
        return;
      }
      submitting = true; submit.disabled = true;
      setMessage(output, "Guardando tus datos…");
      try {
        if (!active) {
          const created = await api("/v2/requests/drafts", { method: "POST", headers: { "Idempotency-Key": createKey }, body: JSON.stringify({ serviceId, contact, consent: true }) });
          active = { requestId: created.id, capability: created.capability, trackingCode: created.trackingCode, serviceId, serviceName, contact, uploadedFields: {} };
          existingContact = contact;
          sessionStorage.setItem("tramipago-v2-current", JSON.stringify(active));
        }
        await api("/v2/requests/" + encodeURIComponent(active.requestId) + "/draft", {
          method: "PATCH",
          headers: { "Idempotency-Key": randomKey("draft-" + active.requestId), "X-Request-Capability": active.capability },
          body: JSON.stringify({ currentStep: "datos", payload: schemaPayload(form) }),
        });
        await uploadSchemaFiles(form, active, b2Ready);
        uploadedFields = active.uploadedFields || {};
        sessionStorage.setItem("tramipago-v2-current", JSON.stringify(active));
        if (missingDocuments().length) {
          savedCard(null, true);
          setMessage(output, "Datos guardados. Falta adjuntar la documentación requerida.", "success");
          refresh();
          return;
        }
        active.submitKey ||= randomKey("submit-" + active.requestId);
        sessionStorage.setItem("tramipago-v2-current", JSON.stringify(active));
        const done = await api("/v2/requests/" + encodeURIComponent(active.requestId) + "/submit", {
          method: "POST",
          headers: { "Idempotency-Key": active.submitKey, "X-Request-Capability": active.capability },
          body: "{}",
        });
        sessionStorage.setItem("tramipago-v2-current", JSON.stringify(active));
        location.href = "/v2/tramites/" + serviceId + (done.requiresPayment ? "/pago/" : "/confirmacion/");
      } catch (error) {
        setMessage(output, error.status === 404 ? "Este trámite no está disponible por el momento." : error.status === 503 ? "No se pudo completar esta etapa. Los datos guardados se conservan." : "No se pudo continuar. Tus datos siguen en esta pantalla; intentá nuevamente.", "error");
      } finally { submitting = false; submit.disabled = false; }
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
    let schemasPromise = null;
    async function labelsForMissing(missing, serviceId) {
      if (!missing.length) return new Map();
      schemasPromise ||= fetch("/v2/data/form-schema-v2.json").then(r => {
        if (!r.ok) throw new Error("schema_unavailable");
        return r.json();
      }).catch(() => null);
      const schemas = await schemasPromise;
      const fields = schemas?.services?.[serviceId]?.fields || Object.values(schemas?.services || {}).flatMap(service => service.fields || []);
      return new Map(missing.map((id, i) => [id, fields.find(field => field.id === id)?.label || "Información adicional " + (i + 1)]));
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const button = qs('button[type="submit"]', form);
      button.disabled = true;
      form.setAttribute("aria-busy", "true");
      if (statusNode) statusNode.textContent = "Consultando…";
      if (noteNode) noteNode.hidden = true;
      if (missingNode) missingNode.hidden = true;
      if (output) {
        for (const previous of qsa("[data-v2-correction-form], [data-v2-result-downloads]", output)) previous.remove();
        output.dataset.kind = "info";
        output.hidden = false;
      }

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
        let current = null;
        try { current = JSON.parse(sessionStorage.getItem("tramipago-v2-current") || "null"); } catch {}
        const requestedCode = String(data.get("trackingCode") || "").trim().toUpperCase();
        const sameRequest = current?.trackingCode?.toUpperCase() === requestedCode;
        const labels = await labelsForMissing(missing, sameRequest ? current.serviceId : null);
        if (missingNode) {
          missingNode.textContent = missing.length ? "Información pendiente: " + missing.map(field => labels.get(field)).join(", ") : "";
          missingNode.hidden = !missing.length;
        }
        if (output) {
          output.hidden = false;
          const old = qs("[data-v2-correction-form]", output);
          if (old) old.remove();
          const previousResults = qs("[data-v2-result-downloads]", output);
          if (previousResults) previousResults.remove();
          if (Array.isArray(response.results) && response.results.length && response.resultAccessToken) {
            const downloads = document.createElement("div");
            downloads.dataset.v2ResultDownloads = "";
            const heading = document.createElement("h3");
            heading.textContent = "Resultado disponible";
            downloads.append(heading);
            for (const item of response.results) {
              const button = document.createElement("button");
              button.type = "button";
              button.className = "button";
              button.textContent = "Descargar " + (item.name || "resultado");
              button.addEventListener("click", async () => {
                button.disabled = true;
                try {
                  const fileResponse = await fetch("/v2/results/" + encodeURIComponent(item.fileId), {
                    credentials: "same-origin",
                    headers: { "X-Result-Access": response.resultAccessToken },
                  });
                  if (!fileResponse.ok) throw new Error("download_failed");
                  const blob = await fileResponse.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = item.name || "tramipago-resultado";
                  a.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                } catch {
                  setMessage(noteNode, "No se pudo descargar el resultado. Volvé a consultar el estado para renovar el acceso.", "error");
                } finally {
                  button.disabled = false;
                }
              });
              downloads.append(button);
            }
            output.append(downloads);
          }

          if (response.canCorrect && missing.length && sameRequest && current?.capability) {
            const correction = document.createElement("form");
            correction.className = "vertical";
            correction.dataset.v2CorrectionForm = "";
            for (const field of missing) {
              const label = document.createElement("label");
              label.textContent = "Corregir: " + labels.get(field);
              const input = document.createElement("input");
              input.name = field; input.required = true; input.maxLength = 1000;
              label.append(input); correction.append(label);
            }
            const save = document.createElement("button");
            save.type = "submit"; save.className = "button"; save.textContent = "Enviar corrección";
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
          output.dataset.kind = "success";
        }
      } catch (error) {
        if (statusNode) statusNode.textContent = error.status === 429
          ? "Demasiados intentos. Probá más tarde."
          : error.status === 404
            ? "No encontramos una solicitud con esos datos."
            : "No se pudo consultar el estado. Volvé a intentarlo.";
        if (noteNode) noteNode.hidden = true;
        if (missingNode) missingNode.hidden = true;
        if (output) { output.dataset.kind = "error"; output.hidden = false; }
      } finally {
        form.setAttribute("aria-busy", "false");
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
      setMessage(output, "Primero iniciá una solicitud para asociar tu consulta.", "info");
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
        setMessage(output, "Consulta registrada en el trámite.", "success");
        form.reset();
      } catch {
        setMessage(output, "No se pudo registrar la consulta.", "error");
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
          context: { path: location.pathname, build: "v2", environment: "staging" },
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
  initHelp();
})();
