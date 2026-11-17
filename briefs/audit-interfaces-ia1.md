# Audit des interfaces, en parcours de nouveau joueur (Passe IA1)

*16/11/2026 · branche `claude/audit-interfaces-ia1` (de `main` = `e86d769`) · serveur DEV de l'audit sur le port 5580 (`ia-dev`, hors dépôt) · rien du jeu n'est modifié.*

## 0. La question de l'opérateur et la réponse en bref

L'opérateur, le 16/11/2026, mot pour mot : « Ainsi toutes nos interfaces sont bien structure et intuitif comme equipement/competences ? afin que le joueur puisse naviguer et interargir correctement sans probleme/bloquants visuels ou gameplay ? »

**La réponse est non, pas partout.** Sur 74 constats relevés en jouant tout le jeu :

- **La structure est cohérente** (titre, liste, détail, un pied avec la sortie, des refus qui disent leur raison, le français complet, des contrastes de 7,8:1 et plus, aucun texte sous 16 px sur ordinateur ni 14 px sur téléphone). Ce n'est pas là que le joueur se perd.
- **Le joueur se perd à cinq endroits** : (1) la liste Q, qui s'ouvre sur « Wait » et met le vol avant les gens ; (2) les pages dont une partie ne se fait pas défiler au clavier ni au pad (le guide, le résultat d'un combat, le détail de K) ; (3) les listes et catalogues écrasés à 1280 × 720 (le catalogue de K : 125 px, soit une rangée et demie) ; (4) K et G qui ne se manient pas pareil (flèches, retirer, vendre) ; (5) ce que le jeu fait sans le dire (une quête qui démarre en silence, le prix d'un vol raté, la touche de pause).
- **Quatre blocages** : deux à 1280 × 720 (A-01 une partie neuve est recréée si l'on change la langue ou si l'on recharge sur sa première page ; A-02 la fin des chapitres longs du guide est illisible au clavier et au faux pad) et deux à 568 × 320 seulement (A-03 réglages et guide inutilisables ; B-21 choix de dialogue et liste Q hors de l'écran avec un sac plein).
- **Aucun blocage dans les parcours de jeu proprement dits à 1280 × 720** (marcher, parler, acheter, préparer, combattre, faire une quête) : le premier combat se joue en 4 appuis sans visite, les refus disent pourquoi, le faux pad passe les parcours des trois fronts. Les deux blocages de cette taille sont hors de ces parcours : la perte de partie au changement de langue, et la lecture du guide.

| Front | Constats | Blocage | Friction | Visuel | Incohérence | Info |
|---|---|---|---|---|---|---|
| A, l'entrée, l'apprentissage, les réglages | 20 | 3 | 5 | 6 | 4 | 2 |
| B, la ville, les gens, l'argent, la préparation | 26 | 1 | 2 | 12 | 3 | 8 |
| C, les événements, les combats, ce qui s'ensuit | 28 | 0 | 5 | 9 | 3 | 11 |
| **Total** | **74** | **4** | **12** | **27** | **10** | **21** |

## 1. Méthode et limites

- **Trois fronts joués en parallèle** (trois agents, lecture seule sur le dépôt, chacun son Chrome piloté par `puppeteer-core`, profil neuf, serveur DEV 5580, `vis=0`) : A l'entrée (titre, nom, visite, astuces, guide, menu, réglages, pause), B la ville (marche, sorties, liste Q, dialogues, boutiques, équipement, compétences, fiche de match, tableau, journal, carte, Corvin), C les combats et leurs suites (arène en auto et en manuel, défi, vol, rencontres, quêtes, festival, scènes, fin). Les parcours sont joués à la touche et au clic ; les hooks du jeu (`__game`, `__ui`) ne servent qu'à poser un état. Consignes : `scratchpad/ia/TASKS.md` (hors dépôt).
- **Mesuré** : le nombre d'appuis et de clics, la hauteur des zones, les positions, les valeurs lues dans la page, `tools/ui-text.mjs`, `tools/ui-contrast.mjs`. **Jugement** : marqué comme tel dans les constats. Une capture ou une valeur lue pour chacun.
- **Ce que j'ai vérifié moi-même** : A-01 (code : `src/ui/play.ts` `playUrl` retire `new`, mais `location.reload()` de `leavePage('reload')` le garde, et `startingState` crée alors une partie neuve), A-03 et B-05 (`tools/ui-text.mjs` : réglages et compétences échouent à 568 × 320, l'équipement passe), B-02 (code : `src/ui/skills.ts:321` ne traite que ↑ ↓, `gearPage.ts:351` les quatre flèches), le contenu de quatre captures (réglages 568 × 320, K, fiche de match, liste Q). **B-21 est nuancé** : `ui-text.mjs` passe sur le dialogue de Mara avec le sac par défaut (0 texte couvert) ; la panne mesurée par le front B vaut avec un sac plein (onze choix).
- **Les captures** (48 + 49 + 46 conservées) sont dans `scratchpad/ia/{A,B,C}/shots/`, hors dépôt (les noms sont dans les preuves).
- **Limites de l'audit** : aucune vraie manette (faux pad seulement) ; pas de tactile ; 568 × 320 joué surtout en anglais ; `ui-text` et `ui-contrast` n'ont couvert que les pages de A et B (le front C n'a pas pu les lancer : `__ui` / `__arena` non définis dans sa page, non investigué) ; non joués : l'enregistrement et le chargement d'un fichier de sauvegarde, le retour du français vers l'anglais, une partie neuve de bout en bout au pad, un marchandage réussi, l'écoute chez Lio, les boutiques de Hilde, Edda, Pip, la flamme d'Ambrose, marcher derrière un rival, le duel de la représaille, `v2-wanted-night`. **L'essai en jeu de l'opérateur reste à venir et n'est pas remplacé** : l'opérateur a trouvé K difficile avec des preuves vertes ; un audit par script mesure les impasses, pas l'agrément.

## 2. Les huit thèmes (ce qui revient d'une page à l'autre)

1. **Les zones qui ne défilent pas** (A-02, B-04, B-15, C-04, C-09) : le guide, le résultat d'un combat, le détail de K, les dialogues longs. Le clavier ne défile pas ces zones (Page↓, Fin, Espace, Tab : `scrollTop` reste 0) ; au faux pad, le bâton droit défile la **liste** à la place du détail (`PadInput.scroll` prend le premier conteneur qui déborde, la liste vient avant le détail dans la page). Seule la molette y arrive.
2. **Les fenêtres trop petites** (B-04, B-06, B-20, C-05) : à 1280 × 720 le catalogue de K mesure 125 px, celui de la fiche de match 6 à 56 px, celui de la boutique de Mara deux rangées ; le détail et le pied prennent la moitié de la page.
3. **K et G ne se manient pas pareil** (B-02, B-03, B-08, B-09, B-17, C-26, C-27) : dans G ← → ↑ ↓ vont de tuile en tuile (1 appui de la place à la tuile), dans K seules ↑ ↓ (12 appuis) ; au pad ← → réordonnent les compétences de K ; « Take out » ne retire rien ; une vente demande une confirmation partout sauf dans le dialogue de Mara ; « C Sell » disparaît hors du quai sans le dire.
4. **La liste Q** (A-06, B-01, B-25, C-08, C-17) : s'ouvre sur « Wait » (Q puis Entrée passe un créneau, la première chose qu'un nouveau joueur presse) ; neuf à onze lignes de vol avant les gens (Mara à 10 appuis, Corvin à 25, Orla à 25) ; aucune touche de saut ; les réponses d'une rencontre y restent mêlées au vol.
5. **Ce que le jeu fait sans le dire** (A-08, B-13, B-14, B-18, C-02, C-11, C-14, C-16, C-19, C-20, C-21) : une quête d'Anwen, de Corvin ou de Lio démarre sans message ; échouer une quête n'est dit que dans une carte ; être pris coûte −8 de réputation sans que rien ne le dise ; la touche de pause du duel n'est affichée nulle part ; « une fois par phase » n'est dit qu'au refus ; le tableau envoie « watch them at practice » alors que Vessa est sur le parvis ; l'interrupteur Auto / Manual n'est pas expliqué.
6. **Le petit écran 568 × 320** (A-03, A-04, A-05, B-05, B-21, B-26, C-05, C-06, C-07) : réglages, guide, K, fiche de match, liste Q, tableau, bandes à choix : le pied ou les choix sont sous le bas de l'écran. G et la boutique tiennent (PF1 et EP3). K, refaite en CM2 après PF1, ne tient plus (régression de cette taille).
7. **Les pieds sans action** (A-10, A-11, A-19, B-12, B-22) : la liste Q, les dialogues, la carte, le journal et le menu n'affichent que « Esc » ; l'action de la ligne (Entrée) n'est pas dite, alors que G, K, T et le carnet la disent ; Échap dans une page ouverte depuis le menu ferme tout au lieu de revenir au menu.
8. **La manette** (A-13, C-25, C-26, C-27) : les caps affichent le clavier jusqu'à la première pression du pad ; les quatre caps de la croix sont identiques (seule l'étiquette ARIA donne la direction) ; le nom du héros ne se tape pas au pad (A démarre avec « Ren » sans le dire).

