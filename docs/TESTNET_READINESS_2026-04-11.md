# Testnet Readiness Report

Date: 2026-04-11
Project: HyperSurvivor

## Verdict
Not ready for real testnet gameplay validation yet.

## What is ready
- HyperEVM testnet chain config is present in code:
  - `chainId`: `0x3E6` (998)
  - `rpc`: `https://rpc.hyperliquid-testnet.xyz/evm`
  - explorer: `https://testnet.hyperevmscan.io`
- Wallet connect flow includes switch/add chain logic (`wallet_switchEthereumChain`, `wallet_addEthereumChain`).
- Fallback local score storage exists if on-chain submission fails.
- JS syntax checks passed on core files (`game.js`, `audio.js`, `web3.js`).

## Blocking issues
1. Contract address is still zero:
   - `js/web3.js`: `CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000'`
   - On-chain submit and mint cannot be production-tested until this is replaced.

2. On-chain flow guardrails are minimal:
   - Errors are surfaced, but there is no explicit deployment/version sanity gate in UI.

3. Evidence gap:
   - No attached transaction proof in this run (hashes, receipts, explorer links).

## Required before testnet go
1. Deploy leaderboard/achievement contract on HyperEVM testnet.
2. Update `CONTRACT_ADDRESS` in `js/web3.js`.
3. Run manual smoke:
   - wallet connect
   - network switch
   - submit score tx
   - verify tx on explorer
4. Capture proof bundle:
   - wallet address used
   - tx hash(es)
   - explorer links
   - screenshot of successful in-game status
5. Re-run final sanity on hosted build (not only local).

## Optional but recommended
- Add a small `Contract: Connected / Not deployed` indicator in menu/web3 status.
- Add chain mismatch banner in HUD while in run.
- Add lightweight telemetry log for web3 events (connect, switch, submit success/fail).
