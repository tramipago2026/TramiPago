import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";

const domain="https://tramipago.com.ar";
const publicHtml=readdirSync(".").filter(name=>name.endsWith(".html")).sort();
const sitemap=readFileSync("sitemap.xml","utf8");
const robots=readFileSync("robots.txt","utf8");
const home=readFileSync("index.html","utf8");
assert.match(home,/<h1\b[^>]*>[^<]*|<h1\b[^>]*>[\s\S]*?<\/h1>/i,"La portada debe conservar un H1 estático para usuarios y rastreadores");
assert.match(home,/"@type":"WebSite"/i,"La portada debe declarar datos estructurados WebSite");

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
