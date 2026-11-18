/*
 * Calibration: learn a per-sim 3D LUT from PROVIA / target-sim JPEG pairs.
 *
 * Each aligned pixel pair (PROVIA colour -> target colour) is splatted
 * trilinearly into a 17³ grid. A grid node's value is the weighted mean of the
 * target colours seen around it; nodes with few samples fall back to the
 * hand-tuned model, so colours missing from your photos still look sensible.
 * Pairs accumulate, so every extra scene widens the coverage.
 */
(function () {
  'use strict';
  const FE = window.FilmEngine;
  const $ = (id) => document.getElementById(id);
  const S = FE.LUT_SIZE, NODES = S * S * S;
  const KEY = 'filmRecipeLab.calib.v1', FIT_MAX = 480, PRIOR = 2;
  const NEUTRAL_EXPOSURE = { orig: { aperture: 8, shutter: 0.01, iso: 200 }, next: { aperture: 8, shutter: 0.01, iso: 200 }, ec: 0 };
  const colorSims = Object.entries(FE.SIMS).filter(([k, s]) => !s.mono && k !== 'provia');

  // ---------------- persistence ----------------
  // sims[key] = { pairs, mean: [NODES*3], weight: [NODES] }
  let data = { enabled: true, sims: {} };
  try { data = JSON.parse(localStorage.getItem(KEY)) || data; } catch (e) { /* ignore */ }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); }
    catch (e) { alert('Could not save calibration to browser storage: ' + e.message); }
  }

  // ---------------- LUT building ----------------
  // what the hand-tuned model does to each grid colour
  function modelGrid(simKey) {
    const img = new ImageData(NODES, 1);
    for (let i = 0; i < NODES; i++) {
      const r = i % S, g = ((i / S) | 0) % S, b = (i / (S * S)) | 0;
      img.data[i * 4] = Math.round((r / (S - 1)) * 255);
      img.data[i * 4 + 1] = Math.round((g / (S - 1)) * 255);
      img.data[i * 4 + 2] = Math.round((b / (S - 1)) * 255);
      img.data[i * 4 + 3] = 255;
    }
    const out = FE.process(img, { ...FE.DEFAULT_RECIPE, sim: simKey }, NEUTRAL_EXPOSURE,
      { scale: 1, offX: 0, offY: 0, fullW: 1, fullH: 1 }, FE.makeNoise(NODES, 1, 1), { noCalib: true });
    const g = new Float32Array(NODES * 3);
    for (let i = 0; i < NODES; i++) for (let c = 0; c < 3; c++) g[i * 3 + c] = out.data[i * 4 + c] / 255;
    return g;
  }
  function buildLut(simKey) {
    const s = data.sims[simKey];
    if (!s) return null;
    const fb = modelGrid(simKey), lut = new Float32Array(NODES * 3);
    for (let i = 0; i < NODES; i++) {
      const w = s.weight[i];
      for (let c = 0; c < 3; c++) lut[i * 3 + c] = (s.mean[i * 3 + c] * w + fb[i * 3 + c] * PRIOR) / (w + PRIOR);
    }
    return lut;
  }
  function applyAll() {
    FE.calibration.enabled = data.enabled;
    FE.calibration.luts = {};
    for (const k in data.sims) FE.calibration.luts[k] = buildLut(k);
    window.dispatchEvent(new Event('calibration-changed'));
  }

  // ---------------- image loading ----------------
  const slots = { ref: null, tgt: null }; // { canvas, exif, name }
  let pendingSlot = null;
  function loadInto(slot, file) {
    const reader = new FileReader();
    reader.onload = () => {
      const exif = FE.readExif(reader.result) || {};
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext('2d').drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        slots[slot] = { canvas: c, exif, name: file.name };
        showSlot(slot);
        updateDetect();
      };
      img.src = url;
    };
    reader.readAsArrayBuffer(file);
  }
  function showSlot(slot) {
    const el = $(slot === 'ref' ? 'dropRef' : 'dropTgt'), s = slots[slot];
    const cv = el.querySelector('canvas');
    const k = Math.min(1, 600 / Math.max(s.canvas.width, s.canvas.height));
    cv.width = Math.round(s.canvas.width * k); cv.height = Math.round(s.canvas.height * k);
    cv.getContext('2d').drawImage(s.canvas, 0, 0, cv.width, cv.height);
    el.classList.add('has');
    const sim = s.exif.filmSim ? FE.SIMS[s.exif.filmSim].name : s.exif.make ? 'unknown sim' : 'no Fuji EXIF';
    el.querySelector('.lbl').innerHTML = `${slot === 'ref' ? 'Reference' : 'Target'}: <b>${esc(s.name)}</b><br><span class="hint">${esc(sim)}</span>`;
  }
  function updateDetect() {
    const msgs = [];
    const r = slots.ref, t = slots.tgt;
    if (r && r.exif.filmSim && r.exif.filmSim !== 'provia') msgs.push(`<span class="warn">The reference looks like ${esc(FE.SIMS[r.exif.filmSim].name)}, not PROVIA.</span>`);
    if (t && t.exif.filmSim) {
      if (t.exif.filmSim === 'provia') msgs.push('<span class="warn">The target is PROVIA too. Pick a different sim.</span>');
      else if (colorSims.some(([k]) => k === t.exif.filmSim)) { $('calSim').value = t.exif.filmSim; msgs.push(`Detected from EXIF: <b>${esc(FE.SIMS[t.exif.filmSim].name)}</b>`); }
    } else if (t && t.exif.make) msgs.push('Couldn\'t read the sim from EXIF. Choose it above.');
    if (r && t) {
      const ar = r.canvas.width / r.canvas.height, at = t.canvas.width / t.canvas.height;
      if (Math.abs(ar - at) > 0.01) msgs.push('<span class="warn">The two images have different aspect ratios, so they can\'t be paired.</span>');
      ['aperture', 'shutter', 'iso'].forEach((k) => {
        if (r.exif[k] && t.exif[k] && Math.abs(Math.log2(r.exif[k] / t.exif[k])) > 0.1) msgs.push(`<span class="warn">The ${k} differs between the two shots, so the calibration will absorb an exposure difference.</span>`);
      });
    }
    $('calDetect').innerHTML = msgs.join('<br>');
    $('calAdd').disabled = !(r && t);
  }

  // ---------------- fitting ----------------
  function pixels(canvas, w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(canvas, 0, 0, w, h);
    return ctx.getImageData(0, 0, w, h);
  }
  function lumaCorrelation(a, b) {
    let sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0;
    const n = a.data.length / 4;
    for (let i = 0; i < n; i++) {
      const p = i * 4;
      const x = a.data[p] * 0.3 + a.data[p + 1] * 0.59 + a.data[p + 2] * 0.11;
      const y = b.data[p] * 0.3 + b.data[p + 1] * 0.59 + b.data[p + 2] * 0.11;
      sa += x; sb += y; saa += x * x; sbb += y * y; sab += x * y;
    }
    const cov = sab / n - (sa / n) * (sb / n);
    return cov / Math.sqrt((saa / n - (sa / n) ** 2) * (sbb / n - (sb / n) ** 2) || 1);
  }

  function addPair() {
    const simKey = $('calSim').value, r = slots.ref, t = slots.tgt;
    const k = Math.min(1, FIT_MAX / Math.max(r.canvas.width, r.canvas.height));
    const w = Math.round(r.canvas.width * k), h = Math.round(r.canvas.height * k);
    const A = pixels(r.canvas, w, h), B = pixels(t.canvas, w, h);

    const corr = lumaCorrelation(A, B);
    if (corr < 0.85 && !confirm(`The two images don't seem to line up (correlation ${corr.toFixed(2)}). A misaligned pair will teach the calibration wrong colours. Add it anyway?`)) return;

    const sum = new Float64Array(NODES * 3), wsum = new Float64Array(NODES);
    const m = S - 1;
    let used = 0;
    for (let i = 0; i < w * h; i++) {
      const p = i * 4;
      const ar = A.data[p], ag = A.data[p + 1], ab = A.data[p + 2];
      if (Math.max(ar, ag, ab) >= 253) continue; // clipped in PROVIA: ambiguous
      used++;
      const fr = (ar / 255) * m, fg = (ag / 255) * m, fb = (ab / 255) * m;
      const r0 = Math.min(m - 1, fr | 0), g0 = Math.min(m - 1, fg | 0), b0 = Math.min(m - 1, fb | 0);
      const dr = fr - r0, dg = fg - g0, db = fb - b0;
      const tr = B.data[p] / 255, tg = B.data[p + 1] / 255, tb = B.data[p + 2] / 255;
      for (let c = 0; c < 8; c++) {
        const ri = r0 + (c & 1), gi = g0 + ((c >> 1) & 1), bi = b0 + (c >> 2);
        const wt = ((c & 1) ? dr : 1 - dr) * (((c >> 1) & 1) ? dg : 1 - dg) * ((c >> 2) ? db : 1 - db);
        if (wt < 1e-4) continue;
        const node = ri + gi * S + bi * S * S;
        wsum[node] += wt;
        sum[node * 3] += tr * wt; sum[node * 3 + 1] += tg * wt; sum[node * 3 + 2] += tb * wt;
      }
    }

    const before = { lut: FE.calibration.luts[simKey] };
    const s = data.sims[simKey] || { pairs: 0, mean: new Array(NODES * 3).fill(0), weight: new Array(NODES).fill(0) };
    for (let i = 0; i < NODES; i++) {
      const W = s.weight[i] + wsum[i];
      if (!wsum[i]) continue;
      for (let c = 0; c < 3; c++) s.mean[i * 3 + c] = +((s.mean[i * 3 + c] * s.weight[i] + sum[i * 3 + c]) / W).toFixed(4);
      s.weight[i] = +W.toFixed(2);
    }
    s.pairs++;
    data.sims[simKey] = s;
    persist();
    applyAll();
    showResult(simKey, A, B, before.lut, used / (w * h), corr);
    $('calMsg').innerHTML = `Added pair #${s.pairs} to ${esc(FE.SIMS[simKey].name)}.`;
    renderStatus();
  }

  // ---------------- comparison ----------------
  function toOklab(r, g, b) {
    const lin = (v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    r = lin(r / 255); g = lin(g / 255); b = lin(b / 255);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
  }
  // mean colour difference in Oklab ×100 (≈ ΔE; under ~2 is hard to see side by side)
  function deltaE(X, Y) {
    let tot = 0;
    const n = X.data.length / 4, step = 3;
    let cnt = 0;
    for (let i = 0; i < n; i += step) {
      const p = i * 4;
      const a = toOklab(X.data[p], X.data[p + 1], X.data[p + 2]), b = toOklab(Y.data[p], Y.data[p + 1], Y.data[p + 2]);
      tot += Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); cnt++;
    }
    return (tot / cnt) * 100;
  }
  function simulate(A, simKey, lut) {
    const saved = FE.calibration.luts[simKey], savedOn = FE.calibration.enabled;
    FE.calibration.luts[simKey] = lut;
    FE.calibration.enabled = true;
    const out = FE.process(A, { ...FE.DEFAULT_RECIPE, sim: simKey }, NEUTRAL_EXPOSURE,
      { scale: 1, offX: 0, offY: 0, fullW: A.width, fullH: A.height }, FE.makeNoise(A.width, A.height, 1), { noCalib: !lut });
    FE.calibration.luts[simKey] = saved;
    FE.calibration.enabled = savedOn;
    return out;
  }
  function showResult(simKey, A, B, prevLut, coverage, corr) {
    const model = simulate(A, simKey, null);
    const calib = simulate(A, simKey, FE.calibration.luts[simKey]);
    const eModel = deltaE(model, B), eCal = deltaE(calib, B);
    const ePrev = prevLut ? deltaE(simulate(A, simKey, prevLut), B) : null;
    const fig = (img, cap) => {
      const f = document.createElement('figure');
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      c.getContext('2d').putImageData(img, 0, 0);
      f.appendChild(c);
      f.insertAdjacentHTML('beforeend', `<figcaption>${cap}</figcaption>`);
      return f;
    };
    const root = $('calResult');
    root.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'cal-compare';
    grid.append(
      fig(B, `<b>Camera</b> · ${esc(FE.SIMS[simKey].name)}`),
      fig(model, `<b>Hand-tuned model</b> · ΔE ${eModel.toFixed(2)}`),
      fig(calib, `<b>Calibrated</b> · ΔE ${eCal.toFixed(2)}${ePrev != null ? ` (was ${ePrev.toFixed(2)} before this pair)` : ''}`));
    root.appendChild(grid);
    root.insertAdjacentHTML('beforeend', `<p class="hint">ΔE is the average colour difference from the camera's JPEG (under ~2 is hard to see side by side).
      This pair was used for training, so the calibrated score is optimistic. The real test is "was … before this pair" on your <i>next</i> new scene.
      Used ${Math.round(coverage * 100)}% of pixels (clipped PROVIA highlights are skipped) · alignment ${corr.toFixed(3)}.</p>`);
  }

  // ---------------- status table ----------------
  function renderStatus() {
    const rows = colorSims.map(([k, sim]) => {
      const s = data.sims[k];
      if (!s) return `<tr><td>${esc(sim.name)}</td><td class="hint">not calibrated</td><td></td><td></td><td></td></tr>`;
      const covered = s.weight.filter((w) => w >= 3).length;
      return `<tr><td><b>${esc(sim.name)}</b></td><td>${s.pairs} pair${s.pairs > 1 ? 's' : ''}</td>
        <td>${((covered / NODES) * 100).toFixed(1)}% of colour grid</td>
        <td><button class="btn small" data-cube="${k}">Export .cube</button></td>
        <td><button class="btn small danger" data-reset="${k}">Reset</button></td></tr>`;
    }).join('');
    $('calStatus').innerHTML = `<table class="cal"><tr><th>Simulation</th><th>Pairs</th><th>Coverage</th><th></th><th></th></tr>${rows}</table>
      <p class="hint">Coverage counts the grid colours your photos actually contain. Real scenes rarely go past 15–25%, and that's fine: uncovered colours (like neon magenta) use the hand-tuned model. Mono sims (ACROS, Monochrome, Sepia) stay hand-tuned for now.</p>`;
    $('calStatus').querySelectorAll('[data-reset]').forEach((b) => (b.onclick = () => {
      const k = b.dataset.reset;
      if (!confirm(`Delete the calibration for ${FE.SIMS[k].name}? This can't be undone.`)) return;
      delete data.sims[k]; persist(); applyAll(); renderStatus();
    }));
    $('calStatus').querySelectorAll('[data-cube]').forEach((b) => (b.onclick = () => exportCube(b.dataset.cube)));
  }
  function exportCube(k) {
    const lut = FE.calibration.luts[k] || buildLut(k);
    const lines = [`TITLE "${FE.SIMS[k].name} (calibrated from PROVIA)"`, `LUT_3D_SIZE ${S}`, 'DOMAIN_MIN 0 0 0', 'DOMAIN_MAX 1 1 1'];
    for (let i = 0; i < NODES; i++) lines.push(`${lut[i * 3].toFixed(5)} ${lut[i * 3 + 1].toFixed(5)} ${lut[i * 3 + 2].toFixed(5)}`);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain' }));
    a.download = FE.SIMS[k].name.replace(/[^\w-]+/g, '_') + '_from_PROVIA.cube';
    a.click();
  }

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------------- wiring ----------------
  colorSims.forEach(([k, s]) => $('calSim').add(new Option(s.name, k)));
  [['dropRef', 'ref'], ['dropTgt', 'tgt']].forEach(([id, slot]) => {
    const el = $(id);
    el.onclick = () => { pendingSlot = slot; $('calFile').click(); };
    el.ondragover = (e) => { e.preventDefault(); e.stopPropagation(); el.classList.add('over'); };
    el.ondragleave = () => el.classList.remove('over');
    el.ondrop = (e) => {
      e.preventDefault(); e.stopPropagation(); el.classList.remove('over');
      const f = e.dataTransfer.files[0];
      if (f) loadInto(slot, f);
    };
  });
  $('calFile').onchange = (e) => { const f = e.target.files[0]; if (f && pendingSlot) loadInto(pendingSlot, f); e.target.value = ''; };
  $('calAdd').onclick = addPair;
  $('calEnabled').checked = data.enabled;
  $('calEnabled').onchange = () => { data.enabled = $('calEnabled').checked; persist(); applyAll(); };

  renderStatus();
  applyAll();

  // exposed for testing in the console
  window.FilmCalibration = { loadInto, addPair, slots };
})();
