# Journal de bord — archive : passes EVL7, EVL8 (2026-11-07 → 2026-11-08)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-11-08 (Passe PR2) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe EVL7 — Le lot L4 de l'étape 5 : les ambiances hors des nouvelles, chaque rival se souvient, Vessa et Rhosk agissent, un ami avertit, les suites des actions et des lieux ; la fiche de lot publiée (2026-11-07 → 2026-11-08)

### Demande
- Transmise par la séance mère (`local_6617afa0-…`) : construire le lot L4 de l'étape 5 derrière `flags.v2`, le jeu par défaut inchangé, d'après les choix de l'opérateur sur la fiche EV1 (Passe EV2) : EV-7 « Les suites des actions, puis un par lieu, puis le ciblé », avec sa note mot pour mot « il faut que cela puisse impacter la preparation du joueur en jouant sur cet aspect imprevisible » ; EV-8 « Hors des nouvelles, dans les répliques et le son » ; EV-9 « Chaque rival se souvient ; deux autres agissent » (sa carte : « un rival aidé peut avertir d'un sabotage », « Vessa l'espionnage et la désinformation, Rhosk l'intimidation : à relire »). Et L3-11 « Les garder pour L4 » : le sergent Hale, Corra Dunmere, Frère Ambrose.
- Lu d'abord : `JOURNAL.md` en entier (Passes EVL5, EVL6), `briefs/audit-gameplay-ev1.md` (§§ 1-3, 10), `briefs/fiche-ev1.html` (EV-7 à EV-9), `AGENTS.md`. Branche `claude/l4-rivalites`.
- Interrompue une fois par la limite d'usage (commit `6c1a1c1`, cette passe « en cours ») ; reprise sur la demande de la séance mère (« Try again » de l'opérateur).

