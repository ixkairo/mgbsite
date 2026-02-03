import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import PLAYER_BG from '../FON.png';

gsap.registerPlugin(ScrollTrigger);

const DEFAULT_BG = 'https://r2.flowith.net/gemini-proxy-go/1768800721916/24a7a252-c052-4680-813d-9f1fc2c0bc76.jpg';

const MotionBackground: React.FC = () => {
  const location = useLocation();
  const isPlayerPage = location.pathname.includes('/card');

  const parallaxBgRef = useRef<HTMLDivElement>(null);
  const playerBgRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bg = parallaxBgRef.current;
    const pBg = playerBgRef.current;
    const overlay = overlayRef.current;
    if (!bg || !pBg || !overlay) return;

    const ctx = gsap.context(() => {
      // Common Parallax for both
      [bg, pBg].forEach(target => {
        gsap.to(target, {
          yPercent: 12,
          ease: "none",
          scrollTrigger: {
            trigger: document.body,
            start: "top top",
            end: "bottom bottom",
            scrub: true
          }
        });
      });

      // Ambient Lighting / Brightness for main BG - RESTORE SCROLL OPACITY
      gsap.fromTo(bg,
        {
          opacity: 0,
          filter: 'grayscale(0.3) brightness(0.2) contrast(1.2)'
        },
        {
          opacity: 0.6,
          filter: 'grayscale(0.1) brightness(0.8) contrast(1)',
          ease: "power2.inOut",
          scrollTrigger: {
            trigger: document.body,
            start: "top top",
            end: "800px top",
            scrub: 1
          }
        }
      );

      // Mirror effects for player BG - INCREASED BRIGHTNESS
      // We set starting brightness higher if on player page
      const startBrightness = isPlayerPage ? 0.4 : 0.3;
      gsap.fromTo(pBg,
        { filter: `brightness(${startBrightness}) contrast(1.1)` },
        {
          filter: 'brightness(0.4) contrast(1)', // Slightly darker checkered pattern
          ease: "none",
          scrollTrigger: {
            trigger: document.body,
            start: "top top",
            end: "800px top",
            scrub: 1
          }
        }
      );

      // Darkening via overlay - slightly darker
      const targetOpacity = isPlayerPage ? 0.30 : 0.3; // Slightly darker overlay
      gsap.to(overlay, {
        opacity: targetOpacity,
        ease: "none",
        duration: 0.8
      });
    });

    return () => ctx.revert();
  }, [isPlayerPage]); // Rerun when route type changes

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-black">
      {/* 1. Base Layer */}
      <div className="absolute inset-0 bg-black" />

      {/* 2. Main Leaderboard Background */}
      <div
        ref={parallaxBgRef}
        className={`absolute inset-x-0 top-[-15%] h-[130%] bg-cover bg-center bg-no-repeat will-change-transform transition-opacity duration-[1200ms] ease-in-out ${isPlayerPage ? 'opacity-0' : ''}`}
        style={{ backgroundImage: `url('${DEFAULT_BG}')` }}
      />

      {/* 3. Player Page Background (FON.png) */}
      <div
        ref={playerBgRef}
        className={`absolute inset-x-0 top-[-15%] h-[130%] bg-cover bg-center bg-no-repeat will-change-transform transition-opacity duration-[1200ms] ease-in-out ${isPlayerPage ? 'opacity-100' : 'opacity-0'}`}
        style={{ backgroundImage: `url('${PLAYER_BG}')` }}
      />

      {/* 4. Overlay - Darker but shows pattern */}
      <div
        ref={overlayRef}
        className={`absolute inset-0 bg-black transition-opacity duration-1000 ${isPlayerPage ? 'opacity-30' : 'opacity-80'}`}
      />

      {/* 5. Gradient Masks - Lighter on player page to show pattern */}
      <div className={`absolute inset-0 bg-gradient-to-b from-black via-transparent to-black transition-opacity duration-1000 ${isPlayerPage ? 'opacity-20' : 'opacity-100'}`} />

      {/* 6. Atmospheric Lighting - REMOVED ON PLAYER PAGE */}
      <div className={`absolute inset-y-0 left-[-10%] w-[40%] bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.1)_0%,transparent_70%)] animate-pulse transition-opacity duration-1000 ${isPlayerPage ? 'opacity-0' : 'opacity-30'}`} />
      <div className={`absolute inset-y-0 right-[-10%] w-[40%] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1)_0%,transparent_70%)] animate-pulse transition-opacity duration-1000 ${isPlayerPage ? 'opacity-0' : 'opacity-30'}`} style={{ animationDelay: '2s' }} />

      {/* Vignette - MINIMAL ON PLAYER PAGE */}
      <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.5)_100%)] transition-opacity duration-1000 ${isPlayerPage ? 'opacity-20' : 'opacity-100'}`} />

      {/* Additional Black Overlay for Card Page - On Top */}
      <div className={`absolute inset-0 bg-black transition-opacity duration-1000 ${isPlayerPage ? 'opacity-40' : 'opacity-0'}`} />
    </div>
  );
};

export default MotionBackground;
