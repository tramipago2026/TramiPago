/* Familias adicionales de TramiPago: servicios confirmados y consultas profesionales. */
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
      name:"Apostillado",
      shortDescription:"Gestión de Apostilla por TAD para documentos públicos argentinos.",
      description:"Cargá el documento y los datos básicos. TramiPago revisa la documentación, prepara la gestión por TAD y realiza el seguimiento del expediente.",
      active:true,
      officialFee:0,
      priceField:"serviceOption",
      priceOptions:[{value:"gestion",label:"Gestión de Apostillado",amount:20000,duration:"Gestión online"}],
      resultDelivery:"authority-platform",
      requirements:[
        "Documento público argentino en condiciones de ser apostillado.",
        "Datos del documento y país donde se presentará, si corresponde.",
        "TramiPago verifica previamente que la documentación sea apta para iniciar la gestión."
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
        {id:"serviceOption",label:"Servicio",type:"hidden",required:false,value:"gestion"},
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
      officialFee:0,
      priceField:"serviceOption",
      priceOptions:[{value:"gestion",label:"Gestión de Legalización",amount:15000,duration:"Gestión online"}],
      resultDelivery:"authority-platform",
      requirements:[
        "Documento completo y legible.",
        "Datos del organismo o autoridad que emitió el documento.",
        "La vía exacta se determina según el tipo de documento y la legalización requerida."
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
        {id:"serviceOption",label:"Servicio",type:"hidden",required:false,value:"gestion"},
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
      description:"Dos gestiones: Legalizaciones y Apostillado.",
      image:"assets/partidas-familia-final.webp",
      serviceIds:["legalizaciones","apostilla-tad"]
    },
    {
      id:"atencion-abogado",
      name:"Atención de Abogado",
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

  const currentFamilies=Array.isArray(window.TRAMI_FAMILIES)?window.TRAMI_FAMILIES:[];
  const familyIds=new Set(families.map(item=>item.id));
  window.TRAMI_FAMILIES=currentFamilies.filter(item=>!familyIds.has(item.id)).concat(families);
})();