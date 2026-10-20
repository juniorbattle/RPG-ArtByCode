# Brief — séance cloud « Version jouable » de Cité du Tournoi

Ce brief est versionné dans `briefs/cloud-session-playable-brief.md` (journal, Passe N2). Relis-le après chaque compactage du contexte. Parle
et écris en français : journal, bilan, messages. Le code et l'interface du jeu sont en anglais.

## 0. Pleine autonomie

- **L'opérateur a éteint son ordinateur.** Ni lui ni aucune séance locale ne peut te répondre. Ne t'arrête jamais pour demander, n'attends
  aucune réponse : avance sur tout le brief, lot après lot, jusqu'au bilan.
- **Certaines décisions restent les siennes.** Tu ne les prends pas : tu les prépares derrière un paramètre d'URL, sans changer ce que le brief
  fixe, avec des captures et une recommandation. Tu les listes au journal et au bilan, puis tu continues. Ce sont :
  - l'approbation d'un art pour la production, et toute feuille cuite nouvelle ;
  - le Gold Master ;
  - le jour comme moment par défaut du district (J9 : la nuit le reste) ;
  - tout changement du contenu, des cadrages A / B / C / D, de la distribution ou de l'aspect du Merchant District, qui est clos ;
  - les installations, dont toute nouvelle dépendance npm ;
  - les verrous des contrats (« décision A3 »).
- **Toute autre décision technique** : prends l'option la plus sûre. Consigne-la au journal comme **choix de la séance**, avec ses raisons,
  jamais comme une décision de l'opérateur.
- **Un écart entre un contrat et le code** se consigne au journal ; il ne se tranche pas.

## 1. À lire d'abord, dans cet ordre

1. `AGENTS.md` : les règles du dépôt (branches, journal, preuves, art, outils).
2. `JOURNAL.md`, **en entier** (règle du projet). Un fichier de `journal/` ne s'ouvre que par son index, pour une passe citée.
3. `contracts/` : `PROJECT_MASTER_CONTRACT.md`, `GAMEPLAY_MASTER_CONTRACT.md`, `TOURNAMENT_MASTER_CONTRACT.md`. Ils font foi sur le gameplay et
   le tournoi.
4. `briefs/cloud-session-playable.md`, le plan v2, à suivre :
   - § 2 : l'existant lu dans le code ;
   - § 3 : les écarts E1 à E13 ;
   - § 5 : le périmètre ;
   - § 6 : l'architecture ;
   - § 7 : les lots L0 à L7 et la preuve « jeu par défaut inchangé » (PD) ;
   - § 9 : les risques ;
   - **§ 11 : les choix de l'opérateur, qui t'engagent.**

## 2. La mission

