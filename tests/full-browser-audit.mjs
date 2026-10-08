import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";

const server=spawn("python3",["-m","http.server","4173"],{stdio:"ignore"});
await new Promise(r=>setTimeout(r,1200));
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
await page.addInitScript(()=>{
  window.__openedUrls=[];
  window.__cspViolations=[];
  document.addEventListener("securitypolicyviolation",event=>{
    window.__cspViolations.push({directive:event.violatedDirective,blocked:event.blockedURI});
  });
  window.open=(url)=>{window.__openedUrls.push(String(url)); return {opener:null,location:{replace(next){window.__openedUrls.push(String(next));}}};};
});
const base="http://127.0.0.1:4173/index.html";
const failures=[];
const ok=(cond,msg)=>{if(!cond)failures.push(msg);};
async function goto(hash="#/"){ await page.goto(base+hash,{waitUntil:"networkidle"}); await page.waitForTimeout(250); }
async function helpUrl(){ await page.evaluate(()=>{window.__openedUrls=[];}); await page.click(".nav-help"); try{await page.waitForFunction(()=>window.__openedUrls.some(u=>String(u).startsWith("https://wa.me/")),{timeout:4200});}catch{} return page.evaluate(()=>window.__openedUrls.filter(u=>String(u).startsWith("https://wa.me/")).at(-1)||""); }

await goto("#/");
ok((await page.locator(".nav-home").innerText()).trim().includes("Inicio"),"Botón Inicio sin texto esperado");
ok((await page.locator(".nav-tracking").innerText()).trim().includes("Ver mi trámite"),"Botón Ver mi trámite sin texto esperado");
ok((await page.locator(".nav-help").innerText()).trim().includes("Ayuda"),"Botón Ayuda sin texto esperado");
const footerCols=page.locator(".site-footer .footer-menu-col");
ok(await footerCols.count()===2,"Footer debe tener exactamente 2 columnas");
const footerHeadings=(await page.locator(".site-footer .footer-menu-col h3").allTextContents()).map(t=>t.trim());
ok(JSON.stringify(footerHeadings)===JSON.stringify(["INFORMACIÓN LEGAL","DERECHOS DEL USUARIO"]),"Footer con encabezados inesperados: "+JSON.stringify(footerHeadings));
const footerLinks=(await page.locator(".site-footer a").allTextContents()).map(t=>t.trim());
for(const forbidden of ["Todos los trámites","Ver mi trámite","WhatsApp"])ok(!footerLinks.includes(forbidden),"Footer repite navegación superior: "+forbidden);

let url=await helpUrl();
ok(url.startsWith("https://wa.me/5491167083232?text="),"Ayuda de inicio no abre WhatsApp correcto");
ok(decodeURIComponent(url).includes("TramiPago"),"Ayuda de inicio sin mensaje contextual");
await page.click(".nav-tracking"); await page.waitForTimeout(100);
ok(page.url().includes("#/seguimiento"),"Ver mi trámite no navega a seguimiento");
ok(await page.locator("#tracking-form").count()===1,"Seguimiento no muestra formulario");

