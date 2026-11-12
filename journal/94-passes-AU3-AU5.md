# Journal de bord — archive : passes AU3, AU4, AU5 (2026-11-11)

> Déplacée mot pour mot de `JOURNAL.md` le 2026-11-12 (Passe LC1) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe AU3 — La direction de l'opérateur sur le combat après la fiche AU1 : des duels automatiques, le joueur prépare ; consignée, rien d'appliqué (2026-11-11)

### Ce que l'opérateur a dit
- En réponse au chantier n° 1 de la Passe AU2 (« Le recalage du duel et de la progression, d’abord (AU-03), mesuré sur des parties entières »), le 2026-11-11, mot pour mot : « je pense que nous devons partir du principe que les duels seront des combats auto par ordinateur ou nous les joueurs nous allons surtout nous focus sur la preparation du combat ( equipement, skills, etc...) donc on doit bien adapter le systeme de combat avec des valeur coherente pour une simulation optimale puis par la suite on vera si on effectue un systeme semi-auto... le vrai changement sera d'integrer un zone de charge/attente avant d'agir peut etre que voir comment adapter cela avec AP bref il faut bien penser a ce la ».
- Puis, mot pour mot : « sinon les autres chantiers semblent bon mais comme je dis tout ce qu'il est lie au combat devra etre repenser donc ».

### Ce que cela change dans les chantiers de la Passe AU2
- **Le chantier n° 1 n'est plus un recalage** : c'est une refonte du combat autour de duels joués par l'ordinateur.
  - Le joueur prépare : l'équipement, les compétences, le kit, les séances, la santé, l'information.
  - Le combat a des valeurs cohérentes pour une simulation ; un mode semi-automatique est à voir plus tard.
  - Le changement principal nommé par l'opérateur : une zone de charge et d'attente avant d'agir, à accorder avec les points d'action.
  - Il se conçoit comme l'atelier CB1 : les règles de l'opérateur recueillies par questions, une spécification, des mesures en simulation, une fiche ; puis la construction.
- **Le chantier n° 2 (AU-04, dire les nombres du duel) attend cette refonte** : les nombres et ce que le joueur en lit changeront.
- **« Tout ce qui est lié au combat » est à repenser avec elle.** L'audit en relève les parties suivantes, à reprendre avec la refonte et non à côté :
  - la commande à trois touches et sa charge (`src/combat/charge.ts`, `v2duel.ts`), le bot (`src/combat/bot.ts`), la course hors écran (`profiles.ts`) ;
  - le HUD du duel (`DynamicHud.ts`), la fiche de match, la page des compétences, le guide « Le duel » et « Préparer un combat » ;
  - le tutoriel du premier duel (TU4), les touches du duel au remappage (RM3) et à la manette (MN2) ;
  - les couches musicales qui suivent les séquences du joueur (règle F, SN14), les effets par action (FX) ;
  - les outils `duel-balance`, `arena-scene-check`, `attack-spam-proof`, la politique des bots du laboratoire ;
  - parmi les paramètres d'essai d'AU-11, ceux du duel (`input=keys`, `dyn=`, `fx=off`, `combat=dynamic`).
- **Les autres chantiers restent comme listés** (« sinon les autres chantiers semblent bon ») : la graine et la sauvegarde, le fondu au noir avant chaque page, les correctifs de la ville et « 10 % », les documents, le ménage, les paramètres d'essai hors du duel, les amendements des contrats, puis l'essai de réception guidé.

### Ce que la refonte touche dans les contrats — à décider avec l'opérateur, rien de changé ici
- **Contrat projet § 6.1**, amendé trois fois (CB-8, AV-5, CH1) : « le joueur agit par trois commandes, la garde, l'esquive et l'attaque, l'attaque chargée en la tenant… ». Un duel joué par l'ordinateur change ce paragraphe. Son amendement sera une décision A3, citée mot pour mot, avant la construction (comme CB-8), et il s'écrira avec ceux d'AU-05 et d'AU-12.
- **Contrat projet § 6.1, second alinéa** : « La première priorité de production est de rendre le duel lisible, tactique, rapide à comprendre, suffisamment profond pour valoriser la préparation et spectaculaire sans perdre la lecture des décisions ». Il est compatible avec la direction de l'opérateur (« valoriser la préparation »), à relire avec elle.
- **Contrat gameplay**, verrou 2 « Le 1v1 est la première expérience de combat à réussir » : inchangé. **Contrat tournoi § 6** : les matchs non vus « doivent provenir du même modèle de stats/règles que les combats visibles ». Une observation pour l'atelier, pas une décision : un duel automatique peut être la même simulation que les combats hors écran, alors qu'aujourd'hui la course et le duel se calibrent à part.
- **Ce que l'audit apporte à l'atelier** (`briefs/audit-final.md` § 2.3) :
  - le bot du laboratoire joue déjà le duel seul, sur la même simulation que l'arène (empreinte égale sur 105 duels sur 105) ;
  - le choix des quatre compétences décide déjà plus que l'adresse : l'attaque puissante apportée gagne 93 à 98 % des finales, le kit de départ est le plus faible ;
  - la préparation des rivaux (×1,00 à ×1,25), l'équipement en points et la vigueur des défis pèsent tous sur l'issue ;
  - aucun titre n'est gagné en 200 parties.

