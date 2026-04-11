# HyperSurvivor V1 - Whitepaper (Working Draft)

Date: 2026-04-11
Status: Draft for 15-day launch sprint

## 1. Vision
HyperSurvivor V1 livre un mode unique, lisible et testable: Survivor.
Objectif: proposer une boucle de combat fun, rapide, et connectee a HyperEVM testnet sans friction inutile.

## 2. V1 Scope (Locked)
- Mode actif: `Survivor` (chemin principal de release)
- Mode reporte: `Arcade` (verrouille en `Coming Soon`)
- Loop gameplay: progression stage -> wave -> boss -> progression
- Wallet: connexion HyperEVM testnet, classement/score en mode test

## 3. Core Loop
1. Le joueur choisit Survivor
2. Il entre dans un run progressif
3. Il optimise build, survie et cadence de kill
4. Il termine ou meurt, puis compare son score
5. S'il connecte son wallet, ses interactions testnet peuvent etre validees

## 4. Product Principles
- One lane policy pour V1: pas de dilution produit
- Fast feedback: gameplay lisible, HUD clair, retours audio/visuels propres
- Testnet first: preuve technique avant ambitions mainnet
- Stable > feature-rich: moins de surface, plus de fiabilite

## 5. Economy & On-chain (V1)
- Positionnement: testnet validation et non production value
- Scores: pipeline local + web3 testnet
- Achievements NFT: uniquement apres deployment verifie

## 6. Risks
- Contrat non deploye ou mauvaise adresse
- Flux wallet instable selon navigateur / extension
- Regression gameplay due a scope creep
- Absence de preuves QA structurees avant push

## 7. 15-Day Success Criteria
- Survivor jouable end-to-end sans blocant majeur
- Arcade clairement locke et comprehensible
- Wallet testnet connectable + transaction score validee sur contrat non-zero
- Smoke tests desktop/mobile executes et traces
- Build de production deploye avec checklist complete
