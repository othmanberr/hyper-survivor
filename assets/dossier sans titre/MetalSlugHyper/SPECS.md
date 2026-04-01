# SPÉCIFICATIONS TECHNIQUES - MISE À JOUR "JUICE & SOUND"

## CONTEXTE
Projet : Beat'em Up Phaser 3 + Vite.
Architecture : `src/scenes`, `src/entities`, `src/config`.
Assets : `public/assets/`.

## OBJECTIF
Ajouter le design sonore et l'interactivité avec le décor (Caisses & Loot).

---

## TÂCHE 1 : SYSTÈME AUDIO (`src/managers/AudioManager.js`)

1.  **Création :** Crée une classe `AudioManager` (Singleton ou attachée à la Scène).
2.  **Chargement (Preload) :**
    * Charge les sons depuis `assets/audio/`.
    * Clés attendues : `bgm` (musique), `punch`, `hit`, `explosion`, `collect`.
    * *Contrainte :* Si un fichier manque, ne pas faire planter le jeu, afficher juste un warning console.
3.  **Fonctions :**
    * `playBGM()` : Joue la musique en boucle (volume 0.4).
    * `playSFX(key)` : Joue un bruitage (volume 0.8).
4.  **Intégration :**
    * Lancer la musique au début de `GameScene`.
    * Jouer `punch` quand le joueur attaque.
    * Jouer `hit` quand un ennemi est touché.

---

## TÂCHE 2 : OBJETS DESTRUCTIBLES (`src/entities/Prop.js`)

1.  **Classe :** Crée `Prop` (extends `Phaser.Physics.Arcade.Sprite`).
2.  **Physique :**
    * `setImmovable(true)` (Ne doit pas glisser quand le joueur pousse).
    * Hitbox solide.
3.  **État :**
    * PV = 3.
    * Sprite : Utilise une image `crate.png` ou un rectangle marron si absente.
4.  **Interaction :**
    * Si touché par l'attaque du joueur : Flash blanc + Shake léger + Son `hit`.
    * Si PV <= 0 : Joue son `explosion`, spawn des particules, spawn du LOOT, puis `destroy()`.

---

## TÂCHE 3 : SYSTÈME DE LOOT (`src/entities/Loot.js`)

1.  **Classe :** Crée `Loot` (Sprite physique).
2.  **Types :**
    * `GOLD`: Donne +500 Score.
    * `HEALTH`: Donne +20 PV.
3.  **Apparition :**
    * Petit rebond (Tween Y) à l'apparition.
4.  **Ramassage :**
    * Overlap avec le Player.
    * Effet : Son `collect` + Texte flottant "+500" ou "HP UP".
    * Disparaît.

---

## TÂCHE 4 : INTÉGRATION DANS `GameScene.js`

* Ajoute un groupe `this.props` et `this.loots`.
* Fais apparaître 3 Caisses aléatoires au début du niveau.
* Gère les collisions `PlayerAttack vs Props` et `Player vs Loot`.
