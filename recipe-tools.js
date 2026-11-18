/*
 * Recipe tools: parse pasted recipe text, analyse a recipe's look,
 * score it against shooting scenarios, name it, and build lineups.
 *
 * Naming system:  <SIM>-<Temp><Contrast> <Descriptor>
 *   SIM       short film-sim code (CN = Classic Neg., CC = Classic Chrome …)
 *   Temp      W warm · N neutral · C cool        (from WB, WB shift and the sim)
 *   Contrast  S soft · M medium · H hard         (from sim curve, H/S tone, DR, clarity)
 *   Descriptor 1–3 words, by default from the recipe's original name
 *   e.g. "CN-WH Portra 400", "CC-NM Street", "ACR-NH Gritty"
 * Codes sort by sim in the camera's custom slots and fit Fuji's slot-name length.
 */
(function (global) {
  'use strict';
  const FE = global.FilmEngine;

  const SIM_CODES = {
    provia: 'PRV', velvia: 'VEL', astia: 'AST', classicChrome: 'CC', realaAce: 'RA',
    proNegHi: 'NHi', proNegStd: 'NSt', classicNeg: 'CN', nostalgicNeg: 'NN',
    eterna: 'ET', bleachBypass: 'EBB', acros: 'ACR', monochrome: 'MON', sepia: 'SEP',
  };
  // how warm each sim renders relative to PROVIA, in "WB steps"
  const SIM_WARMTH = { nostalgicNeg: 1, classicNeg: 0.3, astia: 0.2, eterna: -0.5, bleachBypass: -0.3 };

  // ---------------- parsing ----------------
  const SIM_PATTERNS = [
    [/bleach/i, 'bleachBypass'], [/eterna|cinema/i, 'eterna'], [/nostalgic/i, 'nostalgicNeg'],
    [/classic\s*neg/i, 'classicNeg'], [/classic\s*chrome/i, 'classicChrome'], [/reala/i, 'realaAce'],
    [/pro\s*neg\.?\s*hi/i, 'proNegHi'], [/pro\s*neg\.?\s*(std|standard)/i, 'proNegStd'],
    [/acros/i, 'acros'], [/sepia/i, 'sepia'], [/monochrome|b\s*&\s*w|black\s*(&|and)\s*white/i, 'monochrome'],
    [/velvia|vivid/i, 'velvia'], [/astia|soft/i, 'astia'], [/provia|standard/i, 'provia'],
  ];
  const KEY_RE = new RegExp('^\\s*[-•*·]?\\s*(' + [
    'film\\s*simulation', 'film\\s*sim', 'simulation',
    'grain\\s*effect', 'grain\\s*size', 'grain',
    'colou?r\\s*chrome\\s*(?:fx|effect)\\s*blue', 'cc\\s*fx\\s*blue', 'fx\\s*blue',
    'colou?r\\s*chrome(?:\\s*effect)?', 'cc\\s*effect',
    'white\\s*balance', 'wb\\s*shift', 'wb',
    'dynamic\\s*range', 'd[-\\s]?range\\s*priority', 'dr',
    'tone\\s*curve', 'highlights?(?:\\s*tone)?', 'shadows?(?:\\s*tone)?',
    'monochromatic\\s*colou?r', 'toning', 'filter',
    'colou?r', 'saturation', 'sharpness', 'sharpening',
    'high\\s*iso\\s*nr', 'noise\\s*reduction', 'nr', 'clarity',
    'iso', 'exposure\\s*compensation', 'exposure\\s*comp', 'ev',
  ].join('|') + ')\\b\\s*(?:[:=]|[\\-–](?!\\s*\\d))?\\s*(.*)$', 'i');

  const num = (s) => {
    const m = String(s).replace(/[−–]/g, '-').replace(/½/g, '.5').match(/[+-]?\d+(?:\.\d+)?/);
    return m ? parseFloat(m[0]) : null;
  };
  const clampStep = (v, lo, hi, step) => Math.max(lo, Math.min(hi, Math.round(v / step) * step));
  const level = (s) => (/strong|high/i.test(s) ? 2 : /weak|low/i.test(s) ? 1 : 0);

  function parseWB(val, r, warn) {
    const k = val.match(/(\d{4,5})\s*k/i);
    if (k) { r.wb = 'kelvin'; r.kelvin = clampStep(+k[1], 2500, 10000, 100); }
    else if (/day\s*light|fine|sunny/i.test(val)) r.wb = 'daylight';
    else if (/cloud/i.test(val)) r.wb = 'cloudy';
    else if (/shade/i.test(val)) r.wb = 'shade';
    else if (/incandescent|tungsten/i.test(val)) r.wb = 'incandescent';
    else if (/fluor/i.test(val)) r.wb = 'fluorescent';
    else if (/auto|awb|ambien|white\s*priority/i.test(val)) r.wb = 'asShot';
    else if (/underwater/i.test(val)) { r.wb = 'asShot'; warn.push('Underwater WB treated as Auto'); }
    const rs = val.match(/\b(?:red|r)\s*:?\s*([+\-−]?\d+)/i) || val.match(/([+\-−]?\d+)\s*(?:red|r)\b/i);
    const bs = val.match(/\b(?:blue|b)\s*:?\s*([+\-−]?\d+)/i) || val.match(/([+\-−]?\d+)\s*(?:blue|b)\b/i);
    if (rs) r.wbR = clampStep(num(rs[1]), -9, 9, 1);
    if (bs) r.wbB = clampStep(num(bs[1]), -9, 9, 1);
  }

  function applyKey(key, val, rec, ctx) {
    const r = rec.recipe;
    key = key.toLowerCase().replace(/\s+/g, ' ');
    if (/^(film sim|simulation)/.test(key)) {
      const hit = SIM_PATTERNS.find(([re]) => re.test(val));
      if (!hit) { ctx.warn.push(`Unknown film simulation "${val}"`); return; }
      r.sim = hit[1];
      const f = val.match(/\+\s*(ye|y|r|g)\b|\b(yellow|red|green)\b/i);
      if (f) r.monoFilter = { ye: 'ye', y: 'ye', yellow: 'ye', r: 'r', red: 'r', g: 'g', green: 'g' }[(f[1] || f[2]).toLowerCase()];
      ctx.hasSim = true;
    } else if (key === 'filter') {
      const f = val.match(/\b(ye|yellow|y|r|red|g|green)\b/i);
      if (f) r.monoFilter = { ye: 'ye', y: 'ye', yellow: 'ye', r: 'r', red: 'r', g: 'g', green: 'g' }[f[1].toLowerCase()];
    } else if (/^grain size/.test(key)) {
      r.grainSize = /large/i.test(val) ? 'large' : 'small';
    } else if (/^grain/.test(key)) {
      r.grain = level(val);
      r.grainSize = /large/i.test(val) ? 'large' : 'small';
    } else if (/blue/.test(key)) {
      r.ccfxb = level(val);
    } else if (/chrome|cc effect/.test(key)) {
      r.cce = level(val);
    } else if (/^(white balance|wb)/.test(key)) {
      parseWB(val, r, ctx.warn);
    } else if (/^d[- ]?range priority/.test(key)) {
      r.drp = /strong/i.test(val) ? 'strong' : /weak/i.test(val) ? 'weak' : /auto/i.test(val) ? 'auto' : 'off';
    } else if (/^(dynamic range|dr)$/.test(key)) {
      r.dr = /400/.test(val) ? 400 : /200/.test(val) ? 200 : /100/.test(val) ? 100 : 200;
      if (/auto/i.test(val)) ctx.warn.push('DR-Auto approximated as DR200');
    } else if (key === 'tone curve') {
      const h = val.match(/\bh\w*\s*:?\s*([+\-−]?\d(?:\.5)?)/i) || val.match(/([+\-−]?\d(?:\.5)?)\s*h\b/i);
      const s = val.match(/\bs\w*\s*:?\s*([+\-−]?\d(?:\.5)?)/i) || val.match(/([+\-−]?\d(?:\.5)?)\s*s\b/i);
      if (h) r.highlight = clampStep(num(h[1]), -2, 4, 0.5);
      if (s) r.shadow = clampStep(num(s[1]), -2, 4, 0.5);
    } else if (/^highlight/.test(key)) {
      if (num(val) != null) r.highlight = clampStep(num(val), -2, 4, 0.5);
    } else if (/^shadow/.test(key)) {
      if (num(val) != null) r.shadow = clampStep(num(val), -2, 4, 0.5);
    } else if (/^(monochromatic|toning)/.test(key)) {
      const wc = val.match(/wc\s*:?\s*([+\-−]?\d+)/i) || val.match(/([+\-−]?\d+)\s*wc/i);
      const mg = val.match(/mg\s*:?\s*([+\-−]?\d+)/i) || val.match(/([+\-−]?\d+)\s*mg/i);
      if (wc) r.monoWC = clampStep(num(wc[1]), -9, 9, 1);
      if (mg) r.monoMG = clampStep(num(mg[1]), -9, 9, 1);
    } else if (/^(colou?r|saturation)$/.test(key)) {
      if (num(val) != null) r.color = clampStep(num(val), -4, 4, 1);
    } else if (/^sharp/.test(key)) {
      if (num(val) != null) r.sharpness = clampStep(num(val), -4, 4, 1);
    } else if (/^(high iso nr|noise reduction|nr)$/.test(key)) {
      if (num(val) != null) r.nr = clampStep(num(val), -4, 4, 1);
    } else if (key === 'clarity') {
      if (num(val) != null) r.clarity = clampStep(num(val), -5, 5, 1);
    } else if (key === 'iso' || /^(exposure|ev)/.test(key)) {
      ctx.shoot.push(`${key === 'iso' ? 'ISO' : 'Exposure comp.'}: ${val}`);
    }
  }

  /** parse(text) -> [{ aka, source, recipe, shoot:[], warnings:[] }] */
  function parse(text) {
    const lines = text
      .replace(/\r/g, '')
      // split run-on lines like "Highlight: -1, Shadow: +1" or "Color +2 | Sharpness -2"
      .replace(/\s*[|;]\s*/g, '\n')
      .replace(/,\s*(?=(shadows?|highlights?|colou?r|sharpness|clarity|high iso|grain|dynamic range|white balance)\b)/gi, '\n')
      .split('\n').map((l) => l.trim().replace(/^([-•*·]?\s*)DR\s*-?\s*(100|200|400|auto)\b/i, '$1Dynamic Range: DR$2'));
    const blocks = [];
    let cur = null;
    const fresh = () => ({ aka: '', source: '', recipe: { ...FE.DEFAULT_RECIPE }, shoot: [], warnings: [], _ctx: { hasSim: false } });
    for (const line of lines) {
      if (!line) continue;
      const url = line.match(/https?:\/\/\S+/);
      const m = line.match(KEY_RE);
      const isSimLine = m && /^(film\s*sim|simulation)/i.test(m[1]);
      const isOtherKV = !m && /^[\w\s.\-/()]{1,30}:\s*\S/.test(line); // e.g. "Camera: X-T5"
      const isTitle = !m && !isOtherKV && !url;
      if (!cur || (cur._ctx.hasSim && (isTitle || isSimLine))) { if (cur) blocks.push(cur); cur = fresh(); }
      if (url) { cur.source = url[0]; continue; }
      if (m) {
        const ctx = { warn: cur.warnings, shoot: cur.shoot, hasSim: cur._ctx.hasSim };
        applyKey(m[1], m[2], cur, ctx);
        cur._ctx.hasSim = ctx.hasSim;
      } else if (isTitle && !cur.aka && line.length <= 70) {
        cur.aka = line.replace(/^#+\s*|[*_]+/g, '').replace(/\s*(film\s*)?recipe\s*:?\s*$/i, '').trim();
      } else if (isOtherKV) {
        cur.warnings.push(`Skipped "${line.slice(0, 50)}"`);
      }
    }
    if (cur) blocks.push(cur);
    return blocks.map((b) => {
      if (!b._ctx.hasSim) b.warnings.unshift('No film simulation found, so this one will be skipped');
      b.valid = b._ctx.hasSim;
      delete b._ctx;
      return b;
    });
  }

  // ---------------- analysis ----------------
  const WB_WARMTH = { asShot: 0, daylight: 0, cloudy: 1, shade: 2, fluorescent: -1, incandescent: -3 };
  function analyze(r) {
    r = FE.effectiveRecipe(r);
    const sim = FE.SIMS[r.sim];
    const mono = !!sim.mono;
    let warm = (r.wb === 'kelvin' ? (r.kelvin - 5500) / 1000 : WB_WARMTH[r.wb] || 0) + (r.wbR - r.wbB) * 0.25 + (SIM_WARMTH[r.sim] || 0);
    if (mono) warm = r.sim === 'sepia' ? 2 : r.monoWC * 0.3;
    const contrast = (sim.contrast || 0) * 8 + (r.highlight + r.shadow) * 0.5 + ((sim.hi || 0) + (sim.sh || 0)) * 0.3 -
      (r.dr === 400 ? 0.7 : r.dr === 200 ? 0.35 : 0) + r.clarity * 0.15;
    const sat = mono ? -10 : ((sim.sat == null ? 1 : sim.sat) - 1) * 10 + r.color;
    return {
      mono, warm, contrast, sat,
      temp: warm >= 1 ? 'W' : warm <= -1 ? 'C' : 'N',
      tone: contrast >= 1.2 ? 'H' : contrast <= -0.5 ? 'S' : 'M',
      soft: r.highlight <= 0 && r.dr >= 200,
      grainy: r.grain > 0,
    };
  }

  // ---------------- scenario fit ----------------
  const near = (x, target, width) => Math.max(0, 1 - Math.abs(x - target) / width);
  const inSims = (r, list) => (list.includes(r.sim) ? 1 : 0);
  const RULES = {
    'Beach': (r, a) => inSims(r, ['classicNeg', 'nostalgicNeg', 'astia', 'provia', 'realaAce', 'proNegHi', 'classicChrome']) +
      near(a.warm, 1.2, 1.8) + (a.soft ? 0.6 : -0.3) + near(a.sat, 1, 4) * 0.5 + (r.ccfxb ? 0.3 : 0) - (a.mono ? 3 : 0),
    'Sunny Day': (r, a) => 0.5 + inSims(r, ['classicChrome', 'classicNeg', 'provia', 'realaAce', 'velvia', 'proNegHi']) * 0.7 +
      (a.soft ? 0.8 : -0.2) + near(a.warm, 0.5, 2) * 0.5 + near(a.contrast, 0.6, 2) * 0.4 - (a.mono ? 1 : 0),
    'Overcast': (r, a) => inSims(r, ['classicChrome', 'classicNeg', 'velvia', 'nostalgicNeg', 'acros']) +
      (a.contrast >= 0.8 ? 0.8 : 0) + (a.warm >= 0.5 ? 0.5 : 0) + (a.sat >= 0 || a.mono ? 0.3 : -0.2) + (r.clarity > 0 ? 0.2 : 0),
    'Rainy Day': (r, a) => inSims(r, ['eterna', 'classicChrome', 'bleachBypass', 'acros', 'monochrome', 'classicNeg']) +
      near(a.warm, -1, 2) * 0.8 + (a.sat <= 0 ? 0.5 : -0.3) + (a.grainy ? 0.3 : 0) + (a.mono ? 0.5 : 0),
    'Mountains': (r, a) => inSims(r, ['velvia', 'provia', 'realaAce', 'classicChrome', 'acros']) +
      (r.ccfxb ? 0.6 : 0) + near(a.warm, 0, 1.5) * 0.6 + (r.clarity > 0 ? 0.3 : 0) + (r.dr >= 200 ? 0.3 : 0) + (a.contrast > 0 ? 0.3 : 0),
    'Greenery': (r, a) => inSims(r, ['velvia', 'astia', 'provia', 'realaAce', 'proNegHi', 'classicNeg']) +
      near(a.warm, 0.3, 1.5) * 0.6 + (a.sat >= 0 ? 0.6 : -0.3) + (r.cce ? 0.3 : 0) - (a.mono ? 3 : 0),
    'Golden Hour': (r, a) => inSims(r, ['nostalgicNeg', 'classicNeg', 'proNegHi', 'astia', 'classicChrome']) +
      near(a.warm, 2, 2) * 1.2 + (a.soft ? 0.5 : 0) + (a.sat >= 0 ? 0.2 : 0) - (a.mono ? 3 : 0),
    'Night / City': (r, a) => inSims(r, ['classicChrome', 'classicNeg', 'eterna', 'bleachBypass', 'acros', 'nostalgicNeg']) +
      (a.contrast >= 0.8 ? 0.6 : 0) + (a.grainy ? 0.4 : 0) + (r.wb === 'incandescent' || r.wb === 'fluorescent' || a.warm < -0.5 ? 0.4 : 0) + (a.mono ? 0.3 : 0),
    'Snow': (r, a) => inSims(r, ['provia', 'classicChrome', 'realaAce', 'acros', 'eterna', 'proNegStd']) +
      near(a.warm, -0.3, 1.2) * 0.8 + (a.soft ? 0.6 : -0.4) + (r.highlight < 0 ? 0.3 : 0),
    'Portrait': (r, a) => inSims(r, ['astia', 'proNegHi', 'proNegStd', 'nostalgicNeg', 'realaAce', 'classicNeg', 'acros']) +
      near(a.contrast, 0, 1.5) * 0.7 + (r.sharpness <= 0 ? 0.3 : -0.2) + (r.clarity <= 0 ? 0.3 : -0.3) + near(a.warm, 0.8, 2) * 0.4,
    'Indoor': (r, a) => inSims(r, ['nostalgicNeg', 'classicNeg', 'proNegStd', 'eterna', 'classicChrome', 'acros']) +
      (a.warm >= 0 ? 0.4 : 0) + (r.dr >= 200 ? 0.3 : 0) + (r.nr <= 0 ? 0.2 : 0) + (a.grainy ? 0.2 : 0),
  };
  function scoreScenarios(recipe) {
    recipe = FE.effectiveRecipe(recipe);
    const a = analyze(recipe), out = {};
    for (const s in RULES) out[s] = +RULES[s](recipe, a).toFixed(2);
    return out;
  }
  // top scenarios that fit well (max 3, always at least the best one)
  function suggestScenarios(recipe, allowed) {
    const sc = scoreScenarios(recipe);
    const ranked = Object.entries(sc).filter(([s]) => !allowed || allowed.includes(s)).sort((x, y) => y[1] - x[1]);
    const picks = ranked.filter(([, v], i) => i === 0 || v >= 2.0).slice(0, 3);
    return picks.map(([s]) => s);
  }

  // ---------------- naming ----------------
  const NOISE_WORDS = /\b(fuji(film)?|x[- ]?(trans|t\d+|e\d+|s\d+|pro\d*|100\w*)|recipe|film\s*simulation|simulation|settings?|v\d|version)\b/gi;
  function descriptorFrom(aka, scenarios) {
    let d = (aka || '').replace(NOISE_WORDS, ' ').replace(/[^\w\s'&.+-]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!d && scenarios && scenarios[0]) d = scenarios[0].split(' / ')[0];
    if (!d) d = 'Untitled';
    const words = d.split(' ');
    let out = '';
    for (const w of words) { if ((out + ' ' + w).trim().length > 16) break; out = (out + ' ' + w).trim(); }
    return out || words[0].slice(0, 16);
  }
  function codeFor(recipe) {
    const a = analyze(recipe);
    return `${SIM_CODES[recipe.sim]}-${a.temp}${a.tone}`;
  }
  function makeName(recipe, aka, scenarios, existing) {
    const base = `${codeFor(recipe)} ${descriptorFrom(aka, scenarios)}`;
    let name = base, i = 2;
    const taken = new Set((existing || []).map((n) => n.toLowerCase()));
    while (taken.has(name.toLowerCase())) name = `${base} ${i++}`;
    return name;
  }

  // ---------------- lineups ----------------
  /**
   * buildLineups(recipes, scenarios, current, mode) -> { [scenario]: ids[8] }
   * mode 'fill' keeps assigned slots and fills empty ones; 'rebuild' starts fresh.
   * Picks best-fitting recipes while spreading across film sims so a lineup
   * gives 8 genuinely different looks.
   */
  function buildLineups(recipes, scenarios, current, mode, slots) {
    slots = slots || 8;
    const scored = recipes.map((r) => ({ r, sc: scoreScenarios(r.recipe) }));
    const out = {};
    for (const s of scenarios) {
      if (!RULES[s]) { out[s] = current[s] || new Array(slots).fill(null); continue; }
      const lineup = mode === 'rebuild' ? new Array(slots).fill(null) : (current[s] || []).slice(0, slots);
      while (lineup.length < slots) lineup.push(null);
      const used = new Set(lineup.filter(Boolean));
      const simCount = {};
      lineup.forEach((id) => { const e = recipes.find((x) => x.id === id); if (e) simCount[e.recipe.sim] = (simCount[e.recipe.sim] || 0) + 1; });
      const pool = scored.filter(({ r }) => !used.has(r.id));
      for (let i = 0; i < slots; i++) {
        if (lineup[i]) continue;
        let best = null, bestV = -Infinity;
        for (const p of pool) {
          if (used.has(p.r.id)) continue;
          const tagged = p.r.scenarios.includes(s) ? 0.8 : 0;
          const v = p.sc[s] + tagged - (simCount[p.r.recipe.sim] || 0) * 0.6;
          if (v > bestV) { bestV = v; best = p; }
        }
        if (!best || best.sc[s] + (best.r.scenarios.includes(s) ? 0.8 : 0) < 1.5) break; // leave slots empty rather than add poor fits
        lineup[i] = best.r.id;
        used.add(best.r.id);
        simCount[best.r.recipe.sim] = (simCount[best.r.recipe.sim] || 0) + 1;
      }
      out[s] = lineup;
    }
    return out;
  }

  // what each body offers in its menus
  const CAMERAS = {
    'X-T30 II': {
      slots: 7,
      sims: ['provia', 'velvia', 'astia', 'classicChrome', 'proNegHi', 'proNegStd', 'classicNeg', 'eterna', 'bleachBypass', 'acros', 'monochrome', 'sepia'],
    },
  };

  global.RecipeTools = { CAMERAS, SIM_CODES, parse, analyze, scoreScenarios, suggestScenarios, makeName, codeFor, descriptorFrom, buildLineups, RULES };
})(window);
