#!/usr/bin/env bash
set -euo pipefail

python3 - <<'PY'
from pathlib import Path

# 1) Consola: los cuatro estados manuales reales; pago pendiente/revisión siguen siendo automáticos.
p=Path('admin.js')
s=p.read_text(encoding='utf-8')
old='const EDITABLE_STATUSES=["awaiting_payment","payment_review","in_progress","needs_info","finalized"];'
new='const EDITABLE_STATUSES=["payment_confirmed","in_progress","needs_info","finalized"];'
if old not in s:
    raise SystemExit('No se encontró EDITABLE_STATUSES esperado en admin.js')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')

# 2) Confirmación: nunca mostrar al cliente el código local provisional como si ya existiera en la base.
p=Path('app.js')
s=p.read_text(encoding='utf-8')
old='''  function renderConfirmationStage(service) {\n    const request = getRequest(state.requestId);\n    if (!request) return "";\n    return `\n      <div class="panel confirmation">\n        <div class="confirmation-icon" aria-hidden="true">✓</div>\n        <h2>Solicitud recibida</h2>\n        <p>Guardá este código para consultar las actualizaciones.</p>\n        <div class="request-code">${escapeHTML(request.code)}</div>\n        <p><strong>${escapeHTML(service.name)}</strong><br />${escapeHTML(statusLabel(request.status))}</p>\n        <div class="hero-actions confirmation-actions">\n          <button class="button button-primary" type="button" data-action="track-request">Ver estado</button>\n          <button class="button button-secondary" type="button" data-action="copy-code">Copiar código</button>\n        </div>\n      </div>\n    `;\n  }'''
new='''  function renderConfirmationStage(service) {\n    const request = getRequest(state.requestId);\n    if (!request) return "";\n    const serverReady = Boolean(request.serverId);\n    const syncError = String(request.backendSyncError || "");\n    return `\n      <div class="panel confirmation">\n        <div class="confirmation-icon" aria-hidden="true">✓</div>\n        <h2>${serverReady ? "Solicitud recibida" : "Registrando solicitud"}</h2>\n        <p>${serverReady\n          ? "Guardá este código para consultar las actualizaciones."\n          : syncError\n            ? "Todavía no pudimos registrar la solicitud en la base. No cierres esta página y reintentá."\n            : "Estamos generando tu código definitivo."}</p>\n        <div class="request-code">${serverReady ? escapeHTML(request.code) : "Generando código…"}</div>\n        <p><strong>${escapeHTML(service.name)}</strong><br />${escapeHTML(statusLabel(request.status))}</p>\n        ${serverReady ? `\n          <div class="hero-actions confirmation-actions">\n            <button class="button button-primary" type="button" data-action="track-request">Ver estado</button>\n            <button class="button button-secondary" type="button" data-action="copy-code">Copiar código</button>\n          </div>` : `\n          <div class="hero-actions confirmation-actions">\n            <button class="button button-primary" type="button" data-action="retry-backend-sync">Reintentar registro</button>\n          </div>`}\n      </div>\n    `;\n  }'''
if old not in s:
    raise SystemExit('No se encontró renderConfirmationStage esperado en app.js')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')

# 3) Sincronización: limpiar errores viejos tras un reintento correcto, actualizar ejemplo de código y habilitar reintento.
p=Path('backend-sync.js')
s=p.read_text(encoding='utf-8')
old='''    if(request.status==="payment_pending")await updateServerDraft(request,meta);\n    if(request.status==="payment_review")await syncPayment(request,meta);\n    request.backendSyncedAt=new Date().toISOString();'''
new='''    if(request.status==="payment_pending")await updateServerDraft(request,meta);\n    if(request.status==="payment_review")await syncPayment(request,meta);\n    delete request.backendSyncError;\n    request.backendSyncedAt=new Date().toISOString();'''
if old not in s:
    raise SystemExit('No se encontró syncOne esperado en backend-sync.js')
s=s.replace(old,new,1)
s=s.replace('if(input)input.placeholder="AP-000001";','if(input)input.placeholder="AP-000012-A1B2";',1)
anchor='''  function installCorrectionInterceptor(){'''
insert='''  function installRetryInterceptor(){\n    document.addEventListener("click",event=>{\n      const button=event.target.closest('[data-action="retry-backend-sync"]');\n      if(!button)return;\n      event.preventDefault();\n      if(client){\n        button.disabled=true;\n        syncAll().finally(()=>{button.disabled=false;});\n      }else{\n        location.reload();\n      }\n    },true);\n  }\n\n'''
if anchor not in s:
    raise SystemExit('No se encontró ancla de corrección en backend-sync.js')
s=s.replace(anchor,insert+anchor,1)
old_init='''    installTrackingInterceptor();\n    installCorrectionInterceptor();\n    observeUI();'''
new_init='''    installTrackingInterceptor();\n    installRetryInterceptor();\n    installCorrectionInterceptor();\n    observeUI();'''
if old_init not in s:
    raise SystemExit('No se encontró init esperado en backend-sync.js')
s=s.replace(old_init,new_init,1)
p.write_text(s,encoding='utf-8')
PY

node --check app.js
node --check admin.js
node --check backend-sync.js
node --check services.js
node --check arca-family.js
node --check flow-ui.js
node --check site-fixes.js
node --check footer-menu.js
git diff --check

grep -F 'const EDITABLE_STATUSES=["payment_confirmed","in_progress","needs_info","finalized"];' admin.js >/dev/null
grep -F 'data-action="retry-backend-sync"' app.js >/dev/null
grep -F 'installRetryInterceptor();' backend-sync.js >/dev/null
grep -F 'AP-000012-A1B2' backend-sync.js >/dev/null

npm init -y >/dev/null 2>&1
npm install --no-save playwright@1.55.0 >/dev/null
npx playwright install --with-deps chromium >/dev/null
python3 -m http.server 4173 >/tmp/tramipago-final-audit.log 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT
sleep 2
curl -fsS http://127.0.0.1:4173/index.html >/dev/null

for PASS in 1 2 3; do
  echo "===== AUDITORIA FINAL ${PASS}/3 ====="
  node scripts/audit-factual.mjs
  echo "===== AUDITORIA FINAL ${PASS}/3 OK ====="
done

rm -rf node_modules package.json package-lock.json audit-output audit-output-v2
rm -f scripts/audit-factual.mjs scripts/technical-audit-cleanup.sh
rm -f .github/workflows/auditoria-factual-3x.yml .github/workflows/technical-audit-cleanup.yml

git config user.name tramipago2026
git config user.email tramipago@gmail.com
git add -A
git diff --cached --check
git commit -m 'Endurece registro, valida el sitio tres veces y limpia auditorías'
git push origin HEAD:main
