import { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

/* ─── Tiny Poisson-disk sampler (Bridson's algorithm) ─────────────── */
function poissonDisk(width, height, minDist, maxTries = 30) {
  const cellSize = minDist / Math.SQRT2;
  const cols = Math.ceil(width  / cellSize);
  const rows = Math.ceil(height / cellSize);
  const grid = new Array(cols * rows).fill(null);
  const active = [];
  const points = [];

  const gridIdx = (x, y) =>
    Math.floor(x / cellSize) + Math.floor(y / cellSize) * cols;

  const addPoint = (p) => {
    points.push(p);
    active.push(p);
    grid[gridIdx(p[0], p[1])] = p;
  };

  addPoint([width / 2, height / 2]);

  while (active.length) {
    const ri = Math.floor(Math.random() * active.length);
    const base = active[ri];
    let found = false;

    for (let t = 0; t < maxTries; t++) {
      const angle = Math.random() * Math.PI * 2;
      const r = minDist + Math.random() * minDist;
      const nx = base[0] + Math.cos(angle) * r;
      const ny = base[1] + Math.sin(angle) * r;

      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

      const col = Math.floor(nx / cellSize);
      const row = Math.floor(ny / cellSize);
      let ok = true;

      for (let dc = -2; dc <= 2 && ok; dc++) {
        for (let dr = -2; dr <= 2 && ok; dr++) {
          const nc = col + dc, nr = row + dr;
          if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) continue;
          const nb = grid[nc + nr * cols];
          if (!nb) continue;
          const dx = nb[0] - nx, dy = nb[1] - ny;
          if (dx * dx + dy * dy < minDist * minDist) ok = false;
        }
      }

      if (ok) {
        addPoint([nx, ny]);
        found = true;
        break;
      }
    }

    if (!found) active.splice(ri, 1);
  }

  return points;
}

/* ─── Interactive flow angle ──────────────────────────────────────── */
// We pass in the target object { mx, my } which holds the mouse coords
function flowAngle(x, y, t, mouse, scale = 0.002) {
  // Base multi-octave noise
  const s = scale;
  let n =
    Math.sin(x * s       + t * 0.3) * Math.cos(y * s       - t * 0.2) +
    Math.sin(x * s * 2.1 - t * 0.4) * Math.cos(y * s * 2.1 + t * 0.15) * 0.5 +
    Math.sin(x * s * 4.3 + t * 0.2) * Math.cos(y * s * 4.3 - t * 0.35) * 0.25;

  let baseAngle = n * Math.PI * 2;

  // Mouse interaction layer
  if (mouse.mx !== -1000) {
    const dx = x - mouse.mx;
    const dy = y - mouse.my;
    const distSq = dx * dx + dy * dy;
    const radiusSq = 350 * 350; // Effect radius 

    if (distSq < radiusSq) {
      // Calculate angle from mouse to point
      const angleFromMouse = Math.atan2(dy, dx);
      // Falloff creates a smooth transition
      const falloff = 1 - (distSq / radiusSq);
      // Blend base angle with angle pointing away from mouse
      // We add a bit of twist (+ Math.PI/4) for a whirlpool effect
      const targetAngle = angleFromMouse + Math.PI / 4; 

      // Simple angle interpolation
      baseAngle = baseAngle * (1 - falloff) + targetAngle * falloff;
    }
  }

  return baseAngle;
}

/* ─── Stroke particle ──────────────────────────────────────────────── */
class Particle {
  constructor(x, y, palette) {
    this.reset(x, y, palette);
  }

  reset(x, y, palette) {
    this.x    = x;
    this.y    = y;
    this.ox   = x;
    this.oy   = y;
    this.life = 120 + Math.random() * 180;
    this.age  = 0;
    this.speed = 0.8 + Math.random() * 1.5;
    this.color = palette[Math.floor(Math.random() * palette.length)];
    this.alpha = 0.5 + Math.random() * 0.4;
  }

  update(t, mouse) {
    const angle = flowAngle(this.x, this.y, t, mouse);
    // Add speed boost when near mouse
    let currentSpeed = this.speed;
    if (mouse.mx !== -1000) {
      const dx = this.x - mouse.mx;
      const dy = this.y - mouse.my;
      if (dx*dx + dy*dy < 200*200) {
        currentSpeed *= 1.5;
      }
    }

    this.ox   = this.x;
    this.oy   = this.y;
    this.x   += Math.cos(angle) * currentSpeed;
    this.y   += Math.sin(angle) * currentSpeed;
    this.age++;
    return this.age < this.life;
  }

