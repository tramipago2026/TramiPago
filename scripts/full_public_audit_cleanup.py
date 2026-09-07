from pathlib import Path
import hashlib
import re
import shutil
import sys
from urllib.parse import urlsplit

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
VERSION = "20260906-2215"


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


def write(path, text):
    (ROOT / path).write_text(text, encoding="utf-8")


def replace_required(text, old, new, label):
    if old not in text:
        raise RuntimeError(f"No se encontró el patrón requerido: {label}")
    return text.replace(old, new)


print("[1/8] Generando imagen limpia de Asistencia Digital")
source = ROOT / "assets/asistencia-digital-v1.webp"
if not source.exists():
    raise RuntimeError("Falta assets/asistencia-digital-v1.webp, fuente necesaria para reconstruir la tarjeta")
with Image.open(source) as img:
    img = img.convert("RGB")
    # La parte inferior del archivo viejo contiene un título incrustado que duplicaba
    # el título HTML de la tarjeta. Conservamos solo la escena visual superior.
    crop_h = round(img.height * 0.70)
    crop = img.crop((0, 0, img.width, crop_h))
    canvas = Image.new("RGB", (600, 495), (0, 0, 0))
    fitted = ImageOps.contain(crop, (560, 455), method=Image.Resampling.LANCZOS)
    x = (canvas.width - fitted.width) // 2
    y = (canvas.height - fitted.height) // 2
    canvas.paste(fitted, (x, y))
    target = ROOT / "assets/asistencia-digital-v3.webp"
    canvas.save(target, "WEBP", quality=90, method=6)
raw = target.read_bytes()
if not (raw[:4] == b"RIFF" and raw[8:12] == b"WEBP"):
    raise RuntimeError("La nueva imagen de Asistencia Digital no es un WebP válido")

print("[2/8] Actualizando catálogo, separación y rutas")
index = read("index.html")
index = replace_required(
    index,
    ".home-family-row { grid-template-columns: repeat(3, 154px); }",
    ".home-family-row { grid-template-columns: repeat(3, 154px); margin-top:32px; }",
    "separación entre filas del catálogo",
)
write("index.html", index)

services = read("services.js")
services = services.replace('image: "assets/arca-v3.webp"', 'image: "assets/arca-familia-final.webp"')
if 'image: "assets/asistencia-digital-v2.webp"' in services:
    services = services.replace('image: "assets/asistencia-digital-v2.webp"', 'image: "assets/asistencia-digital-v3.webp"')
elif 'image: "assets/asistencia-digital-v1.webp"' in services:
    services = services.replace('image: "assets/asistencia-digital-v1.webp"', 'image: "assets/asistencia-digital-v3.webp"')
elif 'image: "assets/asistencia-digital-v3.webp"' not in services:
    raise RuntimeError("No se encontró la imagen configurada de Asistencia Digital")
write("services.js", services)

footer = read("footer-menu.js")
footer = footer.replace('href="#/', 'href="index.html#/')
write("footer-menu.js", footer)

# En páginas HTML independientes, un hash #/tramite/... apuntaba a esa misma
# página estática y no al router del inicio. Se normaliza a index.html#/...
for html in ROOT.glob("*.html"):
    text = html.read_text(encoding="utf-8")
    if html.name != "index.html":
        text = text.replace('href="#/', 'href="index.html#/')
    text = re.sub(r"v=\d{8}-\d{4}", f"v={VERSION}", text)
    html.write_text(text, encoding="utf-8")

# El index también fuerza recursos JS/CSS nuevos para cortar cachés viejas.
index = read("index.html")
index = re.sub(r"v=\d{8}-\d{4}", f"v={VERSION}", index)
write("index.html", index)

print("[3/8] Eliminando archivos obsoletos y temporales confirmados")
obsolete_files = [
    "index-viejo.html",
    "assets/arca-v3.webp",
    "assets/arca-familia-v8.webp",
    "assets/arca-familia-v9.webp",
    "assets/asistencia-digital-v1.webp",
    "assets/asistencia-digital-v2.webp",
    "assets/partidas-pba-v4.svg",
    "assets/partidas-turnos-v3.webp",
    "assets/qr-tramipago-ok.svg",
]
for rel in obsolete_files:
    path = ROOT / rel
    if path.exists():
        path.unlink()
        print("  eliminado:", rel)

