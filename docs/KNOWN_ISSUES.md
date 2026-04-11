# KNOWN_ISSUES

Date: 2026-04-08

## High Priority

- Full-run validation is still not locked for both arcade and adventure.
- Existing worktree contains many in-progress files, so unrelated regressions are a coordination risk.

## Medium Priority

- Wave intro readability was improved, but still needs in-browser confirmation in real combat conditions.
- Boss HUD declutter is implemented and tightened, but still needs live browser confirmation in a real boss encounter.
- Persistent HUD density is high during normal combat.
- Some media and optional systems still need ongoing smoke validation in live browser runs.
- The new lighter live HUD still needs a real-run check across desktop resolutions to confirm that the de-emphasis is strong enough without harming menu discoverability.
- Headless Firefox capture is still hanging before writing screenshots, even when `devQa=1` removes intro/media delays.
- Production deployment exists, but the hosted build still needs a real smoke test across menu, run, boss, and ending flows.
- The repaired production build still needs a real smoke pass to confirm that the new selection summaries, refreshed menu styling, and reactive mode brief read well on desktop and mobile.

## Notes

- Prefer local, visible fixes before broad cleanup.
- Treat combat readability regressions as more important than feature expansion.
