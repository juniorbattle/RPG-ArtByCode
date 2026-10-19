# Journal de bord — Cité du Tournoi (Merchant District, nuit)

Objet : garder une trace honnête de ce qui a été fait, de ce qui a marché, de ce qui a raté et de **pourquoi**, pour que
la suite parte d'un état connu. À compléter à chaque passe (une entrée par passe, la plus récente en bas).

Légende : **[OK]** réussi · **[KO]** échec / impasse · **[?]** non résolu ou à surveiller · **Pensée** = raisonnement / leçon.

> Les passes 0 à S1b, H0, M6 et V0 à V3 sont archivées **mot pour mot** dans `journal/` (Passes M3, M6, M7, H5 et T1) ; ce fichier garde les passes récentes,
> « À reprendre » et « Principes à garder ». Un renvoi à une passe archivée (« journal pass 6k », « JOURNAL, Passe 4A-0B ») se lit
> dans le fichier que donne l'index.

| Archive | Passes | Dates |
|---|---|---|
| [`journal/01-passes-0-4B.md`](journal/01-passes-0-4B.md) | 0, 1, 2 (+ « État à la fin de la passe 2 »), 3, 3b, 4B | 10/10 → 12/10 |
| [`journal/02-passes-4A-0A-4A-quindecies.md`](journal/02-passes-4A-0A-4A-quindecies.md) | 4A-0A, 4A-0B, 4A, 4A-bis, 4A-ter, 4A-quater, 4A-quinquies, 4A-sexies, 4A-septies, 4A-octies, 4A-nonies, 4A-decies, 4A-undecies, 4A-duodecies, 4A-terdecies, 4A-quattuordecies, 4A-quindecies | 12/10 → 16/10 |
| [`journal/03-passes-4A-sedecies-M2.md`](journal/03-passes-4A-sedecies-M2.md) | 4A-sedecies, 4A-septendecies, 4A-duodevicies, 4A-undevicies, 4A-vicies, 5, 4A-unvicies, 5b, 4A-duovicies, 4A-tervicies, M1, 4A-quatervicies, M2 | 16/10 → 17/10 |
| [`journal/04-passes-6-6k.md`](journal/04-passes-6-6k.md) | 6, 6b, 6c, 6d, 6e, 6f, 6g, 6h, 6i, 6j, 6k | 17/10 → 18/10 |
| [`journal/05-passes-M3-M4.md`](journal/05-passes-M3-M4.md) | M3, Q1, Q1b, M4 | 18/10 |
| [`journal/06-passes-M5-S1b.md`](journal/06-passes-M5-S1b.md) | M5, S1, S2, S1b | 18/10 |
| [`journal/07-passes-H0-M6.md`](journal/07-passes-H0-M6.md) | H0, M6 | 18/10 |
| [`journal/08-passes-V0-V3.md`](journal/08-passes-V0-V3.md) | V0, V1, V2, V3 | 18/10 |

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

## Passe H5 — Héros premium : planche de base archivée, `hero-x2-v2` construit au stade lab (candidat) (2026-10-19)

### Reçu
- Onze PNG dans `incoming/` (« tu peux consulter le incoming ») : neuf avec le manifeste C2PA d'OpenAI (liaison dure recalculée identique,
  signature non vérifiée) ; `ref1` / `ref2` sans manifeste, mêmes pixels que les planches 1 et 3 du casting (écart 0,00). `2.png` (vue
  tournante 8 vues, marche 8, course 8) mesurée : même échelle partout, tête ≈ 0,33, vrai profil au repos ; course en poses de contact et
  ramassées seulement. Question : « Je construis le héros depuis 2.png, sans le motif doré ? » ; réponse, mot pour mot : « Oui : archive 2.png
  et construis le héros depuis elle, cape sans motif doré sur l'ourlet. »
- Branche `hero-x2-v2` depuis `main` (`0398c4f`). Archivée à l'octet (`cmp`) : `reference/sources/hero-turnaround-v3-2026-10-19.png`
  (`a86cea28…`) et sa fiche. La clé d'API OpenAI de l'opérateur (`.env.local`, ignoré par git, son ajout au `.gitignore` est de lui) n'est
  ni lue ni utilisée ici.

### Construction (`rigs/hero-x2-v2.rig.mjs`, outils partagés inchangés)
- Pas 3,4 ; `--holes --closing-from=48` ; l'ombre portée de la planche retirée dans le rig (gris neutres atteignables depuis l'extérieur,
  rangées ≥ 78) : face de 84 rangées, 1,777 m. Repos : respiration de la distribution.
- Course de profil, 8 images : les huit figures de la rangée de course, découpées (deux se touchent : remplissage depuis chaque tête),
  reconstruites au même pas, retournées, sur la palette commune, calées sur le visage. **[KO]** jambes peintes par IK sous les hauts du
  corps dessinés (méthode de `hero-x2-v1`) : bottes raides à côté des bottes dessinées, pan du manteau coupé en dents de scie. **[KO]**
  jambes dessinées décalées d'un bloc : la hanche se détache du manteau. **[OK]** jambes dessinées **cisaillées depuis la hanche** (pied à
  plat, déplacé d'un bloc) : pied d'appui sur une piste de 9 texels par image ; les images 4 et 8 reprennent les jambes des images 3 et 7.
  Pas de phase de vol (la planche n'en dessine pas).
- Face / dos : rebond, poids, cape, jambes levées sous le corps ; les mains descendent au balancement avant. **[KO]** les déplacer par
  `movePart` laissait des traînées claires (le fond comblé depuis la manche) ; la main redescendue est dessinée par-dessus.

### Contrôles
- `--check` : reconstruit à l'identique ; `verify-provenance` : intact ; `walkSlide` 9 texels : horloge × 1,56 en B / D, × 1,52 en C,
  × 1,6 (plafond) en A ; glissement en mouvement (joueur tenu sur une touche) B −0,02, C −0,05, D −0,02 ; Maj en B −1,09 (connu).
- Aperçu DEV `?cast=candidate` (entrée candidate de `BakedCast`, `replaces: ['player']`) ; flipbook de la course en B et D relu ;
  captures `reviews/hero-x2-v2/`. En B, l'anneau pointillé autour de la tête est le dévoilement du réverbère du quai, pas le sprite.
- **Critique à l'aveugle** (agent neuf, étiquettes tirées au sort, contre `dockworker-x2-v2`) : héros meilleur en silhouette, matières et
  animation ; moins bon en proportions (cheveux et gants volumineux), visage (yeux sous la frange), palette sombre et contours. Son premier
  défaut, un halo clair autour du contour, **[OK] vérifié sur les pixels** : 6,2 % des texels du bord ont le gris du fond de la planche
  (distribution 0,8-1 %, `hero-x2-v1` 4,1 %) ; retiré dans le rig (`dehalo` : bords gris neutres de la clarté du fond, deux passes) → 0,5 %.
  Bras figés devant la poitrine et course sans vol : dessin de la planche, laissé à l'opérateur (qui a jugé les bras de ces planches
  vivants, Passe H4).
- Seconde critique, neuve, après la retouche : plus de halo signalé ; héros toujours meilleur en silhouette, mains, matières et animation
  (jambes : contact, passage, genou levé ; cape), égal en proportions, moins bon en visage (yeux sombres sous la frange, pas de bouche :
  illisible à 1-2 px par texel), palette (cheveux, sangles, gants et bottes sur une même rampe brun-orangé) et contours (couronne des cheveux
  effritée, bruit du buste en course). Vérifié sur les pixels : 17 texels orphelins sur 36 images, aucun îlot (voyageur 11, docker 0) :
  l'effritement est la texture peinte de la planche à 3,4 px par texel plus qu'une saleté ; restent quelques texels clairs (pan de chemise)
  entre les jambes des images 7 et 8. **[KO] critère d'acceptation du brief (§ 7 : au moins égal au docker sur chaque axe) non atteint**
  (visage, palette, contours) ; une retouche faite sur les deux permises, la suite (visage, bras, vol) touche au dessin de la planche :
  décision de l'opérateur.

### Journal — [OK] archivage
- Avec la Passe H5, les passes gardées atteignaient 61 415 octets (seuil ≈ 60 Ko) : H0 et M6, les deux plus anciennes (closes : décisions
  consignées, branches fusionnées), déplacées d'un bloc, dans leur ordre, à l'octet, dans `journal/07-passes-H0-M6.md` (en-tête, ligne `---`,
  puis les 5 281 octets inchangés, SHA-256 `cdd6363d1487f793…`) ; ligne d'index et phrase d'en-tête mises à jour ; 56 134 octets de passes
  gardées (V0 à H5).
