
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, Heart, ArrowLeft, X, Trophy, Sparkles, Maximize } from 'lucide-react';
import ValentineCard from './ValentineCard';
import ThreadFilament from './ThreadFilament';
import CreateValentineModal from './CreateValentineModal';
import ValentineDetailsModal from './ValentineDetailsModal';
import FloatingHearts from './FloatingHearts';
import ValentineTransition from './ValentineTransition.tsx'
import {
  DraggableContainer,
  DraggableContainerHandle,
  GridBody,
  GridItem,
} from '../ui/infinite-drag-scroll';
import { ValentineData, fetchAllValentines } from '../../services/valentineService';
import { supabase } from '../../services/supabaseClient';
import { DottedSurface } from '../ui/dotted-surface';
import { ThemeProvider } from 'next-themes';

const CharacterFlip: React.FC<{ char: string; index: number; isLink?: boolean }> = React.memo(({ char, index, isLink }) => {
  return (
    <span
      className={`text-[9px] font-mono uppercase tracking-[0.25em] font-bold inline-block transition-all duration-300 ${isLink ? 'hover:text-mb-purple' : ''}`}
      style={{
        opacity: isLink ? 0.7 : 0.5,
        color: isLink ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)',
        transitionDelay: `${index * 0.01}s`
      }}
    >
      {char === ' ' ? '\u00A0' : char}
    </span>
  );
});

const InteractiveCredits = () => {
  const segments = [
    { text: "created by ", link: false },
    { text: "ixkairo", link: true, href: "https://x.com/ixkairo" }
  ];

  let charIndexCounter = 0;

  return (
    <div className="flex pointer-events-auto select-none gap-0">
      {segments.map((segment, sIdx) => {
        const chars = segment.text.split('');
        const segmentBase = charIndexCounter;
        charIndexCounter += chars.length;

        if (segment.link) {
          return (
            <a
              key={sIdx}
              href={segment.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex group/credit"
            >
              {chars.map((char, cIdx) => (
                <CharacterFlip key={cIdx} char={char} index={segmentBase + cIdx} isLink />
              ))}
            </a>
          );
        }

        return (
          <div key={sIdx} className="flex">
            {chars.map((char, cIdx) => (
              <CharacterFlip key={cIdx} char={char} index={segmentBase + cIdx} />
            ))}
          </div>
        );
      })}
    </div>
  );
};
import './heart.css';

const CARD_DESIGN_SIZE = 650;

const CrispCard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const inner = innerRef.current;
    if (!wrapper || !inner) return;

    const update = () => {
      const w = wrapper.offsetWidth;
      if (w > 0) {
        inner.style.transform = `scale(${w / CARD_DESIGN_SIZE})`;
      }
    };

    const ro = new ResizeObserver(update);
    ro.observe(wrapper);
    update();

    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} className="w-full aspect-square relative">
      <div
        ref={innerRef}
        className="absolute top-0 left-0 origin-top-left"
        style={{ width: CARD_DESIGN_SIZE, height: CARD_DESIGN_SIZE }}
      >
        {children}
      </div>
    </div>
  );
};

