import React, { useMemo } from 'react';
import {
    animate,
    motion,
    useMotionValue,
    useDragControls,
} from "framer-motion";
import {
    memo,
    useContext,
    useEffect,
    useRef,
    useState,
    createContext,
} from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Types
type variants = "default" | "masonry" | "polaroid" | "chaos" | "hanging";

// Create Context
const GridVariantContext = createContext<variants | undefined>(undefined);

export interface DraggableContainerHandle {
    resetView: () => void;
}

export const DraggableContainer = React.forwardRef<DraggableContainerHandle, {
    className?: string;
    children: React.ReactNode;
    variant?: variants;
}>(({
    className,
    children,
    variant,
}, ref) => {
    const parentRef = useRef<HTMLDivElement | null>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const scale = useMotionValue(1);
    const dragControls = useDragControls();

    const isInteracting = useRef(false);
    const [constraints, setConstraints] = useState<{ left: number; right: number; top: number; bottom: number } | undefined>(undefined);
    const contentRef = useRef<HTMLDivElement | null>(null);

    const updateConstraints = () => {
        if (!contentRef.current || !parentRef.current) return;

        const contentW = contentRef.current.offsetWidth;
        const contentH = contentRef.current.offsetHeight;
        const parentW = parentRef.current.offsetWidth;
        const parentH = parentRef.current.offsetHeight;

        const currentScale = scale.get();
        const safeScale = Math.max(currentScale, 0.1);

        // Scale-invariant limits that ensure the content center stays within range 
        // to keep substantial portion visible regardless of scale.
        // Viewport dimensions in "world" coordinate space:
        const viewportW = parentW / safeScale;
        const viewportH = parentH / safeScale;

        // Formula: Allow the center to move by half of (Content + Viewport) 
        // minus a protective buffer so you can't push everything away.
        // We use 65% of the viewport as the required overlap.
        const bufferX = viewportW * 0.65;
        const bufferY = viewportH * 0.65;

        const hLimit = Math.max(0, (contentW + viewportW) / 2 - bufferX);
        const vLimit = Math.max(0, (contentH + viewportH) / 2 - bufferY);

        setConstraints({
            left: -hLimit,
            right: hLimit,
            top: -vLimit,
            bottom: vLimit,
        });
    };

    React.useImperativeHandle(ref, () => ({
        resetView: () => {
            isInteracting.current = true;
            animate(x, 0, { type: "spring", stiffness: 100, damping: 20 });
            animate(y, 0, { type: "spring", stiffness: 100, damping: 20 });
            animate(scale, 1, {
                type: "spring",
                stiffness: 100,
                damping: 20,
                onComplete: () => {
                    isInteracting.current = false;
                    updateConstraints();
                }
            });
        }
    }));

    useEffect(() => {
        const resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(updateConstraints);
        });

        if (contentRef.current) resizeObserver.observe(contentRef.current);
        if (parentRef.current) resizeObserver.observe(parentRef.current);

        updateConstraints();

        const unsubscribeScale = scale.on("change", () => {
            // Only update constraints if not currently animating or dragging
            if (!isInteracting.current) {
                updateConstraints();
            }
        });

        return () => {
            resizeObserver.disconnect();
            unsubscribeScale();
        };
    }, []);

    // Force update when children change (e.g., new valentines added)
    useEffect(() => {
        requestAnimationFrame(updateConstraints);
    }, [children]);

    const handleInteractionStart = () => {
        isInteracting.current = true;
    };

    const handleInteractionEnd = () => {
        isInteracting.current = false;
        // Re-calculate after interaction is over
        requestAnimationFrame(updateConstraints);
    };

    useEffect(() => {
        const handleWheel = (event: WheelEvent) => {
            if (isInteracting.current) return;

            event.preventDefault();
            const delta = event.deltaY;
            const currentScale = scale.get();

            // Stronger, faster zoom as requested (0.002)
            const zoomAmount = delta * 0.002;

            // Limit max zoom reasonably (2.2x max) to avoid pixelation but allow close look
            const nextScale = Math.max(0.5, Math.min(2.2, currentScale - zoomAmount));

            animate(scale, nextScale, {
                type: "spring",
                stiffness: 150, // Soft but responsive
                damping: 36,    // Smooth glide, no oscillation
                mass: 1,
                onUpdate: () => updateConstraints(),
                onComplete: () => updateConstraints()
            });
        };

        const viewport = parentRef.current;
        if (viewport) {
            viewport.addEventListener("wheel", handleWheel, { passive: false });
        }

        return () => {
            if (viewport) {
                viewport.removeEventListener("wheel", handleWheel);
            }
        };
    }, [scale]);

    return (
        <GridVariantContext.Provider value={variant}>
            <div
                ref={parentRef}
                onPointerDown={(e) => { e.preventDefault(); dragControls.start(e); }}
                className="h-dvh w-full overflow-hidden bg-transparent relative flex items-center justify-center pointer-events-auto cursor-grab active:cursor-grabbing select-none"
            >
                <motion.div style={{ scale }} className="will-change-transform">
                    <motion.div
                        drag
                        dragControls={dragControls}
                        dragListener={false}
                        dragConstraints={constraints}
                        dragElastic={0.2} // Smoother bounce
                        dragMomentum={true}
                        dragTransition={{
                            timeConstant: 300, // Longer, smoother glide
                            power: 0.3,        // More momentum feeling
                            restDelta: 0.05,   // Settle more gently
                        }}
                        onDragStart={handleInteractionStart}
                        onDragEnd={handleInteractionEnd}
                        style={{ x, y }}
                        className={cn(
                            "h-fit w-fit will-change-transform",
                            className,
                        )}
                    >
                        <div ref={contentRef}>
                            {children}
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </GridVariantContext.Provider>
    );
});

