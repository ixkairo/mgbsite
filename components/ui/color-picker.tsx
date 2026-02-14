"use client"

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Pipette, Check } from "lucide-react"

import { Input } from "@/components/ui/input"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

// --- Helper Functions ---

const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!result) return [0, 0, 0]
    return [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
    ]
}

const rgbToHex = (r: number, g: number, b: number) => {
    return `#${[r, g, b].map(x => x.toString(16).padStart(2, "0")).join("")}`.toUpperCase()
}

const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
    s /= 100; l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
}

const SOLIDS = [
    "#FF3131", // Red
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#F59E0B", // Amber
    "#10B981", // Emerald
    "#3B82F6", // Blue
    "#FFFFFF", // White
    "#000000", // Black
]

// --- Component ---

export function ColorPicker({
    color,
    onChange,
    children,
    useHex = false,
}: {
    color: string
    onChange: (color: string) => void
    children?: React.ReactNode
    useHex?: boolean
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [hsl, setHsl] = useState<[number, number, number]>([0, 0, 0])

    useEffect(() => {
        let r, g, b;
        if (color.startsWith('#')) {
            [r, g, b] = hexToRgb(color)
        } else {
            const matches = color.match(/\d+(\.\d+)?/g)
            if (matches && matches.length >= 3) {
                if (color.includes('hsl')) {
                    [r, g, b] = hslToRgb(Number(matches[0]), Number(matches[1]), Number(matches[2]))
                } else {
                    [r, g, b] = [Number(matches[0]), Number(matches[1]), Number(matches[2])]
                }
            } else {
                [r, g, b] = [0, 0, 0]
            }
        }
        setHsl(rgbToHsl(r, g, b))
    }, [color])

    const updateHsl = (h: number, s: number, l: number) => {
        setHsl([h, s, l])
        const [r, g, b] = hslToRgb(h, s, l)
        if (useHex) {
            onChange(rgbToHex(r, g, b))
        } else {
            onChange(`hsl(${h}, ${s}%, ${l}%)`)
        }
    }

    const openPicker = async () => {
        if (!window.EyeDropper) return
        try {
            const eyeDropper = new window.EyeDropper()
            const result = await eyeDropper.open()
            onChange(result.sRGBHex)
        } catch (e) {
            console.error(e)
        }
    }

    const currentHex = rgbToHex(...hslToRgb(hsl[0], hsl[1], hsl[2]))

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                {children || (
                    <div
                        className="w-10 h-10 rounded-full border border-white/20 cursor-pointer shadow-lg hover:scale-105 transition-transform"
                        style={{ backgroundColor: currentHex }}
                    />
                )}
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-4 bg-zinc-950/95 border-white/10 backdrop-blur-2xl shadow-2xl rounded-[1.5rem] overflow-hidden">
                <div className="space-y-6">
                    {/* Presets */}
                    <div className="grid grid-cols-4 gap-2">
                        {SOLIDS.map((s) => (
                            <button
                                key={s}
                                onClick={() => onChange(s)}
                                className="w-full aspect-square rounded-full border border-white/10 relative group"
                                style={{ backgroundColor: s }}
                            >
                                {currentHex === s && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Check className={`w-3 h-3 ${s === '#FFFFFF' ? 'text-black' : 'text-white'}`} />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Sliders */}
                    <div className="space-y-4">
                        {/* Hue */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Hue</span>
                                <span className="text-[10px] font-mono text-white/60">{hsl[0]}°</span>
                            </div>
                            <div className="relative h-2 rounded-full cursor-pointer" style={{ background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)' }}
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect()
                                    const percent = (e.clientX - rect.left) / rect.width
                                    updateHsl(Math.round(percent * 360), hsl[1], hsl[2])
                                }}
                            >
                                <motion.div
                                    className="absolute top-1/2 -mt-2 -ml-2 w-4 h-4 rounded-full bg-white shadow-md border-2 border-zinc-950 pointer-events-none"
                                    style={{ left: `${(hsl[0] / 360) * 100}%` }}
                                    animate={{ left: `${(hsl[0] / 360) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Saturation */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Saturation</span>
                                <span className="text-[10px] font-mono text-white/60">{hsl[1]}%</span>
                            </div>
                            <div className="relative h-2 rounded-full cursor-pointer"
                                style={{ background: `linear-gradient(to right, hsl(${hsl[0]}, 0%, ${hsl[2]}%), hsl(${hsl[0]}, 100%, ${hsl[2]}%))` }}
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect()
                                    const percent = (e.clientX - rect.left) / rect.width
                                    updateHsl(hsl[0], Math.round(percent * 100), hsl[2])
                                }}
                            >
                                <motion.div
                                    className="absolute top-1/2 -mt-2 -ml-2 w-4 h-4 rounded-full bg-white shadow-md border-2 border-zinc-950 pointer-events-none"
                                    style={{ left: `${hsl[1]}%` }}
                                    animate={{ left: `${hsl[1]}%` }}
                                />
                            </div>
                        </div>

                        {/* Lightness */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Lightness</span>
                                <span className="text-[10px] font-mono text-white/60">{hsl[2]}%</span>
                            </div>
                            <div className="relative h-2 rounded-full cursor-pointer"
                                style={{ background: `linear-gradient(to right, #000, hsl(${hsl[0]}, ${hsl[1]}%, 50%), #fff)` }}
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect()
                                    const percent = (e.clientX - rect.left) / rect.width
                                    updateHsl(hsl[0], hsl[1], Math.round(percent * 100))
                                }}
                            >
                                <motion.div
                                    className="absolute top-1/2 -mt-2 -ml-2 w-4 h-4 rounded-full bg-white shadow-md border-2 border-zinc-950 pointer-events-none"
                                    style={{ left: `${hsl[2]}%` }}
                                    animate={{ left: `${hsl[2]}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row: Hex + Pipette */}
                    <div className="flex items-center gap-3 pt-2">
                        <div className="flex-1 relative group">
                            <Input
                                value={currentHex}
                                onChange={(e) => onChange(e.target.value)}
                                className="h-9 px-3 bg-white/[0.03] border-white/10 text-white/90 text-xs font-mono rounded-xl focus:border-mb-purple/50 transition-all uppercase"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-white/10 shadow-inner" style={{ backgroundColor: currentHex }} />
                        </div>
                        <button
                            onClick={openPicker}
                            className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 text-white/50 hover:text-white transition-all shadow-inner"
                        >
                            <Pipette className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}

declare global {
    interface Window {
        EyeDropper: any
    }
}
