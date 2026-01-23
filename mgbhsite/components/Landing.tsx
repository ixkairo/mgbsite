
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_CONFIG } from '../constants';

const CINEMATIC_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const CUSTOM_CENTRAL_LOGO = "https://github.com/argonq1/dasdsassad/blob/main/MagicBlock-Logomark-White.webp?raw=true";
const BG_STYLIZED_IMAGE = "https://r2.flowith.net/gemini-proxy-go/1768800721916/24a7a252-c052-4680-813d-9f1fc2c0bc76.jpg";

const MotionDiv = motion.div as any;
const MotionH1 = motion.h1 as any;
const MotionButton = motion.button as any;
const MotionSpan = motion.span as any;

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

const InteractiveScrambler: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [text, setText] = useState('');
  const targetText = "COMING SOON...";
  const displayLength = 12;

  useEffect(() => {
    const interval = setInterval(() => {
      if (isHovered) {
        let result = '';
        for (let i = 0; i < displayLength; i++) {
          if (Math.random() > 0.8) {
            result += targetText[i] || CHARS.charAt(Math.floor(Math.random() * CHARS.length));
          } else {
            result += targetText[i] || ' ';
          }
        }
        setText(result);
      } else {
        let result = '';
        for (let i = 0; i < 8; i++) {
          result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
        }
        setText(result);
      }
    }, 80);
    return () => clearInterval(interval);
  }, [isHovered]);

  return (
    <div
      className="hidden md:flex items-center gap-4 group relative cursor-help pointer-events-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        animate={{
          scale: isHovered ? [1, 1.5, 1] : 1,
          backgroundColor: isHovered ? '#FF3131' : 'rgba(255,255,255,0.05)',
          boxShadow: isHovered ? '0 0 15px #FF3131' : '0 0 0px transparent'
        }}
        className="w-2 h-2 rounded-full transition-colors duration-300"
      />
      <div className="relative">
        <motion.div
          animate={{
            width: isHovered ? '130px' : '80px',
            color: isHovered ? '#ffffff' : 'rgba(255,255,255,0.1)',
            textShadow: isHovered ? '0 0 10px rgba(255,49,49,0.8)' : 'none'
          }}
          className="text-[12px] font-mono uppercase tracking-[0.2em] overflow-hidden leading-none whitespace-nowrap transition-all duration-500"
        >
          {isHovered ? targetText : text}
        </motion.div>

        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="absolute -bottom-4 left-0 text-[7px] font-bold text-[#FF3131] tracking-[0.3em] uppercase"
            >
              Module Locked
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const PremiumTextReveal = ({ text, delay = 0, skip }: { text: string; delay?: number; skip?: boolean }) => {
  const lines = text.split('\n');

  return (
    <MotionDiv
      initial={skip ? "visible" : "hidden"}
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.1,
            delayChildren: skip ? 0 : delay
          }
        }
      }}
      className="flex flex-col gap-0 relative z-10"
    >
      {lines.map((line, idx) => (
        <MotionDiv
          key={idx}
          variants={{
            hidden: { opacity: 0, y: 15, filter: 'blur(10px)' },
            visible: {
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
              transition: { duration: 1.2, ease: CINEMATIC_EASE }
            }
          }}
          className="relative"
        >
          {line || '\u00A0'}
        </MotionDiv>
      ))}
    </MotionDiv>
  );
};

const RotatingLetter: React.FC<{ letter: string; index: number }> = ({ letter, index }) => {
  return (
    <MotionSpan
      style={{ display: 'inline-block', transformStyle: 'preserve-3d', perspective: '1000px' }}
      whileHover={{ rotateX: -360, color: '#8B5CF6', transition: { duration: 0.6, ease: "easeInOut" } }}
    >
      {letter === ' ' ? '\u00A0' : letter}
    </MotionSpan>
  );
};

