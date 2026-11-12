# Journal de bord — archive : passes AU1, AU2 (2026-11-11)

> Déplacée mot pour mot de `JOURNAL.md` le 2026-11-11 (Passe AC3) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe AU1 — L'audit final du gameplay et de la structure : mesuré, rapporté, la fiche publiée ; rien du jeu changé (2026-11-11)

### Demande
- L'opérateur, le 2026-11-11, mot pour mot (transmis par la séance qui coordonne) : « Bon on semble etre sur la fin du projet globale, bien sure il y aura des ajustements mais nous sommes sur la fin d'un projet pret. donc je vais que tu me fasses un audit complet du gameplay et structure globale du projet pour conclure et valider le tout ».
- Le brief : un audit en lecture et en mesure seulement (aucune règle, aucun nombre, aucun contenu changé, aucun écart résolu) ; le gameplay du jeu par défaut joué de bout en bout, la conformité aux trois contrats, l'expérience du joueur, la structure, ce qu'il reste ; un rapport, une page de synthèse, une fiche d'arbitrages, cette passe.
- Branche `claude/audit-final`, worktree `.claude/worktrees/audit-final` tiré de `main` `59e284a` ; `node_modules` en jonction ; serveurs `au-dev` (:5411) et `au-dist` (:5412, le paquet de production), leur cache hors dépôt.
- **Consigné à la demande de la séance qui coordonne** : le dossier principal du dépôt, resté sur `claude/duel-calibration` (`df16326`, Passe DB10) depuis le 2026-11-09 à 18 h 23, a été remis sur `main` ce matin par la séance qui coordonne, avant cet audit. Les essais de l'opérateur des 10 et 11 novembre ont donc pu tourner sans ECO2-ECO3, DB11-DB13, TF1, MD1, MK1-MK6, LA1-LA3 ni AL1.

