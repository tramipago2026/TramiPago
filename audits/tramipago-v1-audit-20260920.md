# TramiPago V1 — auditoría inicial y plan de cierre

Fecha: 2026-09-20. Rama de trabajo: `work/tramipago-v1-audit-20260920`. Base recuperable: `backup/tramipago-v1-preaudit-20260920`, commit `761076773bc763a75411f3bc5a2f5bf4ba911467`.

## Alcance comprobado y límites

Auditoría estática parcial de `index.html`, `app.js`, `backend-sync.js`, `security-hardening.js`, `admin.html`, `admin.js`, `admin-mfa.js`, inventarios anteriores y funciones Edge `create-request`, `track-request` y `confirm-payment`. Consulta de metadatos de tablas, políticas RLS, almacenamiento y asesor de seguridad en el proyecto Supabase existente. **No hubo prueba E2E, inspección visual comparativa ni prueba de envío de correo o pago.** No se modificaron datos productivos, configuración de Supabase ni rama `main`.

## Invariantes de diseño

La portada actual `index.html` y el encabezado/pie aprobados son referencia. No modificar logo, tipografía, paleta, tarjetas, carrusel, botones, encabezados, pies, textos aprobados ni rutas fuera de cambios expresamente justificados. Mantener PC/móvil y conservar encabezado y pie del panel si se corrige autenticación. Comparar antes/después visualmente antes de solicitar publicación.

## Inventario y clasificación (evidencia ≠ prueba funcional)

| Componente | Clasificación | Hallazgo / evidencia | Acción |
|---|---|---|---|
| Portada, familias y estilos | NO VERIFICADO | Existe código y auditoría estática anterior (`audits/public-shell-20260920.md`), pero no capturas comparativas PC/móvil. | Capturas y prueba manual de rutas; preservar diseño. |
| Formulario y alta AP | NO VERIFICADO | `app.js` guarda ficha local; `backend-sync.js` llama a Edge `create-request`, activa. Sin simulación de alta verificada. | Prueba ficticia completa con resultado en Supabase. |
| Base de datos | NO VERIFICADO | Proyecto ACTIVE_HEALTHY; tablas `requests`, `request_data`, `request_files`, `request_events`, `services`, `admin_users`, `notifications`; RLS habilitada en todas las tablas públicas listadas. | Probar autorización por rol y escritura/lectura con cuenta de prueba. |
| Archivos privados | NO VERIFICADO | Bucket `request-files` no público, límite 10 MB, MIME jpeg/png/webp/pdf; políticas de lectura para admins y carga condicionada. | Probar acceso anónimo negado, subida propia y descarga admin. |
| Seguimiento | NO VERIFICADO | `security-hardening.js` intercepta formulario antes de `backend-sync.js` y llama `track-request` con código y 4 dígitos; la RPC heredada `get_public_request_status` no tiene permiso `anon`. | Probar con código propio, ajeno e incorrecto; retirar duplicación solo tras prueba. |
| Panel administrativo | DEFECTUOSO | `admin.html` carga `admin.js`, que anuncia MFA desactivada, modifica por regex el `showSession` de `admin-mfa.js` y ejecuta código con `eval`. `admin-mfa.js` ya contiene comprobación AAL2 y MFA. | En rama aislada, reemplazar cargador de desarrollo por cargador directo del módulo MFA, sin tocar HTML/CSS. Probar inicio/cierre/AAL1/AAL2. |
| Confirmación de pago | NO VERIFICADO | `backend-sync.js` registra comprobante como `payment_review`; Edge `confirm-payment` existe pero no se observó uso desde el flujo inspeccionado. | Probar que cargar comprobante NO acredita pago; solo admin confirma y comienza plazo según reglas. |
| Notificaciones | INCOMPLETO / NO VERIFICADO | `notifications` figura sin filas; correo está implementado en Edge `confirm-payment`, pero no se verificó que el circuito público invoque esa función ni que las credenciales del proveedor estén configuradas. | Unificar flujo de comprobante y notificación; probar envío fallido/exitoso sin datos reales. |
| Seguridad de funciones | NO VERIFICADO | Asesor de Supabase: 4 advertencias por RPC públicas SECURITY DEFINER y otra por protección de contraseñas filtradas desactivada. Las cuatro RPC validan código/hash de token y estados: la exposición puede ser intencional, no declarar vulnerabilidad explotable sin prueba. | Revisar permisos mínimos, abuso, propiedad y validación; documentar si se mantiene exposición, corregir si es innecesaria. |
| Datos en navegador | DEFECTUOSO / RIESGO DE PRIVACIDAD | `app.js` guarda respuestas y solicitudes en `localStorage`; los adjuntos pueden existir transitoriamente como `dataUrl`. `security-hardening.js` purga información local solo al observar finalización. | Diseñar minimización y eliminación temprana después de sincronización confirmada, con recuperación sin pérdida de solicitudes. |
| Precios y requisitos oficiales | NO VERIFICADO | Hay catálogo/precios en código y base, pero no se realizó doble validación con fuentes oficiales vigentes. | Verificar fuente primaria y segunda fuente oficial por trámite antes de anunciar plazos y costos oficiales. |
| Entorno de publicación | NO VERIFICADO | No se realizó prueba visual en navegador ni comparación efectiva versión publicada/commit. | Verificar despliegue y rutas tras autorización expresa para publicar. |

## Lista cerrada de pendientes para V1

P1. Corregir MFA del panel y eliminar `eval` del cargador de desarrollo, sin alterar diseño.
P2. Completar revisión de seguridad de RPC, Edge Functions, RLS, archivos y abuso de alta pública.
P3. Corregir persistencia excesiva de datos sensibles en navegador sin perder recuperabilidad.
P4. Verificar alta AP con datos ficticios y comparar cotización cliente/servidor.
P5. Verificar subida de archivos y comprobante y transición a **Pago en revisión**; nunca marcar acreditado por carga.
P6. Verificar acción administrativa de confirmación, inicio de plazo y registros de auditoría.
P7. Integrar/probar aviso al administrador, estados fallidos y reintentos sin prometer WhatsApp API inexistente.
P8. Verificar código de gestión + últimos cuatro dígitos, error seguro y seguimiento desde otro dispositivo.
P9. Confirmar requisitos, aranceles oficiales y modalidades AP con dos fuentes oficiales antes de publicar afirmaciones de trámites.
P10. Probar todos los enlaces y flujo completo AP, seguridad, accesibilidad y diseño PC/móvil con capturas comparativas.
P11. Repetir pruebas tras correcciones; validar con el propietario el diseño, luego solicitar permiso explícito para publicación en `main`/producción.

## Plan de ejecución y puerta de publicación

1. Auditar: ampliar evidencia de P1–P11 sin datos personales. 2. Planificar: corregir bloqueantes sin ampliar alcance. 3. Respaldar: rama backup inmóvil. 4. Programar: cambios mínimos solo en rama de trabajo; no alterar pantallas aprobadas. 5. Probar: pruebas automatizadas reproducibles + E2E ficticio + PC/móvil. 6. Corregir fallos. 7. Validar evidencia y revisión visual con propietario. 8. Publicar **solo tras autorización**.

**Criterio de salida:** no declarar V1 funcional ni lista para producción hasta superar P1–P11, sin errores críticos ni pruebas pendientes. Estados NO VERIFICADO indican falta de evidencia, no fallo demostrado.
