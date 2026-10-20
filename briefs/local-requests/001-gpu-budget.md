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
- Statut : répondue (2026-10-20, séance locale, Passe Q4 ; remesure sans Firefox, Passe Q4b)

## Réponse
### Remesure, Firefox arrêté : 1920 × 1080 et cadence (2026-10-20, 17 h 16 - 17 h 25, Passe Q4b)
- L'opérateur : « Firefox est fermé : refais la série 001 en 1080p (et la cadence) avec le témoin, puis mets à jour la réponse et le journal. »
  Le processus `firefox` 10840 tournait encore (30 % de la 780M à 16 h 59) ; à la question posée, l'opérateur a choisi « Arrête-le (PID
  10840) ». Il a été arrêté seul (`Stop-Process -Id 10840`, nom et heure de lancement revérifiés juste avant) ; il n'est plus reparu.
- **Autre contention, plus courte** : pendant la remesure, une autre séance (projet RPGCards) lançait des Chrome sans fenêtre, par à-coups
  jusqu'à 94 % de la 780M. Un journal complet du témoin (166 échantillons) dit, tour par tour, lesquels sont **vraiment calmes** (aucun autre
  programme au-dessus de 5 % pendant le tour) ; le minimum des tours reste l'estimation sans contention pour les autres pages.
- Même serveur, même commande, 5 tours ; aucun onglet du jeu ouvert ; série et cadence en arrière-plan, attendues jusqu'au bout.

| 1920 × 1080 | tours calmes | minimum | écart à la nuit B (minimum) | médiane des 5 tours [min-max] | sous le seuil de 15 % |
|---|---|---|---|---|---|
| night-B | 10,72 ; 10,57 | 10,57 | — | 13,03 [10,57-14,38] | 2 / 5 |
| play-morning | 8,74 | 8,74 | −17 % | 11,20 [8,74-11,46] | 4 / 5 |
| play-midday | 9,08 | 9,08 | −14 % | 9,47 [9,08-11,56] | 1 / 5 |
| play-dusk | — | 9,42 | −11 % | 9,98 [9,42-11,97] | 2 / 5 |
| play-bout | — | 9,82 | −7 % | 11,04 [9,82-11,85] | 1 / 5 |
| play-forecourt | 9,19 | 9,02 | −15 % | 9,34 [9,02-14,09] | 3 / 5 |
| play-lanterns | 9,30 | 9,30 | −12 % | 9,89 [9,30-11,65] | 1 / 5 |
| arena | — | 9,24 | −13 % | 10,69 [9,24-13,21] | 2 / 5 |

- **La nuit par défaut retrouve la Passe G1** : 10,57 et 10,72 ms sur ses deux tours calmes, contre 10,81 [9,88-10,95] à la Passe G1 ; dans
  les 10-12 ms de la Passe 6. L'excès de +3 ms de la première mesure était bien la contention de Firefox.
- **Les pages du mode jouable tiennent le budget** : 8,74 à 9,30 ms sur leurs tours calmes (matin, midi, parvis, Lantern Row), 9,24 à 9,82 ms
  de minimum pour les trois autres (fin de journée, duel, arène) ; toutes sous la nuit par défaut (−7 à −17 % sur les minima). L'arène :
  9,24 ms, contre 9,30 à la Passe G1.
- L'estimation de la première mesure (9,4 à 10,6 ms) était un peu haute.
- **Cadence** (`max`, plafond `a60`) : **55,0 images/s, 3 vsyncs 100 %, aucun changement de pas**, sur la nuit B et les trois pages de jeu, aux
  deux tours, même pendant les à-coups de l'autre séance (signalés par le témoin) ; SoC 30,5 à 39,4 W. C'est le cas calme de la Passe 6h.
- Non refait : la série 2560 × 1440 et le démarrage (ci-dessous, sous Firefox) ; le démarrage ne dépend guère du GPU partagé.

**Série 1920 × 1080, 5 tours, Firefox arrêté** :

