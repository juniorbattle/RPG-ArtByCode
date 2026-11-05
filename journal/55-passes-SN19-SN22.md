# Journal de bord — archive : passes SN19, SN20, SN21, SN22 (2026-11-04)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-11-04 (Passe PU2) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe SN19 — La fiche des lieux relue, quatorze sur quatorze : les lieux gardés, 3 dB plus loin ; la pluie, l'orage, l'interface et les pas dans la version 2 (2026-11-04)

### Demande
- L'opérateur, mot pour mot : « Fiche remplie ».

### La fiche
- Page privée https://claude.ai/artifact/FwMeKdEirAksUFBe3pd5eq, source `briefs/fiche-son-lieux.html`. Relue par `list` : 14 documents sur 14, aucune note (S2-VILLE cliquée trois fois, la dernière gardée).

| # | Décision | Choix de l'opérateur |
|---|---|---|
| S2-VILLE | La ville, sur son canal | « Garder l’ambiance d’aujourd’hui » |
| S2-PARVIS | Le parvis de l'arène | « Garder l’ambiance d’aujourd’hui » |
| S2-LICES | Les lices au pied du rempart | « Garder l’ambiance d’aujourd’hui » |
| S2-HALLE | La place de la halle | « Garder l’ambiance d’aujourd’hui » |
| S2-PLUIE | La pluie du jour pluvieux | « Bonne direction » |
| S2-ORAGE | L'orage | « Bonne direction » |
| S2-NEIGE | La neige | « Pas de changement sous la neige » |
| S2-VENT | Le vent | « Pas de son de vent » |
| S2-INTERFACE | Les sons de l'interface | « Bonne direction » |
| S2-PAS | Les pas | « Bonne direction » |
| S2-MELANGE | Le tout, avec la musique | « L’ambiance plus en retrait » |
| S2-POIDS | Où vivent ces sons | « Calculer dans la page, cuire l’interface et le murmure (121 Ko) » |
| S2-FOULE | Des enregistrements CC0 en complément ? | « Le code suffit » |
| S2-SUITE | Ce qui vient après | « Cuire et brancher dans la version 2 ce qui est validé » |

### Deux précisions demandées à l'opérateur, ses réponses mot pour mot
- **S2-MELANGE**, de combien reculer : aujourd'hui la musique est 4 à 5 dB au-dessus de l'ambiance, et la cible de S0 disait 3 à 6 dB. Réponse : « −3 dB, nettement (Recommandé) ». La musique passe 7 à 8 dB au-dessus des lieux, et la cible du contrôle devient 6 à 9 dB.
- **S2-ORAGE** et **S2-VENT** : l'extrait d'orage avait des rafales, et S2-VENT dit « Pas de son de vent ». Réponse : « Sans rafales (Recommandé) ».

### Ce que ces choix veulent dire
- **Les quatre lieux gardent l'ambiance des lots V8 et S0** : le vent, l'eau, la foule en bruit filtré, le marteau, les oiseaux, les grillons, le luth et la clameur.
  - Elle recule de 3 dB avec son écho.
  - Le reste de la proposition de SN18 sort du jeu : le murmure, l'enclume, le bateau, la fontaine, les braseros, l'entraînement, l'écurie, les fanions, le merle, les hirondelles et la chouette.
- **La pluie** : son sifflement et son crépitement ; les oiseaux et les grillons se taisent dès 0,25 ; la foule se met à l'abri.
- **L'orage** : le tonnerre après chaque éclair, et sa pluie, sans aucun son de vent. La neige et le vent ne changent rien et ne s'entendent pas.
- **L'interface** est jouée par le groupe ; le refus est celui du duel, joué aussi quand le jeu refuse une action. **Les pas** sont calculés sur les pavés et sur la terre des lices.
- **S2-POIDS et S2-SUITE** : calculer dans la page, et cuire ce qui est validé. Aucun lieu n'a pris le murmure : il n'est pas cuit, et seule l'interface l'est. Lecture consignée ici.
- **S2-FOULE** : aucun enregistrement CC0.

### Fait — [OK]
- **`src/audio/score.ts`** :
  - `ambienceOf` reprend la table de `main`, avec par-dessus `weather` (pluie, tonnerre) et `surface` ;
  - `LEVEL` garde les niveaux de `main` ;
  - `PLACES_BACK` (−3 dB) recule le lieu et l'envoi de ses appels vers la salle (`back`) ; l'arène ne bouge pas ;
  - `WEATHER_TRIM`, `RAIN_LEVEL`, `PATTER_LEVEL` et `THUNDER_LEVEL` posent la météo sur son propre groupe, au niveau entendu sur la fiche moins 3 dB ;
  - `STEP_LEVEL`, `UI_LEVEL` et `thunderOf` sont gardés.
