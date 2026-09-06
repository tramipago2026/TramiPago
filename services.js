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
    { serviceId: "informe-vehicular", name: "Informe vehicular", image: "assets/informe-vehicular-v3.webp" },
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
      name: "Partidas PBA",
      description: "Partidas de nacimiento, matrimonio, unión convivencial y defunción de la Provincia de Buenos Aires.",
      image: "assets/partidas-pba-v4.svg",
      serviceIds: ["partidas"]
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
      name: "Informe vehicular",
      shortDescription: "Dominio, infracciones y deuda de patentes en una gestión.",
      description: "Ingresá el dominio y elegí Automotor o Moto. El paquete incluye informe de dominio, infracciones CABA/PBA y deuda de patentes CABA/PBA. Si un vehículo de PBA está municipalizado, la deuda se consulta en el municipio correspondiente.",
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
      shortDescription: "Nacimiento, matrimonio, unión convivencial y defunción de la Provincia de Buenos Aires.",
      description: "Gestión TramiPago: $15.000. Los importes oficiales del organismo no están incluidos y se informan solo si corresponden. Con datos, el plazo oficial es de hasta 10 días hábiles. Si requiere búsqueda, el plazo oficial es de hasta 20 días hábiles; la búsqueda se abona antes de iniciarla y puede resultar negativa.",
      active: true,
      requirements: [
        "La partida debe estar inscripta en la Provincia de Buenos Aires.",
        "Nombre y apellido del titular.",
        "Partido y año exacto o aproximado de inscripción.",
        "Si conocés DNI, LC o LE, ingresalo. Si no lo tenés, la solicitud puede requerir búsqueda."
      ],
      components: ["Nacimiento", "Matrimonio", "Unión convivencial", "Defunción"],
      officialFee: 0,
      priceField: "serviceOption",
      priceOptions: [{ value: "partida", label: "Gestión de partida", amount: 15000, duration: "Hasta 10 días hábiles; con búsqueda, hasta 20" }],
      fields: [
        { id: "partType", label: "Tipo de partida", type: "select", required: true, options: [
          { value: "birth", label: "Nacimiento" },
          { value: "marriage", label: "Matrimonio" },
          { value: "cohabitation", label: "Unión convivencial" },
          { value: "death", label: "Defunción" }
        ] },
        { id: "recordHolderFullName", label: "Nombre y apellido del titular de la partida", type: "text", required: true },
        { id: "documentType", label: "Tipo de documento del titular (si lo conocés)", type: "select", required: false, options: [
          { value: "dni", label: "DNI" },
          { value: "lc", label: "Libreta Cívica" },
          { value: "le", label: "Libreta de Enrolamiento" }
        ] },
        { id: "documentNumber", label: "Número de documento del titular (si lo conocés)", type: "text", required: false, inputmode: "numeric" },
        { id: "gender", label: "Sexo / género del titular", type: "select", required: true, options: [
          { value: "female", label: "Femenino" },
          { value: "male", label: "Masculino" },
          { value: "x", label: "X / no binario" }
        ] },
        { id: "registrationDistrict", label: "Partido donde fue inscripta", type: "text", required: true },
        { id: "registrationYear", label: "Año exacto o aproximado", type: "text", required: true, placeholder: "Ej.: 1985 o 1984-1986" },
        { id: "actNumber", label: "Número de acta (si lo conocés)", type: "text", required: false, inputmode: "numeric" },
        { id: "bookNumber", label: "Número de tomo (si lo conocés)", type: "text", required: false },
        { id: "parentOne", label: "Nombre y apellido de un progenitor (opcional)", type: "text", required: false },
        { id: "parentTwo", label: "Nombre y apellido del otro progenitor (opcional)", type: "text", required: false },
        { id: "purpose", label: "¿Para qué trámite necesitás la partida?", type: "text", required: true },
        { id: "previousAct", label: "Copia de una partida anterior (opcional)", type: "file", required: false, accept: "image/*,.pdf,application/pdf" },
        { id: "observations", label: "Observaciones (opcional)", type: "textarea", required: false },
        { id: "fullName", label: "Nombre y apellido de quien solicita", type: "text", required: true, autocomplete: "name" },
        { id: "email", label: "Correo electrónico", type: "email", required: true, autocomplete: "email" },
        { id: "whatsapp", label: "WhatsApp", type: "tel", required: true, placeholder: "Ej.: 11 1234-5678 (sin +54 9)", autocomplete: "tel" },
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
  ];
})();