```
start 2026-10-20 17:16:08 -0400
[r1] night-B                  1920x1080 MSAA4  GPU 10.72  (p95 13.20) [scene 6.81 | air 0.56 | dof 1.05 | bloom 1.03 | grade 0.37 | reflection 0.90]  frame p50 10.8  js upd 0.42 ren 10.04  draws 107  tris 211.1k  lights 24/24
[r1] play-morning             1920x1080 MSAA4  GPU 9.85  (p95 12.03) [scene 6.58 | air 0.52 | dof 0.94 | bloom 0.63 | grade 0.36 | reflection 0.82]  frame p50 8.9  js upd 0.42 ren 9.16  draws 107  tris 213.2k  lights 4/24
[r1] play-midday              1920x1080 MSAA4  GPU 9.08  (p95 10.75) [scene 6.01 | air 0.47 | dof 0.94 | bloom 0.56 | grade 0.35 | reflection 0.76]  frame p50 8.6  js upd 0.44 ren 8.43  draws 107  tris 213.2k  lights 4/24
[r1] play-dusk                1920x1080 MSAA4  GPU 9.42  (p95 14.43) [scene 6.10 | air 0.55 | dof 0.94 | bloom 0.70 | grade 0.32 | reflection 0.81]  frame p50 8.0  js upd 0.41 ren 8.80  draws 107  tris 213.2k  lights 4/24
[r1] play-bout                1920x1080        GPU 11.82* (p95 16.50) [reflection 1.34 | scene 7.28 | air 0.64 | dof 0.93 | bloom 1.27 | grade 0.35]  frame p50 10.4  js upd 0.33 ren 11.51  draws 92  tris 133.3k  lights 21/23  foreign chrome:23108:30%,chrome:23108:22%
[r1] play-forecourt           1920x1080        GPU 14.09* (p95 19.40) [scene 8.62 | air 0.71 | dof 1.10 | bloom 1.16 | grade 0.36 | reflection 2.14]  frame p50 13.6  js upd 0.32 ren 13.99  draws 92  tris 133.3k  lights 21/23  foreign chrome:23108:35%,chrome:23108:34%
[r1] play-lanterns            1920x1080        GPU 11.65* (p95 16.34) [scene 7.30 | air 0.66 | dof 1.23 | bloom 1.14 | grade 0.30 | reflection 1.02]  frame p50 11.8  js upd 0.08 ren 11.47  draws 106  tris 188.5k  lights 12/12  foreign chrome:23108:32%,chrome:23108:21%
[r1] arena                    1920x1080        GPU 13.21* (p95 17.42) [reflection 1.77 | scene 7.86 | air 0.72 | dof 0.98 | bloom 1.52 | grade 0.35]  frame p50 11.6  js upd 0.47 ren 12.77  draws 92  tris 133.3k  lights 21/23  foreign chrome:23108:32%,chrome:23108:31%,chrome:23108:28%
[r2] night-B                  1920x1080 MSAA4  GPU 10.57  (p95 12.63) [scene 6.97 | air 0.51 | dof 0.99 | bloom 0.94 | grade 0.34 | reflection 0.83]  frame p50 9.9  js upd 0.57 ren 9.50  draws 107  tris 211.1k  lights 24/24
[r2] play-morning             1920x1080 MSAA4  GPU 11.20  (p95 17.57) [scene 7.06 | air 0.67 | dof 0.97 | bloom 1.12 | grade 0.32 | reflection 1.05]  frame p50 11.6  js upd 0.44 ren 10.52  draws 107  tris 213.2k  lights 4/24
[r2] play-midday              1920x1080 MSAA4  GPU 11.56* (p95 16.69) [bloom 1.10 | grade 0.34 | reflection 1.08 | scene 7.41 | air 0.64 | dof 0.99]  frame p50 11.0  js upd 0.46 ren 10.90  draws 107  tris 213.2k  lights 4/24  foreign chrome:30052:30%
[r2] play-dusk                1920x1080 MSAA4  GPU 11.97* (p95 15.86) [air 0.73 | dof 0.96 | bloom 1.13 | grade 0.33 | reflection 1.39 | scene 7.43]  frame p50 12.0  js upd 0.43 ren 11.59  draws 107  tris 213.2k  lights 4/24  foreign chrome:30052:32%,chrome:30052:28%
[r2] play-bout                1920x1080        GPU 11.85* (p95 15.78) [scene 7.38 | air 0.67 | dof 0.94 | bloom 1.22 | grade 0.36 | reflection 1.29]  frame p50 10.5  js upd 0.32 ren 11.53  draws 92  tris 133.3k  lights 21/23  foreign chrome:30052:23%,chrome:30052:30%
[r2] play-forecourt           1920x1080        GPU 9.02  (p95 10.29) [reflection 0.68 | scene 5.92 | air 0.48 | dof 0.97 | bloom 0.65 | grade 0.33]  frame p50 9.3  js upd 0.39 ren 8.24  draws 92  tris 133.3k  lights 21/23
[r2] play-lanterns            1920x1080        GPU 9.89* (p95 14.59) [scene 6.17 | air 0.52 | dof 1.17 | bloom 0.99 | grade 0.30 | reflection 0.74]  frame p50 10.6  js upd 0.08 ren 9.54  draws 106  tris 188.5k  lights 12/12  foreign chrome:12192:29%
[r2] arena                    1920x1080        GPU 10.48* (p95 15.60) [bloom 1.08 | grade 0.33 | reflection 1.06 | scene 6.56 | air 0.51 | dof 0.94]  frame p50 9.5  js upd 0.45 ren 9.84  draws 92  tris 133.3k  lights 21/23  foreign chrome:12192:30%
[r3] night-B                  1920x1080 MSAA4  GPU 13.03* (p95 17.22) [reflection 1.54 | scene 8.12 | air 0.81 | dof 0.92 | bloom 1.30 | grade 0.34]  frame p50 13.6  js upd 0.49 ren 12.52  draws 107  tris 211.1k  lights 24/24  foreign chrome:12192:25%
[r3] play-morning             1920x1080 MSAA4  GPU 11.46* (p95 15.32) [scene 7.06 | air 0.70 | dof 0.94 | bloom 1.02 | grade 0.30 | reflection 1.43]  frame p50 11.3  js upd 0.41 ren 11.13  draws 107  tris 213.2k  lights 4/24  foreign chrome:12192:28%,chrome:12192:25%
[r3] play-midday              1920x1080 MSAA4  GPU 9.47* (p95 14.47) [bloom 0.71 | grade 0.34 | reflection 0.83 | scene 6.13 | air 0.50 | dof 0.96]  frame p50 8.5  js upd 0.47 ren 8.78  draws 107  tris 213.2k  lights 4/24  foreign chrome:12192:28%
[r3] play-dusk                1920x1080 MSAA4  GPU 10.23* (p95 14.57) [scene 6.60 | air 0.53 | dof 0.94 | bloom 0.80 | grade 0.33 | reflection 1.04]  frame p50 9.5  js upd 0.46 ren 9.62  draws 107  tris 213.2k  lights 4/24  foreign chrome:12192:28%,chrome:12192:16%
[r3] play-bout                1920x1080        GPU 11.04* (p95 15.41) [scene 6.88 | air 0.61 | dof 0.99 | bloom 1.02 | grade 0.31 | reflection 1.22]  frame p50 10.1  js upd 0.32 ren 10.59  draws 92  tris 133.3k  lights 21/23  foreign chrome:12192:27%
[r3] play-forecourt           1920x1080        GPU 12.00* (p95 16.28) [scene 7.50 | air 0.69 | dof 0.96 | bloom 1.24 | grade 0.32 | reflection 1.29]  frame p50 11.0  js upd 0.40 ren 11.67  draws 92  tris 133.3k  lights 21/23  foreign chrome:12192:31%,chrome:12192:25%
[r3] play-lanterns            1920x1080        GPU 9.39* (p95 11.97) [scene 5.88 | air 0.51 | dof 1.17 | bloom 0.83 | grade 0.29 | reflection 0.70]  frame p50 11.1  js upd 0.09 ren 8.95  draws 106  tris 188.5k  lights 12/12  foreign chrome:12192:22%
[r3] arena                    1920x1080        GPU 10.69  (p95 15.31) [grade 0.31 | reflection 0.96 | scene 6.62 | air 0.59 | dof 0.96 | bloom 1.24]  frame p50 9.3  js upd 0.49 ren 9.95  draws 92  tris 133.3k  lights 21/23
[r4] night-B                  1920x1080 MSAA4  GPU 13.40* (p95 17.45) [bloom 1.39 | grade 0.32 | reflection 1.60 | scene 8.46 | air 0.71 | dof 0.93]  frame p50 12.1  js upd 0.46 ren 12.83  draws 107  tris 211.1k  lights 24/24  foreign chrome:4872:26%,chrome:4872:29%
[r4] play-morning             1920x1080 MSAA4  GPU 8.74  (p95 9.72) [scene 5.85 | air 0.44 | dof 0.91 | bloom 0.51 | grade 0.31 | reflection 0.72]  frame p50 7.9  js upd 0.39 ren 8.08  draws 107  tris 213.2k  lights 4/24
[r4] play-midday              1920x1080 MSAA4  GPU 9.18* (p95 14.80) [scene 5.95 | air 0.51 | dof 0.94 | bloom 0.63 | grade 0.33 | reflection 0.81]  frame p50 8.5  js upd 0.44 ren 8.49  draws 107  tris 213.2k  lights 4/24  foreign chrome:4872:17%
[r4] play-dusk                1920x1080 MSAA4  GPU 9.98* (p95 14.79) [reflection 0.98 | scene 6.42 | air 0.52 | dof 0.94 | bloom 0.78 | grade 0.35]  frame p50 9.5  js upd 0.45 ren 9.46  draws 107  tris 213.2k  lights 4/24  foreign chrome:4872:25%
[r4] play-bout                1920x1080        GPU 10.27* (p95 15.11) [reflection 1.07 | scene 6.55 | air 0.53 | dof 0.97 | bloom 0.83 | grade 0.32]  frame p50 10.3  js upd 0.32 ren 9.78  draws 92  tris 133.3k  lights 21/23  foreign chrome:4872:29%
[r4] play-forecourt           1920x1080        GPU 9.34  (p95 11.27) [reflection 0.72 | scene 6.15 | air 0.49 | dof 0.97 | bloom 0.68 | grade 0.33]  frame p50 9.3  js upd 0.37 ren 8.45  draws 92  tris 133.3k  lights 21/23
[r4] play-lanterns            1920x1080        GPU 11.33* (p95 16.00) [scene 6.87 | air 0.75 | dof 1.20 | bloom 1.14 | grade 0.29 | reflection 1.08]  frame p50 11.8  js upd 0.09 ren 11.32  draws 106  tris 188.5k  lights 12/12  foreign chrome:10288:25%,chrome:10288:16%
[r4] arena                    1920x1080        GPU 11.12* (p95 16.24) [scene 6.83 | air 0.62 | dof 0.94 | bloom 1.28 | grade 0.35 | reflection 1.10]  frame p50 8.9  js upd 0.53 ren 10.27  draws 92  tris 133.3k  lights 21/23  foreign chrome:10288:28%
[r5] night-B                  1920x1080 MSAA4  GPU 14.38* (p95 23.51) [reflection 1.67 | scene 8.93 | air 0.67 | dof 0.92 | bloom 1.85 | grade 0.32]  frame p50 13.6  js upd 0.49 ren 13.97  draws 107  tris 211.1k  lights 24/24  foreign chrome:10288:30%,chrome:10288:33%
[r5] play-morning             1920x1080 MSAA4  GPU 11.34  (p95 18.29) [scene 7.42 | air 0.63 | dof 1.03 | bloom 0.85 | grade 0.36 | reflection 1.05]  frame p50 9.6  js upd 0.66 ren 10.33  draws 107  tris 213.2k  lights 4/24
[r5] play-midday              1920x1080 MSAA4  GPU 10.55* (p95 15.85) [air 0.59 | dof 0.97 | bloom 0.73 | grade 0.35 | reflection 1.05 | scene 6.85]  frame p50 9.2  js upd 0.65 ren 9.69  draws 107  tris 213.2k  lights 4/24  foreign chrome:10288:20%
[r5] play-dusk                1920x1080 MSAA4  GPU 9.71  (p95 12.29) [air 0.55 | dof 1.00 | bloom 0.67 | grade 0.36 | reflection 0.72 | scene 6.40]  frame p50 7.6  js upd 0.61 ren 8.81  draws 107  tris 213.2k  lights 4/24
[r5] play-bout                1920x1080        GPU 9.82  (p95 11.74) [bloom 0.85 | grade 0.34 | reflection 0.78 | scene 6.34 | air 0.53 | dof 0.98]  frame p50 9.4  js upd 0.41 ren 9.09  draws 92  tris 133.3k  lights 21/23
[r5] play-forecourt           1920x1080        GPU 9.19  (p95 11.30) [dof 0.94 | bloom 0.73 | grade 0.33 | reflection 0.71 | scene 6.00 | air 0.48]  frame p50 9.5  js upd 0.40 ren 8.46  draws 92  tris 133.3k  lights 21/23
[r5] play-lanterns            1920x1080        GPU 9.30  (p95 10.76) [scene 5.85 | air 0.50 | dof 1.16 | bloom 0.83 | grade 0.29 | reflection 0.66]  frame p50 10.8  js upd 0.11 ren 8.87  draws 106  tris 188.5k  lights 12/12
[r5] arena                    1920x1080        GPU 9.24  (p95 10.93) [scene 5.87 | air 0.47 | dof 0.91 | bloom 0.96 | grade 0.32 | reflection 0.72]  frame p50 8.7  js upd 0.55 ren 8.38  draws 92  tris 133.3k  lights 21/23

adapter: ANGLE (AMD, AMD Radeon 780M Graphics (0x00001900) Direct3D11 vs_5_0 ps_5_0, D3D11)  (contention witness on, GPU process 13216, threshold 15 %)
=== over rounds: median [min-max], clean = median of the rounds without foreign GPU use ===
night-B                  1920x1080 MSAA4  GPU 13.03 [10.57-14.38] clean 10.72 (2/5) [scene 6.97 | air 0.56 | dof 1.05 | bloom 1.03 | grade 0.37 | reflection 0.90]  js upd 0.49 ren 12.52  draws 107  tris 211.1k  tex 51 (188 MB)  lights 24/24  gen 405 ms  {"set":"B","level":26,"parts":738,"tier3":330,"classes":36,"trisKept":98902,"trisTier3":25272,"bakeMs":14,"bakeCache":"hit","bakeKeyMs":12,"poses":329,"lightsOnScreen":24,"lightsCulled":0,"frame":1.7778,"bakePages":19,"bakeTargetMB":37.7}
play-morning             1920x1080 MSAA4  GPU 11.20 [8.74-11.46] clean 11.20 (4/5) [scene 7.06 | air 0.63 | dof 0.97 | bloom 0.85 | grade 0.36 | reflection 1.05]  js upd 0.42 ren 10.33  draws 107  tris 213.2k  tex 51 (188 MB)  lights 4/24  gen 419 ms  {"set":"B","level":26,"parts":738,"tier3":330,"classes":36,"trisKept":99930,"trisTier3":25272,"bakeMs":18,"bakeCache":"hit","bakeKeyMs":16.1,"poses":329,"lightsOnScreen":4,"lightsCulled":0,"frame":1.7778,"bakePages":19,"bakeTargetMB":37.7}
play-midday              1920x1080 MSAA4  GPU 9.47 [9.08-11.56] clean 9.08 (1/5) [scene 6.01 | air 0.47 | dof 0.94 | bloom 0.56 | grade 0.35 | reflection 0.76]  js upd 0.46 ren 8.78  draws 107  tris 213.2k  tex 51 (188 MB)  lights 4/24  gen 361 ms  {"set":"B","level":26,"parts":738,"tier3":330,"classes":36,"trisKept":99930,"trisTier3":25272,"bakeMs":21,"bakeCache":"hit","bakeKeyMs":18.4,"poses":329,"lightsOnScreen":4,"lightsCulled":0,"frame":1.7778,"bakePages":19,"bakeTargetMB":37.7}
play-dusk                1920x1080 MSAA4  GPU 9.98 [9.42-11.97] clean 9.71 (2/5) [scene 6.40 | air 0.55 | dof 1.00 | bloom 0.70 | grade 0.36 | reflection 0.81]  js upd 0.45 ren 9.46  draws 107  tris 213.2k  tex 51 (188 MB)  lights 4/24  gen 377 ms  {"set":"B","level":26,"parts":738,"tier3":330,"classes":36,"trisKept":99930,"trisTier3":25272,"bakeMs":19,"bakeCache":"hit","bakeKeyMs":17.1,"poses":329,"lightsOnScreen":4,"lightsCulled":0,"frame":1.7778,"bakePages":19,"bakeTargetMB":37.7}
play-bout                1920x1080        GPU 11.04 [9.82-11.85] clean 9.82 (1/5) [reflection 0.78 | scene 6.34 | air 0.53 | dof 0.98 | bloom 0.85 | grade 0.34]  js upd 0.32 ren 10.59  draws 92  tris 133.3k  tex 47 (198 MB)  lights 21/23  gen 207 ms
play-forecourt           1920x1080        GPU 9.34 [9.02-14.09] clean 9.19 (3/5) [scene 6.00 | air 0.48 | dof 0.97 | bloom 0.68 | grade 0.33 | reflection 0.71]  js upd 0.39 ren 8.46  draws 92  tris 133.3k  tex 47 (195 MB)  lights 21/23  gen 318 ms
play-lanterns            1920x1080        GPU 9.89 [9.30-11.65] clean 9.30 (1/5) [scene 5.85 | air 0.50 | dof 1.16 | bloom 0.83 | grade 0.29 | reflection 0.66]  js upd 0.09 ren 9.54  draws 106  tris 188.5k  tex - (- MB)  lights 12/12  gen 172 ms
arena                    1920x1080        GPU 10.69 [9.24-13.21] clean 10.69 (2/5) [reflection 0.96 | scene 6.62 | air 0.59 | dof 0.96 | bloom 1.24 | grade 0.32]  js upd 0.49 ren 9.95  draws 92  tris 133.3k  tex 47 (195 MB)  lights 21/23  gen 201 ms
end 2026-10-20 17:21:45 -0400
```

**Cadence, Firefox arrêté** :

