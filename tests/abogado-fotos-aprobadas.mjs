// Regresión: el usuario pidió eliminar las cuatro fotos pixeladas sin perder los temas ni el formulario.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const asset=read('assets/abogado-tarjetas-fotos-20260917.css');
const page=read('legal-landing-20260917.css');
const js=read('legal-landing-20260917.js');
assert.ok(page.includes('abogado-tarjetas-fotos-20260917.css'),'Se cargan los estilos de las tarjetas');
assert.ok(!asset.includes('data:image/'),'Se eliminó la fotografía WebP embebida');
assert.ok(!asset.includes('background-image:url('),'Las tarjetas no cargan imágenes pixeladas');
assert.ok(!js.includes('legal-topic-photo'),'La página ya no genera elementos fotográficos');
assert.ok(js.includes('legal-topic-grid'),'La grilla de cuatro temas se mantiene');
for(const name of ['art','accidentes','sucesiones','laboral']){
  assert.ok(js.includes("id:'"+name+"'"),'Se conserva el tema '+name);
}
assert.ok(js.includes('data-legal-topic="${t.id}"'),'Las tarjetas mantienen botones interactivos');
assert.ok(js.includes('aria-pressed'),'La selección del tema es accesible y reversible');
assert.ok(js.includes('legal-whatsapp-form'),'Se conserva el formulario de contacto');
assert.ok(js.includes('fullName')&&js.includes('phone')&&js.includes('query'),'Se mantienen los tres campos opcionales');
console.log('PASS: cuatro tarjetas sin imágenes pixeladas; textos, selección y formulario conservados.');
console.log('Límite: prueba estática; no equivale a verificación visual del sitio publicado.');