Les mots de l'opérateur : « nous allons planifier notre grosse session cloud a effectuer des maintenant toujours avec le principe d'avoir une
version jouable en prenant en compte ce que nous avons fait dans la mesure du possible ( cloud n'a pas acces au services externe ) ».

Livre une **version jouable** : la tranche verticale du contrat de gameplay (§ 13), ramenée au cloud comme le dit le plan (§ 5). Elle reprend
au mieux le Merchant District, l'arène (`?scene=arena`) et les outils de preuve existants. Fais les lots **dans l'ordre** du plan : L0, puis L1,
L2, L3, L4, L5, L6, L7. Chaque lot est fusionné dans `main` dès qu'il passe sa validation : un arrêt en route doit laisser `main` jouable.

**Les choix de l'opérateur** (plan § 11, fiche du 2026-10-20) :
- **C1, C2, C3** : les contrats sont dans `contracts/`. Aucun verrou n'est modifié ; les écarts sont consignés.
- **P1** : le § 13 entier, ramené au cloud (plan § 5) ; ni festival, ni phase d'équipe, ni recrutement effectif.
- **P2, un écran titre par défaut** : « New game », « Explore the district », et « Continue » quand une sauvegarde existe.
  - L'écran ne paraît que sur l'adresse nue. `?title=0` le saute, `?title=1` le force. `?play=1` entre en mode jouable : c'est l'entrée des
    outils.
  - « Explore the district » lance le jeu d'aujourd'hui tel quel : la nuit, le panneau DEV.
  - Toute adresse à paramètres démarre comme aujourd'hui.
  - L'écran titre n'entre dans le défaut que lorsque « New game » mène à une journée complète (lot L4).
  - Avant d'activer l'écran, vérifie chaque outil de `tools/` qui charge l'adresse nue.
- **P3** : trois lieux, dont un léger. Le district ; le parvis de l'arène, rendu praticable ; un troisième lieu bâti avec les générateurs du
  district, à cadrage fixe, annoncé comme une maquette. Ils viennent au lot L6, après la boucle.
- **P4** : des couches de jeu seulement dans le district : interface, dialogues écrits, rôles de jeu des PNJ existants, états de la forge et du
  jour, effectif de la foule. Ni géométrie, ni cadrage, ni distribution, ni aspect.
- **G1** : le combat de la tranche est l'arène actuelle (`CombatSim`). L'écart E1 (« combat tour par tour » dans le contrat) est consigné, sans
  toucher au contrat. `COMBAT_DATA` et `ARENA_SIM_HASH` ne changent pas. Une fiche de match est une variante de `CombatData`.
- **G2** : le matin montre `morning`, l'après-midi `midday`, la soirée / nuit la nuit. La fin de journée (`afternoon`) sert de transition au
  retour d'un duel. On passe d'un créneau à l'autre par une sauvegarde et un rechargement ; l'état du jour ne change pas à chaud.
- **G3** : la phase I de la tranche est une poule à points. Une défaite coûte (points, réputation, parfois une blessure), mais n'élimine pas.
- **K1** : l'interface et les textes du mode jouable sont **en anglais**, l'arène y compris en mode jouable, par une table de textes.
  `?scene=arena` seul garde son HUD français au pixel près.
- **K2** : « New game » demande **le nom du joueur**. L'arène l'affiche en mode jouable.
- **K3** : en ville, les rivaux apparaissent par des portraits et des dialogues, sans nouveau sprite.
- **S1** : si tout est fait avant la fin, la finition et la robustesse, puis le bilan. Aucune extension du périmètre.

## 3. L'environnement et ses limites

- **Aucun service externe** : ni clé OpenAI ni clé MiniMax (`.env.local` n'existe pas ici), pas d'outil d'images, pas de web.
  - S'il manque un visuel, écris une requête dans un fichier suivi, `art-lab/characters/briefs/image-requests/<sujet>.md` : le prompt, les
    références, le nombre d'images, le but. Pousse-la avec le lot. La séance locale la traitera plus tard (`AGENTS.md`, « Image
    generation »).
- **Pas d'Aseprite** : ni feuille cuite nouvelle, ni `build-character`. Les nouveaux personnages (le second adversaire, par exemple) passent
  par le générateur du code (`FighterArt.ts`, `SpriteGenerator.ts`), à densité ×2 comme l'arène.
- **Pas de GPU** : aucune mesure de temps. SwiftShader sert aux preuves d'image déterministes et aux compteurs.
- **Au lot L0, vérifie Chrome.** En Passe T1, c'était le Chromium de Playwright, préinstallé :
  - un enveloppeur hors du dépôt (`exec chromium --no-sandbox "$@"`) servait de `CHROME_PATH` ;
  - `CHROME_ARGS=--use-angle=swiftshader` ;
  - `READY_MS` assez long : 154 s de démarrage en 1280 × 720, dont 136 s de bake.
  - Sans Chrome, applique le mode « sans image » du plan § 7, et inscris au bilan les preuves d'image à refaire en local.
- **Installations** : `npm ci` seulement. Aucune dépendance ajoutée à `package.json`.

## 4. Git (règles d'`AGENTS.md`)

- **Une seule branche de travail à la fois.** Le proxy de la séance impose sans doute un nom de branche et refusait de supprimer une branche
  distante (Passes T1, H6). Fais une tâche à la fois sous ce nom :
  1. crée la branche depuis `main` ;
  2. travaille ;
  3. pousse **chaque** commit tout de suite ;
  4. la validation passée, fusionne en avance rapide dans `main` et pousse `main` ;
  5. recrée la branche depuis `main` pour le lot suivant.
- **L'entrée du journal, en français, va dans le même commit que le travail qu'elle décrit.**
- **La validation** ouvre la fusion : `npm run typecheck`, `npm test`, `npm run build`, `npm run art:validate`, plus les preuves du lot.
- **Avant chaque commit**, analyse le diff : ni secret, ni clé, ni chemin machine.
- **Jamais** de force-push, ni de réécriture d'historique.
- **Une étape irréversible** (fusion, push de `main`) ne part qu'après la vérification de la précédente.
- **La CI GitHub** tourne à chaque push. Si l'API publique est joignable, lis son résultat ; sinon, ta validation locale fait foi, et le bilan
  le dit.
- **Les fins de ligne** : le dépôt garde LF dans l'index. Ne convertis aucun fichier.

## 5. Les preuves

- **Le PD** (plan § 7), à chaque lot qui touche un fichier atteint sans le mode jouable :
  - `tools/detshots.mjs` contre une copie figée de `main`, servie sur un autre port (`git archive` dans un dossier temporaire,
    `node_modules/three` copié, `node node_modules/vite/bin/vite.js <dossier> --port 5187 --strictPort`), **au seuil 0** ;
  - un témoin de répétition d'abord ;
  - nuit en A, B, C, D, et midi en B ;
  - `tools/arena-scene-check.mjs` ;
  - « Explore the district » dès l'écran titre.
- **Une série de preuves** s'attend jusqu'au bout, sans rien modifier de ce que servent les serveurs pendant qu'elle tourne. Garde et relis la
  sortie des outils : un « ok » dont la sortie est jetée ne prouve rien (Passe Y4).
- **Chaque nouveau test** se voit d'abord échouer sur au moins trois fautes injectées une à une, chacune attrapée. Les fichiers sont ensuite
  rendus à l'octet. Son oracle est indépendant du code testé.
- **Le cœur de jeu (`src/game/`) est pur** : ni `three`, ni DOM, ni `Math.random`, ni `Date.now`, ni `performance.now`. Un test le vérifie.
  - Une même graine et un même script d'actions donnent la même empreinte.
  - Une sauvegarde rechargée égale la partie continue.
- **Arrête tout serveur et toute tâche de fond** que tu as lancés avant de finir.

## 6. Le journal

- **Une passe par lot**, nommée d'après lui : Passe L0, L1… (L3b pour une seconde passe du même lot). Ajoute-la après la dernière passe,
  avant « À reprendre ». Elle est en français et factuelle : [OK] / [KO] / [?], les mesures, la « Pensée ».
- **Mets à jour** « À reprendre » et « Principes à garder ».
- **L'archivage** : quand les passes gardées dépassent environ 60 Ko, déplace les plus anciennes, closes, à l'octet, avec les huit contrôles de
  la Passe D1 (`AGENTS.md`).

## 7. La fin

- **Le bilan** (lot L7) est une passe comme la Passe B1. Elle contient :
  - le tableau de ce qui est fusionné, par commit ;
  - les mesures (compteurs, jamais des temps) ;
  - ce qui reste à vérifier sur la machine de l'opérateur : jouer, le ressenti, l'équilibrage, le GPU, la cadence, les preuves d'image si
    Chrome manquait ;
  - les requêtes d'images écrites ;
  - les décisions préparées, chacune avec sa recommandation ;
  - les écarts consignés ;
  - le reste à faire.
- **Ton dernier message** résume ce bilan pour l'opérateur, en français, en commençant par ce qui est jouable et comment y jouer
  (`npm run dev`, puis l'adresse nue).
