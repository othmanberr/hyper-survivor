# DECISIONS

Date: 2026-04-08

## Active Development Rules

- Work in small autonomous cycles with one concrete objective at a time.
- Prioritize gameplay clarity, feel, polish, and stability over architecture work.
- Avoid large refactors unless they clearly unblock player-visible progress.

## This Cycle

- Decision: move back to hosted validation immediately after the successful redeploy.
- Why: the production alias now reflects the latest menu passes, so the next useful evidence comes from real browser review rather than more local menu changes.
- Non-goals: no new menu-system rewrite, no gameplay rebalance, no broad structural refactor.

## Next Decision Direction

- Run hosted validation, then use the findings to choose between menu polish, HUD readability, or early-run friction.
