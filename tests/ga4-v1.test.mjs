import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../analytics/ga4-v1.js', import.meta.url), 'utf8');
const values = new Map();
const events = {};
const scripts = [];
const window = {
  localStorage: {
    getItem(k) { return values.get(k) ?? null; },
    setItem(k, v) { values.set(k, v); },
    removeItem(k) { values.delete(k); },
  },
  location: { origin: 'https://tramipago.com.ar', pathname: '/index.html', search: '?codigo=SECRETO', hash: '#/seguimiento?wa=PERSONAL' },
  addEventListener(name, cb) { events[name] = cb; },
};
const document = { head: { appendChild(s) { scripts.push(s); } }, createElement(tag) { assert.equal(tag, 'script'); return {}; } };
runInNewContext(source, { window, document, Date });
const api = window.TramiPagoGA4;
assert.equal(typeof api.start, 'function');
assert.equal(scripts.length, 0, 'Nunca carga analítica automáticamente');
assert.equal(api.start('G-ABCD1234', { consentGranted: false }), false);
assert.equal(api.start('G-ABCD1234'), false);
assert.equal(api.start('CODIGO_INVENTADO', { consentGranted: true }), false);
assert.equal(scripts.length, 0, 'Sin consentimiento ni ID válido no hay cargas');
assert.equal(api.markTestBrowser(), true);
assert.equal(api.isTestBrowser(), true);
assert.equal(api.start('G-ABCD1234', { consentGranted: true }), true);
assert.equal(scripts.length, 1);
assert.match(scripts[0].src, /^https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-ABCD1234$/);
assert.equal(window.dataLayer[0][0], 'consent');
assert.equal(window.dataLayer[0][1], 'default');
assert.equal(window.dataLayer[0][2].analytics_storage, 'denied');
scripts[0].onload();
const config = window.dataLayer.find(x => x[0] === 'config');
assert.equal(config[2].debug_mode, true);
assert.equal(config[2].send_page_view, false);
const views = window.dataLayer.filter(x => x[0] === 'event' && x[1] === 'page_view');
assert.equal(views.length, 1);
assert.equal(views[0][2].page_location, 'https://tramipago.com.ar/index.html#/otra');
assert.ok(!JSON.stringify(window.dataLayer).includes('SECRETO'));
assert.ok(!JSON.stringify(window.dataLayer).includes('PERSONAL'));
window.location.hash = '#/tramite/antecedentes-penales';
events.hashchange();
assert.equal(window.dataLayer.filter(x => x[1] === 'page_view').length, 2);
assert.equal(api.unmarkTestBrowser(), true);
assert.equal(api.isTestBrowser(), false);
api.revokeConsent();
events.hashchange();
assert.equal(window.dataLayer.filter(x => x[1] === 'page_view').length, 2, 'Revocación detiene nuevos eventos');
assert.equal(window.dataLayer.at(-1)[1], 'update');
assert.equal(window.dataLayer.at(-1)[2].analytics_storage, 'denied');

// La revocación durante una carga asíncrona no permite envío posterior.
const pending = { ...window, dataLayer: undefined };
const more = [];
const ctx = {
  window: pending,
  document: { head: { appendChild(s) { more.push(s); } }, createElement() { return {}; } },
  Date,
};
runInNewContext(source, ctx);
assert.equal(pending.TramiPagoGA4.start('G-ZYXW1234', { consentGranted: true }), true);
pending.TramiPagoGA4.revokeConsent();
more[0].onload();
assert.equal(pending.dataLayer.filter(x => x[0] === 'event').length, 0);
console.log('PASS: sin red por defecto, consentimiento explícito, marcador por navegador, modo debug, URL sin PII, hash SPA, revocación y carrera de carga');
