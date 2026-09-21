# TramiPago V1 — auditoría factual rectificada (20/09/2026)

## 0. Directivas del propietario — no son defectos

- **Etapa:** TramiPago está en construcción y pruebas; el propietario informa que todavía no está registrado. Se mantiene el alojamiento temporal existente. NO contratar dominio ni hosting pagos antes de terminar y probar todo el circuito. No plantear registro, dominio ni hosting nuevo como prerrequisito para finalizar el desarrollo.
- **Honorarios:** TramiPago cobra por gestión, conocimiento, asistencia, tiempo y plataforma, sea gratuito o arancelado el trámite del organismo. No modificar los honorarios aprobados ni calificarlos de errores por comparación con tasas públicas.
- **Aranceles oficiales:** NO publicar montos de tasas oficiales en el sitio en ningún caso. Auditar lo que aparece efectivamente al cliente, no imponer una tabla de costos estatales. Conservar la información del precio final y las condiciones de contratación previstas en los textos aprobados, revisando aparte cualquier costo adicional que requiera aceptación; esto NO autoriza a publicar cifras oficiales por iniciativa propia.
- **Administración:** durante la construcción, el propietario ordenó acceso desde navegador SIN segundo factor. Es una configuración temporal deliberada. No activar MFA ni bloquear el desarrollo por su ausencia; conservar comprobaciones de identidad y membresía existentes. Revaluar para eventual lanzamiento solo por instrucción expresa.
- **Diseño/legal:** conservar identidad, cabecera, pie, tarjetas, alineaciones, tipografía, botones y estructura aprobados. `terminos-condiciones.html`, `politica-privacidad.html`, `arrepentimiento.html` y `baja-servicio.html` ya fueron trabajados; comprobar su operatividad sin reescribirlos ni reabrir decisiones comerciales.
- **Objetivo:** verificar el circuito cliente → datos → honorarios/pago → comprobante y acreditación → código → gestión administrativa → seguimiento, con pruebas y comparación visual PC/móvil. No declarar lista la V1 por pruebas meramente estáticas.

### Errores anteriores retirados

1. Se calificó incorrectamente como defecto que `admin.js` omita MFA; la configuración corresponde a una orden vigente. El cambio de código propuesto fue revertido: `admin.js` coincide con `main`.
2. Se presentó la diferencia entre honorarios privados y aranceles oficiales como un defecto comercial y se propuso publicar tasas. Esa conclusión fue incorrecta; se retira por completo. No se cambiarán honorarios ni se exhibirán importes oficiales.
3. No corresponde exigir compra de dominio/hosting ni registro antes de completar las pruebas.

## 1. Alcance y validación

Se revisaron en GitHub archivos HTML y JavaScript del proyecto, catálogo, textos legales, scripts y resultados de GitHub Actions; en Supabase, metadatos SQL, RLS, permisos, bucket, funciones Edge, triggers y asesor de seguridad mediante consultas de lectura. NO se realizaron compras, transferencias, solicitudes ficticias E2E, sesión real, mensajes reales ni comparación visual con capturas PC/móvil. No confundir código existente, configuración y operación probada. No se modificaron la rama `main`, el sitio publicado ni Supabase por esta auditoría. Respaldo del código: `backup/tramipago-v1-preaudit-20260920`, commit `761076773bc763a75411f3bc5a2f5bf4ba911467`.

## 2. Hallazgos verificables

