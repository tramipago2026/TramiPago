# TramiPago — comparación de frameworks y adaptación al proyecto existente
Fecha: 21/09/2026. Estado: análisis y ajustes probados **en rama de trabajo**, no cierre del servicio comercial.

## Base examinada
El sitio público está construido con HTML, CSS y JavaScript tradicionales; usa navegación mediante `#/`, configuración de servicios compartida, GitHub Pages y un backend separado en Supabase. No hay `package.json` ni build de Vite/Astro/React en el árbol inspeccionado. Sus estilos están estratificados (`site-base.css`, `ui-base.css`, `site.css`, `legalizaciones-fotos-20260918.css`); algunos `!important` finales anularon decisiones anteriores. Por eso, cambiar el runtime sin estabilizar las reglas CSS causaría regresiones.

## Comparación aplicada a ESTE código
| Tecnología o enfoque | Posible incorporación | Coste/riesgo en la versión actual | Decisión de integración |
|---|---|---|---|
| React / Next.js | Componentes y render interactivo | Rehacer `app.js`, rutas y sincronización; Next.js SSR necesitaría hosting distinto a Pages para funciones de servidor | No introducir en la web publicada; no corrige el defecto detectado. |
| Vue / Svelte | Componentes reactivos aislados o migración de SPA | Reescritura del estado y la renderización; duplicación temporal de lógica | No migrar sin pruebas equivalentes de todos los flujos. |
| Astro | HTML estático y pequeñas islas interactivas | Mover vistas y rutas actuales y configurar build/base path; migración dirigida más adelante | Evaluar en una rama separada, no reemplazar ahora. |
| Lit / Web Components | Adoptar por componente sin sustituir el sitio entero | Es compatible con HTML, pero requiere un componente real y pruebas antes de incluir dependencia | Camino de incorporación incremental para módulos nuevos; **no se añadió dependencia innecesaria**. |
| Vite | Servidor de desarrollo y empaquetado | Requiere configurar rutas, `@import`, recursos y base `/TramiPago/` antes de cambiar despliegue | No cambiar la publicación estable sin un build validado. |
| Playwright + contratos CSS/DOM | Probar interfaz renderizada, rutas, campos y clics en PC/móvil | Se ejecuta en CI sin reescribir el sitio | **Integrado:** se extendió el test existente para detectar botones transparentes, bordes incorrectos y errores de navegación. |

Documentación técnica consultada: https://docs.astro.build/en/concepts/islands/ ; https://docs.astro.build/en/guides/migrate-to-astro/ ; https://lit.dev/docs/tools/adding-lit/ ; https://github.com/vitejs/vite/blob/main/docs/guide/build.md .

## Adaptaciones efectuadas
1. Mantener una sola aplicación y los identificadores de rutas/servicios existentes.
2. Restaurar botones visibles y bordes oscuros **exclusivamente** en las dos tarjetas de Legalizaciones y Apostillado, sin cambiar imágenes, títulos, montos, tamaños ni cabecera/pie.
3. Evitar duplicar el aviso de límite de PDF únicamente cuando el formulario ya lo proporciona.
4. Renovar versión de recursos CSS/JS modificados para evitar que una versión publicada conserve CSS antiguo en caché.
5. Añadir pruebas de navegador al flujo de GitHub Actions: 46 rutas iniciales (23 PC y 23 móvil), cinco familias por tamaño, 26 clics y comprobación de CTA/borde y aviso PDF único. Se prueban solo navegación y presentación con conexiones externas bloqueadas: no equivalen a pruebas transaccionales de Supabase.

## Alcance y pendientes verificables
- **Probado:** navegación local, formularios iniciales, botones visiblemente renderizados, contornos y ausencia de desbordamiento en pantallas auditadas. Consultar `audits/rectificacion-enlaces-diseno-formularios-20260921.md` y los registros de CI.
- **No probado:** persistencia real, MFA, pagos, archivos, webhook/notificaciones, revisión de aranceles y seguimiento desde otro equipo. No inventar una aprobación.
- **Diseño editorial pendiente:** fotografía compartida entre Partidas y Legalizaciones en la portada, que necesita sustitución por foto aprobada; no cambiarla arbitrariamente.
- **Integración/publicación:** mantener fuera de `main` las modificaciones amplias pendientes del PR #3. Publicar solo parches acotados comprobados con aprobación explícita, verificar GitHub Pages y generar ZIP exactamente del commit final.

Criterio rector: incorporar prácticas de los frameworks modernos (componentes aislados, design contracts y pruebas reales) sobre el sitio existente; no instalar un framework por nombre ni rehacer partes aprobadas.