### Fait — [OK], derrière la version 2 (`src/simulation/v2rivals.ts`, neuf)
1. **EV-8, les ambiances hors des nouvelles** : `night-market`, `colosseum-roar` et `v2-puppet-show` portent `v2quiet` ; dans une partie v2 ils partent et bougent le pouls comme avant, mais s'écrivent cachés (`visible: false`, `src/events/engine.ts`) : ni nouvelles, ni bandes, ni journal (J). Les gens les disent, un texte par jour et selon l'état : Pip le soir (le marché, trois textes), Wren après un combat du joueur, aujourd'hui ou hier (les marionnettes, gagné ou perdu, l'adversaire nommé, deux textes chacun), le sergent Brann les après-midi des combats des autres (la clameur) ; les passants du quai la disaient déjà. Le son ne change pas : les clameurs des jours de combat (`score.ts`) portent déjà le Colisée, et S5-RECEPTION fait de toute suite une demande à part. Le jeu par défaut garde ses nouvelles.
2. **EV-9, chaque rival se souvient** : `stanceOf` (une rancune à −15 ou moins, une amitié à 25 ou plus, le respect d'un honorable ou d'un froid battu par le joueur), `memoryOf` (les combats, les défis, regardé à l'entraînement pour un fier, la première victoire et la moquerie pour Cassius, la cargaison, l'entraînement et le recrutement pour Orla, le rapport pour Rhosk, la confrontation pour Vessa) ; la page du tournoi (T) le dit (« Vessa Lark holds a grudge: beaten by you on day 2. ») ; un fait neuf en v2, `humbled-by:player:<jour>`, quand le joueur gagne avec plus de 70 % de sa vie (« barely touched »). Les répliques s'ajoutent là où l'arc ne disait rien : Ilse et Tobin (respect, amitié), Rhosk (respect), Marek (amitié).
3. **EV-9, Vessa, la désinformation** (`vessaTalks`, `confrontVessa`) : battue par le joueur et rancunière, les soirs des jours 2 et 4 elle paie la salle de Lio pour dire que le prochain adversaire est blessé et rouillé (`V2State.lie`) ; les nouvelles du lendemain matin le disent sans la nommer (« In the taverns they say… ») ; Lio le répète jusqu'au combat, à chaque fois ; un conte vrai n'est pas dit. Ce qui la trahit : « paid for every round at Lio's » sur la page du tournoi (un acte public dans le journal caché des rivaux), Frère Ambrose (la place, l'après-midi et le soir), l'inconnu (la vérité, et « A duelist from the river towns paid for it »). La réponse : le lui dire en face sur le parvis, de jour, une fois qu'on sait (réputation +3, la sienne −5, son lien −5) ; le conte meurt et elle n'en dit plus.
4. **EV-9, Rhosk, l'intimidation** (`v2-rhosk-offer`, `sandTaken`, `reportRhosk`) : hors du titre (la Porte) quand le joueur y est, le soir deux jours avant le prochain combat du joueur, Corra Dunmere dit sur le quai qu'il lui a offert de l'argent pour tenir le sable avec lui ; le lendemain (jour 7 ou 9), de jour, s'entraîner et travailler une compétence sont refusés au terrain, la raison dite. Trois réponses : Orla s'entraîne toujours, un défi gagné contre lui, le sergent Hale prévenu sur le quai (un coureur au greffier ; le nom de Rhosk dans son registre).
5. **EV-9, un ami avertit** (`v2-friend-forge`, `v2-friend-gear`) : un rival à 25 ou plus (Orla, puis Ilse, Tobin, Marek) avertit le créneau d'avant chacune des deux chaînes de Cassius, la réponse nommée (la garde de Hale, la chambre forte d'Odo ou Hilde).
6. **EV-7, les suites des actions** : chaque défi gagné, un jour d'écart au plus, Maître Corvin enseigne à un cinquième le lendemain (les hérauts la première fois, comme avant) ; Mara, Hilde, Pip et Corvin disent l'habitué (15 ou plus, « a tenth off », la remise qui existait) et le visage à surveiller (−15 ou moins).
7. **EV-7, un par lieu** : le sable fermé le matin après la rixe des casernes (la promesse de son premier `about`, Passe VP1) ; Sœur Anwen occupée le soir d'un rival blessé (le texte de `rival-injured` le promettait).
8. **Conditions des événements** : `{ boutIn: n }` (le prochain combat dans exactement n jours), `{ status: [id, phases] }`.
9. **Le joueur curieux** : il prévient Hale dès le signe de Rhosk, et prend l'avertissement d'un ami pour un signe de sa chaîne. Le diligent ne change pas.
10. **États nommés** (DEV) : `v2-tale-day3` (graine 1842), `v2-sand-day9` et `v2-sand-training` (graine 6 : Rhosk à la Porte) ; un état peut porter sa graine, prise sauf si l'adresse en donne une (`src/ui/play.ts`).
11. **`tools/rivals-flow.mjs`** (neuf) : `tale` et `sand` joués dans le navigateur, rejoués en Node. **Textes** : 73 clés neuves, « proposé ». **`AGENTS.md`** : la version 2, les tests, l'outil.

### Mesures — TournamentLab, contre `main` figé (`11dabb7`)
- **Identiques au JSON près** : les règles classiques et dynamiques, idle et diligent. **L'idle v2** : identique sauf ses empreintes ; avec les ambiances de nouveau racontées (copie hors dépôt), identique au JSON près.

| Combats gagnés · coupe · finale | Graines | main | branche |
|---|---|---|---|
| diligent | 1-50 | 59,6 % · 88 % · 20 % | 59,2 % · 88 % · 20 % |
| diligent | 51-100 | 61,2 % · 94 % · 30 % | identique |
| diligent | 101-150 | 60,8 % · 96 % · 22 % | 60,4 % · 96 % · 22 % |
| curieux | 1-50 | 51,0 % · 74 % · 16 % | 51,4 % · 74 % · 16 % |
| curieux | 51-100 · 101-150 | 53,3 % · 56,6 % | identiques |

