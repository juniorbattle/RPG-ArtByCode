# Audit du combat : un duel qui pèse et qui tient le rythme (Passe DB5, 9 novembre 2026)

La demande de l'opérateur, mot pour mot, avant de remplir la fiche DB4 :

> « Avant de remplir la fiche je pense que nous avons besoin d'un audit concret pour bien equilibre notre systeme de jeu, je veux qu'un combat basique dure en 2 et 5 min.  +5 min peut etre exceptionnellement des combats epiques car l'adversaire aura une barre de vie monstrueuses . mais il faut que les attaques et degats aient des valeurs signifiantes une attaque niveau 5 peut enlever 1/4,/1/3 de de la barre de vie d'une ennemie et plus si l'adversaire est break et les competences plus faibles sont aussi signifiantes mais clairement on doit ressentir l'impact d'une strategie qui permet de briser la garde l'ennemie afin d'infliger de lourd degats, bref tel un rpg qui se respecte mais donc toujjours avec une coherence gameplay car le combat gameplay est important et essentiel pour notre jeu et la rejouabilite, il faut pas que ce soit trop lent, ni trop rapide et surtout pas redondant , il faut cela nous tienne en rythme »

Outil : `node tools/duel-balance.mjs --audit` (Node seul) : le duel du jeu contre les sept rivaux, 20 graines chacun, le bot du jeu (joueur faible 0,2, moyen 0,5, fort 0,9) et un marteleur (l'attaque simple seule). Les pourcentages sont des parts de la barre de PV de l'adversaire.

## 1. Les cibles, tirées de ses mots

| # | Cible | Mesure |
|---|---|---|
| C1 | Un combat de base dure 2 à 5 minutes | la durée médiane, et celle de chaque rival |
| C2 | Un combat épique dure plus, contre une barre de PV monstrueuse | la durée d'un combat désigné épique |
| C3 | La compétence la plus forte au niveau 5 enlève 1/4 à 1/3 de la barre, plus sur une rupture | l'Estocade (la plus forte du kit de départ) touchée en plein, sur la garde, sur une rupture |
| C4 | Les compétences plus faibles comptent aussi | le Coup éclair |
| C5 | Briser la garde pour infliger de lourds dégâts : la stratégie se sent | la part des dégâts faite pendant les ruptures ; l'écart entre un coup gardé, un coup franc et un coup sur une rupture |
| C6 | En rythme : ni trop lent ni trop rapide, pas redondant | un moment fort (une rupture, ou une compétence de 4 % de la barre ou plus) toutes les 10 à 20 s ; aucun geste qui revient sans cesse ; le marteleur perd |
| C7 | La cohérence : l'escalier des joueurs gardé | faible, moyen, fort autour de 10 / 60 / 95 % |

## 2. Le duel d'aujourd'hui (DB3) contre ces cibles

| Cible | Aujourd'hui | Verdict |
|---|---|---|
| C1 durée | 3,8 min au joueur moyen (rivaux 2,9 à 4,4) | tenu |
| C3 Estocade | 5,8 % en plein au niveau 1, 9,5 % au niveau 5 ; **le bot ne la place jamais** (4 PA, la riposte borne le gain à trois par pause) | **non** |
| C4 Coup éclair | 2,8 % en plein, 1,1 % gardé, 5,4 % sur une rupture | **non** |
| C5 rupture | 22 % des dégâts pendant les ruptures ; un coup sur une rupture vaut ×2 d'un coup franc, mais tous les coups sont petits | faible |
| C6 rythme | un « moment » toutes les 5,5 s, mais ce sont de petits coups : **le joueur relance le Coup éclair 30 fois par duel** et place plus de 80 attaques simples | **redondant** |
| C7 escalier | 11 / 64 / 100 % ; marteleur 0 % | tenu |

Lecture : la durée est bonne, mais elle est faite d'une longue suite de petits coups identiques. Rien ne pèse, et la rupture n'est qu'un bonus.

## 3. Ce qui manque, et les leviers

1. **Des compétences qui pèsent** : leurs dégâts exprimés en part de la barre (l'Estocade à 20 % au niveau 1, donc 28 % au niveau 5 par le +10 % de chaque niveau), les autres au prorata de leur temps de charge (Coup éclair 9 %, attaque puissante 4,4 %).
2. **Une garde à briser** : hors de leur rupture, les rivaux gardent 90 % des attaques du joueur, et la garde réduit de 80 % (60 % aujourd'hui, une règle pour les deux combattants). Une Estocade gardée fait 4 %, franche 20 %, sur une rupture 40 % : **un facteur 10 entre jouer contre la garde et jouer la rupture**.
3. **Des recharges** : sans elles, le joueur relance sans fin la même compétence (redondance). Une recharge de 5 fois le temps de charge (Coup éclair 17 s, Estocade 38 s) le fait tourner entre ses compétences. La spécification laissait cette porte ouverte (G5 : « cela peut etre integre si on juge que le jeu est pas assez structure »).
4. **Une rupture qui laisse frapper fort** : étourdissement de 10 s (le haut des 5 à 10 s de l'atelier) au lieu de 8 : l'Estocade (7,65 s de charge au niveau 1) tient dans une rupture ; jauge de 70 au lieu de 100, pour deux ou trois ruptures par combat.
5. **Les coups des rivaux recalés** pour garder l'escalier.
6. **Les combats épiques** : PV ×2,5, des coups plus légers, le même poids relatif des gestes.

## 4. Le modèle proposé (M) et ce qu'il donne

M : attaque simple 0,5 % ; Estocade 20 % au niveau 1, les autres au prorata ; rivaux qui gardent 90 % hors rupture, garde à −80 % ; recharge 5 × le temps de charge ; jauge 70, étourdissement 10 s, rupture ×2 ; riposte au 3e coup et +1 PA par attaque simple gardés ; coups des rivaux ×1,2 (sur ceux de DB3).

| Cible | Aujourd'hui | M (niveau 1) |
|---|---|---|
| C1 durée (joueur moyen) | 3,8 min (rivaux 2,9-4,4) | **3,0 min (rivaux 2,6-3,4)** |
| C3 Estocade franc / gardé / rupture | 5,8 % / — / — (jamais placée) | **20 % / 4 % / 40 %**, 2,3 fois par combat ; au niveau 5 : **34 % / 7 % / 62 %** |
| C4 Coup éclair | 2,8 / 1,1 / 5,4 % | **9 / 1,8 / 18 %** ; au niveau 5 : 15 / 3 / 28 % |
| C5 dégâts pendant les ruptures | 22 % | **37 %** (54 % au niveau 3, 67 % au niveau 5) ; 2,5 ruptures par combat, la première vers 40 s |
| C6 rythme | un petit coup toutes les 5,5 s ; Coup éclair ×30 | **un moment fort toutes les 16 s** ; par combat : 2,3 Estocades, 6,6 Coups éclairs, 2,5 ruptures |
| C7 escalier | 11 / 64 / 100 % | **14 / 61 / 90 %** ; marteleur 0 % |
| C2 épique (PV ×2,5, coups ×0,45) | — | **6,7 min**, 5,9 ruptures, 59 % au joueur moyen |

Chaque pièce retirée, mesurée (joueur moyen) :

| Sans… | Effet |
|---|---|
| les recharges | 1,8 min, 91 % : le Coup éclair revient ~15 fois, l'Estocade jamais |
| les 10 s d'étourdissement (8 s, DB-5) | l'Estocade ne passe plus jamais dans une rupture au niveau 1 |
| la garde à −80 % (−60 %) | 2,4 min, 30 % des dégâts en rupture, une Estocade gardée à 8 % |
| une attaque simple à 0,5 % (1 %) | 2,3 min, la moitié des dégâts par l'attaque simple |

Le poids de l'Estocade, recalé à environ 60 % : 15 % (21 % au niveau 5) → ~3,5 min ; **20 % (28 %) → ~3,0 min** ; 25 % (35 %) → ~2,5 min.

## 5. La progression

Le joueur du laboratoire garde ses compétences au niveau 1 tout le tournoi (vérifié sur 20 parties ; la chute du joueur « curieux » relevée en Passe DB3 ne venait donc pas des niveaux). Un joueur qui les monte raccourcit ses combats : niveau 3 → 2,1 min (88 %), niveau 5 → 1,5 min (96 %). Des adversaires plus endurants aux derniers jours le ramènent dans la fourchette : niveau 3 contre PV ×1,4 → 2,8 min (69 %) ; niveau 5 contre PV ×2 → 2,8 min (74 %).

## 5 bis. L'équipement (Passe DB6)

La demande, mot pour mot : « mais n'oublie pas qu'il y a aussi l'amelioration des armes et armures donc attaque defense et etc... ».

Ce que l'équipement change dans le duel aujourd'hui (`src/simulation/gear.ts`, `v2gear.ts`, `v2Mods`) :

| Source | Attaque | Défense et le reste |
|---|---|---|
| Arme | lame importée ×1,15 ; sabre ×1,12 (charge ×0,92) | — |
| Forge | +8 % par palier, trois paliers (×1,24) | — |
| Pierre à aiguiser, entraînement | ×1,05 ; +5 % par séance, deux (×1,10) | — |
| Armure | — | dégâts reçus ×0,94 (veste), ×0,88 (cotte, charge ×1,05), ×0,92 (cuirs, jauge ×0,92), ×0,86 (haubert) |
| Accessoires | — | PA +1, jauge ×0,85 à ×0,95, charge ×0,9, effets ×1,3, PV ×1,03 à ×1,06 |

Au maximum, l'attaque monte à ×1,65 ; avec le niveau 5 des compétences (×1,4), ×2,3. Le joueur du laboratoire s'équipe peu (×1,05 à ×1,10 sur l'attaque, ×0,94 sur les dégâts reçus) : le recalage de DB3 vaut pour lui.

Les quatre états d'équipement mesurés : 0 rien ; 1 ce que porte le joueur du laboratoire ; 2 la lame au palier 1, une pierre, une séance, la cotte, l'enveloppe ; 3 la lame au palier 3, une pierre, deux séances, la cotte, l'enveloppe, l'anneau.

Les règles fixent le rythme de la progression : l'entraînement monte une compétence d'un niveau par créneau, jusqu'au niveau 3 ; les niveaux 4 et 5 viennent des défis gagnés ; l'équipement s'achète avec les pièces. Une courbe attendue : poule (jours 2 à 5) niveau 1-2, équipement 1 ; tableau (jours 6 à 8) niveau 3, équipement 2 ; finale (jour 10) niveau 3, équipement 3.

La progression mesurée (10 graines par rival, le joueur moyen ; tableau = jours 6 à 8, finale = jour 10 ; durée, victoires, Estocade franche / sur une rupture) :

| État du joueur | DB5 tel quel (tableau ×1,4, finale ×2,5) | Attaque d'équipement ÷2, tableau ×1,6, finale ×3,5 |
|---|---|---|
| Poule, attendu (niveau 1, équipement 1) | 2,9 min, 67 %, 23 / 44 % | 3,0 min, 67 %, 22 / 42 % |
| Poule, en avance (niveau 3, équipement 3) | 1,3 min, 100 %, 44 / 83 % | 1,4 min, 97 %, 35 / 66 % |
| Tableau, en retard (niveau 1, rien) | 3,5 min, 34 % | 3,6 min, 23 % |
| Tableau, attendu (niveau 3, équipement 2) | 2,2 min, 87 %, 27 / 50 % | 3,0 min, 86 %, 20 / 38 % |
| Tableau, en avance (niveau 5, équipement 3) | 1,2 min, 100 %, 40 / 76 % | 1,9 min, 96 %, 27 / 54 % |
| Finale, attendue (niveau 3, équipement 3) | 3,0 min, 100 % | **5,1 min**, 94 % |
| Finale, en retard (niveau 1, équipement 1) | 6,7 min, 73 % | 8,8 min, 59 % |

Avec l'attaque simple à 1 % (le choix DB5-5), le même réglage donne 2,2 / 2,4 / 4,2 min sur la courbe attendue (poule, tableau, finale) : plus de finale épique. Deux autres corrections mesurées : les rivaux seuls plus endurants (×1,8 au tableau, ×4 en finale, l'équipement inchangé) : 2,9 / 3,0 / 4,7 min, mais le joueur en retard ne gagne plus que 13 % au tableau ; l'attaque d'équipement ÷2 seule (×1,4 / ×2,5) : 3,0 / 2,6 / 3,7 min.

Lecture : sans correction, un joueur qui s'équipe et s'entraîne écrase la fin du tournoi (1,2 min au tableau, une finale de 3 minutes gagnée à 100 %). Réduire de moitié l'attaque que donnent l'équipement et l'entraînement (la défense entière) et faire monter les rivaux du tableau et de la finale garde la courbe attendue dans 2 à 5 minutes et rend la finale épique ; être en avance raccourcit encore les combats (une récompense), être en retard les rend durs. Les victoires sur la courbe attendue (86 à 94 %) se recaleront sur des parties entières (le joueur préparé à six sur dix, DB4-5).

## 6. Ce que touchent les choix

- **La durée** : sa demande « 2 et 5 min, +5 min pour l'épique » remplace DB-1 « 3 à 4 minutes » (décision A3, consignée au journal, Passe DB5).
- **Les recharges** : C2-5 « Aucune » et § 4 « Pas de recharge » (G5 l'ouvrait) : décision A3.
- **La rupture à 10 s** : DB-5 « ×2 pendant 8 s » (décision A3) : la changer demande son mot.
- **La garde à −80 %** : point de départ −60 % (CB-5), une règle pour les deux combattants : son choix.
- Le reste (poids des compétences, défense des rivaux, attaque simple, jauge, épiques, échelle, recalage) : des nombres « proposés ».
- **Après sa fiche** : le recalage sur des parties entières (TournamentLab) et la course hors écran, comme en DB3 ; les états nommés vérifiés ; les textes du tutoriel du premier duel relus.

## 7. Limites

- Le bot ne connaît ni la riposte ni la rupture : il lance sa plus forte compétence disponible. Un joueur qui garde son Estocade pour la rupture fera mieux ; un stratège programmé dans l'outil reste une heuristique trop simple pour le prouver, il n'est pas cité.
- Les recharges sont prototypées hors du jeu (le palier fermé tant qu'elles courent).
- Les mesures prennent chaque compétence au même pourcentage contre chaque rival ; les PV des rivaux se resserrent en conséquence (voir la fiche).
