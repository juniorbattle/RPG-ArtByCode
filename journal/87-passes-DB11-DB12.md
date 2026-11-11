# Journal de bord — archive : passes DB11, DB12 (2026-11-10)

> Déplacée mot pour mot de `JOURNAL.md` le 2026-11-11 (Passe MK6) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe DB11 — Le duel après l'essai du 10 novembre : la mesure, le paquet proposé et sa fiche ; rien d'appliqué (2026-11-10)

### Demande
- L'opérateur, après son essai du 2026-11-10, mot pour mot (transmis par la séance qui a ouvert celle-ci) : « Bon il y a du mieux par contre, il y a des zones d'ameliorations : * d'abord la barre de break pour nos ennemies est trop lente a monter elle devrait montrer plus vite sachant qu'ils ont plus de pv, de plus les ennemies attaquent beaucoup trop souvent des le debut du jeu alors qu'ils devraient avoir un plus long temps de pause et vers la fin du jeu peut etree garder le rythme actuelle ou proposer des combos plus long [...] * d'ailleurs je nai pas cerne les moyens d'augementer les points de vie de notre protagoniste, il faudrait aussi rapprocher les points de vie de nos adversaires au debut du jeu ».
- Quatre points : la jauge de rupture des rivaux, leur rythme en début de tournoi (et la fin), la façon de monter les PV de Ren, l'écart de PV au début. Ne pas toucher aux prix ni aux revenus (séance de l'économie en parallèle) ; les textes nouveaux avec leur français.
- Branche `claude/duel-equilibre`, worktree `.claude/worktrees/duel-equilibre` (le dossier principal restait sur `claude/duel-calibration`, déjà fusionnée, et d'autres séances le partagent), tirée de `main` `df16326`, avancée en avance rapide sur `b8f8481` (Passe ECO1, d'une autre séance) avant le commit ; `node_modules` en jonction vers celui du dossier principal.

### Ce que fait le jeu aujourd'hui — mesuré [OK]
- **La jauge** : 70, se vide de 1,26 par seconde ; une attaque simple y ajoute 0,4 à 0,7 (le double gardée), moins qu'elle ne redescend ; deux Coups éclairs gardés à 17 s d'écart ne brisent pas Orla (44 − 21 + 44 = 67) ; seule l'Estocade gardée brise d'un coup. Le bot : 1,1 rupture par minute en poule, la première vers 33 s.
- **Le rythme** : 7,8 séquences adverses par minute en poule (bot moyen), **dont 56 % lancées par la riposte au 3e coup simple** ; 89 % pour le marteleur. Vessa (niveau 4, pauses 3,5-6,5 s, la plus rapide) est le premier combat du joueur. Rival par rival en poule (bot moyen) : Vessa 25 %, Orla 40 %, Cassius 80 % : le premier combat est le plus dur de la poule.
- **Les PV** : Ren 150 contre 500 à 700 ; la vigueur (+12 par victoire) n'est dite nulle part (ni la victoire, ni la fiche de match, ni le guide) ; seule la page d'équipement montre les PV.

