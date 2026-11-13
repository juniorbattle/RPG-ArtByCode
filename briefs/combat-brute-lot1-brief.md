# Le combat « La Brute », lot 1 : le duel — brief de séance (13/11/2026)

Séance lancée par la séance de l'atelier du combat final (journal Passes CF1 à CF3), sur la réponse de l'opérateur à la proposition « La Brute »
(PB-6 « Lancer le lot 1 »). À lire d'abord : `AGENTS.md`, `JOURNAL.md` en entier (dont les Passes CF2 et CF3), `briefs/combat-auto.md` §§ 31 à 33.

## Ce que l'opérateur a décidé (journal Passe CF3, `briefs/combat-auto.md` § 33)

Six sur six à la recommandation, mot pour mot : PB-1 « Construire ce modèle » (A3 : change DB5-3 pour les compétences ; et AC-03, DB5-2, SL1-3),
PB-2 « 2, 2, 3, 3, 4 selon le niveau », PB-3 « Caler sur le joueur moyen » (A3 : change AC-16), PB-4 « Toutes », PB-5 « Les construire après la
préparation », PB-6 « Lancer le lot 1 ». Le modèle est celui du § 32.2 (`BK5` au laboratoire). Ces décisions sont prises : ne pas les rouvrir.

## Le but du lot 1

Le modèle `BK5` dans le duel du jeu par défaut (`src/combat/auto.ts`, `autoData.ts`, `autoMatch.ts`, et ce qui en dépend), **sans rien de nouveau à
l'écran** : ce qui se voit est le lot 2.
- **Les coups d'éclat comptés** : 2, 2, 3, 3, 4 usages par combat du niveau 1 au niveau 5 (PB-2), un délai entre deux selon le type (rapide 8 s,
  moyen 16 s, long 28 s au laboratoire) ; plus de PA (AC-03) ; le coup puissant garde sa recharge (SY-02, DB5-3) ; un rival : le niveau 1, 2, 3 de ses
  compétences en poule, au tableau, en finale.
- **La faille** (ni garde ni esquive, dégâts subis +25 %) : Fracas, la Feinte sur un gros coup en charge, la Garde de riposte dans sa fenêtre, un gros
  coup esquivé ; la rupture de RY-3 inchangée.
- **Un rôle par compétence** (`BRUTE_ROLES`), **l'automatique du plan général** (`plan: 'general'`, `late`), les conditions par rôle de SY-08 avec
  « dans une faille » et « au début », la main (touches 1 à 4) gardée.
- **Les styles des rivaux** (`BRUTE_STYLES`) sous les mêmes règles (SY-01), **la garde par les stats** (−30 à −70 %, DB5-2 changée), les effets
  d'équipement (`GEAR_FX`) et la Vivacité des pièces à moitié, l'attaque simple ×1,35, les santés ×1,2.
- **La course recalée sur le joueur moyen** (PB-3, AC-16 changée) : sur parties entières, le planificateur à 50 % en demi-finale et en finale
  (`tools/auto-final/brute-games.mjs --fitPolicy=planner --target=0.5,0.5`), contrôlée sur 200 parties tenues à part.

## Ce qui reste à régler, mesuré avant la fusion (§ 33.3)

- **Le curieux** : 0 à 1 % de titres au laboratoire contre 21 % aujourd'hui. Explorer la ville ne doit pas condamner. Pistes mesurées : les usages
  doux et l'automatique d'avant le relevaient à 7-13 % (BK3) ; la ville qui nourrit le build, la finale recalée.
- **Les durées** dans les bornes de SL1-2 (la poule vers 2 min, le tableau de 2 à 4, la finale de 3 à 4 au plus), réglées par la santé ; RY-1 (environ
  40 coups par minute) gardé.
- **La Ferveur de l'automatique** (« blessé » seul fait mieux de 9 points), **le prix d'une compétence nouvelle** face au niveau des siennes,
  **l'équilibre du catalogue** (les compétences et les armes de Ren) au test de AC-12.

## Comment

- **Le laboratoire** `tools/auto-final/` : l'interrupteur `brute` de `sim.mjs`, `bruteOf` de `lab.mjs`, `BK5` dans `variants.mjs`, `brute.mjs` (à
  niveau égal), `brute-games.mjs` (parties entières). Porter dans `src/`, puis **prouver le portage identique** à la copie du laboratoire sous `BK5`,
  événement pour événement, comme `tests/combat-auto.test.mjs` le fait contre `tools/auto-sym/sim.mjs` ; une fois le jeu changé, `lab.mjs` ne vaut
  plus que contre le commit d'avant (le dire au journal, comme SL1 l'a fait pour `tools/auto-sym/`).
- **Les tests** : ceux du duel (`tests/combat-auto`, `auto-hand`, `auto-arena`, `auto-sound`, `duel-stats`, `tutorial`) suivent les nouvelles règles ;
  chaque règle contre un oracle écrit d'après la décision ; une partie qui ne touche pas au combat (`v2=0`) inchangée.
- **Ce qui parle de PA à l'écran** (`src/arena/AutoHud.ts`, `src/ui/skills.ts`, `src/ui/duelTutorial.ts`, `src/ui/tutorial.ts`) : le lot 2 le récrit ;
  au lot 1, rien ne doit casser (aucune erreur de page, la relecture finit sur le résultat du duel, une leçon dont le moment n'existe plus ne s'ouvre
  pas) et ce qui n'a plus de sens ne montre rien de faux.
- **Les preuves dans le navigateur** : `tools/auto-arena-proof.mjs`, `play-flow.mjs`, `challenge-flow.mjs`, `gauge-proof.mjs`, `tutorial-proof.mjs`,
  `audio/hooks-proof.mjs` selon ce qu'elles couvrent ; un serveur DEV par `preview_start` avec une entrée `.claude/launch.json` de ton worktree sur un
  port libre, retirée à la fin.
- Les leçons du laboratoire (journal Passe CF2) : mesurer la meilleure tactique unique avant de vanter l'adaptation au rival ; apprendre et appliquer
  une table dans le même ordre, avec marge ; regarder les politiques faibles, pas seulement la référence.

## Le § 6.1 du contrat projet

Son texte proposé est au § 33.4 de `briefs/combat-auto.md` et attend la réponse de l'opérateur. Si la séance qui t'a lancé te transmet son accord, mot
pour mot, amende le § 6.1 sur ta branche avec une note datée en tête du contrat, comme les amendements précédents ; sinon, consigne l'écart au journal
(décision C3) et ne touche pas au contrat.

## Les règles

- Une seule branche de travail, chaque commit poussé aussitôt ; la passe du journal en français, dans le même commit que le travail ; fusion en avance
  rapide dans `main` après typecheck, `npm test`, build, `npm run art:validate` et les preuves du lot ; puis la branche supprimée.
- Si un réglage change une décision A3 ou laisse un vrai choix à l'opérateur : une fiche courte (skill `fiche-arbitrages`) avant de fusionner ce
  point ; sinon fusionner et rendre compte.
- Mot pour mot : « ne jamais lire ni copier `.env.local` ; ne jamais committer `.gitignore` (modifié localement par l'opérateur) ni `.claude/` ;
  serveurs seulement par preview_start / preview_stop, avec une entrée `.claude/launch.json` pour ton worktree sur un port libre […], retirée à la fin ;
  scripts longs en arrière-plan ; aucun taskkill ».
- Les parties entières du laboratoire sont longues : en arrière-plan.
