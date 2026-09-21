# Auditoría visual en Chromium — TramiPago V1 — 20/09/2026

## Prueba y evidencia

GitHub Actions run https://github.com/tramipago2026/TramiPago/actions/runs/35544684807 completó con éxito. El script `tests/v1-browser-visual.mjs` montó exclusivamente el checkout de la rama de trabajo en `127.0.0.1`, bloqueó solicitudes externas, recorrió las 23 rutas de formularios sin enviarlos y capturó seis pantallas en Chromium: inicio, Legalizaciones/Apostillas y Partidas, en 1440×900 y 390×844. Capturas y `resultado.json`: https://github.com/tramipago2026/TramiPago/actions/runs/35544684807/artifacts/10616710601 (retención declarada por GitHub: 14 días). Se inspeccionaron los PNG descargados y los datos de geometría.

## Hechos verificados

- Las 23 rutas `#/tramite/<id>` mostraron su formulario inicial. El test NO completó ni envió ninguno, ni navegó sus pasos posteriores.
- Las ocho tarjetas de trámites/familias visibles en inicio miden 154 × 192,5 px tanto en PC como móvil, usan la misma fuente calculada (Segoe UI/Arial) y sus imágenes cargaron. La novena entrada de abogado no tiene caja de tarjeta porque no se muestra en esa fila; en las capturas se ve destacada en la cabecera. Esto es deliberada ubicación separada, no tarjeta rota.
- No hubo error JavaScript de página capturado ni desbordamiento horizontal en las seis pantallas medidas (ancho documento = ancho viewport, 1440/390). El test indicó 0 avisos automáticos; esto NO equivale a aprobación estética.
- En PC y móvil, la tarjeta «Legalizaciones y Apostillas» repite exactamente la misma fotografía de la tarjeta «Partidas», confirmado por `resultado.json` y por inspección visual de ambas capturas. Esta es una inconsistencia editorial clara en la tarjeta nueva, no un error de tamaño CSS.
- En la página de la familia Legalizaciones/Apostillas, los iconos/ilustraciones de las dos subtarjetas se ven diferentes entre sí pero tienen tarjetas homogéneas dentro de esa página y alineación estable en la captura. No están probadas a escala contra todas las otras familias; no declararlas uniformes globalmente.
- La captura de PC del inicio muestra una descripción abreviada de Informe Vehicular («Infracciones + ...»). No se determina aún si es una preferencia de diseño aprobada o truncamiento a corregir: revisar la regla de clamping y la aprobación del propietario antes de cambiar texto/tipografía.
- En móvil la estructura se apila correctamente y conserva cabecera/pie. El recurso HTML `.family-page img` para Legalizaciones/Apostillas reporta caja de 0×0 en móvil, aunque el encabezado en la captura muestra un icono renderizado por otro elemento: verificar CSS para distinguir ocultación responsive intencional de falta de contenido, NO marcar imagen rota sin evidencia.

## Bloqueos

1. Reemplazar únicamente la fotografía editorial repetida de la familia Legalizaciones/Apostillas, preservando tamaño de tarjeta, tipografía y CSS; requiere identificar imagen adecuada y revisión visual. No sustituir por cualquier vector improvisado.
2. Repetir capturas completas después de cualquier cambio gráfico; verificar todos los submenús/familias y los estados posteriores de formularios (esta ejecución no los captura).
3. Auditar contraste, accesibilidad, truncamiento y comportamiento de hover en recorrido completo. Las capturas actuales muestran solo seis pantallas iniciales.
4. Pruebas E2E reales de registro Supabase, archivos, pago, notificación y panel no fueron realizadas; el navegador bloqueó expresamente todas las API externas.

**Estado de diseño:** medidas base de ocho tarjetas y ausencia de overflow en pantallas seleccionadas comprobadas; homogeneidad global pendiente; imagen repetida detectada y todavía sin corregir. Ningún cambio en `main` o sitio publicado.
