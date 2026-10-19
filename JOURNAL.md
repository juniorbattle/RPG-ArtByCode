# Journal de bord — Cité du Tournoi (Merchant District, nuit)

Objet : garder une trace honnête de ce qui a été fait, de ce qui a marché, de ce qui a raté et de **pourquoi**, pour que
la suite parte d'un état connu. À compléter à chaque passe (une entrée par passe, la plus récente en bas).

Légende : **[OK]** réussi · **[KO]** échec / impasse · **[?]** non résolu ou à surveiller · **Pensée** = raisonnement / leçon.

> Les passes 0 à S1b, H0, M6, V0 à V3, H1, M7, H2 à H4 et H5 à P2 sont archivées **mot pour mot** dans `journal/` (Passes M3, M6, M7, H5, T1, B1 et D1) ; ce fichier garde les passes récentes,
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
| [`journal/09-passes-H1-H4.md`](journal/09-passes-H1-H4.md) | H1, M7, H2, H3, H4 | 18/10 → 19/10 |
| [`journal/10-passes-H5-P2.md`](journal/10-passes-H5-P2.md) | H5, F1, T1, H6, K1, W1, Q2, C1, W2, K2, K3, W3, B1, A1, A2, A3, P1, P2 | 19/10 |

---

## Passe H7 — Héros : export reconstruit avec Aseprite depuis le rig de la Passe H6, mesures en jeu (2026-10-19)

### Demande
- Opérateur, mot pour mot : « la session cloud est finie prend en compte ce qui a ete etabli pour la suite » ; ce qui était établi, mot
  pour mot : « Ok on reprendra nos taches qui demanderont l;utilisation de aseprite et openAI, une fois que la session Cloud aura fini donc
  dans 5-6 heures » ; ici, le point 1 d'« À vérifier sur la machine de l'opérateur » (Passe B1).
- `main` à jour (`ba3f5aa`) ; CI verte sur chaque push de la séance cloud (lue par l'API publique de GitHub). La branche
  `claude/stoic-goodall-8ieke4`, entièrement fusionnée (sa suppression était refusée par le proxy de la séance cloud, Passe H6), est
  supprimée du dépôt distant. Branche `hero-h7-rebuild` depuis `main`.

### [KO → corrigé] `npm test` échouait sous Windows
- Sur la machine de l'opérateur, `main` donnait 1 échec : `tests/camera-graph.test.mjs` (Passe K1) chargeait `CameraRig.ts` au milieu du
  fichier, après ses cinq premiers tests ; ceux-ci tournent pendant que le chargement attend, puis le crochet `after()` de `tests/load.mjs`
  ferme le chargeur de Vite et le chargement reste en suspens (« Detected unsettled top-level await », code de sortie 13). La CI (Linux)
  passait : une course entre les deux.
- Correctif : tous les chargements du fichier en tête, avant le premier test. `npm test` 75 / 75 ; contrôle négatif : le fichier de `main`
  échouait sur cette machine (vu avant le correctif).

### Reconstruction — [OK]
- `node tools/art-lab/build-character.mjs art-lab/characters/rigs/hero-x2-v2.rig.mjs` (Aseprite 1.3.18.6, Chrome) : 36 images ; le JSON est
  identique à l'octet (images, durées, étiquettes) ; les vues reconstruites ne changent pas (`view-*.png`, mêmes empreintes).
- Export `7d62c12b…` → `6617d4b8…`, `.aseprite` `b908025d…` → `8445287b…` ; `build.json` et la table du paquet mis à jour (rig H6
  `971d1e8a…`).
- `--check` : « rebuilt identical » ; `verify-provenance` : « intact » (le problème signalé depuis la Passe H6 a disparu) ;
  `art:validate` 0 erreur ; `npm test` 75 / 75 ; manifeste inchangé (`candidate`, `approved: false`, `lab`).
- `walkSlide` (la mesure du moteur, par un script hors dépôt qui passe par le chargeur des tests) : export H5 9 texels, export H7 **14** ; le
  héros cuit court donc à 3,73 m/s, et à 4,48 m/s avec Maj (Passe H6).
- Planche `reviews/hero-x2-v2/09-h7-export-x3.png` (les 36 images ×3) : vol aux 4e et 8e images du profil, jambes de face levées de
  5 texels au plus.

### Glissement en mouvement — [OK]
- Méthode : `tools/foot-slip.mjs --secs=3`, graine 1842, `cast=candidate`, caméra épinglée, touche tenue ; médiane [min .. max].

| | A | B | C | D | D vers la gauche |
|---|---|---|---|---|---|
| marche (3,73 m/s) | +0,05 [−0,59 .. +0,05] | −0,03 [−0,10 .. +0,11] | −0,10 [−0,15 .. +0,09] | −0,07 [−0,10 .. +0,11] | −0,07 [−0,33 .. +0,11] |
| Maj (4,48 m/s) | +0,01 [−0,32 .. +0,01] | −0,03 [−0,15 .. +0,11] | −0,07 [−0,18 .. +0,09] | −0,01 [−0,15 .. +0,11] | — |

- Ces médianes rejoignent celles de l'aperçu de la Passe H6 à 0,04 près (A +0,05, B −0,06, C −0,10, D −0,07). Les ±0,07-0,11 sont la
  quantification : 5 ou 6 pas de 1/60 s par image (Passe H6).
- **[?]** Trois minima isolés restent non élucidés : A −0,59, A avec Maj −0,32, D vers la gauche −0,33.

### Flipbooks — revue en mouvement, hors dépôt
- `tools/flipbook.mjs` rejoue la même course à graine sur deux serveurs :
  - `main` figé, servi sur :5188 : export H5, 2,40 m/s ;
  - la branche : export H7, 3,73 m/s.
- Deux prises :
  - profil en B : `KEYS=d`, joueur à −6 / 0,6 ;
  - face en D : `KEYS=s`, joueur à 19 / −2,4. En B, la marchande, puis le voyageur et l'étal cachaient le héros.
- Pages de 6,5 et 3,8 Mo, à joindre à la fiche d'arbitrages.

### Restes [?]
- **Décision de l'opérateur** : le héros en production ou des retouches. Elle se prend en jeu, avec `?cast=candidate`. Rien n'est approuvé.
- Relevés de la critique H6, non traités :
  - pas de balancement des bras de face ni de dos ;
  - éperon du talon ;
  - genou en boule grise ;
  - botte levée de face rigide.

### Pensée
- Un fichier de test charge tous ses modules avant son premier test. Sinon, l'ordre d'exécution décide : sous Windows, le crochet qui ferme
  le chargeur passe avant le chargement.
- Une reconstruction préparée sans l'outil final (la séance cloud n'avait pas Aseprite) n'est finie qu'après `--check` et
  `verify-provenance` sur une machine qui l'a. Avant, les images du rig et l'export versionné restent deux choses distinctes.

