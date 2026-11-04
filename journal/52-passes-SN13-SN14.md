# Journal de bord — archive : passes SN13, SN14 (2026-11-04)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-11-04 (Passe SN19) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe SN13 — Lot S3, fiche d'écoute 1 : la musique des combats et ses couches (2026-11-04)

### Demande
- Lot S3 confié par la séance mère, après SC-OU « Avancer S3 avant S2 » et SC-QUOI « Surtout la musique et ses couches » (Passe SN12). D'abord une écoute qui sépare ce qui ne va pas dans la musique des combats : des variantes rendues par le vrai moteur sur un même duel du bot, puis une fiche. Rien ne change avant ses réponses, et les partitions de `duel`, `rival` et `finale` ne se réécrivent pas sans la demande de l'opérateur (Passe SN9).

### Mesuré — [OK]
- **La règle d'aujourd'hui** (`layerLevels`) : le riff toujours ; la mélodie sort pendant la séquence adverse ; la tension entre sur elle, sur la charge dès le palier lourd, sur un étourdissement, et reste sous 30 % de vie. Un changement attend la barre suivante et dure 0,25 s.
- Sur les trois duels du bot de `render.mjs` (Marek, Vessa, Orla ; 7 à 8,5 min) : l'adversaire lance environ 7 séquences par minute. Leur durée médiane est de 1,1 s contre Marek et Orla, 2,7 s contre Vessa, alors qu'une mesure du duel dure 1,38 s. Le bot charge jusqu'au palier lourd 8 à 9 fois par minute. Résultat : la mélodie change 13 à 15 fois par minute et la tension 15 à 19 fois. La mélodie est absente 17 à 30 % du temps, la tension présente 60 à 67 %. Dans les 90 s des extraits (Marek, de 1:00 à 2:30), il y a 20 changements de la mélodie et 39 de la tension.
- [KO] **Défaut** : quand la cause d'un changement finit avant la barre où il devait se faire (une séquence plus courte qu'une mesure), `Sound.duelEvent` demande deux fois `LayerSet.level` pour la même barre. Le second `setValueAtTime` au même instant s'ajoute au premier, et les deux rampes finissent au même instant. La couche tombe alors à 0 sur la barre, reste muette 0,25 s et revient d'un coup. Prouvé sur le vrai `LayerSet` avec un ton d'essai (`probe-double`) : 0,0381 jusqu'à 1,300 s, 0 de 1,325 à 1,550 s, puis 0,0389 tout de suite. Compté dans le moteur réel, avec un espion sur `level` qui ne change rien au comportement : 10 fois dans les 90 s, et sur les duels entiers 49 (Marek), 27 (Vessa) et 38 (Orla). Pas corrigé : chaque option de la fiche le corrige, la correction partira avec la décision.

