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
      if(!html.includes('app.js?v=20260916-audit2'))failures.push('La portada publicada todavía no contiene la versión auditada de app.js.');
      if(!html.includes('backend-sync.js?v='))failures.push('La portada publicada no carga backend-sync.js.');
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

async function verifyOnlinePromoPublished(){
  const promoPath='assets/promo-tramite-online-20260930.webp';
  let last='';
  for(let attempt=1;attempt<=12;attempt++){
    try{
      const [assetRes,promosRes]=await Promise.all([
        fetch(new URL(promoPath,base),{cache:'no-store',headers:{'User-Agent':'TramiPago-site-audit/1.0'}}),
        fetch(new URL('promos.js?verify='+Date.now(),base),{cache:'no-store',headers:{'User-Agent':'TramiPago-site-audit/1.0'}})
      ]);
      const code=promosRes.ok?await promosRes.text():'';
      const bytes=assetRes.ok?Buffer.from(await assetRes.arrayBuffer()):Buffer.alloc(0);
      const valid=bytes.length>=12&&bytes.subarray(0,4).toString('ascii')==='RIFF'&&bytes.subarray(8,12).toString('ascii')==='WEBP';
      const linked=code.includes(promoPath)&&code.includes('Quiero consultar por un trámite online.');
      if(assetRes.ok&&promosRes.ok&&valid&&linked){
        console.log('PASS: publicidad online publicada, WebP válido y enlazada por promos.js.');
        return;
      }
      last='asset='+assetRes.status+' promos='+promosRes.status+' validWebP='+valid+' linked='+linked;
    }catch(error){last=error.message;}
    await new Promise(resolve=>setTimeout(resolve,10000));
  }
  failures.push('Publicidad online no quedó publicada correctamente tras reintentos: '+last);
}
await verifyOnlinePromoPublished();
if(failures.length)process.exitCode=1;
