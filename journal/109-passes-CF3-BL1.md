# Journal de bord — archive : passes CF3, BL1 (2026-11-13)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-11-14 (Passe BL3) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe CF3 — La proposition « La Brute » relue : six sur six à la recommandation (PB-1 « Construire ce modèle » et PB-3 « Caler sur le joueur moyen », décisions A3) ; le texte du § 6.1 proposé ; le lot 1, le duel, lancé dans sa séance (2026-11-13)

### Demande
- L'opérateur, dans la séance de l'atelier : « Fiche remplie » (13/11/2026).
- `ArtifactData list decisions` sur https://claude.ai/artifact/VgiYmopbSiyd2Ks8MfoHzv : six lignes, PB-1 à PB-6, écrites de 18 h 05 à 18 h 06 (UTC), sans note.
- Branche `claude/combat-brute-cf3` (worktree `eager-jepsen-3b00bf`, tirée de `main` `7b25735`), seule ouverte. Aucun serveur.

### Les choix, mot pour mot — [OK] consignés

| Carte | Sujet | Choix, mot pour mot |
|---|---|---|
| PB-1 | Le modèle du duel | « Construire ce modèle » |
| PB-2 | Les usages par combat | « 2, 2, 3, 3, 4 selon le niveau » |
| PB-3 | La course | « Caler sur le joueur moyen » |
| PB-4 | La préparation (priorité 1) | « Toutes » |
| PB-5 | Le build à la La Brute (priorité 2) | « Les construire après la préparation » |
| PB-6 | La suite | « Lancer le lot 1 » |

- Les six suivent la recommandation. Le modèle du § 32.2 de `briefs/combat-auto.md` est approuvé ; le nouveau § 33 l'emporte sur le § 32 là où ils diffèrent.

### Les décisions A3 — [OK] consignées, avec une réserve de forme
- **PB-1 « Construire ce modèle »**, décision A3 de l'opérateur du 13/11/2026 (E11) : change **DB5-3** (le coup puissant garde « 5 × le temps de charge » ; une compétence a un nombre d'usages par combat et un délai entre deux), et avec elle **AC-03** (les PA retirés), **DB5-2** (la garde par les stats, de −30 à −70 %) et **SL1-3** (l'automatique du plan général). SY-08 reste (les conditions par rôle, plus « dans une faille » et « au début »).
- **PB-3 « Caler sur le joueur moyen »**, décision A3 de l'opérateur du 13/11/2026 : change **AC-16** (la course calée sur le planificateur à l'équilibre, la demi-finale et la finale à 50 %, et non plus sur la référence).
- Restent : SY-01, SY-02, RY-1, RY-3, SL1-2, AC-07, AC-11.
- **La réserve** : à la différence des fiches AC et SY1, les options de la page ne portaient pas la marque « décision A3 ». La table « Les décisions que cela touche », juste au-dessus des cartes, nommait DB5-3 (A3) et AC-16 (A3) et disait « ces décisions restent les tiennes, mot pour mot, avant toute construction ». Les deux choix sont consignés comme ses décisions A3 sur cette table ; dit à l'opérateur dans le compte rendu.

### Le § 6.1 du contrat projet — [?] le texte proposé, à l'opérateur
- Avec le modèle, la phrase « les compétences sont payées en points d'action » du § 6.1 ne serait plus vraie. Aucune carte ne portait de texte d'amendement : **le § 6.1 n'est pas amendé** (décision C3).
- Le texte proposé (`briefs/combat-auto.md` § 33.4) ne change que la partie sur les compétences et ajoute la faille et le style des rivaux ; il attend la réponse de l'opérateur. S'il l'approuve, l'amendement se fait sur la branche du lot 1, avec sa note datée en tête du contrat ; sinon, le lot 1 consigne l'écart.

