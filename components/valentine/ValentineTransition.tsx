import React, { useEffect, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TRANSITION_DURATION = 1.8;

interface RainHeart {
    id: number;
    x: number;
    delay: number;
    size: number;
    duration: number;
    rotate: number;
}

const FallingHeart = memo(({ h }: { h: RainHeart }) => (
    <motion.div
        initial={{ y: '-20vh', opacity: 0, x: `${h.x}vw`, rotate: h.rotate }}
        animate={{
            y: '120vh',
            opacity: [0, 0.3, 0.3, 0],
            rotate: h.rotate + 360
        }}
        transition={{
            duration: h.duration,
            delay: h.delay,
            ease: "linear"
        }}
        className="absolute text-pink-500/20 blur-[1px] pointer-events-none"
    >
        <svg width={h.size} height={h.size} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
    </motion.div>
));

FallingHeart.displayName = "FallingHeart";

export const ValentineTransition: React.FC = () => {
    // 1. Immediate check to prevent any flicker during render
    const [hasPlayed] = useState(() => !!sessionStorage.getItem('valentine_transition_played'));
    const [isVisible, setIsVisible] = useState(!hasPlayed);
    const [rainHearts, setRainHearts] = useState<RainHeart[]>([]);

    useEffect(() => {
        if (hasPlayed) return;

        // Set played immediately
        sessionStorage.setItem('valentine_transition_played', 'true');

        const hearts = Array.from({ length: 50 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            delay: Math.random() * 1.0,
            size: 10 + Math.random() * 40,
            duration: 1.0 + Math.random() * 1.5,
            rotate: Math.random() * 360
        }));
        setRainHearts(hearts);

        const timer = setTimeout(() => {
            setIsVisible(false);
        }, TRANSITION_DURATION * 1000);

        return () => clearTimeout(timer);
    }, [hasPlayed]);

    if (hasPlayed) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    key="sync-transition"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="fixed inset-0 z-[1000] bg-black overflow-hidden pointer-events-none"
                >
                    {/* Layer 1: Background Rain */}
                    {rainHearts.map(h => (
                        <FallingHeart key={h.id} h={h} />
                    ))}

                    {/* Layer 2: Hero Heart */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{
                                scale: [0, 1.1, 1],
                                opacity: 0.3
                            }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="absolute w-80 h-80 bg-pink-500/10 blur-[100px] rounded-full"
                        />

                        <motion.div
                            initial={{ scale: 0, rotate: -20, opacity: 0 }}
                            animate={{
                                scale: [0, 1.05, 1],
                                rotate: [-20, 5, 0],
                                opacity: [0, 0.5, 0.4]
                            }}
                            transition={{
                                duration: 0.7,
                                ease: "easeOut"
                            }}
                            className="relative z-10 text-pink-500 drop-shadow-[0_0_25px_rgba(236,72,153,0.3)]"
                        >
                            <svg width="220" height="220" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 0.5] }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="absolute mt-64"
                        >
                            <span className="font-mono text-[8px] md:text-[10px] uppercase tracking-[0.8em] text-pink-300/20">
                                Valentine Wall
                            </span>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ValentineTransition;
