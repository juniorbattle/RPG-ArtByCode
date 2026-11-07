# Journal de bord — archive : passes EVL2, EVL3 (2026-11-05 → 2026-11-06)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-11-07 (Passe GA3) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe EVL2 — Étape 5, lot L2a : le vol, le soupçon, la restitution, la réputation expliquée, le marchandage, les passants, le joueur curieux (2026-11-05 → 2026-11-06)

### Demande
- Transmise par la séance mère : construire le lot L2 de l'étape 5 (voler, défier, marchander), choix de l'opérateur EV-2 à EV-6 et EV-16 (Passe EV2), EV-15 « L1 à L6 dans cet ordre » ; L1 fait (Passe EVL1). Tout derrière `flags.v2`, le jeu par défaut identique. La consigne de l'opérateur pour tout le lot, mot pour mot : « n'oublie pas l'importance narrative et la coherence du gameplay [...] mais il faut pas se perdre dans la structure du jeu. sinon c"est pas bon » : chaque ajout tient à un personnage, un lieu et un moment du calendrier.
- Le découpage choisi dans cette séance : **une seule branche pour L2** (`claude/l2-ville`), d'abord L2a (cette passe : le vol, le soupçon, la restitution, la réputation et le soupçon expliqués, le marchandage et les passants, le joueur curieux), puis L2b (Passe EVL3 : tout ce qui est un duel, le défi, l'arène vide, les éliminés, les génériques, la représaille). La branche attend la fiche avant de fusionner, comme en Passe CH1 (CH-6 « Fusionner après la fiche, essayer ensuite »). Chaque nombre et chaque texte neuf est « proposé ».

