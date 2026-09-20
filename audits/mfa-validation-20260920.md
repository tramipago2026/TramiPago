# MFA del panel: comprobación y bloqueo pendiente

Fecha: 2026-09-20. No modifica base de datos ni producción.

## Evidencia

1. `admin.html` incluye `admin.js`. En `main`, `admin.js` modifica con expresión regular el módulo `admin-mfa.js` para eliminar la comprobación MFA y usa `eval`.
2. En la rama de trabajo `work/tramipago-v1-audit-20260920` se sustituyó exclusivamente `admin.js` por un cargador directo de `admin-mfa.js`, sin modificar `admin.html`, CSS ni `main`.
3. `admin-mfa.js` consulta `getAuthenticatorAssuranceLevel()` y exige `currentLevel === 'aal2'` antes de mostrar panel.
4. La función de base `public.is_admin()` actualmente comprueba exclusivamente que `auth.uid()` exista en `public.admin_users`; no exige AAL2. Las políticas de tablas administrativas y archivos privados dependen de `is_admin()`. Por tanto, un control de MFA solo en el navegador NO obliga al segundo factor cuando la API es consultada directamente por una cuenta administradora con sesión AAL1. Esto es una discrepancia de autorización, no evidencia de acceso externo ni explotación.
5. Documentación oficial: https://supabase.com/docs/guides/auth/auth-mfa#enforce-rules-for-mfa-logins indica que MFA visual necesita políticas en backend/base y que se puede inspeccionar el claim JWT `aal`.

## Plan de corrección antes de publicación

- Diseñar cambio mínimo de `public.is_admin()` para exigir simultáneamente membresía en `admin_users` y `auth.jwt()->>'aal' = 'aal2'`, manteniendo política de lectura de propia membresía para activar MFA. Revisar todas las llamadas a `is_admin` y funciones con privilegios elevados, incluyendo Storage.
- Probar con cuenta ficticia autorizada: una sesión AAL1 NO debe listar/editar fichas ni descargar documentos; sesión AAL2 sí debe permitir exactamente los permisos administrativos previstos; `anon` y otro usuario deben ser rechazados. Probar expiración/refresh de sesión.
- No cambiar función SQL ni políticas en base de producción hasta poder validar en entorno aislado y recibir autorización explícita.
- No afirmar MFA seguro o V1 terminada únicamente por el arreglo frontend: permanece pendiente la barrera AAL2 a nivel API y pruebas E2E.

## Prueba disponible

Se comprobó la sintaxis del nuevo `admin.js` con Node y se ejecutó una simulación aislada con DOM falso: carga `admin-mfa.js`, fija `async=false` y muestra error si falla. No se probó inicio de sesión real, permisos SQL, MFA con autenticador ni interfaz visual.