À part : **A-01 la perte de partie** (le rechargement garde `new=1`) ; **A-17** le guide a 14 chapitres, `AGENTS.md` dit douze (écart de documentation) ; **C-23** le kit de départ perd le premier combat (jour 2) sur 5 graines sur 6 (mesure du front C sur six graines : un indice, pas une statistique ; la mesure du laboratoire fait foi).

## 3. Les parcours

Une étape = un appui de touche ou un clic.

### Front A
| Tâche | Résultat | Étapes / remarque |
|---|---|---|
| A1 lancer une partie et comprendre quoi faire | réussi | 10 appuis (11 avec un nom tapé) ; 5 en sautant la visite (Échap) ; « que faire d'abord » dit de biais (A-08) ; la première action de la liste est « Wait » (A-06) |
| A2 reprendre ma partie | réussi | Continue : même état, titre « nom · jour · créneau » ; sauvegarde `v2=0` marquée « the earlier version » |
| A3 changer la langue | partiel | titre : 4 appuis ; en jeu : 7 appuis → **A-01** ; non joués : retour EN, partie reprise par Continue |
| A4 changer une touche | réussi | liste Q → L : 14 appuis ; échange, refus de Tab avec sa raison, « Default keys », AZERTY |
| A5 baisser le son | réussi | V ouvre Son ; musique à 0 : 11 appuis |
| A6 alléger les graphismes | réussi | « Low » en 6 appuis depuis le titre, appliqué à l'instant ; « Reduced motion » trouvable (8e ligne) |
| A7 retrouver une règle | partiel | 14 chapitres, pas de recherche ; boutiques 5 appuis, jauge 13 ; la fin du chapitre « The duel » inaccessible au clavier (A-02) |
| A8 quitter | réussi | 13 appuis ; le rideau noir se baisse (0,59 → 1 en 16 images) ; pas de confirmation, le menu dit que le jeu se sauve |
| A9 le menu | réussi | 13 lignes, la touche dite pour sept pages |
| A10 faux pad | réussi | A1 en 5 appuis ; les caps suivent la famille (Xbox, PlayStation, Nintendo) |

