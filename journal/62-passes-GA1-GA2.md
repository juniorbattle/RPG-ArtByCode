# Journal de bord — archive : passes GA1, GA2 (2026-11-06 → 2026-11-07)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-11-07 (Passe EVL5) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe GA1 — L'art des trois combattants génériques : six feuilles candidates, gen-image.mjs étendu à MiniMax (2026-11-06 → 2026-11-07)

### Demande
- Transmise par la séance du lot L2 (`local_45a3b81c-…`) : faire l'art des trois combattants génériques de la version 2, d'après le choix de l'opérateur L2-11 « Ces trois figures, une tâche à part après la fusion » (Passe EVL4). Les figures : Ser Aldric Venn ← le chevalier n° 07 « Combattant du Tournoi — Chevalier (Homme) » de la planche des personnages principaux ; Corra Dunmere ← le panneau 2 de G1 (la dame au bâton) ; Frère Ambrose ← le panneau 4 de G1 (le porteur de lanterne). Le panneau 1 de G1, double du héros, reste sans rôle (N7).
- Pour chacun : une feuille de ville ×2 (la recette du casting, `rigs/lib/clear.mjs`), qui donne aussi le visage du portrait, et une feuille de combat ×3 (`rivalRig`, `rigs/lib/combat.mjs`), depuis des planches générées, au plus 5 $ par combattant (X5). Tout reste `candidate` jusqu'à la fiche de lot. Branche `claude/generiques-art`.

