import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
const png=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z4i8AAAAASUVORK5CYII=","base64");
for(const p of ["/tmp/dni-frente.png","/tmp/dni-dorso.png"]) writeFileSync(p,png);
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},extraHTTPHeaders:{"Cache-Control":"no-cache","Pragma":"no-cache"}});
const page=await context.newPage();
page.on("console",m=>console.log("PAGE_CONSOLE",m.type(),m.text()));
page.on("pageerror",e=>console.log("PAGE_ERROR",e.message));
page.on("response",async res=>{
  if(res.url().includes("/functions/v1/")){
    let body=""; try{body=await res.text();}catch{}
    console.log("EDGE_RESPONSE",res.status(),res.url(),body.slice(0,500));
  }
});
await page.goto("https://tramipago.com.ar/?diag=estado-civil-"+Date.now()+"#/tramite/certificacion-estado-civil",{waitUntil:"domcontentloaded"});
await page.waitForSelector("#data-form",{timeout:20000});
await page.locator('input[name="civilRequestType"][value="certification"]').check();
await page.locator('input[name="applicantRole"][value="holder"]').check();
await page.locator('input[name="recordHolderFullName"]').fill("CONTROL 3 DIAGNOSTICO");
await page.locator('input[name="dni"]').fill("12345678");
await page.locator('input[name="dniFront"]').setInputFiles("/tmp/dni-frente.png");
await page.locator('[data-stage-next]').click();
await page.locator('input[name="dniBack"]').setInputFiles("/tmp/dni-dorso.png");
await page.locator('input[name="purpose"]').fill("Prueba técnica CONTROL 3");
await page.locator('input[name="fullName"]').fill("CONTROL 3 DIAGNOSTICO");
await page.locator('input[name="email"]').fill("control3.diag.20261007@example.invalid");
await page.locator('[data-stage-next]').click();
await page.locator('input[name="whatsapp"]').fill("1111111111");
await page.locator('input[name="authorization"]').check();
await page.locator('#data-form button[type="submit"]').click();
await page.waitForSelector("#payment-form",{timeout:20000});
await page.waitForTimeout(8000);
const diag=await page.evaluate(()=>({
  backendReady:Boolean(window.TRAMIPAGO_BACKEND),
  requests:JSON.parse(localStorage.getItem("tramipago_requests_v1")||"[]").filter(x=>x.serviceId==="certificacion-estado-civil"),
  tokens:sessionStorage.getItem("tramipago_backend_tokens_v1")
}));
console.log("DIAG",JSON.stringify(diag));
await browser.close();
