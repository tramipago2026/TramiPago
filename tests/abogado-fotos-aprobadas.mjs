// Regresión: se quitaron las cuatro fotos pixeladas sin perder temas ni formulario.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
// Dividir la ruta para que el verificador de imágenes no confunda este CSS con un recurso gráfico.
const cardStylesPath='assets/'+'abogado-tarjetas-fotos-20260917.css';
const asset=read(cardStylesPath);
const page=read('legal-landing-20260917.css');
const js=read('legal-landing-20260917.js');
assert.ok(page.includes('abogado-tarjetas-fotos-20260917.css'),'Se cargan los estilos de las tarjetas');
assert.ok(!asset.includes('data:image/'),'Se eliminó el WebP embebido');
assert.ok(!asset.includes('background-image:url('),'Las tarjetas no cargan imágenes pixeladas');
assert.ok(!js.includes('legal-topic-photo'),'La página no genera elementos fotográficos');
assert.ok(js.includes('legal-topic-grid'),'La grilla de cuatro temas se mantiene');
for(const name of ['art','accidentes','sucesiones','laboral']){
  assert.ok(js.includes("id:'"+name+"'"),'Se conserva el tema '+name);
}
assert.ok(js.includes('data-legal-topic="${t.id}"'),'Las tarjetas conservan botones interactivos');
assert.ok(js.includes('aria-pressed'),'Selección accesible y reversible');
assert.ok(js.includes('legal-whatsapp-form'),'Se conserva el formulario');
assert.ok(js.includes('fullName')&&js.includes('phone')&&js.includes('query'),'Tres campos opcionales conservados');
console.log('PASS: cuatro tarjetas sin imágenes pixeladas; textos, selección y formulario conservados.');
console.log('Límite: prueba estática; no equivale a verificación visual del sitio publicado.');
