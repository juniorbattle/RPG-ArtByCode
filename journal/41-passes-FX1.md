# Journal de bord — archive : passe FX1 (2026-10-31 → 2026-11-01)

> Déplacée mot pour mot de `JOURNAL.md` le 2026-11-01 (Passe CA7) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe FX1 — Nos propres effets de combat pixel art, derrière `fx=new` : six effets peints au démarrage, à l'aveugle devant les anciens, à la fiche de l'opérateur (2026-10-31 → 2026-11-01)

### Demande
- Séance ouverte par une autre séance (`local_94e3af37-…`), texte de la tâche : « Écris nos propres effets de combat pixel art pour le duel de la version 2, générés par le code au démarrage, derrière un paramètre DEV de laboratoire. » Contrainte donnée comme celle de l'opérateur : aucune dépendance, aucune obligation envers un tiers ; ne pas ouvrir le code de pixelfx ni d'aucune autre bibliothèque d'effets, n'en rien copier, aucun clonage, aucune installation. Interdits : le quartier gelé, les feux des places, rien par défaut, aucun nouveau design de personnage.
- Worktree `.claude/worktrees/fervent-einstein-e5a571`, branche `claude/fervent-einstein-e5a571` depuis `main` (`c5eebdb`) ; `npm ci` dans le worktree ; serveurs `fx-dev` (:5233) et `fx-frozen-main` (:5234, `git archive` de `c5eebdb`) par `preview_start`, leurs onglets fermés aussitôt, arrêtés à la fin ; `.claude/launch.json` de la séance non commité.
- Aucune bibliothèque d'effets n'a été ouverte, aucune recherche faite : tout est écrit ici.

