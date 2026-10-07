import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const png=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z4i8AAAAASUVORK5CYII=","base64");
for(const p of ["/tmp/dni-frente.png","/tmp/dni-dorso.png","/tmp/comprobante.png"]) writeFileSync(p,png);

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},extraHTTPHeaders:{"Cache-Control":"no-cache","Pragma":"no-cache"}});
const page=await context.newPage();
const fail=m=>{throw new Error(m)};

await page.goto("https://tramipago.com.ar/?control3=estado-civil-"+Date.now()+"#/tramite/certificacion-estado-civil",{waitUntil:"domcontentloaded"});
await page.waitForSelector("#data-form",{timeout:20000});
const initial=(await page.locator("#data-form").innerText()).replace(/\s+/g," ");
console.log("INITIAL_TEXT",initial);
if(!/15(?:\.|\s)?000/.test(initial)) fail("No se ve honorario 15000");
if(/8(?:\.|\s)?000/.test(initial)) fail("Se muestra comercialmente 8000");

await page.locator('input[name="civilRequestType"][value="certification"]').check();
await page.waitForTimeout(150);
if(await page.locator('input[name="civilJurisdiction"]').first().isVisible()) fail("Certificación pide jurisdicción");

await page.locator('input[name="applicantRole"][value="holder"]').check();
await page.locator('input[name="recordHolderFullName"]').fill("CONTROL 3 ESTADO CIVIL");
await page.locator('input[name="dni"]').fill("12345678");
await page.locator('input[name="dniFront"]').setInputFiles("/tmp/dni-frente.png");
await page.locator('input[name="dniBack"]').setInputFiles("/tmp/dni-dorso.png");
await page.locator('input[name="purpose"]').fill("Prueba técnica CONTROL 3");
await page.locator('input[name="fullName"]').fill("CONTROL 3 ESTADO CIVIL");
await page.locator('input[name="email"]').fill("control3.estado.civil.20261007@example.invalid");
await page.locator('input[name="whatsapp"]').fill("1111111111");
await page.locator('input[name="authorization"]').check();
await page.locator('#data-form button[type="submit"]').click();

await page.waitForSelector("#payment-form",{timeout:20000});
const paymentText=(await page.locator("body").innerText()).replace(/\s+/g," ");
console.log("PAYMENT_TEXT",paymentText);
if(!/15(?:\.|\s)?000/.test(paymentText)) fail("Pago no muestra 15000");
if(/8(?:\.|\s)?000/.test(paymentText)) fail("Pago muestra tasa oficial 8000");

await page.waitForFunction(()=>{try{
  const list=JSON.parse(localStorage.getItem("tramipago_requests_v1")||"[]");
  const r=list.find(x=>x.serviceId==="certificacion-estado-civil");
  return r && r.backendSyncedAt && !r.backendSyncError;
}catch{return false}},null,{timeout:30000});

await page.locator('#payment-form input[name="receipt"]').setInputFiles("/tmp/comprobante.png");
await page.locator('#payment-form button[type="submit"]').click();
await page.waitForFunction(()=>{try{
  const list=JSON.parse(localStorage.getItem("tramipago_requests_v1")||"[]");
  const r=list.find(x=>x.serviceId==="certificacion-estado-civil");
  return r && r.status==="payment_review" && r.payment?.uploaded===true && !r.backendSyncError;
}catch{return false}},null,{timeout:30000});

const result=await page.evaluate(()=>{
  const list=JSON.parse(localStorage.getItem("tramipago_requests_v1")||"[]");
  const r=list.find(x=>x.serviceId==="certificacion-estado-civil");
  return {code:r.code,status:r.status,pricing:r.pricing,answers:{
    civilRequestType:r.answers?.civilRequestType,
    civilJurisdiction:r.answers?.civilJurisdiction||null,
    purpose:r.answers?.purpose,
    internalAgency:r.answers?.internalAgency,
    procedureVariant:r.answers?.procedureVariant,
    dniFront:r.answers?.dniFront,
    dniBack:r.answers?.dniBack
  }};
});
console.log("CONTROL3_ESTADO_CIVIL_REAL",JSON.stringify(result));
await browser.close();
