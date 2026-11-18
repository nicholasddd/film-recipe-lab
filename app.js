(function () {
  'use strict';
  const FE = window.FilmEngine;
  const $ = (id) => document.getElementById(id);
  const PREVIEW_MAX = 1400, THUMB_MAX = 560, EXPORT_MAX = 3000, SLOTS = 8;

  // ---------------- state ----------------
  const state = {
    recipe: { ...FE.DEFAULT_RECIPE },
    loadedId: null,
    full: null,                 // canvas holding the full-res source
    zoom: null,                 // {x, y} centre of 100% crop, or null for fit
    src: null, view: null, noise: null,
    thumb: null,                // {src, view, noise} small source for library/lineup previews
    exposure: { orig: { aperture: 5.6, shutter: 1 / 250, iso: 160 }, next: { aperture: 5.6, shutter: 1 / 250, iso: 160 }, ec: 0 },
    showOriginal: false,
    libFilter: 'All', lineupScenario: null, quickSlot: -1,
    libMode: (() => { try { return localStorage.getItem('filmRecipeLab.libMode') || 'grid'; } catch (e) { return 'grid'; } })(),
  };

  // ---------------- storage ----------------
  const DEFAULT_SCENARIOS = ['Beach', 'Sunny Day', 'Overcast', 'Rainy Day', 'Mountains', 'Greenery', 'Golden Hour', 'Night / City', 'Snow', 'Portrait', 'Indoor'];
  const STORE_KEY = 'filmRecipeLab.v1';
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const store = load();
  function load() {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) { /* ignore */ }
    s = s || {};
    s.scenarios = s.scenarios || DEFAULT_SCENARIOS.slice();
    s.recipes = s.recipes || starterRecipes();
    s.recipes.forEach((r) => (r.recipe = { ...FE.DEFAULT_RECIPE, ...r.recipe }));
    s.lineups = s.lineups || {};
    s.repertoire = s.repertoire || [];
    return s;
  }
  function persist() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { alert('Could not save to browser storage: ' + e.message); }
  }
  function starterRecipes() {
    const R = (name, scenarios, notes, r) => ({ id: uid(), name, scenarios, notes, created: Date.now(), recipe: { ...FE.DEFAULT_RECIPE, ...r } });
    return [
      R('Warm Coastal Neg', ['Beach', 'Sunny Day'], 'Starter recipe. Classic Neg with warm shift, soft highlights.',
        { sim: 'classicNeg', grain: 1, cce: 2, ccfxb: 1, wbR: 2, wbB: -4, dr: 400, highlight: -1, shadow: 1, color: 2, sharpness: -2, nr: -4, clarity: -2 }),
      R('Faded Chrome', ['Overcast', 'Night / City'], 'Starter recipe. Muted, contrasty street look.',
        { sim: 'classicChrome', grain: 2, cce: 2, ccfxb: 1, wb: 'daylight', wbR: 2, wbB: -5, dr: 200, shadow: 1, color: -1, sharpness: -1, nr: -4, clarity: 1 }),
      R('Golden Nostalgia', ['Golden Hour', 'Portrait'], 'Starter recipe. Amber highlights, gentle shadows.',
        { sim: 'nostalgicNeg', grain: 1, grainSize: 'large', cce: 1, wb: 'shade', wbR: 1, wbB: -2, dr: 400, highlight: -1, shadow: -0.5, color: 1, sharpness: -1, nr: -4 }),
      R('Lush Velvia', ['Greenery', 'Mountains'], 'Starter recipe. Punchy greens and skies.',
        { sim: 'velvia', cce: 1, ccfxb: 2, dr: 200, highlight: -1, shadow: 0, color: 0, sharpness: 0, nr: -2 }),
      R('Rainy Eterna', ['Rainy Day', 'Overcast'], 'Starter recipe. Flat, cinematic, teal shadows.',
        { sim: 'eterna', grain: 1, ccfxb: 1, wbR: -1, wbB: 1, dr: 400, highlight: -1, shadow: 1, color: 2, sharpness: -2, nr: -4, clarity: -1 }),
      R('Gritty Acros', ['Rainy Day', 'Night / City'], 'Starter recipe. Red filter, hard tones.',
        { sim: 'acros', monoFilter: 'r', grain: 2, grainSize: 'large', highlight: 1, shadow: 2, sharpness: 1, nr: -4, clarity: 2 }),
    ];
  }

  // ---------------- controls ----------------
  const CAM_NAME = (window.MY_RECIPES && window.MY_RECIPES.camera) || 'X-T30 II';
  const CAM = window.RecipeTools.CAMERAS[CAM_NAME];
  const REP_SLOTS = CAM.slots;
  const simOpts = Object.entries(FE.SIMS).map(([k, s]) => [k, CAM.sims.includes(k) ? s.name : `${s.name} (not on ${CAM_NAME})`]);
  const isMono = () => FE.SIMS[state.recipe.sim].mono;
  const CONTROLS = [
    { h: 'Film simulation' },
    { k: 'sim', label: 'Simulation', opts: simOpts },
    { k: 'monoFilter', label: 'Filter', opts: [['std', 'Standard'], ['ye', 'Yellow'], ['r', 'Red'], ['g', 'Green']], show: isMono },
    { k: 'monoWC', label: 'Mono WC', min: -9, max: 9, step: 1, show: () => isMono() && state.recipe.sim !== 'sepia' },
    { k: 'monoMG', label: 'Mono MG', min: -9, max: 9, step: 1, show: () => isMono() && state.recipe.sim !== 'sepia' },
    { h: 'Effects' },
    { k: 'grain', label: 'Grain', opts: [[0, 'Off'], [1, 'Weak'], [2, 'Strong']], num: true },
    { k: 'grainSize', label: 'Grain size', opts: [['small', 'Small'], ['large', 'Large']], show: () => state.recipe.grain > 0 },
    { k: 'cce', label: 'Color Chrome', opts: [[0, 'Off'], [1, 'Weak'], [2, 'Strong']], num: true, show: () => !isMono() },
    { k: 'ccfxb', label: 'CC FX Blue', opts: [[0, 'Off'], [1, 'Weak'], [2, 'Strong']], num: true, show: () => !isMono() },
    { h: 'White balance' },
    { k: 'wb', label: 'White balance', opts: [['asShot', 'Auto (as shot)'], ['autoWhite', 'Auto White Priority'], ['autoAmbience', 'Auto Ambience Priority'], ['daylight', 'Daylight'], ['cloudy', 'Cloudy'], ['shade', 'Shade'], ['fluorescent', 'Fluorescent'], ['incandescent', 'Incandescent'], ['underwater', 'Underwater'], ['kelvin', 'Kelvin']] },
    { k: 'kelvin', label: 'Kelvin', min: 2500, max: 10000, step: 100, show: () => state.recipe.wb === 'kelvin' },
    { k: 'wbR', label: 'WB shift R', min: -9, max: 9, step: 1 },
    { k: 'wbB', label: 'WB shift B', min: -9, max: 9, step: 1 },
    { h: 'Tone' },
    { k: 'drp', label: 'D Range Priority', opts: [['off', 'Off'], ['auto', 'Auto'], ['weak', 'Weak'], ['strong', 'Strong']] },
    { k: 'dr', label: 'Dynamic range', opts: [[100, 'DR100'], [200, 'DR200'], [400, 'DR400']], num: true, show: () => state.recipe.drp === 'off' },
    { k: 'highlight', label: 'Highlight', min: -2, max: 4, step: 0.5, show: () => state.recipe.drp === 'off' },
    { k: 'shadow', label: 'Shadow', min: -2, max: 4, step: 0.5, show: () => state.recipe.drp === 'off' },
    { k: 'color', label: 'Color', min: -4, max: 4, step: 1, show: () => !isMono() },
    { h: 'Detail' },
    { k: 'sharpness', label: 'Sharpness', min: -4, max: 4, step: 1 },
    { k: 'nr', label: 'High ISO NR', min: -4, max: 4, step: 1 },
    { k: 'clarity', label: 'Clarity', min: -5, max: 5, step: 1 },
  ];
  const fmt = (v) => (v > 0 ? '+' : '') + (Number.isInteger(v) ? v : v.toFixed(1));

  // ---------------- "?" help for every setting ----------------
  const HELP = {
    sim: 'The base look: its tone curve, colour palette and contrast. Every other setting adjusts on top of this.',
    monoFilter: 'For ACROS and Monochrome. Works like a coloured lens filter: Ye darkens blue skies a little, R darkens skies a lot and smooths skin, G lightens foliage and darkens lips and skin.',
    monoWC: 'Tints black and white photos. + is warm (towards sepia), − is cool (towards blue).',
    monoMG: 'Tints black and white photos. + is magenta, − is green.',
    grain: 'Adds film-like grain. Weak/Strong is how visible it is, Small/Large is how coarse. It shows most in midtones and almost disappears on a small preview, so zoom to 100% to judge it.',
    grainSize: 'How coarse the grain is. Small is fine like slow film, Large is chunkier like fast film.',
    cce: 'Deepens strongly saturated colours (reds, yellows, greens) so they keep tone and detail instead of turning into flat blobs. Strong gives richer, darker colour.',
    ccfxb: 'Color Chrome for blues only: deeper, richer skies and water.',
    wb: 'Sets what the camera treats as neutral white. Auto adapts to each scene. A preset like Daylight locks it, so golden hour stays warm and shade stays cool instead of being corrected away.',
    kelvin: 'A manual white balance. Higher K makes the photo warmer, lower K makes it cooler.',
    wbR: 'Fine-tunes white balance. + adds red, − adds cyan.',
    wbB: 'Fine-tunes white balance. + adds blue, − adds yellow. Many film recipes use +Red/−Blue for a warm, filmic cast.',
    drp: 'Automatic highlight and shadow protection for high-contrast scenes. While it\'s on, the camera sets Dynamic Range and the tone curve for you (Strong is the flattest). Turn it off to set them yourself.',
    dr: 'Protects bright areas like skies from blowing out. DR200 and DR400 keep more highlight detail but need ISO 320 and 640 or higher. DR100 has the most contrast.',
    highlight: 'Controls the bright tones. − is softer and holds more highlight detail. + is harder, with brighter, punchier highlights.',
    shadow: 'Controls the dark tones. − lifts the shadows for a flatter look with more detail. + deepens them for more punch.',
    color: 'Overall saturation. − is muted, + is vivid.',
    sharpness: 'Edge sharpening done in the camera. − is softer and more film-like. + is crisper but can look digital.',
    nr: 'Noise reduction at high ISO. − keeps more natural texture (most recipes use −4). + is smoother but smears fine detail.',
    clarity: 'Local contrast in the midtones. + adds texture and punch, − adds a soft glow. On the camera it slows saving each photo and isn\'t available in some modes.',
    slot: 'Which custom setting slot (C1–C7) holds this recipe on your camera.',
    iso: 'The ISO you usually shoot this recipe at. This is a reminder only, not saved as an image setting.',
    ec: 'The exposure compensation you usually use with this recipe. Many film looks are shot slightly bright (+1/3 to +2/3).',
  };
  HELP.simChoice = HELP.sim;
  HELP.grainChoice = HELP.grain;
  const qm = (k) => (HELP[k] ? `<button type="button" class="qm" data-help="${k}" aria-label="What does this do?">?</button>` : '');
  function showTip(btn) {
    let tip = document.getElementById('tip');
    const host = btn.closest('dialog') || document.body; // dialogs sit in the top layer
    if (!tip || tip.parentElement !== host) { if (tip) tip.remove(); tip = document.createElement('div'); tip.id = 'tip'; tip.setAttribute('role', 'tooltip'); host.appendChild(tip); }
    if (tip.dataset.for === btn.dataset.help && !tip.hidden) { tip.hidden = true; return; }
    tip.textContent = HELP[btn.dataset.help];
    tip.dataset.for = btn.dataset.help;
    tip.hidden = false;
    const r = btn.getBoundingClientRect(), w = Math.min(280, window.innerWidth - 24);
    tip.style.width = w + 'px';
    tip.style.left = Math.max(12, Math.min(window.innerWidth - w - 12, r.left - 12)) + 'px';
    const below = r.bottom + 8, h = tip.offsetHeight;
    tip.style.top = (below + h > window.innerHeight - 8 ? r.top - h - 8 : below) + 'px';
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.qm');
    if (b) { e.preventDefault(); e.stopPropagation(); showTip(b); return; }
    const tip = document.getElementById('tip');
    if (tip) tip.hidden = true;
  }, true);
  document.addEventListener('keydown', (e) => { const tip = document.getElementById('tip'); if (e.key === 'Escape' && tip) tip.hidden = true; });
  window.addEventListener('scroll', () => { const tip = document.getElementById('tip'); if (tip) tip.hidden = true; }, true);

  function buildControls() {
    const root = $('recipeControls');
    root.innerHTML = '';
    for (const c of CONTROLS) {
      if (c.h) { const h = document.createElement('h3'); h.textContent = c.h; root.appendChild(h); continue; }
      const row = document.createElement('div');
      row.className = 'row'; row.dataset.k = c.k;
      row.innerHTML = `<span>${c.label}${qm(c.k)}</span>`;
      if (c.opts) {
        const sel = document.createElement('select');
        for (const [v, t] of c.opts) sel.add(new Option(t, v));
        sel.onchange = () => { state.recipe[c.k] = c.num ? Number(sel.value) : sel.value; onRecipeChange(); };
        row.appendChild(sel);
      } else {
        const r = document.createElement('input');
        Object.assign(r, { type: 'range', min: c.min, max: c.max, step: c.step });
        const o = document.createElement('output');
        r.oninput = () => { state.recipe[c.k] = Number(r.value); o.textContent = c.k === 'kelvin' ? r.value + 'K' : fmt(Number(r.value)); onRecipeChange(); };
        r.ondblclick = () => { r.value = FE.DEFAULT_RECIPE[c.k]; r.oninput(); };
        row.append(r, o);
      }
      root.appendChild(row);
    }
    syncControls();
  }
  function syncControls() {
    for (const c of CONTROLS) {
      if (!c.k) continue;
      const row = document.querySelector(`.row[data-k="${c.k}"]`);
      row.style.display = !c.show || c.show() ? '' : 'none';
      const lk = c.locked && state.recipe.drp !== 'off';
      row.querySelectorAll('input, select').forEach((el) => (el.disabled = lk));
      row.title = lk ? 'Set automatically by D Range Priority' : '';
      const v = state.recipe[c.k];
      if (c.opts) row.querySelector('select').value = String(v);
      else {
        row.querySelector('input').value = v;
        row.querySelector('output').textContent = c.k === 'kelvin' ? v + 'K' : fmt(v);
      }
    }
    const loaded = store.recipes.find((r) => r.id === state.loadedId);
    const calibrated = FE.calibration.enabled && FE.calibration.luts[state.recipe.sim] && !isMono();
    $('loadedName').innerHTML = (loaded ? `Editing <b>${esc(loaded.name)}</b>${recipeEquals(loaded.recipe, state.recipe) ? '' : ' <span class="warn">(modified)</span>'}` : 'Unsaved recipe') +
      ` · ${esc(FE.SIMS[state.recipe.sim].name)}: ${calibrated ? '<span class="warn">calibrated from your camera</span>' : 'hand-tuned model'}`;
  }
  function onRecipeChange() { syncControls(); scheduleRender(); }
  const recipeEquals = (a, b) => Object.keys(FE.DEFAULT_RECIPE).every((k) => a[k] === b[k]);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------------- exposure ----------------
  const APERTURES = [1, 1.1, 1.2, 1.4, 1.6, 1.8, 2, 2.2, 2.5, 2.8, 3.2, 3.5, 4, 4.5, 5, 5.6, 6.4, 7.1, 8, 9, 10, 11, 13, 14, 16, 18, 20, 22];
  const SHUTTERS = ['1/8000', '1/6400', '1/5000', '1/4000', '1/3200', '1/2500', '1/2000', '1/1600', '1/1250', '1/1000', '1/800', '1/640', '1/500', '1/400', '1/320', '1/250', '1/200', '1/160', '1/125', '1/100', '1/80', '1/60', '1/50', '1/40', '1/30', '1/25', '1/20', '1/15', '1/13', '1/10', '1/8', '1/6', '1/5', '1/4', '0.3', '0.4', '0.5', '0.6', '0.8', '1', '1.3', '1.6', '2', '2.5', '3.2', '4', '8', '15', '30'];
  const ISOS = [64, 80, 100, 125, 160, 200, 250, 320, 400, 500, 640, 800, 1000, 1250, 1600, 2000, 2500, 3200, 4000, 5000, 6400, 8000, 10000, 12800];
  const parseShutter = (s) => {
    s = String(s).replace(/["s\s]/g, '');
    if (s.includes('/')) { const [a, b] = s.split('/').map(Number); return a / b; }
    return Number(s);
  };
  const fmtShutter = (t) => (t >= 0.3 ? String(+t.toFixed(1)) : '1/' + Math.round(1 / t));
  const nearestIdx = (list, v, f = Number) => {
    let best = 0, bd = Infinity;
    list.forEach((x, i) => { const dd = Math.abs(Math.log(f(x)) - Math.log(v)); if (dd < bd) { bd = dd; best = i; } });
    return best;
  };

  function buildExposure() {
    APERTURES.forEach((a) => $('nAp').add(new Option('f/' + a, a)));
    SHUTTERS.forEach((s) => $('nSh').add(new Option(s.includes('/') ? s : s + '"', s)));
    ISOS.forEach((i) => $('nIso').add(new Option(i, i)));
    $('oAp').onchange = $('oSh').onchange = $('oIso').onchange = () => { readOrig(); resetNextToOrig(); };
    $('nAp').onchange = $('nSh').onchange = $('nIso').onchange = $('ec').oninput = readNext;
    $('ec').ondblclick = () => { $('ec').value = 0; readNext(); };
    setOrig(state.exposure.orig);
  }
  function setOrig(o) {
    state.exposure.orig = { ...o };
    $('oAp').value = +o.aperture.toFixed(1);
    $('oSh').value = fmtShutter(o.shutter);
    $('oIso').value = o.iso;
    resetNextToOrig();
  }
  function readOrig() {
    const ap = Number($('oAp').value), sh = parseShutter($('oSh').value), iso = Number($('oIso').value);
    if (ap > 0) state.exposure.orig.aperture = ap;
    if (sh > 0) state.exposure.orig.shutter = sh;
    if (iso > 0) state.exposure.orig.iso = iso;
  }
  function resetNextToOrig() {
    const o = state.exposure.orig;
    $('nAp').selectedIndex = nearestIdx(APERTURES, o.aperture);
    $('nSh').selectedIndex = nearestIdx(SHUTTERS, o.shutter, parseShutter);
    $('nIso').selectedIndex = nearestIdx(ISOS, o.iso);
    $('ec').value = 0;
    readNext();
  }
  function readNext() {
    const e = state.exposure;
    // when a value matches the nearest stop to the original, keep the exact original
    const pick = (sel, list, ov, f) => (sel.selectedIndex === nearestIdx(list, ov, f) ? ov : f(list[sel.selectedIndex]));
    e.next = {
      aperture: pick($('nAp'), APERTURES, e.orig.aperture, Number),
      shutter: pick($('nSh'), SHUTTERS, e.orig.shutter, parseShutter),
      iso: pick($('nIso'), ISOS, e.orig.iso, Number),
    };
    e.ec = Math.round(Number($('ec').value) * 3) / 3;
    $('ecOut').textContent = fmt(+e.ec.toFixed(1));
    const ev = FE.deltaEV(e.orig, e.next, e.ec);
    let msg = `Exposure change: <b>${ev >= 0 ? '+' : ''}${ev.toFixed(2)} EV</b>`;
    if (ev > 0.3) msg += '<br><span class="warn">Brightening a JPEG can\'t recover highlights that were already clipped.</span>';
    if (e.next.iso < e.orig.iso) msg += '<br>Lower ISO: the photo\'s existing noise can\'t be removed.';
    if (state.recipe.dr === 200 && e.next.iso < 320) msg += '<br><span class="warn">The camera needs ISO 320 or higher for DR200.</span>';
    if (state.recipe.dr === 400 && e.next.iso < 640) msg += '<br><span class="warn">The camera needs ISO 640 or higher for DR400.</span>';
    $('evInfo').innerHTML = msg;
    scheduleRender();
  }

  // ---------------- sources ----------------
  function setFullImage(canvas) {
    state.full = canvas;
    state.zoom = null;
    $('split').value = 0;
    const tw = Math.min(1, THUMB_MAX / Math.max(canvas.width, canvas.height));
    const t = sampleSource(Math.round(canvas.width * tw), Math.round(canvas.height * tw), 0, 0, canvas.width, canvas.height);
    state.thumb = { src: t, view: { scale: tw, offX: 0, offY: 0, fullW: canvas.width, fullH: canvas.height }, noise: FE.makeNoise(t.width, t.height, 7) };
    thumbCache.clear();
    prepareView();
    renderLibrary(); renderLineups();
  }
  function sampleSource(w, h, sx, sy, sw, sh) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(state.full, sx, sy, sw, sh, 0, 0, w, h);
    return ctx.getImageData(0, 0, w, h);
  }
  function prepareView() {
    const F = state.full;
    if (!state.zoom) {
      const s = Math.min(1, PREVIEW_MAX / Math.max(F.width, F.height));
      const w = Math.round(F.width * s), h = Math.round(F.height * s);
      state.src = sampleSource(w, h, 0, 0, F.width, F.height);
      state.view = { scale: s, offX: 0, offY: 0, fullW: F.width, fullH: F.height };
    } else {
      const wrap = document.querySelector('.canvas-wrap');
      const w = Math.min(F.width, Math.round(wrap.clientWidth - 24)), h = Math.min(F.height, Math.round(wrap.clientHeight - 24));
      const ox = Math.max(0, Math.min(F.width - w, Math.round(state.zoom.x - w / 2)));
      const oy = Math.max(0, Math.min(F.height - h, Math.round(state.zoom.y - h / 2)));
      state.src = sampleSource(w, h, ox, oy, w, h);
      state.view = { scale: 1, offX: ox, offY: oy, fullW: F.width, fullH: F.height };
    }
    state.noise = FE.makeNoise(state.src.width, state.src.height, 42);
    $('view').classList.toggle('zoomed', !!state.zoom);
    $('badge').textContent = state.zoom ? '100% crop' : `Fit · ${Math.round(state.view.scale * 100)}%`;
    scheduleRender();
  }

  function loadFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      const exif = FE.readExif(reader.result);
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext('2d').drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        if (exif && exif.aperture && exif.shutter && exif.iso) setOrig({ aperture: exif.aperture, shutter: exif.shutter, iso: exif.iso });
        setFullImage(c);
        $('badge').textContent += exif && exif.model ? ` · ${exif.model}` : '';
      };
      img.src = url;
    };
    reader.readAsArrayBuffer(file);
  }

  // synthetic test chart: sky, foliage, skin, colour patches, grey ramp
  function makeTestChart() {
    const W = 1800, H = 1200, c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    let gr = g.createLinearGradient(0, 0, 0, 520);
    gr.addColorStop(0, '#2f6fb5'); gr.addColorStop(0.7, '#8fbde3'); gr.addColorStop(1, '#f3e2c4');
    g.fillStyle = gr; g.fillRect(0, 0, W, 520);
    g.fillStyle = '#fff8e6'; g.beginPath(); g.arc(1500, 180, 70, 0, 7); g.fill();
    g.fillStyle = '#3d4a5c'; g.beginPath(); g.moveTo(0, 520); g.lineTo(300, 300); g.lineTo(560, 470); g.lineTo(820, 260); g.lineTo(1200, 520); g.fill();
    gr = g.createLinearGradient(0, 520, 0, 760);
    gr.addColorStop(0, '#5d8a3a'); gr.addColorStop(1, '#22401c');
    g.fillStyle = gr; g.fillRect(0, 520, W, 240);
    g.fillStyle = '#e2b28f'; g.beginPath(); g.ellipse(1450, 560, 110, 140, 0, 0, 7); g.fill();
    g.fillStyle = '#c98f6c'; g.beginPath(); g.ellipse(1640, 600, 80, 100, 0, 0, 7); g.fill();
    const patches = ['#735244', '#c29682', '#627a9d', '#576c43', '#8580b1', '#67bdaa', '#d67e2c', '#505ba6', '#c15a63', '#5e3c6c', '#9dbc40', '#e0a32e',
      '#383d96', '#469449', '#af363c', '#e7c71f', '#bb5695', '#0885a1', '#f3f3f2', '#c8c8c8', '#a0a0a0', '#7a7a79', '#555555', '#343434'];
    const pw = 150, ph = 95;
    patches.forEach((p, i) => { g.fillStyle = p; g.fillRect(20 + (i % 12) * pw, 775 + Math.floor(i / 12) * ph, pw - 8, ph - 8); });
    gr = g.createLinearGradient(20, 0, W - 20, 0);
    gr.addColorStop(0, '#000'); gr.addColorStop(1, '#fff');
    g.fillStyle = gr; g.fillRect(20, 975, W - 40, 90);
    for (let i = 0; i < 21; i++) { const v = Math.round((i / 20) * 255); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(20 + i * ((W - 40) / 21), 1075, (W - 40) / 21, 105); }
    setOrig({ aperture: 5.6, shutter: 1 / 250, iso: 160 });
    setFullImage(c);
    $('badge').textContent += ' · test chart';
  }

  // ---------------- rendering ----------------
  let renderQueued = false, lastOut = null;
  function scheduleRender() {
    if (renderQueued || !state.src) return;
    renderQueued = true;
    requestAnimationFrame(() => { renderQueued = false; render(); });
  }
  function render() {
    const t0 = performance.now();
    lastOut = FE.process(state.src, state.recipe, state.exposure, state.view, state.noise);
    $('timing').textContent = `${Math.round(performance.now() - t0)} ms`;
    draw();
  }
  function draw() {
    const cv = $('view'), ctx = cv.getContext('2d');
    cv.width = state.src.width; cv.height = state.src.height;
    if (state.showOriginal) { ctx.putImageData(state.src, 0, 0); return; }
    ctx.putImageData(lastOut, 0, 0);
    const split = Number($('split').value) / 100;
    if (split > 0) {
      const sx = Math.round(cv.width * split);
      ctx.putImageData(state.src, 0, 0, 0, 0, sx, cv.height);
      ctx.fillStyle = '#e8a33d'; ctx.fillRect(sx - 1, 0, 2, cv.height);
    }
  }

  // thumbnails rendered with the thumb source; cached per recipe JSON
  const thumbCache = new Map();
  function thumbCanvas(recipe) {
    const c = document.createElement('canvas');
    if (!state.thumb) return c;
    const key = JSON.stringify(recipe);
    let img = thumbCache.get(key);
    if (!img) {
      const T = state.thumb;
      img = FE.process(T.src, recipe, state.exposure, T.view, T.noise);
      thumbCache.set(key, img);
    }
    c.width = img.width; c.height = img.height;
    c.getContext('2d').putImageData(img, 0, 0);
    return c;
  }

  // ---------------- editor actions ----------------
  function loadRecipe(entry) {
    state.recipe = { ...FE.DEFAULT_RECIPE, ...entry.recipe };
    state.loadedId = entry.id;
    switchTab('editor');
    onRecipeChange();
    readNext();
  }
  function recipeText(r, name) {
    const sim = FE.SIMS[r.sim];
    const lines = [name || 'Film recipe', `Film Simulation: ${sim.name}`];
    if (sim.mono) {
      lines.push(`Filter: ${{ std: 'Standard', ye: 'Yellow', r: 'Red', g: 'Green' }[r.monoFilter]}`);
      if (r.sim !== 'sepia') lines.push(`Monochromatic Color: WC ${fmt(r.monoWC)}, MG ${fmt(r.monoMG)}`);
    }
    lines.push(`Grain Effect: ${['Off', 'Weak', 'Strong'][r.grain]}${r.grain ? ', ' + (r.grainSize === 'large' ? 'Large' : 'Small') : ''}`);
    if (!sim.mono) {
      lines.push(`Color Chrome Effect: ${['Off', 'Weak', 'Strong'][r.cce]}`);
      lines.push(`Color Chrome FX Blue: ${['Off', 'Weak', 'Strong'][r.ccfxb]}`);
    }
    const wbName = { asShot: 'Auto', autoWhite: 'Auto White Priority', autoAmbience: 'Auto Ambience Priority', underwater: 'Underwater', daylight: 'Daylight', cloudy: 'Cloudy', shade: 'Shade', fluorescent: 'Fluorescent', incandescent: 'Incandescent', kelvin: r.kelvin + 'K' }[r.wb];
    lines.push(`White Balance: ${wbName}, ${fmt(r.wbR)} Red & ${fmt(r.wbB)} Blue`);
    if (r.drp && r.drp !== 'off') lines.push(`D Range Priority: ${r.drp[0].toUpperCase() + r.drp.slice(1)}`);
    else {
      lines.push(`Dynamic Range: DR${r.dr}`);
      lines.push(`Highlight: ${fmt(r.highlight)}`, `Shadow: ${fmt(r.shadow)}`);
    }
    if (!sim.mono) lines.push(`Color: ${fmt(r.color)}`);
    lines.push(`Sharpness: ${fmt(r.sharpness)}`, `High ISO NR: ${fmt(r.nr)}`, `Clarity: ${fmt(r.clarity)}`);
    return lines.join('\n');
  }
  function exportJpeg() {
    if (!state.full) return;
    const F = state.full, s = Math.min(1, EXPORT_MAX / Math.max(F.width, F.height));
    const w = Math.round(F.width * s), h = Math.round(F.height * s);
    const src = sampleSource(w, h, 0, 0, F.width, F.height);
    const out = FE.process(src, state.recipe, state.exposure, { scale: s, offX: 0, offY: 0, fullW: F.width, fullH: F.height }, FE.makeNoise(w, h, 42));
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d').putImageData(out, 0, 0);
    c.toBlob((b) => {
      const a = document.createElement('a');
      const loaded = store.recipes.find((r) => r.id === state.loadedId);
      a.download = (loaded ? loaded.name : FE.SIMS[state.recipe.sim].name).replace(/[^\w-]+/g, '_') + '.jpg';
      a.href = URL.createObjectURL(b);
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }, 'image/jpeg', 0.92);
  }

  // ---------------- save dialog ----------------
  function openSave() {
    const loaded = store.recipes.find((r) => r.id === state.loadedId);
    $('saveTitle').textContent = loaded ? 'Update recipe' : 'Save recipe';
    $('saveName').value = loaded ? loaded.name : '';
    $('saveName').placeholder = RT.makeName(state.recipe, '', RT.suggestScenarios(state.recipe, store.scenarios), store.recipes.map((r) => r.name));
    $('saveNotes').value = loaded ? loaded.notes || '' : '';
    $('saveAsNew').hidden = !loaded;
    const sel = new Set(loaded ? loaded.scenarios : RT.suggestScenarios(state.recipe, store.scenarios));
    const chips = $('saveChips');
    chips.innerHTML = '';
    store.scenarios.forEach((s) => {
      const b = document.createElement('button');
      b.className = 'chip' + (sel.has(s) ? ' on' : '');
      b.textContent = s; b.type = 'button';
      b.onclick = () => b.classList.toggle('on');
      chips.appendChild(b);
    });
    $('saveDlg').showModal();
    $('saveName').focus();
  }
  function commitSave(asNew) {
    const name = $('saveName').value.trim() || $('saveName').placeholder;
    const scenarios = [...$('saveChips').querySelectorAll('.chip.on')].map((b) => b.textContent);
    let entry = !asNew && store.recipes.find((r) => r.id === state.loadedId);
    if (entry) Object.assign(entry, { name, scenarios, notes: $('saveNotes').value, recipe: { ...state.recipe }, updated: Date.now() });
    else {
      entry = { id: uid(), name, scenarios, notes: $('saveNotes').value, recipe: { ...state.recipe }, created: Date.now() };
      store.recipes.push(entry);
    }
    state.loadedId = entry.id;
    persist();
    $('saveDlg').close();
    syncControls(); renderLibrary(); renderLineups(); renderQuickLineup();
  }

  // ---------------- library ----------------
  function renderLibrary() {
    if ($('cartridges').classList.contains('active')) renderCartridges();
    const counts = { All: store.recipes.filter((r) => r.scenarios.length).length };
    store.recipes.forEach((r) => r.scenarios.forEach((s) => (counts[s] = (counts[s] || 0) + 1)));
    const chips = $('libChips');
    chips.innerHTML = '';
    ['All', ...store.scenarios].forEach((s) => {
      const n = s === 'Unsorted' ? store.recipes.filter((r) => !r.scenarios.length).length : counts[s] || 0;
      if (s === 'Unsorted' && !n) return;
      const b = document.createElement('button');
      b.className = 'chip' + (state.libFilter === s ? ' on' : '');
      b.innerHTML = `${esc(s)}<span class="n">${n}</span>`;
      b.onclick = () => { state.libFilter = s; renderLibrary(); };
      if (!['All', 'Unsorted'].includes(s)) b.oncontextmenu = (e) => { e.preventDefault(); removeScenario(s); };
      chips.appendChild(b);
    });

    const q = $('libSearch').value.trim().toLowerCase();
    let list = store.recipes.filter((r) =>
      (state.libFilter === 'All' ? r.scenarios.length > 0 : r.scenarios.includes(state.libFilter)) &&
      (!q || [r.name, r.aka, r.notes, r.source, FE.SIMS[r.recipe.sim].name].join(' ').toLowerCase().includes(q)));
    const sort = $('libSort').value;
    list.sort(sort === 'name' ? (a, b) => a.name.localeCompare(b.name)
      : sort === 'sim' ? (a, b) => FE.SIMS[a.recipe.sim].name.localeCompare(FE.SIMS[b.recipe.sim].name) || a.name.localeCompare(b.name)
      : (a, b) => (b.updated || b.created) - (a.updated || a.created));

    const grid = $('libGrid'), orbit = $('libOrbit');
    $('modeGrid').classList.toggle('on', state.libMode === 'grid');
    $('modeOrbit').classList.toggle('on', state.libMode === 'orbit');
    grid.hidden = state.libMode !== 'grid';
    orbit.hidden = state.libMode !== 'orbit';
    if (state.libMode === 'orbit') { grid.innerHTML = ''; renderOrbit(list); return; }
    stopOrbit();
    orbit.innerHTML = '';
    grid.innerHTML = '';
    if (!list.length) { grid.innerHTML = '<div class="empty">No cartridges in this playlist yet. Tag cartridges with a playlist in the Library.</div>'; return; }
    list.forEach((r) => grid.appendChild(pinCard(r)));
  }

  // ---- grid mode: staggered editorial cards ----
  const ASPECTS = [['4 / 5'], ['3 / 4'], ['2 / 3'], ['1 / 1', 'square'], ['4 / 5'], ['3 / 5']];
  const hash = (s) => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); };
  // "CN-WM Seaside Summer" -> ["CN-WM", "Seaside Summer"]
  const splitName = (name) => { const m = name.match(/^([A-Za-z]{2,3}-[WNC][SMH])\s+(.+)$/); return m ? [m[1], m[2]] : ['', name]; };
  // average brightness of the top of a recipe's thumbnail, to pick headline colour
  function thumbLum(recipe) {
    const img = thumbCache.get(JSON.stringify(recipe));
    if (!img) return 0;
    const d = img.data, rows = Math.floor(img.height * 0.4);
    let sum = 0, n = 0;
    for (let y = 0; y < rows; y += 4) for (let x = 0; x < img.width; x += 4) {
      const p = (y * img.width + x) * 4;
      sum += 0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2]; n++;
    }
    return n ? sum / n / 255 : 0;
  }
  function pinCard(r) {
    const a = RT.analyze(r.recipe), sim = FE.SIMS[r.recipe.sim];
    const [code, title] = splitName(r.name);
    const [ratio, cls] = ASPECTS[hash(r.id) % ASPECTS.length];
    const el = document.createElement('article');
    el.className = 'pin display' + (cls ? ' ' + cls : '');
    el.style.aspectRatio = ratio;
    const cv = thumbCanvas(r.recipe);
    cv.className = 'pin-img';
    cv.title = 'Open in editor';
    cv.onclick = () => loadRecipe(r);
    el.appendChild(cv);
    if (thumbLum(r.recipe) > 0.6) el.classList.add('light');
    const host = r.source ? (r.source.match(/^https?:\/\/(?:www\.)?([^/]+)/) || [])[1] : '';
    el.insertAdjacentHTML('beforeend', `
      <div class="pin-top"><h3>${esc(title)}</h3>${code ? `<span class="pin-code">${esc(code)}</span>` : ''}</div>
      <div class="pin-meta">
        <div><span>Film simulation</span>${esc(sim.name)}</div>
        <div><span>Look</span>${TEMP[a.temp]}, ${TONE[a.tone]}</div>
        <div><span>Scenes</span>${esc(r.scenarios.slice(0, 2).join(', ') || 'Unsorted')}</div>
      </div>
      <div class="pin-card"><canvas width="88" height="88"></canvas>
        <div><b>${esc(r.aka || title)}</b><small>${host ? esc(host) : `DR${r.recipe.dr} · ${fmt(r.recipe.wbR)}R ${fmt(r.recipe.wbB)}B`}</small></div>
        <button class="pin-open">Open</button></div>
      <div class="pin-actions"><button data-a="edit">Edit</button><button data-a="dup">Duplicate</button><button data-a="copy">Copy text</button><button data-a="del" class="del">Delete</button></div>`);
    const mini = el.querySelector('.pin-card canvas'), s = Math.min(cv.width, cv.height);
    mini.getContext('2d').drawImage(cv, (cv.width - s) / 2, (cv.height - s) / 2, s, s, 0, 0, 88, 88);
    el.querySelector('.pin-open').onclick = () => loadRecipe(r);
    el.querySelector('[data-a=dup]').onclick = () => { store.recipes.push({ ...r, id: uid(), name: r.name + ' copy', scenarios: [...r.scenarios], recipe: { ...r.recipe }, created: Date.now() }); persist(); renderLibrary(); };
    el.querySelector('[data-a=copy]').onclick = (e) => { navigator.clipboard.writeText(recipeText(r.recipe, r.name)); e.target.textContent = 'Copied'; };
    el.querySelector('[data-a=del]').onclick = () => deleteRecipe(r);
    el.querySelector('[data-a=edit]').onclick = () => openForm({ entry: r });
    return el;
  }

  // ---- 3D mode: one rotating carousel per scenario ----
  const CARD_W = 150, CARD_H = 200;
  const rings = new Map(); // scenario -> ring state (kept across re-renders so rotation persists)
  let activeRings = [], orbitRAF = 0, ringObserver = null;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const angDelta = (a, b) => ((((a - b) % 360) + 540) % 360) - 180;
  const frontIndex = (ring) => ((Math.round(((ring.focus || 0) - ring.theta) / ring.step) % ring.n) + ring.n) % ring.n;

  function renderOrbit(list) {
    const root = $('libOrbit');
    root.innerHTML = '';
    const groups = (state.libFilter === 'All' ? store.scenarios : [state.libFilter])
      .map((s) => [s, list.filter((r) => (s === 'Unsorted' ? !r.scenarios.length : r.scenarios.includes(s)))])
      .filter(([, items]) => items.length);
    if (ringObserver) ringObserver.disconnect();
    ringObserver = new IntersectionObserver((entries) => entries.forEach((e) => { const rg = e.target._ring; if (rg) rg.visible = e.isIntersecting; }));
    activeRings = [];
    if (!groups.length) { root.innerHTML = '<div class="empty">No cartridges in this playlist yet. Tag cartridges with a playlist in the Library.</div>'; stopOrbit(); return; }

    groups.forEach(([s, items], gi) => {
      const n = items.length, step = 360 / n;
      const R = n === 1 ? 0 : Math.max(190, (n * (CARD_W + 36)) / (2 * Math.PI));
      const ring = rings.get(s) || { theta: 0, vel: 0, snap: null };
      Object.assign(ring, { n, step, R, items, drag: null, hover: false, fi: -1, visible: true });
      rings.set(s, ring);

      const block = document.createElement('section');
      block.className = 'orbit-block display';
      block.innerHTML = `
        <header><span class="idx">${String(gi + 1).padStart(2, '0')}</span><h2>${esc(s)}</h2><span class="cnt">${n} recipe${n === 1 ? '' : 's'}</span></header>
        <div class="ring-stage" style="height:${Math.round(CARD_H * 1.3 + R * 0.42 + 40)}px"><div class="ring"></div></div>
        <div class="ring-cap"><button class="ring-nav" aria-label="Previous">‹</button>
          <div style="text-align:center"><b></b><small></small></div>
          <button class="ring-nav" aria-label="Next">›</button>
          <button class="btn small">Open in editor</button></div>`;
      const ringEl = block.querySelector('.ring'), stage = block.querySelector('.ring-stage');
      ring.el = ringEl;
      ring.cap = block.querySelector('.ring-cap');
      ring.cards = items.map((r, i) => {
        const c = document.createElement('div');
        c.className = 'ocard';
        c.style.transform = `rotateY(${i * step}deg) translateZ(${R}px)`;
        c.appendChild(thumbCanvas(r.recipe));
        c.insertAdjacentHTML('beforeend', `<span>${esc(splitName(r.name)[0] || sim3(r))}</span>`);
        c.onclick = () => {
          if (ring.moved) return;
          if (frontIndex(ring) === i) loadRecipe(r);
          else { ring.vel = 0; ring.snap = ring.theta + angDelta(-i * step, ring.theta); }
        };
        ringEl.appendChild(c);
        return c;
      });
      const [prev, next, open] = ring.cap.querySelectorAll('button');
      const go = (d) => { ring.vel = 0; ring.snap = Math.round((ring.snap ?? ring.theta) / step) * step - d * step; };
      prev.onclick = () => go(-1);
      next.onclick = () => go(1);
      open.onclick = () => loadRecipe(ring.items[frontIndex(ring)]);

      attachRingDrag(stage, ring);

      block._ring = ring;
      ring.stage = stage;
      ringObserver.observe(block);
      activeRings.push(ring);
      root.appendChild(block);
    });
    fitRings();
    if (!orbitRAF) orbitRAF = requestAnimationFrame(orbitTick);
  }
  const sim3 = (r) => RT.SIM_CODES[r.recipe.sim];
  // drag to spin; pointer capture only once it's clearly a drag, so plain clicks reach the cards
  function attachRingDrag(stage, ring) {
    stage.onpointerdown = (e) => { ring.drag = { x: e.clientX, last: e.clientX }; ring.moved = false; ring.vel = 0; ring.snap = null; };
    stage.onpointermove = (e) => {
      if (!ring.drag) return;
      const dx = e.clientX - ring.drag.last;
      ring.drag.last = e.clientX;
      if (!ring.moved && Math.abs(e.clientX - ring.drag.x) > 5) { ring.moved = true; stage.setPointerCapture(e.pointerId); stage.classList.add('dragging'); }
      const g = ring.dragGain || 0.28;
      if (ring.moved) { ring.theta += dx * g; ring.vel = dx * g; }
    };
    stage.onpointerup = stage.onpointercancel = () => {
      if (ring.drag && !ring.moved) ring.vel = 0;
      else if (Math.abs(ring.vel) < 0.3) { const fo = ring.focus || 0; ring.snap = fo + Math.round((ring.theta - fo) / ring.step) * ring.step; ring.pauseUntil = performance.now() + 2500; }
      ring.drag = null;
      stage.classList.remove('dragging');
    };
    stage.onmouseenter = () => (ring.hover = true);
    stage.onmouseleave = () => (ring.hover = false);
  }
  // spring to a chosen card, then hold there a moment before cruising again
  const rotateRingTo = (ring, i) => { ring.snap = ring.theta + angDelta((ring.focus || 0) - i * ring.step, ring.theta); ring.pauseUntil = performance.now() + 4000; };
  // shrink wide rings so the whole carousel fits the window
  let homeRing = null;
  const allRings = () => (homeRing ? [...activeRings, homeRing] : activeRings);
  function fitRings() {
    for (const ring of allRings()) ring.k = Math.min(1, (ring.stage.clientWidth - 24) / (2 * ring.R + (ring.cardW || CARD_W) * 1.4));
  }
  window.addEventListener('resize', fitRings);

  function orbitTick() {
    for (const ring of allRings()) {
      if (!ring.visible) continue;
      const prevTheta = ring.theta;
      if (!ring.drag) {
        if (ring.snap != null) {
          // underdamped spring: a little overshoot, then settle
          ring.vel += (ring.snap - ring.theta) * 0.06;
          ring.vel *= 0.8;
          ring.theta += ring.vel;
          if (Math.abs(ring.snap - ring.theta) < 0.05 && Math.abs(ring.vel) < 0.05) { ring.theta = ring.snap; ring.snap = null; ring.vel = 0; }
        } else {
          // a fling coasts and eases back to cruising speed; hovering or a recent pick holds it still
          const held = ring.hover || reduceMotion || performance.now() < (ring.pauseUntil || 0);
          const cruise = held ? 0 : -(ring.autoSpeed ?? 0.05);
          ring.vel += (cruise - ring.vel) * (Math.abs(ring.vel - cruise) > 0.6 ? 0.022 : 0.05);
          ring.theta += ring.vel;
        }
      }
      if (ring.lean != null) {
        const dv = ring.theta - prevTheta;
        ring.lean += (Math.max(-18, Math.min(18, -dv * 2.6)) - ring.lean) * 0.12;
        ring.tiltX = (ring.tiltX || 0) + (Math.max(-10, Math.min(10, Math.abs(dv) * 1.6)) - (ring.tiltX || 0)) * 0.1;
        ring.bank = (ring.bank || 0) + (Math.max(-5, Math.min(5, -dv * 0.9)) - (ring.bank || 0)) * 0.08;
      }
      ring.el.style.transform = `scale(${ring.k}) rotateZ(${(ring.bank || 0).toFixed(2)}deg) translateZ(${-(ring.zPush ?? ring.R)}px) rotateY(${ring.theta}deg)`;
      if (ring.reflEl) ring.reflEl.style.transform = `translateY(${ring.cardH * ring.k + 14}px) scale(${ring.k}) scaleY(-1) translateZ(${-ring.R}px) rotateY(${ring.theta}deg)`;
      const fi = frontIndex(ring);
      ring.cards.forEach((c, i) => {
        const f = (Math.cos(((i * ring.step + ring.theta) * Math.PI) / 180) + 1) / 2; // 1 front, 0 back
        const a = ((((i * ring.step + ring.theta) % 360) + 540) % 360) - 180; // degrees away from front
        c.style.setProperty('--shade', ((ring.shadeMin ?? 0.3) + (1 - (ring.shadeMin ?? 0.3)) * f).toFixed(2));
        c.style.setProperty('--sheen', (50 - (a - (ring.focus || 0)) * 0.6).toFixed(1));
        // fan layout: cards right in front of the camera are edge-on and huge, so fade them out
        if (ring.fadeFront) c.style.setProperty('--op', Math.max(0, Math.min(1, (Math.abs(a) - 16) / 26)).toFixed(2));
        c.classList.toggle('back', f < 0.45); // facing away: hide its (mirrored) text
        if (ring.lean != null) {
          const t = `rotateY(${i * ring.step}deg) translateZ(${ring.R}px) rotateY(${((ring.cardTurn || 0) + ring.lean).toFixed(2)}deg) rotateX(${(ring.tiltX || 0).toFixed(2)}deg)`;
          c.style.transform = t;
          if (ring.reflEl && ring.reflEl.children[i]) ring.reflEl.children[i].style.transform = t;
        }
      });
      if (fi !== ring.fi) {
        if (ring.cards[ring.fi]) ring.cards[ring.fi].classList.remove('front');
        ring.cards[fi].classList.add('front');
        ring.fi = fi;
        if (ring.onFront) ring.onFront(fi);
        else {
          const r = ring.items[fi];
          ring.cap.querySelector('b').textContent = r.name;
          ring.cap.querySelector('small').textContent = `${r.aka ? 'aka ' + r.aka + ' · ' : ''}${FE.SIMS[r.recipe.sim].name}`;
        }
      }
    }
    orbitRAF = requestAnimationFrame(orbitTick);
  }
  function stopOrbit() {
    if (orbitRAF) cancelAnimationFrame(orbitRAF);
    orbitRAF = 0;
  }
  function deleteRecipe(r) {
    const inLineups = Object.entries(store.lineups).filter(([, ids]) => ids.includes(r.id)).map(([s]) => s);
    if (!confirm(`Delete "${r.name}"?${inLineups.length ? `\nIt will also be removed from these lineups: ${inLineups.join(', ')}.` : ''}`)) return;
    store.recipes = store.recipes.filter((x) => x.id !== r.id);
    for (const s in store.lineups) store.lineups[s] = store.lineups[s].map((id) => (id === r.id ? null : id));
    store.repertoire = getRepertoire().map((id) => (id === r.id ? null : id));
    if (state.loadedId === r.id) state.loadedId = null;
    persist(); syncControls(); renderLibrary(); renderLineups(); renderQuickLineup();
  }
  function addScenario() {
    const name = (prompt('New playlist name (e.g. Desert, Autumn, Street):') || '').trim();
    if (!name || store.scenarios.includes(name)) return;
    store.scenarios.push(name);
    persist(); renderLibrary(); renderLineups(); renderQuickLineup();
  }
  function removeScenario(s) {
    if (!confirm(`Remove the "${s}" playlist? Its cartridges stay in your Library.`)) return;
    store.scenarios = store.scenarios.filter((x) => x !== s);
    store.recipes.forEach((r) => (r.scenarios = r.scenarios.filter((x) => x !== s)));
    delete store.lineups[s];
    if (state.libFilter === s) state.libFilter = 'All';
    if (state.lineupScenario === s) state.lineupScenario = null;
    persist(); renderLibrary(); renderLineups(); renderQuickLineup();
  }

  // ---------------- lineups ----------------
  const getLineup = (s) => {
    const l = store.lineups[s] || [];
    while (l.length < SLOTS) l.push(null);
    return l;
  };
  function renderLineups() {
    if ($('home').classList.contains('active')) setTimeout(renderHome);
    if (!state.lineupScenario || !store.scenarios.includes(state.lineupScenario)) state.lineupScenario = store.scenarios[0];
    const chips = $('lineupChips');
    chips.innerHTML = '';
    store.scenarios.forEach((s) => {
      const filled = getLineup(s).filter(Boolean).length;
      const b = document.createElement('button');
      b.className = 'chip' + (state.lineupScenario === s ? ' on' : '');
      b.innerHTML = `${esc(s)}<span class="n">${filled}/${SLOTS}</span>`;
      b.onclick = () => { state.lineupScenario = s; renderLineups(); renderQuickLineup(); };
      chips.appendChild(b);
    });
    const grid = $('lineupGrid');
    grid.innerHTML = '';
    getLineup(state.lineupScenario).forEach((id, i) => {
      const r = id && store.recipes.find((x) => x.id === id);
      const card = document.createElement('div');
      card.className = 'card' + (r ? '' : ' emptyslot');
      const cv = r ? thumbCanvas(r.recipe) : thumbCanvas(FE.DEFAULT_RECIPE);
      cv.onclick = () => (r ? loadRecipe(r) : pickForSlot(i));
      const body = document.createElement('div');
      body.className = 'body';
      body.innerHTML = `<div class="name"><span class="slotno">${String(i + 1).padStart(2, '0')}</span>${r ? esc(r.name) : '<span class="meta">Empty slot</span>'}</div>
        ${r ? `<div class="meta">${esc(FE.SIMS[r.recipe.sim].name)}</div>` : ''}`;
      const act = document.createElement('div');
      act.className = 'actions';
      act.innerHTML = `<button class="btn small">${r ? 'Change' : 'Assign'}</button>${r ? '<button class="btn small">Open</button><button class="btn small">◀</button><button class="btn small">▶</button>' : ''}`;
      const [bChange, bOpen, bL, bR] = act.querySelectorAll('button');
      bChange.onclick = () => pickForSlot(i);
      if (r) {
        bOpen.onclick = () => loadRecipe(r);
        bL.onclick = () => moveSlot(i, -1);
        bR.onclick = () => moveSlot(i, 1);
      }
      body.appendChild(act);
      card.append(cv, body);
      grid.appendChild(card);
    });
  }
  function moveSlot(i, dir) {
    const l = getLineup(state.lineupScenario), j = i + dir;
    if (j < 0 || j >= SLOTS) return;
    [l[i], l[j]] = [l[j], l[i]];
    store.lineups[state.lineupScenario] = l;
    persist(); renderLineups(); renderQuickLineup();
  }
  let pickSlot = -1, pickAll = false, pickRep = false;
  function pickForRepertoire(i) {
    pickSlot = i; pickAll = true; pickRep = true;
    $('pickTitle').textContent = `Current repertoire · C${i + 1}`;
    $('pickOnlyScn').parentElement.hidden = true;
    renderPickList();
    $('pickDlg').showModal();
  }
  function pickForSlot(i) {
    pickSlot = i; pickAll = false; pickRep = false;
    $('pickOnlyScn').parentElement.hidden = false;
    $('pickTitle').textContent = `${state.lineupScenario} · slot ${i + 1}`;
    renderPickList();
    $('pickDlg').showModal();
  }
  function renderPickList() {
    $('pickOnlyScn').classList.toggle('on', !pickAll);
    $('pickAll').classList.toggle('on', pickAll);
    const list = $('pickList');
    list.innerHTML = '';
    const items = store.recipes.filter((r) => pickAll || r.scenarios.includes(state.lineupScenario)).sort((a, b) => a.name.localeCompare(b.name));
    if (!items.length && pickRep) list.innerHTML = '<div class="hint">Your library is empty. Use Paste recipes in the Library first.</div>';
    else if (!items.length) list.innerHTML = `<div class="hint">No recipes tagged "${esc(state.lineupScenario)}" yet. Switch to All recipes.</div>`;
    items.forEach((r) => {
      const b = document.createElement('button');
      b.className = 'btn'; b.style.textAlign = 'left';
      b.innerHTML = `<b>${esc(r.name)}</b> <span class="hint">${esc(FE.SIMS[r.recipe.sim].name)}${r.scenarios.length ? ' · ' + esc(r.scenarios.join(', ')) : ''}</span>`;
      b.onclick = () => assignSlot(r.id);
      list.appendChild(b);
    });
  }
  function assignSlot(id) {
    if (pickRep) {
      const rp = getRepertoire();
      if (id) { const dup = rp.indexOf(id); if (dup >= 0 && dup !== pickSlot) rp[dup] = null; } // one slot per recipe
      rp[pickSlot] = id;
      persist();
      $('pickDlg').close();
      renderHome();
      return;
    }
    const l = getLineup(state.lineupScenario);
    l[pickSlot] = id;
    store.lineups[state.lineupScenario] = l;
    persist();
    $('pickDlg').close();
    renderLineups(); renderQuickLineup();
  }

  // quick lineup strip in the editor: flick through a scenario's 8 recipes on the current photo
  function renderQuickLineup() {
    const el = $('quickLineup');
    if (!state.lineupScenario) state.lineupScenario = store.scenarios[0];
    el.innerHTML = '';
    const sel = document.createElement('select');
    store.scenarios.forEach((s) => sel.add(new Option(s + ' playlist', s)));
    sel.value = state.lineupScenario;
    sel.onchange = () => { state.lineupScenario = sel.value; renderQuickLineup(); renderLineups(); };
    el.appendChild(sel);
    const inList = store.recipes.filter((r) => r.scenarios.includes(state.lineupScenario));
    if (!inList.length) el.insertAdjacentHTML('beforeend', '<span class="hint">No cartridges in this playlist yet.</span>');
    inList.forEach((r, i) => {
      const b = document.createElement('button');
      b.className = 'btn slot' + (r.id === state.loadedId ? ' on' : '');
      b.innerHTML = `<b>${String(i + 1).padStart(2, '0')}</b>${esc(r.aka || r.name)}`;
      b.title = r.name;
      b.onclick = () => { loadRecipe(r); renderQuickLineup(); };
      el.appendChild(b);
    });
  }

  // ---------------- paste import ----------------
  const RT = window.RecipeTools;
  let parsed = [];
  const TEMP = { W: 'warm', N: 'neutral', C: 'cool' }, TONE = { S: 'soft', M: 'medium', H: 'hard' };
  function analysePaste() {
    const existing = store.recipes.map((r) => r.name);
    parsed = RT.parse($('pasteText').value).map((p) => {
      if (!p.valid) return p;
      p.scenarios = RT.suggestScenarios(p.recipe, store.scenarios);
      p.name = RT.makeName(p.recipe, p.aka, p.scenarios, existing);
      existing.push(p.name);
      p.dupe = store.recipes.find((r) => recipeEquals(r.recipe, p.recipe));
      p.include = !p.dupe;
      return p;
    });
    renderPastePreview();
  }
  function renderPastePreview() {
    const root = $('pastePreview');
    root.innerHTML = '';
    const valid = parsed.filter((p) => p.valid);
    $('pasteSummary').textContent = parsed.length ? `Found ${valid.length} recipe${valid.length === 1 ? '' : 's'}${parsed.length > valid.length ? `, ${parsed.length - valid.length} skipped` : ''}` : 'No recipes found.';
    parsed.forEach((p) => {
      const row = document.createElement('div');
      row.className = 'pp' + (p.valid && p.include ? '' : ' skip');
      if (!p.valid) {
        row.innerHTML = `<div><b>${esc(p.aka || 'Untitled block')}</b></div><div></div><div class="w">${p.warnings.map(esc).join(' · ')}</div>`;
        root.appendChild(row); return;
      }
      const a = RT.analyze(p.recipe);
      row.innerHTML = `
        <div>
          <label class="hint"><input type="checkbox" ${p.include ? 'checked' : ''} data-k="include"> include</label>
          <input type="text" value="${esc(p.name)}" data-k="name">
          <div class="hint">${p.aka ? 'Original name: ' + esc(p.aka) : 'No name found'}${p.source ? ' · ' + esc(p.source) : ''}</div>
          <div class="hint">${esc(FE.SIMS[p.recipe.sim].name)} · ${TEMP[a.temp]} · ${TONE[a.tone]} contrast${a.mono ? '' : ` · saturation ${a.sat >= 0 ? '+' : ''}${a.sat.toFixed(1)}`} · DR${p.recipe.dr}</div>
          ${p.shoot.length ? `<div class="hint">${esc(p.shoot.join(' · '))}</div>` : ''}
        </div>
        <div class="chips">${store.scenarios.map((s) => `<button class="chip${p.scenarios.includes(s) ? ' on' : ''}" data-s="${esc(s)}">${esc(s)}</button>`).join('')}</div>
        ${p.dupe ? `<div class="w">Same settings as "${esc(p.dupe.name)}", which is already in your library, so this one is unticked.</div>` : ''}
        ${p.warnings.length ? `<div class="w">${p.warnings.map(esc).join(' · ')}</div>` : ''}`;
      row.querySelector('[data-k=include]').onchange = (e) => { p.include = e.target.checked; row.classList.toggle('skip', !p.include); updatePasteAdd(); };
      row.querySelector('[data-k=name]').oninput = (e) => (p.name = e.target.value);
      row.querySelectorAll('[data-s]').forEach((b) => (b.onclick = () => {
        const s = b.dataset.s;
        p.scenarios = p.scenarios.includes(s) ? p.scenarios.filter((x) => x !== s) : [...p.scenarios, s];
        b.classList.toggle('on');
      }));
      root.appendChild(row);
    });
    updatePasteAdd();
  }
  function updatePasteAdd() {
    const n = parsed.filter((p) => p.valid && p.include).length;
    $('pasteAdd').disabled = !n;
    $('pasteAdd').textContent = n ? `Add ${n} to library` : 'Add to library';
  }
  function addParsed() {
    const now = Date.now();
    const added = parsed.filter((p) => p.valid && p.include).map((p, i) => ({
      id: uid(), name: p.name.trim() || RT.makeName(p.recipe, p.aka, p.scenarios, store.recipes.map((r) => r.name)),
      aka: p.aka, source: p.source, notes: p.shoot.join(' · '), scenarios: p.scenarios,
      recipe: { ...p.recipe }, created: now + i,
    }));
    store.recipes.push(...added);
    persist();
    $('pasteDlg').close();
    $('pasteText').value = ''; parsed = []; $('pastePreview').innerHTML = ''; $('pasteSummary').textContent = '';
    let msg = `Added ${added.length} recipe${added.length === 1 ? '' : 's'}.`;
    if ($('pasteRep').checked) {
      const rp = getRepertoire();
      let over = 0;
      added.forEach((e) => { const k = rp.indexOf(null); if (k >= 0) rp[k] = e.id; else over++; });
      persist();
      msg += over ? ` Your repertoire is full, so ${over} went to the library only.` : ' Added to your current repertoire.';
    }
    if ($('pasteAutoLineup').checked) msg += ' ' + autoBuild('fill', true);
    state.libFilter = 'All';
    renderLibrary(); renderLineups(); renderQuickLineup();
    $('autoMsg').textContent = msg;
  }

  // ---------------- auto lineups ----------------
  function autoBuild(mode, quiet) {
    if (mode === 'rebuild' && !quiet && !confirm('Rebuild every lineup from your library? This replaces slots you assigned by hand.')) return '';
    const next = RT.buildLineups(store.recipes, store.scenarios, store.lineups, mode, SLOTS);
    let filled = 0;
    for (const s in next) {
      const before = getLineup(s);
      filled += next[s].filter((id, i) => id && id !== before[i]).length;
    }
    store.lineups = next;
    persist();
    renderLineups(); renderQuickLineup();
    const empty = store.scenarios.filter((s) => RT.RULES[s]).map((s) => [s, getLineup(s).filter((x) => !x).length]).filter(([, n]) => n);
    const msg = `${mode === 'rebuild' ? 'Rebuilt lineups' : 'Filled'}: ${filled} slot${filled === 1 ? '' : 's'} assigned.` +
      (empty.length ? ` Still open (no good fit in your library yet): ${empty.map(([s, n]) => `${s} ${n}`).join(', ')}.` : '');
    if (!quiet) $('autoMsg').textContent = msg;
    return msg;
  }

  // ---------------- Library page: every saved cartridge, in a playlist or not ----------------
  function renderCartridges() {
    const rp = getRepertoire();
    const q = $('cartSearch').value.trim().toLowerCase();
    const show = $('cartShow').value, sort = $('cartSort').value;
    let list = store.recipes.filter((r) => {
      if (show === 'camera' && !rp.includes(r.id)) return false;
      if (show === 'listed' && !r.scenarios.length) return false;
      if (show === 'unlisted' && r.scenarios.length) return false;
      return !q || [r.name, r.aka, r.notes, r.source, FE.SIMS[r.recipe.sim].name, ...r.scenarios].join(' ').toLowerCase().includes(q);
    });
    const slotOf = (r) => rp.indexOf(r.id);
    list.sort(sort === 'name' ? (a, b) => (a.aka || a.name).localeCompare(b.aka || b.name)
      : sort === 'sim' ? (a, b) => FE.SIMS[a.recipe.sim].name.localeCompare(FE.SIMS[b.recipe.sim].name) || a.name.localeCompare(b.name)
      : sort === 'slot' ? (a, b) => ((slotOf(a) + 1 || 99) - (slotOf(b) + 1 || 99)) || a.name.localeCompare(b.name)
      : (a, b) => (b.updated || b.created) - (a.updated || a.created));
    $('cartCount').textContent = `${store.recipes.length} cartridge${store.recipes.length === 1 ? '' : 's'} saved · ${rp.filter(Boolean).length} in camera · ${store.recipes.filter((r) => !r.scenarios.length).length} not in a playlist`;
    const root = $('cartList');
    root.innerHTML = '';
    if (!list.length) { root.innerHTML = '<div class="empty">No cartridges match.</div>'; return; }
    list.forEach((r) => {
      const [code, title] = splitName(r.name), slot = slotOf(r);
      const row = document.createElement('article');
      row.className = 'crow';
      const cv = thumbCanvas(r.recipe);
      cv.className = 'crow-img';
      cv.title = 'Try in simulator';
      cv.onclick = () => loadRecipe(r);
      row.appendChild(cv);
      row.insertAdjacentHTML('beforeend', `
        <div class="crow-main display"><b>${esc(r.aka || title)}</b><small>${code ? esc(code) + ' · ' : ''}${esc(FE.SIMS[r.recipe.sim].name)}${r.source ? ' · ' + esc((r.source.match(/^https?:\/\/(?:www\.)?([^/]+)/) || [])[1] || '') : ''}</small></div>
        <div class="crow-slot">${slot >= 0 ? `<span class="slot-chip on">C${slot + 1}</span>` : ''}</div>
        <div class="crow-tags">${r.scenarios.length ? r.scenarios.map((sc) => `<span>${esc(sc)}</span>`).join('') : '<em>Not in a playlist</em>'}</div>
        <div class="crow-act"><button class="btn small" data-a="sim">Try</button><button class="btn small" data-a="edit">Edit</button><button class="btn small" data-a="dup">Duplicate</button><button class="btn small danger" data-a="del">Delete</button></div>`);
      row.querySelector('[data-a=sim]').onclick = () => loadRecipe(r);
      row.querySelector('[data-a=edit]').onclick = () => openForm({ entry: r });
      row.querySelector('[data-a=dup]').onclick = () => { store.recipes.push({ ...r, id: uid(), name: r.name + ' copy', scenarios: [...r.scenarios], recipe: { ...r.recipe }, created: Date.now(), updated: undefined }); persist(); renderCartridges(); };
      row.querySelector('[data-a=del]').onclick = () => deleteRecipe(r);
      root.appendChild(row);
    });
  }

  // ---------------- home: current repertoire + playlists ----------------
  const getRepertoire = () => {
    if (!store.repertoire) store.repertoire = [];
    if (store.repertoire.length > REP_SLOTS) store.repertoire.length = REP_SLOTS;
    while (store.repertoire.length < REP_SLOTS) store.repertoire.push(null);
    return store.repertoire;
  };
  const editorialCard = (r) => {
    const el = pinCard(r);
    el.style.aspectRatio = '3 / 4';
    el.classList.remove('square');
    return el;
  };
  // the loaded cartridges (C1–C7) as a revolving carousel; the front one is described below it
  const HOME_W = 180, HOME_H = 240, THICK = 8, COPIES = 3;
  function renderCartDetail(ci) {
    const ring = homeRing, r = ring.items[ci], rp = getRepertoire(), i = ci % rp.length;
    $('slotNav').querySelectorAll('button').forEach((b, k) => b.classList.toggle('on', k === i));
    ring.cards.forEach((c, k) => c.classList.toggle('front', k === ci));
    const el = $('cartDetail');
    if (!r) {
      el.innerHTML = `<div class="cd-head display"><span class="kicker">C${i + 1}</span><h2>Empty slot</h2></div>
        <p class="hint">Nothing is loaded in C${i + 1} yet.</p>
        <div class="cd-actions"><button class="btn primary" data-a="add">Add a cartridge</button><button class="btn" data-a="pick">Pick from library</button></div>`;
      el.querySelector('[data-a=add]').onclick = () => openForm({ slot: i + 1 });
      el.querySelector('[data-a=pick]').onclick = () => pickForRepertoire(i);
      return;
    }
    const [code, title] = splitName(r.name);
    const lines = recipeText(r.recipe).split('\n').slice(1).map((l) => l.split(/:\s(.+)/));
    if (r.iso) lines.push(['ISO', r.iso]);
    if (r.ec) lines.push(['Exposure comp.', r.ec]);
    el.innerHTML = `<div class="cd-head display"><span class="kicker">C${i + 1} · ${esc(code)}</span><h2>${esc(r.aka || title)}</h2></div>
      <dl class="cd-settings">${lines.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v || '')}</dd></div>`).join('')}</dl>
      ${r.notes ? `<p class="hint">${esc(r.notes)}</p>` : ''}
      <div class="cd-actions"><button class="btn primary" data-a="sim">Try in simulator</button><button class="btn" data-a="edit">Edit</button>
        <button class="btn" data-a="copy">Copy settings</button><button class="btn" data-a="swap">Swap</button><button class="btn danger" data-a="rm">Unload</button></div>`;
    el.querySelector('[data-a=sim]').onclick = () => loadRecipe(r);
    el.querySelector('[data-a=edit]').onclick = () => openForm({ entry: r });
    el.querySelector('[data-a=copy]').onclick = (e) => { navigator.clipboard.writeText(recipeText(r.recipe, r.aka || r.name)); e.target.textContent = 'Copied'; };
    el.querySelector('[data-a=swap]').onclick = () => pickForRepertoire(i);
    el.querySelector('[data-a=rm]').onclick = () => { rp[i] = null; persist(); renderHome(); };
  }
  function renderHome() {
    const rp = getRepertoire();
    const slots = rp.map((id) => (id && store.recipes.find((x) => x.id === id)) || null);
    const items = Array.from({ length: slots.length * COPIES }, (_, j) => slots[j % slots.length]);
    const n = items.length, step = 360 / n, R = 300, FOCUS = 46; // the biggest card on the right (46° round the ring) is the one shown below
    const first = homeRing ? null : Math.max(0, slots.findIndex(Boolean));
    homeRing = Object.assign(homeRing || { theta: FOCUS - first * step, vel: 0, snap: null }, {
      n, step, R, items, cardW: HOME_W, drag: null, hover: false, fi: -1, visible: true,
      autoSpeed: 0.3, dragGain: 0.38, lean: (homeRing && homeRing.lean) || 0,
      focus: FOCUS, cardTurn: -90, zPush: 40, fadeFront: true, shadeMin: 0.45,
    });
    const ring = homeRing, stage = $('homeStage'), ringEl = $('homeRing');
    stage.style.height = Math.round(HOME_H * 1.75) + 'px';
    ring.el = ringEl;
    ring.stage = stage;
    ringEl.innerHTML = '';
    ring.cards = items.map((r, i) => {
      const c = document.createElement('div');
      c.className = 'ocard hcard display' + (r ? '' : ' empty');
      c.style.transform = `rotateY(${i * step}deg) translateZ(${R}px) rotateY(-90deg)`;
      // thickness: thin layers stacked behind the face read as a solid chrome edge when turned
      for (let z = 1; z <= THICK; z++) c.insertAdjacentHTML('beforeend', `<div class="hc-edge" style="transform:translateZ(${-z}px)"></div>`);
      c.insertAdjacentHTML('beforeend', `<div class="hc-back" style="transform:translateZ(${-THICK - 1}px) rotateY(180deg)"><span>C${(i % slots.length) + 1}</span></div>`);
      const face = document.createElement('div');
      face.className = 'hc-face';
      if (r) {
        face.appendChild(thumbCanvas(r.recipe));
        const [code, title] = splitName(r.name);
        face.insertAdjacentHTML('beforeend', `<span class="hc-slot">C${(i % slots.length) + 1}</span>
          <div class="hc-bottom"><b>${esc(r.aka || title)}</b><small>${esc(code || sim3(r))} · ${esc(FE.SIMS[r.recipe.sim].name)}</small></div>`);
      } else {
        face.innerHTML = `<span class="hc-slot">C${(i % slots.length) + 1}</span><div class="hc-empty">Empty slot<br><small>Add a cartridge</small></div>`;
      }
      face.insertAdjacentHTML('beforeend', '<div class="hc-sheen"></div>');
      c.appendChild(face);
      c.onclick = () => {
        if (ring.moved) return;
        if (frontIndex(ring) !== i) rotateRingTo(ring, i);
        else if (r) loadRecipe(r);
        else openForm({ slot: (i % slots.length) + 1 });
      };
      ringEl.appendChild(c);
      return c;
    });
    // floor reflection: a faint mirrored copy of the ring, faded out by an overlay
    $('homeRefl').innerHTML = '';
    ring.reflEl = null;
    attachRingDrag(stage, ring);
    ring.onFront = renderCartDetail;
    $('slotNav').innerHTML = slots.map((r, i) => `<button class="slot-chip${r ? '' : ' none'}" data-i="${i}" aria-label="Show C${i + 1}">C${i + 1}</button>`).join('');
    $('slotNav').querySelectorAll('button').forEach((b) => (b.onclick = () => {
      const sl = Number(b.dataset.i);
      let best = sl, bd = Infinity;
      for (let k = 0; k < COPIES; k++) { const j = sl + k * slots.length, d = Math.abs(angDelta(FOCUS - j * step, ring.theta)); if (d < bd) { bd = d; best = j; } }
      rotateRingTo(ring, best);
    }));
    fitRings();
    $('homeFade').hidden = true;
    if (!orbitRAF) orbitRAF = requestAnimationFrame(orbitTick);
    $('repCount').textContent = `${rp.filter(Boolean).length} of ${REP_SLOTS} cartridges loaded · ${CAM_NAME}`;

    const root = $('homePlaylists');
    root.innerHTML = '';
    const lists = store.scenarios
      .map((s) => [s, store.recipes.filter((r) => r.scenarios.includes(s))])
      .filter(([, items]) => items.length);
    if (!lists.length) root.innerHTML = '<div class="empty">No playlists yet. Tag cartridges with a playlist from the Library.</div>';
    lists.forEach(([s, items], gi) => {
      const sec = document.createElement('section');
      sec.className = 'pl-section display';
      sec.innerHTML = `<div class="pl-head"><span class="idx">${String(gi + 1).padStart(2, '0')}</span><h2>${esc(s)}</h2>
        <span class="cnt">${items.length} recipe${items.length === 1 ? '' : 's'}</span><button class="btn small">Edit</button></div><div class="pl-strip"></div>`;
      sec.querySelector('.btn').onclick = () => { state.libFilter = s; switchTab('library'); };
      const strip = sec.querySelector('.pl-strip');
      items.forEach((r) => { const el = editorialCard(r); el.querySelector('.pin-actions').remove(); strip.appendChild(el); });
      root.appendChild(sec);
    });
  }

  // ---------------- recipe form: dropdowns that mirror the camera's menus ----------------
  const opt = (lo, hi, step = 1) => { const o = []; for (let v = lo; v <= hi + 1e-9; v += step) { const x = +v.toFixed(1); o.push([x, fmt(x)]); } return o; };
  const LEVELS = [[0, 'Off'], [1, 'Weak'], [2, 'Strong']];
  const EC_STEPS = ['-3', '-2 2/3', '-2 1/3', '-2', '-1 2/3', '-1 1/3', '-1', '-2/3', '-1/3', '0', '+1/3', '+2/3', '+1', '+1 1/3', '+1 2/3', '+2', '+2 1/3', '+2 2/3', '+3'];
  const SIM_CHOICES = CAM.sims.flatMap((k) => (FE.SIMS[k].mono && k !== 'sepia'
    ? [['std', ''], ['ye', ' +Ye'], ['r', ' +R'], ['g', ' +G']].map(([f, l]) => [`${k}|${f}`, FE.SIMS[k].name + l])
    : [[`${k}|std`, FE.SIMS[k].name]]));
  const FORM = [
    { k: 'simChoice', label: 'Film Simulation', opts: SIM_CHOICES },
    { k: 'monoWC', label: 'Monochromatic Color WC', opts: opt(-9, 9), num: true, show: (f) => FE.SIMS[f.sim].mono && f.sim !== 'sepia' },
    { k: 'monoMG', label: 'Monochromatic Color MG', opts: opt(-9, 9), num: true, show: (f) => FE.SIMS[f.sim].mono && f.sim !== 'sepia' },
    { k: 'grainChoice', label: 'Grain Effect', opts: [['0|small', 'Off'], ['1|small', 'Weak, Small'], ['1|large', 'Weak, Large'], ['2|small', 'Strong, Small'], ['2|large', 'Strong, Large']] },
    { k: 'cce', label: 'Color Chrome Effect', opts: LEVELS, num: true, show: (f) => !FE.SIMS[f.sim].mono },
    { k: 'ccfxb', label: 'Color Chrome FX Blue', opts: LEVELS, num: true, show: (f) => !FE.SIMS[f.sim].mono },
    { k: 'wb', label: 'White Balance', opts: [['asShot', 'Auto'], ['autoWhite', 'Auto White Priority'], ['autoAmbience', 'Auto Ambience Priority'], ['kelvin', 'Color Temperature (K)'], ['daylight', 'Daylight'], ['shade', 'Shade'], ['fluorescent', 'Fluorescent'], ['incandescent', 'Incandescent'], ['underwater', 'Underwater']] },
    { k: 'kelvin', label: 'Color Temperature', opts: opt(2500, 10000, 100).map(([v]) => [v, v + 'K']), num: true, show: (f) => f.wb === 'kelvin' },
    { k: 'wbR', label: 'WB Shift: Red', opts: opt(-9, 9), num: true },
    { k: 'wbB', label: 'WB Shift: Blue', opts: opt(-9, 9), num: true },
    { k: 'drp', label: 'D Range Priority', opts: [['off', 'Off'], ['auto', 'Auto'], ['weak', 'Weak'], ['strong', 'Strong']] },
    { k: 'dr', label: 'Dynamic Range', opts: [[100, 'DR100'], [200, 'DR200'], [400, 'DR400']], num: true, show: (f) => f.drp === 'off' },
    { k: 'highlight', label: 'Highlight Tone', opts: opt(-2, 4, 0.5), num: true, show: (f) => f.drp === 'off' },
    { k: 'shadow', label: 'Shadow Tone', opts: opt(-2, 4, 0.5), num: true, show: (f) => f.drp === 'off' },
    { k: 'color', label: 'Color', opts: opt(-4, 4), num: true, show: (f) => !FE.SIMS[f.sim].mono },
    { k: 'sharpness', label: 'Sharpness', opts: opt(-4, 4), num: true },
    { k: 'nr', label: 'High ISO NR', opts: opt(-4, 4), num: true },
    { k: 'clarity', label: 'Clarity', opts: opt(-5, 5), num: true },
  ];
  let form = null; // { entry, f: working recipe }
  function openForm({ entry, slot } = {}) {
    const base = { ...FE.DEFAULT_RECIPE, ...(entry ? entry.recipe : {}) };
    if (!CAM.sims.includes(base.sim)) base.sim = 'provia';
    form = { entry, f: base };
    const rp = getRepertoire();
    const curSlot = slot || (entry ? rp.indexOf(entry.id) + 1 : 0);
    $('formTitle').textContent = entry ? `Edit ${entry.aka || entry.name}` : slot ? `New recipe for C${slot}` : 'New recipe';
    $('formName').value = entry ? entry.aka || splitName(entry.name)[1] : '';
    $('formSlot').innerHTML = `<option value="0">Library only</option>` + rp.map((id, i) => {
      const o = id && id !== (entry && entry.id) && store.recipes.find((x) => x.id === id);
      return `<option value="${i + 1}">C${i + 1}${o ? ` (replaces ${esc(o.aka || o.name)})` : ''}</option>`;
    }).join('');
    $('formSlot').value = curSlot;
    $('formIso').value = entry ? entry.iso || '' : '';
    $('formEc').innerHTML = '<option value="">Not set</option>' + EC_STEPS.map((v) => `<option>${v}</option>`).join('');
    $('formEc').value = entry ? entry.ec || '' : '';
    $('formNotes').value = entry ? entry.notes || '' : '';
    $('formScn').innerHTML = store.scenarios.map((s) => `<button type="button" class="chip${entry && entry.scenarios.includes(s) ? ' on' : ''}">${esc(s)}</button>`).join('');
    $('formScn').querySelectorAll('.chip').forEach((b) => (b.onclick = () => { b.classList.toggle('on'); b.dataset.touched = 1; }));
    form.scnTouched = !!entry;
    buildFormFields();
    $('formDlg').showModal();
    $('formName').focus();
  }
  function buildFormFields() {
    const f = form.f, root = $('formFields');
    f.simChoice = `${f.sim}|${FE.SIMS[f.sim].mono && f.sim !== 'sepia' ? f.monoFilter : 'std'}`;
    f.grainChoice = `${f.grain}|${f.grain ? f.grainSize : 'small'}`;
    root.innerHTML = '';
    FORM.forEach((c) => {
      if (c.show && !c.show(f)) return;
      const lk = c.locked && f.drp !== 'off';
      const row = document.createElement('label');
      row.className = 'frow' + (lk ? ' locked' : '');
      row.innerHTML = `<span>${c.label}${qm(c.k)}</span>`;
      const sel = document.createElement('select');
      c.opts.forEach(([v, t]) => sel.add(new Option(t, v)));
      sel.value = String(f[c.k]);
      sel.disabled = lk;
      sel.onchange = () => {
        const v = c.num ? Number(sel.value) : sel.value;
        if (c.k === 'simChoice') { const [sim, mf] = v.split('|'); f.sim = sim; f.monoFilter = mf; }
        else if (c.k === 'grainChoice') { const [g, gs] = v.split('|'); f.grain = Number(g); f.grainSize = gs; }
        else f[c.k] = v;
        buildFormFields();
      };
      row.appendChild(sel);
      if (lk) row.insertAdjacentHTML('beforeend', '<small>Set by D Range Priority</small>');
      root.appendChild(row);
    });
    updateFormPreview();
  }
  const formRecipe = () => { const r = {}; Object.keys(FE.DEFAULT_RECIPE).forEach((k) => (r[k] = form.f[k])); return r; };
  function updateFormPreview() {
    const r = formRecipe(), a = RT.analyze(r);
    const box = $('formPreview');
    box.innerHTML = '';
    const cv = thumbCanvas(r);
    box.appendChild(cv);
    const others = store.recipes.filter((x) => !form.entry || x.id !== form.entry.id).map((x) => x.name);
    const scn = RT.suggestScenarios(r, store.scenarios);
    if (!form.scnTouched) $('formScn').querySelectorAll('.chip').forEach((b) => { if (!b.dataset.touched) b.classList.toggle('on', scn.includes(b.textContent)); });
    $('formCode').innerHTML = `Saves as <b>${esc(RT.makeName(r, $('formName').value.trim(), scn, others))}</b><br>${esc(FE.SIMS[r.sim].name)} · ${TEMP[a.temp]} · ${TONE[a.tone]} contrast`;
  }
  function saveForm() {
    const recipe = formRecipe();
    const aka = $('formName').value.trim();
    const scenarios = [...$('formScn').querySelectorAll('.chip.on')].map((b) => b.textContent);
    const others = store.recipes.filter((x) => !form.entry || x.id !== form.entry.id).map((x) => x.name);
    const name = RT.makeName(recipe, aka, scenarios, others);
    let entry = form.entry;
    const fields = { name, aka, scenarios, recipe, iso: $('formIso').value.trim(), ec: $('formEc').value, notes: $('formNotes').value, updated: Date.now() };
    if (entry) Object.assign(entry, fields);
    else { entry = { id: uid(), created: Date.now(), source: '', ...fields }; store.recipes.push(entry); }
    const rp = getRepertoire(), slot = Number($('formSlot').value);
    rp.forEach((id, i) => { if (id === entry.id && i !== slot - 1) rp[i] = null; });
    if (slot) rp[slot - 1] = entry.id;
    persist();
    $('formDlg').close();
    thumbCache.clear();
    renderHome(); renderLibrary(); renderLineups(); renderQuickLineup(); syncControls();
  }

  // your own recipes from my-recipes.js. Each is added once; when its entry in the file
  // changes it's updated again, unless you've edited that recipe in the app since.
  function seedMine() {
    const M = window.MY_RECIPES;
    if (!M) return;
    if (Array.isArray(store.seeded) || !store.seeded) store.seeded = {}; // older format was a list of ids
    const rp = getRepertoire();
    (M.repertoire || []).forEach((m) => {
      const sig = JSON.stringify(m);
      const seen = store.seeded[m.id];
      if (seen && seen.sig === sig) return;
      const recipe = { ...FE.DEFAULT_RECIPE, ...m.recipe };
      const scenarios = m.scenarios || RT.suggestScenarios(recipe, store.scenarios);
      const existing = store.recipes.find((r) => r.id === m.id);
      const others = store.recipes.filter((r) => r.id !== m.id).map((r) => r.name);
      const fields = { name: RT.makeName(recipe, m.aka, scenarios, others), aka: m.aka || '', scenarios, notes: m.notes || '', iso: m.iso || '', ec: m.ec || '', recipe };
      if (existing) {
        if (!existing.updated || (seen && existing.updated <= seen.at)) Object.assign(existing, fields);
      } else if (!seen) {
        store.recipes.push({ id: m.id, source: '', created: Date.now(), ...fields });
        if (m.slot && !rp[m.slot - 1]) rp[m.slot - 1] = m.id;
      }
      store.seeded[m.id] = { sig, at: Date.now() };
    });
    persist();
  }

  // ---------------- tabs + wiring ----------------
  const PAGES = { home: 'home', library: 'playlists', cartridges: 'library', editor: 'simulator', calibrate: 'calibrate' };
  const pageFromHash = () => Object.keys(PAGES).find((k) => '#' + PAGES[k] === location.hash);
  window.addEventListener('hashchange', () => { const t = pageFromHash(); if (t) switchTab(t); });
  function switchTab(t) {
    if (location.hash !== '#' + PAGES[t]) location.hash = PAGES[t];
    document.querySelectorAll('nav button').forEach((b) => b.classList.toggle('active', b.dataset.tab === t));
    document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === t));
    window.scrollTo(0, 0);
    if (t === 'home') renderHome();
    if (t === 'cartridges') renderCartridges();
    if (t === 'library') renderLibrary();
    else if (t !== 'home') stopOrbit();
    if (t === 'lineups') renderLineups();
    if (t === 'editor') renderQuickLineup();
  }
  document.querySelectorAll('nav button').forEach((b) => (b.onclick = () => switchTab(b.dataset.tab)));
  $('btnUpload').onclick = () => $('file').click();
  $('file').onchange = (e) => e.target.files[0] && loadFile(e.target.files[0]);
  $('btnSample').onclick = makeTestChart;
  $('split').oninput = () => lastOut && draw();
  $('btnExport').onclick = exportJpeg;
  $('btnReset').onclick = () => { state.recipe = { ...FE.DEFAULT_RECIPE }; state.loadedId = null; onRecipeChange(); renderQuickLineup(); };
  $('btnCopy').onclick = () => {
    const loaded = store.recipes.find((r) => r.id === state.loadedId);
    navigator.clipboard.writeText(recipeText(state.recipe, loaded && loaded.name));
    $('btnCopy').textContent = 'Copied'; setTimeout(() => ($('btnCopy').textContent = 'Copy text'), 1200);
  };
  $('btnSave').onclick = openSave;
  $('saveOk').onclick = () => commitSave(false);
  $('saveAsNew').onclick = () => commitSave(true);
  $('saveCancel').onclick = () => $('saveDlg').close();
  $('saveName').onkeydown = (e) => e.key === 'Enter' && commitSave(false);
  $('pickOnlyScn').onclick = () => { pickAll = false; renderPickList(); };
  $('pickAll').onclick = () => { pickAll = true; renderPickList(); };
  $('pickClear').onclick = () => assignSlot(null);
  $('pickCancel').onclick = () => $('pickDlg').close();
  $('libSearch').oninput = renderLibrary;
  $('libSort').onchange = renderLibrary;
  $('cartSearch').oninput = renderCartridges;
  $('cartShow').onchange = renderCartridges;
  $('cartSort').onchange = renderCartridges;
  const setLibMode = (m) => { state.libMode = m; try { localStorage.setItem('filmRecipeLab.libMode', m); } catch (e) { /* ignore */ } renderLibrary(); };
  $('modeGrid').onclick = () => setLibMode('grid');
  $('modeOrbit').onclick = () => setLibMode('orbit');
  $('btnAddScenario').onclick = addScenario;
  $('btnPaste').onclick = () => { $('pasteDlg').showModal(); $('pasteText').focus(); };
  $('homePaste').onclick = () => { $('pasteRep').checked = true; $('pasteDlg').showModal(); $('pasteText').focus(); };
  $('homeSim').onclick = () => switchTab('editor');
  $('homeAdd').onclick = () => openForm();
  $('btnNewRecipe').onclick = () => openForm();
  $('formSave').onclick = saveForm;
  $('formCancel').onclick = () => $('formDlg').close();
  $('formName').oninput = () => updateFormPreview();
  $('pasteParse').onclick = analysePaste;
  $('pasteAdd').onclick = addParsed;
  $('pasteCancel').onclick = () => $('pasteDlg').close();
  $('btnAutoFill').onclick = () => autoBuild('fill');
  $('btnAutoRebuild').onclick = () => autoBuild('rebuild');
  $('btnExportLib').onclick = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' }));
    a.download = 'film-recipes.json'; a.click();
  };
  $('btnImportLib').onclick = () => $('importFile').click();
  $('importFile').onchange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      const ids = new Set(store.recipes.map((r) => r.id));
      (data.recipes || []).forEach((r) => { if (!ids.has(r.id)) store.recipes.push(r); });
      (data.scenarios || []).forEach((s) => { if (!store.scenarios.includes(s)) store.scenarios.push(s); });
      Object.entries(data.lineups || {}).forEach(([s, l]) => { if (!store.lineups[s] || !store.lineups[s].some(Boolean)) store.lineups[s] = l; });
      persist(); renderLibrary(); renderLineups(); renderQuickLineup();
    } catch (err) { alert('Could not import: ' + err.message); }
    e.target.value = '';
  };
  $('view').onclick = (e) => {
    if (!state.full) return;
    if (state.zoom) state.zoom = null;
    else {
      const rect = e.target.getBoundingClientRect();
      state.zoom = { x: ((e.clientX - rect.left) / rect.width) * state.full.width, y: ((e.clientY - rect.top) / rect.height) * state.full.height };
    }
    prepareView();
  };
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !e.repeat && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && lastOut) {
      e.preventDefault(); state.showOriginal = true; draw();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (!homeRing || !$('home').classList.contains('active') || document.querySelector('dialog[open]') || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); rotateRingTo(homeRing, (frontIndex(homeRing) + (e.key === 'ArrowRight' ? 1 : -1) + homeRing.n) % homeRing.n); }
  });
  document.addEventListener('keyup', (e) => { if (e.code === 'Space' && state.showOriginal) { state.showOriginal = false; draw(); } });
  window.addEventListener('calibration-changed', () => {
    thumbCache.clear();
    syncControls(); scheduleRender();
    renderLibrary(); renderLineups();
  });
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f && f.type.startsWith('image/')) loadFile(f); });

  persist();
  seedMine();
  buildControls();
  buildExposure();
  renderQuickLineup();
  makeTestChart();
  switchTab(pageFromHash() || 'home');
})();
