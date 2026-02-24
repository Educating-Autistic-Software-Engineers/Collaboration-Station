/**
 * StarField – crisp, modern canvas-based star background with subtle nebula
 * Uses simplex-style noise for organic nebula clouds.
 * Auto-initialises on DOMContentLoaded; works on any page that has .stars elements.
 */
(function () {
    'use strict';

    /* ── Simplex-like 2D noise (self-contained, no deps) ───── */
    const Noise = (function () {
        const F2 = 0.5 * (Math.sqrt(3) - 1);
        const G2 = (3 - Math.sqrt(3)) / 6;
        const grad3 = [[1,1],[- 1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
        const perm = new Uint8Array(512);
        const permMod8 = new Uint8Array(512);
        // Seed with random permutation
        const p = new Uint8Array(256);
        for (let i = 0; i < 256; i++) p[i] = i;
        for (let i = 255; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
        for (let i = 0; i < 512; i++) { perm[i] = p[i & 255]; permMod8[i] = perm[i] & 7; }

        return {
            simplex2: function (x, y) {
                const s = (x + y) * F2;
                const i = Math.floor(x + s);
                const j = Math.floor(y + s);
                const t = (i + j) * G2;
                const X0 = i - t, Y0 = j - t;
                const x0 = x - X0, y0 = y - Y0;
                const i1 = x0 > y0 ? 1 : 0;
                const j1 = x0 > y0 ? 0 : 1;
                const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
                const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
                const ii = i & 255, jj = j & 255;
                let n0 = 0, n1 = 0, n2 = 0;
                let t0 = 0.5 - x0 * x0 - y0 * y0;
                if (t0 >= 0) { t0 *= t0; const gi = permMod8[ii + perm[jj]]; n0 = t0 * t0 * (grad3[gi][0] * x0 + grad3[gi][1] * y0); }
                let t1 = 0.5 - x1 * x1 - y1 * y1;
                if (t1 >= 0) { t1 *= t1; const gi = permMod8[ii + i1 + perm[jj + j1]]; n1 = t1 * t1 * (grad3[gi][0] * x1 + grad3[gi][1] * y1); }
                let t2 = 0.5 - x2 * x2 - y2 * y2;
                if (t2 >= 0) { t2 *= t2; const gi = permMod8[ii + 1 + perm[jj + 1]]; n2 = t2 * t2 * (grad3[gi][0] * x2 + grad3[gi][1] * y2); }
                return 70 * (n0 + n1 + n2); // range roughly -1..1
            }
        };
    })();

    function init() {
        console.log('StarField: Initializing...');
        const oldStars = document.querySelectorAll('.stars');
        console.log('StarField: Found', oldStars.length, '.stars elements');
        if (oldStars.length === 0) {
            console.warn('StarField: No .stars elements found, skipping initialization');
            return;
        }

        const parent = oldStars[0].parentElement;
        console.log('StarField: Parent element:', parent);

        /* ── create canvas ─────────────────────────────────── */
        const canvas = document.createElement('canvas');
        canvas.className = 'star-canvas';
        parent.insertBefore(canvas, oldStars[0]);

        // Remove the old star elements
        oldStars.forEach(el => el.remove());

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('StarField: Failed to get 2D canvas context');
            return;
        }
        console.log('StarField: Canvas context created successfully');
        
        const dpr = window.devicePixelRatio || 1;
        let w, h;
        let stars = [];
        let shootingStars = [];

        // Offscreen nebula texture (drawn once, composited each frame for drift)
        let nebulaCanvas = null;
        let nebulaW = 0, nebulaH = 0;

        /* ── sizing (HiDPI-aware) ──────────────────────────── */
        function resize() {
            w = canvas.parentElement === document.body
                ? window.innerWidth
                : canvas.parentElement.clientWidth;
            h = canvas.parentElement === document.body
                ? window.innerHeight
                : canvas.parentElement.clientHeight;

            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            generateStars();
            generateNebula();
        }

        /* ── nebula generation (offscreen, Perlin-based) ───── */
        function generateNebula() {
            // Render at half-res for performance, then scale up w/ bilinear filtering
            const scale = 0.5;
            nebulaW = Math.ceil(w * scale);
            nebulaH = Math.ceil(h * scale);
            nebulaCanvas = document.createElement('canvas');
            nebulaCanvas.width = nebulaW;
            nebulaCanvas.height = nebulaH;
            const nctx = nebulaCanvas.getContext('2d');
            const imgData = nctx.createImageData(nebulaW, nebulaH);
            const d = imgData.data;

            // Two nebula colour palettes blended via separate octave layers
            const freq1 = 0.0025, freq2 = 0.004, freq3 = 0.009;

            for (let y = 0; y < nebulaH; y++) {
                for (let x = 0; x < nebulaW; x++) {
                    const idx = (y * nebulaW + x) * 4;

                    // Layer 1: large feature — deep blue / purple
                    const n1 = (Noise.simplex2(x * freq1, y * freq1) + 1) * 0.5;
                    // Layer 2: warm accent — teal
                    const n2 = (Noise.simplex2(x * freq2 + 100, y * freq2 + 100) + 1) * 0.5;
                    // Layer 3: fine detail
                    const n3 = (Noise.simplex2(x * freq3 + 200, y * freq3 + 200) + 1) * 0.5;

                    const combined = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;

                    // Only show nebula where noise is above a threshold (sparse clouds)
                    const mask = Math.max(0, combined - 0.38) / 0.62;
                    const intensity = mask * mask; // ease for softness

                    // Colour blend: purple-blue → cyan-teal based on n2
                    const r = Math.round(20 + 30 * n2 * intensity);
                    const g = Math.round(15 + 45 * (1 - n1) * intensity);
                    const b = Math.round(50 + 80 * n1 * intensity);
                    const a = Math.round(intensity * 38); // very subtle (max ~15% opacity)

                    d[idx]     = r;
                    d[idx + 1] = g;
                    d[idx + 2] = b;
                    d[idx + 3] = a;
                }
            }
            nctx.putImageData(imgData, 0, 0);
        }

        /* ── star generation ───────────────────────────────── */
        function generateStars() {
            stars = [];
            const area = w * h;
            const count = Math.min(Math.floor(area / 3200), 500);

            for (let i = 0; i < count; i++) {
                const layer = Math.random();
                let radius, baseOpacity, twinkleAmp;

                if (layer < 0.6) {
                    radius = Math.random() * 0.7 + 0.2;
                    baseOpacity = Math.random() * 0.25 + 0.1;
                    twinkleAmp = 0.12;
                } else if (layer < 0.88) {
                    radius = Math.random() * 0.9 + 0.5;
                    baseOpacity = Math.random() * 0.3 + 0.3;
                    twinkleAmp = 0.22;
                } else {
                    radius = Math.random() * 1.1 + 0.7;
                    baseOpacity = Math.random() * 0.2 + 0.6;
                    twinkleAmp = 0.3;
                }

                const cr = Math.random();
                let color;
                if (cr < 0.6)       color = [255, 255, 255];
                else if (cr < 0.78) color = [190, 215, 255];
                else if (cr < 0.92) color = [210, 225, 255];
                else                color = [255, 235, 210];

                stars.push({
                    x: Math.random(), y: Math.random(),
                    r: radius, o: baseOpacity,
                    ta: twinkleAmp,
                    ts: Math.random() * 1.8 + 0.4,
                    tp: Math.random() * Math.PI * 2,
                    c: color,
                    glow: radius > 1.3
                });
            }
        }

        /* ── shooting stars ────────────────────────────────── */
        function spawnShootingStar() {
            const dir = Math.random() < 0.5 ? 1 : -1;
            shootingStars.push({
                x: Math.random() * 0.6 + 0.2,
                y: Math.random() * 0.35,
                vx: (Math.random() * 0.25 + 0.15) * dir,
                vy: Math.random() * 0.15 + 0.08,
                len: Math.random() * 70 + 30,
                life: 0,
                max: Math.random() * 50 + 30
            });
        }

        /* ── render loop ───────────────────────────────────── */
        let nextShoot = 6000 + Math.random() * 10000;
        let last = 0;

        function frame(ts) {
            const dt = last ? ts - last : 16;
            last = ts;

            ctx.clearRect(0, 0, w, h);

            const t = ts * 0.001;

            // ── draw nebula (slow drift for life) ──
            if (nebulaCanvas) {
                const driftX = Math.sin(t * 0.012) * 15;
                const driftY = Math.cos(t * 0.008) * 10;
                ctx.drawImage(nebulaCanvas, driftX, driftY, w, h);
            }

            // ── draw stars ──
            for (let i = 0, n = stars.length; i < n; i++) {
                const s = stars[i];
                const sx = s.x * w;
                const sy = s.y * h;
                const twinkle = Math.sin(t * s.ts + s.tp);
                const alpha = s.o + twinkle * s.ta;
                if (alpha <= 0.02) continue;

                const [r, g, b] = s.c;

                if (s.glow) {
                    const gr = s.r * 5;
                    const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, gr);
                    grad.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',' + (alpha * 0.22) + ')');
                    grad.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(sx, sy, gr, 0, 6.2832);
                    ctx.fill();
                }

                ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
                ctx.beginPath();
                ctx.arc(sx, sy, s.r, 0, 6.2832);
                ctx.fill();
            }

            // ── shooting stars ──
            nextShoot -= dt;
            if (nextShoot <= 0) {
                spawnShootingStar();
                nextShoot = 7000 + Math.random() * 14000;
            }

            for (let i = shootingStars.length - 1; i >= 0; i--) {
                const ss = shootingStars[i];
                ss.life++;
                ss.x += ss.vx * dt * 0.001;
                ss.y += ss.vy * dt * 0.001;

                const prog = ss.life / ss.max;
                const a = prog < 0.25
                    ? prog / 0.25
                    : prog > 0.65
                        ? (1 - prog) / 0.35
                        : 1;

                if (ss.life >= ss.max || a <= 0) {
                    shootingStars.splice(i, 1);
                    continue;
                }

                const sx = ss.x * w;
                const sy = ss.y * h;
                const angle = Math.atan2(ss.vy, ss.vx);
                const tx = sx - Math.cos(angle) * ss.len;
                const ty = sy - Math.sin(angle) * ss.len;

                const grad = ctx.createLinearGradient(tx, ty, sx, sy);
                grad.addColorStop(0, 'rgba(255,255,255,0)');
                grad.addColorStop(0.6, 'rgba(200,220,255,' + (a * 0.25) + ')');
                grad.addColorStop(1, 'rgba(255,255,255,' + (a * 0.7) + ')');

                ctx.strokeStyle = grad;
                ctx.lineWidth = 1.5;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(tx, ty);
                ctx.lineTo(sx, sy);
                ctx.stroke();
            }

            requestAnimationFrame(frame);
        }

        /* ── kick off ──────────────────────────────────────── */
        try {
            console.log('StarField: Starting resize and animation...');
            resize();
            window.addEventListener('resize', resize);
            requestAnimationFrame(frame);
            console.log('StarField: Successfully started');
        } catch (error) {
            console.error('StarField: Error during startup:', error);
        }
    }

    /* ── bootstrap ─────────────────────────────────────── */
    console.log('StarField: Script loaded, document.readyState =', document.readyState);
    
    // Test canvas support first
    try {
        const testCanvas = document.createElement('canvas');
        const testCtx = testCanvas.getContext('2d');
        if (!testCtx) {
            console.error('StarField: Canvas 2D context not supported');
        } else {
            console.log('StarField: Canvas support verified');
        }
    } catch (e) {
        console.error('StarField: Canvas creation failed:', e);
    }
    
    try {
        if (document.readyState === 'loading') {
            console.log('StarField: Waiting for DOMContentLoaded...');
            document.addEventListener('DOMContentLoaded', function() {
                console.log('StarField: DOMContentLoaded fired, calling init()');
                init();
            });
        } else {
            console.log('StarField: DOM already ready, calling init() immediately');
            init();
        }
    } catch (error) {
        console.error('StarField: Error during initialization:', error);
    }
})();
