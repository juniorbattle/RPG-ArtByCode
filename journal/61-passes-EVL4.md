# Journal de bord — archive : passe EVL4 (2026-11-06)

> Déplacée mot pour mot de `JOURNAL.md` le 2026-11-08 (Passe I2) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe EVL4 — La fiche de L2 relue : treize sur quatorze à la recommandation, le soupçon devenu des marques (L2-2) ; la branche fusionnée (2026-11-06)

### Demande
- L'opérateur, mot pour mot : « Fiche remplie ». Relire `decisions` (https://claude.ai/artifact/JtHMUAQxrAoHdNq8wRytGP, source `briefs/fiche-l2.html`), consigner mot pour mot, appliquer ce qui change, refaire les mesures et les preuves touchées, puis fusionner selon L2-14.

### Les choix de l'opérateur, mot pour mot (cliqués le 2026-11-06 entre 06 h 10 et 06 h 16 UTC)
| Carte | Ce qu'elle demandait | Choix | Note de l'opérateur |
|---|---|---|---|
| L2-1 | Où le jeu explique la réputation et le soupçon | « Garder ainsi » | — |
| L2-2 | Les nombres du soupçon | aucun choix cliqué | « Hum cela m'a l'air un peu sophistique, la version de octopath traveler est parait plus simple car on etabli un pourcentage de vol sur une personne et si le vol echoue alors la reputation baisse au bout de 2-3 essaies ... donc que preferons nous ? » |
| L2-3 | Au-delà du seuil, qui refuse de te vendre ? | « Les quatre étals » | — |
| L2-4 | Le greffier après la poule | « Une amende de 15 après la poule » | — |
| L2-5 | La nuit, les étals fermés se forcent | « Garder » | — |
| L2-6 | Les trois arguments | « Garder » | — |
| L2-7 | Les trois passants et leurs pièces | « Garder » | — |
| L2-8 | La mise d’un défi | « Garder » | — |
| L2-9 | Ce qu’enseignent les éliminés du jour 6 | « Garder » | — |
| L2-10 | Les trois combattants génériques | « Garder » | — |
| L2-11 | Leur art : quelles figures, et quand | « Ces trois figures, une tâche à part après la fusion » | — |
| L2-12 | La représaille de Corra | « Garder » | — |
| L2-13 | Les actions de la ville coûtent de la préparation | « Accepter : l’enjeu est voulu » | — |
| L2-14 | Fusionner, puis ton essai | « Fusionner après la fiche, essayer ensuite » | — |

- **L2-2, la question posée dans la conversation**, mot pour mot : « L2-2, le soupçon : ta note trouve le soupçon chiffré (0 à 100, trace +5, découvert +15, pris +25, seuil 50) sophistiqué face à Octopath Traveler, où un vol raté fait baisser la réputation au bout de 2 ou 3 essais. Que préfères-tu ? »
  - Les trois options : « Des marques (Recommandé) », « Octopath strict », « Garder le soupçon chiffré ».
  - **Réponse de l'opérateur : « Des marques (Recommandé) »**, dont le texte disait : « Comme Octopath, avec ton EV-2 gardé : le registre de Hale compte des marques, une par vol pris ou découvert à l'aube. À 3 marques, les étals refusent et la garde fouille, jusqu'à la restitution chez Hale. Plus de points cachés (trace, œil de la garde) ; la chance de chaque vol reste affichée, la réputation baisse à chaque vol pris. »
  - Les options écartées disaient : « Seuls les vols ratés comptent : au 3e, les étals refusent jusqu'à la restitution chez Hale. Un vol réussi n'a aucune suite, ce qui retire « un vol non vu peut être découvert le lendemain » de ton choix EV-2 » ; et « Le système construit et mesuré : 0 à 100, trace +5, découvert +15, pris +25 (35 la nuit), seuil 50, la chance d'un vol qui baisse avec le soupçon ».
- Les treize autres choix suivent la recommandation de leur carte. L2-11 laisse l'art des génériques à une tâche à part, après la fusion : le chevalier n° 07 de la planche des personnages principaux pour Aldric, le panneau 2 de G1 pour Corra, le panneau 4 de G1 pour Ambrose. Cela répond à N7 pour deux panneaux sur trois : le panneau 1 de G1, double du héros, reste sans rôle.

### Fait — [OK], ce que les choix changent
- **Les marques** (L2-2), `src/simulation/v2law.ts` :
  - `V2State.marks` (0 à 3) remplace le soupçon chiffré ; une marque par vol pris sur le fait (étal, volet forcé ou poche) et une par vol découvert à l'aube par sa victime (les mêmes chances : 0,6, 0,85, 0,5). Un vol que personne ne voit ne marque rien tant qu'il n'est pas découvert ;
  - **à trois marques**, la fouille à l'aube et les quatre étals fermés (L2-3), jusqu'à la restitution chez Hale, qui efface le registre ; le registre tient trois marques, une quatrième ne change rien ;
  - la trace (+5) et l'œil de la garde (la chance d'un vol qui baissait avec le soupçon) disparaissent : la chance d'un vol redevient celle d'avant L2, plus le volet forcé la nuit (L2-5) ; la réputation baisse à chaque vol pris, comme avant.