```
start 2026-10-20 17:22:40 -0400
display: vsync 6.100 ms (163.9 Hz), idle-page interval p5 6.00 / p95 6.20 ms
[1] idle page          pkg 19.8 W  soc 0.3 W
[1] night-B            2560x1267 MSAA4 (1463x724@1.75)  55.0 fps  interval p50 18.20 p95 18.80 max 19.8 ms  vsyncs 1/2/3/4/5+ 0/0/100/0/0 %  irregular 0.0 %  rAF without render 881/1322  GPU busy 88 % [87,89,88,87]  pkg 56.5 W  soc 35.2 W  cap a60 every 3 vsync 6.1 (probe) steps 0 trials undone 0 []  foreign chrome:24768:18%
[1] play-morning       2560x1267 MSAA4 (1463x724@1.75)  55.0 fps  interval p50 18.20 p95 19.10 max 20.6 ms  vsyncs 1/2/3/4/5+ 0/0/100/0/0 %  irregular 0.0 %  rAF without render 2205/2646  GPU busy 80 % [80,80,79,81]  pkg 51.1 W  soc 30.7 W  cap a60 every 3 vsync 6.1 (probe) steps 0 trials undone 0 []  foreign chrome:24768:17%
[1] play-midday        2560x1267 MSAA4 (1463x724@1.75)  55.0 fps  interval p50 18.20 p95 18.80 max 20.6 ms  vsyncs 1/2/3/4/5+ 0/0/100/0/0 %  irregular 0.0 %  rAF without render 2205/2646  GPU busy 87 % [87,84,86,89]  pkg 53.7 W  soc 31.4 W  cap a60 every 3 vsync 6.1 (probe) steps 0 trials undone 0 []
[1] play-dusk          2560x1267 MSAA4 (1463x724@1.75)  55.0 fps  interval p50 18.20 p95 18.90 max 22.8 ms  vsyncs 1/2/3/4/5+ 0/0/100/0/0 %  irregular 0.5 %  rAF without render 2204/2644  GPU busy 90 % [88,90,90,90]  pkg 52.5 W  soc 34.3 W  cap a60 every 3 vsync 6.1 (probe) steps 0 trials undone 0 []  foreign chrome:32196:26%,chrome:32196:28%,chrome:32196:30%
[2] idle page          pkg 12.7 W  soc 3.4 W
[2] night-B            2560x1267 MSAA4 (1463x724@1.75)  55.0 fps  interval p50 18.20 p95 18.60 max 22.7 ms  vsyncs 1/2/3/4/5+ 0/0/100/0/0 %  irregular 0.5 %  rAF without render 880/1321  GPU busy 95 % [95,95,96]  pkg 57.5 W  soc 39.4 W  cap a60 every 3 vsync 6.1 (probe) steps 0 trials undone 0 []  foreign chrome:32196:28%,chrome:32196:21%,chrome:32196:30%,chrome:32196:19%
[2] play-morning       2560x1267 MSAA4 (1463x724@1.75)  55.0 fps  interval p50 18.20 p95 18.70 max 25.7 ms  vsyncs 1/2/3/4/5+ 0/0/100/0/0 %  irregular 0.2 %  rAF without render 2200/2640  GPU busy 90 % [90,90,88]  pkg 50.8 W  soc 33.0 W  cap a60 every 3 vsync 6 (probe) steps 0 trials undone 0 []  foreign chrome:32196:26%,chrome:32196:35%,chrome:32196:16%,chrome:32196:17%
[2] play-midday        2560x1267 MSAA4 (1463x724@1.75)  55.0 fps  interval p50 18.20 p95 18.80 max 25.2 ms  vsyncs 1/2/3/4/5+ 0/0/100/0/0 %  irregular 0.5 %  rAF without render 2192/2632  GPU busy 91 % [87,92,91,88]  pkg 55.5 W  soc 30.5 W  cap a60 every 3 vsync 6.1 (probe) steps 0 trials undone 0 []  foreign chrome:39660:17%,chrome:39660:20%,chrome:39660:26%
[2] play-dusk          2560x1267 MSAA4 (1463x724@1.75)  55.0 fps  interval p50 18.20 p95 18.90 max 20.7 ms  vsyncs 1/2/3/4/5+ 0/0/100/0/0 %  irregular 0.0 %  rAF without render 2203/2644  GPU busy 82 % [82,83,81,82]  pkg 53.2 W  soc 31.8 W  cap a60 every 3 vsync 6.1 (probe) steps 0 trials undone 0 []  foreign chrome:39660:34%,chrome:39660:30%
end 2026-10-20 17:25:02 -0400
```

### Première mesure, sous la contention de Firefox (16 h 29 - 16 h 49, Passe Q4)
Séance locale, sur la machine de l'opérateur, le **2026-10-20 entre 16 h 29 et 16 h 49 (UTC−4)**, Passe Q4 du journal. Code mesuré :
`main` `94aa82f` (même code de jeu que `7b7a966` et que le commit de cette requête), branche de tâche `relay-gpu-q4`.

### Conditions
- Serveur DEV `dev-strict` (`.claude/launch.json`, :5186, `--strictPort`), lancé par `preview_start` ; `BASE_URL=http://127.0.0.1:5186/`.
- **Aucun onglet du jeu ouvert** : l'onglet que `preview_start` ouvre a été fermé aussitôt, le panneau navigateur est resté fermé (principe de
  la Passe R3).
- Chaque série lancée en arrière-plan et attendue jusqu'au bout dans le tour (principe de la Passe Y4).
- Adaptateur : `ANGLE (AMD, AMD Radeon 780M Graphics (0x00001900) Direct3D11 vs_5_0 ps_5_0, D3D11)`, pilote 32.0.21030.14003, Chrome
  155.0.8059.80, MSAA 4 (ville).
- Témoin de contention actif, seuil 15 %. La série 1080p a été passée en **5 tours** au lieu de 3 (voir la contention ci-dessous) ; la série
  2560 × 1440 en 3 tours, comme demandé.

### [?] Contention : un Firefox de l'opérateur sur la 780M pendant toute la séance
- Le processus `firefox` 10840 (ouvert depuis le 19/10 à 8 h 12, sans fenêtre propre : le processus GPU de Firefox) a occupé **13 à 38 % du
  moteur 3D de la 780M** sur toute la séance : médiane 17 % sur les 109 échantillons d'un journal complet du témoin tenu pendant la série
  1440p ; 19 à 36 % sur un contrôle de 12 s entre deux séries ; 29-30 % à la fin. Il n'a pas été touché (programme de l'opérateur).
- **Aucun tour n'est sans contention.** Les tours « clean » du tableau sont seulement ceux où Firefox est resté sous le seuil de 15 % (13 à
  15 %). Un tour de `play-midday` en 1080p est en plus marqué par l'application Claude elle-même (24 %).
- Les variantes sont entrelacées dans une seule session : la contention les touche toutes ; **la comparaison entre pages tient**, pas les
  temps absolus.

### Résultats (ms de GPU par image ; médiane [min-max] des tours ; écart à la nuit B de la même série, sur la médiane / sur le minimum)

| 1920 × 1080, 5 tours | GPU | tours sous le seuil | écart à la nuit B | appels | triangles | lumières allumées |
|---|---|---|---|---|---|---|
| night-B | 13,77 [13,44-16,45] | 2 / 5 | — | 107 | 211,1 k | 24 / 24 |
| play-morning | 12,63 [11,87-14,04] | 0 / 5 | −8 % / −12 % | 107 | 213,2 k | 4 / 24 |
| play-midday | 12,51 [12,15-16,37] | 1 / 5 | −9 % / −10 % | 107 | 213,2 k | 4 / 24 |
| play-dusk | 13,58 [12,90-14,02] | 0 / 5 | −1 % / −4 % | 107 | 213,2 k | 4 / 24 |
| play-bout | 12,82 [12,28-13,35] | 0 / 5 | −7 % / −9 % | 92 | 133,3 k | 21 / 23 |
| play-forecourt | 12,36 [12,17-13,55] | 1 / 5 | −10 % / −9 % | 92 | 133,3 k | 21 / 23 |
| play-lanterns | 12,52 [11,44-13,90] | 1 / 5 | −9 % / −15 % | 106 | 188,5 k | 12 / 12 |
| arena | 13,01 [12,27-17,12] | 1 / 5 | −5 % / −9 % | 92 | 133,3 k | 21 / 23 |

| 2560 × 1440, 3 tours | GPU | tours sous le seuil | écart à la nuit B |
|---|---|---|---|
| night-B | 22,25 [21,48-23,35] | 0 / 3 | — |
| play-morning | 20,05 [19,15-20,30] | 2 / 3 | −10 % / −11 % |
| play-midday | 20,44 [19,64-20,50] | 1 / 3 | −8 % / −9 % |
| play-dusk | 19,76 [19,50-20,24] | 0 / 3 | −11 % / −9 % |
| play-bout | 20,82 [19,97-21,03] | 1 / 3 | −6 % / −7 % |
| play-forecourt | 20,75 [19,84-21,40] | 2 / 3 | −7 % / −8 % |
| play-lanterns | 20,68 [19,25-20,89] | 1 / 3 | −7 % / −10 % |
| arena | 21,02 [20,53-21,89] | 0 / 3 | −6 % / −4 % |

### Lecture
- **Chaque page du mode jouable coûte au plus ce que coûte la nuit par défaut**, mesurée dans la même série : de −1 à −11 % sur la médiane,
  aux deux définitions. Les pages de jour gagnent leurs lumières éteintes (4 allumées sur 24 : la forge) ; l'arène et le parvis dessinent
  92 appels et 133 k triangles ; Lantern Row 106 appels et 12 lumières.
- **Contre les références** : la nuit B fait ici 13,77 ms en 1080p et 22,25 ms en 1440p, contre 10,81 [9,88-10,95] et 19,65 [18,60-20,04] à la
  Passe G1 (3 tours sur 3 propres), soit +3,0 et +2,6 ms. La Passe 6 donnait 10-12 ms et 16-21 ms. L'arène garde son rapport à la ville :
  −6 % à la Passe G1 (9,30 contre 9,88 ms), −5 % ici.
- **[?] Estimation sans contention, non vérifiée** : si l'excès de la nuit B tient tout entier à Firefox et pèse autant sur chaque page, les
  pages du jeu tiendraient 9,4 à 10,6 ms en 1080p et 17,2 à 18,2 ms en 1440p, dans le budget de la Passe 6. À remesurer Firefox fermé.
- `js ren` suit le temps GPU sur toutes les pages (12 ms en 1080p, 20 ms en 1440p) : dans ce harnais sans plafond, le rendu semble attendre le
  GPU. Hypothèse, non vérifiée ; ce n'est pas un coût CPU mesuré.

### `tools/perf.mjs` — [KO → corrigé] le résumé plantait sur Lantern Row
- Une première série de 3 tours en 1080p (16 h 29 - 16 h 32) a donné tous ses tours, puis le résumé s'est arrêté sur `play-lanterns`
  (`TypeError … reading 'toFixed'`) : la page de Lantern Row (`PlaceApp.snapshot()`) ne publie ni `textures` ni `textureMB`. Le JSON n'était donc
  pas écrit. Correctif : le résumé affiche `-` pour un compteur absent. Les tours de cette première série sont recopiés plus bas.

### Sorties recopiées

**Série 1920 × 1080, 5 tours** (16 h 34 - 16 h 40) :

