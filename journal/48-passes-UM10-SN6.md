# Journal de bord — archive : passes UM10, UM11, SN4, SN5, UM12, SN6 (2026-11-02)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-11-03 (Passe SN10) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe UM10 — La revue de l'opérateur sur l'équipement, et l'audit de structure des autres écrans (2026-11-02)

### Demande
- L'opérateur, sur une capture de la page de Maître Corvin, mot pour mot : « Oui je trouve cela mieux, avec les informations utiles et bien integre, comme le comparative de stats lors de l'achat d'equipement. et globalement on a un UI epure qui sera vite comprhensible au jouru, on est sur la bonne ligne, donc les autres UI respectent aussi cette structure ? si oui on valide ».
- La validation est conditionnelle : elle n'est pas consignée comme acquise. Cette passe répond à la condition. Aucun code changé.

### Méthode
- `main` à `2a9786c`, serveur DEV, partie de version 2 (`tools/play-shots.mjs`, `tools/arena-scene-shots.mjs`, `npm run shots`) : 19 écrans ou états à 1920 x 1080 (la nuit, le crépuscule, midi selon l'écran) et 4 à 1280 x 720, regardés un par un. Ce sont des images de revue, pas des preuves au pixel.
- Non regardés dans cette passe : les tailles de téléphone, le jeu par défaut (même code, sans G ni K), l'écran de fin de partie, les cinématiques, un dialogue à plusieurs choix.

### Résultat — [OK] le style, [KO] la structure de lecture à trois écrans
- **Le style est uniforme partout** : voile, filets d'un pixel, angles carrés, Marcellus et Source Sans 3, ivoire, encre et un accent, touches en contour, un ton par moment du jour.
- **La structure de la page d'équipement (la liste, et le détail de la ligne sélectionnée) n'existe que là.** Elle n'a pas à être partout : un menu de neuf lignes n'a pas de détail à montrer. Elle manque là où le joueur compare ou cherche.

| Écran | Structure | Écart |
| --- | --- | --- |
| Titre, chargement, exploration, dialogue, duel, pause | Adaptée | Aucun |
| Menu, carte, son | Liste courte, suffisante | La sortie seule (ci-dessous) ; les curseurs du son gardent le pouce et la piste arrondis du navigateur |
| Fiche de match | Deux colonnes, l'adversaire et les quatre compétences | Rien sur l'effet des compétences |
| **Compétences (K)** | Une liste seule | Niveau, famille, charge, PA, **rien sur ce que fait la compétence** ; les quatre choisies sont toutes dans l'accent, on ne distingue plus la ligne active. C'est le défaut de simplisme que la Passe UM9 a corrigé pour l'équipement |
| **Tournoi (T)** | Une colonne | Colonne du rang trop large ; règles en texte continu sous le tableau ; à 720p, résultats et bouton sous le bas de l'écran |
| **Journal (J)** | Une colonne | Date répétée sur chaque entrée au lieu de grouper par jour ; à 1080p, 30 entrées et le bouton hors de l'écran, le titre collé en haut |
| **Ici (Q)** | Une bande | Liste coupée au milieu d'une ligne, bouton de fermeture hors de l'écran, rien ne dit qu'il y a une suite |
| Équipement et achats (Passe UM9) | La référence | **La même coupure** : sur la capture de l'opérateur, la dernière ligne (« Iron ring ») est tranchée |

- **La sortie a cinq formes** : `Esc` à droite de la ligne (menu), `Esc` à gauche dans la liste (carte, son, dialogue), `Esc` en pied de page (équipement), `Q` en fin de liste (ici), un mot sans touche (compétences, tournoi, journal, résultat ; Esc y marche, rien ne le dit).
- Une compétence n'a aucune description dans les données, mais ses nombres y sont (`NEW_SKILLS`, `src/combat/skillbook.ts` : dégâts, résistance, protection, renfort, durée). Le détail peut se lire dans les données du duel, comme la comparaison de la Passe UM9, sans règle dans l'interface et sans texte à inventer pour les nombres.
- Pas un écart : les textes français de l'arène ne viennent que de la page d'essai `?scene=arena`, hors partie ; dans un combat de la partie, tout est en anglais. La superposition « Victory » et « Cité du Tournoi » de la capture du K.O. est un artefact de l'outil, qui saute au moment scripté pendant le chargement.

### Recommandation, en attente de l'opérateur
- Un lot d'interface, sans image neuve : le détail de la compétence sur K et sur la fiche de match, le tournoi et le journal réorganisés, une seule forme de sortie, un seul traitement des listes qui défilent.
- Menu, carte, son, titre, exploration et duel gardent leur structure.

### Pensée
- `tools/ui-text.mjs` compte une ligne tranchée par un défilement comme « covered », pas comme une faute : la Passe UM9 a passé 23 pages sur 23 avec cette coupure sous les yeux. Une mesure dit ce qu'elle mesure ; regarder la page reste une étape.
- « Cohérent » a deux sens. Le même style se vérifie par des jetons ; la même façon de lire se vérifie en demandant, écran par écran, ce que le joueur y décide.

### Incident — [OK] réparé : le journal réécrit en LF par le premier commit de cette passe
- `c51396f` a remplacé toutes les fins de ligne de `JOURNAL.md`, de CRLF à LF : 1155 ajouts et 1118 retraits pour 37 lignes écrites. Vu dans la statistique du commit, après la fusion dans `main`.
- Cause, mesurée octet par octet : cinq lignes de la Passe UM8 (263 à 267) finissaient par `CR CR LF`, écrites par moi. Un CR isolé fait passer le fichier de l'index pour binaire, git ne reconnaît plus un fichier CRLF à garder, et `core.autocrlf=true` convertit tout au `git add`. L'outil d'édition, lui, avait déjà ramené ces lignes à CRLF.
- Réparation par un commit normal, sans réécrire l'historique : `git -c core.autocrlf=false add --renormalize JOURNAL.md`, le fichier de nouveau en CRLF sur toutes ses lignes, sans `CR CR LF`, ce qui retire le piège pour la suite. `origin/claude/sound-fusion` a gardé CRLF.
- Pensée : lire `git diff --stat` avant le commit, pas après. Un journal qui change sur plus de lignes qu'on n'en a écrit se voit d'un coup d'œil.

## Passe UM11 — Les écrans alignés sur la page de l'équipement : compétences, tournoi, journal, une seule sortie, des listes jamais tranchées (2026-11-02)

### Demande
- L'opérateur, sur la recommandation de la Passe UM10, mot pour mot : « Oui, aligne-les ». Lot sans image neuve. Sa validation d'ensemble reste à donner : elle attendait ce lot, elle n'est pas consignée ici.

### Fait — [OK]
- **Le socle commun** (`src/ui/style.ts`) : un seul pied de page (`footBtn`, `fillFoot`), l'action de la page avec sa touche à gauche, la sortie avec `Esc` à droite, hors de ce qui défile ; un seul traitement de ce qui défile (`scrollFade`) : le contenu s'efface en fondu au bord, en haut et en bas, une ligne n'est plus tranchée et on voit qu'il y a une suite ; `scroll-padding-block` garde la ligne sélectionnée hors du fondu au clavier. Le CSS de la page de l'équipement passe dans le style commun (`.pm-two`, `.pm-goods`, `.pm-detail`...), `pickRow` aussi.
- **Compétences (K) et fiche de match** (`src/ui/skills.ts`) : à droite la liste, un carré plein pour les quatre emportées, et pour la ligne sélectionnée ce que fait la compétence, ses chiffres et ceux du niveau suivant, la façon de l'obtenir ; à gauche le héros ou l'adversaire, et la charge telle que ces quatre la composent, palier par palier. Les chiffres sont ceux du duel (`skillFigures`, `chargeLadder`, `nextLevel`, `src/simulation/preview.ts`), jamais une règle de l'interface. L'accent sert à la ligne sélectionnée seule : avant, les quatre lignes choisies étaient toutes en or.
- **Tournoi (T)** (`boardPage`, `src/ui/board.ts`) : à gauche la phase, la prochaine échéance et le classement ; à droite le combattant sélectionné, le prochain adversaire d'abord : son visage, sa fiche, ses combats à venir et joués, puis les règles.
- **Journal (J)** (`src/ui/journal.ts`) : les jours à gauche, avec le résultat du combat du jour ; à droite ce qui s'est passé ce jour-là, moment par moment, dans l'ordre. La date n'est plus répétée à chaque ligne, et toutes les entrées sont là (la limite de 30 disparaît).
- **Les listes courtes restent des listes** : menu, carte, son. Le son a des curseurs dans le système, angles carrés, valeur affichée.
- **Ici (Q)** : les absents tiennent sur une ligne (« Not around at this hour: ... »). Le dialogue et Ici prennent le pied commun.
- **Trois défauts trouvés en route**, corrigés : `Esc` ne fermait pas la page du son quand un curseur avait le focus ; `Esc` sur l'écran de fin ne suivait pas le bouton qu'il portait ; sur K, quitter par `Esc` perdait le choix des quatre, qui ne s'appliquait que par le bouton : il s'applique dès qu'il y en a quatre.
- **Sur la fiche de match**, `Entrée` entre dans l'arène depuis n'importe quelle ligne, et `Espace` ajoute ou retire la ligne : le trajet rapide de Q à l'arène reste deux fois `Entrée`.

### Preuves
- `npm test` **358 / 358** dont `tests/ui-pages.test.mjs` (chiffres d'une compétence à chaque niveau contre les données d'un combat, avec l'équipement ; paliers ; niveau suivant contre le refus réel de l'entraînement ; journal et tableau sans perte ; un pied, un fondu), `npm run build`, `npm run art:validate`.
- `tools/ui-text.mjs` tient maintenant pour faute une boîte qui contient plus qu'elle n'en montre sans son fondu. Témoin : le fondu retiré sur la liste de Maître Corvin, la page échoue (`no fade`). Le premier témoin n'échouait pas : retiré trop tôt, le fondu était remis par le code. Le passage complet a trouvé le pied de la fiche de match en débord sur téléphone, corrigé (`flex-wrap`).
- `tools/ui-contrast.mjs` : 40 pages à 1920 x 1080, 1280 x 720, 812 x 375 et 390 x 844, aux quatre moments, les deux jeux : plus bas **4,75:1** (« coins » de l'état, à midi en 812 x 375, écran non retouché ici), aucune page sous 4,5:1.
- `play-day`, jeu par défaut et `V2=1` : T, J et K au clavier, relecture Node identique. `play-flow` sur le paquet de production : victoire, défaite, `V2=1`, la fiche de match franchie à `Entrée` ; aucune erreur de page.
- Coût du fondu sur le 780M, 1080p, `fps=off`, GPU saturé (98-99 %), quatre tours, serveur DEV, sur la plus grande boîte qui défile (le détail du journal, 800 x 700 environ) :

| Page | ms par image, médiane des tours | images/s par tour |
| --- | --- | --- |
| Nuit B | 8,0 | 119,0 / 121,8 / 121,9 / 122,2 |
| Carte, nuit | 8,25 | 112,9 / 123,2 / 123,5 / 114,4 |
| Journal, fondu actif | 7,75 | 120,7 / 111,4 / 134,2 / 131,9 |
| Journal, fondu retiré | 7,4 | 116,9 / 130,8 / 135,8 / 132,0 |

- Le fondu : 7,3 contre 7,2 et 7,4 contre 7,4 ms sur les deux tours stabilisés. L'écart de la médiane vient du tour 2, où la page avec fondu a un accroc isolé de 188 ms, non reproduit. E24 : les pages du lot ne coûtent pas plus que la carte ni que la nuit B de la même série ; même réserve qu'en Passe UM9, pas tranché sur le paquet de production, où les états nommés n'existent pas.
- Non rejoué : `title-proof` et les preuves au pixel, aucun code de scène n'ayant changé.

### Ce qui reste
- La page jouable est republiée à la même adresse depuis ce code (version 4), sans avoir été ouverte dans la visionneuse de claude.ai.
- L'opérateur n'a pas essayé ce lot. Toucher reste hors de la tranche (E30). Non regardés : l'écran de fin de partie et les cinématiques, dont le code change peu (le pied seul pour la fin).
- Le texte d'une compétence est fait de ses chiffres, sans phrase d'auteur ; les icônes restent le choix de l'opérateur.

### Pensée
- Un témoin qui passe n'est pas un témoin : celui du fondu ne prouvait rien tant qu'il ne faisait pas échouer la mesure.
- « Aligner » ne voulait pas dire tout mettre sur deux colonnes : une page mérite le détail là où le joueur choisit ou cherche, un menu de neuf lignes reste un menu.
- Ranger la page révèle ce que l'ancienne cachait : le choix des quatre perdu à `Esc` et la sortie sans effet sur un curseur existaient depuis longtemps, sans jamais avoir de forme visible.

## Passe SN4 — La fiche du lot relue : S0-S1 à reprendre, le jazz fusion comme orientation (2026-11-02)

### Demande
- Message de l'opérateur, mot pour mot : « j'ai rempli la fiche mais on doit tout de meme bien travailler nos sons afin qu'ils soient captivant et optimal, RPGCards a bien fait son travail avec une direction tres Lo-Fi Jazz, il faut que notre jeu s'oriente vers une identite concrete aussi avec des inspirations : Final Fantasy VIII / Nobuo Uematsu / Orchestral + rock / Variété extrême : classique, rock, waltz, influences cinématographiques ; Chrono Cross / Yasunori Mitsuda / Folk / world music / Guitares acoustiques, percussions ethniques, atmosphères émotionnelles ; Breath of Fire III / Akari Kaida, Yoshino Aoki / Jazz fusion / Ambiance urbaine, synthés, rythmes modernes (connaissance générale) je trouve que le jazz fusion peut etre une bonne orientation globale ». La liste des trois jeux est collée par l'opérateur ; les barres et les points-virgules séparent ses cases.

### La fiche du lot
- Page privée https://claude.ai/artifact/McPDaVNx9o82nkieURh1Wx, source `briefs/fiche-son-lot1.html`. Relue par `list` : 10 documents sur 10, aucune note.

| # | Décision | Choix de l'opérateur |
|---|---|---|
| S0-1 à S0-4 | Écoutes du lot S0 | « Bonne direction » |
| S1-1, S1-2 | Écoutes du lot S1 | « Bonne direction » |
| S0-N | Le niveau général | « Garder −18 » |
| SA-11c | La foule | « Code d’abord, CC0 en complément » |
| S2-O | L'outil pour cuire | « Installer ffmpeg (développement) » |
| S2-G | Lancer le lot S2 | « Reprendre S0-S1 d’abord (en note) » |

### Ce que ces choix veulent dire
- Les six écoutes sont bonnes : le travail technique de S0 et S1 reste. La reprise de S2-G n'a pas de note sur la fiche : son contenu est le message ci-dessus, l'identité du son, qui manque. S2 ne démarre pas.
- **SA-4 change d'orientation** : « Les ménétriers de la Cité » laisse la place au jazz fusion comme orientation globale. La phrase de l'opérateur dit « peut etre » : le genre est le cap de travail, et il se confirme à l'oreille sur la fiche suivante. SA-2 (le motif « Le Tournoi », « Motif et son : bonne direction ») n'est pas remis en cause : ses notes restent la matière du thème.
- **Le contrat maître** ne fixe aucun genre : `contracts/PROJECT_MASTER_CONTRACT.md` parle de « l'énergie d'un grand festival urbain », aucun verrou n'est touché.
- **RPGCards** sert de repère de méthode, nommé par l'opérateur : lu en lecture seule (ADR 047, contrat M13), aucun code ni décision n'en est importé. Ce qu'on en retient : un thème écrit et ses versions, des instruments calculés plutôt que des oscillateurs, un contrôle sans oreille par des rendus mesurés, une écoute par lot. L'identité reste la nôtre : RPGCards sonne swing et lounge, nous visons le 16e droit, l'électrique et les mesures composées.
- **SA-9, SA-12, SA-13, SA-16, SA-17 tiennent** : partitions écrites ici et synthèse, aucune génération audio, derrière `flags.v2`, 12 Mo au plus.

### `ffmpeg` — [OK] installé (S2-O)
- Build 9.0.2 essentials de gyan.dev (`ffmpeg-9.0.2-essentials_build.zip`, 114,8 Mo), lien donné par ffmpeg.org pour Windows, SHA-256 `60f46726…47ba` vérifiée contre celle que publie gyan.dev. Hors du dépôt, dans le dossier d'outils du poste, sans toucher au PATH : les outils le trouvent par `FFMPEG` ou le PATH. `libopus` et `aac` présents. Le build 7.1.1 prévu d'abord n'a pas d'empreinte publiée : écarté. `winget` n'existe pas sur ce poste.

## Passe SN5 — L'identité du son : le motif joué par un groupe de jazz fusion, quatre versions, la fiche d'écoute (2026-11-02)

### Demande
- La reprise de S0-S1 décidée en Passe SN4 : une identité concrète, le jazz fusion comme orientation. Constat sur le code : `tune()` (`src/audio/score.ts`) est une marche au hasard sur un mode, avec un bourdon. Il n'y a ni thème, ni groupe : c'est là que l'identité manquait, pas dans le moteur de S0-S1, que les six écoutes ont jugé bon.

### Fait — [OK]
- **L'identité proposée** : un seul thème, les treize notes du motif de SA-2 (`art-lab/audio/scores/theme.mjs`) ; il n'a pas de tierce, la tierce dit l'heure, fa dièse le jour, fa la nuit ; un groupe, piano électrique, basse, batterie, synthé à vent, plus une couleur par moment ; chaque inspiration à sa place, Breath of Fire III à midi, Chrono Cross le matin, Final Fantasy VIII la nuit et en duel. Le style seulement : partitions originales, aucune œuvre reprise.
- **Le groupe** (`tools/audio/band/`, Node seul, aucune dépendance) : chaque note calculée hors ligne à partir d'un modèle : FM pour le piano électrique, partiels à déclin pour les cordes pincées et frappées (basse en cinq jeux, nylon, bouzouki, guitare, vibraphone, marimba), orgue additif, section et cordes en dents de scie à bande limitée, guitare rock dont tout l'accord entre dans une seule distorsion, voix de vent jouées phrase par phrase (`gestures` : glissé, attaque par en dessous, langue, vibrato tardif), vingt et une pièces de batterie et de percussion, plusieurs prises par coup. Salles par convolution d'une réponse calculée, compression, plafond, sonie selon BS.1770. Rendu : 15 à 30 s par morceau.
- **Les partitions** (`art-lab/audio/scores/`) : `midi` (4/4, 106, funk en doubles-croches, le motif en 3-3-2-3-2-3, ré mixolydien, solo qui monte par tierces mineures, unisson de tout le groupe, dernier refrain un ton plus haut), `matin` (6/8, le motif tel qu'il a été écrit, ré majeur, hémiole au milieu), `nuit` (ballade à 64, ré dorien), `duel` (7/8, 2 + 2 + 3, ré mineur, trois couches `base`, `melody`, `tension`, SA-5), `fanfare` (SA-7), `palette` (quatorze instruments seuls).
- **Le contrôle sans oreille** (`tools/audio/band/check.mjs`, `tests/audio-band.test.mjs`, une séance à blanc qui lit les notes sans calculer le son) : le motif dans l'ordre, aucune note tenue un demi-ton au-dessus de l'orchestre, tessitures, tierce de l'heure, justesse des instruments, déterminisme ; `render.mjs --meters` donne la sonie et le spectre par octave de chaque piste.
- **Le voicing suit la mélodie** : une passe à blanc lit le thème, `avoidAt` retire des accords toute note un demi-ton sous une note tenue, comme un arrangeur.
- **`ffmpeg`** (Passe SN4) encode les extraits ; `render.mjs` le trouve par `FFMPEG` ou le PATH, et s'en passe sinon.

### Défauts trouvés
- [KO → corrigé] Les deux voix de vent sortaient des `NaN` : le filtre n'était réglé qu'aux échantillons multiples de 8, une note commençant ailleurs le lisait non réglé. `Svf` se règle dès sa construction, un test le garde.
- [KO → corrigé] 38 frottements au premier rendu (16 midi, 12 matin, 5 nuit, 5 duel) : 0 après `avoidAt`, le changement de `m11` et la refonte du matin (`Bm7` sous un do bécarre). Une note qui débordait de quelques millisecondes sur l'accord suivant faisait écarter une note de trop : `avoidAt` exige 0,1 s de recouvrement.
- [KO → corrigé] Le mélange, lu piste par piste : basse slap aussi forte à 2 kHz qu'à 125 Hz, piano électrique à −27 dB à 2 kHz (son tine mourait en 55 ms), flûte 5 dB au-dessus du reste, charleys trop forts, balais à −30 LUFS. Après réglage, midi par octave depuis 62 Hz : 0, −2,4, −1,6, −4,6, −4,2, −6,5, −8,8, −11, −17,5 dB.
- [KO → corrigé] Une relecture indépendante des partitions, confiée à un agent qui n'entend pas non plus, a trouvé ce que mes contrôles ne cherchaient pas : les notes répétées fondues en une note tenue et 87 joints sur 162 à souffle nul dans la mélodie de midi (des micro-coupures), les degrés de la basse comptés depuis la note de basse sur les accords renversés, un si bémol inventé sur `Cadd9`, des changements d'accord en milieu de mesure que tout le groupe ne suivait pas, une fin de nuit qui sonnait fa majeur, le ré de la fretless coupé net à 3,2 s, la timbale en ré sous un do, le marimba au-dessus de la flûte. Tout est corrigé ; ses propositions de style sont prises : inflexions de la mélodie, unisson de la mesure 27, hémiole du matin, placements du piano de nuit, basse qui marche dans le duel, fin de midi sur le sol dièse, tierce du jour.
- [KO → corrigé] Le service d'artefacts refuse le `.m4a` : les extraits de la fiche sont en MP3. `winget` n'existe pas sur ce poste.
- [KO, sans suite] Un `cd` vers RPGCards dans une commande a déplacé le dossier de la séance : retour immédiat, rien n'a été écrit là-bas.

### Mesures — [OK]
Rendus à 48 kHz, tous à −18 LUFS (S0-N « Garder −18 »).

| Version | Durée | Crête vraie | Plage (LU) | Corrélation | Opus 96 kb/s |
|---|---|---|---|---|---|
| `midi` | 94,9 s | −3,8 dBTP | 3,1 | 0,79 | 1,29 Mo |
| `matin` | 82,3 s | −4,6 dBTP | 5,3 | 0,83 | 1,16 Mo |
| `nuit` | 88,7 s | −4,5 dBTP | 6,0 | 0,69 | 1,25 Mo |
| `duel` | 54,2 s | −5,0 dBTP | 3,0 | 0,75 | 0,68 Mo |

- Quatre versions, 5 min 20, 4,39 Mo : 12 minutes feraient environ 9,9 Mo à 96 kb/s. Cela tient sous les 12 Mo de SA-17, mais au-dessus des 7 à 9 Mo prévus pour la musique par le plan d'audit.
- 0 frottement, le motif dans l'ordre dans les quatre versions, chaque instrument à moins de 5 cents.
- `npm run typecheck`, `npm test` **371 / 371**, `npm run build`, `npm run art:validate` : 61 manifestes, 85 sources, 0 manifeste de son, 0 erreur. **Aucun fichier de `src/` ni de `public/` ne change**, aucune dépendance, aucun fichier audio dans le dépôt : le jeu par défaut et la version 2 sont inchangés. Seul `tools/audio/measure.mjs` exporte son FFT.

### Limites
- **Personne n'a écouté**, ni moi ni la relecture. Ces contrôles trouvent des fautes, ils ne disent pas que c'est beau, que le groove vit, ni que la batterie, les cuivres et la flûte passent pour de vrais instruments.
- Aucune version n'est encore bouclable : `midi` et `duel` se terminent, alors qu'un duel n'a pas de durée fixe. La boucle sans couture d'un Opus reste à prouver au moment de cuire.
- La fin de journée n'est pas écrite : quatre états de jour, trois versions. Rien n'entre dans le jeu : `tune()` joue toujours.
- Sonie au parvis : extrait monté à part, la musique 4,5 dB au-dessus de l'ambiance de S1, pas un rendu du moteur.
- Le Safari réel n'est toujours pas essayé.
- RPGCards a servi de repère de méthode (Passe SN4) : pas de code repris, ce qui laisse ouverte la question de partager ses instruments, si l'opérateur le veut.

### La fiche — à remplir par l'opérateur
- Page privée https://claude.ai/artifact/RkQR5sYPam2S3wTUv2Nycb (source `briefs/fiche-son-fusion.html`), collection `decisions` vide à la publication, onze cartes, huit extraits. À l'oreille : F-MIDI, F-MATIN, F-NUIT, F-DUEL (avec « Garder, mais en 4/4 »), F-PARVIS, F-FANFARE, F-PALETTE. Décisions : F-CAP l'orientation, F-MOTIF le thème, F-SYNTH la source des instruments, F-SUITE l'ordre. Rendu vérifié en local, deux largeurs, huit lecteurs chargés, sans débordement.

### Report sur `main`
- `main` a reçu UM10 et UM11 pendant ce travail, dans `src/ui` et ses tests, sans rapport avec le son. Branche neuve depuis `80e289a`, Passe SN4 rejouée, aucun push forcé, `claude/sound-fusion` supprimée.
- [KO → corrigé] Un `sed -i` sur `JOURNAL.md` a retiré ses CRLF, et `autocrlf` a figé le blob en LF : 1 075 lignes réécrites dans un commit, le même accident que la Passe UM10. Vu au contrôle des fins de ligne, avant toute fusion. Le commit est rejoué sur `claude/sound-identity`, sans push forcé, le journal ajouté par `git -c core.autocrlf=false add`.

### Où reprendre
- Relire `decisions` quand l'opérateur dit la fiche remplie, consigner mot pour mot, n'agir que sur ce qui est décidé. La suite proposée : le catalogue d'abord (SA-6), puis S2 et S3 qui reprennent ses instruments et ses tonalités.
- Avant le premier fichier cuit : Opus en WebM et AAC sur un vrai Safari, boucle sans couture, manifeste.

### Journal — [OK] archivage
- Les passes gardées dépassaient 60 Ko. UM2, UM3, UM4, UM5, UM6, UM7, UM8, closes, partent d'un seul bloc vers `journal/46-passes-UM2-UM8.md` (23760 octets). Preuve : corps de l'archive égal au bloc, chaque passe dans un seul fichier, fins de ligne CRLF gardées.

### Pensée
- Le manque n'était pas là où la fiche le plaçait : S0-S1 sonnait juste, mais la musique n'avait pas de thème. Une demande de « reprendre » se lit contre le code avant de se lire contre le lot.
- Un contrôle ne trouve que ce qu'on lui a dit de chercher : les quatre versions passaient à 0 frottement avec des notes répétées inaudibles et des basses fausses. Une lecture indépendante a coûté peu et trouvé le pire défaut de la passe.

## Passe UM12 — L'interface validée par l'opérateur (2026-11-02)

### Décision
- À la question « L'interface est-elle validée après ton essai ? », l'opérateur, mot pour mot : « Oui, validée ». La condition de la Passe UM10 (« si oui on valide ») est levée.
- Portée : l'interface de `main` à `80e289a` : la direction A « Voile » (Passes UM2 à UM8), l'équipement et les achats (Passe UM9), les écrans alignés sur eux (Passe UM11).

### Ce que cette décision ne change pas
- Ni le statut Gold Master (RJ3), ni le duel par défaut (C2-1), ni la version 2 derrière `flags.v2`.
- Restent à part : les icônes d'objets, au choix de l'opérateur ; le tactile, hors de la tranche (E30) ; les bustes (UM-L4).

### Pensée
- Une validation conditionnelle se consigne comme telle jusqu'à ce que sa condition soit tenue : la Passe UM10 l'a gardée ouverte, et le lot qu'elle a fait apparaître est entré avant l'accord, pas après.

## Passe SN6 — La fiche d'écoute relue : le jazz fusion confirmé, le catalogue d'abord (2026-11-02)

### Demande
- Message de l'opérateur, mot pour mot : « Fiche remplie ».

### La fiche
- Page privée https://claude.ai/artifact/RkQR5sYPam2S3wTUv2Nycb, source `briefs/fiche-son-fusion.html`. Relue par `list` : 11 documents sur 11, aucune note. Toutes les réponses recommandées sont suivies.

| # | Décision | Choix de l'opérateur |
|---|---|---|
| F-MIDI | Midi | « Bonne direction » |
| F-MATIN | Matin | « Bonne direction » |
| F-NUIT | Nuit | « Bonne direction » |
| F-DUEL | Le duel en 7/8 | « Bonne direction » |
| F-PARVIS | Le midi sur le parvis | « Bien placée » |
| F-FANFARE | La fanfare | « Bonne direction » |
| F-PALETTE | Le groupe | « Tous convenables » |
| F-CAP | L'orientation | « Jazz fusion : confirmé » |
| F-MOTIF | Le thème | « Garder le motif » |
| F-SYNTH | La source | « Synthèse seule pour l’instant » |
| F-SUITE | La suite | « Le catalogue d’abord » |

### Ce que ces choix veulent dire
- **F-CAP** remplace SA-4 pour de bon : l'identité du son est le jazz fusion, `AGENTS.md` le dit. **F-MOTIF** : le motif de SA-2 reste le thème de tout le jeu.
- **F-DUEL** garde le 7/8, l'option « Garder, mais en 4/4 » n'a pas été prise. Il reste à l'éprouver en jouant : l'écoute ne dit pas comment il se joue.
- **F-PARVIS** : la musique 4,5 dB au-dessus de la foule est le réglage de départ, dans la cible de 3 à 6 dB.
- **F-SYNTH** : aucune banque d'instruments. Une banque CC0 ne reviendrait que sur la demande de l'opérateur.
- **F-PALETTE** : les quatorze instruments sont acceptés, aucun n'est à reprendre.
- **F-SUITE** change l'ordre du plan d'audit : le catalogue de SA-6 (lot S4) passe avant S2 et S3, qui en reprendront les instruments et les tonalités. Le catalogue annoncé sur la fiche : titre, matin, midi, fin de journée, nuit, parvis, lices, place de la halle en valse, duel, duel de rival, finale et jingles. Rien n'entre dans le jeu avant l'essai de l'opérateur, tout reste derrière `flags.v2`.

