# TramiPago V2 — Acuerdo técnico y continuidad

**Corte:** 12/10/2026. **Versión contractual:** `2026-10-12.d14-staging-review1`.
**Estado:** núcleo funcional y portada Opción C verificados en staging aislado. Documentos privados B2 y correos Resend pendientes. No habilita producción.

## Entorno autorizado

- Frontend: `tramipago2026/TramiPago`, rama `v2/opcion-c-directiva13`, código bajo `/v2/`.
- Backend privado: `tramipago2026/TramiPago-web`, rama `v2-mysql-chat12-integration`.
- Worker: `tramipago-v2-api-staging`; base TEST: `tramipago_v2_test`.
- URL: https://tramipago-v2-api-staging.tramipago.workers.dev/v2/
- MySQL real con Aiven/Hyperdrive; Better Auth 1.7.7 y MFA TOTP; API Hono/Worker. La propuesta histórica Firestore del chat 09 no define este entorno.
- V1, ramas `main`, producción, Supabase y DNS productivo quedan fuera de alcance. No comprometer pagos ni habilitar proveedores facturables.

## Trabajo cerrado con evidencia

| Bloque | Resultado comprobado | Evidencia |
|---|---|---|
| Portada Opción C | Hero original, ocho tarjetas y logo completos; sin placeholders; búsqueda y navegación operativas | Run backend `38320437324`, visual en nueve tamaños; manifiesto `v2/assets/opcion-c-assets.json` |
| Catálogo y rutas | 25 servicios, cinco familias, 142 rutas; destinos V2 existentes | CONTROL 4 y Live Preview E2E `38320437275` |
| Formularios | Entrada directa, resumen en la misma pantalla, tres pasos o dos sin pago; verde/completo, azul/actual, gris/pendiente; datos conservados al recargar y reintentar | Browser E2E `38320437248` |
| Solicitudes y seguimiento | Borradores, envío, estados, seguimiento autorizado, ayuda y correcciones con MySQL real | Core API E2E `38320437261`; Browser E2E |
| Admin | Sesión, roles y MFA; UI aislada conectada | Admin Browser E2E `38320437307` |
| Integridad del backend | Comprobaciones estáticas y TypeScript aprobadas | `backend-v2-static` `38320437301`; job de deploy |
| Backup y restauración aislada | Dump TEST cifrado, descifrado y restaurado; verificación de conteos | Backup Restore E2E `38213772420`, SUCCESS; prueba histórica, no repetida en esta revisión |
| Información interna | CONTROL 2/fecha/valores oficiales retirados de las 25 fichas y datos públicos | CONTROL 4, Live Preview E2E; antigua URL pública 404 |

El cierre anterior fue comprobado sobre frontend `daf37d4d1ea7bb5490a9e28af5cf526a9a174432` y backend `9dde33b85c6527d792f34696387e8f174fc21185`. Los cambios de esta revisión actualizan continuidad/contrato y el pin de publicación; la versión activa posterior se comprueba en `/v2/health/dependencies` y en los runs del nuevo commit. No sustituir esa comprobación por un SHA escrito en un documento.

## Pendientes reales

| Pendiente | Qué falta para completarlo | Estado verificable |
|---|---|---|
| Archivos y comprobantes B2 | Bucket privado TEST y clave restringida configurados en el Worker; pruebas reales de carga, descarga, borrado, hash y rechazos | `b2: pending` en staging; código listo. La carga y entrega reales siguen bloqueadas; no simularlas |
| Correos Resend | API key y remitente verificado TEST; prueba de envío externo con datos sintéticos | `resend: pending` en staging; motor/cola listos. No declarar mensajes entregados |
| TLS directo estricto MySQL | CA de Aiven en el entorno TEST y ejecución de `backend-v2-tls-verify.yml` con validación de cadena | Pendiente documental `PENDING_AIVEN_CA`; no revalidado en esta revisión. La conexión operativa por Hyperdrive no cierra esta prueba distinta |
| Backup externo persistente | Destino elegido y OAuth/configuración; comprobar copia cifrada y recuperación | Pendiente. El restore temporal aprobado no demuestra conservación externa |
| Ficha modelo y modelo comercial | Definición/aprobación del usuario antes de fijar fichas e información comercial definitiva | Pendiente. No inventar requisitos, valores oficiales ni nuevos precios |
| Producción/cutover | Autorización expresa y CONTROL 3 específico tras resolver los gates | Fuera del alcance actual; no ejecutar |

No solicitar nuevamente recursos del logo, la portada ni credenciales de Cloudflare: su publicación ya está verificada. No pedir ni publicar secretos en chats o repositorios.

## Contrato y recorrido vigentes

Contrato JSON idéntico en `v2/contracts/api-v2.contract.json` (frontend) y `docs/v2-api.contract.json` (backend). Las operaciones marcadas `STAGING_E2E_OK` están implementadas y probadas; no son sólo propuestas.

Recorrido: catálogo/familia → formulario directo con revisión local → guardar/enviar → pago cuando corresponda → confirmación/seguimiento. Las rutas antiguas `iniciar` y `revisar` permanecen compatibles y no agregan un paso obligatorio. Documentación requerida ausente conserva la solicitud como borrador; la barra no la presenta como completa.

El flujo de pago y sus estados están implementados. La recepción de un comprobante real, la entrega de documentos privados y el correo final requieren las dependencias pendientes de la tabla. Cargar un comprobante nunca aprueba un pago automáticamente.

## Reglas para continuar

- Tomar estos documentos y el código versionado como coordinación, contrastando siempre con staging y los runs del commit activo.
- Mantener la portada aprobada y las funciones estables; modificar sólo un incumplimiento comprobado.
- Ningún enlace V2 lleva inadvertidamente a V1. El navegador no accede directamente a MySQL.
- Usar exclusivamente datos sintéticos y recursos TEST; mantener `noindex,nofollow`.
- Cerrar cada pendiente sólo tras comprobar código, prueba y despliegue donde aplique. Una dependencia configurada no equivale a una prueba E2E superada.
