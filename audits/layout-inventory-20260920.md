# Inventario de cabeceras y pies - 2026-09-20

HTML en raíz: 10

| Página | Header | Footer | Abogado | Inicio/Estado/Ayuda | Arrepentimiento/Baja |
|---|---|---|---|---|---|
| admin.html | <header class="top"> | NINGUNO | no | no | no |
| arrepentimiento.html | <header class="barra"> | <footer class="legal-footer"> | no | no | sí |
| baja-servicio.html | <header class="barra"> | <footer class="legal-footer"> | no | no | sí |
| contacto.html | <header class="top"> | <footer class="footer"> | no | sí | sí |
| index.html | <header class="site-header"> | <footer class="site-footer"> | no | sí | no |
| municipales.html | <header class="tp-header"> | <footer class="tp-footer" aria-label="Enlaces y condiciones de TramiPago"> | sí | sí | sí |
| opiniones.html | <header class="top"> | <footer class="footer"> | no | no | sí |
| politica-privacidad.html | <header class="barra"> | <footer class="legal-footer"> | no | no | sí |
| terminos-condiciones.html | <header class="barra"> | <footer class="legal-footer"> | no | no | sí |
| tramites.html | <header class="top"> | <footer class="footer"> | no | sí | sí |

## Rutas internas directas identificadas

- `contacto.html`
- `index.html`
- `index.html#/`
- `index.html#/familia/arca-monotributo`
- `index.html#/familia/atencion-abogado`
- `index.html#/familia/legalizaciones-apostillas`
- `index.html#/familia/partidas-pba`
- `index.html#/seguimiento`
- `index.html#/tramite/antecedentes-penales`
- `index.html#/tramite/arba-inmobiliario`
- `index.html#/tramite/asistencia-digital`
- `index.html#/tramite/constancias-anses`
- `index.html#/tramite/informe-vehicular`
- `municipales.html`
- `tramites.html`
- `tramites.html#como-funciona`

## Criterio

La portada index.html es la referencia visual. Sus rutas SPA comparten un único header/footer, pero las páginas HTML independientes no necesariamente lo comparten. Las páginas administrativas requieren revisión aparte.
