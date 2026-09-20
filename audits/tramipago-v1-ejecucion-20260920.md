# TramiPago V1 — auditoría de ejecución, 20/09/2026

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

## Correcciones verificadas: SOLO rama de trabajo, NO producción
- `app.js`: eliminada la fila de «Costo oficial» que se preparaba en fichas; mantenidas secciones y honorarios.
- `extra-families.js`: eliminados dos importes oficiales explícitos en requisitos de Apostillado/Legalizaciones; mantenidos honorarios y condiciones genéricas sin cifras oficiales.
- `index.html`: cambiados solo parámetros de versión de `app.js` y `extra-families.js` para invalidar versiones cacheadas después de una eventual publicación autorizada. No se vació caché de usuario ni `localStorage`/`sessionStorage` con datos potencialmente pendientes.
- `tests/live-site-smoke.mjs`: versión esperada actualizada.
- No se tocó `admin.js`, SQL, CSS ni otras páginas.

## Limpieza controlada y comprobada: SOLO rama de trabajo
- Retirado workflow `.github/workflows/municipal-hover-align-20260919.yml`, parche de ejecución única que dependía de una cadena de CSS anterior y se borraba a sí mismo; código CSS y diseño municipal vigente conservados.
- Retirados workflow temporal `.github/workflows/v1-focused-fix.yml` y script `scripts/v1-focused-fix.mjs` tras usar y validar el parche; se conservaron las pruebas permanentes.
- `assets/justicia-balanza-martillo-20260918.svg`: el inventario de 43 recursos detectó ausencia de referencias literales en HTML/JS/CSS públicos, búsqueda de código GitHub sin resultados; se examinó el archivo y se retiró **solo de la rama de prueba**, conservándolo recuperable en la rama de respaldo. Tras borrarlo, quedan 42 recursos, sujeto a regresión CI. No se encontraron duplicados binarios entre los 43 originales. No borrar en bloque el resto de imágenes.

## Auditoría gráfica — hallazgo comprobado
En capturas reales de escritorio y móvil se ve que la tarjeta «Legalizaciones y Apostillas» reutiliza exactamente la misma fotografía editorial que «Partidas» (`assets/partidas-familia-final.webp`). El código y el resultado de Chromium confirman la duplicación. Las dos subtarjetas interiores sí tienen sus propias ilustraciones y comparten geometría en la vista inspeccionada. No reemplazar la imagen de portada por otra aleatoria: identificar y validar una fotografía propia del trámite manteniendo 154 × 192,5 px, CSS, títulos, alineaciones y diseño aprobado.

En la portada de PC, una descripción de Informe Vehicular aparece abreviada con puntos suspensivos. Verificar aprobación del criterio de truncamiento antes de alterar texto o letra. No se hicieron capturas de todas las familias ni estados de formulario; uniformidad global sigue SIN VERIFICAR. Informe específico: `audits/tramipago-v1-visual-20260920.md`.

## Circuito completo, pruebas pendientes y fallas potenciales identificadas
1. Cliente elige trámite y variante, completa datos y consentimiento; pantalla calcula honorarios; `app.js` guarda ficha local y `backend-sync.js` programa registro mediante Edge `create-request`. Sin base aislada, NO probado de extremo a extremo.
2. Adjuntos: hay código de subida al bucket privado y RPC de registro. Falta probar asociación y autorización de acceso por rol con credenciales ficticias.
3. Comprobante: frontend llama RPC `register_public_payment_receipt` y deja solicitud en `payment_review`; **no acredita automáticamente**, como se desea. Confirmación manual y reloj de inicio desde panel existen en código/triggers, no se probaron con una operación aislada.
4. **Aviso administrador PENDIENTE:** Edge `confirm-payment` contiene correo vía Resend, pero el frontend inspeccionado usa RPC directamente y no quedó demostrada una llamada a la Edge ni un disparador alternativo. No se comprobó envío a WhatsApp ni correo al teléfono. No declarar resuelto.
5. **Admin PENDIENTE:** probar panel rápido sin MFA con cuenta administradora/no administradora, recepción de ficha/archivo y estados `payment_confirmed`, `in_progress`, `needs_info`, `finalized`. Otros estados de espera/revisión se observan en la vista.
6. **Seguimiento PENDIENTE:** probar código + verificación desde otro dispositivo con resultado mínimo y manejo de código inválido, sin filtrar datos personales.
7. **Retención/seguridad PENDIENTE:** medir datos en localStorage, permisos RLS/storage/funciones públicas y comportamiento de errores/reintentos; no borrar datos de clientes como si fueran caché.
8. Repetir todos los circuitos 18 pagados + 5 consultas en entorno de prueba de Supabase sin usar DNI o datos reales ni tocar organismos oficiales. Validar diseño de todas las rutas y subetapas antes de publicar.

**ESTADO DE CIERRE:** auditados catálogo, escenarios sintácticos y rutas de primera pantalla; arreglada presentación de aranceles en rama, limpieza quirúrgica y capturas iniciales. NO comprobada operación comercial E2E ni avisos automáticos. No fusionar PR ni publicar V1 antes de resolver bloqueantes y aprobación del propietario. Respaldo: `backup/tramipago-v1-preaudit-20260920`.
