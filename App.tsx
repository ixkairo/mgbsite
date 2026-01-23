
import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Header, { HEADER_HEIGHT } from './components/Header';
import Leaderboard from './components/Leaderboard';
import MotionBackground from './components/MotionBackground';
import { Landing } from './components/Landing';
import SidePanels from './components/SidePanels';
import ChaoticBackground from './components/ChaoticBackground';

const MotionDiv = motion.div as any;
const CRITICAL_BG_URL = "https://r2.flowith.net/gemini-proxy-go/1768800721916/24a7a252-c052-4680-813d-9f1fc2c0bc76.jpg";

const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [hasLaunched, setHasLaunched] = useState(false);
  const [mainVisible, setMainVisible] = useState(false);
  const [navDirection, setNavDirection] = useState<'forward' | 'backward'>('forward');
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // 1. Warm up the browser cache for the background image immediately
    const img = new Image();
    img.src = CRITICAL_BG_URL;

    // 2. Manage scrolling
    if (showLanding) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      setMainVisible(false);
    } else {
      document.documentElement.style.overflow = 'auto';
      document.body.style.overflow = 'auto';
      document.body.style.overflowX = 'hidden';
      document.body.style.position = 'relative';
      document.body.style.width = 'auto';
      setMainVisible(true);
    }

    return () => {
      document.documentElement.style.overflow = 'auto';
      document.body.style.overflow = 'auto';
    };
  }, [showLanding]);

  const handleStart = () => {
    setNavDirection('forward');
    setShowLanding(false);
    setHasLaunched(true);
  };

  const handleReturnToLanding = () => {
    setNavDirection('backward');
    setMainVisible(false);
    setTimeout(() => {
      setShowLanding(true);
    }, 450); // Match backward fade-out duration
  };

  const handleLeaderboardClick = () => {
    if (showLanding) {
      handleStart();
    }
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className={`relative min-h-screen font-sans bg-black text-white selection:bg-mb-purple ${showLanding ? 'overflow-hidden' : ''}`}>
      {/* Background Layers - Beneath the main UI */}
      <div className="fixed inset-0 z-0 bg-black">
        <MotionBackground />
        <ChaoticBackground />
        <SidePanels />
      </div>

      {/* Truly Fixed Header */}
      <div className={`fixed top-0 left-0 right-0 z-[70] pointer-events-none transition-all duration-[1100ms] ease-[cubic-bezier(0.7,0,0.2,1)] ${mainVisible ? 'opacity-100' : 'opacity-0'}`}>
        <Header
          ref={headerRef}
          onLogoClick={handleReturnToLanding}
          onLeaderboardClick={handleLeaderboardClick}
        />
      </div>

      {/* Main UI Content Layer */}
      <div
        className={`relative z-[60] min-h-screen w-full transition-all 
          ${navDirection === 'forward'
            ? 'duration-[1100ms] ease-[cubic-bezier(0.7,0,0.2,1)]'
            : 'duration-[500ms] ease-in-out'} 
          ${mainVisible
            ? 'opacity-100 pointer-events-auto filter-none scale-100'
            : `opacity-0 pointer-events-none ${navDirection === 'forward' ? 'blur-xl scale-[0.96]' : 'blur-sm'}`}`}
      >
        <main style={{ paddingTop: HEADER_HEIGHT }} className="relative z-10">
          <Leaderboard headerRef={headerRef} />
        </main>
      </div>

      {/* Landing Layer */}
      <AnimatePresence mode="wait">
        {showLanding && (
          <MotionDiv
            key="landing-door"
            // If hasLaunched is true, it means we are returning, so animate from top.
            // If false, it's the first load, so start at 0 (instantly visible).
            initial={navDirection === 'forward'
              ? { y: hasLaunched ? "-100%" : 0 }
              : { opacity: 0, y: 0 }}
            animate={navDirection === 'forward'
              ? { y: 0 }
              : { opacity: 1, y: 0 }}
            exit={{
              y: "-100%",
              transition: {
                duration: 1.1,
                ease: [0.7, 0, 0.2, 1]
              }
            }}
            transition={navDirection === 'forward'
              ? {
                duration: 1.1,
                ease: [0.7, 0, 0.2, 1]
              }
              : {
                duration: 0.5,
                ease: "easeInOut"
              }}
            className="fixed inset-0 z-[100] h-screen w-full bg-black overflow-hidden"
          >
            <Landing onStart={handleStart} skipAnimations={hasLaunched} />
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
