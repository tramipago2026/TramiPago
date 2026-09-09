#!/usr/bin/env bash
set -euo pipefail

echo '1/5 Corrigiendo pendientes reales'
python3 - <<'PY'
from pathlib import Path
import re

p = Path('app.js')
s = p.read_text(encoding='utf-8')
original = s
for old in (r'[0-9\\s\\-]*', r'[0-9\s\-]*'):
    s = s.replace(old, '[0-9 -]*')
if s == original:
    raise SystemExit('No se encontró el patrón numérico viejo en app.js')
p.write_text(s, encoding='utf-8')

p = Path('services.js')
s = p.read_text(encoding='utf-8')
old = '''      form.querySelectorAll('input[name="dataMode"]').forEach((input) => {
        input.checked = false;
      });'''
new = '''      const dataModeControl = form.querySelector('[name="dataMode"]');
      if (dataModeControl) dataModeControl.value = "";'''
if old in s:
    s = s.replace(old, new, 1)
p.write_text(s, encoding='utf-8')

p = Path('index.html')
s = p.read_text(encoding='utf-8')
s = re.sub(r'\?v=[^"\']+', '?v=20260909-clean-final', s)
p.write_text(s, encoding='utf-8')
PY

node --check app.js
node --check services.js
node --check arca-family.js
node --check flow-ui.js
node --check site-fixes.js
node --check footer-menu.js
git diff --check

echo '2/5 Preparando auditoría'
npm init -y >/dev/null 2>&1
npm install --no-save playwright@1.55.0 >/dev/null
python3 - <<'PY'
from pathlib import Path
p = Path('scripts/audit-site-v2.mjs')
s = p.read_text(encoding='utf-8')
s = s.replace("chromium.launch({headless:true})", "chromium.launch({headless:true,channel:'chrome'})")
old = '''  const radios=await page.locator('input[type=radio]:visible').evaluateAll(els=>uniqNames(els.map(e=>e.name))); // helper injected below
  for(const name of radios){
    const checked=page.locator(`input[type=radio][name="${name}"]:checked`);
    if(!(await checked.count())){const first=page.locator(`input[type=radio][name="${name}"]:visible`).first();if(await first.count())await first.check({force:true});}
  }'''
new = '''  for(let round=0;round<3;round++){
    const radios=await page.locator('input[type=radio]:visible').evaluateAll(els=>uniqNames(els.map(e=>e.name)));
    for(const name of radios){
      const checked=page.locator(`input[type=radio][name="${name}"]:checked`);
      if(!(await checked.count())){const first=page.locator(`input[type=radio][name="${name}"]:visible`).first();if(await first.count())await first.check({force:true});}
    }
    await page.waitForTimeout(40);
  }'''
if old in s:
    s = s.replace(old, new, 1)
s = s.replace("const tag=await el.evaluate(e=>e.tagName.toLowerCase()); const type=(await el.getAttribute('type'))||tag; const name=(await el.getAttribute('name'))||'';", "const tag=await el.evaluate(e=>e.tagName.toLowerCase()); const type=(await el.getAttribute('type'))||tag; const name=(await el.getAttribute('name'))||''; const inputmode=(await el.getAttribute('inputmode'))||'';")
s = s.replace("if(tag==='select'){const vals=await el.locator('option:not([disabled])').evaluateAll(os=>os.map(o=>o.value).filter(Boolean));if(vals.length)await el.selectOption(vals[0]);continue;}", "if(tag==='select'){const vals=await el.locator('option:not([disabled])').evaluateAll(os=>os.map(o=>o.value).filter(Boolean));if(vals.length)await el.selectOption(vals[0]);await page.waitForTimeout(40);continue;}")
s = s.replace("else if(/actNumber/i.test(name))v='1';\n      await el.fill(v);", "else if(/actNumber/i.test(name))v='1';\n      if(inputmode==='numeric'&&v==='Dato de prueba')v='1234';\n      await el.fill(v);")
s = s.replace("await page.goto(BASE+hash,{waitUntil:'networkidle'}); await page.waitForTimeout(100); await inspect(page,hash);", "await page.goto(BASE+'#/',{waitUntil:'networkidle'}); await page.goto(BASE+hash,{waitUntil:'networkidle'}); await page.waitForTimeout(120); await inspect(page,hash);")
s = s.replace("await fillForm(page,opts);\n  const submit=", "for(let progressiveRound=0;progressiveRound<4;progressiveRound++){\n    await fillForm(page,opts);\n    await page.waitForTimeout(120);\n    const probe=form.locator('button[type=submit],input[type=submit]').first();\n    if(await probe.isVisible().catch(()=>false))break;\n  }\n  const submit=")
s = s.replace("await submit.click(); await page.waitForTimeout(180);", "if(!(await submit.isVisible().catch(()=>false))){issue('submit-oculto','El botón de avance sigue oculto después de completar los campos visibles',hash);return;}\n  await submit.click(); await page.waitForTimeout(180);", 1)
p.write_text(s, encoding='utf-8')
PY

google-chrome --version || google-chrome-stable --version

echo '3/5 Iniciando sitio local corregido'
python3 -m http.server 4173 >/tmp/tramipago-final-server.log 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT
sleep 2
curl -fsS http://127.0.0.1:4173/ >/dev/null

echo '4/5 Ejecutando tres pasadas completas'
for PASS in 1 2 3; do
  echo "========== PASADA ${PASS} DE 3 =========="
  rm -rf audit-output-v2
  node scripts/audit-site-v2.mjs
  echo "========== PASADA ${PASS}: OK =========="
done

echo '5/5 Limpiando archivos temporales y publicando'
rm -rf node_modules package.json package-lock.json audit-output audit-output-v2
rm -f scripts/audit-site.mjs scripts/audit-site-v2.mjs scripts/final-cleanup.sh
rm -f .github/workflows/auditoria-completa.yml .github/workflows/auditoria-completa-v2.yml .github/workflows/auditoria-final-3x.yml

git config user.name tramipago2026
git config user.email tramipago@gmail.com
git add -A
git diff --cached --check
git commit -m 'Corrige pendientes, limpia archivos y valida TramiPago tres veces'
git push origin HEAD:main
