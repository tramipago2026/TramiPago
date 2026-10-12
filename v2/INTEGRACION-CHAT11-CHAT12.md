# TramiPago V2 — Acuerdo técnico Chat 11 ↔ Chat 12

**Versión contractual:** `2026-10-11.d13-c12-draft1` — **BORRADOR, NO IMPLEMENTADO**.

## Decisión y prioridad
- La instrucción explícita del usuario en chat 12 fija **MySQL real** como base de datos objetivo de **TramiPago V2**, y reemplaza para este alcance la propuesta previa de Firestore en chat 09.
- El chat 11 sigue siendo dueño de la interfaz V2, navegación, catálogo, formularios y fidelidad a Opción C. El chat 12 define y construye el nuevo backend, sin tocar V1 ni la estética aprobada.
- El documento de origen exige estructura modular, con Cloudflare Workers + Hono (a validar), Auth/MFA con Better Auth o equivalente (a validar), MySQL sobre TLS, almacenamiento privado B2 (candidato), Resend y copias independientes restaurables.
- **No** seleccionar proveedor ni afirmar que existe plan gratuito utilizable hasta auditar límites, tarjeta, cuota, backups, conectividad y condiciones reales. Restricción comercial: no comprometer pagos.
- `TramiPago-web` es privado y aloja el backend histórico. La rama `v2-mysql-chat12-integration` sirve sólo para diseño/contratos. Definir repo backend privado definitivo con protección efectiva antes de subir componentes sensibles. **Nunca** publicar repositorio privado para conseguir branch protection.

## Separación de responsabilidades
| Responsabilidad | Chat 11 / frontend V2 | Chat 12 / backend V2 |
|---|---|---|
| Diseño C | Congelado; modificable sólo previa aprobación | No alterar |
| Catálogo | Render y rutas V2 | Servicios, precios y requisitos validados |
| Formularios | Campos y validación UX | Reglas server-side y autorización |
| Seguimiento | Pantalla y estados | Datos autorizados, tokens y rate limit |
| Documentos | Carga de interfaz | Storage privado, MIME/firma/tamaño/hash |
| Pagos | Experiencia del usuario | Estado, comprobante y control antifraude |
| Admin | UI aislada y navegación | Auth, MFA TOTP, permisos y auditoría |
| Emails | Mensajes UI | Resend, reintentos y observabilidad |
| Pruebas | Navegación, formularios, responsive | Seguridad, integración, restauración |
| Corte | Sólo tras autorización | Sólo tras autorización y CONTROL 3 |

## Contrato de interfaz
Fuente de revisión: `v2/contracts/api-v2.contract.json` (frontend) y `docs/v2-api.contract.json` (backend privado), sincronizados en esta versión.

**Las rutas de API son propuestas**, no endpoints publicados ni implementados. Cada operación equivale funcionalmente a una Edge Function previa sin copiar problemas, y conserva los ocho flujos de V1. Se debe completar el esquema JSON preciso de request/response, validación, permisos, formato de error, idempotencia y estados antes de conectar la UI.

Secuencia de usuario: catálogo → ficha → crear borrador y código del servidor → etapas del formulario → revisión → pago/comprobante → Admin → corrección si corresponde → seguimiento → finalización y entrega → correo. Ninguna etapa real se habilita sólo porque tenga HTML.

## Pendientes que impiden cierre
1. Inventario real y medición de tamaño/crecimiento Supabase (sólo lectura).
2. Comparar planes MySQL reales sin costos ni tarjeta y con acceso API/CLI, TLS y backups; si ninguno sirve, bloquear elección y presentar alternativas al usuario.
3. Definir red/transporte MySQL de Worker (Hyperdrive o alternativa verificada) y costo efectivo.
4. Definir Auth/MFA robustos compatibles con ese entorno, sin suponer que Better Auth funciona sin pruebas.
5. Esquema MySQL versionado + políticas server-side equivalentes a RLS, tests y migración fila a fila.
6. B2 privado / URL firmada y restauración comprobada.
7. Endpoints de ocho flujos, sesiones Admin/MFA, emails Resend.
8. E2E con datos sintéticos y pruebas negativas; prueba independiente de backup-restauración.
9. Informe **APTO/NO APTO**, autorización expresa de corte y CONTROL 3.

## Reglas de trabajo y estado
- Repositorios y ramas separados; staging y producción no comparten secretos ni datos TEST.
- Ningún enlace que nace dentro de V2 lleva a V1 (excepciones externas expresamente autorizadas).
- Sin acceso directo del navegador a MySQL.
- V1 y Supabase íntegros como fuente/rollback, no desconectar.
- Resultados sólo pueden etiquetarse CERRADOS con evidencias de código, test, despliegue autorizado y verificación independiente donde aplique.
- No hay sincronización automática entre conversaciones ChatGPT. **La fuente de coordinación son estos documentos versionados en GitHub y el contrato**.