tmp = ROOT / "tmp-assets"
if tmp.exists():
    shutil.rmtree(tmp)
    print("  eliminado: tmp-assets/")

print("[4/8] Validando referencias locales de HTML")
errors = []
link_re = re.compile(r'''(?:href|src)\s*=\s*["']([^"']+)["']''', re.I)
for html in ROOT.glob("*.html"):
    text = html.read_text(encoding="utf-8")
    for ref in link_re.findall(text):
        ref = ref.strip()
        if not ref or ref.startswith(("#", "http://", "https://", "mailto:", "tel:", "javascript:", "data:")):
            continue
        path_part = ref.split("#", 1)[0].split("?", 1)[0]
        if not path_part:
            continue
        candidate = (html.parent / path_part).resolve()
        try:
            candidate.relative_to(ROOT.resolve())
        except ValueError:
            errors.append(f"{html.name}: referencia fuera del sitio: {ref}")
            continue
        if not candidate.exists():
            errors.append(f"{html.name}: archivo inexistente: {ref}")

print("[5/8] Validando assets referenciados por JS/CSS/HTML")
asset_re = re.compile(r'''["'(]((?:assets)/[A-Za-z0-9_.\-/]+)''')
for file in list(ROOT.glob("*.js")) + list(ROOT.glob("*.css")) + list(ROOT.glob("*.html")):
    text = file.read_text(encoding="utf-8")
    for ref in set(asset_re.findall(text)):
        if not (ROOT / ref).exists():
            errors.append(f"{file.name}: asset inexistente: {ref}")

print("[6/8] Validando datos críticos y residuos viejos")
text_files = [p for p in ROOT.rglob("*") if p.is_file() and p.suffix.lower() in {".html", ".js", ".css", ".md"}]
joined = "\n".join(p.read_text(encoding="utf-8", errors="ignore") for p in text_files)
for forbidden in [
    "2559-7743",
    "assets/asistencia-digital-v1.webp",
    "assets/asistencia-digital-v2.webp",
    "assets/arca-v3.webp",
    "assets/arca-familia-v8.webp",
    "assets/arca-familia-v9.webp",
    "qr-tramipago-ok.svg",
]:
    if forbidden in joined:
        errors.append(f"Referencia obsoleta todavía presente: {forbidden}")

required_pages = [
    "index.html",
    "tramites.html",
    "contacto.html",
    "opiniones.html",
    "politica-privacidad.html",
    "terminos-condiciones.html",
    "arrepentimiento.html",
    "baja-servicio.html",
]
for page in required_pages:
    if not (ROOT / page).exists():
        errors.append(f"Página pública faltante: {page}")

# Todos los links hash del menú compartido deben apuntar explícitamente al router del inicio.
footer_now = read("footer-menu.js")
if 'href="#/' in footer_now:
    errors.append("footer-menu.js conserva rutas hash relativas que se rompen desde páginas internas")

# La imagen nueva debe ser la única imagen de Asistencia Digital configurada.
if 'assets/asistencia-digital-v3.webp' not in read("services.js"):
    errors.append("services.js no apunta a asistencia-digital-v3.webp")

# La separación pedida debe quedar efectiva en el CSS embebido del inicio.
if "margin-top:32px" not in read("index.html"):
    errors.append("No quedó aplicada la separación de 32 px entre filas")

print("[7/8] Buscando duplicados binarios restantes")
hashes = {}
for asset in (ROOT / "assets").glob("*"):
    if not asset.is_file():
        continue
    digest = hashlib.sha256(asset.read_bytes()).hexdigest()
    hashes.setdefault(digest, []).append(asset.name)
for names in hashes.values():
    if len(names) > 1:
        print("  duplicados conservados para revisión:", ", ".join(sorted(names)))

if errors:
    print("\nAUDITORÍA FALLIDA")
    for error in errors:
        print(" -", error)
    sys.exit(1)

print("[8/8] Auditoría estática OK; retirando archivos temporales de esta auditoría")
for rel in ["scripts/full_public_audit_cleanup.py", ".github/workflows/full-public-audit-cleanup.yml"]:
    path = ROOT / rel
    if path.exists():
        path.unlink()
for directory in [ROOT / "scripts", ROOT / ".github" / "workflows", ROOT / ".github"]:
    try:
        directory.rmdir()
    except OSError:
        pass

print("AUDITORÍA OK")
