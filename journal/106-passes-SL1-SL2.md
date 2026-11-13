# Journal de bord — archive : passes SL1, CO4, SL2 (2026-11-13)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-11-13 (Passe CF2) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe SL1 — Lot 1 de la seconde refonte du combat : les mêmes règles pour Ren et les rivaux dans le duel du jeu, un tirage par coup, le coup puissant de base, la cadence ×0,6 ; l'automatique revu, l'équilibre au test de AC-12, la course recalée ; la fiche du lot publiée (2026-11-13)

### Demande
- L'opérateur, sur la carte proposée en Passe SY2, mot pour mot : « Do this task here: “Combat SY, lot 1 : les règles communes” ». Le lot 1 de `briefs/combat-auto.md` § 26.2 : les six changements de SY-01, le coup puissant de SY-02 (A3), la cadence ×0,6 de SY-03, le tirage par coup de SY-04 ; l'automatique revu pour les deux critères de SY-07 ; l'équilibre au test de AC-12 (SY-06) ; la course recalée à +10 % par tour (SY-05, A3) sur parties entières. Hors du lot : la tactique, la main et la sauvegarde (lot 2), le tutoriel et le guide (lot 3), le retrait de l'ancien duel (lot 4).
- Branche `claude/combat-sym-lot1` (le worktree `combat-sym-lot1`, tirée de `main` `d8b7a9f`), annoncée à l'audit final. Serveur `sl-dev` (port 5441). Étapes poussées sans fusion : `532af5d`, `430a886`, `8f00425`, `147f749`.

