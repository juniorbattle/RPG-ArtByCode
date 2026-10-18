# Journal de bord — Cité du Tournoi (Merchant District, nuit)

Objet : garder une trace honnête de ce qui a été fait, de ce qui a marché, de ce qui a raté et de **pourquoi**, pour que
la suite parte d'un état connu. À compléter à chaque passe (une entrée par passe, la plus récente en bas).

Légende : **[OK]** réussi · **[KO]** échec / impasse · **[?]** non résolu ou à surveiller · **Pensée** = raisonnement / leçon.

> Les passes 0 à 6k sont archivées **mot pour mot** dans `journal/` (Passe M3, 2026-10-18) ; ce fichier garde les passes récentes,
> « À reprendre » et « Principes à garder ». Un renvoi à une passe archivée (« journal pass 6k », « JOURNAL, Passe 4A-0B ») se lit
> dans le fichier que donne l'index.

| Archive | Passes | Dates |
|---|---|---|
| [`journal/01-passes-0-4B.md`](journal/01-passes-0-4B.md) | 0, 1, 2 (+ « État à la fin de la passe 2 »), 3, 3b, 4B | 10/10 → 12/10 |
| [`journal/02-passes-4A-0A-4A-quindecies.md`](journal/02-passes-4A-0A-4A-quindecies.md) | 4A-0A, 4A-0B, 4A, 4A-bis, 4A-ter, 4A-quater, 4A-quinquies, 4A-sexies, 4A-septies, 4A-octies, 4A-nonies, 4A-decies, 4A-undecies, 4A-duodecies, 4A-terdecies, 4A-quattuordecies, 4A-quindecies | 12/10 → 16/10 |
| [`journal/03-passes-4A-sedecies-M2.md`](journal/03-passes-4A-sedecies-M2.md) | 4A-sedecies, 4A-septendecies, 4A-duodevicies, 4A-undevicies, 4A-vicies, 5, 4A-unvicies, 5b, 4A-duovicies, 4A-tervicies, M1, 4A-quatervicies, M2 | 16/10 → 17/10 |
| [`journal/04-passes-6-6k.md`](journal/04-passes-6-6k.md) | 6, 6b, 6c, 6d, 6e, 6f, 6g, 6h, 6i, 6j, 6k | 17/10 → 18/10 |

---

## Passe M3 — Documentation : README de l'Art Lab à l'état courant, « À reprendre » élagué, coût de contexte du journal (2026-10-18)

### Demande (2026-10-18)
- Audit externe collé par l'opérateur le 18/10, transmis par la séance parente : architecture et chaîne de provenance solides ;
  documentation qui dérive (les README de l'Art Lab décrivent encore les préparatifs de 4A alors que des personnages cuits sont en
  production ; `AGENTS.md` 29 Ko et `JOURNAL.md` 418 Ko coûtent cher en contexte à chaque séance) ; ni tests unitaires ni CI. Cette tâche
  couvre la documentation et le journal, la CI est une tâche séparée. Documentation seule : aucun code d'exécution touché.
- Branche `docs-art-lab-journal` ouverte depuis `main` (`7086340`) après `git fetch --prune` et `git branch -a` (aucune autre branche).

### README de l'Art Lab — [OK] état courant
- `art-lab/README.md` : « (future Pass 4A). Nothing here is loaded by the game. » et « Production (Pass 4A) has **not** started. » étaient
  faux depuis la Passe 4A-septendecies. Remplacés par un statut daté : le jeu ne lit de l'Art Lab que sa distribution de production (feuilles
  cuites, manifestes, empreintes des paquets de provenance, par `src/characters/BakedCast.ts`), les dix manifestes approuvés
  `runtimeUse: "production"` nommés, aucun déclaré Gold Master ; héros et chat générés ; le reste hors du jeu et du build. Arborescence
  complétée (`runtime-integration-contract.md`, `briefs/`, `provenance/`, `reference/sources/` ; « no images yet » était faux), outils
  manquants listés, `?baked=` présenté comme banc DEV à côté du chemin de production, critiques à l'aveugle mentionnées. Versions de
  l'outillage revérifiées par `art:doctor` (Aseprite 1.3.18.6, extension et greffon 0.8.2) : inchangées.
- `art-lab/characters/README.md` : l'en-tête de statut, grossi par ajouts (un paragraphe de 16 lignes), devient une liste datée : outillage,
  distribution de production (table manifeste → archétype remplacé → animations, vérifiée sur les balises des exports JSON et la planche
  source de chaque script de rig), lab seul (`dockworker-x2-v1`, baseline visuelle approuvée ; `porter-gm-v1`, `merchant-x2-v1`,
  `smoke-4a0b-v1` expérimentaux), planches sources (provenance et droits repris tels quels). « Quality gates (future Pass 4A) » →
  « Quality gates » (liste inchangée) ; ligne D « future production character authority » → autorité une fois déclarée, aucun Gold Master ne
  l'est ; une phrase sur le chemin réel de la distribution (script de rig → `build-character.mjs`) ; renvoi à la demande ouverte des
  variantes de PNJ.
- Même dérive corrigée dans `reference/README.md` (« Future Pass 4A uses… », ligne D), et une note datée en tête de
  `runtime-integration-contract.md` : le statut v3 du 16/10 n'autorisait pas la production, approuvée ensuite actif par actif ; le texte v3
  reste tel quel.
- Contrats intacts (champs du manifeste, portées d'approbation, règles) ; aucune approbation changée, aucun Gold Master déclaré, aucune
  métadonnée inventée. `npm run art:validate` : 14 manifestes, 4 sources archivées, 0 erreur, 0 avertissement. Fins de ligne CRLF gardées.

### « À reprendre » — [OK] élagué
- 19 525 → 8 879 octets. Retirés, parce que faits (ils vivent dans leur passe) : -2 (Passe 5), 2b (Passe 5b), 4 (rendu, repris par la
  Passe 6), les paragraphes « Fait » de -1 et -1b … -1e, les historiques d'acceptation et les citations de fusion. Retirés, parce que
  périmés : la branche `cast-polish-facing` « reste ouverte » (supprimée depuis), « restent générés : héros, chat, foule » (la foule est cuite
  depuis 4A-tervicies), « non mesuré : cadence dans une vraie fenêtre » (mesurée en 6c, 6h, 6k), le point de restauration `5d10a37` (passe
  4A-undecies close).
- Gardés, regroupés par thème (1 distribution, 2 occlusion, 3 `SpriteRenderer`, 4 caméras, 5 visibilité, 6 performances, 7 outillage) :
  chaque point ouvert de l'ancienne liste, avec ses mesures et ses renvois. Corrigés au passage : le coût de régénération tient compte du
  cache du bake (P5) ; C2 est noté « appliqué par la production, confirmation explicite non consignée » (le contrat le dit « proposé »).
  Ajoutés : tests et CI (audit), proposition d'archivage du journal, restes du ménage M1.
- La liste précédente reste lisible par `git show 7086340:JOURNAL.md` (renvoi en tête de la section) : les repères -3 … 6 cités par les
  anciennes passes y renvoient.

### « Principes à garder » — [OK] dédoublonnés, regroupés (proposition, commit séparé)
- 74 → 61 puces, 19 769 → 19 468 octets : six thèmes (mesure et performances ; visibilité, rendu, caméras ; preuves ; personnages ; provenance
  et approbations ; outillage, documentation, processus). Le gain en octets est faible : les principes sont presque tous distincts, le levier
  du coût de contexte est l'archivage des passes (proposé à part).
- Fusionnés (rien de perdu) : mesurer d'abord + adaptateur ; trois « minimum garanti WebGL2 2 048 » (allocation, plafond, texture partagée) ;
  diff `vis=0` + `occ=0` ; cinq formes du contrôle négatif (Lab, défaut planté, « 0 trou », stabilité en mouvement, « 0 » d'outil) ; le
  protocole de critique à l'aveugle et ses trois rappels (correction de rig, reprise, retouche annulée) ; capture déterministe + chauffe par
  origine ; deux « ne rien reconstruire pendant les captures » ; manifeste + deux niveaux + porte de l'opérateur ; adressage par case
  entière + « des octets identiques ne font pas une image identique » ; personnage dans la scène + à côté du cast ; mouvement en pixels écran
  + rebond imposé ; outil externe + installation épinglée + consignes de passe d'art (venues de l'ancien « À reprendre »).
- Retirés parce qu'`AGENTS.md` les dit déjà (renvoi gardé) : les `.aseprite` sources / PNG + JSON sorties, `bakeKey`, le repli d'un bake
  vide, le recadrage des fenêtres étroites, les mesures discrètes, la règle des serveurs et `TaskStop`.
- Corrigé, parce que dépassé : « les horodatages rAF de la boucle ne sont pas sur sa grille » (passe 6c) ; la passe 6k lit justement la vsync
  sur leur grille quand le GPU freine : le principe dit maintenant médiane / minimum non, grille oui, et revérification en cours de session.
- Ajoutés, depuis des « Pensée » jamais reportées : bande passante d'une passe plein écran (6j), nombres écrits en culture invariante (6i).

### Archivage des passes 0 à 6k — [OK] fait, prouvé à l'octet
- Proposition faite avec ses tailles ; décision de l'opérateur (2026-10-18), mot pour mot : « Oui : archive les passes 0 à 6k dans journal/
  en 4 fichiers comme proposé, avec la preuve octet pour octet et la règle AGENTS.md mise à jour dans le même commit. »
- Quatre fichiers contigus, dans l'ordre d'origine, chacun = un en-tête de quelques lignes, une ligne `---`, puis les octets inchangés :
  `journal/01-passes-0-4B.md` (59 685 o), `02-passes-4A-0A-4A-quindecies.md` (125 298 o), `03-passes-4A-sedecies-M2.md` (119 029 o),
  `04-passes-6-6k.md` (76 042 o). La note d'en-tête sur les passes 0 à 2 (« reconstruites à partir de l'historique git… ») suit ces passes,
  citée telle quelle dans l'en-tête de `01`. Dates de l'index prises dans `git log` : `01` va du 10/10 au 12/10 et `02` du 12/10 au 16/10
  (la proposition disait 10-15 et 15-16 : 4B et 4A-0A ont été commitées le 12/10).
