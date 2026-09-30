import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const code=read("services.js"),promos=read("promos.js"),app=read("app.js"),css=read("site.css"),index=read("index.html"),lawyerHeader=read("lawyer-header-badge.js");
const win={addEventListener(){},scrollTo(){}};
const doc={addEventListener(){},getElementById(){return null;},querySelector(){return null;},querySelectorAll(){return[];},createElement(){return {}}};
const location={hash:"#/"};
class MutationObserver{observe(){}}
runInNewContext(code,{window:win,document:doc,location,MutationObserver,requestAnimationFrame(fn){fn();},setTimeout(fn){if(typeof fn==="function")fn();}},{filename:"services.js",timeout:3000});
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
assert.ok(css.includes('assets/abogado-fotos-20260918.avif'),"Las tarjetas jurídicas deben usar las fotos temáticas aprobadas");
for(const position of ['0%','33.333333%','66.666667%','100%']) assert.ok(css.includes('background-position-y:'+position),"Falta recorte temático de abogado: "+position);
assert.ok(index.includes('lawyer-header-badge.js'),"La cabecera jurídica restaurada debe cargarse");
assert.ok(lawyerHeader.includes('assets/abogado-cabecera-fotografica-20260918.png'),"La cabecera jurídica debe usar la imagen aprobada");
console.log("PASS: familia jurídica usa el flujo común, cuatro servicios activos y formularios propios.");
