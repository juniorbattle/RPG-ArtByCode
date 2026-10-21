# Journal de bord — archive : passes Q4 et Q4b (2026-10-20)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-10-21 (Passe AD1) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe Q4 — Relais local : les requêtes `000` (état de la machine) et `001` (temps GPU du mode jouable sur la 780M) répondues (2026-10-20)

### Demande
- Séance locale lancée par la séance parente : répondre sur cette machine aux deux requêtes du relais restées ouvertes (Passes L7, Q3), dans
  la section « Réponse » de chaque fichier de `briefs/local-requests/`.
- Branche `relay-gpu-q4` depuis `main` (`94aa82f`). La séance cloud étant close, tout a tourné sur `main` (même code de jeu que `7b7a966`).

### Requête `000` — [OK] répondue
- **Aseprite** : oui, 1.3.18.6-x64 (`art:doctor`) ; l'extension et le plugin Aseprite AI Artist 0.8.2 configurés, le lien vivant non testé.
- **Clé OpenAI** : présente, dans `.env.local` (ignoré par Git), absente de l'environnement. La présence vient de la fonction `readKey()` de
  l'outil, qui n'a affiché qu'un booléen : la valeur n'a été ni lue, ni affichée, ni recopiée. Registre des dépenses : trois tâches, 0,36 /
  0,53 / 0,77 $ sur 5 $.
- **GPU** : Chrome rend sur la Radeon 780M (ANGLE D3D11), pilote AMD 32.0.21030.14003 ; la RTX 4060 (pilote 32.0.15.7702) n'est prise
  qu'avec `--gpu=dgpu`. Chrome 155.0.8059.80 ; écran 2560 × 1600 à 165 Hz.

### Requête `001` — [OK] répondue, [?] mesurée sous contention
- **Conditions** : serveur DEV `dev-strict` (:5186) lancé par `preview_start`, son onglet fermé aussitôt, le panneau navigateur resté fermé ;
  chaque série en arrière-plan, attendue jusqu'au bout dans le tour ; témoin de contention au seuil de 15 %. La série 1080p en 5 tours, la
  série 2560 × 1440 en 3 tours.
- **[?] La contention** : le processus GPU d'un Firefox de l'opérateur (PID 10840, ouvert depuis le 19/10) a occupé **13 à 38 % de la 780M**
  pendant toute la séance (médiane 17 % sur un journal complet du témoin tenu pendant la série 1440p). Il n'a pas été touché. **Aucun tour
  n'est sans contention** : les tours « clean » ne sont que ceux où Firefox est resté entre 13 et 15 %. Les variantes étant entrelacées, la
  comparaison entre pages tient ; les temps absolus non.
- **Résultats** (ms de GPU, médiane des tours ; écart à la nuit B de la même série) :

| Page | 1920 × 1080 | 2560 × 1440 |
|---|---|---|
| nuit B (`seed=1842&clean=1&camera=B`) | 13,77 [13,44-16,45] | 22,25 [21,48-23,35] |
| jeu, matin (`day1-morning`) | 12,63 (−8 %) | 20,05 (−10 %) |
| jeu, midi (`day2-afternoon`) | 12,51 (−9 %) | 20,44 (−8 %) |
| jeu, fin de journée (`day2-dusk-won`) | 13,58 (−1 %) | 19,76 (−11 %) |
| duel (`scene=arena`, jour 2) | 12,82 (−7 %) | 20,82 (−6 %) |
| parvis (`forecourt-morning`) | 12,36 (−10 %) | 20,75 (−7 %) |
| Lantern Row (`lanterns-night`) | 12,52 (−9 %) | 20,68 (−7 %) |
| arène par défaut (`scene=arena`) | 13,01 (−5 %) | 21,02 (−6 %) |

