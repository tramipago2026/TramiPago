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

# Nombres visibles uniformes.
t = t.replace(
    '{ serviceId: "informe-vehicular", name: "Informe vehicular", image: "assets/informe-vehicular-v3.webp" }',
    '{ serviceId: "informe-vehicular", name: "Informe Vehicular", image: "assets/informe-vehicular-v3.webp" }',
)

# Partidas pasa a ser una familia PBA / CABA.
t = t.replace(
    'description: "Nacimiento, matrimonio, unión convivencial y defunción de la Provincia de Buenos Aires.",',
    'description: "Partidas de la Provincia de Buenos Aires y Ciudad de Buenos Aires.",',
    1,
)
t = t.replace('serviceIds: ["partidas"],\n      directServiceId: "partidas"', 'serviceIds: ["partidas", "partidas-caba"]', 1)

marker = "  window.TRAMI_SERVICES = ["
if marker not in t:
    raise SystemExit("No se encontró TRAMI_SERVICES")

# Agregar Asistencia Digital a las tarjetas de familias.
families, service_tail = t.split(marker, 1)
if 'id: "asistencia-digital"' not in families:
    insert_at = families.rfind("\n  ];")
    if insert_at == -1:
        raise SystemExit("No se encontró cierre de TRAMI_FAMILIES")
    family_block = '''\n    ,{\n      id: "asistencia-digital",\n      name: "Asistencia Digital",\n      description: "Asistencia online para generar o recuperar accesos de ANSES, ARCA y Mi Argentina.",\n      image: "assets/asistencia-digital-v1.webp",\n      serviceIds: ["asistencia-digital"]\n    }'''
    families = families[:insert_at] + family_block + families[insert_at:]
t = families + marker + service_tail

# Uniformar nombres internos que luego se muestran en formularios/seguimiento.
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

# Localizar el cierre real del arreglo TRAMI_SERVICES; services.js continúa luego con lógica de Partidas.
services_start = t.index(marker)
services_close = t.find("\n  ];", services_start)
if services_close == -1:
    raise SystemExit("No se encontró cierre de TRAMI_SERVICES")
service_section = t[services_start:services_close]

extra = ""
if 'id: "partidas-caba"' not in service_section:
    extra += '''\n    ,{\n      id: "partidas-caba",\n      codePrefix: "PC",\n      name: "Partidas CABA",\n      shortDescription: "Partidas del Registro Civil de CABA.",\n      description: "Servicio en preparación. Requisitos, precio y plazo todavía no publicados.",\n      active: false,\n      requirements: [],\n      components: [],\n      officialFee: null,\n      priceField: "serviceOption",\n      priceOptions: [],\n      fields: []\n    }\n'''
if 'id: "asistencia-digital"' not in service_section:
    extra += '''\n    ,{\n      id: "asistencia-digital",\n      codePrefix: "AD",\n      name: "Asistencia Digital",\n      shortDescription: "Generación o recuperación de accesos de ANSES, ARCA y Mi Argentina.",\n      description: "Elegí el acceso y el tipo de ayuda. TramiPago te acompaña en la gestión remota. Las validaciones de identidad, códigos y claves las realiza siempre el titular.",\n      active: true,\n      requirements: ["Ser titular del acceso.", "Tener disponibles tus medios de contacto para realizar las validaciones que correspondan.", "No compartir contraseñas con TramiPago."],\n      components: ["Asistencia online para ANSES, ARCA o Mi Argentina", "Generación o recuperación del acceso", "Reintegro del servicio si, agotadas las vías remotas, el organismo exige una instancia presencial"],\n      officialFee: 0,\n      priceField: "serviceOption",\n      priceOptions: [{ value: "assistance", label: "Asistencia Digital", amount: 5000, duration: "Asistencia online" }],\n      fields: [\n        { id: "platform", label: "¿Con qué acceso necesitás ayuda?", type: "choice", required: true, options: [\n          { value: "anses", label: "ANSES" },\n          { value: "arca", label: "ARCA" },\n          { value: "miargentina", label: "Mi Argentina" }\n        ] },\n        { id: "assistanceType", label: "¿Qué necesitás hacer?", type: "choice", required: true, options: [\n          { value: "generate", label: "Generar acceso" },\n          { value: "recover", label: "Recuperar acceso" }\n        ] },\n        ...contactFields,\n        { id: "serviceFeeAcceptance", label: "Entiendo y acepto que el importe abonado corresponde al servicio de gestión, asistencia, acompañamiento y/o entrega, según corresponda, brindado por TramiPago.", type: "checkbox", required: true },\n        authorizationField\n      ]\n    }\n'''
if extra:
    t = t[:services_close] + extra + t[services_close:]

# Partidas debe abrir la familia para poder elegir PBA o ver CABA como próximamente.
partidas_click = re.compile(
    r'\n  document\.addEventListener\("click", function \(event\) \{\n'
    r'    const tile = event\.target\.closest\(\'\[data-action="select-family"\]\[data-family-id="partidas-pba"\]\'\);\n'
    r'    if \(!tile\) return;\n'
    r'    event\.preventDefault\(\);\n'
    r'    event\.stopImmediatePropagation\(\);\n'
    r'    location\.hash = "#/tramite/partidas";\n'
    r'    window\.scrollTo\(\{ top: 0, behavior: "auto" \}\);\n'
    r'  \}, true\);\n',
    re.M,
)
t = partidas_click.sub("\n", t, count=1)

# Asistencia Digital tiene un único servicio: el botón entra directo al formulario.
if 'data-family-id="asistencia-digital"' not in t:
    hook = '''\n  document.addEventListener("click", function (event) {\n    const tile = event.target.closest('[data-action="select-family"][data-family-id="asistencia-digital"]');\n    if (!tile) return;\n    event.preventDefault();\n    event.stopImmediatePropagation();\n    location.hash = "#/tramite/asistencia-digital";\n    window.scrollTo({ top: 0, behavior: "auto" });\n  }, true);\n'''
    anchor = '  const partidasApp = document.getElementById("app");'
    if anchor not in t:
        raise SystemExit("No se encontró punto de inserción para Asistencia Digital")
    t = t.replace(anchor, hook + "\n" + anchor, 1)

services.write_text(t, encoding="utf-8")

# -------- footer-menu.js --------
footer = Path("footer-menu.js")
f = footer.read_text(encoding="utf-8")
f = f.replace('>Informe vehicular</a>', '>Informe Vehicular</a>')
f = f.replace('<a href="#/tramite/partidas">Partidas PBA</a>', '<a href="#/familia/partidas-pba">Partidas</a><a href="#/tramite/asistencia-digital">Asistencia Digital</a>')
footer.write_text(f, encoding="utf-8")