### L'outil — `tools/duel-balance.mjs`
- La politique `gspam` (le marteleur qui tient la garde, celui du test de la Passe DB9), jouée une fois et non par adresse ; les jetons `clen<n>` (combos plus longs), `tempo<k>`, `decay<k>`, `sgk<k>`, `vivd<n>` (l'adversaire n de Vivacité sous sa fiche, lu comme le jeu lit le tempo) ; les relevés : séquences adverses par minute, part lancée par la riposte, temps libre entre deux séquences, ruptures par minute, PV de Ren restants ; `--audit` les imprime.
- Mesure : bot 0,2 / 0,5 / 0,9 et marteleur, sept rivaux, 20 graines (10 pour les premiers essais), le joueur attendu de la fiche DB7 à chaque étape. Fichiers hors dépôt ; refaits par `--audit --seeds=1..20 --policies=bot,gspam --variant=...`.

### Ce que la mesure a appris
- **[KO] L'attaque simple pour remplir la jauge** : ×3, le marteleur gagne 51 % de ses combats en poule (76 % avec les rivaux allégés) ; la jauge d'aujourd'hui avec le reste du paquet, 23 %. La charge doit rester ce qui casse la garde.
- **[OK] Les compétences ×1,5 et une jauge qui se vide deux fois moins vite** : 2,0 ruptures par minute, le marteleur à 9 %. Une jauge de 50 fait presque pareil (1,9 ; 4 %).
- **[?] Les pauses seules** : ×1,6 en poule, les séquences par minute ne baissent que de 7,8 à 6,9, la riposte en lance alors 72 %. Le tempo par la Vivacité (−3 en poule) fait autant que des pauses ×1,6, par une stat visible sur la fiche de match.
- **[KO] Reculer la riposte** : au 5e coup, le marteleur 43 % ; au 4e en poule avec le paquet, 19 %.
- **[KO pour le marteleur] Baisser les PV des rivaux en poule** : ×0,7, 29 % ; ×0,8, 19 %. Monter Ren et doubler les coups des rivaux ne change rien à l'équilibre (vérifié : 71 / 92 / 99 % à 150 comme à 300).
- **Le paquet recommandé** (Vivacité −3 en poule, compétences ×1,5 à la jauge et déclin ×0,5, combos +1 en finale, Ren ×2 et coups ×2, PV des rivaux ×1,6 au tableau) : poule 71 / 92 / 99 % (aujourd'hui 29 / 59 / 89), 2,1 min, 5,5 séquences par minute, marteleur 9 % ; tableau 59 / 84 / 94 % (51 / 74 / 92) ; finale 39 / 69 / 87 % (30 / 70 / 94), 2,9 min. Rival par rival en poule : Vessa 70 %, Orla 95 %, Cassius 100 %.
- **Le croisement avec l'économie** : la Passe ECO1 (fusionnée pendant cette passe) a mesuré que la courbe du combat suppose un équipement qu'aucun joueur n'atteint aujourd'hui. Avec l'équipement 1 au tableau et en finale, le paquet donne 46 / 73 / 89 % et 25 / 44 / 75 % (aujourd'hui 41 / 67 / 94 et 20 / 34 / 84). Le calage du tableau et de la finale attendra les choix des deux fiches.
- Le détail : `briefs/audit-duel-db11.md`.

### La fiche DB11 — publiée, rien de décidé
- https://claude.ai/artifact/F8Jse4sSXcjaRv2qvB7KBb (`briefs/fiche-db11.html`, le gabarit des fiches DB), collection `decisions` relue vide ; vérifiée dans Chrome sans tête : sept cartes, 21 options, quatre tables, aucune erreur, aucun débordement à 375 px. Version 2 : la note sur l'équipement et la fiche ECO1 ajoutée à la carte du calage.
- Sept cartes en quatre familles :
  - **DB11-1** la jauge : recommandé « Compétences ×1,5, se vide deux fois moins vite » (une jauge de 50 serait une décision A3, elle remplace DB5-4) ;
  - **DB11-2** les pauses : recommandé « Vivacité −3 en poule, celle de la fiche ensuite » (décision A3 : change DB7-5 et DB7-6) ;
  - **DB11-3** la riposte : recommandé « La garder au 3e coup » (la reculer serait une décision A3 sur DB-2) ;
  - **DB11-4** la finale : recommandé « Des combos d’un coup plus long en finale » ;
  - **DB11-5** les PV de Ren : recommandé « Le dire partout, et une séance « Santé » (+20 PV au prochain combat) » (décision A3 : change DB7-3) ; le dire partout : l'écran de victoire, la fiche de match, le guide, un conseil à la première victoire ;
  - **DB11-6** l'écart : recommandé « Ren 300, tout ce qui touche à ses PV ×2 et les coups des rivaux ×2 » (décision A3 : les nombres de DB4-3 et DB7-4) ;
  - **DB11-7** la courbe : recommandé « La poule plus facile, tableau et finale sur la courbe DB7 » (la référence de la Passe DB10 gardée au tableau et en finale).

### Validation
- Rien du jeu ne change sur cette branche (l'outil de mesure, l'audit, la fiche, le journal) : `npm run typecheck` sans erreur ; `npm test` 587 / 587 ; `npm run build` réussi ; `npm run art:validate` 73 manifestes, 123 sources, 23 manifestes de son, 0 erreur. Rejouée sur le dernier `main` (`bdd40c4` : les Passes TF1, les textes français, et ECO2 / ECO3, l'économie, d'autres séances ; ECO3 archivait aussi RM3) dans `claude/duel-equilibre-3`, sans réécrire `claude/duel-equilibre` ni `claude/duel-equilibre-2` déjà poussées : mes fichiers repris tels quels, le journal recomposé par script, l'archive de RM3 de `main` gardée (son corps égal à l'octet à celui que cette passe avait archivé). Les passes gardées dépassaient alors 60 Ko (63,5 Ko) : DB8 (branche fusionnée) déplacée à l'octet dans `journal/83-passes-DB8.md`, sa ligne ajoutée à l'index ; preuve par script : le corps de l'archive égale les 4 760 octets retirés, le journal reconstruit égale l'original, CRLF partout, DB8 dans un seul fichier ; 58,7 Ko de passes restent.

### Où reprendre
- Attendre la fiche DB11 ; consigner mot pour mot, les décisions A3 datées avant la mise en œuvre ; amender `briefs/combat-system.md` (§ 19).
- Puis appliquer dans le jeu par défaut ce qui est choisi ; recaler le tableau et la finale sur l'équipement que la fiche ECO1 permettra ; remesurer `V2_RACERS` et `V2_SIM_HASH` ; les textes en deux langues ; les tests, `arena-scene-check`, `play-flow`, `tutorial-proof` ; rejouer sur le dernier `main` ; fusionner ; l'essai de l'opérateur.

