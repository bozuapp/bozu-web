/* =========================================================
   bozu · web para negocios
   Edita aquí tus datos de contacto:
   ========================================================= */
const BOZU_CONTACT = {
  email: "we@bozu.es",
  agenda: "https://calendar.app.google/x6Lcu49jH8pyxN4E9", // reserva de llamada (Google Calendar)
  whatsapp: "34689504331",          // con prefijo de país, sin + ni espacios
  asunto: "Quiero una demo gratuita de bozu",
};

(() => {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const fmt = (n, d = 0) => n.toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d });

  /* ---------- contacto ---------- */
  const mail = `mailto:${BOZU_CONTACT.email}?subject=${encodeURIComponent(BOZU_CONTACT.asunto)}`;
  const wa = `https://wa.me/${BOZU_CONTACT.whatsapp}?text=${encodeURIComponent("Hola, " + BOZU_CONTACT.asunto.toLowerCase() + ".")}`;
  document.querySelectorAll(".js-mail").forEach((a) => (a.href = mail));
  document.querySelectorAll(".js-agenda").forEach((a) => { a.href = BOZU_CONTACT.agenda; a.target = "_blank"; a.rel = "noopener"; });
  document.querySelectorAll(".js-wa").forEach((a) => { a.href = wa; a.target = "_blank"; a.rel = "noopener"; });
  document.querySelectorAll(".js-mail-text").forEach((a) => { a.href = mail; a.textContent = BOZU_CONTACT.email; });

  /* ---------- progreso de scroll de una sección ---------- */
  const progressOf = (el) => {
    const r = el.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    return total > 0 ? clamp(-r.top / total) : 0;
  };

  /* ---------- hero: holograma que sigue al ratón ---------- */
  const holo = document.getElementById("holo");
  if (holo && !reduce && window.matchMedia("(pointer: fine)").matches) {
    window.addEventListener("pointermove", (e) => {
      const x = e.clientX / window.innerWidth - 0.5, y = e.clientY / window.innerHeight - 0.5;
      holo.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 8}deg)`;
    }, { passive: true });
  }
  const heroBtn = document.getElementById("heroBtn");
  if (heroBtn && !reduce) {
    setInterval(() => {
      heroBtn.classList.add("done"); heroBtn.textContent = "✓ Pedido confirmado";
      setTimeout(() => { heroBtn.classList.remove("done"); heroBtn.textContent = "Pagar la ronda"; }, 1800);
    }, 4200);
  }

  /* =========================================================
     ESCENA DEL CLUB (canvas, vista cenital en cristal)
     ========================================================= */
  const club = document.getElementById("club");
  const cv = document.getElementById("clubCanvas");
  const caps = [...document.querySelectorAll(".club-captions .cap")];
  const bar = document.querySelector(".club-progress i");
  const ctx = cv.getContext("2d");
  const LIME = "212,255,58", RIM = "222,255,128", WH = "232,238,228";
  let dpr = 1, vw = 0, vh = 0;

  // generador determinista
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  const DOOR = { x: -40, y: 540 };
  const FLOOR = { x: 560, y: 390, w: 480, h: 320 };
  const TABLES = [[230, 330], [1370, 330], [230, 760], [1370, 760]];
  const crowd = [];
  for (let i = 0; i < 26; i++) {
    const bx = 470 + rnd() * 660, by = 205 + rnd() * 230;
    const leaver = i % 3 === 0;
    crowd.push({
      bx, by, leaver, ph: rnd() * 6.28,
      fx: FLOOR.x + 40 + rnd() * (FLOOR.w - 80), fy: FLOOR.y + 40 + rnd() * (FLOOR.h - 80),
      delay: rnd(),
    });
  }
  const dancers = Array.from({ length: 7 }, () => ({ x: FLOOR.x + 50 + rnd() * (FLOOR.w - 100), y: FLOOR.y + 50 + rnd() * (FLOOR.h - 100), ph: rnd() * 6.28 }));
  const tablePeople = [];
  TABLES.forEach(([tx, ty]) => {
    for (let k = 0; k < 4; k++) {
      const a = Math.PI / 4 + k * Math.PI / 2;
      tablePeople.push({ x: tx + 96 * Math.cos(a), y: ty + 96 * Math.sin(a), tx, ty, ph: rnd() * 6.28 });
    }
  });

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    vw = cv.clientWidth; vh = cv.clientHeight;
    cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr);
  }

  function rrPath(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function glass(rim, a, lw = 2, glow = true) {
    ctx.fillStyle = `rgba(6,7,5,${0.92 * a})`; ctx.fill();
    if (glow) { ctx.globalCompositeOperation = "lighter"; ctx.strokeStyle = `rgba(${rim},${0.16 * a})`; ctx.lineWidth = lw * 4; ctx.stroke(); ctx.globalCompositeOperation = "source-over"; }
    ctx.strokeStyle = `rgba(${rim},${0.95 * a})`; ctx.lineWidth = lw; ctx.stroke();
  }
  function person(x, y, th, s, rim, a, armF = 0.6) {
    if (a <= 0.01) return;
    ctx.save(); ctx.translate(x, y); ctx.rotate(th); ctx.scale(s, s);
    ctx.lineCap = "round";
    const af = 34 * armF;
    for (const sx of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(33 * sx, -6); ctx.lineTo(27 * sx, -6 - af);
      ctx.strokeStyle = `rgba(${rim},${0.85 * a})`; ctx.lineWidth = 17; ctx.stroke();
      ctx.strokeStyle = `rgba(6,7,5,${a})`; ctx.lineWidth = 13.5; ctx.stroke();
    }
    ctx.beginPath(); ctx.ellipse(0, 2, 41, 19, 0, 0, 6.283); glass(rim, a, 1.9);
    ctx.beginPath(); ctx.arc(0, -3, 16.5, 0, 6.283); glass(rim, a, 1.9, false);
    ctx.restore();
  }
  function drink(x, y, a = 1) {
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = `rgba(${LIME},${0.35 * a})`; ctx.beginPath(); ctx.arc(x, y, 14, 0, 6.283); ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = `rgba(${LIME},${a})`; ctx.beginPath(); ctx.arc(x, y, 6.5, 0, 6.283); ctx.fill();
  }
  function quadPt(p0, p1, p2, t) {
    const u = 1 - t;
    return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]];
  }
  function chip(x, y, text, a) {
    if (a <= 0.01) return;
    ctx.font = "600 22px 'DM Sans', sans-serif";
    const w = ctx.measureText(text).width + 64, h = 46;
    ctx.save(); ctx.globalAlpha = a;
    rrPath(x - w / 2, y - h / 2, w, h, h / 2); ctx.fillStyle = "rgba(24,26,22,0.95)"; ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 1.3; ctx.stroke();
    ctx.fillStyle = `rgb(${LIME})`; ctx.beginPath(); ctx.arc(x - w / 2 + 24, y, 9, 0, 6.283); ctx.fill();
    ctx.fillStyle = "#f4f4f2"; ctx.textBaseline = "middle"; ctx.fillText(text, x - w / 2 + 42, y + 1);
    ctx.restore();
  }

  function drawClub(p, t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, vw, vh);
    // fondo
    const g = ctx.createRadialGradient(vw * 0.62, vh * 0.25, 0, vw * 0.62, vh * 0.25, vw * 0.7);
    g.addColorStop(0, `rgba(${LIME},${0.05 + 0.05 * smooth((p - 0.45) / 0.2)})`); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, vw, vh);

    // La escena (barra con camareros arriba y mesas abajo) cabe entera bajo la barra de navegación
    const wide = vw > 860;
    const NAV = 80;
    const sc = wide ? Math.min(vw * 0.68 / 1600 * 1.22, (vh - NAV - 30) / 940) : Math.min(vw / 1320, vh * 0.6 / 1000);
    const cx = wide ? vw * 0.64 : vw / 2, cy = wide ? NAV + (vh - NAV) / 2 : vh * 0.4;
    ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.translate(-800, wide ? -475 : -500);

    const on = smooth((p - 0.48) / 0.06);       // bozu se activa
    const late = smooth((p - 0.74) / 0.06);     // servicio en mesa y recogida

    // pared y puerta
    ctx.strokeStyle = "rgba(150,150,156,0.35)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(40, 60); ctx.lineTo(40, 480); ctx.moveTo(40, 600); ctx.lineTo(40, 950); ctx.stroke();
    ctx.fillStyle = "rgba(150,150,156,0.7)"; ctx.font = "500 20px 'DM Sans', sans-serif"; ctx.fillText("Salida", 56, 546);

    // barra y camareros
    rrPath(420, 90, 760, 80, 24); glass(RIM, 1, 2.2);
    for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.arc(470 + k * 82.5, 130, 12, 0, 6.283); glass(RIM, 0.6, 1.3, false); }
    // Camareros tras la barra: antes van de un lado a otro cobrando; con bozu, preparan en su sitio
    const rush = 1 - on;
    [[560, 0.9, 0], [800, 1.1, 1.7], [1040, 0.8, 3.1]].forEach(([bx, sp, ph]) => {
      const x = bx + (25 + 95 * rush) * Math.sin(t * sp * (1 + 1.4 * rush) + ph);
      person(x, 46, Math.PI + 0.25 * rush * Math.sin(t * 5 + ph), 1.05, on > 0.5 ? RIM : WH, 1, 0.75 + 0.25 * Math.abs(Math.sin(t * 6 + ph)));
      if (on > 0.01) {
        const pk = (t * 0.5 + ph) % 1;
        drink(x + 18, 112, on * Math.min(1, pk * 4) * (1 - smooth((pk - 0.8) / 0.2)));
      }
    });
    ctx.save(); ctx.font = "600 19px 'DM Sans', sans-serif"; ctx.textAlign = "center";
    ctx.fillStyle = `rgba(${on > 0.5 ? LIME : WH},${0.75})`; ctx.fillText(on > 0.5 ? "Camareros: solo preparan" : "Camareros: cobran y sirven", 800, -6); ctx.restore();

    // pista
    rrPath(FLOOR.x, FLOOR.y, FLOOR.w, FLOOR.h, 26); glass(WH, 0.35 + 0.25 * on, 1.4, false);
    ctx.strokeStyle = `rgba(255,255,255,${0.04 + 0.05 * on})`; ctx.lineWidth = 1;
    for (let k = 1; k < 8; k++) { ctx.beginPath(); ctx.moveTo(FLOOR.x + k * 60, FLOOR.y + 4); ctx.lineTo(FLOOR.x + k * 60, FLOOR.y + FLOOR.h - 4); ctx.stroke(); }
    for (let k = 1; k < 6; k++) { ctx.beginPath(); ctx.moveTo(FLOOR.x + 4, FLOOR.y + k * 53); ctx.lineTo(FLOOR.x + FLOOR.w - 4, FLOOR.y + k * 53); ctx.stroke(); }

    // mesas
    TABLES.forEach(([tx, ty], i) => {
      rrPath(tx - 58, ty - 58, 116, 116, 18);
      glass(on > 0.5 ? RIM : WH, 0.5 + 0.5 * on, 1.6 + on, true);
    });
    tablePeople.forEach((q) => {
      const th = Math.atan2(q.tx - q.x, -(q.ty - q.y));
      person(q.x + 4 * Math.sin(t * 3 + q.ph), q.y + 3 * Math.cos(t * 3 + q.ph), th + 0.2 * Math.sin(t * 2 + q.ph), 0.62, WH, 0.55 + 0.4 * on, 0.5 + 0.3 * Math.abs(Math.sin(t * 3 + q.ph)));
    });

    // pedidos en vuelo hacia la barra
    if (on > 0.01) {
      const origins = [...TABLES.map(([x, y]) => [x, y]), [700, 520], [900, 600], [820, 450]];
      origins.forEach((o, i) => {
        const end = [500 + (i * 97) % 600, 180];
        const mid = [(o[0] + end[0]) / 2 + (o[0] < 800 ? -80 : 80), (o[1] + end[1]) / 2];
        ctx.beginPath(); ctx.moveTo(o[0], o[1]); ctx.quadraticCurveTo(mid[0], mid[1], end[0], end[1]);
        ctx.strokeStyle = `rgba(${LIME},${0.22 * on})`; ctx.lineWidth = 2; ctx.setLineDash([2, 10]); ctx.stroke(); ctx.setLineDash([]);
        const k = (t * 0.32 + i * 0.37) % 1;
        const [px, py] = quadPt(o, mid, end, k);
        drink(px, py, on * (1 - Math.max(0, (k - 0.85) / 0.15)));
      });
    }

    // bailarines de base
    dancers.forEach((d) => person(d.x + 8 * Math.sin(t * 4 + d.ph), d.y + 6 * Math.cos(t * 4 + d.ph), d.ph + 0.4 * Math.sin(t * 3 + d.ph), 0.72, WH, 0.85, 0.6 + 0.5 * Math.abs(Math.sin(t * 4 + d.ph))));

    // la cola: se va por la puerta o se vuelve a la pista
    crowd.forEach((c, i) => {
      let x = c.bx, y = c.by, th = 0, a = 1, arm = 0.35;
      const jost = (1 - on) * 3;
      x += jost * Math.sin(t * 7 + c.ph); y += jost * Math.cos(t * 5 + c.ph);
      if (c.leaver) {
        const k = smooth((p - 0.27 - c.delay * 0.08) / 0.15);
        if (k > 0) {
          x = lerp(c.bx, DOOR.x, k); y = lerp(c.by, DOOR.y, k);
          th = Math.atan2(DOOR.x - c.bx, -(DOOR.y - c.by)) + 0.12 * Math.sin(t * 9);
          a = 1 - smooth((k - 0.75) / 0.25); arm = 0.55;
        }
      } else {
        const k = smooth((p - 0.52 - c.delay * 0.08) / 0.12);
        if (k > 0) {
          x = lerp(c.bx, c.fx, k) + 7 * k * Math.sin(t * 4 + c.ph); y = lerp(c.by, c.fy, k) + 5 * k * Math.cos(t * 4 + c.ph);
          th = k < 1 ? Math.atan2(c.fx - c.bx, -(c.fy - c.by)) : c.ph + 0.4 * Math.sin(t * 3 + c.ph);
          arm = 0.5 + 0.5 * k * Math.abs(Math.sin(t * 4 + c.ph));
        }
      }
      person(x, y, th, 0.8, WH, a, arm);
    });

    // camareros (verde) sirviendo en mesa, con su bandeja
    if (late > 0.01) {
      const runs = [{ from: [1120, 205], to: [1370, 405], sp: 0.16, ph: 0, drop: [1388, 340] }, { from: [480, 205], to: [330, 750], sp: 0.13, ph: 0.45, drop: [250, 745] }];
      runs.forEach(({ from, to, sp, ph, drop }) => {
        const w = (t * sp + ph) % 1;
        const k = w < 0.5 ? smooth(w / 0.42) : 1 - smooth((w - 0.55) / 0.42);
        const x = lerp(from[0], to[0], k), y = lerp(from[1], to[1], k);
        const dir = w < 0.5 ? 1 : -1;
        const th = Math.atan2((to[0] - from[0]) * dir, -(to[1] - from[1]) * dir);
        person(x, y, th + 0.1 * Math.sin(t * 9), 1, RIM, late, 0.95);
        const tx = x + 30 * Math.sin(th), ty = y - 30 * Math.cos(th);
        ctx.beginPath(); ctx.arc(tx, ty, 17, 0, 6.283); glass(RIM, late, 1.6, false);
        if (w < 0.5) { drink(tx - 5, ty - 3, late); drink(tx + 6, ty + 4, late * 0.8); }
        else drink(drop[0], drop[1], late);
        ctx.save(); ctx.globalAlpha = late * 0.9; ctx.font = "600 18px 'DM Sans', sans-serif"; ctx.textAlign = "center";
        ctx.fillStyle = `rgb(${LIME})`; ctx.fillText("Camarero", x, y - 52); ctx.restore();
      });
      // alguien de la pista recoge en barra
      const v = (t * 0.13 + 0.4) % 1;
      const kk = v < 0.5 ? smooth(v / 0.4) : 1 - smooth((v - 0.55) / 0.4);
      const sx = 900, sy = 560, ex = 1010, ey = 205;
      const dx = lerp(sx, ex, kk), dy = lerp(sy, ey, kk);
      const dth = Math.atan2((ex - sx) * (v < 0.5 ? 1 : -1), -(ey - sy) * (v < 0.5 ? 1 : -1));
      person(dx, dy, dth + 0.1 * Math.sin(t * 9), 0.8, RIM, late, 0.6);
      if (v > 0.45) drink(dx + 20 * Math.sin(dth), dy - 20 * Math.cos(dth), late);
      if (v < 0.12) {
        const r = v / 0.12;
        ctx.strokeStyle = `rgba(${LIME},${(1 - r) * late})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(sx, sy, 30 + 60 * r, 0, 6.283); ctx.stroke();
      }
      chip(sx + 150, sy - 70, "Tu pedido está listo", late * smooth(1 - Math.abs(v - 0.06) / 0.12 + 0.3));
    }
  }

  let clubVisible = false, t0 = performance.now();
  function clubFrame(now) {
    const p = progressOf(club);
    const t = reduce ? 1.0 : (now - t0) / 1000;
    drawClub(p, t);
    const idx = Math.min(3, Math.floor(p * 4 + 0.0001));
    caps.forEach((c, i) => c.classList.toggle("on", i === idx));
    if (bar) bar.style.width = (p * 100).toFixed(1) + "%";
    if (clubVisible && !reduce) requestAnimationFrame(clubFrame);
  }
  resize();
  window.addEventListener("resize", () => { resize(); clubFrame(performance.now()); });
  new IntersectionObserver((es) => {
    clubVisible = es[0].isIntersecting;
    if (clubVisible) requestAnimationFrame(clubFrame);
  }).observe(club);
  if (reduce) window.addEventListener("scroll", () => clubFrame(performance.now()), { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => clubFrame(performance.now()));

  /* ---------- Tap. Drink. Party. ---------- */
  const tdp = document.getElementById("tdp");
  const words = [...document.querySelectorAll(".tdp-words span")];
  /* ---------- bozu Tap ---------- */
  const tapSec = document.getElementById("tap");
  const tag = document.getElementById("tag3d");

  function onScroll() {
    const p = progressOf(tdp);
    words.forEach((w, i) => w.classList.toggle("on", reduce || p > 0.12 + i * 0.22));
    if (tag) {
      const r = tapSec.getBoundingClientRect();
      const q = clamp(1 - (r.top + r.height / 2) / (window.innerHeight * 1.2));
      tag.style.setProperty("--rx", lerp(62, 18, q).toFixed(2) + "deg");
      tag.style.setProperty("--rz", lerp(-34, 8, q).toFixed(2) + "deg");
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- códigos QR de adorno (no llevan a ningún sitio) ---------- */
  document.querySelectorAll("svg.qr").forEach((svg) => {
    const n = 25;
    let seed = +svg.dataset.seed || 1;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const finder = (x, y) => `<path d="M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5z" fill-rule="evenodd"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`;
    const inFinder = (x, y) => (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
    let cells = "";
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!inFinder(x, y) && rnd() < 0.48) cells += `M${x} ${y}h1v1h-1z`;
    svg.setAttribute("viewBox", `0 0 ${n} ${n}`);
    svg.setAttribute("shape-rendering", "crispEdges");
    svg.innerHTML = `<g fill="#000">${finder(0, 0)}${finder(n - 7, 0)}${finder(0, n - 7)}<path d="${cells}"/></g>`;
  });

  /* ---------- el vaso de la app (mismo componente que bozu-app) ---------- */
  const D = window.BozuDrink, G = window.BozuGlass;
  const PINK = { color: "#f2a0bd" }, TONIC = { color: "#eef5f3", carbonated: true };
  const VIS = D ? {
    empty: D.visual({}),
    spirit: D.visual({ spirit: PINK }),
    pink: D.visual({ spirit: PINK, mixer: TONIC }),
    cola: D.visual({ spirit: { type: "ron" }, mixer: { color: "#140805", carbonated: true } }),
    beer: D.visual({ other: { kind: "beer", color: "#f0b52a" } }),
  } : null;
  if (G && VIS) document.querySelectorAll("[data-mini]").forEach((el) => { el.innerHTML = G.mini(VIS[el.dataset.mini], 30); });
  const orderGlassEl = document.querySelector('[data-glass="order"]');
  const orderGlass = G && VIS && orderGlassEl ? G.mount(orderGlassEl, reduce ? VIS.pink : VIS.empty) : null;
  let glassTimers = [];
  function playOrderGlass() {
    if (!orderGlass) return;
    glassTimers.forEach(clearTimeout);
    if (reduce) return orderGlass.set(VIS.pink);
    orderGlass.set(VIS.empty);
    glassTimers = [setTimeout(() => orderGlass.set(VIS.spirit), 650), setTimeout(() => orderGlass.set(VIS.pink), 1750)];
  }

  if (orderGlassEl) new IntersectionObserver((es) => {
    if (es[0].isIntersecting && orderGlassEl.closest(".screen").classList.contains("on")) playOrderGlass();
  }, { threshold: 0.6 }).observe(orderGlassEl);

  /* ---------- pasos con móvil: la pantalla cambia con cada paso (cómo funciona y RRPP) ---------- */
  const narrow = matchMedia("(max-width: 860px)").matches;
  document.querySelectorAll(".how-grid").forEach((grid) => {
    const steps = [...grid.querySelectorAll(".step")];
    const screens = [...grid.querySelectorAll(".screen")];
    const setStep = (i) => {
      steps.forEach((s, k) => s.classList.toggle("on", k === i));
      screens.forEach((s, k) => {
        const was = s.classList.contains("on");
        s.classList.toggle("on", k === i);
        if (k === i && !was && s.querySelector('[data-glass="order"]')) playOrderGlass();
      });
    };
    setStep(0);
    const so = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) setStep(+e.target.dataset.step); });
    }, { rootMargin: narrow ? "-80% 0px -19% 0px" : "-45% 0px -45% 0px" });
    steps.forEach((s) => so.observe(s));
  });

  /* ---------- pestañas de beneficios ---------- */
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const activate = (tab) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", on); t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => activate(t));
    t.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const n = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
      activate(n); n.focus();
    });
  });

  /* ---------- calculadora ---------- */
  const R = (id) => document.getElementById(id);
  const inputs = ["r-cli", "r-pre", "r-pct", "r-noc"].map(R);
  let shown = 0, target = 0, animId = null;
  function paint(v) {
    R("calcMonth").textContent = fmt(Math.round(v)) + " €";
    R("calcYear").textContent = fmt(Math.round(v * 12)) + " €";
  }
  function calc() {
    const [cli, pre, pct, noc] = inputs.map((i) => +i.value);
    inputs.forEach((i) => i.style.setProperty("--p", ((i.value - i.min) / (i.max - i.min) * 100) + "%"));
    R("o-cli").textContent = fmt(cli); R("o-pre").textContent = pre + " €"; R("o-pct").textContent = pct + " %"; R("o-noc").textContent = noc;
    target = cli * (pct / 100) * pre * noc;
    if (reduce) { shown = target; paint(shown); return; }
    cancelAnimationFrame(animId);
    const step = () => { shown += (target - shown) * 0.18; if (Math.abs(target - shown) < 1) shown = target; paint(shown); if (shown !== target) animId = requestAnimationFrame(step); };
    step();
  }
  inputs.forEach((i) => i.addEventListener("input", calc));
  calc();

  /* ---------- dashboard en directo (datos ilustrativos) ---------- */
  const dash = document.getElementById("dash");
  const feed = document.getElementById("feed");
  const ORDERS = [["Mesa VIP 4", "Botella + refrescos"], ["Pista", "2× Gin tonic"], ["Terraza", "4× Tequila"], ["Mesa 7", "3× Tercio"], ["Pista", "Ron cola", "Invitación"], ["Mesa VIP 2", "Upgrade premium"], ["Barra 1", "2× Vodka limón"], ["Pista", "Gin tonic", "RRPP"]];
  let num = 61, started = false;
  function pushOrder() {
    const [where, what, tag] = ORDERS[Math.floor(Math.random() * ORDERS.length)];
    const li = document.createElement("li");
    li.innerHTML = `<b>B-${num++}</b><span>${what}${tag ? `<i class="tag">${tag}</i>` : ""}</span><em>${where}</em>`;
    feed.prepend(li);
    while (feed.children.length > 5) feed.lastElementChild.remove();
  }
  function countUp(root) {
    root.querySelectorAll("[data-count]").forEach((el) => {
      const end = +el.dataset.count, dec = +(el.dataset.dec || 0), suf = el.dataset.suffix || "";
      const t0 = performance.now(), dur = reduce ? 0 : 1600;
      const tick = (now) => {
        const k = dur ? smooth((now - t0) / dur) : 1;
        el.textContent = fmt(end * k, dec) + suf;
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }
  new IntersectionObserver((es) => {
    if (es[0].isIntersecting && !started) {
      started = true; dash.classList.add("in"); countUp(dash);
      for (let k = 0; k < 4; k++) pushOrder();
      if (!reduce) setInterval(pushOrder, 1900);
    }
  }, { threshold: 0.3 }).observe(dash);

  /* =========================================================
     NAVEGACIÓN: menú, sección activa y progreso de lectura
     ========================================================= */
  const nav = document.querySelector(".nav");
  const navProgress = document.getElementById("navProgress");
  const burger = document.getElementById("burger");
  const menu = document.getElementById("menu");
  const mbar = document.getElementById("mbar");
  const chatBox = document.getElementById("chat");
  const lock = () => document.body.classList.toggle("locked", !menu.hidden || (!chatBox.hidden && innerWidth <= 760));

  function setMenu(open) {
    menu.hidden = !open;
    menu.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    lock();
    if (open) menu.querySelector("a").focus({ preventScroll: true });
  }
  burger.addEventListener("click", () => setMenu(menu.hidden));
  menu.addEventListener("click", (e) => { if (e.target.closest("a, button")) setMenu(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!chatBox.hidden) closeChat();
    else if (!menu.hidden) { setMenu(false); burger.focus(); }
  });
  matchMedia("(min-width: 1081px)").addEventListener("change", (e) => { if (e.matches && !menu.hidden) setMenu(false); });

  const stepGrids = [...document.querySelectorAll(".how-grid")];
  const chatFabEl = document.getElementById("chatFab");
  let ticking = false;
  function onScrollNav() {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    nav.classList.toggle("scrolled", scrollY > 40);
    navProgress.style.transform = `scaleX(${max > 0 ? (scrollY / max).toFixed(4) : 0})`;
    const demoTop = document.getElementById("demo").getBoundingClientRect().top;
    // En las secciones con móvil fijo el texto se lee abajo: ahí la barra no se muestra
    const overSteps = stepGrids.some((g) => { const r = g.getBoundingClientRect(); return r.top < innerHeight && r.bottom > innerHeight * 0.5; });
    const show = scrollY > innerHeight * 0.8 && demoTop > innerHeight * 0.6 && chatBox.hidden && !overSteps;
    mbar.classList.toggle("show", show);
    chatFabEl.classList.toggle("away", (overSteps && innerWidth <= 860) || scrollY > max - 90);
    mbar.setAttribute("aria-hidden", !show);
    mbar.querySelectorAll("a, button").forEach((el) => (el.tabIndex = show ? 0 : -1));
  }
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScrollNav); } }, { passive: true });
  onScrollNav();

  // Resalta en el menú la sección que se está viendo
  const navLinks = [...document.querySelectorAll('.nav-links a, .menu-links a')];
  const spied = [...new Set(navLinks.map((a) => a.getAttribute("href")))].map((h) => document.querySelector(h)).filter(Boolean);
  let spiedId = null;
  function spy() {
    const line = innerHeight * 0.45;
    const cur = spied.find((sec) => { const r = sec.getBoundingClientRect(); return r.top <= line && r.bottom > line; });
    const id = cur ? "#" + cur.id : null;
    if (id === spiedId) return;
    spiedId = id;
    navLinks.forEach((a) => {
      const on = a.getAttribute("href") === id;
      a.classList.toggle("on", on);
      if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    });
  }
  window.addEventListener("scroll", spy, { passive: true });
  spy();

  /* ---------- scroll guiado ----------
     Del inicio a «Tap. Drink. Party.» hay una cadena de paradas: las 4 escenas del club y las 3 palabras.
     Cada gesto (rueda, trackpad o dedo) avanza exactamente una parada, nada más empezar el gesto. */
  const heroSec = document.querySelector(".hero");
  const tdpSec = document.getElementById("tdp");
  const clubSec = document.getElementById("club");
  const TDP_STOPS = [0.2, 0.42, 0.66];
  function stops() {
    const clubRange = clubSec.offsetHeight - innerHeight, tdpRange = tdpSec.offsetHeight - innerHeight;
    const heroEnd = heroSec.offsetTop + heroSec.offsetHeight - innerHeight;
    return [
      heroEnd < 60 ? 0 : heroEnd,
      ...[0, 1, 2, 3].map((i) => clubSec.offsetTop + clubRange * (i + 0.5) / 4),
      ...TDP_STOPS.map((k) => tdpSec.offsetTop + tdpRange * k),
    ].map(Math.round);
  }
  let anim = null, lastWheel = 0;
  const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  function glide(to) {
    if (reduce) { window.scrollTo({ top: to, behavior: "instant" }); return; }
    const from = scrollY, t0 = performance.now(), dur = Math.min(900, 420 + Math.abs(to - from) * 0.25);
    anim = { to };
    lockUntil = t0 + dur + 120;
    const step = (now) => {
      if (!anim) return;
      const k = Math.min(1, (now - t0) / dur);
      window.scrollTo({ top: from + (to - from) * easeInOut(k), behavior: "instant" });
      if (k < 1) { requestAnimationFrame(step); return; }
      anim = null;
      window.dispatchEvent(new Event("scroll"));
      // Un gesto que llegó mientras se deslizaba: se hace ahora
      if (pendingDir) { const d = pendingDir; pendingDir = 0; const nxt = nextStop(d); if (nxt != null) glide(nxt); }
    };
    requestAnimationFrame(step);
  }
  // Devuelve la parada a la que ir, o null si este gesto no está en la cadena (scroll normal)
  function nextStop(dir) {
    const S = stops(), y = scrollY, tol = 8;
    const first = S[0], last = S[S.length - 1];
    if (dir > 0 && (y < first - innerHeight * 0.35 || y >= last - tol)) return null;
    if (dir < 0 && (y <= first + tol || y > last + innerHeight * 0.35)) return null;
    if (dir > 0) return S.find((v) => v > y + tol) ?? null;
    for (let i = S.length - 1; i >= 0; i--) if (S[i] < y - tol) return S[i];
    return null;
  }
  const blocked = () => !menu.hidden || !chatBox.hidden;

  // Rueda y trackpad. Un gesto nuevo se reconoce por una pausa (>180 ms) o porque vuelve a acelerar; la inercia
  // del trackpad (eventos cada vez más flojos) no cuenta. Si llega un gesto nuevo mientras se desliza, se hace
  // al terminar. Fuera de la cadena nunca se bloquea nada, y como válvula de seguridad nada se bloquea más de 2,5 s.
  let lockUntil = 0, lastMag = 0, pendingDir = 0, peak = 0;
  window.addEventListener("wheel", (e) => {
    if (blocked() || e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
    const now = performance.now();
    const mag = Math.abs(e.deltaY) * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1);
    const dir = Math.sign(e.deltaY);
    // Nuevo gesto: tras una pausa, o si vuelve a acelerar cuando la inercia ya había bajado (no durante su propia aceleración)
    let newGesture = false;
    if (now - lastWheel > 180) { newGesture = true; peak = mag; }
    else if (mag > lastMag * 1.5 && mag > 6 && lastMag < peak * 0.6) { newGesture = true; peak = mag; }
    else peak = Math.max(peak, mag);
    const steady = now > lockUntil + 250 && mag >= lastMag && mag >= 25; // rueda de ratón girando sin parar
    lastWheel = now; lastMag = mag;
    const to = nextStop(dir);
    if (to == null && !anim) return; // fuera de la cadena: scroll normal
    e.preventDefault();
    if (anim) { if (newGesture) pendingDir = dir; return; }
    if (to == null) return;
    if (newGesture || (now >= lockUntil && (steady || now > lockUntil + 2500))) glide(to);
  }, { passive: false });

  let touchY = null, touchDecided = false, touchGuided = false;
  window.addEventListener("touchstart", (e) => { touchY = e.touches[0].clientY; touchDecided = false; touchGuided = false; }, { passive: true });
  window.addEventListener("touchmove", (e) => {
    if (touchY == null || blocked()) return;
    if (anim || touchGuided) { e.preventDefault(); return; }
    if (touchDecided) return;
    const dy = touchY - e.touches[0].clientY;
    if (Math.abs(dy) < 10) return;
    touchDecided = true;
    const to = nextStop(Math.sign(dy));
    if (to == null) return;
    touchGuided = true;
    e.preventDefault();
    glide(to);
  }, { passive: false });
  window.addEventListener("touchend", () => { touchY = null; }, { passive: true });

  // Teclado, barra de scroll o inercia que entra en la cadena a medio camino: se termina en la parada más cercana
  let settleTimer = null;
  window.addEventListener("scroll", () => {
    if (anim) return;
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      if (anim || touchY != null || blocked()) return;
      const S = stops(), y = scrollY;
      if (y <= S[0] + 8 || y >= S[S.length - 1] - 8) return;
      if (S.some((v) => Math.abs(v - y) < 8)) return;
      glide(S.reduce((a, b) => (Math.abs(b - y) < Math.abs(a - y) ? b : a)));
    }, 140);
  }, { passive: true });

  /* =========================================================
     ASISTENTE CON IA
     ========================================================= */
  const CHAT_URL = "/api/chat";
  const CHAT_KEY = "bozu.chat";
  const WELCOME = "¡Hola! Soy el asistente de bozu. Pregúntame lo que quieras sobre cómo funciona: pedidos desde el móvil, la barra, tus RRPP, las listas o la puerta.";
  const SUGGESTIONS = ["¿Cómo pide un cliente?", "¿Cómo funcionan las listas de RRPP?", "¿Qué necesito en la barra?", "¿Cuándo se cobra al cliente?", "¿Cuánto cuesta?"];
  const fab = document.getElementById("chatFab");
  const log = document.getElementById("chatLog");
  const sug = document.getElementById("chatSug");
  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatIn");
  const sendBtn = document.getElementById("chatSend");
  let history = [];
  let busy = false;
  let lastOpener = null;
  try { history = JSON.parse(sessionStorage.getItem(CHAT_KEY)) || []; } catch { history = []; }
  const save = () => { try { sessionStorage.setItem(CHAT_KEY, JSON.stringify(history.slice(-20))); } catch {} };

  const esc = (t) => t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const linkLabel = (url) => url.includes("calendar.app.google") ? "Agenda una demo ↗" : url.includes("wa.me") ? "WhatsApp ↗" : url.replace(/^https:\/\/(www\.)?/, "").split("/")[0] + " ↗";
  // Formato mínimo y seguro: negritas, enlaces, listas con guion y párrafos
  function render(text) {
    const inline = (t) => esc(t)
      .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
      .replace(/(https:\/\/[^\s<)]+[^\s<).,;:!?])/g, (url) => `<a href="${url}" target="_blank" rel="noopener">${linkLabel(url)}</a>`);
    const blocks = text.trim().split(/\n{2,}/);
    return blocks.map((b) => {
      const lines = b.split("\n");
      if (lines.every((l) => /^\s*[-•*]\s+/.test(l))) return "<ul>" + lines.map((l) => "<li>" + inline(l.replace(/^\s*[-•*]\s+/, "")) + "</li>").join("") + "</ul>";
      return "<p>" + lines.map(inline).join("<br>") + "</p>";
    }).join("");
  }
  function bubble(role, html, extra = "") {
    const el = document.createElement("div");
    el.className = `msg ${role} ${extra}`.trim();
    el.innerHTML = html;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }
  const contactActs = () => `<div class="acts"><a href="${BOZU_CONTACT.agenda}" target="_blank" rel="noopener">Agenda una demo</a><a href="https://wa.me/${BOZU_CONTACT.whatsapp}" target="_blank" rel="noopener">WhatsApp</a></div>`;

  function drawChat() {
    log.innerHTML = "";
    bubble("bot", render(WELCOME));
    history.forEach((m) => bubble(m.role === "user" ? "me" : "bot", m.role === "user" ? esc(m.content) : render(m.content)));
    sug.innerHTML = "";
    if (!history.length) SUGGESTIONS.forEach((q) => {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = q;
      b.addEventListener("click", () => ask(q));
      sug.appendChild(b);
    });
    sug.hidden = !!history.length;
  }

  function openChat(opener) {
    lastOpener = opener || null;
    if (!menu.hidden) setMenu(false);
    chatBox.hidden = false;
    fab.setAttribute("aria-expanded", "true");
    drawChat();
    lock(); onScrollNav();
    setTimeout(() => input.focus({ preventScroll: true }), 50);
  }
  function closeChat() {
    chatBox.hidden = true;
    fab.setAttribute("aria-expanded", "false");
    lock(); onScrollNav();
    (lastOpener && document.body.contains(lastOpener) && lastOpener.offsetParent ? lastOpener : fab).focus({ preventScroll: true });
  }
  document.querySelectorAll("[data-open-chat]").forEach((b) => b.addEventListener("click", () => openChat(b)));
  document.getElementById("chatClose").addEventListener("click", closeChat);
  document.getElementById("chatReset").addEventListener("click", () => { if (busy) return; history = []; save(); drawChat(); input.focus(); });

  const grow = () => { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 120) + "px"; };
  input.addEventListener("input", grow);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); } });
  form.addEventListener("submit", (e) => { e.preventDefault(); ask(input.value); });

  async function ask(text) {
    text = (text || "").trim().slice(0, 800);
    if (!text || busy) return;
    busy = true; sendBtn.disabled = true;
    input.value = ""; grow();
    sug.hidden = true;
    history.push({ role: "user", content: text });
    bubble("me", esc(text));
    const out = bubble("bot", '<span class="typing" aria-label="Escribiendo"><i></i><i></i><i></i></span>');
    let reply = "";
    try {
      const res = await fetch(CHAT_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history.slice(-12) }) });
      if (!res.ok || !res.body) {
        let msg = "";
        try { msg = (await res.json()).error || ""; } catch {}
        throw new Error(res.status === 429 ? msg : "");
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        reply += dec.decode(value, { stream: true });
        out.innerHTML = render(reply);
        log.scrollTop = log.scrollHeight;
      }
      if (!reply.trim()) throw new Error("");
      history.push({ role: "assistant", content: reply });
      save();
    } catch (err) {
      history.pop();
      out.classList.add("err");
      out.innerHTML = render(err.message || "Ahora mismo no puedo responder. Escríbenos por WhatsApp o agenda una demo y te lo contamos.") + contactActs();
    } finally {
      busy = false; sendBtn.disabled = false;
      if (!chatBox.hidden && matchMedia("(pointer: fine)").matches) input.focus({ preventScroll: true });
    }
  }

  /* ---------- panel del equipo RRPP (datos ilustrativos) ---------- */
  const teamDash = document.getElementById("teamDash");
  if (teamDash) {
    const to = new IntersectionObserver((es) => {
      if (!es[0].isIntersecting) return;
      teamDash.classList.add("in"); countUp(teamDash); to.disconnect();
    }, { threshold: 0.3 });
    to.observe(teamDash);
  }
})();
