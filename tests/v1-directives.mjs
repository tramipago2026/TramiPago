// Contratos de la V1 aprobados por Christian: NO usar precios del organismo en la interfaz.
// Test de código, no de navegación real ni de seguridad integral.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const app=read('app.js'),extra=read('extra-families.js'),services=read('services.js'),index=read('index.html'),admin=read('admin.js');
assert.doesNotMatch(app,/<h3>Costo oficial<\/h3>|<span>Costo oficial<\/span>/,'No publicar una fila con el arancel del organismo.');
assert.doesNotMatch(extra,/(?:arancel|tasa)\s+oficial[^"\n]{0,150}\$\s*[\d.,]+/i,'No publicar importes oficiales en requisitos.');
assert.match(services,/value: "one-hour", label: "1 hora", amount: 20000/,'Mantener honorario AP 1 h.');
assert.match(services,/value: "six-hours", label: "6 horas", amount: 15000/,'Mantener honorario AP 6 h.');
assert.match(extra,/id:"apostilla-tad"[\s\S]{0,500}amount:20000/,'Mantener honorario de apostillado.');
assert.match(extra,/id:"legalizaciones"[\s\S]{0,500}amount:15000/,'Mantener honorario de legalización.');
assert.match(admin,/MODO DESARROLLO\. MFA temporalmente desactivado/,'No reactivar unilateralmente doble verificación.');
assert.match(index,/app\.js\?v=20260920-hide-official-fee1/,'Invalidar caché de app.js en futura publicación.');
assert.match(index,/extra-families\.js\?v=20260920-hide-official-fee1/,'Invalidar caché de extra-families.js en futura publicación.');
assert.match(app,/status: "payment_review"/,'Comprobante cargado debe continuar en revisión.');
console.log('PASS: costos oficiales no expuestos en fichas revisadas; honorarios, flujo de revisión y acceso rápido preservados. No verifica navegador ni cobro.');
