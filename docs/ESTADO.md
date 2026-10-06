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

## OAuth y conexión de Gastos

- Capturas del usuario confirman proyecto «Respaldo de mis apps» y OAuth En producción. No se infiere verificación de Google ni validez perpetua de tokens.
- Página drive-respaldos.html y retorno drive-callback.html preparados reutilizando el cliente existente, con validación específica de Gastos y mensajes sin afirmar guardado local.
- Creación/restauración desde Firestore aún no habilitadas. Pendiente actualizar Worker desde Cloudflare y probar conexión real.

## Ciclo ficticio de recuperación preparado

- Worker versión 7389c7c Active según captura; /health configured true y /auth/start acepta gastos comprobados desde remoto.
- Conexión real Drive y listado de Gastos vacío confirmados por capturas.
- Preparados backup-test.js y backup-test-format.js: sandbox separado, transacciones con revisiones, snapshot leído desde servidor, checksum, descarga, restauración confirmada y copia previa obligatoria.
- Reglas ampliadas solo para diagnóstico fijo; 7/7 pruebas de reglas y 3/3 pruebas de formato pasaron.
- Pendiente que usuario publique reglas nuevas y complete ciclo real: guardar → respaldo automático → listado → descarga → restauración. No afirmar ciclo real completo aún.

## Resultado del ciclo real ficticio

Capturas del usuario el 2026-10-06 confirman:

- Guardado $123,45 ficticios en Firestore, revisión 1, y copia automática confirmada en Drive.
- Listado con dos archivos distintos de Gastos tras cambio a $543,21; copia inicial conservada.
- Restauración de copia inicial confirmada por aplicación: $123,45 en Firestore, revisión 3; copia previa creada y nueva copia automática confirmada. La restauración incluye lectura/validación de JSON desde Drive.
- Descarga manual al teléfono fue solicitada, pero no se recibió evidencia independiente de archivo guardado por Chrome. No afirmar ese paso más allá de la descarga utilizada por restauración.

Este resultado comprueba solo el sandbox ficticio y esta cuenta/dispositivo. Aún pendientes: datos financieros completos, rechazo real con segunda cuenta, segundo dispositivo, reintentos sin red, compatibilidad real posterior del Worker con las otras apps y restauración del modelo final.

Fechas de Drive corregidas para usar explícitamente America/Argentina/Buenos_Aires y formato 24 horas.

## Demostración visual

- demo.html, demo.css, demo.js: cinco pestañas, tres botones Inicio, dos ubicaciones, listado diario, Resumen de ajenos en Efectivo/Virtual, Evolución propia compacta, Claro/Oscuro.
- Importes ficticios, estado en memoria y sin Firebase. Permite simular carga diaria, ingresos/gastos, transferencias, pases y Ahorro/Préstamos; no representa aplicación final completa.
- Pendientes en interfaz/modelo final: edición/eliminación, fijos privados, casos y cierres/reclasificaciones completos, recuperación del modelo financiero, reglas completas y sincronización multi-dispositivo.
- Revisión Chromium local: cinco pestañas sin desbordamiento a 390 px; carga ficticia con centavos; hoy visible en Efectivo; Evolución vuelve con detalles cerrados; tema oscuro; presentación a 1100 px sin desbordamiento.
- Esperar comentarios de diseño del usuario mientras se conserva la especificación vigente.

## Corrección del pase entre meses en demo

- Usuario reportó que no podía mover $4.000 ficticios de septiembre a octubre. Causa: fecha por defecto actual usada como mes de origen aunque estuviera consultando otro mes.
- Formulario de pase usa Mes de origen explícito (mes consultado) y Mes de destino (actual si origen anterior); la fecha habitual de ingresos/gastos no cambia.
- Lista distingue salida «Para …» y entrada «Desde …», guardadas en una sola operación vinculada.
- Prueba Chromium: septiembre Efectivo $4.000 → $0; octubre Efectivo $7.150 → $11.150; Evolución conserva ingresos $15.000/$12.000 sin contar el pase.

## Cambios pedidos: Historial y Movimientos

- Implementados en demo: sección Historial con selector de mes, meses existentes, contexto histórico persistente entre pestañas y regreso explícito al mes actual.
- Movimientos reúne operaciones propias/ajenas de Efectivo y Virtual, pases y Ahorro/Préstamos agrupadas por fecha. Transferencias/pases figuran una vez por operación vinculada.
- Demostración inicialmente con ambas pestañas nuevas; usuario puede preferir reunir acceso a Historial dentro de Movimientos.
- Prueba Chromium a 390 px: septiembre conservado en Inicio/Efectivo/Virtual/Movimientos; listado septiembre 2 registros; salida explícita vuelve a octubre; transferencia conjunta una sola fila; sin desbordamiento.
- Corrección anterior de pase entre meses conservada. No afecta Firebase ni otras apps.
- El despliegue anterior de Pages permanece esperando en GitHub; no afirmar estas vistas publicadas hasta comprobar archivos remotos.

## Selector mensual con flechas

