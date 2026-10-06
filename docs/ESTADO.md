# Estado del proyecto

## Verificado — 2026-10-06

- Repositorio público nuevo, rama main; acceso ADMIN desde terminal GitHub.
- Clonado en computadora virtual; no se depende de una carpeta personal.
- Documentación inicial preparada; la subida se verifica desde el remoto tras el commit.
- Control-prestamos y Control-tarjetas revisados en clones de lectura, sin modificaciones.
- Ambos contienen drive-backup.js y usan el Worker compartido indicado en la especificación.
- Cliente actual agrupa cambios durante 2,5 segundos, reintenta con espera creciente hasta 120 segundos, reacciona al regreso de internet/visibilidad y muestra fecha confirmada por el servicio.
- API utilizada: POST /auth/start, POST /auth/exchange, POST /auth/disconnect, POST /backups, GET /backups, GET /backups/download?id=….
- La validación de descargas actual contempla solo Préstamos/Tarjetas: requiere extensión específica para Gastos.
- No se localizó código fuente del Worker en los dos repositorios revisados. Código cliente no demuestra comportamiento del servidor.

## Pendiente / no afirmado

- Firebase: proyecto, Authentication, usuario permitido y reglas aún sin configurar.
- Worker: obtener implementación desplegada y configuración NO secreta; comprobar identificadores permitidos, aislamiento, CORS, formato, conservación, límites y autorización.
- OAuth: estado Prueba/Producción y conexión Drive no comprobados.
- Sin pruebas reales de guardar/listar/descargar/restaurar. Sin publicación de esta app.

## Próximo paso

Crear proyecto Firebase nuevo en Spark desde el teléfono siguiendo FIREBASE.md. Mantener cerrado Firestore hasta configurar cuenta y reglas. Luego revisar Worker vigente y probar ciclo con datos ficticios antes de pantallas completas.

## Retomar otra sesión

Clonar jonaymeli42-hub/Control-gastos, leer esta documentación y comprobar permisos, estado remoto y configuración vigente. No reutilizar credenciales de otra sesión ni asumir que pruebas pendientes pasaron. No tocar las otras apps.
