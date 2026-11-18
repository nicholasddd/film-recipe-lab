# Film Recipe Lab

A browser app for testing Fujifilm-style film recipes on your own photos, keeping a library of recipes, and organising them into the camera's custom slots and scenario playlists.

**Live:** https://nicholasddd.github.io/film-recipe-lab/

- **Home**: the current repertoire (custom settings C1–C7 on the X-T30 II), then playlists by scenario.
- **Playlists**: cartridges grouped by trip or scene, as a staggered grid or 3D carousels.
- **Library**: every saved cartridge, in a playlist or not. Paste recipes in as text, or add them with dropdowns that match the camera menus. Click any cartridge to open it.
- **Simulator**: apply a recipe to your own photo or one of eight sample scenes, including aperture, shutter and ISO changes.
- **Calibrate**: learn a film simulation's exact colours from PROVIA/sim JPEG pairs shot on your camera.

The film simulations are approximations, not Fujifilm's processing. Everything runs in the browser; recipes you add in the app are stored in that browser only. Your own repertoire lives in `my-recipes.js`, so it ships with the site.

Run locally with any static server, for example `python3 -m http.server`.

## Sample scene credits

The Simulator's sample scenes are freely licensed photos from Wikimedia Commons, loaded from Wikimedia and shown with film recipes applied:

| Scene | Photo | Author | Licence |
|---|---|---|---|
| Portrait | [Kutia kondh woman 3](https://commons.wikimedia.org/wiki/File:Kutia_kondh_woman_3.jpg) | PICQ (background blur by Samsara) | CC BY-SA 4.0 |
| Sky & foliage | [Central Park New York May 2015 007](https://commons.wikimedia.org/wiki/File:Central_Park_New_York_May_2015_007.jpg) | King of Hearts | CC BY-SA 3.0 |
| Golden hour | [Château Frontenac city at night](https://commons.wikimedia.org/wiki/File:Ch%C3%A2teau_Frontenac_city_at_night.jpg) | Wilfredor | CC BY-SA 4.0 |
| Reds & oranges | [Fruit Stall in Barcelona Market](https://commons.wikimedia.org/wiki/File:Fruit_Stall_in_Barcelona_Market.jpg) | Daderot | CC BY-SA 3.0 |
| Overcast | [Lake Louise, Banff National Park](https://commons.wikimedia.org/wiki/File:Banff_National_Park_(AB,_Canada),_Lake_Louise_--_2022_--_2200.jpg) | Dietmar Rabich | CC BY-SA 4.0 |
| Snow (Dolomites) | [Sellagruppe von Süden Col Rodella](https://commons.wikimedia.org/wiki/File:Sellagruppe_von_S%C3%BCden_Col_Rodella.jpg) | Wolfgang Moroder | CC BY-SA 3.0 |
| Night neon | [Neon street signs at blue hour, Shinjuku](https://commons.wikimedia.org/wiki/File:Buildings_with_colorful_neon_street_signs_at_blue_hour,_Shinjuku,_Tokyo.jpg) | Basile Morin | CC BY-SA 4.0 |
| Indoor tungsten | [Famiglia Mancini, São Paulo](https://commons.wikimedia.org/wiki/File:Famiglia_Mancini,_S%C3%A3o_Paulo,_Brazil.jpg) | Wilfredor | CC BY-SA 4.0 |