### Fait — [OK]
- **`tools/audio/layer-jobs.mjs`** et **`layer-jobs.page.js`** : les tâches de `render.mjs --scripts`. Les variantes vivent côté page, `Sound.ts` n'est pas touché. Une variante remplace seulement la façon dont les couches suivent le duel.
  - A : aujourd'hui, le moteur tel quel.
  - B : toutes les couches tenues.
  - C : la mélodie ne part jamais.
  - D : moins de changements (une cause doit durer une mesure entière, une couche qui a bougé reste quatre mesures).
  - E : l'arc du combat. La tension entre à moitié au premier étourdissement ou quand un combattant passe sous les deux tiers de sa vie, et entière sous 30 %. Elle bouge au début d'une phrase de quatre mesures et ne revient jamais en arrière.
  - F : en plus doux. La mélodie descend à 0,45, la tension reste à 0,35 au repos, et chaque changement dure une mesure.
  - Dans les variantes, une seconde demande pour la même barre remplace la première au lieu de s'y ajouter : plus aucun saut.
  - La fenêtre commence à 1:00 du duel, la boucle reprise là où le jeu en serait (l'enregistrement de reprise). On entend la musique seule, sans les baisses sous les coups, sauf pour la carte qui les concerne. Le rival est pris dans le duel d'Orla, la finale dans celui de Vessa.
- **`tools/audio/layer-clips.mjs`** : les extraits en MP3 à −20,5 LUFS avec un fondu de sortie de 2 s (l'ebur128 de ffmpeg lit −21,0 sur chacun, fondu compris), et un graphique par extrait. Il montre les trois couches au fil du temps, avec dessous les séquences adverses, les charges lourdes et les étourdissements.
- **La fiche** : page privée https://claude.ai/artifact/FEHPDrJ6SQ3zC6XmvPyAtr, source `briefs/fiche-son-couches.html`. Elle publie onze extraits (douze lecteurs) avec leurs graphiques, qui ne sont pas dans le dépôt. Quatre cartes :
  - CQ-MORCEAU, le morceau tenu entier : sans recommandation, c'est le goût de l'opérateur ;
  - CQ-REGLE, A à F : recommandé E ;
  - CQ-BAISSE : recommandé « Juger avec les nouveaux bruitages (S3) » ;
  - CQ-TROIS, le rival et la finale : recommandé « La même règle que le duel ».
  
  `decisions` relu vide à la publication. Vérifiée en local à 1 200 et 390 px avec le squelette du service reproduit : douze lecteurs chargés de 90 s, aucun débordement.

| Extrait (90 s) | Changements mélodie / tension | Coupures nettes | Sonie avant mise à niveau |
|---|---|---|---|
| A · aujourd'hui | 20 / 39 | 10 | −20,5 LUFS (−20,8 avec les baisses) |
| B · tout tenu | 0 / 1 (l'entrée) | 0 | −20,0 |
| C · mélodie toujours | 0 / 39 | 0 | −20,4 |
| D · moins souvent | 6 / 8 | 0 | −20,5 |
| E · l'arc | 0 / 1 (l'étourdissement à 0:45) | 0 | −20,6 |
| F · plus doux | 20 / 39, chacun sur une mesure | 0 | −20,5 |
| Rival aujourd'hui / tenu | 20 / 36 ; 0 / 1 | 3 ; 0 | −20,4 ; −19,9 |
| Finale aujourd'hui / tenue | 22 / 34 ; 0 / 1 | 10 ; 0 | −21,0 ; −20,0 |

### Limites
- **Personne n'a écouté.** Les variantes imitent une règle côté page ; celle qui sera choisie s'écrira dans `src/audio/plan.ts` et `Sound.ts`, puis se prouvera de nouveau.
- Les rendus se reproduisent à −127 dB sous la crête, pas à l'échantillon près : deux rendus de la même tâche diffèrent dès 0,94 s, de 1,9e-7 au plus. Les changements de couches et les graphiques, eux, sont identiques. C'est un arrondi du rendu hors ligne de Chrome, non élucidé.
- La musique est seule : en jeu, les coups couvrent les baisses et une part des changements. La fenêtre se place après l'introduction (gardée, E-INTRO). L'arc n'y change qu'une fois ; son pas sous 30 % de vie n'est dans aucun extrait. Le seuil des deux tiers est une proposition.

### Où reprendre
- Relire `decisions` quand l'opérateur dit la fiche remplie, consigner mot pour mot, n'agir que sur ce qui est décidé. Ensuite :
  - écrire la règle choisie dans `plan.ts` et `Sound.ts`, avec la correction de la double demande, et un test sur `LayerSet` : deux demandes pour une même barre, aucun saut, contrôle négatif sur le code d'aujourd'hui ;
  - passer `engine-proof.mjs` et `analyse.mjs --check` ;
  - préparer la seconde fiche d'écoute du lot S3, avec les instruments du groupe : un son par recette, la fenêtre d'esquive, la foule qui réagit, le K.O. et le ralenti.
  
  Si une partition change, recuire sous manifeste avec l'approbation de l'opérateur mot pour mot. S2 vient après, dans sa propre séance.

### Pensée
- Une règle de couches se mesure à la fréquence de ses changements, rapportée à la mesure du morceau. Une cause plus courte qu'une mesure fait bouger la musique après coup, quand la cause est déjà finie.
- Deux automations Web Audio au même instant ne se remplacent pas, elles s'ajoutent. Un changement qui en remplace un autre en attente annule d'abord ce qui est programmé depuis cet instant (`cancelScheduledValues`).

## Passe SN14 — Lot S3 : la fiche des couches relue, la règle F appliquée (2026-11-04)

### Demande
- L'opérateur, mot pour mot : « Fiche remplie ».

### La fiche
- Page privée https://claude.ai/artifact/FEHPDrJ6SQ3zC6XmvPyAtr, source `briefs/fiche-son-couches.html`. Relue par `list` : 4 documents sur 4, aucune note.

| # | Décision | Choix de l'opérateur |
|---|---|---|
| CQ-MORCEAU | Le morceau lui-même | « Le morceau tient : c’est la façon de suivre le combat » |
| CQ-REGLE | Comment la musique suit le combat | « F · Des niveaux plus doux » |
| CQ-BAISSE | La musique sous les coups | « Juger avec les nouveaux bruitages (S3) » |
| CQ-TROIS | Le rival et la finale suivent le duel | « La même règle que le duel ; les deux morceaux tiennent » |

### Ce que ces choix veulent dire
- **Les partitions restent** : `duel`, `rival` et `finale` tiennent. Ce qui ne convainquait pas, c'est la façon dont leurs couches suivaient le combat (CQ-MORCEAU, CQ-TROIS). Rien n'est recuit.
- **La règle F** garde les moments de la règle d'avant (la séquence adverse, la charge dès le palier lourd, l'étourdissement, la fin de combat sous 30 %), avec des niveaux plus doux :
  - la mélodie descend à 0,45 au lieu de partir ;
  - la tension reste à 0,35 au repos au lieu de se taire, et monte à 1 ;
  - chaque changement part de la barre suivante et dure une mesure entière.
  
  L'opérateur n'a pas pris l'option recommandée, E (l'arc du combat).