- **`src/audio/places.ts`** ne garde que les pas, le crépitement et le tonnerre. Le crépitement et le tonnerre sont des générateurs : les mêmes échantillons, vérifiés par empreinte avant et après. Le passe-haut du crépitement fait désormais un tour de cercle avant d'être gardé (voir Défauts trouvés).
- **`src/audio/Sound.ts`** :
  - `ambience`, `call` et `pluck` de `main`, mot pour mot, sauf l'envoi des appels multiplié par `back` ;
  - `weatherOver` (le sifflement en direct ; le crépitement fait par tranches de 4 ms, puis en boucle ; les prises du tonnerre faites d'avance pendant l'orage) ;
  - `madeSlowly` ; l'interface, les pas, le tonnerre (une prise pas encore faite joue quand elle l'est, sauf si elle arrive plus d'une seconde en retard).
- **La cuisson** : `bake-sfx.mjs` cuit la famille `interface` depuis `art-lab/audio/sfx/places.sfx.mjs`, devenu l'écriture de l'interface seule.
  - 6 sons, 12 fichiers : 45 267 octets en Opus, 33 544 en AAC.
  - `art-lab/audio/manifests/interface.manifest.json` cite S2-INTERFACE, S2-POIDS et S2-SUITE mot pour mot, et dit « To be confirmed after the trial in play ».
  - La table `sfx` du catalogue gagne `ui-click`, `ui-open` et `ui-coin`.
  - Les 8 manifestes et les 128 fichiers de S3 sont identiques à l'octet (`bake-sfx --check`).
  - `crowd.sfx.mjs` revient à `main`, `duel.sfx.mjs` n'exporte plus que `Cue`.
- **Les outils** :
  - `analyse.mjs` : la cible 6 à 9 dB, et les pages sous la pluie et sous l'orage tenues à −18 ± 2 ;
  - `render.mjs` : trois rendus de météo (le jour pluvieux, un orage la nuit avec quatre éclairs, le même à plein volume), avec `settle` ;
  - `harness.js` : les éclairs d'un rendu (`flashes`) ;
  - `hooks-proof.mjs` : l'interface, le refus, les pas calculés, la pluie et le tonnerre démarrés après un éclair, la banque du duel sans l'interface ;
  - `decode-proof.mjs` : un son plus court que la fenêtre ;
  - `places-listen.mjs` : son en-tête mis à jour.
- **Les tests** :
  - `tests/v2-sound-s2.test.mjs`, 7 tests : les lieux de `main` 3 dB plus loin, leur air compris ; la pluie ; la neige et le vent sans effet ; l'orage sans rafales ; `thunderOf` ; les recettes (mêmes échantillons, finies, sous la pleine échelle, le crépitement un cercle par repli exact et son passe-haut en cercle, les générateurs par petits pas, aucun `Math.random`) ; l'interface cuite sans murmure ; le refus sur une action refusée.
  - 12 fautes injectées une à une, toutes attrapées.
  - `audio-baked` et `audio-sfx` comptent la famille `interface`. Le test des ambiances de `main` (`v2-sound.test.mjs`) revient tel quel et passe.
