# Sources, déploiement et vérification

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

[Accueil du wiki](Home.md)

Le dépôt public `speeddial` contient les deux éditions de l'application, les tests, des exemples génériques de déploiement et la documentation. Il commence avec un nouvel historique Git et des jeux de données synthétiques. Les archives d'exploitation privées conservent les données historiques et les dossiers de restauration, en utilisant une révision publique figée ou une image immuable sans dupliquer le code applicatif.

L'[application locale au navigateur](https://speeddial.alvit.here.now/) accueille chaque visiteur avec un tableau vide. Publier le code ne copie pas les liens ou captures personnels dans un autre navigateur. Les [scripts de sauvegarde](../docs/browser-backups.fr.md) accompagnent un transfert volontaire avec une copie de secours de la destination et une comparaison exacte du contenu après restauration.

## Processus de déploiement

![Validation des sources, répétition isolée de restauration, déploiement et acceptation sont des étapes séparées.](images/release-process.svg)

L'édition serveur prend toujours en charge Node.js, Docker et k3s. Figez la révision publique, construisez ou choisissez une image immuable vérifiée et appliquez la configuration privée hors du dépôt. Séparez identifiants et volume de données persistant de l'image applicative. Pour migrer une installation existante, suivez le [guide de bascule et de retour arrière](../deploy/README.md).

## Frontières du dépôt et des données

![Les sources publiques alimentent les déploiements privés ; les données personnelles du navigateur et dossiers de restauration serveur restent privés.](images/release-results.svg)

Les sources publiques ne contiennent aucun tableau personnel initial. Les sauvegardes locales restent dans `backups/`, ignoré par Git ; les ensembles de restauration serveur comprennent SQLite, les images référencées et les identifiants protégés séparément. Ces formats servent des éditions différentes et ne sont pas interchangeables.

## Vérification

Les contrôles locaux et CI valident les jeux synthétiques et les scénarios exécutés. Les deux éditions conservent cinq langues, des commandes repliées, les échanges par paires, les aperçus suivant le pointeur, les dimensions de grille et, par défaut, la navigation dans la même fenêtre.

Une répétition de migration serveur compare identifiants, ordre, titres, URL, paramètres, références d'images et intégrité SQLite. Les contrôles de rotation vérifient que les anciennes sessions échouent après redémarrage. L'acceptation réelle vérifie aussi le routage prévu, les identifiants, la disponibilité des images et la préservation des données dans l'environnement cible.

Un contrôle des sources réussi ne prouve ni déploiement ni restauration. Gardez privés les reçus réels de déploiement et inventaires personnels. Les diagrammes décrivent architecture et processus, sans garantir performances, disponibilité ou durée de récupération. Les sources publiques restent `UNLICENSED`.
