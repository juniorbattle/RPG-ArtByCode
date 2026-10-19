# Journal de bord — Cité du Tournoi (Merchant District, nuit)

Objet : garder une trace honnête de ce qui a été fait, de ce qui a marché, de ce qui a raté et de **pourquoi**, pour que
la suite parte d'un état connu. À compléter à chaque passe (une entrée par passe, la plus récente en bas).

Légende : **[OK]** réussi · **[KO]** échec / impasse · **[?]** non résolu ou à surveiller · **Pensée** = raisonnement / leçon.

> Les passes 0 à S1b, H0, M6, V0 à V3, H1, M7 et H2 à H4 sont archivées **mot pour mot** dans `journal/` (Passes M3, M6, M7, H5, T1 et B1) ; ce fichier garde les passes récentes,
> « À reprendre » et « Principes à garder ». Un renvoi à une passe archivée (« journal pass 6k », « JOURNAL, Passe 4A-0B ») se lit
> dans le fichier que donne l'index.

| Archive | Passes | Dates |
|---|---|---|
| [`journal/01-passes-0-4B.md`](journal/01-passes-0-4B.md) | 0, 1, 2 (+ « État à la fin de la passe 2 »), 3, 3b, 4B | 10/10 → 12/10 |
| [`journal/02-passes-4A-0A-4A-quindecies.md`](journal/02-passes-4A-0A-4A-quindecies.md) | 4A-0A, 4A-0B, 4A, 4A-bis, 4A-ter, 4A-quater, 4A-quinquies, 4A-sexies, 4A-septies, 4A-octies, 4A-nonies, 4A-decies, 4A-undecies, 4A-duodecies, 4A-terdecies, 4A-quattuordecies, 4A-quindecies | 12/10 → 16/10 |
| [`journal/03-passes-4A-sedecies-M2.md`](journal/03-passes-4A-sedecies-M2.md) | 4A-sedecies, 4A-septendecies, 4A-duodevicies, 4A-undevicies, 4A-vicies, 5, 4A-unvicies, 5b, 4A-duovicies, 4A-tervicies, M1, 4A-quatervicies, M2 | 16/10 → 17/10 |
| [`journal/04-passes-6-6k.md`](journal/04-passes-6-6k.md) | 6, 6b, 6c, 6d, 6e, 6f, 6g, 6h, 6i, 6j, 6k | 17/10 → 18/10 |
| [`journal/05-passes-M3-M4.md`](journal/05-passes-M3-M4.md) | M3, Q1, Q1b, M4 | 18/10 |
| [`journal/06-passes-M5-S1b.md`](journal/06-passes-M5-S1b.md) | M5, S1, S2, S1b | 18/10 |
| [`journal/07-passes-H0-M6.md`](journal/07-passes-H0-M6.md) | H0, M6 | 18/10 |
| [`journal/08-passes-V0-V3.md`](journal/08-passes-V0-V3.md) | V0, V1, V2, V3 | 18/10 |
| [`journal/09-passes-H1-H4.md`](journal/09-passes-H1-H4.md) | H1, M7, H2, H3, H4 | 18/10 → 19/10 |

---

## Passe H5 — Héros premium : planche de base archivée, `hero-x2-v2` construit au stade lab (candidat) (2026-10-19)

### Reçu
- Onze PNG dans `incoming/` (« tu peux consulter le incoming ») : neuf avec le manifeste C2PA d'OpenAI (liaison dure recalculée identique,
  signature non vérifiée) ; `ref1` / `ref2` sans manifeste, mêmes pixels que les planches 1 et 3 du casting (écart 0,00). `2.png` (vue
  tournante 8 vues, marche 8, course 8) mesurée : même échelle partout, tête ≈ 0,33, vrai profil au repos ; course en poses de contact et
  ramassées seulement. Question : « Je construis le héros depuis 2.png, sans le motif doré ? » ; réponse, mot pour mot : « Oui : archive 2.png
  et construis le héros depuis elle, cape sans motif doré sur l'ourlet. »
- Branche `hero-x2-v2` depuis `main` (`0398c4f`). Archivée à l'octet (`cmp`) : `reference/sources/hero-turnaround-v3-2026-10-19.png`
  (`a86cea28…`) et sa fiche. La clé d'API OpenAI de l'opérateur (`.env.local`, ignoré par git, son ajout au `.gitignore` est de lui) n'est
  ni lue ni utilisée ici.

### Construction (`rigs/hero-x2-v2.rig.mjs`, outils partagés inchangés)
- Pas 3,4 ; `--holes --closing-from=48` ; l'ombre portée de la planche retirée dans le rig (gris neutres atteignables depuis l'extérieur,
  rangées ≥ 78) : face de 84 rangées, 1,777 m. Repos : respiration de la distribution.
- Course de profil, 8 images : les huit figures de la rangée de course, découpées (deux se touchent : remplissage depuis chaque tête),
  reconstruites au même pas, retournées, sur la palette commune, calées sur le visage. **[KO]** jambes peintes par IK sous les hauts du
  corps dessinés (méthode de `hero-x2-v1`) : bottes raides à côté des bottes dessinées, pan du manteau coupé en dents de scie. **[KO]**
  jambes dessinées décalées d'un bloc : la hanche se détache du manteau. **[OK]** jambes dessinées **cisaillées depuis la hanche** (pied à
  plat, déplacé d'un bloc) : pied d'appui sur une piste de 9 texels par image ; les images 4 et 8 reprennent les jambes des images 3 et 7.
  Pas de phase de vol (la planche n'en dessine pas).
- Face / dos : rebond, poids, cape, jambes levées sous le corps ; les mains descendent au balancement avant. **[KO]** les déplacer par
  `movePart` laissait des traînées claires (le fond comblé depuis la manche) ; la main redescendue est dessinée par-dessus.

### Contrôles
- `--check` : reconstruit à l'identique ; `verify-provenance` : intact ; `walkSlide` 9 texels : horloge × 1,56 en B / D, × 1,52 en C,
  × 1,6 (plafond) en A ; glissement en mouvement (joueur tenu sur une touche) B −0,02, C −0,05, D −0,02 ; Maj en B −1,09 (connu).
- Aperçu DEV `?cast=candidate` (entrée candidate de `BakedCast`, `replaces: ['player']`) ; flipbook de la course en B et D relu ;
  captures `reviews/hero-x2-v2/`. En B, l'anneau pointillé autour de la tête est le dévoilement du réverbère du quai, pas le sprite.
- **Critique à l'aveugle** (agent neuf, étiquettes tirées au sort, contre `dockworker-x2-v2`) : héros meilleur en silhouette, matières et
  animation ; moins bon en proportions (cheveux et gants volumineux), visage (yeux sous la frange), palette sombre et contours. Son premier
  défaut, un halo clair autour du contour, **[OK] vérifié sur les pixels** : 6,2 % des texels du bord ont le gris du fond de la planche
  (distribution 0,8-1 %, `hero-x2-v1` 4,1 %) ; retiré dans le rig (`dehalo` : bords gris neutres de la clarté du fond, deux passes) → 0,5 %.
  Bras figés devant la poitrine et course sans vol : dessin de la planche, laissé à l'opérateur (qui a jugé les bras de ces planches
  vivants, Passe H4).
- Seconde critique, neuve, après la retouche : plus de halo signalé ; héros toujours meilleur en silhouette, mains, matières et animation
  (jambes : contact, passage, genou levé ; cape), égal en proportions, moins bon en visage (yeux sombres sous la frange, pas de bouche :
  illisible à 1-2 px par texel), palette (cheveux, sangles, gants et bottes sur une même rampe brun-orangé) et contours (couronne des cheveux
  effritée, bruit du buste en course). Vérifié sur les pixels : 17 texels orphelins sur 36 images, aucun îlot (voyageur 11, docker 0) :
  l'effritement est la texture peinte de la planche à 3,4 px par texel plus qu'une saleté ; restent quelques texels clairs (pan de chemise)
  entre les jambes des images 7 et 8. **[KO] critère d'acceptation du brief (§ 7 : au moins égal au docker sur chaque axe) non atteint**
  (visage, palette, contours) ; une retouche faite sur les deux permises, la suite (visage, bras, vol) touche au dessin de la planche :
  décision de l'opérateur.

### Journal — [OK] archivage
- Avec la Passe H5, les passes gardées atteignaient 61 415 octets (seuil ≈ 60 Ko) : H0 et M6, les deux plus anciennes (closes : décisions
  consignées, branches fusionnées), déplacées d'un bloc, dans leur ordre, à l'octet, dans `journal/07-passes-H0-M6.md` (en-tête, ligne `---`,
  puis les 5 281 octets inchangés, SHA-256 `cdd6363d1487f793…`) ; ligne d'index et phrase d'en-tête mises à jour ; 56 134 octets de passes
  gardées (V0 à H5).
