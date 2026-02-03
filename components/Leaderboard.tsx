
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchLeaderboardData } from '@/services/dataService';
import { User } from '@/types';
import UserCard from './UserCard';
import { Loader2, Search, Trophy, LayoutList, Inbox, User as UserIcon, HelpCircle } from 'lucide-react';
import ArtistCarousel from './ArtistCarousel';
import { HEADER_HEIGHT } from './Header';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, AnimatePresence } from 'framer-motion';
import { computeMagicianScores } from '@/utils/magicianScore';

gsap.registerPlugin(ScrollTrigger);

type SortKey = 'magician_score' | 'posts_count' | 'views_total' | 'likes_total' | 'replies_total' | 'retweets_total' | 'quotes_total';
type ViewMode = 'standard' | 'unified';

const ITEMS_PER_PAGE = 25;
const CAROUSEL_HEIGHT = 200;

const MotionDiv = motion.div as any;

const CUSTOM_CENTRAL_LOGO = "https://github.com/argonq1/dasdsassad/blob/main/MagicBlock-Logomark-White.webp?raw=true";

const DiscordIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 127.14 96.36" fill="currentColor" {...props}>
    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,29,6.83,77.36,77.36,0,0,0,25.64,0,105.18,105.18,0,0,0,19.4,8.07C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.73,105.73,0,0,0,126.6,80.22c2.36-24.44-5.42-48.18-18.9-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
  </svg>
);

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const BrandIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <img
    src={CUSTOM_CENTRAL_LOGO}
    alt="Brand Icon"
    className={`object-contain brightness-200 transition-all ${props.className}`}
  />
);

interface SocialKeyProps {
  Icon: any;
  href?: string;
  iconClassName?: string;
}