```
node tools/perf.mjs --secs=4 --warm=2.5 --rounds=5 --size=1920x1080 "night-B|seed=1842&clean=1&camera=B" "play-morning|play=1&noreload=1&state=day1-morning&name=Aster" "play-midday|play=1&noreload=1&state=day2-afternoon&name=Aster" "play-dusk|play=1&noreload=1&state=day2-dusk-won&name=Aster" "play-bout|play=1&noreload=1&state=day2-afternoon&scene=arena&name=Aster" "play-forecourt|play=1&noreload=1&state=forecourt-morning&name=Aster" "play-lanterns|play=1&noreload=1&state=lanterns-night&name=Aster" "arena|scene=arena"

[r1] night-B                  1920x1080 MSAA4  GPU 13.44  (p95 16.41) [scene 8.74 | air 0.63 | dof 1.17 | bloom 1.38 | grade 0.38 | reflection 1.15]  frame p50 10.4  js upd 0.52 ren 12.63  draws 107  tris 211.1k  lights 24/24
[r1] play-morning             1920x1080 MSAA4  GPU 14.04* (p95 26.47) [scene 8.78 | air 0.83 | dof 1.01 | bloom 1.50 | grade 0.40 | reflection 1.53]  frame p50 10.9  js upd 0.63 ren 13.18  draws 107  tris 213.2k  lights 4/24  foreign firefox:10840:16%
[r1] play-midday              1920x1080 MSAA4  GPU 16.37* (p95 23.55) [scene 10.31 | air 0.95 | dof 1.24 | bloom 1.79 | grade 0.41 | reflection 1.66]  frame p50 15.8  js upd 0.57 ren 15.51  draws 107  tris 213.2k  lights 4/24  foreign claude:18968:24%
[r1] play-dusk                1920x1080 MSAA4  GPU 14.02* (p95 17.40) [scene 8.82 | air 0.83 | dof 1.14 | bloom 1.63 | grade 0.41 | reflection 1.19]  frame p50 12.6  js upd 0.59 ren 13.12  draws 107  tris 213.2k  lights 4/24  foreign firefox:10840:16%
[r1] play-bout                1920x1080        GPU 12.63* (p95 15.79) [scene 7.84 | air 0.65 | dof 1.01 | bloom 1.57 | grade 0.38 | reflection 1.18]  frame p50 6.1  js upd 0.39 ren 12.03  draws 92  tris 133.3k  lights 21/23  foreign firefox:10840:16%
[r1] play-forecourt           1920x1080        GPU 12.30* (p95 15.48) [scene 7.76 | air 0.62 | dof 0.99 | bloom 1.43 | grade 0.36 | reflection 1.14]  frame p50 13.0  js upd 0.38 ren 11.64  draws 92  tris 133.3k  lights 21/23  foreign firefox:10840:16%
[r1] play-lanterns            1920x1080        GPU 12.30* (p95 15.68) [bloom 1.74 | grade 0.31 | reflection 1.04 | scene 7.30 | air 0.71 | dof 1.20]  frame p50 12.1  js upd 0.10 ren 11.90  draws 106  tris 188.5k  lights 12/12  foreign firefox:10840:16%
[r1] arena                    1920x1080        GPU 12.27  (p95 15.68) [scene 7.41 | air 0.62 | dof 0.97 | bloom 1.74 | grade 0.34 | reflection 1.18]  frame p50 7.6  js upd 0.57 ren 11.37  draws 92  tris 133.3k  lights 21/23
[r2] night-B                  1920x1080 MSAA4  GPU 13.70  (p95 17.00) [scene 8.61 | air 0.62 | dof 0.95 | bloom 1.72 | grade 0.35 | reflection 1.45]  frame p50 12.8  js upd 0.52 ren 12.78  draws 107  tris 211.1k  lights 24/24
[r2] play-morning             1920x1080 MSAA4  GPU 11.87* (p95 14.65) [scene 7.39 | air 0.77 | dof 0.92 | bloom 1.35 | grade 0.33 | reflection 1.11]  frame p50 10.6  js upd 0.52 ren 11.03  draws 107  tris 213.2k  lights 4/24  foreign firefox:10840:16%
[r2] play-midday              1920x1080 MSAA4  GPU 12.18  (p95 15.53) [scene 7.49 | air 0.71 | dof 1.00 | bloom 1.43 | grade 0.36 | reflection 1.19]  frame p50 9.7  js upd 0.61 ren 11.29  draws 107  tris 213.2k  lights 4/24
[r2] play-dusk                1920x1080 MSAA4  GPU 12.90* (p95 16.64) [scene 8.26 | air 0.78 | dof 0.97 | bloom 1.38 | grade 0.36 | reflection 1.15]  frame p50 10.2  js upd 0.67 ren 12.01  draws 107  tris 213.2k  lights 4/24  foreign firefox:10840:16%
[r2] play-bout                1920x1080        GPU 12.28* (p95 16.16) [scene 7.65 | air 0.70 | dof 0.98 | bloom 1.52 | grade 0.34 | reflection 1.09]  frame p50 7.1  js upd 0.40 ren 11.62  draws 92  tris 133.3k  lights 21/23  foreign firefox:10840:16%
[r2] play-forecourt           1920x1080        GPU 12.17  (p95 16.20) [reflection 1.12 | scene 7.58 | air 0.64 | dof 0.99 | bloom 1.50 | grade 0.34]  frame p50 12.3  js upd 0.40 ren 11.47  draws 92  tris 133.3k  lights 21/23
[r2] play-lanterns            1920x1080        GPU 11.44  (p95 13.93) [scene 6.90 | air 0.64 | dof 1.18 | bloom 1.60 | grade 0.29 | reflection 0.83]  frame p50 12.0  js upd 0.10 ren 11.06  draws 106  tris 188.5k  lights 12/12
[r2] arena                    1920x1080        GPU 13.01* (p95 16.86) [scene 8.01 | air 0.65 | dof 0.99 | bloom 1.87 | grade 0.35 | reflection 1.14]  frame p50 6.3  js upd 0.66 ren 11.99  draws 92  tris 133.3k  lights 21/23  foreign firefox:10840:16%
[r3] night-B                  1920x1080 MSAA4  GPU 13.77* (p95 16.97) [scene 8.68 | air 0.62 | dof 0.94 | bloom 1.81 | grade 0.37 | reflection 1.35]  frame p50 11.5  js upd 0.52 ren 12.98  draws 107  tris 211.1k  lights 24/24  foreign firefox:10840:16%
[r3] play-morning             1920x1080 MSAA4  GPU 12.15* (p95 15.45) [scene 7.54 | air 0.71 | dof 0.94 | bloom 1.53 | grade 0.34 | reflection 1.09]  frame p50 9.7  js upd 0.51 ren 11.32  draws 107  tris 213.2k  lights 4/24  foreign firefox:10840:16%
[r3] play-midday              1920x1080 MSAA4  GPU 12.15* (p95 15.46) [scene 7.51 | air 0.72 | dof 0.96 | bloom 1.42 | grade 0.37 | reflection 1.15]  frame p50 9.2  js upd 0.60 ren 11.28  draws 107  tris 213.2k  lights 4/24  foreign firefox:10840:16%
[r3] play-dusk                1920x1080 MSAA4  GPU 13.18* (p95 15.97) [air 0.68 | dof 0.96 | bloom 1.52 | grade 0.36 | reflection 1.10 | scene 8.56]  frame p50 10.5  js upd 0.57 ren 12.31  draws 107  tris 213.2k  lights 4/24  foreign firefox:10840:16%
[r3] play-bout                1920x1080        GPU 13.35* (p95 17.42) [scene 8.35 | air 0.67 | dof 1.03 | bloom 1.80 | grade 0.36 | reflection 1.15]  frame p50 7.3  js upd 0.42 ren 12.72  draws 92  tris 133.3k  lights 21/23  foreign firefox:10840:17%
[r3] play-forecourt           1920x1080        GPU 12.85* (p95 16.95) [reflection 1.10 | scene 8.05 | air 0.70 | dof 1.01 | bloom 1.61 | grade 0.37]  frame p50 12.8  js upd 0.40 ren 12.11  draws 92  tris 133.3k  lights 21/23  foreign firefox:10840:18%,firefox:10840:17%
[r3] play-lanterns            1920x1080        GPU 12.52* (p95 16.32) [reflection 0.94 | scene 7.59 | air 0.67 | dof 1.20 | bloom 1.83 | grade 0.30]  frame p50 12.1  js upd 0.10 ren 12.21  draws 106  tris 188.5k  lights 12/12  foreign firefox:10840:18%,firefox:10840:17%
[r3] arena                    1920x1080        GPU 12.86* (p95 16.46) [scene 7.95 | air 0.61 | dof 0.96 | bloom 1.89 | grade 0.33 | reflection 1.12]  frame p50 9.4  js upd 0.56 ren 11.94  draws 92  tris 133.3k  lights 21/23  foreign firefox:10840:17%
[r4] night-B                  1920x1080 MSAA4  GPU 14.34* (p95 18.23) [scene 9.06 | air 0.59 | dof 0.98 | bloom 1.98 | grade 0.35 | reflection 1.39]  frame p50 13.0  js upd 0.56 ren 13.44  draws 107  tris 211.1k  lights 24/24  foreign firefox:10840:17%
[r4] play-morning             1920x1080 MSAA4  GPU 12.63* (p95 16.00) [scene 7.83 | air 0.71 | dof 0.95 | bloom 1.65 | grade 0.34 | reflection 1.15]  frame p50 10.8  js upd 0.53 ren 11.87  draws 107  tris 213.2k  lights 4/24  foreign firefox:10840:17%,firefox:10840:18%
[r4] play-midday              1920x1080 MSAA4  GPU 12.51* (p95 16.00) [air 0.72 | dof 1.02 | bloom 1.54 | grade 0.36 | reflection 1.16 | scene 7.70]  frame p50 10.7  js upd 0.67 ren 11.45  draws 107  tris 213.2k  lights 4/24  foreign firefox:10840:17%
[r4] play-dusk                1920x1080 MSAA4  GPU 13.58* (p95 17.79) [scene 8.07 | air 0.93 | dof 1.11 | bloom 1.72 | grade 0.40 | reflection 1.36]  frame p50 10.0  js upd 0.61 ren 12.65  draws 107  tris 213.2k  lights 4/24  foreign firefox:10840:18%
[r4] play-bout                1920x1080        GPU 13.08* (p95 17.25) [air 0.73 | dof 1.00 | bloom 1.65 | grade 0.35 | reflection 1.20 | scene 8.14]  frame p50 6.3  js upd 0.43 ren 12.33  draws 92  tris 133.3k  lights 21/23  foreign firefox:10840:18%,firefox:10840:16%
[r4] play-forecourt           1920x1080        GPU 13.55* (p95 17.70) [scene 8.50 | air 0.71 | dof 1.05 | bloom 1.70 | grade 0.37 | reflection 1.22]  frame p50 13.4  js upd 0.47 ren 12.73  draws 92  tris 133.3k  lights 21/23  foreign firefox:10840:18%,firefox:10840:17%
[r4] play-lanterns            1920x1080        GPU 13.90* (p95 17.50) [bloom 2.07 | grade 0.35 | reflection 1.16 | scene 8.13 | air 0.84 | dof 1.36]  frame p50 13.3  js upd 0.12 ren 13.42  draws 106  tris 188.5k  lights 12/12  foreign firefox:10840:17%
[r4] arena                    1920x1080        GPU 17.12* (p95 20.56) [dof 1.21 | bloom 2.22 | grade 0.45 | reflection 1.93 | scene 10.55 | air 0.76]  frame p50 13.7  js upd 0.84 ren 15.77  draws 92  tris 133.3k  lights 21/23  foreign firefox:10840:22%,firefox:10840:20%
[r5] night-B                  1920x1080 MSAA4  GPU 16.45* (p95 21.37) [scene 10.26 | air 0.76 | dof 1.10 | bloom 2.16 | grade 0.42 | reflection 1.75]  frame p50 17.7  js upd 0.62 ren 15.63  draws 107  tris 211.1k  lights 24/24  foreign firefox:10840:19%
[r5] play-morning             1920x1080 MSAA4  GPU 13.69* (p95 18.56) [scene 8.50 | air 0.80 | dof 1.02 | bloom 1.78 | grade 0.38 | reflection 1.21]  frame p50 12.5  js upd 0.63 ren 12.76  draws 107  tris 213.1k  lights 4/24  foreign firefox:10840:19%,firefox:10840:18%
[r5] play-midday              1920x1080 MSAA4  GPU 13.61* (p95 17.88) [bloom 1.64 | grade 0.38 | reflection 1.23 | scene 8.45 | air 0.87 | dof 1.03]  frame p50 9.4  js upd 0.76 ren 12.56  draws 107  tris 213.2k  lights 4/24  foreign firefox:10840:18%
[r5] play-dusk                1920x1080 MSAA4  GPU 13.96* (p95 18.11) [reflection 1.25 | scene 8.59 | air 0.93 | dof 1.06 | bloom 1.75 | grade 0.38]  frame p50 11.2  js upd 0.68 ren 12.98  draws 107  tris 213.2k  lights 4/24  foreign firefox:10840:18%,firefox:10840:19%
[r5] play-bout                1920x1080        GPU 12.82* (p95 16.79) [scene 7.95 | air 0.70 | dof 0.99 | bloom 1.63 | grade 0.35 | reflection 1.21]  frame p50 7.4  js upd 0.42 ren 12.16  draws 92  tris 133.3k  lights 21/23  foreign firefox:10840:18%,firefox:10840:17%
[r5] play-forecourt           1920x1080        GPU 12.36* (p95 16.11) [reflection 1.12 | scene 7.62 | air 0.67 | dof 1.00 | bloom 1.63 | grade 0.34]  frame p50 12.6  js upd 0.40 ren 11.77  draws 92  tris 133.3k  lights 21/23  foreign firefox:10840:18%,firefox:10840:17%
[r5] play-lanterns            1920x1080        GPU 13.68* (p95 18.24) [dof 1.27 | bloom 2.06 | grade 0.33 | reflection 1.15 | scene 8.00 | air 0.88]  frame p50 12.8  js upd 0.12 ren 13.23  draws 106  tris 188.5k  lights 12/12  foreign firefox:10840:17%,firefox:10840:18%
[r5] arena                    1920x1080        GPU 15.82* (p95 20.92) [scene 10.00 | air 0.72 | dof 1.09 | bloom 1.97 | grade 0.41 | reflection 1.62]  frame p50 12.9  js upd 0.76 ren 14.61  draws 92  tris 133.3k  lights 21/23  foreign firefox:10840:21%,firefox:10840:17%

adapter: ANGLE (AMD, AMD Radeon 780M Graphics (0x00001900) Direct3D11 vs_5_0 ps_5_0, D3D11)  (contention witness on, GPU process 37032, threshold 15 %)
=== over rounds: median [min-max], clean = median of the rounds without foreign GPU use ===
night-B                  1920x1080 MSAA4  GPU 13.77 [13.44-16.45] clean 13.70 (2/5) [scene 8.74 | air 0.63 | dof 1.17 | bloom 1.72 | grade 0.38 | reflection 1.45]  js upd 0.52 ren 12.98  draws 107  tris 211.1k  tex 51 (188 MB)  lights 24/24  gen 701 ms  {"set":"B","level":26,"parts":738,"tier3":330,"classes":36,"trisKept":98902,"trisTier3":25272,"bakeMs":20,"bakeCache":"hit","bakeKeyMs":16.9,"poses":329,"lightsOnScreen":24,"lightsCulled":0,"frame":1.7778,"bakePages":19,"bakeTargetMB":37.7}
play-morning             1920x1080 MSAA4  GPU 12.63 [11.87-14.04] clean - (0/5) [scene 7.83 | air 0.77 | dof 0.95 | bloom 1.53 | grade 0.34 | reflection 1.15]  js upd 0.53 ren 11.87  draws 107  tris 213.2k  tex 51 (188 MB)  lights 4/24  gen 668 ms  {"set":"B","level":26,"parts":738,"tier3":330,"classes":36,"trisKept":99930,"trisTier3":25272,"bakeMs":19,"bakeCache":"hit","bakeKeyMs":16.6,"poses":329,"lightsOnScreen":4,"lightsCulled":0,"frame":1.7778,"bakePages":19,"bakeTargetMB":37.7}
play-midday              1920x1080 MSAA4  GPU 12.51 [12.15-16.37] clean 12.18 (1/5) [scene 7.49 | air 0.71 | dof 1.00 | bloom 1.43 | grade 0.36 | reflection 1.19]  js upd 0.61 ren 11.45  draws 107  tris 213.2k  tex 51 (188 MB)  lights 4/24  gen 679 ms  {"set":"B","level":26,"parts":738,"tier3":330,"classes":36,"trisKept":99930,"trisTier3":25272,"bakeMs":17,"bakeCache":"hit","bakeKeyMs":15,"poses":329,"lightsOnScreen":4,"lightsCulled":0,"frame":1.7778,"bakePages":19,"bakeTargetMB":37.7}
play-dusk                1920x1080 MSAA4  GPU 13.58 [12.90-14.02] clean - (0/5) [scene 8.56 | air 0.83 | dof 1.06 | bloom 1.63 | grade 0.38 | reflection 1.19]  js upd 0.61 ren 12.65  draws 107  tris 213.2k  tex 51 (188 MB)  lights 4/24  gen 734 ms  {"set":"B","level":26,"parts":738,"tier3":330,"classes":36,"trisKept":99930,"trisTier3":25272,"bakeMs":26,"bakeCache":"hit","bakeKeyMs":24.2,"poses":329,"lightsOnScreen":4,"lightsCulled":0,"frame":1.7778,"bakePages":19,"bakeTargetMB":37.7}
play-bout                1920x1080        GPU 12.82 [12.28-13.35] clean - (0/5) [scene 7.95 | air 0.70 | dof 1.00 | bloom 1.63 | grade 0.35 | reflection 1.18]  js upd 0.42 ren 12.16  draws 92  tris 133.3k  tex 47 (198 MB)  lights 21/23  gen 348 ms
play-forecourt           1920x1080        GPU 12.36 [12.17-13.55] clean 12.17 (1/5) [scene 7.58 | air 0.64 | dof 0.99 | bloom 1.50 | grade 0.34 | reflection 1.12]  js upd 0.40 ren 11.77  draws 92  tris 133.3k  tex 47 (195 MB)  lights 21/23  gen 368 ms
play-lanterns            1920x1080        GPU 12.52 [11.44-13.90] clean 11.44 (1/5) [bloom 1.60 | grade 0.29 | reflection 0.83 | scene 6.90 | air 0.64 | dof 1.18]  js upd 0.10 ren 12.21  draws 106  tris 188.5k  tex - (- MB)  lights 12/12  gen 288 ms
arena                    1920x1080        GPU 13.01 [12.27-17.12] clean 12.27 (1/5) [scene 7.41 | air 0.62 | dof 0.97 | bloom 1.74 | grade 0.34 | reflection 1.18]  js upd 0.66 ren 11.99  draws 92  tris 133.3k  tex 47 (195 MB)  lights 21/23  gen 368 ms
end 2026-10-20 16:40:28 -0400
```

