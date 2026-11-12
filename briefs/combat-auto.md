# Le combat joué par l'ordinateur — spécification (atelier de refonte du combat, 11/11/2026)

**Statut : approuvée par l'opérateur le 11/11/2026 ; le lot 1 construit le 12/11/2026 (§ 18), sa fiche relue le même jour (§ 19) ; le lot 2 construit le même jour, le duel dans le jeu par défaut (§ 20), sa fiche d'essai relue le même jour, dix sur dix à la recommandation, et la relecture de l'arène rendue fluide (§ 21) ; ensuite le lot 3 (le guide et le tutoriel de ce duel)** (fiche de l'atelier, AC-20 « Approuvée avec mes choix ; en lots, dans le jeu par défaut, mon essai
après le lot 2 » ; vingt choix sur vingt à la recommandation, journal Passe AC4). **Ce qui s'applique : le § 17**, qui l'emporte sur les §§ 1 à 16 là
où ils diffèrent. Brouillon des Passes AC1 à AC3 avant cela.

**Version 3 (journal Passe AC3) : le modèle complet.** Après la direction de l'opérateur (« match de chevaux », la poule au même niveau, les rivaux
qui grandissent « grandement en phase finale », des enchaînements, une préparation diversifiée), les propositions sont celles du **§ 16** ; elles
remplacent, là où elles diffèrent, celles des §§ 2 à 11 (écrites pour les Passes AC1 et AC2, dont les mesures restent aux §§ 12.1 à 12.7). La fiche
(version 4, vingt cartes AC-01 à AC-20, renumérotées) ne parle que du modèle complet.
Rien n'est construit. Le jeu garde le duel d'aujourd'hui (`briefs/combat-system.md`) jusqu'au lot 2 (§ 17.3).

**La demande.** L'opérateur, le 11/11/2026, mot pour mot (journal Passes AU3 et AU5 ; le texte entier en annexe A) :
- « je pense que nous devons partir du principe que les duels seront des combats auto par ordinateur ou nous les joueurs nous allons surtout nous
  focus sur la preparation du combat ( equipement, skills, etc...) » ;
- « le vrai changement sera d'integrer un zone de charge/attente avant d'agir peut etre que voir comment adapter cela avec AP » ;
- « Il faudrait une ligne de temps mais les PA sont essentiels pour l'usage des competences sauf si on a un meilleur choix, et la defense et esquive
  comment cela sera gere ? on a deja defini 5 stats » ;
- « un system semi-auto permettrait de determiner quand lancer les competences par exemple » ;
- « il faut determiner un temps de simulation suffisamment bon a profiter du duel » ;
- le problème à résoudre : « le joueur perd trop souvent face au ennemie avance/expert par exemple, ce qui est la problematique ».

**L'inspiration** (Passe AU4) : *La Brute*, lue dans le code de son remake. On en garde deux principes de genre, une ligne de temps d'initiative et
une préparation qui décide. On n'en reprend ni les armes, ni les noms, ni les animaux, ni l'art, ni le code.

**Les règles de l'atelier.** Le § 6.1 du contrat projet et les décisions A3 du duel (DB5 et sa durée, DB5-3, DB5-4, DB-2, DB7-1 à DB7-6, DB11-2,
DB11-5, DB11-6) restent en vigueur tant que l'opérateur ne les change pas par une décision citée mot pour mot et datée au journal. Ce texte dit pour
chaque règle si elle garde une décision A3 ou si elle demande la sienne (marque **A3**). Les nombres sont « proposé », mesurés au § 12.

**Le prototype.** `tools/auto-duel/sim.mjs` (la simulation), `tools/auto-duel/kits.mjs` (les combattants tirés des données du jeu) et
`tools/auto-duel-lab.mjs` (les mesures, sur duels isolés et sur parties entières du TournamentLab). Ce n'est pas le jeu : rien dans `src/` ne le lit.

---

## 1. Le modèle : une ligne de temps, la charge avant d'agir

- Chaque combattant suit la même boucle, Ren comme ses rivaux : **il choisit une action, il la charge, elle part, puis il choisit la suivante.**
- **La charge est la zone d'attente** voulue par l'opérateur : le temps qu'il faut avant que l'action parte. On la voit : une barre par combattant,
  côte à côte, sur une même ligne de temps.
- **La Vivacité règle la charge** (DB7-1 gardée) : pour Ren, le temps de charge × 10 / Vivacité ; pour un rival, le temps de son kit × la Vivacité de
  son kit / sa Vivacité.
- Le temps ne s'arrête pas : les deux charges courent en même temps. Ce n'est pas un tour par tour à l'arrêt ; c'est le « tour par tour dynamique »
  de l'atelier CB1, sans commande en direct.
- **Rien ne coupe une charge** (V2-2 gardée). **La rupture la met en pause** : le combattant étourdi reprend sa charge où elle en était quand il se relève.
- Le duel finit au K.O., et seulement au K.O. (G4 gardée).
- Comme aujourd'hui, la simulation est déterministe : la même graine donne le même duel. Elle est calculée en entier avant d'être montrée, ou pas à pas
  en semi-automatique.

## 2. Les actions et les PA

- **L'attaque simple** : 1,2 s de charge à Vivacité 10 ; puissance 6 pour Ren (DB5-5 gardée). Quand elle touche (gardée ou non), elle donne **+1 PA**
  (DB-3 gardée).
- **Les compétences** : celles du catalogue d'aujourd'hui, l'attaque puissante comprise (CH1), quatre emportées. Chacune garde :
  - son temps de charge à son niveau (CH-1 gardée) ;
  - son coût en PA (de 1 à 4) ;
  - sa puissance (l'Estoc 120, les autres au prorata de leur temps de charge, DB5-1 gardée) ;
  - **sa recharge, 5 × son temps de charge** (DB5-3 gardée).
- **Les PA** : 1 au départ (CB-5), 5 au plus (C2-3) ; l'attaque simple les gagne, les compétences les paient. C'est le choix proposé : les PA
  disent *quoi* lancer, la ligne de temps dit *quand* (proposition 1 de la Passe AU5). Les deux autres voies mesurées (§ 12.2) : pas de PA, les
  compétences limitées par leur seule recharge ; ou +1 PA toutes les 3 s.
- **La défense et le soutien** (Rempart, Ferveur et les autres) gardent leurs effets : moins de dégâts et de jauge reçus, ou plus de dégâts et de jauge
  donnés, pendant leur durée.

## 3. La garde et l'esquive : des réactions données par les stats

- **Aucune sixième stat.** Les cinq stats gardent leur rôle (DB7-1) et deux en prennent un second, visible (proposition 2 de la Passe AU5) :
  - **l'esquive vient de la Vivacité** : 12 % × 2·Viv du défenseur / (Viv du défenseur + Viv de l'attaquant), soit 12 % à Vivacité égale, de 0 à 24 % ;
  - **la garde vient de la Défense** : 35 % × 2·Déf du défenseur / (Déf du défenseur + Atq de l'attaquant), soit 35 % à égalité, de 0 à 70 %.
- Les deux formules ont la forme de celle des dégâts (DB7-1) : un rapport, sans seuil caché. **La fiche de match montre les deux chances.**
- Un coup esquivé ne fait rien. Un coup gardé perd 80 % de ses dégâts (DB5-2) et ajoute deux fois sa part à la jauge de celui qui garde (DB9).
- **La zone de charge expose** : pendant la charge d'une compétence (tout sauf l'attaque simple), on ne garde ni n'esquive. Une longue charge coûte
  donc quelque chose, et le bon moment pour lancer une grosse compétence se lit sur la ligne de temps : quand l'adversaire charge la sienne, ou quand il
  est rompu.
- **Proposé : la garde ×2 contre une compétence que l'on voit venir** (sa barre de charge l'annonce ; tout sauf l'attaque simple ; 90 % au plus).
  C'est la « légère alerte surtout pour les compétences » de l'atelier CB1 (G5, CB-6) devenue une règle, et c'est elle qui donne un sens au
  semi-automatique (§ 6) : sans elle, choisir le moment ne rapporte rien (mesuré, § 12.3).
- Les autres voies mesurées (§ 12.2, § 12.3) : les mêmes chances contre tous les coups ; les compétences vues venir toujours gardées, sans esquive (le
  bon moment rapporte alors tout) ; aucune réaction, seules les compétences défensives et l'équipement protégeant.
