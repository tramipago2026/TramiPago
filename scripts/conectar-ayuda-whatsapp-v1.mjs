import assert from 'node:assert/strict';
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
assert.equal(execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),'fix/auditoria-aranceles-20260921','No modificar main');
const marker='<script src="whatsapp-context.js?v=20260921-context2"></script>';
const pages=[];
for(const filename of readdirSync('.').filter(file=>file.endsWith('.html'))){
  const source=readFileSync(filename,'utf8');
  if(filename!=='index.html'&&!/wa\.me\/|api\.whatsapp\.com\/|data-action=["']whatsapp["']/i.test(source))continue;
  assert.ok(!source.includes('whatsapp-context.js'),`Contexto duplicado en ${filename}`);
  assert.equal((source.match(/<\/body>/gi)||[]).length,1,`Cierre body ambiguo: ${filename}`);
  writeFileSync(filename,source.replace(/<\/body>/i,marker+'\n</body>'));
  pages.push(filename);
}
assert.equal(pages.length,9,'Cambió el alcance de las nueve páginas; revisar antes de tocar otras');
assert.ok(pages.includes('index.html'),'La portada no incluye ayuda');
console.log('PASS: ayuda contextual instalada sin tocar CSS, botones originales ni contenido: '+pages.join(', '));