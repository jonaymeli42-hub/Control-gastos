# Control de gastos — especificación vigente

Fecha: 2026-10-06. Fuente de verdad para desarrollo y correcciones acordadas en Codex.

## Trabajo, privacidad y publicación

- Aplicación nueva sobre jonaymeli42-hub/Control-gastos. Trabajo desde el teléfono con Codex y su entorno remoto; no requiere carpeta personal ni otro chat.
- Conservar código, decisiones, instrucciones y estado en GitHub: el entorno remoto puede perder archivos entre sesiones.
- Probar temprano la subida de cambios. No afirmar guardado, respaldo o publicación sin comprobarlo.
- Publicar exclusivamente mediante GitHub Pages; no Vercel.
- Repositorio y archivos de Pages públicos; registros financieros privados en Firebase. No publicar datos reales, identificadores personales de acceso, contraseñas, tokens o secretos en el repositorio.
- No modificar aplicaciones existentes, salvo adaptación necesaria y comprobada del servicio compartido de respaldos.

## Orden obligatorio

1. Revisar repositorio, entorno y permisos; probar escritura.
2. Guardar y mantener esta especificación.
3. Resolver y probar acceso privado y Firestore Spark.
4. Revisar y adaptar respaldos existentes.
5. Probar guardar → respaldar → descargar → recuperar con datos ficticios.
6. Construir interfaz y operaciones.
7. Probar cálculos, meses, transferencias, ajenos y edición/eliminación.
8. Publicar en Pages y verificar archivos publicados.
9. Entregar URL y guiar prueba e instalación desde el teléfono.

## Almacenamiento y seguridad

- Firebase Cloud Firestore principal; Firebase Authentication y reglas que permitan únicamente la cuenta autorizada. Prohibidas reglas abiertas o modo de prueba.
- Mismos datos al entrar con la misma cuenta desde celular y computadora.
- Solo Spark, sin facturación, tarjeta ni prueba promocional. Verificar condiciones vigentes; sustituir funciones pagas por alternativas gratuitas.
- Guiar pasos de consola que requieran intervención. No prometer gratuidad eterna ni infalibilidad. Documentar dependencias, recuperación y traslado.
- Fecha local America/Argentina/Buenos_Aires. Hoy por defecto, fechas anteriores y cambios de mes permitidos.

## Respaldos compartidos

- Reutilizar https://respaldo-mis-apps.soft-bush-7594.workers.dev.
- Referencias existentes: Control-prestamos y Control-tarjetas en la misma cuenta GitHub. Google Cloud mencionado: respaldo-de-mis-apps; Google Drive API/OAuth; JSON privados en appDataFolder.
- Revisar implementación y configuración vigente; no asumir acceso al Worker ni credenciales. Obtener código vigente antes de modificarlo y documentar cambios.
- Identificador y formato propios para Gastos. Nunca mezclar, sobrescribir ni eliminar copias de las otras apps; conservar las anteriores.
- Copiar después de cambios, agrupar cambios cercanos, reintentar pendientes y mostrar última copia exitosa. Requiere app abierta e internet; no se necesita funcionar con app cerrada o teléfono apagado.
- Diferenciar guardado confirmado en Firebase de copia confirmada en Drive.
- Evitar que una instantánea incompleta o antigua de otro dispositivo perjudique recuperación; respaldar datos completos confirmados y versionados, con validación de integridad y antigüedad.
- Copia manual, listado, descarga y restauración con confirmación. Probar todas con datos ficticios antes de datos reales.
- Revisar publicación OAuth: Prueba/Producción todavía no confirmado. No crear otro servicio ni Apps Script si puede reutilizarse el existente.

## Modelo financiero

Una contabilidad personal, ubicaciones Efectivo y Virtual. Nunca llamar Galicia a Virtual. Importes en pesos con centavos; cálculos exactos sin errores de coma flotante. Los ingresos propios y los aportes de otras personas afectan el saldo real; los pagos se registran completos.

### Inicio

