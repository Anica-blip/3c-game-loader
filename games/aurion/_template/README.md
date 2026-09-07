# Aurion Series Template

This folder is a straight copy of the current, proven, MISSION-COMPLETE `games/aurion/core/` files (confirmed working 2026-09-07: correct paths, correct video preload, correct finale centering). It exists so a brand-new series starts from a known-good baseline instead of being rebuilt or re-decided from scratch.

## How to start a new series from this template

1. Copy this whole folder into `games/aurion/<new-series-name>/` in the repo — **copy every file exactly as-is**. Don't remove code because the new series doesn't seem to need it yet (e.g. video preload) — capabilities travel with the clone even if unused today.
2. In `game.html`, update the top comment to the real repo path. Check the `../../../loader.js` and `../../../shared/favicon.png` paths: they're correct only if the new folder sits at the same depth as `games/aurion/core/` (i.e. `games/aurion/<new-series-name>/`). If it's nested differently, those need to change to match — this exact mistake (wrong `../` count) is what broke core the first time.
3. In `games/aurion.js`, update the top comment to the real repo path. Nothing else in this file should need to change for a series that reuses the same mechanics (door, word-picker, sorting, spin-wheel, reveal-cards, video) — it only needs real code changes if the new series needs a genuinely new mechanic.
4. `style.css` needs no changes at all — copy as-is.
5. Rename `config/TEMPLATE-01.json` to `config/<new-series>-01.json` and fill in:
   - `title` — the series title
   - Scene 2 (`consent page`)'s `overlayImage.url` — replace `REPLACE-consent-image.png` with the actual filename of the consent image you provide (goes in this series' own `assets/` folder, referenced as a bare filename — not `../assets/...`, since it's series-specific, not shared)
   - Scenes 3–8 stay as `TBD` placeholders until the mechanics for this series are decided — do not guess or fill these in ahead of a real design pass
   - Everything else (landing, finale, "We're Done Here," button styling, the shared default art references, the shared send-off video) is already correct and shared — leave it alone
6. **Do not change any `adminLabel` value** on scenes 1, 2, 9, or 10 (`"landing page"`, `"consent page"`, `"final page"`) — `aurion.js` matches these as exact strings to decide how the page centers itself. Changing the wording (even something that reads the same to a person, like "finale" instead of "final page") breaks the layout silently. This is exactly what happened on Core Values the first time.
7. `assets/` — put only this series' own new art here (like the consent image). Shared default art (landing/finale art, button graphic, exit icon, background) stays referenced from `games/aurion/assets/` via `../assets/...` — don't duplicate it into the new series' folder.

## The rule this template exists to enforce

Clone means copy-and-paste, exactly, every time — not a rebuild, not a "does this file need everything the original has." The only things that change between series are: the repo-path comments, the series title, the consent image, and whichever scenes 3–8 turn into once their mechanics are designed. Everything else is proven and should never be re-decided per series.
