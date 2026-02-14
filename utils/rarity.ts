import { Crown, Sparkles, Trophy, Gem, Shield, Flame } from 'lucide-react';
import React from 'react';

export type RarityTier = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythical' | 'GOAT' | 'MGB Queen';

export interface RarityStyle {
    glow: string;
    glowIntensity: number;
    innerGlow: string;
    gradient: string;
    border: string;
    frameColor: string;
    frameGlow: string;
}

export interface RarityConfig {
    tier: RarityTier;
    from: string;
    to: string;
    text: string;
    bgSolid: string;
    glow: string;
    accent: string;
    border: string;
    icon: any;
    valentine?: RarityStyle;
}

export const getRoleColor = (roleName: string): string => {
    const n = roleName.toLowerCase();
    if (n.includes('sorcerer')) return '#FDE68A';
    if (n.includes('inner circle')) return '#BEF264';
    if (n.includes('wizard')) return '#4ADE80';
    if (n.includes('apprentice')) return '#C084FC';
    if (n.includes('adept')) return '#FB923C';
    if (n.includes('mod')) return '#60A5FA';
    if (n.includes('team')) return '#F87171';
    if (n.includes('art magician')) return 'rgba(216, 180, 254, 0.6)';
    return '#A1A1AA';
};

export const getRarityConfig = (score: number, roles: string[] = [], username?: string): RarityConfig => {
    const lowerRoles = roles.map(r => r.toLowerCase());
    const isSpecial = lowerRoles.some(r => r.includes('mod') || r.includes('team'));

    // Special Tier: MGB Queen / GOAT
    if (username?.toLowerCase() === '16vivz' || isSpecial) {
        const isQueen = username?.toLowerCase() === '16vivz';
        return {
            tier: isQueen ? 'MGB Queen' : 'GOAT',
            from: isQueen ? 'from-white' : 'from-rose-400',
            to: isQueen ? 'to-pink-500' : 'to-rose-600',
            text: isQueen ? 'text-white' : 'text-rose-100',
            bgSolid: isQueen ? 'bg-pink-500/15' : 'bg-rose-500/10',
            glow: isQueen ? 'rgba(236, 72, 153, 0.9)' : 'rgba(244, 63, 94, 0.6)',
            accent: isQueen ? 'text-pink-200' : 'text-rose-400',
            border: isQueen ? 'border-pink-300/80' : 'border-rose-500/50',
            icon: isQueen ? Crown : Flame,
            valentine: {
                glow: isQueen ? 'rgba(255, 105, 180, 1.0)' : 'rgba(244, 63, 94, 0.9)',
                glowIntensity: 1.0,
                innerGlow: isQueen ? 'rgba(255, 255, 255, 0.6)' : 'rgba(251, 113, 133, 0.6)',
                gradient: isQueen
                    ? 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(236,72,153,0.25) 50%, rgba(20,0,0,0.9) 100%)'
                    : 'radial-gradient(circle, rgba(244,63,94,0.3) 0%, rgba(225,29,72,0.2) 50%, rgba(20,0,0,0.9) 100%)',
                border: 'rgba(255, 255, 255, 0.5)',
                frameColor: isQueen ? '#FCE7F3' : '#FFE4E6',
                frameGlow: isQueen ? 'rgba(252, 231, 243, 0.9)' : 'rgba(255, 228, 230, 0.8)'
            }
        };
    }

    // Tier: Mythical
    if (score >= 95) return {
        tier: 'Mythical', from: 'from-fuchsia-400', to: 'to-purple-600', text: 'text-fuchsia-100',
        bgSolid: 'bg-fuchsia-500/10', glow: 'rgba(192, 38, 211, 0.4)', accent: 'text-fuchsia-400',
        border: 'border-fuchsia-500/30', icon: Crown,
        valentine: {
            glow: 'rgba(192, 38, 211, 0.8)', glowIntensity: 0.9,
            innerGlow: 'rgba(216, 180, 254, 0.5)',
            gradient: 'radial-gradient(circle, rgba(168,85,247,0.25) 0%, rgba(147,51,234,0.15) 50%, rgba(10,0,0,0.92) 100%)',
            border: 'rgba(192, 38, 211, 0.5)',
            frameColor: '#F5D0FE',
            frameGlow: 'rgba(245, 208, 254, 0.8)'
        }
    };

    // Tier: Legendary
    if (score >= 80) return {
        tier: 'Legendary', from: 'from-amber-300', to: 'to-yellow-500', text: 'text-amber-100',
        bgSolid: 'bg-amber-500/10', glow: 'rgba(234, 179, 8, 0.4)', accent: 'text-amber-400',
        border: 'border-amber-500/30', icon: Trophy,
        valentine: {
            glow: 'rgba(234, 179, 8, 0.7)', glowIntensity: 0.8,
            innerGlow: 'rgba(252, 211, 77, 0.4)',
            gradient: 'radial-gradient(circle, rgba(234,179,8,0.22) 0%, rgba(217,119,6,0.12) 50%, rgba(10,0,0,0.92) 100%)',
            border: 'rgba(234, 179, 8, 0.4)',
            frameColor: '#FDE68A',
            frameGlow: 'rgba(253, 230, 138, 0.7)'
        }
    };

    // Tier: Epic / Rare
    if (score >= 50) return {
        tier: score >= 65 ? 'Epic' : 'Rare',
        from: score >= 65 ? 'from-cyan-300' : 'from-emerald-300',
        to: score >= 65 ? 'to-blue-500' : 'to-green-500',
        text: score >= 65 ? 'text-cyan-100' : 'text-emerald-100',
        bgSolid: score >= 65 ? 'bg-cyan-500/10' : 'bg-emerald-500/10',
        glow: score >= 65 ? 'rgba(6, 182, 212, 0.4)' : 'rgba(16, 185, 129, 0.4)',
        accent: score >= 65 ? 'text-cyan-400' : 'text-emerald-400',
        border: score >= 65 ? 'border-cyan-500/30' : 'border-emerald-500/30',
        icon: score >= 65 ? Gem : Shield,
        valentine: {
            glow: score >= 65 ? 'rgba(6, 182, 212, 0.7)' : 'rgba(16, 185, 129, 0.7)',
            glowIntensity: 0.8,
            innerGlow: score >= 65 ? 'rgba(103, 232, 249, 0.4)' : 'rgba(110, 231, 183, 0.4)',
            gradient: score >= 65
                ? 'radial-gradient(circle, rgba(6,182,212,0.2) 0%, rgba(8,145,178,0.1) 50%, rgba(10,0,0,0.92) 100%)'
                : 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, rgba(5,150,105,0.1) 50%, rgba(10,0,0,0.92) 100%)',
            border: score >= 65 ? 'rgba(6, 182, 212, 0.4)' : 'rgba(16, 185, 129, 0.4)',
            frameColor: score >= 65 ? '#A5F3FC' : '#A7F3D0',
            frameGlow: score >= 65 ? 'rgba(165, 243, 252, 0.7)' : 'rgba(167, 243, 208, 0.7)'
        }
    };

    // Tier: Common / Uncommon
    return {
        tier: score >= 21 ? 'Uncommon' : 'Common',
        from: score >= 21 ? 'from-indigo-400' : 'from-slate-400',
        to: score >= 21 ? 'to-violet-600' : 'to-slate-600',
        text: score >= 21 ? 'text-indigo-100' : 'text-slate-100',
        bgSolid: score >= 21 ? 'bg-violet-500/15' : 'bg-slate-500/5',
        glow: score >= 21 ? 'rgba(139, 92, 246, 0.35)' : 'rgba(148, 163, 184, 0.1)',
        accent: score >= 21 ? 'text-violet-400' : 'text-slate-400',
        border: score >= 21 ? 'border-indigo-500/40' : 'border-slate-500/10',
        icon: Sparkles,
        valentine: {
            glow: score >= 21 ? 'rgba(139, 92, 246, 0.6)' : 'rgba(236, 72, 153, 0.6)',
            glowIntensity: 0.7,
            innerGlow: score >= 21 ? 'rgba(196, 181, 253, 0.4)' : 'rgba(249, 168, 212, 0.4)',
            gradient: score >= 21
                ? 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, rgba(124,58,237,0.12) 50%, rgba(10,0,0,0.92) 100%)'
                : 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, rgba(219,39,119,0.12) 50%, rgba(10,0,0,0.92) 100%)',
            border: score >= 21 ? 'rgba(139, 92, 246, 0.4)' : 'rgba(236, 72, 153, 0.4)',
            frameColor: score >= 21 ? '#C4B5FD' : '#F9A8D4',
            frameGlow: score >= 21 ? 'rgba(196, 181, 253, 0.7)' : 'rgba(249, 168, 212, 0.7)'
        }
    };
};