## Passe I1 — Outil de génération d'images (OpenAI, plafond 5 $ par tâche) ; premier essai : vue tournante du héros en huit vues (2026-10-19)

### Demande
- Décision de l'opérateur (2026-10-19), mot pour mot : « Oui : fais créer l'outil de génération d'images par la séance du héros, avec un
  plafond de 5 $ par tâche, la provenance enregistrée automatiquement et la règle dans AGENTS.md. » ; puis, mot pour mot : « attends ne cree
  rien tout de suite une sous-session est en cours mais prend ces considerations pour plus tart ».
- Reprise après la séance cloud (Passe H7, même demande). Branche `image-gen-tool` depuis `main` (`d43585b`).

### Outil — [OK] (`tools/art-lab/gen-image.mjs`)
- **Technique** : Node seul (`fetch`, `FormData`, `Blob`), sans dépendance.
- **Points d'accès** :
  - `/v1/images/generations` sans référence ;
  - `/v1/images/edits` avec des références (`image[]`).
- **Clé** :
  - lue dans `OPENAI_API_KEY`, sinon dans `.env.local` ;
  - `.env.local` est refusé s'il n'est pas ignoré par git (contrôle par `git check-ignore`) ;
  - la clé n'apparaît que dans l'en-tête `Authorization` ; toute ligne affichée ou écrite passe par `redact`.
  - Elle n'a été ni lue à la main ni affichée dans cette passe.
- **Plafond** :
  - un registre ignoré par git (`art-lab/characters/scratch/gen-image-ledger.json`) tient la dépense de chaque tâche ;
  - chaque requête y est réservée au pire cas **avant** l'envoi, et refusée si la tâche dépassait 5 $ ;
  - `--cap` ne peut que baisser le plafond ;
  - la réponse remplace la réservation par le coût de sa consommation ;
  - une erreur HTTP compte 0 ; une requête restée sans réponse garde sa réservation.