const SocialKey: React.FC<SocialKeyProps> = React.memo(({ Icon, href, iconClassName = "w-4 h-4" }) => {
  const Component = (href ? motion.a : motion.div) as any;
  return (
    <Component
      href={href}
      target={href ? "_blank" : undefined}
      rel={href ? "noopener noreferrer" : undefined}
      initial={{ opacity: 0.15, scale: 1 }}
      animate={{ opacity: 0.15, scale: 1 }}
      whileHover={{ opacity: 1, scale: 1.15, y: -2 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="relative group p-2 flex items-center justify-center cursor-pointer pointer-events-auto transition-all"
    >
      <Icon className={`${iconClassName} text-white transition-all duration-300 group-hover:drop-shadow-[0_0_15px_rgba(139,92,246,0.9)] relative z-10`} />
    </Component>
  );
});

const InteractiveCredits = () => {
  const segments = [
    { text: "built by ", link: false },
    { text: "ixkairo", link: true, href: "https://x.com/ixkairo" },
    { text: " and ", link: false },
    { text: "argonq", link: true, href: "https://x.com/argonzs" }
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

interface CharacterFlipProps {
  char: string;
  index: number;
  isLink?: boolean;
}

const CharacterFlip: React.FC<CharacterFlipProps> = React.memo(({ char, index, isLink }) => {
  return (
    <span
      className={`text-[9px] font-mono uppercase tracking-[0.25em] font-bold inline-block cursor-help transition-all duration-300 ${isLink ? 'group-hover/credit:text-mb-purple' : ''}`}
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

interface LeaderboardProps {
  headerRef: React.RefObject<HTMLElement>;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ headerRef }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('magician_score');
  const [viewMode, setViewMode] = useState<ViewMode>('standard');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [fadeProgress, setFadeProgress] = useState(0);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const carouselWrapperRef = useRef<HTMLDivElement>(null);
  const leaderboardEngineRef = useRef<HTMLDivElement>(null);
  const tooltipIconRef = useRef<HTMLDivElement>(null);
  const isFirstRun = useRef(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const rawData = await fetchLeaderboardData();
        const usersWithScores = computeMagicianScores(rawData);
        setUsers(usersWithScores);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    if (leaderboardEngineRef.current) {
      const rect = leaderboardEngineRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const absoluteTop = rect.top + scrollTop;
      const targetPosition = absoluteTop - HEADER_HEIGHT;

      window.scrollTo({
        top: targetPosition,
        behavior: 'instant' as any
      });

      setTimeout(() => ScrollTrigger.refresh(), 50);
    }
  }, [currentPage]);

  useEffect(() => {
    if (loading || !leaderboardEngineRef.current || !carouselWrapperRef.current) return;

    const engine = leaderboardEngineRef.current;
    const carousel = carouselWrapperRef.current;

    const fadeTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: engine,
        start: `top ${HEADER_HEIGHT + CAROUSEL_HEIGHT}px`,
        end: `top ${HEADER_HEIGHT}px`,
        scrub: 0.5, // Add small delay to reduce update frequency
        onUpdate: (self) => {
          // Only update if progress changed significantly (reduce re-renders)
          const newProgress = Math.round(self.progress * 20) / 20; // Round to 0.05 increments
          setFadeProgress((prev) => prev !== newProgress ? newProgress : prev);
        }
      }
    });

    fadeTimeline.fromTo(carousel,
      { opacity: 1, filter: 'brightness(1) blur(0px)' },
      {
        opacity: 0,
        filter: 'brightness(0) blur(10px)',
        ease: "none"
      }
    );

    return () => {
      fadeTimeline.kill();
    };
  }, [loading]);

  useEffect(() => {
    if (!loading) {
      // Debounce ScrollTrigger refresh to reduce performance impact
      const timeoutId = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [viewMode, sortKey, searchTerm, loading]);

  // Single source of truth: Sort by active metric
  const rankedUsers = useMemo(() => {
    const sorted = [...users].sort((a, b) => {
      // Fix: magician_score (sortKey) -> magicianScore (User property)
      const aValue = sortKey === 'magician_score'
        ? (a.magicianScore ?? 0)
        : ((a[sortKey] as number) ?? 0);
      const bValue = sortKey === 'magician_score'
        ? (b.magicianScore ?? 0)
        : ((b[sortKey] as number) ?? 0);
      return bValue - aValue; // DESC
    });

    // Debug guard: verify magician_score sorting
    if (sortKey === 'magician_score' && process.env.NODE_ENV === 'development') {
      for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i].magicianScore ?? 0;
        const next = sorted[i + 1].magicianScore ?? 0;
        if (current < next) {
          console.error(`SORT ERROR: magicianScore[${i}]=${current} < magicianScore[${i + 1}]=${next}`);
        }
      }
    }

    return sorted.map((user, index) => ({
      ...user,
      stable_rank: index + 1
    }));
  }, [users, sortKey]);

  // Step 2: Apply search filtering on the already-ranked list
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return rankedUsers;
    const lowerTerm = searchTerm.toLowerCase();
    return rankedUsers.filter(user =>
      (user.display_name?.toLowerCase().includes(lowerTerm)) ||
      (user.username?.toLowerCase().includes(lowerTerm))
    );
  }, [rankedUsers, searchTerm]);

  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const isPageOne = currentPage === 1;

  interface SortButtonProps {
    label: string;
    sKey: SortKey;
    isPrimary?: boolean;
  }

  const SortButton: React.FC<SortButtonProps> = React.memo(({ label, sKey, isPrimary = false }) => (
    <button
      onClick={() => { setSortKey(sKey); setCurrentPage(1); }}
      className={`relative px-0 py-2.5 md:py-4 text-[8px] md:text-[10px] font-bold uppercase tracking-[0.18em] md:tracking-[0.3em] transition-all duration-300 pointer-events-auto group ${sortKey === sKey
        ? (isPrimary ? 'text-white drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]' : 'text-white')
        : 'text-white/20 hover:text-white/40'
        }`}
    >
      <span className="relative z-10">{label}</span>
      {sortKey === sKey && (
        <div className={`absolute bottom-0 left-0 right-0 h-[1px] transition-all duration-300 ${isPrimary
            ? 'bg-mb-purple shadow-[0_0_15px_#8B5CF6] h-[2px]'
            : 'bg-mb-purple shadow-[0_0_10px_#8B5CF6]'
          }`} />
      )}
    </button>
  ));

  // Stable loading state
  if (loading) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-6">
        <Loader2 className="w-6 h-6 animate-spin text-white/5" />
        <span className="font-mono text-[9px] tracking-[0.4em] uppercase text-white/10">Synchronizing Data Node</span>
      </div>
    );
  }

  const showHeroes = isPageOne && !searchTerm && viewMode === 'standard';

  return (
    <div className="relative w-full">
      <div className="fixed bottom-8 left-10 z-[100] hidden md:block select-none pointer-events-none">
        <InteractiveCredits />
      </div>

      <div className="fixed bottom-4 right-10 z-[100] hidden sm:flex flex-row gap-0.5 pointer-events-auto items-center">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/20 mr-2 select-none">Official links:</span>
        <SocialKey Icon={DiscordIcon} href="https://discord.com/invite/MBkdC3gxcv" />
        <SocialKey Icon={BrandIcon} href="https://www.magicblock.xyz/" iconClassName="w-6 h-6" />
        <SocialKey Icon={XIcon} href="https://x.com/magicblock" />
      </div>

      <div className="fixed top-0 bottom-0 left-0 w-32 md:w-48 z-[100] pointer-events-none hidden md:block" style={{ background: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 30%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.1) 80%, transparent 100%)' }} />
      <div className="fixed top-0 bottom-0 right-0 w-32 md:w-48 z-[100] pointer-events-none hidden md:block" style={{ background: 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 30%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.1) 80%, transparent 100%)' }} />

      <div
        ref={carouselWrapperRef}
        className={`fixed left-0 right-0 z-[5] overflow-visible ${fadeProgress >= 1 ? 'pointer-events-none' : ''}`}
        style={{ top: HEADER_HEIGHT, height: CAROUSEL_HEIGHT }}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute top-[-124px] bottom-0 inset-x-0 flex items-center justify-center pointer-events-none">
            <div className="absolute w-[150vw] h-[100vh] bg-white/[0.05] blur-[250px] rounded-full mix-blend-screen will-change-transform" style={{ transform: 'translateZ(0)' }} />
            <div className="w-[80%] h-[120%] bg-white/[0.12] blur-[180px] rounded-full animate-pulse will-change-transform" style={{ transform: 'translateZ(0)', animationDuration: '4s' }} />
            <div className="absolute w-[40%] h-[80%] bg-white/[0.15] blur-[100px] rounded-full mix-blend-screen will-change-transform" style={{ transform: 'translateZ(0)' }} />
            <div className="absolute w-[20%] h-[40%] bg-white/[0.3] blur-[60px] rounded-full mix-blend-plus-lighter will-change-transform" style={{ transform: 'translateZ(0)' }} />
            <div className="absolute top-0 w-full h-[400px] bg-gradient-to-b from-white/[0.08] to-transparent blur-[120px] will-change-transform" style={{ transform: 'translateZ(0)' }} />
          </div>
        </div>
        <ArtistCarousel containerHeight={CAROUSEL_HEIGHT} fadeProgress={fadeProgress} />
      </div>

      <div className="relative z-[30] w-full pointer-events-none">
        <div className="w-full h-[200px] pointer-events-none" />

        <div
          ref={leaderboardEngineRef}
          className="relative w-full bg-transparent min-h-screen overflow-hidden pointer-events-none"
        >
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[200%] max-w-none z-[5] pointer-events-none">
            <div className="h-full w-full will-change-transform" style={{
              transform: 'translateZ(0)',
              background: 'radial-gradient(ellipse 50% 100% at 50% 50%, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 15%, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0.5) 45%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.15) 75%, rgba(0,0,0,0.05) 85%, transparent 100%)',
              maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.2) 60px, rgba(0,0,0,0.6) 100px, black 140px, black 100%)'
            }} />
          </div>

          <div className="relative z-[40] max-w-6xl mx-auto px-3 sm:px-5 md:px-12 pt-4 pb-24 md:pb-32 pointer-events-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
              <div className="text-left">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-mb-purple shadow-[0_0_10px_#8B5CF6]" />
                  <span className="text-[9px] font-mono tracking-[0.4em] uppercase text-mb-purple font-bold">updated every 24 hours</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-sync font-bold tracking-tighter uppercase text-white leading-none">
                  Leaderboard <span className="text-white/40 font-sans font-bold text-lg md:text-2xl tracking-[0.2em] ml-3">Stats</span>
                </h2>
              </div>

              <div className="relative w-full md:w-auto self-stretch md:self-end">
                {/* Arrow with Text */}
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1, duration: 0.5 }}
                  className="absolute -right-[120px] -top-[28px] pointer-events-none z-[200] hidden md:block"
                >
                  {/* Arrow */}
                  <img
                    src="/arrow.png"
                    alt=""
                    className="w-[140px] h-auto scale-x-[-1] scale-y-[-1] rotate-[0deg]"
                  />
                  {/* Text with pixel positioning - 2 lines */}
                  <div
                    className="absolute left-[70px] top-[110px] text-[10px] font-mono uppercase tracking-[0.3em] text-white rotate-[-23deg] flex flex-col items-center leading-tight"
                  >
                    <span>join the</span>
                    <span>challenge</span>
                  </div>
                </motion.div>

                <motion.button
                  onClick={() => navigate('/card')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(139, 92, 246, 0.6), 0 0 30px rgba(139, 92, 246, 0.3)',
                      '0 0 30px rgba(139, 92, 246, 0.9), 0 0 50px rgba(139, 92, 246, 0.5)',
                      '0 0 20px rgba(139, 92, 246, 0.6), 0 0 30px rgba(139, 92, 246, 0.3)',
                    ]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-full md:w-auto justify-center flex items-center gap-2 px-6 md:px-12 py-2.5 rounded-full bg-white/[0.08] border-2 border-mb-purple text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-white/70 transition-colors duration-300 hover:bg-white/[0.12] hover:text-mb-purple pointer-events-auto backdrop-blur-md"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>User's MagicCard</span>
                </motion.button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 mb-8 md:mb-10 gap-5 md:gap-6 pointer-events-auto">
              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 overflow-visible pointer-events-auto flex-1">
                <span className="text-[7px] md:text-[8px] font-bold uppercase tracking-[0.3em] md:tracking-[0.4em] text-white/10 shrink-0">sort by:</span>
                <div className="flex gap-3 md:gap-6 flex-wrap pointer-events-auto overflow-visible">
                  <div className="relative overflow-visible">
                    <SortButton label="Magician Score" sKey="magician_score" isPrimary={true} />
                    <div
                      ref={tooltipIconRef}
                      className="absolute -top-1 -right-4 group/icon hidden md:block"
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltipPos({ x: rect.right, y: rect.top });
                      }}
                    >
                      <HelpCircle className="w-3 h-3 text-white/20 group-hover/icon:text-mb-purple transition-colors cursor-help pointer-events-auto" />
                      <div
                        className="fixed opacity-0 invisible group-hover/icon:opacity-100 group-hover/icon:visible transition-all duration-300 pointer-events-none"
                        style={{
                          left: `${tooltipPos.x}px`,
                          top: `${tooltipPos.y}px`,
                          transform: 'translate(-100%, -100%) translateY(-8px)',
                          zIndex: 99999
                        }}
                      >
                        <div className="w-64 rounded-2xl border border-white/20 bg-black/90 backdrop-blur-xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.8)]">
                          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent rounded-2xl pointer-events-none" />
                          <div className="relative z-10">
                            <p className="text-[8px] font-mono uppercase tracking-[0.3em] text-white/60 mb-2.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Formula</p>
                            <div className="space-y-1.5">
                              <p className="text-[9px] font-mono leading-relaxed">
                                <span className="text-white/50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">reach =</span> <span className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">log(views)</span>
                              </p>
                              <p className="text-[9px] font-mono leading-relaxed">
                                <span className="text-white/50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">quality =</span> <span className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">log(likes + 2×replies)</span>
                              </p>
                              <p className="text-[9px] font-mono leading-relaxed">
                                <span className="text-white/50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">consistency =</span> <span className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">log(posts)</span>
                              </p>
                              <p className="text-[9px] font-mono leading-relaxed">
                                <span className="text-white/50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">activity =</span> <span className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">min(1, posts/8)</span>
                              </p>
                              <div className="border-t border-white/20 my-2.5" />
                              <p className="text-[9px] font-mono text-white font-semibold leading-relaxed drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                                score = 100 × (0.85×base + 0.15×base×activity)
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-black/90" />
                      </div>
                    </div>
                  </div>
                  <SortButton label="Posts" sKey="posts_count" />
                  <SortButton label="Views" sKey="views_total" />
                  <SortButton label="Likes" sKey="likes_total" />
                  <SortButton label="Replies" sKey="replies_total" />
                  <SortButton label="RTs" sKey="retweets_total" />
                  <SortButton label="Quotes" sKey="quotes_total" />
                </div>
              </div>

              <div className="flex w-full md:w-auto items-center gap-3 md:gap-4 pointer-events-auto">
                <div className="relative flex-1 md:min-w-[200px] group pointer-events-auto">
                  <div className="absolute inset-0 bg-white/[0.07] border border-white/20 rounded-full group-focus-within:bg-white/[0.12] group-focus-within:border-mb-purple/60 group-hover:border-white/30 transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.5)]" />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 group-focus-within:text-mb-purple transition-colors" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="SEARCH ENTITY..."
                    className="relative block w-full pl-10 pr-4 py-2 bg-transparent focus:outline-none transition-all text-white text-[9px] md:text-[10px] font-mono tracking-[0.22em] md:tracking-widest uppercase placeholder:text-white/25 pointer-events-auto"
                  />
                  <div className="absolute bottom-0 left-3 right-3 h-[1px] bg-mb-purple/0 group-focus-within:bg-mb-purple/80 transition-all duration-500 scale-x-0 group-focus-within:scale-x-100 origin-center" />
                </div>

                <div className="relative shrink-0 flex items-center bg-white/[0.07] border border-white/20 p-1.5 rounded-full backdrop-blur-xl h-10 w-24 cursor-pointer select-none group hover:border-white/40 transition-all pointer-events-auto shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                  onClick={() => setViewMode(viewMode === 'standard' ? 'unified' : 'standard')}>
                  <motion.div
                    layout
                    initial={false}
                    animate={{ x: viewMode === 'standard' ? 0 : 36 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="absolute h-7 w-10 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.4)] z-0"
                  />
                  <div className="flex-1 flex justify-center items-center z-10 transition-colors duration-300">
                    <Trophy className={`w-3.5 h-3.5 transition-colors duration-300 ${viewMode === 'standard' ? 'text-black' : 'text-white/40 group-hover:text-white/60'}`} />
                  </div>
                  <div className="flex-1 flex justify-center items-center z-10 transition-colors duration-300">
                    <LayoutList className={`w-3.5 h-3.5 transition-colors duration-300 ${viewMode === 'unified' ? 'text-black' : 'text-white/40 group-hover:text-white/60'}`} />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pointer-events-auto">
              {!loading && paginatedUsers.length === 0 ? (
                // Neutral empty state for zero search results
                <div className="w-full py-24 flex flex-col items-center justify-center border border-white/5 rounded-3xl bg-white/[0.01] backdrop-blur-sm">
                  <div className="w-1 h-1 rounded-full bg-white/20 mb-6 animate-pulse" />
                  <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-white/10 select-none">No matching nodes detected</p>
                </div>
              ) : (
                <>
                  {showHeroes && (
                    <>
                      <div className="hidden md:grid grid-cols-3 gap-4 mb-6">
                        {paginatedUsers.slice(0, 3).map((user) => (
                          <UserCard key={user.username} user={user} position={user.stable_rank!} activeSortKey={sortKey} variant="hero" />
                        ))}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 md:hidden">
                        {paginatedUsers.slice(0, 3).map((user) => (
                          <UserCard
                            key={user.username}
                            user={user}
                            position={user.stable_rank!}
                            variant="compact"
                            activeSortKey={sortKey}
                          />
                        ))}
                      </div>
                    </>
                  )}

                  <div className="flex flex-col gap-4">
                    {paginatedUsers.slice(showHeroes ? 3 : 0).map((user) => (
                      <UserCard
                        key={user.username}
                        user={user}
                        position={user.stable_rank!}
                        variant="compact"
                        activeSortKey={sortKey}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between mt-12 md:mt-16 px-1 md:px-2 pointer-events-auto">
                <div className="text-[8px] md:text-[9px] font-mono text-white/10 uppercase tracking-[0.25em] md:tracking-widest">
                  Showing results {((currentPage - 1) * ITEMS_PER_PAGE) + 1} — {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)}
                </div>
                <div className="flex items-center gap-8 md:gap-12 pointer-events-auto">
                  <button
                    onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); }}
                    disabled={currentPage === 1}
                    className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/20 hover:text-white disabled:opacity-0 transition-all pointer-events-auto"
                  >
                    Prev
                  </button>
                  <div className="font-mono text-xs font-bold text-white/50">
                    {currentPage.toString().padStart(2, '0')} <span className="mx-2 text-white/10">/</span> {totalPages.toString().padStart(2, '0')}
                  </div>
                  <button
                    onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); }}
                    disabled={currentPage === totalPages}
                    className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/20 hover:text-white disabled:opacity-0 transition-all pointer-events-auto"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
