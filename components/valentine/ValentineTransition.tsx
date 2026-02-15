
import React, { useEffect, useState, useCallback } from 'react';

const HEART_COUNT = 35;

/* ── Inject CSS keyframes once — all animation runs on compositor thread ── */
const injectStyles = () => {
  if (typeof document === 'undefined') return;
  if (document.getElementById('vt-styles')) return;
  const style = document.createElement('style');
  style.id = 'vt-styles';
  style.textContent = `
@keyframes vt-fall {
  0%   { transform: translateY(-20vh) rotate(var(--r)); opacity: 0; }
  8%   { opacity: 0.3; }
  75%  { opacity: 0.3; }
  100% { transform: translateY(120vh) rotate(calc(var(--r) + 360deg)); opacity: 0; }
}
@keyframes vt-glow {
  0%   { transform: scale(0); opacity: 0; }
  55%  { transform: scale(1.1); opacity: 0.3; }
  100% { transform: scale(1); opacity: 0.3; }
}
@keyframes vt-hero {
  0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
  55%  { transform: scale(1.05) rotate(5deg); opacity: 0.5; }
  100% { transform: scale(1) rotate(0deg); opacity: 0.4; }
}
@keyframes vt-label {
  0%   { opacity: 0; }
  50%  { opacity: 1; }
  100% { opacity: 0.5; }
}
@keyframes vt-container {
  0%   { opacity: 1; }
  70%  { opacity: 1; }
  100% { opacity: 0; }
}
`;
  document.head.appendChild(style);
};

injectStyles();

const HEART_PATH = 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';

interface RainHeart {
  x: number;
  delay: number;
  size: number;
  duration: number;
  rotate: number;
}

function generateHearts(): RainHeart[] {
  return Array.from({ length: HEART_COUNT }, () => ({
    x: Math.random() * 100,
    delay: Math.random() * 1.0,
    size: 10 + Math.random() * 40,
    duration: 1.0 + Math.random() * 1.5,
    rotate: Math.random() * 360,
  }));
}

export const ValentineTransition: React.FC = () => {
  const [hasPlayed] = useState(() => !!sessionStorage.getItem('valentine_transition_played'));
  const [isVisible, setIsVisible] = useState(!hasPlayed);
  const [hearts] = useState<RainHeart[]>(() => (hasPlayed ? [] : generateHearts()));

  useEffect(() => {
    if (hasPlayed) return;
    sessionStorage.setItem('valentine_transition_played', 'true');
  }, [hasPlayed]);

  const handleAnimationEnd = useCallback((e: React.AnimationEvent) => {
    // Only react to the container's own animation, not bubbled children
    if (e.currentTarget === e.target) {
      setIsVisible(false);
    }
  }, []);

  if (hasPlayed || !isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black overflow-hidden pointer-events-none"
      style={{ animation: 'vt-container 2.2s ease-out forwards', willChange: 'opacity' }}
      onAnimationEnd={handleAnimationEnd}
    >
      {/* Layer 1: Background Rain — 35 falling hearts, pure CSS */}
      {hearts.map((h, i) => (
        <div
          key={i}
          className="absolute text-pink-500/20 pointer-events-none"
          style={{
            left: `${h.x}vw`,
            '--r': `${h.rotate}deg`,
            animation: `vt-fall ${h.duration}s ${h.delay}s linear forwards`,
            willChange: 'transform, opacity',
          } as React.CSSProperties}
        >
          <svg width={h.size} height={h.size} viewBox="0 0 24 24" fill="currentColor">
            <path d={HEART_PATH} />
          </svg>
        </div>
      ))}

      {/* Layer 2: Hero Heart */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Soft glow — radial gradient instead of blur filter for perf */}
        <div
          className="absolute w-[28rem] h-[28rem] rounded-full"
          style={{
            animation: 'vt-glow 0.6s ease-out forwards',
            background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, rgba(236,72,153,0.05) 40%, transparent 70%)',
            willChange: 'transform, opacity',
          }}
        />

        {/* Main heart SVG */}
        <div
          className="relative z-10 text-pink-500"
          style={{
            animation: 'vt-hero 0.7s ease-out forwards',
            filter: 'drop-shadow(0 0 25px rgba(236,72,153,0.3))',
            willChange: 'transform, opacity',
          }}
        >
          <svg width="220" height="220" viewBox="0 0 24 24" fill="currentColor">
            <path d={HEART_PATH} />
          </svg>
        </div>

        {/* Label text */}
        <div
          className="absolute mt-64"
          style={{ animation: 'vt-label 0.6s 0.2s ease-out forwards', opacity: 0, willChange: 'opacity' }}
        >
          <span className="font-mono text-[8px] md:text-[10px] uppercase tracking-[0.8em] text-pink-300/20">
            Valentine Wall
          </span>
        </div>
      </div>
    </div>
  );
};

export default ValentineTransition;
