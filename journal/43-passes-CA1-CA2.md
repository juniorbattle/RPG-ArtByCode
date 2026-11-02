# Journal de bord — archive : passes CA1, CA2 (2026-11-01)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-11-01 (Passe CX4) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe CA1 — La fiche de casting : une figure de nos planches pour chaque personnage et chaque rival, l'opérateur à la recommandation sur 34 cartes sur 35 (2026-11-01)

### Demande
- L'opérateur, mot pour mot : « je veuc bien gerer nos autres personnages necessaires pour les integrer aux divers district de la ville car il y a encore des npj generiques, puis integrer aussi les autres combattants en basant sur nos planches generes auparavant pour tout couvrir ». Séance ouverte par une autre séance (`local_94e3af37-…`) ; deux audits tournent à côté, sans branche.
- Aucune image générée, aucune feuille cuite dans cette passe : le casting seul, et l'archivage de deux planches.

### Le relevé — [OK]
- **Provisoires** : treize personnes (`PROVISIONAL`, `src/world/PlazaApp.ts`) ; sur les places elles sont des générés ×1 à côté du cast cuit.
- **Duels** : `buildArenaAtlas` retombe sur `FOES.marek` pour tout rival autre que Marek et Vessa : Orla, Cassius, Ilse, Rhosk et Tobin se battent sous l'art de Marek.
- **Rhosk et Tobin** n'ont aucune place en ville (ni `PEOPLE`, ni `PLAZA_SPOTS`).
- **Les textes** ne donnent le genre que d'Anwen (Sœur) et de Hilde (« She stitches it ») parmi les personnes ; ils ne disent aucune couleur de cheveux ou de tenue : celles de `roster.ts` ne servent qu'aux portraits générés.
- **Texture** : 382 images de production sur 672. Une feuille complète 30, debout 12.
- **Coût** : les feuilles de Ren, 4,63 $ en neuf requêtes (registre : 2,03 + 2,60).
- **§ 14** demande 27 à 34 images par rival d'après leurs compétences : Vessa et Cassius 34, Marek, Ilse et Rhosk 32, Orla 29, Tobin 27. Une page ×3 tient 70 cases : Ren à 39 plus un rival à 32 ou 34 dépasse de 1 à 3 : [?] à régler au lot de Marek.

### La fiche — deux versions
- Page privée https://claude.ai/artifact/NTryUL8JPGubNn2tTW8rkA (source `briefs/fiche-casting.html`). [KO → rebâtie] La version 1 (32 cartes, planches a, b, P, N1, N2, C) n'a pas été remplie. L'opérateur, mot pour mot : « non rebatie la fiche en te basant aussi \sur ces references joints provenant de compte GPT que j'ai genere », avec deux planches : repos, marche et attaques dessinés pour douze figures. Elles ont changé sept figures de rivaux et de personnes sur quinze, et donné une figure à Hilde.
- Version 2 : 35 cartes, collection `decisions` vide à la publication, relue par `list` : 35 documents, cliqués le 01/11 entre 19 h 42 et 19 h 49 UTC, aucune note. Message de l'opérateur, mot pour mot : « Fiche remplie ».

