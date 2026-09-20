// Navegador real, SIN operaciones de backend: solo localhost y lectura del DOM.
// Bloquea peticiones externas, WhatsApp, Supabase y organismos oficiales. No envía formularios.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
const output='audit-artifacts';mkdirSync(output,{recursive:true});
const base='http://127.0.0.1:8765/';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const results={timestamp:new Date().toISOString(),mode:'LOCAL ONLY; external connections blocked; NO form submission, Supabase write or payment',views:[],services:[],warnings:[]};
try{
  for(const cfg of [{name:'desktop',width:1440,height:900,isMobile:false},{name:'mobile',width:390,height:844,isMobile:true}]){
    const context=await browser.newContext({viewport:{width:cfg.width,height:cfg.height},isMobile:cfg.isMobile,hasTouch:cfg.isMobile,deviceScaleFactor:1});
    await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort('blockedbyclient'));
    const page=await context.newPage();
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(base,{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>Array.isArray(window.TRAMI_SERVICES)&&window.TRAMI_SERVICES.length===23,{timeout:12000});
    await page.waitForSelector('.home-catalog .home-tile',{timeout:12000});
    const home=await page.evaluate(()=>({
      tiles:[...document.querySelectorAll('.home-catalog .home-tile')].map(el=>({label:el.getAttribute('aria-label'),width:+el.getBoundingClientRect().width.toFixed(1),height:+el.getBoundingClientRect().height.toFixed(1),image:el.querySelector('img')?.getAttribute('src')||null,imageLoaded:el.querySelector('img')?Boolean(el.querySelector('img').naturalWidth):null,font:getComputedStyle(el.querySelector('.catalog-card-title')||el).fontFamily})),
      docWidth:document.documentElement.scrollWidth,viewport:innerWidth,
    }));
    await page.screenshot({path:`${output}/${cfg.name}-inicio.png`,fullPage:true});
    if(home.docWidth>home.viewport+4)results.warnings.push(`${cfg.name}: overflow horizontal ${home.docWidth-home.viewport}px`);
    if(home.tiles.some(tile=>tile.imageLoaded===false))results.warnings.push(`${cfg.name}: alguna imagen local no cargó`);
    if(home.tiles.length!==9)results.warnings.push(`${cfg.name}: se esperaban 9 tarjetas, hay ${home.tiles.length}`);
    results.views.push({name:cfg.name,route:'#/',...home,pageErrors:errors});
    for(const family of ['legalizaciones-apostillas','partidas-pba']){
      await page.goto(base+'#/familia/'+family,{waitUntil:'domcontentloaded',timeout:30000});
      await page.waitForSelector('.family-page',{timeout:12000});
      const geometry=await page.evaluate(()=>({heading:document.querySelector('h1')?.textContent?.trim(),width:document.documentElement.scrollWidth,viewport:innerWidth,images:[...document.querySelectorAll('.family-page img')].map(el=>({src:el.getAttribute('src'),loaded:Boolean(el.naturalWidth),width:+el.getBoundingClientRect().width.toFixed(1),height:+el.getBoundingClientRect().height.toFixed(1)}))}));
      await page.screenshot({path:`${output}/${cfg.name}-${family}.png`,fullPage:true});
      if(geometry.width>geometry.viewport+4)results.warnings.push(`${cfg.name}/${family}: overflow horizontal`);
      results.views.push({name:cfg.name,route:'#/familia/'+family,...geometry,pageErrors:[...errors]});
    }
    if(cfg.name==='desktop'){
      const services=await page.evaluate(()=>window.TRAMI_SERVICES.map(({id,name})=>({id,name})));
      for(const service of services){
        await page.goto(base+'#/tramite/'+service.id,{waitUntil:'domcontentloaded',timeout:30000});
        const form=page.locator('#data-form,#eligibility-form');
        const found=await form.count();
        const fields=found?await form.locator('input,select,textarea').count():0;
        const title=await page.locator('h1,h2').first().textContent().catch(()=>null);
        results.services.push({id:service.id,name:service.name,formVisible:found>0,fields,title:title?.trim()||null});
        if(!found)results.warnings.push('No se renderizó ficha: '+service.id);
      }
    }
    await context.close();
  }
  assert.equal(results.services.length,23,'El navegador no recorrió los 23 servicios');
  assert.ok(results.services.every(item=>item.formVisible),'Existen fichas sin formulario visible');
  console.log(`PASS: 23 fichas renderizadas en Chromium local; ${results.views.length} pantallas capturadas en PC/móvil. Advertencias visuales: ${results.warnings.length}.`);
  for(const warning of results.warnings)console.log('REVISAR: '+warning);
}finally{
  writeFileSync(`${output}/resultado.json`,JSON.stringify(results,null,2));
  await browser.close();
}
