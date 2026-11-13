# Journal de bord — archive : passe SY1 (2026-11-12)

> Déplacée mot pour mot de `JOURNAL.md` le 2026-11-13 (Passe SL4) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe SY1 — L'atelier de la seconde refonte du combat joué par l'ordinateur : les mêmes règles pour Ren et les rivaux, les compétences automatiques, à la tactique ou à la main ; l'inventaire des écarts mesuré, un prototype prouvé identique au jeu, la fiche publiée ; rien du jeu changé (2026-11-12)

### Demande
- La séance de l'audit final, d'après les deux directions de l'opérateur du 12/11 (mot pour mot, consignées par elle en Passe CO1 et dans `briefs/combat-auto.md` § 25) : les mêmes règles de combat pour Ren et pour les rivaux, les écarts de force venant seulement des stats, de l'équipement, de l'entraînement et de la course ; les coups simples et puissants automatiques, les compétences automatiques, à la main ou par une tactique. Mener l'atelier comme AC1 à AC4 : l'inventaire des écarts, un prototype des règles symétriques au laboratoire, le rendement des façons de décider, une forme de tactique, une fiche d'arbitrages ; rien sous `src/`, rien tranché par un agent.
- Une seule branche à la fois : l'audit final avait la sienne (`claude/coherence-jeu`, puis `claude/coherence-co2`) ; le prototype, les mesures et la fiche sont restés dans le dossier de travail, sans commit, jusqu'à la fusion de CO2. Puis la branche `claude/atelier-combat-sym` (le worktree `atelier-sym`, tirée de `main` `2cef4a2`), avec l'accord de l'audit final ; sur elle, la copie est de nouveau identique au jeu (2 800 duels, 60 parties) et la référence fait toujours 34 % de titres : CO1 et CO2 ne changent rien au duel.