- **Ce qui l'explique** (L2-1, gardé) : le chiffre « 2/3 marks » en haut à droite, dès la première marque ; ta ligne dans la page du tournoi dit « Marks {n} of 3: Sergeant Hale's ledger, apart from your name… » ; le sergent Hale dit « Your name has {n} marks in my ledger. At three… » (« one mark » au singulier).
- **Le joueur curieux** vole seulement quand le registre est vide (« vole quand le soupçon est bas », EV-16). Mesuré d'abord avec une marque permise : 21 vols par partie, 4,6 points de poule perdus au greffier, qualifié à 32 % ; une politique, pas une règle, réglée ainsi pour rester un joueur qui fait attention.
- **L'état nommé** `v2-wanted-night` atteint trois marques : la même graine, plus une poche ratée chez Fenwick.
- **`tools/play-day.mjs`** `V2=1` : le défi d'Orla a deux mises, l'outil lit leurs deux étiquettes (« 10 coins · 1 slot », « 1 slot »).

### Mesures — TournamentLab `--rules=v2`, graines 1 à 50, après les marques
| Politique | Combats gagnés | Qualifié | Finaliste | Ce que la ville voit par partie |
|---|---|---|---|---|
| `diligent` | 59,6 % | 88 % | — | rien (identique à `main`) |
| `curious` | 54,9 % | 66 % | 8 % | 5,5 vols, 1,7 pris, 3,1 découverts, 0,7 fouille, 0,7 restitution ; 2,7 marchandages (1,4 réussis) ; 1,1 pièce de passant ; 7,1 défis (3,8 gagnés) ; 1,4 marque à la fin ; 0,7 point de poule perdu |

### Tests — [OK]
- `tests/v2-law.test.mjs` aux marques : un vol non vu ne marque rien, pris une marque, découvert une marque, trois ferment, le registre tient trois, aucun œil sur la chance, Hale au singulier et au pluriel.
- `cost-tags` : l'oracle de la restitution lit les marques.
- **Vingt-deux fautes injectées une à une, toutes attrapées**, dont les trois neuves : un vol non vu qui marque, un vol découvert sans marque, un œil caché sur la chance (et le seuil, la restitution, le curieux repris aux marques).
- `npm test` **442 sur 442**, `npm run typecheck`, `npm run build`, `npm run art:validate`.

### Preuves — [OK]
- **Le jeu par défaut, inchangé** : `detshots` à 0 px contre `main` figé (`4bc0e6e`) sur les treize vues de la Passe EVL3 (la ville de nuit et à midi, le mode jouable par défaut et ses pages, la ville d'une partie v2), témoin de répétition à 0 px ; l'arène, que les marques ne touchent pas, à 0 px en Passe EVL3 ; `play-flow` par défaut `0025acce7a403773` et `V2=1` `cf669f2d59e33a8d`, `play-day` par défaut `6a942086a2616ab2`, rejoués après les marques ; TournamentLab au JSON près contre `main` figé (règles classiques et dynamiques, les trois parties scriptées, en v2 le diligent et l'idle, seul s'ajoute `v2.town`, à zéro).
- **La version 2** : `play-day` `V2=1` (1842) : tous les contrôles passent, les deux mises d'Orla lues, rejoué en Node (`98f385cda8abd0e9`) ; `challenge-flow` : le défi gagné et perdu (`7e5600a80a3dda83`, `bb1069b5eb44a634`, les empreintes de la Passe EVL3) et la représaille gagnée et perdue (`c4ab63c95721a5ca`, `d274e9a3eca3c933`), tous les contrôles passent, Node rejoue à la même empreinte.
- `ui-text` : quatre pages des marques, chacune à 1 600 × 900 et 390 × 844, toutes au-dessus du seuil : la liste Q d'un voleur à trois marques (le chiffre « 3/3 marks »), le sergent Hale, ta ligne dans la page du tournoi, Fenwick qui ne traite plus.

### La fusion
- La branche `claude/l2-ville` (Passes EVL2 à EVL4) est fusionnée en avance rapide dans `main` (L2-14 « Fusionner après la fiche, essayer ensuite ») ; `main` est poussé, et la branche supprimée, locale et distante. Ton essai : `npm run dev`, puis `/?play=1&new=1&v2=1`.

### Ce qui revient à L3 (l'information et les réponses au sabotage, EV-10 et EV-11)
- **L'observation étendue** (EV-11 « Observer tout adversaire, rumeurs, activité lisible ») passe par `SCOUTED` (`src/simulation/roles.ts`), que la fiche de match lit déjà (Passe EVL1). Le joueur curieux l'utilise aussi (il observe son prochain adversaire quand il le peut) : il suivra d'elle-même la liste étendue.
- **Les réponses au sabotage** (EV-10 « Une réponse par lieu, un effet lisible ») : aujourd'hui une seule réponse déjoue les deux chaînes de Cassius (la garde payée chaque soir). Le curieux ne paie la garde qu'après un signe, et le laboratoire le mesure déjà.
- Les gens de L2 que L3 peut faire parler : le sergent Hale et son registre (une rumeur), Corra Dunmere et Frère Ambrose (des yeux en ville la nuit), Lady Edda, dont le fils a perdu sur une sangle qui a lâché (un signe, comme l'armure trafiquée).
- **Hors de L3** :
  - l'art des trois génériques (L2-11), une tâche à part ;
  - « Your bouts are fought » au jour 7 pour un finaliste (Passe EVL3), à L5 ou sur décision.

### Pensée
- Une question écrite sur une fiche à la place d'un choix se tranche dans la conversation, avec les options concrètes et ce que chacune retire de choix déjà faits : ici, le vol découvert le lendemain (EV-2) gardé, les points cachés retirés.
- Une règle plus simple change le comportement des politiques du laboratoire autant que celui du joueur : sans l'œil de la garde, un voleur qui rend chez Hale peut recommencer. La politique se règle sur ce qu'elle doit représenter, et la mesure le dit.