const services=await page.evaluate(()=>window.TRAMI_SERVICES.filter(s=>s.active).map(s=>({id:s.id,name:s.name,intakeOnly:Boolean(s.intakeOnly)})));
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
  for(let stagePass=0;stagePass<12;stagePass++){
    const inputs=form.locator("input,select,textarea");
    for(let i=0;i<await inputs.count();i++){
      const el=inputs.nth(i); if(!(await el.isVisible()))continue;
      const tag=await el.evaluate(e=>e.tagName.toLowerCase());
      const type=(await el.getAttribute("type"))||""; const name=(await el.getAttribute("name"))||""; const pattern=(await el.getAttribute("pattern"))||""; const inputmode=(await el.getAttribute("inputmode"))||"";
      if(type==="hidden"||type==="submit"||type==="button")continue;
      if(type==="checkbox"){ if(!(await el.isChecked()))await el.check(); continue; }
      if(type==="radio"){ const group=form.locator('input[type="radio"][name="'+name+'"]'); if(await group.count())await group.first().check(); continue; }
      if(type==="file"){ await el.setInputFiles({name:"prueba.png",mimeType:"image/png",buffer:tinyPng}); continue; }
      if(tag==="select"){ const opts=await el.locator("option").evaluateAll(os=>os.filter(o=>!o.disabled&&o.value).map(o=>o.value)); if(opts.length)await el.selectOption(opts[0]); continue; }
      let value="Prueba TramiPago";
      if(type==="email")value="e2e@example.invalid"; else if(type==="tel")value="11 6708 3232"; else if(type==="date")value="1990-01-01"; else if(type==="month")value="2026-09"; else if(type==="number")value="1"; else if(name==="dni")value="12345678"; else if(name==="cuil"||name==="cuit")value="20-12345678-6"; else if(/patent/i.test(name))value="AA123BB"; else if(/emailConfirm/i.test(name))value="e2e@example.invalid"; else if(inputmode==="numeric"||pattern.includes("[0-9"))value="12345";
      await el.fill(value);
    }
    const next=form.locator("[data-stage-next]:visible");
    if(await next.count()){await next.click();await page.waitForTimeout(60);continue;}
    break;
  }
  const valid=await form.evaluate(f=>f.checkValidity());
  if(!valid){ const bad=await form.evaluate(f=>Array.from(f.querySelectorAll(":invalid")).map(e=>({name:e.name,type:e.type,value:e.value,message:e.validationMessage,pattern:e.pattern,min:e.min,max:e.max}))); console.log("INVALID_FIELDS",JSON.stringify(bad)); }
  return valid;
}

// Estado Civil: bifurcación específica sin crear un flujo paralelo.
await goto("#/tramite/certificacion-estado-civil");
const civilForm=page.locator("#data-form");
ok(await civilForm.count()===1,"Estado Civil no muestra formulario");
let civilText=(await page.locator(".process-shell").innerText()).replace(/\s+/g," ");
ok(civilText.includes("15.000"),"Estado Civil no muestra honorario TramiPago $15.000");
ok(!civilText.includes("8.000"),"Estado Civil muestra comercialmente la tasa oficial de $8.000");
ok(!(await page.locator('input[name="civilJurisdiction"]').first().isVisible()),"Estado Civil pide jurisdicción antes de elegir Soltería");
await page.locator('input[name="civilRequestType"][value="certification"]').check();
await page.waitForTimeout(80);
ok(!(await page.locator('input[name="civilJurisdiction"]').first().isVisible()),"Certificación de Estado Civil no debe pedir PBA/CABA");
ok(await page.locator('input[name="dniFront"]').isVisible()&&await page.locator('input[name="dniBack"]').isVisible(),"Certificación no muestra DNI frente/dorso");
await page.locator('input[name="civilRequestType"][value="single"]').check();
await page.waitForTimeout(80);
ok(await page.locator('input[name="civilJurisdiction"]').first().isVisible(),"Soltería no muestra selector PBA/CABA");
await page.locator('input[name="civilJurisdiction"][value="caba"]').check();
await page.waitForTimeout(80);
ok(await page.locator(".estado-civil-caba-notice").count()===1,"CABA no muestra aviso de trámite inexistente");
ok((await page.locator(".estado-civil-caba-notice").innerText()).includes("no expide certificado de soltería"),"Aviso CABA incorrecto");
ok(await page.locator('#data-form button[type="submit"]').isDisabled(),"CABA permite iniciar soltería indebidamente");
await page.locator('input[name="civilJurisdiction"][value="pba"]').check();
await page.waitForTimeout(80);
ok(await page.locator(".estado-civil-caba-notice").count()===0,"Aviso CABA persiste al elegir PBA");
ok(await page.locator('input[name="dniFront"]').isVisible(),"Soltería PBA no continúa al formulario");

// Certificado de Domicilio PBA: activo y visible dentro de Partidas y Certificados.
await goto("#/familia/partidas-pba");
ok(await page.locator('[data-service-id="certificado-domicilio-pba"]').count()===1,"Domicilio no aparece en Partidas y Certificados");
const estadoCard=page.locator('[data-service-id="certificacion-estado-civil"]');
ok(await estadoCard.count()===1,"Estado Civil debe seguir visible");
const estadoImage=estadoCard.locator(".partidas-type-media img");
ok((await estadoImage.getAttribute("src"))===["assets","estado-civil-card-v1.webp"].join("/"),"Estado Civil no usa la imagen específica nueva");

