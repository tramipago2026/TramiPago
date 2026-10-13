# TramiPago V2 — Plano Maestro | Directivas 13 y 14

**Estado:** V2 TÉCNICA EN STAGING AISLADO. No publicada en producción ni integrada a V1.
**Referencia visual inalterable:** `Portada-v2.png` entregada por el usuario el 11/10/2026, opción C (híbrido V1 + propuesta profesional B).
**Marco:** chat 00, chat 11, controles 2/3/4, Directivas 13 y 14. El diseño aprobado NO se altera sin propuesta y aceptación explícitas. Estado y pendientes contrastados: `v2/INTEGRACION-CHAT11-CHAT12.md`.

## 1. Aislamiento verificable
- Repositorio de origen: `tramipago2026/TramiPago`.
- Rama de trabajo: `v2/opcion-c-directiva13` (no es `main`).
- Ubicación exclusiva del código nuevo: `/v2/**` y pruebas específicas V2.
- No tocar `index.html`, `app.js`, `services.js`, `site.css`, `admin/**`, configuraciones de publicación, DNS, Cloudflare ni backend de V1.
- Staging V2 aislado está autorizado y operativo fuera de la rama productiva. Producción/cutover, `main`, V1 y DNS productivo requieren autorización expresa y permanecen fuera de alcance.
- No usar PII real en pruebas. V2 usa ambiente TEST aislado: MySQL Aiven + Worker/Hyperdrive + Better Auth/MFA. B2 y Resend permanecen fail-closed mientras no existan credenciales TEST. No conectar recursos productivos de V1. Consultar `v2/INTEGRACION-CHAT11-CHAT12.md`; Chat 09 queda como antecedente de la propuesta Firestore reemplazada para V2.
- No indexación mientras esté en pruebas: futuras páginas V2 incorporarán `noindex,nofollow` hasta autorización de publicación.

## 2. Arquitectura funcional y orden

```
/v2/                                 Portada opción C
├── tramites/                         Catálogo de trámites individuales
│   └── <slug>/                       Formulario directo + resumen en la misma pantalla
│       ├── iniciar/                  Entrada compatible al mismo formulario
│       ├── revisar/                  Ruta compatible de revisión; no paso obligatorio adicional
│       └── pago/                     Medio de pago sólo luego de revisión
├── categorias/                       Todas las familias/agrupaciones
├── familias/<slug>/                 Familia → trámites
├── buscar/?q=...                     Resultados V2 (no externo)
├── seguimiento/                      Consulta por código en V2
├── ayuda/                             Centro de ayuda V2 (no WhatsApp)
├── contacto/                         Canal de contacto
├── terminos-condiciones/             Texto legal, versión a contrastar
├── politica-privacidad/              Texto legal, versión a contrastar
├── arrepentimiento/                  Derechos del usuario
└── baja-servicio/                    Derechos del usuario
```

**Nota técnica:** rutas de carpetas requieren `index.html` para GitHub Pages; no usar enlaces `/#/tramite` ni otras rutas V1 en V2. Toda URL fija debe resolver al cargar y actualizar, no sólo mediante clicks SPA.

## 3. Portada: componentes congelados
Mantener de la imagen aprobada: logo; cuatro elementos de menú (Inicio, Trámites, Seguimiento, Ayuda); foto de dos personas y texto `Resolvé tus trámites rápido y simple`; buscador; asistencia WhatsApp; dos filas de cuatro tarjetas; franja de beneficios; pie © 2026 TramiPago. No cambiar posiciones, cantidades, textos aprobados o estética por iniciativa propia.
- Buscador + Buscar → `/v2/buscar/?q=...`.
- Acceso a asistencia WhatsApp → enlace externo oficial autorizado, abriendo nueva pestaña.
- Trámites más buscados: Antecedentes Penales, Constancias ANSES, Informe Vehicular, ARBA/Inmobiliario → fichas individuales.
- Categorías: Partidas y Certificados, ARCA, Legalizaciones y Apostillas, Reclamo ART → respectivas familias. Reclamo ART se resuelve provisionalmente como **familia atención con abogado** por subtítulo `Accidentes, laboral, sucesiones`; antes de fijar el enlace en la plantilla visual se verificará este criterio.
- `Ver todas las categorías` → `/v2/categorias/`.
- `Ver todos los trámites` → `/v2/tramites/`. Repetición con enlace superior justificada por descubrimiento contextual en sección distinta; pendiente decisión UX si se desea eliminar acción, sin quitarla de imagen autorizada.
- Logo + Inicio pueden apuntar ambos a `/v2/` por patrón UX habitual; nunca cambiar el aspecto sin autorización.
- Franja de beneficios: texto informativo, sin botones redundantes (seguimiento inferior no duplica CTA).
- Legales y contacto → rutas propias V2.

