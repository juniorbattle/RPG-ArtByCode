# Cité du Tournoi — TOURNAMENT MASTER CONTRACT

> **Provenance** (journal, Passe N2). L'opérateur a fourni ce contrat dans son message à la séance de la Passe H11. Il y figurait deux fois ;
> cette séance ne l'a transmis qu'une fois à la séance de planification de la séance cloud, le 2026-10-20. Il est versionné ici sur la
> décision C1 (« contracts/ à la racine (versionnés, donc publiés) »).
> - Le texte reçu était à plat. Seule la mise en forme change : un paragraphe par section, l'en-tête en titre, l'interface en bloc de code.
>   Aucun mot n'est changé.
> - L'en-tête entre parenthèses peut être un résumé fait par la séance de transmission : s'il diffère, l'original de l'opérateur fait foi.
> - Ce contrat se dit subordonné au contrat projet, `contracts/PROJECT_MASTER_CONTRACT.md`, que l'opérateur fournit avant le lancement de la
>   séance cloud (décision C2).
> - La « décision A3 » du verrou 10 n'est définie nulle part dans le dépôt. Jusqu'à ce qu'elle le soit, aucun verrou n'est modifié et chaque
>   écart est consigné (décision C3).

(Version 1.0, 2026-10-02, contrat maître du tournoi ; subordonné au contrat projet ; autorité sur les règles de compétition et leur simulation)

1. Fonction du tournoi — Le tournoi constitue simultanément : l'horloge de la campagne ; le principal spectacle public ; le moteur de réputation ; la source de rivalités ; un déclencheur d'activité économique ; un motif de présence pour les combattants étrangers ; un générateur de tensions et sabotages ; la structure qui transforme progressivement le joueur solitaire en leader d'équipe. Il ne doit jamais se réduire à une simple liste de combats.

2. Principe canonique : tournoi évolutif — Le format change au cours de la compétition. Phase I — Individuelle : duels 1v1 ; forte mise en avant des personnalités ; règles simples ; observation claire des styles ; rivalités directes ; visibilité croissante du joueur. Phase II — Transition (peut combiner selon le design retenu) : épreuves de classement ; challenges publics ; combats d'exhibition ; objectifs hors arène ; premiers formats collectifs limités ; opportunités de recrutement. Elle sert à rendre crédible le passage de l'individu vers l'équipe. Phase III — Équipe : roster constitué ; formats collectifs ; choix de lineup ; synergies ; remplaçants ; enjeux plus élevés ; adversaires eux-mêmes organisés en groupes. 3v3 est une option probable mais non verrouillée. Le nombre final de combattants actifs doit être décidé après prototype du système collectif.

3. Ce qui n'est plus canonique (à ne pas réintroduire par défaut) : commencer directement avec 12 équipes constituées ; phase initiale en 4 groupes de 3 ; 3v3 comme premier format ; roster complet donné au joueur dès l'arrivée. Ces formats peuvent être réévalués plus tard, mais ne sont plus la baseline.

4. Calendrier — Le contrat projet conserve une baseline de campagne courte autour de dix journées. Le calendrier exact doit être construit pour que : chaque match ait une fenêtre de préparation ; certains jours puissent avoir davantage de ville que d'arène ; le passage individu → équipe soit perceptible ; les enjeux montent sans accélération artificielle. Le Tournament Agent doit pouvoir simuler plusieurs calendriers pour comparer : densité ; temps de préparation ; nombre de rivaux significatifs ; charge de contenu ; risque de fatigue du joueur.

5. Participants persistants — Chaque combattant important existe dans la simulation même hors écran. État minimum :

```ts
interface CompetitorState { id: string; phaseStatus: string; combatProfile: string; healthState: string; preparation: number; reputation: number; wealth: number; relationships: Record<string, number>; objectives: string[]; knownFacts: string[]; teamId?: string; }
```

À l'apparition des équipes, l'état individuel n'est pas remplacé : il est agrégé dans un TeamState.

