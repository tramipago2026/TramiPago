# Auditoría de producción TramiPago — 29/09/2026

## Alcance
Revisión posterior a la activación de `tramipago.com.ar`: dominio, GitHub Pages, DNS, frontend, pruebas automáticas, Supabase, Edge Functions, RLS, Storage, autenticación administrativa, CORS, rate limiting, retención local y código obsoleto.

## Estado confirmado
- `tramipago.com.ar` publicado mediante GitHub Pages con archivo `CNAME`.
- DNS preparado con cuatro registros A de GitHub Pages y `www` por CNAME.
- HTTPS y `www` responden correctamente en la prueba de producción.
- Auditoría HTTP: 57/57 recursos publicados respondieron correctamente.
- Las 8 Edge Functions públicas están ACTIVE y aceptan CORS únicamente desde:
  - `https://tramipago.com.ar`
  - `https://www.tramipago.com.ar`
- El origen legado `https://tramipago2026.github.io` queda explícitamente excluido del allowlist.
- CORS rechaza orígenes ajenos.
- Las 8 Edge Functions superaron una prueba POST real no destructiva sin errores 5xx.
- El rate limiter quedó en modo fail-closed: si el control interno falla, la petición no continúa.
- RLS permanece habilitado en las tablas de negocio.
- El bucket `request-files` es privado, limita cada archivo a 10 MB y restringe MIME a JPEG, PNG, WebP y PDF.
- El panel administrativo exige pertenencia a `admin_users` y AAL2.
- Comprobación actual: 1 membresía admin, 1 usuario Auth, 1 factor MFA verificado y 1 sesión AAL2.
- En el árbol actual del frontend no se detectó `service_role`, `sb_secret_` ni claves privadas. Las claves visibles son publishable keys de Supabase.
- Logs Supabase revisados entre 22:00 y 23:25 UTC: sin respuestas 5xx ni logs de nivel error/fatal/panic.

## Correcciones realizadas
- Actualización de CORS de las 8 Edge Functions al dominio productivo.
- Eliminación del dominio GitHub Pages del allowlist CORS.
- Conversión del rate limiting de fail-open a fail-closed.
- Eliminación de 9 funciones JavaScript muertas verificadas.
- Eliminación del workflow duplicado `unify-site-shell-20260920.yml`.
- Consolidación de la prueba de navegación/contacto en `site-integrity.yml`.
- Ampliación de los disparadores de auditoría de navegador para incluir los archivos runtime relevantes.
- Incorporación de pruebas CORS positivas y negativas.
- Incorporación de integración no destructiva de las 8 Edge Functions.
- Implementación de caducidad local de borradores a 7 días.
- Limpieza de tokens huérfanos asociados a solicitudes locales eliminadas.
- Eliminación mediante migración de `private.can_upload_request_file(text)`, función antigua sin referencias.
- Eliminación mediante migración de `public.health_check()`, RPC pública antigua sin referencias.

## Pruebas automáticas
- Site integrity: PASS.
- Full browser audit: PASS sobre los cambios de frontend/runtime ejecutados.
- GitHub Pages build/deployment: PASS.
- Live site smoke: PASS.
- HTTPS + www + CORS estricto: PASS.
- Edge Functions, rutas inválidas no destructivas: PASS, sin 5xx.

## Pendientes no bloqueantes / revisión manual
1. **Supabase Auth — Leaked Password Protection Disabled**
   - El Security Advisor sigue marcando este WARN.
   - Supabase documenta que la protección contra contraseñas filtradas está disponible en Pro Plan o superior.
   - La conexión disponible no permite modificar la configuración Auth del proyecto.
   - El riesgo está parcialmente mitigado por MFA/AAL2 obligatorio para Admin, pero el warning sigue abierto.

2. **Cloudflare**
   - DNS funciona actualmente en modo DNS only.
   - Esto no impide GitHub Pages/HTTPS, pero Cloudflare no está actuando como proxy/WAF para esos registros.
   - No existe una conexión Cloudflare disponible en ChatGPT para auditar o modificar la cuenta directamente.
   - Revisar proxy/WAF/DNSSEC por separado antes de considerar esa capa cerrada.

3. **GitHub protección de rama**
   - La API devuelve cero repository rulesets.
   - La conexión GitHub actual no tiene permiso administrativo para leer/modificar Branch Protection.
   - Conviene proteger `main` contra cambios accidentales si el flujo operativo lo permite.

4. **Prueba transaccional real**
   - Las pruebas actuales no crean clientes, no realizan pagos reales y no cargan documentación real.
   - Se validaron formularios, rutas, CORS y ejecución real no destructiva de backend.
   - Antes de escalar publicidad conviene realizar una única operación de prueba controlada, con datos de prueba permitidos, desde inicio hasta estado/archivo/pago/seguimiento, y eliminarla luego.

## Observaciones
- Los índices que Supabase marca como `unused_index` son INFO de rendimiento. No se eliminaron porque la falta de uso observada no prueba que sean innecesarios.
- No se modificaron textos legales en esta pasada; se corrigió la implementación técnica de la promesa de caducidad local de borradores a 7 días.