await goto("#/tramite/certificado-domicilio-pba");
const domicilioForm=page.locator("#data-form");
ok(await domicilioForm.count()===1,"Certificado de Domicilio no muestra formulario");
const domicilioText=(await page.locator(".process-shell").innerText()).replace(/\s+/g," ");
ok(domicilioText.includes("20.000"),"Certificado de Domicilio no muestra precio final $20.000");
for(const field of ["dni","declaredAddress","addressStreet","addressNumber","addressLocality","addressDistrict","destinationEntity"]){
  ok(await page.locator('[name="'+field+'"]').count()===1,"Domicilio no muestra campo "+field);
}

await goto("#/");
const searchInput=page.locator("#tramipago-search-input");
ok(await searchInput.count()===1,"Buscador principal no disponible");
if(await searchInput.count()){
  await searchInput.fill("certificado de domicilio");
  await page.waitForTimeout(100);
  ok(await page.locator('.catalog-search-result[href="#/tramite/certificado-domicilio-pba"]').count()===1,"Buscador no encuentra Certificado de Domicilio");
  await searchInput.fill("Partidas y Certificados");
  await page.waitForTimeout(100);
  ok(await page.locator('.catalog-search-result[href="#/familia/partidas-pba"]').count()===1,"Buscador no encuentra Partidas y Certificados");
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
  if(await page.locator("#data-form").count()){
    const valid=await fillVisibleForm();
    ok(valid,"Formulario de datos inválido tras completar: "+service.id);
    if(valid){
      await page.locator('#data-form button[type="submit"]').click();
      await page.waitForTimeout(180);
      const dataError=((await page.locator('#data-form .form-error').count())?await page.locator('#data-form .form-error').innerText():"").trim();
      ok(!dataError,"Formulario rechazó datos de auditoría: "+service.id+" -> "+dataError);
      if(service.intakeOnly){
        ok(await page.locator(".confirmation").count()===1,"Consulta sin pago no llega a confirmación: "+service.id);
      }else{
        ok(await page.locator("#payment-form").count()===1,"Trámite pago no llega a pantalla de pago: "+service.id);
        if(await page.locator("#payment-form").count()){
          const receipt=page.locator('#payment-form input[type="file"]');
          if(service.id==="informe-vehicular"){
            const largePng=readFileSync(new URL("../assets/promo-tramite-online-exact-20261001.png",import.meta.url));
            await receipt.setInputFiles({name:"comprobante-grande.png",mimeType:"image/png",buffer:largePng});
            await page.waitForTimeout(900);
            const note=((await page.locator(".upload-optimizer-note").count())?await page.locator(".upload-optimizer-note").last().innerText():"");
            ok(!/supera|error|no se pudo/i.test(note),"Optimización de imagen grande reportó error: "+note);
          }else{
            await receipt.setInputFiles({name:"comprobante-prueba.png",mimeType:"image/png",buffer:tinyPng});
          }
          await page.locator('#payment-form button[type="submit"]').click();
          await page.waitForTimeout(220);
          const payError=((await page.locator('#payment-form .form-error').count())?await page.locator('#payment-form .form-error').innerText():"").trim();
          ok(!payError,"Pago/comprobante rechazado en UI: "+service.id+" -> "+payError);
          ok(await page.locator(".confirmation").count()===1,"Pago no llega a confirmación: "+service.id);
        }
      }
    }
  }
}

