# Journal de bord — archive : passe AC1 (2026-11-11)

> Déplacée mot pour mot de `JOURNAL.md` le 2026-11-12 (Passe LC2) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe AC1 — L'atelier de refonte du combat : la spécification du combat joué par l'ordinateur, un prototype à ligne de temps mesuré sur des parties entières, la fiche des règles publiée ; rien du jeu changé (2026-11-11)

### Demande
- La séance qui coordonne, d'après le chantier n° 1 des Passes AU2 et AU3 : mener l'atelier de refonte du combat comme l'atelier CB1 (les règles de l'opérateur, une spécification, des mesures en simulation, une fiche d'arbitrages ; la construction seulement après ses décisions). La direction de l'opérateur, mot pour mot aux Passes AU3 et AU5 (recopiée en annexe A de `briefs/combat-auto.md`) ; l'inspiration de la Passe AU4, le principe et non le jeu ; les cinq propositions de la Passe AU5 à mesurer, pas à appliquer. Les décisions A3 (le § 6.1 du contrat projet, DB5 et sa durée, DB5-3, DB5-4, DB-2, DB7-1 à DB7-6, DB11-2, DB11-5, DB11-6) ne changent que par l'opérateur. Les questions sur une fiche regroupée, jamais une par une.
- Branche `claude/atelier-combat-auto` (le worktree `priceless-tharp-71c68f`, tiré de `main` `41d24bd`). Aucun serveur lancé.

### Méthode
- **Les règles de l'opérateur** : déjà recueillies mot pour mot (Passes AU3, AU5) ; aucune question posée une par une, toutes les décisions sur la fiche.
- **Le prototype** (des outils de mesure, pas le jeu ; rien dans `src/` ne les lit) : `tools/auto-duel/sim.mjs` (la simulation à ligne de temps, pure, à événements, déterministe ; chaque règle de la fiche en interrupteur), `tools/auto-duel/kits.mjs` (Ren et les rivaux tirés des données du jeu : les stats, les compétences et leurs niveaux, les fiches, les compétences de C3, les tempos de `DYN_LEVELS`), `tools/auto-duel-lab.mjs` (`refs`, `duels`, `calibrate`, `fit`, `games`, `variants`, `offscreen`), `tools/auto-duel/timeline-picture.mjs` (l'image de la fiche).
- **Les parties entières** : la boucle d'`autoplay` de `src/tournament/lab.ts`, les combats du joueur et ses défis joués dans le prototype (l'état du jeu donne Ren : `v2Stats`, `v2Mods`, `v2KitOf` ; le rival : sa fiche à l'étape, sa préparation, sa blessure ; une sangle coupée y compte) ; les combats hors écran restent la course d'aujourd'hui. Graines de calage 1 à 40, **graines tenues à part 101 à 160**.
- **Le joueur de référence** (`reference`, dans l'outil) : le planificateur du laboratoire, plus deux habitudes qu'il n'a pas (audit § 2.3) : faire vérifier son équipement par Hilde le matin d'un combat du tableau ou après un signe, et exercer les compétences qu'il emporte (il exerce l'attaque puissante, qu'il n'emporte pas).

### Le modèle proposé (`briefs/combat-auto.md`, brouillon)
- Chaque combattant, Ren comme ses rivaux, suit la même boucle : choisir une action, **la charger** (la zone d'attente de l'opérateur, × 10 / Vivacité pour Ren, × la Vivacité du kit / la Vivacité pour un rival : DB7-1), elle part, choisir la suivante ; les deux charges courent en même temps ; rien ne coupe une charge (V2-2), la rupture la met en pause.
- Les PA gardés (+1 par attaque simple qui touche, les compétences paient, 1 au départ, 5 au plus), les recharges de DB5-3, la rupture de DB5-4, les cinq stats et leurs formules : gardés.
- La garde par la Défense (35 % à égalité), l'esquive par la Vivacité (12 %), une formule de rapport comme celle des dégâts ; personne ne garde ni n'esquive pendant la charge d'une compétence ; proposé : la garde ×2 contre une compétence vue venir (sa barre l'annonce).
- La riposte (DB-2) n'a plus de raison d'être (A3 à changer). Une forme du jour ±15 %, dite sur la fiche de match. Les combats hors écran dans la même simulation. L'automatique par défaut, le semi-automatique au choix.

