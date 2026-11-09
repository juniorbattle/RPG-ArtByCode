# Audit de l'équilibre du duel de la version 2 (Passe DB2, 9 novembre 2026)

Demande : le retour de l'opérateur après son premier essai de la version 2 (jeu par défaut), mot pour mot :

> « Je trouve que les combats sont tres longs... il faut faire en sorte que les competences ou la zone de break fasse vraiment des degats, surtout quelle prend du temps a etre accessible »
>
> « mais on doit vraiment trouver une solution pour que les attaques soient significatifs car elles degats cree a peine des degats meme les competences, et le mieux est de spam l'attaque car on peut attaquer presque 10 fois avant que l'ennemie attaque et donc on cumule des ap pour esquiver... il faut retravailler cela pour que notre systemne de combat soit optimale »

Outil : `node tools/duel-balance.mjs` (Node seul). Le duel du jeu (`v2DuelData` : le kit de départ au niveau 1, sans préparation ni équipement,
comme `?scene=arena&foe=<id>`), les sept rivaux, 20 graines chacun, le bot du jeu (`runV2BotDuel`) aux adresses 0,2 / 0,5 / 0,9, et un
« marteleur » qui ne fait que l'attaque rapide entre les séquences adverses et se défend comme le bot (adresse 0,5).

## 1. Ce que dit le duel d'aujourd'hui

| Mesure | Aujourd'hui |
|---|---|
| Durée d'un duel (médiane, sept rivaux) | 6,8 min (bot 0,2) · **8,0 min** (bot 0,5) · 8,4 min (bot 0,9) · 7,2 min (marteleur) |
| Victoires | 1 % · **54 %** · 99 % · marteleur 37 % |
| PV des rivaux | 3 744 (Vessa) à 9 180 (Rhosk) ; Marek 7 680 ; Ren 2 200 |
| Attaque rapide | 10 dégâts = **0,11 à 0,27 % des PV** adverses ; cycle 0,58 s (17 dégâts/s) ; 375 à 918 coups pour un K.O. ; +1 PA, +3 de jauge |
| Coup éclair (3,4 s de charge, 2 PA) | 75 = 0,8 à 2 % des PV ; 19 dégâts par seconde du temps qu'il prend |
| Estocade (7,65 s de charge, 4 PA) | 168 = **1,8 à 4,5 % des PV** ; 20 dégâts par seconde, contre 17 pour le martelage : à peine mieux, pour 4 PA |
| Attaques rapides possibles dans une pause adverse | 6 à 21 en théorie (pauses de 3,5 à 12 s) ; le marteleur en place **14 en médiane, 31 au plus** |
| PA du martelage | +1 par coup, plafond 5 : toujours plein, ses PA vont aux esquives (12 à 16 par duel) |
| La rupture (break) | 34 attaques rapides de suite pour la remplir ; première rupture à 86 s (bot 0,5) ou 43 s (marteleur) ; elle rapporte ×1,2 pendant 6 s : **8 % des dégâts** du bot y sont faits |
| Part des dégâts du bot 0,5 | attaque rapide 26 %, compétences 74 % |

