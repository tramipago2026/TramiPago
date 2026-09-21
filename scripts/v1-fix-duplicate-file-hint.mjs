// Ejecución única, solo rama de auditoría; reemplazos literales validados, sin tocar main ni datos.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
assert.equal(execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),'work/tramipago-v1-audit-20260920','No aplicar fuera de la rama de auditoría');
function change(file,before,after){
 const source=readFileSync(file,'utf8');
 assert.equal(source.split(before).length,2,`Ancla no única o faltante en ${file}: ${before}`);
 assert.ok(!source.includes(after),`Ya existe el reemplazo en ${file}`);
 writeFileSync(file,source.replace(before,after));
}
change('site-fixes.js',
 '      if (!field || field.querySelector(".upload-optimizer-note")) return;',
 '      if (!field || field.querySelector(".upload-optimizer-note")) return;\n      // app.js ya muestra el límite de PDF. No repetirlo; conservar la ayuda de optimización para imágenes.\n      if (!input.accept?.includes("image") && Array.from(field.querySelectorAll("small")).some((item) => /^Archivo máximo:/i.test(item.textContent.trim()))) return;');
change('site.css',
 '@import url("legalizaciones-fotos-20260918.css?v=20260918-fotos1");',
 '@import url("legalizaciones-fotos-20260918.css?v=20260921-cta-visible1");');
change('index.html',
 '<link rel="stylesheet" href="site.css?v=20260919-front-audit-v4" />',
 '<link rel="stylesheet" href="site.css?v=20260921-cta-visible1" />');
change('index.html',
 '<script src="site-fixes.js?v=20260914-security2"></script>',
 '<script src="site-fixes.js?v=20260921-hint-single1"></script>');
console.log('PASS: solo cuatro sustituciones puntuales: no duplicar aviso PDF, versionar CSS reparado y site-fixes.js. Resto de diseño, rutas y contenidos preservados.');