6. Simulation hors écran — Les concurrents peuvent : s'entraîner ; acheter ; obtenir un objet ; se soigner ; faire une quête ; nouer une alliance ; se brouiller ; espionner ; saboter ; être sanctionnés ; se blesser ; gagner ; perdre ; être éliminés ; être recrutés lorsqu'une règle l'autorise. Les matchs non vus doivent provenir du même modèle de stats/règles que les combats visibles, même si leur résolution est simplifiée.

7. Rivalités — Une rivalité doit être fondée sur des faits : résultat d'un duel ; humiliation ; respect ; dette ; conflit de faction ; sabotage ; recrutement d'un ancien allié ; style de combat opposé. La rivalité influence : dialogues ; préparation adverse ; comportement en combat ; événements urbains ; recrutement ; réputation.

8. Recrutement et élimination — Une élimination ne signifie pas nécessairement disparition du personnage. Un combattant éliminé peut : quitter la ville ; devenir spectateur ; rejoindre une faction ; rechercher une nouvelle équipe si les règles l'autorisent ; devenir recrutable ; se retourner contre le joueur ; aider le joueur. Le tournoi doit donc nourrir le contenu urbain au lieu de le réduire à mesure que les participants sont éliminés.

9. Ville et tournoi — Chaque étape doit publier un TournamentWorldPulse comprenant au minimum : niveau d'excitation ; nombre de concurrents encore actifs ; célébrité du joueur ; pression médiatique/publique ; sécurité ; activité commerciale ; activité festive ; risque de sabotage. La ville consomme ces données pour changer son état visuel et systémique.

10. Festival et challenge — Le tournoi doit produire au moins un grand événement public hors combat officiel rappelant l'énergie d'une ville entière engagée dans la compétition. Objectifs : transformer temporairement un quartier ; modifier la circulation ; faire participer les habitants ; exposer des rivaux dans un autre contexte ; offrir récompenses et réputation ; fournir un spectacle fort. Il doit être original dans ses règles et ne pas reproduire un mini-jeu existant.

11. Lisibilité du bracket — Le joueur doit comprendre à tout moment : sa phase ; sa prochaine échéance ; les principaux adversaires encore en course ; les conséquences d'une élimination ; quand et pourquoi le tournoi change de format. La complexité de la structure ne doit pas devenir un puzzle administratif.

12. Déterminisme — Le moteur de tournoi doit pouvoir : générer une seed ; simuler une journée ; simuler un match hors écran ; reproduire un résultat de test ; sauvegarder l'état avant/après. Les décisions narratives explicitement auteurisées peuvent surcharger les probabilités, mais doivent rester traçables.

13. Outils — TournamentLab doit permettre : charger un état de tournoi ; accélérer plusieurs journées ; inspecter les concurrents ; visualiser les résultats ; comparer plusieurs seeds ; repérer les participants oubliés ; mesurer la fréquence des éliminations/blessures ; vérifier la transition vers les formats d'équipe.

14. Critères de validation — La structure finale du tournoi n'est validée que si : l'introduction 1v1 est convaincante ; les rivaux sont mémorables avant l'équipe ; le recrutement a suffisamment de temps pour exister ; le passage en équipe semble motivé et attendu ; la ville réagit à chaque phase ; les concurrents progressent de manière crédible hors écran ; les formats ne créent pas un volume de contenu irréalisable.

15. Verrous — 1. Début en duel 1v1. 2. Progression vers le collectif. 3. Le joueur ne commence pas avec un roster complet. 4. Les participants persistent hors arène. 5. Élimination ne signifie pas suppression narrative. 6. Le tournoi transforme la ville. 7. La structure doit être simulable headless. 8. 3v3 reste une hypothèse de phase avancée, pas une obligation. 9. Les transitions de format doivent avoir une justification diégétique. 10. Le Tournament Agent ne peut pas changer ces verrous sans décision A3.

Fin — TOURNAMENT MASTER CONTRACT v1.0
