// Prueba aislada: solo montaje e integración; no envía consultas ni realiza cobros.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFileSync(resolve(root,path),'utf8');
const script=read('legal-landing-20260917.js');
const css=read('legal-landing-20260917.css');
const search=read('catalog-search.js');
const appCode=read('app.js');
const families=read('extra-families.js');
assert.ok(search.includes('import("./legal-landing-20260917.js'),'Landing cargada por el sitio');
assert.ok(appCode.includes('if (action === "select-service") return startService(trigger.dataset.serviceId)'),'Los CTA usan el gestor existente de formularios');
for(const service of ['abogado-art','abogado-accidentes','abogado-sucesiones','abogado-laboral']) {
  assert.ok(families.includes('id:"'+service+'"'),'Formulario disponible: '+service);
}
assert.ok(existsSync(resolve(root,'assets','header-consulta-legal-20260917.svg')),'Se reutiliza arte aprobado/existente');
assert.ok(css.includes('@media(max-width:980px)')&&css.includes('@media(max-width:680px)')&&css.includes('@media(max-width:420px)'),'Diseño adaptable');
assert.ok(!/1125013650|abogadosart\.com\.ar|consulta gratuita|honorarios a resultado exitoso|miles de casos/i.test(script),'No se importan teléfonos ni promesas comerciales del sitio de referencia');
let hero='',after='',style=null,changeHandler=null;
const grid={querySelectorAll:()=>[1,2,3,4],insertAdjacentHTML(_position,markup){after=markup;}};
const heading={insertAdjacentHTML(_position,markup){hero=markup;}};
const shell={querySelector(selector){return ({'.family-heading':heading,'.family-service-grid':grid})[selector]||null;}};
const page={classList:{added:false,contains(value){return value==='legal-landing'&&this.added;},add(value){if(value==='legal-landing')this.added=true;}},querySelector(selector){return selector==='.family-shell'?shell:null;}};
const app={querySelector(selector){return selector==='.family-page'?page:null;}};
const doc={readyState:'complete',head:{appendChild(el){style=el;}},getElementById(id){return id==='app'?app:id==='tramipago-legal-landing-style'?style:null;},createElement(tag){return {tag};},addEventListener(){}};
const win={addEventListener(name,handler){if(name==='hashchange')changeHandler=handler;}};
const location={hash:'#/familia/atencion-abogado'};
class Observer{observe(){}}
runInNewContext(script,{document:doc,window:win,location,MutationObserver:Observer,requestAnimationFrame(fn){fn();}});
assert.equal(page.classList.added,true,'Se reconoce la sección correcta');
assert.ok(hero.includes('Dr. Francisco Liberatore'),'Nombre del abogado del proyecto');
assert.ok(hero.includes('Consultas por')&&hero.includes('ART y accidentes laborales'),'Prioridad ART');
assert.ok(hero.includes('id="legal-consultas"'),'Enlace interno a otras opciones');
assert.ok((hero.match(/class="legal-case"/g)||[]).length===6,'Seis motivos explicados');
assert.ok((hero.match(/data-service-id="abogado-art"/g)||[]).length===7,'Seis temas y CTA principal apuntan al mismo formulario existente');
assert.ok(after.includes('Preguntas frecuentes')&&after.includes('Cómo funciona'),'Secciones informativas completas');
assert.ok(after.includes('No. En esta sección solo enviás una solicitud'),'Sin afirmar gratuidad no confirmada');
assert.ok(after.includes('id="legal-contact-title"'),'Contacto final coordinado por TramiPago');
assert.ok(style.href.includes('legal-landing-20260917.css'),'Se carga estilo dedicado');
const oldHero=hero;
changeHandler();
assert.equal(hero,oldHero,'No se duplican las secciones ante navegación repetida');
console.log('PASS: presentación ART, 6 temas, 4 formularios, preguntas frecuentes, estilo responsive y sin contacto ajeno.');
console.log('Límite: prueba de integración DOM simulada; faltan verificación visual y envío controlado en producción.');
