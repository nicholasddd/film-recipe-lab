# Film Recipe Lab

A browser app for testing Fujifilm-style film recipes on your own photos, keeping a library of recipes, and organising them into the camera's custom slots and scenario playlists.

**Live:** https://nicholasddd.github.io/film-recipe-lab/

- **Home**: the current repertoire (custom settings C1–C7 on the X-T30 II), then playlists by scenario.
- **Library**: every saved recipe, as a staggered grid or 3D carousels grouped by scenario. Paste recipes in as text, or add them with dropdowns that match the camera menus.
- **Playlists**: 8 recipes per scenario (beach, snow, night…), filled by hand or automatically.
- **Simulator**: upload a photo and apply a recipe, including aperture, shutter and ISO changes.
- **Calibrate**: learn a film simulation's exact colours from PROVIA/sim JPEG pairs shot on your camera.

The film simulations are approximations, not Fujifilm's processing. Everything runs in the browser; recipes you add in the app are stored in that browser only. Your own repertoire lives in `my-recipes.js`, so it ships with the site.

Run locally with any static server, for example `python3 -m http.server`.
