# Alvit Speed Dial

[English](README.md) · [Русский](README.ru.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Español](README.es.md)

Les deux versions restent disponibles : **Speedial** conserve un tableau personnel dans chaque navigateur ; **Speed Dial auto-hébergé** conserve un tableau partagé sur le serveur avec captures automatiques. Le stockage et la restauration diffèrent entre ces versions.

[Ouvrir l’application](https://speedial.alvit.here.now/) · [Sauvegardes du navigateur](docs/browser-backups.md) · [Node.js](README.md#local-development) · [Docker](README.md#docker) · [k3s / Kubernetes](README.md#k3s--kubernetes) · [Runners CI](docs/CI.md) · [Profil de l’organisation](docs/organization-profile.md)

## Version publique locale au navigateur : Speedial

[Ouvrir Speedial](https://speedial.alvit.here.now/) — l’application publique dont les données restent dans le navigateur. Utilisez cette adresse principale pour votre tableau et ajoutez-la à vos favoris. [Guide de stockage, confidentialité et transfert](docs/local-speedial.md).

Chaque visiteur commence avec un tableau vide. Liens, réglages et données des images restent dans ce profil de navigateur. La même adresse ou un identifiant local copié ne les affiche pas sur un autre ordinateur. Il n’y a ni API de tableau partagé, ni synchronisation cloud, ni captures automatiques de sites. Les cinq langues et les commandes des vignettes sont conservées.

**Exporter la sauvegarde** et **Importer une sauvegarde** permettent de transférer volontairement tout le tableau, images et langue comprises. Après aperçu et confirmation, l’import remplace le tableau de destination. Les domaines, navigateurs et profils distincts ont des stockages séparés, même avec un code identique. Gardez privée la sauvegarde JSON non chiffrée ; le nettoyage du navigateur peut effacer le tableau local.

Compilation : `npm run build:local` ; vérification : `npm run test:local`. Publier uniquement les fichiers autorisés de `dist/local`. La version serveur décrite ci-dessous reste distincte.

### Sauvegarde locale et transfert entre navigateurs

Avec Node.js 24+, depuis ce dépôt :

```sh
npm run backup:browser -- --browser chrome
npm run restore:browser -- backups/YOUR-BACKUP.json --browser firefox
```

Remplacez `YOUR-BACKUP.json` par le nom de votre sauvegarde. Les scripts interactifs guident l’export et l’import du tableau complet, images et réglages compris. Les copies restent dans le dossier `backups/`, exclu de Git. Le tableau de destination est sauvegardé avant son remplacement ; un nouvel export est ensuite comparé à la source. Sous macOS, Chrome, Firefox et d’autres navigateurs installés peuvent être ouverts. Utilisez `--no-open` pour un navigateur déjà ouvert ou sous Windows/Linux. Les scripts ne lisent pas les bases internes des profils et ne synchronisent pas les navigateurs. [Procédure complète en anglais](docs/browser-backups.md).

## Version auto-hébergée

Un tableau de favoris partagé et auto-hébergé, avec des vignettes compactes, la modification directe, l'échange de deux positions et des réglages persistants. L'interface existe en anglais, russe, allemand, français et espagnol.

Le serveur lit ses identifiants dans des fichiers externes et conserve les données hors de l’image. Le dépôt public `speeddial` contient le code et des exemples génériques de déploiement. `speeddial-private` conserve l’historique privé et les éléments de restauration, en utilisant une révision figée du code public sans le dupliquer.

![Architecture avec secrets externes, données persistantes et captures réseau limitées.](wiki/images/architecture.svg)

## Fonctionnalités

L'en-tête est replié au départ ; la flèche à droite montre réglages, export et ajout de sites. Les vignettes n'ont pas de légende permanente. Pendant le déplacement, l'aperçu suit le pointeur et seules les deux positions concernées s'échangent. Commandes tactiles et clavier disponibles.

La grille accepte 1–12 lignes et colonnes, avec 4 × 5 par défaut. Les autres favoris restent sur les pages suivantes. Les liens s'ouvrent dans la même fenêtre par défaut. La langue est propre au navigateur ; grille et comportement des liens sont partagés.

Une nouvelle URL déclenche une capture automatique. Les images PNG, JPEG, WebP et GIF jusqu'à 5 Mio sont acceptées. Le navigateur serveur n'a pas vos cookies de connexion. Une nouvelle base démarre vide par défaut.

## Accès et développement

Il faut Node.js 24+, Chromium installé et deux fichiers externes obligatoires :

- `ACCESS_TOKEN_FILE` : jeton aléatoire compatible avec une URL, d'au moins 32 caractères après retrait des espaces extérieurs.
- `SESSION_KEY_FILE` : clé de signature d'au moins 32 octets bruts.

L'adresse prend la forme `https://bookmarks.example.test/?access=<token>`. Ce n'est qu'un exemple. Le jeton est requis à chaque navigation ; le cookie de session permet consultation et modification. Il n'y a pas de mot de passe d'édition distinct. Changer jeton, clé ou `AUTH_EPOCH` invalide les anciennes sessions après redémarrage.

Ne placez pas secrets, liens complets, bases ou images privées dans Git ou dans l'image du conteneur. Consultez la [préparation locale en anglais](README.md#local-development).

```sh
npm ci
npm run check
CHROMIUM_PATH=/path/to/chromium npm run test:browser
```

`DATA_DIR` contient SQLite, `images/` et les `legacy-images/` migrées. `INITIAL_STATE_FILE`, facultatif, initialise uniquement une nouvelle base depuis un fichier externe. Une base existante n'est pas réinitialisée.

## Exploitation et publication

[Wiki](wiki/Home.md), [API](wiki/API.md), [configuration](wiki/Configuration.md), [bascule et retour arrière préparés](deploy/README.md), [sécurité](SECURITY.md), [statut](wiki/Process-and-Results.md). La documentation technique détaillée est en anglais.

L’**export JSON du serveur** ne contient pas les fichiers images : ce n’est pas une sauvegarde complète. La restauration exige des données cohérentes et les secrets externes, protégés hors du nœud. La sauvegarde du navigateur utilise un autre format et contient les images. Une bascule en production demande une autorisation distincte.

L’exécution avec [Docker](README.md#docker) et [k3s / Kubernetes](README.md#k3s--kubernetes) est conservée. L’exemple Docker garde les données et secrets hors de l’image ; k3s demande un overlay adapté à l’image, au stockage et au routage. Publier la version locale ne modifie pas le déploiement du serveur. Un [guide avec exemple de README pour le profil de l’organisation](docs/organization-profile.md) est également disponible.

Ce dépôt public commence avec un nouvel historique de code et des exemples synthétiques. L’ancien historique privé reste dans `speeddial-private`. Sauvegardes, identifiants et données personnelles restent hors de Git. Le code est consultable publiquement mais reste `UNLICENSED` ; aucune licence open source de redistribution n’est accordée.
