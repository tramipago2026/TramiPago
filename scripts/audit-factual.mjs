import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE='http://127.0.0.1:4173/';
const errors=[]; const warnings=[]; const ok=[];
const add=(arr,type,where,msg)=>arr.push({type,where,msg});
const staticPages=['index.html','tramites.html','opiniones.html','contacto.html','politica-privacidad.html','terminos-condiciones.html','arrepentimiento.html','baja-servicio.html','admin.html'];
const routes=['#/','#/seguimiento','#/familia/arca-monotributo','#/familia/partidas-pba','#/familia/asistencia-digital','#/tramite/antecedentes-penales','#/tramite/constancias-anses','#/tramite/informe-vehicular','#/tramite/arba-inmobiliario','#/tramite/partidas','#/tramite/partidas-caba','#/tramite/asistencia-digital','#/tramite/arca-constancia','#/tramite/arca-vep','#/tramite/arca-ccma','#/tramite/arca-reimputacion','#/tramite/arca-informe-reimputacion','#/tramite/arca-alta-monotributo','#/tramite/arca-baja-monotributo','#/tramite/arca-recategorizacion','#/tramite/arca-dfe','#/tramite/arca-actualizacion'];

function walkText(dir='.'){
  const out=[];
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    if(['.git','node_modules'].includes(ent.name))continue;
    const p=path.join(dir,ent.name);
    if(ent.isDirectory())out.push(...walkText(p));
    else if(/\.(html|js|css|md|yml)$/i.test(ent.name))out.push(p);
  }
  return out;
}

function staticAudit(){
  const textFiles=walkText();
  const texts=new Map(textFiles.map(p=>[p,fs.readFileSync(p,'utf8')]));
  const allText=[...texts.values()].join('\n');

  for(const file of staticPages){
    if(!fs.existsSync(file))add(errors,'missing-file',file,'No existe');
    else add(ok,'file',file,'Existe');
  }

  for(const file of staticPages.filter(fs.existsSync)){
    const s=texts.get(file)||'';
    const refs=[...s.matchAll(/(?:href|src)=["']([^"'#?]+)(?:[?#][^"']*)?["']/gi)]
      .map(m=>m[1]).filter(v=>!/^https?:|^mailto:|^tel:|^javascript:|^data:|^\//i.test(v));
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

  for(const file of textFiles.filter(f=>/\.(js|css)$/i.test(f)&&!f.startsWith('scripts/'))){
    const rel=file.replaceAll('\\','/');
    const name=path.basename(rel);
    const referenced=[...texts.entries()].some(([other,text])=>other!==file&&text.includes(name));
    if(!referenced)add(warnings,'unused-code',rel,'No aparece referenciado por otro archivo de producción');
  }
}

async function goto(page,url){
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:10000});
  await page.waitForTimeout(300);
}

async function inspect(page,label,{home=false}={}){
  const runtime=[];
  const onConsole=m=>{if(m.type()==='error')runtime.push('console: '+m.text())};
  const onPage=e=>runtime.push('pageerror: '+e.message);
  const onReq=r=>runtime.push('requestfailed: '+r.url()+' '+(r.failure()?.errorText||''));
  const onResp=r=>{if(r.status()>=400)runtime.push(`http ${r.status()}: ${r.url()}`)};
  page.on('console',onConsole);page.on('pageerror',onPage);page.on('requestfailed',onReq);page.on('response',onResp);
  await page.waitForTimeout(150);

  const h1=await page.locator('h1:visible').first().textContent().catch(()=>null);
  if(!h1?.trim())add(home?warnings:errors,'heading',label,'No hay H1 visible');
  else add(ok,'heading',label,h1.trim());

  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  if(overflow>2)add(errors,'overflow',label,`Desborde horizontal ${overflow}px`);else add(ok,'responsive',label,'Sin desborde horizontal');

  const dup=await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(e=>e.id).filter(Boolean);return[...new Set(ids.filter((id,i)=>ids.indexOf(id)!==i))]});
  for(const id of dup)add(errors,'duplicate-id',label,id);

  const empty=await page.locator('a:visible,button:visible').evaluateAll(els=>els.filter(e=>!(e.innerText||e.getAttribute('aria-label')||e.getAttribute('title')||'').trim()).map(e=>e.outerHTML.slice(0,180)));
  for(const x of empty)add(errors,'empty-control',label,x);

  const badLinks=await page.locator('a[href]:visible').evaluateAll(els=>els.map(e=>e.getAttribute('href')).filter(h=>!h||h==='#'||/^javascript:/i.test(h)));
  for(const x of badLinks)add(errors,'bad-link',label,String(x));

  const brokenImages=await page.locator('img:visible').evaluateAll(els=>els.filter(e=>!e.complete||e.naturalWidth===0).map(e=>e.getAttribute('src')));
  for(const x of brokenImages)add(errors,'broken-image',label,String(x));

  const noAlt=await page.locator('img:visible').evaluateAll(els=>els.filter(e=>!e.hasAttribute('alt')).map(e=>e.getAttribute('src')));
  for(const x of noAlt)add(errors,'missing-alt',label,String(x));

  const wrongWhatsapp=await page.locator('a[href*="wa.me"]:visible').evaluateAll(els=>els.map(e=>e.getAttribute('href')).filter(h=>!String(h).includes('5491167083232')));
  for(const x of wrongWhatsapp)add(errors,'whatsapp-number',label,String(x));

  for(const x of [...new Set(runtime)])add(errors,'runtime',label,x);
  page.off('console',onConsole);page.off('pageerror',onPage);page.off('requestfailed',onReq);page.off('response',onResp);
}