- Un rival qui esquive aujourd'hui (Vessa 35 %, Cassius 20 %, C3) peut garder ce trait, ajouté à sa chance et dit sur la fiche de match.

## 4. La jauge et la rupture

- **Une seule règle pour les deux** (G3 gardée). Chaque coup qui porte remplit la jauge de la cible : un dixième de sa puissance pour l'attaque simple,
  un quart pour une compétence (les compétences d'abord, DB-5 gardée ; Tourbillon et Fracas ×2,5) ; × 10 / Endurance de la cible (DB7-1 gardée).
- **La rupture reste celle de DB5-4** (gardée) : une jauge de 70, l'étourdi 10 s, les dégâts reçus ×2 ; la jauge se vide lentement avec le temps,
  deux fois moins vite qu'avant DB11-1.
- **La riposte au 3e coup (DB-2) n'a plus de raison d'être** : elle répondait au martelage de l'attaque simple d'un joueur qui jouait au clavier. Un
  duel joué par l'ordinateur ne martèle pas. La retirer est une décision **A3**.

## 5. Les rivaux

- Ils suivent la même boucle (§ 1). **Leur kit fait leur identité** : leur attaque simple (son temps de charge vient de leur niveau d'aujourd'hui,
  Tobin lent, Vessa vive), leur coup puissant, leurs deux ou trois compétences de C3 (Chute de Fer, Coup d’épaule des docks… ; une compétence offensive charge
  d'autant plus longtemps qu'elle frappe fort).
- Ils n'ont pas de PA : leurs compétences reviennent par leur recharge, comme aujourd'hui (CB-1).
- Leur IA garde les habitudes de C3 : une compétence prête une fois sur trois environ, leur coup puissant dans la part qu'il a aujourd'hui, leur
  défensive quand leur jauge passe la moitié.
- Leurs fiches de stats restent celles de DB7-5 (gardée). Leur croissance au fil du tournoi est l'objet du § 9.

## 6. Trois façons de décider, une seule simulation

- **L'IA** joue les rivaux et les combats hors écran.
- **L'automatique** joue Ren selon sa préparation, dans l'ordre du bot d'aujourd'hui : la défensive quand sa jauge passe la moitié, le soutien
  quand il n'en a pas, la compétence offensive la plus forte qu'il peut payer, sinon l'attaque simple.
- **Le semi-automatique** : le joueur choisit quand lancer chaque compétence (une touche par compétence, ou un clic) ; elle part au prochain choix de
  Ren, c'est-à-dire dès que sa charge en cours est partie. Le reste est automatique. Il ne demande pas de refaire la simulation.
- Mesuré (§ 12.3) : avec la garde ×2 contre une compétence vue venir, un semi-automatique attentif (les compétences quand l'adversaire est rompu ou
  charge la sienne) gagne 75 % des titres contre 43 % pour l'automatique ; joué au hasard, 10 %. Avec les mêmes chances contre tous les coups,
  l'attentif fait moins bien que l'automatique (23 % contre 37 %) : le bon moment ne rapporte que si la défense le récompense.
- Proposé : l'automatique par défaut, le semi-automatique au choix.

## 7. Ce que le joueur prépare

- **Le kit** : les quatre compétences emportées et leur ordre de priorité, que l'automatique suit (il lance la première qu'il peut payer quand elle
  est prête).
- **Aucun kit ne doit écraser les autres.** Mesuré (§ 12.6), comme dans le duel d'aujourd'hui : quatre offensives battent nettement le kit de départ
  (99 / 100 / 99 % contre 74 / 74 / 38 % de la poule à la finale), Rempart et Ferveur valent moins qu'une offensive. Proposé : à la construction, les
  compétences se recalent pour que les kits restent dans une bande d'une dizaine de points sur des parties entières (les défensives et le soutien
  valent une offensive ; le coût en PA suit ce que la compétence rapporte).
