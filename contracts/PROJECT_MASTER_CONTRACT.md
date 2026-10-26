<!--
Provenance (journal, Passe N3). Collé par l'opérateur dans la séance de planification de la séance cloud, le 2026-10-20, et versionné ici sur
les décisions C1 (« contracts/ à la racine (versionnés, donc publiés) ») et C2 (« Je le fournis avant le lancement »). Le texte ci-dessous est
recopié tel quel, sans mise en forme ajoutée. Deux points relevés, non corrigés : l'en-tête dit « Version : 1.2 » et la dernière ligne
« v1.1 » ; la « décision A3 » des autres contrats n'y est pas définie.
Amendement du 2026-10-25 (journal, Passe CB1 ; décision A3 de l'opérateur, choix CB-8 « Amender maintenant, ces trois phrases ») : au § 1,
« au tour par tour » devient « au combat en « tour par tour dynamique » » ; au § 6.1, la première phrase est remplacée. Textes d'avant : « …
est un RPG narratif au tour par tour centré sur… » et « Le combat est un RPG tour par tour dont le format de départ est 1 contre 1. ». Le reste
du texte est inchangé.
Amendement du 2026-10-26 (journal, Passes AV1 et V1 ; décision A3 de l'opérateur, choix AV-5 « Oui, amender (A3), l'ancien schéma gardé
pour comparer ») : au § 6.1, « le joueur agit par des actions instantanées ou à délai de préparation, les compétences payées en points
d'action » devient « le joueur agit par trois commandes, la garde, l'esquive et l'attaque, l'attaque chargée en la tenant, par paliers, de
l'attaque légère à l'attaque puissante puis aux compétences, les compétences payées en points d'action et réglées par leur niveau ». La
demande de l'opérateur, mot pour mot : « Ah et enfin on aura une dernier optimisation pour le systeme de combat. surtout cote joueur, au lieu d'avoir plusieurs touches d'action on en aura 3 ( garde, esquive, attaque ) sauf que l'attaque sera comme une charge a niveau : donc une simple pression permet de faire une attaque simple, en restant legerement appuye pendant 2-3s, on utilise une attaque lourde, si on reste 5 seconde de plus on debloque une action de competences et ainsi de suite, les competences les plus puissantes nous obligerait a charger pendant peut etre 10s ( ce n'est qu'un exemple ) mais donc peut etre quee nous aurrions des niveau de competences qui determine le puissance et le temps de charge ( exemple de final fantasy 6 avec le personnage Cyan ) ». Le reste du texte est inchangé.
-->
Cité du Tournoi — PROJECT MASTER CONTRACT

Version : 1.2
Date : 2026-10-02
Statut : Contrat fondateur — référence de production
Priorité : Ce document prévaut sur les anciens concepts incompatibles avec la direction actuelle.

0. Règle de lecture

Ce contrat définit l'identité non négociable de Cité du Tournoi. Toute tâche, tout mini-agent, tout outil de génération ou toute proposition technique doit préserver ces principes. Une modification d'un verrou majeur doit être explicite, documentée dans un journal de décision et validée avant implémentation.

Décision canonique actuelle

La direction canonique est hybride 2D/3D et doit préserver l'envie d'une présentation de type HD-2D sans sacrifier la liberté offerte par Three.js :

ville et espaces jouables en 3D low-poly stylisée, conçus principalement dans Blender puis rendus par Three.js ;

personnages pouvant être représentés par des sprites animés dans l'environnement 3D, notamment pour l'exploration, la narration et/ou le combat lorsque cela renforce la direction artistique ;

usage possible de billboards, sprite sheets, portraits 2D, cartes peintes, impostors et éléments pré-rendus/composités lorsque ceux-ci améliorent le rendu ou la production ;

Three.js + TypeScript pour le runtime et la composition finale ;

Blender comme source d'autorité spatiale pour l'architecture, les volumes, les caméras, les collisions, les éclairages et les exports 3D ;

architecture de ville par quartiers fortement identitaires ;

cycle jour / nuit structurant visuellement et ludiquement ;

tournoi évolutif comme horloge, spectacle public et moteur de tensions : duels individuels 1v1 au départ, recrutement progressif, puis formats d’équipe plus tard dans la compétition ;

simulation de ville causale et persistante ;

production organisée par contrats et mini-agents spécialisés.

Le projet n'impose donc ni un monde intégralement pré-rendu, ni une représentation intégralement 3D des personnages. Le socle spatial reste 3D ; le choix 2D, 3D ou composité se fait par couche selon la lisibilité, le style, le coût de production et les besoins du gameplay. Les anciens travaux sur le pré-rendu restent exploitables comme techniques de composition, de texture, de profondeur, d'impostor ou de cinématique.

1. Vision du jeu

Cité du Tournoi est un RPG narratif au combat en « tour par tour dynamique » centré sur un grand tournoi évolutif organisé dans une cité-fantasy monumentale. Le joueur commence comme combattant individuel dans des duels 1 contre 1, puis rencontre et recrute progressivement d’autres combattants jusqu’à l’apparition de formats d’équipe plus avancés. Entre les matchs, il utilise un temps limité pour progresser, explorer la ville, résoudre des problèmes, développer ses relations, contrer des sabotages et exploiter des opportunités.

La ville n'est pas un simple hub. Elle constitue le second système principal du jeu, au même niveau que le combat.

Le joueur doit ressentir simultanément :

la grandeur d'un événement populaire qui mobilise toute la ville ;

le charme et la curiosité d'une cité fantasy stylisée ;

la pression d'un calendrier compétitif ;

la liberté de choisir comment préparer le prochain match ;

la conséquence durable de ses choix ;

l'impression que les autres équipes et factions agissent même hors écran.

2. Promesse joueur

Entrer seul dans un grand tournoi, se faire un nom dans une ville qui vit, fête, complote et se transforme autour de la compétition, puis construire progressivement une équipe capable d’affronter les phases les plus exigeantes jusqu’à la finale.

Cette promesse doit être visible dans la première heure de jeu et rester vraie jusqu'à la fin.

3. Piliers de conception

3.1 Tournoi vivant

Le tournoi n'est pas une suite isolée de combats. Il influence :

la fréquentation de la ville ;

les prix et les stocks ;

les dialogues ;

les rivalités ;

les paris ;

les sponsors ;

les quêtes ;

les agressions et sabotages ;

l'état émotionnel des habitants ;

la sécurité de certains quartiers.

Les adversaires existent entre les matchs et poursuivent leurs propres objectifs.

3.2 Préparation sous contrainte temporelle

Le joueur ne peut pas tout faire. Le temps est une ressource stratégique.

Chaque journée comporte par défaut trois grands créneaux de décision :

matin ;

après-midi ;

soirée/nuit.

Certaines actions peuvent consommer un créneau, plusieurs créneaux ou être gratuites lorsqu'elles relèvent de la navigation courte, de la consultation ou du dialogue mineur.

3.3 Ville dynamique et causale

La ville change à cause :

du calendrier du tournoi ;

des résultats des équipes ;

des décisions du joueur ;

des actions des factions ;

des événements non résolus ;

des pénuries ;

de la réputation ;

des actes de sabotage ;

des différences jour/nuit.

Les changements majeurs doivent avoir une cause identifiable. L'aléatoire ne doit jamais remplacer la causalité.

3.4 Conséquences plutôt que scripts arbitraires

Une situation peut émerger d'un ensemble de conditions au lieu d'être imposée à une date fixe.

Exemple :

joueur favori + faction hostile + sécurité faible + équipement stocké à l'auberge → tentative de vol possible

Le joueur doit pouvoir observer des signes, se préparer, réduire le risque, enquêter ou trouver une alternative après l'échec.

3.5 Festival et challenge

La compétition doit avoir l'énergie d'un grand festival urbain : foule, annonces, rivalités publiques, commerçants opportunistes, paris, musique, couleurs, défis et spectacles.

Le tournoi doit être ressenti dans la ville même lorsque le joueur n'est pas dans le Colisée.

4. Structure de campagne — baseline V1

La baseline de production est une campagne principale de 10 journées.

Cette valeur est un verrou de planification V1 : elle peut évoluer après playtest, mais les systèmes doivent être conçus autour d'une campagne courte, dense et rejouable plutôt qu'autour d'un calendrier infini.

Structure de référence

Jour

Fonction dominante

1

arrivée, inscription, découverte de la ville, constitution initiale

2

premier match et premières rivalités

3

préparation libre, premières conséquences globales

4

deuxième match et tensions entre factions

5

fin de phase initiale / première grande sélection

6

phase éliminatoire, sabotage davantage ciblé

7

préparation libre, enquête, recrutement, récupération

8

match majeur / crise urbaine

9

préparation finale, choix coûteux et conséquences accumulées

10

finale et résolution des principaux arcs

Le calendrier est une structure narrative ; le contenu précis doit rester en partie systémique.

5. Tournoi — baseline V1

5.1 Progression de format

La structure canonique du tournoi est progressive :

phase individuelle — duels 1v1, découverte des rivaux et apprentissage du système ;

phase de transition — épreuves spéciales, opportunités de recrutement, alliances et formats expérimentaux si utiles ;

phase d’équipe — combats collectifs, composition de roster, synergies et gestion des blessures/remplaçants.

Le passage du duel individuel au combat d’équipe constitue une montée en puissance ludique et narrative. Il ne doit pas être disponible comme format standard dès le début.

Le nombre exact de participants, la structure du bracket et le format final des équipes sont définis par TOURNAMENT_MASTER_CONTRACT.md et validés par playtest. Le projet ne doit plus supposer par défaut un bracket de 12 équipes ou un 3v3 immédiat.

5.2 Recrutement

Le joueur ne commence pas avec une équipe complète. Il rencontre progressivement des combattants pouvant devenir alliés, recrues, rivaux convertis, spécialistes temporaires ou remplaçants. Le recrutement doit être relié à des relations, des quêtes, des résultats de tournoi ou des événements de ville.

5.3 Vie des concurrents

Chaque rival, puis chaque équipe constituée, doit disposer d’un état persistant comprenant identité, style de combat, niveau de préparation, réputation, relations, ressources, objectifs secondaires et état physique.

Ils peuvent s’entraîner, acheter, se soigner, espionner, négocier, résoudre des quêtes, saboter, être blessés, être sanctionnés, abandonner, être éliminés, rejoindre ou quitter une équipe lorsque les règles de la phase l’autorisent.

6. Combat

6.1 Forme générale

Le combat est un « tour par tour dynamique » dont le format de départ est 1 contre 1 : le temps ne s'arrête pas ; le joueur agit par trois commandes, la garde, l'esquive et l'attaque, l'attaque chargée en la tenant, par paliers, de l'attaque légère à l'attaque puissante puis aux compétences, les compétences payées en points d'action et réglées par leur niveau ; l'adversaire a la priorité quand il attaque, et le joueur se défend alors par la garde ou l'esquive (spécification : briefs/combat-system.md).

La première priorité de production est de rendre le duel lisible, tactique, rapide à comprendre, suffisamment profond pour valoriser la préparation et spectaculaire sans perdre la lecture des décisions.

Le moteur de combat doit cependant être conçu dès le départ pour supporter plusieurs combattants afin d’introduire plus tard les formats d’équipe sans réécriture fondamentale.

6.2 Progression vers l’équipe

Lorsque le tournoi atteint ses phases avancées, le combat peut ajouter composition d’équipe, synergies, ciblage multiple, protection d’alliés, effets de zone, remplacements et gestion du roster.

Le format exact d’équipe reste une décision de design à valider ; 3v3 est une possibilité, pas un verrou initial.

6.3 Préparation et combat doivent être reliés

Les activités urbaines doivent pouvoir modifier les paramètres du prochain combat : connaissance d’une compétence adverse, entraînement, équipement, soin, objet rare, moral, avantage tactique ou accès à une nouvelle recrue lorsque les formats d’équipe deviennent disponibles.

Une activité ne doit pas exister uniquement pour remplir le temps.

7. Progression

La progression repose sur plusieurs couches :

compétences ;

équipement ;

armes ;

relations ;

connaissance des adversaires ;

réputation ;

accès à des services ;

recrutement ;

quêtes et objets uniques.

Le jeu doit éviter qu'une unique statistique de niveau rende toutes les autres décisions secondaires.

8. Ville et temporalité

8.1 Règle fondamentale jour / nuit

Le cycle jour/nuit n'est pas cosmétique.

Il modifie :

densité de foule ;

services disponibles ;

PNJ présents ;

activités ;

sécurité ;

ambiance ;

musique ;

opportunités ;

risques ;

événements ;

routes sociales.

Principe de contraste

Jour : tournoi comme spectacle public.
Nuit : tournoi comme réseau social, économique et clandestin.

Tous les quartiers ne doivent pas suivre le même rythme. Certains culminent le jour ; d'autres prennent vie la nuit.

8.2 Colisée comme landmark

Le Colisée est le centre symbolique et géographique de la ville.

Il doit être visible, audible ou suggéré depuis plusieurs quartiers à travers :

silhouettes ;

tours ;

bannières ;

clameurs ;

annonces ;

flux de foule ;

lumière nocturne.

9. Événements et simulation

9.1 Types d'événements

globaux : touchent la ville ou plusieurs équipes ;

de quartier : modifient un service ou une ambiance locale ;

de faction : résultent d'un conflit ou d'une alliance ;

de tournoi : liés à la compétition ;

ciblés : visent progressivement le joueur lorsqu'il devient une menace ;

personnels : concernent un membre de l'équipe ou un PNJ important.

9.2 Escalade

Au début du tournoi, les perturbations sont souvent globales : pénurie, vandalisme, conflit, changement de sécurité.

À mesure que le joueur progresse, les attaques peuvent devenir ciblées :

espionnage ;

intimidation ;

vol ;

tentative de blessure ;

désinformation ;

pression sur un commerçant ;

sabotage d'entraînement.

9.3 Règle anti-frustration

Aucun sabotage majeur ne doit être une punition arbitraire sans lecture ni réponse.

Chaque événement important doit offrir au moins une combinaison des éléments suivants :

signe précurseur ;

prévention ;

mitigation ;

enquête ;

compensation ;

voie alternative ;

conséquence intéressante en cas d'échec.

10. Direction technique

10.1 Stack

Vite

TypeScript

Three.js

HTML/CSS pour UI lorsque plus adapté que WebGL

Blender pour modélisation, UV, animation, baking et export

glTF/GLB comme format 3D principal

10.2 Séparation simulation / rendu

La simulation doit fonctionner sans Three.js.

Exigence : une journée, un événement ou un match hors écran doit pouvoir être résolu dans un environnement de test headless.

const nextState = simulation.advance(currentState, action, rng);

Three.js affiche l'état ; il n'en est pas l'autorité logique.

10.3 Déterminisme

RNG seedé pour les simulations importantes ;

tests reproductibles ;

sauvegardes versionnées ;

migrations de sauvegarde prévues ;

hooks de test permettant de charger des états nommés.

10.4 Architecture conceptuelle

src/
├── core/
├── simulation/
├── tournament/
├── combat/
├── events/
├── narrative/
├── world/
├── rendering/
├── ui/
├── audio/
└── tools/

Les frontières doivent rester petites, explicites et testables.

11. Production par mini-agents

11.1 Principe

L'autonomie ne signifie jamais « améliorer librement le jeu ». Elle suit une chaîne bornée :

état connu → tâche bornée → contrat → production → tests → review → commit → état mis à jour

11.2 Gouvernance minimale

Les mini-agents devront être spécialisés, par exemple :

Project Director ;

Game Systems Agent ;

Tournament Agent ;

City Simulation Agent ;

Blender Environment Agent ;

Technical Art Agent ;

Character Agent ;

Combat Agent ;

Narrative/Content Agent ;

QA Agent.

Un agent ne doit pas modifier un domaine hors périmètre sans tâche explicite.

11.3 Contrats de tâche

Chaque tâche autonome doit déclarer :

objectif ;

entrées ;

fichiers autorisés ;

éléments interdits ;

outputs ;

critères d'acceptation ;

tests ;

risques ;

définition de terminé.

12. Pipeline d'assets

12.1 Source d'autorité

Blender est la source principale des assets 3D de la ville et des environnements.

Les outils IA peuvent assister :

concept art ;

variantes de silhouettes ;

références de texture ;

idéation ;

paint-over ;

animations ou cinématiques ciblées.

Ils ne doivent pas imposer le style ni introduire des assets non traçables dans le runtime.

12.2 Manifeste

Tout asset externe ou généré doit disposer de provenance, licence/conditions, rôle et version.

13. Cinématiques

Le projet peut mélanger :

cinématiques in-engine Three.js ;

animation de caméra sur scènes Blender exportées ;

illustrations animées ;

vidéos générées/produites pour quelques scènes fixes majeures.

Les scènes dépendantes de l'état du monde doivent rester autant que possible in-engine.

14. Vertical slice obligatoire

Avant production complète, construire un prototype de 3 jours, 9 créneaux et 2 combats officiels démontrant :

au moins 3 quartiers ;

au moins 2 duels 1v1 officiels ;

au moins 1 futur recrutable rencontré ou introduit ;

cycle jour/nuit visible et fonctionnel ;

plusieurs rivaux persistants minimum ;

combat 1v1 complet et extensible vers l’équipe ;

boutique affectée par une conséquence ;

au moins 12 événements dynamiques configurables ;

une chaîne de sabotage contrable ;

une quête qui influence un futur combat ;

sauvegarde/chargement ;

simulation headless ;

tests déterministes ;

navigation et streaming/changement de quartier ;

captures desktop et mobile ;

budget technique mesuré.

Aucune extension vers la ville complète n'est autorisée tant que cette tranche n'est pas convaincante.

15. Non-objectifs V1

monde ouvert immense sans structure ;

génération runtime de la ville ;

photoréalisme ;

simulation de milliers de PNJ individuels ;

multijoueur ;

caméra libre sans intention artistique ;

destruction physique généralisée ;

système procédural incontrôlé remplaçant le contenu auteurisé.

16. Definition of Done globale

Une fonctionnalité n'est terminée que si :

elle respecte les contrats applicables ;

elle est déclenchable dans le jeu réel ;

elle possède des tests adaptés ;

elle n'introduit pas d'erreurs runtime ;

elle respecte le budget de performance ;

elle a une preuve visuelle lorsque nécessaire ;

son impact sur la simulation est reproductible ;

la documentation/état du projet est mise à jour.

17. Contrats à créer ensuite

Ce document est complété en priorité par :

ART_MASTER_CONTRACT.md

CITY_MASTER_CONTRACT.md

Puis, lors de la mise en production :

GAMEPLAY_MASTER_CONTRACT.md

COMBAT_MASTER_CONTRACT.md

TOURNAMENT_MASTER_CONTRACT.md

AUTONOMY_MASTER_CONTRACT.md

QA_MASTER_CONTRACT.md

ASSET_PIPELINE_CONTRACT.md

NARRATIVE_MASTER_CONTRACT.md

Fin — PROJECT MASTER CONTRACT v1.1
