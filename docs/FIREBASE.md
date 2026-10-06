# Firebase: configuración gratuita y privada

Condiciones consultadas el 2026-10-06 en fuentes oficiales:

- https://firebase.google.com/docs/projects/billing/firebase-pricing-plans
- https://firebase.google.com/pricing
- https://firebase.google.com/docs/firestore/quotas

Spark no requiere información de pago. Firestore Standard incluye una base gratuita por proyecto: 1 GiB de datos, 50.000 lecturas/día, 20.000 escrituras/día, 20.000 eliminaciones/día y 10 GiB de transferencia saliente/mes. Las cuotas diarias se reinician según el horario del Pacífico, no Argentina. Se deben volver a revisar al configurar y si cambian las condiciones.

Google Authentication está disponible sin SMS; no usaremos autenticación telefónica. Excluir Cloud Functions y funciones que requieran Blaze. Los respaldos administrados de Firestore, PITR y restauración administrada requieren facturación: usar el Worker existente y JSON de Drive. Restaurar JSON mediante escrituras normales consume cuota de Firestore; no es la restauración administrada de Google.

Sin promesa de gratuidad perpetua. Al agotar cuotas puede fallar el servicio; mostrar errores y no marcar guardado confirmado. Documentar exportación JSON portable e importación validada para migrar.

## Primera intervención desde el teléfono

1. Abrir https://console.firebase.google.com/ con la cuenta Google que se utilizará para esta aplicación. Si la vista no permite continuar, activar «Sitio de escritorio» en el navegador.
2. Crear un proyecto NUEVO llamado Control de gastos. No usar ni modificar respaldo-de-mis-apps ni los proyectos existentes de otras apps.
3. Desactivar Google Analytics para este proyecto (no se necesita).
4. No activar facturación, Blaze, tarjeta ni prueba de Google Cloud. Confirmar que el plan figura Spark.
5. Informar en Codex el ID del proyecto (identificador del proyecto, no contraseña ni token). Si la consola exige pago, detener ese paso y mostrar el texto del mensaje.

## Pasos siguientes, guiados en Codex

- Registrar aplicación web sin Firebase Hosting: publicación será Pages.
- Activar proveedor Google en Authentication y autorizar jonaymeli42-hub.github.io.
- Crear Firestore Standard en modo producción, nunca modo prueba; confirmar región antes de crear porque no se cambia después.
- Hasta instalar reglas de acceso único mantener denegación total. La interfaz de inicio de sesión no reemplaza las reglas.
- Registrar cuenta autorizada; configurar su UID fuera del repositorio público. No publicar correo/UID personales ni credenciales administrativas.
- Preparar y probar reglas: sin sesión y otra cuenta rechazadas; únicamente propietario puede leer/escribir. Validar estructura, importes, revisiones y operaciones vinculadas.
- Probar escritura confirmada y lectura desde segundo dispositivo con datos ficticios antes de crear respaldos.

La configuración web de Firebase es información de conexión pública, no una credencial administrativa; su publicación debe explicarse al configurarla. La privacidad depende de Authentication y reglas, no de ocultar la configuración. Nunca incluir claves de cuentas de servicio o tokens en el navegador/repositorio.
