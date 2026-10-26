# Système de combat — spécification (atelier CB1, 25/10/2026)

**Statut : approuvée par l'opérateur le 25/10/2026** (fiche de l'atelier, CB-1 « Approuvée » ; les dix autres décisions de la fiche sont
intégrées au texte et listées au § 16). Étape 0 de `briefs/roadmap-2026-10.md`, écarts E1 / E16 (journal, Passe CB1).

**Autorité.** L'atelier est mené par l'opérateur. Son mot d'ordre (note E1 / E16, Passe D8) : « Nous devons faire une tache entiere concernant le
systeme de combat et la logique car c'est quelque chose de nouveau que seul moi a l'entiere comprehension ». Ses réponses sont la source de ce
texte. Elles sont recopiées mot pour mot en annexe A (groupes G1 à G5). Chaque règle renvoie à la réponse qui la fonde, par exemple [G3].
Ce que la séance a dû compléter renvoie à la décision de la fiche qui l'a tranché, par exemple [CB-3], ou à l'approbation du texte (CB-1). Ce que l'opérateur a
laissé à l'essai porte la mention **« à régler »**. Les nombres sont provisoires.

Référence de concept désignée par l'opérateur [G1] : son ancien combat Unity (`…\Unity\MyGame\Assets\game\Base\Battle`), lu sans en reprendre de
code. Le système le reprend en partie : un temps de préparation par action, une garde. Il en retire la charge tenue, les gardes spéciales, la
Transe, la file d'exécution et les effets d'état [G2].

---

## 1. Le modèle : un « tour par tour dynamique »

- C'est un **tour par tour dynamique** [G1] : le temps ne s'arrête jamais, « nous on est toujours actif dans le combat pas de temps de pause »
  [G1]. L'opérateur cite une « inspiration de expedition 33 » [G1].
- Le rythme a deux temps :
  - le joueur attaque quand l'adversaire ne le fait pas ;
  - quand l'adversaire attaque, il a la priorité, et le joueur se défend [G1, G2].
- Le système doit rester simple [G1] :
  - 2 actions de défense : la garde et l'esquive ;
  - 2 attaques simples : la légère et la puissante ;
  - 4 compétences.
- But d'un duel [G1] : « donner le plus de cooup possible pour briser la resistance de l'adversaire et lancer des actions devastratrice mais
  aussi esquiper les attaques et combos des adversaires et donc bien gerer ces AP ».
- Les « actions dévastatrices » ne sont pas une action à part : « nous utilisons nos actions definies » [G5].

## 2. La boucle d'un duel

1. Le duel commence ; les deux combattants sont actifs.
2. **L'adversaire alterne des séquences d'attaque et des pauses.** Une séquence peut être :
   - un combo de plusieurs coups ;
   - un coup isolé ;
   - une de ses compétences.

   Les pauses raccourcissent avec son niveau, « rendant presque le combat full actif » [G1].
3. **Pendant une pause**, le joueur attaque : attaques légères et puissantes, compétences. Chaque coup fait monter la résistance de
   l'adversaire [G2].
4. **Pendant une séquence**, le joueur est dans sa **phase de défense** : il garde ou il esquive [G2, G3].
5. Une **résistance pleine** brise le combattant. Il est étourdi 5 à 10 s et prend des dégâts légèrement accrus. L'autre en profite avec ses
   actions [G3, G5].
6. Le duel se termine au **K.O.**, et seulement au K.O. [G4].
7. **Durée visée : 5 à 10 minutes**, « selon la complexite de l'adversaire et ces points de vie » [G5].

## 3. Les ressources d'un combattant

| Ressource | Règle | Source |
|---|---|---|
| **Points de vie** | 0 = K.O., fin du duel. | [G4] |
| **Points d'action (PA)** — joueur | Les compétences et l'esquive les dépensent ; les attaques légère et puissante ne coûtent rien. Gain : +1 PA par attaque légère qui touche. Maximum 4 ou 5 (« a determiner sur ce qui adapte bien la coherence du jeu ») : 5 comme point de départ. **Départ du duel : 1 PA** (« 1 par defaut », CB-5 ; 3 aujourd'hui). **À régler** : un PA rendu toutes les 5 à 10 s, « si on juge que ce n'est pas suffisant ». | [G1, G4, G5, CB-5] |
| **Jauge de résistance** — les deux combattants | Une seule règle pour les deux [G3], détaillée au § 6. Pour l'adversaire, c'est sa « barre de break » [G5]. | [G2, G3, G4, G5] |

## 4. Les actions du joueur

Les touches sont **instantanées** : pas de charge tenue [G2]. Certaines actions ont un **délai de préparation automatique** avant de partir,
« ce qui fait naturellement perdre du temps » [G2].

| Action | Coût | Délai | Effet | Source |
|---|---|---|---|---|
| **Attaque légère** | aucun | aucun (instantanée) | Un seul coup [G5]. Fait monter la résistance de la cible ; +1 PA si elle touche. | [G1, G2, G4, G5] |
| **Attaque puissante** | aucun | préparation automatique | Dégâts forts. Fait monter la résistance plus vite, sur une garde aussi : elle ne brise plus la garde d'un coup [G5]. Elle peut étourdir, mais seulement si la résistance cède [G1]. | [G1, G2, G4, G5] |
| **Garde** | aucun | tenue | Dégâts réduits. Le gardien voit sa propre résistance monter : la garde finit par l'étourdir quand la jauge est pleine [G1, G2]. Point de départ : −60 %, comme aujourd'hui [CB-5]. | [G1, G2, G5, CB-5] |
| **Esquive** | PA | instantanée | Évite l'attaque. Point de départ (comme aujourd'hui) : 1 PA, dans la fenêtre de réaction de l'attaque adverse (plus 0,15 s d'avance tolérée) [CB-5]. Direction : un pas en arrière ou un saut de côté, « a voir celui qui s'adapte le mieux » [G5]. | [G1, G5, CB-5] |
| **Compétences (4)** | PA | préparation automatique | Familles **offensive, défensive, soutien** [G1]. Choisies avant le duel (§ 8). **Pas de recharge** : « pas prevu mais cela peut etre integre si on juge que le jeu est pas assez structure » [G5]. | [G1, G2, G4, G5] |

