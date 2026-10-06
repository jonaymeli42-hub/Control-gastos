# Adaptación del Worker compartido

## Referencia y alcance

Código fuente completo recibido del usuario en Codex el 2026-10-06, copiado desde su Worker. worker/original.js conserva esa implementación con sangría normalizada; no es una descarga autenticada del despliegue. worker/worker.js es la propuesta, aún sin desplegar ni verificar con Google real.

Cambios de comportamiento:

1. APPS agrega gastos → /Control-gastos/. Préstamos/Tarjetas mantienen rutas actuales.
2. Validación explícita de cada identificador: se conservan formatos anteriores, y gastos requiere control-gastos-backup, schemaVersion 1, source firestore, complete true, revisión entera no negativa, snapshotId, fecha válida, horario argentino y arrays operations/cases/templates.
3. Mensaje de error de formato ampliado. No cambian rutas API, origen CORS, permisos OAuth, secrets, KV, expiración ni mecanismos de sesión.

No modificar los clientes de las otras apps, secretos, cliente OAuth ni namespace KV. Nunca cambiar ENCRYPTION_KEY: impediría abrir sesiones existentes. No borrar entradas KV ni copias Drive.

## Datos y límites comprobados en el código

- JSON máximo 2.000.000 bytes. El cliente debe medir tamaño y avisar; si el historial supera ese límite, diseñar y probar partición antes de cargarlo, sin perder datos.
- Drive appDataFolder privado; appProperties.backupApp separa apps. Crear usa POST, no PATCH/DELETE, nombres nuevos y conservación de anteriores.
- Listado actual limitado a las 100 copias más recientes; nextPageToken se descarta. No afirmar acceso a todo el historial hasta implementar paginación compatible.
- Descarga valida appProperties antes de leer el contenido.
- AES-GCM cifra credenciales guardadas en KV, no el JSON de respaldo. Sesiones duran hasta 180 días; validez del refresh token depende también de Google.
- OAuth Prueba/Producción no se infiere del código ni de /health. Verificar en Google Auth Platform → Público/Audience del proyecto correcto.
- complete/source son declaraciones del cliente, no prueba independiente del servidor. La app debe capturar todos los datos confirmados en Firestore con revisión consistente; no respaldar una lista parcial ni datos locales obsoletos.
- Copias viejas se conservarán. Selección y restauración deben comparar revisión/generación, validar contenido, mostrar antigüedad y exigir confirmación; nunca restaurar automáticamente por fecha de archivo o «última copia» de dispositivo.
- Reintentar un POST de creación puede duplicar una copia si la respuesta se perdió; no duplica operaciones de Firestore ni destruye copias. Diseñar idempotencia de snapshots si es necesario antes de uso real.
- KV no ofrece consumo transaccional de tickets: no se promete prevención absoluta de reutilización concurrente. La adaptación mínima conserva comportamiento vigente; futuras mejoras deben verificarse contra los tres clientes.

## Pruebas

node --test tests/worker.test.js: 7/7 correctas. Mock de Drive/OAuth y KV en memoria con cifrado real Web Crypto y datos ficticios. Cubren formatos anteriores, autorización, separación, listado, descarga, creación append-only y formatos Gastos incompletos.

No son pruebas del despliegue, de OAuth real ni de recuperación. El ciclo real guardar → copiar → listar → descargar → recuperar sigue pendiente.

## Despliegue y recuperación del servicio

Antes de desplegar preparar drive-callback.html de Gastos y verificar que esté publicado. En Cloudflare abrir el MISMO Worker, conservar configuración y bindings, reemplazar solo el código por worker/worker.js y desplegar. Guardar referencia de la versión previa. Revisar /health y probar Préstamos/Tarjetas sin restaurar ni eliminar datos reales.

Si hay regresión, usar rollback a versión anterior en Cloudflare. worker/original.js también conserva la referencia suministrada. Gastos quedará sin habilitar en esa versión; copias previas y datos de Firebase no se borran por ese rollback.