- **Modèles** : tarifs de la page de prix d'OpenAI, lue le 19/10.
  - `gpt-image-1`, `gpt-image-1-mini` et `gpt-image-1.5` suivent la table publiée de jetons de sortie ;
  - `gpt-image-2` n'a pas de table publiée : le pire cas compte trois fois la table ;
  - tout autre modèle est refusé (pas d'estimation, donc pas de plafond).
  - `--list-models` lit les modèles d'image du compte (gratuit) : `gpt-image-1`, `-1-mini`, `-1.5`, `-2`, `-2.5-flare`, `-2.5-sunburst`,
    `chatgpt-image-latest`.
- **Provenance automatique**, dans une fiche `.source.json` à côté de chaque image, dont les octets de l'API sont gardés tels quels :
  - modèle, point d'accès, paramètres ;
  - prompt exact et son SHA-256 ; références (SHA-256, taille) ;
  - identifiant de requête, dates, consommation, coût estimé et coût d'après la consommation ;
  - empreinte de l'outil ;
  - présence du bloc C2PA (`caBX`), **non vérifié**.
- **Archivage** : `--archive` copie une image à l'octet dans `reference/sources/` avec sa fiche ; il ne remplace jamais une source
  existante et refuse une image qui ne correspond plus à sa fiche.
- **Autres modes** : `--dry-run` (rien n'est envoyé ni écrit), `--spent`.
- **Règle** : section « Image generation » d'`AGENTS.md`, avec la décision citée et le protocole des séances cloud de la mémoire du projet.

### Tests — [OK] (`tests/gen-image.test.mjs`, 7 tests, hors ligne, faux `fetch`, fausse clé)
- Couvert :
  - lecture de la clé, et refus d'un `.env.local` que git commiterait ;
  - estimations et coûts contre les prix publiés, écrits en nombres dans le test ;
  - une génération complète : octets gardés, fiche, registre réglé, clé absente de tout fichier écrit et de toute ligne affichée ;
  - les références envoyées en `image[]`, sans `input_fidelity` pour `gpt-image-2` ;
  - le plafond : refus avant tout envoi, `--cap 50` ramené à 5 ; `--dry-run` ;
  - les pannes : HTTP 400, absence de réponse, message sans la clé ;
  - `--archive`.
- **Douze fautes injectées une à une, toutes attrapées** :
  - plafond ignoré ; plafond relevable ;
  - message d'erreur non masqué ;
  - erreur HTTP facturée ; réservation perdue sans réponse ;
  - `.env.local` lu sans contrôle ;
  - octets modifiés ;
  - `--dry-run` qui envoie ;
  - archive écrasée ;
  - pire cas de `gpt-image-2` à 1 × la table ; `input_fidelity` envoyé à tous ;
  - texte de sortie payé au prix de l'image.
- `npm test` 82 / 82.

### Premier essai — [OK] la requête ; [?] le jugement est à l'opérateur
- **But** : deux points ouverts du héros.
  - Les vues de trois-quarts : la planche v3 n'a aucun trois-quarts dos (Passe H6).
  - Le visage : yeux sous la frange, pas de bouche (critique de la Passe H5).
- **Requête** :
  - tâche `hero-turnaround-v4` ; `gpt-image-2`, édition depuis la planche v3 archivée ;
  - deux images 1536 × 1024, qualité haute ;
  - prompt dans les fiches (SHA-256 `9aefde1f5a194b15…`) : huit vues de repos par pas de 45° (vues 4 et 6 en trois-quarts dos), visage
    lisible, cheveux, cuir et bottes sur trois rampes distinctes, fond gris sans ombre portée.
- **Coût** : réservé 1,19 $ ; consommation 3 960 jetons d'entrée (2 904 d'image) et 10 976 de sortie, soit **0,36 $**. Total de la tâche :
  0,36 $ sur 5.
- **Résultat**, deux planches :
  - de vrais trois-quarts dos aux vues 4 et 6 : nuque et ligne de la joue, gantelet et bout de botte du côté proche ;
  - deux yeux lisibles sous la frange et une petite bouche ;
  - le design gardé : cape indigo unie au liseré doré, fermoir, cuir, pantalon foncé.
- **Écart au prompt** : les vues 2 à 4 sont tournées vers la gauche au lieu de la droite. C'est sans effet pour le jeu, qui retourne le
  profil.
- **Mesures** : boîtes des figures, fond médian du bord, seuil 40.
  - Image a : figures de 317 à 321 px, 8 % plus grandes que la planche v3.
  - **Image b** : figures de 290 à 293 px, la même échelle que les vues de repos de la v3 (289 à 297 px).
  - Aucune des deux n'a d'ombre portée.
- **Archivage** : les deux images sont archivées à l'octet, comme **sources non canoniques**. Elles attendent la décision de l'opérateur.
  - `reference/sources/hero-turnaround-v4-2026-10-19-a.png` (`cddd87d0…`) et `-b.png`, avec leurs fiches automatiques ;
  - `cmp` identique ; `art:validate` : 14 sources, 0 erreur.

### Restes [?]
- Décisions de l'opérateur, portées sur la fiche d'arbitrages :
  - prendre ces planches comme source des trois-quarts et du visage du héros ;
  - aller aux cinq vues (`briefs/three-quarter-views.md` § 6).
- Rien n'est construit depuis ces planches. La reconstruction (pas, palette, rig) suivra cette décision.
- Clé MiniMax de `.env.local` : non utilisée (règle).

### Pensée
- Un plafond de dépense se tient avant l'envoi :
  - on réserve au pire cas, puis on règle d'après la consommation ;
  - pour un modèle sans table publiée, on prend un pire cas déclaré (ici trois fois la table), et la consommation réelle (5 488 jetons par
    image) dit ensuite s'il était juste.
- Une clé se garde par construction (un seul endroit où elle passe, tout le reste masqué), et se prouve par une fausse clé cherchée dans
  tout ce que l'outil écrit et affiche.

## Passe G1 — Preuves sur la machine de l'opérateur : temps GPU de la météo, de la foule et de l'arène ; visibilité avec l'ancrage ; fiche d'arbitrages (2026-10-19)

### Demande
- Suite de la Passe H7 : points 2 et 3 d'« À vérifier sur la machine de l'opérateur » (Passe B1), puis les décisions accumulées, regroupées
  sur une fiche (principe de l'opérateur : une fiche d'arbitrages à chaque jalon). Branche `local-proofs-g1` depuis `main`.

### Temps GPU — [OK]
- Conditions de la mesure :
  - `tools/perf.mjs --rounds=3`, serveur DEV :5186, graine 1842, `clean=1` ;
  - Radeon 780M (ANGLE D3D11), MSAA 4 ;
  - témoin de contention actif : **3 / 3 tours propres** pour chaque variante ;
  - médiane [min-max] des tours, en ms.

| | clair | pluie | neige | orage | héros + `crowd=5` + pluie |
|---|---|---|---|---|---|
| B, 1920 × 1080 | 10,81 [9,88-10,95] | 10,76 [10,22-12,14] | 10,68 [10,37-11,22] | 11,25 [10,37-11,71] | 10,80 [10,41-12,12] |
| D, 1920 × 1080 | 9,94 [9,42-10,01] | 10,60 [10,33-12,48] | 9,66 [9,53-11,87] | 10,19 [10,12-11,40] | — |
| B, 2560 × 1440 | 19,65 [18,60-20,04] | 18,97 [18,71-19,06] | — | — | 18,14 [17,44-18,35] |

- **Le coût de la météo reste sous le bruit de la mesure.** Entre deux tours, la même variante bouge jusqu'à 2 ms (dérive thermique). Sur
  les minima, l'estimation sans contention, la pluie coûte au plus +0,3 ms en B et +0,9 ms en D ; la neige et l'orage +0,1 à +0,7 ms.
- La météo ajoute un appel de dessin (107 → 108) et 10 000 à 18 000 triangles, comme le comptait la Passe W1.
- **Le budget de la passe 6 tient** : 10-12 ms en 1080p, 16-21 ms en 2560 × 1440. C'est vrai avec le héros cuit, la foule à cinq et la pluie
  ensemble.
- **Arène** (`scene=arena`, même session) : **9,30 ms** [9,25-9,49], 92 appels de dessin, 130 k triangles. La ville en B : 9,88 ms
  [9,79-10,22].

### Visibilité sur GPU — [OK] (`tools/viewport-proof.mjs --no-resize --no-controls`, serveur DEV, trois graines × cinq formats)
- **Transitions approuvées**, la référence de cette séance :
  - 9 contrôles en échec, le même nombre et les mêmes classes que les écarts connus de la Passe 5b ;
  - détail : 1842 D-far 2560 × 1080 (3 px) ; 7719 C 1080p et 2560 × 1080 (1 px chacun), AB 665 × 1200 (2 px) ; 30417 AB 1080p (48 px, dont 31
    décidés par l'ordre de dessin), et en 720p AB (5 px), CD (1 px) et D-far (1 px) ; 30417 D-far 665 × 1200 (1 px).
- **Transitions ancrées** (`--q=camblend=anchored`), **[KO → corrigé] l'outil** :
  - `viewport-proof.mjs` ancrait ses poses de transition seulement vers D, sans suivre `anchorAll`. La séance cloud avait mis `visproof`
    et `vis-why` à jour (Passe K1), pas lui.
  - Avec le paramètre, il testait donc une transition AB non ancrée, que le jeu ne montre jamais. L'écart obtenu (15 px à 30417 AB
    2560 × 1080) se reproduisait, alors que `vis-why` donnait 0 px à la même pose.
  - Correctif d'une ligne (`|| !!a.graph.anchorAll`), sans effet sans le paramètre.
- **Après correctif : 8 contrôles en échec, aucun au-delà de 3 px.**
  - Les écarts AB disparaissent (la pose AB n'est plus la même).
  - Restent : 1842 D-far 2560 × 1080 (3 px) ; 7719 C en 1080p et en 2560 × 1080 ; 30417 D-far et CD en 720p ; 30417 D-far 665 × 1200 (1 px
    chacun).
  - Deux écarts neufs d'1 px en BC (1842, en 1080p et en 2560 × 1080).
- `vis-why` sur BC (1842, 1080p) : 1 px, d'intensité 8 / 255 au plus. Il ne change pas quand on force la seule pièce manquée, une lanière du
  reflet plus fine qu'un pixel du bake. C'est la classe de résidu connue (un échantillon MSAA à travers une fissure, Passe 5b), pas un manque
  du culling.

### Fiche d'arbitrages — publiée
- Elle porte 25 décisions en six familles : héros (H1-H5), caméras (K1-K3), scène et ambiance (W1, C1, S1, S2, V1), arène (A1-A4), technique
  et processus (T1-T8), jalon (M1-M2).
- Chaque décision a son contexte, ses sources, des captures quand c'est visuel (dont les flipbooks de la course du héros, ancien export
  contre nouveau), une recommandation et des options.
- Page privée : https://claude.ai/artifact/JBaceiRrkNFHCq9SgdihY6. Les choix y sont enregistrés (collection `decisions`) et relus par la séance ; ils seront consignés mot pour mot
  avant d'agir.
- Pièce ajoutée pour H4 : `reviews/hero-x2-v2/10-v4b-views-vs-current-x3.png`.
  - Ce sont cinq vues de la planche v4-b reconstruites au pas du héros, en aperçu : `reconstruct-grid`, pas 3,4, `--holes --no-shadow
    --closing-from=48`. Rien n'est construit ni commité d'autre.
  - Elles font 85 à 87 rangées, comme le héros actuel (84-85).
  - À côté de lui, à ×3 : les yeux sont lisibles de face, et le trois-quarts dos se lit à la taille du jeu.

### Pensée
- Un paramètre qui change ce que le jeu montre (ici `anchorAll`) doit être suivi par chaque outil de preuve qui recalcule cette pose.
  Sinon, la preuve teste une image que le jeu ne fait jamais. Un écart qu'un second outil ne reproduit pas à la même pose se cherche
  d'abord dans les outils.
- Un coût plus petit que la dérive d'une session ne se lit pas sur une médiane. On le borne par les minima des tours entrelacés, et on le
  dit comme une borne.
- Une preuve de visibilité se compare d'abord à sa propre référence du jour, sur la même machine et dans la même série. Les écarts connus
  s'y retrouvent ; un écart neuf se voit alors par différence.

## Passe D1 — Fiche d'arbitrages remplie : 27 décisions de l'opérateur consignées ; journal H5-P2 archivé (2026-10-19)

### Demande
- Opérateur, mot pour mot : « La fiche d'arbitrages est remplie : relis mes choix, consigne-les et applique-les. »
- La fiche (https://claude.ai/artifact/JBaceiRrkNFHCq9SgdihY6), collection `decisions` : 27 documents, lus vers 17 h 25 UTC.
- La fiche compte 27 décisions, et non 25 comme l'écrit la Passe G1 (erreur de compte).
- Branche `decisions-d1` depuis `main` (`ace2da0`).

### Les choix, mot pour mot (l'option cliquée ; la note quand il y en a une)

| | Décision | Choix | Note |
|---|---|---|---|
| H1 | Le héros : production ou retouches | « Retouches d'abord (visage, palette) » | — |
| H2 | Sprint avec Maj | « Sprint ×1,2 » | — |
| H3 | Vues de trois-quarts | « Cinq vues, le héros d'abord » | — |
| H4 | Vue tournante générée | « Source : la b » | — |
| H5 | Vues du côté droit de la planche | « Ignorées » | — |
| K1 | Transitions ancrées partout | « Oui, par défaut » | — |
| K2 | Recaler le pivot de A | « Cherche et montre-moi » | — |
| K3 | Recul en cadrage D | « Prototyper le suivi à l'écran » | — |
| W1 | Météo par défaut | « Nuit claire par défaut » | « Mais prend en compte que nous aurons un etat jour et nuit, et jour sera l'etat par defaut qui represente les evenements principaux du jeu : le deroule du tournoi » |
| C1 | Les cinq citadins | « Cinq par défaut » | — |
| S1 | La marchande à son étal | « La déplacer » | « Mais la marchande n'est pas cense rester a son stand ? » |
| S2 | Les deux gardes jumeaux | « Variante de couleur » | — |
| V1 | Variantes de PNJ | « Prépare la proposition » | « Mais ils me semblent que cela est deja fait non ? » |
| A1 | Entrée de l'arène depuis la ville | « Plus tard » | — |
| A2 | Combattants | « Générés pour l'instant » | — |
| A3 | Assistance par défaut | « Discrète » | — |
| A4 | Nombres du combat | « Régler après essai » | — |
| T1 | Passe « derrière » du bake | « Garder jusqu'au gel » | — |
| T2 | Écarts de la preuve de visibilité | « Géométrie au gel, pas de ×4 » | — |
| T3 | CI | « Épingler 24.04 » | — |
| T4 | Port 5173 | « strictPort » | — |
| T5 | Archivage du journal | « Branche fusionnée suffit » | — |
| T6 | Contrat C2 | « Confirmé » | — |
| T7 | Ancienne rive opposée | « Retirer au gel » | — |
| T8 | Outil d'images | « D'accord » | — |
| M1 | Clore le Merchant District | « Appliquer, puis revue » | — |
| M2 | Gold Master | « Pas encore » | — |

### Réponses aux notes, vérifiées dans le dépôt
- **V1 — [OK] c'est déjà fait.**
  - `art-lab/characters/variants/variants.json` est approuvé pour la production depuis le 18/10 (Passes V1 à V3) : deux variantes par
    personnage, les PNJ uniques fixés à leur original.
  - Le point de la fiche venait d'une ligne d'« À reprendre » restée à l'état d'avant l'approbation (« À arbitrer avec l'opérateur : quels
    personnages… »). La ligne est retirée ; rien à faire.
- **S2 — [OK] c'est déjà fait, pour la même raison.** Le second garde porte la variante 1 (`fixed: { guardA: 0, guardB: 1 }`, approuvé le
  18/10). Ligne retirée.
