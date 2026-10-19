# Journal de bord — archive : passes H0 et M6 (2026-10-18)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-10-19 (Passe H5) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe H0 — Héros premium : brief et prompt de la planche source ; décision sur l'enseigne de la forge (2026-10-18)

### Complément de la Passe S1b
- Passe S1b fusionnée en avance rapide (`1634b59`) ; runs GitHub : S1 `39174062375` / `39174069769`, S2 `39175497168` / `39175505682`, S1b
  `39176075688` / `39176097041` (branche / `main`) : success.
- Enseigne de la forge devant la tête du forgeron (C) : décision de l'opérateur, mot pour mot : « celui ci c'est different car le npc forge
  se trouve a l'interieur du decors dans c'est logique le beau de decors surpasse le sprite ». Rien à changer.

### Demande (2026-10-18)
- Troisième point des priorités (Passe M5) : « travailler sur notre héros premium ». Consigne de la séance parente : un héros cuit à la
  densité de la distribution par la chaîne existante, critiqué à l'aveugle par un agent neuf ; production et Gold Master à l'opérateur ;
  aucune provenance inventée.
- Branche `hero-premium` ouverte depuis `main` (`1634b59`).

### Constat — [OK]
- Aucune source multi-vues du héros dans l'Art Lab. La planche complémentaire (14 personnages, classée « C, utile pour les personnages
  clés » par l'opérateur le 16/10) montre « 01. Protagonist — Young Adventurer » sous une seule vue (trois-quarts) ; les PNJ venaient de
  planches à 4 ou 6 vues découpées par leurs scripts de rig. Une marche ne s'invente pas depuis une vue (« Principes à garder ») : il faut
  une planche de l'opérateur.

### Décisions de l'opérateur (2026-10-18) — [OK]
- Base de dessin, mot pour mot : « 01 Protagonist (Recommandé) ». Vitesse, mot pour mot : « Foulée de course (Recommandé) » (2,5 m/s
  gardés ; le cycle de profil doit reculer le pied d'appui d'≈ 9 texels par image à ×2, contre 4-4,5 pour la distribution, Passe S2).

### Fait
- `art-lab/characters/briefs/hero-proposal.md` : décisions, brief (figure d'après la vue 01, proportions de la base commune, 1,78 m),
  contraintes mesurées (densité, foulée, entrée `replaces: ['player']` seulement après approbation), prompt anglais de la planche (face, dos,
  profil au repos, deux poses de course de profil, même échelle et même ligne de sol, fond gris uni), méthode à réception (celle des PNJ),
  critères, risques.
- Pièces jointes du prompt (non versionnées, `art-lab/characters/scratch/hero-premium/attachments/`) : `design-01-protagonist-crop-x2.png`
  (vue 01 recadrée de la planche complémentaire archivée, ×2 ; SHA-256 `fbdf11b5…`) et
  `quality-dockworker-x2-v2-front-side-back-x6-neutral.png` (docker v2 au repos, face / profil / dos ×6 au plus proche voisin sur gris
  `#808080` ; `93d5e3a6…`).

### Restes [?]
- **En attente de l'opérateur** : la planche générée, livrée en PNG d'origine, avec l'outil, la date et le prompt effectivement utilisés.
- Avec Maj (4,25 m/s), la borne × 1,6 de l'horloge laissera glisser : à décider à la livraison.

### Pensée
- Un personnage clé se prépare comme les PNJ : la source d'abord (multi-vues, fichier d'origine, provenance déclarée), puis la chaîne ; une
  contrainte d'animation (la foulée de course) s'écrit dans le prompt, chiffrée, avant la génération.

## Passe M6 — Journal : archivage des passes M3 à M4 (2026-10-18)

### Pourquoi
- Règle d'`AGENTS.md` : au-delà d'environ 60 Ko de passes dans `JOURNAL.md`, les passes closes les plus anciennes partent d'un bloc dans
  `journal/`. Après la Passe H0 : 61 672 octets de passes (M3 11 863, Q1 10 023, Q1b 4 187, M4 2 860, M5 7 366, S1 10 922, S2 7 224,
  S1b 3 967, H0 3 260).
- Branche `journal-archive-m3-m4` ouverte depuis `main` (`aa58d31`).

### Fait — [OK]
- M3, Q1, Q1b et M4 (closes : décision de l'opérateur consignée, branches fusionnées) déplacées d'un bloc, dans leur ordre, à l'octet, dans
  `journal/05-passes-M3-M4.md` (en-tête de quelques lignes, une ligne `---`, puis les 28 933 octets inchangés, SHA-256 `e80b0dfcc58a44af…`) ;
  ligne ajoutée à l'index ; phrase d'en-tête : « Les passes 0 à M4 sont archivées… (Passes M3 et M6) ». `JOURNAL.md` : 96 085 → 67 249 octets
  avant cette entrée.
- Preuve (script hors dépôt, contre `git show aa58d31:JOURNAL.md` ramené aux fins de ligne de la copie de travail) : **7 / 7** — corps de
  l'archive = octets retirés (SHA-256 et longueur) ; les 4 sections déplacées retrouvées chacune une seule fois, dans la nouvelle archive
  seulement ; les 5 passes gardées inchangées ; `JOURNAL.md` = l'original moins le bloc, aux deux lignes d'index près ; CRLF seuls dans les
  deux fichiers. Contrôle négatif : « 15 / 15 contrôles » changé en « 15 / 16 » dans une copie de l'archive → 5 / 7 (SHA-256 et section).
  Avec cette entrée ajoutée, le contrôle « original moins le bloc » échoue comme attendu (lignes en plus).
- **[KO → compris]** première exécution : 2 / 7 ; `git show` rend le blob de l'index en LF (0 CRLF, 946 LF), la copie de travail est en CRLF
  (`autocrlf`) : comparer aux fins de ligne de la copie de travail, comme en Passe M3.

### Pensée
- Une preuve d'octets contre l'historique git compare des fins de ligne : le blob est celui de l'index, pas celui du disque.

