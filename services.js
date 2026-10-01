/* Configuración central de servicios */
(function () {
  const contactFields = [
    { id: "fullName", label: "Nombre y apellido", type: "text", required: true, autocomplete: "name" },
    { id: "email", label: "Correo electrónico", type: "email", required: true, placeholder: "Ej.: nombre@correo.com", autocomplete: "email" },
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
    contactEmail: "tramipago@gmail.com",
    alias: "tramipago",
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
      image: "assets/arca-familia-final.webp",
      serviceIds: ["arca-monotributo"]
    },
    {
      id: "partidas-pba",
      name: "Partidas",
      description: "Partidas de la Provincia de Buenos Aires y Ciudad Autónoma de Buenos Aires.",
      image: "assets/partidas-familia-final.webp",
      serviceIds: ["partidas", "partidas-caba"]
    }
    ,{
      id: "asistencia-digital",
      name: "Asistencia Digital",
      description: "Asistencia online para generar o recuperar accesos de ANSES, ARCA y Mi Argentina.",
      image: "assets/asistencia-digital-v3.webp",
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
        { id: "dni", label: "DNI", type: "text", required: true, inputmode: "numeric", placeholder: "Ej.: 12345678" },
        { id: "cuil", label: "CUIL", type: "text", required: true, inputmode: "numeric", placeholder: "20-12345678-6" },
        { id: "dniTransaction", label: "Número de trámite del DNI", type: "text", required: false, inputmode: "numeric", placeholder: "Ej.: 12345678901" },
        { id: "dniFile", label: "Frente del DNI (alternativa al N.º de trámite)", type: "file", required: false, accept: "image/*" },
        { id: "address", label: "Domicilio (calle y número)", type: "text", required: true, autocomplete: "street-address" },
        { id: "locality", label: "Localidad", type: "text", required: true, autocomplete: "address-level2" },
        { id: "district", label: "Partido o departamento", type: "text", required: false, placeholder: "Si corresponde" },
        { id: "fatherFullName", label: "Nombre y apellido del padre", type: "text", required: true },
        { id: "motherFullName", label: "Nombre y apellido de la madre", type: "text", required: true },
        { id: "email", label: "Correo electrónico", type: "email", required: true, autocomplete: "email" },
        { id: "emailConfirm", label: "Repetí el correo electrónico", type: "email", required: true, placeholder: "Ej.: nombre@correo.com", autocomplete: "off" },
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
      description: "Ingresá el dominio y elegí automotor o moto. El paquete incluye informe de dominio, infracciones CABA/PBA y deuda de patentes CABA/PBA.",
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
        { id: "cuil", label: "CUIL", type: "text", required: true, inputmode: "numeric", placeholder: "20-12345678-6" },
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
        { id: "propertyNumber", label: "Partida", type: "text", required: false, inputmode: "numeric", placeholder: "Ej.: 123456" },
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
        { id: "documentNumber", label: "Número de documento", type: "text", required: false, inputmode: "numeric", placeholder: "Ej.: 12345678" },
        { id: "registrationYearExact", label: "Año de inscripción", type: "text", required: false, inputmode: "numeric", placeholder: "Ej.: 1985" },
        { id: "delegation", label: "Delegación donde fue inscripta", type: "text", required: false },
        { id: "actNumber", label: "Número de acta", type: "text", required: false, inputmode: "numeric", placeholder: "Ej.: 1234" },

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
      shortDescription: "Nacimiento, matrimonio, unión civil/convivencial o defunción inscriptos en CABA.",
      description: "Completá los datos para preparar la gestión. CABA tramita nacimiento, matrimonio y defunción por TAD con miBA. La copia de Unión Civil/Convivencial se revisa por un canal específico antes de iniciar.",
      resultDelivery: "authority-platform",
      active: true,
      intakeOnly: true,
      officialInfoDate: "2026-09-09",
      requirements: [
        "La partida debe estar inscripta en la Ciudad Autónoma de Buenos Aires.",
        "Contar con usuario y clave miBA.",
        "Contar con una casilla de correo Gmail, Hotmail o Yahoo.",
        "Nacimiento y defunción: nombre y apellido completo del titular y fecha aproximada del acontecimiento.",
        "Matrimonio: nombre y apellido completo de ambos titulares."
      ],
      components: [
        "Solicitud regular: 15 días hábiles.",
        "Partida regular: trámite oficial gratuito cuando se conocen los datos registrales.",
        "Si faltan datos registrales, CABA informa un costo oficial adicional de $10.950.",
        "Solicitud urgente: 3 días hábiles; costo oficial $16.140 y exige todos los datos exactos.",
        "Unión Civil/Convivencial: la partida existe, pero su solicitud no figura en el trámite general de partidas; se revisa el canal oficial específico antes de iniciar."
      ],
      officialFee: null,
      priceOptions: [],
      fields: [
        { id: "partType", label: "¿Qué partida necesitás?", type: "choice", required: true, options: [
          { value: "birth", label: "Nacimiento" },
          { value: "marriage", label: "Matrimonio" },
          { value: "cohabitation", label: "Unión convivencial" },
          { value: "death", label: "Defunción" }
        ] },
        { id: "requestMode", label: "Modalidad / canal", type: "choice", required: true, options: [
          { value: "regular", label: "Regular — nacimiento, matrimonio o defunción" },
          { value: "urgent", label: "Urgente — nacimiento, matrimonio o defunción" },
          { value: "union-review", label: "Unión convivencial — revisión de canal oficial" }
        ] },
        { id: "adultEligibility", label: "Confirmo que soy mayor de 18 años.", type: "checkbox", required: true },
        { id: "mibaAccess", label: "Tengo usuario y clave miBA.", type: "checkbox", required: true },
        { id: "officialEmailProvider", label: "Tengo acceso a un correo Gmail, Hotmail o Yahoo para recibir comunicaciones del organismo.", type: "checkbox", required: true },
        { id: "recordHolderFullName", label: "Nombre y apellido del titular", type: "text", required: true },
        { id: "secondPersonName", label: "Nombre y apellido de la otra persona (matrimonio / unión convivencial)", type: "text", required: false },
        { id: "eventDate", label: "Fecha del acontecimiento", type: "text", required: false, placeholder: "Ej.: 15/08/1985 o agosto de 1985" },
        { id: "sectionCirc", label: "Circunscripción / Sección (si la conocés)", type: "text", required: false },
        { id: "bookNumber", label: "Tomo (si lo conocés)", type: "text", required: false },
        { id: "actNumber", label: "Acta (si la conocés)", type: "text", required: false },
        { id: "registrationYear", label: "Año de inscripción (si lo conocés)", type: "text", required: false, inputmode: "numeric", placeholder: "Ej.: 1985" },
        { id: "creditCardAvailable", label: "Si elegí urgente, cuento con tarjeta de crédito para abonar el costo oficial.", type: "checkbox", required: false },
        { id: "previousAct", label: "Copia de una partida anterior (opcional)", type: "file", required: false, accept: "image/*,.pdf,application/pdf" },
        { id: "purpose", label: "¿Para qué trámite necesitás la partida? (opcional)", type: "text", required: false },
        ...contactFields,
        authorizationField
      ]
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
    const preset = sessionStorage.getItem("tramipago_partidas_prefill_v1") || "";
    if (!active) {
      form.querySelectorAll('input[name="partType"]').forEach((input) => {
        input.checked = Boolean(preset && input.value === preset);
      });
      form.querySelectorAll('input[name="dataMode"]').forEach((input) => {
        input.checked = false;
      });
    }
    if (preset) sessionStorage.removeItem("tramipago_partidas_prefill_v1");
    form.dataset.partidasSelectionReady = "true";
  }

  function syncPartidasForm(form) {
    if (!form) return;
    injectPartidasStyles();
    decoratePartType(form);
    clearAutomaticSelections(form);

    const partType = form.querySelector('input[name="partType"]:checked')?.value
      || form.querySelector('input[type="hidden"][name="partType"]')?.value
      || "";
    const dataMode = form.querySelector('input[name="dataMode"]:checked')?.value
      || form.querySelector('select[name="dataMode"]')?.value
      || "";
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

/* Módulos de catálogo consolidados para reducir cargas HTTP. */
/* TramiPago · Familia ARCA y formularios específicos */
(function () {
  "use strict";

  const FREE_SERVICE_ACCEPTANCE = Object.freeze({
    id: "serviceFeeAcceptance",
    label: "Entiendo y acepto que el importe abonado corresponde al servicio prestado por TramiPago, que puede incluir gestión, asistencia, acompañamiento y, cuando corresponda, entrega.",
    type: "checkbox",
    required: true
  });

  const AUTHORIZATION = Object.freeze({
    id: "authorization",
    label: "Leí y acepto los Términos y Condiciones y la Política de Privacidad. Autorizo a TramiPago a utilizar mis datos y documentos únicamente para gestionar el trámite solicitado.",
    type: "checkbox",
    required: true
  });

  const COMMON = Object.freeze({
    fullName: { id: "fullName", label: "Nombre y apellido / razón social", type: "text", required: true, autocomplete: "name" },
    cuit: { id: "cuit", label: "CUIT", type: "text", required: true, inputmode: "numeric", placeholder: "20-12345678-6" },
    email: { id: "email", label: "Correo electrónico", type: "email", required: true, autocomplete: "email" },
    whatsapp: { id: "whatsapp", label: "WhatsApp", type: "tel", required: true, placeholder: "Ej.: 11 1234-5678 (sin +54 9)", autocomplete: "tel" }
  });

  const DELEGATION_NOTICE = "No ingreses tu clave fiscal. Si la gestión requiere acceso a un servicio de ARCA, TramiPago coordina la autorización o delegación correspondiente.";

  function commonFields() {
    return [
      { ...COMMON.fullName },
      { ...COMMON.cuit },
      { ...COMMON.email },
      { ...COMMON.whatsapp }
    ];
  }

  function serviceFeeOption(label, amount) {
    return [{ value: "gestion", label, amount, duration: "Gestión online" }];
  }

  const arcaServices = [
    {
      id: "arca-constancia",
      codePrefix: "AC",
      name: "Constancia ARCA",
      shortDescription: "Constancia y credenciales",
      description: "Indicá qué constancia necesitás. TramiPago realiza la gestión online y te entrega el documento correspondiente cuando aplique.",
      image: "assets/arca-constancia-v2.webp",
      active: true,
      officialFee: 0,
      requirements: ["CUIT del contribuyente.", DELEGATION_NOTICE],
      components: ["Constancia de inscripción / opción", "Constancia de CUIT", "Formulario 184", "Credencial de pago"],
      priceField: "serviceOption",
      priceOptions: serviceFeeOption("Gestión de Constancia ARCA", 5000),
      fields: [
        ...commonFields(),
        {
          id: "constanciaType",
          label: "¿Qué constancia necesitás?",
          type: "select",
          required: true,
          options: [
            { value: "inscripcion", label: "Constancia de inscripción / opción" },
            { value: "cuit", label: "Constancia de CUIT" },
            { value: "f184", label: "Formulario 184" },
            { value: "credencial", label: "Credencial de pago" }
          ]
        },
        AUTHORIZATION
      ]
    },
    {
      id: "arca-vep",
      codePrefix: "AV",
      name: "Generar VEP",
      shortDescription: "Volante electrónico de pago",
      description: "Completá los datos de la obligación. Si algún concepto no lo conocés, indicá lo que tengas y TramiPago revisará la información antes de generar el VEP.",
      image: "assets/arca-vep-v2.webp",
      active: true,
      officialFee: 0,
      requirements: ["CUIT del contribuyente.", "Datos de la obligación a cancelar.", DELEGATION_NOTICE],
      components: ["Impuesto u obligación", "Período", "Concepto y subconcepto", "Importe"],
      priceField: "serviceOption",
      priceOptions: serviceFeeOption("Generación de VEP", 5000),
      fields: [
        ...commonFields(),
        { id: "vepTax", label: "Impuesto / obligación", type: "text", required: true, placeholder: "Ej.: Monotributo, IVA, Ganancias" },
        { id: "vepPeriod", label: "Período", type: "text", required: true, placeholder: "Ej.: 2026-08" },
        { id: "vepConcept", label: "Concepto", type: "text", required: true },
        { id: "vepSubconcept", label: "Subconcepto", type: "text", required: true },
        { id: "vepAmount", label: "Importe", type: "text", required: false, inputmode: "numeric", placeholder: "Si lo conocés" },
        { id: "vepNotes", label: "Aclaración adicional (opcional)", type: "textarea", required: false },
        AUTHORIZATION
      ]
    },
    {
      id: "arca-ccma",
      codePrefix: "CC",
      name: "Informe de deuda y saldos CCMA",
      shortDescription: "Consulta de deuda e intereses",
      description: "Indicá el período que querés revisar y qué necesitás conocer. Podés adjuntar un comprobante si hay un pago puntual para verificar.",
      image: "assets/arca-ccma-v2.webp",
      active: true,
      officialFee: 0,
      requirements: ["CUIT del contribuyente.", "Período a consultar.", DELEGATION_NOTICE],
      components: ["Pagos registrados", "Deuda e intereses", "Saldos a favor"],
      priceField: "serviceOption",
      priceOptions: serviceFeeOption("Informe CCMA", 8000),
      fields: [
        ...commonFields(),
        { id: "ccmaFrom", label: "Período desde", type: "month", required: true },
        { id: "ccmaTo", label: "Período hasta", type: "month", required: true },
        {
          id: "ccmaScope",
          label: "¿Qué querés revisar?",
          type: "select",
          required: true,
          options: [
            { value: "todo", label: "Deuda, pagos, intereses y saldos" },
            { value: "deuda", label: "Deuda e intereses" },
            { value: "pagos", label: "Pagos registrados" },
            { value: "saldo", label: "Saldos a favor" }
          ]
        },
        { id: "ccmaReceipt", label: "Comprobante de pago (opcional)", type: "file", required: false, accept: "image/*,.pdf,application/pdf" },
        { id: "ccmaNotes", label: "Detalle de lo que querés verificar (opcional)", type: "textarea", required: false },
        AUTHORIZATION
      ]
    },
    {
      id: "arca-reimputacion",
      codePrefix: "RP",
      name: "Reimputación de pagos",
      shortDescription: "Corrección de pagos",
      description: "Indicá el pago o saldo de origen y la obligación a la que querés aplicarlo. TramiPago revisa la viabilidad antes de ejecutar la reimputación.",
      image: "assets/arca-reimputacion-v2.webp",
      active: true,
      officialFee: 0,
      requirements: ["CUIT del contribuyente.", "Datos del pago o saldo de origen.", "Destino de la reimputación.", DELEGATION_NOTICE],
      components: ["Identificación del saldo o pago", "Destino de la obligación", "Reimputación online cuando el sistema lo admite"],
      priceField: "serviceOption",
      priceOptions: serviceFeeOption("Reimputación de pagos", 10000),
      fields: [
        ...commonFields(),
        { id: "originPeriod", label: "Período / pago de origen", type: "text", required: true, placeholder: "Ej.: 2026-05" },
        { id: "originConcept", label: "Concepto donde figura el saldo o pago", type: "text", required: true },
        { id: "originAmount", label: "Importe de origen", type: "text", required: true, inputmode: "numeric", placeholder: "Ej.: 35000" },
        { id: "destinationPeriod", label: "Período de destino", type: "text", required: true, placeholder: "Ej.: 2026-06" },
        { id: "destinationConcept", label: "Concepto de destino", type: "text", required: true },
        { id: "destinationSubconcept", label: "Subconcepto de destino (si corresponde)", type: "text", required: false },
        { id: "reimputationReceipt", label: "Comprobante de pago (opcional)", type: "file", required: false, accept: "image/*,.pdf,application/pdf" },
        { id: "reimputationNotes", label: "Aclaración (opcional)", type: "textarea", required: false },
        AUTHORIZATION
      ]
    },
    {
      id: "arca-informe-reimputacion",
      codePrefix: "IR",
      name: "Informe + reimputación",
      shortDescription: "Análisis y corrección",
      description: "Primero se identifica la deuda o saldo correcto y luego se realiza la reimputación correspondiente si el sistema la permite.",
      image: "assets/arca-informe-reimputacion-v2.webp",
      active: true,
      officialFee: 0,
      requirements: ["CUIT del contribuyente.", "Período a revisar.", "Datos disponibles del pago o saldo.", DELEGATION_NOTICE],
      components: ["Informe de deuda/saldos CCMA", "Identificación del saldo", "Reimputación posterior"],
      priceField: "serviceOption",
      priceOptions: serviceFeeOption("Informe + reimputación", 15000),
      fields: [
        ...commonFields(),
        { id: "comboFrom", label: "Período desde", type: "month", required: true },
        { id: "comboTo", label: "Período hasta", type: "month", required: true },
        { id: "comboOriginPeriod", label: "Período/pago de origen (si lo conocés)", type: "text", required: false },
        { id: "comboOriginAmount", label: "Importe del saldo o pago (si lo conocés)", type: "text", required: false, inputmode: "numeric", placeholder: "Ej.: 35000" },
        { id: "comboDestinationPeriod", label: "Período al que querés aplicarlo (si lo conocés)", type: "text", required: false },
        { id: "comboDestinationConcept", label: "Concepto de destino (si lo conocés)", type: "text", required: false },
        { id: "comboReceipt", label: "Comprobante de pago (opcional)", type: "file", required: false, accept: "image/*,.pdf,application/pdf" },
        { id: "comboNotes", label: "¿Qué necesitás revisar o corregir?", type: "textarea", required: true },
        AUTHORIZATION
      ]
    },
    {
      id: "arca-alta-monotributo",
      codePrefix: "AM",
      name: "Alta en el Monotributo",
      shortDescription: "Inscripción online",
      description: "Completá los datos de la actividad. TramiPago revisa la información necesaria para el alta y la categoría aplicable antes de gestionar la adhesión.",
      image: "assets/arca-alta-monotributo-v2.webp",
      active: true,
      officialFee: 0,
      requirements: ["CUIT del contribuyente.", "Datos de la actividad y fecha de inicio.", "Parámetros de categorización cuando correspondan.", DELEGATION_NOTICE],
      components: ["Actividad y fecha de inicio", "Domicilio de actividad", "Parámetros de categoría", "Situación previsional y obra social cuando corresponda"],
      priceField: "serviceOption",
      priceOptions: serviceFeeOption("Alta en el Monotributo", 12000),
      fields: [
        ...commonFields(),
        {
          id: "activityType",
          label: "Tipo principal de actividad",
          type: "select",
          required: true,
          options: [
            { value: "services", label: "Locaciones / prestaciones de servicios" },
            { value: "goods", label: "Venta de cosas muebles" },
            { value: "other", label: "Otra actividad" }
          ]
        },
        { id: "activityDescription", label: "Actividad que vas a realizar", type: "text", required: true, placeholder: "Describila brevemente" },
        { id: "activityStart", label: "Fecha de inicio de actividad", type: "date", required: true },
        { id: "activityAddress", label: "Domicilio donde realizás la actividad", type: "text", required: true },
        { id: "estimatedIncome", label: "Ingresos brutos anuales estimados", type: "text", required: true, inputmode: "numeric", placeholder: "Ej.: 6000000" },
        { id: "surface", label: "Superficie afectada en m² (si corresponde)", type: "text", required: false, inputmode: "numeric", placeholder: "Ej.: 25" },
        { id: "energy", label: "Energía eléctrica anual en kWh (si corresponde)", type: "text", required: false, inputmode: "numeric", placeholder: "Ej.: 1200" },
        { id: "annualRent", label: "Alquileres anuales (si corresponde)", type: "text", required: false, inputmode: "numeric", placeholder: "Ej.: 2400000" },
        { id: "maxUnitPrice", label: "Precio unitario máximo de venta (si corresponde)", type: "text", required: false, inputmode: "numeric", placeholder: "Ej.: 150000" },
        {
          id: "pensionSituation",
          label: "Situación previsional",
          type: "select",
          required: true,
          options: [
            { value: "employee", label: "Trabajo en relación de dependencia" },
            { value: "retired", label: "Jubilado/a" },
            { value: "monotax-only", label: "Aportes por Monotributo" },
            { value: "other", label: "Otra situación" }
          ]
        },
        { id: "socialWork", label: "Obra social (si corresponde)", type: "text", required: false },
        AUTHORIZATION
      ]
    },
    {
      id: "arca-baja-monotributo",
      codePrefix: "BM",
      name: "Baja en el Monotributo",
      shortDescription: "Cese de actividad",
      description: "Indicá el motivo y el mes desde el que dejás de realizar la actividad. No se exige libre deuda general; el mes en que se solicita la baja debe quedar pago para evitar generar deuda.",
      image: "assets/arca-baja-monotributo-v2.webp",
      active: true,
      officialFee: 0,
      requirements: ["CUIT del contribuyente.", "Motivo de la baja.", "Mes desde el que deja de realizarse la actividad.", DELEGATION_NOTICE],
      components: ["Revisión del motivo", "Baja en Portal Monotributo", "Control del período de baja"],
      priceField: "serviceOption",
      priceOptions: serviceFeeOption("Baja en el Monotributo", 8000),
      fields: [
        ...commonFields(),
        {
          id: "bajaReason",
          label: "Motivo de la baja",
          type: "select",
          required: true,
          options: [
            { value: "cese", label: "Cese de actividades" },
            { value: "renuncia", label: "Renuncia al régimen" },
            { value: "exclusion", label: "Exclusión" },
            { value: "other", label: "Otro motivo" }
          ]
        },
        { id: "bajaMonth", label: "Mes desde el que dejás la actividad", type: "month", required: true },
        {
          id: "bajaMonthPaid",
          label: "¿El mes en que solicitás la baja está pago?",
          type: "select",
          required: true,
          options: [
            { value: "yes", label: "Sí" },
            { value: "no", label: "No / no estoy seguro" }
          ]
        },
        { id: "bajaNotes", label: "Aclaración (opcional)", type: "textarea", required: false },
        AUTHORIZATION
      ]
    },
    {
      id: "arca-recategorizacion",
      codePrefix: "RC",
      name: "Recategorización",
      shortDescription: "Cambio de categoría",
      description: "Completá los parámetros de los últimos 12 meses. TramiPago revisa si corresponde mantener o modificar la categoría y gestiona la recategorización cuando aplica.",
      image: "assets/arca-recategorizacion-v2.webp",
      active: true,
      officialFee: 0,
      requirements: ["CUIT del contribuyente.", "Actividad con antigüedad suficiente para recategorizar.", "Parámetros de los últimos 12 meses.", DELEGATION_NOTICE],
      components: ["Ingresos brutos", "Superficie y energía cuando correspondan", "Alquileres", "Precio unitario máximo cuando corresponda"],
      priceField: "serviceOption",
      priceOptions: serviceFeeOption("Recategorización", 12000),
      fields: [
        ...commonFields(),
        { id: "activityStartDate", label: "Fecha de inicio de actividad", type: "date", required: true },
        { id: "currentCategory", label: "Categoría actual (si la conocés)", type: "text", required: false, placeholder: "Ej.: A, B, C..." },
        { id: "income12Months", label: "Ingresos brutos de los últimos 12 meses", type: "text", required: true, inputmode: "numeric", placeholder: "Ej.: 6000000" },
        { id: "recatSurface", label: "Superficie afectada en m² (si corresponde)", type: "text", required: false, inputmode: "numeric", placeholder: "Ej.: 25" },
        { id: "recatEnergy", label: "Energía eléctrica de los últimos 12 meses en kWh (si corresponde)", type: "text", required: false, inputmode: "numeric", placeholder: "Ej.: 1200" },
        { id: "recatRent", label: "Alquileres devengados en los últimos 12 meses (si corresponde)", type: "text", required: false, inputmode: "numeric", placeholder: "Ej.: 2400000" },
        { id: "recatMaxUnitPrice", label: "Precio unitario máximo de venta (si corresponde)", type: "text", required: false, inputmode: "numeric", placeholder: "Ej.: 150000" },
        AUTHORIZATION
      ]
    },
    {
      id: "arca-dfe",
      codePrefix: "DF",
      name: "Domicilio Fiscal Electrónico",
      shortDescription: "Activación y adhesión",
      description: "El Domicilio Fiscal Electrónico es distinto del domicilio fiscal físico. Para constituirlo o actualizarlo se utilizan un correo electrónico y un teléfono celular.",
      image: "assets/arca-dfe-v2.webp",
      active: true,
      officialFee: 0,
      requirements: ["Correo electrónico.", "Teléfono celular.", DELEGATION_NOTICE],
      components: ["Constitución del DFE", "Actualización de correo y celular", "Canal oficial de notificaciones"],
      priceField: "serviceOption",
      priceOptions: serviceFeeOption("Domicilio Fiscal Electrónico", 7000),
      fields: [
        ...commonFields(),
        {
          id: "dfeAction",
          label: "¿Qué necesitás hacer?",
          type: "select",
          required: true,
          options: [
            { value: "constitute", label: "Constituir el Domicilio Fiscal Electrónico" },
            { value: "update", label: "Actualizar correo y/o celular" }
          ]
        },
        AUTHORIZATION
      ]
    },
    {
      id: "arca-actualizacion",
      codePrefix: "AA",
      name: "Actualización de datos ARCA",
      shortDescription: "Modificación de datos fiscales",
      description: "Indicá qué dato necesitás modificar, el dato actual y el dato nuevo. La documentación respaldatoria depende del tipo de modificación.",
      image: "assets/arca-actualizacion-v2.webp",
      active: true,
      officialFee: 0,
      requirements: ["CUIT del contribuyente.", "Detalle del dato a modificar.", "Documentación respaldatoria cuando corresponda.", DELEGATION_NOTICE],
      components: ["Datos registrales", "Datos de actividad", "Domicilios de actividad", "Presentación Digital cuando corresponda"],
      priceField: "serviceOption",
      priceOptions: serviceFeeOption("Actualización de datos ARCA", 10000),
      fields: [
        ...commonFields(),
        {
          id: "dataKind",
          label: "Tipo de dato que querés modificar",
          type: "select",
          required: true,
          options: [
            { value: "registral", label: "Dato registral personal / razón social" },
            { value: "activity", label: "Actividad económica" },
            { value: "activity-address", label: "Domicilio de actividad" },
            { value: "other", label: "Otro dato" }
          ]
        },
        { id: "currentData", label: "Dato actual", type: "text", required: true },
        { id: "newData", label: "Dato nuevo", type: "text", required: true },
        { id: "updateReason", label: "Motivo de la modificación", type: "textarea", required: true },
        { id: "supportingDocument", label: "Documentación respaldatoria (si corresponde)", type: "file", required: false, accept: "image/*,.pdf,application/pdf" },
        AUTHORIZATION
      ]
    }
  ];

  const arcaFamily = {
    id: "arca-monotributo",
    name: "ARCA",
    description: "Monotributo, VEP, constancias y actualización de datos.",
    image: "assets/arca-familia-final.webp",
    serviceIds: [
      "arca-constancia",
      "arca-vep",
      "arca-ccma",
      "arca-reimputacion",
      "arca-informe-reimputacion",
      "arca-alta-monotributo",
      "arca-baja-monotributo",
      "arca-recategorizacion",
      "arca-dfe",
      "arca-actualizacion"
    ]
  };

  const families = Array.isArray(window.TRAMI_FAMILIES) ? window.TRAMI_FAMILIES : [];
  const familyIndex = families.findIndex((item) => item.id === arcaFamily.id);
  if (familyIndex >= 0) families[familyIndex] = arcaFamily;
  else families.push(arcaFamily);
  window.TRAMI_FAMILIES = families;

  const currentServices = (Array.isArray(window.TRAMI_SERVICES) ? window.TRAMI_SERVICES : [])
    .filter((service) => service.id !== "arca-monotributo" && !arcaServices.some((arca) => arca.id === service.id));

  const FREE_OFFICIAL_SERVICE_IDS = new Set([
    "constancias-anses",
    ...arcaServices.map((service) => service.id)
  ]);

  window.TRAMI_SERVICES = currentServices.concat(arcaServices).map((service) => {
    if (!FREE_OFFICIAL_SERVICE_IDS.has(service.id) || !Array.isArray(service.fields)) return service;
    if (service.fields.some((field) => field.id === FREE_SERVICE_ACCEPTANCE.id)) return service;

    const fields = service.fields.map((field) => ({ ...field }));
    const authorizationIndex = fields.findIndex((field) => field.id === "authorization");
    fields.splice(authorizationIndex >= 0 ? authorizationIndex : fields.length, 0, { ...FREE_SERVICE_ACCEPTANCE });
    return { ...service, fields, officialFree: true };
  });

  function injectArcaStyles() {
    if (!document?.head) return;
    if (document.getElementById("tramipago-arca-family-styles")) return;
    const style = document.createElement("style");
    style.id = "tramipago-arca-family-styles";
    style.textContent = `
      .arca-family-page .family-shell{max-width:980px!important}
      .arca-family-page .family-heading{margin-bottom:22px!important}
      .arca-family-page .family-heading img{width:118px!important;height:92px!important;object-fit:cover!important}
      .arca-family-page .family-service-grid{display:block!important}
      .arca-family-page .arca-service-group{margin:0 0 28px!important}
      .arca-family-page .arca-service-group-title{margin:0 0 12px!important;color:#082A47!important;font-size:.96rem!important;font-weight:700!important;text-align:left!important}
      .arca-family-page .arca-service-row{display:grid!important;grid-template-columns:repeat(5,154px)!important;gap:16px!important;justify-content:center!important;align-items:stretch!important}
      .arca-family-page .family-service-card{position:relative!important;display:flex!important;flex-direction:column!important;width:154px!important;min-width:154px!important;padding:0!important;overflow:hidden!important;border:0!important;border-radius:10px!important;background:#082f4f!important;box-shadow:0 7px 18px rgba(8,47,79,.16)!important;transition:transform .16s ease,box-shadow .16s ease!important}
      .arca-family-page .family-service-card:hover{transform:translateY(-2px)!important;box-shadow:0 10px 22px rgba(8,47,79,.22)!important}
      .arca-family-page .arca-service-thumb{display:block!important;width:154px!important;height:123px!important;aspect-ratio:auto!important;object-fit:cover!important;object-position:center!important;border:0!important;background:#eaf2f7!important}
      .arca-family-page .family-service-card>div{display:flex!important;flex:1 1 auto!important;flex-direction:column!important;min-width:0!important;min-height:76px!important;padding:10px 10px 11px!important;background:#082f4f!important}
      .arca-family-page .family-service-card .service-tag,.arca-family-page .service-card-mini,.arca-family-page .family-unavailable{display:none!important}
      .arca-family-page .family-service-card h2{margin:0 0 4px!important;color:#fff!important;font-size:.79rem!important;line-height:1.16!important;font-weight:650!important;text-align:left!important}
      .arca-family-page .family-service-card p{margin:0!important;color:#11b9f4!important;font-size:.69rem!important;line-height:1.25!important;font-weight:600!important;text-align:left!important}
      .arca-family-page .family-service-card>.button{position:absolute!important;inset:0!important;z-index:5!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;opacity:0!important;cursor:pointer!important}
      @media(max-width:900px){.arca-family-page .arca-service-row{grid-template-columns:repeat(3,154px)!important}}
      @media(max-width:560px){.arca-family-page .arca-service-row{grid-template-columns:repeat(2,154px)!important;gap:12px!important}}
      @media(max-width:350px){.arca-family-page .arca-service-row{grid-template-columns:154px!important}}
`;
    document.head.appendChild(style);
  }

  function hideZeroOfficialFee() {
    document.querySelectorAll(".service-summary-row").forEach((row) => {
      const label = row.querySelector("span")?.textContent?.trim().toLowerCase() || "";
      if (label !== "costo oficial") return;
      const value = row.querySelector("strong")?.textContent || "";
      const digits = value.replace(/\D/g, "");
      if (!digits || Number(digits) === 0) row.remove();
    });
  }

  function enhanceArcaFamily() {
    const page = document.querySelector(".family-page");
    if (!page) {
      hideZeroOfficialFee();
      return;
    }
    const heading = page.querySelector(".family-heading h1")?.textContent?.trim();
    if (heading !== "ARCA") {
      hideZeroOfficialFee();
      return;
    }

    page.classList.add("arca-family-page");
    const grid = page.querySelector(".family-service-grid");
    if (!grid) return;

    let cards = Array.from(grid.querySelectorAll(".family-service-card"));
    const family = window.TRAMI_FAMILIES.find((item) => item.id === "arca-monotributo");
    const ids = family?.serviceIds || [];

    cards.forEach((card, index) => {
      if (card.dataset.arcaReady === "true") return;
      const service = window.TRAMI_SERVICES.find((item) => item.id === ids[index]);
      if (!service) return;
      card.dataset.arcaReady = "true";
      card.dataset.serviceId = service.id;

      const image = document.createElement("img");
      image.className = "arca-service-thumb";
      image.src = service.image;
      image.alt = service.name;
      image.loading = "lazy";
      card.insertBefore(image, card.firstChild);
    });

    if (grid.dataset.arcaGrouped !== "true") {
      cards = Array.from(grid.querySelectorAll(".family-service-card"));
      const groups = [
        { title: "Pagos y cuenta corriente", cards: cards.slice(0, 5) },
        { title: "Monotributo y datos registrales", cards: cards.slice(5, 10) }
      ];
      grid.replaceChildren();
      groups.forEach((group) => {
        const section = document.createElement("section");
        section.className = "arca-service-group";
        const title = document.createElement("h2");
        title.className = "arca-service-group-title";
        title.textContent = group.title;
        const row = document.createElement("div");
        row.className = "arca-service-row";
        group.cards.forEach((card) => row.appendChild(card));
        section.append(title, row);
        grid.appendChild(section);
      });
      grid.dataset.arcaGrouped = "true";
    }

    hideZeroOfficialFee();
  }

  function scheduleArcaEnhancement() {
    setTimeout(enhanceArcaFamily, 0);
  }

  injectArcaStyles();
  window.addEventListener("hashchange", scheduleArcaEnhancement);
  window.addEventListener("load", scheduleArcaEnhancement);
  document.addEventListener("DOMContentLoaded", scheduleArcaEnhancement);
  scheduleArcaEnhancement();
})();

/* Familias adicionales de TramiPago: servicios confirmados y consultas profesionales. */
(function(){
  "use strict";

  const contactFields=[
    {id:"fullName",label:"Nombre y apellido",type:"text",required:true,autocomplete:"name"},
    {id:"email",label:"Correo electrónico",type:"email",required:false,placeholder:"Ej.: nombre@correo.com",autocomplete:"email"},
    {id:"whatsapp",label:"WhatsApp",type:"tel",required:true,placeholder:"Ej.: 11 1234-5678 (sin +54 9)",autocomplete:"tel"}
  ];

  const authorizationField={
    id:"authorization",
    label:"Leí y acepto los Términos y Condiciones y la Política de Privacidad. Autorizo a TramiPago a utilizar mis datos y documentos únicamente para gestionar esta solicitud.",
    type:"checkbox",
    required:true
  };

  const legalReferralAuthorization={
    id:"authorization",
    label:"Autorizo a TramiPago a utilizar estos datos para coordinar y derivar mi consulta al profesional abogado que corresponda.",
    type:"checkbox",
    required:true
  };

  const services=[
    {
      id:"apostilla-tad",
      codePrefix:"AT",
      name:"Apostillado",
      shortDescription:"Gestión de Apostilla por TAD para documentos públicos argentinos.",
      description:"Cargá el documento y los datos básicos. TramiPago revisa la documentación, prepara la gestión por TAD y realiza el seguimiento del expediente.",
      active:true,
      officialFee:null,
      officialFeeExternal:true,
      priceField:"serviceOption",
      priceOptions:[{value:"gestion",label:"Gestión de Apostillado",amount:20000,duration:"Gestión online"}],
      resultDelivery:"authority-platform",
      requirements:[
        "Documento público argentino en condiciones de ser apostillado.",
        "Datos del documento y país donde se presentará, si corresponde.",
        "TramiPago verifica previamente que la documentación sea apta para iniciar la gestión.",
        "Arancel oficial TAD de apostilla: $4.500 por documento, abonado aparte por VEP al organismo. El precio de TramiPago no incluye ese arancel."
      ],
      components:[
        "Revisión previa del documento",
        "Preparación e inicio de la gestión por TAD",
        "Seguimiento de observaciones o subsanaciones",
        "Entrega o seguimiento del resultado del expediente"
      ],
      fields:[
        {id:"documentType",label:"Tipo de documento",type:"select",required:true,options:[
          {value:"civil",label:"Partida / documento de estado civil"},
          {value:"education",label:"Título, analítico o certificado de estudios"},
          {value:"notarial",label:"Documento notarial"},
          {value:"judicial",label:"Documento judicial"},
          {value:"license",label:"Certificado de legalidad de licencia de conducir"},
          {value:"other",label:"Otro documento público argentino"}
        ]},
        {id:"destinationCountry",label:"País donde se presentará",type:"text",required:false},
        {id:"documentFile",label:"Documento a revisar (PDF)",type:"file",required:true,accept:"application/pdf,.pdf"},
        {id:"notes",label:"Aclaración (opcional)",type:"textarea",required:false},
        ...contactFields,
        authorizationField
      ]
    },
    {
      id:"legalizaciones",
      codePrefix:"LG",
      name:"Legalizaciones",
      shortDescription:"Legalización de partidas, títulos, certificados y otros documentos públicos.",
      description:"Elegí qué documento necesitás legalizar. TramiPago revisa los requisitos, prepara la gestión online y realiza el seguimiento correspondiente.",
      active:true,
      officialFee:null,
      officialFeeExternal:true,
      priceField:"serviceOption",
      priceOptions:[{value:"gestion",label:"Gestión de Legalización",amount:15000,duration:"Gestión online"}],
      resultDelivery:"authority-platform",
      requirements:[
        "Documento completo y legible.",
        "Datos del organismo o autoridad que emitió el documento.",
        "La vía exacta se determina según el tipo de documento y la legalización requerida.",
        "Si corresponde legalización internacional por TAD, el arancel oficial general es $4.500; solo para partidas de estado civil es $1.500. Otras vías pueden tener costos distintos o ser gratuitas. Se paga aparte, según organismo."
      ],
      components:[
        "Legalización de partidas cuando corresponda",
        "Legalización de títulos y certificados cuando corresponda",
        "Legalización de documentos públicos",
        "Revisión, presentación y seguimiento"
      ],
      fields:[
        {id:"legalizationType",label:"¿Qué necesitás legalizar?",type:"select",required:true,options:[
          {value:"civil-international",label:"Partida / documento de estado civil"},
          {value:"education",label:"Título, analítico o certificado"},
          {value:"public-document",label:"Otro documento público"},
          {value:"other",label:"No estoy seguro / otro"}
        ]},
        {id:"documentType",label:"Tipo de documento",type:"text",required:true,placeholder:"Ej.: partida de nacimiento, título secundario, certificado"},
        {id:"issuingAuthority",label:"Organismo o entidad que lo emitió",type:"text",required:false},
        {id:"originProvince",label:"Provincia de origen",type:"text",required:false},
        {id:"destinationCountry",label:"País donde se presentará (si corresponde)",type:"text",required:false},
        {id:"documentFile",label:"Documento a revisar (PDF)",type:"file",required:true,accept:"application/pdf,.pdf"},
        {id:"notes",label:"Aclaración (opcional)",type:"textarea",required:false},
        ...contactFields,
        authorizationField
      ]
    },
    {
      id:"abogado-art",
      codePrefix:"AA",
      name:"Reclamo ART / accidente laboral",
      shortDescription:"Consulta por accidente de trabajo, accidente in itinere, enfermedad profesional o reclamo ante ART.",
      description:"Dejá los datos básicos del caso. TramiPago coordina la consulta con un abogado; el análisis jurídico y cualquier actuación profesional quedan a cargo del abogado interviniente.",
      active:true,
      intakeOnly:true,
      officialFee:null,
      requirements:["Datos básicos del hecho.","WhatsApp de contacto."],
      components:["Accidente de trabajo","Accidente in itinere","Enfermedad profesional","Reclamo o diferencia con la ART"],
      fields:[
        {id:"caseType",label:"Motivo de la consulta",type:"select",required:true,options:[
          {value:"work-accident",label:"Accidente de trabajo"},
          {value:"itinere",label:"Accidente in itinere"},
          {value:"occupational-disease",label:"Enfermedad profesional"},
          {value:"art-claim",label:"Reclamo o problema con la ART"},
          {value:"other",label:"Otro relacionado con ART"}
        ]},
        {id:"eventDate",label:"Fecha aproximada del hecho (opcional)",type:"date",required:false},
        {id:"notes",label:"Contanos brevemente qué pasó",type:"textarea",required:true},
        ...contactFields,
        legalReferralAuthorization
      ]
    },
    {
      id:"abogado-accidentes",
      codePrefix:"AX",
      name:"Accidentes",
      shortDescription:"Consulta jurídica por accidentes que no sean laborales.",
      description:"Dejá los datos básicos del accidente. TramiPago coordina la consulta con un abogado para evaluar el caso y los pasos posibles.",
      active:true,
      intakeOnly:true,
      officialFee:null,
      requirements:["Descripción del accidente.","WhatsApp de contacto."],
      components:["Accidentes de tránsito","Daños y lesiones derivados de un accidente","Otros accidentes no laborales"],
      fields:[
        {id:"caseType",label:"Tipo de accidente",type:"select",required:true,options:[
          {value:"traffic",label:"Accidente de tránsito"},
          {value:"other",label:"Otro accidente no laboral"}
        ]},
        {id:"eventDate",label:"Fecha aproximada del accidente",type:"date",required:false},
        {id:"notes",label:"Contanos brevemente qué pasó",type:"textarea",required:true},
        ...contactFields,
        legalReferralAuthorization
      ]
    },
    {
      id:"abogado-sucesiones",
      codePrefix:"AS",
      name:"Sucesiones",
      shortDescription:"Consulta con abogado por inicio, seguimiento o dudas de una sucesión.",
      description:"Dejá la información básica. TramiPago coordina la consulta con un abogado para evaluar documentación, jurisdicción y próximos pasos.",
      active:true,
      intakeOnly:true,
      officialFee:null,
      requirements:["Información básica de la sucesión.","WhatsApp de contacto."],
      components:["Inicio de sucesión","Sucesión ya iniciada","Herederos y documentación","Bienes inmuebles, vehículos u otros bienes"],
      fields:[
        {id:"province",label:"Provincia donde se tramitaría o tramita",type:"text",required:true},
        {id:"caseState",label:"Situación",type:"select",required:true,options:[
          {value:"new",label:"Quiero iniciar una sucesión"},
          {value:"started",label:"La sucesión ya está iniciada"},
          {value:"question",label:"Tengo una consulta antes de iniciarla"}
        ]},
        {id:"notes",label:"Contanos brevemente qué necesitás",type:"textarea",required:true},
        ...contactFields,
        legalReferralAuthorization
      ]
    },
    {
      id:"abogado-laboral",
      codePrefix:"AL",
      name:"Consulta laboral",
      shortDescription:"Consulta por despido, diferencias salariales, trabajo no registrado, telegramas u otra cuestión laboral.",
      description:"Completá el formulario con el problema laboral. TramiPago coordina la consulta con un abogado laboral; el asesoramiento jurídico queda a cargo del profesional interviniente.",
      active:true,
      intakeOnly:true,
      officialFee:null,
      requirements:["Descripción breve del problema laboral.","WhatsApp de contacto."],
      components:["Despido","Diferencias salariales o pagos pendientes","Trabajo no registrado","Telegramas y comunicaciones laborales","Otra consulta laboral"],
      fields:[
        {id:"caseType",label:"Motivo de la consulta",type:"select",required:true,options:[
          {value:"dismissal",label:"Despido"},
          {value:"salary",label:"Diferencias salariales / pagos pendientes"},
          {value:"unregistered",label:"Trabajo no registrado"},
          {value:"telegram",label:"Telegrama / comunicación laboral"},
          {value:"other",label:"Otra consulta laboral"}
        ]},
        {id:"notes",label:"Contanos brevemente qué necesitás consultar",type:"textarea",required:true},
        ...contactFields,
        legalReferralAuthorization
      ]
    }
  ];

  const families=[
    {
      id:"legalizaciones-apostillas",
      name:"Legalizaciones y Apostillas",
      description:"Elegí si necesitás legalizar o apostillar tu documento.",
      image:"assets/partidas-familia-final.webp",
      serviceIds:["legalizaciones","apostilla-tad"]
    },
    {
      id:"atencion-abogado",
      name:"Consulta con un abogado",
      description:"Reclamos ART, accidentes, sucesiones y consultas laborales.",
      image:"assets/promo-art-20260911.webp",
      serviceIds:["abogado-art","abogado-accidentes","abogado-sucesiones","abogado-laboral"]
    }
  ];

  const replacedIds=new Set([
    "apostilla-tad","legalizaciones","legalizacion-internacional-partidas","legalizacion-mininterior",
    "abogado-art","abogado-accidentes","abogado-sucesiones","abogado-laboral"
  ]);
  const currentServices=Array.isArray(window.TRAMI_SERVICES)?window.TRAMI_SERVICES:[];
  window.TRAMI_SERVICES=currentServices.filter(item=>!replacedIds.has(item.id)).concat(services);

  // Normalización de ayuda visible: todo campo de correo debe mostrar un ejemplo.
  for(const service of window.TRAMI_SERVICES){
    service.fields=(service.fields||[]).map(field=>
      field?.type==="email"&&!String(field.placeholder||"").trim()
        ? {...field,placeholder:"Ej.: nombre@correo.com"}
        : field
    );
  }

  const currentFamilies=Array.isArray(window.TRAMI_FAMILIES)?window.TRAMI_FAMILIES:[];
  const familyIds=new Set(families.map(item=>item.id));
  window.TRAMI_FAMILIES=currentFamilies.filter(item=>!familyIds.has(item.id)).concat(families);
})();