- **S1 — [?] la fiche décrivait mal le point ; rien n'est appliqué.**
  - La marchande **reste à son étal** : son point de départ est dans la boîte du collisionneur de l'étal. Elle ne peut faire aucun pas,
    reste debout et parle (Passe 4A-unvicies).
  - La déplacer de 0,5 m la ferait **marcher devant l'étal** ; c'est ce que la note semble ne pas vouloir.
  - La question est reposée à l'opérateur.
- **W1 — consigné.** La nuit claire reste le défaut du Merchant District tel qu'il est. Un état **jour** viendra et sera l'état par défaut
  du jeu (les événements principaux, le déroulé du tournoi).
  - Noté dans `AGENTS.md` (direction artistique) et dans « À reprendre » (§ 6d).
  - Rien n'est lancé : un état jour demandera sa propre direction artistique, décidée avec l'opérateur.

### Appliqué dans cette passe
- **T5** :
  - le critère d'archivage d'`AGENTS.md` dit maintenant « branche fusionnée » ;
  - les passes H5 à P2 sont archivées (ci-dessous).
- **T6** : la décision C2 du contrat d'intégration (§ 11) est marquée confirmée, avec le choix cité.
- **W1** : la note est dans `AGENTS.md`.
- **« À reprendre »** : les décisions y sont portées ; les lignes périmées (V1, S2) sont retirées.

