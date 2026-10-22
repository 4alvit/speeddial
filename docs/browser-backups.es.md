# Scripts de copia y restauración local del navegador

<!-- language-navigation:start -->
<p dir="ltr">
<a href="browser-backups.md" lang="en" dir="ltr">English</a>
<a href="browser-backups.ar.md" lang="ar" dir="rtl">العربية</a>
<a href="browser-backups.bn.md" lang="bn" dir="ltr">বাংলা</a>
<a href="browser-backups.cs.md" lang="cs" dir="ltr">Čeština</a>
<a href="browser-backups.de.md" lang="de" dir="ltr">Deutsch</a>
<a href="browser-backups.es.md" lang="es" dir="ltr">Español</a>
<a href="browser-backups.fa.md" lang="fa" dir="rtl">فارسی</a>
<a href="browser-backups.fr.md" lang="fr" dir="ltr">Français</a>
<a href="browser-backups.he.md" lang="he" dir="rtl">עברית</a>
<a href="browser-backups.hi.md" lang="hi" dir="ltr">हिन्दी</a>
<a href="browser-backups.id.md" lang="id" dir="ltr">Bahasa Indonesia</a>
<a href="browser-backups.it.md" lang="it" dir="ltr">Italiano</a>
<a href="browser-backups.ja.md" lang="ja" dir="ltr">日本語</a>
<a href="browser-backups.ko.md" lang="ko" dir="ltr">한국어</a>
<a href="browser-backups.nl.md" lang="nl" dir="ltr">Nederlands</a>
<a href="browser-backups.pl.md" lang="pl" dir="ltr">Polski</a>
<a href="browser-backups.pt.md" lang="pt" dir="ltr">Português</a>
<a href="browser-backups.ru.md" lang="ru" dir="ltr">Русский</a>
<a href="browser-backups.th.md" lang="th" dir="ltr">ไทย</a>
<a href="browser-backups.tr.md" lang="tr" dir="ltr">Türkçe</a>
<a href="browser-backups.uk.md" lang="uk" dir="ltr">Українська</a>
<a href="browser-backups.vi.md" lang="vi" dir="ltr">Tiếng Việt</a>
<a href="browser-backups.zh-Hans.md" lang="zh-Hans" dir="ltr">简体中文</a>
<a href="browser-backups.zh-Hant.md" lang="zh-Hant" dir="ltr">繁體中文</a>
</p>
<!-- language-navigation:end -->

