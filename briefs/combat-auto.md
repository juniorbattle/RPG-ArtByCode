# Le combat joué par l'ordinateur — spécification (atelier de refonte du combat, 11/11/2026)

**Statut : approuvée par l'opérateur le 11/11/2026 ; le lot 1 construit le 12/11/2026 (§ 18), sa fiche relue le même jour (§ 19) ; le lot 2 construit le même jour, le duel dans le jeu par défaut (§ 20), sa fiche d'essai relue le même jour, dix sur dix à la recommandation, et la relecture de l'arène rendue fluide (§ 21) ; le lot 3 construit le même jour, le guide et le tutoriel du premier duel (§ 22) ; le lot 4 construit le même jour, le son et les effets des nouveaux moments (§ 23), sa fiche d'écoute relue le même jour, huit sur huit à la recommandation, le signe de la forme du jour branché et la jauge prouvée au coup même (§ 24) ; ensuite l'essai en jeu de l'opérateur et le lot 5 (le retrait de l'ancien duel) ; puis la seconde refonte, ouverte par les directions de l'opérateur du 12/11 (les mêmes règles pour Ren et les rivaux ; les compétences automatiques, à la tactique ou à la main) : l'atelier SY1 mesuré et sa fiche publiée (§ 25), relue le même soir, quatorze sur quatorze à la recommandation, trois décisions A3 (§ 26) ; le lot 1 construit le 13/11/2026, les règles communes (§ 27), sa fiche publiée ; la première partie du lot 2 fusionnée (§§ 29, 30) ; puis l'atelier du système de combat final, mesuré au laboratoire, sa fiche publiée le 13/11/2026 (§ 31)** (fiche de l'atelier, AC-20 « Approuvée avec mes choix ; en lots, dans le jeu par défaut, mon essai
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

## 22. Le lot 3 construit : le guide et le tutoriel du premier duel (12/11/2026, journal Passe LC5)

Le tutoriel du premier duel (TU-11 « Pendant le premier duel, figé à chaque première fois », la fiche TU de l'opérateur) écrit pour le duel joué par
l'ordinateur ; le guide (H) avec lui. Aucune règle, aucune table, aucun temps de charge ni la course ne changent ; le jeu d'aujourd'hui (`v2=0`) et le duel
à trois touches (`?duel=charge`) n'ont rien de neuf.

- **Neuf leçons** (`src/ui/duelTutorial.ts`), chacune la première fois que son moment arrive dans le script du duel, la relecture tenue sur le pas qui
  l'ouvre (plus aucun pas après lui ; ni ×2 ni « Passer » pendant la lecture) : le duel qui se joue seul et l'ordre des quatre (au « Combattre ») ; une
  charge et sa barre (Ren charge une compétence) ; un enchaînement (un coup qui n'est pas le premier de son action) ; les PA (la première attaque simple de
  Ren qui touche) ; la garde et l'esquive (un coup gardé ou esquivé : les chances de ce combat, celles de la fiche de match) ; la forme du jour (une
  compétence ou un gros coup qui touche : la forme de chacun, celle de la fiche) ; la jauge (la jauge d'une cible au tiers) ; la rupture ; ×2 et « Passer »
  (après 20 s de duel). Une bande au-dessus du pied du HUD les dit, l'élément du HUD dont elle parle éclairé comme la visite éclaire le sien ; Entrée
  continue, Échap saute le reste ; chacune une fois par navigateur (`cite-du-tournoi.auto-lessons`), jamais au K.O. ni sous le noir de « Passer ».
- **Les nombres** sont ceux du combat : `AUTO_RULES` (les PA, la garde ×2, −80 %, la rupture 10 s ×2, la forme ±15 %, la jauge d'un coup gardé ×2),
  `AUTO_COOLDOWN`, l'arme de Ren (ses coups), sa Vivacité (sa charge), ses PA de départ, les chances de `autoReactions` des deux combattants, les formes
  tirées avant le combat. Aucun chiffre n'est écrit dans les textes.
- **Le guide** : « Le duel » (le combat joué par l'ordinateur, la charge, l'ordre des quatre, les PA et les recharges, les enchaînements, la garde et
  l'esquive par les stats, la jauge et la rupture, la forme du jour, ×2 et « Passer » ; l'ordre des quatre dessiné d'après la partie) et « Préparer un
  combat » (l'ordre réglé sur la fiche de match et dans la page des compétences, les PV multipliés au combat, l'arme qui fixe les coups de l'attaque
  simple, la fiche de match et l'entraînement du rival en points d'Attaque). Les points de l'équipement : le guide dit que la page les montre tels que le
  duel les joue (ils sont déjà doublés dans la table depuis le lot 2, AC-11) ; dire « ×2 » les ferait doubler deux fois. « Me réapprendre » (Espace dans
  « Le duel ») refait ces leçons au combat suivant. Les touches du duel dans « Touches » : ×2 sur l'attaque, « Passer » sur l'esquive, la pause (LC3-8).
- **Les écarts jusqu'aux lots suivants** : le son des nouveaux moments (lot 4) ; le retrait de l'ancien duel et le renommage de ses actions au remappage
  (lot 5) ; la fiche de match sur téléphone en paysage ; AU-06.

## 23. Le lot 4 construit : le son et les effets des nouveaux moments (12/11/2026, journal Passe LC6)

Les sons du lot S3 et les recettes d'effets de FX2 à FX5, tous approuvés, placés sur les moments du duel joué par l'ordinateur ; rien de cuit. Aucune règle,
aucune table, aucun temps de charge ni la course ne changent ; le jeu d'aujourd'hui (`v2=0`) reste muet, le duel à trois touches (`?duel=charge`) garde les siens.

- **La charge de Ren** : sa charge d'une compétence est dite comme le palier de l'ancien duel (son rang parmi ses quatre par temps de charge) : la note de ce
  palier au début de la barre, un souffle toutes les 0,6 s tant qu'elle se remplit (repris après un étourdissement), le fouet et l'éclat quand l'action part ;
  son attaque simple charge sans rien, comme avant. Environ 8 charges par minute, 3,4 s en médiane.
- **Les coups d'un enchaînement** : le son et la recette propres d'une action sur son premier coup ; les suivants, le coup simple de leur camp, sans la foule.
- **La garde, l'esquive, la rupture et le K.O.** : inchangés (lot S3). La jauge qui monte n'a pas de son à elle.
- **La règle F** (CQ-REGLE) lue dans ce duel : la séquence de l'adversaire est sa charge d'un gros coup ou d'une compétence jusqu'à son coup (8 par minute, 2,9 s
  en médiane) ; la tension monte aussi pendant que Ren charge une compétence, sur un étourdissement et sous 30 % des PV.
- **×2** donne le clic de l'interface ; **« Passer »** fait descendre la musique avec son fondu au noir, le K.O. sous le noir, puis le jingle.
- **La jauge du HUD** au coup même (la relecture la remplit à la ligne du coup, comme le duel) : le relevé de la Passe LC5 corrigé sans toucher au script.
- **La forme du jour** : un candidat, hors du jeu jusqu'à la décision de l'opérateur : au début du combat, pour un combattant à ±5 % ou plus, deux notes du
  vibraphone qui montent (bonne forme) ou descendent (forme basse), calculées dans la page, et des particules de sa couleur qui s'élèvent ou tombent.

La fiche d'écoute : https://claude.ai/artifact/4brjscrgkqpYEvxnU8kz8f (`briefs/fiche-combat-auto-lot4.html`), huit cartes LC6-1 à LC6-8, à relire quand
l'opérateur la dit remplie.

## 24. La fiche d'écoute du lot 4 relue (12/11/2026, journal Passe LC7)

Huit choix sur huit à la recommandation, aucune note, aucune décision A3 : LC6-1 à LC6-6 « Bien ainsi », LC6-7 « Les deux signes », LC6-8 « Brancher ce que je
valide, puis mon essai en jeu ». Le signe de la forme du jour entre dans le jeu par défaut : une fois par combattant au début du combat (Ren à 0,35 s, l'adversaire à
0,75 s), à ×1,05 et plus ou ×0,95 et moins, ses deux notes calculées dans la page, ses particules de sa couleur ; rien sous « Passer ».

La jauge de rupture, mise en tête par l'opérateur (« apparemment on a la jauge de break qui semble avoir du retard lors des actions/coups executes surtout lorsqu'il y a
des combos »), est prouvée au coup même dans le navigateur, image par image : sur huit duels entiers (77 424 images à 60 images/s, quatre rivaux, Ren à l'épée
d'entraînement puis au sabre et avec Tourbillon), chaque barre montre la jauge du script à chaque image, et chaque coup qui doit la bouger la bouge sur sa propre image
(325 sur 325 : 90 coups suivants d'un enchaînement, 57 derniers de deux, 17 derniers de trois, 80 sur une protection, 75 sous un soutien) ; la base d'avant le lot 4
échoue (`tools/gauge-proof.mjs`).

## 25. La seconde refonte : les mêmes règles pour Ren et les rivaux, les compétences automatiques, à la tactique ou à la main (atelier SY1, 12/11/2026, journal Passe SY1)

**La demande.** L'opérateur, le 12/11/2026, mot pour mot (dans la séance de l'audit final, relayé par elle) :
- sur l'option D du semi-automatique : « Oui il faut bien optimiser le process... car l'idee est de soit tout tout automatiser, sinon rend auto les coups leger et
  puissant, mais activer manuellement ou de maniere planifier via gambit/tactique l'activation des competences pendant le combat » ;
- sur les mesures du semi-automatique : « ce n<est pas bon car cela veut dire que naturellement sans prendre en compte, les stats et etc... le joueur est
  desavantage par ses adversaires a cause de son gameplay et donc il y a des diferences d'actions, ce qui ne devrait pas car ils ont la meme logique de combat en
  soit des attaques simple et puissantes, des competences, et des blocages et esquives. l,equipement et l'entrainement permet de reduire la difference de force
  face a un ennemie naturellement plus fort de base bref une logique de RPG ».

**Statut** : un atelier ; rien du jeu n'est changé ; une fiche d'arbitrages publiée (§ 25.6), en attente de l'opérateur. Le prototype : `tools/auto-sym/`
(une copie du duel avec ses deux différences en interrupteurs, prouvée identique au jeu : 2 800 duels sur 2 800 événement par événement et 60 parties
entières sur 60, `identity.mjs`).

### 25.1 L'inventaire des écarts entre Ren et les rivaux

| Écart | Ren | Les rivaux | Source |
|---|---|---|---|
| E1 Les PA | paie 1 à 4 PA par compétence, gagnés par ses attaques simples qui touchent | ne paient rien (`ap: 0`) ; leurs PA montent sans servir | CB-1, § 5 (« Ils n'ont pas de PA ») ; AC-03 pour Ren |
| E2 L'attaque simple | l'enchaînement de son arme (2 ou 3 coups) | un coup simple, et une action « combo » de plus (3 ou 4 coups, 1,4 × la charge, 0,75 × un coup simple chacun ; elle compte comme attaque simple : elle n'expose pas pendant sa charge et n'est gardée qu'à ×1) | AC-02 (Passe AC3, `DYN_PROFILES`) |
| E3 Les tables | le catalogue (attaque simple 1,2 s, compétences 2,5 à 7,65 s au niveau 1 ; puissance DB5-1) ; charge × 10 / Vivacité | leurs propres tables (la fiche DB7 ×2), la cadence ×0,5 (charges et puissance), la charge × la Vivacité de leur kit / leur Vivacité ; gros coups 2,86 s en médiane | DB7, DB10, DB8 ; LC1, LC1-2 |
| E4 Les recharges | 5 × la charge au niveau 1 (DB5-3, A3) | fixes, 16 à 40 s ; leur coup lourd sans recharge | C3 |
| E5 Les traits | aucun | esquive de Vessa +35 %, de Cassius +20 % ; garde +5 à +17,5 % | AC-05 |
| E6 Qui décide | l'automatique dans l'ordre de ses quatre compétences, sans hasard | une IA à poids : une compétence prête une fois sur trois environ, leur coup lourd et leur combo par leur part | § 5, C3 |
| E7 Le hasard | un seul tirage pour tout le duel (réactions et IA) | le même | `autoDuel` |
| E8 Les égalités | Ren agit le premier à temps égal | — | `autoDuel` (négligeable) |

Chaque écart ramené seul à la règle de Ren, la course d'aujourd'hui gardée (parties entières de la référence, graines tenues à part 101 à 300 ; aujourd'hui
34 % de titres) :

| Variante | Titres | Lecture |
|---|---|---|
| le jeu | 34 % | — |
| tirages séparés par action (E7) | 32 % | neutre en moyenne |
| E1 les rivaux paient leurs PA (lourd 1, compétences 2) | 34 % | neutre (demi-finale 78 %, finale 44 %) |
| E2 pas de combo : leur attaque simple, l'enchaînement d'une arme | 81 % | le combo vaut environ 47 points aux rivaux |
| E3 leur cadence ×1 | 49 % | la demi-cadence leur vaut 15 points |
| E3 les tables de Ren (sans E4) | 0 % | inséparable de E4 : leur coup lourd au tableau de Ren, sans recharge |
| E4 la recharge de DB5-3 (le coup lourd compris) | 12 % | leurs longues recharges fixes leur coûtent 22 points |
| E5 sans traits | 53 % | les traits leur valent 19 points |
| E6 l'automatique de Ren, PA gratuits | 2 % | leur IA au hasard leur coûte 32 points |
| E6 et E1 ensemble | 64 % | — |
| tout ramené à Ren (avant de recaler la course) | 7 à 9 % | — |

Les écarts jouent dans les deux sens et la course les compense en moyenne ; mais ils décident de la façon de gagner : aujourd'hui, 79 % des dégâts d'un rival
tombent pendant que Ren charge une compétence (exposé, sans garde ni esquive), 53 % avec les mêmes règles.

**Un choix changé** (`branch.mjs` : Ren d'une partie neuve contre les sept rivaux de la poule, 30 graines ; une offensive de l'automatique remplacée par une
attaque simple après la mi-duel) : avec un seul tirage, le vainqueur change dans 17,6 % des duels et les vingt actions suivantes du rival restent les mêmes à
34 % ; avec des tirages séparés, 7,1 % et 76 %. Avec les mêmes règles (l'IA des rivaux devenue l'automatique, qui répond à ce qu'il voit), 14,3 % et 56 % : un
choix y a un effet réel sur la réponse de l'adversaire, plus seulement sur les tirages.
### 25.2 Le modèle des mêmes règles (proposé, mesuré au laboratoire)

Chaque combattant, Ren comme un rival, a :
- **une attaque simple** : l'enchaînement de son arme (Ren : ses trois armes ; un rival : son combo d'aujourd'hui devenu son arme, ses coups au total de l'épée
  d'entraînement, 2 × 0,55) ; la charge du catalogue (1,2 s) × 10 / Vivacité ; +1 PA quand elle touche ;
- **un coup puissant**, attaque de base hors des quatre, sans PA : celui du catalogue (1,7 s au niveau 1 ; sa puissance par sa charge, DB5-1) ; l'automatique
  le lance quand l'adversaire ne peut pas se défendre (rompu assez longtemps, ou en charge d'un gros coup qui part après lui) ou quand les PA sont pleins ;
  **avec sa recharge de DB5-3** (5 × sa charge) — sans elle il domine (§ 25.4) ;
- **ses compétences** : Ren ses quatre, un rival celles de son kit (C3) ; payées en PA (celles des rivaux 2 PA, comme Rempart et Ferveur), la recharge de
  DB5-3, la puissance d'une offensive par sa charge (DB5-1), les protections et soutiens des rivaux avec leurs effets d'aujourd'hui ;
- **la garde et l'esquive par les stats seules** (AC-05 sans les traits) ;
- **le même automatique** (celui de Ren, AC-09), chacun dans l'ordre de son kit (les protections, les soutiens, puis les offensives de la plus forte) ;
- **des tirages séparés par action** ;
- **une cadence commune** : toutes les charges et puissances × c (les dégâts par seconde gardés, les recharges avec les charges, la durée des effets gardée).

La cadence (avant recalage, la référence contre les sept rivaux, jour 4 et finale, 40 graines) :

| Cadence | Coups par minute | Plus long silence (méd.) | Silences > 3 s | Entre deux grosses actions | Durée méd. j4 / finale |
|---|---|---|---|---|---|
| aujourd'hui | 70 / 73 | 4,9 / 6,1 s | 11,9 / 11,5 % | 3,4 / 3,2 s | 182 / 230 s |
| ×1 (le catalogue) | 75 / 78 | 6,0 s | 18,1 / 17,6 % | 2,1 s | 148 / 202 s |
| **×0,75** | 96 / 101 | 4,5 / 5,0 s | 9,3 / 10,9 % | 1,7 s | 148 / 199 s |
| ×0,6 | 119 / 123 | 4,4 / 4,0 s | 6,8 / 7,7 % | 1,4 s | 150 / 204 s |
| ×0,5 | 138 / 144 | 3,4 / 3,2 s | 2,2 / 1,5 % | 1,1 s | 154 / 206 s |
### 25.3 La course et l'équilibre sur ces règles

La course recalée comme AC-16 le prévoit (`fit.mjs` : chaque rival au niveau où la référence du jour 2 le bat 95 fois sur 100 en duels isolés ; le tableau et
la finale sur les parties entières de la référence, graines 1 à 80, pour 65 et 50 % ; graines tenues à part 101 à 300), cadence ×0,75 :

| Modèle | Pente de poule | Facteurs (poule, de Vessa à Rhosk ; tableau ; finale) | Référence : j2 / j4 / j5 / demi / finale | Titres | Durées méd. (p10, p90) | Silences > 3 s |
|---|---|---|---|---|---|---|
| coup puissant sans recharge | +15 % (LC1-1) | 1,17 / 1,52 / 1,18 / 0,80 / 1,04 / 0,89 / 1,12 ; ×1,235 ; ×1,633 | 97 / 80 / 66 / 70 / 47 % | 28 % | 166 s (87, 239) | 9,5 % |
| coup puissant sans recharge | +10 % | les mêmes ; ×1,249 ; ×1,644 | 97 / 81 / 83 / 64 / 53 % | 31 % | 168 s | 9,6 % |
| coup puissant sans recharge | +5 % | les mêmes ; ×1,262 ; ×1,633 | 97 / 91 / 95 / 65 / 47 % | 30 % | 162 s | 9,4 % |
| **coup puissant rechargé** | +15 % (LC1-1) | 1,19 / 1,51 / 1,19 / 0,86 / 1,02 / 0,91 / 1,12 ; ×1,194 ; ×1,601 | 100 / 74 / 39 / 73 / 35 % | 20 % | 201 s (126, 268) | 15,7 % |
| **coup puissant rechargé** | **+10 %** | les mêmes ; ×1,228 ; ×1,58 | **100 / 90 / 75 / 72 / 51 %** | **34 %** | 202 s (125, 269) | 15,8 % |
| coup puissant rechargé | +20 % | les mêmes ; ×1,194 ; ×1,537 | 100 / 61 / 7 / 70 / 46 % | 18 % | 194 s (127, 263) | — |

Les autres joueurs, coup puissant rechargé, +15 % : le planificateur 16 %, le curieux 21 %, le diligent et l'inactif 0 %. Le coup puissant rechargé à la
cadence ×0,75 laisse 15,7 % du temps en silences de plus de 3 s ; à ×0,6, 9 à 11 % (duels isolés, avant recalage ; la cadence ne change pas les dégâts par
seconde).

**L'équilibre (AC-12)** ne tient plus avec ces règles (`kits.mjs`, coup puissant sans recharge, chaque rival au niveau où le kit de départ fait la cible de
l'étape) : au tableau et en finale, le sabre 85 à 88 % en moyenne, la lame 51 à 65 % ; les quatre offensives 8 à 16 % ; le kit défensif et Fracas font les
bonnes réponses ; aucun kit ne domine partout, mais plusieurs rivaux n'ont qu'une bonne réponse. À refaire à la construction, avec le même test (comme LC1).
### 25.4 Les façons de décider : ce qu'elles rapportent (`modes.mjs`)

Parties entières de la référence, graines 101 à 300, la décision de Ren remplacée ; « aujourd'hui » : le jeu avec des tirages séparés et sa course ;
« mêmes règles » : le coup puissant rechargé, cadence ×0,75, sa course recalée à +15 %. Une tactique : une condition par compétence (`deciders.mjs`) ; les
signaux : l'adversaire rompu assez longtemps, ou en charge d'un gros coup qui part après la compétence. Le coup d'avance : à chaque choix où une compétence peut
partir, chaque possibilité est jouée jusqu'au bout, l'automatique ensuite, et la meilleure fin gardée ; jugée sur six avenirs dont les tirages (ceux de ses
actions à venir, celle du rival en cours, les choix futurs du rival) lui sont inconnus ; 60 parties, l'automatique sur les mêmes.

| Façon de décider | Aujourd'hui | Mêmes règles |
|---|---|---|
| l'automatique | 32 % | 20 % |
| tactique : les offensives aux signaux, la première à PA pleins | 1 % | 17 % |
| tactique : les offensives aux signaux seulement | 0 % | 27 % |
| tactique : aux signaux, la moins chère à PA pleins | — | 28 % |
| tactique : la plus forte gardée pour la rupture | 29 % | 36 % |
| tactique : la plus forte gardée pour finir | 31 % | 30 % |
| tactique : les protections dès qu'elles sont prêtes | 15 % | 7 % |
| tactique : les soutiens jamais | 36 % | 12 % |
| appuis au hasard, un choix sur quatre | 20 % | 31 % |
| appuis au hasard, un choix sur deux | 14 % | 26 % |
| un coup d'avance (l'automatique sur les mêmes parties) | 62 % (25 %) | 98 % (17 %) |
| un coup d'avance qui connaît les tirages | 95 % (25 %) | — |

Avec le coup puissant sans recharge (sa course) : l'automatique 28 %, aux signaux seulement 53 %, la plus forte à la rupture 49 %, pour finir 46 %, appuis au
hasard 38 et 43 %, un coup d'avance 100 % (60 parties sur 60).

**Lecture.** Aujourd'hui, la mécanique récompense le bon choix (62 % au coup d'avance) mais pas celui que l'arène montre : suivre les signaux est puni (1 %).
Avec les mêmes règles, les tactiques lisibles valent l'automatique ou mieux, et les mauvais choix perdent ; mais des appuis au hasard battent l'automatique : il
lance ses offensives dès qu'il peut, dans la garde ×2 de l'adversaire. Deux critères pour la construction : l'automatique au moins aussi bon que les tactiques
simples et que des appuis au hasard ; aucune tactique lisible sous l'automatique. Le coup d'avance montre que l'automatique des rivaux, sans hasard, se laisse
battre par qui calcule tout : un joueur ne calcule pas ainsi, mais une tactique trop forte se verrait au laboratoire avant la fiche suivante.
### 25.5 La tactique et la main : la proposition (rien n’est construit)

**La tactique** (sur la fiche de match et dans la page des compétences, à côté de l'ordre des quatre, AC-09) : chacune des quatre compétences emportées
porte **une condition**, choisie dans une liste courte ; l'ordre des quatre reste la priorité. À chaque choix de Ren, la première compétence dont la
condition tient et qu'il peut lancer (ses PA, sa recharge) part ; sinon les attaques de base (le coup puissant quand l'adversaire ne peut pas se défendre,
sinon l'attaque simple). Les conditions proposées, chacune lisible sur la ligne de temps de l'arène :
- « Dès qu'elle est prête » (la règle des offensives de l'automatique d'aujourd'hui) ;
- « Quand l'adversaire est rompu » (et qu'elle part avant qu'il se relève) ;
- « Quand il charge un gros coup » (une protection : elle le couvre ; une offensive : elle frappe pendant qu'il est exposé) ;
- « Quand ma jauge passe les deux tiers » ;
- « Quand mes PV passent sous la moitié » ;
- « Quand ses PV passent sous le tiers » (pour finir) ;
- « Quand une offensive peut suivre » (un soutien) ;
- « Jamais » (la compétence gardée pour la main).
L'automatique est une tactique parmi les autres, celle qu'une partie neuve porte (ses protections et soutiens placés comme aujourd'hui, ses offensives
« dès qu'elle est prête »). La tactique est dans la partie, comme l'ordre (`kit.tactic`, une action `setTactic` comme `setOrder`) : elle entre dans
l'empreinte, puisqu'elle décide du duel.

**La main** : pendant le combat, une touche par compétence (1 à 4 au clavier, des actions du remappage RM3 ; la croix de la manette, MN2 ; un clic sur la
compétence au pied du HUD). La compétence appuyée part **au prochain choix de Ren** (dès que sa charge en cours est partie), si ses PA et sa recharge le
permettent ; sinon elle attend qu'ils le permettent, et la ligne du HUD le dit. Une seule attend à la fois (un autre appui la remplace). La tactique décide
du reste.

**Le duel refait** : le duel est déjà pur et déterministe (`autoDuel`, 0,16 ms) ; avec les tirages séparés, un appui ne change que ce qui suit l'instant où il
part (prouvé au laboratoire : le script avant l'appui est le même). L'arène garde le script tant que rien n'est appuyé ; à un appui, elle refait le duel avec la
liste des appuis (`o.commands` : l'instant et la compétence) et remplace la suite du script à partir de l'instant présent ; la relecture (`AutoReplay`) prend
la suite comme elle prend déjà tout le script d'avance (Passe LC4).

**La sauvegarde** : à l'ouverture de l'arène, le résultat que donne la tactique seule est écrit dans la sauvegarde comme résultat en attente ; quitter la page
pendant le combat applique ce résultat (un combat quitté ne se rejoue pas pour chercher un meilleur appui) ; le combat fini, son résultat remplace celui
d'attente, comme aujourd'hui. Les appuis ne sont pas gardés : le résultat l'est.

**×2 et « Passer »** : ×2 inchangé ; « Passer » joue la suite par la tactique, sans appui, sous le noir (Passe LC4).

**Les combats hors écran** : la même simulation, l'automatique des deux côtés (AC-18) ; chaque rival a sa tactique (son ordre et les conditions par défaut).

**Le tutoriel et le guide** : une bande de la fiche de match la première fois (la tactique, une condition par compétence) ; une leçon du premier combat (la
main : la touche, le prochain choix) ; « Le duel » et « Préparer un combat » du guide complétés ; les nombres lus dans les données, comme au lot 3.

**Le son et les effets** : rien de neuf (un appui donne le clic de l'interface ; la charge de la compétence a déjà sa note, Passe LC6).
### 25.6 La fiche d'arbitrages

https://claude.ai/artifact/J99g6BKC3Fku2x6ZMvdPXF (`briefs/fiche-combat-sym.html`), quatorze cartes, publiée le 12/11/2026, à remplir par l'opérateur. Les décisions
A3 marquées : SY-02 (le coup puissant, change CH1, CH-3, CH-4), SY-05 (+10 % par tour, change LC1-1 ; « Garder +15 % » la laisse), SY-13 (le § 6.1 du contrat
projet). Gardées : DB5 (la durée), DB5-3 (étendue aux rivaux et au coup puissant), DB5-4, DB7-1, AC-07, AC-11, AC-16 (son principe ; ses facteurs recalés
comme elle le prévoit).

| Carte | Sujet | Recommandation |
|---|---|---|
| SY-01 | Ramener les rivaux aux règles de Ren | les six changements (PA, l'arme, les mêmes tables, DB5-3, sans traits, le même automatique) |
| SY-02 | Le coup puissant (A3) | une attaque de base pour tous, automatique, avec sa recharge de DB5-3 |
| SY-03 | La cadence commune | ×0,6 pour tous |
| SY-04 | Le hasard | un tirage par coup |
| SY-05 | La course (A3 si +10 %) | +10 % par tour (change LC1-1) |
| SY-06 | L'équilibre (AC-12) | le refaire au premier lot, avec le test de AC-12 |
| SY-07 | Les façons de décider | les trois : l'automatique, la tactique, la main ; deux critères pour l'automatique |
| SY-08 | La forme de la tactique | une condition par compétence, l'ordre gardé |
| SY-09 | La main | au prochain choix de Ren, une compétence en attente |
| SY-10 | La sauvegarde, la relecture | le résultat de la tactique écrit à l'ouverture de l'arène |
| SY-11 | Les combats hors écran | l'automatique des deux côtés, la tactique de chaque rival |
| SY-12 | Le tutoriel et le guide | une bande de la fiche de match, une leçon au premier combat |
| SY-13 | Le § 6.1 (A3) | l'amender avec le texte de la carte, ajusté aux choix |
| SY-14 | La construction | en lots, l'essai de l'opérateur après le lot 2 |

### 25.7 Ce qui reste ouvert

- Le modèle recommandé (le coup puissant rechargé, cadence ×0,6, course à +10 %) n'a pas été mesuré tout ensemble : la course à +10 % l'a été à la cadence
  ×0,75 (la cadence ne change pas les dégâts par seconde ; à recaler à la construction de toute façon).
- L'automatique est sous les appuis au hasard dans ce modèle : à revoir à la construction, avec les deux critères de SY-07, puis la course recalée.
- L'équilibre des compétences et des armes (SY-06).
- Le coup d'avance gagne presque tout contre l'automatique des rivaux, qui n'a pas de hasard : une borne, pas un joueur ; à surveiller quand la tactique sera
  construite (une tactique lisible trop forte se mesure au laboratoire).

## 26. Les décisions de la fiche SY1 (12/11/2026, journal Passe SY2)

La fiche https://claude.ai/artifact/J99g6BKC3Fku2x6ZMvdPXF (`briefs/fiche-combat-sym.html`), relue le 12/11/2026 au soir (choix cliqués le 13/11 de 02 h 50 à
02 h 52 UTC) : **quatorze choix sur quatorze à la recommandation**, aucune note. Les choix mot pour mot et les décisions A3 citées et datées : journal Passe
SY2. Ce paragraphe dit ce qui s'applique ; là où le § 17 et les §§ 18 à 24 diffèrent, il l'emporte pour la construction à venir. Rien n'est encore construit :
jusqu'au lot 1 ci-dessous, le jeu garde le duel des lots 1 à 4 (le lot 1 construit : § 27).

| Carte | Le choix, mot pour mot | Ce qui s'applique |
|---|---|---|
| SY-01 | « Les six changements : les mêmes règles pour tous » | les rivaux paient leurs compétences en PA (2 PA), leur combo devient l'enchaînement de leur arme, les mêmes tables pour tous (la charge × 10 / Vivacité, la puissance par la charge, DB5-1), DB5-3 pour tous, plus de traits (AC-05 sans eux), le même automatique pour tous dans l'ordre de leur kit (§ 25.2) ; remplace, pour les rivaux, AC-02 (leurs combos), AC-05 (leurs traits), CB-1 (sans PA) et LC1-2 (la cadence ×0,5) |
| SY-02 | « Une attaque de base pour tous, avec sa recharge (décision A3 : change CH1, CH-3, CH-4) » | le coup puissant hors des quatre, sans PA, lancé par l'automatique quand l'adversaire ne peut pas se défendre ou que les PA sont pleins, avec sa recharge de DB5-3 (A3) |
| SY-03 | « ×0,6 pour tous » | toutes les charges et puissances × 0,6, pour Ren et les rivaux (les dégâts par seconde, les recharges avec les charges, la durée des effets gardée) |
| SY-04 | « Un tirage par coup » | un tirage par coup (le frappeur, le rang de son action, le rang du coup) |
| SY-05 | « +10 % par tour (décision A3 : change LC1-1) » | la poule à +10 % par tour ; le reste d'AC-16 gardé, ses facteurs recalés sur ces règles (A3) |
| SY-06 | « Le refaire au premier lot, avec le test de AC-12 » | l'équilibre des compétences et des armes au lot 1 |
| SY-07 | « Les trois : l’automatique, la tactique, la main » | l'automatique par défaut, la tactique, la main ; deux critères pour l'automatique (au moins aussi bon que les tactiques simples et que des appuis au hasard ; aucune tactique lisible sous lui) ; remplace AC-10 |
| SY-08 | « Une condition par compétence, l’ordre gardé » | les huit conditions du § 25.5, l'ordre des quatre gardé (AC-09) |
| SY-09 | « Au prochain choix de Ren, une compétence en attente » | § 25.5 ; rien ne coupe une charge (V2-2) |
| SY-10 | « Le résultat de la tactique écrit à l’ouverture » | § 25.5 |
| SY-11 | « Ainsi » | l'automatique des deux côtés hors écran, chaque rival sa tactique (AC-18) |
| SY-12 | « Ainsi » | une bande de la fiche de match, une leçon au premier combat, le guide complété (TU-11) |
| SY-13 | « L’amender avec ce texte, ajusté à mes choix (décision A3) » | le § 6.1 du contrat projet amendé le 12/11/2026 (A3) |
| SY-14 | « Approuvée avec mes choix ; en lots, mon essai après le lot 2 » | la construction ci-dessous |

### 26.1 Les décisions A3

- **Changées** : CH1, CH-3 et CH-4 (le coup puissant, une attaque de base pour tous, avec sa recharge : SY-02) ; LC1-1 (la poule à +10 % par tour : SY-05) ; le
  § 6.1 du contrat projet (SY-13).
- **Gardées** : DB5 (la durée), DB5-3 (étendue aux rivaux et au coup puissant), DB5-4 (la rupture), DB7-1 (les cinq stats et leurs formules), DB7-3 et DB11-5,
  DB7-4 et DB11-6, AC-07 (pas de riposte), AC-11 (l'équipement ×2), AC-16 (la course, son niveau commun en poule, sa Vivacité de poule ; ses facteurs recalés
  comme elle le prévoit, sa pente changée par SY-05).

### 26.2 Les lots (SY-14)

Chaque lot dans sa séance, dans le jeu par défaut (VD-8), fusionné après ses preuves :
1. **Les règles communes** dans la simulation (`src/combat/auto.ts`, `autoData.ts`) : les six changements de SY-01, le coup puissant de SY-02, la cadence ×0,6,
   le tirage par coup ; l'automatique revu pour les deux critères de SY-07 ; l'équilibre des compétences et des armes au test de AC-12 (SY-06) ; la course recalée
   à +10 % par tour sur parties entières (graines de calage, puis graines tenues à part), visée AC-15. La relecture de l'arène et le tutoriel suivent le script
   comme aujourd'hui ; leurs preuves relancées.
2. **La tactique** sur la fiche de match et dans la page des compétences (une condition par compétence, `setTactic`), **la main** dans l'arène (le duel refait
   depuis l'appui), **la sauvegarde** (le résultat de la tactique écrit à l'ouverture). **L'essai de l'opérateur suit ce lot.**
3. **Le tutoriel et le guide** (SY-12).
4. **Le retrait de l'ancien duel** et de ses outils (le lot 5 de la première refonte, § 17.3).

Le prototype du laboratoire (`tools/auto-sym/`) en donne les points de départ ; ses nombres se recalent à la construction.

## 27. Le lot 1 de la seconde refonte construit : les règles communes (13/11/2026, journal Passe SL1)

Dans le jeu par défaut (VD-8), branche `claude/combat-sym-lot1`. Ce qui s'applique depuis ce lot ; le § 26 reste la décision, ce paragraphe dit ce qui est
construit et mesuré. Les points sans décision sont sur la fiche du lot (§ 27.7).

### 27.1 Ce qui est construit

- `src/combat/auto.ts` : la même boucle pour tous (SY-01). `AutoFighter` n'a plus de combo, d'IA à poids ni de traits ; chaque combattant a son attaque simple,
  son **coup puissant de base** (`heavy`, SY-02 : hors des quatre, sans PA, avec sa recharge de DB5-3) et ses compétences. **Un tirage par coup** (SY-04,
  `autoDraw` : la graine du duel, le frappeur, le rang de son action, le rang du coup dans l'action, le but : l'esquive, la garde, l'initiative, le choix) :
  un coup garde ses tirages quoi qu'il arrive avant lui. **Un seul automatique** (`autoDecider`, `DECIDERS.player === DECIDERS.rival`) : ses compétences
  (`autoSkillChoice`), sinon son coup puissant (`heavyWhen` : l'adversaire rompu assez longtemps pour qu'il arrive, ou en charge d'une grosse action qui
  l'expose jusque-là, ou les PA pleins), sinon l'attaque simple, qui rapporte les PA.
- `src/combat/autoData.ts` : **la cadence ×0,6 pour tous** (`AUTO_CADENCE.all`, SY-03 : les charges, les puissances et les jauges ; les recharges suivent les
  charges ; la durée des effets gardée) ; `autoHeavy` (le coup puissant du catalogue, au niveau de l'exercice du sable pour Ren, 1 pour les rivaux) ; les
  rivaux : leur combo devenu leur arme (`AUTO_FOES.weapon`, ses coups au total de l'épée d'entraînement), la Vivacité 10 de leurs tables, leurs compétences à
  2 PA avec DB5-3, la puissance par la charge comme celles de Ren, leur ordre (protections, soutiens, offensives de la plus forte) ; plus de traits.
- `src/combat/autoMatch.ts` : la garde et l'esquive tirées des seules stats (AC-05 sans traits).
- La relecture de l'arène (`src/arena/autoView.ts`), le HUD (`AutoHud.ts`) et les textes suivent le script comme avant : le coup puissant hors des quatre
  cases, plus de ligne « combo » du rival ; l'élan d'un coup tient dans le temps libre devant lui (`free`), jamais dans l'étourdissement de son frappeur. Les
  phrases du guide et du tutoriel disent que les rivaux suivent les mêmes règles, le soutien dès qu'il est prêt et le coup puissant quand l'adversaire ne
  peut pas se défendre ou que les PA sont pleins (anglais et français).
- Le laboratoire : `tools/auto-lab.mjs` (`modes`, `--auto=` un autre automatique pour tous, `kits --norm=rival`, `level`), `tools/auto-tactics.mjs` (les
  tactiques d'une condition par compétence et les appuis au hasard, sur l'automatique du jeu), `tools/auto-balance.mjs` (la recherche de l'équilibre au test de
  AC-12) ; `tools/auto-sym/` reste le laboratoire de l'atelier, juste contre le jeu d'avant ce lot (`d8b7a9f`).

### 27.2 L'identité avec le modèle de l'atelier

Avant l'automatique revu, le duel du jeu rend le modèle « mêmes règles » mesuré en Passe SY1 (cadence ×0,6, coup puissant rechargé, `tools/auto-sym/sim.mjs`) :
**168 combattants sur 168 et 168 duels sur 168 identiques, événement par événement** ; `tests/combat-auto.test.mjs` garde ce portage (le modèle de l'atelier
tourne à côté, sur les mêmes tables).

### 27.3 L'automatique (SY-07)

Sur la course d'avant le recalage, 200 parties de la référence (graines 101 à 300), la décision de Ren seule remplacée : l'automatique de l'atelier (le
soutien gardé jusqu'à ce qu'une offensive puisse suivre) 36 % de titres ; les soutiens dès qu'ils sont prêts 90 % ; des appuis au hasard 64 à 65 % (69 % sur
les seuls soutiens) ; aux signaux 54 à 79 %. Quatre automatiques candidats joués par tous : seul « les soutiens dès qu'ils sont prêts » n'avait aucune façon
de décider au-dessus de lui. **Retenu : un soutien dès qu'il est prêt** (un à la fois), les protections et les offensives comme avant.

Après l'équilibre et la course recalée (les mêmes 200 parties, l'automatique de tous celui du jeu) :

| Façon de décider (Ren) | Titres | j2 / j4 / j5 | Demi | 3e | Finale |
|---|---|---|---|---|---|
| l'automatique | 22 % | 97 / 80 / 59 | 62 % | 86 % | 41 % |
| tactique : la plus forte gardée pour la rupture | 29 % | 100 / 82 / 67 | 71 % | 84 % | 46 % |
| tactique : la plus forte gardée pour finir | 28 % | 98 / 80 / 64 | 70 % | 88 % | 47 % |
| tactique : aux signaux, la moins chère à PA pleins | 11 % | 100 / 90 / 72 | 50 % | 80 % | 22 % |
| tactique : aux signaux, la première à PA pleins | 0 % | 72 / 25 / 8 | 17 % | 40 % | 0 % |
| tactique : aux signaux seulement | 0 % | 73 / 67 / 26 | 21 % | 52 % | — |
| tactique : les protections dès qu'elles sont prêtes | 2 % | 99 / 78 / 27 | 45 % | 54 % | 4 % |
| tactique : les soutiens jamais | 0 % | 71 / 20 / 2 | 0 % | 13 % | — |
| appuis au hasard, un choix sur quatre / sur deux | 7 / 5 % | 99 / 73-77 / 37-38 | 40-49 % | 65 % | 15-17 % |
| appuis au hasard, soutiens seuls / offensives seules | 12 / 6 % | 97-98 / 56-82 / 35-49 | 33-57 % | 48-77 % | 24-27 % |

**Lecture.** Le premier critère tient contre les appuis au hasard et les mauvais choix (protections dès que prêtes, soutiens jamais) ; deux tactiques simples
le dépassent de six à sept points (garder la plus forte pour la rupture ou pour finir). Le second ne tient pas : les tactiques aux signaux sont sous lui. La
cause, mesurée sur 60 duels isolés du jour 4 (le kit t1, t4, d1, s1) : les signaux sont rares, la compétence bon marché (t1) gardée perd ses passages, et
« à PA pleins » lance alors la plus chère et la plus faible (t4 : 183 fois contre 24 pour l'automatique, t1 166 contre 406) ; « la plus forte à la rupture »
gagne surtout en ne lançant presque jamais t4 (3 fois).

« La plus forte gardée pour la rupture » mesurée comme automatique de tous (les rivaux aussi ; la course pas recalée pour lui) : la référence 41 % de titres, et aucune
façon de décider mesurée au-dessus (pour finir 39 %, les soutiens dès que prêts 36 %, aux signaux 0, 3 et 36 %, les protections dès que prêtes 19 %, des appuis
au hasard 15 à 34 %) : le premier critère tiendrait, pas le second. La suite : la fiche du lot (§ 27.7).

### 27.4 L'équilibre des compétences et des armes (SY-06, AC-12)

Recherche par coordonnées sur les seules données des compétences et des armes (`tools/auto-balance.mjs`, graines de calage 1 à 40), chaque rival à son
niveau (le kit de départ à 85 / 65 / 50 % contre lui), le test de AC-12 (chaque rival au moins deux bonnes réponses à 10 points de la meilleure ; aucun kit à 3
points du meilleur contre tous ; chaque arme la meilleure contre trois rivaux au moins). Retenu : l'épée d'entraînement deux coups de 0,85 (0,55 avant), la
lame importée deux de 0,70 (0,62), le sabre du duelliste trois de 0,17 (0,23) ; Tourbillon (t3) ×1,8 de puissance, Estoc (t4) ×0,8 ; Fracas (k_sunder) ×2 à la
jauge ; Cri de guerre (k_cry) ×1,9 aux dégâts (2,3). Sur des graines tenues à part (60) :

| Étape (la référence du jour) | Bonnes réponses | Domine partout | Test |
|---|---|---|---|
| poule (jour 4) | deux ou trois pour chaque rival | aucun | **tenu** |
| tableau (jour 6) | Cassius et Marek une seule (défensif) ; les autres deux ou trois | aucun | non tenu |
| finale (jour 10) | Vessa une seule (feinte) ; les autres deux (départ, défensif) | aucun | non tenu |

En finale, les kits autres que le départ et le défensif tombent sous 30 % contre six rivaux sur sept (tous sauf Vessa). Les armes, en poule : la lame
importée la meilleure (à 3 points) contre six rivaux, le sabre contre trois (Tobin, Cassius, Orla), l'épée contre un (Orla) ; le test de AC-12 juge les kits.

### 27.5 La course (SY-05, A3)

AC-16 recalée sur ces règles : le facteur de poule de chaque rival pour que la référence du jour 2 le batte 95 % du temps sur duels isolés, **la poule à +10 %
par tour** (A3), les facteurs du tableau et de la finale sur parties entières (graines de calage 1 à 80) pour la demi-finale et la finale visées. Les facteurs :
Vessa 1,487, Tobin 1,815, Cassius 1,54, Orla 1,004, Ilse 1,425, Marek 1,206, Rhosk 1,647 ; la poule 1 / 1,1 / 1,2 ; le tableau ×1,249, la finale ×1,561
(`AUTO_RACE`). Sur 200 parties tenues à part (graines 101 à 300) :

| Joueur | Titres | j2 / j4 / j5 | Demi | 3e | Finale | Durées poule / tableau / finale |
|---|---|---|---|---|---|---|
| la référence (AC-14) | 22 % | 97 / 80 / 59 | 62 % | 86 % | 41 % (104) | 177 / 287 / 334 s |
| le planificateur | 20 % | 97 / 80 / 58 | 45 % | 84 % | 51 % (77) | 177 / 278 / 326 s |
| visée AC-15 | — | 95 / 85 / 75 | 65 % | — | 50 % | DB5 : 2 à 5 min |

À +10 % par tour, le dernier tour de poule manque sa visée de seize points (59 contre 75) : la pente rend la poule plus dure que AC-15 ne le veut. Deux pentes
mesurées à côté, les facteurs du tableau et de la finale recalés pour chacune, les mêmes graines tenues à part :

| Pente de poule | Titres (réf.) | j2 / j4 / j5 | Demi | 3e | Finale | Le planificateur | Le curieux |
|---|---|---|---|---|---|---|---|
| +10 % (A3, dans le jeu) | 22 % | 97 / 80 / 59 | 62 % | 86 % | 41 % | 20 % | 8 % |
| +7,5 % (tableau ×1,232, finale ×1,576) | 29 % | 97 / 85 / 80 | 68 % | 88 % | 45 % | 28 % | 11 % |
| +5 % (tableau et finale recalés) | 29 % | 97 / 91 / 95 | 66 % | 79 % | 45 % | 18 % | 8 % |

### 27.6 Le rythme

La référence du jour 4 contre les sept rivaux (140 duels) : durée médiane 236 s (Orla 170 s, Rhosk 330 s), 118 coups par minute, 0,32 s entre deux coups
(p90 1,13), le plus long silence médian 4,7 s (au plus 5,3), 11,3 % du temps en silences de plus de 3 s (10,5 % au lot 2), 3,7 s entre deux grosses actions ;
sans aucun événement au plus 4,4 s. Le jour 10 : 314 s médianes (Rhosk 435 s), 122 coups par minute, 10,0 % en silences de plus de 3 s.

### 27.7 Les preuves et la fiche du lot

`npm run typecheck`, `npm test` (653 sur 653), `npm run build`, `npm run art:validate`. Dans le navigateur, sur les données finales : `tools/auto-arena-proof.mjs`
pour les sept rivaux (chaque pas en images cuites ; l'animation de l'étourdissement ne commence plus sous 0, ce qui laissait une image −1 chez Tobin et Ilse),
`tools/gauge-proof.mjs`, `tools/tutorial-proof.mjs`, `tools/audio/hooks-proof.mjs`, `tools/play-flow.mjs` (une partie qui attend gagne le jour 2 avec la
graine 1842 et perd avec la graine 1, l'inverse avant), `tools/challenge-flow.mjs` (défi et représailles), `tools/rivals-flow.mjs sand` (la graine 6 de nouveau
pour le sable de Rhosk). Les blessures d'une partie mesurées à nouveau (`tests/v2-injury.test.mjs` : 0,56 pour le joueur préparé et pour l'oisif, 0,32 pour la
référence).

La fiche du lot : https://claude.ai/artifact/5HR1Eqhsr3ZKoN81hfWwLb (`briefs/fiche-combat-sym-lot1.html`), huit cartes : SL1-1 la pente de la poule (A3 : +7,5 %
recommandé), SL1-2 la durée de la finale, SL1-3 l'automatique et les deux tactiques qui le dépassent (la plus forte gardée pour la rupture recommandée, au
lot 2), SL1-4 les tactiques aux signaux (au lot 2), SL1-5 l'équilibre au tableau et en finale (au lot 2), SL1-6 la charge du coup puissant de Ren au premier
palier du son, SL1-7 une sauvegarde qui emportait le coup puissant, SL1-8 la réception et la suite. Jusqu'à sa relecture, le jeu garde ce que ce lot construit.

---

## 28. La fiche du lot 1 relue (13/11/2026, journal Passe SL2)

La fiche https://claude.ai/artifact/5HR1Eqhsr3ZKoN81hfWwLb (`briefs/fiche-combat-sym-lot1.html`), relue le 13/11/2026 (choix cliqués de 04 h 21 à 05 h 08 UTC) :
**sept choix sur huit à la recommandation** ; SL1-2 à l'autre option, avec la note de l'opérateur. Les choix mot pour mot, la note et les décisions A3 citées et
datées : journal Passe SL2. Ce paragraphe dit ce qui s'applique au lot 2 ; là où les §§ 26 et 27 diffèrent, il l'emporte.

| Carte | Le choix, mot pour mot | Ce qui s'applique |
|---|---|---|
| SL1-1 | « +7,5 % par tour (décision A3 : change SY-05) » | la poule à +7,5 % par tour (A3) ; le tableau et la finale recalés sur cette pente |
| SL1-2 | « La raccourcir (les rivaux de finale, la course recalée) », et la note | les durées médianes de la référence : la poule environ 2 min, le tableau 2 à 4 min, la finale 3 à 4 min au plus (A3, elles précisent DB5) ; un rythme bien moins vif que 118 coups par minute, « une scene de theatre » |
| SL1-3 | « L’automatique garde la plus forte pour la rupture (au lot 2, la course recalée) » | l'automatique de tous garde sa plus forte offensive pour la rupture |
| SL1-4 | « Le reprendre au lot 2, avant mon essai » | les tactiques aux signaux mesurées telles que la page les offre ; le second critère de SY-07 tenu avant l'essai |
| SL1-5 | « Le reprendre au lot 2, avec la tactique » | le test de AC-12 au tableau et en finale repris avec la tactique |
| SL1-6 | « Sa charge au premier palier (au lot 2) » | la charge du coup puissant de Ren entendue au premier palier, comme une compétence |
| SL1-7 | « La suivante possédée prend la place (au lot 2) » | une sauvegarde qui emportait le coup puissant : la compétence possédée suivante prend sa place, dans l'ordre de la page |
| SL1-8 | « Reçu ; le lot 2 ensuite » | le lot 1 reçu ; le lot 2, puis l'essai de l'opérateur (SY-14) |

### 28.1 Le lot 2, dans l'ordre

1. **La durée et le rythme d'abord** (SL1-2, A3). La note de l'opérateur, mot pour mot : « selon ce que tu evoques il faut que tu baises la duree : Les durées
   médianes de la référence : la poule environ 2min, le tableau 2-4min , la finale 3-4min max. et Le rythme vif : 118 coups par minute, est trop intense c'est a
   peine si nous pouvons apprecier le combat et faire une action,... apres tout on doit rester attentif a ce qui se passe et voir cela comme une scene de
   theatre ». Plus court et plus lent à la fois, c'est beaucoup moins de coups par duel : chaque coup pèse plus (la santé ou la puissance), et ce qui se compte
   en secondes suit la cadence (la jauge et sa décroissance, les PA, les recharges). DB5-3 (5 × la charge) et DB5-4 (« 10 s, ×2, jauge de 70 ») sont des A3,
   gardées sauf décision de l'opérateur. La note ne chiffre pas le rythme : ses candidats mesurés (coups par minute, temps entre deux coups, silences) lui
   sont soumis avant de recaler la course.
2. **L'automatique** de SL1-3 pour tous.
3. **La course recalée une fois**, sur ces règles : la poule à +7,5 % par tour (SL1-1, A3), le tableau et la finale visés par AC-15, graines de calage puis
   graines tenues à part.
4. **La tactique** (SY-08 à SY-10) et ses signaux (SL1-4), **l'équilibre** repris avec elle (SL1-5).
5. **La main** dans l'arène, **la sauvegarde** (SL1-7), **la charge du coup puissant entendue** (SL1-6).
6. **L'essai de l'opérateur** (SL1-8, SY-14).


## 29. Le lot 2 en cours (13/11/2026, journal Passe SL3)

Branche `claude/combat-sym-lot2-017fdf`, non fusionnée. **Le rythme** : mesuré et soumis à l'opérateur, https://claude.ai/artifact/LxbnwW9Q3vq7f8BqcETVk2 (`briefs/fiche-combat-sym-lot2-rythme.html`) : un candidat ralentit tout le temps du duel d'un facteur s (les charges et leurs recharges, les écarts d'un enchaînement, les protections et les soutiens) et alourdit chaque coup (puissance et jauge) pour tenir les durées de l'opérateur, la décroissance de la jauge ×k/s ; la rupture garde ses 10 s (DB5-4, A3). Les candidats : ×1,5 (81 coups par minute), ×2 (61, recommandé), ×2,5 (49), ×3 (40) contre 120 aujourd'hui ; leurs nombres : journal Passe SL3. `AUTO_CADENCE` = { charge, power, gap, effect }.

**Construit** (sans fusion) : l'automatique de SL1-3 comme la tactique de quatre lignes « comme l'automatique » (`tacticChoice`) ; la tactique (§ 25.5 : les conditions de chaque famille, `AUTO_CONDS_OF` ; `kit.tactic`, `setTactic` ; C sur la page des compétences et la fiche de match) ; la main (`autoDuel(..., { commands })`, `AutoReplay.replace`, `ArenaApp.press` ; les touches 1 à 4, la croix de la manette, le clic) ; SY-10 (`V2State.$pending`, `settlePending`) ; SL1-6 (le coup puissant au premier palier) ; SL1-7 (`heavyOutOfFour`, `setLoadout` refuse le coup puissant) ; les textes du guide et de la première leçon.

**SL1-4** : les tactiques aux signaux, telles que la page les offre, restent loin sous l'automatique (0 à 15 % contre 41 % de titres au rythme d'aujourd'hui) ; une règle à PA pleins ne sauve pas un soutien retenu (0 à 2 %). La question va à la fiche d'essai, après le rythme.

**Reste** : le rythme appliqué, la course recalée une fois (+7,5 %, AC-15), deux nombres épinglés remesurés, SL1-4 et AC-12 refaits avec la tactique (SL1-5), les preuves du navigateur, la fiche d'essai.


## 30. La fiche du rythme relue, la première partie du lot 2 fusionnée (13/11/2026, journal Passe SL4)

La fiche https://claude.ai/artifact/LxbnwW9Q3vq7f8BqcETVk2 relue : RY-1 « ×3 plus lent : environ 40 coups par minute » (pas la recommandation), RY-2 « Étirés avec le reste », RY-3 « Garder 10 s (DB5-4) » avec sa note (décision A3, mot pour mot au journal : la rupture après le même nombre de coups par défaut pour chacun, environ 20 à 25, les dégâts ×1,4 pendant 10 s, des valeurs par défaut que les stats et les compétences modulent), RY-4 « Fusionner la première partie dès ses preuves ». Ce qui s'applique :

- **Le rythme** : `AUTO_CADENCE` = { charge 1,8, power 3,2, gap 3, effect 3 } ; les recharges suivent les charges (DB5-3) ; le premier tirage 1,8 s.
- **La rupture** : `AUTO_RULES.gauge` = { max 70, blows 22,5, decay 0,16, guardMul 2 }, `brk` = { stun 10, dmg 1,4 } ; un coup d'attaque simple un coup de la jauge, une compétence ou un coup puissant deux (un casseur × son gaugeK), partagés sur ses coups, × 10 / Endurance, la garde ×2, la protection et le renfort (`autoGaugeHit`).
- **La course** : recalée une fois, la poule à +7,5 % (SL1-1), le tableau ×1,335 et la finale ×1,749 sur 200 parties de calage, tenue à part sur les graines 101 à 300.

Mesuré sur les 200 parties tenues à part : 39 coups par minute ; la rupture en 25 coups pour Ren et 20 pour les rivaux (médianes) ; 1 min 51, 3 min 08, 3 min 50 ; la référence 92 / 93 / 100 en poule, 66 % en demi-finale, 48 % en finale, 31 % de titres. La poule trop facile à ses deux derniers tours tient à la pente A3 de SL1-1 : à soumettre à l'opérateur.

Ensuite, à sa demande, l'atelier du système de combat final, dans une séance neuve : `briefs/atelier-combat-final-brief.md`. Les lots 3 et 4 du § 26.2 attendent sa fiche.

## 31. L'atelier du système de combat final (13/11/2026, journal Passe CF1)

**La demande** : `briefs/atelier-combat-final-brief.md` (ses mots du 13/11 cités). Les mots de l'opérateur du 13/11 qui le complètent, mot pour mot : sur les PA, « Oui voila si les recharges gerent deja l'usage de competences a les PA ne sont plus necessaire. dans tout dependamment de niveau/puissance/type de la competences, la recharge sera rapide,moyen,longue puis le gambit tactique permet aussi de determiner a quel moment on veut rendre actif une competence » ; sur le reste du brief (la garde et l'esquive par les stats, la garde à −80 % à revoir, une cote lisible des deux fiches pour des paris plus tard, cette fiche à la place de la fiche d'essai du lot 2) : « sinon les autres points sont valides ».

**Statut** : un atelier ; rien du jeu n'est changé ; une fiche d'arbitrages publiée (§ 31.6), en attente de l'opérateur.

### 31.1 Le laboratoire

`tools/auto-final/` : une copie du duel du jeu (`sim.mjs`, `src/combat/auto.ts` à `9e2bc1f`) dont chaque mécanique est un interrupteur, branchée sur les parties entières par deux transformations du chargeur de Vite (`lab.mjs` : `autoDuel` passe par la copie ; `autoBoutOf` laisse la fiche de match choisir le kit et la tactique d'un joueur du laboratoire, et pose sur les combattants l'équipement de Ren et le kit du rival). **Prouvée identique au jeu** (`identity.mjs`) : 2 240 duels sur 2 240 événement par événement, trace comprise, et 120 parties entières sur 120 (cinq politiques, état final et empreinte). Les outils : `diag.mjs` (le diagnostic), `bank.mjs` (les combats d'une politique gardés pour être rejoués en millisecondes), `level.mjs` (un jeu de règles à niveau égal : ses rivaux ramenés étape par étape là où l'automatique de la référence gagne 85 / 65 / 50 %, puis l'automatique, la meilleure tactique unique, la meilleure tactique par rival et des appuis au hasard sur des combats tenus à part), `search.mjs` et `kits.mjs` (chaque kit d'un répertoire de sept compétences avec sa meilleure tactique contre chaque rival, chaque rival à son niveau, le test de AC-12), `gearfx.mjs` (chaque pièce portée à la place de celle de Ren), `final.mjs` et `measure.mjs` (la course recalée comme AC-16 le prévoit, puis toutes les politiques sur 200 parties tenues à part, les joueurs adaptés compris), `modes.mjs` (les tactiques de la page sur parties entières), `adapt-bank.mjs` (une tactique par rival apprise à la course du jeu de règles), `pool.mjs` (la pente de la poule), `odds.mjs` et `odds-run.mjs` (la cote).

### 31.2 Le diagnostic (le jeu d'aujourd'hui ; 200 parties tenues à part, graines 101 à 300)

| Mesure | Résultat |
|---|---|
| Les politiques | la référence 31 % de titres (92 / 93 / 100 en poule, demi 66 %, finale 48 %), le planificateur 18 %, le curieux 21 %, le diligent et l'oisif 0 % |
| Les dégâts de Ren (poule / tableau / finale) | attaque simple 37 / 37 / 35 %, coup puissant 21 / 22 / 23 %, compétences 43 / 41 / 42 % ; pendant une rupture 27 / 14 / 8 % ; les coups gardés 3 à 4 % |
| Les dégâts du rival | attaque simple 45 / 54 / 56 %, coup puissant 40 / 35 / 27 %, compétences 15 / 11 / 18 % |
| Les couches (les combats de la référence rejoués, une couche retirée) | tel quel 95 / 73 / 48 % ; sans les points de l'équipement 83 / 21 / 0 % ; sans la vigueur 94 / 48 / 13 % ; compétences au niveau 1 94 / 67 / 18 % ; sans l'entraînement 92 / 72 / 39 % ; Ren de départ 73 / 6 / 0 % |
| Les PA | l'automatique ne reste jamais aux PA pleins (il dépense à 5) ; l'Estoc (4 PA) prête à 2 à 5 % des choix de Ren ; retirés sans recalage, la finale de la référence passe de 48 à 84 % |
| Les tactiques de la page au rythme ×3 (SL1-4 de nouveau) | l'automatique 31 % ; offensives à la rupture **41 %** (0 % en Passe SL3) ; la plus forte pour finir 33 % ; quand il charge 32 % ; dès que prêtes 26 % ; protections retenues 5 à 7 % ; soutiens retenus 0 à 6 % ; appuis au hasard 21 à 24 % |
| Une tactique par rival (ses quatre compétences, apprise sur les graines de calage) | **52 % de titres** (100 / 97 / 100, demi 93 %, finale 56 %) contre 31 % ; avec Fente apprise, Tourbillon et Fracas achetés et le kit choisi par rival : 41 % |
| L'équipement | le sabre et les bottes (+2 de Vivacité, AC-11) la meilleure pièce de leur emplacement contre six ou sept rivaux sur sept |
| La cote | une formule des fiches suit les combats entre rivaux (Brier 0,193, le favori gagne 71 %) mais pas ceux de Ren (0,545) ; 60 combats d'essai, les formes du jour connues : 0,106 et 0,099, le favori gagne 84 et 86 % |

**Lecture** : les statistiques pèsent lourd, la tactique par rival aussi, mais pour une raison cachée : les PA sont un budget commun que l'automatique dépense mal, et c'est l'allocation de ce budget qu'une tactique améliore. Les réponses qu'elle trouve sont opaques (« Rempart dès qu'il est prêt » contre Vessa).

### 31.3 Les mécaniques mesurées, à niveau égal (`level.mjs`, 999 combats tenus à part)

| Jeu de règles (poule / tableau / finale) | Automatique | Une tactique pour tous | Une tactique par rival | Appuis au hasard |
|---|---|---|---|---|
| le jeu (avec les PA) | 85 / 66 / 48 | 97 / 79 / 46 | 97 / 88 / 57 | 81 / 68 / 40 |
| sans PA, DB5-3 (G1, les styles des rivaux) | 85 / 62 / 43 | 85 / 62 / 43 | 94 / 77 / 47 | 67 / 41 / 31 |
| G1, la recharge à son niveau (G2) | 87 / 62 / 45 | 94 / 61 / 33 | 95 / 72 / 46 | 70 / 43 / 36 |
| G1, trois classes 15 / 30 / 50 s (G3) | 82 / 65 / 50 | 91 / 68 / 51 | 91 / 72 / 86 | 61 / 43 / 44 |
| G1, les terrains (G4) | 85 / 62 / 44 | 85 / 62 / 44 | 90 / 67 / 55 | 74 / 41 / 42 |
| G4, la parade 4 coups (G5) | 87 / 61 / 45 | 87 / 61 / 45 | 91 / 67 / 50 | 63 / 48 / 33 |
| G5, la garde par les stats (G6) | 87 / 67 / 43 | 85 / 68 / 40 | 90 / 73 / 51 | 67 / 52 / 37 |
| G1, la garde par les stats (G8) | 86 / 59 / 48 | 86 / 59 / 48 | 92 / 68 / 52 | 72 / 46 / 39 |
| le prototype PF | 84 / 69 / 49 | 91 / 64 / 43 | 92 / 77 / 46 | 72 / 56 / 35 |
| PF, Ferveur sur la prochaine action ×2,2 (P2, avant les réglages de PF) | 87 / 64 / 43 | 90 / 72 / 46 | 93 / 78 / 59 | 82 / 58 / 36 |

Les PA gardés avec un surplus non perdu (plafond 8) ne changent rien ; un PA par garde ou esquive réussie affaiblit Ren de 16 à 21 points avant recalage. Les trois classes nommées vident la finale de ses ruptures (0,4 par combat, 27 coups par minute).

### 31.4 Les prototypes et leurs mesures sur parties entières

**PF, sans PA** (`variants.mjs`) : sans PA, les recharges de DB5-3 ; le coup puissant quand l'adversaire ne peut se défendre ; l'automatique de SL1-3, sa plus forte offensive partant aussi sur son terrain ; chaque rival son style (`STYLE_TACTIC`) ; les terrains (la Taille éclair et l'élan de Vessa punissent une charge ×1,5 ; la Fente, la Feinte et la riposte de Cassius percent la garde et la moitié d'une protection ; l'Estoc, le châtiment d'Ilse et la chute de Marek achèvent ×1,5 un adversaire rompu ou sous le tiers) ; la parade (2 coups à la jauge du frappeur) ; la garde de −30 à −70 % selon la Défense contre l'Attaque ; les effets d'équipement (`GEAR_FX`) ; la Vivacité des pièces à moitié ; Tourbillon ×0,8 (sans PA il dominait les kits). Sa course recalée sur 200 parties de calage (graines 1 à 100 et 301 à 400) : Vessa 1,286, Tobin 1,815, Cassius 1,326, Orla 1,132, Ilse 1,257, Marek 1,333, Rhosk 1,552 ; la poule à +7,5 % ; le tableau ×1,506, la finale ×1,732.

| PF (sans PA), 200 parties tenues à part | Titres | j2 / j4 / j5 | Demi | Finale | Durées poule / tableau / finale |
|---|---|---|---|---|---|
| la référence | 36 % | 92 / 99 / 98 | 71 % | 52 % | 91 / 144 / 220 s |
| la référence, une tactique par rival (apprise à cette course) | 36 % | 92 / 99 / 98 | 70 % | 53 % | 91 / 146 / 225 s |
| le curieux | 30 % | 98 / 97 / 91 | 57 % | 53 % | 102 / 193 / 363 s |
| le planificateur | 24 % | 92 / 99 / 98 | 54 % | 45 % | 91 / 137 / 224 s |
| le diligent | 0 % | 95 / 83 / 78 | 13 % | 0 % | 98 / 154 / 190 s |
| l'oisif | 0 % | 84 / 52 / 44 | 1 % | 0 % | 100 / 122 / 220 s |

Le rythme de la référence : 36,5 coups par minute ; la rupture en 38 coups pour Ren (son Endurance), 16 pour les rivaux (RY-3 : 20 à 25 par défaut, modulés par les stats et les compétences) ; 1,44 rupture par combat. Avec l'automatique de SL1-3 tel quel (PG, sa course recalée) : la référence 31 %, 40,2 coups par minute, la finale à 4 min 22 s (au-delà des 3 à 4 min de SL1-2).

**Les tactiques de la page dans PF** (`modes.mjs`) : l'automatique 36 % ; « protections dès que prêtes », « soutiens quand une offensive peut suivre », « la plus forte pour finir » 36 à 37 % (ses propres règles) ; offensives quand il charge 19 %, à la rupture 13 %, dès que prêtes 13 %, quand il se protège 3 % ; protections retenues 2 % ; soutiens à la rupture 5 %, jamais 4 % ; appuis au hasard 20 à 24 %. Une tactique par rival apprise à la course de PF ne gagne rien (36 %) ; dans PG, +4 points (35 contre 31 %).

**La tension centrale.** Avec les PA, chaque compétence se paie sur un budget commun : la tactique répartit ce budget, et attendre ne coûte rien tant que les PA ne plafonnent pas. Sans PA, chaque compétence a sa propre horloge : la retenir perd du temps de recharge, et « dès qu'elle est prête » (ou sur son terrain, ce que l'automatique de PF fait déjà) devient presque toujours le meilleur choix. Ni des terrains ×2, ni deux utilisations gardées par compétence ne rendent l'attente payante (`modes.mjs` sur PF-T2, PG-T2, PF-C2, PG-C2, PG-C2T2 : les tactiques d'attente 2 à 34 % contre l'automatique 39 à 74 %). Un souffle commun (après une compétence, aucune autre pendant 10 s) semblait la rendre à la course de PF (PG-S10 : l'automatique 50 %, une tactique par rival 57 %) ; **recalé sur sa propre course** (Vessa 1,137, Tobin 1,862, Cassius 1,337, Orla 1,13, Ilse 1,411, Marek 1,443, Rhosk 1,796 ; tableau ×1,301, finale ×1,746), le gain disparaît : la référence 27 % (95 / 100 / 92, demi 66 %, finale 41 %, 1 min 36 / 3 min 21 / 4 min 10, 41 coups par minute), une tactique par rival 26 %, offensives à la rupture 10 %, appuis au hasard 11 à 12 % ; à 20 s, tout s'effondre.

**PK, les PA gardés** (le prototype recommandé) : l'automatique de SL1-3, les styles, les terrains, la parade à 2 coups, la garde par les stats, les effets d'équipement, la Vivacité des pièces à moitié. Sa course recalée sur 200 parties de calage : Vessa 1,288, Tobin 1,569, Cassius 1,228, Orla 0,884, Ilse 1,247, Marek 1,106, Rhosk 1,214 ; la poule +7,5 % ; le tableau ×1,437, la finale ×1,791.

| PK (les PA gardés), 200 parties tenues à part | Titres | j2 / j4 / j5 | Demi | Finale | Durées poule / tableau / finale |
|---|---|---|---|---|---|
| la référence adaptée (une tactique par rival, apprise sur les parties de calage) | 49 % | 96 / 100 / 99 | 85 % | 58 % | 87 / 175 / 152 s |
| le curieux | 51 % | 98 / 99 / 96 | 83 % | 63 % | 91 / 182 / 256 s |
| la référence | 34 % | 96 / 96 / 99 | 72 % | 48 % | 89 / 136 / 165 s |
| le planificateur | 25 % | 96 / 96 / 99 | 55 % | 46 % | 89 / 134 / 163 s |
| le diligent | 0 % | 100 / 99 / 87 | 23 % | 0 % | 84 / 136 / 131 s |
| l'oisif | 0 % | 89 / 94 / 64 | 4 % | 0 % | 88 / 106 / 120 s |

Le rythme de la référence : 39,9 coups par minute ; la rupture en 23 coups pour Ren, 16 pour les rivaux ; 2,39 ruptures par combat. Les durées de la poule et de la finale un peu courtes (SL1-2 : environ 2 min, 3 à 4 min) : à régler au premier lot par les PV, sans toucher aux chances. Les tactiques de la page : l'automatique 34 % ; offensives quand il charge 32 %, à la rupture 25 % ; protections retenues 12 à 13 %, dès que prêtes 24 % ; soutiens retenus 4 à 8 % ; appuis au hasard 32 % (un choix sur quatre) et 22 % (un sur deux). La cote par 60 combats d'essai : Brier 0,072 hors écran (le favori gagne 90 %), 0,086 pour Ren (88 %).

**Lecture.** Le budget commun des PA est ce qui donne du poids au moment de lancer : avec lui, une tactique adaptée au rival dépasse nettement l'automatique (52 contre 31 % dans le jeu, 49 contre 34 % dans PK) ; sans lui, l'automatique décide bien et la tactique ne rapporte plus (36 contre 36 % dans PF, 26 contre 27 % avec un souffle). C'est contraire à la direction de l'opérateur sur les PA : la fiche le dit et le lui soumet (CF-02).

**L'équipement dans PF** (`gearfx.mjs`, la référence de l'étape portant chaque pièce à la place de la sienne) : au tableau, aucune arme, armure ni accessoire ne domine ; en finale, la lame importée domine les armes, rien d'autre. À pleine Vivacité (AC-11), le sabre et les bottes dominent.

**La poule** (`pool.mjs`, la course de PF gardée) : +7,5 % → la référence 92 / 99 / 98 ; +10 % → 92 / 98 / 99 ; +12,5 % → 92 / 97 / 95 ; +15 % → 92 / 97 / 88 ; +20 % → 92 / 91 / 59 ; +25 % → 92 / 89 / 36 (AC-15 : 95 / 85 / 75). La pente bouge le dernier tour par marches ; le j4 reste au-dessus de sa visée.

**La cote dans PF** (`odds-run.mjs`) : 60 combats d'essai, les formes du jour connues : Brier 0,085 hors écran (le favori gagne 87 %) et 0,091 pour les combats de Ren (88 %), les dixièmes de la cote suivis ; la formule des fiches : 0,239 et 0,463.

### 31.5 Ce que l'atelier n'a pas fait

- L'équilibre du catalogue sans PA (AC-12) : les kits de la référence restent tenus en poule et au tableau, pas en finale (Vessa et Tobin, une seule bonne réponse) ; à refaire au premier lot, comme SY-06.
- Les films de l'arène : le prototype n'est pas dans le jeu (rien sous `src/`) ; ils viendront avec le lot 2.
- La table des kits par rival a été apprise sur P1 (la parade à 4 coups, la lame à ×1,25, la Vivacité entière), pas sur PF.

### 31.6 La fiche d'arbitrages

https://claude.ai/artifact/NVyUoTFKBigFFzzm1abjUz (`briefs/fiche-combat-final.html`), publiée le 13/11/2026, seize cartes, à remplir par l'opérateur ; elle remplace la fiche d'essai du lot 2 (son « sinon les autres points sont valides »). Les décisions A3 marquées : CF-03 (les recharges, change DB5-3), CF-11 (la Vivacité des pièces, change AC-11), CF-13 (la pente de la poule, si +15 % : change SL1-1), CF-15 (le § 6.1 du contrat projet). Gardées : DB5 et SL1-2 (les durées), RY-1, RY-3 (la rupture), DB7-1, AC-07 (pas de riposte : la parade n'en est pas une), AC-16 (son principe), SY-01 (les mêmes règles pour tous : les styles sont des tactiques, pas des règles).

| Carte | Sujet | Recommandation |
|---|---|---|
| CF-01 | Le diagnostic | reçu |
| CF-02 | Les PA | les garder, leur budget commun (contre la direction de l'opérateur, chiffres à l'appui) |
| CF-03 | Les recharges (DB5-3, A3) | 5 × la charge à son niveau, dite rapide / moyenne / longue |
| CF-04 | La garde (DB5-2) | −50 % à force égale, de −30 à −70 % selon la Défense contre l'Attaque |
| CF-05 | La parade | 2 coups à la jauge du frappeur |
| CF-06 | Les terrains | les terrains et deux conditions (« quand il se protège », « quand sa jauge passe les deux tiers ») |
| CF-07 | Les styles | chaque rival sa tactique, dite sur la fiche de match |
| CF-08 | Les soutiens | Ferveur sur la prochaine action, mesurée au premier lot |
| CF-09 | L'automatique | garder SL1-3 |
| CF-10 | Les effets d'équipement | ces effets, réglés au premier lot (AC-12 étendu aux pièces) |
| CF-11 | La Vivacité des pièces (AC-11, A3) | à moitié |
| CF-12 | La course | calée sur la référence (AC-14, AC-15) |
| CF-13 | La pente de la poule (SL1-1, A3) | garder +7,5 % |
| CF-14 | La cote | la part de combats d'essai, pour plus tard |
| CF-15 | Le § 6.1 (A3) | l'amender avec le texte ajusté aux choix |
| CF-16 | La construction | en quatre lots, l'essai après le lot 2 |

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
