import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
const path='site-fixes.js';
let source=readFileSync(path,'utf8');
function replace(oldText,newText){assert.equal(source.split(oldText).length,2,'Ancla de seguridad alterada: '+oldText);source=source.replace(oldText,newText);}
replace('        const hasResult = Boolean(document.querySelector(".tracking-result .status-header"));\n        if (hasResult && !submit.hasAttribute("data-tracking-new-query")) {',
`        const header = document.querySelector(".tracking-result .status-header");
        const hasResult = Boolean(header);
        // Solo volver a convertir el botón cuando el servidor presente otro resultado,
        // no mientras se escribe un nuevo código sobre el resultado anterior.
        if (form.dataset.trackingRequery === "true" && header && header !== form.__tramipagoPriorHeader) {
          delete form.dataset.trackingRequery;
          form.__tramipagoPriorHeader = null;
        }
        if (hasResult && form.dataset.trackingRequery !== "true" && !submit.hasAttribute("data-tracking-new-query")) {`);
replace('    input.value = "";\n    button.type = "submit";',
`    // El resultado anterior queda visible: el observador no debe bloquear una nueva consulta.
    form.__tramipagoPriorHeader = document.querySelector(".tracking-result .status-header");
    form.dataset.trackingRequery = "true";
    input.value = "";
    button.type = "submit";`);
writeFileSync(path,source);
const html='index.html';let index=readFileSync(html,'utf8');
const oldVersion='site-fixes.js?v=20260921-hint-single1',newVersion='site-fixes.js?v=20260921-reconsulta1';
assert.equal(index.split(oldVersion).length,2,'Versión de site-fixes.js inesperada');
index=index.replace(oldVersion,newVersion);
writeFileSync(html,index);
console.log('PASS: reconsulta no se bloquea por observador; botón permite consultas sucesivas tras nueva respuesta; diseño intacto.');