Lecture : chaque coup compte pour presque rien (une compétence de 7,65 s fait 2 % d'une barre de vie), la rupture arrive tard et ne rapporte
qu'un cinquième de plus, et une pause adverse laisse le temps de dix à trente attaques rapides qui remplissent les PA. Le duel dure parce que
les PV adverses (×10 du prototype, puis ×1,2 en V2C2) ont été calés pour 5 à 10 minutes (G5, C2-2) avec des coups faibles.

## 2. Les leviers, mesurés un à un

Sur le duel d’aujourd’hui, 12 graines par rival, bot 0,5 / marteleur (victoires, durée médiane) :

| Levier seul | Bot 0,5 | Marteleur | Remarque |
|---|---|---|---|
| Aujourd'hui | 60 %, 8,2 min | 39 %, 7,2 min | 14 attaques par pause |
| Riposte après 3 attaques rapides | 17 %, 7,3 min | **0 %**, 3,3 min | l'adversaire répond au 3e coup ; jamais pendant sa rupture |
| Attaque rapide plus lente (0,9 s) | 32 %, 7,8 min | 6 %, 8,3 min | 9 attaques par pause |
| PA un coup sur deux | 52 %, 7,3 min | 39 % | sans effet sur le marteleur (PA déjà pleins) |
| Compétences ×3 | **100 %, 3,7 min** | 39 % | la compétence devient le bon choix |
| Break ×2, 8 s | 68 %, 7,8 min | 64 % | profite surtout au marteleur, qui remplit la jauge le plus vite |
| Jauge des compétences ×2 | 67 %, 8,1 min | 39 % | première rupture à 34 s au lieu de 85 s |
| PV des rivaux ×0,5 | 100 %, 4,5 min | 95 % | plus court, mais tout devient facile |
| Pauses adverses ×0,6 | 11 %, 6,2 min | 1 % | moins d'attaques par pause, mais plus dur |

Aucun levier seul ne répond aux trois constats : il faut un paquet, puis recaler les rivaux pour garder les chances d'aujourd'hui.

## 3. Le paquet proposé, et sa durée

Proposé : la riposte après 3 attaques rapides ; les compétences ×4 ; la jauge remplie surtout par les compétences (×2 ; l'attaque rapide 2 au lieu
de 3) ; le break ×2 pendant 8 s ; recalé par les coups des rivaux ×2,5, leurs PV ×1,5 et ceux du joueur ×1,25 (sur ceux d'aujourd'hui).

| Mesure | Aujourd'hui | Proposé |
|---|---|---|
| Durée médiane (bot 0,2 · 0,5 · 0,9) | 6,8 · 8,0 · 8,4 min | **3,2 · 3,7 · 3,9 min** (2,9 à 4,5 min selon le rival, bot 0,5) |
| Victoires (bot 0,2 · 0,5 · 0,9) | 1 · 54 · 99 % | 9 · **59** · 99 % |
| Marteleur | 37 %, 7,2 min | **0 %**, 1,6 min |
| Attaques rapides par pause (marteleur) | 14 (31 au plus) | 3 (6 au plus, pendant une rupture) |
| Estocade contre Marek | 2,2 % des PV | 5,8 % ; **11,7 % pendant sa rupture** |
| Première rupture (bot 0,5) | 86 s | 45 s |
| Part des dégâts faite pendant une rupture | 8 % | 22 % |
| Part des compétences dans les dégâts | 74 % | 91 % |

La durée se règle à part, sans changer les chances : les PV des deux côtés ensemble ×0,8 / ×1,25 / ×1,75 / ×2,5 sur ce paquet donnent 2,4 /
3,7 / 5,1 / 7,5 min, à 58-61 % de victoires pour le bot 0,5.

## 4. Ce que touchent les choix (décisions A3)

- La durée visée « 5 à 10 minutes » (spécification § 2, G5 ; C2-2 « Comme mesurées (5 à 9 min) »).
- La riposte : une règle neuve de l'adversaire (§ 2, § 5 : les pauses suivent son niveau).
- Le break au-delà de « dégâts légèrement accrus » (§ 6, G3 ; C2-9 « 6 s, ×1,2 » ; C2-8 la jauge « Comme aujourd'hui »).
- Les PA de l'attaque rapide (§ 3, « +1 PA par attaque légère qui touche ») : gardés dans la recommandation.

Chacun de ces choix, s'il est pris, est une décision A3 : cité mot pour mot et daté au journal avant toute mise en œuvre. La fiche :
`briefs/fiche-db2.html`.

## 5. Limites de la mesure

- Le bot ne connaît pas la riposte : il place environ trois attaques rapides par pause de lui-même. Un joueur humain apprendra à charger après
  deux ou trois coups ; le marteleur mesure le pire cas, pas un humain qui s'adapte.
- Le kit de départ au niveau 1, sans préparation ni équipement. Après la fiche, le recalage se refait sur des parties entières (TournamentLab,
  le joueur préparé à six victoires sur dix comme en V2C2) et la course hors écran (`V2_RACERS`) se remesure.
