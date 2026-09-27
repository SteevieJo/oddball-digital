# Oddball Digital v1.0 — STREET ARENA

Reconstruction complète de l'interface à partir du mockup validé :
- scène plein écran 16:9, identité street / arcade / sport ;
- plateaux physiques Losezone / balle / Winzone ;
- Faceoff central ;
- scoreboard vertical Rival / Toi ;
- inspecteur fixe à gauche ;
- Bench agrandi avec effets visibles et hover ;
- stats contrastées par couleur ;
- main large et inclinée ;
- pioche et défausse dans les coins ;
- moteur de gameplay v0.9 conservé.

Les portraits du mockup ne sont pas inclus : les cartes restent de vrais composants HTML interactifs.


v1.8.5: Fil du match conserve désormais tout l'historique et peut être remonté avec la molette/barre de défilement, y compris après le décompte final.


v1.9: Les bandeaux de pouvoir affichent désormais uniquement INSTANT / PERMANENT / END GAME. Play, Attack, Defense, Win, Lose et After restent des déclencheurs et sont affichés dans le texte. Le terme Ongoing est remplacé par Permanent dans toute l’interface, tout en conservant l’enum interne ONGOING pour la compatibilité moteur.


## v1.20 — 53 cartes jouables
Ajoute 13 athlètes documentés et leurs effets. Hattie résout son Flip avant le décompte final. Note : Hina est provisoirement traitée comme un effet Play (catégorie Instant) jusqu’à confirmation explicite de son timing.

## v1.35 — Rules Audit
Audit du moteur sur les 53 cartes actuellement actives.

Corrections / durcissements :
- Lydia Le compte désormais les cartes Permanent face visible de tout son Bench, conformément au texte de la carte ; elle n'a plus besoin d'être elle-même en Losezone.
- Normalisation interne de la détection `END GAME` / `END_GAME` via `isEndGame()` pour éviter les écarts de nomenclature dans les déclencheurs, l'IA et Reuben Browning.
- Si l'adversaire est déjà sans carte au début d'une nouvelle attaque, aucun faux Play/Attack n'est désormais autorisé avant le décompte final.
- Le correctif v1.33 reste actif : si un effet d'attaque (ex. Demi Boone) vide la dernière carte du défenseur avant sa réponse, l'attaquant gagne automatiquement le Face-Off puis la fin de partie se déclenche.

Points volontairement laissés provisoires car la règle publique n'est pas confirmée : Abel Snyder (définition de voisin), Hina Massey (timing traité comme Play), égalités POW/SPD, et certains détails de cartes encore incomplètes qui ne font pas partie des 53 actives.

## v1.40 — CUSTOM SET
- 45 cartes CUSTOM ajoutées aux 53 cartes reconstruites : 98 cartes au total.
- Les cartes CUSTOM sont marquées `◆ CUSTOM`; les cartes existantes `✓ RECONSTRUITE`.
- Filtres Collection/Labo : Toutes sources / Reconstruites / Custom.
- Noms, couleurs, étoiles, POW/SPD selon la base CUSTOM v0.2 validée.
- Intégration gameplay des nouveaux archétypes : Face Down, Draw/Hand Burn, Low POW/Speed-Lose, mono-couleur, disruption et protection.
- Le moteur headless v1.39 reste un outil DEV historique : ses résultats ne doivent pas être utilisés pour équilibrer les CUSTOM tant que sa logique dédiée n'a pas été auditée carte par carte.
