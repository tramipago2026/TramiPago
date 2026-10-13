import assert from "node:assert/strict";
import { Script } from "node:vm";
import {createHash} from "node:crypto";
import {readFileSync, existsSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const {execFileSync}=await import("node:child_process");
execFileSync(process.execPath,[path.join(root,"scripts/build-shell.mjs"),"--check"],{stdio:"inherit"});
const manifest = JSON.parse(readFileSync(path.join(root, "rutas-v2.json"), "utf8"));
assert.equal(existsSync(path.join(root, "data", "official-services-2026-10-12.json")), false, "La documentación de validación interna no debe publicarse en V2");
const clientScript = readFileSync(path.join(root, "assets", "v2.js"), "utf8");
assert.ok(!clientScript.includes("Información oficial verificada"), "Control interno expuesto en ficha pública");
assert.ok(!/Guardar borrador|Borrador guardado/.test(clientScript), "Jerga de construcción en formulario público");
const paymentFlow = readFileSync(path.join(root, "assets", "flow-v2.js"), "utf8");
assert.ok(paymentFlow.includes('health?.dependencies?.b2==="configured" && health?.dependencies?.payments==="configured"'), "El frontend permite comprobantes sin pago habilitado");
const formSchema = JSON.parse(readFileSync(path.join(root, "data", "form-schema-v2.json"), "utf8"));
const tariffs = JSON.parse(readFileSync(path.join(root,"data","tarifario-v1-v2.json"),"utf8"));
const bank = JSON.parse(readFileSync(path.join(root,"data","medio-pago-v1-v2.json"),"utf8"));
assert.equal(bank.enabled,false,"No activar cobros sin B2 TEST, precios verificados y autorización");
assert.equal(bank.provider,"transferencia","Medio de pago V1 perdido");
assert.ok(bank.alias&&bank.cvu&&bank.holder,"Datos de transferencia V1 incompletos");
assert.match(paymentFlow,/data\.quotedAmount\s*!==\s*null/,"El pago no controla el importe cotizado");

assert.equal(Object.keys(tariffs.services).length,25,"Las 25 fichas deben conservar su tarifa de V1 o falta de precio");
assert.equal(Object.values(tariffs.services).filter(s=>s.options.length>0).length,20,"Conteo de servicios tarifados V1 inesperado");
assert.equal(Object.values(tariffs.services).flatMap(s=>s.options).length,22,"Conteo de modalidades V1 inesperado");
assert.deepEqual(tariffs.services["antecedentes-penales"].options.map(o=>o.amount),[20000,15000],"Modalidades penales alteradas");
assert.equal(tariffs.services["certificado-domicilio-pba"].options[0].amount,20000,"Precio final de domicilio PBA alterado");
assert.equal(tariffs.services["certificado-domicilio-pba"].officialFeeIncluded,true,"La tasa de domicilio PBA debe quedar incluida");
assert.equal(tariffs.services["certificacion-estado-civil"].officialFeeExternal,true,"Tasa externa de estado civil no diferenciada");
assert.ok(clientScript.includes("/v2/data/tarifario-v1-v2.json"),"Formulario no muestra tarifario V1");
assert.ok(paymentFlow.includes("data.quotedAmount"),"El flujo no muestra importe cotizado desde MySQL");
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
    if (stage === "pago") {
      assert.ok(!/Pago de prueba/i.test(stageHtml), "Texto de prueba visible en pago: " + service.id);
      assert.ok(stageHtml.includes("Pago de la solicitud"), "Título de pago no homologado: " + service.id);
    }
  }
}
const homeHtml = readFileSync(path.join(root, "index.html"), "utf8");
const sharedShell = readFileSync(path.join(root, "assets", "shell-v2.js"), "utf8");
assert.ok(homeHtml.includes("/v2/assets/logo-horizontal-opcion-c.png") && sharedShell.includes("/v2/assets/logo-horizontal-opcion-c.png"), "La portada y las páginas internas no comparten logo aprobado");
const approvedAssets = JSON.parse(readFileSync(path.join(root,"assets","opcion-c-assets.json"),"utf8"));
const approvedLogo = approvedAssets.assets.find(item => item.path==="v2/assets/logo-horizontal-opcion-c.png");
assert.ok(approvedLogo,"Falta la referencia maestra del logo aprobado");
const logoBytes = readFileSync(path.join(root,"assets","logo-horizontal-opcion-c.png"));
assert.equal(createHash("sha256").update(logoBytes).digest("hex"),approvedLogo.sha256,"Logo PNG distinto del recurso aprobado");
assert.equal(logoBytes.subarray(0,8).toString("hex"),"89504e470d0a1a0a","Firma PNG inválida");
assert.deepEqual([logoBytes.readUInt32BE(16),logoBytes.readUInt32BE(20)],approvedLogo.canvas,"Dimensiones PNG modificadas");
assert.equal(logoBytes[25],6,"El logo aprobado debe conservar canal alfa RGBA");
const catalogHtml = readFileSync(path.join(root, "tramites", "index.html"), "utf8");
assert.ok(!catalogHtml.includes("sólo se activarán después de sus controles"), "Texto de construcción en catálogo");
const trackingHtml = readFileSync(path.join(root, "seguimiento", "index.html"), "utf8");
assert.ok(trackingHtml.includes("data-v2-tracking-form"), "Seguimiento V2 no funcional");
const adminHtml = readFileSync(path.join(root, "admin", "index.html"), "utf8");
assert.ok(adminHtml.includes("data-admin-login-form"), "Admin V2 sin login");
assert.ok(adminHtml.includes("data-admin-enroll-form"), "Admin V2 sin enrolamiento MFA");

