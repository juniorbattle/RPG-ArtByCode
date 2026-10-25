# Cité du Tournoi — GAMEPLAY MASTER CONTRACT

> **Provenance** (journal, Passe N2). L'opérateur a fourni ce contrat dans son message à la séance de la Passe H11. Cette séance l'a transmis
> à la séance de planification de la séance cloud, le 2026-10-20 ; il est versionné ici sur la décision C1 (« contracts/ à la racine
> (versionnés, donc publiés) »).
> - Le texte reçu était à plat. Seule la mise en forme change : un paragraphe par section, l'en-tête en titre. Aucun mot n'est changé.
> - L'en-tête entre parenthèses peut être un résumé fait par la séance de transmission : s'il diffère, l'original de l'opérateur fait foi.
> - Ce contrat se dit subordonné à `contracts/PROJECT_MASTER_CONTRACT.md`, que l'opérateur fournit avant le lancement de la séance cloud
>   (décision C2).
> - **Amendement du 2026-10-25** (journal, Passe CB1 ; décision A3 de l'opérateur, choix CB-8 « Amender maintenant, ces trois phrases ») : au
>   § 1, « 1. combat tour par tour ; » devient « 1. combat en « tour par tour dynamique » (contrat projet § 6.1) ; ». Le reste du texte est
>   inchangé.

(Version 1.0, 2026-10-02, contrat maître de gameplay ; subordonné à PROJECT_MASTER_CONTRACT.md, supérieur aux contrats de tâche gameplay)

1. Finalité — Le gameplay doit faire ressentir une compétition qui dépasse l'arène. Le joueur commence seul, participe à des duels officiels, se construit une réputation, découvre la ville, rencontre des alliés potentiels, puis développe progressivement un roster capable d'affronter les formats collectifs des phases avancées. Le jeu repose sur cinq systèmes indissociables : 1. combat en « tour par tour dynamique » (contrat projet § 6.1) ; 2. préparation sous contrainte de temps ; 3. exploration d'une ville dynamique ; 4. relations et recrutement ; 5. conséquences persistantes. Aucun de ces systèmes ne doit devenir un mini-jeu isolé sans impact sur les autres.

2. Boucle de jeu canonique — Prochaine échéance du tournoi → Informations sur le rival / la situation → Choix d'un quartier et d'une activité → Préparation / quête / enquête / relation / économie → Événement ou conséquence → Combat officiel → Résultats et blessures → Réaction de la ville et des concurrents → Nouvelle échéance. La boucle doit être compréhensible dès les premières heures et gagner en complexité à mesure que le joueur recrute.

3. Progression en trois âges —

3.1 Âge I, le combattant individuel : le joueur débute sans équipe complète. Objectifs : apprendre la ville ; comprendre le calendrier ; maîtriser le 1v1 ; se faire connaître ; rencontrer des rivaux ; découvrir de futures recrues ; subir d'abord des événements globaux plutôt que des attaques systématiquement ciblées. Le gameplay est volontairement plus intime et lisible.

3.2 Âge II, le réseau et le recrutement : le joueur devient visible. Nouveaux enjeux : convaincre des combattants ; arbitrer entre relations et préparation ; résoudre des conflits personnels ; protéger ou aider des recrues potentielles ; observer les synergies possibles ; affronter des formats spéciaux si le tournoi l'exige.

3.3 Âge III, le compétiteur d'équipe : les phases avancées introduisent les combats collectifs. Le joueur doit alors gérer : roster ; lineups ; rôles ; synergies ; remplaçants ; fatigue ; blessures ; préparation de plusieurs combattants. La complexité collective est gagnée progressivement, jamais imposée dès l'introduction.

4. Temps comme ressource — La baseline de décision conserve trois grands créneaux : matin ; après-midi ; soirée/nuit. Une action significative peut consommer un créneau. La navigation locale, la consultation d'informations ou les interactions mineures ne doivent pas être taxées arbitrairement.

4.1 Activités pouvant consommer du temps : entraînement ; soin ; amélioration d'équipement ; quête structurée ; enquête ; espionnage ; recrutement ; rendez-vous ; événement de festival ; combat officiel.

4.2 Principe anti-frustration : le temps crée des arbitrages macro. Il ne doit pas punir l'exploration curieuse à chaque rue traversée.

5. Préparation — La préparation doit offrir des décisions qualitativement différentes : puissance immédiate (équipement, consommables, entraînement ciblé) ; résilience (soin, repos, protection contre sabotage) ; information (observer un rival, enquêter, acheter une rumeur) ; relation (aider une recrue, un marchand, une faction) ; investissement (débloquer un service, améliorer un atelier, ouvrir un raccourci) ; opportunité (participer à un challenge urbain ou un événement rare). Chaque activité importante doit modifier un état réel.

6. Exploration — La ville est un espace de décision, pas un simple menu. Chaque quartier doit offrir : une identité visuelle ; une fonction systémique ; des opportunités propres ; des risques propres ; un profil jour/nuit ; au moins une raison de revenir plus tard. Le déplacement et la verticalité doivent créer une sensation de grandeur sans exiger un monde ouvert surdimensionné.

7. Recrutement — Le recrutement est une progression narrative et mécanique. Une recrue doit posséder : identité ; motivation ; style de combat ; rôle potentiel en équipe ; condition ou arc de recrutement ; relation avec au moins un autre acteur du monde. Les recrues ne sont pas des unités de menu interchangeables.

7.1 Sources possibles : ancien rival ; combattant éliminé ; mercenaire ; habitant avec talent spécifique ; allié de faction ; personnage sauvé ou aidé ; compétiteur impressionné par le joueur.

8. Ville dynamique — La ville doit réagir : aux résultats du tournoi ; à la célébrité du joueur ; aux éliminations ; aux événements économiques ; aux actes des factions ; aux quêtes ; au jour/nuit ; aux sabotages ; aux victoires publiques. Le joueur doit pouvoir observer cette réaction sans ouvrir un écran de debug.

9. Événements et sabotage — Les premiers problèmes sont souvent collectifs : pénurie, vandalisme, foule, sécurité, rumeurs. Les attaques ciblées deviennent plus plausibles à mesure que le joueur devient dangereux pour ses rivaux. Règle de fair-play systémique : un sabotage majeur doit avoir au moins deux parmi : indices ; prévention ; mitigation ; enquête ; alternative ; compensation ; possibilité d'identifier l'auteur.

10. Économie — L'économie doit soutenir la préparation sans devenir une simulation financière lourde. Elle peut varier selon : quartier ; étape du tournoi ; pénuries ; réputation ; relations ; événements ; jour/nuit. La fermeture ou perte d'un service doit créer une alternative conçue, jamais un cul-de-sac.

11. Échec — L'échec doit produire une nouvelle situation. Exemples : blessure → soin, repos ou nouvelle composition ; quête ratée → coût économique ou faction renforcée ; sabotage subi → enquête ou voie alternative ; défaite non éliminatoire → réputation modifiée, rival renforcé. La campagne ne doit pas devenir mathématiquement perdue après une seule erreur.

12. Déterminisme et simulation — Les règles importantes doivent pouvoir être exécutées headless. Les entrées de simulation doivent inclure : état courant ; action du joueur ; seed RNG ; configuration de contenu. Les résultats doivent être reproductibles lors des tests.

13. Vertical slice gameplay — La tranche verticale doit prouver : 3 jours jouables ; 3 quartiers minimum ; alternance jour/nuit fonctionnelle ; 2 duels 1v1 officiels ; 1 futur recrutable introduit ; 1 quête influençant un combat ; 1 sabotage contrable ; 1 service urbain modifié par une conséquence ; concurrents qui avancent hors écran ; sauvegarde/chargement ; simulation headless déterministe. Le combat d'équipe n'est pas requis pour valider cette première tranche.

14. Verrous — 1. Le joueur commence comme combattant individuel. 2. Le 1v1 est la première expérience de combat à réussir. 3. Le recrutement précède les formats d'équipe avancés. 4. La ville influence réellement la préparation. 5. Le temps crée des choix macro, pas de la micro-punition. 6. Jour et nuit modifient les possibilités. 7. Les concurrents évoluent sans attendre le joueur. 8. Les événements importants ont une causalité. 9. L'échec ouvre des réponses. 10. Le combat collectif doit être gagné progressivement par le design.

Fin — GAMEPLAY MASTER CONTRACT v1.0