**Série 2560 × 1440, 3 tours** (16 h 41 - 16 h 44 ; même commande, `--rounds=3 --size=2560x1440`) :

```
start 2026-10-20 16:41:02 -0400
[r1] night-B                  2560x1440 MSAA4  GPU 23.35* (p95 27.59) [scene 14.26 | air 0.98 | dof 1.77 | bloom 3.86 | grade 0.60 | reflection 1.89]  frame p50 24.5  js upd 0.64 ren 22.64  draws 107  tris 211.1k  lights 24/24  foreign firefox:10840:17%,firefox:10840:18%
[r1] play-morning             2560x1440 MSAA4  GPU 20.30* (p95 24.45) [scene 12.73 | air 1.08 | dof 1.72 | bloom 2.68 | grade 0.56 | reflection 1.53]  frame p50 21.5  js upd 0.57 ren 19.48  draws 107  tris 213.2k  lights 4/24  foreign firefox:10840:16%,firefox:10840:17%
[r1] play-midday              2560x1440 MSAA4  GPU 20.50* (p95 25.05) [scene 12.71 | air 1.17 | dof 1.77 | bloom 2.77 | grade 0.60 | reflection 1.48]  frame p50 21.0  js upd 0.67 ren 19.49  draws 107  tris 213.2k  lights 4/24  foreign firefox:10840:18%
[r1] play-dusk                2560x1440 MSAA4  GPU 20.24* (p95 24.65) [scene 12.52 | air 1.04 | dof 1.74 | bloom 2.71 | grade 0.60 | reflection 1.63]  frame p50 20.9  js upd 0.63 ren 19.34  draws 107  tris 213.2k  lights 4/24  foreign firefox:10840:17%,firefox:10840:16%
[r1] play-bout                2560x1440        GPU 21.03* (p95 24.66) [scene 12.95 | air 0.91 | dof 1.77 | bloom 2.96 | grade 0.59 | reflection 1.85]  frame p50 23.2  js upd 0.42 ren 20.28  draws 92  tris 133.3k  lights 21/23  foreign firefox:10840:17%
[r1] play-forecourt           2560x1440        GPU 20.75* (p95 24.86) [reflection 1.62 | scene 12.76 | air 0.90 | dof 1.73 | bloom 3.14 | grade 0.58]  frame p50 21.3  js upd 0.43 ren 20.08  draws 92  tris 133.3k  lights 21/23  foreign firefox:10840:17%
[r1] play-lanterns            2560x1440        GPU 20.68* (p95 24.75) [bloom 3.16 | grade 0.51 | reflection 1.58 | scene 11.97 | air 1.21 | dof 2.23]  frame p50 23.0  js upd 0.11 ren 20.23  draws 106  tris 188.5k  lights 12/12  foreign firefox:10840:17%
[r1] arena                    2560x1440        GPU 21.89* (p95 25.88) [bloom 3.45 | grade 0.59 | reflection 1.96 | scene 13.12 | air 1.04 | dof 1.72]  frame p50 23.0  js upd 0.65 ren 20.69  draws 92  tris 133.3k  lights 21/23  foreign firefox:10840:17%,firefox:10840:18%
[r2] night-B                  2560x1440 MSAA4  GPU 22.25* (p95 27.16) [scene 13.81 | air 0.91 | dof 1.72 | bloom 3.25 | grade 0.57 | reflection 1.99]  frame p50 24.4  js upd 0.57 ren 21.40  draws 107  tris 211.1k  lights 24/24  foreign firefox:10840:16%
[r2] play-morning             2560x1440 MSAA4  GPU 20.05  (p95 27.12) [scene 12.60 | air 1.05 | dof 1.76 | bloom 2.57 | grade 0.58 | reflection 1.48]  frame p50 21.7  js upd 0.61 ren 19.21  draws 107  tris 213.2k  lights 4/24
[r2] play-midday              2560x1440 MSAA4  GPU 20.44* (p95 25.63) [scene 12.70 | air 1.02 | dof 1.79 | bloom 2.75 | grade 0.61 | reflection 1.59]  frame p50 21.8  js upd 0.69 ren 19.54  draws 107  tris 213.2k  lights 4/24  foreign firefox:10840:17%
[r2] play-dusk                2560x1440 MSAA4  GPU 19.76* (p95 23.29) [scene 12.27 | air 1.15 | dof 1.78 | bloom 2.56 | grade 0.59 | reflection 1.43]  frame p50 21.3  js upd 0.65 ren 18.98  draws 107  tris 213.2k  lights 4/24  foreign firefox:10840:17%
[r2] play-bout                2560x1440        GPU 19.97  (p95 23.28) [scene 12.43 | air 0.88 | dof 1.76 | bloom 2.69 | grade 0.58 | reflection 1.62]  frame p50 21.8  js upd 0.43 ren 19.39  draws 92  tris 133.3k  lights 21/23
[r2] play-forecourt           2560x1440        GPU 19.84  (p95 23.49) [scene 12.35 | air 0.88 | dof 1.74 | bloom 2.79 | grade 0.56 | reflection 1.52]  frame p50 19.5  js upd 0.41 ren 19.05  draws 92  tris 133.3k  lights 21/23
[r2] play-lanterns            2560x1440        GPU 19.25  (p95 23.28) [scene 11.57 | air 1.10 | dof 2.11 | bloom 2.71 | grade 0.50 | reflection 1.26]  frame p50 21.6  js upd 0.11 ren 19.03  draws 106  tris 188.5k  lights 12/12
[r2] arena                    2560x1440        GPU 20.53* (p95 24.06) [scene 12.47 | air 0.94 | dof 1.68 | bloom 3.15 | grade 0.57 | reflection 1.73]  frame p50 21.8  js upd 0.59 ren 19.82  draws 92  tris 133.3k  lights 21/23  foreign firefox:10840:16%
[r3] night-B                  2560x1440 MSAA4  GPU 21.48* (p95 25.84) [scene 13.34 | air 0.92 | dof 1.79 | bloom 3.05 | grade 0.56 | reflection 1.82]  frame p50 23.2  js upd 0.53 ren 20.74  draws 107  tris 211.1k  lights 24/24  foreign firefox:10840:16%
[r3] play-morning             2560x1440 MSAA4  GPU 19.15  (p95 22.74) [scene 12.01 | air 1.03 | dof 1.71 | bloom 2.28 | grade 0.55 | reflection 1.57]  frame p50 20.8  js upd 0.55 ren 18.27  draws 107  tris 213.2k  lights 4/24
[r3] play-midday              2560x1440 MSAA4  GPU 19.64  (p95 23.80) [scene 12.27 | air 1.06 | dof 1.74 | bloom 2.58 | grade 0.59 | reflection 1.40]  frame p50 22.1  js upd 0.64 ren 18.69  draws 107  tris 213.2k  lights 4/24
[r3] play-dusk                2560x1440 MSAA4  GPU 19.50* (p95 23.72) [scene 12.23 | air 1.04 | dof 1.73 | bloom 2.52 | grade 0.59 | reflection 1.39]  frame p50 21.4  js upd 0.65 ren 18.57  draws 107  tris 213.2k  lights 4/24  foreign firefox:10840:16%
[r3] play-bout                2560x1440        GPU 20.82* (p95 24.82) [bloom 2.90 | grade 0.60 | reflection 1.85 | scene 12.72 | air 0.93 | dof 1.83]  frame p50 23.4  js upd 0.44 ren 20.10  draws 92  tris 133.3k  lights 21/23  foreign firefox:10840:16%
[r3] play-forecourt           2560x1440        GPU 21.40  (p95 26.60) [scene 13.17 | air 0.94 | dof 1.84 | bloom 3.01 | grade 0.62 | reflection 1.82]  frame p50 21.1  js upd 0.49 ren 20.49  draws 92  tris 133.3k  lights 21/23
[r3] play-lanterns            2560x1440        GPU 20.89* (p95 24.81) [scene 12.38 | air 1.27 | dof 2.21 | bloom 3.08 | grade 0.56 | reflection 1.39]  frame p50 22.8  js upd 0.13 ren 20.50  draws 106  tris 188.5k  lights 12/12  foreign firefox:10840:16%
[r3] arena                    2560x1440        GPU 21.02* (p95 25.21) [scene 12.77 | air 0.94 | dof 1.78 | bloom 3.11 | grade 0.60 | reflection 1.82]  frame p50 22.3  js upd 0.68 ren 19.99  draws 92  tris 133.3k  lights 21/23  foreign firefox:10840:16%

adapter: ANGLE (AMD, AMD Radeon 780M Graphics (0x00001900) Direct3D11 vs_5_0 ps_5_0, D3D11)  (contention witness on, GPU process 6620, threshold 15 %)
=== over rounds: median [min-max], clean = median of the rounds without foreign GPU use ===
night-B                  2560x1440 MSAA4  GPU 22.25 [21.48-23.35] clean - (0/3) [scene 13.81 | air 0.92 | dof 1.77 | bloom 3.25 | grade 0.57 | reflection 1.89]  js upd 0.57 ren 21.40  draws 107  tris 211.1k  tex 51 (277 MB)  lights 24/24  gen 666 ms  {"set":"B","level":26,"parts":738,"tier3":330,"classes":36,"trisKept":98902,"trisTier3":25272,"bakeMs":18,"bakeCache":"hit","bakeKeyMs":15.2,"poses":329,"lightsOnScreen":24,"lightsCulled":0,"frame":1.7778,"bakePages":19,"bakeTargetMB":37.7}
play-morning             2560x1440 MSAA4  GPU 20.05 [19.15-20.30] clean 20.05 (2/3) [scene 12.60 | air 1.05 | dof 1.76 | bloom 2.57 | grade 0.58 | reflection 1.57]  js upd 0.57 ren 19.21  draws 107  tris 213.2k  tex 51 (277 MB)  lights 4/24  gen 651 ms  {"set":"B","level":26,"parts":738,"tier3":330,"classes":36,"trisKept":99930,"trisTier3":25272,"bakeMs":16,"bakeCache":"hit","bakeKeyMs":14.3,"poses":329,"lightsOnScreen":4,"lightsCulled":0,"frame":1.7778,"bakePages":19,"bakeTargetMB":37.7}
play-midday              2560x1440 MSAA4  GPU 20.44 [19.64-20.50] clean 19.64 (1/3) [scene 12.27 | air 1.06 | dof 1.74 | bloom 2.58 | grade 0.59 | reflection 1.40]  js upd 0.67 ren 19.49  draws 107  tris 213.2k  tex 51 (277 MB)  lights 4/24  gen 683 ms  {"set":"B","level":26,"parts":738,"tier3":330,"classes":36,"trisKept":99930,"trisTier3":25272,"bakeMs":18,"bakeCache":"hit","bakeKeyMs":16.2,"poses":329,"lightsOnScreen":4,"lightsCulled":0,"frame":1.7778,"bakePages":19,"bakeTargetMB":37.7}
play-dusk                2560x1440 MSAA4  GPU 19.76 [19.50-20.24] clean - (0/3) [scene 12.27 | air 1.04 | dof 1.74 | bloom 2.56 | grade 0.59 | reflection 1.43]  js upd 0.65 ren 18.98  draws 107  tris 213.2k  tex 51 (277 MB)  lights 4/24  gen 695 ms  {"set":"B","level":26,"parts":738,"tier3":330,"classes":36,"trisKept":99930,"trisTier3":25272,"bakeMs":18,"bakeCache":"hit","bakeKeyMs":15.4,"poses":329,"lightsOnScreen":4,"lightsCulled":0,"frame":1.7778,"bakePages":19,"bakeTargetMB":37.7}
play-bout                2560x1440        GPU 20.82 [19.97-21.03] clean 19.97 (1/3) [scene 12.43 | air 0.88 | dof 1.76 | bloom 2.69 | grade 0.58 | reflection 1.62]  js upd 0.43 ren 20.10  draws 92  tris 133.3k  tex 47 (286 MB)  lights 21/23  gen 334 ms
play-forecourt           2560x1440        GPU 20.75 [19.84-21.40] clean 21.40 (2/3) [reflection 1.82 | scene 13.17 | air 0.94 | dof 1.84 | bloom 3.01 | grade 0.62]  js upd 0.43 ren 20.08  draws 92  tris 133.3k  tex 47 (283 MB)  lights 21/23  gen 329 ms
play-lanterns            2560x1440        GPU 20.68 [19.25-20.89] clean 19.25 (1/3) [bloom 2.71 | grade 0.50 | reflection 1.26 | scene 11.57 | air 1.10 | dof 2.11]  js upd 0.11 ren 20.23  draws 106  tris 188.5k  tex - (- MB)  lights 12/12  gen 290 ms
arena                    2560x1440        GPU 21.02 [20.53-21.89] clean - (0/3) [bloom 3.15 | grade 0.59 | reflection 1.82 | scene 12.77 | air 0.94 | dof 1.72]  js upd 0.65 ren 19.99  draws 92  tris 133.3k  tex 47 (283 MB)  lights 21/23  gen 362 ms
end 2026-10-20 16:44:48 -0400
```

