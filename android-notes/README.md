# Anotar gasto para Android

Abre sin grabar. Mantené apretado el micrófono para dictar y soltalo para terminar. Después de conceder permiso por primera vez, volvé a mantenerlo apretado.

Anotador nativo para guardar rápidamente una nota dictada o escrita, con fecha y hora, y revisarla después en Control Gastos o Control Tarjetas. No registra movimientos automáticamente.

Las notas quedan en el almacenamiento privado del teléfono. Al elegir una aplicación se envía la nota mediante el fragmento de su enlace HTTPS. Después de confirmar el gasto, el botón «Volver a Anotar gasto» confirma el registro y quita la nota de pendientes. Abrir o cancelar un formulario no la completa. El menú permite exportar las notas a un archivo JSON.

Requiere Android 8 o posterior. El dictado usa el servicio de reconocimiento de voz del teléfono y puede necesitar Internet. Si no está disponible, se puede escribir. Solo solicita micrófono y acceso a Internet.

## Compilar

Se necesita Java con el módulo jdk.compiler, Python 3 y Android SDK: plataforma android-36 y build-tools 36.0.0.

Configurar ANDROID_SDK_ROOT, ANOTAR_SIGNING_KEY y ANOTAR_SIGNING_PASSWORD_FILE; estos últimos apuntan a una clave PKCS12 con alias anotar y un archivo privado con su contraseña. Conservar la misma clave para poder actualizar la aplicación. Nunca subirlos al repositorio.

Ejecutar `bash build.sh`. El APK firmado y su SHA256 quedan en downloads/.

## Verificar

Las pruebas web de intercambio están en ../tests/native-note-bridge.test.js. `bash test-android.sh` instala el APK y pruebas instrumentadas en un emulador o dispositivo de prueba conectado por adb. **Las pruebas borran las notas del dispositivo de prueba. No ejecutarlas en un teléfono con notas reales.** Comprueban persistencia, intercambio y confirmación autenticada. El dictado debe comprobarse también en un teléfono con un servicio de voz instalado.
