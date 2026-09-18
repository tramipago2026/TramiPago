// Regresión del catálogo jurídico: fotos aprobadas verificadas, textos y botones HTML reales.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const photosName='abogado-fotos-20260918.avif';
const styleName='abogado-tarjetas-fotos-20260917.css';
const sprite=readFileSync(new URL('../'+['assets',photosName].join('/'),import.meta.url));
const photos=read('legal-photos-hd-20260918.css');
const asset=read(['assets',styleName].join('/'));
const page=read('legal-landing-20260917.css');
const js=read('legal-landing-20260917.js');
assert.equal(sprite.length,20534,'Tamaño exacto de imágenes AVIF aprobadas');
assert.equal(createHash('sha256').update(sprite).digest('hex'),'8a54321db0596416526bdf81b40be1ca931a69b77db585f74a9f64fb1e711167','Imagen aprobada incompleta o alterada');
assert.ok(page.includes(styleName),'Se mantienen estilos del catálogo');
assert.ok(!asset.includes('data:image/'),'Se retiró el antiguo sprite de muy baja calidad');
assert.ok(js.includes('legal-photos-hd-20260918.css'),'El formulario carga el nuevo CSS al final');
assert.ok(photos.includes(photosName),'Las fotos nuevas están conectadas');
for(const name of ['art','accidentes','sucesiones','laboral']){
  assert.ok(photos.includes('[data-topic-card="'+name+'"]'),'Falta recorte de '+name);
  assert.ok(js.includes("id:'"+name+"'"),'Falta botón interactivo para '+name);
}
assert.ok(photos.includes('background-size:100% 400%'),'Cada fotografía ocupa su propio recorte, sin ampliar un thumbnail');
assert.ok(!js.includes('legal-topic-photo'),'Los textos y botones no están incrustados en la fotografía');
assert.ok(js.includes('aria-pressed'),'Selección única reversible');
assert.ok(js.includes('legal-whatsapp-form'),'Formulario existente conservado');
assert.ok(js.includes('fullName')&&js.includes('phone')&&js.includes('query'),'Tres campos opcionales conservados');
console.log('PASS: sprite AVIF íntegro, cuatro fotos de alta definición, botones y formulario intactos.');
console.log('Límite: prueba estática; la inspección visual del navegador queda pendiente.');