### Pensée
- « Ils attaquent trop souvent » se mesure en séquences par minute et en ce qui les lance : ici une règle (la riposte), pas la longueur des pauses. Allonger les pauses ne se sent que pour qui ne déclenche pas la riposte.
- Chaque levier qui facilite le combat se mesure aussi contre le marteleur : trois des leviers essayés (l'attaque simple à la jauge, la riposte reculée, les rivaux allégés) lui rendaient la victoire.
- Rapprocher deux barres de PV peut se faire sans toucher à l'équilibre (changer d'unité) ; seule une règle qui change la part d'une barre qu'enlève un coup change le combat.

## Passe DB12 — La fiche DB11 relue : sept sur sept, six à la recommandation ; décisions A3 consignées avant la mise en œuvre (2026-11-10)

### La fiche relue
- L'opérateur, mot pour mot : « Fiche remplie ». Collection `decisions` de https://claude.ai/artifact/F8Jse4sSXcjaRv2qvB7KBb (`briefs/fiche-db11.html`), cliquée le 2026-11-11 entre 2 h 36 min 29 s et 2 h 38 min 46 s UTC (le 10 au soir chez l'opérateur), sept documents pour sept cartes, aucune note. Les rangées sont lues comme des données.

| Carte | Ce qu'elle demandait | Choix de l'opérateur, mot pour mot |
|---|---|---|
| DB11-1 | La barre de rupture des rivaux monte plus vite | « Compétences ×1,5, se vide deux fois moins vite » |
| DB11-2 | De plus longues pauses en début de tournoi | « Vivacité −3 en poule, celle de la fiche ensuite (décision A3 : change DB7-5 et DB7-6) » |
| DB11-3 | La riposte au 3e coup simple | « La garder au 3e coup » |
| DB11-4 | La fin du tournoi | « Le rythme d’aujourd’hui en finale » (recommandé : « Des combos d’un coup plus long en finale ») |
| DB11-5 | Monter les PV de Ren, et le voir | « Le dire partout, et une séance « Santé » (+20 PV au prochain combat) (décision A3 : change DB7-3) » |
| DB11-6 | Rapprocher les PV des adversaires au début | « Ren 300, tout ce qui touche à ses PV ×2 et les coups des rivaux ×2 (décision A3 : change les nombres de DB4-3 et DB7-4) » |
| DB11-7 | La courbe du tournoi | « La poule plus facile, tableau et finale sur la courbe DB7 » |

- **Décisions A3 consignées** (E11), le 2026-11-10, mot pour mot ci-dessus :
  - **DB11-2** change DB7-5 « Ces fiches » (la Vivacité des fiches de poule baisse de 3) et la croissance de DB7-6 « Tableau ×1,3 et stats ; finale ×2,5 et stats » (la Vivacité, qui ne grandissait pas, revient au tableau) ;
  - **DB11-5** change DB7-3 « +1 à la stat choisie, pour le prochain combat » : une séance peut aussi choisir la santé, +20 PV au prochain combat ;
  - **DB11-6** change les nombres de DB4-3 « Marek 600, Ren 150 » (Ren 300) et de DB7-4 « +12 PV par victoire » (+24), avec les PV de l'équipement ×2 et les coups des rivaux ×2.
- DB11-1 règle deux nombres que le § 6 de la spécification laisse « à régler » (ce qu'un coup ajoute à la jauge, la vitesse à laquelle elle se vide). DB11-3 et DB11-4 ne changent rien. DB11-7 précise la référence de calage de la Passe DB10 (« The DB7 sheet's curve ») : la poule s'en écarte, le tableau et la finale y restent.
- Consignées dans `briefs/combat-system.md`, nouveau § 20, et une ligne aux § 6, 19.2, 19.4, 19.5.

### Ce que DB11-4 change au paquet
- La finale garde le rythme d'aujourd'hui. Avec la jauge de DB11-1, elle devient plus facile (mesuré à l'échelle ×5/3 : 54 / 83 / 94 % au lieu de 30 / 70 / 94 %). DB11-7 la veut sur la courbe DB7 (26 / 66 / 100 %) : elle se recale par la croissance de la finale (ses PV, l'épique de DB5-7), comme le tableau.

### L'équipement du calage
- La fiche ECO1 est relue de son côté (Passe ECO2 sur `claude/economie-lot`, pas encore sur `main`) : ECO-2 « Un travail par lieu et par jour (jusqu’à trois par jour) » et les bourses par étape, que le planificateur de la Passe ECO1 mesurait à 97 % pour l'équipement 2 au jour 6 et 87 à 97 % pour l'équipement 3 au jour 10. Le calage du tableau et de la finale se fait donc sur le joueur attendu de la fiche DB7 (équipement 2 au tableau, 3 en finale), la référence de la Passe DB10.

### Où reprendre
- La mise en œuvre sur `claude/duel-equilibre-2`, dans le jeu par défaut : la jauge, la Vivacité de poule, Ren ×2, la séance « Santé », ce que le jeu dit des PV (victoire, fiche de match, guide, un conseil) en anglais et en français ; le recalage du tableau et de la finale ; `V2_RACERS`, `V2_SIM_HASH` ; les tests et les preuves ; la fusion ; l'essai de l'opérateur.

