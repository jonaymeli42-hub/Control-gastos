# Primera prueba de acceso privado

Las reglas firestore.rules habilitan únicamente users/{uid}/diagnostics/access-check para el UID configurado privadamente en _config/access.ownerUid. La configuración no se puede leer ni modificar desde la app. Todos los movimientos financieros y cualquier otra ruta permanecen bloqueados.

El UID real se configura exclusivamente en la consola Firebase; no incluirlo en GitHub. Los tests usan identidades ficticias.

## Prueba reproducible en el entorno remoto

Instalar Node y Java 21, ejecutar npm ci y npm run test:rules. Usa proyecto demo-control-gastos y emulador local: no modifica Firebase real.

Comprobar propietario autorizado; denegación sin sesión/otra cuenta; bloqueo de configuración y rutas financieras; rechazo de campos extra y marcas de tiempo falsas; configuración ausente/vacía deniega acceso.

## Publicación de reglas desde el teléfono

Después de completar satisfactoriamente los tests, copiar firestore.rules en Firestore → Reglas → Editar reglas → Publicar. No usar modo prueba. Mantener _config/access.ownerUid configurado privadamente. Esta publicación requiere intervención en la consola, porque el acceso a GitHub no concede administración de Firebase.

## Prueba real desde Pages

Entrar con Google y pulsar Probar guardado y lectura. La página espera confirmación de escritura, lee desde el servidor y elimina el diagnóstico. Solo informa éxito si los tres pasos terminan. Si falla después de guardar, informa que puede quedar un diagnóstico para limpiar/reintentar.

Verificar también desde otro dispositivo con la cuenta autorizada; comprobar denegación con otra cuenta. No ingresar importes, nombres ni datos financieros reales en esta fase. El éxito en el emulador no demuestra que las reglas desplegadas sean las mismas: confirmar mediante estas pruebas y consola.

Drive no está conectado en esta prueba; no se afirma ningún respaldo.
