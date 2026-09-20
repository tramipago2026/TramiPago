// Corrección quirúrgica EN RAMA de desarrollo, detenida ante cualquier diferencia de versión.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const read=name=>readFileSync(join(root,name),'utf8');
const save=(name,before,after)=>{assert.notEqual(after,before,'Sin modificación '+name);writeFileSync(join(root,name),after);console.log('MODIFICADO: '+name);};
function once(source,before,after,label){assert.equal(source.split(before).length,2,'La referencia cambió o está duplicada: '+label);return source.replace(before,after);}
const app=read('app.js');
const begin=app.indexOf('  function renderServiceSummary(service) {');
const end=app.indexOf('  const PARTIDAS_TYPE_CARDS',begin);
assert.ok(begin>=0&&end>begin&&end-begin<2500,'No se identificó exactamente la función de ficha comercial');
const old=app.slice(begin,end);
assert.match(old,/<h3>Costo oficial<\/h3>/);
assert.match(old,/<span>Costo oficial<\/span>/);
const replacement=`  function renderServiceSummary(service) {
    return \`
      <div class="service-summary">
        \${(service.components || []).length ? \`
          <div class="service-summary-block">
            <h3>Incluye</h3>
            <ul class="requirements">\${service.components.map((item) => \`<li>\${escapeHTML(item)}</li>\`).join("")}</ul>
          </div>
        \` : ""}
        <div class="service-summary-block">
          <h3>Requisitos</h3>
          <ul class="requirements">\${(service.requirements || []).map((item) => \`<li>\${escapeHTML(item)}</li>\`).join("")}</ul>
        </div>
        \${service.intakeOnly ? "" : \`
          <div class="service-summary-block">
            <h3>Precio y plazo</h3>
            \${renderPriceOptions(service)}
          </div>
        \`}
      </div>
    \`;
  }

`;
const nextApp=app.slice(0,begin)+replacement+app.slice(end);
assert.doesNotMatch(nextApp,/<h3>Costo oficial<\/h3>|<span>Costo oficial<\/span>/);
const extra=read('extra-families.js');
let nextExtra=once(extra,'Arancel oficial TAD de apostilla: $4.500 por documento, abonado aparte por VEP al organismo. El precio de TramiPago no incluye ese arancel.','Si corresponde un arancel del organismo, se informa antes de continuar y se abona aparte por el canal correspondiente.','apostilla');
nextExtra=once(nextExtra,'Si corresponde legalización internacional por TAD, el arancel oficial general es $4.500; solo para partidas de estado civil es $1.500. Otras vías pueden tener costos distintos o ser gratuitas. Se paga aparte, según organismo.','Si corresponde un arancel del organismo, se informa antes de continuar y se paga aparte por el canal correspondiente.','legalizaciones');
const index=read('index.html');
let nextIndex=once(index,'app.js?v=20260916-audit2','app.js?v=20260920-hide-official-fee1','cache app');
nextIndex=once(nextIndex,'extra-families.js?v=20260916-audit2','extra-families.js?v=20260920-hide-official-fee1','cache extra');
const smoke=read('tests/live-site-smoke.mjs');
const nextSmoke=once(smoke,'app.js?v=20260916-audit2','app.js?v=20260920-hide-official-fee1','expectativa de cache en prueba HTTP');
assert.ok(nextApp.includes('function getPricing(service, values)'),'No alterar lógica comercial');
assert.ok(nextExtra.includes('amount:20000')&&nextExtra.includes('amount:15000'),'Honorarios intactos');
assert.ok(nextIndex.includes('site.css?v=20260919-front-audit-v4'),'CSS aprobado intacto');
for(const [name,before,after] of [['app.js',app,nextApp],['extra-families.js',extra,nextExtra],['index.html',index,nextIndex],['tests/live-site-smoke.mjs',smoke,nextSmoke]])save(name,before,after);
console.log('Parche aplicado en checkout temporal. No borrar recursos sin demostrar ausencia de dependencias.');