- Pas de charge tenue, pas de garde spéciale (miroir, regain), pas de Transe [G2].
- Point de départ (comme aujourd'hui) [CB-5] : une commande pressée pendant les 0,2 dernières secondes de l'action en cours est gardée en
  attente ; plus tôt, elle est refusée.

## 5. L'adversaire et sa priorité

- **La priorité** [G1, G3] : « l'adversaire IA a la priorite donc quand ll attaque rien ne l'empeche ». Pendant une séquence, sauf s'il est
  étourdi ou sous un « autre statut handicapant », il attaque sans être interrompu. Le joueur est alors « dans sa phase de defense ». La
  technique Tourbillon, qui interrompt aujourd'hui, perd ce pouvoir.
- **La phase de défense** [G3] : le joueur ne peut que garder et esquiver. Il « peut tenter d'attaquer maiis aucune execution se fera et il se
  prendra des degats car l'adversaires sera toujours en pleine execution ».
- **Le « repoussé »** [G1] : « si on a le meme timing d'attaque que lui on peut etre repousser ». Décidé [CB-3, « Annulée, PA rendus »] :
  - une action du joueur qui n'a pas encore porté quand une séquence adverse commence est annulée : court recul, coup reçu ;
  - les PA d'une compétence ainsi annulée sont rendus ;
  - une action qui a déjà porté finit normalement.
- **L'étendue de la phase de défense** [CB-4, « Toute la séquence, intervalles compris »] : du début d'une séquence adverse à la fin de son
  dernier coup, les intervalles d'un combo compris.
- **Les pauses** entre les séquences restent, plus courtes selon le niveau de l'adversaire [G1].
- **La défense de l'adversaire** [G3] : « certains adversaires sophistiques et special peuvent garder, esquiver voir les deux ».
- **Ses compétences** [G3] : « presque tous les adversaires auront aussi leur propres competences entre 2-4 competences mais la encore ca
  dependra du niveau de l'adversaire ».
- **Son annonce** [G5] : un signe discret, « mais avec une legere alerte surtout pour les competences ».
- Complété par la séance, approuvé avec le texte (CB-1) : l'adversaire n'a pas de PA (comme aujourd'hui) ; ses compétences font partie de ses séquences.
- Ce qui distingue les rivaux : leurs nombres, leur défense (garde, esquive), leurs compétences, et la longueur de leurs pauses (leur niveau).

## 6. La résistance et le « break »

- **Une seule règle pour les deux combattants** [G3] : « Oui une seul regle me va ».
- **Ce qui la remplit** :
  - tous les coups reçus [G2 : « tous les cousps »] ;
  - les coups pris en garde [G2 : « si le joueur est en garde ou prend naturellement des coups, la jauge monte aisni cela reste coherent »] ;
  - l'attaque puissante plus vite, sur une garde aussi [G5].
- **Ce qui la vide** : le temps, « legerement et progressivement avec le temps pour faire simplle » [G4]. L'esquive et l'attaque du joueur ne la
  vident pas (l'idée de G2, « si il tappe, ou esquive elle peut baisser », « a confirmer », est remplacée par la règle simple de G4).
- **Quand elle est pleine, c'est le « break »** [G3] :
  - le combattant est étourdi 5 à 10 s ;
  - il prend des dégâts légèrement accrus ;
  - « le but est de donner un avantage sans briser le combat ».
- **Après l'étourdissement**, la jauge repart de zéro [G5] : « Oui surtout pour l'adversaire c;est une barre de break ».
- Un coup puissant sur une garde ne brise plus la garde d'un coup [G5]. Le garde brisé d'aujourd'hui (2,4 s, 100 %) disparaît. Sur l'aide, l'opérateur ajoute : « comme cela ne brise pas et rrend direct etourdi on a plus de marge » [G5].
- **À régler** : la taille de la jauge, ce que chaque coup y ajoute, la vitesse à laquelle elle se vide, le surplus de dégâts (point de
  départ +20 %, CB-5), la durée exacte de l'étourdissement dans 5 à 10 s.

## 7. La fin d'un duel

- **Le K.O. seul** [G4] : « Oui KO pour la fin du duel ». Pas d'abandon, pas de temps limite, pas de points.
- Une défaite dans le tournoi reste non éliminatoire (décision G3 de la tranche, Passe L7) : ce point relève du tournoi, pas de cette spécification.

## 8. La préparation et les compétences

- **Le choix des compétences** [G2] : « pour notre heros il peut les chosiri avant le duel donc on aura un systeme de changement de
  competences ». Quatre emplacements, pris dans les compétences que le héros a obtenues.
- **Comment il les obtient** [G4] : « achats, entrainement, duel en ville ».
- **L'équipement** [G4] :
  - « arme predefini avec amelioration (stats-effets) » ;
  - « 2-3 slot d'accessoires ».
- **Les objets en combat** [G4] : « objet en coombat pas prevu mais on peut aussi faire 3 competences + action object dispo en combat a valider
  selon le rythme du combat ». **À régler** à l'essai.
- La ville modifie toujours le prochain duel (contrat projet § 6.3) : l'arme et ses améliorations, les accessoires, les compétences apprises,
  les blessures, et l'information sur l'adversaire.
- Complété par la séance, approuvé avec le texte (CB-1) : la lame trempée, la pierre à aiguiser et l'entraînement d'aujourd'hui deviennent des améliorations de l'arme et des sources de
  compétences.

## 9. La lecture à l'écran

- **L'aide** [G5] : « discret mais avec une legere alerte surtout pour les competences ». Le défaut reste discret : des signes sur
  l'adversaire, plus une légère alerte avant ses compétences.
- **Ce que le HUD montre** [CB-6, « Comme recommandé »] : les PV et la jauge de résistance des deux combattants (celle de l'adversaire est sa
  « barre de break »), les PA du joueur et ses quatre compétences avec leur coût. Les compétences de l'adversaire ne s'affichent pas : elles
  s'annoncent par l'alerte.
- **L'aide et le repérage** [CB-7, « Comme recommandé »] : le défaut, discret avec l'alerte légère, vaut pour tout le monde. « Complet » et
  « aucun » restent dans les réglages, pour l'accessibilité. Repérer l'adversaire en ville ne donne plus l'aide complète : cela donne des
  informations sur lui (son style, ses compétences) à l'écran de préparation.
- Le style suit la direction de l'interface (C « Héraldique pixel », Passe UI1).

## 10. Les équipes (plus tard, hors tranche)

[G4] : « Pour plus tards ce sera plutot, un concept de switch pour le joueur pour qu'il choissiseent son personnage actuel et avec un bouton il
change pour un autre... pour les adversaires soit tous les adversaires ou pareil un adversaire actif avec switch mais je prefere tous les
adversares max 3 ».

- **Le côté du joueur** : un personnage actif, changé par un bouton.
- **Le côté adverse** : tous les adversaires actifs à la fois, trois au plus. C'est la préférence de l'opérateur ; l'alternative serait un
  adversaire actif, avec changement lui aussi.
- **Ce qu'il faut pour l'avenir** : le moteur reste prêt pour plusieurs combattants (contrat projet § 6.1), avec des camps en listes (la fiche de
  match les a déjà, E17).
- **À définir avec l'opérateur, à la phase d'équipe** : la priorité quand plusieurs adversaires attaquent.

## 11. Ce qui est laissé à l'essai

| Point | Fourchette ou option | Source |
|---|---|---|
| PA maximum | 4 ou 5 | [G4] |
| PA rendus avec le temps | un toutes les 5 à 10 s, seulement si les PA manquent | [G5] |
| Recharge des compétences | aucune ; à ajouter « si on juge que le jeu est pas assez structure » | [G5] |
| Action objet en combat | 3 compétences + une action objet, « selon le rythme du combat » | [G4] |
| Esquive | un pas en arrière ou un saut de côté | [G5] |
| Durée d'un duel | 5 à 10 min, par les PV et la complexité de l'adversaire | [G5] |
| Break | 5 à 10 s d'étourdissement, dégâts « légèrement » accrus | [G3] |
| Compétences signature | une animation propre au personnage, « eventuellement » | [G5] |

## 12. Écarts avec le code d'aujourd'hui (`src/arena/CombatSim.ts`, `src/combat/`)

| Aujourd'hui | Cette spécification |
|---|---|
| Le coup puissant sur une garde la brise : étourdi 2,4 s, 100 % | Plus de bris direct ; la jauge de résistance monte plus vite [G5] |
| Aucune jauge de résistance | Une jauge par combattant, une seule règle ; break de 5 à 10 s, puis retour à zéro |
| Le joueur peut frapper pendant les attaques adverses | Phase de défense : garder ou esquiver ; une attaque tentée ne part pas [G3] |
| Tourbillon étourdit 1 s et interrompt | L'adversaire n'est pas interrompu pendant ses séquences [G1, G3] |
| Quatre techniques fixes, avec PA et recharge (4 à 14 s) | Quatre emplacements choisis avant le duel, en familles offensive / défensive / soutien ; PA sans recharge [G2, G4, G5] |
| L'attaque puissante ne coûte rien, sans « délai » nommé | Pas de coût ; un délai de préparation automatique [G2, G4] (la charge de 0,5 s en tient lieu aujourd'hui) |
| Ennemi : rapide + puissant seulement ; ni garde, ni esquive, ni compétence ; repos de 5 à 10 s | Garde et esquive pour certains, 2 à 4 compétences, pauses plus courtes selon le niveau [G1, G3] |
| Duel d'environ 30 s (bot compétent, prototype) ; joueur 200 PV, Marek 800 | 5 à 10 minutes : les PV et les dégâts sont à refaire [G5] |
| Le repérage de l'adversaire donne l'aide complète (`matchSheetFor`) | Aide discrète + alerte légère pour tous [G5] ; le repérage donne des informations à l'écran de préparation [CB-7] |
| 3 PA au départ | 1 PA au départ [CB-5] |
| Hors écran : course aux dégâts tirée de `CombatSim` (E6) | À recalculer sur les nouvelles règles |
| L7-4 « modéré » : réglage de PV / dégâts des rivaux actuels | Intégré à C1 / C3, sur le nouveau système [CB-11] |
| Jeu d'images de l'arène (`FighterArt.ts`) : 12 clips, 29 images pour Ren | La liste du § 14 |

## 13. Écarts avec les contrats ; décisions qui touchent un verrou

- **E1 / E16** : le contrat projet (§ 1 « RPG narratif au tour par tour », § 6.1 « Le combat est un RPG tour par tour ») et le contrat gameplay
  (§ 1 « combat tour par tour ») ne décrivent pas ce système.
  - L'opérateur, sur l'amendement : « Je te laisse gerer mais il est sur qu'il faut mettre a jour au besoin afin de commencer sur une base
    saine » [G5].
  - C'est une décision A3 (E11, « A3 = ma décision citée mot pour mot au journal »). Sur la fiche, l'opérateur a choisi [CB-8] : « Amender
    maintenant, ces trois phrases ». Elles sont remplacées dans le versement de cette spécification ; le reste des contrats ne change pas :
    - projet § 1 : « Cité du Tournoi est un RPG narratif au tour par tour centré sur… » devient « Cité du Tournoi est un RPG narratif au combat
      en « tour par tour dynamique » centré sur… » ;
    - projet § 6.1 : « Le combat est un RPG tour par tour dont le format de départ est 1 contre 1. » devient « Le combat est un « tour par tour
      dynamique » dont le format de départ est 1 contre 1 : le temps ne s'arrête pas ; le joueur agit par des actions instantanées ou à délai de
      préparation, les compétences payées en points d'action ; l'adversaire a la priorité quand il attaque, et le joueur se défend alors par la
      garde ou l'esquive (spécification : briefs/combat-system.md). » ;
    - gameplay § 1 : « 1. combat tour par tour ; » devient « 1. combat en « tour par tour dynamique » (contrat projet § 6.1) ; ».
  - L'écart E1 / E16 est ainsi clos. L'amendement E14 / E15 (la génération par le code) reste une tâche à part.
- **Ce qui reste conforme** :
  - le 1 contre 1 d'abord (verrous gameplay 1-2, tournoi 1) ;
  - le moteur extensible vers l'équipe (projet § 6.1 ; § 10 ici) ;
  - la préparation qui modifie le combat (projet § 6.3 ; § 8 ici) ;
  - la progression en couches, sans une seule statistique de niveau (projet § 7 : compétences, arme, accessoires) ;
  - le headless et le déterminisme (gameplay § 12, tournoi § 7) : la règle reste une simulation pure, à pas fixe, avec une graine ;
  - les matchs hors écran tirés du même modèle (tournoi § 6, E6) : à recalculer.
- **Le contrat de combat** : le projet § 17 prévoit un `COMBAT_MASTER_CONTRACT.md` « lors de la mise en production ». Décidé [CB-9, « Plus
  tard, après l'essai »] : il s'écrira après C3 et l'essai de l'opérateur en jeu ; d'ici là, cette spécification fait référence.

## 14. Les animations par combattant (pour la chaîne du héros, AA1-1 / AA1-2)

**Principes**
- Une animation par **famille** de compétences, et « eventuellement des competences signature qui auront leur propre aniimation, animataeur
  propre au personnage » [G5].
- L'attaque légère est un seul coup [G5].
- La garde qui encaisse, la résistance brisée, le K.O. à terre et la victoire, « oui mais restons simple » [G5].

**Comment le moteur lit une feuille**
- Les clés d'images sont `<id>/side/<clé>.<i>/0`. Le personnage est de profil, **tourné à gauche** ; le miroir donne l'autre côté.
- Le moteur n'a pas de durée par image : il choisit l'image d'après l'horloge de la simulation, autour de l'**image d'impact**
  (`clipFrame`, `IMPACT_FRAME`).
- Les durées ci-dessous sont celles des nombres provisoires d'aujourd'hui. Elles changeront au réglage, mais le nombre d'images et l'image
  d'impact restent.
- Une image « tenue » couvre un délai de durée libre : la préparation automatique, la garde, l'étourdissement.

**Ren = `hero-x2-v4`** (même liste pour Vessa ; Marek aussi, à ses exceptions près, plus bas)

| Clé | Moment | Images | Boucle / durée (aujourd'hui) | Impact | Découpage (t = horloge de l'animation, i = instant d'impact) |
|---|---|---|---|---|---|
| `idle` | repos (avant et après le duel ; pause de l'adversaire) | 2 | boucle, 1,7 s | — | alternance |
| `ready` | posture de combat | 2 | boucle, 1,7 s | — | alternance |
| `strike` | attaque légère, un coup | 3 | ≈ 0,58 s (0,20 + 0,16 + 0,22) | 1 | 0 armé (t < 0,85 i) · 1 frappe (jusqu'à i + 0,07) · 2 suite |
| `heavy` | attaque puissante, délai de préparation | 4 | délai + ≈ 0,6 s (aujourd'hui i = 0,50) | 2 | 0 préparation, tenue pendant le délai · 1 armé (dernières ≈ 0,16 s) · 2 frappe (jusqu'à i + 0,11) · 3 suite |
| `skillOff` | compétence offensive (famille) | 4 | délai + ≈ 0,5 s | 2 | 0 préparation (lueur), tenue · 1 élan · 2 frappe · 3 suite |
| `skillDef` | compétence défensive (famille) | 3 | délai + effet | 1 | 0 préparation, tenue · 1 effet (posture, protection) · 2 retour |
| `skillSup` | compétence de soutien (famille) | 3 | délai + effet | 1 | 0 préparation, tenue · 1 effet (lueur sur soi) · 2 retour |
| `block` | garde tenue ; garde qui encaisse | 2 | tenue | — | 0 garde (tant qu'elle est tenue) · 1 encaisse (≈ 0,14 s après un coup gardé) |
| `dodge` | esquive (en arrière ou de côté, à l'essai) | 2 | ≈ 0,45 s | — | 0 impulsion (t < 0,2) · 1 reprise |
| `hit` | coup reçu (et « repoussé ») | 2 | ≈ 0,28 s | — | 0 choc (t < 0,12) · 1 reprise |
| `recover` | résistance brisée : étourdi 5 à 10 s | 2 | boucle, ≈ 2,5 s | — | alternance (tête basse, souffle) |
| `ko` | K.O., jusqu'à terre | 3 | tenue à la fin | — | 0 chute (t < 0,25) · 1 à genoux (t < 0,6) · 2 à terre |
| `victory` | victoire | 2 | boucle, 1,4 s | — | alternance |
| **Total** | | **34** | | | |

**Ce qui change par rapport au jeu d'images d'aujourd'hui (29 images)**
- `skill` devient `skillOff` (4 images) ; `skillDef` et `skillSup` sont nouvelles ; `slash` disparaît chez Ren (Tourbillon devient une
  compétence offensive).
- `ko` va jusqu'à terre (3 images).

**La feuille de Ren** (`hero-x3-combat`, ×3, labo, journal Passes RC1 et RC2) : les 34 images de cette liste. Derrière
`?scene=arena&fighterdensity=combat` (DEV), le duel les joue sur ses propres moments : les techniques d'aujourd'hui (`skill`, et `slash` de
Tourbillon) et les compétences offensives sur `skillOff`, Rempart sur `skillDef`, Ferveur sur `skillSup`, chacune avec le découpage du tableau ;
l'esquive est un pas en arrière (C2-7). Fiche RC2 : « Complète : la garder en labo comme base » ; la coupe « La garder ; reprise dédiée plus
tard » ; la lame « Deux texels d'acier et un bord sombre (comme fait) » ; le bord, une règle du rendu, « Confirmé » ; la production « Pas encore :
avec la feuille de Marek ».

**Marek** (puis tout rival)
- La même liste.
- `block` et `dodge` seulement si le rival garde ou esquive [G3].
- `skillOff`, `skillDef`, `skillSup` seulement pour les familles de ses 2 à 4 compétences [G3].
- Son attaque légère devient `strike` (aujourd'hui `slash`).
- Minimum, pour un rival sans défense et aux compétences offensives seules : 24 images ; complet : 34.

**Compétences signature** (plus tard, optionnelles) : `sig<Nom>`, 4 images (préparation tenue, élan, frappe, suite ; impact 2), une par
compétence signature d'un personnage.

**Avec chaque feuille**
- un portrait de face (le visage de la feuille cuite, L4) ;
- une couche émissive pour les traînées et la lueur des compétences, ou des effets à part ;
- la pointe de la lame dans la silhouette, que le moteur mesure (`reach`) ;
- un manifeste approuvé par l'opérateur.

**Place dans la texture**
- À ×2, l'atlas de l'arène garde environ 131 cases pour les deux combattants d'un duel. Deux combattants complets (34 + 34) y tiennent, avec
  de la place pour quelques compétences signature.
- À ×4 (l'essai de densité AA1-3), une texture prend 40 cases : il faudra une texture par combattant.
- **Décidé (Passe AA2, AA2-1 « ×3 »)** : les feuilles se font à ×3 (cases de 192 × 288 texels). Une texture de 2 048 en prend 70 : Ren et Marek
  complets (68) y tiennent, avec 2 cases libres ; les compétences signature demanderont une seconde texture ou des cases ajustées à la figure.

## 15. L'ordre de mise en œuvre (choisi par la séance, sur délégation de l'opérateur)

L'opérateur [G5] : « je te laisse la liberte de choisir selon ce que tu penses le plus judicieux ». Chaque tâche a sa propre séance et sa propre
branche. Pendant le travail, les nouvelles règles restent derrière un paramètre, et l'arène d'aujourd'hui reste le défaut à 0 px. Le défaut
change après l'essai de l'opérateur en jeu [CB-10, « Derrière un paramètre, défaut après mon essai »].

1. **C1 — Le cœur du duel**, simulation pure et headless, avec ses tests et ses fautes injectées :
   - la jauge de résistance et le break ;
   - la garde sans bris direct ;
   - la phase de défense, la priorité et le « repoussé » ;
   - le délai de préparation ;
   - les PA (les compétences et l'esquive les dépensent, aucune recharge) ;
   - le K.O. seul ;
   - quatre emplacements de compétences, avec les quatre techniques d'aujourd'hui rangées en familles et au moins une défensive et une de soutien ;
   - les pauses de l'adversaire selon son niveau ;
   - les PV et les dégâts pour 5 à 10 minutes ;
   - le bot et la résolution hors écran recalculés (E6).

   C'est le socle : tout le reste en dépend, et il fixe les durées que dessineront les feuilles.
2. **C2 — L'arène montre C1** :
   - les jauges et l'alerte légère au HUD ;
   - les clips d'aujourd'hui branchés sur les nouveaux moments ;
   - le paramètre de comparaison avec l'ancien combat.

   Puis **l'essai de l'opérateur en jeu** : il règle les points du § 11 et décide du défaut.
3. **C3 — Les adversaires** :
   - garde et esquive des rivaux « sophistiqués » ;
   - 2 à 4 compétences selon le niveau ;
   - les sept profils et Marek / Vessa refaits sur ce modèle ;
   - l'équilibrage (L7-4 y est intégré, CB-11).
4. **C4 — Le choix des compétences** :
   - les compétences obtenues par achats, entraînement et duels en ville ;
   - le choix de quatre avant le duel (fiche de match, écran de préparation).
5. **C5 — L'arme et les accessoires** : arme prédéfinie améliorée (statistiques et effets), 2 ou 3 emplacements d'accessoires ; la lame trempée, la
   pierre et l'entraînement d'aujourd'hui y passent.
6. **Les feuilles de combat** (étape 1 de la feuille de route) :
   - Ren = `hero-x2-v4` dès que C1 et C2 ont fixé les durées et que l'essai de densité (AA1-3) a choisi ×2 ou ×4 ;
   - puis Marek, puis Vessa (AA1-2).
7. **Plus tard** :
   - les équipes (le changement de personnage, trois adversaires au plus) ;
   - les options du § 11 : PA avec le temps, recharges, action objet ;
   - les compétences signature ;
   - des effets d'état, si l'arme ou les compétences en demandent (« autre statut handicapant », G1).

## 16. Les décisions de la fiche (25/10/2026)

Fiche d'arbitrages de l'atelier, page privée https://claude.ai/artifact/97p5rqdpTgrqLNLcsBXVNi, collection `decisions`, relue après
« La fiche du combat est remplie. » : 11 documents sur 11. « = » : la recommandation de la fiche est suivie ; « ≠ » : le choix diffère.

| # | Décision | Choix de l'opérateur, mot pour mot | Note | |
|---|---|---|---|---|
| CB-1 | La spécification | « Approuvée » | — | = |
| CB-2 | La liste des animations | « Approuvée pour Ren, puis Marek et Vessa » | — | = |
| CB-3 | Une action lancée juste avant une attaque adverse | « Annulée, PA rendus » | — | = |
| CB-4 | Jusqu'où va la phase de défense | « Toute la séquence, intervalles compris » | — | = |
| CB-5 | Les valeurs de départ | « D'autres valeurs (ma note) » | « 1 par defaut » | ≠ |
| CB-6 | Ce que montre le HUD | « Comme recommandé » | — | = |
| CB-7 | L'aide complète et le repérage | « Comme recommandé » | — | = |
| CB-8 | Amender « tour par tour » (décision A3) | « Amender maintenant, ces trois phrases » | — | = |
| CB-9 | Le contrat de combat | « Plus tard, après l'essai » | — | = |
| CB-10 | Le combat par défaut pendant la mise en œuvre | « Derrière un paramètre, défaut après mon essai » | — | = |
| CB-11 | L'équilibrage « modéré » (L7-4) | « Intégré à C1 / C3 » | — | = |

CB-5 : la note se lisait de deux façons. À la question « Sur CB-5, votre note dit « 1 par defaut ». Quelle valeur passe à 1 ? »,
l'opérateur a répondu « Les PA au départ » (l'option disait : « Le duel commence avec 1 PA au lieu de 3 ; les autres valeurs restent un
point de départ, à régler à l'essai. »).

---

## 17. Les décisions de l'essai C2 (26/10/2026)

Fiche de l'essai du lot C2, page privée https://claude.ai/artifact/2BFmUTe6GFRAjq92TEHNPc, collection `decisions`, relue après « done » :
16 documents sur 16, tous à la recommandation, sans note (journal Passe C2F).

| # | Décision | Recommandation | Choix de l'opérateur | Note | |
|---|---|---|---|---|---|
| C2-1 | Le nouveau duel devient-il le défaut ? (CB-10) | « Pas encore : après C3 et un second essai » | « Pas encore : après C3 et un second essai » | — | = |
| C2-2 | La durée des duels | « Comme mesurées (5 à 9 min) » | « Comme mesurées (5 à 9 min) » | — | = |
| C2-3 | Le maximum de points d'action | « 5 PA » | « 5 PA » | — | = |
| C2-4 | Un PA rendu avec le temps | « Aucun » | « Aucun » | — | = |
| C2-5 | Les recharges des compétences | « Aucune » | « Aucune » | — | = |
| C2-6 | L'action objet en combat | « Plus tard (C4 / C5) » | « Plus tard (C4 / C5) » | — | = |
| C2-7 | La direction de l'esquive | « En arrière » | « En arrière » | — | = |
| C2-8 | La jauge de résistance | « Comme aujourd'hui » | « Comme aujourd'hui » | — | = |
| C2-9 | Le break : étourdissement et dégâts | « 6 s, ×1,2 » | « 6 s, ×1,2 » | — | = |
| C2-10 | Rempart et Ferveur | « Les garder » | « Les garder » | — | = |
| C2-11 | Ce que montre le HUD (CB-6) | « Approuvé » | « Approuvé » | — | = |
| C2-12 | Le signe de la priorité dans l'aide discrète | « Dans l'aide discrète » | « Dans l'aide discrète » | — | = |
| C2-13 | La barre d'actions dans une fenêtre étroite | « Accepter » | « Accepter » | — | = |
| C2-14 | L'écran de chargement | « Tâche à part » | « Tâche à part » | — | = |
| C2-15 | Le téléphone tenu droit | « Le garder » | « Le garder » | — | = |
| C2-16 | La page publiée de l'ancienne arène | « La republier » | « La republier » | — | = |

Le défaut reste l'arène d'aujourd'hui jusqu'à C3 et un second essai ; les nombres d'aujourd'hui (§ 3, § 6) sont tenus ; l'esquive est en
arrière (§ 14 : `dodge`) ; Rempart et Ferveur restent les familles défensive et soutien.

---

## Annexe A — Les réponses de l'opérateur, mot pour mot (25/10/2026)

Recopiées depuis la conversation de l'atelier. Les questions et le contexte sont dans le journal (Passe CB1). Une seule retouche : le chemin
local de l'ancien projet (G1), qui contient le nom d'utilisateur de la machine, est remplacé entre crochets (aucun chemin de machine dans le
dépôt public, `AGENTS.md`).

**G1** (le modèle et la boucle) :

> pour faaire simple j'ai travaille sur  un ancien projet : [chemin local retiré du dépôt : le dossier `Unity\MyGame\Assets\game\Base\Battle` de ses projets]
>
> Il propose une tour par tour dynamique... et ou chaque actions demandent un temps de chargement pour exexcuter, une garde pour se proteger et donc on est confronte 1-N enemies.
>
> Dans notre cas on reprendre ce concept avec comme modification... ajout des Points d'actiion, l'esquuive, une garde, et surtout des combats d'attaques de notre adversaire, donc il pourrait faire plusieurs cooups de suite, et on devra esquiver ou etre en garde, on dirait meme une inspiration de expedition 33 sauf que nous on est toujours actif dans le combat pas de temps de pause. l'adversaire IA a la priorite donc quand ll attaque rien ne l'empeche et si on a le meme timing d'attaque que lui on peut etre repousser.
> le systeme de combat doit etre simple 2 aactions de defense : esquive (utilise les points d'action PA), garde ( utilise pas les PA mais subit des degats reduit et peut parfois etourdir selon l'attaque ). 2 attaques simples : leeger (accumule des PA) et puissante (propose une attaque puissante et peut etourdir parfois si jauge de resistance est brise ), et 4 competences speciales ( offensive, defensive, soutien)
> le processus de combat est simple, donner le plus de cooup possible pour briser la resistance de l'adversaire et lancer des actions devastratrice mais aussi esquiper les attaques et combos des adversaires et donc bien gerer ces AP, les adversaires marquent tout de meme un temps de pauuses meme si cela sera reduit selon le niveau de l'adversaire rendant presque le combat full actif

**G2** (les actions) :

> tu peux oublier ces cas les touches seront instantanee pour le joueur, juste donc pas de charge ni garde specia et pas de transe.
> a la place de charge, par exemple l'attaque lourde ou les competences auront un temps de delai ( preparation auto ) avant de lancer ce qui fait naturellement perdre du temps
>
> [jauge de résistance, quels coups] tous les cousps
>
> [remonte-t-elle, le joueur a-t-il la sienne] Oui pour le joueur dans certains cas, si il tappe, ou esquive elle peut baisser par exemple, a confirmer
>
> [les compétences] pour notre heros il peut les chosiri avant le duel donc on aura un systeme de changement de competences par exemple
>
> [la priorité] Oui IA a toujours la priorite vu qu'il n'attaque pas tout le temps, donc quand il attaque ( si pas etourdi ou autre statut handicapant ) il attaque sans etre interrompu et donc le joueur est dans sa phase de defense
>
> [la garde] la garde etourdit le joueu mais on pourrait aussi mettre une jauge de resistance cmme pour l'adversaire... si le joueur est en garde ou prend naturellement des coups, la jauge monte aisni cela reste coherent

**G3** (la résistance, la défense, l'adversaire, la fin) :

> [une seule règle] Oui une seul regle me va
>
> [résistance brisée] un etourdissement de 5-10s, degats legerement accrus .... le but est de donner  un avantage sans briser le combat
>
> [phase de défense] oui seulement garder et esquiver, il peut tenter d'attaquer maiis aucune execution se fera et il se prendra des degats car l'adversaires sera toujours en pleine execution
>
> [l'adversaire] oui certains adversaires sophistiques et special peuvent garder, esquiver voir les deux .
> et presque tous les adversaires auront aussi leur propres competences entre 2-4 competences mais la encore ca dependra du niveau de l'adversaire
>
> [la fin d'un duel] Fin du duel

**G4** (fin, ressources, préparation, équipes) :

> [fin] Oui KO pour la fin du duel
>
> [la jauge du joueur] elle peut baisser legerement et progressivement avec le temps pour faire simplle
>
> [PA] oui les competences coutes des PA, attaque lourd et simple ne coute rien  au max on peut dire 4-5 PA max ( a determiner sur ce qui adapte bien la coherence du jeu )
>
> [préparation] achats, entrainement, duel en ville, arme predefini avec amelioration (stats-effets) et 2-3 slot d'accessoires, objet en coombat pas prevu mais on peut aussi faire 3 competences + action object dispo en combat a valider selon le rythme du combat
>
> [équipes] Pour plus tards ce sera plutot, un concept de switch pour le joueur pour qu'il choissiseent son personnage actuel et avec un bouton il change pour un autre... pour les adversaires soit tous les adversaires ou pareil un adversaire actif avec switch mais je prefere tous les adversares max 3

**G5** (les points ouverts, l'écran, les animations, les contrats, l'ordre) :

> [durée] 5-10min selon la complexite de l'adversaire et ces points de vie
>
> [après l'étourdissement] Oui surtout pour l'adversaire c;est une barre de break
>
> [actions dévastatrices] oui il y a pas de conpetences speciales pour le moment peut etre plus tard mais actions devastatrices n'est pas employable nous utilisons nos actions definies
>
> [recharge] Non pas prevu mais cela peut etre integre si on juge que le jeu est pas assez structure
>
> [gain de PA] Oui on pourrait faire en sorte que toutes les 5-10s on recupere un AP aussi si on juge que ce n;est pas suffisant
>
> [coup lourd sur une garde] seulement monter la jauge plus vite
>
> [l'écran] discret mais avec une legere alerte surtout pour les competences on va dire mais comme cela ne brise pas et rrend direct etourdi on a plus de marge
>
> [animations par famille] tout dependra mais j'aimerai une meme famille, et eventuellement des competences signature qui auront leur propre aniimation, animataeur propre au personnage
>
> [attaque légère] un seul coup prevu
>
> [esquive] les deux me vont a voir celui qui s'adapte le mieux
>
> [garde, break, K.O., victoire] oui mais restons simple
>
> [contrats] Je te laisse gerer mais il est sur qu'il faut mettre a jour au besoin afin de commencer sur une base saine
>
> [ordre de mise en œuvre] je te laisse la liberte de choisir selon ce que tu penses le plus judicieux
