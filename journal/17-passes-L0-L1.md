# Journal de bord — archive : passes L0 et L1 (2026-10-20)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-10-20 (Passe L7) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe L0 — Séance cloud « version jouable » : mise en route (2026-10-20)

### Contrat de tâche (contrat projet § 11.3)
- **Objectif** : un environnement cloud prêt et consigné ; le relais local éprouvé ; `main` validé tel quel.
- **Entrées** : `main` `d129433` ; le brief `briefs/cloud-session-playable-brief.md`, le plan v4 et les trois contrats de `contracts/`.
- **Fichiers autorisés** : `JOURNAL.md`, `briefs/local-requests/`. **Interdits** : tout le reste (aucun code ne change).
- **Outputs** : la requête `000-handshake`, cette passe.
- **Critères d'acceptation** : `npm ci`, typecheck, `npm test`, build, `art:validate` verts ; `art:doctor` lu ; Chrome trouvé ou absent, dit ;
  une capture de fumée de `main` et son témoin de répétition (0 px).
- **Tests** : ceux du dépôt, inchangés. **Risques** : SwiftShader lent ; le relais sans réponse (repli : la séance continue sans lui).
- **Définition de terminé** : l'environnement consigné ici (machine, Node, navigateur, temps de démarrage logiciel), la requête poussée.

### Environnement — [OK]
- Conteneur Linux x64, 4 cœurs, 15 Go de mémoire, sans GPU. Node v22.22.0, npm 10.9.4. Branche imposée : `claude/pensive-pasteur-lbz4ji`.
- `npm ci` ; typecheck ; `npm test` **103 / 103** (14 s) ; build ; `art:validate` (18 manifestes, 21 sources, 0 erreur).
- `art:doctor` : Aseprite absent (état attendu), aucune intégration d'agent.
- **Chrome** : le Chromium 141 de Playwright, préinstallé (`/opt/pw-browsers/chromium`). Un enveloppeur hors dépôt
  (`exec /opt/pw-browsers/chromium --no-sandbox "$@"`) sert de `CHROME_PATH`, avec `CHROME_ARGS=--use-angle=swiftshader` (comme en Passe T1).
- **Copie figée de `main`** : `git -c core.autocrlf=false archive d129433` dans le dossier de travail de la séance, `node_modules/three` copié,
  servie sur :5187 par le Vite du dépôt avec une config hors dépôt sans import (`vite.config.ts` de la copie ne trouve pas `vite` hors du
  dépôt).

- **Capture de fumée de `main`** (`detshots`, 1280 × 720, `seed=1842&clean=1&camera=B&freeze=7.3`, 120 pas, personnages compris) et son
  témoin de répétition : deux chargements en parallèle, **0 px** (`diff.mjs` au seuil 0, et les deux PNG identiques à l'octet). Chaque
  chargement prend **162 s** en SwiftShader (deux en parallèle sur 4 cœurs), le bake compris.
- **[KO → corrigé]** `tools/diff.mjs` compte au seuil 24 par défaut : le seuil 0 du brief se passe en quatrième argument. Il lui faut aussi
  `CHROME_PATH` (il ouvre un navigateur pour décoder les PNG).

### Relais local — [?]
- Requête `briefs/local-requests/000-handshake.md` poussée (type « autre ») : l'état de la machine locale (Aseprite, clé OpenAI, GPU). Pas de
  réponse à la clôture de L0 ; la séance continue (le brief : une requête ne bloque jamais).

### Preuves
- Aucun fichier de `src/`, `tests/` ou `tools/` ne change. Validation : typecheck, `npm test` 103 / 103, build, `art:validate`.

### Pensée
- Un outil de preuve se relit avant d'en croire le « 0 % » : son seuil par défaut n'est pas forcément celui de la preuve.

## Passe L1 — Le cœur de jeu headless : état, actions, créneaux, journal causal, sauvegarde, empreinte, états nommés (2026-10-20)

### Contrat de tâche (contrat projet § 11.3)
- **Objectif** : un cœur de jeu pur, sans rendu : l'état de la partie, ses actions, les trois créneaux par jour, le journal causal, la
  sauvegarde versionnée et l'empreinte, les états nommés (contrat projet § 10.3).
- **Entrées** : plan § 6 et lot L1 ; contrat de gameplay §§ 4, 12, 14 (verrou 8) ; contrat projet §§ 10.2-10.4 ; `src/core/rng.ts`.
- **Fichiers autorisés** : `src/simulation/`, `src/narrative/`, `tests/game-core.test.mjs`, `JOURNAL.md`. **Interdits** : tout fichier atteint
  par le jeu par défaut (`src/main.ts` et ses imports), `src/arena/`, les outils.
- **Outputs** : `newGame`, `actions`, `advance(state, action, rng)`, `serialize` / `deserialize`, `hash`, `namedState`.
- **Critères d'acceptation** : même graine + même script = même empreinte (trois graines) ; une sauvegarde rechargée à chaque pas égale la
  partie continue ; une action mineure ne coûte aucun créneau, une importante en coûte un, une refusée ne touche pas l'état ; les modules du
  jeu purs ; le chemin par défaut n'importe aucun module du jeu.
- **Tests** : `tests/game-core.test.mjs`, trois fautes injectées au moins. **Risques** : une fuite de non-déterminisme ; un import du jeu
  dans le chemin par défaut.
- **Définition de terminé** : tests verts, fautes attrapées, fichiers rendus à l'octet, validation complète ; aucun fichier du défaut ne change
  (PD sans objet).

### Fait — [OK]
- **`src/simulation/`** :
  - `state.ts` : `GameState` (avec `schemaVersion`), les créneaux `morning | afternoon | evening`, trois jours, trois lieux (`district`,
    `forecourt`, `lanterns`). `CompetitorState` reprend mot pour mot l'interface du contrat du tournoi § 5 ; `TeamState` est seulement typé ;
    `WorldPulse` porte les huit champs du § 9. Les concurrents, le tournoi et le pouls sont remplis au lot L2.
  - `actions.ts` : une table d'actions. Chacune dit son coût (0 = mineure : parler, se déplacer entre les lieux ; 1 = importante : elle prend
    le créneau), son refus et sa raison lisible, et son effet. Pour L1 : `move`, `talk`, `rest`, `train`, `wait`.
  - `advance.ts` : `advance` ne modifie jamais son entrée (une copie) ; une action refusée rend le même objet sans événement. Une action
    importante termine le créneau (`endSlot`, qui accueillera le hors écran, le pouls et les événements en L2), puis l'horloge avance ; après
    le soir du jour 3, la tranche est finie.
  - L'aléatoire : `rngFor(state, label)`, un flux tiré de (graine, nombre d'actions appliquées, étiquette) seulement. Une partie reprise
    d'une sauvegarde tire donc la même suite que la partie continue.
  - `canonical.ts` : un JSON canonique (clés triées à chaque niveau) et une empreinte FNV-1a 64 bits.
  - La sauvegarde : le JSON canonique, avec son type, sa version de schéma et la version du contenu. Un fichier étranger, une version plus
    récente ou un état abîmé sont refusés avec une raison lisible ; la table des migrations est vide (contrat projet § 10.3).
  - `named.ts` : chaque état nommé est atteint par un script d'actions depuis une partie neuve, jamais en écrivant des champs : il est
    donc un état que le jeu peut atteindre.
