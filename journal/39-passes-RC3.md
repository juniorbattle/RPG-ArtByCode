# Journal de bord — archive : passe RC3 (2026-10-26 → 2026-10-29)

> Déplacée mot pour mot de `JOURNAL.md` le 2026-11-01 (Passe FX5) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe RC3 — La coupe de Ren reprise puis écartée par l'opérateur (« Revenir à l'ancienne ») ; la feuille de Marek générée puis arrêtée, hors du cadre des planches de référence (2026-10-26 → 2026-10-29)

### Demande
- Séance locale lancée par la séance parente (« Cité du Tournoi Local ») le 26/10 : la feuille de combat de Marek à ×3 (labo) par la voie de la
  feuille de Ren, la reprise de la coupe de Ren (RC2-2 « La garder ; reprise dédiée plus tard »), une fiche d'arbitrages (la feuille de Marek,
  la coupe, l'entrée en production des deux feuilles, RC2-5).
- Worktree `.claude/worktrees/sleepy-chandrasekhar-9a04ba` (hors du dossier partagé), branche `marek-combat-x3` puis `ren-cut-x3` (renommée
  après l'arrêt de Marek, jamais poussée sous l'ancien nom) ; `npm ci` dans le worktree. Serveur `rc3-branch` (:5231, le worktree) par
  `preview_start` / `preview_stop`. Mise en pause par l'opérateur le 26/10 (« je veux une pause. ») ; reprise le 29/10 sur `main` (`94e15ca`) :
  la branche, sans commit, avancée en avance rapide.
- Le garde-fou de la séance refuse toute écriture dans la copie principale : `gen-image.mjs` est lancé par ses propres fonctions exportées
  (`parseArgs`, `readKey`, `generate`) depuis le worktree, la clé lue par `readKey` à la racine principale (son `.env.local`, ignoré par git,
  jamais affiché), le registre partagé de la copie principale, prompts, références et images dans le dossier ignoré du worktree
  (`art-lab/characters/scratch/marek-combat/`, `scratch/generated/marek-combat-x3/`) ; `--archive` par l'outil du worktree.

### Les choix de l'opérateur, mot pour mot
« = » : la recommandation est suivie ; « ≠ » : le choix diffère. Questions posées dans la séance (AskUserQuestion), sans note de l'opérateur.

| # | Question | Recommandation | Choix de l'opérateur | |
|---|---|---|---|---|
| RC3-1 | D'où vient le design de la feuille ×3 de Marek ? | « Planche générée d'abord (Recommandé) » | « Planche générée d'abord (Recommandé) » | = |
| RC3-2 | Quelles clés tant que C3 n'a pas fixé sa garde, son esquive, ses compétences ? | « Le minimum du § 14 : 24 (Recommandé) » | « Le minimum du § 14 : 24 (Recommandé) » | = |
| RC3-3 | La planche de personnage montrée avant les planches de combat ? | « Me la montrer d'abord (Recommandé) » | « Me la montrer d'abord (Recommandé) » | = |
| RC3-4 | La coupe de Ren : par quelle voie ? | « Génération guidée (Recommandé) » | « Génération guidée (Recommandé) » | = |
| RC3-5 | Les proportions de Marek (4,5 à 5,1 têtes contre 3,1 pour Ren) | « 3e essai, repère du Capitaine (Recommandé) » | « 3e essai, repère du Capitaine (Recommandé) » | = |
| RC3-6 | Que fait la séance (Marek hors du cadre) ? | « Arrêter Marek, finir la coupe de Ren (Recommandé) » | « Arrêter Marek, finir la coupe de Ren (Recommandé) » | = |
| RC3-7 | La nouvelle coupe de Ren dans la feuille de labo | « Garder la nouvelle (Recommandé) » | « Revenir à l'ancienne » | ≠ |

