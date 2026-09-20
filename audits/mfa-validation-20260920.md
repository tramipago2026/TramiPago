# Rectificación: MFA en desarrollo — 20/09/2026

**El propietario solicitó expresamente que mientras TramiPago está en construcción el panel no pida doble verificación.** Esta condición es un requisito aprobado, no un error técnico. La auditoría inicial lo clasificó erróneamente como defecto. La propuesta de restauración obligatoria de MFA fue revertida en la rama de trabajo: `admin.js` vuelve a tener el mismo blob SHA `f9a8608b2ad2e467aac249745af5a9b048f1382f` que `main`.

## Hechos comprobados

- `admin.html` carga `admin.js`; este muestra `MODO DESARROLLO`, saltea el paso MFA y conserva la comprobación de membresía en `admin_users` para dar acceso al panel.
- `admin-mfa.js` existe como módulo alternativo para una futura decisión; no activarlo sin instrucción del usuario.
- En Supabase, `public.is_admin()` comprueba membresía por `auth.uid()` sin exigir `aal2`, coherente con el acceso temporal deseado. No se realizó prueba real de sesión autorizada/no autorizada, por lo que seguridad integral NO ESTÁ CONFIRMADA.
- `admin.js` usa reemplazo de código fuente mediante expresión regular y `eval` para aplicar el modo desarrollo. Eso está documentado como dependencia técnica frágil, NO como vulnerabilidad demostrada ni autorización para cambiarlo.
- Referencia oficial para decisiones futuras: https://supabase.com/docs/guides/auth/auth-mfa#enforce-rules-for-mfa-logins. Si el usuario solicita MFA en producción, verificar conjuntamente frontend y reglas API/RLS; hoy esa decisión **no** está autorizada.

## Decisión de alcance

Mantener el acceso rápido aprobado, no añadir segundo paso ni alterar otras pantallas. Priorizar fallos funcionales comprobados; registrar seguridad como evaluación independiente, sin afirmar explotación. No cambiar código ni políticas SQL por este documento.