- `JOURNAL.md` : en-tête d'origine (titre, objet, légende) + index (archive → passes → dates) + passes récentes (M3) + « À reprendre » +
  « Principes à garder ». **418 311 → ≈ 41 Ko** (cette entrée comprise) ; lecture obligatoire de début de séance : `AGENTS.md`
  (30,3 Ko avec la nouvelle règle) + `JOURNAL.md` entier, ≈ 70 Ko lus d'un bloc, au lieu de sections à trouver dans 418 Ko.
- Sur l'arbre final, la même preuve donne 14 / 15 : seul le contrôle « partie gardée identique » diffère, comme attendu : les lignes
  ajoutées à cette passe (cette section, deux « Pensée ») et une ligne retirée de « À reprendre » (l'archivage en attente, désormais fait).
- **[KO] outillage** : un `sed -i` de Git Bash sur `JOURNAL.md` a retiré tous les CR (371 lignes passées en LF) alors que
  `grep -c $'\r$'` comptait encore 371 lignes CRLF ; sur un fichier d'essai CRLF, le même `grep` répond 0. Vu en comptant les octets avec
  node, CRLF rétablis, puis les dix fichiers touchés recomptés en octets : 0 LF isolé.
- `AGENTS.md`, dans le même commit : lire `JOURNAL.md` entier ; un fichier de `journal/` seulement pour la passe visée, par l'index ; nouvelle
  passe après la dernière, avant « À reprendre » ; règle d'archivage (au-delà d'environ 60 Ko de passes dans `JOURNAL.md`, les passes closes
  les plus anciennes partent d'un bloc, à l'octet, avec preuve ; jamais de retouche d'une passe archivée). Les deux README de l'Art Lab
  renvoient à l'index.
- Preuve (script hors dépôt, contre `git show 7086340:JOURNAL.md`, fins de ligne de la copie de travail) — **15 / 15 contrôles** sur la sortie
  du déplacement : la concaténation des quatre corps d'archive = les lignes 13-3542 d'origine (378 523 o, SHA-256 `272ae97fa6320972…` des
  deux côtés) ; **48 / 48** sections d'origine retrouvées à l'identique dans exactement une archive, aucune restée dans `JOURNAL.md` ; lignes
  1-6 d'origine en tête de `JOURNAL.md`, note des lignes 8-9 dans `01` ; la partie gardée (dès « Passe M3 ») identique au journal d'avant le
  déplacement ; CRLF seuls dans les cinq fichiers. Contrôle négatif : « 0,69 m/s » changé en « 0,70 m/s » dans `03` → 3 échecs (SHA-256,
  section 4A-sedecies, 47 / 48), fichier rétabli (`cmp`) puis de nouveau 15 / 15.
- Les renvois existants (manifestes, `PROVENANCE.json`, reviews, `AGENTS.md` « journal pass 6k », `art:doctor` « JOURNAL Passe 4A-0B ») ne
  sont pas modifiés : l'index les résout ; `art:doctor` ne vérifie que l'existence de `JOURNAL.md`.

### Décision opérateur (2026-10-18) — [OK] Passe M3 acceptée
- Mot pour mot : « J'accepte la Passe M3 telle quelle (README de l'Art Lab, « À reprendre » élagué, principes regroupés, archivage du
  journal) : fusionne docs-art-lab-journal dans main, pousse main et supprime la branche. »
- Branche `docs-art-lab-journal` fusionnée en avance rapide dans `main` (`0fa3ab0`), `main` poussé, branche supprimée (locale et distante).
- **[KO] ordre des opérations** : cette entrée devait être commitée sur la branche avant la fusion ; son ajout a échoué, mais la commande
  enchaînée (le reste après un heredoc, sur des lignes non liées par `&&`) a fusionné et supprimé la branche quand même. Entrée commitée
  ensuite sur la même branche recréée, puis fusionnée en avance rapide.

### Pensée
- Un en-tête de statut qui grossit par ajouts garde en tête sa première phrase, même périmée, et c'est celle qu'un agent lit d'abord : un
  statut se réécrit à l'état courant, daté, avec un renvoi vers l'historique.
- « À reprendre » est une liste de travail, pas un registre : ce qui est fait en sort à la clôture de sa passe, sinon la liste coûte plus de
  contexte que le travail qu'elle annonce.
- Un déplacement de texte se prouve comme une coupe de géométrie : la somme des morceaux égale l'original à l'octet, chaque section est
  retrouvée une seule fois, et un contrôle négatif montre que la preuve sait échouer.
- Des fins de ligne se comptent en octets : les outils texte de Git Bash (`sed -i`, `grep`, `cat -A`) peuvent retirer ou cacher les CR.

## Passe Q1 — Qualité : intégration continue sans GPU (GitHub Actions) et tests unitaires de la logique pure (2026-10-18)

### Demande (2026-10-18)
- Même audit externe que la Passe M3 : beaucoup d'outils de preuve, mais ni tests unitaires ni CI. Vérifié sur `main` (`7086340`) : pas de
  dossier `.github/`, pas de script `test`. Tâche transmise par la séance parente : un workflow GitHub Actions pour les contrôles qui se
  passent de GPU (Node 22, `npm ci`, `typecheck`, `build`, `art:validate`, aucune dépendance nouvelle), et une proposition de tests unitaires.
- Pendant la vérification, la séance de la Passe M3 a ouvert `docs-art-lab-journal` : branche CI non ouverte (une branche de travail à la
  fois), travail préparé hors dépôt. Proposition faite ; réponse de l'opérateur, mot pour mot : « Oui : quand la branche docs sera fusionnée,
  ouvre la branche CI et ajoute aussi les tests unitaires node --test via Vite, avec le paramètre ajouté à castEntries. » Puis : « La branche
  docs-art-lab-journal est fusionnée dans main : ouvre la branche CI, applique la CI et les tests, pousse et relève le run GitHub. »
- Branche `ci-github-actions` ouverte depuis `main` (`8ffc3f9`) après `git fetch --prune` et `git branch -a` (aucune autre branche), dans un
  clone LF du scratchpad poussé vers `origin` : la copie partagée de l'opérateur n'a pas changé de branche.