<details><summary>Première série 1920 × 1080, 3 tours (16 h 29 - 16 h 32), résumé interrompu</summary>

```
start 2026-10-20 16:29:06 -0400
[r1] night-B                  1920x1080 MSAA4  GPU 14.18* (p95 18.01) [scene 8.76 | air 0.64 | dof 0.99 | bloom 1.88 | grade 0.34 | reflection 1.57]  frame p50 14.1  js upd 0.55 ren 13.34  draws 107  tris 211.1k  lights 24/24  foreign firefox:10840:17%,firefox:10840:18%
[r1] play-morning             1920x1080 MSAA4  GPU 13.05* (p95 16.95) [scene 8.13 | air 0.84 | dof 1.03 | bloom 1.49 | grade 0.35 | reflection 1.21]  frame p50 11.6  js upd 0.60 ren 12.11  draws 107  tris 213.1k  lights 4/24  foreign firefox:10840:18%,firefox:10840:16%
[r1] play-midday              1920x1080 MSAA4  GPU 13.53* (p95 17.51) [scene 8.38 | air 0.78 | dof 1.04 | bloom 1.77 | grade 0.39 | reflection 1.17]  frame p50 11.9  js upd 0.74 ren 12.43  draws 107  tris 213.2k  lights 4/24  foreign firefox:10840:17%,firefox:10840:19%
[r1] play-dusk                1920x1080 MSAA4  GPU 13.24* (p95 16.79) [scene 8.28 | air 0.75 | dof 1.03 | bloom 1.63 | grade 0.38 | reflection 1.16]  frame p50 9.3  js upd 0.69 ren 12.21  draws 107  tris 213.2k  lights 4/24  foreign firefox:10840:17%,firefox:10840:18%
[r1] play-bout                1920x1080        GPU 12.95* (p95 16.87) [reflection 1.09 | scene 8.08 | air 0.71 | dof 1.01 | bloom 1.70 | grade 0.36]  frame p50 7.8  js upd 0.44 ren 12.20  draws 92  tris 133.3k  lights 21/23  foreign firefox:10840:17%
[r1] play-forecourt           1920x1080        GPU 13.09* (p95 17.27) [reflection 1.21 | scene 8.19 | air 0.68 | dof 1.04 | bloom 1.60 | grade 0.37]  frame p50 13.9  js upd 0.46 ren 12.31  draws 92  tris 133.3k  lights 21/23  foreign firefox:10840:19%,firefox:10840:18%
[r1] play-lanterns            1920x1080        GPU 13.05* (p95 16.54) [scene 7.73 | air 0.84 | dof 1.23 | bloom 1.94 | grade 0.31 | reflection 1.00]  frame p50 11.4  js upd 0.12 ren 12.64  draws 106  tris 188.5k  lights 12/12  foreign firefox:10840:19%,firefox:10840:18%
[r1] arena                    1920x1080        GPU 13.80* (p95 17.41) [scene 8.51 | air 0.69 | dof 1.03 | bloom 1.87 | grade 0.37 | reflection 1.33]  frame p50 7.6  js upd 0.70 ren 12.64  draws 92  tris 133.3k  lights 21/23  foreign firefox:10840:18%
[r2] night-B                  1920x1080 MSAA4  GPU 14.80* (p95 18.34) [scene 9.32 | air 0.73 | dof 1.01 | bloom 1.91 | grade 0.35 | reflection 1.49]  frame p50 13.7  js upd 0.59 ren 13.88  draws 107  tris 211.1k  lights 24/24  foreign firefox:10840:17%,firefox:10840:18%
[r2] play-morning             1920x1080 MSAA4  GPU 11.98* (p95 15.68) [air 0.74 | dof 0.95 | bloom 1.50 | grade 0.32 | reflection 1.04 | scene 7.42]  frame p50 9.6  js upd 0.50 ren 11.22  draws 107  tris 213.2k  lights 4/24  foreign firefox:10840:17%
[r2] play-midday              1920x1080 MSAA4  GPU 12.60* (p95 16.43) [scene 7.86 | air 0.70 | dof 1.02 | bloom 1.50 | grade 0.36 | reflection 1.17]  frame p50 10.9  js upd 0.69 ren 11.57  draws 107  tris 213.2k  lights 4/24  foreign firefox:10840:17%,firefox:10840:18%
[r2] play-dusk                1920x1080 MSAA4  GPU 12.26* (p95 16.05) [scene 7.57 | air 0.71 | dof 0.97 | bloom 1.52 | grade 0.36 | reflection 1.13]  frame p50 8.8  js upd 0.60 ren 11.48  draws 107  tris 213.2k  lights 4/24  foreign firefox:10840:17%
[r2] play-bout                1920x1080        GPU 12.59* (p95 16.42) [scene 7.76 | air 0.67 | dof 0.99 | bloom 1.59 | grade 0.36 | reflection 1.21]  frame p50 8.4  js upd 0.42 ren 11.89  draws 92  tris 133.3k  lights 21/23  foreign firefox:10840:18%,firefox:10840:17%
[r2] play-forecourt           1920x1080        GPU 13.69* (p95 17.60) [scene 8.58 | air 0.78 | dof 1.05 | bloom 1.71 | grade 0.38 | reflection 1.19]  frame p50 14.1  js upd 0.46 ren 12.96  draws 92  tris 133.3k  lights 21/23  foreign firefox:10840:18%
[r2] play-lanterns            1920x1080        GPU 13.46* (p95 17.34) [air 0.74 | dof 1.26 | bloom 2.00 | grade 0.35 | reflection 1.01 | scene 8.11]  frame p50 12.5  js upd 0.13 ren 13.03  draws 106  tris 188.5k  lights 12/12  foreign firefox:10840:17%,firefox:10840:18%
[r2] arena                    1920x1080        GPU 13.33* (p95 17.43) [scene 8.11 | air 0.68 | dof 1.00 | bloom 1.90 | grade 0.35 | reflection 1.28]  frame p50 8.8  js upd 0.67 ren 12.33  draws 92  tris 133.3k  lights 21/23  foreign firefox:10840:18%,firefox:10840:17%
[r3] night-B                  1920x1080 MSAA4  GPU 13.95* (p95 17.81) [scene 8.82 | air 0.63 | dof 0.96 | bloom 1.83 | grade 0.34 | reflection 1.36]  frame p50 13.0  js upd 0.53 ren 13.17  draws 107  tris 211.1k  lights 24/24  foreign firefox:10840:17%
[r3] play-morning             1920x1080 MSAA4  GPU 12.51* (p95 16.22) [scene 7.69 | air 0.74 | dof 1.00 | bloom 1.60 | grade 0.34 | reflection 1.13]  frame p50 9.4  js upd 0.59 ren 11.57  draws 107  tris 213.2k  lights 4/24  foreign firefox:10840:18%,firefox:10840:17%
[r3] play-midday              1920x1080 MSAA4  GPU 12.38* (p95 16.25) [scene 7.53 | air 0.81 | dof 0.99 | bloom 1.52 | grade 0.36 | reflection 1.17]  frame p50 7.7  js upd 0.60 ren 11.29  draws 107  tris 213.2k  lights 4/24  foreign firefox:10840:18%,firefox:10840:17%
[r3] play-dusk                1920x1080 MSAA4  GPU 12.23* (p95 16.04) [scene 7.60 | air 0.70 | dof 1.00 | bloom 1.50 | grade 0.35 | reflection 1.09]  frame p50 8.5  js upd 0.62 ren 11.29  draws 107  tris 213.2k  lights 4/24  foreign firefox:10840:18%,firefox:10840:17%
[r3] play-bout                1920x1080        GPU 12.33* (p95 15.47) [scene 7.59 | air 0.66 | dof 0.97 | bloom 1.63 | grade 0.33 | reflection 1.15]  frame p50 5.2  js upd 0.38 ren 11.70  draws 92  tris 133.3k  lights 21/23  foreign firefox:10840:18%,firefox:10840:17%
[r3] play-forecourt           1920x1080        GPU 12.72* (p95 16.34) [bloom 1.58 | grade 0.35 | reflection 1.15 | scene 7.94 | air 0.68 | dof 1.03]  frame p50 13.3  js upd 0.42 ren 11.99  draws 92  tris 133.3k  lights 21/23  foreign firefox:10840:17%
[r3] play-lanterns            1920x1080        GPU 10.53  (p95 12.82) [scene 6.53 | air 0.58 | dof 1.23 | bloom 0.95 | grade 0.31 | reflection 0.92]  frame p50 11.8  js upd 0.10 ren 10.16  draws 106  tris 188.5k  lights 12/12
[r3] arena                    1920x1080        GPU 10.99  (p95 13.09) [scene 6.80 | air 0.54 | dof 1.00 | bloom 1.26 | grade 0.33 | reflection 1.05]  frame p50 9.9  js upd 0.48 ren 10.23  draws 92  tris 133.3k  lights 21/23

adapter: ANGLE (AMD, AMD Radeon 780M Graphics (0x00001900) Direct3D11 vs_5_0 ps_5_0, D3D11)  (contention witness on, GPU process 35528, threshold 15 %)
=== over rounds: median [min-max], clean = median of the rounds without foreign GPU use ===
night-B                  1920x1080 MSAA4  GPU 14.18 [13.95-14.80] clean - (0/3) [scene 8.82 | air 0.64 | dof 0.99 | bloom 1.88 | grade 0.34 | reflection 1.49]  js upd 0.55 ren 13.34  draws 107  tris 211.1k  tex 51 (188 MB)  lights 24/24  gen 742 ms  {"set":"B","level":26,"parts":738,"tier3":330,"classes":36,"trisKept":98902,"trisTier3":25272,"bakeMs":18,"bakeCache":"hit","bakeKeyMs":15.8,"poses":329,"lightsOnScreen":24,"lightsCulled":0,"frame":1.7778,"bakePages":19,"bakeTargetMB":37.7}
play-morning             1920x1080 MSAA4  GPU 12.51 [11.98-13.05] clean - (0/3) [scene 7.69 | air 0.74 | dof 1.00 | bloom 1.50 | grade 0.34 | reflection 1.13]  js upd 0.59 ren 11.57  draws 107  tris 213.2k  tex 51 (188 MB)  lights 4/24  gen 743 ms  {"set":"B","level":26,"parts":738,"tier3":330,"classes":36,"trisKept":99930,"trisTier3":25272,"bakeMs":20,"bakeCache":"hit","bakeKeyMs":17.2,"poses":329,"lightsOnScreen":4,"lightsCulled":0,"frame":1.7778,"bakePages":19,"bakeTargetMB":37.7}
play-midday              1920x1080 MSAA4  GPU 12.60 [12.38-13.53] clean - (0/3) [scene 7.86 | air 0.78 | dof 1.02 | bloom 1.52 | grade 0.36 | reflection 1.17]  js upd 0.69 ren 11.57  draws 107  tris 213.2k  tex 51 (188 MB)  lights 4/24  gen 658 ms  {"set":"B","level":26,"parts":738,"tier3":330,"classes":36,"trisKept":99930,"trisTier3":25272,"bakeMs":17,"bakeCache":"hit","bakeKeyMs":15.7,"poses":329,"lightsOnScreen":4,"lightsCulled":0,"frame":1.7778,"bakePages":19,"bakeTargetMB":37.7}
play-dusk                1920x1080 MSAA4  GPU 12.26 [12.23-13.24] clean - (0/3) [scene 7.60 | air 0.71 | dof 1.00 | bloom 1.52 | grade 0.36 | reflection 1.13]  js upd 0.62 ren 11.48  draws 107  tris 213.2k  tex 51 (188 MB)  lights 4/24  gen 673 ms  {"set":"B","level":26,"parts":738,"tier3":330,"classes":36,"trisKept":99930,"trisTier3":25272,"bakeMs":19,"bakeCache":"hit","bakeKeyMs":17.2,"poses":329,"lightsOnScreen":4,"lightsCulled":0,"frame":1.7778,"bakePages":19,"bakeTargetMB":37.7}
play-bout                1920x1080        GPU 12.59 [12.33-12.95] clean - (0/3) [reflection 1.15 | scene 7.76 | air 0.67 | dof 0.99 | bloom 1.63 | grade 0.36]  js upd 0.42 ren 11.89  draws 92  tris 133.3k  tex 47 (198 MB)  lights 21/23  gen 376 ms
play-forecourt           1920x1080        GPU 13.09 [12.72-13.69] clean - (0/3) [reflection 1.19 | scene 8.19 | air 0.68 | dof 1.04 | bloom 1.60 | grade 0.37]  js upd 0.46 ren 12.31  draws 92  tris 133.3k  tex 47 (195 MB)  lights 21/23  gen 370 ms
(the summary stopped here: TypeError: Cannot read properties of undefined (reading 'toFixed'), tools/perf.mjs:104, on play-lanterns)
```

