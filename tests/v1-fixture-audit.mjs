// Agente de auditoría reproducible OFFLINE: NUNCA escribe en Supabase ni envía pagos o mensajes.
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,statSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {createHash} from 'node:crypto';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const read=name=>readFileSync(join(root,name),'utf8');
const ctx={window:{addEventListener(){},setTimeout(){},scrollTo(){}},document:{getElementById(){return null;},createElement(){return {};},head:{appendChild(){}},addEventListener(){},querySelectorAll(){return [];}},location:{hash:'#/'},setTimeout(){}};
for(const name of ['services.js','arca-family.js','extra-families.js'])runInNewContext(read(name),ctx,{filename:name,timeout:3000});
const services=ctx.window.TRAMI_SERVICES||[],families=ctx.window.TRAMI_FAMILIES||[],directs=ctx.window.TRAMI_DIRECTS||[];
const ids=new Set(),cases=[],warnings=[];
function fake(field,serviceId){
  const id=field.id.toLowerCase();
  if(field.type==='checkbox')return true;
  if(field.type==='file')return {name:'DOCUMENTO_FICTICIO_SIN_VALIDEZ.pdf',type:'application/pdf',size:256,fixtureOnly:true};
  if(field.type==='email'||id.includes('email')||id.includes('correo'))return 'pruebas+'+serviceId+'@example.invalid';
  if(field.type==='tel'||id.includes('whatsapp')||id.includes('telefono'))return '1100000000';
  if(field.type==='date')return '1999-02-03';
  if(field.type==='month')return '2026-09';
  if(field.type==='number')return '123';
  if(field.type==='url')return 'https://example.invalid/prueba';
  if(['select','choice'].includes(field.type))return field.options?.[0]?.value;
  if(id.includes('cuil')||id.includes('cuit'))return '20-00000000-0';
  if(id==='dni'||id.includes('documentnumber'))return '00000000';
  if(id.includes('patent')||id.includes('dominio'))return 'AA000AA';
  if(id.includes('country')||id.includes('pais'))return 'País ficticio';
  if(id.includes('notes')||field.type==='textarea')return 'SOLICITUD FICTICIA; NO PRESENTAR ANTE NINGÚN ORGANISMO.';
  return 'DATO FICTICIO '+field.id;
}
function scenario(service,changes,label){
  const answers=Object.fromEntries(service.fields.map(f=>[f.id,fake(f,service.id)]));
  Object.assign(answers,changes);
  for(const f of service.fields){
    const val=answers[f.id];
    if(f.required)assert.ok(val!==undefined&&val!==null&&val!==false&&String(val).trim()!=='',service.id+'/'+label+': campo obligatorio '+f.id);
    if(val===null||val===undefined)continue; // Alternativa legítima: archivo/número opcional vacío.
    if(['select','choice'].includes(f.type))assert.ok(f.options.some(o=>o.value===val),service.id+'/'+label+': opción '+f.id);
    if(f.type==='email')assert.match(val,/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    if(f.type==='date')assert.match(val,/^\d{4}-\d{2}-\d{2}$/);
    if(f.type==='file')assert.ok(val.fixtureOnly,'Prohibido usar documento real en '+service.id+'/'+label);
  }
  if(service.rules?.anyOf)assert.ok(service.rules.anyOf.some(id=>Boolean(answers[id])),service.id+'/'+label+': alternativa obligatoria');
  if(service.rules?.oneOfGroups)assert.ok(service.rules.oneOfGroups.some(group=>group.every(id=>Boolean(answers[id]))),service.id+'/'+label+': grupo alternativo');
  if(!service.intakeOnly){
    assert.ok(service.priceOptions?.length,service.id+': sin modalidad comercial');
    const selected=service.priceOptions.find(p=>p.value===(answers[service.priceField]||service.priceOptions[0].value));
    assert.ok(selected&&Number.isFinite(Number(selected.amount)),service.id+'/'+label+': modalidad no válida');
  }
  cases.push(service.id+'/'+label);
}
for(const service of services){
  assert.ok(service.id&&!ids.has(service.id),'Servicio duplicado '+service.id);ids.add(service.id);
  assert.ok(service.name&&Array.isArray(service.fields)&&service.fields.length,'Ficha inexistente '+service.id);
  scenario(service,{},'base');
  for(const f of service.fields)if(['select','choice'].includes(f.type))for(const opt of f.options||[])scenario(service,{[f.id]:opt.value},f.id+'='+opt.value);
  for(const choice of service.rules?.anyOf||[]){
    const disabled=Object.fromEntries(service.rules.anyOf.map(id=>[id,null]));
    scenario(service,{...disabled,[choice]:fake(service.fields.find(f=>f.id===choice),service.id)},'alternativa='+choice);
  }
  for(let i=0;i<(service.rules?.oneOfGroups||[]).length;i++){
    const groups=service.rules.oneOfGroups;
    const off=Object.fromEntries(groups.flat().map(id=>[id,null]));
    const on=Object.fromEntries(groups[i].map(id=>[id,fake(service.fields.find(f=>f.id===id),service.id)]));
    scenario(service,{...off,...on},'grupo='+i);
  }
  if(!service.intakeOnly)for(const p of service.priceOptions||[])scenario(service,{[service.priceField]:p.value},'precio='+p.value);
}
for(const family of families)for(const id of family.serviceIds)assert.ok(ids.has(id),'Familia sin formulario '+family.id+'/'+id);
for(const item of directs)assert.ok(ids.has(item.serviceId),'Tarjeta sin formulario '+item.serviceId);
const extra=read('extra-families.js'),app=read('app.js'),index=read('index.html');
if(/<h3>Costo oficial<\/h3>|<span>Costo oficial<\/span>/.test(app))warnings.push('app.js genera la fila Costo oficial en la ficha (contradice directiva).');
if(/Arancel oficial TAD de apostilla: \$|arancel oficial general es \$/.test(extra))warnings.push('extra-families.js anuncia valores de tasas estatales en Apostillado/Legalizaciones.');
const legal=families.find(f=>f.id==='legalizaciones-apostillas'),partidas=families.find(f=>f.id==='partidas-pba');
if(legal&&partidas&&legal.image===partidas.image)warnings.push('Diseño: Apostillas/Legalizaciones reutiliza foto de Partidas.');
assert.match(index,/\.home-catalog \.home-tile[^\n]*154px/,'Falta tamaño maestro 154px');
assert.match(index,/\.catalog-card-title/,'Falta tipografía compartida');
const sourceFiles=readdirSync(root).filter(name=>/\.(html|js|css)$/.test(name));
const publicCode=sourceFiles.map(read).join('\n');
const assetDir=join(root,'assets');
const assetFiles=readdirSync(assetDir).filter(name=>statSync(join(assetDir,name)).isFile());
const candidates=assetFiles.filter(name=>!publicCode.includes('assets/'+name));
const hashes=new Map();
for(const name of assetFiles){const sha=createHash('sha256').update(readFileSync(join(assetDir,name))).digest('hex');hashes.set(sha,[...(hashes.get(sha)||[]),name]);}
const duplicates=[...hashes.values()].filter(group=>group.length>1);
console.log('INVENTARIO: '+services.length+' servicios ('+services.filter(s=>s.active).length+' activos; '+services.filter(s=>s.intakeOnly).length+' consultas de derivación), '+families.length+' familias, '+directs.length+' tarjetas directas.');
for(const s of services)console.log('SERVICIO | '+s.id+' | '+s.name+' | '+(s.active?'ACTIVO':'INACTIVO')+' | '+(s.intakeOnly?'CONSULTA':'PAGO')+' | opciones '+s.fields.filter(f=>['select','choice'].includes(f.type)).reduce((n,f)=>n+(f.options||[]).length,0));
console.log('ESCENARIOS FICTICIOS DE ESQUEMA APROBADOS: '+cases.length+'. NO se crearon solicitudes, comprobantes ni pagos reales.');
console.log('ASSETS: '+assetFiles.length+' ficheros; candidatos sin referencia literal: '+candidates.length+'; duplicados binarios: '+duplicates.length+' grupos.');
for(const f of candidates)console.log('NO BORRAR SIN REVISAR: '+f);
for(const group of duplicates)console.log('CONTENIDO IDÉNTICO: '+group.join(' = '));
for(const finding of warnings)console.log('HALLAZGO: '+finding);
console.log('LÍMITE: prueba del catálogo, campos y alternativas EN MEMORIA. No verifica navegador, Supabase, pago, notificación ni comparación visual.');