- Mes consultado; total disponible Efectivo + Virtual del mes.
- Tarjetas Efectivo y Virtual con Dinero actual; tocar abre la ubicación.
- Solo tres botones principales: + Sueldo diario, Movimiento Efectivo, Movimiento Virtual.
- Distinguir saldo del mes de dinero repartido en otros meses; no inventar arrastres.
- No hay Resumen de ajenos: el modelo vigente usa aportes recibidos, sin casos ni reclasificaciones.

### Sueldo diario y movimientos

- Sueldo: solo importe y guardar; ingreso propio en Efectivo hoy. No pedir ubicación ni fecha en carga habitual. Editar importe/fecha después.
- Movimiento determina ubicación por botón. Tipos: gasto; otro ingreso (incluidos fijos); transferencia a otra ubicación; pase a otro mes; enviar a Ahorro / Préstamos; traer desde Ahorro / Préstamos.
- Importe, descripción y fecha actual editable. Ingresos: Propio por defecto o Aporte de otra persona. Gastos: importe completo, sin clasificar por persona. No exigir campos innecesarios.

### Efectivo y Virtual

- Efectivo: Dinero actual del mes arriba; lista diaria compacta, fecha pequeña a izquierda y movimientos a derecha. Cada entrada/regreso lleva al mes y día actuales y ubica hoy; mostrar hoy aun sin movimientos. Permitir consultar días/meses previos.
- Virtual: pestaña separada, Dinero actual del mes, ingresos/gastos/transferencias con descripción y fecha; consultar y editar historial.

### Meses y pases

- NO trasladar automáticamente saldos. Cada mes conserva lo suyo; mes nuevo empieza sin recibir saldo anterior.
- Pase manual registrado una vez vincula salida e ingreso de la misma ubicación en meses distintos. Ejemplo ficticio: octubre salida $5.000 «Para noviembre» y noviembre entrada $5.000 «Desde octubre».
- Pases no son ingresos nuevos ni consumo. Edición/eliminación mantiene ambas partes consistentes.
- Cambiar fecha de ingreso/gasto mueve operación y recalcula todos los meses afectados, sin arrastre.

### Transferencias

- Efectivo ↔ Virtual: una sola operación, dos efectos vinculados y atómicos. No ingreso/gasto. Editar/eliminar juntas sus partes; sin duplicados ni operaciones a medias.
- Evitar duplicados por reintentos o uso de dos dispositivos mediante identificadores estables y control de concurrencia.

### Opciones fijas

- Opciones rápidas reutilizables para ingresos/gastos, administración y modificación de importe en cada registro.
- Registro MANUAL cuando se cobra/paga; jamás generación automática por fecha.
- Opciones iniciales acordadas: «Sueldo de Melanie» y «Sueldo de Misael», sin importes reales. Crear en los datos privados, no como datos personales en el código público.

### Aportes de otras personas — modelo definitivo acordado

- Reemplaza íntegramente los casos de dinero ajeno, cierres y reclasificaciones propuestos antes.
- Solo al registrar ingresos elegir Propio o Aporte de otra persona. Sueldo diario es siempre propio.
- Todos los gastos se registran completos, sin selector Mío/Ajeno, sin parcializar pagos ni vincular gastos a aportes.
- Ejemplo ficticio: ingreso de aporte $300.000 y pago de resumen $1.000.000; la diferencia del período es $700.000. No dividir el pago en registros individuales.
- Ambos tipos de ingreso suman al saldo; pago completo descuenta. Transferencias y pases no son nuevos ingresos ni gastos.
- En Evolución separar ingresos propios, aportes recibidos y gastos pagados; mostrar al desplegar el mes gastos menos aportes, y Ahorro / Préstamos por separado.
- Cada movimiento pertenece a su mes de fecha. No emparejar automáticamente aportes de otro mes ni trasladar saldos.
- Gastos menos aportes es la resta del período, no una obligación pendiente ni una ganancia confirmada. Si aportes superan gastos, mostrar diferencia negativa explícita, sin reclasificarla como ingreso propio.
- No Resumen de ajenos, casos, cierre, obligaciones por persona ni Pasar de ajeno a propio.

### Ahorro / Préstamos

- Solo registrar envíos y devoluciones manuales; no conexión automática ni cambios en Control-prestamos.
- Enviar descuenta de ubicación; traer suma. Varios movimientos al mes.
- Mostrar mensual enviado, devuelto, neto destinado = enviado − devuelto. Separar de ingresos/gastos comunes.
- No saldo acumulado de ahorro ni detalle de préstamos.

