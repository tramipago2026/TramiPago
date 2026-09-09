import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const BASE='http://127.0.0.1:4173/';
const issues=[], warnings=[], ok=[];
const issue=(type,detail,route='')=>issues.push({type,detail,route});
const warn=(type,detail,route='')=>warnings.push({type,detail,route});
const good=(type,detail,route='')=>ok.push({type,detail,route});
const uniq=a=>[...new Set(a)];

const productionFiles=['index.html','app.js','services.js','arca-family.js','flow-ui.js','site-fixes.js','footer-menu.js','site.css','ui.css','ui-base.css','styles.css','contacto.html','opiniones.html','politica-privacidad.html','terminos-condiciones.html','arrepentimiento.html','baja-servicio.html','tramites.html'];
const staticPages=['index.html','contacto.html','opiniones.html','politica-privacidad.html','terminos-condiciones.html','arrepentimiento.html','baja-servicio.html','tramites.html'];
const serviceIds=['antecedentes-penales','constancias-anses','informe-vehicular','arba-inmobiliario','partidas','partidas-caba','asistencia-digital','arca-constancia','arca-vep','arca-ccma','arca-reimputacion','arca-informe-reimputacion','arca-alta-monotributo','arca-baja-monotributo','arca-recategorizacion','arca-dfe','arca-actualizacion'];
const familyIds=['arca-monotributo','partidas-pba','asistencia-digital'];

function staticAudit(){
  const refs=new Set(), assetRefs=new Set();
  const patterns=[/(?:src|href)=["']([^"']+)["']/g,/url\(["']?([^"')]+)["']?\)/g,/["'](assets\/[^"']+)["']/g];
  for(const rel of productionFiles){
    const full=path.join(ROOT,rel); if(!fs.existsSync(full)){issue('archivo-produccion-faltante',rel);continue;}
    const txt=fs.readFileSync(full,'utf8');
    for(const rx of patterns){rx.lastIndex=0;let m;while((m=rx.exec(txt))){
      let ref=m[1].split('?')[0].split('#')[0].trim();
      if(!ref || ref.includes('${') || /^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(ref) || ref==='#') continue;
      if(ref==='admin/index.html') continue; // enlace privado, oculto en producción pública
      refs.add(`${rel} -> ${ref}`);
      if(ref.startsWith('assets/')) assetRefs.add(ref);
      const target=ref.startsWith('assets/')?path.join(ROOT,ref):path.resolve(path.dirname(full),ref);
      if(!fs.existsSync(target)) issue('recurso-local-roto',`${rel} -> ${ref}`);
    }}
  }
  const assetDir=path.join(ROOT,'assets');
  if(fs.existsSync(assetDir)) for(const name of fs.readdirSync(assetDir)){
    const rel=`assets/${name}`;
    if(!assetRefs.has(rel)) warn('asset-no-referenciado',rel);
  }
  const services=fs.readFileSync(path.join(ROOT,'services.js'),'utf8');
  for(const bad of ['Ciudad de Buenos Aires','CAVA','Tripago','Transmipago']) if(services.includes(bad)) issue('texto-inconsistente',`services.js contiene: ${bad}`);
  good('estatico','Archivos de producción, referencias locales y assets revisados');
}

