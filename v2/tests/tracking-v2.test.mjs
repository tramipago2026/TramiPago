import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const script = readFileSync(process.argv[2] || new URL("../assets/v2.js", import.meta.url), "utf8");
const shellVm = {window:{},document:{querySelector(){return null;}}};
runInNewContext(readFileSync(new URL("../assets/shell-v2.js",import.meta.url),"utf8"),shellVm);

class Element {
  constructor(tag = "div") { this.tag = tag; this.dataset = {}; this.children = []; this.attributes = {}; this.hidden = false; this.textContent = ""; this.events = {}; }
  append(...items) { for (const item of items) { item.parent = this; this.children.push(item); } }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this); }
  setAttribute(key, value) { this.attributes[key] = value; }
  addEventListener(type, fn) { this.events[type] = fn; }
  querySelectorAll(selector) {
    const keys = [...selector.matchAll(/\[data-([a-z0-9-]+)\]/g)].map(([, key]) => key.replace(/-([a-z])/g, (_, c) => c.toUpperCase()));
    return this.children.flatMap(child => [...(keys.some(key => key in child.dataset) ? [child] : []), ...child.querySelectorAll(selector)]);
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
}
const form = new Element("form"), output = new Element(), status = new Element("strong"), note = new Element(), missing = new Element(), button = new Element("button");
status.dataset.v2Status = ""; note.dataset.v2StatusNote = ""; missing.dataset.v2Missing = "";
output.append(status, note, missing);
const code = { value: "ANTPEN-SINTETICO" }, verification = { value: "0000000000" };
let valid = true, fetchCount = 0, schemaCount = 0, next, finishSchema, schemaStarted;
const labelsStarted = new Promise(resolve => { schemaStarted = resolve; });
form.reportValidity = () => valid;
form.querySelector = query => query.includes("submit") ? button : query.includes("trackingCode") ? code : null;
const nodes = new Map([["[data-v2-tracking-form]", form], ["[data-v2-tracking-result]", output], ["[data-v2-status]", status], ["[data-v2-status-note]", note], ["[data-v2-missing]", missing]]);
const active = { serviceId: "antecedentes-penales", requestId: "synthetic-only", trackingCode: code.value, capability: "synthetic-only" };
runInNewContext(script, {
  document: { querySelector: query => nodes.get(query) || null, createElement: tag => new Element(tag) },
  window: { addEventListener() {}, TramiPagoShell:shellVm.window.TramiPagoShell },
  location: { search: "", pathname: "/v2/seguimiento/" },
  sessionStorage: { getItem: () => JSON.stringify(active) },
  URLSearchParams, Response,
  FormData: class { get(key) { return key === "trackingCode" ? code.value : verification.value; } },
  fetch: async (url, options) => {
    if (url === "/v2/data/form-schema-v2.json") {
      schemaCount++;
      schemaStarted();
      return new Promise(resolve => { finishSchema = () => resolve(new Response(JSON.stringify({ services: { "antecedentes-penales": { fields: [{ id: "fullName", label: "Nombre y apellido" }] } } }))); });
    }
    assert.equal(url, "/v2/requests/lookup");
    assert.equal(options.method, "POST");
    assert.equal(JSON.parse(options.body).trackingCode, code.value);
    fetchCount++;
    return next();
  },
});
const submit = () => form.events.submit({ preventDefault() {} });
const reply = (body, status = 200) => new Response(JSON.stringify(body), { status });
next = () => reply({ status: "needs_info", missingFields: ["fullName"], canCorrect: true });
const withLabels = submit();
await labelsStarted;
assert.equal(output.dataset.kind, "info", "Do not mark a result ready before labels finish loading");
finishSchema();
await withLabels;
assert.equal(status.textContent, "Falta información");
assert.match(missing.textContent, /Nombre y apellido/);
assert.ok(!missing.textContent.includes("fullName"), "Do not expose schema field identifiers");
assert.equal(output.querySelectorAll("[data-v2-correction-form]").length, 1);

let release;
next = () => new Promise(resolve => { release = resolve; });
const waiting = submit();
assert.equal(button.disabled, true);
assert.equal(form.attributes["aria-busy"], "true");
assert.equal(status.textContent, "Consultando…");
assert.equal(output.querySelectorAll("[data-v2-correction-form]").length, 0, "Old correction actions must disappear during a new query");
release(reply({ error: "unavailable" }, 503));
await waiting;
assert.match(status.textContent, /No se pudo consultar/);
assert.equal(output.dataset.kind, "error");
assert.equal(button.disabled, false);
assert.equal(form.attributes["aria-busy"], "false");

next = () => reply({ status: "finalized", missingFields: [], results: [{ fileId: "synthetic-only", name: "Documento sintético.pdf" }], resultAccessToken: "synthetic-only" });
await submit();
assert.equal(output.querySelectorAll("[data-v2-result-downloads]").length, 1);
next = () => reply({ error: "not_found" }, 404);
await submit();
assert.match(status.textContent, /No encontramos/);
assert.equal(output.querySelectorAll("[data-v2-result-downloads]").length, 0, "Failed lookup must not expose a previous result");
next = () => reply({ error: "rate_limited" }, 429);
await submit();
assert.match(status.textContent, /Demasiados intentos/);
next = () => { throw new Error("network unavailable"); };
await submit();
assert.match(status.textContent, /No se pudo consultar/);
assert.equal(button.disabled, false, "Network failure must allow retry");
next = () => reply({ status: "needs_info", missingFields: ["fullName"], canCorrect: true });
await submit();
assert.equal(output.dataset.kind, "success");
assert.equal(schemaCount, 1, "Reuse labels rather than repeatedly loading schema");
valid = false;
const before = fetchCount;
await submit();
assert.equal(fetchCount, before, "Invalid input must not perform lookup");
console.log("PASS tracking: loading, human labels, stale actions removed, 404/429/network errors and successful retry");
