# Journal de bord — archive : passes CX1, CX2, UM1, CX3, CX4 (2026-11-01)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-11-02 (Passe SN3) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe CX1 — Les feuilles de combat ×3 du casting : les cinq poses de charge de Ren, la feuille de Marek dans le duel, 80 cases par page (2026-11-01, en cours)

### Demande
- Séance lancée par la séance des citadins (`local_228dc7b6-…`), à la demande de l'opérateur, mot pour mot : « Citadins mais tu peux faire le combat sur une autre session ». Tâche : les poses de charge de Ren, puis les feuilles ×3 des sept rivaux dans l'ordre X2, chacun en duel sous sa propre figure, le jeu par défaut inchangé. Exception à la règle d'une branche, limitée à deux : `claude/combat-x3-16711f` et `casting-citadins`.
- La clé n'est que dans le dossier principal. Question à l'opérateur, réponse : « Outil du dossier principal (Recommandé) » : `gen-image.mjs` du dossier principal (mêmes octets que le mien), qui lit sa clé seul ; je ne la vois jamais ; images et registre dans son dossier ignoré, les retenues copiées ici.

### La capacité — [OK] tranchée par la mesure, sans décision artistique
- Une page ×3 tient 70 cases de 192 × 288 ; Ren à 39 plus un rival à 34 font 73.
- Mesure sur la feuille de Ren : **aucune image n'utilise les 77 premières rangées** de la case, et une fois sur deux bien plus. Le renderer lit une case comme un rectangle plein, mais la taille de son quad est un paramètre : `{ w: 64, h: 85, foot: 79 }` au lieu de `{ 64, 96, 90 }` enlève les 11 pixels de ville du haut (33 rangées) au quad et à la texture à la fois, le pied reste à sa place, **aucun changement de shader**. Cases de 192 × 255 : 10 colonnes × 8 rangées = **80 cases**, 7 de marge. Les images générées qui restent (le public, les anciens effets) perdent la même part de leur rectangle.
- Une image qui monterait dans les rangées coupées est refusée au chargement.

