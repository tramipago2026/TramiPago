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
