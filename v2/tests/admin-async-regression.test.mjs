import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source=readFileSync(new URL("../assets/admin-v2.js",import.meta.url),"utf8");
const full=source.match(/  async function loadList\(\)\{[\s\S]*?\n  \}\n  async function loadDetail\(id\)\{/);
assert.ok(full,"Cannot inspect Admin list loader");
const loader=full[0].replace(/\n  async function loadDetail\(id\)\{$/,"");
const pending=[];
const list={textContent:"",renderCount:0,replaceChildren(){this.renderCount++}};
const filter={value:"awaiting_payment"};
const request=()=>new Promise((resolve,reject)=>pending.push({resolve,reject}));
const loadList=runInNewContext("let listSequence=0;"+loader+";loadList",{
  list,filter,request,document:{},selectedId:null,esc:x=>x,statusLabel:x=>x,
});
const first=loadList();
filter.value="finalized";
const second=loadList();
pending[1].resolve({requests:[]});
await second;
assert.equal(list.textContent,"Sin solicitudes.");
pending[0].resolve({requests:[{id:"stale"}]});
await first;
assert.equal(list.textContent,"Sin solicitudes.","Outdated list request must not replace latest");
assert.equal(list.renderCount,1);

assert.match(source,/selectedId=id;statusForm\.hidden=true;rejectProof\.hidden=true;resultForm\.hidden=true/,
  "Hide forms until request detail is current");
assert.match(source,/const data=await request\("\/v2\/admin\/requests\/"\+encodeURIComponent\(id\)\);\s+if\(selectedId!==id\)return/,
  "Ignore stale Admin request responses");
assert.match(source,/const health=await request\("\/v2\/health\/dependencies"\);\s+if\(selectedId!==id\)return/,
  "Ignore stale B2 readiness when switching details");
console.log("V2 Admin asynchronous list and detail guards: OK");