### Mesuré — [OK] (le détail : `briefs/combat-auto.md` § 12)
- **Les joueurs réels** (`refs`, graines 1 à 30) : le planificateur en poule 324 PV, Atq 14, Déf 13, End 10, Viv 9,5 ; au tableau 390 PV ; en finale 414 PV, 16,5 / 14 / 12 / 9,5 ; le curieux 372, 478, 550 PV ; les compétences au niveau 1. La préparation des rivaux rencontrés : 51-57, 88-91, 100.
- **La croissance d'aujourd'hui donne la même falaise dans le prototype** : le planificateur 66 / 0 / 0 % en poule, au tableau et en finale (duels isolés) ; sur parties entières, la référence 0 titre sur 60. La cause est la courbe, pas la façon de combattre.
- **La Vivacité rendue au tableau (DB11-2)** fait bondir le rythme des rivaux de 43 % au jour 6 : pour tenir une cible, un calage demande alors des PV ×0,58 à ×0,68 au tableau, des rivaux plus faibles qu'en poule ; sur parties entières avec le reste de la courbe B, 0 titre.
- **La courbe B** (calée par `fit` sur parties entières) : les rivaux à leur Vivacité de poule tout le tournoi, leur préparation en points d'Attaque visibles (+1 par 25 au-dessus de 20), leur puissance ×0,988, leurs PV ×1,015 au tableau et ×1,384 en finale, aucun point par étape, `hpScale` 1,5. Graines 101 à 160 : **la référence 35 % de titres** (poule 85, demi-finale 67, finale 54 %), le planificateur tel quel 13 %, le curieux 18 %, le diligent 3 %, l'inactif 0 %. La courbe A (+1 et +2 aux stats par étape) demandait PV ×0,868 au tableau : écartée (illisible).
- **Les règles** (`variants`, courbe B, référence / inactif) : la base 37 / 0 % ; sans PA 90 / 2 % (deux fois moins de retournements) ; sans recharge 100 / 12 % ; rupture 6 s ×1,5 22 % ; sans rupture 15 % ; la charge qui n'expose pas 27 % et des duels un tiers plus longs ; la préparation en multiplicateur caché 7 %.
- **Le semi-automatique** (titres de la référence) : avec les mêmes chances de garde contre tous les coups, l'automatique 37 %, un semi qui attend les fenêtres 23 %, au hasard 12 % : le bon moment ne rapporte rien ; avec la garde ×2 contre une compétence vue venir : 43 / 75 / 10 % ; avec la garde toujours sur alerte : 37 / 100 / 15 %.
- **La durée** : PV ×1 67 / 74 / 86 s de médiane (poule, tableau, finale), ×1,5 98 / 118 / 143 s, ×2 133 / 157 / 186 s (18 compétences, 1,6 rupture par duel) : ×2 tient DB5 « en 2 et 5 min » sans la changer.
- **Les kits** (duels isolés, contre les adversaires réellement rencontrés) : le kit de départ 74 / 74 / 38 %, quatre offensives 99 / 100 / 99 %, Fracas + Taille éclair + Estoc + Rempart 100 % partout, un kit défensif 64 / 34 / 25 % : comme aujourd'hui, les offensives dominent ; à recaler à la construction.
- **Les combats hors écran** (`offscreen`) : 0,08 à 0,10 ms par combat ; le même favori que la course dans 96 paires sur 126 ; le moins fort gagne 2,3 % du temps sans hasard, 7,1 % avec une forme du jour ±15 % et les traits d'esquive de Vessa et Cassius, contre 7,4 % dans la course ; un coup critique ne change rien (2,4 %).

### Erreurs de méthode — [KO → corrigé]
- **Un calage sur duels isolés se trompait de sens** : il moyennait cinq rivaux au tableau, puis « surtout Vessa » d'après la demi-finale du duel d'aujourd'hui ; dans les parties jouées avec le prototype, la demi-finale se joue surtout contre Orla (35 fois sur 50 pour le planificateur), avec la sangle coupée à chaque fois. Le calage isolé disait les rivaux du tableau faciles (PV ×1,9) quand les parties les donnaient trop durs (demi-finale 34 %). Corrigé : le calage se fait sur parties entières (`fit`), vérifié sur des graines tenues à part.
- **Le premier modèle du semi-automatique attentif** ne lançait rien hors des fenêtres : sans compétence, le rival n'est jamais rompu, les fenêtres ne viennent pas (18 % de titres contre 48 % pour l'automatique, courbe A). Gardé sous le nom `wait` ; un second modèle lance sa compétence dès que ses PA sont pleins.
- **La durée de charge de l'attaque simple** n'était pas transmise par l'outil (deux variantes donnaient la même ligne) : corrigé.
- **Un calage lancé avec un `&` dans une commande d'arrière-plan** a tourné détaché de la séance (il s'est terminé seul, son résultat écrit) : ne pas mettre de `&` dans une commande déjà en arrière-plan.