async function fillForm(page,{cabaType=null,cabaMode=null}={}){
  const file='/tmp/tp-audit.png'; if(!fs.existsSync(file))fs.writeFileSync(file,Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z0d8AAAAASUVORK5CYII=','base64'));
  if(cabaType){const r=page.locator(`input[name="partType"][value="${cabaType}"]`);if(await r.count())await r.check({force:true});}
  if(cabaMode){const r=page.locator(`input[name="requestMode"][value="${cabaMode}"]`);if(await r.count())await r.check({force:true});}
  const radios=await page.locator('input[type=radio]:visible').evaluateAll(els=>uniqNames(els.map(e=>e.name))); // helper injected below
  for(const name of radios){
    const checked=page.locator(`input[type=radio][name="${name}"]:checked`);
    if(!(await checked.count())){const first=page.locator(`input[type=radio][name="${name}"]:visible`).first();if(await first.count())await first.check({force:true});}
  }
  const els=page.locator('input:not([type=hidden]):not([type=radio]),select,textarea');
  for(let i=0;i<await els.count();i++){
    const el=els.nth(i); if(!(await el.isVisible().catch(()=>false))||await el.isDisabled().catch(()=>true))continue;
    const tag=await el.evaluate(e=>e.tagName.toLowerCase()); const type=(await el.getAttribute('type'))||tag; const name=(await el.getAttribute('name'))||'';
    try{
      if(type==='checkbox'){if(!(await el.isChecked()))await el.check({force:true});continue;}
      if(type==='file'){await el.setInputFiles(file);continue;}
      if(tag==='select'){const vals=await el.locator('option:not([disabled])').evaluateAll(os=>os.map(o=>o.value).filter(Boolean));if(vals.length)await el.selectOption(vals[0]);continue;}
      let v='Dato de prueba';
      if(type==='email'||/email/i.test(name))v='prueba@tramipago.com';
      else if(type==='tel'||/whatsapp|phone|telefono/i.test(name))v='1167083232';
      else if(/cuil|cuit/i.test(name))v='20-12345678-6';
      else if(/dni|documentNumber/i.test(name))v='12345678';
      else if(type==='date')v='1990-01-01';
      else if(type==='month')v='2026-08';
      else if(/amount|importe|income|rent|surface|energy|price/i.test(name))v='1000';
      else if(/patent|dominio/i.test(name))v='AB123CD';
      else if(/year|anio|año|registrationYear/i.test(name))v='2020';
      else if(/eventDate/i.test(name))v='15/08/1985';
      else if(/sectionCirc/i.test(name))v='1';
      else if(/bookNumber/i.test(name))v='1';
      else if(/actNumber/i.test(name))v='1';
      await el.fill(v);
    }catch(e){warn('campo-autocompletado',`${name||type}: ${e.message}`);}
  }
}

async function inspect(page,route){
  const runtime=page.__runtime||[];
  const h1=page.locator('h1').first(); if(!(await h1.count()))issue('sin-h1','No hay H1',route); else if(!(await h1.innerText()).trim())issue('titulo-vacio','H1 vacío',route); else good('titulo',(await h1.innerText()).trim(),route);
  const text=(await page.locator('body').innerText()).trim();
  for(const bad of ['CAVA','Tripago','Transmipago']) if(text.includes(bad)) issue('texto-visible-inconsistente',bad,route);
  if(/ {3,}/.test(text)) warn('espacios-excesivos','Se detectaron espacios múltiples en texto visible',route);
  const dup=await page.locator('[id]').evaluateAll(es=>{const m={};es.forEach(e=>m[e.id]=(m[e.id]||0)+1);return Object.entries(m).filter(([,n])=>n>1)}); if(dup.length)issue('ids-duplicados',JSON.stringify(dup),route);
  const ov=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+3); if(ov)issue('overflow-horizontal','Desborde horizontal',route);
  const imgs=await page.locator('img').evaluateAll(is=>is.map(i=>({src:i.getAttribute('src'),ok:!i.complete||i.naturalWidth>0,nw:i.naturalWidth,cw:i.getBoundingClientRect().width,vis:i.offsetParent!==null}))); for(const i of imgs.filter(x=>!x.ok))issue('imagen-rota',String(i.src),route); for(const i of imgs.filter(x=>x.vis&&x.cw>50&&x.nw>0&&x.nw<x.cw))warn('imagen-baja-resolucion',`${i.src} ${i.nw}/${Math.round(i.cw)}`,route);
  const buttons=await page.locator('button:visible').evaluateAll(bs=>bs.map(b=>({txt:(b.innerText||'').trim(),aria:b.getAttribute('aria-label')}))); for(const b of buttons)if(!b.txt&&!b.aria)issue('boton-sin-nombre','Botón visible sin texto/aria-label',route);
  const links=await page.locator('a:visible').evaluateAll(as=>as.map(a=>({txt:(a.innerText||'').trim(),aria:a.getAttribute('aria-label'),href:a.getAttribute('href')}))); for(const a of links){if(!a.txt&&!a.aria)issue('link-sin-nombre',String(a.href),route);if(a.href==='#'||a.href==='')issue('link-vacio',String(a.txt),route);}
  const centered=await page.locator('.family-heading,.process-title,.partidas-selector-heading,.partidas-type-heading,.arca-service-group-title,.panel-header').evaluateAll(es=>es.filter(e=>e.offsetParent!==null).map(e=>({c:e.className,a:getComputedStyle(e).textAlign,t:(e.textContent||'').trim().slice(0,80)}))); for(const c of centered)if(c.a!=='center')issue('titulo-descentrado',`${c.c}=${c.a}: ${c.t}`,route);
  const unlabeled=await page.locator('form input:not([type=hidden]):not([type=submit]):not([type=button]),form select,form textarea').evaluateAll(es=>es.filter(e=>{const id=e.id;return !e.getAttribute('aria-label')&&!(id&&document.querySelector(`label[for="${CSS.escape(id)}"]`))&&!e.closest('label')}).map(e=>e.name||e.id||e.type));for(const u of unlabeled)issue('campo-sin-etiqueta',u,route);
  for(const r of uniq(runtime))issue('runtime',r,route); runtime.length=0;
}

