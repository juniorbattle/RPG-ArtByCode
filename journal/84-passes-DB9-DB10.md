# Journal de bord — archive : passes DB9, DB10 (2026-11-09)

> Déplacée mot pour mot de `JOURNAL.md` le 2026-11-10 (Passe DB13) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe DB9 — Les fiches DB4, DB5 et DB7 appliquées dans le jeu par défaut : les stats des combattants, les règles de DB5, deux réglages contre la garde gratuite, le recalage (2026-11-09)

### Demande
- Appliquer les décisions consignées (Passes DB5, DB6, DB8 ; spécification § 19) dans le jeu par défaut (DB-8, DB4-6), recaler, prouver, fusionner, puis l'essai de l'opérateur. Branche `claude/duel-stats`.

### Ce qui est construit — [OK]
- **Les stats** (`src/combat/stats.ts`) :
  - cinq stats ; Ren 150 / 10 / 10 / 10 / 10 ;
  - les sept fiches de DB7-5, leur Vivacité lue dans leurs kits ;
  - la croissance de DB7-6 par étape (`stageOf` : la poule, le tableau dès le jour 6, la finale) ;
  - la fiche d'un générique tirée de son rival (`borrowedSheet`) ;
  - la formule, la jauge par l'Endurance, la charge par la Vivacité ;
  - la puissance des compétences (`skillPower`), les règles de DB5.
- **Le duel** (`src/combat/v2duel.ts` `applyStats`) : les PV, chaque coup, ce qu'il ajoute à la jauge et le tempo d'un rival sortent des deux fiches.
  - Une blessure, la préparation d'un rival et le trafic de la nuit restent des parts par-dessus.
  - Les multiplicateurs `V2_FOE_HIT`, `V2_FOE_HP`, `V2_REN_HP` et `V2_SKILL_HIT` sont retirés.
  - Les rivaux gardent 90 % (leur esquive gardée) ; la garde vaut −80 % ; jauge de 70 ; rupture de 10 s ×2.
- **La recharge** (DB5-3, `DynActionDef.cooldown`, `DynamicSim.ready` / `cooldownLeft`) :
  - 5 × le temps de charge au niveau 1 sur chaque compétence que le joueur peut emporter (l'attaque puissante comprise, l'attaque simple jamais) ;
  - partie du coup lancé, rendue quand une séquence adverse annule la compétence (CB-3) ;
  - la charge ne l'ouvre pas, le bot non plus ;
  - le HUD en montre les secondes dans la bande des paliers (« 13 s »), le palier grisé.
  - Le duel de C2 et le jeu d'aujourd'hui (`v2=0`) n'en ont pas.
