# Les statistiques des combattants : une proposition (Passe DB7, 9 novembre 2026)

Les mots de l'opérateur, après la fiche DB5 et la mesure de l'équipement (journal Passe DB6) :

> « mais n'oublie pas qu'il y a aussi l'amelioration des armes et armures donc attaque defense et etc... »

> « Les donnes que je donne sont a titre suggestifs le but 'est pas de controller de maniere strict la duree du combat si un combat dure plus longtemps, c'est que c'est normal... moi je veux de la coherence... avoir des combats rythmes et passionnant avec des actions impactantes... mais nou'oublions pas que nous basons les actions d'un combattant par ses stats personnelles  ameliorer a travers les equipement  et/ou le niveau gagnes etc... bref c'est un rpg notre jeu , et je trouve que nous negligeons cette aspect »

Puis, à la question de préparer cette proposition : « Oui, prépare-la ».

Rien de ce document n'est dans le jeu. C'est un prototype hors écran (`node tools/duel-balance.mjs`, variante `rpg`), mesuré, et une fiche à remplir (`briefs/fiche-db7.html`).

## 1. Ce qui manque aujourd'hui

- Un combattant du duel de la version 2 n'a que des PV et une liste d'actions aux dégâts fixes (`src/combat/v2duel.ts`). Il n'a ni Attaque ni Défense.
- L'équipement et l'entraînement multiplient ces dégâts en pourcentages (`v2Mods`, `src/simulation/v2gear.ts`) :
  - la lame importée ×1,15, la forge +8 % par palier, la pierre ×1,05, une séance ×1,05 ;
  - la veste rembourrée fait recevoir ×0,94, la cotte ×0,88 ; l'anneau de fer remplit la jauge à ×0,85 ;
  - ces multiplications se cumulent (×1,65 sur l'attaque, ×2,3 avec les compétences au niveau 5 : journal Passe DB6).
- Les rivaux sont leur kit, avec des PV et des coups multipliés par deux constantes (`V2_FOE_HP`, `V2_FOE_HIT`). Aucun n'a de fiche qui dise qui il est.
- Le contrat du projet, § 7 : « Le jeu doit éviter qu'une unique statistique de niveau rende toutes les autres décisions secondaires. » Les statistiques doivent donc garder les couches de progression distinctes : les compétences, l'équipement, l'entraînement, et ce que Ren gagne en combattant.

## 2. La proposition

### 2.1 Quatre statistiques par combattant

| Stat | Ce qu'elle fait | Ren au départ |
|---|---|---|
| PV | la barre | 150 |
| Attaque (Atq) | les dégâts de ses coups | 10 |
| Défense (Déf) | les dégâts qu'il reçoit | 10 |
| Endurance (End) | sa jauge de résistance : ce qu'un coup y ajoute | 10 |

La Vivacité (la vitesse de charge) est laissée de côté : les temps de charge et les recharges (DB5-3) règlent déjà le tempo, et l'équipement qui touche la charge (les bottes, la cotte) garde son effet.

### 2.2 La formule

- **Dégâts d'un coup** = puissance de l'action × 2·Atq / (Atq + Déf).
  - À stats égales ×1 ; une Attaque double de la Défense ×1,33 ; une Attaque moitié ×0,67.
  - Jamais zéro, et chaque point de plus vaut un peu moins que le précédent (des rendements décroissants) : l'équipement et les niveaux ne s'emballent plus.
  - Une formule soustractive (Atq − Déf) tombe à zéro dès que la Défense rattrape l'Attaque : écartée.
- **Jauge** : ce qu'un coup ajoute à la jauge de l'adversaire × 10 / son Endurance.
- **La puissance des actions de Ren**, au niveau 1, sur une barre de 600 à stats égales :
  - l'attaque simple 6, soit 1 % (ton choix DB5-5) ;
  - l'Estocade 120, soit 20 % (DB5-1) ;
  - les autres compétences offensives en proportion de leur temps de charge ;
  - le niveau d'une compétence multiplie sa puissance (×1,0 à ×1,4, comme aujourd'hui).
- **La puissance des coups des rivaux**, à stats égales contre les 150 PV de Ren : le coup simple 4 % de la barre, le coup lourd 11 %, une compétence 17 %.
- Ce que DB4 et DB5 ont décidé reste en place, et ces mesures le contiennent :
  - la garde des rivaux à 90 %, la garde qui réduit de 80 % ;
  - une recharge de 5 × le temps de charge par compétence ;
  - la rupture de 10 s à dégâts ×2, la jauge de 70 ;
  - la riposte au 3e coup simple, jamais pendant une rupture.

