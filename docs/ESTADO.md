# Estado del proyecto

## Verificado — 2026-10-06

- Repositorio público nuevo, rama main; acceso ADMIN desde terminal GitHub.
- Clonado en computadora virtual; no se depende de una carpeta personal.
- Documentación inicial subida y contenido remoto verificado mediante API GitHub. git push devuelve HTTP 401; la API permite escritura. Usar API y verificar remoto; no afirmar que git push funciona.
- Control-prestamos y Control-tarjetas revisados en clones de lectura, sin modificaciones.
- Ambos contienen drive-backup.js y usan el Worker compartido indicado en la especificación.
- Cliente actual agrupa cambios durante 2,5 segundos, reintenta con espera creciente hasta 120 segundos, reacciona al regreso de internet/visibilidad y muestra fecha confirmada por el servicio.
- API utilizada: POST /auth/start, POST /auth/exchange, POST /auth/disconnect, POST /backups, GET /backups, GET /backups/download?id=….
- La validación de descargas actual contempla solo Préstamos/Tarjetas: requiere extensión específica para Gastos.
- No se localizó código fuente del Worker en los dos repositorios revisados. Código cliente no demuestra comportamiento del servidor.

## Pendiente / no afirmado

- Firebase: proyecto y app web creados; Spark, Google habilitado, dominio Pages autorizado y Firestore default creado, según capturas del usuario.
- Reglas visibles bloquean todas las lecturas/escrituras (if false). Cuenta autorizada y pruebas de acceso pendientes. Región definitiva no verificada.
- Worker: obtener implementación desplegada y configuración NO secreta; comprobar identificadores permitidos, aislamiento, CORS, formato, conservación, límites y autorización.
- OAuth: estado Prueba/Producción y conexión Drive no comprobados.
- Sin pruebas reales de guardar/listar/descargar/restaurar. Página de configuración de acceso preparada para Pages; no es la interfaz financiera final.

## Próximo paso

Publicar página mínima de inicio de sesión en Pages, comprobar archivos y obtener UID de la cuenta desde el navegador del usuario. Mantener bloqueado Firestore; instalar autorización privada fuera del repositorio y probar reglas antes de datos reales. Luego revisar Worker y probar ciclo ficticio.

## Retomar otra sesión

Clonar jonaymeli42-hub/Control-gastos, leer esta documentación y comprobar permisos, estado remoto y configuración vigente. No reutilizar credenciales de otra sesión ni asumir que pruebas pendientes pasaron. No tocar las otras apps.

## Actualización de configuración

- Pages activado por el usuario; publicación inicial y cuatro archivos verificados por HTTP 200 y comparación de contenido.
- Usuario completó acceso Google. Configuración privada _config/access.ownerUid confirmada por captura, sin publicar identificador personal.
- npm run test:rules pasó 6/6 tests en emulador local (2026-10-06). Reglas de diagnóstico probadas; publicación de reglas en Firebase y prueba real pendientes.
- No se cargaron movimientos reales ni se conectó Drive.

## Respaldos: implementación recibida

- Worker completo suministrado por usuario, referencia con sangría normalizada conservada en worker/original.js.
- Adaptación propuesta en worker/worker.js; 7/7 pruebas mock correctas. No desplegada.
- Prueba Firebase real confirmada por captura: escritura, lectura desde servidor y eliminación del diagnóstico ficticio completas.
- Pendientes: denegación real con segunda cuenta, prueba desde segundo dispositivo, OAuth Prueba/Producción, callback y cliente Gastos, despliegue del Worker, ciclo completo con restauración ficticia.
