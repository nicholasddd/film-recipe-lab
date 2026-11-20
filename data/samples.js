/*
 * Sample scenes for testing recipes: three freely licensed Wikimedia Commons photos per
 * category, each category stressing a different part of a recipe. Generated from Commons
 * licence metadata; loaded from Wikimedia (which allows cross-origin use) and credited in
 * the app wherever shown.
 */
window.SCENE_CATS = [
  {
    "key": "portrait",
    "label": "Portrait",
    "tests": "Skin tones: too orange, pink or yellow?"
  },
  {
    "key": "foliage",
    "label": "Sky & foliage",
    "tests": "Greens vs yellow-greens, sky depth (FX Blue)"
  },
  {
    "key": "golden",
    "label": "Golden hour",
    "tests": "Warmth shift and highlight roll-off: orange or yellow?"
  },
  {
    "key": "market",
    "label": "Reds & oranges",
    "tests": "Red and orange strength vs yellow creep (Color Chrome)"
  },
  {
    "key": "overcast",
    "label": "Overcast",
    "tests": "Life or mud in flat light: shadow tone, contrast"
  },
  {
    "key": "snow",
    "label": "Snow",
    "tests": "White balance on snow, highlight protection"
  },
  {
    "key": "night",
    "label": "Night neon",
    "tests": "Mixed light, white balance, shadows and grain"
  },
  {
    "key": "indoor",
    "label": "Indoor",
    "tests": "Does the white balance tame the orange cast?"
  }
];
window.SAMPLE_SCENES = [
  {
    "key": "portrait-1",
    "cat": "portrait",
    "label": "Portrait",
    "tests": "Skin tones: too orange, pink or yellow?",
    "title": "Kutia kondh woman 3",
    "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Kutia_kondh_woman_3.jpg/1280px-Kutia_kondh_woman_3.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Kutia_kondh_woman_3.jpg",
    "author": "PICQ (background blur by Samsara)",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  {
    "key": "portrait-2",
    "cat": "portrait",
    "label": "Portrait",
    "tests": "Skin tones: too orange, pink or yellow?",
    "title": "Baby portrait 1-year-old",
    "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Baby_portrait_1-year-old.jpg/1280px-Baby_portrait_1-year-old.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Baby_portrait_1-year-old.jpg",
    "author": "Kozuch",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
  },
  {
    "key": "portrait-3",
    "cat": "portrait",
    "label": "Portrait",
    "tests": "Skin tones: too orange, pink or yellow?",
    "title": "Hue Vietnam Thien-Mu-Temple-and-Pagoda-03",
    "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Hue_Vietnam_Thien-Mu-Temple-and-Pagoda-03.jpg/1280px-Hue_Vietnam_Thien-Mu-Temple-and-Pagoda-03.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Hue_Vietnam_Thien-Mu-Temple-and-Pagoda-03.jpg",
    "author": "CEphoto, Uwe Aranas",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
  },
  {
    "key": "foliage-1",
    "cat": "foliage",
    "label": "Sky & foliage",
    "tests": "Greens vs yellow-greens, sky depth (FX Blue)",
    "title": "Central Park New York May 2015 007",
    "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Central_Park_New_York_May_2015_007.jpg/1280px-Central_Park_New_York_May_2015_007.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Central_Park_New_York_May_2015_007.jpg",
    "author": "King of Hearts",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
  },
  {
    "key": "foliage-2",
    "cat": "foliage",
    "label": "Sky & foliage",
    "tests": "Greens vs yellow-greens, sky depth (FX Blue)",
    "title": "2024-11-19-Central Park-0669",
    "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/2024-11-19-Central_Park-0669.jpg/1280px-2024-11-19-Central_Park-0669.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:2024-11-19-Central_Park-0669.jpg",
    "author": "Superbass",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  {
    "key": "foliage-3",
    "cat": "foliage",
    "label": "Sky & foliage",
    "tests": "Greens vs yellow-greens, sky depth (FX Blue)",
    "title": "Dülmen, Wildpark",
    "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/D%C3%BClmen%2C_Wildpark_--_2018_--_1458-62.jpg/1280px-D%C3%BClmen%2C_Wildpark_--_2018_--_1458-62.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:D%C3%BClmen,_Wildpark_--_2018_--_1458-62.jpg",
    "author": "Dietmar Rabich",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  {
    "key": "golden-1",
    "cat": "golden",
    "label": "Golden hour",
    "tests": "Warmth shift and highlight roll-off: orange or yellow?",
    "title": "Château Frontenac city at night",
    "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Ch%C3%A2teau_Frontenac_city_at_night.jpg/1280px-Ch%C3%A2teau_Frontenac_city_at_night.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Ch%C3%A2teau_Frontenac_city_at_night.jpg",
    "author": "Wilfredor",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  {
    "key": "golden-2",
    "cat": "golden",
    "label": "Golden hour",
    "tests": "Warmth shift and highlight roll-off: orange or yellow?",
    "title": "Corcovado sunset silhouette",
    "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Corcovado_sunset_silhouette.jpg/1280px-Corcovado_sunset_silhouette.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Corcovado_sunset_silhouette.jpg",
    "author": "Jay.Jarosz",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  {
    "key": "golden-3",
    "cat": "golden",
    "label": "Golden hour",
    "tests": "Warmth shift and highlight roll-off: orange or yellow?",
    "title": "Hotel Le Concorde at sunset in Quebec City",
    "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Hotel_Le_Concorde_at_sunset_in_Quebec_City.jpg/1280px-Hotel_Le_Concorde_at_sunset_in_Quebec_City.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Hotel_Le_Concorde_at_sunset_in_Quebec_City.jpg",
    "author": "Wilfredor",
    "license": "CC0",
    "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/"
  },
  {
    "key": "market-1",
    "cat": "market",
    "label": "Reds & oranges",
    "tests": "Red and orange strength vs yellow creep (Color Chrome)",
    "title": "Fruit Stall in Barcelona Market",
    "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Fruit_Stall_in_Barcelona_Market.jpg/1280px-Fruit_Stall_in_Barcelona_Market.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Fruit_Stall_in_Barcelona_Market.jpg",
    "author": "Daderot",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
  },
  {
    "key": "market-2",
    "cat": "market",
    "label": "Reds & oranges",
    "tests": "Red and orange strength vs yellow creep (Color Chrome)",
    "title": "Burrabazar Market in Kolkata 09",
    "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Burrabazar_Market_in_Kolkata_09.jpg/1280px-Burrabazar_Market_in_Kolkata_09.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Burrabazar_Market_in_Kolkata_09.jpg",
    "author": "Kritzolina",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  {
    "key": "market-3",
    "cat": "market",
    "label": "Reds & oranges",
    "tests": "Red and orange strength vs yellow creep (Color Chrome)",
    "title": "Fruit market in Hama",
    "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Fruit_market_in_Hama.jpg/1280px-Fruit_market_in_Hama.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Fruit_market_in_Hama.jpg",
    "author": "Bernard Gagnon",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
  },
  {
    "key": "overcast-1",
    "cat": "overcast",
    "label": "Overcast",
    "tests": "Life or mud in flat light: shadow tone, contrast",
    "title": "Banff National Park (AB, Canada), Lake Louise",
    "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Banff_National_Park_%28AB%2C_Canada%29%2C_Lake_Louise_--_2022_--_2200.jpg/1280px-Banff_National_Park_%28AB%2C_Canada%29%2C_Lake_Louise_--_2022_--_2200.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Banff_National_Park_(AB,_Canada),_Lake_Louise_--_2022_--_2200.jpg",
    "author": "Dietmar Rabich",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  {
    "key": "overcast-2",
    "cat": "overcast",
    "label": "Overcast",
    "tests": "Life or mud in flat light: shadow tone, contrast",
    "title": "Kirkjufell, Iceland, 20240714 1631 0713",
    "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Kirkjufell%2C_Iceland%2C_20240714_1631_0713.jpg/1280px-Kirkjufell%2C_Iceland%2C_20240714_1631_0713.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Kirkjufell,_Iceland,_20240714_1631_0713.jpg",
    "author": "Jakub Hałun",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0/"
  },
  {
    "key": "overcast-3",
    "cat": "overcast",
    "label": "Overcast",
    "tests": "Life or mud in flat light: shadow tone, contrast",
    "title": "Langweerderwielen (Langwarder Wielen). 03",
    "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Langweerderwielen_%28Langwarder_Wielen%29._%28d.j.b.%29_03.jpg/1280px-Langweerderwielen_%28Langwarder_Wielen%29._%28d.j.b.%29_03.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Langweerderwielen_(Langwarder_Wielen)._(d.j.b.)_03.jpg",
    "author": "Dominicus Johannes Bergsma",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  {
    "key": "snow-1",
    "cat": "snow",
    "label": "Snow",
    "tests": "White balance on snow, highlight protection",
    "title": "Sellagruppe von Süden Col Rodella",
    "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Sellagruppe_von_S%C3%BCden_Col_Rodella.jpg/1280px-Sellagruppe_von_S%C3%BCden_Col_Rodella.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Sellagruppe_von_S%C3%BCden_Col_Rodella.jpg",
    "author": "Wolfgang Moroder",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
  },
  {
    "key": "snow-2",
    "cat": "snow",
    "label": "Snow",
    "tests": "White balance on snow, highlight protection",
    "title": "Val di Fassa Dolomites Belvedere Marmolada Ciampac Col Rodella",
    "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Val_di_Fassa_Dolomites_Belvedere_Marmolada_Ciampac_Col_Rodella.jpg/1280px-Val_di_Fassa_Dolomites_Belvedere_Marmolada_Ciampac_Col_Rodella.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Val_di_Fassa_Dolomites_Belvedere_Marmolada_Ciampac_Col_Rodella.jpg",
    "author": "Wolfgang Moroder",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
  },
  {
    "key": "snow-3",
    "cat": "snow",
    "label": "Snow",
    "tests": "White balance on snow, highlight protection",
    "title": "Llyn Llygad Rheidol",
    "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Llyn_Llygad_Rheidol.jpg/1280px-Llyn_Llygad_Rheidol.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Llyn_Llygad_Rheidol.jpg",
    "author": "Jason.nlw",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  {
    "key": "night-1",
    "cat": "night",
    "label": "Night neon",
    "tests": "Mixed light, white balance, shadows and grain",
    "title": "Buildings with colorful neon street signs at blue hour, Shinjuku, Tokyo",
    "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Buildings_with_colorful_neon_street_signs_at_blue_hour%2C_Shinjuku%2C_Tokyo.jpg/1280px-Buildings_with_colorful_neon_street_signs_at_blue_hour%2C_Shinjuku%2C_Tokyo.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Buildings_with_colorful_neon_street_signs_at_blue_hour,_Shinjuku,_Tokyo.jpg",
    "author": "Basile Morin",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  {
    "key": "night-2",
    "cat": "night",
    "label": "Night neon",
    "tests": "Mixed light, white balance, shadows and grain",
    "title": "Dotonbori, Osaka, at night, November 2016",
    "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Dotonbori%2C_Osaka%2C_at_night%2C_November_2016.jpg/1280px-Dotonbori%2C_Osaka%2C_at_night%2C_November_2016.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Dotonbori,_Osaka,_at_night,_November_2016.jpg",
    "author": "Martin Falbisoner",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  {
    "key": "night-3",
    "cat": "night",
    "label": "Night neon",
    "tests": "Mixed light, white balance, shadows and grain",
    "title": "Building with a pink neon sign in Nablus",
    "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Building_with_a_pink_neon_sign_in_Nablus_%28DSC03938%29.jpg/1280px-Building_with_a_pink_neon_sign_in_Nablus_%28DSC03938%29.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Building_with_a_pink_neon_sign_in_Nablus_(DSC03938).jpg",
    "author": "Trougnouf (Benoit Brummer)",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0/"
  },
  {
    "key": "indoor-1",
    "cat": "indoor",
    "label": "Indoor",
    "tests": "Does the white balance tame the orange cast?",
    "title": "Famiglia Mancini, São Paulo, Brazil",
    "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Famiglia_Mancini%2C_S%C3%A3o_Paulo%2C_Brazil.jpg/1280px-Famiglia_Mancini%2C_S%C3%A3o_Paulo%2C_Brazil.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Famiglia_Mancini,_S%C3%A3o_Paulo,_Brazil.jpg",
    "author": "Wilfredor",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  {
    "key": "indoor-2",
    "cat": "indoor",
    "label": "Indoor",
    "tests": "Does the white balance tame the orange cast?",
    "title": "Restaurant in Place D'Youville, Quebec City",
    "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Restaurant_in_Place_D%27Youville%2C_Quebec_City.jpg/1280px-Restaurant_in_Place_D%27Youville%2C_Quebec_City.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Restaurant_in_Place_D%27Youville,_Quebec_City.jpg",
    "author": "Wilfredor",
    "license": "CC0",
    "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/"
  },
  {
    "key": "indoor-3",
    "cat": "indoor",
    "label": "Indoor",
    "tests": "Does the white balance tame the orange cast?",
    "title": "Inside of The Greenhouse Restaurant with vertical symmetry impression at the hotel The Ritz-Carlton Millenia Singapore",
    "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Inside_of_The_Greenhouse_Restaurant_with_vertical_symmetry_impression_at_the_hotel_The_Ritz-Carlton_Millenia_Singapore.jpg/1280px-Inside_of_The_Greenhouse_Restaurant_with_vertical_symmetry_impression_at_the_hotel_The_Ritz-Carlton_Millenia_Singapore.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Inside_of_The_Greenhouse_Restaurant_with_vertical_symmetry_impression_at_the_hotel_The_Ritz-Carlton_Millenia_Singapore.jpg",
    "author": "Basile Morin",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
  }
];
// the scene shown on cartridge faces and when the app opens
window.DEFAULT_SCENE = 'snow-1';
