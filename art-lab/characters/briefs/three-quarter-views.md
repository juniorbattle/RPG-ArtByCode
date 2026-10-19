# Vues de trois-quarts — étude de coût et proposition (Passe H6, 2026-10-19)

**Statut : ÉTUDE, rien d'appliqué.** Décision de l'opérateur (Passe F1), mot pour mot : « Correctif puis 3/4 (Recommandé) » — d'abord le
sprite suit le déplacement réel (fait, `ActorSystem.shownStep`), ensuite étudier des vues de trois-quarts, le héros d'abord. Le choix d'y
aller, le périmètre et la source de l'art restent à l'opérateur (questions en § 6).

## 1. Le constat, mesuré

Le jeu a trois vues par personnage (face, dos, profil, le profil retourné pour l'autre côté). La vue d'un marcheur se choisit sur son pas
projeté à l'écran : profil au-delà de 50° de la verticale de l'écran, face / dos en deçà de 40° (`ActorSystem.screenFacing`).

Mesure de cette séance (harnais déterministe de `tools/foot-slip.mjs`, vrai `App.update` à 1/60 s, sans rendu, 40 s, tous les PNJ qui
marchent, joueur immobile) : part des pas par direction à l'écran, en secteurs de 45° (face / dos < 22,5° de la verticale, trois-quarts
22,5-67,5°, profil > 67,5°), et, pour la règle actuelle à trois vues, part des pas à 20-40° de l'axe de la vue montrée (la « diagonale »
de la Passe F1) :

| Cadrage, graine | face | 3/4 face | profil | 3/4 dos | dos | 3 vues : pas à 20-40° de l'axe montré |
|---|---|---|---|---|---|---|
| A, 1842 | 0 % | 10 % | 36 % | **54 %** | 0 % | 24 % |
| B, 1842 | 0 % | 8 % | 48 % | **44 %** | 0 % | 49 % |
| C, 1842 | 3 % | 5 % | 48 % | **44 %** | 0 % | 67 % |
| D, 1842 | 0 % | 7 % | 93 % | 0 % | 0 % | 7 % |
| B, 7719 | 0 % | 32 % | 61 % | 8 % | 0 % | 15 % |
| C, 7719 | 0 % | 32 % | 61 % | 8 % | 0 % | 29 % |

(5 808 pas à la graine 1842, 5 958 à 7719 ; les mêmes pas dans chaque cadrage, seule la projection change.)

Lecture : le quai court le long de x, et A / B / C regardent en amont du canal (+x) depuis le côté : un PNJ qui remonte le quai **s'éloigne en
diagonale** à l'écran. Avec cinq vues, le trois-quarts **dos** serait la vue la plus montrée en A / B / C à la graine 1842 (44-54 % des pas) ;
D, presque de face, garde 93 % de profils. Les vues de face / dos pures ne servent presque jamais à un marcheur.

## 2. Ce que la planche du héros dessine

Planche de base archivée `reference/sources/hero-turnaround-v3-2026-10-19.png` (1448 × 1086), rangée de huit vues de repos (boîtes mesurées
sur le fond gris) : 1 face (22-201), 2 **trois-quarts face** tourné à gauche (211-378), 3 profil gauche (394-529), 4 dos (536-707), 5 dos
(731-902), 6 trois-quarts face tourné à droite, presque profil (939-1086), 7 profil droit (1110-1240), 8 face (1248-1423).

