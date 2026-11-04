# Journal de bord — archive : passes SN9, SN10 (2026-11-03)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-11-04 (Passe SN16) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe SN9 — La fiche de la reprise relue : sept morceaux repris gardés, la musique du tournoi revient à SN7 (2026-11-03)

### Demande
- Message de l'opérateur, mot pour mot : « fiche remplie ».

### La fiche
- Page privée https://claude.ai/artifact/LxqRepAVoinCRGZQDZvMte, source `briefs/fiche-son-reprise.html`. Relue par `list` : 13 documents sur 13, aucune note.

| # | Décision | Choix de l'opérateur |
|---|---|---|
| R-JOURNEE | Matin, midi, fin de journée, nuit : avant et après | « La sensation de copier-coller est partie » |
| R-MATIN | Le matin : une chanson à lui | « Bonne direction » |
| R-FIN | La fin de journée : une bossa, un cor | « Bonne direction » |
| R-NUIT | La nuit : sa propre chanson, et le jour en souvenir | « Bonne direction » |
| R-TITRE | Le titre : le seul à tout dire | « Bonne direction » |
| R-PARVIS | Le parvis : une foule qui s’empile | « Bonne direction » |
| R-LICES | Les lices : le motif devient l’exercice | « Bonne direction » |
| R-VALSE | La valse : son propre air | « Bonne direction » |
| R-RIVAL | Le rival : une autre tonalité, une ligne à lui | « Revenir à l’ancienne version » |
| R-FINALE | La finale : le retour à la maison | « Revenir à l’ancienne version » |
| R-RETOUCHES | Midi et le duel : des retouches | « Revenir à l’ancienne version » |
| R-MOTIF | Le motif entier en cinq endroits, caché ailleurs | « Garder cette règle » |
| R-SUITE | Ce qui vient après | « Cuire et brancher dans la version 2 » |