## 4. Inventario reconstruido del código V1 (NO validación oficial)
Origen consultado en lectura: `services.js`, `service-pages.json`, `tramites-catalog.js`.
- **26 entradas con `codePrefix` en `TRAMI_SERVICES`**, incluida `arca-monotributo` como nodo general.
- **25 slugs de servicio** expuestos por `service-pages.json`; `arca-monotributo` funciona como familia y no debe crear un segundo servicio duplicado.
- **5 páginas de familia** en `service-pages.json`: ARCA / Monotributo, Partidas y Certificados, Asistencia Digital, Legalizaciones y Apostillas, Atención con abogado.
- **2 accesos municipales**: José C. Paz y San Miguel, a estudiar con esquema de categorías, sin inventar trámites.
- "95 trámites" es un número histórico de catálogo proyectado, no equivale a 95 servicios operativos verificados.
- Ningún importe/tasa/plazo oficial se traslada a V2 como información vigente sin CONTROL 2 y revisión de precio final vigente.

## 5. Plantillas técnicas (una instancia por tipo, contenido configurado)
1. Portada (referencia visual C obligatoria)
2. Listado de categorías
3. Listado de todos los trámites
4. Familia
5. Ficha de trámite
6. Formulario de etapas (campos particulares por configuración, controles accesibles)
7. Revisión previa al pago (resumen, monto final, consentimiento)
8. Pago / carga de comprobante (estado backend operativo; carga real de archivo bloqueada hasta configurar B2 TEST)
9. Confirmación y código (respuesta real del backend V2 TEST)
10. Seguimiento (código, estado, correcciones; no respuestas simuladas como reales)
11. Buscador / resultados
12. Ayuda y contacto
13. Legal (Términos, Privacidad, Arrepentimiento, Baja)

## 6. Reglas para formularios y migración
- Reutilizar la **configuración específica** de servicios existente como referencia, pero no ejecutar `services.js` de V1 dentro del nuevo frontend.
- Reutilizar patrones operativos validados, no duplicar motor en cada servicio; motor de pasos genérico y definición tipada por servicio.
- Cada paso requiere validación de cliente y de servidor, control de archivos, consentimiento y reglas del trámite.
- **Modo TEST** sin peticiones a backend de producción; no emitir comprobantes, pagos, códigos ni confirmaciones ficticias.
- Contrato frontend/backend V2 se versiona en `v2/contracts/api-v2.contract.json` y `v2/INTEGRACION-CHAT11-CHAT12.md`. API core, borradores, revisión/envío, seguimiento, ayuda, correcciones, flujo de pago y Admin están implementados y validados en staging TEST. Documentos B2 y envío Resend permanecen bloqueados por credenciales externas pendientes.

## 7. Matriz CONTROL 4
| Elemento | Destino | Regla |
|---|---|---|
| Inicio / logo | /v2/ | Doble acceso estándar justificado |
| Trámites / Ver todos los trámites | /v2/tramites/ | Acceso contextual justificado; revisar propuesta |
| Seguimiento | /v2/seguimiento/ | Un CTA; beneficios no enlace |
| Ayuda | /v2/ayuda/ | Centro de ayuda, no WhatsApp |
| Buscador | /v2/buscar/ | Query codificada; sin navegar V1 |
| WhatsApp asistencia | Externo (wa.me) | Excepción expresa |
| Tarjetas directas 4 | /v2/tramites/<slug>/ | Ficha directa |
| Familias 4 | /v2/familias/<slug>/ | Familia, no trámite directo |
| Ver categorías | /v2/categorias/ | Distinto de catálogo |
| Footer legales / contacto | /v2/... | Nunca páginas V1 |

