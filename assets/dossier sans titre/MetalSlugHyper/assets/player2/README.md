# Personnage 2 - Nouveau Héros

Placez ici les sprites du nouveau personnage avec toutes les animations.

## Option 1 : Sprite de base (recommandé pour commencer)

Placez un sprite de base du personnage dans :
- `player2/base.png`

Le système générera automatiquement toutes les animations à partir de ce sprite de base (temporairement, elles seront identiques).

## Option 2 : Sprites complets (recommandé pour la version finale)

Placez tous les sprites dans la structure suivante :

```
player2/
├── base.png (optionnel, sprite de référence)
├── idle/
│   ├── idle1.png
│   ├── idle2.png
│   ├── idle3.png
│   └── idle4.png
├── walk/
│   ├── walk1.png
│   ├── walk2.png
│   ├── walk3.png
│   ├── walk4.png
│   ├── walk5.png
│   ├── walk6.png
│   ├── walk7.png
│   ├── walk8.png
│   ├── walk9.png
│   └── walk10.png
├── punch/
│   ├── punch1.png
│   ├── punch2.png
│   └── punch3.png
├── kick/
│   ├── kick1.png
│   ├── kick2.png
│   ├── kick3.png
│   ├── kick4.png
│   └── kick5.png
└── jump-kick/
    ├── jumpkick1.png
    ├── jumpkick2.png
    └── jumpkick3.png
```

## Nombre de frames requis

- **idle** : 4 frames (animation de repos)
- **walk** : 10 frames (animation de marche)
- **punch** : 3 frames (coup de poing)
- **kick** : 5 frames (coup de pied au sol)
- **jump-kick** : 3 frames (coup de pied sauté)

## Activation

Le personnage est activé par défaut dans `Player.js` avec `static playerFolder = 'player2'`.

Pour revenir à Jeff, changez en `'player'` dans `src/entities/Player.js`.

