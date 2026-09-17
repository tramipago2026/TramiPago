# Auditoría factual: recorrido municipal y catálogo — 17/09/2026

## Alcance y error de la auditoría previa

La auditoría de referencias locales certificaba existencia de archivos, pero no verificaba si las promociones llegaban a una prestación concreta o si las categorías visibles estaban presentes en «Todos los trámites». Por eso pasó por alto la publicidad municipal: `promos.js` abría un WhatsApp genérico, `services.js` no definía servicios/familia municipales, `catalog-search.js` no indexaba municipales y `tramites.html` los omitía. Otro hallazgo al revisar el listado: faltaban las familias Legalizaciones y Apostillas, y Atención de Abogado. Cero referencias rotas NO implica cero fallas funcionales ni comerciales.

## Correcciones aplicadas

1. `municipales.html`: sección específica, móvil y escritorio, que distingue San Miguel de José C. Paz. Los enlaces oficiales y las consultas por WhatsApp son separados. No hay formularios de pago ni pretensión de ser un municipio.
2. `promos.js`: la publicidad municipal ahora navega a `municipales.html`. Entrada municipal destacada al final del inicio con la imagen preexistente `assets/promo-municipal-20260911.webp`; se mantienen las nueve tarjetas originales y su grilla 3×3.
3. `catalog-search.js`: «municipal», «San Miguel», «José C. Paz», «tasas», etc., recuperan la nueva categoría.
4. `tramites.html`: listado y pie enlazan Municipales; se añadieron también Legalizaciones y Abogado, dos familias preexistentes pero omitidas.
5. `tests/municipal-route.mjs` y `.github/workflows/site-integrity.yml`: la CI ahora comprueba la secuencia publicidad → página municipal, tarjeta destacada → página, buscador → página y «Todos los trámites» → página; además comprueba los enlaces a Legalizaciones y Abogado, presencia de municipios, textos diferenciados de WhatsApp, archivos locales y avisos de disponibilidad. Sigue siendo prueba estática.

## Comprobación de alcance de los organismos

- San Miguel: su guía pública del portal de autogestión señala consultas/boletas y pagos en `https://pagos.msm.gov.ar/`; para ciertas gestiones como planes de pago se requiere sesión. Fuente: `https://www.msm.gov.ar/portal-de-autogestion-tutorial/`.
- José C. Paz: la guía oficial `https://josecpaz.gob.ar/tramites/guia-de-tramites/` señala los pagos web como «Próximamente». No se ha comprobado desde esta auditoría una función web completa para obtener una boleta. Se enlaza al sitio `https://josecpaz.gob.ar/` y se ofrece CONSULTA de disponibilidad, no una gestión ficticia.
- No confundir José C. Paz, Buenos Aires, con Villa Carlos Paz, Córdoba: páginas cuyos dominios incluyen `cpaz` pueden ser de otro municipio.

## Comprobación automatizada

CI para commit `934001d1d9de192cf7196f50cde53bd8a5ae8e12`: 76 archivos inspeccionados, 198 referencias estáticas, 0 errores; prueba municipal PASS. Se ampliaron posteriormente los casos de la prueba para evitar omisiones de Legalizaciones y Abogado. El resultado del commit más reciente debe comprobarse en GitHub Actions; la auditoría estática no demuestra el funcionamiento del portal oficial, disponibilidad de trámites, pago o emisión documental.

## Pendientes, no declarar completados

1. Municipio José C. Paz: verificar con Rentas cuáles gestiones se pueden ejecutar, condiciones, requisitos, entrega y costos. No activar una compra ni prometer boletas hasta comprobarlo.
2. Municipal: la nueva sección es navegación, orientación y consulta; no hay solicitud propia respaldada por Supabase, tarifa aprobada, cobro ni código de seguimiento municipal. No debe presentarse como circuito completo.
3. Visual/navegación: comprobar en navegador el carrusel y todas las rutas de escritorio/móvil, contraste, enlaces exteriores, WhatsApp y visualización de imágenes; el test CI no lo hace.
4. Otra discrepancia comercial detectada: la imagen aprobada del carrusel de Apostillado y Legalizaciones dice «9 gestiones documentales online», pero `extra-families.js` configura solamente **dos** servicios concretos en esa familia (`legalizaciones` y `apostilla-tad`). No presentar nueve gestiones como habilitadas hasta tener catálogo, requisitos, rutas, precios y confirmación de las otras siete o rectificar el texto publicitario con aprobación de la imagen.
5. Revisar sistemáticamente el resto de promociones con un test de ruta/destino y comparar todos los enlaces de inicio, búsqueda, listado y pie con el catálogo real; revisar flujos completos y no solo presencia de archivos.

## Criterio para las próximas auditorías

Separar en informes distintos: (a) archivo existe, (b) recurso carga, (c) botón navega al destino que promete, (d) destino permite solicitar efectivamente el servicio, (e) precio/requisitos coinciden con la base de datos y el organismo, (f) entrega y seguimiento fueron probados. No asignar (d)–(f) a partir de resultados (a)–(c). No subir imágenes nuevas sin aprobación.