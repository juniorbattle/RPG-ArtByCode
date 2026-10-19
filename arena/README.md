# Arène des Champions — prototype de combat (HD-2D)

Prototype jouable de l'arène de Cité du Tournoi, fait dans une autre conversation (« Visual direction exploration for Cité du Tournoi ») :
arène procédurale HD-2D (ville en silhouettes, reflets au sol, brume), combat à points d'action, garde et esquive, IA de Marek en séquences,
HUD allégé et signaux d'attaque discrets. Un seul fichier HTML, Three.js r128 (cdnjs) et Google Fonts chargés par la page, tout le reste
(décor, sprites, effets) est dessiné par le code au démarrage. **Il ne fait pas partie du jeu ni de son build** (Vite ne construit que
`index.html`).

**L'arène du jeu** est `?scene=arena` (`src/arena/`, journal, Passe P1) : la simulation de ce prototype portée en TypeScript (prouvée contre
lui par `tests/arena-sim.test.mjs`, qui lit son script dans `arena.html`), mise en scène avec le rendu, les matériaux, les maisons et la
lumière du Merchant District, des combattants générés par les règles du générateur de sprites de la ville (×2) et un HUD au style du jeu. Ce
dossier reste la référence des règles et des moments scriptés.

- `source/arena-prototype.served.html` : la page publiée, **à l'octet** (enveloppe du service d'artefacts comprise), seule source restante
  du projet (le dossier source a été perdu, opérateur, 19/10) ; fiche `source/arena-prototype.source.json` (URL, version, SHA-256,
  dérivation) ; `source/runtime-bakeoff-report.txt` : le texte du rapport technique de ce prototype (passes 1 à 11, règles, mesures, limites).
- `arena.html` : le prototype lui-même, repris de la page publiée (l'enveloppe retirée, preuve dans la fiche), puis adapté à la direction
  artistique du Merchant District (journal, Passe A1). `git log -p arena/arena.html` montre chaque changement depuis l'original.
- Ouvrir : servir le dossier (`npx vite arena` ou tout serveur statique) puis `arena.html` ; `?mode=hd2d|hybrid|full3d`, `?clean=1` (sans
  panneau), `?devtest=1` (banc de mesure sur appareil réel). Touches : 1-6 attaques et techniques, A esquive, B garde (maintenir), R
  recommencer, Espace pause, H panneau, L atelier des sprites.
- Captures : `node tools/arena-shots.mjs <dossier> arena/arena.html "nom|moment|js" ...` (moments scriptés du prototype : `charging`,
  `window`, `combo`, ... ; voir l'en-tête de l'outil) ; contrôles : `node tools/arena-check.mjs arena/arena.html` (empreinte de la
  simulation, chaque moment dans chaque mode sans erreur, contraste du télégraphe >= 2:1).
- Version publiée (artefact privé de l'opérateur) : https://claude.ai/artifact/3w7wmerkBRUFACTm2Y9xCh ; la page se refait avec
  `node tools/arena-page.mjs arena/arena.html <page.html>` (le service d'artefacts ajoute son propre squelette de document).