### Front B
| Tâche | Résultat | Étapes / remarque |
|---|---|---|
| B1 savoir quoi faire | réussi | 2 appuis (Entrée, Q) ; l'aperçu « To do here » arrive seul |
| B2 changer de lieu | réussi | tenir ← ou M + Entrée ; chevron, étiquette, carton d'arrivée |
| B3 parler à quelqu'un | en tâtonnant | 12 appuis jusqu'à Mara par la liste (B-01) |
| B4 acheter et porter | réussi | 9 appuis pour trois achats ; la pièce se porte aussitôt sans le dire (B-11) |
| B5 retirer, vendre | réussi | Espace retire ; C puis Entrée vend ; dans le dialogue de Mara un seul Entrée vend (B-08) |
| B6 marchander | réussi | trois arguments avec chance, prix et coût d'un échec ; le succès (23 %) non obtenu |
| B7 compétences, ordre, quand elles partent | en tâtonnant (clavier) | 13 appuis pour placer une tuile, 1 clic à la souris (B-02) |
| B8 préparer un adversaire | réussi | observer 13, répéter 29, carnet 8 |
| B9 gagner de l'argent | réussi | 14 appuis ; la carte « Meanwhile » dit ce que le travail a payé |
| B10 relire hier | réussi | J, « In progress » (lieu, échéance, récompense) |
| B11 comprendre un refus | en partie | raisons dites partout sauf la vente hors du quai (B-09) |
| B12 faux pad | réussi | B4 13, menu → G 7-8, K 18 (croix) |

