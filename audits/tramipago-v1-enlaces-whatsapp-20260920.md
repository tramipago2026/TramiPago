# TramiPago V1 — enlaces, botones y WhatsApp (auditoría 20/09/2026)

## Estado desambiguado

**TERMINADO EN RAMA DE PRUEBAS:** inventario de 23 servicios; 23 rutas de formulario; 181 enlaces internos HTML; 9 páginas conectadas con ayuda WhatsApp contextual; 23 rutas recorridas en Chromium PC y 23 móvil; cuatro tarjetas directas, cinco familias (incluida Partidas por tipo/jurisdicción y Abogado con cuatro temas de WhatsApp); comprobación ficticia de mensajes de pago pendiente y finalizado. No se han usado clientes ni emitido mensajes. [Auditoría de enlaces](https://github.com/tramipago2026/TramiPago/actions/runs/35553245068) y [navegador real aislado](https://github.com/tramipago2026/TramiPago/actions/runs/35553565244).

**PENDIENTE:** publicación en `main`/GitHub Pages; pruebas de operaciones reales contra Supabase aislado (crear ficha, cargar documentos, comprobar recepción desde admin, pago revisado manualmente, actualizar estados, seguimiento desde otro dispositivo), seguridad y retención, envío automático a WhatsApp mediante integración autorizada, verificación manual de cada enlace externo gubernamental (la prueba de navegación bloqueó Internet). No afirmar que 23 operaciones comerciales funcionan por completo. La foto de Legalizaciones y Apostillas sigue duplicando la portada de Partidas y requiere imagen propia aprobada. Las pruebas de navegación no envían formularios.

## WhatsApp

Destino único: `https://wa.me/5491167083232`. El botón abre un borrador editable con origen (botón), servicio/categoría, etapa, código válido si existe, estado conocido y pregunta sugerida; el cliente debe pulsar «Enviar». No añade DNI, contraseña ni archivos. Para una solicitud sin código todavía indica el trámite y el paso. Para seguimiento toma el código indicado en el campo. **No existe notificación automática de WhatsApp al administrador ni prueba de mensaje recibido**. El prototipo anterior de alerta por correo queda descartado por la directiva del propietario; no debe desplegarse.

## Índice completo de enlaces

Los vínculos siguientes son las rutas objetivo del sitio, no una afirmación de que los cambios del PR estén publicados. El archivo base es `https://tramipago2026.github.io/TramiPago/`.

| Servicio | Ruta |
|---|---|
| Antecedentes Penales | [AP](https://tramipago2026.github.io/TramiPago/#/tramite/antecedentes-penales) |
| Informe Vehicular | [Informe](https://tramipago2026.github.io/TramiPago/#/tramite/informe-vehicular) |
| Constancias ANSES | [ANSES](https://tramipago2026.github.io/TramiPago/#/tramite/constancias-anses) |
| ARBA / Inmobiliario | [ARBA](https://tramipago2026.github.io/TramiPago/#/tramite/arba-inmobiliario) |
| Partidas PBA | [PBA](https://tramipago2026.github.io/TramiPago/#/tramite/partidas) |
| Partidas CABA | [CABA](https://tramipago2026.github.io/TramiPago/#/tramite/partidas-caba) |
| Asistencia Digital | [Asistencia](https://tramipago2026.github.io/TramiPago/#/tramite/asistencia-digital) |
| Constancia ARCA | [Constancia](https://tramipago2026.github.io/TramiPago/#/tramite/arca-constancia) |
| Generar VEP | [VEP](https://tramipago2026.github.io/TramiPago/#/tramite/arca-vep) |
| Deuda / saldos CCMA | [CCMA](https://tramipago2026.github.io/TramiPago/#/tramite/arca-ccma) |
| Reimputación | [Reimputación](https://tramipago2026.github.io/TramiPago/#/tramite/arca-reimputacion) |
| Informe y reimputación | [Informe y reimputación](https://tramipago2026.github.io/TramiPago/#/tramite/arca-informe-reimputacion) |
| Alta de Monotributo | [Alta](https://tramipago2026.github.io/TramiPago/#/tramite/arca-alta-monotributo) |
| Baja de Monotributo | [Baja](https://tramipago2026.github.io/TramiPago/#/tramite/arca-baja-monotributo) |
| Recategorización | [Recategorización](https://tramipago2026.github.io/TramiPago/#/tramite/arca-recategorizacion) |
| Domicilio Fiscal Electrónico | [DFE](https://tramipago2026.github.io/TramiPago/#/tramite/arca-dfe) |
| Actualización de datos ARCA | [Actualización](https://tramipago2026.github.io/TramiPago/#/tramite/arca-actualizacion) |
| Apostillado | [Apostillado](https://tramipago2026.github.io/TramiPago/#/tramite/apostilla-tad) |
| Legalizaciones | [Legalizaciones](https://tramipago2026.github.io/TramiPago/#/tramite/legalizaciones) |
| Consulta ART | [ART](https://tramipago2026.github.io/TramiPago/#/tramite/abogado-art) |
| Consulta accidentes | [Accidentes](https://tramipago2026.github.io/TramiPago/#/tramite/abogado-accidentes) |
| Consulta sucesiones | [Sucesiones](https://tramipago2026.github.io/TramiPago/#/tramite/abogado-sucesiones) |
| Consulta laboral | [Laboral](https://tramipago2026.github.io/TramiPago/#/tramite/abogado-laboral) |

La pantalla aprobada de abogado **no** muestra cuatro botones `Elegir trámite`: muestra cuatro botones de tema y un formulario propio de WhatsApp; se probó su funcionamiento en lugar de alterar ese diseño. Las cuatro rutas `#/tramite/abogado-*` sí existen como formularios y se verificaron individualmente. Partidas se inicia normalmente desde [el selector por tipo y jurisdicción](https://tramipago2026.github.io/TramiPago/#/familia/partidas-pba).

## Evidencia verificable

- [Informe JSON de enlaces y 23 accesos](https://github.com/tramipago2026/TramiPago/actions/runs/35553245068/artifacts/10618917143), resultados de escaneo de 10 HTML y 181 enlaces locales.
- [Informe JSON de navegación real PC/móvil](https://github.com/tramipago2026/TramiPago/actions/runs/35553565244/artifacts/10619526506), incluidas muestras ficticias de estado pendiente/finalizado.
- Ninguna de estas pruebas demuestra acreditación bancaria, respuesta del servidor de WhatsApp, recepción en teléfono o enlace oficial gubernamental actualizado.
