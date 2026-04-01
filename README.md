# Hypersurvivor

Jeu web arcade / survivor en HTML, CSS et JavaScript.

## Point d'entree

- `index.html` : page principale du jeu
- `server.js` : petit serveur local pour lancer le jeu

## Lancer le projet

```bash
node server.js
```

Puis ouvrir :

```text
http://localhost:8888
```

## Structure utile

- `assets/` : sprites, backgrounds, audio, video, assets de gameplay
- `css/` : styles du jeu
- `js/` : logique principale du jeu
- `data/` : donnees JSON du gameplay
- `docs/` : specs et images de reference
- `tools/` : scripts et fichiers utilitaires hors runtime
- `experiments/` : sous-projets et essais annexes
- `output/` : captures, sorties de test, exports
- `tmp/` : fichiers temporaires de travail
- `progress.md` : journal de travail et historique des passes precedentes

## Ce qui fait partie du runtime

Le runtime du jeu repose principalement sur :

- `index.html`
- `server.js`
- `css/`
- `js/`
- `assets/`
- `data/`

## Ce qui est annexe

- `docs/specs/` : specs HTML d'origine
- `docs/reference-images/` : images source / references visuelles
- `tools/dev/` : outils locaux, viewers, scripts de support
- `experiments/weather_bot_v2/` : projet annexe non necessaire au runtime du jeu

## Regle simple

Si un fichier n'est pas necessaire pour lancer le jeu ou modifier son gameplay direct, il ne doit pas rester a la racine.
