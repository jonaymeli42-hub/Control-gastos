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

Una contabilidad personal, ubicaciones Efectivo y Virtual. Nunca llamar Galicia a Virtual. Importes en pesos con centavos; cálculos exactos sin errores de coma flotante. Ambos tipos Mío/Ajeno afectan saldo real.

### Inicio

- Mes consultado; total disponible Efectivo + Virtual del mes.
- Tarjetas Efectivo y Virtual con Dinero actual; tocar abre la ubicación.
- Solo tres botones principales: + Sueldo diario, Movimiento Efectivo, Movimiento Virtual.
- Distinguir saldo del mes de dinero repartido en otros meses; no inventar arrastres.
- Propuesta a revisar: acceso a Resumen de ajenos dentro de Virtual y accesible desde Efectivo, sin agregar un cuarto botón principal a Inicio.

### Sueldo diario y movimientos

- Sueldo: solo importe y guardar; ingreso propio en Efectivo hoy. No pedir ubicación ni fecha en carga habitual. Editar importe/fecha después.
- Movimiento determina ubicación por botón. Tipos: gasto; otro ingreso (incluidos fijos); transferencia a otra ubicación; pase a otro mes; enviar a Ahorro / Préstamos; traer desde Ahorro / Préstamos.
- Importe, descripción y fecha actual editable. Mío por defecto; selector Mío/Ajeno para ingresos y gastos comunes. No exigir campos innecesarios.

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

### Dinero ajeno y diferencias

- Vincular cobros/pagos por persona o concepto en casos, admitiendo varios registros y meses.
- Caso abierto conserva identificación de dinero ajeno pendiente. Diferencia temporal recibido − pagado no equivale a ganancia ni a obligación real pendiente.
- Resumen por caso/general: recibido, pagado, casos y dinero por resolver/pagar, diferencias confirmadas propias, abierto/cerrado. Modelar obligación real separadamente de la resta.
- Al confirmar cierre, diferencia positiva acordada se reconoce como «Ingreso propio por diferencia de ajenos», sin sumar de nuevo al saldo. Ejemplo ficticio: recibido $100.000, pagado $90.000, diferencia propia confirmada $10.000.
- Registrar fecha de reconocimiento y trazabilidad al cobro original. Diferencia propia aparece en Evolución.
- Editar, borrar o reabrir mantiene saldo/clasificación coherentes. No asignar todo el pendiente a una cuenta si hubo transferencias; identificarlo globalmente sin duplicación.

### Ahorro / Préstamos

- Solo registrar envíos y devoluciones manuales; no conexión automática ni cambios en Control-prestamos.
- Enviar descuenta de ubicación; traer suma. Varios movimientos al mes.
- Mostrar mensual enviado, devuelto, neto destinado = enviado − devuelto. Separar de ingresos/gastos comunes.
- No saldo acumulado de ahorro ni detalle de préstamos.

### Evolución

- Lista MUY compacta, un mes por fila: mes, ingresos propios, gastos propios, neto destinado Ahorro / Préstamos; combinar Efectivo + Virtual.
- Tocar despliega detalle propio y Ahorro / Préstamos. Excluir ajenos incluso en detalle; incluir diferencias confirmadas propias.
- Excluir transferencias y pases mensuales.
- Cada regreso sitúa mes actual con detalles cerrados; conservar consulta de anteriores.

## Edición, aspecto y aceptación

- Todos los registros editables/eliminables; confirmar eliminación, recalcular saldos/resúmenes, conservar vínculos y coherencia de casos.
- Pestañas Inicio, Efectivo, Virtual, Evolución, Respaldo.
- Botón pequeño de tema arriba en TODAS las pestañas, solo Claro/Oscuro; persistir elección coherentemente.
- Celular compacto, legible y adaptable a computadora; navegación clara y carga sencilla.
- Mostrar diseño con datos ficticios identificados y permitir correcciones antes de completar interfaz.
- Automatizar fechas, nunca fijos ni pases.
- Verificar aislamiento de cuenta, sincronización de dispositivos, errores de permisos/cuotas/red, respaldo completo, restauración validada, idempotencia y concurrencia.
