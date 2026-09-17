import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const promos = read('promos.js');
const search = read('catalog-search.js');
const catalog = read('tramites.html');
const page = read('municipales.html');

// Control estático de recorrido: no sustituye pruebas con datos de contribuyentes.
assert.match(promos, /promo-municipal-20260911\.webp[^\n]*href:"municipales\.html"/, 'El anuncio debe abrir Municipales en lugar de un WhatsApp genérico');
assert.match(promos, /function ensureMunicipalEntry\(/, 'Falta la entrada municipal en el inicio');
assert.match(promos, /ensureMunicipalEntry\(\);/, 'La entrada del inicio no está montada');
assert.match(promos, /link\.href="municipales\.html"/, 'La entrada del inicio carece de destino');
assert.match(search, /title:"Trámites municipales: San Miguel y José C\. Paz"/, 'La búsqueda no indexa municipales');
assert.match(search, /href:"municipales\.html"/, 'La búsqueda no conduce a la sección municipal');
assert.match(catalog, /<h2>Trámites municipales — San Miguel y José C\. Paz<\/h2>/, 'Municipales no aparece en Todos los trámites');
assert.match(catalog, /href="municipales\.html"/, 'El listado no vincula la sección municipal');
assert.match(page, /id="san-miguel"/, 'Falta San Miguel');
assert.match(page, /id="jose-paz"/, 'Falta José C. Paz');
assert.match(page, /https:\/\/pagos\.msm\.gov\.ar\//, 'Falta el portal de San Miguel');
assert.match(page, /https:\/\/josecpaz\.gob\.ar\//, 'Falta el dominio oficial de José C. Paz');
assert.ok(page.includes('municipal%20de%20San%20Miguel'), 'WhatsApp debe identificar a San Miguel');
assert.ok(page.includes('municipal%20de%20Jos%C3%A9%20C.%20Paz'), 'WhatsApp debe identificar a José C. Paz');
assert.match(page, /No se comprobó un portal web/, 'No se debe prometer un portal web no verificado');
assert.match(page, /honorarios|Honorarios|precio/, 'La asistencia debe identificar sus condiciones comerciales');
assert.ok(fs.existsSync(new URL('../assets/logo-tramipago.webp', import.meta.url)), 'Falta el logo');
assert.ok(fs.existsSync(new URL('../assets/promo-municipal-20260911.webp', import.meta.url)), 'Falta la imagen municipal reutilizada');
console.log('PASS municipal: carrusel, inicio, buscador, catálogo, destinos, mensajes y recursos locales.');
console.log('Límite: prueba estática; no valida operaciones con contribuyentes ni pagos municipales.');
