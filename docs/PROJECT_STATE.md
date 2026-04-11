# PROJECT_STATE

Date: 2026-04-08
Project: HyperSurvivor

## Current State

- The game already has a strong identity: neon survivor combat, boss framing, cinematic overlays, and a custom DOM + canvas HUD stack.
- Core risk is still not content quantity but playability quality: full runs, combat readability, HUD weight, and regression safety.
- The worktree is active and partially dirty, so improvements should stay local and high-impact.

## Current Audit Summary

- Stability has improved, but the project still needs repeated run validation in arcade and adventure modes.
- The combat presentation is expressive, but some overlays still compete with the playfield.
- HUD hierarchy is too dense during live play compared with the importance of survival-critical information.

## Current Cycle

- Objective: validate the freshly redeployed hosted build in a real browser flow.
- Rationale: the current production alias now points to the latest local menu work, so hosted validation is finally meaningful again.

## Last Completed Cycle

- `waveIntro` presentation was moved into an upper presentation band so the center lane stays more readable at wave start.
- Verification completed with `node --check js/game.js`.
- Boss HUD now enters a lighter combat mode during `boss` and `bossIntro`, reducing the weight of secondary economy and action chrome.
- Verification completed with `node --check js/ui.js`.
- Boss HUD was tightened further after artifact review: the boss top strip now collapses `LEVEL`, `BANK`, actions, and non-XP chips instead of only dimming them.
- Verification completed with selector sanity checks across `js/ui.js` and `css/style.css`.
- A safe debug URL launch path was added so QA can jump directly into a target stage or boss encounter without menu friction.
- Verification completed with `node --check js/game.js`.
- Normal combat now uses a lighter `live` HUD mode during `wave` and `waveIntro`, so `HP`, run progression, and timer read first while economy and action chrome stay accessible but calmer.
- Verification completed with `node --check js/ui.js` plus selector sanity checks across `js/ui.js` and `css/style.css`.
- A new `devQa=1` URL mode now skips rich-media opening/ending flow, bypasses stage intros, and shortens boss-intro delay so validation can reach playable states faster.
- Verification completed with `node --check js/intro.js`, `js/boss.js`, and `js/mediaDirector.js`.
- Static Vercel deployment files were added: `.vercelignore`, `vercel.json`, and README deployment notes.
- Verification completed by inspecting the generated deployment files.
- A real Vercel preview deployment now exists and is reachable for external testing.
- Preview URL: `https://hypersurvivor-qowho81hm-othmanberrs-projects.vercel.app`
- A stable production deployment is now live and aliased.
- Production URL: `https://hypersurvivor.vercel.app`
- Arcade setup now summarizes the currently selected fighter and map before commit, and the CTA text updates to match the current choice.
- Verification completed with `node --check js/characters.js` plus selector sanity checks across `index.html`, `js/characters.js`, and `css/style.css`.
- The main menu now has a stronger launch-pad presentation: richer hero lighting, more editorial framing, clearer Arcade vs Adventure cards, and a calmer premium bottom bar.
- Verification completed with selector and responsive sanity checks across `css/style.css` and the steering docs.
- Hosted validation attempt completed:
  - `https://hypersurvivor.vercel.app` returns `200`
  - `https://hypersurvivor.vercel.app/css/style.css?v=101` returns `200`
  - current production CSS `Last-Modified` is older than the local `css/style.css`, so the newest menu redesign is not deployed yet
  - headless Firefox still hangs before writing screenshots, even with isolated profiles and timeouts
- Menu mode-choice clarity pass completed:
  - Arcade and Adventure cards now drive a live right-side brief on hover, focus, and click
  - the active mode gets a stronger persistent visual state, not just a hover treatment
  - the side brief now explains run shape and best-fit player intent instead of staying generic
  - verification completed with `node --check js/game.js` plus selector sanity checks across `index.html`, `js/game.js`, and `css/style.css`
- Fresh Vercel deploy completed:
  - preview deployment ready at `https://hypersurvivor-r4bmc6go3-othmanberrs-projects.vercel.app`
  - production deployment ready at `https://hypersurvivor-nejhrqub8-othmanberrs-projects.vercel.app`
  - stable alias updated: `https://hypersurvivor.vercel.app`
  - production HTML and CSS now return `200` with fresh `Last-Modified` timestamps matching the new deploy window