### La suite — le lot 1 lancé
- Le lot 1, le duel, dans une séance à part (PB-6), par son brief `briefs/combat-brute-lot1-brief.md` : le modèle `BK5` porté dans le duel du jeu par défaut, prouvé identique au laboratoire, rien de nouveau à l'écran ; la course recalée sur le joueur moyen ; le curieux (0 à 1 % de titres au laboratoire, 21 % aujourd'hui), les durées (SL1-2), la Ferveur de l'automatique, le prix d'une compétence nouvelle et l'équilibre au test de AC-12 réglés avant la fusion.
- Ensuite le lot 2 (ce qui se voit), le lot 3 (la préparation, PB-4), l'essai en jeu de l'opérateur, puis le lot 4 (le build) et le lot 5 (les défis de l'arène et le panache, PB-5) ; chacun dans sa séance.

### Validation
- Aucun fichier de `src/`, de `tests/` ni des contrats touché : `briefs/combat-auto.md` (§ 33 et sa ligne de statut), `briefs/combat-brute-lot1-brief.md` (nouveau), `briefs/atelier-combat-final-brief.md`, `AGENTS.md`, ce journal. `npm run typecheck` sans erreur, `npm test` 661 sur 661, `npm run build` réussi, `npm run art:validate` 73 manifestes, 123 sources archivées, 23 manifestes de son, 0 erreur.

### Pensée
- Une fiche qui touche une décision A3 marque l'A3 dans le libellé de l'option, comme les fiches AC et SY1 : une table au-dessus des cartes laisse une part d'interprétation.
- Le texte d'un amendement de contrat se met sur une carte. Sans carte, il ne s'applique pas : il se propose et attend sa réponse, sans retarder un lot qui peut consigner l'écart.

## Passe BL1 — Le combat « La Brute », lot 1 : le modèle `BK5` porté dans le duel du jeu par défaut, prouvé identique au laboratoire ; la course calée sur le joueur moyen (PB-3) ; les points du § 33.3 réglés ou mesurés ; rien de nouveau à l'écran ; la fiche courte relue (neuf sur neuf), l'entrechoc et la jauge réglés, la course recalée, le § 6.1 du contrat projet amendé (2026-11-13)

### Demande
- La séance de l'atelier (Passe CF3), sur la décision PB-6 « Lancer le lot 1 » : construire le lot 1 selon `briefs/combat-brute-lot1-brief.md` (le modèle `BK5` dans `src/combat/`, prouvé identique au laboratoire ; la course recalée sur le joueur moyen ; le curieux, les durées de SL1-2, la Ferveur de l'automatique, le prix d'une compétence nouvelle et l'équilibre au test de AC-12 réglés et mesurés ; l'arène et ses pages sans rien de nouveau à l'écran ; tests et preuves ; une fiche courte pour ce qui change une A3 ou laisse un vrai choix).
- Branche `claude/combat-brute-lot1` (le worktree `determined-visvesvaraya-7ac630`, tirée de `main` `bd636ef` après `git merge --ff-only origin/main`), seule ouverte ; serveur `bl1-dev` (port 5463, entrée de `.claude/launch.json` retirée à la fin). Le § 6.1 du contrat projet : aucun accord transmis au départ, l'écart consigné (décision C3) et le texte du § 33.4 mis sur la fiche (BL1-7) ; l'accord transmis ensuite, **amendé** (« La fiche relue » ci-dessous).

