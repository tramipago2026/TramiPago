# Anexo de decisiones aprobadas — desarrollo y acceso — 20/09/2026

## La condición de trabajo prevalece sobre supuestos del auditor

**Declaración expresa del propietario:** TramiPago está en construcción y todavía no está registrado. Se mantiene el alojamiento de prueba existente. No contratar dominio ni hosting pagos hasta comprobar el sitio, la estructura y todo el circuito de principio a fin. No sugerir esas compras como solución al problema de programación ni como condición previa al cierre funcional.

**Acceso al panel:** durante desarrollo el propietario decidió ingresar desde navegador sin doble verificación. `admin.html` carga `admin.js`, cuyo código indica `MODO DESARROLLO`; preserva la comprobación de pertenencia a `admin_users`, sin exigir MFA. Este diseño de interacción es intencional. La modificación anterior de `admin.js` fue revertida y su blob SHA vuelve a coincidir con `main` (`f9a8608b2ad2e467aac249745af5a9b048f1382f`). NO reintroducir MFA ni cambiar las políticas de acceso unilateralmente.

**Modelo económico:** TramiPago factura la gestión, el conocimiento, la asistencia, el tiempo y la plataforma; el honorario es independiente de que el organismo tenga o no tasa. El costo oficial NO se publica en la página. Honorarios, textos comerciales y documentación legal trabajada previamente son referencia: no reclasificar como falla el precio privado por compararlo con un arancel estatal ni introducir cifras oficiales.

## Verificación técnica disponible y límites

- Se consultaron fuentes del código y la función `public.is_admin()`: existe comprobación de membresía, sin obligación AAL2. Es consistente con el requisito temporal.
- El cargador de desarrollo utiliza sustitución de una función por texto y `eval`: dependencia frágil constatada, NO vulnerabilidad explotada ni permiso para cambiar su comportamiento por iniciativa propia. Registrar como observación técnica separada.
- No se ha probado un acceso real con identidad administradora y otro con identidad no administradora; control operativo NO VERIFICADO.
- Hay advertencias del asesor Supabase relativas a funciones públicas con privilegios elevados y política de contraseñas filtradas; no demuestran explotación ni exigen por sí mismas MFA durante construcción. Pueden analizarse sin alterar el requisito del propietario.
- La eventual configuración de un entorno comercial futuro se decidirá de forma separada DESPUÉS de cerrar y probar la V1; no bloquear ahora por ese escenario.

## Prueba a realizar

Validar que el panel abra con la cuenta administradora autorizada sin segundo paso, que otra cuenta sea rechazada, que los datos privados no se expongan y que las operaciones previstas funcionen. Usar datos ficticios y no introducir cambios productivos sin autorización. El objetivo prioritario de auditoría es completar el circuito cliente → pago de gestión → administración → seguimiento y conservar diseño aprobado.

Referencia del inventario maestro rectificado: `audits/tramipago-v1-audit-20260920.md`.
