# Auditoría y unificación del frente — 20/09/2026

Referencia aprobada: encabezado de Inicio (`index.html`, completado por `header-fijo-20260917.js`) y pie de `footer-menu.js`.

## Diferencias detectadas antes de la corrección

| Página | Cabecera anterior | Pie anterior |
|---|---|---|
| `arrepentimiento.html` | `<header class="barra">` | `<footer class="legal-footer">` |
| `baja-servicio.html` | `<header class="barra">` | `<footer class="legal-footer">` |
| `contacto.html` | `<header class="top">` | `<footer class="footer">` |
| `municipales.html` | `<header class="tp-header">` | `<footer class="tp-footer" aria-label="Enlaces y condiciones de TramiPago">` |
| `opiniones.html` | `<header class="top">` | `<footer class="footer">` |
| `politica-privacidad.html` | `<header class="barra">` | `<footer class="legal-footer">` |
| `terminos-condiciones.html` | `<header class="barra">` | `<footer class="legal-footer">` |
| `tramites.html` | `<header class="top">` | `<footer class="footer">` |

## Cambios comprobados

- 8 páginas HTML públicas independientes corregidas; `index.html` y el área administrativa quedaron intactos.
- Todas las páginas corregidas contienen el mismo encabezado HTML y el mismo pie HTML, derivados de las fuentes de Inicio.
- Cabecera: logo, abogado con imagen, eslogan, Inicio, Estado y Ayuda, con los mismos íconos y CSS de navegación de la portada.
- Pie: las mismas cuatro columnas, políticas, términos, arrepentimiento, baja, Defensa del Consumidor y datos de contacto.
- Se eliminaron solo dos barras legales redundantes (Contacto y Opiniones).
- El contenido dentro de `<main>`, incluidos los formularios municipales y legales, es idéntico antes y después.
- Las rutas SPA de partidas PBA/CABA, ARCA, apostillas y otras familias usan `index.html`: no había que duplicarles cabeceras.
- Se conserva el enlace desde las tarjetas, catálogos y carruseles a sus destinos originales.
- 192 referencias de enlaces locales comprobadas, 0 archivos de destino inexistentes.

## Alcance de las pruebas

Verificación estática del HTML, CSS, enlaces locales y pruebas Node existentes. No equivale a inspección visual en diferentes navegadores ni a completar formularios reales.
