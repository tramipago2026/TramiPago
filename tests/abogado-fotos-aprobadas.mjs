import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const code=readFileSync(new URL("../services.js",import.meta.url),"utf8");
const win={addEventListener(){},scrollTo(){}};
const doc={addEventListener(){},getElementById(){return null;},querySelector(){return null;},querySelectorAll(){return[];},createElement(){return {}}};
const location={hash:"#/"};
class MutationObserver{observe(){}}
runInNewContext(code,{window:win,document:doc,location,MutationObserver,requestAnimationFrame(fn){fn();},setTimeout(fn){if(typeof fn==="function")fn();},{filename:"services.js",timeout:3000});
const services=win.TRAMI_SERVICES||[];
const family=(win.TRAMI_FAMILIES||[]).find(f=>f.id==="atencion-abogado");
assert.ok(family,"Falta familia de atención de abogado");
assert.equal(family.serviceIds.length,4,"La familia debe conservar cuatro consultas");
const expected=["abogado-art","abogado-accidentes","abogado-sucesiones","abogado-laboral"];
assert.deepEqual([...family.serviceIds].sort(),[...expected].sort(),"Servicios jurídicos inesperados");
for(const id of expected){
  const service=services.find(s=>s.id===id);
  assert.ok(service?.active&&service?.intakeOnly,"Consulta jurídica no activa/intake: "+id);
  assert.ok(service.fields.some(f=>f.id==="whatsapp"&&f.required),"Falta WhatsApp: "+id);
  assert.ok(service.fields.some(f=>f.id==="authorization"&&f.required),"Falta autorización: "+id);
}
console.log("PASS: cuatro consultas jurídicas vigentes, formularios y autorizaciones consistentes.");