| Componente | Estado | Evidencia precisa y límite |
|---|---|---|
| Diseño | NO VERIFICADO VISUALMENTE | HTML y recursos existentes; sin capturas PC/móvil comparativas con aprobación. No rediseñar. |
| Integridad estática | APROBADA EN ALCANCE LIMITADO | GitHub Actions: 99 archivos inspeccionados, 290 referencias estáticas, 0 errores. Catálogo: 4 tarjetas directas, 5 familias, 23 formularios configurados, 241 campos, 80 opciones. No prueba funcionamiento E2E. |
| Términos y documentación | EXISTENCIA VERIFICADA; FUNCIONAMIENTO NO VERIFICADO | Términos, Privacidad, Arrepentimiento y Baja existen. Términos §1 describe gestión privada; §6 define precio final y tratamiento de costos; §7 exige acreditación verificable; la página de arrepentimiento contiene formulario/WhatsApp/correo. No se ejecutó envío real. No reescribir. |
| Honorarios AP | CONFIGURACIÓN COINCIDENTE | `services.js` y `service_price_options` coinciden: opciones de gestión 1 hora $20.000 y 6 horas $15.000. Son honorarios del propietario, NO un defecto. |
| **Exhibición de costo oficial** | **INCUMPLIMIENTO DE DIRECTIVA DEMOSTRADO EN CÓDIGO; VISUALIZACIÓN REAL NO PROBADA** | `services.js` contiene `officialFee: 0` para AP. `app.js`, función `renderServiceSummary`, añade una fila etiquetada `Costo oficial` siempre que `officialFee` no sea `null` ni `undefined` y muestra `formatARS(service.officialFee)`; el valor cero cumple esa condición. El código está preparado para mostrar `$0` como costo oficial, algo que el propietario prohibió. Corregir SOLAMENTE la exhibición de tasas oficiales en interfaz, con prueba de pantalla y sin tocar honorarios ni asumir que la tasa es el servicio vendido. Verificar antes que otros scripts no oculten ya esa fila en la vista publicada. |
| Precio final de la gestión | NO VERIFICADO E2E | `app.js` calcula precio local y Edge `create-request` consulta opciones de servidor. Falta cotejar total ofrecido, total guardado y gestión administrativa con una solicitud ficticia. No agregar montos oficiales. |
| Base de datos | CONFIGURACIÓN VERIFICADA; OPERACIÓN NO VERIFICADA | Supabase activo, diez tablas públicas con RLS. `anon` carece de SELECT directo sobre solicitudes, datos, archivos y admin. Falta prueba por rol. |
| Archivos | CONFIGURADO; OPERACIÓN NO VERIFICADA | Bucket `request-files` privado, límite 10 MiB; acepta JPEG/PNG/WebP/PDF. Falta comprobar subida permitida y bloqueo de acceso no autorizado. |
| Alta AP | CÓDIGO EXISTENTE; E2E NO VERIFICADO | `app.js` crea ficha local; `backend-sync.js` utiliza Edge `create-request`. No hay una prueba ficticia completa confirmada. |
| Comprobante y pagos | ESTADOS SEPARADOS EN CÓDIGO; OPERACIÓN NO VERIFICADA | Carga del comprobante → `payment_review`, no pago confirmado. Panel permite confirmación manual y trigger registra marca temporal. No se comprobó acreditación bancaria ni secuencia integral. |
| Notificación | NO VERIFICADA | Edge `confirm-payment` contiene envío de correo, mientras el puente frontend inspeccionado utiliza RPC `register_public_payment_receipt`; no se demostró envío por el flujo observado. No afirmar WhatsApp automático. |
| Seguimiento | CÓDIGO EXISTENTE; E2E NO VERIFICADO | `security-hardening.js` llama Edge `track-request` con código y últimos cuatro dígitos. Falta prueba desde otro dispositivo, errores y filtración de datos. |
| Admin sin segundo paso | REQUISITO RESPETADO; FUNCIONAMIENTO NO VERIFICADO | `admin.html` carga `admin.js` en modo desarrollo, conserva control de membresía. Se revirtió propuesta que imponía MFA. Probar entrada autorizada/no autorizada y cambio de estados, manteniendo acceso rápido. |
| Advertencias Supabase | OBSERVACIONES, NO EXPLOTACIÓN DEMOSTRADA | Asesor: 4 RPC públicas con privilegios elevados y protección de contraseñas filtradas desactivada. Funciones inspeccionadas tienen comprobaciones de token/estado; evaluar permisos sin cortar circuitos ni exigir segundo factor. |
| Datos locales | RIESGO A MEDIR | `app.js` guarda solicitudes/respuestas en `localStorage` y a veces adjuntos como `dataUrl`; puente y endurecimiento prevén limpieza en etapas. No se midió retención efectiva; minimizar solo después de asegurar persistencia recuperable. |
| Infraestructura comercial | POSPUESTA POR ORDEN | No comprar dominio/hosting ni impulsar registro durante pruebas. La validación usa alojamiento actual; despliegue comercial definitivo corresponde a decisión posterior. |

## 3. Lista cerrada de trabajo

1. **Comprobar visualmente** referencia aprobada en PC/móvil y detectar si la fila `Costo oficial` realmente aparece; si aparece, eliminar SOLO esa visualización en todas las fichas, sin alterar cálculos de honorarios, textos legales ni otras secciones. Probar regresión visual.
2. Probar alta AP con datos ficticios: validación, cotización de honorarios en frontend/backend, ficha en Supabase, recuperación de código.
3. Probar archivos y comprobante → pago en revisión; confirmar que no se indique acreditación hasta verificación efectiva.
4. Probar panel de desarrollo SIN MFA: cuenta administradora y no administradora, carga de ficha, actualización de estado, historial e inicio del plazo.
5. Comprobar notificación al propietario; si no opera, identificar ruta exacta y corregir fallos aislados sin prometer servicios externos no configurados.
6. Comprobar seguimiento en otro equipo, códigos incorrectos y privacidad de resultados.
7. Verificar RLS, RPC y acceso a archivos con identidades ficticias, sin eliminar funcionalidad ni imponer MFA; revisar conservación segura de documentación.
8. Probar enlaces y envío efectivo de los formularios legales existentes sin cambiar contenidos aprobados.
9. Pruebas regresivas E2E y capturas comparativas; registrar `PASS`, `FAIL` o `NO VERIFICADO` con evidencia y archivos afectados.
10. Validación del propietario. Sin publicar, fusionar cambios a `main`, modificar Supabase productivo ni contratar servicios pagos sin su autorización expresa.

## 4. Criterio de salida

**La V1 todavía NO está demostrada como funcional de principio a fin.** Las pruebas estáticas aprobaron solo su alcance. El trabajo debe resolver fallas reproducibles de programación, navegación, datos, pagos, seguimiento, privacidad y diseño conforme a las directivas, no reabrir el modelo comercial, publicar aranceles oficiales, comprar infraestructura ni imponer MFA durante desarrollo. Los impedimentos nuevos deben probarse y documentarse, no inferirse por preferencia del auditor.
