# Audit du gameplay général, au-delà du combat (Passe GP1, 2026-11-15)

## 0. La demande, la méthode

**La demande de l'opérateur, mot pour mot (15/11/2026)** : « au final notre jeu semble finalement coherent et quasi aboutit, je veux m'assurer que le gameplay general est bien integre au dela du combat donc le systeme de quete dynamique comme , le systeme d'entrainement/defi mais aussi observation de nos rivaux/ennemies pour etablir notre strategie, le systeme de gain d'or, donc d'achat/vente equipement pour ameliorer notre protagoniste, vol ou opportunite sur les pnjs, j'avais demande ausis un systeme de defi des pnjs ( avec conception de combattant generique pour eux ) lorsquon decide de tenter de les voler ou obtenir de force et frontalement un objet mais il semble que nous juste creer des combattants pre-elimine au lieu de ca. Bref tout cela doit etre consolider et valider afin que nous nous approchions de notre jeu final, un jeu dont un ami  qui a teste a eu le ressenti de jouer au jeu rpg Fable ». Il évoquera d'autres éléments à travailler.

**Le cadre** : un audit en lecture et en mesure. Aucune règle, aucun nombre, aucun texte du jeu ne change dans cette passe ; aucun écart n'est tranché (règle C3) ; les décisions vont sur la fiche d'arbitrages GP1. Tout est lu et mesuré sur `main` à `7207722` (Passe PF1), dans le worktree `priceless-tharp-71c68f`, branche `claude/audit-gameplay-gp1`, serveur DEV `gp-audit-dev` (:5496).

**La méthode**
- Le défi des PNJ, le vol et ses suites : lus par moi, fichier par fichier (`src/simulation/v2town.ts`, `v2law.ts`, `v2barter.ts`, `v2watch.ts`, `src/narrative/generics.ts`, `people.ts`, `src/simulation/v2places.ts`, `src/characters/PlazaCast.ts`), avec la demande d'origine retrouvée dans les archives du journal.
- Les quatre autres familles (les quêtes et les événements ; l'entraînement, les défis et le repérage ; l'or et l'équipement) : trois agents en lecture seule, chacun avec le contrat de gameplay. **Leurs constats les plus lourds sont revérifiés dans le code** (marqués ✓) ; les autres sont des lectures de code, pas des mesures.
- Des parties jouées : la TournamentLab, cinq politiques sur cent parties tenues à part (graines 101 à 200) ; un script de mesure hors dépôt (les actions prises, la bourse au matin des jours 6 et 10, le défi du jour 1 contre chaque adversaire sur 60 graines) ; douze déroulés dans le navigateur (`play-day`, `town-flow` ×3, `challenge-flow` ×4, `rivals-flow` ×2, `festival-flow` ×2).
- Les captures de la fiche : `tools/play-shots.mjs` en français sur les états nommés, et les captures des déroulés.

## 1. Le verdict

- **Le jeu tient debout** : sur cent parties par politique, aucune règle refusée, aucun participant oublié, Node rejoue la même empreinte que le navigateur dans les douze déroulés. Les systèmes se répondent là où la ville a été construite pour (le sabotage et ses parades, la ville qui réagit, le festival qui fait la somme des suites).
- **Mais quatre choses manquent ou se répondent mal, par ordre de poids :**
  1. **Le défi des PNJ demandé n'existe pas.** Ce qui existe : des combattants génériques nommés (les éliminés des qualifications), rencontrés en portrait seulement, qu'on défie pour le sport ; un vol qui reste un tirage ; une représaille différée. Aucune action ne prend un objet de force, aucun vol pris ne se règle par un combat, aucun PNJ ordinaire n'a de combattant (§ 2).
  2. **Il n'y a pas de système de quête.** Une seule quête à étapes (la Cargaison d'acier, héritée de la tranche), qui rend ce que la forge vend au même prix ; aucun journal d'objectifs. Le § 13 du contrat de gameplay (« 1 quête influençant un combat ») n'est plus tenu par la version 2 (§ 4).
  3. **La préparation ne se règle pas avant le jour du combat.** Le plan propre à un rival et les stats de l'adversaire ne se voient que sur la fiche de match, l'après-midi du combat, quand les créneaux sont dépensés ; un défi n'a ni fiche ni plan. Le défi domine l'observation et l'entraînement (§ 5, § 6).
  4. **L'argent ne sert plus à rien à la fin.** Le planificateur garde 87 pièces au matin du jour 10, la référence 71, le curieux 79 ; personne ne revend ; plusieurs pièces sont des évidences (le haubert d'Edda domine la cotte) (§ 7, § 8).
