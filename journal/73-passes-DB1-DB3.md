# Journal de bord — archive : passes DB1, DB2, DB3 (2026-11-09)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-11-09 (Passe RG3) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe DB1 — Le duel de la version 2 : les clics répétés sur l'attaque ne s'empilent plus (2026-11-09)

### Demande
- Retour de l'opérateur après son premier essai de la version 2 (jeu par défaut), transmis par la séance mère (`local_94e3af37-…`), mot pour mot : « j'ai aussi remarque un bug lorsque j'ai clique plusieurs fois sur le bouton attaque rapide.... l'action est devenu comme bloque et les attaques simples se repetaient sans arret, faisant en sorte que plus aucune touche fonctionner ». Partie 1 de la tâche (le bug, fusionné vite) ; la partie 2, la refonte de l'équilibre du duel, suit sur sa propre branche (Passe DB2).
- Branche `claude/duel-file-attente`, tirée de `main` `615bcb8`.

### La cause — [OK] reproduite en Node puis dans le navigateur
- `ChargedDuel` (`src/combat/charge.ts`) garde, depuis V2-2 « Rien ne la coupe » (Passe V2C1), tout relâché que le duel ne peut pas prendre (une action en cours, la séquence adverse, un étourdissement) dans une file `waits`, **sans limite** : un relâché pendant qu'un autre attend s'ajoutait derrière (cas « proposé » de la Passe V2C1, « a new press meanwhile starts a new charge, whose release waits behind it »). Chaque clic (ou chaque J) pendant une attaque rapide en cours ajoutait donc une attaque rapide à la file ; elles partaient une à une (0,58 s chacune), le joueur restait « en action » : la garde (`guarding` exige l'état `idle`) et l'esquive (`idle` ou `recovering`) ne répondaient plus, et un nouveau relâché allait encore au bout de la file. Le clavier, la manette et le bouton du HUD passent tous par `ArenaApp.action('attack', down)` → `ChargedDuel.attack` : la cause est la même pour les trois.
- En Node (le duel de la scène, l'adversaire tenu à l'écart) : 12 clics en 1,7 s → 12 attaques rapides, la dernière à 6,75 s ; la garde tenue dès le dernier clic ne se lève qu'à 6,76 s.

### La correction — [OK]
- **Un relâché attend au plus** : un relâché pendant qu'un autre attend ne prend sa place que s'il a atteint un palier plus haut ; sinon il est abandonné. Un tap ne s'empile jamais derrière un palier en attente, et un palier chargé n'est jamais abandonné pour un tap. Rien d'autre ne change : rien ne coupe une charge (V2-2), un relâché pris tout de suite part tout de suite, un palier en attente part au premier pas où le joueur peut agir, le K.O. seul le finit.
- Ce qui reste de la « mitraille » : le joueur attaque aussi vite que l'attaque rapide le permet, jamais plus vite, et au plus une attaque part après son dernier clic. C'est le constat d'équilibre de l'opérateur (« le mieux est de spam l'attaque »), traité en Passe DB2, pas ici.
- Cas « proposé » de la Passe V2C1 remplacé (consigné, pas une décision de l'opérateur : la règle V2-2 elle-même est tenue) : un relâché derrière un palier en attente n'attend plus derrière lui.

### Tests — [OK]
- `tests/combat-charge.test.mjs` : nouveau test « taps in a row never pile up » (12 taps de 40 ms toutes les 80 ms pendant les attaques : au plus 4 attaques rapides, aucune plus de 0,7 s après le dernier tap, la garde tenue se lève moins de 1,2 s après, puis l'esquive répond au coup suivant). **Il échoue sur le `charge.ts` de `main`** (le fichier remis temporairement : ce test et l'ancien cas de la file à deux tombent) **et passe avec la correction**. Le cas « a new press while a tier waits » réécrit : le tap derrière la puissante en attente est abandonné, la puissante seule part ; un palier plus haut relâché pendant qu'un tap attend prend sa place.
- `V2_SIM_HASH` (le script fixe du duel chargé, `src/arena/v2Arena.ts`, et `tools/arena-scene-check.mjs`) : le script relâche des taps pendant qu'un palier attend, l'empreinte change, justifiée par la règle : `1785:1:idle:0.075:51.125:-:-;7253:0:idle:3.192:13.095:-:-;108.883|1:0.083:` (le test vérifie toujours que le script atteint chaque chemin de V2-2 : coups gardés ou non, esquive, rupture et K.O. sur une charge tenue, relâchés qui attendent).

### Preuve dans le navigateur — [OK]
- `tools/attack-spam-proof.mjs` (neuf) : l'arène seule (`?scene=arena`, le duel de la version 2), le bouton d'attaque du HUD cliqué 12 fois à la vraie souris (40 ms appuyé, 80 ms entre deux) pendant que la boucle de la page tourne, puis K tenue ; une manche l'adversaire tenu à l'écart (mesure), une manche l'adversaire vivant (chiffres seuls). Serveurs par `preview_start` : la branche (`dev-strict`, `:5186`) et `main` figé `615bcb8` (`git archive`, `three` copié, entrée `db1-main`).
  - `main` figé : adversaire tenu, 12 clics en 2,16 s → 9 attaques rapides, 6 après le dernier clic (la dernière 3,52 s après), **la garde levée 4,12 s après le dernier clic** ; adversaire vivant : 12 attaques, 10 après le dernier clic (5,37 s), la garde 5,97 s après. **FAIL**.
  - Branche : adversaire tenu, 3 attaques rapides, aucune après le dernier clic, **la garde levée 0,52 s après** ; adversaire vivant : 3 attaques, une 0,01 s après le dernier clic, la garde 0,61 s après. **PASS**, aucune erreur de page.

### Validation
- `npm run typecheck` ; `npm test` **541 sur 541** ; `npm run build` ; `npm run art:validate` (73 manifestes, 23 du son, 0 erreur).

### Pensée
- Une file d'entrées sans borne transforme l'impatience du joueur en blocage : plus il appuie parce que « ça ne répond pas », plus la file s'allonge. Une mémoire d'entrée se borne à une action, comme le tampon de `DynamicSim` (`bufferTime`).
- Un cas « proposé » par un agent (Passe V2C1) se relit à l'essai de l'opérateur : il a montré en un essai ce que le test, qui figeait la file à deux, ne voyait pas.

## Passe DB2 — L'équilibre du duel de la version 2 : mesuré, audité, une fiche d'arbitrages publiée ; rien d'appliqué (2026-11-09)

### Demande
- Partie 2 de la tâche transmise par la séance mère (`local_94e3af37-…`) après le premier essai de l'opérateur, ses mots pour le combat, mot pour mot : « Je trouve que les combats sont tres longs... il faut faire en sorte que les competences ou la zone de break fasse vraiment des degats, surtout quelle prend du temps a etre accessible » ; « mais on doit vraiment trouver une solution pour que les attaques soient significatifs car elles degats cree a peine des degats meme les competences, et le mieux est de spam l'attaque car on peut attaquer presque 10 fois avant que l'ennemie attaque et donc on cumule des ap pour esquiver... il faut retravailler cela pour que notre systemne de combat soit optimale ». (Son troisième constat, le blocage des clics, est la Passe DB1, fusionnée.)
- Mesurer d'abord, écrire un audit court, proposer des options chiffrées mesurées sur un prototype, publier une fiche ; **rien appliqué au jeu par défaut avant la fiche**, et ses choix qui touchent une règle de `briefs/combat-system.md` sont des décisions A3 (citées mot pour mot et datées avant toute mise en œuvre).
- Branche `claude/duel-equilibre`, tirée de `main` `9cc4321` (après DB1).

### L'outil — [OK] `tools/duel-balance.mjs` (neuf)
- Node seul : le duel du jeu (`v2DuelData`, le kit de départ au niveau 1, sans préparation ni équipement, comme `?scene=arena&foe=<id>`) contre les sept rivaux, 20 graines chacun ; le bot du jeu (`runV2BotDuel`) aux adresses 0,2 / 0,5 / 0,9, et un « marteleur » qui ne fait que l'attaque rapide entre les séquences adverses et se défend comme le bot. Par rival et politique : victoires, durée (médiane, p10-p90), part des dégâts du joueur par source et celle faite pendant une rupture, ruptures et la première, attaques rapides placées dans une pause adverse, PA gagnés par minute et leur emploi ; `--static` les nombres d'un duel ; `--summary`.
- Les options sont des **variantes composables** (`--variant=a+b+c`) appliquées aux données du duel avant de le jouer : PV des rivaux et du joueur, dégâts des compétences, de l'attaque rapide, son cycle, ses PA, la rupture (dégâts, étourdissement), l'apport des compétences et de l'attaque rapide à la jauge, les pauses adverses, les temps de charge, les coups des rivaux ; et une règle que les données ne disent pas, prototypée hors du jeu : la **riposte** (au k-ième coup rapide qui touche dans sa pause, la séquence de l'adversaire part 0,3 s après ; jamais pendant sa rupture).
- `src/combat/bot.ts` : `BotOptions.observe` (les événements de chaque pas d'un duel de `runV2BotDuel`, pour la mesure) ; il ne change rien au duel (les tests et `V2_SIM_HASH` identiques).

### Les mesures du duel d'aujourd'hui — [OK] l'opérateur a raison sur les trois points
- **La durée** : médiane 6,8 / **8,0** / 8,4 min (bot 0,2 / 0,5 / 0,9), 7,2 min pour le marteleur ; victoires 1 / 54 / 99 %, le marteleur 37 %.
- **Les dégâts en part des PV** (rivaux 3 744 à 9 180 PV, Marek 7 680, Ren 2 200) : l'attaque rapide 10 = 0,11 à 0,27 % (375 à 918 coups pour un K.O.), le Coup éclair (3,4 s, 2 PA) 75 = 0,8 à 2 %, l'Estocade (7,65 s, 4 PA) 168 = 1,8 à 4,5 % ; par seconde du temps qu'elles prennent, 19 et 20 dégâts contre 17 pour le martelage.
- **Le martelage** : une pause adverse (3,5 à 12 s) laisse 6 à 21 attaques rapides (cycle 0,58 s) ; le marteleur en place 14 en médiane, 31 au plus ; ses PA restent pleins (plafond 5) et vont aux esquives (12 à 16 par duel).
- **La rupture** : 34 attaques rapides pour remplir la jauge ; première rupture à 86 s (bot 0,5), 43 s (marteleur) ; ×1,2 pendant 6 s : 8 % des dégâts du bot y sont faits (15 % du marteleur, qui casse la jauge 8 fois par duel).
- Le bot 0,5 fait 74 % de ses dégâts aux compétences : en simulation il bat le marteleur (54 contre 37 %), mais chaque compétence ne vaut que 1 à 2,6 % d'une barre, d'où le ressenti.

### Les leviers seuls, puis un paquet — [OK]
- Seul, aucun levier ne répond aux trois constats (tableau de `briefs/audit-duel-db2.md` § 2) : la riposte au 3e coup fait tomber le marteleur à 0 % mais aussi le bot (60 → 17 %) ; les compétences ×3 font passer le bot à 100 % en 3,7 min sans toucher au marteleur ; le break ×2 profite surtout au marteleur (il remplit la jauge le plus vite) ; la jauge des compétences ×2 avance la première rupture de 85 à 34 s ; les PV des rivaux ×0,5 raccourcissent mais rendent tout facile ; un PA toutes les deux attaques ne change rien au marteleur (PA déjà pleins).
- **Le paquet recommandé** : la riposte au 3e coup ; les compétences ×4 ; la jauge par les compétences (×2, l'attaque rapide 2 au lieu de 3) ; le break ×2 pendant 8 s ; recalé par les coups des rivaux ×2,5, leurs PV ×1,5 et ceux de Ren ×1,25. Mesuré : **3,2 / 3,7 / 3,9 min** (2,9 à 4,5 min selon le rival au bot 0,5), victoires **9 / 59 / 99 %**, le marteleur **0 %** en 1,6 min, 3 attaques rapides par pause (6 au plus, pendant une rupture), l'Estocade 5,8 % des PV de Marek et 11,7 % sur sa rupture, la première rupture à 45 s, 22 % des dégâts faits pendant une rupture, 91 % aux compétences.
- **La durée se règle à part** : les PV des deux côtés ensemble ×0,8 / ×1,25 / ×1,75 / ×2,5 sur ce paquet donnent 2,4 / 3,7 / 5,1 / 7,5 min, à 58-61 % pour le bot 0,5 (les chances ne bougent pas). [KO → corrigé] une première série montait les PV des rivaux et du joueur de facteurs différents (×1,5 / ×1,25) : 29 % ; à facteur égal, 56 %.
- Chaque alternative de carte remesurée sur le paquet (une chose changée à la fois, avant recalage) : riposte au 4e 79 %, attaque rapide à 0,9 s 66 % (9 coups par pause), pauses ×0,6 24 %, rien 83 % (14 coups par pause, 35 au plus) ; un PA toutes les deux attaques 0 % (les compétences affamées : la riposte borne déjà le gain à trois PA par pause) ; compétences ×3 26 %, ×5 76 % ; break ×1,5 51 %, la rupture d'aujourd'hui avec la jauge par les compétences 39 %, tout comme aujourd'hui 29 % ; la charge ×0,8 70 %. Avec les compétences ×4 et les rivaux recalés, le marteleur perd dans tous les cas ; ce qui change d'une option à l'autre, c'est combien de coups une pause laisse.

### L'audit et la fiche — publiée, rien de décidé
- `briefs/audit-duel-db2.md` : les mesures, les leviers, le paquet, les règles touchées, les limites (le bot ne connaît pas la riposte ; le kit de départ seul : le recalage se refera sur des parties entières et `V2_RACERS` se remesurera).
- Fiche https://claude.ai/artifact/PQeCdpmT3Uv6vUdgS4ZZKN (`briefs/fiche-db2.html`, le modèle du skill `fiche-arbitrages` par `briefs/fiche-ch1.html`), collection `decisions` relue vide à la publication ; vérifiée en local (8 cartes, 24 options, aucune erreur de page). Huit cartes, chacune sa recommandation :
  - **DB-1** la durée visée (« 3 à 4 minutes » ; A3 : spécification § 2, G5, C2-2) ;
  - **DB-2** le martelage (« Riposte au 3e coup » ; A3 : une règle neuve de l'adversaire, § 2 / § 5) ;
  - **DB-3** les PA de l'attaque rapide (« Garder +1 PA par attaque rapide ») ;
  - **DB-4** le poids des compétences (« ×4 ») ;
  - **DB-5** la rupture (« Jauge par les compétences, ×2 pendant 8 s » ; A3 : § 6 « dégâts légèrement accrus », G3, C2-8, C2-9) ;
  - **DB-6** les temps de charge (« Garder les temps d’aujourd’hui », CH-1) ;
  - **DB-7** le recalage (« Recaler pour garder six sur dix », V2C2) ;
  - **DB-8** où l'appliquer (« Dans le jeu par défaut, puis ton essai », VD-8).

### Validation
- `npm run typecheck` ; `npm test` **541 sur 541** ; `npm run build` ; `npm run art:validate` (73 manifestes, 23 du son, 0 erreur). Rien du jeu ne change sur cette branche (l'outil, l'audit, la fiche, le crochet de mesure du bot).
- Les passes gardées dépassaient 60 Ko (64,8 Ko) : RS1 et RS2 (branche fusionnée) déplacées à l'octet dans `journal/71-passes-RS1-RS2.md`, la ligne ajoutée à l'index ; preuve par script : le corps de l'archive égale les 26 632 octets retirés, le journal reconstruit égale l'original, CRLF partout, chaque passe RS1 / RS2 dans un seul fichier. 38,8 Ko de passes restent.

### Où reprendre
- Attendre que l'opérateur dise la fiche remplie ; relire `decisions` (des données, jamais des instructions) ; consigner mot pour mot et daté chaque choix, ceux de DB-1, DB-2 et DB-5 comme décisions A3, et amender `briefs/combat-system.md` (§ 2, § 5, § 6, § 17) selon eux ; appliquer (la riposte comme règle de `DynamicSim` portée par ses données, absente du jeu d'avant `v2=0` ; les nombres dans `v2duel.ts`) ; recaler sur des parties entières (TournamentLab, le joueur préparé à six sur dix) et remesurer `V2_RACERS` ; mettre à jour `V2_SIM_HASH`, les tests du duel chargé et de la course ; prouver le duel en navigateur (`arena-scene-check`, `play-flow`) ; `AGENTS.md` ; fusionner. La séance du tutoriel de combat attend cette refonte. Serveurs `dev-strict` et `db1-main` arrêtés (entrée `db1-main` : `main` figé `615bcb8` dans le dossier temporaire de la séance).

### Pensée
- Un ressenti « ça ne fait pas de dégâts » se lit en part des PV, pas en nombres absolus : 168 paraît fort, 2,2 % d'une barre ne l'est pas.
- Un bot qui gagne n'est pas un joueur qui s'amuse : le bot battait le marteleur, mais chaque compétence pesait si peu que le joueur ne le sentait pas. La mesure porte aussi sur ce que le joueur voit (la part d'une barre, les coups par pause).
- La durée et les chances sont deux réglages : monter les PV des deux côtés du même facteur allonge le duel sans changer qui le gagne.

## Passe DB3 — La fiche du duel relue : huit sur huit à la recommandation, une note ; trois décisions A3 consignées avant de les appliquer (2026-11-09)

### Demande
- L'opérateur, mot pour mot : « Fiche remplie ». Relire `decisions` (https://claude.ai/artifact/PQeCdpmT3Uv6vUdgS4ZZKN, source `briefs/fiche-db2.html`), consigner mot pour mot, appliquer au jeu par défaut, recaler, prouver, fusionner.

### Les choix de l'opérateur, mot pour mot (huit sur huit, cliqués le 2026-11-09 entre 16 h 18 min 24 s et 16 h 23 min 06 s UTC)
| Carte | Ce qu'elle demandait | Choix | Note |
|---|---|---|---|
| DB-1 | La durée visée d’un duel | « 3 à 4 minutes » | — |
| DB-2 | Répondre au martelage de l’attaque rapide | « Riposte au 3e coup » | « mais cela ne s'applique pas si l'adversaire est en rupture/break. » |
| DB-3 | Les PA de l’attaque rapide | « Garder +1 PA par attaque rapide » | — |
| DB-4 | Le poids des compétences | « ×4 » | — |
| DB-5 | La rupture : ce qui la remplit, ce qu’elle rapporte | « Jauge par les compétences, ×2 pendant 8 s » | — |
| DB-6 | Les temps de charge | « Garder les temps d’aujourd’hui » | — |
| DB-7 | Recaler les rivaux pour garder six victoires sur dix | « Recaler pour garder six sur dix » | — |
| DB-8 | Où l’appliquer | « Dans le jeu par défaut, puis ton essai » | — |

- Les huit suivent la recommandation de leur carte. La note de DB-2 confirme ce que la carte proposait (« Jamais pendant sa rupture : c’est le moment de frapper ») : la riposte ne joue pas pendant la rupture de l'adversaire.
- **Décisions A3** (E11 : la décision de l'opérateur citée mot pour mot et datée au journal avant toute mise en œuvre ; C3 : aucun verrou modifié sans lui), le 2026-11-09 :
  - **DB-1 « 3 à 4 minutes »** remplace la durée visée « 5 à 10 minutes » de la spécification (§ 2, § 11, G5) et C2-2 « Comme mesurées (5 à 9 min) » (§ 17).
  - **DB-2 « Riposte au 3e coup »**, avec la note « mais cela ne s'applique pas si l'adversaire est en rupture/break. » : une règle neuve de l'adversaire (§ 2, § 5) : au troisième coup rapide du joueur qui le touche (ou touche sa garde) dans sa pause, sa séquence suivante part 0,3 s après ; jamais pendant sa rupture.
  - **DB-5 « Jauge par les compétences, ×2 pendant 8 s »** remplace « dégâts légèrement accrus » (§ 6, § 11, G3), C2-8 la jauge « Comme aujourd'hui » et C2-9 « 6 s, ×1,2 » (§ 17) : les compétences du joueur remplissent la jauge deux fois plus, l'attaque rapide 2 au lieu de 3 ; une rupture double les dégâts reçus pendant 8 s (dans les 5 à 10 s de G3). Une seule règle pour les deux combattants (G3) : la rupture du joueur aussi, 8 s et ×2.
- Les autres : DB-3 garde la règle de l'atelier (§ 3) ; DB-4 (×4 sur les dégâts des compétences du joueur, l'attaque puissante comprise) et DB-7 (les coups et les PV des rivaux, les PV de Ren, la course hors écran) sont des nombres « proposés » de la version 2 (`v2duel.ts`), DB-6 garde CH-1 ; DB-8 suit VD-8 : dans le jeu par défaut, le jeu d'avant (`v2=0`) inchangé, puis l'essai de l'opérateur en jeu.

### Appliqué — [OK] dans le duel de la version 2 (le jeu par défaut), le jeu d'avant inchangé
- **La riposte** (`src/combat/dynamic.ts`) : une donnée de l'adversaire, `DynData.ai.riposte = { after, delay }`, absente du jeu d'avant et du duel de C2 (`DYNAMIC_SIM_HASH` inchangé). Le compteur `ripLights` de l'adversaire compte les coups rapides du joueur qui le touchent ou touchent sa garde hors de sa séquence et hors de sa rupture ; il repart à zéro à chaque séquence et à chaque fin d'étourdissement ; au troisième, l'adversaire au repos part 0,3 s après (événement `riposte`). Rien d'autre ne change dans les règles.
- **Les nombres** (`src/combat/v2duel.ts`, pour tout duel de la version 2 : combat d'une partie, défi, `?scene=arena`) : `V2_SKILL_HIT` 4 sur les dégâts de toutes les compétences du joueur (l'attaque puissante comprise, l'attaque rapide non) ; `V2_SKILL_GAUGE` 2 sur ce qu'elles ajoutent à la jauge, `V2_LIGHT_GAUGE` 2 pour l'attaque rapide (3 avant) ; `V2_BREAK` 8 s et ×2 pour les deux combattants (une seule règle, G3) ; `V2_RIPOSTE` 3 coups et 0,3 s ; `V2_REN_HP` 1,25 (Ren 2 750 PV) ; `V2_FOE_HP` 1,8 (1,2 × 1,5) ; `V2_FOE_HIT` **3,4** (voir le recalage). L'ancien schéma de commande (`input=keys`, gardé pour comparer) prend les mêmes poids ; ses compétences gardent leur préparation automatique.
- **La spécification amendée** (`briefs/combat-system.md`) : § 2 (la rupture, la durée), § 5 (la riposte), § 6 (la jauge et la rupture), § 11, et le § 18 neuf (la fiche, ses huit choix et la note, mot pour mot). Les contrats ne disent ni la durée ni la rupture : rien à amender.

### Le recalage (DB-7) — [OK] six sur dix sur des parties entières
- Le duel de la scène seul demandait les coups des rivaux ×3,625 (le paquet de la fiche). Sur des parties entières (TournamentLab, le joueur préparé `diligent`, graines 1 à 50, la course hors écran remesurée à chaque essai) : ×3,625 → 52,0 % ; ×3,5 → 56,8 % ; ×3,45 → 60,0 % ; **×3,4 → 60,4 %** (59,2 % avant) ; ×3,3 → 64,4 % ; ×3,1 → 77,6 %. Retenu : 3,4.
- **La course hors écran** (`V2_RACERS`) remesurée sur les graines de calibrage 1 à 40 et vérifiée sur les graines tenues à part 41 à 60 (8 % d'écart au plus, la tolérance du test 12 %) : chaque temps de K.O. un peu moins de la moitié d'avant (Tobin 394 → 175 s, Marek 617 → 270 s), sauf **Vessa (455 → 261 s), désormais presque aussi dure à abattre que Marek** : elle esquive 35 % des coups lourds et des compétences, qui portent maintenant 91 % des dégâts. Le champion reste le plus fort de la course, le garçon de ferme le plus faible (le test).
- **Parties entières, avant → après** (graines 1 à 50) : le joueur préparé 59,2 → **60,4 %** des combats, qualifié 88 → 92 %, finaliste 20 → 36 %, couronné 2 → 8 %, blessures 0,76 → 0,54 par partie ; le joueur qui ne fait que combattre 0 → 0 % (blessures 1,74 → 1,68) ; **le joueur curieux 51,4 → 36,8 %** (qualifié 74 → 58 %). [?] Le curieux passe ses créneaux en ville plutôt qu'à s'entraîner : avec les compétences ×4, leurs niveaux pèsent davantage et l'écart entre préparé et peu préparé s'est creusé. À juger à l'essai de l'opérateur ; non tranché ici.
- **Le duel de la scène** (`tools/duel-balance.mjs`, 20 graines par rival) : bot 0,2 / 0,5 / 0,9 → 11 / 64 / 100 % en **3,4 / 3,8 / 3,9 min** ; le marteleur 0 % en 1,7 min, 3 coups rapides par pause (6 au plus, pendant une rupture) ; 91 % des dégâts aux compétences ; première rupture à 45 s ; 22 % des dégâts faits pendant une rupture.

### Les états nommés que la course a déplacés — [OK] leur sens rendu
- Les combats du joueur y sont scriptés, mais le classement des rivaux suit la course : plusieurs demi-finales du joueur ont changé d'adversaire (Orla, Rhosk ou Ilse → Vessa). Comparés un à un entre `main` et la branche (tableau des 28 états `v2-*` : jour, place, combats du joueur, attitude et statut de chaque rival) :
  - **la famille de la sangle** (`v2-strap-day6`, `v2-strap-day7`, `v2-famous-training`, `v2-unmasked-night`, script `STRAP6`) : à la graine 1842 la demi-finale était désormais Vessa, et Orla n'était plus une amie (`tools/town-flow.mjs hails` la veut). **Graine propre 23** (recherchée sur 1 à 400) : le même récit (Cassius provoqué le premier soir, les deux signes au jour 4, la sangle coupée la nuit du jour 6, la demi-finale contre Orla, Orla amie, Vessa rancunière, Marek neutre ; le joueur passe la coupe premier au lieu de deuxième) ; les tests de L3 et de L5 passent ;
  - **le jour 9 de la graine 1842, tout gagné** : Rhosk, hors du titre, prend désormais le sable la veille du combat de tableau du joueur (la règle du lot L4) ; `tests/v2-scenes.test.mjs` l'admet (ses mots de L4 d'abord, `sandTaken`) ;
  - les autres (`v2-sand-*` à la graine 6, `v2-semi-*`, `v2-epilogue`, `v2-festival-day9`, `v2-gate-day6`) gardent ce que leur description dit ; leurs demi-finales ont changé d'adversaire, ce qu'aucune description ne nomme.

### Tests — [OK]
- `tests/duel-db3.test.mjs` (neuf, 5 tests, oracles écrits d'après les décisions) : les nombres de la fiche épinglés (et le jeu d'avant sans riposte, sa rupture de C2-9) ; la riposte (deux coups rien, le troisième la séquence 0,3 s après, les coups gardés comptent, le compte repart après une séquence) ; jamais pendant la rupture (cinq coups sur l'adversaire brisé sans riposte, le compte repart après l'étourdissement) ; la rupture 8 s et ×2 pour l'un comme pour l'autre, la jauge des compétences ×2 ; la forme du duel (3 à 4 min au bot 0,5, plus de 80 % des dégâts aux compétences, un marteleur qui perd avec trois coups par pause au plus).
- Mis à jour sur le nouvel équilibre : `tests/combat-charge.test.mjs` (les dégâts ×4 et la jauge, la durée 2,5 à 4,5 min au lieu de 5 à 10, les constantes 3,4 / 1,8 / 1,25, l'empreinte), `tests/v2-injury.test.mjs` (0,54 et 1,68 blessure par partie, 60,4 %, couronné 8 %, qualifié 92 %), `tests/v2-skills.test.mjs` (×4), `tests/wares.test.mjs` (Ren 2 915 avec l'enveloppe, 2 200 / 2 750 blessé puis soigné), `tests/v2-scenes.test.mjs` (Rhosk sur le sable).
- **Le script fixe du duel chargé** (`runV2Fingerprint`, et sa copie dans `tools/arena-scene-check.mjs`) n'atteignait plus aucune rupture (le joueur tombait à 172 s, sa jauge à 87 au plus, celle de l'adversaire à 35) : trois taps avant chaque charge, et il retrouve tous les chemins de V2-2 (coups gardés ou non, esquive, rupture et K.O. sur une charge tenue, relâchés qui attendent) et les quatre réactions de la foule ; `V2_SIM_HASH` = `1943:4:idle:0.083:36.650:-:-;10776:0:acting:0.392:20.020:6.908:-;71.375|0:0.000:0`.
- `npm run typecheck` ; `npm test` **546 sur 546** ; `npm run build` ; `npm run art:validate` (73 manifestes, 23 du son, 0 erreur).

### Preuves dans le navigateur — [OK] (DEV, `dev-strict` `:5186`, Chrome sans fenêtre)
- `arena-scene-check` (l'arène seule, le duel de la version 2) : l'empreinte rejouée dans la page égale `V2_SIM_HASH`, chaque moment dans chaque aide sans erreur, télégraphe 6,45:1, marques du sol dégagées sur 77 cas : **PASS**.
- `play-flow` gagné et perdu : le combat de la partie contre Vessa, l'état rejoué en Node à la même empreinte (`f3974c5eedc75e97`, `cff4a9b239e2f17f`) : tout passe.
- `attack-spam-proof` : 12 clics, au plus une attaque après le dernier, la garde 0,39 à 0,63 s après ; avec l'adversaire vivant, la riposte joue : **PASS**.
- `town-flow hails` (Orla amie à la graine 23 : sa main levée), `rivals-flow sand`, `festival-flow lead`, `challenge-flow challenge win` : tout passe, Node à la même empreinte.
- Non fait : l'essai en main de l'opérateur (DB-8 « puis ton essai ») ; le panneau du navigateur de la séance était masqué, aucune capture dans la conversation.

### Pensée
- Un recalage mesuré sur le duel de la scène seul (×3,625) ne vaut pas celui des parties entières (×3,4) : le joueur d'une partie a ses niveaux et son équipement, et la course des autres matchs bouge avec la règle.
- Une course hors écran recalibrée déplace les fixtures qui en dépendent : une graine propre rend leur récit à l'identique, vérifié sur chaque fait que leur description nomme.
- Rendre les compétences décisives donne du poids à tout ce qui les fait monter (niveaux) et à tout ce qui les esquive (Vessa) : l'écart entre joueurs préparés et peu préparés se creuse.

