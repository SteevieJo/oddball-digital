# Oddball Digital v1.39 — Simulation Engine (DEV)

Moteur headless IA vs IA, séparé de l'interface. Il permet de lancer des campagnes reproductibles depuis Node.

## Utilisation
`node sim_cli.js 10000 138 resultats.json`

Arguments : nombre de parties (max 100000), seed, fichier de sortie.

## Important
Le simulateur suit les règles et effets implémentés du prototype, mais les choix optionnels/ciblages sont automatisés par heuristiques. Les résultats mesurent donc **cartes + stratégie de l'IA**, pas un équilibre humain absolu. Les règles encore provisoires du prototype (ex. voisinage d'Abel) restent provisoires ici aussi.
