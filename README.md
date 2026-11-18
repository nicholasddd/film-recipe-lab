# Film Recipe Lab

A browser app for testing Fujifilm-style film recipes on your own photos, keeping a library of recipes, and organising them into the camera's custom slots and scenario playlists.

**Live:** https://nicholasddd.github.io/film-recipe-lab/

- **Home**: the current repertoire (custom settings C1–C7 on the X-T30 II), then playlists by scenario.
- **Playlists**: cartridges grouped by trip or scene, as a staggered grid or 3D carousels.
- **Library**: every saved cartridge, in a playlist or not. Paste recipes in as text, or add them with dropdowns that match the camera menus. Click any cartridge to open it.
- **Simulator**: pick a photo on the left (your own or one of 24 sample scenes), click a cartridge on the right to apply it, and fine-tune settings including aperture, shutter and ISO.
- **Compare**: 2–4 cartridges side by side across the sample scenes.
- **Calibrate**: learn a film simulation's exact colours from PROVIA/sim JPEG pairs shot on your camera.

The film simulations are approximations, not Fujifilm's processing. Everything runs in the browser; recipes you add in the app are stored in that browser only. Your own repertoire lives in `my-recipes.js`, so it ships with the site.

Run locally with any static server, for example `python3 -m http.server`.

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
