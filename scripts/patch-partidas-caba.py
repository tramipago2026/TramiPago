from pathlib import Path
import re


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f"No se encontró bloque esperado: {label}")
    return text.replace(old, new, 1)

# 1) Configuración del servicio CABA
p = Path("services.js")
s = p.read_text(encoding="utf-8")
old_service = '''    ,{
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
    }'''
new_service = '''    ,{
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
        { id: "registrationYear", label: "Año de inscripción (si lo conocés)", type: "text", required: false, inputmode: "numeric" },
        { id: "creditCardAvailable", label: "Si elegí urgente, cuento con tarjeta de crédito para abonar el costo oficial.", type: "checkbox", required: false },
        { id: "previousAct", label: "Copia de una partida anterior (opcional)", type: "file", required: false, accept: "image/*,.pdf,application/pdf" },
        { id: "purpose", label: "¿Para qué trámite necesitás la partida? (opcional)", type: "text", required: false },
        ...contactFields,
        authorizationField
      ]
    }'''
s = replace_once(s, old_service, new_service, "servicio partidas-caba")
p.write_text(s, encoding="utf-8")

# 2) Enrutado, habilitación y validación en app.js
p = Path("app.js")
a = p.read_text(encoding="utf-8")
a = replace_once(
    a,
    '      active: Boolean(merged.active && hasCommercialData(merged))',
    '      active: Boolean(merged.active && (merged.intakeOnly || hasCommercialData(merged)))',
    "habilitación intakeOnly"
)
a = replace_once(
    a,
    '    const available = jurisdiction === "pba";',
    '    const available = jurisdiction === "pba" || jurisdiction === "caba";',
    "botones CABA"
)
old_note = '              ${jurisdiction === "caba" ? \'<div class="partidas-caba-note">La estructura queda preparada. Los trámites de CABA se habilitarán cuando estén confirmados requisitos, precio y plazo.</div>\' : ""}\n'
a = a.replace(old_note, "")

old_click = '''    if (action === "select-partida-type") {
      const partType = trigger.dataset.partType || "";
      if (!partType || state.partidasJurisdiction !== "pba") return;
      sessionStorage.setItem("tramipago_partidas_prefill_v1", partType);
      return startService("partidas");
    }'''
new_click = '''    if (action === "select-partida-type") {
      const partType = trigger.dataset.partType || "";
      const jurisdiction = state.partidasJurisdiction;
      if (!partType || !["pba", "caba"].includes(jurisdiction)) return;
      if (jurisdiction === "pba") {
        sessionStorage.setItem("tramipago_partidas_prefill_v1", partType);
        return startService("partidas");
      }
      sessionStorage.setItem("tramipago_partidas_caba_prefill_v1", partType);
      return startService("partidas-caba");
    }'''
a = replace_once(a, old_click, new_click, "click Partidas")

old_restore = '''    state.requestId = null;
    state.draft = {};
    state.step = service.eligibility?.required ? "eligibility" : "data";
  }

  function openWhatsApp()'''
new_restore = '''    state.requestId = null;
    state.draft = {};
    if (serviceId === "partidas-caba") {
      const preset = sessionStorage.getItem("tramipago_partidas_caba_prefill_v1") || "";
      if (preset) {
        state.draft.partType = preset;
        state.draft.requestMode = preset === "cohabitation" ? "union-review" : "regular";
        sessionStorage.removeItem("tramipago_partidas_caba_prefill_v1");
      }
    }
    state.step = service.eligibility?.required ? "eligibility" : "data";
  }

  function openWhatsApp()'''
a = replace_once(a, old_restore, new_restore, "prefill CABA")

old_status = '      status: "payment_pending",'
a = replace_once(a, old_status, '      status: service.intakeOnly ? "in_progress" : "payment_pending",', "estado intakeOnly")

old_submit = '''        state.requestId = request.id;
        rememberActiveRequest(request);
        state.step = "payment";
        render();
        window.scrollTo(0, 0);'''
new_submit = '''        state.requestId = request.id;
        if (service.intakeOnly) {
          clearActiveRequest();
          state.trackingResult = request;
          state.step = "confirmation";
        } else {
          rememberActiveRequest(request);
          state.step = "payment";
        }
        render();
        window.scrollTo(0, 0);'''
a = replace_once(a, old_submit, new_submit, "salto de pago intakeOnly")

# Inserta reglas específicas antes del return final de validateRules
start = a.find('  function validateRules(service, values) {')
end = a.find('\n  function setFormError', start)
if start < 0 or end < 0:
    raise SystemExit('No se encontró validateRules')
block = a[start:end]
needle = '    return "";\n  }'
pos = block.rfind(needle)
if pos < 0:
    raise SystemExit('No se encontró cierre de validateRules')
extra = '''    if (service.id === "partidas-caba") {
      const type = values.partType;
      const mode = values.requestMode;
      if (["birth", "death"].includes(type) && !hasValue(values.eventDate)) {
        return "Para nacimiento o defunción, indicá la fecha exacta o aproximada del acontecimiento.";
      }
      if (["marriage", "cohabitation"].includes(type) && !hasValue(values.secondPersonName)) {
        return "Para matrimonio o unión convivencial, indicá el nombre y apellido de la otra persona.";
      }
      if (type === "cohabitation" && mode !== "union-review") {
        return "Para Unión Convivencial elegí la opción de revisión del canal oficial.";
      }
      if (type !== "cohabitation" && mode === "union-review") {
        return "La revisión de canal de Unión Convivencial corresponde solo a ese tipo de partida.";
      }
      if (mode === "urgent") {
        const exact = ["eventDate", "sectionCirc", "bookNumber", "actNumber", "registrationYear"];
        if (!exact.every((id) => hasValue(values[id]))) {
          return "Para una solicitud urgente de CABA necesitás fecha exacta, Circunscripción/Sección, Tomo, Acta y Año.";
        }
        if (!values.creditCardAvailable) {
          return "Para una solicitud urgente de CABA confirmá que contás con tarjeta de crédito para el pago oficial.";
        }
      }
    }

'''
block = block[:pos] + extra + block[pos:]
a = a[:start] + block + a[end:]
p.write_text(a, encoding="utf-8")

# 3) Cache bust en index.html
p = Path("index.html")
h = p.read_text(encoding="utf-8")
h = re.sub(r'(services\.js\?v=)[^"\']+', r'\g<1>20260909-0305', h)
h = re.sub(r'(app\.js\?v=)[^"\']+', r'\g<1>20260909-0305', h)
p.write_text(h, encoding="utf-8")
