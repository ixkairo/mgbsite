import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface ThreadFilamentProps {
    /** Height of the thread in pixels */
    height?: number;
    /** Color of the thread */
    color?: string;
    /** Unique index for varied animation */
    index?: number;
}

/**
 * A decorative thread/string that hangs from the top, with subtle swaying physics.
 * Place this ABOVE each valentine card inside its grid cell.
 */
const ThreadFilament: React.FC<ThreadFilamentProps> = ({
    height = 120,
    color = 'rgba(255,255,255,0.15)',
    index = 0,
}) => {
    // Deterministic but varied animation params per card
    const animParams = useMemo(() => {
        const seed1 = ((index * 7919) % 100) / 100;
        const seed2 = ((index * 1337) % 100) / 100;
        return {
            duration: 3.5 + seed1 * 3, // 3.5s – 6.5s
            delay: seed2 * 2,          // 0 – 2s offset
            amplitude: 6 + seed1 * 10, // 6px – 16px sway
        };
    }, [index]);

    const midX = 50; // SVG viewBox center

    return (
        <div
            className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-0"
            style={{
                bottom: '100%',
                width: '40px',
                height: `${height}px`,
            }}
        >
            <motion.svg
                viewBox={`0 0 100 ${height}`}
                width="100%"
                height="100%"
                preserveAspectRatio="none"
                style={{ overflow: 'visible' }}
                animate={{
                    x: [
                        0,
                        animParams.amplitude,
                        0,
                        -animParams.amplitude,
                        0,
                    ],
                }}
                transition={{
                    duration: animParams.duration,
                    delay: animParams.delay,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            >
                {/* Main thread line — quadratic bezier that sways */}
                <motion.path
                    d={`M ${midX} 0 Q ${midX} ${height * 0.5} ${midX} ${height}`}
                    stroke={color}
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"
                    animate={{
                        d: [
                            `M ${midX} 0 Q ${midX + animParams.amplitude * 0.7} ${height * 0.4} ${midX} ${height}`,
                            `M ${midX} 0 Q ${midX - animParams.amplitude * 0.7} ${height * 0.5} ${midX} ${height}`,
                            `M ${midX} 0 Q ${midX + animParams.amplitude * 0.5} ${height * 0.45} ${midX} ${height}`,
                            `M ${midX} 0 Q ${midX - animParams.amplitude * 0.5} ${height * 0.4} ${midX} ${height}`,
                            `M ${midX} 0 Q ${midX + animParams.amplitude * 0.7} ${height * 0.4} ${midX} ${height}`,
                        ],
                    }}
                    transition={{
                        duration: animParams.duration,
                        delay: animParams.delay,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
                {/* Small knot/pin at the top */}
                <circle
                    cx={midX}
                    cy="2"
                    r="2.5"
                    fill={color}
                />
            </motion.svg>
        </div>
    );
};

export default ThreadFilament;
