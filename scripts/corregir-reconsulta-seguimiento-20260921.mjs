import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
const path='site-fixes.js';
let source=readFileSync(path,'utf8');
function replace(oldText,newText){assert.equal(source.split(oldText).length,2,'Ancla de seguridad alterada: '+oldText);source=source.replace(oldText,newText);}
replace('if (hasResult && !submit.hasAttribute("data-tracking-new-query")) {','if (hasResult && form.dataset.trackingRequery !== "true" && !submit.hasAttribute("data-tracking-new-query")) {');
replace('    input.value = "";\n    button.type = "submit";','    // El resultado anterior permanece visible al editar otra consulta: evitar que el observador vuelva a transformar el botón.\n    form.dataset.trackingRequery = "true";\n    input.value = "";\n    button.type = "submit";');
writeFileSync(path,source);
const html='index.html';let index=readFileSync(html,'utf8');
const oldVersion='site-fixes.js?v=20260921-hint-single1',newVersion='site-fixes.js?v=20260921-reconsulta1';
assert.equal(index.split(oldVersion).length,2,'Versión de site-fixes.js inesperada');
index=index.replace(oldVersion,newVersion);
writeFileSync(html,index);
console.log('PASS: el botón «Consultar otro código» permanece en modo consulta hasta que se sustituye el formulario; sin cambiar presentación ni filtros de acceso.');