### La fiche — publiée, à remplir
- Page privée https://claude.ai/artifact/6ksgfzxv8F3zSHhPhyh4PV (`briefs/fiche-combat-auto.html`, l'image `briefs/fiche-combat-auto/ligne-de-temps.png`, publiée sous `img/`), le gabarit et les protections d'enregistrement de la fiche AU1 ; collection `decisions` relue vide après publication. Rendue dans un Chrome sans tête avant publication : 18 cartes, aucune erreur de page, pas de débordement à 375 px.
- **Dix-huit cartes en quatre familles** : le duel (**AC-01** la ligne de temps, **AC-02** les PA, **AC-03** les recharges, DB5-3, A3 gardée, **AC-04** la garde et l'esquive, **AC-05** la rupture, DB5-4, A3 gardée, **AC-06** la riposte retirée, DB-2, A3, **AC-07** la forme du jour) ; le joueur (**AC-08** l'automatique et le semi-automatique, **AC-09** l'ordre de priorité des compétences, **AC-10** aucun kit dominant, **AC-11** la durée, DB5, A3 gardée par PV ×2) ; la courbe (**AC-12** le joueur de référence, **AC-13** les chances visées, un titre sur trois, **AC-14** la croissance, DB7-6 et DB11-2, A3, **AC-15** la préparation des rivaux visible) ; la suite (**AC-16** les combats hors écran, **AC-17** l'amendement du § 6.1, A3, avec son texte, **AC-18** la spécification et la construction en cinq lots dans le jeu par défaut, VD-8).

### Journal — [OK] archivage
- Les passes gardées faisaient 59,7 Ko avant cette passe : LA3 et AL1 (branches fusionnées) déplacées d'un bloc, à l'octet, dans `journal/92-passes-LA3-AL1.md`, leur ligne ajoutée à l'index et la phrase d'en-tête complétée ; preuve par script : le corps de l'archive égale les 20 713 octets retirés (SHA-256 `d38bc91cf9fc29c7…`), LA3 et AL1 hors de `JOURNAL.md`, `JOURNAL.md` inchangé à partir d'AU1, CRLF seuls ; les doublons de noms de passes (C1, C2, V0 à V3, V5, anciens) sont les mêmes avant et après.

### Validation
- Aucun fichier de `src/` ni de `tests/` touché : le jeu et ses empreintes sont ceux de `41d24bd`. Ajoutés : `briefs/combat-auto.md`, `briefs/fiche-combat-auto.html` et son image, `tools/auto-duel/` et `tools/auto-duel-lab.mjs` (outils de mesure de l'atelier), une ligne de `AGENTS.md` (« Commands »).
- `npm run typecheck` sans erreur ; `npm test` **619 / 619** ; `npm run build` ; `npm run art:validate` (73 manifestes, 123 sources, 23 du son, 0 erreur).

### Où reprendre
- **Attendre que l'opérateur dise la fiche remplie** ; la relire avec `ArtifactData` (collection `decisions`) ; consigner chaque choix mot pour mot dans une passe à part ; les cartes qui changent une décision A3 (AC-06, AC-14, AC-17, et AC-03, AC-05 ou AC-11 si l'opérateur les change) citées et datées comme décisions A3 ; amender `briefs/combat-auto.md` et le § 6.1 selon ses choix.
- **Ensuite la construction**, en lots, chacun dans sa séance (AC-18) : la simulation dans `src/combat/` et la courbe recalée sur les règles retenues (sur parties entières, graines tenues à part), les compétences recalées pour qu'aucun kit ne domine (AC-10), puis l'arène, le semi-automatique, le son et les effets, le retrait de l'ancien duel. Les nombres du prototype sont des points de départ.
- Le chantier n° 2 (AU-04, dire les nombres du duel) attend toujours cette refonte.

### Pensée
- Quand une refonte retrouve la même falaise que l'ancien système, la falaise n'est pas dans le système : la mesurer dans le nouveau modèle avec l'ancienne courbe le prouve en une ligne.
- Un calage se fait là où le joueur se bat : dans une partie entière, l'adversaire rencontré, la sangle coupée et les victoires passées changent tout ce qu'un duel isolé suppose.
- Un mode « choisir le moment » ne vaut que si une règle récompense le moment : il faut le mesurer avec un joueur attentif et un joueur distrait, et une règle de défense qui rend le moment décisif sans le rendre écrasant.
- Un modèle de joueur qui attend trop se bat contre lui-même : le tester avant d'en conclure qu'un mode de jeu est inutile.

