// Auditoría determinista y SIN RED: no escribe en Supabase, no envía mensajes, no simula una acreditación real.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { createHash } from 'node:crypto';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const read = name => readFileSync(join(root, name), 'utf8');
const ctx = { window: { addEventListener(){}, setTimeout(){}, scrollTo(){} }, document: { getElementById(){return null;}, createElement(){return {};}, head:{appendChild(){}}, addEventListener(){}, querySelectorAll(){return [];} }, location: { hash:'#/' }, setTimeout(){} };
for (const name of ['services.js','arca-family.js','extra-families.js']) runInNewContext(read(name), ctx, { filename:name, timeout:3000 });
const services=ctx.window.TRAMI_SERVICES||[];
const families=ctx.window.TRAMI_FAMILIES||[];
const directs=ctx.window.TRAMI_DIRECTS||[];
const ids=new Set();
const cases=[];
const warnings=[];
function fake(field, serviceId) {
  const id=String(field.id||'').toLowerCase();
  if(field.type==='checkbox')return true;
  if(field.type==='file')return {name:'DOCUMENTO_FICTICIO_SIN_VALIDEZ.pdf',type:'application/pdf',size:256,fixtureOnly:true};
  if(field.type==='email'||id.includes('email')||id.includes('correo'))return 'pruebas+'+serviceId+'@example.invalid';
  if(field.type==='tel'||id.includes('whatsapp')||id.includes('telefono'))return '1100000000';
  if(field.type==='date')return '1999-02-03';
  if(field.type==='month')return '2026-09';
  if(field.type==='number')return '123';
  if(field.type==='url')return 'https://example.invalid/prueba';
  if(field.type==='select'||field.type==='choice')return field.options?.[0]?.value;
  if(id.includes('cuil')||id.includes('cuit'))return '20-00000000-0'; // Solo formato, NO identidad válida.
  if(id==='dni'||id.includes('documentnumber'))return '00000000';
  if(id.includes('patent')||id.includes('dominio'))return 'AA000AA';
  if(id.includes('country')||id.includes('pais'))return 'País ficticio';
  if(id.includes('notes')||field.type==='textarea')return 'SOLICITUD FICTICIA PARA PRUEBA. No presentar a ningún organismo.';
  if(id.includes('authorization'))return true;
  return 'DATO FICTICIO '+field.id;
}
function scenario(service, changes, label) {
  const answers=Object.fromEntries(service.fields.map(f=>[f.id,fake(f,service.id)]));
  Object.assign(answers,changes);
  const required=service.fields.filter(f=>f.required);
  for(const field of required)assert.ok(answers[field.id]!==undefined&&answers[field.id]!==null&&answers[field.id]!==false&&String(answers[field.id]).trim()!=='',service.id+'/'+label+': falta '+field.id);
  for(const field of service.fields) {
    const value=answers[field.id];
    if(['select','choice'].includes(field.type))assert.ok(field.options.some(o=>o.value===value),service.id+'/'+label+': opción inválida '+field.id);
    if(field.type==='email')assert.match(value,/^[^\s@]+@[^\s@]+\.[^\s@]+$/,service.id+'/'+label+': correo');
    if(field.type==='date')assert.match(value,/^\d{4}-\d{2}-\d{2}$/,service.id+'/'+label+': fecha');
    if(field.type==='file')assert.ok(value?.fixtureOnly,service.id+'/'+label+': archivo no sintético');
  }
  if(service.rules?.anyOf)assert.ok(service.rules.anyOf.some(id=>Boolean(answers[id])),service.id+'/'+label+': alternativa obligatoria');
  if(service.rules?.oneOfGroups)assert.ok(service.rules.oneOfGroups.some(group=>group.every(id=>Boolean(answers[id]))),service.id+'/'+label+': grupo alternativo');
  if(!service.intakeOnly){
    assert.ok(service.priceOptions?.length,service.id+': sin precio');
    const chosen=service.priceOptions.find(p=>p.value===(answers[service.priceField]||service.priceOptions[0].value));
    assert.ok(chosen&&Number.isFinite(Number(chosen.amount)),service.id+'/'+label+': opción comercial inválida');
  }
  cases.push({service:service.id,label});
}
for(const service of services){
  assert.ok(service.id&&!ids.has(service.id),'ID duplicado '+service.id);ids.add(service.id);
  assert.ok(service.name&&Array.isArray(service.fields)&&service.fields.length,'Servicio sin ficha '+service.id);
  scenario(service,{},'base');
  for(const field of service.fields){
    if(!['select','choice'].includes(field.type))continue;
    for(const opt of field.options||[])scenario(service,{[field.id]:opt.value},field.id+'='+opt.value);
  }
  for(const fieldId of service.rules?.anyOf||[]) {
    const alternatives=Object.fromEntries(service.rules.anyOf.map(id=>[id,null]));
    const field=service.fields.find(f=>f.id===fieldId);
    scenario(service,{...alternatives,[fieldId]:fake(field,service.id)},'alternativa='+fieldId);
  }
  for(let i=0;i<(service.rules?.oneOfGroups||[]).length;i++){
    const groups=service.rules.oneOfGroups;
    const off=Object.fromEntries(groups.flat().map(id=>[id,null]));
    const on=Object.fromEntries(groups[i].map(id=>[id,fake(service.fields.find(f=>f.id===id),service.id)]));
    scenario(service,{...off,...on},'grupo='+i);
  }
  if(!service.intakeOnly)for(const option of service.priceOptions||[])scenario(service,{[service.priceField]:option.value},'precio='+option.value);
}
for(const family of families)for(const id of family.serviceIds)assert.ok(ids.has(id),'Familia huérfana '+family.id+'/'+id);
for(const item of directs)assert.ok(ids.has(item.serviceId),'Tarjeta huérfana '+item.serviceId);
const extra=read('extra-families.js');
const main=read('app.js');
if(/<h3>Costo oficial<\/h3>|<span>Costo oficial<\/span>/.test(main))warnings.push('app.js: la vista prepara una fila de COSTO OFICIAL (directiva comercial incumplida en código).');
if(/Arancel oficial TAD de apostilla: \$|arancel oficial general es \$/.test(extra))warnings.push('extra-families.js: Apostillado/Legalizaciones revelan importes oficiales en requisitos.');
const legal=families.find(f=>f.id==='legalizaciones-apostillas'),partidas=families.find(f=>f.id==='partidas-pba');
if(legal&&partidas&&legal.image===partidas.image)warnings.push('Diseño: Apostillas/Legalizaciones reutiliza exactamente la imagen de Partidas.');
const index=read('index.html');
assert.match(index,/\.home-catalog \.home-tile[^\n]*154px/,'No se encontró formato maestro de tarjetas');
assert.match(index,/\.catalog-card-title/,'Sin estilo compartido para títulos');
const sourceFiles=readdirSync(root).filter(name=>/\.(html|js|css)$/.test(name));
const combined=sourceFiles.map(read).join('\n');
const assetDir=join(root,'assets');
const assetFiles=readdirSync(assetDir).filter(name=>statSync(join(assetDir,name)).isFile());
const orphans=assetFiles.filter(name=>!combined.includes('assets/'+name));
const hashGroups=new Map();
for(const name of assetFiles){const digest=createHash('sha256').update(readFileSync(join(assetDir,name))).digest('hex');hashGroups.set(digest,[...(hashGroups.get(digest)||[]),name]);}
const dup=[...hashGroups.values()].filter(group=>group.length>1);
console.log('INVENTARIO: '+services.length+' servicios configurados ('+services.filter(s=>s.active).length+' activos, '+services.filter(s=>s.intakeOnly).length+' consultas sin pago), '+families.length+' familias y '+directs.length+' tarjetas directas.');
for(const s of services)console.log('SERVICIO | '+s.id+' | '+s.name+' | '+(s.active?'ACTIVO':'INACTIVO')+' | '+(s.intakeOnly?'CONSULTA':'PAGO')+' | variantes de selección: '+s.fields.filter(f=>['select','choice'].includes(f.type)).reduce((n,f)=>n+(f.options||[]).length,0));
console.log('ESCENARIOS FICTICIOS DE ESQUEMA: '+cases.length+' generados y validados; no se crearon solicitudes, comprobantes, cobros ni avisos reales.');
console.log('ASSETS: '+assetFiles.length+' archivos; no referenciados literalmente en código público: '+orphans.length+'; grupos de contenido idéntico: '+dup.length+'.');
for(const file of orphans)console.log('REVISAR ANTES DE BORRAR: '+file);
for(const group of dup)console.log('DUPLICADO BINARIO: '+group.join(' = '));
for(const item of warnings)console.log('HALLAZGO: '+item);
console.log('LÍMITE: validación estructural, de variantes y de referencias estáticas. NO equivale a interacción real con navegador, Supabase, WhatsApp, correo, pagos o comparación visual de imágenes.');
