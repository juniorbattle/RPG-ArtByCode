# Journal de bord — archive : passes CA3, CA4, CA5, CA6, CA7 (2026-11-01)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-11-02 (Passe UM8) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe CA3 — Lot 1 relu : les têtes agrandies, les emblèmes retirés, huit feuilles en production sur la version 2 (2026-11-01)

### Les décisions de l'opérateur, mot pour mot
- Fiche du lot 1 (https://claude.ai/artifact/6X4cYQuL3BZdZbq2YKGcqY, 17 documents relus) : **« Production »** pour Anwen, Cassius, Hilde, Ilse, Lio, Orla, Rhosk et Vessa ; **« À reprendre (en note) »** pour Brann, Corvin, Marek, Odo et Wren, chacun avec la note « enleve les signes/emblemes » ; pour Pip et Tobin, « À reprendre (en note) » sans note.
- S1, la portée : « À revoir (en note) », note : « on remarque des differneces de proportions sur les personnages... ». Cette note touchant les huit feuilles approuvées, elle a suspendu la production, et trois questions lui ont été posées, réponses aux libellés : « Agrandir les têtes (Recommandé) », « Toutes après correction (Recommandé) », « Fleurs de lys et emblèmes (Recommandé) ».
- [?] N7 est revenue « Rôles en note », note encore vide. La page n'enregistre une note qu'en quittant le champ : elle a pu se perdre. Les trois panneaux restent en réserve, rien n'est cuit pour eux.

### Les proportions — [OK] mesurées, puis corrigées
- La remarque de l'opérateur se mesure : largeur de tête de 29 à 36 texels pour le cast, 23 à 28 pour Marek, Rhosk, Odo, Corvin, Orla, Cassius, Ilse et Tobin, tous de G1 et G2. Anwen, Lio, Vessa et Hilde étaient déjà de 32 à 34.
- [KO] Mes « environ 3,4 têtes » pour Marek (Passe CA1) venaient d'une règle posée sur la planche, cheveux et fourrure mal séparés : ils ne disaient rien de l'écart au cast. La cible se mesure contre le cast entier, largeur de tête comprise.
- `bigHead` (`rigs/lib/standing.mjs`) : les rangées au-dessus du menton agrandies de 1,15 à 1,3, au texel le plus proche, avec un pas un peu plus grand pour laisser la place dans le cadre. Largeurs obtenues : 28 à 33, dans la plage du cast. Marek et Orla : aussi sur leurs images de marche.

### Les emblèmes — [OK]
- `deEmblem` retire les ors à l'intérieur d'une boîte ; il laissait un fantôme pâle de la fleur de lys. `plainCloth` remplace alors la boîte par le tissu voisin. [KO → corrigé] Sa première version copiait le texel du bord, souvent l'ombre d'un pli : « bloc sombre carré » pour le troisième critique ; elle prend désormais la clarté médiane du tissu autour.
- Bordures dorées gardées. Les broderies d'Odo et de Wren, de face, restent : ce sont des motifs de vêtement, pas des emblèmes, à l'opérateur de dire si elles passent.

### Tobin et Pip
- Palette de 32 couleurs au lieu de 64, Tobin avec la tête à 1,15. Pip monte à 7 à l'aveugle, Tobin reste à 5.

### La production — [OK]
- `src/characters/PlazaCast.ts` : les huit feuilles approuvées, en morceau à part chargé par les places et par les portraits d'une partie de la version 2 seulement (C2). Les places ne chargent plus Mara ni Bram. Rhosk donne son portrait, sans entrer dans la texture d'une place. Les manifestes portent l'approbation, citée.
- Marek, Odo, Corvin, Brann, Wren, Pip et Tobin restent `candidate`, derrière `cast=candidate`, jusqu'à la fiche du lot 2 : https://claude.ai/artifact/WmhCsVqErwBduotCXEivZb (source `briefs/fiche-casting-lot2.html`).
- Dans les duels, rien ne change encore : leurs feuilles ×3 sont un autre lot.

### La critique à l'aveugle
- Sur les sept feuilles reprises : Brann 8 ; Marek, Corvin et Pip 7 ; Odo et Wren 6 ; Tobin 5. Aucun emblème restant, proportions de la distribution jugées cohérentes. Odo jugé « à reprendre » pour son visage, brouillé par la tête agrandie : la tête passe de 1,27 à 1,2 après ce verdict, sans nouvelle critique ; les capes refaites non plus.

### Les preuves
- `npm run typecheck`, `npm test` **306 / 306**, `npm run build`, `npm run art:validate` (34 manifestes, 42 sources, 0 erreur).
- **Le jeu par défaut inchangé** : 0 px au seuil 0 contre `main` figé (`a6bb987`), ville de nuit, ville à midi, arène, arène `v2=1`, en DEV **et sur les deux paquets de production**. Contrôle voulu : les trois places changent, de 1,6 à 3,0 % des pixels, dans la moitié basse de l'image, où sont les personnages.
- Paquet : un morceau `PlazaCast` à part, huit feuilles, aucune candidate. Entrée : 219 947 octets contre 219 830.
- `tools/play-flow.mjs` : par défaut et `V2=1`, en production, « all checks passed ». `build-character --check` : reconstruction identique à chaque état livré.
- [KO → corrigé] Quatre tests de la distribution comptaient tous les manifestes de production : la liste des places est sortie de celle du quartier, et les feuilles debout de la mesure de foulée.

### Journal — [OK] archivage
- Avec cette passe, les passes gardées dépassaient 60 Ko. V2C2 et V2B1, closes, partent vers `journal/40-passes-V2C2-V2B1.md`.

### Restes [?]
- La fiche du lot 2 ; les rôles de N7 ; les PNG d'origine de G1 et G2.
- Le trait des têtes agrandies est un peu plus épais que celui du corps : visible de près seulement. Marek et Odo restent proches, gris, bleu et or.
- Ensuite : les cinq citadins, les poses de charge de Ren, les feuilles ×3 dans l'ordre X2.

### Pensée
- Une critique à l'aveugle voit la propreté, pas forcément la cohérence avec le reste : deux critiques ont loué des proportions que l'opérateur a vues du premier coup. Une distribution se mesure en ligne, à la même échelle, avant la fiche.
- Une note posée sur une carte de portée peut concerner tout le lot : elle se relit avant d'appliquer les cartes voisines.
- Une feuille qui ne donne qu'un portrait se juge sur son visage : le bruit de son corps n'y paraît pas.

## Passe CA4 — La netteté : les quinze personnages redessinés sur des planches propres, de nouvelles feuilles candidates (2026-11-01)

### Les décisions de l'opérateur, mot pour mot
- Fiche des sept feuilles (https://claude.ai/artifact/WmhCsVqErwBduotCXEivZb, 8 documents relus) : Brann, Corvin, Marek, Odo, Pip, Tobin et Wren « À reprendre (en note) », S2 « À revoir (en note) », aucune note. Son message, mot pour mot : « fiche remplie mais la constat premier est que cela manque clairement de clarte et de nettete sur nos sprites. contrairement a nos premieres generations ».
- Question du remède : « Planche d'essai générée (Recommandé) ». Sur les huit feuilles en production : « Les laisser (Recommandé) ». Après l'essai, question « Quelles feuilles refait-on ainsi ? » : « Les quinze (Recommandé) ».

### Le diagnostic — [OK] mesuré
- Sur l'image de face : les premières feuilles ont 40,2 % de leurs texels en aplats de quatre ou plus et 34,7 % de texels isolés ; le casting 31,5 % et 38,6 %. La cause : G1, G2 et les planches de casting montrent des figures trop détaillées pour 64 × 96 ; les réduire transforme le détail en bruit, et la tête agrandie au texel le plus proche brouille encore les visages.
- [KO] Le recalage de la grille : une recherche du pas natif par énergie des bords ne trouve aucune grille sur aucune planche, témoins compris (elle ressort 2, 3 et 4 partout). Pas la bonne piste.
- [KO] Le nettoyage dans le rig (32 couleurs, texels isolés regroupés, annulé) : un peu plus propre, très loin des premières feuilles.
- [?] « Nos premières générations » a été compris comme les premières feuilles de production, tirées de la planche PNJ 01-16.

### Le remède — [OK] générer la source au lieu de réparer la sortie
- `gen-image.mjs` depuis le dossier principal, tâche `casting-clarity`, gpt-image-2 : six images, **1,22 $** sur 5. Chacune prend la planche PNJ 01-16 et l'essai comme cible de style, tes figures comme personnages, avec la consigne : grandes formes, visages lisibles, aucun emblème. Archivées à l'octet : `casting-clear-2026-11-01-a` à `-e` et `-walk` (`a` l'essai : Marek, Orla, Rhosk, Cassius ; `b` : Odo, Corvin, Ilse, Hilde ; `c` : Anwen, Brann, Lio, Wren ; `d` : Tobin, Pip ; `e` : Vessa, refaite plus claire ; `walk` : la marche de Marek et d'Orla). Non canoniques tant que tu ne les approuves pas.
- Les figures générées font 280 à 400 px de haut, bien plus que le sprite. `rigs/lib/clear.mjs` en tire parti : le corps au pas de sa hauteur, **la tête reconstruite à un pas plus fin depuis la même source**, donc avec du vrai détail, là où `standing.mjs` étirait les texels.
- Quinze rigs `-x2-v2`, 48 couleurs, sans fleur de lys ni emblème à retirer. Les huit feuilles `-x2-v1` restent en production, inchangées, jusqu'à ton accord ; les sept autres `-x2-v1` passent `superseded`.
- Écarts à tes figures, à vérifier sur la fiche : Vessa porte du violet clair et du cuir au lieu du noir et du violet ; Hilde a perdu ses outils ; Odo et Wren n'ont plus de broderies. Cedric a perdu son écharpe nouée sur le visage.

### La critique à l'aveugle
- Marek, Orla, Cassius et Corvin 8,5 ; Hilde, Brann, Lio, Ilse, Tobin et Rhosk 8 ; Odo, Anwen, Pip et Wren 7 ; Vessa 6,5, trop sombre, refaite ensuite sans nouvelle critique. Aucun emblème, aucun reste de fond, aucune jointure visible à la tête en marche. Réserves : visages plus petits d'Odo, Pip et Wren, moins expressifs que les premiers. La notation précédente allait de 5 à 8.
- Mesures sur l'image de face, Vessa remplacée : 36,8 % d'aplats, 38,3 % de texels isolés, 47 couleurs, et plus de contraste entre texels voisins (0,09 contre 0,07). Ces chiffres ne font pas le rendu : l'image se juge à la ligne à même échelle.

### Les preuves
- `npm run typecheck`, `npm test` **307 / 307**, `npm run build`, `npm run art:validate` (49 manifestes, 48 sources, 0 erreur). `build-character --check` : les quinze identiques (Vessa reconstruite après la série, vérifiée à part).
- **Paquet de production** : aucun fichier de l'entrée ne change, ni aucune feuille `-x2-v2` du casting : tout est en DEV, derrière `cast=candidate`.

### La fiche
- Page privée https://claude.ai/artifact/JBaukUqxwu8twGMU6uU3gs (source `briefs/fiche-casting-lot3.html`), une carte par personnage. Les notes s'y enregistrent désormais pendant la frappe : N7 s'est perdue deux fois sur une page qui n'enregistrait qu'en quittant le champ.

### Restes [?]
- La fiche ; N7 ; les PNG d'origine de G1 et G2. Ensuite : les cinq citadins, les poses de charge de Ren, les feuilles ×3 dans l'ordre X2, qui reprendront ces figures propres comme références.

### Pensée
- Une sortie trop bruitée se soigne à la source : réparer les texels a coûté trois passes, redessiner la source quelques dizaines de centimes.
- Une source plus grande que le sprite permet de corriger les proportions sans perdre de détail : on la relit à un autre pas au lieu d'étirer des texels.
- « Comparable aux premières feuilles » se pose comme cible avant de bâtir une planche : la mesure des aplats et la ligne à même échelle auraient montré l'écart dès le premier lot.
- Un champ qui n'enregistre qu'à la sortie perd ce qu'on tape avant de fermer : sur une fiche, on enregistre à la frappe.

## Passe CA5 — Les quinze feuilles en production : plus aucun sprite provisoire sur les places (2026-11-01)

### Les décisions de l'opérateur, mot pour mot
- Fiche https://claude.ai/artifact/JBaukUqxwu8twGMU6uU3gs, 17 documents relus : **« Production »** pour les quinze personnages, S3 **« Validé »**.
- [?] N7 : « Rôles en note », note vide pour la troisième fois, alors que la note s'enregistre désormais à la frappe. Les trois panneaux de G1 restent en réserve ; rien n'est cuit pour eux tant qu'un rôle n'est pas écrit.

### Fait — [OK]
- `src/characters/PlazaCast.ts` : les quinze `-x2-v2`, entre lesquelles Marek et Orla marchent ; Rhosk et Tobin donnent leur portrait sans entrer dans la texture d'une place.
- Les huit `-x2-v1` qui étaient en production passent `superseded`, leur approbation gardée dans leurs notes. Les six images `casting-clear-2026-11-01-*` sont approuvées comme sources, par les feuilles bâties sur elles.
- `PlazaApp` : plus aucun `prov-` ; `SQUARE_PEOPLE` ne génère de sprites que sous `cast=generated`, la comparaison. `__stats()` donne `generated` à la place de `provisional`. `src/lab/plazaCast.ts` et les branchements DEV `cast=candidate` des places sont retirés.
- `ui.plazaTag` : le nom du lieu seul ; « its people without a baked sheet are provisional sprites » était devenu faux. Texte de la version 2 seulement.

### Les preuves
- `npm run typecheck`, `npm test` **305 / 305** (le fichier `plaza-cast` réécrit, de 9 à 6 tests : les candidates n'existent plus), `npm run build`, `npm run art:validate` (49 manifestes, 48 sources, 0 erreur).
- **Le jeu par défaut inchangé** : 0 px au seuil 0 sur les deux paquets de production contre `main` figé (`71771b7`) : ville de nuit, ville à midi, arène, arène `v2=1`. Entrée de la même taille, 219 947 octets.
- `play-flow` en production, par défaut et `V2=1` : « all checks passed ».
- **Sept états de places**, parvis, lices et halle, matin, midi, fin de journée, nuit : `generated` vide partout, aucune erreur de page. Le portrait de Marek montre son nouveau visage dans une partie de la version 2.
- Paquet : quinze feuilles `-x2-v2` du casting, toutes dans le morceau `PlazaCast`, aucune `-x2-v1` du casting.
- [?] Non mesuré : le coût GPU des places avec ces feuilles (même nombre de sprites et d'appels de dessin, une texture cuite plus remplie).

### Restes [?]
- N7 ; les PNG d'origine de G1 et G2.
- Chaque rival doit encore se battre sous sa propre figure : en duel, Orla, Cassius, Ilse, Rhosk et Tobin portent toujours l'art de Marek. Les feuilles ×3 viennent après les poses de charge de Ren, dans l'ordre X2, à partir des figures propres de cette passe.
- Les cinq citadins : 492 images de places aujourd'hui, 642 avec eux, sous les 672 garanties.

### Pensée
- Quand une feuille prend la place d'une autre, ce qui disait son absence tombe avec elle : un texte du jeu, un compteur d'outil, une liste de test.

## Passe CA6 — Les cinq citadins : cinq marcheurs de la planche PNJ 01-16, candidats sur les places (2026-11-01)

### La demande
- L'opérateur, mot pour mot : « Citadins mais tu peux faire le combat sur une autre session ». Les feuilles de combat partent dans leur propre séance, branche à part : exception à la règle d'une seule branche, limitée à ces deux branches et demandée par ces mots.
- Décisions déjà prises (Passe CA1) : N1 à N5 « Cuire » ; les enfants de jour seulement, la dame noble pour midi et la fin de journée, chacun marche (30 images).

### Fait — [OK]
- Cinq feuilles candidates `-x2-v1` : `vendor` (N1 n° 01), `wayfarer` (n° 08), `noble` (n° 10), `errand-boy` (n° 11), `girl` (n° 12), tirées de la planche PNJ 01-16, celle de la première distribution. Aucune image générée, 0 $ : la remarque de l'opérateur sur la netteté visait ce qu'on réduisait d'autres planches, pas celle-ci.
- Recette `rigs/lib/citizen.mjs`, tirée des rigs de la première distribution : `legs` (marche du garde), `dress` (de l'artisane), `gown` (nouvelle, une robe au sol sans pied à montrer), et le profil par une jambe qui s'incline depuis sa première rangée.
- Le pas de reconstruction règle la taille : adultes de 86 à 88 rangées, comme la distribution (86-89) ; enfants de 65 à 69, sur le même texel, pas une échelle réduite.
- L'ombre de sol de la planche est retirée par le rig (`noGround`) : l'option `noShadow` ne l'enlevait pas et `align` la prenait pour les semelles.
- Les places : `CROWD_TURN` (`src/world/PlazaApp.ts`) dit qui marche à quelle heure, le nombre de passants ne change pas. Les cinq feuilles restent derrière `cast=candidate` (`src/lab/plazaCast.ts`, DEV seulement, compilé hors production) ; sans feuille dans la distribution, un citadin perd son tour.

### Les preuves
- `npm run typecheck`, `npm test` **309 / 309** (quatre tests de plus, dont l'heure de chacun), `npm run build`, `npm run art:validate` (54 manifestes, 48 sources, 0 erreur) ; `--check` refait à l'identique les cinq feuilles.
- Aucune feuille candidate dans le paquet de production. Le seul nom retrouvé est le libellé de la rotation, dans le morceau des places.
- Dix états de places, parvis, lices et halle, du matin à la nuit : ni sprite généré ni erreur de page ; de nuit ni enfants ni dame noble. Texture cuite : 642 images sur 672 garanties, 2048 x 2016.
- Netteté sur l'image de face : texels isolés 32-44 %, aplats 31-42 %, dans la fourchette des premières feuilles (26-52 % et 26-52 %). Pas dessiné au sol : 4,5 pour les adultes, 4 pour les enfants, 2 pour la dame, mesuré sur l'ourlet ; elle marche donc environ deux fois moins vite que les autres.

### Les critiques à l'aveugle — [?]
- Première : 4 à 6,5 sur 10. Corrigé après elle : la face de la voyageuse (la 2e vue de la planche, la 1re montrait une autre écharpe et d'autres cheveux) ; la caisse du garçon reportée sur son profil avec les pixels de sa vue de face ; la robe de la dame, qui balance deux fois plus et dont l'ourlet monte ; l'aplat noir du marchand (`liftLegs`, la leçon de la Passe 4A-tervicies) et le coin sombre entre ses jambes ; un trait parasite de la fillette (la fermeture verticale, depuis la rangée 66 chez les enfants).
- Seconde : 5 à 6 sur 10, aucune feuille à 7. Corrigé après elle : la caisse qui flottait, l'éperon d'une botte. La dernière version de la caisse n'a pas repassé de critique.
- Restent, sur la planche d'origine : le dos de la voyageuse (grand sac, cheveux courts), la pèlerine de la dame, les bras pendants des enfants, les cheveux du marchand de profil. C'est le même écart que les citadins approuvés (« Fidèles aux planches »). Reste aussi la marche sans balancement des bras : l'opérateur l'a jugé sans priorité le 18/10.

### La suite
- La fiche : https://claude.ai/artifact/6KJMxVgWQyMx1sZisTz2nu (source `briefs/fiche-casting-citadins.html`, 7 cartes, marches animées, `decisions` vide à la publication). Rien en production avant sa relecture ; une carte demande s'il faut une planche propre pour des vues cohérentes.
- La séance Feuilles de combat ×3 tient les poses de charge de Ren et les rivaux. N7 reste ouverte.

### Pensée
- Une critique à l'aveugle juge aussi ce que la source impose : séparer ce qu'on peut corriger de ce que la planche décide, et mettre le reste sur la fiche sans le maquiller.
- Avant de prendre la vue attendue d'une planche, regarder les quatre : ici la 2e vue collait mieux à la 3e et à la 4e que la 1re.

## Passe CA7 — Les cinq citadins en production sur les places de la version 2 (2026-11-01)

### Les décisions de l'opérateur, mot pour mot
- Fiche https://claude.ai/artifact/6KJMxVgWQyMx1sZisTz2nu, 7 documents relus, aucune note : S4 **« Validé »** ; **« Production »** pour le marchand, la voyageuse, la dame noble, le garçon et la fillette ; L4-P **« Non, garder la planche d’origine »**.

### Fait — [OK]
- Les cinq manifestes `approved`, `production` ; les cinq feuilles dans `src/characters/PlazaCast.ts`, chargées par les places seules, un morceau à part. `src/lab/plazaCast.ts` est retiré : `cast=candidate` ne concerne plus aucune feuille.
- Les vues qui changent selon la planche restent telles quelles, par décision de l'opérateur : aucune image générée pour ce lot.

### Les preuves
- `npm run typecheck`, `npm test` **309 / 309**, `npm run build`, `npm run art:validate` (54 manifestes, 48 sources, 0 erreur).
- **Le jeu par défaut inchangé** : 0 px au seuil 0 sur les deux paquets de production contre `main` figé (`a24c2d5`) : ville de nuit et ville à midi (`clean=1`), arène, arène `v2=1`. Entrée de la même taille, 219 947 octets. Avec l'interface, la ville diffère de 342 px dans un rectangle fixe en bas à droite, un compteur en direct : le témoin `main` contre `main` y diffère de 347 px. Contrôle négatif, nuit contre midi : 96 % des pixels.
- `play-flow` en production, par défaut et `V2=1` : « all checks passed ».
- Dix états de places par le chemin de production : ni sprite généré ni erreur de page, de nuit ni enfants ni dame noble.
- GPU à 1920 x 1080 sur la 780M, en DEV, contre `main` : parvis à midi 9,19 ms contre 9,90 ms (seul tour sur deux sans contention). Halle en fin de journée : 12,07-13,38 ms contre 13,15-13,19 ms, chaque tour contesté par un autre processus. Aucune hausse mesurée : même nombre de sprites et d'appels de dessin.

### Restes [?]
- La halle reste à remesurer sans contention ; le budget « Pas plus cher que la nuit B » n'est donc pas confirmé pour elle.
- La dernière version de la caisse du garçon n'a pas repassé de critique à l'aveugle.
- N7 ; les PNG d'origine de G1 et G2.
- En duel, Orla, Cassius, Ilse, Rhosk et Tobin portent toujours l'art de Marek : c'est la séance « Feuilles de combat ×3 ».

### Pensée
- Un écart de quelques centaines de pixels dans un rectangle fixe se prouve par un témoin sur la même base, pas par l'intuition que c'est un compteur.

