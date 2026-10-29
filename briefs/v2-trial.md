# L'essai de la version 2 (séance cloud « Version 2 », lot V10)

La version 2 rassemble tout ce que la séance cloud « Version 2 » a construit derrière un seul drapeau de partie, `flags.v2` (décision AV-2) :
la commande à trois touches et l'attaque chargée (A3 / AV-5 à AV-8), les compétences, l'équipement et les boutiques, marchander / défier /
voler, les trois places (le parvis, le terrain d'entraînement, la place festive), les dix jours du tournoi et leurs cinématiques, les
événements, le son, et les écrans P4 à P6. Sans le drapeau, le jeu reste celui d'aujourd'hui. Tout ce qui suit est « proposé » : la fiche
d'arbitrages `briefs/fiche-v2.html` recueille vos choix.

## L'adresse

- Une nouvelle partie de la version 2 : `http://127.0.0.1:5173/?play=1&new=1&v2=1&name=<votre nom>` (sur `npm run dev`). La sauvegarde garde le
  drapeau : « Continue » de l'écran titre reprend la partie.
- Le duel seul : `?scene=arena&v2=1` (Ren contre Marek) ; l'ancien schéma de touches sur le même duel : `?scene=arena&v2=1&input=keys`.
- En DEV, les états nommés de la version 2 (`&state=`) : `v2-day1-morning`, `v2-forecourt-morning`, `v2-training-morning`, `v2-square-afternoon`,
  `v2-square-night`, `v2-day2-afternoon`, `v2-training-dusk`.
- Les cinématiques se jouent d'elles-mêmes dans un navigateur ordinaire ; un navigateur piloté par un outil ne les joue qu'avec `&cutscene=1`.

## Les touches

| Où | Touche | Effet |
|---|---|---|
| Places | flèches ou W A S D | marcher (Maj : courir) |
| Partout en ville | E / Espace | parler à la personne à côté |
| | M, J, T, Échap | carte, journal, tournoi, menu |
| | K | les compétences (niveaux, les quatre emportées) |
| | G | l'équipement (arme et palier, armure, deux accessoires, le sac) |
| | V / N | le son (volume, musique) / le couper |
| Duel | J (ou 1) tenue | l'attaque : une pression = légère ; tenue = la puissante à 2 s, puis les compétences palier après palier ; relâcher lance le palier atteint |
| | K (ou B) tenue | la garde |
| | L (ou A) | l'esquive |
| | R, Espace, H, N | recommencer, pause, HUD, son |
| Manette | X / B / A | attaque / garde / esquive |
| Cinématique | E / Entrée, Échap | réplique suivante, passer |

## Un parcours conseillé (une heure environ)

1. **Jour 1, matin** : nouvelle partie ; marchez vers le bout est du quai, passé la barrière des gardes (Passe VP5 : on va désormais d'un lieu à
   l'autre à pied, par les rues et les portes, comme dans Final Fantasy IX ; une étiquette nomme chaque sortie quand on approche ; la carte M
   reste un raccourci) → le parvis : la cinématique d'arrivée (Odo, Marek). Parlez à Hilde (armures),
   inscrivez-vous chez Odo. Regardez la place ouverte : on y marche en surface, la caméra suit et se tourne vers la personne à qui l'on parle.
2. **Jour 1, après-midi** : par la rue de l'est du parvis, sous la porte au heaume, le terrain d'entraînement : Corvin (compétences à acheter), le sergent Brann, Orla et Ilse (défis). Défiez Ilse
   (« Enter the sand ») : un duel à mi-vie qui apprend Riposte Stance.
3. **Jour 1, soir** : par la rue de l'ouest du parvis (la porte à la trompette), la place festive : Pip (accessoires, de l'après-midi au soir), Lio, Cassius la nuit, Wren le barde. Essayez de marchander, et
   un vol (plus facile la nuit : pris, la réputation, une amende, la porte fermée pour la journée, les prix en hausse le lendemain).
