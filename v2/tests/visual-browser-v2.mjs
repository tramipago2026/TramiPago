// TramiPago V2: browser review of isolated branch assets, ONLY on localhost.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync,spawn} from 'node:child_process';
import {createServer} from 'node:http';
const cwd=process.cwd(), root=path.join(cwd,'v2'), out=path.join(cwd,'v2-browser-captures');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};
fs.mkdirSync(out,{recursive:true});
const server=createServer((req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!pathname.startsWith('/v2/'))throw new Error('outside V2');
  const candidate=path.resolve(root,pathname.slice(4));
  const file=pathname.endsWith('/')?path.join(candidate,'index.html'):candidate;
  if(!file.startsWith(root+path.sep))throw new Error('unsafe path');
  if(!fs.statSync(file).isFile())throw new Error('not a file');
  res.setHeader('Content-Type',types[path.extname(file)]??'application/octet-stream');
  fs.createReadStream(file).pipe(res);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const port=server.address().port;
let chrome;
for(const candidate of ['google-chrome','google-chrome-stable','chromium','chromium-browser']){
 try{execFileSync('which',[candidate],{stdio:'ignore'});chrome=candidate;break;}catch{}
}
if(!chrome){server.close();throw new Error('Navegador Chrome no disponible; validación visual NO ejecutada');}
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'tp-v2-visual-'));
const browser=spawn(chrome,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--no-default-browser-check','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let ws;
try{
 let dbg;
 for(let i=0;i<100;i++){
  if(browser.exitCode!=null)throw new Error('Chrome no inició');
  const file=path.join(profile,'DevToolsActivePort');
  if(fs.existsSync(file)){dbg=Number(fs.readFileSync(file,'utf8').split('\n')[0]);break;}
  await sleep(100);
 }
 assert.ok(dbg,'Chrome no habilitó DevTools');
 const targets=await(await fetch(`http://127.0.0.1:${dbg}/json`)).json();
 const target=targets.find(t=>t.type==='page');
 assert.ok(target?.webSocketDebuggerUrl,'No se pudo controlar Chrome');
 ws=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{
  ws.addEventListener('open',resolve,{once:true});
  ws.addEventListener('error',reject,{once:true});
 });
 let seq=0;
 const pending=new Map();
 ws.addEventListener('message',event=>{
  const msg=JSON.parse(event.data);
  if(msg.id&&pending.has(msg.id)){
   const {resolve,reject}=pending.get(msg.id);pending.delete(msg.id);
   msg.error?reject(new Error(JSON.stringify(msg.error))):resolve(msg.result);
  }
 });
 const cmd=(method,params={})=>new Promise((resolve,reject)=>{
  const id=++seq;pending.set(id,{resolve,reject});
  ws.send(JSON.stringify({id,method,params}));
 });
 await cmd('Page.enable');await cmd('Runtime.enable');await cmd('Network.enable');
 await cmd('Network.setBlockedURLs',{urls:['https://*']});
 const views=[{w:375,h:812},{w:768,h:1000},{w:1440,h:900}];
 const routes=[['/v2/','inicio'],['/v2/tramites/','catalogo'],['/v2/categorias/','categorias'],['/v2/tramites/antecedentes-penales/','solicitud'],['/v2/tramites/antecedentes-penales/pago/','pago'],['/v2/seguimiento/','seguimiento'],['/v2/contacto/','contacto'],['/v2/admin/','admin'],['/v2/tests/galeria-fotos-a.html','fotos-a'],['/v2/tests/galeria-fotos-b.html','fotos-b']];
 const issues=[];
 for(const view of views){
  await cmd('Emulation.setDeviceMetricsOverride',{width:view.w,height:view.h,deviceScaleFactor:1,mobile:false});
  for(const [route,slug] of routes){
   await cmd('Page.navigate',{url:`http://127.0.0.1:${port}${route}`});
   await sleep(400);
   const expression=`JSON.stringify({title:document.title,overflow:document.documentElement.scrollWidth-window.innerWidth,header:!!document.querySelector('header'),broken:[...document.images].filter(i=>i.src.includes('/v2/assets/')&&i.complete&&!i.naturalWidth).map(i=>i.src),links:[...document.querySelectorAll('header nav a')].map(a=>a.getAttribute('href'))})`;
   const state=JSON.parse((await cmd('Runtime.evaluate',{expression,returnByValue:true})).result.value);
   if(state.overflow>2)issues.push(`${slug} ${view.w}: ${state.overflow}px de desborde`);
   if(!state.header)issues.push(`${slug} ${view.w}: falta encabezado`);
   if(state.broken.length)issues.push(`${slug} ${view.w}: recursos rotos ${state.broken.join(',')}`);
   if(!state.links.includes('/v2/'))issues.push(`${slug} ${view.w}: no hay link de inicio`);
   const screenshot=await cmd('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
   fs.writeFileSync(path.join(out,`${slug}-${view.w}.png`),Buffer.from(screenshot.data,'base64'));
   console.log(`VISUAL ${slug} ancho=${view.w} desborde=${state.overflow} rotas=${state.broken.length}`);
  }
 }
 if(issues.length)throw new Error('CONTROL VISUAL INCOMPLETO: '+issues.join(' | '));
 console.log('PASS local browser: 8 tipos de pantallas, 3 tamaños; no demuestra staging/producción');
}finally{
 try{ws?.close();}catch{}
 browser.kill('SIGTERM');
 server.close();
 fs.rmSync(profile,{recursive:true,force:true,maxRetries:5});
}