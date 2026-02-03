import { Crown, Sparkles, Trophy, Gem, Shield, Flame } from 'lucide-react';
import React from 'react';

export type RarityTier = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythical' | 'GOAT' | 'MGB Queen';

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
}

export const getRarityConfig = (score: number, roles: string[] = [], username?: string): RarityConfig => {
    const lowerRoles = roles.map(r => r.toLowerCase());
    const isSpecial = lowerRoles.some(r => r.includes('mod') || r.includes('team'));

    // MGB Queen - Special tier for 16vivz
    if (username?.toLowerCase() === '16vivz') return {
        tier: 'MGB Queen',
        from: 'from-white',
        to: 'to-pink-500',
        text: 'text-white',
        bgSolid: 'bg-pink-500/15',
        glow: 'rgba(236, 72, 153, 0.9)',
        accent: 'text-pink-200',
        border: 'border-pink-300/80',
        icon: Crown
    };

    if (isSpecial) return {
        tier: 'GOAT', from: 'from-rose-400', to: 'to-rose-600', text: 'text-rose-100',
        bgSolid: 'bg-rose-500/10', glow: 'rgba(244, 63, 94, 0.6)', accent: 'text-rose-400',
        border: 'border-rose-500/50', icon: Flame
    };

    if (score >= 95) return {
        tier: 'Mythical', from: 'from-fuchsia-400', to: 'to-purple-600', text: 'text-fuchsia-100',
        bgSolid: 'bg-fuchsia-500/10', glow: 'rgba(192, 38, 211, 0.4)', accent: 'text-fuchsia-400',
        border: 'border-fuchsia-500/30', icon: Crown
    };
    if (score >= 80) return {
        tier: 'Legendary', from: 'from-amber-300', to: 'to-yellow-500', text: 'text-amber-100',
        bgSolid: 'bg-amber-500/10', glow: 'rgba(234, 179, 8, 0.4)', accent: 'text-amber-400',
        border: 'border-amber-500/30', icon: Trophy
    };
    if (score >= 65) return {
        tier: 'Epic', from: 'from-cyan-300', to: 'to-blue-500', text: 'text-cyan-100',
        bgSolid: 'bg-cyan-500/10', glow: 'rgba(6, 182, 212, 0.4)', accent: 'text-cyan-400',
        border: 'border-cyan-500/30', icon: Gem
    };
    if (score >= 50) return {
        tier: 'Rare', from: 'from-emerald-300', to: 'to-green-500', text: 'text-emerald-100',
        bgSolid: 'bg-emerald-500/10', glow: 'rgba(16, 185, 129, 0.4)', accent: 'text-emerald-400',
        border: 'border-emerald-500/30', icon: Shield
    };
    if (score >= 21) return {
        tier: 'Uncommon',
        from: 'from-indigo-400',
        to: 'to-violet-600',
        text: 'text-indigo-100',
        bgSolid: 'bg-violet-500/15',
        glow: 'rgba(139, 92, 246, 0.35)',
        accent: 'text-violet-400',
        border: 'border-indigo-500/40',
        icon: Sparkles
    };
    return {
        tier: 'Common',
        from: 'from-slate-400',
        to: 'to-slate-600',
        text: 'text-slate-100',
        bgSolid: 'bg-slate-500/5',
        glow: 'rgba(148, 163, 184, 0.1)',
        accent: 'text-slate-400',
        border: 'border-slate-500/10',
        icon: Sparkles
    };
};
