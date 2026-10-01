import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const source=readFileSync(new URL("../services.js",import.meta.url),"utf8");
const win={addEventListener(){},setTimeout(){},scrollTo(){}};
const doc={getElementById(){return null;},createElement(){return{};},head:{appendChild(){}},addEventListener(){},querySelectorAll(){return[];}};
runInNewContext(source,{window:win,document:doc,location:{hash:"#/"},setTimeout(){}},{filename:"services.js",timeout:3000});

const services=win.TRAMI_SERVICES||[];
const special=/\b(dni|cuil|cuit|patente|whatsapp|tel[eé]fono|correo|email|c[oó]digo postal|n[uú]mero de tr[aá]mite|nro\.? de tr[aá]mite|alias|cbu|monto|importe)\b/i;
const missing=[];
let checked=0;

for(const service of services.filter(s=>s.active)){
  for(const field of service.fields||[]){
    if(["select","choice","checkbox","file","date","month","textarea"].includes(field.type))continue;
    const descriptor=[field.id,field.label].filter(Boolean).join(" ");
    const needsHint=field.inputmode==="numeric" || ["tel","email","number","url"].includes(field.type) || special.test(descriptor);
    if(!needsHint)continue;
    checked++;
    const hint=String(field.placeholder||field.help||field.hint||field.description||"").trim();
    if(!hint)missing.push(service.id+"/"+field.id+" ("+field.label+")");
  }
}

assert.equal(missing.length,0,"Campos con formato especial sin ejemplo/ayuda: "+missing.join(" | "));
console.log("PASS FORMAT_HINTS: "+checked+" campos con formato especial tienen ejemplo o ayuda visible.");