### Le portage — [OK] prouvé identique au laboratoire
- `src/combat/auto.ts` : le chemin `BK5` de `tools/auto-final/sim.mjs` porté, opération par opération (l'ordre des multiplications compris : la perceuse qui traverse une protection divise ce que la protection a multiplié, comme le laboratoire). Plus de PA (AC-03 changée par PB-1) ; les usages par combat et le délai entre deux (`uses`, `cooldown`) ; la faille (`openUntil` : ni garde ni esquive, ×1,25) ouverte par un ouvreur, une interruption (l'événement `interrupt`), une parade (l'événement `parry`) ou un gros coup esquivé ; l'accélération, le ralentissement, la charge sur la prochaine action ; un rôle par compétence et l'automatique du plan général (`autoRole`, `planChoice`) ; les conditions de SY-08 avec « dans une faille » et « au début » (et `foeGauge`, `warded` du laboratoire) ; le coup puissant sur une faille ou dès qu'il est prêt pour un bagarreur ; la garde de −30 à −70 % selon la Défense contre l'Attaque (DB5-2 changée) ; les effets d'équipement (`gfx`).
- `src/combat/autoData.ts` : `AUTO_BRUTE` (usages 2, 2, 3, 3, 4 ; délais 8, 16, 28 s ; charges ×0,6, celles qui exploitent ×0,4 ; puissance ×1,2 ; le niveau des rivaux 1, 2, 3 par étape), `AUTO_ROLES`, `AUTO_STYLES`, `AUTO_GEAR_FX`, `AUTO_PIECE_VIV` (la Vivacité des pièces à moitié), `autoBrute` ; `autoRen` prend les pièces portées et leurs points de Vivacité, `autoFoe` l'étape et son style. `src/combat/autoMatch.ts` et `src/simulation/v2gear.ts` (`wornPieces`, `piecesViv`) les donnent depuis la partie ; `autoReactions` dit les chances avec le style, les effets et la part que la garde retire.
- **[KO → corrigé] Le laboratoire se trompait de style hors écran** : `kitOf` lisait la première compétence de rival d'un combattant dans son ordre, une protection ou un soutien pour chaque rival, si bien que dans les parties entières de CF2 chaque combat hors écran se jouait au style de Marek. Corrigé dans `tools/auto-final/lab.mjs` ; les mesures de parties entières de CF2 portaient cette erreur (pas celles à niveau égal, ni les combats du joueur).
- `tools/auto-final/port-identity.mjs` : le laboratoire de `bd636ef` (sa copie extraite, son `kitOf` corrigé) contre le jeu porté : **504 duels isolés sur 504 identiques, événement par événement, et 60 parties entières sur 60** (cinq politiques, état final et empreinte), au commit du portage. `tests/combat-auto.test.mjs` tient ensuite le jeu contre la copie du laboratoire sous le jeu de règles `BL1` (`BK5` et les réglages ci-dessous, `variants.mjs`, l'interrupteur `hasteRule` de `sim.mjs`) : 504 duels, chaque événement atteint (parades et interruptions comprises).
- `lab.mjs` ne vaut plus que contre `bd636ef` (dit en tête du fichier), comme `tools/auto-sym/` après la Passe SL1.

### Les points du § 33.3
- **La Ferveur de l'automatique — [OK] réglée** : « blessé » seul (la Ferveur ne part plus aussi à la rupture adverse). Mesurée sur les combats de 200 parties tenues à part, la course recalée : le planificateur y gagne (les facteurs du tableau et de la finale ×1,014 et ×1,065 à taux égal).
- **Les durées (SL1-2, A3) — [OK] réglées par la santé** : toutes les santés ×1,45 de plus (`hpScale` 3,48 = 2 × 1,2 × 1,45). Avec ×1,7 la poule durait 2 min 32 ; avec ×1,45, la référence : **1 min 58 / 2 min 48 / 3 min 27** (poule, tableau, finale ; SL1-2 : environ 2 min, 2 à 4, 3 à 4 au plus). Rythme : **45,5 coups par minute** (RY-1 : environ 40 ; BK5 en mesurait 43,6), la rupture 1,4 fois par combat pour chacun.
- **L'équilibre au test de AC-12 — [?] amélioré, pas tenu partout** (`tools/auto-lab.mjs kits --norm=rival`, chaque rival à son niveau, le combat portant l'arme et son effet ; **[KO → corrigé]** une première mesure laissait les rivaux au niveau 1 et sans effets d'arme : `duelsOf` passe désormais l'étape et l'arme) : avec `BK5` tel quel, le kit de Fracas dominait la finale (82 % de moyenne contre 51 %). Les réglages de Fracas seul (puissance, délai, charge) le gardaient en tête ; **retenus : la faille d'un ouvreur 5 s au lieu de 8 et Fracas ×0,6** : plus aucun kit ne domine à aucune étape. Restent : au tableau et en finale, Orla, Ilse et Marek n'ont qu'une bonne réponse (Fracas) ; le kit défensif sans l'Estoc et le kit de soutiens perdent presque tout ; le sabre est l'arme la plus faible (52 / 31 / 25 % contre 86 / 65 / 52 pour la lame ; ses coups à 0,26 ne le rattrapent pas) ; une protection au niveau 3 pèse lourd (ci-dessous). À la fiche (BL1-5).
- **Le prix d'une compétence nouvelle — [OK] mesuré** (les combats du planificateur, 200 parties tenues à part ; poule / tableau / finale) : tel quel 97 / 71 / 48 ; Fracas à la place de la Ferveur au niveau 1 : 95 / 88 / 64, au niveau 3 : 98 / 96 / 83 ; la Feinte à la place du Rempart : 86 / 59 / 49 et 88 / 62 / 53 ; la Peau de fer à la place du Rempart : 94 / 76 / 50 et **99 / 94 / 89** ; la Concentration, la Parade de riposte et le Cri en dessous du kit de départ. Une compétence nouvelle au niveau 1 a les deux usages du niveau 2 ; ce qui coûte, c'est le niveau 3 (trois usages, une protection plus longue), que le planificateur n'atteint que pour la Taille éclair.
- **Le curieux — [?] mesuré, à la fiche** : 3 % de titres (la référence 34, le planificateur 28). Il atteint la finale 130 fois sur 200 et en gagne 4 %. Ses finales rejouées (banc de 200 parties) : telles quelles 1 % ; le kit de départ 0 % ; ses deux offensives au niveau 3 : 10 % ; +12 en Attaque : 20 % ; les deux ensemble : 72 % (le planificateur 41 % : il a plus de PV). En finale il a l'Attaque 10 (l'épée d'entraînement, aucune séance d'Attaque) contre 22 et ses compétences au niveau 1. Aucun levier du duel ne le relève (`levers` : la santé, les usages, la forme, les failles, le niveau des rivaux, la pente des niveaux : 0 à 9 %). C'est son build qui le condamne : la ville doit le nourrir (proposé au lot 3, BL1-4).
- **La course (PB-3, A3) — [OK] calée sur le planificateur** (`tools/auto-lab.mjs fit`, le procédé de `brute-games.mjs --fitPolicy=planner --target=0.5,0.5`) : chaque rival à 95 % contre le Ren du jour 2 du planificateur (120 parties), la pente de SL1-1, le tableau et la finale à 50 % sur 200 parties de calage (graines 1 à 100 et 301 à 400) : Vessa 1,255, Tobin 1,469, Cassius 1,231, Orla 1,155, Ilse 1,071, Marek 1,023, Rhosk 1,252 ; tableau ×1,203, finale ×1,524.

### Les mesures avant la fiche — 200 parties tenues à part (graines 101 à 300)

| Politique | Titres | j2 / j4 / j5 | Demi | Finale | Durées poule / tableau / finale |
|---|---|---|---|---|---|
| la référence | 34 % | 97 / 98 / 94 | 71 % | 48 % (140) | 118 / 168 / 207 s |
| le planificateur | 28 % | 97 / 98 / 95 | 58 % | 48 % (115) | 118 / 159 / 200 s |
| le curieux | 3 % | 99 / 78 / 91 | 69 % | 4 % (130) | 151 / 210 / 246 s |
| le diligent | 0 % | 98 / 64 / 71 | 21 % | 0 % (38) | 143 / 163 / 160 s |
| l'oisif | 0 % | 83 / 23 / 28 | 2 % | 0 % (2) | 135 / 121 / 101 s |

- Des appuis au hasard (les combats du planificateur) : un choix sur quatre 64 / 40 / 24, un sur deux 54 / 29 / 11 contre l'automatique 97 / 71 / 48 : un coup d'éclat gâché ne revient pas (la pensée de CF2 tient).
- La demi-finale du planificateur à 58 % sur les graines tenues à part (50 % sur le calage) : 115 finales, l'adversaire du tableau change d'une graine à l'autre.
- Les blessures d'une partie (graines 1 à 50) : le diligent 0,88, l'oisif 1,42, la référence 0,36 (les bagarreurs au coup puissant dès qu'il est prêt, le coup puissant sur une faille).

### Ce qui se voit — [OK] rien de faux, rien de nouveau (avant la fiche ; l'entrechoc ensuite, ci-dessous)
- L'arène (`src/arena/autoView.ts`, `AutoHud.ts`) : plus de PA (les losanges et les pastilles retirés ; Ren en garde quand une de ses compétences peut partir) ; la jauge lue dans le script (une ligne de coup tracée porte la jauge de la cible juste après, `g`, une rupture son étourdissement, `dur` ; la trace `s` tient les deux jauges) ; une interruption ou une parade finit la charge qu'elle touche, sans coup dessiné (le lot 2 les montre) ; une charge (« load ») part avec la première action offensive.
- Les pages et les textes (anglais, français) : plus de PA nulle part (la page des compétences, la fiche de match, le guide, la première leçon) ; la leçon des PA retirée du premier duel (huit leçons) ; la règle de l'automatique dite par rôle ; un soutien dit son effet (l'accélération, le ralentissement, la charge), la parade sa fenêtre ; le ruban et le jeton disent leurs délais −15 et −10 % ; le conseil d'Orla ne promet plus de PA (il ne donne plus rien : BL1-6) ; la garde « perd de 30 à 70 % » ; « plus d'usages par combat » au niveau supérieur.

### Validation
- `npm run typecheck` sans erreur ; `npm test` **665 / 665** (664 avant la fiche ; `combat-auto` réécrit : le portage contre `BL1`, PB-1 et PB-2, les rivaux, la garde par les stats, la faille, les rôles, l'automatique du plan général, les conditions, et depuis la fiche l'entrechoc contre son oracle et la jauge de BL1-9 ; `auto-hand`, `auto-arena`, `auto-sound`, `tutorial`, `ui-pages`, `wares`, `duel-stats`, `v2-injury` suivent le modèle, puis `auto-arena` et `auto-sound` l'entrechoc dans leurs oracles, `v2-injury`, `v2-coherence` et `v2-react` les parties entières de la course recalée) ; `npm run build` ; `npm run art:validate` (73 manifestes, 123 sources, 23 du son, 0 erreur).
- Navigateur avant la fiche (serveur de la branche, port 5463), tous verts : `tools/auto-arena-proof.mjs` (111 contrôles, les sept rivaux et la fiche de match) ; `tools/gauge-proof.mjs` (18 sur 18, 831 coups sur leur image) ; `tools/tutorial-proof.mjs` en anglais et en français (92 chacun) ; `tools/play-flow.mjs` gagné (graine 5) et perdu (graine 1842 : l'inverse de la Passe SL4) ; `tools/challenge-flow.mjs` défi perdu (Orla) et gagné (Aldric), représailles gagnées (1842) et perdues (graine 3) ; `tools/rivals-flow.mjs sand` ; `tools/audio/hooks-proof.mjs`.
- Navigateur après la fiche (le même serveur), tous verts : `tools/auto-arena-proof.mjs` (111 contrôles ; les sept rivaux, au moins 30 coups par combat) ; `tools/gauge-proof.mjs` (18 sur 18, 785 coups sur leur image) ; `tools/tutorial-proof.mjs` en anglais et en français (92 chacun) ; `tools/play-flow.mjs` gagné (graine 5) et perdu (graine 4 : la graine 1842 gagne désormais) ; `tools/challenge-flow.mjs` défi perdu (Orla, graine 4 : la graine 1842 gagne désormais) et gagné (Aldric), représailles gagnées (1842) et perdues (graine 3) ; `tools/rivals-flow.mjs sand` ; `tools/audio/hooks-proof.mjs`. L'entrechoc vu dans l'arène (`?scene=arena`, Marek, à 26,77 s) : les deux coups qui se rencontrent, les étincelles de la garde, « Entrechoc » au-dessus des deux.
- Les outils suivent : `auto-arena-proof` (la santé de l'échelle du duel, la carte de charge à la moitié des pas ; depuis la fiche, au moins 30 coups par combat au lieu de 50 : le combat de Cassius n'en a plus que 43, tous dessinés), `gauge-proof` et `tutorial-proof` (la trace à deux jauges, l'étourdissement du script), `play-flow` (ses graines), `auto-tactics` (sans PA).
- Archivage : avec BL1, les passes gardées passaient 60 Ko ; SL3 et SL4 (branches fusionnées) déplacées d'un bloc, à l'octet, dans `journal/107-passes-SL3-SL4.md`, leur ligne ajoutée à l'index, les deux phrases d'en-tête complétées ; preuve par script : le corps de l'archive égale les octets retirés, SL3 et SL4 dans un seul fichier, CRLF partout.

### La fiche
- https://claude.ai/artifact/FpHhMMWt2G45CEmoSuhxuu (`briefs/fiche-combat-brute-lot1.html`), publiée avec sept cartes : BL1-1 la réception ; BL1-2 les quatre réglages ; BL1-3 la Vivacité des pièces à moitié (A3 : change AC-11) ; BL1-4 le curieux ; BL1-5 l'équilibre au test de AC-12 ; BL1-6 le conseil d'Orla ; BL1-7 le § 6.1 (A3, le texte du § 33.4). Republiée avec les trois remarques de l'opérateur (BL1-8 à BL1-10) et sans BL1-7 ; relue ci-dessous.

### La fiche relue — neuf sur neuf à la recommandation (13/11/2026)
- Avant de la remplir, l'opérateur a regardé le duel dans le navigateur (« il y a du mieux ») et fait trois remarques. La première, mot pour mot : « je constate parfois les 2 combattants attaques en meme temps et donc se marche en quelques sorte desus, je pense que si cela arrive on devrait creer une egalite sans que personne porte des degats et on observerait les 2 armes s'entre-choque, ce qui donne du rythme et n'impacte pas trop avec les degats infins a chaque attaque ». La deuxième : le rival a plus de PV que le héros (« c,est normal ? »). La troisième : « notre barre de break devrait naturellement dimininuer tres tres legerement aisni si il y a des blocages ou esquives ». Mesurées sur 300 combats du planificateur (parties 101 à 160 ; l'entrechoc sur un prototype, une copie temporaire de `auto.ts` retirée après), elles sont devenues trois cartes (BL1-8 à BL1-10). BL1-7, le § 6.1, est retirée de la fiche : déjà décidée. Fiche republiée à la même adresse ; `decisions` vide avant.
  - Les mesures de ces cartes : deux attaques lancées à 0,35 s près 1,3 fois par minute (6,6 en comptant chaque coup des enchaînements), les deux portant. La jauge baissait déjà de 0,16 par seconde, soit 13 % de ce que les coups y mettent (75 par minute) : invisible. Un coup gardé y comptait double (DB9), si bien qu'un tiers de la jauge venait des coups gardés. Les rivaux ont deux fois la santé de Ren (Vessa 2 184 contre 1 044 au premier combat), mais un coup de Ren prend 2,8 % de leur barre en poule, contre 1,1 % de la sienne pour un coup du rival ; en finale, 1,2 contre 1,2.
- Ses choix, mot pour mot, sans note :
  - BL1-1 « Reçu » ;
  - BL1-2 « Les garder » ;
  - BL1-3 « Confirmer la moitié (décision A3 : change AC-11) », **décision A3** : la Vivacité des pièces comptée à moitié dans le duel ;
  - BL1-4 « Au lot 3 : la ville nourrit le build » ;
  - BL1-5 « Une passe à part, avant le lot 2 » ;
  - BL1-6 « Son conseil : délais −10 % » ;
  - BL1-8 « Oui, comme recommandé (au lot 1) » ;
  - BL1-9 « Garde ×0,5, 0,3/s, rupture à 14 (décision A3 : change le nombre de RY-3) », **décision A3** ;
  - BL1-10 « Garder ; le dire au lot 2 sur la fiche de match ».
- **Le § 6.1 du contrat projet — [OK] amendé.** La séance de l'atelier a transmis la réponse de l'opérateur, mot pour mot « Oui, l'amender » (13/11/2026), à la question « J'amende le § 6.1 du contrat projet avec le texte proposé ? ». Le texte du § 33.4 de `briefs/combat-auto.md` remplace la première phrase du § 6.1. La note datée en tête du contrat cite la décision, la page de la proposition (https://claude.ai/artifact/VgiYmopbSiyd2Ks8MfoHzv) et le texte d'avant ; le reste du contrat est inchangé.

### Les réglages de la fiche — construits au lot 1
- **L'entrechoc (BL1-8) — [OK]** (`AUTO_RULES.clash` : 0,3 s ; recul de 0,4 s + 0,6 s × un tirage propre à chaque combattant). Il joue quand deux coups partent à 0,3 s près.
  - Deux coups du même poids (deux attaques de base, ou deux compétences ou coups puissants) s'entrechoquent : aucun dégât, rien aux jauges, les deux actions dépensées (l'usage d'une compétence avec), et chacun reprend après son recul.
  - Une compétence ou un coup puissant l'emporte sur une attaque simple, qui est perdue.
  - Le script porte l'événement `clash` : sans `beat`, les deux coups ; avec `beat`, l'attaque simple perdue face à l'action `beat`.
  - Dans l'arène, les deux coups se rencontrent : leurs fenêtres de coup, un léger recul de chacun, les étincelles de la garde, la lumière entre eux. On entend le son de la garde au milieu de la scène, et « Clash » / « Entrechoc » s'affiche au-dessus des deux. La musique (règle F) et la charge de Ren finissent là.
  - Les santés passent ×0,9 (`hpScale` 3,132).
  - **[KO → corrigé] sur le prototype** : avec un recul commun, les deux combattants se remettaient en phase et s'entrechoquaient sans fin (6,4 fois par minute, 29 coups par minute). Un tirage par combattant (le but `recoil`, clé du combattant et du rang de son action) les décale : 1,1 fois par minute.
- **La jauge (BL1-9, A3) — [OK]** : un coup gardé compte moitié (`guardMul` 0,5, contre ×2 depuis DB9), la jauge baisse de 0,3 par seconde (0,16 avant) et rompt à 14 coups par défaut (22,5 avant).
  - **[KO → corrigé]** Le gambison (`guardGauge` 1, soit ×1 contre ×2) aurait rendu la garde pire que la règle (×1 contre ×0,5). Il garde désormais la moitié du poids de la règle : ×0,25.
  - La leçon de la jauge le dit en pour cent (« a guarded blow only 50 % as much, a dodged one nothing. It drains between blows. »).
- **Le conseil d'Orla (BL1-6) — [OK]** : `allyCd` (`src/narrative/v2story.ts`), ×0,9 sur les délais et la recharge, posé sur les effets d'équipement du combat (`autoBoutOf`). La fiche de match le dit (« Orla watches from the gate: your gaps and your cooldown 10 % shorter. »).
- La copie du laboratoire suit sous `BL1` (`cfg.brute.clash`, les santés 1,566, la table d'équipement avec le gambison à ×0,25) : le test du portage reste une preuve, et il atteint l'entrechoc comme l'attaque simple perdue. Un test nouveau tient l'entrechoc contre un oracle : la fenêtre (0,29 s oui, 0,31 s non), le recul tiré, la compétence qui passe, deux compétences dont les usages sont dépensés, une protection qui ne s'entrechoque pas.
- **La course recalée (PB-3)** (`tools/auto-lab.mjs fit`, les mêmes graines de calage) : Vessa 1,228, Tobin 1,569, Cassius 1,17, Orla 1,165, Ilse 1,051, Marek 0,992, Rhosk 1,295 ; tableau ×1,252, finale ×1,554.

### Les mesures après la fiche — 200 parties tenues à part (graines 101 à 300)

| Politique | Titres | j2 / j4 / j5 | Demi | Finale | Durées poule / tableau / finale |
|---|---|---|---|---|---|
| la référence | 35 % | 95 / 98 / 100 | 68 % | 51 % (136) | 87 / 170 / 187 s |
| le planificateur | 24 % | 95 / 98 / 100 | 53 % | 45 % (104) | 87 / 155 / 186 s |
| le curieux | 1 % | 100 / 85 / 93 | 35 % | 3 % (67) | 135 / 216 / 246 s |
| le diligent | 0 % | 96 / 62 / 75 | 10 % | 0 % (19) | 115 / 155 / 156 s |
| l'oisif | 0 % | 85 / 26 / 37 | 0 % | — (0) | 121 / 122 / — |

- Le rythme : 41,6 coups par minute (la référence ; RY-1 : environ 40).
- L'entrechoc et la jauge, sur 300 combats du planificateur (parties 101 à 160) : 1,02 entrechoc par minute (2 par combat en médiane) ; l'attaque simple perdue contre une compétence 0,14 fois par minute ; 0,9 à 1,1 rupture par combat ; 28 coups reçus (médiane) avant la première rupture, contre 30 avant la fiche ; 15 % de la jauge venue des coups gardés, contre 34 %.
- **Les durées — [?] la poule sous SL1-2 (A3)** : la référence tient 1 min 27 en poule (SL1-2 : « la poule environ 2min »), 2 min 50 au tableau et 3 min 07 en finale, dans leurs bornes. Les santés ×0,9 de BL1-8 rendaient les durées avec l'entrechoc seul (la mesure de la fiche). Avec la jauge de BL1-9 et la course recalée (les rivaux de poule plus faibles pour que le Ren du jour 2 les batte toujours 95 fois sur 100), la poule raccourcit. L'écart est consigné (décision C3) : à reprendre dans la passe d'équilibre décidée (BL1-5), avant le lot 2. Le choix de l'opérateur (×0,9) est appliqué tel quel.
- Le curieux : 1 % de titres (3 % avant la fiche) ; BL1-4 le reprend au lot 3.
- Les blessures d'une partie (graines 1 à 50) : le diligent 0,96, l'oisif 1,18, la référence 0,30.

### Pensée
- Un laboratoire qui transforme le jeu lit des champs que le jeu n'a pas toujours posés (`kitId`) : sa table de repli se vérifie sur chaque chemin, hors écran compris, avant d'en croire les parties entières.
- Prouver un portage sur deux plans : le duel contre la copie, sur les combattants du jeu (un test permanent), et la construction des combattants contre le laboratoire du commit d'avant (un outil qui extrait ce commit) ; les réglages qui suivent passent par un interrupteur de la copie, pour que le test permanent reste une preuve.
- Une épreuve d'équilibre doit faire porter au combat ce que la partie lui donne (l'étape du rival, l'effet de l'arme) : sinon elle mesure un autre jeu.
- Un joueur faible se diagnostique en rejouant ses combats avec une chose du joueur fort à la fois : ici l'Attaque et les niveaux, pas le kit ni les règles.
- Après un entrechoc, un recul commun remet les deux combattants en phase : à charges égales, ils s'entrechoquent sans fin. Un tirage propre à chacun les décale (le prototype : 6,4 entrechocs par minute contre 1,1).
- Un réglage décidé pour un effet mesuré seul (les santés ×0,9 de l'entrechoc, pour les durées) se remesure avec les autres réglages de la même fiche : ensemble, avec la course recalée, la poule a raccourci de 31 s.
- Un effet d'équipement écrit en valeur absolue sur une règle (le gambison : un coup gardé ×1) change de sens quand la règle change (×0,5) : l'écrire relatif à la règle, ou le revoir avec elle.

