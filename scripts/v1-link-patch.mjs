// Parche de una sola ejecución, SOLO en la rama de auditoría.
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
const modulePath='whatsapp-context.js';
let js=readFileSync(modulePath,'utf8');
const old="    const opened=window.open(targetUrl,'_blank','noopener,noreferrer');\n    if(!opened)location.href=targetUrl;";
const replacement="    window.open(targetUrl,'_blank','noopener,noreferrer');";
assert.ok(js.includes(old),'Cambió el control de popups; revisar sin reemplazar a ciegas');
js=js.replace(old,replacement);
writeFileSync(modulePath,js);
const marker='<script src="whatsapp-context.js?v=20260920-context1"></script>';
const modified=[];
for(const filename of readdirSync('.').filter(name=>name.endsWith('.html'))){
  const original=readFileSync(filename,'utf8');
  if(filename!=='index.html'&&!/wa\.me\/|api\.whatsapp\.com\/|data-action=["']whatsapp["']/i.test(original))continue;
  assert.ok(!original.includes('whatsapp-context.js'),'La ayuda ya está instalada en '+filename);
  assert.equal((original.match(/<\/body>/gi)||[]).length,1,'Cierre body ambiguo en '+filename);
  const updated=original.replace(/<\/body>/i,marker+'\n</body>');
  writeFileSync(filename,updated);
  modified.push(filename);
}
assert.ok(modified.includes('index.html'),'No se cargó el contexto en la portada');
console.log(`PASS: ayuda contextual conectada exclusivamente en ${modified.length} páginas: ${modified.join(', ')}. No se modifican contenidos ni botones aprobados.`);