- Usuario confirmó dos pestañas separadas: Historial y Movimientos.
- Nueva navegación visual con mes/año centrados y flechas anterior/siguiente en Inicio, Efectivo, Virtual, Historial y Movimientos. Tocar el nombre permite salto directo.
- Volver al mes actual aparece en meses anteriores/futuros, mantiene la pestaña y desaparece al regresar. Mes consultado se conserva entre pestañas.
- Chromium 390 px: octubre→septiembre; mantiene septiembre en Efectivo; regreso a octubre sin salir de Efectivo; botón para mes futuro; Historial abre mes elegido; sin desbordamiento.
- La actualización previa de Historial/Movimientos figura built en Pages (8144e0f). Verificar por HTTP esta nueva actualización antes de afirmar publicada.

## Simplificación de navegación

- El usuario indica que la navegación mensual elimina la necesidad de Historial; retirada su pestaña. Movimientos se conserva.
- Pestañas: Inicio, Efectivo, Virtual, Evolución, Respaldo, Movimientos. Flechas y regreso al actual conservan consulta histórica.
- Chromium a 390 px: seis pestañas; septiembre persiste al entrar en Movimientos; regresar a octubre mantiene Movimientos; sin desbordamiento.
- Selector con flechas anterior (56c38b2) verificado publicado HTTP 200 y comparación de archivos. Nueva simplificación en proceso de publicación.

## Modelo simplificado aprobado y apariencia

- Usuario aprueba distinguir solo ingresos Propio/Aporte de otra persona; gastos completos sin repartir, casos ni reclasificaciones. Especificación consolidada actualizada y demostración adaptada.
- Evolución separa propios, aportes, gastos completos y neto Ahorro/Préstamos; desplegar muestra gastos menos aportes del mismo mes.
- Retirados selector Mío/Ajeno en gastos, casos, Resumen de ajenos y cierres del demo.
- Apariencia más llamativa: cabecera azul, saldo verde, acentos Efectivo ámbar / Virtual violeta e iconos; Claro/Oscuro conservados.
- Prueba Chromium: gastos sin selector; aporte ficticio extra $200.000 aumenta aportes a $500.000 y resta mensual queda $501.850; seis pestañas y sin desbordamiento a 390 px/1100 px; temas revisados visualmente.
- Datos ficticios del demo solo en memoria; Firestore financiero final y respaldo del modelo completo aún pendientes. No confundir con sandbox de respaldo ya probado.

## Calendario completo y regreso a la fecha actual

- Pedido del usuario: todos los días en Efectivo/Virtual, todos los meses consecutivos en Evolución; al regresar, ubicar día/mes actuales.
- Implementados días vacíos sin crear operaciones. Meses enero-diciembre del año actual y extensión si hay registros de otros años.
- Cambiar de pestaña y regresar a Efectivo/Virtual/Evolución vuelve al actual, incluso si se había consultado otro mes. Flechas siguen disponibles para consultar meses dentro de la pestaña.
- Prueba Chromium 390 px: 31 días octubre, 30 septiembre en ambas ubicaciones; hoy visible al entrar; regresar restablece octubre; Evolución 12 meses, detalles cerrados y octubre visible; sin desbordamiento.


### Categorías y edición de todos los registros — 6 de octubre de 2026

La demostración agrega una pestaña Categorías independiente: crear, renombrar y quitar categorías, seleccionar categoría al registrar cada gasto y consultar totales por mes de Efectivo y Virtual. Quitar una categoría conserva sus gastos como Sin categoría, sin alterar importes ni saldos. Solo los gastos cuentan en estos totales.

Todos los registros de la demostración pueden editarse y eliminarse tocándolos en Efectivo, Virtual o Movimientos: ingresos propios y aportes, gastos, Ahorro / Préstamos, transferencias y pases entre meses. Se permite cambiar importe, descripción, fecha, ubicación, tipo y categoría cuando corresponde. Eliminar requiere confirmación; transferencias y pases se editan o eliminan como una sola operación con dos partes. Los saldos y totales se recalculan.

Validado en navegador móvil: categoría nueva, gasto categorizado, edición de importe y total, eliminación de categoría conservando gasto, eliminación de gasto y actualización de ambas partes de una transferencia. La demostración sigue usando datos ficticios en memoria; recargar descarta cambios. Estas pantallas aún no guardan datos financieros en Firebase.


### Detalle de categorías y navegación horizontal
Cada categoría despliega sus gastos del mes seleccionado, con fecha, ubicación, descripción e importe. Los gastos del detalle permiten editar y eliminar desde el mismo formulario. Las categorías vacías indican que no hay gastos en ese mes. La barra inferior ocupa una sola fila y permite desplazamiento horizontal, manteniendo visible la pestaña activa. Sigue siendo una demostración con datos ficticios en memoria.


### Visibilidad de Evolución y barra inferior
Respaldo ocupa la última posición de la barra. La navegación sigue en una sola fila deslizable, ahora con contenedor flotante redondeado, iconos y texto de mayor tamaño y pestaña activa resaltada. Evolución presenta cada mes como tarjeta con cuatro totales claramente rotulados, en dos columnas en celular y cuatro en pantallas amplias; conserva el despliegue de detalles y el regreso al mes actual al volver a la pestaña. Datos ficticios en memoria.


### Barra compacta fija y acceso superior al respaldo
Respaldo deja de ser una pestaña inferior y se abre desde un botón junto al selector de tema del encabezado. Las seis pestañas inferiores quedan fijas en una sola fila compacta sin desplazamiento horizontal: Inicio, Efectivo, Virtual, Evolución, Movimientos y Categorías.
