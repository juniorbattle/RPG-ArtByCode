# Journal de bord — archive : passes SN11, SN12 (2026-11-04)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-11-04 (Passe SN19) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe SN11 — La fiche d'essai du son relue : le plan gardé, la production confirmée, le son des combats à reprendre (2026-11-04)

### Demande
- L'opérateur, dans la séance mère, transmis mot pour mot : « tout est rempli ». La séance mère demande de relire la fiche d'essai et la page Safari, de consigner chaque choix et chaque note mot pour mot, de n'agir que sur ce qui est décidé (E-PROD ; la jointure AAC sur Safari, avec la liste d'édition si elle s'entend) et de préparer ce qui demande un arbitrage.

### La fiche d'essai
- Page privée https://claude.ai/artifact/3fVUHipEEnncBcjcM3waeF, source `briefs/fiche-son-essai.html`. Relue par `list` : 10 documents sur 10, une note.

| # | Décision | Choix de l'opérateur | Note |
|---|---|---|---|
| E-LIEUX | Chaque lieu son morceau | « Bien placé » | — |
| E-NIVEAU | Le niveau de la musique | « Bien dosée » | — |
| E-COUCHES | Les couches du duel | « À reprendre (en note) » | « quelle est ce bruit de vague ? et les bruit de Bip, et claquement représentent quoi ? bref pas convaincu » |
| E-INTRO | L'introduction des combats | « Bien comme ça » | — |
| E-KO | La fin d'un combat | « Bon moment » | — |
| E-FANFARE | La fanfare des annonces | « Bien placée » | — |
| E-TITRE | Le titre à l'ouverture | « Bien placé » | — |
| E-SAFARI | L'essai sur un appareil Apple | « Fait, résultats enregistrés sur la page » | — |
| E-PROD | Les fichiers en production dans la version 2 | « Confirmé : en production dans la version 2 » | — |
| E-SUITE | Ce qui vient après | « Lancer S2 puis S3 » | — |

