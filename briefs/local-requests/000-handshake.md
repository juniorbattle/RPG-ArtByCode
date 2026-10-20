# Requête locale 000 — handshake
- Type : autre
- Lot : L0
- Branche et commit de base : claude/pensive-pasteur-lbz4ji @ d129433
- Demande : confirme le relais et donne l'état de la machine locale : Aseprite, clé OpenAI présente ou non, GPU.
- Entrées : aucune. Commandes suggérées : `npm run art:doctor` ; `node tools/art-lab/gen-image.mjs --spent` (sans rien envoyer) ; l'adaptateur
  WebGL rapporté par `node tools/perf.mjs --secs=1 --rounds=1 "b|seed=1842&clean=1&camera=B"` sur ce commit.
- Sorties attendues : la réponse ci-dessous (Aseprite oui / non et sa version ; clé OpenAI présente oui / non, jamais sa valeur ; le GPU et son
  pilote ; la date et l'heure de la réponse).
- Repli si elle n'aboutit pas : la séance cloud continue sans relais ; images, feuilles cuites et temps GPU sont inscrits au bilan comme à faire
  en local.
- Statut : ouverte

## Réponse
(écrite par la séance locale)
