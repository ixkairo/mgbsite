
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const BG_IMAGE_URL = 'https://r2.flowith.net/gemini-proxy-go/1768800721916/24a7a252-c052-4680-813d-9f1fc2c0bc76.jpg';

const MotionBackground: React.FC = () => {
  const parallaxBgRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bg = parallaxBgRef.current;
    const overlay = overlayRef.current;
    if (!bg || !overlay) return;

    const ctx = gsap.context(() => {
      // Анимация параллакса (движение)
      gsap.to(bg, {
        yPercent: 12,
        ease: "none",
        scrollTrigger: {
          trigger: document.body,
          start: "top top",
          end: "bottom bottom",
          scrub: true
        }
      });

      // Анимация яркости и прозрачности (проявление из темноты)
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

      // Дополнительное затемнение через оверлей
      gsap.to(overlay, {
        opacity: 0.3,
        ease: "none",
        scrollTrigger: {
          trigger: document.body,
          start: "top top",
          end: "500px top",
          scrub: true
        }
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-black">
      {/* 1. Базовый абсолютно черный слой */}
      <div className="absolute inset-0 bg-black" />
      
      {/* 2. Изображение с параллаксом */}
      <div 
        ref={parallaxBgRef}
        className="absolute inset-x-0 top-[-15%] h-[130%] bg-cover bg-center bg-no-repeat will-change-transform"
        style={{ backgroundImage: `url('${BG_IMAGE_URL}')` }}
      />

      {/* 3. Оверлей затемнения */}
      <div 
        ref={overlayRef}
        className="absolute inset-0 bg-black opacity-80 transition-opacity duration-1000"
      />

      {/* 4. Глобальные градиентные маски */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
      
      {/* 5. Атмосферное освещение */}
      <div className="absolute inset-y-0 left-[-10%] w-[40%] bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.1)_0%,transparent_70%)] opacity-30 animate-pulse" />
      <div className="absolute inset-y-0 right-[-10%] w-[40%] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1)_0%,transparent_70%)] opacity-30 animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.5)_100%)]" />
    </div>
  );
};

export default MotionBackground;
