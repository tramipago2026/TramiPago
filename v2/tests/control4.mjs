import assert from "node:assert/strict";
import {readFileSync, existsSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(path.join(root, "rutas-v2.json"), "utf8"));
assert.equal(existsSync(path.join(root, "data", "official-services-2026-10-12.json")), false, "La documentación de validación interna no debe publicarse en V2");
const clientScript = readFileSync(path.join(root, "assets", "v2.js"), "utf8");
assert.ok(!clientScript.includes("Información oficial verificada"), "Control interno expuesto en ficha pública");
const formSchema = JSON.parse(readFileSync(path.join(root, "data", "form-schema-v2.json"), "utf8"));
assert.equal(manifest.status, "STAGING", "Estado V2 inesperado");
const paths = [
  ...manifest.primary.map(x => x.href),
  ...manifest.families.map(x => x.href),
  ...manifest.services.map(x => x.href),
  ...manifest.services.flatMap(x => (manifest.serviceStages || ["iniciar"]).map(stage => x.href + stage + "/")),
  ...manifest.systemPages,
  ...(manifest.internalPages || [])
];
const unique = [...new Set(paths)];
const duplicates = [...new Set(paths.filter((x, i) => paths.indexOf(x) !== i))].sort();
assert.deepEqual(duplicates, ["/v2/ayuda/", "/v2/seguimiento/"], "Duplicaciones no justificadas en manifiesto");