- **`src/narrative/people.ts`** : les gens à qui parler, en anglais (choix K1). Les personnages du district gardent leur sprite (choix P4) ;
  les rivaux n'ont qu'un portrait et des dialogues (choix K3). Leurs heures de présence : le forgeron le jour, l'informateur la nuit (contrat
  projet § 8.1).

### Choix de la séance (consignés comme tels)
- Le nom du joueur (choix K2) : nettoyé (20 caractères au plus ; lettres, chiffres, espaces, apostrophes, tirets) ; « Ren » s'il est vide.
- Une sauvegarde porte aussi la version du contenu (`slice-1`) : un état fait avec d'autres tables est refusé, plutôt que lu de travers.
- L'empreinte est un FNV-1a 64 bits du texte canonique, calculé en deux moitiés de 32 bits, sans dépendance.

### Preuves
- **`tests/game-core.test.mjs`, 9 tests** :
  - la pureté : les fichiers de `src/simulation`, `tournament`, `combat`, `events` et `narrative` ne contiennent ni `three`, ni le DOM, ni
    `Math.random`, ni horloge, et n'importent que des modules purs (plus `src/core/rng.ts` et `src/arena/CombatSim.ts`). L'oracle lit le
    texte des fichiers, sans passer par le code testé ;
  - le chemin par défaut : depuis `src/main.ts`, les imports statiques n'atteignent aucun module du jeu ni `src/ui/` ;
  - le déterminisme, sur trois graines ; une sauvegarde rechargée à chaque pas égale la partie continue ;
  - les coûts des créneaux et les refus ; les heures de présence ;
  - les refus de la sauvegarde ;
  - l'empreinte contre une référence BigInt indépendante, et le vecteur publié de FNV-1a 64 (« a » → `af63dc4c8601ec8c`) ;
  - les états nommés.
  - **[KO → corrigé]** deux erreurs du test lui-même, pas du code : un `JSON.stringify` avec une liste de clés filtre aussi les objets
    imbriqués (la permutation des clés est maintenant récursive) ; une limite du nom à 18 caractères tronquait le cas du test.
- **Huit fautes injectées une à une, fichiers rendus à l'octet** : `advance` qui modifie son entrée, parler qui coûte un créneau, une
  version de sauvegarde plus récente acceptée, un `Math.random` dans un module du jeu, le JSON canonique sans tri, l'informateur présent le
  matin (attrapée une fois le test des heures ajouté), un import du jeu dans `src/main.ts` : **7 attrapées**.
  - **[?] La huitième passe** : `step` non compté. En L1, aucune action ne tire au sort, donc le flux n'a pas d'effet. Elle sera rejouée en
    L2.
- **Le jeu par défaut ne change pas** : aucun fichier suivi ne change (`git status` : seulement des fichiers neufs), et le bundle de production
  ne contient pas le module (`cite-du-tournoi-save` absent de `dist/`).
- **Validation** : typecheck, `npm test` **112 / 112**, build, `art:validate`.

### Pensée
- Un test de déterminisme ne vaut que pour ce qui tire au sort : un compteur qui ne nourrit que l'aléatoire ne se prouve qu'une fois
  l'aléatoire utilisé. La faute qui passe se consigne et se rejoue au lot suivant.
- Un état nommé atteint par un script d'actions, jamais par des champs écrits à la main, ne peut pas décrire un état impossible.

