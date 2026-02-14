
import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Header, { HEADER_HEIGHT } from './components/Header';
import Leaderboard from './components/Leaderboard';
import MotionBackground from './components/MotionBackground';
import { Landing } from './components/Landing';
import SidePanels from './components/SidePanels';
import ChaoticBackground from './components/ChaoticBackground';
import PlayerPage from './components/player/PlayerPage';
import ValentineWallPage from './components/valentine/ValentineWallPage';

const MotionDiv = motion.div as any;
const CRITICAL_BG_URL = "https://r2.flowith.net/gemini-proxy-go/1768800721916/24a7a252-c052-4680-813d-9f1fc2c0bc76.jpg";

interface LeaderboardPageProps {
  initialSkipLanding?: boolean;
}

const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ initialSkipLanding = false }) => {
  const location = useLocation();
  const state = location.state as { skipLanding?: boolean } | null;
  const shouldSkipLanding = initialSkipLanding || state?.skipLanding;

  const [showLanding, setShowLanding] = useState(!shouldSkipLanding);
  const [hasLaunched, setHasLaunched] = useState(!!shouldSkipLanding);
  const [mainVisible, setMainVisible] = useState(!!shouldSkipLanding);
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
    }, 450);
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
    <div className={`relative min-h-screen font-sans bg-transparent text-white selection:bg-mb-purple ${showLanding ? 'overflow-hidden' : ''}`}>
      <div className={`fixed top-0 left-0 right-0 z-[70] pointer-events-none transition-all duration-[1100ms] ease-[cubic-bezier(0.7,0,0.2,1)] ${mainVisible ? 'opacity-100' : 'opacity-0'}`}>
        <Header
          ref={headerRef}
          onLogoClick={handleReturnToLanding}
          onLeaderboardClick={handleLeaderboardClick}
        />
      </div>

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

      <AnimatePresence mode="wait">
        {showLanding && (
          <MotionDiv
            key="landing-door"
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

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <div key={location.pathname} className="min-h-screen">
        <Routes location={location}>
          <Route path="/card" element={
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              className="w-full min-h-screen"
            >
              <PlayerPage />
            </motion.div>
          } />
          <Route path="/valentinewall" element={
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              className="w-full min-h-screen"
            >
              <ValentineWallPage />
            </motion.div>
          } />
          <Route path="/leaderboard" element={<LeaderboardPage initialSkipLanding={true} />} />
          <Route path="/" element={<LeaderboardPage initialSkipLanding={false} />} />
        </Routes>
      </div>
    </AnimatePresence>
  );
};

const AppInner: React.FC = () => {
  const location = useLocation();
  const isValentineWall = location.pathname.includes('/valentinewall');

  return (
    <div className="relative min-h-screen bg-black">
      <div className="fixed inset-0 z-0 bg-black overflow-hidden">
        <MotionBackground />
        <ChaoticBackground speedMultiplier={isValentineWall ? 0.01 : 1.0} />
        <SidePanels />
      </div>

      <div className="relative z-10">
        <AnimatedRoutes />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
};

export default App;