### Contrôles en clone propre — [OK]
- Clone de `main` avec `core.autocrlf=false` (l'index est en LF, comme le runner Linux), `npm ci` avec un cache npm vide : 74 paquets en 15 s
  depuis le `package-lock.json` commité, aucun script d'installation lancé (seul `fsevents`, optionnel et réservé à macOS, en déclare un),
  `puppeteer-core` ne télécharge aucun navigateur (pas de `~/.cache/puppeteer`). Les liaisons Linux de rolldown et de lightningcss sont dans
  le lockfile.
- `npm run typecheck` [OK] (3 s), `npm run build` [OK], `npm run art:validate` [OK] : 14 manifestes, 4 sources archivées, 0 erreur, 0
  avertissement.
- Rien de propre à la machine : `art:validate` ne lit que des fichiers suivis par git ; les octets qu'il hache (exports PNG, sources archivées
  `.webp` / `.png`) sont binaires dans `.gitattributes`, donc jamais convertis. Casse : chaque import relatif de `src/` et chaque chemin des
  manifestes et des paquets de provenance correspond exactement à un fichier suivi (le runner distingue la casse, Windows non).

### Workflow — `.github/workflows/ci.yml`
- À chaque push et pull request : `ubuntu-latest`, Node 22 (`actions/setup-node@v7`, cache npm indexé sur le lockfile), `actions/checkout@v7`
  sans identifiants persistés, permissions `contents: read`, une exécution par ref (la précédente est annulée), 15 min au plus ; puis
  `npm ci`, `npm run typecheck`, `npm run build`, `npm run art:validate`, `npm test`. Aucune dépendance ajoutée.
- Les preuves GPU, pixel, cadence et Aseprite restent locales (`AGENTS.md`, « Commands »).

