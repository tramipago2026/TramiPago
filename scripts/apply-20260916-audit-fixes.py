"""Aplicación puntual y verificable de correcciones. No altera ni crea imágenes.
Solo modifica patrones literales comprobados en los archivos de código listados.
Ejecutar una única vez desde la raíz del repositorio público.
"""
from pathlib import Path
import subprocess


def patch(path, old, new, count=1):
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    found = text.count(old)
    if found != count:
        raise RuntimeError(f'{path}: patrón esperado {count} vez/veces; encontrado {found}; no se modificó')
    p.write_text(text.replace(old, new), encoding='utf-8')

# La tasa oficial de Cancillería se paga en TAD, NO mediante la transferencia a TramiPago.
patch('extra-families.js', '      officialFee:0,\n      priceField:"serviceOption",',
      '      officialFee:null,\n      officialFeeExternal:true,\n      priceField:"serviceOption",', 2)
patch('extra-families.js',
      '"TramiPago verifica previamente que la documentación sea apta para iniciar la gestión."',
      '"TramiPago verifica previamente que la documentación sea apta para iniciar la gestión.",\n        "Arancel oficial TAD de apostilla: $4.500 por documento, abonado aparte por VEP al organismo. El precio de TramiPago no incluye ese arancel."')
patch('extra-families.js',
      '"La vía exacta se determina según el tipo de documento y la legalización requerida."',
      '"La vía exacta se determina según el tipo de documento y la legalización requerida.",\n        "Si corresponde legalización internacional por TAD, el arancel oficial general es $4.500; solo para partidas de estado civil es $1.500. Otras vías pueden tener costos distintos o ser gratuitas. Se paga aparte, según organismo."')

# Evitar bloquear servicios que requieren un VEP externo pero tienen honorarios propios definidos.
patch('app.js',
      '    if (service.officialFee === null || service.officialFee === undefined || service.officialFee === "") return false;',
      '    if (!service.officialFeeExternal && (service.officialFee === null || service.officialFee === undefined || service.officialFee === "")) return false;')
patch('app.js',
      '    const total = officialFee !== null && officialFee !== undefined && serviceFee !== null && serviceFee !== undefined\n      ? Number(officialFee) + Number(serviceFee)\n      : null;',
      '    const total = service.officialFeeExternal\n      ? (serviceFee !== null && serviceFee !== undefined ? Number(serviceFee) : null)\n      : officialFee !== null && officialFee !== undefined && serviceFee !== null && serviceFee !== undefined\n        ? Number(officialFee) + Number(serviceFee)\n        : null;')
patch('app.js',
      '<div class="summary-item"><small>Total</small><strong>${formatARS(pricing.total)}</strong></div>',
      '<div class="summary-item"><small>${service.officialFeeExternal ? "Total TramiPago (sin arancel oficial)" : "Total"}</small><strong>${formatARS(pricing.total)}</strong></div>')
patch('app.js',
      '        <div class="notice"><strong>Datos de pago:</strong> alias ${escapeHTML(window.TRAMI_CONFIG.alias)} · titular ${escapeHTML(window.TRAMI_CONFIG.paymentHolder)}.</div>',
      '        ${service.officialFeeExternal ? `<div class="notice"><strong>Arancel oficial aparte:</strong> se abona directamente al organismo mediante su VEP cuando corresponda. No transfieras ese arancel a TramiPago; esta pantalla cobra únicamente nuestro servicio.</div>` : ""}\n        <div class="notice"><strong>Datos de pago:</strong> alias ${escapeHTML(window.TRAMI_CONFIG.alias)} · titular ${escapeHTML(window.TRAMI_CONFIG.paymentHolder)}.</div>')

# Los tokens de autorización no deben permanecer indefinidamente en localStorage.
patch('backend-sync.js',
      '  function tokens(){return readJSON(TOKENS_KEY,{});}\n  function saveTokens(value){writeJSON(TOKENS_KEY,value);}',
      '''  function tokens(){
    try{
      const current=sessionStorage.getItem(TOKENS_KEY);
      if(current)return JSON.parse(current)||{};
      const legacy=readJSON(TOKENS_KEY,{});
      if(Object.keys(legacy).length)saveTokens(legacy);
      return legacy;
    }catch(_){return {};}
  }
  function saveTokens(value){
    sessionStorage.setItem(TOKENS_KEY,JSON.stringify(value));
    try{localStorage.removeItem(TOKENS_KEY);}catch(_){}
  }''')
patch('backend-sync.js',
      '    if(tokenMap[request.id])return true;\n    const created=Date.parse(request.createdAt||"");',
      '    if(tokenMap[request.id])return true;\n    if(request.serverId)return false; // No recrear una ficha si se cerró la pestaña y expiró su token.\n    const created=Date.parse(request.createdAt||"");')
patch('backend-sync.js',
      '    if(Number.isFinite(Number(data.amount))&&request.pricing){request.pricing.total=Number(data.amount);}',
      '    if(data.amount!==null&&data.amount!==undefined&&Number.isFinite(Number(data.amount))&&request.pricing){request.pricing.total=Number(data.amount);}')
patch('security-hardening.js',
      '  function tokens(){return readJSON(TOKENS_KEY,{});}',
      '  function tokens(){try{return JSON.parse(sessionStorage.getItem(TOKENS_KEY)||"{}")||{};}catch(_){return {};}}')
patch('security-hardening.js',
      'if(request.id&&tokenMap[request.id]){delete tokenMap[request.id];writeJSON(TOKENS_KEY,tokenMap);}',
      'if(request.id&&tokenMap[request.id]){delete tokenMap[request.id];sessionStorage.setItem(TOKENS_KEY,JSON.stringify(tokenMap));localStorage.removeItem(TOKENS_KEY);}')

# Renovar versiones de caché para que el navegador cargue el código reparado.
for name in ('extra-families.js', 'app.js', 'security-hardening.js', 'backend-sync.js'):
    import re
    p=Path('index.html')
    html=p.read_text(encoding='utf-8')
    pattern=rf'(<script src="{re.escape(name)}\?v=)[^" ]+'
    revised, count=re.subn(pattern, rf'\g<1>20260916-audit2', html)
    if count != 1:
        raise RuntimeError(f'index.html: no se encontró versión de {name}: {count}')
    p.write_text(revised, encoding='utf-8')

expected={'extra-families.js','app.js','backend-sync.js','security-hardening.js','index.html'}
changed=set(subprocess.check_output(['git','diff','--name-only'],text=True).splitlines())
if changed!=expected:
    raise RuntimeError(f'Se modificaron archivos inesperados: {sorted(changed ^ expected)}')
for file in ('extra-families.js','app.js','backend-sync.js','security-hardening.js'):
    subprocess.run(['node','--check',file],check=True)
subprocess.run(['node','tests/site-integrity.mjs'],check=True)
print('PASS: parches aplicados, 5 archivos de código/HTML modificados, ninguna imagen afectada.')
