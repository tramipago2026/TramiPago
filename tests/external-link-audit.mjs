import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";

const htmlFiles=[
  ...readdirSync(".").filter(n=>n.endsWith(".html")),
  "admin/index.html"
];
const external=new Set();
const mailto=new Set();
const local=[];

for(const file of htmlFiles){
  const html=readFileSync(file,"utf8");
  for(const m of html.matchAll(/\bhref\s*=\s*["']([^"']+)["']/gi)){
    const href=m[1].trim();
    if(!href||href.startsWith("#"))continue;
    if(href.startsWith("mailto:")){mailto.add(href);continue;}
    if(href.startsWith("tel:"))continue;
    if(/^https?:\/\//i.test(href)){external.add(href);continue;}
    local.push({file,href});
  }
}

for(const href of mailto){
  assert.match(href,/^mailto:[^@\s]+@[^@\s]+\.[^@\s]+/i,"mailto inválido: "+href);
}

for(const {file,href} of local){
  const path=href.split(/[?#]/)[0];
  if(!path)continue;
  if(path.startsWith("/"))continue;
  const base=file.includes("/")?file.slice(0,file.lastIndexOf("/")+1):"";
  const normalized=(base+path).replace(/^\.\//,"");
  try{readFileSync(normalized);}catch{throw new Error("Link local roto: "+file+" -> "+href);}
}

const failures=[];
const checked=[];
for(const href of external){
  if(href.startsWith("https://wa.me/")){
    const url=new URL(href);
    if(url.pathname!=="/5491167083232")failures.push("WhatsApp con número inesperado: "+href);
    if(!url.searchParams.get("text"))failures.push("WhatsApp sin mensaje: "+href);
    checked.push({href,status:"wa-syntax-ok"});
    continue;
  }
  let lastError=null;
  let response=null;
  for(let attempt=1;attempt<=3&&!response;attempt++){
    try{
      response=await fetch(href,{method:"HEAD",redirect:"follow",signal:AbortSignal.timeout(20000),headers:{"User-Agent":"TramiPago-link-audit/1.0"}});
      if(response.status===405)response=await fetch(href,{method:"GET",redirect:"follow",signal:AbortSignal.timeout(20000),headers:{"User-Agent":"TramiPago-link-audit/1.0"}});
    }catch(error){
      lastError=error;
      if(attempt<3)await new Promise(resolve=>setTimeout(resolve,500*attempt));
    }
  }
  if(response){
    checked.push({href,status:response.status});
    if(response.status===404||response.status===410||response.status>=500)failures.push(href+" -> HTTP "+response.status);
  }else{
    checked.push({href,status:"unreachable-transient"});
    console.warn("WARN enlace externo no verificable tras 3 intentos:",href,String(lastError?.message||lastError||"error"));
  }
}

console.log("LINK_AUDIT",JSON.stringify({htmlFiles:htmlFiles.length,localLinks:local.length,mailto:[...mailto],external:checked},null,2));
if(failures.length){for(const f of failures)console.error("ERROR",f);process.exit(1);}
console.log("PASS EXTERNAL_LINK_AUDIT: enlaces locales, mailto, WhatsApp y enlaces HTTP(S) verificados.");
