/* Configuración central de servicios */
(function () {
  const contactFields = [
    { id: "fullName", label: "Nombre y apellido", type: "text", required: true, autocomplete: "name" },
    { id: "email", label: "Correo electrónico", type: "email", required: true, autocomplete: "email" },
    { id: "whatsapp", label: "WhatsApp", type: "tel", required: true, placeholder: "Ej.: 11 6708-3232 (sin +54 9)", autocomplete: "tel" }
  ];

  const authorizationField = {
    id: "authorization",
    label: "Leí y acepto los Términos y Condiciones y la Política de Privacidad. Autorizo a TramiPago a utilizar mis datos y documentos únicamente para gestionar el trámite solicitado.",
    type: "checkbox",
    required: true
  };

  window.TRAMI_CONFIG = {
    whatsappNumber: "5491167083232",
    alias: "MODO PRUEBA",
    paymentCvu: "",
    paymentHolder: "No realizar pagos",
    paymentQr: "assets/qr-modo-prueba.svg",
    paymentNote: "Versión de prueba: no realices transferencias.",
    demoMode: true,
    maxLocalFileBytes: 1500000
  };

  window.TRAMI_DIRECTS = [
    { serviceId: "antecedentes-penales", name: "Antecedentes Penales", image: "assets/antecedentes-penales-v3.webp" },
    { serviceId: "constancias-anses", name: "ANSES", image: "assets/anses-v3.webp" },
    { serviceId: "informe-vehicular", name: "Informe vehicular", image: "assets/informe-vehicular-v3.webp" },
    { serviceId: "arba-inmobiliario", name: "ARBA / Inmobiliario", image: "assets/arba-inmobiliario-v3.webp" }
  ];

  window.TRAMI_FAMILIES = [
    {
      id: "arca-monotributo",
      name: "ARCA / Monotributo",
      description: "Gestiones vinculadas con inscripción, constancias y monotributo.",
      image: "assets/arca-v3.webp",
      serviceIds: ["arca-monotributo"]
    },
    {
      id: "partidas-turnos",
      name: "Partidas y Turnos",
      description: "Solicitudes de partidas y gestión de turnos de licencia.",
      image: "assets/partidas-turnos-v3.webp",
      serviceIds: ["partidas", "turnos-licencia"]
    }
  ];

  window.TRAMI_SERVICES = [
    {
      id: "antecedentes-penales",
      codePrefix: "AP",
      name: "Antecedentes Penales",
      shortDescription: "Asistencia para solicitar el certificado y seguir el trámite.",
      description: "Te asistimos durante la solicitud. Las validaciones personales las realiza el titular y el Registro Nacional de Reincidencia envía el certificado directamente a su correo.",
      resultDelivery: "authority-direct",
      active: true,
      eligibility: {
        required: true,
        questions: [
          { id: "adultEligibility", label: "¿Sos mayor de 18 años?" },
          { id: "argentineDniEligibility", label: "¿Tenés DNI argentino vigente?" }
        ],
        failureMessage: "Este trámite en línea requiere ser mayor de 18 años y contar con DNI argentino vigente."
      },
      requirements: [
        "Ser mayor de 18 años.",
        "Tener DNI argentino vigente.",
        "Tener acceso al correo electrónico personal informado."
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
        ...contactFields.slice(0, 1),
        { id: "birthDate", label: "Fecha de nacimiento", type: "date", required: true },
        { id: "dni", label: "DNI", type: "text", required: true, inputmode: "numeric" },
        { id: "cuil", label: "CUIL", type: "text", required: true, inputmode: "numeric", placeholder: "20-12345678-3" },
        { id: "dniTransaction", label: "Número de trámite del DNI", type: "text", required: false, inputmode: "numeric" },
        { id: "dniFile", label: "Foto del frente del DNI", type: "file", required: false, accept: "image/*" },
        ...contactFields.slice(1),
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
      name: "Informe vehicular",
      shortDescription: "Dominio, infracciones y deuda de patentes en una gestión.",
      description: "Elegí Automotor o Moto e ingresá el dominio. No pedimos datos personales que no sean necesarios para la consulta.",
      active: true,
      requirements: ["Tipo de vehículo.", "Dominio o patente."],
      components: [
        "Informe de dominio oficial",
        "Inhibiciones y prendas, si existieran",
        "Infracciones de CABA y PBA",
        "Estado de deuda de patentes de CABA y PBA"
      ],
      officialFee: null,
      priceField: "serviceOption",
      priceOptions: [{ value: "complete", label: "Informe completo", amount: null, duration: "Plazo a confirmar" }],
      fields: [
        { id: "vehicleType", label: "Tipo de vehículo", type: "choice", required: true, options: [
          { value: "automotor", label: "Automotor" },
          { value: "moto", label: "Moto" }
        ] },
        { id: "patent", label: "Dominio (patente)", type: "text", required: true, placeholder: "Ej.: AB 123 CD" },
        authorizationField
      ]
    },
    {
      id: "constancias-anses",
      codePrefix: "AN",
      name: "Constancias ANSES",
      shortDescription: "CODEM y Certificación Negativa en una misma gestión.",
      description: "Ingresá el CUIL y el período de la Certificación Negativa. ANSES permite consultar períodos comprendidos dentro de los últimos seis meses.",
      active: true,
      requirements: ["CUIL del titular.", "Período desde y hasta para la Certificación Negativa."],
      components: ["CODEM", "Certificación Negativa"],
      officialFee: 0,
      priceField: "serviceOption",
      priceOptions: [{ value: "constancias", label: "CODEM + Certificación Negativa", amount: null, duration: "Plazo a confirmar" }],
      fields: [
        { id: "cuil", label: "CUIL", type: "text", required: true, inputmode: "numeric", placeholder: "20-12345678-3" },
        { id: "periodFrom", label: "Período desde", type: "month", required: true },
        { id: "periodTo", label: "Período hasta", type: "month", required: true },
        authorizationField
      ]
    },
    {
      id: "arba-inmobiliario",
      codePrefix: "AI",
      name: "ARBA / Inmobiliario",
      shortDescription: "Estado de deuda inmobiliaria y plancheta catastral.",
      description: "Subí una foto donde figure la identificación del inmueble o completá Partido y Partida.",
      active: true,
      requirements: ["Foto de una boleta o documento donde figure el inmueble, o número de Partido y Partida."],
      components: ["Estado de deuda inmobiliaria", "Plancheta catastral"],
      officialFee: null,
      priceField: "serviceOption",
      priceOptions: [{ value: "debt-plan", label: "Deuda + plancheta", amount: null, duration: "Plazo a confirmar" }],
      fields: [
        { id: "propertyDocument", label: "Foto de boleta o documento del inmueble", type: "file", required: false, accept: "image/*,.pdf,application/pdf" },
        { id: "propertyDistrict", label: "Partido", type: "text", required: false },
        { id: "propertyNumber", label: "Partida", type: "text", required: false, inputmode: "numeric" },
        authorizationField
      ],
      rules: {
        oneOfGroups: [["propertyDocument"], ["propertyDistrict", "propertyNumber"]],
        message: "Subí una foto donde figure el inmueble o completá Partido y Partida."
      }
    },
    {
      id: "turnos-licencia",
      codePrefix: "TL",
      name: "Turnos de licencia",
      shortDescription: "Gestión del turno según municipio y tipo de licencia.",
      description: "Indicamos los datos necesarios y buscamos la opción correspondiente.",
      active: false,
      requirements: ["DNI del solicitante.", "Municipio y tipo de licencia."],
      components: ["Revisión de requisitos", "Búsqueda de turno", "Confirmación"],
      officialFee: null,
      priceField: "serviceOption",
      priceOptions: [{ value: "turno", label: "Gestión de turno", amount: null, duration: "Plazo a confirmar" }],
      fields: [
        ...contactFields.slice(0, 1),
        { id: "dni", label: "DNI", type: "text", required: true, inputmode: "numeric" },
        { id: "municipality", label: "Municipio", type: "select", required: true, options: [
          { value: "jose-c-paz", label: "José C. Paz" },
          { value: "san-miguel", label: "San Miguel" },
          { value: "malvinas", label: "Malvinas Argentinas" },
          { value: "moreno", label: "Moreno" },
          { value: "lujan", label: "Luján" },
          { value: "otro", label: "Otro municipio" }
        ] },
        { id: "licenseType", label: "Tipo de licencia", type: "select", required: true, options: [
          { value: "first-time", label: "Primera licencia" },
          { value: "renewal", label: "Renovación" },
          { value: "upgrade", label: "Ampliación" }
        ] },
        ...contactFields.slice(1),
        authorizationField
      ]
    },
    {
      id: "partidas",
      codePrefix: "PA",
      name: "Partidas",
      shortDescription: "Nacimiento, convivencia, matrimonio y defunción.",
      description: "Te ayudamos a solicitar la partida que necesitás y a realizar el seguimiento.",
      active: false,
      requirements: ["Tipo de partida.", "Datos de la persona o vínculo que debe figurar."],
      components: ["Partida de nacimiento", "Unión convivencial", "Partida de matrimonio", "Partida de defunción"],
      officialFee: null,
      priceField: "serviceOption",
      priceOptions: [{ value: "partida", label: "Solicitud de partida", amount: null, duration: "Plazo a confirmar" }],
      fields: [
        { id: "partType", label: "Tipo de partida", type: "select", required: true, options: [
          { value: "birth", label: "Nacimiento" },
          { value: "cohabitation", label: "Unión convivencial" },
          { value: "marriage", label: "Matrimonio" },
          { value: "death", label: "Defunción" }
        ] },
        { id: "details", label: "Datos que conozcas sobre la partida", type: "textarea", required: true, placeholder: "Localidad, fecha aproximada y nombres completos..." },
        ...contactFields,
        authorizationField
      ]
    },
    {
      id: "arca-monotributo",
      codePrefix: "AR",
      name: "ARCA / Monotributo",
      shortDescription: "Orientación para trámites vinculados al monotributo.",
      description: "Servicio en preparación.",
      active: false,
      requirements: [],
      components: [],
      officialFee: null,
      priceOptions: [],
      fields: []
    }
  ];

  if (typeof document !== "undefined" && document.currentScript && document.getElementById("app")) {
    const baseUrl = document.currentScript.src;
    const loadScript = (src, marker) => {
      if (document.querySelector(`script[${marker}]`)) return;
      const script = document.createElement("script");
      script.src = new URL(src, baseUrl).href;
      script.async = false;
      script.setAttribute(marker, "true");
      document.head.appendChild(script);
    };

    loadScript("flow-ui.js?v=20260905-review1", "data-tramipago-flow-ui");
    loadScript("site-fixes.js?v=20260905-review1", "data-tramipago-site-fixes");
  }
})();
