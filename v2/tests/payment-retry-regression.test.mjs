import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const script=readFileSync(new URL("../assets/flow-v2.js",import.meta.url),"utf8");
const start='      const signature=[file.name,file.size,file.lastModified,file.type].join("|");';
const end='        location.href="/v2/tramites/"+serviceId+"/confirmacion/";';
const first=script.indexOf(start),last=script.indexOf(end,first);
assert.ok(first>=0&&last>first,"Payment retry logic missing");
const actual=script.slice(first,last+end.length);
const calls=[];
let failOnce=true, counter=0;
const api=async(path,options)=>{
  calls.push({path,key:options.headers["Idempotency-Key"]});
  if(path.endsWith("/files"))return {fileId:"synthetic-file-id"};
  if(failOnce){failOnce=false;throw new Error("synthetic timeout")}
  return {status:"payment_review"};
};
class FakeFormData{set(){}}
const location={href:""};
const send=new Function("api","FormData","active","randomKey","location","serviceId",
  'let receiptAttempt=null;return async function(file){'+actual+
  '\n}catch(e){return e.message;}return "ok"; }')(
  api,FakeFormData,{requestId:"synthetic",capability:"synthetic"},
  ()=>"test-key-"+(++counter),location,"antecedentes-penales"
);
const file={name:"receipt.pdf",size:64,lastModified:12345,type:"application/pdf"};
assert.equal(await send(file),"synthetic timeout");
assert.equal(await send(file),"ok");
assert.equal(calls.filter(x=>x.path.endsWith("/files")).length,1,
  "Retry must not upload a second private B2 object");
const proofs=calls.filter(x=>x.path.endsWith("/payment-proof"));
assert.equal(proofs.length,2);
assert.equal(proofs[0].key,proofs[1].key,"Retry must keep the same idempotency key");
assert.equal(location.href,"/v2/tramites/antecedentes-penales/confirmacion/");
console.log("V2 payment retry reuses private upload and idempotency: OK");