async function advanceEligibility(page){
  const form=page.locator('form#eligibility-form');
  if(!(await form.count()))return;
  const checks=form.locator('input[type=checkbox]:visible[required]');
  for(let i=0;i<await checks.count();i++)await checks.nth(i).check({force:true}).catch(()=>{});
  const radios=await form.locator('input[type=radio]:visible').evaluateAll(es=>[...new Set(es.map(e=>e.name).filter(Boolean))]);
  for(const name of radios){
    if(!(await form.locator(`input[type=radio][name="${name}"]:checked`).count()))await form.locator(`input[type=radio][name="${name}"]:visible`).first().check({force:true}).catch(()=>{});
  }
  if(await form.evaluate(f=>f.checkValidity()).catch(()=>false)){
    await form.locator('button[type=submit]').first().click().catch(()=>{});
    await page.waitForTimeout(100);
  }
}

function sampleValue(name,type,mode){
  if(type==='email'||/email/i.test(name))return 'prueba@example.com';
  if(type==='tel'||/whatsapp|phone|telefono/i.test(name))return '1167083232';
  if(type==='date')return '1990-01-01';
  if(type==='month')return '2026-09';
  if(/cuil|cuit/i.test(name))return '20123456786';
  if(/^dni$/i.test(name)||/documentNumber/i.test(name))return '12345678';
  if(/tramite.*dni|dni.*tramite/i.test(name))return '12345678901';
  if(/dominio|patente/i.test(name))return 'AA123AA';
  if(/year|anio|año/i.test(name))return '1990';
  if(type==='number'||mode==='numeric'||/numero|number|importe|amount/i.test(name))return '1000';
  return 'Dato de prueba';
}

