'use strict';

// Kept dependency-free so the same catalog can be checked in Node and browsers.
(() => {
  const languages = Object.freeze({ en: 'English', ru: 'Русский', de: 'Deutsch', fr: 'Français', es: 'Español' });
  const storageKey = 'speeddial.language';
  const catalogs = {
    en: {
      appTitle: 'Speed Dial', home: 'Speed Dial home', showControls: 'Show controls', hideControls: 'Hide controls',
      settings: 'Settings', export: 'Export', addSite: 'Add site', editSite: 'Edit site', save: 'Save', cancel: 'Cancel', close: 'Close',
      help: 'Drag a thumbnail onto another to swap their positions. On touch screens, use its grip. The pencil edits a site.',
      savedSites: 'Saved sites', loading: 'Loading your sites…', loadFailed: 'Could not load your sites', connectionHint: 'Check your connection and try again.', retry: 'Retry',
      sitePages: 'Site pages', previous: 'Previous', next: 'Next', pageStatus: 'Page {page} of {total}', emptyTitle: 'Your sites will appear here',
      emptyDescription: 'Add a link and a screenshot will appear automatically.', firstSite: 'Add your first site', connectionLost: 'Connection lost. Reconnecting…',
      rows: 'Rows', columns: 'Columns', capacity: 'Sites per page: {count}', layoutHint: 'Choose 1–12 rows and columns. Extra sites appear on the next page. Columns stay fixed; narrow screens can scroll sideways.',
      openLinksIn: 'Open links in', sameWindow: 'Same window (default)', newWindow: 'New window / tab', saveSettings: 'Save settings',
      language: 'Language', languageHint: 'Saved in this browser only. Rows, columns, and link settings are shared by all browsers.',
      websiteAddress: 'Website address', urlHint: 'You can enter an address without https://.', name: 'Name', optional: 'optional', namePlaceholder: 'For example, Mail',
      previewNote: 'A screenshot will be added automatically.', previewNoteHint: 'You can refresh it or upload your own image.', thumbnail: 'Thumbnail', refreshScreenshot: 'Refresh screenshot', uploadImage: 'Upload image',
      imageHint: 'PNG, JPG, WebP, or GIF · up to 5 MB', delete: 'Delete', deleteSite: 'Delete site', deleteTitle: 'Delete site?', keepSite: 'Keep site',
      deleteDescription: '“{name}” will be removed from your sites. You can add it again later.', dismiss: 'Dismiss notification', untitled: 'Untitled',
      openSame: '{name} — open in this window', openNew: '{name} — open in a new window or tab', capturing: 'Capturing screenshot', screenshotUnavailable: 'Screenshot unavailable',
      screenshotFailed: 'Could not capture this page. It may require sign-in or block screenshots. Try again or upload your own image.',
      moveSite: 'Move {name}. Use arrow keys to swap positions; Home and End swap with the first and last site.', editNamed: 'Edit {name}',
      invalidDimensions: 'Rows and columns must be whole numbers from 1 to 12.', deletedElsewhere: 'This site was deleted in another tab.',
      capturePending: 'Capturing a screenshot. You can close this dialog; the thumbnail will update automatically.', captureHint: 'Changing the website address will capture a new screenshot.',
      invalidUrl: 'Enter a valid website address, such as https://example.com.', invalidProtocol: 'Only http:// and https:// addresses are supported.', urlCredentials: 'The website address must not contain a username or password.',
      swapped: 'Positions swapped. Position {position} of {total}.', dragCancelled: 'Move cancelled.', settingsSaved: 'Settings saved.', changesSaved: 'Changes saved.', siteAdded: 'Site added. A screenshot will appear shortly.', captureStarted: 'Capturing a new screenshot.', imageSaved: 'Your image has been saved.', siteDeleted: 'Site deleted.',
      imageType: 'Choose a PNG, JPG, WebP, or GIF image.', imageTooLarge: 'The image must be no larger than 5 MB.', imageReadFailed: 'Could not read this file. Select the image again.',
      storageUnavailable: 'Language changed for this page. Your browser did not allow saving the preference.',
      busy: 'Please wait for the previous action to finish.', conflict: 'Your sites changed in another tab. The list has been updated; please try again.', unexpectedResponse: 'The server returned an unexpected response. Reload this page.',
      formConflict: 'Another tab changed your sites. Your edits are kept; untouched fields were refreshed. Review the form and save again.',
      serverError: 'Server error {status}. Please try again.', sessionExpired: 'Access expired. Reload this page using your access link.', forbidden: 'This request was blocked. Reload this page using your access link.',
      notFound: 'The requested item was not found. Refresh and try again.', invalidTitle: 'Enter a valid name.', titleTooLong: 'The name must not exceed 300 characters.',
      imageRequired: 'Select an image.', invalidImage: 'The image is invalid or does not match its file type.', invalidImageSize: 'The image is empty, damaged, or larger than 5 MB.',
      invalidRequest: 'The request could not be processed. Reload this page and try again.', bookmarkLimit: 'The limit of 500 sites has been reached.', invalidLinkTarget: 'Choose where links should open.', invalidOrder: 'The site order is invalid. Refresh and try again.'
    },
    ru: {
      appTitle: 'Speed Dial', home: 'Главная Speed Dial', showControls: 'Показать панель', hideControls: 'Скрыть панель',
      settings: 'Настройки', export: 'Экспорт', addSite: 'Добавить сайт', editSite: 'Изменить сайт', save: 'Сохранить', cancel: 'Отмена', close: 'Закрыть',
      help: 'Перетащите миниатюру на другую, чтобы поменять их местами. На сенсорном экране используйте ручку переноса. Карандаш открывает редактирование.',
      savedSites: 'Сохранённые сайты', loading: 'Загрузка сайтов…', loadFailed: 'Не удалось загрузить сайты', connectionHint: 'Проверьте подключение и повторите попытку.', retry: 'Повторить',
      sitePages: 'Страницы сайтов', previous: 'Назад', next: 'Далее', pageStatus: 'Страница {page} из {total}', emptyTitle: 'Здесь появятся ваши сайты',
      emptyDescription: 'Добавьте ссылку, и снимок страницы появится автоматически.', firstSite: 'Добавить первый сайт', connectionLost: 'Соединение потеряно. Переподключение…',
      rows: 'Строки', columns: 'Столбцы', capacity: 'Сайтов на странице: {count}', layoutHint: 'Выберите от 1 до 12 строк и столбцов. Остальные сайты появятся на следующей странице. Число столбцов фиксировано; на узком экране доступна горизонтальная прокрутка.',
      openLinksIn: 'Открывать ссылки', sameWindow: 'В этом окне (по умолчанию)', newWindow: 'В новом окне или вкладке', saveSettings: 'Сохранить настройки',
      language: 'Язык', languageHint: 'Сохраняется только в этом браузере. Строки, столбцы и способ открытия ссылок общие для всех браузеров.',
      websiteAddress: 'Адрес сайта', urlHint: 'Можно ввести адрес без https://.', name: 'Название', optional: 'необязательно', namePlaceholder: 'Например, Почта',
      previewNote: 'Снимок страницы будет добавлен автоматически.', previewNoteHint: 'Его можно обновить или загрузить своё изображение.', thumbnail: 'Миниатюра', refreshScreenshot: 'Обновить снимок', uploadImage: 'Загрузить изображение',
      imageHint: 'PNG, JPG, WebP или GIF · до 5 МБ', delete: 'Удалить', deleteSite: 'Удалить сайт', deleteTitle: 'Удалить сайт?', keepSite: 'Оставить сайт',
      deleteDescription: '«{name}» будет удалён из ваших сайтов. Позже его можно добавить снова.', dismiss: 'Закрыть уведомление', untitled: 'Без названия',
      openSame: '{name} — открыть в этом окне', openNew: '{name} — открыть в новом окне или вкладке', capturing: 'Создание снимка', screenshotUnavailable: 'Снимок недоступен',
      screenshotFailed: 'Не удалось создать снимок страницы. Возможно, сайт требует входа или блокирует снимки. Повторите попытку или загрузите своё изображение.',
      moveSite: 'Переместить {name}. Стрелки меняют сайты местами; Home и End меняют местами с первым и последним сайтом.', editNamed: 'Изменить {name}',
      invalidDimensions: 'Число строк и столбцов должно быть целым от 1 до 12.', deletedElsewhere: 'Этот сайт удалён в другой вкладке.',
      capturePending: 'Создаётся снимок. Это окно можно закрыть: миниатюра обновится автоматически.', captureHint: 'При изменении адреса сайта будет создан новый снимок.',
      invalidUrl: 'Введите корректный адрес сайта, например https://example.com.', invalidProtocol: 'Поддерживаются только адреса http:// и https://.', urlCredentials: 'Адрес сайта не должен содержать имя пользователя или пароль.',
      swapped: 'Сайты поменялись местами. Позиция {position} из {total}.', dragCancelled: 'Перемещение отменено.', settingsSaved: 'Настройки сохранены.', changesSaved: 'Изменения сохранены.', siteAdded: 'Сайт добавлен. Снимок появится в ближайшее время.', captureStarted: 'Создаётся новый снимок.', imageSaved: 'Изображение сохранено.', siteDeleted: 'Сайт удалён.',
      imageType: 'Выберите изображение PNG, JPG, WebP или GIF.', imageTooLarge: 'Размер изображения не должен превышать 5 МБ.', imageReadFailed: 'Не удалось прочитать файл. Выберите изображение снова.',
      storageUnavailable: 'Язык изменён для этой страницы. Браузер не разрешил сохранить настройку.',
      busy: 'Дождитесь завершения предыдущего действия.', conflict: 'Список сайтов изменён в другой вкладке. Список обновлён; повторите попытку.', unexpectedResponse: 'Сервер вернул неожиданный ответ. Перезагрузите страницу.',
      formConflict: 'Сайты изменены в другой вкладке. Ваши правки сохранены в форме, остальные поля обновлены. Проверьте форму и сохраните снова.',
      serverError: 'Ошибка сервера {status}. Повторите попытку.', sessionExpired: 'Срок доступа истёк. Перезагрузите страницу по вашей ссылке доступа.', forbidden: 'Запрос заблокирован. Перезагрузите страницу по вашей ссылке доступа.',
      notFound: 'Запрошенный объект не найден. Обновите страницу и повторите попытку.', invalidTitle: 'Введите корректное название.', titleTooLong: 'Название не должно превышать 300 символов.',
      imageRequired: 'Выберите изображение.', invalidImage: 'Изображение повреждено или не соответствует типу файла.', invalidImageSize: 'Изображение пустое, повреждено или превышает 5 МБ.',
      invalidRequest: 'Не удалось обработать запрос. Перезагрузите страницу и повторите попытку.', bookmarkLimit: 'Достигнут предел в 500 сайтов.', invalidLinkTarget: 'Выберите способ открытия ссылок.', invalidOrder: 'Порядок сайтов некорректен. Обновите страницу и повторите попытку.'
    },
    de: {
      appTitle: 'Speed Dial', home: 'Speed-Dial-Startseite', showControls: 'Bedienelemente anzeigen', hideControls: 'Bedienelemente ausblenden',
      settings: 'Einstellungen', export: 'Exportieren', addSite: 'Website hinzufügen', editSite: 'Website bearbeiten', save: 'Speichern', cancel: 'Abbrechen', close: 'Schließen',
      help: 'Ziehen Sie ein Vorschaubild auf ein anderes, um ihre Plätze zu tauschen. Nutzen Sie auf Touchscreens den Ziehgriff. Der Stift öffnet die Bearbeitung.',
      savedSites: 'Gespeicherte Websites', loading: 'Websites werden geladen…', loadFailed: 'Websites konnten nicht geladen werden', connectionHint: 'Prüfen Sie die Verbindung und versuchen Sie es erneut.', retry: 'Erneut versuchen',
      sitePages: 'Website-Seiten', previous: 'Zurück', next: 'Weiter', pageStatus: 'Seite {page} von {total}', emptyTitle: 'Hier erscheinen Ihre Websites',
      emptyDescription: 'Fügen Sie einen Link hinzu. Ein Screenshot wird automatisch erstellt.', firstSite: 'Erste Website hinzufügen', connectionLost: 'Verbindung verloren. Neuer Verbindungsversuch…',
      rows: 'Zeilen', columns: 'Spalten', capacity: 'Websites pro Seite: {count}', layoutHint: 'Wählen Sie jeweils 1–12 Zeilen und Spalten. Weitere Websites erscheinen auf der nächsten Seite. Die Spaltenzahl bleibt fest; schmale Bildschirme lassen sich seitlich scrollen.',
      openLinksIn: 'Links öffnen in', sameWindow: 'Diesem Fenster (Standard)', newWindow: 'Neuem Fenster / Tab', saveSettings: 'Einstellungen speichern',
      language: 'Sprache', languageHint: 'Wird nur in diesem Browser gespeichert. Zeilen, Spalten und Link-Einstellungen gelten für alle Browser.',
      websiteAddress: 'Website-Adresse', urlHint: 'Sie können die Adresse ohne https:// eingeben.', name: 'Name', optional: 'optional', namePlaceholder: 'Zum Beispiel: E-Mail',
      previewNote: 'Ein Screenshot wird automatisch hinzugefügt.', previewNoteHint: 'Sie können ihn aktualisieren oder ein eigenes Bild hochladen.', thumbnail: 'Vorschaubild', refreshScreenshot: 'Screenshot aktualisieren', uploadImage: 'Bild hochladen',
      imageHint: 'PNG, JPG, WebP oder GIF · bis zu 5 MB', delete: 'Löschen', deleteSite: 'Website löschen', deleteTitle: 'Website löschen?', keepSite: 'Website behalten',
      deleteDescription: '„{name}“ wird aus Ihren Websites entfernt. Sie können die Website später wieder hinzufügen.', dismiss: 'Benachrichtigung schließen', untitled: 'Ohne Titel',
      openSame: '{name} — in diesem Fenster öffnen', openNew: '{name} — in neuem Fenster oder Tab öffnen', capturing: 'Screenshot wird erstellt', screenshotUnavailable: 'Screenshot nicht verfügbar',
      screenshotFailed: 'Für diese Seite konnte kein Screenshot erstellt werden. Sie erfordert möglicherweise eine Anmeldung oder blockiert Screenshots. Versuchen Sie es erneut oder laden Sie ein eigenes Bild hoch.',
      moveSite: '{name} verschieben. Mit den Pfeiltasten Plätze tauschen; Pos1 und Ende tauschen mit der ersten und letzten Website.', editNamed: '{name} bearbeiten',
      invalidDimensions: 'Zeilen und Spalten müssen ganze Zahlen von 1 bis 12 sein.', deletedElsewhere: 'Diese Website wurde in einem anderen Tab gelöscht.',
      capturePending: 'Screenshot wird erstellt. Sie können dieses Fenster schließen; das Vorschaubild wird automatisch aktualisiert.', captureHint: 'Wenn Sie die Website-Adresse ändern, wird ein neuer Screenshot erstellt.',
      invalidUrl: 'Geben Sie eine gültige Website-Adresse ein, etwa https://example.com.', invalidProtocol: 'Nur Adressen mit http:// oder https:// werden unterstützt.', urlCredentials: 'Die Website-Adresse darf keinen Benutzernamen und kein Passwort enthalten.',
      swapped: 'Plätze getauscht. Position {position} von {total}.', dragCancelled: 'Verschieben abgebrochen.', settingsSaved: 'Einstellungen gespeichert.', changesSaved: 'Änderungen gespeichert.', siteAdded: 'Website hinzugefügt. Der Screenshot erscheint in Kürze.', captureStarted: 'Neuer Screenshot wird erstellt.', imageSaved: 'Ihr Bild wurde gespeichert.', siteDeleted: 'Website gelöscht.',
      imageType: 'Wählen Sie ein PNG-, JPG-, WebP- oder GIF-Bild.', imageTooLarge: 'Das Bild darf höchstens 5 MB groß sein.', imageReadFailed: 'Datei konnte nicht gelesen werden. Wählen Sie das Bild erneut aus.',
      storageUnavailable: 'Sprache für diese Seite geändert. Ihr Browser hat das Speichern der Einstellung nicht erlaubt.',
      busy: 'Warten Sie, bis die vorherige Aktion abgeschlossen ist.', conflict: 'Ihre Websites wurden in einem anderen Tab geändert. Die Liste wurde aktualisiert; versuchen Sie es erneut.', unexpectedResponse: 'Unerwartete Serverantwort. Laden Sie diese Seite neu.',
      formConflict: 'Ihre Websites wurden in einem anderen Tab geändert. Ihre Eingaben bleiben erhalten; unveränderte Felder wurden aktualisiert. Prüfen und speichern Sie das Formular erneut.',
      serverError: 'Serverfehler {status}. Versuchen Sie es erneut.', sessionExpired: 'Zugriff abgelaufen. Laden Sie die Seite über Ihren Zugangslink neu.', forbidden: 'Diese Anfrage wurde blockiert. Laden Sie die Seite über Ihren Zugangslink neu.',
      notFound: 'Der angeforderte Eintrag wurde nicht gefunden. Aktualisieren Sie die Seite und versuchen Sie es erneut.', invalidTitle: 'Geben Sie einen gültigen Namen ein.', titleTooLong: 'Der Name darf höchstens 300 Zeichen enthalten.',
      imageRequired: 'Wählen Sie ein Bild.', invalidImage: 'Das Bild ist ungültig oder passt nicht zum Dateityp.', invalidImageSize: 'Das Bild ist leer, beschädigt oder größer als 5 MB.',
      invalidRequest: 'Die Anfrage konnte nicht verarbeitet werden. Laden Sie die Seite neu und versuchen Sie es erneut.', bookmarkLimit: 'Die Grenze von 500 Websites wurde erreicht.', invalidLinkTarget: 'Wählen Sie, wo Links geöffnet werden sollen.', invalidOrder: 'Die Website-Reihenfolge ist ungültig. Aktualisieren Sie die Seite und versuchen Sie es erneut.'
    },
    fr: {
      appTitle: 'Speed Dial', home: 'Accueil Speed Dial', showControls: 'Afficher les commandes', hideControls: 'Masquer les commandes',
      settings: 'Paramètres', export: 'Exporter', addSite: 'Ajouter un site', editSite: 'Modifier le site', save: 'Enregistrer', cancel: 'Annuler', close: 'Fermer',
      help: 'Glissez une miniature sur une autre pour échanger leurs positions. Sur écran tactile, utilisez sa poignée. Le crayon permet de modifier le site.',
      savedSites: 'Sites enregistrés', loading: 'Chargement de vos sites…', loadFailed: 'Impossible de charger vos sites', connectionHint: 'Vérifiez votre connexion et réessayez.', retry: 'Réessayer',
      sitePages: 'Pages de sites', previous: 'Précédent', next: 'Suivant', pageStatus: 'Page {page} sur {total}', emptyTitle: 'Vos sites apparaîtront ici',
      emptyDescription: 'Ajoutez un lien : une capture apparaîtra automatiquement.', firstSite: 'Ajouter votre premier site', connectionLost: 'Connexion perdue. Reconnexion…',
      rows: 'Lignes', columns: 'Colonnes', capacity: 'Sites par page : {count}', layoutHint: 'Choisissez de 1 à 12 lignes et colonnes. Les sites supplémentaires apparaissent à la page suivante. Les colonnes restent fixes ; les écrans étroits permettent un défilement horizontal.',
      openLinksIn: 'Ouvrir les liens dans', sameWindow: 'La même fenêtre (par défaut)', newWindow: 'Une nouvelle fenêtre / un nouvel onglet', saveSettings: 'Enregistrer les paramètres',
      language: 'Langue', languageHint: 'Enregistrée uniquement dans ce navigateur. Les lignes, colonnes et paramètres des liens sont communs à tous les navigateurs.',
      websiteAddress: 'Adresse du site', urlHint: 'Vous pouvez saisir une adresse sans https://.', name: 'Nom', optional: 'facultatif', namePlaceholder: 'Par exemple, Courrier',
      previewNote: 'Une capture sera ajoutée automatiquement.', previewNoteHint: 'Vous pouvez l’actualiser ou importer votre propre image.', thumbnail: 'Miniature', refreshScreenshot: 'Actualiser la capture', uploadImage: 'Importer une image',
      imageHint: 'PNG, JPG, WebP ou GIF · 5 Mo maximum', delete: 'Supprimer', deleteSite: 'Supprimer le site', deleteTitle: 'Supprimer le site ?', keepSite: 'Conserver le site',
      deleteDescription: '« {name} » sera supprimé de vos sites. Vous pourrez l’ajouter à nouveau plus tard.', dismiss: 'Fermer la notification', untitled: 'Sans titre',
      openSame: '{name} — ouvrir dans cette fenêtre', openNew: '{name} — ouvrir dans une nouvelle fenêtre ou un nouvel onglet', capturing: 'Capture en cours', screenshotUnavailable: 'Capture indisponible',
      screenshotFailed: 'Impossible de capturer cette page. Elle nécessite peut-être une connexion ou bloque les captures. Réessayez ou importez votre propre image.',
      moveSite: 'Déplacer {name}. Les flèches échangent les positions ; Début et Fin échangent avec le premier et le dernier site.', editNamed: 'Modifier {name}',
      invalidDimensions: 'Les lignes et les colonnes doivent être des nombres entiers de 1 à 12.', deletedElsewhere: 'Ce site a été supprimé dans un autre onglet.',
      capturePending: 'Capture en cours. Vous pouvez fermer cette fenêtre ; la miniature sera actualisée automatiquement.', captureHint: 'La modification de l’adresse du site déclenche une nouvelle capture.',
      invalidUrl: 'Saisissez une adresse de site valide, comme https://example.com.', invalidProtocol: 'Seules les adresses http:// et https:// sont prises en charge.', urlCredentials: 'L’adresse du site ne doit pas contenir de nom d’utilisateur ni de mot de passe.',
      swapped: 'Positions échangées. Position {position} sur {total}.', dragCancelled: 'Déplacement annulé.', settingsSaved: 'Paramètres enregistrés.', changesSaved: 'Modifications enregistrées.', siteAdded: 'Site ajouté. Une capture apparaîtra bientôt.', captureStarted: 'Nouvelle capture en cours.', imageSaved: 'Votre image a été enregistrée.', siteDeleted: 'Site supprimé.',
      imageType: 'Choisissez une image PNG, JPG, WebP ou GIF.', imageTooLarge: 'L’image ne doit pas dépasser 5 Mo.', imageReadFailed: 'Impossible de lire ce fichier. Sélectionnez à nouveau l’image.',
      storageUnavailable: 'Langue modifiée pour cette page. Votre navigateur n’a pas autorisé l’enregistrement de ce choix.',
      busy: 'Attendez la fin de l’action précédente.', conflict: 'Vos sites ont changé dans un autre onglet. La liste a été actualisée ; réessayez.', unexpectedResponse: 'Le serveur a renvoyé une réponse inattendue. Rechargez cette page.',
      formConflict: 'Vos sites ont changé dans un autre onglet. Vos modifications sont conservées ; les autres champs ont été actualisés. Vérifiez le formulaire et enregistrez à nouveau.',
      serverError: 'Erreur du serveur {status}. Réessayez.', sessionExpired: 'L’accès a expiré. Rechargez la page à l’aide de votre lien d’accès.', forbidden: 'Cette requête a été bloquée. Rechargez la page à l’aide de votre lien d’accès.',
      notFound: 'L’élément demandé est introuvable. Actualisez la page et réessayez.', invalidTitle: 'Saisissez un nom valide.', titleTooLong: 'Le nom ne doit pas dépasser 300 caractères.',
      imageRequired: 'Sélectionnez une image.', invalidImage: 'L’image est invalide ou ne correspond pas au type de fichier.', invalidImageSize: 'L’image est vide, endommagée ou dépasse 5 Mo.',
      invalidRequest: 'Impossible de traiter la requête. Rechargez cette page et réessayez.', bookmarkLimit: 'La limite de 500 sites a été atteinte.', invalidLinkTarget: 'Choisissez où ouvrir les liens.', invalidOrder: 'L’ordre des sites est invalide. Actualisez la page et réessayez.'
    },
    es: {
      appTitle: 'Speed Dial', home: 'Inicio de Speed Dial', showControls: 'Mostrar controles', hideControls: 'Ocultar controles',
      settings: 'Ajustes', export: 'Exportar', addSite: 'Añadir sitio', editSite: 'Editar sitio', save: 'Guardar', cancel: 'Cancelar', close: 'Cerrar',
      help: 'Arrastra una miniatura sobre otra para intercambiar sus posiciones. En pantallas táctiles, usa el asa. El lápiz permite editar un sitio.',
      savedSites: 'Sitios guardados', loading: 'Cargando tus sitios…', loadFailed: 'No se pudieron cargar tus sitios', connectionHint: 'Comprueba la conexión e inténtalo de nuevo.', retry: 'Reintentar',
      sitePages: 'Páginas de sitios', previous: 'Anterior', next: 'Siguiente', pageStatus: 'Página {page} de {total}', emptyTitle: 'Tus sitios aparecerán aquí',
      emptyDescription: 'Añade un enlace y aparecerá una captura automáticamente.', firstSite: 'Añadir tu primer sitio', connectionLost: 'Conexión perdida. Reconectando…',
      rows: 'Filas', columns: 'Columnas', capacity: 'Sitios por página: {count}', layoutHint: 'Elige entre 1 y 12 filas y columnas. Los sitios adicionales aparecen en la página siguiente. El número de columnas es fijo; en pantallas estrechas puedes desplazarte horizontalmente.',
      openLinksIn: 'Abrir enlaces en', sameWindow: 'La misma ventana (predeterminado)', newWindow: 'Una nueva ventana / pestaña', saveSettings: 'Guardar ajustes',
      language: 'Idioma', languageHint: 'Se guarda solo en este navegador. Las filas, columnas y los ajustes de enlaces se comparten entre todos los navegadores.',
      websiteAddress: 'Dirección del sitio', urlHint: 'Puedes escribir una dirección sin https://.', name: 'Nombre', optional: 'opcional', namePlaceholder: 'Por ejemplo, Correo',
      previewNote: 'Se añadirá una captura automáticamente.', previewNoteHint: 'Puedes actualizarla o subir tu propia imagen.', thumbnail: 'Miniatura', refreshScreenshot: 'Actualizar captura', uploadImage: 'Subir imagen',
      imageHint: 'PNG, JPG, WebP o GIF · hasta 5 MB', delete: 'Eliminar', deleteSite: 'Eliminar sitio', deleteTitle: '¿Eliminar sitio?', keepSite: 'Conservar sitio',
      deleteDescription: 'Se eliminará «{name}» de tus sitios. Puedes volver a añadirlo más adelante.', dismiss: 'Cerrar notificación', untitled: 'Sin título',
      openSame: '{name} — abrir en esta ventana', openNew: '{name} — abrir en una nueva ventana o pestaña', capturing: 'Capturando pantalla', screenshotUnavailable: 'Captura no disponible',
      screenshotFailed: 'No se pudo capturar esta página. Puede que requiera iniciar sesión o bloquee las capturas. Inténtalo de nuevo o sube tu propia imagen.',
      moveSite: 'Mover {name}. Usa las flechas para intercambiar posiciones; Inicio y Fin intercambian con el primer y último sitio.', editNamed: 'Editar {name}',
      invalidDimensions: 'Las filas y columnas deben ser números enteros entre 1 y 12.', deletedElsewhere: 'Este sitio se eliminó en otra pestaña.',
      capturePending: 'Captura en curso. Puedes cerrar esta ventana; la miniatura se actualizará automáticamente.', captureHint: 'Al cambiar la dirección del sitio se creará una nueva captura.',
      invalidUrl: 'Escribe una dirección válida, como https://example.com.', invalidProtocol: 'Solo se admiten direcciones http:// y https://.', urlCredentials: 'La dirección del sitio no debe contener un nombre de usuario ni una contraseña.',
      swapped: 'Posiciones intercambiadas. Posición {position} de {total}.', dragCancelled: 'Movimiento cancelado.', settingsSaved: 'Ajustes guardados.', changesSaved: 'Cambios guardados.', siteAdded: 'Sitio añadido. La captura aparecerá en breve.', captureStarted: 'Creando una nueva captura.', imageSaved: 'Tu imagen se ha guardado.', siteDeleted: 'Sitio eliminado.',
      imageType: 'Elige una imagen PNG, JPG, WebP o GIF.', imageTooLarge: 'La imagen no debe superar los 5 MB.', imageReadFailed: 'No se pudo leer el archivo. Selecciona la imagen de nuevo.',
      storageUnavailable: 'Se cambió el idioma de esta página. Tu navegador no permitió guardar la preferencia.',
      busy: 'Espera a que termine la acción anterior.', conflict: 'Tus sitios cambiaron en otra pestaña. La lista se ha actualizado; inténtalo de nuevo.', unexpectedResponse: 'El servidor devolvió una respuesta inesperada. Recarga esta página.',
      formConflict: 'Tus sitios cambiaron en otra pestaña. Se conservan tus cambios y se actualizaron los demás campos. Revisa el formulario y vuelve a guardar.',
      serverError: 'Error del servidor {status}. Inténtalo de nuevo.', sessionExpired: 'El acceso ha caducado. Recarga la página con tu enlace de acceso.', forbidden: 'Se bloqueó esta solicitud. Recarga la página con tu enlace de acceso.',
      notFound: 'No se encontró el elemento solicitado. Actualiza la página e inténtalo de nuevo.', invalidTitle: 'Escribe un nombre válido.', titleTooLong: 'El nombre no debe superar los 300 caracteres.',
      imageRequired: 'Selecciona una imagen.', invalidImage: 'La imagen no es válida o no coincide con su tipo de archivo.', invalidImageSize: 'La imagen está vacía, dañada o supera los 5 MB.',
      invalidRequest: 'No se pudo procesar la solicitud. Recarga esta página e inténtalo de nuevo.', bookmarkLimit: 'Se ha alcanzado el límite de 500 sitios.', invalidLinkTarget: 'Elige dónde abrir los enlaces.', invalidOrder: 'El orden de los sitios no es válido. Actualiza la página e inténtalo de nuevo.'
    }
  };
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const normalizeLocale = value => typeof value === 'string' && own(languages, value) ? value : 'en';
  function readLocale(storage) {
    try { return normalizeLocale(storage.getItem(storageKey)); } catch { return 'en'; }
  }
  function saveLocale(storage, value) {
    try { storage.setItem(storageKey, normalizeLocale(value)); return true; } catch { return false; }
  }
  function translate(locale, key, values = {}) {
    const catalog = catalogs[normalizeLocale(locale)];
    const template = own(catalog, key) ? catalog[key] : own(catalogs.en, key) ? catalogs.en[key] : String(key);
    // Interpolation returns plain text. Callers must use textContent/attributes,
    // never innerHTML; placeholder values are not recursively interpolated.
    return template.replace(/\{([A-Za-z][A-Za-z0-9]*)\}/g, (match, name) => own(values, name) ? String(values[name]) : match);
  }
  function formatNumber(locale, value) { return new Intl.NumberFormat(normalizeLocale(locale)).format(value); }
  function apply(root, locale) {
    const mappings = [['data-i18n', null], ['data-i18n-aria-label', 'aria-label'], ['data-i18n-title', 'title'], ['data-i18n-placeholder', 'placeholder']];
    for (const [dataAttribute, attribute] of mappings) {
      for (const node of root.querySelectorAll(`[${dataAttribute}]`)) {
        const value = translate(locale, node.getAttribute(dataAttribute));
        if (attribute) node.setAttribute(attribute, value); else node.textContent = value;
      }
    }
  }
  Object.values(catalogs).forEach(Object.freeze);
  globalThis.SpeedDialI18n = Object.freeze({ languages, catalogs: Object.freeze(catalogs), storageKey, normalizeLocale, readLocale, saveLocale, translate, formatNumber, apply });
})();
