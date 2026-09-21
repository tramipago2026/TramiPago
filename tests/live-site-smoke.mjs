// Verificación HTTP de GitHub Pages sin formularios, pagos, escrituras ni datos personales.
import { readFileSync, readdirSync } from 'node:fs';
import { join, extname } from 'node:path';
const base = new URL(process.env.SITE_URL || 'https://tramipago2026.github.io/TramiPago/');
const rootFiles = readdirSync('.').filter(file => ['.html','.js','.css'].includes(extname(file)));
const images = readdirSync('assets').filter(file => /\.(svg|png|jpe?g|webp)$/i.test(file)).map(file => `assets/${file}`);
const paths = [...rootFiles,...images];
const failures=[];
let checked=0;
const concurrency=5;
async function probe(path){
  const url=new URL(path,base);
  try{
    const response=await fetch(url,{method:'GET',signal:AbortSignal.timeout(15000),redirect:'follow',headers:{'User-Agent':'TramiPago-site-audit/1.0'}});
    if(!response.ok){failures.push(`${response.status} ${url.href}`);return;}
    checked++;
    if(path==='index.html'){
      const html=await response.text();
      if(!html.includes('app.js?v=20260921-directivas1'))failures.push('La portada publicada todavía no contiene la versión auditada de app.js.');
      if(!html.includes('backend-sync.js?v=20260918-sync-race1'))failures.push('La portada publicada todavía no contiene el puente auditado.');
    }else if(path==='extra-families.js'){
      const code=await response.text();
      if(!code.includes('officialFeeExternal:true'))failures.push('La versión pública aún no separa los aranceles TAD.');
    }else if(path==='backend-sync.js'){
      const code=await response.text();
      if(!code.includes('sessionStorage.setItem(TOKENS_KEY'))failures.push('La versión pública aún conserva el puente anterior.');
    }else await response.arrayBuffer();
  }catch(error){failures.push(`${url.href}: ${error.message}`);}
}
for(let offset=0;offset<paths.length;offset+=concurrency){
  await Promise.all(paths.slice(offset,offset+concurrency).map(probe));
}
console.log(`Recursos publicados comprobados: ${checked}/${paths.length}.`);
if(failures.length){for(const fail of failures)console.error(`ERROR ${fail}`);process.exitCode=1;}
else console.log('PASS: HTML, JavaScript, CSS e imágenes existentes respondieron HTTP 200 y los cambios auditados constan en el sitio publicado. No se probaron formularios ni capturas visuales.');
