from pathlib import Path

path = Path("index.html")
text = path.read_text(encoding="utf-8")

old_services = 'services.js?v=20260912-payment1'
new_services = 'services.js?v=20260914-partidas-flow1'
old_app = 'app.js?v=20260911-home-without-search'
new_app = 'app.js?v=20260914-partidas-flow1'
old_selected = '.partidas-jurisdiction-card.is-selected { box-shadow:0 0 0 4px var(--cyan),0 8px 20px var(--shadow-strong); }'
new_selected = '.partidas-jurisdiction-card.is-selected,.partidas-type-card.is-selected { box-shadow:0 0 0 4px var(--cyan),0 8px 20px var(--shadow-strong); }'

assert old_services in text, "services cache token not found"
assert old_app in text, "app cache token not found"
assert old_selected in text, "selected-card CSS not found"

text = text.replace(old_services, new_services, 1)
text = text.replace(old_app, new_app, 1)
text = text.replace(old_selected, new_selected, 1)
path.write_text(text, encoding="utf-8")

for cleanup in [Path('.github/workflows/one-time-partidas-cache.yml'), Path('.github/patch-partidas-cache.py')]:
    if cleanup.exists():
        cleanup.unlink()