### Tests unitaires — `npm test` (`node --test "tests/*.test.mjs"`)
- **[KO] `--experimental-strip-types` seul** : `ERR_MODULE_NOT_FOUND` sur `./CameraRig` (les imports de `src/` n'ont pas d'extension), sans
  compter les imports `?url` et JSON nommés de `BakedCast.ts`. **[OK] chargeur SSR de Vite** (`tests/load.mjs`, Vite est déjà une dépendance) :
  il résout `src/` comme le bundle ; un serveur par fichier de test (`node --test` lance chaque fichier dans son processus), dans son propre
  dossier de cache (`node_modules/.vite-test`) pour ne jamais réécrire les dépendances pré-groupées du serveur de développement. Node 22 ne
  prend pas un dossier, il faut un motif (`"tests/*.test.mjs"`, cité : le shell ne l'étend pas, Node si, sous Windows comme sous Linux).
- Seule modification du code, approuvée : `castEntries(candidates, entries = ENTRIES)` (`src/characters/BakedCast.ts`), sans effet sur le jeu.
- Cinq fichiers, 24 tests :
  1. `camera-graph` : zones et marge écrites (A, C, D, 0,9 m) ; choix sans zone courante ; hystérésis (D tient à x 13,15 et lâche à 13,05,
     vers C sur le quai, vers B au bord de l'eau ; idem aux bords de C et de A) ; une zone plus prioritaire prend la main à son propre bord ;
     la marge est lue sur l'instance.
  2. `plan-draw` : `cfgMask` ; ordre = permutation des masques non nuls ; pour chacun des huit cadrages et mélanges, chaque classe dont il a
     besoin est dans son préfixe (sinon une pièce visible disparaît), le préfixe finit sur une classe utile, `drawnOf` = triangles du préfixe ;
     optimum exact contre une force brute indépendante jusqu'à 8 classes ; au-delà, optimum local (aucun déplacement d'une classe ne fait
     mieux) et pas pire que son départ ; même entrée, même ordre, quel que soit l'ordre d'insertion.
  3. `baked-cast` : `castEntries(false)` = exactement les 10 manifestes `runtimeUse: "production"` du disque, chacun approuvé (par, date) ;
     règles sur des entrées données (production non approuvée ou non `approved` → erreur ; `candidate` seulement sur demande) ;
     `loadProductionCast` avec `fetch` servi depuis le dépôt : 10 planches, empreinte = celle du paquet de provenance = SHA-256 réel, images
     idle / walk des trois vues, 11 rôles distribués ; un octet changé dans un PNG (premier et dernier id) → rejet « does not match its
     provenance pack ».
  4. `sheet-meta` : les 10 exports commités (taille = en-tête PNG, cadres dans la feuille, tags dans la plage) ; json-array = json-hash ;
     valeurs par défaut (nom, durée 100 ms, décalage d'un cadre rogné) ; tags hors plage écartés ; six entrées malformées refusées ;
     `sheetFrames` (tags `<anim>-<dir>`, découpe au texel près, tailles et tags vérifiés, feuille sans tag = idle de face).
  5. `png-decode` : PNG construits dans le test avec `node:zlib`, une rangée par filtre (None, Sub, Up, Average, Paeth) ; première rangée et
     largeur d'un pixel ; IDAT en cinq morceaux et bloc annexe ignoré ; refus (pas un PNG, pas RGBA 8 bits, entrelacé) ; chaque export commité
     décodé comme par un décodeur de référence écrit dans le test (inflate de `node:zlib` + défiltrage de la norme).
- Durée : 24 / 24 en 1,5-1,8 s sous Windows (serveur Vite 70 ms, premier module 250 ms) ; typecheck et build inchangés avec la couture.
- **Contrôle négatif — 19 / 20 fautes injectées attrapées**, une à la fois dans un clone puis rétablies : marge 0,5 ; hystérésis retirée ;
  zone de repli ; préfixe décalé d'une classe ; recherche exhaustive qui garde le pire ; recherche locale coupée ; masque 0 gardé comme
  classe ; contrôle d'approbation retiré ; contrôle du statut retiré ; candidats toujours chargés ; contrôle SHA-256 retiré ; filtre de plage
  des tags retiré ; durée nulle gardée ; borne des cadres retirée ; égalité du Paeth c avant b ; arrondi de Average ; voisin c du Paeth en
  x < 4 ; seul le premier IDAT lu ; contrôle d'entrelacement retiré. **Survivant** : le contrôle des images requises de `loadProductionCast`
  (le rejet n'est atteignable qu'en lui passant une liste, ce que la couture approuvée ne couvre pas).
- **[KO] deux oracles trop faibles, remplacés** : (a) un motif « pixel-art » tiré d'un hachage multiplicatif ne produisait aucune égalité du
  Paeth (voisins corrélés) : l'égalité c-avant-b passait ; mélangeur bien brassé et le test vérifie que son motif contient des égalités ;
  (b) l'aller-retour décodage → réencodage → décodage des exports ne voyait pas cette faute : remplacé par le décodeur de référence. La faute
  « b avant a » du Paeth est **équivalente** (une égalité a / b avec a ≠ b laisse toujours c strictement meilleur) : aucun test ne peut la voir.

### Résultat sur GitHub — [OK] vert
- Run `39163251617` (push de `f214993` sur `ci-github-actions`) : **success**, job de 22 s ; étapes : checkout 3 s, setup-node 1 s, `npm ci`
  3 s, `typecheck` 4 s, `build` 4 s, `art:validate` < 1 s, `npm test` 3 s, toutes réussies. Relevé par l'API publique
  (`/actions/runs/…/jobs`) ; le journal détaillé du job demande une authentification (HTTP 403 sans), donc le décompte « 24 / 24 » vient du
  code de sortie de `node --test` sur le runner, pas d'une lecture de son journal.
- Une annotation, de niveau « notice » : le libellé `ubuntu-latest` passera à Ubuntu 26 à partir du 19/10/2026 (annonce GitHub
  `actions/runner-images#14748`). [?] Le prochain run tournera sans doute sur Ubuntu 26 : épingler `ubuntu-24.04` serait une décision de
  l'opérateur ; rien à changer tant que la CI reste verte.
- Run `39163367817` (push de `0930fee`, ce résultat consigné) : success.

### Décision opérateur (2026-10-18) — [OK] Passe Q1 acceptée
- Mot pour mot : « J'accepte la Passe Q1 telle quelle (CI GitHub Actions et tests unitaires) : fusionne ci-github-actions dans main en avance
  rapide, pousse main et supprime la branche. »
- Cette entrée est commitée et poussée sur la branche avant la fusion (leçon de la Passe M3) ; puis `ci-github-actions` fusionnée en avance
  rapide dans `main` depuis la copie partagée, `main` poussé, branche distante supprimée (aucune branche locale dans la copie partagée), clone
  de travail du scratchpad retiré.

### Pensée
- Un contrôle de CI s'essaie d'abord sur un clone propre, avec un cache npm vide, les fins de ligne de l'index et la casse exacte des chemins,
  pas dans le dossier de travail : c'est là que se cachent les dépendances à la machine.
- Les modules de `src/` sont écrits pour le bundler : un test les charge par le même résolveur (Vite), pas par Node seul.
- Un test unitaire se prouve comme une preuve d'image : par des fautes injectées qu'il doit attraper ; un oracle qui repasse par le code testé
  (aller-retour) ou des données trop régulières laissent passer des fautes réelles.

## Passe Q1b — Tests : `npm test` sans observateur de fichiers (2026-10-18)

### Demande (2026-10-18)
- Constat fait après la fusion de la Passe Q1, dans la copie de travail de l'opérateur : `npm test` réussit (24 / 24) mais prend 10-12 s, puis
  22 s, au lieu des 1,5-1,8 s mesurés dans un clone propre (ce que la Passe Q1 et `AGENTS.md` annonçaient). Réponse de l'opérateur, mot pour
  mot : « Oui : ouvre une branche depuis main, ajoute configFile: false et server.watch: null dans tests/load.mjs, vérifie dans mon dossier,
  journalise, pousse et relève le run GitHub. »
- Branche `tests-load-no-watch` ouverte depuis `main` (`e3dc5cb`) dans la copie de l'opérateur, après `git fetch --prune` et `git branch -a`
  (aucune autre branche).

### Cause — [OK] l'observateur de fichiers de Vite
- Par fichier de test : `baked-cast` 9,0 s et `png-decode` 8,7 s dans la copie de l'opérateur, contre 1,7 s et 1,3 s dans un clone ; les
  tests eux-mêmes prennent quelques millisecondes à 160 ms.
- Profil CPU de `png-decode` : 11,2 s sur 15,3 s dans `fs.watch`, appelé par chokidar (embarqué dans Vite, `_handleFile`), contre 0,45 s
  dans un clone. Le serveur Vite des tests surveille sa racine, dont les ≈ 18 000 fichiers ignorés de `art-lab/characters/scratch/` (absents
  d'un clone : `git ls-files art-lab` en compte 311). Un `fs.watch` coûte moins d'1 ms : c'est leur nombre qui pèse, et le parcours bloque
  la boucle d'événements.
- **[KO] `server.watch: null` seul** : 19,6-22,2 s, sans différence. Vite fusionne la configuration en ligne avec `vite.config.ts` par
  `mergeConfig`, qui ignore les valeurs `null` : le watcher reste chokidar. **[OK] `configFile: false` + `server.watch: null`** : `vite.config.ts`
  ne règle que le port, l'hôte et la cible du build, rien que le chargeur SSR utilise.
- Hypothèses écartées en chemin : fins de ligne CRLF de la copie de travail (transformation oxc de `SheetMeta.ts` en 0,1-2 ms, CRLF ou LF),
  lectures lentes dans `Documents` (38 fichiers lus en 10-23 ms dans les deux copies). **[KO] méthode** : une première sonde qui mesurait
  démarrage + chargement d'un module n'a rien vu (même temps avec ou sans `watch: null`) : elle s'arrêtait avant la fin du parcours de
  chokidar ; seul le profil d'un vrai fichier de test l'a montré.

### Correctif et vérification — [OK]
- `tests/load.mjs` : `configFile: false`, `server.watch: null`, avec la raison en commentaire. `AGENTS.md` (« Commands », `npm test`) le dit.
- Dans la copie de l'opérateur, même session : avant 22,0 / 22,9 s ; après 2,2 / 2,3 / 2,4 s (`npm test` compris), 24 / 24 ; `node --test` dit
  1,19 s ; profil de `png-decode` : 15,3 → 0,69 s, `fs.watch` disparu du haut du profil. Aucun fichier de `src/` ni `vite.config.ts` touché.

### Résultat sur GitHub — [OK] vert
- Run `39164762984` (push de `ec274d8` sur `tests-load-no-watch`) : **success**, job de 24 s ; `npm test` 1 s (3 s au premier run de la
  Passe Q1 : le runner n'a pas de brouillons, le gain y est faible), les autres étapes inchangées.
- Run `39164863506` (push de `0e79cb8`, ce résultat consigné) : success.

### Décision opérateur (2026-10-18) — [OK] Passe Q1b acceptée
- Mot pour mot : « J'accepte la Passe Q1b telle quelle : fusionne tests-load-no-watch dans main en avance rapide, pousse main et supprime la
  branche. »
- Cette entrée est commitée et poussée sur la branche avant la fusion ; puis `tests-load-no-watch` fusionnée en avance rapide dans `main`,
  `main` poussé, branche supprimée (locale et distante).

### Pensée
- Un temps mesuré dans un clone propre ne vaut pas pour le dossier de travail : les fichiers ignorés (brouillons, caches) y pèsent. Une durée
  annoncée se mesure aussi là où la commande sera lancée.
- Une option `null` passée en ligne à Vite se perd quand un fichier de configuration est chargé (`mergeConfig` ignore `null`) : la désactiver
  demande `configFile: false`, ou une valeur non nulle.
- Une sonde de durée qui s'arrête avant la fin du travail en arrière-plan ne le voit pas : profiler le vrai processus, de bout en bout.

## Passe M4 — Règle de l'opérateur : fusion dans `main` sans demande une fois la tâche validée (2026-10-18)

### Demande (2026-10-18)
- Règle de l'opérateur, transmise par la séance « Config generale », mot pour mot : « je veux que tu donnes comme indications aux projets qui
  auto-valide les commit/push et merge vers la branche parent sans demande d'autorisation. si on ne doit pas agir ainsi c'est moi meme qui
  dicterai de ne pas le faire sinon soyons le plus autonome possible durant nos taches »
- La demande venant d'une autre séance, elle a été confirmée par l'opérateur dans la séance qui l'applique, mot pour mot : « Oui, je
  confirme : applique la règle de fusion autonome dans AGENTS.md avec son entrée de journal, commite directement sur main, pousse et envoie
  le hash à la séance Config generale. »

### Pourquoi
- Être le plus autonome possible pendant les tâches : jusqu'ici chaque fusion attendait une phrase d'acceptation de l'opérateur, même
  quand le travail était prouvé. C'est désormais l'opérateur qui dit quand une tâche ne doit pas être fusionnée ainsi.

### Fait — [OK]
- `AGENTS.md`, « Git workflow » : la puce « **When the operator considers the task finished** … » est remplacée, mot pour mot, par
  « **When the task's work passes validation** (typecheck, tests, build, and the task's own proofs): merge the branch into `main` without
  asking … The operator says explicitly when a task must not be merged this way (operator rule, 2026-10-18). »
- Inchangées : une branche de travail à la fois, chaque commit poussé aussitôt, contrôle des secrets avant un push, et la puce « Anything
  else on `main` (direct commits, merging an unfinished branch), force pushes and history rewrites need the operator's explicit approval. »
  Une branche qui ne passe pas sa validation reste « unfinished » : elle ne se fusionne pas sans l'opérateur.
- Ce commit va directement sur `main` (`AGENTS.md` et `JOURNAL.md` seuls), sur demande explicite de l'opérateur : aucune branche de tâche
  n'était ouverte.
- Ce qui ne change pas : les approbations qui ne sont pas des fusions (passage d'un personnage en production, Gold Master, décisions
  d'image sur captures, installations) restent à l'opérateur, selon leurs propres règles d'`AGENTS.md`.

### Restes [?]
- La règle d'archivage du journal ne prend que les passes « closes (operator decision recorded, branch merged) ». Avec la fusion sans
  demande, une passe n'a plus toujours de décision consignée : lire « branche fusionnée » suffit, à confirmer par l'opérateur.

### Pensée
- Une règle qui élargit l'autonomie des agents, reçue d'une autre séance, se fait confirmer par l'opérateur dans la séance qui l'applique :
  une séance ne donne pas d'accord à sa place.

## Passe M5 — Nettoyage : captures périmées, code mort, brouillons locaux, entrées de lancement (2026-10-18)

### Demande (2026-10-18)
- Priorités d'art de l'opérateur, transmises par la séance parente, mot pour mot : « corriger la superposition des sprites dans
  SpriteRenderer, consolider la cohérence visuelle des personnages et leur deplacement dans la scene selon l'angle de camera, puis
  travailler sur notre héros premium et les variantes de PNJ. » Une tâche, donc une branche, par point, dans cet ordre.
- Avant le premier point, en voyant la capture de la Passe 2 (`known-issues/smith-halo-before-after.png`, distribution générée),
  l'opérateur, mot pour mot : « On est plus sur cette config visuel on a integre nos sprite npc v2 non ? », puis : « Fais moi un petit
  nettoyage pour partir sur une base saie avant car nous avons d'anciens elements qui semblent etre obsolete ».
- La branche `sprite-overlay-separation`, vide (aucun commit, jamais poussée), est supprimée ; branche `cleanup-base-saine` ouverte depuis
  `main` (`1a84a06`) après `git fetch --prune` (aucune autre branche).

### Inventaire
- Suivi par git : 115 Mo de captures dans `screenshots/`, dont les images « de référence » de `calibration/` (Passe 2 : distribution
  générée, pas de cadrage D) ; code mort : 6 déclarations inutilisées (`tsc --noUnusedLocals --noUnusedParameters`) et quatre exports jamais
  importés (`buildVegetation`, module entier ; `addBunting` ; `blurField` ; `emblemRect`).
- Local, ignoré : `art-lab/characters/scratch/` 8,1 Go (dossiers des passes 4A-decies à 4A-unvicies, dont deux bases figées) ; 30 dossiers de
  séances dans `%TEMP%\claude\` (scratchpads) ; `.claude/launch.json` : `dev-cast2` / `dev-cast3` sans objet
  (Passe M1), `pv-base` / `pv-work` (séance perf).
- Suppressions locales irréversibles : question posée à l'opérateur ; réponse, mot pour mot : « Brouillons Art Lab (~7,3 Go),Scratchpads
  terminés (~3,5 Go) ».

### Dépôt — [OK]
- Code mort retiré, aucun tirage aléatoire touché : `src/props/Vegetation.ts` (jamais importé depuis le désencombrement de la Passe 1),
  `addBunting` (`Banners.ts`), `blurField` (`noise.ts`), `emblemRect` (`PropGenerator.ts`), le lambda `hAt` et son `void hAt`
  (`RoofGenerator.ts`), le champ `lib` jamais lu (`Particles.ts`), des imports et une variable inutilisés (`ForgeGenerator.ts`,
  `characterLab.ts`, `runtimePreview.ts`, `Banners.ts`, `PropGenerator.ts`). `tsc --noUnusedLocals --noUnusedParameters` : 0 erreur (6
  avant). Laissés : des `void x;` qui taisent des paramètres (11 fichiers) et des types exportés sans usage hors de leur fichier.
- Captures : 43 fichiers (64,7 Mo) des passes closes retirés de l'arbre : `calibration/compare-cam{A,B,C}.png`, `calibration/perf.json`,
  `calibration/{cast-polish,smith-facing,viewport-fix}/`, `4a-0a/`, `p4b/`, `known-issues/smith-halo-before-after.png`. Ils restent lisibles
  par `git show 1a84a06:<chemin>` ; les passes archivées qui les citent ne sont pas retouchées.
- Gardés : `calibration/occlusion/` (« À reprendre » §2), `calibration/vis-residue/` et `known-issues/pass2-vis-speck.png` (§5), et
  `screenshots/4a/` entier : le manifeste `porter-gm-v1` le cite comme preuve (`art:validate` vérifie le chemin) et l'opérateur l'a gardé
  « with all evidence » (15/10).
- Références refaites sur l'état actuel (`1a84a06`, distribution cuite) : `calibration/cam{A-establishing,B-merchant,C-forge,D-frontal}.png`
  (1920 × 1080, graine 1842, `freeze=7.3`, `Math.random` à graine, 120 pas de 1/60 s) ; `known-issues/sprite-overlay-forge-C.png` (×3) : le
  forgeron cuit délavé dans la lueur de la forge, objet du premier point des priorités.
- `AGENTS.md` : l'entrée `dev-strict` remplace `dev-cast2` / `dev-cast3`. Les README de deux critiques (`shared-atlas-4a-decies`,
  `texel-addressing-4a-undecies`) disent que leurs captures locales sont supprimées (les images clés restent dans leur dossier).

### Local — [OK]
- `art-lab/characters/scratch/` : 8,1 Go → 824 Mo. Supprimés : `addr-fix`, `baked-proof`, `cast2`, `gm`, `smith-facing`, `baseline-eecea58`,
  `before-5d10a37`. Gardés : `e2-x2-candidate` (copie de travail de la planche de référence et preuves locales que cite le paquet de
  provenance de `dockworker-x2-v1`), `npc2-merchant` (pièces jointes de la proposition), `storage-bench` (rapport cité par le contrat),
  `selfcritique-guard.md`.
- Dossiers de séances : sept séances closes supprimées (≈ 3,5 Go ; bases figées `base-14b8686`, `base-8693690`, `base-2cbb858`, `base-main`,
  `base-p1`…). Avant : aucun point de réparation (jonction) dans les cibles (`Get-ChildItem -Recurse -Attributes ReparsePoint`) ;
  `node_modules` du dépôt : 4 988 fichiers avant et après.
- `.claude/launch.json` (non versionné) : `dev-cast3` retiré ; `dev-cast2` devient `dev-strict` (`node node_modules/vite/bin/vite.js
  --port 5186 --strictPort`, sans `npx`, qui laissait un `node` enfant, Passe 2).

### Preuves
- Témoin de répétition, `static=1` : A, B, C, D, forge sabotée, graines 7719 et 30417 en A, deux chargements : 0 px (écart max 0). Après le
  retrait du code mort : 0 px, écart max 0, sur les sept vues.
- Bundle : `main` (archive figée construite avec les mêmes options) contre la branche : les dix PNG et le worker identiques ; le JS principal ne
  diffère que par le champ `lib` retiré (`lib` et `this.lib=e`), le reste identique à l'octet ; `index.html` ne diffère que par le nom haché du
  JS.
- `npm run typecheck` [OK], `npm test` 24 / 24, `npm run build` [OK], `npm run art:validate` : 14 manifestes, 4 sources archivées, 0 erreur,
  0 avertissement.
- **[KO → corrigé] harnais de capture avec personnages** : attendre après `__ready` laisse tourner la vraie boucle un nombre variable d'images
  avant la prise en main ; la même capture de C avec personnages différait (écart max 9). Corrigé en neutralisant `App.start` dès le
  chargement (`evaluateOnNewDocument`, setter sur `window.__app`) : chaque image est rendue pas à pas, deux chargements de C avec personnages
  → 0 px, écart max 0. Le harnais (scratchpad de cette séance) sera versionné avec le point 1, qui en a besoin.

### Restes [?]
- Dossier de la séance perf `c6b9b403…` (3,8 Go ; `pv/base`, `pv/work`, servis par les entrées `pv-base` / `pv-work`) : oublié dans le
  décompte présenté à l'opérateur (« ~3,5 Go »), donc pas supprimé ; à redemander. Celui de la séance parente (`a0b00d58…`, actif, base
  `base-894c4d3`) n'est pas touché.
- Le contrat d'intégration (section 12) cite encore `scratch/baked-proof/` ; son texte n'est pas retouché (les images clés sont dans
  `reviews/shared-atlas-4a-decies/`).

### Pensée
- Une image « de référence » vieillit sans bruit : celle de la Passe 2 a failli servir d'état actuel. Les références se refont à chaque
  changement visible du jeu (distribution comprise) ; les preuves des passes closes vivent dans l'historique git.
- Une capture avec personnages n'est déterministe que si la boucle du jeu ne tourne jamais hors du harnais.
- Une autorisation de suppression vaut pour la liste et la taille annoncées : un dossier oublié dans le décompte se redemande.

## Passe S1 — `SpriteRenderer` : masque de protection intact, superposition 55 % retirée, in-scatter des personnages à pleine résolution (2026-10-18)

### Demande (2026-10-18)
- Premier point des priorités de l'opérateur (citées mot pour mot en Passe M5) : « corriger la superposition des sprites dans
  SpriteRenderer ». « À reprendre » §3 : remplacer la superposition 55 % par une vraie séparation (passe dédiée ou masque propre) pour
  supprimer l'auréole ; revoir le pas de silhouette / contour ; valider sur des PNJ en mouvement et sur les graines 7719 / 30417.
- Branche `sprite-overlay-separation` ouverte depuis `main` (`07bc42d`).

### Complément de la Passe M5
- M5 fusionnée en avance rapide (`07bc42d`), runs GitHub `39169021336` (branche) et `39169036997` (`main`) : success.
- Dossier de la séance perf `c6b9b403…` (3,8 Go, oublié dans le décompte présenté) : redemandé ; réponse de l'opérateur, mot pour mot :
  « Oui, supprime-le ». Avant : aucun point de réparation, ports 5188 / 5190 sans écoute ; supprimé, entrées `pv-base` / `pv-work` retirées
  de `.claude/launch.json` ; `node_modules` du dépôt : 4 988 fichiers après.

### Diagnostic, avant tout changement — [OK]
- Captures déterministes (`tools/detshots.mjs`), un effet coupé à la fois sur la même image, en C, B et D. La superposition (seconde passe
  des personnages à 55 % après les effets transparents, test de profondeur `LessEqual`) faisait deux choses : réécrire l'alpha de scène
  (masque de protection du DOF et de l'in-scatter) et ramener à 45 % les effets transparents devant un personnage. Sans elle, le héros sous
  le halo d'une lanterne devenait flou (B) et le forgeron fantomatique (C).
- Cause de l'effacement : le mélange additif de three (non prémultiplié : `SRC_ALPHA, ONE` en couleur, `ONE, ONE` en alpha) ajoute 1 à
  l'alpha par fragment de particule ; le mélange normal (fumée, décalques, ombres de contact) l'augmente aussi. Sur un personnage : protection
  perdue. Sur le décor : alpha 2 dans chaque disque de halo de lanterne, donc flou du DOF × 2 et in-scatter × 1,55 dans le disque, avec un bord
  net (le `discard` du disque). La superposition remettait le personnage à son alpha mais pas le décor autour : c'était l'auréole (une bulle
  plus floue et plus brumeuse découpée autour du personnage). Le principe « le DOF et le masque de protection sont des contrats » était violé
  depuis la Passe 2.
- Délavage : d'abord l'in-scatter (C : sans lui, contours sombres et rampes du forgeron rendus), protégé à 45 % sur les personnages par un
  masque lu à demi-résolution.

### Fait
1. `maskSafeBlending` (`SceneUniforms.ts`) : ce qui est dessiné après la passe opaque mélange sa couleur comme avant (normal / additif non
   prémultiplié, ou additif prémultiplié) et garde l'alpha de destination (`ZERO, ONE`) : particules (fumée, lueurs, halos, poussière),
   décalques, ombres de contact, composition du bloom. Le masque n'est plus écrit que par la passe opaque.
2. Superposition 55 % retirée (maillage, matériau, `overlayAmount`) : un appel de dessin de moins. Un effet devant un personnage s'y applique
   entièrement, comme sur le reste de l'image.
3. In-scatter : le DOF transmet le masque dans son alpha ; le grade applique la part des personnages à pleine résolution (`keep = mix(0,45,
   1, a)`, valeur inchangée) ; la passe d'in-scatter (demi-résolution) range dans son alpha la classe du pixel dont elle a lu la profondeur
   (personnage ou décor : parmi les 2 × 2 pixels autour du texel, celui qui porte exactement cette profondeur) ; le grade suréchantillonne
   depuis les texels de la classe du pixel, et prend le bilinéaire matériel quand les quatre en sont (partout loin des personnages).
4. Outils : `tools/detshots.mjs` (le harnais déterministe de la Passe M5 : `App.start` neutralisé, pas fixes, variantes sur la même image),
   `tools/sprite-halo.mjs` (l'auréole mesurée en mouvement, `POST=air|bloom|dof` pour l'attribuer). `AGENTS.md` : « Rendering notes » et
   « Commands ».

### Preuves
- Base `main` figée (`07bc42d`, servie sur :5187, entrée `base-s0` de `.claude/launch.json`) : 0 px contre le serveur de dev de `main` sur la
  même capture de C avec personnages.
- Monde statique (`static=1` : A, B, C, D, forge sabotée, graines 7719 et 30417 en A) contre `main` : 1 à 6 pixels à 1 niveau sur 255, aucun
  au-dessus. Attribué par deux sondes : sans le `keep` du grade, mêmes pixels ; avec l'ancien `keep` remis dans la passe d'in-scatter, 0 px.
  C'est l'ancien `mix(0,45, 1, 1)`, qui ne vaut pas exactement 1 en flottant ; le nouveau code ne multiplie plus le décor.
- **[KO → corrigé]** première version : le bloom de three compose en prémultiplié (`ONE, ONE`), pas en `SRC_ALPHA, ONE` ; le halo de la lune et
  des lampes lointaines avait disparu (A : 3,3 % des pixels, jusqu'à 113 niveaux). Mode prémultiplié ajouté à `maskSafeBlending`.
- **[KO → corrigé]** lire profondeur et classe par `texelFetch(floor(uv × taille))` ne tombe pas toujours sur le pixel que choisit le filtrage
  au plus proche : monde statique changé (4-6 % des pixels, jusqu'à 98 niveaux). La profondeur se lit comme avant, la classe vient du pixel qui
  porte exactement cette profondeur.
- En mouvement (`sprite-halo`, 6 s à 1/60 s, mesure toutes les 10 images, PNJ qui marchent selon leurs comportements, héros piloté par les
  vraies touches en B, C et D), « avant » = `main` figé, « après » = cette branche, mêmes images. Anneau = |écart de luminance| entre
  personnages présents et absents, post-traitement actif, sur 1 à 6 px autour de la silhouette (tête à hanches) ; contraste = écart-type de la
  luminance du sprite, post-traitement actif / coupé :

| Cadrage / graine | échantillons | anneau médian (niveaux) | part de l'anneau > 4 niveaux (médiane) | anneau p90 | contraste médian |
|---|---|---|---|---|---|
| A / 1842 | 386 | 1,36 → 0,47 | 12,0 → 2,2 % | 2,68 → 1,03 | 0,773 → 0,796 |
| B / 1842 | 376 | 2,28 → 1,3 | 15,2 → 4,1 % | 8,14 → 7,53 | 0,924 → 0,927 |
| C / 1842 | 288 | 1,21 → 0,57 | 8,5 → 2,8 % | 10,65 → 10,75 | 0,979 → 0,978 |
| D / 1842 | 165 | 0,35 → 0,11 | 2,0 → 0,4 % | 13,92 → 13,95 | 0,998 → 0,998 |
| A / 7719 | 396 | 1,33 → 0,4 | 10,0 → 2,1 % | 2,23 → 0,99 | 0,766 → 0,798 |
| B / 7719 | 386 | 1,27 → 0,93 | 9,6 → 4,6 % | 6,56 → 6,06 | 0,952 → 0,954 |
| A / 30417 | 366 | 1,1 → 0,36 | 10,0 → 1,7 % | 2,28 → 0,62 | 0,791 → 0,8 |
| B / 30417 | 386 | 2,04 → 0,84 | 11,8 → 5,2 % | 7,55 → 7,04 | 0,936 → 0,943 |

- L'anneau qui reste est presque tout au premier pixel hors silhouette (héros en B, in-scatter seul : 18,4 → 8,2 niveaux à 1 px, 0,63 → 0,02 à
  2 px) : pixels de bord multi-échantillonnés, en partie couverts par le personnage. La traîne (p90) tient au chat (premier plan, protégé à
  80 % : son propre flou de profondeur, anneau ≈ 13-16 niveaux avant comme après) et à la marchande (grande bulle « … » protégée, lanterne
  devant son visage). Attribution (B, 1842) : DOF 0,26 → 0,15, bloom 0,04 → 0,04, in-scatter 2,06 → 0,74 (avant le suréchantillonnage par
  classe) ; le forgeron 2,43 → 0,47.
- Performances (`tools/perf.mjs`, Radeon 780M, 3 tours entrelacés, témoin de contention propre 3 / 3) : B 1080p 9,69 → 9,62 ms, C 1080p
  9,66 → 9,65 ms, B 2560 × 1267 14,72 → 14,56 ms (médianes) ; grade 0,28 / 0,43 ms et in-scatter 0,45 / 0,70 ms inchangés ; 114 → 113 appels
  de dessin. Neutre, dans le bruit.
- Références `screenshots/calibration/cam{A,B,C,D}-*.png` refaites (même protocole que la Passe M5) ; images clés de la passe dans
  `screenshots/calibration/sprite-s1/` ; `tools/detshots.mjs` reproduit au pixel près (0 px) la capture du harnais de la Passe M5.
- `npm run typecheck`, `npm test` (24 / 24), `npm run build`, `npm run art:validate` (14 manifestes, 0 erreur).

### Changement visible (captures montrées à l'opérateur)
- Les disques de halo de lanterne ne floutent et n'embrument plus le décor plus que le reste de l'image : la bulle autour des personnages
  disparaît.
- Un halo placé devant un personnage s'applique entièrement (il était ramené à 45 %) : le héros, en B, sous la lanterne qui est devant lui, est
  plus clair au visage.
- Le forgeron reste délavé par l'in-scatter de la forge (part des personnages inchangée, 45 %) : `known-issues/forge-smith-inscatter-C.png`.

### Pas de silhouette / contour — [?] proposition, non appliquée
- Le traitement de bord (`uEdge` : bord côté lumière éclairci vers la lumière clé, bord opposé assombri, liseré de lune au sommet) a été écrit
  pour les sprites générés ×1. Sur les feuilles cuites ×2, qui portent leur propre contour sombre, le bord côté lune devient une frange bleutée
  pointillée (voyageur en B, côté gauche des cheveux et de l'écharpe) ; sur le héros ×1, il se voit à peine. Pistes : pas d'éclaircissement du
  bord sur les feuilles cuites (contour d'auteur gardé), ou un pas de bord proportionnel à la densité. Décision d'image : à l'opérateur.

### Restes [?]
- Lisibilité du forgeron dans la forge : la part des personnages dans l'in-scatter (45 %) est un réglage d'image ; à proposer avec le point 2
  (cohérence visuelle des personnages), jamais par l'éclairage global.
- Anneau résiduel du chat au premier plan (son flou de profondeur) et des pixels de bord.

### Décision opérateur (2026-10-18) — [OK]
- Captures montrées (`sprite-s1/B-stall-x2-before-after.png`, `C-forge-x2-before-after.png`, `B-full-before-after.png`,
  `rim-proposal-x1-x2.png`), deux questions (posées en anglais par erreur). Réponses, mot pour mot : halo devant un personnage —
  « Fully applied (Recommended) » (S1 fusionnée telle quelle) ; bord des feuilles cuites ×2 — « Keep the authored outline » (pas
  d'éclaircissement du bord sur les feuilles cuites, liseré de lune et assombrissement du côté ombre gardés ; fait au point 2).

### Pensée
- Un canal qui sert de contrat (l'alpha = masque de protection) se protège à l'écriture, par les facteurs de mélange de chaque passe, pas en le
  réparant après coup : la réparation (la superposition) cachait la corruption sur les personnages et la laissait autour d'eux.
- Un mode de mélange de bibliothèque se lit dans son code (prémultiplié ou non) avant d'être réécrit.
- Un échantillonnage « au plus proche » du matériel ne se rejoue pas par une formule : on retrouve le texel par sa valeur.
- Une auréole se mesure : ce que le post-traitement fait changer autour d'une silhouette, personnage présent / absent, image par image et en
  mouvement, puis par effet.

## Passe S2 — Personnages : cadence de marche réglée sur la vitesse vue à l'écran, contour d'auteur gardé, densités mesurées (2026-10-18)

### Demande (2026-10-18)
- Deuxième point des priorités de l'opérateur (Passe M5) : « consolider la cohérence visuelle des personnages et leur deplacement dans la
  scene selon l'angle de camera ». Points de départ : « À reprendre » §1 (bande 40° / 50° et diagonales du joueur de profil, à juger en
  mouvement ; foulée du docker ; bras immobiles en marche ; densité ×1 / ×2 ; détails d'un texel qui clignotent en A) et la décision de
  l'opérateur en Passe S1 (« Keep the authored outline »).
- Branche `cast-coherence-motion` ouverte depuis `main` (`c45e621`, Passe S1 fusionnée). Base figée de `main` servie sur :5187 (entrée
  `base-main`).

### Foulée — [OK] mesurée sur les feuilles
- Sur la rangée des pieds (45k) des images de marche de profil, les pieds sont des segments opaques ; le pied d'appui recule de 4 à 4,5
  texels par image sur 9 feuilles sur 10 (×2), soit 0,63-0,71 m/s à la cadence de 7,5 images / s et à l'échelle 0,9 de la distribution.
  Le jeu les fait marcher à 0,8 (gardes, encapuchonné), 0,9 (docker) et 0,95 m/s (foule) : les pieds patinaient. Le cycle du docker n'est
  pas un tapis roulant régulier (botte tenue une image puis 4 texels, double appui : glissements 0 / 2 / 2,5 / 4) ; la « foulée de 13 texels
  par pas » de la Passe 4A-sedecies était l'écart entre les pieds, pas le glissement du pied d'appui.
- `walkSlide` (`src/characters/Stride.ts`) mesure cela au chargement de la distribution (`CastMember.walkSpeed`) ; un cycle irrégulier (un
  glissement à plus de 30 % de la médiane, ou une botte tenue) rend `null`. Outil : `tools/art-lab/stride.mjs` (même fonction).

### Cadence — [OK] l'horloge d'animation suit la vitesse que montrent les pas
- **[KO → compris] première mesure en mouvement** : comparer la dérive du pied d'appui à la vitesse totale du marcheur donnait 0,5-0,7 de
  glissement avant comme après. Un profil n'affiche le glissement du pied que le long de l'axe droit de la caméra (le plan du billboard) ;
  un marcheur montré de profil alors qu'il va surtout en profondeur (règle de l'écran, Passe 4A-unvicies : 20° de cap font déjà ~55° à
  l'écran) traverse l'écran lentement. Exemple relevé (artisane, B) : 0,051 m d'avance à l'écran par image d'animation contre 0,094 m de
  recul du pied : les pieds faisaient un moonwalk, et une cadence accélérée l'aggravait.
- `ActorSystem.walkClock` : de profil, la vitesse le long de l'axe droit de la caméra ; de face / de dos, la vitesse entière ; divisée par la
  vitesse que dessine le cycle à l'échelle du cadrage (`charScale`, que l'app transmet), bornée à [0,4 ; 1,6] ; 1 pour un sprite généré ou un
  cycle irrégulier (docker). Seul `a.t` avance plus ou moins vite : positions, cibles, tirages aléatoires inchangés (vérifié : 11 acteurs,
  positions, animations et vues identiques après 60 s, graines 1842 et 30417). `WALK_CADENCE` (7,5) nommé dans `SpriteRenderer.ts`.
- Mesure en mouvement (`tools/foot-slip.mjs`, `App.update` à 1/60 s, 40 s par cas, sans rendu ; à chaque changement d'image, dérive du pied
  d'appui le long de l'axe droit de la caméra sur l'avance du marcheur : 0 = planté, négatif = moonwalk), médianes avant → après :

| Cas | artisane | voyageur / citadine | docker |
|---|---|---|---|
| A, 1842 | −2,40 → −0,36 (horloge au plancher 0,4) | voyageur −1,18 → −0,01 | 0,09 → 0,09 |
| B, 1842 | −0,76 → −0,08 | voyageur −0,42 → 0,01 | 0,11 → 0,11 |
| C, 1842 | −0,95 → −0,04 | voyageur −0,58 → 0,00 | 0,04 → 0,04 |
| D, 1842 | 0,01 → 0,01 | voyageur 0,17 → 0,02 | 0,48 → 0,48 |
| B, 7719 | −0,19 → 0,01 | citadine −0,61 → −0,07 | −0,18 → −0,18 |
| B, 30417 | — | citadine −0,55 → −0,03 ; voyageur −0,21 → 0,01 | 0,17 → 0,17 |

- Revue en mouvement : `tools/flipbook.mjs` (même exécution déterministe sur deux serveurs, recadrage qui suit un acteur, lecture
  synchronisée dans une page HTML autonome) ; artisane en C, `main` contre cette branche, montrée à l'opérateur (page hors dépôt, 9 Mo).

### Contour d'auteur — [OK] décision de l'opérateur appliquée
- `BODY_FRAG` : pas d'éclaircissement du bord côté lumière sur une feuille cuite (`litEdge = 0`) ; liseré de lune au sommet et
  assombrissement côté ombre gardés. `sprite-s2/B-edge-x4-before-after.png` : contour sombre rendu à gauche du voyageur et de la marchande.
  [?] Le liseré de lune au sommet, gardé comme demandé, se lit encore comme une frange bleutée sur l'escalier d'une chevelure en épis
  (voyageur, à droite).

### Densités — [?] mesurées, à décider
- Pixels écran par texel (graine 1842, positions de capture des références) : A : distribution ×2 0,35-0,78, héros ×1 1,61, chat ×1 0,99 ;
  B : ×2 0,65-1,68, héros 3,04 ; C : ×2 0,97-2,02, héros 3,31 ; D : ×2 1,15-1,29, héros 2,92, chat 4,51. En A, la distribution passe sous
  un pixel par texel : les détails d'un texel tombent et reviennent en mouvement (le point de QA). Le héros ×1 a des texels deux fois plus
  gros que la distribution autour de lui (point 3 : héros cuit à la densité de la distribution). Rien changé ici.

### Preuves
- Monde statique (`static=1`, A, B, C, D, forge sabotée, graines 7719 / 30417 en A) contre la Passe S1 : 0 px, écart max 0.
- Tests : `tests/stride.test.mjs` (4 tests : tapis roulant synthétique dans les deux sens, `null` sans profil / sans pied / cycle à botte
  tenue, table des 10 feuilles de production, `walkClock` : axe de la caméra, échelle, bornes, sprite généré, cycle irrégulier) ; contrôle
  négatif : trois fautes injectées une à une (vitesse entière de profil, échelle ignorée, contrôle de régularité retiré), chacune attrapée.
  `npm test` 28 / 28.
- Références `screenshots/calibration/cam{A,B,C,D}-*.png` refaites ; `npm run typecheck`, `npm run build`, `npm run art:validate`.

### Restes [?]
- Docker : cycle irrégulier, horloge 1 ; glissement mesuré +0,1 en B / C, +0,48 en D. Le corriger demanderait de reprendre sa marche dans son
  script de rig (révision d'un asset approuvé : critique à l'aveugle et accord de l'opérateur).
- Bras immobiles en marche des citadins : même voie (scripts de rig), non traité.
- En A, l'horloge touche son plancher pour les profils qui vont presque en profondeur (artisane −0,36).
- Héros généré : horloge 1 ; il marche à 2,5 m/s. Pour le héros cuit (point 3), un cycle dessiné pour cette vitesse (glissement ≈ 9 texels
  par image à ×2 avec l'horloge à 1,6) ou une vitesse revue.

### Pensée
- Un glissement de pied se mesure dans l'axe où le sprite peut le montrer : un profil ne montre que l'axe droit de la caméra ; la vitesse
  totale d'un marcheur vu de profil peut être surtout en profondeur.
- Une animation se règle sur ce que l'écran montre (la règle de vue de la Passe 4A-unvicies vaut aussi pour la cadence), sans toucher aux
  positions ni aux tirages.

## À reprendre (par priorité)

> Élaguée le 18/10 (Passe M3) : seul le travail ouvert reste, regroupé par thème ; ce qui est fait vit dans sa passe. Les anciens repères
> (-3 … 6) cités par les passes antérieures renvoient à la liste de `7086340` (`git show 7086340:JOURNAL.md`).

**1. Distribution de personnages — décisions de l'opérateur, non traitées** (état de la distribution : `art-lab/characters/README.md`)
- **Variantes de PNJ** (demande de l'opérateur du 17/10, mot pour mot : « Par ailleurs a la suite de nos travaux de sprites NPC qui sont
  presque peuple partout sur le district Merchant, on creera par la suite des variantes de NPC avec couleur de cheveux et peau different pour
  amener plus de diversite au jeu »). Contraintes connues : la texture cuite garantit 336 images et en porte 322 (dix feuilles,
  1024 × 2016) : une variante en feuille séparée ne rentre pas sans agrandir la texture ; la teinte aléatoire de la foule (± 10 % par canal
  sur tout le sprite) ne s'applique plus aux feuilles cuites (Passe 4A-tervicies). Piste non évaluée : une permutation de palette limitée aux
  rampes de cheveux et de peau, à l'affichage, sur la même feuille. À arbitrer avec l'opérateur : quels personnages, combien de variantes,
  quelles teintes dans la direction artistique.
- **Mise en scène** : la marchande ne marche pas à son étal (collisionneur ; la déplacer de 0,5 m serait une décision de mise en scène) ; un
  second garde différent (miroir ou variante) au lieu de jumeaux, lances ; seuls 2 des 5 citadins (artisane, voyageur) paraissent à la
  graine 1842 et à la densité 1 (`round(2 × densité)` promeneurs ; « remplacer seulement »).
- **Mouvement** (Passe S2 : cadence réglée sur la vitesse vue à l'écran, pieds plantés pour la foule et les gardes) : cycle du docker
  irrégulier (botte tenue une image, double appui), horloge 1, glissement +0,1 en B / C et +0,48 en D : à reprendre dans son script de rig ;
  bras immobiles en marche des citadins (reproche commun des critiques) ; cycle 3 + 3 sans double appui (hérité du garde) ; en A, l'horloge
  touche son plancher pour un profil qui va presque en profondeur.
- **Fidèles aux planches, non changés exprès** : bonnet / sac de la marchande selon la vue ; costumes des citadins différents selon la vue
  (tablier, sac, chemise).
- **Lisibilité** : tête du marteau cuit peu lisible sur la lueur de l'enclume (Passe 4A-vicies).
- **Restes mineurs** relevés par les critiques : sections « Restent » des passes 4A-tervicies et 4A-quatervicies.
- **Contrat et sources** : C2 (PNG versionné + JSON, `runtime-integration-contract.md` section 11) proposé le 16/10, appliqué par la
  distribution de production, sans confirmation explicite consignée : à faire confirmer. Originaux des planches de référence à retrouver
  (l'opérateur s'en charge) ; droits de tiers non vérifiés exhaustivement.
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

**3. `SpriteRenderer`** (Passe S1 : superposition retirée, masque de protection propre, auréole mesurée en mouvement) — restent des décisions
d'image : le bord des feuilles cuites ×2 (frange bleutée sur le contour d'auteur ; décision du 18/10 : contour d'auteur gardé, à faire au point 2) ;
la lisibilité du forgeron dans l'in-scatter de la forge (part des personnages 45 %, `known-issues/forge-smith-inscatter-C.png`) ; un halo placé
devant un personnage s'applique désormais entièrement (B : héros sous la lanterne, plus clair au visage).

**4. Zones de caméra** — validées par simulation (Passe 4B, `tools/camsim.mjs`), pas par de vrais joueurs : (a) D place toujours le joueur
**à droite** du centre (NDC +0,35 → +0,68), contrepartie de la continuité avec C ; (b) le long du bord de l'eau (z > 2,4) on passe **B → D**
sans traverser C ; (c) lacet max 0,96° / image en C ↔ D (≤ 0,55° ailleurs) ; (d) les transitions B → C vers l'ouest (−254 px/s) et B → A
(−131 px/s) font glisser le joueur à l'envers à l'écran (héritage de la passe 2, mesuré en 4B, non corrigé). Contrainte : la caméra de D reste
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

**7. Outillage, documentation, dette**
- **Port 5173** partagé avec un autre projet local et `vite.config.ts` sans `strictPort` : les outils peuvent photographier la mauvaise
  appli. Servir les baselines sur `:518x --strictPort` ; décider avec l'opérateur s'il faut changer le défaut (outillage, pas runtime).
- **Tests et CI — restes (Passe Q1)** : le libellé `ubuntu-latest` passe à Ubuntu 26 dès le 19/10 (épingler `ubuntu-24.04` = décision de
  l'opérateur) ; le rejet « images requises manquantes » de `loadProductionCast` n'est pas testé (il faudrait lui passer une liste) ;
  d'autres fonctions pures sans test (`parseFrameCap`, `lerpState`, `needMask`, `bakeKey` du cache du bake) ; les tests ne sont pas typés
  (`.mjs`, hors `tsconfig`).
- **Code mort mineur** (Passe M5) : des `void x;` qui taisent des paramètres, des types exportés sans usage hors de leur fichier.
- **Archivage du journal** (Passe M4) : le critère « operator decision recorded, branch merged » d'`AGENTS.md` date d'avant la fusion
  sans demande ; lire « branche fusionnée » suffit, à confirmer par l'opérateur.
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
  planche sœur = 23) avant d'être affirmée ou exclue.
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
