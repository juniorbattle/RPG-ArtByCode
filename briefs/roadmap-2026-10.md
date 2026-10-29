# Feuille de route après la tranche jouable (20/10/2026)

Plan consolidé de l'opérateur, versionné en Passe FR1 du journal. Il ordonne les tâches qui suivent la tranche jouable ; chaque tâche part dans
sa propre séance (règle de l'opérateur du 20/10 : « a partir de maintenant chaque nouvelle tache sera lance sur une nouvelle session ») et suit
`AGENTS.md` (une branche à la fois, journal, preuves, art approuvé par l'opérateur).

## La demande, mot pour mot

L'opérateur :

> Excellent, On va maintenant travailler quelques points :
> - Les sprites personnages en combat arene, que ce soit les combattants ainsi que les personnages dans les gradins,
> - Puis UI/HUD car ce n'est vraiment pas optimale, mais on commencera par fait un audit et des passes visuels via des images references generes pour valider la ligne directrice, pour bien implementer.
> - puis enfin finaliser les environnement restants, donc nos districts on a 4 district, commercants, place principale pour acceder a l'arene, place festif, zone d'entrainement, Avec une volonte de respecter nos structure etabli dans district merchant mais en y ajout plus de profondeur, surtout pour la place principal et training, je veux que les zones est plus d'espaces et non un long couloir comme district merchant, mais je veux que tu finalises l'autre district en cours qui semblait bien avance puis nous verrons le resultat finale
> - puis une fois que tout cela sera bon on peuplera aussi les pnjs mais aussi les combattants et autres
> - Enfin nous commencerons a reelement integrer notre gameplay avec les events dynamiques et mise en structure narrative avec eventuellement des custcenes runtime
> On ne lance rien encore mais consolide le plan

Puis : « Le district en cours, c'est le parvis de l'arène (la place principale) : c'est lui à finaliser en premier. »

## La séance cloud « Version 2 » (Passe AV1, 26/10)

La fiche du mandat (19 choix de l'opérateur) lance une séance cloud autonome, sans outil externe : la commande à trois touches et l'attaque chargée (A3, AV-5), C3 à C5, les compétences, l'équipement (arme, armure, deux accessoires), marchander, défier, voler, les trois districts, la narration et les cinématiques, les événements, le son par le code, l'interface P4-P6. Tout derrière le drapeau `flags.v2`, le défaut inchangé jusqu'à l'essai de l'opérateur. Le brief : `briefs/cloud-session-v2-brief.md`. Marek est en pause jusqu'à la nouvelle commande (AV-10).

- **V0 fait (Passe V0, 26/10)** : le drapeau `flags.v2` et les textes du jeu en tables (`src/narrative/text/`), le jeu par défaut inchangé à l'octet.
- **V1 fait (Passe V1, 26/10)** : la commande à trois touches et l'attaque chargée par paliers (A3, AV-5 à AV-8 ; `combat-system.md` § 4b et le
  contrat projet § 6.1 amendés), C3 (garde, esquive et compétences des rivaux), l'équilibrage « modéré » proposé, le bot et la course recalés ;
  `?scene=arena&v2=1`, `&input=keys` pour l'ancien schéma. Les poses de charge à cuire : § 14 de la spécification.
- **V2 à V9 faits (Passes V2 à V9, 26/10)** : douze compétences (achat, entraînement, défi), l'équipement (arme à paliers, armure, deux
  accessoires) et quatre boutiques, marchander / défier / voler, trois places ouvertes (le parvis, le terrain d'entraînement, la place festive à la
  place de Lantern Row), les dix jours du tournoi et cinq cinématiques, quatorze événements nouveaux, le son par le code, P4 à P6.
- **V10 (Passe V10, 26/10)** : le guide `briefs/v2-trial.md` et la fiche `briefs/fiche-v2.html` pour l'essai de l'opérateur. Après lui, en local :
  mesures GPU, revue visuelle des places, écoute du son, poses de charge, personnages à cuire, puis la décision du passage au défaut.

## Règles de fonctionnement

- **Une branche de travail à la fois** : les tâches qui touchent au code passent l'une après l'autre. Les audits et la génération d'images de
  référence peuvent se faire en parallèle, puisqu'ils n'ouvrent pas de branche.
- **Images générées** : par `tools/art-lab/gen-image.mjs` seulement, plafond 5 $ par tâche, non canoniques tant que l'opérateur ne les approuve pas.
- **Une fiche d'arbitrages à la fin de chaque étape** : rien ne change par défaut sans la décision de l'opérateur.
- **Budget de performance** (E24) : « Pas plus cher que la nuit B, à définition égale », avec la réserve de l'opérateur, « Mais rien n'est confirme
  car il y a peut etre des zones plus grande et dense ».
- **Le cloud** n'a ni la clé d'images, ni Aseprite, ni le GPU de l'opérateur : il passe par le relais local (`briefs/local-requests/`).

## Déjà engagé (tâches à part de la Passe D8)

- L7-6a, le jour comme défaut d'« Explore the district » : fait (Passe D9).
- **L7-2, les états du jour de l'arène** (duel et parvis, par `DayState`) : la première tâche à lancer. Les sprites de l'arène se jugeront ensuite de
  jour comme de nuit.
- L7-4, l'équilibrage vers « modéré » : petite tâche indépendante, à placer quand l'opérateur veut.
- E14 / E15, l'amendement du contrat projet (la génération par le code) : avec l'opérateur.

## Étape 0. Avant les combattants

- **L'atelier « système de combat »** (E1 / E16, mené par l'opérateur : « Nous devons faire une tache entiere concernant le systeme de combat et la
  logique car c'est quelque chose de nouveau que seul moi a l'entiere comprehension »). Il fixe la liste des animations (attaques, garde, esquive,
  coups reçus, K.O., charge). Sans lui, les sprites de l'étape 1 se limitent au jeu d'images actuel de l'arène.
