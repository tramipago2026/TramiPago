# Rectificación de auditoría de enlaces, diseño y formularios — 21/09/2026

## Motivo de rectificación

La auditoría previa no debió declararse completa: verificar que una ficha se renderiza y que el enlace existe NO comprueba que el botón sea visible ni que el diseño aprobado esté respetado. La captura del propietario del sitio publicado `#/familia/legalizaciones-apostillas` mostró los dos CTA ausentes y bordes muy tenues. Revisado el código, la última regla de `legalizaciones-fotos-20260918.css` daba a los CTA `position:absolute;inset:0;width:100%;height:100%;border:0;opacity:0`, ocultándolos y convirtiéndolos en superficies invisibles. Los bordes de tarjeta eran `1px solid #c4d8e6`, no carbón visible.

## Cambios estrictamente acotados EN RAMA DE PRUEBA

1. `legalizaciones-fotos-20260918.css`: únicamente Legalizaciones y Apostillado: restaura el CTA nativo y visible «Elegí trámite», verde y borde negro, 46 px; restaura contorno carbón de 2 px en las tarjetas. Mantiene las fotografías, tamaños, títulos, descripciones, precios y rutas. No modifica familias restantes, cabecera o pie.
2. `site-fixes.js`: detecta el texto «Archivo máximo:» existente y no añade una segunda copia en campos PDF. Mantiene la ayuda de optimización para imágenes y el límite de archivos en `app.js`.
3. Versionado específico de CSS en `site.css` e `index.html`, y versión de `site-fixes.js` en `index.html` para que cuando se publique con aprobación no se reutilicen por caché los estilos antiguos que ocultaban botones.
4. Conservación de correcciones solo en `work/tramipago-v1-audit-20260920`; **NO se actualizó `main`, GitHub Pages ni Supabase**. La captura de la web publicada seguirá mostrando el defecto hasta publicación autorizada.

## Evidencias y alcance preciso

- [Chromium — 23 fichas PC y 23 móvil, WhatsApp contextual, cinco familias, 26 clics por botones de servicios en total, incluidas ambas tarjetas de Legalizaciones/Apostillado, formularios y capturas](https://github.com/tramipago2026/TramiPago/actions/runs/35573069199). De la inspección de DOM: cada CTA tiene `opacity:1`, `display:flex`, altura 46 px, borde negro; cada tarjeta tiene borde carbón 2 px. Sin desbordamiento horizontal en las diez capturas de familias; los cuatro temas de abogado y los cuatro tipos de Partidas se comprobaron. `v1-new-links-design.json` y 16 capturas disponibles en el artefacto del workflow. Las imágenes remotas se bloquearon para no usar terceros durante el test; las capturas enseñan ilustraciones locales de respaldo, NO certifican carga de fotografías externas.
- [Repetición posterior al arreglo de caché y aviso duplicado](https://github.com/tramipago2026/TramiPago/actions/runs/35573506830): los tres pasos de navegador aprobaron — 23 fichas + WhatsApp, CTA/bordes/clics + cinco familias/formularios PC/móvil, y exactamente un aviso «Archivo máximo» en cada uno de los dos formularios en ambas pantallas. No se presentaron formularios ni se enviaron mensajes reales.
- La imagen principal de la tarjeta «Legalizaciones y Apostillas» en Inicio **sigue repitiendo la de «Partidas»**, hallazgo de la auditoría anterior que requiere fotografía editorial propia aprobada; no sustituirla sin referencia visual válida. El texto de Informe Vehicular aparece abreviado en el inicio; no cambiarlo a ciegas. En pruebas sin Internet, la fotografía municipal de origen externo tampoco puede verificarse. El funcionamiento de URLs oficiales externas no se comprobó.

## Pendientes explícitos — bloquear afirmación «sitio terminado»

- Verificación en GitHub Pages después de publicación aprobada, con red e imágenes externas habilitadas, en PC y móvil.
- Formularios: se comprobó renderizado, campos, consentimiento y destino al pulsar las tarjetas nuevas, pero NO llenado y envío de todos los pasos ni recepción en Supabase, flujo de pagos, acreditación bancaria, panel o descarga de resultados.
- WhatsApp: los enlaces preparan un borrador; no se verificó recepción ni se programó envío automático al administrador.
- Revisar con capturas reales completas la portada duplicada, otras familias y todos los estados posteriores (pago, confirmación, revisión, finalizado), y no modificar lo ya aprobado fuera de defectos detectados.

**Estado correcto: defecto visible corregido y prueba aislada APROBADA; sitio publicado y operación extremo a extremo PENDIENTES.**
