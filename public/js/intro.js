// Intro scene: pixel-art sunset, hills, a rider galloping in with the news, letters fluttering, birds flying.
// Drawn on a 192x108 canvas and scaled up with crisp pixels. No assets: everything is code.
(function () {
  const W = 192, H = 108;
  const RIDER = {
    body: [
      "...........RRR............",
      "..........RRRRR...........",
      "..........RRfRR...........",
      "...........RRR............",
      "..........RRRRR..EE.......",
      "..........RRRRR..EE.......",
      "...........RRR............",
      "....HHHHHHHHHHHHHH...mm...",
      "...HHHHHHHHSSHHHHHHHHHHm..",
      "..HHHHHHHHHSSHHHHHHHHHHH..",
      "..HHHHHHHHHHHHHHHHHHHHh...",
      "..THHHHHHHHHHHHHHHHH......"
    ],
    legsA: ["..T.HH.......HH...........", "..T.HH.......HH...........", "....dd.......dd..........."],
    legsB: ["..T..HH....HH.............", "..T...HH..HH..............", "......dd..dd.............."],
    colors: { R: "#C8372D", f: "#E8B79A", E: "#F4F4F6", H: "#6B4A2E", S: "#8E2A22", m: "#3A2A1E", h: "#2A2018", T: "#3A2A1E", d: "#2A2018" }
  };
  const lerp = (a, b, t) => a + (b - a) * t;
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(",")})`; };

  function drawMap(ctx, map, colors, x, y) {
    map.forEach((row, yy) => [...row].forEach((ch, xx) => { if (colors[ch]) { ctx.fillStyle = colors[ch]; ctx.fillRect(x + xx, y + yy, 1, 1); } }));
  }

  // Deterministic noise for grass and ground texture.
  const rnd = (x, y) => { const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return n - Math.floor(n); };

  function mount(container, { onStart } = {}) {
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H; canvas.className = "intro-canvas";
    container.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, t0 = performance.now();
    const letters = []; // { x, y, vx, vy, life }
    const birds = Array.from({ length: 6 }, (_, i) => ({ x: 200 + i * 34, y: 14 + (i * 7) % 26, s: 0.35 + (i % 3) * 0.12, ph: i }));

    function frame(now) {
      const s = (now - t0) / 1000;
      const sun = reduced ? 0.55 : (1 - Math.cos((s / 48) * Math.PI * 2)) / 2; // 0 day -> 1 dusk, slow loop
      // sky bands
      const top = mix("#6FA7E8", "#3B2C5E", sun), hor = mix("#F7C27A", "#E2543E", sun);
      for (let i = 0; i < 8; i++) { ctx.fillStyle = mix(rgbToHex(top), rgbToHex(hor), i / 7); ctx.fillRect(0, i * 10, W, 10); }
      // sun
      const sy = lerp(18, 66, sun), sx = 146;
      ctx.fillStyle = mix("#FFE08A", "#FF7A3D", sun);
      circle(ctx, sx, sy, 9);
      ctx.fillStyle = mix("#FFF4C2", "#FFB27A", sun); circle(ctx, sx - 2, sy - 2, 4);
      // clouds
      ctx.fillStyle = mix("#FFFFFF", "#D9A6C9", sun);
      cloud(ctx, 20 + ((s * 1.2) % 60), 16); cloud(ctx, 96 + ((s * 0.8) % 40), 24); cloud(ctx, 60 + ((s * 1) % 80), 8);
      // far hills
      ctx.fillStyle = mix("#5E8C5A", "#3D2E5A", sun);
      hills(ctx, 62, 18, 0.9);
      ctx.fillStyle = mix("#3F6B3C", "#2A2145", sun);
      hills(ctx, 70, 12, 1.6);
      // trees (left)
      const treeD = mix("#1F4D2A", "#15182E", sun), treeL = mix("#2E6B3A", "#1E2340", sun);
      [6, 22, 40].forEach((x, i) => pine(ctx, x, 60 + i * 3, 14 + (i % 2) * 4, treeD, treeL));
      // ground
      const g1 = mix("#4C9A3C", "#2E4A33", sun), g2 = mix("#3F8332", "#25402B", sun), soil = mix("#6B4A2E", "#3A2A24", sun);
      for (let y = 78; y < H; y++) for (let x = 0; x < W; x++) {
        const n = rnd(x, y);
        ctx.fillStyle = y < 90 ? (n > 0.82 ? g2 : g1) : y < 94 ? (n > 0.5 ? soil : g2) : (n > 0.88 ? "#8A6A4A" : soil);
        ctx.fillRect(x, y, 1, 1);
      }
      // road
      ctx.fillStyle = mix("#C9A97A", "#6E5548", sun);
      for (let x = 0; x < W; x++) { const y = 84 + Math.round(Math.sin(x / 30) * 2); ctx.fillRect(x, y, 1, 3 + (rnd(x, 1) > 0.5 ? 1 : 0)); }
      // birds
      ctx.fillStyle = mix("#2E2A33", "#0F0D16", sun);
      for (const b of birds) {
        if (!reduced) { b.x -= b.s; if (b.x < -10) { b.x = W + 10; } }
        const flap = Math.floor(s * 6 + b.ph) % 2;
        const by = Math.round(b.y + Math.sin(s * 2 + b.ph) * 1.5), bx = Math.round(b.x);
        if (flap) { ctx.fillRect(bx, by, 1, 1); ctx.fillRect(bx + 1, by + 1, 1, 1); ctx.fillRect(bx + 2, by + 1, 1, 1); ctx.fillRect(bx + 3, by, 1, 1); }
        else { ctx.fillRect(bx, by + 1, 1, 1); ctx.fillRect(bx + 1, by, 1, 1); ctx.fillRect(bx + 2, by, 1, 1); ctx.fillRect(bx + 3, by + 1, 1, 1); }
      }
      // rider: gallops in from the left, slows at center, then rides on and loops
      const cycle = 14, p = reduced ? 0.5 : (s % cycle) / cycle;
      const rx = Math.round(-30 + p * (W + 60)), ry = 72 + (reduced ? 0 : Math.round(Math.abs(Math.sin(s * 8)) * -1));
      const gallop = Math.floor(s * 8) % 2 === 0;
      drawMap(ctx, RIDER.body, RIDER.colors, rx, ry - 12);
      drawMap(ctx, gallop ? RIDER.legsA : RIDER.legsB, RIDER.colors, rx, ry);
      // shadow
      ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.fillRect(rx + 3, ry + 3, 20, 1);
      // letters flying out of the saddle bag
      if (!reduced && Math.random() < 0.08 && rx > 0 && rx < W) letters.push({ x: rx + 17, y: ry - 7, vx: -0.35 - Math.random() * 0.3, vy: -0.25 - Math.random() * 0.2, life: 1, ph: Math.random() * 6 });
      for (const l of letters) { l.x += l.vx; l.y += l.vy + Math.sin(s * 3 + l.ph) * 0.2; l.life -= 0.006; envelope(ctx, Math.round(l.x), Math.round(l.y), l.life); }
      for (let i = letters.length - 1; i >= 0; i--) if (letters[i].life <= 0) letters.splice(i, 1);
      if (!reduced) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return { unmount() { cancelAnimationFrame(raf); canvas.remove(); } };
  }

  function rgbToHex(c) { if (c[0] === "#") return c; const m = c.match(/\d+/g).map(Number); return "#" + m.map((v) => v.toString(16).padStart(2, "0")).join(""); }
  function circle(ctx, cx, cy, r) { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r) ctx.fillRect(Math.round(cx + x), Math.round(cy + y), 1, 1); }
  function cloud(ctx, x, y) { const px = Math.round(x % (W + 30)) - 15; ctx.fillRect(px, y + 2, 16, 3); ctx.fillRect(px + 3, y, 7, 2); ctx.fillRect(px + 9, y + 1, 5, 1); }
  function hills(ctx, base, amp, f) { for (let x = 0; x < W; x++) { const h = Math.round(amp * (0.6 + 0.4 * Math.sin(x / (9 * f)) * Math.cos(x / (23 * f)) + 0.3 * Math.sin(x / (5 * f)))); ctx.fillRect(x, base - h, 1, 100); } }
  function pine(ctx, x, y, h, dark, light) { for (let i = 0; i < h; i++) { const w = Math.floor(i / 2) + 1; ctx.fillStyle = i % 3 === 0 ? light : dark; ctx.fillRect(x - w, y - h + i, w * 2 + 1, 1); } ctx.fillStyle = "#3A2A1E"; ctx.fillRect(x, y, 1, 3); }
  function envelope(ctx, x, y, a) { ctx.globalAlpha = Math.max(0, Math.min(1, a)); ctx.fillStyle = "#F7F3E8"; ctx.fillRect(x, y, 5, 4); ctx.fillStyle = "#C8372D"; ctx.fillRect(x + 2, y + 1, 1, 1); ctx.fillStyle = "#B8AFA0"; ctx.fillRect(x, y, 1, 1); ctx.fillRect(x + 4, y, 1, 1); ctx.globalAlpha = 1; }

  window.Intro = { mount };
})();