- **`AGENTS.md`** : la section « Sound » dit S2 et la cible 6 à 9 dB.
- **Le journal** : les passes gardées dépassaient 60 Ko. SN11-SN12 puis SN13-SN14 sont archivées mot pour mot (`journal/51-passes-SN11-SN12.md`, `journal/52-passes-SN13-SN14.md`). Les déplacements sont prouvés : corps identiques aux octets retirés (10 928 et 14 486 octets), chaque passe dans un seul fichier, fins de ligne CRLF gardées. Il reste 47 Ko de passes gardées.
- **`main` a bougé pendant ce travail** (la Passe SA1 d'une autre séance, `89f55d0`). SN18 et SN19 sont rejouées sur une branche neuve, `claude/sound-places`, sans push forcé. Le commit de la proposition de SN18 y est `bd8eb8f` (`055c81b` sur la première branche).
- **La fiche d'essai** : page privée https://claude.ai/artifact/1rAzC4gZJ7FriUdnTegfK3, source `briefs/fiche-son-essai-lieux.html`.
  - Elle dit comment jouer, adresses à l'appui : la ville sous la pluie, la halle sous l'orage, les pas sur le parvis et sur les lices, l'interface.
  - Trois cartes : S2E-JEU, S2E-PROD, et S2E-SUITE (recommandé : « Lancer S5 »).
  - Les deux adresses de pluie et d'orage ont été ouvertes dans le jeu (serveur DEV) : la météo de la page et celle du son concordent.
  - `decisions` relu vide à la publication.

### Preuves
- **Les lieux d'aujourd'hui à −3 dB, échantillon par échantillon** : les 16 rendus `amb-*` des quatre lieux, contre `main` figé multiplié par 10^(−3/20), laissent au plus 0,0002 % inexpliqué (−114 dB). L'arène et les effets restent identiques à `main` (0,0000 %).
- **`analyse.mjs --check`, rendu complet** : tout passe.
  - La musique est 7,0 à 8,2 dB au-dessus des lieux. Les pages font −19,5 à −19,2 LUFS.
  - Les duels sont inchangés (−17,4 et −17,6 LUFS ; −1,5 dBTP à plein volume).
  - Le jour pluvieux −19,5 LUFS ; l'orage la nuit −18,6 LUFS ; l'orage à plein volume −15,5 LUFS et −2,6 dBTP.
  - Le clic, l'ouverture et la bourse sont à 4,6 / 4,3 / 4,8 dB au-dessus de la foule de l'arène.
- **`engine-proof`** : tout passe. **`decode-proof`** : Chrome 156 et Firefox, tous les fichiers alignés, les 12 de l'interface compris (longueur exacte, début à 0, ressemblance 1,0000).
- **`hooks-proof`**, dans le vrai jeu (serveur DEV, Chrome piloté) : tout passe.
  - Les 4 sons de l'interface sont décodés, et le clic et l'ouverture passent par eux.
  - Une action refusée joue le refus.
  - 8,9 m de marche font 8 pas, calculés sur les pavés.
  - Sous l'orage, le crépitement et le tonnerre démarrent après un éclair.
  - L'arène décode 56 sons sur 56 (l'interface à part). Une partie d'aujourd'hui n'a pas de moteur. Aucune erreur de page.
- **`page-proof`** : tout passe.
- `npm test` 398 sur 398, `npm run typecheck`, `npm run build`, `npm run art:validate` (23 manifestes de son, 0 erreur), `bake-sfx --check`.
- **Le poids** (SA-17) : 12 326 185 octets en Opus (11,76 Mio, 256 727 sous les 12 Mio) et 11 108 165 en AAC.

### Défauts trouvés — [KO → corrigé]
- **Le premier recul de 3 dB laissait l'écho des appels où il était.** Le luth, les oiseaux et le marteau envoient leur écho vers la salle avant le niveau du lieu. Il restait 0,07 à 1,26 % d'écart contre `main` à −3 dB, la halle le plus haut (son luth). Le recul passe maintenant aussi par l'envoi (`back`) : plus que 0,0002 %.
- **`hooks-proof` coupait le son depuis le lot S0.** Il cliquait le premier bouton du réglage du son, « Mute ». Toutes ses vérifications suivantes tournaient en sourdine, et passaient parce qu'elles comptaient les appels à `play`. Il clique maintenant « Close » et vérifie que le son n'est pas coupé. L'Échap qui suivait ouvrait ensuite le menu et retenait le héros : il est retiré.
- **`decode-proof` lisait au-delà d'un son de 0,35 s** (fenêtre de 0,5 s) : NaN, puis « match 0 » sur les trois clics. La fenêtre lit désormais du silence après la fin.
- **Le banc de rendu sautait le tonnerre.** Sans `settle`, l'horloge virtuelle ne laisse pas courir les promesses : une prise faite par tranches jouait trop tard et était sautée (l'orage à −19,2 LUFS au lieu de −18,6). Les rendus de météo prennent `settle`. Dans le jeu, `hooks-proof` voit le tonnerre démarrer.
- **Le passe-haut du crépitement partait du silence.** Les 10 premières ms de la boucle différaient de son cercle de −35,6 dB, à chaque tour de 7 s. Il fait maintenant un tour pour s'amorcer : −152,5 dB. Seul ce début change, à −35 dB, après l'écoute de la fiche. C'est une correction technique, nommée ici.

### Limites
- **Personne n'a encore entendu l'ensemble en jouant** : c'est la fiche d'essai.
- Les sons calculés le sont au premier besoin : les pas en moins d'une milliseconde ; le crépitement et le tonnerre par tranches de 4 ms au plus, non mesurées en cadence dans le jeu.
- Dans un onglet caché, l'image ne tourne pas, donc aucun éclair ni tonnerre ne vient. C'est le comportement de la page, pas du son.
- Safari n'est toujours pas essayé (SC-SAFARI).

