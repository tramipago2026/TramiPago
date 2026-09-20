# TramiPago V1 — ejecución de auditoría funcional y visual (20/09/2026)

## Directivas de alcance (no reabrir)
TramiPago está en desarrollo, no registrado, sin contratación de dominio ni hosting pagos hasta superar todas las pruebas. Cobra honorarios por gestión independientes de tasas oficiales; no publicar importes de tasas oficiales bajo ningún concepto ni alterar honorarios aprobados. Durante construcción conservar panel sin MFA por decisión del propietario, manteniendo los controles de identidad/membresía. No rediseñar cabecera, pie, imágenes ni botones aprobados. No modificar `main`, Supabase productivo ni desplegar sin autorización.

## Inventario obtenido del catálogo real
23 servicios configurados y activos; 18 de circuito con pago y 5 de consulta/derivación. La palabra activo significa habilitado en el catálogo, NO circuito E2E verificado. Cinco familias y cuatro tarjetas directas.

**Con pago (18):** Antecedentes Penales; Informe Vehicular; Constancias ANSES; ARBA/Inmobiliario; Partidas PBA; Asistencia Digital; Constancia ARCA; Generar VEP; Informe de deuda y saldos CCMA; Reimputación de pagos; Informe + reimputación; Alta en Monotributo; Baja en Monotributo; Recategorización; Domicilio Fiscal Electrónico; Actualización de datos ARCA; Apostillado; Legalizaciones.

**Consulta/derivación (5):** Partidas CABA; Reclamo ART/accidente laboral; Accidentes; Sucesiones; Consulta laboral. No simular un pago obligatorio para `intakeOnly`.

## Agente ficticio reproducible
`tests/v1-fixture-audit.mjs` carga la configuración real de `services.js`, `arca-family.js` y `extra-families.js`, genera respuestas sintéticas para cada servicio, cada opción de campos de selección/elección, cada alternativa `anyOf`/`oneOfGroups` y cada modalidad de honorarios. Verifica obligatorios, formato sintáctico básico, identificación de alternativas, vínculos tarjetas-familias y precios configurados. Archivos simulados son objetos en memoria, nunca documentos reales. Correo `example.invalid`, teléfono sintético y números de documento deliberadamente ficticios/no válidos: **no se deben presentar a organismos ni enviar a sistemas de producción**.

Ejecución aprobada en GitHub Actions 35544190698: **127 escenarios sintéticos DE ESQUEMA**, 23 fichas, 241 campos, 80 opciones en catálogo; 43 recursos `assets`, 0 grupos de archivos binariamente idénticos. El primer simulador falló al tratar como obligatorio un archivo opcional de la alternativa del DNI: fue un fallo del simulador, corregido para aceptar campo opcional vacío; la repetición sí pasó. Resultados no equivalen a registro backend, capturas, SMS, correo, WhatsApp ni cobros.

## Correcciones ACOTADAS listas en rama de revisión (no desplegadas)

- `app.js`: eliminada la presentación de la fila «Costo oficial» en las fichas. Conservar bloques «Incluye», «Requisitos», «Precio y plazo», los honorarios y los demás estilos. No modificar `services.js` ni cotizaciones.
- `extra-families.js`: retiradas exclusivamente dos frases que publicaban importes oficiales en requisitos de Apostillado y Legalizaciones; se mantienen los honorarios, las condiciones generales de costo adicional y el resto de los textos.
- `index.html`: actualizados exclusivamente los parámetros `?v=` de `app.js` y `extra-families.js` para evitar servir sus versiones cacheadas DESPUÉS de una eventual publicación autorizada; NO se borró caché de navegadores ni datos de clientes.
- `tests/live-site-smoke.mjs`: actualizada la versión esperada del script para la futura verificación HTTP. `tests/v1-directives.mjs`: prueba regresiva contra publicación de costo oficial, cambio accidental de honorarios y activación unilateral de MFA.

La ejecución de corrección 35544484951 pasó las verificaciones de sintaxis, integridad, contratos, 127 casos ficticios y commit solo en rama de trabajo. Respaldo preauditoría: `backup/tramipago-v1-preaudit-20260920`.

## Limpieza segura (sin borrar a ciegas)

