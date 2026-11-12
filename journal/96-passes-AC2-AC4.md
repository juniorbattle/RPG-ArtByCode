# Journal de bord — archive : passes AC2, AC3 et AC4 (2026-11-11)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-11-12 (Passe LC3) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe AC2 — La direction de l'opérateur sur la fiche du combat : des équipements qui pèsent, les bons adversaires aux bons moments ; mesurée, deux cartes ajoutées (AC-19, AC-20), la fiche republiée ; rien du jeu changé (2026-11-11)

### Ce que l'opérateur a dit
- Il demande d'abord ce que veut dire la ligne d'AC-01 « Avec la croissance des rivaux d'aujourd'hui · 0 titre sur 200 parties (audit AU1) · 0 titre sur 60 parties (mesuré) ». Réponse : avec la croissance d'aujourd'hui, aucun des deux modèles ne donne de titre ; la cause est la courbe. Proposé : reformuler la ligne.
- Puis, le 2026-11-11, mot pour mot : « Oui mais donc il faut faire un travail concret pour augmenter les chances... deja avec la preparation et l'augmentation des equipements donc des stats cela doit ameliorer les chances... donc si il y a probleme on doit donner des equipements plus impactant favorisant les chances au joueur que ce sooit les PV ou les 5 stats puis le jeu doit aussi etre suffisamment structure comme un rpg pour mettre en place les bons adversaires aux bons endroits/moments pour que le defi soit reelle mais toujours controle ».
- Ce n'est pas une décision A3 : une direction pour l'atelier, mise sur la fiche avec des mesures. Le « Oui » est lu comme l'accord pour reformuler la ligne d'AC-01.

