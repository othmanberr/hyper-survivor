# Hypersurvivor

Jeu web arcade / survivor en HTML, CSS et JavaScript.

## V1 Focus (2026-04-11)

- Mode actif: `Survivor`
- Mode `Arcade`: verrouille temporairement (`Coming Soon`)
- Priorite actuelle: readiness testnet + stabilite release

Docs V1:

- `docs/WHITEPAPER_V1.md`
- `docs/TESTNET_READINESS_2026-04-11.md`
- `docs/LAUNCH_CHECKLIST_V1_15J.md`

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

## Deploiement Vercel

Le projet peut etre deploye comme site statique sur Vercel.

Fichiers inclus au deploy:

- `index.html`
- `css/`
- `js/`
- `assets/`
- `data/`

Fichiers exclus du deploy:

- `server.js`
- `server.log`
- `docs/`
- `tools/`
- `output/`
- `tmp/`
- `experiments/`

Commande typique:

```bash
vercel
```

Puis pour mettre a jour l'alias de production:

```bash
vercel --prod
```

Notes:

- Vercel sert le jeu en statique; `server.js` reste utile seulement en local.
- `index.html` est configure en `no-store` via `vercel.json` pour que les testeurs voient vite les nouvelles versions.
- Le runtime web3 depend toujours du CDN `ethers`, donc il faut verifier apres deploy que le bouton wallet reste en etat propre sur la build partagee.

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
