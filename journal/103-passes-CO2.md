# Journal de bord — archive : passe CO2 (2026-11-12)

> Déplacée mot pour mot de `JOURNAL.md` le 2026-11-13 (Passe SL3) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe CO2 — La cohérence du jeu, second lot : ce que le jeu dit aligné sur ses règles (AU-08, AU-15), les vols, les offres qui reviennent, Orla, le pouls, les répliques et les scènes ; ce qui revient à l'opérateur gardé pour une fiche (2026-11-12)

### La demande
- L'opérateur, le 12/11, mot pour mot (Passe CO1) : « Oui il va falloir corriger cela en priorite des que nous le pouvons, et s'assurer que tout le reste aussi est coherent. car nous sommes dans un jeu tres connecte qui se passe dans une zone tres delimite : 1 seule ville mais plusieurs districts avec les memes personnages mais qui prposes des interactions differeentes a travers le temps ».
- Ses décisions de la fiche AU1 qui s'appliquent : AU-08 « Une séance de correctifs, chaque règle alignée sur ce que le jeu dit » et AU-15 « Garder « Chevalière », écrire « 10 % » partout » (Passe AU2). La séance coordinatrice les a laissées à cette passe (son message du 12/11).
- Les deux audits de cohérence de la Passe CO1 (lecture seule, sur `705ea57`) : ce que le jeu dit contre ses règles, environ 120 affirmations justes, 17 écarts, aucun entre l'anglais et le français ; les personnes, les lieux et les moments, 24 parties v2 entières (graines 1-8 × trois politiques), 24 600 combinaisons, 12 écarts. Détail : `combat-auto-impact-semi-NOTE.md` du dossier de notes partagé.

### Le tri
- **Corrigé ici** : ce qui contredit une règle déjà décidée (le texte qui la dit mal, ou le code qui la casse).
- **Gardé pour une fiche de l'opérateur** : ce qui touche le district gelé (Passe Z4), une décision A3, ou un cas où le texte et la règle peuvent l'un ou l'autre changer ; aucune décision prise par un agent.

### Ce qui a été corrigé — [OK]
1. **Les vols (AU-08, I5)**
   - Un vol pris sur le fait n'emportait rien, mais la restitution le facturait au prix de liste, et un exemplaire acheté ensuite était « rendu », saisi à la fouille de l'aube et refusé à la revente (`holds` compare par identifiant). Un vol pris ne compte plus que pour les marques : `takenThefts` (`src/simulation/v2law.ts`) sert à la restitution, à la fouille, aux représailles et à la revente (`v2work.ts`).
   - Un joueur recherché (trois marques) volait encore aux étals qui refusaient de lui vendre, sans marque de plus. Il n'y vole plus : `stallOpen` refuse avec la raison de Hale (`v2.steal.wanted`, `v2town.ts`).
   - La bourse vide qui efface le registre pour un créneau reste telle quelle : à la fiche.
2. **Les textes périmés (AU-08, I6) et « 10 % » (AU-15)**
   - La pénurie d'acier et la faveur de Mara, deux événements du jeu d'aujourd'hui qu'une partie v2 partage, disent les règles de la v2 : `textV2` (`src/events/types.ts`, `engine.ts`, `catalog.ts`) : « every shop raises the price of its blades and armour by 40 % », « 10 % off her prices while her goodwill holds » ; le jeu d'aujourd'hui garde ses mots, épinglés.
   - « a tenth » devient « 10 % » dans les répliques des habitués (Mara, Hilde, Pip, Corvin) et dans la réputation de Corvin ; le « jour après jour » des raisons du festival retiré (un seuil de faveur, pas des visites).
   - La bourse d'une défaite n'était jamais dite : chaque défaite d'une partie v2 dit sa réputation (+2 serrée, −5 sinon) et sa bourse (`v2.duel.lost*`, `src/tournament/pool.ts`).
   - Les paliers de Bram perdus en changeant d'arme : la page le dit depuis UM9 (`ui.wares.tierLost`) ; la règle reste.
