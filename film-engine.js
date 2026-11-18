/*
 * Film recipe simulation engine.
 *
 * Model: the uploaded photo is treated as a Fujifilm JPEG shot with the
 * "reference" recipe (PROVIA, DR100, all tone/color settings at 0, Auto WB).
 * Every film simulation below is therefore expressed as a *delta from PROVIA*.
 * Using a different input (another sim, a phone photo, an edited image) still
 * works but drifts further from what the camera would produce.
 *
 * Pipeline per pixel:
 *   sRGB decode -> exposure (aperture/shutter/ISO/EC) -> lens vignetting delta
 *   -> white balance + WB shift -> dynamic range (highlight shoulder)
 *   -> tone curve (sim contrast + Highlight/Shadow tone)
 *   -> color in Oklab (sim saturation, per-hue shifts, split toning,
 *      Color, Color Chrome Effect, Color Chrome FX Blue) or mono conversion
 * Then a spatial pass on luminance:
 *   Sharpness, High ISO NR, Clarity, ISO noise, Grain Effect
 */
(function (global) {
  'use strict';

  // ---------- transfer-function lookup tables ----------
  const SRGB_TO_LIN = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const c = i / 255;
    SRGB_TO_LIN[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }
  const N = 4096;
  const ENC = new Float32Array(N + 1); // linear -> display
  const DEC = new Float32Array(N + 1); // display -> linear
  for (let i = 0; i <= N; i++) {
    const x = i / N;
    ENC[i] = x <= 0.0031308 ? x * 12.92 : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
    DEC[i] = x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  }
  const enc = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : ENC[(x * N + 0.5) | 0]);
  const dec = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : DEC[(x * N + 0.5) | 0]);

  // ---------- film simulations (deltas from PROVIA) ----------
  // hues: [centerDeg (Oklab hue), widthDeg, hueShiftDeg, chromaMul, lightnessDelta]
  // Oklab hue reference: red ~29, orange/skin ~60, yellow ~110, green ~142,
  // cyan ~195, blue ~264, magenta ~328
  const SIMS = {
    provia: { name: 'PROVIA / Standard', contrast: 0, sat: 1 },
    velvia: {
      name: 'Velvia / Vivid', contrast: 0.18, sat: 1.32, sh: 0.5, hi: 0.5,
      hues: [[29, 30, 0, 1.08, -0.015], [142, 35, -4, 1.12, -0.01], [255, 35, 0, 1.15, -0.03], [328, 30, 0, 1.1, 0]],
    },
    astia: {
      name: 'ASTIA / Soft', contrast: 0.03, sat: 1.12, sh: -0.5,
      hues: [[60, 30, 0, 0.95, 0.01], [255, 35, 0, 1.1, -0.01], [142, 35, 0, 1.06, 0]],
    },
    classicChrome: {
      name: 'Classic Chrome', contrast: 0.08, sat: 0.72, sh: 1, hi: -0.5,
      hues: [[29, 28, 4, 0.85, -0.02], [70, 25, -2, 0.85, 0], [120, 30, -8, 0.8, 0], [145, 30, -12, 0.75, -0.01], [255, 35, -18, 0.85, -0.02]],
      shadowTint: [-0.004, -0.006], highTint: [0.002, 0.006],
    },
    realaAce: {
      name: 'REALA ACE', contrast: 0.1, sat: 1.05, sh: 0.5,
      hues: [[145, 30, -2, 1.04, 0], [255, 35, -3, 1.05, -0.01]],
    },
    proNegHi: {
      name: 'PRO Neg. Hi', contrast: 0.06, sat: 0.9, sh: 0.5,
      hues: [[60, 30, 0, 0.92, 0.01]],
    },
    proNegStd: {
      name: 'PRO Neg. Std', contrast: -0.08, sat: 0.82, sh: -0.5, hi: -0.5, black: 0.008,
      hues: [[60, 30, 0, 0.9, 0.01]],
    },
    classicNeg: {
      name: 'Classic Neg.', contrast: 0.16, sat: 0.86, sh: 1, hi: 0.5, white: 0.02,
      hues: [[29, 25, 5, 1.05, -0.02], [65, 25, -4, 0.95, 0], [105, 25, -10, 0.85, 0], [145, 35, 20, 0.78, -0.03], [255, 35, -12, 0.9, -0.01]],
      shadowTint: [-0.012, -0.010], highTint: [0.006, 0.012],
    },
    nostalgicNeg: {
      name: 'Nostalgic Neg.', contrast: 0, sat: 1.02, sh: -0.5, black: 0.006,
      hues: [[29, 30, 2, 1.08, -0.01], [70, 30, -3, 1.05, 0], [255, 35, -6, 0.92, 0]],
      shadowTint: [0, 0.002], highTint: [0.008, 0.028],
    },
    eterna: {
      name: 'ETERNA / Cinema', contrast: -0.2, sat: 0.68, sh: -1, hi: -1, black: 0.02, white: 0.01,
      hues: [[145, 35, 10, 0.8, 0], [70, 30, 0, 0.9, 0]],
      shadowTint: [-0.008, -0.008], highTint: [0.002, 0.006],
    },
    bleachBypass: {
      name: 'ETERNA Bleach Bypass', contrast: 0.3, sat: 0.38, sh: 1, hi: 1,
      shadowTint: [-0.003, -0.004],
    },
    acros: { name: 'ACROS', mono: true, contrast: 0.14, sh: 0.5, hi: 0.5, acrosGrain: true },
    monochrome: { name: 'Monochrome', mono: true, contrast: 0.02 },
    sepia: { name: 'Sepia', mono: true, contrast: 0.02, tint: [0.012, 0.035] },
  };

  const MONO_FILTERS = {
    std: [0.2126, 0.7152, 0.0722],
    ye: [0.32, 0.64, 0.04],
    r: [0.62, 0.34, 0.04],
    g: [0.12, 0.84, 0.04],
  };

  const DEFAULT_RECIPE = {
    sim: 'provia', monoFilter: 'std', monoWC: 0, monoMG: 0,
    grain: 0, grainSize: 'small', cce: 0, ccfxb: 0,
    wb: 'asShot', kelvin: 5500, wbR: 0, wbB: 0,
    drp: 'off', dr: 100, highlight: 0, shadow: 0, color: 0,
    sharpness: 0, nr: 0, clarity: 0,
  };

  // D Range Priority takes over DR and Highlight/Shadow tone (the camera greys them out)
  const DRP = { auto: { dr: 200, highlight: -1, shadow: -1 }, weak: { dr: 200, highlight: -1, shadow: -1 }, strong: { dr: 400, highlight: -2, shadow: -2 } };
  const effectiveRecipe = (r) => (DRP[r.drp] ? { ...r, ...DRP[r.drp] } : r);

  // ---------- exposure helpers ----------
  function deltaEV(orig, next, ec) {
    // brightness ∝ shutter * ISO / N²
    return Math.log2((orig.aperture * orig.aperture) / (next.aperture * next.aperture)) +
      Math.log2(next.shutter / orig.shutter) +
      Math.log2(next.iso / orig.iso) + (ec || 0);
  }
  // corner falloff of a typical fast prime, as a fraction of light lost
  const vignetteAt = (f) => Math.max(0, Math.min(1, (5.6 - f) / 4.4)) * 0.45;

  // ---------- white balance ----------
  function kelvinRGB(k) {
    const t = k / 100;
    let r, g, b;
    if (t <= 66) {
      r = 255;
      g = 99.4708025861 * Math.log(t) - 161.1195681661;
      b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
    } else {
      r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
      g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
      b = 255;
    }
    const c = (v) => SRGB_TO_LIN[Math.max(0, Math.min(255, Math.round(v)))] || 1e-4;
    return [c(r), c(g), c(b)];
  }
  const WB_PRESETS = { asShot: null, daylight: 5500, cloudy: 6500, shade: 7500, fluorescent: 4000, incandescent: 3000 };

  function wbGains(recipe) {
    let g = [1, 1, 1];
    const k = recipe.wb === 'kelvin' ? recipe.kelvin : WB_PRESETS[recipe.wb];
    if (k) {
      // photo assumed balanced for ~5500K; setting a different K re-renders it
      const base = kelvinRGB(5500), tgt = kelvinRGB(k);
      g = [base[0] / tgt[0], base[1] / tgt[1], base[2] / tgt[2]];
      if (recipe.wb === 'fluorescent') g[1] *= 0.96; // slight magenta correction
    }
    g[0] *= Math.pow(2, recipe.wbR * 0.045);
    g[2] *= Math.pow(2, recipe.wbB * 0.045);
    const lum = 0.2126 * g[0] + 0.7152 * g[1] + 0.0722 * g[2];
    return [g[0] / lum, g[1] / lum, g[2] / lum];
  }

  // ---------- tone curve ----------
  function buildToneLUT(sim, recipe) {
    const lut = new Float32Array(N + 1);
    const c = sim.contrast || 0;
    const hT = recipe.highlight + (sim.hi || 0);
    const sT = recipe.shadow + (sim.sh || 0);
    const black = sim.black || 0, white = sim.white || 0;
    for (let i = 0; i <= N; i++) {
      const x = i / N;
      let y = x - (c * Math.sin(2 * Math.PI * x)) / (2 * Math.PI);
      if (y > 0.5) y += hT * 0.03 * Math.sin(Math.PI * (y - 0.5) * 2);
      else y -= sT * 0.03 * Math.sin(Math.PI * y * 2);
      y = black + y * (1 - black - white);
      lut[i] = y < 0 ? 0 : y > 1 ? 1 : y;
    }
    return lut;
  }

  // ---------- dynamic range shoulder ----------
  // DR200/400 keep highlights that the exposure pushed past 1.0 (up to W)
  function drCompress(x, W) {
    const knee = 0.5;
    if (x <= knee) return x;
    const a = 1 - knee, m = (W - knee) / a, u = (x - knee) / a;
    const y = knee + a * (u / (1 + u)) * ((1 + m) / m);
    return y > 1 ? 1 : y;
  }

  // ---------- noise ----------
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gaussField(n, rnd) {
    const out = new Float32Array(n);
    for (let i = 0; i < n; i += 2) {
      const u = Math.max(1e-9, rnd()), v = rnd();
      const r = Math.sqrt(-2 * Math.log(u));
      out[i] = r * Math.cos(2 * Math.PI * v);
      if (i + 1 < n) out[i + 1] = r * Math.sin(2 * Math.PI * v);
    }
    return out;
  }
  function makeNoise(w, h, seed) {
    const n = w * h, rnd = mulberry32(seed || 1234);
    const large = boxBlur(gaussField(n, rnd), w, h, 1);
    for (let i = 0; i < n; i++) large[i] *= 2.6; // restore ~unit std after 3x3 blur
    return { w, h, luma: gaussField(n, rnd), cr: gaussField(n, rnd), cb: gaussField(n, rnd), grain: gaussField(n, rnd), grainL: large };
  }

  // separable box blur (sliding window), clamp-to-edge
  function boxBlur(src, w, h, r) {
    const tmp = new Float32Array(src.length), out = new Float32Array(src.length);
    const d = 2 * r + 1;
    for (let y = 0; y < h; y++) {
      const row = y * w;
      let acc = 0;
      for (let k = -r; k <= r; k++) acc += src[row + Math.min(w - 1, Math.max(0, k))];
      for (let x = 0; x < w; x++) {
        tmp[row + x] = acc / d;
        acc += src[row + Math.min(w - 1, x + r + 1)] - src[row + Math.max(0, x - r)];
      }
    }
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let k = -r; k <= r; k++) acc += tmp[Math.min(h - 1, Math.max(0, k)) * w + x];
      for (let y = 0; y < h; y++) {
        out[y * w + x] = acc / d;
        acc += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
      }
    }
    return out;
  }

  const smooth = (e0, e1, x) => {
    const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
    return t * t * (3 - 2 * t);
  };
  const angDiff = (a, b) => {
    let d = a - b;
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    return d;
  };

  // ---------- calibration LUTs ----------
  // Per-sim 3D LUTs (display sRGB -> display sRGB, .cube order: r fastest)
  // learned from PROVIA/sim JPEG pairs. When present they replace the
  // hand-tuned sim stage; recipe adjustments still apply on top.
  const LUT_SIZE = 17;
  const calibration = { enabled: true, luts: {} };
  function lut3d(lut, r, g, b, out) {
    const m = LUT_SIZE - 1;
    const fr = r * m, fg = g * m, fb = b * m;
    const r0 = Math.min(m - 1, fr | 0), g0 = Math.min(m - 1, fg | 0), b0 = Math.min(m - 1, fb | 0);
    const dr = fr - r0, dg = fg - g0, db = fb - b0;
    const S = LUT_SIZE, S2 = S * S;
    for (let c = 0; c < 3; c++) {
      const at = (ri, gi, bi) => lut[(ri + gi * S + bi * S2) * 3 + c];
      const c00 = at(r0, g0, b0) * (1 - dr) + at(r0 + 1, g0, b0) * dr;
      const c10 = at(r0, g0 + 1, b0) * (1 - dr) + at(r0 + 1, g0 + 1, b0) * dr;
      const c01 = at(r0, g0, b0 + 1) * (1 - dr) + at(r0 + 1, g0, b0 + 1) * dr;
      const c11 = at(r0, g0 + 1, b0 + 1) * (1 - dr) + at(r0 + 1, g0 + 1, b0 + 1) * dr;
      const v = (c00 * (1 - dg) + c10 * dg) * (1 - db) + (c01 * (1 - dg) + c11 * dg) * db;
      out[c] = v < 0 ? 0 : v > 1 ? 1 : v;
    }
  }
  const NEUTRAL_SIM = { contrast: 0, sat: 1 };

  /**
   * process(src, recipe, exposure, view, noise, opts) -> ImageData
   *  opts.noCalib: ignore calibration LUTs (use the hand-tuned model)
   *  src:      ImageData of the (downscaled or cropped) source
   *  exposure: { orig:{aperture,shutter,iso}, next:{aperture,shutter,iso}, ec }
   *  view:     { scale, offX, offY, fullW, fullH } — maps src pixels to full-res
   *  noise:    makeNoise(src.width, src.height)
   */
  function process(src, recipe, exposure, view, noise, opts) {
    recipe = effectiveRecipe(recipe);
    const w = src.width, h = src.height, n = w * h;
    const d = src.data;
    const baseSim = SIMS[recipe.sim] || SIMS.provia;
    const lut = !(opts && opts.noCalib) && calibration.enabled && !baseSim.mono ? calibration.luts[recipe.sim] : null;
    const sim = lut ? NEUTRAL_SIM : baseSim;
    const lo = [0, 0, 0];
    const tone = buildToneLUT(sim, recipe);
    const gains = wbGains(recipe);
    const expo = Math.pow(2, deltaEV(exposure.orig, exposure.next, exposure.ec));
    const vigDelta = vignetteAt(exposure.next.aperture) - vignetteAt(exposure.orig.aperture);
    const drW = recipe.dr === 400 ? 4 : recipe.dr === 200 ? 2 : 1;
    const sat = (sim.sat == null ? 1 : sim.sat) * (1 + 0.07 * recipe.color);
    const hues = sim.hues || [];
    const sT = sim.shadowTint || [0, 0], hTt = sim.highTint || [0, 0];
    const cce = [0, 1, 2][recipe.cce] || 0, fxb = [0, 1, 2][recipe.ccfxb] || 0;
    const filt = MONO_FILTERS[recipe.monoFilter] || MONO_FILTERS.std;
    const fs = filt[0] + filt[1] + filt[2];
    const tint = sim.tint || [recipe.monoMG * 0.004, recipe.monoWC * 0.004];
    const out = new Float32Array(n * 3);

    const cx = view.fullW / 2, cy = view.fullH / 2, rmax2 = cx * cx + cy * cy;

    for (let y = 0, i = 0; y < h; y++) {
      const fy = view.offY + y / view.scale - cy;
      for (let x = 0; x < w; x++, i++) {
        const p = i * 4;
        const fx = view.offX + x / view.scale - cx;
        const vig = 1 - vigDelta * ((fx * fx + fy * fy) / rmax2);
        const e = expo * vig;
        let r = SRGB_TO_LIN[d[p]] * gains[0] * e;
        let g = SRGB_TO_LIN[d[p + 1]] * gains[1] * e;
        let b = SRGB_TO_LIN[d[p + 2]] * gains[2] * e;

        if (drW > 1) { r = drCompress(r, drW); g = drCompress(g, drW); b = drCompress(b, drW); }

        let er = enc(r), eg = enc(g), eb = enc(b);
        if (lut) { lut3d(lut, er, eg, eb, lo); er = lo[0]; eg = lo[1]; eb = lo[2]; }
        r = dec(tone[(er * N + 0.5) | 0]);
        g = dec(tone[(eg * N + 0.5) | 0]);
        b = dec(tone[(eb * N + 0.5) | 0]);

        let L, A, B;
        if (sim.mono) {
          const Y = (r * filt[0] + g * filt[1] + b * filt[2]) / fs;
          L = Math.cbrt(Y); A = tint[0]; B = tint[1];
        } else {
          const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
          const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
          const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
          L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
          A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
          B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

          let C = Math.sqrt(A * A + B * B);
          let hue = Math.atan2(B, A) * 57.29577951;
          const cw = Math.min(1, C / 0.08); // neutrals are left alone by hue bands
          let dh = 0, cm = 1, dL = 0;
          for (let k = 0; k < hues.length; k++) {
            const hb = hues[k];
            const t = angDiff(hue, hb[0]) / hb[1];
            const wgt = Math.exp(-t * t) * cw;
            dh += wgt * hb[2]; cm *= 1 + wgt * (hb[3] - 1); dL += wgt * hb[4];
          }
          hue += dh;
          C *= cm * sat;

          const cs = Math.min(1, C / 0.2);
          if (cce) dL -= cce * cs * cs * 0.035 * (0.4 + L);
          if (fxb) {
            const tb = angDiff(hue, 258) / 35, wb = Math.exp(-tb * tb) * cs;
            dL -= fxb * wb * 0.04; C *= 1 + fxb * wb * 0.06;
          }
          L += dL;

          const hr = hue / 57.29577951;
          A = C * Math.cos(hr); B = C * Math.sin(hr);
          const sw = smooth(0.75, 0.2, L), hw = smooth(0.55, 0.95, L);
          A += sw * sT[0] + hw * hTt[0];
          B += sw * sT[1] + hw * hTt[1];
        }

        const l2 = L + 0.3963377774 * A + 0.2158037573 * B;
        const m2 = L - 0.1055613458 * A - 0.0638541728 * B;
        const s2 = L - 0.0894841775 * A - 1.291485548 * B;
        const l3 = l2 * l2 * l2, m3 = m2 * m2 * m2, s3 = s2 * s2 * s2;
        out[i * 3] = enc(4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3);
        out[i * 3 + 1] = enc(-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3);
        out[i * 3 + 2] = enc(-0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3);
      }
    }

    // ---------- spatial pass (luminance) ----------
    const Y0 = new Float32Array(n);
    for (let i = 0; i < n; i++) Y0[i] = 0.299 * out[i * 3] + 0.587 * out[i * 3 + 1] + 0.114 * out[i * 3 + 2];

    // effects defined in full-res pixels fade out when the preview is downscaled
    const s = Math.min(1, view.scale * 1.2);
    const isoRatio = exposure.next.iso / exposure.orig.iso;
    const nrF = 1 - 0.09 * recipe.nr;
    const noiseSig = isoRatio > 1 ? 0.02 * Math.sqrt(Math.log2(isoRatio)) * nrF * Math.min(1, view.scale * 1.6) : 0;
    let grainAmp = [0, 0.035, 0.06][recipe.grain] || 0;
    if (recipe.grainSize === 'large') grainAmp *= 1.25;
    if (sim.acrosGrain) grainAmp += Math.max(0, Math.min(1, Math.log2(exposure.next.iso / 160) / 5)) * 0.02;
    const grainField = recipe.grainSize === 'large' && view.scale >= 0.5 ? noise.grainL : noise.grain;
    const grainVis = Math.min(1, view.scale * (recipe.grainSize === 'large' ? 3 : 1.6));

    const sharpAmt = 0.2 * recipe.sharpness * s - 0.08 * recipe.nr * s;
    const blurS = sharpAmt !== 0 ? boxBlur(Y0, w, h, 1) : null;
    const R = Math.max(2, Math.round((view.fullW / 120) * view.scale));
    const blurL = recipe.clarity !== 0 ? boxBlur(boxBlur(Y0, w, h, R), w, h, R) : null;

    for (let i = 0; i < n; i++) {
      const y0 = Y0[i];
      let y = y0;
      if (blurS) y += sharpAmt * (y0 - blurS[i]);
      if (blurL) y += recipe.clarity * 0.06 * (y0 - blurL[i]) * (0.25 + 3 * y0 * (1 - y0));
      let cr = 0, cb = 0;
      if (noiseSig) {
        y += noise.luma[i] * noiseSig * (0.5 + (1 - y0));
        cr = noise.cr[i] * noiseSig * 0.5; cb = noise.cb[i] * noiseSig * 0.5;
      }
      if (grainAmp) y += grainField[i] * grainAmp * grainVis * (0.35 + 2.6 * y0 * (1 - y0));
      const dy = y - y0;
      out[i * 3] += dy + cr;
      out[i * 3 + 1] += dy - (cr + cb) * 0.5;
      out[i * 3 + 2] += dy + cb;
    }

    const img = new ImageData(w, h);
    const o = img.data;
    for (let i = 0; i < n; i++) {
      o[i * 4] = out[i * 3] * 255 + 0.5;
      o[i * 4 + 1] = out[i * 3 + 1] * 255 + 0.5;
      o[i * 4 + 2] = out[i * 3 + 2] * 255 + 0.5;
      o[i * 4 + 3] = 255;
    }
    return img;
  }

  // ---------- minimal EXIF reader (FNumber, ExposureTime, ISO, Model) ----------
  function readExif(buf) {
    const v = new DataView(buf);
    if (v.getUint16(0) !== 0xffd8) return null;
    let off = 2;
    while (off < v.byteLength - 4) {
      const marker = v.getUint16(off), len = v.getUint16(off + 2);
      if (marker === 0xffe1 && v.getUint32(off + 4) === 0x45786966) return parseTiff(v, off + 10);
      if ((marker & 0xff00) !== 0xff00) break;
      off += 2 + len;
    }
    return null;
  }
  function parseTiff(v, base) {
    const le = v.getUint16(base) === 0x4949;
    const u16 = (o) => v.getUint16(base + o, le), u32 = (o) => v.getUint32(base + o, le);
    const res = {};
    const readIFD = (o) => {
      const count = u16(o);
      for (let i = 0; i < count; i++) {
        const e = o + 2 + i * 12, tag = u16(e), type = u16(e + 2), vo = e + 8;
        const rational = () => { const p = u32(vo); return u32(p) / u32(p + 4); };
        if (tag === 0x8769) readIFD(u32(vo));
        else if (tag === 0x927c) readFujiMakerNote(v, base + u32(vo), res);
        else if (tag === 0x829d) res.aperture = rational();
        else if (tag === 0x829a) res.shutter = rational();
        else if (tag === 0x8827) res.iso = type === 3 ? u16(vo) : u32(vo);
        else if (tag === 0x0110) {
          const cnt = u32(e + 4), p = cnt > 4 ? u32(vo) : vo;
          let sOut = '';
          for (let k = 0; k < cnt - 1; k++) sOut += String.fromCharCode(v.getUint8(base + p + k));
          res.model = sOut.trim();
        }
      }
    };
    try { readIFD(u32(4)); } catch (e) { /* truncated EXIF: keep what we got */ }
    return res;
  }

  // Fujifilm MakerNote: "FUJIFILM" + LE offset to an IFD, offsets relative to the note
  const FUJI_FILM_MODES = {
    0x000: 'provia', 0x120: 'astia', 0x200: 'velvia', 0x400: 'velvia',
    0x500: 'proNegStd', 0x501: 'proNegHi', 0x600: 'classicChrome', 0x700: 'eterna',
    0x800: 'classicNeg', 0x900: 'bleachBypass', 0xa00: 'nostalgicNeg', 0xb00: 'realaAce',
  };
  function readFujiMakerNote(v, mn, res) {
    let sig = '';
    for (let k = 0; k < 8; k++) sig += String.fromCharCode(v.getUint8(mn + k));
    if (sig !== 'FUJIFILM') return;
    res.make = 'FUJIFILM';
    const ifd = mn + v.getUint32(mn + 8, true), count = v.getUint16(ifd, true);
    for (let i = 0; i < count; i++) {
      const e = ifd + 2 + i * 12;
      if (v.getUint16(e, true) === 0x1401) {
        const mode = v.getUint16(e + 8, true);
        res.filmModeRaw = mode;
        res.filmSim = FUJI_FILM_MODES[mode] || null;
      }
    }
  }

  global.FilmEngine = { effectiveRecipe, SIMS, MONO_FILTERS, DEFAULT_RECIPE, LUT_SIZE, calibration, process, makeNoise, readExif, deltaEV };
})(window);