- **L'état** :
  - l'équipement en points (`GearFx` : chaque objet selon le tableau de la proposition) ;
  - `v2Stats` (Ren pour son prochain combat) ;
  - `V2State.wins` (la vigueur, +1 par combat du tournoi ou défi gagné) ;
  - `V2State.prep` (la stat choisie à chaque séance, vidée après le combat ; une séance d'avant compte en Attaque) ;
  - l'entraînement et l'exercice avec Orla offrent une ligne par stat (Attaque, Défense, Endurance, Vivacité), leur journal dit la stat.
- **Les pages** (DB7-7) :
  - la page d'équipement montre les PV, l'Attaque, la Défense, l'Endurance, la Vivacité, les PA et les effets, avant et après un achat ;
  - la fiche de match montre les stats de l'adversaire à l'étape du combat ;
  - la page des compétences montre la puissance niveau par niveau, et les dégâts contre l'adversaire du prochain combat ;
  - textes en anglais et en français : `stat.*`, `v2.train.*`, `v2.spar.stat`, `v2.sheet.stats`, `ui.skill.power`, les lignes de l'équipement, le chapitre « prepare » du guide.
- **L'outil** : `tools/duel-balance.mjs` joue les stats du jeu (les jetons `rs`, `stage`, `rhp`, `rviv`, `vhp`…, `lgk<k>`, `gshare<k>`) ; la table du prototype retirée.

### La garde gratuite — [KO] trouvée, corrigée par deux nombres « à régler »
- Un marteleur qui tient la garde pendant chaque séquence adverse et ne fait que l'attaque simple (le test `duel-db3`, contre Orla) gagnait.
  - Mesure sur les sept rivaux, dix combats chacun : Tobin, Cassius, Rhosk et Orla 100 %, Ilse 30 %, Vessa 40 %, Marek 10 %.
  - La garde à −80 % (DB5-2) et les coups légers des rivaux rendaient la garde gratuite ; ses attaques simples gardées remplissaient la jauge des rivaux.
- Sans aucune rupture, il gagnait encore (les attaques simples à travers la garde des rivaux suffisaient en 3 à 4 min).
- Essais :

| Réglage | Résultat |
|---|---|
| jauge de l'attaque simple ×0,5 ou ×0,25 seule | il gagne encore partout |
| un coup gardé ×2 ou ×3 à la jauge du gardien, seul | il gagne encore (ses attaques gardées brisent aussi les rivaux) |
| les deux : ×2 et attaque simple ×0,25 | Tobin 70 %, Cassius et Rhosk 20 %, les autres 0 % ; le bot 31 / 73 / 91 % |
| les deux : ×2,5 | il ne gagne plus, mais le joueur faible monte à 40 % |

- **Retenu** : l'attaque simple 0,5 (2 depuis DB-5 : « Jauge par les compétences ») et un coup gardé ×2 à la jauge du gardien, une règle pour les deux. Ce sont deux nombres que le § 6 laisse « à régler ».
- Consignés (§ 19.6), ils sont à juger à l'essai.

### Le recalage — [OK] six sur dix sur des parties entières
- Les coups des rivaux ×0,72 des puissances de la fiche :
  - le joueur préparé du TournamentLab à 60,0 % de ses combats (graines 1..50) ;
  - ×0,78 donnait 60,8 % avant les deux réglages, 55,2 % après.
- `V2_RACERS` remesuré (référence : Ren au départ, PV sans limite) : graines de calibrage 1..80, contrôle 81..120 à moins de 10 %, sauf la mise à terre de Vessa (13 %, son esquive) ; le test rejoue 81..120 (15 % / 12 %).
- **Ce que le recalage fait à la courbe** (bot 0,2 / 0,5 / 0,9 ; 10 graines par rival) :

  | Étape | État du joueur | Faible / moyen / fort | Durée (moyen) | Sur la fiche DB7 (avant recalage) |
  |---|---|---|---|---|
  | Poule | attendu : équipement 1, niveau 1 | 50 / 84 / 97 % | 2,3 min [1,6-2,9] | 17 / 64 / 99 % |
  | Poule | en retard : rien, niveau 1 | 41 / 76 / 96 % | 2,3 min | 17 / 56 / 99 % |
  | Poule | en avance : équipement 3, niveau 3, 170 PV | 96 / 100 / 100 % | 1,3 min | 79 / 100 / 100 % |
  | Tableau | attendu : équipement 2, niveau 3, 185 PV | 74 / 90 / 97 % | 2,2 min | 39 / 79 / 97 % |
  | Tableau | en retard : rien, niveau 1, 170 PV | 19 / 47 / 79 % | 3,1 min | 4 / 20 / 84 % |
  | Tableau | en avance : équipement 3, niveau 5, 200 PV | 96 / 100 / 100 % | 1,3 min | 89 / 99 / 100 % |
  | Finale | attendu : équipement 3, niveau 3, 220 PV | 59 / 89 / 97 % (Marek 60 %, 4,5 min) | 3,5 min [2,3-4,5] | 26 / 66 / 100 % (Marek 20 %) |
  | Finale | en retard : équipement 1, niveau 1, 185 PV | 13 / 24 / 70 % (Marek 0 %) | 4,3 min [2,6-5,7] | 0 / 11 / 54 % |
  | Finale | en avance : niveau 5, 235 PV | 94 / 100 / 100 % | 2,3 min | 63 / 90 / 100 % |

  - Le marteleur : 0 % partout, 9 % en poule tout équipé au niveau 3.
  - Le TournamentLab, parties entières, graines 1..50 :
    - le joueur préparé 59,6 % de ses combats, le tableau 92 %, jamais couronné ;
    - le curieux (défis, vols, marchandages) 70,8 %, finaliste 46 %, couronné 4 %, 6,6 défis gagnés par partie.

- **La lecture** :
  - Le joueur du laboratoire n'exerce jamais ses compétences (constat de la Passe DB5) : il aborde le tableau et la finale au niveau 1. Recaler sur lui affaiblit les rivaux, et la poule devient facile pour le joueur attendu de la fiche DB7.
  - Au niveau 1, la finale contre Marek ne se gagne pas, même à 0,9 (0 %, 5,5 min) ; au niveau 3 avec un équipement moyen, le joueur à 0,6 bat Marek sept fois sur dix en 4,3 min.
  - Les niveaux des compétences décident la finale.
  - [?] Recaler sur la courbe attendue de la fiche (coups ×1 : poule 64 %, faible 17 %) ou garder les six sur dix du laboratoire : à l'opérateur.

### Les états nommés et les outils
- `v2-famous-training` :
  - Orla n'y était plus une amie : avec la nouvelle course, elle ne rencontre plus le joueur en demi-finale, et c'est sa deuxième défaite contre lui qui la faisait amie ;
  - le script s'ouvre maintenant par un exercice avec Orla le premier matin (la description le dit).
  - Les autres états passent leurs tests.
- `V2_SIM_HASH` : le script parcourt encore chaque chemin de V2-2 ; l'outil d'arène le rejoue à l'identique dans la page.

### Validation
- `npm run typecheck` ; `npm test` : 586 / 586 (587 / 587 après la fusion de la Passe RM3), dont `tests/duel-stats.test.mjs` (10 tests : les fiches, la formule, la croissance, un duel tiré des deux fiches, le tempo, les règles de DB5, la recharge et son remboursement, la charge et le HUD, les points de l'équipement, la séance, la vigueur, le défi, les génériques, les pages, le marteleur qui garde perdant).
- Tests mis à jour (leurs nombres viennent des décisions) : `combat-charge`, `duel-db3`, `tutorial`, `v2-gear`, `v2-skills`, `v2-injury`, `wares`, `ui-pages`.
- `npm run build` réussi ; `npm run art:validate` 73 manifestes, 123 sources, 23 manifestes de son, 0 erreur.
- **Navigateur** (serveur `dev-strict`) :
  - `arena-scene-check` (`v2=1`) PASS : l'empreinte rejouée dans la page égale `V2_SIM_HASH`, aucune erreur, les marques du sol dégagées sur 77 tailles ;
  - la bande des paliers en recharge capturée (`arena-scene-shots`, « Éclair 13 s », « Estocade 32 s ») ;
  - `ui-text` : la page d'équipement, la fiche de match et les compétences en anglais et en français, et l'arène, au-dessus des tailles minimales ; `ui-contrast` : 7,4:1 au plus bas ;
  - `play-flow win` : le combat d'une partie, le rejeu en Node à la même empreinte ;
  - `town-flow hails` : Orla qui lève la main, tout passe.
- [?] Deux défauts relevés, présents sans ce travail :
  - la fiche de match coupe ses boutons du pied sur un téléphone de 568 × 320, avec ou sans la nouvelle ligne de stats ;
  - `play-day` et `town-flow` lisent la page juste après une touche : sous charge, une course les fait échouer à des étapes différentes d'un passage à l'autre. Sur `main` (`b1b889b`, un worktree temporaire), `town-flow hails` échouait aussi au rejeu ; sur la branche, un passage entier a réussi.
- `play-day` vérifiait « Heavy blow » dans la comparaison de la pierre à aiguiser : c'est l'Attaque depuis cette passe (corrigé).
- Les passes gardées dépassaient 60 Ko (69,8 Ko, après la fusion de la Passe RM3, qui avait déjà déplacé RG4) : RM1 et DB5 (branches fusionnées) déplacées à l'octet dans `journal/79-passes-RM1-DB5.md`, leur ligne à l'index ; preuve par script : le corps de l'archive égale les octets retirés, le journal reconstruit égale l'original, CRLF partout.

### Où reprendre
- L'essai en jeu de l'opérateur :
  - le combat (la recharge, la rupture, la garde), les stats sur les pages, la séance au choix, la vigueur ;
  - la question du recalage (le laboratoire ou la courbe de la fiche).
- Les « défis particuliers » épiques de DB5-7 restent à définir avec lui.
- Ensuite : la fiche de match sur un petit téléphone, la robustesse de `play-day` / `town-flow`.

### Pensée
- Une règle mesurée contre le bot du jeu ne voit pas le joueur qui exploite : il faut mesurer aussi le joueur parfait d'une seule tactique (tenir la garde, marteler).
- Avec des stats, les dégâts dépendent de l'adversaire : une page qui montre les dégâts d'une compétence doit dire contre qui (le prochain combat).
- Recaler sur un joueur de laboratoire qui ignore une couche de progression (les niveaux) affaiblit tout le monde pour lui ; la référence de calibrage doit jouer le jeu comme la fiche le suppose.
- Un état nommé qui promet un fait (Orla une amie) doit le créer par son script, pas l'attendre d'un tirage que la course peut changer.

## Passe DB10 — Le recalage sur la courbe de la fiche DB7 : la réponse de l'opérateur appliquée (2026-11-09)

### La décision, mot pour mot
- La question posée à la fin de la Passe DB9 : « Which reference should six bouts in ten be measured on? ». Le recalage de DB9 sur le joueur préparé du TournamentLab, qui n'exerce jamais ses compétences, rendait la poule facile : le joueur attendu y gagnait 84 % et le joueur faible 50 %.
- La réponse de l'opérateur, le 2026-11-09 : « The DB7 sheet's curve ».
- Elle précise DB4-5 « Recaler pour garder six sur dix » : la référence est le joueur attendu de la fiche DB7, avec l'équipement et les niveaux de compétence que les règles lui donnent. Ce n'est plus le joueur du laboratoire.
- Branche `claude/duel-calibration`.

### Ce qui change — [OK]
- **Les coups des rivaux** : à la force de la fiche DB7, 5,6 / 16,8 / 25,2 (4, 11 et 17 % des 150 PV de Ren à stats égales ; ×0,72 en DB9).
- **Trois forces mesurées**, avec les réglages de DB9 (bot 0,2 / 0,5 / 0,9, dix graines par rival, le joueur attendu) :

| Force des coups | Poule (niveau 1, équipement 1) | Tableau (niveau 3, équipement 2, 185 PV) | Finale (niveau 3, tout équipé, 220 PV) |
|---|---|---|---|
| ×0,9 | 30 / 71 / 94 % | 56 / 81 / 96 % | 36 / 74 / 94 % |
| **×1 (retenu)** | **24 / 61 / 90 %**, 2,0 min | **47 / 74 / 94 %**, 2,1 min | **29 / 70 / 94 %**, 3,2 min |
| ×1,1 | 21 / 54 / 86 % | 46 / 73 / 94 % | 26 / 67 / 94 % |
| la fiche DB7 | 17 / 64 / 99 % | 39 / 79 / 97 % | 26 / 66 / 100 % |

- **Retenu : ×1**, la force même de la fiche. Les deux réglages de DB9 (la jauge de l'attaque simple, la part d'un coup gardé) la rapprochent de la courbe de la fiche sans autre facteur.
- **Le marteleur qui tient la garde** : Tobin 30 %, Cassius et Rhosk 10 %, les autres rivaux 0 % (DB9 : 70 / 20 / 20 %).
- **`V2_RACERS`** remesuré : les mises à terre ne changent pas (les coups de Ren ne bougent pas), les dégâts par seconde ×1,4 environ. Les graines de contrôle 81..120 restent dans les tolérances du test.
- **`V2_SIM_HASH`** : le script parcourt encore chaque chemin de V2-2 ; l'outil d'arène le rejoue à l'identique dans la page.
- **Le TournamentLab** (graines 1..50), ses joueurs n'exerçant jamais leurs compétences :
  - le préparé gagne 42,0 % de ses combats (59,6 % en DB9), atteint le tableau trois parties sur quatre (74 %), n'est jamais couronné, 1,00 blessure par partie ;
  - le joueur qui ne fait que combattre : 1,64 blessure par partie ;
  - le curieux : 53,7 %, le tableau 80 %, finaliste 14 %, jamais couronné.
- **Tests mis à jour** :
  - les forces des coups (`combat-charge`, `duel-stats`) ;
  - les parties entières de `combat-charge` (le préparé entre 33 et 55 %, l'expert au tableau) ;
  - les nombres de V2B1 dans `v2-injury`, dont « moins souvent blessé que le joueur qui ne fait que combattre » au lieu de « deux fois moins ».

### Validation
- `npm run typecheck` sans erreur ; `npm test` 587 / 587.
- `npm run build` réussi ; `npm run art:validate` 73 manifestes, 123 sources, 23 manifestes de son, 0 erreur.
- **Navigateur** (`dev-strict`) :
  - `arena-scene-check` (`v2=1`) PASS : l'empreinte rejouée dans la page égale `V2_SIM_HASH`, aucune erreur, les marques du sol dégagées sur 77 tailles ;
  - `play-flow win` : le combat d'une partie, le rejeu en Node à la même empreinte.

### Où reprendre
- L'essai en jeu de l'opérateur : le combat, les stats sur les pages, la séance au choix, la vigueur.
- [?] Le joueur du TournamentLab n'exerce pas ses compétences. Une politique qui les exercerait rendrait le laboratoire fidèle à la courbe de la fiche, mais déplacerait les nombres que les tests épinglent. À proposer à l'opérateur s'il le veut.

### Pensée
- Quand deux références de calibrage se contredisent (le laboratoire, la fiche), le choix revient à l'opérateur : on lui montre les deux courbes et ce que chacune donne au joueur faible et à la finale.