### Le prototype — [OK] prouvé identique au jeu
- `tools/auto-sym/` : `sim.mjs` (une copie d'`autoDuel` ; `streams: 'one'` le jeu, `'split'` un tirage par coup, sa clé : le frappeur, le rang de son action, le rang du coup ; les choix d'un rival par le rang de la décision ; `salt` pour un avenir inconnu), `lab.mjs` (le jeu chargé par Vite avec UNE transformation du laboratoire : `autoDuel` demande d'abord `globalThis.__symDuel`, si bien que les parties entières du TournamentLab, le combat du joueur, ses défis et les combats hors écran, jouent la copie ; les interrupteurs de chaque écart ; l'automatique symétrique ; la course recalée), `deciders.mjs` (la tactique, une condition par compétence ; les appuis au hasard ; le coup d'avance), `identity.mjs`, `inventory.mjs`, `branch.mjs`, `cadence.mjs`, `fit.mjs`, `modes.mjs`, `kits.mjs`, la fiche (`build-sheet.mjs`, `check-sheet.mjs`).
- **Identité** : la copie, configurée comme le jeu et sur un seul tirage, rend 2 800 duels sur 2 800 identiques au jeu, événement par événement (quatre jours, sept rivaux, quatre kits, 25 graines), et 60 parties entières sur 60 aux états finaux identiques (la référence, le curieux, l'inactif). Contrôle négatif : les tirages séparés changent les parties (32 % de titres au lieu de 34 %).

### L'inventaire des écarts — [OK] mesuré (`briefs/combat-auto.md` § 25.1)
- Huit écarts : les PA (les rivaux n'en paient aucun, CB-1), le combo des rivaux en plus de leur attaque simple (AC-02), leurs tables (la cadence ×0,5 de LC1, le tempo de leur kit, la fiche DB7), leurs recharges fixes de 16 à 40 s et leur coup lourd sans recharge, leurs traits (AC-05), leur IA au hasard contre l'automatique de Ren, un seul tirage pour tout le duel, Ren le premier aux égalités.
- Chacun ramené seul à la règle de Ren, la course gardée (200 parties de la référence, graines 101 à 300 ; le jeu 34 % de titres) : les PA payés 34 % ; sans combo 81 % ; leur cadence ×1 49 % ; DB5-3 pour eux 12 % ; sans traits 53 % ; l'automatique de Ren pour eux 2 % ; tout à la fois 7 à 9 %. Les écarts jouent dans les deux sens et la course les compense en moyenne ; aujourd'hui 79 % des dégâts d'un rival tombent sur Ren exposé, 53 % avec les mêmes règles.
- **Un choix changé** (210 duels de la poule) : le vainqueur change dans 17,6 % avec un seul tirage (l'audit : 18,8 %), 7,1 % avec un tirage par coup ; les vingt actions suivantes du rival les mêmes à 34 % et 76 %. Avec les mêmes règles, 14,3 % et 56 % : le rival répond à ce qu'il voit.

### Le modèle des mêmes règles — [OK] mesuré ; [?] des réserves (§ 25.2, § 25.3)
- Chacun : l'attaque simple de son arme (le combo d'un rival devenu son arme), un coup puissant de base hors des quatre, sans PA, lancé quand l'adversaire ne peut pas se défendre ou PA pleins ; ses compétences payées en PA (celles des rivaux 2 PA), DB5-3, la puissance par la charge (DB5-1) ; la garde et l'esquive par les stats seules ; le même automatique ; un tirage par coup ; une cadence commune.
- **Le coup puissant sans recharge domine** [KO de modèle] : le joueur qui attend sur 5 PA en frappe sans fin (une tactique aux signaux seulement 53 % de titres contre 28 % pour l'automatique ; des appuis au hasard 38 à 43 %). Avec sa recharge de DB5-3 : l'automatique 20 %, les tactiques lisibles de 27 à 36 %.
- **La cadence** : le coup puissant rechargé laisse 16 à 18 % du temps en silences de plus de 3 s à ×0,75 ; ×0,6 9 à 11 % (aujourd'hui 12 %, LC3-2 « Le rythme convient »), 120 coups par minute.
- **La course recalée** (AC-16, graines 1 à 80 puis 101 à 300) : à +15 % par tour (LC1-1) la poule est trop dure (100 / 74 / 39 / 73 / 35 %, 20 % de titres) ; à **+10 % : 100 / 90 / 75 / 72 / 51 %, 34 % de titres**, la cible d'AC-15 ; +20 % : 7 % au jour 5. Des combats de 202 s en médiane (125 à 269 s du 10e au 90e centile : DB5 tenue).
- **L'équilibre (AC-12)** ne tient plus : le sabre 85 à 88 % en moyenne au tableau et en finale, les quatre offensives 8 à 16 % ; à refaire au premier lot.

### Les façons de décider — [OK] mesuré (§ 25.4)
- Aujourd'hui (tirages séparés, la course du jeu) : l'automatique 32 % ; les offensives aux signaux 0 à 1 % ; la plus forte à la rupture 29 % ; appuis au hasard 14 à 20 % ; **un coup d'avance, l'avenir inconnu, 62 % contre 25 % pour l'automatique sur les mêmes parties** (95 % s'il connaît les tirages) : la mécanique récompense le bon choix, mais pas celui que l'arène montre.
- Avec les mêmes règles (coup puissant rechargé, sa course) : l'automatique 20 % ; aux signaux 17 à 28 % ; la plus forte à la rupture 36 % ; pour finir 30 % ; les protections dès que prêtes 7 % ; les soutiens jamais 12 % ; appuis au hasard 26 à 31 % ; un coup d'avance 98 % (17 %). Les tactiques lisibles valent l'automatique ou mieux, les mauvais choix perdent ; l'automatique, qui lance ses offensives dans la garde ×2 de l'adversaire, est sous les appuis au hasard : deux critères pour la construction (SY-07).

### La tactique et la main — proposées (§ 25.5)
- Une condition par compétence sur la fiche de match, l'ordre des quatre gardé (huit conditions lisibles sur la ligne de temps) ; l'automatique est une tactique ; la tactique dans la partie, comme l'ordre. La main : une touche par compétence, au prochain choix de Ren, une en attente. Le duel refait depuis l'appui (avec les tirages séparés, ce qui précède ne change pas) ; le résultat de la tactique écrit à l'ouverture de l'arène ; « Passer » = la tactique ; hors écran, l'automatique des deux côtés ; une bande de la fiche de match et une leçon au premier combat.

### La fiche — publiée, à remplir
- https://claude.ai/artifact/J99g6BKC3Fku2x6ZMvdPXF (`briefs/fiche-combat-sym.html`, le gabarit des fiches du combat), quatorze cartes SY-01 à SY-14 ; A3 : SY-02 (change CH1, CH-3, CH-4), SY-05 (+10 %, change LC1-1), SY-13 (le § 6.1). `decisions` relue vide après publication. Vérifiée avant dans un Chrome sans tête : quatorze cartes, 34 options, trois tableaux, aucune erreur de page, aucun débordement à 375 et 1280 px.

### Erreurs de méthode — [KO → corrigé]
- Le coup d'avance connaissait les choix futurs des rivaux (leurs tirages de décision non masqués) : corrigé (62 % au lieu de 90 % sur le modèle d'aujourd'hui).
- La recharge du coup puissant n'était pas lue par l'automatique (`heavyWhen` ne vérifiait pas `usable`) : une mesure entière refaite.
- Un commentaire `//` a avalé la fin d'une ligne de code ; une politique (le curieux) choisit une action refusée au jour 9 sous d'autres résultats de combats : la partie est sautée et comptée.
- Une sortie lue de travers (deux fichiers concaténés) : relue fichier par fichier avant d'écrire un nombre.

### Validation
- Rien sous `src/` ni `tests/` : le jeu et ses empreintes inchangés. Ajoutés : `tools/auto-sym/`, `briefs/fiche-combat-sym.html` ; `briefs/combat-auto.md` (statut, § 25) ; une ligne d'`AGENTS.md` (Commands) ; ce journal.
- `npm run typecheck` sans erreur ; `npm test` **653 / 653** ; `npm run build` ; `npm run art:validate` (73 manifestes, 123 sources, 23 du son, 0 erreur). `tools/auto-sym/identity.mjs` relancé sur la branche : 2 800 / 2 800 et 60 / 60.
- Pas d'archivage : avec SY1, les passes gardées font environ 48 Ko, sous les 60 Ko de la règle.

### Où reprendre
- Attendre que l'opérateur dise la fiche remplie ; la relire (`ArtifactData list decisions`), consigner chaque choix mot pour mot, les décisions A3 citées et datées ; amender le § 6.1 si SY-13 le dit ; puis la construction en lots (SY-14).

### Pensée
- Un mode « choisir » se juge contre trois joueurs : celui qui suit les signaux que l'écran montre, celui qui appuie au hasard et celui qui calcule tout. Aujourd'hui le troisième gagne et le premier perd : la mécanique récompense un bon choix invisible.
- Une règle qui donne une action gratuite (un coup puissant sans recharge) se voit à la tactique qui ne fait plus qu'elle ; la mesurer avant de la recommander.
- Un seul tirage pour tout un duel fait passer les conséquences d'un choix pour du hasard ; un tirage par coup les rend locales, et l'adversaire qui répond à ce qu'il voit les rend réelles.