### Où reprendre
- Relire la fiche d'essai quand l'opérateur la dit remplie. Si S2E-PROD est confirmé, écrire la confirmation dans le manifeste de l'interface (`bake-sfx.mjs`, comme `CONFIRMED`). Puis S5, ou ce qu'il note.

### Pensée
- Un recul « de tout le lieu » se prouve contre l'original multiplié, échantillon par échantillon. Un envoi vers la salle pris avant le niveau a laissé 1 % d'écart, que le chiffre de sonie ne montrait pas.
- Un outil de preuve qui touche l'interface peut changer ce qu'il prouve : un clic sur « Mute » a rendu muettes, sans échec, toutes les preuves suivantes pendant trois lots. Une preuve vérifie aussi l'état qu'elle laisse.
- Une horloge virtuelle qui ne cède pas aux promesses ne voit pas ce qui se fait par tranches : un son asynchrone se rend avec `settle`, et se prouve aussi dans le vrai jeu.

## Passe SN20 — La fiche d'essai des lieux relue : en production dans la version 2, S5 ensuite (2026-11-04)

### Demande
- L'opérateur, mot pour mot : « Fiche d'essai remplie ».

### La fiche
- Page privée https://claude.ai/artifact/1rAzC4gZJ7FriUdnTegfK3, source `briefs/fiche-son-essai-lieux.html`. Relue par `list` : 3 documents sur 3, aucune note.

| # | Décision | Choix de l'opérateur |
|---|---|---|
| S2E-JEU | Les lieux, la météo, l'interface et les pas, en jouant | « Bien dans le jeu » |
| S2E-PROD | Les sons de l'interface en production dans la version 2 | « Confirmé : en production dans la version 2 » |
| S2E-SUITE | Ce qui vient après | « Lancer S5 » |

### Ce que ces choix veulent dire
- **Le lot S2 est clos** (Passes SN18 à SN20). Il comprend :
  - les quatre lieux de S0, 3 dB plus en retrait avec leur écho ;
  - la pluie et le tonnerre, sans rafales ; la neige et le vent muets ;
  - l'interface jouée par le groupe et le refus sur une action refusée ;
  - les pas calculés.

  Tout est entendu en jouant, et l'interface est confirmée en production dans la version 2.
- **S5 vient maintenant**, dans sa propre séance : le mixage d'ensemble, l'essai en jeu de tout le son et la fiche de réception du plan d'audit. SA-10, le compositeur humain, reste à décider après l'essai de S4.

### Fait — [OK]
- `bake-sfx.mjs` écrit la confirmation dans le manifeste de l'interface (`CONFIRMED_S2`, comme `CONFIRMED` pour S3), dans `approval` et `decisions`. Les 12 fichiers et la table du catalogue restent identiques à l'octet (`bake-sfx --check`). `tests/v2-sound-s2.test.mjs` vérifie la confirmation.
- `AGENTS.md` : l'interface confirmée, et S5 ensuite.
- La séance de S5 est proposée à l'opérateur depuis cette séance, avec son brief.
- `npm test`, `npm run typecheck`, `npm run build`, `npm run art:validate` (23 manifestes de son, 0 erreur).

### Où reprendre
- S5, dans sa séance. Toujours à l'opérateur : l'essai Safari sur un appareil Apple (SC-SAFARI).
- L'ancienne branche `claude/gifted-lewin-77d4c2` (`055c81b`, `0335ec8`) attend l'accord de l'opérateur pour être supprimée. Son contenu est sur `main`, rejoué en `bd8eb8f` et `b47cde1` ; c'est prouvé par la comparaison des arbres (Passe SN19).

## Passe SN21 — Lot S5, la fiche du mixage et de la réception : tout le son mesuré, page après page (2026-11-04)

### Demande
- Le lot S5 du plan d'audit (`briefs/fiche-son.html` : « Mixage et essai : équilibre général, essai en jeu, fiche de réception »), choisi par l'opérateur sur la fiche d'essai de S2 (S2E-SUITE « Lancer S5 », Passe SN20) et confié par la séance mère. Il comprend :
  - un état des lieux mesuré de tout le son de `main` ;
  - ce qui déséquilibre l'ensemble ;
  - une fiche d'écoute qui porte les réglages proposés, l'essai en jeu de tout le son et la réception ;
  - SA-10 préparée, pas tranchée.

  N'appliquer que ce qui est décidé.

