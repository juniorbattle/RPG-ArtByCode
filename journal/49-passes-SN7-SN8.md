# Journal de bord — archive : passes SN7, SN8 (2026-11-02)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-11-04 (Passe SN14) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe SN7 — Le catalogue : douze morceaux, un seul motif, des boucles sans clic, la fiche du catalogue (2026-11-02)

### Demande
- F-SUITE « Le catalogue d’abord » (Passe SN6) : les douze morceaux de SA-6 avant S2 et S3. Le catalogue annoncé : titre, matin, midi, fin de journée, nuit, parvis, lices, place de la halle en valse, duel, duel de rival, finale et jingles.

### Fait — [OK]
- **Sept morceaux et deux jingles neufs** (`art-lab/audio/scores/`), le motif transformé à chaque fois (`theme.mjs`) : `titre` (étiré sur un cor, sans tierce jusqu'au dernier accord de la fanfare), `fin` (la tierce hésite : fa sur le motif, fa dièse sur la réponse, les deux côte à côte à la fin), `parvis` (par bribes, puis entier ; une montée ton par ton), `lices` (5/4, cellules de cinq notes), `valse` (3/4, pointé), `rival` (7/8 sur 3 + 2 + 2, le motif renversé autour du ré, mêmes cinq notes, puis le vrai motif rendu, en trois couches), `finale` (ré mineur, un ton plus haut, puis la fanfare en ré majeur : le fa de la nuit cède au fa dièse du jour, en trois couches), `victoire`, `defaite`. La fanfare (Passe SN5) complète les jingles.
- **Le socle** `rig.mjs` : les réglages de chaque pupitre, mesurés sur les versions approuvées, pour que chaque pièce parte du même mélange.
- **Les boucles** (`render.mjs --loop`) : chacun des onze morceaux sort aussi en boucle pour le jeu : le fichier est le corps seul, circulaire, mastering compris (`Session.wrap`, `master({ circular })`, `beforeLoop`). Les versions avec leur fin restent pour l'oreille.

### Défauts trouvés
- [KO → corrigé] **Le clic à chaque tour** : la queue de l'introduction restait dans les premières mesures de la boucle, la fin du fichier ne rejoignait pas son début : saut de 34 % de la crête sur `midi`. Le corps seul, joué en cercle, le ramène à 5 %. Le mastering passe deux fois et garde le second tour : son état à la fin est son état au début.
- [KO → corrigé] Une relecture indépendante des partitions a trouvé douze points : sur `finale`, le maintien de la mélodie retirait la tierce de la dominante (la correction d'`avoidAt` cachait la faute au contrôle) ; sur `rival`, le groupe partagé entre deux groupements en 7/8 ; la timbale, accordée en ré, sous des accords qui n'en ont pas ; un orgue qui anticipait le mauvais accord ; un do dièse sous un ré tenu au `parvis`, angle mort du contrôle, qui ne regarde que le demi-ton au-dessus ; le fa dièse sorti trop tôt au `parvis` ; le piano du `titre` qui sonnait sur l'accord suivant ; le vibraphone de `fin` sur les notes mobiles ; la jointure de `valse` sans dominante ; le fa dièse sonnant sur le fa à la jointure de `finale` ; la couche `tension` vide sur douze mesures du `rival` ; le marimba de `lices` dans le registre de la mélodie. Tout est corrigé.
- [KO → corrigé] Les mètres : batterie trop vive dans la valse (4 kHz à −0,4 dB), trop forte dans les combats, cor trop discret au titre et au parvis.

### Mesures — [OK]
Rendus à 48 kHz, −18 LUFS. « Boucle » : la durée du fichier du jeu. « Jointure » : le saut au tour rapporté au plus grand saut du morceau.

| Morceau | Avec sa fin | Boucle | Crête vraie | Plage (LU) | Jointure |
|---|---|---|---|---|---|
| `titre` | 65,8 s | 46,7 s | −1,3 dBTP | 8,2 | 0,01 |
| `matin` | 82,3 s | 65,5 s | −4,6 dBTP | 5,3 | 0,02 |
| `midi` | 94,9 s | 81,5 s | −3,8 dBTP | 3,1 | 0,09 |
| `fin` | 67,5 s | 49,2 s | −3,8 dBTP | 5,2 | 0,03 |
| `nuit` | 88,7 s | 67,5 s | −4,5 dBTP | 6,0 | 0,01 |
| `parvis` | 64,3 s | 50,0 s | −2,6 dBTP | 4,7 | 0,03 |
| `lices` | 58,9 s | 50,0 s | −3,1 dBTP | 3,3 | 0,02 |
| `valse` | 57,9 s | 47,0 s | −4,8 dBTP | 2,9 | 0,09 |
| `duel` | 54,2 s | 44,2 s | −5,0 dBTP | 3,0 | 0,32 |
| `rival` | 42,9 s | 35,9 s | −5,8 dBTP | 2,1 | 0,06 |
| `finale` | 53,9 s | 42,4 s | −4,0 dBTP | 3,9 | 0,62 |

- La durée écrite du catalogue fait 12,1 minutes (SA-6 « 12 morceaux, 12 min »), jingles compris. `victoire` 9,6 s et `defaite` 12,3 s avec leur résonance.
- Les jointures de `duel` et de `finale` tombent dans une attaque de batterie sur le premier temps : le saut reste sous le plus grand saut naturel du morceau.
- **Poids en Opus, mesuré sur les boucles** : huit morceaux simples à 96 kb/s 5,95 Mo ; jingles 0,50 Mo ; les trois combats en trois couches (`base` à 80 kb/s, `melody` et `tension` à 64) 3,50 Mo. **9,95 Mo** en tout, sous les 12 Mo de SA-17 ; 8,62 Mo si seul `duel` garde ses couches.
- 0 frottement, le motif dans l'ordre et les tessitures tenues sur les onze morceaux. `npm run typecheck`, `npm test` **381 / 381**, `npm run build`, `npm run art:validate` : 61 manifestes, 85 sources, 0 manifeste de son, 0 erreur. Aucun fichier de `src/` ni de `public/` ne change, aucun fichier audio dans le dépôt.

### Limites
- **Personne n'a écouté les neuf pièces neuves.** Le cor du titre et la tenue de la valse le soir sont les inconnues les plus nettes.
- Le contrôle `rubs` ne voit qu'un demi-ton au-dessus de l'orchestre : les deux relectures ont trouvé des fautes hors de ce champ. Il n'a pas été élargi : la septième majeure sous la mélodie est une couleur voulue.
- Le corps d'une boucle ne contient pas l'introduction : les introductions du `duel`, du `rival`, de la `finale` et du `titre` demanderont un fichier à part ou seront retirées au moment de cuire. Au premier tour, la résonance de la fin de boucle s'entend sur le début, faiblement.
- La jointure s'entend peut-être sur `midi`, qui repart de mi vers ré : voulu, à confirmer.
- **AAC** : son décalage de codeur peut laisser un trou à la jointure : à éprouver sur un vrai Safari, je n'ai aucun appareil Apple. Rien n'est cuit ni branché ; le moteur joue toujours `tune()`.
- Le parvis mixé sur sa foule (Passe SN5) n'a pas été refait pour les autres lieux.

### La fiche — à remplir par l'opérateur
- Page privée https://claude.ai/artifact/YWTp8PsevhBXAQYhXP79vD (source `briefs/fiche-son-catalogue.html`), collection `decisions` vide à la publication, treize cartes, onze extraits. À l'oreille : C-TITRE, C-FIN, C-PARVIS, C-LICES (avec « Garder, mais en 4/4 »), C-VALSE, C-RIVAL, C-FINALE, C-JINGLES, C-BOUCLE. Décisions : C-LIEUX le plan des morceaux par lieu et par étape du tournoi, C-COUCHES le poids, C-SAFARI l'essai sur appareil Apple, C-SUITE cuire et brancher. Rendu vérifié en local, deux largeurs, onze lecteurs chargés, sans débordement.

### Report sur `main`
- `main` a reçu UM12 pendant ce travail. Branche neuve `claude/sound-twelve` depuis `e118f66`, Passe SN6 rejouée, aucun push forcé.

### Où reprendre
- Relire `decisions` quand l'opérateur dit la fiche remplie, consigner mot pour mot, n'agir que sur ce qui est décidé. La suite proposée : cuire sous manifeste (Opus et AAC), jouer les boucles et les couches dans le moteur derrière `flags.v2`, essai en jouant ; puis S2 et S3 avec les instruments du groupe.

### Journal — [OK] archivage
- Les passes gardées dépassaient 60 Ko. UM9, SN1, SN2, SN3, closes, partent d'un seul bloc vers `journal/47-passes-UM9-SN3.md` (29504 octets). Preuve : corps de l'archive égal au bloc, chaque passe dans un seul fichier, fins de ligne CRLF gardées.

### Pensée
- Une boucle n'est pas un morceau qu'on recoud : le fichier du jeu se rend comme un cercle, de la partition au plafond. Chercher le clic a montré que l'introduction n'avait rien à y faire.
- Une correction automatique peut cacher une faute à son propre contrôle : `avoidAt` retirait une tierce, et le test passait. Quand un outil modifie la musique, ce qu'il retire se relit.

## Passe SN8 — La fiche du catalogue relue, et la reprise : chaque morceau son air (2026-11-02)

### Demande
- Message de l'opérateur, mot pour mot : « Fiche remplie, le vrai retour est : Gloablement je trouve cela bien mais on a peut etre pousser le concept de similarite entre track un peu, il faut de la subtilite afin que les joueurs ne ressentent pas cette sensation de copier-coller, surtout niveau structure qui semble etre trop facilement reconnu ».

### La fiche
- Page privée https://claude.ai/artifact/YWTp8PsevhBXAQYhXP79vD, source `briefs/fiche-son-catalogue.html`. Relue par `list` : 13 documents sur 13, aucune note enregistrée.

| # | Décision | Choix de l'opérateur |
|---|---|---|
| C-TITRE | Le titre | « Bonne direction » |
| C-FIN | La fin de journée | « Bonne direction » |
| C-PARVIS | Le parvis | « Bonne direction » |
| C-LICES | Les lices en 5/4 | « Bonne direction » |
| C-VALSE | La valse | « Bonne direction » |
| C-RIVAL | Le rival | « Bonne direction » |
| C-FINALE | La finale | « Bonne direction » |
| C-JINGLES | Victoire et défaite | « Bonne direction » |
| C-BOUCLE | Les jointures | « Rien entendu de gênant » |
| C-LIEUX | Quel morceau joue où | « Valider ce plan » |
| C-COUCHES | Les couches | « Trois couches sur les trois combats » |
| C-SAFARI | L'essai sur appareil Apple | « Je peux faire l’essai » |
| C-SUITE | La suite | « Reprendre ces morceaux d’abord (en note) » |

### Ce que ces choix veulent dire
- **C-SUITE** passe la reprise avant la cuisson ; sa note est le message ci-dessus. **C-LIEUX** fixe le plan des morceaux par lieu et par étape du tournoi pour le lot de cuisson ; **C-COUCHES** : trois couches sur `duel`, `rival` et `finale` ; **C-SAFARI** : l'opérateur fera l'essai, une page de test viendra avec les premiers fichiers cuits ; **C-BOUCLE** : la jointure circulaire est acceptée à l'oreille.
- [KO → corrigé] **La note de C-SUITE s'est perdue** : le document a été écrit 48 fois (`version: 48`, l'opérateur tapait) et il est revenu vide. Cause, lue dans le code de la page : un instantané du serveur arrivé pendant une écriture remplaçait l'état local, et l'écriture suivante renvoyait l'ancienne valeur. La nouvelle fiche ignore les instantanés d'un document en cours d'écriture ou modifié depuis moins de 5 s. Le modèle de la compétence `fiche-arbitrages` (hors du dépôt) portait le même défaut ; corrigé ensuite à la demande de l'opérateur (« Do this task here: “Corriger la note perdue du modèle fiche-arbitrages” »), avec la même protection et l'enregistrement pendant la frappe (une note tapée en dernier, le champ jamais quitté, se perdait). Son exemple ne s'exécutait pas du tout : trois apostrophes droites dans des chaînes entre apostrophes, corrigées. [OK] Rejoué dans Chrome sans tête avec une base factice : l'original renvoie un choix et une note vides, le modèle corrigé les garde ; un changement venu d'un autre onglet s'affiche toujours une fois la page au repos.

### Ce qui faisait le copier-coller — mesuré
- Lecture des quatorze partitions : huit morceaux suivaient le même plan (introduction, motif, motif plus fourni, réponse, fanfare, retour, en blocs de quatre mesures) ; le motif entier tenait la mélodie de neuf morceaux ; le bloc de la fanfare et ses accords (D13sus, E/D, Bbmaj9 et C9, D6/9) fermaient dix fichiers ; tout était centré sur ré ; des phrases passaient d'un morceau à l'autre note pour note (la réponse de la nuit et du titre, leur fin au vibraphone, la réponse du duel sur le contour du pont de midi).
- **Outil** `tools/audio/band/likeness.mjs` : les airs lus en tournures de six notes par leurs seuls intervalles (même tournure dans une autre tonalité, une autre mesure, un autre rythme), les blocs de deux mesures copiés (intervalles et rythme), les suites de quatre accords en degrés, la tonalité estimée (profils de Krumhansl et Kessler, un repère, pas une preuve pour une pièce modale). `runsOf` et `THEME_STEPS` (`theme.mjs`) séparent les tournures du thème, partagées par dessein.
- [KO → corrigé] Première version de l'outil : la fusion des notes simultanées testait un champ absent, les doublures à l'octave s'entrelaçaient et cachaient des ressemblances ; le garde-fou passait grâce à ce défaut. Trouvé par la relecture indépendante, corrigé, toutes les mesures refaites.

### Fait — [OK]
- **La règle** (`theme.mjs`, `WHOLE_MOTIF`) : le motif entier au titre, à midi, dans les riffs du duel et du rival, et à la finale ; ailleurs sa tête seule, dans un accompagnement : le marimba du milieu du matin, le vibraphone grave de la nuit et de la fin de journée, une voix intérieure du piano au parvis, le marimba de l'exercice aux lices, la basse du pont de la valse. L'appel de la fanfare à midi et à la finale seulement (et dans les jingles), harmonisé et frappé autrement dans les deux.
- **Chaque morceau son air, sa tonalité, sa forme** : `matin` en sol (couplets de six mesures, refrain de huit, milieu en hémiole, une coda à lui) ; `midi` une seule fanfare, après le solo, le solo sans la tierce avant elle, la boucle repassant par la dominante ; `fin` en fa, une bossa lente (nylon sur la clave, rim, shaker, basse au doigt) et un cor doux, 8 + 6 + 4 mesures, plus rien du groupe de la nuit ; `nuit` sa propre chanson en ré dorien, ouverte sur sa tierce, 5 + 4 mesures puis le souvenir du jour ; `titre` le motif sur des accords neufs, une réponse neuve, la tête du motif deux fois plus lente au sommet, sans fanfare ; `parvis` en do, un riff et un air qui s'empilent, une fin sur les tambours ; `lices` en la dorien, un air en phrases de trois mesures, l'exercice seul pour finir ; `valse` en si bémol, son air, un pont en mineur, un arrêt net ; `duel` un ton plus haut, mi mineur, sa propre montée, une réponse neuve ; `rival` en fa dièse mineur, sa ligne au lead, quatre mesures du riff du héros, une ouverture aux toms et un arrêt net ; `finale` réécrite : un riff en croches droites en do mineur, le motif entier au cor en valeurs longues, une réponse, deux mesures sur la dominante, la tête en ré mineur, la fanfare en ré majeur sur une pédale de ré.
- **Une entrée et une fin par morceau** (six entraient de la même façon, dix finissaient sur deux gestes) : les tambours seuls (fin de journée, parvis, rival), l'élan d'un synthé ou d'une flûte (nuit, valse), l'exercice et la batterie (lices), la quinte et le vibraphone sans la basse (titre), la guitare et les mains (matin) ; un arrêt net (valse, rival), une fin ouverte sur la dominante (nuit), les cuivres qui tombent (midi), la timbale qui s'éloigne (duel), les tambours seuls (parvis), l'exercice seul (lices), les deux tierces à la suite (fin de journée).
- La timbale s'accorde (`drum('timp', vel, take, tune)`, les octets d'avant gardés à 0) ; `power` transpose.
- **Le garde-fou** (`tests/audio-band.test.mjs`) : le motif entier seulement là où il doit, sa tête ailleurs ; hors thème, moins de 8 % des tournures entendues dans un autre morceau, quatre au plus par paire ; aucun bloc copié sinon l'appel de la fanfare de midi à la finale ; pas de fanfare ailleurs ; six tonalités estimées au moins. Sur le catalogue de SN7 il échoue sur chacun de ces points.