| # | Décision | Choix de l'opérateur |
|---|---|---|
| A1 | Archiver G1, G2 | « Archiver, je cherche les PNG d'origine » |
| A2 | Cedric, Lion | « Figures seulement, noms du jeu gardés » |
| C1 | Casting et G1, G2 comme sources de production | « Oui, comme les planches PNJ » |
| C2 | Portée | « Version 2 seule, quartier inchangé » |
| C3 | Couleurs | « La planche fait foi » |
| T1 | Texture | « Debout, sauf Marek et Orla » |
| R-marek | Marek | « G1 panneau 3 » |
| R-vessa | Vessa | « a n° 11 Duelist » |
| R-orla | Orla | « G1 panneau 5 » |
| R-cassius | Cassius | « G2 n° 06 Rival » |
| R-ilse | Ilse | « G2 n° 03 Prêtresse » |
| R-rhosk | Rhosk | « G1 panneau 6 » |
| R-tobin | Tobin | « G2 n° 01 Cedric » |
| R-ville | Tobin, Rhosk en ville | « Portrait seulement » |
| P-odo | Odo | « G2 n° 04 Organisateur » |
| P-anwen | Anwen | « P n° 11 Prêtresse » |
| P-hilde | Hilde | « G2 n° 05 Marchande itinérante » |
| P-corvin | Corvin | « G2 n° 02 Lion » |
| P-brann | Brann | « P n° 05 Capitaine des Gardes » |
| P-pip | Pip | « b n° 19 Traveling Merchant » |
| P-lio | Lio | « N2 n° 23 Tavern Owner » |
| P-wren | Wren | « P n° 06 Héraut » |
| N0 | Ce qu'on garde | « D'accord » |
| N1 à N5 | Marchand N1 n° 01, voyageuse N1 n° 08, dame noble N1 n° 10, garçon N1 n° 11, fillette N1 n° 12 | « Cuire », chacun |
| N6 | Le reste de la série | « En réserve » |
| N7 | Trois panneaux de G1 sans rôle | **« Leur donner un rôle (en note) », note vide** |
| X1 | Feuilles ×3 | « Les sept rivaux » |
| X2 | Ordre | « Marek, Vessa, Orla, Cassius, Ilse, Rhosk, Tobin » |
| X3 | Poses de charge | « Ren seul, avant Marek » |
| X4 | Armes | « Planche, puis texte pour Vessa, Ilse et Tobin » |
| X5 | Plafond | « Une tâche de 5 $ par combattant » |

- [?] **N7 reste ouverte** : le choix demande une note et la note est vide. La dame noble au bâton, le mage à la lanterne et la version du héros attendent la réponse de l'opérateur ; rien n'est cuit pour eux.
- R-marek vaut la confirmation de planche exigée après la Passe RC3 : Marek = G1 panneau 3, environ 3,4 têtes à la règle. La génération de ses feuilles ×3 reste à lancer depuis le dossier principal : `.env.local` n'existe pas dans ce worktree, et il n'est pas copié.

### Fait — [OK]
- `combat-casting-2026-11-01-g1.webp` et `-g2.webp` archivés à l'octet dans `art-lab/characters/reference/sources/` avec leur fiche (SHA-256 `91dffa0c…`, `aefcba3f…`) ; ce sont des WebP réencodés sans C2PA, les PNG d'origine sont à retrouver par l'opérateur (A1).
- Les six fiches des planches de casting reçoivent un champ `productionUse` daté (C1) ; leurs autres champs ne changent pas.
- `art-lab/characters/reference/README.md` : les deux planches. `npm run art:validate`.

### Restes [?]
- Les citadins et personnes ne marchent que debout, sauf Marek et Orla : le plan monte à 748 images, 666 si les places ne chargent ni Mara ni Bram, sous les 672 garanties, marge 6.
- La tâche se poursuit par lots : feuilles de ville ×2, places et portraits, puis feuilles ×3 dans l'ordre X2. Rien en production sans fiche de lot.

### Pensée
- Une fiche de casting se bâtit sur toutes les références que l'opérateur a, pas sur celles du dépôt : demander avant la première version s'il en existe d'autres. Deux planches jointes après coup ont changé la moitié des figures.
- Un choix qui renvoie à une note se relit avec sa note : une note vide est une question ouverte, pas un choix.

## Passe CA2 — Premier lot du casting : quinze feuilles de ville candidates, sur les places derrière `cast=candidate` (2026-11-01)

### Demande
- Suite de la Passe CA1. Lot 1 : les treize personnes provisoires, plus Tobin et Rhosk pour leur portrait. Aucune image générée, rien en production : tout reste `candidate`, `runtimeUse: "lab"`, jusqu'à la fiche de lot de l'opérateur.

### Fait — [OK]
- `art-lab/characters/rigs/lib/standing.mjs` : la recette commune, une feuille debout de 12 images ; `walk` y ajoute 18 images pour Marek et Orla (T1). Leur profil vient de la rangée de marche dessinée de G1, reconstruite image par image à son propre pas (la rangée de marche est dessinée à 0,78 de la rangée de repos) et ramenée sur la palette des vues ; face et dos par la marche du garde.
- Quinze rigs, quinze paquets (`provenance/<id>/PROVENANCE.json`), quinze manifestes `candidate`. Total : 216 images (13 × 12 + 2 × 30). Le rig d'Orla ne garde que quatre images de marche sur six, jouées dans l'ordre 3, 4, 5, 6, 3, 4 : ses deux premières tiennent une épée qui disparaît ensuite.
- `src/lab/plazaCast.ts`, en DEV seulement : `cast=candidate` sur une place remplace chaque `prov-<personne>` par sa feuille et les portraits par leur visage. `BakedCast.ts` : `still`, une feuille sans marche est acceptée pour celles qui le déclarent ; aucune entrée de production ne l'utilise.