- **Lecture** :
  - Chaque page du mode jouable coûte au plus ce que coûte la nuit par défaut dans la même série (−1 à −11 %). Les pages de jour gagnent leurs
    lumières éteintes (4 allumées sur 24) ; mêmes appels de dessin que la nuit (107), ≈ 2 000 triangles de plus (le pavois), comme le comptait
    le cloud (Passe L7).
  - Contre les références : la nuit B fait +3,0 ms en 1080p et +2,6 ms en 1440p de plus qu'à la Passe G1 (10,81 [9,88-10,95] et 19,65
    [18,60-20,04], tours propres), hors de la fourchette de la Passe 6 en 1080p (10-12 ms), dedans en 1440p (16-21 ms). L'arène garde son
    rapport à la ville : −6 % à la Passe G1 (9,30 contre 9,88 ms), −5 % ici.
  - **[?] Estimation non vérifiée** : si cet excès tient tout entier à Firefox et pèse autant sur chaque page, les pages du jeu tiendraient
    9,4 à 10,6 ms en 1080p et 17,2 à 18,2 ms en 1440p, dans le budget de la Passe 6. À remesurer Firefox fermé.
  - `js ren` suit le temps GPU sur toutes les pages : le rendu semble attendre le GPU dans ce harnais sans plafond (hypothèse, non vérifiée).
- **Cadence** (`tools/cadence.mjs`, fenêtre discrète, `max`, plafond `a60`) : 37 à 44 images/s sur la nuit B et trois pages de jeu, le plafond
  à 4 vsyncs ; à la Passe 6h, au calme 55,0 images/s à 3 vsyncs, sous une charge de +5,5 ms 41,6 images/s à 4 vsyncs. Aujourd'hui, la nuit
  comme le jeu sont dans le cas chargé.
- **Démarrage** (`tools/startup.mjs`, 1080p, 4 chargements, serveur DEV) : la page du premier matin est prête en 2,86 s [2,53-3,29], la
  nuit B en 2,66 s [2,44-2,79] ; le premier chargement de la session rate le cache du bake (bake 339 ms, prêt en 3,29 s), les suivants le
  relisent (bake 18-21 ms). C'est l'attente du joueur à chaque créneau, sur un serveur DEV. La bascule de la forge ne fait rien dans le mode
  jouable (0-0,2 ms), comme le veut la Passe L4.
- Les sorties complètes sont recopiées dans `briefs/local-requests/001-gpu-budget.md`.

