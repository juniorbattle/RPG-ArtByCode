# Journal de bord — archive : passes 4A-0A à 4A-quindecies (2026-10-12 → 2026-10-16)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-10-18 (Passe M3) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe 4A-0A — Préparation du Character Art Toolchain (branche `character-art-toolchain-1`, base `d7c439b`, outillage seul)

Demande : préparer le dépôt pour un futur pipeline de personnages Aseprite-first (Opus / Devin → Aseprite AI Artist → édition au pixel →
review / fix → animation → atlas → Character Lab Three.js), **sans installer Aseprite, sans commencer la production 4A, sans toucher à la scène**.
Principe posé : *maximiser la complexité perçue en minimisant la complexité runtime* ; les outils externes ne sont jamais des dépendances runtime.
Base vérifiée : `main` = `d7c439b3b08280d7643d8cfe3f658de6ad49b928` (Pass 4B, caméra D), arbre propre ; branche créée depuis ce SHA.
Images / preuves : `screenshots/4a-0a/` (`lab-synthetic.png`, `lab-filter-comparison.png`, `contact-synthetic.png`, `lab-selftest.json`,
`runtime-scale-validation.json`). Docs : `art-lab/README.md`, `art-lab/characters/README.md`, `art-lab/characters/reference/README.md`.

### 4A-0A.1 Ce qui existe maintenant

- **[OK] Squelette `art-lab/`** : `characters/{reference/{A-runtime-baseline,B-runtime-quality-targets,C-sprite-quality},source,exports,reviews,smoke-test,manifests}`
  (`.gitkeep`), README de pipeline (références → brief → silhouette → Aseprite → palette → critique → corrections → animation → export → métadonnées → Lab → validation runtime),
  taxonomie A/B/C/D à autorité inégale, 19 portes de qualité (dont « le personnage doit augmenter la valeur de production perçue du district »),
  note d'architecture des PNJ génériques (famille → variation contrôlée → nettoyage artistique → sprite cuit). Aucune image de référence commitée.
- **[OK] Provenance** : `manifest.example.json` + `tools/art-lab/validate-manifest.mjs` (`npm run art:validate`). Contrat : `approved: true` exige statut `approved` + `approval {by, date}` ;
  `runtimeUse: production` exige `approved: true` ; fichiers requis dès `experimental` ; clés inconnues refusées ; sources / exports **orphelins** (sans manifeste) signalés.
  Testé sur un dépôt factice : 9 cas invalides rejetés (approuvé sans approbation, production non approuvée, clé inconnue, fichier manquant, mauvais nom de fichier,
  chemin à antislash, statut/approved incohérents, id dupliqué, JSON cassé), 1 manifeste complet accepté, 1 export orphelin signalé.
- **[OK] `npm run art:doctor`** (`tools/art-lab/doctor.mjs`, lecture seule, `--json`) : Node, dépôt, Art Lab, Aseprite, AI Artist. Sortie réelle ici : `Aseprite ... NOT INSTALLED`,
  `Aseprite AI Artist ... NOT CONFIGURED`, `READY FOR 4A-0B AFTER ASEPRITE INSTALLATION`, code 0. Jamais de « OK » pour un logiciel absent ni de « validé » (il ne peut pas le prouver).
  Branches vérifiées avec de faux exécutables (`.exe` de test compilés en `%TEMP%`, hors dépôt) : chemin `ASEPRITE_PATH` invalide, fichier ou dossier valide (1.3.14 → « FOUND »),
  1.2.40 → « TOO OLD », bannière illisible → « version unknown », fichier non nommé *aseprite* → jamais exécuté. Détection du câblage agent : seuls les **noms** de fichiers de config sont affichés.
- **[OK] `tools/art-lab/make-contact-sheet.mjs`** (`npm run art:sheet`) : planche de revue étiquetée, plus proche voisin, une ligne par tag, `json-array` / `json-hash` / grille.
  Réutilise Chrome via `puppeteer-core` comme les autres outils (aucune dépendance ajoutée).
- **[OK] Hygiène** : `.gitignore` (exécutables / dossiers d'installation / paquets d'extension Aseprite, sauvegardes et temporaires, câblage agent `.mcp.json` `.cursor/mcp.json` `.codex/` `*.bak-*`, secrets,
  caches) **sans** ignorer les `.aseprite` du projet ; `.gitattributes` (`*.aseprite *.ase *.png binary`). Vérifié avec `git check-ignore` : 29 chemins qui doivent être ignorés le sont, 17 qui ne doivent pas l'être ne le sont pas ;
  aucun fichier suivi n'est devenu « modifié » à cause de `.gitattributes`.
- **[OK] `AGENTS.md`** : principe de production d'art + politique durable (outils externes jamais en dépendance, manifeste approuvé pour tout passage au runtime, sources vs exports) + commandes. **Ne dit pas** qu'Aseprite est validé.

### 4A-0A.2 Character Lab (dev seul) : `character-lab.html` + `src/lab/` (3 modules)

- **[OK] Aller-retour synthétique** : RGBA généré par code → canvas → blob PNG → `<img>` décodée → texture GPU Three.js, comme un fichier sur disque. Page Vite **séparée** que le point d'entrée du jeu n'importe jamais.
- **[OK] Contrat de texture = `SpriteAtlas`** : plus proche voisin, sans mipmaps, clamp, sRGB, alpha droit, fond gris neutre (`bg=neutral|dark|light`), ancre du pied calée sur la grille de pixels.
  Trois vues sur une même ligne de pied : **1x**, **4x nearest**, **échelle runtime** d'un cadrage A/B/C/D ; planche entière avec la trame courante ; lecture des tags ; trames rognées (`spriteSourceSize`).
- **[OK] Auto-test pixel par pixel** (`window.__lab.selfTest()`) : pour chaque pixel de chaque vue, recalcule le texel que le GPU doit échantillonner et compare le tampon d'image au PNG décodé sur le fond ; lit aussi l'état de filtre GL
  auprès du pilote. Résultat 1920×1080 : 1x 1 872 px / 0 écart ; 4x 25 872 px / 0 écart ; runtime B 4,551× 33 304 px / 0 écart (146 pixels exactement sur une frontière de texel écartés) ; filtre `NEAREST / NEAREST`, delta max 0.
- **[OK] Le test peut échouer** (contrôle négatif `&filter=linear`, volontairement faux) : 4x 6 594 écarts (Δ max 182), runtime 8 190 (Δ max 187), 1x 0 écart (attendu : pixel centré). `lab-filter-comparison.png` montre la différence.
- **[OK] Échelle runtime vérifiée contre le jeu** : px écran par texel de sprite à 1080p (joueur à la position de référence du cadrage) **A 2,415 / B 4,551 / C 4,960 / D 4,366**. À 720p le Lab donne 1,610 / 3,034 / 3,306 / 2,910 et le jeu en cours
  d'exécution (`window.__app`, caméra réelle) mesure 1,610 / 3,034 / 3,306 / 2,910 (horizontalement +0,3 %). Non entier à tous les cadrages : des largeurs de texel inégales sont **normales** au runtime et visibles dans cette vue.
