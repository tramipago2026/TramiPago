import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const shell = readFileSync(new URL("../assets/shell-v2.js", import.meta.url), "utf8");
const admin = readFileSync(new URL("../assets/admin-v2.js", import.meta.url), "utf8");
const sequence = [];
let clickHandler;
const main = {
  id: "contenido",
  setAttribute(key, value) { this[key] = value; },
  focus() { sequence.push("focus"); },
  scrollIntoView() { sequence.push("scroll"); },
};
const skip = { addEventListener(type, handler) { if (type === "click") clickHandler = handler; } };
const header = { innerHTML: "" }, footer = { innerHTML: "" };
const location = { pathname: "/v2/", hash: "" };
const context = {
  document: {
    querySelector(selector) {
      return {
        "[data-v2-shared-header]": header,
        "[data-v2-shared-footer]": footer,
        main, ".skip-link": skip,
      }[selector] || null;
    },
    body: { classList: { contains(name) { return name === "home-opcion-c"; } } },
  },
  window: {},
  location,
  history: { pushState() { sequence.push("hash"); location.hash = "#contenido"; } },
};
runInNewContext(shell, context, { timeout: 3000 });
assert.equal(typeof clickHandler, "function");
let prevented = false;
clickHandler({ preventDefault() { prevented = true; } });
assert.equal(prevented, true);
assert.equal(main.tabindex, "-1");
assert.equal(location.hash, "#contenido");
assert.deepEqual(sequence, ["focus", "hash", "scroll"], "Keyboard skip must focus main before updating URL");

const match = admin.match(/function showLogin\(\)\{[^}]*\}/);
assert.ok(match, "Missing Admin login recovery");
const names = ["loginSection", "appSection", "logout", "loginForm", "totpForm", "enrollForm", "enrollSecret", "signupForm"];
const nodes = Object.fromEntries(names.map(name => [name, { hidden: name === "loginForm" }]));
const signupOpen = { parentElement: { hidden: true } };
runInNewContext(match[0] + ";showLogin();", { ...nodes, signupOpen }, { timeout: 3000 });
assert.equal(nodes.loginSection.hidden, false);
assert.equal(nodes.loginForm.hidden, false);
for (const name of names.filter(name => !["loginSection", "loginForm"].includes(name))) assert.equal(nodes[name].hidden, true, name);
assert.equal(signupOpen.parentElement.hidden, false);
assert.match(admin, /catch\(e\)\{if\(e\.status===401\|\|e\.status===403\)showLogin\(\)/, "Expired MFA must return to credential login");
console.log("V2 keyboard focus and expired MFA login recovery: OK");
