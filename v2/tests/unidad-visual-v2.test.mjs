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