### Fait — [OK], derrière la version 2
1. **Deux nombres distincts** (la question de l'opérateur sur EV-2, « on parle de reputation mais comment cela fonctionne ? », réponse en Passe EV2).
   - La **réputation** reste ce que la Cité dit du joueur (prix, leçons de Corvin, marchandage sur le nom, départage de la poule, cible du sabotage dès 35).
   - Le **soupçon** (`V2State.suspicion`, 0 à 100, `src/simulation/v2law.ts`) dit ce que sait la garde du sergent Hale. Il ne touche jamais la réputation.
   - Ils sont expliqués dans le jeu à trois endroits : la ligne du joueur dans la page du tournoi (T) dit ce que chacun ouvre et ferme ; le sergent Hale dit son registre et comment en sortir ; le chiffre « suspicion » s'affiche en haut à droite, à côté de la réputation, seulement s'il dépasse 0.
2. **Le vol qui dure** (EV-2 « Un soupçon qui dure, une sortie par la restitution ») :
   - chaque vol est noté (`V2State.thefts` : jour, victime, pièce, vu ou non) et laisse une trace (+5) ;
   - pris sur le fait, +25 ; un vol que personne n'a vu peut être **découvert à l'aube suivante** par sa victime (0,6 pour un étal, 0,85 pour un volet forcé, 0,5 pour une poche), une seule fois, +15, la bienveillance de la victime −10. La nouvelle, datée du matin, nomme la victime et la pièce (« At dawn Mara counts the stall: a whetstone is missing. ») ;
   - le soupçon rend le vol plus difficile (la chance perd soupçon / 200) ;
   - **au-delà de 50**, la garde fouille à l'aube (les pièces volées encore détenues retournent à leurs propriétaires, amende de 10) et **aucun des quatre étals ne vend** (marchandage compris) ; les passants vendent encore : l'alternative reste ouverte (GAMEPLAY § 10) ;
   - **la restitution chez le sergent Hale** (quai, à toute heure) : les pièces détenues rendues, les autres payées au prix catalogue, 5 de frais, le soupçon à 0. Une bourse trop mince donne ce qu'elle a et hale des caisses pour la garde le reste du créneau : la sortie est toujours ouverte ;
   - **le greffier** (Clerk Odo) avertit une fois ; un second vol pris coûte un point de poule pendant la poule (jours 1 à 5), une amende de 15 après (« proposé » : les points de poule ne comptent plus après la coupe) ;
   - **la nuit, les étals fermés se forcent** : Mara, Hilde et Corvin, fermés le soir. Chance de base 0,7, mais −0,25 sur le quai si le joueur a payé la garde. Pris : amende jusqu'à 25, réputation −12 à −15, l'étal fermé au joueur le lendemain, la hausse jusqu'au surlendemain, +35 de soupçon.
3. **Le marchandage au moment d'acheter** (EV-6 « Au moment d’acheter, un argument à choisir »), `src/simulation/v2barter.ts`, action `bargain`. L'ancien rabais du jour (lot V4) est retiré. Dans la page des marchandises, une pièce achetable montre « Espace Marchander » (la croix X à la manette, par sa touche affichée), et la liste devient celle des arguments, chacun avec sa chance, son prix s'il réussit et ce que coûte l'échec :
   - sur le nom dans la poule (0,15 + réputation / 120, −20 %) ;
   - en ami de l'étal (0,2 + bienveillance / 60, −15 %) ;
   - deux pièces à la fois (avec la moins chère que le joueur n'a pas ; 0,45 + réputation / 300 + bienveillance / 300, −25 % sur les deux).
   - Perdu : aucun surcoût, la bienveillance −4 (−8 pour l'ami), et aucun autre argument ce jour-là chez ce marchand ; le prix plein reste là.
4. **Les passants et leurs pièces** (la note de l'opérateur sur EV-6) : trois personnes de la foule, chacune avec une pièce qu'aucune boutique ne vend (`gear.ts`). Chacune s'achète à son prix, se marchande (sur le nom, ou par ce qui la touche, −30 %) ou se vole (`pickpocket`, la même trace et la même découverte qu'un étal). Une fois la pièce partie, la réplique change. Rendue chez Hale, la pièce revient à son propriétaire. Ce sont :
   - **Fenwick**, marchand de rivière, sur le quai la nuit, jours 1 à 7 (sa barge part après le match majeur) : un anneau de perle de rivière (26) ;
   - **Lady Edda**, mère d'un chevalier sorti des qualifications, sur le parvis le jour : le haubert de son fils (34, la pièce « rentable », meilleure et moins chère que la cotte de l'armurière) ;
   - **Sela**, pèlerine, sur la place de la halle l'après-midi et le soir, jours 1 à 9 (elle repart après la parade) : une médaille de pèlerin (18).
   - Leurs visages et leurs figures viennent de feuilles approuvées : Edda est la dame noble et Sela la voyageuse des citadins, arrêtées à une place, et ce citadin quitte alors la ronde de la foule (`PlazaApp`) ; Fenwick a le visage du vieux marchand du quai, en portrait seul.
5. **Le joueur curieux du laboratoire** (EV-16) : `POLICIES.curious` (`src/tournament/lab.ts`), en partie v2 (dans le jeu par défaut, il joue le diligent). Le soin du diligent, plus :
   - il marchande en achetant (le meilleur argument d'abord), achète ou marchande la pièce d'un passant ;
   - il vole quand le soupçon est sous 20 et la chance d'au moins 45 % ;
   - il défie et emporte ce qu'il apprend (la compétence d'un défi remplace la compétence de départ de sa famille) ;
   - il observe son prochain adversaire quand il le peut, ne paie la garde qu'après un signe, et va chez Hale quand la garde le veut.
   - `challengeOutcome` joue les défis par le bot dans le duel v2. Le rapport v2 compte ce que la ville a vu (`v2.town`).
6. **Les états nommés** : `v2-wanted-night` (graine 1842 : pris chez Mara, un ruban pris chez Pip, repris chez Pip ; soupçon 55, le point du greffier), `v2-day7-training` (jour 7, la coupe faite).

### Mesures — TournamentLab `--rules=v2`, graines 1 à 50
| Politique | Combats gagnés | Qualifié | Couronné | Blessures | Ce que la ville voit par partie |
|---|---|---|---|---|---|
| `diligent` | 59,6 % | 88 % | 2 % | 0,76 | rien (identique à `main`) |
| `idle` | 0 % | 0 % | 0 % | 1,74 | rien (identique à `main`) |
| `curious` | 50,4 % | 62 % | 0 % | 0,82 | 5,6 vols, 1,8 pris, 2,7 découverts, 1,1 fouille, 1,3 restitution ; 2,4 marchandages (1,2 réussis) ; 0,8 pièce de passant ; soupçon final 35,8 ; 0,8 point de poule perdu |

- Lecture : les actions de la ville ont désormais un prix. Le curieux vole souvent : il est découvert plus d'une fois par partie, fouillé, et il perd presque un point de poule. Il marchande une fois sur deux. Il se qualifie moins que le diligent (62 % contre 88 %), parce que ses créneaux partent dans les défis et les vols au lieu de l'entraînement (le laboratoire ne compte pas la marche ni ce qu'apprend un défi au-delà de son niveau). Avant L2, le voleur à réputation 0 se qualifiait 9 fois sur 10 (Passe EV1).

### Pensée
- Deux nombres qui se ressemblent se séparent par ce qu'ils ouvrent et ferment, et chacun se dit là où le joueur le lit : sa propre ligne dans la page du tournoi, la bouche de celui qui tient le registre, un chiffre qui n'apparaît que s'il compte.
- Une fermeture des étals n'est juste que si une autre porte reste ouverte : les passants vendent au joueur que la garde recherche, et la restitution est possible même sans un sou.
- Un marchandage devient une décision quand il porte sur un achat précis et que chaque argument a son prix et son risque.

## Passe EVL3 — Étape 5, lot L2b : le défi à pleine vie et sa mise, l'arène aux gradins vides, les éliminés et les combattants génériques, la représaille (2026-11-06)

### Demande
- La suite de la Passe EVL2, sur la même branche : EV-3 « Pleine vie, une mise, une fois par phase », EV-4 « Les trois, puis les éliminés à partir du jour 6 » avec la note de l'opérateur sur les combattants génériques et sa réponse « En ville, structure gardée (Recommandé) », EV-5 « L’arène aux gradins vides », et la représaille de sa note sur EV-2 (« une possibilite de combat et de represaille reelle »).

### Fait — [OK], derrière la version 2
1. **Le défi** (`challenge`, `src/simulation/v2town.ts`) :
   - l'adversaire a toute sa vie (`challengeSheetFor`, `src/combat/match.ts`, le ×0,5 retiré) ;
   - **une mise** choisie : 10 pièces posées sur la table à l'acceptation et rendues doubles si l'on gagne (rendues si l'on annule), ou 5 de son nom, gagnés ou perdus au résultat. Elle remplace l'ancien +3 / −1 ;
   - une fois par phase par combattant (avant la coupe, jours 1 à 5 ; après, 6 à 10) ;
   - perdu, jamais de blessure (V2B1-1 reste la seule règle des blessures) ;
   - l'étiquette dit « 10 coins » et « 1 slot » (règle P2, Passe EVL1).
2. **Qui défier** (EV-4) :
   - Orla et Ilse au terrain d'entraînement et Vessa au parvis, de jour, comme avant, les dix jours ;
   - **dès le jour 6**, un rival sorti de la course au titre (un des quatre hors de la coupe, statut `gate`) accepte un défi là où il se tient, les jours où il ne combat pas : Marek et Vessa au parvis, Cassius sur la place la nuit, Tobin et Rhosk au terrain d'entraînement (portrait seul, comme la carte R-ville « Portrait seulement » le voulait, jours 6 à 10). Chacun enseigne une compétence déjà au catalogue (`LATE_TEACHER`, « proposé ») : Marek la peau de fer, Cassius la feinte, Rhosk la fente, Tobin la double taille ;
   - **les combattants génériques** (`src/narrative/generics.ts`) sont les perdants des qualifications tenues avant l'arrivée de Ren ; les dix jours, la poule de huit et la coupe ne changent pas. Chacun se bat sur le profil d'un rival, un peu plus faible :
     - **Ser Aldric Venn**, le chevalier malchanceux, fils de Lady Edda, au terrain d'entraînement de jour (profil d'Ilse) ; il reconnaît son haubert si le joueur le porte ;
     - **Corra Dunmere**, au bâton, sur le quai la nuit, qui loue son bâton : c'est elle, les gros bras de la représaille (profil d'Orla) ;
     - **Frère Ambrose**, porteur de lanterne des sanctuaires des collines, sur la place l'après-midi et le soir (profil de Cassius).
   - Ils ne sont rencontrés qu'en portrait et en paroles sur les places (`Person.generic`, hors de `plazaPeople`). Leur figure : trois panneaux de la planche G1 de l'opérateur restés sans rôle (carte N7 « Leur donner un rôle », Passe CA1), les panneaux 1, 2 et 4. Leurs feuilles ne sont pas faites : elles demandent la fiche de leur art.
   - En attendant, le duel les montre sous **une figure générée de l'arène** (`FighterArt` : Corra la duelliste, Aldric et Ambrose le chevalier), sans dessin neuf.
3. **L'arène aux gradins vides** (EV-5) : un défi ou une représaille se joue sans les 88 citadins des gradins, sans spectateur généré, sans la foule sonore, sur le morceau des lices (`ArenaMatch.empty`, `SceneMusic.empty` : les sons du duel restent chargés). Le HUD et la porte disent « A challenge » ou « A reprisal ».
4. **La représaille** (`src/simulation/v2law.ts`) :
   - à l'aube qui suit un vol découvert ou pris, si la bienveillance de la victime est tombée à −30 ou moins, elle paie Corra Dunmere ; celle-ci attend le joueur sur le quai après la nuit tombée, deux nuits ;
   - on l'affronte sur le sable (un vrai combat, les gradins vides) ou on la paie, 20 pièces (la victime +15) ; la restitution chez Hale y met fin aussi ;
   - gagné : elle part pour de bon, réputation +2 ;
   - perdu : 20 pièces, les pièces volées à la victime encore détenues lui reviennent, et un K.O. par un coup puissant blesse, comme en combat officiel (V2B1-1, « A. K.O. par un coup puissant ») ;
   - ignorée : à l'aube qui suit sa dernière nuit, elle prend son dû (les 20 pièces et les pièces).
5. **Outils** : `tools/challenge-flow.mjs`, un défi ou une représaille joué dans le navigateur. L'état est bâti en Node par les actions du jeu (pour la représaille : deux vols pris chez Mara, la nuit, l'aube), gardé dans la sauvegarde du navigateur ; le défi est mis ou Corra affrontée par l'interface (`__ui.run`), l'arène chargée depuis la sauvegarde, le combat décidé, la ville rouverte ; Node rejoue les actions de la page et doit trouver la même empreinte. **`AGENTS.md`** : le test, l'outil, la politique `curious`, les paramètres.

### Tests — [OK]
- **`tests/v2-law.test.mjs`** (douze tests ; les oracles sont les règles écrites dans le test) :
  - les deux nombres et l'œil de la garde ;
  - la découverte à l'aube, une seule fois (80 graines ; les trois chances au tirage près) ;
  - la nuit et le volet forcé ;
  - le seuil, la fouille, les étals fermés et les passants ouverts ;
  - la restitution, la bourse mince, Hale qui le dit ;
  - le greffier ;
  - le marchandage (les trois arguments, leurs chances et leurs prix, gagné, perdu, le lendemain) ;
  - les passants (lieux, heures, jours, pièce partie, la poche) ;
  - la représaille (embauche, seuil, payer, affronter, perdre avec et sans coup puissant, ignorée, restitution) ;
  - les gradins vides (le câblage) ;
  - le joueur curieux (toutes les actions dans une partie au moins, le diligent et l'idle intacts, le curieux du jeu par défaut égal au diligent) ;
  - le jeu par défaut sans rien de tout cela.
- **`tests/v2-town.test.mjs`** : le défi réécrit (mise, pleine vie, une fois par phase, annulation rendue, un générique sans compétence) et les éliminés du jour 6.
- **Complétés** : `cost-tags` (les prix du marchandage, de la mise, de Corra et de la restitution, et la hausse d'un marchand volé que `v2-wanted-night` atteint désormais), `v2-places`, `wares`, `v2-reading`, `plaza-cast`, `arena-stands`.
- **Vingt fautes injectées une à une, toutes attrapées** :
  - l'aube recompte un vieux vol ; la fouille laisse les pièces ; la restitution garde le soupçon ; le seuil au-dessus de 50 ;
  - le rabais du nom faux ; deux pièces avec une pièce détenue ; un argument perdu qui achète quand même ;
  - le point du greffier après la poule ; un passant tous les jours ; une poche sans trace ; l'œil de la garde oublié ;
  - le défi à mi-vie ; une fois par jour au lieu d'une fois par phase ; la mise gardée à l'annulation ; un rival du titre défiable ;
  - le Colisée plein ; une représaille sur toute rancune ; la restitution qui laisse Corra attendre ; une représaille perdue qui blesse toujours ; le curieux qui ne vole jamais.
- `npm test` **442 sur 442**, `npm run typecheck`, `npm run build`, `npm run art:validate`.

### Preuves — [OK]
- Serveurs par `preview_start` : la branche en DEV `:5251`, `main` figé (`git archive` de `4bc0e6e`) en DEV `:5252`.
- **Le jeu par défaut, inchangé** :
  - `detshots` à 0 px contre `main` figé, treize vues : la ville de nuit et à midi ; le mode jouable par défaut à l'ouverture, avec la liste Q, Mara, le journal et le tableau, et son premier soir avec la liste ; la ville d'une partie v2 à l'ouverture, avec la liste Q et Mara. Le témoin de répétition est à 0 px ;
  - l'arène par défaut et le duel v2 (calme, K.O.) à 0 px avec `HOLD=1 FREEZE_CSS=1`, comme en Passe MN2, témoin à 0 px. Sans ces deux réglages, la capture n'est pas répétable : 0,2 à 79 % d'écart (piège déjà connu, rappelé ici) ;
  - `play-flow` : par défaut `0025acce7a403773` et `V2=1` `cf669f2d59e33a8d`, les empreintes des Passes CH1, MN2 et EVL1 ; `play-day` par défaut `6a942086a2616ab2` ;
  - **TournamentLab** au JSON près contre `main` figé : règles classiques et dynamiques (idle, diligent, 50 graines), les trois parties scriptées (20 graines), et en v2 le diligent et l'idle, dont les parties et les taux sont identiques ; seul s'ajoute le champ `v2.town`, à zéro.
- **La version 2** :
  - `play-day` `V2=1` (1842) : tous les contrôles passent, rejoué en Node (`107fcba9aa88d4fd`) ;
  - `challenge-flow` : défi gagné et perdu, représaille gagnée et perdue, tous les contrôles passent. On y voit la mise et le créneau dans l'étiquette, la porte « Enter the sand », l'arène sans townsfolk ni spectateur, le morceau des lices, l'adversaire à pleine vie, la mise rendue double ou perdue, la représaille réglée, et Node rejoue à la même empreinte ;
  - vu à l'œil dans le navigateur : Lady Edda debout près de la tente du greffier, sa page des marchandises et le mode marchandage.
- **`ui-text`** : dix pages, chacune à 1 600 × 900 et 390 × 844, toutes au-dessus du seuil (16 px sur ordinateur, 14 au téléphone, les deux polices embarquées, aucun caractère hors du sous-ensemble). Ce sont les marchandises d'Edda et de Hilde, le mode marchandage, la liste Q, Hale et Fenwick d'un voleur recherché, la ligne du joueur dans la page du tournoi, Tobin au jour 7, Aldric, et Orla avec ses deux mises.

### Défauts trouvés — [KO → corrigé]
- La pièce d'un passant restait proposée après l'achat, avec l'aperçu d'un second achat : elle compte désormais comme acquise (`done`).
- Corra apparaissait dans le duel sous le Marek généré, un vieil homme barbu : les génériques reçoivent une figure générée selon leur personne (`FOES.corra = FOES.vessa`).
- Mes propres outils : le script de l'état nommé `v2-day7-training` comptait une attente de trop (refusée le jour 4) ; le rejeu de `challenge-flow` oubliait la parole que l'ouverture d'un dialogue joue (`talk`).
- Vu sur la capture de la fiche : pendant une représaille, le dialogue de Corra montrait ses deux défis refusés (« here for a debt, not for sport ») au-dessus de « Face » et « Pay ». Ils ne sont plus proposés tant qu'elle attend pour une dette ; le refus reste dans la règle (le test le vérifie).

### Relevé hors du lot
- Au jour 7, un joueur vainqueur de sa demi-finale lit « Your bouts are fought » : la finale du jour 10 n'existe qu'après les combats du jour 8. C'est un défaut de lecture d'avant L2, à reprendre en L5 ou sur décision.

### La fiche — publiée, rien de décidé
- Page privée https://claude.ai/artifact/JtHMUAQxrAoHdNq8wRytGP, source `briefs/fiche-l2.html` (la page de la fiche EV1), dix-sept images publiées avec la page (pas dans le dépôt : quinze captures du vrai jeu, la planche G1 et celle des personnages principaux). Collection `decisions` relue vide à la publication ; une écriture d'essai dans `probe`, lue puis effacée : la base répond. Vérifiée en local avant : 14 cartes, 40 options, toutes les images chargées, aucun débordement à 1 200 et 390 px, aucune erreur de page.
- Quatorze cartes, chacune avec sa recommandation :
  - L2-1, où le jeu explique les deux nombres : « Garder ainsi » ;
  - L2-2, les nombres du soupçon : « Garder ces nombres » ;
  - L2-3, qui refuse de vendre au-delà du seuil : « Les quatre étals » ;
  - L2-4, le greffier après la poule : « Une amende de 15 après la poule » ;
  - L2-5, les étals forcés la nuit : « Garder » ;
  - L2-6, les trois arguments : « Garder » ;
  - L2-7, les trois passants : « Garder » ;
  - L2-8, la mise : « Garder » ;
  - L2-9, ce qu'enseignent les éliminés : « Garder » ;
  - L2-10, les trois génériques : « Garder » ;
  - L2-11, leur art : « Ces trois figures, une tâche à part après la fusion ». Les figures proposées : Aldric ← le chevalier n° 07 de la planche des personnages principaux, parce que le panneau 1 de G1 est le double du héros ; Corra ← le panneau 2 de G1 (la dame au bâton) ; Ambrose ← le panneau 4 de G1 (le porteur de lanterne). Cela répond à N7 pour deux panneaux sur trois ;
  - L2-12, la représaille : « Garder » ;
  - L2-13, l'équilibre (le curieux qualifié à 62 % contre 88 %) : « Accepter : l’enjeu est voulu » ;
  - L2-14, la suite : « Fusionner après la fiche, essayer ensuite ».

### Où reprendre
- Relire `decisions` quand l'opérateur dit la fiche remplie, consigner mot pour mot, appliquer ce qui change, refaire les mesures et les preuves touchées, puis fusionner selon L2-14. Ce qui revient à L3 est dit dans la passe qui fusionnera.

### Pensée
- Un combat qui coûte quelque chose se mesure : à pleine vie avec une mise, le défi n'est plus gagné quinze fois sur quinze (3,7 sur 6,8 pour le curieux).
- Une représaille se rattache à un personnage qu'on peut rencontrer avant qu'elle n'arrive : Corra loue son bâton sur le quai la nuit, et c'est elle qui revient.
- Une figure en attente d'art se choisit dans le code déjà là, au plus près de la personne, et se dit provisoire sur la fiche, sans dessin neuf.

