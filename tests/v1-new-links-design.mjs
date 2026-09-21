// Auditoría de diseño y enlaces en Chromium REAL y localhost. No envía formularios.
// Bloquea WhatsApp, Supabase, sitios oficiales e imágenes remotas. Fotos reales deben comprobarse por separado.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
const base='http://127.0.0.1:8765/';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
mkdirSync('audit-artifacts',{recursive:true});
const report={mode:'Local Chromium, PC 1440x900 y móvil 390x844; peticiones externas bloqueadas; sin envíos reales',links:[],families:[],issues:[],warnings:[]};
const check=(ok,message)=>{if(!ok)report.issues.push(message);};
const screenshot=async(page,name)=>page.screenshot({path:`audit-artifacts/${name}.png`,fullPage:true});
try{
 for(const device of [{name:'pc',width:1440,height:900},{name:'movil',width:390,height:844}]){
  const context=await browser.newContext({viewport:{width:device.width,height:device.height},deviceScaleFactor:1});
  await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort('blockedbyclient'));
  const page=await context.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.TRAMI_SERVICES?.length===23&&window.TRAMI_FAMILIES?.length===5);
  const metadata=await page.evaluate(()=>({families:window.TRAMI_FAMILIES.map(f=>({id:f.id,name:f.name,serviceIds:f.serviceIds})),services:window.TRAMI_SERVICES.map(s=>({id:s.id,name:s.name,active:s.active,fields:s.fields?.length||0}))}));
  await screenshot(page,`${device.name}-inicio-baseline`);
  for(const family of metadata.families){
   await page.goto(base+'#/familia/'+family.id,{waitUntil:'domcontentloaded'});
   await page.waitForSelector('.family-page');
   if(family.id==='atencion-abogado')await page.waitForSelector('#legal-whatsapp-form');
   await screenshot(page,`${device.name}-familia-${family.id}`);
   const info=await page.evaluate(()=>{
    const heading=document.querySelector('.family-heading h1, .partidas-selector-heading h1, #legal-consultation h1, .arca-family-page h1');
    const computed=heading?getComputedStyle(heading):null;
    return {heading:heading?.textContent?.trim()||'',headingVisible:!!heading&&computed.display!=='none'&&computed.visibility!=='hidden'&&+computed.opacity>0&&heading.getBoundingClientRect().height>0,
      pageWidth:document.documentElement.scrollWidth,viewport:innerWidth,
      serviceButtons:[...document.querySelectorAll('.family-service-card [data-action="select-service"]')].map(button=>{const cs=getComputedStyle(button),r=button.getBoundingClientRect(),card=button.closest('.family-service-card'),cc=card?getComputedStyle(card):null,cr=card?.getBoundingClientRect();return {id:button.dataset.serviceId,label:button.textContent.trim(),display:cs.display,visibility:cs.visibility,opacity:+cs.opacity,buttonWidth:r.width,buttonHeight:r.height,cardHeight:cr?.height,cardBorder:cc?.borderTopWidth,cardBorderColor:cc?.borderTopColor,cardText:card?.querySelector('h2')?.textContent.trim(),background:card?getComputedStyle(card,'::before').backgroundImage:null};}),
      legalTopics:document.querySelectorAll('[data-legal-topic]').length,
      partidaTypes:document.querySelectorAll('[data-action="select-partida-type"]').length,
      links:[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href'))};
   });
   report.families.push({device:device.name,id:family.id,...info});
   check(info.headingVisible,`${device.name}/${family.id}: encabezado de categoría oculto o ausente`);
   check(info.pageWidth<=info.viewport+5,`${device.name}/${family.id}: desbordamiento horizontal ${info.pageWidth-info.viewport}px`);
   if(family.id==='legalizaciones-apostillas'){
    check(info.serviceButtons.length===2,`${device.name}/legalizaciones: se requieren dos botones`);
    for(const button of info.serviceButtons){
     check(button.label.length>0&&button.display!=='none'&&button.visibility==='visible'&&button.opacity>=0.99&&button.buttonHeight>=44,`${device.name}/legalizaciones: ${button.id} botón de acción oculto, sin etiqueta o pequeño: ${JSON.stringify(button)}`);
     check(button.cardBorder==='2px'&&/rgb\((?:23, 33, 43|5, 5, 5)\)/.test(button.cardBorderColor||''),`${device.name}/legalizaciones: ${button.id} carece del borde negro/carbón aprobado: ${button.cardBorder} ${button.cardBorderColor}`);
     check(button.buttonHeight<button.cardHeight*.4,`${device.name}/legalizaciones: ${button.id} botón transparente superpuesto a toda la tarjeta`);
    }
    for(const id of ['legalizaciones','apostilla-tad']){
     await page.goto(base+'#/familia/legalizaciones-apostillas',{waitUntil:'domcontentloaded'});
     const button=page.locator(`.family-service-card [data-action="select-service"][data-service-id="${id}"]`);
     check(await button.count()===1,`${device.name}/${id}: acceso único ausente`);
     await button.click();
     check(page.url().endsWith('#/tramite/'+id),`${device.name}/${id}: pulsar el botón no abre su formulario`);
     await page.waitForSelector('#data-form');
     const form=await page.evaluate(()=>({title:document.querySelector('.process-title h1')?.textContent.trim(),inputs:document.querySelectorAll('#data-form input,#data-form textarea,#data-form select').length,submit:document.querySelector('#data-form button[type="submit"]')?.textContent.trim(),privacy:!!document.querySelector('#data-form input[name="authorization"]'),width:document.documentElement.scrollWidth,viewport:innerWidth}));
     check(form.inputs>=5&&form.submit&&form.privacy,`${device.name}/${id}: formulario sin campos, continuación o consentimiento: ${JSON.stringify(form)}`);
     check(form.width<=form.viewport+5,`${device.name}/${id}: formulario desborda horizontalmente`);
     report.links.push({device:device.name,button:id,destination:page.url(),form});
     await screenshot(page,`${device.name}-formulario-${id}`);
    }
   }else if(family.id==='atencion-abogado'){
    check(info.legalTopics===4,`${device.name}/abogado: faltan temas del formulario`);
   }else if(family.id==='partidas-pba'){
    check(info.partidaTypes===4,`${device.name}/partidas: faltan tipos de partida`);
   }else{
    for(const id of family.serviceIds){
     await page.goto(base+'#/familia/'+family.id,{waitUntil:'domcontentloaded'});
     const button=page.locator(`[data-action="select-service"][data-service-id="${id}"]`);
     check(await button.count()===1,`${device.name}/${family.id}: acceso ${id} ausente`);
     if(await button.count()!==1)continue;
     await button.click();
     check(page.url().endsWith('#/tramite/'+id),`${device.name}/${family.id}: botón ${id} abre ruta incorrecta`);
     // El hash cambia sincrónicamente, pero el formulario puede renderizarse en el siguiente frame.
     await page.locator('#data-form,#eligibility-form').first().waitFor({state:'visible',timeout:8000}).catch(()=>{});
     const found=await page.locator('#data-form,#eligibility-form').count();
     check(found===1,`${device.name}/${family.id}: botón ${id} sin formulario luego de esperar renderizado`);
     report.links.push({device:device.name,button:id,destination:page.url(),formVisible:found===1});
    }
   }
  }
  if(errors.length)report.issues.push(`${device.name}: errores de JavaScript: ${errors.join(' | ')}`);
  await context.close();
 }
 for(const issue of report.issues)console.error('ERROR: '+issue);
 console.log(`INSPECCIÓN: ${report.families.length} pantallas de familias, ${report.links.length} clics con verificación de destino/formulario; ${report.issues.length} errores.`);
 assert.equal(report.issues.length,0,'Auditoría de diseño y enlaces nuevos con errores');
 console.log('PASS: dos tarjetas de Legalizaciones con CTA realmente VISIBLE y borde carbón, formularios, cinco familias y enlaces comprobados en PC y móvil. SIN mensajes ni gestiones reales.');
}finally{
 writeFileSync('audit-artifacts/v1-new-links-design.json',JSON.stringify(report,null,2));
 await browser.close();
}
