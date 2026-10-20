import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
function pages(dir) {
  return readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    const full=path.join(dir,entry.name);
    return entry.isDirectory()?pages(full):entry.isFile()&&entry.name.endsWith(".html")?[full]:[];
  });
}
const htmlPages=pages(root);
assert.ok(htmlPages.length>=140,"V2 page inventory unexpectedly small");
const seenTitles=new Map();
let noDescriptions=0;
for(const file of htmlPages) {
  const html=readFileSync(file,"utf8");
  const label=path.relative(root,file);
  const title=html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim();
  assert.ok(title && title.length>=4,label+": missing page title");
  assert.match(html,/<html\s+lang="es-AR"/i,label+": missing Spanish-Argentina lang");
  assert.match(html,/<meta\s+name="viewport"\s+content="[^"]+"/i,label+": missing responsive viewport");
  const robots=html.match(/<meta\s+name="robots"\s+content="([^"]+)"/i)?.[1]||"";
  assert.match(robots,/\bnoindex\b/i,label+": staging page must not be indexed");
  seenTitles.set(title,(seenTitles.get(title)||0)+1);
  if(!/<meta\s+name="description"/i.test(html))noDescriptions++;
}
const duplicates=[...seenTitles].filter(([,n])=>n>1).length;
console.log("PASS V2 staging SEO isolation: "+htmlPages.length+" HTML pages; lang, title, viewport and noindex required.");
console.log("Prelaunch review (not a staging failure): "+noDescriptions+" pages without meta description; "+duplicates+" duplicated titles.");
console.log("No staging noindex/canonical/robots directive may be removed without explicit launch authorization.");