- **Les baisses sous les coups ne changent pas** : elles se jugeront avec les nouveaux bruitages, sur la seconde fiche de S3 (CQ-BAISSE).
- **Une seule règle pour les trois combats** (CQ-TROIS) : c'est déjà le cas, `layerLevels` sert les trois.

### Fait — [OK]
- `src/audio/plan.ts` : `MELODY_ASIDE` (0,45) et `TENSION_REST` (0,35), `layerLevels` selon F, les choix de l'opérateur cités à la place de « proposé ».
- `src/audio/Sound.ts` : `duelEvent` fait durer chaque changement de couche une mesure (`l.set.bar`).
- `src/audio/layers.ts` : `LayerSet.level` remplace un changement déjà demandé pour la même barre au lieu de s'y ajouter. Il annule depuis la barre plus 1 ms, puis repose le niveau de départ sur la barre, et rampe seulement si le niveau change. L'annulation part juste après la barre et non sur elle : avec des rampes d'une mesure, la rampe du changement précédent finit exactement sur cette barre et doit rester.
- **Tests** :
  - `tests/v2-sound.test.mjs` : les niveaux de F sur chaque moment, et la rampe d'une mesure dans `duelEvent`.
  - `tests/v2-sound-s1.test.mjs` : un évaluateur des automations selon les règles de Web Audio, écrit indépendamment de `LayerSet`. Il vérifie trois cas : deux demandes pour une même barre laissent la couche tenue ; un remplacement juste après une rampe d'une mesure ne fait aucun pas plus raide que la rampe, et la rampe reste ; un changement simple rampe sur la mesure.
  - Contrôles négatifs : le `level()` de `main` donne un saut de 0,55 ; une annulation posée sur la barre donne un pas de 0,55 contre 0,00046 permis.
- **`engine-proof.mjs`** sur la sortie réelle, contre les fichiers décodés par ffmpeg :
  - les niveaux de F : au calme 1 / 1,00 / 0,35 ; à mi-mesure 0,73 / 0,67 (attendu 0,725 / 0,675) ; une mesure plus tard 0,45 / 1,00 ; de retour au calme 1,00 / 0,35 ;
  - un témoin neuf, `sn-double`, une séquence de 0,2 s finie avant sa barre : mélodie et tension à 1,00 / 0,35 avant la barre, juste après, et une seconde après ;
  - 27 vérifications sur 27.
  
  Contrôle négatif sur `main` figé (`359deb9`, `--root`) : 6 vérifications échouent, dont le témoin. Juste après la barre, la mélodie y est à 0,00 et la tension à 1,00 : le trou que la fiche décrivait.

