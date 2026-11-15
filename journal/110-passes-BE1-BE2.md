# Journal de bord — archive : passes BE1, BE2 (2026-11-13)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-11-15 (Passe CI2) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe BE1 — La passe d'équilibre du combat « La Brute » (BL1-5) et la question de l'opérateur sur les dégâts des compétences : la puissance des coups mesurée, l'écart de la poule corrigé (l'attaque simple ×1,75, le coup puissant ×1,5, les compétences ×0,55, les santés ×1,15), les protections deux fois plus courtes, la lame et le sabre, la faille d'un ouvreur à 4 s, la course recalée ; la fiche courte relue six sur six à la recommandation ; fusionné (2026-11-13)

### Demande
- La séance du lot 1 (Passe BL1), sur le choix BL1-5 « Une passe à part, avant le lot 2 », élargie à la question de l'opérateur, mot pour mot (13/11/2026) : « par contre comment cela se fait t-il que des competences peuvent infliger 300-400 degats quand les attaques simple et fortes font a peine 10-20 degats ? je pense que c'est cela qui fait que les match ne dure que 1min27 ... je pense qu'il faut corriger cela ». Sur la suite : « sinon oui on pourra passer a cette suite » (cette passe, puis le lot 2, puis le lot 3).
- À faire : répondre avec des mesures ; corriger l'écart d'abord au laboratoire du jeu ; remesurer les protections au niveau 3, le sabre et la paire Fracas et Estoc ; une fiche courte pour ce qui change une décision de l'opérateur ; construire, tester, prouver, fusionner.
- Branche `claude/combat-brute-equilibre` (le worktree `priceless-tharp-71c68f`, tirée de `main` `6f47472`), seule ouverte. Serveur `be1-dev` (port 5471), son entrée de `.claude/launch.json` retirée à la fin.

### La réponse à la question — [OK] mesurée (le jeu de BL1 ; les combats du planificateur, 200 parties tenues à part, graines 101 à 300)
- **D'où vient la puissance d'un coup.**
  - `POWER` (fiche DB5) : l'attaque simple 6, soit 1 % d'une barre de 600 (DB5-5) ; l'Estoc 120, soit 20 % (DB5-1) ; les autres compétences au prorata de leur temps de charge.
  - Toutes les puissances ×3,2 (`AUTO_CADENCE.power`, le rythme ×3 de RY-1) ; les compétences ×1,2 de plus (`AUTO_BRUTE.usePower`, le modèle) ; l'Estoc ×0,8 (`powerK`, Passe SL1).
  - À stats égales, l'attaque simple fait 19,2 en tout, partagés entre les coups de l'arme : 16,3 par coup avec l'épée, 13,4 avec la lame, 3,3 avec le sabre. Le coup puissant fait 85, l'Estoc 369, la Taille éclair 205 en deux coups.
  - Puis les rôles : l'exploitation ×2 dans une faille, une rupture ou sur un adversaire qui charge (×0,6 sinon), la faille ×1,25, la rupture ×1,4. L'Estoc fait ainsi 921 dans une faille, 1 032 dans une rupture, 1 290 dans les deux.