### À appliquer ensuite, une branche par tâche, dans cet ordre
1. T3 et T4 : CI sur `ubuntu-24.04` ; `strictPort`.
2. C1 : cinq promeneurs par défaut.
3. K1 : transitions ancrées par défaut.
4. H3 : la règle à cinq secteurs avec repli par feuille. D'abord derrière un paramètre DEV, prouvée à 0 px sur la production.
5. H1 et H4 : un nouveau candidat du héros depuis la planche v4-b (visage, palette, cinq vues), puis la revue de l'opérateur en jeu.
6. K3 : prototype du suivi qui vise la vitesse du joueur à l'écran en D. K2 : recherche d'un recalage du pivot de A. Les deux sont montrés à
   l'opérateur.

Rien à faire pour H2, H5, A1-A4, T1, T8 et M2. T2 et T7 attendent le gel du district.

### Journal — [OK] archivage (décision T5)
- **Quoi** : H5, F1, T1, H6, K1, W1, Q2, C1, W2, K2, K3, W3, B1, A1, A2, A3, P1 et P2.
  - Toutes sont closes : branches fusionnées, et leurs décisions sont consignées ci-dessus.
  - Elles partent d'un seul bloc, dans leur ordre et à l'octet, vers `journal/10-passes-H5-P2.md` : en-tête, ligne `---`, puis les
    103 891 octets inchangés (SHA-256 `39b0464199cc28ad…`).
  - La ligne d'index et la phrase d'en-tête sont mises à jour.
  - Restent H7, I1, G1 et cette passe.
- **Preuve** (script hors dépôt, contre la copie de `JOURNAL.md` faite juste avant le déplacement) : **8 / 8**. Les huit contrôles :
  - en-tête puis bloc ;
  - corps = octets retirés ;
  - chaque passe archivée une seule fois, dans la nouvelle archive ;
  - passes gardées inchangées ;
  - `JOURNAL.md` = l'original moins le bloc, à la phrase et à la ligne d'index près ;
  - ligne d'index ;
  - archives 01 à 09 inchangées ;
  - CRLF seuls dans la copie de travail.
- **Contrôle négatif** : un mot changé dans une copie de l'archive → 6 / 8.

### Pensée
- Une fiche d'arbitrages se construit sur l'état du dépôt, pas sur une liste de travail. Deux de ses points (V1, S2) étaient déjà faits :
  une ligne d'« À reprendre » restée à l'ancien état les a fait reposer. Chaque point se vérifie dans le code ou les fichiers approuvés avant
  d'être posé.
- Une décision dont la note contredit l'option choisie (S1) ne s'applique pas. Elle se repose avec les faits.

## Passe O1 — Outillage : CI épinglée sur Ubuntu 24.04, `strictPort` sur le port 5173 (décisions T3 et T4) (2026-10-19)

### Demande
- Décisions de l'opérateur (Passe D1), mot pour mot : T3 « Épingler 24.04 », T4 « strictPort ».
- Branche `tooling-o1` depuis `main` (`59fd6c0`).

### Fait — [OK]
- `.github/workflows/ci.yml` : `runs-on: ubuntu-24.04` au lieu de `ubuntu-latest` (qui passe à Ubuntu 26 dès le 19/10), avec la décision en commentaire.
- `vite.config.ts` : `strictPort: true`. `npm run dev` s'arrête avec une erreur quand le port 5173 est pris, au lieu de passer en silence au port suivant (un autre projet local utilise aussi 5173).
- `AGENTS.md` (commandes et CI) mis à jour.

### Preuves
- `strictPort`, dans les deux sens :
  - 5173 tenu par un simple écouteur TCP : `npm run dev` sort en code 1, « Error: Port 5173 is already in use » ;
  - l'écouteur arrêté : Vite démarre sur 5173.
- typecheck, `npm test` 82 / 82, build, `art:validate`.
- CI : vérifiée sur le push de la branche (voir le commit de fusion).

### Pensée
- Un défaut d'outillage qui échoue en silence (un port pris, une image d'OS qui change de version sous le même nom) se règle en le rendant explicite : une erreur nette, une version épinglée.

## Passe C2 — Foule : cinq promeneurs par défaut, les cinq citadins à tour de rôle (décision C1) (2026-10-19)

### Demande
- Décision de l'opérateur (Passe D1), mot pour mot : C1 « Cinq par défaut ».
- Branche `crowd-five-c2` depuis `main` (`a6c1f1e`).

