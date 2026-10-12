// Copiado de bozu-app/public/glass.js: el mismo vaso animado que ve el cliente en la app.
// Vaso animado de bozu. BozuGlass.mount(el, inicial?) -> { set(visual) }, BozuGlass.mini(visual, size) -> svg string
// Recipientes (visual.vessel): 'glass' (copa con hielo y pajita, por defecto), 'shot' (vaso de chupito),
// 'bottle' (botella de cristal de refresco) y 'water' (botella de agua).
(function () {
  const { hexToRgb, rgbToHex, mix } = window.BozuDrink;
  const TOP = 24;      // primera línea de líquido posible
  const BOTTOM = 186;  // fondo interior del vaso
  const SPAN = BOTTOM - TOP;
  const GLASS_PATH = 'M14 16 L106 16 L98 182 Q97 192 87 192 L33 192 Q23 192 22 182 Z';
  const SHOT_BASE = 'M23 170 L97 170 L97 184 Q97 192 87 192 L33 192 Q23 192 23 184 Z';
  // Botella de cristal de refresco: cuello, hombros y una cintura suave
  const BOTTLE_PATH = 'M51 16 L69 16 L69 46 C69 62 86 70 86 92 L86 112 C86 124 81 128 81 136 C81 144 85 150 85 162 L85 184 Q85 192 77 192 L43 192 Q35 192 35 184 L35 162 C35 150 39 144 39 136 C39 128 34 124 34 112 L34 92 C34 70 51 62 51 46 Z';
  const B_TOP = 24, B_BOTTOM = 190;
  // Botella de agua de plástico con tapón
  const WATER_PATH = 'M50 22 L70 22 L70 32 C70 42 90 48 90 66 L90 182 Q90 192 80 192 L40 192 Q30 192 30 182 L30 66 C30 48 50 42 50 32 Z';
  const W_TOP = 34, W_BOTTOM = 190;
  let uid = 0;

  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const vesselOf = (v) => v.vessel || 'glass';

  // Los hielos flotan en la superficie; con poco líquido descansan en el fondo.
  const iceShift = (y) => Math.min(y, BOTTOM - 40) - TOP - 2;

  // Cada recipiente es un grupo; se cambia de uno a otro con opacidad y escala (el chupito es el vaso encogido)
  function vesselStyle(v, which) {
    const ve = vesselOf(v);
    const on = which === 'glass' ? ve === 'glass' || ve === 'shot' : ve === which;
    const tf = which === 'glass' && ve === 'shot' ? 'scale(.54,.44)' : on ? 'none' : 'scale(.86)';
    return `transform-origin:60px 194px;transform:${tf};opacity:${on ? 1 : 0};transition:transform .7s cubic-bezier(.16,1,.3,1),opacity .4s`;
  }
  const strawOn = (v) => !!(v.level && !v.foam && vesselOf(v) === 'glass');

  function shapes(id, v) {
    const y = BOTTOM - v.level * SPAN;
    const yb = B_BOTTOM - v.level * (B_BOTTOM - B_TOP);
    const yw = W_BOTTOM - v.level * (W_BOTTOM - W_TOP);
    const op = v.clear ? 0.42 : 0.95;
    const surface = mix(v.color, '#ffffff', 0.25);
    const fade = 'transition:opacity .4s';
    return `
      <defs>
        <clipPath id="c${id}"><path d="${GLASS_PATH}"/></clipPath>
        <clipPath id="cb${id}"><path d="${BOTTLE_PATH}"/></clipPath>
        <clipPath id="cw${id}"><path d="${WATER_PATH}"/></clipPath>
        <linearGradient id="r${id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#e8eee4" stop-opacity=".35"/><stop offset="1" stop-color="#deff80" stop-opacity=".85"/>
        </linearGradient>
        <linearGradient id="h${id}" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".18" stop-color="#fff" stop-opacity=".22"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <g data-v="glass" style="${vesselStyle(v, 'glass')}">
        <path d="${GLASS_PATH}" fill="rgba(255,255,255,.035)"/>
        <g clip-path="url(#c${id})">
          <rect data-liq x="0" y="${y}" width="120" height="${BOTTOM + 10 - y}" fill="${v.color}" opacity="${op}"/>
          <ellipse data-surf cx="60" cy="${y}" rx="48" ry="4" fill="${surface}" opacity="${v.level ? op : 0}"/>
          <rect data-foam x="0" y="${y - 12}" width="120" height="14" rx="4" fill="#fffdf4" opacity="${v.foam && v.level ? 0.92 : 0}"/>
          <g data-ice opacity="${v.ice ? 1 : 0}" style="${fade}" transform="translate(0 ${iceShift(y)})">
            <rect x="30" y="${TOP + 6}" width="24" height="22" rx="5" transform="rotate(-12 42 ${TOP + 17})" fill="rgba(255,255,255,.2)" stroke="rgba(255,255,255,.55)"/>
            <rect x="56" y="${TOP + 2}" width="24" height="22" rx="5" transform="rotate(9 68 ${TOP + 13})" fill="rgba(255,255,255,.2)" stroke="rgba(255,255,255,.55)"/>
            <rect x="70" y="${TOP + 18}" width="20" height="19" rx="5" transform="rotate(-4 80 ${TOP + 27})" fill="rgba(255,255,255,.16)" stroke="rgba(255,255,255,.45)"/>
          </g>
          <g data-bub opacity="${v.carbonated && v.level ? 1 : 0}"></g>
          <rect x="0" y="0" width="120" height="200" fill="url(#h${id})"/>
        </g>
        <path data-base d="${SHOT_BASE}" fill="rgba(255,255,255,.2)" opacity="${vesselOf(v) === 'shot' ? 1 : 0}" style="${fade}"/>
        <line data-straw x1="74" y1="${Math.max(y + 30, 70)}" x2="96" y2="2" stroke="#d4ff3a" stroke-width="6" stroke-linecap="round" opacity="${strawOn(v) ? 1 : 0}" style="${fade}"/>
        <path d="${GLASS_PATH}" fill="none" stroke="url(#r${id})" stroke-width="2.4" vector-effect="non-scaling-stroke"/>
      </g>
      <g data-v="bottle" style="${vesselStyle(v, 'bottle')}">
        <path d="${BOTTLE_PATH}" fill="rgba(160,220,190,.07)"/>
        <g clip-path="url(#cb${id})">
          <rect data-bliq x="0" y="${yb}" width="120" height="${B_BOTTOM + 10 - yb}" fill="${v.color}" opacity="${op}"/>
          <rect x="0" y="0" width="120" height="200" fill="url(#h${id})"/>
        </g>
        <rect x="48" y="7" width="24" height="10" rx="2.5" fill="#c9ccd1"/>
        <path d="M50 17 L70 17" stroke="#8d9096" stroke-width="2"/>
        <path d="${BOTTLE_PATH}" fill="none" stroke="url(#r${id})" stroke-width="2.4"/>
      </g>
      <g data-v="water" style="${vesselStyle(v, 'water')}">
        <path d="${WATER_PATH}" fill="rgba(200,230,255,.08)"/>
        <g clip-path="url(#cw${id})">
          <rect data-wliq x="0" y="${yw}" width="120" height="${W_BOTTOM + 10 - yw}" fill="#bfe2ff" opacity=".38"/>
          <rect x="0" y="108" width="120" height="40" fill="#3aa0ff" opacity=".55"/>
          <path d="M30 80 L90 80 M30 90 L90 90 M30 166 L90 166 M30 176 L90 176" stroke="rgba(255,255,255,.22)" stroke-width="1.5"/>
          <rect x="0" y="0" width="120" height="200" fill="url(#h${id})"/>
        </g>
        <text x="60" y="133" text-anchor="middle" font-family="DM Sans, sans-serif" font-size="15" font-weight="700" fill="#fff" opacity=".9">agua</text>
        <rect x="46" y="4" width="28" height="15" rx="3.5" fill="#2f8cff"/>
        <path d="M46 10 L74 10" stroke="rgba(255,255,255,.35)" stroke-width="1.2"/>
        <path d="${WATER_PATH}" fill="none" stroke="url(#r${id})" stroke-width="2.4"/>
      </g>`;
  }

  function mount(el, initial) {
    const id = ++uid;
    let cur = { color: '#000000', level: 0, clear: false, carbonated: false, foam: false, ice: false, ...(initial || {}) };
    el.innerHTML = `<svg class="bozu-glass" viewBox="0 0 120 200" role="img" aria-label="Vaso">${shapes(id, cur)}</svg>`;
    const svg = el.firstElementChild;
    const $ = (s) => svg.querySelector(s);
    const bub = $('[data-bub]');
    // Burbujas que suben desde el fondo
    bub.innerHTML = Array.from({ length: 9 }, (_, i) => {
      const x = 28 + ((i * 37) % 64);
      const r = 1.4 + (i % 3) * 0.7;
      const dur = (1.6 + (i % 4) * 0.45).toFixed(2);
      return `<circle cx="${x}" cy="${BOTTOM}" r="${r}" fill="rgba(255,255,255,.75)">
        <animate attributeName="cy" from="${BOTTOM}" to="${TOP}" dur="${dur}s" begin="${(i * 0.23).toFixed(2)}s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0;.9;.9;0" dur="${dur}s" begin="${(i * 0.23).toFixed(2)}s" repeatCount="indefinite"/>
      </circle>`;
    }).join('');

    let raf;
    function draw(level, color, v) {
      const y = BOTTOM - level * SPAN;
      const op = v.clear ? 0.42 : 0.95;
      const liq = $('[data-liq]');
      liq.setAttribute('y', y);
      liq.setAttribute('height', BOTTOM + 10 - y);
      liq.setAttribute('fill', color);
      liq.setAttribute('opacity', op);
      const surf = $('[data-surf]');
      surf.setAttribute('cy', y);
      surf.setAttribute('fill', mix(color, '#ffffff', 0.25));
      surf.setAttribute('opacity', level > 0.01 ? op : 0);
      $('[data-foam]').setAttribute('y', y - 12);
      $('[data-ice]').setAttribute('transform', `translate(0 ${iceShift(y)})`);
      bub.querySelectorAll('animate[attributeName="cy"]').forEach((a) => a.setAttribute('to', y + 4));
      $('[data-straw]').setAttribute('y1', Math.max(y + 30, 70));
      const yb = B_BOTTOM - level * (B_BOTTOM - B_TOP);
      const bl = $('[data-bliq]');
      bl.setAttribute('y', yb); bl.setAttribute('height', B_BOTTOM + 10 - yb); bl.setAttribute('fill', color); bl.setAttribute('opacity', op);
      const yw = W_BOTTOM - level * (W_BOTTOM - W_TOP);
      const wl = $('[data-wliq]');
      wl.setAttribute('y', yw); wl.setAttribute('height', W_BOTTOM + 10 - yw);
    }

    // Lo que se ve ahora mismo (puede estar a medio llenar)
    let shown = { level: cur.level, color: cur.color };
    function set(v) {
      // Misma copa: no se reinicia el llenado que ya está en marcha
      if (['color', 'level', 'clear', 'carbonated', 'foam', 'ice', 'vessel'].every((k) => cur[k] === v[k])) return;
      cancelAnimationFrame(raf);
      // Cambio de recipiente: el vaso se encoge en chupito, o se cambia por una botella
      if (vesselOf(v) !== vesselOf(cur)) for (const g of svg.querySelectorAll('[data-v]')) g.setAttribute('style', vesselStyle(v, g.dataset.v));
      const from = { ...cur, level: shown.level, color: shown.color };
      const fromRgb = hexToRgb(from.level ? from.color : v.color);
      const toRgb = hexToRgb(v.color);
      const t0 = performance.now();
      const dur = 750;
      $('[data-ice]').setAttribute('opacity', v.ice ? 1 : 0);
      $('[data-bub]').setAttribute('opacity', v.carbonated && v.level ? 1 : 0);
      $('[data-foam]').setAttribute('opacity', v.foam && v.level ? 0.92 : 0);
      $('[data-straw]').setAttribute('opacity', strawOn(v) ? 1 : 0);
      $('[data-base]').setAttribute('opacity', vesselOf(v) === 'shot' ? 1 : 0);
      const step = (now) => {
        const t = Math.min(1, (now - t0) / dur);
        const e = easeOut(t);
        const level = from.level + (v.level - from.level) * e;
        const color = rgbToHex(fromRgb.map((c, i) => c + (toRgb[i] - c) * e));
        shown = { level, color };
        draw(level, color, t < 0.5 ? (from.level ? from : v) : v);
        if (t < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
      cur = { ...v };
    }

    return { set, el: svg };
  }

  function mini(v, size = 34) {
    const id = 'm' + ++uid;
    return `<svg class="bozu-glass mini" viewBox="0 0 120 200" width="${size * 0.6}" height="${size}" aria-hidden="true">${shapes(id, v)}</svg>`;
  }

  window.BozuGlass = { mount, mini };
})();
