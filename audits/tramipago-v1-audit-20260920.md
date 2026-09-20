# TramiPago V1 — auditoría factual rectificada (20/09/2026)

## 0. Directivas vinculantes del propietario: NO clasificar como defectos

1. **Estado del proyecto:** TramiPago está en construcción y pruebas; el propietario informa que todavía NO está registrado. La compra de dominio y hosting pagos está expresamente diferida hasta terminar y verificar estructura, diseño y circuito íntegro. El alojamiento temporal actual es el entorno de desarrollo: no plantear la compra de dominio, hosting o registro como prerrequisito técnico para completar la V1.
2. **Modelo comercial:** TramiPago cobra honorarios por la gestión, conocimiento, tiempo, asistencia y plataforma, independientemente de que el organismo cobre una tasa o preste gratuitamente su trámite. Los importes de honorarios fijados por el propietario no se consideran errores por contraste con aranceles públicos.
3. **Publicación de aranceles oficiales:** NO publicar ni agregar montos de tasas oficiales en el sitio, fichas comerciales ni pantallas de pago. La cifra `officialFee: 0` que aparece en la configuración AP no autoriza a exhibir un supuesto costo oficial de cero ni constituye motivo para cambiar el modelo de honorarios. Si el cálculo interno llegara a mezclar o duplicar conceptos o a contradecir condiciones pactadas, comprobarlo técnicamente y proponer una corrección de lógica sin publicar montos oficiales ni cambiar precios por iniciativa propia. Las comunicaciones de costos adicionales que exijan los términos existentes y otras obligaciones aplicables deben revisarse por separado, sin convertirlas automáticamente en un cartel de tasa oficial en el catálogo.
4. **Acceso al panel:** SIN segundo factor durante construcción por orden expresa; no exigir MFA ahora ni bloquear el circuito por ausencia de MFA. Conservar identificación/autorización existente; riesgos futuros se registran como observaciones para una etapa distinta, sin efectuar cambios no pedidos.
5. **Diseño y documentos aprobados:** no rediseñar elementos ajenos a un cambio solicitado. Términos y Condiciones, Política de Privacidad, Botón de Arrepentimiento y Botón de Baja ya fueron redactados y pulidos: verificar su conexión/función, no reescribir su contenido ni discutir el modelo de cobro salvo inconsistencia demostrada con el flujo.
6. **Meta:** completar y comprobar la experiencia real del cliente desde elección, carga de datos, pago de honorarios, comprobante, código, gestión administrativa y consulta de estado, conservando identidad visual. No afirmar 'terminado' antes de evidencia integral.

### Rectificaciones explícitas de informes anteriores

- RETIRADO: 'MFA desactivado es un defecto que exige reparación inmediata'. Es una configuración deliberada de prueba. El cambio de `admin.js` propuesto previamente fue revertido: blob idéntico a `main`.
- RETIRADO: 'El arancel estatal de AP distinto de cero es un error comercial bloqueante que obliga a publicar costos oficiales'. Se confundió la tasa del organismo con los honorarios independientes de TramiPago. No se publicarán aranceles oficiales. Una cifra técnica interna solo se examinará si produce un cobro incorrecto, una contradicción verificable con los términos o un fallo del circuito; eso aún no está demostrado.
- RETIRADO: 'Para terminar V1 primero hay que comprar dominio/hosting o registrar la marca'. Son decisiones de una etapa posterior al cierre y comprobación funcional.

## 1. Alcance y método de constatación

GitHub: inspección de `main` (HTML, configuración de servicios, `app.js`, `backend-sync.js`, `security-hardening.js`, `admin.js`, `admin-mfa.js`), archivos legales, scripts y resultados de GitHub Actions. Supabase: consultas read-only a esquema, RLS, permisos, bucket, funciones Edge, triggers y asesores. No se creó ningún trámite ni se ejecutó transferencia, inicio de sesión real, envío de mensaje, prueba E2E o comparación de capturas PC/móvil. No hay evidencia de que el sitio publicado coincida visualmente con la versión aprobada. Las pruebas estáticas no sustituyen pruebas operativas. `main`, sitio publicado y Supabase no se modificaron por esta auditoría. Respaldo: `backup/tramipago-v1-preaudit-20260920`, commit `761076773bc763a75411f3bc5a2f5bf4ba911467`.

