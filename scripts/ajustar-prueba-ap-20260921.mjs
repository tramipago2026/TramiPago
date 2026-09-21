import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
const path='tests/v1-ap-recorrido-simulado.mjs';
const old=readFileSync(path,'utf8');
const before=`    await page.waitForSelector('#tracking-form');\n    await page.locator('[name="trackingPhoneLast4"]').fill(phoneLast4);\n    await page.locator('#tracking-form button[type="submit"]').click();`;
const after=`    await page.waitForSelector('#tracking-form');\n    // Al venir de «Ver estado» ya hay un resultado local: el CTA cambia a «Consultar otro código».\n    // Se usa el recorrido real del usuario para hacer una nueva consulta validada en el servidor.\n    if(await page.locator('[data-tracking-new-query]').count())await page.locator('[data-tracking-new-query]').click();\n    await page.locator('[name="trackingCode"]').fill(SERVER_CODE);\n    await page.locator('[name="trackingPhoneLast4"]').fill(phoneLast4);\n    await page.locator('#tracking-form button[type="submit"]').click();`;
assert.equal(old.split(before).length,2,'La prueba de un dispositivo fue alterada; no reemplazar a ciegas');
writeFileSync(path,old.replace(before,after));
console.log('PASS: prueba realista de botón Consultar otro código antes de validar estado; sin cambios de producción.');