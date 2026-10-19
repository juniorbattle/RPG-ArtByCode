# Journal de bord — archive : passes H1, M7, H2, H3 et H4 (2026-10-18 → 2026-10-19)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-10-19 (Passe B1) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe H1 — Héros premium : casting 1 (trois planches de personnages), design du protagoniste choisi, prompt v2 (2026-10-18)

### Reçu
- L'opérateur a collé trois planches de personnages (WebP 1447 × 1087, avec perte ; le même profil ICC générique que les planches archivées,
  qui sont des copies ré-encodées) avec une note collée par lui : ce sont des références de casting, « et non des spritesheets de production directement
  exploitables » ; le protagoniste issu du « 01. Young Adventurer » se développe « dans une planche individuelle détaillée » ; « Les
  personnages représentés ne deviennent pas automatiquement canoniques » ; « La priorité reste le protagoniste H0 ».
- Elles ne viennent pas du prompt du brief (§ 5, v1 : un seul personnage, cinq vues, fond gris) : plusieurs personnages, fond bleu nuit,
  textes. Outil, date et prompt non déclarés.

### Mesures du protagoniste — [OK] proportions ; [?] grille
- Réglette sur la vue de face (± 0,015), tête cheveux compris jusqu'au menton sur la hauteur : planche 1 ≈ 0,31, planche 2 ≈ 0,32,
  planche 3 ≈ 0,35 ; même lecture sur la planche source de la distribution : docker ≈ 0,31, voyageur ≈ 0,34. Les trois sont dans la famille
  de la distribution. Hauteurs ≈ 146-148 / 145 / 136-141 px, contre 153-174 px pour les vues des PNJ sur leurs planches (le pas de
  reconstruction se règle par personnage, 1,775 à 2,0).
- Grille de pixels : un spectre des gradients ne trouve pas de pas net, mais il n'en trouve pas non plus sur la planche 01-16 (pas connu :
  1,775) : méthode non concluante, abandonnée ; le pas se fixera sur la planche individuelle.
- Défauts de cohérence relevés : planches 1 et 2, pantalon foncé au repos et clair en course, aucun vrai profil au repos (deux 3/4 face,
  deux 3/4 dos) ; planche 3, jambes confuses aux images 3-4 de la course, cape de « 01b » rouge puis grise dans sa 4e vue ; partout, fond
  bleu nuit proche de la cape indigo.
- Planches de revue (non versionnées) : `art-lab/characters/scratch/hero-premium/casting-1/board-1-designs.png`, `board-2-course.png`,
  `board-3-proportions.png`.