</details>

### Cadence (`tools/cadence.mjs`, fenêtre réelle discrète, `max` = 2560 × 1267 rendus, DPR 1,75 ; plafond par défaut `a60`)
- **37 à 44 images/s** sur toutes les pages, nuit comprise : le plafond adaptatif passe à **4 vsyncs** (24,4 ms) ; 3 % d'intervalles hors du
  pas quand il le tient, 28 à 48 % quand des intervalles de 3 vsyncs (un essai du pas court) ou de 5 vsyncs (Firefox à 20-23 %) s'y mêlent.
  SoC 21,6 à 31,5 W.
- Référence de la Passe 6h (même plafond, même fenêtre) : au calme 55,0 images/s à 3 vsyncs ; sous une charge de +5,5 ms, 41,6 images/s à
  4 vsyncs. La cadence d'aujourd'hui est celle du cas chargé, pour la nuit comme pour le jeu.

```
node tools/cadence.mjs --secs=8 --rounds=2 "night-B|seed=1842&clean=1&camera=B|max" "play-morning|play=1&noreload=1&state=day1-morning&name=Aster|max" "play-midday|play=1&noreload=1&state=day2-afternoon&name=Aster|max" "play-dusk|play=1&noreload=1&state=day2-dusk-won&name=Aster|max"

start 2026-10-20 16:45:12 -0400
display: vsync 6.100 ms (163.9 Hz), idle-page interval p5 6.00 / p95 6.20 ms
[1] idle page          pkg 21.5 W  soc 6.9 W
[1] night-B            2560x1267 MSAA4 (1463x724@1.75)  44.1 fps  interval p50 24.10 p95 25.00 max 32.5 ms  vsyncs 1/2/3/4/5+ 0/0/27/72/1 %  irregular 27.6 %  rAF without render 955/1308  GPU busy 71 % [65,78,71,66]  pkg 61.7 W  soc 31.5 W  cap a60 every 4 vsync 6.1 (probe) steps 3 trials undone 1 [4631.6:4,8637.1:3,10424.8:4]  foreign firefox:10840:18%,firefox:10840:20%,firefox:10840:22%
[1] play-morning       2560x1267 MSAA4 (1463x724@1.75)  41.5 fps  interval p50 24.20 p95 25.00 max 30.7 ms  vsyncs 1/2/3/4/5+ 0/0/3/97/0 %  irregular 3.0 %  rAF without render 2258/2590  GPU busy 69 % [68,72,69]  pkg 53.1 W  soc 27.1 W  cap a60 every 4 vsync 6.1 (probe) steps 3 trials undone 1 [4921.9:4,8939.7:3,9157.7:4]  foreign firefox:10840:19%,firefox:10840:20%
[1] play-midday        2560x1267 MSAA4 (1463x724@1.75)  41.6 fps  interval p50 24.20 p95 24.90 max 26.9 ms  vsyncs 1/2/3/4/5+ 0/0/3/97/0 %  irregular 3.3 %  rAF without render 2281/2614  GPU busy 71 % [71,74,69,69]  pkg 53.2 W  soc 28.3 W  cap a60 every 4 vsync 6.1 (probe) steps 3 trials undone 1 [4766.6:4,8778:3,9032.5:4]  foreign firefox:10840:20%,firefox:10840:19%
[1] play-dusk          2560x1267 MSAA4 (1463x724@1.75)  37.4 fps  interval p50 24.60 p95 30.50 max 33.2 ms  vsyncs 1/2/3/4/5+ 0/0/2/55/43 %  irregular 45.2 %  rAF without render 2344/2644  GPU busy 71 % [56,68,71,73]  pkg 53.1 W  soc 25.0 W  cap a60 every 3 vsync 6.1 (probe) steps 4 trials undone 0 [4368.5:4,4835.4:5,8864.8:4,12888.6:3]  foreign firefox:10840:18%,firefox:10840:22%,firefox:10840:20%,firefox:10840:19%
[2] idle page          pkg 28.7 W  soc 1.2 W
[2] night-B            2560x1267 MSAA4 (1463x724@1.75)  38.0 fps  interval p50 24.60 p95 30.40 max 34.7 ms  vsyncs 1/2/3/4/5+ 0/0/5/57/38 %  irregular 43.2 %  rAF without render 1009/1313  GPU busy 75 % [58,65,75,77]  pkg 59.0 W  soc 29.6 W  cap a60 every 4 vsync 6.1 (probe) steps 5 trials undone 1 [5091.3:4,5382.3:5,9406:4,13429.8:3,13702.4:4]  foreign firefox:10840:21%,firefox:10840:22%,firefox:10840:16%
[2] play-morning       2560x1267 MSAA4 (1463x724@1.75)  36.9 fps  interval p50 25.40 p95 31.10 max 38.5 ms  vsyncs 1/2/3/4/5+ 0/0/1/52/47 %  irregular 48.1 %  rAF without render 2254/2550  GPU busy 57 % [57,57,70]  pkg 53.0 W  soc 23.5 W  cap a60 every 4 vsync 6.1 (probe) steps 3 trials undone 0 [4908.7:4,7211.3:5,11241.3:4]  foreign firefox:10840:20%,firefox:10840:23%,firefox:10840:22%
[2] play-midday        2560x1267 MSAA4 (1463x724@1.75)  37.6 fps  interval p50 24.70 p95 31.00 max 39.0 ms  vsyncs 1/2/3/4/5+ 0/0/3/58/39 %  irregular 42.3 %  rAF without render 2253/2554  GPU busy 62 % [72,62,59]  pkg 53.1 W  soc 21.6 W  cap a60 every 5 vsync 6.1 (probe) steps 4 trials undone 1 [4088.9:4,8106.5:3,8342.8:4,9288.2:5]  foreign firefox:10840:19%,firefox:10840:20%,firefox:10840:22%,firefox:10840:23%
[2] play-dusk          2560x1267 MSAA4 (1463x724@1.75)  41.3 fps  interval p50 24.20 p95 25.50 max 36.8 ms  vsyncs 1/2/3/4/5+ 0/0/2/97/1 %  irregular 3.3 %  rAF without render 2267/2598  GPU busy 70 % [69,70,71]  pkg 53.1 W  soc 25.0 W  cap a60 every 4 vsync 6.1 (probe) steps 3 trials undone 1 [4668.2:4,8686:3,8873.8:4]  foreign firefox:10840:20%,firefox:10840:21%
end 2026-10-20 16:47:38 -0400
```

