// Parche puntual sobre main: dos CTA, bordes, aviso PDF y caché. Abortamos ante cambios no previstos.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const branch=execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim();
assert.equal(branch,'fix/legalizaciones-cta-publicacion-20260921');
const sourceRef='origin/work/tramipago-v1-audit-20260920';
const original=readFileSync('legalizaciones-fotos-20260918.css','utf8');
assert.match(original,/opacity:0!important;/,'El CSS base ya cambió: revisar antes de aplicar');
assert.match(original,/border:1px solid #c4d8e6!important;/,'El borde base ya cambió: revisar antes de aplicar');
const corrected=execFileSync('git',['show',`${sourceRef}:legalizaciones-fotos-20260918.css`],{encoding:'utf8'});
assert.match(corrected,/opacity:1!important;/);
assert.match(corrected,/border:2px solid #17212b!important;/);
writeFileSync('legalizaciones-fotos-20260918.css',corrected);
function replaceOnce(filename,oldText,newText){
 const text=readFileSync(filename,'utf8');
 assert.equal(text.split(oldText).length,2,`Ancla faltante/no única en ${filename}: ${oldText}`);
 assert.ok(!text.includes(newText),`Parche ya aplicado: ${filename}`);
 writeFileSync(filename,text.replace(oldText,newText));
}
replaceOnce('site-fixes.js',
 '      if (!field || field.querySelector(".upload-optimizer-note")) return;',
 '      if (!field || field.querySelector(".upload-optimizer-note")) return;\n      // app.js ya muestra el límite de PDF. No repetirlo; conservar la ayuda de optimización para imágenes.\n      if (!input.accept?.includes("image") && Array.from(field.querySelectorAll("small")).some((item) => /^Archivo máximo:/i.test(item.textContent.trim()))) return;');
replaceOnce('site.css',
 '@import url("legalizaciones-fotos-20260918.css?v=20260918-fotos1");',
 '@import url("legalizaciones-fotos-20260918.css?v=20260921-cta-visible1");');
replaceOnce('index.html',
 '<link rel="stylesheet" href="site.css?v=20260919-front-audit-v4" />',
 '<link rel="stylesheet" href="site.css?v=20260921-cta-visible1" />');
replaceOnce('index.html',
 '<script src="site-fixes.js?v=20260914-security2"></script>',
 '<script src="site-fixes.js?v=20260921-hint-single1"></script>');
const files=execFileSync('git',['diff','--name-only'],{encoding:'utf8'}).trim().split('\n').sort();
assert.deepEqual(files,['index.html','legalizaciones-fotos-20260918.css','site-fixes.js','site.css'].sort());
console.log('PARCHE PREPARADO: únicamente index.html, legalizaciones-fotos-20260918.css, site-fixes.js, site.css.');