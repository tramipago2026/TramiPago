// E2E de navegador contra un doble de Supabase en memoria. Prohibido usar la API real o enviar mensajes.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const BASE='http://127.0.0.1:8765/';
const SERVER_CODE='AP-000001-ABCDEF12';
const phoneLast4='0000';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const results=[];mkdirSync('audit-artifacts',{recursive:true});
async function setup(context,status='awaiting_payment'){
  await context.addInitScript(({code,initial})=>{
    window.__TRAMIPAGO_TEST__={requests:[],uploads:[],rpc:[],status:initial,code};
    const state=window.__TRAMIPAGO_TEST__;
    window.__FAKE_SUPABASE={
      functions:{invoke:async(name,{body}={})=>{
        if(name==='create-request'){
          state.requests.push(body);
          const amount=body?.formData?.modality==='six-hours'?15000:20000;
          return {data:{requestId:'11111111-1111-4111-8111-111111111111',code,requestToken:'0123456789abcdef0123456789abcdef0123456789abcdef',status:'awaiting_payment',amount,createdAt:'2026-09-21T12:00:00.000Z',service:'Antecedentes Penales'},error:null};
        }
        if(name==='track-request')return {data:body?.code===code&&body?.last4==='0000'?{ok:true,code,status:state.status}:{ok:false},error:null};
        return {data:null,error:{message:'Función de prueba no simulada: '+name}};
      }},
      rpc:async(name,args)=>{state.rpc.push({name,args});if(name==='register_public_payment_receipt')state.status='payment_review';return {data:true,error:null};},
      storage:{from:()=>({upload:async(path,blob,settings)=>{state.uploads.push({path,size:blob.size,type:settings.contentType});return {data:{path},error:null};}})}
    };
  },{code:SERVER_CODE,initial:status});
  await context.route('**/*',route=>{
    const url=route.request().url();
    if(url.startsWith(BASE))return route.continue();
    if(url.includes('cdn.jsdelivr.net/npm/@supabase/supabase-js@2.105.0/+esm'))return route.fulfill({status:200,contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:'export const createClient=()=>window.__FAKE_SUPABASE;'});
    return route.abort('blockedbyclient');
  });
}
const sample={fullName:'Persona Ficticia',fatherFullName:'Padre Ficticio',motherFullName:'Madre Ficticia',email:'prueba@example.invalid',emailConfirm:'prueba@example.invalid',whatsapp:'1100000000',birthDate:'1990-01-01',dni:'12345678',cuil:'20123456783',dniTransaction:'12345678901',address:'Calle Ficticia 100',locality:'Ciudad Ficticia',district:'Distrito Ficticio'};
try{
  for(const modality of ['one-hour','six-hours']){
    const context=await browser.newContext({viewport:{width:1200,height:900}});
    await setup(context);
    const page=await context.newPage();
    await page.goto(BASE+'index.html#/tramite/antecedentes-penales',{waitUntil:'domcontentloaded'});
    await page.waitForSelector('#data-form');
    await page.waitForFunction(()=>Boolean(window.TRAMIPAGO_BACKEND?.client));
    await page.evaluate(({values,choice})=>{
      const form=document.getElementById('data-form');
      for(const element of form.querySelectorAll('input,select,textarea')){
        if(element.type==='checkbox'){element.checked=true;continue;}
        if(element.type==='radio'){element.checked=element.value===choice;continue;}
        if(element.type==='file'||element.type==='hidden')continue;
        if(Object.hasOwn(values,element.name))element.value=values[element.name];
        element.dispatchEvent(new Event('input',{bubbles:true}));element.dispatchEvent(new Event('change',{bubbles:true}));
      }
      form.requestSubmit();
    },{values:sample,choice:modality});
    await page.waitForSelector('#payment-form');
    await page.waitForFunction(()=>{
      const list=JSON.parse(localStorage.getItem('tramipago_requests_v1')||'[]');
      return list.length===1&&list[0].serverId&&list[0].code==='AP-000001-ABCDEF12';
    },null,{timeout:12000});
    const price=await page.evaluate(()=>JSON.parse(localStorage.getItem('tramipago_requests_v1'))[0].pricing.total);
    const expected=modality==='one-hour'?20000:15000;
    assert.equal(price,expected,`Honorarios de ${modality} no coinciden entre backend simulado y ficha`);
    assert.equal(await page.locator('#payment-form').count(),1);
    assert.ok((await page.locator('.summary-grid').innerText()).includes('Honorarios de gestión TramiPago'));
    await page.locator('#receipt').setInputFiles({name:'COMPROBANTE-FICTICIO-SIN-VALIDEZ.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4\n%%EOF')});
    await page.locator('#payment-form button[type="submit"]').click();
    await page.waitForSelector('.confirmation');
    await page.waitForFunction(()=>window.__TRAMIPAGO_TEST__.status==='payment_review');
    const snapshot=await page.evaluate(()=>({state:window.__TRAMIPAGO_TEST__,local:JSON.parse(localStorage.getItem('tramipago_requests_v1'))[0]}));
    assert.equal(snapshot.state.requests.length,1,'La ficha no debe duplicarse');
    assert.equal(snapshot.state.uploads.length,1,'Solo subir el comprobante una vez');
    assert.equal(snapshot.state.rpc.filter(call=>call.name==='register_public_payment_receipt').length,1,'Registrar comprobante una sola vez');
    assert.equal(snapshot.local.status,'payment_review','El recibo no acredita el pago');
    assert.ok(!('confirmedAt' in snapshot.local),'No inventar acreditación');
    await page.waitForFunction(()=>Boolean(document.querySelector('.request-code')?.textContent?.includes('AP-000001-ABCDEF12')));
    await page.locator('[data-action="track-request"]').click();
    await page.waitForSelector('#tracking-form');
    // Al venir de «Ver estado» ya hay un resultado local: el CTA cambia a «Consultar otro código».
    // Se usa el recorrido real del usuario para hacer una nueva consulta validada en el servidor.
    if(await page.locator('[data-tracking-new-query]').count())await page.locator('[data-tracking-new-query]').click();
    await page.locator('[name="trackingCode"]').fill(SERVER_CODE);
    await page.locator('[name="trackingPhoneLast4"]').fill(phoneLast4);
    await page.locator('#tracking-form button[type="submit"]').click();
    await page.waitForFunction(()=>document.querySelector('.tracking-result .status-badge')?.textContent?.includes('Pago en revisión'));
    results.push({modality,price,requestCount:snapshot.state.requests.length,receipts:snapshot.state.uploads.length,paymentStatus:snapshot.local.status,trackingSameDevice:'PASS'});
    await context.close();
  }
  const independent=await browser.newContext({viewport:{width:390,height:844}});
  await setup(independent,'payment_review');
  const page=await independent.newPage();
  await page.goto(BASE+'index.html#/seguimiento',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.TRAMIPAGO_BACKEND?.client));
  assert.equal(await page.evaluate(()=>localStorage.getItem('tramipago_requests_v1')),null,'La consulta remota no debe depender de datos locales');
  await page.locator('[name="trackingCode"]').fill(SERVER_CODE);
  await page.locator('[name="trackingPhoneLast4"]').fill(phoneLast4);
  await page.locator('#tracking-form button[type="submit"]').click();
  await page.waitForFunction(()=>document.querySelector('.tracking-result .status-badge')?.textContent?.includes('Pago en revisión'));
  results.push({device:'móvil independiente',status:'Pago en revisión',tracking:'PASS'});
  await independent.close();
  console.log('PASS: AP 1 h y 6 h, alta simulada sin duplicación, 2 comprobantes simulados, revisión manual sin acreditación y seguimiento desde otro dispositivo. NO se usó Supabase real, banco ni WhatsApp.');
}finally{
  writeFileSync('audit-artifacts/ap-simulado.json',JSON.stringify({environment:'SDK simulado en navegador; 0 solicitudes reales',results},null,2));
  await browser.close();
}