### [KO → corrigé] `tools/perf.mjs` plantait au résumé sur Lantern Row
- Une première série 1080p de 3 tours a donné tous ses tours, puis le résumé s'est arrêté sur `play-lanterns` (`TypeError … reading
  'toFixed'`), sans écrire son JSON : la page de Lantern Row (`PlaceApp.snapshot()`) ne publie ni `textures` ni `textureMB`. La Passe L7 avait
  ajouté cette page à l'outil (`window.__place`) dans le cloud ; le résumé, lui, ne prévoyait pas une page sans ces compteurs.
- Correctif : le résumé affiche `-` pour un compteur absent (deux lignes, aucune mesure changée). La série refaite en 5 tours l'a traversé.

### Journal — [OK] archivage (passes gardées au-delà d'environ 60 Ko)
- Avant cette passe, les passes gardées faisaient 60 533 octets. L2 et L3, closes (fusionnées), partent d'un seul bloc, dans leur ordre et à
  l'octet, vers `journal/18-passes-L2-L3.md` : en-tête, ligne `---`, puis les 19 559 octets inchangés (SHA-256 `cd45c00274fccb6b…`). La ligne
  d'index et la phrase d'en-tête sont mises à jour.
- **Preuve** (script hors dépôt, contre la copie de `JOURNAL.md` faite juste avant le déplacement) : **9 / 9** (le corps de l'archive égal au
  bloc retiré ; un bloc contigu L2-L3 suivi de L4 ; chaque section dans un seul fichier de `journal/` et plus dans `JOURNAL.md` ; `JOURNAL.md`
  inchangé à partir de L4 ; seules la phrase d'en-tête et une ligne d'index changent ; l'en-tête de l'archive comme celui de `journal/17` ;
  CRLF seuls dans les deux fichiers de la copie de travail ; aucune autre archive touchée). Contrôle négatif : une lettre changée dans une copie
  de l'archive → 7 / 9.

### Validation
- typecheck, `npm test` **148 / 148**, build, `art:validate`.

### Restes [?]
- Les temps absolus : remesurer la série `001` (1080p au moins) et la cadence avec Firefox fermé, témoin à l'appui, avant de les tenir pour le
  budget du contrat projet § 14.

### Pensée
- Un témoin de contention qui ne descend jamais sous son seuil ne laisse aucun tour propre : un tour « clean » au seuil de 15 % peut porter
  13 % d'un autre programme. Un journal complet du témoin pendant la série le montre ; la comparaison entrelacée reste, les temps absolus non.
- Un outil étendu à une page nouvelle s'essaie jusqu'à sa dernière ligne, résumé compris, avant de partir au relais.

## Passe Q4b — Requête `001` : la série 1080p et la cadence remesurées, Firefox arrêté (2026-10-20)

### Demande, mot pour mot
- Opérateur : « Firefox est fermé : refais la série 001 en 1080p (et la cadence) avec le témoin, puis mets à jour la réponse et le journal. »
- Branche `relay-gpu-q4b` depuis `main` (`aeefedd`).

### Constat — [KO → réglé avec l'opérateur] le Firefox « fermé » tournait encore
- Le témoin, avant la série (16 h 59) : le processus `firefox` 10840 (lancé le 19/10 à 8 h 12) toujours vivant, à 30 % de la 780M.
- Question posée ; réponse de l'opérateur : « Arrête-le (PID 10840) ». Arrêté seul (`Stop-Process -Id 10840`), après avoir revérifié son nom et
  son heure de lancement ; il n'est plus reparu au témoin.
- Une autre séance (projet RPGCards, en cours) lançait des Chrome sans fenêtre, par à-coups jusqu'à 94 % de la 780M. Non touchée ; un journal
  complet du témoin (166 échantillons) dit quels tours sont **vraiment calmes** (aucun autre programme au-dessus de 5 % pendant le tour).

### Mesures — [OK]
- Même serveur DEV (:5186), même commande, 5 tours, aucun onglet du jeu ouvert, série et cadence attendues jusqu'au bout.

| 1920 × 1080 | tours calmes | minimum des 5 tours | écart à la nuit B (minimum) |
|---|---|---|---|
| nuit B | 10,72 ; 10,57 | 10,57 | — |
| jeu, matin | 8,74 | 8,74 | −17 % |
| jeu, midi | 9,08 | 9,08 | −14 % |
| jeu, fin de journée | — | 9,42 | −11 % |
| duel | — | 9,82 | −7 % |
| parvis | 9,19 | 9,02 | −15 % |
| Lantern Row | 9,30 | 9,30 | −12 % |
| arène par défaut | — | 9,24 | −13 % |

- **La nuit par défaut retrouve la Passe G1** (10,81 [9,88-10,95]) et la fourchette de la Passe 6 (10-12 ms) : les +3 ms de la Passe Q4 étaient
  la contention de Firefox.
- **Les pages du mode jouable tiennent le budget** : 8,7 à 9,8 ms en 1080p, toutes sous la nuit par défaut. L'arène : 9,24 ms (9,30 à la Passe
  G1). L'estimation de la Passe Q4 (9,4 à 10,6 ms) était un peu haute.
- **Cadence** (`tools/cadence.mjs`, `max`, `a60`) : **55,0 images/s, 3 vsyncs 100 %, aucun changement de pas**, nuit B et trois pages de jeu,
  deux tours ; SoC 30,5 à 39,4 W. C'est le cas calme de la Passe 6h (55,0 images/s à 3 vsyncs), contre 37-44 images/s sous Firefox.
- Les sorties complètes sont en tête de la réponse de `briefs/local-requests/001-gpu-budget.md`, la première mesure gardée dessous.

### Validation
- typecheck, `npm test` **148 / 148**, build, `art:validate`.

### Restes [?]
- Non refaits au calme : la série 2560 × 1440 (Passe Q4 : 19,8 à 20,8 ms pour les pages du jeu, sous Firefox) et le démarrage.
- Trois pages sans tour calme (fin de journée, duel, arène) : leur minimum est une borne haute.

### Pensée
- Une fenêtre fermée ne prouve pas un programme arrêté : un processus du navigateur peut rester vivant et tenir le GPU. Le témoin se relit
  juste avant la série, pas sur la parole d'un « c'est fermé ».