- **[OK] Formats d'export** : parseur des deux formes JSON d'Aseprite (`--data … --format json-array|json-hash --list-tags`, forme vérifiée dans la doc CLI d'Aseprite). Une trame rognée (`trimmed`, `spriteSourceSize`, forme `json-hash`) se rend
  **pixel pour pixel comme la version non rognée** (diff 0 px) et passe l'auto-test.
- **[?] La fixture synthétique est écrite à la main** (forme d'un export Aseprite, pas un export réel) : le Lab n'a jamais lu un vrai fichier Aseprite.
- **[?] Limites du Lab** : exactitude à l'écran seulement à zoom navigateur 100 % et DPR entier (l'auto-test lit le tampon, pas l'écran) ; vérifié sur Chrome / ANGLE D3D11 seulement ; l'échelle runtime ignore le DOF, la passe miroir, l'élargissement de fov des fenêtres étroites
  (aspect fixé à 16:9) et suppose le joueur à une position de référence par cadrage (en marchant, la distance caméra-joueur varie). La **règle de taille** (`PIXEL_WORLD × act.scale × charScale` le long de la verticale du billboard) est lue dans le shader de `SpriteRenderer`,
  pas mesurée sur des pixels rendus.

### 4A-0A.3 Recherche amont : `with-pebbly/aseprite-ai-artist` (lue, **rien exécuté**)

- **[OK]** Le paquet npm est **`@pebbly/aseprite-ai-artist`** (dernier observé : **0.8.2**, MIT, `engines.node >=22.6.0`, bin `aseprite-ai-artist`) ; `aseprite-ai-artist` et `@with-pebbly/aseprite-ai-artist` répondent **404**. Version non épinglée dans le dépôt : à épingler à ce que 4A-0B valide.
- Exigences : **Aseprite 1.3+** (API Lua WebSocket absente en 1.2 ; lancer Aseprite une fois), Node ≥ 22.6 (ici 22.14.0). Chaîne : agent –MCP→ serveur –pont 127.0.0.1 (9931 / 9932)→ extension Aseprite. 18 outils MCP, 14 workflows `aseprite:*`
  (`studio` `brief` `concept` `new` `palette` `draw` `shade` `rig` `animate` `tileset` `review` `fix` `export` `submit`), 62 règles de pixel art, critique « à froid » (`pixel-critic`). Clients cités : Claude Code, omp, OpenCode, Codex, Gemini, Cursor, VS Code, Windsurf — **pas** le CLI Devin.
- **Pièges notés pour 4A-0B** : `install --all --agents` modifie des configs utilisateur et ajoute une section à `AGENTS.md` (utiliser `--dry-run` d'abord) ; `aseprite:submit` ouvre une PR publique (ne jamais l'utiliser sur nos assets) ; `install --project` écrit des chemins machine dans le dépôt (d'où le `.gitignore`).
- **[?]** L'auteur écrit lui-même que l'effet de sa boucle critique sur la qualité « n'est pas encore mesuré » : à traiter comme une source de brouillon soumise à nos portes de qualité.

### 4A-0A.4 Preuve que le jeu n'a pas changé

- **[OK] Bundle de production identique à l'octet** : `dist/assets/index-B5BamZwF.js` (818,64 kB) et `dist/index.html`, SHA-256 avant = après (F81B4D7B… / D70DFE4D…) ; `dist` ne contient ni `character-lab.html` ni aucune chaîne `characterLab` / `__lab` / `Aseprite`.
  Le Lab est servi par le serveur de dev seulement (le build ne prend que `index.html`).
- **[OK] Quatre cadrages, seed 1842, `static=1`, `freeze=7.3`, 1920×1080, serveur dédié :5180** : baseline vs après = **0 px de différence (max 0)** en A, B, C et D ; la baseline contre elle-même (A/A2, D/D2) = 0 px, donc le harnais est déterministe.
  Statistiques identiques avant / après : appels de dessin A 99 / B 105 / C 99 / D 99 ; triangles 224 586 / 209 890 / 167 738 / 239 018 ; 44 textures, 188,38 MB, 24 lumières. **0 appel de dessin, 0 texture, 0 géométrie, 0 shader ajoutés au jeu.**
- `npm install` : « 0 vulnérabilités », `package-lock.json` inchangé (git le montrait ` M` à cause de l'horodatage seul ; hash du contenu identique à `HEAD`). Aucune dépendance ajoutée. `npm run typecheck` et `npm run build` OK.

### 4A-0A.5 Ce qui n'est PAS fait / reste inconnu

- **[?] Aseprite n'est pas installé** ; **[?] Aseprite AI Artist n'a jamais été installé ni exécuté** ; **[?] le MCP n'est pas validé**. Le doctor n'a jamais tourné contre un vrai Aseprite :
  `--noinapp --version` (puis repli `--version`) est supposé accepté par toutes les versions 1.3+, **non vérifié**.
- **[?]** Aucun test automatisé dans le dépôt (pas de lanceur) : `art:validate` / `art:doctor` sont des commandes manuelles ; rien ne les lance en CI.
- **[?]** `.gitignore` ignore des configs d'agent de portée projet (`.mcp.json`, `.codex/`, …) : si une config assainie doit être partagée, `git add -f` explicite. `.devin/` n'est pas ignoré.
- Hors périmètre respecté : aucune production de personnage, aucun gold master, aucune amélioration des sprites, aucune expérience PixelLab, aucun changement de caméras / géométrie / éclairage / SpriteRenderer.

### 4A-0A.6 Erreurs de méthode / d'outillage (pour ne pas les refaire)

- **[KO → corrigé] Nom de paquet.** `npm view aseprite-ai-artist` → 404 : le nom GitHub (`with-pebbly/aseprite-ai-artist`) n'est pas le nom npm. Lire le README amont avant de supposer un nom.
- **[KO → corrigé] Premier auto-test : 36 / 132 / 135 écarts**, tous sur une seule ligne de pixels : la ligne-guide du pied (superposition à 35 %) était comptée comme du sprite. Un test de pixels doit masquer ses propres surimpressions.
- **[KO → corrigé] Première échelle runtime fausse** : formule `rendu / (2 · dist · tan(fov/2))` avec la distance du **pivot** ; le joueur est en réalité à 31,1 / 23,5 / 27,8 / 20,9 m de la caméra (A / B / C / D) contre 44 / 26 / 27 / 20 m de pivot, soit +45 % (A) à +11 % (B) d'erreur.
  Mesuré dans le jeu (`window.__app`), puis recalculé avec `CameraGraph.evalAnchor` + `applyPose` : égalité à la 3ᵉ décimale. Dériver une échelle écran du code caméra du jeu, pas d'un paramètre d'auteur.
- **Un test qui passe peut être vide** : « 0 écart » n'a de valeur qu'avec un contrôle négatif qui échoue (filtre linéaire : 6 594 écarts).
- **`git check-ignore -v` affiche aussi les règles de négation** (`!.env.example`) : faux « échec » du test d'hygiène ; vérifier le code de sortie sans `-v` (1 = non ignoré).
- **PowerShell mange le premier `--`** de `npm run x -- --flag` (le shim `npm.ps1`) : npm avale alors `--flag` comme option à lui (`--json` perdu, `--port 5191` → `5191` devient la **racine** de Vite → 404 partout, faux « échec » de `art:lab`).
  Écrire `npm run x '--' --flag` (guillemets) ou appeler `node tools/art-lab/<script>.mjs --flag` ; noté dans `art-lab/README.md` et `AGENTS.md`. Valable aussi pour les anciens `npm run shots -- …`.
- Deux serveurs Vite écoutaient déjà sur :5173 (dont un autre projet, `RPGThreeJS`) : j'ai lancé le mien sur `:5180 --strictPort` pour que la baseline vienne bien de **cet** arbre. Le processus `node` enfant de ce serveur est arrêté en fin de passe.
- Fichiers de travail du Lab en `art-lab/**/tmp/` (ignoré par git, vérifié) puis supprimés ; faux exécutables Aseprite et fixtures de test uniquement dans `%TEMP%`.

## Passe 4A-0B — Intégration d'Aseprite AI Artist et test de fumée (branche `character-art-toolchain-1`, base `51b89b9`, 2026-10-15)

Demande : installer et prouver la chaîne Aseprite → agent → export → Character Lab, **sans** commencer la 4A ni toucher au runtime.
Autorisé par l'opérateur : extension Aseprite, plugin Claude Code en portée **locale**, dépendances strictement nécessaires, pont MCP local,
sprites / exports de test, docs Art Lab + journal ; interdit : `install --all --agents`, PixelLab, soumission publique, personnages de production,
caméras / rendu / gameplay. Agent : Claude Code 2.1.301 (Opus 5.5), qui a aussi mené l'onboarding ci-dessous. Preuves : `art-lab/characters/smoke-test/4a0b/`.

### 4A-0B.0 Onboarding Claude Code (avant la passe, aucune modification du dépôt)

- **[OK]** Claude Code lit `AGENTS.md` nativement (≥ 2.1.277) ; `~/.claude/CLAUDE.md` (principes universels, hors dépôt, ≈ 1,3 k tokens) créé à la demande de l'opérateur.
  Session neuve, `/context` : User 1,2 k + `AGENTS.md` 6 k tokens, chacun **une fois** ; `JOURNAL.md` **non** chargé. Aucun `CLAUDE.md` de projet (décision opérateur).
- **[OK] Piège mesuré** (fixtures en bac à sable, `claude -p`) : un `CLAUDE.md` ou `.claude/CLAUDE.md` dans un dossier **parent** du projet coupe le chargement natif d'`AGENTS.md` ;
  le `~/.claude/CLAUDE.md` utilisateur en est exclu (doc + session réelle dans HD-2D), bien que `C:\Users\<moi>` soit un parent du dépôt.
- `/doctor prompt-audit` : aucun conflit entre `~/.claude/CLAUDE.md` et `AGENTS.md` (une remarque de style sur `AGENTS.md:92-93`, laissée telle quelle).

### 4A-0B.1 Ce qui est installé (rien dans Git)

| Pièce | Version exacte | Où |
|---|---|---|
| Aseprite | 1.3.18.6-x64 (`--noinapp --version` accepté, code 0) | `C:\Program Files\Aseprite` (installé par l'opérateur avant la passe) |
| Extension Lua | aseprite-ai-artist **0.8.2**, `ai-artist.lua` SHA-256 `bdb4d8d8…` | `%APPDATA%\Aseprite\extensions\aseprite-ai-artist` |
| Plugin Claude Code | `aseprite@aseprite-ai-artist` **0.8.2** (MCP 18 outils, 14 skills, 4 agents, 2 hooks) | activé dans `.claude/settings.local.json` (portée **locale**, ignoré par git) |
| Marketplace | `with-pebbly/aseprite-ai-artist#v0.8.2` (commit `5894b12`), `autoUpdate: false` | déclarée en portée locale |

- **[OK] Vérifié avant d'installer** : `npm view` (0.8.2 toujours `latest`, 3 dépendances `ws` / `zod` / `@modelcontextprotocol/sdk`, aucun script d'installation),
  intégrité du tarball = registre (`sha512-blkv8…`), tag `v0.8.2` = npm 0.8.2 (extension, skills, agents, hooks, règles identiques hors fins de ligne), le `dist/` construit
  localement par le lanceur du plugin (`npm ci --ignore-scripts` + `tsc`) = `dist/` publié (hors source maps). Hooks lus : sonde TCP locale + marqueur dans `%TEMP%`.
- **[OK] Dry-runs** : `install-extension --dry-run` n'écrit rien (dossier absent après) ; le code de `install` montre que `install claude` écrirait un serveur **utilisateur**
  dans `~/.claude.json` avec `@latest` (non épinglé, chargé dans tous les projets) et `--agents` ajouterait une section à `AGENTS.md` : **non utilisés**. Pas de serveur MCP autonome (doublon).
- **[OK] Soumission publique bloquée** : `.claude/settings.local.json` → `deny: Skill(aseprite:submit), Bash(gh repo fork:*), Bash(gh pr create:*)` ; vérifié en session neuve :
  « Skill execution blocked by permission rules ». `gh` n'est de toute façon pas installé.
- **[OK] Session neuve dans HD-2D** : hook SessionStart actif, 18 outils `mcp__plugin_aseprite_aseprite__*`, 14 skills `aseprite:*`, 4 agents. Coût permanent ≈ 1,7 k tokens
  (`claude plugin details`), dans ce dépôt seulement. `~/.claude.json` ne contient aucun `mcpServers` (seulement un compteur `pluginUsage`).

### 4A-0B.2 Test de fumée (le vrai aller-retour)

Deux sessions **neuves** `claude -p --model opus` dans le dépôt (la session pilote ne voit pas un plugin installé après son démarrage), consignes et rapports verbatim
dans `smoke-test/4a0b/`. Sprite `smoke-4a0b-v1` : mannequin de test 32×48 RGB, **pas** un personnage.

1. **[OK] Connexion** : `preflight` → `ready: true`, Aseprite 1.3.18.6, extension 0.8.2, `features: draw_batch, recolor, validate, tileset, reference, filmstrip`.
2. **[OK] Création** : palette exacte de 8 entrées, calques `body` / `markers`, `colorsSnapped: []`.
3. **[OK] Pixels exacts** (`read_pixels` / `look ascii`) : valeurs attendues aux coordonnées demandées, ligne opaque la plus basse y = 44 (pied runtime y = 45).
4. **[OK] Modification ciblée** : 2 pixels (yeux), voisins inchangés, `pixelsChanged: 2`.
5. **[OK] Palette / calques** : `sprite_info` conforme, `offPaletteColors: []`. `validate` signale les 4 marqueurs de coin comme « strays » (voulus) ;
   `palette analyze` annonce un « quasi-doublon » transparent / lui-même (**[?]** défaut probable de l'analyseur).
6. **[OK] Animation 4 trames**, 120 ms, tag `test` ; diff entre trames successives 68 px, jamais dans un coin ; pied à y = 44 sur les 4 trames.
   Effet de **ma** consigne : en trames 2 et 4, la ligne y = 29 est vide (1 px entre torse et jambes) ; conforme à la consigne, visible sur la planche.
7. **[OK] Critique + correction fondée sur preuve** — contrôle négatif : session A a planté **un** pixel hors palette (#00ff00, trame 3, (5,20)) ; la session B ne le savait pas.
   `validate` l'a trouvé à l'aveugle (palette + stray + outline), lecture avant → `clear` 1×1 → lecture après ; rien d'autre modifié.
   **[KO] `aseprite:pixel-critic` n'a pas pu voir le sprite** : sa définition d'agent n'accorde que `Read` / `Glob` / `Grep` (aucun outil MCP aseprite) ; il l'a dit lui-même. Revue faite par le skill `aseprite:review` + `validate`.
8. **[OK] Export réel** : `ExportSpriteSheet` d'Aseprite (json-array, `listTags`), planche 128×48, 4 trames non rognées, tag `test` 0–3, calques listés.
   **[?]** L'outil `export` renvoie la taille d'une trame (32×48), pas celle de la planche.
9. **[OK] Character Lab** (1920×1080, Chrome / ANGLE D3D11) : auto-test **réussi** sur A / B / C / D (échelles 2,42 / 4,55 / 4,96 / 4,37), **0 écart** à 1x, 4x et runtime, filtre
   `NEAREST / NEAREST` relu au pilote. **Contrôle négatif** `filter=linear` : **échoue** (4 950 et 6 212 écarts, Δ max 119 / 139). Fixture synthétique : chiffres identiques à 4A-0A (1 872 / 25 872 / 33 304 px).
   Décodage indépendant des 4 trames : coins magenta, pied y = 44, 0 pixel semi-transparent, 0 couleur hors palette, défaut absent de l'export.
10. **[OK] Vérifications** : `art:sheet` (planche de revue 4x dans `reviews/`), manifeste `smoke-4a0b-v1` (`experimental`, `runtimeUse: lab`, `approved: false`, générateur
    aseprite-ai-artist 0.8.2 / claude-opus-5-5) → `art:validate` et `--strict` : 0 erreur ; avant le manifeste, le contrôle d'orphelins signalait bien les 3 fichiers. `npm run typecheck` OK.

### 4A-0B.3 Preuve que le runtime n'a pas changé

- **[OK] Bundle identique à l'octet** : `dist/assets/index-B5BamZwF.js` `f81b4d7b…` et `dist/index.html` `d70dfe4d…` avant = après (= 4A-0A) ; aucune chaîne `characterLab` / `__lab` / `aseprite` / `smoke-4a0b` dans `dist`.
- **[OK] Quatre cadrages** (graine 1842, `static=1`, `freeze=7.3`, 1920×1080, serveur dédié `:5180 --strictPort`) : avant vs après **0 px (max 0)** en A, B, C, D ; A vs A (avant) 0 px.
  Appels de dessin / triangles identiques : A 99 / 224 586, B 105 / 209 890, C 99 / 167 738, D 99 / 239 018.

### 4A-0B.4 Fichiers modifiés (dépôt)

- `tools/art-lab/doctor.mjs` : détecte le plugin Claude Code (portée, ref épinglée, auto-update, version en cache), la version de l'extension Aseprite, signale un plugin hors portée
  locale ou une version extension ≠ plugin ; `~/.claude.json` ne compte que de vrais `mcpServers` (avant : le compteur `pluginUsage` passait pour du « câblage »). Toujours en
  lecture seule, ne dit jamais « validé ». Contrôle négatif sur un faux `HOME` : portée utilisateur + extension 0.8.2 / cache 0.9.0 détectés, `pluginUsage` ignoré.
- `art-lab/README.md` (statut, configuration installée, reproduction, pièges), `art-lab/characters/README.md` (statut), ce journal.
- Nouveaux : `art-lab/characters/{source/smoke-4a0b-v1.aseprite, exports/smoke-4a0b-v1.{png,json}, manifests/smoke-4a0b-v1.manifest.json, reviews/smoke-4a0b-v1-contact.png, smoke-test/4a0b/}`.
- Hors dépôt : extension Aseprite, plugin et marketplace (cache Claude Code), `.claude/settings.local.json` (ignoré). Aucune dépendance npm ajoutée, `package.json` inchangé.

### 4A-0B.5 Ce qui n'est PAS fait / reste ouvert

- **[?]** Non exercés : `studio`, `brief`, `concept`, `shade`, `rig`, `animate`, `tileset`, `fix`, les agents palette / rig / animation, le mode headless ; rien n'est dit de la **qualité** artistique produite.
- **[?]** Critique « à froid » : `pixel-critic` inutilisable tel quel en 0.8.2 (outils manquants). Contournement possible sans toucher à l'amont : une critique lancée par un agent général
  avec la consigne de `pixel-critic`, ou un agent de projet — à décider avant la 4A.
- **[?]** Le Lab n'auto-teste que la première trame du tag ; les autres trames ont été vérifiées par décodage séparé (script hors dépôt), pas par `selfTest()`.
- **[?]** Le manifeste n'accepte que `kind: character` : le mannequin de test y est déclaré comme tel, signalé dans `notes`.

### 4A-0B.6 Erreurs de méthode / d'outillage (pour ne pas les refaire)

- **[KO → corrigé] Aseprite « redémarré » mais pas relancé** : même PID, démarré à 14:54 avant l'installation de l'extension (16:14) → `pluginConnected: false`. Vérifier l'heure de
  démarrage du processus, pas seulement sa présence ; une extension n'est lue qu'au lancement.
- **[KO → contourné] Pont qui meurt avec la session** : le pont lancé par le serveur MCP d'une session `claude -p` (pourtant « détaché ») ne survit pas à la fin de la session sous Windows,
  et l'extension ne re-compose le pont **que si la fenêtre Aseprite a le focus** (minuterie Lua liée à l'UI) ; une session suivante voyait donc `ready: false`. `AppActivate` n'a pas suffi
  (Windows refuse le vol de focus). Correctif : un pont persistant (`dist/cli.js bridge`) lancé une fois, puis Aseprite lancé **après** lui (connexion immédiate au démarrage).
- **[KO → corrigé] Git Bash réécrit les chemins** : `/context` devenait `C:/Program Files/Git/context`, `/art-lab/...` devenait `C:/Program Files/Git/art-lab/...` (le Lab affichait « cannot load »).
  `MSYS_NO_PATHCONV=1` pour tout argument qui commence par `/` ; à l'inverse, avec cette variable, Node ne comprend plus `/c/Users/...` : passer `C:/Users/...`.
- **[KO → corrigé] Imbriquer `claude` depuis une session Claude Code** : désactiver d'abord les variables `CLAUDE*` héritées (identifiants de session, jeton de messagerie), sinon la session fille se croit enfant de la mère.
- Les preuves versionnées ne doivent pas contenir de chemin machine : la racine du dépôt est remplacée par `<repo>` dans les consignes et rapports copiés.

## Passe 4A — Gold master Merchant District : le portefaix du canal (branche `character-gold-master-4a-1`, base `03ed8a1`, 2026-10-15)

Demande : **un seul** PNJ générique au niveau « gold master » (pas de roster), plus haut que le cast actuel, intégré au runtime, validé par une vraie critique ;
second PNJ important seulement si le premier convainc. Références de l'opérateur, classées ainsi (classement à confirmer par l'opérateur) : image 2 (PNJ raffinés 17-24,
vues 6 faces) = **référence B** ; image 3 (roster illustré, vignette de canal) = **référence C**, support seulement (rendu proche d'Octopath) ; image 1 (« 16 generic
townsfolk ») = **rejetée**. Aucune capture runtime fournie : la référence A, ce sont nos captures. Les images B / C ne sont **pas** stockées dans le dépôt (non autorisé explicitement).
Preuves : `art-lab/characters/reviews/porter-gm-v1/` (progression v1-v9, planche, filmstrip, `critiques.md`), `screenshots/4a/`. Manifeste : `porter-gm-v1` (`candidate`, `approved: false`, `runtimeUse: lab`).

### 4A.1 Choix et méthode

- **Archétype : portefaix du canal** — il vit où se trouve la composition (quai, bateau, étals), le runtime a déjà un `porter` (avant / après au même endroit),
  le sac sur l'épaule donne une silhouette asymétrique, le costume se superpose (lin, gilet de laine, épaulière de cuir, corde, ceinture, molletières), base de la famille Dock Worker.
- **Format inchangé** : 32 × 48, vue de face (`down`), pied ligne 45, plus proche voisin. Le cast actuel : porteur 35 px de haut / 40 couleurs, joueur 41 px / 58 couleurs.
- **Production** : grilles de pixels écrites à la main (texte + légende) et poussées en direct dans Aseprite 1.3.18.6 par le serveur MCP du plugin 0.8.2 (petit client MCP stdio,
  outils `draw` grid / `export` / `validate` / `look`), rendus 8x regardés à chaque itération ; la source de production est `source/porter-gm-v1.aseprite` (calque `porter`, 4 trames, tag `idle`).
  Pas de génération d'image : les ébauches et toutes les corrections sont du pixel délibéré.
- **Aperçu dans la scène (dev seul)** : `?labsprite=<id>&labpos=x,z` (`src/lab/runtimePreview.ts`) remplace en mémoire les cellules `porter/*` de l'atlas par l'export et fige l'acteur face
  caméra ; `labsprite=-` = l'image « avant » au même endroit. Branche `import.meta.env.DEV` dans `main.ts` : **bundle de production identique à l'octet** (vérifié).
- **Critique** : `pixel-critic` ne voit pas le sprite → agent indépendant neuf (lecture seule) avec un dossier de preuves (8x, carte ASCII à coordonnées, captures A / B / C, avant / après,
  atlas du cast, références), **lecture à froid avant la consigne**, puis constats localisés au pixel ; à partir du 2ᵉ passage, vérification des constats précédents.

### 4A.2 Itérations (v1 → v9)

- v1 bloc : lisible mais **trop étroit** à côté du cast, bouche « qui crie », sac le plus lumineux de l'image, bras levé sans structure. v2 : carrure 15 px, tête +1 rang (front sous la visière, nez, moustache, barbe), bras levé construit.
- v3-v4 : sac à « oreille » et col noué ; **[KO → corrigé] paréidolie** : les pixels du pli du sac formaient un visage triste à l'échelle runtime → pli en ligne continue ; chemise / sac / gilet assombris pour rendre le visage focal.
- **Critique 1 (v4) : 5/10**, « pas encore » (sac rectangle dressé, port = salut, costume en bandes horizontales comme le #05 rejeté, regard fixe). v5 : sac couché, sangle diagonale, plissement d'yeux,
  bras gauche décollé, 45 → 39 couleurs ; **[KO]** l'avant-bras traversant le sac le cachait et la manche horizontale lisait comme un bras tendu → v6 : avant-bras le long du sac.
- **Critique 2 (v6) : 6/10**, « proche » (crochet = main-crochet, sangle = signature du héros, tête / sac / bras fondus en une masse chaude, sac collé au bord, prise illogique).
  v7 : tête décalée de 1 px à l'opposé de la charge + colonne séparatrice froide, **poing fermé sur le col noué du sac**, épaule chargée relevée sur une épaulière 4 × 2, sac plus froid et bombé,
  harnais de chanvre, vrai poing sur le crochet ; idle 4 trames ; 31 couleurs.
- **Critique 3 (v7 animé) : 7/10**, critères 1-5 PASS, 6 PARTIEL (tête « brique », avant-bras « bâton », torse droit en ombre ; sourcils en colère → las).
  v8 : coins de tête arrondis, sourcils las, poing 5 px à jointures claires + revers relevé + bras foreshortened, bord de gilet éclairé, harnais arrêté à un nœud de poitrine, 30 couleurs.
- **Vérification (v8) : 8/10**, « proche : boucher 3 trous, baisser le bloc de manche » → **v9 (candidat final)** : trous bouchés (contrôle objectif : 0 pixel transparent enfermé sur les 4 trames),
  manche passée dans l'ombre, bouton en lin (la boucle reste le seul accent chaud), sourcils extérieurs adoucis. v9 n'a pas été re-lu par un agent : ses changements sont les prescriptions du vérificateur + le contrôle objectif.

### 4A.3 Résultat mesuré

- **[OK] Sprite** `porter-gm-v1` : 4 trames (repos 700 / expiration 500 / repos 700 / clignement 160 ms), boîte x 1-30 / y 4-45, **30 couleurs**, 0 pixel semi-transparent,
  `validate` Aseprite **100 « Clean. »** (contour sélectif cohérent), 0 trou ; l'expiration bouge 256 px, le clignement 2 px. SHA-256 (16) : source `d9025da100ff7809`, planche `76bb48f970f0d814`, atlas `e7dcc9dcae86cb0d`.
- **[OK] Character Lab** sur l'export réel : auto-test **0 écart** à 1x / 4x / échelle runtime A 2,42 · B 4,55 · C 4,96 · D 4,37 ; `NEAREST/NEAREST` relu au pilote ; contrôle négatif
  `filter=linear` **échoue** (11 659 / 14 431 écarts). `screenshots/4a/character-lab-*`.
- **[OK] Runtime** (seed 1842, `freeze=7.3`, 1920 × 1080, `:5180 --strictPort`) : A (bord du canal, lampe, ~2,4x), B (flaque de lanterne sur pavés mouillés), C (lampe de la forge) ;
  avant / après au même endroit `screenshots/4a/before-after-{A,B,C}-3x.png`. Lisible aux trois cadrages (casquette, barbe, sac, crochet à 2,4x).
- **[OK] Runtime par défaut inchangé** : quatre cadrages `static=1` **0 px (max 0)** contre la baseline de 4A-0B, mêmes appels de dessin / triangles ; `dist` identique au SHA-256 (`f81b4d7b…`).

### 4A.4 Non résolu / décisions opérateur

- **[?] Décision : style du héros.** Le portefaix suit la référence B (petits yeux modelés, tête ≈ 38 % de la hauteur mais plus étroite que les épaules) ; le joueur reste chibi
  (grands yeux ronds, visage plat) → décalage visible côte à côte (`before-after-C`, `runtime-B`). Les critiques placent la correction côté héros ; à trancher avant de décliner le cast.
- **[?] Approbation** de `porter-gm-v1` (manifeste `candidate`) : rien n'entre au runtime sans `approved: true` + tâche explicite.
- **[?] Non fait** : directions `up` / `side`, cycles `walk` / `carry` (le porteur du runtime marche en `carry` : l'aperçu le fige debout) ; l'idle runtime n'affiche que 2 trames (2 cellules d'atlas) ;
  aucune variante (2 acteurs `porter` dans le district → clones dans l'aperçu) ; second PNJ important **non tenté** (le premier n'est pas encore approuvé).
- **[?]** Contrôle « image / référence B » par des agents seulement ; jugement humain de l'opérateur attendu. Les scripts de création (client MCP, poussée de grilles, idle) sont restés hors dépôt.

### 4A.5 Erreurs de méthode / d'outillage (pour ne pas les refaire)

- **[KO → corrigé]** Juger un sprite seulement en 8x : l'étroitesse (v1), la paréidolie du sac (v3), la manche-« aile » (v5) et le sac fondu dans la barbe (v6) ne se voient **qu'en scène**,
  sous la lumière chaude et le liseré du rendu. Le contrôle runtime doit être dans la boucle de chaque itération, pas à la fin.
- **[KO → corrigé]** Les coordonnées des critiques utilisent les glyphes de `look ascii` d'Aseprite (≠ mes lettres de palette) : refaire la table de correspondance à chaque carte.
- **[KO → corrigé]** Corriger « au pied de la lettre » une demande de critique peut casser autre chose (v5 : avant-bras en diagonale devant le sac) : revalider en scène.
- **[KO]** Positions de capture : en C, l'objectif long met la bannière du bateau et un PNJ encapuchonné devant certains points du quai → chercher la place (3 essais) ; l'aperçu habille **tous** les acteurs `porter`.
- Rappels 4A-0B confirmés : pont persistant + Aseprite relancé après lui ; `MSYS_NO_PATHCONV=1` ; JSON de chemins Windows avec `/`.

## Passe 4A-bis — Remise en question du pipeline personnages (étude, aucune production, 2026-10-15)

Décision opérateur : `porter-gm-v1` **non approuvé**, retouches suspendues, gardé comme **baseline expérimentale** (manifeste passé en `experimental`) ;
aucune production de personnage avant validation d'une nouvelle stratégie ; les personnages peuvent avoir un traitement différent de l'environnement (même univers, autre technique).

- **[KO] Erreur de cible de la passe 4A.** La planche « 16 generic townsfolk (unified style & scale) » (image 1 de 4A) est la **cible** de l'opérateur ; je l'avais classée
  « rejetée » à cause de son titre et donnée aux trois critiques comme contre-exemple. Toute la passe 4A visait donc les deux autres images. Pensée : un classement de références
  se fait confirmer par l'opérateur **avant** de produire, surtout quand une consigne parle de planches rejetées sans les montrer.
- **[OK] Mesure de la référence** (`refgrid`, scripts hors dépôt) : ce n'est **pas** du pixel art strict — blocs de 3 à 4 px d'image, irréguliers, bords adoucis, dégradés dans les blocs
  (image peinte qui imite le pixel art, très probablement générée puis réduite : à confirmer par l'opérateur). Le pas le plus stable (vieux marchand) ≈ 3,5 px → figure ≈ **45-48 pixels de haut**,
  ≈ 20-23 de large, proportions chibi (tête large ≈ 40 % de la hauteur), ≈ 300-600 teintes par figure. Les autres mesures automatiques tombent sur des harmoniques : le pas n'est pas constant.
- **[OK] Reconstruction stricte** du docker (#05) sur grille 32 × 48 (pas 3,55, phase cherchée par variance minimale) : figure 20 × 44, **tient dans le format actuel** et garde l'essentiel
  (proportions, visage, cheveux, matières) **sans aucun nettoyage**. Pensée : la résolution 32 × 48 n'est **pas** le verrou principal ; le dessin et les proportions le sont.
- **[OK/?] En scène** (aperçu dev, B / C / A, même endroit) : la reconstruction a plus de charme que `porter-gm-v1` et s'accorde aux proportions du joueur (le « conflit de style
  avec le héros » de 4A venait de ma mauvaise cible) ; mais elle sort **pâle et bruitée** — pas de contour, trous du découpage d'ombre, 548 couleurs, et l'éclairage des sprites
  (relèvement côté lumière, liseré) délave les tons clairs. À traiter : nettoyage + réglage de la réponse lumineuse des sprites (paramètre runtime, pas résolution).
- Captures de l'étude (non versionnées : elles dérivent de l'image de référence de l'opérateur) : comparaisons à trois (porteur actuel / `porter-gm-v1` / reconstruction) en A et B.
- Recommandation et pipelines comparés : voir la réponse d'étude de la conversation (résumé : pipeline hybride — base dessinée ou générée hors runtime, reconstruite sur grille,
  finition humaine dans Aseprite, déclinaisons et intégration pilotées par le code ; résolution conservée ~45-48 px de figure avec un canevas plus large ; réglage du rendu des sprites).

## Passe 4A-ter — E2 / E3 : faisabilité artistique (tests seulement, aucun asset produit ni commité, 2026-10-15)

Cadre opérateur : E2 et E3 seulement, arrêt avant E4. Références classées par **contenu et approbation explicite**, jamais par nom de fichier ; densités **réellement**
différentes comparées à **même taille monde** ; pas de limite de palette imposée avant comparaison ; finition **autonome** Claude Code + Aseprite AI Artist ; preuves natives, crops au plus
proche voisin, captures à position identique, revue indépendante qui prouve avoir vu les images. Matériel de test : le docker #05 (vue de face) de la planche de référence.
Preuves (hors dépôt, dérivées de la référence) : dossier de travail de la session (`e2v/`, `e2f/`, `e2rt/`, `e3/`, `e3s/`, `p2rt/`, `review-e2e3/`).

### Outillage (dev seul)
- `src/lab/runtimePreview.ts` étendu : planche d'une autre densité → **second rendu de sprites** (même shader, mêmes lumières, même liseré) à la **même taille monde**
  (densité = hauteur de cadre / 48, mètres par texel = `PIXEL_WORLD` / densité) ; `labhd=1` force ce chemin même en 32 × 48 (comparaisons à traitement identique : le porteur du
  runtime est en détail `crowd`, protection DOF 0,8) ; `spritelight=sat,chroma,edge,vertMin,tone,overlay,unlit` surcharge le traitement lumineux des personnages (environnement inchangé).
  **[OK]** bundle de production identique au SHA-256 (`f81b4d7b…`), typecheck OK.
- **[KO → contourné]** Aseprite (fenêtre) ne s'est pas reconnecté au pont même au premier plan forcé (`SetForegroundWindow`) → **mode headless** d'AI Artist (`serve --headless`,
  instance batch dédiée, aucune fenêtre) : fonctionne, état rechargé depuis le fichier à chaque appel.

### E2 — résultats
- Sources reconstruites sur grille stricte : ×1 (32 × 48, figure 45 px, 623 couleurs), ×1,5 (48 × 72, 67 px, 1 288), ×2 (64 × 96, 89 px, 2 153).
- **[OK] Palette** (×1) : 96 / 64 / 48 indiscernables à 8x ; à 32, léger aplatissement chemise / peau, aucun trait perdu (revue : même avis). Les 623 couleurs sont du bruit. Densités supérieures non testées.
- **[OK] Densité, même taille monde** : ×1 → ×1,5 = gain net en B / C (yeux, bretelles, mains) ; ×1,5 → ×2 = gain plus faible (mèches, reflets), surtout en C ; en A ×1,5 ≈ ×2
  et ×2 tombe vers 1 px écran / texel (limite du plus proche voisin). **[?]** scintillement en mouvement non mesuré.
- **[OK/?] Finition autonome** (Claude Code + AI Artist headless, aucun humain) sur ×1,5 / 64 couleurs :
  passe 1 (contour unifié, épines / trous / bruit, yeux à reflet, sourcils, bouche, bottes refaites, ombre de mâchoire) **3 min 17 s**, ≈ 230 px posés + 177 mécaniques ;
  passe 2 (col en V, chemise en 4 tons + patte + boutons, boucle laiton, doigts, mèche désaturée) **1 min 37 s**, 177 px. `validate` 90-100.
- **Revue indépendante** (agent neuf, preuves de vue vérifiées sur les fichiers) : proximité à la référence — passe 2 sans liseré **7/10**, ×2 auto 6, passe 1 6, ×1,5 auto 4,5, ×1 auto 3.
  Reste : **rendu de la forme** (chemise en rayures verticales, manches, pantalon sans lumière directionnelle), main droite + bâton, volume des cheveux.
  Pensée : la finition par agent corrige vite et sûrement des défauts **nommés et localisés** ; elle n'a pas encore montré qu'elle sait **peindre la forme** (demander « nettoyer le bruit » a donné des rayures).

### E3 — résultats
- **[OK]** Termes intérieurs (saturation, chroma ambiante, assombrissement du bas, compression tonale, surimpression) : quasi sans effet sur cette image (chemise L207 de L0 à L5 ; albedo seul 222).
  La pâleur vient surtout de l'**albedo** (chemise claire de la référence), pas du traitement.
- **[OK] Le liseré de silhouette est le seul terme nuisible** pour un art à contour sombre : mesuré porteur seul (`static=1`, contrôle L0 / L0 = 0 px) — B : 952 px écran éclaircis
  (luminance 23 → 90), C (forge) : 1 239 px (21 → 100) ; le contour devient bleu-gris / clair côté lumière. Sans liseré (L1) : contour net, intégration conservée.
- **[KO → corrigé]** Ma première mesure (4 419 px) était gonflée par le mouvement des autres PNJ entre captures ; le relecteur l'a relevé ; refaite en scène déterministe.

### Erreurs de méthode (pour ne pas les refaire)
- **[KO → corrigé]** Le retrait d'ombre par couleur mangeait le pantalon et les chevilles (sombres comme l'ombre et le fond) → règles de forme (fermeture verticale, îlots) + ombre limitée aux dernières rangées.
- **[KO → corrigé]** Recadrages A de la passe 2 qui coupaient le porteur. Toute mesure par différence d'images se fait en scène déterministe (`static=1` + aperçu) avec un contrôle à 0.

## Passe 4A-quater — E2 modelé : peindre la forme sur la trame ×1,5 (test seulement, aucun asset produit ni commité, 2026-10-15)

Cadre opérateur : uniquement le docker ×1,5 de la passe 2 ; démontrer un vrai modelé (volumes, plis, matières) dans Aseprite via les outils d'AI Artist ; lumière haut-gauche
sans lumière de scène peinte ; comparaison A (×1,5 passe 2) / B (×1,5 modelé) / C (×2 auto) / D (référence) à **même taille monde** — natif, plus proche voisin, caméras B / C / A
en L1 (sans liseré), aucun changement du rendu ; critique indépendante **à l'aveugle** ; 2 itérations au plus ; si le ×1,5 reste inférieur au ×2 sur formes, vêtements ou
expressivité : arrêter et recommander un autre pipeline. Pas d'E4, aucun personnage de production touché.

Temps réel (horloge) : 19:50:56 → 20:20:24, ≈ 29,5 min jusqu'à la 2e critique (Aseprite headless : quelques secondes par appel). Itération 1 : 19:51 → 20:04 (1a / 1b procédural,
1c retouches, 1d peint à la main) ; captures + critique 1 : 20:04 → 20:13 ; itération 2 : 20:13 → 20:16 ; captures + critique 2 : 20:16 → 20:20.

### Itération 1
- **[KO]** 1a / 1b, modelé procédural (normales de cylindres pour torse / manches / jambes, plis tracés, quantifié sur rampe) : du volume, mais une coupure **verticale** nette entre moitié
  éclairée et moitié ombrée (les rayures reviennent) ; pantalon trop clair et trop bleu — rampe montée à L ≈ 100 alors que la référence mesure **L 45-76** (échantillonnée ensuite).
- **[KO → corrigé]** 1c, retouches transversales posées par coordonnées : 2 px du contour de l'épaule droite écrasés et 1 px hors silhouette ; réparé en 1d.
- 1d : chemise et pantalon **peints à la main rangée par rangée** (rampes échantillonnées sur la référence : chemise 7 tons à ombres mauves chaudes, pantalon 7 tons ardoise-violet),
  avec contrôle « la cible est bien un pixel du vêtement » (0 avertissement), 512 px via `draw`.
- Critique aveugle 1 (agent neuf, étiquettes tirées au sort, clé hors de son champ, preuves de vue vérifiées) : **passe 2 1re, ×2 auto 2e, modelé 1d 3e** — « moucheture rose-crème
  sur la chemise, damier sur le pantalon : les formes se lisent comme une texture ». Volumes : 6 / 7 / 5. Gagnant chemise et pantalon : ×2. Cause trouvée dans ma spécification :
  des valeurs alternées à 1 px (ex. `BABABCBCCD`). Mesure : 25,2 % de pixels isolés dans les vêtements (passe 2 : 23,5 %).

### Itération 2
- Masses de 3-4 valeurs par forme, plis rendus par le **bord des aplats** (pas de ligne de 1 px), terminateur courbe sur le torse, blousant + 2 plis de rentré ; bouche ramenée à un trait
  de 2 px (la critique 1 lisait une bouche ouverte décentrée), ombre de mâchoire sur le cou ; 518 px via `draw`, `validate` 90.
- Mesure (vêtements, pixels intérieurs) : pixels isolés **16 %** (passe 2 23,5 ; 1d 25,2), alternances à 1 px **16,2 %** (26,4 ; 26,2).
- Critique aveugle 2 (nouvel agent, nouvelles étiquettes) : **it2 ≈ passe 2** (« it2 devant d'un cheveu, dans le bruit de jugement »), ×2 auto 3e au global. Volumes : it2 **4**,
  passe 2 5, ×2 6 — la chemise d'it2 « en carrés gris par blocs plutôt qu'en modelé » ; gagnant chemise + manches : ×2 (à l'échelle de la planche) ; pantalon : it2 (revers justifié,
  mais les deux jambes se fondent en scène) ; tête : it2 (bouche calme, proche de la cible).
- En scène (B, lumière chaude), la chemise des trois ×1,5 tire au blanc : le modelé ajouté y est à peine perceptible.

### Bilan — [KO] objectif non atteint, arrêt après 2 itérations
- Le modelé ×1,5 peint par l'agent **n'a pas été lu comme du volume** par deux critiques aveugles (volumes 5 puis 4, **sous** la passe 2 non modelée : 6 puis 5) et reste **inférieur
  au ×2 auto sur les formes** (7 puis 6). Les seuls gains sont des corrections **nommées et localisées** (bouche, revers de pantalon).
- La baisse du bruit mesurée (23,5 → 16 % de pixels isolés) n'a pas suffi : une métrique de propreté ne mesure pas la lecture de la forme.
- Les deux critiques donnent au ×2 la meilleure forme et les meilleurs plis et le pénalisent sur des **défauts de dessin localisés** : traînée rose de la bouche au col (lue « langue »),
  mèche sombre à droite jusqu'à l'épaule, bosse rectangulaire sur la calotte, chevilles / bottes fragmentées, contour qui disparaît sur les bras ; à 1:1 son détail devient mou
  (983 couleurs non quantifiées). À l'échelle de jeu, les ×1,5 se lisent aussi bien ou mieux (7 contre 5-6).
- **Recommandation** : arrêter le modelé sur ×1,5 ; essayer la **finition artistique du ×2** — partir du ×2 auto, quantifier en palette groupée (64-96 couleurs), corriger
  les défauts nommés ci-dessus (col / bouche, mèche, calotte, bottes, contour unifié) **sans repeindre les volumes**, puis même grille A/B/C/D en aveugle. Si elle échoue :
  **une meilleure source illustrée** (vue de face peinte à plus haute définition que la planche, dont la figure ne fait que ≈ 45-48 blocs) avant reconstruction sur grille — le ×2 n'a de
  la forme que parce qu'il rééchantillonne les dégradés peints à l'intérieur des blocs de la source.
- **[?]** Non testé : finition du ×2, tenue en mouvement, caméra D, autres graines.

### Erreurs de méthode (pour ne pas les refaire)
- **[KO → corrigé]** Variables shell écrasées par les étiquettes d'anonymisation (`M`, `R`, `K` = chemins) : premier jeu de panneaux vide ; refait avec des noms distincts.
- **[KO → corrigé]** Un outil de mesure découpait ses arguments sur « : » (chemins `C:`) → séparateur « | ».
- Contrôle de déterminisme de la capture refaite : 0 px (caméra B, passe 2). Auto-critique écrite **avant** chaque critique aveugle, pour comparer honnêtement.

Preuves (hors dépôt, dérivées de la référence) : dossier de travail de la session `e2m/` (it1d.png, it2.png, sources `.aseprite` 1c / 1d / 2, `scene1/`, `scene2/`, `critic-fs1/`,
`critic-fs2/`, `final/fs-*.png`, auto-critiques) et clés d'anonymisation à part. Runtime inchangé : aucun fichier `src/` touché par cette passe, bundle `index-B5BamZwF.js`
SHA-256 `f81b4d7b…` identique, exports temporaires `test-e2-fs-*` supprimés, `art:validate` 0 erreur.

## Passe 4A-quinquies — Direction PNJ « ×2 auto » et validation en scène du candidat C (test seulement, rien en production, 2026-10-15)

### Décisions opérateur (après revue manuelle d'E2)
- **Hiérarchie artistique.** Niveau 1, PNJ standards : qualité proche du sprite **C — ×2 auto** — proportions stylisées, visage expressif sans surdétail, volumes et matières
  préservés, finition Aseprite ciblée sur les vrais défauts, déclinaisons possibles plus tard (jamais de retour à des sprites génériques simplistes). Niveau 2, personnages clés :
  qualité supérieure (planches les plus raffinées), même direction générale.
- **Conséquence technique.** On n'impose plus une trame ×1,5 fortement retravaillée : d'abord **préserver la qualité de la source**, puis une finition Aseprite sélective. La voie
  « modelé ×1,5 » n'est plus la direction principale ; pas de nouvelle exploration large.
- **C — ×2 auto = candidat approuvé pour la validation en scène**, baseline à tester dans le Merchant District ; **pas** un Gold Master de production.
- Avant de verrouiller sa densité : stabilité en mouvement (surtout caméra A) et preuve qu'on sait produire un personnage **original** à ce niveau. Pas de roster, de
  généralisation ni de personnage clé pour l'instant.
- Rangement : le candidat (PNG, rapport, planche source, scripts de reconstruction, preuves) est copié dans `art-lab/characters/scratch/e2-x2-candidate/` (ignoré par Git via
  `art-lab/**/scratch/`, jamais commité ; README sur place). Pas de source `.aseprite` (sortie automatique directe). Reconstruction vérifiée **identique au bit près**
  (SHA-256 `62acd603…`) depuis la copie.

### Méthode (environnement inchangé, aperçu dev seul)
- `src/lab/runtimePreview.ts` (dev, compilé hors production) : `labdetail` (niveau de détail / protection DOF des acteurs du second rendu ; `crowd` = celui du porteur),
  `labscale` (échelle de présentation par acteur), `labfollow=1` (le premier acteur prend la place du joueur, masqué, chaque image : marche réelle dans les cadrages) et une poignée
  non énumérable sur le groupe du second rendu (les outils de mesure l'éteignent pour isoler les pixels du sprite). Aucune géométrie, lumière ou shader du district touché.
- Export temporaire `test-npc-x2c` (= le ×2, 64 × 96, pied rangée 90) + témoin `test-npc-x1c` (même art reconstruit en 32 × 48) dans `exports/`, recréés / supprimés par
  `scene/install-test-exports.sh` ; supprimés en fin de passe.
- Captures 1920 × 1080, graine 1842, `freeze=7.3` : caméras **A / B / C / D**, 3 emplacements chacune, AVANT (porteur runtime) / APRÈS (×2, traitement L0 actuel) / APRÈS L1
  (sans liseré), + mêmes vues en `static=1` pour les mesures (seul le sprite diffère). Scripts : `scene/run-captures.sh`, `project.mjs` (projection écran), `light.mjs`, `motion.mjs`.
- Revue indépendante (agent neuf, ne voit que les planches et la référence ; auto-évaluation écrite avant de lire son verdict : `scene/self-assessment.md`).

### Résultats
- **[OK] Lecture et qualité.** Le ×2 est nettement au-dessus du porteur runtime dans les 4 cadrages : rôle (« docker ») lisible en B à 1:1 par trois bandes de valeur
  + casquette ; visage lisible en B / C / D ; silhouette nette sur fonds chauds. Revue (avant / après, /10) : lisibilité 5 / 8, direction artistique 5 / 7, silhouette 5 / 7,
  visage 5 / 6, constance chaud / froid 5 / 7 ; par caméra A 5 / 6, B 5 / 7, C 5 / 7, D 5 / 6.
- **Densité écran mesurée** (px écran par texel du ×2, projection réelle) : A 0,96-1,24 (le bout du quai passe juste sous 1 : quelques texels sautent), B 1,8-2,2,
  C 2,25-2,62, D 1,97-2,42. Le liseré du rendu lit le texel voisin (`1.0 / uAtlasSize`) : il fait **1 texel**, donc deux fois moins de pixels écran sur le ×2.
- **[KO → réglage] Échelle monde.** Figure ×2 = 89 texels × 0,0235 m = **2,09 m** ; runtime (atlas) : héros 1,93 m, gardes 2,02, marchand / forgeron 1,88, encapuchonné 1,83,
  porteur 1,65. Le PNJ générique dépasse le héros ; à `labscale=0.9` (1,88 m) il passe juste dessous et la revue le juge juste (`review/scale-B.png`).
- **[OK/?] Lumière.** Luminance du ×2 aux 12 emplacements du même ordre que le porteur runtime (moyenne 86-130 contre 85-161) ; décile clair (chemise) **189-212 partout**,
  y compris dans le noir de D (fond 34-46) : la chemise « s'allume » dans les zones froides — trait du traitement des sprites, commun au cast, pas propre au ×2. Bascule chaud / froid
  (R−B) de +16 (A) à −8 (D).
- **L0 vs L1.** L1 (sans liseré) est meilleur sur fonds chauds (A / B / C : le contour du sprite reste continu, L0 le remplace par une frange lavande brisée) ; L0 aide en D
  (sépare casquette / bras du sol sombre). Pas de traitement par sprite : rendre le liseré **dépendant de la densité** (décision moteur).
- **[?] Mouvement, caméra A.** `motion.mjs` (pas fixe 1/60 s, rendu avec / sans le sprite, « churn » = part des pixels du sprite qui changent d'une image à l'autre après
  recalage) : contrôles immobiles **0 %** ; ×2 ≈ témoin ×1 partout (médianes A latéral 4,8 / 4,5 %, A profondeur 6,4 / 6,4, A bout du quai 6,0 / 5,8, B 6,0 / 6,0). Mais le
  **contrôle négatif** (échelle 0,6 : le ×2 à 0,6-0,7 px / texel) ne sépare pas non plus (8,6 / 8,2) : la mesure n'est **pas assez sensible** pour prouver l'absence de
  scintillement. Contrôle visuel : 8 images consécutives et la boucle `review/motion-viewer.html` sans popping visible (yeux, casquette, boucle présents à chaque image). Reste à juger
  par l'opérateur, et avec un vrai cycle de marche (le PNJ testé glisse sur une seule image).
- **[KO, cast] Cohérence avec le reste du casting.** Texels deux fois plus petits que ceux du héros et des autres PNJ, ≈ 3,2 têtes contre ≈ 2,4, visage à reflets contre yeux-points :
  à côté du héros (C emplacement 3, D emplacement 1, `scale-B`), c'est le héros qui devient le personnage le moins fin à l'écran. Non corrigeable sur ce sprite.
- **Défauts du sprite (corrigeables)** : traînée rose bouche → col lue comme une langue (B / C / D, visible à 1:1 en C) ; mèche gauche qui descend jusqu'à l'épaule ; moucheture
  sur la chemise et les cuisses (2 153 couleurs) ; casquette plus saturée que l'ardoise de la référence ; jambes qui se perdent sur sol sombre en D.

### Conclusion
- **[OK, sous conditions] C — ×2 auto fonctionne comme style de base des PNJ génériques** : bonne cible de qualité, meilleur que le porteur actuel sur lisibilité, rôle,
  palette et fidélité à la référence. Ce n'est **pas** un remplacement direct dans le cast actuel.
- **Prochaine étape recommandée (revue et moi d'accord) : (B) une très petite passe de nettoyage, puis verrouiller** : (1) bouche / col séparés (trait de 1-2 texels, ombre de
  mâchoire, V du col en ombre de chemise froide) ; (2) mèche gauche arrêtée à l'oreille ; (3) regroupement de palette + texels orphelins sur chemise et pantalon **sans repeindre
  les volumes** (la revue propose 32 couleurs ; l'échelle de palette d'E2 montre un aplatissement à 32 : tester 64-96) ; (4) optionnel, à arbitrer : chemise −10 % et casquette
  désaturée ; (5) hauteur par défaut 1,88 m (échelle 0,9 ou recadrage du cadre 64 × 96).
- **Conditions avant d'étendre la baseline** : décision de densité du cast (héros en ×2 d'abord, ou plan de migration) ; liseré dépendant de la densité ; politique sur les largeurs
  de texel inégales à ≈ 2 px / texel (B / C) ; cycle de marche testé en A ; preuve d'un personnage **original** au même niveau.

### Erreurs de méthode (pour ne pas les refaire)
- **[KO → corrigé]** Emplacement 3 de C caché derrière la bannière du bateau (le reveal ne protège que le joueur) → déplacé en (12,4 ; 0,2).
- **[KO → corrigé]** Premier cadrage d'échelle raté : en B, l'axe x est surtout de la **profondeur** ; une position « à côté » du joueur se calcule par projection (`project.mjs`).
- **[KO → corrigé]** `$(pwd)` en Git Bash donne `/c/...` : converti pour un argument seul, pas dans `"label|chemin"` → `pwd -W`. `boxes.txt` sans fin de ligne finale : la dernière
  ligne sautait dans `while read`.
- Captures : quelques images isolées où le masque du sprite explose (même sur un trajet immobile) = défaut ponctuel de capture, écarté par médiane / p90, signalé dans le rapport.
- Le serveur de dev dédié meurt avec la reprise de session : le relancer (`:5180 --strictPort`) avant toute capture.

Preuves (hors dépôt, dérivées de la référence) : `art-lab/characters/scratch/e2-x2-candidate/scene/` — `shots/` (captures brutes), `review/` (planches A-D plein cadre et
emplacements, `scale-B`, bandes de mouvement, `motion-viewer.html`), `motion*/` + `motion-report.json`, `light.json`, `projections.json`, `self-assessment.md`. Runtime inchangé :
bundle `index-B5BamZwF.js` SHA-256 `f81b4d7b…` identique, typecheck OK, `art:validate` 0 erreur, exports temporaires supprimés, rien commité.

## Passe 4A-sexies — Très petite passe de nettoyage du ×2 + validation en scène A-D (approuvée, test seulement, 2026-10-16)

Approbation opérateur : bouche / col, mèche gauche, palette regroupée **sans repeindre les volumes**, hauteur 1,88 m ; même validation A-D ; **arrêt avant verrouillage**.
Outil : Aseprite AI Artist 0.8.2 en **headless** (outils MCP du plugin dans la session : `sprite_manage`, `palette`, `recolor`, `look`, `draw`, `validate`, `export`).
Temps réel : 00:21 → 00:27 édition v1 (≈ 6 min) ; captures + critique jusqu'à 00:36 ; v2 00:36 → 00:39 ; retour à v1 00:46.
Source : `art-lab/characters/scratch/e2-x2-candidate/clean/x2-clean.aseprite` → `x2-clean.png` (64 × 96, pied 90, SHA-256 `9e1de3ba…`), dossier ignoré par Git.

### Ce qui a été fait (v1, retenue)
- **[OK] Palette** : k-means OKLab **64 couleurs** pondéré visage (déjà produit en E2, figé) : erreur moyenne 12,1 ‰ (max 43), indiscernable de la source à l'œil.
  **[KO]** L'extraction d'Aseprite (`palette extract` 96 / 64) remplace la palette **sans remapper** les pixels malgré `remapArt` ; après `recolor snap`, erreur 16-18 ‰ (max 69) et
  chemise rosie / marbrée (`clean/pal-compare.png`) → rejetée.
- **[OK] Texels orphelins** : 9 seulement (majorité 6/8 très proche, visage exclu pour garder les reflets des yeux). La moucheture vue en jeu est un marbrage de 2-3 texels
  hérité de la peinture : la lisser serait repeindre, non fait.
- **[OK] Bouche / col** : bouche 3 × 2 orange → trait fermé de 2 texels centré entre les yeux ; V du col (x 33-40, rangées 32-37) : **mêmes valeurs, chroma rouge retirée**
  (15 `replace` limités à la zone). La traînée « langue » disparaît dans les 4 caméras.
- **[OK/?] Mèche gauche** : la poche sombre sous l'oreille (5-7 texels, rangées 26-30 = fond de la référence enfermé) devient du fond, contour refermé ; la mèche s'arrête
  à l'oreille. Reste un contour + ombre de mâchoire de 2-3 texels jusqu'à l'épaule (lu « partiel » par la critique).
- **Hauteur 1,88 m** = échelle de présentation **0,9** (donnée, aucun pixel touché ; `labscale=0.9`). Conséquence : en A le ×2 descend à **0,86-1,11 px écran / texel**
  (B 1,6-2,0, C 2,0-2,35, D 1,8-2,2).
- `validate` 100 (notes : 65 entrées de palette, pas de couleur unique de contour), 66 texels modifiés sur la base 64 couleurs.

### Validation
- Captures A-D, mêmes 3 emplacements, avant (porteur runtime) / ×2 auto / ×2 nettoyé (tous deux à 1,88 m) / nettoyé L1, + vues `static=1` (contrôle déterministe : 0 px)
  et échelle à côté du héros (`scene/run-captures-clean.sh`, planches `scene/review-clean/`).
- **Critique à l'aveugle** (Q / Z tirés au sort, clé hors champ ; auto-évaluation écrite avant : `clean/self-assessment.md`) : nettoyé **nettement meilleur** que ×2 auto,
  uniquement par la bouche / le col — visage 7 contre 4, col / cou 6 contre 3, proximité de la cible 7,5 contre 6, lisibilité 1:1 B 8 / C 8 / D 7 / A 7 (contre 6 / 6 / 5 / 6).
  Aucune régression ailleurs (« identiques pixel pour pixel hors visage et col », pas de dérive de couleur). Verdict : **« oui, avec une réserve mineure »** pour verrouiller.
  Défauts restants signalés : V du col faible / gris moucheté (lu « barbe naissante » en D), colonne sombre des deux côtés de la tête jusqu'à l'épaule (cou peu visible),
  bas du visage un peu long, marbrage des cuisses en C (léger). Hors sprite : densité de texel mélangée avec le cast, frange bleue du liseré sur le contour.
- **[?] Marche en caméra A** à 1,88 m (bout du quai, 1,04 → 0,9 px / texel, quelques texels sautent) : 8 images consécutives sans popping visible (yeux, casquette, boucle) ;
  churn 6,5 % contre 6,1 % pour le témoin ×1 — mesure insensible (cf. 4A-quinquies), jugement visuel seulement ; boucle dans `scene/review/motion-viewer.html` (3e colonne).

### Essai rejeté (v2)
- **[KO]** Micro-retouche sur les deux réserves (41 texels : peau du cou sous l'oreille gauche ; V net = ombre de gorge sombre + rabats) : à la vraie grille, l'ombre de gorge forme un
  **croissant sombre** sous le menton, lu ras-de-cou / bavoir en C et D (critique à l'aveugle v1 / v2 : différence non résolue à l'échelle des planches, mais le défaut est nommé ;
  vérifié moi-même à ×6 / ×12 : `clean/neck-v1-v2.png`). Gain du cou négligeable. Retour à v1, restaurée au bit près ; v2 archivée (`clean/x2-clean-v2-rejected.aseprite`,
  `scene/shots-clean-v2-rejected/`). Pensée : un V de col à cette densité se règle **avec la peau** (rangée claire entre menton et ombre), pas avec une masse sombre.

### Conclusion (arrêt avant verrouillage, comme demandé)
- Le ×2 nettoyé (v1) est le **candidat prêt à verrouiller** comme qualité de base des PNJ génériques, sous réserve mineure. À décider par l'opérateur : verrouiller tel quel, ou
  une dernière retouche du col (rangée de peau entre menton et ombre, V étroit, un texel ivoire par pointe de col) et / ou de la colonne sombre droite (non approuvée ici).
- Conditions inchangées avant d'étendre : densité du cast (héros), liseré dépendant de la densité, politique des largeurs de texel inégales, cycle de marche, personnage original.

### Erreurs de méthode (pour ne pas les refaire)
- `palette extract` d'AI Artist 0.8.2 ne remappe pas les pixels d'un sprite RGB : enchaîner `recolor snap` et **mesurer l'erreur** (`clean/qerr.mjs`) avant d'adopter une palette.
- `look` `ascii` refuse un sprite de plus de 261 couleurs : regrouper la palette avant toute édition au texel.
- Planche de critique trop réduite (3 442 px affichés à 2 000) : une différence de 1-2 texels doit être montrée **à la vraie grille** (×6-×12), sinon la critique ne peut pas trancher.
- `projections.json` / `project.mjs` ignoraient l'échelle d'acteur : corrigé (`info.scale`). La bande de mouvement de la v1 vaut pour la version retenue.

Preuves (hors dépôt) : `art-lab/characters/scratch/e2-x2-candidate/clean/` (source, palettes testées, retouches `edit1.json` / `edit2.json`, comparaisons) et `scene/`
(`shots-clean/`, `review-clean/`, `critic-clean/`, `critic-clean-v1-v2/`, `motion-far-clean/`). Runtime inchangé : bundle `index-B5BamZwF.js` SHA-256 `f81b4d7b…`, typecheck OK,
`art:validate` 0 erreur, exports temporaires supprimés, rien commité.

## Passe 4A-septies — Baseline PNJ approuvée et validation dynamique en Merchant District (chemin expérimental, rien en production, 2026-10-16)

### Décision opérateur (2026-10-16)
- **×2 nettoyé v1 = baseline visuelle approuvée des PNJ standards** (v2 rejetée). Ce n'est **pas** un Gold Master technique complet ni une autorisation de production.
  Conserver exactement ses sources, sa provenance, ses paramètres de reconstruction et ses preuves ; **pas d'autre retouche artistique** pour l'instant.
- Direction : PNJ standards = qualité du ×2 nettoyé v1 ; personnages clés = finition et expressivité supérieures ; **une seule direction artistique, des budgets de précision
  différents** ; **ne jamais dégrader le nouveau personnage pour l'aligner sur les anciens sprites**. Le personnage reste dans un chemin expérimental jusqu'à l'approbation
  de son intégration ; arrêt pour arbitrage avant toute variante ou tout nouveau personnage.
- **[OK] Provenance figée** : `art-lab/characters/scratch/e2-x2-candidate/PROVENANCE.json` (14 fichiers sous SHA-256 : sprite, source `.aseprite`, base 64 couleurs, ×2 plein,
  planche source, retouches, scripts ; paramètres de reconstruction ; étapes de nettoyage ; décisions datées) + `verify-provenance.mjs` (« baseline intact ») ; fichiers clés
  en lecture seule. **Risque** : ce dossier est ignoré par Git et n'existe que sur cette machine (un `git clean -X` l'effacerait) — stockage durable à décider.

### Méthode (environnement et effets intacts, aucune animation ni orientation ajoutée)
- `src/lab/runtimePreview.ts` (dev seul) : `labfollow=1` (le PNJ prend la place du joueur, masqué), `labscale`, `labdetail` ; hauteur = échelle de présentation, **texture
  inchangée** (64 × 96).
- `scene/dyn/dynwalk.mjs` : boucle de l'appli reprise à **pas fixe 1/60 s**, joueur piloté par les **vraies touches** (même pilotage que `tools/camsim.mjs`) → zones, transitions,
  collisions, DOF, reveal du jeu. Par image : recadrage 1:1 (séquences), pixels du sprite isolés (rendu avec / sans), churn (part des pixels qui changent d'une image à la
  suivante après recalage ±3 px), silhouette, part du contour restée sombre. Itinéraires vérifiés d'abord avec `camsim` : quai A → AB → B → BC → C → CD → D (881 images),
  bord de l'eau B → BD → D sans C (503).
- 9 marches : quai à **1,88 / 1,75 / 1,65 m**, quai au **témoin ×1** (même art en 32 × 48, **même renderer de labo** : la comparaison isole la densité), bord de l'eau,
  3 **PNJ fixes** sous caméra mobile, caméra C **avec / sans liseré**. Visionneuses `scene/dyn/viewer-*.html` (lecture 60 / 30 / 15 / 4 i/s, curseur, zoom, état caméra par image).
- Revue indépendante sur planches d'images consécutives (auto-évaluation écrite avant : `scene/dyn/self-assessment.md`).

### Résultats
- **[OK] Stabilité ×2 = densité actuelle** (churn médian ×2 / ×1, même trajet) : A 5,7 / 5,6 %, B 7,5 / 7,3, C 9,4 / 9,6, D 10,2 / 9,8, transitions 11,4 / 10,3. La revue voit
  la même chose sur les images consécutives en B (« aussi stable que ×1, bien plus lisible »). Contrôles immobiles : 0 %.
- **[?] Caméra A** (1,1-1,2 px écran / texel) : la revue voit des détails d'**un texel** changer d'une image à l'autre (taches de la calotte, bouche, bord de casquette) — la
  perte de texels attendue du plus proche voisin près de 1:1 ; les grands blocs restent stables. La mesure ne le détecte pas (A a le churn le plus bas) : **le churn ne mesure
  pas le scintillement de texel** (confirmé : il compte surtout lumière, DOF, reflets ; cf. 4A-quinquies). PNJ fixes lointains : jusqu'à 0,57 px / texel en A.
- **[OK] Transitions** AB / BC / CD : croissance / réduction progressive, aucun saut ; CD ancré tient taille et position.
- **Hauteurs** (même texture) : churn médian 1,88 / 1,75 / 1,65 m — A 5,7 / 6,0 / 6,1, B 7,5 / 8,2 / 8,7, C 9,4 / 9,4 / 10,2, D 10,2 / 10,4 / 11,0. Px / texel en B : 1,9-2,0 /
  1,7-1,9 / 1,6-1,8. **1,88 m** est le plus stable (proche de 2 px / texel en B) et le plus proche du héros (1,93 m).
- **PNJ fixes, caméra mobile** : médianes B 4,5 %, C 4,4 %, D 6,2 %. Les pics viennent d'**occlusions réelles** (héros ou PNJ qui passent devant ; ellipse de reveal du joueur
  qui découvre à moitié un PNJ placé derrière la bannière — le reveal ne protège que le joueur, conçu ainsi), pas du sprite.
- **Contours** : part du contour restée sombre A 3,7 %, B 19, C 34, D 57 (×1 : 1,6 / 16 / 30 / 53). Caméra C : liseré L0 28,6 % contre L1 45 %, churn identique → le liseré ne
  déstabilise pas, il éclaircit le contour (lisibilité) ; en D le pantalon se fond dans les pavés sombres.
- **DOF** : le PNJ reste net partout où il est le sujet ; PNJ fixes nets en B / C / D.
- **[OK] Performances** (`tools/perf.mjs`, caméra B, 3 tours entrelacés, bruit ≈ ±0,2 ms) : base 9,23 ms GPU ; renderer actuel +8 / +32 porteurs 9,63 / 9,67 ; ×2 1 / 8 / 32 PNJ
  9,15 / 9,31 / 9,54 ; témoin ×1 32 PNJ 9,68. **Coût égal au renderer actuel** à la marge de mesure ; le chemin expérimental ajoute **4 appels de dessin fixes** (son propre
  renderer) ; texture 24 Ko par image de sprite (6 Ko en 32 × 48). Non mesuré : plusieurs feuilles ×2 différentes, animations.
- **[KO → expliqué] « Image noire » 718** relevée par la revue en transition CD : JPEG de séquence seul (1,8 Ko), la même image est normale dans les 3 autres marches et la mesure
  (captures PNG) est normale → **raté de capture**, pas le rendu. 7 sur 7 396 JPEG au total, à des images différentes ; les visionneuses les signalent et affichent l'image
  précédente ; `dynwalk.mjs` reprend désormais toute capture anormalement petite.

### Conclusion (arrêt pour arbitrage, comme demandé)
- **Revue : « oui, avec conditions » pour passer à la planification de l'intégration** (pas à l'intégration). Moi : d'accord.
- Conditions moteur / scène : (1) **politique sous ≈ 1,2 px / texel** (caméra A, PNJ lointains, résolutions plus basses) : feuille préfiltrée ou repli 32 × 48 — à tester
  pour le popping ; (2) **densité du héros et du cast** : le héros 32 × 48 paraît plus grossier que les figurants ×2 (décider avant d'étendre) ; (3) **reveal de la bannière** :
  un montant sombre n'est pas découpé et coupe le joueur, la casquette tombe dans la bande tramée, la trame « rampe » quand l'ellipse bouge (Passe 3, pas le sprite ; à examiner) ;
  (4) un **renderer de sprites unique** pour le ×2 (aujourd'hui second renderer expérimental : vérifier surimpression 55 %, masque DOF, miroir, grille de lumières) ;
  (5) liseré par caméra ou L1 (lisibilité seulement).
- Sprite (aucune retouche faite, conformément à l'arrêt) : détails d'un texel qui clignotent sous ≈ 1,2 px / texel ; contraste pantalon / pavés en D ; cycle de marche et autres
  orientations non testés (à refaire avant d'en faire la baseline « PNJ qui marche »).

### Erreurs de méthode (pour ne pas les refaire)
- **[KO → corrigé]** Itinéraire en ligne droite → le joueur bute contre l'étal (3 900 images au lieu de 881) puis contre les bornes du bord de l'eau (x ≈ 9, z 3,4 / 3,6) :
  **valider un itinéraire avec `camsim` (sans rendu, secondes) avant toute marche capturée**.
- **[KO → corrigé]** Captures puppeteer qui pendent : (a) un onglet ouvert après la page de scène la met en arrière-plan (plus d'images produites) → `bringToFront` ;
  (b) deux captures de suite sans nouveau rendu ; (c) `clip.scale` (redimensionne la page). Avec la boucle reprise à la main : **un rendu avant chaque capture**.
- **[KO → corrigé]** `tools/perf.mjs` vise :5173 par défaut : passer `BASE_URL` du serveur dédié.
- Je ne suis réveillé qu'à la fin d'une commande d'arrière-plan : pour une série longue, un `Monitor` qui émet à chaque étape (sinon l'opérateur doit relancer).

Preuves (hors dépôt) : `art-lab/characters/scratch/e2-x2-candidate/scene/dyn/` (`runs/` 9 marches, `report.json`, `perf.json` + `run-perf.log`, `review/`, visionneuses,
`self-assessment.md`, `README.md`). Runtime inchangé : bundle `index-B5BamZwF.js` SHA-256 `f81b4d7b…`, typecheck OK, `art:validate` 0 erreur, exports temporaires supprimés.

## Passe 4A-octies — Conservation versionnée de la baseline et contrat d'intégration multi-résolution (2026-10-16)

### Décisions opérateur (2026-10-16)
1. Rapport dynamique validé : **×2 nettoyé v1 = baseline artistique ET dynamique approuvée des PNJ standards** — pas une approbation d'intégration en production, ni de ses
   futures animations / orientations.
2. Conservation durable et versionnée (pas seulement `scratch/`), provenance et droits de la planche vérifiés **avant** de proposer son archivage, statut distinguant
   *approved visual baseline* et *approved production asset*.
3. Densité ×2 (64 × 96) conservée ; **pas de LOD ni de repli 32 × 48** (résultats insuffisants pour le justifier) ; la limite de la caméra A reste un **point de QA**.
4. **Hauteurs monde = paramètres indépendants de la résolution** ; 1,88 m n'est pas une taille universelle.
5. Contrat technique d'intégration dans `SpriteAtlas` / `SpriteRenderer` à présenter **avant** implémentation ; pas de remplacement des sprites, pas de refonte.
6. Héros inchangé ; le standard ×2 vise les PNJ ordinaires, les personnages clés auront un budget supérieur.
7. Anomalie du montant de la bannière = **problème d'occlusion indépendant**, reveal non modifié ; tout nouvel occluder exige un inventaire visuel et technique.
8. Prochaine priorité artistique : un **deuxième PNJ original** de même qualité (pas d'amélioration sans fin du premier) ; pas de roster, de refonte du héros ni d'animations
   complètes sans nouveau contrat. Arrêt pour validation après cette passe.

### Provenance et droits de la planche source
- **[?] Droits non vérifiables** : la planche « 16 generic townsfolk » (WebP 302 814 octets, SHA-256 `1c3bc603…36ce`) ne porte **aucune métadonnée de provenance** (profil ICC sRGB
  seul : ni EXIF, ni XMP, ni auteur, ni générateur) ; elle a été fournie par l'opérateur en séance (fichiers 1, 4 et 5 identiques). Origine et droits d'usage à confirmer par
  l'opérateur. **Non archivée dans Git** (règle de `reference/README.md`) ; identifiée par empreinte et recadrage. Les images dérivées (×2, nettoyé, preuves) héritent de cette
  question ouverte.

### Conservation (fichiers suivis, prêts à commiter)
- Manifeste `art-lab/characters/manifests/dockworker-x2-v1.manifest.json` : `status: approved`, `approved: true` (opérateur, 2026-10-16), **`runtimeUse: "lab"`** = *approved visual
  baseline* ; *approved production asset* = `runtimeUse: "production"`, réservé à une tâche explicite + droits confirmés (convention écrite dans `art-lab/characters/README.md`).
- Source `art-lab/characters/source/dockworker-x2-v1.aseprite` (v1) ; export Aseprite `exports/dockworker-x2-v1.png` + `.json` (identique pixel pour pixel à la v1).
- Paquet de provenance `art-lab/characters/provenance/dockworker-x2-v1/` : `PROVENANCE.json` (SHA-256 de 9 fichiers, paramètres, étapes, décisions datées, point de QA),
  `x2-auto.png` (×2 original), `x2-quant64.png`, `cleanup-ops.json`, `reconstruction-report.json`, `README.md`.
- Outils portables : `tools/art-lab/reconstruct-grid.mjs` (reconstruction sur grille, sans chemin machine), `tools/art-lab/replay-pixel-ops.mjs` (rejoue les opérations
  `draw` enregistrées sans Aseprite), `tools/art-lab/verify-provenance.mjs` (empreintes ; `--sheet` + `--rebuild` : chaîne complète).
- **[OK] Chaîne complète vérifiée** : planche → ×2 plein **bit pour bit**, → 64 couleurs **bit pour bit**, → nettoyage rejoué **pixel pour pixel** = export approuvé ; contrôle
  négatif (autre planche) refusé. Preuves essentielles : `art-lab/characters/reviews/dockworker-x2-v1/` (6,6 Mo, aucune image ne contient la planche elle-même).
- **[KO → corrigé]** J'avais écrit (4A-sexies, `PROVENANCE.json` local) que le k-means 64 couleurs n'était pas déterministe : il l'est (initialisation déterministe) — la
  reconstruction refaite redonne le fichier au bit près. Et j'ai d'abord écrit de mémoire une empreinte complète de la planche (seuls 16 caractères étaient connus) : remplacée
  par la valeur calculée avant toute vérification. Pensée : une empreinte se calcule, ne se recopie jamais.

### Contrat d'intégration (proposition, rien d'implémenté)
- `art-lab/characters/runtime-integration-contract.md`. Fait mesuré : atlas 512 × 720 (234 images, 2,9 Mo), un renderer instancié, **taille monde et décalage des pieds
  partagés**. Invariant proposé : une densité *k* = cadre 32k × 48k, pieds à la rangée 45k → **même rectangle monde** (1,504 × 2,256 m, 0,141 m) : aucun changement de shader
  pour la taille ou l'ancrage, la densité ne change que la case d'atlas ; hauteur = échelle par instance. Changements : cases *k × k* dans le même atlas (aucun appel de dessin
  en plus), `BakedSpec`, chargeur réservé aux manifestes `production` (cuisson au build recommandée), repli « face / idle » au lieu de faire disparaître un PNJ incomplet,
  apparitions hors du flux RNG. 6 tests d'acceptation (dont pixel-identique sans PNJ ×2, et pixel-identique au rendu validé de l'aperçu) ; 10 risques (dont **droits de la
  planche bloquants pour la production**).

### Erreurs de méthode
- Voir les deux corrections ci-dessus. Le dossier `scratch/` reste la seule copie de la planche source et des preuves complètes : à décider avec l'opérateur.
- **[KO → corrigé]** Empreintes de fichiers texte prises brutes : un checkout Git sous Windows convertit les fins de ligne (CRLF) et la vérification aurait échoué ailleurs ; l'export
  JSON d'Aseprite est même écrit en CRLF. Règle désormais : texte (`.json .mjs .js .ts .md .txt`) haché en LF, binaires tels quels (`hashRule` dans `PROVENANCE.json`), testé sur
  une copie CRLF simulée (5 / 5).

## Passe 4A-nonies — Vérification de provenance de la planche source et contrat d'intégration v2 (rien d'implémenté, 2026-10-16)

### Décisions opérateur (2026-10-16)
- Commit local `eecea58` accepté comme étape préparatoire, à garder intact ; ni push ni fusion sans autorisation.
- Déclaration de l'opérateur : les planches originales de référence de Cité du Tournoi ont été générées avec ChatGPT / OpenAI sous notre direction artistique. Demande :
  vérifier que `4.webp` en est une (et non une inspiration externe), sans déduire de métadonnée ni fabriquer de preuve ; statut inchangé tant que ce n'est pas vérifié.
- Contrat : direction **approuvée en principe** (un `SpriteRenderer` commun, plusieurs densités, un atlas unifié), **implémentation non autorisée** ; présenter le contenu,
  les 6 tests, les 10 risques et les fichiers touchés (compatibilité 32 × 48, ancrage des pieds, filtrage, animations futures, mémoire GPU, batching).
- Deuxième PNJ original : pas avant validation du contrat **et** de la méthode de création de la nouvelle source artistique.

### Provenance de `4.webp` — [?] plausible, non démontrable depuis le fichier
- **Identité** : `4.webp` = images 1, 4 et 5 collées par l'opérateur dans cette séance (15/10, 21:32:58 et 22:51:56 UTC), octet pour octet (SHA-256 `1c3bc603…36ce`,
  302 814 o), = `scratch/e2-x2-candidate/input/reference-sheet-4.webp`. Aucune déclaration d'origine en séance avant celle du 16/10.
- **Contenu** : titre « Cité du Tournoi — Merchant District — Night », « NPC SPRITE PRODUCTION REFERENCE — 16 GENERIC TOWNSFOLK (UNIFIED STYLE & SCALE) », 16 personnages
  numérotés × 4 vues ; l'image 2 continue la série (n° 17-24, même en-tête), l'image 3 porte aussi le nom du projet. Le nom du projet fait partie de la composition : rien
  n'indique une œuvre extérieure — ce n'est pas pour autant une preuve d'auteur ou d'outil.
- **Fichier** : WebP VP8 avec pertes, 1448 × 1086, un seul bloc de métadonnées = profil ICC sRGB générique de 456 o (copyright « Google Inc. 2016 », typique d'un encodeur
  Chromium / Skia) ; ni EXIF, ni XMP, ni C2PA. Les 3 images collées ont le même profil → **copies transcodées par le copier-coller**, pas les fichiers d'origine.
- **Indice, pas preuve** : 1448 × 1086 (et 1122 × 1402 pour l'image 3, pendant portrait de 1402 × 1122) sont des tailles natives de ChatGPT : sur cette machine, des PNG
  « ChatGPT Image … » (mai 2026) à ces tailles portent un manifeste C2PA d'OpenAI ; aucune image Gemini locale n'a ces tailles.
- **Original introuvable localement** : inventaire en lecture seule de 24 674 images (Bureau, Téléchargements, Documents, Images, Vidéos ; OneDrive par nom seulement, rien lu
  pour ne pas télécharger de fichier cloud) : aucun « ChatGPT Image » postérieur au 30/08/2026 lié à ce projet ; comparaison en vignettes 96 × 72 avec les 34 images 4:3 :
  meilleur écart 30,1, contre 23,1 pour la planche sœur (image 2) et 0 pour elle-même → aucun original sur le disque.
- **Conclusion** : cohérent avec la déclaration, **non vérifié**. Aucun fichier de provenance modifié ; manifeste inchangé (`approved` visuel, `runtimeUse: "lab"`), droits
  « UNCONFIRMED ». Voie de preuve : l'opérateur récupère l'original dans son compte ChatGPT (bibliothèque ou conversation, PNG téléchargé) → vérification de la présence et du
  contenu du manifeste C2PA (émetteur OpenAI) et de la correspondance visuelle (copie avec pertes : comparaison par écart, pas par empreinte), puis documentation. La
  validation cryptographique de la signature demanderait un outil (`c2patool`) à installer : sur autorisation seulement.

### Contrat d'intégration v2 (proposition, rien d'implémenté)
- `art-lab/characters/runtime-integration-contract.md` : sections **8 (compatibilité)** et **9 (fichiers touchés)** ajoutées après relecture du code et mesures dans l'appli
  (graine 1842) ; test 1 dédoublé (a : aucun asset chargé → atlas identique à l'octet ; b : asset chargé mais non placé → image identique au pixel) ; R11 (lecture de la case
  voisine au bord d'un quad), R12 (vue de côté miroir pour les orientations futures).
- **Mesures** : dernière rangée opaque **45 dans 232 des 234 cases générées** (les 2 bulles : 43), ×2 v1 : **90** ; **0 texel opaque sur le pourtour** de chaque case (générées
  et ×2 v1, marges G 13 / D 10 / H 2 / B 5) ; 0 texel semi-transparent dans le ×2 v1 ; atlas 512 × 720 ; `MAX_TEXTURE_SIZE` 16 384 sur cette machine.
- **[KO → corrigé]** La v1 annonçait un plafond de 4 096 texels : WebGL2 ne garantit que 2 048 → **104 images ×2** à largeur 512, contrôle au démarrage.
- Points précisés : la foule tire ses places en évitant une liste `taken` (y ajouter les PNJ cuits déplacerait la foule → ajout en fin de `populate`, chevauchement signalé) ;
  `Actor.height` (ombres, bulle) est distinct de `scale` ; `frameIndex` ignore les durées Aseprite (cadences fixes) ; l'émissif occupe 1 canal sur 4 (R8 = −37,5 %, hors contrat).

### Erreurs de méthode
- **[KO → corrigé]** `cat > "$TMPDIR/…"` sans heredoc a attendu l'entrée standard (commande bloquée, fichier vide créé dans le Temp, supprimé) ; un `find` sur tout le profil a
  dépassé 5 min → inventaire Node ciblé (dossiers lourds sautés, OneDrive par nom seulement).

## Passe 4A-decies — Contrat v3 amendé, implémentation expérimentale de l'atlas partagé (flag dev, rien en production, 2026-10-16)

### Décisions opérateur (2026-10-16)
1. **Provenance** : « Je confirme que nos planches de référence originales ont été créées avec ChatGPT sous ma direction artistique. » À
   enregistrer comme **déclaration opérateur**, distincte d'une provenance vérifiée ; aucune métadonnée fabriquée ; vérifications à compléter
   si le PNG original revient. Expériences locales autorisées, **production bloquée**.
2. **Contrat v2 accepté avec amendements** — principes : un `SpriteRenderer` partagé, un atlas 32 × 48 + 64 × 96, aucun changement de shader
   de production si les invariants suffisent, ancrage / DOF / éclairage / ombres / occlusion conservés, **rendu des personnages existants
   inchangé**, pas de LOD, environnement intact. A : prouver que l'agrandissement de l'atlas garde exactement les anciens pixels et le rendu
   32 × 48 malgré les nouvelles UV normalisées ; B : repli face / repos seulement pour un asset expérimental immobile et explicite, en
   production chaque orientation / animation nécessaire est validée, aucune absence masquée ; C : comparer module TS généré et PNG / atlas
   précuits versionnés (build, bundle, chargement, mémoire, appels de dessin), le plus simple à qualité identique.
3. Implémentation expérimentale autorisée **sous flag dev** ; six tests avec contrôles négatifs ; générateur, caméras, reveal intouchés ;
   s'arrêter si une contrainte sort du périmètre.
4. Deuxième PNJ : stratégie validée (source originale, archétype distinct du docker — **artisane ou marchande** d'abord —, qualité au moins
   ×2 v1, reconstruction ×2, finition Aseprite limitée aux défauts réels, critique indépendante, validation en scène) ; **pas pendant
   l'implémentation**. Garder `eecea58` et sa provenance, commit local permis, rien poussé / fusionné, arrêt avant toute activation production.

### Provenance — [OK] déclaration enregistrée, [?] non vérifiée
- `provenance/dockworker-x2-v1/source-declaration.json` (nouveau ; aucun fichier de `eecea58` modifié, `verify-provenance` : intact) :
  phrase de l'opérateur citée, nature « déclaration, pas une preuve », faits techniques (aucune métadonnée, copie transcodée, taille native
  ChatGPT = indice, original introuvable), « rien n'est déduit », conséquences (local oui, production non), étapes si l'original revient.
  `verify-provenance.mjs` l'affiche à part (non hachée). README des personnages à jour.

### Implémentation (flag dev `?baked=`)
- `BakedSprites.ts` (types, `requiredFrames`, `checkBakedSheet`) ; `SpriteAtlas.build(specs, baked, maxTextureSize)` : blocs cuits rangés
  **dans les rangées de données au-dessus** des cases générées (octets et expressions UV des cases générées inchangés), alias face / repos
  **explicites et listés** ; `ActorSystem` : apparitions écrites ajoutées après toutes celles de la graine, hors `taken`, refusées avec une
  erreur explicite s'il manque une image requise ; `spawn` accepte un `t` (plus d'appel à `Math.random` pour elles) ; `App` / `main.ts` :
  chargeur DEV en import dynamique ; `src/lab/bakedLoader.ts` : barrière manifeste, SHA-256 contre le paquet de provenance, décodage PNG exact,
  tags Aseprite `<anim>-<dir>`, harnais de mesure. **`SpriteRenderer.ts` et tous les shaders : non modifiés** (B se règle avant l'apparition).
- Outils : `tools/art-lab/baked-proof.mjs` (captures déterministes, parade, auto-test, règles, acteurs), `png.mjs`, `storage-bench.mjs`,
  `dynwalk.mjs` + `dynwalk-report.mjs` (sortis de `scratch/`, compatibles avec les deux chemins). Bundle de production 818 648 → 822 553 o
  (+3,9 Ko : code de l'atlas partagé, inerte sans feuille cuite) ; chargeur DEV absent du bundle (vérifié par chaînes).

### Résultats (base = arbre `eecea58` servi sur :5181 ; détail : contrat section 12, preuves `reviews/shared-atlas-4a-decies/`)
- **[OK] Test 1** : atlas sans feuille cuite identique à l'octet ; cadrages A-D avec personnages et `static=1` : 0 px (8 vues) ; feuille chargée
  non placée (atlas 816) : rangées générées identiques, 0 px (8 vues). **Parade** des 234 images générées, atlas 720 / 816 / 1968 : 0 px
  (27 rendus) ; **contrôle négatif** (UV normalisées par l'ancienne hauteur) : 480 000 à 1 200 000 px.
- **[?] Amendement A — égalités de texel** : balayage de 17 échelles : 816 → 0 / 51 rendus ; 1968 → **1 rendu sur 51** (échelle 2,1 :
  1 032 px sur 5 lignes). Et un cas réel à 816 : **caméra C, le héros, 16 px sur une ligne** (test 3). Mécanisme : un bord de texel tombe
  exactement au centre d'une ligne de pixels ; `floor(vUv × H)` départage l'égalité par l'arrondi flottant, qui dépend de la hauteur de
  l'atlas. Les deux résultats sont des échantillons justes (le bord se déplace d'une ligne de pixels), mais l'image n'est plus identique au
  bit. Les octets, eux, ne bougent jamais.
- **[OK] Test 2** : bloc ×2 dans l'atlas principal = export décodé indépendamment (0 octet) ; échantillonnage GPU aux échelles 1 / 2 / 3 /
  2,37 : 0 texel faux ; contrôles négatifs (rangée décalée d'une ligne : 6 616 ; linéaire non centré : 10 804).
- **[OK] Test 3** : 12 PNJ ×2 aux places de 4A-sexies, ancien renderer d'aperçu vs renderer principal : **0 px sur chaque PNJ ×2** (A-D) ;
  le seul écart de l'image (C, héros) est l'effet A ci-dessus (l'aperçu garde un atlas de 720 rangées).
- **Test 4** : **[OK]** même outil (`dynwalk.mjs`, `Math.random` à graine, horloge figée par image), routes de 4A-septies. Quai 1,88 m, churn
  médian chemin partagé / ancien aperçu / 4A-septies : A 5,8 / 5,7 / 5,7, B 7,6 / 7,6 / 7,5, C 9,4 / 9,4 / 9,4, D 10,2 / 10,2 / 10,2, transitions
  11,4 / 11,5 / 11,4 ; 881 images, aucune sans le sprite. PNJ fixes (3 PNJ × 5 groupes = 14 couples) : à moins de **0,8 point** de 4A-septies
  partout ; le PNJ n° 3 sort du masque sur 20 images, les mêmes que dans 4A-septies (occlusion du décor, pas une disparition). Le témoin
  « PNJ fixes » par l'ancien aperçu a été arrêté (une heure de plus ; le témoin du quai montrait déjà 0,1 point d'écart).
- **[OK] Test 5** (caméra B, 3 tours, bruit jusqu'à ±1 ms cette session) : base 9,91 ms GPU, 114 appels ; ×2 partagé 1 / 8 / 32 PNJ 10,21 /
  10,12 / 10,21 ms, **114 appels** ; porteurs actuels 8 / 32 : 10,20 / 11,12 ms ; ancien aperçu ×2 32 : 10,52 ms, **118 appels (+4)** ;
  atlas +393 Ko (512 × 816).
- **[OK] Test 6** : typecheck, build, `art:validate` (0 erreur) ; graines 1842 / 7719 / 30417 : les 11 personnages de la graine identiques à
  `eecea58`, les ×2 seulement ajoutés à la fin. **Règles B** 8 / 8 : PNJ interactif sans repli → refusé (« missing frames up/idle,
  side/idle ») ; PNJ de foule jamais tourné → accepté ; avec orientation → refusé ; repli explicite → accepté, alias listés ; mot-clé
  inconnu, `?baked` + `?labsprite`, asset sans paquet de provenance, id inconnu → refusés ; contrôles de feuille sur 8 feuilles fabriquées.

### Amendement C — [OK] mesuré, décision proposée : PNG versionné (C2)
- Builds de production (3 chacun), `vite preview`, cache coupé : module TS **+33 433 o de JS** (+5 034 gzip) pour une seule image ×2 ;
  PNG **+1 891 o de JS** (+957 gzip, décodeur) + fichier de 5 196 o. Chargeur seul : 0,2 ms (module) contre 10,6-14,6 ms (PNG : requête +
  empreinte + décodage), recouvert par le démarrage (temps jusqu'à prêt identique au bruit près). Atlas **identique à l'octet** entre les deux,
  mêmes appels de dessin, build identique au bruit près. Le module duplique dans Git des pixels déjà suivis et hachés (l'export) et grossit
  le JS linéairement (≈ 1,6 Mo pour un PNJ de 48 images, extrapolation) ; le PNG garde **une seule source** et le chargeur déjà utilisé.

### Erreurs de méthode (pour ne pas les refaire)
- **[KO → corrigé]** Captures « identiques » qui ne l'étaient pas : écran de chargement en fondu sur le canvas, bulle qui lit
  `performance.now`, **RNG propre des particules** (`Rng(99)`) qui tourne entre chargements, et **premier chargement d'un cadrage** dans une
  session de navigateur différent des suivants (69 634 px en A) → attente du retrait du chargement, horloge figée, RNG remis à zéro, une
  chauffe par cadrage, et un **témoin de répétition** (deux chargements : 0 px) avant toute comparaison.
- **[KO → corrigé]** Contrôle négatif « mauvaise hauteur d'atlas » invalide : la requantification au plus proche l'annule (0 écart) →
  remplacé par une rangée décalée. Un contrôle négatif se vérifie lui-même.
- **[KO → corrigé]** Attendu de l'auto-test calculé avec l'échelle demandée (2,37) au lieu de la taille arrondie de la cible (2,375).
- **[KO → corrigé]** `src/` modifié pendant une série sur le même serveur dev → rechargement HMR, une mesure perdue (graine 1842), relancée.
- **[KO → corrigé]** Premier recadrage du test 3 fait sur le **héros** (positions supposées ; `tools/eval.mjs` tourne en 1280 × 720, les
  captures en 1920 × 1080) → recadrage par projection. C'est ce recadrage qui a montré que l'écart de C portait sur le héros (effet A).
- **[KO → corrigé]** Test 4, première marche du chemin partagé : churn de A à 17 % (4A-septies : 5,7). Cause : pour isoler le sprite, le
  harnais recalcule les instances ; les **bulles de dialogue lisent l'horloge** et bougeaient entre les rendus « avec » et « sans », donc
  entraient dans le masque (hauteur 185 px au lieu de 107). L'ancien aperçu ne recalculait que son propre renderer. Correction dans l'outil
  (`dynwalk.mjs` : une horloge figée par image), vérifiée sur 32 images (masque 107 px, churn image par image = celui de 4A-septies), puis
  marche refaite. Pensée : une mesure par différence « avec / sans » doit figer tout ce qui bouge entre ses deux rendus.
- Le serveur dev :5180 de la passe précédente tournait encore (arrêter la tâche ne tue pas `vite.js`) ; un fichier absent est servi comme
  `index.html` (200) par le serveur dev → le chargeur exige une réponse JSON.

## Passe 4A-undecies — Adressage des texels indépendant de la taille de l'atlas (flag dev, rien en production, 2026-10-16)

### Décision opérateur (2026-10-16)
« Adressage entier » pour l'amendement A ; refus qu'un changement de taille de l'atlas puisse modifier les texels affichés par les
personnages existants. Mission ciblée sur le renderer de sprites et son atlas, sous contrôle expérimental ; pas de migration GLSL1 → GLSL3
pour `texelFetch` ; arrêt et présentation des implications si une modification plus large devient indispensable ; aucun appel de dessin
en plus ; `5d10a37` = point de restauration ; commit local seulement si toutes les preuves sont satisfaisantes. Critère final : ajouter des
sprites ne doit jamais modifier l'apparence des sprites déjà validés.

### Anomalie initiale — [OK] reproduite sur `5d10a37`
- Parade, échelle 2,1, atlas de 1 968 rangées : **1 032 px** sur 5 lignes (sprites 32 × 48 générés), identique à la passe précédente.
- Scène, caméra C, joueur en (9,6 ; 1,0), ×2 **chargé mais pas placé** : le **héros** change de **16 px** (atlas 816) et **20 px** (atlas 1 968)
  sur une ligne, contre la baseline `eecea58`.

### Cause précise
- Un texel était choisi par `floor(vUv × H)` ; `vUv` est interpolé entre des sommets dont les valeurs v = 1 − cy / H sont des flottants
  arrondis, puis remultiplié par H. À l'échelle de certains cadrages, l'ancrage calé sur la grille de pixels place un bord de texel
  **exactement** au centre d'une ligne de pixels : la valeur exacte est un entier et l'erreur d'arrondi (~10⁻⁴ texel) décide du texel. Ces
  erreurs dépendent de H (valeurs aux sommets et multiplicateur) : agrandir l'atlas renversait certaines égalités. Le billboard étant presque
  vertical, toute la ligne bascule d'un texel. Les octets, eux, ne changeaient jamais.
- Conséquence : aucune formule normalisée par la taille de la texture ne peut être stable ; il faut que **ni les valeurs interpolées ni le
  multiplicateur** ne dépendent de la taille de l'atlas ou de la place de la case.

### Correction (périmètre : `SpriteAtlas.ts`, `SpriteRenderer.ts`, chargeur et outils DEV)
- **Sprites générés : chemin inchangé et texture figée.** La texture générée redevient exactement celle de `eecea58` (512 × 720) et ne grandit
  plus jamais : mêmes octets, mêmes UV, même code d'échantillonnage → leurs égalités se résolvent comme dans la baseline, pour toujours.
- **Sprites cuits : leur propre texture**, adressée par **case entière** (x0, y0, l, h) : `texel = case.xy + clamp(floor(t × case.zw), 0,
  case.zw − 1)` avec t ∈ [0, 1] sur le quad (aux sommets : 0 ou 1 exactement), puis lecture **au centre du texel** (`(texel + 0,5) / taille`,
  exacte en plus-proche-voisin quelle que soit la taille). Politique de frontière explicite : un bord exactement au centre d'un pixel donne
  le texel supérieur, pareil pour tout atlas ; jamais de lecture hors de la case (clamp) ; voisins du liseré hors case = transparents.
  Même fonction GLSL (`BAKED_GLSL`) pour le corps, la superposition, les ombres et l'auto-test. `texture2D` au centre du texel : pas de
  `texelFetch`, pas de migration.
- **Batching commun conservé** : un attribut d'instance `iCell` (largeur 0 = sprite généré), deux textures liées au même matériau ;
  les deux chemins sont lus sans branche autour des lectures de texture, l'instance choisit. **Aucun appel de dessin en plus.**

### Écart de compilation trouvé et éliminé
- Premier essai : 5 rendus sur 51 différaient de **1 niveau sur 255** sur 1 pixel (sprites générés, toutes variantes, même sans ×2) :
  non pas un mauvais texel mais un arrondi de l'éclairage recompilé. Isolé par variantes du shader (sondes de 15 rendus) : ombres modifiées
  = 0 px ; corps modifié = 5 px ; sélection de couleur seule = 0 ; + émissif = 0 ; **+ liseré = 5**. Le choix entre généré et cuit fait sur
  les **valeurs `step` du liseré** changeait l'ordonnancement du calcul ; fait sur les **échantillons d'alpha avant `step`**, le code
  généré redevient identique au bit (0 px). Pensée : un shader partagé se vérifie au bit, et un écart d'un niveau se cherche par sondes.
- **[?] Non expliqué** (expérience écartée) : nouveaux sommets + anciens fragments du corps donnaient 135 037 px d'écart, sur la fumée
  de la cheminée et les étincelles. Configuration non retenue, cause non cherchée.

### Résultats (la version retenue ; détails `reviews/texel-addressing-4a-undecies/`)
- Texture générée **identique à l'octet** à `eecea58` dans toutes les variantes (sans ×2, ×2 seul, ×2 + 103 images, ×2 rangé en dernier).
- **Parade des 234 images générées, 17 échelles × 3 lots, miroirs alternés** : baseline vs nouveau sans ×2 / ×2 (texture 96 rangées) / ×2 +
  103 images (1 248 rangées) / ×2 déplacé : **0 px sur 4 × 51 rendus**. Contrôle négatif (UV générées décalées d'une rangée) : 141 590 px au
  minimum par rendu.
- **Parade du ×2** (48 copies, miroirs alternés, 17 échelles) : texture de 96 rangées vs 1 248 rangées vs case déplacée en (448 ; 1 152) :
  **0 px sur 2 × 51 rendus**. L'ancien adressage (`5d10a37`) : 102 px au minimum sur chacun des 51 rendus, et différent entre 816 et 1 968
  rangées. Contrôle négatif (case décalée d'une rangée) : 78 375 px au minimum par rendu.
- **Scènes A / B / C / D**, avec personnages et `static=1`, dont la place du héros en C : nouveau sans ×2 / ×2 chargé (96 et 1 248 rangées),
  non placé : **0 px** (9 vues × 4 variantes).
- **Auto-test** (code d'adressage de production) : 0 octet et 0 texel faux aux échelles 1 / 2 / 3 / 2,37, case en (0 ; 0) d'une texture
  512 × 96 **et** en (448 ; 1 152) d'une texture 512 × 1 248 ; **débordement** : 4 × 2 cases opaques sans anneau transparent, 6 échelles × 4
  décalages sous-pixel × 8 cases = 192 rendus, **0 pixel étranger sur 4 277 568** ; contrôles négatifs : rangée décalée 6 616, linéaire non
  centré 10 804, arrondi sans clamp **37 517 pixels étrangers**.
- **×2 vs aperçu validé** (12 PNJ aux places de 4A-sexies) : **sans les ombres de sprites, 0 px dans les 4 cadrages** (corps, liseré,
  superposition, DOF), pour la texture de 96 comme de 1 248 rangées. **Avec les ombres : 3 / 40 / 67 / 4 px (A / B / C / D), jusqu'à 12 / 255**,
  identiques entre 96 et 1 248 rangées → **[?] divergence stable de l'ombre portée du ×2** : l'aperçu lisait l'ombre par le plus-proche-voisin
  du matériel (arrondi à 1 / 256 de texel), le nouveau chemin par le même plancher entier que le corps ; ils diffèrent sur les quasi-égalités.
  Présentée à l'opérateur avec l'alternative (tableau de textures, construction GLSL 3). **Décision opérateur (2026-10-16) : écart
  accepté** (stable, même règle que le corps) ; commit local de la correction, rien poussé.
- **Performance** (4 tours entrelacés, caméra B ; le 4e tour a chauffé pour presque toutes les variantes) : 114 appels de dessin partout ;
  tours 1-3, ancien / nouveau : base 9,13 / 9,23 ms, ×2 1 PNJ 9,27 / 9,22, 8 PNJ 9,28 / 9,42, 32 PNJ 9,63 / 9,67 → dans le bruit. Une texture
  de plus (1 × 1 sans ×2 ; 512 × 96 = 192 Ko avec, sans couche émissive). Bundle de production 822 553 → 824 920 o.
- Typecheck, build, `art:validate`, provenance intacte ; chargeur DEV absent du bundle.

### Erreurs de méthode
- **[KO → corrigé]** La chauffe par cadrage ne visait que le premier serveur : le premier chargement d'un cadrage est propre à **chaque
  origine** (74 491 px en A sur le second serveur) → une chauffe par serveur et par cadrage.
- **[KO → corrigé]** Le chargeur plaçait la première feuille chargée : avec `bakedsynfirst=1`, des PNJ synthétiques au lieu du docker → il
  place la première feuille demandée.
- La série complète a été arrêtée dès le premier écart d'un niveau (inutile de mesurer le reste sur un shader faux), puis relancée sur la
  version retenue.

## Passe 4A-duodecies — Provenance des planches de référence confirmée par l'opérateur (documentation seule, 2026-10-16)

### Décision opérateur (2026-10-16)
Les planches « Cité du Tournoi — Merchant District — Night » (PNJ 1 à 24) ont été générées avec ChatGPT / OpenAI à partir de nos
instructions de direction artistique ; ce ne sont pas des planches d'un artiste extérieur ; `4.webp` est une copie réencodée de l'une de ces
générations. À enregistrer comme **provenance confirmée par l'opérateur**, sans prétendre à une vérification C2PA ; l'absence des originaux
ne doit pas être présentée comme une interdiction automatique de production ; droits et autorisation de production s'évaluent à part ;
baseline ×2 v1 et toute sa traçabilité conservées ; aucune métadonnée inventée.

### Ce qui a été consigné — [OK]
- `provenance/dockworker-x2-v1/source-declaration.json` : statut « provenance confirmée par l'opérateur, non vérifiée cryptographiquement » ;
  **les deux déclarations du jour citées mot pour mot** ; faits techniques inchangés ; « rien n'est déduit » (ni date, ni modèle, ni prompt,
  ni compte, ni C2PA) ; **série** : planche PNJ 01-16 (cette source) et planche PNJ 17-24 identifiées par leur SHA-256 (calculé sur les copies
  collées en séance) ; la troisième planche collée ce jour-là (« NPC CHARACTER REFERENCE SHEET », 14 personnages) **n'est pas nommée** par
  la clarification : aucun statut ne lui est attribué ; droits / production : évaluation séparée, l'absence des originaux n'interdit pas
  à elle seule ; **historique** : le texte précédent (« production BLOCKED … ») gardé mot pour mot.
- `PROVENANCE.json` : champ `origin` ajouté, `rights` mis à jour, ancien texte conservé dans `source.sheet.history`, décision datée ajoutée
  à `approvals` ; modifications ciblées (le reste du fichier inchangé à l'octet). Manifeste : note de la référence mise à jour en citant
  l'ancienne formulation ; **approbation de la baseline intacte** (`approved`, `runtimeUse: "lab"`).
- README du paquet, README des personnages, contrat (statut, risque n° 1), README de preuves 4A-decies (sa dernière phrase annonçait une
  production bloquée) ; `verify-provenance.mjs` affiche le nouveau statut et la ligne droits / production, jamais comme une preuve.
- Vérifications : `verify-provenance` → **intact** (les 9 empreintes de la chaîne inchangées) ; avec la planche : `ok source sheet` ;
  `art:validate` 0 erreur. Aucun code du jeu modifié.
- La planche reste hors Git (stockage = approbation explicite de l'opérateur) ; sa seule copie dans le projet est dans `scratch/`.

## Passe 4A-terdecies — Droits d'usage, troisième planche, archivage de la source ; proposition du 2e PNJ (2026-10-16)

### Décisions opérateur (2026-10-16)
1. Planches Merchant District générées avec ChatGPT / OpenAI sous notre direction artistique ; **usage autorisé** comme sources et
   références artistiques, y compris pour des assets d'un jeu commercial, **sous réserve des droits de tiers applicables** ; selon
   l'opérateur, les conditions d'OpenAI attribuent à l'utilisateur les droits d'OpenAI sur les sorties, dans la mesure permise par la loi ;
   provenance confirmée par déclaration, **non certifiée cryptographiquement** ; ni l'absence de C2PA ne vaut interdiction automatique, ni
   les droits de tiers ne sont présentés comme vérifiés exhaustivement.
2. Troisième planche (« NPC CHARACTER REFERENCE SHEET », 14 personnages) : création originale ChatGPT, même ensemble mais génération
   distincte des 24 PNJ ; **référence complémentaire** (personnages importants, costumes, silhouettes élaborées) ; ne remplace pas la
   baseline ×2 v1.
3. Archivage versionné de `4.webp` dans `art-lab/characters/reference/sources/`, octets préservés, sans faux original ni C2PA fictif.
4. `dockworker-x2-v1` reste le standard visuel des PNJ ordinaires ; ces décisions n'autorisent pas à remplacer des PNJ de production.
5. Commit local permis ; ni push ni fusion sans autorisation ; ensuite rapport de conservation et proposition du 2e PNJ, sans production.

### Conservation — [OK]
- `reference/sources/merchant-district-night-npc-01-16.webp` : **copie à l'octet** (SHA-256 `1c3bc603…36ce`, 302 814 o, `cmp` identique à
  la copie de `scratch/`) + fiche `merchant-district-night-npc-01-16.source.json` (format, nature « copie réencodée, pas l'original »,
  noms d'origine, provenance déclarée, droits, dérivés et commande de reconstruction, « rien d'inventé »). `*.webp binary` ajouté à
  `.gitattributes` (Git ne touche jamais aux octets).
- `PROVENANCE.json` : `source.sheet.path` (la copie archivée), `storage` et `rights` à jour, anciennes valeurs dans `history`, décision
  datée dans `approvals` ; manifeste : `references[0].path` pointe sur la source archivée (approbation inchangée) ;
  `source-declaration.json` : troisième déclaration citée mot pour mot, troisième planche classée « complémentaire », anciennes valeurs
  dans `history`.
- `verify-provenance` vérifie désormais la source archivée par défaut ; **chaîne complète refaite depuis le dépôt** (`--rebuild`) : ×2
  plein et 64 couleurs **identiques au bit**, nettoyage rejoué **identique au pixel** à l'export approuvé ; contrôle négatif (autre planche)
  refusé. `art:validate` 0 erreur.
- Documentation : `reference/README.md` (dossier `sources/`, classement des trois planches), README du paquet et des personnages, contrat
  (statut, risque n° 1). Les planches PNJ 17-24 et « 14 personnages » ne sont **pas** archivées (archivage validé pour `4.webp` seul) :
  leurs empreintes sont consignées, leurs seules copies sont dans le dossier temporaire de la séance.

### Proposition du 2e PNJ — `art-lab/characters/briefs/npc2-proposal.md` (rien de commencé)
Recommandation : **la marchande** (rôle existant à l'étal du héros : comparaison au même endroit ; contraste de silhouette maximal avec le
docker). Méthode : prompt validé → génération ChatGPT par l'opérateur, **PNG d'origine téléchargé** → archivage à l'octet → mesure de la
grille avant acceptation → reconstruction ×2 → critique aveugle contre v1 → finition limitée (≤ 2 itérations) → validation en scène par le
chemin partagé + `dynwalk` → paquet de provenance, `runtimeUse: "lab"`, arrêt pour décision.

### Gouvernance
- **[?] Conflit de consignes signalé** : `AGENTS.md` (règle du 16/10) demande de pousser chaque commit d'une branche de travail ; la
  consigne de cette passe dit « ne pousse ni ne fusionne sans mon autorisation ». Appliqué : la consigne explicite de la passe (commit
  local seulement) ; arbitrage demandé. **Arbitré (opérateur, 16/10)** : la règle d'`AGENTS.md` reste la règle par défaut ; branche poussée.

## Passe 4A-quattuordecies — La marchande : décisions, correction de méthode ; archivage des deux autres planches (2026-10-16)

### Décisions opérateur (2026-10-16)
1. Proposition du 2e PNJ validée : **marchande adulte** ; **une seule figure originale**, entière, de face (pas une planche) ; le
   **nouveau prompt artistique de l'opérateur** remplace l'ébauche ; **hauteur monde 1,66 m** pour commencer, indépendante de la densité
   64 × 96. Niveau de qualité `dockworker-x2-v1`, référence stylistique la planche 01-16, aucun personnage existant reproduit.
2. **Correction de méthode** : ne pas forcer la génération initiale sur une grille de pixels parfaite si cela détériore le modelé, les
   expressions et les matières ; E2 a montré que le ×2 peut préserver une illustration riche et qu'un nettoyage trop strict dégrade ; la
   grille 64 × 96, la rangée des pieds 90 et les marges transparentes sont des contraintes de l'**asset reconstruit**, pas de l'illustration source.
3. Conservation versionnée des planches PNJ 17-24 et « 14 personnages », à l'octet, avec fiches de provenance ; classification artistique conservée.
4. Production : **attendre le PNG original** de la marchande ; ensuite source conservée sans transformation, provenance, ×2, comparaison
   au docker approuvé, au plus deux itérations Aseprite ciblées, Character Lab + A / B / C / D, stabilité et performances par le renderer
   partagé, critique indépendante. Ni roster, ni orientation, ni animation, ni remplacement de la marchande existante ; `runtimeUse:
   "lab"` jusqu'à validation explicite ; pas de fusion dans `main` avant que la tâche artistique soit terminée et acceptée.

### Archivage des deux planches — [OK]
- Copies retrouvées dans le dossier temporaire de la séance (images 2 et 3 collées le 15/10, 21:32:58 UTC), empreintes égales à celles
  déjà consignées ; copiées à l'octet (`cmp` identique) : `reference/sources/merchant-district-night-npc-17-24.webp` (SHA-256
  `3b30b930…d6d4`, 311 654 o, WebP 1448 × 1086) et `reference/sources/merchant-district-night-npc-character-reference-sheet.webp`
  (`05c101db…97af`, 377 714 o, 1122 × 1402). Même structure que la planche 01-16 : VP8X + profil ICC sRGB générique de 456 o
  (« Google Inc. 2016 ») + VP8 avec pertes ; ni EXIF, ni XMP, ni C2PA. Attribut binaire déjà en place (`*.webp binary`).
- Fiches `.source.json` : format, contenu lu sur l'image, classification (actuelle et ancienne), nature « copie réencodée, pas
  l'original », provenance, droits, aucun dérivé, usage comme référence par `porter-gm-v1`, « rien d'inventé ».
- Classification conservée : 17-24 = série des 24 PNJ (C) ; « 14 personnages » = référence complémentaire (C). L'ancien classement de la
  passe 4A (B « PNJ raffinés », C « roster de soutien », jamais confirmé) est gardé comme historique.
- `source-declaration.json` : 4e déclaration citée mot pour mot, chemins des trois planches, anciennes valeurs dans `history`. Manifeste
  `porter-gm-v1` : `references[].path` vers les planches archivées (catégories d'époque et note « MISCLASSIFIED » gardées, statut et
  approbation inchangés). `reference/README.md`, README des personnages et de l'Art Lab, `AGENTS.md` (commande) à jour.
- **Nouveau contrôle** : `npm run art:validate` vérifie chaque fichier de `reference/sources/` contre sa fiche (SHA-256, taille, nom) et
  signale un fichier sans fiche ou une fiche sans fichier. Contrôles négatifs sur une copie jetable (un bit inversé, un octet ajouté,
  fichier retiré, fichier sans fiche, fiche qui nomme un autre fichier) : 5 / 5 détectés ; copie intacte : 0. Dépôt : 3 sources OK, 0 erreur.

### Brief de la marchande — [OK] mis à jour, rien produit
- `art-lab/characters/briefs/npc2-proposal.md` passe de « proposition » à « brief validé » : décisions, prompt de l'opérateur cité tel quel
  (§ 6 ; l'ébauche reste dans `2bc05a6`), brief aligné sur ce prompt (35-40 ans, 3-3,5 têtes, châle, bourse, un seul accent ambré),
  contraintes séparées « illustration source » / « asset reconstruit », méthode en 10 étapes selon la liste de l'opérateur, critère
  d'originalité (côte à côte avec les marchandes des trois planches).
- Retiré : la règle de la proposition « une source sans grille propre est régénérée, pas réparée ». La mesure de la source règle la
  reconstruction, elle ne la refuse pas ; une régénération ne se décide que sur l'art (opérateur).
- **[?] Risque signalé** : une figure seule en grand donnera ≈ 10-15 px source par texel (v1 : 1,775) ; la médiane de 9 points de
  `reconstruct-grid.mjs` n'a été validée que sur des blocs de ≈ 3,5 px : à mesurer sur la source (contre une moyenne par case) avant de choisir.

### Pensée
- La règle « régénérer une source sans grille » de la proposition contredisait E2 : la planche de référence elle-même n'est pas du pixel
  art strict (4A-bis) et le ×2 n'a de la forme que parce qu'il rééchantillonne la peinture à l'intérieur des blocs (4A-quater). Les
  contraintes de format appartiennent à l'asset reconstruit.

### Pièce jointe pour la génération — [OK] préparée, non versionnée
- Demande de l'opérateur : une version agrandie au plus proche voisin de `dockworker-x2-v1`, à joindre au prompt de génération (l'export
  de 64 × 96 serait illisible pour le générateur).
- Depuis l'export approuvé (`exports/dockworker-x2-v1.png`, SHA-256 `9e1de3ba…8441`), dans `art-lab/characters/scratch/npc2-merchant/attachments/`
  (ignoré par Git) : `dockworker-x2-v1-x8.png` (×8 exact, fond transparent, 512 × 768, SHA-256 `a0616dc3…360b`) et
  `dockworker-x2-v1-x8-neutral.png` (×8 sur gris neutre uni `#808080`, 608 × 912, SHA-256 `891c3f63…bfdf`) : figure de 41 × 89 texels
  (boîte 13,2 → 53,90) placée en (17 ; 12) sur un cadre de 76 × 114 texels (2:3, marges larges), alpha binaire aplati.
- Vérifié : chaque bloc 8 × 8 relu dans les fichiers écrits = le texel attendu (0 écart) ; l'export n'a aucun texel d'alpha partiel.
  Codec exact `tools/art-lab/png.mjs` (sans gestion de couleur) ; paramètres, empreintes des fichiers et des pixels dans
  `attachments-report.json` à côté : les pixels se refont à l'identique.
- À la livraison : relever quelles images l'opérateur a jointes ; si c'est l'un de ces fichiers, comparer son empreinte et l'archiver avec
  la fiche de la source.

### Prompt v2 de l'opérateur et revue — [?] décision de l'opérateur
- Reçu de l'opérateur : un second prompt, écrit pour accompagner les images jointes (docker ×8, références de style du Merchant District),
  qui reprend la mise en garde « ne pas copier le docker ». Consigné tel quel dans le brief (§ 6.2) ; le prompt effectivement utilisé reste à
  confirmer à la livraison.
- **[?] Risque d'originalité** (planche 01-16 relue à côté du brief, recadrages ×2) : n° 02 « Merchant (Female) » porte déjà la combinaison du
  brief — chignon brun, robe bleue, tablier ivoire, petite bourse (plus coiffe blanche à volant, col blanc, manches bouffantes blanches) ;
  n° 03 « Artisan (Female) » le chignon, le tablier et la sacoche ; n° 09 « Townswoman (Female) » le fichu bleu clair et le tablier ivoire.
  Avec cette planche jointe comme référence de style, le générateur a sous les yeux une marchande très proche de la demande ; or le but du
  2e PNJ est de prouver un personnage **original** au niveau de v1 (4A-quinquies). Liste de contrôle d'originalité du brief (§ 4) complétée.
- Contraintes de v1 absentes de v2 qui comptent pour la reconstruction ou les critères : fond **uniforme** (extraction) ; les deux bottines
  visibles sur la même ligne de sol (rangée 90) ; 3-3,5 têtes, pas de chibi ; un seul accent ambré ; mains lisibles ; ni tramage, ni bruit,
  ni rayures mécaniques (ils se reconstruisent en moucheture : 4A-quater). Nouveau dans v2 : « de face ou très légèrement tournée »,
  compatible avec le repos de face de v1 (lui-même légèrement tourné).
- Proposé à l'opérateur, **non validé** : ajouter à v2 le bloc ci-dessous (ou joindre la planche sans les n° 02, 03 et 09).
  ```text
  Additional requirements:
  * Do not copy any character from the attached reference sheets, especially "02. Merchant (Female)", "03. Artisan (Female)" and "09. Townswoman (Female)": same world and quality, clearly different design; avoid their signature elements (white frilled cap or bonnet, white lace collar, puffed white sleeves).
  * Adult proportions, approximately 3–3.5 heads tall; not chibi.
  * One small warm amber accent only (belt buckle or trim); no other bright warm colour: hair, leather and skin stay muted.
  * Clearly readable hands.
  * Both boots fully visible, both feet on the same ground line.
  * Background: one flat, uniform neutral colour; no gradient, no vignette, no floor, no cast shadow.
  * Clean pixel clusters: no dithering, no scattered noise, no mechanical stripes, no pillow shading.
  ```
- Pensée : une combinaison de traits peut déjà décrire un personnage existant ; le brief se compare aux références jointes **avant** la
  génération, pas seulement le résultat après.

## Passe 4A-quindecies — La marchande : source originale archivée, reconstruction ×2, scène A-D ; source à régénérer (proportions) (2026-10-16)

### Décisions opérateur (2026-10-16)
- La nouvelle image de marchande (ChatGPT, prompt V3) est la **source artistique originale approuvée** du 2e PNJ expérimental ; le sprite
  ne l'est pas ; préserver au maximum l'illustration ; `runtimeUse: "lab"` ; ni roster, ni orientation, ni animation, ni remplacement de la
  marchande de production ; pas de fusion dans `main`.
- Réponses aux questions : PNG d'origine déposé (retrouvé sur le bureau de l'opérateur) ; V3 = v2 + bloc d'ajouts proposé ; image jointe :
  le docker ×8 gris seul. Les planches renvoyées par l'opérateur (« base commune » de tous les personnages) sont les trois déjà archivées.
- Après la comparaison en scène : « c'est surtout un problème de proportion » → **régénérer la source** (même dessin, proportions de la base
  commune ; prompt V4).

### Source — [OK] archivée à l'octet, C2PA lu
- La pièce jointe de la séance n'est qu'une copie WebP transcodée (61 Ko, ICC générique). Le PNG d'origine (`marchande_en_pixel_art_livre_en_main.png`,
  1 349 750 o) a été retrouvé sur le bureau ; correspondance chiffrée : écart moyen 1,01 / 255 (PSNR 44,2 dB), témoin décalé de 16 px : 10,19.
- Archivé tel quel : `reference/sources/npc2-merchant-source-2026-10-16.png` (SHA-256 `e3292f6d…196b`) + fiche (`art:validate` le contrôle).
  PNG 1024 × 1536 RGB, morceaux IHDR / caBX / IDAT / IEND.
- **C2PA OpenAI présent** : c2pa.created par ChatGPT (gpt-image), trainedAlgorithmicMedia, 2026-10-16T23:38:51Z ; générateur « OpenAI Media
  Service API » ; **liaison dure (c2pa.hash.data) recalculée : identique** ; signature non validée (c2patool non installé). Lecture seule.
- Écarts au brief, approuvés par l'opérateur avec la source : tresse auburn au lieu du chignon, ni châle ni tablier, gilet ardoise, carnet
  d'inventaire, plusieurs accents laiton.

### Analyse et reconstruction — [OK] chaîne déterministe, deux options d'outil
- Fond gris (124 ; 124 ; 124), écart-type 0,7, valeurs 120-128, coins identiques. Figure 499 × 1 223 px ; grille d'art ≈ 11,3 px (x 11,40 ;
  y ≈ 11,2, irrégulière), soit ≈ 108 pixels d'art : **la source est plus fine que le cadre** (≤ 89 rangées) ; la reconstruction **réduit**
  (≈ 0,81 texel par pixel d'art) alors que celle du docker doublait.
- Pas 13,9 / 14,3 / 14,75 / 15,3 / 15,7 testés (figures 88 / 85 / 83 / 79 / 78 texels) : **13,9 retenu** (visage, doigts, accessoires).
  La bouche (un tiers de pixel d'art de haut) disparaît à tous les pas.
- `reconstruct-grid.mjs` : deux options **désactivées par défaut**. `--holes` rend transparents 21 texels de fond enfermé (poche du cou 16,
  bras 3, main 1, mèches 1), **après** la fermeture verticale : la première version les vidait avant, et la fermeture les remplissait de noir
  (38 texels fermés au lieu de 26). `--no-shadow` : la règle d'ombre des planches mangeait 7 texels des semelles (rangée 90). Les 26 texels
  fermés sont tous sur le contour.
- Sans option, sortie inchangée : la reconstruction du docker refaite est **identique au bit** (pleine, 64 couleurs) et son nettoyage rejoué
  au pixel. L'empreinte de l'outil, figée dans le paquet du docker, est mise à jour avec une note de maintenance (ancienne empreinte gardée).
  `verify-provenance` transmet désormais `reconstruction.options` à l'outil.
- 64 couleurs : erreur OKLab moyenne 9,5 ‰ (visage 6,3, max 33,4), sous les 12,1 ‰ acceptés pour le docker ; pleine / 96 / 64 indiscernables à
  ×5 ; 48 / 32 aplatissent la peau et la jupe.

### Finition — [OK] itération 1 (18 texels), rejouable
- 13 texels de frange grise du contour (docker : 0) → voisin sombre le plus proche ; encoche des cheveux (19,19) refermée ; contour de la
  mâchoire sur la poche du cou (2 texels) ; bouche restituée (2 texels `#c37958`, valeur de la source `#c67754`). Sourcils doux dans la
  source aussi : non touchés. Aseprite `validate` 100 ; `replay-pixel-ops` = export au pixel.
- Paquet `provenance/merchant-x2-v1/` (déclaration mot pour mot, `PROVENANCE.json`) : `verify-provenance --rebuild` **intact** depuis la
  source archivée. Manifeste `experimental`, non approuvé, `runtimeUse: "lab"`.

### Validation — [OK] Character Lab et scène A-D
- Character Lab : 0 texel faux à 1×, 4× et à l'échelle runtime, A-D ; contrôle négatif (linéaire) en échec (32 407 / 40 445).
- Chemin partagé (`?baked=`, repli `bakedfallback=front-idle` explicite, amendement B) : captures déterministes A-D. **Non-régression : 0 px**
  (répétition ; marchande chargée non placée ; marchande + docker chargés) dans les 4 cadrages.
- Projection (1080p) à 1,66 m : A 0,88 px écran / texel, B 1,81, C 1,8-2,1, D 1,6-1,9 (docker à 1,88 m en B : 2,03).
- Lecture en jeu : tresse, visage, gilet, carnet, jupe lisibles en B / C / D. En D le bas de la jupe se fond dans les pavés (comme le pantalon
  du docker) ; la poche du cou laisse voir le décor (tache claire en B) ; à l'emplacement exact de la marchande en B, la lanterne de l'étal
  masque le visage (placement).
- Liseré : le chemin partagé n'a pas de réglage par sprite (intensité par acteur selon les lumières, `uEdge` global) ; L1 exigerait de changer
  l'éclairage de tout le cast, exclu : montré en L0 comme le docker.

### [KO → décision] Proportions et taille
- Opérateur : le passant généré paraît « plus gros et imposant ». Mesuré dans l'atlas : la marchande générée **dessinée** fait 1,88 × 1,08 m
  (23 × 40 texels × 0,047) ; son 1,66 m n'est que la valeur **nominale** `HEIGHT` (ombre, bulle) : mon brief l'avait prise pour sa taille
  (corrigé). Cast : héros 1,93 × 1,13 ; porteur 1,65 × 1,03 ; forgeron 1,88 × 1,22. Nouvelle marchande à 1,66 m : 1,66 × 0,68 m.
- Comparaison à même profondeur (pieds sur la même ligne d'écran), 1,66 / 1,88 m : la hauteur se règle, **pas la carrure**. Sur les sprites ×2 :
  tête 0,26 de la hauteur (≈ 3,8 têtes) contre 0,33 (≈ 3,1) pour le docker ; largeur de tête 0,29 / 0,35 ; épaules 0,35 / 0,40 ; largeur
  maximale 0,41 / 0,48. La chaîne conserve exactement le rapport de la source (0,41 / 0,41) : **le défaut est dans la source** (le prompt V3
  demandait 3 à 3,5 têtes).
- Décision opérateur : **régénérer**. Prompt V4 au brief (§ 6.4) : même dessin, proportions du docker chiffrées, deux images jointes (la source
  V3 pour le dessin, le docker ×8 pour les proportions) ; contrôle des proportions sur la source avant toute reconstruction.
- Non fait sur ce candidat, reporté au nouveau : critique aveugle (auto-évaluation écrite, critique non lancée), marche dynamique, perfs GPU.

### Pensée
- Une hauteur nominale du code n'est pas la taille dessinée : mesurer la figure dans l'atlas avant de fixer une hauteur de présentation.
- La chaîne conserve exactement les proportions de la source, elle ne les corrige pas : les proportions se chiffrent dans le prompt et se
  mesurent sur la source avant de reconstruire (part de la tête, largeur de tête, épaules), contre la base commune.

Preuves : `art-lab/characters/reviews/merchant-x2-v1/` (planches + README) ; captures brutes et scripts dans le dossier de travail de la séance.

