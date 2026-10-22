# Scripts de sauvegarde et restauration locales du navigateur

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

[Guide de migration](browser-migration.md) · [Tous les déploiements](../README.md#storage-and-deployment)

Ces scripts préservent le **tableau Speed Dial** : liens ordonnés, titres, totalité des octets des images, lignes, colonnes, préférence d'ouverture et langue. Ils ne sauvegardent ni historique, ni mots de passe, ni extensions, ni autres favoris du navigateur. Ils utilisent le format JSON portable `speedial-local-backup` de l'application, pas les bases internes de Chrome ou Firefox.

Ils agissent sur l'application locale au navigateur à [speeddial.alvit.here.now](https://speeddial.alvit.here.now/). Ils ne remplacent pas les [sauvegardes serveur](../wiki/Operations.md#backup-and-restore) des déploiements Node.js, Docker ou k3s. L'ancien export JSON du serveur n'est pas accepté comme sauvegarde complète du navigateur ; son transfert nécessite la [collecte et conversion des images](browser-migration.md).

Si le tableau reste à l'ancienne adresse `speedial.alvit.here.now`, exportez-le d'abord depuis cette adresse exacte ; les scripts ouvrent désormais `speeddial.alvit.here.now`. Utilisez `--no-open` avec l'ancien onglet déjà ouvert, ou archivez explicitement son export enregistré. Les anciens fichiers `speedial-local-backup` et noms téléchargés `speedial-backup-*.json` restent compatibles. Voir les [notes de changement d'adresse](local-speedial.md#corrected-address-and-existing-backups).

## Prérequis et navigateurs pris en charge

Exécutez Node.js 24+ depuis cette copie Git. Aucun paquet supplémentaire n'est nécessaire. Sous macOS, le lanceur reconnaît Chrome, Firefox, Safari, Edge, Brave, Arc, Opera, Vivaldi, Chromium, Orion, Zen, LibreWolf et Waterfox dans `/Applications`, `~/Applications` ou `/System/Applications`. Cela concerne le lancement, sans affirmer que chaque navigateur a été testé. Les tests automatisés utilisent Chromium, Firefox et WebKit.

```sh
npm run backup:browser -- --list-browsers
```

Pour un autre navigateur macOS, utilisez `--app /absolute/path/Browser.app`. Pour un navigateur déjà ouvert, celui intégré à Codex, Windows ou Linux, utilisez `--no-open` et ouvrez vous-même le site. Aucun port de débogage, extension, autorisation Accessibilité ou accès direct aux fichiers du profil n'est nécessaire.

```sh
npm run backup:browser -- --no-open
npm run restore:browser -- backups/YOUR-BACKUP.json --no-open
npm run restore:browser -- backups/YOUR-BACKUP.json --app "/Applications/Brave Browser.app"
```

L'URL de lancement est fixée à l'adresse principale. Un tableau situé sur une autre origine doit être exporté depuis cette origine exacte ; utilisez-y `--no-open` et vérifiez vous-même l'adresse de destination. Le stockage du navigateur ne suit ni redirection ni changement de nom d'hôte.

**Ces scripts sont interactifs.** Ils ouvrent l'application et gèrent les fichiers locaux, mais vous déclenchez l'export, choisissez le fichier à importer et confirmez le remplacement. Une application peut avoir plusieurs profils : choisissez le bon et utilisez [speeddial.alvit.here.now](https://speeddial.alvit.here.now/). Un nouveau profil vide est normal. Le script ne peut pas certifier quel profil a produit un téléchargement.

## Sauvegarder Chrome

```sh
npm run backup:browser -- --browser chrome
```

1. Choisissez votre profil Chrome existant, dépliez la flèche en haut à droite et cliquez sur **Export backup**.
2. Enregistrez avec le nom proposé `speedial-backup-YYYY-MM-DD.json` dans `~/Downloads`. Les suffixes de collision comme ` (1)` sont acceptés.
3. Le script attend un nouvel export complet, le valide, le copie dans `backups/`, relit la copie et affiche son chemin, les nombres d'éléments et SHA-256. Il ne reprend jamais un ancien export. Plusieurs exports simultanés provoquent une erreur plutôt qu'un choix au hasard.

Utilisez `--downloads /absolute/local/folder` si le navigateur télécharge ailleurs ; sélectionnez le même dossier dans le navigateur. Choisissez des dossiers locaux hors synchronisation cloud. L'attente par défaut est de dix minutes ; `--timeout 1200` la porte à vingt. La boîte **Save As** du navigateur peut nécessiter une confirmation avant que le fichier existe. Pour un export renommé ou déjà téléchargé :

```sh
npm run backup:browser -- --file /absolute/local/export.json
```

Le mode fichier explicite archive ce fichier ; il **ne** récupère **pas** les données actuelles du navigateur et ne prouve pas leur fraîcheur. Les téléchargements originaux sont conservés. Les exports recueillis par la surveillance sont limités au mode `0600` sous POSIX ; les fichiers d'entrée explicites restent inchangés.

## Restaurer dans un autre navigateur

Remplacez `YOUR-BACKUP.json` par le nom de sauvegarde affiché :

```sh
npm run restore:browser -- backups/YOUR-BACKUP.json --browser firefox
npm run restore:browser -- backups/YOUR-BACKUP.json --browser chrome
npm run restore:browser -- backups/YOUR-BACKUP.json --browser safari
```

La restauration nécessite un terminal interactif et accompagne un navigateur/profil à la fois :

1. Elle valide et conserve une copie séparée `restore-source`. Dans le profil cible, exportez le tableau actuel, même vide. Le script l'enregistre comme `before-restore` pour qu'il reste récupérable.
2. Confirmez dans le terminal que l'export provient du bon profil cible en tapant `RESTORE`.
3. Dans le même navigateur, cliquez sur **Import backup**, choisissez le fichier `restore-source` indiqué, examinez le résumé puis cliquez sur **Replace this board**. Sous macOS, pressez **⌘⇧G** dans le sélecteur de fichier et collez le chemin absolu.
4. Rechargez Speed Dial, vérifiez l'affichage des images, puis exportez à nouveau. Le script archive cet export `after-restore` et compare liens ordonnés, titres, octets des images, grille, préférence d'ouverture et langue à la source. Les identifiants internes régénérés et horodatages sont ignorés. Les anciennes sauvegardes sans langue laissent la langue cible inchangée.

Le succès n'est annoncé qu'après concordance du contenu. Une différence ou un délai dépassé **n'est pas** une restauration vérifiée. Toutes les copies sont conservées ; il n'y a pas de retour arrière automatique. Pour revenir en arrière, répétez la commande avec le fichier `before-restore` conservé. Des exports identiques prouvent l'égalité du contenu ; il reste nécessaire de vérifier profil, origine et images visibles.

Pour revenir ensuite à Chrome, utilisez la même commande avec `--browser chrome` et le JSON enregistré souhaité. Le format ne dépend pas du navigateur source. Chaque restauration remplace un tableau cible, sans fusionner les liens ; gardez la copie automatique du tableau cible si les deux versions peuvent servir.

N'exportez pas depuis un autre onglet ou profil pendant l'attente d'une commande. Exécutez des commandes séparées pour les différents navigateurs. C'est un transfert ponctuel ; les modifications ultérieures ne sont pas synchronisées.

## Stockage exclusivement local et validation

Toutes les sorties des scripts vont dans le dossier fixe `backups/` de cette copie Git. La commande vérifie qu'il est ignoré par Git et ne contient aucun fichier suivi. Un dossier de sortie symboliquement lié est refusé. Chaque sauvegarde reçoit un nom unique, est enregistrée sans écraser d'autre fichier, relue et accompagnée d'un `.receipt.json` contenant quantités et empreintes, sans titres ni URL. Une entrée invalide ne crée pas de sauvegarde. La CLI réutilise la validation du schéma, du base64 et des en-têtes d'images matricielles de l'application ; l'application cible décode également les images avant l'import atomique.

Restaurez avec le fichier `.json` du tableau, pas avec son compagnon `.receipt.json`. Le reçu contient des métadonnées de vérification et ne peut pas restaurer un tableau. Les scripts ne suppriment automatiquement ni anciennes sauvegardes ni téléchargements originaux ; conservez les copies utiles et gérez leur stockage localement.

Sous macOS/Linux, le dossier a le mode `0700` et les fichiers `0600`. Sous Windows, limitez l'accès avec les ACL du système de fichiers pour le compte ; les modes POSIX ne garantissent pas les ACL. Les sauvegardes JSON sont en clair. Les scripts ne contiennent aucun code d'envoi ou de synchronisation. Le dossier est exclu de Git, du contexte de construction Docker et de la liste autorisée du frontend public. `.gitignore` n'empêche pas l'ajout forcé dans Git, le partage manuel, les sauvegardes du système ou un client de synchronisation configuré séparément. Pour un stockage exclusivement local, placez la copie Git et le dossier de téléchargements hors des dossiers synchronisés.

Aucune donnée de tableau n'est incorporée aux scripts, tests, documents ou au site public. Voir les [limites du stockage du navigateur](local-speedial.md#what-is-private-and-what-is-not) et l'[acceptation de migration](browser-migration.md).