async function testDataAndPayment(page,hash,opts={}){
  await page.evaluate(()=>{localStorage.clear();sessionStorage.clear();});
  await page.goto(BASE+hash,{waitUntil:'networkidle'}); await page.waitForTimeout(100); await inspect(page,hash);
  const form=page.locator('#data-form'); if(!(await form.count())){warn('sin-data-form','No hay #data-form',hash);return;}
  await fillForm(page,opts);
  const submit=form.locator('button[type=submit],input[type=submit]').first(); if(!(await submit.count())){issue('form-sin-submit','Formulario sin botón submit',hash);return;}
  await submit.click(); await page.waitForTimeout(180);
  const err=page.locator('.form-error.visible'); if(await err.count()){issue('formulario-no-avanza',(await err.first().innerText()).trim(),hash);return;} good('formulario-datos','Datos aceptados',hash);
  const pay=page.locator('#payment-form'); if(await pay.count()){
    const fi=pay.locator('input[type=file]').first(); if(await fi.count()){const f='/tmp/tp-audit.png';await fi.setInputFiles(f);}
    await pay.locator('button[type=submit],input[type=submit]').first().click(); await page.waitForTimeout(180);
    const perr=page.locator('.form-error.visible'); if(await perr.count())issue('pago-no-avanza',(await perr.first().innerText()).trim(),hash); else if(await page.locator('.confirmation').count())good('pago-confirmacion','Pago simulado llega a confirmación',hash); else good('pago-respuesta','Pago simulado respondió sin error visible',hash);
  } else if(await page.locator('.confirmation').count()) good('intake-confirmacion','Solicitud intake llega a confirmación',hash);
}