async function fillVisibleForm(page){
  for(let round=0;round<5;round++){
    const selects=page.locator('form#data-form select:visible');
    for(let i=0;i<await selects.count();i++){
      const el=selects.nth(i);const vals=await el.locator('option:not([disabled])').evaluateAll(os=>os.map(o=>o.value).filter(Boolean));
      if(vals.length&&!(await el.inputValue())){await el.selectOption(vals[0]).catch(()=>{});await page.waitForTimeout(25);}
    }
    const radios=await page.locator('form#data-form input[type=radio]:visible').evaluateAll(es=>[...new Set(es.map(e=>e.name).filter(Boolean))]);
    for(const name of radios){if(!(await page.locator(`form#data-form input[type=radio][name="${name}"]:checked`).count()))await page.locator(`form#data-form input[type=radio][name="${name}"]:visible`).first().check({force:true}).catch(()=>{});}
    const checks=page.locator('form#data-form input[type=checkbox]:visible[required]');
    for(let i=0;i<await checks.count();i++)await checks.nth(i).check({force:true}).catch(()=>{});
    const fields=page.locator('form#data-form input:visible:not([type=radio]):not([type=checkbox]):not([type=file]):not([type=submit]):not([type=button]),form#data-form textarea:visible');
    for(let i=0;i<await fields.count();i++){
      const el=fields.nth(i);if(await el.inputValue().catch(()=>''))continue;
      const type=(await el.getAttribute('type'))||'text';const name=(await el.getAttribute('name'))||'';const mode=(await el.getAttribute('inputmode'))||'';
      await el.fill(sampleValue(name,type,mode)).catch(()=>{});
    }
    const email=page.locator('form#data-form input[name="email"]');const confirm=page.locator('form#data-form input[name="emailConfirm"]');
    if(await email.count()&&await confirm.count())await confirm.fill(await email.inputValue()).catch(()=>{});
    await page.waitForTimeout(50);
  }
}

async function browserAudit(){
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  page.setDefaultTimeout(5000);

  for(const p of staticPages){await goto(page,BASE+p);await inspect(page,p,{home:p==='index.html'});}
  for(const r of routes){await goto(page,BASE+'index.html'+r);await inspect(page,r,{home:r==='#/'});}

  await goto(page,BASE+'index.html#/');
  const count=await page.locator('[data-action="select-service"],[data-action="select-family"]').count();
  if(count<7)add(errors,'home-buttons','#/',`Sólo ${count} accesos principales`);else add(ok,'home-buttons','#/',`${count} accesos principales`);
  for(let i=0;i<count;i++){
    await goto(page,BASE+'index.html#/');
    const c=page.locator('[data-action="select-service"],[data-action="select-family"]').nth(i);
    const name=(await c.getAttribute('aria-label'))||(await c.textContent())?.trim()||`control ${i+1}`;
    await c.click();await page.waitForTimeout(100);
    const hash=await page.evaluate(()=>location.hash);
    if(hash==='#/'||!hash)add(errors,'home-navigation',name,`No navegó (${hash})`);else add(ok,'home-navigation',name,hash);
  }

  for(const r of routes.filter(r=>r.startsWith('#/tramite/'))){
    await goto(page,BASE+'index.html'+r);await advanceEligibility(page);
    const form=page.locator('form#data-form');
    if(!(await form.count())){add(warnings,'form',r,'No usa #data-form o requiere un paso previo no automatizado');continue;}
    await fillVisibleForm(page);
    const valid=await form.evaluate(f=>f.checkValidity()).catch(()=>false);
    if(valid)add(ok,'form-valid',r,'Campos visibles aceptan datos de prueba válidos');
    else add(errors,'form-invalid',r,JSON.stringify(await form.locator(':invalid').evaluateAll(es=>es.map(e=>({name:e.name,type:e.type,required:e.required,value:e.value,validation:e.validationMessage})))));
  }

  await page.setViewportSize({width:390,height:844});
  for(const r of routes){await goto(page,BASE+'index.html'+r);const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);if(overflow>2)add(errors,'mobile-overflow',r,`${overflow}px`);else add(ok,'mobile',r,'OK');}
  await browser.close();
}

staticAudit();await browserAudit();
console.log(`ERRORES: ${errors.length}`);errors.forEach((e,i)=>console.log(`${i+1}. [${e.type}] ${e.where} :: ${e.msg}`));
console.log(`ADVERTENCIAS: ${warnings.length}`);warnings.forEach((e,i)=>console.log(`${i+1}. [${e.type}] ${e.where} :: ${e.msg}`));
console.log(`OK: ${ok.length}`);
if(errors.length)process.exit(2);
