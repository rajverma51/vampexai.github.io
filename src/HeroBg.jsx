import { useEffect, useRef } from 'react';
import logo from './assets/logo.png';

export default function HeroBg() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animFrameId;
    let t = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Load logo image
    const logoImg = new Image();
    logoImg.src = logo;

    // --- Neural Network Nodes ---
    const NODE_COUNT = 55;
    const nodes = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0003,
      vy: (Math.random() - 0.5) * 0.0003,
      r: Math.random() * 2.5 + 1,
      pulseOffset: Math.random() * Math.PI * 2,
    }));

    // --- Floating Particles ---
    const PARTICLE_COUNT = 120;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.0002 + 0.00005,
      opacity: Math.random() * 0.7 + 0.2,
      color: Math.random() > 0.5 ? '#8b5cf6' : '#00d4ff',
      angle: Math.random() * Math.PI * 2,
    }));

    // --- Data Streams (vertical tubes) ---
    const STREAM_COUNT = 14;
    const streams = Array.from({ length: STREAM_COUNT }, (_, i) => ({
      x: (i / (STREAM_COUNT - 1)) * 0.9 + 0.05,
      segments: Array.from({ length: 12 }, (_, j) => ({
        offset: Math.random(),
        speed: Math.random() * 0.003 + 0.001,
      })),
    }));

    // --- Horizontal pipes (data tubes) ---
    const H_PIPES = [
      { y: 0.35, xStart: 0.0, xEnd: 0.38 },
      { y: 0.35, xStart: 0.62, xEnd: 1.0 },
      { y: 0.65, xStart: 0.0, xEnd: 0.38 },
      { y: 0.65, xStart: 0.62, xEnd: 1.0 },
      { y: 0.5, xStart: 0.0, xEnd: 0.28 },
      { y: 0.5, xStart: 0.72, xEnd: 1.0 },
    ];

    // Rings
    const rings = [
      { r: 0.14, speed: 0.003, phase: 0 },
      { r: 0.20, speed: -0.002, phase: 1.0 },
      { r: 0.27, speed: 0.0015, phase: 2.2 },
    ];

    function draw() {
      const W = canvas.width;
      const H = canvas.height;
      t += 0.016;

      // --- Background gradient ---
      const bg = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, W * 0.8);
      bg.addColorStop(0, '#0d0521');
      bg.addColorStop(0.4, '#070318');
      bg.addColorStop(1, '#020108');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // --- Perspective grid floor ---
      const horizon = H * 0.68;
      const vp = { x: W * 0.5, y: horizon };
      ctx.save();
      ctx.globalAlpha = 0.18;
      for (let i = -20; i <= 20; i++) {
        const x = W * 0.5 + i * W * 0.055;
        const grad = ctx.createLinearGradient(vp.x, vp.y, x, H);
        grad.addColorStop(0, '#8b5cf6');
        grad.addColorStop(1, 'transparent');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(vp.x, vp.y);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let row = 0; row < 12; row++) {
        const frac = row / 12;
        const y = horizon + (H - horizon) * (frac * frac);
        const xSpread = W * 0.5 * frac * frac;
        const grad = ctx.createLinearGradient(W * 0.5 - xSpread, y, W * 0.5 + xSpread, y);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(0.5, '#8b5cf6');
        grad.addColorStop(1, 'transparent');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(W * 0.5 - xSpread, y);
        ctx.lineTo(W * 0.5 + xSpread, y);
        ctx.stroke();
      }
      ctx.restore();

      // --- Vertical Columns (pillars) ---
      const pillars = [
        { x: 0.18, y1: 0.05, y2: 0.85 },
        { x: 0.82, y1: 0.05, y2: 0.85 },
        { x: 0.28, y1: 0.1, y2: 0.78 },
        { x: 0.72, y1: 0.1, y2: 0.78 },
      ];
      ctx.save();
      pillars.forEach(p => {
        const gx = ctx.createLinearGradient(p.x * W - 12, 0, p.x * W + 12, 0);
        gx.addColorStop(0, 'transparent');
        gx.addColorStop(0.3, 'rgba(100,80,200,0.12)');
        gx.addColorStop(0.5, 'rgba(139,92,246,0.22)');
        gx.addColorStop(0.7, 'rgba(100,80,200,0.12)');
        gx.addColorStop(1, 'transparent');
        ctx.fillStyle = gx;
        ctx.fillRect(p.x * W - 12, p.y1 * H, 24, (p.y2 - p.y1) * H);

        // flowing energy on pillar
        for (let j = 0; j < 6; j++) {
          const yFrac = ((t * 0.3 + j * 0.18) % 1);
          const py = p.y1 * H + yFrac * (p.y2 - p.y1) * H;
          ctx.globalAlpha = 0.6 * Math.sin(yFrac * Math.PI);
          ctx.fillStyle = '#8b5cf6';
          ctx.beginPath();
          ctx.arc(p.x * W, py, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      });
      ctx.restore();

      // --- Horizontal Pipes ---
      ctx.save();
      H_PIPES.forEach(pipe => {
        const grad = ctx.createLinearGradient(pipe.xStart * W, 0, pipe.xEnd * W, 0);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(0.3, 'rgba(139,92,246,0.25)');
        grad.addColorStop(0.7, 'rgba(0,212,255,0.2)');
        grad.addColorStop(1, 'transparent');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(pipe.xStart * W, pipe.y * H);
        ctx.lineTo(pipe.xEnd * W, pipe.y * H);
        ctx.stroke();

        // Moving energy dot on pipe
        const progress = (t * 0.25) % 1;
        const dX = pipe.xStart * W + progress * (pipe.xEnd - pipe.xStart) * W;
        ctx.globalAlpha = 0.9;
        const dotGrad = ctx.createRadialGradient(dX, pipe.y * H, 0, dX, pipe.y * H, 8);
        dotGrad.addColorStop(0, '#ffffff');
        dotGrad.addColorStop(0.3, '#00d4ff');
        dotGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = dotGrad;
        ctx.beginPath();
        ctx.arc(dX, pipe.y * H, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });
      ctx.restore();

      // --- Neural Network Lines ---
      ctx.save();
      nodes.forEach(n => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > 1) n.vx *= -1;
        if (n.y < 0 || n.y > 1) n.vy *= -1;
      });
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = (nodes[i].x - nodes[j].x) * W;
          const dy = (nodes[i].y - nodes[j].y) * H;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            const alpha = (1 - dist / 180) * 0.35;
            const pulse = (Math.sin(t * 1.5 + nodes[i].pulseOffset) + 1) / 2;
            ctx.globalAlpha = alpha * (0.5 + 0.5 * pulse);
            ctx.strokeStyle = Math.random() > 0.5 ? '#8b5cf6' : '#00d4ff';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x * W, nodes[i].y * H);
            ctx.lineTo(nodes[j].x * W, nodes[j].y * H);
            ctx.stroke();
          }
        }
      }
      // Node dots
      nodes.forEach(n => {
        const pulse = (Math.sin(t * 2 + n.pulseOffset) + 1) / 2;
        ctx.globalAlpha = 0.5 + 0.5 * pulse;
        const g = ctx.createRadialGradient(n.x * W, n.y * H, 0, n.x * W, n.y * H, n.r * 4);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.4, '#8b5cf6');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(n.x * W, n.y * H, n.r * 3, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.restore();

      // --- Floating Particles ---
      ctx.save();
      particles.forEach(p => {
        p.x += Math.cos(p.angle) * p.speed;
        p.y += Math.sin(p.angle) * p.speed - 0.0001;
        if (p.y < -0.05) p.y = 1.05;
        if (p.x < -0.05) p.x = 1.05;
        if (p.x > 1.05) p.x = -0.05;
        const flicker = 0.6 + 0.4 * Math.sin(t * 3 + p.x * 100);
        ctx.globalAlpha = p.opacity * flicker;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.restore();

      // --- Holographic Rings around center ---
      const cx = W * 0.5, cy = H * 0.38;
      ctx.save();
      rings.forEach((ring, idx) => {
        const angle = t * ring.speed * 60 + ring.phase;
        const rx = ring.r * W;
        const ry = ring.r * W * 0.32;
        ctx.globalAlpha = 0.35 + 0.15 * Math.sin(t + idx);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle * 0.3);
        ctx.scale(1, 0.4);
        ctx.beginPath();
        ctx.arc(0, 0, rx, 0, Math.PI * 2);
        const rGrad = ctx.createLinearGradient(-rx, 0, rx, 0);
        rGrad.addColorStop(0, 'transparent');
        rGrad.addColorStop(0.25, '#8b5cf6');
        rGrad.addColorStop(0.5, '#00d4ff');
        rGrad.addColorStop(0.75, '#8b5cf6');
        rGrad.addColorStop(1, 'transparent');
        ctx.strokeStyle = rGrad;
        ctx.lineWidth = idx === 0 ? 2 : 1.2;
        ctx.stroke();
        ctx.restore();
      });
      ctx.globalAlpha = 1;
      ctx.restore();

      // --- Central volumetric glow ---
      ctx.save();
      const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.28);
      bloom.addColorStop(0, 'rgba(139,92,246,0.22)');
      bloom.addColorStop(0.3, 'rgba(0,212,255,0.08)');
      bloom.addColorStop(1, 'transparent');
      ctx.fillStyle = bloom;
      ctx.beginPath();
      ctx.arc(cx, cy, W * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // --- Light streaks ---
      ctx.save();
      for (let i = 0; i < 5; i++) {
        const streak_t = (t * 0.18 + i * 0.22) % 1;
        const sx = cx + (Math.cos(i * 1.3) * W * 0.4);
        const ex = cx;
        const sy = cy + (Math.sin(i * 1.3) * H * 0.3);
        const ey = cy;
        const alpha = Math.sin(streak_t * Math.PI) * 0.25;
        const lg = ctx.createLinearGradient(sx, sy, ex, ey);
        lg.addColorStop(0, 'transparent');
        lg.addColorStop(1, `rgba(139,92,246,${alpha})`);
        ctx.strokeStyle = lg;
        ctx.lineWidth = 1;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // --- Frame/portal arch ---
      ctx.save();
      const archW = W * 0.42, archH = H * 0.62;
      const ax = cx - archW / 2, ay = cy - archH * 0.55;
      const archGrad = ctx.createLinearGradient(ax, ay, ax + archW, ay);
      archGrad.addColorStop(0, 'rgba(0,212,255,0.0)');
      archGrad.addColorStop(0.1, 'rgba(139,92,246,0.5)');
      archGrad.addColorStop(0.5, 'rgba(0,212,255,0.7)');
      archGrad.addColorStop(0.9, 'rgba(139,92,246,0.5)');
      archGrad.addColorStop(1, 'rgba(0,212,255,0.0)');
      ctx.strokeStyle = archGrad;
      ctx.lineWidth = 2;
      const pulse = 0.7 + 0.3 * Math.sin(t * 1.5);
      ctx.globalAlpha = pulse;
      // Top bar
      ctx.beginPath();
      ctx.moveTo(ax + 18, ay);
      ctx.lineTo(ax + archW - 18, ay);
      ctx.stroke();
      // Left bar
      ctx.beginPath();
      ctx.moveTo(ax, ay + 15);
      ctx.lineTo(ax, ay + archH);
      ctx.stroke();
      // Right bar
      ctx.beginPath();
      ctx.moveTo(ax + archW, ay + 15);
      ctx.lineTo(ax + archW, ay + archH);
      ctx.stroke();
      // Corner accents
      ['tl', 'tr', 'bl', 'br'].forEach(corner => {
        const bx = corner.includes('l') ? ax : ax + archW;
        const by = corner.includes('t') ? ay : ay + archH;
        const dx = corner.includes('l') ? 1 : -1;
        const dy = corner.includes('t') ? 1 : -1;
        ctx.beginPath();
        ctx.moveTo(bx, by + dy * 25);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx + dx * 25, by);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
      ctx.restore();

      // --- Logo ---
      if (logoImg.complete && logoImg.naturalWidth > 0) {
        const logoSize = W * 0.12;
        const logoX = cx - logoSize / 2;
        const logoY = cy - logoSize * 1.0;
        // Halo behind logo
        ctx.save();
        const halo = ctx.createRadialGradient(cx, cy - logoSize * 0.45, 0, cx, cy - logoSize * 0.45, logoSize * 1.1);
        halo.addColorStop(0, 'rgba(139,92,246,0.45)');
        halo.addColorStop(0.5, 'rgba(0,212,255,0.15)');
        halo.addColorStop(1, 'transparent');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(cx, cy - logoSize * 0.45, logoSize * 1.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        // Draw logo
        ctx.save();
        ctx.globalAlpha = 0.95;
        ctx.shadowColor = '#8b5cf6';
        ctx.shadowBlur = 30 + 15 * Math.sin(t * 1.5);
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
        ctx.restore();
        
        // --- "VampExAi" Text ---
        ctx.save();
        const fontSize = W * 0.038;
        ctx.font = `900 ${fontSize}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        const textY = cy + logoSize * 0.2;
        // Text glow
        ctx.shadowColor = '#00d4ff';
        ctx.shadowBlur = 20 + 10 * Math.sin(t);
        const textGrad = ctx.createLinearGradient(cx - W * 0.12, 0, cx + W * 0.12, 0);
        textGrad.addColorStop(0, '#8b5cf6');
        textGrad.addColorStop(0.5, '#00d4ff');
        textGrad.addColorStop(1, '#8b5cf6');
        ctx.fillStyle = textGrad;
        ctx.globalAlpha = 0.95;
        ctx.fillText('VampExAi', cx, textY);
        ctx.restore();
      }

      animFrameId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animFrameId);
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
