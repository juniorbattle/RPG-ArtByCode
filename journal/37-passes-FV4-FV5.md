# Journal de bord — archive : passes FV4 et FV5 (2026-10-29)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-11-01 (Passe FX1) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe FV4 — Les preuves locales de la version 2 : budget GPU, cuisson neuve, visibilité, arène vivante, revue en rendu matériel (2026-10-29)

### Demande, mot pour mot
- Opérateur : « Fiche rempli oui tu peux gerer les preuves locales oui » (le même message que la Passe FV3) ; la séance de la Passe FV3 a ouvert
  celle-ci pour les preuves que la séance cloud n'avait pas pu faire, faute de GPU.
- Branche `preuves-v2-fv4` depuis `main` (`6016c7c`). Aucun changement du jeu : `src/` n'est pas touché ; trois outils étendus (ci-dessous).
- Conditions : serveur DEV `dev-strict` (:5186) par `preview_start`, son onglet fermé aussitôt ; chaque série en arrière-plan, attendue jusqu'au
  bout dans la séance ; Chrome sur la **Radeon 780M** (ANGLE D3D11) ; témoin de contention au seuil de 15 %. Le témoin était vide avant la série ;
  pendant la série 1080p, les Chrome sans fenêtre d'une séance RPGCards en cours (« Protagoniste : marche de profil… ») ont pris 17 à 35 % de la
  780M par moments (PID 8796, 22872, 28372, 23068) : ces tours sont marqués et écartés, rien n'a été touché.