### La séparation du fond — trois essais sur les planches grises
- [KO] `bgThreshold` 90 : a mangé les cheveux gris d'Odo et la cape bleue de Cassius.
- [KO] `--holes` : a percé l'acier et les visages, gris comme le fond.
- [OK] `bgThreshold` 50 sans `--holes`, puis trois nettoyages dans le rig : la plus grande partie connexe, l'ombre au sol, les texels isolés.
- [KO → corrigé] Deux vues entières sortaient en rectangle sombre : le coin de leur cadre tombait sur un libellé (Vessa) ou sur un filet de planche (Pip), et ce coin sert de couleur de fond.
- [KO → corrigé] Le centrage sur les pieds sortait un personnage du cadre quand une cape ou un sac dépassait d'un côté : la figure reste dans le cadre, ses pieds un peu hors de l'axe.

### La critique à l'aveugle
- Un agent neuf, feuilles et places en images, sans connaître les attentes : taille et palette tiennent à côté du cast, **pas la propreté**. Lio 8 ; Anwen et Cassius 6,5 ; Odo et Rhosk 6 ; Brann et Ilse 5,5 ; Hilde et Pip 5 ; Corvin et Tobin 4. Il a aussi vu des contours clairs en scène et Pip délavé sur la place au soleil.
- Corrigé après son verdict : texels isolés et brins d'un texel retirés, ombres au sol, restes des vues voisines.
- **Seconde critique**, agent neuf, rendu refait : Odo, Corvin, Lio et Rhosk 8 ; Anwen, Brann et Marek 7 ; Hilde, Wren, Vessa, Ilse, Cassius et Orla 6 ; Pip et Tobin 5. « L'ensemble tient à côté des personnages existants », avec une réserve sur les cas faibles et un tampon gris sous Hilde et Orla. Corvin passe de 4 à 8, Tobin de 4 à 5, Pip reste à 5. Marek ressemble à Odo (gris, bleu et or) ; Orla est très saturée sur les places.
- [KO → corrigé] Le tampon gris était le fond même de la planche, enfermé entre les jambes : retiré par sa couleur pour Hilde et Orla seulement, leurs jambes n'ayant pas d'acier du même gris. Cette dernière retouche n'a pas repassé de critique.

### Les preuves
- `npm run typecheck`, `npm test` **305 / 305** (6 de plus, `tests/plaza-cast.test.mjs`), `npm run build`, `npm run art:validate` (34 manifestes, 42 sources, 0 erreur).
- **0 px** au seuil 0 contre `main` figé (`be8b340`) sur sept vues : ville de nuit et à midi, trois places sans le paramètre, arène par défaut et `v2=1`. Contrôle négatif : `cast=candidate` sur le parvis change 45 921 px.
- Paquet de production : aucune feuille candidate, aucun code de `plazaCast`.
- `build-character.mjs --check` : les quinze feuilles reconstruites à l'identique.

### Restes [?]
- La fiche de lot de l'opérateur, page privée https://claude.ai/artifact/6X4cYQuL3BZdZbq2YKGcqY (source `briefs/fiche-casting-lot1.html`, 17 cartes, N7 reposée, `decisions` vide à la publication), puis l'entrée en production derrière `flags.v2`. Sur une place, `cast=candidate` n'a pas besoin de retirer Mara ni Bram pour ces quinze feuilles (598 images) ; il le faudra avec les cinq citadins.
- Vessa et Pip sont petits sur leur planche (125 et 119 px) : leur détail reste en dessous des autres.
- N7 et les PNG d'origine de G1 et G2 attendent toujours l'opérateur.
- Les citadins (lot 2), puis Ren et les feuilles ×3 dans l'ordre X2.

### Pensée
- Sur un fond gris, une option qui remplit « ce qui ressemble au fond » retire aussi l'acier, le gris des cheveux et les ombres d'une cape : le seuil se règle sur le personnage le plus proche du fond, et le reste se nettoie depuis le bord seulement.
- Le coin d'un recadrage décide de la couleur de fond : il se regarde comme un pixel de la figure.

