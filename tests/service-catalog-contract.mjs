import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import vm from "node:vm";
const manifest=JSON.parse(readFileSync("service-pages.json","utf8"));
const source=readFileSync("services.js","utf8");
const sandbox={location:{hash:""},setTimeout(){return 0},clearTimeout(){},window:{addEventListener(){}},document:{addEventListener(){},querySelector(){return null},querySelectorAll(){return[]},getElementById(){return null}}};sandbox.window.location=sandbox.location;
vm.createContext(sandbox);new vm.Script(source).runInContext(sandbox);
const active=sandbox.window.TRAMI_SERVICES.filter(s=>s.active);
assert.equal(active.length,25,"Cantidad inesperada de servicios activos");
assert.equal(Object.keys(manifest.services).sort().join(","),Array.from(active,s=>s.id).sort().join(","),"Cada servicio activo debe tener una URL SEO propia");
const sitemap=readFileSync("sitemap.xml","utf8");
for(const service of active){
 const file=manifest.services[service.id]; assert.ok(existsSync(file),service.id+": falta landing "+file);
 const html=readFileSync(file,"utf8"); const expected="https://tramipago.com.ar/"+file;
 assert.ok(html.includes(`<link rel="canonical" href="${expected}">`),service.id+": canonical incorrecto");
 assert.ok(html.includes(`<meta name="robots" content="index,follow">`),service.id+": no es indexable");
 assert.ok(html.includes("index.html#/tramite/"+encodeURIComponent(service.id)),service.id+": falta acceso al formulario operativo");
 assert.ok(sitemap.includes("<loc>"+expected+"</loc>"),service.id+": falta en sitemap");
}
for(const file of Object.values(manifest.families)){assert.ok(existsSync(file),"Falta hub "+file);assert.ok(sitemap.includes("https://tramipago.com.ar/"+file),"Hub fuera del sitemap: "+file);}
for(const file of Object.values(manifest.municipal)){assert.ok(existsSync(file),"Falta landing municipal "+file);assert.ok(sitemap.includes("https://tramipago.com.ar/"+file),"Landing municipal fuera del sitemap: "+file);}
console.log("PASS SERVICE_CATALOG_CONTRACT active="+active.length+" servicePages="+Object.keys(manifest.services).length);