- Preuve (script hors dépôt, contre le journal juste avant le déplacement) : **8 / 8** (en-tête ; corps = octets retirés ; H0 et M6 chacune
  une seule fois, dans la nouvelle archive ; passes gardées inchangées ; `JOURNAL.md` = l'original moins le bloc, à la phrase et à la ligne
  d'index près ; archives 01 à 06 inchangées ; CRLF seuls). Contrôle négatif : un mot changé dans une copie de l'archive → 7 / 8.

### Restes [?]
- **Décision de l'opérateur** : production du héros ou retouches ; rien n'est approuvé.
- Texture cuite : 322 + 36 images, au-delà des 336 garanties (l'aperçu passe sur ce GPU) ; à élargir avant la production.
- Course avec Maj (4,25 m/s) ; masques des déclinaisons de couleur (tâche distincte).

### Pensée
- Une planche qui ne dessine que les poses extrêmes d'une course se complète par cisaillement de ses jambes depuis la hanche (le pied reste
  un bloc à plat) : le dessin d'origine reste, la foulée devient régulière ; des jambes peintes à côté d'un dessin riche font tache.
- Le fond d'une planche se mélange aux cellules du bord : mesurer la part des texels du contour proches de la couleur du fond, et la retirer
  au rig, avant la critique.

## Passe F1 — Revue du héros par l'opérateur ; le sprite d'un marcheur suit son déplacement réel (2026-10-19)

### Revue de l'opérateur (`hero-x2-v2` en jeu, DEV `?cast=candidate`), mot pour mot
- « les courses de profil ne sont pas bons surtout quand le joueur descend vers le bas de la camera de face on dirait que le joueur fait une
  monte de genou, sinon on utilise un anim qui donne l'impression de courir mais le personnage se deplace lentement... le heros a cote des
  pnjs semble correct, mais de maniere generale j'ai l'impression que les angles de camera dynamique n'aide pas setup de maniere clair les
  deplacements des perso npc/heros correctemnt ils donnent l'impression de marcher de travers... un des docker lors qui marche vers le stand
  de la marchande se deplace avec vers le bas et du point de vue de la camera on le voit se deplacer de cote dos a la camera.... donc de
  travers »

### Mesures à sa suite
- Méthode : variante hors dépôt du harnais de `tools/foot-slip.mjs` ; à chaque pas, la vue montrée contre celle que donnerait le
  déplacement réel à l'écran (même règle des 50° / 40°).
- Cause 1, **[OK] confirmée** : le sprite prenait la direction **voulue** (cible du PNJ, touche du joueur) alors que `resolve` fait glisser
  le marcheur le long d'un seul axe contre un obstacle. En D, le docker montré de profil vers la droite en allant vers la gauche sur 4,8 % de
  ses pas (40 s, graine 1842).
- Cause 2, **[?] structurelle** : trois vues seulement (face, dos, profil) ; en B et C, 41 à 100 % des pas des PNJ partent à 20-40° en
  diagonale à l'écran (en D : 0 à 13 %) : un profil qui glisse en diagonale.
- Course du héros : la planche dessine ≈ 14 texels par image entre ses poses, resserrés à 9 pour 2,5 m/s : grande allure, petit pas
  (« court mais avance lentement ») ; de face, les jambes levées jusqu'à 9 texels sous le corps se lisent comme une montée de genou.

### Décisions de l'opérateur (2026-10-19), mot pour mot
- Vitesse : « Héros plus rapide (Recommandé) » (garder les enjambées dessinées, ≈ 3,5-4 m/s, Maj à revoir).
- Directions : « Correctif puis 3/4 (Recommandé) » (d'abord le sprite suit le déplacement réel ; ensuite étudier des vues de trois-quarts,
  le héros d'abord, dont la planche en dessine).

### Fait — [OK] le correctif
- Branche `facing-actual-motion` depuis `main` (`0b5de1c`). `ActorSystem.shownStep` : un pas est montré, et son horloge réglée, par le
  déplacement réel dès que les obstacles en laissent passer au moins un cinquième ; bloqué, le marcheur garde la direction voulue. Joueur et
  PNJ ; positions et tirages inchangés (seule la vue montrée change).
- `tests/stride.test.mjs` +1 (un pas en diagonale bloqué vers la caméra glisse à droite : profil vers la droite, horloge à la vitesse du
  glissement) ; contrôle négatif : l'ancien `ActorSystem.ts` remis → 1 échec. `npm test` 39 / 39, `typecheck`, `build`, `art:validate`.
- Audit après : D, docker 4,8 % → 0,0 % de vues contraires au déplacement ; mêmes nombres de pas (déplacements identiques). Les diagonales
  de B / C restent (cause 2).

### Restes [?]
- Héros plus rapide : vitesse du joueur cuit, enjambée dessinée (≈ 14 texels par image), course de face sans montée de genou ; Maj.
- Étude des vues de trois-quarts (héros d'abord).
- Suite confiée par l'opérateur à une séance cloud (consolider le Merchant District : personnages en scène, architecture, caméras, météo).

### Pensée
- Une vue se choisit sur ce que le personnage fait à l'écran, pas sur ce qu'il voulait faire : un glissement contre un obstacle doit se voir
  comme un pas de côté.
- Avec trois vues, toute marche en diagonale à l'écran se lit de travers ; mesurer la part des pas hors de l'axe de la vue montrée dit si le
  problème est le choix de la vue ou le nombre de vues.

## Passe T1 — Séance cloud : texture cuite en colonnes (672 images garanties) ; archivage V0-V3 (2026-10-19)

### Demande et cadre
- Brief de la séance locale, transmis à une séance cloud de 4-5 h : consolider le Merchant District (personnages en scène, architecture et
  caméras, météo), point 3 des personnages : « Texture des personnages cuits à élargir avant toute production du héros : les dix PNJ en
  production utilisent 322 des 336 images garanties en 2048 rangées, et le héros en ajoute 36. »
- Consigne de l'opérateur pendant la séance, mot pour mot (extraits) : « pleine autonomie jusqu'à la fin de la séance, elle remplace « arrête-toi
  et pose-lui une question » du brief » ; « Ne t'arrête jamais pour demander, et n'attends aucune réponse : avance sur tout le brief. » ;
  « Certaines décisions restent les miennes : approbation d'assets pour la production, statut Gold Master, installations, changement des
  cadrages A/B/C/D approuvés. » ; « Ne les prends pas : prépare-les derrière un paramètre d'URL, sans changer le jeu par défaut. » ; « Pour toute
  autre décision technique : choisis toi-même l'option la plus sûre. Consigne-la dans le journal comme ton choix, avec ses raisons, et non comme
  ma décision. » ; « Fusionne dans main chaque tâche validée, comme le dit AGENTS.md. »
- Branche : la séance cloud impose un seul nom de branche (`claude/stoic-goodall-8ieke4`) ; **mon choix** : une tâche à la fois sur ce nom,
  fusionnée en avance rapide dans `main`, supprimée, puis recréée depuis `main` pour la tâche suivante (une branche par tâche, comme le veut
  `AGENTS.md`).

### Environnement de la séance cloud — [OK] mesuré
- Linux, 4 cœurs, Node 22.22.0 ; `npm ci`, `typecheck`, `npm test` (39 / 39), `build`, `art:validate` (16 manifestes, 12 sources, 0 erreur) : OK.
  `art:doctor` : Aseprite **non installé** (rien installé). Pas de GPU (`/dev/dri` absent).
- Chromium 1194 (celui de Playwright, préinstallé dans le conteneur) : WebGL2 par **SwiftShader** (rendu logiciel ; `MAX_TEXTURE_SIZE` 8192,
  MSAA 4, minuteurs GPU présents mais sans valeur pour la 780M). Le jeu démarre : 154 s en 1280 × 720, dont 136 s de bake ; 25 s avec `vis=0`.
  Les captures déterministes (`tools/detshots.mjs`) marchent ; **aucune mesure de temps GPU de cette séance ne vaut pour la machine de
  l'opérateur** (seuls les appels de dessin et triangles se transposent).
- Chrome refuse de démarrer en root sans `--no-sandbox` : un enveloppeur hors dépôt (`exec chromium --no-sandbox "$@"`) sert de `CHROME_PATH`
  aux outils figés par empreinte (`reconstruct-grid`) sans les toucher. `tools/detshots.mjs` prend désormais `CHROME_ARGS` (remplace les
  options GL, ex. `--use-angle=swiftshader`) et `READY_MS` (délai de démarrage) ; sans ces variables, rien ne change.

### Texture cuite en colonnes — [OK]
- `SpriteAtlas.packBaked` : rangement par étagères (une par densité, dans l'ordre des feuilles) en **colonnes de 1024 × 2048 texels** (2048 =
  le minimum garanti par WebGL2, quel que soit le GPU : même rangement partout) ; une image qui ne tient plus sous la rangée 2048 ouvre la
  colonne suivante à x = 1024 ; deux colonnes au plus (2048 × 2048, la garantie) : **672 images ×2**. La première colonne se range exactement
  comme l'ancienne texture : la case d'une image ne bouge jamais quand on en ajoute après elle ; la texture n'a que la largeur de ses colonnes.
- Production (322 images) : une colonne, 1024 × 2016, **les mêmes octets** qu'avant. `?cast=candidate` (+ 36 images du héros) : 2048 × 2016
  (les 14 premières images du héros finissent la dernière étagère de la colonne 0, les 22 autres ouvrent la colonne 1) au lieu de
  1024 × 2208 (calculé : 23 étagères), au-delà de la garantie.
- L'adressage par case entière (contrat § 13) lit `(texel + 0,5) / taille` : la largeur de la texture ne change pas le texel lu.
- Contrat d'intégration : § 15 ajouté.

### Preuves
- `tests/baked-atlas.test.mjs` (4) : une colonne = l'ancienne formule (oracle écrit à part : x = (n mod 16) × 64, y = ⌊n / 16⌋ × 96) pour
  1 à 336 images ; au-delà, deuxième colonne, première inchangée ; 672 tiennent, 673 refusées ; une nouvelle densité ouvre une étagère, une
  étagère ×3 qui ne tient plus passe à la colonne suivante ; distribution réelle : production à l'octet près, cases et octets de chaque image
  de PNJ identiques avec le héros candidat. **Fautes injectées une à une, toutes attrapées** : colonnes de 4096 rangées (1 / 4 passe), nouvelle
  colonne à x = 0 (1 / 4), seuil décalé d'une étagère (1 / 4), trois colonnes permises (3 / 4), hauteur = dernière colonne (1 / 4).
- Captures déterministes (graine 1842, `clean=1&freeze=7.3&vis=0`, 120 pas, 1280 × 720, SwiftShader), branche contre `main` figé
  (`b3ac07f`, servi sur :5188), cadrages A / B / C / D (joueur placé dans la zone) : production **0 px** ; `?cast=candidate` **0 px** (héros dans
  la deuxième colonne d'un côté, texture de 1024 × 2208 de l'autre). Témoin : production contre candidat sur la branche, 7 538 à 12 797 px
  (le héros) ; répétition (deux chargements) 0 px. `vis=0` : le changement ne touche que la texture des personnages, pas le bake.
- `npm test` 43 / 43, `typecheck`, `build`, `art:validate`.

### Journal — [OK] archivage
- Les passes gardées faisaient 60 364 octets (forme de l'index git, fins de ligne LF) : V0 à V3 (closes : décisions consignées, branches
  fusionnées) déplacées d'un bloc, dans leur ordre, à l'octet, dans `journal/08-passes-V0-V3.md` (en-tête, ligne `---`, puis les 24 270 octets
  inchangés, SHA-256 `7a45d58c4e714cc2…`) ; ligne d'index et phrase d'en-tête mises à jour.
- Preuve (script hors dépôt, contre `git show b3ac07f:JOURNAL.md`, cette entrée laissée hors de la comparaison) : **8 / 8** (en-tête ; corps =
  octets retirés ; V0-V3 chacune une seule fois, dans la nouvelle archive ; passes gardées H1-F1 inchangées ; `JOURNAL.md` = l'original moins
  le bloc, à la phrase et à la ligne d'index près ; ligne d'index ; archives 01-07 inchangées ; LF seuls). Contrôle négatif : deux mots changés
  dans une copie de l'archive → 7 / 8. Le dépôt garde les fins de ligne LF dans l'index ; la copie de travail de l'opérateur les convertit.

### Pensée
- Une capacité se dimensionne contre la garantie de la norme, et s'étend en ajoutant à côté (une colonne) plutôt qu'en déplaçant ce qui
  existe : la production garde ses octets, la preuve en image est alors un 0 px exact.
- Une séance sans GPU reste utile pour l'image : le rendu logiciel est déterministe et compare deux versions entre elles ; il ne dit rien des
  temps du GPU de l'opérateur.

## Passe H6 — Héros plus rapide (code de jeu fait, rig préparé, export à reconstruire) ; étude des vues de trois-quarts (2026-10-19)

### Demande
- Décisions de l'opérateur de la Passe F1, mot pour mot : « Héros plus rapide (Recommandé) » (garder l'enjambée dessinée, ≈ 3,5-4 m/s, Maj
  à revoir ; de face, ne plus lever les jambes jusqu'à 9 texels) et « Correctif puis 3/4 (Recommandé) » (étudier les vues de trois-quarts,
  le héros d'abord). Séance cloud sans Aseprite (Passe T1).
- Branche `claude/stoic-goodall-8ieke4` recréée depuis `main` (`1b56448`). **[KO] environnement** : la suppression de la branche distante après
  la fusion de T1 est refusée par le proxy git de la séance (« unexpected disconnect », puis « Everything up-to-date ») ; la branche distante
  pointait sur le commit fusionné et sert de nouveau, sous le même nom, à la tâche suivante.

### Vitesse du héros cuit — [OK] code de jeu (`ActorSystem`)
- **Mon choix** (raisons : garder l'enjambée dessinée, aucune image qui patine, aucun changement du jeu par défaut) : un joueur cuit court à
  la vitesse que dessine son cycle, `walkSpeed` (la mesure du moteur, `walkSlide`) × 1,12 (l'échelle des personnages en B / D) × 1,5
  (`HERO_CLOCK`) : ses images défilent à 1,5 × la cadence de base en B / D, pied d'appui planté. La vitesse suit donc le dessin : avec l'export
  actuel (9 texels par image) 2,40 m/s au lieu de 2,5 ; avec le rig préparé (14 texels) **3,73 m/s**.
- Maj sur le héros cuit : un sprint × 1,2 (4,48 m/s avec 14 texels), son horloge bornée à 2 (`HERO_CLOCK_MAX` ; la borne des PNJ, 1,6, sert à
  empêcher un cycle lent de s'emballer, sans objet pour un cycle dessiné à la vitesse du héros) : en A (échelle 1), 2,02 → 2, 1 % de glissement.
- Joueur généré (la production : le héros cuit est un candidat, DEV `?cast=candidate`) : 2,5 m/s, × 1,7 avec Maj, inchangé.
- `tests/stride.test.mjs` : le test du joueur réécrit (oracle en nombres : 1,4 × 1,12 × 1,5 = 2,352 m/s, déplacement, horloges B / C / A,
  sprint, 14 texels → 3,73086 m/s ; joueur généré : 2,5 m/s, × 1, × 1,7) ; le test de la Passe F1 suit la nouvelle vitesse. **Fautes injectées
  une à une, toutes attrapées** : héros à 2,5 m/s (2 échecs), Maj × 1,7 pour le héros, borne 1,6 pour le joueur, vitesse selon l'échelle du
  cadrage courant, Maj × 1,2 pour le joueur généré (1 échec chacune).

### Rig préparé — [OK] images construites ici ; [?] export à reconstruire sur la machine de l'opérateur
- `rigs/hero-x2-v2.rig.mjs` : pied d'appui sur une piste de **14 texels par image** (l'écart contact → pied ramassé que dessine la planche,
  mesuré ici : pied d'appui des 8 images dessinées entre les colonnes 12,5 et 42,5, en deux images au lieu de trois de 9) ; la 4e image de
  chaque pas devient un **vol** (les jambes de la poussée, la figure 2 rangées au-dessus de la rangée des pieds : la critique de la Passe H5
  relevait « course sans vol ») ; de face / dos, jambes levées de **5 texels au plus** (`LIFT` 0,0,0,2,4,5,3,1 au lieu de 0,0,0,3,7,9,5,1).
- `build-character.mjs` tourne ici jusqu'aux images (étapes 1 à 4 : reconstruction par Chromium, palette, rig, contrôles du contrat) ; seule
  l'écriture Aseprite manque. Contrôle : avec le rig de H5, les 36 images reconstruites ici = l'export validé, **0 texel d'écart** ; avec le
  rig H6 : contrôles du contrat OK (anneau transparent, alpha binaire, repos sur la rangée 90), `walkSlide` **14** (mesure du moteur), rangée
  basse des images de profil 90 90 90 88 90 90 90 88 (vol).
- **L'export, le `.aseprite` et le paquet de provenance restent ceux de H5** : `verify-provenance` signale l'empreinte du rig (1 problème)
  jusqu'à la reconstruction ; `art:validate` passe (candidat, pas de production). À faire sur la machine de l'opérateur :
  `node tools/art-lab/build-character.mjs art-lab/characters/rigs/hero-x2-v2.rig.mjs`, puis `--check`, puis `verify-provenance` ; la revue
  (`reviews/hero-x2-v2/README.md`, § Pass H6) le détaille.

### Glissement en mouvement — [OK]
- `tools/foot-slip.mjs --keys=d[,shift]` (nouveau : touches tenues, le joueur court ; `CHROME_ARGS` / `READY_MS`), graine 1842, 4 s, caméra
  épinglée, médiane [min .. max] ; `main` figé (`b3ac07f`, export H5 à 2,5 m/s), branche (export H5 à 2,40 m/s), aperçu H6 (copie hors dépôt
  servie sur :5189 : la planche assemblée depuis les images du rig H6 et l'empreinte du paquet de la copie mise à jour ; jamais commitée ;
  l'assembleur redonne l'export H5 à 0 texel avec les images de H5) :

| | A | B | C | D |
|---|---|---|---|---|
| `main`, marche (2,5 m/s) | +0,09 | −0,02 | −0,05 | −0,02 |
| `main`, Maj (4,25 m/s) | −2,11 | +0,22 | +0,35 | +0,40 |
| branche, export H5 (2,40 m/s) | +0,05 | −0,07 | −0,10 | −0,07 |
| branche, export H5, Maj (2,88 m/s) | +0,01 | −0,03 | +0,04 | −0,01 |
| aperçu H6 (3,73 m/s) | +0,05 | −0,06 | −0,10 | −0,07 |
| aperçu H6, Maj (4,48 m/s) | +0,01 | −0,06 | +0,04 | −0,04 |
| aperçu H6, vers la gauche | — | −0,03 | −0,10 | −0,07 |

- Les −0,06 à −0,10 ne sont pas un glissement : à 11,25 images / s (horloge 1,5), une image dure 5,33 pas de 1/60 s, soit 5 ou 6 ; une
  période de 5 pas donne (5 − 5,33) / 5 = −0,067, une de 6 donne +0,111 : exactement les bornes mesurées (−0,07 .. +0,11) ; la moyenne est
  nulle. Sur `main`, l'horloge × 1,56 (5,13 pas) donnait −0,02 pour la même raison ; Maj patinait de +0,22 à +0,40 (horloge plafonnée à 1,6).
- En A, `main` place le héros à x = −16 hors du quai jouable (x ≥ −13,5) : mesures refaites à x = −12,5.

### Critique à l'aveugle — [OK] le rig H6 gagne
- Agent neuf, étiquettes tirées au sort (clé hors de sa portée), images de course seules (profil, face, dos ×4), auto-critique écrite avant
  le verdict : **H6 7 / 10, H5 5,5 / 10**, H6 meilleur en lecture de course de profil (vraies images de vol, rebond de la tête de 2-3 texels à
  l'atterrissage), de face (levée de 5 texels : « a light jog-in-place » contre « a high-knee march in place » pour 9), de dos (la botte de H5
  disparaît sous l'ourlet de la cape aux images 1 et 5, celle de H6 garde au moins 4 rangées) et en propreté ; H5 garde l'avantage de la
  fluidité (pas de 9 texels plus fin).
- Ses mesures, **vérifiées contre le rig** : contact 14,5 / 28,5 / 42,5 (+14 par image), images 3 et 7 sans texel sur les rangées 89-90, levées
  de face 0,0,0,2,4,5,3,1 contre 0,0,0,3,7,9,5,1 : exactement les valeurs du script.
- Relevés communs aux deux, non traités : pas de balancement des bras de face / dos (corps rigide), un texel noir en éperon au talon arrière
  (profil, images 6-7), un genou en boule grise ; botte levée de face = copie rigide (ni semelle ni talon).
- [?] Contrepartie notée par le critique : entre deux images, le pied d'appui avance avec le sprite puis recule de 14 texels (9 avant) :
  ≈ 25 px en B au lieu de 16 ; seules plus d'images intermédiaires (16 au lieu de 8) le réduiraient. À juger en jeu par l'opérateur.

### Vues de trois-quarts — [OK] étude ; décision à l'opérateur
- `art-lab/characters/briefs/three-quarter-views.md` : mesure, planche, coût du code et de l'art, autres voies, recommandation, questions.
- **Mesure** (`tools/step-angles.mjs`, nouveau : harnais de `foot-slip`, 40 s, tous les PNJ qui marchent) : avec cinq secteurs, le
  **trois-quarts dos** prendrait 44 à 54 % des pas en A / B / C à la graine 1842 (8 % à 7719), le trois-quarts face 5 à 32 %, le profil 36 à 61 % ;
  D garde 93 % de profils. Raison : le quai court le long de x et A / B / C regardent en amont du canal : remonter le quai, c'est s'éloigner en
  diagonale. Règle actuelle à trois vues : 7 à 67 % des pas à 20-40° de l'axe de la vue montrée.
- **Planche du héros** (boîtes des huit vues mesurées) : la 2e est un trois-quarts face ; **les 4e et 5e sont deux dos presque identiques,
  aucun trois-quarts dos n'est dessiné** (le brief en comptait deux) ; 6e et 7e : côté droit, presque de profil ; course et marche de profil
  seulement. Vues reconstruites au pas du héros : `reviews/hero-x2-v2/08-turnaround-eight-views-x3.png`.
- **Coût du code** : `Dir` à 5 valeurs, règle à 5 secteurs avec hystérésis et **repli par feuille** (sans images de trois-quarts, la règle
  actuelle : aucun PNJ ne change), `walkSlide` / `walkClock` par vue, étiquettes, contrôles ; aucun appel de dessin ni shader ; texture :
  10 PNJ + héros en 5 vues = 582 images, sous les 672 garanties depuis T1. **Coût de l'art** : trois-quarts face du héros depuis la vue 2
  (course montée comme celle de face) ; trois-quarts dos : une nouvelle source (génération par l'opérateur).
- Recommandation : (a) règle à 5 secteurs avec repli, derrière un paramètre DEV, prouvée à 0 px ; (b) le héros en cinq vues, trois-quarts dos
  demandé à la source ; (c) les PNJ ensuite, trois-quarts dos d'abord. Autres voies chiffrables sans art : règle à trois vues biaisée vers le
  dos, cibles des promeneurs plus alignées sur l'écran.

### Restes [?]
- Reconstruction Aseprite de `hero-x2-v2` (export, `.aseprite`, paquet) puis `--check`, `verify-provenance`, glissement refait sur le vrai
  export, revue de l'opérateur en jeu (`?cast=candidate`) : rien n'est approuvé.
- Décision de l'opérateur sur les vues de trois-quarts (questions du § 6 de l'étude).

### Pensée
- Une vitesse de jeu qui suit le dessin (la mesure du moteur sur le cycle) ne peut pas faire patiner : changer l'enjambée dessinée change la
  vitesse, et l'export d'avant reste juste à sa propre vitesse.
- Un « glissement » médian de quelques pour cent se vérifie contre la quantification (pas de simulation par image) avant d'être corrigé.
- Une planche « tournante » se mesure vue par vue : deux dos ne font pas un trois-quarts dos.

## Passe K1 — Caméras : transitions ancrées partout, préparées derrière `?camblend=anchored` (décision de l'opérateur) (2026-10-19)

### Demande
- Objectif 2 du brief : « Architecture et caméras : optimisations mesurées : coût GPU, preuves de visibilité, cadrages. Tout changement de
  cadrage approuvé passe par l'accord de l'opérateur ; montre-lui avant / après. » Consigne d'autonomie (Passe T1) : un changement des
  cadrages approuvés se prépare derrière un paramètre d'URL, sans changer le jeu par défaut.
- Point ouvert d'« À reprendre » § 4 (d) : les transitions B → A et C → B (vers l'ouest) font glisser le joueur à l'envers à l'écran
  (mesuré en Passe 4B, jamais corrigé). Branche `claude/stoic-goodall-8ieke4` recréée depuis `main` (`b7bdec2`).
- Pas de GPU dans cette séance : **aucune mesure de coût GPU** (les temps SwiftShader ne disent rien de la 780M) ; les preuves sont
  `camsim`, des tests, des captures et `visproof` en rendu logiciel.

### Mesure avant — [OK] (`tools/camsim.mjs`, `CHROME_ARGS` / `READY_MS` ajoutés ; graine 1842, `vis=0`, joueur généré à 2,5 m/s)
- B → A (de x −5 à −12,5) : **14 images de recul, au pire −139 px/s** (Passe 4B : −131) ; A → B : 5 images, −25 px/s ; B → C, C → B : 0 ; C → D :
  6 images de transition à −38 px/s et 10 images posées à −39 px/s ; D → C : 6 images de transition et 25 posées, −15 px/s.
- Calcul image par image (nouveau test) : pendant B → A, le joueur file d'abord vers la gauche (jusqu'à −197 px/s), puis repart **à
  contresens jusqu'à +181 px/s** : la rotation de −57,5° à −78° l'emporte sur sa marche.

### Préparé — `?camblend=anchored` (DEV et production ; absent = les transitions approuvées)
- `CameraGraph.anchorAll` : toutes les transitions passent par `blendPose` ancré (le joueur glisse de sa place à l'écran dans le cadrage de
  départ à sa place dans le cadrage d'arrivée, comme les transitions vers D depuis la Passe 4B) ; leurs durées ne changent pas (1,2 s au plus
  hors D). Le bake échantillonne alors les transitions A ↔ B et B ↔ C ancrées, aux six poids des transitions vers D : 329 poses au lieu de 273
  (+56, ≈ +20 % sur un bake neuf, la clé du cache les distingue). `?blend=` suit le paramètre. Les cadrages A / B / C / D eux-mêmes ne
  changent pas.
- **Mon choix** de laisser C ↔ D tel quel : déjà ancré ; ses reculs restants surviennent en grande partie hors transition (cadrage posé : le
  pivot qui rattrape le joueur), un autre sujet.

### Mesure après — [OK]
- `camsim` avec `camblend=anchored` : B → A **0 image de recul** (au lieu de 14) ; A → B 0 (au lieu de 5) ; B ↔ C 0 ; C ↔ D inchangés.
- Calcul image par image : pic à contresens de B → A **+21 px/s** (au lieu de +181) ; ce reste vient de l'écart de place du joueur entre B
  (NDC x ≈ −0,37) et A (≈ −0,17) : l'effacer demanderait de recaler le pivot de A (un changement de cadrage, à l'opérateur).
- Captures (SwiftShader, 960 × 540, graine 1842, le joueur à sa place réelle pendant la transition) :
  `screenshots/calibration/k1-camblend/BA-approved-vs-anchored.png` (six instants, approuvé en haut, ancré en bas) et
  `BA-mid-approved-vs-anchored.png` (0,2 / 0,4 / 0,6, plus grand) : ancré, le joueur reste en bas à gauche pendant la transition.

### Preuves
- Défaut inchangé : les 273 poses du bake sont **identiques à l'octet** à celles de `main` figé (`b3ac07f`) ; le code des transitions ne
  diffère que si `anchorAll` est vrai.
- `tests/camera-graph.test.mjs` +3 : le défaut approuvé reproduit le recul de B → A (pic > 150 px/s, ≥ 20 images) ; ancré, pic < 30 px/s et
  aucun recul en A → B ; poses du bake : A / B / C / D / CD / BD identiques, AB / BC plus nombreuses avec le paramètre, et des interpolations
  simples sans lui. **Fautes injectées une à une, toutes attrapées** (1 échec chacune) : paramètre sans effet sur les transitions, poids du
  bake inchangés, poses AB / BC ancrées par défaut, toutes les transitions ancrées par défaut.
- Visibilité (`tools/visproof.mjs`, nouveau : `CHROME_ARGS`, `READY_MS`, `SETTLE_MS`, les transitions ancrées suivent `anchorAll` ; SwiftShader,
  1280 × 720, `occ=0`, élagué contre `vis=0` dans la même session, `camblend=anchored`) : AB −9,4 à w 0,5 ; AB −11 / 2,5 à 0,7 ; BC 4,2 à 0,5 ;
  BC 8,5 / 2,4 à 0,4 ; B posé : **0 px** ; AB −7,5 / −1 à 0,33 : **5 px** au bord droit (colonnes 1270-1279, max 21). `tools/vis-why.mjs` (même
  ajout) : 3 pièces manquées, toutes Tier 3, 1 px chacune (deux arbres au bord du cadre, un mur de la guilde), « tile 0, tile8x 0 » = plus fines
  qu'un pixel du bake même ×8 ; une fois forcées, **3 px restent**, sans pixel d'ordre : la classe de résidu connue (un seul échantillon MSAA
  à travers une fissure, Passe 5b), au bord du cadre, entre deux poses échantillonnées (w 0,33 → poids lissé 0,26, entre 0,06 et 0,32).
  Tier 3 : 299 pièces sur 738 avec le paramètre (303 sans) : le bake garde 4 pièces de plus pour les poses ancrées.

### Décision à demander à l'opérateur
- Adopter les transitions ancrées partout (`?camblend=anchored` devient le défaut) ? **Recommandation : oui** (plus de recul du joueur en
  A ↔ B, aucun cadrage changé, coût : +56 poses au bake neuf). En option, recaler le pivot de A pour effacer le reste (+21 px/s) : à chercher
  avec `camsearch` et montrer.

### Pensée
- Une transition entre deux cadrages hérite de l'écart de place du joueur à l'écran entre eux : l'ancrage supprime la rotation qui l'emporte,
  pas cet écart ; une mesure image par image (signe de la vitesse à l'écran) sépare les deux.

## Passe W1 — Météo : pluie, neige, orage, vent, chacun derrière son paramètre d'URL (2026-10-19)

### Demande
- Objectif 3 du brief, mot pour mot : « Météo : pluie, neige, orage, vent. Génère-la par le code, avec un paramètre d'URL pour chaque effet ;
  le jeu par défaut reste identique tant que l'opérateur n'a pas choisi. Respecte les règles de rendu d'AGENTS.md : pas de `discard` hors de
  l'occlusion, alpha de la scène = masque du flou de profondeur, `maskSafeBlending` pour tout ce qui est dessiné après la passe opaque,
  reflets. Mesure les performances. » Branche `claude/stoic-goodall-8ieke4` recréée depuis `main` (`3fe2bfe`).

### Fait — [OK] (`src/atmosphere/Weather.ts`, `?rain` / `?snow` / `?storm` / `?wind`)
- **Sans paramètre, rien n'est créé** : aucun objet, aucun uniforme écrit, aucun tirage de `Math.random` (l'uuid d'un objet THREE en tire un ;
  sous graine, toute la suite se décalerait, Passe V1).
- **Pluie** (`rain=<0..1>`) : jusqu'à 9 000 traînées dans une boîte de 44 × 14 × 44 m qui suit le joueur (repliée dans le monde : le champ ne
  glisse pas quand la caméra bouge), un quad par goutte animé dans le shader de sommets depuis l'horloge de la scène (aucun travail par goutte
  sur le CPU), au moins un pixel de large (plus fin : l'alpha prend la couverture), éclairées par les lanternes comme les poussières (ambre
  seulement là où la lumière les atteint), éteintes par la brume, rien à moins de 2,5 m de l'objectif ; pavés plus mouillés (`uWet` 1 → 1,3),
  **anneaux de pluie** dans les flaques et sur le canal (nouvelles branches `uRain > 0` des shaders du sol et de l'eau), un peu plus de brume.
- **Neige** (`snow=<0..1>`) : jusqu'à 5 000 flocons qui dérivent (balancement propre à chacun, vent), une **couverture** ivoire froid, en
  plaques, sur les pavés (plus mince dans les joints ; les flaques disparaissent) et sur les faces tournées vers le haut (toits, appuis,
  corniches : branche `uSnow > 0` du shader des surfaces, sur la normale géométrique) ; plus de brume.
- **Orage** (`storm=<0..1>`) : éclairs graines (`Rng(4242)`, horloge de la scène), un toutes les 5 à 14 s, 2-3 pulsations : la lumière de lune,
  l'ambiance et la brume (le même ton que les nuages du ciel) montent un instant vers un indigo pâle, puis reviennent exactement ; un
  uniforme écrit entre-temps (curseur du panneau) est gardé. Ciel couvert (`uCloud` : une couche lente qui cache la lune et les étoiles). Amène
  la pluie (0,85 × orage) et le vent (1 + orage) sauf s'ils sont donnés. Horloge figée (`?freeze`) : aucun éclair ; `weather.strike()` en
  montre un (captures).
- **Vent** (`wind=<0..3>`) : multiplie le balancement des tissus et des feuilles (`uWindAmp`, 1 = comme avant), la dérive des fumées et
  l'inclinaison de la pluie et de la neige.
- **[KO → corrigé]** première version : la pluie dessinée (108 appels au lieu de 107) mais invisible, même agrandie ×10 ; cause : une traînée
  qui tombe a sa queue au-dessus de la goutte, son quad tourne dans le sens horaire à l'écran, et le matériau à une face l'éliminait (les
  flocons, carrés dans l'autre sens, passaient). Matériau double face.
- **[KO → corrigé]** réglages de la première version : pluie invisible dans la bande de mise au point (gouttes de 0,5 px à 26 m, le flou de
  profondeur efface les proches), puis une averse trop blanche ; neige au sol trop blanche sous les lanternes (albédo 0,58 sur des pavés
  ≈ 0,25) → 0,36, en plaques ; éclair trop brumeux.
- Règles de rendu : passe principale seulement (`LAYER_NOREFLECT` : ni reflet ni ombre), après la passe opaque, test de profondeur sans
  écriture, `maskSafeBlending` (l'alpha de la scène, masque de protection du flou de profondeur, est gardé), **aucun `discard`** (l'alpha
  fait la couverture). `stats.weather` : paramètres, niveau d'éclair, gouttes dessinées.

### Mesures — [OK] compteurs ; [?] temps GPU à mesurer sur la 780M
- `stats` en 1920 × 1080, caméra B (A et D pour la pluie), SwiftShader : appels de dessin **107 → 108** (une précipitation = un appel) ;
  triangles 282 698 → 300 698 (pluie : 9 000 quads), 292 698 (neige : 5 000), 297 998 (orage : 7 650 gouttes). Surface couverte à l'écran,
  calculée avec les formules du shader : pluie 184 397 px en B, 188 227 en D, 219 245 en A (9 à 11 % des 2,07 M pixels, en traînées d'un
  pixel), orage 148 796, neige 59 245. Le shader de fragment n'éclaire rien (l'éclairage est fait aux sommets).
- **Pas de temps GPU ici** (pas de GPU) : estimation d'ordre de grandeur pour la 780M (passe de scène limitée par la bande passante de la
  cible HDR ×4, Passe 6) : ≈ 0,2 M fragments mélangés × 4 échantillons × 8 octets × lecture + écriture ≈ 13 Mo par image, ≈ 0,1-0,3 ms à
  mesurer. Les branches `uRain` / `uSnow` / `uCloud` à 0 : un test d'uniforme par fragment.
- À relancer sur la machine de l'opérateur : `node tools/perf.mjs --rounds=3 "clair|seed=1842&camera=B" "pluie|seed=1842&camera=B&rain=1"
  "neige|seed=1842&camera=B&snow=1" "orage|seed=1842&camera=B&storm=1"` (et en D, et à 2560 × 1440).

### Preuves
- Jeu par défaut (sans paramètre météo, les shaders modifiés compris) contre `main` figé (`3fe2bfe`), captures déterministes (graine 1842,
  `clean=1&freeze=7.3&vis=0`, 120 pas, 1280 × 720, SwiftShader), A / B / C / D : **0 px** ; témoin de répétition 0 px ; contrôle : pluie contre
  défaut, 64 à 90 % des pixels changés (pluie, pavés plus mouillés, brume, ciel couvert).
- Planches : `screenshots/calibration/w1-weather/{A,B,D}-clear-rain-snow-stormflash.png` (clair, pluie, neige, orage pendant un éclair) ;
  `B-rain-1280.png` à 1:1. Avec un paramètre météo, les PNJ d'une capture à graine ne sont plus au même endroit (les
  objets THREE de la météo tirent `Math.random` pour leur uuid) : sans conséquence hors du harnais.
- `tests/weather.test.mjs` (4) : lecture des paramètres (absents = rien, nu = 1, bornes, ce que l'orage apporte, valeur illisible) ; uniformes
  écrits et maillages instanciés ; éclairs graines (deux exécutions identiques), 3 à 12 en 40 s, retour exact de la lumière après l'éclair,
  valeur écrite pendant l'éclair gardée ; horloge figée sans éclair, `strike()`. **Fautes injectées une à une, toutes attrapées** (1 échec
  chacune) : météo créée sans paramètre, orage sans pluie, valeur écrite écrasée, lumière jamais restaurée, éclairs non graines, éclair au
  premier pas d'une horloge figée.

### Décision à demander à l'opérateur
- Faut-il une météo par défaut (et laquelle), ou un cycle (par exemple pluie fine aléatoire) ? Recommandation : garder le défaut sans météo
  (la nuit claire approuvée) et proposer `rain=0.5` comme variante d'ambiance à juger en jeu, après la mesure du coût GPU sur la 780M.

### Pensée
- Un quad construit dans le shader (une traînée orientée par sa vitesse à l'écran) n'a pas d'orientation fixe : double face, ou il disparaît
  dès que sa direction s'inverse ; un « rien à l'écran » se vérifie d'abord par le compteur d'appels de dessin, puis par un agrandissement.
- Un effet transparent se règle dans la bande de mise au point : ce que le flou de profondeur efface près de la caméra ne compte pas.

## Passe Q2 — Tests : les fonctions pures restées sans test depuis la Passe Q1 (2026-10-19)

### Demande
- Consigne d'autonomie (Passe T1) : « Si tu finis avant l'heure, continue sur « À reprendre » dans le périmètre du Merchant District. » ;
  « À reprendre » § 7, « Tests et CI — restes (Passe Q1) » : le rejet « images requises manquantes » de `loadProductionCast` non testé (il
  fallait lui passer une liste), `parseFrameCap`, `lerpState`, `needMask`, `bakeKey` sans test. Branche `claude/stoic-goodall-8ieke4` recréée
  depuis `main` (`dbff468`).

### Fait — [OK]
- `tests/frame-cap.test.mjs` (3) : toutes les formes de `?fps=` (off, max, n, v<k>, e<n>, a<n>), 15 formes refusées, `frameCapLabel` relit ce
  que `parseFrameCap` lit.
- `tests/visibility-mask.test.mjs` (4) : ordre des jeux (A B C D AB BC CD BD, écrit en dur), `needMask` (jeux qui montrent une pièce, Tier 3,
  géométrie non suivie partout, pixels de la passe derrière un occluder), `cfgMask` (cadrages et transitions à l'écran, transition
  interrompue, pas de jeu AC).
- `tests/bake-key.test.mjs` (3) : `bakeKey` avec un faux contexte GL (aucun navigateur) : même entrée = même clé (16 chiffres hex) ; le nom
  d'un maillage n'y entre pas ; **17 entrées changent chacune la clé, sans collision entre elles** (chaîne du GPU, quatre limites, nombre de
  pièces, cadre, niveau de l'eau, options, un champ de pose à 1e-12 près, le jeu d'une pose, le joueur d'une pose, l'ordre des poses, un
  maillage déplacé de 1 mm, un sommet de 1e-6, un maillage caché, la face d'un matériau) ; la passe derrière les occluders (sa scène, ses
  fenêtres).
- `tests/baked-cast.test.mjs` +1 : `loadProductionCast` prend une liste d'entrées (4e paramètre, la distribution par défaut : rien ne change au
  jeu) ; la feuille du docker telle quelle se charge ; sans son étiquette `walk-up` (PNG inchangé, empreinte juste) : refus « missing frames
  up/walk » ; une archétype qui demande `side/hammer` : refus.
- `tests/camera-graph.test.mjs` +1 : `lerpState` (bouts exacts, champs linéaires, le lacet par le plus court à travers ±π, dans les deux sens).
- **Fautes injectées une à une, toutes attrapées** : `v<k>` à plusieurs chiffres, passe derrière ignorée, transitions hors du masque, niveau
  de l'eau / joueur de la pose / face du matériau hors de la clé, images manquantes acceptées, lacet sans retour par +π, par −π. **[KO →
  corrigé]** la première version du test de `lerpState` ne passait que par −π : retirer la boucle `dy > π` ne la faisait pas échouer.
- **[KO → corrigé]** un second `load()` du même module en fin de fichier de test faisait échouer le fichier après ses tests (« invoke was
  called before connect », activité asynchrone du chargeur de Vite) : un seul chargement par module et par fichier.
- `npm test` 50 → 62 ; aucun code de jeu changé hors du paramètre ajouté (défaut = la liste de production).

### Pensée
- Un test de repli (±π, deux branches) s'écrit dans les deux sens : une faute injectée par branche le montre.
- Une clé de cache se teste par ce qui doit la changer, chacune de ses entrées, et par ce qui ne doit pas (un nom).

## Passe C1 — Foule : les cinq citadins préparés derrière `?crowd=<n>` (décision de mise en scène de l'opérateur) (2026-10-19)

### Demande
- « À reprendre » § 1, Mise en scène : « seuls 2 des 5 citadins (artisane, voyageur) paraissent à la graine 1842 et à la densité 1
  (`round(2 × densité)` promeneurs ; « remplacer seulement ») ». Consigne d'autonomie (Passe T1) : une décision de l'opérateur se prépare
  derrière un paramètre d'URL, sans changer le jeu par défaut. Branche `claude/stoic-goodall-8ieke4` recréée depuis `main` (`d7c6a62`).

### Fait — [OK]
- `ActorSystem.crowdCount` (`?crowd=<n>`, 0 à 12) : n promeneurs, les cinq citadins à tour de rôle (tous les cinq dès n = 5). Le tirage du
  type est fait dans tous les cas (`rng.pick`), puis ignoré avec le paramètre : les promeneurs communs aux deux restent où ils étaient, et
  avec n = 2 tout ce qui suit (le docker) aussi. Sans le paramètre : `round(2 × densité)` promeneurs tirés au sort, comme approuvé.
- `tests/crowd.test.mjs` (3) : effectifs approuvés (densité 1, 2, 0,2) et types tirés (valeurs de régression dans un district d'essai) ;
  `crowd=5` = les cinq types une fois ; mêmes positions que le défaut pour les promeneurs communs (graines 1842, 7719, 30417) et docker à la même
  place avec n = 2. **Fautes injectées, toutes attrapées** : tirage sauté avec le paramètre, paramètre ignoré, tourniquet aussi par défaut.
- Jeu par défaut contre `main` figé (`3fe2bfe` : son rendu par défaut est celui de `d7c6a62`, Passes W1 / Q2), captures déterministes avec
  personnages (graine 1842, `clean=1&freeze=7.3&vis=0`, **300 pas** : les promeneurs ont marché, 1280 × 720, SwiftShader), A / B / C / D :
  **0 px**. Planche `screenshots/calibration/c1-crowd/BD-default-vs-crowd5.png` (B puis D ; défaut à gauche, `crowd=5` à droite, même pas).

### Décision à demander à l'opérateur
- Combien de promeneurs par défaut, et faut-il les cinq citadins ? Recommandation : `crowd=5` (chaque citadin approuvé paraît une fois ; +3
  sprites, aucun appel de dessin de plus), à juger en jeu en B / D.

## Passe W2 — Météo changeable en cours de partie (panneau DEV), pour la revue de l'opérateur (2026-10-19)

### Pourquoi
- La météo de la Passe W1 ne se juge bien qu'en jeu et en mouvement (pluie qui tombe, vent, éclairs), sur la machine de l'opérateur ; sans
  moyen de la changer en jouant, chaque essai demande de recharger (bake compris). **Mon choix** : des curseurs dans le panneau, DEV seulement.
  Branche `claude/stoic-goodall-8ieke4` recréée depuis `main` (`c00ff7b`).

### Fait — [OK]
- `Weather.dispose()` rend les uniformes qu'il avait posés (mouillé, pluie, neige, ciel couvert, vent, brume, densité du brouillard : leurs
  valeurs d'avant lui) et la lumière d'un éclair en cours ; `App.setWeather(p)` retire l'ancienne météo et crée la nouvelle (aucune pour un
  temps calme) ; le démarrage passe par lui (sans paramètre : rien, comme avant).
- Panneau (touche H), section « Weather (proposal, DEV) », fermée, **DEV seulement** (absente du build de production) : pluie, neige, orage,
  vent, bouton « Lightning now » (0 occurrence de son titre dans le bundle de production, vérifié).
- `tests/weather.test.mjs` +1 : après une météo complète et un éclair en cours, `dispose` rend chaque uniforme à l'identique ; deux météos à la
  suite aussi. **Fautes injectées, attrapées** : `dispose` sans restauration, éclair en cours non rendu.
- Preuve en image (SwiftShader, B, graine 1842, même pas) : défaut, puis orage + pluie + neige + vent posés en cours de partie (98 % des pixels
  changent), puis retirés : **0 px** contre l'image d'avant. Jeu par défaut : le chemin de démarrage sans paramètre ne crée rien (Passe W1).

### Pensée
- Un effet réglable en cours de partie rend ce qu'il a pris : il garde les valeurs d'avant lui, et sa preuve est « activé puis retiré = 0 px ».

## Passe K2 — Caméras : le recul du joueur en cadrage D posé expliqué (analyse, aucun code) (2026-10-19)

### Constat (Passe K1, `camsim`, graine 1842)
- C → D : 10 images posées en D à −39 px/s ; D → C : 25 images posées à −15 px/s (le joueur recule à l'écran alors qu'il marche).

### Cause — [OK] mesurée image par image (journal `camsim` enregistré)
- Le joueur garde sa touche depuis C : elle reste dans le repère de C (règle voulue, `AGENTS.md`), donc en D il marche **en diagonale**
  (v = 2,17 / −1,25 m/s). Le pivot de D suit son x avec un gain de 0,85 (z presque bloqué) : 0,85 × 2,17 = 1,84 m/s le long de x, soit
  **1,73 m/s le long de la droite de la caméra** (lacet −20°), contre **1,61 m/s** pour le joueur, que sa composante en z ralentit à l'écran :
  il recule de 39 px/s. Même mécanisme dans l'autre sens (−15 px/s).
- En D, la touche pressée sous D (le joueur marche selon l'écran) : **0 image de recul** à tous les gains.

### Essais (`?camD=,,,,,,,,<gainX>`, paramètre de réglage existant ; aucun code changé)
| gain x de D | C → D (recul) | D → C (recul) | D vers l'est, NDC x du joueur |
|---|---|---|---|
| 0,85 (approuvé) | 16 images, −39 px/s | 31 images, −15 px/s | 0,33 .. 0,59 |
| 0,75 | 14, −24 | 0 | 0,34 .. 0,64 |
| 0,7 | 12, −17 | 0 | 0,34 .. 0,66 |
| 0,6 | **0** | **0** | 0,35 .. **0,71** |

- Contrepartie : un gain plus bas laisse le joueur filer plus à droite en D, déjà le point ouvert (a) d'« À reprendre » § 4.

### Décision à demander à l'opérateur (cadrage approuvé)
- Garder D tel quel (recul de 15-39 px/s seulement en marche diagonale venue de C), baisser son gain (0,6 : plus de recul, joueur plus à
  droite), ou suivre le joueur **le long de la droite de la caméra** plutôt qu'en x (un suivi « à l'écran » : jamais plus vite que lui
  à l'écran ; à prototyper derrière un paramètre et à prouver par `camsim` et le bake). Recommandation : prototyper le suivi à l'écran.

### Pensée
- Un recul à l'écran en cadrage posé vient de ce que le pivot suit (ici x, avec un gain) comparé à ce que le joueur montre à l'écran (sa
  vitesse le long de la droite de la caméra) : une marche en diagonale suffit à les inverser.

## Passe K3 — Caméras : recul en D posé, cause précisée ; [KO] le suivi le long des axes de la caméra (2026-10-19)

### Essai — [KO] (prototype retiré, rien de commité)
- La Passe K2 recommandait un suivi « à l'écran » : le pivot de D suit le joueur le long de la droite de la caméra et de l'axe de profondeur au
  sol, avec les mêmes gains et bornes, au lieu de x / z. Prototype derrière `?camfollow=screen`, `camsim` (graine 1842) : C → D **16 images de
  recul, −42 px/s** (au lieu de −39), D → C 38 images, −20 px/s (au lieu de −15) ; D vers l'est / l'ouest : 0, comme avant. Le recul reste :
  prototype retiré (`git checkout`).

### Cause, image par image — [OK] (reconstruction exacte : NDC recalculée = NDC de `camsim`, écart max 0,0000)
- Vitesse à l'écran décomposée : (joueur qui bouge, caméra figée) + (caméra qui bouge, joueur figé). C → D en D posé : **joueur +94 px/s,
  caméra −133 px/s, total −39** (mesuré −39). D → C : joueur −128 px/s, caméra +140, total +12 à +15.
- Le joueur, à NDC 0,42 (à droite du centre), marche aussi **en profondeur** (1,9 m/s en s'éloignant) : la perspective le ramène vers le
  centre et lui retire ≈ 39 px/s ; le pivot, qui suit 85 % de son déplacement latéral sans cette perte, le dépasse. Ce n'est pas l'axe du
  suivi (x / z ou celui de la caméra) qui compte, mais un gain assez bas pour couvrir la perte due à la profondeur : 0,6 le fait (Passe K2).
- Correction de la Passe K2 : sa cause (« le pivot suit x à 0,85 ») était incomplète ; c'est la combinaison gain × marche en profondeur à
  droite du centre.

### Décision à demander à l'opérateur (inchangée)
- Garder D, baisser son gain à 0,6 (`?camD=,,,,,,,,0.6` pour l'essayer : plus de recul, joueur plus à droite), ou un suivi qui vise la
  vitesse du joueur à l'écran (comme l'ancrage des transitions : plus de travail, à prouver par `camsim` et le bake).

### Pensée
- Avant de prototyper un correctif, décomposer la grandeur mesurée en ses causes (ici : part du joueur, part de la caméra) et vérifier la
  décomposition contre la mesure : une hypothèse plausible (l'axe du suivi) a coûté un essai inutile.

## Passe W3 — Orage : un éclair dessiné dans le ciel pendant les flashs (2026-10-19)

### Pourquoi
- Mon choix, pour que `?storm` se lise comme un orage et pas seulement comme un ciel qui s'éclaire : un éclair visible là où le ciel l'est
  (A surtout). Branche `claude/stoic-goodall-8ieke4` recréée depuis `main` (`3383ef3`).

### Fait — [OK]
- Shader du ciel : pendant un flash (`uBolt.w > 0`, sinon la branche est sautée), un trait brisé de la couche nuageuse (élévation 0,32 rad)
  jusque derrière la ville (0,02 rad), deux échelles de bruit pour le tracé, une fourche depuis mi-hauteur, une lueur douce ; ≈ 2,5 px de cœur
  en 1080p, blanc froid (le bloom l'adoucit). Placé à chaque flash dans le ciel que la caméra regarde (cap de la caméra ± 0,3 rad), forme tirée
  du même générateur graine que les flashs ; visible tant que le flash dépasse 0,2.
- `tests/weather.test.mjs` +1 : pas d'éclair sans flash ; pendant un flash, dans le ciel que la caméra regarde ; éteint après le flash, quand
  un flash est coupé (horloge qui recule) et après `dispose` ; dix éclairs sous deux caps de caméra. **Fautes injectées, attrapées** : éclair
  jamais éteint, éclair hors du ciel visible, `dispose` qui le laisse. **[KO → corrigé]** les deux premières passaient d'abord : le flash
  s'éteignait de lui-même avant la fin (le test ne coupait jamais un flash), et un seul tirage d'azimut tombait par chance dans le secteur.
- Jeu par défaut contre `main` figé (`3fe2bfe`, même rendu par défaut que `3383ef3`), A / B / C / D : **0 px**.
- Capture : `screenshots/calibration/w1-weather/A-storm-bolt-1280.png` (A, `storm=1`, éclair forcé) ; en B / D le ciel visible est trop
  étroit : seul le flash de lumière se voit.

## Passe B1 — Bilan de la séance cloud du 19/10 : fusionné, mesures, à vérifier, décisions, reste à faire (2026-10-19)

### Cadre
- Séance cloud de 4-5 h, sans GPU (rendu logiciel SwiftShader), sans Aseprite, sans clé OpenAI ; opérateur absent : pleine autonomie
  (consigne citée en Passe T1) ; les décisions de l'opérateur sont préparées derrière des paramètres d'URL, jamais prises.
- Journal : passes H1, M7, H2, H3 et H4 (closes) archivées d'un bloc dans `journal/09-passes-H1-H4.md` (25 767 octets, SHA-256
  `463d8b0fc4645c42…`) ; preuve **8 / 8** (script de la Passe T1 adapté, contre `git show f877e21:JOURNAL.md`, fait avant d'ajouter cette entrée et les mises à jour d'« À
  reprendre » et des « Principes à garder »),
  contrôle négatif 7 / 8. H5 reste ici (sa décision est ouverte).

### Fusionné dans `main` (une tâche = une branche, avance rapide, CI verte sur chaque push)
| Passe | Commit | Contenu |
|---|---|---|
| T1 | `1b56448` | texture cuite en colonnes : 672 images garanties (production : mêmes octets) ; archivage V0-V3 |
| H6 | `b7bdec2` | vitesse du héros cuit tirée de son cycle ; rig du héros préparé (14 texels, vol, genoux à 5) ; étude des vues de trois-quarts |
| K1 | `3fe2bfe` | transitions ancrées partout derrière `?camblend=anchored` |
| W1 | `dbff468` | météo : `?rain`, `?snow`, `?storm`, `?wind` |
| Q2 | `d7c6a62` | tests des fonctions pures (fréquence d'images, masques, clé du bake, `lerpState`, images manquantes) |
| C1 | `c00ff7b` | foule : `?crowd=<n>` (les cinq citadins) |
| W2 | `e622f89` | météo changeable en jouant (panneau DEV) |
| K2, K3 | `335c0ce`, `3383ef3` | recul du joueur en D posé : analysé, un prototype écarté |
| W3 | `f877e21` | éclair dessiné dans le ciel |
| B1 | (ce commit) | ce bilan, archivage H1-H4, mesure de la passe « derrière » |

- **Jeu par défaut inchangé** à chaque passe : captures déterministes contre `main` figé, A / B / C / D, **0 px** (T1, W1, C1, W2, W3) ;
  poses du bake identiques à l'octet (K1). `npm test` : 39 → 67 tests ; chaque nouveau test a attrapé ses fautes injectées.

### Mesures clés (logiciel : compteurs et images seulement, aucun temps GPU)
- Héros (rig préparé) : `walkSlide` 14 → 3,73 m/s, Maj 4,48 m/s ; glissement en mouvement ≈ 0 (les ±0,07-0,11 sont la quantification) ;
  critique à l'aveugle 7 / 10 contre 5,5 / 10 pour la course de H5.
- Vues : avec cinq secteurs, le trois-quarts dos prendrait 44-54 % des pas des PNJ en A / B / C (graine 1842) ; la planche du héros n'en
  dessine aucun.
- Caméras : B → A 14 images de recul (−139 px/s) → 0 avec `camblend=anchored` ; recul en D posé (−39 px/s) : panoramique −133 px/s contre
  marche +94 px/s ; gain 0,6 l'efface.
- Météo (1080p) : +1 appel de dessin par précipitation (107 → 108), +18 000 triangles (pluie), traînées sur 9-11 % de l'écran ; estimation
  0,1-0,3 ms sur la 780M, **à mesurer**.
- Passe « derrière les occluders » du bake (« À reprendre » § 2, mesure de cette passe) : graines 1842, 7719 et 30417, en 1280 × 720 et
  1920 × 1080, bake neuf sur `main` figé : **0 pièce et 0 triangle restaurés dans les six cas** (≈ 2,3 M pixels vus par elle, tous de
  pièces que les poses normales gardent déjà ; la taille de la fenêtre ne change rien, les tuiles du bake ont une taille fixe). Son coût,
  ≈ 90 ms par bake neuf, vient de la Passe 6 (780M) ; le cache la rend gratuite ensuite.

### À vérifier sur la machine de l'opérateur (GPU, Aseprite)
1. **Héros** : `node tools/art-lab/build-character.mjs art-lab/characters/rigs/hero-x2-v2.rig.mjs`, puis la même commande avec `--check`,
   `node tools/art-lab/verify-provenance.mjs art-lab/characters/provenance/hero-x2-v2`, `npm test` ; glissement : `node tools/foot-slip.mjs
   --secs=4 --keys=d "B|seed=1842&clean=1&cast=candidate&intro=0&camera=B&player=-6,0.6"` (et A / C / D, `--keys=d,shift`) ; course en
   mouvement : `KEYS=d node tools/flipbook.mjs out.html hero 0 100 2 360x300 2 "héros|http://127.0.0.1:5173/?seed=1842&clean=1&cast=candidate&intro=0&camera=B&player=-6,0.6"`.
2. **Performances** : `node tools/perf.mjs --rounds=3 "clair|seed=1842&camera=B" "pluie|seed=1842&camera=B&rain=1" "neige|seed=1842&camera=B&snow=1"
   "orage|seed=1842&camera=B&storm=1"`, puis en D et à 2560 × 1440 ; `tools/cadence.mjs` sous la pluie ; budget de la passe 6 (10-12 ms en
   1080p) à tenir.
3. **Visibilité sur GPU** avec `camblend=anchored` : `node tools/viewport-proof.mjs --q=camblend=anchored` (serveur DEV) et `tools/visproof.mjs`
   aux poses AB / BC ancrées en 1080p.
4. **En jeu** : panneau (H) → « Weather (proposal, DEV) » (pluie, neige, orage, vent, éclair) ; `?camblend=anchored` en marchant de B vers A ;
   `?crowd=5` ; `?camD=,,,,,,,,0.6` en marchant de C vers D.

### Décisions à demander à l'opérateur (recommandation entre parenthèses)
1. Héros `hero-x2-v2`, après reconstruction : production ou retouches (juger en jeu la course à 3,73 m/s ; contrepartie : le pied d'appui
   dérive de 14 texels entre deux images au lieu de 9) ; Maj en sprint × 1,2 (à confirmer).
2. Vues de trois-quarts (`briefs/three-quarter-views.md` § 6) : cinq vues pour le héros seul, pour tous, ou trois vues ; source du trois-quarts
   dos (nouvelle planche) ; vues 6 / 7 ignorées (recommandé : règle à cinq secteurs avec repli, puis le héros, trois-quarts dos à demander).
3. `?camblend=anchored` par défaut (oui) ; recaler le pivot de A pour effacer le reste (+21 px/s) (à chercher et montrer).
4. Cadrage D : gain x 0,85 (approuvé), 0,6, ou un suivi qui vise la vitesse du joueur à l'écran (à prototyper).
5. Météo : défaut sans météo (oui, la nuit claire approuvée) ; `rain=0.5` comme variante d'ambiance après la mesure GPU ; un cycle ?
6. Foule : `?crowd=5` par défaut (oui : chaque citadin approuvé paraît).
7. Passe « derrière » du bake : la garder (filet de sécurité tant que les occluders, les zones ou la composition peuvent changer) ou la
   couper (≈ 90 ms par bake neuf) : 0 pièce restaurée sur trois graines (mon choix en attendant : la garder ; recommandé : la couper au gel
   du district, après une dernière mesure).
8. Restées ouvertes d'avant (rappel) : bake D ×4, poses AB à w = 0,5 pour la maison 609, corrections de géométrie (Passe 5b) ; épingler
   `ubuntu-24.04` en CI ; `strictPort` sur 5173 ; confirmation du contrat C2 ; critère d'archivage (« branche fusionnée ») ; statut Gold Master.

### Ce qui reste pour déclarer le Merchant District complet
- **Personnages** : le héros en production (reconstruction Aseprite, revue en jeu, approbation, puis masques de ses déclinaisons) ; la
  décision des trois-quarts et son art ; la foule (`crowd`) ; la marchande à son étal (mise en scène) ; les restes d'art des critiques
  (talon, poussée, marteau peu lisible sur l'enclume), qui demandent Aseprite.
- **Caméras et architecture** : les décisions 3 et 4 ; la relecture humaine de l'occlusion (montant de la bannière du bateau) ; les neuf
  écarts connus de `viewport-proof` (décisions de la Passe 5b) ; la dette de l'ancienne rive opposée (décalage d'une graine à accepter).
- **Météo** : la mesure GPU et la décision 5 ; non faits : son, éclaboussures, neige sur les personnages.
- **Performances** : remesurer le budget GPU avec le héros cuit, la foule à cinq et la météo (machine de l'opérateur).
- **Clôture** : un passage en revue de l'opérateur en jeu (A / B / C / D, avec et sans météo) et sa décision de statut ; ensuite, un autre
  quartier.

### Pensée
- Une séance sans l'opérateur avance le plus en préparant des décisions mesurées (paramètre d'URL, capture avant / après, recommandation)
  et en prouvant à chaque fois que le jeu par défaut n'a pas bougé (0 px).

## Passe A1 — Arène : le prototype publié archivé à l'octet, puis adapté à la direction artistique du Merchant District (2026-10-19)

### Demande (opérateur, mot pour mot)
- « Voici une tâche sur laquelle tu peux te concentrer pour ces 3 derniers heures : c'est un travail en parallèle que je faisais pour préparer
  l'arène que nous utiliserons pour notre jeu. Il faudra adapter visuellement ( UI, décors, HUD ) afin que cela colle avec notre DA actuelle »
  ; sources : la conversation « Visual direction exploration for Cité du Tournoi », le prototype publié
  (https://claude.ai/artifact/Bhee6cMZ5mLKdVejE2rsim) et son rapport technique (https://claude.ai/artifact/SWwfcVxRu2tnPRBMyGeR3n) ;
  « Le fichier HTML du prototype publié est donc maintenant la seule source à partir de laquelle reprendre le travail. »
- Branche `claude/stoic-goodall-8ieke4` recréée depuis `main` (`64faacf`).

### Archive — [OK]
- La page publiée lue par l'outil d'artefacts (version `1792100867-cf3f`) : 402 688 octets, SHA-256 `feb7461a3e44ee74…`, copiée à l'octet
  (`cmp`) dans `arena/source/arena-prototype.served.html` (`-text` dans `.gitattributes` : aucune conversion de fins de ligne). Le service
  l'enveloppe dans son propre squelette (une première ligne `<!doctype html><html><head>…<body>` de 531 octets, et `\n</body></html>` à la
  fin) : `arena/arena.html` = la page sans cette enveloppe (402 142 octets, `d1ddef1e87f6d98d…`) ; enveloppe + document + fin réassemblés =
  les octets servis (vérifié par script). Fiche `arena/source/arena-prototype.source.json` (URL, identifiant et version de l'artefact,
  tailles, empreintes, dérivation, dépendances : Three.js r128 sur cdnjs et Google Fonts) ; ses trois tailles et empreintes revérifiées par
  script contre les fichiers.
- Rapport technique (page de 8,2 Mo, 41 captures JPEG intégrées) : seul son texte est versionné (`arena/source/runtime-bakeoff-report.txt`,
  captures remplacées par leur texte alternatif), l'empreinte de la page dans la fiche.
- **Mon choix** : l'arène vit dans `arena/`, hors du jeu et de son build (Vite ne construit que `index.html`) : un prototype en un seul
  fichier, Three.js r128 (le jeu est sur une version récente : le porter dans `src/` serait une autre tâche) ; l'adaptation se fait dans
  `arena/arena.html`, l'original reste servable à côté pour l'avant / après, `git log -p` montre chaque changement.

### Adaptation — [OK] (`arena/arena.html`, mode HD-2D : celui du jeu)
- Méthode : remplacements à ancre stricte (chaque ancre doit apparaître le nombre de fois attendu, sinon rien n'est écrit), en huit étapes ;
  `git log -p arena/arena.html` est le changement (174 lignes ajoutées, 163 retirées sur 3 202).
- Références : captures A / B du district (`screenshots/calibration/camA-establishing.png`, `camB-merchant.png`) et ses valeurs
  (`SceneUniforms.ts` : brume (0,034 ; 0,055 ; 0,098), zénith, lune) ; pour l'interface, l'écran de chargement (`src/main.ts` : fond
  #05070d, ivoire #d9c9a8 / #f1d9a0, ambre #e9a64c) et le panneau DEV (`DebugPanel.ts`).
- Décor : ciel de nuit (zénith indigo, la brume du district à l'horizon, halo froid autour de la lune, une lueur chaude très basse comme
  `uCityGlow`, étoiles posées après la réduction de palette par un crochet `after` des peintres) ; lune (disque ivoire, halo additif froid)
  dans la trouée entre château et cathédrale (`sunWorld` garde son nom : les rayons du post-traitement la visent, teinte froide) ; ville
  lointaine, monuments et aqueduc en silhouettes indigo plus claires que le ciel derrière elles, liseré froid côté lune, fenêtres ambre ;
  pavés et murs en pierre froide ; façades à colombages en plâtre ivoire désaturé et bois sombre ; bannières marine à fleur de lys or
  (celles du quai) ; foule en masses indigo, quelques pixels qui prennent la lune ; accessoires désaturés ; brume (scène, foule, passe de
  reflets) à la couleur du district. **[KO → corrigé]** au premier rendu, des tours de la valeur du ciel ne laissaient voir que leurs liserés
  (des traits clairs qui flottaient) : silhouettes éclaircies (perspective aérienne).
- Lumière : la clé est la lune (bleu froid, faible), hémisphère indigo, plus de soleil ; la chaleur vient des lanternes (la passe de
  lumières locales du prototype ; lampadaires 1,35 / 4,2 m au lieu de 1,0 / 3,2) ; curseurs « Time of day (golden hour to dusk) » →
  « Lanterns over moonlight » (défaut 0,7 au lieu de 0,5), « Warm key gain » → « Moon key gain », « Sun shadow map » → « Moon … » ; liseré
  des sprites froid (lune) au lieu de chaud, rebond chaud du sol atténué. **[KO → corrigé]** premier rendu : sol gris délavé (clé et
  hémisphère reprises du soleil, 1,8 et 0,46) → 0,95 et 0,3, pavés plus sombres, sol moins brillant.
- HUD / interface : la police du jeu (Segoe UI / system-ui ; Bricolage Grotesque retirée) ; titre comme l'écran de chargement (capitales
  espacées, or pâle, filet ambre) ; Cinzel gardée pour les noms et les actions ; panneaux indigo à filet ambre ; vie de Ren acier-ivoire, de
  Marek braise ; points d'action en losanges ambre ; barre d'actions ardoise (disponible : ambre ; technique : acier ; fenêtre de réaction :
  ivoire) ; panneau DEV au style de celui du jeu ; KO et chargement en français.
- Signaux de combat : anneaux au sol de Ren acier, de Marek braise-cramoisi (distinct de l'ambre des lanternes) ; les signaux de l'ennemi
  (lueur de lame, anneau et aura rouges de combo, pulsation rouge des bords) gardés : ce sont des accents de jeu, pas de la lumière.
- **Mon choix** : seul le mode HD-2D (celui du jeu) est adapté ; PAINTED et FULL 3D, modes de comparaison du « bake-off », gardent leur
  arène de jour (leur HUD suit les nouvelles couleurs) ; personnages (sprites, visages) non touchés, hors de la demande (UI, décors, HUD).

### Preuves
- `tools/arena-check.mjs` (nouveau) : (1) la simulation seule, 120 s d'un script d'entrées fixe : même empreinte d'état avant / après
  (`152:1:idle:20.233:…`) ; (2) les 11 moments scriptés dans les 3 modes (33 rendus) : 0 erreur de page ou de console, avant comme après ;
  (3) contraste du télégraphe contre le sol dans la fenêtre de réaction (aide complète), mesure du banc d'appareil du prototype : avant
  2,34:1 (deutéranopie 2,34).
- **[KO → corrigé]** cette mesure a attrapé une régression : de nuit, le sol est aussi sombre que l'ancien intérieur cramoisi du
  télégraphe, 1,44:1 (1,37) sous le seuil de 2:1 du prototype ; un rouge plus clair ne suffisait pas (1,49:1 : le rouge porte peu de
  luminance) ; bande braise plus claire que la pierre et chevrons ivoire : **2,44:1 (deutéranopie 2,69)**.
- Inchangés à l'octet (comparaison de texte) : simulation de combat, poses et visages ; pipeline des sprites pixel ; le banc d'appareil ne
  diffère que par la police de sa feuille de style.
- Captures (SwiftShader, 1280 × 720, `tools/arena-shots.mjs`, mêmes moments) : `screenshots/calibration/a1-arena/{calm,combo,window,panel}-before-after.png`.
- Dépôt : typecheck, `npm test` 67 / 67, build, `art:validate` ; rien de `src/` n'a changé (le jeu et son bundle ne contiennent pas l'arène).

### Restes [?]
- Jugement de l'opérateur en jeu et en mouvement (rendu logiciel ici : ni cadence ni temps GPU) ; le banc `?devtest=1` du prototype sur sa
  machine ; les modes PAINTED / FULL 3D restés de jour ; la foule et la profondeur de l'architecture (écarts relevés par le rapport du
  prototype) ; le portage de l'arène dans le jeu (`src/`, Three.js récent) : une autre tâche, à décider.

### Pensée
- Passer du jour à la nuit inverse les contrastes : un repère pensé « plus sombre que le sol » doit devenir « plus clair que le sol » ; le
  contrôle chiffré du prototype l'a vu, pas l'œil sur une capture.
- Une silhouette lointaine se lit par sa valeur contre le ciel derrière elle : à valeur égale, il ne reste que ses liserés.

## Passe A2 — Arène : critiques à l'aveugle, la chaleur bornée aux sources, télégraphe cramoisi, publication (2026-10-19)

### Pourquoi
- Suite de la Passe A1 (fusionnée, `74a815a`), même consigne ; « Principes à garder » : toute retouche repasse une critique à l'aveugle par
  un agent neuf, et une retouche qui ne gagne pas clairement est annulée. Branche `claude/stoic-goodall-8ieke4` (de `main` = `74a815a`).

### Critique n° 1 — [OK] (agent neuf ; original contre A1, étiquettes tirées au sort, clé gardée hors de sa portée ; références A / B du district)
- A1 l'emporte : conformité globale 7 / 10 contre 3, ciel 6 / 2, pierre 6 / 3, lumière (chaud seulement aux sources) 6 / 2, HUD 8 / 5,
  signaux 7 / 6 (l'original : « a warm dusk scene », accents verts étrangers à l'interface du jeu).
- Ses écarts restants, **vérifiés sur les pixels** avant d'agir : mur du fond #262228 et arches #2e241b (neutres / chauds, la référence
  est bleu froid dans l'ombre), bannières prune #47373c, bord du sol #615f6c (clair), haut du ciel #303950 ; lune sans halo lisible ;
  libellés de techniques coupés (« COUP ÉCL », « TOURBILLO » : déjà dans l'original).

### Cause de la teinte tiède — [OK] attribuée effet par effet (mêmes captures, un effet coupé à la fois)
- Sans l'in-scatter des lanternes : mur #101528, arches noires, bannières #0e0f40 ; sans les flaques ou sans le bloom : presque rien ne
  change. Le terme d'in-scatter de la passe de post-traitement, `R²·0,12 / (d² + R²·0,12)`, a une traîne en 1 / d² : sommé sur les
  14 lumières, il voile tout le cadre d'ambre.
- **[KO]** premier essai sans attribution (flaques bornées, ambiance plus froide) : mur #29262f, presque rien. **[KO]** halo borné à
  0,9-2,6 R : les lampadaires (R 4,2 m) couvraient encore l'arène (#201f2c). **[OK]** halo borné en distance absolue : mur #101528,
  ciel loin de la lune #0e152b (référence #0f1533), bord du sol #3b3e50.
- Flaques des lampadaires plus chaudes (terme additif 0,012 → 0,035), halo de la lune resserré (70 × 56 m à 0,2 → 22 × 22 à 0,42 : le
  grand halo éclaircissait tout le ciel), sol moins brillant, grain 0,02 → 0,012, panneaux du HUD plus sombres, cartes de techniques
  assez larges dès 1 000 px (112 px, 11 px ; « Puissante » 84 px).
- Télégraphe : le critique le trouvait « dans la famille de l'ambre » (confondable avec les lanternes). **[KO]** cramoisi #a8283a qu'il
  proposait : 1,55:1 (le rouge porte peu de luminance). **[OK]** bande cramoisi-rosé plus claire, chevrons ivoire plus épais : 2,19:1
  (deutéranopie 2,51), puis 2,29:1 avec l'éclairage final.

### Critique n° 2 — [OK] (agent neuf ; A1 contre cette révision, étiquettes tirées au sort)
- La révision l'emporte : 7 / 10 contre 5, ciel 6,5 / 4,5, pierre 6 / 5, lumière 6,5 / 5,5, HUD 7,5 / 5,5, signaux 8 / 6,5 ; mesures du
  critique : pixels bleus 50 % (A1 : 15 %), point noir Y ≈ 20 (A1 : 33 ; référence ≈ 20).
- Ses écarts restants, vérifiés : gradins latéraux beige #604d43 sur toute leur largeur, lune terne #c4beb5, bannières violacées #4e3d58,
  cœurs des lampadaires presque blancs, lueurs ambrées sans lanterne sur les parapets, chiffres de vie rognés en bas de leur barre.
- Attribution de nouveau : sans in-scatter, gradins #1c1e2d ; les six lanternes de parapet de chaque côté, espacées de 1,8 m, fondaient
  leurs halos en un voile continu → halo ≤ 2,6 m et proportionnel au rayon pour les petites lanternes ; gradins #4e403c avec des taches
  chaudes autour de chaque lanterne. Flaques bornées aussi en distance (≤ 6 m). Lune en valeurs HDR (elle fleurit dans le bloom, comme celle
  du district) ; bannières #0e1874 ; cœurs des lampadaires plus ambrés ; une petite lanterne (poteau et cage) sous chaque lueur de parapet ;
  chiffres de vie à l'intérieur de leur barre ; toutes les cartes disponibles bordées d'ambre (techniques teintées dedans) ; grain 0,008.
- Critique n° 3 — [OK] (agent neuf ; révision 2 contre révision 3, étiquettes tirées au sort) : la révision 3 l'emporte, « petit écart mais
  constant », 7,5 / 10 contre 6,5 (ciel 7 / 6,5, pierre 7 / 6, lumière 7,5 / 6, HUD 7,5 / 6,5 ; signaux 7,5 / 8 : les bordures acier
  distinguaient mieux le groupe des techniques) ; zones chaudes 13,6 % contre 17,1 %, froides 66 % contre 55 %. Ses écarts restants (non
  traités, « À reprendre » § 6c) : pierre des gradins encore tiède sous les lampes (#4c3f3e, référence #181828), bannières encore prune
  (#2e242e), lune moins blanche que celle du district (valeur 0,81 contre 0,99) et brume de distance faible sur la ville, sol hors des
  flaques plus clair (#383848), chiffres de vie peu contrastés sur leur barre, fond des cartes de techniques plus bleu, pastille « Debug »
  grise, appliques des parapets trop faibles.

### Écarté — [KO] les modes de comparaison PAINTED / FULL 3D de nuit
- Ciel, brume, lumières et tissus passés à la nuit : sans post-traitement, avec des textures de sable claires et un dégradé toon plancher à
  33 %, le sable éclairé par les braseros reste chaud, même à des intensités très basses (hémisphère 0,16, lune 0,32). Retiré (paires du
  script inversées) ; **mon choix** : ces deux modes du « bake-off » gardent leur jour, le mode du jeu est HD-2D.

### Aussi
- Écran « tournez l'appareil » en portrait sur téléphone (le cadre de combat est un cadre paysage : en portrait il coupait les deux
  combattants et la barre d'actions débordait) ; `color-scheme: dark` (contrôles natifs du panneau) ; libellés de chargement en français.
- Publication : `tools/arena-page.mjs` (le service d'artefacts enveloppe le fichier dans son propre squelette : la page retire le sien,
  `data-mode="hd2d"` posé par un premier script) ; artefact privé **https://claude.ai/artifact/3w7wmerkBRUFACTm2Y9xCh** (nouveau ; l'original
  `Bhee6cMZ5mLKdVejE2rsim` reste la source archivée, non touché). Avertissement du service : le bouton « Download 3 key frames » du banc
  d'appareil (lien de téléchargement) ne fait rien dans la visionneuse d'artefacts ; il marche en servant le fichier soi-même.

### Journal
- Passes gardées (H5 à A2) : 75 722 octets avant cette ligne, au-delà des ≈ 60 Ko ; aucun archivage possible selon le critère d'`AGENTS.md` :
  la plus ancienne, H5, attend sa décision (production du héros). Si « branche fusionnée » suffit (question ouverte, « À reprendre » § 7),
  H5 à W3 deviennent archivables d'un bloc.

### Preuves
- `tools/arena-check.mjs` sur la version finale : même empreinte de simulation, 33 rendus sans erreur, télégraphe 2,29:1 (2,63) ;
  simulation, poses, visages et pipeline des sprites identiques à l'octet à l'archive ; typecheck, `npm test`, build, `art:validate`.
- Captures : `screenshots/calibration/a1-arena/{calm,combo,window,panel}-before-after.png` (original / version finale).

### Pensée
- Un effet « local » sommé sur beaucoup de sources se mesure loin d'elles : une traîne en 1 / d², négligeable pour une lanterne, colore
  tout le cadre pour quatorze. Avant de corriger une teinte, couper les effets un à un et mesurer.
- Une critique d'art et un seuil de lisibilité peuvent se contredire (cramoisi contre 2:1) : la teinte se garde et la luminance se prend
  ailleurs (ici, des chevrons ivoire plus épais).

## Passe A3 — Arène : écarts de la troisième critique, la teinte des flaques par multiplication (2026-10-19)

### Fait (écarts de la critique n° 3, Passe A2, vérifiés sur les pixels avant d'agir)
- Bannières prune (#2e242e) sous les lanternes des tours : le terme **additif** des flaques (0,035, Passe A2) ajoutait de l'ambre à un tissu
  marine ; un terme **multiplicatif** garde la teinte (un marine éclairé reste marine) : multiplicatif 0,9 → 1,4, additif 0,035 → 0,012.
- Gradins encore tièdes sous les lampes (#4c3f3e) : flaques bornées plus tôt (de 0,9 R à 1,9 R, au plus 2,5 à 4,5 m) → #463a3b, des taches
  chaudes autour des lampes seulement.
- Lune (valeur 0,81 contre 0,99 au district) : disque HDR plus fort (2,6), halo 30 m à 0,55 → #d1d2cb avec un halo visible ; ville moyenne
  plus brumeuse (masses plus proches de la couleur de la brume : #324165 au lieu de #121936 en moyenne sur 500-900 × 100-190) ; sol hors des
  flaques plus sombre (albédo 0x9ca2b0 → 0x80869a : #31364a) ; appliques des parapets : un cœur ambré (6 × 10 cm, HDR) devant chaque cage ;
  chiffres de vie cernés de sombre ; même fond pour toutes les cartes (bordure ambre) ; pastille « Debug » au style du panneau.
- `tools/arena-check.mjs` : PASS (même empreinte de simulation, 33 rendus sans erreur, télégraphe 2,31:1, deutéranopie 2,65).
- Critique n° 4 — [OK, de peu] (agent neuf ; révision 3 contre révision 4, étiquettes tirées au sort) : la révision 4 l'emporte, 7,5 / 10
  contre 7, devant sur cinq axes sur six (ciel 7,5 / 7, pierre 7 / 6,5, lumière 7 / 6, HUD 8 / 7), égalité sur la lisibilité des signaux
  (7,5) ; « close to a toss-up for the scene itself, clearer on the HUD » ; zones chaudes du terrain 11,0 / 10,4 / 12,5 % contre 12,3 /
  11,5 / 13,6 %. **Mon choix** : gardée (verdict explicite, aucun axe perdu), l'étroitesse du gain consignée.
- Un de ses écarts, **vérifié sur les pixels** (agrandissement ×6) : les chiffres de vie étaient rognés en bas, du texte de 13 px dans une
  barre dont l'intérieur fait 9 px (bordure de 2 px, `box-sizing: border-box`) ; barre de 16 px, texte 10 / 12 px : entiers. Un défaut,
  pas une retouche de goût : pas de nouvelle critique.
- Écarts restants de la critique n° 4 (non traités) : dans le moment de combo, la pulsation rouge des bords (signal marqué de l'ennemi,
  réglable par le curseur « Enemy tell strength ») envahit les gradins et les coins ; pierre éclairée encore brun chaud près des lampes
  (#524340, référence mauve-gris #6a6471) ; lune #d3d3cd contre #fdf6ec ; bande du télégraphe la couleur la plus saturée de l'image ; barre
  de fenêtre de réaction sans repère ; les six appliques des parapets forment une rangée régulière de points chauds.
- Preuves finales : `tools/arena-check.mjs` PASS (même empreinte, 33 rendus sans erreur, télégraphe 2,31:1, deutéranopie 2,65) ; planches
  `screenshots/calibration/a1-arena/` refaites sur cette version ; typecheck, `npm test`, build, `art:validate`.

### Pensée
- Un éclairage local se teinte par multiplication quand il doit garder la couleur des matières (un tissu marine sous une lanterne) ;
  l'addition d'une couleur de lumière la recouvre.
- Quatre critiques à l'aveugle successives ont donné des gains de plus en plus étroits (7 / 3, 7 / 5, 7,5 / 6,5, 7,5 / 7) : la suite
  (pulsation rouge, saturation du télégraphe, rangée d'appliques) touche aux signaux de jeu ou à la mise en scène, à juger en jeu par
  l'opérateur plutôt qu'à empiler.

## Passe P1 — L'arène dans le jeu : `?scene=arena` (simulation portée, décor du district, combattants générés ×2, HUD) (2026-10-19)

### Demande (opérateur, mot pour mot)
« Le but de notre tâche était de porter l'arène dans notre jeu et adaptés ameliorer correctement le décors comme nous voulons et améliorer
aussi les personnages combattants. Nous allons intégrer des spirites cohérents. Enfin le UI / HUD doit aussi être améliorer »

### Fait — [OK] (branche `claude/stoic-goodall-8ieke4` depuis `main` `b0c2206`)
- **Entrée** : `?scene=arena` (`src/main.ts`) charge `src/arena/ArenaApp.ts` à la demande (morceau séparé au build : 74 ko, 27 ko gzip) ;
  sans le paramètre, la ville suit exactement son ancien chemin (`startTown`, code déplacé tel quel dans une fonction).
- **Simulation** (`src/arena/CombatSim.ts`) : port TypeScript de `CombatLib` (prototype), règle pour règle et dans le même ordre des
  opérations, mêmes nombres (provisoires, à régler par l'opérateur). Aucune règle changée.
- **Rendu** : celui de la ville, réutilisé tel quel : `MaterialLibrary` (peintres en workers), `LightRig` (22 sources fixes + 2 dynamiques =
  `MAX_LIGHTS`), ciel (`buildSky`), ombre de lune, reflet plan (plan y = 0 : les flaques), `PostFX` (in-scatter, profondeur de champ sur le
  duel, bloom, gradation de palette), particules (flammes, braises, fumée, halos), plafond d'images `a60`, `SpriteRenderer`.
- **Décor** (`src/arena/ArenaScene.ts`), avec les matériaux et modules du district : mur d'enceinte courbe (3,4 m, pierre de taille,
  pilastres, chaperon) ; deux portes cintrées des combattants (claveaux, clef, tunnel sombre éclairé du fond, lanternes) ; gradins sur quatre
  rangs, mur du fond crénelé, oriflammes marine ; **grande porte** au centre : deux tours de 9,5 m portant les bannières marine à fleur de lys,
  ouverte sur le ciel, **la lune basse dans son axe** (élévation 6,5°, azimut 4°) : sa lumière entre par la porte et tombe entre les
  combattants (une lune derrière les gradins n'éclairait rien du sol) ; une chaussée vers une balustrade, ses lampadaires en perspective ;
  au-delà, la ville basse et la colline au château (modules `farHouse` / `tower` du district et son matériau lointain, l'axe de la porte gardé
  libre) ; six maisons générées (`createMerchantBuilding`) derrière les gradins ; sol pavé mouillé du district avec un masque propre
  (flaques là où tombe la lumière, usure le long de la ligne de duel, crasse et ombre au pied des murs) ; anneau de dalles et médaillon ;
  braseros à la porte et deux juste hors cadre devant (la lumière chaude qui éclaire les combattants de face), râtelier d'armes, tonneaux,
  foin, caisses près des portes. 53,7 k triangles fixes, 24 instances.
- **Combattants** (`src/arena/FighterArt.ts`) : un peintre de profil de combat dans la grammaire du générateur de la ville (`makeRig`,
  `palette`, rampes à teinte décalée, modes d'ombrage, contour sélectif) : **Ren = la palette du héros généré** (`PLAYER`), **Marek = un nouvel
  archétype** dans la même grammaire (plus grand et plus large, cheveux et barbe blancs, plaque d'acier, tabard et cape cramoisis, grande épée
  à deux mains). Poses paramétriques (inclinaison, accroupi, appuis, genoux et coudes pliés, lame à tout angle), douze clips (repos, garde
  prête, attaque rapide, puissante, technique, taille, garde, esquive, coup reçu, étourdi, KO à genoux, victoire), arcs de mouvement et
  estocade sur la couche émissive, lame qui chauffe pour les techniques et la charge de Marek. **Densité ×2** (cases de 128 × 192 texels au
  texel monde de la ville, comme la distribution cuite : 64 × 96 par image 32 × 48). Les images suivent l'horloge de la simulation (l'image de
  frappe à l'instant d'impact). Spectateurs : les cinq archétypes de foule générés de la ville (vue de face, repos / bouche ouverte pour les
  acclamations), pixel doublé. Effets : étincelles ivoire / braise, éclat de garde (sprites sans ombre). Atlas 2048 × 960, 75 cases.
- **Moteur de sprites partagé**, deux options sans effet sur la ville : la taille de case du `SpriteRenderer` (défaut : 32 × 48, pied 45)
  et `Actor.noShadow`. Ailleurs, seulement des `export` (`makeRig`, `palette`, `farHouse`, `tower`, `farMaterial`, `FAR_KIND`).
- **Mise en scène** : élan calculé pour que la pointe atteigne l'adversaire à l'impact (portée mesurée sur l'image de frappe), recul aux
  coups, éclair de teinte, lumière d'impact, secousse (aucune avec `prefers-reduced-motion`), poussée de caméra vers la charge de Marek
  (pondérée par l'assistance), plan qui s'approche du KO ; lueur de la lame chargée (lumière dynamique, signal des assistances discrète et
  complète) ; acclamations des gradins ; marques au sol (`FloorUI`) : anneaux sous les combattants, **bande cramoisie à chevrons ivoire** en
  assistance complète.
- **HUD** (`src/arena/ArenaHud.ts`) : DOM dans le langage de l'écran de chargement du jeu (encre #05070d, ivoire #d9c9a8, or pâle #f1d9a0,
  l'ambre #e9a64c seul accent, Segoe UI espacé ; **aucune police externe**, le prototype chargeait Google Fonts) ; cartes des combattants
  (portrait = la vue de face du générateur, nom, vie avec **traînée de dégâts**, PA en losanges, état « Étourdi — frappez ! » / « En garde » /
  « À terre ») ; barre d'actions défense | attaques | techniques (coûts, recharges chiffrées, refus, appel de la fenêtre) ; alerte et barre de
  la fenêtre en assistance complète ; chiffres flottants ; écrans Victoire / Défaite, Pause, rotation en portrait ; libellés aria, focus
  visible, mouvement réduit. Touches du prototype (1-6, A, B maintenu, R, Espace ; H masque le HUD) et sa manette.
- **Paramètres** : `assist=subtle|full|off` (défaut discrète, comme le prototype), `hud=0` / `clean=1`, `cam=pitch,dist,fov,ty,tz,tx`
  (réglage du cadrage), `freeze=`, `seed=`, `fps=`. **Moments scriptés** (`src/arena/Presets.ts`) : les onze du prototype + `strike`,
  `heavyRen`, `ko` ; `__arena.jump(nom)`. Différence voulue : chaque pas est livré à la présentation (le prototype n'en livrait que la
  dernière demi-seconde : un KO plus tôt n'atteignait pas l'écran).
- **Outils** : `tools/arena-scene-shots.mjs` (captures des moments), `tools/arena-scene-check.mjs` (jeu en direct, empreinte, moments ×
  assistances, contraste du télégraphe).

### Essais écartés — [KO]
- Combattants à ×1 (la densité du héros de la ville) : à la taille du duel, ≈ 6 px écran par texel en 1080p, deux fois plus gros que tout le
  reste du jeu (≈ 2,6-3,3 px / texel pour le héros, Passe S2) ; à ×2, ≈ 3 px / texel (captures). Le ×2 garde aussi les plis : le motif de
  plis du mode `cloth`, appliqué texel par texel, faisait des rayures fines ; il est reposé à l'espacement des pixels de la ville.
- Premier cadrage (tangage 6,5°, champ 30°) : les gradins hors cadre, un tiers d'image de sol vide ; puis combattants à 1,18 et ±1,75 m :
  serrés et petits à côté du prototype. Retenu : tangage 3,5°, distance 15,6 m, champ 34°, pivot à 2,3 m, échelle 1,3, ±2,05 m.
- Portes des combattants absentes du premier rendu : la porte prenait un seul segment de mur (0,56 m) ; elle est maintenant une pièce de
  3,4 m qui remplace les segments qu'elle couvre (gradins sur linteau au-dessus du tunnel).
- Lumière de charge et lumière d'impact sur le visage des combattants : sprites brûlés en blanc ; déplacées (au-dessus et derrière
  Marek, devant la cible) et adoucies.

### Preuves
- `npm test` : 75 / 75 (nouveaux : `tests/arena-sim.test.mjs`, `tests/arena-art.test.mjs`) ; typecheck, build, `art:validate` (0 erreur).
- **Port de la simulation** : le script du prototype, lu dans `arena/arena.html`, tourne à côté du port : mêmes événements pas à pas et même
  empreinte (`152:1:idle:20.233:…;20.233`) sur le script d'empreinte, puis sur des entrées pseudo-aléatoires (3 graines, 300 s : garde tenue
  aux impacts, commandes en attente, esquives tôt / tard, étourdissements, KO), **état complet des deux combattants comparé à chaque pas**.
  Contrôles négatifs : quatre fautes injectées une à une (attente d'une commande, temps de levée de la garde, durée du recul, délai entre
  coups d'un combo), toutes attrapées ; le script d'empreinte seul n'en attrapait qu'une (il ne tient jamais la garde à l'impact, ne met
  jamais de commande en attente), d'où le second script.
- `tools/arena-scene-check.mjs` (SwiftShader, 1280 × 720) : PASS ; en direct, la boucle avance et prend les touches ; empreinte identique au
  prototype ; 42 rendus (14 moments × 3 assistances) sans erreur ; télégraphe 5,33:1 contre le sol (deutéranopie 5,76 ; 2,31 au prototype
  adapté) ; 82 appels de dessin et 130 k triangles par image (passe miroir comprise).
- **Ville inchangée** : `tools/detshots.mjs` (graine 1842, 30 pas ; cadrages A au démarrage, B joueur 2,1, D joueur 18,1) sur une copie
  figée de `main` `b0c2206` (:5187) et sur la branche (:5186) : 0 px, PNG identiques à l'octet.
- Avant / après : `screenshots/calibration/p1-arena/{calm,window,impact,technique}-before-after.png` (prototype adapté à gauche, le jeu à
  droite).

### Mes choix (décisions techniques, la plus sûre)
- L'arène reste derrière `?scene=arena`, sans entrée depuis la ville (y entrer depuis le district est une décision de jeu de l'opérateur).
- Combattants **générés par le code** (comme le héros), pas cuits : aucun asset à approuver ; une feuille cuite approuvée pourra les remplacer
  par les mêmes clés (`<id>/side/<clip>.<i>/0`) quand elle aura ses animations de combat (le candidat `hero-x2-v2` n'en a pas).
- Densité ×2, assistance discrète par défaut, nombres du prototype inchangés, cadrage ci-dessus.

### Restes [?]
- Temps GPU et cadence sur la machine de l'opérateur (aucun GPU ici ; `tools/perf.mjs` mesure `App`, pas l'arène).
- 24 sources = `MAX_LIGHTS` : une lumière de plus serait coupée par priorité (les lanternes du mur du fond d'abord).
- Sous 20 images/s, la simulation ralentit (pas d'image borné à 0,05 s, comme la ville).
- L'anneau de dalles se voit à peine (sol rasant, nuit) ; spectateurs debout (pas de pose assise) ; cheveux et barbe blancs de Marek en une
  masse claire de loin ; pas de son (le jeu n'en a pas).
- Ni critique à l'aveugle, ni jugement de l'opérateur en mouvement.

### Pensée
- Réutiliser le rendu de la ville donne à l'arène son atmosphère sans code (brume, in-scatter, reflets, gradation) : le travail du décor est
  surtout de placer volumes et lumières.
- La densité d'un sprite se choisit par la taille du texel à l'écran dans le cadrage où il vit, pas par celle de l'image source.
- Composition et lumière sont une seule décision : la lune derrière les gradins n'éclairait rien ; l'axe de la porte la fait entrer dans le
  duel.
- Un port de logique se prouve contre l'original exécuté à côté, sur des entrées qui atteignent chaque chemin (vérifié par le test), et une
  faute injectée doit le faire échouer.

## Passe P2 — Arène du jeu : quatre critiques à l'aveugle contre le prototype, la lumière refroidie, le signal de réaction refait (2026-10-19)

### Méthode
- Agent neuf à chaque critique ; le prototype adapté (Passes A1 à A3) contre l'arène du jeu sur quatre moments (`calm`, `window` en
  assistance complète, `impact`, `technique`), étiquettes tirées au sort, clé lue puis effacée avant le lancement, gardée hors de sa portée.

### Critique n° 1 — l'arène de la Passe P1 : [KO] (le prototype devant, 7 contre 6,5)
- Le jeu devant sur le décor (8 / 6) et le HUD (6 / 5,5) ; derrière sur la lumière (6 / 7,5 : « l'ambre domine le sol et les murs, pas un
  accent »), les sprites (5 / 7,5 : visages en masques blancs, Marek fondu en une masse blanche) ; lisibilité du combat à égalité (6) mais
  signal de réaction faible chez nous (alerte petite, décentrée sur une tour ; chevrons courts sous les pieds de Marek ; barre de temps ténue).
- Vérifié sur les pixels avant d'agir : le sol avant éclairé par les deux braseros hors cadre (la lumière de face des combattants) est
  brun-ambre sur toute la largeur ; les braseros de la porte derrière la tête de Ren ; spectateurs à ×1 doublés, tièdes, serrés.

### Corrections — [OK]
- **Lumière** : la lumière de face des combattants n'est plus l'ambre des braseros mais un **rebond de lune froid** (bleu pâle, 1,7, rayon
  15 m, devant et en hauteur) ; braseros avant 3,0 → 1,5 (rayon 5,5 : des flaques de lumière dans les coins), lampadaires du ring 4,2 → 3,0
  (rayon 7,5), lanternes des portes 1,9 → 1,3, foyers des tunnels 2,6 → 2,2, braseros de la porte 3,4 → 2,5 et déplacés devant les tours
  (x ±6,1), lanternes du mur du fond 6 → 4. Sources : 21 fixes + 2 dynamiques = 23 sur 24.
- **Sprites** : tête éclairée du dessus dans le peintre (la peau garde son ton, joue et mâchoire leur ombre : de face, tout le visage était
  en hautes lumières) ; Marek poivre et sel (cheveux, barbe, sourcils foncés, peau plus chaude) ; mèches de Ren balayées vers l'arrière
  (dressées, de profil, elles se lisaient comme des oreilles, critique n° 2) ; **liseré de lune** d'un texel sur le haut et le dos de la
  silhouette (les capes sombres se détachent de la pierre) ; lames d'acier plus claires ; traînées de mouvement pleines et effilées (la
  traîne tramée se lisait comme une chaîne de points) ; étincelles plus petites, moins émissives ; éclair d'impact divisé par deux.
- **Signal de réaction** (assistance complète) : alerte centrée au-dessus du duel, plus grande, sur fond plein ; bande au sol d'anneau à
  anneau, deux fois plus large, **encre sombre cerclée d'ivoire, remplie d'ambre pendant la charge, ivoire brûlant dans la fenêtre**
  (le cramoisi virait au rose après la gradation et sortait de la palette) ; barre de la fenêtre épaisse, sur une piste, qui se vide vers la
  gauche, étiquetée « Fenêtre d'esquive A » ; touche d'esquive qui pulse en ambre.
- **HUD** : cartes sur fond plein, chiffres de vie sortis de la barre (ivoire sur bleu pâle illisible), l'état sous la carte sans réserver
  de place ; tailles minimales 11-13 px ; cases de la barre d'actions opaques, l'état indisponible porté par la couleur du texte et non par
  la transparence ; recharge en grand chiffre centré, libellé masqué pendant la recharge.
- **Foule** : moins dense, plus petite (0,66), teinte froide.

### Critique n° 2 — après les corrections lumière / signal / HUD : [OK] (le jeu devant, 7 contre 6)
- Lumière 8 / 6, HUD 7,5 / 5, lisibilité du combat 6,5 / 5,5, décor 7 / 6,5 ; sprites encore derrière (5,5 / 7,5). « P is better overall by
  about one point: its world, light, hit contact and HUD are more finished, while Q has the better fighters and a much stronger floor
  telegraph. » Ses écarts traités ensuite : bande rose et fine, tête de Ren lue comme un masque de renard, silhouettes sombres sur la
  pierre, braseros derrière les têtes, foule à l'échelle des portes, barre de temps ambiguë, recharge serrée contre la touche.
- Relevé au passage chez le prototype (référence archivée, non modifiée) : la vie de Marek affichée « 800 / 742 » au moment `technique`.

### Corrections après la critique n° 2 — [OK]
- Bande au sol **d'anneau à anneau, ambre et ivoire**, encre sombre cerclée d'ivoire (contraste 7,33:1, deutéranopie 7,54) ; mèches de Ren
  balayées vers l'arrière ; Marek poivre et sel ; liseré de lune ; lames plus claires ; braseros de la porte devant les tours (x ±6,1, hors
  des têtes) ; foule réduite (0,66) et refroidie ; barre de fenêtre étiquetée qui se vide vers la gauche ; esquive qui pulse en ambre ;
  recharge en grand chiffre centré.

### Critique n° 3 — [OK] (le jeu devant, 7 contre 5,5)
- Lisibilité du combat 7 / 4,5, HUD 8 / 5, décor 7 / 6, lumière 7 / 6,5, sprites 6 / 7 (l'écart se resserre : 5, puis 5,5, puis 6).
  « M is clearly better overall, by about 1.5 points, because its attacks connect and its reaction cue and HUD read cleanly ».
- Ses écarts, vérifiés : pendant la charge, Marek s'avançait déjà (l'élan commençait à 30 % de la charge : à l'ouverture de la fenêtre il
  avait fait 68 % du chemin), la bande se réduisait à un tronçon et les silhouettes se mêlaient ; deux capes rouges ; anneaux blanc et rose
  pâle ; arc du coup puissant au-dessus de Marek « en arc-en-ciel » ; spectateurs chauves répétés, coupés par le cadre et sous les cartes ;
  aucun chiffre de dégâts sur les captures.

### Corrections après la critique n° 3 — [OK]
- L'élan du coup puissant ne part que dans ses 0,16 dernières secondes (les autres attaques à 35 % de la charge) : l'écart et la bande
  restent ouverts pendant toute la charge.
- Cape de Marek bleu ardoise sombre (le tabard reste cramoisi) : Ren seul porte la cape rouge du héros ; anneaux franchement bleu (Ren, sa
  tunique et sa barre de vie) et cramoisi (Marek).
- Traînée du coup puissant : la fin de la course seulement, juste derrière la lame (rayon 17 / 22 texels au lieu du grand arc).
- Spectateurs : seulement sur les segments proches de la porte (rien sous les cartes ni au bord du cadre), plus de crânes chauves (béret
  ou casquette), 0,62.
- Rebond de lune plus haut et plus en arrière (8 m, z 11 : ses reflets sur les pavés tombent hors cadre) ; lampadaires 2,6 / rayon 6,2,
  lanternes des portes 1,0 / 4,2 ; foin et caisses de la porte droite rentrés dans le cadre ; nez du profil plus petit (le « museau »).
- **Chiffres flottants absents des captures** : la cause est la minuterie de 1,1 s qui les retirait avant la capture (un rendu logiciel
  prend plus d'une seconde) ; un moment tenu (`jump`) les garde affichés à leur état visible jusqu'à la reprise ; la traînée de vie passe
  à l'ambre (lisible).
- Contrôle : `tools/arena-scene-check.mjs` PASS (42 rendus sans erreur, télégraphe 4,97:1, deutéranopie 5,09).

### Critique n° 4 — [OK] (le jeu devant, 7,5 contre 5,5 ; ses sprites devant pour la première fois)
- Lisibilité du combat 7,5 / 4,5, lumière 8 / 6, décor 7,5 / 6, HUD 7,5 / 5, **sprites 6,5 / 6**. « S is clearly better overall, by about
  two points, mainly on combat feedback, atmosphere and HUD polish. » Série : 6,5 / 7, puis 7 / 6, 7 / 5,5, 7,5 / 5,5.
- Ses écarts, traités sans nouvelle critique (gains de plus en plus étroits, Passe A3) : bande qui s'arrête sous les pieds (elle passe
  maintenant sous Ren, ambre plus franc et pulsé dans la fenêtre) ; visage de Ren en masque (peau un ton plus chaude que celle du héros de la
  ville, œil plus haut avec sa paupière) ; barbe et cheveux de Marek d'une même valeur (barbe plus sombre, cheveux argent) ; bas des corps
  fondus dans les pavés (liseré plus doux sur le bord avant) ; murs encore orangés (braseros de la porte reculés des murs, 2,0 / rayon 4,8 ;
  lampadaires 2,4 / 5,2) ; anneau cramoisi de Marek, une seconde teinte chaude (anneau ambre : le danger) ; spectateurs derrière les cartes
  (seulement les deux rangs bas) ; bottes de foin lues comme des cubes de remplacement (tonneaux) ; lame de Marek blanchie par le bloom au
  coup (plus d'émissif à l'impact) ; épée de Ren rejetée en arrière au coup reçu (levée vers l'avant) ; sous-libellés gris trop pâles,
  techniques inabordables à peine grisées, titre sur une fenêtre éclairée (halo d'encre).
- **Téléphone en paysage** (844 × 390, vérifié sur capture) : l'alerte chevauchait les cartes, la barre de fenêtre les pieds, un libellé
  était coupé ; mise en page des écrans bas (cartes, alerte, barres resserrées, titre masqué) et noms courts des techniques sous 900 px.
  `screenshots/calibration/p1-arena/phone-landscape-window.png`.

### Publication — [OK]
- `tools/arena-scene-page.mjs` : build de production à chemins relatifs et page sans squelette (le service n'envoie pas la chaîne de requête :
  la page pose elle-même `?scene=arena` par `history.replaceState` avant le module du jeu ; le jeu n'est pas modifié). Vérifiée servie depuis
  un dossier quelconque (l'arène démarre, aucun repli des peintres). Publiée en artefact privé (trois scripts : le jeu, l'arène, le peintre ;
  les feuilles PNG de la ville, inutiles à l'arène, non publiées) : https://claude.ai/artifact/EzSKUGk1jrCSxLENY5CC44.
- `tools/perf.mjs` mesure aussi l'arène (`window.__arena` : moniteur de performance et minuteur GPU par passe dans `ArenaApp`, `?gpuprof=1`) ;
  vérifié ici que l'API répond (SwiftShader : temps sans valeur), à mesurer sur la 780M.

### Preuves (état final)
- `tools/arena-scene-check.mjs` PASS : la boucle en direct prend les touches ; empreinte identique au prototype ; 42 rendus sans erreur ;
  télégraphe 6,93:1 (deutéranopie 7,14) ; 92 appels de dessin, 130 k triangles par image ; 23 sources sur 24.
- `npm test` 75 / 75, typecheck, build, `art:validate` (0 erreur). La passe ne touche que `src/arena/` et les outils de l'arène
  (`git diff --stat 22d2b91 -- src`) : la preuve 0 px de la ville (Passe P1) reste valable.
- Avant / après refaits : `screenshots/calibration/p1-arena/{calm,window,impact,technique}-before-after.png`.

### Restes [?]
- Les sprites gardent la grammaire du générateur de la ville (grosse tête, profil) : la quatrième critique les met de peu devant ceux du
  prototype, les trois premières derrière. Au-delà : des feuilles cuites de combat (décision de l'opérateur, Passe P1).
- Corrections de la critique n° 4 non rejugées à l'aveugle ; temps GPU et lecture en mouvement sur la machine de l'opérateur ; la page
  publiée n'a pas été ouverte dans le visualiseur d'artefacts (le service ne s'inspecte pas d'ici).

### Pensée
- Un défaut vu par une critique peut venir de la capture et non du jeu : les chiffres de dégâts existaient, une minuterie de 1,1 s les
  retirait avant la photo (rendu logiciel lent). Vérifier dans la page (DOM, état) avant de corriger l'image.
- Le temps d'un geste porte le signal : l'élan de Marek commençait trop tôt, il raccourcissait la bande et mêlait les silhouettes
  pendant la seule seconde où le joueur doit lire l'attaque.

## Passe H7 — Héros : export reconstruit avec Aseprite depuis le rig de la Passe H6, mesures en jeu (2026-10-19)

### Demande
- Opérateur, mot pour mot : « la session cloud est finie prend en compte ce qui a ete etabli pour la suite » ; ce qui était établi, mot
  pour mot : « Ok on reprendra nos taches qui demanderont l;utilisation de aseprite et openAI, une fois que la session Cloud aura fini donc
  dans 5-6 heures » ; ici, le point 1 d'« À vérifier sur la machine de l'opérateur » (Passe B1).
- `main` à jour (`ba3f5aa`) ; CI verte sur chaque push de la séance cloud (lue par l'API publique de GitHub). La branche
  `claude/stoic-goodall-8ieke4`, entièrement fusionnée (sa suppression était refusée par le proxy de la séance cloud, Passe H6), est
  supprimée du dépôt distant. Branche `hero-h7-rebuild` depuis `main`.

### [KO → corrigé] `npm test` échouait sous Windows
- Sur la machine de l'opérateur, `main` donnait 1 échec : `tests/camera-graph.test.mjs` (Passe K1) chargeait `CameraRig.ts` au milieu du
  fichier, après ses cinq premiers tests ; ceux-ci tournent pendant que le chargement attend, puis le crochet `after()` de `tests/load.mjs`
  ferme le chargeur de Vite et le chargement reste en suspens (« Detected unsettled top-level await », code de sortie 13). La CI (Linux)
  passait : une course entre les deux.
- Correctif : tous les chargements du fichier en tête, avant le premier test. `npm test` 75 / 75 ; contrôle négatif : le fichier de `main`
  échouait sur cette machine (vu avant le correctif).

### Reconstruction — [OK]
- `node tools/art-lab/build-character.mjs art-lab/characters/rigs/hero-x2-v2.rig.mjs` (Aseprite 1.3.18.6, Chrome) : 36 images ; le JSON est
  identique à l'octet (images, durées, étiquettes) ; les vues reconstruites ne changent pas (`view-*.png`, mêmes empreintes).
- Export `7d62c12b…` → `6617d4b8…`, `.aseprite` `b908025d…` → `8445287b…` ; `build.json` et la table du paquet mis à jour (rig H6
  `971d1e8a…`).
- `--check` : « rebuilt identical » ; `verify-provenance` : « intact » (le problème signalé depuis la Passe H6 a disparu) ;
  `art:validate` 0 erreur ; `npm test` 75 / 75 ; manifeste inchangé (`candidate`, `approved: false`, `lab`).
- `walkSlide` (la mesure du moteur, par un script hors dépôt qui passe par le chargeur des tests) : export H5 9 texels, export H7 **14** ; le
  héros cuit court donc à 3,73 m/s, et à 4,48 m/s avec Maj (Passe H6).
- Planche `reviews/hero-x2-v2/09-h7-export-x3.png` (les 36 images ×3) : vol aux 4e et 8e images du profil, jambes de face levées de
  5 texels au plus.

### Glissement en mouvement — [OK]
- Méthode : `tools/foot-slip.mjs --secs=3`, graine 1842, `cast=candidate`, caméra épinglée, touche tenue ; médiane [min .. max].

| | A | B | C | D | D vers la gauche |
|---|---|---|---|---|---|
| marche (3,73 m/s) | +0,05 [−0,59 .. +0,05] | −0,03 [−0,10 .. +0,11] | −0,10 [−0,15 .. +0,09] | −0,07 [−0,10 .. +0,11] | −0,07 [−0,33 .. +0,11] |
| Maj (4,48 m/s) | +0,01 [−0,32 .. +0,01] | −0,03 [−0,15 .. +0,11] | −0,07 [−0,18 .. +0,09] | −0,01 [−0,15 .. +0,11] | — |

- Ces médianes rejoignent celles de l'aperçu de la Passe H6 à 0,04 près (A +0,05, B −0,06, C −0,10, D −0,07). Les ±0,07-0,11 sont la
  quantification : 5 ou 6 pas de 1/60 s par image (Passe H6).
- **[?]** Trois minima isolés restent non élucidés : A −0,59, A avec Maj −0,32, D vers la gauche −0,33.

### Flipbooks — revue en mouvement, hors dépôt
- `tools/flipbook.mjs` rejoue la même course à graine sur deux serveurs :
  - `main` figé, servi sur :5188 : export H5, 2,40 m/s ;
  - la branche : export H7, 3,73 m/s.
- Deux prises :
  - profil en B : `KEYS=d`, joueur à −6 / 0,6 ;
  - face en D : `KEYS=s`, joueur à 19 / −2,4. En B, la marchande, puis le voyageur et l'étal cachaient le héros.
- Pages de 6,5 et 3,8 Mo, à joindre à la fiche d'arbitrages.

### Restes [?]
- **Décision de l'opérateur** : le héros en production ou des retouches. Elle se prend en jeu, avec `?cast=candidate`. Rien n'est approuvé.
- Relevés de la critique H6, non traités :
  - pas de balancement des bras de face ni de dos ;
  - éperon du talon ;
  - genou en boule grise ;
  - botte levée de face rigide.

### Pensée
- Un fichier de test charge tous ses modules avant son premier test. Sinon, l'ordre d'exécution décide : sous Windows, le crochet qui ferme
  le chargeur passe avant le chargement.
- Une reconstruction préparée sans l'outil final (la séance cloud n'avait pas Aseprite) n'est finie qu'après `--check` et
  `verify-provenance` sur une machine qui l'a. Avant, les images du rig et l'export versionné restent deux choses distinctes.

## Passe I1 — Outil de génération d'images (OpenAI, plafond 5 $ par tâche) ; premier essai : vue tournante du héros en huit vues (2026-10-19)

### Demande
- Décision de l'opérateur (2026-10-19), mot pour mot : « Oui : fais créer l'outil de génération d'images par la séance du héros, avec un
  plafond de 5 $ par tâche, la provenance enregistrée automatiquement et la règle dans AGENTS.md. » ; puis, mot pour mot : « attends ne cree
  rien tout de suite une sous-session est en cours mais prend ces considerations pour plus tart ».
- Reprise après la séance cloud (Passe H7, même demande). Branche `image-gen-tool` depuis `main` (`d43585b`).

### Outil — [OK] (`tools/art-lab/gen-image.mjs`)
- **Technique** : Node seul (`fetch`, `FormData`, `Blob`), sans dépendance.
- **Points d'accès** :
  - `/v1/images/generations` sans référence ;
  - `/v1/images/edits` avec des références (`image[]`).
- **Clé** :
  - lue dans `OPENAI_API_KEY`, sinon dans `.env.local` ;
  - `.env.local` est refusé s'il n'est pas ignoré par git (contrôle par `git check-ignore`) ;
  - la clé n'apparaît que dans l'en-tête `Authorization` ; toute ligne affichée ou écrite passe par `redact`.
  - Elle n'a été ni lue à la main ni affichée dans cette passe.
- **Plafond** :
  - un registre ignoré par git (`art-lab/characters/scratch/gen-image-ledger.json`) tient la dépense de chaque tâche ;
  - chaque requête y est réservée au pire cas **avant** l'envoi, et refusée si la tâche dépassait 5 $ ;
  - `--cap` ne peut que baisser le plafond ;
  - la réponse remplace la réservation par le coût de sa consommation ;
  - une erreur HTTP compte 0 ; une requête restée sans réponse garde sa réservation.
- **Modèles** : tarifs de la page de prix d'OpenAI, lue le 19/10.
  - `gpt-image-1`, `gpt-image-1-mini` et `gpt-image-1.5` suivent la table publiée de jetons de sortie ;
  - `gpt-image-2` n'a pas de table publiée : le pire cas compte trois fois la table ;
  - tout autre modèle est refusé (pas d'estimation, donc pas de plafond).
  - `--list-models` lit les modèles d'image du compte (gratuit) : `gpt-image-1`, `-1-mini`, `-1.5`, `-2`, `-2.5-flare`, `-2.5-sunburst`,
    `chatgpt-image-latest`.
- **Provenance automatique**, dans une fiche `.source.json` à côté de chaque image, dont les octets de l'API sont gardés tels quels :
  - modèle, point d'accès, paramètres ;
  - prompt exact et son SHA-256 ; références (SHA-256, taille) ;
  - identifiant de requête, dates, consommation, coût estimé et coût d'après la consommation ;
  - empreinte de l'outil ;
  - présence du bloc C2PA (`caBX`), **non vérifié**.
- **Archivage** : `--archive` copie une image à l'octet dans `reference/sources/` avec sa fiche ; il ne remplace jamais une source
  existante et refuse une image qui ne correspond plus à sa fiche.
- **Autres modes** : `--dry-run` (rien n'est envoyé ni écrit), `--spent`.
- **Règle** : section « Image generation » d'`AGENTS.md`, avec la décision citée et le protocole des séances cloud de la mémoire du projet.

### Tests — [OK] (`tests/gen-image.test.mjs`, 7 tests, hors ligne, faux `fetch`, fausse clé)
- Couvert :
  - lecture de la clé, et refus d'un `.env.local` que git commiterait ;
  - estimations et coûts contre les prix publiés, écrits en nombres dans le test ;
  - une génération complète : octets gardés, fiche, registre réglé, clé absente de tout fichier écrit et de toute ligne affichée ;
  - les références envoyées en `image[]`, sans `input_fidelity` pour `gpt-image-2` ;
  - le plafond : refus avant tout envoi, `--cap 50` ramené à 5 ; `--dry-run` ;
  - les pannes : HTTP 400, absence de réponse, message sans la clé ;
  - `--archive`.
- **Douze fautes injectées une à une, toutes attrapées** :
  - plafond ignoré ; plafond relevable ;
  - message d'erreur non masqué ;
  - erreur HTTP facturée ; réservation perdue sans réponse ;
  - `.env.local` lu sans contrôle ;
  - octets modifiés ;
  - `--dry-run` qui envoie ;
  - archive écrasée ;
  - pire cas de `gpt-image-2` à 1 × la table ; `input_fidelity` envoyé à tous ;
  - texte de sortie payé au prix de l'image.
- `npm test` 82 / 82.

### Premier essai — [OK] la requête ; [?] le jugement est à l'opérateur
- **But** : deux points ouverts du héros.
  - Les vues de trois-quarts : la planche v3 n'a aucun trois-quarts dos (Passe H6).
  - Le visage : yeux sous la frange, pas de bouche (critique de la Passe H5).
- **Requête** :
  - tâche `hero-turnaround-v4` ; `gpt-image-2`, édition depuis la planche v3 archivée ;
  - deux images 1536 × 1024, qualité haute ;
  - prompt dans les fiches (SHA-256 `9aefde1f5a194b15…`) : huit vues de repos par pas de 45° (vues 4 et 6 en trois-quarts dos), visage
    lisible, cheveux, cuir et bottes sur trois rampes distinctes, fond gris sans ombre portée.
- **Coût** : réservé 1,19 $ ; consommation 3 960 jetons d'entrée (2 904 d'image) et 10 976 de sortie, soit **0,36 $**. Total de la tâche :
  0,36 $ sur 5.
- **Résultat**, deux planches :
  - de vrais trois-quarts dos aux vues 4 et 6 : nuque et ligne de la joue, gantelet et bout de botte du côté proche ;
  - deux yeux lisibles sous la frange et une petite bouche ;
  - le design gardé : cape indigo unie au liseré doré, fermoir, cuir, pantalon foncé.
- **Écart au prompt** : les vues 2 à 4 sont tournées vers la gauche au lieu de la droite. C'est sans effet pour le jeu, qui retourne le
  profil.
- **Mesures** : boîtes des figures, fond médian du bord, seuil 40.
  - Image a : figures de 317 à 321 px, 8 % plus grandes que la planche v3.
  - **Image b** : figures de 290 à 293 px, la même échelle que les vues de repos de la v3 (289 à 297 px).
  - Aucune des deux n'a d'ombre portée.
- **Archivage** : les deux images sont archivées à l'octet, comme **sources non canoniques**. Elles attendent la décision de l'opérateur.
  - `reference/sources/hero-turnaround-v4-2026-10-19-a.png` (`cddd87d0…`) et `-b.png`, avec leurs fiches automatiques ;
  - `cmp` identique ; `art:validate` : 14 sources, 0 erreur.

### Restes [?]
- Décisions de l'opérateur, portées sur la fiche d'arbitrages :
  - prendre ces planches comme source des trois-quarts et du visage du héros ;
  - aller aux cinq vues (`briefs/three-quarter-views.md` § 6).
- Rien n'est construit depuis ces planches. La reconstruction (pas, palette, rig) suivra cette décision.
- Clé MiniMax de `.env.local` : non utilisée (règle).

### Pensée
- Un plafond de dépense se tient avant l'envoi :
  - on réserve au pire cas, puis on règle d'après la consommation ;
  - pour un modèle sans table publiée, on prend un pire cas déclaré (ici trois fois la table), et la consommation réelle (5 488 jetons par
    image) dit ensuite s'il était juste.
- Une clé se garde par construction (un seul endroit où elle passe, tout le reste masqué), et se prouve par une fausse clé cherchée dans
  tout ce que l'outil écrit et affiche.

## Passe G1 — Preuves sur la machine de l'opérateur : temps GPU de la météo, de la foule et de l'arène ; visibilité avec l'ancrage ; fiche d'arbitrages (2026-10-19)

### Demande
- Suite de la Passe H7 : points 2 et 3 d'« À vérifier sur la machine de l'opérateur » (Passe B1), puis les décisions accumulées, regroupées
  sur une fiche (principe de l'opérateur : une fiche d'arbitrages à chaque jalon). Branche `local-proofs-g1` depuis `main`.

### Temps GPU — [OK]
- Conditions de la mesure :
  - `tools/perf.mjs --rounds=3`, serveur DEV :5186, graine 1842, `clean=1` ;
  - Radeon 780M (ANGLE D3D11), MSAA 4 ;
  - témoin de contention actif : **3 / 3 tours propres** pour chaque variante ;
  - médiane [min-max] des tours, en ms.

| | clair | pluie | neige | orage | héros + `crowd=5` + pluie |
|---|---|---|---|---|---|
| B, 1920 × 1080 | 10,81 [9,88-10,95] | 10,76 [10,22-12,14] | 10,68 [10,37-11,22] | 11,25 [10,37-11,71] | 10,80 [10,41-12,12] |
| D, 1920 × 1080 | 9,94 [9,42-10,01] | 10,60 [10,33-12,48] | 9,66 [9,53-11,87] | 10,19 [10,12-11,40] | — |
| B, 2560 × 1440 | 19,65 [18,60-20,04] | 18,97 [18,71-19,06] | — | — | 18,14 [17,44-18,35] |

- **Le coût de la météo reste sous le bruit de la mesure.** Entre deux tours, la même variante bouge jusqu'à 2 ms (dérive thermique). Sur
  les minima, l'estimation sans contention, la pluie coûte au plus +0,3 ms en B et +0,9 ms en D ; la neige et l'orage +0,1 à +0,7 ms.
- La météo ajoute un appel de dessin (107 → 108) et 10 000 à 18 000 triangles, comme le comptait la Passe W1.
- **Le budget de la passe 6 tient** : 10-12 ms en 1080p, 16-21 ms en 2560 × 1440. C'est vrai avec le héros cuit, la foule à cinq et la pluie
  ensemble.
- **Arène** (`scene=arena`, même session) : **9,30 ms** [9,25-9,49], 92 appels de dessin, 130 k triangles. La ville en B : 9,88 ms
  [9,79-10,22].

### Visibilité sur GPU — [OK] (`tools/viewport-proof.mjs --no-resize --no-controls`, serveur DEV, trois graines × cinq formats)
- **Transitions approuvées**, la référence de cette séance :
  - 9 contrôles en échec, le même nombre et les mêmes classes que les écarts connus de la Passe 5b ;
  - détail : 1842 D-far 2560 × 1080 (3 px) ; 7719 C 1080p et 2560 × 1080 (1 px chacun), AB 665 × 1200 (2 px) ; 30417 AB 1080p (48 px, dont 31
    décidés par l'ordre de dessin), et en 720p AB (5 px), CD (1 px) et D-far (1 px) ; 30417 D-far 665 × 1200 (1 px).
- **Transitions ancrées** (`--q=camblend=anchored`), **[KO → corrigé] l'outil** :
  - `viewport-proof.mjs` ancrait ses poses de transition seulement vers D, sans suivre `anchorAll`. La séance cloud avait mis `visproof`
    et `vis-why` à jour (Passe K1), pas lui.
  - Avec le paramètre, il testait donc une transition AB non ancrée, que le jeu ne montre jamais. L'écart obtenu (15 px à 30417 AB
    2560 × 1080) se reproduisait, alors que `vis-why` donnait 0 px à la même pose.
  - Correctif d'une ligne (`|| !!a.graph.anchorAll`), sans effet sans le paramètre.
- **Après correctif : 8 contrôles en échec, aucun au-delà de 3 px.**
  - Les écarts AB disparaissent (la pose AB n'est plus la même).
  - Restent : 1842 D-far 2560 × 1080 (3 px) ; 7719 C en 1080p et en 2560 × 1080 ; 30417 D-far et CD en 720p ; 30417 D-far 665 × 1200 (1 px
    chacun).
  - Deux écarts neufs d'1 px en BC (1842, en 1080p et en 2560 × 1080).
- `vis-why` sur BC (1842, 1080p) : 1 px, d'intensité 8 / 255 au plus. Il ne change pas quand on force la seule pièce manquée, une lanière du
  reflet plus fine qu'un pixel du bake. C'est la classe de résidu connue (un échantillon MSAA à travers une fissure, Passe 5b), pas un manque
  du culling.

### Fiche d'arbitrages — publiée
- Elle porte 25 décisions en six familles : héros (H1-H5), caméras (K1-K3), scène et ambiance (W1, C1, S1, S2, V1), arène (A1-A4), technique
  et processus (T1-T8), jalon (M1-M2).
- Chaque décision a son contexte, ses sources, des captures quand c'est visuel (dont les flipbooks de la course du héros, ancien export
  contre nouveau), une recommandation et des options.
- Page privée : https://claude.ai/artifact/JBaceiRrkNFHCq9SgdihY6. Les choix y sont enregistrés (collection `decisions`) et relus par la séance ; ils seront consignés mot pour mot
  avant d'agir.
- Pièce ajoutée pour H4 : `reviews/hero-x2-v2/10-v4b-views-vs-current-x3.png`.
  - Ce sont cinq vues de la planche v4-b reconstruites au pas du héros, en aperçu : `reconstruct-grid`, pas 3,4, `--holes --no-shadow
    --closing-from=48`. Rien n'est construit ni commité d'autre.
  - Elles font 85 à 87 rangées, comme le héros actuel (84-85).
  - À côté de lui, à ×3 : les yeux sont lisibles de face, et le trois-quarts dos se lit à la taille du jeu.

### Pensée
- Un paramètre qui change ce que le jeu montre (ici `anchorAll`) doit être suivi par chaque outil de preuve qui recalcule cette pose.
  Sinon, la preuve teste une image que le jeu ne fait jamais. Un écart qu'un second outil ne reproduit pas à la même pose se cherche
  d'abord dans les outils.
- Un coût plus petit que la dérive d'une session ne se lit pas sur une médiane. On le borne par les minima des tours entrelacés, et on le
  dit comme une borne.
- Une preuve de visibilité se compare d'abord à sa propre référence du jour, sur la même machine et dans la même série. Les écarts connus
  s'y retrouvent ; un écart neuf se voit alors par différence.

## À reprendre (par priorité)

> Élaguée le 18/10 (Passe M3) : seul le travail ouvert reste, regroupé par thème ; ce qui est fait vit dans sa passe. Les anciens repères
> (-3 … 6) cités par les passes antérieures renvoient à la liste de `7086340` (`git show 7086340:JOURNAL.md`).

**1. Distribution de personnages — décisions de l'opérateur, non traitées** (état de la distribution : `art-lab/characters/README.md`)
- **Variantes de PNJ** (demande de l'opérateur du 17/10, mot pour mot : « Par ailleurs a la suite de nos travaux de sprites NPC qui sont
  presque peuple partout sur le district Merchant, on creera par la suite des variantes de NPC avec couleur de cheveux et peau different pour
  amener plus de diversite au jeu »). Contraintes connues : la texture cuite garantissait 336 images et en porte 322 (dix feuilles,
  1024 × 2016 ; 672 garanties depuis la Passe T1) : une variante en feuille séparée ne rentre pas sans agrandir la texture ; la teinte aléatoire de la foule (± 10 % par canal
  sur tout le sprite) ne s'applique plus aux feuilles cuites (Passe 4A-tervicies). **Passes V1 / V2** : masques de matière, recoloration au
  rendu, approuvées pour la production le 18/10 (PNJ uniques en original). Passe V3 : trait rosé sous la bouche du voyageur et manches du forgeron
  (les « texels pâles à l'épaule ») corrigés dans les masques, approuvés le 18/10. Reste : les images de frappe du forgeron presque sans
  masque (invisible tant qu'il est fixé à son original). À arbitrer avec l'opérateur : quels personnages, combien de variantes,
  quelles teintes dans la direction artistique.
- **Mise en scène** : la marchande ne marche pas à son étal (collisionneur ; la déplacer de 0,5 m serait une décision de mise en scène) ; un
  second garde différent (miroir ou variante) au lieu de jumeaux, lances ; seuls 2 des 5 citadins (artisane, voyageur) paraissent à la
  graine 1842 et à la densité 1 (`round(2 × densité)` promeneurs ; « remplacer seulement ») : **`?crowd=<n>` préparé (Passe C1), les cinq dès
  n = 5, décision de l'opérateur**.
- **Mouvement** (Passe S2 : cadence réglée sur la vitesse vue à l'écran, pieds plantés pour la foule et les gardes ; Passe V3 : docker
  régularisé, glissement ≈ 0 en B / C / D) : restes des critiques du docker, communs à ses deux cycles : pas d'attaque du talon, botte de
  passage posée sur celle d'appui (image 4), poussée faible ; cycle 3 + 3 sans double appui (hérité du garde) ; en A, l'horloge touche son
  plancher pour un profil qui va presque en profondeur. Bras immobiles des citadins en marche : pas une priorité, décision de l'opérateur du
  18/10, mot pour mot : « les bras immobiles des citadins quand ils marchent n'est pas une priorites dans notre strucutre HD-2D, ce n'est pas problematique ».
- **Fidèles aux planches, non changés exprès** : bonnet / sac de la marchande selon la vue ; costumes des citadins différents selon la vue
  (tablier, sac, chemise).
- **Lisibilité** : tête du marteau cuit peu lisible sur la lueur de l'enclume (Passe 4A-vicies).
- **Restes mineurs** relevés par les critiques : sections « Restent » des passes 4A-tervicies et 4A-quatervicies.
- **Contrat et sources** : C2 (PNG versionné + JSON, `runtime-integration-contract.md` section 11) proposé le 16/10, appliqué par la
  distribution de production, sans confirmation explicite consignée : à faire confirmer. Originaux des planches de référence des PNJ (01-16,
  17-24, planche complémentaire) à retrouver (l'opérateur s'en charge ; ceux du casting 1 sont archivés, Passe H2) ; droits de tiers non
  vérifiés exhaustivement ; signatures C2PA lues, jamais validées (`c2patool` non installé).
- **Héros premium** (Passes H0 à H4) : casting 1 tranché par l'opérateur (design de la planche 1, pantalon foncé, planches archivées avec
  leurs PNG d'origine) ; planche v2 archivée, héros `hero-x2-v1` construit au stade lab puis écarté par l'opérateur (proportions, bras
  immobiles, cuisses trop hautes ; « experimental ») ; décision, mot pour mot : « Planche v3 (Recommandé) » ; prompt v3 prêt
  (`briefs/hero-proposal.md` § 5, trois pièces jointes) ; déclinaisons au choix du joueur : « Une base + couleurs (Recommandé) » (Passe H4) ;
  deux lots d'images évalués, non validés (brief § 11) ; planche de base archivée, `hero-x2-v2` construit au stade lab, candidat non
  approuvé (Passe H5) ; **en attente de la décision de l'opérateur** (production ou retouches). Texture cuite élargie
  (Passe T1 : 672 images garanties). Passe H6 : vitesse du héros cuit tirée de son cycle (3,73 m/s avec le rig préparé, Maj = sprint × 1,2),
  rig préparé (14 texels, vol, genoux à 5 texels) ; export reconstruit avec Aseprite (Passe H7 : `walkSlide` 14, `--check` identique,
  glissement ≈ 0), **décision de l'opérateur en jeu**. Vues de
  trois-quarts : étude `briefs/three-quarter-views.md`, décision de l'opérateur (aucun trois-quarts dos sur la planche v3 ; Passe I1 :
  deux planches générées en huit vues, trois-quarts dos compris, archivées comme sources non canoniques). Plus tard : masques du héros pour ses
  déclinaisons, écran de choix (code de jeu). Le reste des planches du casting : propositions non canoniques, design à valider avant toute
  production.
- **Personnages clés et suite de l'art** : héros et chat restent générés (densité ×1) ; ni personnage clé ni personnage **original** au
  même niveau ; E4 non lancée. Avant d'étendre : densité du cast (héros), liseré dépendant de la densité (liseré par sprite non implémenté),
  largeurs de texel inégales à ≈ 2 px / texel, cycle de marche en A. Décision ouverte : quelles planches étaient réellement rejetées (la
  consigne de 4A en parlait sans les montrer ; les trois planches archivées sont toutes classées comme références). Le modelé ×1,5 n'est
  plus la voie principale (Passes 4A-quater / quinquies).
- **Point de QA (pas une tâche)** : PNJ ×2 près de 1 px écran / texel (caméra A, PNJ lointains) : détails d'un texel qui clignotent ;
  surveiller à chaque nouveau PNJ. Mesuré en Passe S2 (graine 1842) : distribution ×2 à 0,35-0,78 px / texel en A, 0,65-1,68 en B, 0,97-2,02
  en C, 1,15-1,29 en D ; héros ×1 à 1,6 / 3,0 / 3,3 / 2,9.

**2. Occlusion du joueur (Passes 3 / 3b)**
- Un montant sombre de la bannière du bateau n'est pas découpé par le reveal et coupe le joueur ; la casquette tombe dans la bande tramée ;
  la trame « rampe » quand l'ellipse bouge. Ne rien changer sans inventaire visuel et technique (`tools/occ-inventory.mjs`) qui justifie un
  nouvel occluder.
- Relecture humaine en mouvement (style C, rayons 40–70 / 80–120 px, fondu 0,2 / 0,3 s) ; décider si les PNJ d'interaction doivent entrer
  dans le reveal ; chercher un cas où la passe « derrière » restaure vraiment des pièces (Passe B1 : aucune sur les graines 1842, 7719, 30417 en 720p et
  1080p ; décision de l'opérateur) (sinon envisager de la couper pour gagner ≈ 90 ms
  de bake) ; rejouer l'inventaire à chaque changement de zones de caméra ou de composition (bateau, lampadaires).

**3. `SpriteRenderer`** (Passe S1 : superposition retirée, masque de protection propre, auréole mesurée en mouvement ; Passe S1b : une seule
profondeur par sprite, le décor derrière un personnage ne le coupe plus ; l'enseigne devant le forgeron est voulue, opérateur, Passe H0) —
restent des décisions d'image : le bord des feuilles cuites ×2 (frange bleutée sur le contour d'auteur ; décision du 18/10 : contour d'auteur gardé, à faire au point 2) ;
la lisibilité du forgeron dans l'in-scatter de la forge (part des personnages 45 %, `known-issues/forge-smith-inscatter-C.png`) ; un halo placé
devant un personnage s'applique désormais entièrement (B : héros sous la lanterne, plus clair au visage).

**4. Zones de caméra** — validées par simulation (Passe 4B, `tools/camsim.mjs`), pas par de vrais joueurs : (a) D place toujours le joueur
**à droite** du centre (NDC +0,35 → +0,68), contrepartie de la continuité avec C ; (b) le long du bord de l'eau (z > 2,4) on passe **B → D**
sans traverser C ; (c) lacet max 0,96° / image en C ↔ D (≤ 0,55° ailleurs) ; (d) les transitions B → C vers l'ouest (−254 px/s) et B → A
(−131 px/s) font glisser le joueur à l'envers à l'écran (héritage de la passe 2, mesuré en 4B ; Passe K1 : B → A remesuré −139 px/s, C → B
0 ; **transitions ancrées partout préparées derrière `?camblend=anchored`** : B → A 0 image de recul au lieu de 14, pic +21 px/s au lieu de +181 ;
décision de l'opérateur ; preuve de visibilité sur GPU faite, Passe G1 ; le reste demanderait de recaler le pivot de A) ; (e) reculs du joueur à l'écran en cadrage posé C / D (−15 à
−39 px/s, Passe K1) : expliqués en Passes K2 / K3 (le pivot de D, qui suit 85 % du déplacement latéral, dépasse un joueur que sa marche en profondeur
ralentit à l'écran ; le suivi le long des axes de la caméra n'y change rien) ; gain 0,6 ou suivi visant la vitesse à l'écran : décision de
l'opérateur. Contrainte : la caméra de D reste
à z < ~18,5 (maisons de la rive opposée dès z = 19,8, invisibles de A/B/C) ; tout cadrage plus reculé exige de les retirer ou de les abaisser.

**5. Visibilité / culling**
- **Décisions de l'opérateur (Passe 5b)** : D ×4 (+75 ms de bake), poses AB à w = 0,5 pour la maison 609, corrections de géométrie
  (fissures, quai coplanaire) qui seules rendraient `viewport-proof` vert.
- **Écarts connus de `viewport-proof`** (9 échecs, tous expliqués en Passe 5b) : fissures MSAA (7719 C, 30417 CD 720p, 1 px de 1842 D
  2560 × 1080), lanières non attrapées à ×2 (30417 D 720p / 665 × 1200 : partie 73 ; 1842 D 2560 × 1080 ; 7719 AB 665 × 1200), maison 609
  (30417 AB). Pixels « order » (30417 B 109 px, AB 31 px, A / BC 1 px en 720p) rapportés sans échouer. Tout nouvel écart :
  `tools/vis-why.mjs` avant de toucher au bake.
- **Écart hérité [?]** : 17 px d'étincelle dans le canal coupés par le bake (B, joueur 15,5 ; −2,7), `known-issues/pass2-vis-speck.png` ;
  Passe 5b (1842, 720p) : 6 px aujourd'hui ; 6 lanières forcées (reflets de maisons de la ville moyenne, murs est de `bg2` / `tall`) → 1 px,
  non élucidé.
- **Coût d'un bake neuf** : le cache (P5, Passe 6d) relit un bake en 36 ms au lieu de 337 ; un bake neuf reste ≈ 300 ms par pages (Passe 5,
  273 poses), génération ≈ 910 ms. Piste : n'échantillonner que les poses concernées quand seul un réglage de caméra change ; réduire CD / BD
  (168 poses sur 273) a coûté 4 pièces de Tier 3 en précision : seulement avec une preuve.
- **Ordre des classes de dessin** : 41 classes, A/B/C pondérés ×2 (D dessine ≈ tout : 98,8 k / 100,8 k). Si D s'alourdit (nouveau
  contenu), rejouer `planDraw` avec un autre poids ou séparer D dans un mesh à part (+ appels de dessin).

**6. Performances GPU (Passes 6 à 6k, plan P0-P9 terminé, tout accepté et fusionné)** — Restent [?] : la cause du ralentissement des
rappels rAF de la passe 6j (ni charge CPU ni charge GPU ; hypothèse : rafraîchissement dynamique de l'écran ou du pilote) ; une lecture de
vsync trop **basse** n'est pas corrigée par le contrôle en session (jamais observée). Non mesuré : autres navigateurs / GPU, cache de
shaders d'un profil persistant, 780M sans contention (fenêtre calme, témoin à l'appui). Écartés (mesurés, Passe 6) : pré-passage de
profondeur (≤ 0,75 ms en 1080p avant son propre coût), filtre de l'ombre de lune (≤ 4 %) ; FXAA, qui flouterait le pixel-art sans masque des
sprites.

**6b. Météo (Passes W1 / W2)** — pluie, neige, orage, vent derrière `?rain` / `?snow` / `?storm` / `?wind`, défaut inchangé (0 px), réglables
en jouant dans le panneau DEV (section « Weather »). Restent : le
jugement de l'opérateur en jeu et en mouvement (vent sur les bannières,
pluie qui tombe, éclairs), une éventuelle météo par défaut ou un cycle (décision de l'opérateur) ; non faits : son (le jeu n'en a pas), éclaboussures
au sol, neige sur les personnages. Éclair dessiné dans le ciel : Passe W3.

**6c. Arène (Passes A1 à A3, P1, P2)** — **dans le jeu derrière `?scene=arena`** (Passe P1 : simulation portée et prouvée contre le
prototype, décor du district, combattants générés ×2, HUD au style du jeu ; la ville inchangée, 0 px ; Passe P2 : quatre critiques à
l'aveugle, de 6,5 / 7 à 7,5 / 5,5 contre le prototype). Jouable en artefact privé : https://claude.ai/artifact/EzSKUGk1jrCSxLENY5CC44 (à
republier avec `tools/arena-scene-page.mjs` après un changement). Le prototype `arena/arena.html` reste la référence de ses règles.
**Décisions de l'opérateur** : une entrée depuis la ville (porte, transition) ; le style des combattants générés ou des feuilles cuites de
combat à produire (Ren et Marek, animations de duel) ; le réglage des règles (nombres provisoires du prototype) ; l'assistance par défaut
(discrète). Temps GPU mesuré sur la 780M (Passe G1 : 9,3 ms en 1080p). **À voir sur sa machine** : cadence, lecture en mouvement,
la page publiée dans le visualiseur. Restes : visages des combattants (la grammaire du générateur), anneau de dalles peu visible (l'occlusion
de contact des surfaces l'assombrit au ras du sol), spectateurs debout, 23 sources de lumière sur 24, ralenti sous 20 images/s.

**7. Outillage, documentation, dette**
- **Port 5173** partagé avec un autre projet local et `vite.config.ts` sans `strictPort` : les outils peuvent photographier la mauvaise
  appli. Servir les baselines sur `:518x --strictPort` ; décider avec l'opérateur s'il faut changer le défaut (outillage, pas runtime).
- **Tests et CI — restes (Passe Q1)** : le libellé `ubuntu-latest` passe à Ubuntu 26 dès le 19/10 (épingler `ubuntu-24.04` = décision de
  l'opérateur) ; les tests ne sont pas typés (`.mjs`, hors `tsconfig`). Fonctions pures et refus « images manquantes » : testés (Passe Q2).
- **Code mort mineur** (Passe M5) : des `void x;` qui taisent des paramètres, des types exportés sans usage hors de leur fichier.
- **Archivage du journal** (Passe M4) : le critère « operator decision recorded, branch merged » d'`AGENTS.md` date d'avant la fusion
  sans demande ; lire « branche fusionnée » suffit, à confirmer par l'opérateur. Derniers archivages : V0-V3 (Passe T1), H1-H4 (Passe B1) ;
  prochain au-delà d'environ 60 Ko de passes gardées (H5 et suivantes, une fois leurs décisions consignées).
- **Dette** : l'ancienne rive opposée (`row(...)` en « sec ») rejoue ses tirages sans rien dessiner — à retirer proprement une fois qu'on
  accepte de décaler la ville lointaine d'une graine.

## Principes à garder

> Dédoublonnés et regroupés le 18/10 (Passe M3 ; liste précédente : `git show 7086340:JOURNAL.md`). Ce qu'`AGENTS.md` dit déjà n'est pas
> recopié ici.

### Mesure et performances
- Mesurer d'abord, optimiser ensuite : minuteurs GPU, variantes entrelacées dans une seule session, base figée. Relever l'adaptateur
  réellement utilisé (`WEBGL_debug_renderer_info`) dans chaque mesure : un portable hybride rend sur l'iGPU par défaut, quoi que demande
  `powerPreference`. Mesurer à la définition de l'écran de l'opérateur (dpr compris), pas seulement en 1080p.
- Un temps GPU pris sur un poste partagé ne vaut qu'avec son témoin de contention (autres processus sur le même adaptateur) ; à défaut, le
  minimum des tours entrelacés est l'estimation sans contention. La traîne du temps d'image en headless n'est pas une mesure.
- Une première fois (programme, variante, dessin) se mesure par une sonde dédiée : aucune moyenne ne la voit. Un intervalle rAF ne
  s'attribue qu'avec un repère (le départ de la boucle, un `gl.finish()` chronométré) : le plus grand intervalle depuis le chargement est le
  plus long bloc synchrone, pas forcément la première image.
- Un travail de démarrage déplacé dans un Worker reste une fonction pure à graine fixe ; il se prouve à l'octet (empreinte de chaque sortie,
  ordre de création des objets qui tirent `Math.random`) et par ses pannes injectées ; le jeu démarre sans Worker (repli par job, chien de
  garde). Une sonde de démarrage observe dès le premier repère, pas depuis `DOMContentLoaded`.
- Une cadence se mesure dans une vraie fenêtre avec vsync (`tools/cadence.mjs`), une « surcharge » en watts (RAPL, SoC = boîtier − cœurs),
  pas en % d'occupation GPU. La vsync se sonde au repos (les rappels que le plafond saute) : la médiane ou le minimum des horodatages rAF de
  la boucle ne la retrouvent pas, leur grille (le plus grand intervalle dont ils sont tous multiples) si ; une grandeur qui peut changer
  pendant la session (le rythme des rappels de Chrome) se revérifie pendant la session, avec des échantillons qu'elle ne fausse pas (passe 6k).
- La cadence préfère la régularité au nombre d'images (choix de l'opérateur, `e60` puis `a60`) : quand le GPU ne tient plus son créneau, un
  pas plus long et régulier plutôt qu'un mélange ; le retour au pas court se vérifie par un essai.
- Une passe plein écran se paie d'abord en bande passante : réduire ses échantillons sans retirer la passe ne gagne rien sur une iGPU ; un
  effet « en demi-résolution » ne paie que si sa recomposition tient dans une passe qui existe déjà (passe 6j).
- Un nombre écrit par un script pour un autre programme s'écrit dans la culture invariante, et en entier quand c'est un compteur ; un
  lecteur qui reçoit l'illisible le dit (passe 6i).
- Un résultat calculé mis en cache se relit seulement pour les mêmes entrées exactes : la clé couvre tout ce qu'il lit (géométrie, poses,
  réglages, code du calcul, GPU) ; une entrée douteuse est un échec de cache, jamais un culling.
- Une allocation, un plafond matériel ou une texture partagée se dimensionne contre le minimum **garanti** par la norme (WebGL2 : 2 048),
  jamais la valeur de la machine de développement, et se vérifie (complétude du framebuffer, erreurs GL) ; une texture partagée se
  dimensionne pour la distribution entière, candidats compris, avant de les ajouter (l'adressage par case entière permet d'élargir sans
  changer une image).

- Sans GPU (séance cloud), le rendu logiciel (SwiftShader) sert les preuves d'image déterministes (0 px entre deux versions) et les compteurs
  (appels de dessin, triangles, surface couverte) ; jamais les temps : ceux-là se mesurent sur la machine de l'opérateur (Passe T1).
### Visibilité, rendu, caméras
- Toute coupe de géométrie se prouve par un diff d'images `static=1`, culling actif contre `vis=0`, avec `occ=0` : la phase du fondu de
  reveal entre deux régénérations fabrique de faux écarts (1 377 px sur B).
- La rastérisation dépend de la position d'une tuile dans sa cible : les comptes bruts ne se comparent qu'à mise en page égale ; la
  non-régression se prouve sur les masques et les images finales.
- Un écart élagué / `vis=0` s'explique **causalement** (`tools/vis-why.mjs` : pièce forcée → 0 px ; témoin d'ordre) avant de toucher au bake ;
  un pixel décidé par l'ordre de dessin (faces coplanaires) ou par un seul échantillon MSAA (fissure) ne dit rien du culling.
- Le bake échantillonne des points : monter sa résolution fait aussi perdre des pièces ; un supplément s'ajoute aux comptes (tuiles fines
  additives) et va là où la géométrie se présente de chant (D). Toute modification des masques replanifie les classes : prouver le rendu
  canonique contre une base figée, pas seulement contre `vis=0`.
- Le besoin d'une pièce se mesure **par jeu de poses** (stables et mélanges séparés) ; mélanger les deux fait dessiner en C stable ce que seul
  un mélange voit. Pondérer les cadrages historiques pour qu'un nouveau cadrage ne les alourdisse pas.
- Ne pas ajouter de contenu pour combler le vide ; dépenser la complexité là où la caméra la perçoit.
- Garder le déterminisme par graine : toute suppression de code doit préserver les tirages aléatoires.
- Un `discard` ne se paie que là où il sert : variante de matériau liée seulement pendant l'effet, sinon le matériau de slot d'origine ;
  « au repos » doit coûter exactement la passe précédente (mêmes appels de dessin, image pixel-identique).
- Ne taguer que ce que l'inventaire mesure (rayons caméra → joueur contre les vrais triangles), jamais ce que l'intuition suggère.
- Le DOF et le masque de protection (alpha de scène) sont des contrats : un effet qui écrit de l'alpha ne doit pas toucher ce canal. Tout ce
  qui est dessiné après la passe opaque garde l'alpha de destination (`maskSafeBlending`) : un canal-contrat se protège à l'écriture, pas en le
  réparant après coup ; un mode de mélange de bibliothèque se lit dans son code (prémultiplié ou non) avant d'être réécrit (Passe S1).
- Un échantillonnage « au plus proche » du matériel ne se rejoue pas par une formule : on retrouve le texel par sa valeur (Passe S1).
- Un nouveau cadrage se cherche **empiriquement** (`tools/camsearch.mjs`) et se valide en **marchant** (`tools/camsim.mjs`) : la vitesse du
  joueur à l'écran pendant la transition ne doit jamais changer de signe par rapport à sa marche ; une transition interpolée entre deux
  cadrages hérite de l'écart de position écran des deux, d'où l'ancrage (`blendPose`) + un cadrage cible calé sur la sortie du cadrage
  précédent.
- Une caméra qui recule traverse la géométrie qui est « derrière la caméra » des autres cadrages : vérifier z caméra contre ce qui est généré
  de ce côté (rive opposée).

- Un recul du joueur à l'écran se décompose avant d'être corrigé : part du joueur (caméra figée) et part de la caméra (joueur figé),
  vérifiées contre la mesure ; une hypothèse plausible non décomposée a coûté un prototype inutile (Passes K2 / K3).
- Un quad construit dans le shader (une traînée orientée par sa vitesse à l'écran) se dessine double face ; un « rien à l'écran » se vérifie
  d'abord au compteur d'appels de dessin, puis en agrandissant l'effet (Passe W1).
- Un effet « local » sommé sur beaucoup de sources se mesure loin d'elles (une traîne en 1 / d² négligeable pour une lanterne colore tout le
  cadre pour quatorze) ; une teinte se corrige après avoir coupé les effets un à un et mesuré (Passe A2).
- Un effet qui écrit des uniformes partagés garde leurs valeurs d'avant et les rend : sa preuve est « activé puis retiré = 0 px » (Passe W2) ;
  tant qu'aucun paramètre ne le demande, il ne crée rien (un objet THREE tire `Math.random`).
### Preuves
- Un défaut relevé sur une capture se vérifie dans la page avant de corriger l'image : il peut venir de la capture (Passe P2 : chiffres de
  dégâts retirés par leur minuterie avant la photo).
- Un port de logique se prouve contre l'original exécuté à côté (mêmes entrées, mêmes événements et même état à chaque pas), sur des
  entrées dont le test vérifie qu'elles atteignent chaque chemin ; des fautes injectées une à une doivent le faire échouer (Passe P1 : le
  script d'empreinte seul en laissait passer trois sur quatre).
- Une preuve doit pouvoir échouer : un contrôle négatif avant d'accepter « 0 écart » (Lab : `filter=linear` ; revue d'agent : un défaut
  planté qu'elle doit trouver à l'aveugle ; « 0 trou » : remplissage depuis le bord ; mesure de stabilité en mouvement : un cas connu
  mauvais qu'elle doit séparer, sinon elle ne vaut que comme indice et le jugement reste visuel). Un résultat « 0 » d'un outil se recoupe
  avec une valeur connue avant d'être cru. Un test unitaire aussi : des fautes injectées une à une, chacune attrapée ; son oracle est
  indépendant du code testé (pas d'aller-retour par lui) et ses données exercent les cas limites (égalités, bords), vérifiés par le test même
  (Passe Q1).
- Une preuve « pixel-identique » exige une capture déterministe : `Math.random` à graine, pas fixes, horloge figée, RNG internes remis à
  zéro, une chauffe par cadrage **et par origine** (serveur), et un témoin de répétition (deux chargements : 0 px) **avant** toute
  comparaison ; un écart d'un niveau sur 255 se traque par sondes de variantes du shader. Avec des personnages, la boucle du jeu ne doit
  jamais tourner hors du harnais (`App.start` neutralisé dès le chargement, Passe M5).
- Pendant une série de mesures ou de captures sur un serveur de développement, ne rien modifier ni reconstruire de ce qu'il sert (`src/`
  compris : rechargement HMR) ; recadrer une preuve par projection, jamais par supposition ; un masquage d'acteur se vérifie (base masquée
  contre base non masquée) : avec la distribution cuite, un acteur porte l'id de sa planche.
- Une auréole se mesure : ce que le post-traitement fait changer autour d'une silhouette, personnage présent / absent, image par image en
  mouvement, puis effet par effet (`tools/sprite-halo.mjs`, Passe S1).
- Une échelle écran se dérive du code caméra du jeu à la position réelle du joueur (`evalAnchor` + `applyPose`), jamais de la distance de
  pivot d'un cadrage.
- Ajouter des sprites ne doit rien changer aux autres : une texture qui ne grandit jamais pour les sprites validés, et pour les nouveaux un
  adressage par case entière (t ∈ [0, 1] × taille de case, plancher + clamp, lecture au centre du texel) qui ne dépend ni de la taille de
  l'atlas ni de la place de la case. Des octets identiques ne garantissent pas une image identique : `floor(vUv × taille)` départage les
  égalités exactes (bord de texel au centre d'un pixel) selon la taille de la texture, et une formule normalisée par la taille de la texture
  ne peut pas y être stable. Toute croissance d'atlas se prouve par un balayage d'échelles, pas par quelques captures.
- Plusieurs densités de sprites partagent un seul renderer si chaque densité *k* garde le même rectangle monde (cadre 32k × 48k, pieds à 45k) :
  la densité est une affaire d'atlas, la hauteur une affaire d'instance.

- Un serveur de mesure sert un instantané figé (copie hors dépôt), pas la copie de travail : on peut éditer pendant la série sans
  recharger les pages mesurées (Passes H6, K1).
- Passer du jour à la nuit inverse les contrastes : un repère « plus sombre que le sol » doit devenir « plus clair » ; un seuil chiffré
  (contraste du télégraphe) le voit, l'œil sur une capture non ; une critique d'art qui contredit le seuil garde sa teinte et prend la
  luminance ailleurs (Passes A1 / A2).
- Une propriété aléatoire se teste sur plusieurs tirages (dix éclairs, deux caps de caméra), un repli dans ses deux sens (±π) : un seul cas
  laisse passer une faute injectée (Passes Q2, W3).
### Personnages : art et critique
- La densité d'un sprite se choisit par la taille de son texel à l'écran dans le cadrage où il vit (l'arène : ×2 pour ≈ 3 px / texel en 1080p,
  comme les personnages de la ville), pas par celle de l'image source (Passe P1).
- Un personnage se juge **dans la scène** à chaque itération (aperçu `?labsprite`, avant / après au même endroit) et **à côté du cast
  existant** (héros compris : densité de texel, proportions et hauteur monde à la même profondeur), pas seulement agrandi ni contre la
  référence : lumière chaude, liseré et voisinage du cast changent la lecture.
- Une critique d'art voit l'image, lit à froid avant la consigne, cite des pixels et vérifie la passe précédente ; le score monte avec des
  preuves, pas avec des intentions. Critique à l'aveugle = étiquettes tirées au sort, clé hors du champ du critique, nouvel agent à chaque
  tour, auto-critique écrite **avant** de lire le verdict. Toute correction ou reprise (de rig comprise, comptée contre la planche
  précédente) repasse une critique à l'aveugle par un agent neuf : elle crée ses propres pertes ; une retouche qui ne gagne pas clairement à
  l'aveugle est annulée, pas empilée.
- Une métrique de propreté (pixels isolés, alternances) n'est pas une métrique de forme : seule une critique aveugle juge la lecture du volume.
- Le classement des références (cible / support / rejet) se fait **confirmer par l'opérateur avant de produire** ; on mesure une référence
  (grille, taille, couleurs) avant d'en déduire une contrainte de résolution ou de technique.
- Avant une génération, comparer le brief lui-même aux personnages des références qui seront jointes : une combinaison de traits peut
  déjà décrire un personnage existant ; la liste de contrôle d'originalité nomme ces personnages.
- Un modelé se peint par **masses** (3-4 valeurs par forme, plis rendus par le bord des aplats) ; une spécification pixel par pixel écrite en
  texte donne de la moucheture (alternances) ou des blocs. La forme vient d'abord de l'information de la source (densité, dégradés peints) :
  préserver sa qualité, puis une finition ciblée ; la finition par agent est fiable pour les défauts **nommés et localisés**, pas pour
  repeindre un volume.
- Les contraintes de l'asset reconstruit (cadre 64 × 96, pieds rangée 90, anneau transparent, alpha binaire) ne s'imposent pas à
  l'illustration source : on ne dégrade jamais le modelé, l'expression ou les matières d'une source pour obtenir une grille parfaite ; la
  mesure de la source règle la reconstruction, elle ne la refuse pas.
- Une hauteur de présentation se décide sur la figure **dessinée** (mesurée dans l'atlas), pas sur une valeur nominale du code ; une carrure
  ne se corrige pas par l'échelle : les proportions se chiffrent dans le prompt et se mesurent sur la source avant toute reconstruction.
- Un personnage plus grand que le cadre se rééchantillonne à un pas plus grossier et se présente à l'échelle commune : une densité de texel
  unique dans la scène prime sur la taille relative de la planche (écart chiffré et consigné).
- Les vues qu'il faut à une marche (face, dos, profil) se prennent sur une planche multi-vues de la même échelle, jamais inventées depuis une
  seule face ; la recette entière (recadrages, palette, retouches, animation) vit dans un script de rig rejouable au texel près.
- Une famille de personnages se produit par gabarit, mais chaque vue se mesure avant : sens du profil contre la planche (avant tout miroir),
  rangée basse de chaque jambe (l'ombre du sol de la planche décale toute une vue), boîte de la seule matière pour une gamme peinte (filtrée
  par sa teinte), boîte de la pièce pour une botte.
- Après toute reconstruction, chercher les bandes quasi noires de la fermeture verticale entre deux masses (nuque / épaules, entre les jambes)
  et les comparer à la planche, pas à la reconstruction : elles se lisent comme des cheveux ou des sangles qui n'existent pas. Remède retenu
  (4A-unvicies) : `reconstruct-grid --closing-from=48` : pas de fermeture au-dessus de la taille, gardée en dessous (elle y restaure les
  contours sombres des jambes et des bottes ; la couper partout les a perdus) ; compter avant / après le fond enclavé et les zones des pieds.
- Retouche ciblée : changer la **chroma** d'une zone fautive en gardant ses valeurs corrige sans repeindre ; ajouter une masse sombre crée un
  nouveau motif (ras-de-cou).
- La copie assombrie d'une pièce lointaine (botte, jambe) garde un plancher de clarté (jamais sous sa propre clarté ni sous un seuil) :
  une soustraction constante écrase les tons sombres au noir du contour. Deux pièces de même forme se séparent d'abord par la profondeur
  (la lointaine plus haut à l'écran) puis par la valeur, et une pièce déplacée se borne à ce qui la cache.
- Une pièce animée emporte son contour (une colonne de contour à deux texels de la peau, une rangée basse rangée dans un autre calque) ; ce
  qu'elle découvre prend ce qui est derrière elle dans le sens du mouvement (au-dessus pour ce qui descend, en dessous pour ce qui monte),
  jamais une couleur prise de côté hors de portée.
- Un mouvement destiné à se lire en jeu se dimensionne en pixels écran (2 texels à ~1,8 px / texel), pas en texels de la planche, et se fixe
  explicitement (rebond imposé de 2 rangées au contact) : il ne se déduit pas seulement de l'IK ; une affirmation de critique se mesure
  (rangées, texels) avant d'être corrigée.
- Une marche capturée se fait à **pas fixe** avec les **vraies entrées**, sur un itinéraire d'abord validé sans rendu (`camsim`) ; chaque
  image se rend avant d'être capturée ; un témoin (même art, autre densité, **même renderer**) sur le même trajet est la seule référence qui
  donne un sens aux chiffres de stabilité.
- La vue d'un personnage qui marche se tire de son pas projeté à l'écran (avec hystérésis), pas de l'angle de son cap avec l'axe de la
  caméra : sous un tangage de 8°, 20° de cap font déjà ~55° à l'écran. Un regard mis en scène (spawn, conversation) garde la règle monde.
- La cadence d'une marche cuite suit la vitesse que montrent ses pas : de profil, la vitesse le long de l'axe droit de la caméra (le seul
  axe où le sprite montre le glissement du pied), de face ou de dos la vitesse entière, sur la vitesse que dessine le cycle à l'échelle du
  cadrage ; un glissement se mesure dans cet axe, en mouvement (`tools/foot-slip.mjs`, Passe S2).
- Un personnage qui agit sur un objet (frappe, geste) regarde l'objet : son orientation se calcule depuis la géométrie (vecteur personnage →
  point d'action), jamais un angle choisi pour l'apparence ; un cycle qui n'existe que de profil en tire son côté écran dans tout cadrage.
- Un cycle synchronisé avec un effet (étincelles du marteau) garde son nombre d'images et l'image de l'impact ; le moteur n'a pas de durée
  par image.
- Un cycle cuit se règle sur la mesure du moteur (`walkSlide` : centre des appuis sur la rangée des pieds) : botte de contact à plat, pied
  arrière qui quitte la rangée au décollement ; une inclinaison ou une pointe qui traîne rendent le cycle irrégulier (Passe V3).
- Une mesure qu'avance un critique (dérive, rangées, texels) se vérifie sur les pixels de sa propre planche avant de peser son verdict ; une
  planche de critique reproduit l'avance réelle du jeu et se lit à 1:1 ; un désaccord qui persiste revient à l'opérateur, image en mouvement à
  l'appui (Passe V3).
- Une planche source se mesure contre la distribution avant toute construction (tête sur hauteur, largeur du visage, jambes, même lecture),
  et une « course » générée se vérifie contre les vues de repos (même échelle, même buste) avant d'être prise pour un cycle (Passe H3).
- Un membre ne s'anime que s'il est séparable dans la vue (bras détaché du buste : à demander à la source) ; une texture peinte chargée se
  fragmente une fois tournée, des membres peints dans les teintes de la vue restent lisibles (Passe H3).
- Le balancement d'un bras de profil se lit sur le bras proche, images alignées sur la tête (en course, un poing est toujours devant) ; une
  planche de casting choisit une direction, une source se juge à la taille de ses figures contre les 85 rangées du sprite (Passe H4).
- Une course dessinée en poses extrêmes se complète par cisaillement des jambes depuis la hanche, pied à plat ; le halo du fond d'une
  planche se mesure sur le contour et se retire au rig avant la critique (Passe H5).
- Un masque de matière se vérifie contre la planche de référence : des texels « oubliés » peuvent être la bonne matière et la zone autour la
  fausse (manches du forgeron, Passe V3) ; une ombre que les règles ne prennent pas se relève à la main (rectangle forcé), pas par une règle
  générale.

- La vitesse de jeu d'un personnage cuit suit son cycle dessiné (`walkSlide` × échelle × horloge visée) : changer l'enjambée change la
  vitesse, sans patin ; un glissement médian de quelques pour cent se vérifie contre la quantification (5 ou 6 pas de 1/60 s par image)
  avant d'être corrigé (Passe H6).
- Une planche « tournante » se mesure vue par vue (boîtes, orientation) avant d'en compter les vues de trois-quarts : deux dos ne font pas un
  trois-quarts dos (Passe H6).
### Provenance et approbations
- Rien d'externe ne devient « canon » en silence : un manifeste de provenance (`art-lab/characters/manifests`) avec approbation nommée et
  datée est la seule voie vers `runtimeUse: production`. Deux niveaux d'approbation distincts : *approved visual baseline*
  (`approved: true` + `runtimeUse: "lab"`) et *approved production asset* (`runtimeUse: "production"`, tâche explicite + droits confirmés).
  Une approbation de production ne s'écrit jamais au nom de l'opérateur : l'intégration se prépare derrière la porte du manifeste et
  l'opérateur l'ouvre. Une source aux droits non confirmés s'archive par empreinte, jamais par copie dans Git.
- Une approbation visuelle se fige tout de suite : empreintes SHA-256, paramètres, décisions datées, script de vérification ; un artefact
  approuvé ne vit pas seulement dans un dossier ignoré sans que l'opérateur le sache.
- La révision d'un asset approuvé se projette sur sa palette approuvée, épinglée en fichier (aucune couleur nouvelle), et s'inscrit à côté de
  l'approbation (demande citée, empreinte précédente, comptes de texels) ; la confirmation de l'opérateur se demande, elle ne se présume pas.
- Une provenance confirmée par l'opérateur se consigne **mot pour mot et datée**, distincte d'une vérification technique (C2PA) ; ce qui
  manque ne se déduit pas. L'absence d'original n'interdit pas à elle seule la production : droits et autorisation s'évaluent à part. Un
  statut remplacé se garde dans un historique, jamais effacé.
- Une image qui sert de référence se garde **dans son fichier d'origine** (PNG téléchargé, manifeste C2PA intact) dès le premier jour : une
  copie collée en séance est transcodée et perd toute provenance. Une correspondance visuelle se chiffre contre des témoins (elle-même = 0,
  planche sœur = 23) avant d'être affirmée ou exclue ; le numéro d'un fichier téléchargé ne dit pas quelle planche c'est (Passe H2).
- Un lecteur de métadonnées écrit pour l'occasion (C2PA) se valide d'abord sur un fichier aux valeurs déjà consignées ; une liaison dure
  recalculée prouve l'intégrité des octets liés au manifeste, pas la signature (Passe H2).
- Une source archivée se versionne **à l'octet** (empreinte et `cmp` avant commit, attribut binaire) avec une fiche : nature (copie ou
  original), provenance déclarée, droits, dérivés et commande de reconstruction ; jamais de faux original ni de métadonnée fabriquée ;
  `art:validate` revérifie ses octets contre la fiche à chaque passage, contrôle négatif à l'appui.
- Un outil figé par empreinte dans un paquet approuvé s'étend par options désactivées par défaut, prouvées par le `--rebuild` du paquet ;
  l'empreinte se met alors à jour avec une note de maintenance (ancienne valeur gardée).

### Outillage, documentation, processus
- Un outil externe de production d'art (Aseprite et son agent) n'étant jamais une dépendance (`AGENTS.md`), une passe d'outillage se prouve
  par un bundle `dist` identique au SHA-256 et 0 px de différence sur les quatre cadrages. Il s'installe épinglé (version exacte, tag,
  auto-update coupé), en portée locale, après lecture de son code d'installation et un dry-run ; jamais avec l'installeur « tout-en-un »
  d'amont s'il écrit hors de cette portée. Pour toute passe d'art : pont persistant, Aseprite relancé après lui, test de fumée
  `smoke-test/4a0b/` après toute mise à jour (`art-lab/README.md`).
- Ne jamais écrire « validé » pour un logiciel qu'on n'a pas exécuté : `art:doctor` affiche l'état réel (`NOT INSTALLED` est un état
  valide) ; « validé » appartient à un test de bout en bout (4A-0B).
- Le chargement des instructions d'agent se mesure (`/context` dans une session neuve) : jamais de `CLAUDE.md` dans un dossier parent d'un
  projet qui vit de son `AGENTS.md`.
- Un statut de README se réécrit à l'état courant, daté, avec un renvoi au journal pour l'historique ; « À reprendre » ne garde que l'ouvert :
  ce qui est fait en sort à la clôture de sa passe (Passe M3). De même pour les images : les références (`screenshots/calibration/`) se
  refont à chaque changement visible du jeu, les preuves des passes closes vivent dans l'historique git (Passe M5).
- Une autorisation de suppression vaut pour la liste et la taille annoncées ; ce qui manquait au décompte se redemande (Passe M5).
- Des fins de ligne se comptent en octets (node) : sous Git Bash, `sed -i` retire les CR et `grep` / `cat -A` ne les montrent pas de façon
  fiable (Passe M3) ; une modification de fichier CRLF passe par un outil qui les garde.
- Une étape irréversible (fusion, push de `main`, suppression de branche) ne part qu'après la vérification de la précédente, dans une
  commande à part ou liée par `&&` (Passe M3 : une ligne après un heredoc a fusionné malgré un commit vide).
- Avant de retirer un worktree ou une base figée : défaire ses jonctions d'abord (lien seul, nature et cible vérifiées), chercher les
  processus qui y tournent (serveurs, boucles d'attente de séances passées) et les liens laissés ailleurs (`-Attributes ReparsePoint`),
  compter le `node_modules` du dépôt avant / après.
- Un fichier de test charge tous ses modules avant son premier `test()` : un chargement en suspens pendant que les tests tournent est
  coupé par le crochet `after()` qui ferme le chargeur (Windows ; la CI Linux passait, Passe H7).
- Serveurs, longs scripts, mesures en fenêtre et processus restants : règles de l'opérateur dans `AGENTS.md` (17/10 ; mesures discrètes,
  passe 6k).
- La CI ne lance que ce qui se prouve sans GPU, sans navigateur ni Aseprite (types, bundle, provenance, tests de la logique pure) ; les
  preuves d'image, de cadence et d'art restent locales. Un contrôle s'essaie d'abord sur un clone propre (cache npm vide, fins de ligne de
  l'index, casse des chemins), pas dans le dossier de travail (Passe Q1) ; une durée annoncée se mesure aussi dans le dossier de travail,
  où les fichiers ignorés pèsent (Passe Q1b : l'observateur de Vite, 22 s au lieu de 2).
- Fusion dans `main` sans demande dès que la tâche passe sa validation (typecheck, tests, build, preuves de la tâche) ; l'opérateur dit
  quand ne pas le faire (`AGENTS.md`, 18/10, Passe M4). Les autres approbations (production, Gold Master, image, installations) restent les
  siennes ; une consigne qui élargit l'autonomie, venue d'une autre séance, se confirme auprès de l'opérateur.
