# Activar el guardado privado

La interfaz aprobada está en `app.html`. La demostración `demo.html` continúa separada y nunca guarda movimientos. No se importan los importes de ejemplo ni los registros de la prueba ficticia.

## Desde el teléfono

1. Abrir https://jonaymeli42-hub.github.io/Control-gastos/app.html y entrar con la cuenta Google autorizada.
2. Si aparece «Falta habilitar el guardado privado», tocar **Copiar reglas completas**.
3. Abrir el enlace **Abrir reglas de Firestore** (proyecto `control-de-gastos-72453`). En Firestore → Reglas, reemplazar TODO el contenido por el texto copiado y tocar **Publicar**.
4. Volver a la aplicación y tocar **Revisar conexión**. Debe indicar cuenta conectada y mostrar saldo cero si todavía no hay registros. No modificar `_config/access` ni volver a proporcionar el UID: la cuenta autorizada se conserva.

Las reglas completas están en [firestore.rules](../firestore.rules). No usar reglas abiertas, modo de prueba ni habilitar facturación. Publicar estas reglas habilita únicamente el documento financiero privado de la cuenta ya autorizada; conserva los diagnósticos independientes.

## Primera prueba antes de usar datos reales

- Registrar un importe ficticio pequeño en Sueldo diario y esperar **Guardado confirmado en Firebase**.
- Recargar y comprobar que permanece. Consultar desde otro dispositivo con la misma cuenta si está disponible.
- Crear una categoría, registrar un gasto ficticio, editarlo y comprobar el total de la categoría. Eliminar ambos movimientos al terminar.
- Abrir Respaldo. La conexión de Drive existente se puede reutilizar. Conectar si hace falta y esperar **Última copia confirmada**; esta confirmación es distinta del guardado en Firebase.
- Consultar copias y descargar la copia completa. Restaurar una copia ficticia de esta nueva aplicación requiere confirmar reemplazo y primero conservar una copia del estado actual en Drive.
- Las copias antiguas con modo `diagnostic-only` permanecen en Drive, pero no se pueden restaurar como movimientos.

No se afirma que la escritura financiera real esté habilitada hasta publicar las reglas y comprobar el primer guardado en el proyecto real. El entorno de desarrollo no tiene credenciales administrativas de Firebase.

## Funcionamiento y límites

- Un documento `users/{uid}/financial/ledger` conserva movimientos y categorías de forma atómica. Una transferencia o pase entre meses es un registro con dos efectos, nunca dos escrituras independientes.
- Cada transacción incrementa la revisión. La edición iniciada sobre una revisión anterior falla con un mensaje de conflicto; no sobrescribe cambios de otro dispositivo. El formulario permanece disponible cuando falla el guardado.
- Una respuesta perdida se contrasta con el servidor y el identificador de la mutación para evitar duplicados. No se muestran modificaciones locales como guardadas antes de la confirmación.
- No se utiliza almacenamiento local persistente de registros financieros. La sesión de Firebase permanece en este dispositivo hasta cerrar sesión o perder la autorización. Sin Internet se pueden consultar datos ya mostrados, pero no guardar cambios; las copias de Drive pendientes sí se reintentan al volver la conexión y mantener la app abierta.
- El respaldo se obtiene con una lectura completa desde el servidor, incluye categorías, ambas partes de los movimientos y checksum SHA-256. No restaura datos automáticamente. Restauración exige copia previa confirmada y transacción sobre la revisión leída antes de esa copia.
- Las reglas verifican propietario, ruta, esquema envolvente, listas acotadas, marca de tiempo y revisión. La validación detallada de importes, fechas, categorías y vínculos se realiza en `ledger-model.js` antes de escribir, leer o restaurar. Solo el propietario puede escribir; el esquema del contenido de cada elemento no se valida en bucle por reglas.
- Límite inicial conservador: 4.000 operaciones, 100 categorías y 600.000 bytes JSON del contenido (por debajo del máximo de documento de Firestore). Al llegar al límite se rechaza la nueva escritura sin borrar registros. Se deberá implementar partición/migración antes de ampliar ese límite; no hay borrado ni archivado automático.
- Opciones fijas reutilizables e instalación como app quedan para la siguiente mejora; no hay generación automática de movimientos.
