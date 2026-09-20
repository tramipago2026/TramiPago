import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const bridge=readFileSync('backend-sync.js','utf8');
const edge=readFileSync('supabase/functions/notify-receipt/index.ts','utf8');
const config=readFileSync('supabase/config.toml','utf8');
const page=readFileSync('index.html','utf8');

assert.match(config,/\[functions\.notify-receipt\]\s*verify_jwt\s*=\s*false/);
assert.match(edge,/hashToken\(token\) !== item\.public_token_hash/);
assert.match(edge,/item\.status !== "payment_review"/);
assert.match(edge,/\.eq\("kind", "payment_receipt"\)/);
assert.match(edge,/status: "pending", attempts: 1/);
assert.match(edge,/claimError\.code !== "23505"/);
assert.match(edge,/await sendEmail\(code, service\)/);
assert.doesNotMatch(edge,/payment_confirmed|paid_at|started_at/);
assert.match(bridge,/await notifyPayment\(request,meta\)/);
assert.match(bridge,/client\.functions\.invoke\("notify-receipt"/);
assert.match(page,/backend-sync\.js\?v=20260920-notification-v1/);

const start=bridge.indexOf('  async function notifyPayment(request,meta){');
const end=bridge.indexOf('\n  async function syncOne(',start);
assert.ok(start>0&&end>start,'No se encontró la función de notificación aislada');
const fnSource=bridge.slice(start,end);

async function exercise(label,serverReply,{status='payment_review',uploaded=true,alreadySent=false}={}){
  let calls=0;
  const client={functions:{invoke:async (name,args)=>{
    calls++;
    assert.equal(name,'notify-receipt');
    assert.deepEqual(args.body,{code:'AP-000001-1234ABCD',requestToken:'abc'});
    if(serverReply instanceof Error)throw serverReply;
    return serverReply;
  }}};
  const fn=new Function('client',`${fnSource}\nreturn notifyPayment;`)(client);
  const meta={code:'AP-000001-1234ABCD',raw:'abc',paymentUploaded:uploaded,notificationSent:alreadySent};
  const request={status};
  await fn(request,meta);
  return {calls,meta,request,label};
}

let r=await exercise('envío correcto',{data:{ok:true,status:'payment_review',notification:'sent'},error:null});
assert.equal(r.calls,1);assert.equal(r.meta.notificationSent,true);assert.equal(r.request.notificationPending,false);assert.equal(r.request.status,'payment_review');
r=await exercise('correo fallido',{data:{ok:true,status:'payment_review',notification:'failed'},error:null});
assert.equal(r.calls,1);assert.equal(r.meta.notificationSent,false);assert.equal(r.request.notificationPending,true);assert.equal(r.request.status,'payment_review');
r=await exercise('problema de red',new Error('offline'));
assert.equal(r.calls,1);assert.equal(r.meta.notificationSent,false);assert.equal(r.request.notificationPending,true);assert.equal(r.request.status,'payment_review');
r=await exercise('evitar duplicado',{data:{ok:true,status:'payment_review',notification:'sent'},error:null},{alreadySent:true});
assert.equal(r.calls,0);
r=await exercise('no hay comprobante',{data:{ok:true,status:'payment_review',notification:'sent'},error:null},{uploaded:false});
assert.equal(r.calls,0);
r=await exercise('pago sin revisión',{data:{ok:true,status:'payment_review',notification:'sent'},error:null},{status:'payment_pending'});
assert.equal(r.calls,0);
console.log('PASS: 6 escenarios ficticios de notificación; no se acredita pago automáticamente ni se envían mensajes.');