- Retirado en la rama de revisión `.github/workflows/municipal-hover-align-20260919.yml`: flujo de una ejecución obsoleto; contiene `git rm` de sí mismo después de funcionar y exige una versión previa de CSS que ya no coincide con `index.html`. El CSS municipal vigente no fue tocado.
- Eliminados del mismo entorno `.github/workflows/v1-focused-fix.yml` y `scripts/v1-focused-fix.mjs` una vez aplicado y validado su parche: herramientas temporales no destinadas a producción.
- Candidato no referenciado literalmente desde los HTML/JS/CSS públicos: `assets/justicia-balanza-martillo-20260918.svg`. No se elimina sin demostrar ausencia de dependencias indirectas/externas, test o referencia documental. Ningún duplicado binario en los 43 assets.
- No vaciar `localStorage`, `sessionStorage`, Storage ni datos de Supabase como «caché»: podrían contener fichas/comprobantes pendientes. Invalidación de caché de scripts vía nueva versión `?v=` solo tras despliegue.

## Diseño gráfico y uniformidad

**Confirmación por código:** las tarjetas del catálogo usan la misma función de render y CSS compartida; CSS de portada contiene ancho maestro de 154 px para `.home-catalog .home-tile` y estilos comunes `.catalog-card-title`. Esto no demuestra igualdad de tamaños visuales, legibilidad, encuadre ni tipografía efectiva bajo otros estilos/medias.

**Inconsistencia de contenido visual demostrada:** familia `legalizaciones-apostillas` utiliza exactamente la imagen `assets/partidas-familia-final.webp`, también asignada a `partidas-pba`. No se reemplazó porque la fotografía editorial aprobada para legalizaciones no fue identificada y cambiarla al azar violaría la directiva visual. Requiere imagen propia y validación del propietario.

**NO VERIFICADO:** capturas PC/móvil, recortes y alineaciones de iconos, proporciones de las subtarjetas, fuentes renderizadas, hover, contraste y superposiciones tras las últimas incorporaciones. No afirmar que el diseño ya quedó uniforme basándose en que comparte CSS.

## Matriz de circuito (cada servicio y variante sigue pendiente E2E)

1. **Cliente:** elegir servicio/variante → validar campos y requisitos → revisar honorarios y condiciones → registrar solicitud backend y código.
2. **Documentos:** carga ficticia en bucket privado; confirmar en BD solo archivos asociados a solicitud propia.
3. **Pago:** informar transferencia y subir comprobante → `payment_review` sin fingir acreditación.
4. **Aviso administrador:** código + servicio + alerta de comprobante en canal comprobable; la ruta inspeccionada usa RPC `register_public_payment_receipt` y NO mostró disparo de la Edge `confirm-payment` que tiene integración con Resend. WhatsApp automático tampoco está comprobado; WhatsApp público de ayuda es botón manual. **BLOQUEANTE A RESOLVER.**
5. **Admin:** iniciar sesión en modo desarrollo sin MFA; mostrar datos autorizados, cambiar manualmente `payment_confirmed` solo tras cotejo real; estados `needs_info`, `in_progress`, `finalized`, `cancelled`, conservar historial. La existencia de triggers/código no prueba funcionamiento.
6. **Cliente:** consulta desde otro dispositivo con código y verificación; evitar exposición de datos completos por código; rectificación, entrega y cancelación según reglas y tipo de servicio.
7. **Cierre:** contrastar las fichas/alternativas con pruebas E2E reales en entorno aislado y datos ficticios aceptados únicamente por entorno de prueba, revisar capturas PC/móvil, regresiones, aprobación del propietario y autorización explícita de publicación.

**Limitación concreta:** no existe en esta ejecución un entorno separado confirmado para Supabase, ni sesión de prueba admin, ni credenciales verificadas de proveedor de notificaciones; tampoco se realizaron transferencias, envíos de WhatsApp, solicitudes reales ni capturas comparativas. No se han validado los 23 circuitos E2E; 127 es el número de escenarios estructurales aprobados, NO número de transacciones.

## Pendientes prioritarios verificables

P1. Completar canal de alerta al administrador tras comprobante y mostrar un error recuperable si falla; no asumir que configurar SMTP/Resend equivale a aviso al celular.
P2. Ensayo E2E aislado AP con secuencia completa, prueba negativa de pago sin acreditación y transición de estados desde panel.
P3. Ensayo E2E de los restantes 17 servicios pagados y 5 consultas según alternativas, sin testear contra organismos oficiales.
P4. Auditoría visual real PC/móvil y sustitución de fotografía errónea en legalizaciones/apostillas por una aprobada sin rediseño.
P5. Validar privacidad, retención de documentos, permisos y seguimiento con cuentas ficticias; conservar velocidad de acceso admin durante construcción.
P6. Verificar que cambios en PR solo afecten archivos autorizados y obtener aprobación expresa antes de fusionar `main` o publicar.

**Estado:** corrección comercial preparada y comprobada en rama; inventario/esquema comprobado; circuito comercial completo y uniformidad visual aún NO VERIFICADOS. No declarar V1 terminada.