async function browserAudit(){
  const browser=await chromium.launch({headless:true}); const context=await browser.newContext({viewport:{width:1366,height:768}}); const page=await context.newPage();
  await page.addInitScript(()=>{window.uniqNames=a=>[...new Set(a.filter(Boolean))];window.__opened=[];const old=window.open;window.open=(u,...rest)=>{window.__opened.push(String(u));return null;};});
  page.__runtime=[]; page.on('console',m=>{if(m.type()==='error')page.__runtime.push(`console: ${m.text()}`)}); page.on('pageerror',e=>page.__runtime.push(`pageerror: ${e.message}`)); page.on('requestfailed',r=>{if(r.url().startsWith(BASE))page.__runtime.push(`requestfailed: ${r.url()} ${r.failure()?.errorText||''}`)}); page.on('response',r=>{if(r.url().startsWith(BASE)&&r.status()>=400)page.__runtime.push(`HTTP ${r.status()} ${r.url()}`)});

  // Páginas HTML públicas y todos sus enlaces locales.
  for(const p of staticPages){await page.goto(BASE+p,{waitUntil:'networkidle'});await inspect(page,p);const hrefs=await page.locator('a[href]').evaluateAll(as=>uniqNames(as.map(a=>a.getAttribute('href')).filter(h=>h&&!/^(https?:|mailto:|tel:|javascript:|#)/i.test(h))));for(const h of hrefs){const clean=h.split('#')[0].split('?')[0];if(!clean)continue;const resp=await page.request.get(new URL(clean,BASE+p).href);if(resp.status()>=400)issue('link-html-roto',`${p} -> ${h} (${resp.status()})`,p);else good('link-html',`${p} -> ${h}`,p);}}

  // Inicio: todos los botones y navegación.
  await page.goto(BASE+'#/',{waitUntil:'networkidle'});await inspect(page,'#/');
  const tiles=await page.locator('.home-tile').evaluateAll(bs=>bs.map(b=>({a:b.dataset.action,id:b.dataset.serviceId||b.dataset.familyId,d:b.disabled})));for(const t of tiles){if(t.d){warn('inicio-deshabilitado',t.id);continue;}await page.goto(BASE+'#/',{waitUntil:'networkidle'});const sel=t.a==='select-service'?`.home-tile[data-service-id="${t.id}"]`:`.home-tile[data-family-id="${t.id}"]`;await page.locator(sel).click();await page.waitForTimeout(80);if(page.url().endsWith('#/'))issue('boton-inicio-no-navega',t.id);else good('boton-inicio',`${t.id} -> ${page.url()}`);}
  await page.goto(BASE+'#/',{waitUntil:'networkidle'});await page.locator('a.nav-home').click();if(!page.url().endsWith('#/'))issue('nav-inicio','Inicio no vuelve al home');else good('nav-inicio','OK');
  await page.goto(BASE+'#/',{waitUntil:'networkidle'});await page.locator('a.nav-tracking').click();if(!page.url().includes('#/seguimiento'))issue('nav-estado','Estado no abre seguimiento');else good('nav-estado','OK');
  await page.goto(BASE+'#/',{waitUntil:'networkidle'});await page.locator('button.nav-help').click();await page.waitForTimeout(30);const opens=await page.evaluate(()=>window.__opened||[]);if(!opens.some(u=>/wa\.me|whatsapp/i.test(u)))issue('nav-ayuda','Ayuda no intenta abrir WhatsApp');else good('nav-ayuda',opens.at(-1));

  // Familias y servicios.
  for(const id of familyIds){await page.goto(BASE+`#/familia/${id}`,{waitUntil:'networkidle'});await inspect(page,`#/familia/${id}`);}
  for(const id of serviceIds.filter(x=>x!=='partidas-caba')) await testDataAndPayment(page,`#/tramite/${id}`);

  // CABA: las cuatro combinaciones válidas por separado.
  const combos=[['birth','regular'],['marriage','regular'],['cohabitation','union-review'],['death','regular']];for(const [t,m] of combos)await testDataAndPayment(page,'#/tramite/partidas-caba',{cabaType:t,cabaMode:m});

  // Botones de Partidas PBA/CABA desde la familia.
  for(const jur of ['pba','caba'])for(const t of ['birth','marriage','cohabitation','death']){await page.evaluate(()=>{localStorage.clear();sessionStorage.clear();});await page.goto(BASE+'#/familia/partidas-pba',{waitUntil:'networkidle'});await page.locator(`[data-jurisdiction="${jur}"]`).click();await page.waitForTimeout(40);const b=page.locator(`[data-part-type="${t}"]`);if(!(await b.count()))issue('partidas-boton-faltante',`${jur}/${t}`);else{await b.click();await page.waitForTimeout(80);if(!page.url().includes('#/tramite/'))issue('partidas-link-roto',`${jur}/${t}`);else good('partidas-link',`${jur}/${t} -> ${page.url()}`);}}

  // ARCA: diez tarjetas distintas y links funcionales.
  await page.goto(BASE+'#/familia/arca-monotributo',{waitUntil:'networkidle'});const ids=await page.locator('.arca-family-page [data-service-id]').evaluateAll(es=>uniqNames(es.map(e=>e.dataset.serviceId)));if(ids.length!==10)issue('arca-cantidad',`Esperados 10, encontrados ${ids.length}`);else good('arca-cantidad','10 botones');const srcs=await page.locator('.arca-family-page img.arca-service-thumb').evaluateAll(is=>is.map(i=>i.getAttribute('src')));if(uniq(srcs).length!==10)issue('arca-imagenes-repetidas',`Hay ${uniq(srcs).length} imágenes únicas para ${srcs.length} botones`);else good('arca-imagenes','10 archivos de imagen distintos');for(const id of ids){await page.goto(BASE+'#/familia/arca-monotributo',{waitUntil:'networkidle'});await page.locator(`[data-service-id="${id}"]`).first().click();await page.waitForTimeout(60);if(!page.url().includes(`#/tramite/${id}`))issue('arca-link-roto',id);else good('arca-link',id);}

  // Uniformidad de tarjetas en inicio/ARCA/Partidas.
  for(const hash of ['#/','#/familia/arca-monotributo','#/familia/partidas-pba']){await page.goto(BASE+hash,{waitUntil:'networkidle'});const dims=await page.locator('.home-tile,.arca-family-page .family-service-card,.partidas-jurisdiction-card,.partidas-type-card').evaluateAll(es=>es.filter(e=>e.offsetParent!==null).map(e=>({w:Math.round(e.getBoundingClientRect().width),r:getComputedStyle(e).borderRadius})));if(dims.length){const ws=uniq(dims.map(x=>x.w));if(ws.length>1)warn('anchos-tarjeta-distintos',JSON.stringify(ws),hash);else good('ancho-tarjetas',String(ws[0]),hash);}}

  // Responsive: todas las rutas públicas dinámicas.
  await page.setViewportSize({width:390,height:844});for(const hash of ['#/',...familyIds.map(x=>`#/familia/${x}`),...serviceIds.map(x=>`#/tramite/${x}`),'#/seguimiento']){await page.goto(BASE+hash,{waitUntil:'networkidle'});const ov=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+3);if(ov)issue('overflow-movil','Desborde horizontal',hash);else good('responsive',hash);}

  await browser.close();
}

staticAudit();await browserAudit();
fs.mkdirSync('audit-output-v2',{recursive:true});const rep={generatedAt:new Date().toISOString(),issues,warnings,ok,summary:{issues:issues.length,warnings:warnings.length,ok:ok.length}};fs.writeFileSync('audit-output-v2/report.json',JSON.stringify(rep,null,2));fs.writeFileSync('audit-output-v2/report.txt',[`ERRORES: ${issues.length}`,...issues.map((x,i)=>`${i+1}. [${x.type}] ${x.route} ${x.detail}`),'',`ADVERTENCIAS: ${warnings.length}`,...warnings.map((x,i)=>`${i+1}. [${x.type}] ${x.route} ${x.detail}`),'',`OK: ${ok.length}`,...ok.map((x,i)=>`${i+1}. [${x.type}] ${x.route} ${x.detail}`)].join('\n'));console.log(fs.readFileSync('audit-output-v2/report.txt','utf8'));if(issues.length)process.exitCode=2;
