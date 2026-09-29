import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const index=read("index.html");
const shell=read("shared-site-shell.css");
const services=read("services.js");
const app=read("app.js");
const pages=["contacto.html","tramites.html","municipales.html","opiniones.html","politica-privacidad.html","terminos-condiciones.html","arrepentimiento.html","baja-servicio.html"].map(read);

for(const needle of ['class="nav-home"','class="nav-tracking"','class="nav-help"',"Ver mi trámite"])assert.ok(index.includes(needle),"Cabecera principal incompleta: "+needle);
assert.ok(index.includes('href="#/"')&&index.includes('href="#/seguimiento"'),"Rutas Inicio/Ver mi trámite incorrectas");
assert.ok(app.includes('data-action="whatsapp"')||index.includes('data-action="whatsapp"'),"Ayuda WhatsApp no conectada");
assert.ok(services.includes('id:"atencion-abogado"')&&services.includes('abogado-art')&&services.includes('abogado-laboral'),"Familia de abogado incompleta");
assert.ok(shell.includes(".shared-site-header")&&shell.includes(".header-legal")&&shell.includes(".main-nav"),"Shell compartido sin cabecera vigente");
for(const [i,page] of pages.entries()){
  for(const needle of ['class="nav-home"','class="nav-tracking"','class="nav-help"',"Ver mi trámite","wa.me/5491167083232"])assert.ok(page.includes(needle),"Página pública "+i+" sin "+needle);
}
console.log("PASS: cabecera vigente, navegación, Ver mi trámite, WhatsApp y acceso a abogado presentes sin módulos históricos.");
