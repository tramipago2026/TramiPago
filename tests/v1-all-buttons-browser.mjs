// Chromium local: bloquea TODAS las conexiones externas; ningún formulario, pago ni WhatsApp enviados.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
const base='http://127.0.0.1:8765/';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
mkdirSync('audit-artifacts',{recursive:true});
const report={scope:'23 servicios, tarjetas, familias, WhatsApp en PC y móvil. Sin backend ni mensajes.',services:[],families:[],states:[],issues:[]};
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
   if(family.id==='atencion-abogado'){
    await page.waitForSelector('#legal-whatsapp-form');
    const count=await page.locator('[data-legal-topic]').count();
    if(count!==4)report.issues.push(`${screen.name}: consulta con abogado requiere 4 temas, aparecen ${count}`);
    for(const id of ['art','accidentes','sucesiones','laboral']){
     const button=page.locator(`[data-legal-topic="${id}"]`);
     if(await button.count()!==1){report.issues.push(`${screen.name}: tema jurídico ${id} ausente`);continue;}
     await button.click();
     if(await button.getAttribute('aria-pressed')!=='true')report.issues.push(`${screen.name}: tema jurídico ${id} no se selecciona`);
     await button.click();
    }
    report.families.push({screen:screen.name,id:family.id,buttons:count,kind:'temas de consulta WhatsApp'});
   }else if(family.id==='partidas-pba'){
    const count=await page.locator('[data-action="select-partida-type"]').count();
    if(count!==4)report.issues.push(`${screen.name}: Partidas no muestra 4 tipos`);
    report.families.push({screen:screen.name,id:family.id,buttons:count,kind:'tipos de partidas'});
   }else{
    const count=await page.locator('[data-action="select-service"]').count();
    if(count!==family.services.length)report.issues.push(`${screen.name}: familia ${family.id}: ${count}/${family.services.length} botones`);
    report.families.push({screen:screen.name,id:family.id,buttons:count,kind:'accesos a formularios'});
   }
  }
  for(const item of metadata.services){
   await page.goto(base+'#/tramite/'+item.id,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(name=>document.querySelector('.process-title h1')?.textContent?.trim()===name,item.name);
   const result=await page.evaluate(()=>{
     const help=document.querySelector('.main-nav [data-action="whatsapp"]');
     window.__testedWhatsApp='';
     window.open=(url)=>{window.__testedWhatsApp=url;return {};};
     help?.click();
     let message='',phone='';
     try{const u=new URL(window.__testedWhatsApp);phone=u.pathname;message=u.searchParams.get('text')||'';}catch(_){}
     return {title:document.querySelector('.process-title h1')?.textContent?.trim(),form:!!document.querySelector('#data-form,#eligibility-form'),help:!!help,phone,message,broken:document.documentElement.scrollWidth>innerWidth+5};
   });
   if(result.title!==item.name||!result.form||!result.help||result.phone!=='/5491167083232'||!result.message.includes(`Trámite: ${item.name}.`)||!result.message.includes('Etapa:')||result.broken)report.issues.push(`${screen.name}/${item.id}: ficha o WhatsApp incorrectos: ${JSON.stringify(result)}`);
   report.services.push({screen:screen.name,id:item.id,form:result.form,phone:result.phone,whatsappContext:result.message,noHorizontalOverflow:!result.broken});
  }
  for(const id of metadata.directs){
   await page.goto(base,{waitUntil:'domcontentloaded'});
   await page.waitForSelector('.home-catalog');
   const button=page.locator(`[data-action="select-service"][data-service-id="${id}"]`);
   if(await button.count()!==1){report.issues.push(`${screen.name}: tarjeta directa ${id} ausente`);continue;}
   await button.click();
   if(!page.url().endsWith('#/tramite/'+id))report.issues.push(`${screen.name}: tarjeta ${id} no llega al formulario`);
  }
  await page.goto(base+'#/familia/partidas-pba',{waitUntil:'domcontentloaded'});
  for(const jurisdiction of ['pba','caba']){
   await page.locator('[data-action="select-partida-type"][data-part-type="birth"]').click();
   await page.locator(`[data-action="select-partidas-jurisdiction"][data-jurisdiction="${jurisdiction}"]`).click();
   if(!page.url().endsWith('#/tramite/'+(jurisdiction==='pba'?'partidas':'partidas-caba')))report.issues.push(`${screen.name}: selector ${jurisdiction} mal dirigido`);
   await page.goto(base+'#/familia/partidas-pba',{waitUntil:'domcontentloaded'});
  }
  // Solo memoria local ficticia: no se crea solicitud en base ni se envía mensaje.
  await page.goto(base+'#/');
  await page.evaluate(()=>{
   const row={id:'TEST-LOCAL',code:'AP-000001-ABCDEF12',serviceId:'antecedentes-penales',serviceName:'Antecedentes Penales',status:'payment_pending',answers:{},pricing:{total:20000}};
   localStorage.setItem('tramipago_requests_v1',JSON.stringify([row]));
   sessionStorage.setItem('tramipago_active_request_v1',JSON.stringify({id:row.id,code:row.code,serviceId:row.serviceId}));
  });
  await page.goto(base+'#/tramite/antecedentes-penales');
  await page.waitForSelector('#payment-form');
  let statusMessage=await page.evaluate(()=>window.TRAMIPAGO_WHATSAPP.build(document.querySelector('.main-nav [data-action="whatsapp"]')));
  if(!statusMessage.includes('AP-000001-ABCDEF12')||!statusMessage.includes('Pago pendiente')||!statusMessage.includes('Etapa: Pago / comprobante'))report.issues.push(`${screen.name}: WhatsApp no incorpora código, pago pendiente y etapa`);
  report.states.push({screen:screen.name,state:'Pago pendiente',message:statusMessage});
  await page.goto(base+'#/');
  await page.evaluate(()=>{
    const list=JSON.parse(localStorage.getItem('tramipago_requests_v1'));
    list[0].status='finalized';
    localStorage.setItem('tramipago_requests_v1',JSON.stringify(list));
    sessionStorage.removeItem('tramipago_active_request_v1');
  });
  await page.goto(base+'#/seguimiento');
  await page.locator('#tracking-code').fill('AP-000001-ABCDEF12');
  statusMessage=await page.evaluate(()=>window.TRAMIPAGO_WHATSAPP.build(document.querySelector('.main-nav [data-action="whatsapp"]')));
  if(!statusMessage.includes('AP-000001-ABCDEF12')||!statusMessage.includes('Finalizado')||!statusMessage.includes('Etapa: Seguimiento'))report.issues.push(`${screen.name}: WhatsApp no distingue finalizado de pendiente`);
  report.states.push({screen:screen.name,state:'Finalizado',message:statusMessage});
  if(errors.length)report.issues.push(`${screen.name}: errores JavaScript: ${errors.join(' | ')}`);
  await ctx.close();
 }
 assert.equal(report.services.length,46,'Faltaron rutas de PC o móvil');
 for(const issue of report.issues)console.error('ERROR: '+issue);
 assert.equal(report.issues.length,0,'Existen fallos de botones, rutas o WhatsApp');
 console.log('PASS: 46/46 fichas (23 PC + 23 móvil), familias y botones directos, Partidas PBA/CABA, 4 consultas abogado, WhatsApp contextual y estados pendiente/finalizado simulados. No se envió nada.');
}finally{
 writeFileSync('audit-artifacts/botones-23-tramites.json',JSON.stringify(report,null,2));
 await browser.close();
}
