# Instalar en el teléfono

En Android con Chrome:

1. Abrir https://jonaymeli42-hub.github.io/Control-gastos/app.html.
2. Tocar los tres puntos **⋮** de Chrome.
3. Elegir **Agregar a la pantalla principal** o **Instalar aplicación** (el nombre depende de la versión de Chrome).
4. Si aparece un segundo menú, elegir **Instalar** y confirmar.

El icono se llama Gastos y abre la aplicación con guardado, no la demostración. Si Chrome ofrece solo Crear acceso directo, también permite abrirla desde la pantalla principal. En la primera apertura puede pedir entrar con Google de nuevo: los datos de Firebase y las copias existentes se conservan.

En iPhone: abrir app.html en Safari → Compartir → Agregar a inicio.

El manifest configura nombre, iconos, alcance y apertura standalone. No hay service worker ni caché de datos financieros. Instalarla no habilita guardado sin Internet ni copias con la app cerrada. Se mantiene la sesión de navegador configurada, sin pasar a una sesión permanente de autenticación.

Los controles de cuenta se abren tocando el icono de persona junto al selector de tema: Cerrar sesión, Revisar conexión y detalles del estado. Cuando está conectada, la pantalla principal muestra únicamente un pequeño indicador. Al salir de la sesión vuelve a aparecer el acceso con Google.
