import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const promos = read('promos.js');
const search = read('catalog-search.js');
const catalog = read('tramites.html');
const page = read('municipales.html');
const logo = 'assets/logo-tramipago.webp';

// No confundir comprobación estática de rutas con una prueba de operaciones reales.
assert.match(promos, /promo-municipal-20260911\.webp[^\n]*href:"municipales\.html"/, 'La publicidad municipal debe abrir la sección municipal, no WhatsApp genérico');
assert.match(promos, /function ensureMunicipalEntry\(/, 'Debe existir una entrada municipal visible en el inicio');
assert.match(promos, /ensureMunicipalEntry\(\);/, 'La entrada municipal debe incorporarse efectivamente al montaje de inicio');
assert.match(promos, /link\.href="municipales\.html"/, 'La entrada del inicio debe apuntar a la página municipal');
assert.match(search, /title:"Trámites municipales: San Miguel y José C\. Paz"/, 'El buscador debe indexar la categoría municipal');
assert.match(search, /href:"municipales\.html"/, 'El resultado municipal debe abrir una ruta válida');
assert.match(catalog, /<h2>Trámites municipales — San Miguel y José C\. Paz<\/h2>/, 'El listado completo debe mostrar la categoría municipal');
assert.match(catalog, /href="municipales\.html"/, 'El listado completo debe permitir abrir el servicio municipal');
assert.match(page, /id="san-miguel"/, 'Falta San Miguel');
assert.match(page, /id="jose-paz"/, 'Falta José C. Paz');
assert.match(page, /https:\/\/pagos\.msm\.gov\.ar\//, 'Falta el portal comprobado de San Miguel');
assert.match(page, /https:\/\/josecpaz\.gob\.ar\//, 'Falta el dominio oficial de José C. Paz');
assert.match(page, /municipal%20de%20San%20Miguel/, 'El mensaje de San Miguel debe identificar su origen');
assert.match(page, /municipal%20de%20Jos%C3%A9%20C\.\%20Paz|municipal%20de%20Jos%C3%A9%20C\.\%20Paz|municipal%20de%20Jos%C3%A9%20C\.\%20Paz|municipal%20de%20Jos%C3%A9%20C\.\%20Paz/, 'El mensaje de José C. Paz debe identificar su origen');
assert.match(page, /sin un portal web|No se comprobó un portal web/, 'No atribuir al municipio funciones sin comprobar');
assert.match(page, /honorarios|Honorarios|precio/, 'La asistencia no debe esconder condiciones comerciales');
assert.ok(fs.existsSync(new URL(`../${logo}`, import.meta.url)), 'Falta el logo oficial');
assert.ok(fs.existsSync(new URL('../assets/promo-municipal-20260911.webp', import.meta.url)), 'Falta la imagen municipal usada en el inicio y el carrusel');
console.log('PASS municipal: carrusel, inicio, búsqueda, catálogo, dos municipios, fuentes, mensajes y recursos locales.');
console.log('Límite: esta prueba estática no verifica consultas, emisión de boletas ni pagos en los portales municipales.');