- **Fait (Passe CB1, 25/10)** : la spécification `briefs/combat-system.md`, approuvée par l'opérateur (« tour par tour dynamique » ; contrats
  amendés, A3). Sa mise en œuvre, dans l'ordre choisi (§ 15) : C1 le cœur du duel (simulation pure), C2 l'arène qui le montre puis l'essai de
  l'opérateur, C3 les adversaires (avec l'équilibrage L7-4), C4 le choix des compétences, C5 l'arme et les accessoires ; les nouvelles règles
  derrière un paramètre jusqu'à l'essai (CB-10). Chaque lot est une tâche à part.
- **C1 fait (Passe C1, 25/10)** : le cœur du duel en simulation pure, `src/combat/dynamic.ts` (jauge et break, garde sans bris, priorité de
  l'adversaire et « repoussé », préparation automatique, PA, quatre emplacements, K.O. seul, pauses par niveau, duels de 5 à 9 minutes), son bot
  et sa résolution hors écran ; derrière son paramètre (`flags.combat = 'dynamic'`, `tools/tournament-lab.mjs --rules=dynamic`), l'arène
  d'aujourd'hui inchangée.
- **C2 fait (Passe C2, 25/10)** : l'arène montre le nouveau duel derrière `?scene=arena&combat=dynamic` (et le mode jouable avec
  `&combat=dynamic`), avec son HUD bâti sur le système de design (les deux jauges, la barre de break, les PA, les quatre compétences et leur coût,
  la priorité de l'adversaire), les clips d'aujourd'hui sur les nouveaux moments et les réglages de l'essai dans l'adresse (`dyn=`) ; le défaut
  inchangé ; l'interface UI3 vérifiée sur tout le parcours de l'arène. **Suite : l'essai de l'opérateur** (guide `briefs/combat-trial-c2.md`,
  fiche d'arbitrages de la Passe C2), puis C3.
- **Essai C2 consigné (Passe C2F, 26/10)** : 16 choix sur 16 à la recommandation : le défaut « Pas encore : après C3 et un second essai », les
  nombres d'aujourd'hui tenus, l'esquive « En arrière », Rempart et Ferveur « Les garder », le HUD « Approuvé » (`briefs/combat-system.md` § 17).

## Étape 1. Les sprites de l'arène

1. **Audit** : ce que génère `src/arena/FighterArt.ts` (Ren, Marek, Vessa), les images que l'arène attend, la taille d'un texel à l'écran dans son
   cadrage, les gradins tels qu'ils sont.
2. **Les combattants**, par la chaîne du héros : planches générées, reconstruction, rig, Aseprite, manifeste, critique à l'aveugle, approbation de
   l'opérateur ; une feuille cuite remplace un combattant généré par les mêmes clés d'images. **La liste des animations est fixée**
   (`briefs/combat-system.md` § 14, CB-2 « Approuvée pour Ren, puis Marek et Vessa ») : 13 clés, **34 images** pour Ren = `hero-x2-v4` (`idle` 2,
   `ready` 2, `strike` 3, `heavy` 4, `skillOff` 4, `skillDef` 3, `skillSup` 3, `block` 2, `dodge` 2, `hit` 2, `recover` 2, `ko` 3, `victory` 2),
   une animation par famille de compétences, des compétences signature plus tard ; Marek de 24 à 34 images selon sa défense et ses familles ;
   Vessa comme Ren. Les feuilles attendent C1-C2 (les durées) et l'essai de densité ×2 / ×4 (AA1-3).
   **Essai de densité fait (Passe AA2, 25/10)** : le héros cuit dans le cadrage du duel à ×2, ×3 et ×4 (serveur DEV, `?scene=arena&fighterdensity=`) ;
   décision AA2-1 « ×3 » : les feuilles de combat se font **à ×3** (cases de 192 × 288 texels, 2,3 px par texel en 1080p comme le héros dans les
   cadrages proches de la ville, un duel complet dans une seule texture cuite ; même coût GPU que ×2 et ×4).
   **Première feuille de Ren (Passe RC1, 25/10)** : `hero-x3-combat` (labo), les 22 images des clés que l'essai C2 ne touche pas (« Clés hors C2
   (Recommandé) »), tirées de trois planches générées (« Génération (Recommandé) ») et reconstruites à ×3 sur la palette de `hero-x2-v4` ; dans le
   duel derrière `?scene=arena&fighterdensity=combat` (DEV) ; 2,34 px par texel en 1080p, même coût GPU. Restent les 12 images (`dodge`, `skillOff`,
   `skillDef`, `skillSup`) après la fiche C2.
   La fiche RC1, tout à la recommandation : « Bonne base : compléter après la fiche C2, avec les reprises » (la victoire de profil, une vraie taille
   pour la coupe, la lame à deux texels), « Liseré peint la nuit, contour noir de jour », « Pas encore : en labo jusqu'à la feuille complète »,
   « Les retirer, garder fighterdensity=combat » (les feuilles d'essai retirées).
   **La feuille de Ren complète (Passe RC2, 26/10)** : les **34 images** de la liste CB-2, dont les 12 débloquées par la fiche C2 (`dodge` en
   arrière, `skillOff`, `skillDef` Rempart, `skillSup` Ferveur), avec les reprises de RC1-1 (la victoire de profil, une taille pour la coupe, toutes
   les lames à deux texels) ; sept planches générées de plus (1,75 $) ; le duel joue ses propres images sur chaque moment, sans emprunt ; le bord
   est une règle du rendu (« Règle du rendu (Recommandé) »). Toujours en labo derrière `?scene=arena&fighterdensity=combat` (DEV).
   La fiche RC2, tout à la recommandation : « Complète : la garder en labo comme base », la coupe « La garder ; reprise dédiée plus tard », la lame
   « Deux texels d'acier et un bord sombre (comme fait) », le bord « Confirmé », la production « Pas encore : avec la feuille de Marek ».
   **Passe RC3** : un Marek généré hors des planches de référence, arrêté par l'opérateur (« Arrêter Marek, finir la coupe de Ren (Recommandé) ») ;
   la coupe de Ren reprise puis écartée (« Revenir à l'ancienne ») : la feuille reste celle de RC2. **Suite** : les feuilles des rivaux d'après les
   planches de référence (V2-18 : Orla, Vessa, Marek, Ilse, Cassius ; Marek avec la nouvelle commande et les poses de charge, AV-10) ; puis les
   feuilles vers la production, celle de Ren avec celle de Marek (RC2-5).
3. **Les spectateurs** : une foule bon marché (quelques silhouettes, variantes de couleurs par les masques de la Passe V1, une boucle d'acclamation,
   un seul appel de dessin) plutôt qu'un personnage complet par spectateur.

## Étape 2. L'interface (UI et HUD)

1. **Audit** des écrans (titre, panneau de la ville, dialogues et portraits, carte, HUD de l'arène, fiche de match, sauvegarde), sur ordinateur et
   sur téléphone, défauts relevés avec captures.
2. **La ligne directrice** : deux ou trois directions en images de référence générées, sur une fiche d'arbitrages ; l'opérateur choisit.
3. **Un petit système de design** (polices, cadres, couleurs, accord avec le jour et la nuit), puis la mise en œuvre écran par écran, chaque fois
   avec des captures avant / après.

## Étape 3. Les districts

Quatre districts : le marché (Merchant District, complet et figé), la place principale qui mène à l'arène (le parvis), la place festive, la zone
d'entraînement.

1. **Le parvis d'abord**, puis la revue de l'opérateur avant de continuer.
2. **Le principe** : les générateurs et la structure du Merchant District (composition, bake de visibilité, cadrages, occlusion), mais des places
   ouvertes plutôt qu'un couloir, surtout le parvis et l'entraînement. Cela demande une zone praticable en surface au lieu de la bande du quai, un
   graphe de cadrages pensé pour un espace ouvert, et des poses de bake sur toute la surface.
3. **Ensuite** la zone d'entraînement, puis la place festive. Lantern Row (`src/world/LanternRow.ts`) reste la maquette décidée (L7-3), à reprendre
   ou à remplacer au moment de la place festive.

## Étape 4. Le peuplement

- Les rôles des PNJ par district, les rivaux (les sept persistants et Orla, la recrue), les spectateurs, la densité selon l'état du jour.
- Les trois-quarts des PNJ (RH4) se placent ici.
- **La place dans la texture des sprites** : elle garantit 672 images, dont environ 380 prises ; un vrai peuplement demande un plan de capacité
  avant de produire.

## Étape 5. Le gameplay

- Les événements dynamiques (`src/events/`) et les phases du tournoi selon les contrats (`contracts/`).
- La structure narrative et des cinématiques jouées en direct (plans de caméra scriptés, dialogues, animations des sprites).
- L'intégration du système de combat de l'étape 0.

## Questions ouvertes pour l'opérateur

- La ligne directrice de l'interface (étape 2) et la forme du parvis une fois montré (étape 3).

## Tranché (fiche de l'audit de l'arène, Passe AA1, 24/10)

- Le calendrier de l'atelier combat : « Atelier avant les feuilles ; densité et public en attendant » (AA1-5).
- Ren : « Oui : Ren = hero-x2-v4, feuille de combat à produire » (AA1-1) ; « Feuilles cuites (Ren, puis Marek, puis Vessa) » (AA1-2) ;
  densité : « Essai en scène ×2 contre ×4 d'abord » (AA1-3) ; les générés : « Non, attendre les feuilles » (AA1-6).
- Les spectateurs : « Les citadins cuits de la ville + variantes V1 » (AA1-4).
- L'étape 1 devient donc : l'atelier combat (étape 0), et en attendant l'essai de densité et le public, chacun dans sa séance et derrière un
  paramètre ; puis les feuilles de combat de Ren, Marek et Vessa.

## Tranché (fiche de l'essai de densité, Passe AA2, 25/10)

- La densité des feuilles de combat : « ×3 » (AA2-1).
- Le bord d'un combattant cuit la nuit : « Trancher sur la première feuille de Ren » (AA2-2).
- Les feuilles d'essai (`hero-x3-trial`, `hero-x4-trial`) et `?fighterdensity=` : « Les garder jusqu'à la feuille de Ren » (AA2-3).

## Tranché (fiche de la feuille complète de Ren, Passe RC2, 26/10)

- La feuille : « Complète : la garder en labo comme base » (RC2-1) ; la coupe : « La garder ; reprise dédiée plus tard » (RC2-2).
- La lame : « Deux texels d'acier et un bord sombre (comme fait) » (RC2-3) ; le bord, une règle du rendu : « Confirmé » (RC2-4).
- La production : « Pas encore : avec la feuille de Marek » (RC2-5).

## Tranché (fiche de la feuille de combat de Ren, Passe RC1, 25/10)

- La feuille : « Bonne base : compléter après la fiche C2, avec les reprises » (RC1-1) ; le bord : « Liseré peint la nuit, contour noir de jour » (RC1-2).
- La production : « Pas encore : en labo jusqu'à la feuille complète » (RC1-3) ; les feuilles d'essai : « Les retirer, garder fighterdensity=combat » (RC1-4).

## Tranché (fiche de l'atelier combat, Passe CB1, 25/10)

- La spécification : « Approuvée » (CB-1) ; la liste des animations : « Approuvée pour Ren, puis Marek et Vessa » (CB-2).
- Les contrats : « Amender maintenant, ces trois phrases » (CB-8, décision A3) ; le contrat de combat : « Plus tard, après l'essai » (CB-9).
- La suite : « Derrière un paramètre, défaut après mon essai » (CB-10) ; L7-4 « Intégré à C1 / C3 » (CB-11).
- Le reste des choix (CB-3 à CB-7) est dans la spécification, § 16.
