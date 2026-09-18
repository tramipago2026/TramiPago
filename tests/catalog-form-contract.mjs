// Contratos estáticos: no abre páginas, no crea solicitudes, no envía datos ni realiza pagos.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=name=>readFileSync(new URL(`../${name}`,import.meta.url),'utf8');
const win={addEventListener(){},setTimeout(){},scrollTo(){}};
const doc={getElementById(){return null;},createElement(){return {};},head:{appendChild(){}},addEventListener(){},querySelectorAll(){return [];}};
const ctx={window:win,document:doc,location:{hash:'#/'},setTimeout(){}};
for(const filename of ['services.js','arca-family.js','extra-families.js']){
  runInNewContext(read(filename),ctx,{filename,timeout:3000});
}
const services=win.TRAMI_SERVICES||[];
const families=win.TRAMI_FAMILIES||[];
const directs=win.TRAMI_DIRECTS||[];
const unique=(items,label)=>{
  const seen=new Set();
  for(const item of items){assert.ok(item,`${label}: identificador vacío`);assert.ok(!seen.has(item),`${label}: identificador duplicado ${item}`);seen.add(item);}
};
const fileExists=name=>name&&existsSync(new URL(`../${name}`,import.meta.url));
unique(services.map(s=>s.id),'Servicios');
unique(families.map(f=>f.id),'Familias');
assert.ok(services.length>=10&&families.length>=4,'Catálogo principal cargado');
const byId=new Map(services.map(s=>[s.id,s]));
for(const direct of directs){
  assert.ok(byId.has(direct.serviceId),`Tarjeta directa sin servicio: ${direct.serviceId}`);
  assert.ok(fileExists(direct.image),`Imagen directa inexistente: ${direct.image}`);
}
for(const family of families){
  assert.ok(fileExists(family.image),`Imagen de familia inexistente: ${family.id} -> ${family.image}`);
  assert.ok(family.serviceIds?.length,`Familia sin servicios: ${family.id}`);
  unique(family.serviceIds,`Servicios de familia ${family.id}`);
  for(const serviceId of family.serviceIds)assert.ok(byId.has(serviceId),`Tarjeta de ${family.id} sin formulario: ${serviceId}`);
}
const validTypes=new Set(['text','email','tel','date','month','textarea','file','checkbox','choice','select','number','url']);
let fieldsChecked=0, optionsChecked=0;
for(const service of services){
  assert.ok(service.name&&service.shortDescription,`Servicio incompleto: ${service.id}`);
  assert.ok(service.codePrefix,`Servicio sin prefijo: ${service.id}`);
  assert.ok(Array.isArray(service.fields)&&service.fields.length,`Servicio sin campos: ${service.id}`);
  unique(service.fields.map(f=>f.id),`Campos de ${service.id}`);
  for(const field of service.fields){
    fieldsChecked++;
    assert.ok(validTypes.has(field.type),`Tipo de campo desconocido ${service.id}/${field.id}: ${field.type}`);
    assert.ok(field.label,`Campo sin etiqueta: ${service.id}/${field.id}`);
    if(['select','choice'].includes(field.type)){
      assert.ok(field.options?.length,`Opciones vacías: ${service.id}/${field.id}`);
      unique(field.options.map(o=>o.value),`Opciones ${service.id}/${field.id}`);
      for(const option of field.options){assert.ok(option.label,`Opción sin etiqueta: ${service.id}/${field.id}`);optionsChecked++;}
    }
  }
  if(service.active&&!service.intakeOnly){
    assert.ok(service.priceOptions?.length,`Servicio pagado sin opciones: ${service.id}`);
    unique(service.priceOptions.map(o=>o.value),`Precios de ${service.id}`);
    for(const option of service.priceOptions){
      assert.ok(Number.isFinite(Number(option.amount))&&Number(option.amount)>=0,`Importe inválido: ${service.id}/${option.value}`);
      assert.ok(option.duration,`Plazo ausente: ${service.id}/${option.value}`);
    }
    if(service.priceOptions.length>1)assert.ok(service.fields.some(f=>f.id===service.priceField),`Selección de precio sin campo: ${service.id}`);
  }
}
console.log(`PASS: ${directs.length} tarjetas directas, ${families.length} familias, ${services.length} formularios configurados, ${fieldsChecked} campos y ${optionsChecked} opciones; destinos e imágenes locales consistentes.`);
console.log('LÍMITE: validación estática de configuración; no prueba enlaces externos, envío a Supabase ni simetría visual.');