await goto("#/");
const next=page.locator(".promo-rail-arrow.next"), card=page.locator(".promo-rail-card");
if(await next.count()&&await card.count()){
  const seen=new Set();
  for(let i=0;i<12;i++){ const href=await card.getAttribute("href"); if(href)seen.add(href); await next.click(); await page.waitForTimeout(50); }
  ok(seen.size>=5,"Carrusel no expone suficientes destinos");
  for(const href of seen){ if(href.startsWith("https://wa.me/"))ok(href.includes("5491167083232"),"Carrusel WhatsApp con número incorrecto"); else if(href.startsWith("#/"))ok(/#\/(tramite|familia)\//.test(href),"Carrusel con ruta interna inválida: "+href); else ok(/municipales\.html/.test(href),"Carrusel con destino inesperado: "+href); }
  console.log("CAROUSEL_DESTINATIONS",JSON.stringify([...seen]));
  const carouselBase=["assets","carousel-v1"].join("/")+"/";
  const expectedCarouselSources=[
    "promo-tramites-online-v1.webp",
    "promo-arca-monotributo-v1.webp",
    "promo-apostillado-legalizaciones-v1.webp",
    "promo-consulta-abogado-v1.webp",
    "promo-informe-vehicular-v1.webp",
    "promo-antecedentes-penales-v1.webp",
    "promo-deuda-municipal-v1.webp",
    "promo-cualquier-tramite-v1.webp",
    "promo-estado-civil-v1.webp"
  ].map(name=>carouselBase+name);
  const seenImages=new Set();
  for(let i=0;i<18;i++){
    const image=card.locator("img");
    const src=(await image.getAttribute("src"))||"";
    if(src)seenImages.add(src);
    ok((await image.evaluate(img=>img.complete&&img.naturalWidth===1000&&img.naturalHeight===1000)),"Pieza del carrusel no carga a 1000x1000: "+src);
    await next.click();
    await page.waitForTimeout(60);
  }
  for(const expected of expectedCarouselSources)ok(seenImages.has(expected),"Falta pieza final del carrusel: "+expected);
  for(const src of seenImages)ok(expectedCarouselSources.includes(src),"Carrusel muestra pieza vieja o inesperada: "+src);
  ok(seenImages.size===9,"Carrusel final no contiene exactamente 9 piezas: "+seenImages.size);
}

await goto("#/familia/atencion-abogado");
const legalCards=page.locator(".family-service-card");
ok(await legalCards.count()===4,"Consulta con abogado no muestra cuatro servicios");
const legalTexts=(await legalCards.allTextContents()).join(" ");
for(const expected of ["ART","Accidentes","Sucesiones","laboral"])ok(new RegExp(expected,"i").test(legalTexts),"Falta consulta jurídica: "+expected);
url=await helpUrl();
ok(url.startsWith("https://wa.me/5491167083232?text="),"Ayuda jurídica no abre WhatsApp correcto");
ok(/abogado/i.test(decodeURIComponent(url)),"Ayuda jurídica sin contexto");

await goto("#/seguimiento");
await page.evaluate(()=>{
  const app=document.getElementById("app");
  app.innerHTML='<section class="tracking-page"><div class="tracking-result"><div class="status-header"><p class="eyebrow">IV-001281-D4993304</p><span class="status-badge">Finalizado</span></div><div class="timeline"></div></div></section>';
});
await page.waitForTimeout(150);
ok(await page.locator(".final-opinion-cta").count()===1,"Finalizado no muestra CTA de opinión");
const opinionHref=(await page.locator(".final-opinion-cta a").getAttribute("href"))||"";
ok(opinionHref.includes("opiniones.html?codigo=IV-001281-D4993304"),"CTA de opinión no conserva el código del trámite");

const secondaryPages=["tramites.html","municipales.html","contacto.html","opiniones.html","arrepentimiento.html","baja-servicio.html","politica-privacidad.html","terminos-condiciones.html"];
for(const target of secondaryPages){
  await page.goto("http://127.0.0.1:4173/"+target,{waitUntil:"networkidle"});
  await page.waitForTimeout(120);
  ok(await page.locator("body").count()===1,"Página secundaria no renderiza: "+target);
}
const cspViolations=await page.evaluate(()=>window.__cspViolations||[]);
ok(cspViolations.length===0,"Violaciones CSP detectadas: "+JSON.stringify(cspViolations));

// Chat 02 — tramites.html funciona como catálogo, sin tarifario general.
await page.goto("http://127.0.0.1:4173/tramites.html",{waitUntil:"networkidle"});
await page.waitForTimeout(150);
const catalogCards=page.locator("#tramites-catalog-grid .card");
ok(await catalogCards.count()===services.length+1,"Catálogo no refleja servicios activos + municipales");
const catalogText=(await page.locator("main").innerText()).replace(/\s+/g," ");
ok(!catalogText.includes("$"),"tramites.html vuelve a mostrar precios agrupados");
const catalogActions=page.locator("#tramites-catalog-grid .action");
ok(await catalogActions.count()===services.length+1,"Faltan botones del catálogo");
for(const label of await catalogActions.allTextContents())ok(label.trim()==="Ver trámite","CTA del catálogo distinto de Ver trámite: "+label);
for(const card of await catalogCards.all()){
  ok((await card.locator("h2").innerText()).trim().length>0,"Tarjeta de catálogo sin nombre");
  ok((await card.locator("p").innerText()).trim().length>0,"Tarjeta de catálogo sin descripción");
}

// CONTROL 3 responsive: verificación real contra producción en viewport móvil estrecho.
await page.setViewportSize({width:390,height:844});
async function auditMobileProduction(target, expectedText="", ctaText=""){
  await page.goto(target,{waitUntil:"domcontentloaded"});
  await page.waitForTimeout(500);
  const mobile=await page.evaluate(()=>{
    const viewportWidth=window.innerWidth;
    const docWidth=document.documentElement.scrollWidth;
    const bodyWidth=document.body.scrollWidth;
    const offenders=Array.from(document.querySelectorAll("body *")).filter(el=>{
      const style=getComputedStyle(el);
      if(style.position==="fixed"||style.position==="sticky")return false;
      const rect=el.getBoundingClientRect();
      return rect.width>0&&(rect.right>viewportWidth+2||rect.left<-2);
    }).slice(0,12).map(el=>({tag:el.tagName,className:String(el.className||"").slice(0,100),left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right}));
    return {viewportWidth,docWidth,bodyWidth,offenders};
  });
  ok(mobile.viewportWidth===390,"Viewport móvil inesperado en "+target+": "+mobile.viewportWidth);
  ok(mobile.docWidth<=392&&mobile.bodyWidth<=392,"Desborde horizontal móvil en "+target+": "+JSON.stringify(mobile));
  const h1=page.locator("h1:visible").first();
  if(expectedText){
    ok(await h1.count()===1,"H1 no visible en móvil: "+target);
    if(await h1.count()) ok((await h1.innerText()).toLowerCase().includes(expectedText.toLowerCase()),"H1 móvil inesperado en "+target+": "+await h1.innerText());
  }else if(new URL(target).pathname==="/"){
    ok(await page.locator(".home-tile:visible").count()>=8,"Tarjetas principales no visibles en la portada móvil");
    ok(await page.getByText("TramiPago: trámites online con asistencia y seguimiento",{exact:true}).count()===0,"El bloque SEO visible no debe reaparecer en la portada");
  }
  const footer=page.locator("footer:visible").first();
  ok(await footer.count()===1,"Footer no visible en móvil: "+target);
  if(ctaText){
    const cta=page.getByRole("link",{name:ctaText,exact:true}).first();
    ok(await cta.count()===1&&await cta.isVisible(),"CTA no visible en móvil: "+target+" -> "+ctaText);
  }
  console.log("MOBILE_PRODUCTION_OK",target,JSON.stringify(mobile));
}
await auditMobileProduction("https://tramipago.com.ar/");
await auditMobileProduction("https://tramipago.com.ar/antecedentes-penales.html","Antecedentes Penales","Iniciar gestión");
await auditMobileProduction("https://tramipago.com.ar/sucesiones.html","sucesiones","Enviar consulta");
await auditMobileProduction("https://tramipago.com.ar/consulta-laboral.html","Consulta laboral","Enviar consulta");

await browser.close(); server.kill();
if(failures.length){ console.error("FAILURES",failures.length); for(const f of failures)console.error("-",f); process.exit(1); }
console.log("PASS FULL_BROWSER_AUDIT services="+services.length+" families="+families.length);