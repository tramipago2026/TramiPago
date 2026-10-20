# TramiPago V2 — Auditoría SEO técnica en staging

**Fecha:** 20/10/2026. **Alcance:** rama oficial `v2/opcion-c-directiva13`, carpeta `v2/`, código estático y CI. No modificar `main`, dominio V1 ni indexación de producción.

## Hechos comprobados

- El test `v2/tests/seo-staging.test.mjs` recorre **142 páginas HTML** de V2.
- Todas superan las verificaciones de `lang="es-AR"`, `<title>`, viewport responsive y la directiva **`noindex`** adecuada para staging.
- **142/142 páginas** carecen de `<meta name="description">`. Hay **5 títulos repetidos** entre las páginas analizadas. Son oportunidades de optimización futura, no defectos de la publicación staging.
- Portada, catálogo, buscador, admin y términos se revisaron por separado: tienen `noindex`. No hay `v2/robots.txt` ni `v2/sitemap.xml` en la rama.
- La configuración actual de `noindex` no se debe quitar para staging. No se ha habilitado SEO productivo ni publicado V2 en el dominio principal.
- CONTROL 4 y controles visuales de V2 staging ya aportan evidencia de navegación y adaptación a distintos dispositivos. Esto no sustituye medir Core Web Vitals con tráfico real ni comprobar Search Console del entorno futuro.

## Tareas condicionadas al futuro lanzamiento (no ejecutar ahora)

1. Confirmar dominio definitivo, reglas canónicas, rutas y estrategia de convivencia/corte con V1, únicamente bajo autorización productiva específica.
2. Revisar y aprobar contenido de metadescripciones y títulos singulares por tipo de página, preservando precios, derechos y estructura visual aprobada.
3. Generar un sitemap de páginas públicas aprobadas y mantener Admin, confirmaciones y áreas privadas excluidas de la indexación.
4. Verificar robots/canonicals/redirecciones solo en el entorno final autorizado. En particular, evitar que staging, páginas de datos personales y documentos privados se indexen.
5. Medir rendimiento real, accesibilidad e indexación con fuente válida y CONTROL 3 sobre el SHA servido tras publicación aprobada.

**Resultado de la auditoría técnica:** el aislamiento SEO de staging está **CONFIRMADO** por CI. La optimización y publicación SEO productiva queda **PENDIENTE DE FASE**, no es un error crítico actual que bloquea el uso de staging.
