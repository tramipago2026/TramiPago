import { chromium } from "playwright";
import { spawn } from "node:child_process";

const server=spawn("python3",["-m","http.server","4173"],{stdio:"ignore"});
await new Promise(r=>setTimeout(r,1200));
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
await page.addInitScript(()=>{ window.__openedUrls=[]; window.open=(url)=>{window.__openedUrls.push(String(url)); return null;}; });
const base="http://127.0.0.1:4173/index.html";
const failures=[];
const ok=(cond,msg)=>{if(!cond)failures.push(msg);};
async function goto(hash="#/"){ await page.goto(base+hash,{waitUntil:"networkidle"}); await page.waitForTimeout(250); }
async function helpUrl(){ await page.evaluate(()=>{window.__openedUrls=[];}); await page.click(".nav-help"); await page.waitForTimeout(80); return page.evaluate(()=>window.__openedUrls.at(-1)||""); }

await goto("#/");
ok((await page.locator(".nav-home").innerText()).trim().includes("Inicio"),"Botón Inicio sin texto esperado");
ok((await page.locator(".nav-tracking").innerText()).trim().includes("Mi código"),"Botón Mi código sin texto esperado");
ok((await page.locator(".nav-help").innerText()).trim().includes("Ayuda"),"Botón Ayuda sin texto esperado");
let url=await helpUrl();
ok(url.startsWith("https://wa.me/5491167083232?text="),"Ayuda de inicio no abre WhatsApp correcto");
ok(decodeURIComponent(url).includes("TramiPago"),"Ayuda de inicio sin mensaje contextual");
await page.click(".nav-tracking"); await page.waitForTimeout(100);
ok(page.url().includes("#/seguimiento"),"Mi código no navega a seguimiento");
ok(await page.locator("#tracking-form").count()===1,"Seguimiento no muestra formulario");

const services=await page.evaluate(()=>window.TRAMI_SERVICES.filter(s=>s.active).map(s=>({id:s.id,name:s.name})));
const families=await page.evaluate(()=>window.TRAMI_FAMILIES.map(f=>({id:f.id,name:f.name})));
console.log("ACTIVE_SERVICES",services.length,services.map(s=>s.id).join(","));
for(const family of families){
  await goto("#/familia/"+family.id);
  ok(await page.locator(".family-page").count()===1,"Familia no renderiza: "+family.id);
  url=await helpUrl();
  ok(url.startsWith("https://wa.me/5491167083232?text="),"Ayuda familia sin WhatsApp: "+family.id);
  if(family.id==="atencion-abogado") ok(/abogado/i.test(decodeURIComponent(url)),"Ayuda abogado sin contexto: "+family.id);
}

const tinyPng=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=","base64");
async function fillVisibleForm(){
  const form=page.locator("form:visible").first();
  if(await form.count()===0)return true;
  const inputs=form.locator("input,select,textarea");
  for(let i=0;i<await inputs.count();i++){
    const el=inputs.nth(i); if(!(await el.isVisible()))continue;
    const tag=await el.evaluate(e=>e.tagName.toLowerCase());
    const type=(await el.getAttribute("type"))||""; const name=(await el.getAttribute("name"))||"";
    if(type==="hidden"||type==="submit"||type==="button")continue;
    if(type==="checkbox"){ if(!(await el.isChecked()))await el.check(); continue; }
    if(type==="radio"){ const group=form.locator('input[type="radio"][name="'+name+'"]'); if(await group.count())await group.first().check(); continue; }
    if(type==="file"){ await el.setInputFiles({name:"prueba.png",mimeType:"image/png",buffer:tinyPng}); continue; }
    if(tag==="select"){ const opts=await el.locator("option").evaluateAll(os=>os.filter(o=>!o.disabled&&o.value).map(o=>o.value)); if(opts.length)await el.selectOption(opts[0]); continue; }
    let value="Prueba TramiPago";
    if(type==="email")value="e2e@example.invalid"; else if(type==="tel")value="11 6708 3232"; else if(type==="date")value="1990-01-01"; else if(type==="month")value="2026-09"; else if(type==="number")value="1"; else if(name==="dni")value="12345678"; else if(name==="cuil"||name==="cuit")value="20-12345678-3"; else if(/patent/i.test(name))value="AA123BB"; else if(/emailConfirm/i.test(name))value="e2e@example.invalid";
    await el.fill(value);
  }
  const valid=await form.evaluate(f=>f.checkValidity());
  if(!valid){ const bad=await form.evaluate(f=>Array.from(f.querySelectorAll(":invalid")).map(e=>({name:e.name,type:e.type,value:e.value,message:e.validationMessage,pattern:e.pattern,min:e.min,max:e.max}))); console.log("INVALID_FIELDS",JSON.stringify(bad)); }
  return valid;
}

