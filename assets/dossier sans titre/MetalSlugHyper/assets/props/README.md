# Sprites de Pneu en Feu

Placez ici la sprite sheet de pneu en feu pour le système de dégradation des props.

## Format requis

**Un seul fichier** contenant les 4 états de pneu en feu dans une grille 2x2 :

```
┌─────────┬─────────┐
│ État 1  │ État 2  │  ← Ligne du haut
│ (3 PV)  │ (2 PV)  │
├─────────┼─────────┤
│ État 3  │ État 4  │  ← Ligne du bas
│ (1 PV)  │ (0 PV)  │
└─────────┴─────────┘
```

## Nom du fichier

Le fichier doit s'appeler :
- `Tire.jpg` (avec T majuscule, extension .jpg)

## Emplacement

Placez le fichier dans l'un de ces dossiers :
- `assets/props/Tire.jpg` (recommandé)
- `assets/Items, VFX and Props/Tire.jpg`

## Ordre des frames

Les 4 états doivent être disposés dans cet ordre :
1. **Haut-Gauche** : État 1 - Peu de feu (pneu intact, 3 PV)
2. **Haut-Droite** : État 2 - Feu modéré (pneu légèrement endommagé, 2 PV)
3. **Bas-Gauche** : État 3 - Feu intense (pneu très endommagé, 1 PV)
4. **Bas-Droite** : État 4 - Braises (pneu presque détruit, 0 PV)

## Fallback

Si la sprite sheet n'est pas trouvée, le jeu générera automatiquement des textures de fallback avec des cercles gris et des flammes colorées.

