# Journal de bord — archive : passes UM9, SN1, SN2, SN3 (2026-11-02)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-11-02 (Passe SN7) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe UM9 — L'équipement et les achats : une seule page, le héros, le détail, la comparaison (2026-11-02)

### La décision appliquée
- UM7-3 « Lot à part : héros, détail, comparaison » (Passe UM8), d'après la note de l'opérateur de la Passe UM4, mot pour mot : « je trouve que les menu/panels donc equipement/achat peut etre trop simpliste ». La fiche disait le défaut : ces écrans disent ce qu'on possède, ils n'aident pas à choisir. Aucune image neuve. Les icônes d'objets restent une option de l'opérateur, elles demandent de l'art.

### Fait — [OK]
- **Une page pour les deux** (`src/ui/wares.ts`) : G l'ouvre sur le sac, le dialogue d'un marchand sur ses articles, le sac dessous. À gauche le héros en grand, trois-quarts de la feuille cuite `hero-x2-v4`, ses quatre images de repos en boucle, à échelle entière selon la hauteur de fenêtre, les emplacements du corps et les chiffres d'un combat. À droite la liste, et pour la ligne choisie ce qu'elle change, avant et après, avec les pièces restantes.
- **La comparaison n'a aucune règle à elle** (`src/simulation/preview.ts`) : les chiffres sont lus dans les données du duel construites comme pour un vrai combat (santé, coup puissant, PA de départ, charge), et l'« après » est la vraie action appliquée à une copie de l'état, horloge à part. Elle ne peut donc pas dériver du jeu.
- **Ce que la comparaison révèle** : acheter une arme perd les paliers de la forge (`g.tier = 0`), déjà vrai depuis la Passe V3 et jamais dit à l'écran. La page l'écrit, et le coup puissant baisse dans le tableau quand c'est le cas. Avec deux accessoires portés, une pièce du sac a une ligne par place : on choisit laquelle elle remplace (`equip` le permettait, l'écran non). Un troisième accessoire acheté part au sac, la page le dit.
- **Une ligne hors de portée reste sélectionnable** : ce qu'elle apporterait est ce qui fait économiser. Elle affiche ce qui manque (`12 short`) et le refus de la simulation. Une pièce possédée n'a pas d'« après » (`DONE`).
- **Le dialogue allégé** : une ligne « See the goods », ou « See what the forge can do » pour Bram. Le marchandage, le travail de la forge, les compétences de Corvin et les achats vont dans la page ; Esc ramène au marchand. La même page sert le jeu par défaut (étal de Mara, sans emplacements) : pas de double style (UM-T1).
- **Au clavier** : les flèches parcourent, le détail suit, Entrée agit et la page reste, avec le message de l'achat. Un Entrée tenu depuis le dialogue n'achète pas la première ligne.
- Corrigé au passage : « raise your an imported blade » dans `v2.upgrade.label` et `.log` (l'article de `itemName` après « your ») ; deux étiquettes de coût s'écartaient d'un bout à l'autre de la ligne (`.cost+.cost`, vu aussi dans la liste Q).

### Essais écartés — [KO]
- Comparer sur la ligne d'une pièce possédée : la copie la rachetait, « 95 → 75 coins » et « goes to your bag » sur une pièce déjà portée. D'où `DONE`, et la première ligne sélectionnée à l'ouverture est la première disponible.
- `overflow:hidden` sur le cadre sans marge : `ui-text` signale « cut » sur 17 pages sur 23, la boîte de texte dépassant de 1 à 2 px au-dessus. Aucun glyphe coupé à l'œil, mais la règle est bonne : 6 px de marge haute.
- Mon test de la perte de paliers visait le palier 2 : +16 % contre +15 %, l'arrondi du duel donne le même coup puissant et la ligne n'apparaît pas. Palier 3 dans le test. La comparaison lit l'arrondi réel, c'est ce qu'on veut.

### Les preuves
- `npm run typecheck`, `npm test` **332 / 332** (9 nouveaux, `tests/wares.test.mjs` : les chiffres contre le duel, chaque ligne vendue contre ce que son achat donne vraiment, l'état intact), `npm run build`, `npm run art:validate` (61 manifestes, 85 sources).
- `ui-text` : **23 pages et formats sur 23**, quatre moments du jour, jeu par défaut compris, 1920 × 1080, 1280 × 720, 812 × 375, 390 × 844.
- `ui-contrast`, mêmes 23, deux instants : **6,65:1 au plus bas**. Mesuré avant la marge de 6 px, qui ne déplace aucun texte de plus de 6 px.
- `play-day`, défaut et `V2=1` : la page jouée au clavier, l'empreinte rejouée dans Node identique. `play-flow` sur le paquet de production, victoire, défaite, `V2=1` : tout passe.
- GPU, 780M, 1080p, `fps=off`, quatre tours sans processus étranger, serveur DEV (états nommés) :

| Page | ms par image, médiane | images/s par tour |
|---|---|---|
| Nuit B | 9,86 | 121 · 100 · 102 · 98 |
| Ville de nuit, mode jouable | 10,55 | 103 · 89 · 98 · 91 |
| Carte, page plein écran | 10,61 | 97 · 88 · 92 · 97 |
| Articles de Mara, héros animé | 10,11 | 102 · 101 · 92 · 97 |

### Restes [?]
- Page jouable republiée, même adresse que la Passe UM2 (https://claude.ai/artifact/Xz1bEgcEVWxB2fEhWh2BjR, version 3) : le code de `ca77bb2`, feuilles de la Passe CX4 comprises ; le reste de la Passe UM8 sur ce point est levé. Toujours non ouverte dans le visualiseur de claude.ai : le navigateur intégré n'y est pas connecté.
- E24 : la page des articles ne coûte pas plus que la carte ni que la ville derrière elle dans la même série. Contre la nuit B, +0,25 ms, dans la dispersion des tours, sur serveur DEV : pas tranché sur le paquet de production, où les états nommés n'existent pas.
- La page n'a pas été ouverte par l'opérateur. Le tactile reste hors tranche (E30) : un doigt achèterait au premier appui, sans voir le détail.
- Non capturés : le magasin barré après un vol et la pénurie d'acier. Ils passent par les mêmes lignes et les mêmes refus.

### Pensée
- Une comparaison d'interface ne recopie pas une règle, elle joue la vraie action sur une copie. Le piège du palier perdu était dans le code depuis la Passe V3 : il a fallu afficher le résultat pour le voir.

## Passe SN1 — L'audit du son : la fiche de 18 choix, « Les ménétriers de la Cité », le son cuit avec manifeste (2026-11-02)

### Demande
- L'audit du son et de la musique a été fait le 2026-11-01 sans toucher un fichier suivi : ses rapports, mesures et outils vivent dans le dossier de notes des séances (`audio-audit/`). La séance mère a ouvert cette branche après la clôture du casting (Passe CX4, SA-18) : consigner la fiche, puis les lots S0 et S1. Exception à la règle d'une seule branche, à laquelle l'opérateur consent en lançant la séance : `claude/ui-voile-9516af` reste ouverte, cette séance évite `src/ui`.
- Message de l'opérateur, mot pour mot : « Fiche remplie ».

### La fiche
- Page privée https://claude.ai/artifact/2tE8Uuwh5Xmrw5zJWsgZyR, source `briefs/fiche-son.html`. Relue par `list` : 18 documents sur 18, cliqués le 2026-11-01 entre 19 h 20 et 19 h 23 UTC, conformes à la relecture de la séance d'audit. Les trois écoutes n'avaient pas de recommandation ; les quinze autres choix sont à la recommandation.

| # | Décision | Choix de l'opérateur | Note, mot pour mot |
|---|---|---|---|
| SA-1 | Prototype d'ambiance | « Bonne direction » | « prototype est bonne » |
| SA-2 | Motif et thème | « Motif et son : bonne direction » | — |
| SA-3 | Prototype de duel | « Bonne direction » | — |
| SA-4 | Identité musicale | « Les ménétriers de la Cité » | « Mais j'aime beaucoup les inspi Breath of fire 3, Chromo trigger et Final Fantasy 8 et 9 » |
| SA-5 | Musique des duels | « Oui, par couches » | — |
| SA-6 | Catalogue | « 12 morceaux, 12 min » | — |
| SA-7 | Annonces | « Fanfare et texte » | — |
| SA-8 | La règle « tout par le code » | « Elle bouge : cuit, avec manifeste » | — |
| SA-9 | D'où vient la musique | « Partition + synthèse et CC0 » | — |
| SA-10 | Compositeur humain | « 0 € : décider après l’essai » | — |
| SA-11 | Effets et ambiances | « Code + CC0 enregistré » | — |
| SA-12 | Outils de génération | « Idéation seulement » | — |
| SA-13 | Dépôt public | « CC0, CC BY, MIT et nos sons » | — |
| SA-14 | Correctifs S0 | « Dès qu’une branche est libre » | — |
| SA-15 | Musique entre deux pages | « Reprise avec fondu » | — |
| SA-16 | Portée | « Derrière flags.v2 seulement » | — |
| SA-17 | Poids | « 12 Mo au plus » | — |
| SA-18 | Calendrier | « S0-S1 après les personnages » | — |

### Ce que ces choix veulent dire
- **SA-4** : la note ajoute un registre d'inspiration, en style seulement (mélodies qu'on retient, leitmotifs). Aucune œuvre n'est reproduite.
- **SA-8** : la décision AV-17 donnait le son sans fichier audio. Le son reste écrit dans le dépôt, partitions et recettes, et peut être cuit au développement en fichiers compressés sous manifeste de provenance, comme les feuilles de sprites. Faits dans cette passe, avant tout son cuit : `AGENTS.md` (section « Sound »), le test « no audio file » de `tests/v2-sound.test.mjs`, le texte `v2.sound.sub`, texte de la version 2 seulement. Aucun fichier audio n'entre dans le dépôt ici.
- **SA-11** : la recommandation réservait le CC0 enregistré au cas où SA-1 ne convaincrait pas, et SA-1 a convaincu. Lecture à confirmer à l'opérateur au lot S2 : la foule par le code d'abord, le CC0 en complément.
- **SA-12** : aucune génération audio dans le jeu ni dans le dépôt. Une exception passerait par sa décision et le manifeste.

### Ce que couvrent les lots, selon la fiche
- **S0, correctifs** (1 séance, 0 Mo) : bruit réparé, sonie cible, limiteur, stéréo, les quatre effets jamais joués branchés (`click`, `open`, `coin`, `step`), variation des coups, paliers et relâchés justes. Cibles : −18 LUFS à la sortie, crêtes à −1 dBTP, musique 3 à 6 dB au-dessus de l'ambiance là où elle doit s'entendre.
- **S1, moteur** (1 à 2 séances, 0 Mo) : bus, fondus, reprise entre les pages, couches synchrones, baisse sous les coups, chargement à la demande.
- **Écart avec le résumé de la séance mère, où la fiche gagne** : la météo est au lot S2, comme les ambiances par lieu, les pas et l'interface dans leur forme finale. Les compétences, la fenêtre d'esquive et la foule qui réagit sont au lot S3, la musique de duel aux lots S3 et S4. S0 et S1 livrent le moteur de couches, pas sa musique.
- **S2 à S5** attendent la revue de l'opérateur (SA-18). SA-10 se décide après l'essai du lot S4.

### Les mesures de l'audit
- Méthode : le vrai `Sound.ts` rendu dans `OfflineAudioContext` sur une horloge virtuelle, 57 rendus à 44,1 kHz, cinq vrais duels du robot, sonie selon BS.1770. Masques estimés.
- Sonie aux réglages par défaut (volume 0,7, musique 0,5) : ambiances seules de −33,9 à −47,2 LUFS (l'entraînement de nuit), mélanges de −33,6 à −40,3, musique seule de −43,3 à −44,5, duels −27,2 et −28,5 ; cible proposée −18 ± 2.
- Bruit : `x * 1103515245` dépasse 2⁵³ en double. Le générateur tombe dans un cycle de 10 466 échantillons, soit 0,2373 s, au lieu de 2 s ; autocorrélation 0,46 à 0,83 sur 24 ambiances, bruit blanc témoin 0,03. Toutes les nappes lisent le même tampon en phase.
- Mono sur 55 rendus sur 55, aucune réverbération. Musique 5 à 8 dB sous l'ambiance. Aucun limiteur : au volume 1, crête 1,108 et 51 échantillons au-delà de 1. Duels : 623 à 949 sons, 93 à 104 par minute, huit recettes fixes ; 68 % des relâchés sont de simples coups légers. Coups : 93 à 99 % de leur énergie sous 200 Hz.
- Aucun code ne joue `click`, `open`, `coin` ni `step`. Les paliers sonnent aussi quand les PA les ferment (`e.open`). `effect` est muet.
- Prototypes de l'audit : stéréo, sans la boucle, −21,4 LUFS pour l'ambiance. Rendu 9 à 16 s pour 33 s de musique, 16 à 46 % d'un fil en direct : c'est la raison de SA-8.
- Formats, rapport de licences : Opus en WebM avec repli AAC / M4A est le choix le plus défendable ; `decodeAudioData` sur Ogg dans Safari n'a pas pu être vérifié. À tester sur appareil réel avant le premier son cuit.

### Limites
- Aucune mesure ne dit si c'est beau, si la foule sonne comme une foule, si la boucle de 0,237 s s'entend vraiment, ni la fatigue sur 5 à 10 minutes de duel. Les prototypes ont été entendus par l'opérateur seul. La cible −18 reprend le repère portable d'Audiokinetic ; d'autres sources donnent −16.
- Licences lues le 2026-11-01, sans avis juridique. ZapSplat, Epidemic Sound et les contrats complets de Stability et de Google n'ont pas pu être lus en entier. Le dépôt n'a aucun fichier `LICENSE` : à préciser si du CC BY y entre.

### Pensée
- Une fiche d'audit fixe aussi le sens d'un plan : un résumé écrit après elle peut déplacer un sujet d'un lot à l'autre, elle se relit avant de construire.

## Passe SN2 — Lot S0 du son : le bruit réparé, la sonie à sa cible, un plafond, la stéréo, les effets muets branchés (2026-11-02)

### Demande
- SA-14 « Dès qu’une branche est libre », SA-18 « S0-S1 après les personnages ». Contenu de la fiche : bruit réparé, sonie cible, limiteur, stéréo, effets muets branchés, variation des coups, paliers et relâchés justes. 0 Mo, aucun fichier audio. Derrière `flags.v2` (SA-16).

### Fait — [OK]
- **Le bruit** : `noiseSamples` (`src/audio/score.ts`), le produit en entiers par `Math.imul`, 8 s en stéréo, deux graines. Chaque nappe lit le tampon de son propre endroit, à sa propre vitesse (0,93 à 1,07), son balancement décalé.
- **Le mixage** : quatre bus, ambiance, musique, effets, interface, puis un compresseur, un plafond (`WaveShaper` suréchantillonné, mi-niveau en entrée) et le volume après eux : un volume plus fort ne serre pas le mixage. `MIX` et `LEVEL` (par lieu et moment) sont réglés sur la mesure, aux réglages par défaut.
- **La stéréo** : nappes décorrélées, appels placés au hasard dans le champ, coups du côté où ils tombent (Ren à gauche), mélodie et bourdon légèrement écartés, une pièce par lieu (`ROOM`, `roomImpulse` : une réponse calculée, envoi pour les effets, les appels et la musique).
- **Les coups** : médium propre pour `hit`, `heavy`, `ko`. Part de l'énergie sous 200 Hz : coup 0,42 (0,94 avant), puissant 0,69 (0,98), K.O. 0,89 (1,00). `take` tire chaque prise : hauteur, niveau, durée, et une petite dérive par voix, jamais près de la précédente. Le moteur a son propre tirage (`Rng`), aucun `Math.random`.
- **La table du duel** quitte `ArenaApp` pour `duelCue`, pure : un palier fermé par les PA se tait, chaque palier ouvert monte de deux demi-tons, un relâché léger ou refusé se tait (la règle de `combatFx`).
- **Les quatre effets jamais joués** : `src/audio/hooks.ts`, sans toucher `src/ui`. `click` par délégation sur le document, `open` quand un `[role="dialog"]` apparaît, `coin` par `__game.subscribe`, `step` tous les mètres marchés. `click`, `open`, `coin` et `denied` relevés pour passer la clameur, `step` refait (il sortait à −58 LUFS).
- `v2.sound.sub`, `AGENTS.md`, le test « no audio file » : Passe SN1.

### Avant et après — [OK] mesuré sur le vrai moteur
Rendu hors ligne, 44,1 kHz, volume 0,7, musique 0,5 (`tools/audio/render.mjs`, `analyse.mjs`), `main` figé `c965623` et cette branche sur les mêmes événements.

| Mesure | `main` | Lot S0 | Cible |
|---|---|---|---|
| Mélanges de la ville, 17 rendus | −33,5 à −43,1 LUFS | −18,2 à −19,6 | −18 ± 2 |
| Ambiances seules | −33,9 à −47,2 LUFS | −21 à −24,9 | |
| Musique seule | −43,3 à −44,6 LUFS | −19,1 à −20,4 | |
| Musique sur l'ambiance | −10,1 à +2,6 dB | 3,9 à 4,9 dB | 3 à 6 dB |
| Duels, volume par défaut | −27,3 et −28,5 LUFS | −19,7 et −20,0 | −18 ± 2 |
| Fin de duel au volume 1, crête vraie | +0,9 dBTP | −1,1 dBTP, 0 échantillon au-delà de 1 | −1 dBTP |
| Répétition des nappes, 0,05 à 1 s | 0,46 à 0,83, à 0,237 s | au plus 0,135 (les notes de la halle, à 0,05 s) | < 0,2 |
| Répétition des nappes, 1 à 6 s | jusqu'à 0,84 à 2 s | au plus 0,021 | < 0,2 |
| Corrélation gauche-droite | 1 partout | ambiances 0 à 0,18, mélanges 0,74 à 0,81, duels 0,21 et 0,26 | < 0,98 |
| Clic, ouverture, pièce sur la clameur de l'arène | −1,2 et −1,8 dB à l'audit | +3,7, +3,7, +3,6 dB | ≥ 3 dB |

- **L'outil porté** : `tools/audio/measure.mjs` remplace `analyse.py` (Python n'est pas sur ce poste). Cas 1 à 3 d'EBU Tech 3341, crête entre échantillons, boucle de 0,237 s trouvée et bruit blanc refusé (`tests/audio-measure.test.mjs`). Sur `main` figé il retrouve l'audit à 0,2 LU près : −33,9, −47,2, −34,6, −33,6, −27,3.
- **Contrôle négatif** : `analyse.mjs --check` sur `main` figé échoue à 151 contrôles ; sur cette branche, tous passent.
- `tools/audio/hooks-proof.mjs`, dans le vrai jeu en DEV : `open` à l'ouverture d'un dialogue, `click` sur un bouton, `coin` sur un achat de 20 pièces, 8 `step` pour 8,9 m, aucun moteur dans une partie d'aujourd'hui, aucune erreur de page.
- `tests/v2-sound-s0.test.mjs` : douze fautes injectées une à une, toutes attrapées.
- `npm run typecheck`, `npm test` **332 / 332**.

### Ce qui a raté
- [KO → corrigé] Les 13 rendus d'effets sortaient muets : `play` attend la pièce, créée seulement par une scène. La pièce se crée au déverrouillage.
- [KO → corrigé] Le contrôle de répétition sur les mélanges voyait le bourdon de la musique, de 0,5 à 0,7 à 0,055 s : une note tenue n'est pas une boucle. Il porte sur les nappes seules.
- [KO → corrigé] +6 dB sur les coups n'ont rapporté que 0,6 LU au duel, puis +1 dB 0,1 LU : ils butaient sur le compresseur. Ce qui a marché : l'énergie vers le médium, que BS.1770 pèse et qu'un portable restitue, puis le seuil de −10 à −7 dB, son gain automatique compensé (−1,6 dB) sur chaque bus.
- [KO → corrigé] La faute « un coup sans son médium » passait le test : les partiels d'acier le satisfaisaient. Le test demande une voix de bruit, et `--check` borne la part sous 200 Hz.

### Restes [?]
- **Personne n'a écouté.** Le niveau des nappes de bruit relevées de 10 à 24 dB, le mordant des nouveaux coups, les sons d'interface et les pas se jugent à l'oreille : fiche du lot.
- Le duel est au bas de la bande : −20,0 sur Vessa. Il n'a pas sa musique, lot S3 ; le compresseur le retient au-delà.
- La musique reste étroite (corrélation 0,98) : c'est la même mélodie jouée au même endroit. La bande de ville du lot S4 la remplacera.
- Hors S0, selon la fiche : `effect` reste muet (lot S3), la fin de journée sonne comme midi (S2), l'air reste le même partout (S4). Ces sons d'interface et ces pas sont des branchements, leur forme finale est au lot S2.
- La place des mesures : `tools/audio/` tourne dans Chrome hors ligne. Un portable, un téléphone ou de vrais haut-parleurs n'ont pas été mesurés.

### Pensée
- Quand un gain ne rapporte plus rien, ce n'est pas un manque de gain : un limiteur compte la crête, la sonie compte le médium. On déplace l'énergie au lieu de pousser.
- Un portage de mesure se juge d'abord sur les chiffres déjà publiés : si l'outil neuf ne les retrouve pas, ses résultats ne valent rien.
- Une autocorrélation répond à « quoi se répète ? » : sur un mélange, une note tenue ressemble à une boucle. Elle se lit sur le signal dont on suspecte le défaut.

## Passe SN3 — Lot S1 du son : la baisse sous les coups, les fondus, la reprise entre les pages, les couches, le chargement à la demande (2026-11-02)

### Demande
- SA-18, contenu de la fiche : bus, fondus, reprise entre les pages, couches synchrones, baisse sous les coups, chargement à la demande. Dépend de SA-8 et SA-15. 0 Mo. La musique de duel elle-même est aux lots S3 et S4 : le moteur est prêt, aucune couche ne joue encore dans le jeu.

### Fait — [OK]
- **La baisse sous les coups** : `DUCK`, deux gains derrière les bus de musique et d'ambiance. Coup −3 dB, puissant −5, garde −2, bris −6, K.O. −14 et 1,8 s pour revenir ; l'ambiance prend 35 % de ces dB.
- **Les fondus** : une page monte en 1,2 s et descend en 0,35 s, une scène cède la place en 0,8 s. Le fondu de page porte sur la musique et l'ambiance seules, un effet s'entend tout de suite.
- **La reprise** (SA-15) : `NOW_KEY` dans `sessionStorage`, le morceau, sa position et « un geste a eu lieu ». `pagehide` l'écrit. La page suivante reprend le même morceau à sa position, recommence un autre morceau au début, et oublie après 10 minutes. La musique se joue sur l'horloge audio, y compris son bourdon commencé.
- **La sortie de page** : `hooks.ts` voit `.pm-fade` et lance le fondu ; `go` (`src/ui/play.ts`) demande à `window.__soundLeave` ce qu'il reste à attendre. Sans ce handle, jeu d'aujourd'hui compris, `go` part sur-le-champ. C'est le seul changement dans `src/ui`.
- **Les couches** : `src/audio/layers.ts`, `LayerSet` : des pistes de même longueur, une seule horloge, un seul décalage, un niveau qui bouge à la mesure suivante (`nextBoundary`).
- **Le chargement à la demande** : `src/audio/baked.ts`, `AudioLoader`, le format que le navigateur lit (Opus puis AAC), un seul téléchargement par fichier, un échec sans erreur sur la page. `src/audio/baked/` n'existe pas encore.
- **La barrière de SA-8** : `tools/audio/validate.mjs`, lancé par `npm run art:validate` : licence de SA-13, pas de génération (SA-12), approbation mot pour mot, SHA-256, 12 Mo par format (SA-17), aucun fichier audio hors manifeste sous `src/` ni `public/`.
- `AGENTS.md`, section « Sound » : le moteur, les fichiers cuits, les outils.

### Preuves — [OK]
- **Moteur mesuré sur sa sortie** (`tools/audio/engine-proof.mjs`) : puissant −4,5 dB, K.O. −13,7 dB, retour à 0,29 et 0,15 dB. Une couche demandée à 1,0 s reste à −116 dB jusqu'à la mesure de 1,3 s, puis −29,6 dB. Trois pistes : leurs clics sur le même échantillon, trois tours de boucle, 66 150 échantillons d'écart. Page : −37,4 dB en montée, −29,3 posée, −85,9 après le départ. Reprise : corrélation **0,998** avec le morceau 5 s plus loin ; à 0,5 s d'écart 0,160 ; autre morceau 0,079. `main` figé plante sur ce test, il n'a pas ces fonctions.
- **Vraie navigation** (`tools/audio/page-proof.mjs`, Chrome avec fenêtre, hors écran) : aucun contexte avant le geste ; le geste lance le son, entendu à −19,7 dB ; le héros passe la sortie, la page suivante reprend **sans nouveau geste**, le même morceau, quitté vers 3,93 s, à 6,90 s après 2,5 s. Un onglet sans geste reste muet. **Témoin** : un `AudioContext` créé sans geste reste `suspended`, la règle du navigateur est donc active.
- **Rendu complet sur le code final** (`analyse.mjs --check`, tous les contrôles passent) : mélanges −18,3 à −19,6 LUFS, ambiances −20,4 à −25,0, musique −19,1 à −20,4, musique sur l'ambiance 3,9 à 4,8 dB, duels −19,3 et −19,6, fin de duel au volume 1 −1,1 dBTP, nappes 0,135 au plus. Clic, ouverture, pièce sur la clameur : +3,2, +3,2, +3,1 dB.
- **Le jeu par défaut inchangé**, paquets de production contre `main` figé `e5343d8` (l'interface Voile comprise), seuil 0, 1920 x 1080 : ville de nuit et à midi `clean=1` **0 px** ; arène quatre moments, midi, `combat=dynamic`, `v2=1`, `v2=1&cast=generated`, onze vues : **0 px**, avec `HOLD=1`, témoin `main` contre `main` à 0 px. Contrôle négatif : 7,402 % entre `v2=1` et `cast=generated`. Sur 86 fichiers du paquet, quatre changent de taille : `ArenaApp` −448 octets, `play` +88, `save` −33 (le texte), `Sound` 8,7 → 19,8 Ko. Entrée inchangée.
- `play-flow` sur le paquet de production : défaut, `V2=1` gagné jour 2, `V2=1` perdu jour 4, « all checks passed » ; `go` retardé par le fondu y passe. `arena-scene-check "v2=1"` : code 0. `hooks-proof` : tout passe.
- `npm run typecheck`, `npm test` **352 / 352**, `npm run build`, `npm run art:validate` (61 manifestes, 85 sources, 0 manifeste de son, 0 erreur). Dix-huit fautes injectées dans `score`, `layers` et `baked`, toutes attrapées.
- **Coût de lecture, indicatif** : rendu hors ligne machine au repos, `mix-district-midday` à 22 x le temps réel contre 38 x sur `main`, soit environ 4,5 % d'un fil contre 2,6 %. Ambiance d'arène seule 41 x contre 160 x. Le rendu hors ligne ne vaut pas une mesure en direct.

### Ce qui a raté
- [KO → corrigé] **La preuve de reprise était fausse une première fois.** Le test passait, et le témoin que j'ai ajouté ensuite a échoué : un contexte sans geste tournait. Headless n'applique pas la règle, et une fenêtre réelle non plus sous ce test : `page.evaluate` de puppeteer s'exécute avec `userGesture: true`, chaque lecture de l'outil comptait comme un geste. La page testée se lit désormais par une sonde posée au chargement, à travers la console, sans aucun `evaluate`.
- [KO → corrigé] Le fondu de page était sur toute la sortie : le premier clic d'une page aurait été étouffé. Vu sur le rendu, parce que `fx-click` a chuté de 20 dB. Le fondu ne porte plus que sur la musique et l'ambiance.
- [KO → corrigé] Les captures d'arène différaient de 0,4 à 9 % entre `main` et la branche, et de même entre `main` et `main` : sans `HOLD=1` la boucle tourne entre le démarrage et le moment figé. Le témoin l'a montré avant toute conclusion.
- [KO → corrigé] `engine-proof` lisait −2,9 dB pour −5 : l'écho du coup restait dans la mesure. Le niveau se lit à la fréquence du signal d'essai. Le fondu se mesure sur un son continu, pas sur des notes.
- [KO] Le premier `go` n'a pas besoin du délai sur un fondu déjà lancé par `.pm-fade` : c'est voulu, mais un changement de créneau sans écran noir retarde la page de 350 ms en version 2.

### Restes [?]
- **Personne n'a écouté** : la fiche de lot le demande.
- Seul Chrome sur Windows est prouvé pour la reprise. Firefox, Safari et un téléphone ne le sont pas : là où le navigateur refuse, le son attend un geste. Le chemin `suspended` n'a pas été parcouru par la preuve, puisque Chrome n'y passe pas.
- Le retour par le cache de page (`pageshow` `persisted`) est écrit, pas prouvé. Le chargement à la demande est prouvé sur des données locales, pas sur un fichier Opus du jeu : aucun n'existe.
- Le duel monte à −17,2 LUFS avec ses couches dans l'extrait de démonstration : le bas de bande d'aujourd'hui vient bien de l'absence de musique, à revérifier au lot S3.
- `ffmpeg` n'est pas installé : décision sur la fiche, avant le lot S2.

### Le report sur `main`
- `main` a reçu l'interface Voile pendant ce travail (`e5343d8`, Passes UM2 à UM9). Branche neuve `claude/sound-s0-s1` depuis `e5343d8`, les trois passes rejouées une à une, aucun push forcé. `src/audio`, `play.ts` et `ArenaApp.ts` n'avaient pas bougé : le code du son est identique à l'octet ; les fichiers en commun sont `JOURNAL.md`, `AGENTS.md` et `en.ts`, sur d'autres lignes. Les mesures de sonie contre `c965623` restent valables, le moteur de `main` n'ayant pas changé entre les deux.
- Toutes les preuves ci-dessus ont été refaites sur cette base : la nouvelle interface garde `[role="dialog"]` et `.pm-fade`, que les branchements écoutent.
- [KO → corrigé] Le premier rejeu, enchaîné sur une seule ligne, a continué après l'échec de son résolveur et mis la passe SN2 dans le commit de SN1. Rien n'était poussé : retour à `e5343d8`, puis un commit à la fois.

### La fiche — à remplir par l'opérateur
- Page privée https://claude.ai/artifact/McPDaVNx9o82nkieURh1Wx (source `briefs/fiche-son-lot1.html`), collection `decisions` vide à la publication, dix cartes, neuf extraits à leurs niveaux réels (40 Mo). Écoutes S0-1 à S0-4, S1-1, S1-2 ; décisions S0-N le niveau général, SA-11c la lecture de SA-11, S2-O l'outil pour cuire (`ffmpeg` n'est pas installé), S2-G le lancement du lot S2. Rendu vérifié en local, deux largeurs, neuf lecteurs chargés : le navigateur intégré n'est pas connecté à claude.ai.
- L'extrait des couches joue les trois couches du prototype (hors dépôt) : c'est une démonstration du moteur, ses règles sont au lot S3.

### Où reprendre
- Relire `decisions` par `list` quand l'opérateur dit la fiche remplie, consigner mot pour mot, reprendre ce qu'il demande. S2 ne démarre qu'après sa réponse, avec SA-11c et S2-O. Rendre et mesurer : `tools/audio/render.mjs` et `analyse.mjs --check`, dont la base est `main` figé.
- Avant le premier fichier cuit : décoder de l'Opus en WebM et de l'AAC sur un vrai Safari.

### Journal — [OK] archivage
- Les passes gardées dépassaient 60 Ko. CX1, CX2, UM1, CX3 et CX4, closes, partent d'un seul bloc vers `journal/45-passes-CX1-CX4.md` (31467 octets). Preuve : corps de l'archive égal au bloc, chaque passe dans un seul fichier, fins de ligne CRLF gardées.

### Pensée
- Un témoin ajouté après un test vert a plus de valeur que le test : il a montré qu'un outil de pilotage peut fabriquer exactement la condition qu'on croit observer. Quand une règle dépend d'un geste, l'outil de lecture ne doit pas en être un.
- Une preuve à 0 px sans témoin ne dit rien, et une différence sans témoin non plus : le même contrôle a évité un faux 0 et une fausse régression.
- Un fondu sur toute la sortie est un fondu sur l'interface : ce qui doit répondre tout de suite reste hors de lui.

