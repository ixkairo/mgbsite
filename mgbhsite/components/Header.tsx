
import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { APP_CONFIG } from '../constants';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, AnimatePresence } from 'framer-motion';

gsap.registerPlugin(ScrollTrigger);

export const HEADER_HEIGHT = 140;

const CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const MotionDiv = motion.div as any;
const MotionSpan = motion.span as any;

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

const RotatingLetter: React.FC<{ letter: string; index: number }> = ({ letter, index }) => {
  return (
    <MotionSpan
      style={{ 
        display: 'inline-block', 
        transformStyle: 'preserve-3d',
        perspective: '1000px'
      }}
      whileHover={{ 
        rotateX: -360,
        color: '#8B5CF6',
        transition: { 
          duration: 0.8, 
          ease: "easeInOut" 
        }
      }}
    >
      {letter === ' ' ? '\u00A0' : letter}
    </MotionSpan>
  );
};

interface HeaderProps {
  onLogoClick?: () => void;
  onLeaderboardClick?: () => void;
}

const Header = forwardRef<HTMLElement, HeaderProps>(({ onLogoClick, onLeaderboardClick }, ref) => {
  const brandRef = useRef<HTMLDivElement>(null);
  const navItemsRef = useRef<HTMLDivElement>(null);
  const marqueeWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const brand = brandRef.current;
    const navItems = navItemsRef.current;
    const marquee = marqueeWrapperRef.current;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: document.body,
          start: "top top",
          end: "400px top",
          scrub: 1.5,
          invalidateOnRefresh: true,
        }
      });

      if (brand) tl.to(brand, { x: -1200, opacity: 0, ease: "power1.inOut" }, 0);
      if (navItems) tl.to(navItems, { x: 1200, opacity: 0, ease: "power1.inOut" }, 0);
      if (marquee) tl.to(marquee, { x: -1500, opacity: 0, ease: "power1.inOut" }, 0);
    });

    return () => ctx.revert();
  }, []);

  const leaderboardText = "Leaderboard";

  const sharedTransition = { duration: 0.4, ease: "easeOut" };

  return (
    <header 
      ref={ref}
      className="fixed top-0 left-0 right-0 z-[60] flex flex-col pointer-events-none"
    >
      {/* Marquee Row - Set to pointer-events-none so it doesn't block underlying content */}
      <div className="w-full h-8 overflow-hidden flex items-center relative pointer-events-none bg-transparent">
        <div 
          ref={marqueeWrapperRef}
          className="whitespace-nowrap animate-[marquee_30s_linear_infinite] font-black text-[11px] tracking-[0.8em] uppercase px-4 text-white/30"
        >
          {APP_CONFIG.MARQUEE_TEXT} &nbsp;&nbsp;&nbsp; {APP_CONFIG.MARQUEE_TEXT}
        </div>
      </div>

      {/* Main Nav Row - Set to pointer-events-none so the center gap allows clicks through */}
      <div className="w-full h-[100px] flex items-center justify-between px-4 md:px-10 pointer-events-none relative">
        <MotionDiv 
          ref={brandRef}
          onClick={onLogoClick}
          className="flex items-center gap-3 md:gap-5 cursor-pointer select-none pointer-events-auto"
          whileHover="hover"
          initial="initial"
        >
          <MotionDiv 
            variants={{
              hover: { scale: 1.15, rotate: [0, -5, 5, 0], transition: sharedTransition },
              initial: { scale: 1, rotate: 0, transition: sharedTransition }
            }}
            className="relative w-10 h-10 md:w-14 md:h-14 flex items-center justify-center"
          >
            <img 
              src="https://github.com/argonq1/dasdsassad/blob/main/MagicBlock-Logomark-White.webp?raw=true" 
              alt="MagicBlock Logo" 
              className="h-full w-full object-contain brightness-200" 
            />
          </MotionDiv>

          <MotionDiv 
            className="flex flex-col justify-center"
          >
            <MotionSpan 
              variants={{
                hover: { 
                  color: '#8B5CF6', 
                  x: 4,
                  textShadow: '0 0 15px rgba(139,92,246,0.4)',
                  transition: sharedTransition 
                },
                initial: {
                  color: '#ffffff',
                  x: 0,
                  textShadow: '0 0 0px rgba(0,0,0,0)',
                  transition: sharedTransition
                }
              }}
              className="font-sync font-bold text-[14px] md:text-[18px] uppercase leading-none tracking-tight text-white"
            >
              MagicBlock
            </MotionSpan>
            <MotionSpan 
              variants={{
                hover: { 
                  color: '#8B5CF6', 
                  x: 4,
                  textShadow: '0 0 15px rgba(139,92,246,0.4)',
                  transition: sharedTransition 
                },
                initial: {
                  color: 'rgba(255, 255, 255, 0.2)',
                  x: 0,
                  textShadow: '0 0 0px rgba(0,0,0,0)',
                  transition: sharedTransition
                }
              }}
              className="text-[8px] md:text-[10px] tracking-[0.2em] md:tracking-[0.4em] uppercase font-bold text-white/20 mt-1"
            >
              Community Hub
            </MotionSpan>
          </MotionDiv>
        </MotionDiv>

        <div 
          ref={navItemsRef}
          className="flex items-center gap-4 md:gap-14 pointer-events-auto"
        >
             <div className="flex items-center gap-4 md:gap-12 whitespace-nowrap">
                <MotionDiv 
                  onClick={onLeaderboardClick}
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 md:gap-4 cursor-pointer group/lb relative pointer-events-auto"
                >
                   <MotionDiv 
                    className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-mb-purple shadow-[0_0_12px_#8B5CF6]"
                   />
                   <div className="text-[10px] md:text-[14px] font-mono uppercase tracking-[0.15em] md:tracking-[0.4em] text-white/70 font-bold flex overflow-hidden">
                      {leaderboardText.split('').map((char, i) => (
                        <RotatingLetter key={i} letter={char} index={i} />
                      ))}
                   </div>
                </MotionDiv>

                <InteractiveScrambler />
             </div>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';
export default Header;
