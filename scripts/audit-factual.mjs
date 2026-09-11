import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE='http://127.0.0.1:4173/';
const errors=[]; const warnings=[]; const ok=[];
const add=(arr,type,where,msg)=>arr.push({type,where,msg});
const staticPages=['index.html','tramites.html','opiniones.html','contacto.html','politica-privacidad.html','terminos-condiciones.html','arrepentimiento.html','baja-servicio.html'];
const routes=['#/','#/seguimiento','#/familia/arca-monotributo','#/familia/partidas-pba','#/familia/asistencia-digital','#/tramite/antecedentes-penales','#/tramite/constancias-anses','#/tramite/informe-vehicular','#/tramite/arba-inmobiliario','#/tramite/partidas','#/tramite/partidas-caba','#/tramite/asistencia-digital','#/tramite/arca-constancia','#/tramite/arca-vep','#/tramite/arca-ccma','#/tramite/arca-reimputacion','#/tramite/arca-informe-reimputacion','#/tramite/arca-alta-monotributo','#/tramite/arca-baja-monotributo','#/tramite/arca-recategorizacion','#/tramite/arca-dfe','#/tramite/arca-actualizacion'];

function staticAudit(){
  const textFiles=[];
  function walk(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){if(['.git','node_modules'].includes(ent.name))continue;const p=path.join(dir,ent.name);if(ent.isDirectory())walk(p);else if(/\.(html|js|css|md)$/i.test(ent.name))textFiles.push(p);}}
  walk('.');
  const allText=textFiles.map(p=>fs.readFileSync(p,'utf8')).join('\n');
  for(const file of staticPages){if(!fs.existsSync(file))add(errors,'missing-file',file,'No existe');else add(ok,'file',file,'Existe');}
  for(const file of staticPages.filter(fs.existsSync)){
    const s=fs.readFileSync(file,'utf8');
    const refs=[...s.matchAll(/(?:href|src)=["']([^"'#?]+)(?:[?#][^"']*)?["']/gi)].map(m=>m[1]).filter(v=>!/^https?:|^mailto:|^tel:|^javascript:|^data:|^\//i.test(v));
    for(const ref of refs){const clean=decodeURIComponent(ref);if(!fs.existsSync(clean))add(errors,'broken-local-ref',file,clean);}
  }
  if(fs.existsSync('assets')){
    for(const f of fs.readdirSync('assets')){
      const rel='assets/'+f;
      const count=allText.split(rel).length-1;
      if(count===0)add(warnings,'unused-asset',rel,'Sin referencia textual en producción');
      else add(ok,'asset-ref',rel,`Referencias: ${count}`);
    }
  }
}

async function inspect(page,label){
  const runtime=[];
  const onConsole=m=>{if(m.type()==='error')runtime.push('console: '+m.text())};
  const onPage=e=>runtime.push('pageerror: '+e.message);
  const onReq=r=>runtime.push('requestfailed: '+r.url()+' '+(r.failure()?.errorText||''));
  const onResp=r=>{if(r.status()>=400)runtime.push(`http ${r.status()}: ${r.url()}`)};
  page.on('console',onConsole); page.on('pageerror',onPage); page.on('requestfailed',onReq); page.on('response',onResp);
  await page.waitForTimeout(250);
  const h1=await page.locator('h1:visible').first().textContent().catch(()=>null);
  if(!h1?.trim())add(errors,'heading',label,'No hay H1 visible'); else add(ok,'heading',label,h1.trim());
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  if(overflow>2)add(errors,'overflow',label,`Desborde horizontal ${overflow}px`); else add(ok,'responsive',label,'Sin desborde horizontal');
  const emptyControls=await page.locator('a:visible,button:visible').evaluateAll(els=>els.filter(e=>!(e.innerText||e.getAttribute('aria-label')||e.getAttribute('title')||'').trim()).map(e=>e.outerHTML.slice(0,180)));
  for(const x of emptyControls)add(errors,'empty-control',label,x);
  const badLinks=await page.locator('a[href]:visible').evaluateAll(els=>els.map(e=>e.getAttribute('href')).filter(h=>!h||h==='#'||/^javascript:/i.test(h)));
  for(const x of badLinks)add(errors,'bad-link',label,String(x));
  const images=await page.locator('img:visible').evaluateAll(els=>els.filter(e=>!e.complete||e.naturalWidth===0).map(e=>e.getAttribute('src')));
  for(const x of images)add(errors,'broken-image',label,String(x));
  for(const x of [...new Set(runtime)])add(errors,'runtime',label,x);
  page.off('console',onConsole);page.off('pageerror',onPage);page.off('requestfailed',onReq);page.off('response',onResp);
}

async function fillVisibleForm(page){
  for(let round=0;round<4;round++){
    const selects=page.locator('form#data-form select:visible');
    for(let i=0;i<await selects.count();i++){const el=selects.nth(i);const vals=await el.locator('option:not([disabled])').evaluateAll(os=>os.map(o=>o.value).filter(Boolean));if(vals.length && !(await el.inputValue())){await el.selectOption(vals[0]).catch(()=>{});await page.waitForTimeout(30);}}
    const radios=await page.locator('form#data-form input[type=radio]:visible').evaluateAll(es=>[...new Set(es.map(e=>e.name).filter(Boolean))]);
    for(const n of radios){if(!(await page.locator(`input[type=radio][name="${n}"]:checked`).count()))await page.locator(`input[type=radio][name="${n}"]:visible`).first().check({force:true}).catch(()=>{});}
    const checks=page.locator('form#data-form input[type=checkbox]:visible[required]'); for(let i=0;i<await checks.count();i++)await checks.nth(i).check({force:true}).catch(()=>{});
    const fields=page.locator('form#data-form input:visible:not([type=radio]):not([type=checkbox]):not([type=file]):not([type=submit]):not([type=button]), form#data-form textarea:visible');
    for(let i=0;i<await fields.count();i++){
      const el=fields.nth(i); if(await el.inputValue().catch(()=>''))continue; const type=(await el.getAttribute('type'))||'text';const name=(await el.getAttribute('name'))||'';const mode=(await el.getAttribute('inputmode'))||'';
      let v='Dato de prueba'; if(type==='email'||/email/i.test(name))v='prueba@example.com'; else if(type==='tel'||/whatsapp|phone|telefono/i.test(name))v='1160000000'; else if(type==='date')v='1990-01-01'; else if(type==='number'||mode==='numeric'||/cuil|cuit|dni|document|actNumber|year|importe|amount/i.test(name))v='12345678';
      await el.fill(v).catch(()=>{});
    }
    await page.waitForTimeout(60);
  }
}

async function browserAudit(){
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  for(const p of staticPages){await page.goto(BASE+p,{waitUntil:'networkidle'});await inspect(page,p);}
  for(const r of routes){await page.goto(BASE+'index.html'+r,{waitUntil:'networkidle'});await inspect(page,r);}
  await page.goto(BASE+'index.html#/',{waitUntil:'networkidle'});
  const homeControls=page.locator('[data-action="select-service"],[data-action="select-family"]');
  const count=await homeControls.count();
  if(count<7)add(errors,'home-buttons','#/',`Sólo ${count} accesos principales`);else add(ok,'home-buttons','#/',`${count} accesos principales`);
  for(let i=0;i<count;i++){
    await page.goto(BASE+'index.html#/',{waitUntil:'networkidle'}); const c=page.locator('[data-action="select-service"],[data-action="select-family"]').nth(i); const name=(await c.getAttribute('aria-label'))||`control ${i+1}`; await c.click(); await page.waitForTimeout(100); if(location===''){} const hash=await page.evaluate(()=>location.hash); if(hash==='#/'||!hash)add(errors,'home-navigation',name,`No navegó (${hash})`);else add(ok,'home-navigation',name,hash);
  }
  for(const r of routes.filter(r=>r.startsWith('#/tramite/'))){
    await page.goto(BASE+'index.html'+r,{waitUntil:'networkidle'}); const form=page.locator('form#data-form'); if(!(await form.count())){add(warnings,'form',r,'No usa #data-form');continue;} await fillVisibleForm(page); const valid=await form.evaluate(f=>f.checkValidity()).catch(()=>false); if(valid)add(ok,'form-valid',r,'Campos visibles aceptan datos válidos'); else {const bad=await form.locator(':invalid').evaluateAll(es=>es.map(e=>({name:e.name,type:e.type,required:e.required,value:e.value})));add(errors,'form-invalid',r,JSON.stringify(bad));}
  }
  await page.setViewportSize({width:390,height:844});
  for(const r of routes){await page.goto(BASE+'index.html'+r,{waitUntil:'networkidle'});const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);if(overflow>2)add(errors,'mobile-overflow',r,`${overflow}px`);else add(ok,'mobile',r,'OK');}
  await browser.close();
}

staticAudit(); await browserAudit();
console.log(`ERRORES: ${errors.length}`); errors.forEach((e,i)=>console.log(`${i+1}. [${e.type}] ${e.where} :: ${e.msg}`));
console.log(`ADVERTENCIAS: ${warnings.length}`); warnings.forEach((e,i)=>console.log(`${i+1}. [${e.type}] ${e.where} :: ${e.msg}`));
console.log(`OK: ${ok.length}`);
if(errors.length)process.exit(2);
