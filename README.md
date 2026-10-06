# Control de gastos

Aplicación personal con diseño aprobado, guardado privado en Firestore y respaldo completo en el Worker de Google Drive existente. Activación pendiente de publicar las nuevas reglas en el proyecto real y comprobar el primer ciclo desde la cuenta autorizada.

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
