from pathlib import Path
import re

# -------- index.html --------
index = Path("index.html")
s = index.read_text(encoding="utf-8")
s = s.replace(
    ".home-family-row { grid-template-columns: repeat(2, 154px); }",
    ".home-family-row { grid-template-columns: repeat(3, 154px); }",
)
new_meta = 'const cardMeta={"antecedentes-penales":{title:"Antecedentes Penales",subtitle:"Certificado Online"},"constancias-anses":{title:"ANSES",subtitle:"CODEM + Negativa"},"arca-monotributo":{title:"ARCA",subtitle:"Monotributo / VEP"},"informe-vehicular":{title:"Informe Vehicular",subtitle:"Dominio + Infracciones + Patentes"},"partidas-pba":{title:"Partidas",subtitle:"PBA / CABA"},"arba-inmobiliario":{title:"ARBA / Inmobiliario",subtitle:"Deuda + Plancheta"},"asistencia-digital":{title:"Asistencia Digital",subtitle:"ANSES / ARCA / Mi Argentina"}};'
s, count = re.subn(r"const cardMeta=\{.*?\};", new_meta, s, count=1)
if count != 1:
    raise SystemExit("No se encontró cardMeta en index.html")
index.write_text(s, encoding="utf-8")

# -------- services.js --------
services = Path("services.js")
t = services.read_text(encoding="utf-8")

t = t.replace(
    '{ serviceId: "informe-vehicular", name: "Informe vehicular", image: "assets/informe-vehicular-v3.webp" }',
    '{ serviceId: "informe-vehicular", name: "Informe Vehicular", image: "assets/informe-vehicular-v3.webp" }',
)

t = t.replace(
    'description: "Nacimiento, matrimonio, unión convivencial y defunción de la Provincia de Buenos Aires.",\n      image: "assets/partidas-familia-final.webp",\n      serviceIds: ["partidas"],',
    'description: "Partidas de la Provincia de Buenos Aires y Ciudad de Buenos Aires.",\n      image: "assets/partidas-familia-final.webp",\n      serviceIds: ["partidas", "partidas-caba"],',
)

marker = "  window.TRAMI_SERVICES = ["
if marker not in t:
    raise SystemExit("No se encontró TRAMI_SERVICES")
families, service_tail = t.split(marker, 1)
if 'id: "asistencia-digital"' not in families:
    insert_at = families.rfind("\n  ];")
    if insert_at == -1:
        raise SystemExit("No se encontró cierre de TRAMI_FAMILIES")
    family_block = '''\n    ,{\n      id: "asistencia-digital",\n      name: "Asistencia Digital",\n      description: "Asistencia online para generar o recuperar accesos de ANSES, ARCA y Mi Argentina.",\n      image: "assets/asistencia-digital-v1.webp",\n      serviceIds: ["asistencia-digital"]\n    }'''
    families = families[:insert_at] + family_block + families[insert_at:]
t = families + marker + service_tail

t = re.sub(
    r'(id: "informe-vehicular",\s*\n\s*codePrefix: "IV",\s*\n\s*name: )"Informe vehicular"',
    r'\1"Informe Vehicular"',
    t,
    count=1,
)
t = re.sub(
    r'(id: "partidas",\s*\n\s*codePrefix: "PA",\s*\n\s*name: )"Partidas"',
    r'\1"Partidas PBA"',
    t,
    count=1,
)

end_marker = "\n  ];\n})();"
end_pos = t.rfind(end_marker)
if end_pos == -1:
    raise SystemExit("No se encontró cierre final de servicios.js")

service_section = t.split(marker, 1)[1]
extra = ""
if 'id: "partidas-caba"' not in service_section:
    extra += '''\n    ,{\n      id: "partidas-caba",\n      codePrefix: "PC",\n      name: "Partidas CABA",\n      shortDescription: "Partidas del Registro Civil de CABA.",\n      description: "Servicio en preparación. Requisitos, precio y plazo todavía no publicados.",\n      active: false,\n      requirements: [],\n      components: [],\n      officialFee: null,\n      priceField: "serviceOption",\n      priceOptions: [],\n      fields: []\n    }\n'''
if 'id: "asistencia-digital"' not in service_section:
    extra += '''\n    ,{\n      id: "asistencia-digital",\n      codePrefix: "AD",\n      name: "Asistencia Digital",\n      shortDescription: "Asistencia para generar o recuperar accesos de ANSES, ARCA y Mi Argentina.",\n      description: "Elegí el acceso y el tipo de ayuda. TramiPago te acompaña en la gestión remota. Las validaciones de identidad, códigos y claves las realiza el titular.",\n      active: true,\n      requirements: ["Ser titular del acceso.", "Tener disponibles tus medios de contacto para realizar las validaciones que correspondan."],\n      components: ["ANSES", "ARCA", "Mi Argentina"],\n      officialFee: 0,\n      priceField: "serviceOption",\n      priceOptions: [{ value: "assistance", label: "Asistencia Digital", amount: 5000, duration: "Asistencia online" }],\n      fields: [\n        { id: "platform", label: "¿Con qué acceso necesitás ayuda?", type: "choice", required: true, options: [\n          { value: "anses", label: "ANSES" },\n          { value: "arca", label: "ARCA" },\n          { value: "miargentina", label: "Mi Argentina" }\n        ] },\n        { id: "assistanceType", label: "¿Qué necesitás hacer?", type: "choice", required: true, options: [\n          { value: "generate", label: "Generar acceso" },\n          { value: "recover", label: "Recuperar acceso" }\n        ] },\n        ...contactFields,\n        { id: "serviceFeeAcceptance", label: "Entiendo y acepto que el importe abonado corresponde al servicio de gestión y asistencia brindado por TramiPago.", type: "checkbox", required: true },\n        authorizationField\n      ]\n    }\n'''
if extra:
    t = t[:end_pos] + extra + t[end_pos:]

services.write_text(t, encoding="utf-8")