### Validation
- Documents seulement : `JOURNAL.md` et `briefs/audit-final.md` (§ 9). Aucun fichier du jeu.

### Où reprendre
- La séance qui coordonne lance l'atelier de refonte du combat, en premier, dans sa séance, et les autres chantiers sans le combat.
- La séance de l'atelier relit l'atelier CB1 (`briefs/combat-system.md`, journal Passe CB1), les §§ 18 à 20 de la spécification et le § 2.3 de l'audit. Elle recueille d'abord les règles de l'opérateur : la zone de charge et d'attente, les points d'action, ce que le joueur prépare, ce qu'il voit pendant le duel, le semi-automatique plus tard.

### Pensée
- Quand l'audit montre que le choix des compétences décide plus que la main, et que l'opérateur veut que le joueur prépare plutôt qu'il joue, la refonte part de ce que la simulation sait déjà faire seule, le bot du laboratoire ; elle n'invente pas une boucle de plus.

## Passe AU4 — Une inspiration de l'opérateur pour l'atelier du combat, La Brute : son fonctionnement lu dans le code de son remake ; consignée, rien d'appliqué (2026-11-11)

### Ce que l'opérateur a partagé
- Le 2026-11-11, après la Passe AU3, mot pour mot : « voici une inspiration interessante : », suivi d'un texte collé qui présente *La Brute*.
  - C'est un jeu par navigateur de Motion Twin (2008). On y crée un personnage, « une brute », au nom et à l'apparence tirés au hasard.
  - Ses combats se déroulent tout seuls, selon le hasard et les statistiques (force, agilité, vitesse).
  - Le jeu sur Flash a fermé en 2020 et revit par des projets de fans : La Brute Legacy (https://la-brute-legacy.com/) ; sa fiche sur SensCritique : https://www.senscritique.com/jeuvideo/la_brute/454570.
- Ce n'est pas une décision : c'est une inspiration pour l'atelier de refonte du combat (Passe AU3).

### Ce que fait La Brute, vérifié dans le code
Lu le 2026-11-11 dans le code de son remake en TypeScript, https://github.com/Zenoo/labrute (le jeu : https://brute.eternaltwin.org/), fichiers `server/src/utils/fight/fightMethods.ts`, `getFighters.ts`, `core/src/brute/weapons.ts` et `getLevelUpChoices.ts`. Sa licence n'est pas une licence libre standard (« Other » sur GitHub) : rien n'en est copié, seul le principe est noté.
- **Une ligne de temps décide qui agit, et quand.**
  - Chaque combattant porte une valeur d'initiative, qui est un temps. Celui dont la valeur est la plus basse agit (`orderFighters`) ; un combattant étourdi passe après les autres.
  - Au départ, la vitesse décide qui ouvre : l'initiative vaut (un tirage de 0 à 10, moins la vitesse) / 100.
  - Après chaque action, le temps du combattant avance du tempo de son arme multiplié par son propre tempo, plus un petit tirage (`increaseInitiative`).
  - Son tempo vient de sa vitesse : 0,10 + 0,90 × 20 / (10 + 1,5 × vitesse), soit 1,9 à vitesse 0, 0,82 à vitesse 10 et 0,55 à vitesse 20.
  - Une arme lourde fait attendre longtemps (la hache, tempo 2,3), une arme légère presque pas (0,28). Certaines actions ont leur propre attente ; un filet ou un étourdissement repousse le tour de l'adversaire.
  - **C'est une zone de charge et d'attente au sens de l'opérateur** : agir coûte du temps avant l'action suivante, et la vitesse et l'arme règlent ce temps.
- **La préparation fait la différence.**
  - Chaque arme a son tempo, ses dégâts, sa précision, sa parade, son esquive, son combo, son désarmement et son allonge. S'y ajoutent des compétences et un animal.
  - À chaque niveau, le joueur choisit entre deux propositions tirées au hasard : une arme, une compétence ou un animal, contre +2 à une stat (ou +1 à deux stats).
- **Le joueur regarde.** Le combat est calculé en entier sur le serveur, puis rejoué en animation chez le joueur.

### Ce que l'inspiration apporte à l'atelier — des observations, rien de décidé
- **La simulation du jeu a déjà les pièces d'une ligne de temps.**
  - Elle a les temps de charge des compétences, leurs recharges (5 × le temps de charge, DB5-3), le rythme de chaque rival par sa Vivacité (DB7-1) et les PA.
  - L'atelier peut se demander si chaque action devient une attente sur une même ligne de temps, raccourcie par la Vivacité.
  - Il reste à savoir ce que deviennent les PA : un coût en plus du temps, ou remplacés par lui. C'est la question de l'opérateur en Passe AU3 (« voir comment adapter cela avec AP »), à lui reposer avec des mesures.
- **Un combat calculé puis montré.** Les duels vus et les combats hors écran deviennent alors le même modèle, ce que demande le contrat tournoi (§ 6). Aujourd'hui, la course hors écran et le duel se calibrent à part (audit § 2.3).
- **Un choix entre deux propositions à chaque progression.** C'est une préparation lisible, conforme à la préférence de l'opérateur pour des règles simples. Le jeu a déjà ses leviers : l'équipement, les séances, les compétences, les informations. L'atelier dira lesquels se choisissent, et comment.
- **La durée.** Le duel du jeu dure de 2 à 5 minutes par la décision A3 DB5 (« je veux qu'un combat basique dure en 2 et 5 min. +5 min peut etre exceptionnellement des combats epiques »), prise pour un duel joué. Ce que cette durée devient pour un duel regardé est une question pour l'opérateur dans l'atelier ; seule sa décision peut changer DB5.
- **Le hasard.** La Brute tire ses armes et ses bonus au hasard ; l'opérateur préfère des règles lisibles, sans points cachés. Ce qui est tiré, et ce qui en est dit au joueur, se décide avec lui.
- **Le principe, pas le jeu.** La refonte peut reprendre une ligne de temps d'initiative et une préparation par choix, qui sont des mécaniques de genre. Elle ne reprend ni les armes de La Brute, ni ses noms, ses animaux, son art ou ses textes.

### Validation
- Documents seulement : `JOURNAL.md` et `briefs/audit-final.md` (§ 9). Aucun fichier du jeu.
- Les passes gardées dépassaient 60 Ko avec AU4 : LA1 et LA2 (branches fusionnées) déplacées d'un bloc, à l'octet, dans `journal/91-passes-LA1-LA2.md`, leur ligne ajoutée à l'index ; preuve par script : le corps de l'archive égale les 11 246 octets retirés, chaque passe dans un seul fichier, le reste du journal inchangé hors de l'index, de la phrase d'en-tête et de l'entrée 00, CRLF partout ; 52,0 Ko de passes restent.

### Où reprendre
- La séance de l'atelier lit cette passe avec la Passe AU3, avant de recueillir les règles de l'opérateur.

### Pensée
- Quand l'opérateur montre un jeu en exemple, on lit à la source comment il marche avant d'en tirer une règle, et on en garde le principe sans le jeu.

## Passe AU5 — Les réponses de l'opérateur pour la refonte du combat : une ligne de temps avec les PA, la défense et l'esquive par les cinq stats, un semi-automatique, une durée pour profiter du duel, et le vrai problème, le joueur qui perd trop contre les rivaux avancés ; consignées, rien d'appliqué (2026-11-11)

### Ce que l'opérateur a dit (en réponse à la Passe AU4, mot pour mot)
- Sur la ligne de temps et les PA : « Il faudrait une ligne de temps mais les PA sont essentiels pour l'usage des competences sauf si on a un meilleur choix, et la defense et esquive comment cela sera gere ? on a deja defini 5 stats ».
- Sur un même modèle pour les duels vus et hors écran : « determinons le plus optimale mais comme j'ai dit un system semi-auto permettrait de determiner quand lancer les competences par exemple ».
- Sur la durée (DB5) : « il faut determiner un temps de simulation suffisamment bon a profiter du duel ».
- Sur « le principe, pas le jeu » : « oui on est sur une inspi car on a deja notre idee de base de ce que nous voulons mais il s'avere que ce n'est pas bien structure car le joueur perd trop souvent face au ennemie avance/expert par exemple, ce qui est la problematique ».

### Ce que cela fixe pour l'atelier : une direction, pas encore des nombres
- Une ligne de temps, et les PA gardés pour les compétences, sauf si l'atelier trouve mieux et le montre à l'opérateur.
- La défense et l'esquive à définir dans une simulation automatique, avec les cinq stats déjà décidées (DB7-1 à DB7-6, A3).
- Le modèle le plus juste pour les duels vus et hors écran, à déterminer ; un semi-automatique où le joueur choisit quand lancer ses compétences.
- Une durée choisie pour qu'on profite d'un duel regardé. DB5 (A3) reste en vigueur jusqu'à une nouvelle décision de l'opérateur.
- **Le problème à résoudre, nommé par l'opérateur** : le joueur perd trop souvent contre les rivaux avancés et experts. Selon lui, c'est la structure qui est en cause, pas seulement les nombres.

### Ce que l'audit en mesure (`briefs/audit-final.md` § 2.1 et § 2.3)
- 0 titre en 200 parties. La poule est gagnée à 100 % dès le jour 4, puis la demi-finale du jour 6 tombe à 4 % pour le planificateur (0 sur 37 contre Vessa).
- Les rivaux grandissent par multiplicateurs à chaque étape : PV ×1,7 au tableau et ×3,5 en finale, +3 / +3 / +2 aux stats. S'y ajoute leur préparation (×1,09 au jour 2, ×1,21 en demi-finale, ×1,25 en finale), que l'outil de calibrage ne compte pas.
- Ren grandit par petits ajouts fixes : +24 PV par victoire, +1 à une stat par séance, l'équipement en points. La courbe suppose ses compétences au niveau 3, qu'aucune politique n'atteint : toutes restent au niveau 1.
- Facteurs isolés, au tableau : le niveau 3 sans la préparation des rivaux gagne 82 %, le niveau 1 avec elle 25 %.

### Des propositions pour l'atelier — à mesurer et à montrer à l'opérateur, rien de décidé
1. **Le temps décide quand, les PA décident quoi.**
   - Chaque action fait attendre son auteur sur la ligne de temps : son temps de charge, raccourci par la Vivacité (la règle ×10 / Vivacité d'aujourd'hui).
   - Les PA se gagnent (par l'attaque simple, DB-3) et paient les compétences. Une recharge devient une attente avant de relancer la même compétence.
2. **La défense et l'esquive en réactions, sans sixième stat.**
   - Chaque coup reçu peut être gardé ou esquivé, avec une chance calculée et affichée.
   - La garde viendrait de la Défense : le coup gardé à −80 %, sa part ×2 à la jauge de celui qui garde (règles DB5 et DB9).
   - L'esquive viendrait de la Vivacité, comparée à celle de l'attaquant.
   - Les cinq stats gardent leur rôle d'aujourd'hui (PV, dégâts, jauge, attente), et deux d'entre elles en prennent un second, visible.
   - Autres voies à comparer : la garde et l'esquive en postures choisies sur la ligne de temps, ou données par l'équipement et les compétences seulement.
3. **Une simulation, trois façons de décider.**
   - L'IA des rivaux et des combats hors écran.
   - L'automatique du joueur : l'IA joue Ren selon sa préparation, et peut-être selon une tactique choisie avant le combat.
   - Le semi-automatique : le joueur lance une compétence quand il le veut, et elle part au prochain tour de Ren.
   - Ainsi construit, le semi-automatique ne demande pas de refaire le combat, et les combats hors écran deviennent la même simulation (contrat tournoi § 6). C'est déjà la forme du code : `DynamicSim` et son bot, une empreinte égale entre le laboratoire et l'arène (105 duels sur 105).
4. **La durée comptée en actions.**
   - Il faut assez d'échanges pour voir la préparation agir (les compétences, une rupture, un retournement), et pas assez pour lasser.
   - Une hypothèse de départ à mesurer : 20 à 40 actions par duel, de 1,5 à 2,5 s de montré chacune, avec une vitesse ×2 et « passer au résultat ».
   - Aujourd'hui, dans des parties entières : la poule dure 1,0 à 2,1 min, la demi-finale 1,6 à 2,4, la finale 3,4 à 3,7.
5. **Partir de la courbe, pas du duel.**
   - Fixer d'abord, pour chaque étape, le joueur de référence : ce qu'un joueur qui prépare normalement a au jour 6 et au jour 10, avec des niveaux de compétences réellement atteignables.
   - Fixer les chances visées, par exemple : un joueur préparé gagne nettement en poule et se bat à peu près à égalité en finale ; un joueur qui ne prépare pas perd.
   - Puis caler les rivaux dessus, leur préparation comprise, mesuré sur des parties entières du laboratoire et non sur des duels isolés.
   - En automatique, la préparation est le seul levier : l'écart entre préparé et non préparé doit se voir et rester juste. La croissance des rivaux se dit sur la fiche de match.

### Validation
- Documents seulement : `JOURNAL.md` et `briefs/audit-final.md` (§ 9). Aucun fichier du jeu.

### Où reprendre
- L'atelier de refonte du combat part de cette passe et des Passes AU3 et AU4. Il recueille d'abord les choix de l'opérateur sur ces cinq propositions, sur une fiche, avec des mesures.

### Pensée
- Quand le joueur ne joue plus le duel, la difficulté se règle entièrement par la préparation : on calibre sur ce qu'un joueur peut réellement préparer, pas sur un joueur supposé.