### Relectures indépendantes
- [KO → corrigé] **Première relecture** (un agent, sans ma conclusion), 24 points. Fautes : le marimba des lices (ré contre do dièse sur A13), trois coups de timbale de la finale hors de l'accord, le cor grave du titre contre le si bémol de l'orchestre, le défaut de l'outil (plus haut). Ressemblances : la finale reprenait le refrain de midi (le motif en 3-3-2-3-2-3, les trois frappes, la montée, le ton plus haut, le bloc de la fanfare) et le plan du duel (quinte ouverte, break en demi-temps) ; le cri du parvis était note pour note celui de la finale ; la fin de journée gardait la section rythmique de la nuit ; deux gabarits de fin pour dix morceaux ; la tête du motif trop exposée à la nuit et aux lices ; des suites d'accords communes ; le duel et la nuit en ré mineur. Jointures : midi (mi vers ré) et finale (ré majeur vers do mineur). Tout est corrigé : la finale réécrite, la fin de journée en bossa, le duel en mi mineur, les lices en la pour ne pas lui prendre son mi.
- [KO → corrigé] **Seconde relecture**, 19 points : ma nouvelle finale reprenait, mesures 16 à 21, les accords et le contre-chant de la nuit une octave plus haut ; six morceaux gardaient la même entrée (un accompagnement seul, la basse à la deuxième mesure, l'air à la troisième) ; l'air des lices était enfoui par sa transposition ; des timbales et une basse contre l'accord (finale, rival), des guitares sous ré2 ; la même mesure dans la fin de journée et la valse ; des fins encore semblables ; l'appel de la fanfare encore harmonisé comme à midi ; le même tour bII–V au titre et à midi, au duel et au pont de midi ; le même motif de batterie au titre et au solo de midi. Tout est corrigé. L'outil lit désormais chaque voix mélodique à part : une phrase cachée entre deux voix échappait à la ligne fusionnée. Une tournure du motif enchaîné à lui-même compte comme le motif.
- [?] Gardé : au duel, le doublé du lead à l'octave 6 monte au mi7, la limite de la tessiture, dans la seconde reprise du riff (la version approuvée montait au ré7). La cellule noire pointée, croche, blanche reste celle de la nuit ; ailleurs elle a été variée.

### Mesures — [OK]
Onze morceaux, le même outil (corrigé, chaque voix lue à part) sur l'arbre gelé de SN7 et sur l'arbre de travail.

| | SN7 | SN8 |
|---|---|---|
| Tournures de six notes entendues ailleurs, hors thème | 19 % (142 sur 758) | 7 % (48 sur 712) |
| Le plus de tournures partagées par une paire, hors thème | 22 | 4 |
| Paires qui partagent une tournure, thème compris | 55 sur 55 | 32 |
| Blocs de deux mesures copiés | 54 | 4 (l'appel de la fanfare, midi et finale) |
| Paires qui partagent une suite de quatre accords | 7 | 1 (le riff du héros cité par le rival) |
| Tonalités écrites | ré partout | 8 toniques : ré, sol, fa, do, la, si bémol, mi, fa dièse |

- Contrôles sans oreille sur les passes sèches : aucun frottement de l'air contre une note tenue, aucune note hors tessiture.
- Rendus (`render.mjs --meters` puis `--loop --stems`) : 702 s écrites, 11,7 minutes (SN7 : 12,1) ; les onze boucles du jeu 566 s ; chaque morceau à -18 LUFS, crête vraie -1,7 dBTP au plus (lices, rendu entier), -2,2 dans les boucles. Jointures : le saut de la fin au début vaut 3,5 % de la crête au plus, sauf `duel` (15 %) et `finale` (22 %), qui tombent comme en SN7 dans une attaque de batterie sur le premier temps, sous le plus grand saut naturel du morceau (31 % et 44 % de lui).
- Poids en Opus, mesuré comme en SN7 : les huit boucles simples à 96 kb/s 6,22 Mo, les trois combats en trois couches 3,46 Mo, les jingles 0,5 Mo : **10,18 Mo** (SN7 : 9,95), sous les 12 de SA-17.
- Validation : 382 tests, `npm run typecheck`, `npm run build`, `npm run art:validate` passent ; aucun fichier de `src/` ni de `public/` ne change, aucun fichier audio dans le dépôt.

### Limites
- **Personne n'a écouté** la reprise. Les mesures disent que les airs ne se recopient plus ; elles ne disent pas qu'ils sont beaux ni que le catalogue sonne encore comme un seul jeu.
- La tonalité estimée lit mal les modes (le parvis en do mixolydien lu si bémol, les lices en la dorien lues mi mineur) : le garde-fou compte les tonalités estimées, la fiche les tonalités écrites.
- [?] Aux lices, la tête du motif reste l'exercice du marimba : elle tourne sous l'air dans seize mesures sur vingt-neuf (elle ne tient plus l'air, comme en SN7). Si l'oreille l'entend encore trop, c'est le premier endroit à alléger.
- `titre`, `midi` et `nuit` restent en ré, par dessein : l'ouverture, le chant du tournoi, et la nuit dont la tierce dit l'heure.
- Rien n'est cuit ni branché ; le moteur joue toujours `tune()`.

### La fiche — à remplir par l'opérateur
- Page privée https://claude.ai/artifact/LxqRepAVoinCRGZQDZvMte, source `briefs/fiche-son-reprise.html` (les extraits MP3 avant et après de chaque morceau repris et la journée enchaînée, avant et après, publiés avec la page, pas dans le dépôt) : les mesures de la reprise, puis une décision par morceau et la suite. `decisions` relu vide à la publication.

### Où reprendre
- Relire la fiche quand l'opérateur la dit remplie, consigner mot pour mot. Si la reprise est validée : le lot de cuisson (C-SUITE de cette fiche), avec la page de test Safari (C-SAFARI) et le plan C-LIEUX.

### Pensée
- Un thème partout n'est plus un thème. La règle d'un leitmotiv tient dans un test : où il s'entend entier, où il se cache, et que rien d'autre ne passe d'un morceau à l'autre.
- Un outil de mesure doit échouer sur ce qu'il prétend voir : le garde-fou passait à cause de son propre défaut. Le contrôle négatif (l'ancien catalogue doit échouer) et une relecture indépendante l'ont montré.
- Une page qui enregistre pendant la frappe doit protéger ce qui est tapé contre l'écho du serveur.