## 2. Inventario factual y clasificación

| Área | Estado respecto del criterio de cierre | Hecho observado y límite |
|---|---|---|
| Diseño/estructura | NO VERIFICADO VISUALMENTE | HTML y recursos existen; no se compararon capturas de escritorio y móvil con el diseño aprobado. No introducir rediseños espontáneos. |
| Catálogo y formularios | CONFIGURACIÓN ESTÁTICA VALIDADA; OPERACIÓN NO VERIFICADA | GitHub Actions pasó: 99 archivos, 290 referencias estáticas, 0 errores; catálogo: 4 tarjetas directas, 5 familias, 23 formularios configurados, 241 campos y 80 opciones. Esto no demuestra recorridos completos. |
| Documentación contractual | EXISTENCIA VERIFICADA; ENVÍOS NO VERIFICADOS | `terminos-condiciones.html` sección 1 describe asistencia y gestión privada; sección 6 regula precio final y tratamiento de tasas; sección 7 exige confirmación de pago; existen `politica-privacidad.html`, `arrepentimiento.html`, `baja-servicio.html` y enlaces. Los formularios y comunicaciones de arrepentimiento/baja no se probaron de extremo a extremo. Ningún rediseño o reescritura autorizado. |
| Honorarios AP | CONFIGURACIÓN CONTRASTADA | `services.js` y `service_price_options` coinciden para 1 h $20.000 y 6 h $15.000. Son honorarios de gestión definidos por el propietario. NO contrastar con tasas oficiales para invalidarlos. No modificar ni publicar tasas. |
| Precio efectivo a cobrar | NO VERIFICADO E2E | `app.js` calcula precio localmente y Edge `create-request` consulta opciones del servidor. No se compararon importes presentados, importe guardado y constancia final en solicitud ficticia; verificar SIN introducir montos oficiales en pantalla. |
| Base de datos | CONFIGURACIÓN VERIFICADA; OPERACIÓN NO VERIFICADA | Proyecto y tablas existentes; 10 tablas públicas con RLS habilitado. `anon` sin SELECT directo en solicitudes/datos/archivos/admin. Falta validar permisos efectivos con usuarios ficticios. |
| Almacenamiento | CONFIGURADO; OPERACIÓN NO VERIFICADA | Bucket `request-files` privado, máximo 10 MiB; JPEG/PNG/WebP/PDF. Faltan pruebas de subida/lectura legítima y denegación ajena. |
| Alta de solicitud AP | CÓDIGO PRESENTE; CIRCUITO NO VERIFICADO | `app.js` crea un borrador local, `backend-sync.js` llama Edge `create-request` y la función Edge guarda registro; no se comprobó un pedido de prueba completo. |
| Pago | SEPARACIÓN DE ESTADOS EN CÓDIGO; OPERACIÓN NO VERIFICADA | Cargar comprobante pasa a `payment_review`, no acredita automáticamente. Panel permite `payment_confirmed`; trigger registra marca temporal. No se probó cotejo verificable de la transferencia ni flujo completo. |
| Aviso administrativo | NO VERIFICADO | Edge `confirm-payment` contiene correo al administrador, pero la ruta inspeccionada de `backend-sync.js` usa una RPC diferente; no se demostró la notificación ni su eventual reintento. No anunciar WhatsApp automático si no está implementado. |
| Consulta por código | CÓDIGO PRESENTE; OPERACIÓN NO VERIFICADA | `security-hardening.js` llama a `track-request` con código y últimos cuatro dígitos; Edge compara hash y devuelve código/estado. Falta prueba desde otro dispositivo y de datos inválidos. |
| Acceso admin sin MFA | REQUISITO RESPETADO; PRUEBA OPERATIVA PENDIENTE | `admin.html` carga `admin.js` en modo desarrollo sin segundo paso; conserva control de membresía. No alterar por criterio propio. Probar ingreso legítimo, rechazo de cuenta no administradora y gestión de ficha sin modificar la experiencia solicitada. |
| Seguridad residual | ADVERTENCIAS, NO EXPLOTACIÓN DEMOSTRADA | Supabase reportó cuatro RPC públicas SECURITY DEFINER y protección de contraseñas filtradas desactivada. Las funciones inspeccionadas contienen validaciones, pero no se hicieron pruebas adversariales autorizadas; analizar alcance sin romper el circuito ni imponer MFA. |
| Datos sensibles en navegador | RIESGO DE PRIVACIDAD A MEDIR | `app.js` usa `localStorage` para ficha y respuestas, y pueden existir adjuntos `dataUrl` transitorios; `backend-sync.js` limpia contenido al sincronizar y `security-hardening.js` minimiza al finalizar. Falta medir permanencia y evitar pérdida de datos al corregir. |
| Publicación/hosting | DIFERIDO POR DECISIÓN | Alojamiento actual: etapa de trabajo. No exige compra de dominio ni hosting nuevos para la validación. Despliegue comercial final requiere decisión posterior del propietario, no es tarea bloqueante ahora. |

