# Journal de bord — archive : passes LC7, LC8 (2026-11-13)

> Déplacée mot pour mot de `JOURNAL.md` le 2026-11-13 (Passe CO3) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe LC7 — La fiche d'écoute du lot 4 relue, huit sur huit à la recommandation ; le signe de la forme du jour branché ; la jauge de rupture prouvée au coup même, image par image dans le navigateur (2026-11-12)

### Ce que l'opérateur a dit
- Sur la fiche d'écoute https://claude.ai/artifact/4brjscrgkqpYEvxnU8kz8f, dans la conversation, mot pour mot : « la fiche est deja remplie ».
- Relayé par la séance de l'audit final (ses mots du 12/11, cités par elle) : « je veux qu'on se focalise sur le gameplay combat encore car cest le but de cette tache apparemment on a la jauge de break qui semble avoir du retard lors des actions/coups executes surtout lorsqu'il y a des combos » ; puis, à la question de cette séance « Fusionner la correction de la jauge dès qu'elle est prouvée, avant le reste du lot 4 ? » : « Oui, d'abord la jauge ». Sur les deux séances qui faisaient le lot 4 : « La première » (celle-ci ; l'autre, `local_0c1b66f3`, arrêtée sans rien commiter ni pousser).

### La fiche relue
- `ArtifactData list decisions` : huit documents, cliqués le 12/11/2026 de 21:05:35 à 21:05:56 UTC, aucune note. Tous à la recommandation ; aucun n'est une décision A3 :

| Carte | Sujet | Choix |
|---|---|---|
| LC6-1 | Le duel, aujourd'hui et avec le lot 4 | « Bien ainsi » |
| LC6-2 | La charge de Ren | « Bien ainsi » |
| LC6-3 | Les coups d'un enchaînement | « Bien ainsi » |
| LC6-4 | La garde, l'esquive, la rupture et le K.O. | « Bien ainsi » |
| LC6-5 | Les couches de la musique (règle F) | « Bien ainsi » |
| LC6-6 | ×2 et « Passer » | « Bien ainsi » |
| LC6-7 | La forme du jour au début du combat | « Les deux signes » |
| LC6-8 | Ce qui vient après | « Brancher ce que je valide, puis mon essai en jeu » |

- Conséquences : ce que la Passe LC6 a branché reste tel quel ; le signe de la forme du jour, bonne et basse forme, entre dans le jeu par défaut, calculé dans la page (aucun fichier cuit) ; puis l'essai en jeu de l'opérateur.

### Le signe de la forme du jour, branché — [OK]
- La relecture dit le signe une fois par combattant au début du combat (`formSign`, `FORM_AT` : Ren à 0,35 s, l'adversaire à 0,75 s ; `formSignOf` : à ×1,05 et plus « up », à ×0,95 et moins « down », rien entre) ; « Passer » et un moment cherché le passent sans le dire. Le moteur calcule ses deux notes une fois (`src/audio/formCue.ts`, gardées dans `madeBufs`) et les joue comme un son du duel, du côté du combattant (`Sound.formSign`) ; les effets dessinent `FORM_RECIPES` (`src/arena/fx/fxRecipes.ts`, à part de la table des recettes : leur son n'est pas un son cuit du groupe), l'or de Ren ou le rouge de forge du rival en bonne forme, les particules grises qui tombent en forme basse. Les candidats de la Passe LC6 (`src/arena/fx/fxCandidates.ts`, `__fx.candidate`) sont retirés ; `__fx.form(sign, who)` dessine le signe en développement.
- Aucun octet cuit : le plafond SA-17 inchangé.