### Fait — [OK]
- `src/lab/fxPaint.ts` : **six fonctions pures** (image, graine, rampe) vers des texels, sans `Math.random` ni DOM : `paintHitLight` (4 images, 184 ms, 48 × 48), `paintHitHeavy` (5, 299 ms, 96 × 96), `paintGuard` (5, 266 ms, 56 × 88), `paintCharge` (3 niveaux de 6 images, deux d'éclat et quatre en boucle, 128 × 168), `paintBreak` (7, 465 ms, 112 × 112), `paintKo` (7, 614 ms, 176 × 112). Texels de la grille ×3 des feuilles de combat : `FX_TEXEL` = `PIXEL_WORLD` × 1,42 × 0,9 / 3.
- **Technique** : un texel est un cœur brillant (alpha 255), un cœur mat (254, la poussière : elle prend le niveau de la scène, sans atteindre le bloom), une lueur additive (alpha 0, RVB > 0) ou rien ; aucune demi-transparence. Tramage Bayer 4 × 4 pour les lueurs et les anneaux qui meurent, tirage par texel pour la poussière. Rampes : uniquement des jetons du ton de la page (`src/ui/design/tokens.ts`), l'ambre seul accent chaud la nuit ; encre (`ink`) autour des formes pleines seules, jamais d'un texel isolé.
- `src/lab/combatFx.ts`, sur le modèle de `src/lab/fighterDensity.ts`, atteint par un `import()` derrière `import.meta.env.DEV` : une texture d'effets à part (1024 × 824), **deux appels de dessin quand un effet joue, zéro sinon** : le cœur dans la passe opaque (profondeur et masque de protection comme les sprites : le DOF le garde net), la lueur après elle (`maskSafeBlending('additive')`), sa profondeur **derrière les combattants** à la même place à l'écran (`uFxBack`) : leur silhouette reste entière, elle éclaire l'air autour d'eux. L'aura de charge est dessinée derrière Ren. `window.__fx` : `show`, `all`, `clear`, `measure`.
- `src/arena/ArenaApp.ts` : quatre lignes, toutes `import.meta.env.DEV && this.fxTrial`, plus un champ `declare` ; `spawnFx` rend la main sous `fx=new`. Les événements : coup, garde, garde brisée, `break`, `ko`, `chargeTier`, `effect`. Un palier fermé par les PA ne s'allume pas (`open`) ; l'aura montre le palier qu'un relâché lancerait, ou celui qui attend (V2-2). Effet d'une compétence : le croissant vers l'adversaire (défensive), le niveau 2 de la charge une fois (autre) : aucun coup n'a porté, donc pas d'étoile.
- `tools/art-lab/fx-sheet.mjs` : la planche de toutes les images depuis les peintres, sans navigateur. `tests/combat-fx.test.mjs` : 13 tests. Documents : `AGENTS.md` (le paramètre, l'outil, les tests).
- Découvert en passant, sur `main`, non touché : **l'ancien croissant de garde tombe derrière le gardien**, du côté opposé au coup ; **l'ancienne étincelle ne se voit pas à midi sur Marek** (blanche sur sa barbe : 0 % de sa silhouette changée au seuil de 24, 7,6 % la nuit).

### La boucle de l'art et les critiques à l'aveugle
Trois agents neufs, lettres et ordre tirés au sort, clé hors de leur dossier, mon auto-critique écrite avant le premier verdict (j'attendais 6 à 7,5, le K.O. le plus faible).

| Tour | Comparaison | Résultat | Ce que j'en ai fait |
|---|---|---|---|
| 1 | nouveaux contre anciens, 12 paires (6 moments, nuit et midi) | **12 / 12, 7,0 contre 3,75** ; impact 8 / 5, garde 7 / 3, charge 7 / 3, bris 7 / 4, K.O. 7 / 4 | reprise des fins orphelines, du damier de la poussière, du disque sous l'aura, de l'ancrage de la garde |
| 2 | reprise contre tour 1, 12 paires | **8 / 12, 7,00 contre 6,71** ; garde +2, poussière +1,5 à +2 ; **bris 5 contre 8**, impact à midi 6,5 contre 7,5 | [KO] le bris raccourci à 6 images laissait trois brindilles : rallongé à 7 |
| 3 | quatre retouches contre tour 1, 6 paires | **3 / 6, 6,42 contre 6,50** ; bris 6 contre 5,5 et 6,5, aura de midi 7,5 contre 6 ; **impact 6,5 contre 8 et 7,5** | [KO] l'étoile déplacée sur le buste (demandée au tour 2) : **annulée**, l'étoile reste au contact, sur l'arc |

- La configuration livrée (tour 3 avec l'étoile rendue à sa place) n'a pas été rejugée entière : aucune critique ne l'a vue telle quelle.
- Le coup léger n'a été jugé que sur la planche : aucun moment scripté du duel chargé ne le montre (`strike` y est gardé par Marek).
- Reste relevé par le dernier critique : le bris sans centre une fois l'étoile éteinte, le plus faible des six.

### Lisibilité — [OK] mesurée
Part de la silhouette changée par chaque image (seuil 24, 1080p, deux combattants au repos ; cible / autre combattant, maximum sur l'effet, nuit puis midi) :

| Effet | cible | autre combattant | durée |
|---|---|---|---|
| coup léger | 4,4 % / 3,1 % | 0,4 % / 0,2 % | 184 ms |
| coup puissant | 15,8 % / 13,4 % | 1,4 % / 1,0 % | 299 ms |
| garde | 1,7 % / 1,2 % | 0,2 % / 0,1 % | 266 ms |
| charge, niveau 3 | 0,1 % / 0,3 % | 0 % | tenue |
| bris | 19,8 % / 17,0 % | 1,9 % / 1,3 % | 465 ms |
| K.O. | 13,6 % / 16,1 % | 1,3 % / 1,3 % | 614 ms |
| anciens (étincelle, braise, garde), nuit | 7,6 % / 3,9 % / 2,3 % | non mesuré | 165 à 210 ms |

- Aucun effet ne couvre plus de 2 % de l'adversaire : l'attaque qui vient reste lisible. Le télégraphe au sol est intact : de nuit, `window` et `combo` à 0 px entre avec et sans `fx=new`, contraste 6,77:1 (deutéranopie 6,97), comme sans le paramètre ; à midi 4,26:1 (4,39) sous `fx=new`, non mesuré sans lui.
- L'étoile du coup puissant couvre la main de Ren pendant quelques images : relevé par les critiques, gardé (la déplacer perd).

### Le coût — [OK] sous le budget E24
- `tools/perf.mjs`, Radeon 780M, variantes entrelacées, écart = médiane des écarts **tour par tour**, duel en pause (`__arena.paused`). Série 1080p : 4 ou 5 tours propres sur 5. « pic » = `__fx.all()`, un effet de chacun à la fois, plus que le jeu n'en montrera jamais.

| ms GPU | 1920 × 1080 | écart au duel | écart à la nuit B | 2560 × 1440 (tous les tours) | écart au duel | écart à la nuit B | appels |
|---|---|---|---|---|---|---|---|
| nuit B | 9,49 | | | 15,44 | | | 107 |
| duel nuit | 8,45 | | −0,94 | 14,02 | | −1,31 | 92 |
| duel nuit, fx au repos | 8,54 | 0,00 | | 14,04 | +0,04 | | 92 |
| duel nuit, fx au pic | 8,63 | **+0,10** | **−0,74** | 14,15 | +0,15 | −1,37 | 94 |
| duel midi | 7,47 | | | 12,79 | | | 94 |
| duel midi, fx au repos | 7,52 | −0,18 | | 12,63 | +0,44 | | 94 |
| duel midi, fx au pic | 7,72 | **−0,06** | **−1,61** | 12,80 | +0,57 | −2,59 | 96 |

- Au repos, zéro appel de dessin et zéro triangle de plus : ce que montre la colonne est le bruit (±1 ms d'un tour à l'autre). [?] En 1440p, 1 à 4 tours propres sur 4 selon la variante : autres processus sur la 780M ; le +0,44 du repos à midi, qui ne dessine rien de plus, donne l'ordre de grandeur du bruit.
- [KO → refait] La première série : 1 tour propre sur 5, l'application Claude (`claude:19216`) à 30 % de la 780M tant que la séance travaillait (agent, texte en flux). Refaite séance au repos : 4 ou 5 sur 5. Une mesure GPU se lance la séance immobile.
- **Démarrage** (5 chargements entrelacés, 1080p) : peinture de l'atlas 32 à 34 ms, page prête 1 173 ms contre 1 031 de nuit, 1 080 contre 1 108 à midi : l'écart ne se distingue pas de la dispersion ([1 022-1 651]). Texture de 1024 × 824, 3,4 Mo, 46 images.
- **Première utilisation** : première image d'effet 1,3 ms, comme les suivantes. [KO → retiré] Le préchauffage que j'avais écrit (un quad vide dans l'image de démarrage, comme les variantes d'occlusion de la passe 6) : contrôle sans lui, même 1,3 ms ; il ne servait à rien, retiré.

### Les preuves
- `npm run typecheck`, `npm test` **300 / 300** (code de sortie 0, 13 de plus), `npm run build`, `npm run art:validate` (19 manifestes, 40 sources, 0 erreur, 0 avertissement).
- **Sans le paramètre, le jeu inchangé** : **0 px sur 47 vues** contre `main` figé (`HOLD=1`, `FREEZE_CSS=1`, 1280 × 720, seuil 0) : par défaut, `v2=1`, `combat=dynamic`, `v2=1&time=midday`, `time=midday`, chaque moment scripté. Témoin `main` contre lui-même : 0 px sur 12 vues. Contrôle négatif `fx=new` : 1 164 à 289 744 px sur les vues à effet (un effet change le bloom de toute l'image), 0 sur `window`, `combo` et `heavyRen`, où aucun effet n'est à l'écran : la preuve voit. `ArenaApp.ts` n'a plus changé après cette série ; seuls les fichiers du labo, chargés par le paramètre seul.
- **Paquet de production** : SHA-256 identiques sur les 33 fichiers, depuis l'archive du commit de la branche (`git -c core.autocrlf=false archive`) contre celle de `main`. [KO → compris] Le premier essai, depuis la copie de travail, différait sur `index.html` par ses CR seuls (`AGENTS.md` le prévient) ; les 32 autres fichiers identiques.
- `tools/arena-scene-check.mjs` **PASS** partout (0 erreur, le sol dégagé du HUD) : `v2=1&fx=new` (empreinte `sameAsRecorded`, 87 rendus, 77 cas), avec `time=midday`, avec `fighterdensity=combat` ; sans le paramètre : par défaut (`sameAsPrototype`, 42 rendus), `combat=dynamic` (63), `v2=1` (87). Le contrôle vivant avance de 4,85 à 4,92 s.
- **18 fautes injectées sur 18 attrapées**, chaque fichier rendu à l'octet (SHA-256) : `Math.random` dans un peintre, la graine ignorée, une transparence, une couleur hors des jetons, l'or la nuit, les tons sombres de jour, l'encre autour d'un texel isolé, la poussière en Bayer, la poussière brillante, trois images, une image vide, deux niveaux de charge, la boucle qui saute, le niveau 1 en ambre, les paliers décalés, des cases qui se chevauchent, le crochet hors de DEV, une dépendance tierce. [KO → corrigé] 15 sur 18 au premier passage : la graine testée en bloc (un effet pouvait l'ignorer), une faute sans effet observable (remplacée), et **« la boucle ferme », un test vrai par construction** (le `% 4` du peintre) : remplacé par un oracle sur les texels (le décalage qui ajuste une image sur la suivante est de 8 rangées à chaque pas, couture comprise).
- [KO → corrigé] Les tests ont trouvé trois dernières images vides (coup léger, coup puissant, bris) : toutes les étincelles déjà mortes, du temps à l'écran pour rien.
- [KO → corrigé] Mon premier tableau des anciens effets (85 à 88 %) venait de mon script : la référence photographiée avant le rendu de la scène.

### La fiche — à remplir par l'opérateur
- Page privée https://claude.ai/artifact/NWXvBHkzo9mKUT8WLGZheM (source `briefs/fiche-fx1.html`), collection `decisions` vide à la publication : six choix effet par effet (« Adopter », « Reprendre (en note) », « Garder l'existant »), recommandés « Adopter », et FX-7 la suite (« Tâche à part, derrière flags.v2 », recommandé), avec les films image par image à la vitesse réelle et au ralenti, avant / après, nuit et midi. Images gardées : `screenshots/calibration/fx1-combat/`.
- **Rien n'est décidé par cette passe** : tout reste au labo, rien par défaut.

### Journal — [OK] archivage (passes gardées au-delà d'environ 60 Ko)
- Avec cette passe, les passes gardées auraient dépassé 60 Ko. FV4 et FV5, closes (fusionnées), partent vers `journal/37-passes-FV4-FV5.md` (13 508 octets, bloc de 13 226) ; restent 57,6 Ko. Preuve **8 / 8** par un script hors dépôt contre la copie de `JOURNAL.md` d'avant le déplacement (corps de l'archive égal au bloc ; FV4 et FV5 d'un seul tenant, suivies de V2C1 ; plus dans `JOURNAL.md` ; chaque passe dans un seul fichier ; de V2C1 à V2B1 inchangé à l'octet ; FX1 juste avant « À reprendre » ; CRLF seuls ; en-tête comme `journal/36`). Contrôle négatif : un bit changé dans une copie de l'archive est vu.

### Restes [?]
- L'essai en main de l'opérateur (`npm run dev`, `?scene=arena&v2=1&fx=new`) ; le mode jouable ne porte pas le paramètre.
- L'écart de la garde par combattant (`GUARD_OUT`, Ren et Marek) à reprendre avec les feuilles des rivaux.
- Le coût à midi en 1440p dans des tours sans contention.

### Pensée
- Une critique à l'aveugle se relit contre la suivante : le tour 2 demande l'étoile sur le buste, le tour 3 préfère celle de l'ancienne place, de 1 à 1,5 point. La règle (ce qui ne gagne pas s'annule) a tranché.
- Raccourcir un effet se juge à l'instant où le jeu le montre : le bris à 6 images était meilleur sur la planche et perdait 5 contre 8 en scène, parce qu'il était déjà fini.
- Un test « vrai par construction » se repère à la faute qui passe : ajouter la faute avant de croire le test.
- Une lueur additive derrière les combattants, à la même place à l'écran, garde la silhouette entière : c'est la profondeur qui change, pas l'image.
- Un effet qui marche la nuit par la lumière marche à midi par le contour : du noir autour de ce qui est plein, jamais autour d'un texel isolé, et rien de sombre sur le sable.

