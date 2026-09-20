// Script de uso único en rama de auditoría. Fallar si cambió cualquier ancla.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';

function change(path,oldText,newText){
  const source=readFileSync(path,'utf8');
  assert.equal(source.split(oldText).length-1,1,`Ancla ausente o duplicada: ${path}`);
  writeFileSync(path,source.replace(oldText,newText),'utf8');
}

const bridge=readFileSync('backend-sync.js','utf8');
assert.equal(bridge.includes('async function notifyPayment('),false);
const anchor='  async function syncOne(request,tokenMap){';
const notifier=`  // Aviso independiente de la carga: un fallo del correo NO revierte el comprobante.
  // La función del servidor comprueba token, estado y existencia del archivo.
  async function notifyPayment(request,meta){
    if(request.status!=="payment_review"||!meta.paymentUploaded||meta.notificationSent)return;
    try{
      const {data,error}=await client.functions.invoke("notify-receipt",{
        body:{code:meta.code,requestToken:meta.raw}
      });
      if(error||!data?.ok||data.status!=="payment_review")throw new Error("notification_unavailable");
      meta.notificationSent=data.notification==="sent";
      request.notificationPending=!meta.notificationSent;
      if(meta.notificationSent)delete request.notificationError;
    }catch(_error){
      request.notificationPending=true;
      request.notificationError="Aviso administrativo aún no confirmado.";
    }
  }

`;
change('backend-sync.js',anchor,notifier+anchor);
change('backend-sync.js',
 '    if(request.status==="payment_review")await syncPayment(request,meta);',
 '    if(request.status==="payment_review"){await syncPayment(request,meta);await notifyPayment(request,meta);}');
change('index.html','backend-sync.js?v=20260918-sync-race1','backend-sync.js?v=20260920-notification-v1');
change('tests/live-site-smoke.mjs','backend-sync.js?v=20260918-sync-race1','backend-sync.js?v=20260920-notification-v1');
console.log('PASS: puente de aviso preparado, sin modificar publicación ni Supabase.');