### Les outils étendus — [OK]
- `tools/perf.mjs` : la page d'une place v2 (`window.__plaza`) ; la définition lue sur le canvas quand la page n'en publie pas (`PlazaApp.snapshot()`
  n'a pas `resolution` : le résumé aurait planté, comme Lantern Row en Passe Q4).
- `tools/startup.mjs` : une place v2 rapporte sa construction et sa cuisson de visibilité (`vis.ms`, poses, pages, cache) au lieu des sondes de la
  ville (révélation, forge, régénération), qu'elle n'a pas.
- `tools/cadence.mjs` : les rendus comptés aussi sur `window.__arena` et `window.__plaza` (seul `__app` l'était : le duel et les places n'auraient
  donné aucun intervalle) ; la définition lue sur le canvas.

### 1. Le budget GPU (E24, « Pas plus cher que la nuit B, à définition égale ») — [OK] les places dessous ; [?] le quai v2 en B à égalité, +0,1 ms
- Variantes entrelacées dans une seule session de navigateur ; « écart » = la médiane des écarts **tour par tour** à la nuit B (les deux variantes
  du même tour, propres toutes deux) : la dérive d'un tour à l'autre (la nuit B de 8,57 à 10,43 ms en 1080p) fausse une comparaison de médianes
  prises dans des tours différents. 1080p : 5 tours ; 2560 × 1440 : 4 tours, **tous propres**. Le héros à l'arrivée de chaque place.

| Page (ms de GPU par image, médiane des tours propres) | 1920 × 1080 | écart à B | 2560 × 1440 | écart à B | passe de scène 1080p / 1440p |
|---|---|---|---|---|---|
| nuit B (`seed=1842&clean=1&camera=B`) | 9,29 (4/5) | — | 14,13 (4/4) | — | 5,95 / 8,96 |
| quai v2, plan A, nuit (`skyline=arena&heraldry=tournament`) | 8,03 (4/5) | −0,76 | 12,84 (4/4) | −1,24 | 4,84 / 7,71 |
| quai v2, plan B, nuit (idem) | 9,83 (4/5) | **+0,13** | 14,23 (4/4) | **+0,14** | 6,34 / 9,00 |
| quai d'une partie v2, matin (`v2-day1-morning`) | 8,56 (4/5) | −0,64 | 12,46 (4/4) | −1,73 | 5,54 / 8,01 |
| duel v2, nuit (`scene=arena&v2=1`) | 9,09 (4/5) | −0,10 | 13,21 (4/4) | −0,88 | 5,52 / 8,09 |
| duel v2, midi (`&time=midday`) | 9,05 (4/5) | −0,25 | 11,65 (4/4) | −2,44 | 5,66 / 7,32 |
| parvis, matin / midi / nuit | 7,65 / 7,72 / 8,06 | −1,67 / −1,72 / −1,11 | 11,35 / 11,44 / 12,28 | −2,73 / −2,66 / −1,83 | |
| lices, matin / midi / fin de journée / nuit | 6,91 / 6,83 / 6,98 / 8,55 | −1,67 / −1,78 / −1,81 / −0,85 | 11,24 / 11,27 / 11,23 / 12,83 | −2,87 / −2,82 / −2,90 / −1,27 | |
| halle, matin / après-midi / nuit | 7,37 / 7,21 / 7,94 | −1,92 / −1,60 / −1,08 | 11,22 / 11,39 / 12,74 | −2,89 / −2,72 / −1,36 | |

- **Les trois places sont sous la nuit B** à chaque moment, de 0,85 à 1,92 ms en 1080p et de 1,27 à 2,90 ms en 1440p (leur nuit est leur moment le
  plus cher : 15 à 16 lumières allumées). Leurs trois cadrages (série à part, 1080p, 4 tours tous propres, nuit B 8,72 ms) : parvis de nuit −0,76
  à −1,76, de midi −1,60 à −2,55 ; lices de nuit −0,83 à −1,52, de midi −1,69 à −2,16 ; halle de nuit **−0,13 à −1,32** (l'arrivée et la place,
  ses cadrages hauts, les plus proches de la nuit B), d'après-midi −1,53 à −2,56. Aucun cadrage ne dépasse.
- **Le quai d'une partie v2 en plan B, la nuit, dépasse de 0,1 ms** : +0,01 à +0,28 ms selon le tour en 1440p (médiane 14,23 contre 14,13, +0,7 %),
  −0,02 à +0,64 en 1080p (médiane des écarts +0,13). Le surcoût est partagé entre la passe de scène (+0,04 ms en 1440p) et le bloom (+0,03) ;
  c'est la scène de la nuit B (mêmes 107 appels, 211,6 k triangles contre 211,1 k) avec les emblèmes du tournoi sur ses drapeaux (Passe VP3).
  En plan A, où l'arène remplace la cathédrale (`skyline=arena`, Passe VP8), le quai v2 coûte moins que la nuit B. **Rien n'est changé au rendu :
  décision de l'opérateur**, avec sa réserve (« Mais rien n'est confirme car il y a peut etre des zones plus grande et dense »).
- Le duel v2 : un tour de 1080p à 477 ms (une valeur aberrante du minuteur, sans contention relevée), sans effet sur la médiane ; les autres
  tours dessous.

### 2. La cuisson de visibilité neuve des places — [OK] 164 à 260 ms sur GPU
- `tools/startup.mjs`, `viscache=0`, 4 chargements, 1080p, aucune contention : parvis **565 poses en 260 ms** [255-287] (18 pages), lices **323 en 164
  ms** [158-178] (11 pages), halle **513 en 260 ms** [257-263] (17 pages), de jour comme de nuit ; construction de la place 250 à 490 ms (les lices
  les plus longues) ; page prête en 2,0 à 2,25 s, contre 1,53 s pour la nuit B (sa cuisson neuve : 213 ms). La plus longue tâche : 0,5 à 0,65 s.
  En rendu logiciel, la séance cloud mesurait 14 à 49 s (Passe VP9). Les poses : celles de la Passe VP9 (parvis 565, lices 323, halle 513).

