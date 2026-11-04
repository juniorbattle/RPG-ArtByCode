# Journal de bord — archive : passes SN15, SN16, SN17 (2026-11-04)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-11-04 (Passe SN22) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe SN15 — Lot S3, fiche d'écoute 2 : les sons du duel, joués par le groupe (2026-11-04)

### Demande
- L'opérateur, mot pour mot : « Oui, continue ». Le reste du lot S3, d'après le plan d'audit (`briefs/fiche-son.html`) : « Un son par recette, fenêtre d’esquive, foule qui réagit, K.O. et ralenti », avec les instruments du groupe, sur une fiche d'écoute. S'y ajoutent les baisses sous les coups, renvoyées aux nouveaux sons (CQ-BAISSE, Passe SN14).

### Ce qu'il y avait
- Relevé de l'audit (Passe SN1) :
  - cinq sons pour tous les coups, alors que le duel a 44 recettes d'effet visuel, une par action ;
  - les compétences muettes, de même que la séquence adverse, la fenêtre d'esquive, l'étourdissement et le repoussé ;
  - le ralenti du K.O. sans pendant sonore ;
  - une clameur fixe ;
  - 93 à 99 % de l'énergie des coups sous 200 Hz.
- Mesuré dans cette passe : le grondement de l'arène sort à −20,8 LUFS, à égalité avec la musique du duel (−20,7). C'est le « bruit de vague » de la note de l'opérateur (Passe SN11).