- **La part de chaque source** (dégâts de Ren, en poule / au tableau / en finale) :
  - les compétences 80 / 70 / 69 % (l'Estoc seul 55 / 52 / 41 %), les attaques simples 14 / 23 / 23 %, le coup puissant 6 / 7 / 8 % ;
  - 53 / 43 / 34 % des dégâts de Ren tombent pendant une rupture du rival ;
  - chez les rivaux (simple, puissant, compétences) : 21-24-54, 23-22-55, 25-34-41.
- **Un coup** (médiane en poule) : l'Estoc 1 119 (p10 à p90 : 136 à 1 317), la Taille éclair 151 par coup, le coup puissant 114, l'attaque simple 14 par coup ; chez les rivaux, l'attaque simple 3 par coup, le coup puissant 44.
- **Ce qui fait la durée de la poule** : la barre médiane d'un rival de poule vaut 2 353 ; les deux usages de l'Estoc au niveau 1, placés dans une rupture ou une faille, en font 95 %. La poule dure le temps de les placer : 1 min 27 pour la référence, contre « la poule environ 2min » de SL1-2 (A3). L'intuition de l'opérateur est juste.

### La correction au laboratoire — [OK]
- La chaîne d'une option (outils de la séance hors du dépôt, sur `tools/auto-lab.mjs` en bibliothèque) : les réglages par `--set`, la course recalée comme PB-3 le demande (`fitRace` : chaque rival de poule à 95 % contre le Ren du jour 2 du planificateur, la pente de SL1-1, le tableau et la finale à 50 % sur 200 parties de calage, graines 1 à 100 et 301 à 400), puis jugée sur 200 parties tenues à part (graines 101 à 300) : la part de chaque source, un coup de chaque sorte, les durées, les titres, le rythme, les ruptures, l'entrechoc. Huit options à la fois sur 16 cœurs, 4 à 6 min chacune.
- Deux commandes nouvelles de `tools/auto-lab.mjs` gardent ces mesures : `damage` (la part de chaque source et de chaque action, un coup de chaque sorte, la part dans la rupture, les durées, les coups par minute, les ruptures, l'entrechoc, par étape) et `price` (le prix d'une compétence : les combats du planificateur rejoués avec une compétence échangée).
- Les options (la référence en poule / au tableau / en finale ; les dégâts de Ren, simple-puissant-compétences, en poule ; le planificateur en demi-finale et en finale ; course recalée) :

| Option | Durées | Dégâts de Ren (poule) | Demi / finale | Titres (réf. / plan.) |
|---|---|---|---|---|
| le jeu de BL1 | 87 / 170 / 187 s | 14-6-80 | 53 / 45 % | 35 / 24 % |
| la santé seule ×1,15 | 139 / 199 / 223 s | 19-8-74 | 51 / 54 % | 38 / 27 % |
| la santé seule ×1,38 | 180 / 232 / 285 s | 21-9-70 | 52 / 45 % | 28 / 23 % |
| simple ×2, compétences ×0,5 | 137 / 183 / 207 s | 43-10-47 | 52 / 45 % | 38 / 23 % |
| simple ×2, puissant ×1,25, compétences ×0,5 | 129 / 168 / 201 s | 42-11-47 | 49 / 44 % | 34 / 21 % |
| simple ×1,75, puissant ×1,25, compétences ×0,55 | 132 / 177 / 202 s | 37-11-52 | 49 / 45 % | 33 / 22 % |
| avec les protections, les armes, santés ×1,15 (G1 : ×2, ×1,25, ×0,5) | 126 / 186 / 208 s | 44-10-46 (tableau 55-11-34) | 49 / 51 % | 43 / 25 % |
| (G2 : ×1,75, ×1,5, ×0,55) | 123 / 181 / 206 s | 38-12-50 | 53 / 49 % | 33 / 25 % |
| **G2b : G2 et la faille d'un ouvreur 4 s, l'Estoc ×0,36 de charge** | **118 / 178 / 199 s** | **38-12-50** | **54 / 50 %** | **41 / 27 %** |

- **[KO → compris]** La santé seule tient les durées à ×1,15 mais garde la disproportion : les compétences font 74 % des dégâts de Ren et l'Estoc 1 033 en médiane. À ×1,38, la poule passe à 3 min et la finale à 4 min 45 : la course recalée rend les rivaux de poule plus forts quand les combats s'allongent.
- **[KO → compris]** Un exploit plus faible (×1,5 au lieu de ×2, l'Estoc ×0,6) fait tomber le planificateur à 16 % de titres et 34 % en finale : la faille perd son sens. Gardé à ×2.
- **[KO → compris]** Le coup puissant ×2 porte celui des rivaux (Tobin et Orla le lancent dès qu'il est prêt) à 38 à 61 % de leurs dégâts, avant recalage. Retenu ×1,5 (29 à 40 % après).
- **Retenu (G2b)** : l'attaque simple ×1,75, le coup puissant ×1,5, les compétences ×0,55 (`AUTO_WEIGHT` ; `AUTO_LIGHT.power` 10,5, `AUTO_SKILLS.heavy.powerK` 1,5, `AUTO_BRUTE.usePower` 0,66 au lieu de 1,2), les santés ×3,6 au lieu de ×3,132, les protections, les armes et la faille des points suivants. À stats égales : l'attaque simple 33,6 en tout (28,6 par coup avec l'épée), le coup puissant 128, l'Estoc 203 (507 dans une faille, 568 dans une rupture, 710 dans les deux). Un Estoc dans une faille valait une quarantaine d'attaques simples ; il en vaut une dizaine.
- La course recalée (PB-3, `fitRace`, les mêmes graines de calage) : Vessa 1,094, Tobin 1,416, Cassius 1,245, Orla 0,952, Ilse 0,937, Marek 0,92, Rhosk 1,235 ; poule +7,5 % par tour ; tableau ×1,242, finale ×1,568.

### Les autres points de BL1-5 — remesurés après la correction des dégâts
- **Les protections au niveau 3 — [OK] réglées.** Avec des coups rééquilibrés seuls (attaque simple ×2, compétences ×0,5), elles pesaient plus lourd encore : la Peau de fer au niveau 3, à la place du Rempart, faisait passer le planificateur de 65 à 97 % au tableau et de 44 à 93 % en finale (`price`). La cause : réparties sur beaucoup de coups simples, les dégâts sont tous réduits par une protection qui dure 33,6 s (Peau de fer) ou 27 s (Rempart) au niveau 1, deux à quatre fois par combat. Trois réglages mesurés : les durées deux fois plus courtes ; la réduction plus faible (−40 et −50 %) à durée gardée (Peau de fer niveau 3 : +33 et +44 points avant recalage) ; les deux à moitié. **Retenu : deux fois plus courtes** (Rempart 4,5 × 3 = 13,5 s, Peau de fer 16,8 s au niveau 1). Dans G2b, la course recalée : la Peau de fer au niveau 3 +16 points au tableau et +20 en finale, le Rempart au niveau 3 +11 et +6, l'Estoc au niveau 3 +14 et +17, Fracas au niveau 3 +11 et +4, la Feinte au niveau 1 (pour le Rempart) +12 et +7 ; au niveau 1, la Peau de fer vaut le Rempart (65 contre 67 % au tableau).
- **Le sabre — [OK] réglé, avec la lame.** L'attaque simple pèse la moitié des dégâts de Ren : la lame importée (0,7 + 0,7, son attaque simple 10 % plus lente) passait sous l'épée d'entraînement, et le sabre (0,17 × 3) gagnait 10 % des combats au test de AC-12. Mesuré au test (`kits --norm=rival`, tableau / finale) : la lame 0,9 et le sabre 0,3 → épée 38 / 29, sabre 15 / 14 ; la lame 0,85 et le sabre 0,4 → 50 / 33 et 45 / 35 ; le sabre 0,55 → 80 / 65 (il domine) ; le sabre 0,65 → 91 / 82. **Retenu : la lame 0,8 + 0,8, le sabre 0,47 × 3.** Dans G2b (poule / tableau / finale) : l'épée 79 / 50 / 38, la lame 86 / 66 / 51, le sabre 89 / 67 / 53.
- **La paire Fracas et Estoc — [?] améliorée, pas tenue partout.** Avec les coups de G2, le tableau est réglé (bonnes réponses : Orla 2, Ilse 3, Marek 2), pas la finale (une seule contre les trois : Fracas). Leviers mesurés sur la finale seule : l'exploit ×1,75 et Fracas ×0,4 n'y changent rien ; la faille d'un ouvreur 4 s seule fait tomber Fracas sous le kit de départ ; **la faille 4 s avec l'Estoc chargé ×0,36 au lieu de ×0,4** (pour qu'il tienne encore dans la faille), la course recalée (G2b) : en finale, Orla 2 bonnes réponses, Ilse 3, Vessa et Tobin 4, Marek 1 (Fracas), Cassius et Rhosk 1 (la Feinte) ; au tableau, Orla 2, Ilse 2, Marek 3, Vessa 2, Tobin, Cassius et Rhosk 1 (la Feinte) ; en poule, le test tenu. Le test de AC-12 n'est tenu partout dans aucune variante mesurée.

### La fiche
- https://claude.ai/artifact/EhdmkkCiFyxL3C4X9Q1EyD (`briefs/fiche-combat-brute-equilibre.html`), publiée avec six cartes : BE-1 la réponse (« Reçu ») ; BE-2 le poids des coups (change DB5-1 et DB5-5) ; BE-3 les protections ; BE-4 la lame et le sabre ; BE-5 la faille d'un ouvreur 4 s ; BE-6 la suite. Aucune ne touche une décision A3 : SL1-2, RY-1, RY-3 et PB-3 restent tenus. Publiée avec `{db:{}}`, `decisions` vide ; vérifiée dans le navigateur de l'application (six cartes, quinze options, aucune erreur de console).

### La fiche relue — six sur six à la recommandation (13/11/2026)
- L'opérateur, dans cette séance, mot pour mot : « fiche remplie ». `ArtifactData list decisions` : six lignes, BE-1 à BE-6, écrites de 01 h 49 à 01 h 51 (UTC, le 14/11), sans note.
- Ses choix, mot pour mot :
  - BE-1 « Reçu » ;
  - BE-2 « Simple ×1,75, puissant ×1,5, compétences ×0,55 (change DB5-1 et DB5-5) » : dans ce duel, l'attaque simple ne vaut plus 1 % d'une barre de 600 (DB5-5 « 1 % ») mais 1,75 %, et l'Estoc 11 % au lieu de 24 % (DB5-1 « 20 % (28 % au niveau 5) », ×1,2 par le modèle) ; DB5-1 et DB5-5 sont des choix de l'opérateur du 09/11 (Passe DB6), non A3 ;
  - BE-3 « Deux fois plus courtes » ;
  - BE-4 « La lame 0,8, le sabre 0,47 » ;
  - BE-5 « La faille 4 s, l’Estoc un peu plus vif » ;
  - BE-6 « Fusionner, puis le lot 2 ».
- Aucune décision A3 n'est changée : SL1-2, RY-1, RY-3 et PB-3 restent tenus. Les réglages recommandés étaient déjà construits sur la branche : rien n'a changé après la relecture.

### Les mesures après — 200 parties tenues à part (graines 101 à 300)

| Politique | Titres | j2 / j4 / j5 | Demi | Finale | Durées poule / tableau / finale |
|---|---|---|---|---|---|
| la référence | 41 % | 98 / 97 / 82 | 79 % | 53 % (154) | 118 / 178 / 199 s |
| le planificateur | 27 % | 98 / 97 / 84 | 54 % | 50 % (105) | 118 / 167 / 202 s |
| le curieux | 12 % | 99 / 93 / 78 | 79 % | 16 % (142) | 146 / 227 / 299 s |
| le diligent | 0 % | 100 / 75 / 17 | 12 % | 0 % (19) | 130 / 162 / 160 s |
| l'oisif | 0 % | 85 / 31 / 2 | 0 % | — (0) | 120 / 118 s |

- Les dégâts du planificateur (`damage`, poule / tableau / finale) : Ren simple 38 / 47 / 47 %, puissant 12 / 14 / 16 %, compétences 50 / 39 / 36 % (l'Estoc 36 / 28 / 22 %) ; 41 / 32 / 26 % pendant une rupture du rival. Les rivaux : simple 41 / 40 / 42 %, puissant 40 / 38 / 29 %, compétences 19 / 22 / 29 %.
- Un coup (médiane en poule) : l'Estoc 575, la Taille éclair 87 par coup, le coup puissant 195, l'attaque simple 29 par coup ; les rivaux 8 et 122.
- Le rythme : 39 à 43 coups par minute (RY-1) ; 2,8 à 3,1 ruptures par combat (les deux combattants ; 1,8 à 2,4 avant) ; 0,8 à 1 entrechoc par minute.
- Le troisième tour de la poule (le jour 5) passe de 100 à 82 % pour la référence : la pente de SL1-1 (A3) mord enfin sur le dernier tour (CF1 le trouvait trop facile).
- Les blessures d'une partie (graines 1 à 50) : le diligent 1,44 (0,96 avant), l'oisif 1,34 (1,18), la référence 0,38 (0,30) : un coup puissant plus lourd fait tomber plus souvent.
- Le curieux : 12 % de titres (1 % avant), ses compétences au niveau 1 comptent moins ; ses finales durent 5 min (299 s en médiane, 246 avant : son build faible, Attaque 10). BL1-4 reste au lot 3.

### Construit
- `src/combat/autoData.ts` : `AUTO_WEIGHT` (simple ×1,75, puissant ×1,5, compétences ×0,55 ; les mots de l'opérateur en tête) ; `AUTO_LIGHT.power` 6 × 1,75 ; `AUTO_SKILLS.heavy.powerK` 1,5 ; `AUTO_BRUTE.usePower` 0,66 (écrit en clair : 1,2 × 0,55 vaut 0,6600000000000001) ; `roleCharge.exploit` 0,6 ; le Rempart 4,5, la Peau de fer 5,6 ; la lame 0,8, le sabre 0,47 ; `AUTO_RACE` recalée. `POWER` (fiche DB5) reste tel quel : l'ancien duel derrière `?duel=charge` le lit encore.
- `src/combat/auto.ts` : `hpScale` 3,6 ; la faille d'un ouvreur 4 s.
- `src/simulation/named.ts` : Rhosk sur le sable (`v2-sand-day9`, `v2-sand-training`) sur la graine 6 : avec la graine 18, Rhosk n'est plus hors du titre.
- `tools/auto-final/variants.mjs` : le jeu de règles `BE1` (BL1, la faille 4 s, l'Estoc ×0,36, les santés ×3,6) ; `tests/combat-auto.test.mjs` tient le portage contre la copie sous `BE1`. Les poids des coups, les protections et les armes sont dans les tables du jeu, que ses combattants portent jusqu'à la copie.
- `tools/auto-lab.mjs` : `damage` et `price` ; `tools/play-flow.mjs` : la défaite avec la graine 7.

### Validation
- `npm run typecheck` sans erreur ; `npm test` **665 / 665** : `combat-auto` (les tables contre les décisions : `AUTO_WEIGHT`, la puissance du coup puissant, les protections, les armes, la faille 4 s, l'Estoc ×0,36, les santés ×3,6 ; le portage sous `BE1`), `auto-arena` (un autre ordre, un autre duel : 19 parties neuves sur 60 au lieu d'une sur deux ; le test sur 40 parties), `v2-coherence` (la tentative de sabotage du diligent sur la graine 39), `v2-injury` (les blessures et les victoires remesurées), `v2-rivals` (la graine 6 de Rhosk ; le signe du curieux sur les graines 4, 6 et 13) ; `npm run build` ; `npm run art:validate` (73 manifestes, 123 sources, 23 du son, 0 erreur).
- Navigateur (serveur de la branche, port 5471), tous verts : `tools/auto-arena-proof.mjs` ; `tools/gauge-proof.mjs` (737 coups, 677 sur leur image) ; `tools/tutorial-proof.mjs` en anglais et en français ; `tools/play-flow.mjs` gagné (graine 5) et perdu (graine 7 : la graine 4 gagne désormais) ; `tools/challenge-flow.mjs` défi perdu contre Orla (graine 4) et gagné contre Aldric (1842), représailles gagnées (1842) et perdues (graine 2 : la graine 3 gagne désormais) ; `tools/rivals-flow.mjs sand` ; `tools/audio/hooks-proof.mjs`.
- Archivage : avec BE1, les passes gardées passaient 60 Ko ; CF1 et CF2 (branches fusionnées) déplacées d'un bloc, à l'octet, dans `journal/108-passes-CF1-CF2.md`, leur ligne ajoutée à l'index, les deux phrases d'en-tête complétées ; preuve par script : le corps de l'archive égale les octets retirés, CF1 et CF2 dans un seul fichier, CRLF partout.

### Pensée
- Une durée trop courte se lit d'abord dans la part de chaque source : quand deux coups font 95 % d'une barre, la santé n'allonge le combat qu'en gardant la disproportion. Rééquilibrer la puissance des coups a tenu les trois durées de SL1-2 sans toucher la santé.
- Une protection réduit tous les coups pendant sa durée : quand les dégâts passent des compétences aux coups simples, elle pèse plus lourd. Un réglage de puissance se remesure avec ce qui réduit les dégâts (protections, garde).
- Une arme se lit par son enchaînement dès que l'attaque simple pèse : son malus d'avant (une charge 10 % plus lente) peut la faire passer sous l'arme de départ.
- Une course recalée change le scénario des états nommés qui comptent sur une partie hors écran (Rhosk hors du titre) : chaque recalage se suit d'une recherche de graine, mesurée en Node avant les preuves.
- Un « une partie sur deux » mesuré sur douze graines peut tomber à une sur douze : une proportion se teste sur assez de parties pour sa variance (19 sur 60).

## Passe BE2 — Le poids du coup puissant : la question de l'opérateur après la passe d'équilibre, mesurée (×1,5, ×1,25, ×1) ; sa réponse « Garder ×1,5 » ; rien du jeu ne change, le lot 2 l'explique à l'écran (2026-11-13)

### Demande
- Après la fusion de la Passe BE1 (`17fbf40`), dans la séance de la passe, sur son tableau « Un coup en poule » (575 / 29 / 195), l'opérateur, mot pour mot : « ca reste enorme le coup puissant est environ x5.5 fois plus puissant que le coup simple??? » ; puis sur la part des dégâts de Ren (38 / 12 / 50 %) : « les degats simple sont plus impact que les degats puissant ? ».
- La séance de la passe a mesuré et répondu sans rien changer ; elle a été archivée avec celle du lot 1, à la demande de l'opérateur (« les sous sessions sont terminés. recupere le rapport et archive les avant de passer à la suite »), leurs worktrees propres et leurs branches sans commit hors de `main`. La question a été reposée dans la séance de l'atelier (CF1 à CF3), qui consigne la réponse ici. Branche `claude/combat-brute-be2` (worktree `eager-jepsen-3b00bf`, tirée de `main` `17fbf40`), seule ouverte. Aucun serveur.

### La mesure — [OK] (les combats du planificateur en poule, 200 parties tenues à part, graines 101 à 300)
- Le « 29 » est un seul coup de l'attaque simple ; avec l'épée ou la lame elle frappe deux fois : 52 en médiane pour une attaque entière.
- 74 % des coups puissants de Ren tombent dans une rupture du rival (×1,4), aucun n'est gardé ; les coups simples sont gardés 16 % du temps.
- À stats égales, hors rupture : l'attaque simple 57 (2 × 28,6), le coup puissant 128 : **×2,2**, et non ×5,5.
- Au total, les attaques simples pèsent plus : 18,9 par combat de poule (35 coups, 904 dégâts) contre 1,6 coup puissant (296), qui attend 15,3 s après chaque coup (DB5-3, A3).
- Trois poids, la course recalée chaque fois : ×1,5 (195 en poule ; la référence 1 min 58 / 2 min 58 / 3 min 19 ; le planificateur 54 / 50 %) ; ×1,25 (162 ; 2 min 12 / 3 min 07 / 3 min 35 ; 54 / 52 %) ; ×1 (129 ; 2 min 25 / 3 min 25 / 3 min 45 ; 49 / 43 %). Même à ×1, l'écart affiché reste de 4,4 : il vient du compte par coup et de la rupture.

### La réponse — [OK] consignée
- À la question « Garder le coup puissant à ×1,5 et l'expliquer à l'écran au lot 2 ? », l'opérateur, mot pour mot, le 13/11/2026 : « Garder ×1,5 ». Pas une décision A3 (BE-2 n'en était pas une).
- Rien du jeu ne change. Le lot 2 montre dans l'arène le total d'une attaque simple (52, et non 29 puis 23), dit quand un coup puissant tombe dans une rupture, et la fiche de match dit ce qu'un coup prend de la barre de chacun (BL1-10). Consigné : `briefs/combat-auto.md` § 35.6 (et § 35.4), `AGENTS.md`.

### Validation
- Rien sous `src/` ni `tests/` : `npm run typecheck` sans erreur, `npm test` **665 / 665**, `npm run build` vert, `npm run art:validate` 73 manifestes, 123 sources archivées, 23 manifestes du son, 0 erreur. Aucune preuve dans le navigateur : rien de ce qu'elles couvrent ne change.

### Pensée
- Un écart que le joueur lit à l'écran se mesure dans l'unité qu'il voit (un coup) et dans celle de la règle (une attaque entière, à stats égales, hors rupture) avant de toucher au poids : ici l'écart venait de l'affichage, et c'est l'affichage qui se corrige.

