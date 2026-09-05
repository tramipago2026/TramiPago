/* Configuración central de servicios */
(function () {
  const contactFields = [
    { id: "fullName", label: "Nombre y apellido", type: "text", required: true, autocomplete: "name" },
    { id: "email", label: "Correo electrónico", type: "email", required: true, autocomplete: "email" },
    { id: "whatsapp", label: "WhatsApp", type: "tel", required: true, placeholder: "Ej.: 11 6708-3232 (sin +54 9)", autocomplete: "tel" }
  ];

  const authorizationField = {
    id: "authorization",
    label: "Leí y acepto la Política de Privacidad. Autorizo a TramiPago a utilizar estos datos y documentos únicamente para gestionar el trámite solicitado.",
    type: "checkbox",
    required: true
  };

  window.TRAMI_CONFIG = {
    whatsappNumber: "5491167083232",
    alias: "tramipago",
    paymentCvu: "",
    paymentHolder: "No realizar pagos",
    paymentQr: "assets/qr-modo-prueba.svg",
    paymentNote: "Versión de prueba: no realices transferencias.",
    demoMode: true,
    maxLocalFileBytes: 1500000
  };

  window.TRAMI_DIRECTS = [
    {
      serviceId: "antecedentes-penales",
      name: "Antecedentes Penales",
      image: "assets/antecedentes-penales-v3.webp"
    },
    {
      serviceId: "constancias-anses",
      name: "ANSES",
      image: "assets/anses-v3.webp"
    },
    {
      serviceId: "informe-vehicular",
      name: "Informe vehicular",
      image: "assets/informe-vehicular-v3.webp"
    },
    {
      serviceId: "arba-inmobiliario",
      name: "ARBA / Inmobiliario",
      image: "assets/arba-inmobiliario-v3.webp"
    }
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
      shortDescription: "Solicitá tu certificado con seguimiento.",
      description: "Gestionamos la solicitud. El organismo envía el certificado directamente al correo del titular.",
      resultDelivery: "authority-direct",
      active: true,
      eligibility: {
        required: true,
        questions: [
          { id: "adultEligibility", label: "¿Sos mayor de 18 años?" },
          { id: "argentineDniEligibility", label: "¿Tenés DNI argentino vigente?" }
        ],
        failureMessage: "Este trámite requiere ser mayor de 18 años y contar con DNI argentino vigente."
      },
      requirements: [
        "Ser mayor de 18 años.",
        "Tener DNI argentino vigente.",
        "Tener correo electrónico y WhatsApp disponibles."
      ],
      components: ["Solicitud del certificado", "Seguimiento de la gestión", "Envío directo al correo del titular"],
      officialFee: 0,
      priceField: "modality",
      priceOptions: [
        { value: "one-hour", label: "1 hora", amount: 20000, duration: "Entrega estimada: 1 hora" },
        { value: "six-hours", label: "6 horas", amount: 15000, duration: "Entrega estimada: 6 horas" }
      ],
      fields: [
        ...contactFields.slice(0, 1),
        { id: "birthDate", label: "Fecha de nacimiento", type: "date", required: true },
        { id: "dni", label: "DNI", type: "text", required: true, inputmode: "numeric" },
        { id: "cuil", label: "CUIL", type: "text", required: true, inputmode: "numeric", placeholder: "20-12345678-3" },
        { id: "dniTransaction", label: "Número de trámite del DNI", type: "text", required: false, inputmode: "numeric" },
        { id: "dniFile", label: "Foto del DNI", type: "file", required: false, accept: "image/*" },
        ...contactFields.slice(1),
        { id: "modality", label: "Modalidad", type: "select", required: true, options: [
          { value: "one-hour", label: "1 hora — $20.000" },
          { value: "six-hours", label: "6 horas — $15.000" }
        ] },
        authorizationField
      ],
      rules: { anyOf: ["dniTransaction", "dniFile"], message: "Ingresá el número de trámite del DNI o cargá una foto." }
    },
    {
      id: "informe-vehicular",
      codePrefix: "IV",
      name: "Informe vehicular",
      shortDescription: "Dominio, infracciones y deuda de patentes en una gestión.",
      description: "Con la patente consultamos la información del vehículo en CABA y Provincia de Buenos Aires.",
      active: true,
      requirements: ["Dominio o patente del vehículo.", "DNI y datos de contacto del solicitante."],
      components: ["Informe oficial e histórico de dominio", "Inhibiciones y prendas, si existieran", "Infracciones de CABA y PBA", "Estado de deuda de patentes de CABA y PBA"],
      officialFee: null,
      priceField: "serviceOption",
      priceOptions: [{ value: "complete", label: "Informe completo", amount: null, duration: "Plazo a confirmar" }],
      fields: [
        { id: "patent", label: "Dominio (patente)", type: "text", required: true, placeholder: "AB 123 CD" },
        ...contactFields.slice(0, 1),
        { id: "dni", label: "DNI del solicitante", type: "text", required: true, inputmode: "numeric" },
        ...contactFields.slice(1),
        authorizationField
      ]
    },
    {
      id: "constancias-anses",
      codePrefix: "AN",
      name: "Constancias ANSES",
      shortDescription: "CODEM y Certificación Negativa en una misma gestión.",
      description: "Reunimos las constancias que necesitás y te informamos el resultado.",
      active: true,
      requirements: ["DNI y CUIL del solicitante.", "Período de la Certificación Negativa dentro de los últimos seis meses."],
      components: ["CODEM", "Certificación Negativa"],
      officialFee: null,
      priceField: "serviceOption",
      priceOptions: [{ value: "constancias", label: "CODEM + Certificación Negativa", amount: null, duration: "Plazo a confirmar" }],
      fields: [
        ...contactFields.slice(0, 1),
        { id: "dni", label: "DNI", type: "text", required: true, inputmode: "numeric" },
        { id: "cuil", label: "CUIL", type: "text", required: true, inputmode: "numeric" },
        { id: "periodFrom", label: "Certificación desde", type: "month", required: true },
        { id: "periodTo", label: "Certificación hasta", type: "month", required: true },
        ...contactFields.slice(1),
        authorizationField
      ]
    },
    {
      id: "arba-inmobiliario",
      codePrefix: "AI",
      name: "ARBA / Inmobiliario",
      shortDescription: "Estado de deuda inmobiliaria y plancheta catastral.",
      description: "Podés indicar Partido y Partida o cargar un documento municipal o provincial del inmueble.",
      active: true,
      requirements: ["Partido y Partida, o un documento del inmueble.", "La plancheta debe solicitarla el titular o un representante autorizado.", "No solicitamos claves ni contraseñas."],
      components: ["Estado de deuda inmobiliaria", "Copia de plancheta catastral"],
      officialFee: null,
      priceField: "serviceOption",
      priceOptions: [{ value: "debt-plan", label: "Deuda + plancheta", amount: null, duration: "Plazo a confirmar" }],
      fields: [
        ...contactFields.slice(0, 1),
        { id: "cuil", label: "CUIL o CUIT", type: "text", required: true, inputmode: "numeric" },
        { id: "applicantRole", label: "¿Quién solicita?", type: "select", required: true, options: [
          { value: "owner", label: "Titular" },
          { value: "authorized", label: "Representante autorizado" }
        ] },
        { id: "propertyId", label: "Partido y Partida", type: "text", required: false, placeholder: "Ej.: 067-123456" },
        { id: "propertyDocument", label: "Documento municipal o provincial", type: "file", required: false, accept: "image/*,.pdf,application/pdf" },
        ...contactFields.slice(1),
        authorizationField
      ],
      rules: { anyOf: ["propertyId", "propertyDocument"], message: "Ingresá Partido y Partida o cargá un documento del inmueble." }
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

    loadScript("flow-ui.js?v=20260903-1305", "data-tramipago-flow-ui");
    loadScript("site-fixes.js?v=20260903-1400", "data-tramipago-site-fixes");
  }
})();