### Front C
| Tâche | Résultat | Étapes / remarque |
|---|---|---|
| C1 aller à mon combat | réussi | 4 appuis sans visite, 7 avec ; 18 jusqu'au retour avec les leçons |
| C2 jouer en manuel | réussi | touches 1 à 4 sur la HUD ; un appui est pris même en pause |
| C3 passer ou accélérer | réussi | ×2 mesuré à 2,0 ; « Skip » 1,8 s ; la touche de pause n'est pas dite (C-02) |
| C4 pourquoi j'ai gagné ou perdu | en partie | résultat et note de Corvin clairs ; le clavier ne défile pas la carte (C-04) |
| C5 défier | en tâtonnant | ~41 appuis depuis la liste (Orla, 26e ligne) ; 15 depuis son dialogue |
| C6 voler puis être pris | en partie | la bande propose payer ou se battre ; le coût en réputation n'est pas dit (C-14) |
| C7 un événement qui coûte | réussi | le coût est dans les libellés ; le délai n'est dit nulle part |
| C8 les quêtes | en partie | la Cargaison jouée jusqu'à la forge ; herbes, traité, Lio : offre et journal lus ; une quête démarre en silence (C-19) |
| C9 le festival | en partie | matin et soir lus ; flamme d'Ambrose et verset non joués |
| C10 une scène | réussi | Entrée avance, Échap saute ; faux pad A / Menu |
| C11 faux pad | réussi | C1 en 16 appuis ; C2 par la croix |

## 4. Les constats