### 3. La visibilité des places sur GPU — [OK] 0 px sur 101 vues ; le contrôle négatif à 27 215 px
- `tools/plaza-shots.mjs`, 1920 × 1080, `static=1`, élaguée contre `vis=0`, comparées au seuil 0 (un script hors dépôt : tout écart d'un niveau
  compte) : 9 états (le parvis à midi et la nuit ; les lices au matin, à midi, en fin de journée et la nuit ; la halle au matin, l'après-midi et la
  nuit), 12 places du héros par place (les quatre coins, le milieu des quatre bords, quatre places intérieures ; les cadrages de chaque zone), 13
  pour la halle : **0 px différent sur 101 vues**. Témoin : la halle de nuit chargée deux fois, 0 px sur 13 vues.
- **Le pixel du coin ouest de la place festive** (Passe VP7, −11 / −9,6) : 0 px à −11 / −9,6 et −10,5 / −9,6 sur les trois états de la halle. La
  place festive de VP7 a été rebâtie en place de la halle (Passe VP9) : son mur de plâtre n'existe plus, rien à expliquer. `tools/vis-why.mjs` ne
  sait que le district ; aucun résidu ne l'a demandé.
- **Contrôle négatif** : [KO] une cuisson dix fois plus grossière (`visscale=0.1`, 52 pièces cachées au lieu de 48) ne perd que 2 px d'un niveau sur
  une vue : trop faible ; [KO] le héros hors de sa marche : les cadrages bornent la caméra, rien de neuf. [OK] la caméra forcée par JS derrière la
  halle (depuis le nord, des faces que la cuisson a écartées) : **27 215 px** différents (`fv4-v2-review/vis-controle-negatif-diff.png`).

### 4. L'arène vivante et le parcours du combat — [OK]
- `tools/arena-scene-check.mjs` sur GPU (il échouait en rendu logiciel, « advanced 0 », Passe V0) : **PASS** dans les trois règles. Le contrôle
  vivant avance de 4,867 s (défaut, `combat=dynamic`) et 4,917 s (`v2=1`) en 272-273 images ; empreintes : le prototype (défaut), `DYNAMIC_SIM_HASH`,
  `V2_SIM_HASH` (« sameAsRecorded ») ; 42 / 63 / 84 rendus de moments sans erreur ; télégraphe 6,94:1 (deutéranopie 7,15), 6,77:1 sous les
  nouvelles règles ; le sol dégagé du HUD dans 22, 44 et 77 cas.
- `tools/play-flow.mjs` : `V2=1` victoire (1842, jour 2), rejeu Node `5cfe614a12cc08bd` = navigateur ; `V2=1` défaite (7719, jour 2) `671a95a659b6ac06` =
  navigateur ; par défaut, victoire : **`0025acce7a403773`**, la même empreinte que les Passes UI3, UI4 et V0 : le jeu par défaut n'a pas bougé.
  « all checks passed », aucune erreur de page.

