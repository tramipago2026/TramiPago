import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=file=>readFileSync(file,'utf8');
const window={addEventListener(){},setTimeout(){},scrollTo(){}};
const document={getElementById(){return null;},createElement(){return {};},head:{appendChild(){}},addEventListener(){},querySelectorAll(){return [];}};
for(const name of ['services.js','arca-family.js','extra-families.js'])runInNewContext(read(name),{window,document,location:{hash:'#/'},setTimeout(){}},{filename:name,timeout:3000});
const all=window.TRAMI_SERVICES;
assert.equal(all.length,23,'El catálogo debe conservar los 23 servicios');
assert.equal(all.filter(item=>item.active&&!item.intakeOnly).length,18,'No desactivar trámites con honorarios');
const ap=all.find(item=>item.id==='antecedentes-penales');
assert.deepEqual(Array.from(ap.priceOptions,p=>[p.value,p.amount]),[['one-hour',20000],['six-hours',15000]],'Conservar ambas modalidades AP');
for(const service of all){
  const presented=[service.description,...(service.requirements||[]),...(service.components||[]),...(service.fields||[]).map(f=>f.label||'')].join('\n');
  assert.doesNotMatch(presented,/(?:arancel|costo|tasa)\s+oficial[^\n]{0,100}\$\s*[\d.,]+|\$\s*[\d.,]+[^\n]{0,100}(?:arancel|costo|tasa)\s+oficial/i,`${service.id}: monto oficial explícito en el catálogo`);
}
const app=read('app.js');
assert.doesNotMatch(app, /<h3>Costo oficial<\/h3>|<span>Costo oficial<\/span>|Arancel oficial aparte:/, 'No volver a crear filas de arancel oficial en las pantallas');
assert.match(app,/Honorarios de gestión TramiPago/,'El cobro visible corresponde a la gestión');
assert.doesNotMatch(app,/<small>"Honorarios de gestión TramiPago"<\/small>/,'Etiqueta sin comillas literales');
const index=read('index.html');
for(const name of ['app.js','services.js','extra-families.js'])assert.ok(index.includes(name+'?v=20260921-directivas1'),`Caché antigua: ${name}`);
console.log('PASS: 23 servicios/18 pagos; modalidades AP $20.000 y $15.000 intactas, ningún monto oficial en textos de catálogo, precio visible como honorarios y recursos versionados.');
console.log('LÍMITE: prueba estructural en memoria, no cobro, entrega, conexión ni publicación.');