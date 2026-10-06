import assert from "node:assert/strict";
import {readdirSync,readFileSync} from "node:fs";
import {join,resolve,extname,relative} from "node:path";
import {fileURLToPath} from "node:url";

const root=resolve(fileURLToPath(new URL("..",import.meta.url)));
const skip=new Set([".git","node_modules"]);
function walk(dir){
  return readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    if(skip.has(entry.name))return [];
    const full=join(dir,entry.name);
    return entry.isDirectory()?walk(full):[full];
  });
}

const files=walk(root);
const htmls=files.filter(p=>extname(p)===".html");
assert.ok(htmls.length>0,"No se encontraron páginas HTML");

for(const path of htmls){
  const text=readFileSync(path,"utf8");
  const name=relative(root,path);
  assert.match(text,/http-equiv=["']Content-Security-Policy["']/i,name+": falta CSP");
  assert.match(text,/script-src 'self' https:\/\/esm\.sh/i,name+": script-src no es restrictivo");
  assert.match(text,/script-src-attr 'none'/i,name+": no bloquea handlers inline");
  assert.match(text,/object-src 'none'/i,name+": object-src no está bloqueado");
  assert.match(text,/frame-src 'none'/i,name+": frame-src no está bloqueado");
  assert.match(text,/base-uri 'none'/i,name+": base-uri no está bloqueado");
  assert.match(text,/connect-src 'self' https:\/\/injimzsxbnawnekybfpm\.supabase\.co/i,name+": connect-src no restringe Supabase");
  for(const match of text.matchAll(/<script\b([^>]*)>[\s\S]*?<\/script>/gi)){
    const attrs=match[1]||"";
    const hasSrc=/\bsrc\s*=/i.test(attrs);
    const isJsonLd=/\btype\s*=\s*["']application\/ld\+json["']/i.test(attrs);
    assert.ok(hasSrc||isJsonLd,name+": contiene JavaScript inline");
  }
  assert.doesNotMatch(text,/\son(?:click|load|error|submit|change|input)\s*=/i,name+": contiene handler inline");
  for(const match of text.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/gi)){
    assert.match(match[0],/rel=["'][^"']*noopener/i,name+": target=_blank sin noopener");
  }
}

for(const path of files.filter(p=>[".js",".mjs",".html",".yml",".yaml"].includes(extname(p)))){
  const text=readFileSync(path,"utf8");
  const name=relative(root,path);
  if(name==="tests/security-contract.mjs")continue;
  assert.doesNotMatch(text,/\beval\s*\(/,name+": usa eval()");
  assert.doesNotMatch(text,/\bnew Function\s*\(/,name+": usa new Function()");
  assert.doesNotMatch(text,/document\.write\s*\(/,name+": usa document.write()");
  assert.doesNotMatch(text,/\bsb_secret_[A-Za-z0-9_-]+/,name+": contiene clave secreta Supabase");
  assert.doesNotMatch(text,/SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*["'][^"']+/i,name+": contiene service role hardcodeada");
  assert.doesNotMatch(text,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,name+": contiene clave privada");
}

const appJs=readFileSync(join(root,"app.js"),"utf8");
const servicesJs=readFileSync(join(root,"services.js"),"utf8");
assert.doesNotMatch(appJs,/accept=["']image\/\*/i,"app.js: el comprobante volvió a aceptar image/*");
assert.doesNotMatch(servicesJs,/accept:\s*["']image\/\*/i,"services.js: volvió a aceptar image/*");
assert.match(appJs,/image\/jpeg,image\/png,image\/webp,application\/pdf/,"app.js: faltan formatos explícitos del comprobante");
assert.match(servicesJs,/image\/jpeg,image\/png,image\/webp/,"services.js: faltan formatos explícitos de imagen");

console.log("PASS: CSP, JavaScript inline, sinks críticos y secretos del runtime verificados.");

const adminApp=readFileSync(join(root,"admin/app.js"),"utf8");
assert.match(adminApp,/storage:\s*sessionStorage/,"Admin session must be tab-scoped");
assert.match(adminApp,/detectSessionInUrl:\s*false/,"Admin must ignore auth tokens in URL");