[Guía de migración](browser-migration.md) · [Todas las opciones de despliegue](../README.md#storage-and-deployment)

Estos scripts conservan el **tablero de Speed Dial**: enlaces ordenados, títulos, bytes completos de las imágenes, filas, columnas, preferencia de apertura e idioma. No copian el historial, las contraseñas, las extensiones ni otros marcadores del navegador. Utilizan el formato JSON portátil `speedial-local-backup` de la aplicación, no las bases internas de Chrome o Firefox.

Operan sobre la aplicación local del navegador en [speeddial.alvit.here.now](https://speeddial.alvit.here.now/). No sustituyen las [copias del servidor](../wiki/Operations.md#backup-and-restore) para Node.js, Docker o k3s. El antiguo exportado JSON del servidor no se acepta como copia completa del navegador; trasladar ese tablero requiere el [procedimiento de recopilación y conversión de imágenes](browser-migration.md).

Si el tablero sigue en `speedial.alvit.here.now`, expórtelo primero desde esa dirección exacta; ahora los scripts abren `speeddial.alvit.here.now`. Use `--no-open` con la pestaña antigua ya abierta o archive explícitamente su exportación guardada. Siguen admitiéndose los archivos `speedial-local-backup` antiguos y los nombres de descarga `speedial-backup-*.json`. Consulte las [notas de cambio de dirección](local-speedial.md#corrected-address-and-existing-backups).

## Requisitos y compatibilidad de navegadores

Ejecute Node.js 24+ desde esta copia de Git. No necesita instalar otros paquetes. En macOS el lanzador reconoce Chrome, Firefox, Safari, Edge, Brave, Arc, Opera, Vivaldi, Chromium, Orion, Zen, LibreWolf y Waterfox en `/Applications`, `~/Applications` o `/System/Applications`. Esto indica compatibilidad del lanzador, no que cada navegador haya sido probado. Las pruebas automáticas de la aplicación usan Chromium, Firefox y WebKit.

```sh
npm run backup:browser -- --list-browsers
```

Para otro navegador de macOS use `--app /absolute/path/Browser.app`. Para un navegador ya abierto, el navegador integrado de Codex, Windows o Linux, use `--no-open` y abra el sitio manualmente. No necesita puerto de depuración, extensión, permiso de Accesibilidad ni acceso directo a archivos del perfil.

```sh
npm run backup:browser -- --no-open
npm run restore:browser -- backups/YOUR-BACKUP.json --no-open
npm run restore:browser -- backups/YOUR-BACKUP.json --app "/Applications/Brave Browser.app"
```

La URL de apertura está fijada a la dirección principal. Un tablero de otro origen debe exportarse desde ese origen exacto; use allí `--no-open` y compruebe personalmente la dirección de destino. El almacenamiento del navegador no sigue redirecciones ni cambios de nombre del servidor.

**Son scripts interactivos.** Abren la aplicación y gestionan archivos locales, pero usted pulsa exportar, elige el archivo de importación y confirma la sustitución. Una aplicación puede tener varios perfiles: seleccione el previsto y use [speeddial.alvit.here.now](https://speeddial.alvit.here.now/). Es normal que un perfil nuevo esté vacío. El script no puede certificar qué perfil produjo una descarga.

## Copiar desde Chrome

```sh
npm run backup:browser -- --browser chrome
```

1. Seleccione su perfil existente de Chrome, despliegue la flecha superior derecha y pulse **Export backup**.
2. Guarde con el nombre sugerido `speedial-backup-YYYY-MM-DD.json` en `~/Downloads`. Se admiten sufijos por coincidencia de nombres como ` (1)`.
3. El script espera una exportación nueva y completa, la valida, la copia a `backups/`, vuelve a leerla e imprime ruta, recuentos y SHA-256. Nunca recurre a una exportación antigua. Varias exportaciones simultáneas provocan un error en vez de una elección arbitraria.

Use `--downloads /absolute/local/folder` si el navegador descarga en otra ubicación; elija esa misma carpeta en el navegador. Elija carpetas locales fuera de directorios sincronizados con la nube. La espera predeterminada es de diez minutos; `--timeout 1200` la cambia a veinte. Puede ser necesario confirmar el diálogo **Save As** del navegador antes de que exista el archivo. Para una exportación renombrada o ya descargada:

```sh
npm run backup:browser -- --file /absolute/local/export.json
```

El modo de archivo explícito archiva ese archivo; **no** obtiene datos actuales del navegador ni demuestra su actualidad. Los originales descargados se conservan. Las exportaciones recogidas por el observador se restringen al modo `0600` en POSIX; los archivos de entrada explícitos no se modifican.

## Restaurar en otro navegador

Sustituya `YOUR-BACKUP.json` por el nombre de copia impreso:

```sh
npm run restore:browser -- backups/YOUR-BACKUP.json --browser firefox
npm run restore:browser -- backups/YOUR-BACKUP.json --browser chrome
npm run restore:browser -- backups/YOUR-BACKUP.json --browser safari
```

El comando de restauración requiere un terminal interactivo y guía un navegador/perfil cada vez:

1. Valida y conserva una copia separada `restore-source`. En el perfil de destino exporte el tablero actual, aunque esté vacío. El script lo guarda como `before-restore` para que siga siendo recuperable.
2. Confirme en el terminal que la exportación procede del perfil de destino correcto escribiendo `RESTORE`.
3. Pulse **Import backup** en ese mismo navegador, elija el archivo `restore-source` indicado, revise el resumen y pulse **Replace this board**. En macOS pulse **⌘⇧G** en el selector de archivos y pegue la ruta absoluta.
4. Recargue Speed Dial, compruebe que aparecen las imágenes y exporte de nuevo. El script archiva esa exportación `after-restore` y compara enlaces ordenados, títulos, bytes de imágenes, cuadrícula, preferencia de apertura e idioma con el origen. Ignora los ID internos regenerados y las marcas de tiempo. Las copias antiguas sin idioma conservan el idioma del destino.

Solo se informa del éxito cuando coincide el contenido. Una diferencia o tiempo agotado **no** es una restauración verificada. Se guardan todas las copias; no hay reversión automática. Para revertir, repita el comando con el archivo `before-restore` guardado. Las exportaciones coincidentes prueban igualdad de contenido; aún debe comprobar perfil, origen e imágenes visibles.

Para volver después a Chrome use el mismo comando con `--browser chrome` y el JSON guardado deseado. El formato no depende del navegador de origen. Cada restauración sustituye un tablero de destino, no fusiona sus enlaces; conserve la copia automática del destino si puede necesitar ambas versiones.

No exporte desde otra pestaña o perfil mientras espera un comando. Ejecute comandos separados para navegadores diferentes. Es un traslado único; los cambios posteriores no se sincronizan.

## Almacenamiento exclusivamente local y validación

Toda salida de los scripts va al directorio fijo `backups/` de esta copia de Git. El comando comprueba que Git lo ignora y que no contiene archivos rastreados. Rechaza un directorio de salida que sea enlace simbólico. Cada copia tiene nombre único, se guarda sin sobrescribir otros archivos, se relee y tiene un `.receipt.json` con recuentos y resúmenes, pero sin títulos ni URL. Una entrada inválida no crea copia. La CLI reutiliza la validación de esquema, base64 y cabeceras de imágenes ráster de la aplicación; la aplicación de destino además decodifica las imágenes antes de la importación atómica.

Use el archivo `.json` del tablero para restaurar, no el `.receipt.json` que lo acompaña. El comprobante registra metadatos de verificación y no restaura tableros. Los scripts no eliminan automáticamente copias antiguas ni originales descargados; conserve las copias necesarias y gestione localmente su almacenamiento.

En macOS/Linux el directorio tiene modo `0700` y los archivos `0600`. En Windows restrinja el acceso mediante ACL del sistema de archivos para la cuenta; los modos POSIX no garantizan ACL. Las copias JSON son texto sin cifrar. Los scripts no contienen código de subida ni sincronización. La carpeta se excluye de Git, del contexto de compilación Docker y de la lista de archivos permitidos del frontend público. `.gitignore` no impide adiciones forzadas a Git, compartir manualmente, copias del sistema operativo ni un cliente de sincronización configurado aparte. Mantenga la copia de Git y la carpeta de descargas fuera de directorios sincronizados para un almacenamiento exclusivamente local.

No hay datos de tableros incrustados en scripts, pruebas, documentación ni el sitio público. Consulte las [limitaciones del almacenamiento del navegador](local-speedial.md#what-is-private-and-what-is-not) y la [aceptación de la migración](browser-migration.md).
