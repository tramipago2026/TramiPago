import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const client=readFileSync(new URL("../assets/admin-v2.js",import.meta.url),"utf8");
const match=client.match(/const allowedStatusChanges=Object\.freeze\((\{[\s\S]*?\})\);\s+function resetStatusChoices/);
const routine=client.match(/  function resetStatusChoices\(current\)\{[\s\S]*?\n  \}/)?.[0];
assert.ok(match&&routine,"Admin status chooser missing");
const allowed=runInNewContext("("+match[1]+")");
const expected={
  draft:["awaiting_payment","cancelled"],
  awaiting_payment:["payment_review","cancelled"],
  payment_review:["payment_confirmed","awaiting_payment","needs_info","cancelled"],
  payment_confirmed:["in_progress","needs_info","cancelled"],
  in_progress:["needs_info","finalized","cancelled"],
  needs_info:["payment_review","in_progress","cancelled"],
  finalized:[],cancelled:[],
};
for(const state of Object.keys(expected))
  assert.deepEqual([...allowed[state]].sort(),[...expected[state]].sort(),state+" rules");

const makeOption=()=>({value:"",textContent:"",disabled:false,selected:false});
const values=["awaiting_payment","payment_review","payment_confirmed","in_progress","needs_info","finalized","cancelled"];
const select={
  options:values.map(value=>({...makeOption(),value})),
  value:"awaiting_payment",
  querySelector(){return this.options.find(option=>option.value==="")||null},
  prepend(option){this.options.unshift(option)},
};
const note={value:"stale note"},missing={value:"stale fields"};
const form={dataset:{},elements:{namedItem(name){return {status:select,note,missingFields:missing}[name]}}};
const run=runInNewContext(routine+";resetStatusChoices",{statusForm:form,allowedStatusChanges:allowed,document:{createElement:makeOption}});
for(const state of Object.keys(expected)){
  note.value="old";missing.value="old";
  assert.equal(run(state),expected[state].length>0,state+" next-step existence");
  assert.deepEqual(select.options.filter(option=>option.value&&!option.disabled).map(option=>option.value).sort(),[...expected[state]].sort());
  assert.equal(select.value,"",state+" must require explicit choice");
  assert.equal(form.dataset.currentStatus,state);
  assert.equal(note.value,"");
  assert.equal(missing.value,"");
}
assert.match(client,/if\(!allowedStatusChanges\[statusForm\.dataset\.currentStatus\|\|""\]\?\.includes\(target\)\)/);
assert.match(client,/if\(target==="needs_info"&&!missing\.length\)/);
console.log("V2 Admin 8 status transitions, reset and validation: OK");
