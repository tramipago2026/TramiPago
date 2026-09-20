// Parche de UNA SOLA EJECUCIÓN y solo sobre la rama de auditoría; no toca Supabase ni despliega el sitio.
// Los asserts detienen la ejecución si el código cambió o no coincide con lo auditado.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,unlinkSync,readdirSync,statSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
function read(path){return readFileSync(join(root,path),'utf8');}
function save(path,old,new){assert.notEqual(new,old,'Parche sin modificaciones: '+path);writeFileSync(join(root,path),new);console.log('MODIFICADO: '+path);}
function once(text,before,after,label){assert.equal(text.split(before).length,2,'Coincidencia distinta de una para '+label);return text.replace(before,after);}
const app=read('app.js');
const start=app.indexOf('  function renderServiceSummary(service) {');
const end=app.indexOf('  const PARTIDAS_TYPE_CARDS',start);
assert.ok(start>=0&&end>start&&end-start<2400,'No se identificó exclusivamente la ficha comercial.');
const oldFunction=app.slice(start,end);
assert.match(oldFunction,/<h3>Costo oficial<\/h3>/);
assert.match(oldFunction,/<span>Costo oficial<\/span>/);
const newFunction=`  function renderServiceSummary(service) {
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
const appPatched=app.slice(0,start)+newFunction+app.slice(end);
assert.doesNotMatch(appPatched,/<h3>Costo oficial<\/h3>|<span>Costo oficial<\/span>/);
const extra=read('extra-families.js');
const apostillaOld='Arancel oficial TAD de apostilla: $4.500 por documento, abonado aparte por VEP al organismo. El precio de TramiPago no incluye ese arancel.';
const apostillaNew='Si corresponde un arancel del organismo, se informa antes de continuar y se abona aparte por el canal correspondiente.';
const legalOld='Si corresponde legalización internacional por TAD, el arancel oficial general es $4.500; solo para partidas de estado civil es $1.500. Otras vías pueden tener costos distintos o ser gratuitas. Se paga aparte, según organismo.';
const legalNew='Si corresponde un arancel del organismo, se informa antes de continuar y se paga aparte por el canal correspondiente.';
let extraPatched=once(extra,apostillaOld,apostillaNew,'importe oficial de apostillado');
extraPatched=once(extraPatched,legalOld,legalNew,'importes oficiales de legalización');
const index=read('index.html');
let indexPatched=once(index,'app.js?v=20260916-audit2','app.js?v=20260920-hide-official-fee1','caché app.js');
indexPatched=once(indexPatched,'extra-families.js?v=20260916-audit2','extra-families.js?v=20260920-hide-official-fee1','caché extra-families.js');
const smoke=read('tests/live-site-smoke.mjs');
const smokePatched=once(smoke,'app.js?v=20260916-audit2','app.js?v=20260920-hide-official-fee1','prueba de versión publicada');
// Validar todo ANTES de escribir y evitar cualquier alteración de precios.
assert.ok(appPatched.includes('function getPricing(service, values)'));
assert.ok(extraPatched.includes('amount:20000')&&extraPatched.includes('amount:15000'));
assert.ok(indexPatched.includes('site.css?v=20260919-front-audit-v4'));
save('app.js',app,appPatched);
save('extra-families.js',extra,extraPatched);
save('index.html',index,indexPatched);
save('tests/live-site-smoke.mjs',smoke,smokePatched);
// No vaciar la caché ni datos personales del navegador: no tenemos acceso a ellos. Versiones nuevas fuerzan JS actualizado al publicar.
// Recurso antiguo: borrar exclusivamente si NO aparece en ningún otro texto del repositorio, incluidos tests y workflows.
const target='justice-balanza-martillo-20260918.svg';
function walk(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>{
  if(['.git','node_modules','assets'].includes(e.name))return [];
  const path=join(dir,e.name);return e.isDirectory()?walk(path):[path];
});}
const usages=walk(root).filter(path=>statSync(path).size<500000&&/\.(?:html|css|js|mjs|md|yml|yaml|json|txt)$/.test(path)).filter(path=>readFileSync(path,'utf8').includes(target));
if(usages.length){console.log('CONSERVADO (hay referencias): '+target+' en '+usages.map(path=>path.replace(root+'/','')).join(', '));}
else{unlinkSync(join(root,'assets',target));console.log('RETIRADO DE RAMA (recuperable desde backup): assets/'+target);}
console.log('Parche terminado en carpeta del runner; falta ejecutar pruebas antes de hacer commit.');
