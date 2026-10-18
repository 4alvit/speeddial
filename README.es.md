# Alvit Speed Dial

[English](README.md) · [Русский](README.ru.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Español](README.es.md)

![Edición local de Speed Dial con marcadores ficticios, mostrada en perspectiva.](docs/images/speedial-hero.png)

Edición local del navegador · marcadores e imágenes de demostración · [Captura original](docs/images/speedial-local.jpg) · [Captura y renderizado](docs/images/README.md)

Se mantienen ambas versiones: **Speed Dial** guarda un tablero personal en cada navegador; **Speed Dial autoalojado** guarda un tablero compartido en el servidor y genera capturas automáticamente. Cada versión tiene su propio almacenamiento y recuperación.

[Abrir la aplicación](https://speeddial.alvit.here.now/) · [Copias del navegador](docs/browser-backups.md) · [Node.js](README.md#local-development) · [Docker](README.md#docker) · [k3s / Kubernetes](README.md#k3s--kubernetes) · [Runners CI](docs/CI.md) · [Perfil de la organización](docs/organization-profile.md)

## Versión pública local del navegador: Speed Dial

[Abrir Speed Dial](https://speeddial.alvit.here.now/) — la aplicación pública cuyos datos permanecen en el navegador. Esta es la dirección principal para tu tablero; guárdala en favoritos. [Guía de almacenamiento, privacidad y traslado](docs/local-speedial.md).

Cada visitante empieza con un tablero vacío. Los enlaces, ajustes y datos de imágenes permanecen en ese perfil del navegador. La misma dirección o un ID local copiado no los muestra en otro ordenador. No hay API de tablero compartido, sincronización en la nube ni capturas automáticas de sitios. Se mantienen los cinco idiomas y los controles de las miniaturas.

**Exportar copia** e **Importar copia** permiten trasladar de forma deliberada el tablero completo, con imágenes e idioma. Tras la vista previa y confirmación, la importación reemplaza el tablero de destino. Los dominios, navegadores y perfiles distintos tienen almacenamiento separado, aunque muestren el mismo código. Mantén privada la copia JSON sin cifrar; limpiar los datos del navegador puede borrar el tablero local.

Compilar: `npm run build:local`; verificar: `npm run test:local`. Publicar solo los archivos permitidos de `dist/local`. La versión de servidor descrita a continuación sigue separada.

### Copias locales y traslado entre navegadores

Con Node.js 24+, desde este repositorio:

```sh
npm run backup:browser -- --browser chrome
npm run restore:browser -- backups/YOUR-BACKUP.json --browser firefox
```

Sustituye `YOUR-BACKUP.json` por el nombre de tu copia. Los scripts interactivos guían la exportación e importación del tablero completo, con imágenes y ajustes. Las copias permanecen en `backups/`, excluido de Git. Primero se guarda el tablero de destino; después de reemplazarlo, se compara una nueva exportación con la copia de origen. En macOS se pueden abrir Chrome, Firefox y otros navegadores instalados. Usa `--no-open` para un navegador ya abierto o en Windows/Linux. Los scripts no leen las bases internas del perfil ni sincronizan navegadores. [Procedimiento completo en inglés](docs/browser-backups.md).

## Versión autoalojada

Un tablero compartido de marcadores en tu propio servidor, con miniaturas compactas, edición directa, intercambio de dos posiciones y ajustes persistentes. La interfaz admite inglés, ruso, alemán, francés y español.

El servidor lee las credenciales desde archivos externos y guarda los datos fuera de la imagen. El repositorio público `speeddial` contiene el código y ejemplos genéricos de despliegue. El repositorio privado de operaciones conserva el historial privado y los materiales de recuperación, usando una revisión fija del código público sin duplicarlo.

![Arquitectura con secretos externos, datos persistentes y red restringida para capturas.](wiki/images/architecture.svg)

## Funciones

La cabecera empieza contraída; la flecha derecha muestra ajustes, exportación y creación de sitios. No hay títulos permanentes bajo las miniaturas. Al arrastrar, la vista previa sigue al puntero y solo intercambia origen y destino. Hay controles táctiles y de teclado.

Permite 1–12 filas y columnas, con 4 × 5 por defecto. Los marcadores adicionales siguen en otras páginas. Los enlaces abren en la misma ventana por defecto. El idioma se guarda en este navegador; cuadrícula y comportamiento de enlaces son compartidos.

Una nueva URL genera una captura automática. Admite PNG, JPEG, WebP y GIF de hasta 5 MiB. El navegador del servidor no recibe tus cookies personales. Una base nueva comienza vacía por defecto.

## Acceso y desarrollo

Se requieren Node.js 24+, Chromium instalado y dos archivos externos obligatorios:

- `ACCESS_TOKEN_FILE`: token aleatorio apto para URL, de al menos 32 caracteres tras quitar espacios exteriores.
- `SESSION_KEY_FILE`: clave de firma de al menos 32 bytes sin codificar.

La dirección tiene la forma `https://bookmarks.example.test/?access=<token>`. Es solo un ejemplo. Cada navegación necesita el token; la cookie permite leer y editar. No hay contraseña de editor aparte. Cambiar token, clave o `AUTH_EPOCH` invalida las sesiones anteriores después de reiniciar.

No guardes secretos, enlaces completos, bases ni imágenes privadas en Git o en la imagen del contenedor. Consulta la [configuración local en inglés](README.md#local-development).

```sh
npm ci
npm run check
CHROMIUM_PATH=/path/to/chromium npm run test:browser
```

`DATA_DIR` contiene SQLite, `images/` y las `legacy-images/` migradas. El archivo externo opcional `INITIAL_STATE_FILE` inicializa únicamente una base nueva. Una base existente no se vuelve a crear.

## Operación y publicación

[Wiki](wiki/Home.md), [API](wiki/API.md), [configuración](wiki/Configuration.md), [migración y recuperación](deploy/README.md), [seguridad](SECURITY.md), [estado](wiki/Process-and-Results.md). La documentación técnica detallada está en inglés.

La **exportación JSON del servidor** no incluye bytes de imágenes y no es una copia de seguridad completa. Recuperar requiere datos coherentes y secretos externos protegidos fuera del nodo. La copia del navegador usa otro formato y sí incluye imágenes. El cambio en producción necesita autorización adicional.

Se conserva la ejecución mediante [Docker](README.md#docker) y [k3s / Kubernetes](README.md#k3s--kubernetes). El ejemplo de Docker mantiene datos y secretos fuera de la imagen; k3s requiere un overlay propio para imagen, almacenamiento y rutas. Publicar la versión local no cambia el despliegue del servidor. También se incluye una [guía con ejemplo de README para el perfil de la organización](docs/organization-profile.md).

Este repositorio público comienza con un historial nuevo y ejemplos sintéticos. El historial privado anterior permanece en el repositorio privado de operaciones. Las copias, las credenciales y los datos personales quedan fuera de Git. El código puede consultarse públicamente, pero sigue siendo `UNLICENSED`; no se concede una licencia de redistribución de código abierto.