### Décisions de l'opérateur (2026-10-18), mot pour mot
- Design du protagoniste : « Planche 1 (Recommandé) » (fidèle au 01 d'origine, expression calme).
- Pantalon : « Foncé (Recommandé) », dans toutes les vues, course comprise.
- Archivage des trois planches : « Oui, à l'octet (Recommandé) ».

### Fait — [OK]
- Archivage à l'octet dans `art-lab/characters/reference/sources/` : `tournament-roster-casting-2026-10-18-a.webp` (planche 1),
  `tournament-roster-casting-2026-10-18-b.webp` (planche 2), `main-characters-casting-2026-10-18.webp` (planche 3), chacune avec sa fiche
  `.source.json` : classement « casting, non canonique », mesures, décision, provenance **non déclarée**, droits non vérifiés.
- Brief `briefs/hero-proposal.md` : décision 3 (casting 1), figure et proportions d'après la planche 1, § 5 remplacé par le **prompt v2**
  (le v1 n'a pas servi ; il reste dans l'historique git), § 9 « Casting 1 » (mesures, défauts, statut du reste des planches).
- Prompt v2 : images jointes = les 6 vues de repos et les 5 images de course de la planche 1 (×2, sans texte, refaites depuis la planche
  archivée) ; le docker n'est plus joint ; demande un vrai profil au repos, le pantalon foncé partout, le motif de cape cohérent, des pixels
  nets d'une seule taille, un fond gris neutre ; profils tournés vers la droite comme la course jointe.

### Restes [?]
- La planche individuelle (PNG d'origine, outil, date, prompt) : l'opérateur la génère avec le v2. Ensuite, § 6 du brief.
- Le reste des trois planches (tenues alternatives, combattants, personnages narratifs, PNJ importants) : propositions, aucune production
  avant validation de leur design.

### Preuves
- `art:validate` : 14 manifestes, 7 sources archivées dont les 3 nouvelles, 0 erreur. Contrôle négatif : un octet ajouté à une archive
  donne 2 erreurs (taille, SHA-256) ; archive restaurée, SHA-256 de nouveau celui du fichier collé.
- SHA-256 des trois archives = ceux des trois fichiers collés dans la séance (`f44f86af…`, `fcb38cda…`, `2a7962f8…`).
- `typecheck`, `npm test` (37 / 37), `build` : OK. Aucun code ni asset du jeu changé.

### Pensée
- Une planche de casting se mesure contre les planches sources de la distribution avec la même lecture (réglette sur la source, pas sur un
  export) : 0,33 mesuré sur l'export du docker et 0,31 sur sa source décrivent la même tête.
- Une méthode de mesure se teste d'abord sur un cas connu : le spectre des gradients, muet sur la planche 01-16 dont le pas est connu,
  n'était pas une preuve d'absence de grille sur les nouvelles planches.

## Passe M7 — Journal : archivage des passes M5 à S1b (2026-10-18)

### Pourquoi
- Règle d'`AGENTS.md` : au-delà d'environ 60 Ko de passes dans `JOURNAL.md`, les passes closes les plus anciennes partent d'un bloc dans
  `journal/` (seuil signalé par la séance des retouches après la Passe V3). Après la Passe H1 : 64 127 octets de passes (M5 7 366, S1 10 922,
  S2 7 224, S1b 3 967, H0 3 260, M6 2 021, V0 2 745, V1 7 285, V2 3 458, V3 11 032, H1 4 847).
- Réponse de l'opérateur, mot pour mot (le mode automatique de l'outil avait d'abord refusé la fusion de `hero-casting`) : « Je t'autorise à
  fusionner hero-casting dans main en avance rapide, à pousser main et à supprimer la branche, puis à faire l'archivage M7 du journal. »
- Branche `journal-archive-m5-s1b` ouverte depuis `main` (`a5e06a5`).

### Fait — [OK]
- M5, S1, S2 et S1b (closes : décisions de l'opérateur consignées, branches fusionnées) déplacées d'un bloc, dans leur ordre, à l'octet, dans
  `journal/06-passes-M5-S1b.md` (en-tête de quelques lignes, une ligne `---`, puis les 29 479 octets inchangés, SHA-256
  `238e3288750e1829…`) ; ligne ajoutée à l'index ; phrase d'en-tête : « Les passes 0 à S1b… (Passes M3, M6 et M7) ». `JOURNAL.md` :
  100 416 → 71 034 octets avant cette entrée ; 34 648 octets de passes gardées (H0 à H1). H0 reste près de H1 : le héros est en cours.
- Preuve (script hors dépôt, contre `git show a5e06a5:JOURNAL.md` ramené en CRLF ; cette entrée laissée hors de la comparaison) : **8 / 8** —
  corps de l'archive = octets retirés (SHA-256 et longueur) ; les 4 sections retrouvées chacune une seule fois, dans la nouvelle archive
  seulement ; passes gardées H0 à H1 inchangées ; `JOURNAL.md` = l'original moins le bloc, à la phrase d'en-tête et à la ligne d'index près ;
  archives 01 à 05 inchangées ; CRLF seuls dans les deux fichiers. Contrôle négatif : un mot changé (`maskSafeBlending` →
  `maskSafeBlendinG`) dans une copie de l'archive → 6 / 8 (SHA-256 et section).

### Pensée
- Une coupe d'archive suit les séances (nettoyage et points 1-2 des priorités ensemble) et laisse près de la passe en cours celle qu'elle
  prolonge.

## Passe H2 — Héros premium : PNG d'origine des trois planches du casting archivés (C2PA lu) ; l'opérateur attend la planche v2 (2026-10-18)

### Demande (2026-10-18)
- Transmise par la séance parente : l'opérateur a déposé trois PNG dans `art-lab/characters/scratch/hero-premium/incoming/` (non versionné)
  et demande de commencer le héros premium. Consigne : apparier chaque PNG à sa copie WebP archivée, l'archiver à l'octet avec sa fiche (C2PA
  lu, signature non vérifiée, droits non vérifiés exhaustivement), garder les WebP, puis une seule question : construire depuis la planche 1
  ou attendre la planche individuelle du prompt v2.
- Branche `hero-x2-v1` ouverte depuis `main` (`d94adef`) après `git fetch --prune` (aucune autre branche).

### Appariement — [OK] mesuré ; [KO] l'ordre des noms
- PNG 1447 × 1087, RGB 8 bits, morceaux IHDR / caBX / IDAT / IEND, contre les trois WebP archivés décodés par Chrome (canvas sRGB) ; écart moyen
  absolu (/ 255) sur tous les pixels :

| PNG déposé | planche 1 (a) | planche 2 (b) | planche 3 | Apparié à |
|---|---|---|---|---|
| « Cité du Tournoi — Roster en pixel art-3.png » | **2,97** | 29,33 | 46,05 | planche 1 |
| « Cité du Tournoi _ Roster Pixel Art-1.png » | 29,43 | **2,93** | 44,33 | planche 2 |
| « Planche de sprites pixel art du tournoi-2.png » | 46,26 | 44,57 | **2,45** | planche 3 |

- Témoins : un PNG contre lui-même 0 ; décalé de 16 px contre lui-même 30,7 à 35,4. Mise en page vérifiée à l'œil (grille réduite, PNG
  au-dessus, WebP en dessous). Plus grand écart d'un canal contre sa copie : 82 à 97 (pertes WebP sur les bords).
- **[KO] supposition** : la séance parente tenait « …Roster Pixel Art-1.png » pour la planche 1 ; c'est la planche 2. Le numéro des fichiers
  téléchargés ne suit pas l'ordre des copies collées.

### C2PA — [OK] lu, liaison dure recalculée ; [?] signature non vérifiée
- Lecteur en lecture seule hors dépôt (morceaux PNG, boîtes JUMBF, CBOR, Node crypto), essayé d'abord sur `npc2-merchant-source-2026-10-16.png` :
  il retrouve les valeurs consignées en Passe 4A-quindecies (actions, générateur, hachage `3befd929…`).
- Les trois : un manifeste, claim v2, générateur « OpenAI Media Service API » (c2pa-rs 0.79.2, spec 2.2.0), `dc:title` image.png ;
  `c2pa.created` par ChatGPT (gpt-image), `trainedAlgorithmicMedia`, puis `c2pa.converted` et `c2pa.watermarked.unbound` ; heures (19/10, UTC) :
  planche 2 01:04:34, planche 3 01:05:34, planche 1 01:06:44.
- `c2pa.hash.data` (SHA-256 du fichier sans le morceau caBX) recalculé : identique au manifeste pour les trois (`b72b90dd…` planche 1,
  `994b0744…` planche 2, `67ea9639…` planche 3). Une liaison intacte, pas une signature validée.
- Signatures COSE_Sign1 : planches 1 et 3 ES256, chaîne « OpenAI Media Service » ← « Trufo C2PA Claim Signing CA (2025) » ; planche 2 PS256
  (RSA), chaîne « OpenAI Media Service » ← « SSL.com C2PA ICA R1 2025 ». Noms lus, non validés ; `c2patool` non installé (installation
  sur autorisation seulement).
- [?] Les heures `c2pa.created` précèdent de 1 à 3 min celles des fichiers déposés (01:07:56-01:08:27 UTC) et l'écriture des copies WebP
  (01:09:25 UTC) : heure de génération ou heure de production du fichier téléchargé, on ne sait pas ; consigné tel quel.

### Archivage — [OK]
- `reference/sources/tournament-roster-casting-2026-10-18-a-original.png` (planche 1, `9f54beed…`), `…-b-original.png` (planche 2,
  `6afb84bd…`), `main-characters-casting-2026-10-18-original.png` (planche 3, `1c68adcd…`) : copiés, `cmp` contre le fichier déposé. Suffixe
  `-original` : `art:validate` associe un fichier à la fiche de même nom sans extension ; un `X.png` et un `X.webp` partageraient la fiche.
- Fiche de chacun : format, nom du fichier déposé, `sessionCopy` (copie WebP, sa fiche, son empreinte, l'écart et ses témoins : cohérent avec
  un transcodage avec perte de ce PNG, sans preuve qu'elle en vienne), classement et décision repris de la copie, `generation` (rien de
  déclaré en mots par l'opérateur ; valeurs C2PA ; note sur les heures), `c2paVerification` (« SIGNATURE AND CERTIFICATE CHAIN NOT
  VERIFIED », liaison dure, signataires lus, lecteur), droits non vérifiés exhaustivement.
- Fiches des WebP : un champ `originalFound` ajouté (lien vers l'original et sa fiche) ; leurs autres champs et leurs octets inchangés.
- Pièces jointes du prompt v2 refaites dans le PNG d'origine (mêmes recadrages, ×2 au plus proche voisin) :
  `scratch/hero-premium/attachments/casting1-p1-original-protagonist-views-x2.png` (`ea95a9c6…`) et `casting1-p1-original-run-x2.png`
  (`feca9afe…`), non versionnées, inscrites dans le champ `derived` de la fiche de l'original a ; brief § 5 mis à jour. Les anciennes (tirées de
  la copie WebP) restent.

### Décision de l'opérateur (2026-10-18) — [OK]
- Montrés : l'appariement, le C2PA, le protagoniste de la planche 1 tiré de l'original (repos et course, ×3 ; défauts de H1 inchangés : pas
  de vrai profil au repos, pantalon clair en course, fond bleu nuit). Question : « Pour le héros premium : je le construis maintenant à partir
  de la planche 1 (PNG d'origine), ou on attend la planche individuelle générée avec le prompt v2 du brief ? » ; réponse, mot pour mot :
  « Attendre la planche v2 (Recommandé) ».
- Inscrit au brief (§ 1.4, § 9 « Originaux », statut). Rien n'est construit : ni script de rig, ni manifeste.

### Preuves
- `art:validate` : 14 manifestes, 10 sources archivées, 0 erreur. Contrôle négatif : un octet ajouté à `…-b-original.png` → 2 erreurs
  (taille, SHA-256) ; fichier recopié, `cmp` et SHA-256 de nouveau ceux du fichier déposé, 0 erreur.
- `typecheck`, `npm test` (37 / 37), `build` : OK. Aucun code ni asset du jeu changé.

### Restes [?]
- La planche individuelle (prompt v2, pièces jointes refaites dans l'original) : l'opérateur la génère et la livre en PNG téléchargé ; puis
  § 6 du brief sur une nouvelle branche.
- Signatures C2PA des trois PNG (et de celui de la marchande) non validées : il faudrait `c2patool` (installation à l'opérateur).
- Prompt et compte des planches du casting : non déclarés.

### Pensée
- Un numéro dans le nom d'un fichier téléchargé ne dit pas quelle planche c'est : l'appariement se mesure (écart de pixels contre des
  témoins), il ne se lit pas dans les noms.
- Un lecteur de métadonnées écrit pour l'occasion se valide d'abord sur un fichier dont les valeurs sont déjà consignées.

## Passe H3 — Héros premium : planche v2 archivée, héros construit au stade lab puis écarté par l'opérateur ; prompt v3 (2026-10-18/19)

### Reçu
- Opérateur, mot pour mot : « je viens de deposer le png v2 V2-Planche de sprites pixel art d’un aventurier bleu et or.png dans incoming ».
  PNG 1672 × 941 RGB, manifeste C2PA (ChatGPT / gpt-image, `trainedAlgorithmicMedia`, `c2pa.created` 2026-10-19T03:21:05Z) ; liaison dure
  recalculée identique ; signature non vérifiée. La copie collée dans la séance (WebP) : écart 2,18 / 255 contre ce PNG, 27,57 pour le témoin
  décalé de 16 px.
- Branche `hero-x2-v1` ouverte depuis `main` (`d2b5fd6`) après `git fetch --prune` (aucune autre branche).
- Archivée à l'octet : `reference/sources/hero-turnaround-v2-2026-10-18.png` (`d69f626b…`) et sa fiche (`v2Checks` : pantalon foncé et fond
  gris corrigés ; un presque-profil au repos ; pas de grille de pixels ; six vues de repos et cinq images de course au lieu des cinq vues).

### Mesures de la source — [OK] ; [KO] les images de course
- Fond gris uni (bord 116,8 / 117,7 / 117,1) ; figures de repos 457-462 px, de course 362-366 px. Pas de grille régulière : la variance par
  cellule ne creuse qu'aux pas entiers (artefact de la recherche par dixièmes de pas ; disparu avec un pas de 0,02). Pas 5,3 : 85-87 rangées
  (la distribution : 83-89).
- **[KO]** images de course : même tête (25 rangées sur 69 contre 26 sur 86) mais buste deux fois plus court (menton-ceinture ≈ 11 rangées
  contre 24) ; les images 1, 2, 4 et 5 montrent presque la même pose de vol, la 3 un contact : des poses clés, pas un cycle. Pas utilisées
  comme images.

### Construction (`rigs/hero-x2-v1.rig.mjs`, lab, non approuvé)
- Outils partagés inchangés (`build-character`, `rig-engine`, `reconstruct-grid` sont figés par empreinte dans les dix paquets approuvés,
  que `verify-provenance` contrôle) : toute la recette est dans le rig.
- Vues : face (1re), dos (6e), presque-profil (4e, retourné) ; `--holes` retire le gris du fond enfermé entre les tiges de bottes du profil
  et quelques texels de halo au bord des capes ; `--no-shadow` ; `--closing-from=48`. Une palette de 64 couleurs.
- Repos : respiration de la distribution. Course de 6 images : contact, poussée, vol, ×2 ; pied d'appui à plat, 9 texels par image entre
  contact et poussée ; aucun texel sur la rangée 90 en vol. `walkSlide` 9 texels : horloge × 1,56 en B / D, × 1,52 en C, plafonnée à × 1,6
  en A (glissement 9 %) ; avec Maj (4,25 m/s), 38 à 46 % (à décider). Face / dos : le corps rebondit, la cape ondule, chaque jambe se lève
  sous le corps, les deux en vol. Face de 84 rangées : 1,777 m à l'échelle 0,9 (`HEIGHT.player` 1,78).
- **[KO]** la jambe découpée dans la vue (cuisse et botte), tournée en trois segments (RotSprite) : la texture chargée de la botte se
  fragmente ; la jambe lointaine à −0,1 OKLab d'un pantalon déjà sombre fait une tache presque noire. **[OK]** jambes peintes dans les
  teintes de la vue (cuisse : pantalon ; tige : botte, revers clair), le pied de la vue déplacé d'un bloc (méthode des PNJ).
- **[KO]** le balancement du bras par cisaillement d'une boîte détache un morceau de gant : de profil, manche, gantelet, sacoche et ceinture
  font une seule masse brune ; aucune pièce de bras séparable.

### Runtime — [OK] DEV ; [?] texture cuite
- `ActorSystem.update` : l'horloge d'animation d'un joueur cuit suit ses pas (`walkClock`, touche de course comprise) ; le joueur généré
  garde × 1 / × 1,7. `tests/stride.test.mjs` +1 ; contrôle négatif : l'ancienne ligne remise → 1 échec.
- Aperçu `?cast=candidate` par une entrée candidate de `BakedCast` (`replaces: ['player']`) : le héros sur le joueur, 1,777 m. Entrée
  retirée après la revue de l'opérateur ; elle revient avec la v3.
- Glissement en mouvement (variante hors dépôt de `tools/foot-slip.mjs` : le joueur tenu sur une touche, harnais à graine, médiane) :
  A +0,09 (le plafond × 1,6), B −0,02, C −0,05, D −0,02 ; témoin connu mauvais, Maj en B : −1,09.
- **[?]** texture cuite : 322 + 30 images = 2 112 rangées, plus que les 2 048 garanties par WebGL2. L'aperçu passe sur ce GPU (sa
  `MAX_TEXTURE_SIZE` est plus grande) ; à élargir (adressage par case entière) avant toute production du héros.

### Revue de l'opérateur (2026-10-18/19), mot pour mot
- « Il s'affiche mais enorment de probleme deja il semble avoir des proportions differents aux autres pnjjs sprite travaille et surtout les
  animations de marche deplacement non c'est mauvais, bras qui ne bouge pas, les jambes qui ne soont pas alignes et donne l'impression qui
  marche de maniere decale » ; puis, capture à l'appui : « on voit le ddefaut clairement sur ce runntime capture du protagnoist enrain de
  marcher avec les jambes cuisses trop haute et les bras immobiles ».
- Mesuré à sa suite (même lecture sur la distribution) : tête du sommet au menton 0,28 de la hauteur contre 0,31-0,32 (docker, voyageur,
  coursier) et ≈ 0,35 (marchande) ; visage ≈ 13 texels de large contre 22-25 ; buste long, jambes courtes.
- Cuisses trop hautes **[OK] corrigé dans le rig** : le bassin descendait de 3 rangées et les genoux montaient jusqu'à 8 → jambes 11,5 +
  11,5, bassin abaissé d'au plus 1 rangée, genoux levés d'au plus 6, jambes recentrées sous le buste ; foulée inchangée (9).
- Question : « Pour corriger les proportions et faire bouger les bras, quelle voie veux-tu ? » ; réponse, mot pour mot : « Planche v3
  (Recommandé) ».

### Fait ensuite
- Brief : décision 5 (citations), prompt v3 (§ 5 : le design de la v2, les proportions de la distribution, un vrai profil au bras détaché du
  buste, un cycle de course de 6 images à la même échelle, bras qui balancent), § 10 (la v2). Pièces jointes, non versionnées, refaites depuis
  les fichiers archivés : `v3-image1-v2-idle-front-back-profile.png`, `v3-image2-v2-run-poses.png`, `v3-image3-cast-proportions-x6.png`
  (docker et coursier ; le voyageur, garçon aux cheveux en épis et au foulard bleu, écarté : même archétype que le héros).
- `hero-x2-v1` passé « experimental » (manifeste, paquet de provenance, fiche de la source) ; revue `reviews/hero-x2-v1/` (capture en B,
  alignement avec la distribution, jambes avant / après, toutes les images).
- Pas de critique à l'aveugle : la revue de l'opérateur a renvoyé le travail à la source avant.

### Preuves
- `build-character --check` : reconstruit à l'identique ; `verify-provenance` : intact ; `art:validate` : 15 manifestes, 11 sources
  archivées, 0 erreur ; `typecheck`, `npm test` (38 / 38), `build` : OK.
- Production : aucune entrée de distribution ajoutée ; le seul code de jeu changé (l'horloge du joueur) ne s'exécute qu'avec un joueur cuit,
  le chemin du joueur généré est couvert par le test (× 1 et × 1,7). Pas de preuve d'image sur ce point.

### Restes [?]
- La planche v3 : l'opérateur la génère avec le prompt v3 et ses trois pièces jointes, et la livre en PNG téléchargé ; puis § 6 du brief.
- Texture cuite à élargir avant la production du héros ; course avec Maj (4,25 m/s) à décider.

### Pensée
- Une planche source se mesure contre la distribution avant toute construction : tête sur hauteur, largeur du visage, longueur des jambes,
  avec la même lecture. Ici l'écart (0,28 contre 0,31-0,35) ne s'est vu qu'à l'aperçu en scène.
- Une « course » générée n'est pas un cycle : quatre images sur cinq identiques, et un buste deux fois plus court que les vues de repos.
- Un membre ne s'anime que s'il est séparable dans la vue : la source doit dessiner le bras détaché du buste ; une texture peinte chargée se
  fragmente quand on la tourne, des membres peints dans les teintes de la vue restent lisibles.

## Passe H4 — Héros premium : deux lots d'images v3 évalués ; déclinaisons du protagoniste : « une base + couleurs » (2026-10-19)

### Reçu
- Lot 1, deux planches collées dans la séance (copies WebP), opérateur, mot pour mot : « que penses tu de ces images ? ce n'est encore valider
  car je genere d'autres images encore ». Lot 2, quatre planches de casting (protagoniste en variantes A-D, personnages clés), mot pour mot :
  « qu'en penses tu de ce lot de images ? ». Ni l'un ni l'autre validé ; rien d'archivé (copies avec perte : l'archive attend le PNG d'origine
  de la planche retenue). Détail des mesures : `briefs/hero-proposal.md` § 11.

### Mesures (règle de 10 px sur les copies, à quelques pixels près)
- **[OK]** lot 1, proportions : tête ≈ 0,31 de la hauteur, contre 0,28-0,33 pour les PNJ redessinés dans la même image (0,28 sur la v2) ;
  visage presque aussi large que le leur, au lieu d'environ la moitié sur la v2.
- **[KO]** lot 1 : pas de vrai profil au repos (vues de côté de trois quarts) ; course à la même enjambée (écart des pieds 149-184 px pour des
  figures ≈ 262 px), aucune pose jambes croisées. Course de la deuxième planche à ≈ 0,75 de l'échelle du repos, proportions gardées ; de la
  première, buste rétréci (0,63 contre une tête à 0,89).
- **[KO] ma première lecture des bras** (« le poing au même endroit sur toutes les images ») : je mesurais le poing le plus avancé, or en course
  de profil un poing est toujours devant. L'opérateur, mot pour mot : « pourtant les bras bougent bien sur les sprites walk/run ». Relu image
  par image, alignées sur la tête : **[OK]** deuxième planche, la main proche descend à la hanche sur les images 2, 3 et 7, le bras proche est
  devant sur les autres (les deux extrêmes dessinés, ordre irrégulier) ; première, coude et avant-bras varient, le bras proche ne passe jamais
  derrière la hanche.
- **[KO]** lot 2 comme source : figures de repos ≈ 130-205 px, de course ≈ 75-125 px (1 à 2,4 px de source par texel pour un sprite de 85
  rangées ; v2 : 5,3) ; texte sur les planches. **[?]** cape de même clarté (OKLab L ≈ 0,31-0,35) mais deux fois moins saturée (C 0,03-0,05
  contre 0,08 sur la v2), liseré doré presque absent : lisibilité de nuit à vérifier en scène. Personnages clés : propositions non canoniques,
  deux doublonnent la distribution approuvée (marchande, capitaine / gardes).

### Décision de l'opérateur (2026-10-19), mot pour mot
- « nous aurons des declinaisons du protagonist afin de laisser le choix au joueur de choisir le personnage qu'il veut ».
- Question : « Qu'est-ce qui doit changer d'une déclinaison du protagoniste à l'autre ? » ; réponse, mot pour mot : « Une base + couleurs
  (Recommandé) » (autres choix proposés : « Plusieurs coiffures dès le départ », « Personnages distincts »).
- Sens : un seul dessin (une planche, un rig, une approbation), décliné en couleurs de cheveux et de peau (peut-être de cape) par le système
  des variantes des PNJ (Passe V1 : recoloration au rendu, aucune image de plus dans la texture cuite) ; d'autres coiffures plus tard, chacune
  une nouvelle base qui reprend les rampes.

### Fait
- Brief : décision 6, note au § 5 (une seule planche de base ; les couleurs ne se génèrent pas), un risque au § 8, § 11 (les deux lots).
  Aucun asset, aucun code.

### Restes [?]
- La planche de base de l'opérateur (PNG téléchargé), puis § 6 du brief.
- Plus tard, en tâches distinctes : masques du héros (cheveux, peau, cape éventuelle ; plus propres que ceux des PNJ, le héros est toujours à
  l'écran) ; écran de choix et héros choisi à la place du joueur (code de jeu, décision de l'opérateur).

### Pensée
- Le balancement d'un bras de profil se lit sur le bras proche (celui qui passe par-dessus le buste), images alignées sur la tête : le poing
  le plus avancé ne dit rien, en course un poing est toujours devant.
- Une planche de casting choisit une direction ; une source se juge à la taille de ses figures contre les 85 rangées du sprite.
- Une déclinaison de couleur passe par le système des variantes (au rendu, sans image en plus) ; une déclinaison de forme demande une base
  dessinée.

