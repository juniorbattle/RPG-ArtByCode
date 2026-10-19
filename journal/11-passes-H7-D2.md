# Journal de bord — archive : passes H7, I1, G1, D1, O1, C2, K4, V5, H8, K5 et D2 (2026-10-19)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-10-19 (Passe Z2) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

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

## Passe V5 — Vues : la règle à cinq secteurs, avec repli par feuille, derrière `?views=5` (DEV) (décision H3) (2026-10-19)

### Demande
- Décision de l'opérateur (Passe D1), mot pour mot : H3 « Cinq vues, le héros d'abord ». L'étude recommandait d'abord la règle à cinq secteurs avec repli par feuille, derrière un paramètre DEV, prouvée à 0 px sur la production (`briefs/three-quarter-views.md` § 6).
- Branche `views-five-v5` depuis `main` (`0418f84`).

### Fait — [OK]
- `Dir` gagne deux valeurs, `downSide` (trois-quarts face) et `upSide` (trois-quarts dos), dessinées tournées vers la gauche comme le profil. `BakedSprites.DIRS34` les liste ; `BakedDecode` lit les étiquettes `<anim>-downSide` / `<anim>-upSide`. Le générateur, qui n'a pas de trois-quarts, les dessine comme la face ou le dos (aucun appel aujourd'hui).
- `fiveViewFacing` (`ActorSystem`) : l'angle du pas à l'écran depuis la verticale ; face / dos sous 22,5°, trois-quarts de 22,5 à 67,5°, profil au-delà (les secteurs de l'étude, `tools/step-angles.mjs`) ; chaque bord tenu 5° au-delà depuis le côté où est le marcheur ; les trois-quarts retournés vers la droite comme le profil.
- **Repli par feuille** : la règle ne s'applique qu'aux feuilles qui ont les deux trois-quarts, repos et marche ; tout autre sprite garde la règle à trois vues, inchangée. **Paramètre** : `?views=5`, DEV seulement (`import.meta.env.DEV`).
- Rien ne change dans le moteur de rendu : une image absente retombe déjà sur le profil puis le repos.

### Preuves
- `tests/views.test.mjs` (4) : secteurs ; bords tenus (un balayage 0 → 90 → 0° change 4 fois de vue, jamais d'aller-retour) ; repli (une feuille sans trois-quarts : les 72 caps donnent exactement les vues de la règle à trois vues, avec ou sans le paramètre ; une feuille avec trois-quarts sans le paramètre aussi) ; avec trois-quarts et le paramètre : les cinq vues paraissent, les deux miroirs aussi, face et dos jamais retournés. **Cinq fautes injectées une à une, toutes attrapées** : pas de repli, paramètre ignoré, bords non tenus, trois-quarts jamais retournés, bord à 30°.
- **Production** (captures déterministes avec personnages, graine 1842, `clean=1&freeze=7.3&vis=0`, 300 pas, Radeon 780M), la branche contre `main` figé (`0418f84`, :5187), A / B / C / D : **0 px** par défaut et **0 px** avec `?views=5` (aucune feuille de production n'a de trois-quarts).
- typecheck, `npm test` 86 / 86, build, `art:validate`.

### Restes [?]
- Le héros en cinq vues (décisions H1 / H4) : les feuilles de trois-quarts n'existent pas encore ; `build-character.mjs` (figé par empreinte dans tous les paquets) devra sortir leurs étiquettes. La règle par défaut, après la revue de l'opérateur en jeu.

### Pensée
- Une nouvelle règle de vue s'ajoute derrière un repli par feuille : sans les images qu'elle demande, un sprite garde exactement l'ancienne règle, et la production se prouve à 0 px avant même que l'art existe.

## Passe H8 — Héros : `hero-x2-v3`, candidat en cinq vues depuis la planche v4-b (décisions H1, H4, H3) (2026-10-19)

### Demande
- Décisions de l'opérateur (Passe D1), mot pour mot : H1 « Retouches d'abord (visage, palette) », H4 « Source : la b », H3 « Cinq vues, le
  héros d'abord », H2 « Sprint ×1,2 », H5 « Ignorées ». Branche `hero-x2-v3-h8` depuis `main` (`effc76e`).

### Outil — [OK] `build-character.mjs` sort les trois-quarts, sur demande
- Les facettes `downSide` / `upSide` sont reconstruites, quantifiées avec les autres (une palette commune), préparées, vérifiées et
  étiquetées (`<anim>-downSide`, `<anim>-upSide`) **seulement si le rig les nomme** (une boîte de vue ou un export gardé). Tout autre rig se
  construit comme avant.
- L'outil est figé par empreinte dans 12 paquets, dont les 10 de production. Les 12 sont reconstruits par `verify-provenance --rebuild` avec
  l'outil modifié : **12 / 12 « ok rebuild --check »**. Un premier passage avait filtré cette ligne par erreur ; il est relancé.
- Dans les 12 paquets, l'empreinte de l'outil est mise à jour avec une entrée `maintenance` (Passe H8, ancienne empreinte gardée), comme
  en Passe 4A-duodevicies. `verify-provenance` : intact.

### Construit — [OK] (`rigs/hero-x2-v3.rig.mjs`, candidat, `runtimeUse: "lab"`)
- **Source** : la planche v4-b (générée, non canonique, Passe I1), pas 3,4, `--holes --no-shadow --closing-from=48`. Les cinq vues de repos
  sont toutes tournées vers la gauche (face, trois-quarts face, profil, trois-quarts dos, dos), sur une palette de 64 couleurs commune.
- **Course de profil** : celle de `hero-x2-v2` (les huit images dessinées de la planche v3, enjambée de 14 texels, vol), ramenée sur la
  nouvelle palette. Le rig vérifie la SHA-256 de la planche v3 avant de s'en servir (deuxième source, consignée dans le paquet).
- **Courses de face, de dos et de trois-quarts** : le rig de face / dos de la v2 (rebond, poids, cape, jambes levées de 5 texels au plus,
  mains qui descendent). Les masques des jambes, des mains et de l'ourlet sont mesurés sur des cartes ASCII de chaque vue, par matière.
- **Export** : 60 images (repos 4, course 8, cinq facettes), feuille 384 × 960. `--check` reconstruit à l'identique ; `verify-provenance` :
  intact ; manifeste candidat ; `art:validate` : 17 manifestes, 0 erreur.
- **`BakedCast`** : l'entrée candidate (DEV `?cast=candidate`) montre maintenant `hero-x2-v3`. `hero-x2-v2` reste dans le dépôt, inchangé.
  Texture cuite : 322 + 60 images, sous les 672 garanties.

### Mesures — [OK]
- `walkSlide` 14 (la même course de profil) : 3,73 m/s, 4,48 m/s avec Maj. Glissement en mouvement : B −0,07, D −0,07 (la quantification).
- **Directions du clavier à l'écran** (le joueur aux points de référence des cadrages) :
  - w / s : 3° en B, 13° en C (face / dos), **33° en A et 35° en D** (secteur trois-quarts, avec `?views=5`) ;
  - les diagonales : 69 à 79° (profil).
  - Le héros au clavier montre donc ses trois-quarts surtout **en D et en A**, où la perspective décentre ses pas. La règle à trois vues y
    montrait un dos ou une face qui glissent en biais.
- Flipbooks en D (`KEYS=w`, `KEYS=s`, trois vues contre cinq) : avec cinq vues, le trois-quarts dos remplace le dos qui glisse.
- Revue : `reviews/hero-x2-v3/` (export, en scène B et D, courses de trois-quarts ×4, v2 contre v3 au repos ×3).

### Critique à l'aveugle
- **Méthode** :
  - un agent neuf, la v2 contre la v3, sous des étiquettes tirées au sort (la clé hors du dossier des images) ;
  - les mêmes planches ×3 : repos face / profil / dos, course de face, course de profil ; le docker approuvé comme référence ;
  - l'auto-critique écrite avant le verdict.
- **[OK, de peu] La v3 l'emporte** : environ 0,5 point en moyenne, confiance d'environ 65 %. Ses notes contre celles de la v2 :
  - silhouette 7,5 / 7 ;
  - palette et matières 6,5 / 5,5 (reflets des cheveux plus clairs, boucles dorées, semelles sombres) ;
  - contours 5,5 / 5 ;
  - course de face 5 / 4,5 ;
  - course de profil 7 / 6 (le genou de la 4e image n'est plus percé) ;
  - proportions 7 / 7.
- **[KO] L'objectif « visage » de la décision H1 n'est pas atteint : 6 contre 6,5**, la v2 devant.
  - Les yeux sont plus lisibles mais « mi-clos » : une ligne de cils sombre sur la rangée 24.
  - Il n'y a toujours pas de bouche, et la peau est d'un seul ton.
  - **Vérifié sur les pixels de la vue de face** : rangée 24 sombre aux colonnes 25-28 et 34-38 ; blancs des yeux en rangée 25 (colonnes
    26 et 37) ; aucun texel de bouche dans la peau des rangées 26-31. La petite bouche de la planche v4-b ne survit pas au pas de 3,4.
- **Contre le docker**, les deux candidats restent derrière en palette, contours et visage. Relevés communs aux deux :
  - la course de face se lit « sur place » (bras figés, jambes raides) ;
  - le poing figé à la poitrine en profil ;
  - le bruit du buste.
- **Mon choix, en attendant l'opérateur** :
  - aucune retouche empilée (« Principes à garder » : une retouche qui ne gagne pas nettement à l'aveugle ne s'empile pas) ;
  - la v3 reste le candidat présenté, puisque c'est la source choisie par l'opérateur et qu'elle apporte les cinq vues ;
  - la bouche et des yeux moins lourds se reprendraient au texel ou depuis une nouvelle source : décision de l'opérateur.

### Restes [?]
- La revue de l'opérateur en jeu : `npm run dev`, puis `?cast=candidate&views=5`. Rien n'est approuvé.
- Ensuite, au choix de l'opérateur :
  - la règle à cinq vues par défaut ;
  - les trois-quarts des PNJ (une source par personnage) ;
  - les masques des déclinaisons du héros.

### Pensée
- Un outil figé par empreinte dans des paquets approuvés s'étend par une option que seul un nouveau rig déclenche. La preuve, c'est la
  reconstruction à l'identique de chaque paquet, puis l'empreinte mise à jour avec sa note. Un filtre de sortie trop étroit peut cacher le
  verdict : lire la ligne entière une fois avant de filtrer.
- La valeur d'une vue se mesure sur les directions réelles du joueur : au clavier, la perspective place ses pas en trois-quarts en A et en D,
  pas en B.

## Passe K5 — Caméras : prototype du suivi qui vise la vitesse du joueur à l'écran (`?camfollow=screen`, décision K3) ; recalage du pivot de A cherché (K2) (2026-10-19)

### Demande
- Décisions de l'opérateur (Passe D1), mot pour mot : K3 « Prototyper le suivi à l'écran » ; K2 « Cherche et montre-moi ».
- Branche `camfollow-k5` depuis `main` (`2774d2d`).

### K3 — [OK] prototype derrière `?camfollow=screen` (absent : le suivi approuvé, inchangé)
- **Le principe** (`CameraGraph.holdFocus`) : quand D est à l'écran (posé, ou à un bout d'une transition), la garde compare deux déplacements du
  joueur à l'écran sur la même image.
  - le sien : la caméra de l'image précédente ;
  - le total : avec la pose de cette image.
  - Quand les deux ont des signes contraires, la caméra dépasse le joueur. Le foyer lissé ne garde alors que la plus grande part de son pas
    qui ne le fait pas reculer (dichotomie sur cette part, le poids de la transition laissé tel quel), puis rattrape par le lissage habituel.
  - Les poses restent celles du cadrage pour un autre foyer : la famille que le bake échantillonne déjà.
- **[KO → corrigé] première version** : la garde n'agissait qu'en D posé.
  - Effet en D posé : C → D passait de 36 images de recul à 1, D → C de 53 à 0.
  - Mais D → C empirait pendant la transition (−18 → −31 px/s) : le foyer retenu rattrapait son retard en pleine transition.
  - Étendue aux transitions qui touchent D.
- **Mesures** (`tools/camsim.mjs`, graine 1842, `vis=0`, joueur guidé vers un point, le scénario de la Passe K2), le suivi approuvé contre
  `?camfollow=screen` :

| marche | images de recul, approuvé | avec le prototype |
|---|---|---|
| C → D (8 / 1 vers 20 / 0,6) | 43 (7 en transition à −39 px/s, 36 posées à −40) | **0** |
| D → C | 63 (53 posées à −18, 10 en transition) | **0** |
| D → B, au bord de l'eau | 64 (62 posées à −25) | **0** |
| D vers l'est / l'ouest | 0 | 0 |

- Place du joueur à l'écran : NDC x 0,14 .. 0,47 au lieu de 0,14 .. 0,45 en C → D (le suivi ne fait que prendre du retard).
- **Défaut inchangé** : la sortie complète de `camsim` (six marches, JSON) est **identique à l'octet** entre `main` figé (`0418f84`) et la
  branche. Captures déterministes avec personnages (graine 1842, `clean=1&freeze=7.3&vis=0`, 300 pas), A / B / C / D, contre `main` figé : **0 px**.
- **Tests** : `tests/camera-graph.test.mjs` +1, sur la diagonale en profondeur de C vers D et retour, dans le graphe seul.
  - Le suivi approuvé recule en D posé : au moins 30 images par sens.
  - Avec le prototype : 0 en D posé, et au moins deux fois moins sur toute la marche.
  - Le joueur reste dans sa bande à l'écran.
  - **Trois fautes injectées, attrapées** : la garde jamais appelée, la garde active par défaut, le pas entier gardé.
- **[?] Restes du prototype** :
  - Dans le graphe seul, quelques images reculent encore pendant les transitions vers D et vers C : 9 et 5, contre 19 et 10. Là, le joueur
    qui marche en profondeur ne bouge presque pas à l'écran (−5 px/s), et c'est l'avancée du poids de la transition qui le déplace.
  - Le recul en C posé (13 images sur cette diagonale) n'est pas traité : la garde ne vise que D.
  - La visibilité des poses retardées n'est pas prouvée en mouvement (`viewport-proof` ne rejoue que des poses fixes).

### K2 — [OK] recherche ; la cause de la Passe K1 corrigée
- La Passe K1 attribuait le reste de +21 px/s de B → A à l'écart de place du joueur entre B (NDC x ≈ −0,37) et A (≈ −0,17). Mesuré ici, au
  bord de la zone (x −9,4 / −10,3, z 1), l'écart est faible : **B −0,21, A −0,22**. Les valeurs de K1 étaient l'étendue sur toute la marche.
- **Image par image**, dans le harnais des tests : le pic est **+20,7 px/s à t = 0,63 s** de la transition (x −10,96).
  - Avancer le pivot de A le long du quai (`home.x` 5,0 → 5,8) l'efface : **0 px/s**. Le joueur finit la transition 18 px plus à gauche.
  - Le reculer l'aggrave : 4,2 → +47 px/s, 3,5 → +69.
  - Le gain x de A à 0,75 le réduit à +7,5 px/s.
- **Planche avant / après** (captures déterministes, graine 1842, `camA=,,,,,5.8,,`, joueur en −12 / 1,2 et en −10,3 / 1) :
  `screenshots/calibration/k2-pivotA/A-pivot-5.0-vs-5.8.png`. La lune, le château, le pont et le canal restent ; la vue se décale de
  quelques pixels.
- **Décision à demander à l'opérateur** (cadrage approuvé) : pivot de A x 5,8. Le bake se refait de lui-même, la clé du cache change.

### Constat — [?] un recul au bord de l'eau, qui n'est pas dû à l'ancrage
- Une marche tenue sur d depuis C (9 / 0,6) gagne le bord de l'eau (z > 2,4), puis passe C → B. Pendant cette transition, **41 images
  reculent, jusqu'à −445 px/s** : −445 avec les transitions interpolées, −447 avec l'ancrage. Ce n'est donc pas une régression de K4.
- Le joueur reste presque bloqué contre le bord (fin en x 14,00, z 3,99) : la cause n'est pas mesurée.

### [KO → corrigé] procédure
- Le commit du code (`8d91352`) est parti sans cette entrée ni la ligne d'`AGENTS.md`.
  - Le script du journal avait échoué (une ancre présente deux fois).
  - La commande enchaînait pourtant les étapes par `;` au lieu de `&&` : la faute de la Passe M3.
- Le code fusionné était validé : typecheck, `npm test` 87 / 87, build, `art:validate`, et les preuves ci-dessus.
- Cette entrée et la ligne d'`AGENTS.md` suivent dans un commit à part, sans réécrire l'historique.
- Deux fichiers vides à la racine, nés d'une commande précédente (des accents graves lus par Bash comme une redirection), sont supprimés. Ils
  n'ont jamais été commités.

### Pensée
- Une garde sur le foyer, plutôt que sur la pose, garde les poses dans la famille que le bake connaît, et rattrape par le lissage existant.
  Limitée au cadrage posé, elle reportait le rattrapage sur la transition suivante.
- Une cause écrite d'après l'étendue d'une mesure (−0,37 / −0,17 sur toute la marche) se revérifie au point où le défaut se produit (le
  bord de la zone, l'instant du pic) avant d'en tirer un réglage.

## Passe D2 — Décision S1 : la marchande reste immobile à son étal (2026-10-19)

### Décision de l'opérateur, mot pour mot
- « S1 : la marchande reste immobile à son étal, comme aujourd'hui. Consigne-le. »
- Elle répond à la question reposée en Passe D1 : sur la fiche, l'opérateur avait choisi « La déplacer » avec la note « Mais la marchande
  n'est pas cense rester a son stand ? ».

### Effet
- Aucun changement de code : la marchande garde son point dans le collisionneur de l'étal ; elle reste debout et parle (Passe 4A-unvicies).
- « À reprendre » § 1 (Mise en scène) : la question est close.

### Pensée
- Une option cochée avec une note qui la contredit se tranche par une question courte, posée avec les faits ; ici, la décision confirme
  l'état du jeu.

