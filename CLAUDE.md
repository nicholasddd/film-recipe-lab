# Film Recipe Lab: guide for Claude sessions

An archive of Fujifilm film recipes ("cartridges") for the owner's **X-T30 II**, with playlists by trip, a 3D home carousel of what's loaded in the camera (C1–C7), and a separate simulator. Static site, no build step, hosted on GitHub Pages.

- Live: https://nicholasddd.github.io/film-recipe-lab/
- Repo: https://github.com/nicholasddd/film-recipe-lab (public)

## Layout

| Path | What it is |
|---|---|
| `index.html` | All markup and CSS (one stylesheet). Script tags carry a `?v=` cache-buster. |
| `js/film-engine.js` | Image pipeline: film sims as deltas from PROVIA, tone curve, Oklab colour, grain/clarity/NR, D Range Priority, calibration LUTs. |
| `js/recipe-tools.js` | Text parser for pasted recipes, look analysis, scenario scoring, naming, camera profiles (`CAMERAS`). |
| `js/app.js` | The app: pages, Home carousel, reveal animation, Library, Playlists, Simulator, Compare, forms, storage, seeding. |
| `js/calibrate.js` | Calibrate page: learns 17³ LUTs from PROVIA/sim JPEG pairs. |
| `data/my-recipes.js` | **The owner's data:** camera, playlists, and every cartridge. Source of truth that ships with the site. |
| `data/samples.js` | 24 Wikimedia Commons sample scenes (3 per category) with author/licence credits. |
| `tools/release.sh` | Bumps `?v=` and optionally commits and pushes. |
| `.claude/launch.json` | Preview server config (`python3 -m http.server`, port 8813). |

## Data model and how changes flow

- `data/my-recipes.js` defines `window.MY_RECIPES = { camera, playlists, repertoire: [entries] }`. Each entry: `id` (stable, `mine-…`), optional `slot` (1–7 = camera custom setting), `aka` (the recipe's name), `scenarios` (playlist names; omit to auto-suggest), `notes`, `iso`, `ec`, and `recipe` (engine fields, see `FilmEngine.DEFAULT_RECIPE`).
- On load, the app seeds entries into browser storage (`localStorage['filmRecipeLab.v1']`). When an entry changes in the file it is re-applied, **unless** the owner edited that cartridge in the app since. Changing `playlists` replaces the app's playlists and drops tags for removed ones.
- In-app edits, calibrations (`filmRecipeLab.calib.v1`) and Compare picks live only in that browser. **Library → Export backup / Import backup** moves them between devices.
- Display names are generated: `SIM-TempContrast Descriptor`, e.g. `CN-WM Seagull Beach` (Temp W/N/C, Contrast S/M/H). Names are capped at the camera's custom-name length, `CAMERAS['X-T30 II'].nameMax` = 25 (**provisional, not confirmed on the camera**).

## Standing rules from the owner

1. **Incompatible recipes:** when the owner shares a recipe the X-T30 II can't run (e.g. Nostalgic Neg., Reala Ace), save the original as given (simulator only, no trip playlists, note on the card) **and** add the closest X-T30 II version named `<name> T30`, tagged only `TEST`. Explain the tweaks and label them as approximations.
2. **Playlists are judged on settings**, not names (WB and shift, DR/DRP, tone curve, colour effects, film sim).
3. **The interface stays neutral greyscale.** No hue anywhere in the UI, so it never biases colour judgement. Only photos and cartridge previews are in colour.
4. **Motion must be smooth.** Nothing snaps: cross-fades, sliding indicators, eased springs (`--ease-out`), real-time (not per-frame) speeds, and `prefers-reduced-motion` respected.
5. **Desktop-first.** The owner doesn't use it on a phone. Keep layouts uncluttered and make the simulator usable without scrolling.
6. **Archive first.** Clicking a cartridge opens the reveal (lay flat, fly in, flip to recipe), not the simulator. The simulator is its own page.
7. **Credit sample photos** wherever they appear (CC BY / BY-SA). Don't copy third-party recipe catalogues; recipes come from the owner.
8. Taste: likes strong reds and oranges with low yellow. Warmth from Red, not minus Blue, when suggesting tweaks.

## Working on it

- Run locally: `python3 -m http.server 8813`, then open http://localhost:8813 (or start the `film-lab` preview).
- After any change to JS or data, **bump the version** (`tools/release.sh`), or browsers may load a stale file next to a new one.
- Release: `tools/release.sh "Message"` commits everything and pushes; Pages rebuilds in about a minute.
- Check the browser console for errors and test the touched page before releasing.
