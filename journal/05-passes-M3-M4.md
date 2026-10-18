# Journal de bord — archive : passes M3 à M4 (2026-10-18)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-10-18 (Passe M6) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

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

