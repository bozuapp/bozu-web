// Copiado de bozu-app/public/drink.js: mismo modelo de copa que la app.
// Modelo visual de una copa (lo usan la app, el panel y el servidor para el wrap).
// visual = { color, level (0..1), clear, carbonated, foam, ice }
(function (root) {
  const TYPES = {
    ron: { label: 'Ron', color: '#a8541a' },
    ginebra: { label: 'Ginebra', color: '#e3efe9' },
    whisky: { label: 'Whisky', color: '#b4671f' },
    vodka: { label: 'Vodka', color: '#e8eff5' },
    tequila: { label: 'Tequila', color: '#dcb04a' },
  };

  const hexToRgb = (hex) => {
    const h = String(hex || '#000000').replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const rgbToHex = (rgb) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  // t = peso de b (0 = todo a, 1 = todo b)
  const mix = (a, b, t) => rgbToHex(hexToRgb(a).map((v, i) => v + (hexToRgb(b)[i] - v) * t));
  const luminance = (hex) => {
    const [r, g, b] = hexToRgb(hex);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  };
  const isClear = (hex) => luminance(hex) > 0.8;

  function spiritColor(spirit) {
    return spirit.color || (TYPES[spirit.type] || {}).color || '#c08040';
  }

  // vessel: 'glass' (copa), 'shot' (vaso de chupito), 'bottle' (botella de refresco), 'water' (botella de agua)
  function visual({ spirit, mixer, other } = {}) {
    if (other) {
      const kind = other.kind || 'soft';
      if (kind === 'shot') return { color: other.color, level: 0.72, clear: isClear(other.color), carbonated: false, foam: false, ice: false, vessel: 'shot' };
      if (kind === 'water') return { color: '#cfe9ff', level: 0.88, clear: true, carbonated: false, foam: false, ice: false, vessel: 'water' };
      if (kind === 'soft') {
        // Refresco en botella de cristal, del color del que se elige (Coca-Cola, Sprite…)
        const c = mixer ? mixer.color : other.color;
        return { color: c, level: 0.84, clear: isClear(c), carbonated: true, foam: false, ice: false, vessel: 'bottle' };
      }
      return { color: other.color, level: 0.9, clear: isClear(other.color), carbonated: true, foam: true, ice: false };
    }
    if (!spirit) return { color: '#000000', level: 0, clear: false, carbonated: false, foam: false, ice: false };
    const sc = spiritColor(spirit);
    if (!mixer) return { color: sc, level: 0.33, clear: isClear(sc), carbonated: false, foam: false, ice: true };
    // El refresco manda en el color; el alcohol lo tiñe un poco (más si el refresco es transparente).
    const color = mix(mixer.color, sc, isClear(mixer.color) ? 0.4 : luminance(mixer.color) < 0.15 ? 0.05 : 0.15);
    return { color, level: 0.86, clear: isClear(color), carbonated: !!mixer.carbonated, foam: false, ice: true };
  }

  const api = { TYPES, visual, mix, isClear, hexToRgb, rgbToHex, spiritColor };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BozuDrink = api;
})(this);