DraggableContainer.displayName = "DraggableContainer";

export const GridItem = ({
    children,
    className,
    index = 0,
}: {
    children: React.ReactNode;
    className?: string;
    index?: number;
    key?: string | number;
}) => {
    const variant = useContext(GridVariantContext);

    const randomRotation = useMemo(() => {
        if (variant !== "chaos") return 0; // Hanging variant has 0 rotation
        const hash = (index * 1337) % 360;
        // High chaos rotation: +/- 12 deg
        return (hash / 360) * 24 - 12;
    }, [index, variant]);

    const randomOffset = useMemo(() => {
        if (variant !== "chaos" && variant !== "hanging") return { x: 0, y: 0 };
        const hX = (index * 7919) % 100;
        const hY = (index * 2659) % 100;
        return {
            // Large offsets to break the grid completely
            x: (hX / 100) * 120 - 60, // +/- 60px offset
            y: (hY / 100) * 120 - 60  // +/- 60px offset
        };
    }, [index, variant]);

    const randomMargins = useMemo(() => {
        if (variant !== "chaos") return {};
        const hM = (index * 4447) % 100;
        const vM = (index * 9973) % 100;
        return {
            marginLeft: `${(hM / 100) * 8 - 4}rem`, // +/- 4rem horizontal margin
            marginTop: `${(vM / 100) * 12}rem`,     // 0-12rem top margin for vertical staggering
        };
    }, [index, variant]);

    const gridItemStyles = cva(
        "hover:cursor-pointer w-full h-full will-change-transform",
        {
            variants: {
                variant: {
                    default: "rounded-sm",
                    masonry: "even:mt-[60%] rounded-sm",
                    polaroid:
                        "border-10 border-b-28 border-white shadow-xl even:rotate-3 odd:-rotate-2 hover:rotate-0 transition-transform ease-out duration-300 even:mt-[60%]",
                    chaos: "hover:rotate-0 transition-transform duration-500",
                    hanging: "transition-transform duration-500",
                },
            },
            defaultVariants: {
                variant: "default",
            },
        },
    );

    return (
        <motion.div
            className={cn((variant === "default" || variant === "hanging") ? "p-0" : "p-2", className)}
            layout={variant === "default"}
            style={{
                rotate: randomRotation,
                x: randomOffset.x,
                y: randomOffset.y,
                ...randomMargins
            }}
            whileHover={{
                scale: 1.05,
                rotate: 0,
                x: randomOffset.x,
                y: randomOffset.y,
                zIndex: 50,
                transition: { duration: 0.3, ease: "easeOut" }
            }}
            transition={{
                layout: { duration: 0.4, ease: "easeInOut" },
                rotate: { duration: 0.5, ease: "easeOut" },
                scale: { duration: 0.2 }
            }}
        >
            <div className={`relative group/grid-item ${gridItemStyles({ variant })}`}>
                <div className="absolute -inset-8 bg-white/[0.03] blur-[30px] rounded-full opacity-0 group-hover/grid-item:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="relative z-10 transition-transform duration-300 group-hover/grid-item:translate-y-[-4px]" style={{ transform: "translateZ(0)" }}>
                    {children}
                </div>
            </div>
        </motion.div>
    );
};

export const GridBody = memo(
    ({
        children,
        className,
    }: {
        children: React.ReactNode;
        className?: string;
    }) => {
        const variant = useContext(GridVariantContext);

        const gridBodyStyles = cva("grid h-fit w-fit", {
            variants: {
                variant: {
                    default: "grid-cols-[repeat(6,1fr)] gap-14 p-7 md:gap-28 md:p-14",
                    masonry: "grid-cols-[repeat(6,1fr)] gap-x-14 px-7 md:gap-x-28 md:px-14",
                    polaroid: "grid-cols-[repeat(6,1fr)] gap-x-14 px-7 md:gap-x-28 md:px-14 flex flex-wrap",
                    chaos: "flex flex-wrap justify-center gap-16 p-24 md:gap-24 md:p-32 w-[180vw]", // Wide container to allow horizontal spread
                    hanging: "grid-cols-[repeat(5,1fr)] gap-x-32 px-16 gap-y-0 py-32 md:gap-x-64 md:px-32",
                },
            },
            defaultVariants: {
                variant: "default",
            },
        });

        return (
            <div className={cn(gridBodyStyles({ variant, className }))}>
                {children}
            </div>
        );
    },
);

GridBody.displayName = "GridBody";
