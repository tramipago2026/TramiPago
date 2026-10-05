// Auditoría estática reproducible: no envía formularios ni utiliza datos personales.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skipped = new Set(['.git', '.github', 'node_modules', 'local-data']);
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (skipped.has(entry.name)) return [];
    const full = join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}
const paths = walk(root);
const errors = [];
const references = [];
function verifyRef(source, raw, context) {
  const ref = String(raw).trim();
  if (!ref || ref.startsWith('#') || /^(?:https?:|mailto:|tel:|data:|javascript:|blob:|\/\/)/i.test(ref) || /[${}*]/.test(ref)) return;
  const cleaned = ref.split(/[?#]/)[0];
  if (!cleaned || cleaned.startsWith('/')) return; // Las rutas absolutas dependen del servidor y se revisan aparte.
  if (/[%]/.test(cleaned)) return; // Las rutas codificadas o dinámicas requieren navegador.
  const target = resolve(dirname(source), decodeURIComponent(cleaned));
  const label = `${relative(root, source)} → ${ref} (${context})`;
  references.push(label);
  if (!target.startsWith(root + '/') && target !== root) errors.push(`Referencia fuera del repositorio: ${label}`);
  else if (!existsSync(target) || !statSync(target).isFile()) errors.push(`Archivo inexistente: ${label}`);
}
for (const path of paths) {
  const ext = extname(path).toLowerCase();
  if (!['.html', '.css', '.js', '.mjs'].includes(ext)) continue;
  const text = readFileSync(path, 'utf8');
  if (ext === '.html') {
    for (const match of text.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)) verifyRef(path, match[1], 'HTML');
  }
  if (ext === '.css') {
    for (const match of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) verifyRef(path, match[1], 'CSS');
  }
  if (ext === '.js' || ext === '.mjs') {
    const syntax = spawnSync(process.execPath, ['--check', path], { encoding:'utf8' });
    if (syntax.status !== 0) errors.push(`Error de sintaxis en ${relative(root, path)}: ${syntax.stderr.trim()}`);
    for (const match of text.matchAll(/["'`](assets\/[A-Za-z0-9._/-]+)["'`]/g)) verifyRef(path, match[1], 'imagen en JS');
  }
}

// Contrato de cache-busting: si cambia un asset compartido, su ?v= debe cambiar también.
function gitBlobVersion(file){
  const buf=readFileSync(join(root,file));
  const header=Buffer.from(`blob ${buf.length}\0`);
  return createHash('sha1').update(Buffer.concat([header,buf])).digest('hex').slice(0,12);
}
const footerVersion=gitBlobVersion('footer-menu.js');
const shellVersion=gitBlobVersion('shared-site-shell.css');
for(const path of paths.filter(p=>extname(p).toLowerCase()==='.html')){
  const html=readFileSync(path,'utf8');
  if(html.includes('footer-menu.js')){
    const expected=`footer-menu.js?v=${footerVersion}`;
    if(!html.includes(expected)) errors.push(`Cache-buster desactualizado en ${relative(root,path)}: esperado ${expected}`);
  }
  if(html.includes('shared-site-shell.css')){
    const expected=`shared-site-shell.css?v=${shellVersion}`;
    if(!html.includes(expected)) errors.push(`Cache-buster desactualizado en ${relative(root,path)}: esperado ${expected}`);
  }
}
console.log(`Cache contract: footer-menu.js?v=${footerVersion}; shared-site-shell.css?v=${shellVersion}`);

console.log(`Archivos inspeccionados: ${paths.length}; referencias estáticas verificadas: ${references.length}; errores: ${errors.length}.`);
if (errors.length) { for (const error of errors) console.error(`ERROR ${error}`); process.exitCode = 1; }
else console.log('PASS: referencias locales y sintaxis JavaScript verificadas. No equivale a probar el sitio publicado.');

const carouselAssets=[
  'assets/carousel-v1/promo-tramites-online-v1.webp',
  'assets/carousel-v1/promo-arca-monotributo-v1.webp',
  'assets/carousel-v1/promo-apostillado-legalizaciones-v1.webp',
  'assets/carousel-v1/promo-consulta-abogado-v1.webp',
  'assets/carousel-v1/promo-informe-vehicular-v1.webp',
  'assets/carousel-v1/promo-antecedentes-penales-v1.webp',
  'assets/carousel-v1/promo-deuda-municipal-v1.webp',
  'assets/carousel-v1/promo-cualquier-tramite-v1.webp',
  'assets/carousel-v1/promo-estado-civil-v1.webp'
];
function webpDimensions(buffer){
  for(let i=20;i<buffer.length-10;i++){
    if(buffer[i]===0x9d&&buffer[i+1]===0x01&&buffer[i+2]===0x2a){
      return [buffer.readUInt16LE(i+3)&0x3fff,buffer.readUInt16LE(i+5)&0x3fff];
    }
  }
  return [0,0];
}
for(const asset of carouselAssets){
  const buffer=readFileSync(join(root,asset));
  const webpOk=buffer.subarray(0,4).toString('ascii')==='RIFF'
    && buffer.subarray(8,12).toString('ascii')==='WEBP';
  const [width,height]=webpDimensions(buffer);
  if(!webpOk||width!==1000||height!==1000){
    console.error(`ERROR pieza final del carrusel inválida: ${asset} (${width}x${height})`);
    process.exitCode=1;
  }
}
const promosSource=readFileSync(join(root,'promos.js'),'utf8');
for(const asset of carouselAssets){
  if(!promosSource.includes(asset)){
    console.error(`ERROR promos.js no referencia pieza final: ${asset}`);
    process.exitCode=1;
  }
}
const oldPromoRefs=[
  'promo-general-20260911.webp',
  'promo-vehicular-20260911.webp',
  'promo-antecedentes-20260911.webp',
  'promo-municipal-20260911.webp',
  'promo-art-20260911.webp',
  'promo-tramite-online-exact-20261001.png',
  'promo-certificacion-estado-civil-20261004.webp',
  'promo-arca-20260916.webp',
  'promo-apostillas-20260916.webp',
  'promo-abogado-20260916.webp'
];
for(const oldRef of oldPromoRefs){
  if(promosSource.includes(oldRef)){
    console.error(`ERROR promos.js todavía referencia una pieza anterior: ${oldRef}`);
    process.exitCode=1;
  }
}
console.log('PASS: carrusel V1 referencia exclusivamente 9 piezas finales WebP de 1000x1000.');