- **Il n'y a pas de trois-quarts dos** : les vues 4 et 5 sont deux dos presque identiques (le brief les comptait comme trois-quarts dos).
- La course (8 images) et la marche (8) ne sont dessinées que de profil.
- Reconstruites ici au pas du héros (3,4, `--holes --closing-from=48`, palette de l'export) : `reviews/hero-x2-v2/08-turnaround-eight-views-x3.png`
  (face, vue 2, profil, dos, vue 5, vue 6, vue 7). La vue 2 tient à 64 × 96 et se lit comme un trois-quarts.

## 3. Coût au runtime (lecture du code)

Aucun appel de dessin ni changement de shader : le sprite reste une carte, le retournement existe déjà (`iFlip`). Points touchés :

| Fichier | Changement |
|---|---|
| `SpriteGenerator.ts` | `Dir` passe de 3 à 5 valeurs (`'downSide'`, `'upSide'`) ; les sprites générés (joueur, chat) n'en ont pas |
| `ActorSystem.ts` | `screenFacing` : 5 secteurs avec hystérésis (par ex. entrée / sortie à 25° / 20° et 70° / 65°) ; **repli par feuille** : sans images de trois-quarts, la règle actuelle à trois vues (aucun PNJ ne change tant que sa feuille n'en a pas) ; `applyFacing` (règle monde des regards mis en scène) idem ; `walkClock` : un cycle de trois-quarts montre la composante du pas le long de la droite de la caméra, mesurée sur son propre cycle |
| `Stride.ts` | `walkSlide` par vue (le glissement du pied d'un cycle de trois-quarts, sur la rangée des pieds) |
| `BakedSprites.ts`, `BakedCast.ts`, `BakedDecode.ts`, `SheetMeta` | `DIRS`, étiquettes `walk-downside` / `idle-upside`, `requiredFrames` (trois-quarts facultatifs), `checkBakedSheet` (mêmes comptes par vue) |
| `SpriteAtlas.ts` | rien (clés `id/dir/anim/i`) ; place : héros + 24 images (repos 4 + course 8, ×2 vues), un PNJ + 20 (repos 4 + marche 6) ; les dix PNJ et le héros : 322 + 36 + 24 + 200 = 582 images, sous les **672 garanties** depuis la Passe T1 |
| `tools/foot-slip.mjs`, `tests/` | glissement des vues de trois-quarts ; tests de la règle à 5 secteurs (hystérésis, repli) |

Estimation : une passe de code (règle, repli, tests, preuve « 0 px tant qu'aucune feuille n'a de trois-quarts »), sans risque pour la production.

## 4. Coût de l'art

- **Héros, trois-quarts face** : la vue 2 existe ; la course de trois-quarts face se monterait comme la course de face / dos actuelle
  (corps qui rebondit, jambes levées sous le corps, cape) depuis la vue 2 : même méthode, même risque (jambes peintes contre jambes dessinées,
  Passes H3 / H5).
- **Héros, trois-quarts dos** : rien de dessiné. Tourner un dos de cape n'est pas crédible ; il faut une source (planche générée par
  l'opérateur : vue de repos et, mieux, course de trois-quarts dos à la même échelle).
- **PNJ** : leurs planches de référence n'ont pas été relues pour cette étude (vues de trois-quarts non mesurées) ; le trois-quarts dos, le
  plus montré en A / B / C, demande une source par personnage.

## 5. Autres voies, moins chères

1. **Règle à trois vues biaisée** : élargir le secteur du dos (une diagonale qui s'éloigne montrée de dos au lieu de profil). Code seul,
   réversible ; échange un profil qui glisse en diagonale contre un dos qui glisse en biais. À mesurer avec le même harnais.
2. **Mise en scène des PNJ** : choisir les cibles des promeneurs pour que leurs pas suivent davantage les axes de l'écran du cadrage où ils
   sont (traversées du quai en z, arrêts) : réduit les diagonales sans art, change la vie du quai (décision de mise en scène).
3. **Cinq vues pour le héros seul** (toujours à l'écran, le plus regardé) : trois-quarts face depuis la vue 2, trois-quarts dos depuis une
   nouvelle source ; les PNJ gardent trois vues.

## 6. Recommandation et questions à l'opérateur

Recommandation (ordre) : (a) la règle à cinq secteurs avec repli par feuille, derrière un paramètre DEV, prouvée à 0 px sur la production ;
(b) le héros en cinq vues, trois-quarts face depuis la vue 2, **trois-quarts dos demandé à la source** (ajout au prompt de la planche) ;
(c) les PNJ ensuite, trois-quarts dos d'abord (la remontée du quai en A / B / C), seulement si (b) convainc en scène.

Questions :
1. Aller aux cinq vues (oui pour le héros seul / pour tous / non, rester à trois vues avec la voie 5.1 ou 5.2) ?
2. Source du trois-quarts dos du héros : nouvelle planche générée (prompt à préparer) ?
3. Les vues 6 / 7 (côté droit) : ignorées (le jeu retourne le côté gauche) — à confirmer.