### Ce que ces choix veulent dire
- **La reprise est gardée pour sept morceaux** : `titre`, `matin`, `fin`, `nuit`, `parvis`, `lices`, `valse`. La journée enchaînée ne sonne plus comme un copier-coller (R-JOURNEE).
- **La musique du tournoi revient à SN7** : `midi` et `duel` (déjà approuvés à l'oreille en SN6, puis gardés en SN7), `rival` et `finale`. Midi garde ses deux fanfares, le duel est de nouveau en ré mineur et finit sur la fanfare à 7/8, le rival est en ré sur le motif en miroir, la finale va de ré mineur à ré majeur sur le refrain de midi.
- **R-MOTIF garde la règle**. Avec les retours, elle se lit ainsi : le motif entier dans `WHOLE_MOTIF` (inchangé : les quatre anciennes versions le portent), sa tête cachée ailleurs, l'appel de la fanfare dans la musique du tournoi et les jingles, rien de recopié d'un morceau à l'autre, sauf entre les quatre morceaux du tournoi. L'opérateur les a gardés à l'oreille en sachant ce qu'ils partagent : les cartes le disaient (la finale « reprenait le refrain de midi », la réponse du duel « recopiait le contour du pont de midi »). Lecture retenue : le choix précis des trois cartes l'emporte sur la règle générale pour ces quatre-là. Si l'opérateur veut autre chose, c'est une liste dans `theme.mjs`.
- **R-SUITE** : l'étape suivante cuit les morceaux sous manifeste, avec l'approbation de l'opérateur mot pour mot, les branche derrière `flags.v2` selon C-LIEUX et C-COUCHES, et donne l'essai en jouant ; la page de test Safari vient avec les premiers fichiers cuits (C-SAFARI). Une tâche à part.

### Fait — [OK]
- `midi`, `duel`, `rival` et `finale` remis octet pour octet depuis `c2df9f3`, ainsi que `rig.mjs` et `drums.mjs` : la transposition de `power` et la timbale accordée ne servaient qu'aux versions de SN8. Les quatre morceaux rendus à nouveau, entiers et en boucle avec leurs couches : 26 fichiers sur 26 identiques, échantillon pour échantillon, aux rendus de SN7.
- `lices` reste en la dorien (R-LICES) ; son commentaire ne cite plus le mi du duel.
- **Le garde-fou** suit les décisions : `TOURNAMENT` (`theme.mjs`) nomme les quatre morceaux du tournoi ; le test les laisse partager entre eux, la règle tient pour toute autre paire. Contrôle négatif : sur le catalogue de SN7, la même règle échoue encore (31 fautes : 18,7 % de tournures partagées, 23 paires, la fanfare dans six morceaux, cinq tonalités) ; sur l'arbre de travail elle passe.
- `AGENTS.md` et `art-lab/audio/README.md` mis à jour.

### Mesures — [OK]
- Ressemblance, même outil : hors thème, 7,7 % des tournures de six notes entendues ailleurs (55 sur 714 ; SN8 7 %, SN7 19 %). Hors du tournoi : quatre tournures au plus par paire, aucun bloc de deux mesures recopié, pas de fanfare. Entre les quatre morceaux du tournoi : midi et duel 5 tournures ; midi et finale 5 blocs (la fanfare et le refrain) et une suite d'accords ; duel et rival 3 blocs et 4 suites (le rival cite le riff du héros). Sept tonalités estimées ; toniques écrites : ré (le tournoi, le titre, la nuit), sol, fa, do, la, si bémol.
- Rendus : 721 s entiers (12,0 minutes), 584 s de boucles ; les jointures de `duel` (19 % de la crête) et de `finale` (28 %) tombent comme en SN7 dans une attaque de batterie, sous le plus grand saut naturel du morceau (32 % et 62 % de lui).
- Poids en Opus, mesuré comme en SN7 et SN8 : les huit boucles simples 6,34 Mo, les trois combats en trois couches 3,67 Mo, les jingles 0,5 Mo : **10,51 Mo**, sous les 12 de SA-17.
- Validation : 382 tests, `npm run typecheck`, `npm run build`, `npm run art:validate` passent ; aucun fichier de `src/` ni de `public/` ne change, aucun fichier audio dans le dépôt.

### Limites
- La journée enchaînée de la fiche contenait le midi de SN8 : la journée réelle, avec le midi de SN7, n'a pas été réécoutée telle quelle. Les morceaux du matin, de la fin de journée et de la nuit ne reprennent plus le motif de midi, ce qui était l'essentiel du copier-coller.
- Rien n'est cuit ni branché ; le moteur joue toujours `tune()`.

### Où reprendre
- Le lot de cuisson (R-SUITE) : un manifeste par fichier avec l'approbation de l'opérateur mot pour mot, Opus en WebM et AAC en M4A dans `src/audio/baked/`, branchés derrière `flags.v2` selon le plan des lieux (C-LIEUX), trois couches sur les trois combats (C-COUCHES), la page de test Safari (C-SAFARI), les introductions des combats.

### Pensée
- L'oreille tranche contre la mesure : pour quatre morceaux, la version qui ressemble le plus aux autres a gagné. Le garde-fou garde la règle là où l'opérateur l'a voulue et nomme l'exception dans une liste, au lieu de la cacher dans un seuil relevé.

## Passe SN10 — Le lot de cuisson : le groupe dans la version 2 (2026-11-03)

### Demande
- R-SUITE « Cuire et brancher dans la version 2 » (Passe SN9), lot confié par la séance mère : cuire chaque morceau du catalogue en Opus (WebM) et AAC (M4A) sous manifeste, le brancher derrière `flags.v2` selon C-LIEUX avec trois couches sur les combats (C-COUCHES), les introductions des combats, la page de test Safari (C-SAFARI), les preuves du dépôt, puis une fiche d'essai. Les quatre morceaux du tournoi ne changent pas.

### L'approbation des manifestes
- `tools/audio/validate.mjs` exige `approved: true` et l'approbation de l'opérateur mot pour mot. La carte R-SUITE disait : « L’étape suivante cuit les morceaux sous manifeste, avec ton approbation mot pour mot, les branche derrière `flags.v2`, et te donne l’essai en jouant ». L'opérateur a choisi « Cuire et brancher dans la version 2 ».
- Lecture retenue : ce choix est l'approbation. Chaque manifeste le cite, avec les choix d'écoute de l'opérateur sur le morceau (par exemple, pour le duel : F-DUEL « Bonne direction », C-BOUCLE « Rien entendu de gênant », R-RETOUCHES « Revenir à l’ancienne version », C-COUCHES « Trois couches sur les trois combats »), et C-LIEUX « Valider ce plan ». Aucun autre mot n'est écrit à sa place. La fiche d'essai lui demande de le confirmer après l'écoute en jeu (E-PROD).

### Fait — [OK]
- **La cuisson** (`tools/audio/band/bake.mjs`, `encode.mjs`) : quatorze morceaux, quarante-huit fichiers dans `src/audio/baked/`, un manifeste par morceau dans `art-lab/audio/manifests/`, et `src/audio/catalogue.json` (longueurs, mesures, couches, introductions) pour le moteur. Huit boucles simples, trois combats en trois couches avec leur introduction, le titre avec la sienne, trois jingles.
  - Les couches portent le gain que la dynamique du master a donné au mélange entier (`master({ layers })`, `compress` et `limit` notent leur gain) : les trois ensemble sont le master approuvé, alors que les pistes de `--stems` n'avaient ni compression ni plafond.
  - L'introduction (`intro: true` sur la session, `skipped`) est l'autre moitié de la boucle : ce qui précède la boucle et sa résonance, rien du corps, mastérisée avec les niveaux de la boucle (`masterWith`). Elle finit là où la boucle commence (`loopAt`).
  - Encodage bit à bit identique (`-fflags +bitexact`, sans métadonnées) : `bake.mjs --check` rebâtit dans un dossier temporaire et compare chaque fichier à son manifeste.
  - Les rendus existants ne changent pas : `duel` entier, en boucle et ses trois pistes, identiques échantillon pour échantillon à `main` après les ajouts à `session.mjs` et `dsp.mjs`.
- **Le moteur** (`src/audio/`) : `plan.ts` (C-LIEUX : `pieceFor`, `boutPiece`, `ANNOUNCED`, `jingleFor` ; les couches : `moodStep`, `layerLevels`), `align.ts` (où une boucle commence dans ce qu'un navigateur a décodé), `LayerSet` qui boucle chaque piste sur son intervalle et démarre après une introduction, `Sound.band` (l'introduction une fois puis la boucle, ou la boucle reprise où elle était, SA-15), `Sound.sting` (fanfare et jingles hors des baisses sous les coups, la musique 9 dB plus bas sous eux), le K.O. qui arrête la musique en 0,4 s puis le jingle 1,2 s après, le contexte audio à 48 kHz quand le navigateur l'accepte, un format qui ne décode pas qui cède au suivant. `tune()` et ses tables sont retirés : ils ne jouaient que dans la version 2.
- **Les branchements**, version 2 seulement : la ville (`opening` sur la première page d'une partie neuve : le titre), les places (la fanfare aux trois annonces du greffier), l'arène (le morceau par l'étape du tournoi, `ArenaMatch.piece`, la vie des combattants pour la fin de combat ; `?scene=arena&v2=1&music=rival|finale` hors partie). Le jeu par défaut, l'écran-titre et Explore restent muets (SA-16).
- **Le niveau** : `MIX.music` passe de 14,1 dB (réglé pour l'air pincé) à −1,6 dB.
- `.gitattributes` : `*.webm` et `*.m4a` en binaire. Le dossier de travail de la séance n'avait pas de `node_modules` : `three` y est copié (ignoré par git) pour que les tests qui chargent l'arène trouvent le module.
- **Les outils** : le banc hors ligne suit le taux du moteur et attend le chargement des morceaux (`ready()`) ; `render.mjs` rend la musique de chaque lieu à chaque heure et les trois combats ; `analyse.mjs` compare chaque lieu à sa propre musique ; `engine-proof.mjs` lit le moteur contre les fichiers décodés par ffmpeg ; `page-proof.mjs` passe de nuit (le même morceau d'une page à l'autre) et de jour (un morceau neuf repris à son début) ; `decode-proof.mjs` et `safari-page.mjs` sont neufs.

### Défauts trouvés
- [KO → corrigé] **Chrome perdait 24 échantillons au début de chaque Opus** : libopus annonce 312 échantillons de délai (6,5 ms), Chrome lit le CodecDelay du WebM à la milliseconde du conteneur, 7 ms. Mesuré : 2 122 081 échantillons au lieu de 2 122 105, le son en avance de 24 ; Firefox exact. La cuisson écrit 336 échantillons (7 ms) dans le CodecDelay et l'OpusHead et fait précéder le fichier de 24 échantillons de la fin de la boucle. Ogg Opus dans Chrome : 451 704 au lieu de 451 699, écarté.
- [KO → corrigé] **La sortie du moteur retarde tout de 10 ms** (480 échantillons : le compresseur à anticipation et le plafond suréchantillonné). Les preuves de S1 ne comparaient le moteur qu'à lui-même. `engine-proof` le mesure sur un clic avant de lire la musique.
- [KO → corrigé] Le ton d'essai de S1 restait calé sur l'ancien bus musique : 15,7 dB plus bas, la réverbération d'un coup le couvrait (« a heavy blow takes the music down 5 dB: −1.9 »). Il est remonté de la différence.
- [KO → corrigé] **L'alignement par la seule jointure** se trompait sur trois boucles AAC (fin, midi, parvis) quand le décodeur garde le délai du codeur : le codeur abîme légèrement les deux bords de la boucle, et la jointure vraie n'est pas toujours la plus lisse. Règle ajoutée : un décodeur qui a retiré le délai laisse moins d'une trame de rembourrage (Opus 960, AAC 1024) ; une trame ou plus en trop veut dire qu'il l'a gardé. Contrôle négatif : sans la règle, le test d'un amorçage qui prolonge la fin échoue.
- [KO → corrigé] **Le rendu d'un morceau dépendait des morceaux rendus avant lui** dans le même processus : les notes des cuivres et des guitares sont gardées sous une durée arrondie au millième, une note d'un morceau précédent pouvait en remplacer une autre de quelques échantillons. Vu sur `victoire` cuite seule : deux fichiers différents de la cuisson complète. Antérieur au lot. La cuisson oublie les notes entre deux morceaux (`forgetNotes`, `forgetHits`) ; recuisson complète.
- [?] **AAC : la jointure garde l'erreur de bord du codeur.** Sur un ton pur, la marche à la jointure vaut environ −30 dB sous le ton (indice de jointure 9,4 contre 2,3 sur le signal d'origine) ; sur la base du duel, 10,6 en AAC contre 1,4 en Opus. Donner au codeur le contexte circulaire puis couper par copie de flux (`-ss`) ne garde pas une liste d'édition à l'échantillon (96 256 au lieu de 96 000). L'oreille tranche sur Safari (E-SAFARI) ; sinon, écrire nous-mêmes la liste d'édition du M4A.

### Mesures
Cuisson finale (chaque morceau depuis sa seule partition), −18 LUFS par morceau. « Jointure » : le saut au tour de boucle rapporté au plus grand saut du morceau.

| Morceau | Boucle | Crête vraie | Jointure | Introduction | Opus | AAC |
|---|---|---|---|---|---|---|
| `titre` | 46,7 s | −2,6 dBTP | 0,02 | 12,0 s, la boucle à 6,667 s | 816 ko | 719 ko |
| `matin` | 65,5 s | −4,0 dBTP | 0,01 | — | 906 ko | 802 ko |
| `midi` | 81,5 s | −4,0 dBTP | 0,09 | — | 1 107 ko | 1 009 ko |
| `fin` | 55,4 s | −3,1 dBTP | 0,02 | — | 769 ko | 680 ko |
| `nuit` | 63,8 s | −4,4 dBTP | 0,02 | — | 862 ko | 785 ko |
| `parvis` | 50,0 s | −3,5 dBTP | 0,06 | — | 708 ko | 621 ko |
| `lices` | 56,8 s | −2,2 dBTP | 0,02 | — | 832 ko | 710 ko |
| `valse` | 41,7 s | −3,8 dBTP | 0,06 | — | 515 ko | 513 ko |
| `duel` (3 couches) | 44,2 s | −5,4 dBTP | 0,32 | 9,4 s, la boucle à 5,526 s | 1 454 ko | 1 250 ko |
| `rival` (3 couches) | 35,9 s | −5,1 dBTP | 0,06 | 3,8 s, la boucle à 2,561 s | 1 157 ko | 1 009 ko |
| `finale` (3 couches) | 42,4 s | −5,2 dBTP | 0,62 | 10,7 s, la boucle à 7,059 s | 1 417 ko | 1 268 ko |
| `fanfare`, `victoire`, `defaite` | 16,1 / 9,6 / 12,3 s | −5,4 / −3,8 / −5,4 dBTP | — | — | 524 ko | 467 ko |

- **Poids** : 11 067 459 octets en Opus (11,07 Mo, 10,55 Mio), 9 832 004 en AAC (9,83 Mo) ; un joueur ne charge qu'un format (SA-17 : 12 Mio au plus par format, `validate.mjs`). Les débits nominaux de SN7 (96 kb/s, 80 et 64 pour les couches) ; Opus en débit variable dépasse un peu le nominal, d'où 11,07 Mo contre les 10,51 Mo estimés en SN9 (dont 0,57 Mo d'introductions). Le paquet de production sort les 48 fichiers en ressources à part, la page d'entrée n'en nomme aucun ; la page charge seulement les fichiers du morceau joué.
- **Reproductibilité** : `bake.mjs --check` 48 fichiers sur 48 identiques ; un sous-ensemble cuit dans un autre ordre (défaite, victoire, rival) 12 sur 12.
- **Décodage** (`decode-proof.mjs`) : Chrome 156, les 48 fichiers à l'échantillon exact ; Firefox 159, 42 exacts et six Opus d'un échantillon plus courts (`fin`, `lices` et quatre non bouclés : la boucle tourne un échantillon plus tôt, 21 µs) ; les 34 boucles retrouvées à leur vrai début sur des décodages qui gardent les délais (AAC 1024, Opus 336), 82 vérifications sur 82 dans chaque navigateur.
- **Mélange** (`analyse.mjs --check`, rendus du moteur) : chaque lieu à chaque heure entre −18,5 et −18,9 LUFS, la musique 3,8 à 5,2 dB au-dessus de l'ambiance (cible 3 à 6) ; duels −17,2 et −17,4 LUFS avec la musique ; à plein volume −1,0 dBTP, aucun échantillon au-delà de 1. Tout passe. `MIX.music` −1,6 dB.
- **Moteur** (`engine-proof.mjs`, 25 vérifications sur 25) : le retard de sortie 480 échantillons ; l'introduction et la boucle du duel à 0 échantillon de décalage, part inexpliquée 0,00 % ; la valse tourne à 41,849 s sans marche ; les couches suivent la séquence adverse sur la mesure (1,00 / 0,00 / 0,99 puis 1,00 / 1,00 / 0,00) ; le K.O. donne la victoire ou la défaite, la musique coupée ; la fanfare fait baisser le matin de −9,0 dB.
- **Pages réelles** (serveur DEV, Chrome) : `hooks-proof` passe ; `page-proof` : le morceau de la nuit repris d'une page à l'autre (3,86 s puis 6,82 s), le parvis puis les lices de jour, les lices à leur début (2,10 s), un onglet sans geste muet.
- **Dépôt** : `npm test` 385 sur 385 (dont le plan, les couches, l'alignement sur des décodages synthétiques, les manifestes ; trois fautes injectées, chacune attrapée), `npm run typecheck`, `npm run build`, `npm run art:validate` (14 manifestes de son, 0 erreur).

### Limites
- **Personne n'a écouté le résultat en jeu.** Les règles des couches, le délai du jingle et la baisse sous la fanfare sont des propositions.
- **Safari n'est pas essayé** : Chrome 156 et Firefox 159 seulement, Edge n'a pas démarré sans tête.
- Le rival et la finale ne s'entendent en partie qu'au sixième, huitième et dixième jour ; pour l'essai, `?scene=arena&v2=1&music=rival|finale`.
- Le rembourrage de la fin d'un Opus et le délai d'un AAC sont retrouvés par la longueur et la jointure ; un décodeur qui couperait le délai d'Apple (2112) sans liste d'édition perdrait des échantillons au début : la page Safari le signale (« coupé »).
- Les extraits de la fiche sont des rendus du moteur hors jeu.

### La fiche d'essai et la page Safari
- **Fiche d'essai** : page privée https://claude.ai/artifact/3fVUHipEEnncBcjcM3waeF, source `briefs/fiche-son-essai.html` (la logique de la fiche SN9 gardée : choix enregistrés, relus), trois extraits MP3 des rendus du moteur publiés avec la page, pas dans le dépôt. Dix cartes : E-LIEUX, E-NIVEAU, E-COUCHES, E-INTRO, E-KO, E-FANFARE, E-TITRE à l'oreille ; E-SAFARI, E-PROD (la confirmation de la production), E-SUITE (S2 puis S3). `decisions` relu vide à la publication. La fiche dit comment jouer (serveur DEV, adresses des états nommés et de l'arène).
- **Page Safari** (C-SAFARI) : page privée https://claude.ai/artifact/Vz8D8hGPA8VfiVELmjBtrS, construite par `tools/audio/safari-page.mjs` (les vrais fichiers en `data:`, l'alignement du jeu, un ton pur de 2 s codé comme la cuisson), version 2 republiée avec les fichiers recuits. Elle mesure ce que Safari décode, fait écouter six jointures et enregistre le relevé dans `results` (relu vide). Vérifiée dans Chrome et Firefox sans tête, à 390 px : rien ne déborde, aucune erreur ; Safari lui-même non essayé.

### Où reprendre
- Relire la fiche (`decisions`) et la page Safari (`results`) quand l'opérateur les dit remplies ; consigner mot pour mot ; n'agir que sur ce qui est décidé. Si Safari entend la jointure AAC : la liste d'édition écrite par la cuisson.

### Pensée
- Une boucle cuite n'est juste que dans le navigateur qui la décode : le même fichier, exact dans Firefox, perdait 24 échantillons dans Chrome. Elle se prouve contre le décodage de chaque navigateur et contre la sortie du moteur, pas contre le fichier qu'on a écrit.
- Une preuve qui compare le moteur à lui-même ne voit ni un retard ni un décalage : il faut un témoin extérieur, ici les fichiers décodés par ffmpeg et un clic à une place connue.
- Une clé de cache qui arrondit rend un calcul dépendant de l'ordre. Un contrôle de reproductibilité sur un sous-ensemble l'a montré, le contrôle complet passait.

