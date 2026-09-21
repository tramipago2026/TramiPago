# TramiPago V1 — auditoría de ejecución, 20/09/2026

> **ACTUALIZACIÓN DE CIERRE PARCIAL.** El informe de vínculos y WhatsApp vigente es [`tramipago-v1-enlaces-whatsapp-20260920.md`](tramipago-v1-enlaces-whatsapp-20260920.md). Sus 23 accesos y 181 enlaces internos pasaron prueba estática; Chromium comprobó 23 formularios en PC y 23 en móvil, las tarjetas directas, Partidas, los cuatro temas de abogado y ejemplos ficticios de estado pendiente/finalizado. **La auditoría de enlaces está terminada SOLO en rama; la operación comercial, publicación y seguridad E2E siguen pendientes.** Se descartó el borrador de correo: jamás se desplegó ni fue enviado. La asistencia aprobada es WhatsApp con borrador contextual que requiere pulsar Enviar; no existe notificación automática de WhatsApp. No se modificó `main` ni Supabase.

## Directivas invariables
TramiPago está en construcción y no registrado. No contratar dominio/hosting pagos hasta que el circuito esté terminado y comprobado. Honorarios por gestión fijados por propietario, independientes de tasas oficiales; NO publicar importes oficiales. Mantener acceso admin sin segundo factor durante desarrollo, con identidad y membresía, sin cambiarlo por iniciativa del auditor. No reescribir términos, privacidad, arrepentimiento, baja, diseño, imágenes o botones aprobados sin falla comprobada. No cambiar `main`, Supabase ni sitio publicado antes de permiso expreso.

## Inventario comprobado en código
23 servicios habilitados EN CATÁLOGO, lo cual NO significa 23 circuitos probados. Cinco familias, cuatro tarjetas directas.

**18 circuitos con pago:** Antecedentes Penales; Informe Vehicular; Constancias ANSES; ARBA/Inmobiliario; Partidas PBA; Asistencia Digital; Constancia ARCA; Generar VEP; Informe de deuda y saldos CCMA; Reimputación de pagos; Informe + reimputación; Alta de Monotributo; Baja de Monotributo; Recategorización; Domicilio Fiscal Electrónico; Actualización de datos ARCA; Apostillado; Legalizaciones.

**5 consultas/derivaciones sin pago inmediato:** Partidas CABA; Reclamo ART/accidente laboral; Accidentes; Sucesiones; Consulta laboral.

## Pruebas reproducibles efectuadas
- `tests/v1-fixture-audit.mjs` generó y validó 127 escenarios exclusivamente en memoria de los 23 servicios: obligatorios, formatos sintácticos básicos, cada opción select/choice, alternativas y honorarios. Prueba exitosa GitHub Actions 35544190698. No se cargaron fichas reales, no se enviaron mensajes ni se simuló acreditación efectiva. El primer intento falló por una expectativa incorrecta del simulador sobre un archivo opcional; se corrigió y la repetición pasó.
- `tests/v1-directives.mjs` impide reintroducir filas de arancel oficial en fichas revisadas, comprueba honorarios aprobados, acceso rápido admin, caché versionada y `payment_review`. Parche y pruebas aprobados en run 35544484951.
- `tests/v1-browser-visual.mjs` en Chromium local bloqueó tráfico externo, renderizó las 23 rutas de formularios y tomó seis capturas de inicio, Legalizaciones/Apostillas y Partidas en PC 1440 px y móvil 390 px. Run 35544684807 aprobado. Capturas e informe JSON https://github.com/tramipago2026/TramiPago/actions/runs/35544684807/artifacts/10616710601. Las ocho tarjetas principales visibles midieron 154 × 192,5 px y cargaron imágenes; no hubo overflow horizontal ni error JavaScript reportado en esas seis páginas. La entrada de abogado está en encabezado y no integra las ocho tarjetas principales. La prueba NO envió los formularios.
- Auditoría estática integrada de sintaxis, imágenes y contratos del repositorio también aprobada en run 35544817123.
- `tests/v1-all-links-whatsapp.mjs`: 23 rutas de formularios, 10 HTML, 181 enlaces internos, ayuda contextual en 9 páginas, cero errores estáticos, run 35553245068.
- `tests/v1-all-buttons-browser.mjs`: Chromium local, 46/46 fichas PC y móvil, tarjetas directas, categorías, selector PBA/CABA, temas de abogado, número WhatsApp y ejemplos de pago pendiente/finalizado ficticios, run 35553565244 aprobado. No envió mensajes ni usó API externas.

