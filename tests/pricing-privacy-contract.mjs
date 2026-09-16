// Contrato reproducible sin crear pedidos, subir archivos ni realizar cobros.
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';
const read = name => readFileSync(name, 'utf8');
const context = { window: { TRAMI_SERVICES: [], TRAMI_FAMILIES: [] } };
runInNewContext(read('extra-families.js'), context, { filename: 'extra-families.js' });
for (const [id, amount] of [['apostilla-tad', 20000], ['legalizaciones', 15000]]) {
  const service = context.window.TRAMI_SERVICES.find(item => item.id === id);
  assert.ok(service?.active, `${id}: debe permanecer activo`);
  assert.equal(service.officialFee, null, `${id}: no simular tasa oficial gratuita`);
  assert.equal(service.officialFeeExternal, true, `${id}: tasa externa explícita`);
  assert.equal(service.priceOptions[0].amount, amount, `${id}: honorario del servicio intacto`);
  assert.ok(service.requirements.some(item => /arancel.*aparte|aparte.*arancel|paga aparte/i.test(item)), `${id}: información VEP`);
}
const app = read('app.js');
assert.match(app, /!service\.officialFeeExternal\s*&&/, 'los honorarios externos no desactivan el servicio');
assert.match(app, /const total = service\.officialFeeExternal/, 'no sumar el VEP al pago de TramiPago');
assert.match(app, /Total TramiPago \(sin arancel oficial\)/, 'separación visible en pantalla de pago');
assert.match(app, /No transfieras ese arancel a TramiPago/, 'advertencia de pago');
const bridge = read('backend-sync.js');
assert.match(bridge, /sessionStorage\.setItem\(TOKENS_KEY/, 'token temporal por pestaña');
assert.match(bridge, /if\(request\.serverId\)return false/, 'no duplicar al expirar token');
const privacy = read('security-hardening.js');
assert.match(privacy, /sessionStorage\.getItem\(TOKENS_KEY/, 'seguimiento usa token temporal');
console.log('PASS: dos servicios activos, honorarios separados del VEP, tokens por pestaña y prevención de duplicación de ficha ya sincronizada.');