### Ce qui a été mesuré — [OK]
- `npm run typecheck` sans erreur ; `npm test` **619 / 619** (122,5 s de suite, 2 min 04 s de bout en bout) ; `npm run build` ; `npm run art:validate` (73 manifestes, 123 sources, 23 du son, 0 erreur). La CI : les douze dernières exécutions vertes (API GitHub), 131 à 229 s.
- **Le TournamentLab**, graines 1 à 50, `idle` / `diligent` / `curious` / `planner` : combats gagnés 34,9 / 55,2 / 64,0 / 60,4 % ; demi-finales 62 / 100 / 96 / 98 % ; finalistes 0 / 4 / 24 / 4 % ; **aucun titre sur 200 parties** ; les 35 événements des deux catalogues déclenchés au moins une fois ; 0 participant oublié ; 0 élimination comptée (voir les écarts).
- **Deux parties entières dans le navigateur** (script hors dépôt `ten-days.mjs`, le planificateur choisissant dans la page, l'arène ouverte depuis la sauvegarde à chaque combat) : graine 1 en français, empreinte du navigateur = Node `e4061f6213518375` ; graine 2 en anglais, chaque créneau rechargé par l'interface (65 pages), empreinte = Node `86b1758dab4fc891` ; aucune erreur ; chargement médian 4,4 s par page sur le serveur DEV.
- **Les preuves du dépôt** sur `au-dev` : `default-proof` 40 / 40, `tutorial-proof` 64 / 64, `play-day` 54 / 54 (`75272cc6a835113b`), `play-flow` win et lose 24 / 24, `pad-proof` 61 / 61, `settings-proof` 65 / 65, `remap-proof` 46 / 46, `exits-proof` 32 / 32 ; `ui-text` **47 / 47** (18 pages en deux langues, trois tailles) ; `ui-contrast` 16 / 24 : « coins » / « pièces » au téléphone couché 4,26-4,30:1 (connu depuis TU3) et **les chiffres de dégâts flottants du duel 1,41-1,69:1** (neuf).
- **Les transitions d'écran** (script hors dépôt `transitions.mjs`, screencast image par image, luminance, avec et sans « reduce » émulé) : changer de créneau, de lieu par la carte, quitter le titre ou entrer dans l'arène passe de la scène (0,35-0,40) au noir (0,031) **en une image** ; la levée du noir est un fondu ; seule la sortie à pied fond avant (0,35 s, `exits.ts`).
- **Le GPU** (`tools/perf.mjs`, 780M, panneau fermé, témoin) : en 1080p (4 tours) et en 1440p (3 tours tous propres), les places et le duel sous la nuit B (−0,33 à −2,60 ms) ; **le quai v2 en plan B la nuit +0,03 ms en 1080p, +0,33 ms en 1440p (+2 %)** contre +0,13 / +0,14 à la Passe FV4 (FV5 « Accepter l'égalité »).
- **Le démarrage** (`tools/startup.mjs`) : en production, le quartier prêt en 1,43 s, **une nouvelle partie en 3,67 s** (le mode jouable ajoute ≈ 2,2 s) ; chaque créneau et chaque lieu rechargent une page. [KO d'outil] `startup.mjs` s'arrête sur la page de l'arène (`window.__app.renderer` absent).
- **Trois relectures du code** (agents, chacun avec ses scripts et ses mesures, recoupées dans le code avant d'entrer au rapport) : la structure de `src/`, les systèmes de la ville (40 graines par politique et des sondes), le duel et la progression (un banc dont la copie du bot donne la même empreinte que `runV2BotDuel` sur 105 duels sur 105).

### Ce qui a été trouvé (le détail et les preuves : `briefs/audit-final.md`)
- **La campagne ne se gagne pas au laboratoire** : 0 titre sur 200 parties ; un planificateur qui gagne aussi tous ses défis et recrute Orla, 1 titre sur 40. La poule gagnée à 100 % aux jours 4 et 5, la demi-finale à 4 % pour le planificateur. Trois causes mesurées une à une : le calibrage de DB10 / DB13 omet la préparation des rivaux (×1,21 en demi-finale, ×1,25 en finale, `rivalMods`) ; aucune politique n'atteint le niveau 3 des compétences que la courbe suppose ; le planificateur se bat avec la sangle coupée.
- **Deux stratégies dominantes** : l'attaque puissante apportée (1 PA, recharge 8,5 s plus courte que la rupture de 10 s ; gardée, elle rompt chaque rival de poule d'un coup) gagne 99-100 % en poule et 93-98 % en finale ; des offensives à la place de Rempart et Ferveur, 97-100 %. Le kit de départ est le plus faible des kits mesurés. Les défis (≈ 95 % gagnés au jour 1) donnent +24 PV pour toujours. Un tiers à plus de la moitié des combats de poule durent moins de 2 min (la cible de l'opérateur : 2 à 5 min).
- **Des nombres du duel dits nulle part** : la garde du rival à 90 %, le coup gardé ×2 à la jauge du gardien (la leçon dit « guarded or not »), les recharges, le coup net de la page des compétences, la préparation du rival, la Vivacité relative au kit, ce que fait chaque stat.
- **Des ruptures de logique de la ville** : un vol pris facturé à la restitution comme une pièce prise (et une copie achetée ensuite saisie) ; un recherché qui vole encore ; une bourse vide qui efface le registre ; les paliers de Bram perdus en changeant d'arme ; des textes périmés (« +8 % », « +15 % », « every blade », « from now on », « day after day », la bourse d'une défaite) ; les losanges qui ne reviennent pas pour une offre renouvelée ; Orla recrutable en son absence.
- **Deux défauts du mode jouable** (vérifiés dans le navigateur, `nosave.mjs`) : chaque nouvelle partie part de la graine 1842 (`title.ts:134`, `play.ts:53`) ; sans sauvegarde lisible, la page repart dans le jeu d'aujourd'hui (`v2=0`), en anglais, au jour 1, sans le dire (`play.ts:55`).
- **Les écarts aux contrats non consignés jusqu'ici** : le moteur de combat à deux combattants fixes (projet § 6.1, la spécification dit le contraire) ; les sponsors (projet § 3.1) ; la campagne rejouable (projet § 4, la graine) ; « éliminé » jamais écrit en v2, le pouls `activeCompetitors` constant (8) et le taux d'élimination du laboratoire à 0 (projet § 5.3, tournoi § 9 et § 13) ; plusieurs calendriers comparés (tournoi § 4) ; pas de campagne mathématiquement perdue (gameplay § 11, le titre) ; la règle 6 bis de l'opérateur (les transitions). Les écarts déjà consignés restent : la phase d'équipe et le recrutement (V6), Blender et la génération par le code (E14 / E15, l'amendement jamais écrit), l'investissement (EV1, jamais tranché), les paris (ECO-5).
- **La structure** : les cinq couches pures n'atteignent jamais Three.js (le § 10.2 du contrat projet tient) ; `arena/CombatSim.ts`, pur, soude 19 dossiers en un cycle ; 13 exports morts ; `?sprites` en production ; une vingtaine de paramètres d'essai de décisions closes (VD-8) ; le jeu d'aujourd'hui ≈ 1,0-1,4 k lignes ; aucun TODO ni `console.log`. **`AGENTS.md` 180 877 octets** (15 Ko le 15/10 ; « Commands » 54 Ko, « Useful URL params » 35 Ko) ; `JOURNAL.md` 184 Ko, dont « À reprendre » 69 Ko et « Principes » 61 Ko sans règle d'archivage ; 9 branches locales fusionnées, 15 worktrees, 61 configurations de serveur ; aucun secret dans l'arbre ni l'historique ; un chemin machine dans `JOURNAL.md:296` (Passe AL1).

### Les livrables
- **Le rapport** : `briefs/audit-final.md` (le verdict, le laboratoire, les dix jours dans le navigateur, une fiche par système, la conformité aux trois contrats, l'expérience du joueur, la structure, ce qu'il reste en bloquant / important / finition avec l'effort, les essais ouverts, les décisions).
- **La page de synthèse** : https://claude.ai/artifact/ByP98Bt9vbnmst86XZpAYc (`briefs/synthese-au1.html`).
- **La fiche d'arbitrages AU1** : https://claude.ai/artifact/BMLcgX5TJ4tSkNMEVLW1Sh (`briefs/fiche-au1.html`, collection `decisions` relue vide après publication), dix-sept cartes en quatre familles : la réception (**AU-01** l'essai de réception guidé sur le `main` d'aujourd'hui, **AU-02** le statut, le Gold Master étant celui de l'opérateur) ; le jeu (**AU-03** la difficulté, **AU-04** les nombres cachés du duel, **AU-05** la phase d'équipe — un verrou, A3 —, **AU-06** la graine et la sauvegarde perdue, **AU-07** les transitions, **AU-08** les ruptures de la ville) ; la structure (**AU-09** `AGENTS.md` et le journal, **AU-10** le ménage, **AU-11** les paramètres d'essai et `v2=0`, **AU-12** l'amendement E14 / E15, **AU-13** les sponsors, l'investissement, les calendriers) ; les décisions en attente (**AU-14** le genre du joueur, **AU-15** « Chevalière du Temple » et « 10 % », **AU-16** RK3, **AU-17** les restes d'art).
- Les scripts hors dépôt et leurs sorties (dix jours, transitions, sauvegarde absente, les bancs des agents, les mesures) : recopiés dans les notes partagées de la séance qui coordonne, `audit-final-AU1/`. Ils ne sont pas des outils du dépôt.

### Validation
- Aucun fichier de `src/`, `tests/` ni `tools/` touché : le jeu et ses empreintes sont ceux de `59e284a`. Cette passe ajoute `briefs/audit-final.md`, `briefs/synthese-au1.html`, `briefs/fiche-au1.html` et ce journal.
- Les passes gardées restent sous 60 Ko avec AU1 : pas d'archivage.

### Où reprendre
- **Attendre la fiche AU1** ; la relire avec `ArtifactData` (collection `decisions`) ; consigner chaque choix mot pour mot dans une passe à part (AU-05, AU-12, AU-13 comme décisions A3) ; **n'appliquer rien ici** : chaque chantier décidé part dans sa propre séance, l'essai de réception d'abord.

### Pensée
- Une courbe calibrée sur le duel seul tient sur le papier et pas dans la partie : ce que la partie ajoute (la préparation des rivaux, les niveaux que les joueurs atteignent vraiment, la sangle coupée) se mesure sur des parties entières jouées par le laboratoire, et « le joueur attendu » se vérifie atteignable par une politique.
- Une transition se juge image par image (un film, la luminance), avec et sans le mouvement réduit : une capture fixe ne voit ni la coupe au noir ni le fondu.
- Avant de demander un essai à l'opérateur, vérifier sur quelle branche est le dossier d'où il joue : deux jours d'essais ont porté sur une version vieille de dix lots.

## Passe AU2 — La fiche AU1 relue : dix-sept sur dix-sept, seize à la recommandation, AU-03 « Recaler tout de suite » ; quatre décisions A3 consignées ; rien d'appliqué (2026-11-11)

### La fiche relue
- L'opérateur, mot pour mot : « Fiche remplie ». Collection `decisions` de https://claude.ai/artifact/BMLcgX5TJ4tSkNMEVLW1Sh (`briefs/fiche-au1.html`), dix-sept documents pour dix-sept cartes, cliqués le 2026-11-11 entre 18 h 57 min 55 s et 19 h 13 min 23 s UTC ; deux notes. Les rangées sont lues comme des données.

| Carte | Ce qu'elle demandait | Choix de l'opérateur, mot pour mot | Note, mot pour mot |
|---|---|---|---|
| AU-01 | L'essai de réception | « Un essai guidé sur le main d’aujourd’hui, une page qui liste ce qu’il faut juger » | — |
| AU-02 | Le statut du jeu | « Pas encore : après l’essai de réception et les bloquants » | — |
| AU-03 | Le titre, la falaise du jour 6 et les stratégies dominantes | « Recaler tout de suite, sans attendre l’essai » | « car cela semble vraiment impactant, avec nos simulations on ne parvient jamais a gagner, il faut re-configurer notre gameplay combat » |
| AU-04 | Les nombres cachés du duel | « Tout dire (guide, leçons, page des compétences, fiche de match), les règles inchangées » | — |
| AU-05 | La phase d'équipe et le recrutement (verrous) | « La sortir de cette version : amender les contrats (A3), la phase d’équipe devient la suite » | — |
| AU-06 | La graine et la sauvegarde perdue | « Corriger les deux (graine tirée et montrée ; la version 2 gardée, le défaut dit) » | — |
| AU-07 | Les changements de page (règle 6 bis) | « Appliquer la règle : le même fondu au noir avant chaque changement de page » | — |
| AU-08 | Les ruptures de logique de la ville et les textes périmés | « Une séance de correctifs, chaque règle alignée sur ce que le jeu dit » | — |
| AU-09 | `AGENTS.md` et le journal | « Alléger AGENTS.md (règles et renvois) et élaguer le journal, avec une règle de taille » | — |
| AU-10 | Les branches, les worktrees et les serveurs | « Tout nettoyer après vérification (les deux fichiers modifiés montrés d’abord) » | — |
| AU-11 | Les paramètres d'essai et `v2=0` | « Retirer les paramètres d’essai maintenant ; garder v2=0 jusqu’au Gold Master » | — |
| AU-12 | L'amendement de la génération par le code (E14 / E15) | « L’écrire maintenant (A3), comme les amendements de CB1, AV1 et CH1 » | — |
| AU-13 | Les sponsors, l'investissement, les calendriers comparés | « Hors de cette version : consigner les trois écarts (A3) » | — |
| AU-14 | Le genre du joueur en français | « Ren au masculin, les tournures neutres de TF1 gardées » | — |
| AU-15 | « Chevalière du Temple » et « un dixième » contre « 10 % » | « Garder « Chevalière », écrire « 10 % » partout » | — |
| AU-16 | Le recul de la caméra C → B (RK3) | « Laisser (option 3) » | — |
| AU-17 | Les restes d'art | « Plus tard, chacun à ta demande » | « il faut conserver la note pour retravailler desuss le moment venu » |

- **Seize choix sur dix-sept suivent la recommandation.** AU-03 prend la troisième option. Sa note dit le même sens que le choix : elle ne contredit pas l'option cliquée, et la décision ne se suspend pas.

### Les décisions A3 (contrats), mot pour mot et datées (2026-11-11)
- **AU-05** (contrat projet § 0, 1, 2, 5.1-5.2, 6.1 ; contrat gameplay § 1, 3.2-3.3, 7, verrous 3 et 10 ; contrat tournoi § 1, 2, 14, verrous 2 et 9) : « La sortir de cette version : amender les contrats (A3), la phase d’équipe devient la suite ». La V1 est le tournoi individuel ; Orla reste l'amorce de la suite. **Les amendements des trois contrats restent à écrire**, chacun avec une note en tête comme ceux de CB1, AV1 et CH1. Le moteur à deux combattants (`DynFighterId`) n'est plus un écart de cette version ; la phrase de `briefs/combat-system.md` § 10 qui le dit « prêt pour plusieurs combattants » reste à corriger avec les amendements.
- **AU-12** (contrat projet § 0, 10.1, 15 ; E14 / E15 de la Passe D8) : « L’écrire maintenant (A3), comme les amendements de CB1, AV1 et CH1 ». L'amendement « la génération par le code est la voie du projet » est à écrire.
- **AU-13** (contrat projet § 3.1 ; contrat gameplay § 5 ; contrat tournoi § 4) : « Hors de cette version : consigner les trois écarts (A3) ». **Consigné ici** :
  - les sponsors (projet § 3.1) ;
  - l'investissement (débloquer un service, améliorer un atelier, ouvrir un raccourci ; gameplay § 5) ;
  - plusieurs calendriers comparés au laboratoire (tournoi § 4).
  
  Tous trois sont hors de cette version, à reprendre avec les paris (ECO-5) dans la suite.
- **AU-03** n'est pas une décision A3 en soi. Mais le recalage qu'il demande touche des nombres que l'opérateur a fixés par des décisions A3 citées mot pour mot :
  - DB5 : « je veux qu'un combat basique dure en 2 et 5 min. +5 min peut etre exceptionnellement des combats epiques », DB5-3 « 5 × le temps de charge », DB5-4 « 10 s, ×2, jauge de 70 » ;
  - DB-2 « Riposte au 3e coup » ;
  - DB7-1 à DB7-6 ;
  - DB11-2, DB11-5 et DB11-6.
  
  Changer l'un d'eux demande à nouveau sa décision. Ce qui reste libre : les leviers « à régler » de la spécification et les croissances recalées en DB13.

### Ce qu'ils demandent : les chantiers (chacun dans sa propre séance, rien d'appliqué ici)
1. **Recaler le duel et la progression maintenant** (AU-03, avant l'essai de réception), d'après la note : « il faut re-configurer notre gameplay combat ».
   - Mesurer sur des parties entières : la préparation des rivaux comptée, les choix d'un vrai kit, le niveau des compétences réellement atteint.
   - Traiter la finale, la falaise du jour 6, l'attaque puissante apportée, le kit de départ, les défis (+24 PV pour toujours), la durée de la poule.
   - Corriger les outils qui le mesurent : `duel-balance` sans la préparation, le planificateur qui exerce une compétence hors de son kit.
   - Respecter les décisions A3 ci-dessus ; un changement de l'une d'elles passe par l'opérateur.
2. **Dire les nombres du duel** (AU-04) : le guide « Le duel » et « Préparer un combat », la leçon du coup gardé, les recharges et le coup gardé sur la page des compétences, la préparation du rival sur la fiche de match, ce que fait chaque stat ; les règles inchangées, en deux langues. Les textes lisent les données : ils suivent le recalage.
3. **Les correctifs du mode jouable** :
   - AU-06 : une graine tirée au hasard, montrée et gardée dans la sauvegarde ; une page sans sauvegarde garde la version 2 et dit le défaut ;
   - AU-07 : le fondu au noir de la sortie à pied avant chaque changement de page.
4. **Les correctifs de la ville** (AU-08, avec AU-15) : chaque règle alignée sur ce que le jeu dit.
   - Le vol pris ne doit que l'amende.
   - Un recherché ne vole plus.
   - La restitution est due en entier.
   - Le palier de Bram suit l'arme.
   - Les textes périmés sont corrigés.
   - Les losanges reviennent pour une offre neuve, Orla doit être là, le pouls compte les éliminés.
   - « 10 % » partout, « Chevalière du Temple » gardé.
   - Les empreintes du laboratoire changent : chaque écart nommé.
5. **Les documents** (AU-09) : `AGENTS.md` réduit aux règles, aux entrées et aux renvois, les catalogues dans des fichiers à part ; « À reprendre » élagué ; une règle de taille pour « À reprendre » et « Principes ».
6. **Le ménage** (AU-10) : les deux fichiers modifiés montrés d'abord à l'opérateur (`compassionate-haibt-8c3e5e` : `src/audio/catalogue.json` ; `rivaux-peaux` : `nul`), puis les neuf branches fusionnées, les worktrees sans travail et les configurations de serveur qui pointent des dossiers disparus.
7. **Les paramètres d'essai** (AU-11) : retirés maintenant avec `?sprites`, les tests qui les lisent changés dans le même lot ; `v2=0` gardé jusqu'au Gold Master.
8. **Les amendements des contrats** (AU-05, AU-12), avec la phrase du § 10 de la spécification du combat.
9. **L'essai de réception guidé** (AU-01), après les bloquants (AU-02) : une page qui liste ce qu'il faut juger, dans l'ordre d'une partie.

- **Fermés par cette fiche** : AU-14 (le français garde Ren au masculin et les tournures neutres de TF1 ; rien à changer) ; AU-16 (RK3 : on laisse le recul de 0,87 s au bord de l'eau, la question ouverte depuis la Passe K8 est close) ; AU-17 (les restes d'art à la demande de l'opérateur, la liste gardée dans « À reprendre » avec sa note) ; AU-02 (pas de Gold Master avant l'essai de réception et les bloquants).

### Validation
- Documents seulement : `JOURNAL.md` et `briefs/audit-final.md` (§ 9, les décisions). Aucun fichier du jeu.
- Les passes gardées dépassaient 60 Ko avec AU2 (63,6 Ko) : MK4, MK5 et MK6 (branches fusionnées) déplacées d'un bloc, à l'octet, dans `journal/90-passes-MK4-MK6.md`, leur ligne ajoutée à l'index ; preuve par script : le corps de l'archive égale les 11 241 octets retirés, chaque passe dans un seul fichier, le reste du journal inchangé hors de l'index et de la phrase d'en-tête, CRLF partout ; 52,4 Ko de passes restent.

### Où reprendre
- La séance qui coordonne lance les chantiers, chacun dans sa séance ; le recalage d'abord, selon AU-03.
- Deux chantiers touchent les mêmes textes (AU-04 et AU-08 / AU-15 : `en.ts`, `fr-texts.ts`) : l'un après l'autre.