## Correcciones verificadas: SOLO rama de trabajo, NO producción
- `app.js`: eliminada la fila de «Costo oficial» que se preparaba en fichas; mantenidas secciones y honorarios.
- `extra-families.js`: eliminados dos importes oficiales explícitos en requisitos de Apostillado/Legalizaciones; mantenidos honorarios y condiciones genéricas sin cifras oficiales.
- `index.html`: cambiados solo parámetros de versión de `app.js` y `extra-families.js` para invalidar versiones cacheadas después de una eventual publicación autorizada. Se sumó módulo de WhatsApp contextual compartido; no se vació caché de usuario ni `localStorage`/`sessionStorage` con datos pendientes.
- Módulo `whatsapp-context.js`: prepara un enlace al número confirmado 5491167083232 con botón origen, trámite, etapa, código/estado disponibles, pregunta y un espacio editable. No manda datos sensibles automáticamente ni envía mensajes.
- Borrador de alerta por **EMAIL DESCARTADO**: se volvió a la versión original de `backend-sync.js` exactamente igual a `main`, se eliminaron la función Edge y su configuración no desplegadas y las pruebas obsoletas de email; conserva `payment_review` y acreditación manual.
- No se tocó `admin.js`, SQL, CSS ni otras páginas excepto carga acotada del módulo contextual en las nueve páginas con WhatsApp.

## Limpieza controlada y comprobada: SOLO rama de trabajo
- Retirado workflow `.github/workflows/municipal-hover-align-20260919.yml`, parche de ejecución única que dependía de una cadena de CSS anterior y se borraba a sí mismo; código CSS y diseño municipal vigente conservados.
- Retirados workflows y scripts temporales de parches tras aplicarlos y validarlos; se conservaron los tests permanentes y flujo de navegador de auditoría.
- `assets/justicia-balanza-martillo-20260918.svg`: el inventario de 43 recursos detectó ausencia de referencias literales en HTML/JS/CSS públicos, búsqueda de código GitHub sin resultados; se examinó el archivo y se retiró **solo de la rama de prueba**, conservándolo recuperable en la rama de respaldo. Tras borrarlo, quedan 42 recursos, sujeto a regresión CI. No se encontraron duplicados binarios entre los 43 originales. No borrar en bloque el resto de imágenes.

## Auditoría gráfica — hallazgo comprobado
En capturas reales de escritorio y móvil se ve que la tarjeta «Legalizaciones y Apostillas» reutiliza exactamente la misma fotografía editorial que «Partidas» (`assets/partidas-familia-final.webp`). El código y el resultado de Chromium confirman la duplicación. Las dos subtarjetas interiores sí tienen sus propias ilustraciones y comparten geometría en la vista inspeccionada. No reemplazar la imagen de portada por otra aleatoria: identificar y validar una fotografía propia del trámite manteniendo 154 × 192,5 px, CSS, títulos, alineaciones y diseño aprobado.

En la portada de PC, una descripción de Informe Vehicular aparece abreviada con puntos suspensivos. Verificar aprobación del criterio de truncamiento antes de alterar texto o letra. No se hicieron capturas de todas las familias ni estados de formulario; uniformidad gráfica global sigue SIN VERIFICAR. Informe específico: `audits/tramipago-v1-visual-20260920.md`.

## Circuito completo, pruebas pendientes y fallas potenciales identificadas
1. Cliente elige trámite y variante, completa datos y consentimiento; pantalla calcula honorarios; `app.js` guarda ficha local y `backend-sync.js` programa registro mediante Edge `create-request`. Sin base aislada, NO probado de extremo a extremo.
2. Adjuntos: hay código de subida al bucket privado y RPC de registro. Falta probar asociación y autorización de acceso por rol con credenciales ficticias.
3. Comprobante: frontend llama RPC `register_public_payment_receipt` y deja solicitud en `payment_review`; **no acredita automáticamente**. Confirmación manual y reloj de inicio desde panel existen en código/triggers, no se probaron con una operación aislada.
4. **Aviso administrador PENDIENTE:** el usuario requiere WhatsApp, no email. El botón prepara el texto para que el propio cliente lo envíe; no existe integración automática con WhatsApp Business ni se comprobó recepción en el número del propietario.
5. **Admin PENDIENTE:** probar panel rápido sin MFA con cuenta administradora/no administradora, recepción de ficha/archivo y estados `payment_confirmed`, `in_progress`, `needs_info`, `finalized`.
6. **Seguimiento PENDIENTE:** probar código + verificación desde otro dispositivo con resultado mínimo y manejo de código inválido, sin filtrar datos personales.
7. **Retención/seguridad PENDIENTE:** medir datos en localStorage, permisos RLS/storage/funciones públicas y comportamiento de errores/reintentos; no borrar datos de clientes como si fueran caché.
8. Repetir todos los circuitos 18 pagados + 5 consultas en entorno de prueba de Supabase sin usar DNI o datos reales ni tocar organismos oficiales. Validar diseño de todas las rutas y subetapas antes de publicar.

**ESTADO DE CIERRE:** inventario, enlaces y botones/WhatsApp de 23 rutas comprobados en navegador aislado PC y móvil; no hay evidencias de E2E comercial ni mensajes WhatsApp recibidos. PR en borrador. **NO FUSIONAR NI PUBLICAR** antes de resolver bloqueantes y aprobación del propietario. Respaldo: `backup/tramipago-v1-preaudit-20260920`.