### 5. Les captures de revue, en rendu matériel — [OK] page privée
- **Page** : https://claude.ai/artifact/EQPBWPv3msxgds6nGkDzLQ (privée) : le tableau du budget ; les trois places à chaque moment dans leurs trois
  cadrages (30 vues, 1280 × 720, le héros posé, 40 pas de jeu avant la photo, foule en place, l'interface masquée) ; six séquences en mouvement
  (0,8 s, 12 images : la cour du parvis à midi et la nuit, les lices à midi et la nuit, la place de la halle l'après-midi et la nuit : les flammes,
  le jet de la fontaine, les poussières, la foule) ; les cinq cinématiques, une image par réplique ; les écrans (le duel chargé de nuit et de jour,
  le dialogue P4 au téléphone couché aussi, les compétences, l'équipement, « Here » P5, la fiche de match, la victoire et la défaite P6).
- Les cinématiques : une partie v2 (graine 1842) menée par `window.__game` (deux entraînements avec Orla au jour 1, `orla-recruitable` ; les combats
  gagnés au résultat fixe des états nommés), chaque page rouverte avec `&cutscene=1` : arrivée (3 répliques), coupe (jour 5, soir, 2), Orla (jour 7,
  3), veille de la finale (jour 9, 2), finale (jour 10, 2) ; chacune marquée vue (`scene:<id>`).
- Gardées dans le dépôt : `screenshots/calibration/fv4-v2-review/` (17 images : un cadrage par place et par moment, la première réplique de
  chaque cinématique, le duel chargé, la différence du contrôle négatif).
- [KO → corrigé dans la séance] Les premières captures portaient le voile de l'écran de chargement (fondu CSS de 0,8 s, Passe UI4) : la boucle tenue,
  la photo partait avant la fin du fondu ; le script de revue masque `#loading`, et `tools/arena-scene-shots.mjs` coupe les transitions avec
  `FREEZE_CSS=1` (sans lui, ses captures portent le voile depuis la Passe UI4).

### 6. La cadence perçue — [OK] 55 images/s
- `tools/cadence.mjs`, fenêtre discrète, `max` (2560 × 1267, dpr 1,75), plafond `a60`, deux tours : la nuit B, la halle de nuit, les lices de nuit,
  le duel v2 : **55,0 images/s, 3 vsyncs à 100 %**, aucun changement de pas ; SoC 30 à 36 W (la nuit B 31 à 36). Écran à 163,9 Hz.
- [?] Les lices de nuit, au second tour : quatre images longues (73, 49, 42, 51 ms) sur 432, sans contention GPU relevée ; **non reproduites** sur trois
  tours de 10 s refaits aussitôt (0 image au-delà de 25 ms). Un incident isolé.
- Observé : la page d'une place reçoit deux fois plus de rappels rAF que la ville au même plafond (2 640 contre 1 320 en 8 s) : deux boucles rAF
  semblent tourner, sans effet sur la cadence mesurée. [?] Non élucidé, rien changé.

### Validation
- `npm run typecheck`, `npm test` **278 / 278** (code de sortie 0, vérifié), `npm run build`, `npm run art:validate` (0 erreur, 0 avertissement).

### Restes [?]
- **À décider par l'opérateur** : le quai d'une partie v2 en plan B la nuit, +0,1 ms (+0,7 %) sur la nuit B (les emblèmes du tournoi) ; tout le
  reste de la version 2 est sous la nuit B.
- La revue de l'opérateur sur la page de revue, puis en jeu ; l'écoute du son (V2-15, non faite ici : aucun casque dans une séance) ; les pages des
  places au téléphone non mesurées ; les deux boucles rAF des places.

### Pensée
- Un écart à une référence se lit en paires, tour par tour : la dérive d'un tour à l'autre (2 ms en 1080p ce soir) dépasse la plupart des écarts
  cherchés, et des médianes prises dans des tours différents la mélangent.
- Le contrôle négatif d'une cuisson de visibilité doit montrer à la caméra ce que la cuisson a écarté : une cuisson plus grossière ou un héros hors
  de sa marche (la caméra bornée par son cadrage) ne perdent presque rien et feraient croire la comparaison aveugle.
- Un écran de chargement qui s'efface en CSS est sur toute capture faite boucle tenue : la capture coupe les transitions, ou masque l'écran.

## Passe FV5 — Le quai v2 en plan B la nuit : l'égalité avec la nuit B acceptée par l'opérateur (2026-10-29)

### La décision, mot pour mot
- Question posée à la fin de la Passe FV4 : « Que faire des +0,1 ms du quai v2 en plan B la nuit ? » ; réponse de l'opérateur : « Accepter
  l'égalité ».
- Branche `decision-quai-fv4` depuis `main` (`e9c5e8b`).

### Ce qu'elle tranche — [OK]
- Le quai d'une partie v2 en plan B la nuit (+0,13 ms en 1080p, +0,14 ms en 1440p, +0,7 %, la scène de la nuit B avec les emblèmes du tournoi,
  Passe FV4) est tenu pour **à égalité** avec la nuit B au regard du budget E24 (« Pas plus cher que la nuit B, à définition égale ») ; aucune tâche
  d'optimisation. La version 2 entière tient donc le budget sur la 780M, sous la réserve de l'opérateur de la Passe D8 (« Mais rien n'est confirme
  car il y a peut etre des zones plus grande et dense »). Rien n'est changé au jeu.