### Fait — [OK]
- `ActorSystem.populate` : sans `?crowd`, **round(5 × densité)** promeneurs, les cinq citadins à tour de rôle. À la densité 1, chaque
  citadin approuvé marche une fois ; avant, round(2 × densité) promeneurs de types tirés au sort.
- **Mon choix** : garder la proportion à la densité (le curseur du panneau) plutôt qu'un 5 fixe. À la densité 1, c'est exactement
  l'ancien `?crowd=5`.
- L'ancien tirage du type reste fait : chaque tirage suivant de la graine du district garde sa place.
- `?crowd=<n>` fixe toujours le nombre, à tour de rôle aussi.
- Mis à jour : `AGENTS.md` (paramètre `crowd`), le commentaire d'`App`.

### Preuves
- **Captures déterministes** (graine 1842, `clean=1&freeze=7.3&vis=0`, 300 pas : les promeneurs ont marché, 1920 × 1080, Radeon 780M) :
  - la branche, par défaut, contre `main` figé (`ba3f5aa`, servi sur :5187) avec `?crowd=5`, en A / B / C / D : **0 px**, PNG identiques
    à l'octet ;
  - témoin de répétition (deux chargements) : 0 px ;
  - contrôle (l'ancien défaut) : 0,7 % (A) à 4,8 % (B) des pixels changent.
- **`tests/crowd.test.mjs`** réécrit (3 tests) :
  - le défaut : cinq types dans l'ordre aux graines 1842, 7719 et 30417 ; densités 2, 0,2 et 0 ;
  - `?crowd=<n>` ;
  - le défaut = l'ancien `?crowd=5` (positions, types, porteur), et moins de promeneurs gardent les premiers en place ;
  - **un oracle mesuré sur le code d'avant** : les places de l'ancien `?crowd=5` à la graine 1842 et celle du porteur, au millionième.
- **Cinq fautes injectées une à une, toutes attrapées** :
  - défaut à 2 × densité ;
  - types tirés au sort par défaut ;
  - nombre indépendant de la densité ;
  - `?crowd` ignoré ;
  - l'ancien tirage du type retiré (seul l'oracle l'attrape).
- typecheck, `npm test` 82 / 82, build, `art:validate`.
- Références `screenshots/calibration/cam{A,B,C,D}-*.png` refaites avec la foule par défaut (requêtes de `tools/screenshots.mjs`, capture déterministe, 120 pas, témoin de répétition 0 px) ; contre les anciennes, 0,8 à 4,1 % des pixels changent, la foule et le porteur, dont la place suit les tirages des promeneurs de plus.

### Pensée
- Un changement de défaut qui reprend une variante déjà préparée se prouve contre cette variante sur la base figée (0 px). Un oracle
  mesuré sur l'ancien code garde ce qui ne se voit pas (un tirage conservé pour la suite de la graine).

## Passe K4 — Caméras : toutes les transitions ancrées par défaut (décision K1) (2026-10-19)

### Demande
- Décision de l'opérateur (Passe D1), mot pour mot : K1 « Oui, par défaut ». L'ancrage était préparé derrière `?camblend=anchored` (Passe K1).
- Branche `camblend-default-k4` depuis `main` (`96c9af9`).

### Fait — [OK]
- `CameraGraph.anchorAll = true` par défaut : les transitions A ↔ B et B ↔ C passent par `blendPose` ancré, comme celles vers D. Le bake les échantillonne aux six poids : 329 poses au lieu de 273, la clé du cache les distingue.
- `?camblend=interpolated` rend les anciennes transitions interpolées, pour comparer. `?camblend=anchored` ne change plus rien.
- Les outils de preuve suivent `anchorAll` : `visproof` et `vis-why` depuis la Passe K1, `viewport-proof` depuis la Passe G1.
- Mis à jour : `AGENTS.md` (paramètre et section des caméras), les commentaires de `CameraGraph` et d'`App`.

### Preuves
- **Simulation de marche** (`tools/camsim.mjs`, graine 1842, `vis=0`, joueur guidé vers un point), `main` figé (`96c9af9`, :5187) contre la branche :
  - B → A : **13 images de recul (−139 px/s) → 0** ;
  - A → B : **5 images (−25 px/s) → 0** (reste une image à −8 px/s en cadrage posé, la même sur `main`) ;
  - B → C et C → B : 0 des deux côtés.
- **Cadrages posés A, B, C, D et D lointain**, culling actif, `static=1`, 30 pas : **0 px** contre `main`, témoin de répétition 0 px. Le bake de la branche compte bien 329 poses (`main` : 273) ; Tier 3 = 317 pièces des deux côtés à la graine 1842.
- **Visibilité** : la preuve de la Passe G1 avec `anchorAll` (le même chemin de code) donne 8 contrôles en échec, aucun au-delà de 3 px, tous de la classe connue.
- `tests/camera-graph.test.mjs` : les trois tests d'ancrage réécrits (défaut ancré ; `anchorAll = false` reproduit l'ancien recul ; poses du bake). Faute injectée (le défaut remis à `false`) : 2 échecs.
- typecheck, `npm test` 82 / 82, build, `art:validate`.

### Restes [?]
- K2 (« Cherche et montre-moi ») : le recalage du pivot de A, pour le +21 px/s qui reste en B → A.

### Pensée
- Un défaut qui change le bake (des poses en plus) doit montrer 0 px aux cadrages posés, et ce 0 px se recoupe avec le nombre de poses du bake (329 contre 273) : sans ce recoupement, un « 0 px » peut venir d'un bake qui n'a pas changé.

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
  (les « texels pâles à l'épaule ») corrigés dans les masques, approuvés le 18/10. Fait : deux variantes par personnage, PNJ uniques en
  original (approuvé le 18/10 ; vérifié en Passe D1). Reste : les images de frappe du forgeron presque sans masque (invisible tant qu'il est
  fixé à son original).
- **Mise en scène** :
  - La marchande reste à son étal sans marcher : son point est dans le collisionneur de l'étal. L'opérateur a choisi « La déplacer »,
    avec la note « Mais la marchande n'est pas cense rester a son stand ? » ; **la question est reposée** (Passe D1).
  - Les deux gardes diffèrent déjà (variante 1 pour le second, approuvée le 18/10). Restent les lances.
  - Les cinq citadins : « Cinq par défaut » (Passe D1), appliqué (Passe C2).
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
  distribution de production, confirmé par l'opérateur (« Confirmé », Passe D1). Originaux des planches de référence des PNJ (01-16,
  17-24, planche complémentaire) à retrouver (l'opérateur s'en charge ; ceux du casting 1 sont archivés, Passe H2) ; droits de tiers non
  vérifiés exhaustivement ; signatures C2PA lues, jamais validées (`c2patool` non installé).
