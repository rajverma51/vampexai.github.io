import { useEffect, useRef } from 'react';
import logo from './assets/logo.png';

export default function HeroBg() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    let t = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const logoImg = new Image();
    logoImg.src = logo;

    // Particles
    const PARTS = 100;
    const parts = Array.from({ length: PARTS }, () => ({
      x: Math.random() * 2000,
      y: Math.random() * 1000,
      r: Math.random() * 1.8 + 0.4,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -Math.random() * 0.4 - 0.1,
      a: Math.random(),
      c: Math.random() > 0.5 ? [139, 92, 246] : [0, 212, 255],
    }));

    // Neural nodes (keeping edge areas only to not overpower pillars)
    const nodes = Array.from({ length: 40 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0002,
      vy: (Math.random() - 0.5) * 0.0002,
      r: Math.random() * 1.5 + 0.5,
      ph: Math.random() * Math.PI * 2,
    }));

    function drawPillar(x, y1, y2, width, side) {
      const W = canvas.width, H = canvas.height;
      const px = x * W, ph1 = y1 * H, ph2 = y2 * H;
      const hw = width * W;

      // Main pillar body gradient
      const bodyGrad = ctx.createLinearGradient(px - hw, 0, px + hw, 0);
      if (side === 'L') {
        bodyGrad.addColorStop(0, 'rgba(0,0,0,0)');
        bodyGrad.addColorStop(0.3, 'rgba(60,30,120,0.35)');
        bodyGrad.addColorStop(0.7, 'rgba(100,50,200,0.55)');
        bodyGrad.addColorStop(0.9, 'rgba(139,92,246,0.7)');
        bodyGrad.addColorStop(1, 'rgba(180,120,255,0.4)');
      } else {
        bodyGrad.addColorStop(0, 'rgba(180,120,255,0.4)');
        bodyGrad.addColorStop(0.1, 'rgba(139,92,246,0.7)');
        bodyGrad.addColorStop(0.3, 'rgba(100,50,200,0.55)');
        bodyGrad.addColorStop(0.7, 'rgba(60,30,120,0.35)');
        bodyGrad.addColorStop(1, 'rgba(0,0,0,0)');
      }
      ctx.fillStyle = bodyGrad;
      ctx.fillRect(px - hw, ph1, hw * 2, ph2 - ph1);

      // Bright edge line
      const edgeX = side === 'L' ? px + hw * 0.85 : px - hw * 0.85;
      const edgeGrad = ctx.createLinearGradient(0, ph1, 0, ph2);
      edgeGrad.addColorStop(0, 'rgba(139,92,246,0)');
      edgeGrad.addColorStop(0.1, 'rgba(200,150,255,0.9)');
      edgeGrad.addColorStop(0.5, 'rgba(139,92,246,0.9)');
      edgeGrad.addColorStop(0.9, 'rgba(200,150,255,0.9)');
      edgeGrad.addColorStop(1, 'rgba(139,92,246,0)');
      ctx.save();
      ctx.strokeStyle = edgeGrad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(edgeX, ph1);
      ctx.lineTo(edgeX, ph2);
      ctx.stroke();
      ctx.restore();

      // Animated energy packets flowing down pillar
      for (let i = 0; i < 5; i++) {
        const progress = ((t * 0.5 + i * 0.22) % 1.0);
        const py = ph1 + progress * (ph2 - ph1);
        const alpha = Math.sin(progress * Math.PI) * 0.9;
        ctx.save();
        const glowGrad = ctx.createRadialGradient(edgeX, py, 0, edgeX, py, 10);
        glowGrad.addColorStop(0, `rgba(255,255,255,${alpha})`);
        glowGrad.addColorStop(0.4, `rgba(139,92,246,${alpha * 0.8})`);
        glowGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(edgeX, py, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Horizontal rings / bands on pillar
      const bandCount = 8;
      for (let b = 0; b < bandCount; b++) {
        const by = ph1 + (b / (bandCount - 1)) * (ph2 - ph1);
        const bandAlpha = 0.3 + 0.1 * Math.sin(t + b);
        ctx.save();
        ctx.globalAlpha = bandAlpha;
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px - hw, by);
        ctx.lineTo(px + hw, by);
        ctx.stroke();
        ctx.restore();
      }
    }

    function drawHorzPipe(y, xStart, xEnd, offset) {
      const W = canvas.width, H = canvas.height;
      const py = y * H;
      const pxS = xStart * W, pxE = xEnd * W;

      // Tube body
      const tubeGrad = ctx.createLinearGradient(pxS, py - 4, pxS, py + 4);
      tubeGrad.addColorStop(0, 'rgba(139,92,246,0.1)');
      tubeGrad.addColorStop(0.5, 'rgba(100,180,255,0.35)');
      tubeGrad.addColorStop(1, 'rgba(139,92,246,0.1)');
      ctx.save();
      ctx.strokeStyle = tubeGrad;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(pxS, py);
      ctx.lineTo(pxE, py);
      ctx.stroke();

      // Bright top highlight
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = 'rgba(200,220,255,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pxS, py - 2);
      ctx.lineTo(pxE, py - 2);
      ctx.stroke();
      ctx.restore();

      // Moving packet on pipe
      const prog = ((t * 0.35 + offset) % 1);
      const dotX = pxS + prog * (pxE - pxS);
      const dotAlpha = Math.sin(prog * Math.PI) * 0.95;
      ctx.save();
      ctx.globalAlpha = dotAlpha;
      const dg = ctx.createRadialGradient(dotX, py, 0, dotX, py, 12);
      dg.addColorStop(0, '#ffffff');
      dg.addColorStop(0.3, '#00d4ff');
      dg.addColorStop(1, 'transparent');
      ctx.fillStyle = dg;
      ctx.beginPath();
      ctx.arc(dotX, py, 12, 0, Math.PI * 2);
      ctx.fill();
      // Tail
      ctx.globalAlpha = dotAlpha * 0.3;
      const tailGrad = ctx.createLinearGradient(dotX - 40, py, dotX, py);
      tailGrad.addColorStop(0, 'transparent');
      tailGrad.addColorStop(1, '#00d4ff');
      ctx.strokeStyle = tailGrad;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(dotX - 40, py);
      ctx.lineTo(dotX, py);
      ctx.stroke();
      ctx.restore();
    }

    function draw() {
      const W = canvas.width, H = canvas.height;
      t += 0.012;

      // --- DARK BG ---
      ctx.fillStyle = '#050115';
      ctx.fillRect(0, 0, W, H);

      // Radial ambient light from center
      const ambient = ctx.createRadialGradient(W * 0.5, H * 0.42, 0, W * 0.5, H * 0.42, W * 0.65);
      ambient.addColorStop(0, 'rgba(80,30,160,0.35)');
      ambient.addColorStop(0.4, 'rgba(30,10,80,0.2)');
      ambient.addColorStop(1, 'transparent');
      ctx.fillStyle = ambient;
      ctx.fillRect(0, 0, W, H);

      // ==== PERSPECTIVE GRID FLOOR ====
      const horizon = H * 0.72;
      ctx.save();
      ctx.globalAlpha = 0.22;
      // Vertical lines (converging to center)
      const VP = { x: W * 0.5, y: horizon };
      for (let i = -24; i <= 24; i++) {
        const fx = W * 0.5 + i * W * 0.05;
        const grad = ctx.createLinearGradient(VP.x, VP.y, fx, H);
        grad.addColorStop(0, '#8b5cf6');
        grad.addColorStop(1, 'rgba(139,92,246,0.05)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(VP.x, VP.y);
        ctx.lineTo(fx, H);
        ctx.stroke();
      }
      // Horizontal lines
      for (let row = 0; row <= 16; row++) {
        const frac = row / 16;
        const fy = horizon + (H - horizon) * (frac * frac);
        const spread = W * 0.5 * frac;
        const gg = ctx.createLinearGradient(VP.x - spread, fy, VP.x + spread, fy);
        gg.addColorStop(0, 'transparent');
        gg.addColorStop(0.5, '#8b5cf6');
        gg.addColorStop(1, 'transparent');
        ctx.strokeStyle = gg;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(VP.x - spread, fy);
        ctx.lineTo(VP.x + spread, fy);
        ctx.stroke();
      }
      ctx.restore();

      // ==== PILLARS ====
      // Left outer pillar
      drawPillar(0.14, 0.04, 0.92, 0.055, 'L');
      // Left inner pillar
      drawPillar(0.27, 0.07, 0.80, 0.038, 'L');
      // Right inner pillar
      drawPillar(0.73, 0.07, 0.80, 0.038, 'R');
      // Right outer pillar
      drawPillar(0.86, 0.04, 0.92, 0.055, 'R');

      // ==== HORIZONTAL PIPES ====
      drawHorzPipe(0.32, 0.0, 0.35, 0.0);
      drawHorzPipe(0.32, 0.65, 1.0, 0.5);
      drawHorzPipe(0.48, 0.0, 0.28, 0.2);
      drawHorzPipe(0.48, 0.72, 1.0, 0.7);
      drawHorzPipe(0.64, 0.0, 0.35, 0.4);
      drawHorzPipe(0.64, 0.65, 1.0, 0.9);

      // ==== NEURAL NETWORK ====
      ctx.save();
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > 1) n.vx *= -1;
        if (n.y < 0 || n.y > 1) n.vy *= -1;
      });
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = (nodes[i].x - nodes[j].x) * W;
          const dy = (nodes[i].y - nodes[j].y) * H;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 170) {
            const alpha = (1 - dist / 170) * 0.28;
            const pulse = (Math.sin(t * 1.8 + nodes[i].ph) + 1) / 2;
            ctx.globalAlpha = alpha * (0.4 + 0.6 * pulse);
            ctx.strokeStyle = Math.random() > 0.5 ? '#8b5cf6' : '#00d4ff';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x * W, nodes[i].y * H);
            ctx.lineTo(nodes[j].x * W, nodes[j].y * H);
            ctx.stroke();
          }
        }
      }
      nodes.forEach(n => {
        const pulse = (Math.sin(t * 2 + n.ph) + 1) / 2;
        ctx.globalAlpha = 0.5 + 0.5 * pulse;
        const g = ctx.createRadialGradient(n.x * W, n.y * H, 0, n.x * W, n.y * H, 5);
        g.addColorStop(0, '#fff');
        g.addColorStop(0.5, '#8b5cf6');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(n.x * W, n.y * H, 5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.restore();

      // ==== PARTICLES ====
      ctx.save();
      parts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        const flicker = 0.5 + 0.5 * Math.sin(t * 3 + p.x * 0.05);
        ctx.globalAlpha = p.a * flicker;
        ctx.fillStyle = `rgba(${p.c[0]},${p.c[1]},${p.c[2]},1)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.restore();

      // ==== CENTER PORTAL FRAME ====
      const cx = W * 0.5, cy = H * 0.40;
      const fW = W * 0.44, fH = H * 0.64;
      const fx = cx - fW / 2, fy = cy - fH * 0.52;
      const framePulse = 0.6 + 0.4 * Math.sin(t * 1.2);

      ctx.save();
      ctx.globalAlpha = framePulse;
      const fGrad = ctx.createLinearGradient(fx, fy, fx + fW, fy);
      fGrad.addColorStop(0, 'rgba(0,212,255,0.0)');
      fGrad.addColorStop(0.1, 'rgba(139,92,246,0.8)');
      fGrad.addColorStop(0.5, 'rgba(0,212,255,0.9)');
      fGrad.addColorStop(0.9, 'rgba(139,92,246,0.8)');
      fGrad.addColorStop(1, 'rgba(0,212,255,0.0)');
      ctx.strokeStyle = fGrad;
      ctx.lineWidth = 2.5;
      // Top
      ctx.beginPath(); ctx.moveTo(fx + 20, fy); ctx.lineTo(fx + fW - 20, fy); ctx.stroke();
      // Bottom
      ctx.beginPath(); ctx.moveTo(fx + 20, fy + fH); ctx.lineTo(fx + fW - 20, fy + fH); ctx.stroke();
      // Left
      ctx.beginPath(); ctx.moveTo(fx, fy + 20); ctx.lineTo(fx, fy + fH - 20); ctx.stroke();
      // Right
      ctx.beginPath(); ctx.moveTo(fx + fW, fy + 20); ctx.lineTo(fx + fW, fy + fH - 20); ctx.stroke();

      // Corner brackets
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.9;
      [[fx, fy, 1, 1], [fx + fW, fy, -1, 1], [fx, fy + fH, 1, -1], [fx + fW, fy + fH, -1, -1]].forEach(([bx, by, dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(bx, by + dy * 30);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx + dx * 30, by);
        ctx.stroke();
      });
      ctx.restore();

      // ==== HOLOGRAPHIC RINGS ====
      ctx.save();
      const rings = [
        { rW: 0.13, rH: 0.065, speed: 0.7, phase: 0, color: '#8b5cf6', lw: 2.5 },
        { rW: 0.19, rH: 0.095, speed: -0.45, phase: 1.2, color: '#00d4ff', lw: 1.5 },
        { rW: 0.26, rH: 0.13, speed: 0.3, phase: 2.5, color: '#8b5cf6', lw: 1 },
      ];
      rings.forEach((ring) => {
        const angle = t * ring.speed + ring.phase;
        ctx.save();
        ctx.translate(cx, cy - H * 0.03);
        ctx.rotate(angle * 0.2);
        ctx.scale(1, 0.38);
        ctx.globalAlpha = 0.5 + 0.2 * Math.sin(t + ring.phase);
        const rg = ctx.createLinearGradient(-ring.rW * W, 0, ring.rW * W, 0);
        rg.addColorStop(0, 'transparent');
        rg.addColorStop(0.3, ring.color);
        rg.addColorStop(0.7, ring.color);
        rg.addColorStop(1, 'transparent');
        ctx.strokeStyle = rg;
        ctx.lineWidth = ring.lw;
        ctx.beginPath();
        ctx.arc(0, 0, ring.rW * W, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });
      ctx.restore();

      // ==== CENTER GLOW ====
      ctx.save();
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.32);
      glow.addColorStop(0, 'rgba(139,92,246,0.3)');
      glow.addColorStop(0.3, 'rgba(0,212,255,0.1)');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, W * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ==== LOGO ====
      if (logoImg.complete && logoImg.naturalWidth > 0) {
        const logoSize = Math.min(W, H) * 0.14;
        const lx = cx - logoSize / 2;
        const ly = cy - logoSize * 1.05;

        // Logo halo
        ctx.save();
        const halo = ctx.createRadialGradient(cx, ly + logoSize / 2, 0, cx, ly + logoSize / 2, logoSize * 1.3);
        halo.addColorStop(0, `rgba(139,92,246,${0.5 + 0.2 * Math.sin(t * 1.5)})`);
        halo.addColorStop(0.5, 'rgba(0,212,255,0.15)');
        halo.addColorStop(1, 'transparent');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(cx, ly + logoSize / 2, logoSize * 1.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Draw logo
        ctx.save();
        ctx.shadowColor = '#8b5cf6';
        ctx.shadowBlur = 35 + 20 * Math.sin(t * 1.5);
        ctx.drawImage(logoImg, lx, ly, logoSize, logoSize);
        ctx.restore();

        // VampExAi text
        ctx.save();
        const fs = Math.max(18, W * 0.0385);
        ctx.font = `900 ${fs}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        const ty = cy + logoSize * 0.22;
        ctx.shadowColor = '#00d4ff';
        ctx.shadowBlur = 25 + 10 * Math.sin(t);
        const tg = ctx.createLinearGradient(cx - W * 0.15, 0, cx + W * 0.15, 0);
        tg.addColorStop(0, '#8b5cf6');
        tg.addColorStop(0.5, '#00d4ff');
        tg.addColorStop(1, '#8b5cf6');
        ctx.fillStyle = tg;
        ctx.globalAlpha = 0.97;
        ctx.fillText('VampExAi', cx, ty);
        ctx.restore();
      }

      // Subtle scanline overlay
      ctx.save();
      ctx.globalAlpha = 0.025;
      for (let sl = 0; sl < H; sl += 3) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, sl, W, 1);
      }
      ctx.restore();

      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  );
}
