import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const backend=readFileSync("backend-sync.js","utf8");
const key=(backend.match(/PUBLISHABLE_KEY="([^"]+)"/)||[])[1];
assert.ok(key,"Publishable key no encontrada");

const base="https://injimzsxbnawnekybfpm.supabase.co/functions/v1/";
const common={"Origin":"https://tramipago.com.ar","apikey":key};
const json={...common,"Content-Type":"application/json"};
const whatsapp="1155559901";

const create=await fetch(base+"create-request",{
  method:"POST",
  headers:json,
  body:JSON.stringify({
    serviceId:"informe-vehicular",
    complete:true,
    clientName:"AUDITORIA E2E TRAMIPAGO 20261001",
    email:"audit-e2e@example.invalid",
    whatsapp,
    formData:{
      vehicleType:"car",
      patent:"AA123BB",
      serviceOption:"complete",
      authorization:true
    }
  }),
  signal:AbortSignal.timeout(20000)
});
const created=await create.json();
assert.equal(create.status,201,"create-request: "+create.status+" "+JSON.stringify(created));
assert.ok(created.code&&created.requestToken,"create-request no devolvió código/token");
assert.equal(Number(created.amount),15000,"precio E2E inesperado");

const track=await fetch(base+"track-request",{
  method:"POST",
  headers:json,
  body:JSON.stringify({code:created.code,last4:whatsapp.slice(-4)}),
  signal:AbortSignal.timeout(15000)
});
const tracked=await track.json();
assert.equal(track.status,200,"track-request: "+track.status+" "+JSON.stringify(tracked));
assert.equal(tracked.ok,true,"track-request no validó la solicitud");
assert.equal(tracked.code,created.code,"track-request devolvió otro código");
assert.equal(tracked.status,"awaiting_payment","estado inicial inesperado");

const png=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=","base64");
const form=new FormData();
form.set("code",created.code);
form.set("requestToken",created.requestToken);
form.set("receipt",new File([png],"comprobante-e2e.png",{type:"image/png"}));

const pay=await fetch(base+"confirm-payment",{
  method:"POST",
  headers:common,
  body:form,
  signal:AbortSignal.timeout(30000)
});
const paid=await pay.json();
assert.equal(pay.status,200,"confirm-payment: "+pay.status+" "+JSON.stringify(paid));
assert.equal(paid.ok,true,"confirm-payment no confirmó");
assert.equal(paid.status,"payment_review","estado post pago inesperado");
assert.equal(paid.notification?.email,true,"Resend no confirmó el envío del correo");

console.log("E2E_CODE="+created.code);
console.log("PASS LIVE_E2E: create-request -> track-request -> confirm-payment -> email sent");