## 8. Puertas de calidad
1. Inventario y destinos de enlaces; archivos/rutas existentes; no enlaces a V1 inadvertidos.
2. Prueba estática de navegación y duplicaciones de propósito; tabulación/accesibilidad; móvil/escritorio.
3. Pruebas de formularios con datos sintéticos: campos, validación, errores, resumen.
4. Integración E2E TEST con Auth/API y rollback controlado; archivos B2 se validarán cuando exista bucket/credenciales TEST.
5. CONTROL 3 sólo cuando hay despliegue autorizado: código+pruebas, despliegue real, verificación independiente.
6. No habilitar contratación productiva hasta aprobar la ficha modelo y el modelo comercial y verificar las dependencias externas. CONTROL 2 y sus valores oficiales quedan fuera de las fichas públicas, según instrucción del usuario.

## 9. Estado de la iteración actual — 12/10/2026
- Fuente de rutas, páginas, navegación, buscador, formularios compartidos, seguimiento, ayuda, flujo de pago y Admin V2: construidos.
- CONTROL 4 frontend: SUCCESS.
- Staging real: activo en Worker V2 aislado.
- Live Preview E2E: 142 rutas HTML + 78 enlaces/assets + 25 servicios: SUCCESS.
- Browser E2E cliente → Worker → MySQL: SUCCESS.
- Admin Browser E2E + MFA: SUCCESS.
- Portada Opción C: hero original recuperado del ZIP y ocho imágenes de tarjetas de la referencia aprobada, publicados y verificados por tamaño/hash. Sin sustitutos generados ni textos provisionales.
- Logo: PNG RGBA con letras completas, fondo exterior transparente y margen; orden de capas y menú verificados en nueve tamaños de pantalla. Tamaño y ubicación visual conservados.
- Los 25 trámites abren directamente el formulario con resumen local; progreso compartido de tres pasos, o dos en consultas sin pago. Pasos completos verdes, actual azul y pendientes grises. No se exige repetir el correo.
- CONTROL 2 y valores oficiales retirados de todas las fichas y datos públicos; reporte interno conservado exclusivamente en el backend privado.
- Backup lógico cifrado y restauración aislada: verificados. La copia externa persistente es un pendiente distinto.
- B2 y Resend: `pending` en las dependencias del staging verificado. CA de Aiven para TLS directo estricto, destino/OAuth de backup externo y ficha modelo/modelo comercial siguen pendientes. Producción/cutover está fuera del alcance autorizado.

## 10. Integración aprobada con chat 12 (11/10/2026)

MySQL real es el destino explícito para V2. A diferencia del antecedente Firebase del chat 09, las capas Auth/MFA, almacenamiento, API, email y respaldos se construyen modularmente con proveedores sujetos a pruebas independientes. Ningún cambio en V1 ni corte de producción está autorizado. Contrato de coordinación: `v2/INTEGRACION-CHAT11-CHAT12.md` y `v2/contracts/api-v2.contract.json`, con equivalentes versionados en la rama backend `v2-mysql-chat12-integration` del repositorio privado `TramiPago-web`.

## 11. Criterio legal práctico y enlaces gubernamentales (13/10/2026)

- Las páginas legales V2 se mantienen comprensibles, proporcionadas al servicio privado de asistencia, sin exigir una auditoría exhaustiva de cada portal externo ni bloquear V2 porque un sitio del Gobierno no responda. La revisión se concentra en identidad/contacto reales, información sobre la contratación, privacidad, baja/arrepentimiento y demás derechos y obligaciones que correspondan.
- **No eliminar derechos legales del cliente ni sustituir requisitos obligatorios por simples avisos.** Simplificar lenguaje y validaciones accesorias no significa prescindir de obligaciones legales.
- **En V2, no colocar enlaces clicables externos que lleven a dominios gubernamentales** (por ejemplo, *.gob.ar, *.gov.ar, *.gov). La disponibilidad de un portal estatal no debe ser requisito técnico para cargar formularios, navegar, solicitar ayuda o consultar estados en TramiPago.
- Si resulta pertinente mencionar una fuente estatal, conservar sólo la denominación o referencia como texto no interactivo; los enlaces verificables y comprobaciones de CONTROL 2 quedan en documentos internos, no como dependencias de la experiencia pública.
- Mantener operativos los enlaces **internos de TramiPago** y los canales propios (WhatsApp y correo), así como las rutas de privacidad, términos, arrepentimiento y baja.
- CONTROL 4 recorre todas las páginas públicas y rechaza cualquier `<a href>` hacia dominios gubernamentales. No realizar pruebas de disponibilidad de esos sitios externos para aprobar staging. Las verificaciones independientes siguen concentradas en funciones y recursos propios de V2.
