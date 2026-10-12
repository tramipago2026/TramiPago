import assert from "node:assert/strict";
import {readFileSync, existsSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(path.join(root, "rutas-v2.json"), "utf8"));
const paths = [
  ...manifest.primary.map(x => x.href),
  ...manifest.families.map(x => x.href),
  ...manifest.services.map(x => x.href),
  ...manifest.services.map(x => x.href + "iniciar/"),
  ...manifest.systemPages
];
const unique = [...new Set(paths)];
const duplicates = [...new Set(paths.filter((x, i) => paths.indexOf(x) !== i))].sort();
assert.deepEqual(duplicates, ["/v2/ayuda/", "/v2/seguimiento/"], "Duplicaciones no justificadas en manifiesto");

let internalLinks = 0;
for (const url of unique) {
  assert.ok(url.startsWith("/v2/"), "Ruta fuera de V2: " + url);
  const htmlPath = path.join(root, url.slice(4), "index.html");
  assert.ok(existsSync(htmlPath), "Falta destino: " + url);
  const html = readFileSync(htmlPath, "utf8");
  assert.ok(html.includes('name="robots" content="noindex,nofollow"'), "Falta noindex: " + url);
  for (const [, attribute, value] of html.matchAll(/\b(href|src|action)="([^"]+)"/g)) {
    if (!value.startsWith("/")) continue;
    assert.ok(value.startsWith("/v2/"), "Enlace o recurso fuera de V2: " + url + " → " + value);
    const rel = value.replace(/[?#].*$/, "").slice(4);
    const assetPath = path.join(root, rel);
    const target = value.endsWith("/") ? path.join(assetPath, "index.html") : assetPath;
    assert.ok(existsSync(target), "Link/recurso local no existe: " + url + " → " + value);
    internalLinks++;
  }
}
assert.equal(manifest.services.length, 25, "Inventario de fichas inesperado");
assert.equal(manifest.families.length, 5, "Inventario de familias inesperado");
console.log("PASS CONTROL 4: " + unique.length + " rutas, " + internalLinks + " enlaces/recursos locales verificados; sin escapes V1.");
