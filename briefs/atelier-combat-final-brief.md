# Brief — l'atelier du système de combat final (13/11/2026, journal Passe SL4)

Pour une séance neuve. Lire d'abord `AGENTS.md`, `JOURNAL.md` (en entier ; en particulier les Passes SY1, SY2, SL1 à SL4) et `briefs/combat-auto.md` §§ 25 à 30.
Comme les ateliers CB1, AC1 et SY1 : mesurer, prototyper au laboratoire, proposer ; **rien sous `src/` avant la fiche de l'opérateur**, et aucune décision prise
par un agent. Une seule branche ouverte à la fois (règle d'`AGENTS.md`), le journal en français, en CRLF, par un script Node.

## La demande, mot pour mot (13/11/2026)
- « dans ce cas ce n'est pas bon il faut trouver la formule gagnante afin d'avoir une simulation optimale de combat qui reunit attaque simple/lourde,
  garde/esquive, competences en prenant en compte que notre heros vs affronter des ennemies de plus en plus fort et qui va devoir s'ameliorer grace a ces
  combats et surtout ces equipements ameliores, les equipements en plus des stats ameliroeres peuvent apporter des effets bonus »
- « Bref je veux vraiment que tu pousse la reflexion loin en reprenant l'ensemble du jeu et de ce quon a accompli et me proposer un protottpe finale de
  systeme de combat efficace. »
- « les pa sont-ils vraiment utiles car tu disais que cela fausses la structure. l'esquive et la garde ne devrait pas t-elle se faire sur la base des stats comme
  tu le souhaitais par contre garde -80% de degats sera a revoir »
- « sinon je suis d'accord mais je veux pousser la reflexion davantage on va partir sur un structure de combat suffisamment coherente que meme lorsque le heors
  ne combat pas, il peut parier sur les autres combattants ce qui peut etre un moyen de gagner de 'argent sussi ( concept pour plus tard, pour le moment le
  focus est sur le combat ) »
- La note de RY-3 (décision A3, Passe SL4), qui fixe l'esprit : « […] ce sont des valeurs par default puis elles pourront etre influencer selon les stats et
  competences des combattants et autres par exemple je veux une partie dans les regles mais une optimisation correcte et ressenti dans le combat avec une
  maitrise importante pour ne pas briser le jeu et donner les chances/probabilites de gagnes  fortement surtout si il est bien prepare ».

## Ce qui est décidé et tient (sauf décision contraire de l'opérateur, citée mot pour mot)
- Le duel joué par l'ordinateur sur une ligne de temps, le joueur prépare (AU-03, AC-01 à AC-20 ; § 6.1 du contrat projet amendé par SY-13).
- Les mêmes règles pour Ren et les rivaux ; les écarts de force par les stats, l'équipement, l'entraînement et la course (SY-01, SY-13).
- L'attaque simple et le coup puissant automatiques, avec la recharge de DB5-3 pour tous (SY-02, A3) ; DB5-3 « 5 × le temps de charge » (A3).
- Les trois façons de décider : l'automatique, la tactique (une condition par compétence, l'ordre gardé), la main (SY-07 à SY-10) ; ses deux critères (SY-07).
- Le rythme ×3 (environ 40 coups par minute, RY-1) et les enchaînements étirés (RY-2) ; la rupture de RY-3 (A3 : 20 à 25 coups par défaut, ×1,4 pendant 10 s,
  modulés par les stats et les compétences) ; les durées de SL1-2 (A3 : poule environ 2 min, tableau 2 à 4, finale 3 à 4 au plus).
- Les cinq stats et leurs formules (DB7-1, A3), l'équipement ×2 (AC-11, A3), la vigueur de Ren et la santé (DB11-6, A3), la course (AC-16, son principe ; la poule à
  +7,5 % par tour, SL1-1, A3), pas de riposte (AC-07, A3).
- Les paris : gardés pour plus tard (ECO-5) ; l'atelier vise seulement une structure qui les rende possibles un jour (une cote lisible des deux fiches).

## Ce que les mesures ont montré (le point de départ)
- **Les tactiques qui retiennent une compétence s'effondrent** (Passe SL3, au rythme d'avant ×3) : l'automatique 41 % de titres ; offensives retenues pour la
  rupture 0 %, pour le gros coup adverse 3 % ; soutiens retenus jusqu'à ce qu'une offensive suive 2 %, pour la rupture 0 % ; protections à la jauge 9 % ; des
  appuis au hasard 15 à 34 %. Une règle « à PA pleins » ne sauve pas un soutien retenu. **Le second critère de SY-07 ne tient pas.**