4. **Jour 2, après-midi** : la fiche de match (l'adversaire, ce qu'on sait de ses compétences, l'équipement), le choix des quatre, puis le duel
   contre Vessa : la charge, les paliers, la garde et l'esquive de l'adversaire, ses compétences annoncées par une alerte. Au retour : la
   victoire ou la défaite en grand (P6).
5. **Jours 3 à 5** : la poule (jours 2, 4, 5), la coupe le soir du jour 5 (les quatre meilleurs en demi-finale), la cinématique de la coupe sur
   le parvis.
6. **Jours 6 à 10** : demi-finales ou combats de la Porte, le jour 7 Orla (si vous vous êtes entraînés avec elle), le match majeur du jour 8,
   la veille de la finale sur la place festive, la finale du jour 10 et l'écran de fin.

## Ce qu'il faut regarder

- **La charge** : les 2 s de la puissante, les temps des compétences (2,7 à 9 s selon le niveau) ; rien ne coupe une charge depuis votre choix
  V2-2 « Rien ne la coupe » (Passe V2C1 : ni un coup reçu, ni l'esquive, ni le break ; relâchée pendant la séquence adverse ou un étourdissement,
  elle attend et part dès que Ren peut agir ; seul le K.O. la finit) ; l'ancien schéma pour comparer (`&input=keys`).
- **L'équilibrage, plus rude depuis la Passe VP4** : les coups des rivaux 30 % plus forts (« proposé ») ; au TournamentLab un joueur préparé
  de compétence moyenne gagnait 60 % de ses combats (85 % avant) et n'était plus couronné. **Depuis V2-2 (Passe V2C1)**, la charge que rien ne coupe
  le rend plus facile : le joueur préparé gagne de nouveau 84 % de ses combats et la couronne une partie sur quatre (28 %) ; un réglage vous est
  proposé (Passe V2C1). Tobin le plus facile, Marek le plus dur. Est-ce le bon degré de rudesse ?
- **Les emblèmes du tournoi** (Passe VP3) : épées croisées, duel, laurier, coupe, heaume, trompette, lances, couronne, sur les drapeaux des
  places, du quai et de l'arène d'une partie v2.
- **Les trois places** (reprises en Passe VP6 : les tours de porte et la voie processionnelle du parvis, la terre battue et l'estrade des
  champions de l'entraînement, la scène sous tente, le mât de mai et la piste de danse de la place festive, le cadrage de biais) : leur identité,
  leur taille, le cadrage qui suit le héros, les sprites provisoires (générés) des personnages sans feuille
  cuite ; de jour et de nuit. Refaites dans la langue du Merchant District (Passe VP1 : la façade à arcades du Colisée, les cercles de sable,
  la scène et les étals du marché, la lumière rare, le pavois de jour, la pluie du jour humide) : leur cohérence avec le district est la
  question de cette revue.
- **Les dix jours** : le rythme (cinq combats au moins, des jours libres), la coupe, la finale ; le recrutement d'Orla (la phase d'équipe est un
  écart consigné).
- **Le son** : les effets du duel, les ambiances par lieu et moment, l'air de chaque état du jour.
- **Les écrans** : le dialogue en bas (P4), « Here » réduit aux actions du lieu, repos et attente sous l'état (P5), la fiche de match et la
  victoire (P6), au téléphone aussi.

## Ce qui reste local (sans quoi la version 2 ne peut pas devenir le défaut)

- Les mesures GPU des trois places (budget « Pas plus cher que la nuit B ») ; leur bake de visibilité est fait et prouvé en rendu logiciel
  (Passe VP1 : 20 à 33 % de triangles en moins, l'image identique à `vis=0` sauf des lamelles d'un pixel), à mesurer sur le GPU.
- La revue visuelle des places, des cinématiques et des écrans en rendu matériel.
- Les poses de charge à dessiner (`briefs/combat-system.md` § 14) et la feuille de Marek (AV-10).
- Les personnages à cuire (liste au journal, Passe V5).
- Le contrôle vivant d'`arena-scene-check` en rendu matériel.
