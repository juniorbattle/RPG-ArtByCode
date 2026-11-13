# Journal de bord — archive : passes SL3, SL4 (2026-11-13)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-11-13 (Passe BL1) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe SL3 — Lot 2 de la seconde refonte, première partie : le rythme mesuré et soumis à l'opérateur (fiche publiée) ; ce qui n'en dépend pas construit sur la branche, non fusionné : l'automatique de SL1-3, la tactique, la main, la sauvegarde (SY-10), SL1-6, SL1-7, les textes ; les tactiques aux signaux mesurées (SL1-4) (2026-11-13)

### Demande
- La séance coordinatrice (l'audit final), d'après la relecture de la Passe SL2 : construire le lot 2 dans l'ordre de `briefs/combat-auto.md` § 28.1, la durée et le rythme d'abord. La note de l'opérateur sur SL1-2, mot pour mot : « selon ce que tu evoques il faut que tu baises la duree : Les durées médianes de la référence : la poule environ 2min, le tableau 2-4min , la finale 3-4min max. et Le rythme vif : 118 coups par minute, est trop intense c'est a peine si nous pouvons apprecier le combat et faire une action,... apres tout on doit rester attentif a ce qui se passe et voir cela comme une scene de theatre ». Le rythme n'étant pas chiffré, ses candidats sont soumis à l'opérateur avant tout recalage de la course.
- Puis, la fiche restant sans réponse, l'opérateur par la séance coordinatrice : « Try again » — reprendre ce qui ne dépend pas du rythme.
- Branche `claude/combat-sym-lot2-017fdf` (le worktree `priceless-tharp-71c68f`, tirée de `main` `f8caff8`), seule ouverte ; serveur `sl3-dev` (port 5451). Commits poussés, non fusionnés : `50472d7`, `feb9bb0`, `3fd4985`, `3b7b9fd` et celui de cette passe.

### Le rythme — [?] mesuré, en attente du choix de l'opérateur
- **La méthode** : un candidat ralentit tout le temps du duel d'un facteur s (les charges, donc les recharges de DB5-3 ; les coups d'un enchaînement ; les protections et les soutiens, qui couvrent ainsi les mêmes actions ; le premier tirage) et alourdit chaque coup d'un facteur k (sa puissance et sa jauge), la décroissance de la jauge ×k/s (autant de ruptures par combat) ; k est recalé pour que la poule de la référence dure 2 min. Les PV ne changent pas (Ren 300, ×2 en combat). L'étourdissement de la rupture reste les 10 s de DB5-4 (A3). `AUTO_CADENCE` est désormais { charge, power, gap, effect } (SY-03 = 0,6 / 0,6 / 1 / 1 : le jeu à l'identique).
- **[KO → compris]** Un premier jeu de candidats raccourcissait les effets avec le combat (×s/k) : la référence tombait de 89 % à 4 % au jour 4 à ×2. Les effets doivent suivre le tempo (×s) : à ×2 la référence garde 89 % et le combat dure 146 s. La rupture de 10 s, elle, pèse plus dans un combat court (8 % du combat au lieu de 6 %) ; la raccourcir à 7 s change peu (40 % de titres contre 38 % à ×2, avant recalage).
- **Les candidats** (60 parties de la référence, graines 101 à 160, l'automatique de SL1-3, la course d'avant le recalage) :

| Rythme | Coups / min | Entre deux coups | Ren choisit toutes les | Silences > 3 s | Plus long silence | Coups / combat | Compétences de Ren | Poule / tableau / finale |
|---|---|---|---|---|---|---|---|---|
| aujourd'hui | 120 | 0,32 s | 1,1 s | 9 % | 4,2 s | 479 | 50 | 177 / 290 / 351 s |
| le même, plus court (k 1,53) | 121 | 0,32 s | 1,1 s | 7 % | 3,8 s | 313 | 31 | 120 / 202 / 208 s |
| ×1,5 (k 2,41) | 81 | 0,48 s | 1,7 s | 25 % | 5,4 s | 200 | 20 | 118 / 185 / 196 s |
| ×2 (k 3,26) | 61 | 0,64 s | 2,2 s | 28 % | 6,3 s | 148 | 14 | 122 / 185 / 201 s |
| ×2,5 (k 4,21) | 49 | 0,80 s | 2,8 s | 33 % | 7,9 s | 120 | 11 | 122 / 177 / 215 s |
| ×3 (k 5,30) | 40 | 0,96 s | 3,4 s | 44 % | 9,5 s | 93 | 8 | 117 / 165 / 197 s |
| ×2, enchaînements vifs (k 3,16) | 67 | 0,33 s | 2,2 s | 32 % | 6,5 s | 165 | 16 | 118 / 195 / 192 s |

- Les durées de l'opérateur tiennent à chaque candidat avant même le recalage de la course ; les titres montent quand le duel ralentit (38 à 67 %), ce que le recalage corrigera.
- **Les films** : `tools/duel-clip.mjs` (la page de l'arène, sa boucle tenue, chaque image prise puis encodée en MP4 par ffmpeg) et le paramètre DEV `autotempo=s,k[,gap]` (`src/lab/autoTempo.ts`, à retirer après la décision, VD-8) : le même combat (Ren contre Marek, graine 1337), ses 30 premières secondes, à chaque candidat.
- **La fiche** : https://claude.ai/artifact/LxbnwW9Q3vq7f8BqcETVk2 (`briefs/fiche-combat-sym-lot2-rythme.html`), quatre cartes : RY-1 le rythme (×2 recommandé, environ 60 coups par minute, cinq films), RY-2 les coups d'un enchaînement étirés ou vifs (étirés recommandés, deux films), RY-3 la rupture garde ses 10 s (DB5-4, A3, gardée recommandée), RY-4 la suite (fusionner la première partie dès ses preuves). Vérifiée avant publication dans un Chrome sans tête (quatre cartes, dix options, sept films lus, aucune erreur, aucun débordement à 375 et 1280 px) ; `decisions` vide à la publication, et toujours vide à la fin de cette passe.

### Construit (non fusionné) — [OK] testé
- **SL1-3** (« L’automatique garde la plus forte pour la rupture (au lot 2, la course recalée) ») : l'automatique de tous garde sa plus forte offensive pour une rupture assez longue pour qu'elle porte, ou la lance à PA pleins quand rien d'autre ne part (la tactique mesurée par l'atelier, `AUTOS.rupture`). Écrit comme la tactique dont les quatre lignes sont « comme l'automatique » (`tacticChoice`, `strongestOf`, `brokenFor`, `src/combat/auto.ts`) : un combattant sans tactique et un combattant aux quatre lignes « auto » livrent le même duel, événement par événement.
- **La tactique** (SY-08) : une condition par compétence (`AutoCond` : comme l'automatique, dès qu'elle est prête, quand l'adversaire est rompu, quand il charge un gros coup, quand ma jauge passe les deux tiers, quand mes PV passent sous la moitié, quand ses PV passent sous le tiers, quand une offensive peut suivre, jamais), celles de chaque famille (`AUTO_CONDS_OF`), dans la partie (`kit.tactic`, l'action `setTactic`, dans l'empreinte). Sur la page des compétences et la fiche de match : la ligne choisie, si elle est emportée, dit quand elle part (la règle de l'automatique écrite pour sa famille, ou sa condition) ; C (le Y de la manette) donne la condition suivante ; l'ordre des quatre montre la condition de chacune.
- **La main** (SY-09) : `autoDuel(..., { commands })` — une compétence appuyée part au prochain choix de Ren dès que ses PA et sa recharge le permettent, attend sinon, un nouvel appui remplace celui qui attend ; rien avant l'appui ne change (un tirage par coup). Dans l'arène : les touches 1 à 4 (quatre actions nouvelles du remappage, `skill1` à `skill4` ; le « 1 » qu'avait l'attaque de l'ancien duel leur revient), la croix de la manette, un clic sur la ligne d'une compétence du HUD (marquée « À votre prochain choix » tant qu'elle attend) ; le duel refait avec les appuis, la relecture garde chaque ligne jouée et prend la suite (`AutoReplay.replace`, `ArenaApp.press`). La page des réglages a une ligne par compétence de la main.
- **SY-10** : au « Combattre », le résultat de la tactique est écrit comme résultat en attente (`V2State.$pending`, hors de l'empreinte) ; une page quittée avant la fin le voit appliqué par la page suivante (`settlePending`) ; la fin du combat le remplace par le sien.
- **SL1-6** : la charge du coup puissant de Ren s'entend au premier palier (sa note, son souffle, son fouet), et la règle F monte la tension sur elle (la règle dit « la charge lourde »).
- **SL1-7** : une sauvegarde dont les quatre portaient le coup puissant donne sa place à la compétence possédée suivante, dans l'ordre de la page (`heavyOutOfFour`, à la lecture) ; `setLoadout` refuse désormais le coup puissant.
- **Les textes** (anglais, français) : « Le duel » et « Préparer un combat » du guide et la première leçon disent la règle de l'automatique, la tactique ([C]) et la main ([Hand]).
- **[KO → corrigé] La jauge de la relecture** : le script écrit ses temps au centième ; un coup tombé à moins de 5 ms de la fin d'une protection pouvait être jugé protégé dans le duel et non dans l'arène (Vessa, une protection finie à « 127,61 », un coup de Ren à « 127,61 »). Une ligne de coup tracée dit désormais si la protection de la cible et le renfort du frappeur ont pesé (`fx`), et la relecture le lit.

### Les tactiques aux signaux (SL1-4) — [?] le second critère de SY-07 ne tient pas
- Mesurées telles que la page les offre (le `tacticChoice` du jeu, `tools/auto-tactics.mjs` « page : … »), 200 parties de la référence (graines 101 à 300), le rythme d'aujourd'hui, la course d'avant le recalage : l'automatique 41 % de titres ; offensives à la rupture 0 % ; offensives quand il charge un gros coup 3 % ; la plus forte à la rupture et les autres quand il charge 3 % ; la plus forte pour finir 38 % ; offensives dès que prêtes 36 % ; protections quand il charge 15 %, à la jauge 9 % ; soutiens quand une offensive peut suivre 2 %, à la rupture 0 % ; protections et soutiens dès que prêts 20 % ; les signaux partout 2 % ; appuis au hasard 15 à 34 %.
- Deux remèdes mesurés, une règle à PA pleins pour toute tactique : (A) la première compétence de l'ordre qui n'est pas « jamais », (B) l'offensive la moins chère qui n'est pas « jamais ». Les offensives retenues remontent avec B (13 à 18 %), mais un soutien retenu reste à 0 à 2 % avec l'un ou l'autre, et l'automatique reste à 41 %. Le renfort dès qu'il est prêt est ce qui gagne ; le retenir perd, quelles que soient les conditions.
- Ces mesures sont au rythme d'aujourd'hui ; elles se refont après le choix de l'opérateur, et la question va sur sa fiche d'essai (accepter que retenir coûte, revoir les renforts, ou retirer des conditions qui les retiennent).

### Validation
- `npm run typecheck` sans erreur ; `npm test` : **659 / 661**. `tests/auto-hand.test.mjs` (8 tests : l'automatique comme tactique, SL1-3, chaque condition contre un oracle, `setTactic`, la main dans le duel et dans l'arène, SL1-7, SY-10) ; les tests mis à jour : `combat-auto` (la cadence en quatre parts, l'automatique de SL1-3), `auto-arena` (le champ `fx` de la trace), `auto-sound` (le coup puissant au premier palier, les graines de l'étourdissement cherchées de nouveau : Rhosk 77, Orla 26), `pad` (la croix de la main, la touche C des pages), `settings` (les touches 1 à 4), `tutorial`, `duel-stats`, `v2-skills`. **Restent deux nombres à remesurer après le rythme et la course** : les blessures d'une partie (`v2-injury` : 0,36 contre 0,56 épinglé) et les graines du curieux qui dénonce Rhosk (`v2-rivals`).
- Dans la page (serveur de la branche) : la fiche de match et la page des compétences en français, la condition changée par C. Les preuves du navigateur (arène, jauge, tutoriel, flux) se font après le rythme.
- Archivage : avec SL3, les passes gardées passaient 60 Ko ; CO2 (branche fusionnée) déplacée seule, à l'octet, dans `journal/103-passes-CO2.md`, sa ligne ajoutée à l'index et les deux phrases d'en-tête complétées ; preuve par script : le corps de l'archive égale les 11 260 octets retirés, CO2 dans un seul fichier, le reste du journal inchangé, CRLF partout.

### Où reprendre
- Quand l'opérateur dit la fiche du rythme remplie : appliquer le rythme (`AUTO_CADENCE`, la décroissance, le premier tirage ; retirer `autotempo`), recaler la course une fois (+7,5 %, AC-15, graines 1 à 80 puis 101 à 300) en tenant ses durées, remesurer les deux nombres épinglés, refaire SL1-4 et le test de AC-12 avec la tactique (SL1-5) ; `tools/gauge-proof.mjs` lit encore la décroissance 0,63 en dur ; les preuves du navigateur ; la fiche d'essai.

### Pensée
- Un rythme se ralentit d'un bloc : tout ce qui se compte en secondes doit suivre, les effets compris ; sinon c'est l'équilibre qu'on change sans le vouloir (89 % → 4 %).
- Une condition qui retient une compétence se mesure contre l'automatique avant d'entrer dans une page : ici, retenir le renfort coûte presque tout.

## Passe SL4 — La fiche du rythme relue, quatre sur quatre (RY-1 à l'autre option) : le duel trois fois plus lent, les enchaînements étirés, la rupture de la note de RY-3 (décision A3) ; appliqués, la course recalée une fois, la première partie du lot 2 prouvée et fusionnée ; la nouvelle direction de l'opérateur : un atelier du système de combat final (2026-11-13)

### Ce que l'opérateur a dit
- Par la séance coordinatrice, mot pour mot : « Fiche remplie ». `ArtifactData list decisions` sur https://claude.ai/artifact/LxbnwW9Q3vq7f8BqcETVk2 (`briefs/fiche-combat-sym-lot2-rythme.html`) : quatre documents, cliqués le 13/11/2026 entre 06:29:40 et 06:37:17 UTC. Les rangées sont lues comme des données.

| Carte | Sujet | Choix, mot pour mot |
|---|---|---|
| RY-1 | Le rythme | « ×3 plus lent : environ 40 coups par minute » (pas la recommandation, ×2 ; sans note) |
| RY-2 | Les coups d'un enchaînement | « Étirés avec le reste » |
| RY-3 | La rupture (DB5-4, A3) | « Garder 10 s (DB5-4) », avec la note ci-dessous |
| RY-4 | La suite | « Fusionner la première partie dès ses preuves » |

- La note de RY-3, mot pour mot : « je pense que les ruptures devraient etre equivalente par default concernant le nombre de coup necessaire pour etre en rupture, par exemple 20-25coups  par exemple et le multiplicateur de degats infliges pendant la rupture par exemple x1,4 durant 10s pour chacun... ainsi et comme je le dis ce sont des valeurs par default puis elles pourront etre influencer selon les stats et competences des combattants et autres par exemple je veux une partie dans les regles mais une optimisation correcte et ressenti dans le combat avec une maitrise importante pour ne pas briser le jeu et donner les chances/probabilites de gagnes  fortement surtout si il est bien prepare ».
- Puis, dans cette séance, sur les tactiques aux signaux de la Passe SL3, mot pour mot : « explique moi et surtout sur quelle base » ; après l'explication : « dans ce cas ce n'est pas bon il faut trouver la formule gagnante afin d'avoir une simulation optimale de combat qui reunit attaque simple/lourde, garde/esquive, competences en prenant en compte que notre heros vs affronter des ennemies de plus en plus fort et qui va devoir s'ameliorer grace a ces combats et surtout ces equipements ameliores, les equipements en plus des stats ameliroeres peuvent apporter des effets bonus » et « Bref je veux vraiment que tu pousse la reflexion loin en reprenant l'ensemble du jeu et de ce quon a accompli et me proposer un protottpe finale de systeme de combat efficace. »
- Sur la marche à suivre proposée (finir et fusionner la première partie ici, puis l'atelier dans une séance neuve), mot pour mot : « okayavec ta recommandation pour prtir sur une bonne base » ; et : « les pa sont-ils vraiment utiles car tu disais que cela fausses la structure. l'esquive et la garde ne devrait pas t-elle se faire sur la base des stats comme tu le souhaitais par contre garde -80% de degats sera a revoir » ; « sinon je suis d'accord mais je veux pousser la reflexion davantage on va partir sur un structure de combat suffisamment coherente que meme lorsque le heors ne combat pas, il peut parier sur les autres combattants ce qui peut etre un moyen de gagner de 'argent sussi ( concept pour plus tard, pour le moment le focus est sur le combat ) ».

### Les décisions A3, citées et datées (13/11/2026)
- **RY-3 et sa note changent DB5-4** (« 10 s, ×2, jauge de 70 », A3, Passe DB5) : les 10 s gardées ; la rupture vient **après le même nombre de coups par défaut pour chaque combattant, environ 20 à 25** ; les dégâts subis pendant la rupture **×1,4** au lieu de ×2 ; ce sont des valeurs par défaut que les stats et les compétences modulent. L'opérateur dit « par exemple » : 22,5 coups et ×1,4 sont appliqués comme ces valeurs par défaut, mesurés ci-dessous.
- **RY-1** revient sur SY-03 (« ×0,6 pour tous », qui n'est pas une A3) : le duel trois fois plus lent. Il tient SL1-2 (A3, les durées).

### Ce qui a été fait — [OK]
- **Le rythme** (`src/combat/autoData.ts` `AUTO_CADENCE` = { charge 1,8, power 3,2, gap 3, effect 3 }) : chaque charge et donc chaque recharge (DB5-3) trois fois celle de SY-03, les écarts d'un enchaînement et les effets ×3, le premier tirage ×3 (`AUTO_RULES.start` 1,8), chaque coup plus lourd (×5,3 la puissance de SY-03) pour tenir les durées. Le paramètre DEV `autotempo` et `src/lab/autoTempo.ts` retirés (VD-8).
- **La rupture** (`src/combat/auto.ts` `AUTO_RULES.gauge` = { max 70, blows 22,5, decay 0,16, guardMul 2 }, `brk` = { stun 10, dmg 1,4 } ; `autoGaugeHit`) : un coup d'attaque simple vaut un coup de la jauge (70 / 22,5), une compétence ou un coup puissant deux (un casseur 3 ou 4 : Tourbillon, Fracas, les gros coups des rivaux), partagés sur ses coups ; puis l'Endurance de la cible (× 10 / End), la garde (×2, DB9), une protection, un renfort. La décroissance calée sur parties entières pour que la rupture vienne en 20 à 25 coups : à 0,16 par seconde, 25 coups pour Ren et 20 pour les rivaux en médiane (du 10e au 90e centile 15 à 40). La relecture, la page des compétences (« sur la jauge ») et la copie du laboratoire (`tools/auto-sym/sim.mjs`, `gaugeHit`) suivent la même règle.
- **La course recalée une seule fois** (`AUTO_RACE`) : chaque rival à son facteur de poule (la référence du jour 2 le bat 95 % du temps, inchangés depuis le premier calage : Vessa 1,248, Tobin 1,721, Cassius 1,114, Orla 0,985, Ilse 1,184, Marek 1,092, Rhosk 1,62), la poule à +7,5 % par tour (SL1-1), le tableau ×1,335 et la finale ×1,749 sur 200 parties de calage (graines 1 à 100 et 301 à 400). **[KO → corrigé]** Calés sur les 80 graines prévues, le tableau et la finale tombaient à 66 % et 53 % sur ces graines mais à 82 % et 56 % sur les graines tenues à part : le rival du tableau change d'une graine à l'autre, 80 ne suffisent pas.
- **La main** : une compétence appuyée qui attend ses PA ne les voit plus dépensés par la tactique sur une autre ; Ren joue ses attaques de base en attendant (un Estoc à 4 PA appuyé tôt ne partait pas dans la minute).
- Ce qui suivait les nouvelles règles : les graines des scènes refaites (le sable de Rhosk sur la graine 18, la 14 tombant le matin d'une bagarre ; le curieux qui le dénonce sur 6, 9, 10 et 24) ; les blessures d'une partie remesurées (le joueur préparé 0,46, l'oisif 0,7, la référence 0,36) ; `tools/play-flow.mjs` : une partie qui attend gagne le jour 2 avec la graine 1842 et perd avec la graine 5 ; `tools/gauge-proof.mjs` lit la décroissance et l'étourdissement dans la page.

### Les mesures — 200 parties tenues à part (graines 101 à 300), la référence
| | Visée | Mesuré |
|---|---|---|
| Rythme | environ 40 coups par minute (RY-1) | 39 coups par minute ; 47 % du temps en silences de plus de 3 s |
| Rupture | 20 à 25 coups par défaut (RY-3) | Ren 25, rivaux 20 (médianes) ; 1,10 rupture de Ren et 1,25 du rival par combat |
| Durées médianes | poule environ 2 min, tableau 2 à 4, finale 3 à 4 au plus (SL1-2) | 1 min 51, 3 min 08, 3 min 50 |
| Course (AC-15) | 95 / 85 / 75, demi 65 %, finale 50 % | 92 / 93 / 100, demi 66 %, finale 48 % |
| Titres | — | la référence 31 %, le planificateur 18 %, le curieux 21 %, le diligent et l'oisif 0 % |

- **[?]** La poule tombe trop facile à ses deux derniers tours (93 et 100 % contre 85 et 75) : à ces règles la référence progresse plus vite que +7,5 % par tour. La pente est une décision A3 (SL1-1) : à la fiche d'essai.
- Les durées du curieux en finale (6 min 17 en médiane) passent les 4 min : les cibles de SL1-2 sont celles de la référence (AC-14).

### La nouvelle direction — l'atelier du système de combat final
- L'opérateur veut une formule qui tienne d'un bloc (attaque simple et lourde, garde et esquive par les stats, compétences ; des ennemis de plus en plus forts, un héros qui s'améliore par ses combats et surtout son équipement ; des effets d'équipement en plus des stats), réfléchie sur l'ensemble du jeu, et un prototype final à lui proposer. Ses questions pour l'atelier : l'utilité des PA (« tu disais que cela fausses la structure »), la garde et l'esquive par les stats, la garde à −80 % « à revoir » ; une structure assez cohérente pour qu'un jour le héros parie sur les autres combats (pour plus tard, ECO-5 gardé).
- Décidé avec lui : la première partie du lot 2 finie et fusionnée ici, puis l'atelier dans une séance neuve, sur un brief complet (`briefs/atelier-combat-final-brief.md`).

### Validation
- `npm run typecheck` sans erreur ; `npm test` **661 / 661** ; `npm run build` ; `npm run art:validate`.
- Navigateur (serveur de la branche, port 5451), tous verts : `tools/auto-arena-proof.mjs` pour les sept rivaux (111 contrôles, relancé après la correction de la relecture) ; `tools/gauge-proof.mjs` (18 sur 18) ; `tools/tutorial-proof.mjs` en anglais et en français ; `tools/play-flow.mjs` gagné (graine 1842) et perdu (graine 5) ; `tools/challenge-flow.mjs` défi et représailles gagnés ; `tools/rivals-flow.mjs sand` ; `tools/audio/hooks-proof.mjs`.
- **[KO → corrigés]** La preuve de la jauge trouvait une image sur deux duels où la barre restait pleine à la fin exacte d'un étourdissement de 10 s (l'horloge de l'arène lisait un milliardième de moins) : la relecture compare désormais à 1e-9 près, comme le reste de son code. La preuve du son n'écoutait que les 12 premières secondes du duel : au rythme ×3 la première compétence de Ren part plus tard, la fenêtre passe à 30 s.
- Archivage : avec SL4, les passes gardées passaient 60 Ko ; SY1 (branche fusionnée) déplacée seule, à l'octet, dans `journal/104-passes-SY1.md`, sa ligne ajoutée à l'index, les deux phrases d'en-tête complétées ; preuve par script : le corps de l'archive égale les octets retirés, SY1 dans un seul fichier, le reste du journal inchangé, CRLF partout.

### Pensée
- Une règle donnée « par défaut » se pose dans son unité (ici des coups) et se cale sur parties entières, la décroissance comprise : la règle écrite seule (22,5 coups sans décroissance) ne dit pas ce que le joueur voit.
- Une course calée sur trop peu de graines se trompe de seize points sur des graines neuves ; deux cents ne coûtent que quelques minutes.

