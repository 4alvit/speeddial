# Código, despliegue y verificación

<!-- language-navigation:start -->
<p dir="ltr">
<a href="Process-and-Results.md" lang="en" dir="ltr">English</a>
<a href="Process-and-Results.ar.md" lang="ar" dir="rtl">العربية</a>
<a href="Process-and-Results.bn.md" lang="bn" dir="ltr">বাংলা</a>
<a href="Process-and-Results.cs.md" lang="cs" dir="ltr">Čeština</a>
<a href="Process-and-Results.de.md" lang="de" dir="ltr">Deutsch</a>
<a href="Process-and-Results.es.md" lang="es" dir="ltr">Español</a>
<a href="Process-and-Results.fa.md" lang="fa" dir="rtl">فارسی</a>
<a href="Process-and-Results.fr.md" lang="fr" dir="ltr">Français</a>
<a href="Process-and-Results.he.md" lang="he" dir="rtl">עברית</a>
<a href="Process-and-Results.hi.md" lang="hi" dir="ltr">हिन्दी</a>
<a href="Process-and-Results.id.md" lang="id" dir="ltr">Bahasa Indonesia</a>
<a href="Process-and-Results.it.md" lang="it" dir="ltr">Italiano</a>
<a href="Process-and-Results.ja.md" lang="ja" dir="ltr">日本語</a>
<a href="Process-and-Results.ko.md" lang="ko" dir="ltr">한국어</a>
<a href="Process-and-Results.nl.md" lang="nl" dir="ltr">Nederlands</a>
<a href="Process-and-Results.pl.md" lang="pl" dir="ltr">Polski</a>
<a href="Process-and-Results.pt.md" lang="pt" dir="ltr">Português</a>
<a href="Process-and-Results.ru.md" lang="ru" dir="ltr">Русский</a>
<a href="Process-and-Results.th.md" lang="th" dir="ltr">ไทย</a>
<a href="Process-and-Results.tr.md" lang="tr" dir="ltr">Türkçe</a>
<a href="Process-and-Results.uk.md" lang="uk" dir="ltr">Українська</a>
<a href="Process-and-Results.vi.md" lang="vi" dir="ltr">Tiếng Việt</a>
<a href="Process-and-Results.zh-Hans.md" lang="zh-Hans" dir="ltr">简体中文</a>
<a href="Process-and-Results.zh-Hant.md" lang="zh-Hant" dir="ltr">繁體中文</a>
</p>
<!-- language-navigation:end -->

[Inicio de la wiki](Home.md)

El repositorio público `speeddial` contiene ambas ediciones de la aplicación, pruebas, ejemplos genéricos de despliegue y documentación. Comienza con un historial Git nuevo y datos sintéticos de prueba. Los archivos operativos privados conservan material histórico y registros de recuperación, consumiendo una revisión pública fijada o una imagen inmutable sin duplicar el código de la aplicación.

La [aplicación local del navegador](https://speeddial.alvit.here.now/) inicia cada visitante con un tablero vacío. Publicar código no copia enlaces ni capturas personales a otro navegador. Los [scripts de copia](../docs/browser-backups.es.md) guían un traslado deliberado con copia de rescate del destino y comparación exacta del contenido tras restaurarlo.

## Proceso de despliegue

![La validación del código, el ensayo aislado de restauración, el despliegue y la aceptación son etapas separadas.](images/release-process.svg)

La edición servidor mantiene soporte para Node.js, Docker y k3s. Fije la revisión pública, compile o seleccione una imagen inmutable verificada y aplique la configuración privada fuera del repositorio. Separe las credenciales y el volumen persistente de datos de la imagen. Use la [guía de transición y reversión](../deploy/README.md) cuando deba migrar una instalación existente.

## Límites del repositorio y los datos

![El código público abastece despliegues privados; los datos personales del navegador y los registros de recuperación del servidor siguen siendo privados.](images/release-results.svg)

El código público no contiene un tablero personal inicial. Las copias locales permanecen en `backups/`, ignorado por Git; los conjuntos de recuperación del servidor incluyen SQLite, imágenes referenciadas y credenciales protegidas aparte. Son formatos de ediciones distintas y no son intercambiables.

## Verificación

Las comprobaciones locales y de CI validan datos sintéticos y los escenarios que ejecutan. Ambas ediciones conservan cinco idiomas, controles contraídos, intercambio por pares, vistas previas que siguen el puntero, dimensiones de cuadrícula y navegación en la misma ventana por defecto.

Un ensayo de migración del servidor compara ID, orden, títulos, URL, ajustes, referencias de imágenes e integridad SQLite. Las comprobaciones de rotación verifican que las sesiones antiguas fallen tras reiniciar. La aceptación real del despliegue comprueba además enrutamiento previsto, credenciales, disponibilidad de imágenes y conservación de datos en el entorno de destino.

Una comprobación del código aprobada no demuestra que haya ocurrido un despliegue o restauración. Mantenga privados los comprobantes reales de despliegue e inventarios personales. Los diagramas describen arquitectura y proceso, no garantizan rendimiento, disponibilidad ni tiempo de recuperación. El código público sigue siendo `UNLICENSED`.
