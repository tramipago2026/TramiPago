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

// Approved Opción C uses display:contents on main on small screens:
// the landmark has no focusable box, so the actual focus target must be an h1 inside it.
const mobileSequence=[];
let mobileHandler;
const heading={
  setAttribute(key,value){this[key]=value},
  focus(){mobileSequence.push("focus-heading")},
  scrollIntoView(){mobileSequence.push("scroll-heading")},
};
const mobileMain={
  id:"contenido",setAttribute(key,value){this[key]=value},
  querySelector(name){return name==="h1"?heading:null},
  focus(){mobileSequence.push("focus-main")},
  scrollIntoView(){mobileSequence.push("scroll-main")},
};
const mobileLocation={pathname:"/v2/",hash:""};
const mobileContext={
  document:{
    querySelector(selector){
      return {
        "[data-v2-shared-header]":{innerHTML:""},
        "[data-v2-shared-footer]":{innerHTML:""},
        main:mobileMain,
        ".skip-link":{addEventListener(type,handler){if(type==="click")mobileHandler=handler}},
      }[selector]||null;
    },
    body:{classList:{contains(){return true}}},
  },
  getComputedStyle(node){return {display:node===mobileMain?"contents":"block"}},
  history:{pushState(){mobileSequence.push("hash");mobileLocation.hash="#contenido"}},
  location:mobileLocation,window:{},
};
runInNewContext(shell,mobileContext,{timeout:3000});
assert.equal(typeof mobileHandler,"function");
mobileHandler({preventDefault(){}});
assert.equal(mobileMain.tabindex,"-1");
assert.equal(heading.tabindex,"-1");
assert.equal(mobileLocation.hash,"#contenido");
assert.deepEqual(mobileSequence,["focus-heading","hash","scroll-heading"],
  "The display:contents main must delegate focus to a descendant heading");

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

// Unlike public pages, Admin has no shared shell: verify its own skip-link.
const start = '  const skipLink=q(".skip-link"), main=q("main");';
const end = '  const loginSection=q("[data-admin-login]")';
assert.ok(admin.includes(start) && admin.includes(end));
const wiring = start + admin.split(start)[1].split(end)[0];
let adminSkip;
const adminSequence = [];
const adminMain = {
  setAttribute(key, value) { this[key] = value; },
  focus() { adminSequence.push("focus"); },
  scrollIntoView() { adminSequence.push("scroll"); },
};
const adminLocation = {hash: ""};
runInNewContext(wiring, {
  q(selector) {
    return selector === ".skip-link"
      ? { addEventListener(type, handler) { if(type === "click") adminSkip = handler; } }
      : selector === "main" ? adminMain : null;
  },
  history: { pushState() { adminSequence.push("hash"); adminLocation.hash = "#contenido"; } },
  location: adminLocation,
}, {timeout:3000});
assert.equal(typeof adminSkip, "function");
adminSkip({ preventDefault() {} });
assert.equal(adminMain.tabindex, "-1");
assert.deepEqual(adminSequence, ["focus","hash","scroll"], "Admin skip must focus before fragment navigation");
assert.match(admin, /catch\(e\)\{if\(e\.status===401\|\|e\.status===403\)showLogin\(\)/, "Expired MFA must return to credential login");
// Backup mensual: el enlace manual debe existir, pero solo el rol Owner lo ve
// luego de pasar la sesión Admin con MFA. Nunca se ejecuta desde el navegador.
const adminHtml=readFileSync(new URL("../admin/index.html",import.meta.url),"utf8");
assert.match(adminHtml,/data-admin-monthly-backup hidden/);
assert.match(adminHtml,/\/edit\/v2-mysql-chat12-integration\/backend-v2\/backup\/MANUAL-TRIGGER\.md/);
const showAppRoutine=admin.match(/function showApp\(session\)\{[^}]*\}/)?.[0];
assert.ok(showAppRoutine,"Admin login must gate monthly backup");
const monthlyBackup={hidden:true};
const loginSection={hidden:false},appSection={hidden:true},logout={hidden:true};
const roleNode={textContent:""},statusForm={hidden:false},rejectProof={hidden:false},resultForm={hidden:false};
for(const testRole of ["viewer","operator","admin","owner"]){
  const harness=runInNewContext("let role=null;"+showAppRoutine+";showApp",{
    loginSection,appSection,logout,roleNode,statusForm,rejectProof,resultForm,monthlyBackup
  });
  harness({admin:{role:testRole}});
  assert.equal(monthlyBackup.hidden,testRole!=="owner","Manual backup visible only to Owner");
}
assert.match(admin,/monthlyBackup\.hidden=role!=="owner"/);
console.log("V2 keyboard focus and expired MFA login recovery: OK");
