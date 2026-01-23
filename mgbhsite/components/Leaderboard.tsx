
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { fetchLeaderboardData } from '@/services/dataService';
import { User } from '@/types';
import UserCard from './UserCard';
import { Loader2, Search, Trophy, LayoutList, Inbox } from 'lucide-react';
import ArtistCarousel from './ArtistCarousel';
import { HEADER_HEIGHT } from './Header';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, AnimatePresence } from 'framer-motion';

gsap.registerPlugin(ScrollTrigger);

type SortKey = 'posts_count' | 'views_total' | 'likes_total' | 'replies_total' | 'retweets_total' | 'quotes_total';
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

const SocialKey: React.FC<SocialKeyProps> = ({ Icon, href, iconClassName = "w-4 h-4" }) => {
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
};

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

const CharacterFlip: React.FC<CharacterFlipProps> = ({ char, index, isLink }) => {
  return (
    <MotionDiv
      initial="initial"
      whileHover="hover"
      className={`text-[9px] font-mono uppercase tracking-[0.25em] font-bold inline-block cursor-help ${isLink ? 'group-hover/credit:text-mb-purple' : ''}`}
    >
      <motion.span
        variants={{
          initial: {
            rotateX: 0,
            opacity: isLink ? 0.7 : 0.5,
            color: isLink ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)',
            y: 0
          },
          hover: {
            rotateX: 360,
            opacity: 1,
            color: '#8B5CF6',
            y: [0, -2, 0],
            transition: {
              duration: 0.5,
              ease: "easeInOut",
              delay: index * 0.03
            }
          }
        }}
        style={{
          display: 'inline-block',
          transformStyle: 'preserve-3d',
          perspective: '1000px'
        }}
      >
        {char === ' ' ? '\u00A0' : char}
      </motion.span>
    </MotionDiv>
  );
};

