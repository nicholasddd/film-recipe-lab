# Film Recipe Lab

An archive of Fujifilm film recipes ("cartridges") for an X-T30 II: what's loaded in the camera, playlists by trip, and a simulator for trying looks on real photos.

**Live:** https://nicholasddd.github.io/film-recipe-lab/

- **Home**: the cartridges in the camera's custom settings (C1–C7) on a 3D carousel, with playlists below.
- **Playlists**: cartridges grouped by trip or scene, as a staggered grid or 3D carousels.
- **Library**: every saved cartridge. Paste recipes in as text or add them with dropdowns that match the camera menus. Click any cartridge to open it.
- **Simulator**: pick a photo on the left (your own or one of 24 sample scenes), click a cartridge on the right to apply it, and fine-tune settings including aperture, shutter and ISO.
- **Compare**: 2–4 cartridges side by side across the sample scenes.
- **Calibrate**: learn a film simulation's exact colours from PROVIA/sim JPEG pairs shot on your camera.

The film simulations are approximations, not Fujifilm's processing.

## Project layout

```
index.html            markup and styles
js/film-engine.js     image pipeline (film sims, tone, colour, grain, calibration LUTs)
js/recipe-tools.js    recipe text parser, look analysis, naming, camera profiles
js/app.js             the app: pages, carousel, library, playlists, simulator, compare
js/calibrate.js       calibration from PROVIA/sim JPEG pairs
data/my-recipes.js    your camera, playlists and cartridges (edit this to add recipes)
data/samples.js       sample scene photos and their credits
tools/release.sh      bump cache version, commit and push
CLAUDE.md             project guide and standing rules for Claude Code sessions
```

## Run locally

```bash
python3 -m http.server 8813
```

Then open http://localhost:8813.

## Release

```bash
tools/release.sh "Describe the change"
```

This bumps the `?v=` cache-buster on every script, commits everything and pushes. GitHub Pages updates the live site in about a minute.

## Your data and moving devices

- Cartridges and playlists in `data/my-recipes.js` ship with the site, so they appear on every device.
- Edits made in the app, calibrations and Compare picks are stored in that browser only. Use **Library → Export backup** to save them to a file, and **Import backup** on the new device to restore them.

## Sample scene credits

The Simulator and Compare use 24 freely licensed photos from Wikimedia Commons (three per category), loaded from Wikimedia and shown with film recipes applied:

