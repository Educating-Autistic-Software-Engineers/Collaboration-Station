// Calm, low-motion starfield for a low-stimulation space theme.
// No shooting stars, low density, gentle twinkle only.
export function initStarfield(canvas, opts) {
  if (!canvas) return () => {};
  const options = Object.assign({
    density: 2600, twinkleAmp: 0.15, color: [230, 240, 250],
    planets: [
      { x: 0.88, y: 0.1, r: 44, ring: true, hue: [120, 150, 178], rim: [70, 95, 120] },
      { x: 0.06, y: 0.86, r: 26, ring: false, hue: [110, 135, 160], rim: [60, 82, 105] },
    ],
  }, opts || {});
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0, h = 0, stars = [], raf = null, stopped = false;

  function resize() {
    const parent = canvas.parentElement;
    w = parent.clientWidth;
    h = parent.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    generate();
  }

  function generate() {
    stars = [];
    const count = Math.min(Math.floor((w * h) / options.density), 220);
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random(), y: Math.random(),
        r: Math.random() * 0.9 + 0.3,
        o: Math.random() * 0.35 + 0.25,
        ts: Math.random() * 1.2 + 0.3,
        tp: Math.random() * Math.PI * 2,
      });
    }
  }

  function drawPlanet(p, t) {
    const driftX = Math.sin(t * 0.02) * 6;
    const driftY = Math.cos(t * 0.015) * 4;
    const px = p.x * w + driftX, py = p.y * h + driftY;
    const [hr, hg, hb] = p.hue, [rr, rg, rb] = p.rim;
    if (p.ring) {
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(-0.35);
      ctx.scale(1, 0.32);
      ctx.beginPath();
      ctx.arc(0, 0, p.r * 1.8, 0, 6.2832);
      ctx.strokeStyle = `rgba(${rr},${rg},${rb},0.28)`;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }
    const grad = ctx.createRadialGradient(px - p.r * 0.3, py - p.r * 0.3, 0, px, py, p.r);
    grad.addColorStop(0, `rgba(${hr},${hg},${hb},0.55)`);
    grad.addColorStop(1, `rgba(${rr},${rg},${rb},0.22)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, p.r, 0, 6.2832);
    ctx.fill();
  }

  function frame(ts) {
    if (stopped) return;
    ctx.clearRect(0, 0, w, h);
    const t = ts * 0.001;
    for (const p of options.planets) drawPlanet(p, t);
    const [r, g, b] = options.color;
    for (const s of stars) {
      const sx = s.x * w, sy = s.y * h;
      const twinkle = Math.sin(t * s.ts + s.tp);
      const alpha = Math.max(0, s.o + twinkle * options.twinkleAmp);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, s.r, 0, 6.2832);
      ctx.fill();
    }
    raf = requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener('resize', resize);
  raf = requestAnimationFrame(frame);

  return function stop() {
    stopped = true;
    if (raf) cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
  };
}
