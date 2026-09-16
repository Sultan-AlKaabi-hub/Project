// Scenic bitmap + independent pixel animation layers. No layout work in the animation loop.
(function () {
  const palette = {
    outline: "#292535",
    dark: "#654039",
    body: "#ad7552",
    light: "#dbad72",
    mane: "#352e38",
    gold: "#f6d397",
    purple: "#654899",
    cloak: "#9970cf",
    skin: "#efbb8d",
    steel: "#b6d0d0",
  };
  function mount(container) {
    container.classList.add("pixel-world");
    const landscape = document.createElement("img");
    landscape.src = "/art/valley.png";
    landscape.alt = "";
    landscape.className = "world-landscape";
    landscape.draggable = false;
    landscape.decoding = "async";
    landscape.fetchPriority = "high";
    const mist = document.createElement("div");
    mist.className = "world-mist";
    const canvas = document.createElement("canvas");
    canvas.className = "world-motion";
    canvas.setAttribute("aria-hidden", "true");
    container.append(landscape, mist, canvas);
    const toggle = document.createElement("button");
    toggle.className = "scene-toggle";
    toggle.type = "button";
    container.parentElement.append(toggle);
    const ctx = canvas.getContext("2d"),
      motion = matchMedia("(prefers-reduced-motion: reduce)");
    let W = 640,
      H = 360,
      raf = 0,
      last = 0,
      elapsed = 0,
      active = true, paused = false, lastPaint = 0;
    const still = () => motion.matches || paused;
    const rect = (color, x, y, w, h) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x), Math.round(y), w, h);
    };
    const poly = (color, points) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      points.forEach(([x, y], i) =>
        i
          ? ctx.lineTo(Math.round(x), Math.round(y))
          : ctx.moveTo(Math.round(x), Math.round(y)),
      );
      ctx.closePath();
      ctx.fill();
    };
    function horse(x, y, t) {
      const beat = t * 10,
        bob = motion.matches ? 0 : Math.round(Math.sin(beat) * 1.2);
      ctx.save();
      ctx.translate(Math.round(x), Math.round(y));
      rect("#273d394d", 4, 2, 42, 2);
      // Four articulated legs: the far pair is darker and offset in the gallop cycle.
      for (let i = 0; i < 4; i++) {
        const hip = i < 2 ? 12 : 35,
          phase = beat + i * 2.2,
          swing = motion.matches ? 0 : Math.sin(phase) * 7,
          lift = motion.matches ? 0 : Math.max(0, Math.cos(phase)) * 5;
        poly(i % 2 ? palette.dark : palette.body, [
          [hip, -13 + bob],
          [hip + 4, -13 + bob],
          [hip + 4 + swing * 0.5, -6],
          [hip + swing, 1 - lift],
          [hip + swing - 3, 1 - lift],
          [hip + swing * 0.4, -7],
        ]);
        rect(palette.outline, hip + swing - 3, 1 - lift, 5, 2);
      }
      ctx.translate(0, bob);
      // Tail, flank, barrel, shoulder and upright neck, outlined in one silhouette.
      poly(palette.mane, [
        [8, -25],
        [1, -25],
        [-5, -19],
        [-11, -20],
        [-6, -16],
        [3, -17],
        [11, -23],
      ]);
      poly(palette.outline, [
        [7, -26],
        [29, -29],
        [38, -26],
        [40, -35],
        [43, -40],
        [44, -48],
        [47, -43],
        [51, -42],
        [56, -36],
        [61, -34],
        [61, -29],
        [55, -27],
        [48, -29],
        [43, -14],
        [36, -11],
        [17, -11],
        [8, -16],
        [5, -22],
      ]);
      poly(palette.body, [
        [9, -25],
        [26, -27],
        [37, -24],
        [43, -34],
        [45, -41],
        [50, -40],
        [53, -35],
        [59, -33],
        [59, -30],
        [53, -29],
        [47, -32],
        [42, -17],
        [35, -13],
        [18, -13],
        [10, -17],
        [7, -22],
      ]);
      poly(palette.light, [
        [11, -24],
        [29, -26],
        [37, -23],
        [35, -20],
        [17, -19],
        [10, -21],
      ]);
      poly(palette.dark, [
        [11, -17],
        [20, -15],
        [35, -15],
        [41, -20],
        [39, -14],
        [18, -12],
      ]);
      poly(palette.mane, [
        [39, -28],
        [40, -37],
        [44, -43],
        [47, -43],
        [45, -35],
        [42, -26],
      ]);
      rect(palette.gold, 48, -39, 3, 3);
      rect(palette.outline, 51, -37, 2, 2);
      rect(palette.dark, 57, -31, 2, 1);
      // Bridle and rein.
      rect(palette.gold, 54, -33, 1, 5);
      poly(palette.outline, [
        [54, -28],
        [53, -27],
        [35, -33],
        [35, -34],
      ]);
      rect(palette.purple, 19, -28, 15, 6);
      rect(palette.gold, 20, -27, 12, 1);
      rect(palette.dark, 21, -25, 4, 12);
      // Rider in violet cloak, with silver helmet and a gold-edged saddle bag.
      poly(palette.purple, [
        [23, -44],
        [19, -39],
        [9, -35],
        [14, -31],
        [24, -29],
        [29, -31],
        [30, -42],
      ]);
      poly(palette.cloak, [
        [23, -43],
        [19, -38],
        [13, -35],
        [24, -33],
        [27, -38],
      ]);
      rect(palette.outline, 26, -42, 6, 14);
      rect(palette.steel, 27, -41, 4, 7);
      poly(palette.steel, [
        [30, -40],
        [35, -34],
        [39, -33],
        [38, -31],
        [33, -32],
        [28, -37],
      ]);
      rect(palette.skin, 37, -34, 3, 2);
      rect(palette.dark, 28, -29, 5, 12);
      rect(palette.outline, 28, -18, 8, 3);
      rect(palette.outline, 25, -53, 9, 11);
      rect(palette.steel, 25, -53, 8, 6);
      rect(palette.gold, 26, -54, 6, 2);
      rect(palette.skin, 29, -47, 5, 4);
      rect(palette.outline, 32, -47, 2, 1);
      rect(palette.purple, 22, -55, 5, 3);
      rect(palette.cloak, 19, -56, 5, 2);
      rect(palette.dark, 12, -25, 7, 8);
      rect(palette.gold, 13, -24, 5, 1);
      rect(palette.gold, 15, -21, 2, 2);
      ctx.restore();
    }
    function cart(x, y, t) {
      ctx.save();
      ctx.translate(Math.round(x - 83), Math.round(y));
      const bob = still() ? 0 : Math.round(Math.sin(t * 10) * .6);
      // A brass chassis, two independently turning wheels and visible towing shaft.
      rect("#172d3555", 5, 4, 65, 3);
      rect("#af8150", 57, -14, 38, 3);
      ctx.save(); ctx.translate(0, bob);
      rect("#213642", 4, -21, 61, 14);
      rect("#d5a56a", 2, -22, 65, 3);
      rect("#6b4f3a", 4, -13, 61, 4);
      for(let i=0;i<6;i++) rect("#bd965f", 7+i*10, -19, 2, 7);
      // Computer, keyboard and a tiny connected-node diagram on its luminous screen.
      rect("#182c37", 8, -48, 27, 23);
      rect("#91e5cf", 10, -46, 23, 17);
      rect("#194652", 12, -43, 19, 11);
      rect("#80ddbe", 14, -41, 4, 3); rect("#eacc85", 25, -35, 4, 2);
      rect("#80ddbe", 17, -38, 10, 1); rect("#80ddbe", 24, -38, 1, 4);
      rect("#a8bfc0", 20, -25, 4, 3); rect("#d8e4d6", 12, -23, 24, 2);
      // Three server blades, ventilation fins and gentle activity lights.
      rect("#182c37", 40, -55, 22, 33);
      rect("#698d97", 41, -54, 20, 2);
      for(let i=0;i<3;i++) {
        rect("#355763", 42, -50+i*9, 18, 7);
        rect("#abc1c3", 44, -48+i*9, 9, 1);
        rect("#abc1c3", 44, -46+i*9, 7, 1);
        rect(still() || Math.sin(t*2+i)>0 ? "#89efd0":"#518d80", 56, -48+i*9, 2, 3);
      }
      // Signal mast and network orb: readable without flashing or strobing.
      rect("#d5a56a", 63, -63, 2, 41);
      rect("#8ee3ce", 61, -65, 6, 5);
      ctx.restore();
      for(const wx of [15,55]) {
        ctx.save();ctx.translate(wx,-3);
        ctx.fillStyle="#202c37";ctx.beginPath();ctx.arc(0,0,9,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle="#d9ac73";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,6,0,Math.PI*2);ctx.stroke();
        ctx.rotate(still()?0:t*3);
        rect("#d9ac73",-6,-1,12,2);rect("#d9ac73",-1,-6,2,12);
        rect("#f9dfad",-2,-2,4,4);ctx.restore();
      }
      ctx.restore();
    }
    function draw(ts) {
      if (!active || document.hidden) return;
      if (!still() && ts-lastPaint<32) { raf=requestAnimationFrame(draw);return; }
      lastPaint=ts;
      if (last && !document.hidden) elapsed += Math.min(ts - last, 60) / 1000;
      last = ts;
      const t = motion.matches ? 0 : elapsed;
      ctx.clearRect(0, 0, W, H);
      // Small distant birds and light motes at different speeds create depth.
      for (let i = 0; i < 5; i++) {
        const x = ((W * 0.2 + i * 83 + t * (3 + i)) % (W + 20)) - 10,
          y = H * 0.22 + Math.sin(t * 0.7 + i) * 3 + i * 6;
        rect("#635970", x, y, 2, 1);
        rect("#635970", x + 2, y + 1, 2, 1);
        rect("#635970", x + 4, y, 2, 1);
      }
      const p = motion.matches ? 0.58 : (t / 24 + 0.32) % 1,
        x = -80 + p * (W + 250),
        y = H * 0.885;
      cart(x, y, t);
      horse(x, y, t);
      canvas.dataset.riderX = String(Math.round(x));
      for (let i = 0; i < 28; i++) {
        const xx = (i * 73 - t * (6 + (i % 3))) % (W + 100),
          yy = H * 0.87 + Math.sin(i * 3 + t * 0.6) * H * 0.08;
        rect(i % 3 ? "#e8dca988" : "#fff1c5aa", xx, yy, 1 + (i % 2), 1);
      }
      // Foreground grass travels faster than distant birds; layered over the rider's hooves.
      for (let i = 0; i < 22; i++) {
        const xx = ((((i * 47 - t * 12) % (W + 60)) + W + 60) % (W + 60)) - 30,
          yy = H - 4 - (i % 3) * 2;
        rect("#173e38", xx, yy, 2, 6);
        rect("#316951", xx + 3, yy + 2, 2, 4);
      }
      if (!still()) raf = requestAnimationFrame(draw);
    }
    function resize() {
      W = Math.max(320, Math.round(container.clientWidth / 2));
      H = Math.max(160, Math.round(container.clientHeight / 2));
      canvas.width = W;
      canvas.height = H;
      ctx.imageSmoothingEnabled = false;
      if (still()) draw(performance.now());
    }
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    raf = requestAnimationFrame(draw);
    const restart = () => {
      cancelAnimationFrame(raf);
      last = 0; lastPaint = 0;
      container.classList.toggle('scene-paused',still() || document.hidden);
      toggle.textContent = document.documentElement.lang==='ar' ? (still()?'تشغيل المشهد':'إيقاف الحركة') : (still()?'Play scene':'Pause motion');
      toggle.disabled = motion.matches;
      toggle.setAttribute('aria-pressed',String(still()));
      raf = requestAnimationFrame(draw);
    };
    toggle.onclick=()=>{paused=!paused;restart();};
    document.addEventListener('visibilitychange',restart);
    motion.addEventListener("change", restart);
    restart();
    return {
      unmount() {
        active = false;
        observer.disconnect();
        motion.removeEventListener("change", restart);
        document.removeEventListener('visibilitychange',restart);
        cancelAnimationFrame(raf);
        landscape.remove();
        mist.remove();
        canvas.remove();
        toggle.remove();
      },
    };
  }
  window.Intro = { mount };
})();
