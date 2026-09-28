import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const code=read("services.js"),promos=read("promos.js"),app=read("app.js");
const win={};
runInNewContext(code,{window:win},{filename:"services.js",timeout:3000});
const family=(win.TRAMI_FAMILIES||[]).find(f=>f.id==="atencion-abogado");
assert.ok(family&&family.serviceIds.length===4,"Consulta con abogado debe tener cuatro opciones");
for(const id of family.serviceIds){
  const service=(win.TRAMI_SERVICES||[]).find(s=>s.id===id);
  assert.ok(service?.active&&service?.intakeOnly,"Servicio jurídico inválido: "+id);
  assert.ok(Array.isArray(service.fields)&&service.fields.length>=4,"Formulario jurídico incompleto: "+id);
}
assert.ok(promos.includes('href:"#/familia/atencion-abogado"'),"Promoción no conduce a la familia jurídica");
assert.ok(app.includes("renderFamilyService"),"Familia jurídica no usa el renderer común");
assert.ok(!/consulta gratuita|honorarios a resultado exitoso/i.test(code),"Promesa comercial no permitida en catálogo jurídico");
console.log("PASS: familia jurídica usa el flujo común, cuatro servicios activos y formularios propios.");
