// Contrato estático: todos los servicios, rutas, archivos y accesos WhatsApp; sin conexiones externas.
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=path=>readFileSync(path,'utf8');
const win={addEventListener(){},setTimeout(){},scrollTo(){}};
const doc={getElementById(){return null;},createElement(){return {};},head:{appendChild(){}},addEventListener(){},querySelectorAll(){return [];}};
for(const file of ['services.js','arca-family.js','extra-families.js'])runInNewContext(read(file),{window:win,document:doc,location:{hash:'#/'},setTimeout(){}},{filename:file,timeout:3000});
const services=win.TRAMI_SERVICES||[],families=win.TRAMI_FAMILIES||[],directs=win.TRAMI_DIRECTS||[];
const byId=new Map(services.map(s=>[s.id,s]));
const famIds=new Set(families.map(f=>f.id));
const reachable=new Set([...directs.map(d=>d.serviceId),...families.flatMap(f=>f.serviceIds||[])]);
const issues=[],report=[];
if(services.length!==23)issues.push(`Inventario inesperado: ${services.length} servicios; se esperaban 23`);
for(const s of services){
  const link=`index.html#/tramite/${s.id}`;
  if(!s.active)issues.push(`Servicio no activo en catálogo: ${s.id}`);
  if(!reachable.has(s.id))issues.push(`Trámite sin entrada en tarjetas ni familias: ${s.id}`);
  if(!s.fields?.length)issues.push(`Trámite sin formulario: ${s.id}`);
  report.push({id:s.id,service:s.name,link,entry:directs.some(d=>d.serviceId===s.id)?'directa':families.filter(f=>f.serviceIds?.includes(s.id)).map(f=>f.id).join(',')||'SIN ENTRADA'});
}
const htmlFiles=readdirSync('.').filter(name=>name.endsWith('.html'));
let checked=0,whatsappPages=0;
for(const file of htmlFiles){
  const html=read(file);
  const includesOwnerWhatsApp=/https:\/\/(?:wa\.me|api\.whatsapp\.com)\//i.test(html)||file==='index.html';
  if(includesOwnerWhatsApp){
    whatsappPages++;
    if(!/src=["']whatsapp-context\.js(?:\?[^"']*)?["']/.test(html))issues.push(`${file}: falta ayuda contextual`);
  }
  for(const found of html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi)){
    const href=found[1].replace(/&amp;/g,'&');
    if(/^(?:mailto:|tel:|javascript:|data:)/i.test(href))continue;
    let url;try{url=new URL(href,`https://prueba.tramipago/${file}`);}catch(_){issues.push(`${file}: enlace inválido ${href}`);continue;}
    if(url.hostname!=='prueba.tramipago'){
      if(url.hostname==='wa.me'&&url.pathname!=='/5491167083232')issues.push(`${file}: WhatsApp apunta a un número diferente`);
      continue;
    }
    const destination=decodeURIComponent(url.pathname.slice(1))||file;
    if(!existsSync(destination))issues.push(`${file}: falta archivo destino ${destination}`);
    if(destination==='index.html'&&url.hash.startsWith('#/tramite/')){
      const id=decodeURIComponent(url.hash.slice('#/tramite/'.length));
      if(!byId.has(id))issues.push(`${file}: botón de trámite sin ficha: ${href}`);
    }
    if(destination==='index.html'&&url.hash.startsWith('#/familia/')){
      const id=decodeURIComponent(url.hash.slice('#/familia/'.length));
      if(!famIds.has(id))issues.push(`${file}: categoría inexistente: ${href}`);
    }
    checked++;
  }
}
if(win.TRAMI_CONFIG?.whatsappNumber!=='5491167083232')issues.push('El número central del sitio no coincide con el validado');
if(!read('whatsapp-context.js').includes('const NUMBER=\'5491167083232\''))issues.push('El módulo contextual no coincide con número aprobado');
mkdirSync('audit-artifacts',{recursive:true});
writeFileSync('audit-artifacts/enlaces-23-tramites.json',JSON.stringify({scope:'Rutas y enlaces estáticos. No prueba operaciones Supabase ni envío de WhatsApp.',services:report,htmlPages:htmlFiles.length,linksChecked:checked,whatsappPages,issues},null,2));
console.log(`INVENTARIO: ${services.length} servicios, ${htmlFiles.length} páginas HTML, ${checked} enlaces locales, ${whatsappPages} páginas con ayuda WhatsApp.`);
for(const item of report)console.log(`RUTA ${item.id} | ${item.link} | entrada ${item.entry}`);
for(const issue of issues)console.error('ERROR: '+issue);
assert.equal(issues.length,0,`${issues.length} enlace(s) o contrato(s) con problema`);
console.log('PASS: 23 servicios alcanzables desde el catálogo, rutas HTML sin destino faltante y número/contexto de WhatsApp centralizado. NO se enviaron mensajes.');
