# TramiPago V2 — Plano Maestro | Directiva 13

**Estado:** BORRADOR TÉCNICO EN DESARROLLO, sin publicación.
**Referencia visual inalterable:** `Portada-v2.png` entregada por el usuario el 11/10/2026, opción C (híbrido V1 + propuesta profesional B).
**Marco:** chat 00, chat 11, controles 2/3/4, Directiva 13. El diseño aprobado NO se altera sin propuesta y aceptación explícitas.

## 1. Aislamiento verificable
- Repositorio de origen: `tramipago2026/TramiPago`.
- Rama de trabajo: `v2/opcion-c-directiva13` (no es `main`).
- Ubicación exclusiva del código nuevo: `/v2/**` y pruebas específicas V2.
- No tocar `index.html`, `app.js`, `services.js`, `site.css`, `admin/**`, configuraciones de publicación, DNS, Cloudflare ni backend de V1.
- No publicar ni crear/desplegar un entorno público sin autorización adicional. V2 permanecerá fuera de la rama productiva.
- No usar PII real en pruebas. No conectar pagos, archivos, correo, autenticación o base productivos hasta disponer de adaptador y ambiente TEST validados. Cambio backend definitivo se coordina con chat 09 (Firestore); no se asume que Auth/Storage deban migrar a la vez.
- No indexación mientras esté en pruebas: futuras páginas V2 incorporarán `noindex,nofollow` hasta autorización de publicación.

## 2. Arquitectura funcional y orden

```
/v2/                                 Portada opción C
├── tramites/                         Catálogo de trámites individuales
│   └── <slug>/                       Ficha individual
│       ├── iniciar/                  Formulario: etapas y validación
│       ├── revisar/                  Resumen previo a contratación
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
8. Pago / carga de comprobante (bloqueado en TEST sin backend)
9. Confirmación y código (sólo desde respuesta real backend)
10. Seguimiento (código, estado, correcciones; no respuestas simuladas como reales)
11. Buscador / resultados
12. Ayuda y contacto
13. Legal (Términos, Privacidad, Arrepentimiento, Baja)

## 6. Reglas para formularios y migración
- Reutilizar la **configuración específica** de servicios existente como referencia, pero no ejecutar `services.js` de V1 dentro del nuevo frontend.
- Reutilizar patrones operativos validados, no duplicar motor en cada servicio; motor de pasos genérico y definición tipada por servicio.
- Cada paso requiere validación de cliente y de servidor, control de archivos, consentimiento y reglas del trámite.
- **Modo TEST** sin peticiones a backend de producción; no emitir comprobantes, pagos, códigos ni confirmaciones ficticias.
- Contrato frontend/backend V2 se acordará con chat 09; pagos reales, emails y entrega documental permanecen bloqueados hasta pruebas integrales.

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
4. Integración E2E TEST con Auth/API/archivos y rollback controlado (coord. chat 09).
5. CONTROL 3 sólo cuando hay despliegue autorizado: código+pruebas, despliegue real, verificación independiente.
6. No cerrar ni habilitar contratar hasta disponer de requisitos oficiales CONTROL 2 y servicio backend real verificado.

## 9. Próxima iteración
Crear fuente de rutas V2, generador de páginas, componentes de navegación y tests; contrastar fidelidad de portada con la imagen aprobada sin transformar la imagen en interfaz estática ni cambiar el diseño. Fotografía de portada separada en alta calidad **no localizada aún** en el repositorio; conservar imagen de referencia y declarar el bloqueo antes de cerrar el hero.

**Estado al iniciar:** rama V2 creada, plano maestro definido en borrador; ni sitio completo ni navegación E2E acreditados todavía.
