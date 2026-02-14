import React, { useEffect, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Heart {
    id: number;
    x: number;
    y: number;
    size: number;
    duration: number;
    delay: number;
    rotate: number;
}

const FloatingHeart = memo(({ h }: { h: Heart }) => {
    return (
        <motion.div
            initial={{
                opacity: 0,
                x: `${h.x}vw`,
                y: `${h.y}vh`,
                scale: 0.5,
                z: 0
            }}
            animate={{
                opacity: [0, 0.7, 0],
                scale: [0.6, 0.2],
                z: -600, // Move deeper into distance
                y: `${h.y - 50}vh`, // Float higher
                rotate: h.rotate + 90
            }}
            transition={{
                duration: h.duration,
                delay: h.delay,
                once: false,
                ease: "linear",
            }}
            className="absolute pointer-events-none select-none z-[1]"
            style={{ perspective: "1000px" }}
        >
            <svg
                width={h.size}
                height={h.size}
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-pink-500/50" // Much more visible
            >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
        </motion.div>
    );
});

FloatingHeart.displayName = "FloatingHeart";

export const FloatingHearts: React.FC = () => {
    const [hearts, setHearts] = useState<Heart[]>([]);

    useEffect(() => {
        // Initial batch - more dense
        const newHearts = Array.from({ length: 35 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100 + 10,
            size: 15 + Math.random() * 75,
            duration: 8 + Math.random() * 14,
            delay: Math.random() * 10,
            rotate: Math.random() * 360
        }));
        setHearts(newHearts);

        const interval = setInterval(() => {
            setHearts(prev => {
                const nextId = prev.length > 0 ? Math.max(...prev.map(p => p.id)) + 1 : 0;
                const newHeart = {
                    id: nextId,
                    x: Math.random() * 100,
                    y: Math.random() * 100 + 40,
                    size: 15 + Math.random() * 75,
                    duration: 8 + Math.random() * 14,
                    delay: 0,
                    rotate: Math.random() * 360
                };
                // Keep a max of 45 hearts for a richer atmosphere
                const updated = [...prev.slice(-44), newHeart];
                return updated;
            });
        }, 800); // Spawning frequency increased

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-[1]">
            <AnimatePresence>
                {hearts.map(h => (
                    <FloatingHeart key={h.id} h={h} />
                ))}
            </AnimatePresence>
        </div>
    );
};

export default FloatingHearts;
