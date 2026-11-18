/*
 * Sample scenes for testing recipes: eight freely licensed photos from Wikimedia Commons,
 * each chosen to stress a different part of a recipe. They're loaded from Wikimedia
 * (which allows cross-origin use) and credited in the app while shown.
 */
window.SAMPLE_SCENES = [
  {
    key: 'portrait', label: 'Portrait', tests: 'Skin tones: too orange, pink or yellow?',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Kutia_kondh_woman_3.jpg/1280px-Kutia_kondh_woman_3.jpg',
    page: 'https://commons.wikimedia.org/wiki/File:Kutia_kondh_woman_3.jpg',
    author: 'PICQ (background blur by Samsara)', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  },
  {
    key: 'foliage', label: 'Sky & foliage', tests: 'Greens vs yellow-greens, sky depth (FX Blue)',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Central_Park_New_York_May_2015_007.jpg/1280px-Central_Park_New_York_May_2015_007.jpg',
    page: 'https://commons.wikimedia.org/wiki/File:Central_Park_New_York_May_2015_007.jpg',
    author: 'King of Hearts', license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
  },
  {
    key: 'golden', label: 'Golden hour', tests: 'Warmth shift and highlight roll-off: orange or yellow?',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Ch%C3%A2teau_Frontenac_city_at_night.jpg/1280px-Ch%C3%A2teau_Frontenac_city_at_night.jpg',
    page: 'https://commons.wikimedia.org/wiki/File:Ch%C3%A2teau_Frontenac_city_at_night.jpg',
    author: 'Wilfredor', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  },
  {
    key: 'market', label: 'Reds & oranges', tests: 'Red and orange strength vs yellow creep (Color Chrome)',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Fruit_Stall_in_Barcelona_Market.jpg/1280px-Fruit_Stall_in_Barcelona_Market.jpg',
    page: 'https://commons.wikimedia.org/wiki/File:Fruit_Stall_in_Barcelona_Market.jpg',
    author: 'Daderot', license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
  },
  {
    key: 'overcast', label: 'Overcast', tests: 'Life or mud in flat light: shadow tone, contrast',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Banff_National_Park_%28AB%2C_Canada%29%2C_Lake_Louise_--_2022_--_2200.jpg/1280px-Banff_National_Park_%28AB%2C_Canada%29%2C_Lake_Louise_--_2022_--_2200.jpg',
    page: 'https://commons.wikimedia.org/wiki/File:Banff_National_Park_(AB,_Canada),_Lake_Louise_--_2022_--_2200.jpg',
    author: 'Dietmar Rabich', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  },
  {
    key: 'snow', label: 'Snow (Dolomites)', tests: 'White balance on snow, highlight protection',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Sellagruppe_von_S%C3%BCden_Col_Rodella.jpg/1280px-Sellagruppe_von_S%C3%BCden_Col_Rodella.jpg',
    page: 'https://commons.wikimedia.org/wiki/File:Sellagruppe_von_S%C3%BCden_Col_Rodella.jpg',
    author: 'Wolfgang Moroder', license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
  },
  {
    key: 'night', label: 'Night neon', tests: 'Mixed light, white balance, shadows and grain',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Buildings_with_colorful_neon_street_signs_at_blue_hour%2C_Shinjuku%2C_Tokyo.jpg/1280px-Buildings_with_colorful_neon_street_signs_at_blue_hour%2C_Shinjuku%2C_Tokyo.jpg',
    page: 'https://commons.wikimedia.org/wiki/File:Buildings_with_colorful_neon_street_signs_at_blue_hour,_Shinjuku,_Tokyo.jpg',
    author: 'Basile Morin', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  },
  {
    key: 'indoor', label: 'Indoor tungsten', tests: 'Does the white balance tame the orange cast?',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Famiglia_Mancini%2C_S%C3%A3o_Paulo%2C_Brazil.jpg/1280px-Famiglia_Mancini%2C_S%C3%A3o_Paulo%2C_Brazil.jpg',
    page: 'https://commons.wikimedia.org/wiki/File:Famiglia_Mancini,_S%C3%A3o_Paulo,_Brazil.jpg',
    author: 'Wilfredor', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  },
];
// the scene shown on cartridge faces and when the app opens
window.DEFAULT_SCENE = 'snow';
