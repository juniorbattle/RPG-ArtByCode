# L'essai du « tour par tour dynamique » — guide de l'opérateur (lot C2, 25/10/2026)

Le lot C2 de `briefs/combat-system.md` (§ 15) met le nouveau duel dans l'arène, derrière son paramètre (CB-10, « Derrière un paramètre, défaut
après mon essai ») : l'arène et le tournoi d'aujourd'hui restent le défaut. Ce guide sert à votre essai en jeu, qui règle les points du § 11 et
décide du défaut. Vos retours et vos décisions vont sur la fiche d'arbitrages de la Passe C2 (journal).

**Fait (26/10/2026)** : la fiche est remplie et consignée (journal Passe C2F, `briefs/combat-system.md` § 17) : 16 choix sur 16 à la recommandation ;
le défaut attend C3 et un second essai.

## Les adresses

Sur votre machine : `npm run dev`, puis http://127.0.0.1:5173/ suivi de l'une de ces adresses.

| Pour | Adresse |
|---|---|
| **Le nouveau duel** (Ren contre Marek, HUD en français, R pour recommencer) | `?scene=arena&combat=dynamic` |
| Le même, de jour | `?scene=arena&combat=dynamic&time=midday` |
| L'ancien duel, pour comparer | `?scene=arena` |
| Une partie entière sous les nouvelles règles (en anglais ; duels contre Vessa au jour 2, contre Marek au jour 3) | `?play=1&new=1&combat=dynamic&name=Ren` |
| Directement au duel contre Vessa (serveur de développement seulement) | `?play=1&state=day2-afternoon&scene=arena&combat=dynamic` |
| Directement au duel contre Marek (idem) | `?play=1&state=day3-afternoon&scene=arena&combat=dynamic` |

Sans serveur : la page privée de l'essai, https://claude.ai/artifact/HnfCTWXSggDVVyVUskTBJK (« Arène de l'essai C2 »), joue le nouveau duel
avec les nombres par défaut. Vos retours et vos décisions : la fiche https://claude.ai/artifact/2BFmUTe6GFRAjq92TEHNPc.

**Les réglages de l'essai** (les nombres du § 11, sans toucher au code) : ajoutez `&dyn=` et des paires `clé:valeur` séparées par des virgules,
par exemple `?scene=arena&combat=dynamic&dyn=apMax:4,apRegen:8,level:4`. Une valeur hors de sa plage arrête la page avec un message.

| Clé | Ce qu'elle règle | Défaut | Plage |
|---|---|---|---|
| `apMax` | PA au plus | 5 | 3 à 6 |
| `apStart` | PA au début du duel | 1 (CB-5) | 0 à `apMax` |
| `apRegen` | un PA rendu toutes les N secondes (0 = aucun) | 0 | 0, ou 2 à 20 |
| `gauge` | taille de la jauge de résistance | 100 | 40 à 300 |
| `decay` | ce que le temps retire de la jauge par seconde | 1,8 | 0 à 10 |
| `stun` | durée de l'étourdissement du break (s) | 6 | 3 à 12 |
| `breakDmg` | dégâts reçus pendant le break (× ) | 1,2 | 1 à 2 |
| `guard` | part des dégâts que la garde retire | 0,6 | 0 à 0,9 |
| `level` | niveau de l'adversaire : ses pauses (1 longues, 5 courtes) | Marek 3 | 1 à 5 |
| `foeHp` / `renHp` | points de vie de l'adversaire / de Ren | 8 000 / 2 200 | 100 à 50 000 |

Autres paramètres utiles : `&assist=full` (le télégraphe au sol, l'alerte et la barre de la fenêtre d'esquive) ou `&assist=off` ; `&hud=0` ou
H pendant le duel (sans HUD) ; Espace (pause).

## Les touches

| Touche | Action | Ce qu'elle coûte |
|---|---|---|
| **1** | attaque légère, instantanée | rien ; +1 PA quand elle porte |
| **2** | attaque puissante, avec une préparation automatique (0,34 s) | rien ; remplit la jauge adverse plus vite |
| **3** | Coup éclair (offensive) | 2 PA |
| **4** | Estocade du champion (offensive, longue préparation) | 4 PA |
| **5** | Rempart (défensive : 6 s de dégâts et de résistance reçus réduits) | 2 PA |
| **6** | Ferveur (soutien : 8 s de dégâts et de résistance portés accrus) | 3 PA |
| **B** (tenue) | garde : −60 % de dégâts, sans bris, mais votre jauge monte | rien |
| **A** | esquive, dans la fenêtre de l'attaque adverse | 1 PA |

Manette : A esquive, B garde, X / Y légère / puissante, gâchettes et bumpers les quatre compétences, Start pause.

## Ce qu'il faut regarder

- **La priorité de l'adversaire** (CB-4) : dès que Marek commence une séquence, le signe « Marek attaque · Garde ou esquive » paraît en haut, les
  attaques et les compétences s'assombrissent ; une touche d'attaque ne part pas (le bouton tremble, le signe aussi). La garde et l'esquive restent.
- **Le « repoussé »** (CB-3) : lancez la puissante ou une compétence juste avant une séquence : elle est annulée, Ren recule et prend le premier
  coup, ses PA sont rendus (« Repoussé · 4 PA rendus »).
- **La préparation** : la puissante et les compétences allument leur bouton et remplissent un trait ambré à son pied avant de partir ; « Préparation »
  s'écrit sous la carte de Ren.
- **Les jauges** : sous les PV, « Résistance » (la vôtre) et « Break » (celle de Marek). Pleine, c'est le break : « Brisé · 6 s », la jauge
  clignote, le temps qui reste se grise ; « Marek brisé — frappez ! ». La vôtre se remplit aussi en garde.
- **Les PA** : un au départ, un par attaque légère qui porte ; les losanges ambrés sous la carte de Ren. Le coût de chaque compétence est sous son nom.
- **Rempart et Ferveur** : une étiquette « Rempart 6 s » ou « Ferveur 8 s » sous votre carte, le bouton bordé de bleu tant qu'ils durent.
- **La durée du duel** : 5 à 9 minutes pour un duel joué avec soin (mesuré par le bot, Passe C1).

## Les points du § 11 à juger

Le maximum de PA (4 ou 5), le PA rendu avec le temps, les recharges des compétences, l'action objet, l'esquive en arrière ou de côté, la taille et
la vitesse de la jauge, le break (durée, surplus de dégâts), la durée réelle des duels ; puis le défaut (CB-10).

## Ce que C2 ne fait pas encore

- Marek n'a ni garde, ni esquive, ni compétence (C3) : l'alerte légère « surtout pour les compétences » n'a pas encore de compétence à annoncer ;
  le signe de la séquence en tient lieu.
- Les quatre compétences sont fixes (le choix avant le duel est C4) ; l'arme et les accessoires sont C5.
- Les combattants gardent leurs images générées d'aujourd'hui (AA1-6 « Non, attendre les feuilles ») : une compétence offensive joue
  l'attaque `skill`, Rempart la garde, Ferveur la lame levée de la victoire ; les feuilles de combat (§ 14) viendront après l'essai.