### Fait — [OK]
- **`art-lab/audio/sfx/duel.sfx.mjs`** : un son pour chacune des 44 recettes de `src/arena/fx/fxRecipes.ts`, nom pour nom, plus les cinq de la lecture du duel (`threat`, `window`, `dodge`, `stun`, `pushed`), le coup esquivé et la commande refusée. Tout est joué par les instruments du groupe : la batterie, la timbale, les cuivres, l'orgue, le vibraphone, le rhodes, le marimba, la guitare, la basse, l'EWI et la flûte.
  - Ren sonne l'acier (cercle, caisse claire, tintement de lame), les rivaux les peaux (toms, cajón, slap).
  - Les sons qui ont une hauteur sont sur les notes du motif, ré, mi, sol, la, do, sans tierce.
  - Les coups fréquents ont trois prises (deux pour la garde, l'esquive et le coup esquivé).
  - Le K.O. rejoue son propre coup ralenti (0,45 fois la vitesse, un peu plus d'une octave plus bas) sous le ralenti de l'image.
  - Le grave est tenu par famille : les coups de Ren 72 % sous 200 Hz, son coup puissant 7 %, le bris 4 %, le K.O. 12 %. Les sons sourds le restent par dessein (l'épaule, le coup sauvage, le Sunder : 95 à 100 %).
  - Le niveau de chaque son est réglé sur ses 400 ms les plus fortes.
- **`art-lab/audio/sfx/crowd.sfx.mjs`** : la foule écrite en code (SA-11, le code d'abord). Chaque voix est une source glottique passée dans les trois formants de sa voyelle, avec sa hauteur, son souffle et sa place. Les mains sont des rafales de bruit. La foule comprend :
  - un murmure en boucle de 16 s (60 voix syllabe par syllabe, quelques applaudissements) ;
  - « oh » (70 voix), le souffle coupé (40 inspirations puis 50 « ah »), l'acclamation (70 voix et 30 paires de mains), la clameur du K.O. (110 voix et 60 paires de mains).
- **`tools/audio/band/sfx.mjs`** : le rendu, 64 fichiers en 13 s, chaque son à partir de sa seule écriture.
- **`tools/audio/sfx-listen.mjs`** et **`sfx-jobs.page.js`** : la banque jouée par le vrai moteur, sur les bus du moteur, avec l'envoi vers la salle et les baisses sous les coups. Le script de page remplace seulement les sons du duel et le grondement : la musique, la règle F, la coupure du K.O. et le jingle restent ceux du moteur. Les niveaux sont posés sur la sortie du moteur avant les extraits :
  - le murmure 5 dB sous la musique, d'où le gain de la foule (+0,7 dB) ;
  - les sons à la part qu'ont aujourd'hui les effets dans le mélange (−10,7 dB) ;
  - en résultat, le duel entier sort à **−17,2 LUFS aujourd'hui comme avec la proposition**, et la fin contre Orla à −16,9 contre −17,0.
  
  Viennent ensuite les extraits : le duel de la fiche des couches (Marek, de 1:00 à 2:30), ses 45 premières secondes avec les baisses à moitié et sans baisse, la foule seule, la fin du duel gagné contre Orla, aujourd'hui puis proposée. Puis les palettes, chaque famille à la suite à −20 LUFS, et celle des sons d'aujourd'hui avec le grondement, à comparer.
- **`tests/audio-sfx.test.mjs`** : une recette, un son, nom pour nom, et les cinq sons de la lecture du duel. Un son se rend identique à l'octet d'un rendu à l'autre, et aucun échantillon ne dépasse la pleine échelle. Contrôle négatif : un son retiré, le test échoue.
- **La fiche** : page privée https://claude.ai/artifact/Wc2u1Uftu1r4P4mroyqYbN, source `briefs/fiche-son-duel.html`. Ses dix-sept extraits MP3 sont publiés avec la page, pas dans le dépôt. Onze cartes :
  - le duel entier, aujourd'hui puis proposé (S3-DUEL) ;
  - la foule (S3-FOULE) ;
  - les baisses (S3-BAISSE) ;
  - sept familles : les coups, Ren, les rivaux, les soutiens, la charge, la lecture, le K.O. ;
  - la suite (S3-SUITE, recommandé : « Cuire et brancher dans la version 2 ce qui est validé ») ;
  - la charge recommande « sans son pour le maintien », les autres cartes de goût sont sans recommandation.
  
  `decisions` relu vide à la publication. La page a été vérifiée en local à 1 200 et 390 px avec le squelette du service reproduit : dix-huit lecteurs chargés, aucun débordement.

### Mesures
- Spectrogrammes des 30 premières secondes. Aujourd'hui, le haut du spectre est rempli de bruit d'un bout à l'autre (le grondement et les souffles des coups). Avec la proposition, il se dégage : les coups deviennent des événements séparés, et les notes de la musique se lisent.
- Poids, encodé comme une cuisson le ferait :
  - en Opus, 1 353 ko à 80 kb/s (le murmure à 96), 1,16 Mo à 64 kb/s ;
  - en AAC, 1,28 Mo.
  
  Le total Opus passerait de 11,07 à environ 12,2 Mo. C'est sous les 12 Mio que contrôle `validate.mjs` (SA-17), mais au-dessus de 12 Mo au sens strict ; la fiche le dit.
- `npm test` 388 sur 388, `npm run typecheck`, `npm run build`, `npm run art:validate` (14 manifestes de son, 0 erreur). Aucun fichier de `src/` ni de `public/` ne change, aucun fichier audio n'entre dans le dépôt.

### Limites
- **Personne n'a écouté.** Je n'ai pas d'oreille : les spectrogrammes, la part du grave, les crêtes et les niveaux attrapent les défauts grossiers, pas la beauté ni le réalisme d'une foule.
- Une foule écrite en code peut sonner synthétique. La fiche propose les enregistrements CC0 de SA-11 en complément.
- Les sons ne sont pas dans le jeu. Leur branchement (le chargement à la demande, une table par événement, la variation de hauteur tirée du hasard propre au son et non de `Math.random`) attend la décision S3-SUITE et l'approbation des manifestes.
- Le maintien de la charge n'est joué dans aucun extrait de duel : le banc n'a que les événements de la simulation, pas le temps de présentation.
- Les rendus du moteur se reproduisent à −127 dB près, pas à l'échantillon (Passe SN13).

### Où reprendre
- Relire `decisions` quand l'opérateur dit la fiche remplie, consigner mot pour mot, n'agir que sur ce qui est décidé. Si S3-SUITE est validé :
  - cuire les sons validés sous manifeste, Opus et AAC (`bake.mjs` ou son pendant pour les sons), avec l'approbation mot pour mot ;
  - les brancher dans `Sound.ts` derrière `flags.v2`, à la place de `take()` et du grondement ;
  - faire les preuves : `engine-proof`, `analyse --check`, `decode-proof` ;
  - donner l'essai en jeu.
  
  Puis S2, dans sa propre séance.

### Pensée
- Un bruit de fond qui couvre tout se mesure avant de se juger : le grondement était aussi fort que la musique, et la note « bruit de vague » le désignait sans le savoir.
- Une proposition se fait entendre au niveau de ce qu'elle remplace : le duel entier calé à la même sonie, aujourd'hui et proposé, sinon le plus fort gagne à l'oreille.
- Sans oreille, on contrôle ce que les chiffres voient (la part du grave, les crêtes, les niveaux, un spectrogramme) et l'on donne le reste à l'opérateur, nommé.

## Passe SN16 — La fiche des sons du duel relue, onze sur onze : cuits et branchés dans la version 2 (2026-11-04)

### Demande
- L'opérateur, mot pour mot : « Fiche remplie ».

### La fiche
- Page privée https://claude.ai/artifact/Wc2u1Uftu1r4P4mroyqYbN, source `briefs/fiche-son-duel.html`. Relue par `list` : 11 documents sur 11, aucune note.

| # | Décision | Choix de l'opérateur |
|---|---|---|
| S3-DUEL | Le duel, aujourd'hui et proposé | « Mieux : continuer dans cette voie » |
| S3-FOULE | La foule, à la place du grondement | « Bonne direction (par le code) » |
| S3-BAISSE | La musique sous les coups | « Garder les baisses » |
| S3-COUPS | Les coups, la garde, l'esquive, le bris | « Bonne direction » |
| S3-REN | Les compétences de Ren | « Bonne direction » |
| S3-RIVAUX | Les compétences des rivaux | « Bonne direction » |
| S3-SOUTIENS | Les protections et les renforts | « Bonne direction » |
| S3-CHARGE | La charge | « Bonne direction » |
| S3-LECTURE | La lecture du duel | « Bonne direction, les cinq » |
| S3-KO | Le K.O. et son ralenti | « Bonne direction » |
| S3-SUITE | Ce qui vient après | « Cuire et brancher dans la version 2 ce qui est validé » |

### Ce que ces choix veulent dire
- **Tout est validé**, la foule par le code (SA-11, sans enregistrement). Les baisses sous les coups restent celles d'aujourd'hui.
- **S3-CHARGE garde le souffle du maintien.** La recommandation de la fiche, « sans son pour le maintien », n'a pas été prise.
- **S3-SUITE** : cuire sous manifeste, avec l'approbation mot pour mot, et brancher derrière `flags.v2`. Chaque manifeste cite ce choix et les choix d'écoute de sa famille, puis dit « To be confirmed after the trial in play », comme la musique avant E-PROD.

### Fait — [OK]
- **La cuisson** (`tools/audio/band/bake-sfx.mjs`) : 64 sons, 128 fichiers `src/audio/baked/sfx-*`, en Opus à 64 kb/s et en AAC à 80 (le murmure à 96). Chaque son est rendu depuis sa seule écriture. Il y a huit manifestes, un par famille : `duel-coups`, `duel-ren`, `duel-rivaux`, `duel-soutiens`, `duel-charge`, `duel-lecture`, `duel-ko` (`kind: effect`) et `foule` (`kind: ambience`). La table `sfx` de `src/audio/catalogue.json` donne les prises et leurs longueurs ; `bake.mjs` la garde quand il réécrit le catalogue. `encode.mjs` accepte un débit et des arguments par format, sans rien changer à la musique.
- **Le moteur** :
  - `src/audio/sfx.ts`, pur : la table de la fiche (`sfxOf`, `crowdOf`, `holdOf`, `chargeLevel`, `varyOf`), les niveaux posés pour la fiche (`SFX_TRIM` −10,7 dB, `CROWD_TRIM` 0,7 dB moins `MIX.ambience`), une réaction de la foule toutes les 2,6 s au plus, une menace par seconde au plus, un souffle de la charge toutes les 0,6 s comme l'effet visuel.
  - `Sound.ts` : la banque est décodée à l'ouverture d'une scène d'arène. Chaque événement du duel joue ses sons sur le bus des effets, avec l'envoi vers la salle, une autre prise que la précédente, et les baisses de `DUCK` telles quelles. La foule remplace le grondement de l'arène : le murmure boucle sur son échantillon, sur le chemin de l'ambiance. Les recettes du lot S0 ne jouent plus que si la banque ne peut pas se décoder, pour qu'un duel ne soit jamais muet.
  - `ArenaApp` donne au moteur le nombre de paliers de la charge.
- **Un écart avec la fiche, nommé** : la variation de hauteur (±3 %) est réservée aux coups simples, à la garde et à l'esquive (`varyOf`). Les sons accordés sur le motif ne varient plus qu'en niveau, la lecture du duel et les notes de la charge jamais. Dans les extraits de la fiche, tous variaient ; à ±3 %, une note accordée pouvait s'écarter d'un demi-ton de la musique.
- **Tests** :
  - `tests/audio-sfx.test.mjs` passe de 2 à 5 tests : la banque cuite sous ses manifestes et dans le catalogue ; la table, événement par événement ; les paliers contre le `chargeLevel` de l'effet visuel, sur 2 à 9 paliers ; les baisses, la variation, la foule, le souffle de la charge, les niveaux.
  - `tests/audio-baked.test.mjs` et `tests/v2-sound-s1.test.mjs` comptent les huit familles et les 128 fichiers.
- **Preuves** :
  - `engine-proof.mjs`, sur la sortie réelle : le murmure de l'arène depuis 0,060 s, autour de son tour à 16,06 s (0,00 % inexpliqué, décalage 0) ; la cloche de la fenêtre d'esquive jouée telle que cuite, à 4,005 s plus le retard de sortie (0,05 % inexpliqué) ; 29 vérifications sur 29. Contrôle négatif sur `main` figé (`e40ade1`) : ces deux vérifications échouent, 100 % inexpliqué.
  - `analyse.mjs --check` passe. La foule de l'arène sort à −25,7 LUFS, 5,0 dB sous la musique du duel (−20,7). Les duels sont à −17,4 et −17,6 LUFS, contre −17,2 et −17,3 en SN14 ; à plein volume −1,5 dBTP ; un clic de l'interface passe 6,9 dB au-dessus de la foule (3,5 au-dessus du grondement).
  - `decode-proof.mjs` étendu aux sons : Chrome 130 sur 130 et Firefox 130 sur 130 (longueurs, débuts, le murmure retrouvé à son vrai début quand le décodeur garde le délai).
  - `bake-sfx.mjs --check` : tout comme les manifestes. `bake.mjs --check` : les 48 fichiers de la musique identiques à l'octet après le changement d'`encode.mjs`.
  - `hooks-proof.mjs`, dans le vrai jeu (serveur DEV, Chrome piloté) : sur `?scene=arena&v2=1`, après un clic, 56 sons sur 56 décodés, la foule en place du grondement, onze événements joués par les sons du groupe (8 coups, une garde, une menace, un renfort de Marek), les recettes du lot S0 jamais, aucune erreur de page.
  - `npm test` 391 sur 391, `npm run typecheck`, `npm run build`, `npm run art:validate` (22 manifestes de son, 0 erreur).
- **Poids** (SA-17) : 12 280 918 octets en Opus (11,71 Mio) et 11 082 417 en AAC (10,57 Mio). C'est sous les 12 Mio par format que contrôle `validate.mjs`.

### Défaut trouvé — [KO → corrigé]
- **Firefox décodait autrement cinq AAC bruités** (le bris, le coup éclair, l'Estocade, deux souffles). La longueur et le début étaient justes, mais la ressemblance avec le décodage de ffmpeg n'était que de 0,85 à 0,89. En cause, la substitution de bruit perceptuelle du codeur AAC : une bande codée comme du bruit est tirée à nouveau par chaque décodeur. Les sons sont recuits avec `-aac_pns 0` (AAC seulement, la musique inchangée) : 130 sur 130 dans les deux navigateurs, et 8 ko de moins.

### La fiche d'essai
- Page privée https://claude.ai/artifact/Pid9tqciTfEQ4zviWkJnhc, source `briefs/fiche-son-essai-duel.html`. Elle dit comment jouer (serveur DEV, `?scene=arena&v2=1`, un clic ; `&music=rival|finale`). Trois cartes : S3E-JEU, le ressenti en jouant ; S3E-PROD, la confirmation de production ; S3E-SUITE, lancer S2. `decisions` relu vide à la publication.

### Limites
- **Personne n'a entendu les sons dans le jeu en jouant.** Les extraits de la fiche étaient des rendus du moteur sur le duel du bot.
- Le souffle du maintien n'était dans aucun extrait : on l'entendra pour la première fois en jouant.
- Safari n'est toujours pas essayé (SC-SAFARI).

### Où reprendre
- Relire la fiche d'essai quand l'opérateur la dit remplie. Si S3E-PROD est confirmé, écrire la confirmation dans les huit manifestes (`bake-sfx.mjs`, comme `CONFIRMED` dans `bake.mjs`). Puis S2, dans sa propre séance.

### Pensée
- Un codeur peut laisser au décodeur une part de hasard : avec la substitution de bruit, deux navigateurs jouent deux cymbales. Une preuve de décodage contre un témoin extérieur le voit, une preuve qui compare le moteur à lui-même non.
- Varier un son pour qu'il ne se répète pas, c'est aussi le désaccorder : la variation de hauteur va aux sons sans note.

## Passe SN17 — La fiche d'essai des sons du duel relue : en production dans la version 2, S2 ensuite (2026-11-04)

### Demande
- L'opérateur, mot pour mot : « Fiche remplie ».

### La fiche
- Page privée https://claude.ai/artifact/Pid9tqciTfEQ4zviWkJnhc, source `briefs/fiche-son-essai-duel.html`. Relue par `list` : 3 documents sur 3, aucune note.

| # | Décision | Choix de l'opérateur |
|---|---|---|
| S3E-JEU | Les sons du duel en jouant | « Bien dans le jeu » |
| S3E-PROD | Les sons en production dans la version 2 | « Confirmé : en production dans la version 2 » |
| S3E-SUITE | Ce qui vient après | « Lancer S2 » |

### Ce que ces choix veulent dire
- **Le lot S3 est clos** : la musique des combats et sa règle F (Passes SN13, SN14), les sons du duel et la foule (Passes SN15, SN16), entendus en jouant et confirmés en production dans la version 2.
- **S2 vient maintenant**, dans sa propre séance, déjà ouverte pour lui (« Lot S2 du son, après S3 : météo, lieux, interface ») : la décision lui est transmise mot pour mot.

### Fait — [OK]
- `bake-sfx.mjs` écrit la confirmation (`CONFIRMED`, comme `bake.mjs` pour la musique). Les huit manifestes des sons ne changent que par elle, dans `approval` et `decisions` ; les 128 fichiers audio et la table du catalogue restent identiques à l'octet.
- `npm test`, `npm run typecheck`, `npm run art:validate` (22 manifestes de son, 0 erreur).

### Où reprendre
- S2, dans sa séance. Toujours à l'opérateur : l'essai Safari sur un appareil Apple (SC-SAFARI).

