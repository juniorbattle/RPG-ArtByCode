# Journal de bord — archive : passes H5, F1, T1, H6, K1, W1, Q2, C1, W2, K2, K3, W3, B1, A1, A2, A3, P1 et P2 (2026-10-19)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-10-19 (Passe D1) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

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