- **Des défauts nets**, lus et revérifiés : « deux à la fois » porte d'office une arme et efface les paliers de la forge ; un défi de seconde phase contre un combattant de la ville monte une compétence au niveau 4 sans la leçon payante ; le carnet décrit un combattant de la ville avec le kit de Marek ; la trempe se vend encore au palier maximal (§ 9).

## 2. Le défi des PNJ (la priorité de l'opérateur)

### 2.1 La demande d'origine, retrouvée
- **Passe AV1** (la fiche de la séance « Version 2 », 26/10) : AV-11 « Les trois, le vol avec ses conséquences » ; le brief, lot V4 : « Défier : un duel en ville, pour apprendre une compétence » ; « Voler : un vrai risque, plus facile de nuit. Pris, la réputation baisse, la garde s'en mêle ».
- **Passe EV2** (la fiche de l'étape 5, 05/11, `journal/59-passes-EV2-EVL1.md`), trois notes de l'opérateur, mot pour mot :
  - sur EV-2 (le vol) : « Mais il peut aussi avoir une possibilite de combat et de represaille reelle, d'ailleurs on parle de reputation mais comment cela fonctionne ? » ;
  - sur EV-4 (qui défier) : « Je voulais integrer aussi des pnjs generiques qui peuvent etre des combattants present lors de qualifs/eliminatoires par exemple » ;
  - sur EV-6 (le marchandage) : « mais on peut aussi marchander avec les passants pour obtenir un objet qui possede au lieu de le voler par exemple, ce qui peut donner l"obtention de items unique ou rentable comme dans octopath travaler ».
  - Et son message : « il se peut que nous devions creer des combattants generiques ( des elimines pour les qualifications pour la phase de groupe/finales ), mais il faut pas se perdre dans la structure du jeu ».
- **La question posée alors** (Passe EV2) : « Les combattants génériques (ta note sur EV-4 et ton message) : quelle place leur donner ? » ; **sa réponse : « En ville, structure gardée (Recommandé) »**, dont le texte disait : « Les génériques sont les éliminés des qualifications tenues avant l'arrivée de Ren : ils restent en ville, acceptent un défi, servent de gros bras dans une représaille (ta note sur EV-2). » Les options écartées : une qualification au jour 1, des barrages avant les finales.
- **Construit** : Passes EVL2 (le vol, les marques, les passants), EVL3 (le défi à pleine vie et sa mise, les trois génériques, la représaille de Corra), GA1 à GA4 (l'art de six génériques : visages et feuilles de combat), SK4 (cinq d'entre eux enseignent une compétence).

### 2.2 Ce que le code fait
- **Le vol** (`v2town.ts`, actions `steal` et `pickpocket`) : une ligne de la liste [Q] par étal ouvert (et les étals forcés la nuit) et par passant, avec sa chance ; un tirage. La chance : 30 % de jour, 60 % le soir, 70 % pour un étal forcé, corrigée par la sécurité, la faveur du marchand et l'alerte du lendemain d'un vol pris ; 35 à 50 % pour une poche. **On ne choisit pas ce qu'on vole** : c'est toujours la pièce la moins chère que le joueur n'a pas (`stealTarget`) ; chez Mara, la pierre à aiguiser (8 pièces).
  - Pris : une amende (15 de jour, 25 la nuit, 10 pour une poche), −8 à −15 de réputation, −20 à −30 de faveur, l'étal barré, une marque, le greffier ; un passant pris boude pour toute la partie (`snub:`, que la restitution ne lève pas).
  - Non vu : le propriétaire le découvre à l'aube suivante 60 % (85 % un étal forcé, 50 % une poche) : une marque.
- **Les suites** (`v2law.ts`, `v2watch.ts`) : trois marques font le joueur recherché (fouille à l'aube, étals fermés) ; la restitution chez Hale efface tout, même sans un sou (le reste en créneaux de travail) ; Wynn se poste à l'étal d'un vol connu.
- **La représaille** (`v2law.ts`) : seulement à l'aube qui suit un vol vu ou découvert **si la faveur de la victime est tombée à −30 ou moins** ; Corra Dunmere attend alors le joueur sur le quai, deux nuits ; on l'affronte (un duel, les gradins vides) ou on la paie 20 pièces ; ignorée, elle prend son dû. C'est le seul combat que déclenche un vol, et il est différé.
- **Les passants** (`v2barter.ts`) : Fenwick (quai, la nuit, jours 1 à 7), Dame Edda (parvis, de jour), Sela (halle, après-midi et soir, jours 1 à 9), chacun une pièce unique ; on l'achète, on la marchande (sur le nom, ou par « ce qui le touche ») ou on la vole. **Aucun combat.**
- **Les marchands** (Mara, Hilde, Pip, Bram, Corvin) : jamais combattables.
- **Les six combattants génériques** (`generics.ts`, `people.ts`) : Ser Aldric Venn (lices, de jour), Corra Dunmere (quai, la nuit), Frère Ambrose (halle, après-midi et soir), Lucan Rook (parvis, le soir), Piers Calloway (quai, de jour), Kell Barrow (halle, le matin). Chacun se bat sur le profil d'un rival, un peu plus faible ; défi sportif avec une mise (10 pièces ou 5 de réputation), une fois par phase ; cinq enseignent une compétence (Corra aucune). **Ils ne sont pas dans le monde** : `plazaPeople` les exclut (`v2places.ts:19`), leurs feuilles de ville n'entrent dans aucun atlas des places (`PlazaCast.ts:27`, « met in portrait only »). On les trouve dans la liste [Q], sous « Personnes présentes ».

### 2.3 Ce que le joueur vit
- Le vol est **une ligne de menu et un pourcentage**. Le joueur ne choisit ni la cible ni la façon ; il ne peut ni fuir, ni se battre, ni négocier quand il est pris. La conséquence arrive dans une bande de texte.
- Les combattants génériques sont **des portraits sans corps** : on lit « Piers Calloway, un champion de la lance qui garde les barges », mais le quai ne montre personne (capture `piers`). Leur feuille de combat existe et joue dans l'arène (capture `piers-duel`). Le guide les nomme « a few other fighters about the town ».
- La représaille surprend : rien dans le guide (« Stealing, and the watch ») ne dit qu'un marchand volé peut payer des gros bras ; elle n'arrive que si la faveur tombe sous −30, ce que le joueur ne voit pas.
- Les passants se lisent bien (leur page de marchandises, capture `edda-articles`), mais une poche prise ferme leur pièce pour la partie sans le dire.

### 2.4 Mesuré
- Le curieux (100 parties) : 5,65 vols par partie, 1,72 pris, 3,23 découverts à l'aube ; 1,13 représaille engagée par partie, 0,45 affrontée (0,43 gagnée) ; les autres réglées par la restitution chez Hale ; 2,65 pièces de passants. Les autres politiques ne volent jamais.
- Le défi du jour 1 (kit de départ, sans équipement, la mise du nom, 60 graines) : Orla 65 %, Corra 63 %, Ilse 77 %, Lucan 87 %, Vessa 90 %, Aldric et Ambrose 92 %, Kell 93 %, Piers 95 % ; Ren finit le combat avec 17 à 38 % de sa santé.

### 2.5 L'écart, précisément
| La demande | Ce qui existe | L'écart |
|---|---|---|
| Un combat quand on « tente de voler » un PNJ | Un tirage ; pris, une amende ; la représaille de Corra, différée, sous condition (faveur ≤ −30) | Aucun combat au moment du vol ; un seul « gros bras » pour toute la ville |
| « Obtenir de force et frontalement un objet » | Rien | Aucune action ; les passants se paient, se marchandent ou se volent, les marchands rien |
| « Avec conception de combattant générique pour eux » (les PNJ) | Six combattants nommés, distincts des PNJ, sans corps dans le monde | Aucun PNJ ordinaire (passant, marchand, citadin) n'a de combattant ; les génériques ne défendent rien |
| (EV-4) « des combattants présents lors de qualifs/éliminatoires » | Les éliminés des qualifications d'avant Ren, en ville | Conforme à la réponse « En ville, structure gardée », mais réduit à un défi sportif |
| (EV-6) « comme dans octopath traveler » | Le marchandage des passants | Le mécanisme d'Octopath qui prend un objet par le combat (le « défi » ou l'« attaque » d'un PNJ) n'a pas été repris |

La lecture : la construction a suivi les choix de la fiche (« En ville, structure gardée », le défi sportif à mise, la représaille) ; elle n'a pas repris la part des notes qui reliait le vol, l'objet et le combat. C'est ce que l'opérateur décrit aujourd'hui. Les propositions sont sur la fiche (GP-01 à GP-05).

## 3. Le vol, les opportunités et leurs suites (hors défi)
- **Ce qui marche** (déjà dit en Passe AU1, revu ici) : le vol n'est pas une faille (une série de vols coûte plus qu'elle ne rapporte), les marques et la restitution se lisent, Wynn posté bloque les vols et l'étiquette le dit, la sortie par Hale est toujours ouverte (corrigée en Passe CO3).
- **Ce qui ne sert à rien** : `pulse.sabotageRisk`, que chaque vol réussi monte de 2, n'est lu que par une réplique des passants.
- **Ce qui manque** : le choix de la pièce volée (toujours la moins chère : un voleur ne vise jamais ce qu'il veut) ; la représaille dans le guide ; la bouderie d'un passant levée par la restitution.

## 4. Les quêtes et les événements dynamiques
**Ce que le code fait** (agent, lecture ; points clés revus)
- **Une seule quête** : la Cargaison d'acier (`GameState.quests.cargo` : parler à Tam, les papiers de Hale, la porter à la forge, un créneau, +8 pièces ; puis la trempe, 10 pièces, qui vaut un palier d'arme). Dans la version 2, elle rend **le même effet que le premier palier de Bram au même prix** ; elle n'a rien de propre au combat. Elle commence en parlant à Tam ; aucune politique du laboratoire ne le fait. Aucune quête ne peut échouer.
- **Le moteur d'événements** (`src/events/engine.ts`) : 18 événements d'avant et 17 de la version 2, un par fin de créneau au plus ; **aucun ne propose de choix** ; **aucune condition de lieu** n'existe (`types.ts`) : les tricheurs de la halle (−5 pièces) et les tire-laines frappent le joueur où qu'il soit. `major.signs` et `major.answers` ne sont lus nulle part.
- **Les suites et les arcs** : le sabotage de la forge et celui de la sangle tiennent le § 9 (signes, prévention, parade, enquête, auteur, compensation) et leurs effets atteignent le duel (une sangle coupée : ×1,15 sur les coups reçus) ; Rhosk sur le sable fait perdre un jour d'entraînement, mais un mot gratuit à Hale le règle le soir même ; le conte de Vessa n'a aucun effet sur le duel ; démasquer Cassius lui coûte 3 points de poule (la seule suite qui touche le classement) ; Orla recrutable dès le jour 7 (délais ×0,9 en duel) ; le festival du jour 9 fait la somme des suites (chaque lanterne a sa raison).
- **État écrit et jamais lu** : les faits `gear-tampered`, `locker-open`, `friend-warned-*`, `barracks-brawl`, `healer-offer`, `rival-hurt-news`, `bunting-torn`, `informant-warning`, `tavern-talk`, le drapeau `watched`, `teamId`.

**Ce que le joueur vit**
- Il apprend les événements par la carte « Pendant ce temps », limitée aux 8 dernières lignes (`townUi.ts:402`) ; après un après-midi de combat, un signe peut en sortir (non mesuré). Le journal (J) garde tout.
- Les parades quotidiennes (payer le guet, la chambre forte d'Odo) portent un losange chaque soir ou chaque veille, menace ou non (`v2offers.ts:15-24`) : le signal d'une vraie menace se noie.
- La liste [Q] dit « quelque chose de neuf (type) », jamais quoi ; aucun écran ne montre une menace en cours, une piste ou un objectif.
- Le guide n'a aucun chapitre sur les événements, le sabotage ou la quête.

**Ce qui manque au contrat de gameplay** : § 4.1 et § 2 (la « quête structurée » dans la boucle) ; § 13 (« 1 quête influençant un combat ») ; § 6 (les « risques propres » de chaque quartier) ; § 11 (« quête ratée → coût »). Écarts consignés ici, non tranchés.

## 5. L'entraînement et les défis
**Ce que le code fait** (agent, lecture ; ✓ revérifié)
- La séance (lices, matin ou après-midi, un créneau) : +1 à une stat ou +20 PV au prochain combat du tournoi, deux au plus. Le spar d'Orla : le même effet et +15 de relation. Le drill : une compétence jusqu'au niveau 3. Les leçons de Corvin (dès le jour 6, 30 puis 60 pièces) : les niveaux 4 et 5. La répétition : trente duels contre l'ombre du prochain adversaire, après une observation.
- Le défi gagné cumule : la mise rendue deux fois, **+24 PV pour toujours** (la vigueur, `v2gear.ts:63` lit `v2.wins`, qu'un défi incrémente), la compétence de l'adversaire, la leçon du sable (+1 niveau à la première offensive du plan sous le niveau 3), le premier palier de repérage, une note du carnet, le rabais de Corvin le lendemain.
- **✓ Un défi de seconde phase contre un combattant de la ville monte au niveau 4 sans leçon** : `learnFromChallenge` appelle `learnOrRaise` sans plafond (`v2skills.ts:47`, `MAX_LEVEL` 5) ; une compétence apprise en première phase puis drillée au niveau 3 passe au 4 ; la page dit que seules les leçons vont au-delà de 3.
- Le rabais de Corvin après un défi ne touche que ses trois compétences à vendre, pas les leçons, alors que l'événement dit « teaches the winner at a fifth off ».

**Ce que le joueur vit**
- Les libellés sont clairs sur l'effet principal ; mais le libellé du défi ne dit ni les +24 PV ni la leçon du sable.
- **Un défi n'a pas de fiche de match** : le bouton du sable ouvre l'arène (`townUi.ts:330`) ; on ne voit pas l'adversaire et on ne règle aucun plan pour lui.
- **Le défi domine** : 63 à 95 % de victoires au jour 1 avec le kit de départ, des gains qu'aucune autre action ne donne ensemble. Le curieux en fait 7,7 par partie et en gagne 94 %.

## 6. L'observation et le repérage
**Ce que le code fait** (agent, lecture ; ✓ revérifié)
- Observer un rival (un créneau) : son style la première fois, son plan la seconde, un autre jour ; la répétition s'ouvre au premier palier. Les rumeurs (Lio 3 pièces, juste deux fois sur trois ; l'inconnu 8 pièces, toujours juste) : la santé et la forme du prochain adversaire, et une ligne « kit ». Ce que la ville a vu, gratuit, sur la page du tournoi. Le carnet de Corvin après chaque combat.
- **✓ Le carnet et le repérage d'un combattant de la ville le décrivent avec le kit de Marek** et sous son identifiant brut (`v2scout.ts:81`, `:105` : `AUTO_FOES` ne contient que les rivaux).
- La santé que vend la rumeur est donnée gratis par le tableau (« (hurt) ») ; la ligne « kit » répète le premier palier (les kits et les plans des rivaux ne changent jamais) ; la forme double deux lignes gratuites. « Écouter » à la taverne promet de la célébrité et donne de la réputation.

**Ce que le joueur vit**
- Une stratégie est possible et lisible (observer, répéter, ajuster, répéter), avec des chiffres et un conseil.
- **Mais le plan propre à un rival ne se règle que sur la fiche de match, l'après-midi du combat** (`townUi.ts:469-478`) ; la répétition de la veille teste le plan général ; les stats de l'adversaire ne se voient que ce jour-là, la page des compétences calculant contre le Marek de la poule (`preview.ts:78`). Le joueur choisit sa séance d'entraînement à l'aveugle.
- L'observation et la répétition ne portent ni losange ni ligne [Q] ; le guide « Watching and rumours » dit encore « tells you their skills » ; le rappel de la veille d'un combat ne parle ni d'observer ni de répéter.
- Les kits et les plans des rivaux sont fixes : une fois vus, le repérage n'a plus de contre-jeu.

## 7. Le gain d'or
**Ce que le code fait** (agent, lecture)
- Les entrées : 60 au départ ; les quatre travaux à 10 pièces (les caisses de Mara et les élèves de Corvin sont tous deux le matin : on n'en fait qu'un ; l'armure de Hilde l'après-midi, jamais un jour de combat) ; les bourses (20/5 en poule, 35/10, 45/15, 80/30, 100 au champion) ; le défi (+10 net gagné) ; la revente chez Mara (moitié, le sac seulement) ; la bourse des Lanternes 30, la cargaison 8, le rapport 15, la guilde 15, les bookmakers 10 ; des pertes au hasard (−4, −5).
- **Mesuré (100 parties, bourse médiane au matin du jour 6 / du jour 10 / en fin)** : l'idle 81 / 91 / 91, le diligent 26 / 1 / 1 (le guet payé chaque soir), le curieux 18 / 79 / 118, le planificateur 56 / 87 / 115, la référence 51 / 71 / 110. Le planificateur et la référence font 11 travaux par partie ; **aucune politique ne revend**.

**Ce que le joueur vit** : où gagner se découvre bien (losange de l'employeur, étiquette « +10 », chapitre « Earning coins », conseil). Mais l'argent devient inutile après le jour 6 : la bourse de la finale et celle du champion tombent après le dernier combat, et il n'y a plus rien qui vaille d'être acheté. Le rapport à Hale (+15) affiche « gratuit », la cargaison n'a pas d'étiquette de gain.

## 8. L'achat et la vente d'équipement
**Ce que le code fait** (agent, lecture ; ✓ revérifié)
- Quatre boutiques et trois passants ; le prix suit le lieu, la réputation (−15 % à 60), un seuil d'amitié (−10 % dès 15, tout ou rien), la pénurie d'acier (après le sabotage de la forge), le soir (+20 %, mais seule Pip est ouverte le soir), le lendemain d'un vol (+25 %), le marchandage.
- **✓ « Deux à la fois » porte d'office une arme et remet le palier à 0** (`receive`, `v2gear.ts:125`) : chez Corvin, acheter les bottes en paire ajoute le sabre et efface les paliers payés à la forge, sans l'avertissement que la page donne pour un achat simple.
- **✓ Le haubert d'Edda (34 pièces, Défense +7) domine la cotte de Hilde (40, Défense +6)**, avec les mêmes effets de duel.
- La trempe et les paliers : l'ordre change le prix (45 ou 75 pièces) ; la trempe se vend encore au palier maximal, pour rien (`roles.ts:157`).
- La vente : seulement ce qui est dans le sac ; une pièce portée ne se déséquipe pas ; les paliers ne se revendent pas.
- Morts : le jeton du champion n'est donné par rien ; les PA d'équipement ne sont plus lus par le duel ; le pouls « commerce » ne change aucun prix ; chaque pièce n'est vendue qu'à un endroit (le facteur de lieu n'est jamais un choix).

**Ce que le joueur vit** : la page compare avant et après (une bonne page, validée en UM9) ; mais elle montre la Vitesse des pièces entière, quand le duel la compte à moitié ; elle dit « protections et renforts +30 % » quand seules les protections s'allongent ; elle ne nomme pas les effets de duel des pièces (la cotte −20 % sur les coups légers, les bottes, l'anneau…). Les choix sont surtout des évidences ; la vraie contrainte est le créneau, pas la pièce.

**Ce qui manque au § 10** : des prix qui suivent l'étape du tournoi ; plus d'une pénurie ; une alternative à une boutique barrée (aucune pièce n'est vendue à deux endroits).

## 9. Les parties jouées : ce qui ne sert à rien, ce qui casse, ce qui manque
**La TournamentLab** (graines 101 à 200)
| Politique | Titres | Combats gagnés | Défis (gagnés) | Vols (pris) | Travaux | Pièces en fin |
|---|---|---|---|---|---|---|
| idle | 0 % | 25 % | 0 | 0 | 0 | 97,6 |
| diligent | 0 % | 40 % | 0 | 0 | 0 | 5,4 |
| curieux | 26 % | 79 % | 7,67 (7,20) | 5,65 (1,72) | 0 | 138,8 |
| planificateur | 27 % | 81 % | 0 | 0 | 11,27 | 152,2 |
| référence | 43 % | 85 % | 0 | 0 | 11,14 | 161,3 |

- **Actions qu'aucune politique ne prend** (100 parties chacune) : parler (`talk`), la cargaison (`askPapers`, `haul`, `temper`), `keepWatch`, `buyInfo`, `register`, le spar, écouter, provoquer, confronter, acheter une compétence, la leçon de Corvin, régler l'ordre et la tactique, équiper, annuler un défi, recruter Orla, payer Corra, travailler une dette, confronter Vessa, marcher derrière un rival, vendre, **répéter**. Le laboratoire ne mesure donc ni la préparation fine, ni la revente, ni la quête, ni le recrutement : ce que ces actions valent ne se voit qu'en jeu.
- **Les déroulés dans le navigateur** : neuf verts sur douze ; les trois échecs viennent des outils, pas du jeu (Node rejoue la même empreinte que le navigateur dans les douze) : `challenge-flow challenge win` sur sa graine par défaut (Orla gagne au jour 1 depuis la course de SK4), `challenge-flow reprisal lose` (Ren bat Corra), `rivals-flow tale` (son motif attend « and is still rusty », le texte dit « and has trained little: their blows will land softer »). À reprendre dans les outils.

**Ce qui casse ou se contredit** (lu, ✓ revérifié pour les quatre premiers)
1. ✓ « Deux à la fois » qui porte une arme et efface les paliers.
2. ✓ Un défi de seconde phase qui passe une compétence au niveau 4 sans leçon.
3. ✓ Le carnet qui décrit un combattant de la ville avec le kit de Marek.
4. ✓ Le haubert qui rend la cotte inutile.
5. La trempe vendue au palier maximal ; l'ordre trempe / paliers qui change le prix.
6. Les pages d'équipement qui contredisent le duel (la Vitesse, les soutiens, les effets non dits).
7. « Écouter » qui promet de la célébrité ; le rabais de Corvin qui ne touche pas les leçons ; la rumeur qui vend une santé gratuite.
8. Les événements de quartier qui frappent hors de leur lieu.

**Ce qui ne sert à rien** : la ligne « kit » de la rumeur ; le jeton du champion ; les PA d'équipement ; le pouls « commerce » et `sabotageRisk` ; une douzaine de faits jamais lus ; le soir +20 % hors de chez Pip ; la cotte.

**Ce qui manque** : le défi des PNJ (§ 2) ; un système de quête (§ 4) ; une préparation réglable avant le jour du combat (§ 6) ; un usage de l'argent après le jour 6 (§ 7) ; le choix de ce qu'on vole (§ 3).

## 10. La fiche
https://claude.ai/artifact/WyRKyZbsB1MMp8yMmAw8ho (source `briefs/fiche-gameplay-gp1.html`, neuf captures publiées avec la page, hors du dépôt), vingt et une cartes en six familles : le défi des PNJ (GP-01 à GP-06), le vol (GP-07, GP-08), les quêtes et les événements (GP-09 à GP-11), la préparation (GP-12 à GP-16), l'or et l'équipement (GP-17 à GP-20), l'ordre des chantiers (GP-21). Trois options portent la marque « décision A3 » : GP-14 (la vigueur pour les seuls combats du tournoi, qui précise DB7-4) et deux de GP-17 (les paris, l'investissement, qui changent AU-13). Rien n'est construit avant que l'opérateur l'ait remplie ; chaque chantier part ensuite dans sa séance, sauf décision contraire.

## 11. Les décisions de l'opérateur (Passe GP2, 15/11/2026)
- La fiche relue : **vingt et une décisions sur vingt et une à la recommandation**, consignées mot pour mot au journal (Passe GP2).
- **Décision A3** : GP-14 « La vigueur pour les combats du tournoi seulement (décision A3 : précise DB7-4) ».
- **La note de GP-04**, mot pour mot : « Mais les pnjs peuvent etre des combattants eux-meme personne ne se bat vraiment pour d'ou la volonte de conception generique avec des declinaisons de peau cheveux, couleur de vetement et armes etc... » ; précisée par la question de la Passe GP2, réponse « Gabarits d'abord (Recommandé) » : les PNJ se battent eux-mêmes, sur un gabarit générique tiré des planches de référence, décliné en peau, cheveux, couleur des vêtements et armes ; le combat d'un passant s'ouvre avec ce gabarit ; les six génériques restent des combattants de la ville, debout sur les places (GP-05), sans rôle de protecteur.
- **La note de GP-21**, mot pour mot : « prevoit aussi un chantier d'optimisation concernant les stats d'etat nefastes comme poison, brulure, blind etc... qui peuvent etre utile dans un combat et devrait etre integre ainsi des competences mais surtout des armes equipes donnera des effets avantageux ou des armures/accessoires qui donnent des protections a ces effets » ; placée par la réponse « Avant l'or et l'équipement (Recommandé) ».
- **Les cinq chantiers, dans l'ordre**, chacun dans sa séance et avec sa fiche courte avant la fusion : (1) le défi des PNJ et le vol, GP-01 à GP-08, avec les défauts GP-16 et GP-20 et les trois outils de déroulé périmés ; (2) la préparation, GP-12 à GP-15 ; (3) les quêtes et les événements, GP-09 à GP-11 ; (4) les états néfastes (atelier, mesures, fiche) ; (5) l'or et l'équipement, GP-17 à GP-19, le catalogue revu avec les effets et les protections du chantier 4.
