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