- **Héros premium** (Passes H0 à H4) : casting 1 tranché par l'opérateur (design de la planche 1, pantalon foncé, planches archivées avec
  leurs PNG d'origine) ; planche v2 archivée, héros `hero-x2-v1` construit au stade lab puis écarté par l'opérateur (proportions, bras
  immobiles, cuisses trop hautes ; « experimental ») ; décision, mot pour mot : « Planche v3 (Recommandé) » ; prompt v3 prêt
  (`briefs/hero-proposal.md` § 5, trois pièces jointes) ; déclinaisons au choix du joueur : « Une base + couleurs (Recommandé) » (Passe H4) ;
  deux lots d'images évalués, non validés (brief § 11) ; planche de base archivée, `hero-x2-v2` construit au stade lab, candidat non
  approuvé (Passe H5) ; décision de l'opérateur (Passe D1) : « Retouches d'abord (visage,
  palette) ». Texture cuite élargie
  (Passe T1 : 672 images garanties). Passe H6 : vitesse du héros cuit tirée de son cycle (3,73 m/s avec le rig préparé, Maj = sprint × 1,2),
  rig préparé (14 texels, vol, genoux à 5 texels) ; export reconstruit avec Aseprite (Passe H7 : `walkSlide` 14, `--check` identique,
  glissement ≈ 0). Décisions de la Passe D1 : « Source : la b » (planche v4-b), « Cinq vues, le héros d'abord », « Sprint ×1,2 », vues du
  côté droit « Ignorées » : **à appliquer**. Vues de trois-quarts : étude `briefs/three-quarter-views.md` (aucun trois-quarts dos sur la planche v3 ; Passe I1 :
  deux planches générées en huit vues, trois-quarts dos compris, archivées comme sources non canoniques). Plus tard : masques du héros pour ses
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
  dans le reveal ; chercher un cas où la passe « derrière » restaure vraiment des pièces (Passe B1 : aucune sur les graines 1842, 7719, 30417 en 720p et
  1080p) : « Garder jusqu'au gel » (Passe D1), puis la couper au gel du district pour gagner ≈ 90 ms
  de bake ; rejouer l'inventaire à chaque changement de zones de caméra ou de composition (bateau, lampadaires).

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
« Oui, par défaut » (Passe D1), appliqué (Passe K4) ; preuve de visibilité sur GPU faite, Passe G1 ; le reste demanderait de recaler le pivot de A :
« Cherche et montre-moi ») ; (e) reculs du joueur à l'écran en cadrage posé C / D (−15 à
−39 px/s, Passe K1) : expliqués en Passes K2 / K3 (le pivot de D, qui suit 85 % du déplacement latéral, dépasse un joueur que sa marche en profondeur
ralentit à l'écran ; le suivi le long des axes de la caméra n'y change rien) ; suivi visant la vitesse à l'écran :
« Prototyper le suivi à l'écran » (Passe D1). Contrainte : la caméra de D reste
à z < ~18,5 (maisons de la rive opposée dès z = 19,8, invisibles de A/B/C) ; tout cadrage plus reculé exige de les retirer ou de les abaisser.

