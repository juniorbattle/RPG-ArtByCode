# Journal de bord — archive : passes BL2, BL3 (2026-11-14)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-11-15 (Passe SK2) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe BL2 — Le combat « La Brute », lot 2 : ce qui se voit — le plan de combat (une condition par compétence parmi celles de son rôle, un plan gardé par rival), les failles, les interruptions et les parades dites et la parade dessinée, les usages en carrés, un seul nombre pour une attaque simple, le coup en rupture ou en faille dit, la fiche de match (le style du rival, ce qu'un coup prend à chaque barre, la santé des rivaux voulue : BL1-10), les leçons de la faille et de l'entrechoc, le guide ; fusionné (2026-11-14)

### Demande
- La séance « Cité du Tournoi Local », le 13/11/2026 au soir : « L'opérateur demande de lancer le lot 2 de « La Brute ». Ses mots, mot pour mot, après avoir choisi de garder cette séance pour le lot 2 : « donne lui l'instruction ». » Le lot 2 tel que le décrit le § 33.5 de `briefs/combat-auto.md`, avec BL1-10 (« Garder ; le dire au lot 2 sur la fiche de match ») et le § 35.6 (le total d'une attaque simple, le coup puissant tombé dans une rupture).
- En cours de lot, l'opérateur, mot pour mot : « donc le combat gameplay est prêt à tester et adapter à notre direction ? ». Réponse : les règles sont jouables dans `main` depuis BL1 et BE1 ; ce qui se voit est ce lot ; l'essai prévu vient après le lot 3, rien n'empêche d'essayer dès ce lot fusionné.
- Branche `claude/combat-brute-lot2` (worktree `eager-jepsen-3b00bf`, tirée de `main` `34d5a17`), seule ouverte. Serveur DEV `bl2-dev` sur le port 5451 (`.claude/launch.json`, retirée à la fin).

### Construit — [OK]
- **Le plan de combat** (`src/combat/autoData.ts`, `src/simulation/v2skills.ts`, `src/ui/skills.ts`) : les conditions offertes par rôle (`AUTO_CONDS_BY_ROLE`, `autoCondsFor`), la table `CONDS_BY_ROLE` du laboratoire (`tools/auto-final/brute.mjs`) telle que ses plans ont été mesurés, « dans une faille » et « au début » parmi elles ; une condition de la famille écrite avant reste valable. **Un plan par rival** : `kit.plans[rival]` (l'ordre et les conditions), écrit par `setTactic` et `setOrder` avec `foe` depuis la fiche de match, parti du plan général la première fois, joué par les combats et les défis contre ce rival (`autoKitFor` dans `autoBoutOf`) ; la page des compétences règle le plan général et le dit. La page montre le rôle de chaque compétence, ses usages par combat et le délai entre deux (maintenant et au niveau suivant), et l'ordre des quatre ses usages et son délai.
- **La relecture et le HUD** (`src/arena/autoView.ts`, `AutoHud.ts`) : les failles lues dans le script selon la règle du duel (le premier coup d'un ouvreur qui touche, une interruption, une parade, un gros coup esquivé), « Faille 6 s » sur la carte et « Faille ! » au-dessus du combattant ; « Interrompu » et « Paré » avec leur faille ; la parade dessinée (le gros coup de l'auteur atteint le paradeur, qui le bloque), la recette et le son de la garde d'un gros coup ; les usages en carrés sous chaque compétence (un carré plein par usage restant, à la place du nom de la famille), une compétence épuisée en gris ; les coups d'une action en un seul nombre (leur total) ; « dans la rupture ×1,4 », « dans la faille ×1,25 » sous le nombre. Les moments `open`, `interrupt`, `parry`, `clash` de l'arène.
- **La fiche de match** (`src/ui/townUi.ts`) : le style du rival (ses compétences et leur rôle, son coup puissant dès qu'il est prêt), deux lignes au tableau (ce qu'une attaque simple et un coup puissant prennent à la barre de l'autre, nets, la forme du jour comprise), la santé des rivaux voulue (BL1-10), le titre « Votre plan contre … » et ce qui est gardé pour lui.
- **Le tutoriel et le guide** (`src/ui/duelTutorial.ts`, `tutorial.ts`) : la leçon de la faille (qui, combien de secondes, ses quatre façons, la carte éclairée) et celle de l'entrechoc ; la leçon du départ dit les carrés, celle de la charge ne dit plus que rien n'en coupe une ; « Le duel » et « Préparer un combat » réécrits ; anglais et français.

### Corrigé en passant — [OK]
- La protection ou le soutien d'un rival sur sa carte et au-dessus de lui portait le nom de la compétence de Ren (« Rampart » pour la Garde de Cassius) : le nom de sa compétence.
- La note de la fiche de match disait la santé « compte double » (le DB5 d'avant le § 34) : « multipliée par 3,6 ».
- La barre du bas du duel, placée depuis le milieu de l'écran, se tassait dans la moitié droite : à 1280 px les mots de ×2 étaient coupés, avant ce lot aussi (`tools/ui-text.mjs`, la page de l'arène sans carrés) ; elle prend sa largeur, jamais plus que l'écran.
- La page des compétences en français à 720 px coupait ses caractéristiques avec la ligne du plan général ajoutée à gauche : la ligne passe dans le détail, qui défile sous son fondu.

### Les preuves
- `tests/brute-lot2.test.mjs` (nouveau, huit tests) : les conditions par rôle contre la table du laboratoire ; un plan gardé pour un rival, joué contre lui seul, gardé dans la sauvegarde ; sur 42 combats (sept rivaux, trois kits, deux graines) chaque faille dite correspond au compte du duel lui-même (`n.opened`), les interruptions et les parades là où le script les a, les quatre façons d'ouvrir vues ; un coup dans une faille ou une rupture toujours touché ; le total d'une action ; les usages restants ; la parade dessinée ; les usages et le délai des pages contre le duel ; les deux leçons ; le son de la parade. `tests/tutorial.test.mjs` suit (les dix leçons, l'oracle de la faille et de l'entrechoc, le guide).
- `npm run typecheck` sans erreur ; `npm test` **673 / 673** (665 avant : `tests/brute-lot2.test.mjs` nouveau, `tutorial` suit) ; `npm run build` vert ; `npm run art:validate` 73 manifestes, 123 sources archivées, 23 manifestes du son, 0 erreur.
- Dans le navigateur, sur le serveur DEV de la branche, le code final : `tools/auto-arena-proof.mjs` en anglais et en français (la fiche de match et ses deux lignes nouvelles contre Node, l'ordre réglé sur la fiche gardé pour Vessa et le plan général inchangé, l'arène qui joue ce plan, la relecture de Node identique ; chaque pas du combat dessiné), `tools/tutorial-proof.mjs` en anglais et en français (les leçons que le premier combat atteint à la ligne qui les ouvre, l'entrechoc à 55,87 s ; aucune leçon dite deux fois) : verts. Sur le code d'avant les dernières retouches du HUD (le nom des protections, la barre, les moments) : `play-flow` (gagné graine 1842, perdu graine 7 ; la graine 5 de AGENTS.md gagne depuis la Passe BE1), `challenge-flow`, `gauge-proof`, `audio/hooks-proof` : verts.
- `tools/ui-text.mjs` : la fiche de match, la page des compétences et l'arène au départ et au moment d'une parade, en anglais et en français, de 568 × 320 à 1920 × 1080 : seize pages sur seize après les corrections.
- **[KO → corrigé] une première série de preuves perturbée par moi-même** : j'ai modifié `src/arena/ArenaApp.ts` pendant qu'elle tournait ; le serveur DEV a rechargé la page du tutoriel au milieu du combat (« the arena left before the result »). Relancée sans rien toucher, elle passe.
- **[?] le contraste des nombres flottants de jour** (`tools/ui-contrast.mjs`) : l'outil mesure un texte sans son contour d'encre (4 px), qui fait leur lisibilité ; de jour, sur l'arène claire, « Open 6 s » mesure 1,91:1, « Parried » 2,39:1, et « Brace », un flottant d'avant ce lot, 2,27:1 ; de nuit « Faille 6 s » 4,06:1. La fiche de match : 8,1:1 au plus bas. Les flottants suivent la règle qu'ils avaient (leur contour) ; l'outil ne la voit pas.

### Choix faits dans le cadre décidé (à l'essai de l'opérateur)
- Les conditions par rôle sont celles du laboratoire, telles que mesurées ; certaines n'ont pas « jamais » (exploiter, percer, casser, ouvrir, accélérer, charger).
- Le plan d'un rival part du plan général la première fois qu'on le règle sur sa fiche ; la page des compétences ne touche que le plan général.
- Le style du rival est montré entier sur la fiche ; le lot 3 (le repérage par paliers) dira ce qu'on en sait avant de l'avoir vu.
- L'interruption et la faille n'ont pas de son propre (le coup qui interrompt garde le sien) ; la parade sonne comme un gros coup gardé.
- Sur le HUD, les carrés des usages prennent la place du nom de la famille, dit sur la page des compétences.

### La suite
- Le lot 3, la préparation (la répétition, le carnet du maître d'armes, le repérage par paliers ; la ville qui nourrit le build du curieux, BL1-4), dans sa séance ; puis l'essai en jeu de l'opérateur, ou plus tôt s'il le veut.

### Pensée
- Une règle montrée à l'écran se prouve contre le compte du duel lui-même (ici `n.opened`), pas seulement contre un oracle écrit de la même main : les deux disent la même chose sur 42 combats.
- Ne pas modifier les sources pendant qu'une preuve tourne sur le même serveur DEV : le rechargement à chaud casse la page en cours et l'échec ressemble à un défaut du jeu.
- Un élément placé depuis le milieu de l'écran (`left: 50 %` puis une translation) se tasse dans la moitié qui reste : sa largeur se donne (`max-content`, bornée par l'écran).

## Passe BL3 — Le combat « La Brute », lot 3 : la préparation — le repérage par paliers (le style, puis le plan, la rumeur pour le kit), la répétition contre l'ombre du prochain adversaire (trente combats, une victoire et une défaite à revoir), le carnet du maître d'armes (une note et un conseil après chaque combat), la leçon du sable (BL1-4 : le curieux de 11,5 à 25,5 % de titres) ; fusionné (2026-11-14)

### Demande
- La séance « Cité du Tournoi Local », le 14/11/2026 : construire le lot 3 du § 33.5 de `briefs/combat-auto.md` dans le jeu par défaut, la préparation de PB-4 « Toutes » (la répétition, le carnet du maître d'armes, le repérage par paliers) et BL1-4 « Au lot 3 : la ville nourrit le build », sans changer les règles du duel ; en anglais et en français ; tests, preuves, journal, fusion ; puis une fiche courte pour préparer l'essai en jeu de l'opérateur, qui vient après ce lot.
- Branche `claude/combat-brute-lot3` (le worktree `determined-visvesvaraya-7ac630`, tirée de `main` `6056c10`), seule ouverte. Serveur DEV `bl3-dev` sur le port 5483 (`.claude/launch.json`, retirée à la fin).

### Le repérage par paliers — [OK] (`src/simulation/v2scout.ts`)
- **Palier 0, rien vu** : la fiche de match dit comment en savoir plus (« une observation à l'entraînement apprend son style, une seconde, un autre jour, son plan »).
- **Palier 1, le style** : une première observation, ou un combat déjà livré contre ce rival (un combat du tournoi ou un défi) : ses compétences et le rôle de chacune, son coup puissant s'il le lance dès qu'il est prêt (Tobin, Orla), ses pièces (le cuir léger de Vessa, le bouclier d'Ilse, l'armure lourde de Marek et Rhosk).
- **Palier 2, le plan** : une seconde observation, un autre jour que la première (`scouted2:<id>`) : quand part chaque compétence, sa condition (`AUTO_STYLES`) ou la règle de son rôle pour une ligne « auto » (`whenText`).
- **La rumeur, le kit** : une rumeur entendue du prochain adversaire (Lio, l'inconnu) donne ses compétences et les usages de chacune à l'étape de ce combat (2, 2, 3 selon l'étape : PB-2 au niveau des rivaux).
- L'observation (`scout`, `src/simulation/roles.ts`) s'offre donc deux fois dans une partie de la version 2 : le même jour, refusée (« revenez un autre jour ») ; après la seconde, refusée (« vous connaissez son plan »). Le jeu d'aujourd'hui (`v2=0`) garde une seule observation.
- La fiche de match (`src/ui/townUi.ts`) et le tableau du tournoi (T, `src/ui/board.ts`) disent ce que le palier permet ; la ligne du style du lot 2 (`styleLine`) est remplacée par celle du palier ; `foeIntel` dit les mêmes lignes.

### La répétition — [OK] (`src/simulation/v2prep.ts`)
- **L'action** `rehearse`, offerte par maître Corvin aux lices, le matin et l'après-midi (le sable fermé le soir, ou pris : `sandRefusal`) : un créneau, sans pièce. Refusée sans combat à venir, l'après-midi d'un combat (« le combat d'abord »), et tant que le style du prochain adversaire n'a pas été vu (« maître Corvin ne peut jouer que ce que vous avez vu »).
- **L'ombre** (`shadowBout`) : le prochain combat tel qu'il se livrerait maintenant (`autoFightersFor` dans `src/combat/autoMatch.ts`, la construction de `autoBoutOf` mise en commun) : Ren avec son équipement, son entraînement et le plan gardé pour ce rival ; le rival à son étape et à sa préparation ; au palier 1 chaque compétence du rival selon son rôle, au palier 2 son propre plan. Au palier 2, l'ombre est le combat à venir lui-même, sa graine exceptée (le test le prouve sur l'après-midi du combat).
- **Trente combats** sur des graines propres à la répétition (la partie, le rival, le jour, le créneau ; jamais celle du vrai combat) ; leurs chances, une victoire et une défaite à revoir (leurs graines), la lecture du carnet sur les trente (`sumNotes` : les dégâts par source, les failles, le conseil vu le plus souvent). La ligne du journal dit les chances (« 25 combats gagnés sur 30 avec votre plan ») ; le détail est gardé hors de l'empreinte (`V2State.$rehearsals`), avec les deux combattants tels que répétés.
- **[KO → corrigé] une répétition « périmée » dès le créneau suivant** : la première version revoyait le combat en reconstruisant l'ombre depuis l'état du moment et le refusait si le montage avait changé. Or les rivaux s'entraînent hors écran à chaque créneau : leur préparation bouge, et la répétition était périmée sitôt faite (le test l'a montré). La répétition garde donc ses deux combattants : on revoit exactement le combat répété, et « avec ce plan » ne dépend plus que du côté du joueur (Ren et la façon dont l'ombre jouait, `shadowKey`).
- **Revoir un combat** : depuis le carnet (Entrée une victoire, Espace une défaite), l'arène joue le combat répété (`?scene=arena&review=win|loss`, `startReview` dans `src/ui/playArena.ts`) : les gradins vides, la musique des lices, ×2 et « Passer » ; sa fin dit le résultat et la lecture de maître Corvin, puis retour aux lices. Rien de la partie ne change (aucune action, aucune sauvegarde ; l'empreinte avant et après, prouvée dans le navigateur).
- **La cote suit les vrais combats** (`tools/auto-lab.mjs rehearsal` : à chaque combat de parties entières, la répétition depuis l'état du combat contre son résultat ; 200 parties tenues à part, graines 101 à 300) :

| Politique | Combats | Gagnés | Chances dites, palier 2 (Brier) | Palier 1 (Brier) | Finale : gagnés / dit p2 / dit p1 |
|---|---|---|---|---|---|
| le planificateur | 999 | 81 % | 81 % (0,109) | 79 % (0,111) | 50 / 53 / 49 % (105) |
| la référence | 1 000 | 84 % | 83 % (0,106) | 81 % (0,107) | 53 / 56 / 53 % (154) |
| le curieux | 990 | 81 % | 81 % (0,080) | 80 % (0,085) | 30 / 36 / 37 % (168) |

  Par dixièmes de chances (le planificateur, palier 2) : dit 43 %, gagnés 42 % ; dit 64 %, gagnés 64 % ; dit 83 %, gagnés 83 %. Au palier 1 l'écart est un peu plus grand (dit 24 %, gagnés 38 %), mais faible en moyenne : les plans des rivaux suivent de près la règle de leurs rôles. Ce que le palier 2 apporte surtout, c'est de savoir quand part chaque compétence.

### Le carnet du maître d'armes — [OK] (`src/combat/autoNotes.ts`, `src/simulation/v2notes.ts`, `src/ui/notebook.ts`)
- **Une note par combat et par défi** (pas pour les représailles), lue dans le script du duel joué avec les règles du duel (`src/combat/auto.ts hitOnce`) : la durée, les dégâts de Ren par source (attaques simples, coup puissant, compétences) et ceux qu'il a reçus, les failles de chacun (le compte du duel), les ruptures, les dégâts de Ren tombés dans une faille ou une rupture, chaque compétence (usages dépensés et permis, coups portés, portés dans une faille, une rupture ou sur un adversaire qui charge, coups pour rien : esquivés, parés, coupés, perdus dans un entrechoc), la compétence du rival qui a fait le plus de mal, les entrechocs.
- **Un conseil**, le premier qui tient dans cet ordre (`adviceOf`, seuils « proposé » `NOTE_RULES`) : une Feinte gâchée (la moitié de deux au moins n'a rien coupé), une exploitation partie hors d'une faille, de gros coups esquivés (deux), une compétence du rival qui a fait 35 % des blessures, deux usages jamais partis, aucune faille créée ; sinon « gardez ce plan », ou « répétez » après une défaite.
- **Le trajet de la note** : calculée là où le duel est joué (`autoOutcome` avec son script ; dans l'arène, le duel que l'arène a joué, les appuis de la main compris), portée par le résultat (`DuelOutcome.note`), gardée par `applyPlayerDuel` et `applyChallenge` dans `V2State.$notes` (les 24 dernières, hors de l'empreinte). Le laboratoire porte la note aussi (`autoGameOutcome` avec le script : 0,42 ms par duel).
- **Où on la lit** : sur l'écran de victoire ou de défaite (« La note de maître Corvin ») ; dans le carnet, une page du menu (Échap) et du dialogue de maître Corvin (« Lire son carnet »), sans touche à elle : à gauche les rivaux, le prochain adversaire d'abord, chacun avec son palier (pas vu, style, plan) ; à droite ce qu'on sait de lui, la dernière répétition et ses deux combats à revoir, ses notes ; sur la fiche de match, la dernière répétition (« avec ce plan », ou « un autre montage ») et le dernier conseil de Corvin sur ce rival. Un conseil du tutoriel la première fois qu'une note existe ; le guide (« Préparer un combat ») dit le repérage, la répétition, le carnet et la leçon du sable.

### La ville nourrit le build (BL1-4) — [OK] (`sandLesson`, `src/simulation/v2skills.ts`)
- **La leçon du sable** : un défi gagné en ville fait monter d'un niveau la première compétence offensive du plan général (l'ordre du joueur, sinon la plus forte d'abord) encore sous le niveau 3 (`SAND_LESSON` : la limite de l'entraînement ; au-delà, les maîtres des défis et maître Corvin), dit dans le journal ; rien sur un défi perdu ni sur des représailles. L'apprentissage du défi (le maître qui enseigne sa compétence) reste.
- Le diagnostic de BL1 : le curieux gagne sept défis par partie (graines 101 à 120), garde l'épée d'entraînement (Attaque 10) et ses compétences au niveau 1 ou 2.
- **Mesuré** (200 parties tenues à part, graines 101 à 300) :

| Politique | Titres | Demi | Finale |
|---|---|---|---|
| le curieux, avant | 11,5 % | 79 % | 16 % (141) |
| le curieux, la leçon jusqu'au niveau 3 | **25,5 %** | 91 % | 30 % (168) |
| le curieux, jusqu'au niveau 5 (mesuré, écarté) | 47,5 % | 91 % | 57 % (167) |
| le curieux, deux niveaux par défi jusqu'au 3 (mesuré, écarté) | 29 % | 93 % | 34 % (173) |
| le planificateur | 26,5 % | 54 % | 50 % (105) |
| la référence | 41 % | 79 % | 53 % (154) |
| le diligent, l'oisif | 0 % | — | — |

  Le planificateur, la référence, le diligent et l'oisif ne défient pas : leurs parties sont identiques à celles de la Passe BE1. Le curieux qui explore la ville gagne désormais autant de titres que le planificateur, sans dépasser la référence (jusqu'au niveau 5, il la dépassait). Les deux observations du repérage (le curieux observe deux fois son prochain adversaire) ne changent presque rien (26 % avec une seule).

### Corrigé en passant — [OK]
- La ligne de la vigueur après une victoire disait encore « les PV comptent double » (le DB5 d'avant le § 34) : « les PV de chacun sont multipliés par 3,6 » (`v2.result.vigour`, avec le facteur du duel).

### Les preuves
- `tests/brute-lot3.test.mjs` (nouveau, neuf tests) : les paliers (une observation, le même jour refusé, la seconde, la troisième refusée, un combat livré, la rumeur et son kit, le jeu d'aujourd'hui) ; le plan dit contre `AUTO_STYLES` et la règle de chaque rôle, en anglais et en français ; la répétition (où et quand, son créneau, ses trente graines rejouées contre un oracle, jamais la graine du vrai combat, la victoire et la défaite revues, « avec ce plan » jusqu'à une séance d'entraînement, hors de l'empreinte, disparue une fois le combat livré) ; au palier 2 l'ombre est l'adversaire du combat à venir ; chaque note contre les comptes du duel (dégâts par source, failles, ruptures, entrechocs, usages) et contre la relecture de l'arène (les dégâts dans une faille ou une rupture, au point près, sur 42 combats) ; une exploitation sur un adversaire qui charge comptée nette ; l'ordre des conseils ; la note portée par le résultat, gardée hors de l'empreinte, bornée, ses lignes dans les deux langues ; la leçon du sable. `v2-intel`, `v2-reading`, `v2-town` et `combat-auto` suivent (deux observations, la leçon du sable, la note du laboratoire).
- `npm run typecheck` sans erreur ; `npm test` **682 / 682** (673 avant) ; `npm run build` vert ; `npm run art:validate` 73 manifestes, 123 sources archivées, 23 manifestes du son, 0 erreur.
- Dans le navigateur, sur le serveur DEV de la branche : `tools/prep-proof.mjs` (nouveau) en anglais et en français, tous les contrôles verts : le dialogue de Corvin (la répétition, le carnet), la répétition et ses chances contre Node, sa ligne dans les nouvelles, le carnet depuis le menu (Vessa d'abord, ses lignes contre Node), une victoire et une défaite revues dans l'arène (le duel de Node sur cette graine, les gradins vides, la fin et la lecture de Corvin, l'empreinte inchangée), la fiche de match (le style, la répétition « avec ce plan »), le combat du jour (son résultat et sa note ceux de Node, la note sur l'écran de victoire, gardée dans le carnet), le rejeu de Node à la même empreinte. `tools/auto-arena-proof.mjs` en anglais et en français, `tools/tutorial-proof.mjs` en anglais et en français, `tools/play-flow.mjs` gagné (graine 1842) et perdu (graine 7), `tools/challenge-flow.mjs` (défi perdu contre Orla graine 4, gagné contre Aldric 1842 ; représailles gagnées 1842, perdues graine 2), `tools/play-day.mjs` : tous verts (onze preuves, aucun contrôle KO).
- `tools/ui-text.mjs` : le carnet après une répétition, le dialogue de maître Corvin et la fiche de match (les paliers 1 et 2), en anglais et en français, de 568 × 320 à 1920 × 1080 : vingt-quatre pages sur vingt-quatre après la correction ci-dessous.
- **[KO → corrigé] le carnet au téléphone** : à 568 × 320 son pied passait sous la carte, à 812 × 375 sa colonne de droite (les deux colonnes empilées par la règle commune des pages à deux colonnes). Des règles propres au carnet : au téléphone tenu en largeur, la liste et le détail côte à côte ; au téléphone étroit, la liste plus courte, le portrait retiré ; l'en-tête ne redit plus « prochain combat » (la ligne de la liste le dit).
- **[?] le tableau du tournoi (T) au téléphone** : mesuré en passant avec le même outil de géométrie, il a le même défaut d'avant ce lot (sa colonne de droite sous la carte à 812 × 375, son pied à 568 × 320) ; non corrigé ici (hors du lot), à reprendre.
- Le dialogue de maître Corvin met la répétition en tête de ses offres, puis son carnet (la répétition était la dernière ligne, sous le pli de la bande) ; les preuves de la préparation repassées ensuite, vertes.

### La fiche
- https://claude.ai/artifact/8vuJuzGe7AUUDQQuNQyNFC (`briefs/fiche-combat-brute-lot3.html`), publiée avec `{db:{}}`, `decisions` vide à la publication : six cartes, BL3-1 la réception (avec trois captures : le carnet, la fiche de match, l'écran de victoire, en français) ; BL3-2 les paliers du repérage ; BL3-3 la répétition (un créneau, sans pièce, le style vu) ; BL3-4 où lire le carnet ; BL3-5 la leçon du sable (jusqu'au niveau 3) ; BL3-6 l'essai en jeu (ce qu'il y a à essayer). Aucune ne touche une décision A3. Elle prépare l'essai en jeu de l'opérateur, qui vient après ce lot (§ 33.5).

### La fiche relue — six sur six à la recommandation (14/11/2026)
- L'opérateur, dans cette séance, mot pour mot : « fiche remplie ». `ArtifactData list decisions` sur https://claude.ai/artifact/8vuJuzGe7AUUDQQuNQyNFC : six lignes, BL3-1 à BL3-6, écrites de 07 h 00 à 07 h 01 (UTC), sans note.
- Ses choix, mot pour mot :
  - BL3-1 « Reçu » ;
  - BL3-2 « Garder ainsi » (les paliers du repérage : le style à la première observation ou après un combat livré, le plan à la seconde un autre jour, le kit par la rumeur) ;
  - BL3-3 « Garder ainsi » (la répétition : un créneau, sans pièce, une fois le style vu) ;
  - BL3-4 « Garder ainsi » (le carnet : l'écran de résultat, le menu, maître Corvin, la fiche de match ; pas de touche) ;
  - BL3-5 « Jusqu’au niveau 3, un niveau par défi » (la leçon du sable, BL1-4) ;
  - BL3-6 « Lancer mon essai maintenant ».
- Aucune décision A3 n'est touchée. Les réglages recommandés étaient déjà construits et fusionnés (`d89effa`) : rien du jeu ne change après la relecture. L'essai en jeu de l'opérateur est lancé ; ses remarques prépareront la fiche d'avant le lot 4.

### Choix faits dans le cadre décidé (à la fiche d'essai)
- La répétition coûte un créneau et aucune pièce ; elle demande d'avoir vu le style du rival.
- Un combat livré donne le style (palier 1) comme une première observation.
- Le carnet n'a pas de touche à lui (le menu, Corvin, la fiche de match, l'écran de victoire) : une touche demanderait le remappage (RM-1).
- La leçon du sable va jusqu'au niveau 3, un niveau par défi gagné.

### Pensée
- Un état de jeu bouge à chaque créneau, même quand le joueur ne fait rien (les rivaux s'entraînent hors écran) : ce qu'on veut revoir se garde tel qu'il a été calculé, et ce qui est « à jour » se compare sur ce que le joueur contrôle.
- Une lecture du script (le carnet) se prouve deux fois : contre les comptes du duel lui-même et contre la relecture de l'arène, qui lit le même script avec son propre code ; elles disent la même chose au point près sur 42 combats.
- Une cote se mesure contre les vrais résultats sur des parties entières, par tranches de chances : la moyenne seule cache un écart qui se compense (au palier 1, trop pessimiste vers 25 %, juste au-dessus de 60 %).
- Un levier pour un joueur témoin se cherche dans ce qu'il fait déjà beaucoup (sept défis gagnés par partie) : la ville le nourrit sans toucher ceux qui ne défient pas, leurs parties restent identiques au point près.