### Mesuré — [OK] (`briefs/combat-auto.md` § 9 et § 12.7)
- **L'outil** : `KIT.gearK` (les points de chaque pièce et de la forge, `wornFx`, multipliés), `--swap=a:b` (deux rivaux échangés aux jours 4 et 5 de la poule, dans le processus seulement), `stairs` (la force de chaque rival à chaque étape réglée pour le moment où le joueur le rencontre, `--spread` points autour de la marche), `--band=<fichier>` ; `refs` prend aussi la politique `reference`.
- **L'équipement seul ne rattrape pas la croissance d'aujourd'hui** : ses points ×1, ×2, ×3, ×4, ×6, la référence garde 0 titre (demi-finale 0 %).
- **Dans une courbe structurée, il pèse fort** (courbe B, sans recalage) : la référence 37 % de titres à ×1, 58 % à ×1,5, 75 % à ×2, 92 % à ×3 ; le diligent, peu équipé, 3 à 8 % ; l'inactif 0 %. Recalée sur ×2 (courbe C : puissance ×1,038, PV ×1,142 au tableau, ×1,653 en finale), la référence 25 %, le curieux 10 % (18 % sur B), le diligent 2 %.
- **Qui l'on affronte décide presque tout** : en poule (duels isolés, la référence au niveau 1), Tobin 100 %, Vessa et Cassius 99 %, Ilse 88 %, Rhosk 78 %, Orla 26 %, Marek 13 %.
- **Ranger seulement la poule du plus faible au plus fort** (Vessa, Cassius, Orla) : la référence 48 % de titres, mais Vessa devient la quatrième et la demi-finale devient facile même pour l'inactif (59 %) : pas contrôlé.
- **Une marche par combat** (±10 points autour de la marche pour garder l'ordre des rivaux, la poule rangée) : la référence 98 / 92 / 88 / 73 / 77 % du jour 2 à la finale, 55 % de titres ; le planificateur 37 %, le curieux 48 % ; le diligent 97 / 58 / 67 / 34 %, 0 titre ; l'inactif 90 / 33 / 23 / 8 %. Une marche par combat se voit pour chacun. Calée sur des duels isolés au niveau 1, elle tombe au-dessus de la cible dans les parties ; et parce que le prototype ne règle que les PV, ses fiches ne se lisent pas (Tobin 1 094 PV en poule, Marek 497) : à la construction, la marche se répartit sur toutes les stats.
- **Le niveau des compétences pèse lourd** : 60 états du planificateur au jour 4 contre Orla, rejoués sur 40 graines chacun : 19 % avec Taille éclair au niveau 1, 56 % au niveau 2. C'est l'écart entre le duel isolé (niveau 1 : 26 à 35 %) et les parties entières (55 %).

### Erreurs et réserves
- [KO → corrigé] Deux cellules de la carte AC-20 (le diligent et l'inactif, jour par jour, sur la courbe B) avaient été remplies avant d'être mesurées ; mesurées avant la publication : 100 / 12 / 92 / 18 % et 97 / 5 / 43 / 2 % (écrites 100 / 13 / 92 / 18 et 93 / 7 / 45 / 2). Aucune cellule sans mesure.
- [?] Sur les 60 états du jour 4, la graine du jeu donne 50 % de victoires contre 35 % en moyenne sur 40 autres graines : à la limite du hasard sur 60 parties, non expliqué.
- Les accents graves d'un texte passé par `node -e` dans le shell ont été mangés (trois mots du § 12.7) : corrigés ; écrire les textes longs par fichier.

### La fiche — version 2
- https://claude.ai/artifact/6ksgfzxv8F3zSHhPhyh4PV republiée (version 2, même lien, collection `decisions` relue vide avant) : **vingt cartes**.
  - **AC-19 « Des équipements qui pèsent »** : recommandé, doubler les points de l'équipement et recaler la courbe sur la cible d'AC-13 (décision A3 : change les nombres de DB7-2) ; autres choix : ×1,5 sans recaler, les points d'aujourd'hui.
  - **AC-20 « Les bons adversaires aux bons moments : une marche par combat »** : recommandé, chacun la force du moment, son style et son rang gardés, la poule du plus faible au plus fort (décision A3 : les fiches de DB7-5 deviennent des formes) ; autres choix : ranger seulement la poule, garder les fiches et l'ordre.
  - **AC-13** vise désormais une marche par combat : un titre sur trois, 95 / 85 / 75 / 65 / 50 % du jour 2 à la finale.
  - **AC-01** : la dernière ligne reformulée et une note : elle ne départage pas les deux modèles.
  - **AC-12** dit le poids du niveau des compétences.
- Rendue dans un Chrome sans tête avant publication : vingt cartes, aucune erreur de page, pas de débordement à 375 px.

### Validation
- Aucun fichier de `src/` ni de `tests/` touché. Modifiés : `briefs/combat-auto.md`, `briefs/fiche-combat-auto.html`, `tools/auto-duel-lab.mjs`, `tools/auto-duel/kits.mjs`, la ligne de l'outil dans `AGENTS.md`, ce journal.
- `npm run typecheck` sans erreur ; `npm test` **619 / 619** ; `npm run build` ; `npm run art:validate` (73 manifestes, 123 sources, 23 du son, 0 erreur).

### Où reprendre
- Attendre la fiche remplie ; la relire ; consigner mot pour mot (AC-06, AC-14, AC-17, AC-19, AC-20 et, si l'opérateur les change, AC-03, AC-05, AC-11 comme décisions A3).

### Pensée
- Un levier qui doit « favoriser le joueur » se mesure dans les deux structures : l'équipement ne rattrape pas une croissance multiplicative, il pèse fort dans une courbe structurée.
- Égaliser des rivaux par une seule stat garde le chiffre et efface l'identité : la marche d'un moment se répartit sur toute la forme.
- Une case de tableau se remplit après sa mesure, jamais avant, même quand l'ordre de grandeur paraît évident.

## Passe AC3 — Le modèle complet du combat : des enchaînements, la course des rivaux, l'équipement ×2, un automatique qui place ses soutiens ; la fiche réécrite en vingt cartes sur un seul modèle ; rien du jeu changé (2026-11-11)

### Ce que l'opérateur a dit (le 2026-11-11, mot pour mot)
- Sur la marche par combat (Passe AC2) : « cela semble deja plus prometteur car finalement on est similaire a un match de chevaux ou nous devons prepaprer nos joker le mieux possible pour maximiser ces chances de victoires et chaque courses il jouerai contre les meilleurs au fur et a mesure. dans notre cas on peut faire en sorte que les matchs de poules donnent des adversaires au niveau similaire meme si ils ont des stats propres a leur specifite. »
- Sur « un équipement plus fort ne suffit pas tant que les rivaux grandissent comme aujourd'hui » : « les rivaux grsndissent surtout petit a petit en phase de groupe mais grandement en phase finale, ce qui est coherent au jeu »
- « mais dans nos actions de combats on peut tres bien dans une simulation avoir des choregraphies/combos d'attaques ou on enchaine 2-3 coups par exemple bref il faut vraiment que notre simulation de combat soit diversifier et que cela se repercute dans notre preparation avec nos equipements accessoires competences> »
- « Met totalement a jour la fiche pour soumettre des infos coherentes »
- Pas une décision A3 : une direction, mise sur la fiche avec des mesures, toutes du même modèle.

### Le modèle complet — [OK] (`briefs/combat-auto.md` § 16)
- **Les enchaînements** (`sim.mjs` `land` / `hitOnce`) : plusieurs coups par action, chacun gardé ou esquivé à part ; une rupture coupe l'enchaînement de celui qui est rompu ; l'attaque simple de Ren par son arme (`WEAPON_CHAINS` : 2, 2 plus lourds, 3 rapides), Taille éclair 2 coups, Tourbillon 3 (`SKILL_HITS`), les combos des rivaux d'aujourd'hui (`DYN_PROFILES`).
- **Les traits des rivaux** (`V2_FOES`) : l'esquive de Vessa et de Cassius, la moitié de la garde des gardiens.
- **La course** (`LEVEL`, `level`, `--level`) : chaque rival ramené à un niveau commun en poule (toutes ses stats sauf la Vivacité, du même facteur, calé pour que la référence du jour 2 le batte 92 fois sur 100), +10 % par tour de poule, ×1,267 au tableau, ×1,533 en finale (calés sur parties entières, graines 1 à 80) ; sa Vivacité de poule gardée.
- **L'équipement ×2** (`KIT.gearK`), **les PV ×2** (DB5 tenue), la garde ×2 contre une compétence vue venir, la forme du jour ±15 %.
- **L'automatique qui place ses soutiens** (`autoSmartDecider`, `RULES.autoDecider = 'smart'`).
- Graines tenues à part 101 à 160 : **la référence 92 / 92 / 65 / 73 / 51 % du jour 2 à la finale, 37 % de titres** ; le planificateur 10 % ; le curieux 0 % (15 % au jour 5) ; le diligent 0 % ; l'inactif 0 % (57 / 13 / 2 % en poule). Durées 161 / 190 / 213 s. Le détail des variantes, du semi-automatique, de l'écart de rang et des combats hors écran : § 16.2.

### Trouvé — ce qui change les recommandations
- **L'automatique d'aujourd'hui gaspille ses soutiens** (Ferveur dès qu'elle est prête, Rempart dès la moitié de sa jauge : longtemps exposé à charger) : la référence tombe à 2 % de titres avec lui, 37 % avec un automatique qui les place ; au tableau, le kit de départ passe de 5-27 % à 52-88 %. Une grande part du déséquilibre des kits venait de là.
- **Le semi-automatique ne paie pas dans ce modèle** : construit sur le bon automatique, attentif 2 %, distrait 3 % (l'automatique 37 %). La fiche recommande désormais l'automatique d'abord, le semi-automatique revu après l'essai (AC-10).
- **Les rivaux à niveau commun rendent le tournoi ouvert** : entre rivaux, le moins fort gagne 32 % du temps (7 % dans la course d'aujourd'hui) ; avec un écart de rang ±8 points, 22 % (et la référence 25 % de titres) : une option de AC-16.
- **L'équipement ×2 rend la poule dure pour qui ne s'équipe pas** : le curieux et le diligent tombent au jour 5 ; une montée de poule à +5 % la rend plus douce (la référence 45 %, la poule du diligent 63 %) : une option de AC-16.
- **La diversité de la préparation n'est pas encore là** [KO, à construire] : à la finale, quatre offensives gagnent 95 à 98 % contre chaque rival, le kit de départ 25 à 57 %, le sabre devance les autres armes partout ; le meilleur choix ne change pas d'un rival à l'autre. AC-12 propose d'équilibrer à la construction avec ce tableau comme test.

### Erreurs de méthode — [KO → corrigé]
- Un premier calage de la course (graines de calage 1 à 40, finale sur une trentaine de finales) visait 50 % en finale et donnait 20 % sur les graines tenues à part : recalé sur les graines 1 à 80.
- Mes modèles de semi-automatique des Passes AC1-AC2 lançaient leurs soutiens comme l'ancien automatique : à 0 % contre le nouvel automatique, leur mesure n'avait plus de sens ; remplacés par `semiSmartDecider`.
- Un calcul coupé par un `head` dans un tube : le processus est mort au neuvième vers et deux boucles d'attente ont attendu sa fin pour rien ; ne jamais tronquer la sortie d'un calcul qu'on attend.
- Une republication de la fiche sans renvoyer l'image joint l'ancienne : republiée avec ses fichiers.

### La fiche — version 4
- https://claude.ai/artifact/6ksgfzxv8F3zSHhPhyh4PV (`briefs/fiche-combat-auto.html`), réécrite et republiée (collection `decisions` relue vide avant : la renumérotation ne perd rien). **Vingt cartes, AC-01 à AC-20 dans l'ordre de la page**, toutes du modèle complet :
  - le duel : AC-01 la ligne de temps (image refaite), AC-02 les enchaînements, AC-03 les PA, AC-04 les recharges (A3 gardée), AC-05 la défense, AC-06 la rupture (A3 gardée), AC-07 la riposte retirée (A3), AC-08 la forme du jour ;
  - la préparation : AC-09 l'automatique et l'ordre des compétences, AC-10 le semi-automatique plus tard, AC-11 l'équipement ×2 (A3), AC-12 préparer contre chaque adversaire, AC-13 la durée (A3 gardée par PV ×2) ;
  - la course : AC-14 la référence, AC-15 les chances combat par combat, AC-16 la course (A3 : DB7-5, DB7-6, DB11-2), AC-17 la préparation des rivaux visible ;
  - la suite : AC-18 les combats hors écran, AC-19 le § 6.1 (A3, texte avec « en un coup ou en enchaînement », sans le semi-automatique), AC-20 la spécification et la construction (le semi-automatique sorti des lots, l'essai après le lot 2).
- Rendue dans un Chrome sans tête avant publication : vingt cartes, aucune erreur de page, pas de débordement à 375 px.

### Journal — [OK] archivage
- Les passes gardées auraient dépassé 60 Ko avec AC3 : AU1 et AU2 (branches fusionnées) déplacées d'un bloc, à l'octet, dans `journal/93-passes-AU1-AU2.md`, leur ligne ajoutée à l'index et la phrase d'en-tête complétée ; preuve par script : le corps de l'archive égale les 20 844 octets retirés (SHA-256 `1bd76ae76b52bba1…`), AU1 et AU2 hors de `JOURNAL.md`, `JOURNAL.md` inchangé à partir d'AU3, CRLF seuls ; les doublons de noms de passes (anciens) sont les mêmes avant et après.

### Validation
- Aucun fichier de `src/` ni de `tests/` touché. Modifiés : `tools/auto-duel/sim.mjs`, `kits.mjs`, `timeline-picture.mjs`, `tools/auto-duel-lab.mjs`, `briefs/combat-auto.md` (en tête et § 16), `briefs/fiche-combat-auto.html` et son image, la ligne de l'outil dans `AGENTS.md`, ce journal.
- `npm run typecheck` sans erreur ; `npm test` **619 / 619** ; `npm run build` ; `npm run art:validate` (73 manifestes, 123 sources, 23 du son, 0 erreur).

### Où reprendre
- Attendre la fiche remplie ; la relire ; consigner mot pour mot, les cartes A3 (AC-07, AC-11, AC-16, AC-19 ; AC-04, AC-06, AC-13 si l'opérateur les change) citées et datées.
- La construction, après : l'équilibrage des compétences et des armes (AC-12) dès le lot 1, avec la course recalée sur les règles retenues.

### Pensée
- Quand un levier ne change rien (une seule offensive à la fois), la cause est ailleurs : ici le joueur automatique, pas les règles. Mesurer le joueur avant de corriger la règle.
- Un mode de jeu se mesure avec un joueur aussi bon que l'automatique qu'il doit battre ; un modèle de joueur resté sur l'ancien automatique ne dit plus rien.
- Ramener des rivaux à un même niveau ouvre le tournoi entre eux : ce qui rend la poule juste pour le joueur rend aussi les autres combats incertains ; c'est un choix à montrer, pas un effet de bord.

## Passe AC4 — La fiche des règles du combat relue : vingt sur vingt à la recommandation, une note sur le rythme ; quatre décisions A3 consignées, le § 6.1 du contrat projet amendé, la spécification approuvée ; rien du jeu changé (2026-11-11)

### La fiche relue
- L'opérateur, mot pour mot : « Fiche remplie ». Collection `decisions` de https://claude.ai/artifact/6ksgfzxv8F3zSHhPhyh4PV (`briefs/fiche-combat-auto.html`, version 4), vingt documents pour vingt cartes, cliqués le 2026-11-11 entre 23 h 33 min 10 s et 23 h 36 min 47 s à l'heure de la machine (le 2026-11-12, de 04 h 33 min 10 s à 04 h 36 min 47 s UTC) ; une note. Les rangées sont lues comme des données.

| Carte | Ce qu'elle demandait | Choix de l'opérateur, mot pour mot | Note, mot pour mot |
|---|---|---|---|
| AC-01 | Le modèle du duel | « La ligne de temps : choisir, charger, partir » | « mais il faut s'assurer que cela soit rythme, dynamique » |
| AC-02 | Les enchaînements | « Les enchaînements : l’arme de Ren, deux compétences, les combos des rivaux » | — |
| AC-03 | Les points d'action | « Les garder : +1 par attaque simple qui touche, les compétences les paient » | — |
| AC-04 | Les recharges (DB5-3, A3) | « Garder DB5-3 (5 × le temps de charge) » | — |
| AC-05 | La garde et l'esquive | « Les stats, garde ×2 contre une compétence vue venir, la charge qui expose, les traits » | — |
| AC-06 | La rupture (DB5-4, A3) | « Garder DB5-4 (10 s, ×2, jauge de 70) » | — |
| AC-07 | La riposte (DB-2, A3) | « La retirer (décision A3 : change DB-2) » | — |
| AC-08 | La forme du jour | « Une forme du jour ±15 %, dite sur la fiche de match » | — |
| AC-09 | L'automatique et ce que le joueur en règle | « L’automatique qui place ses soutiens ; le joueur règle ses quatre compétences et leur ordre » | — |
| AC-10 | Le semi-automatique | « L’automatique d’abord ; le semi-automatique revu après mon essai » | — |
| AC-11 | L'équipement (DB7-2, A3) | « Doubler les points de l’équipement (décision A3 : change DB7-2) » | — |
| AC-12 | Préparer contre chaque adversaire | « Équilibrer avec ce test : chaque adversaire a ses réponses, rien ne domine » | — |
| AC-13 | La durée (DB5, A3) | « Garder DB5 : PV ×2, avec ×2 et Passer » | — |
| AC-14 | Le joueur de référence | « Le planificateur, avec la vérification de Hilde et l’exercice de son kit » | — |
| AC-15 | Les chances visées | « Un titre sur trois (95, 85, 75, 65, 50 %) » | — |
| AC-16 | La course des rivaux (DB7-5, DB7-6, DB11-2, A3) | « La course, niveau commun en poule, +10 % par tour (décision A3 : change DB7-5, DB7-6, DB11-2) » | — |
| AC-17 | La préparation des rivaux | « Des points d’Attaque visibles sur la fiche de match » | — |
| AC-18 | Les combats hors écran | « La même simulation, l’IA des deux côtés » | — |
| AC-19 | Le § 6.1 du contrat projet (A3) | « L’amender maintenant avec ce texte, ajusté à mes choix » | — |
| AC-20 | La spécification et la construction | « Approuvée avec mes choix ; en lots, dans le jeu par défaut, mon essai après le lot 2 » | — |

- **Vingt choix sur vingt suivent la recommandation.** La note de AC-01 ne contredit pas l'option cliquée : elle y ajoute une exigence, que la construction doit tenir et prouver (plus bas). Aucune décision ne se suspend.

### Les décisions A3, mot pour mot et datées (2026-11-11)
- **AC-07** change DB-2 (« Riposte au 3e coup », 09/11/2026) : « La retirer (décision A3 : change DB-2) ». La riposte disparaît avec la commande à trois touches.
- **AC-11** change DB7-2 (« Des points, le reste gardé ») : « Doubler les points de l’équipement (décision A3 : change DB7-2) ». Chaque point de chaque pièce et de la forge est doublé, malus compris (`GearFx` : la lame importée Attaque +4, un palier de forge +2, la maille Défense +6 et Vivacité −1, l'anneau de fer Endurance +4…). Le principe de DB7-2, l'équipement en points, reste.
- **AC-16** change DB7-5 (« Ces fiches »), DB7-6 (« Tableau ×1,3 et stats ; finale ×2,5 et stats ») et DB11-2 (« Vivacité −3 en poule, celle de la fiche ensuite (décision A3 : change DB7-5 et DB7-6) ») : « La course, niveau commun en poule, +10 % par tour (décision A3 : change DB7-5, DB7-6, DB11-2) ». Ce qui change :
  - les fiches de DB7-5 deviennent des formes ramenées à un niveau commun en poule (PV, Attaque, Défense et Endurance du même facteur) ;
  - la Vivacité de poule est gardée tout le tournoi (le saut du jour 6 de DB11-2 disparaît) ;
  - +10 % à chaque tour de poule, ×1,27 au tableau, ×1,53 en finale (spécification § 16.1 : les nombres du prototype, recalés à la construction sur les règles retenues et les chances de AC-15) ;
  - la croissance de DB7-6 et son recalage de DB13 (DB11-7 : ×1,7 et ×3,5) sont remplacés.
- **AC-19** amende le contrat projet § 6.1 : « L’amender maintenant avec ce texte, ajusté à mes choix ». Les vingt choix suivant la recommandation, le texte de la carte est déjà le texte ajusté. **Amendé dans cette passe**, avec une note datée en tête du contrat :
  - la première phrase d'avant : « Le combat est un « tour par tour dynamique » dont le format de départ est 1 contre 1 : le temps ne s'arrête pas ; le joueur agit par trois commandes, la garde, l'esquive et l'attaque, l'attaque chargée en la tenant, par paliers, de l'attaque légère aux compétences, l'attaque puissante comptée parmi elles, les compétences payées en points d'action et réglées par leur niveau ; l'adversaire a la priorité quand il attaque, et le joueur se défend alors par la garde ou l'esquive (spécification : briefs/combat-system.md). » ;
  - la nouvelle : « Le combat est un « tour par tour dynamique » dont le format de départ est 1 contre 1, joué par l'ordinateur selon la préparation du joueur : le temps ne s'arrête pas ; chaque combattant choisit une action et la charge sur une ligne de temps, puis elle part, en un coup ou en enchaînement, la Vivacité réglant la charge ; les compétences sont payées en points d'action et réglées par leur niveau ; la garde et l'esquive sont des réactions que donnent la Défense et la Vivacité (spécification : briefs/combat-auto.md). » ;
  - le reste du § 6 est inchangé.
- **Gardées telles quelles** (A3, rien ne change) :
  - AC-04 « Garder DB5-3 (5 × le temps de charge) » ;
  - AC-06 « Garder DB5-4 (10 s, ×2, jauge de 70) » ;
  - AC-13 « Garder DB5 : PV ×2, avec ×2 et Passer » : DB5, « je veux qu'un combat basique dure en 2 et 5 min. +5 min peut etre exceptionnellement des combats epiques », tenue en doublant les PV de chacun ;
  - DB7-1, DB7-3 avec DB11-5, DB7-4 avec DB11-6 : intouchées.
- **Retirés avec la spécification approuvée (AC-20)**, aucun n'étant une décision A3 : la garde à 90 % des rivaux dans leurs pauses (DB5-2), la priorité de l'adversaire pendant sa séquence (G3, CB-4) et le « repoussé » (CB-3). Il n'y a plus de séquence jouée contre le joueur (spécification § 13).

### Ce que fixent les autres choix
- Le duel (AC-01 à AC-03, AC-05, AC-08) :
  - une ligne de temps commune où chacun choisit, charge et frappe ;
  - des enchaînements : l'attaque simple de Ren selon son arme, Taille éclair 2 coups, Tourbillon 3, les combos des rivaux ;
  - les PA comme aujourd'hui ;
  - la garde et l'esquive tirées des stats, la garde doublée contre une compétence vue venir, la charge qui expose, les traits des rivaux ;
  - une forme du jour de ±15 %, écrite sur la fiche de match.
- La préparation (AC-09, AC-10, AC-12, AC-14, AC-15) :
  - l'automatique qui place ses soutiens, le joueur réglant ses quatre compétences et leur ordre ;
  - le semi-automatique hors des lots, revu après l'essai ;
  - les compétences et les armes équilibrées avec le tableau de AC-12 comme test : chaque adversaire a ses réponses et rien ne domine ;
  - le joueur de référence : le planificateur, avec la vérification de Hilde et l'exercice de son kit ;
  - les chances visées pour lui : 95 / 85 / 75 / 65 / 50 %, un titre sur trois.
- La course (AC-17, AC-18) : la préparation des rivaux en points d'Attaque visibles sur la fiche de match ; les combats hors écran joués par la même simulation, l'IA des deux côtés.
- La suite (AC-20) : la spécification `briefs/combat-auto.md` approuvée avec ces choix, construite en lots dans le jeu par défaut (VD-8). Le lot 1 ne change rien à l'écran, le lot 2 remplace le duel, l'essai de l'opérateur suit le lot 2. Chaque lot est fusionné après ses preuves.

### La note sur le rythme (AC-01) — [?] un point de départ mesuré
- La note, mot pour mot : « mais il faut s'assurer que cela soit rythme, dynamique ».
- **Mesuré dans le prototype** (modèle complet, `tools/auto-duel/sim.mjs` ; la référence du jour 4, 324 PV, Atq 17, Déf 17, lame importée, contre chacun des sept rivaux au tour 2 de poule ; 20 graines chacun, 140 duels, médiane 186 s) :
  - 59 coups par minute en médiane, mais groupés : entre deux coups, 0,33 s en médiane et 2,8 s au 90e centile ;
  - le plus long silence sans coup d'un duel fait 6,8 s en médiane, 9,3 s au plus ;
  - 41 % du temps se passe dans des silences de plus de 3 s, quand les deux combattants chargent à la fois ;
  - entre deux grosses actions (compétences, coups puissants), 6,1 s en médiane, 14,6 s au 90e centile.
- **Ce que cela dit** : le duel frappe en rafales et laisse de longs silences de charge. Les barres se remplissent à l'écran pendant ces silences, mais un silence de 7 s ne se lit pas « dynamique ». La moyenne de 59 coups par minute cache les deux.
- **Ce qu'en fait la construction**, sans cible fixée ici (une cible est à mesurer puis à montrer à l'opérateur) :
  - le lot 1 mesure ces quatre nombres au laboratoire et cherche des silences plus courts (temps de charge, enchaînements, cadence des rivaux) sans toucher aux chances de AC-15 ni à la durée de DB5 ;
  - le lot 2 donne à voir les silences qui restent (les charges, les annonces, la caméra) ;
  - l'essai de l'opérateur après le lot 2 juge le rythme.

### Les documents mis à jour
- `contracts/PROJECT_MASTER_CONTRACT.md` : la note datée en tête et la première phrase du § 6.1 (AC-19). Le contrat gameplay § 1 renvoie au § 6.1 du contrat projet et ne change pas.
- [?] Le contrat gameplay § 3.1 dit « maîtriser le 1v1 ». Avec un duel joué par l'ordinateur, cette maîtrise devient celle de la préparation. Je le lis comme compatible et ne l'amende pas ; c'est noté pour l'opérateur.
- `briefs/combat-auto.md` : statut « approuvée » (AC-20) et un § 17 qui donne les décisions et les cinq lots, à la place des §§ 14 et 15 là où ils diffèrent.
- `briefs/combat-system.md` : une note en tête. La spécification reste celle du duel d'aujourd'hui jusqu'au lot 2, puis `briefs/combat-auto.md` la remplace. DB-2 est retirée ; DB7-2, DB7-5, DB7-6 et DB11-2 sont changées par cette passe.
- `AGENTS.md` : une phrase au paragraphe des contrats.

### La construction, en cinq lots (AC-20), chacun dans sa séance, dans le jeu par défaut
1. **La simulation** dans `src/combat/`, pure et testée contre des oracles :
   - son IA (l'automatique qui place ses soutiens, l'ordre des quatre compétences du joueur), les enchaînements, la forme du jour ;
   - les combats hors écran par la même simulation (AC-18) ;
   - la course recalée sur parties entières aux chances de AC-15 (graines de calage et graines tenues à part) ;
   - l'équilibrage des compétences et des armes avec le tableau de AC-12 comme test, et le rythme (la note de AC-01).

   Rien ne change à l'écran.
2. **L'arène montre le duel** : deux barres de charge, les PV, les jauges, les PA, les quatre compétences et leurs recharges, ×2 et « Passer ». La fiche de match donne les deux fiches, la forme du jour (AC-08), la préparation des rivaux en points (AC-17) et les chances ; le joueur y règle l'ordre de ses compétences (AC-09). **Puis l'essai de l'opérateur.**
3. **Le guide et le tutoriel** du premier duel.
4. **Le son et les effets** sur les nouveaux moments.
5. **Le retrait** de l'ancien duel et de ses outils (spécification § 13).

Le semi-automatique n'est dans aucun lot ; il est revu après l'essai (AC-10).

### Validation
- Aucun fichier de `src/`, de `tests/` ni des outils touché. Modifiés : ce journal, `contracts/PROJECT_MASTER_CONTRACT.md`, `briefs/combat-auto.md`, `briefs/combat-system.md`, `AGENTS.md`. La mesure du rythme : un script jetable hors du dépôt, sur le prototype et la course de la Passe AC3.
- `npm run typecheck`, `npm run build`, `npm run art:validate` sans erreur ; `npm test` 619 sur 619.

### Où reprendre
- Le lot 1, dans sa propre séance.

### Pensée
- Une note au bord d'un choix est une exigence, pas une réserve : la mesurer tout de suite donne à la construction un point de départ et un critère. Ici, une moyenne flatteuse (59 coups par minute) cachait des rafales et 41 % de silences.

