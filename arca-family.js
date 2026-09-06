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
    cuit: { id: "cuit", label: "CUIT", type: "text", required: true, inputmode: "numeric", placeholder: "20-12345678-3" },
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
      shortDescription: "Obtención de constancias y credenciales disponibles en ARCA.",
      description: "Indicá qué constancia necesitás. TramiPago realiza la gestión online y te entrega el documento correspondiente cuando aplique.",
      image: "assets/arca-constancia.svg",
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
      shortDescription: "Generación de Volante Electrónico de Pago para una obligación.",
      description: "Completá los datos de la obligación. Si algún concepto no lo conocés, indicá lo que tengas y TramiPago revisará la información antes de generar el VEP.",
      image: "assets/arca-vep.svg",
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
      name: "Informe deuda/saldos CCMA",
      shortDescription: "Consulta de pagos, deuda, intereses y saldos a favor en CCMA.",
      description: "Indicá el período que querés revisar y qué necesitás conocer. Podés adjuntar un comprobante si hay un pago puntual para verificar.",
      image: "assets/arca-ccma.svg",
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
      shortDescription: "Corrección de pagos mal aplicados o utilización de saldos a favor.",
      description: "Indicá el pago o saldo de origen y la obligación a la que querés aplicarlo. TramiPago revisa la viabilidad antes de ejecutar la reimputación.",
      image: "assets/arca-reimputacion.svg",
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
        { id: "originAmount", label: "Importe de origen", type: "text", required: true, inputmode: "numeric" },
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
      shortDescription: "Análisis de CCMA y posterior reimputación cuando corresponde.",
      description: "Primero se identifica la deuda o saldo correcto y luego se realiza la reimputación correspondiente si el sistema la permite.",
      image: "assets/arca-informe-reimputacion.svg",
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
        { id: "comboOriginAmount", label: "Importe del saldo o pago (si lo conocés)", type: "text", required: false, inputmode: "numeric" },
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
      name: "Alta Monotributo",
      shortDescription: "Alta de Monotributo con datos de actividad y parámetros de categorización.",
      description: "Completá los datos de la actividad. TramiPago revisa la información necesaria para el alta y la categoría aplicable antes de gestionar la adhesión.",
      image: "assets/arca-alta-monotributo.svg",
      active: true,
      officialFee: 0,
      requirements: ["CUIT del contribuyente.", "Datos de la actividad y fecha de inicio.", "Parámetros de categorización cuando correspondan.", DELEGATION_NOTICE],
      components: ["Actividad y fecha de inicio", "Domicilio de actividad", "Parámetros de categoría", "Situación previsional y obra social cuando corresponda"],
      priceField: "serviceOption",
      priceOptions: serviceFeeOption("Alta Monotributo", 12000),
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
        { id: "estimatedIncome", label: "Ingresos brutos anuales estimados", type: "text", required: true, inputmode: "numeric" },
        { id: "surface", label: "Superficie afectada en m² (si corresponde)", type: "text", required: false, inputmode: "numeric" },
        { id: "energy", label: "Energía eléctrica anual en kWh (si corresponde)", type: "text", required: false, inputmode: "numeric" },
        { id: "annualRent", label: "Alquileres anuales (si corresponde)", type: "text", required: false, inputmode: "numeric" },
        { id: "maxUnitPrice", label: "Precio unitario máximo de venta (si corresponde)", type: "text", required: false, inputmode: "numeric" },
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
      name: "Baja Monotributo",
      shortDescription: "Baja del Monotributo por el motivo correspondiente.",
      description: "Indicá el motivo y el mes desde el que dejás de realizar la actividad. No se exige libre deuda general; el mes en que se solicita la baja debe quedar pago para evitar generar deuda.",
      image: "assets/arca-baja-monotributo.svg",
      active: true,
      officialFee: 0,
      requirements: ["CUIT del contribuyente.", "Motivo de la baja.", "Mes desde el que deja de realizarse la actividad.", DELEGATION_NOTICE],
      components: ["Revisión del motivo", "Baja en Portal Monotributo", "Control del período de baja"],
      priceField: "serviceOption",
      priceOptions: serviceFeeOption("Baja Monotributo", 8000),
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
      shortDescription: "Evaluación de los últimos 12 meses y recategorización de Monotributo.",
      description: "Completá los parámetros de los últimos 12 meses. TramiPago revisa si corresponde mantener o modificar la categoría y gestiona la recategorización cuando aplica.",
      image: "assets/arca-recategorizacion.svg",
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
        { id: "income12Months", label: "Ingresos brutos de los últimos 12 meses", type: "text", required: true, inputmode: "numeric" },
        { id: "recatSurface", label: "Superficie afectada en m² (si corresponde)", type: "text", required: false, inputmode: "numeric" },
        { id: "recatEnergy", label: "Energía eléctrica de los últimos 12 meses en kWh (si corresponde)", type: "text", required: false, inputmode: "numeric" },
        { id: "recatRent", label: "Alquileres devengados en los últimos 12 meses (si corresponde)", type: "text", required: false, inputmode: "numeric" },
        { id: "recatMaxUnitPrice", label: "Precio unitario máximo de venta (si corresponde)", type: "text", required: false, inputmode: "numeric" },
        AUTHORIZATION
      ]
    },
    {
      id: "arca-dfe",
      codePrefix: "DF",
      name: "Domicilio Fiscal Electrónico",
      shortDescription: "Constitución o actualización del canal oficial de comunicaciones de ARCA.",
      description: "El Domicilio Fiscal Electrónico es distinto del domicilio fiscal físico. Para constituirlo o actualizarlo se utilizan un correo electrónico y un teléfono celular.",
      image: "assets/arca-dfe.svg",
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
      codePrefix: "AD",
      name: "Actualización de datos ARCA",
      shortDescription: "Corrección o actualización de datos registrales y datos de actividad.",
      description: "Indicá qué dato necesitás modificar, el dato actual y el dato nuevo. La documentación respaldatoria depende del tipo de modificación.",
      image: "assets/arca-actualizacion.svg",
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
    if (document.getElementById("tramipago-arca-family-styles")) return;
    const style = document.createElement("style");
    style.id = "tramipago-arca-family-styles";
    style.textContent = `
      .arca-family-page .family-shell{max-width:1180px!important}
      .arca-family-page .family-heading{margin-bottom:14px!important}
      .arca-family-page .family-heading img{width:118px!important;height:92px!important;object-fit:cover!important}
      .arca-family-page .family-service-grid{display:block!important}
      .arca-family-page .arca-service-group{margin:0 0 16px!important}
      .arca-family-page .arca-service-group-title{margin:0 0 8px!important;color:#082A47!important;font-size:.96rem!important;font-weight:800!important;text-align:left!important}
      .arca-family-page .arca-service-row{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:12px!important;align-items:stretch!important}
      .arca-family-page .family-service-card{display:flex!important;flex-direction:column!important;min-width:0!important;padding:0 0 10px!important;overflow:hidden!important;background:#fbfdff!important}
      .arca-family-page .arca-service-thumb{display:block!important;width:100%!important;aspect-ratio:1.25/1!important;object-fit:cover!important;border:0!important;border-bottom:1px solid #d5e2ea!important;background:#eaf2f7!important}
      .arca-family-page .family-service-card>div{display:flex!important;flex:1 1 auto!important;flex-direction:column!important;min-width:0!important;padding:10px 10px 4px!important}
      .arca-family-page .family-service-card .service-tag{display:none!important}
      .arca-family-page .family-service-card h2{margin:0 0 5px!important;color:#082A47!important;font-size:.98rem!important;line-height:1.16!important}
      .arca-family-page .family-service-card p{margin:0 0 7px!important;color:#607789!important;font-size:.76rem!important;line-height:1.35!important}
      .arca-family-page .service-card-mini{display:none!important}
      .arca-family-page .service-summary-option{display:block!important;padding:4px 0!important;border:0!important}
      .arca-family-page .service-summary-option>div small{display:none!important}
      .arca-family-page .service-summary-option>strong{color:#126B3A!important;font-size:.88rem!important}
      .arca-family-page .family-service-card>.button{width:calc(100% - 20px)!important;min-width:0!important;min-height:38px!important;margin:5px 10px 0!important;padding:6px 8px!important;font-size:.78rem!important}
      @media(max-width:1100px){.arca-family-page .arca-service-row{grid-template-columns:repeat(3,minmax(0,1fr))!important}}
      @media(max-width:760px){.arca-family-page .arca-service-row{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
      @media(max-width:480px){.arca-family-page .arca-service-row{grid-template-columns:1fr!important}}
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
    window.setTimeout(enhanceArcaFamily, 0);
  }

  injectArcaStyles();
  window.addEventListener("hashchange", scheduleArcaEnhancement);
  window.addEventListener("load", scheduleArcaEnhancement);
  document.addEventListener("DOMContentLoaded", scheduleArcaEnhancement);
  scheduleArcaEnhancement();
})();
