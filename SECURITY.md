# Política de seguridad de TramiPago

## Alcance
Este repositorio contiene el frontend público de TramiPago. No deben almacenarse aquí claves privadas, service-role keys, contraseñas, tokens administrativos ni documentación de clientes.

## Reglas de producción
- Los cambios de seguridad deben mantener verdes las auditorías automáticas.
- El frontend sólo puede usar la publishable key de Supabase.
- Las operaciones de cliente deben pasar por Edge Functions controladas.
- No se permiten scripts inline, eval(), new Function() ni document.write().
- La CSP debe permanecer activa en todas las páginas públicas.
- Los archivos de clientes permanecen en Storage privado y no deben incorporarse al repositorio.

## Incidentes
Ante una sospecha de exposición, rotar credenciales afectadas, revisar logs de Supabase y GitHub Actions y restaurar desde un commit validado.