- Preuve (script hors dépôt, contre le journal juste avant le déplacement) : **8 / 8** (en-tête ; corps = octets retirés ; H0 et M6 chacune
  une seule fois, dans la nouvelle archive ; passes gardées inchangées ; `JOURNAL.md` = l'original moins le bloc, à la phrase et à la ligne
  d'index près ; archives 01 à 06 inchangées ; CRLF seuls). Contrôle négatif : un mot changé dans une copie de l'archive → 7 / 8.

### Restes [?]
- **Décision de l'opérateur** : production du héros ou retouches ; rien n'est approuvé.
- Texture cuite : 322 + 36 images, au-delà des 336 garanties (l'aperçu passe sur ce GPU) ; à élargir avant la production.
- Course avec Maj (4,25 m/s) ; masques des déclinaisons de couleur (tâche distincte).

### Pensée
- Une planche qui ne dessine que les poses extrêmes d'une course se complète par cisaillement de ses jambes depuis la hanche (le pied reste
  un bloc à plat) : le dessin d'origine reste, la foulée devient régulière ; des jambes peintes à côté d'un dessin riche font tache.
- Le fond d'une planche se mélange aux cellules du bord : mesurer la part des texels du contour proches de la couleur du fond, et la retirer
  au rig, avant la critique.

## Passe F1 — Revue du héros par l'opérateur ; le sprite d'un marcheur suit son déplacement réel (2026-10-19)

### Revue de l'opérateur (`hero-x2-v2` en jeu, DEV `?cast=candidate`), mot pour mot
- « les courses de profil ne sont pas bons surtout quand le joueur descend vers le bas de la camera de face on dirait que le joueur fait une
  monte de genou, sinon on utilise un anim qui donne l'impression de courir mais le personnage se deplace lentement... le heros a cote des
  pnjs semble correct, mais de maniere generale j'ai l'impression que les angles de camera dynamique n'aide pas setup de maniere clair les
  deplacements des perso npc/heros correctemnt ils donnent l'impression de marcher de travers... un des docker lors qui marche vers le stand
  de la marchande se deplace avec vers le bas et du point de vue de la camera on le voit se deplacer de cote dos a la camera.... donc de
  travers »

### Mesures à sa suite
- Méthode : variante hors dépôt du harnais de `tools/foot-slip.mjs` ; à chaque pas, la vue montrée contre celle que donnerait le
  déplacement réel à l'écran (même règle des 50° / 40°).
- Cause 1, **[OK] confirmée** : le sprite prenait la direction **voulue** (cible du PNJ, touche du joueur) alors que `resolve` fait glisser
  le marcheur le long d'un seul axe contre un obstacle. En D, le docker montré de profil vers la droite en allant vers la gauche sur 4,8 % de
  ses pas (40 s, graine 1842).
- Cause 2, **[?] structurelle** : trois vues seulement (face, dos, profil) ; en B et C, 41 à 100 % des pas des PNJ partent à 20-40° en
  diagonale à l'écran (en D : 0 à 13 %) : un profil qui glisse en diagonale.
- Course du héros : la planche dessine ≈ 14 texels par image entre ses poses, resserrés à 9 pour 2,5 m/s : grande allure, petit pas
  (« court mais avance lentement ») ; de face, les jambes levées jusqu'à 9 texels sous le corps se lisent comme une montée de genou.

### Décisions de l'opérateur (2026-10-19), mot pour mot
- Vitesse : « Héros plus rapide (Recommandé) » (garder les enjambées dessinées, ≈ 3,5-4 m/s, Maj à revoir).
- Directions : « Correctif puis 3/4 (Recommandé) » (d'abord le sprite suit le déplacement réel ; ensuite étudier des vues de trois-quarts,
  le héros d'abord, dont la planche en dessine).

### Fait — [OK] le correctif
- Branche `facing-actual-motion` depuis `main` (`0b5de1c`). `ActorSystem.shownStep` : un pas est montré, et son horloge réglée, par le
  déplacement réel dès que les obstacles en laissent passer au moins un cinquième ; bloqué, le marcheur garde la direction voulue. Joueur et
  PNJ ; positions et tirages inchangés (seule la vue montrée change).
- `tests/stride.test.mjs` +1 (un pas en diagonale bloqué vers la caméra glisse à droite : profil vers la droite, horloge à la vitesse du
  glissement) ; contrôle négatif : l'ancien `ActorSystem.ts` remis → 1 échec. `npm test` 39 / 39, `typecheck`, `build`, `art:validate`.
- Audit après : D, docker 4,8 % → 0,0 % de vues contraires au déplacement ; mêmes nombres de pas (déplacements identiques). Les diagonales
  de B / C restent (cause 2).

### Restes [?]
- Héros plus rapide : vitesse du joueur cuit, enjambée dessinée (≈ 14 texels par image), course de face sans montée de genou ; Maj.
- Étude des vues de trois-quarts (héros d'abord).
- Suite confiée par l'opérateur à une séance cloud (consolider le Merchant District : personnages en scène, architecture, caméras, météo).

### Pensée
- Une vue se choisit sur ce que le personnage fait à l'écran, pas sur ce qu'il voulait faire : un glissement contre un obstacle doit se voir
  comme un pas de côté.
- Avec trois vues, toute marche en diagonale à l'écran se lit de travers ; mesurer la part des pas hors de l'axe de la vue montrée dit si le
  problème est le choix de la vue ou le nombre de vues.

## Passe T1 — Séance cloud : texture cuite en colonnes (672 images garanties) ; archivage V0-V3 (2026-10-19)

### Demande et cadre
- Brief de la séance locale, transmis à une séance cloud de 4-5 h : consolider le Merchant District (personnages en scène, architecture et
  caméras, météo), point 3 des personnages : « Texture des personnages cuits à élargir avant toute production du héros : les dix PNJ en
  production utilisent 322 des 336 images garanties en 2048 rangées, et le héros en ajoute 36. »
- Consigne de l'opérateur pendant la séance, mot pour mot (extraits) : « pleine autonomie jusqu'à la fin de la séance, elle remplace « arrête-toi
  et pose-lui une question » du brief » ; « Ne t'arrête jamais pour demander, et n'attends aucune réponse : avance sur tout le brief. » ;
  « Certaines décisions restent les miennes : approbation d'assets pour la production, statut Gold Master, installations, changement des
  cadrages A/B/C/D approuvés. » ; « Ne les prends pas : prépare-les derrière un paramètre d'URL, sans changer le jeu par défaut. » ; « Pour toute
  autre décision technique : choisis toi-même l'option la plus sûre. Consigne-la dans le journal comme ton choix, avec ses raisons, et non comme
  ma décision. » ; « Fusionne dans main chaque tâche validée, comme le dit AGENTS.md. »
- Branche : la séance cloud impose un seul nom de branche (`claude/stoic-goodall-8ieke4`) ; **mon choix** : une tâche à la fois sur ce nom,
  fusionnée en avance rapide dans `main`, supprimée, puis recréée depuis `main` pour la tâche suivante (une branche par tâche, comme le veut
  `AGENTS.md`).

### Environnement de la séance cloud — [OK] mesuré
- Linux, 4 cœurs, Node 22.22.0 ; `npm ci`, `typecheck`, `npm test` (39 / 39), `build`, `art:validate` (16 manifestes, 12 sources, 0 erreur) : OK.
  `art:doctor` : Aseprite **non installé** (rien installé). Pas de GPU (`/dev/dri` absent).
- Chromium 1194 (celui de Playwright, préinstallé dans le conteneur) : WebGL2 par **SwiftShader** (rendu logiciel ; `MAX_TEXTURE_SIZE` 8192,
  MSAA 4, minuteurs GPU présents mais sans valeur pour la 780M). Le jeu démarre : 154 s en 1280 × 720, dont 136 s de bake ; 25 s avec `vis=0`.
  Les captures déterministes (`tools/detshots.mjs`) marchent ; **aucune mesure de temps GPU de cette séance ne vaut pour la machine de
  l'opérateur** (seuls les appels de dessin et triangles se transposent).
- Chrome refuse de démarrer en root sans `--no-sandbox` : un enveloppeur hors dépôt (`exec chromium --no-sandbox "$@"`) sert de `CHROME_PATH`
  aux outils figés par empreinte (`reconstruct-grid`) sans les toucher. `tools/detshots.mjs` prend désormais `CHROME_ARGS` (remplace les
  options GL, ex. `--use-angle=swiftshader`) et `READY_MS` (délai de démarrage) ; sans ces variables, rien ne change.

### Texture cuite en colonnes — [OK]
- `SpriteAtlas.packBaked` : rangement par étagères (une par densité, dans l'ordre des feuilles) en **colonnes de 1024 × 2048 texels** (2048 =
  le minimum garanti par WebGL2, quel que soit le GPU : même rangement partout) ; une image qui ne tient plus sous la rangée 2048 ouvre la
  colonne suivante à x = 1024 ; deux colonnes au plus (2048 × 2048, la garantie) : **672 images ×2**. La première colonne se range exactement
  comme l'ancienne texture : la case d'une image ne bouge jamais quand on en ajoute après elle ; la texture n'a que la largeur de ses colonnes.
- Production (322 images) : une colonne, 1024 × 2016, **les mêmes octets** qu'avant. `?cast=candidate` (+ 36 images du héros) : 2048 × 2016
  (les 14 premières images du héros finissent la dernière étagère de la colonne 0, les 22 autres ouvrent la colonne 1) au lieu de
  1024 × 2208 (calculé : 23 étagères), au-delà de la garantie.
- L'adressage par case entière (contrat § 13) lit `(texel + 0,5) / taille` : la largeur de la texture ne change pas le texel lu.
- Contrat d'intégration : § 15 ajouté.

### Preuves
- `tests/baked-atlas.test.mjs` (4) : une colonne = l'ancienne formule (oracle écrit à part : x = (n mod 16) × 64, y = ⌊n / 16⌋ × 96) pour
  1 à 336 images ; au-delà, deuxième colonne, première inchangée ; 672 tiennent, 673 refusées ; une nouvelle densité ouvre une étagère, une
  étagère ×3 qui ne tient plus passe à la colonne suivante ; distribution réelle : production à l'octet près, cases et octets de chaque image
  de PNJ identiques avec le héros candidat. **Fautes injectées une à une, toutes attrapées** : colonnes de 4096 rangées (1 / 4 passe), nouvelle
  colonne à x = 0 (1 / 4), seuil décalé d'une étagère (1 / 4), trois colonnes permises (3 / 4), hauteur = dernière colonne (1 / 4).
- Captures déterministes (graine 1842, `clean=1&freeze=7.3&vis=0`, 120 pas, 1280 × 720, SwiftShader), branche contre `main` figé
  (`b3ac07f`, servi sur :5188), cadrages A / B / C / D (joueur placé dans la zone) : production **0 px** ; `?cast=candidate` **0 px** (héros dans
  la deuxième colonne d'un côté, texture de 1024 × 2208 de l'autre). Témoin : production contre candidat sur la branche, 7 538 à 12 797 px
  (le héros) ; répétition (deux chargements) 0 px. `vis=0` : le changement ne touche que la texture des personnages, pas le bake.
- `npm test` 43 / 43, `typecheck`, `build`, `art:validate`.

### Journal — [OK] archivage
- Les passes gardées faisaient 60 364 octets (forme de l'index git, fins de ligne LF) : V0 à V3 (closes : décisions consignées, branches
  fusionnées) déplacées d'un bloc, dans leur ordre, à l'octet, dans `journal/08-passes-V0-V3.md` (en-tête, ligne `---`, puis les 24 270 octets
  inchangés, SHA-256 `7a45d58c4e714cc2…`) ; ligne d'index et phrase d'en-tête mises à jour.
- Preuve (script hors dépôt, contre `git show b3ac07f:JOURNAL.md`, cette entrée laissée hors de la comparaison) : **8 / 8** (en-tête ; corps =
  octets retirés ; V0-V3 chacune une seule fois, dans la nouvelle archive ; passes gardées H1-F1 inchangées ; `JOURNAL.md` = l'original moins
  le bloc, à la phrase et à la ligne d'index près ; ligne d'index ; archives 01-07 inchangées ; LF seuls). Contrôle négatif : deux mots changés
  dans une copie de l'archive → 7 / 8. Le dépôt garde les fins de ligne LF dans l'index ; la copie de travail de l'opérateur les convertit.

### Pensée
- Une capacité se dimensionne contre la garantie de la norme, et s'étend en ajoutant à côté (une colonne) plutôt qu'en déplaçant ce qui
  existe : la production garde ses octets, la preuve en image est alors un 0 px exact.
- Une séance sans GPU reste utile pour l'image : le rendu logiciel est déterministe et compare deux versions entre elles ; il ne dit rien des
  temps du GPU de l'opérateur.

## Passe H6 — Héros plus rapide (code de jeu fait, rig préparé, export à reconstruire) ; étude des vues de trois-quarts (2026-10-19)

### Demande
- Décisions de l'opérateur de la Passe F1, mot pour mot : « Héros plus rapide (Recommandé) » (garder l'enjambée dessinée, ≈ 3,5-4 m/s, Maj
  à revoir ; de face, ne plus lever les jambes jusqu'à 9 texels) et « Correctif puis 3/4 (Recommandé) » (étudier les vues de trois-quarts,
  le héros d'abord). Séance cloud sans Aseprite (Passe T1).
- Branche `claude/stoic-goodall-8ieke4` recréée depuis `main` (`1b56448`). **[KO] environnement** : la suppression de la branche distante après
  la fusion de T1 est refusée par le proxy git de la séance (« unexpected disconnect », puis « Everything up-to-date ») ; la branche distante
  pointait sur le commit fusionné et sert de nouveau, sous le même nom, à la tâche suivante.

### Vitesse du héros cuit — [OK] code de jeu (`ActorSystem`)
- **Mon choix** (raisons : garder l'enjambée dessinée, aucune image qui patine, aucun changement du jeu par défaut) : un joueur cuit court à
  la vitesse que dessine son cycle, `walkSpeed` (la mesure du moteur, `walkSlide`) × 1,12 (l'échelle des personnages en B / D) × 1,5
  (`HERO_CLOCK`) : ses images défilent à 1,5 × la cadence de base en B / D, pied d'appui planté. La vitesse suit donc le dessin : avec l'export
  actuel (9 texels par image) 2,40 m/s au lieu de 2,5 ; avec le rig préparé (14 texels) **3,73 m/s**.
- Maj sur le héros cuit : un sprint × 1,2 (4,48 m/s avec 14 texels), son horloge bornée à 2 (`HERO_CLOCK_MAX` ; la borne des PNJ, 1,6, sert à
  empêcher un cycle lent de s'emballer, sans objet pour un cycle dessiné à la vitesse du héros) : en A (échelle 1), 2,02 → 2, 1 % de glissement.
- Joueur généré (la production : le héros cuit est un candidat, DEV `?cast=candidate`) : 2,5 m/s, × 1,7 avec Maj, inchangé.
- `tests/stride.test.mjs` : le test du joueur réécrit (oracle en nombres : 1,4 × 1,12 × 1,5 = 2,352 m/s, déplacement, horloges B / C / A,
  sprint, 14 texels → 3,73086 m/s ; joueur généré : 2,5 m/s, × 1, × 1,7) ; le test de la Passe F1 suit la nouvelle vitesse. **Fautes injectées
  une à une, toutes attrapées** : héros à 2,5 m/s (2 échecs), Maj × 1,7 pour le héros, borne 1,6 pour le joueur, vitesse selon l'échelle du
  cadrage courant, Maj × 1,2 pour le joueur généré (1 échec chacune).

### Rig préparé — [OK] images construites ici ; [?] export à reconstruire sur la machine de l'opérateur
- `rigs/hero-x2-v2.rig.mjs` : pied d'appui sur une piste de **14 texels par image** (l'écart contact → pied ramassé que dessine la planche,
  mesuré ici : pied d'appui des 8 images dessinées entre les colonnes 12,5 et 42,5, en deux images au lieu de trois de 9) ; la 4e image de
  chaque pas devient un **vol** (les jambes de la poussée, la figure 2 rangées au-dessus de la rangée des pieds : la critique de la Passe H5
  relevait « course sans vol ») ; de face / dos, jambes levées de **5 texels au plus** (`LIFT` 0,0,0,2,4,5,3,1 au lieu de 0,0,0,3,7,9,5,1).
- `build-character.mjs` tourne ici jusqu'aux images (étapes 1 à 4 : reconstruction par Chromium, palette, rig, contrôles du contrat) ; seule
  l'écriture Aseprite manque. Contrôle : avec le rig de H5, les 36 images reconstruites ici = l'export validé, **0 texel d'écart** ; avec le
  rig H6 : contrôles du contrat OK (anneau transparent, alpha binaire, repos sur la rangée 90), `walkSlide` **14** (mesure du moteur), rangée
  basse des images de profil 90 90 90 88 90 90 90 88 (vol).
- **L'export, le `.aseprite` et le paquet de provenance restent ceux de H5** : `verify-provenance` signale l'empreinte du rig (1 problème)
  jusqu'à la reconstruction ; `art:validate` passe (candidat, pas de production). À faire sur la machine de l'opérateur :
  `node tools/art-lab/build-character.mjs art-lab/characters/rigs/hero-x2-v2.rig.mjs`, puis `--check`, puis `verify-provenance` ; la revue
  (`reviews/hero-x2-v2/README.md`, § Pass H6) le détaille.

### Glissement en mouvement — [OK]
- `tools/foot-slip.mjs --keys=d[,shift]` (nouveau : touches tenues, le joueur court ; `CHROME_ARGS` / `READY_MS`), graine 1842, 4 s, caméra
  épinglée, médiane [min .. max] ; `main` figé (`b3ac07f`, export H5 à 2,5 m/s), branche (export H5 à 2,40 m/s), aperçu H6 (copie hors dépôt
  servie sur :5189 : la planche assemblée depuis les images du rig H6 et l'empreinte du paquet de la copie mise à jour ; jamais commitée ;
  l'assembleur redonne l'export H5 à 0 texel avec les images de H5) :

| | A | B | C | D |
|---|---|---|---|---|
| `main`, marche (2,5 m/s) | +0,09 | −0,02 | −0,05 | −0,02 |
| `main`, Maj (4,25 m/s) | −2,11 | +0,22 | +0,35 | +0,40 |
| branche, export H5 (2,40 m/s) | +0,05 | −0,07 | −0,10 | −0,07 |
| branche, export H5, Maj (2,88 m/s) | +0,01 | −0,03 | +0,04 | −0,01 |
| aperçu H6 (3,73 m/s) | +0,05 | −0,06 | −0,10 | −0,07 |
| aperçu H6, Maj (4,48 m/s) | +0,01 | −0,06 | +0,04 | −0,04 |
| aperçu H6, vers la gauche | — | −0,03 | −0,10 | −0,07 |

- Les −0,06 à −0,10 ne sont pas un glissement : à 11,25 images / s (horloge 1,5), une image dure 5,33 pas de 1/60 s, soit 5 ou 6 ; une
  période de 5 pas donne (5 − 5,33) / 5 = −0,067, une de 6 donne +0,111 : exactement les bornes mesurées (−0,07 .. +0,11) ; la moyenne est
  nulle. Sur `main`, l'horloge × 1,56 (5,13 pas) donnait −0,02 pour la même raison ; Maj patinait de +0,22 à +0,40 (horloge plafonnée à 1,6).
- En A, `main` place le héros à x = −16 hors du quai jouable (x ≥ −13,5) : mesures refaites à x = −12,5.

### Critique à l'aveugle — [OK] le rig H6 gagne
- Agent neuf, étiquettes tirées au sort (clé hors de sa portée), images de course seules (profil, face, dos ×4), auto-critique écrite avant
  le verdict : **H6 7 / 10, H5 5,5 / 10**, H6 meilleur en lecture de course de profil (vraies images de vol, rebond de la tête de 2-3 texels à
  l'atterrissage), de face (levée de 5 texels : « a light jog-in-place » contre « a high-knee march in place » pour 9), de dos (la botte de H5
  disparaît sous l'ourlet de la cape aux images 1 et 5, celle de H6 garde au moins 4 rangées) et en propreté ; H5 garde l'avantage de la
  fluidité (pas de 9 texels plus fin).
- Ses mesures, **vérifiées contre le rig** : contact 14,5 / 28,5 / 42,5 (+14 par image), images 3 et 7 sans texel sur les rangées 89-90, levées
  de face 0,0,0,2,4,5,3,1 contre 0,0,0,3,7,9,5,1 : exactement les valeurs du script.
- Relevés communs aux deux, non traités : pas de balancement des bras de face / dos (corps rigide), un texel noir en éperon au talon arrière
  (profil, images 6-7), un genou en boule grise ; botte levée de face = copie rigide (ni semelle ni talon).
- [?] Contrepartie notée par le critique : entre deux images, le pied d'appui avance avec le sprite puis recule de 14 texels (9 avant) :
  ≈ 25 px en B au lieu de 16 ; seules plus d'images intermédiaires (16 au lieu de 8) le réduiraient. À juger en jeu par l'opérateur.

### Vues de trois-quarts — [OK] étude ; décision à l'opérateur
- `art-lab/characters/briefs/three-quarter-views.md` : mesure, planche, coût du code et de l'art, autres voies, recommandation, questions.
- **Mesure** (`tools/step-angles.mjs`, nouveau : harnais de `foot-slip`, 40 s, tous les PNJ qui marchent) : avec cinq secteurs, le
  **trois-quarts dos** prendrait 44 à 54 % des pas en A / B / C à la graine 1842 (8 % à 7719), le trois-quarts face 5 à 32 %, le profil 36 à 61 % ;
  D garde 93 % de profils. Raison : le quai court le long de x et A / B / C regardent en amont du canal : remonter le quai, c'est s'éloigner en
  diagonale. Règle actuelle à trois vues : 7 à 67 % des pas à 20-40° de l'axe de la vue montrée.
- **Planche du héros** (boîtes des huit vues mesurées) : la 2e est un trois-quarts face ; **les 4e et 5e sont deux dos presque identiques,
  aucun trois-quarts dos n'est dessiné** (le brief en comptait deux) ; 6e et 7e : côté droit, presque de profil ; course et marche de profil
  seulement. Vues reconstruites au pas du héros : `reviews/hero-x2-v2/08-turnaround-eight-views-x3.png`.
- **Coût du code** : `Dir` à 5 valeurs, règle à 5 secteurs avec hystérésis et **repli par feuille** (sans images de trois-quarts, la règle
  actuelle : aucun PNJ ne change), `walkSlide` / `walkClock` par vue, étiquettes, contrôles ; aucun appel de dessin ni shader ; texture :
  10 PNJ + héros en 5 vues = 582 images, sous les 672 garanties depuis T1. **Coût de l'art** : trois-quarts face du héros depuis la vue 2
  (course montée comme celle de face) ; trois-quarts dos : une nouvelle source (génération par l'opérateur).
- Recommandation : (a) règle à 5 secteurs avec repli, derrière un paramètre DEV, prouvée à 0 px ; (b) le héros en cinq vues, trois-quarts dos
  demandé à la source ; (c) les PNJ ensuite, trois-quarts dos d'abord. Autres voies chiffrables sans art : règle à trois vues biaisée vers le
  dos, cibles des promeneurs plus alignées sur l'écran.

### Restes [?]
- Reconstruction Aseprite de `hero-x2-v2` (export, `.aseprite`, paquet) puis `--check`, `verify-provenance`, glissement refait sur le vrai
  export, revue de l'opérateur en jeu (`?cast=candidate`) : rien n'est approuvé.
- Décision de l'opérateur sur les vues de trois-quarts (questions du § 6 de l'étude).

### Pensée
- Une vitesse de jeu qui suit le dessin (la mesure du moteur sur le cycle) ne peut pas faire patiner : changer l'enjambée dessinée change la
  vitesse, et l'export d'avant reste juste à sa propre vitesse.
- Un « glissement » médian de quelques pour cent se vérifie contre la quantification (pas de simulation par image) avant d'être corrigé.
- Une planche « tournante » se mesure vue par vue : deux dos ne font pas un trois-quarts dos.

## Passe K1 — Caméras : transitions ancrées partout, préparées derrière `?camblend=anchored` (décision de l'opérateur) (2026-10-19)

### Demande
- Objectif 2 du brief : « Architecture et caméras : optimisations mesurées : coût GPU, preuves de visibilité, cadrages. Tout changement de
  cadrage approuvé passe par l'accord de l'opérateur ; montre-lui avant / après. » Consigne d'autonomie (Passe T1) : un changement des
  cadrages approuvés se prépare derrière un paramètre d'URL, sans changer le jeu par défaut.
- Point ouvert d'« À reprendre » § 4 (d) : les transitions B → A et C → B (vers l'ouest) font glisser le joueur à l'envers à l'écran
  (mesuré en Passe 4B, jamais corrigé). Branche `claude/stoic-goodall-8ieke4` recréée depuis `main` (`b7bdec2`).
- Pas de GPU dans cette séance : **aucune mesure de coût GPU** (les temps SwiftShader ne disent rien de la 780M) ; les preuves sont
  `camsim`, des tests, des captures et `visproof` en rendu logiciel.

### Mesure avant — [OK] (`tools/camsim.mjs`, `CHROME_ARGS` / `READY_MS` ajoutés ; graine 1842, `vis=0`, joueur généré à 2,5 m/s)
- B → A (de x −5 à −12,5) : **14 images de recul, au pire −139 px/s** (Passe 4B : −131) ; A → B : 5 images, −25 px/s ; B → C, C → B : 0 ; C → D :
  6 images de transition à −38 px/s et 10 images posées à −39 px/s ; D → C : 6 images de transition et 25 posées, −15 px/s.
- Calcul image par image (nouveau test) : pendant B → A, le joueur file d'abord vers la gauche (jusqu'à −197 px/s), puis repart **à
  contresens jusqu'à +181 px/s** : la rotation de −57,5° à −78° l'emporte sur sa marche.

### Préparé — `?camblend=anchored` (DEV et production ; absent = les transitions approuvées)
- `CameraGraph.anchorAll` : toutes les transitions passent par `blendPose` ancré (le joueur glisse de sa place à l'écran dans le cadrage de
  départ à sa place dans le cadrage d'arrivée, comme les transitions vers D depuis la Passe 4B) ; leurs durées ne changent pas (1,2 s au plus
  hors D). Le bake échantillonne alors les transitions A ↔ B et B ↔ C ancrées, aux six poids des transitions vers D : 329 poses au lieu de 273
  (+56, ≈ +20 % sur un bake neuf, la clé du cache les distingue). `?blend=` suit le paramètre. Les cadrages A / B / C / D eux-mêmes ne
  changent pas.
- **Mon choix** de laisser C ↔ D tel quel : déjà ancré ; ses reculs restants surviennent en grande partie hors transition (cadrage posé : le
  pivot qui rattrape le joueur), un autre sujet.

### Mesure après — [OK]
- `camsim` avec `camblend=anchored` : B → A **0 image de recul** (au lieu de 14) ; A → B 0 (au lieu de 5) ; B ↔ C 0 ; C ↔ D inchangés.
- Calcul image par image : pic à contresens de B → A **+21 px/s** (au lieu de +181) ; ce reste vient de l'écart de place du joueur entre B
  (NDC x ≈ −0,37) et A (≈ −0,17) : l'effacer demanderait de recaler le pivot de A (un changement de cadrage, à l'opérateur).
- Captures (SwiftShader, 960 × 540, graine 1842, le joueur à sa place réelle pendant la transition) :
  `screenshots/calibration/k1-camblend/BA-approved-vs-anchored.png` (six instants, approuvé en haut, ancré en bas) et
  `BA-mid-approved-vs-anchored.png` (0,2 / 0,4 / 0,6, plus grand) : ancré, le joueur reste en bas à gauche pendant la transition.

### Preuves
- Défaut inchangé : les 273 poses du bake sont **identiques à l'octet** à celles de `main` figé (`b3ac07f`) ; le code des transitions ne
  diffère que si `anchorAll` est vrai.
- `tests/camera-graph.test.mjs` +3 : le défaut approuvé reproduit le recul de B → A (pic > 150 px/s, ≥ 20 images) ; ancré, pic < 30 px/s et
  aucun recul en A → B ; poses du bake : A / B / C / D / CD / BD identiques, AB / BC plus nombreuses avec le paramètre, et des interpolations
  simples sans lui. **Fautes injectées une à une, toutes attrapées** (1 échec chacune) : paramètre sans effet sur les transitions, poids du
  bake inchangés, poses AB / BC ancrées par défaut, toutes les transitions ancrées par défaut.
- Visibilité (`tools/visproof.mjs`, nouveau : `CHROME_ARGS`, `READY_MS`, `SETTLE_MS`, les transitions ancrées suivent `anchorAll` ; SwiftShader,
  1280 × 720, `occ=0`, élagué contre `vis=0` dans la même session, `camblend=anchored`) : AB −9,4 à w 0,5 ; AB −11 / 2,5 à 0,7 ; BC 4,2 à 0,5 ;
  BC 8,5 / 2,4 à 0,4 ; B posé : **0 px** ; AB −7,5 / −1 à 0,33 : **5 px** au bord droit (colonnes 1270-1279, max 21). `tools/vis-why.mjs` (même
  ajout) : 3 pièces manquées, toutes Tier 3, 1 px chacune (deux arbres au bord du cadre, un mur de la guilde), « tile 0, tile8x 0 » = plus fines
  qu'un pixel du bake même ×8 ; une fois forcées, **3 px restent**, sans pixel d'ordre : la classe de résidu connue (un seul échantillon MSAA
  à travers une fissure, Passe 5b), au bord du cadre, entre deux poses échantillonnées (w 0,33 → poids lissé 0,26, entre 0,06 et 0,32).
  Tier 3 : 299 pièces sur 738 avec le paramètre (303 sans) : le bake garde 4 pièces de plus pour les poses ancrées.

### Décision à demander à l'opérateur
- Adopter les transitions ancrées partout (`?camblend=anchored` devient le défaut) ? **Recommandation : oui** (plus de recul du joueur en
  A ↔ B, aucun cadrage changé, coût : +56 poses au bake neuf). En option, recaler le pivot de A pour effacer le reste (+21 px/s) : à chercher
  avec `camsearch` et montrer.

### Pensée
- Une transition entre deux cadrages hérite de l'écart de place du joueur à l'écran entre eux : l'ancrage supprime la rotation qui l'emporte,
  pas cet écart ; une mesure image par image (signe de la vitesse à l'écran) sépare les deux.

## Passe W1 — Météo : pluie, neige, orage, vent, chacun derrière son paramètre d'URL (2026-10-19)

### Demande
- Objectif 3 du brief, mot pour mot : « Météo : pluie, neige, orage, vent. Génère-la par le code, avec un paramètre d'URL pour chaque effet ;
  le jeu par défaut reste identique tant que l'opérateur n'a pas choisi. Respecte les règles de rendu d'AGENTS.md : pas de `discard` hors de
  l'occlusion, alpha de la scène = masque du flou de profondeur, `maskSafeBlending` pour tout ce qui est dessiné après la passe opaque,
  reflets. Mesure les performances. » Branche `claude/stoic-goodall-8ieke4` recréée depuis `main` (`3fe2bfe`).

### Fait — [OK] (`src/atmosphere/Weather.ts`, `?rain` / `?snow` / `?storm` / `?wind`)
- **Sans paramètre, rien n'est créé** : aucun objet, aucun uniforme écrit, aucun tirage de `Math.random` (l'uuid d'un objet THREE en tire un ;
  sous graine, toute la suite se décalerait, Passe V1).
- **Pluie** (`rain=<0..1>`) : jusqu'à 9 000 traînées dans une boîte de 44 × 14 × 44 m qui suit le joueur (repliée dans le monde : le champ ne
  glisse pas quand la caméra bouge), un quad par goutte animé dans le shader de sommets depuis l'horloge de la scène (aucun travail par goutte
  sur le CPU), au moins un pixel de large (plus fin : l'alpha prend la couverture), éclairées par les lanternes comme les poussières (ambre
  seulement là où la lumière les atteint), éteintes par la brume, rien à moins de 2,5 m de l'objectif ; pavés plus mouillés (`uWet` 1 → 1,3),
  **anneaux de pluie** dans les flaques et sur le canal (nouvelles branches `uRain > 0` des shaders du sol et de l'eau), un peu plus de brume.
- **Neige** (`snow=<0..1>`) : jusqu'à 5 000 flocons qui dérivent (balancement propre à chacun, vent), une **couverture** ivoire froid, en
  plaques, sur les pavés (plus mince dans les joints ; les flaques disparaissent) et sur les faces tournées vers le haut (toits, appuis,
  corniches : branche `uSnow > 0` du shader des surfaces, sur la normale géométrique) ; plus de brume.
- **Orage** (`storm=<0..1>`) : éclairs graines (`Rng(4242)`, horloge de la scène), un toutes les 5 à 14 s, 2-3 pulsations : la lumière de lune,
  l'ambiance et la brume (le même ton que les nuages du ciel) montent un instant vers un indigo pâle, puis reviennent exactement ; un
  uniforme écrit entre-temps (curseur du panneau) est gardé. Ciel couvert (`uCloud` : une couche lente qui cache la lune et les étoiles). Amène
  la pluie (0,85 × orage) et le vent (1 + orage) sauf s'ils sont donnés. Horloge figée (`?freeze`) : aucun éclair ; `weather.strike()` en
  montre un (captures).
- **Vent** (`wind=<0..3>`) : multiplie le balancement des tissus et des feuilles (`uWindAmp`, 1 = comme avant), la dérive des fumées et
  l'inclinaison de la pluie et de la neige.
- **[KO → corrigé]** première version : la pluie dessinée (108 appels au lieu de 107) mais invisible, même agrandie ×10 ; cause : une traînée
  qui tombe a sa queue au-dessus de la goutte, son quad tourne dans le sens horaire à l'écran, et le matériau à une face l'éliminait (les
  flocons, carrés dans l'autre sens, passaient). Matériau double face.
- **[KO → corrigé]** réglages de la première version : pluie invisible dans la bande de mise au point (gouttes de 0,5 px à 26 m, le flou de
  profondeur efface les proches), puis une averse trop blanche ; neige au sol trop blanche sous les lanternes (albédo 0,58 sur des pavés
  ≈ 0,25) → 0,36, en plaques ; éclair trop brumeux.
- Règles de rendu : passe principale seulement (`LAYER_NOREFLECT` : ni reflet ni ombre), après la passe opaque, test de profondeur sans
  écriture, `maskSafeBlending` (l'alpha de la scène, masque de protection du flou de profondeur, est gardé), **aucun `discard`** (l'alpha
  fait la couverture). `stats.weather` : paramètres, niveau d'éclair, gouttes dessinées.

### Mesures — [OK] compteurs ; [?] temps GPU à mesurer sur la 780M
- `stats` en 1920 × 1080, caméra B (A et D pour la pluie), SwiftShader : appels de dessin **107 → 108** (une précipitation = un appel) ;
  triangles 282 698 → 300 698 (pluie : 9 000 quads), 292 698 (neige : 5 000), 297 998 (orage : 7 650 gouttes). Surface couverte à l'écran,
  calculée avec les formules du shader : pluie 184 397 px en B, 188 227 en D, 219 245 en A (9 à 11 % des 2,07 M pixels, en traînées d'un
  pixel), orage 148 796, neige 59 245. Le shader de fragment n'éclaire rien (l'éclairage est fait aux sommets).
- **Pas de temps GPU ici** (pas de GPU) : estimation d'ordre de grandeur pour la 780M (passe de scène limitée par la bande passante de la
  cible HDR ×4, Passe 6) : ≈ 0,2 M fragments mélangés × 4 échantillons × 8 octets × lecture + écriture ≈ 13 Mo par image, ≈ 0,1-0,3 ms à
  mesurer. Les branches `uRain` / `uSnow` / `uCloud` à 0 : un test d'uniforme par fragment.
- À relancer sur la machine de l'opérateur : `node tools/perf.mjs --rounds=3 "clair|seed=1842&camera=B" "pluie|seed=1842&camera=B&rain=1"
  "neige|seed=1842&camera=B&snow=1" "orage|seed=1842&camera=B&storm=1"` (et en D, et à 2560 × 1440).

### Preuves
- Jeu par défaut (sans paramètre météo, les shaders modifiés compris) contre `main` figé (`3fe2bfe`), captures déterministes (graine 1842,
  `clean=1&freeze=7.3&vis=0`, 120 pas, 1280 × 720, SwiftShader), A / B / C / D : **0 px** ; témoin de répétition 0 px ; contrôle : pluie contre
  défaut, 64 à 90 % des pixels changés (pluie, pavés plus mouillés, brume, ciel couvert).
- Planches : `screenshots/calibration/w1-weather/{A,B,D}-clear-rain-snow-stormflash.png` (clair, pluie, neige, orage pendant un éclair) ;
  `B-rain-1280.png` à 1:1. Avec un paramètre météo, les PNJ d'une capture à graine ne sont plus au même endroit (les
  objets THREE de la météo tirent `Math.random` pour leur uuid) : sans conséquence hors du harnais.
- `tests/weather.test.mjs` (4) : lecture des paramètres (absents = rien, nu = 1, bornes, ce que l'orage apporte, valeur illisible) ; uniformes
  écrits et maillages instanciés ; éclairs graines (deux exécutions identiques), 3 à 12 en 40 s, retour exact de la lumière après l'éclair,
  valeur écrite pendant l'éclair gardée ; horloge figée sans éclair, `strike()`. **Fautes injectées une à une, toutes attrapées** (1 échec
  chacune) : météo créée sans paramètre, orage sans pluie, valeur écrite écrasée, lumière jamais restaurée, éclairs non graines, éclair au
  premier pas d'une horloge figée.

### Décision à demander à l'opérateur
- Faut-il une météo par défaut (et laquelle), ou un cycle (par exemple pluie fine aléatoire) ? Recommandation : garder le défaut sans météo
  (la nuit claire approuvée) et proposer `rain=0.5` comme variante d'ambiance à juger en jeu, après la mesure du coût GPU sur la 780M.

### Pensée
- Un quad construit dans le shader (une traînée orientée par sa vitesse à l'écran) n'a pas d'orientation fixe : double face, ou il disparaît
  dès que sa direction s'inverse ; un « rien à l'écran » se vérifie d'abord par le compteur d'appels de dessin, puis par un agrandissement.
- Un effet transparent se règle dans la bande de mise au point : ce que le flou de profondeur efface près de la caméra ne compte pas.

## Passe Q2 — Tests : les fonctions pures restées sans test depuis la Passe Q1 (2026-10-19)

### Demande
- Consigne d'autonomie (Passe T1) : « Si tu finis avant l'heure, continue sur « À reprendre » dans le périmètre du Merchant District. » ;
  « À reprendre » § 7, « Tests et CI — restes (Passe Q1) » : le rejet « images requises manquantes » de `loadProductionCast` non testé (il
  fallait lui passer une liste), `parseFrameCap`, `lerpState`, `needMask`, `bakeKey` sans test. Branche `claude/stoic-goodall-8ieke4` recréée
  depuis `main` (`dbff468`).

### Fait — [OK]
- `tests/frame-cap.test.mjs` (3) : toutes les formes de `?fps=` (off, max, n, v<k>, e<n>, a<n>), 15 formes refusées, `frameCapLabel` relit ce
  que `parseFrameCap` lit.
- `tests/visibility-mask.test.mjs` (4) : ordre des jeux (A B C D AB BC CD BD, écrit en dur), `needMask` (jeux qui montrent une pièce, Tier 3,
  géométrie non suivie partout, pixels de la passe derrière un occluder), `cfgMask` (cadrages et transitions à l'écran, transition
  interrompue, pas de jeu AC).
- `tests/bake-key.test.mjs` (3) : `bakeKey` avec un faux contexte GL (aucun navigateur) : même entrée = même clé (16 chiffres hex) ; le nom
  d'un maillage n'y entre pas ; **17 entrées changent chacune la clé, sans collision entre elles** (chaîne du GPU, quatre limites, nombre de
  pièces, cadre, niveau de l'eau, options, un champ de pose à 1e-12 près, le jeu d'une pose, le joueur d'une pose, l'ordre des poses, un
  maillage déplacé de 1 mm, un sommet de 1e-6, un maillage caché, la face d'un matériau) ; la passe derrière les occluders (sa scène, ses
  fenêtres).
- `tests/baked-cast.test.mjs` +1 : `loadProductionCast` prend une liste d'entrées (4e paramètre, la distribution par défaut : rien ne change au
  jeu) ; la feuille du docker telle quelle se charge ; sans son étiquette `walk-up` (PNG inchangé, empreinte juste) : refus « missing frames
  up/walk » ; une archétype qui demande `side/hammer` : refus.
- `tests/camera-graph.test.mjs` +1 : `lerpState` (bouts exacts, champs linéaires, le lacet par le plus court à travers ±π, dans les deux sens).
- **Fautes injectées une à une, toutes attrapées** : `v<k>` à plusieurs chiffres, passe derrière ignorée, transitions hors du masque, niveau
  de l'eau / joueur de la pose / face du matériau hors de la clé, images manquantes acceptées, lacet sans retour par +π, par −π. **[KO →
  corrigé]** la première version du test de `lerpState` ne passait que par −π : retirer la boucle `dy > π` ne la faisait pas échouer.
- **[KO → corrigé]** un second `load()` du même module en fin de fichier de test faisait échouer le fichier après ses tests (« invoke was
  called before connect », activité asynchrone du chargeur de Vite) : un seul chargement par module et par fichier.
- `npm test` 50 → 62 ; aucun code de jeu changé hors du paramètre ajouté (défaut = la liste de production).

### Pensée
- Un test de repli (±π, deux branches) s'écrit dans les deux sens : une faute injectée par branche le montre.
- Une clé de cache se teste par ce qui doit la changer, chacune de ses entrées, et par ce qui ne doit pas (un nom).

## Passe C1 — Foule : les cinq citadins préparés derrière `?crowd=<n>` (décision de mise en scène de l'opérateur) (2026-10-19)

### Demande
- « À reprendre » § 1, Mise en scène : « seuls 2 des 5 citadins (artisane, voyageur) paraissent à la graine 1842 et à la densité 1
  (`round(2 × densité)` promeneurs ; « remplacer seulement ») ». Consigne d'autonomie (Passe T1) : une décision de l'opérateur se prépare
  derrière un paramètre d'URL, sans changer le jeu par défaut. Branche `claude/stoic-goodall-8ieke4` recréée depuis `main` (`d7c6a62`).

### Fait — [OK]
- `ActorSystem.crowdCount` (`?crowd=<n>`, 0 à 12) : n promeneurs, les cinq citadins à tour de rôle (tous les cinq dès n = 5). Le tirage du
  type est fait dans tous les cas (`rng.pick`), puis ignoré avec le paramètre : les promeneurs communs aux deux restent où ils étaient, et
  avec n = 2 tout ce qui suit (le docker) aussi. Sans le paramètre : `round(2 × densité)` promeneurs tirés au sort, comme approuvé.
- `tests/crowd.test.mjs` (3) : effectifs approuvés (densité 1, 2, 0,2) et types tirés (valeurs de régression dans un district d'essai) ;
  `crowd=5` = les cinq types une fois ; mêmes positions que le défaut pour les promeneurs communs (graines 1842, 7719, 30417) et docker à la même
  place avec n = 2. **Fautes injectées, toutes attrapées** : tirage sauté avec le paramètre, paramètre ignoré, tourniquet aussi par défaut.
- Jeu par défaut contre `main` figé (`3fe2bfe` : son rendu par défaut est celui de `d7c6a62`, Passes W1 / Q2), captures déterministes avec
  personnages (graine 1842, `clean=1&freeze=7.3&vis=0`, **300 pas** : les promeneurs ont marché, 1280 × 720, SwiftShader), A / B / C / D :
  **0 px**. Planche `screenshots/calibration/c1-crowd/BD-default-vs-crowd5.png` (B puis D ; défaut à gauche, `crowd=5` à droite, même pas).

### Décision à demander à l'opérateur
- Combien de promeneurs par défaut, et faut-il les cinq citadins ? Recommandation : `crowd=5` (chaque citadin approuvé paraît une fois ; +3
  sprites, aucun appel de dessin de plus), à juger en jeu en B / D.

## Passe W2 — Météo changeable en cours de partie (panneau DEV), pour la revue de l'opérateur (2026-10-19)

### Pourquoi
- La météo de la Passe W1 ne se juge bien qu'en jeu et en mouvement (pluie qui tombe, vent, éclairs), sur la machine de l'opérateur ; sans
  moyen de la changer en jouant, chaque essai demande de recharger (bake compris). **Mon choix** : des curseurs dans le panneau, DEV seulement.
  Branche `claude/stoic-goodall-8ieke4` recréée depuis `main` (`c00ff7b`).

### Fait — [OK]
- `Weather.dispose()` rend les uniformes qu'il avait posés (mouillé, pluie, neige, ciel couvert, vent, brume, densité du brouillard : leurs
  valeurs d'avant lui) et la lumière d'un éclair en cours ; `App.setWeather(p)` retire l'ancienne météo et crée la nouvelle (aucune pour un
  temps calme) ; le démarrage passe par lui (sans paramètre : rien, comme avant).
- Panneau (touche H), section « Weather (proposal, DEV) », fermée, **DEV seulement** (absente du build de production) : pluie, neige, orage,
  vent, bouton « Lightning now » (0 occurrence de son titre dans le bundle de production, vérifié).
- `tests/weather.test.mjs` +1 : après une météo complète et un éclair en cours, `dispose` rend chaque uniforme à l'identique ; deux météos à la
  suite aussi. **Fautes injectées, attrapées** : `dispose` sans restauration, éclair en cours non rendu.
- Preuve en image (SwiftShader, B, graine 1842, même pas) : défaut, puis orage + pluie + neige + vent posés en cours de partie (98 % des pixels
  changent), puis retirés : **0 px** contre l'image d'avant. Jeu par défaut : le chemin de démarrage sans paramètre ne crée rien (Passe W1).

### Pensée
- Un effet réglable en cours de partie rend ce qu'il a pris : il garde les valeurs d'avant lui, et sa preuve est « activé puis retiré = 0 px ».

## Passe K2 — Caméras : le recul du joueur en cadrage D posé expliqué (analyse, aucun code) (2026-10-19)

### Constat (Passe K1, `camsim`, graine 1842)
- C → D : 10 images posées en D à −39 px/s ; D → C : 25 images posées à −15 px/s (le joueur recule à l'écran alors qu'il marche).

### Cause — [OK] mesurée image par image (journal `camsim` enregistré)
- Le joueur garde sa touche depuis C : elle reste dans le repère de C (règle voulue, `AGENTS.md`), donc en D il marche **en diagonale**
  (v = 2,17 / −1,25 m/s). Le pivot de D suit son x avec un gain de 0,85 (z presque bloqué) : 0,85 × 2,17 = 1,84 m/s le long de x, soit
  **1,73 m/s le long de la droite de la caméra** (lacet −20°), contre **1,61 m/s** pour le joueur, que sa composante en z ralentit à l'écran :
  il recule de 39 px/s. Même mécanisme dans l'autre sens (−15 px/s).
- En D, la touche pressée sous D (le joueur marche selon l'écran) : **0 image de recul** à tous les gains.

### Essais (`?camD=,,,,,,,,<gainX>`, paramètre de réglage existant ; aucun code changé)
| gain x de D | C → D (recul) | D → C (recul) | D vers l'est, NDC x du joueur |
|---|---|---|---|
| 0,85 (approuvé) | 16 images, −39 px/s | 31 images, −15 px/s | 0,33 .. 0,59 |
| 0,75 | 14, −24 | 0 | 0,34 .. 0,64 |
| 0,7 | 12, −17 | 0 | 0,34 .. 0,66 |
| 0,6 | **0** | **0** | 0,35 .. **0,71** |

- Contrepartie : un gain plus bas laisse le joueur filer plus à droite en D, déjà le point ouvert (a) d'« À reprendre » § 4.

### Décision à demander à l'opérateur (cadrage approuvé)
- Garder D tel quel (recul de 15-39 px/s seulement en marche diagonale venue de C), baisser son gain (0,6 : plus de recul, joueur plus à
  droite), ou suivre le joueur **le long de la droite de la caméra** plutôt qu'en x (un suivi « à l'écran » : jamais plus vite que lui
  à l'écran ; à prototyper derrière un paramètre et à prouver par `camsim` et le bake). Recommandation : prototyper le suivi à l'écran.

### Pensée
- Un recul à l'écran en cadrage posé vient de ce que le pivot suit (ici x, avec un gain) comparé à ce que le joueur montre à l'écran (sa
  vitesse le long de la droite de la caméra) : une marche en diagonale suffit à les inverser.

## Passe K3 — Caméras : recul en D posé, cause précisée ; [KO] le suivi le long des axes de la caméra (2026-10-19)

### Essai — [KO] (prototype retiré, rien de commité)
- La Passe K2 recommandait un suivi « à l'écran » : le pivot de D suit le joueur le long de la droite de la caméra et de l'axe de profondeur au
  sol, avec les mêmes gains et bornes, au lieu de x / z. Prototype derrière `?camfollow=screen`, `camsim` (graine 1842) : C → D **16 images de
  recul, −42 px/s** (au lieu de −39), D → C 38 images, −20 px/s (au lieu de −15) ; D vers l'est / l'ouest : 0, comme avant. Le recul reste :
  prototype retiré (`git checkout`).

### Cause, image par image — [OK] (reconstruction exacte : NDC recalculée = NDC de `camsim`, écart max 0,0000)
- Vitesse à l'écran décomposée : (joueur qui bouge, caméra figée) + (caméra qui bouge, joueur figé). C → D en D posé : **joueur +94 px/s,
  caméra −133 px/s, total −39** (mesuré −39). D → C : joueur −128 px/s, caméra +140, total +12 à +15.
- Le joueur, à NDC 0,42 (à droite du centre), marche aussi **en profondeur** (1,9 m/s en s'éloignant) : la perspective le ramène vers le
  centre et lui retire ≈ 39 px/s ; le pivot, qui suit 85 % de son déplacement latéral sans cette perte, le dépasse. Ce n'est pas l'axe du
  suivi (x / z ou celui de la caméra) qui compte, mais un gain assez bas pour couvrir la perte due à la profondeur : 0,6 le fait (Passe K2).
- Correction de la Passe K2 : sa cause (« le pivot suit x à 0,85 ») était incomplète ; c'est la combinaison gain × marche en profondeur à
  droite du centre.

### Décision à demander à l'opérateur (inchangée)
- Garder D, baisser son gain à 0,6 (`?camD=,,,,,,,,0.6` pour l'essayer : plus de recul, joueur plus à droite), ou un suivi qui vise la
  vitesse du joueur à l'écran (comme l'ancrage des transitions : plus de travail, à prouver par `camsim` et le bake).

### Pensée
- Avant de prototyper un correctif, décomposer la grandeur mesurée en ses causes (ici : part du joueur, part de la caméra) et vérifier la
  décomposition contre la mesure : une hypothèse plausible (l'axe du suivi) a coûté un essai inutile.

## À reprendre (par priorité)

> Élaguée le 18/10 (Passe M3) : seul le travail ouvert reste, regroupé par thème ; ce qui est fait vit dans sa passe. Les anciens repères
> (-3 … 6) cités par les passes antérieures renvoient à la liste de `7086340` (`git show 7086340:JOURNAL.md`).

**1. Distribution de personnages — décisions de l'opérateur, non traitées** (état de la distribution : `art-lab/characters/README.md`)
- **Variantes de PNJ** (demande de l'opérateur du 17/10, mot pour mot : « Par ailleurs a la suite de nos travaux de sprites NPC qui sont
  presque peuple partout sur le district Merchant, on creera par la suite des variantes de NPC avec couleur de cheveux et peau different pour
  amener plus de diversite au jeu »). Contraintes connues : la texture cuite garantissait 336 images et en porte 322 (dix feuilles,
  1024 × 2016 ; 672 garanties depuis la Passe T1) : une variante en feuille séparée ne rentre pas sans agrandir la texture ; la teinte aléatoire de la foule (± 10 % par canal
  sur tout le sprite) ne s'applique plus aux feuilles cuites (Passe 4A-tervicies). **Passes V1 / V2** : masques de matière, recoloration au
  rendu, approuvées pour la production le 18/10 (PNJ uniques en original). Passe V3 : trait rosé sous la bouche du voyageur et manches du forgeron
  (les « texels pâles à l'épaule ») corrigés dans les masques, approuvés le 18/10. Reste : les images de frappe du forgeron presque sans
  masque (invisible tant qu'il est fixé à son original). À arbitrer avec l'opérateur : quels personnages, combien de variantes,
  quelles teintes dans la direction artistique.
- **Mise en scène** : la marchande ne marche pas à son étal (collisionneur ; la déplacer de 0,5 m serait une décision de mise en scène) ; un
  second garde différent (miroir ou variante) au lieu de jumeaux, lances ; seuls 2 des 5 citadins (artisane, voyageur) paraissent à la
  graine 1842 et à la densité 1 (`round(2 × densité)` promeneurs ; « remplacer seulement ») : **`?crowd=<n>` préparé (Passe C1), les cinq dès
  n = 5, décision de l'opérateur**.
- **Mouvement** (Passe S2 : cadence réglée sur la vitesse vue à l'écran, pieds plantés pour la foule et les gardes ; Passe V3 : docker
  régularisé, glissement ≈ 0 en B / C / D) : restes des critiques du docker, communs à ses deux cycles : pas d'attaque du talon, botte de
  passage posée sur celle d'appui (image 4), poussée faible ; cycle 3 + 3 sans double appui (hérité du garde) ; en A, l'horloge touche son
  plancher pour un profil qui va presque en profondeur. Bras immobiles des citadins en marche : pas une priorité, décision de l'opérateur du
  18/10, mot pour mot : « les bras immobiles des citadins quand ils marchent n'est pas une priorites dans notre strucutre HD-2D, ce n'est pas problematique ».
- **Fidèles aux planches, non changés exprès** : bonnet / sac de la marchande selon la vue ; costumes des citadins différents selon la vue
  (tablier, sac, chemise).
- **Lisibilité** : tête du marteau cuit peu lisible sur la lueur de l'enclume (Passe 4A-vicies).
- **Restes mineurs** relevés par les critiques : sections « Restent » des passes 4A-tervicies et 4A-quatervicies.
- **Contrat et sources** : C2 (PNG versionné + JSON, `runtime-integration-contract.md` section 11) proposé le 16/10, appliqué par la
  distribution de production, sans confirmation explicite consignée : à faire confirmer. Originaux des planches de référence des PNJ (01-16,
  17-24, planche complémentaire) à retrouver (l'opérateur s'en charge ; ceux du casting 1 sont archivés, Passe H2) ; droits de tiers non
  vérifiés exhaustivement ; signatures C2PA lues, jamais validées (`c2patool` non installé).
- **Héros premium** (Passes H0 à H4) : casting 1 tranché par l'opérateur (design de la planche 1, pantalon foncé, planches archivées avec
  leurs PNG d'origine) ; planche v2 archivée, héros `hero-x2-v1` construit au stade lab puis écarté par l'opérateur (proportions, bras
  immobiles, cuisses trop hautes ; « experimental ») ; décision, mot pour mot : « Planche v3 (Recommandé) » ; prompt v3 prêt
  (`briefs/hero-proposal.md` § 5, trois pièces jointes) ; déclinaisons au choix du joueur : « Une base + couleurs (Recommandé) » (Passe H4) ;
  deux lots d'images évalués, non validés (brief § 11) ; planche de base archivée, `hero-x2-v2` construit au stade lab, candidat non
  approuvé (Passe H5) ; **en attente de la décision de l'opérateur** (production ou retouches). Texture cuite élargie
  (Passe T1 : 672 images garanties). Passe H6 : vitesse du héros cuit tirée de son cycle (3,73 m/s avec le rig préparé, Maj = sprint × 1,2),
  rig préparé (14 texels, vol, genoux à 5 texels) : **export à reconstruire avec Aseprite sur la machine de l'opérateur**. Vues de
  trois-quarts : étude `briefs/three-quarter-views.md`, décision de l'opérateur (aucun trois-quarts dos sur la planche). Plus tard : masques du héros pour ses
  déclinaisons, écran de choix (code de jeu). Le reste des planches du casting : propositions non canoniques, design à valider avant toute
  production.
- **Personnages clés et suite de l'art** : héros et chat restent générés (densité ×1) ; ni personnage clé ni personnage **original** au
  même niveau ; E4 non lancée. Avant d'étendre : densité du cast (héros), liseré dépendant de la densité (liseré par sprite non implémenté),
  largeurs de texel inégales à ≈ 2 px / texel, cycle de marche en A. Décision ouverte : quelles planches étaient réellement rejetées (la
  consigne de 4A en parlait sans les montrer ; les trois planches archivées sont toutes classées comme références). Le modelé ×1,5 n'est
  plus la voie principale (Passes 4A-quater / quinquies).
- **Point de QA (pas une tâche)** : PNJ ×2 près de 1 px écran / texel (caméra A, PNJ lointains) : détails d'un texel qui clignotent ;
  surveiller à chaque nouveau PNJ. Mesuré en Passe S2 (graine 1842) : distribution ×2 à 0,35-0,78 px / texel en A, 0,65-1,68 en B, 0,97-2,02
  en C, 1,15-1,29 en D ; héros ×1 à 1,6 / 3,0 / 3,3 / 2,9.

**2. Occlusion du joueur (Passes 3 / 3b)**
- Un montant sombre de la bannière du bateau n'est pas découpé par le reveal et coupe le joueur ; la casquette tombe dans la bande tramée ;
  la trame « rampe » quand l'ellipse bouge. Ne rien changer sans inventaire visuel et technique (`tools/occ-inventory.mjs`) qui justifie un
  nouvel occluder.
- Relecture humaine en mouvement (style C, rayons 40–70 / 80–120 px, fondu 0,2 / 0,3 s) ; décider si les PNJ d'interaction doivent entrer
  dans le reveal ; chercher un cas où la passe « derrière » restaure vraiment des pièces (sinon envisager de la couper pour gagner ≈ 90 ms
  de bake) ; rejouer l'inventaire à chaque changement de zones de caméra ou de composition (bateau, lampadaires).

**3. `SpriteRenderer`** (Passe S1 : superposition retirée, masque de protection propre, auréole mesurée en mouvement ; Passe S1b : une seule
profondeur par sprite, le décor derrière un personnage ne le coupe plus ; l'enseigne devant le forgeron est voulue, opérateur, Passe H0) —
restent des décisions d'image : le bord des feuilles cuites ×2 (frange bleutée sur le contour d'auteur ; décision du 18/10 : contour d'auteur gardé, à faire au point 2) ;
la lisibilité du forgeron dans l'in-scatter de la forge (part des personnages 45 %, `known-issues/forge-smith-inscatter-C.png`) ; un halo placé
devant un personnage s'applique désormais entièrement (B : héros sous la lanterne, plus clair au visage).

**4. Zones de caméra** — validées par simulation (Passe 4B, `tools/camsim.mjs`), pas par de vrais joueurs : (a) D place toujours le joueur
**à droite** du centre (NDC +0,35 → +0,68), contrepartie de la continuité avec C ; (b) le long du bord de l'eau (z > 2,4) on passe **B → D**
sans traverser C ; (c) lacet max 0,96° / image en C ↔ D (≤ 0,55° ailleurs) ; (d) les transitions B → C vers l'ouest (−254 px/s) et B → A
(−131 px/s) font glisser le joueur à l'envers à l'écran (héritage de la passe 2, mesuré en 4B ; Passe K1 : B → A remesuré −139 px/s, C → B
0 ; **transitions ancrées partout préparées derrière `?camblend=anchored`** : B → A 0 image de recul au lieu de 14, pic +21 px/s au lieu de +181 ;
décision de l'opérateur ; le reste demanderait de recaler le pivot de A) ; (e) reculs du joueur à l'écran en cadrage posé C / D (−15 à
−39 px/s, Passe K1) : expliqués en Passes K2 / K3 (le pivot de D, qui suit 85 % du déplacement latéral, dépasse un joueur que sa marche en profondeur
ralentit à l'écran ; le suivi le long des axes de la caméra n'y change rien) ; gain 0,6 ou suivi visant la vitesse à l'écran : décision de
l'opérateur. Contrainte : la caméra de D reste
à z < ~18,5 (maisons de la rive opposée dès z = 19,8, invisibles de A/B/C) ; tout cadrage plus reculé exige de les retirer ou de les abaisser.

**5. Visibilité / culling**
- **Décisions de l'opérateur (Passe 5b)** : D ×4 (+75 ms de bake), poses AB à w = 0,5 pour la maison 609, corrections de géométrie
  (fissures, quai coplanaire) qui seules rendraient `viewport-proof` vert.
- **Écarts connus de `viewport-proof`** (9 échecs, tous expliqués en Passe 5b) : fissures MSAA (7719 C, 30417 CD 720p, 1 px de 1842 D
  2560 × 1080), lanières non attrapées à ×2 (30417 D 720p / 665 × 1200 : partie 73 ; 1842 D 2560 × 1080 ; 7719 AB 665 × 1200), maison 609
  (30417 AB). Pixels « order » (30417 B 109 px, AB 31 px, A / BC 1 px en 720p) rapportés sans échouer. Tout nouvel écart :
  `tools/vis-why.mjs` avant de toucher au bake.
- **Écart hérité [?]** : 17 px d'étincelle dans le canal coupés par le bake (B, joueur 15,5 ; −2,7), `known-issues/pass2-vis-speck.png` ;
  Passe 5b (1842, 720p) : 6 px aujourd'hui ; 6 lanières forcées (reflets de maisons de la ville moyenne, murs est de `bg2` / `tall`) → 1 px,
  non élucidé.
- **Coût d'un bake neuf** : le cache (P5, Passe 6d) relit un bake en 36 ms au lieu de 337 ; un bake neuf reste ≈ 300 ms par pages (Passe 5,
  273 poses), génération ≈ 910 ms. Piste : n'échantillonner que les poses concernées quand seul un réglage de caméra change ; réduire CD / BD
  (168 poses sur 273) a coûté 4 pièces de Tier 3 en précision : seulement avec une preuve.
- **Ordre des classes de dessin** : 41 classes, A/B/C pondérés ×2 (D dessine ≈ tout : 98,8 k / 100,8 k). Si D s'alourdit (nouveau
  contenu), rejouer `planDraw` avec un autre poids ou séparer D dans un mesh à part (+ appels de dessin).

**6. Performances GPU (Passes 6 à 6k, plan P0-P9 terminé, tout accepté et fusionné)** — Restent [?] : la cause du ralentissement des
rappels rAF de la passe 6j (ni charge CPU ni charge GPU ; hypothèse : rafraîchissement dynamique de l'écran ou du pilote) ; une lecture de
vsync trop **basse** n'est pas corrigée par le contrôle en session (jamais observée). Non mesuré : autres navigateurs / GPU, cache de
shaders d'un profil persistant, 780M sans contention (fenêtre calme, témoin à l'appui). Écartés (mesurés, Passe 6) : pré-passage de
profondeur (≤ 0,75 ms en 1080p avant son propre coût), filtre de l'ombre de lune (≤ 4 %) ; FXAA, qui flouterait le pixel-art sans masque des
sprites.

**6b. Météo (Passes W1 / W2)** — pluie, neige, orage, vent derrière `?rain` / `?snow` / `?storm` / `?wind`, défaut inchangé (0 px), réglables
en jouant dans le panneau DEV (section « Weather »). Restent : le
temps GPU sur la 780M (`tools/perf.mjs`, commandes dans la passe), le jugement de l'opérateur en jeu et en mouvement (vent sur les bannières,
pluie qui tombe, éclairs), une éventuelle météo par défaut ou un cycle (décision de l'opérateur) ; non faits : éclair dessiné dans le ciel,
son (le jeu n'en a pas), éclaboussures au sol, neige sur les personnages.

**7. Outillage, documentation, dette**
- **Port 5173** partagé avec un autre projet local et `vite.config.ts` sans `strictPort` : les outils peuvent photographier la mauvaise
  appli. Servir les baselines sur `:518x --strictPort` ; décider avec l'opérateur s'il faut changer le défaut (outillage, pas runtime).
- **Tests et CI — restes (Passe Q1)** : le libellé `ubuntu-latest` passe à Ubuntu 26 dès le 19/10 (épingler `ubuntu-24.04` = décision de
  l'opérateur) ; les tests ne sont pas typés (`.mjs`, hors `tsconfig`). Fonctions pures et refus « images manquantes » : testés (Passe Q2).
- **Code mort mineur** (Passe M5) : des `void x;` qui taisent des paramètres, des types exportés sans usage hors de leur fichier.
- **Archivage du journal** (Passe M4) : le critère « operator decision recorded, branch merged » d'`AGENTS.md` date d'avant la fusion
  sans demande ; lire « branche fusionnée » suffit, à confirmer par l'opérateur. Dernier archivage : V0-V3 (Passe T1) ; prochain au-delà
  d'environ 60 Ko de passes gardées (H1 et suivantes).
- **Dette** : l'ancienne rive opposée (`row(...)` en « sec ») rejoue ses tirages sans rien dessiner — à retirer proprement une fois qu'on
  accepte de décaler la ville lointaine d'une graine.

## Principes à garder

> Dédoublonnés et regroupés le 18/10 (Passe M3 ; liste précédente : `git show 7086340:JOURNAL.md`). Ce qu'`AGENTS.md` dit déjà n'est pas
> recopié ici.

### Mesure et performances
- Mesurer d'abord, optimiser ensuite : minuteurs GPU, variantes entrelacées dans une seule session, base figée. Relever l'adaptateur
  réellement utilisé (`WEBGL_debug_renderer_info`) dans chaque mesure : un portable hybride rend sur l'iGPU par défaut, quoi que demande
  `powerPreference`. Mesurer à la définition de l'écran de l'opérateur (dpr compris), pas seulement en 1080p.
- Un temps GPU pris sur un poste partagé ne vaut qu'avec son témoin de contention (autres processus sur le même adaptateur) ; à défaut, le
  minimum des tours entrelacés est l'estimation sans contention. La traîne du temps d'image en headless n'est pas une mesure.
- Une première fois (programme, variante, dessin) se mesure par une sonde dédiée : aucune moyenne ne la voit. Un intervalle rAF ne
  s'attribue qu'avec un repère (le départ de la boucle, un `gl.finish()` chronométré) : le plus grand intervalle depuis le chargement est le
  plus long bloc synchrone, pas forcément la première image.
- Un travail de démarrage déplacé dans un Worker reste une fonction pure à graine fixe ; il se prouve à l'octet (empreinte de chaque sortie,
  ordre de création des objets qui tirent `Math.random`) et par ses pannes injectées ; le jeu démarre sans Worker (repli par job, chien de
  garde). Une sonde de démarrage observe dès le premier repère, pas depuis `DOMContentLoaded`.
- Une cadence se mesure dans une vraie fenêtre avec vsync (`tools/cadence.mjs`), une « surcharge » en watts (RAPL, SoC = boîtier − cœurs),
  pas en % d'occupation GPU. La vsync se sonde au repos (les rappels que le plafond saute) : la médiane ou le minimum des horodatages rAF de
  la boucle ne la retrouvent pas, leur grille (le plus grand intervalle dont ils sont tous multiples) si ; une grandeur qui peut changer
  pendant la session (le rythme des rappels de Chrome) se revérifie pendant la session, avec des échantillons qu'elle ne fausse pas (passe 6k).
- La cadence préfère la régularité au nombre d'images (choix de l'opérateur, `e60` puis `a60`) : quand le GPU ne tient plus son créneau, un
  pas plus long et régulier plutôt qu'un mélange ; le retour au pas court se vérifie par un essai.
- Une passe plein écran se paie d'abord en bande passante : réduire ses échantillons sans retirer la passe ne gagne rien sur une iGPU ; un
  effet « en demi-résolution » ne paie que si sa recomposition tient dans une passe qui existe déjà (passe 6j).
- Un nombre écrit par un script pour un autre programme s'écrit dans la culture invariante, et en entier quand c'est un compteur ; un
  lecteur qui reçoit l'illisible le dit (passe 6i).
- Un résultat calculé mis en cache se relit seulement pour les mêmes entrées exactes : la clé couvre tout ce qu'il lit (géométrie, poses,
  réglages, code du calcul, GPU) ; une entrée douteuse est un échec de cache, jamais un culling.
- Une allocation, un plafond matériel ou une texture partagée se dimensionne contre le minimum **garanti** par la norme (WebGL2 : 2 048),
  jamais la valeur de la machine de développement, et se vérifie (complétude du framebuffer, erreurs GL) ; une texture partagée se
  dimensionne pour la distribution entière, candidats compris, avant de les ajouter (l'adressage par case entière permet d'élargir sans
  changer une image).

### Visibilité, rendu, caméras
- Toute coupe de géométrie se prouve par un diff d'images `static=1`, culling actif contre `vis=0`, avec `occ=0` : la phase du fondu de
  reveal entre deux régénérations fabrique de faux écarts (1 377 px sur B).
- La rastérisation dépend de la position d'une tuile dans sa cible : les comptes bruts ne se comparent qu'à mise en page égale ; la
  non-régression se prouve sur les masques et les images finales.
- Un écart élagué / `vis=0` s'explique **causalement** (`tools/vis-why.mjs` : pièce forcée → 0 px ; témoin d'ordre) avant de toucher au bake ;
  un pixel décidé par l'ordre de dessin (faces coplanaires) ou par un seul échantillon MSAA (fissure) ne dit rien du culling.
- Le bake échantillonne des points : monter sa résolution fait aussi perdre des pièces ; un supplément s'ajoute aux comptes (tuiles fines
  additives) et va là où la géométrie se présente de chant (D). Toute modification des masques replanifie les classes : prouver le rendu
  canonique contre une base figée, pas seulement contre `vis=0`.
- Le besoin d'une pièce se mesure **par jeu de poses** (stables et mélanges séparés) ; mélanger les deux fait dessiner en C stable ce que seul
  un mélange voit. Pondérer les cadrages historiques pour qu'un nouveau cadrage ne les alourdisse pas.
- Ne pas ajouter de contenu pour combler le vide ; dépenser la complexité là où la caméra la perçoit.
- Garder le déterminisme par graine : toute suppression de code doit préserver les tirages aléatoires.
- Un `discard` ne se paie que là où il sert : variante de matériau liée seulement pendant l'effet, sinon le matériau de slot d'origine ;
  « au repos » doit coûter exactement la passe précédente (mêmes appels de dessin, image pixel-identique).
- Ne taguer que ce que l'inventaire mesure (rayons caméra → joueur contre les vrais triangles), jamais ce que l'intuition suggère.
- Le DOF et le masque de protection (alpha de scène) sont des contrats : un effet qui écrit de l'alpha ne doit pas toucher ce canal. Tout ce
  qui est dessiné après la passe opaque garde l'alpha de destination (`maskSafeBlending`) : un canal-contrat se protège à l'écriture, pas en le
  réparant après coup ; un mode de mélange de bibliothèque se lit dans son code (prémultiplié ou non) avant d'être réécrit (Passe S1).
- Un échantillonnage « au plus proche » du matériel ne se rejoue pas par une formule : on retrouve le texel par sa valeur (Passe S1).
- Un nouveau cadrage se cherche **empiriquement** (`tools/camsearch.mjs`) et se valide en **marchant** (`tools/camsim.mjs`) : la vitesse du
  joueur à l'écran pendant la transition ne doit jamais changer de signe par rapport à sa marche ; une transition interpolée entre deux
  cadrages hérite de l'écart de position écran des deux, d'où l'ancrage (`blendPose`) + un cadrage cible calé sur la sortie du cadrage
  précédent.
- Une caméra qui recule traverse la géométrie qui est « derrière la caméra » des autres cadrages : vérifier z caméra contre ce qui est généré
  de ce côté (rive opposée).

### Preuves
- Une preuve doit pouvoir échouer : un contrôle négatif avant d'accepter « 0 écart » (Lab : `filter=linear` ; revue d'agent : un défaut
  planté qu'elle doit trouver à l'aveugle ; « 0 trou » : remplissage depuis le bord ; mesure de stabilité en mouvement : un cas connu
  mauvais qu'elle doit séparer, sinon elle ne vaut que comme indice et le jugement reste visuel). Un résultat « 0 » d'un outil se recoupe
  avec une valeur connue avant d'être cru. Un test unitaire aussi : des fautes injectées une à une, chacune attrapée ; son oracle est
  indépendant du code testé (pas d'aller-retour par lui) et ses données exercent les cas limites (égalités, bords), vérifiés par le test même
  (Passe Q1).
- Une preuve « pixel-identique » exige une capture déterministe : `Math.random` à graine, pas fixes, horloge figée, RNG internes remis à
  zéro, une chauffe par cadrage **et par origine** (serveur), et un témoin de répétition (deux chargements : 0 px) **avant** toute
  comparaison ; un écart d'un niveau sur 255 se traque par sondes de variantes du shader. Avec des personnages, la boucle du jeu ne doit
  jamais tourner hors du harnais (`App.start` neutralisé dès le chargement, Passe M5).
- Pendant une série de mesures ou de captures sur un serveur de développement, ne rien modifier ni reconstruire de ce qu'il sert (`src/`
  compris : rechargement HMR) ; recadrer une preuve par projection, jamais par supposition ; un masquage d'acteur se vérifie (base masquée
  contre base non masquée) : avec la distribution cuite, un acteur porte l'id de sa planche.
- Une auréole se mesure : ce que le post-traitement fait changer autour d'une silhouette, personnage présent / absent, image par image en
  mouvement, puis effet par effet (`tools/sprite-halo.mjs`, Passe S1).
- Une échelle écran se dérive du code caméra du jeu à la position réelle du joueur (`evalAnchor` + `applyPose`), jamais de la distance de
  pivot d'un cadrage.
- Ajouter des sprites ne doit rien changer aux autres : une texture qui ne grandit jamais pour les sprites validés, et pour les nouveaux un
  adressage par case entière (t ∈ [0, 1] × taille de case, plancher + clamp, lecture au centre du texel) qui ne dépend ni de la taille de
  l'atlas ni de la place de la case. Des octets identiques ne garantissent pas une image identique : `floor(vUv × taille)` départage les
  égalités exactes (bord de texel au centre d'un pixel) selon la taille de la texture, et une formule normalisée par la taille de la texture
  ne peut pas y être stable. Toute croissance d'atlas se prouve par un balayage d'échelles, pas par quelques captures.
- Plusieurs densités de sprites partagent un seul renderer si chaque densité *k* garde le même rectangle monde (cadre 32k × 48k, pieds à 45k) :
  la densité est une affaire d'atlas, la hauteur une affaire d'instance.

### Personnages : art et critique
- Un personnage se juge **dans la scène** à chaque itération (aperçu `?labsprite`, avant / après au même endroit) et **à côté du cast
  existant** (héros compris : densité de texel, proportions et hauteur monde à la même profondeur), pas seulement agrandi ni contre la
  référence : lumière chaude, liseré et voisinage du cast changent la lecture.
- Une critique d'art voit l'image, lit à froid avant la consigne, cite des pixels et vérifie la passe précédente ; le score monte avec des
  preuves, pas avec des intentions. Critique à l'aveugle = étiquettes tirées au sort, clé hors du champ du critique, nouvel agent à chaque
  tour, auto-critique écrite **avant** de lire le verdict. Toute correction ou reprise (de rig comprise, comptée contre la planche
  précédente) repasse une critique à l'aveugle par un agent neuf : elle crée ses propres pertes ; une retouche qui ne gagne pas clairement à
  l'aveugle est annulée, pas empilée.
- Une métrique de propreté (pixels isolés, alternances) n'est pas une métrique de forme : seule une critique aveugle juge la lecture du volume.
- Le classement des références (cible / support / rejet) se fait **confirmer par l'opérateur avant de produire** ; on mesure une référence
  (grille, taille, couleurs) avant d'en déduire une contrainte de résolution ou de technique.
- Avant une génération, comparer le brief lui-même aux personnages des références qui seront jointes : une combinaison de traits peut
  déjà décrire un personnage existant ; la liste de contrôle d'originalité nomme ces personnages.
- Un modelé se peint par **masses** (3-4 valeurs par forme, plis rendus par le bord des aplats) ; une spécification pixel par pixel écrite en
  texte donne de la moucheture (alternances) ou des blocs. La forme vient d'abord de l'information de la source (densité, dégradés peints) :
  préserver sa qualité, puis une finition ciblée ; la finition par agent est fiable pour les défauts **nommés et localisés**, pas pour
  repeindre un volume.
- Les contraintes de l'asset reconstruit (cadre 64 × 96, pieds rangée 90, anneau transparent, alpha binaire) ne s'imposent pas à
  l'illustration source : on ne dégrade jamais le modelé, l'expression ou les matières d'une source pour obtenir une grille parfaite ; la
  mesure de la source règle la reconstruction, elle ne la refuse pas.
- Une hauteur de présentation se décide sur la figure **dessinée** (mesurée dans l'atlas), pas sur une valeur nominale du code ; une carrure
  ne se corrige pas par l'échelle : les proportions se chiffrent dans le prompt et se mesurent sur la source avant toute reconstruction.
- Un personnage plus grand que le cadre se rééchantillonne à un pas plus grossier et se présente à l'échelle commune : une densité de texel
  unique dans la scène prime sur la taille relative de la planche (écart chiffré et consigné).
- Les vues qu'il faut à une marche (face, dos, profil) se prennent sur une planche multi-vues de la même échelle, jamais inventées depuis une
  seule face ; la recette entière (recadrages, palette, retouches, animation) vit dans un script de rig rejouable au texel près.
- Une famille de personnages se produit par gabarit, mais chaque vue se mesure avant : sens du profil contre la planche (avant tout miroir),
  rangée basse de chaque jambe (l'ombre du sol de la planche décale toute une vue), boîte de la seule matière pour une gamme peinte (filtrée
  par sa teinte), boîte de la pièce pour une botte.
- Après toute reconstruction, chercher les bandes quasi noires de la fermeture verticale entre deux masses (nuque / épaules, entre les jambes)
  et les comparer à la planche, pas à la reconstruction : elles se lisent comme des cheveux ou des sangles qui n'existent pas. Remède retenu
  (4A-unvicies) : `reconstruct-grid --closing-from=48` : pas de fermeture au-dessus de la taille, gardée en dessous (elle y restaure les
  contours sombres des jambes et des bottes ; la couper partout les a perdus) ; compter avant / après le fond enclavé et les zones des pieds.
- Retouche ciblée : changer la **chroma** d'une zone fautive en gardant ses valeurs corrige sans repeindre ; ajouter une masse sombre crée un
  nouveau motif (ras-de-cou).
- La copie assombrie d'une pièce lointaine (botte, jambe) garde un plancher de clarté (jamais sous sa propre clarté ni sous un seuil) :
  une soustraction constante écrase les tons sombres au noir du contour. Deux pièces de même forme se séparent d'abord par la profondeur
  (la lointaine plus haut à l'écran) puis par la valeur, et une pièce déplacée se borne à ce qui la cache.
- Une pièce animée emporte son contour (une colonne de contour à deux texels de la peau, une rangée basse rangée dans un autre calque) ; ce
  qu'elle découvre prend ce qui est derrière elle dans le sens du mouvement (au-dessus pour ce qui descend, en dessous pour ce qui monte),
  jamais une couleur prise de côté hors de portée.
- Un mouvement destiné à se lire en jeu se dimensionne en pixels écran (2 texels à ~1,8 px / texel), pas en texels de la planche, et se fixe
  explicitement (rebond imposé de 2 rangées au contact) : il ne se déduit pas seulement de l'IK ; une affirmation de critique se mesure
  (rangées, texels) avant d'être corrigée.
- Une marche capturée se fait à **pas fixe** avec les **vraies entrées**, sur un itinéraire d'abord validé sans rendu (`camsim`) ; chaque
  image se rend avant d'être capturée ; un témoin (même art, autre densité, **même renderer**) sur le même trajet est la seule référence qui
  donne un sens aux chiffres de stabilité.
- La vue d'un personnage qui marche se tire de son pas projeté à l'écran (avec hystérésis), pas de l'angle de son cap avec l'axe de la
  caméra : sous un tangage de 8°, 20° de cap font déjà ~55° à l'écran. Un regard mis en scène (spawn, conversation) garde la règle monde.
- La cadence d'une marche cuite suit la vitesse que montrent ses pas : de profil, la vitesse le long de l'axe droit de la caméra (le seul
  axe où le sprite montre le glissement du pied), de face ou de dos la vitesse entière, sur la vitesse que dessine le cycle à l'échelle du
  cadrage ; un glissement se mesure dans cet axe, en mouvement (`tools/foot-slip.mjs`, Passe S2).
- Un personnage qui agit sur un objet (frappe, geste) regarde l'objet : son orientation se calcule depuis la géométrie (vecteur personnage →
  point d'action), jamais un angle choisi pour l'apparence ; un cycle qui n'existe que de profil en tire son côté écran dans tout cadrage.
- Un cycle synchronisé avec un effet (étincelles du marteau) garde son nombre d'images et l'image de l'impact ; le moteur n'a pas de durée
  par image.
- Un cycle cuit se règle sur la mesure du moteur (`walkSlide` : centre des appuis sur la rangée des pieds) : botte de contact à plat, pied
  arrière qui quitte la rangée au décollement ; une inclinaison ou une pointe qui traîne rendent le cycle irrégulier (Passe V3).
- Une mesure qu'avance un critique (dérive, rangées, texels) se vérifie sur les pixels de sa propre planche avant de peser son verdict ; une
  planche de critique reproduit l'avance réelle du jeu et se lit à 1:1 ; un désaccord qui persiste revient à l'opérateur, image en mouvement à
  l'appui (Passe V3).
- Une planche source se mesure contre la distribution avant toute construction (tête sur hauteur, largeur du visage, jambes, même lecture),
  et une « course » générée se vérifie contre les vues de repos (même échelle, même buste) avant d'être prise pour un cycle (Passe H3).
- Un membre ne s'anime que s'il est séparable dans la vue (bras détaché du buste : à demander à la source) ; une texture peinte chargée se
  fragmente une fois tournée, des membres peints dans les teintes de la vue restent lisibles (Passe H3).
- Le balancement d'un bras de profil se lit sur le bras proche, images alignées sur la tête (en course, un poing est toujours devant) ; une
  planche de casting choisit une direction, une source se juge à la taille de ses figures contre les 85 rangées du sprite (Passe H4).
- Une course dessinée en poses extrêmes se complète par cisaillement des jambes depuis la hanche, pied à plat ; le halo du fond d'une
  planche se mesure sur le contour et se retire au rig avant la critique (Passe H5).
- Un masque de matière se vérifie contre la planche de référence : des texels « oubliés » peuvent être la bonne matière et la zone autour la
  fausse (manches du forgeron, Passe V3) ; une ombre que les règles ne prennent pas se relève à la main (rectangle forcé), pas par une règle
  générale.

### Provenance et approbations
- Rien d'externe ne devient « canon » en silence : un manifeste de provenance (`art-lab/characters/manifests`) avec approbation nommée et
  datée est la seule voie vers `runtimeUse: production`. Deux niveaux d'approbation distincts : *approved visual baseline*
  (`approved: true` + `runtimeUse: "lab"`) et *approved production asset* (`runtimeUse: "production"`, tâche explicite + droits confirmés).
  Une approbation de production ne s'écrit jamais au nom de l'opérateur : l'intégration se prépare derrière la porte du manifeste et
  l'opérateur l'ouvre. Une source aux droits non confirmés s'archive par empreinte, jamais par copie dans Git.
- Une approbation visuelle se fige tout de suite : empreintes SHA-256, paramètres, décisions datées, script de vérification ; un artefact
  approuvé ne vit pas seulement dans un dossier ignoré sans que l'opérateur le sache.
- La révision d'un asset approuvé se projette sur sa palette approuvée, épinglée en fichier (aucune couleur nouvelle), et s'inscrit à côté de
  l'approbation (demande citée, empreinte précédente, comptes de texels) ; la confirmation de l'opérateur se demande, elle ne se présume pas.
- Une provenance confirmée par l'opérateur se consigne **mot pour mot et datée**, distincte d'une vérification technique (C2PA) ; ce qui
  manque ne se déduit pas. L'absence d'original n'interdit pas à elle seule la production : droits et autorisation s'évaluent à part. Un
  statut remplacé se garde dans un historique, jamais effacé.
- Une image qui sert de référence se garde **dans son fichier d'origine** (PNG téléchargé, manifeste C2PA intact) dès le premier jour : une
  copie collée en séance est transcodée et perd toute provenance. Une correspondance visuelle se chiffre contre des témoins (elle-même = 0,
  planche sœur = 23) avant d'être affirmée ou exclue ; le numéro d'un fichier téléchargé ne dit pas quelle planche c'est (Passe H2).
- Un lecteur de métadonnées écrit pour l'occasion (C2PA) se valide d'abord sur un fichier aux valeurs déjà consignées ; une liaison dure
  recalculée prouve l'intégrité des octets liés au manifeste, pas la signature (Passe H2).
- Une source archivée se versionne **à l'octet** (empreinte et `cmp` avant commit, attribut binaire) avec une fiche : nature (copie ou
  original), provenance déclarée, droits, dérivés et commande de reconstruction ; jamais de faux original ni de métadonnée fabriquée ;
  `art:validate` revérifie ses octets contre la fiche à chaque passage, contrôle négatif à l'appui.
- Un outil figé par empreinte dans un paquet approuvé s'étend par options désactivées par défaut, prouvées par le `--rebuild` du paquet ;
  l'empreinte se met alors à jour avec une note de maintenance (ancienne valeur gardée).

### Outillage, documentation, processus
- Un outil externe de production d'art (Aseprite et son agent) n'étant jamais une dépendance (`AGENTS.md`), une passe d'outillage se prouve
  par un bundle `dist` identique au SHA-256 et 0 px de différence sur les quatre cadrages. Il s'installe épinglé (version exacte, tag,
  auto-update coupé), en portée locale, après lecture de son code d'installation et un dry-run ; jamais avec l'installeur « tout-en-un »
  d'amont s'il écrit hors de cette portée. Pour toute passe d'art : pont persistant, Aseprite relancé après lui, test de fumée
  `smoke-test/4a0b/` après toute mise à jour (`art-lab/README.md`).
- Ne jamais écrire « validé » pour un logiciel qu'on n'a pas exécuté : `art:doctor` affiche l'état réel (`NOT INSTALLED` est un état
  valide) ; « validé » appartient à un test de bout en bout (4A-0B).
- Le chargement des instructions d'agent se mesure (`/context` dans une session neuve) : jamais de `CLAUDE.md` dans un dossier parent d'un
  projet qui vit de son `AGENTS.md`.
- Un statut de README se réécrit à l'état courant, daté, avec un renvoi au journal pour l'historique ; « À reprendre » ne garde que l'ouvert :
  ce qui est fait en sort à la clôture de sa passe (Passe M3). De même pour les images : les références (`screenshots/calibration/`) se
  refont à chaque changement visible du jeu, les preuves des passes closes vivent dans l'historique git (Passe M5).
- Une autorisation de suppression vaut pour la liste et la taille annoncées ; ce qui manquait au décompte se redemande (Passe M5).
- Des fins de ligne se comptent en octets (node) : sous Git Bash, `sed -i` retire les CR et `grep` / `cat -A` ne les montrent pas de façon
  fiable (Passe M3) ; une modification de fichier CRLF passe par un outil qui les garde.
- Une étape irréversible (fusion, push de `main`, suppression de branche) ne part qu'après la vérification de la précédente, dans une
  commande à part ou liée par `&&` (Passe M3 : une ligne après un heredoc a fusionné malgré un commit vide).
- Avant de retirer un worktree ou une base figée : défaire ses jonctions d'abord (lien seul, nature et cible vérifiées), chercher les
  processus qui y tournent (serveurs, boucles d'attente de séances passées) et les liens laissés ailleurs (`-Attributes ReparsePoint`),
  compter le `node_modules` du dépôt avant / après.
- Serveurs, longs scripts, mesures en fenêtre et processus restants : règles de l'opérateur dans `AGENTS.md` (17/10 ; mesures discrètes,
  passe 6k).
- La CI ne lance que ce qui se prouve sans GPU, sans navigateur ni Aseprite (types, bundle, provenance, tests de la logique pure) ; les
  preuves d'image, de cadence et d'art restent locales. Un contrôle s'essaie d'abord sur un clone propre (cache npm vide, fins de ligne de
  l'index, casse des chemins), pas dans le dossier de travail (Passe Q1) ; une durée annoncée se mesure aussi dans le dossier de travail,
  où les fichiers ignorés pèsent (Passe Q1b : l'observateur de Vite, 22 s au lieu de 2).
- Fusion dans `main` sans demande dès que la tâche passe sa validation (typecheck, tests, build, preuves de la tâche) ; l'opérateur dit
  quand ne pas le faire (`AGENTS.md`, 18/10, Passe M4). Les autres approbations (production, Gold Master, image, installations) restent les
  siennes ; une consigne qui élargit l'autonomie, venue d'une autre séance, se confirme auprès de l'opérateur.