let internalLinks = 0;
for (const url of unique) {
  assert.ok(url.startsWith("/v2/"), "Ruta fuera de V2: " + url);
  const htmlPath = path.join(root, url.slice(4), "index.html");
  assert.ok(existsSync(htmlPath), "Falta destino: " + url);
  const html = readFileSync(htmlPath, "utf8");
  assert.match(html, /name="robots" content="[^"]*noindex[^"]*nofollow[^"]*"/, "Falta noindex/nofollow: " + url);
  for (const [, attribute, value] of html.matchAll(/\b(href|src|action)="([^"]+)"/g)) {
    if (!value.startsWith("/")) continue;
    assert.ok(value.startsWith("/v2/"), "Enlace o recurso fuera de V2: " + url + " → " + value);
    const rel = value.replace(/[?#].*$/, "").slice(4);
    const assetPath = path.join(root, rel);
    const target = value.endsWith("/") ? path.join(assetPath, "index.html") : assetPath;
    assert.ok(existsSync(target), "Link/recurso local no existe: " + url + " → " + value);
    internalLinks++;
  }
}
assert.equal(manifest.services.length, 25, "Inventario de fichas inesperado");
assert.equal(Object.keys(formSchema.services || {}).length, 25, "Inventario de esquemas de formulario inesperado");
for (const service of manifest.services) {
  assert.ok(formSchema.services[service.id], "Falta esquema para " + service.id);
  assert.ok(Array.isArray(formSchema.services[service.id].fields) && formSchema.services[service.id].fields.length > 0, "Esquema sin campos: " + service.id);
}
assert.equal(manifest.families.length, 5, "Inventario de familias inesperado");
for (const service of manifest.services) {
  const entryHtml = readFileSync(path.join(root, service.href.slice(4), "index.html"), "utf8");
  assert.ok(entryHtml.includes("data-v2-request-form"), "La entrada no abre directamente los datos: " + service.id);
  assert.ok(entryHtml.includes("data-v2-progress"), "Falta progreso en la entrada: " + service.id);
  assert.ok(!entryHtml.includes("Ficha en preparación"), "Pantalla intermedia: " + service.id);
  const formPath = path.join(root, service.href.slice(4), "iniciar", "index.html");
  const formHtml = readFileSync(formPath, "utf8");
  assert.ok(formHtml.includes("data-v2-request-form"), "Formulario V2 no funcional: " + service.id);
  for (const stage of ["revisar","pago","confirmacion"]) {
    const stagePath = path.join(root, service.href.slice(4), stage, "index.html");
    assert.ok(existsSync(stagePath), "Falta etapa " + stage + ": " + service.id);
    const stageHtml = readFileSync(stagePath, "utf8");
    assert.ok(stageHtml.includes('data-v2-flow="' + ({revisar:"review",pago:"payment",confirmacion:"confirmation"})[stage] + '"'), "Etapa V2 inválida: " + service.id + "/" + stage);
    assert.ok(stageHtml.includes("data-v2-progress"), "Falta progreso en " + service.id + "/" + stage);
  }
}
const trackingHtml = readFileSync(path.join(root, "seguimiento", "index.html"), "utf8");
assert.ok(trackingHtml.includes("data-v2-tracking-form"), "Seguimiento V2 no funcional");
const adminHtml = readFileSync(path.join(root, "admin", "index.html"), "utf8");
assert.ok(adminHtml.includes("data-admin-login-form"), "Admin V2 sin login");
assert.ok(adminHtml.includes("data-admin-enroll-form"), "Admin V2 sin enrolamiento MFA");

for (const slug of ["terminos-condiciones","politica-privacidad","arrepentimiento","baja-servicio"]) {
  const html=readFileSync(path.join(root,slug,"index.html"),"utf8");
  assert.ok(html.includes("data-v2-shared-header")&&html.includes("shell-v2.js"),"Falta shell: "+slug);
  assert.ok(!html.includes("Contenido legal pendiente")&&html.length>4000,"Legal incompleto: "+slug);
}
for (const slug of ["arrepentimiento","baja-servicio"]) {
  const html=readFileSync(path.join(root,slug,"index.html"),"utf8");
  assert.ok(html.includes("legal-actions-v2.js")&&html.includes("<form"),"Falta canal legal: "+slug);
}
assert.ok(existsSync(path.join(root,"assets","shell-v2.js")),"Falta cabecera/pie común");
assert.ok(existsSync(path.join(root,"assets","legal-actions-v2.js")),"Falta acciones legales");

const fs = await import("node:fs");
const pageFiles = [];
function collectPages(folder) {
  for (const item of fs.readdirSync(folder,{withFileTypes:true})) {
    const p=path.join(folder,item.name);
    if(item.isDirectory()) collectPages(p);
    else if(item.name==="index.html") pageFiles.push(p);
  }
}
collectPages(root);
for (const file of pageFiles) {
  const html=readFileSync(file,"utf8");
  const route=path.relative(root,file).replaceAll(path.sep,"/");
  assert.match(html,/name="robots" content="[^"]*noindex[^"]*nofollow/,"Sin aislamiento SEO: "+route);
  if(route==="index.html"||route==="admin/index.html")continue;
  assert.ok(html.includes("data-v2-shared-header")&&html.includes("data-v2-shared-footer"),"Componente duplicado o faltante: "+route);
  assert.ok(html.includes("/v2/assets/shell-v2.js"),"No carga shell común: "+route);
  assert.ok(!html.includes("logo-tramipago.webp")&&!html.includes("Entorno de construcción"),"Logo o aviso anterior: "+route);
  assert.ok(!html.includes("Ver ficha →")&&!html.includes("Contenido legal pendiente"),"Texto pendiente: "+route);
}
assert.ok(pageFiles.length>=142,"Inventario HTML incompleto");
assert.ok(adminHtml.includes("/v2/assets/logo-horizontal-opcion-c.png"),"Admin usa identidad distinta");
for(const js of ["v2.js","flow-v2.js","shell-v2.js","legal-actions-v2.js"]) {
  const code=readFileSync(path.join(root,"assets",js),"utf8");
  assert.ok(!code.includes("Consulta de prueba registrada"),"Texto interno expuesto: "+js);
}
console.log("PASS CONTROL 4: "+unique.length+" rutas del manifiesto, "+pageFiles.length+" páginas HTML, 25 formularios y "+internalLinks+" enlaces/recursos locales");
