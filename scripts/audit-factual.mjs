import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE='http://127.0.0.1:4173/';
const errors=[]; const warnings=[]; const ok=[];
const add=(arr,type,where,msg)=>arr.push({type,where,msg});
const staticPages=['index.html','tramites.html','opiniones.html','contacto.html','politica-privacidad.html','terminos-condiciones.html','arrepentimiento.html','baja-servicio.html','admin.html'];
const routes=['#/','#/seguimiento','#/familia/arca-monotributo','#/familia/partidas-pba','#/familia/asistencia-digital','#/tramite/antecedentes-penales','#/tramite/constancias-anses','#/tramite/informe-vehicular','#/tramite/arba-inmobiliario','#/tramite/partidas','#/tramite/partidas-caba','#/tramite/asistencia-digital','#/tramite/arca-constancia','#/tramite/arca-vep','#/tramite/arca-ccma','#/tramite/arca-reimputacion','#/tramite/arca-informe-reimputacion','#/tramite/arca-alta-monotributo','#/tramite/arca-baja-monotributo','#/tramite/arca-recategorizacion','#/tramite/arca-dfe','#/tramite/arca-actualizacion'];

function staticAudit(){
  const textFiles=[];
  function walk(dir){
    for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
      if(['.git','node_modules'].includes(ent.name))continue;
      const p=path.join(dir,ent.name);
      if(ent.isDirectory())walk(p);
      else if(/\.(html|js|css|md|yml)$/i.test(ent.name))textFiles.push(p);
    }
  }
  walk('.');
  const allText=textFiles.map(p=>fs.readFileSync(p,'utf8')).join('\n');
  for(const file of staticPages){if(!fs.existsSync(file))add(errors,'missing-file',file,'No existe');else add(ok,'file',file,'Existe');}
  for(const file of staticPages.filter(fs.existsSync)){
    const s=fs.readFileSync(file,'utf8');
    const refs=[...s.matchAll(/(?:href|src)=["']([^"'#?]+)(?:[?#][^"']*)?["']/gi)]
      .map(m=>m[1])
      .filter(v=>!/^https?:|^mailto:|^tel:|^javascript:|^data:|^\//i.test(v));
    for(const ref of refs){
      const clean=decodeURIComponent(ref);
      if(!fs.existsSync(clean))add(errors,'broken-local-ref',file,clean);
    }
  }
  if(fs.existsSync('assets')){
    for(const f of fs.readdirSync('assets')){
      const rel='assets/'+f;
      const count=allText.split(rel).length-1;
      if(count===0)add(warnings,'unused-asset',rel,'Sin referencia textual en producción');
      else add(ok,'asset-ref',rel,`Referencias: ${count}`);
    }
  }
  for(const file of textFiles.filter(f=>/\.(js|css)$/i.test(f) && !f.startsWith('scripts/'))){
    const rel=file.replaceAll('\\','/');
    const name=path.basename(rel);
    const refs=allText.split(name).length-1;
    if(refs<=1)add(warnings,'possibly-unused-code',rel,'No aparece referenciado fuera de sí mismo');
  }
}

async function inspect(page,label){
  const runtime=[];
  const onConsole=m=>{if(m.type()==='error')runtime.push('console: '+m.text())};
  const onPage=e=>runtime.push('pageerror: '+e.message);
  const onReq=r=>runtime.push('requestfailed: '+r.url()+' '+(r.failure()?.errorText||''));
  const onResp=r=>{if(r.status()>=400)runtime.push(`http ${r.status()}: ${r.url()}`)};
  page.on('console',onConsole); page.on('pageerror',onPage); page.on('requestfailed',onReq); page.on('response',onResp);
  await page.waitForTimeout(300);

  const h1=await page.locator('h1:visible').first().textContent().catch(()=>null);
  if(!h1?.trim())add(errors,'heading',label,'No hay H1 visible'); else add(ok,'heading',label,h1.trim());

  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  if(overflow>2)add(errors,'overflow',label,`Desborde horizontal ${overflow}px`); else add(ok,'responsive',label,'Sin desborde horizontal');

  const duplicateIds=await page.evaluate(()=>{
    const ids=[...document.querySelectorAll('[id]')].map(e=>e.id).filter(Boolean);
    return [...new Set(ids.filter((id,i)=>ids.indexOf(id)!==i))];
  });
  for(const id of duplicateIds)add(errors,'duplicate-id',label,id);

  const emptyControls=await page.locator('a:visible,button:visible').evaluateAll(els=>els.filter(e=>!(e.innerText||e.getAttribute('aria-label')||e.getAttribute('title')||'').trim()).map(e=>e.outerHTML.slice(0,180)));
  for(const x of emptyControls)add(errors,'empty-control',label,x);

  const badLinks=await page.locator('a[href]:visible').evaluateAll(els=>els.map(e=>e.getAttribute('href')).filter(h=>!h||h==='#'||/^javascript:/i.test(h)));
  for(const x of badLinks)add(errors,'bad-link',label,String(x));

  const badTargets=await page.locator('a[target="_blank"]:visible').evaluateAll(els=>els.filter(e=>!(e.getAttribute('rel')||'').includes('noopener')).map(e=>e.getAttribute('href')));
  for(const x of badTargets)add(errors,'unsafe-target-blank',label,String(x));

  const images=await page.locator('img:visible').evaluateAll(els=>els.filter(e=>!e.complete||e.naturalWidth===0).map(e=>e.getAttribute('src')));
  for(const x of images)add(errors,'broken-image',label,String(x));

  const missingAlt=await page.locator('img:visible').evaluateAll(els=>els.filter(e=>!e.hasAttribute('alt')).map(e=>e.getAttribute('src')));
  for(const x of missingAlt)add(errors,'missing-alt',label,String(x));

  const unlabeledInputs=await page.locator('input:visible:not([type="hidden"]):not([type="submit"]):not([type="button"]),select:visible,textarea:visible').evaluateAll(els=>els.filter(e=>{
    if(e.getAttribute('aria-label')||e.getAttribute('aria-labelledby'))return false;
    if(e.id&&document.querySelector(`label[for="${CSS.escape(e.id)}"]`))return false;
    return !e.closest('label');
  }).map(e=>`${e.tagName.toLowerCase()}[name="${e.getAttribute('name')||''}"]`));
  for(const x of unlabeledInputs)add(warnings,'unlabeled-field',label,x);

  for(const x of [...new Set(runtime)])add(errors,'runtime',label,x);
  page.off('console',onConsole);page.off('pageerror',onPage);page.off('requestfailed',onReq);page.off('response',onResp);
}

async function advanceEligibility(page){
  const form=page.locator('form#eligibility-form');
  if(!(await form.count()))return;
  const checks=form.locator('input[type=checkbox]:visible[required]');
  for(let i=0;i<await checks.count();i++)await checks.nth(i).check({force:true}).catch(()=>{});
  const radios=await form.locator('input[type=radio]:visible').evaluateAll(es=>[...new Set(es.map(e=>e.name).filter(Boolean))]);
  for(const n of radios){if(!(await form.locator(`input[type=radio][name="${n}"]:checked`).count()))await form.locator(`input[type=radio][name="${n}"]:visible`).first().check({force:true}).catch(()=>{});}
  if(await form.evaluate(f=>f.checkValidity()).catch(()=>false)){
    await form.locator('button[type=submit]').first().click().catch(()=>{});
    await page.waitForTimeout(120);
  }
}

function sampleValue(name,type,mode){
  if(type==='email'||/email/i.test(name))return 'prueba@example.com';
  if(type==='tel'||/whatsapp|phone|telefono/i.test(name))return '1167083232';
  if(type==='date')return '1990-01-01';
  if(/cuil|cuit/i.test(name))return '20123456786';
  if(/dni|documento|documentNumber|tramite/i.test(name))return '12345678901';
  if(/dominio|patente/i.test(name))return 'AA123AA';
  if(/year|anio|año/i.test(name))return '1990';
  if(type==='number'||mode==='numeric'||/numero|number|importe|amount/i.test(name))return '1000';
  return 'Dato de prueba';
}

async function fillVisibleForm(page){
  for(let round=0;round<5;round++){
    const selects=page.locator('form#data-form select:visible');
    for(let i=0;i<await selects.count();i++){
      const el=selects.nth(i);
      const vals=await el.locator('option:not([disabled])').evaluateAll(os=>os.map(o=>o.value).filter(Boolean));
      if(vals.length && !(await el.inputValue())){await el.selectOption(vals[0]).catch(()=>{});await page.waitForTimeout(30);}
    }
    const radios=await page.locator('form#data-form input[type=radio]:visible').evaluateAll(es=>[...new Set(es.map(e=>e.name).filter(Boolean))]);
    for(const n of radios){if(!(await page.locator(`input[type=radio][name="${n}"]:checked`).count()))await page.locator(`input[type=radio][name="${n}"]:visible`).first().check({force:true}).catch(()=>{});}
    const checks=page.locator('form#data-form input[type=checkbox]:visible[required]');
    for(let i=0;i<await checks.count();i++)await checks.nth(i).check({force:true}).catch(()=>{});
    const fields=page.locator('form#data-form input:visible:not([type=radio]):not([type=checkbox]):not([type=file]):not([type=submit]):not([type=button]), form#data-form textarea:visible');
    for(let i=0;i<await fields.count();i++){
      const el=fields.nth(i); if(await el.inputValue().catch(()=>''))continue;
      const type=(await el.getAttribute('type'))||'text';const name=(await el.getAttribute('name'))||'';const mode=(await el.getAttribute('inputmode'))||'';
      await el.fill(sampleValue(name,type,mode)).catch(()=>{});
    }
    const email=page.locator('form#data-form input[name="email"]');
    const confirm=page.locator('form#data-form input[name="emailConfirm"]');
    if(await email.count() && await confirm.count())await confirm.fill(await email.inputValue()).catch(()=>{});
    await page.waitForTimeout(70);
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
    await page.goto(BASE+'index.html#/',{waitUntil:'networkidle'});
    const c=page.locator('[data-action="select-service"],[data-action="select-family"]').nth(i);
    const name=(await c.getAttribute('aria-label'))||(await c.textContent())?.trim()||`control ${i+1}`;
    await c.click(); await page.waitForTimeout(120);
    const hash=await page.evaluate(()=>location.hash);
    if(hash==='#/'||!hash)add(errors,'home-navigation',name,`No navegó (${hash})`);else add(ok,'home-navigation',name,hash);
  }

  for(const r of routes.filter(r=>r.startsWith('#/tramite/'))){
    await page.goto(BASE+'index.html'+r,{waitUntil:'networkidle'});
    await advanceEligibility(page);
    const form=page.locator('form#data-form');
    if(!(await form.count())){add(warnings,'form',r,'No usa #data-form o requiere un paso previo no automatizado');continue;}
    await fillVisibleForm(page);
    const valid=await form.evaluate(f=>f.checkValidity()).catch(()=>false);
    if(valid)add(ok,'form-valid',r,'Campos visibles aceptan datos de prueba válidos');
    else {
      const bad=await form.locator(':invalid').evaluateAll(es=>es.map(e=>({name:e.name,type:e.type,required:e.required,value:e.value,validation:e.validationMessage})));
      add(errors,'form-invalid',r,JSON.stringify(bad));
    }
  }

  await page.setViewportSize({width:390,height:844});
  for(const r of routes){
    await page.goto(BASE+'index.html'+r,{waitUntil:'networkidle'});
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    if(overflow>2)add(errors,'mobile-overflow',r,`${overflow}px`);else add(ok,'mobile',r,'OK');
  }
  await browser.close();
}

staticAudit();
await browserAudit();
console.log(`ERRORES: ${errors.length}`); errors.forEach((e,i)=>console.log(`${i+1}. [${e.type}] ${e.where} :: ${e.msg}`));
console.log(`ADVERTENCIAS: ${warnings.length}`); warnings.forEach((e,i)=>console.log(`${i+1}. [${e.type}] ${e.where} :: ${e.msg}`));
console.log(`OK: ${ok.length}`);
if(errors.length)process.exit(2);