- **Décomposition** (copies hors dépôt, une pièce éteinte à la fois) : le diligent, sable de Rhosk éteint, est identique à `main` dans ses résultats et ses événements, sur 150 graines ; avec lui, deux parties perdent le combat qu'elles gagnaient (27 et 122 : le signe la veille, l'entraînement refusé, une action de moins qui décale les tirages qui suivent). Le curieux, ses deux réponses neuves éteintes (le rapport à Hale, l'avertissement pris pour un signe), est identique à `main` ; avec elles, la graine 41 gagne un combat et ses actions en ville bougent de quelques centièmes (marchandages 3,56 → 3,60, défis gagnés 5,02 → 5,08 sur 1-50). La leçon de Corvin seule ne change rien (le curieux n'achète pas de compétence).
- Par 50 parties : contes de Vessa 88 / 96 / 92 (diligent), 90 / 84 / 94 (curieux), deux par partie où Vessa perd contre le joueur ; signe de Rhosk 19 / 16 / 15 (diligent, jamais rapporté), 17 / 10 / 13 (curieux, toujours rapporté avant le jour du sable) ; avertissements d'un ami 4 / 1 / 3 et 1 / 5 / 6.

### Tests — [OK]
- **`tests/v2-rivals.test.mjs`** (neuf, 16 tests), oracles écrits dans le test (les seuils, les jours, les lieux et heures, les mots à dire) : les ambiances cachées en v2 et dites au jeu par défaut, leur pouls, le journal sans elles sur une partie entière ; Pip, Wren et Brann ; les attitudes à chaque seuil et chaque tempérament, les causes sur la page du tournoi, « barely touched », rien au jeu par défaut ; les répliques ajoutées ; les marchands ; le sable après la rixe ; Sœur Anwen ; le conte de Vessa (ses conditions, ses jours, Lio sur 200 tirages, l'inconnu, Ambrose, la confrontation) ; Rhosk (les causes du signe une à une, le sable, Orla, Hale, le défi, le lendemain libre) ; les avertissements (les quatre amis, l'ordre, les bornes de jours et de créneaux, 24 contre 25) ; le curieux ; le jeu par défaut sans rien de tout cela.
- Mis à jour : `tests/v2-events.test.mjs` (la leçon de Corvin), `tests/v2-reading.test.mjs` (le premier après-midi ne dit que le marché de nuit, désormais hors des nouvelles : la boucle prend le premier soir, et le marché caché est vérifié à part), `tests/v2-injury.test.mjs` (le diligent à 0,592, sa cause écrite).
- **Fautes injectées une à une** (script hors dépôt, chaque fichier rendu à l'octet et vérifié par SHA-256) : 29, toutes attrapées. [KO → corrigé] « un ami dès 20 » passait (aucun cas à 24) : le test borne désormais 24 contre 25. « Le curieux ne prévient jamais Hale » passait en ne retirant que le soir : il prévenait le lendemain matin, la faute réécrite (les deux), attrapée.
- `npm test` **476 sur 476**, `npm run typecheck`, `npm run build`, `npm run art:validate` (73 manifestes, 123 sources archivées, 0 erreur ; 23 manifestes de son).

### Preuves — [OK]
- **Serveurs** par `preview_start` (une entrée de `.claude/launch.json` du worktree, non suivi) : la branche en DEV `:5291`, `main` figé (`git archive` de `11dabb7`, dossier `.frozen-main` non suivi) en DEV `:5292`, les deux paquets de production par `vite preview` `:5293` et `:5294`.
- **Le jeu par défaut, inchangé** : `detshots` à l'octet près contre `main` figé, dix-sept vues : la ville de nuit et à midi ; le mode jouable par défaut à l'ouverture, avec la liste Q, Mara, le journal et le tableau ; son premier soir avec la liste ; la ville d'une partie v2 à l'ouverture, avec la liste Q et Mara ; l'arène par défaut et le duel v2, trois moments chacun (`HOLD=1 FREEZE_CSS=1`). Témoin de répétition (un second chargement de la branche) à l'octet près ; contrôles négatifs : nuit contre midi, ouverture contre liste, journal et tableau, arène par défaut contre duel v2, tous différents. [KO → corrigé] Le journal et le tableau, ouverts par une touche simulée, n'ouvraient rien (une fenêtre de nouvelles tenait la touche) : leurs captures égalaient l'ouverture ; refaits par les appels de la page. **Les paquets** : les mêmes vues (sans le premier soir, qui demande un état nommé) à l'octet près, sauf la ville de nuit et à midi : 192 et 77 pixels, tous dans la ligne « FPS / frame ms » du panneau de performance (1 653 à 1 908 × 1 069 à 1 076), une mesure vivante ; la branche diffère d'elle-même au même endroit (165 pixels), comme aux Passes GA4 et EVL5. L'entrée garde sa taille (220 044 octets) ; changent `save` (+12,2 Ko : la simulation), `text` (+7,1 Ko), `board`, `play`, `townUi`.
- **Empreintes** : `play-flow` sur le paquet de production, par défaut `0025acce7a403773` ; `play-day` (DEV), par défaut `6a942086a2616ab2` : celles des Passes EVL1 à EVL6. En version 2 elles changent : `play-flow` `V2=1` `cf669f2d59e33a8d` → `f3974c5eedc75e97`, `play-day` `V2=1` `9f7aa09e947f678b` → `456b834c7af247e4`, rejouées en Node à la même empreinte ; la cause, vérifiée par le laboratoire sur les états nommés du même chemin (`v2-day2-afternoon`, `v2-training-dusk`) : avec les ambiances de nouveau racontées, l'empreinte de `main` revient.
- **Une partie v2 jouée dans le navigateur, rejouée en Node** (`tools/rivals-flow.mjs`, DEV) : `tale` (graine 1842, jour 3) : le mot des tavernes dans le journal et sur sa page, la page du tournoi sur Vessa (« Vessa Lark holds a grudge: beaten by you on day 2. », « paid for every round at Lio's »), les mots de Frère Ambrose et sa nouvelle dans la bande, Vessa confrontée sur le parvis, la page du tournoi après (« … and shamed by you before the forecourt. ») : Node `e8bb3358d168ee17` = navigateur ; `sand` (graine 6, jour 9) : l'entraînement refusé avec sa raison dans la liste Q, les mots de Brann et de Hale, le rapport, l'entraînement fait : Node `476ff339bf0e18aa` = navigateur. [KO → corrigé] Dans une partie v2, la liste Q ne montre que ce qui est ouvert : l'entraînement refusé par Rhosk n'y paraissait pas, la raison n'était lue nulle part ailleurs que chez Brann ; il y paraît désormais refusé, avec sa raison, comme le repos et l'attente (`src/ui/townUi.ts`). L'outil attend la fin du fondu de l'écran de chargement avant ses captures.
- **`ui-text`** : huit pages, chacune à 1 600 × 900 et 390 × 844, seize sur seize : Pip le soir, Wren et les marionnettes, Frère Ambrose, la page du tournoi sur Vessa, le journal du jour 3, la liste Q sur le sable de Rhosk, Brann, Hale ; 16 px et 14 px au plus petit.
- Vu sur les captures (`play-shots`, DEV) : les sept images de la fiche. Relevé hors du lot sur celle de Hale (graine 6) : le matin, il dit encore « If something happens tonight » (sa ligne de garde mince ne lit pas l'heure).
- Environnement : une jonction `node_modules/three` vers le dossier principal (dossier ignoré), à défaire en fin de tâche, comme en GA1 et EVL5.

### La fiche — publiée, rien de décidé
- Page privée https://claude.ai/artifact/Nyf3wvTgKHQXMiNVtBekp3, source `briefs/fiche-l4.html` (la page de la fiche de L3), sept captures publiées avec elle (pas dans le dépôt). La collection `decisions` a été relue vide à la publication. Vérifiée en local avant : quatorze cartes, les sept images chargées, aucun débordement à 375 px.
- Quatorze cartes, chacune avec sa recommandation : L4-1 les ambiances hors des nouvelles (« Garder ») ; L4-2 chaque rival se souvient (« Garder ») ; L4-3 Vessa, la désinformation (« Garder » ; « l'espionnage plutôt » en alternative, la lecture que la carte EV-9 laissait « à relire ») ; L4-4 Rhosk, l'intimidation (« Garder ») ; L4-5 un ami avertit (« Garder ») ; L4-6 aider un autre rival qu'Orla, pas construit (« Laisser ainsi ») ; L4-7 Corvin après un défi gagné (« Garder ») ; L4-8 les marchands se souviennent (« Garder ») ; L4-9 le sable fermé après la rixe (« Garder ») ; L4-10 Sœur Anwen occupée (« Garder ») ; L4-11 Hale, Corra et Ambrose (« Garder ») ; L4-12 le laboratoire, chaque écart nommé (« Accepter ») ; L4-13 ce qui revient à L5 (« L5 ensuite ») ; L4-14 « Fusionner après la fiche, essayer ensuite ».

### Relevés hors du lot
- `sed -i` sous Git Bash a converti `src/events/v2catalog.ts` en LF dans le dossier de travail (l'index le garde en LF : aucun effet sur le dépôt) et mangé une barre oblique inverse ; corrigé par l'outil d'édition.

### Où reprendre
- Relire `decisions` quand l'opérateur dit la fiche remplie, consigner mot pour mot (journal, `briefs/audit-gameplay-ev1.md`), appliquer, refaire les preuves touchées, puis fusionner selon L4-14. La passe qui fusionne dit ce qui revient à L5 (EV-12, la ville qui réagit).

### Pensée
- Une règle qui retire une action au joueur témoin (l'entraînement refusé) change aussi tout ce qui suit par le nombre d'actions : les tirages se décalent. On le décompose en éteignant la règle seule, et l'écart doit retomber à zéro, événements compris.
- Un aide de test qui « rend » un état v2 peut le refaire de zéro : `makeV2` sur un état déjà v2 efface ce que le lot y a écrit ; le test a d'abord accusé le code.
- Une condition qui lit « demain » ne dit pas quand un camp joue : `boutIn` compte les jours jusqu'au prochain combat, et le signe de Rhosk tombe deux jours avant, quel que soit le chemin dans le tableau.

## Passe EVL8 — La fiche de L4 relue : quatorze sur quatorze à la recommandation ; la branche fusionnée (2026-11-08)

### Demande
- L'opérateur, mot pour mot : « Fiche remplie, tes points sont tres interessant et on peut donc ressentir que chaque personnages de la ville a son role a jour comme des agent autonome qui parcours un chemin et une mission a travers le temps cela me fait penser au projet : Smallville : le village où les IA simulent les comportements humains ». Relire `decisions` (https://claude.ai/artifact/Nyf3wvTgKHQXMiNVtBekp3, source `briefs/fiche-l4.html`), consigner mot pour mot, appliquer ce qui change, refaire les preuves touchées, puis fusionner selon L4-14.

### Les choix de l'opérateur, mot pour mot (quatorze sur quatorze, cliqués le 2026-11-08 entre 04 h 00 et 04 h 03 UTC, aucune note)
| Carte | Ce qu'elle demandait | Choix |
|---|---|---|
| L4-1 | Le marché de nuit, la clameur et les marionnettes sortent des nouvelles | « Garder » |
| L4-2 | Chaque rival se souvient, et la page du tournoi le dit | « Garder » |
| L4-3 | Vessa Lark, la désinformation : un conte dans la salle de Lio | « Garder » |
| L4-4 | Rhosk, l'intimidation : le sable du terrain d'entraînement | « Garder » |
| L4-5 | Un ami avertit des deux chaînes de Cassius | « Garder » |
| L4-6 | Aider un autre rival qu'Orla : pas construit | « Laisser ainsi » |
| L4-7 | Le défi qui fait parler : Corvin à un cinquième le lendemain | « Garder » |
| L4-8 | Les marchands se souviennent | « Garder » |
| L4-9 | Le sable fermé le matin après la rixe des casernes | « Garder » |
| L4-10 | Sœur Anwen occupée le soir d'un rival blessé | « Garder » |
| L4-11 | Le sergent Hale, Corra Dunmere et Frère Ambrose | « Garder » |
| L4-12 | Le laboratoire, avant et après, chaque écart nommé | « Accepter » |
| L4-13 | Ce qui revient à L5, la ville qui réagit | « L5 ensuite » |
| L4-14 | Fusionner, puis ton essai | « Fusionner après la fiche, essayer ensuite » |

- Les quatorze choix suivent la recommandation de leur carte : rien à appliquer, le lot reste tel que la Passe EVL7 l'a construit et prouvé. Vessa garde la désinformation (L4-3 : « l'espionnage plutôt » n'est pas construit) ; aider Ilse ou Tobin n'est pas construit (L4-6) ; les écarts du laboratoire sont acceptés (L4-12 : le diligent v2 perd un combat dans deux parties sur 150, le sable de Rhosk qu'il ne lit pas).
- **Le message de l'opérateur** compare la ville à Smallville (le village des « Generative Agents », Park et al., 2023 : des personnages menés par un modèle de langage, avec une mémoire, des plans et des réflexions). C'est une impression, pas une demande : consignée telle quelle. La différence, à garder en tête si une suite y revient : ici chaque personnage suit des règles écrites et déterministes (une graine, des causes lisibles, le laboratoire qui les mesure), aucun modèle ne décide en jeu ; ce qui ressemble à Smallville, c'est la mémoire des faits (L4-2), les rivaux qui agissent hors écran selon elle (L4-3, L4-4) et le journal caché des rivaux, que la page du tournoi rend lisible (L3).

### Preuves
- Aucun code ne change depuis `5640dae`, et `main` est resté à `11dabb7` (vérifié sur `origin/main` avant la fusion) : les preuves de la Passe EVL7 tiennent telles quelles (tests, 0 px du jeu par défaut en DEV et sur les paquets, empreintes `play-day` et `play-flow`, laboratoire, parties v2 jouées dans le navigateur et rejouées en Node, `ui-text`). `npm run typecheck` et `npm test` relancés sur le commit de cette passe.

### La fusion
- La branche `claude/l4-rivalites` (Passes EVL7, EVL8) est fusionnée en avance rapide dans `main` (L4-14 « Fusionner après la fiche, essayer ensuite ») ; `main` est poussé, et la branche supprimée, locale et distante. Ton essai : `npm run dev`, puis `/?play=1&new=1&v2=1` ; en DEV, `/?play=1&state=v2-tale-day3` (le conte de Vessa) et `/?play=1&state=v2-sand-day9` (Rhosk sur le sable).

### Ce qui revient à L5 (la ville qui réagit, EV-12)
- EV-12 « Les places lisent le pouls, la célébrité compte », sa recommandation telle que la fiche EV1 l'écrivait : « Les places lisent le pouls comme le quai (la foule, les fanions, une boutique aux volets fermés). La célébrité change ce que disent les passants et qui salue le héros, et un garde se poste à l’étal le jour d’un vol. Tout cela avec les sprites et les décors déjà approuvés : rien de neuf sans fiche. »
- Les deux pulsations que rien ne lit, `playerFame` et `publicPressure` : L4 n'y a pas touché (les marionnettes, désormais hors des nouvelles, continuent d'ajouter à la célébrité).
- Ce que L4 donne à L5 : les attitudes des rivaux (`stanceOf`, `memoryOf`, `src/simulation/v2rivals.ts`), que la ville peut montrer ; les ambiances dites par les gens (`v2quiet`), dont la foule et les places peuvent prendre le relais ; les conditions `boutIn` et `status` des événements.
- L4-6 « Laisser ainsi » : aider un autre rival qu'Orla reste à décider plus tard (avec L5 ou la phase d'équipe).
- Hors de L5 : « Your bouts are fought » le jour 7 pour un finaliste (Passes EVL3, EVL5), à décider ; Hale qui dit « tonight » le matin (Passe EVL7).

### Pensée
- Une fiche relue sans note, toute à la recommandation, n'appelle pas de nouvelle preuve quand ni le code ni `main` n'ont bougé : on le vérifie (le commit, `origin/main`) avant de fusionner.
- Une comparaison de l'opérateur (Smallville) se consigne comme une impression : elle dit ce qu'il ressent du lot, et elle peut orienter une suite, mais elle ne change aucune règle sans sa décision.