3. **Les offres qui reviennent (AU-08, I7)** : les soins d'Anwen pour une nouvelle blessure, la vérification de Hilde le jour d'une sangle coupée, une seconde restitution et une seconde représaille gardaient leur première clé et ne marquaient plus jamais. `offerKey` (`src/simulation/v2offers.ts`) les clé par ce qui les ramène. **Orla** ne se recrute plus en son absence (`presentAt`, `src/narrative/v2story.ts`).
4. **Le pouls (AU-08, I8)** : `activeCompetitors` restait à 8 du premier au dernier jour d'une partie v2. Il compte maintenant ceux qui courent encore pour le titre : les rivaux de la poule, des demi-finales et de la finale, et le joueur tant qu'aucun combat de la Porte, aucune demi-finale ou finale perdue ne l'a sorti (`src/tournament/pulse.ts`). Le jeu d'aujourd'hui garde son compte.
5. **Le duel dit comme il se joue**
   - La garde et l'esquive : un combattant ne garde ni n'esquive pendant qu'il charge une compétence **ou un coup puissant**, **ou qu'il porte un enchaînement** (`auto.ts`, `exposed`) ; le guide et la leçon ne disaient que la compétence.
   - Tourbillon : la page des compétences montrait un coup de toute la puissance, alors que le duel en joue trois de 0,36, soit 8 % de plus. Elle additionne les coups comme le duel et dit « 3 coups d'affilée » (`skillFigures`, `hits`).
   - Les défis : le combat se livre « en pleine santé, une blessure comptant toujours » (la fiche de défi porte la part de blessure depuis EV-3, comme un combat) ; une victoire n'apprend une compétence que contre un combattant qui en a une (les six génériques n'en enseignent pas).
   - Le plafond de l'entraînement ne promet plus qu'« un défi, si » pour heavy, t1, t3, t4, d1 et s1, que personne n'enseigne (`v2.drill.capTop`).
   - L'avertissement du greffier dit le point de poule tant qu'elle se dispute, puis l'amende de 15 pièces ; « La garde double ses rondes » (jour 6) retiré, rien ne la change ; le marchandage perdu coûte un peu de la sympathie du vendeur, comme la page des marchandises le disait déjà ; la réputation monte un peu après une défaite serrée ; la taverne d'une partie v2 ne promet plus « les habitudes des rivaux » (le fait qu'elle pose, rien ne le lit) ; la ligne de Hilde ne promet plus de vérifier les boucles « à chaque passage » (la vérification est payante), Corvin dit que ses 10 % portent sur son équipement, Fenwick part « avant la grande affiche » (il est là des jours 1 à 7).
6. **Les personnes, les lieux et les moments, hors du district gelé**
   - Les figurants d'une scène hors de leurs heures (la veille, l'épilogue, la coupe, les demi-finales) restaient sur la place après elle, avec une invite et un point sur le plan, et répondaient « pas là ». Ils n'y sont plus que pendant la scène (`src/ui/playPlaza.ts`, `PlazaApp.nearby` saute une personne cachée).
   - Orla, Vessa et Ilse se défiaient le jour où elles affrontaient le joueur : elles refusent ce jour-là, contre leur adversaire du jour seulement (refuser leurs jours de combat les aurait fermées aux jours 2, 4 et 5, contre EV-4) ; les quatre rivaux de la troisième place acceptent un défi comme ceux de la Porte (`src/simulation/v2town.ts`).
   - Le travail de Corvin (les mannequins) reste fermé quand le sable l'est (une bagarre, Rhosk) (`v2work.ts`, `sandRefusal`).
   - Les répliques au mauvais moment : Marek dit « À demain » la veille de la finale seulement, « Aujourd'hui » le jour même, « Au dixième jour » avant ; il ne parle plus des « quatre » quand il a manqué la coupe ou perdu sa demi-finale (deux répliques neuves, EN et FR) ; Tobin et Orla le jour de la finale ; Tobin et Rhosk « hors course » aussi après une demi-finale perdue ; Pip sans « ce soir » ; l'annonce de la finale au jour 8 dit que la troisième place et la finale de la Porte ont réglé le reste (elles sont jouées).
   - Le conseil de la veille ne tombe plus le soir, quand le coffre d'Odo et le sable sont fermés (`townUi.ts`).
