import assert from "node:assert/strict";
import {resolve4,resolveCname,resolveNs} from "node:dns/promises";
import tls from "node:tls";
import {readFileSync} from "node:fs";

const domain="tramipago.com.ar";
const cnameFile=readFileSync("CNAME","utf8").trim();
assert.equal(cnameFile,domain,"CNAME del repositorio no coincide con el dominio productivo");

const a=await resolve4(domain);
assert.ok(a.length>0,"El dominio principal no tiene registros A");
let www=[];
try{www=await resolveCname("www."+domain);}catch{
  try{www=await resolve4("www."+domain);}catch{}
}
assert.ok(www.length>0,"www no resuelve por CNAME ni A");
const ns=await resolveNs(domain);
assert.ok(ns.length>0,"El dominio no expone nameservers");

const cert=await new Promise((resolve,reject)=>{
  const socket=tls.connect({host:domain,port:443,servername:domain,rejectUnauthorized:true},()=>{
    const peer=socket.getPeerCertificate();
    socket.end();
    resolve(peer);
  });
  socket.setTimeout(10000,()=>{socket.destroy(new Error("TLS timeout"));});
  socket.on("error",reject);
});
assert.ok(cert?.valid_to,"No se pudo leer el certificado TLS");
const validTo=Date.parse(cert.valid_to);
assert.ok(Number.isFinite(validTo)&&validTo>Date.now(),"Certificado TLS vencido o inválido");
const days=Math.floor((validTo-Date.now())/86400000);
assert.ok(days>=7,"Certificado TLS con menos de 7 días de vigencia");

const https=await fetch("https://"+domain+"/",{redirect:"manual",signal:AbortSignal.timeout(15000)});
assert.ok(https.status>=200&&https.status<400,"HTTPS productivo responde "+https.status);
const admin=await fetch("https://"+domain+"/admin/",{redirect:"manual",signal:AbortSignal.timeout(15000)});
assert.ok(admin.status>=200&&admin.status<400,"Admin productivo responde "+admin.status);

const http=await fetch("http://"+domain+"/",{redirect:"manual",signal:AbortSignal.timeout(15000)});
const location=http.headers.get("location")||"";
const redirectOk=[301,302,307,308].includes(http.status)&&location.startsWith("https://");

console.log(JSON.stringify({
  domain,
  cnameFile,
  a,
  www,
  ns,
  tls:{subject:cert.subject,issuer:cert.issuer,valid_from:cert.valid_from,valid_to:cert.valid_to,days_remaining:days},
  https_status:https.status,
  admin_status:admin.status,
  http_status:http.status,
  http_location:location,
  http_redirects_to_https:redirectOk
},null,2));
if(!redirectOk)console.warn("WARN: HTTP todavía no redirige obligatoriamente a HTTPS.");
else console.log("PASS INFRASTRUCTURE_AUDIT: DNS, TLS, dominio y Admin productivo válidos.");