### 2.3 L'équipement et l'entraînement en points

Chaque objet garde son rôle et son prix ; son pourcentage devient des points.

| Objet | Aujourd'hui | En points |
|---|---|---|
| Épée d'entraînement | — | — |
| Lame importée | dégâts ×1,15 | Atq +2 |
| Sabre de duelliste | dégâts ×1,12, charge ×0,92 | Atq +1,5 ; la charge gardée |
| Palier de forge (3 au plus) | +8 % chacun | Atq +1 chacun |
| Pierre à aiguiser (le prochain combat) | ×1,05 | Atq +0,5 |
| Séance d'entraînement (2 au plus, le prochain combat) | ×1,05 | +1 à la stat choisie (carte DB7-3) |
| Veste rembourrée | reçus ×0,94 | Déf +1 |
| Cuirs du quai | reçus ×0,92, jauge ×0,92 | Déf +1,5, End +1 |
| Cotte de mailles | reçus ×0,88, charge ×1,05 | Déf +3 ; la charge gardée |
| Haubert de chevalier | reçus ×0,86, charge ×1,04 | Déf +3,5 ; la charge gardée |
| Anneau de fer | jauge ×0,85 | End +2 |
| Perle de rivière | jauge ×0,88, PV ×1,03 | End +1,5, PV +5 |
| Bande de docker | PV ×1,06 | PV +9 |
| Médaille du pèlerin | PV ×1,05, effet ×1,15 | PV +8 ; l'effet gardé |
| Jeton du champion | PA +1, jauge ×0,95 | PA +1, End +0,5 |
| Ruban porte-bonheur, bottes rapides, charme de ferveur | PA, charge, effet | inchangés : ce ne sont pas des stats |

- La blessure garde sa règle : −20 % des PV par niveau.
- L'effet mesuré : tout équipé (arme au palier 3, pierre, deux séances) avec les compétences au niveau 5, Ren frappe ×1,8 en poule au lieu de ×2,3 aujourd'hui.
- Les états d'équipement de la mesure :
  - 1 : une séance, la veste ;
  - 2 : la lame importée au palier 1, une séance, la cotte, la bande ;
  - 3 : la lame au palier 3, la pierre, deux séances, la cotte, l'anneau, la bande.

### 2.4 La vigueur de Ren : ses PV montent quand il gagne

- Sans croissance, Ren aborde la finale avec ses 150 PV (et la bande) contre un rival devenu plus fort. Le joueur moyen la perd :
  - 33 % contre l'ensemble des rivaux ;
  - 0 % contre Marek.
- La proposition : **+12 PV par combat gagné**, du tournoi ou un défi, et seulement des PV.
  - Le parcours attendu : environ 185 PV au tableau (deux victoires de poule et un défi), 220 en finale.
  - Un niveau qui monterait tout ferait de lui la statistique unique dont le contrat parle (§ 7) : l'équipement, l'entraînement et les compétences gardent chacun leur part.

### 2.5 Les fiches des rivaux

Chaque rival a une fiche qui dit qui il est ; les PV restent dans les 500 à 700 de DB4-4.

| Rival | Ce qu'il est | PV | Atq | Déf | End | Joueur moyen en poule |
|---|---|---|---|---|---|---|
| Vessa Lark | la Lame vive : enchaînements rapides, repos courts ; le premier combat (jour 2) | 500 | 7 | 8 | 7 | 50 % |
| Tobin Fenn | l’Espoir : fougueux et vert | 520 | 9 | 8 | 8 | 100 % |
| Cassius Dree | un noble : escrime patiente, fentes soudaines | 560 | 11 | 10 | 9 | 100 % |
| Orla Brask | une bagarreuse des docks, régulière | 600 | 12 | 11 | 11 | 50 % |
| Ilse Morrow | une chevalière du Temple, coups mesurés : un mur | 620 | 10 | 12 | 11 | 60 % |
| Marek Varn | la Porte de fer, champion de l’an dernier : coups lourds, longs repos | 650 | 13 | 13 | 12 | 20 % |
| Rhosk | le Nordique : une hache lente et écrasante, endurant | 700 | 12 | 10 | 13 | 70 % |

