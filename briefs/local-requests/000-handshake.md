# Requête locale 000 — handshake
- Type : autre
- Lot : L0
- Branche et commit de base : claude/pensive-pasteur-lbz4ji @ d129433
- Demande : confirme le relais et donne l'état de la machine locale : Aseprite, clé OpenAI présente ou non, GPU.
- Entrées : aucune. Commandes suggérées : `npm run art:doctor` ; `node tools/art-lab/gen-image.mjs --spent` (sans rien envoyer) ; l'adaptateur
  WebGL rapporté par `node tools/perf.mjs --secs=1 --rounds=1 "b|seed=1842&clean=1&camera=B"` sur ce commit.
- Sorties attendues : la réponse ci-dessous (Aseprite oui / non et sa version ; clé OpenAI présente oui / non, jamais sa valeur ; le GPU et son
  pilote ; la date et l'heure de la réponse).
- Repli si elle n'aboutit pas : la séance cloud continue sans relais ; images, feuilles cuites et temps GPU sont inscrits au bilan comme à faire
  en local.
- Statut : répondue (2026-10-20, séance locale, Passe Q4)

## Réponse
Séance locale, sur la machine de l'opérateur (Windows 11, portable hybride), le **2026-10-20 entre 16 h 27 et 16 h 33 (UTC−4)**, Passe Q4 du
journal. La séance cloud étant close et sa branche fusionnée, les commandes ont tourné sur `main` (`94aa82f`, branche de tâche
`relay-gpu-q4`) et non sur `d129433` : l'état de la machine ne dépend pas du commit.

**Le relais : confirmé.** La requête a été lue sur `main` par une séance locale et sa réponse est poussée sur `main` (la séance cloud qui
l'avait écrite n'existe plus).

| Point | Réponse |
|---|---|
| Aseprite | **oui, 1.3.18.6-x64** ; l'extension et le plugin Aseprite AI Artist 0.8.2 configurés (lien vivant non testé par `art:doctor`) |
| Clé OpenAI | **présente : oui**, dans `.env.local` (ignoré par Git : la ligne `.env.*` du `.gitignore` versionné) ; absente de l'environnement. Sa valeur n'a été ni lue, ni affichée, ni recopiée : la présence vient de la fonction `readKey()` de l'outil, qui n'a affiché qu'un booléen. |
| GPU utilisé par Chrome | **AMD Radeon 780M** (iGPU), ANGLE Direct3D 11 ; pilote AMD **32.0.21030.14003** (date du pilote selon Windows : 16/12/2025) |
| Autre GPU | NVIDIA GeForce RTX 4060 Laptop, pilote 32.0.15.7702 (15/07/2025) ; Chrome ne le prend qu'avec `--gpu=dgpu` |
| Navigateur des outils | Chrome 155.0.8059.80 |
| Écran | 2560 × 1600 à 165 Hz (sonde vsync des outils : 163,9 Hz) |

**`npm run art:doctor`** (chemins de la machine remplacés par `<dépôt>` et `<Program Files>`) :

```
Character Art Toolchain

Node ................. OK
Repository ........... OK
Art Lab .............. OK
Aseprite ............. FOUND 1.3.18.6-x64
Aseprite AI Artist ... CONFIGURED (live link not tested by doctor)

Status:
TOOLS CONFIGURED: doctor cannot prove the live link; the smoke test does (JOURNAL Passe 4A-0B), re-run it after any upgrade

Details
  Node version ................. v22.14.0
  Project path ................. <dépôt>
  Platform ..................... win32 x64
  Git .......................... relay-gpu-q4 @ 94aa82f
  Aseprite detected ............ yes: <Program Files>\Aseprite\Aseprite.exe (via standard location / PATH)
  ASEPRITE_PATH defined ........ no
  Aseprite version ............. 1.3.18.6-x64
  @pebbly/aseprite-ai-artist ... no (not a project dependency by design)
  Claude Code plugin ........... aseprite@aseprite-ai-artist enabled (local), marketplace ref v0.8.2, auto-update off; cached 0.8.2
  Aseprite extension ........... aseprite-ai-artist 0.8.2
  Other agent wiring ........... none found
  Art Lab folders .............. valid
  Manifest schema / check ...... valid: 18 manifest(s) + example, 0 error(s), 0 warning(s)
  Character Lab ................ dev only: npm run dev, then /character-lab.html (absent from the production build)
```

**`node tools/art-lab/gen-image.mjs --spent`** (n'envoie rien ; le registre des dépenses, plafond 5 $ par tâche) :

```
hero-turnaround-v4               0.3578 USD of 5  (1 request(s))
day-state-concepts               0.5334 USD of 5  (3 request(s))
hero-run-v4                      0.7664 USD of 5  (2 request(s))
```

**Présence de la clé** (booléen seul, par la fonction de l'outil) :

```
OPENAI_API_KEY present: true | from environment: false
```

**`node tools/perf.mjs --secs=1 --rounds=1 "b|seed=1842&clean=1&camera=B"`** (serveur DEV `dev-strict` :5186, `BASE_URL`) :

```
[r1] b                        1920x1080 MSAA4  GPU 15.96  (p95 19.21) [scene 10.03 | air 0.80 | dof 1.16 | bloom 2.09 | grade 0.39 | reflection 1.49]  frame p50 19.2  js upd 0.53 ren 15.17  draws 107  tris 211.1k  lights 24/24

adapter: ANGLE (AMD, AMD Radeon 780M Graphics (0x00001900) Direct3D11 vs_5_0 ps_5_0, D3D11)  (contention witness on, GPU process 10676, threshold 15 %)
=== over rounds: median [min-max], clean = median of the rounds without foreign GPU use ===
b                        1920x1080 MSAA4  GPU 15.96 [15.96-15.96] clean 15.96 (1/1) [scene 10.03 | air 0.80 | dof 1.16 | bloom 2.09 | grade 0.39 | reflection 1.49]  js upd 0.53 ren 15.17  draws 107  tris 211.1k  tex 51 (188 MB)  lights 24/24  gen 871 ms  {"set":"B","level":26,"parts":738,"tier3":330,"classes":36,"trisKept":98902,"trisTier3":25272,"bakeMs":370,"bakeCache":"miss","bakeKeyMs":10.5,"poses":329,"lightsOnScreen":24,"lightsCulled":0,"frame":1.7778,"bakePages":19,"bakeTargetMB":37.7}
```

- Ce temps (15,96 ms sur une seconde) n'est pas une mesure : la série de la requête `001` en donne une, avec ses réserves (un Firefox de
  l'opérateur occupait 13 à 38 % de la 780M pendant toute la séance).