**5. Visibilité / culling**
- **Décision de l'opérateur (Passe D1)** : « Géométrie au gel, pas de ×4 » : les corrections de géométrie (fissures, quai coplanaire) au gel
  du district ; ni D ×4 ni poses AB à w = 0,5 (maison 609).
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
jugement de l'opérateur en jeu et en mouvement (vent sur les bannières,
pluie qui tombe, éclairs), météo par défaut : « Nuit claire par défaut » (Passe D1) ; non faits : son (le jeu n'en a pas), éclaboussures
au sol, neige sur les personnages. Éclair dessiné dans le ciel : Passe W3.

**6c. Arène (Passes A1 à A3, P1, P2)** — **dans le jeu derrière `?scene=arena`** (Passe P1 : simulation portée et prouvée contre le
prototype, décor du district, combattants générés ×2, HUD au style du jeu ; la ville inchangée, 0 px ; Passe P2 : quatre critiques à
l'aveugle, de 6,5 / 7 à 7,5 / 5,5 contre le prototype). Jouable en artefact privé : https://claude.ai/artifact/EzSKUGk1jrCSxLENY5CC44 (à
republier avec `tools/arena-scene-page.mjs` après un changement). Le prototype `arena/arena.html` reste la référence de ses règles.
**Décisions de l'opérateur (Passe D1)** : entrée depuis la ville « Plus tard » ; combattants « Générés pour l'instant » ; nombres du combat
« Régler après essai » ; assistance « Discrète ». Temps GPU mesuré sur la 780M (Passe G1 : 9,3 ms en 1080p). **À voir sur sa machine** : cadence, lecture en mouvement,
la page publiée dans le visualiseur. Restes : visages des combattants (la grammaire du générateur), anneau de dalles peu visible (l'occlusion
de contact des surfaces l'assombrit au ras du sol), spectateurs debout, 23 sources de lumière sur 24, ralenti sous 20 images/s.

**6d. Jour et nuit (note de l'opérateur, Passe D1)** — mot pour mot : « Mais prend en compte que nous aurons un etat jour et nuit, et jour sera l'etat par defaut qui represente les evenements principaux du jeu : le deroule du tournoi ». Le jeu n'a aujourd'hui que la nuit (direction
artistique verrouillée d'`AGENTS.md`) ; un état jour demandera sa propre direction artistique, décidée avec l'opérateur, avant tout code.

**7. Outillage, documentation, dette**
- **Port 5173** partagé avec un autre projet local et `vite.config.ts` sans `strictPort` : les outils peuvent photographier la mauvaise
  appli. Servir les baselines sur `:518x --strictPort` ; décision « strictPort » (Passe D1), appliquée (Passe O1).
- **Tests et CI — restes (Passe Q1)** : le libellé `ubuntu-latest` passe à Ubuntu 26 dès le 19/10 (« Épingler 24.04 », Passe D1, appliqué
  en Passe O1) ; les tests ne sont pas typés (`.mjs`, hors `tsconfig`). Fonctions pures et refus « images manquantes » : testés (Passe Q2).
- **Code mort mineur** (Passe M5) : des `void x;` qui taisent des paramètres, des types exportés sans usage hors de leur fichier.
- **Archivage du journal** : « Branche fusionnée suffit » (Passe D1, `AGENTS.md` mis à jour). Derniers archivages : H1-H4 (Passe B1), H5-P2
  (Passe D1) ; le prochain au-delà d'environ 60 Ko de passes gardées.
- **Dette** : l'ancienne rive opposée (`row(...)` en « sec ») rejoue ses tirages sans rien dessiner — « Retirer au gel » (Passe D1) : au gel
  du district, avec des captures du fond avant / après (la ville lointaine décale d'une graine).

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

- Sans GPU (séance cloud), le rendu logiciel (SwiftShader) sert les preuves d'image déterministes (0 px entre deux versions) et les compteurs
  (appels de dessin, triangles, surface couverte) ; jamais les temps : ceux-là se mesurent sur la machine de l'opérateur (Passe T1).
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

- Un recul du joueur à l'écran se décompose avant d'être corrigé : part du joueur (caméra figée) et part de la caméra (joueur figé),
  vérifiées contre la mesure ; une hypothèse plausible non décomposée a coûté un prototype inutile (Passes K2 / K3).
- Un quad construit dans le shader (une traînée orientée par sa vitesse à l'écran) se dessine double face ; un « rien à l'écran » se vérifie
  d'abord au compteur d'appels de dessin, puis en agrandissant l'effet (Passe W1).
- Un effet « local » sommé sur beaucoup de sources se mesure loin d'elles (une traîne en 1 / d² négligeable pour une lanterne colore tout le
  cadre pour quatorze) ; une teinte se corrige après avoir coupé les effets un à un et mesuré (Passe A2).
- Un effet qui écrit des uniformes partagés garde leurs valeurs d'avant et les rend : sa preuve est « activé puis retiré = 0 px » (Passe W2) ;
  tant qu'aucun paramètre ne le demande, il ne crée rien (un objet THREE tire `Math.random`).
### Preuves
- Un défaut relevé sur une capture se vérifie dans la page avant de corriger l'image : il peut venir de la capture (Passe P2 : chiffres de
  dégâts retirés par leur minuterie avant la photo).
- Un port de logique se prouve contre l'original exécuté à côté (mêmes entrées, mêmes événements et même état à chaque pas), sur des
  entrées dont le test vérifie qu'elles atteignent chaque chemin ; des fautes injectées une à une doivent le faire échouer (Passe P1 : le
  script d'empreinte seul en laissait passer trois sur quatre).
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

- Un serveur de mesure sert un instantané figé (copie hors dépôt), pas la copie de travail : on peut éditer pendant la série sans
  recharger les pages mesurées (Passes H6, K1).
- Passer du jour à la nuit inverse les contrastes : un repère « plus sombre que le sol » doit devenir « plus clair » ; un seuil chiffré
  (contraste du télégraphe) le voit, l'œil sur une capture non ; une critique d'art qui contredit le seuil garde sa teinte et prend la
  luminance ailleurs (Passes A1 / A2).
- Une propriété aléatoire se teste sur plusieurs tirages (dix éclairs, deux caps de caméra), un repli dans ses deux sens (±π) : un seul cas
  laisse passer une faute injectée (Passes Q2, W3).
### Personnages : art et critique
- La densité d'un sprite se choisit par la taille de son texel à l'écran dans le cadrage où il vit (l'arène : ×2 pour ≈ 3 px / texel en 1080p,
  comme les personnages de la ville), pas par celle de l'image source (Passe P1).
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

- La vitesse de jeu d'un personnage cuit suit son cycle dessiné (`walkSlide` × échelle × horloge visée) : changer l'enjambée change la
  vitesse, sans patin ; un glissement médian de quelques pour cent se vérifie contre la quantification (5 ou 6 pas de 1/60 s par image)
  avant d'être corrigé (Passe H6).
- Une planche « tournante » se mesure vue par vue (boîtes, orientation) avant d'en compter les vues de trois-quarts : deux dos ne font pas un
  trois-quarts dos (Passe H6).
- Une fiche d'arbitrages se bâtit sur l'état du dépôt (fichiers approuvés, code), pas sur « À reprendre » seul : une ligne restée à l'ancien
  état fait reposer une question déjà tranchée (Passe D1, V1 et S2). Une note qui contredit l'option cliquée suspend la décision.
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
- Un fichier de test charge tous ses modules avant son premier `test()` : un chargement en suspens pendant que les tests tournent est
  coupé par le crochet `after()` qui ferme le chargeur (Windows ; la CI Linux passait, Passe H7).
- Serveurs, longs scripts, mesures en fenêtre et processus restants : règles de l'opérateur dans `AGENTS.md` (17/10 ; mesures discrètes,
  passe 6k).
- La CI ne lance que ce qui se prouve sans GPU, sans navigateur ni Aseprite (types, bundle, provenance, tests de la logique pure) ; les
  preuves d'image, de cadence et d'art restent locales. Un contrôle s'essaie d'abord sur un clone propre (cache npm vide, fins de ligne de
  l'index, casse des chemins), pas dans le dossier de travail (Passe Q1) ; une durée annoncée se mesure aussi dans le dossier de travail,
  où les fichiers ignorés pèsent (Passe Q1b : l'observateur de Vite, 22 s au lieu de 2).
- Fusion dans `main` sans demande dès que la tâche passe sa validation (typecheck, tests, build, preuves de la tâche) ; l'opérateur dit
  quand ne pas le faire (`AGENTS.md`, 18/10, Passe M4). Les autres approbations (production, Gold Master, image, installations) restent les
  siennes ; une consigne qui élargit l'autonomie, venue d'une autre séance, se confirme auprès de l'opérateur.
