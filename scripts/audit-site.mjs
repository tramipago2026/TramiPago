import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const base = 'http://127.0.0.1:4173/';
const issues = [];
const ok = [];
const warnings = [];

function addIssue(type, detail, route='') { issues.push({type, detail, route}); }
function addOk(type, detail, route='') { ok.push({type, detail, route}); }
function addWarn(type, detail, route='') { warnings.push({type, detail, route}); }

function allFiles(dir) {
  const out=[];
  for (const ent of fs.readdirSync(dir,{withFileTypes:true})) {
    if (['.git','node_modules'].includes(ent.name)) continue;
    const p=path.join(dir,ent.name);
    if (ent.isDirectory()) out.push(...allFiles(p)); else out.push(p);
  }
  return out;
}

function staticAudit() {
  const files=allFiles(root);
  const sourceFiles=files.filter(f=>/\.(html|js|css|mjs|json)$/i.test(f));
  const refs=new Set();
  const referencedAssets=new Set();
  const refRegexes=[
    /(?:src|href)=["']([^"']+)["']/g,
    /url\(["']?([^"')]+)["']?\)/g,
    /["']((?:assets|scripts|admin)\/[^"']+)["']/g
  ];
  for (const f of sourceFiles) {
    const txt=fs.readFileSync(f,'utf8');
    for (const rx of refRegexes) {
      rx.lastIndex=0; let m;
      while ((m=rx.exec(txt))) {
        let ref=m[1].split('?')[0].split('#')[0].trim();
        if (!ref || /^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(ref) || ref.startsWith('#')) continue;
        refs.add(`${path.relative(root,f)}::${ref}`);
        if (ref.startsWith('assets/')) referencedAssets.add(ref.replaceAll('\\','/'));
        const target=ref.startsWith('/') ? path.join(root,ref.slice(1)) : (ref.startsWith('assets/')||ref.startsWith('scripts/')||ref.startsWith('admin/') ? path.join(root,ref) : path.resolve(path.dirname(f),ref));
        if (!fs.existsSync(target)) addIssue('recurso-local-roto',`${path.relative(root,f)} -> ${ref}`);
      }
    }
  }
  const assets=files.filter(f=>path.relative(root,f).replaceAll('\\','/').startsWith('assets/'));
  for (const f of assets) {
    const rel=path.relative(root,f).replaceAll('\\','/');
    if (!referencedAssets.has(rel)) addWarn('asset-no-referenciado',rel);
  }
  for (const f of sourceFiles.filter(f=>f.endsWith('.js')||f.endsWith('.mjs'))) {
    const txt=fs.readFileSync(f,'utf8');
    if (/console\.log\(/.test(txt) && !f.endsWith('audit-site.mjs')) addWarn('console-log-en-produccion',path.relative(root,f));
  }
  const services=fs.readFileSync(path.join(root,'services.js'),'utf8');
  if (services.includes('Ciudad de Buenos Aires')) addIssue('texto-inconsistente','Usa “Ciudad de Buenos Aires” en vez de “Ciudad Autónoma de Buenos Aires” en services.js');
  addOk('estatico','Revisión de referencias locales y assets completada');
}

const serviceRoutes = [
  'antecedentes-penales','constancias-anses','informe-vehicular','arba-inmobiliario',
  'partidas','partidas-caba','asistencia-digital',
  'arca-constancia','arca-vep','arca-ccma','arca-reimputacion','arca-informe-reimputacion',
  'arca-alta-monotributo','arca-baja-monotributo','arca-recategorizacion','arca-dfe','arca-actualizacion'
];
const familyRoutes=['arca-monotributo','partidas-pba','asistencia-digital'];

async function fillInputs(page) {
  const filePath='/tmp/tramipago-audit.png';
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath,Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z0d8AAAAASUVORK5CYII=','base64'));
  const inputs=page.locator('input:not([type=hidden]), select, textarea');
  const n=await inputs.count();
  for(let i=0;i<n;i++){
    const el=inputs.nth(i);
    if(!(await el.isVisible().catch(()=>false))) continue;
    if(await el.isDisabled().catch(()=>true)) continue;
    const tag=await el.evaluate(e=>e.tagName.toLowerCase());
    const type=(await el.getAttribute('type'))||tag;
    const name=(await el.getAttribute('name'))||'';
    try{
      if(type==='checkbox'||type==='radio'){ if(!(await el.isChecked())) await el.check({force:true}); continue; }
      if(type==='file'){ await el.setInputFiles(filePath); continue; }
      if(tag==='select'){
        const vals=await el.locator('option:not([disabled])').evaluateAll(opts=>opts.map(o=>o.value).filter(Boolean));
        if(vals.length) await el.selectOption(vals[0]);
        continue;
      }
      let value='Dato de prueba';
      if(type==='email'||/email/i.test(name)) value='prueba@tramipago.com';
      else if(type==='tel'||/whatsapp|phone|telefono/i.test(name)) value='1167083232';
      else if(/cuil|cuit/i.test(name)) value='20-12345678-6';
      else if(/dni|documentNumber/i.test(name)) value='12345678';
      else if(type==='date') value='1990-01-01';
      else if(type==='month') value='2026-08';
      else if(/amount|importe|income|rent|surface|energy|price/i.test(name)) value='1000';
      else if(/patent|dominio/i.test(name)) value='AB123CD';
      else if(/year|anio|año/i.test(name)) value='2020';
      else if(/emailConfirm/i.test(name)) value='prueba@tramipago.com';
      await el.fill(value);
    }catch(e){ addWarn('campo-no-autocompletable',`${name||type}: ${e.message}`); }
  }
}

async function inspectPage(page, route) {
  const bodyText=(await page.locator('body').innerText()).trim();
  if(!bodyText) addIssue('pagina-vacia','La página no tiene texto visible',route);
  const h1=page.locator('h1').first();
  if(await h1.count()) {
    const txt=(await h1.innerText()).trim();
    if(!txt) addIssue('titulo-vacio','H1 vacío',route); else addOk('titulo',txt,route);
  } else addIssue('sin-h1','No hay título H1',route);

  const dupIds=await page.locator('[id]').evaluateAll(els=>{const m=new Map(); for(const e of els)m.set(e.id,(m.get(e.id)||0)+1); return [...m].filter(([,n])=>n>1)});
  if(dupIds.length) addIssue('ids-duplicados',JSON.stringify(dupIds),route);

  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth > window.innerWidth + 3);
  if(overflow) addIssue('overflow-horizontal','Hay desborde horizontal',route);

  const brokenImgs=await page.locator('img').evaluateAll(imgs=>imgs.filter(i=>i.complete && i.naturalWidth===0).map(i=>i.getAttribute('src')));
  for(const src of brokenImgs) addIssue('imagen-rota',String(src),route);

  const lowRes=await page.locator('img:visible').evaluateAll(imgs=>imgs.map(i=>({src:i.getAttribute('src'),nw:i.naturalWidth,cw:i.getBoundingClientRect().width})).filter(x=>x.cw>40 && x.nw>0 && x.nw < x.cw*1.15));
  for(const x of lowRes) addWarn('imagen-baja-resolucion',`${x.src}: natural ${x.nw}px / mostrado ${Math.round(x.cw)}px`,route);

  const checks=await page.locator('.family-heading,.process-title,.partidas-selector-heading,.partidas-type-heading,.arca-service-group-title,.panel-header').evaluateAll(els=>els.filter(e=>e.offsetParent!==null).map(e=>({c:e.className,align:getComputedStyle(e).textAlign,txt:(e.textContent||'').trim().slice(0,90)})));
  for(const c of checks){ if(c.align!=='center') addIssue('alineacion-titulo',`${c.c} => ${c.align} :: ${c.txt}`,route); }

  const cardText=await page.locator('.catalog-card-info,.arca-family-page .family-service-card>div').evaluateAll(els=>els.filter(e=>e.offsetParent!==null).map(e=>getComputedStyle(e).textAlign));
  if(cardText.some(x=>x!=='left' && x!=='start')) addIssue('alineacion-tarjeta','Alguna tarjeta no conserva texto a la izquierda',route);

  const forms=page.locator('form');
  const fc=await forms.count();
  for(let i=0;i<fc;i++){
    const form=forms.nth(i);
    const names=await form.locator('[name]').evaluateAll(els=>els.map(e=>e.getAttribute('name')).filter(Boolean));
    const dups=[...new Set(names.filter((n,idx)=>names.indexOf(n)!==idx))];
    // radio/checkbox choices can legitimately share a name
    for(const d of dups){
      const types=await form.locator(`[name="${d}"]`).evaluateAll(els=>[...new Set(els.map(e=>e.type))]);
      if(!types.every(t=>t==='radio'||t==='checkbox')) addIssue('nombre-campo-duplicado',d,route);
    }
    const unlabeled=await form.locator('input:not([type=hidden]):not([type=submit]):not([type=button]),select,textarea').evaluateAll(els=>els.filter(e=>{const id=e.id; return !e.getAttribute('aria-label') && !(id&&document.querySelector(`label[for="${CSS.escape(id)}"]`)) && !e.closest('label');}).map(e=>e.name||e.id||e.type));
    for(const u of unlabeled) addIssue('campo-sin-etiqueta',u,route);
  }
}

