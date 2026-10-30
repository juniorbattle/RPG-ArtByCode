# Journal de bord — archive : passes FV1 à FV3 (2026-10-29)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-10-30 (Passe V2B1) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe FV1 — Reprise locale après la séance cloud « Version 2 » : la branche distante supprimée, la fiche d'essai mise à jour et publiée (2026-10-29)

### Demande, mot pour mot
- Opérateur : « prend en compte ce qui a ete accompli sur la session cloud, il semble avoir de vraies ameliorations »
- Branche `fiche-v2-maj` depuis `main` (`2ea0cea`).

### Constat — [OK]
- La séance cloud a fusionné dans `main` les lots V0 à V10 (Passes V0 à V10) puis les Passes VP1 à VP9 (les places refaites, la ville reliée à
  pied, le combat plus rude, les lices et la place de la halle) ; la CI de `main` est verte (`2ea0cea`). La copie locale a été avancée de 76
  commits en avance rapide.

### Fait — [OK]
- La branche distante `claude/friendly-davinci-17lk4m`, entièrement fusionnée (0 commit hors de `main`), supprimée depuis la machine locale (le
  cloud n'avait pas pu, Passe V10).
- `briefs/fiche-v2.html` (lot V10) datait d'avant les Passes VP : trois cartes mises à jour avant publication, sans changer leurs options ni leurs
  recommandations : V2-3 (l'équilibrage depuis la Passe VP4 : les coups des rivaux × 1,3, le joueur préparé gagne 60 % de ses combats au lieu de
  85 %), V2-4 (les blessures remesurées en Passe VP2 : 1,08 par partie pour un joueur préparé, 1,74 sans préparation), V2-10 (les places de VP1 à
  VP9 : le parvis, les lices au pied du rempart, la place de la halle, les sorties à pied) ; l'en-tête daté du 29/10.
- Publiée en page privée : https://claude.ai/artifact/WTwk3r77Y4QJ4eYt93jXRc, collection `decisions` vide à la publication (relue par `list`).

### Restes [?]
- L'essai de l'opérateur (`briefs/v2-trial.md`), puis la fiche, à relire et verser quand il la dit remplie.
- Le local de la Passe V10 et des Passes VP : mesures GPU des places, revue en rendu matériel, contrôle vivant de l'arène, écoute du son ; la feuille
  de Marek en pause jusqu'à la nouvelle commande (AV-10), et les poses de charge.

### Pensée
- Une fiche préparée au milieu d'une séance qui continue vieillit avant d'être publiée : la relire contre les passes qui ont suivi.

## Passe FV2 — Un test de la version 2 rendu indépendant de Windows (`tests/v2-sound.test.mjs`) (2026-10-29)

### Constat — [KO → corrigé]
- Sur la machine de l'opérateur (Windows), `npm test` donnait 277 / 278 sur `main` (`2ea0cea`, avant la Passe FV1) : le test « no sound before a
  gesture; only the version 2's pages load the engine » parcourait `src` par `new URL('../src', import.meta.url).pathname`. Sous Windows, ce
  chemin vaut `/C:/...`, et `path.join` en fait `C:\C:\...` (ENOENT). Le runner Linux de la CI ne le voit pas.
- **[KO] de cette séance** : la Passe FV1 a été fusionnée malgré cet échec : la chaîne de validation filtrait la sortie de `npm test` par `grep`,
  qui réussit même quand un test échoue. Le commit FV1 ne touchait que le journal et la fiche ; l'échec était antérieur.

### Fait — [OK]
- Les deux chemins du test passent par `fileURLToPath` ; rien d'autre ne change. Aucun autre test n'utilise `URL.pathname`.

### Preuves
- `node --test tests/v2-sound.test.mjs` : 5 / 5 ; `npm test` entier sans échec ; typecheck, build, `art:validate`.
- **Faute injectée, attrapée** : un import direct du moteur de son en tête de `src/ui/playTown.ts` fait échouer le test (« src/ui/playTown.ts: no
  static import ») ; le fichier rendu à l'octet.

### Pensée
- La règle du brief cloud (« les tests doivent aussi passer sous Windows ») se vérifie à la reprise locale, avant toute fusion ; et une validation
  enchaînée doit s'arrêter sur le code de sortie des tests, pas sur un filtre de leur sortie.

## Passe FV3 — La fiche de l'essai de la version 2, remplie par l'opérateur (18 sur 18) (2026-10-29)

### Demande, mot pour mot
- Opérateur : « Fiche rempli oui tu peux gerer les preuves locales oui »
- Branche `fiche-v2-choix` depuis `main` (`3d696a0`).

### La fiche — [OK] 18 choix sur 18 enregistrés et relus
- Page privée https://claude.ai/artifact/WTwk3r77Y4QJ4eYt93jXRc (Passe FV1), collection `decisions` relue par `list` : 18 documents, cliqués le
  29/10 entre 19 h 47 et 19 h 52 UTC, aucune note.

### Les choix de l'opérateur, mot pour mot
« = » : la recommandation de la fiche est suivie ; « ≠ » : le choix diffère, et c'est lui qui fait foi.

| # | Décision | Recommandation | Choix de l'opérateur | Note | |
|---|---|---|---|---|---|
| V2-1 | Les temps de charge | « Garder » | « Garder » | — | = |
| V2-2 | Ce qui coupe une charge | « Garder » | « Rien ne la coupe » | — | ≠ |
| V2-3 | L'équilibrage « modéré » | « Garder » | « Garder » | — | = |
| V2-4 | Les blessures sous la version 2 | « Revoir (tâche à part) » | « Revoir (tâche à part) » | — | = |
| V2-5 | L'ancien schéma (touches 1-6) | « Le garder pour comparer » | « Le garder pour comparer » | — | = |
| V2-6 | Le catalogue des compétences et ses sources | « Garder » | « Garder » | — | = |
| V2-7 | L'équipement et les prix | « Garder » | « Garder » | — | = |
| V2-8 | Le vol et ses conséquences | « Garder » | « Garder » | — | = |
| V2-9 | Les défis en ville | « Garder » | « Garder » | — | = |
| V2-10 | Les trois places | « Garder pour la revue locale » | « Garder pour la revue locale » | — | = |
| V2-11 | Les dix jours | « Garder » | « Garder » | — | = |
| V2-12 | Orla alliée | « Garder » | « Garder » | — | = |
| V2-13 | Les cinq cinématiques | « Garder et en écrire d'autres plus tard » | « Garder » | — | = |
| V2-14 | Les événements de la version 2 | « Garder » | « Garder » | — | = |
| V2-15 | Le son par le code | « Garder pour l'essai » | « Garder » | — | = |
| V2-16 | P4, P5, P6 | « Garder » | « Garder » | — | = |
| V2-17 | Le passage au défaut | « Pas encore » | « Pas encore » | — | = |
| V2-18 | Les personnages à cuire d'abord | « Les rivaux d'abord » | « Les rivaux d'abord » | — | = |

- Pour V2-13 et V2-15, la recommandation de la fiche portait sur l'option « Garder » (premier choix), avec un commentaire : le choix la suit.
- **V2-2 « Rien ne la coupe »** : la règle « proposée » de la Passe V1 (un coup reçu sans garde, l'esquive, le break ou le K.O. coupent la charge ;
  relâchée pendant la séquence adverse, elle est perdue) est à remplacer : plus rien ne coupe une charge. Tâche à part, derrière `flags.v2`.
- **V2-4** : la règle des blessures sous la version 2 est à revoir dans une tâche à part.
- **V2-17 « Pas encore »** : la version 2 reste derrière son drapeau ; le défaut ne change pas.
- **V2-18 « Les rivaux d'abord »** : l'ordre des personnages à cuire (Orla, Vessa, Marek, Ilse, Cassius, puis les maîtres des places).

### Ce qui suit, chacun dans sa séance, une branche à la fois
1. Les preuves locales de la version 2 (demandées par l'opérateur dans le même message) : mesures GPU des places et de leur cuisson (E24),
   contrôle vivant de l'arène, captures en rendu matériel pour sa revue.
2. V2-2 : la charge que rien ne coupe.
3. V2-4 : la règle des blessures.
4. Les feuilles des rivaux (V2-18), Marek repris quand la nouvelle commande est jouée (AV-10), avec les poses de charge.

