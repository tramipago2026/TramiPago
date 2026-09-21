// Chromium solo localhost, conexiones externas bloqueadas, sin formularios enviados.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const base='http://127.0.0.1:8765/';
try{
 for(const size of [{name:'PC',width:1440,height:900},{name:'móvil',width:390,height:844}]){
  const ctx=await browser.newContext({viewport:{width:size.width,height:size.height}});
  await ctx.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort('blockedbyclient'));
  const page=await ctx.newPage();
  for(const id of ['apostilla-tad','legalizaciones']){
   await page.goto(base+'#/tramite/'+id,{waitUntil:'domcontentloaded'});
   await page.waitForSelector('#data-form input[type="file"]');
   await page.waitForFunction(()=>document.querySelector('#data-form input[type="file"]')?.closest('.field')?.querySelectorAll('small').length>=1);
   const values=await page.locator('#data-form input[type="file"]').evaluate(input=>{
    const field=input.closest('.field');
    return {hints:[...field.querySelectorAll('small')].map(e=>e.textContent.trim()).filter(t=>t.startsWith('Archivo máximo:')),optimizer:field.querySelectorAll('.upload-optimizer-note').length};
   });
   assert.equal(values.hints.length,1,`${size.name}/${id}: mensaje límite PDF repetido: ${JSON.stringify(values)}`);
   assert.equal(values.optimizer,0,`${size.name}/${id}: ayuda de optimización PDF duplicada`);
   console.log(`PASS: ${size.name}/${id}: único aviso «${values.hints[0]}».`);
  }
  await ctx.close();
 }
}finally{await browser.close();}