### Défaut trouvé — [KO → corrigé]
- **La preuve de la Passe SN10 lisait la tension sur une couche muette.** La tension du duel se tait de la troisième à la huitième mesure de sa boucle, soit de 8,4 à 16,7 s dans le rendu de la preuve. C'est là que `sn-mood` plaçait la séquence adverse (8 à 14 s). Son « 0,99 » venait de la traîne de la troisième mesure (−68 à −97 dB), juste seulement parce que le rendu est exact. Avec la rampe d'une mesure, la fenêtre a glissé dans le silence et la lecture est tombée dans le bruit (0,18 ; −3,19 à mi-rampe), alors que les automations envoyées étaient justes : relevées sur le gain, 0,35 → 1 de 8,39 à 9,77 s. Les scénarios passent à 19-25 s, à partir de la neuvième mesure de la boucle, où la tension joue. La vérification de l'introduction n'est pas touchée : la première mesure joue.
- **L'extrait F de la fiche portait un saut que le jeu n'a pas.** Mon script de page (`layer-jobs.page.js`) annulait un changement remplacé sur la barre même, et perdait donc la fin de la rampe précédente quand elle finissait sur cette barre (le cas du second contrôle négatif). Une seule fois dans les 90 s : la tension y restait à son niveau de 0:52 à 0:53,5, puis sautait. Le moteur rampe à cet endroit. Le script annule désormais juste après la barre, comme `layers.ts`. L'opérateur a choisi F en entendant ce saut.

### Mesures
- `analyse.mjs --check` sur le rendu complet du moteur : tout passe. Chaque lieu à chaque heure est entre −18,5 et −18,9 LUFS. Les duels avec la musique sont à −17,2 LUFS (Marek, la nuit) et −17,3 (Vessa, à midi), contre −17,2 et −17,4 en Passe SN10. À plein volume : −14,2 LUFS et −1,0 dBTP.
- **Le moteur F contre l'extrait F de la fiche** (même duel, mêmes 90 s) : les mêmes 59 changements, aux mêmes instants et aux mêmes niveaux. Le son est identique à −60 dB près, sauf à deux endroits :
  - les deux premières secondes : l'extrait partait des niveaux d'avant, le moteur part de ceux de F ;
  - de 0:52 à 0:53,5 : voir le second défaut ci-dessus.
- `npm test` 386 sur 386, `npm run typecheck`, `npm run build`, `npm run art:validate` (14 manifestes de son, 0 erreur). Aucun fichier audio ni manifeste ne change, aucune partition.

### Limites
- **Personne n'a entendu F en jeu.** L'extrait F de la fiche imitait la règle côté page ; le moteur la porte désormais, et ses changements sont ceux de l'extrait. L'extrait avait en plus le saut de 0:53 ; le jeu ne l'a pas.
- Les baisses sous les coups, les bruitages et le grondement de l'arène sont ceux d'avant : la seconde fiche de S3 les reprend.
- L'essai Safari reste à l'opérateur (SC-SAFARI).

### Où reprendre
- La seconde fiche d'écoute de S3, avec les instruments du groupe : un son par recette, la fenêtre d'esquive, la foule qui réagit, le K.O. et le ralenti, les baisses sous les coups (CQ-BAISSE). Puis S2, dans sa propre séance.

### Pensée
- Un gain se mesure là où sa couche joue : un ajustement par moindres carrés sur une couche muette rend un chiffre, juste par hasard ou faux, jamais une mesure. On regarde le niveau de la couche, mesure par mesure, avant de placer la fenêtre.
- Quand deux changements se suivent sur des barres consécutives, la fin de l'un est le début de l'autre : une annulation se pose juste après l'instant qu'elle remplace, pour garder la rampe qui y finit.