interface LeaderboardProps {
  headerRef: React.RefObject<HTMLElement>;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ headerRef }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('posts_count');
  const [viewMode, setViewMode] = useState<ViewMode>('standard');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [fadeProgress, setFadeProgress] = useState(0);

  const carouselWrapperRef = useRef<HTMLDivElement>(null);
  const leaderboardEngineRef = useRef<HTMLDivElement>(null);
  const isFirstRun = useRef(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchLeaderboardData();
        setUsers(data);
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
        scrub: true,
        onUpdate: (self) => {
          setFadeProgress(self.progress);
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
      ScrollTrigger.refresh();
    }
  }, [viewMode, sortKey, searchTerm, loading]);

  // Step 1: Sort the full list and assign a stable leaderboard rank based on that sort
  const rankedUsers = useMemo(() => {
    const sorted = [...users].sort((a, b) => (b[sortKey] as number) - (a[sortKey] as number));
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
  }

  const SortButton: React.FC<SortButtonProps> = ({ label, sKey }) => (
    <button
      onClick={() => { setSortKey(sKey); setCurrentPage(1); }}
      className={`relative px-0 py-4 text-[10px] font-bold uppercase tracking-[0.3em] transition-all duration-300 pointer-events-auto group ${sortKey === sKey
        ? 'text-white'
        : 'text-white/20 hover:text-white/40'
        }`}
    >
      <span className="relative z-10">{label}</span>
      {sortKey === sKey && (
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-mb-purple shadow-[0_0_10px_#8B5CF6]" />
      )}
    </button>
  );

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

      <div className="fixed bottom-4 right-10 z-[100] flex flex-row gap-0.5 pointer-events-auto items-center">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/20 mr-2 select-none">Official links:</span>
        <SocialKey Icon={DiscordIcon} href="https://discord.com/invite/MBkdC3gxcv" />
        <SocialKey Icon={BrandIcon} href="https://www.magicblock.xyz/" iconClassName="w-6 h-6" />
        <SocialKey Icon={XIcon} href="https://x.com/magicblock" />
      </div>

      <div className="fixed top-0 left-0 w-8 md:w-32 h-screen bg-gradient-to-r from-black via-black/30 to-transparent z-[10] pointer-events-none" />
      <div className="fixed top-0 right-0 w-8 md:w-32 h-screen bg-gradient-to-l from-black via-black/30 to-transparent z-[10] pointer-events-none" />

      <div
        ref={carouselWrapperRef}
        className={`fixed left-0 right-0 z-[5] overflow-visible ${fadeProgress >= 1 ? 'pointer-events-none' : ''}`}
        style={{ top: HEADER_HEIGHT, height: CAROUSEL_HEIGHT }}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute top-[-124px] bottom-0 inset-x-0 flex items-center justify-center pointer-events-none">
            <div className="absolute w-[150vw] h-[100vh] bg-white/[0.05] blur-[250px] rounded-full mix-blend-screen" />
            <div className="w-[80%] h-[120%] bg-white/[0.12] blur-[180px] rounded-full animate-pulse" />
            <div className="absolute w-[40%] h-[80%] bg-white/[0.15] blur-[100px] rounded-full mix-blend-screen" />
            <div className="absolute w-[20%] h-[40%] bg-white/[0.3] blur-[60px] rounded-full mix-blend-plus-lighter" />
            <div className="absolute top-0 w-full h-[400px] bg-gradient-to-b from-white/[0.08] to-transparent blur-[120px]" />
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
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-[110rem] z-[5] pointer-events-none">
            <div className="h-full w-full bg-black/80 blur-[150px] [mask-image:linear-gradient(to_bottom,transparent,black_140px,black_100%)]" />
          </div>

          <div className="relative z-[40] max-w-6xl mx-auto px-6 md:px-12 pt-4 pb-32 pointer-events-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div className="text-left">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-mb-purple shadow-[0_0_10px_#8B5CF6]" />
                  <span className="text-[9px] font-mono tracking-[0.4em] uppercase text-mb-purple font-bold">updated every 24 hours</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-sync font-bold tracking-tighter uppercase text-white leading-none">
                  Leaderboard <span className="text-white/40 font-sans font-bold text-lg md:text-2xl tracking-[0.2em] ml-3">Stats</span>
                </h2>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 mb-10 gap-6 pointer-events-auto">
              <div className="flex items-center gap-10 overflow-x-auto no-scrollbar pointer-events-auto">
                <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-white/10 shrink-0">sort by:</span>
                <div className="flex gap-8 whitespace-nowrap pointer-events-auto">
                  <SortButton label="Posts" sKey="posts_count" />
                  <SortButton label="Views" sKey="views_total" />
                  <SortButton label="Likes" sKey="likes_total" />
                  <SortButton label="Replies" sKey="replies_total" />
                  <SortButton label="RTs" sKey="retweets_total" />
                  <SortButton label="Quotes" sKey="quotes_total" />
                </div>
              </div>

              <div className="flex items-center gap-6 mb-4 md:mb-0 pointer-events-auto">
                <div className="relative min-w-[200px] group pointer-events-auto">
                  <div className="absolute inset-0 bg-white/[0.07] border border-white/20 rounded-full group-focus-within:bg-white/[0.12] group-focus-within:border-mb-purple/60 group-hover:border-white/30 transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.5)]" />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 group-focus-within:text-mb-purple transition-colors" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="SEARCH ENTITY..."
                    className="relative block w-full pl-10 pr-4 py-2 bg-transparent focus:outline-none transition-all text-white text-[10px] font-mono tracking-widest uppercase placeholder:text-white/25 pointer-events-auto"
                  />
                  <div className="absolute bottom-0 left-3 right-3 h-[1px] bg-mb-purple/0 group-focus-within:bg-mb-purple/80 transition-all duration-500 scale-x-0 group-focus-within:scale-x-100 origin-center" />
                </div>

                <div className="relative flex items-center bg-white/[0.07] border border-white/20 p-1.5 rounded-full backdrop-blur-xl h-10 w-24 cursor-pointer select-none group hover:border-white/40 transition-all pointer-events-auto shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      {paginatedUsers.slice(0, 3).map((user) => (
                        <UserCard key={user.username} user={user} position={user.stable_rank!} activeSortKey={sortKey} variant="hero" />
                      ))}
                    </div>
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
              <div className="flex items-center justify-between mt-16 px-2 pointer-events-auto">
                <div className="text-[9px] font-mono text-white/10 uppercase tracking-widest">
                  Showing results {((currentPage - 1) * ITEMS_PER_PAGE) + 1} — {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)}
                </div>
                <div className="flex items-center gap-12 pointer-events-auto">
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
