import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const code = readFileSync(new URL("../assets/progress-v2.js", import.meta.url), "utf8");
class Element {
  constructor(tag) { this.tag=tag; this.children=[]; this.dataset={}; this.attributes={}; this.className=""; this.textContent=""; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children=children; }
  setAttribute(key, value) { this.attributes[key]=value; }
}
const statuses = {
  draft: ["current","pending","pending"],
  awaiting_payment: ["done","current","pending"],
  payment_review: ["done","current","pending"],
  payment_confirmed: ["done","done","done"],
  in_progress: ["done","done","done"],
  needs_info: ["current","pending","pending"],
  finalized: ["done","done","done"]
};
for (const [status, expected] of Object.entries(statuses)) {
  const host = new Element("nav");
  const sandbox={ document:{querySelector(){return host;},createElement(tag){return new Element(tag);}}, window:{} };
  runInNewContext(code,sandbox);
  sandbox.window.TramiPagoProgress.render({status,requiresPayment:true});
  const steps = host.children[0]?.children.map(child=>child.className.split(" ").at(-1));
  assert.deepEqual(steps,expected,"Wrong progress state: "+status);
}
const host = new Element("nav");
const sandbox={ document:{querySelector(){return host;},createElement(tag){return new Element(tag);}}, window:{} };
runInNewContext(code,sandbox);
sandbox.window.TramiPagoProgress.render({status:"cancelled",requiresPayment:true});
assert.equal(host.dataset.stage,"cancelled");
assert.match(host.children[0].textContent,/cancelada/);
assert.equal(host.children[0].tag,"p");
console.log("PASS request progress: 8 operational statuses including cancellation");
