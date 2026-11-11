# Journal de bord — archive : passes DB13, MD1 (2026-11-10 → 2026-11-11)

> Déplacée mot pour mot de `JOURNAL.md` le 2026-11-11 (Passe LA3) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe DB13 — La fiche DB11 appliquée dans le jeu par défaut : la jauge plus vive, la Vivacité de poule, Ren ×2, la séance « Santé », les PV dits, le recalage (2026-11-10)

### Demande
- Appliquer les choix consignés en Passe DB12 (spécification § 20) dans le jeu par défaut, recaler le tableau et la finale sur la courbe de la fiche DB7, prouver, fusionner, puis l'essai de l'opérateur. Branche `claude/duel-equilibre-2`.

### Ce qui est construit — [OK]
- **La jauge** (DB11-1, `src/combat/v2duel.ts`) : `V2_SKILL_GAUGE` 3 (2 avant), `V2_GAUGE_DECAY` 0,5 dans `applyStats` (la jauge de 70 se vide de 0,63 par seconde au lieu de 1,26) ; l'attaque simple garde 0,5, un coup gardé ×2.
- **La Vivacité de poule** (DB11-2, `src/combat/stats.ts`) : `KIT_VIV` (la Vivacité à laquelle chaque kit a été écrit, la référence du tempo : Vessa 13, Orla 11, Cassius 10, Ilse 10, Marek 10, Tobin 9, Rhosk 8) ; `POOL_SLOW` 3 ; les fiches de poule à 3 de moins (Vessa 10, Orla 8, Cassius 7, Ilse 7, Marek 7, Tobin 6, Rhosk 5) ; la croissance rend la Vivacité au tableau et en finale (`STAGE_GROWTH.viv` +3) ; `v2DuelData` lit le tempo contre `KIT_VIV`. En poule, chaque temps du rival (pauses, préparation des coups, intervalles d'un combo) ×1,3 à ×1,6 : Vessa 4,55-8,45 s de pause au lieu de 3,5-6,5. La fiche de match montre la Vivacité de poule (Vessa 10).
- **La riposte et la finale** (DB11-3, DB11-4) : rien ne change.
- **Ren ×2** (DB11-6) : `REN_BASE.hp` 300, `VIGOUR_HP` 24, `POWER` des rivaux 11,2 / 33,6 / 50,4, les PV de l'équipement ×2 (`src/simulation/gear.ts` : la bande +18, la perle +10, la médaille +16, leurs textes en deux langues).
- **La séance « Santé »** (DB11-5) : `TRAINED_STATS` gagne `hp` (en dernier : les listes gardent leur ordre), `TRAIN_HP` 20, `trainGain` ; l'entraînement au sable et l'exercice avec Orla offrent la ligne « Train: Health (+20 at your next bout) » / « S’entraîner : Santé (+20 au prochain combat) », son journal (`v2.train.log.hp`).
- **Les PV dits partout** (DB11-5) :
  - l'écran de victoire de l'arène et la carte de résultat en ville (un combat du tournoi ou un défi gagné ; une représaille n'en donne pas) : « Vigour: +24 health for this win. At your next bout: 324 health. » / « Vigueur : +24 PV pour cette victoire. Au prochain combat : 324 PV. » ;
  - la fiche de match : les stats de Ren à côté de celles de l'adversaire (« You: 300 health · Attack 10… » / « Vous : 300 PV · Attaque 10… ») et d'où viennent ses PV (« Your health: 300 at the start, +24 of vigour (24 for each bout won), +18 from your gear, +20 from training, −60 for your wound. », chaque part dite seulement quand elle n'est pas nulle) ; `healthParts` (pur, `src/simulation/v2gear.ts`) ;
  - le guide (« Préparer un combat ») : la séance de santé, « Vos PV partent de 300 et grandissent de 24 pour de bon à chaque combat gagné… » ;
  - un dixième conseil, `vigour`, une fois, après la première victoire (« Your health grows » / « Vos PV grandissent »).
  - Textes en anglais et en français (`en.ts`, `fr-texts.ts`, les espaces insécables du français) ; aucun chiffre écrit dans un texte du tutoriel (TU-6).

### Le recalage (DB11-7) — [OK]
- La poule telle que le paquet la donne. Le jeu reproduit la mesure de la fiche (`--audit --seeds=1..20 --policies=bot,gspam`, `rpg+rs1+lv1`) : **71 / 92 / 99 %**, 2,1 min, 5,5 séquences adverses par minute (7,8 avant), 2,0 ruptures par minute (1,1), marteleur 9 %.
- Le tableau et la finale sur la courbe de la fiche DB7 (39 / 79 / 97 et 26 / 66 / 100), le joueur attendu (tableau : équipement 2, niveau 3, `rhp370` ; finale : tout équipé, niveau 3, `rhp440`), par la croissance des PV des rivaux :

| Croissance des PV | Tableau | Finale |
|---|---|---|
| ×1,3 / ×2,5 (avant) | 70 / 91 / 95 %, 1,8 min | 61 / 86 / 95 %, 3,0 min |
| ×1,6 / ×3,0 | 59 / 84 / 94 % | 43 / 76 / 92 % |
| — / ×3,25 | — | 40 / 74 / 92 % |
| **×1,7 / ×3,5 (retenu)** | **54 / 80 / 94 %, 2,3 min** | **36 / 66 / 89 %, 3,9 min** |
| ×1,8 | 49 / 78 / 93 % | — |

  Marteleur 0 % au tableau et en finale. La finale de 3,9 min reste l'épique de DB5-7 (« +5 min peut etre exceptionnellement des combats epiques »).
- **`V2_RACERS`** remesuré comme en Passe DB10 (Ren au départ, PV sans limite, bot 0,5, graines de calibrage 1..80, à l'étape de la poule où se joue la plupart des combats de la course) ; contrôle 81..120 à moins de 7 % ; chaque kill plus court (les ruptures deux fois plus fréquentes), chaque dps plus haut (les coups ×2, le tempo plus lent) ; Marek toujours le plus fort de la course, Tobin le plus faible. [?] Au tableau les rivaux se battent au tempo de leur kit, un peu plus vite que la table ne le suppose.
- **`V2_SIM_HASH`** : le script parcourt encore chaque chemin de V2-2 (rien de coupé ni de refusé) ; nouvelle empreinte épinglée dans `src/arena/v2Arena.ts` et `tools/arena-scene-check.mjs`.
- **Le TournamentLab** (graines 1..50, sur le code rejoué avec l'économie de la Passe ECO3 ; le préparé, le curieux et celui qui ne fait que combattre n'exercent pas leurs compétences) :

| Joueur | Combats gagnés | Blessures par partie | Tableau | Finaliste | Couronné |
|---|---|---|---|---|---|
| ne fait que combattre | 34,9 % | 1,34 (1,64 avant) | 62 % | 0 | 0 |
| préparé | **55,2 %** (42,0 % en Passe DB10) | 1,02 (1,00) | 100 % (74 %) | 4 % | 0 |
| curieux | 64,0 % (53,7 %) | 0,56 | 96 % (80 %) | 24 % (14 %) | 0 |
| planificateur (Passe ECO3 : il achète l'équipement de la courbe, bot 0,6) | 60,4 % | 0,60 | 98 % | 4 % | 0 |

### La fusion
- `main` avait reçu les Passes TF1 (les textes français) puis ECO2 et ECO3 (l'économie : les travaux payés, les bourses par étape, la revente, le planificateur) pendant cette passe. Les trois commits (DB11, DB12, DB13) rejoués sur `bdd40c4` dans `claude/duel-equilibre-3`, sans réécrire les branches déjà poussées (`claude/duel-equilibre`, `claude/duel-equilibre-2`) ; conflits résolus en gardant les deux côtés : les imports de `actions.ts` et `roles.ts` (les travaux et `trainGain`), les conseils `poor` (l'économie) et `vigour` (cette passe), les nombres de `v2-injury` remesurés sur le code combiné ; le journal recomposé par script, l'archive de RM3 de `main` gardée (corps identique à l'octet), DB8 puis DB9 et DB10 archivées.
- Le laboratoire remesuré sur le code combiné (le tableau ci-dessus) : les bourses de l'économie ne changent pas les combats du préparé ni de celui qui ne fait que combattre (mêmes taux qu'avant la fusion) ; le curieux 64,0 % (64,4 % avant la fusion), 0,56 blessure.

### Tests — [OK]
- Mis à jour en nommant chaque changement : `duel-stats` (Ren 300, +24, la séance « Santé », `KIT_VIV` et les fiches de poule, la croissance ×1,7 / ×3,5, le tempo lent en poule et celui du kit au tableau, la jauge qui se vide deux fois moins vite, `healthParts`, la ligne « Health »), `duel-db3` (la jauge ×3, Ren 300 ; la part des compétences mesurée à 43 % sur ses graines, la borne à 40 %), `combat-charge` (les coups ×2, la jauge de l'attaque puissante, l'escalier de la poule plus facile, les parties entières, `V2_RACERS`, `V2_SIM_HASH`), `v2-injury` (les nombres du laboratoire), `wares` (les PV ×2 de l'équipement et de l'onguent), `tutorial` (le chapitre « Préparer un combat », le conseil `vigour`, les constantes que le guide lit).
- `npm run typecheck` sans erreur ; `npm test` **594 sur 594** sur le code combiné (588 avant la fusion) ; `npm run build` réussi ; `npm run art:validate` 73 manifestes, 123 sources, 23 manifestes de son, 0 erreur.
- Les passes gardées dépassaient 60 Ko avec DB13 sur le dernier `main` (71,8 Ko) : DB9 et DB10 (branches fusionnées) déplacées d'un bloc, à l'octet, dans `journal/84-passes-DB9-DB10.md`, leur ligne ajoutée à l'index ; preuve par script : le corps de l'archive égale les 15 238 octets retirés, le journal reconstruit égale l'original, CRLF partout, chaque passe dans un seul fichier ; 56,6 Ko de passes restent.

### Preuves dans un navigateur (serveur `deq-dev`, le worktree, son propre cache de dépendances) — [OK]
- Faites avant la fusion, puis refaites sur le code combiné (`main` `bdd40c4` et ces trois commits) : `arena-scene-check` PASS (même empreinte), `play-flow` et `play-day` aux mêmes empreintes, Node égal au navigateur, `tutorial-proof` tout passe, `ui-text` 3 sur 3 (la fiche de match en français, le guide en anglais).
- `arena-scene-check` (`v2=1`) **PASS** : l'empreinte rejouée dans la page égale `V2_SIM_HASH`, aucune erreur, les marques du sol dégagées sur 77 tailles.
- `play-flow win` : **tout passe**, Node rejoue `40bfc01dd423524e` comme le navigateur (`f3974c5eedc75e97` avant : les fiches et la course ont changé) ; la carte de résultat en ville dit la vigueur et les 324 PV du prochain combat.
- `play-day` : **tout passe**, Node rejoue `75272cc6a835113b` comme le navigateur.
- `tutorial-proof` : **tout passe** (la visite, le guide, les conseils, les sept leçons du premier duel, aucune erreur).
- `ui-text` **8 sur 8** (la fiche de match en anglais et en français à 1920 × 1080, 1280 × 720 et au téléphone 812 × 375, le guide) ; `ui-contrast` **7 sur 7**, le plus bas 7,85:1.
- Captures de revue (hors dépôt) : la fiche de match en français (Vessa « 500 PV · … · Vivacité 10 », « Vous : 300 PV · … », « Vos PV : 300 au départ. »), la liste de l'entraînement, le guide.

### Où reprendre
- **L'essai en jeu de l'opérateur** : la jauge, le rythme de la poule (Vessa en premier combat), la riposte gardée, les PV de Ren et ce que le jeu en dit, la séance « Santé », la finale plus longue.
- **L'économie** est fusionnée (Passe ECO3, voir « La fusion ») : son planificateur atteint l'équipement que le calage du tableau et de la finale suppose ; à l'essai, recaler si l'équipement d'un joueur réel s'en écarte.

### Pensée
- Rendre une stat lisible coûte peu quand la règle est déjà pure : un découpage (`healthParts`) que la fiche de match et les tests lisent dit d'où vient un nombre sans rien cacher.
- Une stat qui grandit (la Vivacité) porte un changement de rythme mieux qu'un multiplicateur caché : la fiche de match le montre, et le rival « grandit » au tableau comme ses autres stats.

## Passe MD1 — La marche en diagonale du héros : le trois-quarts « sur place » qui glissait, montré de profil quand le pas traverse l'écran (2026-11-11)

### Demande
- Demande de l'opérateur du 2026-11-11, mot pour mot : « et enfin regler le default de marche animation en diagonale de notre heros qui sont bloque et donc glisse lorsque nous executons le mouvement ». Relayée par la séance qui coordonne (la version 2 par défaut : la ville avec `herolook=1`, les trois places, « Explore the district »). Branche `claude/marche-diagonale`, worktree `.claude/worktrees/marche-diagonale` tiré de `origin/main` `eab6d50`, serveur `md-dev` (son propre cache de dépendances), `main` figé servi par `md-main`.

### Reproduit et mesuré — [OK]
- **Nouvel outil `tools/hero-slip.mjs`** : `tools/foot-slip.mjs` ne mesure que le profil, le long de la droite de la caméra ; une diagonale traverse l'écran en biais. L'outil suit chaque mise à jour de la page (la ville `__app` ou une place `__plaza`), tient des touches (ou la marche de la manette, `pad=x,y`) et, à chaque changement d'image de la marche du héros, prend ses pieds sur les rangées du bas de l'image cuite, posés au sol comme le panneau les pose. Le pied le plus proche de celui de l'image précédente (à moins de 1,5 fois l'avance) est le pied posé ; sa dérive au sol, projetée à l'écran, contre l'avance du héros à l'écran : 0 = le pied reste où il est, 1 = il avance avec le corps. Il sépare la part en travers de l'écran de la part en hauteur.
- **`main` figé, au clavier, à la manette, en marche et en course** (médianes, 1280 × 720) :
  - ville, cadrages B et D, les quatre diagonales : le héros de **trois-quarts** (`upSide` / `downSide`), le pied glisse de **0,93 à 1,19 fois son avance**, **155 à 198 px/s en travers** ; la manette en diagonale de même (160 px/s) ;
  - les trois places, les quatre diagonales : trois-quarts, **1,05 à 1,21**, **96 à 128 px/s en travers** ;
  - en ligne droite, pour comparer : le profil à 0,02 en ville (planté) ; la face et le dos vers 1,1, mais 14 à 25 px/s en travers (ils vont surtout en profondeur).
- **Les images** (`hero-x2-v4`, script hors dépôt) : la course de profil `walk-side` fait reculer le pied posé de 16 texels par image (6 → 23 → 39 : le tapis que `walkClock` accorde) ; la course de **trois-quarts face `walk-downSide` le garde sur place** (le pied le plus bas entre les colonnes 12 et 24 sur les huit images) et ses jambes changent à peine d'une image à l'autre (une seule pose différente sur huit, vu sur la planche) ; `walk-upSide` bouge un peu plus, sans dérive régulière. C'est le « bloqué » : des jambes presque figées qui glissent avec le corps.

### La cause — [OK]
- La vue du héros suit son **cap** : la ligne de visée en ville (décision K9 de l'opérateur, Passe K10), les touches contre la caméra sur les places (`fiveViewFacing(ix, -iz)`). Une diagonale au clavier fait 45° de cap : le trois-quarts. Mais sous le tangage faible des cadrages, **le même pas traverse l'écran à 70-79° de la verticale**, presque à l'horizontale. Le trois-quarts, dessiné sur place, glisse alors de toute la largeur de son pas. C'est « le prix » déjà écrit en Passe K9 (« une marche en diagonale montre son trois-quarts pendant que le sprite glisse presque à l'horizontale à l'écran »), que la règle du regard avait accepté.
- La ville et les places ne diffèrent pas sur ce point (toutes deux par le cap). L'horloge et la vitesse ne sont pas en faute : l'horloge avance (les huit images du cycle passent), mais aucune horloge n'accorde un pied qui ne recule pas dans l'image.
- Pas d'image manquante : les cinq vues ont leurs huit images de course. Les feuilles ne changent pas.

### Corrigé — [OK]
- **`heroWalkFacing`** (`src/characters/ActorSystem.ts`) : le cap choisit la vue comme avant ; **un trois-quarts dont le pas à l'écran dépasse le bord du profil de la règle à cinq vues (67,5°) est montré de profil**, tenu 5° en deçà une fois de profil (62,5°), sans papillotement. Le profil dessine la dérive du pied et `walkClock` l'accorde déjà à la vitesse le long de la droite de la caméra. La face et le dos restent ceux du cap (une marche qui s'éloigne montre le dos, K9). Le miroir d'un profil ainsi choisi suit le pas à l'écran.
- **Ville** : seulement avec `herolook` (une partie de la version 2, posé par `playTown.ts`, et « Explore the district », posé par `main.ts`) : `ActorSystem.heroStepView`. Le jeu d'aujourd'hui (`v2=0`) et les autres adresses du district gardent la vue du cap seule.
- **Places** (`src/world/PlazaApp.ts`) : la même règle, le pas projeté par la caméra de la place (`screenStep`) ; l'horloge d'un profil ainsi choisi avance à la part du pas le long de la droite de la caméra (celle d'une marche en travers vaut 1), un profil donné par les touches garde l'horloge d'aujourd'hui.
- Les PNJ ne passent pas par ce chemin.

### Après — [OK]
- Mêmes mesures sur la branche :
  - ville B et D, diagonales, clavier, Maj, manette : **profil**, **4 à 40 px/s en travers** (155 à 198 avant), le rapport 0,25 à 0,32 ;
  - les trois places, diagonales, clavier, Maj, manette : **profil**, **3 à 16 px/s en travers** (96 à 128 avant), 0,21 à 0,40 ;
  - ce qui reste est la part en hauteur du pas (19 à 47 px/s, la même avant et après) : le panneau n'a pas de profondeur, ni de face, ni de dos, ni de profil ; c'est ce que fait déjà une marche droite vers le haut ou le bas de l'écran (25 à 49 px/s).
- **Flipbooks avant / après** (hors dépôt ; `tools/flipbook.mjs` sait maintenant filmer une place et la manette, `PAD=`, et écrire chaque image en PNG, `PNG_DIR=`) : la ville en B (« bas + gauche ») et le parvis (« haut + droite ») ; avant, le trois-quarts aux jambes presque figées qui glisse ; après, le profil en course, le pied planté.

### Preuves au pixel — `main` figé contre la branche
- Méthode : `tools/flipbook.mjs` avec `PNG_DIR` (graine 1842, boucle tenue, pas fixes de 1/60 s), une image entière 1920 × 1080 tous les 20 pas, du pas 20 au pas 200 (9 images par cas), `main` figé (`eab6d50`, `md-main`) puis la branche (`md-dev`) dans le même navigateur ; comparaison au seuil 0 (script hors dépôt sur les RGBA décodés).
- **Témoin de répétition** : `main` contre un second `main` figé servi sur une autre origine (`md-main2`) ; le même cas deux fois sur la même origine ne vaut pas (le second chargement relit le stockage du premier : toutes les images diffèrent). Le témoin montre des écarts isolés, toujours aux mêmes images : ville B « haut » images 80 et 180, nuit « haut + droite » image 180, parvis « bas » image 160 (une variation de teinte de 5 au plus sur tout l'écran), ville B « droite » images 40 et 120. Ce sont les écarts du banc lui-même.
- **Lignes droites, à 0 px ou aux seuls écarts du témoin** :
  - ville (midi, `herolook=1`) : D « droite », D « gauche », D « droite » + Maj, D manette (1, 0), A « droite », B « bas » : **0 px** ; B « haut » (2 images) et B « droite » (1 image) : les images du témoin ;
  - parvis : « droite », « gauche », « haut », « droite » + Maj, manette (1, 0) : **0 px** ; « bas » : l'image du témoin ;
  - lices : « droite », « haut », « gauche » : **0 px** ; place de la halle : « droite », « bas », « gauche » : **0 px**.
- **Une ligne droite change, à dessein** : en B, la touche « gauche » (et la manette (−1, 0)) loin du centre du cadre ; `main` y passe au trois-quarts face (le cap contre la ligne de visée) pendant que le pas reste horizontal à l'écran, la branche garde le profil (5 images sur 9 à partir du pas 100). C'est le même défaut que la diagonale.
- **Le jeu d'aujourd'hui et le district inchangés** : la nuit sans `herolook`, « bas + gauche » en B **0 px**, « haut + droite » en D l'image 180 du témoin ; une partie `v2=0` (`play=1&new=1&v2=0`), « bas + gauche » : **0 px**. Le code n'y prend pas le nouveau chemin (`heroStepView` faux).
- **Les PNJ** : ils sont dans chaque image (la foule de midi, les gens des places) et suivent les mêmes pas : aucune différence hors des écarts du témoin et du héros.
- **Contrôles** (le banc voit le changement) : parvis « haut + droite » et lices « bas + gauche » : 9 images sur 9 diffèrent.

### Tests — [OK]
- `tests/views.test.mjs` +2 : `heroWalkFacing` (un cap à 45° qui traverse l'écran à 75° : le profil ; à 55° : le trois-quarts ; un dos qui glisse vers le point de fuite reste un dos ; le bord tenu à 67,5 / 62,5) ; dans la ville au cadrage B, les quatre diagonales de profil avec `heroStepView` et leur miroir, le trois-quarts sans lui (le défaut d'`ActorSystem`), droit devant le dos, vers la caméra la face, en travers le profil, le PNJ inchangé. Trois fautes injectées, attrapées : la règle sans effet, le miroir inversé, le bord sans tenue.
- `npm run typecheck` sans erreur ; `npm test` **596 sur 596** ; `npm run build` réussi ; `npm run art:validate` 73 manifestes, 123 sources, 23 manifestes de son, 0 erreur.
- Les passes gardées dépassaient 60 Ko avec MD1 : ECO1 et TF1 (branches fusionnées) déplacées d'un bloc, à l'octet, dans `journal/85-passes-ECO1-TF1.md`, leur ligne ajoutée à l'index ; preuve par script : le corps de l'archive égale les octets retirés (20 631), chaque section dans un seul fichier, CRLF gardé.

### Reste — [?]
- **La manette entre deux directions** : un stick à 20-30° de la verticale donne un pas à 56-67° à l'écran ; la vue y reste celle du cap (le dos, la face ou le trois-quarts), dessinée sans dérive : elle glisse encore (77 à 119 px/s en travers en ville B, 39 px/s sur le parvis). Le clavier n'y passe pas (ses diagonales sont à 70-79°). Le remède est dans l'art : des courses de trois-quarts (et de face) dont le pied posé recule dans l'image et dont les jambes alternent ; toute nouvelle image passe par l'opérateur (décision à préparer sur fiche).
- **Sur les places, la marche droite de profil glisse de 0,17** (la course, accordée, 0,02) : l'horloge de la marche y vaut 1 sans tenir compte de la vitesse que le cycle dessine ; existait avant, non touché (la ligne droite devait rester identique).

### Pensée
- Une vue « juste » et un cycle « juste » sont deux choses : la règle du regard choisissait la bonne direction du corps, pour un cycle qui ne dessine pas la dérive que le mouvement à l'écran demande. Mesurer le pied à l'écran (et non le long d'un axe) montre tout de suite lequel des deux manque.
- Un défaut qui « se voit en diagonale » se voit aussi en ligne droite : en B, la touche « gauche » loin du centre du cadre donnait déjà un trois-quarts qui glissait à l'horizontale ; la même règle le corrige.

