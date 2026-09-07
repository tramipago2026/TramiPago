/* Configuración central de servicios */
(function () {
  const contactFields = [
    { id: "fullName", label: "Nombre y apellido", type: "text", required: true, autocomplete: "name" },
    { id: "email", label: "Correo electrónico", type: "email", required: true, autocomplete: "email" },
    { id: "whatsapp", label: "WhatsApp", type: "tel", required: true, placeholder: "Ej.: 11 1234-5678 (sin +54 9)", autocomplete: "tel" }
  ];

  const authorizationField = {
    id: "authorization",
    label: "Leí y acepto los Términos y Condiciones y la Política de Privacidad. Autorizo a TramiPago a utilizar mis datos y documentos únicamente para gestionar el trámite solicitado.",
    type: "checkbox",
    required: true
  };

  window.TRAMI_CONFIG = {
    whatsappNumber: "5491167083232",
    alias: "TRAMIPAGO",
    paymentCvu: "0000003100004971102062",
    paymentHolder: "Christian Marcelo Adriano Montiel",
    paymentNote: "Transferí el total indicado y cargá el comprobante.",
    maxLocalFileBytes: 1500000
  };

  window.TRAMI_DIRECTS = [
    { serviceId: "antecedentes-penales", name: "Antecedentes Penales", image: "assets/antecedentes-penales-v3.webp" },
    { serviceId: "constancias-anses", name: "ANSES", image: "assets/anses-v3.webp" },
    { serviceId: "informe-vehicular", name: "Informe Vehicular", image: "assets/informe-vehicular-v3.webp" },
    { serviceId: "arba-inmobiliario", name: "ARBA / Inmobiliario", image: "assets/arba-inmobiliario-v3.webp" }
  ];

  window.TRAMI_FAMILIES = [
    {
      id: "arca-monotributo",
      name: "ARCA / Monotributo",
      description: "Alta de Monotributo, constancia de inscripción, consulta de deuda y gestión de VEP.",
      image: "assets/arca-v3.webp",
      serviceIds: ["arca-monotributo"]
    },
    {
      id: "partidas-pba",
      name: "Partidas",
      description: "Partidas de la Provincia de Buenos Aires y Ciudad de Buenos Aires.",
      image: "assets/partidas-familia-final.webp",
      serviceIds: ["partidas", "partidas-caba"]
    }
    ,{
      id: "asistencia-digital",
      name: "Asistencia Digital",
      description: "Asistencia online para generar o recuperar accesos de ANSES, ARCA y Mi Argentina.",
      image: "assets/asistencia-digital-v2.webp",
      serviceIds: ["asistencia-digital"]
    }
  ];

  window.TRAMI_SERVICES = [
    {
      id: "antecedentes-penales",
      codePrefix: "AP",
      name: "Antecedentes Penales",
      shortDescription: "Asistencia para solicitar el certificado y seguir el trámite.",
      description: "Completá los datos una sola vez. El Registro Nacional de Reincidencia envía el certificado directamente al correo del titular.",
      resultDelivery: "authority-direct",
      active: true,
      eligibility: { required: false },
      requirements: [
        "Ser mayor de 18 años.",
        "Tener DNI argentino vigente.",
        "Tener acceso al correo electrónico informado."
      ],
      components: [
        "Asistencia en la carga y seguimiento",
        "Validaciones personales a cargo del titular cuando las exija el organismo",
        "Envío directo del certificado al correo del titular"
      ],
      officialFee: 0,
      priceField: "modality",
      priceOptions: [
        { value: "one-hour", label: "1 hora", amount: 20000, duration: "Modalidad: 1 hora" },
        { value: "six-hours", label: "6 horas", amount: 15000, duration: "Modalidad: 6 horas" }
      ],
      fields: [
        { id: "adultEligibility", label: "Confirmo que soy mayor de 18 años.", type: "checkbox", required: true },
        { id: "argentineDniEligibility", label: "Confirmo que tengo DNI argentino vigente.", type: "checkbox", required: true },
        ...contactFields.slice(0, 1),
        { id: "birthDate", label: "Fecha de nacimiento", type: "date", required: true },
        { id: "dni", label: "DNI", type: "text", required: true, inputmode: "numeric" },
        { id: "cuil", label: "CUIL", type: "text", required: true, inputmode: "numeric", placeholder: "20-12345678-3" },
        { id: "dniTransaction", label: "Número de trámite del DNI", type: "text", required: false, inputmode: "numeric" },
        { id: "dniFile", label: "Frente del DNI (alternativa al N.º de trámite)", type: "file", required: false, accept: "image/*" },
        { id: "address", label: "Domicilio (calle y número)", type: "text", required: true, autocomplete: "street-address" },
        { id: "locality", label: "Localidad", type: "text", required: true, autocomplete: "address-level2" },
        { id: "district", label: "Partido / departamento", type: "text", required: false, placeholder: "Si corresponde" },
        { id: "fatherFullName", label: "Nombre y apellido del padre", type: "text", required: true },
        { id: "motherFullName", label: "Nombre y apellido de la madre", type: "text", required: true },
        { id: "email", label: "Correo electrónico", type: "email", required: true, autocomplete: "email" },
        { id: "emailConfirm", label: "Repetí el correo electrónico", type: "email", required: true, autocomplete: "off" },
        { id: "emailAccess", label: "Tengo acceso a este correo y puedo recibir allí los mensajes del organismo.", type: "checkbox", required: true },
        ...contactFields.slice(2),
        { id: "modality", label: "Modalidad", type: "select", required: true, options: [
          { value: "one-hour", label: "1 hora — $20.000" },
          { value: "six-hours", label: "6 horas — $15.000" }
        ] },
        authorizationField
      ],
      rules: { anyOf: ["dniTransaction", "dniFile"], message: "Ingresá el número de trámite del DNI o cargá una foto del frente." }
    },
    {
      id: "informe-vehicular",
      codePrefix: "IV",
      name: "Informe Vehicular",
      shortDescription: "Dominio, infracciones y deuda de patentes en una gestión.",
      description: "Ingresá el dominio y elegí Automotor o Moto. El paquete incluye informe de dominio, infracciones CABA/PBA y deuda de patentes CABA/PBA.",
      active: true,
      requirements: ["Tipo de vehículo.", "Dominio o patente.", "WhatsApp de contacto."],
      components: [
        "Informe de dominio oficial",
        "Inhibiciones y prendas, si existieran",
        "Infracciones de CABA y PBA",
        "Estado de deuda de patentes de CABA y PBA"
      ],
      officialFee: 0,
      priceField: "serviceOption",
      priceOptions: [{ value: "complete", label: "Informe completo", amount: 15000, duration: "Gestión online" }],
      fields: [
        { id: "vehicleType", label: "Tipo de vehículo", type: "choice", required: true, options: [
          { value: "automotor", label: "Automotor" },
          { value: "moto", label: "Moto" }
        ] },
        { id: "patent", label: "Dominio (patente)", type: "text", required: true, placeholder: "Ej.: AB 123 CD" },
        ...contactFields.slice(2),
        authorizationField
      ]
    },
    {
      id: "constancias-anses",
      codePrefix: "AN",
      name: "Constancias ANSES",
      shortDescription: "CODEM + Certificación Negativa en un solo pedido.",
      description: "Ingresá el CUIL y un WhatsApp de contacto. Recibirás CODEM y Certificación Negativa en PDF por WhatsApp.",
      resultDelivery: "whatsapp-pdf",
      active: true,
      requirements: ["CUIL del titular.", "WhatsApp de contacto."],
      components: ["CODEM", "Certificación Negativa por el período máximo disponible"],
      officialFee: 0,
      priceField: "serviceOption",
      priceOptions: [{ value: "constancias", label: "CODEM + Certificación Negativa", amount: 2000, duration: "Entrega en PDF por WhatsApp" }],
      fields: [
        { id: "cuil", label: "CUIL", type: "text", required: true, inputmode: "numeric", placeholder: "20-12345678-3" },
        ...contactFields.slice(2),
        authorizationField
      ]
    },
    {
      id: "arba-inmobiliario",
      codePrefix: "AI",
      name: "ARBA / Inmobiliario",
      shortDescription: "Estado de deuda inmobiliaria + plancheta catastral.",
      description: "Paquete de estado de deuda inmobiliaria y copia de plancheta catastral. La plancheta puede requerir acceso de titular o representación habilitada en ARBA.",
      active: true,
      requirements: ["Foto de una boleta o documento donde figure el inmueble, o Partido y número de Partida.", "WhatsApp de contacto."],
      components: ["Estado de deuda inmobiliaria", "Copia de plancheta catastral"],
      officialFee: 0,
      priceField: "serviceOption",
      priceOptions: [{ value: "debt-plan", label: "Deuda + plancheta", amount: 15000, duration: "Sujeto a disponibilidad de ARBA" }],
      fields: [
        { id: "propertyDocument", label: "Foto de boleta o documento del inmueble", type: "file", required: false, accept: "image/*,.pdf,application/pdf" },
        { id: "propertyDistrict", label: "Partido", type: "text", required: false },
        { id: "propertyNumber", label: "Partida", type: "text", required: false, inputmode: "numeric" },
        ...contactFields.slice(2),
        authorizationField
      ],
      rules: {
        oneOfGroups: [["propertyDocument"], ["propertyDistrict", "propertyNumber"]],
        message: "Subí una foto donde figure el inmueble o completá Partido y Partida."
      }
    },
    {
      id: "partidas",
      codePrefix: "PA",
      name: "Partidas PBA",
      shortDescription: "Nacimiento, matrimonio, unión convivencial o defunción de la Provincia de Buenos Aires.",
      description: "Elegí el tipo de partida y si contás con los datos. Después completá únicamente la información necesaria para tu caso.",
      resultDelivery: "whatsapp-pdf",
      active: true,
      requirements: [
        "La partida debe estar inscripta en la Provincia de Buenos Aires.",
        "La solicitud corresponde a una partida común."
      ],
      components: ["Nacimiento", "Matrimonio", "Unión convivencial", "Defunción"],
      officialFee: 0,
      priceField: "dataMode",
      priceOptions: [
        { value: "with-data", label: "Tengo los datos", amount: 15000, duration: "Hasta 10 días hábiles" },
        { value: "without-data", label: "No tengo los datos", amount: 20000, duration: "Hasta 20 días hábiles" }
      ],
      fields: [
        { id: "partType", label: "¿Qué partida necesitás?", type: "choice", required: true, options: [
          { value: "birth", label: "Nacimiento" },
          { value: "marriage", label: "Matrimonio" },
          { value: "cohabitation", label: "Unión convivencial" },
          { value: "death", label: "Defunción" }
        ] },
        { id: "dataMode", label: "¿Tenés los datos de la partida?", type: "select", required: true, options: [
          { value: "with-data", label: "Tengo los datos — $15.000" },
          { value: "without-data", label: "No tengo los datos — $20.000" }
        ] },

        { id: "recordHolderFullName", label: "Nombre y apellido del titular", type: "text", required: false },
        { id: "gender", label: "Sexo / género del titular", type: "select", required: false, options: [
          { value: "female", label: "Femenino" },
          { value: "male", label: "Masculino" },
          { value: "x", label: "X / no binario" }
        ] },

        { id: "documentType", label: "Tipo de documento", type: "select", required: false, options: [
          { value: "dni", label: "DNI" },
          { value: "lc", label: "Libreta Cívica" },
          { value: "le", label: "Libreta de Enrolamiento" }
        ] },
        { id: "documentNumber", label: "Número de documento", type: "text", required: false, inputmode: "numeric" },
        { id: "registrationYearExact", label: "Año de inscripción", type: "text", required: false, inputmode: "numeric", placeholder: "Ej.: 1985" },
        { id: "delegation", label: "Delegación donde fue inscripta", type: "text", required: false },
        { id: "actNumber", label: "Número de acta", type: "text", required: false, inputmode: "numeric" },

        { id: "registrationDistrict", label: "Partido donde fue inscripta", type: "text", required: false },
        { id: "registrationYearApprox", label: "Año exacto o aproximado", type: "text", required: false, placeholder: "Ej.: 1985 o 1984-1986" },
        { id: "bookNumber", label: "Número de tomo (si lo conocés)", type: "text", required: false },
        { id: "secondPersonName", label: "Nombre y apellido de la otra persona (opcional)", type: "text", required: false },
        { id: "parentOne", label: "Nombre y apellido de un progenitor (opcional)", type: "text", required: false },
        { id: "parentTwo", label: "Nombre y apellido del otro progenitor (opcional)", type: "text", required: false },
        { id: "previousAct", label: "Copia de una partida anterior (opcional)", type: "file", required: false, accept: "image/*,.pdf,application/pdf" },

        { id: "purpose", label: "¿Para qué trámite necesitás la partida?", type: "text", required: false },
        { id: "fullName", label: "Tu nombre y apellido", type: "text", required: false, autocomplete: "name" },
        { id: "whatsapp", label: "WhatsApp", type: "tel", required: false, placeholder: "Ej.: 11 1234-5678 (sin +54 9)", autocomplete: "tel" },
        {
          id: "partidasEligibility",
          label: "Confirmo que soy mayor de 18 años y que la partida es propia o tengo interés legítimo para solicitarla.",
          type: "checkbox",
          required: false
        },
        authorizationField
      ]
    },
    {
      id: "arca-monotributo",
      codePrefix: "AR",
      name: "ARCA / Monotributo",
      shortDescription: "Alta de Monotributo, constancia de inscripción, consulta de deuda y gestión de VEP.",
      description: "Servicio en preparación. Se definirán requisitos y precio por cada gestión antes de activarlo.",
      active: false,
      requirements: [],
      components: ["Alta de Monotributo", "Constancia de inscripción ARCA", "Consulta de deuda", "Generación o gestión de VEP"],
      officialFee: null,
      priceOptions: [],
      fields: []
    }
    ,{
      id: "partidas-caba",
      codePrefix: "PC",
      name: "Partidas CABA",
      shortDescription: "Partidas del Registro Civil de CABA.",
      description: "Servicio en preparación. Requisitos, precio y plazo todavía no publicados.",
      active: false,
      requirements: [],
      components: [],
      officialFee: null,
      priceField: "serviceOption",
      priceOptions: [],
      fields: []
    }

    ,{
      id: "asistencia-digital",
      codePrefix: "AD",
      name: "Asistencia Digital",
      shortDescription: "Generación o recuperación de accesos de ANSES, ARCA y Mi Argentina.",
      description: "Elegí el acceso y el tipo de ayuda. TramiPago te acompaña en la gestión remota. Las validaciones de identidad, códigos y claves las realiza siempre el titular.",
      active: true,
      requirements: ["Ser titular del acceso.", "Tener disponibles tus medios de contacto para realizar las validaciones que correspondan.", "No compartir contraseñas con TramiPago."],
      components: ["Asistencia online para ANSES, ARCA o Mi Argentina", "Generación o recuperación del acceso", "Reintegro del servicio si, agotadas las vías remotas, el organismo exige una instancia presencial"],
      officialFee: 0,
      priceField: "serviceOption",
      priceOptions: [{ value: "assistance", label: "Asistencia Digital", amount: 5000, duration: "Asistencia online" }],
      fields: [
        { id: "platform", label: "¿Con qué acceso necesitás ayuda?", type: "choice", required: true, options: [
          { value: "anses", label: "ANSES" },
          { value: "arca", label: "ARCA" },
          { value: "miargentina", label: "Mi Argentina" }
        ] },
        { id: "assistanceType", label: "¿Qué necesitás hacer?", type: "choice", required: true, options: [
          { value: "generate", label: "Generar acceso" },
          { value: "recover", label: "Recuperar acceso" }
        ] },
        ...contactFields,
        { id: "serviceFeeAcceptance", label: "Entiendo y acepto que el importe abonado corresponde al servicio de gestión, asistencia, acompañamiento y/o entrega, según corresponda, brindado por TramiPago.", type: "checkbox", required: true },
        authorizationField
      ]
    }

  ];

  /* Flujo progresivo y visual de Partidas */
  const PARTIDAS_REQUESTS_KEY = "tramipago_requests_v1";
  const PARTIDAS_ACTIVE_KEY = "tramipago_active_request_v1";

  const partidasIcons = {
    birth: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="17" r="7"></circle><path d="M14 37c1-8 5-12 10-12s9 4 10 12"></path><path d="M18 11c3-4 9-4 12 0"></path></svg>',
    marriage: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="19" cy="25" r="10"></circle><circle cx="29" cy="25" r="10"></circle></svg>',
    cohabitation: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 23 24 10l16 13"></path><path d="M13 21v17h22V21"></path><circle cx="20" cy="27" r="3"></circle><circle cx="28" cy="27" r="3"></circle><path d="M17 35c1-4 3-6 6-6M31 35c-1-4-3-6-6-6"></path></svg>',
    death: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="12" y="7" width="24" height="34" rx="3"></rect><path d="M18 16h12M18 22h12M18 28h8"></path><path d="M29 31c4 0 6 2 6 5-3 0-6-1-7-4-1 3-4 4-7 4 0-3 2-5 6-5"></path></svg>'
  };

  function getPartidasActiveRequest() {
    try {
      const ref = JSON.parse(sessionStorage.getItem(PARTIDAS_ACTIVE_KEY) || "null");
      if (!ref || ref.serviceId !== "partidas") return null;
      const requests = JSON.parse(localStorage.getItem(PARTIDAS_REQUESTS_KEY) || "[]");
      return requests.find((item) => item.id === ref.id || item.code === ref.code) || null;
    } catch (_) {
      return null;
    }
  }

  function injectPartidasStyles() {
    if (document.getElementById("partidas-dynamic-styles")) return;
    const style = document.createElement("style");
    style.id = "partidas-dynamic-styles";
    style.textContent = `
      #data-form .partidas-type-choice .choice-grid{
        grid-template-columns:repeat(4,minmax(0,1fr));
        gap:10px;
      }
      #data-form .partidas-type-choice .choice-option{
        min-height:92px;
        padding:12px 8px;
      }
      #data-form .partidas-type-choice .choice-option>span{
        display:flex;
        flex-direction:column;
        align-items:center;
        gap:7px;
        text-align:center;
      }
      #data-form .partidas-choice-icon{
        display:inline-flex;
        width:36px;
        height:36px;
        align-items:center;
        justify-content:center;
      }
      #data-form .partidas-choice-icon svg{
        width:34px;
        height:34px;
        fill:none;
        stroke:currentColor;
        stroke-width:2.4;
        stroke-linecap:round;
        stroke-linejoin:round;
      }
      #data-form .partidas-mode-note{
        margin:8px 0 2px;
        padding:10px 12px;
        border-radius:8px;
        background:#f6fafc;
        border:1px solid var(--ui-border,#0B3D66);
        font-size:.9rem;
        font-weight:700;
        line-height:1.35;
      }
      #data-form .field[hidden],#data-form .step-actions[hidden]{display:none!important;}
      @media(max-width:680px){
        #data-form .partidas-type-choice .choice-grid{grid-template-columns:repeat(2,minmax(0,1fr));}
      }
    `;
    document.head.appendChild(style);
  }

  function fieldControl(form, name) {
    const named = form.elements.namedItem(name);
    if (!named) return { nodes: [], wrapper: null };
    const nodes = named.length && !named.tagName ? Array.from(named) : [named];
    return { nodes, wrapper: nodes[0]?.closest(".field") || null };
  }

  function setPartidasField(form, name, visible, required) {
    const { nodes, wrapper } = fieldControl(form, name);
    if (!wrapper) return;
    wrapper.hidden = !visible;
    nodes.forEach((node) => {
      node.required = Boolean(visible && required);
      node.disabled = !visible;
    });
  }

  function setPartidasLabel(form, name, text, required) {
    const { nodes, wrapper } = fieldControl(form, name);
    if (!wrapper || !nodes.length) return;
    const label = wrapper.querySelector(`label[for="${name}"]`);
    if (label) label.textContent = `${text}${required ? " *" : ""}`;
  }

  function decoratePartType(form) {
    const { wrapper } = fieldControl(form, "partType");
    if (!wrapper) return;
    wrapper.classList.add("partidas-type-choice");
    wrapper.querySelectorAll('input[name="partType"]').forEach((input) => {
      const span = input.closest("label")?.querySelector("span");
      if (!span || span.querySelector(".partidas-choice-icon")) return;
      const icon = document.createElement("span");
      icon.className = "partidas-choice-icon";
      icon.innerHTML = partidasIcons[input.value] || "";
      span.prepend(icon);
    });
  }

  function clearAutomaticSelections(form) {
    if (form.dataset.partidasSelectionReady === "true") return;
    const active = getPartidasActiveRequest();
    if (!active) {
      form.querySelectorAll('input[name="partType"],input[name="dataMode"]').forEach((input) => {
        input.checked = false;
      });
    }
    form.dataset.partidasSelectionReady = "true";
  }

  function syncPartidasForm(form) {
    if (!form) return;
    injectPartidasStyles();
    decoratePartType(form);
    clearAutomaticSelections(form);

    const partType = form.querySelector('input[name="partType"]:checked')?.value || "";
    const dataMode = form.querySelector('input[name="dataMode"]:checked')?.value || "";
    const ready = Boolean(partType && dataMode);
    const withData = dataMode === "with-data";
    const withoutData = dataMode === "without-data";

    setPartidasField(form, "dataMode", Boolean(partType), Boolean(partType));

    [
      "recordHolderFullName", "gender", "purpose", "fullName",
      "whatsapp", "partidasEligibility", "authorization"
    ].forEach((name) => setPartidasField(form, name, ready, ready));

    setPartidasField(form, "documentType", withData, withData);
    setPartidasField(form, "documentNumber", withData, withData);
    setPartidasField(form, "registrationYearExact", withData, withData);
    setPartidasField(form, "delegation", withData, withData);
    setPartidasField(form, "actNumber", ready, withData);

    setPartidasField(form, "registrationDistrict", withoutData, withoutData);
    setPartidasField(form, "registrationYearApprox", withoutData, withoutData);
    setPartidasField(form, "bookNumber", withoutData, false);
    setPartidasField(form, "previousAct", withoutData, false);

    setPartidasField(form, "parentOne", withoutData && partType === "birth", false);
    setPartidasField(form, "parentTwo", withoutData && partType === "birth", false);
    setPartidasField(form, "secondPersonName", withoutData && ["marriage", "cohabitation"].includes(partType), false);

    const holderLabels = {
      birth: "Nombre y apellido de la persona nacida",
      marriage: "Nombre y apellido de uno de los cónyuges",
      cohabitation: "Nombre y apellido de una de las personas convivientes",
      death: "Nombre y apellido de la persona fallecida"
    };
    setPartidasLabel(form, "recordHolderFullName", holderLabels[partType] || "Nombre y apellido del titular", ready);

    const secondLabels = {
      marriage: "Nombre y apellido del otro cónyuge (opcional)",
      cohabitation: "Nombre y apellido de la otra persona conviviente (opcional)"
    };
    if (secondLabels[partType]) setPartidasLabel(form, "secondPersonName", secondLabels[partType], false);

    const noteAnchor = fieldControl(form, "dataMode").wrapper;
    let note = form.querySelector(".partidas-mode-note");
    if (dataMode && noteAnchor) {
      if (!note) {
        note = document.createElement("div");
        note.className = "partidas-mode-note";
        noteAnchor.insertAdjacentElement("afterend", note);
      }
      note.textContent = withData
        ? "Tengo los datos: $15.000 · plazo oficial hasta 10 días hábiles."
        : "No tengo los datos: $20.000 · plazo oficial hasta 20 días hábiles. La búsqueda puede resultar negativa.";
      note.hidden = false;
    } else if (note) {
      note.hidden = true;
    }

    const actions = form.querySelector(".step-actions");
    if (actions) actions.hidden = !ready;
  }

  function enhancePartidas() {
    if (location.hash !== "#/tramite/partidas") return;
    const form = document.getElementById("data-form");
    if (!form) return;
    if (form.dataset.partidasBound !== "true") {
      form.dataset.partidasBound = "true";
      form.addEventListener("change", () => syncPartidasForm(form));
    }
    syncPartidasForm(form);
  }



  document.addEventListener("click", function (event) {
    const tile = event.target.closest('[data-action="select-family"][data-family-id="asistencia-digital"]');
    if (!tile) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    location.hash = "#/tramite/asistencia-digital";
    window.scrollTo({ top: 0, behavior: "auto" });
  }, true);

  const partidasApp = document.getElementById("app");
  if (partidasApp) {
    let queued = false;
    new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        enhancePartidas();
      });
    }).observe(partidasApp, { childList: true, subtree: true });
  }
  window.addEventListener("hashchange", () => setTimeout(enhancePartidas, 0));
  setTimeout(enhancePartidas, 0);
})();