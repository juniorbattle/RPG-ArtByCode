# Journal de bord — archive : passes FX2, FX3, FX4, FX5 (2026-11-01)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-11-01 (Passe CX2) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe FX2 — Les effets de la Passe FX1 ne sont pas validés : orientation vers des effets comme ceux de RPGThreeJS (2026-11-01)

### La décision, mot pour mot
- Opérateur, après la Passe FX1 : « Je ne valide pas les nouveau vfx et nous allons plutot nous orienter vers conception de vfx similaire au projet RPGThreeJS ».
- La fiche FX1 n'a pas été remplie (collection `decisions` vide, relue) : elle est close sans choix, ses recommandations « Adopter » tombent. `fx=new` reste sur `main` (labo, hors production) jusqu'à ce que la suite le remplace.

### Lu dans RPGThreeJS — lecture seule, ouverte par cette décision ; rien de copié
- `src/combat/fx/` (`FxEngine`, `FxDirector`, `fxRecipes`, `fxSkills`, `fxPalettes`, `fxIntensity`), `docs/combat/COMBAT_HD2D.md`, ses décisions et ses images de revue. Le Composer (`src/combat/vfx/`) n'est pas la voie : il ne joue plus en combat, et il repose sur des planches commerciales.
- L'opérateur y a déjà tranché la même question, après un essai pixel écrit à la main : « je pense que nous allons garder les effets ultimes actuel car ils sont nieux adapte et visuellement plus abouti » (OD-2026-10-31-B).

| | FX1 (écarté) | RPGThreeJS |
|---|---|---|
| Forme | images peintes, grille ×3, 4 à 7 images | géométrie vivante en pleine résolution : plans, anneaux, piliers, dômes, particules carrées, shader à bandes de tons nettes |
| Lumière | trame additive, le `hitLight` existant | cœurs blanc chaud qui bloom, corps saturés, vraie lumière sur l'arène, flash |
| Écriture | une peinture par événement | recette : une suite d'étapes datées sur des ancres (source, cible, sol, ciel), `impactAt` |
| Mise en scène | le tremblement existant | coup de caméra, lignes de vitesse, projecteur, charge avant le coup, ralenti |
| Identité | six effets pour tout le duel | une signature par compétence, une couleur et une forme par classe |
| Règles | | sceau réservé à la magie ; anneau de choc une fois, sur le coup, rien de circulaire après ; entaille avec une lame sombre dessous |

### À porter pour l'arène — [?] à décider avec l'opérateur
- Ce qui ne se transpose pas tel quel : three r160 là-bas, r186 ici ; ici la cible HDR à 4 × MSAA, le masque de protection dans l'alpha (`maskSafeBlending`), le seuil de bloom à 1,15 ; le budget E24 ; `flags.v2`, rien par défaut ; l'ambre seul accent chaud la nuit.
- **Le ralenti** : là-bas le temps d'effet ralentit un combat au tour par tour ; ici « le temps ne s'arrête jamais » (`briefs/combat-system.md`, G1) et les fenêtres d'esquive courent : un ralenti du duel toucherait un verrou. Il n'est possible qu'au K.O., duel fini.

### Pensée
- FX1 a suivi son brief à la lettre et ses critiques ne le comparaient qu'aux anciens effets : 12 paires sur 12 ne disaient rien de la cible de l'opérateur. Une référence de qualité se demande avant la première image, pas après la fiche.
- Sept effets à la grille de texels ne sont pas le HD-2D du projet voisin : le sprite y est pixel, l'effet y est de la lumière.

## Passe FX3 — Le moteur d'effets de RPGThreeJS porté dans le duel, derrière `fx=new` (2026-11-01)

