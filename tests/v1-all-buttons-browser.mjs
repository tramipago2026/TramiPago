// Chromium local. Bloquea TODO destino externo. Ningún formulario se envía ni se contacta WhatsApp.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
const base='http://127.0.0.1:8765/';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const output='audit-artifacts';mkdirSync(output,{recursive:true});
const report={scope:'23 enlaces/servicios + navegación + botón Ayuda en Chromium PC y móvil; sin backend, pagos ni mensajes',services:[],families:[],issues:[]};
try{
 for(const screen of [{name:'PC',width:1440,height:900},{name:'móvil',width:390,height:844}]){
  const ctx=await browser.newContext({viewport:{width:screen.width,height:screen.height}});
  await ctx.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort('blockedbyclient'));
  const page=await ctx.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.TRAMI_SERVICES?.length===23&&window.TRAMIPAGO_WHATSAPP?.number==='5491167083232');
  const metadata=await page.evaluate(()=>({services:window.TRAMI_SERVICES.map(s=>({id:s.id,name:s.name})),directs:window.TRAMI_DIRECTS.map(d=>d.serviceId),families:window.TRAMI_FAMILIES.map(f=>({id:f.id,services:f.serviceIds}))}));
  for(const family of metadata.families){
   await page.goto(base+'#/familia/'+family.id,{waitUntil:'domcontentloaded'});
   await page.waitForSelector('.family-page');
   const buttonCount=await page.locator('[data-action="select-service"]').count();
   if(family.id!=='partidas-pba'&&buttonCount!==family.services.length)report.issues.push(`${screen.name}: familia ${family.id}: ${buttonCount}/${family.services.length} botones de trámite`);
   report.families.push({screen:screen.name,id:family.id,buttons:buttonCount});
  }
  for(const item of metadata.services){
   await page.goto(base+'#/tramite/'+item.id,{waitUntil:'domcontentloaded'});
   await page.waitForSelector('.process-shell');
   const result=await page.evaluate(()=>{
     const help=document.querySelector('.main-nav [data-action="whatsapp"]');
     window.__testedWhatsApp='';
     window.open=(url)=>{window.__testedWhatsApp=url;return {};};
     help?.click();
     const link=window.__testedWhatsApp;
     let message='';let phone='';
     try{const u=new URL(link);phone=u.pathname;message=u.searchParams.get('text')||'';}catch(_){}
     return {title:document.querySelector('.process-title h1')?.textContent?.trim(),form:!!document.querySelector('#data-form,#eligibility-form'),help:!!help,url:link,phone,message,broken:document.documentElement.scrollWidth>innerWidth+5};
   });
   if(result.title!==item.name||!result.form||!result.help||result.phone!=='/5491167083232'||!result.message.includes(`Trámite: ${item.name}.`)||!result.message.includes('Etapa:')||result.broken)report.issues.push(`${screen.name}/${item.id}: título, formulario, WhatsApp contextual o ancho no corresponde: ${JSON.stringify(result)}`);
   report.services.push({screen:screen.name,id:item.id,title:result.title,form:result.form,whatsappContext:result.message,phone:result.phone,noHorizontalOverflow:!result.broken});
  }
  for(const id of metadata.directs){
   await page.goto(base,{waitUntil:'domcontentloaded'});
   const button=page.locator(`[data-action="select-service"][data-service-id="${id}"]`);
   if(await button.count()!==1){report.issues.push(`${screen.name}: entrada directa ${id} ausente`);continue;}
   await button.click();
   if(!page.url().endsWith('#/tramite/'+id))report.issues.push(`${screen.name}: botón directo ${id} no navega a su formulario`);
  }
  await page.goto(base+'#/familia/partidas-pba',{waitUntil:'domcontentloaded'});
  for(const jurisdiction of ['pba','caba']){
   await page.locator('[data-action="select-partida-type"][data-part-type="birth"]').click();
   await page.locator(`[data-action="select-partidas-jurisdiction"][data-jurisdiction="${jurisdiction}"]`).click();
   if(!page.url().endsWith('#/tramite/'+(jurisdiction==='pba'?'partidas':'partidas-caba')))report.issues.push(`${screen.name}: selector ${jurisdiction} no dirige al formulario correcto`);
   await page.goto(base+'#/familia/partidas-pba',{waitUntil:'domcontentloaded'});
  }
  if(errors.length)report.issues.push(`${screen.name}: errores JavaScript: ${errors.join(' | ')}`);
  await ctx.close();
 }
 assert.equal(report.services.length,46,'Faltaron rutas de PC o móvil');
 for(const issue of report.issues)console.error('ERROR: '+issue);
 assert.equal(report.issues.length,0,'Existen fallos de navegación o WhatsApp');
 console.log('PASS: 23/23 formularios y ayudas contextuales en PC + 23/23 en móvil, 4 botones directos y navegación Partidas PBA/CABA comprobados sin envíos externos.');
}finally{
 writeFileSync(output+'/botones-23-tramites.json',JSON.stringify(report,null,2));
 await browser.close();
}