## 3. Pendientes reales, ordenados por dependencia

P1. Confirmar referencia visual aprobada y verificar identidad, cabecera, pie, tarjetas, botones, textos y navegación en PC/móvil con capturas. No modificar nada fuera de la corrección concreta.
P2. Ejecutar un alta ficticia AP completa en un entorno seguro, cotejando la información/importe de honorarios en pantalla, servidor y panel. No publicar montos oficiales ni cambiar precios.
P3. Probar adjuntos y comprobante, comprobar que se guarden correctamente y que 'comprobante recibido' jamás se presente como 'pago acreditado' sin confirmación verificable.
P4. Probar desde el panel actual sin MFA: cuenta administradora, no administradora, consulta de fichas, cambio de estado, registro de acontecimientos e inicio correcto del plazo.
P5. Probar notificación real al administrador o declarar su canal NO CONFIGURADO; comprobar tratamiento de fallos/reintentos sin atribuir funcionalidad inexistente.
P6. Probar seguimiento por código desde el mismo y otro dispositivo, datos erróneos, solicitudes inexistentes y privacidad de la respuesta.
P7. Revisar permisos mínimos de RPC, archivos y datos locales, sin desactivar endpoints necesarios; registrar recomendaciones futuras separadas del alcance de desarrollo. No modificar accesos por decisión unilateral.
P8. Confirmar comportamiento de términos, privacidad, arrepentimiento y baja en navegador: enlaces, formularios, validación y salida, sin modificar contenido ya aprobado.
P9. Ejecutar regresión técnica y visual; informar para cada caso evidencia, PASS/FAIL/NO VERIFICADO y archivo exacto afectado.
P10. Obtener aprobación del propietario para la versión comprobada; NO fusionar cambios en `main`, ni tocar sitio publicado o Supabase productivo, ni contratar infraestructura nueva sin autorización expresa.

## 4. Regla de cierre

**TramiPago V1 no está comprobada de extremo a extremo.** Existen componentes y pruebas estáticas aprobadas, no validación integral. La prioridad de trabajo es cerrar el circuito real sin reabrir modelo de honorarios, exhibir aranceles oficiales, comprar infraestructura, registrar la marca o imponer segundo factor durante construcción. Los únicos bloqueos admisibles deben surgir de una falla reproducible, de una dependencia técnica demostrada o de una obligación concreta verificada, no de una preferencia inventada por el auditor.
