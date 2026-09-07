from pathlib import Path

root = Path('.')
app = root / 'app.js'
services = root / 'services.js'
index = root / 'index.html'

app_text = app.read_text(encoding='utf-8')
services_text = services.read_text(encoding='utf-8')
index_text = index.read_text(encoding='utf-8')

# 1) Estado de jurisdicción en la familia Partidas.
needle = '    familyId: null,\n    serviceId: null,'
replacement = '    familyId: null,\n    partidasJurisdiction: null,\n    serviceId: null,'
if needle not in app_text:
    raise SystemExit('No se encontró el estado base en app.js')
app_text = app_text.replace(needle, replacement, 1)

# 2) UI especial para Partidas: jurisdicción primero y luego cuatro tipos.
marker = '  function renderFamily() {\n'
if marker not in app_text:
    raise SystemExit('No se encontró renderFamily en app.js')
insert = r'''  const PARTIDAS_TYPE_CARDS = Object.freeze([
    { value: "birth", title: "Partida de Nacimiento", subtitle: "Registro Civil", icon: "assets/partida-nacimiento.svg", tone: "birth" },
    { value: "marriage", title: "Partida de Matrimonio", subtitle: "Registro Civil", icon: "assets/partida-matrimonio.svg", tone: "marriage" },
    { value: "cohabitation", title: "Partida de Unión Convivencial", subtitle: "Registro Civil", icon: "assets/partida-union-convivencial.svg", tone: "cohabitation" },
    { value: "death", title: "Partida de Defunción", subtitle: "Registro Civil", icon: "assets/partida-defuncion.svg", tone: "death" }
  ]);

  function renderPartidasJurisdictionCard(id, title, fullName) {
    const selected = state.partidasJurisdiction === id;
    return `
      <button class="partidas-jurisdiction-card${selected ? " is-selected" : ""}" type="button"
        data-action="select-partidas-jurisdiction" data-jurisdiction="${escapeHTML(id)}"
        aria-pressed="${selected ? "true" : "false"}" aria-label="${escapeHTML(fullName)}">
        <span class="partidas-jurisdiction-media partidas-jurisdiction-media-${escapeHTML(id)}" aria-hidden="true">
          <span>${escapeHTML(fullName)}</span>
        </span>
        <span class="catalog-card-info">
          <span class="catalog-card-title">${escapeHTML(title)}</span>
          <span class="catalog-card-subtitle">Jurisdicción</span>
        </span>
      </button>
    `;
  }

  function renderPartidaTypeCard(item, jurisdiction) {
    const available = jurisdiction === "pba";
    return `
      <button class="partidas-type-card partidas-type-${escapeHTML(item.tone)}${available ? "" : " is-unavailable"}" type="button"
        ${available ? `data-action="select-partida-type" data-part-type="${escapeHTML(item.value)}"` : 'disabled aria-disabled="true"'}
        aria-label="${escapeHTML(item.title)}${available ? "" : ", próximamente en CABA"}">
        <span class="partidas-type-media" aria-hidden="true"><img src="${escapeHTML(item.icon)}" alt="" /></span>
        <span class="catalog-card-info">
          <span class="catalog-card-title">${escapeHTML(item.title)}</span>
          <span class="catalog-card-subtitle">Registro Civil</span>
        </span>
        ${available ? "" : '<span class="catalog-card-badge">Próximamente</span>'}
      </button>
    `;
  }

  function renderPartidasFamily() {
    const jurisdiction = state.partidasJurisdiction;
    const jurisdictionName = jurisdiction === "pba"
      ? "Provincia de Buenos Aires"
      : jurisdiction === "caba"
        ? "Ciudad Autónoma de Buenos Aires"
        : "";

    app.innerHTML = `
      <section class="family-page partidas-family-page">
        <div class="container partidas-selector-shell">
          <button class="button button-secondary family-back" type="button" data-action="back-home">Volver</button>
          <div class="partidas-selector-heading">
            <h1>Elegí la jurisdicción</h1>
          </div>
          <div class="partidas-jurisdiction-grid">
            ${renderPartidasJurisdictionCard("pba", "PBA", "Provincia de Buenos Aires")}
            ${renderPartidasJurisdictionCard("caba", "CABA", "Ciudad Autónoma de Buenos Aires")}
          </div>
          ${jurisdiction ? `
            <div class="partidas-type-section">
              <div class="partidas-type-heading">
                <h2>${escapeHTML(jurisdictionName)}</h2>
                <p>Elegí el tipo de partida.</p>
              </div>
              ${jurisdiction === "caba" ? '<div class="partidas-caba-note">La estructura queda preparada. Los trámites de CABA se habilitarán cuando estén confirmados requisitos, precio y plazo.</div>' : ""}
              <div class="partidas-type-grid">
                ${PARTIDAS_TYPE_CARDS.map((item) => renderPartidaTypeCard(item, jurisdiction)).join("")}
              </div>
            </div>
          ` : ""}
        </div>
      </section>
    `;
  }

'''
app_text = app_text.replace(marker, insert + marker, 1)