### Les règles communes — [OK]
- `src/combat/auto.ts` réécrit : la même boucle pour tous ; `AutoFighter` sans `combo`, `ai`, traits ; un coup puissant de base (`heavy`) ; un tirage par coup (`autoDraw` : la graine, le frappeur, le rang de son action, le rang du coup, le but ; l'initiative par le côté ; un choix par le côté et son rang) ; un seul automatique (`autoDecider` = `autoSkillChoice`, puis `heavyWhen`, puis l'attaque simple), `DECIDERS.player === DECIDERS.rival`.
- `src/combat/autoData.ts` : `AUTO_CADENCE.all` 0,6 sur toutes les charges, puissances et jauges (les recharges avec les charges, la durée des effets gardée) ; `autoHeavy` (le coup puissant du catalogue, sans PA, sa recharge de DB5-3), Ren à son niveau de coup puissant (l'exercice du sable), jamais parmi les quatre (`autoOrderOf`) ; les rivaux : leur combo devenu leur arme (`AUTO_FOES.weapon`, ses coups au total de l'épée d'entraînement), Vivacité 10 pour leurs tables, leurs compétences à 2 PA avec DB5-3, la puissance par la charge, leur ordre (protections, soutiens, offensives de la plus forte) ; plus de traits ni d'IA à poids. `autoMatch.ts` : la garde et l'esquive par les seules stats.
- L'arène (`autoView.ts`, `AutoHud.ts`, `ArenaApp.ts`) et les textes (anglais et français) : le coup puissant hors des quatre cases, plus de ligne « combo » du rival, les phrases du guide et du tutoriel sur les mêmes règles ; l'élan d'un coup borné au temps libre devant lui (`free`), jamais dans l'étourdissement de son frappeur (un élan commençait dans l'étourdissement quand une charge mise en pause repartait moins de 0,04 s après).
- **Identité avec le modèle de l'atelier** : le duel du jeu, avant l'automatique revu, rend le modèle mesuré en Passe SY1 (cadence ×0,6, coup puissant rechargé, copie de `tools/auto-sym/` sur le jeu d'avant) : **168 combattants sur 168 et 168 duels sur 168 identiques, événement par événement**. `tests/combat-auto.test.mjs` réécrit (20 tests) : le portage contre `tools/auto-sym/sim.mjs`, chaque règle contre un oracle écrit des décisions ; `tests/auto-prototype.json` (le prototype de la première refonte) retiré.

### L'automatique (SY-07) — [?] le premier critère à demi, le second non
- Mesuré (`tools/auto-lab.mjs modes`, 200 parties de la référence, course d'avant le recalage) avec l'automatique de l'atelier : l'automatique 36 % ; les soutiens dès qu'ils sont prêts 90 % ; des appuis au hasard 64 à 65 % (69 % sur les seuls soutiens) ; aux signaux 54 à 79 % ; les protections dès que prêtes 38 % ; les soutiens jamais 25 %. **Le soutien gardé jusqu'à ce qu'une offensive puisse suivre était sous les appuis au hasard.** Quatre automatiques candidats joués par tous (le jeu, « la plus forte à la rupture », « aux signaux », « les soutiens dès que prêts ») : seul le dernier n'avait aucune façon de décider au-dessus de lui. Retenu : **un soutien dès qu'il est prêt** (un à la fois), les protections et les offensives comme avant (`autoSkillChoice`).
- Après l'équilibre et le recalage (les mêmes 200 parties, graines 101 à 300) : l'automatique 22 % de titres ; « la plus forte gardée pour la rupture » 29 %, « pour finir » 28 % ; aux signaux 0, 0 et 11 % ; les protections dès que prêtes 2 % ; les soutiens jamais 0 % ; des appuis au hasard 5 à 12 %. Le premier critère tient contre les appuis au hasard et les mauvais choix, pas contre les deux tactiques qui gardent la plus forte ; le second ne tient pas.
- La cause, sur 60 duels isolés du jour 4 (le kit t1, t4, d1, s1) : l'automatique lance l'Estoc (t4), cher et faible depuis l'équilibre, quand la Taille éclair (t1) recharge (t4 24 fois, t1 406) ; « à PA pleins, la première » des tactiques aux signaux lance t4 183 fois et t1 166 ; « la plus forte à la rupture » ne lance presque jamais t4 (3 fois).
- « La plus forte à la rupture » comme automatique de tous (les rivaux compris, la course non recalée pour lui) : 41 % de titres pour la référence ; aucune façon de décider mesurée au-dessus (pour finir 39 %, les soutiens dès que prêts 36 %, aux signaux 0, 3 et 36 %, les protections dès que prêtes 19 %, des appuis au hasard 15 à 34 %) : le premier critère tiendrait, pas le second ; sur la fiche (SL1-3).
- **Pensée** : un automatique jugé avant l'équilibre ne l'est plus après ; les deux se règlent ensemble, et la tactique du lot 2 changera encore la donne.

### L'équilibre (SY-06, AC-12) — [?] tenu en poule, pas au tableau ni en finale
- `tools/auto-balance.mjs` : une recherche par coordonnées sur les seules données des compétences et des armes, chaque rival à son niveau (le kit de départ à 85 / 65 / 50 % contre lui), graines de calage 1 à 40, le test de AC-12 (deux bonnes réponses par rival à 10 points de la meilleure, aucun kit à 3 points du meilleur contre tous, chaque arme la meilleure contre trois rivaux). Retenu : l'épée d'entraînement 2 × 0,85 (0,55), la lame importée 2 × 0,70 (0,62), le sabre du duelliste 3 × 0,17 (0,23) ; Tourbillon (t3) ×1,8 de puissance, Estoc (t4) ×0,8 ; Fracas ×2 à la jauge ; Cri de guerre ×1,9 aux dégâts (2,3). Une seconde passe (avec les PA et les durées des effets) n'a rien trouvé de mieux au premier tour ; arrêtée.
- Sur 60 graines tenues à part : la poule tenue (deux ou trois bonnes réponses par rival, rien ne domine) ; le tableau non (Cassius et Marek une seule, le défensif) ; la finale non (Vessa une seule, la feinte ; les kits offensifs sous 30 % contre six rivaux sur sept). Les armes, en poule : la lame la meilleure contre six rivaux, le sabre contre trois, l'épée contre un.

### La course (SY-05, A3) — [?] le dernier tour de poule sous sa visée
- Recalée sur ces règles (`tools/auto-lab.mjs level`) : chaque rival à son facteur de poule (la référence du jour 2 le bat 95 % du temps, 60 duels isolés), la poule à +10 % par tour (A3), le tableau et la finale sur parties entières (graines 1 à 80). `AUTO_RACE` : Vessa 1,487, Tobin 1,815, Cassius 1,54, Orla 1,004, Ilse 1,425, Marek 1,206, Rhosk 1,647 ; la poule 1 / 1,1 / 1,2 ; le tableau ×1,249, la finale ×1,561.
- 200 parties tenues à part (101 à 300) : la référence 22 % de titres, 97 / 80 / 59 en poule, la demi 62 %, la 3e place 86 %, la finale 41 % (104 finales) ; le planificateur 20 % ; le curieux 8 % ; le diligent et l'oisif 0 %. Durées médianes de la référence : poule 177 s, tableau 287 s, finale 334 s (DB5 : 2 à 5 min, plus de 5 exceptionnellement).
- À +10 %, le dernier tour de poule manque la visée de AC-15 de seize points (59 contre 75). Deux pentes mesurées à côté, le tableau et la finale recalés pour chacune : **+7,5 %** (×1,232 / ×1,576) 97 / 85 / 80, demi 68 %, finale 45 %, 29 % de titres, le planificateur 28 %, le curieux 11 % ; **+5 %** 97 / 91 / 95, demi 66 %, finale 45 %, 29 %. +7,5 % tient chaque visée à cinq points près : sur la fiche (décision A3 de l'opérateur).
- `tools/auto-lab.mjs` : une partie dont la politique choisit une action refusée est écartée et comptée, au lieu d'arrêter toute la mesure (le curieux, une fois).

### Le rythme — [OK]
- La référence du jour 4 contre les sept rivaux (140 duels) : 236 s médianes (Orla 170, Rhosk 330), 118 coups par minute, 0,32 s entre deux coups, le plus long silence médian 4,7 s (au plus 5,3), 11,3 % du temps en silences de plus de 3 s (10,5 % au lot 2), 3,7 s entre deux grosses actions. Le jour 10 : 314 s (Rhosk 435), 10,0 % en silences de plus de 3 s.

### Ce qui a suivi les nouvelles règles hors du duel — [OK]
- Les états nommés du sable de Rhosk (`v2-sand-day9`, `v2-sand-training`) : la graine 6 de nouveau (Rhosk hors du titre, son plan dit la veille ; la graine 11 ne le donnait plus) ; les graines du joueur curieux qui le dénonce relues (le signe sur 4, 11 et 12).
- Les blessures d'une partie (`tests/v2-injury.test.mjs`, graines 1 à 50) : le joueur préparé du laboratoire et l'oisif 0,56 chacun (1,52 et 1,4 avant), 44,6 % des combats gagnés, la qualification 78 % ; la référence 0,32 : moins souvent que l'oisif, plus « moins de la moitié » (chaque rival a son coup puissant sous la même règle que Ren) ; l'assertion dit « moins souvent ».
- `tools/play-flow.mjs` : une partie qui ne fait qu'attendre gagne le jour 2 avec la graine 1842 et perd avec la graine 1 (l'inverse avant) ; le commentaire de l'outil et `AGENTS.md` le disent.
- La relecture de l'arène : l'animation de l'étourdissement ne commence jamais sous 0 (une ligne est jouée jusqu'à 1e-9 s avant que l'horloge l'atteigne ; l'image −1 de « recover » manquait chez Tobin et Ilse dans `auto-arena-proof`).
- Les tests des pages, du son, de l'arène et du tutoriel suivent la cadence et le coup puissant hors des quatre (`ui-pages`, `duel-stats`, `auto-arena`, `auto-sound`, `tutorial`, `v2-scenes` : la ligne de la barde à l'épilogue selon qui ouvre le cortège).

### Les preuves — [OK]
- `npm run typecheck`, `npm test` (653 sur 653), `npm run build`, `npm run art:validate` (73 manifestes, 123 sources, 23 manifestes du son, 0 erreur).
- Dans le navigateur, sur les données finales (`BASE_URL=http://127.0.0.1:5441/`) : `tools/auto-arena-proof.mjs` pour les sept rivaux (chaque pas dessiné en images cuites, les onze moments, la fin du duel celle de Node, ×2, « Passer », la fiche de match et son ordre, l'empreinte rejouée) ; `tools/gauge-proof.mjs` ; `tools/tutorial-proof.mjs` ; `tools/audio/hooks-proof.mjs` ; `tools/play-flow.mjs` (gagné 1842, perdu 1) ; `tools/challenge-flow.mjs` (défi gagné, représailles gagnées) ; `tools/rivals-flow.mjs sand`.

### La fiche du lot
- https://claude.ai/artifact/5HR1Eqhsr3ZKoN81hfWwLb (`briefs/fiche-combat-sym-lot1.html`), huit cartes : SL1-1 la pente de la poule (A3, +7,5 % recommandé), SL1-2 la durée de la finale (bien ainsi), SL1-3 l'automatique et les deux tactiques qui le dépassent, SL1-4 les tactiques aux signaux (au lot 2), SL1-5 l'équilibre au tableau et en finale (au lot 2), SL1-6 la charge du coup puissant de Ren au premier palier du son, SL1-7 une sauvegarde qui emportait le coup puissant, SL1-8 la réception et la suite. Vérification : `ArtifactData list decisions` vide à la publication.

### Pensée
- Le lot tient sa règle de fond (les mêmes règles pour tous, prouvées identiques au modèle mesuré) ; ses réglages (l'automatique, l'équilibre, la pente) se répondent : chacun change ce que valent les autres, et la tactique du lot 2 les changera encore. D'où la fiche plutôt qu'une boucle de recalages.
- Un nombre épinglé dans un test (les blessures, les graines d'un scénario) est la mesure d'un jour : le changer avec sa ligne d'histoire, jamais l'ajuster pour qu'il passe.

## Passe CO4 — Le garde de la porte du parvis : un seul, dans la seconde variante approuvée de la feuille des gardes (2026-11-13)

### Ce que l'opérateur a dit
- La carte CO-2 de la fiche de cohérence (« La feuille d’un garde approuvé ») reposait sur un contexte faux (Passe CO3) : les deux gardes de la porte portaient déjà la feuille approuvée `guard-x2-v1`, l'un dans les couleurs de Hale (l'original), l'autre dans celles de Wynn (la variante 1), quand Hale et Wynn se tiennent sur le quai.
- La question reposée : « Le parvis garde-t-il un seul garde, aux couleurs de la 3e variante approuvée ? ». Sa réponse, le 13/11, mot pour mot : « A single guard ».

### Ce qui a été fait — [OK]
- `src/simulation/v2places.ts` : la porte du parvis garde un seul garde, avec Wynn ou sans lui.
- `src/world/PlazaApp.ts` : ce garde porte la seconde variante approuvée de la feuille des gardes (`GATE_VARIANT`, cheveux châtains et peau foncée, `art-lab/characters/variants/variants.json`), qu'aucun des deux gardes du quai ne porte ; aucune image nouvelle, aucun fichier de variantes changé.
- Préparé pendant que l'atelier du combat tenait la seule branche ouverte (lot 1, Passe SL1) ; la branche `claude/coherence-co4` ouverte après sa fusion, sur `7227a97`. SL1 ne touche aucun des deux fichiers.

### Validation
- `npm test` : **653 / 653** sur la base de SL1 (`7227a97`), les tests des places compris.
- Dans la page (serveur de la branche, port 5431, `?play=1&state=v2-forecourt-morning`) : un seul garde à la porte (`guardA`, la feuille `guard-x2-v1`), sa variante `[1, 8]` (la seconde de la feuille) ; le second garde (`guardB`) n'y est plus.
- `npm run build` (typecheck compris) ; `npm run art:validate` : 73 manifestes, 123 sources, 23 du son, 0 erreur.
- Pas d'archivage : avec CO4, 59,5 Ko de passes restent, sous les 60 Ko ; la prochaine archive reste `journal/102-…`.

### Pensée
- Quand une option choisie sur une fiche ne veut plus rien dire parce que la carte décrivait mal l'état des choses, on repose la question avec le bon contexte avant d'appliquer quoi que ce soit.

## Passe SL2 — La fiche du lot 1 de la seconde refonte relue : sept choix sur huit à la recommandation ; la poule à +7,5 % par tour (A3) ; la durée raccourcie et le rythme moins vif, par la note de l'opérateur (A3) ; le lot 2 ensuite, la durée et le rythme d'abord (2026-11-13)

### Ce que l'opérateur a dit
- Le 13/11, dans la conversation, mot pour mot : « fiche remplie mais je repete encore : selon ce que tu evoques il faut que tu baises la duree : Les durées médianes de la référence : la poule environ 2min, le tableau 2-4min , la finale 3-4min max. et Le rythme vif : 118 coups par minute, est trop intense c'est a peine si nous pouvons apprecier le combat et faire une action,... apres tout on doit rester attentif a ce qui se passe et voir cela comme une scene de theatre ».
- `ArtifactData list decisions` sur https://claude.ai/artifact/5HR1Eqhsr3ZKoN81hfWwLb (`briefs/fiche-combat-sym-lot1.html`) : huit documents, cliqués le 13/11/2026 entre 04:21:27 et 05:08:49 UTC. Une note, sur SL1-2 : les mêmes mots que le message, de « selon ce que tu evoques » à « une scene de theatre ». Les choix, mot pour mot :

| Carte | Sujet | Choix |
|---|---|---|
| SL1-1 | La pente de la poule | « +7,5 % par tour (décision A3 : change SY-05) » |
| SL1-2 | La durée de la finale | « La raccourcir (les rivaux de finale, la course recalée) » (pas la recommandation ; avec la note) |
| SL1-3 | Deux tactiques simples dépassent l'automatique | « L’automatique garde la plus forte pour la rupture (au lot 2, la course recalée) » |
| SL1-4 | Les tactiques aux signaux | « Le reprendre au lot 2, avant mon essai » |
| SL1-5 | L'équilibre au tableau et en finale | « Le reprendre au lot 2, avec la tactique » |
| SL1-6 | La charge du coup puissant de Ren | « Sa charge au premier palier (au lot 2) » |
| SL1-7 | Une sauvegarde qui emportait le coup puissant | « La suivante possédée prend la place (au lot 2) » |
| SL1-8 | La réception du lot 1 | « Reçu ; le lot 2 ensuite » |

### Les décisions A3, citées et datées (13/11/2026)
- **SL1-1** : la poule à **+7,5 % par tour** au lieu de +10 % (change SY-05, qui changeait LC1-1) ; le reste d'AC-16 gardé, ses facteurs du tableau et de la finale recalés sur cette pente (mesurés en Passe SL1 à ×1,232 et ×1,576 pour l'automatique du lot 1 ; à recaler au lot 2 sur les règles qu'il fixe).
- **SL1-2 et sa note** : les **durées médianes de la référence** (AC-14) : **la poule environ 2 min, le tableau 2 à 4 min, la finale 3 à 4 min au plus**. Elles précisent DB5 (« je veux qu'un combat basique dure en 2 et 5 min. +5 min peut etre exceptionnellement des combats epiques », A3) : la finale, une fois par partie, ne passe plus 4 min. Mesurées en Passe SL1 : 2 min 57 s, 4 min 47 s, 5 min 34 s (§ 27.5).
- **Le rythme**, par la même note : 118 coups par minute (0,32 s entre deux coups, § 27.6) est trop vif ; le duel se regarde « comme une scene de theatre », assez lent pour suivre chaque coup et pour agir (la main du lot 2). La note ne donne pas de nombre : le lot 2 en mesure des candidats et les soumet à l'opérateur avant de recaler la course. Ce rythme revient sur la cadence ×0,6 de SY-03 (« ×0,6 pour tous », qui n'est pas une A3).

### Ce que cela demande — [?] au lot 2
- Plus court et plus lent à la fois, c'est beaucoup moins de coups par duel : à la poule, 2 min 57 s à 118 coups par minute font environ 350 coups ; 2 min à 40 coups par minute en feraient 80. Chaque coup doit peser plus (la santé ou la puissance), et ce qui se compte en secondes doit suivre la cadence : la jauge et sa décroissance, les PA, les recharges (DB5-3, 5 × la charge, A3, gardée), la rupture (DB5-4, « 10 s, ×2, jauge de 70 », A3, gardée sauf décision de l'opérateur).
- La course se recale une seule fois, sur ces règles et l'automatique de SL1-3 : la poule à +7,5 %, le tableau et la finale visés par AC-15.

### Ce qui a été fait — [OK]
- Rien du jeu n'est changé. Les choix consignés ici, dans `briefs/combat-auto.md` (§ 28 : ce qui s'applique au lot 2), dans `AGENTS.md` (la phrase du second atelier) et dans l'entrée 00 de « À reprendre ».
- Le lot 2 part dans sa séance (§ 26.2), la durée et le rythme d'abord, puis l'automatique de SL1-3, la course, la tactique, la main et la sauvegarde ; l'essai de l'opérateur le suit (SY-14, SL1-8).

### Validation
- Aucun code changé : seulement `JOURNAL.md`, `journal/102-passes-CO1.md`, `briefs/combat-auto.md` (§ 28) et `AGENTS.md`. `npm test` passé tel quel sur la branche (rien n'y est lu de ces documents hors des fiches).
- Archivage : avec CO4 les passes gardées étaient à 59,5 Ko, SL2 les faisait passer 60 ; CO1 (branche fusionnée) déplacée seule, à l'octet, dans `journal/102-passes-CO1.md`, sa ligne ajoutée à l'index et la phrase d'en-tête complétée ; preuve par script : le corps de l'archive égale les 11 257 octets retirés, chaque passe dans un seul fichier, le reste du journal inchangé hors de l'index, des deux phrases d'en-tête et de l'entrée 00, CRLF partout ; 53,9 Ko de passes restent.

### Pensée
- Une note peut changer une carte plus que son bouton : SL1-2 demandait la finale seule, la note fixe les trois durées et le rythme. On consigne la note mot pour mot comme la décision, et l'on n'en tire un nombre qu'elle ne donne pas (le rythme) qu'en le soumettant à l'opérateur.