### Fait — [OK], rien dans `src/`
- **Le rendu complet de `main`** (`render.mjs`, `analyse.mjs --check`) : tout passe, aux mêmes chiffres que la Passe SN19.
- **Les parcours** (`tools/audio/mix-jobs.mjs`, `mix-jobs.page.js`) :
  - chaque page est un rendu du vrai moteur. Elle part comme dans le jeu (`leave()` : le fondu, le relevé de la reprise), et la page suivante reprend ce relevé (`carry`, une option nouvelle de `harness.js` qui garde le `sessionStorage` du rendu précédent) ;
  - trois parcours : un matin (la première page d'une partie neuve sous le titre, le parvis et la fanfare, les lices, la ville), l'après-midi d'un combat (le parvis, le duel entier contre Vessa, la ville en fin de journée), un soir (la ville, le parvis, la halle, les lices) ;
  - les deux autres duels entiers du bot (Orla sous le rival, Marek perdu sous la finale), et le duel de Vessa piste par piste ;
  - la fanfare sur le parvis ; l'interface et les pas sur trois pages, chacune rendue aussi en événements seuls et en page seule.
- **Les mesures** (`tools/audio/mix-listen.mjs measure`) : les parcours joints avec 2 s de silence pour le chargement ; la sonie de chaque page ; les duels minute par minute ; les jingles et la fanfare contre ce qu'ils couvrent ; chaque son de l'interface contre sa page dans sa fenêtre ; les octaves. `mix-listen.mjs site` écrit les extraits de la fiche et ses courbes.
- **Les sons d'un duel comptés** : les fonctions pures (`sfxOf`, `crowdOf`, `moodStep`, `layerLevels`) passées sur les événements des trois duels du bot, par un script de séance.

### Mesures
| Ce qui est mesuré | Valeur |
|---|---|
| Une page avec sa musique (16 pages) | −19,2 à −19,5 LUFS ; dans les parcours, avec pas et interface, −18,9 à −19,5 |
| La musique des lieux, les lieux | −20,0 à −20,2 LUFS ; −27,2 de jour et −28,3 la nuit ; 7,0 à 8,2 dB d'écart |
| Un duel entier (Vessa, Orla, Marek) | −17,5, −17,3, −17,6 LUFS ; ±0,4 dB d'une minute à l'autre ; les 3 s les plus fortes, −14,1 à −14,6 (le K.O. et la clameur) |
| Le duel de Vessa piste par piste | la musique −20,7 LUFS, les sons −20,4, la foule −23,9 avec ses réactions (le murmure seul −25,7) |
| Les jingles | la victoire −18,2 après un duel à −17,2 (Vessa) et −17,1 (Orla) ; la défaite −19,0 après −17,3 |
| La fanfare | −19,2 sur un parvis à −19,7 ; ses 3 s les plus fortes −18,3 |
| Le titre | monte de −23 à −16,5 LUFS (sur 3 s) au fil de sa page ; le parvis suivant repart à −19,3 |
| L'interface sur sa page (l'octave où le son se détache le plus) | le clic 2,5 à 16,5 dB, le dialogue 6,3 à 6,6, la bourse 7,0 à 8,3 ; le refus −4,6 à +1,9 ; les pas 4 à 8 dB entre 2 et 8 kHz |
| L'octave de 500 Hz | le murmure 37,5 dB, la musique du duel 35,8, du rival 36,9, de la finale 36,5 |
| Un duel, par minute | 98 à 112 sons ; la cloche de la fenêtre 9,9 à 20,4 fois ; les notes de la charge 23,6 à 27,6 ; la musique baissée 20 à 22 % du temps ; la tension montée 60 à 67 %, la mélodie baissée 17 à 30 % |
| Les boucles | les combats 35,9 à 44,2 s (10 à 14 tours pour un duel de 7 à 8 min 30) ; les lieux 41,7 à 81,5 s |

- Les pages se tiennent : moins de 0,6 dB d'une page à l'autre, le combat 1,6 dB au-dessus du parvis qui le précède. Deux déséquilibres mesurés : le murmure de l'arène dépasse la musique des combats dans l'octave de leur mélodie, et le refus est couvert par la musique de la ville.