| Category | Photo | Author | Licence |
|---|---|---|---|
| Portrait | [Kutia kondh woman 3](https://commons.wikimedia.org/wiki/File:Kutia_kondh_woman_3.jpg) | PICQ (background blur by Samsara) | CC BY-SA 4.0 |
| Portrait | [Baby portrait 1-year-old](https://commons.wikimedia.org/wiki/File:Baby_portrait_1-year-old.jpg) | Kozuch | CC BY-SA 3.0 |
| Portrait | [Hue Vietnam Thien-Mu-Temple-and-Pagoda-03](https://commons.wikimedia.org/wiki/File:Hue_Vietnam_Thien-Mu-Temple-and-Pagoda-03.jpg) | CEphoto, Uwe Aranas | CC BY-SA 3.0 |
| Sky & foliage | [Central Park New York May 2015 007](https://commons.wikimedia.org/wiki/File:Central_Park_New_York_May_2015_007.jpg) | King of Hearts | CC BY-SA 3.0 |
| Sky & foliage | [2024-11-19-Central Park-0669](https://commons.wikimedia.org/wiki/File:2024-11-19-Central_Park-0669.jpg) | Superbass | CC BY-SA 4.0 |
| Sky & foliage | [Dülmen, Wildpark](https://commons.wikimedia.org/wiki/File:D%C3%BClmen,_Wildpark_--_2018_--_1458-62.jpg) | Dietmar Rabich | CC BY-SA 4.0 |
| Golden hour | [Château Frontenac city at night](https://commons.wikimedia.org/wiki/File:Ch%C3%A2teau_Frontenac_city_at_night.jpg) | Wilfredor | CC BY-SA 4.0 |
| Golden hour | [Corcovado sunset silhouette](https://commons.wikimedia.org/wiki/File:Corcovado_sunset_silhouette.jpg) | Jay.Jarosz | CC BY-SA 4.0 |
| Golden hour | [Hotel Le Concorde at sunset in Quebec City](https://commons.wikimedia.org/wiki/File:Hotel_Le_Concorde_at_sunset_in_Quebec_City.jpg) | Wilfredor | CC0 |
| Reds & oranges | [Fruit Stall in Barcelona Market](https://commons.wikimedia.org/wiki/File:Fruit_Stall_in_Barcelona_Market.jpg) | Daderot | CC BY-SA 3.0 |
| Reds & oranges | [Burrabazar Market in Kolkata 09](https://commons.wikimedia.org/wiki/File:Burrabazar_Market_in_Kolkata_09.jpg) | Kritzolina | CC BY-SA 4.0 |
| Reds & oranges | [Fruit market in Hama](https://commons.wikimedia.org/wiki/File:Fruit_market_in_Hama.jpg) | Bernard Gagnon | CC BY-SA 3.0 |
| Overcast | [Banff National Park (AB, Canada), Lake Louise](https://commons.wikimedia.org/wiki/File:Banff_National_Park_(AB,_Canada),_Lake_Louise_--_2022_--_2200.jpg) | Dietmar Rabich | CC BY-SA 4.0 |
| Overcast | [Kirkjufell, Iceland, 20240714 1631 0713](https://commons.wikimedia.org/wiki/File:Kirkjufell,_Iceland,_20240714_1631_0713.jpg) | Jakub Hałun | CC BY 4.0 |
| Overcast | [Langweerderwielen (Langwarder Wielen). 03](https://commons.wikimedia.org/wiki/File:Langweerderwielen_(Langwarder_Wielen)._(d.j.b.)_03.jpg) | Dominicus Johannes Bergsma | CC BY-SA 4.0 |
| Snow | [Sellagruppe von Süden Col Rodella](https://commons.wikimedia.org/wiki/File:Sellagruppe_von_S%C3%BCden_Col_Rodella.jpg) | Wolfgang Moroder | CC BY-SA 3.0 |
| Snow | [Val di Fassa Dolomites Belvedere Marmolada Ciampac Col Rodella](https://commons.wikimedia.org/wiki/File:Val_di_Fassa_Dolomites_Belvedere_Marmolada_Ciampac_Col_Rodella.jpg) | Wolfgang Moroder | CC BY-SA 3.0 |
| Snow | [Llyn Llygad Rheidol](https://commons.wikimedia.org/wiki/File:Llyn_Llygad_Rheidol.jpg) | Jason.nlw | CC BY-SA 4.0 |
| Night neon | [Buildings with colorful neon street signs at blue hour, Shinjuku, Tokyo](https://commons.wikimedia.org/wiki/File:Buildings_with_colorful_neon_street_signs_at_blue_hour,_Shinjuku,_Tokyo.jpg) | Basile Morin | CC BY-SA 4.0 |
| Night neon | [Dotonbori, Osaka, at night, November 2016](https://commons.wikimedia.org/wiki/File:Dotonbori,_Osaka,_at_night,_November_2016.jpg) | Martin Falbisoner | CC BY-SA 4.0 |
| Night neon | [Building with a pink neon sign in Nablus](https://commons.wikimedia.org/wiki/File:Building_with_a_pink_neon_sign_in_Nablus_(DSC03938).jpg) | Trougnouf (Benoit Brummer) | CC BY 4.0 |
| Indoor | [Famiglia Mancini, São Paulo, Brazil](https://commons.wikimedia.org/wiki/File:Famiglia_Mancini,_S%C3%A3o_Paulo,_Brazil.jpg) | Wilfredor | CC BY-SA 4.0 |
| Indoor | [Restaurant in Place D'Youville, Quebec City](https://commons.wikimedia.org/wiki/File:Restaurant_in_Place_D%27Youville,_Quebec_City.jpg) | Wilfredor | CC0 |
| Indoor | [Inside of The Greenhouse Restaurant with vertical symmetry impression at the hotel The Ritz-Carlton Millenia Singapore](https://commons.wikimedia.org/wiki/File:Inside_of_The_Greenhouse_Restaurant_with_vertical_symmetry_impression_at_the_hotel_The_Ritz-Carlton_Millenia_Singapore.jpg) | Basile Morin | CC BY-SA 4.0 |