const ValentineWallPage: React.FC = () => {
  const navigate = useNavigate();
  const [valentines, setValentines] = useState<ValentineData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [selectedValentine, setSelectedValentine] = useState<ValentineData | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const scrollRef = useRef<DraggableContainerHandle>(null);

  // Load current user's username from localStorage (set during auth in CreateValentineModal)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('valentine_sender_username');
      if (stored) setCurrentUsername(stored);
    } catch {}
  }, []);

  useEffect(() => {
    loadValentines();

    // Check for openModal query param to resume after redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get('openModal') === 'true') {
      setIsModalOpen(true);

      // CRITICAL: Supabase stores tokens in the URL hash (#access_token=...)
      // We must not strip the hash until Supabase has processed it.
      // Instead of replacing the whole URL, we only remove the query param if needed,
      // but only after a short delay or by keeping current hash.
      const currentHash = window.location.hash;
      if (currentHash) {
        console.log('[Auth] Preserving hash for Supabase:', currentHash.substring(0, 20) + '...');
      }

      // Cleanup: Only remove the query param, keep the hash
      setTimeout(() => {
        const newUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, newUrl);
      }, 1000); // Give Supabase a second to catch the hash
    }
  }, []);

  const loadValentines = async () => {
    setIsLoading(true);
    const data = await fetchAllValentines();
    setValentines(data);
    setIsLoading(false);
  };

  const handleCreateOrUpdate = async (valentine: ValentineData, isEdit: boolean) => {
    if (isEdit) {
      setValentines(prev =>
        prev.map(v => v.sender_username === valentine.sender_username ? valentine : v)
      );
    } else {
      setValentines(prev => [valentine, ...prev]);
    }
  };

  const handleBack = () => {
    setIsExiting(true);
    setTimeout(() => {
      navigate('/leaderboard', { state: { skipLanding: true } });
    }, 300);
  };

  return (
    <div className="min-h-screen w-full bg-transparent text-white relative overflow-x-hidden overflow-y-auto">
      {/* Page Entrance Transition */}
      <ValentineTransition />

      {/* Three.js Dotted Surface Background */}
      <DottedSurface className="opacity-40" />
      <FloatingHearts />

      {/* Ambient Light Sources — same as PlayerPage */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute w-[150vw] h-[100vh] bg-purple-900/[0.02] blur-[250px] rounded-full mix-blend-screen will-change-transform" style={{ transform: 'translateZ(0)' }} />
          <div className="w-[80%] h-[120%] bg-pink-500/[0.03] blur-[180px] rounded-full animate-pulse will-change-transform" style={{ transform: 'translateZ(0)', animationDuration: '5s' }} />
          <div className="absolute w-[40%] h-[80%] bg-purple-500/[0.04] blur-[100px] rounded-full mix-blend-screen will-change-transform" style={{ transform: 'translateZ(0)' }} />
          <div className="absolute w-[20%] h-[40%] bg-pink-400/[0.08] blur-[60px] rounded-full mix-blend-plus-lighter will-change-transform" style={{ transform: 'translateZ(0)' }} />
          <div className="absolute top-0 w-full h-[400px] bg-gradient-to-b from-purple-500/[0.02] to-transparent blur-[120px] will-change-transform" style={{ transform: 'translateZ(0)' }} />
        </div>
      </div>

      {/* Radial Darkening Vignette — same as PlayerPage */}
      <div className="fixed inset-0 z-[1] pointer-events-none">
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[200%] max-w-none h-full will-change-transform" style={{
          transform: 'translateZ(0)',
          background: 'radial-gradient(ellipse 50% 100% at 50% 50%, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.75) 15%, rgba(0,0,0,0.6) 30%, rgba(0,0,0,0.4) 45%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0.12) 75%, rgba(0,0,0,0.04) 85%, transparent 100%)'
        }} />
      </div>

      {/* Side Fade Gradients — same as Leaderboard */}
      <div className="fixed top-0 bottom-0 left-0 w-32 md:w-48 z-[100] pointer-events-none hidden md:block" style={{ background: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 30%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.1) 80%, transparent 100%)' }} />
      <div className="fixed top-0 bottom-0 right-0 w-32 md:w-48 z-[100] pointer-events-none hidden md:block" style={{ background: 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 30%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.1) 80%, transparent 100%)' }} />

      {/* Fixed Top Bar — Back + Title + Leaderboard Button */}
      <div className="fixed top-0 left-0 right-0 z-[200] pointer-events-none">
        <div className="flex items-center justify-between px-3 md:px-6 py-2 md:py-4">
          {/* Back Button — same style as PlayerPage */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: isExiting ? 0 : 1, x: 0 }}
            onClick={handleBack}
            whileHover={{ x: -6, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-auto flex items-center gap-2 md:gap-2.5 px-3 md:px-4 py-2 md:py-2.5 rounded-full bg-white/[0.05] border border-white/10 text-[8px] md:text-[11px] font-bold uppercase tracking-[0.16em] md:tracking-[0.25em] text-white/60 transition-all duration-300 hover:bg-white/[0.08] hover:border-white/20 hover:text-white hover:shadow-[0_0_20px_rgba(255,255,255,0.1),0_0_1px_rgba(255,255,255,0.3)_inset] backdrop-blur-md group/back shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover/back:-translate-x-1" />
            <span>Back</span>
          </motion.button>

          {/* Center Title Badge — Leaderboard-style header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: isExiting ? 0 : 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="pointer-events-none absolute left-0 right-0 top-2 md:top-4 flex flex-col items-center justify-center"
          >
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-mb-purple shadow-[0_0_10px_#8B5CF6] animate-pulse" />
              <span className="text-[8px] md:text-[9px] font-mono tracking-[0.4em] uppercase text-mb-purple font-bold">valentine's day 2026</span>
            </div>
            <h1 className="text-lg md:text-3xl font-sync font-bold tracking-tighter uppercase text-white leading-none flex items-baseline gap-2">
              <span>MGB Valentine Wall</span>
              <Heart className="w-3 md:w-4 h-3 md:h-4 text-mb-purple fill-mb-purple/30 flex-shrink-0" />
            </h1>
          </motion.div>

          {/* Top Right Buttons: Leaderboard & Magic Cards */}
          <div className="flex flex-col items-end gap-2 pointer-events-none">
            {/* Leaderboard Button */}
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: isExiting ? 0 : 1, x: 0 }}
              onClick={() => navigate('/leaderboard', { state: { skipLanding: true } })}
              whileHover={{ x: 6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="pointer-events-auto flex items-center gap-2 md:gap-2.5 px-3 md:px-4 py-2 md:py-2.5 rounded-full bg-white/[0.05] border border-white/10 text-[8px] md:text-[11px] font-bold uppercase tracking-[0.16em] md:tracking-[0.25em] text-white/60 transition-all duration-300 hover:bg-white/[0.08] hover:border-white/20 hover:text-white hover:shadow-[0_0_20px_rgba(255,255,255,0.1),0_0_1px_rgba(255,255,255,0.3)_inset] backdrop-blur-md group/board shrink-0"
            >
              <Trophy className="w-3 h-3 md:w-3.5 md:h-3.5" />
              <span className="hidden sm:inline">Leaderboard</span>
            </motion.button>

            {/* Magic Cards Button */}
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: isExiting ? 0 : 1, x: 0 }}
              onClick={() => navigate('/card')}
              whileHover={{ x: 6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="pointer-events-auto flex items-center gap-2 md:gap-2.5 px-3 md:px-4 py-2 md:py-2.5 rounded-full bg-white/[0.05] border border-white/10 text-[8px] md:text-[11px] font-bold uppercase tracking-[0.16em] md:tracking-[0.25em] text-white/60 transition-all duration-300 hover:bg-white/[0.08] hover:border-white/20 hover:text-white hover:shadow-[0_0_20px_rgba(255,255,255,0.1),0_0_1px_rgba(255,255,255,0.3)_inset] backdrop-blur-md group/magic shrink-0"
            >
              <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5" />
              <span className="hidden sm:inline">Magic Cards</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Floating Glass Counter - Elegantly positioned below header */}
      {!isLoading && valentines.length > 0 && (
        <div className="fixed top-20 md:top-24 left-0 right-0 z-[190] pointer-events-none flex flex-col items-center justify-center gap-3">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex items-center gap-3 px-5 py-2 rounded-full bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:bg-white/[0.05] transition-colors pointer-events-auto"
          >
            <div className="loader scale-[0.4] origin-center filter drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]"></div>
            <div className="flex flex-col items-start leading-none">
              <span className="text-[10px] md:text-[11px] font-mono font-bold text-white tracking-[0.2em]">
                {valentines.length} VALENTINES
              </span>
              <span className="text-[8px] font-mono text-white/40 tracking-wider">
                SENT TO THE VOID
              </span>
            </div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={() => scrollRef.current?.resetView()}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-[9px] font-bold uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 transition-all pointer-events-auto backdrop-blur-md"
          >
            <Maximize className="w-3 h-3" />
            <span>Recenter View</span>
          </motion.button>
        </div>
      )}

      {/* Fixed Bottom Bar — Create Valentine Button Only */}
      <div className="fixed bottom-0 left-0 right-0 z-[200] pointer-events-none">
        <div className="flex flex-col items-center px-6 pb-6 md:pb-8 gap-3">
          {/* Create Valentine Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            onClick={() => setIsModalOpen(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              opacity: isExiting ? 0 : 1,
              y: 0,
              boxShadow: [
                '0 0 20px rgba(139, 92, 246, 0.3)',
                '0 0 30px rgba(139, 92, 246, 0.5)',
                '0 0 20px rgba(139, 92, 246, 0.3)',
              ],
            }}
            transition={{
              boxShadow: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
              opacity: { duration: 0.5 },
              y: { duration: 0.5, delay: 0.2 },
            }}
            className="pointer-events-auto flex items-center gap-2 md:gap-3 px-6 md:px-10 py-3 md:py-4 rounded-full bg-mb-purple/20 border border-mb-purple/60 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-mb-purple transition-all duration-300 hover:bg-mb-purple/30 hover:border-mb-purple hover:text-white backdrop-blur-md"
          >
            <Plus className="w-4 h-4" />
            <span>Create Valentine</span>
          </motion.button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-[2]">
        {
          isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-screen gap-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Heart className="w-6 h-6 text-white/5" />
              </motion.div>
              <span className="font-mono text-[9px] tracking-[0.4em] uppercase text-white/10">Loading Valentines</span>
            </div>
          ) : valentines.length === 0 ? (
            /* Empty State — Leaderboard neutral style */
            <div className="flex flex-col items-center justify-center min-h-screen">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md mx-auto py-24 flex flex-col items-center justify-center border border-white/5 rounded-3xl bg-white/[0.01] backdrop-blur-sm"
              >
                <Heart className="w-16 h-16 text-white/10 mb-8" />
                <div className="w-1 h-1 rounded-full bg-white/20 mb-6 animate-pulse" />
                <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-white/10 select-none mb-10">
                  The wall is empty
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-3 px-8 py-3 bg-mb-purple/20 border border-mb-purple/60 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] text-mb-purple hover:bg-mb-purple/30 hover:border-mb-purple hover:text-white transition-all duration-300 backdrop-blur-md"
                >
                  <Plus className="w-4 h-4" />
                  Create First Valentine
                </button>
              </motion.div>
            </div>
          ) : (
            /* Infinite Drag-Scroll Grid of Valentine Cards */
            <DraggableContainer ref={scrollRef} variant="chaos">
              <GridBody>
                {valentines.map((valentine, index) => (
                  <GridItem
                    key={`${valentine.sender_username}-${index}`}
                    index={index}
                    className="relative h-80 w-56 md:h-[420px] md:w-[300px] mt-[120px] md:mt-[160px]"
                  >
                    <ThreadFilament
                      height={100}
                      index={index}
                      color="rgba(255,255,255,0.12)"
                    />
                    <div
                      className="w-full"
                      onClick={() => setSelectedValentine(valentine)}
                    >
                      <CrispCard>
                        <ValentineCard
                          valentine={valentine}
                          layoutId={`wall-card-${valentine.sender_username}-${index}`}
                          isOwn={!!currentUsername && valentine.sender_username === currentUsername}
                          isForMe={!!currentUsername && valentine.recipient_type === 'user' && valentine.recipient_username === currentUsername}
                        />
                      </CrispCard>
                    </div>
                  </GridItem>
                ))}
              </GridBody>
            </DraggableContainer>
          )
        }
      </div>

      {/* Valentine Card Modal (click to enlarge) */}
      {/* Modal for Viewing/Customizing Valentine */}
      <AnimatePresence>
        {selectedValentine && (
          <ValentineDetailsModal
            isOpen={!!selectedValentine}
            onClose={() => setSelectedValentine(null)}
            valentine={selectedValentine}
          />
        )}
      </AnimatePresence>

      {/* Create Valentine Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <CreateValentineModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              // Refresh current username in case user just authenticated
              try {
                const stored = localStorage.getItem('valentine_sender_username');
                if (stored) setCurrentUsername(stored);
              } catch {}
            }}
            onSubmit={handleCreateOrUpdate}
          />
        )}
      </AnimatePresence>

      {/* Valentine Received Panel — fixed right side, visible after auth */}
      <AnimatePresence>
        {currentUsername && (() => {
          const received = valentines.filter(
            v => v.recipient_type === 'user' && v.recipient_username === currentUsername
          );
          if (received.length === 0) return null;
          return (
            <motion.div
              key="received-panel"
              initial={{ opacity: 0, y: 15, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.5, delay: 0.8, ease: [0.23, 1, 0.32, 1] }}
              className="fixed right-4 md:right-6 top-32 md:top-36 z-[190] w-56 md:w-60 pointer-events-auto hidden md:block"
            >
              {/* Ambient glow behind panel */}
              <div
                className="absolute -inset-4 rounded-3xl pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(236,72,153,0.08) 0%, transparent 70%)',
                  filter: 'blur(20px)',
                }}
              />

              <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden">
                {/* Header pill */}
                <div className="px-4 pt-4 pb-3">
                  <div className="flex items-center gap-2.5">
                    <motion.div
                      animate={{
                        scale: [1, 1.15, 1],
                        opacity: [0.8, 1, 0.8],
                      }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400/50" style={{ filter: 'drop-shadow(0 0 4px rgba(236,72,153,0.5))' }} />
                    </motion.div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-[0.25em] text-white/70">
                      For you
                    </span>
                    <span className="ml-auto text-[10px] font-mono font-bold text-pink-400/80 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/15">
                      {received.length}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div className="mx-3 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

                {/* Sender list */}
                <div className="px-2 py-2 max-h-56 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>
                  {received.map((v, i) => (
                    <motion.div
                      key={`${v.sender_username}-${i}`}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.9 + i * 0.08 }}
                      className="flex items-center gap-2.5 py-2 px-2.5 rounded-xl hover:bg-white/[0.04] transition-all duration-300 group/sender"
                    >
                      <div className="relative shrink-0">
                        <img
                          src={v.sender_avatar_url}
                          alt={v.sender_display_name}
                          className="w-7 h-7 rounded-full border border-white/[0.08] group-hover/sender:border-pink-500/30 transition-colors duration-300"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-pink-500/20 border border-pink-400/30 flex items-center justify-center">
                          <Heart className="w-1.5 h-1.5 text-pink-400 fill-pink-400/60" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-bold text-white/80 truncate leading-tight group-hover/sender:text-white transition-colors duration-300">{v.sender_display_name}</div>
                        <div className="text-[9px] font-mono text-white/25 truncate group-hover/sender:text-white/40 transition-colors duration-300">@{v.sender_username}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Persistent Page Credit */}
      <div className="fixed bottom-8 right-10 z-[100] hidden md:block select-none pointer-events-none">
        <InteractiveCredits />
      </div>
    </div >
  );
};

export default ValentineWallPage;