  draw(ctx) {
    const fade = Math.sin((this.age / this.life) * Math.PI);
    ctx.strokeStyle = this.color;
    ctx.globalAlpha = this.alpha * fade;
    ctx.lineWidth   = 3.5;
    ctx.beginPath();
    ctx.moveTo(this.ox, this.oy);
    ctx.lineTo(this.x,  this.y);
    ctx.stroke();
  }
}

/* ─── React component ──────────────────────────────────────────────── */
const PALETTE_LIGHT = [
  'rgba(79, 70, 229, 0.7)',
  'rgba(147, 51, 234, 0.7)',
  'rgba(37, 99, 235, 0.7)',
  'rgba(13, 148, 136, 0.7)',
  'rgba(219, 39, 119, 0.7)',
  'rgba(202, 138, 4, 0.7)',
];

const PALETTE_DARK = [
  'rgba(129, 140, 248, 0.8)',
  'rgba(192, 132, 252, 0.8)',
  'rgba(96, 165, 250, 0.8)',
  'rgba(45, 212, 191, 0.8)',
  'rgba(244, 114, 182, 0.8)',
  'rgba(251, 191, 36, 0.8)',
];

export default function FlowFieldCanvas() {
  const canvasRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas  = canvasRef.current;
    const ctx     = canvas.getContext('2d');
    const isDark  = theme === 'dark';
    const palette = isDark ? PALETTE_DARK : PALETTE_LIGHT;
    const bgColor = isDark ? '#0f172a' : '#ffffff';
    const dotColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(100, 116, 139, 0.4)';

    let   rafId   = null;
    let   t       = 0;
    let   dots    = [];
    let   particles = [];
    
    // Track mouse position with lerping for smoothness
    const targetMouse = { mx: -1000, my: -1000 };
    const mouse = { mx: -1000, my: -1000 };

    const handleMouseMove = (e) => {
      targetMouse.mx = e.clientX;
      targetMouse.my = e.clientY;
    };
    
    // When mouse leaves the window, reset target out of bounds
    const handleMouseLeave = () => {
      targetMouse.mx = -1000;
      targetMouse.my = -1000;
    };

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      // Re-sample dots
      dots = poissonDisk(canvas.width, canvas.height, 28);
      // Seed initial particles from a random subset of dots
      particles = [];
      const seed = Math.min(dots.length, 600);
      for (let i = 0; i < seed; i++) {
        const d = dots[Math.floor(Math.random() * dots.length)];
        particles.push(new Particle(d[0], d[1], palette));
      }
    };

    const draw = () => {
      const { width, height } = canvas;
      
      // Smoothly interpolate mouse position for a fluid response
      mouse.mx += (targetMouse.mx - mouse.mx) * 0.1;
      mouse.my += (targetMouse.my - mouse.my) * 0.1;

      /* Fade previous frame — higher opacity removes path trails */
      ctx.globalAlpha = 0.45;
      ctx.fillStyle   = bgColor;
      ctx.fillRect(0, 0, width, height);

      /* Draw static dots, slight glow if near mouse */
      for (const [dx, dy] of dots) {
        let opacity = isDark ? 0.3 : 0.45;
        let radius = 1.1;
        
        if (mouse.mx !== -1000) {
          const distX = dx - mouse.mx;
          const distY = dy - mouse.my;
          const distSq = distX * distX + distY * distY;
          if (distSq < 150*150) {
            opacity = isDark ? 0.5 : 0.6;
            radius = 1.2;
          }
        }
        
        ctx.globalAlpha = opacity;
        ctx.fillStyle   = dotColor; 
        ctx.beginPath();
        ctx.arc(dx, dy, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      /* Update & draw stroke particles */
      ctx.globalCompositeOperation = isDark ? 'screen' : 'multiply';
      for (let i = particles.length - 1; i >= 0; i--) {
        const alive = particles[i].update(t, mouse);
        particles[i].draw(ctx);
        if (!alive) {
          // Respawn at a random dot
          const d = dots[Math.floor(Math.random() * dots.length)];
          particles[i].reset(d[0], d[1], palette);
        }
      }
      ctx.globalCompositeOperation = 'source-over';

      /* Slowly refill dying particles */
      if (particles.length < 800 && Math.random() < 0.3) {
        const d = dots[Math.floor(Math.random() * dots.length)];
        particles.push(new Particle(d[0], d[1], palette));
      }

      t += 0.004;
      rafId = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    
    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width:  '100vw',
        height: '100vh',
        zIndex: -1,
        display: 'block',
        pointerEvents: 'none', /* lets clicks pass through */
      }}
    />
  );
}
