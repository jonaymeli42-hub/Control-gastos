# Control de gastos

Aplicación personal con diseño aprobado, guardado privado en Firestore y respaldo completo en el Worker de Google Drive existente. El usuario confirmó el guardado y el ciclo de recuperación en el proyecto real desde la cuenta autorizada.

- [Instalar y abrir en el teléfono](docs/INSTALAR.md)
- [Activar el guardado desde el teléfono](docs/ACTIVAR-GUARDADO.md)
- [Especificación vigente](docs/ESPECIFICACION.md)
- [Primera prueba de acceso privado](docs/PRUEBA-ACCESO.md)
- [Estado y continuación del trabajo](docs/ESTADO.md)
- [Configuración de Firebase desde el teléfono](docs/FIREBASE.md)

Desarrollo en el entorno remoto de Codex. GitHub conserva código e instrucciones entre sesiones. Publicación prevista exclusivamente en GitHub Pages. Los datos privados estarán en Firestore y las copias en Google Drive, nunca en este repositorio público.

## Diseño para revisión

Demostración separada: demo.html (GitHub Pages). Datos e importes ficticios y cambios solo en memoria. No usa Firebase ni envía datos a Drive. Recargar descarta operaciones de ejemplo; solo se conserva la elección de tema.

## Aplicación con guardado

`app.html` usa el mismo diseño, empieza sin movimientos ficticios y se conecta a la cuenta autorizada. `index.html` conserva las herramientas de configuración. Reglas: `firestore.rules`. Modelo validado: `ledger-model.js`; almacenamiento atómico y concurrencia: `ledger-repository.js`.

Verificación local: `npm run test:model`, `npm run test:worker`, `npm run test:rules` (Java 21). Las pruebas de emulador no acreditan una escritura en el proyecto de producción.

## Préstamos recibidos temporalmente

En Efectivo o Virtual, elegí Otro ingreso → Préstamo recibido temporal.
Aumenta el saldo disponible y queda en Movimientos, pero no suma a ingresos
propios, aportes ajenos para pagos, gastos ni ahorro. Para devolver el capital,
elegí Devolver préstamo recibido: reduce el saldo sin contar como gasto.
Si hay intereses, se registran por separado como gasto con una categoría.

Un Extra ya cargado se puede editar y reclasificar como préstamo temporal,
conservando su importe, fecha e identificador. No se reclasifican registros
existentes automáticamente. Los respaldos completos conservan estas operaciones.
El modelo usa incomeSource=temporary para la recepción y kind=loan-repayment
para devolver capital. No se mezclan con Préstamos para pagos de tarjetas,
que mantiene la clasificación de aporte ajeno para pagos acordada anteriormente.

## Agenda de pagos

La aplicación live (`app.html` e `instalar.html`) incluye la agenda mensual de
Control Tarjetas. Mantiene la clave local `control-tarjetas-agenda-v1` para leer
las planillas existentes en el mismo origen/navegador sin copiarlas ni borrarlas.
La agenda sigue siendo local y no pasa a Firestore. El acceso visible queda
solo en Gastos. Las nuevas copias financieras incluyen opcionalmente
`data.paymentAgenda`, validada y cubierta por el checksum; las anteriores
siguen siendo compatibles. Restaurar una copia nueva restaura también la
agenda local, después de la confirmación y de conservar una copia previa.

Validación adicional: `node --test tests/agenda-backup.test.js`.

En la agenda, cada importe de Debo y el campo Mío de cada tarjeta permite cargar su «Mes anterior» desde Editar planilla. El total al final compara los mismos conceptos propios, incluidos los ya pagados. Los valores anteriores vacíos se distinguen de cero y la diferencia queda pendiente hasta completar los datos. Se reutilizan los campos anteriores inequívocos (por ejemplo Hogar/Celular); los datos ambiguos de varias boletas se conservan y se avisa que deben asociarse manualmente. Al preparar el mes siguiente, cada importe actual pasa a su propio dato anterior, conservando los respaldos y sin generar movimientos financieros.


## Marcas de pago vinculadas

La planilla guarda el estado de pago y la orden lo muestra mediante el `sourceKey`
existente. Marcar Pagado o Pendiente desde cualquiera de las dos vistas actualiza
los mismos campos de origen, sin crear gastos ni modificar importes, fechas o
movimientos financieros. Movistar y préstamos conservan sus vínculos por ítem;
los servicios agrupados figuran pagados cuando todos sus importes incluidos lo
están. La selección Sumar sigue siendo independiente de Pagado.

Se conservan las confirmaciones, el guardado y la cancelación de borradores y los
respaldos existentes. Al recalcular una orden existente prevalece la marca de la
planilla vinculada. Pruebas: `node --test tests/agenda-paid-sync.test.js tests/agenda-backup.test.js`.


## Total de ingresos y entradas del mes

Inicio y Ver detalle muestran por separado el subtotal de ingresos propios,
los pases recibidos de otros meses (indicando el mes de origen) y los préstamos
personales temporales recibidos. El total visible suma estas tres entradas;
Evolución usa el mismo total y conserva el desglose. Los aportes ajenos para pagos
siguen en su apartado y no se vuelven a sumar en este total.

`income-overview.js` calcula esta vista sin modificar operaciones, categorías ni
copias de seguridad. Los pases de salida y las transferencias entre Efectivo y
Virtual no se cuentan como entradas. No se inventa una clasificación de sueldo
para un pase: se muestra como dinero de otro mes. La clasificación económica de
ingreso propio en `ledger-model.js` permanece igual; un préstamo sigue separado
del sueldo y sus devoluciones de capital siguen sin ser gastos.

El total es de entradas brutas, no de saldo: no descuenta devoluciones de capital,
pases de salida ni ahorro, que sí afectan el dinero disponible. Los gastos reales
mantienen su cálculo anterior. Pruebas: `node --test tests/income-overview.test.js`.
