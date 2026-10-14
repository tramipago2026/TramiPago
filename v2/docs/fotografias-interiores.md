# Fotografías reales para páginas interiores de TramiPago V2

Las fotos fueron seleccionadas en páginas de Unsplash señaladas como **Free to use under the Unsplash License**, no generadas mediante inteligencia artificial. Se usan en categorías, familias y formularios interiores, no en la portada Opción C.

| Identificador | Tema visual | Fotografía original | Fotógrafo |
| --- | --- | --- | --- |
| partidas | Persona trabajando con documentos de oficina | https://unsplash.com/photos/woman-working-with-documents-at-office-desk-Vvn0OD0IxBM | Vitaly Gariev |
| arca | Papeles, calculadora y materiales de oficina | https://unsplash.com/photos/desk-with-papers-glasses-calculator-and-office-supplies-sW02MHv37yk | Cht Gsml |
| apostillas | Pasaporte abierto con sellos | https://unsplash.com/photos/passport-with-many-travel-stamps-LPdaW746WAw | Global Residence Index |
| abogado | Elementos jurídicos reales: libros, mazo y justicia | https://unsplash.com/photos/statue-of-justice-gavel-and-open-book-on-table-YFz39MOmxnQ | Sasun Bughdaryan |
| digital | Persona trabajando en una computadora portátil | https://unsplash.com/photos/person-using-laptop-computer-Hcfwew744z4 | Christin Hume |
| atencion | Atención administrativa con documentos | https://unsplash.com/photos/woman-working-with-documents-at-office-desk-Vvn0OD0IxBM | Vitaly Gariev |

Las fotografías se sirven **desde el mismo dominio de staging** por `/v2/photo/<id>.jpg`; se evita exponer directamente a los visitantes a dominios de terceros. El Worker mantiene una lista cerrada de archivos e impide crear un proxy arbitrario. Si una fotografía externa falla, se presenta una superficie de respaldo sin texto publicitario cortado.

El permiso de uso general de Unsplash se describe en https://unsplash.com/license; no sustituye derechos de marcas o personas representadas. Las fotografías son ilustrativas del tipo de gestión y **no representan documentos oficiales argentinos auténticos ni la realización efectiva de una gestión**.

La foto del informe vehicular utiliza provisionalmente un recurso fotográfico existente aprobado de V2 (`vehicular-opcion-c.webp`) mientras se selecciona una fotografía argentina sin sobreimpresiones que lo mejore.
