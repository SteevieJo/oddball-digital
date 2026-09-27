# Oddball Digital v1.39 — Balance Lab

Outil développeur pour réduire le biais de draft dans les simulations.

## Modes disponibles

- `runBatch(n, seed, {draftMode:'ai'})` : draft IA v3 historique.
- `runBatch(n, seed, {draftMode:'random'})` : 6 cartes de départ aléatoires par joueur.
- `simOne(seed, {draftMode:'random', forceCardId: 7, forceSide:'h'})` : force une carte dans une main de départ.
- `runBalanceLab(perCard, seed)` : teste chacune des 53 cartes avec des mains aléatoires et alterne automatiquement le côté h/a à chaque partie.

## CLI Balance Lab

```bash
node balance_cli.js 5000 139
```

`5000` = parties par carte, donc 265 000 parties au total pour 53 cartes.

Le JSON exporté contient pour chaque carte : win rate, win rate hors égalités, score moyen pour/contre, fréquence de jeu, Winzone et Losezone.

## Important

Ce laboratoire mesure toujours le comportement du moteur et de l'IA, pas une vérité absolue sur l'équilibrage humain. Les cartes dont les effets comportent encore des règles provisoires doivent être interprétées avec prudence.