### La page Safari
- Page privée https://claude.ai/artifact/Vz8D8hGPA8VfiVELmjBtrS, collection `results` : 1 document, enregistré le 2026-11-04 à 01:38:24 (UTC). Son navigateur, tel que relevé : « Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Claude/4.16336.0 Chrome/152.0.7977.167 Electron/44.9.3 Safari/537.36 MSIX ». C'est l'application Claude sous Windows, un Chrome 152, pas Safari sur un appareil Apple.
- Ce qu'il dit : contexte audio à 48 kHz accepté, le jeu choisirait l'Opus ; les huit décodages exacts (Opus et AAC, le ton, la valse, la base et l'introduction du duel) ; indices de jointure 9,34 / 0,8 / 1,44 en Opus, 9,48 / 0,27 / 10,56 en AAC, les mêmes que dans Chrome 156 (Passe SN10). Aucun verdict d'écoute, note vide.

### Ce que ces choix veulent dire
- **Gardés tels quels** : le plan des morceaux (E-LIEUX), le niveau de la musique, `MIX.music` −1,6 dB (E-NIVEAU), l'introduction qui joue pendant la fiche de match (E-INTRO), la musique coupée au K.O. puis le jingle 1,2 s après (E-KO), la fanfare aux trois annonces avec la musique 9 dB plus bas (E-FANFARE), le titre sur la première page d'une partie neuve (E-TITRE). Ces valeurs « proposé » de la Passe SN10 sont désormais gardées par l'opérateur ; le code le dit.
- **E-PROD est confirmé** : chaque manifeste porte la confirmation, dans `approval` et `decisions`, et `bake.mjs` l'écrit.
- **E-COUCHES est à reprendre, sans savoir encore quoi.** La note pose trois questions. Réponses, lues dans le code : le « bruit de vague » est le grondement de l'arène, un bruit filtré qui ondule lentement (`ambienceOf('arena')`, lot V8) ; les « Bip » sont le signal des paliers de la charge, un son carré qui monte d'un ton à chaque palier, et le refus d'une commande, plus grave (lot S0) ; les « claquement » sont les coups, des souffles de bruit filtré et des résonances métalliques, un tintement pour la garde (lot S0). Aucun des trois ne vient du groupe ; l'extrait de la carte était un vrai duel du bot, avec tous ses sons. « bref pas convaincu » décide la reprise. Ce qu'il faut reprendre (la musique et ses couches, ou les bruitages et le grondement, que le lot S3 doit remplacer) n'est pas dit : arbitrage préparé, pas tranché.
- **E-SAFARI : l'essai Safari n'a pas eu lieu.** Le relevé vient d'un Chrome sous Windows, et aucun verdict d'écoute n'est noté. La jointure AAC reste non jugée : rien n'est décidé sur elle, la liste d'édition n'est pas écrite. Question préparée.
- **E-SUITE : S2 puis S3**, chacun une tâche à part. La fiche suivante propose d'avancer S3, le lot du duel, puisque la note porte sur le duel ; tant qu'elle n'est pas remplie, l'ordre décidé reste S2 puis S3.

### Fait — [OK]
- `bake.mjs` écrit la confirmation (`CONFIRMED`) ; la cuisson complète refaite : les 48 fichiers audio identiques à l'octet (aucun ne change dans git), les 14 manifestes ne changent que par la confirmation.
- `src/audio/score.ts` et `src/audio/plan.ts` citent les choix de l'opérateur à la place de « proposé » ; aucune valeur ne change.
- La page Safari dit elle-même quand elle n'est pas ouverte dans le WebKit d'un appareil Apple (un avertissement, et `apple` dans le relevé) ; republiée à la même adresse.
- **La fiche suivante** : page privée https://claude.ai/artifact/J3qDxeYWg7zXsqrSBfEyw6, source `briefs/fiche-son-combats.html` : ce que sont les trois bruits ; SC-QUOI à l'oreille, avec le même duel du bot en trois extraits rendus par le moteur (en entier, la musique seule, les bruitages et le grondement seuls) ; SC-OU, où reprendre (recommandé : avancer S3 avant S2) ; SC-SAFARI, refaire l'essai sur un appareil Apple (recommandé, si l'opérateur en a un). `decisions` relu vide à la publication.
- `AGENTS.md` dit le résultat de l'essai.

### Preuves
- `npm test` 385 sur 385, `npm run typecheck`, `npm run build`, `npm run art:validate` (14 manifestes de son, 0 erreur) ; `bake.mjs` refait toute la cuisson : `git status` ne montre aucun fichier audio ni `catalogue.json` changé, les manifestes seulement.
- La page Safari : l'avertissement caché pour Safari sur iPhone et sur Mac, affiché pour Chrome sur Mac et pour l'application Claude sous Windows (même page, agent utilisateur changé dans Chrome) ; vérifiée dans Chrome et Firefox, aucune erreur, rien ne déborde à 390 px.
- Les trois extraits de la fiche, rendus par le moteur sur le même duel du bot : en entier −17,3 LUFS, la musique seule −21,0, les bruitages et le grondement seuls −19,6. La fiche vérifiée dans Chrome et Firefox : trois cartes, trois lecteurs, aucune erreur.

### Où reprendre
- Relire la fiche du son des combats quand l'opérateur la dit remplie ; consigner ; n'agir que sur ce qui est décidé. Puis S3 ou S2, chacun dans sa séance. Si l'essai Safari est refait et que la jointure AAC s'entend : la liste d'édition écrite par la cuisson.

### Pensée
- Un relevé d'essai se lit avec son navigateur : la page Safari a enregistré un essai fait ailleurs, et la carte disait « Fait ». Une page d'essai d'appareil dit elle-même si elle tourne sur l'appareil visé.
- Un extrait d'écoute qui mêle tout fait juger le tout : la carte des couches portait un duel complet, et la note vise des bruits que la carte ne présentait pas. Un extrait montre ce que la carte demande de juger, et le reste à part.

## Passe SN12 — La fiche du son des combats relue : la musique et ses couches à reprendre, S3 avant S2 (2026-11-04)

### Demande
- L'opérateur, dans la séance mère, transmis mot pour mot : « remplie ». La séance mère demande de relire la fiche, de consigner, de n'agir que sur ce qui est décidé, de relire la page Safari si un vrai relevé sur un appareil Apple y est arrivé, et de ne pas commencer S3 ni S2 dans cette séance : les proposer.

### La fiche
- Page privée https://claude.ai/artifact/J3qDxeYWg7zXsqrSBfEyw6, source `briefs/fiche-son-combats.html`. Relue par `list` : 3 documents sur 3, aucune note.

| # | Décision | Choix de l'opérateur |
|---|---|---|
| SC-QUOI | Ce qui ne convainc pas | « Surtout la musique et ses couches » |
| SC-OU | Où reprendre le son des combats | « Avancer S3 avant S2 » |
| SC-SAFARI | Refaire l'essai sur un appareil Apple | « Je le refais sur un appareil Apple » |

### La page Safari
- https://claude.ai/artifact/Vz8D8hGPA8VfiVELmjBtrS, collection `results` relue : toujours un seul document, celui du 2026-11-04 à 01:38:24 (UTC), fait dans l'application Claude sous Windows (Passe SN11). Aucun relevé d'un appareil Apple : rien de neuf à consigner.

### Ce que ces choix veulent dire
- **SC-QUOI** : après avoir entendu le même duel en entier, la musique seule et les bruitages seuls, l'opérateur désigne la musique et ses couches. La note de E-COUCHES (Passe SN11) portait sur les bruitages ; la reprise porte d'abord sur la musique des combats telle qu'elle joue en duel : l'introduction, puis les trois couches qui suivent le combat (`src/audio/plan.ts`, `layerLevels` ; `duel`, `rival`, `finale`). Ce qui n'y convainc pas n'est pas dit : la règle des couches (la mélodie qui s'efface pendant la séquence adverse, la tension qui entre et sort sur la mesure), leurs niveaux, ou les morceaux eux-mêmes. Les partitions de `duel`, `rival` et `finale` restent celles que l'opérateur a gardées à l'oreille (« Revenir à l’ancienne version », Passe SN9) tant qu'il ne demande pas de les changer.
- **SC-OU** : l'ordre décidé en Passe SN11 (E-SUITE « Lancer S2 puis S3 ») devient S3 puis S2. S3 reprend le son du duel : la musique et ses couches d'abord (SC-QUOI), puis ce que le plan d'audit y range, un son par recette, la fenêtre d'esquive, la foule qui réagit, le K.O. et le ralenti. S2, la météo, les ambiances des lieux et les sons définitifs de l'interface, vient ensuite. Chacun est une tâche à part, proposée par cette séance, pas commencée.
- **SC-SAFARI** : l'opérateur refera l'essai sur un appareil Apple. La jointure AAC reste non jugée et aucune liste d'édition n'est écrite ; la page avertit désormais hors d'un appareil Apple (Passe SN11).

### Fait — [OK]
- Aucun code ne change : rien de décidé ne demande de toucher au jeu dans cette séance. `AGENTS.md` dit l'ordre S3 puis S2 et ce que S3 reprend d'abord.
- Les deux tâches proposées à l'opérateur depuis cette séance (S3, puis S2), avec leur brief.

### Où reprendre
- S3 dans sa séance : commencer par une écoute qui sépare ce qui ne convainc pas dans la musique des combats (des variantes rendues par le moteur sur un même duel : la règle des couches, leurs niveaux, toutes les couches tenues), avant de changer quoi que ce soit ; puis les sons du duel du plan d'audit. Ensuite S2. Relire `results` de la page Safari quand l'opérateur dit avoir fait l'essai sur un appareil Apple ; si la jointure AAC s'entend : la liste d'édition écrite par la cuisson.

### Pensée
- Séparer ce qu'on fait écouter change la réponse : sur le duel complet, la note visait les bruitages ; sur trois extraits séparés, l'opérateur désigne la musique. Une décision d'écoute se prend sur des extraits qui isolent chaque part.