for (const slug of ["terminos-condiciones","politica-privacidad","arrepentimiento","baja-servicio"]) {
  const html=readFileSync(path.join(root,slug,"index.html"),"utf8");
  assert.ok(html.includes("data-v2-shared-header")&&html.includes("shell-v2.js"),"Falta shell: "+slug);
  assert.ok(!html.includes("Contenido legal pendiente")&&html.includes("<article>")&&html.includes("</article>"),"Página legal sin contenido: "+slug);
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
  assert.equal((html.match(/<main\b/g)||[]).length,1,"Debe existir un único contenido principal: "+route);
  assert.equal((html.match(/<h1\b/g)||[]).length,1,"Debe existir un solo título principal: "+route);
  assert.ok(!/href="#"/i.test(html),"Enlace de navegación sin destino: "+route);
  // TramiPago V2 no depende de enlaces oficiales externos: las fuentes se citan como texto.
  // Mantener los canales legales internos y las verificaciones de contenido obligatorias.
  for (const match of html.matchAll(/<a\b[^>]*\bhref\s*=\s*["'](https?:\/\/[^"']+)["']/gi)) {
    const domain = new URL(match[1]).hostname.toLowerCase();
    assert.ok(!/(?:^|\.)(?:gob\.ar|gov\.ar|gov|gub\.uy)$/.test(domain),
      "Enlace gubernamental externo activo en V2: " + route + " → " + domain);
  }
  for(const image of html.match(/<img\b[^>]*>/g)||[]) {
    assert.match(image,/\balt="/,"Imagen sin atributo alternativo: "+route);
  }
  if(route==="index.html"||route==="admin/index.html")continue;
  assert.ok(html.includes("data-v2-shared-header")&&html.includes("data-v2-shared-footer"),"Componente duplicado o faltante: "+route);
  assert.ok(html.includes("/v2/assets/shell-v2.js"),"No carga shell común: "+route);
  assert.ok(!html.includes("logo-tramipago.webp")&&!html.includes("Entorno de construcción"),"Logo o aviso anterior: "+route);
  assert.ok(!html.includes("Ver ficha →")&&!html.includes("Contenido legal pendiente"),"Texto pendiente: "+route);
}
assert.ok(pageFiles.length>=142,"Inventario HTML incompleto");
assert.ok(adminHtml.includes("/v2/assets/logo-horizontal-opcion-c.png"),"Admin usa identidad distinta");
for(const js of ["v2.js","flow-v2.js","shell-v2.js","legal-actions-v2.js","progress-v2.js","admin-v2.js"]) {
  const code=readFileSync(path.join(root,"assets",js),"utf8");
  assert.doesNotThrow(() => new Script(code, {filename: js}), "Sintaxis JS inválida: "+js);
  assert.ok(!/solicitud de prueba|comprobante de prueba|entorno de prueba/i.test(code),"Texto de pruebas visible: "+js);
}
await import("./legal-actions.test.mjs");
await import("./progress-v2.test.mjs");
await import("./tracking-v2.test.mjs");
await import("./search-empty.test.mjs");
await import("./flow-states.test.mjs");
console.log("PASS CONTROL 4: "+unique.length+" rutas del manifiesto, "+pageFiles.length+" páginas HTML, 25 formularios y "+internalLinks+" enlaces/recursos locales");
