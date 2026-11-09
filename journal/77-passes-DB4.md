# Journal de bord — archive : passe DB4 (2026-11-09)

> Déplacée mot pour mot de `JOURNAL.md` le 2026-11-09 (Passe DB7) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe DB4 — Le poids de l'attaque simple en part des PV : mesuré, une fiche d'arbitrages publiée ; rien d'appliqué (2026-11-09)

### Demande
- Transmise par la séance mère (`local_94e3af37-…`) après DB3. L'opérateur, mot pour mot (2026-11-09) : « je trouve qu'une attaque basique qui fait 10pv de degats sur un adversaire possedant 6000pv c"est tres destructurer , peut etre qu'il faudrait baisser les pv a 600pv au lieu 6000pv bref il faut optimiser cette partie apres avoir finies nos autre sous=sessions » ; puis, à la proposition de diviser PV et dégâts par 10 ensemble (une attaque simple à environ 1 PV sur 600, l'équilibre inchangé) : « non le truc c'est que je veux pas que ca fasse 1 pv sur 600 l'ecart etre trop enorme une attaque simple devrait infligeait 5 a 10% des pv max de l'ennemie ».
- Mesurer des paquets (l'attaque simple à 5, 7,5 et 10 % des PV, de petits PV ronds), publier une fiche, demander si DB-1 « 3 à 4 minutes » (décision A3) tient encore ; créer la branche seulement après la fusion de `claude/reglages-4` (fusionnée dans `main` `cc7127c`, branche `claude/duel-echelle` tirée de là).

### L'outil — [OK] `tools/duel-balance.mjs`, cinq variantes de plus
- `scale<N>` (un changement d'échelle pur : Marek à N PV, tous les PV et tous les coups au même facteur, un coup au moins 1) ; `lightpct<p>` (l'attaque simple à p % des PV de cet adversaire) ; `skl<k>` (les compétences offensives à k attaques simples pour 3,4 s de charge, au prorata de leur temps de charge) ; `rip<n>` (la riposte des données du jeu au n-ième coup, 0 = aucune) ; `gauge<N>` (la jauge de taille N, sa décroissance au prorata) ; `combo<k>` (des séquences adverses jusqu'à k coups).

### Mesures — [OK] les deux demandes ne tiennent pas ensemble
- **L'arithmétique** : avec le rythme du duel (une pause adverse de 3,5 à 12 s, la riposte au 3e coup, les compétences chargées pendant les séquences adverses, V2-2), le joueur place environ trois coups simples par pause ; 3 à 4 minutes font 20 à 25 pauses ; à 5 % par coup, les seuls coups simples feraient 300 % des PV. Avec le rythme d'aujourd'hui, un coup lourd veut un duel court.
- **Sans recalage** (le paquet de DB3, l'échelle 600, les compétences à 3 coups pour 3,4 s) : à 5 / 7,5 / 10 % par coup et riposte au 3e coup, le duel dure 0,5 / 0,4 / 0,3 min, le bot gagne 100 %, le marteleur aussi, aucune rupture. **[KO]** le rythme d'échange (riposte au 1er coup, pauses ×0,3, séquences adverses plus longues) : 0,3 à 0,9 min et le joueur écrasé (0 à 20 % au bot 0,9) : il ne rallonge pas assez le duel.
- **Recalé à six sur dix** (les coups des rivaux montés jusqu'à rendre au bot 0,5 environ 60 %, 20 graines par rival ; l'échelle Marek 600, Ren 143) :

| Attaque simple | Coups pour un K.O. | Durée (bot 0,5) | Victoires 0,2 · 0,5 · 0,9 | Marteleur | Estocade | Coup puissant de Marek | Dégâts pendant une rupture |
|---|---|---|---|---|---|---|---|
| 0,09 % (DB3) | 1 152 | 3,8 min | 11 · 64 · 100 % | 0 % | 5,8 % | 7,8 % de Ren | 22 % |
| 1 % | 100 | 2,0 min | 8 · 59 · 98 % | 0 % | 5,8 % | 15 % | 24 % |
| 2 % (compétences ×3 coups) | 50 | 1,0 min | 12 · 57 · 94 % | 1 % | 13,5 % | 31 % | 20 % |
| 3 % (jauge de 60) | 34 | 36 s | 14 · 58 · 88 % | 1 % | 17 % | 54 % | 32 % |
| 5 % | 20 | 30 s | 16 · 52 · 92 % | 21 % | 22,5 % | 54 % | 0 % (jamais atteinte) |
| 5 % (jauge de 40) | 20 | 18 s | 19 · 51 · 77 % | 1 % | 22,5 % | 115 % (un coup tue) | 31 % |
| 10 % (jauge de 25) | 10 | 12 s | 46 · 72 · 83 % | 21 % | 34 % | 154 % (un coup tue) | 45 % |

- À 10 %, aucun recalage ne rend six sur dix (coups des rivaux ×20 à ×30 : 71 à 79 %) : le joueur gagne avant que l'adversaire ait frappé deux fois. Une jauge plus courte rend la rupture aux duels courts, mais il faut alors des rivaux qui tuent d'un coup.
- Le poids des compétences à 2 % (avant recalage) : 2 coups pour 3,4 s → 36 %, 1,1 min, 39 % des dégâts ; 3 coups → 57 %, 1,0 min, 49 % ; 4 coups → 70 %, 0,9 min, 57 %.
- Les mesures prennent l'attaque simple au même pourcentage contre chaque rival ; avec une attaque simple fixe, les écarts de PV d'aujourd'hui (à l'échelle 600 : Vessa 293, Orla 590, Marek 600, Rhosk 717) lui donneraient 4 % contre Vessa et 1,7 % contre Rhosk.

### La fiche — publiée, rien de décidé
- https://claude.ai/artifact/2PFNieC27mG8mFC5G61W1C (`briefs/fiche-db4.html`, le modèle de `briefs/fiche-db2.html`), collection `decisions` relue vide à la publication ; vérifiée dans Chrome (6 cartes, 17 options, aucune erreur, aucun débordement à 375 px). Six cartes :
  - **DB4-1** (A3 sur DB-1) l'attaque simple en part des PV, donc la durée : recommandé « 2 % · un duel d’une minute », dit sous son seuil de 5 % avec la raison (à 5 % le duel tombe à 30 s, la rupture disparaît, le martelage revient) ; les autres : 1 % (2 min), 3 % (36 s), 5 % (30 s), et « Garder DB3 : 3 à 4 minutes » ;
  - **DB4-2** les compétences en attaques simples (« 3 attaques pour 3,4 s ») ; **DB4-3** l'échelle (« Marek 600, Ren 150 ») ; **DB4-4** les écarts de PV entre rivaux (« Resserrer : chaque rival entre 500 et 700 ») ; **DB4-5** le recalage (« Recaler pour garder six sur dix ») ; **DB4-6** quand (« Dès que les réglages sont fusionnés »).

### Validation
- Rien du jeu ne change sur cette branche (l'outil, la fiche, le journal). `npm run typecheck` ; `npm test` : voir le commit.
- Les passes gardées dépassaient 60 Ko (62,3 Ko) : TU1 et TU2 (branche fusionnée) déplacées à l'octet dans `journal/74-passes-TU1-TU2.md`, la ligne ajoutée à l'index ; preuve par script : le corps de l'archive égale les 10 830 octets retirés, le journal reconstruit égale l'original, CRLF partout, chaque passe TU1 / TU2 dans un seul fichier. 51,8 Ko de passes restent.

### Où reprendre
- Attendre que l'opérateur dise la fiche remplie ; relire `decisions` ; consigner mot pour mot et daté (DB4-1 est une décision A3 s'il remplace « 3 à 4 minutes ») ; amender `briefs/combat-system.md` (§ 2, § 18) ; appliquer (`v2duel.ts` : l'échelle, l'attaque simple, les compétences, les PV des rivaux resserrés, la jauge si un paquet court la demande ; `profiles.ts`) ; recaler sur des parties entières et remesurer `V2_RACERS` ; revoir les états nommés et le tutoriel du premier duel (ses textes lisent les nombres du duel, Passe TU4) ; prouver ; fusionner.

### Pensée
- Un « coup qui compte » se règle avec la durée du duel : le nombre de coups pour un K.O. fois le temps entre deux coups. Avec trois coups par pause, la durée et le poids d'un coup ne sont pas deux réglages indépendants.
- Recaler à six sur dix un duel très court rend les deux camps mortels : la symétrie se paie dans les coups adverses, pas seulement dans ceux du joueur.