# 3) Usar la pantalla especial en la familia Partidas.
needle = '  function renderFamily() {\n    const family = getFamily(state.familyId);'
replacement = '  function renderFamily() {\n    if (state.familyId === "partidas-pba") return renderPartidasFamily();\n    const family = getFamily(state.familyId);'
if needle not in app_text:
    raise SystemExit('No se pudo especializar renderFamily')
app_text = app_text.replace(needle, replacement, 1)

# 4) Acciones: elegir jurisdicción y tipo de partida.
needle = '    if (action === "select-family") {\n      state.familyId = trigger.dataset.familyId;'
replacement = '''    if (action === "select-partidas-jurisdiction") {
      state.partidasJurisdiction = trigger.dataset.jurisdiction || null;
      return render();
    }

    if (action === "select-partida-type") {
      const partType = trigger.dataset.partType || "";
      if (!partType || state.partidasJurisdiction !== "pba") return;
      sessionStorage.setItem("tramipago_partidas_prefill_v1", partType);
      return startService("partidas");
    }

    if (action === "select-family") {
      state.familyId = trigger.dataset.familyId;'''
if needle not in app_text:
    raise SystemExit('No se encontró el bloque de acciones en app.js')
app_text = app_text.replace(needle, replacement, 1)

# 5) Preservar la partida elegida desde la tarjeta visual.
old_clear = '''  function clearAutomaticSelections(form) {
    if (form.dataset.partidasSelectionReady === "true") return;
    const active = getPartidasActiveRequest();
    if (!active) {
      form.querySelectorAll('input[name="partType"],input[name="dataMode"]').forEach((input) => {
        input.checked = false;
      });
    }
    form.dataset.partidasSelectionReady = "true";
  }
'''
new_clear = '''  function clearAutomaticSelections(form) {
    if (form.dataset.partidasSelectionReady === "true") return;
    const active = getPartidasActiveRequest();
    const preset = sessionStorage.getItem("tramipago_partidas_prefill_v1") || "";
    if (!active) {
      form.querySelectorAll('input[name="partType"]').forEach((input) => {
        input.checked = Boolean(preset && input.value === preset);
      });
      form.querySelectorAll('input[name="dataMode"]').forEach((input) => {
        input.checked = false;
      });
    }
    if (preset) sessionStorage.removeItem("tramipago_partidas_prefill_v1");
    form.dataset.partidasSelectionReady = "true";
  }
'''
if old_clear not in services_text:
    raise SystemExit('No se encontró clearAutomaticSelections en services.js')
services_text = services_text.replace(old_clear, new_clear, 1)