### Défaut trouvé — [KO, proposé sur la fiche, pas corrigé]
- **Le relevé de la reprise après un combat** : `save()` prend `nowPlaying() ?? this.resume`. Le duel arrête sa musique au K.O. ; en partant, la page réécrit donc le relevé de la page d'avant (le parvis à 33,9 s, vu dans le rendu `J2-2-duel`) avec l'heure du départ, et la règle des 10 minutes (`RESUME_MS`) ne voit plus le temps passé. La correction (garder l'heure du relevé) est sur la fiche, dans S5-PAGES.

### Les propositions, rendues par le vrai moteur
- **La foule creusée** : un filtre en cloche à 500 Hz (Q 1, −5 dB) sur le groupe de la foule. Le murmure passe de 38,8 à 34,6 dB dans l'octave, et de −24,4 à −27,3 LUFS sur l'extrait ; le duel de −17,7 à −18,1.
- **Le refus 6 dB plus fort** hors du duel (`UI_LEVEL.denied` de 0,29 à 0,58) : dans sa meilleure octave, +2,0 / +5,1 / +7,9 dB au lieu de −4,0 / −0,9 / +1,9.
- **Le combat 1,5 dB plus bas** : un gain de sortie après le limiteur. L'extrait est le rendu d'aujourd'hui multiplié, ce qui est exact pour un gain placé après le limiteur.

### La fiche
- Page privée https://claude.ai/artifact/6PfD1UVUqn4ftsd7Dg5y35, source `briefs/fiche-son-reception.html`. Les dix-neuf extraits MP3 (28 Mo) sont publiés avec la page, pas dans le dépôt. On y trouve les courbes de sonie des trois parcours, le duel piste par piste et le guide de l'essai.
- Neuf cartes :
  - S5-PAGES, recommandé « Bien ainsi, avec la correction » ;
  - S5-COMBAT, recommandé « Bien ainsi » ;
  - S5-FOULE, recommandé « Creuser la foule à 500 Hz » ;
  - S5-REFUS, recommandé « Le refus 6 dB plus fort hors du duel » ;
  - S5-MOMENTS (la fanfare, les jingles), recommandé « Bien ainsi » ;
  - S5-DUREE (les longs combats), sans recommandation ;
  - S5-JEU (l'essai en jeu de tout le son), sans recommandation ;
  - S5-RECEPTION, recommandé « Reçu, avec les réglages choisis sur cette fiche » ;
  - SA-10, sans recommandation : préparée, pas tranchée.
- `decisions` relu vide à la publication. Vérifiée en local avec le squelette du service reproduit : 19 lecteurs chargés, aucun débordement à 390 px, les courbes lisibles à 1 200 px.
- **L'ancienne branche `claude/gifted-lewin-77d4c2`** (`055c81b`, `0335ec8`), qui attendait l'accord de l'opérateur (Passe SN20), est supprimée en local et sur GitHub le 2026-11-04 par la séance de S2, sur l'accord de l'opérateur, mot pour mot : « Oui, la supprimer ». Avant la suppression, cette séance a comparé ses changements à ceux de `bd8eb8f` et `b47cde1`, fichier par fichier : seuls diffèrent, comme voulu, le journal (l'archivage SN13-SN14 et la note du rejeu) et une ligne de commentaire de `tools/audio/places-listen.mjs` (le hash du commit). Vérifié ici : la branche n'existe plus, ni en local ni sur `origin`. Le point est clos.

### Limites
- **Personne n'a écouté.** Je n'ai pas d'oreille : les sonies, les crêtes et les octaves attrapent les écarts et les masques grossiers, pas la beauté d'un passage ni la fatigue d'un vrai joueur.
- Les 2 s de silence entre deux pages sont une hypothèse ; le chargement réel dépend de la machine.
- Les combats sont ceux du bot ; les rendus viennent du moteur hors ligne dans Chrome.
- Aucun fichier de `src/` ni de `public/` ne change, et aucun fichier audio n'entre dans le dépôt.

### Où reprendre
- Relire `decisions` quand l'opérateur dit la fiche remplie, et consigner mot pour mot. N'appliquer que ce qui est décidé, avec ses preuves (`analyse --check`, `engine-proof`, `decode-proof` si un fichier change, `hooks-proof` et `page-proof` sur un serveur DEV), puis fusionner.

### Pensée
- Un parcours se rend page après page, avec l'état que le jeu garde entre deux pages : seul ce rendu a montré le relevé périmé après un combat, qu'un rendu de page seule ne pouvait pas voir.
- Une sonie de 400 ms ne dit pas si un son se détache. Le son seul contre sa page seule, octave par octave, le dit : le clic est net, le refus couvert.
- Un niveau global cache une bande : 5 dB sous la musique en sonie, la foule la dépasse dans l'octave de la mélodie.

## Passe SN22 — La fiche du mixage et de la réception relue, neuf sur neuf : la foule creusée, le refus plus fort, le relevé corrigé ; le son reçu (2026-11-04)

### Demande
- L'opérateur a dit la fiche remplie (« Fiche remplie »). Il fallait relire `decisions` (https://claude.ai/artifact/6PfD1UVUqn4ftsd7Dg5y35), consigner les choix mot pour mot et n'appliquer que ce qu'ils décident, avec leurs preuves. Puis fusionner (Passe SN21).

### Les choix de l'opérateur, mot pour mot (neuf sur neuf, sans note)
| Carte | Ce qu'elle demandait | Choix |
|---|---|---|
| S5-PAGES | D'une page à l'autre | « Bien ainsi, avec la correction » |
| S5-COMBAT | Le combat dans la partie | « Bien ainsi » |
| S5-FOULE | La foule de l'arène et la musique du combat | « Creuser la foule à 500 Hz » |
| S5-REFUS | Le refus de l'interface sur la musique | « Le refus 6 dB plus fort hors du duel » |
| S5-MOMENTS | La fanfare et la fin d'un combat | « Bien ainsi » |
| S5-DUREE | Les longs combats | « Rien à changer » |
| S5-JEU | Tout le son, en jouant | « Bien dans le jeu » |
| S5-RECEPTION | La réception du son de la version 2 | « Reçu, avec les réglages choisis sur cette fiche » |
| SA-10 | Un compositeur humain pour le cœur du jeu | « Pas de compositeur : la musique du groupe reste » |

Six choix suivent la recommandation de leur carte. S5-DUREE, S5-JEU et SA-10 n'en avaient pas.

### Appliqué — [OK]
- **S5-PAGES, la correction du relevé** :
  - `recordOf` (pur, `src/audio/score.ts`), appelé par `save()` (`Sound.ts`). Une page qui joue sa musique écrit le morceau, sa position et l'heure.
  - Une page dont la musique s'est arrêtée ou n'a pas commencé (le duel après le K.O.) transmet le relevé qu'elle a trouvé, avec son heure. Les 10 minutes de `RESUME_MS` comptent donc depuis la dernière fois que ce morceau a été entendu.
  - La position transmise ne change pas : `resumeAt` reprend le morceau où il s'était arrêté, sans avancer.
- **S5-FOULE** : `CROWD_CARVE` (`src/audio/sfx.ts` : 500 Hz, Q 1, −5 dB), un filtre en cloche à l'entrée du groupe de la foule (`crowdScene`).
  - Le murmure et les réactions passent dans le filtre.
  - Le grondement de V8 n'y passe pas : il ne joue que si le murmure ne se charge pas.
- **S5-REFUS** : `REFUSAL_LIFT` (6 dB, `score.ts`), appliqué par le crochet d'une action refusée (`hooks.ts`).
  - `UI_LEVEL.denied` reste 0,29. C'est le niveau du refus du duel tant que ses sons ne sont pas décodés.
  - Le refus du duel (`cue('denied')` à `SFX_TRIM`) ne bouge sur aucun chemin.
  - Hors du duel, le refus sort à 0,29 × 2,00 = 0,578, soit le 0,58 entendu sur la fiche à 0,02 dB près.
- **Rien d'autre ne change** : ni une partition, ni un fichier cuit, ni `MIX`, ni le niveau de la page du duel (S5-COMBAT « Bien ainsi »).
- **Les tests** :
  - `tests/audio-s5.test.mjs`, trois tests :
    - le relevé : le parvis repris après un combat de 7 min 30, repris du début après 11 min ;
    - le refus 6 dB plus fort par le crochet, celui du duel inchangé ;
    - le filtre et son chemin, avec la réponse du filtre telle que la Web Audio API la définit ;
  - `tests/v2-sound-s1` lit maintenant `heard` dans l'appel de `recordOf`.

### Preuves — [OK]
- `npm run typecheck`, `npm test` (404 sur 404), `npm run build`, `npm run art:validate` (61 manifestes, 85 sources, 23 manifestes du son, 0 erreur).
- **`engine-proof.mjs`** : tout passe.
  - La foule de l'arène est son murmure passé dans le filtre, calculé dans l'outil d'après la fiche et non d'après le code : 0,00 % inexpliqué, décalage 0.
  - Le témoin, le murmure tel que cuit, laisse 7,38 % inexpliqué.
- **`render.mjs`, puis `analyse.mjs --check`** : tout passe.
  - Contre le rendu de la Passe SN21, seuls changent 7 rendus sur 75, tous de l'arène.
  - Le murmure seul passe de −25,7 à −28,7 LUFS (crête −12,5 à −15,9 dBTP).
  - Les duels passent de −17,4 / −17,6 à −17,9 / −18,1 LUFS. À plein volume : −14,4 à −14,9 LUFS, crête −1,5 à −1,6 dBTP.
  - Les 68 autres rendus n'ont pas bougé.
- **Sur un serveur DEV** :
  - `hooks-proof.mjs` : tout passe. Une action refusée demande le refus 6,00 dB au-dessus de celui du duel. La foule de l'arène passe par un filtre en cloche (500 Hz, Q 1, −5 dB).
  - `page-proof.mjs` : tout passe (la reprise d'une page à l'autre, le même morceau, le parvis de jour, les lices depuis leur début).
- **Le parcours J2 rendu à nouveau** (`mix-jobs.mjs`) : après le duel contre Vessa, la page laisse le relevé du parvis avec l'heure du parvis (`at` 1793809030028, la même) ; en Passe SN21, elle y écrivait une heure 16 068 ms plus tard. La ville en fin de journée écrit ensuite son propre relevé (`band:fin`).
- **La foule creusée par le moteur** : le même extrait de 45 s du duel contre Vessa (`P-crowd-today` de `mix-jobs.mjs`, désormais creusé par le moteur lui-même) contre le rendu de la proposition de la fiche (`P-crowd-carved`, Passe SN21) : résidu −124,5 dB, foule seule −116,2 dB, c'est-à-dire l'arrondi des flottants ; contre le rendu non creusé, −14,8 et −8,5 dB. La foule seule passe de −24,3 à −27,2 LUFS, l'extrait de −17,7 à −18,1.
- `decode-proof.mjs` n'a pas été relancé : aucun fichier cuit ne change.

### La réception
- **Le plan d'audit du son est clos** (`briefs/fiche-son.html`, lots S0 à S5), sur S5-RECEPTION « Reçu, avec les réglages choisis sur cette fiche ».
  - Le son reste derrière la version 2 (SA-16) jusqu'à ce qu'elle devienne le jeu par défaut.
  - Toute suite sera une demande à part.
- **SA-10 est tranchée** : « Pas de compositeur : la musique du groupe reste ». Aucun brief de devis.
- **Une cible change, par décision de l'opérateur** : la séance mère tenait « la foule de l'arène 5 dB sous la musique du duel » (lot S3). Avec S5-FOULE, la foule perd 2,9 dB en sonie, ce que sa carte annonçait. Dans l'octave de 500 Hz, elle repasse 2,5 à 3,5 dB sous la musique (Passe SN21).
- **Reste à l'opérateur** : l'essai Safari sur un appareil Apple (SC-SAFARI), et avec lui la jointure des boucles en AAC, jamais jugée.

### Le journal
- Avec cette passe, les passes gardées auraient dépassé 60 Ko. SN15 à SN17 sont archivées mot pour mot dans `journal/53-passes-SN15-SN17.md`, avec leur ligne d'index.
- Le déplacement est prouvé :
  - le corps de l'archive est identique aux 17 189 octets retirés ;
  - SN15, SN16 et SN17 n'existent chacune que dans ce fichier ;
  - aucune fin de ligne seule (CRLF gardé).
- Les noms en double qu'une recherche montre (V0 à V3, V5, C1, C2) sont d'anciennes homonymies entre archives, pas ce déplacement.

### Limites
- **Personne n'a encore écouté les trois réglages dans le jeu.** S5-RECEPTION les reçoit d'après les extraits de la fiche, et S5-JEU « Bien dans le jeu » portait sur le son d'avant.
- **L'heure des rendus hors ligne est celle de l'horloge du navigateur**, pas le temps virtuel du rendu. Le parcours J2 prouve donc que l'heure du relevé est gardée, pas la règle des 10 minutes elle-même. Le test la prouve sur `recordOf` et `resumeAt`.

### Où reprendre
- Le son est reçu ; rien n'est ouvert de ce côté, hors SC-SAFARI. Une partie B pour les longs combats ou de vrais instruments seraient des demandes neuves de l'opérateur (S5-DUREE « Rien à changer », SA-10).

### Pensée
- Un réglage décidé « hors du duel » se place là où le code sait qu'il est hors du duel, ici le crochet des actions refusées. Le placer dans une table que le duel partage l'aurait changé par un chemin de repli.
- Une preuve qui compare la sortie du moteur à un fichier cuit doit appliquer à sa référence le même traitement que le moteur, calculé d'après la décision et non d'après le code. Sans traitement, la même référence sert de témoin.
- Comparer le rendu complet à celui d'avant, entrée par entrée, montre ce qu'un réglage touche et ce qu'il laisse : ici 7 rendus sur 75, tous de l'arène.

