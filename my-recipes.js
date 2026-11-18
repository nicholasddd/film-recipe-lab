/*
 * Your camera and your cartridges. Entries with a `slot` are loaded into custom settings C1–C7;
 * entries without one go to the Library only.
 * These ship with the app, so they appear on every device and on the hosted site.
 * When an entry here changes, the app updates it, unless you've since edited that recipe in the app.
 * Leave out `scenarios` to let the app suggest them.
 */
window.MY_RECIPES = {
  camera: 'X-T30 II',
  // your playlists, in order; changing this list replaces the playlists in the app
  playlists: ['Winter Pilgrimage 2026', 'Rainy Day', 'Beach', 'European Summer', 'Dolomites 2027'],
  repertoire: [
    {
      id: 'mine-c3-shotbygreg',
      slot: 3,
      aka: 'Shotbygreg',
      scenarios: ['Winter Pilgrimage 2026', 'Beach'],
      notes: 'Clarity is sometimes greyed out on the camera.',
      recipe: {
        sim: 'classicNeg',
        grain: 0,
        cce: 2, ccfxb: 0,
        wb: 'asShot', wbR: 0, wbB: 0,
        drp: 'off', dr: 200, highlight: -2, shadow: -2,
        color: 4, sharpness: -4, nr: -3, clarity: 0,
      },
    },
    {
      id: 'mine-c4-seagull-beach',
      slot: 4,
      aka: 'Seagull Beach',
      scenarios: ['Beach', 'European Summer', 'Dolomites 2027'],
      notes: 'Clarity is sometimes greyed out on the camera.',
      recipe: {
        sim: 'classicNeg',
        grain: 0,
        cce: 2, ccfxb: 2,
        wb: 'daylight', wbR: 2, wbB: -4,
        drp: 'off', dr: 400, highlight: -2, shadow: 0,
        color: 4, sharpness: -2, nr: -4, clarity: 0,
      },
    },
    {
      id: 'mine-c6-snowy-day',
      slot: 6,
      aka: 'Snowy Day',
      scenarios: ['Winter Pilgrimage 2026', 'Dolomites 2027'],
      notes: 'Clarity is sometimes greyed out on the camera.',
      recipe: {
        sim: 'classicChrome',
        grain: 1, grainSize: 'small',
        cce: 0, ccfxb: 2,
        wb: 'asShot', wbR: 2, wbB: -4,
        drp: 'strong',
        color: 4, sharpness: -2, nr: -4, clarity: 0,
      },
    },
    {
      id: 'mine-california-hues',
      aka: 'California Hues',
      scenarios: ['Beach', 'European Summer', 'Rainy Day'],
      recipe: {
        sim: 'classicNeg',
        grain: 2, grainSize: 'large',
        cce: 2, ccfxb: 1,
        wb: 'asShot', wbR: 2, wbB: -4,
        drp: 'off', dr: 400, highlight: -1, shadow: 1.5,
        color: 4, sharpness: -1, nr: -4, clarity: 0,
      },
    },
    {
      id: 'mine-snowski',
      aka: 'Snowski',
      scenarios: ['Winter Pilgrimage 2026', 'Dolomites 2027'],
      notes: 'Grain is to taste (Weak, Small is the starting point).',
      recipe: {
        sim: 'classicNeg',
        grain: 1, grainSize: 'small',
        cce: 2, ccfxb: 1,
        wb: 'asShot', wbR: -1, wbB: -3,
        drp: 'off', dr: 400, highlight: -1, shadow: -1.5,
        color: 4, sharpness: -2, nr: -4, clarity: 0,
      },
    },
    {
      id: 'mine-portra-dol-sol',
      aka: 'Portra Dol Sol',
      scenarios: ['Beach', 'European Summer'],
      recipe: {
        sim: 'classicChrome',
        grain: 0,
        cce: 2, ccfxb: 0,
        wb: 'asShot', wbR: 2, wbB: -6,
        drp: 'off', dr: 400, highlight: -2, shadow: -2,
        color: 3, sharpness: -2, nr: -4, clarity: 0,
      },
    },
    {
      id: 'mine-nostalgic-haze',
      aka: 'Nostalgic Haze',
      scenarios: [],
      notes: 'Uses Nostalgic Neg., which the X-T30 II does not have: simulator only.',
      recipe: {
        sim: 'nostalgicNeg',
        grain: 1, grainSize: 'small',
        cce: 2, ccfxb: 1,
        wb: 'autoWhite', wbR: 2, wbB: -4,
        drp: 'off', dr: 400, highlight: -1.5, shadow: -1,
        color: 3, sharpness: 1, nr: -4, clarity: 0,
      },
    },
    {
      id: 'mine-crimson-shift',
      aka: 'Crimson Shift',
      scenarios: ['Beach', 'European Summer', 'Rainy Day', 'Dolomites 2027'],
      ec: '-1/3',
      notes: 'Strong reds and oranges with little yellow: warmth comes from Red +3, Blue only -2. Shoot 0 to -1/3 so oranges stay saturated.',
      recipe: {
        sim: 'classicNeg',
        grain: 1, grainSize: 'small',
        cce: 2, ccfxb: 1,
        wb: 'daylight', wbR: 3, wbB: -2,
        drp: 'off', dr: 400, highlight: -1.5, shadow: 0.5,
        color: 3, sharpness: -1, nr: -4, clarity: 0,
      },
    },
    {
      id: 'mine-plain-vanilla-indoor',
      aka: 'Plain Vanilla Indoor',
      scenarios: ['Winter Pilgrimage 2026', 'Rainy Day'],
      recipe: {
        sim: 'classicChrome',
        grain: 1, grainSize: 'small',
        cce: 2, ccfxb: 1,
        wb: 'autoWhite', wbR: 3, wbB: -5,
        drp: 'off', dr: 100, highlight: 1, shadow: 0.5,
        color: 3, sharpness: -2, nr: -4, clarity: 0,
      },
    },
  ],
};