- Le kit de chaque rival pèse autant que sa fiche. Vessa, mesurée d'abord à Atq 11 (500 / 11 / 9 / 8), était imbattable pour le joueur moyen (5 à 10 %) à cause de la vitesse de son kit. Elle a donc les coups les plus légers.
- Les six combattants génériques (Aldric, Corra, Ambrose, Lucan, Piers, Kell) jouent les coups d'un rival qu'ils empruntent. Leurs fiches se tireront de ce rival, plus basses, à la construction.

### 2.6 Les rivaux grandissent avec le tournoi

Ce qui s'ajoute à la fiche de chaque rival :

| Étape | Atq | Déf | End | PV |
|---|---|---|---|---|
| Poule (jours 1 à 5) | — | — | — | ×1 |
| Tableau (jours 6 à 8) | +3 | +3 | +2 | ×1,3 |
| Finale (jour 10) | +1 | +3 | +2 | ×2,5 |

- Le tableau remplace les PV ×1,4 de DB5-6. Avec des PV seuls, Ren grandit et ses rivaux non : 91 % au tableau, 90 % en finale.
- La finale est l'épique de DB5-7 : une barre de 1 250 à 1 750 PV, environ 4 minutes contre Marek. Les « défis particuliers » épiques restent à définir avec toi.

### 2.7 Les stats se voient

- La page d'équipement (G) montre déjà les nombres d'un combat, avant et après un achat : elle montrera les quatre stats de Ren.
- La fiche de match montrera celles de l'adversaire.
- La page des compétences montrera la puissance de chaque compétence, niveau par niveau.
- Aucun nombre caché : l'opérateur préfère des règles simples, lisibles.

## 3. La courbe mesurée

Le bot du jeu (faible 0,2, moyen 0,5, fort 0,9) contre les sept rivaux, 10 combats chacun, avec les choix DB4 et DB5. Le marteleur ne fait que l'attaque simple. La durée est la médiane des sept rivaux, entre crochets la plus courte et la plus longue.

| Étape | État du joueur | Faible | Moyen | Fort | Durée (moyen) | Estocade franche / sur une rupture |
|---|---|---|---|---|---|---|
| Poule | attendu : équipement 1, niveau 1, 150 PV | 17 % | 64 % | 99 % | 2,2 min [1,5-2,7] | 21 % / 43 % |
| Poule | en avance : équipement 3, niveau 3, 170 PV | 79 % | 100 % | 100 % | 1,3 min | 34 % / 83 % |
| Poule | en retard : rien, niveau 1 | 17 % | 56 % | 99 % | 2,2 min | 20 % / 41 % |
| Tableau | attendu : équipement 2, niveau 3, 185 PV | 39 % | 79 % | 97 % | 2,4 min [1,5-3,1] | 21 % / 37 % |
| Tableau | en avance : équipement 3, niveau 5, 200 PV | 89 % | 99 % | 100 % | 1,4 min | 32 % / 63 % |
| Tableau | en retard : rien, niveau 1, 170 PV | 4 % | 20 % | 84 % | 2,5 min | 13 % / 30 % |
| Finale | attendu : équipement 3, niveau 3, 220 PV | 26 % | 66 % (Marek 20 %) | 100 % | 3,5 min [2,9-4,0] | 12 % / 23 % |
| Finale | en avance : niveau 5, 235 PV | 63 % | 90 % (Marek 60 %) | 100 % | 3,0 min | 16 % / 32 % |
| Finale | en retard : équipement 1, niveau 1, 185 PV | 0 % | 11 % | 54 % (5,6 min) | 3,2 min | 7 % / 16 % |

- Le marteleur perd partout (0 %, sauf 17 % en poule quand il est tout équipé et au niveau 3, surtout contre Tobin).
- Sans la vigueur (Ren à 150 PV et la bande) : tableau 63 %, finale 33 % (Marek 0 %).
- La finale selon sa croissance (joueur attendu, 220 PV) :

| Finale | Moyen | Contre Marek | Durée |
|---|---|---|---|
| PV ×3 | 43 % | 0 % | 3,8 min |
| **PV ×2,5 (proposé)** | **66 %** | **20 %** (fort : 100 %, 5,4 min) | **3,5 min** |
| PV ×2 | 87 % | 70 % | 3,0 min |
| PV ×2,5 seuls, sans stats en plus | 90 % | 40 % | 3,1 min |

