import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";

const domain="https://tramipago.com.ar";
const publicHtml=readdirSync(".").filter(name=>name.endsWith(".html")).sort();
const sitemap=readFileSync("sitemap.xml","utf8");
const robots=readFileSync("robots.txt","utf8");
const home=readFileSync("index.html","utf8");
const appJs=readFileSync("app.js","utf8");
const terms=readFileSync("terminos-condiciones.html","utf8");
assert.match(home,/"@type":"WebSite"/i,"La portada debe declarar datos estructurados WebSite");
assert.match(appJs,/document\.title\s*=\s*"TramiPago \| Asistencia para trámites online y seguimiento"/i,"La portada dinámica debe conservar el title SEO de TramiPago");
assert.doesNotMatch(appJs,/TramiPago: trámites online con asistencia y seguimiento/i,"renderHome no debe reinsertar el bloque SEO visible eliminado");
assert.doesNotMatch(home,/<main[^>]*>[\s\S]*?TramiPago: trámites online con asistencia y seguimiento/i,"La portada inicial no debe contener el bloque SEO visible eliminado");
assert.match(terms,/TramiPago es un servicio privado de gestión y asistencia para realizar trámites online en Argentina, con atención personalizada y seguimiento\./i,"Términos debe contener la definición completa de TramiPago");
assert.match(terms,/TramiPago no es un organismo público, oficial ni gubernamental/i,"Términos debe aclarar que TramiPago no es un organismo oficial");
assert.match(home,/<title>TramiPago\s*[|:-]/i,"El title principal debe comenzar con la marca TramiPago");
assert.match(home,/<meta[^>]+name=["']description["'][^>]+content=["'][^"']*TramiPago[^"']*servicio privado[^"']*Argentina[^"']*["']/i,"La meta description debe definir a TramiPago como servicio privado en Argentina");
assert.match(home,/"@type":"Organization"[\s\S]*?"@id":"https:\/\/tramipago\.com\.ar\/#organization"[\s\S]*?"name":"TramiPago"/i,"Organization debe identificar de forma estable a TramiPago");
assert.match(home,/"description":"TramiPago es un servicio privado de gestión y asistencia para realizar trámites online en Argentina/i,"Organization debe describir claramente la marca");
assert.match(home,/"@type":"WebSite"[\s\S]*?"publisher":\{"@id":"https:\/\/tramipago\.com\.ar\/#organization"\}/i,"WebSite debe publicar la misma entidad Organization");

const favicon=readFileSync("favicon.png");
assert.equal(favicon.subarray(0,8).toString("hex"),"89504e470d0a1a0a","favicon.png debe ser un PNG válido");
assert.equal(favicon.readUInt32BE(16),96,"favicon.png debe medir 96 px de ancho");
assert.equal(favicon.readUInt32BE(20),96,"favicon.png debe medir 96 px de alto");
assert.match(home,/<link\s+rel=["']icon["'][^>]+href=["']\/favicon\.png["'][^>]+type=["']image\/png["'][^>]*>/i,"La portada debe declarar /favicon.png como image/png");

assert.match(robots,/^User-agent:\s*\*/mi,"robots.txt no declara User-agent global");
assert.match(robots,/Sitemap:\s*https:\/\/tramipago\.com\.ar\/sitemap\.xml/i,"robots.txt no apunta al sitemap canónico");
assert.doesNotMatch(sitemap,/#/,"sitemap.xml no debe contener rutas hash");
assert.doesNotMatch(sitemap,/\/admin\//i,"sitemap.xml no debe indexar Admin");

const sitemapUrls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
assert.equal(new Set(sitemapUrls).size,sitemapUrls.length,"sitemap.xml contiene URLs duplicadas");

for(const file of publicHtml){
  const html=readFileSync(file,"utf8");
  const canonical=(html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["'][^>]*>/i)||[])[1]
    ||(html.match(/<link\s+href=["']([^"']+)["']\s+rel=["']canonical["'][^>]*>/i)||[])[1];
  const expected=file==="index.html"?domain+"/":domain+"/"+file;
  assert.equal(canonical,expected,file+": canonical ausente o incorrecto");
  assert.match(html,/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*index[^"']*follow[^"']*["']/i,file+": falta meta robots index,follow");
  assert.ok(sitemapUrls.includes(expected),file+": falta en sitemap.xml");
}

for(const url of sitemapUrls){
  assert.ok(url===domain+"/"||url.startsWith(domain+"/"),"URL fuera del dominio canónico: "+url);
  const path=new URL(url).pathname;
  const file=path==="/"? "index.html":path.replace(/^\//,"");
  assert.ok(publicHtml.includes(file),"Sitemap apunta a HTML inexistente: "+url);
}

for(const m of sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)){
  assert.match(m[1],/^\d{4}-\d{2}-\d{2}$/,"lastmod inválido: "+m[1]);
  assert.ok(Date.parse(m[1]+"T23:59:59Z")<=Date.now()+86400000,"lastmod futuro: "+m[1]);
}

console.log("PASS SEO_CONTRACT pages="+publicHtml.length+" sitemap="+sitemapUrls.length);
