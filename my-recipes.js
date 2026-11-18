/*
 * Your camera and your cartridges. Entries with a `slot` are loaded into custom settings C1–C7;
 * entries without one go to the Library only.
 * These ship with the app, so they appear on every device and on the hosted site.
 * When an entry here changes, the app updates it, unless you've since edited that recipe in the app.
 * Leave out `scenarios` to let the app suggest them.
 */
window.MY_RECIPES = {
  camera: 'X-T30 II',
  repertoire: [
    {
      id: 'mine-c3-shotbygreg',
      slot: 3,
      aka: 'Shotbygreg',
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
      scenarios: ['Beach', 'Sunny Day'],
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
      scenarios: ['Snow'],
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
      recipe: {
        sim: 'classicNeg',
        grain: 2, grainSize: 'large',
        cce: 2, ccfxb: 1,
        wb: 'asShot', wbR: 2, wbB: -4,
        drp: 'off', dr: 400, highlight: -1, shadow: 1.5,
        color: 4, sharpness: -1, nr: -4, clarity: 0,
      },
    },
  ],
};