- **L'équipement en points** (DB7-2 gardée), **l'entraînement** (+1 à la stat choisie pour le prochain combat, ou +20 PV, DB7-3 et DB11-5 gardées),
  **la vigueur** (+24 PV par victoire, DB7-4 et DB11-6 gardées), **les niveaux des compétences** (l'exercice au sable).
- **L'information** : le style et les compétences de l'adversaire, sa forme, sa préparation, sur la fiche de match.
- **La fiche de match** dit tout ce qui décide : les stats des deux, les chances de garde et d'esquive, la préparation du rival, sa forme du jour.

## 8. La durée et la façon de regarder

- Le duel se montre en entier à ×1, avec **×2** et **« Passer au résultat »**.
- La durée naît des PV : plus ils sont hauts, plus le duel laisse voir la préparation agir (des compétences, une rupture, un retournement). Mesuré
  (§ 12.4) : les PV de chacun ×1,5 (la courbe B) donnent 98 / 118 / 143 s de médiane en poule, au tableau et en finale ; ×2 donne 133 / 157 / 186 s,
  près de vingt compétences et une ou deux ruptures par duel.
- **Proposé : PV ×2**, soit DB5 (« en 2 et 5 min », A3) tenue sans la changer, la finale la plus longue (l'épique de DB5-7). Plus court change DB5.

## 9. La courbe : partir du joueur que l'on peut être

Le problème de l'opérateur vient de là (journal Passe AU5) : les rivaux grandissent par multiplicateurs (PV ×1,7 puis ×3,5, +3 aux stats, la
Vivacité rendue au tableau) et par leur préparation cachée (×1,09 à ×1,25 sur leurs coups) ; Ren grandit par petits ajouts ; la courbe d'aujourd'hui
supposait ses compétences au niveau 3, qu'aucun joueur du laboratoire n'atteint.

**Mesuré dans le prototype (§ 12.1) : la même croissance donne la même falaise**, quelle que soit la façon de combattre. La refonte refait donc la
courbe, dans cet ordre :
1. **Le joueur de référence** : celui qui prépare normalement, mesuré dans des parties entières (le planificateur du laboratoire, qui fait aussi
   vérifier son équipement par Hilde et exerce les compétences qu'il emporte). Ses stats à chaque étape sont au § 12.1.
2. **Les chances visées** pour lui (proposé : poule 85 %, demi-finale 65 %, finale 50 %, soit un titre sur trois environ ; un joueur qui ne prépare
   pas perd presque toujours au tableau).
3. **Les rivaux calés dessus, sur des parties entières** (graines de calage, puis graines tenues à part), leur préparation comprise.
4. **Leur croissance dite simplement** :
   - **leur Vivacité ne saute plus au jour 6** : celle de la poule (DB11-2) est gardée tout le tournoi (sinon leur rythme bondit de 43 % au tableau,
     et il faudrait leur retirer des PV pour compenser : mesuré) ; **A3** (DB11-2 et DB7-6) ;
   - **leur préparation devient des points visibles** sur la fiche de match (+1 en Attaque par 25 de préparation au-dessus de 20), au lieu d'un
     multiplicateur caché ;
   - **leurs PV** : inchangés au tableau, ×1,4 en finale (la courbe B, § 12.1) ; la finale reste le plus long des combats.
5. **Mesuré sur graines tenues à part** (§ 12.1) : le joueur de référence gagne 35 à 37 % des titres, l'inactif 0 %, le diligent 3 %, le curieux
   18 %, le planificateur sans ses deux habitudes 13 %.

**La direction de l'opérateur après la première version de la fiche** (11/11/2026, mot pour mot, journal Passe AC2) : « Oui mais donc il faut faire un
travail concret pour augmenter les chances... deja avec la preparation et l'augmentation des equipements donc des stats cela doit ameliorer les
chances... donc si il y a probleme on doit donner des equipements plus impactant favorisant les chances au joueur que ce sooit les PV ou les 5 stats puis
le jeu doit aussi etre suffisamment structure comme un rpg pour mettre en place les bons adversaires aux bons endroits/moments pour que le defi soit
reelle mais toujours controle ». Deux propositions en sortent (§ 12.7) :

6. **Des équipements qui pèsent** (fiche AC-19) : les points de chaque pièce et de la forge doublés (DB7-2, A3), puis la courbe recalée sur la cible
   choisie. Mesuré : avec la croissance d'aujourd'hui, même ×6 ne donne aucun titre ; avec la courbe B sans recalage, ×1,5 donne 58 % de titres à la
   référence, ×2 75 %, ×3 92 % ; recalée sur ×2, la courbe laisse les rivaux grandir davantage (PV ×1,14 au tableau, ×1,65 en finale) pour la même cible,
   et le joueur qui s'équipe peu perd plus.
7. **Une marche par combat** (fiche AC-20) : chaque adversaire a la force du moment où le joueur le rencontre (la poule du plus faible au plus fort, puis
   la demi-finale, puis la finale), chacun garde son style (kit, rythme, forme de stats) et son rang parmi les autres à ±10 points de la marche ; les
   fiches de DB7-5 (A3) deviennent des formes, la force venant du moment. Mesuré sur parties entières (§ 12.7) : la référence 98 / 92 / 88 / 73 / 77 %
   du jour 2 à la finale, 55 % de titres ; le diligent 97 / 58 / 67 / 34 % jusqu'à la demi-finale ; l'inactif 90 / 33 / 23 / 8 %. Ranger seulement la
   poule ne suffit pas (Vessa devient la quatrième, la demi-finale devient facile même pour l'inactif). Dans le prototype la marche ne règle que les
   PV, ce qui rend les fiches illisibles (Tobin 1 094 PV en poule, Marek 497) : à la construction, elle se répartit sur toutes les stats.

## 10. La part du hasard

- Sur ~100 actions, les chances de garde et d'esquive se moyennent : le prototype sans autre hasard rend les combats entre rivaux presque joués
  d'avance (le moins fort gagne 2 % du temps, contre 7 % dans la course hors écran d'aujourd'hui ; § 12.5).
- Proposé : **une forme du jour**, tirée avant chaque combat pour chacun (ses coups ×1 ± 15 %), **dite sur la fiche de match**. Elle rend des
  surprises au niveau d'aujourd'hui (7 %), sans point caché. Un coup critique, mesuré, ne change rien : il se moyenne aussi.

## 11. Les combats hors écran

- **La même simulation** que les combats vus, l'IA des deux côtés (contrat tournoi § 6 : « du même modèle de stats/règles »). La course d'aujourd'hui
  (`V2_RACERS`, calibrée à part) disparaît.
- Coût mesuré : 0,08 ms par duel dans Node (§ 12.5) ; les quatre combats hors écran d'une journée se calculent sans délai visible.

## 12. Les mesures (prototype, Node ; `node tools/auto-duel-lab.mjs …`)

Mesuré par la Passe AC1 (les commandes exactes au journal). « Parties entières » : la boucle d'`autoplay` de `src/tournament/lab.ts`, les combats du
joueur et ses défis joués dans le prototype, les combats hors écran par la course d'aujourd'hui ; graines de calage 1 à 40, **graines tenues à part 101
à 160**. « La référence » : le planificateur du laboratoire, qui fait aussi vérifier son équipement par Hilde (le matin d'un combat du tableau, ou après
un signe) et exerce les compétences qu'il emporte. **La courbe B** : `hpScale=1.5`, les rivaux à leur Vivacité de poule tout le tournoi, leur
préparation en points d'Attaque (+1 par 25 au-dessus de 20), leur puissance ×0,988, leurs PV ×1,015 au tableau et ×1,384 en finale, sans point de plus
par étape. Les nombres sont ceux d'un prototype ; un bot n'est pas une personne.

### 12.1 La courbe

Les joueurs que le laboratoire est vraiment (`refs`, graines 1 à 30, le duel d'aujourd'hui décidant des victoires) :

| Politique | Poule | Tableau | Finale |
|---|---|---|---|
| inactif | 300 PV, 10 / 10 / 10 / 10 | 278 PV (blessé) | — |
| diligent | 324 PV, Atq 11, Déf 12 | 372 PV, 11 / 11 | 396 PV (1 finaliste) |
| curieux | 372 PV, Atq 10, Déf 12, End 12 | 478 PV, Déf 13,5 | 550 PV |
| planificateur | 324 PV, Atq 14, Déf 13, End 10, Viv 9,5 | 390 PV | 414 PV, 16,5 / 14 / 12 / 9,5 |

Les compétences restent au niveau 1 (le planificateur finaliste a la sienne au niveau 3). La préparation des rivaux rencontrés : 51 à 57 en poule (coups
×1,13), 88 à 91 au tableau (×1,22), 100 en finale (×1,25).

La même croissance qu'aujourd'hui dans le prototype (duels isolés, la puissance des rivaux réglée pour la poule) : le planificateur 66 / 0 / 0 % en poule,
au tableau et en finale ; même la puissance des rivaux à moitié ne rend que 17 % au tableau et 2 % en finale. **La falaise est dans la courbe.**

Calages (`fit`, sur parties entières de la référence) :

| Croissance (et préparation) | Puissance | Tableau | Finale | Référence : titres / demi / finale (101-160) |
|---|---|---|---|---|
| A : Vivacité de poule gardée, +1 au tableau, +2 en finale, préparation en points | ×0,988 | PV ×0,868 | PV ×1,195 | 45 % / 84 % / 55 % |
| **B : Vivacité de poule gardée, aucun point par étape, préparation en points** | ×0,988 | **PV ×1,015** | **PV ×1,384** | **35 % / 67 % / 54 %** |

A et B tiennent la poule ; B tient aussi la demi-finale sur les graines tenues à part, et sa croissance se dit en une phrase. Avec la Vivacité rendue au
tableau (DB11-2 telle quelle), un calage sur duels isolés demande au contraire des PV ×0,58 à ×0,68 au tableau, des rivaux plus faibles qu'en poule.

Sur la courbe B, graines 101 à 160 :

| Politique | Titres | Poule | Demi-finale | 3e place | Finale | Durées méd. poule / tableau / finale |
|---|---|---|---|---|---|---|
| inactif | 0 % | 48 % | 2 % | 11 % | 0 sur 1 | 102 / 84 / 122 s |
| diligent | 3 % | 68 % | 18 % | 49 % | 20 % (10) | 104 / 115 / 126 s |
| curieux | 18 % | 78 % | 47 % | 79 % | 42 % (26) | 104 / 127 / 190 s |
| planificateur | 13 % | 85 % | 42 % | 94 % | 32 % (25) | 97 / 111 / 148 s |
| **référence** | **35 %** | 85 % | 67 % | 74 % | 54 % (39) | 97 / 118 / 143 s |

Dans ces parties, la demi-finale du joueur se joue surtout contre Orla (35 fois sur 50 pour le planificateur sur la courbe A), et non contre Vessa comme
avec le duel d'aujourd'hui : un calage sur des duels isolés « contre Vessa » se trompait de sens (il disait les rivaux du tableau faciles).

### 12.2 Les règles (courbe B, avant recalage ; `variants`, la référence et l'inactif)

| Variante | Titres réf. / inactif | Durées poule / tableau / finale | Compétences de Ren | Ruptures adv. / Ren | Retournements |
|---|---|---|---|---|---|
| R0 (la base des variantes : mêmes chances contre tous les coups) | 37 / 0 % | 98 / 118 / 143 s | 14 | 1,10 / 0,09 | 5,92 |
| compétences vues venir toujours gardées | 37 / 0 % | 110 / 131 / 167 s | 15 | 1,76 / 0,44 | 6,04 |
| aucune réaction | 37 / 0 % | 88 / 106 / 114 s | 11 | 0,99 / 0 | 6,91 |
| la charge n'expose pas | 27 / 0 % | 127 / 149 / 173 s | 17 | 1,49 / 0,38 | 4,67 |
| sans PA (recharges seules) | 90 / 2 % | 88 / 103 / 120 s | 13 | 1,65 / 0,01 | 3,25 |
| +1 PA toutes les 3 s | 32 / 0 % | 103 / 124 / 144 s | 14 | 1,07 / 0,08 | 6,12 |
| sans recharge | 100 / 12 % | 72 / 83 / 107 s | 13 | 1,22 / 0 | 3,67 |
| rupture 6 s ×1,5 | 22 / 0 % | 102 / 120 / 134 s | 14 | 1,14 / 0,12 | 6,25 |
| sans rupture | 15 / 0 % | 99 / 111 / 126 s | 11 | 0 / 0 | 6,72 |
| forme du jour ±15 % | 42 / 0 % | 98 / 112 / 138 s | 13 | 1,13 / 0,08 | 5,72 |
| forme ±15 % et traits d'esquive (×0,7) | 38 / 0 % | 103 / 113 / 140 s | 14 | 1,10 / 0,09 | 5,69 |
| croissance d'aujourd'hui (préparation en multiplicateur) | 0 / 0 % | 99 / 73 / — s | 11 | 0,66 / 0,41 | 3,91 |
| Vivacité rendue au tableau (DB11-2 telle quelle) | 0 / 0 % | 98 / 92 / 105 s | 12 | 0,90 / 0,21 | 4,92 |
| préparation en multiplicateur caché | 7 / 0 % | 99 / 112 / 136 s | 13 | 0,96 / 0,31 | 5,51 |

Ren est rarement rompu (0,1 par duel) : son Rempart, lancé quand sa jauge passe la moitié, le protège.

### 12.3 Les façons de décider (courbe B, titres de la référence)

| Défense | Automatique | Semi, attend les fenêtres | Semi, jamais assis sur 5 PA | Semi, au hasard |
|---|---|---|---|---|
| mêmes chances contre tous les coups | 37 % | 23 % | 27 % | 12 % |
| **garde ×2 contre une compétence vue venir** | **43 %** | **75 %** | 32 % | **10 %** |
| garde ×2,5 | 53 % | 93 % | 45 % | 23 % |
| compétences vues venir toujours gardées | 37 % | 100 % | 48 % | 15 % |
| aucune réaction | 37 % | 0 % | — | 5 % |

« Attend les fenêtres » : une compétence seulement quand l'adversaire est rompu ou charge la sienne (exposé). « Jamais assis sur 5 PA » : la même chose,
et il lance la plus forte dès que ses PA sont pleins. « Au hasard » : une compétence prête sur trois lancée sans regarder. [KO de modèle, corrigé] Le
premier modèle du semi-automatique attentif ne lançait rien hors des fenêtres : le rival n'était jamais rompu, les fenêtres ne venaient pas (18 % de
titres sur la courbe A) ; il reste mesuré sous le nom « wait ».

### 12.4 La durée (courbe B, la référence)

| PV de chacun | Durées méd. poule / tableau / finale | Compétences de Ren par duel | Ruptures adv. | Retournements | Titres réf. |
|---|---|---|---|---|---|
| ×1 | 67 / 74 / 86 s | 8 | 0,59 | 5,27 | 33 % |
| ×1,5 | 98 / 118 / 143 s | 14 | 1,10 | 5,92 | 37 % |
| ×2 | 133 / 157 / 186 s | 18 | 1,55 | 6,53 | 30 % |

### 12.5 Le hasard et les combats hors écran (`offscreen`, toutes les paires de rivaux aux trois étapes, 30 à 40 graines)

| Variante | Chance moyenne du moins fort | Même favori que la course |
|---|---|---|
| les stats seules | 2,3 % | 96 / 126 |
| coup critique 10 %, ×1,5 | 2,4 % | 96 / 126 |
| forme du jour ±10 % | 3,7 % | 96 / 126 |
| forme du jour ±20 % | 7,8 % | 97 / 126 |
| forme ±15 % et traits d'esquive | 7,1 % | 98 / 126 |
| la course d'aujourd'hui | 7,4 % | — |

Coût : 0,08 à 0,10 ms par combat dans Node.

### 12.6 Les kits (duels isolés, la référence de chaque étape, contre les adversaires réellement rencontrés : Vessa, Orla, Cassius ; Orla surtout en demi-finale ; Marek en finale ; courbe B, 60 graines)

| Kit | Automatique : poule / tableau / finale | Semi attentif |
|---|---|---|
| départ : Taille éclair, Estoc, Rempart, Ferveur | 74 / 74 / 38 % | 72 / 64 / 33 % |
| Attaque puissante, Taille éclair, Estoc, Ferveur | 96 / 97 / 71 % | 94 / 96 / 69 % |
| quatre offensives : Taille éclair, Fente, Tourbillon, Estoc | 99 / 100 / 99 % | 99 / 100 / 100 % |
| Fracas, Taille éclair, Estoc, Rempart | 100 / 100 / 100 % | 100 / 100 / 100 % |
| défensif : Taille éclair, Rempart, Peau de fer, Ferveur | 64 / 34 / 25 % | 62 / 38 / 25 % |
| Feinte, Taille éclair, Estoc, Ferveur | 98 / 99 / 73 % | 98 / 96 / 78 % |

### 12.7 L'équipement et les marches (Passe AC2 ; parties entières, graines 101 à 160)

L'équipement (`KIT.gearK` : les points de chaque pièce et de la forge multipliés), titres :

| Points de l'équipement | Courbe | Référence | Diligent | Inactif |
|---|---|---|---|---|
| ×1 à ×6 | croissance d'aujourd'hui | 0 % (demi-finale 0 %) | 0 % | — |
| ×1 | B | 37 % | 3 % | 0 % |
| ×1,5 | B | 58 % | 3 % | 0 % |
| ×2 | B | 75 % | 5 % | 0 % |
| ×3 | B | 92 % | 8 % | 0 % |
| ×2 | C : recalée sur ×2 (puissance ×1,038, tableau PV ×1,142, finale ×1,653) | 25 % | 2 % | 0 % |

Sur la courbe C : le curieux 10 % (18 % sur la courbe B), le planificateur 13 %.

Le niveau des compétences pèse lourd : contre Orla au jour 4 (courbe B), 60 états du planificateur rejoués sur 40 graines chacun : Taille éclair au
niveau 1, 19 % ; au niveau 2, 56 %. C'est ce qui sépare le duel isolé (au niveau 1) des parties entières (où le planificateur l'exerce parfois avant le
jour 4). [?] Sur ces 60 états, la graine du jeu donne 50 % de victoires contre 35 % en moyenne sur 40 autres graines : à la limite du hasard sur 60
parties, non expliqué.

Les marches (`stairs` puis `games --band`) :

| Structure | Référence : j2 / j4 / j5 / demi / finale | Titres réf. | Diligent : j2 / j4 / j5 / demi | Inactif : j2 / j4 / j5 / demi |
|---|---|---|---|---|
| fiches et ordre d'aujourd'hui (courbe B) | 100 / 55 / 100 / 68 / 55 % | 37 % | 100 / 12 / 92 / 18 % | 97 / 5 / 43 / 2 % |
| la poule du plus faible au plus fort, fiches gardées | 100 / 100 / 65 / 95 / 51 % | 48 % | 100 / 100 / 23 / 85 % | 97 / 85 / 5 / 59 % |
| une marche par combat sans écart (ordre d'aujourd'hui) | 98 / 98 / 83 / 65 / 85 % | 55 % | 97 / 78 / 43 / 25 % | 90 / 58 / 15 / 2 % |
| **une marche par combat, ±10 points, la poule rangée** | **98 / 92 / 88 / 73 / 77 %** | **55 %** | **97 / 58 / 67 / 34 %** | **90 / 33 / 23 / 8 %** |

Les marches sont calées sur des duels isolés (la référence au niveau 1 des compétences) pour viser 95 / 85 / 75 / 65 / 50 % ; les parties entières tombent
au-dessus (des compétences montent). En poule, sans les marches, la référence bat Tobin 100 %, Vessa et Cassius 99 %, Ilse 88 %, Rhosk 78 %, Orla 26 %,
Marek 13 % (duels isolés, niveau 1).

## 13. Ce que la refonte remplace, garde et retire

- **Remplacés** : la commande à trois touches et sa charge (`src/combat/charge.ts`, `v2duel.ts`), le bot du duel (`bot.ts`), la course hors écran
  (`profiles.ts`, `V2_RACERS`), le HUD du duel (`DynamicHud.ts`), la fiche de match, la page des compétences, le guide « Le duel » et « Préparer un
  combat », le tutoriel du premier duel (TU4), les touches du duel au remappage (RM3) et à la manette (MN2), les couches musicales qui suivent le
  joueur (règle F, SN14), les effets par action (FX, gardés mais rattachés aux nouveaux moments), les outils `duel-balance`, `arena-scene-check`,
  `attack-spam-proof`, la politique des bots du laboratoire, les paramètres d'essai du duel (`input=keys`, `dyn=`, `fx=off`, `combat=dynamic`).
- **Gardés** : les cinq stats et leurs formules, les fiches des rivaux, l'équipement en points, l'entraînement, la vigueur, les compétences et leurs
  niveaux, les PA, les recharges, la rupture, les feuilles de combat cuites des combattants et leurs animations, l'arène et ses gradins, le son des
  coups et de la foule.
- **Retirés** : la riposte (DB-2, A3), la garde à 90 % des rivaux dans leurs pauses (DB5-2), la priorité de l'adversaire pendant sa séquence (G3,
  CB-4 : il n'y a plus de séquence jouée contre le joueur), le « repoussé » (CB-3).

## 14. Les contrats et les décisions A3 touchées

- **Contrat projet § 6.1** (déjà amendé par CB-8, AV-5, CH1) : sa première phrase décrit la commande à trois touches. Texte proposé (décision **A3**) :
  « Le combat est un « tour par tour dynamique » dont le format de départ est 1 contre 1, joué par l'ordinateur : le temps ne s'arrête pas ; chaque
  combattant choisit une action et la charge sur une ligne de temps, puis elle part, la Vivacité réglant la charge ; les compétences sont payées en
  points d'action et réglées par leur niveau ; la garde et l'esquive sont des réactions que donnent la Défense et la Vivacité ; le joueur prépare le
  duel et, en semi-automatique, choisit quand lancer ses compétences (spécification : briefs/combat-auto.md). » Version 3 (fiche AC-19) : « … joué par
  l'ordinateur selon la préparation du joueur : … puis elle part, en un coup ou en enchaînement, la Vivacité réglant la charge ; … la garde et l'esquive
  sont des réactions que donnent la Défense et la Vivacité (spécification : briefs/combat-auto.md). », sans le semi-automatique tant qu'il n'est pas retenu. Le second alinéa (« lisible,
  tactique, rapide à comprendre, suffisamment profond pour valoriser la préparation… ») ne change pas.
- **Contrat tournoi § 6** : tenu mieux qu'aujourd'hui (la même simulation hors écran).
- **Décisions A3 gardées** : DB5-3 (la recharge), DB5-4 (la rupture), DB7-1 (les cinq stats et les formules), DB7-3 et DB11-5 (l'entraînement),
  DB7-4 et DB11-6 (la vigueur, Ren 300) ; DB7-2 (l'équipement en points) et DB7-5 (les fiches des rivaux) dans leur principe.
- **Décisions A3 que la refonte demande à changer** (chacune sur la fiche) : DB-2 (la riposte retirée), DB7-6 et DB11-2 (la croissance des rivaux,
  leur Vivacité de poule gardée tout le tournoi), le § 6.1 ; et, depuis la direction de l'opérateur (Passe AC2), DB7-2 (les points de l'équipement doublés, AC-19) et DB7-5 (les fiches
  devenues des formes, la force venant du moment, AC-20) ; DB5 (la durée) seulement si l'opérateur veut un autre temps que « 2 et 5 min ».

## 15. L'ordre de construction (après la fiche)

1. **La simulation** dans `src/combat/` (pure, testée contre des oracles), son IA, les combats hors écran, le laboratoire et la courbe calée sur des
   parties entières.
2. **L'arène montre le duel** : la ligne de temps (deux barres de charge), les PV, les jauges, les PA, les quatre compétences et leurs recharges,
   ×2 et « Passer » ; la fiche de match (les deux fiches, les chances, la préparation, la forme).
3. **Le semi-automatique** (touches, manette, remappage), le guide et le tutoriel du premier duel.
4. **Le son et les effets** sur les nouveaux moments.
5. **Le retrait** de l'ancien duel et de ses outils.

Chaque lot se prouve (tests, laboratoire, preuves dans le navigateur) et se fusionne ; l'essai de l'opérateur suit le lot 2 ou le lot 3, selon la fiche.

---

## 16. Le modèle complet (version 3, journal Passe AC3)

**Les mots de l'opérateur** (11/11/2026, mot pour mot, journal Passe AC3) : « cela semble deja plus prometteur car finalement on est similaire a un
match de chevaux ou nous devons prepaprer nos joker le mieux possible pour maximiser ces chances de victoires et chaque courses il jouerai contre les
meilleurs au fur et a mesure. dans notre cas on peut faire en sorte que les matchs de poules donnent des adversaires au niveau similaire meme si ils ont
des stats propres a leur specifite. » ; « les rivaux grsndissent surtout petit a petit en phase de groupe mais grandement en phase finale, ce qui est
coherent au jeu » ; « mais dans nos actions de combats on peut tres bien dans une simulation avoir des choregraphies/combos d'attaques ou on enchaine 2-3
coups par exemple bref il faut vraiment que notre simulation de combat soit diversifier et que cela se repercute dans notre preparation avec nos
equipements accessoires competences> » ; « Met totalement a jour la fiche pour soumettre des infos coherentes ».

### 16.1 Les règles du modèle complet

- **La ligne de temps** (§ 1), inchangée.
- **Les enchaînements** : une action peut porter plusieurs coups, chacun gardé ou esquivé à part, `gap` secondes l'un après l'autre ; une rupture coupe
  l'enchaînement de celui qui est rompu. L'attaque simple de Ren dépend de son arme (l'épée d'entraînement 2 coups de 0,55, la lame importée 2 coups
  de 0,62, le sabre de duelliste 3 coups de 0,42 plus rapides) ; Taille éclair frappe 2 fois, Tourbillon 3 fois ; les rivaux retrouvent leurs combos
  d'aujourd'hui (`DYN_PROFILES` : 2 à 5 coups, chacun trois quarts d'un coup simple, dans leur part d'aujourd'hui). +1 PA une fois par attaque simple.
- **La défense** (§ 3) : les stats, la garde ×2 contre une compétence vue venir, la charge qui expose (et son propre enchaînement aussi), les traits des
  rivaux d'aujourd'hui (`V2_FOES` : l'esquive de Vessa et de Cassius ajoutée à leur chance, la moitié de la garde de Marek, Ilse, Cassius, Orla, Rhosk).
- **Les PA, les recharges (DB5-3), la rupture (DB5-4)** gardés ; la riposte (DB-2) retirée ; une forme du jour ±15 % dite sur la fiche.
- **L'automatique qui place ses soutiens** (`autoSmartDecider`) : la défensive quand l'adversaire charge un gros coup qu'elle couvrira, ou quand sa
  jauge passe les deux tiers ; le soutien seulement quand une compétence offensive peut suivre (ses PA, sa recharge) ou quand l'adversaire est rompu ;
  sinon la plus forte compétence offensive qu'il peut payer, sinon l'attaque simple. Le joueur règle ses quatre compétences et leur ordre.
- **L'équipement ×2** : chaque point de chaque pièce et de la forge doublé (DB7-2, A3).
- **La course** : chaque rival garde la forme de sa fiche (DB7-5), ramenée à un niveau commun en poule (PV, Attaque, Défense, Endurance du même facteur,
  calé pour que le joueur de référence du jour 2 batte chacun 92 fois sur 100), sa Vivacité de poule gardée tout le tournoi ; puis +10 % à chaque tour
  de poule, ×1,267 au tableau, ×1,533 en finale ; sa préparation en points d'Attaque visibles (+1 par 25 au-dessus de 20).
- **La durée** : les PV de chacun ×2 (DB5 tenue).
- **Le calage** (`level`) : les facteurs de poule sur duels isolés contre la référence du jour 2 (300 PV, Atq 17, Déf 11 : l'équipement ×2), le tableau
  et la finale sur parties entières de la référence (graines 1 à 80 ; demi-finale 65 %, finale 50 %), vérifiés sur les graines 101 à 160.

| Rival | facteur | poule (tour 1 → 3) | tableau | finale |
|---|---|---|---|---|
| Vessa | ×0,974 | 487 PV, Atq 6,8 → 584, 8,2 | 617, 8,6 | 747, 10,5 |
| Tobin | ×1,333 | 693, 12,0 → 832, 14,4 | 878, 15,2 | 1 063, 18,4 |
| Cassius | ×1,084 | 607, 11,9 → 728, 14,3 | 769, 15,1 | 931, 18,3 |
| Orla | ×0,877 | 526, 10,5 → 631, 12,6 | 667, 13,3 | 807, 16,1 |
| Ilse | ×0,987 | 612, 9,9 → 734, 11,8 | 775, 12,5 | 938, 15,1 |
| Marek | ×0,826 | 537, 10,7 → 644, 12,9 | 680, 13,6 | 823, 16,5 |
| Rhosk | ×0,948 | 664, 11,4 → 796, 13,7 | 841, 14,4 | 1 017, 17,4 |

(Les PV avant le ×2 de la durée ; chaque Défense et Endurance du même facteur que l'Attaque.)

### 16.2 Les mesures du modèle complet (parties entières, graines 101 à 160)

Les joueurs :

| Politique | Jour 2 | Jour 4 | Jour 5 | Demi-finale | 3e place | Finale | Titres | Durées poule / tableau / finale |
|---|---|---|---|---|---|---|---|---|
| référence | 92 % | 92 % | 65 % | 73 % | 94 % | 51 % (43) | **37 %** | 161 / 190 / 213 s |
| planificateur | 92 % | 92 % | 65 % | 47 % | 87 % | 21 % (28) | 10 % | 161 / 175 / 231 s |
| curieux | 87 % | 65 % | 15 % | 12 % | 19 % | 0 sur 5 | 0 % | 189 / 213 / 282 s |
| diligent | 88 % | 42 % | 2 % | 0 % | 2 % | — | 0 % | 172 / 171 / — s |
| inactif | 57 % | 13 % | 2 % | 0 % | 0 % | — | 0 % | 153 / 126 / — s |

Un duel de la référence : 19 compétences, 172 coups portés (les deux), 1,52 rupture du rival et 0,29 de Ren, 7,3 retournements.

Les règles (`variants`, une règle changée, avant recalage ; titres référence / inactif) : le modèle 37 / 0 % ; mêmes chances de garde partout 18 ;
garde toujours sur alerte 48 ; aucune réaction 13 ; la charge n'expose pas 5 (duels de 244 / 287 / 321 s) ; sans PA 43 (4,9 retournements) ; PA par le
temps 47 ; sans recharge 70 ; rupture 6 s ×1,5 10 ; sans rupture 5 ; sans forme du jour 25 ; sans enchaînements 70 (108 coups, 6,2 retournements) ; sans
les traits des rivaux 62 ; l'automatique d'aujourd'hui 2 % ; PV ×1 27 % (80 / 93 / 110 s) ; PV ×1,5 33 % (122 / 138 / 157 s) ; l'équipement ×1 0 %
(poule 56 %), ×1,5 7 %, ×3 72 % ; la croissance d'aujourd'hui 0 % ; la courbe B des Passes AC1-AC2 85 % ; la montée de poule à +5 % 45 % (poule du
diligent 63 %, de l'inactif 30 %) ; la préparation des rivaux en multiplicateur caché 0 %.

Le semi-automatique construit sur l'automatique qui place ses soutiens (`semiSmartDecider`) : attentif 2 %, distrait 3 % (l'automatique 37 %) ; avec la
garde toujours sur alerte, 12 et 8 % (l'automatique 48 %). [?] Garder une compétence pour un bon moment coûte plus que le moment ne rapporte dans ce
modèle ; ce n'est pas un verdict sur le mode, seulement sur ces deux façons de le jouer.

L'écart de rang entre rivaux (`--spread=8`, la poule seule recalée) : la référence 25 % de titres (98 / 85 / 68 / 71 / 37 %), le curieux 0 %,
l'inactif 82 / 5 / 0 % en poule ; entre rivaux, le moins fort gagne 21,8 % (32,4 % sans écart, 24,8 % sans forme du jour, 7,4 % dans la course
d'aujourd'hui) ; le même favori que la course dans 82 paires sur 126 (49 sans écart).

La préparation contre chaque rival (duels isolés, la référence de chaque étape, 60 graines) : au tableau, le kit de départ fait 5 à 27 % avec
l'automatique d'aujourd'hui, 52 à 88 % avec celui qui place ses soutiens. À la finale :

| Préparation | Tobin | Vessa | Cassius | Ilse | Rhosk | Orla | Marek |
|---|---|---|---|---|---|---|---|
| kit de départ | 30 | 27 | 25 | 25 | 57 | 42 | 38 |
| Attaque puissante, Taille éclair, Estoc, Ferveur | 12 | 37 | 13 | 7 | 15 | 18 | 8 |
| quatre offensives | 98 | 98 | 95 | 95 | 95 | 98 | 95 |
| Fracas, Taille éclair, Estoc, Rempart | 88 | 88 | 80 | 82 | 92 | 95 | 98 |
| Feinte, Fente, Estoc, Ferveur | 58 | 50 | 38 | 57 | 67 | 60 | 68 |
| défensif | 2 | 2 | 2 | 0 | 7 | 3 | 0 |
| épée d'entraînement / lame importée / sabre | 8 / 30 / 55 | 13 / 27 / 65 | 5 / 25 / 43 | 5 / 25 / 45 | 23 / 57 / 65 | 18 / 42 / 72 | 10 / 38 / 58 |

[KO de l'équilibre, à construire] Le meilleur choix ne change pas d'un rival à l'autre : quatre offensives et le sabre dominent. La construction équilibre
les compétences et les armes avec ce tableau comme test (fiche AC-12).

Les combats hors écran : 0,10 ms par combat.

## 17. Les décisions de la fiche (11/11/2026, journal Passe AC4)

La fiche https://claude.ai/artifact/6ksgfzxv8F3zSHhPhyh4PV (`briefs/fiche-combat-auto.html`, version 4), relue le 11/11/2026 : **vingt choix sur vingt
à la recommandation**, une note. Les choix et la note mot pour mot, et les décisions A3 citées et datées : journal Passe AC4. Ce paragraphe dit ce qui
s'applique ; là où les §§ 1 à 16 diffèrent, il l'emporte.

| Carte | Le choix, mot pour mot | Ce qui s'applique |
|---|---|---|
| AC-01 | « La ligne de temps : choisir, charger, partir » ; note : « mais il faut s'assurer que cela soit rythme, dynamique » | § 1 et § 16.1 ; le rythme, un critère de la construction (§ 17.2) |
| AC-02 | « Les enchaînements : l’arme de Ren, deux compétences, les combos des rivaux » | § 16.1 |
| AC-03 | « Les garder : +1 par attaque simple qui touche, les compétences les paient » | § 2 |
| AC-04 | « Garder DB5-3 (5 × le temps de charge) » | DB5-3 gardée (A3) |
| AC-05 | « Les stats, garde ×2 contre une compétence vue venir, la charge qui expose, les traits » | § 3 et § 16.1 |
| AC-06 | « Garder DB5-4 (10 s, ×2, jauge de 70) » | DB5-4 gardée (A3) |
| AC-07 | « La retirer (décision A3 : change DB-2) » | la riposte retirée (A3) |
| AC-08 | « Une forme du jour ±15 %, dite sur la fiche de match » | § 10 |
| AC-09 | « L’automatique qui place ses soutiens ; le joueur règle ses quatre compétences et leur ordre » | § 16.1 |
| AC-10 | « L’automatique d’abord ; le semi-automatique revu après mon essai » | le semi-automatique hors des lots |
| AC-11 | « Doubler les points de l’équipement (décision A3 : change DB7-2) » | chaque point ×2, malus compris (A3) |
| AC-12 | « Équilibrer avec ce test : chaque adversaire a ses réponses, rien ne domine » | le tableau du § 16.2 comme test du lot 1 |
| AC-13 | « Garder DB5 : PV ×2, avec ×2 et Passer » | DB5 tenue (A3) ; § 8 |
| AC-14 | « Le planificateur, avec la vérification de Hilde et l’exercice de son kit » | § 9 |
| AC-15 | « Un titre sur trois (95, 85, 75, 65, 50 %) » | la cible de la course |
| AC-16 | « La course, niveau commun en poule, +10 % par tour (décision A3 : change DB7-5, DB7-6, DB11-2) » | § 16.1, recalée à la construction (A3) ; la pente changée par LC1-1 : +15 % par tour (A3, § 19) |
| AC-17 | « Des points d’Attaque visibles sur la fiche de match » | § 16.1 |
| AC-18 | « La même simulation, l’IA des deux côtés » | § 11 |
| AC-19 | « L’amender maintenant avec ce texte, ajusté à mes choix » | contrat projet § 6.1 amendé le 11/11/2026 (A3) |
| AC-20 | « Approuvée avec mes choix ; en lots, dans le jeu par défaut, mon essai après le lot 2 » | cette spécification approuvée ; § 17.3 |

### 17.1 Les décisions A3

- **Changées** : DB-2 (la riposte, retirée, AC-07) ; DB7-2 (les points de l'équipement doublés, AC-11 ; le principe des points gardé) ; DB7-5, DB7-6 et
  DB11-2 (AC-16 : les fiches des rivaux deviennent des formes ramenées à un niveau commun en poule, la Vivacité de poule gardée tout le tournoi, +10 %
  par tour de poule, ×1,27 au tableau, ×1,53 en finale ; la croissance de DB13, ×1,7 et ×3,5, remplacée) ; le § 6.1 du contrat projet (AC-19). Puis AC-16
  elle-même, sur sa pente : +15 % par tour de poule (LC1-1, 12/11/2026, § 19).
- **Gardées** : DB5 (la durée, tenue par les PV ×2), DB5-3 (la recharge), DB5-4 (la rupture), DB7-1 (les cinq stats et leurs formules), DB7-3 et DB11-5
  (l'entraînement), DB7-4 et DB11-6 (la vigueur, Ren 300).
- **Retirés sans être des décisions A3** (§ 13) : la garde à 90 % des rivaux dans leurs pauses (DB5-2), la priorité de l'adversaire pendant sa séquence
  (G3, CB-4), le « repoussé » (CB-3).

### 17.2 Le rythme (la note de AC-01)

Le prototype (modèle complet, la référence du jour 4 contre les sept rivaux, 140 duels) donne 59 coups par minute, mais groupés :
- entre deux coups, 0,33 s en médiane et 2,8 s au 90e centile ;
- le plus long silence d'un duel, 6,8 s en médiane ;
- 41 % du temps dans des silences de plus de 3 s ;
- entre deux grosses actions, 6,1 s en médiane et 14,6 s au 90e centile.

La construction en fait un critère. Le lot 1 mesure ces nombres au laboratoire et cherche des silences plus courts sans toucher aux chances (AC-15)
ni à la durée (DB5). Le lot 2 donne à voir ce qui reste (les charges, les annonces, la caméra). L'essai de l'opérateur juge. Aucune cible n'est fixée
avant d'avoir été mesurée et montrée à l'opérateur.

### 17.3 Les lots (AC-20 ; à la place du § 15)

Chaque lot est construit dans sa séance, dans le jeu par défaut (VD-8), et fusionné après ses preuves.
1. **La simulation** dans `src/combat/`, pure et testée contre des oracles :
   - son IA (l'automatique qui place ses soutiens, l'ordre des quatre compétences), les enchaînements, la forme du jour ;
   - les combats hors écran par la même simulation ;
   - la course recalée sur parties entières aux chances de AC-15 (graines de calage et graines tenues à part) ;
   - les compétences et les armes équilibrées au test de AC-12, et le rythme (§ 17.2).

   Rien ne change à l'écran.
2. **L'arène montre le duel** : deux barres de charge, les PV, les jauges, les PA, les quatre compétences et leurs recharges, ×2 et « Passer ». La fiche
   de match donne les deux fiches, la forme du jour, la préparation des rivaux en points et les chances ; le joueur y règle l'ordre de ses compétences.
   **L'essai de l'opérateur suit ce lot.**
3. **Le guide et le tutoriel** du premier duel.
4. **Le son et les effets** sur les nouveaux moments.
5. **Le retrait** de l'ancien duel et de ses outils (§ 13).

Le semi-automatique n'est dans aucun lot ; il est revu après l'essai (AC-10).

## 18. Le lot 1 construit (12/11/2026, journal Passe LC1)

Le lot 1 est dans `src/combat/` : `auto.ts` (la simulation, l'automatique dans l'ordre du joueur, l'IA des rivaux), `autoData.ts` (ses tables, la course,
un combat hors écran), `autoMatch.ts` (le combat d'une partie, l'équipement ×2). Seules les parties du laboratoire le jouent (`flags.autoDuel`, le
TournamentLab `--rules=auto`) ; le duel d'aujourd'hui reste à l'écran jusqu'au lot 2. Prouvé contre le prototype exécuté à côté (§ 16, les mêmes duels
événement par événement sur ses tables, `tests/auto-prototype.json`), puis chaque règle contre un oracle (`tests/combat-auto.test.mjs`). Ce que la
construction a changé aux nombres du § 16, sans toucher aux règles décidées :

- **Le rythme** (§ 17.2) : la cadence des rivaux ×0,5 (leurs temps de charge et leur puissance du même facteur, leurs dégâts par seconde gardés). La
  référence du jour 4 contre les sept rivaux : 70 coups par minute, le plus long silence d'un duel 4,8 s en médiane, 12 % du temps en silences de plus
  de 3 s (le prototype : 57, 6,4 s, 41 %), à durée égale ; dans des parties entières, 73 coups par minute et 11 %. Aucune cible n'est fixée : l'essai
  de l'opérateur juge (fiche LC1-2).
- **L'automatique** : une protection longue (Rempart, Peau de fer, `cover`) se lève aussi pour couvrir, dès que les PA laissés paient une offensive ;
  l'ordre par défaut quand le joueur n'en règle pas : les protections, les soutiens, puis les offensives de la plus forte.
- **L'équilibre** (AC-12) : les briseurs ×1,5 (×2,5 avant) ; Rempart −60 % / jauge ×0,3 pendant 9 s ; Peau de fer −70 % / ×0,15, 11,2 s ; Posture de
  riposte −95 %, 6,5 s ; Ferveur ×1,8 / ×2, 12 s, 2 PA ; Cri de guerre ×2,3 ; Concentration ×1,5 / ×4 ; les gros coups des bagarreurs remplissent la
  jauge de Ren (Orla, Rhosk ×2 ; Marek, Tobin ×1,6) ; le sabre 3 × 0,23. Rival par rival, à force égale pour le kit de départ, le test de AC-12 tient au
  tableau et en finale sur les graines tenues à part ; en poule il bute sur le plafond ; le catalogue entier garde des écarts (Peau de fer en poule,
  Rempart en finale) : fiche LC1-3.
- **La course** (AC-16), recalée sur parties entières : les facteurs de poule de 0,84 (Orla) à 1,38 (Tobin), +10 % par tour (A3), ×1,305 au tableau,
  ×1,586 en finale. Graines tenues à part 101 à 160 : la référence 98 / 98 / 100 / 68 / 49 % du jour 2 à la finale, **33 % de titres** ; le planificateur
  17 %, le curieux 3 %, le diligent et l'inactif 0 % ; des combats de 143 / 226 / 250 s en médiane (poule, tableau, finale). La poule est plus facile que les
  85 et 75 % visés aux jours 4 et 5 : à +15 % par tour, 98 / 97 / 75 / 66 / 45 % et 28 % de titres (fiche LC1-1, A3). La pente est passée à +15 % (§ 19).
- **Les combats hors écran** : 0,16 ms par duel dans Node ; entre rivaux, le moins fort gagne 25 % du temps.

La fiche du lot : https://claude.ai/artifact/WpWZvn9TyYa7dbGnY8t89y (`briefs/fiche-combat-auto-lot1.html`), quatre cartes, relue le 12/11/2026 (§ 19).

## 19. La fiche du lot 1 (12/11/2026, journal Passe LC2)

Les choix de l'opérateur, mot pour mot :

| Carte | Choix | Ce qui s'applique |
|---|---|---|
| LC1-1 | « +15 % par tour (décision A3 : change AC-16) » | la poule à +15 % par tour (`AUTO_RACE.pool` 1, 1,15, 1,3) ; le reste d'AC-16 inchangé |
| LC1-2 | « Garder ×0,5 et juger à mon essai » ; sa note : « il faut peut etre penser a baisser le temps de charge pour une competences car elle etait adapter a notre systeme de combat premier avec l'inspiration de Cyn de FF6 » | la cadence des rivaux ×0,5 gardée ; la note au lot 2 |
| LC1-3 | « Reprendre au lot 2, avant mon essai » | l'équilibre du catalogue entier au lot 2 |
| LC1-4 | « Bien ainsi » | les ajouts de la construction gardés |

- **La course à +15 % par tour** : les facteurs de poule de chaque rival gardés (calés au premier tour), le tableau ×1,305 et la finale ×1,586 gardés
  (le tableau ne dépasse plus le troisième tour de poule, ×1,3, que d'un rien). Graines tenues à part 101 à 300 (200 parties) : la référence 96 / 95 / 75 /
  70 / 52 % du jour 2 à la finale, **34 % de titres** ; le planificateur 14 % ; des combats de 153 / 228 / 247 s. Un recalage des paliers (`level --keep-norm`)
  les déplaçait de moins de 1 %, sous la résolution du calage, et rendait le tableau plus facile (76 %, 37 % de titres) : non gardé.
- **Le lot 2, avant l'essai** : l'équilibre du catalogue entier (LC1-3 : Peau de fer en poule, Rempart en finale, le sabre au tableau, le test de AC-12
  étendu aux 715 kits) et les temps de charge des compétences de Ren (la note de LC1-2 : au niveau 1, la Taille éclair 3,4 s, le Tourbillon 5,1 s, l'Estoc
  7,65 s, Rempart 3,0 s, Ferveur 4,25 s, l'attaque simple 1,2 s, quand les gros coups des rivaux chargent 1,5 à 2,2 s à la cadence ×0,5), mesurés ensemble,
  puis la course relue sur 200 parties tenues à part.

## 20. Le lot 2 construit (12/11/2026, journal Passe LC3)

Le duel joué par l'ordinateur est le duel du jeu par défaut : chaque partie de la version 2 y joue le combat du jour, les défis et les représailles, et ses
combats hors écran (AC-18) ; `flags.autoDuel` n'existe plus. Le jeu par défaut rejoue au JSON près les parties `--rules=auto` du lot 1 (cinq politiques,
graines 1 à 30). Le jeu d'aujourd'hui (`v2=0`) garde son duel.

- **AC-11 dans la table de l'équipement** : chaque point de chaque pièce, de la forge et de la pierre à aiguiser doublé dans `GEAR` (malus compris ; les PA
  et la durée des effets gardés) : la page de l'équipement, la fiche de match et le duel disent le même nombre.
- **L'arène joue le script** (`src/arena/autoView.ts`, `AutoHud.ts`) : le duel décidé avant (le résultat du jeu), son déroulé montré sur les feuilles de combat
  approuvées sans image nouvelle (la charge de Ren sur ses images de charge, le télégraphe du rival qui charge un gros coup, l'élan et le coup à l'instant du
  script, l'esquive, la garde, l'étourdi, les effets, le K.O.) ; les cartes portent chacune la charge en cours sur la ligne de temps, la jauge de rupture, les
  effets ; le pied, les quatre compétences de Ren dans son ordre avec leurs recharges, puis ×2 et « Passer » (sur les touches de l'attaque et de l'esquive) ;
  la pause et ses réglages. `?scene=arena` seul joue ce duel ; l'ancien duel à trois touches reste derrière `?duel=charge` pour ses preuves jusqu'au lot 5.
- **La fiche de match** : les deux combattants comme le duel les construit (la santé du combat, les quatre stats, la forme du jour de chacun, l'esquive et la
  garde de chacun contre l'autre), l'entraînement du rival en points d'Attaque (AC-17), l'ordre des quatre que le joueur règle (AC-09 : `kit.order`, l'action
  `setOrder`, les touches gauche et droite sur une compétence emportée, dans la fiche comme dans la page des compétences). Elle ne montre pas de chances de
  victoire (aucune décision ne les demande : carte LC3-7).
- **Les deux réglages de LC1-3, mesurés ensemble** (temps de charge de Ren, la note de LC1-2 ; le catalogue entier, 715 kits) : raccourcir les charges divise
  presque par deux les silences, mais avec la pente de poule décidée (+15 %, A3) le jour 5 tombe de 75 % à 19-47 % ; calée autrement, la course sort de DB5
  (A3) ; les retouches du catalogue cassent le test de AC-12 ou la course. **Aucun nombre ne change** ; trois cartes pour l'opérateur (LC3-3 à LC3-5).
- **La course relue** sur 200 parties tenues à part (101 à 300) : la référence 96 / 95 / 75 / 70 / 52 %, 34 % de titres (le planificateur 14 %, le curieux 5 %) ;
  des combats de 153 / 228 / 247 s en médiane ; 10,5 % du temps en silences de plus de 3 s.
- **Les écarts jusqu'aux lots suivants** : le tutoriel du premier duel (TU-11) ne s'affiche plus et le guide décrit l'ancien duel (lot 3) ; le son n'a pas de
  moments neufs (lot 4) ; les touches et les outils de l'ancien duel (lot 5).

La fiche de l'essai : https://claude.ai/artifact/7j6XSZttdz2Q8HoPgR6SkT (`briefs/fiche-combat-auto-lot2.html`), dix cartes LC3-1 à LC3-10, à remplir après
l'essai de l'opérateur.

## 21. La fiche d'essai du lot 2 et la relecture fluide (12/11/2026, journal Passe LC4)

La fiche relue le 12/11/2026 (choix cliqués de 17 h 47 à 17 h 49 UTC, aucune note), dix sur dix à la recommandation, aucune décision A3 :
LC3-1 « Reçu », LC3-2 « Le rythme convient », LC3-3 « Les garder pour l’essai, juger en jouant », LC3-4 « Garder les tables du lot 1 pour l’essai »,
LC3-5 « Le garder tel quel », LC3-6 « Bien ainsi », LC3-7 « Rien de plus pour l’instant », LC3-8 « Garder ainsi ; renommer au lot 5 », LC3-9 « Bien
ainsi : lots 3 puis 4 », LC3-10 « Bien ainsi ». Rien des règles, des tables ni de la course ne change ; la fiche de match ne montre pas de chances ;
×2 et « Passer » restent sur les touches d'attaque et d'esquive, les actions du duel renommées au remappage au lot 5 ; le guide et le tutoriel (lot 3)
avant le son (lot 4).

Puis, à la demande de l'opérateur (« Assurons nous que notre systeme est coherent avec tout le reste du jeu et que visuellement tout est bien amorce
et fluide »), la relecture de l'arène :
- elle lit tout le script avant que le duel se joue (`windowsOf`, `src/arena/autoView.ts`) : chaque coup est dessiné depuis son élan, qui finit sur
  la ligne du coup (le premier coup d'une action dans 60 % au plus de sa charge, le coup suivant d'un enchaînement dans 80 % au plus de l'écart avec le
  précédent, jamais pendant l'étourdissement de celui qui frappe ; une esquive 0,1 s avant le coup évité) ; un coup est dessiné jusqu'à son impact avant
  toute réaction de celui qui le porte ;
- dans l'arène de ce duel seul : un élan ne ramène jamais le corps en arrière (le coup suivant, un coup après un recul gardent l'avancée), le corps
  revient pendant que l'élan n'a pas commencé (l'avertissement du rival), et un mouvement plus rapide que le pic de l'élan (27 m/s) est fait à cette
  vitesse plutôt qu'en un saut ; les autres duels (`v2=0`, `duel=charge`, `combat=dynamic`) sont inchangés ;
- « Passer » descend au noir en 0,22 s, le duel atteint son K.O. sous le noir, le noir se lève en 0,3 s (l'horloge de l'arène) ;
- mesuré sur trois duels entiers à 60 images/s (Marek, Vessa, Orla) : sur `main` 0dfeeb8, 49 à 114 sauts de plus de 0,6 m par combattant et par duel,
  jusqu'à 3,45 m d'une image à l'autre, et des coups portés le corps chez lui ou en esquive ; après, aucun saut, 0,45 m au plus par image (0,53 m avec
  le recul d'un coup reçu), chaque coup porté dessiné, l'élan à l'impact de 1,48 m au moins (1,88 m en médiane pour Ren, son élan entier).

---

## Annexe A — Les mots de l'opérateur, mot pour mot (11/11/2026)

Passe AU3, en réponse au chantier n° 1 de la Passe AU2 :

> je pense que nous devons partir du principe que les duels seront des combats auto par ordinateur ou nous les joueurs nous allons surtout nous focus sur la preparation du combat ( equipement, skills, etc...) donc on doit bien adapter le systeme de combat avec des valeur coherente pour une simulation optimale puis par la suite on vera si on effectue un systeme semi-auto... le vrai changement sera d'integrer un zone de charge/attente avant d'agir peut etre que voir comment adapter cela avec AP bref il faut bien penser a ce la

> sinon les autres chantiers semblent bon mais comme je dis tout ce qu'il est lie au combat devra etre repenser donc

Passe AU4 : « voici une inspiration interessante : », suivi d'une présentation collée de *La Brute*.

Passe AU5, en réponse à la Passe AU4 :

> Il faudrait une ligne de temps mais les PA sont essentiels pour l'usage des competences sauf si on a un meilleur choix, et la defense et esquive comment cela sera gere ? on a deja defini 5 stats

> determinons le plus optimale mais comme j'ai dit un system semi-auto permettrait de determiner quand lancer les competences par exemple

> il faut determiner un temps de simulation suffisamment bon a profiter du duel

> oui on est sur une inspi car on a deja notre idee de base de ce que nous voulons mais il s'avere que ce n'est pas bien structure car le joueur perd trop souvent face au ennemie avance/expert par exemple, ce qui est la problematique
