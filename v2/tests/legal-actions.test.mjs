import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { fileURLToPath } from "node:url";

const script = readFileSync(new URL("../assets/legal-actions-v2.js", import.meta.url), "utf8");
for (const id of ["withdrawal-form", "cancel-form"]) {
  const events = {};
  const linkEvents = {};
  let valid = true;
  const navigations = [];
  const values = { nombre: "Cliente Sintético", dni: "00000000", servicio: "Gestión sintética",
    email: "ejemplo@example.invalid", codigo: "TEST-123", comentario: "Sin datos reales" };
  const link = { href: "mailto:tramipago@gmail.com", addEventListener(type, fn) { linkEvents[type] = fn; } };
  const form = {
    id,
    reportValidity() { return valid; },
    querySelector(query) { assert.match(query, /mailto/); return link; },
    addEventListener(type, fn) { events[type] = fn; }
  };
  runInNewContext(script, {
    document: { getElementById(key) { return key === id ? form : null; } },
    FormData: class { get(key) { return values[key] ?? null; } },
    window: { location: { assign(url) { navigations.push(url); } } },
    encodeURIComponent
  });
  assert.equal(typeof events.submit, "function");
  assert.equal(typeof linkEvents.click, "function");
  let prevented = false;
  events.submit({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(navigations.length, 1);
  const wa = new URL(navigations[0]);
  assert.equal(wa.host, "wa.me");
  assert.match(wa.searchParams.get("text"), /Gestión sintética/);
  linkEvents.click({ preventDefault() { throw Error("Valid link unexpectedly blocked"); } });
  const email = new URL(link.href);
  assert.equal(email.protocol, "mailto:");
  assert.match(email.searchParams.get("body"), /Gestión sintética/);
  assert.match(email.searchParams.get("body"), /TEST-123/);
  assert.match(email.searchParams.get("subject"), id === "withdrawal-form" ? /ARREPENTIMIENTO/ : /BAJA/);
  valid = false;
  linkEvents.click({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  events.submit({ preventDefault() {} });
  assert.equal(navigations.length, 1, "Invalid form must not open WhatsApp");
}
console.log("PASS legal handoff: WhatsApp and email with data; invalid forms do not submit");