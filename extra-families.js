/* Familias adicionales de TramiPago: solo servicios confirmados o consultas profesionales. */
(function(){
  "use strict";

  const contactFields=[
    {id:"fullName",label:"Nombre y apellido",type:"text",required:true,autocomplete:"name"},
    {id:"email",label:"Correo electrónico",type:"email",required:false,autocomplete:"email"},
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
      name:"Apostilla por TAD",
      shortDescription:"Apostilla de documentos públicos argentinos con validez internacional.",
      description:"Cargá el documento y los datos básicos. TramiPago revisa si está en condiciones de apostillarse y prepara la gestión por TAD. El trámite puede iniciarlo una persona distinta del titular del documento.",
      active:true,
      intakeOnly:true,
      officialFee:4500,
      resultDelivery:"authority-platform",
      requirements:[
        "La persona que inicia el TAD debe ser mayor de 18 años.",
        "La persona que inicia el TAD debe contar con Clave Fiscal nivel 2 o superior y una cuenta bancaria argentina asociada.",
        "El documento debe haber sido emitido por una autoridad u organismo argentino y cumplir las condiciones de la Cancillería según su tipo."
      ],
      components:[
        "Revisión previa del documento",
        "Preparación de la solicitud de Apostilla por TAD",
        "Seguimiento de observaciones o subsanaciones del expediente",
        "Costo oficial vigente informado por Cancillería: $4.500 por expediente/documento"
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
      id:"legalizacion-internacional-partidas",
      codePrefix:"LI",
      name:"Legalización internacional de partidas",
      shortDescription:"Legalización con validez internacional de partidas de estado civil.",
      description:"Para partidas de estado civil que requieren legalización con validez internacional en lugar de Apostilla. Se tramita por TAD y puede iniciarla una persona distinta del titular del documento.",
      active:true,
      intakeOnly:true,
      officialFee:1500,
      resultDelivery:"authority-platform",
      requirements:[
        "La persona que inicia el TAD debe ser mayor de 18 años.",
        "Debe contar con Clave Fiscal nivel 2 o superior y una cuenta bancaria argentina asociada.",
        "La partida debe reunir las condiciones exigidas por Cancillería para ser intervenida."
      ],
      components:[
        "Revisión previa de la partida",
        "Preparación de la legalización con validez internacional",
        "Seguimiento de observaciones o subsanaciones",
        "Costo oficial vigente informado por Cancillería: $1.500"
      ],
      fields:[
        {id:"partType",label:"Tipo de partida",type:"select",required:true,options:[
          {value:"birth",label:"Nacimiento"},
          {value:"marriage",label:"Matrimonio"},
          {value:"death",label:"Defunción"},
          {value:"other",label:"Otra partida de estado civil"}
        ]},
        {id:"destinationCountry",label:"País donde se presentará",type:"text",required:false},
        {id:"documentFile",label:"Partida a revisar (PDF)",type:"file",required:true,accept:"application/pdf,.pdf"},
        ...contactFields,
        authorizationField
      ]
    },
    {
      id:"legalizacion-mininterior",
      codePrefix:"LM",
      name:"Legalización de documentos públicos",
      shortDescription:"Legalización nacional de documentos, títulos y certificados por TAD.",
      description:"Gestión de legalización ante el organismo nacional competente mediante TAD. La información oficial confirma que el trámite puede realizarlo un tercero con sus propios requisitos de acceso.",
      active:true,
      intakeOnly:true,
      officialFee:0,
      resultDelivery:"authority-platform",
      requirements:[
        "Acceso a TAD con CUIT y Clave Fiscal de quien inicia el trámite.",
        "Documento completo, legible y escaneado a color.",
        "Un documento por expediente."
      ],
      components:[
        "Revisión del documento",
        "Carga de datos del titular, organismo emisor y firma a legalizar",
        "Seguimiento del expediente TAD",
        "Trámite oficial gratuito"
      ],
      fields:[
        {id:"documentType",label:"Tipo de documento",type:"text",required:true,placeholder:"Ej.: título, certificado, partida"},
        {id:"issuingAuthority",label:"Organismo o entidad que lo emitió",type:"text",required:true},
        {id:"originProvince",label:"Provincia de origen",type:"text",required:true},
        {id:"signerName",label:"Nombre de la persona que firmó el documento",type:"text",required:true},
        {id:"signDate",label:"Fecha de la firma",type:"date",required:false},
        {id:"documentFile",label:"Documento a legalizar (PDF)",type:"file",required:true,accept:"application/pdf,.pdf"},
        ...contactFields,
        authorizationField
      ]
    },
    {
      id:"abogado-art",
      codePrefix:"AA",
      name:"ART y accidentes laborales",
      shortDescription:"Consulta con abogado por accidente de trabajo, accidente in itinere, enfermedad profesional o reclamo ante ART.",
      description:"Dejá los datos básicos del caso. TramiPago coordina la consulta con un profesional abogado; el análisis jurídico y cualquier actuación profesional quedan a cargo del abogado interviniente.",
      active:true,
      intakeOnly:true,
      officialFee:null,
      requirements:["Datos básicos del hecho.","WhatsApp de contacto."],
      components:["Accidente de trabajo","Accidente in itinere","Enfermedad profesional","Reclamos y diferencias con la ART"],
      fields:[
        {id:"caseType",label:"Motivo de la consulta",type:"select",required:true,options:[
          {value:"work-accident",label:"Accidente de trabajo"},
          {value:"itinere",label:"Accidente in itinere"},
          {value:"occupational-disease",label:"Enfermedad profesional"},
          {value:"art-claim",label:"Problema o reclamo con la ART"},
          {value:"other",label:"Otro"}
        ]},
        {id:"eventDate",label:"Fecha aproximada del hecho (opcional)",type:"date",required:false},
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
      description:"Dejá la información básica. TramiPago coordina la consulta con un profesional abogado para evaluar documentación, jurisdicción y próximos pasos.",
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
      name:"Abogado laboral",
      shortDescription:"Consulta laboral por despido, salarios, trabajo no registrado, telegramas u otros conflictos.",
      description:"Dejá los datos principales. TramiPago coordina la consulta con un profesional abogado laboral; el asesoramiento jurídico queda a cargo del profesional interviniente.",
      active:true,
      intakeOnly:true,
      officialFee:null,
      requirements:["Descripción breve del problema laboral.","WhatsApp de contacto."],
      components:["Despidos","Salarios o diferencias","Trabajo no registrado","Telegramas y comunicaciones laborales","Otros conflictos laborales"],
      fields:[
        {id:"caseType",label:"Motivo de la consulta",type:"select",required:true,options:[
          {value:"dismissal",label:"Despido"},
          {value:"salary",label:"Salarios o diferencias"},
          {value:"unregistered",label:"Trabajo no registrado"},
          {value:"telegram",label:"Telegrama / comunicación laboral"},
          {value:"sanction",label:"Sanción o conflicto en el trabajo"},
          {value:"other",label:"Otro"}
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
      description:"Apostilla, legalización con validez internacional y legalización nacional de documentos por TAD.",
      image:"assets/partidas-familia-final.webp",
      serviceIds:["apostilla-tad","legalizacion-internacional-partidas","legalizacion-mininterior"]
    },
    {
      id:"atencion-abogado",
      name:"Atención de Abogado",
      description:"ART y accidentes laborales, sucesiones y consultas de derecho laboral.",
      image:"assets/promo-art-20260911.webp",
      serviceIds:["abogado-art","abogado-sucesiones","abogado-laboral"]
    }
  ];

  const currentServices=Array.isArray(window.TRAMI_SERVICES)?window.TRAMI_SERVICES:[];
  const serviceIds=new Set(services.map(item=>item.id));
  window.TRAMI_SERVICES=currentServices.filter(item=>!serviceIds.has(item.id)).concat(services);

  const currentFamilies=Array.isArray(window.TRAMI_FAMILIES)?window.TRAMI_FAMILIES:[];
  const familyIds=new Set(families.map(item=>item.id));
  window.TRAMI_FAMILIES=currentFamilies.filter(item=>!familyIds.has(item.id)).concat(families);
})();