### Le compte OpenAI à sec, MiniMax essayé — [KO], puis OpenAI rechargé — [OK]
- Les trois premières requêtes (planches propres de ville) : « HTTP 429: You have no credits remaining ». Non facturées (0 $ au registre).
- **L'opérateur, mot pour mot, dans cette séance : « Utilise MiniMax »** (2026-11-06). Dans la séance du lot L2, à sa question (« Je recharge OpenAI (Recommandé) », « Essayer la clé MiniMax », « Mettre en pause ») : **« Essayer la clé MiniMax »**, dont le texte disait : « AGENTS.md réserve cette clé à ta demande, et gen-image.mjs ne parle qu'à OpenAI : il faudrait d'abord étendre l'outil (provenance, plafond) et amender la règle « Image generation ». » Ce choix couvre l'usage de la clé pour cette tâche, pas un changement de plafond.
- **`tools/art-lab/gen-image.mjs` étendu** : `--model=image-01` envoie à l'endpoint `image_generation` de MiniMax (référence de l'API et prix lus le 2026-11-06 : 0,0035 $ l'image), sa clé `MINIMAX_API_KEY` lue comme l'autre (environnement, sinon le `.env.local` ignoré par git), jamais lue à la main ; même plafond par tâche, même registre (réservé avant l'envoi, réglé sur les images que la réponse compte), même fiche automatique ; les octets de la réponse gardés tels quels (JPEG) ; `--archive` accepte un `.jpg`. Les limites de l'API refusées avant l'envoi : une seule référence (son `subject_reference`, type « character », PNG ou JPEG de moins de 10 Mo), 1 500 caractères de prompt, 512 à 2 048 pixels par côté en multiples de 8, 1 à 9 images. `--root=<checkout>` : la clé, le registre et le dossier de sortie d'un autre dossier de ce dépôt (un worktree n'a pas de `.env.local`).
- **L'essai MiniMax** (cinq requêtes, dix-huit images, 0,063 $) : un style de dessin animé au lieu du pixel art, cinq à six têtes au lieu de trois, des vues fausses (deux faces, deux dos, des profils vers la droite), le casque d'Aldric ouvert alors que demandé fermé, de faux filigranes ; une planche de poses de combat d'Ambrose qui ne suit ni les poses ni l'orientation et dessine des numéros. Cause : l'API ne prend qu'une image de référence, pensée pour un visage ; ni cible de style, ni planche de mise en page. Montré à l'opérateur en image (la série du casting à côté).
- **L'opérateur : « Je recharge OpenAI », puis « c"est recharge »** (2026-11-07). Toutes les feuilles viennent de gpt-image-2.
- `AGENTS.md`, règle « Image generation » : MiniMax, les mots de l'opérateur, ce que l'essai a montré, gardé dans l'outil pour ses seules demandes.

### Fait — [OK], tout `candidate`
1. **Trois planches propres** (une requête de deux variantes chacune, 0,39 à 0,40 $), références : la figure choisie, la planche PNJ 01-16 et la planche propre du casting `casting-clear-2026-11-01-a` (la série). Retenues et archivées à l'octet : `aldric-clear-2026-11-07` (sa variante 2 : son dos montre le tabard comme la figure), `corra-clear-2026-11-07`, `ambrose-clear-2026-11-07`.
2. **Trois feuilles de ville** `aldric-x2-v1`, `corra-x2-v1`, `ambrose-x2-v1` (`clearRig`, 12 images debout, 48 couleurs) : à même échelle à côté de Ren, Orla, Ilse et Cassius ; la tête de Corra agrandie de 1,2 et celle d'Ambrose de 1,1, relues à la source (largeur de tête de 26-27 texels contre 29 à 34 pour le casting ; 1,15 poussait la capuche sur l'anneau du cadre) ; Aldric sans agrandissement, `rows` 88 (son plumet compris). Les visages de portrait (le recadrage de `faceCrop`) : le casque d'Aldric visière fermée, Corra, Ambrose dans sa capuche.
3. **Treize planches de poses** archivées (`<id>-combat-x3-2026-11-07-a…e`), références : la figure propre, la figure d'origine, deux planches de Ren pour la mise en page. Les invites reprennent celles des rivaux (Passe CX3), adaptées à l'arme : l'épée longue d'Aldric depuis le texte (sa figure n'en porte pas, X4), le bâton doré à tête ajourée de Corra et le bâton d'Ambrose depuis leurs panneaux, sa lanterne à la ceinture.
4. **Trois feuilles de combat** (`rivalRig`, profils empruntés de `src/narrative/generics.ts`) : `aldric-x3-combat` 32 images (le profil d'Ilse : garde, trois compétences), `corra-x3-combat` 29 (Orla : ni esquive ni ralliement), `ambrose-x3-combat` 34 (Cassius : garde, esquive, trois compétences). Le pas de chaque planche réglé sur la hauteur d'une figure debout (plumet, ruban ou capuche jusqu'aux semelles) : les planches d'une même série ne sont pas dessinées à la même échelle (Ambrose : de 292 à 545 pixels de « debout »). Têtes non agrandies : à même échelle, celle d'Aldric 40 texels, Corra 44, Ambrose 38, contre Ren 43, Orla 45, Cassius 40.
5. **`rigs/lib/combat.mjs`** : un `mask` par figure, des rectangles de sa planche repeints couleur du fond après l'isolement ; absent, rien ne change. Les huit feuilles de combat en production reconstruites à l'identique (`build-combat --check`, huit sur huit) ; l'empreinte du fichier mise à jour dans leurs huit paquets avec une note de maintenance (ancienne valeur gardée), comme le veut la règle des outils figés.
6. Manifestes et paquets de provenance des six feuilles, `candidate`, `runtimeUse: lab` ; rien dans le jeu ne les charge. Vues en DEV dans le duel par `?scene=arena&v2=1&fighterdensity=combat&foe=<id>` (le duel de cette page prend encore le profil de Marek pour un générique : à corriger au branchement).

### Défauts trouvés — [KO → corrigé]
- La première boîte d'une figure collait à sa lame : son coin n'était plus le fond, la chaîne l'a refusée (`cornerIsBackground`). Toutes les boîtes ont 12 pixels de marge (4 en bas).
- Corra, l'armé : l'étiquetage des composantes s'arrête à 40 pixels autour de la boîte ; le bâton de la frappe voisine, coupé à cette limite, laissait un morceau dont le centre tombait dans la boîte de l'armé, gardé comme figure. Corrigé par un `mask` (et un second pour deux grains de l'armé dans la case de la frappe). Contrôle : dans chaque case, plus aucune pièce détachée sauf l'arme posée au sol du K.O. à genoux.
- Ambrose, la planche D : son ralliement (la lanterne levée) dessiné de face dans les deux variantes. Repris trois fois : de profil mais plus mince (la tête 18 % plus petite) ; aux bonnes proportions, la planche D jointe en référence, mais avec une seconde lanterne copiée de la ceinture ; enfin une seule lanterne, la ceinture vide (« his belt is EMPTY here »). Un premier repère du haut de la capuche tombait sur la manche levée (617 pixels au lieu de 542) : la hauteur se lit sur l'image avant de régler un pas.
- Mon propre outil : une référence passée en chemin relatif se résout dans le dossier de `--root` (refusée avant l'envoi, rien facturé) ; un injecteur de fautes par `sed -i` a cumulé les fautes et converti le fichier en LF (restauré depuis sa copie, refait en Node, une faute à la fois).

### Coûts (registre de `gen-image.mjs`, plafond 5 $ par combattant)
| Combattant | Requêtes | OpenAI | MiniMax | Total |
|---|---|---|---|---|
| Aldric | 8 (dont un 429 non facturé) | 2,44 $ | 0,014 $ | 2,45 $ |
| Corra | 8 | 2,08 $ | 0,028 $ | 2,11 $ |
| Ambrose | 12 (dont trois reprises du ralliement) | 3,77 $ | 0,021 $ | 3,79 $ |

Après la critique, une planche de reprise par combattant (0,41 à 0,42 $) ; les totaux ci-dessus la comptent.

### Tests — [OK]
- `tests/gen-image.test.mjs` : trois tests MiniMax (la clé par son nom, les refus de l'API, la requête et sa référence en URL de données, les octets JPEG gardés, le coût aux images comptées, un statut ≠ 0 ou une erreur HTTP à 0 $, le plafond, l'archivage d'un `.jpg`) ; neuf fautes injectées une à une, toutes attrapées (une manquée d'abord : le refus d'un côté non multiple de 8, le cas de test était aussi non multiple de 4 ; corrigé).
- `npm test` **445 sur 445**, `npm run typecheck`, `npm run art:validate` (67 manifestes, 100 sources archivées, 0 erreur). La règle de `tests/sheet-clean.test.mjs` passée sur les six feuilles candidates (alpha binaire, anneau transparent, aucun bord droit) ; `build-character --check` et `build-combat --check` : les six reconstruites à l'identique sur l'état final.
- Environnement : ce worktree n'a pas de `node_modules` ; `tests/arena-day.test.mjs` échouait au chargement de `three` par le chargeur SSR. Une jonction `node_modules/three` vers le dossier principal (dossier ignoré, à défaire en fin de tâche) : 4 sur 4.

### La critique à l'aveugle — puis les reprises
- Un agent neuf, à froid : les figures d'origine, les feuilles de ville à côté du casting, chaque image de combat sur fond de nuit et de jour, le duel la nuit et à midi.

| | Ville : propreté / fidélité / place | Combat : propreté / fidélité / proportions / poses | Nuit / midi | Verdict |
|---|---|---|---|---|
| Aldric | 8 / 7 / 8 | 8 / 7 / 7 / 7 | 8 / 7 | avec petites corrections |
| Corra | 6 / 7 / 6 | 7 / 8 / 9 / 6 | 9 / 9 | avec petites corrections |
| Ambrose | 6 / 7 / 8 | 8 / 6 / 5 / 7 | 5 / 9 | à reprendre, de façon ciblée |

- Vérifié sur les pixels avant de corriger, puis corrigé :
  - Aldric : une « bouche » ouverte dans la visière fermée sur la frappe et le coup reçu ; le coup reçu lu comme un coup de pied ; la prière dessinée de face. Planche de reprise `aldric-combat-x3-2026-11-07-e` (pas réglé sur la hauteur des figures remplacées).
  - Corra et Ambrose : le bâton devenu une canne courte (étourdi, K.O.) ; pour Corra une bande noire sous elle à terre ; pour Ambrose sa lanterne absente de l'esquive. Planches de reprise `corra-…-d` et `ambrose-…-f` (« its FULL length … NOT a short cane », la planche A du personnage jointe comme référence de proportions).
  - Ambrose : la tête qui changeait de taille dans le ralliement ; les pas des planches D et F réglés à l'œil sur une bande à même échelle (D 340 → 365, F 367 → 345). [KO] Une mesure automatique de la largeur de la capuche ne valait rien : elle comptait la cape et l'or du bâton selon la pose.
  - Ambrose, la ville : les bords de sa cape coupés du corps, parce que la reconstruction prenait son violet sombre pour le fond (seuil 26 de `reconstruct-grid`). **`rigs/lib/clear.mjs`** : un `bgThreshold` par rig, absent = rien ne change ; 14 pour Ambrose. Les quinze feuilles de ville approuvées du casting reconstruites à l'identique, l'empreinte mise à jour dans leurs paquets avec une note de maintenance. Sa palette ayant changé, sa feuille de combat épingle la nouvelle.
- Restent, sur la fiche comme réserves : de face, le plumet d'Aldric plus petit que de profil ; son tabard en rayures de profil ; à sa victoire, le bras cache la visière ; la face de Corra en ville (liseré en pointillés, col brouillé, queue de cheval peu visible) et sa palette proche d'Ilse (sa figure) ; sa charge d'épaule lue comme un élan ; Ambrose sombre la nuit ; sa victoire qui lève la lanterne (ma consigne, à confirmer). Les reprises n'ont pas repassé de critique.

### Trois combattants de plus — la demande de l'opérateur
- L'opérateur, mot pour mot, en cours de tâche : « peut etre peux tu en proposer 2-3 autres pour alimenter davantage nos combats hors competitions ».
- Sur les planches de tournoi a et b (`tournament-roster-casting-2026-10-18-a/-b`), huit combattants : Vessa est le n° 11 ; la combattante rousse, le barbare, la hache et le gladiateur ressemblent à Orla ou à Rhosk, le mage à Ambrose, l'archère se bat à l'arc. Trois restent distincts, proposés sur la fiche avec un nom, un lieu, une heure et un profil (tout « proposé ») : le maître d'épée roux n° 08 (« Lucan Rook », le parvis le soir, le profil de Marek) ; le champion à la lance n° 09 (« Piers Calloway », le quai le jour, le profil de Vessa ; sa lance depuis le texte ; ses cheveux bleus rappellent Cassius) ; le combattant à mains nues n° 14 (« Kell Barrow », la place de la halle le matin, le profil de Tobin). Rien n'est fait pour eux avant la fiche.

### La fiche — publiée, rien de décidé
- Page privée https://claude.ai/artifact/3pJeAdQR47NMaYcpecztgu (source `briefs/fiche-generiques.html`, la page de la fiche de combat du lot 1), 28 images publiées avec la page (pas dans le dépôt). Douze cartes, chacune avec sa recommandation : GA-AL1 / GA-AL2, GA-CO1 / GA-CO2, GA-AM1 / GA-AM2 (chaque feuille, « Production ») ; GA-P1 à GA-P3 (les trois propositions, « Oui, ainsi ») ; GA-P4 (« Une tâche à part, après celle-ci ») ; GA-S1 (« Les six ensemble ») ; GA-S2 (MiniMax « Le garder, à ma demande »). Collection `decisions` relue vide à la publication. Vérifiée en local avant : 12 cartes, 36 animations, toutes les images chargées, aucun débordement à 1 200 ni à 375 px.

### Où reprendre
- Relire `decisions` quand l'opérateur dit la fiche remplie, consigner mot pour mot ; passer en production ce qu'il approuve (manifestes, `src/characters/PlazaCast.ts` pour les visages, `src/arena/CombatCast.ts` pour les duels, le profil du générique sur la page DEV de l'arène), les preuves (le jeu par défaut à 0 px sur les paquets, `challenge-flow` sous chaque feuille, `arena-sheet-proof`), `AGENTS.md`, puis la fusion.

### Pensée
- Un fournisseur qui ne prend qu'une image de référence ne peut pas redessiner une figure dans le style d'une série : l'outil l'accepte, l'essai coûte quelques centimes, l'image montrée à l'opérateur décide plus vite qu'une argumentation.
- Une limite de traitement (l'étiquetage borné autour d'une boîte) fabrique des pièces que la règle du centre garde : un objet fin qui sort de cette zone se coupe en morceaux, chacun jugé à part.
- Une planche de référence d'un même personnage transmet aussi ce qu'on ne veut pas (la lanterne à la ceinture) : le prompt dit ce qui doit manquer.

## Passe GA2 — La fiche des génériques relue : les six feuilles en production derrière la version 2, MiniMax retiré de l'outil, trois combattants de plus retenus pour une tâche à part (2026-11-07)

### Demande
- L'opérateur, mot pour mot : « Fiche remplie ». Relire `decisions` (https://claude.ai/artifact/3pJeAdQR47NMaYcpecztgu, source `briefs/fiche-generiques.html`), consigner mot pour mot, passer en production ce qu'il approuve, refaire les preuves, fusionner.

### Les choix de l'opérateur, mot pour mot (douze sur douze, cliqués le 2026-11-07 entre 21 h 45 et 21 h 47 UTC, aucune note)
| Carte | Ce qu'elle demandait | Choix |
|---|---|---|
| GA-AL1 | Aldric, la feuille de ville | « Production » |
| GA-AL2 | Aldric, la feuille de combat ×3 | « Production » |
| GA-CO1 | Corra, la feuille de ville | « Production » |
| GA-CO2 | Corra, la feuille de combat ×3 | « Production » |
| GA-AM1 | Ambrose, la feuille de ville | « Production » |
| GA-AM2 | Ambrose, la feuille de combat ×3 | « Production » |
| GA-P1 | Le maître d'épée roux (planche de tournoi a, n° 08), « Lucan Rook » | « Oui, ainsi » |
| GA-P2 | Le champion à la lance (n° 09), « Piers Calloway » | « Oui, ainsi » |
| GA-P3 | Le combattant à mains nues (n° 14), « Kell Barrow » | « Oui, ainsi » |
| GA-P4 | Quand les faire | « Une tâche à part, après celle-ci » |
| GA-S1 | Le branchement | « Les six ensemble » |
| GA-S2 | MiniMax dans l'outil de génération | « Le retirer de l’outil » |

- Onze choix suivent la recommandation de leur carte ; GA-S2 non (recommandé : « Le garder, à ma demande »). Sans note sur GA-AM2, la victoire d'Ambrose qui lève sa lanterne reste comme elle est.
- GA-P1 à GA-P3 retiennent les trois combattants proposés tels quels (noms, lieux, heures, profils) ; GA-P4 les renvoie à une tâche à part, après la fusion de celle-ci.

### Fait — [OK]
1. **Les six feuilles approuvées** : manifestes `approved: true`, `runtimeUse: production`, la carte de chacune et GA-S1 cités ; paquets de provenance à jour (`approvals`) ; les dix-huit sources archivées (trois planches propres, quinze planches de poses) passent « approuvées à travers leurs feuilles ».
2. **Branchées derrière la version 2** :
   - `src/arena/CombatCast.ts` : `aldric`, `corra`, `ambrose` dans ses quatre motifs ; un défi ou la représaille les montre sur leur feuille, sur les clips du rival qu'ils empruntent ;
   - `src/characters/PlazaCast.ts` : `GENERIC_FACES`, leurs visages dans les portraits d'une partie de la version 2 (dialogues, HUD du duel), sans place sur une place ;
   - `src/arena/v2Arena.ts` : sur la page DEV `?scene=arena&v2=1&foe=<générique>`, le duel prend le profil, le nom et les modificateurs du générique, comme un défi (`challengeSheetFor`) ; compilé hors des paquets de production (`ArenaApp` identique) ;
   - `src/narrative/generics.ts` : le commentaire et le champ `figure` d'Aldric (il disait le panneau 1 de G1).
3. **MiniMax retiré** (GA-S2) : `tools/art-lab/gen-image.mjs` revient à la version de `main`, plus `--root` (le dossier d'un autre checkout, sa clé et son registre ; un worktree n'a pas de `.env.local`), avec son test ; les trois tests MiniMax retirés. `AGENTS.md`, règle « Image generation » : le choix cité, la clé MiniMax inutilisée.
4. **`tools/challenge-flow.mjs`** : un défi à un générique (`[who]` : `aldric` au terrain d'entraînement le matin, `ambrose` à la place de la halle l'après-midi ; `orla` par défaut), et deux contrôles de plus : la feuille portée par chaque combattant dans l'arène, le visage de l'adversaire dans le dialogue ; il affiche l'issue du combat.
5. `AGENTS.md` (« Art production principle »), `art-lab/characters/README.md`, `art-lab/characters/reference/README.md`.

### Tests — [OK]
- `tests/combat-cast.test.mjs` : les trois génériques, leurs clips contre le kit du rival emprunté (oracle écrit dans le test, vérifié contre `generics.ts`), la palette de leur feuille de ville, leurs paquets et leurs sources, leurs visages dans `PlazaCast` ; `tests/baked-cast.test.mjs` et `tests/stride.test.mjs` tiennent leurs feuilles de ville hors du quartier et des marches ; `tests/sheet-clean.test.mjs` mesure désormais les six (toute feuille de production) ; `tests/gen-image.test.mjs` : `--root`.
- Trois fautes injectées une à une, toutes attrapées : Ambrose retiré du motif de `CombatCast`, de `GENERIC_FACES`, le profil de Corra changé.
- `npm test` **443 sur 443** (les trois tests MiniMax retirés, celui de `--root` ajouté), `npm run typecheck`, `npm run build`, `npm run art:validate` (67 manifestes, 103 sources archivées, 0 erreur).

### Preuves — [OK]
- Serveurs par `preview_start` : la branche en DEV `:5261`, `main` figé (`git archive` de `268a813`) en DEV `:5262`, les deux paquets de production par `vite preview` `:5263` et `:5264`.
- **`challenge-flow`** (DEV) : Orla gagné et perdu (`7e5600a80a3dda83`, `bb1069b5eb44a634`, les empreintes des Passes EVL3 / EVL4), Aldric gagné et perdu (`60c02df07d2fee40`, `2b20179655e2a8f3`), Ambrose gagné et perdu (`a6fd97d124842b0c`, `78731c550e1ffb39`), la représaille de Corra gagnée et perdue (`c4ab63c95721a5ca`, `c1771019027425a0`) : tous les contrôles passent, chaque adversaire sur sa feuille de production, son visage dans le dialogue, Node rejoue à la même empreinte. **Contrôle négatif** : le défi à Aldric sur `main` figé échoue (aucun visage, aucune feuille). [?] La représaille perdue donnait `d274e9a3eca3c933` en Passe EVL4 ; elle donne `c1771019027425a0` sur la branche comme sur `main` figé, avec la même issue (`finisher: heavy`) : l'écart n'est pas de cette branche, non expliqué.
- **`arena-sheet-proof`** (DEV, `foe=<générique>`) : les trois, la nuit (60 s) et à midi (20 s) : 0 image hors feuille, les visages cuits 32 × 32 dans le HUD ; Aldric 25 de ses 32 images vues, Corra 24 de 29, Ambrose 27 de 34. Contrôle négatif `--q=cast=generated` : code de sortie 1, 2 464 images hors feuille.
- **Le jeu par défaut, inchangé** : `detshots` à 0 px au seuil 0 contre `main` figé sur sept vues (la ville de nuit et à midi ; le mode jouable par défaut à l'ouverture, avec la liste Q et Mara ; la ville d'une partie v2 à l'ouverture et avec la liste Q), témoin de répétition à 0 px, contrôle négatif (nuit contre midi) 97 % ; l'arène par défaut et le duel v2 contre Marek, trois moments chacun, à 0 px (`HOLD=1 FREEZE_CSS=1`). **Les paquets de production** : 0 px sur sept vues (la ville, le mode jouable par défaut et v2 avec la liste, l'arène et le duel v2, calme et K.O.) ; l'entrée garde sa taille (220 044 octets), `ArenaApp` identique ; changent `CombatCast`, `PlazaCast`, les trois feuilles et quelques octets de morceaux qui en nomment d'autres (`save` : le champ `figure` d'Aldric).
- `play-flow` sur le paquet de production : par défaut `0025acce7a403773`, `V2=1` `cf669f2d59e33a8d` (avec Vessa sur sa feuille) ; `play-day` (DEV) : par défaut `6a942086a2616ab2`, `V2=1` `98f385cda8abd0e9` : les empreintes des Passes EVL1 à EVL4.
- `ui-text` : les dialogues d'Aldric (le terrain d'entraînement le matin), d'Ambrose (la place de la halle l'après-midi) et de Corra (le quai le soir), chacun à 1 600 × 900 et 390 × 844 : six pages sur six, 16 px et 14 px au plus petit.
- Vu sur les captures de `challenge-flow` : les trois visages dans leurs dialogues, celui d'Aldric dans le HUD du duel. L'outil photographie encore le fondu de l'écran de chargement sur deux captures (son comportement sur `main` aussi), sans effet sur ses contrôles.

### La fusion
- La branche `claude/generiques-art` (Passes GA1, GA2) est fusionnée en avance rapide dans `main` ; `main` est poussé, la branche supprimée, locale et distante.

### Ce qui suit
- **Les trois combattants de plus** (GA-P1 à GA-P4) : une tâche à part, après celle-ci : leurs feuilles (la recette de GA1 : planche propre, planches de poses, au plus 5 $ chacun), leur place dans le jeu derrière la version 2 (`generics.ts`, les personnes, lieu et heure), leur fiche de lot.

### Pensée
- Une décision qui retire un outil se fait en revenant à la version d'avant, plus ce que la tâche a appris d'utile ailleurs (`--root`) : on ne laisse pas de code mort derrière une option que l'opérateur a refusée.
- Une empreinte écrite au journal se rejoue sur la base figée avant d'accuser la branche : ici, `main` figé ne la retrouve pas non plus.