7. **Un incident de la Passe CO1, consigné ici** — [KO → corrigé] : à la fusion de CO1, une commande enchaînée par `;` a supprimé la branche, en local puis sur le dépôt distant, alors que l'avance rapide avait échoué parce que `main` avait bougé (`91c00b0`, une autre séance). La branche a été recréée depuis son commit `e9d9b9a` et repoussée aussitôt, puis rebasée sur `91c00b0` et fusionnée (`d053e10`) ; rien n'a été perdu.

### Ce qui va à la fiche de l'opérateur — [?]
1. Les figures du quai (district gelé) : l'inconnu encapuchonné le jour, Bram et Tam le soir, dessinés alors que E les dit absents (vu chaque jour) ; la forge sabotée qui dessine Bram, Hale, Wynn et l'inconnu deux fois et pas Tam ; Fenwick sans figure la nuit.
2. La restitution quand la bourse est vide : un créneau efface la dette, une bourse pleine paie tout (86 pièces dans la sonde de l'audit).
3. La recharge d'une compétence : le code compte 5 × la charge du niveau 1 à Vivacité 10, depuis le début de la charge ; les textes disent « 5 fois sa charge après son départ » (DB5-3, A3 : « 5 × le temps de charge »).
4. Le garde de la porte du parvis tiré de la feuille de Hale, quand Hale est sur le quai.
5. Anwen qui soigne dans la scène de la demi-finale perdue le soir où elle refuse les soins.
6. Le mot « forme » : les rumeurs le tirent de la préparation, la fiche de match d'un tirage de ±15 %.
7. Les 10 % de Corvin, sur son équipement seulement (le texte le dit maintenant) : les étendre à ses compétences, ou non.

### Validation
- `npm run typecheck` sans erreur ; `npm test` : **653 / 653** (tests mis à jour sur les règles telles que le jeu les dit maintenant : `v2-law` — le quatrième vol à trois marques refusé, la fouille qui laisse une pièce non volée, la restitution sans le prix d'un vol pris ; `cost-tags` — le prix de la restitution ; `ui-pages` — Tourbillon et chaque compétence à plusieurs coups ; `tutorial` — le conseil de la veille l'après-midi ; `v2-rivals` — « 10 % off » ; `v2-scenes` — Tobin et Rhosk hors course après la troisième place).
- Navigateur (serveur de la branche, port 5431), tous verts : `play-flow` gagné (graine 1, jour 2) et perdu (graine 1842 : « +2 reputation, a purse of 5 coins »), `play-day`, `challenge-flow` (défi gagné), `town-flow` `watch` et `quay`, `tutorial-proof` (92 contrôles), `scenes-flow` sur `v2-semi-lost`, `v2-epilogue`, `v2-gate-day6` (chaque figurant à son point pendant la scène).
- `npm run build` ; `npm run art:validate` : 73 manifestes, 123 sources, 23 du son, 0 erreur.
- Archivage : avec CO2, les passes gardées dépassaient 60 Ko ; LC5 et LC6 (branches fusionnées) déplacées d'un bloc, à l'octet, dans `journal/100-passes-LC5-LC6.md`, leur ligne ajoutée à l'index et la phrase d'en-tête complétée ; preuve par script : le corps de l'archive égale les 36 910 octets retirés, chaque passe dans un seul fichier, le reste du journal inchangé hors de l'index, de la phrase d'en-tête et de l'entrée 00, CRLF partout ; 36,2 Ko de passes restent.

### Pensée
- « Chaque règle alignée sur ce que le jeu dit » se lit cas par cas : quand le texte promet ce qu'une décision a fixé, on corrige le code ; quand le code applique une décision et que le texte la dit mal, on corrige le texte ; quand les deux sont possibles, on demande. Une correction qui ferme plus qu'elle ne doit (les trois défiables aux jours de poule) se mesure à la décision qu'elle touche avant d'être gardée.
- Fusionner puis supprimer une branche ne s'enchaîne qu'avec `&&`, et la suppression suit une vérification que le commit est dans `origin/main`.

