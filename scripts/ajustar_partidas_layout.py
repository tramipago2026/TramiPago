from pathlib import Path

app = Path('app.js')
s = app.read_text(encoding='utf-8')
old = '''          <div class="partidas-selector-heading">
            <h1>Elegí la jurisdicción</h1>
          </div>
          <div class="partidas-jurisdiction-grid">
            ${renderPartidasJurisdictionCard("pba", "PBA", "Provincia de Buenos Aires")}
            ${renderPartidasJurisdictionCard("caba", "CABA", "Ciudad Autónoma de Buenos Aires")}
          </div>'''
new = '''          <div class="partidas-selector-heading">
            <h1>Elegí la jurisdicción</h1>
            <p>Seleccioná dónde está inscripta la partida.</p>
          </div>
          <div class="partidas-jurisdiction-grid">
            ${renderPartidasJurisdictionCard("pba", "PBA", "Provincia de Buenos Aires")}
            ${renderPartidasJurisdictionCard("caba", "CABA", "Ciudad Autónoma de Buenos Aires")}
          </div>
          <div class="partidas-flow-steps" aria-label="Pasos del trámite">
            <span><strong>1.</strong> Jurisdicción</span>
            <span class="partidas-flow-arrow" aria-hidden="true">→</span>
            <span><strong>2.</strong> Tipo de partida</span>
            <span class="partidas-flow-arrow" aria-hidden="true">→</span>
            <span><strong>3.</strong> Datos</span>
          </div>'''
if old not in s:
    raise SystemExit('No se encontró el bloque esperado en app.js')
app.write_text(s.replace(old, new, 1), encoding='utf-8')

index = Path('index.html')
h = index.read_text(encoding='utf-8')
old_css = '''    .partidas-selector-shell { max-width:980px;padding-top:14px;padding-bottom:34px; }
    .partidas-selector-heading { margin:0 0 16px;text-align:center; }
    .partidas-selector-heading h1 { margin:0;color:var(--navy-deep);font-size:1.35rem;line-height:1.15; }
    .partidas-jurisdiction-grid { display:grid;grid-template-columns:repeat(2,154px);justify-content:center;gap:18px;align-items:stretch; }'''
new_css = '''    .partidas-selector-shell { max-width:980px;padding-top:14px;padding-bottom:34px; }
    .partidas-selector-shell .family-back { float:none; }
    .partidas-selector-heading { clear:both;width:100%;max-width:520px;margin:0 auto 16px;text-align:center; }
    .partidas-selector-heading h1 { margin:0;color:var(--navy-deep);font-size:1.35rem;line-height:1.15; }
    .partidas-selector-heading p { margin:6px 0 0;color:var(--text-muted);font-size:.9rem;line-height:1.35; }
    .partidas-jurisdiction-grid { display:grid;grid-template-columns:repeat(2,154px);justify-content:center;gap:18px;align-items:stretch; }
    .partidas-flow-steps { display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin:18px auto 0;color:var(--text-muted);font-size:var(--text-secondary);font-weight:700;line-height:1.25;text-align:center; }
    .partidas-flow-steps strong { color:var(--navy-deep); }
    .partidas-flow-arrow { color:var(--cyan);font-weight:800; }'''
if old_css not in h:
    raise SystemExit('No se encontró el bloque CSS esperado en index.html')
h = h.replace(old_css, new_css, 1)
old_mobile = '@media(max-width:390px){.partidas-jurisdiction-grid,.partidas-type-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.partidas-jurisdiction-card,.partidas-type-card{width:100%}}'
new_mobile = '@media(max-width:390px){.partidas-jurisdiction-grid,.partidas-type-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.partidas-jurisdiction-card,.partidas-type-card{width:100%}.partidas-flow-steps{gap:5px;font-size:.72rem;flex-wrap:wrap}}'
if old_mobile in h:
    h = h.replace(old_mobile, new_mobile, 1)
h = h.replace('v=20260907-0505', 'v=20260907-2125')
index.write_text(h, encoding='utf-8')
