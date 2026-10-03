// Verificación HTTP de GitHub Pages sin formularios, pagos, escrituras ni datos personales.
import { readFileSync, readdirSync } from 'node:fs';
import { join, extname } from 'node:path';
const base = new URL(process.env.SITE_URL || 'https://tramipago2026.github.io/TramiPago/');
const rootFiles = readdirSync('.').filter(file => ['.html','.js','.css'].includes(extname(file)));
const adminFiles = readdirSync('admin').filter(file => ['.html','.js','.css'].includes(extname(file))).map(file => `admin/${file}`);
const images = readdirSync('assets').filter(file => /\.(svg|png|jpe?g|webp)$/i.test(file)).map(file => `assets/${file}`);
const paths = [...rootFiles,...adminFiles,...images];
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
      const local=readFileSync('index.html','utf8');
      const footerSrc=(local.match(/<script src=["'](footer-menu\.js\?v=[^"']+)["']/)||[])[1];
      if(!footerSrc||!html.includes(footerSrc))failures.push('La portada publicada no carga la versión actual de footer-menu.js.');
      const appSrc=(local.match(/<script src=["'](app\.js\?v=[^"']+)["']/)||[])[1];
      const backendSrc=(local.match(/<script src=["'](backend-sync\.js\?v=[^"']+)["']/)||[])[1];
      if(!appSrc||!html.includes(appSrc))failures.push('La portada publicada no coincide con la versión actual de app.js.');
      if(!backendSrc||!html.includes(backendSrc))failures.push('La portada publicada no coincide con la versión actual de backend-sync.js.');
    }else if(path==='footer-menu.js'){
      const code=await response.text();
      if(!code.includes('<h3>INFORMACIÓN LEGAL</h3>'))failures.push('footer-menu.js público no contiene INFORMACIÓN LEGAL.');
      if(!code.includes('<h3>DERECHOS DEL USUARIO</h3>'))failures.push('footer-menu.js público no contiene DERECHOS DEL USUARIO.');
      if(!code.includes('grid-template-columns:repeat(2,minmax(0,1fr))'))failures.push('footer-menu.js público no define el footer en 2 columnas.');
      for(const oldLabel of ['<h3>TRAMIPAGO</h3>','<h3>CONTACTO</h3>','>Todos los trámites<','>Ver mi trámite<','>WhatsApp<']){
        if(code.includes(oldLabel))failures.push('footer-menu.js público conserva elemento obsoleto: '+oldLabel);
      }
    }else if(path==='shared-site-shell.css'){
      const css=await response.text();
      if(!css.includes('grid-template-columns:repeat(2,minmax(0,1fr))!important'))failures.push('shared-site-shell.css público no define footer de 2 columnas.');
      if(!css.includes('width:min(680px,100%)!important'))failures.push('shared-site-shell.css público no conserva el ancho centrado del footer.');
    }else if(path.endsWith('.html')){
      const html=await response.text();
      const local=readFileSync(path,'utf8');
      const shellSrc=(local.match(/href=["'](shared-site-shell\.css\?v=[^"']+)["']/)||[])[1];
      if(shellSrc&&!html.includes(shellSrc))failures.push(path+': la página publicada no carga la versión actual de shared-site-shell.css.');
    }else if(path==='admin/index.html'){
      const html=await response.text();
      const local=readFileSync('admin/index.html','utf8');
      const appSrc=(local.match(/src=["'](\.\/app\.js\?v=[^"']+)["']/)||[])[1];
      if(!appSrc||!html.includes(appSrc))failures.push('El Admin publicado todavía no carga la versión actual de app.js.');
      if(html.includes('price-guard.js'))failures.push('El Admin publicado todavía carga price-guard.js obsoleto.');
      if(html.includes('id="mfa-new-factor"'))failures.push('El Admin publicado todavía ofrece asociar un factor MFA nuevo desde AAL1.');
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
else console.log('PASS: sitio público y Admin publicados responden HTTP 200; versiones auditadas del Admin confirmadas. No se probaron credenciales reales ni formularios destructivos.');
