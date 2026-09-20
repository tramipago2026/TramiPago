# Auditoría V1: aviso de comprobante — 20/09/2026

## Causa demostrada
`backend-sync.js` sube el archivo al bucket privado y llama RPC `register_public_payment_receipt`: el SQL registra el archivo y marca `requests.status = payment_review`. No se encontró trigger sobre `requests`/`request_files` que envíe correo. La Edge `confirm-payment` existente sí tiene envío vía Resend, pero es otro recorrido y requiere un flujo de subida con FormData y JWT que la web pública actual no ejecuta. No hay implementación de WhatsApp automático comprobada.

## Corrección exclusivamente en rama de prueba
- Se creó `supabase/functions/notify-receipt/index.ts`: acepta únicamente código + token aleatorio de la solicitud, compara hash de token en servidor, exige estado `payment_review` y archivo de tipo `payment_receipt` registrado, reclama una entrada única por solicitud/canal y prepara envío mínimo por Resend (código + servicio; sin DNI, fotos ni documentos).
- `backend-sync.js` ahora intenta invocar `notify-receipt` DESPUÉS de registrar el comprobante. Si falla el aviso conserva `payment_review` y deja marca local de notificación pendiente; el error del correo no cancela una ficha ni acredita el pago.
- `supabase/config.toml` documenta `verify_jwt=false` exclusivamente para esta función pública con autorización propia por token; no afecta el administrador ni otras funciones.
- `index.html` y `tests/live-site-smoke.mjs` usan la nueva versión del puente para invalidación de caché tras futura publicación autorizada.
- `tests/v1-notification-contract.mjs` cubre seis escenarios simulados: entrega, fallo del correo, problema de red, evitar duplicados, sin comprobante y estado previo a revisión. Prueba aprobada en GitHub Actions run `35545486064` junto con sintaxis, directivas, 127 escenarios originales e integridad estática. El workflow temporal y script temporal se retiraron y el test se agregó a la auditoría permanente.

## NO declarar operativo / pendientes
1. **No se desplegó la nueva Edge ni se modificó Supabase productivo**. Su publicación requiere pruebas aisladas y verificación de `RESEND_API_KEY`, `ADMIN_EMAIL`, `RESEND_FROM_EMAIL`, `PUBLIC_SITE_ORIGIN`. No se inspeccionaron secretos ni se enviaron correos.
2. **No existe aviso WhatsApp automático implementado** en este parche. Primero verificar correo y panel, luego decidir integración externa concreta sin prometerla.
3. Falta test E2E aislado: crear ficha de AP, adjunto, comprobante, transiciones en base, notificación entregada una vez, panel autorizado, acreditación manual, inicio de plazo y seguimiento desde otro dispositivo. No ejecutar en organismos ni usar datos reales.
4. La cola de notificaciones aún NO tiene trabajador de reintento programado: los reintentos dependen del cliente con token en la misma sesión. Una entrada `pending` puede quedar detenida si un proceso termina en mitad del envío; un proveedor que acepte correo pero cuyo registro local falle puede producir duplicados. Requiere definir reintentos/observabilidad/idempotencia antes de producción.
5. Clientes de versiones anteriores que ya informaron un comprobante mediante RPC directa no reciben notificación retroactiva por este parche. Revisar solicitudes existentes en panel bajo permisos autorizados, no reenviar indiscriminadamente.
6. Se conservan honorarios y políticas legales, panel sin nuevos pasos de acceso durante desarrollo, diseño aprobado y código `main`; sin dominio/hosting comprado, sin borrado de cachés de clientes.

**Estado:** código de aviso preparado y comprobado con mocks, flujo real todavía NO VERIFICADO. PR #3 sigue en borrador. Respaldo: `backup/tramipago-v1-preaudit-20260920`.