for(const service of services){
  await goto("#/tramite/"+service.id);
  ok(await page.locator(".process-shell,.service-page,.panel").count()>0,"Trámite no renderiza: "+service.id);
  url=await helpUrl(); const msg=decodeURIComponent(url);
  ok(url.startsWith("https://wa.me/5491167083232?text="),"Ayuda sin WhatsApp: "+service.id);
  if(service.id.startsWith("abogado-")) ok(/abogado/i.test(msg)&&msg.includes(service.name),"WhatsApp abogado sin contexto: "+service.id);
  else ok(msg.includes(service.name)||msg.includes("trámite"),"WhatsApp sin contexto de servicio: "+service.id);
  const eligible=page.locator("#eligibility-form");
  if(await eligible.count()){ const valid=await fillVisibleForm(); ok(valid,"Elegibilidad inválida tras completar: "+service.id); if(valid){await eligible.locator('button[type="submit"]').click(); await page.waitForTimeout(120);} }
  if(await page.locator("#data-form").count()){ const valid=await fillVisibleForm(); ok(valid,"Formulario de datos inválido tras completar: "+service.id); }
}

await goto("#/");
const next=page.locator(".promo-rail-arrow.next"), card=page.locator(".promo-rail-card");
if(await next.count()&&await card.count()){
  const seen=new Set();
  for(let i=0;i<12;i++){ const href=await card.getAttribute("href"); if(href)seen.add(href); await next.click(); await page.waitForTimeout(50); }
  ok(seen.size>=5,"Carrusel no expone suficientes destinos");
  for(const href of seen){ if(href.startsWith("https://wa.me/"))ok(href.includes("5491167083232"),"Carrusel WhatsApp con número incorrecto"); else if(href.startsWith("#/"))ok(/#\/(tramite|familia)\//.test(href),"Carrusel con ruta interna inválida: "+href); else ok(/municipales\.html/.test(href),"Carrusel con destino inesperado: "+href); }
  console.log("CAROUSEL_DESTINATIONS",JSON.stringify([...seen]));
}

await goto("#/familia/atencion-abogado");
const topics=page.locator("[data-legal-topic]");
ok(await topics.count()===4,"Consulta legal no tiene cuatro temas");
for(let i=0;i<await topics.count();i++){ await topics.nth(i).click(); ok((await topics.nth(i).getAttribute("aria-pressed"))==="true","Tema legal no selecciona"); }
const lf=page.locator("#legal-whatsapp-form");
if(await lf.count()){
  await lf.locator('[name="fullName"]').fill("Prueba Legal"); await lf.locator('[name="phone"]').fill("11 6708 3232"); await lf.locator('[name="query"]').fill("Consulta de prueba");
  await page.evaluate(()=>{window.__openedUrls=[];}); await lf.locator('button[type="submit"]').click(); await page.waitForTimeout(80);
  const legalUrl=await page.evaluate(()=>window.__openedUrls.at(-1)||"");
  ok(legalUrl.startsWith("https://wa.me/5491167083232?text="),"Consulta legal no abre WhatsApp correcto");
  ok(/Consulta de prueba/.test(decodeURIComponent(legalUrl)),"Consulta legal pierde el texto");
}

await browser.close(); server.kill();
if(failures.length){ console.error("FAILURES",failures.length); for(const f of failures)console.error("-",f); process.exit(1); }
console.log("PASS FULL_BROWSER_AUDIT services="+services.length+" families="+families.length);