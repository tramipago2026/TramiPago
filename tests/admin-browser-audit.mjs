import { chromium } from "playwright";
import { spawn } from "node:child_process";

const server=spawn("python3",["-m","http.server","4174"],{stdio:"ignore"});
await new Promise(r=>setTimeout(r,1000));

const browser=await chromium.launch({
  headless:true,
  args:["--host-resolver-rules=MAP admin.tramipago.test 127.0.0.1"]
});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const failures=[];
const adminSource=await (await fetch("http://127.0.0.1:4174/admin/app.js")).text();
ok(adminSource.includes("@supabase/supabase-js@2.117.2"),"Admin no usa la versión lockless esperada de Supabase JS");
ok(!adminSource.includes("@supabase/supabase-js@2.105.0"),"Admin conserva Supabase JS 2.105.0 con riesgo de bloqueo de Auth");
const ok=(cond,msg)=>{if(!cond)failures.push(msg);};

const mockModule = `
let aal="aal1";
let mfaVerified=false;
const request={
  id:"req-audit-1",
  tracking_code:"IV-001281-D4993304",
  service_id:"informe-vehicular",
  status:"payment_review",
  client_name:"AUDITORIA ADMIN",
  email:"audit@example.invalid",
  whatsapp:"1167083232",
  quoted_amount:12345,
  status_note:null,
  estimated_completion_at:null,
  current_step:"payment",
  completion_percent:100,
  help_context:null,
  last_activity_at:new Date().toISOString(),
  created_at:new Date().toISOString(),
  updated_at:new Date().toISOString(),
  services:{name:"Informe Vehicular"},
  request_data:[{payload:{fullName:"AUDITORIA ADMIN",patent:"AA123BB"}}],
  request_files:[{id:"file-1",kind:"payment_receipt",original_name:"comprobante-prueba.jpg",storage_path:"req-audit-1/comprobante-prueba.jpg"}],
  request_events:[{id:1,event_type:"status_changed",status:"payment_review",note:"Prueba",created_at:new Date().toISOString()}]
};
const prices=[{service_id:"informe-vehicular",selector_field:"tipo",selector_value:"base",amount:15000,services:{name:"Informe Vehicular"}}];

function builder(table){
  const q={
    _patch:null,
    select(){return q;},
    order(){return q;},
    gte(){return q;},
    eq(field,value){
      if(q._patch && table==="requests" && field==="id" && value===request.id){
        Object.assign(request,q._patch,{updated_at:new Date().toISOString()});
        q._patch=null;
      }
      return q;
    },
    update(patch){q._patch=patch;return q;},
    maybeSingle(){
      if(table==="admin_users") return Promise.resolve({data:{user_id:"user-1"},error:null});
      return Promise.resolve({data:null,error:null});
    },
    single(){
      if(table==="requests") return Promise.resolve({data:structuredClone(request),error:null});
      return Promise.resolve({data:null,error:null});
    },
    then(resolve,reject){
      let result={data:[],error:null};
      if(table==="requests") result={data:[structuredClone(request)],error:null};
      else if(table==="client_error_logs") result={data:null,error:null,count:0};
      else if(table==="service_price_options") result={data:structuredClone(prices),error:null};
      return Promise.resolve(result).then(resolve,reject);
    }
  };
  return q;
}

export function createClient(){
  return {
    auth:{
      getSession:async()=>({data:{session:{user:{id:"user-1"}}}}),
      getUser:async()=>({data:{user:{id:"user-1",email:"tramipago@gmail.com"}}}),
      signOut:async()=>({error:null}),
      signInWithPassword:async()=>({error:null}),
      refreshSession:async()=>{
        globalThis.__mfaRefreshCalls=(globalThis.__mfaRefreshCalls||0)+1;
        return {data:{session:{user:{id:"user-1"}}},error:null};
      },
      mfa:{
        getAuthenticatorAssuranceLevel:async()=>({data:{currentLevel:aal},error:null}),
        listFactors:async()=>({data:{totp:[],phone:[]},error:null}),
        enroll:async()=>({data:{id:"factor-new",totp:{qr_code:"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3C/svg%3E",secret:"TESTSECRET123"}},error:null}),
        challenge:async()=>{
          globalThis.__mfaChallengeCalls=(globalThis.__mfaChallengeCalls||0)+1;
          return {data:{id:"challenge-"+globalThis.__mfaChallengeCalls},error:null};
        },
        verify:async()=>{
          mfaVerified=true;
          setTimeout(()=>{aal="aal2";},60);
          return {data:{},error:null};
        }
      }
    },
    from:builder,
    storage:{from:()=>({createSignedUrl:async()=>({data:{signedUrl:"https://example.invalid/comprobante-prueba.jpg"},error:null})})}
  };
}
`;

