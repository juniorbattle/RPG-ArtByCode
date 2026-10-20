# Requête locale 001 — budget technique : les temps GPU des pages du mode jouable
- Type : gpu
- Lot : L7
- Branche et commit de base : claude/pensive-pasteur-lbz4ji @ (le commit qui pousse ce fichier ; `main` est à 7b7a966, même code de jeu)
- Demande : mesurer sur la Radeon 780M de l'opérateur les temps GPU par passe des pages du mode jouable, à côté de la nuit par défaut, en une
  seule série entrelacée (contrat projet § 14 : « budget technique mesuré » ; § 16 : « elle respecte le budget de performance »).
- Entrées : un serveur de développement de ce commit (`npm run dev`, ou une copie figée sur un autre port ; les états nommés `state=` sont
  DEV seulement), puis, sans autre onglet du jeu ouvert (principe de la Passe R3) :

  ```
  node tools/perf.mjs --secs=4 --warm=2.5 --rounds=3 --size=1920x1080 \
    "night-B|seed=1842&clean=1&camera=B" \
    "play-morning|play=1&noreload=1&state=day1-morning&name=Aster" \
    "play-midday|play=1&noreload=1&state=day2-afternoon&name=Aster" \
    "play-dusk|play=1&noreload=1&state=day2-dusk-won&name=Aster" \
    "play-bout|play=1&noreload=1&state=day2-afternoon&scene=arena&name=Aster" \
    "play-forecourt|play=1&noreload=1&state=forecourt-morning&name=Aster" \
    "play-lanterns|play=1&noreload=1&state=lanterns-night&name=Aster" \
    "arena|scene=arena"
  ```

  et, si le temps le permet, la même série en `--size=2560x1440`.
- Sorties attendues : la sortie de `perf.mjs` recopiée ci-dessous (l'adaptateur, le GPU ms moyen et p95 par variante, les passes, les appels de
  dessin, les triangles, les tours signalés par le témoin de contention) ; la date et l'heure de la mesure.
- Repli si elle n'aboutit pas : le bilan (Passe L7) donne les compteurs mesurés dans le cloud (appels de dessin, triangles, lumières, coût de
  `advance` en Node) et inscrit les temps GPU comme à mesurer sur la machine de l'opérateur, avec cette commande.
- Statut : ouverte

## Réponse
(écrite par la séance locale)