### Les poses de charge de Ren — [OK] en labo
- Tâche `ren-charge-x3`, une requête, **0,44 $**, deux variantes de huit figures, propres et fidèles du premier coup. Archivée : `ren-combat-x3-2026-11-01-g1`.
- `charge` : lame basse derrière lui, l'image 1 la tête baissée qui souffle (deux figures de la planche, mêmes pieds) ; `chargeHi` : la lame au-dessus de la tête, le bras libre tendu, la seconde image par le souffle du rig ; `chargeGuard` : accroupi, la lame droite devant le visage.
- Les 34 images de la feuille restent **identiques au texel** (0 texel contre l'export commité) après le déplacement de la chaîne dans `rigs/lib/combat.mjs` ; 39 images ; `sheetFrame` et les tests suivent.
- Dans le duel : tenue, la charge joue `charge`, puis `chargeHi` au-delà du palier de la puissante, `chargeGuard` si la garde est tenue (`chargeFrame`, `src/arena/CombatSheets.ts`).

### La feuille de Marek — [OK] en labo, dans le duel derrière `fighterdensity=combat`
- Tâche `marek-x3-combat`, cinq requêtes, **2,07 $** sur 5. Références : la figure propre (`casting-clear-…-a`), G1 panneau 3, deux planches de Ren pour la mise en page seulement. **Fond vert uni** : plus aucun trou dans l'acier, contrairement au fond gris de Ren. Palette épinglée : `marek-x2-v2`.
- La leçon de RC3 tient : parti d'une planche aux bonnes proportions, le générateur les garde, là où trois essais sur un autre repère avaient échoué.
- 32 images, 27 figures, sans `dodge` (il ne l'a pas). `chromaKey` retire le vert des bords ; `--bg-threshold` à 60 sur fond vert, sinon le fond d'une boîte élargie restait opaque.
- **[KO → corrigé]** une lame plus basse que les semelles posait les pieds en l'air : le bas de la boîte se met sur la ligne de sol de la planche.
- **[KO → corrigé]** la planche D, en 2 × 2, dessine ses figures 27 % plus grandes : son pas suit sa hauteur debout, et le cri, trop large pour la case, perd 30 texels de pointe de lame (`trimTip`), sa lame revenant à la longueur des autres.

### Le corps qui saute — [OK] résolu pour les deux combattants
- La case fixe l'allonge : faire tenir la lame de la coupe de Marek reculait son corps de 52 texels, le défaut relevé sur Ren en Passe RC3. Le recul est maintenant noté image par image (`meta.pushed` du JSON de la feuille, écrit par `build-combat.mjs`) ; le duel avance le sprite d'autant (`show`) et compte ce décalage dans la portée. Vaut aussi pour Ren (fente 52 et 34, coupe 21).

### Les critiques à l'aveugle — deux agents neufs, deux tours de reprise
- **N° 1** (Ren et Marek, feuilles et scène, nuit et midi) : propreté 7, fidélité 8,5, proportions 8, poses 6,5, charge de Ren 7,5, nuit 7, midi 6 ; « à livrer avec corrections ». Relevés : Iron Fall qui plante l'épée au sol, la cape en drapeau au-dessus de la tête sur la puissante, l'étourdi qui se lit comme une reprise, une lame courte à la victoire, deux images aux bottes de cuir, la tête qui gonfle au K.O. et, pour Ren, la tête baissée de la charge basse lue comme de l'épuisement.
- **Reprise** : planche `e` (0,41 $) : les deux coups à hauteur de corps, la cape basse, un vrai étourdi, la lame entière, les bottes d'acier. La charge basse de Ren passe au souffle du rig. Les figures du K.O. de la planche `b`, dessinées plus grandes, ont leur propre pas.
- **N° 2** (Marek repris et Vessa, à l'aveugle) : propreté 7,5 et 7, fidélité 8 et 8, proportions 7 et 7, poses 7 et 6, nuit 5 et 5, midi 5 et 4 ; pas à livrer tel quel. Il mesure des têtes à 25 % de la hauteur contre 34 % pour Ren.
- **[KO → corrigé] Les têtes** : mes mesures et la première critique ne l'avaient pas vu. À la ligne, à même échelle, la tête de Marek fait environ 35 texels contre 43 pour Ren et 42 pour sa feuille de ville : les figures propres dessinent des têtes plus petites que le cast, que les feuilles de ville agrandissaient de 1,3. `growHead` (`rigs/lib/combat.mjs`) agrandit la tête **sur la planche, avant la reconstruction** : elle garde le détail de la source, le menton reste sur le cou, et le corps rend la hauteur (pas × (2/3 + s/3)). Le centre de chaque tête est relevé à la main : [KO] la détection par la couleur de peau prenait les cheveux gris et se trompait sur plusieurs poses. Effet de bord utile : la coupe de Marek ne repousse plus son corps (52 → 0 texel).
- [KO → corrigé] Une boîte agrandie plaçait son coin sur le bord de la planche ou sur un voisin : ce coin sert de couleur de fond, la figure sortait sur un rectangle beige. La boîte ne grandit que là où la tête en a besoin, vers le haut et l'avant.
- La version finale de Marek, têtes comprises, n'a pas repassé de critique : la fiche le dit. Son ampleur à l'écran : à voir en mouvement par l'opérateur.

### La lumière — [?] à la fiche
- À midi le soleil de l'arène (2,9) blanchit l'acier, les cheveux et la fourrure ; la nuit l'armure se fond dans le pavé. Essai DEV `fightershade=` : 0,65 à midi et 1,3 la nuit rendent le dessin. Rien n'est appliqué sans la fiche.

### Le chargement — [OK]
- `src/arena/CombatSheets.ts` : deux feuilles, une texture, leurs images sur les clés des deux sièges, le bord de RC1-2, le cadre coupé, les retours de secours (jamais une image générée à côté d'une feuille). `src/lab/fighterDensity.ts` s'en sert, toujours derrière `import.meta.env.DEV`. DEV `foe=<id>` : un rival sur la page de l'arène.

### La fiche — à remplir par l'opérateur
- Page privée https://claude.ai/artifact/AmWqk2o91ZMBLXsYBC6P7f (source `briefs/fiche-combat-lot1.html`), six cartes : CX-R1 les poses de Ren, CX-M1 Marek, CX-L1 midi, CX-L2 nuit, CX-P1 la production, CX-S1 la recette pour la suite. Collection `decisions` vide à la publication. Rendu vérifié en local (six cartes, quinze animations, aucune erreur de page) : le navigateur intégré n'est pas connecté à claude.ai, et je ne m'y connecte pas.

### Où reprendre
- La fiche relue, consignée mot pour mot, puis : `src/arena/CombatCast.ts` (écrit, gardé hors du dépôt jusqu'à l'approbation : il mettrait les feuilles dans le paquet) et son branchement dans `ArenaApp` sous `rules === 'v2'` ; `DAY_SHADE` et la nuit selon la fiche ; les preuves à 0 px sur les paquets de production ; `play-flow` par défaut et `V2=1` ; `AGENTS.md` et les deux README.
- Lot suivant : Vessa, déjà construite (1,58 $), à reprendre pour ses têtes (`growHead`), son Brace lu comme un coup reçu, sa lame rosée. Puis Orla, Cassius, Ilse, Rhosk et Tobin : invites prêtes (`art-lab/characters/scratch/combat-x3/prompts/rivals.mjs`, dossier ignoré), aucune requête lancée avant CX-S1.
- Restes vus : la longueur de la lame de Marek d'une planche à l'autre (58 à 78 texels), la puissante qui touche Ren bas.

### Pensée
- Avant de chercher où loger une image de plus, mesurer ce que les images laissent vide : 27 % de la case n'était jamais dessinée.
- Une contrainte de cadre n'a pas à devenir une contrainte de corps : le décalage se note et se rend au rendu.
- « Proportions : 8 » d'un critique ne prouve rien : la tête se compare à la ligne, à même échelle, contre le personnage et sa feuille de ville. C'était déjà la leçon de la Passe CA3 ; je l'ai rappelée dans le brief sans l'appliquer à mes propres mesures.
- Une figure qui doit grandir s'agrandit sur la source : la reconstruction fait ensuite le reste, sans texel étiré.

## Passe CX2 — Le lot 1 relu : Ren et Marek en production dans les duels de la version 2 (2026-11-01)

### Les décisions de l'opérateur, mot pour mot
- Fiche https://claude.ai/artifact/AmWqk2o91ZMBLXsYBC6P7f, six documents relus, tous à la recommandation.

| # | Décision | Choix de l'opérateur |
|---|---|---|
| CX-R1 | Les cinq poses de charge de Ren | « Approuvées » |
| CX-M1 | La feuille de combat de Marek | « Production », note : « Sa tete est un petit peu trop grosse mais ce n'est pas marquant » |
| CX-L1 | Le soleil de l'arène sur les feuilles | « 0,65 » |
| CX-L2 | La nuit | « 1,3 » |
| CX-P1 | L'entrée en production | « Ren et Marek ensemble » |
| CX-S1 | La suite | « Même recette » |

- La note sur Marek ne demande pas de reprise : sa feuille reste celle de la fiche. Elle fixe la suite : les rivaux suivants prennent une tête à 1,2 au lieu de 1,3.

### Fait — [OK]
- `src/arena/CombatCast.ts` : les feuilles approuvées, chargées à la demande par un duel aux règles de la version 2 seulement (partie ou `?scene=arena&v2=1`) ; un rival sans feuille garde son art généré ; le visage du rival dans le HUD vient de sa feuille de ville. `cast=generated` garde les générés pour comparer.
- `DAY_SHADE` 0,65 et `NIGHT_SHADE` 1,3 (`shadeFor`). Manifestes `hero-x3-combat` et `marek-x3-combat` approuvés, citation comprise ; leurs seize planches passent sources approuvées.
- Report sur `origin/main` (`227e5d8`, Passes CA6 et CA7) sans réécrire la branche poussée : branche neuve `combat-x3`, seuls `JOURNAL.md` et rien d'autre en commun.

### Les preuves
- **Jeu par défaut inchangé**, paquets de production contre `main` figé, seuil 0, 1080p : arène quatre moments, arène à midi deux moments, `combat=dynamic` trois moments, duel `v2=1&cast=generated` : **0 px**. Ville de nuit et à midi : 117 et 371 px, tous dans un seul rectangle de 73 × 8 px, un compteur de temps à l'écran ; témoin : deux chargements de `main` diffèrent de 346 px au même endroit. Hors de ce rectangle, 0 px.
- **Contrôle négatif** : le duel `v2=1` sous feuilles change 7,5 % des pixels au calme, 34 % sur une frappe avec effets.
- `play-flow` sur le paquet de production : défaut, `V2=1` gagné, `V2=1` perdu : « all checks passed ». `arena-scene-check` par défaut et `v2=1` : aucune erreur, empreinte de `V2_SIM_HASH` retrouvée.
- **GPU** (`tools/perf.mjs`, Radeon 780M, 1080p, quatre tours propres sur quatre, séance au repos) : nuit B **8,77 ms** ; duel nuit 7,65 générés, **7,65 feuilles** ; duel midi 7,02 générés, **6,89 feuilles**. Mêmes appels de dessin. E24 tenu.
- Texture du duel Ren + Marek : 71 cases, 1920 × 2040, 15,6 Mo ; une page en tient 80.
- Paquet : entrée 224 404 octets contre 219 947 (+2 %) : le découpage du paquet range dans l'entrée du code que les feuilles partagent ; [?] sans effet mesuré. Les feuilles ne sont lues que par un duel v2.
- `npm run typecheck`, `npm test` **317 / 317**, `npm run build`, `npm run art:validate` (56 manifestes, 58 sources, 0 erreur). `build-combat --check` identique pour Ren et Marek.

### Journal — [OK] archivage
- Les passes gardées faisaient 63 Ko. FX2 à FX5, closes, partent d'un seul bloc vers `journal/42-passes-FX2-FX5.md` (19 590 octets) ; restent 44,3 Ko. Preuve 8 / 8 : corps de l'archive égal au bloc, chaque passe dans un seul fichier, CA1 à CX2 inchangées.

### Restes [?]
- Tant que leurs feuilles ne sont pas là, Orla, Cassius, Ilse, Rhosk et Tobin portent encore l'art de Marek en duel, et le quad coupé peut rogner la pointe d'une lame générée levée très haut. Disparaît avec leurs feuilles.
- La revue en mouvement de l'opérateur en jeu ; matin et fin de journée vus seulement en image fixe avec le réglage de jour.

### Pensée
- Une branche déjà poussée se reporte sans réécriture : on repart de `main` et on y pose les fichiers, quand les deux branches n'ont que le journal en commun.

## Passe UM1 — L'audit de l'interface moderne : la fiche de 18 choix, A « Voile » remplace « Héraldique pixel » (2026-11-01)

### Demande
- L'opérateur, mot pour mot : « retravailler le UI/HUD du jeu, je veux qu'il soit plus moderne et non retro comme ce qui est le cas actuellement, mais il faut aussi qu'il soit epure et coherent ».
- La séance d'audit (`local_94e3af37-…`) n'a touché aucun fichier suivi : `main` à `be8b340`, ni branche ni commit. Cette passe consigne son résultat, sans code, avant tout changement de l'interface.

### L'audit — [OK]
- Surface couverte par l'interface, recouvrements comptés une fois : ville 19,6 %, terrain d'entraînement 25,0 %, dialogue de Mara 42,2 %, ville au téléphone 38,9 %, dialogue au téléphone 78,5 %, duel 9,5 %, duel au téléphone couché 29,3 %. De 19 à 30 cadres pixel par écran, trois niveaux emboîtés.
- Le code : 277 règles CSS sur 9 fichiers, dont 142 aux deux HUD de duel ; 38 `border-image`, 98 calculs de grille de texels, 20 `pixelated`, 19 usages directs de la police pixel ; quatre noirs hors des jetons. `src/debug/Hud.ts`, `index.html` et le statut écrit par `main.ts` échappent au système. Les couleurs et les tailles sont centralisées, les formes ne le sont pas.
- Sur 12 cadres sans interface, un texte ivoire nu sur le décor tombe à 1,06:1 au pire de jour : il faut un voile d'au moins 58 % ou un aplat.
- Maquettes des trois directions sur captures réelles (`Voile`, `Pavois`, `Lices`), vraies polices : 0 texte sous 4,5:1 sur les quatre états du jour, ville, dialogue, duel, alerte et téléphone, 292 à 344 mesures par direction (5 % les plus défavorables de chaque texte), après réglage des voiles et des alertes.
- Sources de la fiche et maquettes, hors dépôt : dossier de notes de la séance, `ui-moderne/`.

### La fiche
- Page privée https://claude.ai/artifact/AhkbhVkHF8f7r6Qyi8bPDS, collection `decisions`, vide à la publication. Message de l'opérateur, mot pour mot : « fiche remplie ».
- Relue par `list` : 18 documents sur 18, tous à la recommandation, une note. La séance d'audit a lu des clics du 01/11 entre 19 h 12 et 19 h 15 UTC ; la relecture de cette passe lit le même contenu daté du 02/11 à 03 h 25 UTC : la page réécrit ses choix à chaque ouverture (son `write` au chargement), les libellés n'ont pas changé.

| # | Décision | Choix de l'opérateur |
|---|---|---|
| UM-1 | La direction | « A · Voile », note : « Mais j'aime aussi beaucoup la direction Lices » |
| UM-L1 | La direction C « Héraldique pixel » | « Lever » |
| UM-S1 | La police pixel | « Lever la police pixel, garder le principe » |
| UM-S2 | Les cadres pixel en neuf tranches | « Lever » |
| UM-S3 | La palette | « Maintenir, allégée » |
| UM-S4 | 16 px sur ordinateur, 14 px au téléphone | « Maintenir » |
| UM-L2 | Un style dont les tons suivent DayState | « Maintenir » |
| UM-L3 | Le téléphone avec le système de design | « Maintenir » |
| UM-L4 | Visage cuit d'abord, bustes plus tard | « Maintenir » |
| UM-R1 | Les sept touches en haut d'écran | « Un menu unique » |
| UM-R2 | « Here », « Rest » et « Wait » | « Liste à la demande » |
| UM-R3 | Les textes de développeur à l'écran | « Tous les retirer » |
| UM-R4 | L'écran titre | « La vraie ville derrière » |
| UM-R5 | Le HUD d'Explore | « Dans le système, sans mini-carte » |
| UM-T1 | Comment l'introduire | « Remplacer, essai avant fusion » |
| UM-T2 | Le plan par lots | « Valider le plan » |
| UM-T3 | Embarquer les polices | « Oui » |
| UM-T4 | Archiver les images de référence | « Celles de la direction choisie » |

- La note de UM-1 se lisait de deux façons. Question posée : « Que veut dire ta note sur Lices pour la direction A ? », réponse de l'opérateur, mot pour mot : « A seule ». Voile partout ; Lices reste une appréciation, aucun emprunt.
- Le texte de UM-T1 fait foi, mot pour mot : « Remplacer partout sur la branche, sans double style, et te donner l'essai en jeu avant de fusionner. » Il prime sur la fusion sans demander pour le code de cette direction. Cette passe, sans code, n'est pas couverte par cet essai.

### Le plan (UM-T2, texte de la fiche)
- Lot 0, la fondation : jetons, polices, primitives, retrait des cadres. Lot 1, l'exploration : HUD, menu, dialogue, boutique, compétences, équipement, cinématique, titre. Lot 2, le duel : les deux HUD, K.O. et fiche de match. Lot 3, le téléphone et les fenêtres basses. Lot 4, Explore, chargement et textes. Lot 5, le mouvement, l'essai en main de l'opérateur, le journal.
- Le lot 0 et un seul écran, le dialogue, sont montrés en jeu à l'opérateur avant la suite.

### Fait — [OK]
- UM-T4 : les deux images de la direction A archivées à l'octet par `gen-image.mjs --archive`, `ui-voile-town-2026-11-01` (`1fa1825c…`) et `ui-voile-arena-2026-11-01` (`b7c117e3…`), non canoniques. Les quatre images de B et C restent dans le dossier ignoré. `npm run art:validate` : 56 manifestes, 60 sources, 0 erreur.
- `AGENTS.md`, section « Interface » : A « Voile » à la place de « Héraldique pixel », chaque décision levée, maintenue ou allégée sous son libellé exact, et l'état du code tant que l'essai n'a pas eu lieu.

### Échec — [KO]
- `gen-image.mjs` sans `--model=gpt-image-2` : son modèle par défaut, `gpt-image-1`, n'existe plus sur le compte (HTTP 400, six requêtes à 0 $). Le registre de la tâche `ui-modern` compte donc 12 requêtes pour 6 images, 1,1414 $ sur 5 $. L'outil n'est pas changé par cette passe.

### Non mesuré [?]
- Le coût GPU des voiles (budget E24), le temps de démarrage d'un titre sur la vraie ville, le rendu dans le jeu en mouvement. Les maquettes sont des images, pas du code du jeu : leurs contrastes ne valent pas ceux du jeu.

### Pensée
- Une note sur une carte de décision peut changer le sens du choix : elle se tranche par une question avant d'appliquer, même quand le choix est à la recommandation.
- Une date de relecture sur une page qui réécrit ses données à l'ouverture dit quand la page a été ouverte, pas quand on a décidé : c'est le contenu qu'on relit.

## Passe CX3 — Les six derniers rivaux : feuilles construites, en labo, avant leurs fiches (2026-11-01)

### Demande
- Suite de la Passe CX2, CX-S1 « Même recette ». Branche `combat-x3-lot2` depuis `main` (`bd05da3`). Lots : Vessa et Orla, Cassius et Ilse, Rhosk et Tobin.

### Fait — [OK]
- Six feuilles `lab`, générées et construites, en duel derrière `fighterdensity=combat&foe=<id>` : Vessa 34 images (six requêtes, 2,37 $), Orla 29 (quatre, 1,65 $), Cassius 34 (cinq, 2,06 $), Ilse 32 (cinq, 1,98 $), Rhosk 32 (quatre, 1,65 $), Tobin 27 (quatre, 1,58 $). Tâches `<id>-x3-combat`, une requête à la fois, chacune sous son plafond de 5 $.
- Les leçons de Marek entrées dans les invites : coups à hauteur de corps, cape basse, étourdi affaissé, lame entière à la victoire, la lame jamais derrière la tête.
- Les armes : Orla ses deux épées et Rhosk sa hache d'après leurs planches ; Cassius l'épée de sa planche ; Vessa la lame fine, Ilse l'épée, Tobin l'épée courte usée d'après le texte (X4). Rampe d'acier ajoutée aux palettes (`STEEL_RAMP`, `rig.EXTRA`) : leurs feuilles de ville n'ont pas d'arme, une lame sortait rose.
- **Têtes** : la note de l'opérateur sur Marek (1,3 « un petit peu trop grosse ») donne des agrandissements plus légers, réglés sur la mesure contre la feuille de ville à même échelle : Vessa 1,2, Orla 1,1, Cassius 1,15, Ilse 1,2, Rhosk 1 (sa nouvelle figure a déjà la bonne tête), Tobin 1,15. Hauteurs à 2 % des feuilles de ville ; largeur de tête de 0,96 à 1,10 fois, Ren 1,02 et Marek 1,07. Rhosk mesure 1,24, son col de fourrure compté dans la mesure.
- Les feuilles approuvées de Ren et de Marek ne changent pas : `build-combat --check` identique après les changements de la bibliothèque.

### Ce qui a raté
- [KO → corrigé] La tête agrandie courbait une lame fine qui passait près d'elle (Vessa, `strike.0`, `skillSup.1`), vu par la critique : `growHead` laisse désormais l'acier à sa place et prend pour le disque la couleur voisine.
- [KO → corrigé] Un script d'ajustement écrit par heredoc a perdu ses antislashs sans erreur : les pas n'avaient pas changé, Ilse restait à 85 % de sa taille. La mesure à la ligne l'a montré. Ce qui passe par le shell se vérifie sur le résultat.
- [KO → corrigé] Le tri des figures par rangée, à seuil fixe, a mélangé les rôles de Rhosk : la figure debout a pris la place de la préparation.

- [KO → corrigé] `heavy.0` : une lame basse prise pour le pied arrière plaçait la figure 45 à 50 texels en avant de ses voisines, vu par deux critiques. `solesMid` lit les semelles en remontant depuis la dernière rangée ; [KO] cela n'a pas suffi pour Cassius, Rhosk et Tobin, dont la hanche est épinglée sur cette figure.
- [KO → corrigé] La protection de l'acier abîmait le voile ivoire d'Ilse, aussi clair et neutre qu'une lame : fentes et bandeau brisé. Elle est retirée pour elle.
- [KO → corrigé] Le nettoyage des images d'une fiche par regex a supprimé les feuilles des animations (`x3` contient un chiffre).

### Les critiques à l'aveugle — trois agents neufs
| Rival | Propreté | Fidélité | Proportions | Poses | Nuit | Midi | Verdict |
|---|---|---|---|---|---|---|---|
| Orla | 8 | 8,5 | 8 | 7 | 6 | 6,5 | avec corrections |
| Vessa | 7,5 | 8,5 | 7,5 | 6,5 | 5 | 7,5 | avec corrections |
| Cassius | 7,5 | 8,5 | 8 | 6,5 | 6 | 7 | avec corrections |
| Ilse | 6 | 8 | 6,5 | 6,5 | 8,5 | 6,5 | seulement corrigée |
| Rhosk | 7,5 | 8,5 | 8 | 7 | 5,5 | 8,5 | avec corrections |
| Tobin | 7,5 | 6,5 | 6,5 | 6,5 | 5 | 7,5 | avec corrections |

- Repris ensuite : la charge d'épaule d'Orla, lue comme un coup de tête ; le Brace, l'armé, la montée et la victoire de Vessa ; la frappe et le salut de Cassius, qui visait l'adversaire ; la victoire sans visage, l'étourdi trop grand et l'épée perdue d'Ilse ; la compétence défensive de Rhosk ; la frappe sans appui et le soutien de Tobin, qui se masquait le visage. Ces versions finales n'ont pas repassé de critique : les fiches le disent par leurs réserves.
- Restes relevés, gardés : le violet de Vessa et le bleu de Cassius se fondent dans l'indigo de nuit ; le rouge d'Orla vire à l'orange à midi ; sur l'attaque légère de Rhosk la hache paraît courte ; les compétences touchent bas tandis que l'éclat de l'impact reste à la poitrine, comme pour Marek.

### Les fiches — à remplir par l'opérateur
- Trois fiches courtes, deux cartes chacune, collection `decisions` vide à la publication, rendu vérifié en local :
  - lot 2, Vessa et Orla : https://claude.ai/artifact/V7akjyFMavYYGFFv3Pb6dk ;
  - lot 3, Cassius et Ilse : https://claude.ai/artifact/Q9WAdJ2HSqF2tPAzscYAmC ;
  - lot 4, Rhosk et Tobin : https://claude.ai/artifact/6j3Jht6nnBnk4K4bV9x4E8.

### Où reprendre
- Relire les trois fiches ; ajouter à `src/arena/CombatCast.ts` (ses quatre motifs `{hero,marek}`) les feuilles approuvées ; manifestes, paquets et sources comme en Passe CX2 ; refaire les preuves 0 px sur les paquets de production, `play-flow` et le GPU ; vérifier dans la page, rival par rival et moment par moment, qu'aucune clé `marek/side/...` ne reste une image générée ; retirer le fallback de la Passe CX2 dans le journal ; `guardContact` et son commentaire sur « l'art de Marek » dans `src/arena/fx/combatFx.ts` ; `AGENTS.md` et les README.

### Restes [?]
- Tant que leurs feuilles ne sont pas approuvées, ces six rivaux gardent leur art généré dans les duels.

### Pensée
- Une correction locale sur la source touche tout ce qui passe à côté : à tester sur les figures où un objet croise la zone.

## Passe CX4 — Les trois fiches relues : les sept rivaux en production, chacun sous sa propre figure (2026-11-01)

### Demande
- L'opérateur, mot pour mot : « Fiches remplies ». Relues dans les trois collections `decisions`, cliquées le 2026-11-02 entre 04:10 et 04:12 UTC (l'horloge du service) : **CX-Vessa, CX-Orla, CX-Cassius, CX-Ilse, CX-Rhosk et CX-Tobin, toutes les six « Production »**, notes vides.
- La séance mère, pour ces fiches : branche reportée sur `main` sans push forcé, journal dans le même commit, preuves, fusion quand la validation passe.

### Fait — [OK]
- **Report sur `main`** : `combat-x3-lot2` partait de `bd05da3` et `main` avait reçu la Passe UM1. Branche `combat-x3-rivals` depuis `6cafd14`, les fichiers de `combat-x3-lot2` repris tels quels (seul `JOURNAL.md` se recoupait), la Passe CX3 réinsérée après UM1. Aucun push forcé.
- **Six feuilles en production** : `approved: true`, `runtimeUse: production`, le mot de l'opérateur dans chaque manifeste, chaque paquet de provenance à jour, leurs sources archivées passées de non canoniques à approuvées à travers leur feuille. `src/arena/CombatCast.ts` charge les huit feuilles (Ren et les sept rivaux), à la demande, par un duel aux règles de la version 2 seulement. `cast=generated` garde les combattants générés pour comparer.
- **Plus aucun art de Marek emprunté** : dans un duel de la version 2, chaque image des deux combattants vient de leur feuille, `cast=generated` mis à part. Le repli de `CombatCast` (un rival sans feuille garde son art généré) reste pour un rival hors des sept, aucun aujourd'hui. Le quad coupé de la Passe CX2 ne peut plus rogner une lame générée en duel, sauf sous `cast=generated`.
- **La preuve** : `tools/arena-sheet-proof.mjs`, chaque rival dans sa page, les 32 moments puis 60 s de duel simulé, l'image des deux combattants lue à chaque pas. `tools/play-flow.mjs` vérifie désormais, dans une partie de la version 2, la feuille portée par chaque combattant.

### Preuves
- `tools/arena-sheet-proof.mjs` sur le serveur DEV, relancé sur l'état final : **sept rivaux sur sept, 0 image hors feuille**, deux feuilles `production` par duel, visages 32 x 32 dans le HUD ; à midi, une passe plus tôt, pour Vessa et Tobin seulement. Contrôle négatif, `--q=cast=generated` sur Orla, 10 s : code de sortie 1, 2464 images hors feuille.
- **Paquets de production contre `main` figé** (`6cafd14`, seuil 0, 1920 x 1080) : **0 px** sur neuf vues d'arène (la nuit, midi, `combat=dynamic`), sur `v2=1` avec Marek et sur `v2=1&cast=generated`. Ville et midi : 42 et 416 px, tous dans le bandeau de mesure du panneau `[1647, 1069, 1908, 1076]`, déjà vu différer entre deux chargements de `main` lui-même (346 px, Passe CX2). Contrôle négatif : 7,512 % entre la version 2 et `cast=generated` sur la même capture.
- Le lot 1 étant sur `main`, `v2=1` ne change pas (rival Marek) : les rivaux ne se comparent pas à `main` en pixels, ils se prouvent par la feuille portée.
- **`play-flow` sur le paquet de production** : défaut `win` passé ; `V2=1` : `win 1842 2` Vessa, `lose 1842 4` Orla, `win 1842 5` Cassius, chacun avec `hero-x3-combat production` et la feuille du rival, empreinte du navigateur égale au rejeu Node. `arena-scene-check "v2=1"` : code de sortie 0.
- **GPU** (Radeon 780M, 1080p, une seule séance, serveur DEV, trois manches) : nuit B 9,28 ms, duel de Marek 8,32, de Cassius 7,99, de Rhosk 7,93, Cassius à midi 7,06. Un autre programme utilisait le même GPU sur une partie des manches : ces chiffres sont les manches propres, deux sur trois pour la nuit B, une sur trois pour chaque duel. Cassius a 73 cases, le plus haut du casting avec Vessa, et sa texture a la taille de celle de Marek (1920 x 2040). Sous la nuit B, sur une seule manche propre.
- `npm run typecheck` et `npm run build` passés ; `npm test` : 318 tests, 318 passés ; `npm run art:validate` : 61 manifestes, 85 sources archivées, 0 erreur ; `build-combat --check` sur les huit feuilles : toutes reconstruites à l'identique.

### Ce qui a raté
- [KO → commande fautive] `V2=1 play-flow win 7 6` a donné 4 contrôles en échec : la table de l'outil ne connaît que les jours 2, 4 et 5, et la demi-finale du jour 6 n'y est pas (adversaire, titre, nombre de combats). Le combat lui-même s'est joué, sous Vessa, avec la même empreinte que Node. Relancé sur les jours de la table.
- [KO → corrigé] Le contrôle négatif prévu (`v2=1` contre `main`) ne pouvait plus différer : Ren et Marek sont sur `main` depuis la Passe CX2. Remplacé par la capture des feuilles contre `cast=generated`.
- [KO → corrigé] `arena-sheet-proof --q=cast=generated` ne s'appliquait pas : l'option coupait sur le premier `=`, donc le contrôle négatif passait. Tant qu'il n'échoue pas, une preuve ne prouve rien.

### Restes [?]
- Le paquet de production n'a joué que Vessa, Orla et Cassius : Marek, Ilse, Rhosk et Tobin viennent en phase finale selon le tableau. Ils sont prouvés sur le serveur DEV, leurs PNG sont dans le paquet, et le test `combat-cast` vérifie leurs huit motifs.
- La preuve ne montre pas toutes les images d'une feuille : de 23 à 27 par rival (Marek 25 sur 32, Cassius 27 sur 34, Tobin 23 sur 27), 24 ou 25 des 39 de Ren. Celles qui manquent n'ont pas été vues dans le duel par l'outil.
- Les versions finales des rivaux n'ont pas repassé de critique à l'aveugle (Passe CX3), et l'opérateur les a approuvées sur leurs réserves : le violet de Vessa et le bleu de Cassius dans l'indigo de nuit, le rouge d'Orla qui vire à l'orange à midi, la hache courte de Rhosk sur l'attaque légère, l'éclat d'impact à la poitrine sur des compétences qui touchent bas.
- `vessa-x3-combat` était `lab` à la Passe CX2 : il est ici en production, par sa fiche. Rien d'autre du casting ×3 n'attend de décision.

### Pensée
- Quand un lot précédent est déjà sur `main`, le contrôle négatif d'hier devient un 0 px d'aujourd'hui : il faut le réécrire, pas seulement le relancer.
- La table d'un outil dit ce qu'il sait vérifier : un échec hors de sa table parle de la commande, à lire avant de conclure sur le code.