### Démarrage (`tools/startup.mjs`, 1920 × 1080, 4 chargements, serveur DEV)
- Une page du jeu au premier matin est prête en **2,86 s** [2,53-3,29], la nuit B en 2,66 s [2,44-2,79]. Le premier chargement de la session
  rate le cache du bake (bake 339 ms, génération 1 124 ms, prêt en 3,29 s) ; les suivants le relisent (bake 18-21 ms). C'est le temps qu'un
  joueur attend à chaque créneau, sur ce serveur DEV (modules non regroupés).
- La bascule de la forge ne fait rien dans le mode jouable (0-0,2 ms) : l'interrupteur DEV y est coupé (Passe L4), la sonde le confirme.

```
node tools/startup.mjs --n=4 "night-B|seed=1842&clean=1&camera=B|1920x1080" "play-morning|play=1&noreload=1&state=day1-morning&name=Aster|1920x1080"

start 2026-10-20 16:47:56 -0400
[1] night-B          ready 2785 ms  paint 522 gen 753 (bake 310)  regenerate 784 then 821 to start  first frame after start 4 (programs created 0)  longest task 1239  first reveal 1.5 (max 54.8)  later 36.7  forge 12.1+33.3  regen 1239.9  programs 31->31  foreign firefox:10840:35%,firefox:10840:21%,firefox:10840:19%,firefox:10840:18%,firefox:10840:20%
[1] play-morning     ready 3288 ms  paint 722 gen 1124 (bake 339)  regenerate 1149 then 388 to start  first frame after start 6 (programs created 0)  longest task 1334  first reveal 1 (max 38.4)  later 41.8  forge 0+30.7  regen 1189.5  programs 31->31  foreign firefox:10840:36%,firefox:10840:32%,firefox:10840:19%,firefox:10840:18%
[2] night-B          ready 2660 ms  paint 722 gen 725 (bake 20)  regenerate 761 then 256 to start  first frame after start 8 (programs created 0)  longest task 941  first reveal 12.4 (max 58.3)  later 61.4  forge 8.9+35.3  regen 860.5  programs 31->31  foreign firefox:10840:30%,firefox:10840:36%,firefox:10840:18%,firefox:10840:17%
[2] play-morning     ready 2860 ms  paint 721 gen 754 (bake 20)  regenerate 791 then 265 to start  first frame after start 27 (programs created 0)  longest task 980  first reveal 11.9 (max 40.3)  later 46.3  forge 0.2+36.4  regen 826.9  programs 31->31  foreign firefox:10840:25%,firefox:10840:37%,firefox:10840:17%,firefox:10840:19%
[3] night-B          ready 2576 ms  paint 751 gen 655 (bake 18)  regenerate 689 then 270 to start  first frame after start 6 (programs created 0)  longest task 865  first reveal 4 (max 58.7)  later 56.3  forge 10.3+35  regen 726  programs 31->31  foreign firefox:10840:30%,firefox:10840:31%,firefox:10840:18%,firefox:10840:16%,firefox:10840:19%
[3] play-morning     ready 2565 ms  paint 714 gen 773 (bake 21)  regenerate 809 then 242 to start  first frame after start 15 (programs created 0)  longest task 983  first reveal 27.5 (max 40)  later 47.7  forge 0.1+36.8  regen 800.9  programs 31->31  foreign firefox:10840:33%,firefox:10840:29%,firefox:10840:17%,firefox:10840:18%,firefox:10840:19%
[4] night-B          ready 2440 ms  paint 710 gen 664 (bake 20)  regenerate 698 then 247 to start  first frame after start 6 (programs created 0)  longest task 873  first reveal 19.2 (max 39)  later 66.6  forge 6.4+32.5  regen 731.2  programs 31->31  foreign firefox:10840:37%,firefox:10840:20%,firefox:10840:18%,firefox:10840:17%
[4] play-morning     ready 2530 ms  paint 715 gen 674 (bake 18)  regenerate 705 then 242 to start  first frame after start 24 (programs created 0)  longest task 895  first reveal 0.6 (max 37.6)  later 35.1  forge 0.1+31.4  regen 785.5  programs 31->31  foreign firefox:10840:36%,firefox:10840:17%,firefox:10840:16%

adapter: ANGLE (AMD, AMD Radeon 780M Graphics (0x00001900) Direct3D11 vs_5_0 ps_5_0, D3D11)
night-B          ready 2660 [2440-2785]  paint 722 [522-751]  gen 725 [655-753]  bake 20 [18-310]  regenerate 761 [689-784]  then to start 270 [247-821]  first frame after start 6 [4-8]  programs created by the first frames 0 [0-0]  first reveal 12 [2-19]  later reveal max 61 [37-67]  new programs at reveal 0 [0-0]  (4/4 loads with foreign GPU use)
play-morning     ready 2860 [2530-3288]  paint 721 [714-722]  gen 773 [674-1124]  bake 21 [18-339]  regenerate 809 [705-1149]  then to start 265 [242-388]  first frame after start 24 [6-27]  programs created by the first frames 0 [0-0]  first reveal 12 [1-28]  later reveal max 46 [35-48]  new programs at reveal 0 [0-0]  (4/4 loads with foreign GPU use)
end 2026-10-20 16:49:24 -0400
```
