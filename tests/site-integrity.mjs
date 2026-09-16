// Auditoría estática reproducible: no envía formularios ni utiliza datos personales.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skipped = new Set(['.git', '.github', 'node_modules', 'local-data']);
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (skipped.has(entry.name)) return [];
    const full = join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}
const paths = walk(root);
const errors = [];
const references = [];
function verifyRef(source, raw, context) {
  const ref = String(raw).trim();
  if (!ref || ref.startsWith('#') || /^(?:https?:|mailto:|tel:|data:|javascript:|blob:|\/\/)/i.test(ref) || /[${}*]/.test(ref)) return;
  const cleaned = ref.split(/[?#]/)[0];
  if (!cleaned || cleaned.startsWith('/')) return; // Las rutas absolutas dependen del servidor y se revisan aparte.
  if (/[%]/.test(cleaned)) return; // Las rutas codificadas o dinámicas requieren navegador.
  const target = resolve(dirname(source), decodeURIComponent(cleaned));
  const label = `${relative(root, source)} → ${ref} (${context})`;
  references.push(label);
  if (!target.startsWith(root + '/') && target !== root) errors.push(`Referencia fuera del repositorio: ${label}`);
  else if (!existsSync(target) || !statSync(target).isFile()) errors.push(`Archivo inexistente: ${label}`);
}
for (const path of paths) {
  const ext = extname(path).toLowerCase();
  if (!['.html', '.css', '.js', '.mjs'].includes(ext)) continue;
  const text = readFileSync(path, 'utf8');
  if (ext === '.html') {
    for (const match of text.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)) verifyRef(path, match[1], 'HTML');
  }
  if (ext === '.css') {
    for (const match of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) verifyRef(path, match[1], 'CSS');
  }
  if (ext === '.js' || ext === '.mjs') {
    const syntax = spawnSync(process.execPath, ['--check', path], { encoding:'utf8' });
    if (syntax.status !== 0) errors.push(`Error de sintaxis en ${relative(root, path)}: ${syntax.stderr.trim()}`);
    for (const match of text.matchAll(/["'`](assets\/[A-Za-z0-9._/-]+)["'`]/g)) verifyRef(path, match[1], 'imagen en JS');
  }
}
console.log(`Archivos inspeccionados: ${paths.length}; referencias estáticas verificadas: ${references.length}; errores: ${errors.length}.`);
if (errors.length) { for (const error of errors) console.error(`ERROR ${error}`); process.exitCode = 1; }
else console.log('PASS: referencias locales y sintaxis JavaScript verificadas. No equivale a probar el sitio publicado.');