### Les décisions de l'opérateur, mot pour mot
- Question « Comment reprend-on les VFX de RPGThreeJS pour le duel ? » : « Porter son moteur (Recommandé) ».
- Question du ralenti (« dans le duel, le temps ne s'arrête jamais et les fenêtres d'esquive courent ») : « Seulement au K.O. (Recommandé) ».
- « soyons sur de reprendre la derneir session travailler de RPGThreeJS » : vérifié avant de copier, en lecture seule : `dev` à `5cc6119e` (2026-11-01 01:01), dossier propre, égal à `origin/dev`, un seul worktree, la branche cloud `fd7f0d36` incluse dans `dev`, `main` de septembre. Le portage part de ce commit, cité dans les en-têtes.
- Ce dépôt est public : le code porté de RPGThreeJS le devient (dit à l'opérateur).

### Fait — [OK]
- `src/lab/fx/FxEngine.ts` (copié puis adapté), `fxPalettes.ts`, `FxDirector.ts` (réduit : ni grille, ni zone, ni finale), `fxRecipes.ts` (le format de RPGThreeJS, les recettes écrites ici), `src/lab/combatFx.ts` (les événements du duel choisissent les recettes). `fxPaint.ts` et `tools/art-lab/fx-sheet.mjs` retirés (dans l'historique : `74477fd`). Sans `Math.random`, DEV seulement, derrière `fx=new`.
- **Adaptations à ce rendu** : `maskSafeBlending` partout (une écriture d'alpha casse le masque du DOF) ; aucune lumière THREE, elles n'atteignent pas ces shaders : deux lumières du `LightRig`, priorité 11 ; éclats non éclairés ; rien dans la passe miroir (`LAYER_NOREFLECT`) ; ni flammes (elles dépendent des shaders d'arène de RPGThreeJS) ni planches ; exposition partagée (`FX_EXPOSURE`, 0,5 la nuit, 0,72 le jour).
- **Les recettes** : une par action : les deux coups de chaque camp, les compétences de Ren (dont `k_*`) et des rivaux, garde, garde d'un coup puissant, bris, K.O., les trois paliers de charge, leur respiration, le relâché. Ren en or et acier, l'adversaire en feu, la garde en bleu froid. Règles reprises : anneau de choc une fois, sur le coup ; lame sombre sous chaque coupe ; pas de sceau (personne ne lance de sort ici).
- Coup de caméra, flash, lignes de vitesse, tremblement : par des points d'accroche ; le ralenti ne part que de la recette `ko`, après la fin du duel.

### Ce que les captures ont trouvé — trois tours
- [KO → corrigé] **Le dôme noircissait toute l'image** : `atan(0, 0)` à son sommet et une base négative sous `pow` donnent un NaN, et un seul pixel NaN noircit le cadre à travers le bloom. RPGThreeJS ne le montre pas, sa chaîne est différente. Testé.
- [KO → corrigé] **Trop grand, trop lumineux** au premier essai, de nuit surtout : le combattant disparaissait. Les nombres de RPGThreeJS sont réglés pour son rendu : exposition ramenée à 0,5 et 0,72, tailles réduites de 40 % environ, disque de l'étoile réduit, plafonds testés.
- [KO → corrigé] La tête de Ren dépassait du dôme de Rempart : rayon 3.
- Non fait : pas de critique à l'aveugle sur ce portage, la référence est l'opérateur, en jeu. Les recettes des rivaux n'ont pas toutes été revues en image.

### L'à-coup du premier coup — [KO → corrigé], mesuré
- Le premier coup d'un combat coûtait **70 à 150 ms** de rendu, contre 11 ensuite : un moteur vivant compile ses programmes à la première utilisation (journal pass 6). Dans un duel en temps réel, c'est un saut visible.
- [KO] Un préchauffage suivi d'un `clear()` : encore 89 à 101 ms : disposer le dernier matériau d'un programme le supprime.
- [OK] Chaque matériau dessiné une fois sous l'écran de chargement, puis caché et gardé (`warm`, `settle`) : **0,3 à 0,9 ms** au premier coup, 0,4 à 1,2 ensuite (écart à une image sans effet, 4 chargements). Démarrage : 1 068 contre 1 044 ms de nuit, 1 000 contre 1 058 à midi : indiscernable.

### Le coût — [OK] au niveau du budget E24, au pire cas
- `tools/perf.mjs`, Radeon 780M, écart = médiane des écarts tour par tour, duel en pause. « pic » = `__fx.stress()` : `heavy`, `m_ironfall`, `t4`, `break`, `guardHeavy`, `charge3`, `ko` enchaînés toutes les 0,3 s, plus lourd qu'un duel réel.

| ms GPU | 1920 × 1080 | écart au duel | écart à la nuit B | 2560 × 1440 | écart au duel | écart à la nuit B | appels |
|---|---|---|---|---|---|---|---|
| nuit B | 9,49 | | | 15,43 | | | 107 |
| duel nuit | 8,50 | | −1,08 | 14,00 | | −1,54 | 92 |
| fx au repos | 8,44 | +0,02 | | 13,73 | −0,15 | | 92 |
| fx au pic | 9,52 | **+1,02** | **+0,02** | 15,41 | +1,43 | −0,03 | 99 à 124 |
| duel midi | 7,64 | | | 12,39 | | | 94 |
| fx au repos | 7,63 | −0,01 | | 12,22 | −0,06 | | 94 |
| fx au pic | 8,42 | **+0,78** | **−1,06** | 13,70 | +1,15 | −1,76 | 110 à 115 |

- Au repos, rien. Au pic, la nuit est **à égalité** avec la nuit B : c'est le seul point sans marge, à l'opérateur de le juger (Passe FV5 : « Accepter l'égalité » sur un cas voisin).
- [?] Un Chrome étranger (`chrome:22148`) a chargé presque tous les tours : les temps absolus ne valent rien, seuls les écarts entrelacés ; ils sont stables (+0,97 à +1,16 en 1080p la nuit).

### Les preuves
- `npm run typecheck`, `npm test` **297 / 297**, `npm run build`, `npm run art:validate` (19 manifestes, 40 sources, 0 erreur).
- **Sans le paramètre** : **0 px sur 47 vues** contre `main` figé (cinq adresses, `HOLD=1`, `FREEZE_CSS=1`, seuil 0) ; témoin 0 px sur 12 vues ; contrôle négatif `fx=new` : 273 194 à 766 330 px sur les vues à effet, 0 sur `window`, `combo` et `heavyRen`, sans effet à l'écran. Paquet de production : SHA-256 identiques sur 33 fichiers, depuis l'archive du commit.
- `tools/arena-scene-check.mjs` **PASS** sous `v2=1&fx=new`, avec `time=midday`, avec `fighterdensity=combat` (empreinte `sameAsRecorded`, 87 rendus, le sol dégagé du HUD dans 77 cas, 0 erreur ; télégraphe 6,77:1 la nuit, 4,26:1 à midi).
- `tests/combat-fx.test.mjs` réécrit, 10 tests : **20 fautes injectées sur 20 attrapées**, chaque fichier rendu à l'octet (SHA-256) : ralenti sur un coup, anneau après le coup, deux anneaux, compétence sans recette, couleur inconnue, étape après la fin, coups adverses en bleu, étoile trop grande, pilier au niveau 1, paliers décalés, coupe non retournée, contact du mauvais côté, étincelles de garde vers l'avant, mélange brut, lumière THREE, les deux NaN du dôme, effet hors du calque, crochet hors de DEV, dépendance tierce.

### La fiche — à remplir par l'opérateur
- La page de la Passe FX1 reprise à la même adresse : https://claude.ai/artifact/NWXvBHkzo9mKUT8WLGZheM (source `briefs/fiche-fx1.html`), six familles (« Valider », « Reprendre (en note) », « À écarter ») et H-7 la suite (« Tâche à part, derrière flags.v2 », recommandé) ; `decisions` vide. Rien n'est décidé par cette passe. Images gardées : `screenshots/calibration/fx3-combat/` (celles de FX1 retirées).

### Journal — [OK] archivage
- Avec FX2 et FX3, les passes gardées dépassaient 60 Ko. V2C1, close, part vers `journal/38-passes-V2C1.md` (12 514 octets, bloc de 12 240) ; restent 57,1 Ko. Preuve **8 / 8** par un script hors dépôt ; contrôle négatif : un bit changé dans une copie de l'archive est vu.

### Restes [?]
- L'essai en main : `npm run dev`, `?scene=arena&v2=1&fx=new` ; le mode jouable ne porte pas le paramètre.
- Le dessin par effet coûte un appel par maillage et des géométries créées à la volée : à revoir si le lab passe en production.
- Les couleurs des compétences hors ambre la nuit (`lightning`, `wind`, `sky`, `blood`) s'écartent de la direction verrouillée « l'ambre seul accent chaud » : à trancher sur la fiche.

### Pensée
- Un portage se vérifie contre le rendu d'arrivée : le NaN dormait dans le code d'origine, et ses nombres étaient justes pour une autre chaîne.
- Une mesure de premier usage dépend du moteur : le contrôle de la Passe FX1 (aucun à-coup, préchauffage retiré) ne valait que pour son unique shader. Et préchauffer ne suffit pas si l'on libère ce qu'on a préchauffé.
- La dernière version d'un autre projet se vérifie sur toutes ses références avant de copier, et le commit se cite.

## Passe FX4 — La fiche des effets relue : tout validé, la sortie du labo décidée en tâche à part (2026-11-01)

### Les décisions de l'opérateur, mot pour mot
- La fiche (https://claude.ai/artifact/NWXvBHkzo9mKUT8WLGZheM, collection `decisions`, six lignes, aucune note) : H-1 coups portés, H-2 garde et bris, H-3 compétences, H-4 charge, H-6 K.O. : « Valider » ; H-7 la suite : « Tâche à part, derrière flags.v2 ».
- Trois questions posées en séance après la relecture, réponses aux libellés des options :
  - H-5 Rempart et Ferveur, aucune ligne sur la fiche (document absent, vérifié par son identifiant) : « Valider (Recommandé) ».
  - Les couleurs hors ambre la nuit : « Garder en exception (Recommandé) » : limitée aux effets du duel, une seconde au plus pour ces recettes ; le quartier et les décors ne changent pas. Consigné dans `AGENTS.md`, « Art direction ».
  - L'égalité avec la nuit B au pire cas (+0,02 ms la nuit, 1080p) : « Accepter, remesurer (Recommandé) » : la tâche à part remesure sur de vrais duels et signale tout dépassement.

### La fiche elle-même — [KO] → rattrapé
- La Passe FX3 renvoyait les couleurs « à trancher sur la fiche » et l'égalité « à l'opérateur », mais aucune carte ne les posait : le « Valider » de H-3 ne les tranchait pas. Vu à la relecture, posé directement.

### État — [OK]
- Aucun code touché : `fx=new` reste au labo, en DEV seulement, rien par défaut. Seuls `AGENTS.md` et ce journal changent. `npm run typecheck`, `npm test` **297 / 297**, `npm run build`.

### La tâche à part (H-7)
- Sortir `src/lab/fx/` et `src/lab/combatFx.ts` du labo pour les duels de la version 2 (`arenaRules` = `v2`, dans une partie comme sous `?scene=arena&v2=1`), chargés à la demande ; le jeu par défaut à 0 px contre `main`.
- Reprises de la Passe FX3 : le coût remesuré sur de vrais duels, les recettes des rivaux revues en image, l'écart de garde réglé pour Ren et Marek seulement, le dessin par effet.

### Pensée
- Ce qu'une passe renvoie à une fiche doit y figurer : se relit contre les « Restes » avant de publier. Une ligne absente n'est pas un choix.

## Passe FX5 — Les effets de combat sortis du labo : dans tout duel aux règles de la version 2, le jeu par défaut inchangé (2026-11-01)

### La décision
- H-7 « Tâche à part, derrière flags.v2 » (Passe FX4). L'opérateur a demandé de la faire dans cette séance.

### Fait — [OK]
- `src/lab/combatFx.ts` et `src/lab/fx/` déplacés dans `src/arena/fx/`. `fxOn(rules, params)` (`dynamicView.ts`) : un duel aux règles `v2`, sauf `fx=off`, qui garde les anciens effets pour comparer. `ArenaApp` charge `./fx/combatFx` à la demande dans ce seul cas, dans une partie (`match.rules`) comme sous `?scene=arena&v2=1`. `window.__fx` et le stress restent en DEV ; `fx=new` n'a plus d'objet. Le mode jouable porte `fx` (`play.ts`, `playArena.ts`).
- `guardContact(foe)` : Vessa est sur les clips de Ren, sa garde tombe à son écart (0,7) ; les autres rivaux portent l'art de Marek (`FOES`), donc le sien (1).
- L'exposition lit `parseTime` : l'alias `time=day` tombait sur celle de la nuit.

### La revue des rivaux — [OK], rien à changer
- Les 19 recettes `m_*` en images, nuit et midi, Vessa dans une vraie partie : elles tombent sur la bonne cible, le contact de garde de Vessa est juste. Les boosts sont discrets avant 0,4 s, leur lueur arrive à 0,45-0,6 s et se lit de jour comme de nuit.

### Le coût sur de vrais duels — [OK], sous la nuit B
- `tools/perf.mjs` sur le paquet de production, Radeon 780M, 14 s par tour, 4 tours entrelacés. Le duel est réel : un petit robot tient l'attaque selon une suite fixe (coups, puissante, paliers), garde sous attaque.

| écart médian tour par tour (ms GPU) | 1080p nuit | 1080p midi | 1440p nuit | 1440p midi |
|---|---|---|---|---|
| contre `fx=off`, moyenne | +0,30 | +0,21 | +0,30 | +0,56 |
| contre la nuit B, moyenne | **−0,39** | **−1,54** | **−0,74** | **−2,09** |
| contre la nuit B, p95 | −0,68 | −2,04 | −0,57 | −1,92 |

- Décision « Accepter, remesurer » (Passe FX4) : aucun dépassement sur les médianes. Un seul tour passe au-dessus de la nuit B : +0,09 ms, 1080p nuit, sur un tour chargé par un autre processus (2 à 4 tours sur 4 le sont : seuls les écarts entrelacés valent). Appels : 92 à 102, 107 pour la nuit B. Le dessin par effet n'a pas été revu : ces mesures ne le demandent pas.

### L'à-coup — [KO] de méthode → corrigé
- [KO] Première mesure à `gl.finish` : des images de 50 à 105 ms sur `charge3`, `hold*`, `m_brace`. Artefact : `gl.finish` ne bloque pas ici (base 1,3 ms pour une image de 10 ms), la file GPU se vide d'un coup en fin de série. Le « 0,3 à 0,9 ms » de la Passe FX3 reposait sur cet appel : ce chiffre est retiré, sa conclusion est prouvée ci-dessous.
- [OK] Avec un `readPixels` avant et après chaque image : les 44 recettes au pire 13,6 ms à leur première utilisation, base 12,3 ms. Contrôle négatif sans préchauffage : `light` 37,4 ms au premier tour, 17,9 ensuite : la mesure voit bien une compilation.
- [OK] 33 programmes du prêt à la fin : en DEV sur les 44 recettes, en production sur un duel de 30 s. Géométries et textures reviennent à leur base après trois tours de toutes les recettes.

### Le paquet — [?] un effet de bord, sans conséquence mesurée
- Un morceau dynamique neuf qui importe `three` ou un module partagé fait redécouper l'entrée à rolldown, quel que soit le chemin de l'import (bissection de neuf essais) : `index.js` de 1 011 218 octets passe à quatre fichiers, 1 016 799 octets (+0,55 %, +1,3 % en gzip). Le code est le même ; rien à ce sujet dans la configuration. Le morceau `combatFx` : 40 Ko, 14 Ko en gzip.
- Démarrage des pages par défaut, 7 chargements entrelacés, médianes main / branche : ville nuit 1 370 / 1 360 ms, ville midi 1 396 / 1 419, arène 931 / 994. Les plages se recouvrent ; +63 ms sur l'arène, à surveiller. Effets contre `fx=off` en v2 : 1 045 / 947 ms la nuit, 1 047 / 1 095 à midi.

### Les preuves
- `npm run typecheck`, `npm test` **299 / 299**, `npm run build`, `npm run art:validate` (19 manifestes, 40 sources, 0 erreur).
- **Sans `flags.v2`** : **0 px sur 53 vues** en DEV contre `main` figé (`6eef737`) : arène par défaut, midi, règles dynamiques, le combat d'une partie par défaut, trois vues de la ville, et `v2=1&fx=off` contre `v2=1` de `main`, nuit et midi. **0 px sur 38 vues en production**, paquet de `main` contre paquet de la branche. Témoin à 0 ; contrôle négatif : 273 194 à 766 330 px sur les vues à effet.
- **Qui charge quoi** : 15 pages, chaque requête relevée : ville, arène, règles dynamiques, `fx=off`, parties, parvis : aucun code d'effets ; `?scene=arena&v2=1`, `&time=midday`, `&input=keys` et le combat de `v2-day2-afternoon` : les effets.
- `tools/arena-scene-check.mjs` **PASS** sous `v2=1`, `v2=1&time=midday`, `v2=1&fx=off`, sans paramètre et `combat=dynamic`. `tools/play-flow.mjs` : DEV `V2=1` victoire et défaite, production `V2=1` victoire et défaite, production par défaut : aucun échec, K.O. et retour en ville compris.
- `tests/combat-fx.test.mjs`, 12 tests : **30 fautes injectées sur 30 attrapées**, chaque fichier rendu à l'octet, dont : effets sous les règles dynamiques, `fx=off` ignoré, import sans la règle, import statique, une autre page qui lit les effets, `window.__fx` en production, `fx` oublié par le mode jouable, garde de Vessa fausse.

### Restes [?]
- L'essai en main de l'opérateur dans une partie : `?play=1&new=1&v2=1&name=<nom>`, `&fx=off` pour comparer (`briefs/v2-trial.md`).
- L'écart de garde est à revoir quand les rivaux auront leurs feuilles cuites.

### Pensée
- Une preuve à 0 px sur le serveur DEV ne dit rien du paquet : le découpage n'a été vu qu'en comparant les deux productions.
- Un outil de mesure se prouve lui aussi : `gl.finish` donnait des chiffres plausibles, à la baisse en Passe FX3 et à la hausse ici. Le contrôle négatif aurait dû être là dès le début.
- Mesurer deux recettes n'en prouve pas quarante-quatre.