### La jauge de rupture au coup même — [OK] prouvée dans le navigateur
- **État** : la correction était déjà fusionnée dans `main` par la Passe LC6 (dans le commit `486cd7f`, avec le branchement du son, puis `31b7943`), avant la demande de la fusionner seule ; la séparer de ce commit demanderait de réécrire l'historique de `main` (un push forcé, qui revient à l'opérateur) : rien de tel n'est fait. Le dossier principal est à ce `main` depuis la Passe LC6 : l'opérateur peut déjà l'essayer.
- **La cause** (relevée en Passe LC5, confirmée par la séance de l'audit sur `7dec3fe`) : `hitOnce` écrit la ligne d'un coup et sa trace avant que le coup remplisse la jauge ; le HUD n'a aucune transition sur la barre (`.ah-rb i`) ; dans un enchaînement, chaque coup montrait donc le remplissage du coup d'avant.
- **La correction** (côté affichage, Passe LC6) : la relecture fait le remplissage à la ligne du coup avec la formule du duel ; la simulation, son script, les résultats et les empreintes ne changent pas (la correction à la racine, proposée par la séance de l'audit, aurait déplacé la ligne de la rupture avant celle de son coup et cassé la preuve du portage contre le prototype, événement pour événement, à moins de réécrire la trace après coup : non fait).
- **Node, renforcé** (`tests/auto-arena.test.mjs`, « the gauge at the blow ») : 21 duels (les sept rivaux sur deux graines, plus sept duels où Ren porte le sabre du duelliste et Tourbillon, avec Cri de guerre et Peau de fer) ; à chaque coup, la jauge que disent l'impact et le HUD contre celle du duel (la trace de la ligne suivante, décroissance défaite) ; compté par sorte : 5 084 coups vérifiés, dont 1 585 qui étaient montrés une ligne en retard et 38 qui rompent ; 2 575 coups suivants d'un enchaînement, 911 derniers d'un enchaînement de deux, 786 derniers d'un enchaînement de trois, 1 137 sur une protection, 856 sous un soutien. **Six fautes injectées** dans le remplissage : le remplissage retiré (le retard d'avant), la garde ×2 oubliée, la protection de la cible oubliée, le soutien de l'attaquant oublié, l'Endurance de la cible ignorée — **cinq attrapées** ; la sixième (chaque coup d'un enchaînement avec la part du premier) ne change rien d'observable : tous les coups d'un enchaînement ont la même part dans les tables.
- **Navigateur, image par image** (`tools/gauge-proof.mjs`, nouveau ; serveur DEV, la boucle tenue, l'arène avancée à 60 images/s par sa propre mise à jour ; DEV `weapon=` et `kit=` sur la page de l'arène pour les enchaînements de trois coups de Ren) : à chaque image, la barre de chaque carte telle que la page la met en page, contre la jauge du script au temps de l'arène ; et chaque coup qui doit bouger la barre (de deux pour cent au moins) la bouge sur sa propre image. Sur huit duels entiers (Marek, Vessa, Orla, Rhosk, Ren à l'épée d'entraînement, puis les mêmes avec le sabre du duelliste et Tourbillon ; 77 424 images) : **aucune image où une barre s'écarte de plus d'un pour cent de la jauge du script** (l'écart le plus grand 1,0, l'arrondi de la barre) ; **325 coups sur 325** qui doivent bouger une barre la bougent sur leur propre image, dont 90 coups suivants d'un enchaînement, 57 derniers de deux, 17 derniers de trois, 80 sur une protection, 75 sous un soutien (1 633 coups en tout ; les autres ne bougent pas la barre de deux pour cent, l'arrondi). Aucune erreur de page. **Contrôle négatif** sur `main` figé `7dec3fe` (serveur `lot4-frozen-main`, port 5435) : **l'outil échoue**, comme il le doit : Marek, Vessa, Orla, 266 images où une barre s'écarte de plus d'un pour cent (jusqu'à 42 points), 20 coups sur 129 dont la barre ne bouge pas sur leur image (le premier coup de Taille éclair à 5,01 s : la barre à 0 quand le script dit 19 %).

### Les preuves — [OK]
- `tests/auto-sound.test.mjs` : le test du candidat réécrit (le signe dit une fois par combattant à son heure contre les formes du duel, rien sous « Passer » ni après un moment cherché, ses notes, ses recettes, son branchement) ; `tests/auto-arena.test.mjs` (la jauge par sorte de coups).
- `tools/audio/engine-proof.mjs` : deux contrôles neufs (`lc-form`) : le signe de bonne forme du côté de Ren (−23,4 dB à gauche, −27,4 à droite), celui de forme basse du côté de l'adversaire et plus doux (−26,5 dB à droite) : **tout passe** ; les six contrôles anciens de la musique échouent toujours, sur `main` figé aussi (Passe LC6 ; la tâche suit dans cette séance). `tools/audio/hooks-proof.mjs` : le duel repris du début, deux signes dits et leurs notes calculées (`form:formUp`) : **tout passe** (28 contrôles).
- `npm run typecheck` ; `npm run build` (le signe dans le paquet de l'arène, plus aucun candidat) ; `npm run art:validate` (73 manifestes, 123 sources, 23 du son, 0 erreur) ; `npm test` **653 / 653** (le test du candidat remplacé, celui de la jauge étendu).

### Validation
- Modifiés : `src/arena/autoView.ts` (`formSign`, `formSignOf`, `FORM_AT` ; DEV l'arme et les quatre compétences de la page de l'arène), `src/arena/ArenaApp.ts` (DEV `weapon=`, `kit=`), `src/arena/fx/fxRecipes.ts` (`FORM_RECIPES`, `formRecipe`), `src/arena/fx/combatFx.ts` (le signe, `__fx.form`), `src/audio/Sound.ts` (`formSign`), `src/audio/formCue.ts` (son statut) ; retiré : `src/arena/fx/fxCandidates.ts` ; `tests/auto-sound.test.mjs`, `tests/auto-arena.test.mjs` ; `tools/gauge-proof.mjs` (nouveau), `tools/audio/hooks-proof.mjs`, `engine-proof.mjs`, `engine-jobs.mjs`, `engine-jobs.page.js` ; `briefs/combat-auto.md` (statut, § 24) ; `AGENTS.md` ; ce journal.
- Aucune règle, table, temps de charge ni course changés ; le jeu d'aujourd'hui (`v2=0`) reste muet ; `?duel=charge` inchangé.

### Où reprendre
- L'essai en jeu de l'opérateur (LC6-8) : la jauge, le son et les effets des nouveaux moments, le signe de la forme du jour.
- Dans cette séance, à sa demande (« Do this task here ») : les six contrôles de musique de `tools/audio/engine-proof.mjs` qui échouent aussi sur `main`.
- Ensuite le lot 5, le retrait de l'ancien duel.

### Pensée
- Une correction se prouve là où le défaut se voyait : la barre telle que la page la met en page, image par image, contre le script, avec la base d'avant qui échoue ; une preuve dans Node ne voit ni la mise en page ni l'image où le changement tombe.
- Une barre arrondie au pour cent cache les petits coups : on prouve chaque image à l'arrondi près, et la coïncidence de l'image du coup et de l'image du changement sur les coups assez forts pour bouger la barre.
- Une demande qui arrive après la fusion se dit telle quelle : séparer après coup un commit déjà sur `main` est une réécriture d'historique, qui revient à l'opérateur.

## Passe LC8 — `tools/audio/engine-proof.mjs` : les six contrôles de la musique de l'arène qui échouaient sur `main` ; la cause dans le harnais (la foule de l'arène hors du bus de l'ambiance depuis la Passe RG3), corrigée ; le moteur hors de cause (2026-11-12)

### Demande
- L'opérateur, dans cette séance, sur la carte proposée en Passe LC6 : « Do this task here: “engine-proof : six contrôles de musique en échec” ». Les six contrôles (l'introduction du duel, sa boucle, la séquence de l'adversaire, une séquence finie avant sa barre, les deux jingles du K.O.) échouaient sur la branche du lot 4 comme sur `main` figé `7dec3fe` (Passes LC6, LC7).
- Branche `claude/engine-proof-band` (tirée de `main` `a4e0650`).

### Ce qui a été cherché — [OK]
- **Le décodage, écarté** : `tools/audio/decode-proof.mjs` sous Chrome 157.0.8103.50 : 224 contrôles sur 224, chaque fichier cuit (Opus et AAC) décodé à sa longueur, son début retrouvé, le moteur l'aligne où il faut (« all files aligned »). L'hypothèse de la Passe LC6 (un décodage d'Opus changé par une mise à jour de Chrome) est fausse.
- **Le point commun** : les six contrôles lisent tous la musique d'une scène d'arène (`stem: 'music'`) ; ceux d'un autre lieu (la fanfare sur le matin de la ville, la valse) passaient. Le « 21,56 % inexpliqué » de l'introduction tombait au bon décalage (0) : un son en plus, pas un son déplacé.
- **La cause** : depuis la Passe RG3 (le 09/11, le lot 1 des réglages, `749b696`), la foule de l'arène passe par son propre bus, `crowdBus`, branché sur la baisse de l'ambiance et non sur le bus de l'ambiance ; le harnais des rendus (`tools/audio/harness.js`) coupait les bus autres que la musique pour `stem: 'music'`, mais pas celui-là : le murmure de la foule restait dans « la musique » de chaque scène d'arène. La dernière exécution verte d'`engine-proof` date de la Passe SN22 (le 04/11), avant RG3. C'est la même fuite que la Passe LC6 avait vue sur son propre contrôle de « Passer » (refait sur les gradins vides).
- **La correction**, dans le harnais seul : pour `stem: 'music'`, `crowdBus` est coupé avec les autres bus. Le moteur ne change pas (la foule sur la baisse de l'ambiance est voulue par RG-6).

### Les preuves — [OK]
- `tools/audio/engine-proof.mjs` sur la branche : **37 contrôles sur 37** (« all checks passed ») : l'introduction du duel (0,00 % inexpliqué, décalage 0), sa boucle (0,793 / 0,793 / la tension au repos 0,278, 0,00 %), la séquence de l'adversaire à mi-mesure puis une mesure plus tard (la mélodie à 0,45, la tension à 1,00), son retour au calme, une séquence finie avant sa barre (les couches tiennent), les deux jingles (0,01 % et 0,00 %), et les contrôles des Passes LC6 et LC7.
- **Contrôle négatif** : l'ancien harnais sur le même moteur : les six échouent (Passe LC7) ; le harnais corrigé sur `main` figé `7dec3fe` (`--root`) : les six passent aussi, seuls échouent les cinq contrôles des Passes LC6 et LC7 (le clic de ×2, le bouton, les deux signes de la forme, « Passer ») : le moteur de `7dec3fe` jouait juste, seul le harnais mesurait la foule avec la musique.

### Relevé — [?]
- Les autres outils qui rendent une arène avec `stem: 'music'` (huit tâches, `layer-jobs`, `mix-jobs`, `render.mjs` `mus-arena-*`) ont mesuré la foule avec la musique s'ils ont tourné entre le 09/11 et aujourd'hui ; aucun n'y a de cible (les cibles de `analyse.mjs --check` lisent les mélanges des lieux et les duels entiers, qui contiennent la foule par dessein). Non relancés ici.

### Validation
- Modifié : `tools/audio/harness.js` ; ce journal. Rien sous `src/`. Après la fusion, `AGENTS.md` : la description de `tests/auto-sound.test.mjs` disait encore le signe de la forme « branché nulle part » (le texte de la Passe LC6) ; elle dit le signe branché depuis la Passe LC7.
- Archivage : avec LC8, les passes gardées auraient dépassé 60 Ko ; LC4 (branche fusionnée) déplacée à l'octet dans `journal/99-passes-LC4.md`, sa ligne ajoutée à l'index et la phrase d'en-tête complétée ; preuve par script : le corps de l'archive égale les 11687 octets retirés (SHA-256 `3c53c168b8c2c275…`), LC4 hors de `JOURNAL.md`, LC5 à LC8 identiques à l'octet, chaque titre de passe dans un seul fichier, CRLF seuls.

### Pensée
- Quand une preuve échoue aussi sur la base figée, on cherche ce qui a changé autour d'elle depuis sa dernière exécution verte : ici un bus neuf du moteur que le harnais ne connaissait pas.
- Un « inexpliqué » au bon décalage dit qu'un son s'ajoute, pas qu'il est déplacé : chercher ce qui entre dans le bus mesuré.