- Le message de l'opérateur du 29/10 qui a mené à RC3-6, mot pour mot : « Nous sommes cense travaille sur nos personnages combattants et rivaux
  en nous basant sur les images references, or Marek est une conception nouvelle qui sort de notre cadre, actuellement la sessions V2-2 travaille
  sur les rivaux » (avec quatre planches de casting jointes dans la séance : Cédric, le Lion champion du tournoi, le Rival chevalier émérite, la
  Duelliste, le Maître d'armes…). Pendant la pause, l'opérateur avait aussi décidé AV-10 « Mettre Marek en pause jusqu'à la nouvelle commande »
  (Passe AV1) et V2-18 « Les rivaux d'abord » (Passe FV3).

### Marek — [KO → arrêté] une conception hors du cadre des références
- **Planches de personnage** (tâche `marek-combat-x3`, gpt-image-2, n = 2, 1536 × 1024, haute qualité, une requête à la fois) : le Marek
  généré d'aujourd'hui (`FighterArt`, agrandi ×4) comme référence de design, la v4-b du héros pour le rendu, huit vues et trois vues de profil
  avec l'épée. A : critique à l'aveugle (agent neuf ; le premier lancé a échoué sur une coupure réseau, relancé) **A-1 6,5 contre A-2 5,5**,
  mon auto-critique écrite avant concordante. Défaut commun mesuré : **5,1 têtes contre 3,1 pour Ren** (la tête de Marek aux deux tiers de celle
  de Ren à l'écran ; la consigne « 30 % de la hauteur » ignorée).
- **[KO] les proportions ne viennent pas** : B (consigne en pixels, « la tête de la taille de celle de Ren ») 4,5 têtes ; C (le Capitaine de la
  garde de la planche de casting n° 06 joint comme seul repère de proportions) 4,4 à 4,5. Le générateur garde des proportions adultes pour un
  chevalier âgé. B gardée, comme l'option RC3-5 le prévoyait.
- **Planches de combat** sur un fond vert uni (la critique avait mesuré 3,4 à 4,5 % de pixels de la couleur du fond gris dans l'acier : des trous
  au détourage) : a (repos, posture, armé, coupe, suite, coup reçu ×2, étourdi, victoire), b (la puissante ×4, le K.O. ×3), c (la compétence
  offensive ×4, un coup reçu debout, une seconde victoire) : toutes les poses des 24 images, deux variantes chacune ; non critiquées, non
  reconstruites.
- **Arrêt (RC3-6)** : rien de Marek n'entre dans le dépôt. Ses deux planches archivées (`marek-turnaround-2026-10-26-a1` et `-b1`, jamais
  commitées) sont rendues au dossier ignoré, leurs originaux identiques à l'octet (SHA-256 `b9666c87…`, `f9183311…`) restant dans
  `scratch/generated/marek-combat-x3/`. Marek se fera depuis les planches de référence dans la tâche des rivaux (V2-18), avec la nouvelle commande
  et les poses de charge (AV-10).

### Le coût — [?] une requête perdue sur une coupure réseau
- Huit requêtes : planches de personnage A, B, C (0,3764 + 0,3895 + 0,3985 $), la coupe de Ren (0,3979 $), planches de combat a, b, c (0,3891 +
  0,3884 + 0,3881 $) : **2,73 $ payés** (dont 0,40 $ pour la coupe de Ren, 2,33 $ pour Marek).
- **[?]** une neuvième (la planche b, premier envoi, 26/10 04:30:49 UTC) : « fetch failed » avant toute réponse (le DNS ne résolvait plus
  l'API ; la critique lancée au même moment a échoué en `ENOTFOUND`). L'outil garde sa réservation au pire cas (1,2556 $) : on ne sait pas si
  elle a été facturée. **Registre de la tâche : 3,98 $ sur 5** ; la réservation suivante dépasserait le plafond : aucune génération de plus sans
  décision de l'opérateur.

### La coupe de Ren — reprise d'après la spécification du critique de la Passe RC2, puis [KO → écartée] par l'opérateur
- **La requête guidée** (RC3-4) : références la v4-b, la planche a2 de RC1 et un guide de pose fait des images de Ren (l'armé ; un collage de la
  taille F-2 dont le bras et la lame sont abaissés de 30° autour de l'épaule ; la suite) ; le prompt reprend la spécification (les deux mains à
  hauteur d'épaule, la lame de 0 à 15° au-dessus de l'horizontale, les poignets cassés, le visage de profil, la cape qui suit, dans la case) ;
  deux variantes de quatre versions.
- **Reconstruites** par la chaîne du rig au pas de la tête (aucune figure debout : 74 et 68 pixels de tête contre ~39 texels à ×3, soit 1,91 et
  1,75), vérifiées côte à côte avec l'armé et la suite ; lames redessinées par `blade2` (segment proposé par RANSAC, la garde trouvée en marchant de
  la pointe jusqu'au premier texel coloré) ; toutes tiennent dans la case (172 à 185 texels).
- **Critique à l'aveugle** (agent neuf, lettres tirées au sort, neuf options : la coupe actuelle et les huit) : **D 7** (i2, version 3 : la taille
  la plus lisible, poignets cassés, la lame frappe l'épaule, la cape suit ; 19°, hors spécification de 4°), J 6,5, A 6, F 5,5, G 5, H 4,5, C 4,5,
  E 4, B 2 (l'actuelle). Auto-critique écrite avant : J. **[KO → noté]** mon kit a extrait la coupe actuelle sur un fond opaque (`zoom.mjs`) : un
  rectangle noir ; sa note n'est pas comparable (sa pose avait été jugée en RC2 : la lame au-dessus de la tête de Marek).
- **Défaut commun relevé par le critique** : pour que la lame générée tienne dans la case, le rig repoussait la figure de 17 à 25 texels : le pied
  avant reculait de 10 à 19 texels à l'impact par rapport à l'armé et à la suite, Ren sautait en arrière au lieu de se fendre (la coupe F-2 : 14
  à 16 ; la poussée de la coupe était déjà de 21 en RC2).
- **Corrections au rig** (celles que le critique prescrit) : la lame tournée de 19° à **14°** autour de la garde ; la poussée fixée à **15**
  texels (`FIGURES.cut.push`, au lieu des 24 qu'imposait la lame générée), d'où une lame de **61** texels (63 dans l'armé) ; deux texels gris
  que la garde retenait sous la lame effacés (`FIGURES.cut.clear`). Pied avant mesuré : 63 contre 55 dans l'armé et la suite (+8).
- **La feuille** : seule l'image 5 (`strike.1`) change (9 352 texels) ; 34 images, 64 couleurs, toutes de `hero-x2-v4` ; `build-combat.mjs --check`
  : reconstruite identique. Source archivée non canonique : `ren-combat-x3-2026-10-26-i2` (records et octets) ; le rig ne lit plus `-f2` (gardée
  archivée). Paquet de provenance et manifeste mis à jour (la chaîne décrit aussi les deux texels clairs et le bord sombre de RC2, que son texte
  n'avait pas suivis).
- **Dans la scène**, critique à l'aveugle (agent neuf, X / Y tirés au sort par lumière ; l'image d'impact au moment `strike`, nuit et midi, avant /
  après) : **après 7 et 7,5, avant 4 et 4,5** (la nuit, à midi) ; la nouvelle touche Marek au menton et au haut du buste, l'ancienne frappe le
  vide, sa pointe ~150 px au-dessus de l'étincelle d'impact. Restes relevés sur la nouvelle : elle se lit plutôt comme une estocade (pas d'arc de
  taille) ; la lame faible la nuit (un trait lavande de 2 px que le halo de l'étincelle noie) ; la cape raide ; l'avant-bras et le gant d'un seul
  bloc ; la garde comme un bâton à part ; le cou absent ; le liseré froid de la nuit laisse des pixels clairs détachés sur les mèches.
  Auto-critique écrite avant : après 7, avant 5.
- **Le choix de l'opérateur (RC3-7)** : « Revenir à l'ancienne », contre la recommandation et la critique. **Défait** : le rig, l'export, la source
  Aseprite, le paquet de provenance, le manifeste et le test reviennent à l'octet à ceux de `main` (vérifié : aucun fichier suivi de `art-lab/` ni
  de `tests/` ne diffère ; `art:validate` 19 manifestes, 40 sources, 0 erreur ; `tests/combat-sheet.test.mjs` 9 / 9 ; `build-combat.mjs --check`
  identique) ; la source `ren-combat-x3-2026-10-26-i2`, jamais commitée, rendue au dossier ignoré (identique à l'original de `scratch/generated/`).
  La reprise ne vit plus que dans ce journal et deux images.
- Images de la reprise écartée : `screenshots/calibration/rc3-ren-cut/` (le duel la nuit, avant / après ; les trois images de `strike`, avant /
  après).

### Les preuves (faites sur la reprise, avant le choix de l'opérateur ; parties avec elle)
- `tests/combat-sheet.test.mjs` : **10 tests** (+1 : l'angle de la lame de la coupe entre 0 et 15°, la poussée au plus 15, le pied avant mesuré
  dans l'export à 10 texels au plus de celui de l'armé et de la suite ; la liste des sources : i2 au lieu de f2). **6 fautes injectées sur 6
  attrapées** (lame à 29°, poussée 24 dans `build.json`, l'ancien export, la coupe tirée d'une autre planche, la source i2 déclarée canonique, le
  `clear` retiré), fichiers rendus à l'octet (SHA-256).
- Validation sur la reprise : typecheck, `npm test` **279 / 279**, build, `art:validate` (19 manifestes, 41 sources, 0 erreur),
  `build-combat.mjs --check` identique. Après le retour, la branche ne change que `JOURNAL.md` et deux images.
- **Aucun fichier de `src/`**, ni `index.html`, `vite.config.ts`, `package*.json` ne change : l'arène par défaut et le bundle de production ne
  peuvent pas changer (la feuille n'est lue que par le module DEV, derrière `import.meta.env.DEV`). Le temps GPU n'est pas remesuré : même
  texture, mêmes 34 cases.

### Restes [?]
- La fiche d'arbitrages prévue (Marek, la coupe, la production) s'est réduite à la coupe (RC3-7, posée dans la séance) ; RC2-5 « Pas encore :
  avec la feuille de Marek » reste : la feuille de Ren attend celle de Marek, faite depuis les planches de référence.
- **La coupe reste celle de F-2** (RC2-2 toujours ouverte) ; la raison du choix n'est pas donnée. Pour une reprise future : la spécification du
  critique de RC2, les restes relevés ci-dessus, et la case qui fixe l'allonge (la lame générée repousse le corps : pied avant +14 à +16 pour F-2).
- La réservation de la requête perdue (1,26 $) au registre de `marek-combat-x3`.

### Journal — [OK] archivage (passes gardées au-delà d'environ 60 Ko)
- Avec cette passe, les passes gardées faisaient 60,6 Ko. VP9, close (fusionnée), part vers `journal/35-passes-VP9.md` (25 994 octets, bloc de
  25 685) ; restent 34,9 Ko. Preuve **8 / 8** (script hors dépôt, contre la copie de `JOURNAL.md` d'avant le déplacement : corps de l'archive égal
  au bloc ; VP9 d'un seul tenant, suivie de FV1 ; plus dans `JOURNAL.md` ; chaque passe dans un seul fichier, par sa ligne de titre entière ; de FV1
  à la fin inchangé à l'octet, sauf la liste des archivages de « À reprendre » ; dans l'en-tête, seules la phrase des archives et une ligne
  d'index changent ; en-tête comme `journal/34` ; CRLF seuls). Contrôle négatif : un bit changé dans une copie de l'archive → 7 / 8. La liste des
  derniers archivages de « À reprendre » est complétée de ceux des passes V0 à VP9, qu'elle n'avait pas suivis.

### Pensée
- Un personnage se tire des planches de référence du projet : avant de générer un design neuf, relire les décisions en cours sur `main` (ici AV-10,
  V2-18, prises pendant la pause) et demander s'il sort du cadre.
- Trois tirages n'ont pas donné des proportions de chibi à un chevalier âgé, même avec un repère de proportions joint : un rival se part d'une
  planche qui a déjà les proportions du monde.
- Une requête perdue sur le réseau garde sa réservation au pire cas : un plafond se budgète avec cette marge.
- La case fixe l'allonge : faire tenir une lame générée trop longue repousse le corps et les pieds sautent à l'impact ; la poussée se règle à la
  main, la lame se redessine plus courte, et le résultat se mesure aux pieds, contre l'armé et la suite.
- Un kit de critique présente chaque option sur le même fond : un fond opaque a disqualifié une option sans rapport avec sa pose.
- Une reprise qui gagne à l'aveugle peut être refusée par l'opérateur : la critique classe, l'opérateur décide. Rien d'une reprise n'entre dans le
  dépôt avant son choix, et le retour se prouve à l'octet contre `main`.
- Un texte qui contient des accents graves ne passe jamais dans une commande shell entre guillemets doubles (substitution de commande) : il passe
  par un fichier ou par l'outil d'édition.

