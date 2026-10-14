import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
import {setImmediate} from "node:timers/promises";

class Element {
  constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.textContent="";this.events={};this.classList={add(){},remove(){},toggle(){}};}
  append(...nodes){this.children.push(...nodes);}
  replaceChildren(...nodes){this.children=nodes;}
  addEventListener(type,fn){this.events[type]=fn;}
  set innerHTML(value){this.children=[...value.matchAll(/<(button|input|code)\b/g)].map(([,tag])=>new Element(tag));}
  querySelector(selector){return this.children.find(n=>n.tag===selector.match(/^\w+/)?.[0])||null;}
}
const code=readFileSync(new URL("../assets/flow-v2.js",import.meta.url),"utf8");
const shared={window:{},document:{querySelector(){return null;}}};
runInNewContext(readFileSync(new URL("../assets/shell-v2.js",import.meta.url),"utf8"),shared);

const statuses=["draft","awaiting_payment","payment_review","payment_confirmed","in_progress","needs_info","finalized","cancelled"];
for(const stage of ["review","payment","confirmation"])for(const status of statuses){
  const main=new Element("main"),title=new Element("h1"),message=new Element("p");
  const data={status,requiresPayment:true,trackingCode:"ANTPEN-SINTETICO",serviceName:"Antecedentes Penales",payload:{},contact:{}};
  runInNewContext(code,{
    document:{body:{dataset:{v2Flow:stage}},querySelector(s){return s==="[data-flow-content]"?main:s==="[data-flow-title]"?title:message;},createElement(tag){return new Element(tag);}},
    location:{pathname:"/v2/tramites/antecedentes-penales/"+({review:"revisar",payment:"pago",confirmation:"confirmacion"})[stage]+"/"},
    sessionStorage:{getItem(){return JSON.stringify({serviceId:"antecedentes-penales",requestId:"synthetic-only",capability:"synthetic-only"});}},
    window:{TramiPagoProgress:{render(){},summary(){}},TramiPagoShell:shared.window.TramiPagoShell},
    FormData,
    fetch:async url=>({ok:true,json:async()=>({services:{"antecedentes-penales":{fields:[]}}}),text:async()=>JSON.stringify(url.includes("health")?{dependencies:{b2:"pending",payments:"pending"}}:data)}),
  });
  await setImmediate();
  assert.notEqual(message.dataset.kind,"error",stage+": "+status+" must render without a failure");
  const descendants=node=>[node,...node.children.flatMap(descendants)];
  const nodes=descendants(main),links=nodes.filter(n=>n.tag==="a"),forms=nodes.filter(n=>n.tag==="form");
  if(status==="cancelled"){
    assert.match(title.textContent,/cancelada/,stage);
    assert.equal(forms.length,0,"Cancelled request must not offer payment upload");
    assert.ok(!links.some(n=>n.href?.endsWith("/pago/")),"Cancelled request must not offer payment");
  }
  if(status==="needs_info"){
    assert.equal(forms.length,0,"Complete missing information before payment");
    assert.ok(links.some(n=>n.href?.startsWith("/v2/seguimiento/?codigo=")),"Missing information must route to corrections");
    assert.ok(!links.some(n=>n.href?.endsWith("/pago/")),"Do not route missing information to payment");
  }
  if(stage==="review"&&["payment_review","payment_confirmed","in_progress","finalized"].includes(status))assert.ok(links.some(n=>n.href?.endsWith("/confirmacion/")),"Already advanced request should go straight to its status");
  if(stage==="confirmation"&&status==="finalized")assert.match(title.textContent,/finalizada/);
}
console.log("PASS flow actions: all 8 statuses in review/payment/confirmation; cancelled and missing-info requests never offer payment");
