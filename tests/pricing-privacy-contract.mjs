// Contrato reproducible sin crear pedidos, subir archivos ni realizar cobros.
import {readFileSync} from "node:fs";
import assert from "node:assert/strict";
const read=name=>readFileSync(name,"utf8");

const services=read("services.js");
for(const [id,amount] of [["apostilla-tad",20000],["legalizaciones",15000]]){
  assert.ok(services.includes(`id:"${id}"`)||services.includes(`id: "${id}"`),`${id}: debe existir en el catálogo consolidado`);
  assert.ok(services.includes(`amount:${amount}`)||services.includes(`amount: ${amount}`),`${id}: honorario esperado ausente`);
}
assert.match(services,/officialFeeExternal\s*:\s*true/,"las tasas oficiales externas deben quedar separadas");
assert.match(services,/arancel oficial[\s\S]{0,220}(aparte|se paga aparte)/i,"debe explicitarse que el arancel oficial se paga aparte");

const app=read("app.js");
assert.match(app,/!service\.officialFeeExternal\s*&&/,"los honorarios externos no desactivan el servicio");
assert.match(app,/const total = service\.officialFeeExternal/,"no sumar el VEP al pago de TramiPago");
assert.match(app,/Total TramiPago \(sin arancel oficial\)/,"separación visible en pantalla de pago");
assert.match(app,/No transfieras ese arancel a TramiPago/,"advertencia de pago");

const bridge=read("backend-sync.js");
assert.match(bridge,/sessionStorage\.setItem\(TOKENS_KEY/,"token temporal por pestaña");
assert.match(bridge,/TOKEN_DB_NAME/,"token recuperable desde almacenamiento privado del dispositivo");
assert.match(bridge,/complete:false/,"la ficha de servidor debe nacer como borrador antes de subir archivos");
assert.match(bridge,/request\.pricing\.total=Number\(data\.amount\)/,"el precio local debe reemplazarse por el valor del servidor");

const privacy=read("security-hardening.js");
assert.match(privacy,/sessionStorage\.getItem\(TOKENS_KEY/,"seguimiento usa token temporal");
const fixes=read("site-fixes.js");
assert.match(fixes,/privacyRedactedAt/,"las gestiones cerradas deben redactarse tras el período de retención");
assert.match(fixes,/verificationLast4/,"la limpieza debe conservar sólo el dato mínimo necesario para seguimiento");

console.log("PASS: precios externos separados, borrador previo, precio autoritativo y retención local reducida.");