await page.route("https://esm.sh/**",route=>route.fulfill({status:200,contentType:"application/javascript",body:mockModule}));

await page.goto("http://admin.tramipago.test:4174/admin/",{waitUntil:"domcontentloaded"});
await page.waitForTimeout(300);

ok(await page.locator("#mfa-view").isVisible(),"MFA no se muestra para sesión AAL1");
ok(await page.locator("#mfa-new-factor").count()===0,"El login AAL1 permite asociar un autenticador alternativo antes de validar el MFA existente");
ok(await page.locator("#mfa-enroll").isVisible(),"No se muestra alta de autenticador nuevo");
ok((await page.locator("#mfa-secret").inputValue())==="TESTSECRET123","No se expone clave TOTP para asociar Google Authenticator");
await page.locator('#mfa-form input[name="code"]').fill("123456");
await page.locator('#mfa-form button[type="submit"]').click();

await page.waitForSelector("#dashboard-view:not([hidden])",{timeout:3000});
ok(await page.evaluate(()=>(globalThis.__mfaRefreshCalls||0)===0),"MFA ejecuta refreshSession manual después de verify");
ok(await page.evaluate(()=>globalThis.__mfaChallengeCalls===1),"MFA crea un segundo challenge después de verificar correctamente");
ok(await page.locator("#request-list .request-row").count()===1,"Admin no carga listado de solicitudes");

await page.locator("#request-list .request-row").click();
await page.waitForSelector('#request-detail h2',{timeout:2000});
ok((await page.locator("#request-detail h2").innerText()).includes("IV-001281-D4993304"),"Ficha no muestra código");
ok(!(await page.locator("#request-detail").innerText()).includes("Cargando ficha"),"Ficha queda trabada en Cargando ficha");
ok((await page.locator("#request-detail").innerText()).includes("AUDITORIA ADMIN"),"Ficha no muestra cliente");
ok((await page.locator("#admin-file-list").innerText()).includes("comprobante-prueba.jpg"),"Ficha no muestra comprobante");

await page.locator("#price-catalog-open").click();
await page.waitForTimeout(100);
const priceText=await page.locator("#price-catalog-body").innerText();
ok(!/permission denied/i.test(priceText),"Tarifario pierde sesión autenticada");
ok(/Informe Vehicular/i.test(priceText),"Tarifario no carga datos");

page.on("dialog",d=>d.accept());
for(const expected of ["payment_confirmed","in_progress","finalized"]){
  const button=page.locator('#status-form button[value="'+expected+'"]');
  await button.waitFor({state:"visible",timeout:2000});
  await button.click();
  await page.waitForTimeout(150);
  const badge=(await page.locator("#request-detail .badge").innerText()).toLowerCase();
  const expectedText=expected==="payment_confirmed"?"pago confirmado":expected==="in_progress"?"en proceso":"finalizado";
  ok(badge.includes(expectedText),"Cambio de estado no reflejado: "+expected);
}

const responsive=await Promise.race([
  page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>resolve(true)))),
  new Promise(resolve=>setTimeout(()=>resolve(false),1000))
]);
ok(responsive===true,"El panel bloquea el hilo principal");

await browser.close();
server.kill();

if(failures.length){
  console.error("ADMIN_BROWSER_AUDIT FAIL",failures.length);
  failures.forEach(f=>console.error("-",f));
  process.exit(1);
}
console.log("PASS ADMIN_BROWSER_CONTRACT_MOCK: MFA -> lista -> ficha -> archivo -> tarifario -> estados -> finalizado");