### Evolución

- Lista MUY compacta por mes, combinando Efectivo + Virtual.
- Fila: mes, ingresos propios, aportes de otras personas, gastos completos y neto destinado a Ahorro / Préstamos.
- Tocar despliega importes exactos, detalle de ingresos/aportes/pagos y cálculo gastos − aportes recibidos del mes.
- Excluir transferencias y pases de totales de ingresos/gastos; nunca contarlos dos veces.
- Comparación por mes de fecha, sin arrastre ni asignación automática de aportes a pagos de otros meses.
- Al volver en uso habitual, mes actual y detalles cerrados. Durante consulta de otro mes conservar ese contexto hasta Volver al mes actual.

## Edición, aspecto y aceptación

- Todos los registros editables/eliminables; confirmar eliminación, recalcular saldos/resúmenes, conservar vínculos entre las partes de transferencias y pases.
- Pestañas Inicio, Efectivo, Virtual, Evolución, Respaldo y Movimientos.
- Botón pequeño de tema arriba en TODAS las pestañas, solo Claro/Oscuro; persistir elección coherentemente.
- Celular compacto, legible y adaptable a computadora; navegación clara y carga sencilla.
- Mostrar diseño con datos ficticios identificados y permitir correcciones antes de completar interfaz.
- Automatizar fechas, nunca fijos ni pases.
- Verificar aislamiento de cuenta, sincronización de dispositivos, errores de permisos/cuotas/red, respaldo completo, restauración validada, idempotencia y concurrencia.

## Corrección acordada: Historial y Movimientos

- Agregar una sección Historial para elegir cualquier mes anterior y recorrer sus pantallas con ese mes activo (ejemplo: septiembre desde octubre).
- En consulta histórica, Inicio/Efectivo/Virtual/Movimientos conservan el mes seleccionado; regresar a Efectivo no lleva a hoy hasta salir explícitamente del Historial. En uso normal se mantiene el comportamiento original de volver a hoy.
- Mostrar claramente el mes histórico y una acción Volver al mes actual. No hay arrastre de saldos.
- Agregar pestaña Movimientos con todas las operaciones de Efectivo y Virtual, ingresos propios/aportes, pagos completos, transferencias, pases y Ahorro / Préstamos. Consultar por mes y fecha. Transferencias/pases vinculados aparecen una sola vez en la vista conjunta; sus efectos siguen visibles en los saldos correspondientes.
- Evolución distingue ingresos propios, aportes recibidos y gastos completos, independiente de la vista conjunta.
- Preferencia confirmada: Historial y Movimientos son dos pestañas diferentes.

## Selector mensual visual

- Mes y año claramente visibles en el centro, flechas anterior/siguiente a los lados, tomando como referencia visual la captura de Control de tarjetas enviada por usuario (sin copiar sus datos).
- Si el mes seleccionado no es el actual, mostrar Volver al mes actual; debe funcionar tanto para meses anteriores como futuros y volver manteniendo la pestaña. Al volver al mes actual el botón desaparece.
- Conservar consulta del mes seleccionado entre las pestañas, sin arrastre automático. Permitir elegir un mes directamente tocando el nombre.

## Corrección posterior: consulta histórica sin pestaña propia

- Con las flechas mensuales, el usuario indica eliminar la pestaña Historial. Esta corrección reemplaza la decisión anterior de mantener dos pestañas nuevas.
- Pestañas finales acordadas: Inicio, Efectivo, Virtual, Evolución, Respaldo y Movimientos.
- Se mantiene consulta de meses anteriores mediante flechas y selección directa, contexto de mes elegido entre pantallas y Volver al mes actual. No se elimina ningún mes ni movimiento.

## Apariencia

- El usuario pide una apariencia más llamativa, manteniendo compacidad y legibilidad móvil.
- Demostración con cabecera azul profundo, saldo verde intenso, Efectivo en acento ámbar, Virtual violeta, iconos y modos Claro/Oscuro. Conservar solo tres acciones principales en Inicio.