Classes : blocage (ne peut pas continuer) · friction (continue en tâtonnant) · visuel · incohérence · info (manque d'information). Gravité 1 = ne peut pas continuer, 2 = tâtonne, 3 = cosmétique. Tailles : 720 = 1280 × 720, 1080 = 1920 × 1080, tel = 568 × 320.

### Front A (20)
| ID | Classe | Page | Constat | Preuve | Taille | Grav. |
|---|---|---|---|---|---|---|
| A-01 | blocage | Réglages > Langue, F5, première page d'une partie neuve | le rechargement garde `new=1` : la partie est recréée (pièces 37 → 60, la lame achetée perdue, visite et nouvelles de nouveau) | `a3b.log`, `misc.log`, `a3b-after-language-change-…-fr.png` ; code vérifié | 720 | 1 |
| A-02 | blocage de lecture | Guide (H) | le détail d'un chapitre long ne défile pas au clavier ni au pad (le bâton droit défile la liste) ; « The duel » : 9 paragraphes sur 13 cachés, dont la jauge de rupture ; chapitre 14 : G, V, H, N invisibles | `a7b.log`, `a7-guide-ch12-…png` | 720 | 2 |
| A-03 | blocage (tel) | Réglages et guide | le volet de détail mesure 15 px, le contrôle focalisé est hors du volet ; `ui-text` échoue (réglages : 6 textes sur 11 coupés ; guide : 14 sur 18 recouverts, l'outil passe) | `a6c.log`, `s03-title-settings-568x320.png` ; vérifié | tel | 1 à cette taille |
| A-04 | visuel | Visite | les boutons du pied de la bande passent derrière « Q Here 5 to do / Esc Menu » | `s05-tour1-568x320.png` | tel | 2 |
| A-05 | visuel | Écran titre | « Cité du Tournoi » coupé en haut ; `ui-text` : « div.name cut by viewport » | `s01-title-568x320.png` | tel | 3 |
| A-06 | friction | Liste Q | s'ouvre sur « Wait · 1 slot » : Q puis Entrée passe le matin | `misc.log`, `m-Q-first-selection-…png` | 720 | 2 |
| A-07 | friction | Astuces | « Someone has something new » tombe après la visite même sautée ; au premier Q, « Stealing » recouvre la liste | `07-tour-7-…png` | 720 | 3 |
| A-08 | info | Visite | aucune priorité pour la première matinée (cinq choses de même poids) ; les touches de marche ne sont dites que sur le titre et au chapitre 14 | jugement | 720 | 3 |
| A-09 | friction | Titre > New game | « This replaces your saved game » est affiché, mais Entrée dans le champ du nom remplace la sauvegarde sans confirmation | `a2c-newgame-over-save-…png` | 720 | 3 |
| A-10 | incohérence | Réglages | V ouvre sur Son, Menu > Settings sur Graphics | `a3b.log`, `a9` | 720 | 3 |
| A-11 | incohérence | Menu | Échap dans une page ouverte depuis le menu ferme tout et revient au jeu | `a4c.log` | 720 | 3 |
| A-12 | incohérence | Explore | aucune touche affichée, Échap ne fait rien, H ouvre le panneau développeur (H = guide ailleurs) | `misc.log` | 720 | 3 |
| A-13 | info | Manette | la carte « News » affiche les caps clavier jusqu'à la première pression ; le titre sans aide manette ; le nom ne se tape pas au pad (A démarre « Ren » sans le dire) | `a10-news-xbox-…png` | 720 | 3 |
| A-14 | visuel | Titre | après avoir vidé WASD : « arrows or Up Left Down Right » | `a4b.log` | 720 | 3 |
| A-15 | friction | Réglages > Qualité | ‹ › boucle : de High, ← ×3 arrive à Very high | `a6b.log` | 720 | 3 |
| A-16 | visuel | Guide, liste | un fragment de ligne (« them ») sous l'en-tête | `a7-guide-ch12-…png` | 720 | 3 |
| A-17 | friction | Guide | pas de recherche ; les règles de compétences sont dans « Preparing a bout » (3 402 caractères) ; 14 chapitres, `AGENTS.md` dit douze | jugement ; `a7.mjs` | 720 | 3 |
| A-18 | visuel | Controls | la ligne d'explication vient après « Gamepad vibration », affiché sans manette | `a6b-controls-…png` | 720 | 3 |
| A-19 | incohérence | Pause du duel | « Space to resume » texte simple, « Esc Settings » bouton ; aucune sortie du combat depuis la pause | `p03-pause-…png` | 720 | 3 |
| A-20 | visuel | Visite (pad PS, Nintendo) | « Its key counts… » garde « key » à côté d'un symbole | `a10-tour4-ps-…png` | 720 | 3 |

### Front B (26)
| ID | Classe | Page | Constat | Preuve | Taille | Grav. |
|---|---|---|---|---|---|---|
| B-01 | friction | Liste Q | « Rest » (grisé), « Wait » (focus) puis 9 à 11 lignes de vol avant les gens ; Mara à 10 appuis, Corvin à 25 | `05-list-Q-…png` ; vérifié sur la capture | 720 | 2 |
| B-02 | incohérence | K (clavier) | ← → ne font rien sur les tuiles ; 12 appuis de ↓ de la place 1 à la première tuile libre ; G : 1 | `nav.mjs`, `b7b` ; code vérifié | 720 | 2 |
| B-03 | incohérence | K (faux pad) | ← → de la croix déplacent la compétence ; au clavier ← → déplacent le focus (A / D réordonnent) | `b12b` | 720 | 2 |
| B-04 | visuel | K, fiche de match | le détail est coupé (tableau « Now / Level 2 » sous le pli) ; le bloc n'est pas focalisable ; catalogue de la fiche de match réduit à une ligne tronquée | `26-K-newgame-…png`, `43-matchsheet-…png` | 720, 1080 | 2 |
| B-05 | visuel | K et fiche de match | le pied d'actions tombe sous l'écran ; liste de tuiles à 6 px ; `ui-text` échoue (K, fiche, EN et FR) | `uitext-en.log` ; K vérifié | tel | 2 |
| B-06 | visuel | Boutique de Mara | deux rangées de quatre tuiles ; le sac et le tableau « Now / After » sous le pli | `14-mara-goods-buy-…png` | 720 | 2 |
| B-07 | visuel | Boutique de Mara | la mise en page saute avec le focus (grille de 242 à 448 px) | `15-mara-goods-last-tile-…png` | 720 | 3 |
| B-08 | incohérence | Dialogue de Mara | « Sell X to Mara » vend d'un seul Entrée, sans confirmation ; G et le panneau « Sell » demandent | `mara-1920x1080.png`, `b5b` | 720, 1080 | 2 |
| B-09 | info | G hors du quai | « C Sell » disparaît du pied sans dire pourquoi | `b11` | 720 | 2 |
| B-10 | visuel | G (accessoire, deux places prises) | le pied dit « Esc Close » alors qu'Échap annule le choix de la place | `b5` | 720 | 3 |
| B-11 | info | Boutique | un achat porte la pièce aussitôt (l'ancienne au sac), le message ne le dit pas | `17-bought-blade-…png` | 720 | 3 |
| B-12 | info | Carte (M) | trois lignes « Go to … » sans plan ni dire qui est où ; pas de pied d'action | `11-map-lanterns-…png` | 720 | 3 |
| B-13 | info | Tableau T, fiche de match | « watch them at practice » mais Vessa Lark est sur le parvis | `41-board-…png`, `scan.mjs` | 720 | 2 |
| B-14 | info | Travail payé | « That work is done in the morning » : ambigu (se fait le matin / déjà fait) | `b9` | 720 | 3 |
| B-15 | visuel | Dialogue de Corvin | 5 choix dans une colonne qui en montre 3,5 ; le travail payé est le 5e | `44-person-corvin-…png` | 720 | 3 |
| B-16 | visuel | K, sélecteur « When does X leave? » | le pied dépasse la carte de 11 px | `31-K-C-conditions-…png` | 720 | 3 |
| B-17 | info | K | « Take out » ne retire rien (le jeu garde quatre) ; le pied garde « Space Take out » sur une place libre | `28-K-taken-out-…png` | 720 | 3 |
| B-18 | info | K et fiche de match | l'interrupteur Auto / Manual n'est expliqué nulle part | `32-K-manual-…png` | 720 | 3 |
| B-19 | visuel | K en manuel | le cap « 1 » à « 4 » mord le texte « · 2 uses » | `32z-K-manual-zoom.png` | 720 | 3 |
| B-20 | visuel | K | catalogue visible : 189 px à 1440 × 900, 125 à 1280 × 720, 87 à 1366 × 768, 7 à 1024 × 576 ; G : 330 / 248 / 162 / 25 | `sizes.mjs`, `27-K-owned-…png` ; vérifié sur la capture | 720 et moins | 2 |
| B-21 | blocage (tel, sac plein) | Dialogues, liste Q, tableau T | les choix et la liste hors de l'écran (focus à y = 328–367 pour 320) ; le détail de T à 0 px ; non reproduit avec le sac par défaut (`ui-text` passe) | `mara-568x320.png`, `Q-568x320.png`, `b13` | tel | 1 à cette taille |
| B-22 | info | Q, dialogue, M, menu, journal | le pied n'affiche que « Esc » ; l'action d'Entrée n'est pas dite | `b9`, `b10`, `b2b` | 720 | 3 |
| B-23 | visuel | Panneau « Sell » | après la vente le détail garde la question ; rien ne confirme | `b15b` | 720 | 3 |
| B-24 | visuel | K, boutons ‹ › | grisés aux extrémités à 2,34:1 (désactivés : exempts par conception) | `tools/ui-contrast.mjs` | 720 | 3 |
| B-25 | friction | Liste Q | focus de départ « Wait · 1 slot » ; Q puis Entrée perd la matinée | `b14` | 720 | 2 |
| B-26 | visuel | Ville | l'étiquette de sortie recouverte par l'aperçu « To do here » | `town-568x320.png` | tel | 3 |

### Front C (28)
| ID | Classe | Page | Constat | Preuve | Taille | Grav. |
|---|---|---|---|---|---|---|
| C-01 | friction | Ville, liste | trois bandeaux d'astuce se suivent avant la première action utile | `c1-02-list-…png` | 720 | 3 |
| C-02 | info | HUD du duel | la touche de pause (Espace) n'est affichée nulle part ; Échap ne fait rien pendant le duel | `c2-05-pause-…png`, `c2-03-hud-manual-…png` | 720 | 2 |
| C-03 | visuel | Résultat | le mot géant « Victory » / « Defeat » transparaît derrière les lignes | `c1-result-…png` | 720 | 3 |
| C-04 | friction | Résultat | la carte défile sur 101 px ; la ligne du joueur sous le pli ; le clavier ne la défile pas | `c1-result-scrolled` | 720, tel | 2 |
| C-05 | visuel | Fiche de match, fiche de défi | la bande « Owned (n) » écrasée : 6 px à 1920 × 1080 auto, 56 px à 1280 × 720, 10 px le jour 2 | `c1-03-sheet-…png` ; vérifié sur la capture | 1080, 720, tel | 2 |
| C-06 | visuel | Bandes à choix (rencontre, pris sur le fait, dialogues) | les choix et le pied sous le bas de la fenêtre ; le joueur voit la question sans les réponses | `s-encounter-568x320.png` | tel | 2 |
| C-07 | visuel | Fiche de match | le pied « Enter the arena with these four » à y = 387–469 pour 320 | `s-sheet-auto-568x320` | tel | 2 |
| C-08 | friction | Liste Q | les personnes après 9 à 11 lignes de vol (Orla 26e, Corvin 25, Tam 14, Hale 12) ; aucune touche de saut | valeurs relevées | 720 | 2 |
| C-09 | friction | Dialogue d'Orla et des combattants | neuf choix pour trois lignes visibles ; le défi est le 7e | `c5-03-orla-dialogue-…png` | 720 | 2 |
| C-10 | incohérence | Défi / pris sur le fait | le dialogue d'Orla reste ouvert après l'acceptation ; « Face Mara on the sand » ouvre la fiche tout de suite | `c6-fight-sheet` | 720 | 3 |
| C-11 | info | Dialogue de combattant | « une fois par phase » n'est dit qu'au refus | valeur lue | 720 | 3 |
| C-12 | visuel | Fiche de défi | la mise est sous un fondu ; « A challenge won adds no health » coupée | `c5-07-sheet-…png` | 720 | 3 |
| C-13 | visuel | Résultat de défi | montre le classement de la poule (le joueur 7e à 0 point) | `c5-10-result-…png` | 720 | 3 |
| C-14 | info | Vol | être pris coûte −8 de réputation, non dit ; la ligne de vol est étiquetée « free » | états lus | 720 | 3 |
| C-15 | visuel | Astuce « A mark in the ledger » | le texte passe sous les chiffres du coin | `c6-02-after-steal-…png` | 720 | 3 |
| C-16 | info | Représaille | Corra ne rappelle pas la « dette de Mara » ; « Pay … off » 20 pièces sans détail | `c6-11-corra-…png` | 720 | 3 |
| C-17 | info | Liste après une rencontre | les réponses « Let him go / Go after him » restent dans la liste, mêlées au vol, sans nom | `c7-04-list-after-esc-…png` | 720 | 3 |
| C-18 | info | Rencontre « cartes truquées » | « Refuse » ne chiffre pas son coût (Lio −2) ; le premier choix (garder la perte) est le focalisé | `c7-sharps-…png` | 720 | 3 |
| C-19 | info | Quêtes d'Anwen, Corvin, Lio | parler au donneur démarre la quête en silence ; l'offre n'est que dans le journal | `c8-herbs-02-dialogue-…png` | 720 | 2 |
| C-20 | info | Journal « In progress » | après un échec : « all settled » ; l'échec n'est dit que dans une carte | `c8-herbs-05-failed-news-…png` | 720 | 3 |
| C-21 | info | Fin de partie | la partie continue après le couronnement ; la carte de fin ne vient qu'après « Wait » ou « Rest » le soir du jour 10 | `c10-final-card-…png` | 720 | 2 |
| C-22 | info | Carte de fin | l'ordre final est titré « (the pool's points) » mais suit le tableau final | `c10-final-card-…png` | 720 | 3 |
| C-23 | info | Premier combat | le kit de départ perd le jour 2 sur 5 graines sur 6 (indice) | `__arena.auto.winner` | 720 | 3 |
| C-24 | friction | Leçons du premier duel | neuf leçons ; la première fait cinq phrases ; la carte couvre les combattants (jugement) | `c1-lesson-01-…png` | 720 | 3 |
| C-25 | incohérence | Portail, HUD (faux pad) | les caps affichent le clavier jusqu'au premier appui du pad | `c11-04-gate-pad-…png` | 720 | 3 |
| C-26 | visuel | HUD manuelle (faux pad) | les quatre caps de croix sont identiques ; seule l'étiquette ARIA porte la direction | `zoom-dpad-caps.png` ; vu | 720 | 2 |
| C-27 | incohérence | Fiche (faux pad) | ← → = « Earlier / Later » ; ↑ ↓ parcourent un ordre linéaire ; le commutateur par ↑ puis X | `c11-03-sheet-pad-…png` | 720 | 3 |
| C-28 | visuel | Réglages depuis la pause | le texte de la HUD transparaît derrière le titre « Settings » | `c3-03-pause-settings-…png` | 720 | 3 |

## 5. La grille de cohérence (condensée)

« o » vu, « n » non, « – » sans objet. Colonnes : le pied dit l'action (à gauche) et la sortie (à droite) · un refus dit sa raison · suit le dessin de K et G (tuiles, un clic) · constats.

| Page | Pied : action et sortie | Refus avec raison | Suit K et G | Constats |
|---|---|---|---|---|
| Titre | n (aucun pied) | – | – | A-05, A-09, A-13 |
| Nom, News | n (Entrée, pas de sortie dite) | – | n | A-13 |
| Visite, astuces | o (Next, Skip) | – | – | A-04, A-07, C-01, C-15 |
| Guide | o (Replay, Close) | – | partiel | A-02, A-16, A-17 |
| Menu | n (Esc seul) | – | n | A-10, A-11, B-22 |
| Réglages | n (Esc seul) | o (touches) | partiel | A-03, A-10, A-15, A-18 |
| Liste Q | n (Esc seul) | o (Rest, Wait) | n | A-06, B-01, B-25, B-22, C-08, C-17 |
| Dialogue | n (Esc Leave) | o | n | B-08, B-14, B-15, C-09, C-10, C-11 |
| Boutique (G avec gardien) | o (Buy, Haggle, Leave) | o | o | B-06, B-07, B-10, B-11, B-23 |
| Équipement G | o (Take it off, Sell, Close) | n (B-09) | o (référence) | B-09, B-10 |
| Compétences K | o (Take out, C, A, D, Close) | o | o (référence) | B-02 à B-05, B-16 à B-20, B-24 |
| Fiche de match, fiche de défi | o à 720 · n à tel | o | o | B-04, B-05, C-05, C-07, C-12 |
| Tableau T | o (Match sheet, Close) | – | n | B-13, B-21 |
| Journal J | n (Esc seul) | – | n | C-20 |
| Carte M | n (Esc seul) | o (la nuit) | n | B-12 |
| Carnet de Corvin | o (Watch a win / loss) | – | n | – |
| Portail de l'arène, HUD, pause | o (Fight, ×2, Skip) · pause non dite | – | – | C-02, C-25, C-26, A-19 |
| Résultat, news | o (Return) | – | n | C-03, C-04, C-13 |
| Bandes à choix (rencontre, pris) | n (pas de pied) | – | n | C-06, C-17, C-18 |
| Scène | o (E Next, Esc Skip) | – | – | – |
| Carte de fin | o | – | n | C-21, C-22 |

## 6. Ce qui est bien (à garder)

- La visite : six bandes courtes, l'élément éclairé, Échap la saute, Espace du guide la rejoue.
- Le remappage : deux touches par action, l'échange dit, le refus de Tab avec sa raison, « Default keys », AZERTY.
- Les graphismes appliqués à l'instant, derrière la page ; le français complet (aucun mot anglais resté sur une trentaine de pages) ; le rideau noir avant chaque changement de page.
- K, G et la boutique disent quoi faire sous le titre, nomment leurs places, demandent où poser quand tout est pris, et refusent avec la raison avant le clic (« One ultimate at most… », « 18 short », « the sand is shut until dawn »).
- Les ventes de G demandent d'abord ; le marchandage montre la chance, le prix si gagné et le coût d'un échec.
- Le combat : la porte du combat en première ligne de la liste, Rest et Wait grisés avec leur raison ; le mode dit sur la fiche, le portail et la HUD ; ×2 mesuré à 2,0 ; « Skip » rend le résultat en 1,8 s ; une touche prise même en pause.
- Les résultats expliquent leurs gains ; le journal « In progress » donne le lieu, l'échéance et la récompense ; les libellés d'une rencontre portent leur coût ; Hale lave les marques pour 5 pièces.

## 7. Suites proposées (sur la fiche, à décider par l'opérateur)

Aucune option de la fiche ne change une décision A3. Seule l'option qui laisserait le petit écran hors de la tranche toucherait UM-L3 (« Maintenir », décision de l'opérateur, pas une A3) : elle est marquée.
Lots proposés si la fiche est suivie : 1. le correctif de A-01 et les règles communes de défilement et de liste Q ; 2. K alignée sur G (flèches, retirer, vendre, tailles) ; 3. le petit écran des pages du parcours ; 4. ce que le jeu fait sans le dire ; 5. les finitions visuelles et la manette. Chaque lot : tests, preuves navigateur (EN, FR, `REDUCED=1`, `MOTION=reduce`), fusion.
