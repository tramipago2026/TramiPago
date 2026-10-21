// CONTROL 4 complementario: contrato visual V2 sin modificar rutas ni lógica.
import assert from "node:assert/strict";
import fs from "node:fs";
const root=new URL("../",import.meta.url);
const read=(file)=>fs.readFileSync(new URL(file,root),"utf8");
const css=["assets/v2.css","assets/portada-opcion-c.css","assets/request-flow-v2.css","assets/admin-layout.css"];
for(const f of css){
 const s=read(f);
 assert.match(s,/TRAMIPAGO-V2-UNIDAD-VISUAL-20261020/,f+" tiene reglas de unidad");
 assert.equal((s.match(/\{/g)||[]).length,(s.match(/\}/g)||[]).length,f+" llaves CSS");
}
const global=read(css[0]),home=read(css[1]),flows=read(css[2]),admin=read(css[3]);
assert.match(global,/--tp-brand:/);
assert.match(global,/\.text-card:focus-visible/);
assert.match(global,/prefers-reduced-motion/);
assert.match(home,/\.card-photo:focus-visible/);
assert.match(home,/\.hero-shell:before,\.home-opcion-c \.hero-shell:after\{content:none/);
assert.match(flows,/\.request-page \.request-group/);
assert.match(admin,/body\.admin-v2-page \.admin-panel/);
const index=read("index.html");
for(const route of ["/v2/tramites/","/v2/seguimiento/","/v2/ayuda/","/v2/buscar/"]){
 assert.ok(index.includes(route),"conservar navegación y buscador "+route);
}
for(const path of ["terminos-condiciones","politica-privacidad","arrepentimiento","baja-servicio"]){
 assert.ok(index.includes("/v2/"+path+"/"),"conservar legal "+path);
}
console.log("PASS V2 contrato de unidad visual (estático; no sustituye validación navegador)");
// TP-V2-CIERRE-UNIDAD: verificar que el cambio de estilo no requiera duplicar el motor.
for(const file of css){
 const sheet=read(file);
 assert.match(sheet,/TP-V2-CIERRE-UNIDAD/,"cierre visual en "+file);
}
assert.match(global,/\.categories-content \.card-photo img/);
assert.match(global,/\.contact-card/);
assert.match(flows,/\.price-choice-button\.selected/);
assert.match(admin,/body\.admin-v2-page \[data-admin-detail\]/);
for(const route of ["/v2/tramites/antecedentes-penales/","/v2/tramites/constancias-anses/","/v2/tramites/informe-vehicular/","/v2/tramites/arba-inmobiliario/"]){
 assert.ok(index.includes(route),"trámite destacado conservado: "+route);
}

const heroBytes=fs.readFileSync(new URL("assets/hero-pareja-45-50-aprobada.webp",root));
const {createHash}=await import("node:crypto");
const gitHash=createHash("sha1").update(Buffer.from("blob "+heroBytes.length+"\\0".replace("\\0","\0"))).update(heroBytes).digest("hex");
assert.equal(gitHash,"131b93f644bdade05c47fa013c3c26d012663a34","fotografía aprobada verificada por contenido");
assert.ok(index.includes("/v2/assets/hero-pareja-45-50-aprobada.webp"),"portada apunta a la fotografía aprobada");
assert.ok(!index.includes("/v2/assets/hero-opcion-c-aprobada.jpg"),"no conserva la referencia visual anterior");

// Fotografías tomadas de las ocho tarjetas en la maqueta expresamente aprobada.
const approvedCards=new Map([
  ["home-abogado-aprobada.webp","a31b7964048b1a356e6733979ecdf7832326bdcd"],
  ["home-anses-aprobada.webp","251232695fe1392b0f49bb09facd7879f9b9cd55"],
  ["home-antecedentes-aprobada.webp","7b25e36e6d375edbe82b14e31e8f8229fe47643e"],
  ["home-apostillas-aprobada.webp","8bbb77344c2afb43fddaa1580766dc4e88d983f2"],
  ["home-arba-aprobada.webp","cfac2d332a564f6aa460e979ca133f0bb37a081f"],
  ["home-arca-aprobada.webp","f592fd8720eddb63c87b1e65d9c4f425b33a0f5b"],
  ["home-partidas-aprobada.webp","25ae9002a306e5f6d7462a6fd9fe788c4ded6e4e"],
  ["home-vehicular-aprobada.webp","e1fa1e100edefd1998845678cfedd98451410ae3"]
]);
for(const [name,expectedHash] of approvedCards){
 const bin=fs.readFileSync(new URL("assets/"+name,root));
 const got=createHash("sha1").update(Buffer.from("blob "+bin.length+"\\0".replace("\\0","\0"))).update(bin).digest("hex");
 assert.equal(got,expectedHash,"integridad foto "+name);
 assert.ok(index.includes("/v2/assets/"+name),"tarjeta aprobada presente: "+name);
}

// TP-V2-DISENO-INTEGRAL-26-1: controles de legibilidad y precios (sin cambiar importes).
assert.match(global,/TP-V2-DISENO-INTEGRAL-26-1/);
assert.match(global,/--tp-text-action:17px/);
assert.match(global,/--tp-action-disabled:/);
assert.match(global,/\.button\.secondary-button/);
assert.match(flows,/TP-V2-DISENO-INTEGRAL-26-1/);
assert.match(flows,/\.v2-price-summary/);
assert.match(flows,/request-actions\s*>\s*\.v2-price-summary/);
assert.match(flows,/\.price-choice-button\.selected/);
assert.match(admin,/TP-V2-DISENO-INTEGRAL-26-1/);
assert.match(home,/\.home-opcion-c \.card-photo img\{filter:none\}/);
assert.match(read("assets/v2.js"),/quoteNode\.className = "muted v2-price-summary"/);
assert.match(read("assets/flow-v2.js"),/p\.className="v2-price-summary"/);
console.log("PASS unidad integral 26.1: botones, tipografia, precio y ambitos visuales sin cambios de catalogo");

// MULTITERA-26-2: referencia aprobada de ocho familias, fuera de portada.
assert.match(global,/TP-V2-MUESTRA-INTERIORES-26-APROBADA/);
assert.match(global,/body:not\(\.home-opcion-c\) \.button/);
assert.match(global,/contact-email/);
assert.match(flows,/TP-V2-MUESTRA-PAGO-Y-FORMULARIOS-26-APROBADA/);
assert.match(flows,/\.v2-price-amount/);
assert.match(flows,/\.v2-bank-row/);
assert.match(flows,/form\.vertical>button\.button/);
assert.match(admin,/TP-V2-MUESTRA-ADMIN-26-APROBADA/);
const formSource=read("assets/v2.js"),paymentSource=read("assets/flow-v2.js");
assert.match(formSource,/quoteNode\.replaceChildren\(label,amount\)/);
assert.match(paymentSource,/destination\.classList\.add\("v2-bank-card"\)/);
assert.match(paymentSource,/code\.className="v2-confirmation-code"/);
assert.match(paymentSource,/method\.holder\.trim\(\)\.length>0/);
assert.match(paymentSource,/Number\(data\.quotedAmount\)>0/);
console.log("PASS MULTITERA-26-2 contrato muestra aprobada: pago, botones, banco, admin y portada aislada");
