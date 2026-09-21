// Ejecución única SOLO en rama de auditoría. No toca Supabase ni producción.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,rmSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=path=>readFileSync(path,'utf8');
assert.equal(execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),'work/tramipago-v1-audit-20260920','No ejecutar fuera de rama aislada');
execFileSync('git',['fetch','--no-tags','--depth=1','origin','main'],{stdio:'inherit'});
const main=execFileSync('git',['show','origin/main:backend-sync.js'],{encoding:'utf8'});
let bridge=read('backend-sync.js');
const start=bridge.indexOf('  // Aviso independiente de la carga: un fallo del correo');
const end=bridge.indexOf('  async function syncOne(request,tokenMap){',start);
assert.ok(start>0&&end>start&&bridge.includes('client.functions.invoke("notify-receipt"'),'No se identifica el parche de email exacto');
bridge=bridge.slice(0,start)+bridge.slice(end);
const old='if(request.status==="payment_review"){await syncPayment(request,meta);await notifyPayment(request,meta);}';
assert.ok(bridge.includes(old),'La llamada al aviso cambió: detener sin modificar');
bridge=bridge.replace(old,'if(request.status==="payment_review")await syncPayment(request,meta);');
assert.equal(bridge,main,'Se detectan otros cambios en backend-sync.js: no restaurar a ciegas');
writeFileSync('backend-sync.js',bridge);
for(const path of ['index.html','tests/live-site-smoke.mjs']){
 const source=read(path),previous='backend-sync.js?v=20260920-notification-v1';
 assert.equal(source.split(previous).length,2,`Ancla ambigua de ${path}`);
 writeFileSync(path,source.replace(previous,'backend-sync.js?v=20260918-sync-race1'));
}
for(const path of ['supabase/functions/notify-receipt/index.ts','supabase/config.toml','tests/v1-notification-contract.mjs']){
 assert.ok(existsSync(path),`No se encuentra ${path}`);
 rmSync(path);
}
const doc='audits/tramipago-v1-notificaciones-20260920.md';
const oldDoc=read(doc);
const banner='> **DESCARTADO POR DIRECTIVA POSTERIOR DEL PROPIETARIO.** Este informe es histórico. El aviso por correo y su función Edge fueron retirados de la rama; nunca se desplegaron. Se conserva como evidencia de lo investigado, no como funcionalidad aprobada. La ayuda actual es WhatsApp con mensaje preparado que requiere que el cliente pulse Enviar. No hay automatización ni mensaje recibido confirmado.\n\n';
assert.ok(!oldDoc.startsWith('> **DESCARTADO'),'Informe ya actualizado');
writeFileSync(doc,banner+oldDoc);
console.log('PASS: prototipo EMAIL retirado de la rama; backend-sync.js idéntico al main; versión de script restaurada; no se escribió Supabase ni main.');