- La lecture :
  - En avance, on va plus vite : l'Estocade de niveau 5 enlève le tiers de la barre d'un rival du tableau, les deux tiers sur une rupture.
  - En retard, on peine ; un joueur fort s'en sort quand même, mais en finale il lui faut près de six minutes.
  - L'escalier faible / moyen / fort tient à chaque étape.
  - La durée suit l'état du joueur : tes mots disent que c'est normal.

## 4. Les limites

- Le bot ne joue pas la rupture comme un joueur ; il place pourtant l'Estocade et rompt la garde (1,7 à 4 ruptures par combat).
- Les victoires se recaleront sur des parties entières (six sur dix, DB4-5), et `V2_RACERS` se remesurera. Les nombres de ce document bougeront de quelques points, pas leur forme.
- La courbe attendue est tirée des règles (un niveau de compétence par créneau d'entraînement, les niveaux 4 et 5 par les défis, les achats), pas d'un joueur réel.
- Le +12 PV par victoire suppose un parcours (deux victoires de poule et un défi avant le tableau) ; il se vérifiera sur des parties entières du TournamentLab.
- Les puissances sont des nombres décimaux arrondis au point près : un coup simple d'un rival fait 5 ou 6 PV sur les 150 de Ren.

## 5. Ce qu'il faudra construire, après la fiche

- Une fiche de stats par combattant dans les données du duel, la formule dans `DynamicSim`, et l'équipement converti en points dans `v2Mods`.
- La vigueur dans l'état du joueur (dans la sauvegarde), la croissance des rivaux par étape du calendrier, et les fiches des génériques.
- Les règles de DB4 et DB5 : les recharges et leur affichage dans le HUD, la garde des rivaux, la rupture, la jauge.
- Les stats sur la page d'équipement, la fiche de match et la page des compétences, dans les deux langues.
- Le recalage sur des parties entières, `V2_RACERS`, les états nommés, les textes du tutoriel du premier combat (ils lisent les nombres du duel).
- Les tests, le laboratoire, le combat en navigateur, la fusion ; puis ton essai en jeu.

## 6. Ce qui a été décidé et appliqué (journal Passes DB8 et DB9)

- La fiche DB7 relue : six cartes sur sept à la recommandation ; DB7-1 « Ajouter la Vivacité (vitesse de charge) », avec la note « certains adversaires seront plus rapide que d'autres et il en est de meme pour notre protagonist ». Cinq stats donc : la Vivacité règle les temps de charge de Ren (× 10 / Vivacité) et le tempo d'un rival ; l'équipement qui touchait la charge donne des points de Vivacité (le sabre et les bottes +1, la cotte et le haubert −0,5) ; une séance peut la choisir.
- Appliqué dans le jeu par défaut (`src/combat/stats.ts`), avec les règles de DB5, et trois réglages de la mise en œuvre (`briefs/combat-system.md` § 19.6) :
  - les coups des rivaux ×0,72, recalés à six combats sur dix ;
  - l'attaque simple remplit la jauge de 0,5 ;
  - un coup gardé remplit deux fois la jauge du gardien.
- Les deux derniers parce qu'un joueur qui tenait la garde à chaque séquence et ne faisait que l'attaque simple gagnait contre quatre rivaux sur sept.
- Les nombres des § 3 et § 2.5 sont ceux de la proposition, avant ces réglages ; la courbe recalée est au journal (Passe DB9).

Mesures : `node tools/duel-balance.mjs --audit --seeds=1..10 --skills=0.2,0.5,0.9 --variant="rs<n>+lv<n>[+stage<n>][+rhp<N>]"` (les stats du jeu depuis la Passe DB8 ; avant, le prototype `rpg+fguard90+greduce80+cd5+gauge70+stun10`). Les jetons :

| Jeton | Ce qu'il règle |
|---|---|
| `rs<n>` | l'état d'équipement (0 à 3) |
| `lv<n>` | le niveau des compétences |
| `stage<n>` | la croissance des rivaux : 0 la poule, 1 le tableau, 2 la finale, 3 à 11 les autres mesurées |
| `rhp<N>` | les PV de base de Ren |
| `vhp`, `vatk`, `vdef`, `vend` | la fiche de l'adversaire, pendant un réglage |