- **Les causes** : le renfort (Ferveur ×1,8 aux dégâts, ×2 à la jauge, 12 s, 2 PA) est un multiplicateur plat qu'il faut toujours lancer : un choix toujours juste n'en
  est pas un ; les PA plafonnés à 5 se perdent, attendre coûte ; les signaux sont rares (une rupture ou deux par combat) ; la course ramène chaque joueur vers des
  taux visés, la préparation pèse peu (titres : la référence 31 %, le planificateur 18 %, le curieux 21 %, le diligent et l'oisif 0 % ; Passe SL4).
- L'inventaire des écarts et le modèle des mêmes règles (Passe SY1, `briefs/combat-auto.md` § 25) ; l'équilibre AC-12 non tenu au tableau et en finale (§ 27.4) ;
  le coup d'avance montre qu'une tactique calculée bat largement l'automatique (§ 25.4).

## Ce que l'atelier doit produire
1. **Un diagnostic** de l'ensemble (le duel, la préparation, l'équipement, l'entraînement, la course, la ville qui fournit pièces et équipement) : ce qui donne de
   vrais choix et ce qui n'en donne pas.
2. **Un prototype** au laboratoire (une copie du duel avec ses mécaniques en interrupteurs, comme `tools/auto-sym/`, prouvée identique au jeu au départ), qui
   explore au moins :
   - **les PA** : les garder (rythmer les compétences) ou les retirer (les recharges seules), et une économie qui n'oblige pas à dépenser tout de suite
     (le surplus non perdu, des PA sur garde ou esquive réussie) ;
   - **la garde et l'esquive** par les stats (déjà le cas) ; la garde à −80 % revue (DB5-2) ;
   - **les compétences comme réponses** à des situations visibles : un soutien en fenêtre courte à placer, une protection qui rapporte si elle couvre un gros coup,
     des offensives qui ont chacune leur terrain (perce, casse, achève, interrompt) ;
   - **des effets d'équipement** en plus des stats (une liste courte, chacun avec sa contrepartie), équilibrés comme AC-12 ;
   - **des styles de rivaux** sous les mêmes règles, pour que la bonne préparation dépende de l'adversaire ;
   - **une progression** où la préparation pèse : un joueur bien préparé gagne nettement, un joueur moyen est à l'équilibre, un joueur négligent perd.
3. **Des critères mesurés** sur parties entières (graines de calage, puis tenues à part) : l'écart de victoires entre les politiques du laboratoire ; aucune tactique
   ni pièce qui domine ; chaque condition de la page utile quelque part ; l'automatique correct mais battu par une tactique adaptée au rival ; des appuis au hasard
   nettement en dessous ; le rythme, la rupture et les durées décidés tenus ; une cote d'avant-combat lisible des deux fiches et suivie par les combats hors écran.
4. **Une fiche d'arbitrages** (skill `fiche-arbitrages`, `{db:{}}`), avec le prototype final recommandé, ses mesures, les variantes écartées, les décisions A3 qu'il
   toucherait (citées) ; des films de l'arène si possible (`tools/duel-clip.mjs`). Puis la construction en lots, chacun dans sa séance, après sa relecture.

## Les outils
- Le duel du jeu : `src/combat/auto.ts` (`tacticChoice`, `autoGaugeHit`, `o.commands`), `autoData.ts`, `autoMatch.ts`.
- Le laboratoire : `tools/auto-lab.mjs` (`games`, `modes`, `kits --norm=rival`, `level`, `rhythm`), `tools/auto-tactics.mjs` (les tactiques de la page, les remèdes à
  PA pleins), `tools/auto-balance.mjs`, `tools/auto-sym/` (le modèle de l'atelier SY1 ; sa copie n'est plus identique au jeu depuis le lot 1 : à refaire depuis le
  jeu), `tools/duel-clip.mjs`.
- Les politiques des parties entières : `src/tournament/lab.ts` (`reference` d'AC-14, `planner`, `curious`, `diligent`, `idle`).

## L'atelier mené (13/11/2026, journal Passe CF1)
- Le laboratoire `tools/auto-final/`, ses mesures et le prototype : `briefs/combat-auto.md` § 31. La fiche : https://claude.ai/artifact/NVyUoTFKBigFFzzm1abjUz (`briefs/fiche-combat-final.html`), seize cartes, en attente de l'opérateur.
- Puis, à la demande de l'opérateur (« propose moi une solution optimale selon ta perception et sans forcement avoir mon aval »), la proposition « La Brute » (journal Passe CF2, `briefs/combat-auto.md` § 32) : sans PA, des coups d'éclat comptés par combat, la faille, un rôle par compétence, l'automatique du plan général, les styles des rivaux ; https://claude.ai/artifact/VgiYmopbSiyd2Ks8MfoHzv (`briefs/proposition-combat-brute.html`), six cartes ; elle remplace la fiche de l'atelier.
- La proposition relue le même jour, six sur six à la recommandation (journal Passe CF3, `briefs/combat-auto.md` § 33) : PB-1 « Construire ce modèle » et PB-3 « Caler sur le joueur moyen » en A3 ; le texte du § 6.1 proposé à l'opérateur ; le lot 1, le duel, lancé dans sa séance par `briefs/combat-brute-lot1-brief.md`.