async function auditPass(pass) {
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1366,height:768}});
  const runtime=[];
  const page=await context.newPage();
  page.on('console',m=>{if(m.type()==='error')runtime.push(`console: ${m.text()}`)});
  page.on('pageerror',e=>runtime.push(`pageerror: ${e.message}`));
  page.on('requestfailed',r=>{if(r.url().startsWith(base))runtime.push(`requestfailed: ${r.url()} ${r.failure()?.errorText||''}`)});
  page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)runtime.push(`HTTP ${r.status()}: ${r.url()}`)});

  async function visit(hash){
    runtime.length=0;
    const route=hash||'#/'
    await page.goto(base+route,{waitUntil:'networkidle'});
    await page.waitForTimeout(150);
    await inspectPage(page,route);
    for(const e of [...new Set(runtime)]) addIssue('runtime',e,route);
  }

  await visit('#/');

  // Barra principal.
  for(const sel of ['a.nav-home','a.nav-tracking']){
    const loc=page.locator(sel);
    if(!(await loc.count())) addIssue('navegacion-faltante',sel,'#/');
    else {
      await page.goto(base+'#/',{waitUntil:'networkidle'});
      await page.locator(sel).click();
      await page.waitForTimeout(100);
      addOk('navegacion',`${sel} -> ${page.url()}`,'#/');
    }
  }
  await page.goto(base+'#/',{waitUntil:'networkidle'});
  if(!(await page.locator('button.nav-help').count())) addIssue('navegacion-faltante','button.nav-help','#/');

  // Todos los botones del inicio.
  await page.goto(base+'#/',{waitUntil:'networkidle'});
  const homeButtons=await page.locator('.home-tile').evaluateAll(btns=>btns.map(b=>({action:b.dataset.action,id:b.dataset.serviceId||b.dataset.familyId,disabled:b.disabled,label:b.getAttribute('aria-label')})));
  for(const b of homeButtons){
    if(b.disabled){addWarn('boton-inicio-deshabilitado',`${b.id} ${b.label}`);continue;}
    await page.goto(base+'#/',{waitUntil:'networkidle'});
    const q=b.action==='select-service'?`.home-tile[data-service-id="${b.id}"]`:`.home-tile[data-family-id="${b.id}"]`;
    await page.locator(q).click(); await page.waitForTimeout(100);
    if(page.url().endsWith('#/')) addIssue('boton-inicio-no-navega',`${b.id} (${b.label})`,'#/'); else addOk('boton-inicio',`${b.id} -> ${page.url()}`,'#/');
  }

  for(const f of familyRoutes) await visit(`#/familia/${f}`);
  for(const s of serviceRoutes) {
    await visit(`#/tramite/${s}`);
    const dataForm=page.locator('#data-form');
    if(await dataForm.count()) {
      await fillInputs(page);
      const submit=dataForm.locator('button[type=submit],input[type=submit]').first();
      if(await submit.count()){
        await submit.click(); await page.waitForTimeout(180);
        const errVisible=await page.locator('.form-error.visible').count();
        if(errVisible){
          const txt=await page.locator('.form-error.visible').first().innerText().catch(()=> '');
          addIssue('formulario-no-avanza',txt||'Error visible después de completar campos',`#/tramite/${s}`);
        } else addOk('formulario-envio-datos','Paso de datos respondió sin error visible',`#/tramite/${s}`);
      }
    }
  }

  // Partidas: ambas jurisdicciones y los cuatro tipos.
  for(const jur of ['pba','caba']){
    for(const type of ['birth','marriage','cohabitation','death']){
      await page.goto(base+'#/familia/partidas-pba',{waitUntil:'networkidle'});
      await page.locator(`[data-action="select-partidas-jurisdiction"][data-jurisdiction="${jur}"]`).click();
      await page.waitForTimeout(80);
      const card=page.locator(`[data-action="select-partida-type"][data-part-type="${type}"]`);
      if(!(await card.count())) {addIssue('partida-boton-faltante',`${jur}/${type}`);continue;}
      await card.click(); await page.waitForTimeout(120);
      if(page.url().includes('#/tramite/')) addOk('partida-link',`${jur}/${type} -> ${page.url()}`); else addIssue('partida-link-roto',`${jur}/${type} -> ${page.url()}`);
    }
  }

  // ARCA: los 10 botones deben abrir sus formularios.
  await page.goto(base+'#/familia/arca-monotributo',{waitUntil:'networkidle'});
  const arcaIds=await page.locator('.arca-family-page [data-service-id]').evaluateAll(els=>[...new Set(els.map(e=>e.dataset.serviceId).filter(Boolean))]);
  if(arcaIds.length!==10) addIssue('arca-cantidad-botones',`Esperados 10, encontrados ${arcaIds.length}`,'#/familia/arca-monotributo');
  for(const id of arcaIds){
    await page.goto(base+'#/familia/arca-monotributo',{waitUntil:'networkidle'});
    const btn=page.locator(`[data-service-id="${id}"]`).first();
    await btn.click(); await page.waitForTimeout(120);
    if(page.url().includes(`#/tramite/${id}`)) addOk('arca-link',id); else addIssue('arca-link-roto',`${id} -> ${page.url()}`);
  }

  // Responsive móvil sobre todas las rutas principales.
  await page.setViewportSize({width:390,height:844});
  for(const hash of ['#/','#/familia/arca-monotributo','#/familia/partidas-pba',...serviceRoutes.map(s=>`#/tramite/${s}`)]){
    await page.goto(base+hash,{waitUntil:'networkidle'}); await page.waitForTimeout(60);
    const ov=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+3);
    if(ov) addIssue('overflow-movil','Desborde horizontal',hash); else addOk('responsive-movil','Sin desborde horizontal',hash);
  }

  await browser.close();
  return {pass,issues:[...issues],warnings:[...warnings],ok:[...ok]};
}

staticAudit();
const beforeIssueCount=issues.length;
await auditPass(process.env.AUDIT_PASS||'1');

const report={generatedAt:new Date().toISOString(),issues,warnings,ok,summary:{issues:issues.length,warnings:warnings.length,ok:ok.length,staticIssues:beforeIssueCount}};
fs.mkdirSync('audit-output',{recursive:true});
fs.writeFileSync('audit-output/report.json',JSON.stringify(report,null,2));
fs.writeFileSync('audit-output/report.txt',[
  `ERRORES: ${issues.length}`,
  ...issues.map((x,i)=>`${i+1}. [${x.type}] ${x.route||''} ${x.detail}`),
  '',`ADVERTENCIAS: ${warnings.length}`,
  ...warnings.map((x,i)=>`${i+1}. [${x.type}] ${x.route||''} ${x.detail}`),
  '',`VALIDACIONES OK: ${ok.length}`,
  ...ok.map((x,i)=>`${i+1}. [${x.type}] ${x.route||''} ${x.detail}`)
].join('\n'));
console.log(fs.readFileSync('audit-output/report.txt','utf8'));
if(issues.length) process.exitCode=2;