const CreatorChip = ({ name, href, delay, skip }: { name: string; href: string; delay: number; skip?: boolean }) => (
  <motion.a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    initial={skip ? { opacity: 1, scale: 1, filter: 'blur(0px)' } : { opacity: 0, scale: 0.9, filter: 'blur(8px)' }}
    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
    transition={{ delay: skip ? 0 : delay, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.5)' }}
    className="flex items-center gap-2 px-4 py-1.5 md:px-6 md:py-2 rounded-full bg-white/[0.08] border border-white/20 hover:shadow-[0_0_25px_rgba(255,255,255,0.1)] transition-all duration-500 group/chip cursor-pointer backdrop-blur-xl relative"
  >
    <XIcon className="w-2.5 h-2.5 md:w-3 md:h-3 text-white/60 group-hover/chip:text-white transition-all relative z-10" />
    <span className="text-[11px] md:text-[14px] font-black text-white tracking-tight relative z-10">
      {name}
    </span>
    <div className="absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent scale-x-0 group-hover/chip:scale-x-100 transition-transform duration-500" />
  </motion.a>
);

const InteractiveCredits = ({ skip }: { skip?: boolean }) => {
  return (
    <MotionDiv
      initial={skip ? { opacity: 0.9, y: 0 } : { opacity: 0, y: 20, filter: 'blur(5px)' }}
      animate={{ opacity: 0.9, y: 0, filter: 'blur(0px)' }}
      transition={{ delay: skip ? 0 : 0.8, duration: 1, ease: CINEMATIC_EASE }}
      className="flex flex-col items-center gap-4 pointer-events-auto select-none relative z-30 transition-all hover:opacity-100 duration-700"
    >
      <div className="flex items-center gap-4 md:gap-6 text-white text-[11px] md:text-[13px] uppercase font-black tracking-[0.4em] md:tracking-[0.5em]">
        <div className="h-px w-10 md:w-14 bg-gradient-to-r from-transparent to-white/50" />
        <span>Built by</span>
        <div className="h-px w-10 md:w-14 bg-gradient-to-l from-transparent to-white/50" />
      </div>
      <div className="flex items-center gap-5 md:gap-8">
        <CreatorChip name="ixkairo" href="https://x.com/ixkairo" delay={1} skip={skip} />
        <CreatorChip name="argonq" href="https://x.com/argonzs" delay={1.15} skip={skip} />
      </div>
    </MotionDiv>
  );
};

const SocialKey = ({ Icon, delay, href, skip, iconClassName = "w-4 h-4" }: { Icon: any, delay: number, href?: string, skip?: boolean, iconClassName?: string }) => {
  const Component = (href ? motion.a : motion.div) as any;
  return (
    <Component
      href={href}
      target={href ? "_blank" : undefined}
      rel={href ? "noopener noreferrer" : undefined}
      initial={skip ? { opacity: 0.15, scale: 1 } : { opacity: 0, scale: 0.8 }}
      animate={{ opacity: 0.15, scale: 1 }}
      whileHover={{ opacity: 1, scale: 1.15, y: -2 }}
      whileTap={{ scale: 0.95 }}
      transition={{ delay: skip ? 0 : delay, duration: 0.4 }}
      className="relative group p-2 flex items-center justify-center cursor-pointer pointer-events-auto transition-all"
    >
      <Icon className={`${iconClassName} text-white transition-all duration-300 group-hover:drop-shadow-[0_0_15px_rgba(139,92,246,0.9)] relative z-10`} />
    </Component>
  );
};

export const Landing = ({ onStart, skipAnimations = false }: { onStart: () => void, skipAnimations?: boolean }) => {
  const [stage, setStage] = useState<'idle' | 'final'>(skipAnimations ? 'final' : 'idle');
  const [autoLightPos, setAutoLightPos] = useState({ x: 50, y: 50 });
  const [showButton, setShowButton] = useState(skipAnimations);
  const [isLaunching, setIsLaunching] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (skipAnimations) return;

    setStage('final');
    const bt = setTimeout(() => setShowButton(true), 2500);

    let timeoutId: ReturnType<typeof setTimeout>;
    const moveFlashlight = () => {
      setAutoLightPos({
        x: random(10, 90),
        y: random(15, 85)
      });
      timeoutId = setTimeout(moveFlashlight, 5000);
    };

    const random = (min: number, max: number) => Math.random() * (max - min) + min;

    moveFlashlight();
    return () => {
      clearTimeout(bt);
      clearTimeout(timeoutId);
    };
  }, [skipAnimations]);

  useEffect(() => {
    if (!skipAnimations) return;
    let timeoutId: ReturnType<typeof setTimeout>;
    const moveFlashlight = () => {
      setAutoLightPos({
        x: Math.random() * 80 + 10,
        y: Math.random() * 70 + 15
      });
      timeoutId = setTimeout(moveFlashlight, 5000);
    };
    moveFlashlight();
    return () => clearTimeout(timeoutId);
  }, [skipAnimations]);

  const handleLaunchClick = () => {
    if (isLaunching) return;
    setIsLaunching(true);
    onStart();
  };

  const leaderboardText = "Leaderboard";

  return (
    <div
      ref={scrollContainerRef}
      className="w-full h-screen font-sans selection:bg-mb-purple selection:text-white overflow-hidden flex flex-col items-center relative bg-black"
    >
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-black">
        <div
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1500 ${stage === 'final' ? 'opacity-[0.1]' : 'opacity-0'}`}
          style={{ backgroundImage: `url('${BG_STYLIZED_IMAGE}')` }}
        />
        <MotionDiv
          className={`absolute inset-0 z-10 transition-opacity duration-1500 ${stage === 'final' ? 'opacity-100' : 'opacity-0'}`}
          animate={{
            WebkitMaskImage: `radial-gradient(circle 250px at ${autoLightPos.x}% ${autoLightPos.y}%, black 0%, rgba(0,0,0,0.1) 50%, transparent 100%)`,
            maskImage: `radial-gradient(circle 250px at ${autoLightPos.x}% ${autoLightPos.y}%, black 0%, rgba(0,0,0,0.1) 50%, transparent 100%)`
          }}
          transition={{ duration: 5, ease: "linear" }}
        >
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${BG_STYLIZED_IMAGE}')`, filter: 'brightness(1.2)' }} />
        </MotionDiv>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.8)_100%)] z-15" />
      </div>

      <div className="w-full h-full flex flex-col items-center relative">
        <MotionDiv
          initial={skipAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] flex flex-col pointer-events-auto"
        >
          <div className="w-full h-8 overflow-hidden flex items-center relative bg-white/[0.02] border-b border-white/5 backdrop-blur-sm">
            <div className="whitespace-nowrap animate-[marquee_50s_linear_infinite] font-black text-[9px] tracking-[0.6em] uppercase px-4 text-white/30">
              {APP_CONFIG.MARQUEE_TEXT} &nbsp;&nbsp;&nbsp; {APP_CONFIG.MARQUEE_TEXT}
            </div>
          </div>
          <nav className="w-full h-[60px] flex items-center justify-end px-4 md:px-10 relative bg-transparent">
            <div className="flex items-center gap-4 md:gap-14">
              <div className="flex items-center gap-4 md:gap-12 whitespace-nowrap">
                <MotionDiv
                  onClick={handleLaunchClick}
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 md:gap-4 cursor-pointer group/lb relative"
                >
                  <MotionDiv
                    className="w-1 md:w-2 h-1 md:h-2 rounded-full bg-mb-purple shadow-[0_0_12px_#8B5CF6]"
                  />
                  <div className="text-[10px] md:text-[14px] font-mono uppercase tracking-[0.2em] md:tracking-[0.4em] text-white/70 font-bold flex overflow-hidden">
                    {leaderboardText.split('').map((char, i) => (
                      <RotatingLetter key={i} letter={char} index={i} />
                    ))}
                  </div>
                </MotionDiv>
                <InteractiveScrambler />
              </div>
            </div>
          </nav>
        </MotionDiv>

        <div className={`relative z-50 w-full flex flex-col items-center justify-center md:justify-start pt-0 md:pt-16 pb-6 px-4 md:px-6 max-w-7xl mx-auto flex-grow ${stage === 'final' ? 'opacity-100' : 'opacity-0'} transition-opacity duration-1500`}>
          <div className="flex flex-col items-center gap-2 md:gap-3 cursor-default relative shrink-0">
            <div className="flex items-center gap-2 md:gap-4 relative z-10 translate-x-0 md:translate-x-4">
              <MotionDiv
                initial={skipAnimations ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
                animate={stage === 'final' ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 1.2, ease: CINEMATIC_EASE, delay: 0.3 }}
              >
                <img src={CUSTOM_CENTRAL_LOGO} alt="Brand" className="w-24 h-24 md:w-64 md:h-64 object-contain brightness-110 drop-shadow-[0_0_50px_rgba(255,255,255,0.25)]" />
              </MotionDiv>
              <div className="flex flex-col whitespace-nowrap">
                <MotionH1
                  initial={skipAnimations ? { opacity: 1, x: 0 } : { opacity: 0, x: 15 }}
                  animate={stage === 'final' ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 1, ease: CINEMATIC_EASE, delay: 0.5 }}
                  className="text-3xl md:text-7xl lg:text-8xl font-sync font-bold tracking-tighter lowercase leading-none text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                >
                  community
                </MotionH1>
                <div className="flex items-end gap-2 md:gap-4 mt-1 md:mt-2">
                  <MotionH1
                    initial={skipAnimations ? { opacity: 1, x: 0 } : { opacity: 0, x: 15 }}
                    animate={stage === 'final' ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 1, ease: CINEMATIC_EASE, delay: 0.7 }}
                    className="text-xl md:text-5xl lg:text-6xl font-sync font-bold tracking-tight uppercase leading-none text-mb-purple italic drop-shadow-[0_0_25px_rgba(139,92,246,0.7)]"
                  >
                    HUB
                  </MotionH1>
                  <MotionDiv
                    initial={skipAnimations ? { opacity: 1 } : { opacity: 0 }}
                    animate={stage === 'final' ? { opacity: 1 } : {}}
                    transition={{ delay: 1.1, duration: 1 }}
                    className="flex flex-col text-white/50 font-sync font-bold text-[7px] md:text-[11px] tracking-[0.2em] uppercase mb-0.5 md:mb-1.5"
                  >
                    <span>Where people building</span>
                    <span>together</span>
                  </MotionDiv>
                </div>
              </div>
            </div>
            <div className="w-full max-w-sm md:max-w-lg relative z-30 mt-6 md:mt-33">
              <div className="relative z-10 text-white font-sans text-[11px] md:text-[14px] font-normal leading-[1.8] md:leading-[1.8] tracking-[0.08em] text-center uppercase whitespace-pre-line drop-shadow-[0_2px_15px_rgba(0,0,0,1)] px-4">
                {stage === 'final' && (
                  <PremiumTextReveal
                    delay={1.4}
                    text={`We made this for people who take part and stay involved
Who share thoughts, react, and don't just pass by
Nothing here works without real participation
That's the whole point`}
                    skip={skipAnimations}
                  />
                )}
              </div>
            </div>
          </div>
          <AnimatePresence>
            {showButton && (
              <div className="mt-4 md:mt-8 scale-90 md:scale-100">
                <InteractiveCredits skip={skipAnimations} />
              </div>
            )}
          </AnimatePresence>
          <div className="w-full flex flex-col items-center justify-center relative shrink-0 pt-8 md:pt-16 pb-8 md:pb-16 z-50">
            <AnimatePresence>
              {showButton && (
                <MotionDiv
                  initial={skipAnimations ? { y: 0, opacity: 1 } : { y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.8, ease: CINEMATIC_EASE }}
                  className="relative w-full flex justify-center items-center"
                >
                  <div className="pointer-events-auto relative">
                    <motion.div
                      animate={{
                        opacity: [0.3, 0.6, 0.3],
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute inset-0 rounded-full bg-mb-purple/40 blur-[20px] pointer-events-none"
                    />

                    <MotionButton
                      onClick={handleLaunchClick}
                      disabled={isLaunching}
                      initial={skipAnimations ? { opacity: 0.9, y: 0 } : { opacity: 0, y: 20 }}
                      animate={isLaunching ? {
                        scale: 0.98,
                        backgroundColor: '#8B5CF6',
                        borderColor: '#ffffff',
                        boxShadow: '0 0 40px rgba(139,92,246,0.6)',
                        opacity: 1,
                        y: 0
                      } : {
                        scale: 1,
                        boxShadow: '0 0 20px rgba(139,92,246,0.15)',
                        opacity: 0.9,
                        y: 0
                      }}
                      whileHover={!isLaunching ? {
                        scale: 1.03,
                        backgroundColor: 'rgba(139, 92, 246, 0.15)',
                        borderColor: 'rgba(255, 255, 255, 0.6)',
                        boxShadow: '0 0 35px rgba(139,92,246,0.4)',
                        opacity: 1
                      } : {}}
                      whileTap={!isLaunching ? {
                        scale: 0.96,
                        backgroundColor: 'rgba(139, 92, 246, 0.25)',
                        transition: { duration: 0.1 }
                      } : {}}
                      className={`
                            group relative flex items-center justify-center px-10 md:px-14 py-2.5 md:py-3.5 
                            bg-mb-purple/[0.08] backdrop-blur-2xl border-[1.5px] border-mb-purple/30 
                            text-white font-sync font-bold uppercase text-[9px] md:text-[11px] 
                            tracking-[0.4em] md:tracking-[0.5em] rounded-full transition-all duration-500 overflow-hidden min-w-[180px] md:min-w-[240px]
                          `}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-mb-purple/20 to-transparent pointer-events-none"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      />

                      <span className="relative z-10 transition-transform duration-200 group-hover:scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                        {isLaunching ? 'Lifting...' : 'Launch'}
                      </span>

                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.1] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      <div className={`absolute inset-0 bg-white opacity-0 group-active:opacity-10 transition-opacity duration-100`} />
                    </MotionButton>
                  </div>
                </MotionDiv>
              )}
            </AnimatePresence>
          </div>
        </div>
        <AnimatePresence>
          {showButton && (
            <MotionDiv
              initial={skipAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: skipAnimations ? 0 : 0.2 }}
              className="fixed bottom-4 right-6 md:right-10 z-[100] flex flex-row gap-0.5 pointer-events-auto items-center"
            >
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/20 mr-2 select-none">Official links:</span>
              <SocialKey Icon={DiscordIcon} delay={0.6} href="https://discord.com/invite/MBkdC3gxcv" skip={skipAnimations} iconClassName="w-3.5 h-3.5 md:w-4 md:h-4" />
              <SocialKey Icon={BrandIcon} delay={0.7} href="https://www.magicblock.xyz/" skip={skipAnimations} iconClassName="w-5 h-5 md:w-6 md:h-6" />
              <SocialKey Icon={XIcon} delay={0.8} href="https://x.com/magicblock" skip={skipAnimations} iconClassName="w-3.5 h-3.5 md:w-4 md:h-4" />
            </MotionDiv>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
