
import React, { useEffect, useRef, useState } from 'react';

const COMMUNITY_IMAGE = "https://r2.flowith.net/gemini-proxy-go/1768800721916/24a7a252-c052-4680-813d-9f1fc2c0bc76.jpg";

const MAX_PARTICLES = 8;
const SPAWN_INTERVAL = 9000;
const INITIAL_DELAY = 1200;
const COLLISION_BUFFER = 5;
const RESTITUTION = 0.85;
const SEPARATION_SMOOTHING = 0.04;
const SPEED_FACTOR = 0.35;

const random = (min: number, max: number) => Math.random() * (max - min) + min;

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  angularVelocity: number;
  width: number;
  height: number;
  invMass: number;
  src: string;
  element: HTMLDivElement | null;
}

const ChaoticBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const [renderedParticles, setRenderedParticles] = useState<Particle[]>([]);
  const requestRef = useRef<number>(0);
  const nextIdRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const spawnParticle = () => {
      if (particlesRef.current.length >= MAX_PARTICLES) return;
      if (!containerRef.current) return;
      const w = window.innerWidth, h = window.innerHeight;
      const size = random(200, 280);
      const side = Math.floor(random(0, 4));
      let x, y, vx, vy;
      switch (side) {
        case 0: x = random(-size, w); y = -size - 50; vx = random(-0.4, 0.4); vy = random(0.2, 0.6); break;
        case 1: x = w + 50; y = random(-size, h); vx = random(-0.6, -0.2); vy = random(-0.4, 0.4); break;
        case 2: x = random(-size, w); y = h + 50; vx = random(-0.4, 0.4); vy = random(-0.6, -0.2); break;
        default: x = -size - 50; y = random(-size, h); vx = random(0.2, 0.6); vy = random(-0.4, 0.4); break;
      }
      const mag = Math.sqrt(vx*vx + vy*vy);
      vx = (vx / mag) * SPEED_FACTOR * random(0.8, 1.2);
      vy = (vy / mag) * SPEED_FACTOR * random(0.8, 1.2);
      
      const newParticle: Particle = {
        id: nextIdRef.current++, x, y, vx, vy, angle: random(0, 360),
        angularVelocity: random(-0.015, 0.015), width: size, height: size * 0.56,
        invMass: 1 / (size * size), src: COMMUNITY_IMAGE,
        element: null
      };
      particlesRef.current.push(newParticle);
      setRenderedParticles([...particlesRef.current]);
    };
    const startTimeout = setTimeout(() => { spawnParticle(); intervalRef.current = setInterval(spawnParticle, SPAWN_INTERVAL); }, INITIAL_DELAY);
    return () => { clearTimeout(startTimeout); if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    const updatePhysics = () => {
      const particles = particlesRef.current;
      const w = window.innerWidth, h = window.innerHeight, WRAP_BUFFER = 300;
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.angle += p.angularVelocity;
        if (p.x > w + WRAP_BUFFER) { p.x = -p.width - 150; p.y = random(0, h - p.height); }
        else if (p.x < -p.width - WRAP_BUFFER) { p.x = w + 150; p.y = random(0, h - p.height); }
        if (p.y > h + WRAP_BUFFER) { p.y = -p.height - 150; p.x = random(0, w - p.width); }
        else if (p.y < -p.height - WRAP_BUFFER) { p.y = h + 150; p.x = random(0, w - p.width); }
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i], p2 = particles[j];
          const c1x = p1.x + p1.width / 2, c1y = p1.y + p1.height / 2;
          const c2x = p2.x + p2.width / 2, c2y = p2.y + p2.height / 2;
          const dx = c2x - c1x, dy = c2y - c1y;
          const combW = (p1.width + p2.width) / 2 + COLLISION_BUFFER, combH = (p1.height + p2.height) / 2 + COLLISION_BUFFER;
          const overlapX = combW - Math.abs(dx), overlapY = combH - Math.abs(dy);
          if (overlapX > 0 && overlapY > 0) {
             let nx = 0, ny = 0;
             if (overlapX < overlapY) nx = dx > 0 ? 1 : -1; else ny = dy > 0 ? 1 : -1;
             const separation = Math.min(overlapX, overlapY) * SEPARATION_SMOOTHING;
             const totalInvMass = p1.invMass + p2.invMass;
             p1.x -= nx * separation * (p1.invMass / totalInvMass); p1.y -= ny * separation * (p1.invMass / totalInvMass);
             p2.x += nx * separation * (p2.invMass / totalInvMass); p2.y += ny * separation * (p2.invMass / totalInvMass);
             const rvx = p2.vx - p1.vx, rvy = p2.vy - p1.vy;
             const vNormal = rvx * nx + rvy * ny;
             if (vNormal < 0) {
                 const impulse = -(1 + RESTITUTION) * vNormal / totalInvMass;
                 p1.vx -= impulse * nx * p1.invMass; p1.vy -= impulse * ny * p1.invMass;
                 p2.vx += impulse * nx * p2.invMass; p2.vy += impulse * ny * p2.invMass;
             }
          }
        }
      }
      particles.forEach(p => { if (p.element) p.element.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) rotate(${p.angle}deg)`; });
      requestRef.current = requestAnimationFrame(updatePhysics);
    };
    requestRef.current = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(requestRef.current);
  }, [renderedParticles]); 

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -10 }}>
      {renderedParticles.map((p) => (
        <div key={p.id} ref={(el) => { if (el) p.element = el; }} className="absolute top-0 left-0 will-change-transform" style={{ width: `${p.width}px`, height: `${p.height}px` }}>
            <img src={p.src} alt="" className="w-full h-full object-cover rounded-xl opacity-20 brightness-[0.4] grayscale-[0.5]" />
        </div>
      ))}
    </div>
  );
};

export default ChaoticBackground;