# 6) Estilos de las nuevas tarjetas, con exactamente el lenguaje visual del Inicio.
css_marker = '    .confirmation { max-width:760px;margin:18px auto 42px;padding:20px 22px; }'
css = r'''    .partidas-selector-shell { max-width:980px;padding-top:14px;padding-bottom:34px; }
    .partidas-selector-heading { margin:0 0 16px;text-align:center; }
    .partidas-selector-heading h1 { margin:0;color:var(--navy-deep);font-size:1.35rem;line-height:1.15; }
    .partidas-jurisdiction-grid { display:grid;grid-template-columns:repeat(2,154px);justify-content:center;gap:18px;align-items:stretch; }
    .partidas-jurisdiction-card,.partidas-type-card { position:relative;display:flex;flex-direction:column;width:154px;aspect-ratio:4/5;padding:0;overflow:hidden;background:var(--surface);border:0;border-radius:9px;box-shadow:0 5px 16px var(--shadow-soft);cursor:pointer;transition:box-shadow .16s ease,transform .16s ease; }
    .partidas-jurisdiction-card:hover,.partidas-jurisdiction-card:focus-visible,.partidas-type-card:hover,.partidas-type-card:focus-visible { box-shadow:0 0 0 3px var(--focus-ring),0 8px 20px var(--shadow-strong);transform:translateY(-3px);outline:none; }
    .partidas-jurisdiction-card.is-selected { box-shadow:0 0 0 4px var(--cyan),0 8px 20px var(--shadow-strong); }
    .partidas-jurisdiction-media,.partidas-type-media { position:relative;display:flex;width:100%;height:66%;flex:0 0 66%;align-items:center;justify-content:center;overflow:hidden; }
    .partidas-jurisdiction-media { padding:14px;text-align:center;font-weight:750;line-height:1.12; }
    .partidas-jurisdiction-media span { max-width:120px;padding:8px 9px;color:#fff;background:rgba(8,42,71,.52);border:1px solid rgba(255,255,255,.72);border-radius:8px;text-shadow:0 1px 3px rgba(0,0,0,.28); }
    .partidas-jurisdiction-media-pba { background:linear-gradient(145deg,#1d8fe1 0%,#40bdf5 48%,#0b5c98 100%); }
    .partidas-jurisdiction-media-caba { background:linear-gradient(145deg,#08a9b7 0%,#3ccfd0 45%,#176a91 100%); }
    .partidas-jurisdiction-card .catalog-card-info,.partidas-type-card .catalog-card-info { position:relative;z-index:3;display:flex;flex:0 0 34%;flex-direction:column;justify-content:center;min-height:0;padding:8px 10px;overflow:hidden;text-align:left;background:var(--navy-deep); }
    .partidas-type-section { margin-top:30px; }
    .partidas-type-heading { margin:0 0 13px;text-align:center; }
    .partidas-type-heading h2 { margin:0 0 3px;color:var(--navy-deep);font-size:1.1rem; }
    .partidas-type-heading p { margin:0;color:var(--text-muted);font-size:.9rem; }
    .partidas-type-grid { display:grid;grid-template-columns:repeat(4,154px);justify-content:center;gap:14px;align-items:stretch; }
    .partidas-type-media { padding:20px; }
    .partidas-type-media img { display:block;width:72px;height:72px;object-fit:contain; }
    .partidas-type-birth .partidas-type-media { background:linear-gradient(145deg,#e7f6ff,#bde8ff); }
    .partidas-type-marriage .partidas-type-media { background:linear-gradient(145deg,#fff1f3,#ffd6dd); }
    .partidas-type-cohabitation .partidas-type-media { background:linear-gradient(145deg,#eefaf2,#ccefd7); }
    .partidas-type-death .partidas-type-media { background:linear-gradient(145deg,#f4efff,#dfd2fb); }
    .partidas-type-card.is-unavailable { cursor:default;filter:saturate(.65);opacity:.68; }
    .partidas-type-card.is-unavailable:hover,.partidas-type-card.is-unavailable:focus-visible { box-shadow:0 5px 16px var(--shadow-soft);transform:none; }
    .partidas-caba-note { max-width:650px;margin:0 auto 14px;padding:9px 12px;color:var(--navy-deep);background:#fff7eb;border:1px solid #efc57c;border-radius:8px;font-size:.82rem;line-height:1.35;text-align:center; }
    @media(max-width:760px){.partidas-type-grid{grid-template-columns:repeat(2,minmax(0,154px))}.partidas-jurisdiction-grid{grid-template-columns:repeat(2,minmax(0,154px))}}
    @media(max-width:390px){.partidas-jurisdiction-grid,.partidas-type-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.partidas-jurisdiction-card,.partidas-type-card{width:100%}}
'''
if css_marker not in index_text:
    raise SystemExit('No se encontró el marcador CSS en index.html')
index_text = index_text.replace(css_marker, css + css_marker, 1)

# 7) Cache bust del frontend público.
index_text = index_text.replace('20260906-2215', '20260907-0505')

app.write_text(app_text, encoding='utf-8')
services.write_text(services_text, encoding='utf-8')
index.write_text(index_text, encoding='utf-8')

# La tarea se elimina a sí misma para no dejar herramientas temporales en el repo.
for temp in [root / '.github/workflows/partidas-selector-upgrade.yml', root / 'scripts/upgrade_partidas_selector.py']:
    if temp.exists():
        temp.unlink()

print('Partidas: selector PBA/CABA y cuatro tipos preparado correctamente.')
