import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const asset=read('assets/abogado-tarjetas-fotos-20260917.css');
const page=read('legal-landing-20260917.css');
const js=read('legal-landing-20260917.js');
assert.ok(page.startsWith('@import url("assets/abogado-tarjetas-fotos-20260917.css'),'La página carga las fotos recortadas');
const match=asset.match(/data:image\/webp;base64,([A-Za-z0-9+/=]+)/);
assert.ok(match,'No existe la imagen real embebida en el archivo de las cuatro fotos');
const photo=Buffer.from(match[1],'base64');
assert.equal(photo.length,2920,'La imagen fue alterada o está incompleta');
assert.equal(photo.toString('ascii',0,4),'RIFF','No es un archivo RIFF válido');
assert.equal(photo.toString('ascii',8,12),'WEBP','No es una imagen WebP');
assert.equal(createHash('sha256').update(photo).digest('hex'),'ba346b170b96cf306cfc20d6fb8e0bbc3976f4598819a9e3cc3fdcd1819e5987','Las fotografías no coinciden con los recortes aprobados');
for(const name of ['art','accidentes','sucesiones','laboral']){
 assert.ok(asset.includes("[data-topic-card='"+name+"']"),'Falta recorte de '+name);
 assert.ok(js.includes("id:'"+name+"'"),'Falta botón interactivo para '+name);
}
assert.ok(asset.includes('background-image:url('),'Se sustituyen las imágenes incorrectas');
assert.ok(asset.includes("background-size:100% 400%!important"),'La imagen se divide en cuatro fotografías');
assert.ok(js.includes('aria-pressed'),'Selección de un tema accesible y reversible');
assert.ok(js.includes('legal-whatsapp-form'),'Formulario de contacto existente conservado');
console.log('PASS: fotografía aprobada íntegra; cuatro recortes diferenciados, botones y formulario conectados.');
console.log('Límite: verificación del código y de la imagen; no es una inspección visual del navegador.');
