import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Player, Tweet } from '@/types';
import { Crown, Sparkles, MessageSquare, Calendar, Trophy, Gem, Shield, Eye, ArrowUpRight, Zap, Hash, Users, Share2, MessageCircle, Repeat2, Heart, PencilLine, ExternalLink } from 'lucide-react';

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
import { getRarityConfig, RarityTier } from '@/utils/rarity';
import CardPerimeterMark from './CardPerimeterMark';

export function normalizeTwitterCdnUrl(url?: string | null) {
  if (!url) return url;
  try {
    const u = new URL(url);
    if (u.hostname.includes("pbs.twimg.com")) u.search = "";
    return u.toString();
  } catch {
    return url;
  }
}

interface UnifiedPlayerCardProps {
  player: Player;
  tweet?: Tweet | null;
  activeSort?: string;
  isMinimal?: boolean;
  isExporting?: boolean;
  isRectangular?: boolean;
  isIntenseGlow?: boolean;
}

const numberFormatter = new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 });
const UnifiedPlayerCard: React.FC<UnifiedPlayerCardProps> = ({ player, tweet, activeSort = 'magicianScore', isMinimal = false, isBorderless = false, isExporting = false, isRectangular = false, isIntenseGlow = false }) => {
  const score = player.magicianScore || 0;
  const rarity = getRarityConfig(score, player.roles?.map(r => r.name), player.twitterUsername || player.discordUsername);
  const joinDate = player.discord_joined_at ? new Date(player.discord_joined_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
  const daysInMgb = player.days_in_mgb !== undefined ? player.days_in_mgb : '—';
  const [tweetImageError, setTweetImageError] = React.useState(false);

  // --- 3D TILT LOGIC ---
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth springs for rotation (Softened)
  const mouseXSpring = useSpring(x, { stiffness: 80, damping: 25 });
  const mouseYSpring = useSpring(y, { stiffness: 80, damping: 25 });

  // Map mouse position to rotation degrees (Reduced max tilt)
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [2, -2]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-2, 2]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMinimal || isExporting) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Calculate normalized position (-0.5 to 0.5) from center
    const mouseX = (e.clientX - rect.left) / width - 0.5;
    const mouseY = (e.clientY - rect.top) / height - 0.5;

    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };
  // ---------------------

  // Reset image error state when tweet changes
  React.useEffect(() => {
    setTweetImageError(false);
  }, [tweet?.id]);

  const getRoleStyle = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('sorcerer')) return 'text-amber-200 bg-amber-400/20 border-amber-300/40 shadow-[0_0_16px_rgba(251,191,36,0.3)]';
    if (n.includes('inner circle')) return 'text-lime-300 bg-cyan-400/15 border-lime-400/30 shadow-[0_0_15px_rgba(134,239,172,0.25)]';
    if (n.includes('wizard')) return 'text-green-400 bg-green-500/10 border-green-500/20 shadow-[0_0_12px_rgba(74,222,128,0.15)]';
    if (n.includes('apprentice')) return 'text-purple-400 bg-purple-500/10 border-purple-500/20 shadow-[0_0_12px_rgba(192,132,252,0.15)]';
    if (n.includes('adept')) return 'text-orange-400 bg-orange-500/10 border-orange-500/20 shadow-[0_0_12px_rgba(251,146,60,0.15)]';
    if (n.includes('mod')) return 'text-blue-400 bg-blue-500/10 border-blue-500/20 shadow-[0_0_12px_rgba(96,165,250,0.15)]';
    if (n.includes('team')) return 'text-red-400 bg-red-500/10 border-red-500/20 shadow-[0_0_12px_rgba(248,113,113,0.15)]';
    if (n.includes('art magician')) return 'text-purple-300/60 bg-purple-900/10 border-purple-800/20';
    return 'text-zinc-400 bg-zinc-800/50 border-white/5';
  };

  return (
    <div
      className={`mx-auto ${isMinimal ? '' : (isExporting ? 'p-0' : 'p-2')}`}
      style={{
        perspective: '1200px',
        width: isMinimal ? 'auto' : '100%',
        maxWidth: isMinimal ? 'auto' : '1400px',
        overflow: 'visible'
      }}
    >
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          ...(isMinimal || isBorderless || (isExporting && !isIntenseGlow) ? {} : {
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
            // Restoring the preferred Atomic Bloom (5 layers)
            boxShadow: isIntenseGlow
              ? `0 0 30px ${rarity.glow}, 0 0 60px ${rarity.glow}, 0 0 90px ${rarity.glow}cc, 0 0 120px ${rarity.glow}99, inset 0 0 20px ${rarity.glow}80`
              : `0 0 25px -8px ${rarity.glow}`,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            willChange: 'transform',
            filter: isIntenseGlow ? `drop-shadow(0 0 15px ${rarity.glow})` : undefined
          }),
          width: '1400px',
          minWidth: '1400px',
          borderRadius: isRectangular ? '0' : undefined,
          // 3px thick neon border for BG mode
          border: isIntenseGlow ? `3px solid ${rarity.glow}` : undefined,
        }}
        className={`relative ${isMinimal || isBorderless ? '' : `${isExporting && !isIntenseGlow ? 'rounded-none border-0 p-0 shadow-none' : `rounded-[2.5rem] ${isIntenseGlow ? '' : `border-2 ${rarity.border}`} shadow-[0_0_20px_-5px_rgba(0,0,0,0.5)]`} bg-[#080808] overflow-hidden transition-colors duration-300`}`}
      >
        {/* Perimeter Branding Overlay */}
        {!isMinimal && <CardPerimeterMark glowColor={rarity.glow} />}

        {/* TWO ACCENT SOURCE LIGHTS - CLEARLY VISIBLE */}
        {(!isMinimal && !isBorderless) && (
          <>
            <div
              className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] opacity-[0.2] blur-[100px] pointer-events-none rounded-full z-[1]"
              style={{ backgroundColor: rarity.glow, transform: 'translateZ(0)', willChange: 'transform' }}
            />
            <div
              className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] opacity-[0.12] blur-[100px] pointer-events-none rounded-full z-[1]"
              style={{ backgroundColor: rarity.glow, transform: 'translateZ(0)', willChange: 'transform' }}
            />
            {/* Background Avatar Decoration - Top Left Faded Circle */}
            <div className="absolute -top-32 -left-32 w-[65%] aspect-square opacity-[0.06] pointer-events-none z-0 overflow-hidden transition-opacity duration-1000 [mask-image:radial-gradient(circle,white_0%,transparent_75%)]" style={{ transform: 'translateZ(0)', willChange: 'transform' }}>
              <img
                src={normalizeTwitterCdnUrl(player.avatarUrl)}
                alt=""
                className="w-full h-full object-cover grayscale blur-[2px]"
                crossOrigin="anonymous"
                style={{ transform: 'translateZ(0)' }}
              />
            </div>
          </>
        )}

        <div className={`relative z-10 flex flex-col ${isMinimal ? 'gap-8' : 'p-10 gap-6'}`}>

          {/* --- TOP ROW: Identity & Discord Summary --- */}
          <div className="flex flex-row gap-8 items-start justify-between">
            <div className="flex items-center gap-6 shrink-0">
              <div className="relative">
                <div className="relative w-24 h-24 rounded-full p-1 bg-zinc-900 border border-white/10">
                  <img src={normalizeTwitterCdnUrl(player.avatarUrl)} alt={player.displayName} className="w-full h-full rounded-full object-cover" crossOrigin="anonymous" />
                </div>
                <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-[#080808] shadow-md" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-4xl font-bold text-white tracking-tight mb-2">
                  {player.displayName}
                </h1>
                <div className="flex flex-row gap-4 mb-3">
                  <div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                    <DiscordIcon className="w-3.5 h-3.5 text-[#5865F2]" />
                    <span className="text-[11px] font-mono font-bold text-white/90">
                      {player.discordUsername}
                    </span>
                  </div>
                  {player.twitterUsername && (
                    <a
                      href={`https://x.com/${player.twitterUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 opacity-60 hover:opacity-100 hover:text-mb-purple transition-all pointer-events-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <XIcon className="w-3 h-3 text-white" />
                      <span className="text-[11px] font-mono font-bold text-white/90">
                        @{player.twitterUsername}
                      </span>
                    </a>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {player.roles
                    ?.filter(role => {
                      // Hide Wizard role if user has 4 or more roles
                      if (player.roles && player.roles.length >= 4) {
                        return !role.name.toLowerCase().includes('wizard');
                      }
                      return true;
                    })
                    .map(role => (
                      <span key={role.id} className={`text-[10px] font-bold px-2.5 py-0.5 border rounded-full transition-all duration-300 ${getRoleStyle(role.name)}`}>
                        {role.name}
                      </span>
                    ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-12 shrink-0">
              <div className="flex flex-col items-center">
                <div className="text-2xl font-bold text-white tabular-nums leading-none mb-1">
                  {player.discord_messages_count ? numberFormatter.format(player.discord_messages_count) : '0'}
                </div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Messages</div>
              </div>

              <div className="h-10 w-px bg-white/5" />

              <div className="flex flex-col items-center">
                <div className="text-2xl font-bold text-zinc-300 tabular-nums leading-none mb-1">
                  {daysInMgb}
                </div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Days</div>
              </div>

              <div className="h-10 w-px bg-white/5" />

              <div className="flex flex-col items-center">
                <div className="text-2xl font-bold text-zinc-300 tabular-nums leading-none mb-1">
                  {joinDate}
                </div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Joined</div>
              </div>
            </div>
          </div>

          {/* --- MIDDLE ROW: Score & Tier --- */}
          <div className="grid grid-cols-2 gap-4">
            <div className={`relative flex items-center justify-between p-6 bg-zinc-900/90 rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl`}>
              {/* Internal Accent Bloom - Low contrast purple/teal */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-teal-500/10 pointer-events-none" />

              <div className="flex flex-col gap-1 shrink-0 relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className={`w-3.5 h-3.5 fill-current ${rarity.accent}`} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 whitespace-nowrap">Magician Score</span>
                </div>
                <p className="text-[10px] text-zinc-500 font-medium max-w-[210px] leading-relaxed">
                  Your influence on <span className="text-white/80">X (Twitter)</span> based on reach, engagement quality, and posting consistency.
                </p>
              </div>
              <div className="text-6xl font-black tabular-nums text-white tracking-tighter leading-none relative z-10 drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                {score.toFixed(1)}
              </div>
              {/* Local Accent Glow - More Intense */}
              <div className={`absolute -right-4 -bottom-4 w-32 h-32 blur-3xl opacity-[0.15] rounded-full ${rarity.bgSolid}`} />
            </div>

            {/* RARITY ACCENT BLOCK: Gradient Source */}
            <div className={`relative flex items-center justify-between p-6 rounded-[2rem] border border-white/10 overflow-hidden shadow-xl`}>
              {/* Accent Gradient Background - Subtle rarity-based tint */}
              <div className={`absolute inset-0 bg-gradient-to-br ${rarity.from} ${rarity.to} opacity-[0.08]`} />
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${rarity.from} ${rarity.to} opacity-[0.12] blur-2xl rounded-full`} />

              <div className="flex flex-col gap-1 relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <rarity.icon className={`w-4 h-4 ${rarity.accent}`} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 whitespace-nowrap">Tier Achievement</span>
                </div>
                <div className={`text-4xl font-bold tracking-tight bg-gradient-to-r ${rarity.from} ${rarity.to} bg-clip-text text-transparent leading-none`}>
                  {rarity.tier}
                </div>
              </div>
              <rarity.icon size={54} strokeWidth={1} className={`relative z-10 opacity-20 ${rarity.accent}`} />
            </div>
          </div>


          {/* --- METRICS ROW --- */}
          <div className="flex flex-wrap justify-between items-center gap-2">
            {[
              { label: 'Posts', value: player.posts_count },
              { label: 'Views', value: player.views_total },
              { label: 'Likes', value: player.likes_total },
              { label: 'Replies', value: player.replies_total },
              { label: 'RTs', value: player.retweets_total },
              { label: 'Quotes', value: player.quotes_total },
            ].map((m, i) => (
              <div key={i} className="flex-1 min-w-[100px] flex flex-col items-center justify-center p-3 bg-zinc-900/60 border border-white/5 rounded-2xl">
                <div className={`text-lg font-bold tabular-nums leading-none mb-1 ${rarity.accent}`}>
                  {m.value ? numberFormatter.format(m.value) : '0'}
                </div>
                <div className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">{m.label}</div>
              </div>
            ))}
          </div>

          {/* --- BOTTOM: Best Post --- */}
          {tweet ? (
            <div className={`bg-zinc-900/60 rounded-[2rem] overflow-hidden flex flex-row items-stretch border border-white/5 shadow-xl h-[200px]`}>
              {tweet.imageUrl && !tweetImageError ? (
                <div className="w-[420px] shrink-0 border-r border-white/5 relative group">
                  <img
                    src={normalizeTwitterCdnUrl(tweet.imageUrl)}
                    alt=""
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                    onError={() => setTweetImageError(true)}
                  />
                  {/* Dark-to-Transparent Overlay Gradient (Bleed side) */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent pointer-events-none" />
                </div>
              ) : (
                <div className="w-[420px] bg-zinc-800/80 flex items-center justify-center shrink-0 border-r border-white/5 relative">
                  <Sparkles className="w-12 h-12 text-zinc-700" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent pointer-events-none" />
                </div>
              )}

              <div className="flex-1 min-w-0 w-full px-8 py-7 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] whitespace-nowrap">Best Tweet</span>
                    <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">{new Date(tweet.createdAt || Date.now()).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <p className="text-base text-zinc-200 font-medium leading-relaxed line-clamp-2">
                    {tweet.text || player.best_post_text || '—'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 mt-auto">
                  <div className="flex items-center gap-6">
                    <div className="flex items-baseline gap-2 text-xs text-white/50 hover:text-white/80 transition-all cursor-default group">
                      <Eye className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                      <span className="font-bold text-white/70 group-hover:text-white transition-colors">{numberFormatter.format(tweet.views)}</span>
                    </div>
                    <div className="flex items-baseline gap-2 text-xs text-white/50 hover:text-white/80 transition-all cursor-default group">
                      <Heart className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                      <span className="font-bold text-white/70 group-hover:text-white transition-colors">{numberFormatter.format(tweet.likes)}</span>
                    </div>
                    <div className="flex items-baseline gap-2 text-xs text-white/50 hover:text-white/80 transition-all cursor-default group">
                      <MessageCircle className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                      <span className="font-bold text-white/70 group-hover:text-white transition-colors">{numberFormatter.format(tweet.replies)}</span>
                    </div>
                    <div className="flex items-baseline gap-2 text-xs text-white/50 hover:text-white/80 transition-all cursor-default group">
                      <Repeat2 className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                      <span className="font-bold text-white/70 group-hover:text-white transition-colors">{numberFormatter.format(tweet.retweets)}</span>
                    </div>
                    <div className="flex items-baseline gap-2 text-xs text-white/50 hover:text-white/80 transition-all cursor-default group">
                      <PencilLine className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                      <span className="font-bold text-white/70 group-hover:text-white transition-colors">{numberFormatter.format(tweet.quotes)}</span>
                    </div>
                  </div>

                  <a
                    href={tweet.url || `https://x.com/any/status/${tweet.tweetId || tweet.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-white/70 hover:text-white text-[10px] font-bold uppercase tracking-wider transition-all pointer-events-auto whitespace-nowrap"
                  >
                    Open Post <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-[2rem] bg-zinc-900/40 border border-white/5 flex flex-col items-center justify-center gap-3">
              <XIcon className="w-8 h-8 text-zinc-700/50" />
              <div className="text-center">
                <p className="text-sm font-bold text-zinc-500 mb-1">No Twitter Activity Found</p>
                <p className="text-[10px] text-zinc-600 uppercase tracking-wider">This user has no recorded tweets</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default UnifiedPlayerCard;
