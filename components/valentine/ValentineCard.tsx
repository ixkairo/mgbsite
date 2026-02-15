import React, { useMemo, useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import HeartContainer from './HeartContainer';
import { ValentineData } from '../../services/valentineService';
import { getValentineLayout } from './layoutConfig';
import { getRarityConfig, getRoleColor } from '../../utils/rarity';

interface ValentineCardProps {
  valentine: ValentineData;
  layoutId?: string;
  showShadow?: boolean;
  isOwn?: boolean;
  isForMe?: boolean;
}

const DESIGN_WIDTH = 650; // Base design width (full container width in preview)
const isMobileDevice = typeof window !== 'undefined' && window.innerWidth < 768;

const ValentineCard: React.FC<ValentineCardProps> = ({ valentine, layoutId, showShadow = true, isOwn = false, isForMe = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  const recipientText = valentine.recipient_type === 'community'
    ? 'community'
    : `@${valentine.recipient_username}`;

  const recipientAvatar = valentine.recipient_type === 'community'
    ? '/comm.png'
    : valentine.recipient_avatar_url;

  const layout = useMemo(() => getValentineLayout(), []);

  const rarity = useMemo(() => {
    const score = valentine.sender_score ?? 0;
    const roles = valentine.sender_roles_raw ? valentine.sender_roles_raw.split(/[,\-|]/).map(r => r.trim()) : [];
    return getRarityConfig(score, roles, valentine.sender_username);
  }, [valentine.sender_score, valentine.sender_username, valentine.sender_roles_raw]);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const actualWidth = containerRef.current.offsetWidth;
        const newScale = actualWidth / DESIGN_WIDTH;
        setScale(newScale);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      updateScale();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    updateScale();

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const scaledLayout = useMemo(() => {
    const s = scale || 1;
    const res = { ...layout };

    // Scale and ROUND all elements to ensure pixel alignment
    Object.keys(res).forEach(key => {
      // @ts-ignore
      const item = { ...res[key] };
      item.x = Math.round(item.x * s);
      item.y = Math.round(item.y * s);
      item.width = Math.round(item.width * s);
      item.height = Math.round(item.height * s);
      if (item.fontSize) {
        item.fontSize = Math.round(item.fontSize * s);
      }
      // @ts-ignore
      res[key] = item;
    });

    return res;
  }, [scale, layout]);

  const paddingOffset = Math.round((scale || 1) * 117); // 18% of 650 = 117

  const maskedContent = (
    <div className="w-full h-full relative">
      {/* Ghost Avatar (Sender) */}
      <div
        className="absolute z-0 pointer-events-none"
        style={{
          left: `${Math.round((scaledLayout.avatar.x + paddingOffset + scaledLayout.avatar.width / 2) - (scaledLayout.avatar.width * 3.1 / 2))}px`,
          top: `${Math.round((scaledLayout.avatar.y + paddingOffset + scaledLayout.avatar.height / 2) - (scaledLayout.avatar.height * 3.1 / 2))}px`,
          width: `${Math.round(scaledLayout.avatar.width * 3.1)}px`,
          height: `${Math.round(scaledLayout.avatar.height * 3.1)}px`
        }}
      >
        <img
          src={valentine.sender_avatar_url}
          alt=""
          className="w-full h-full rounded-full object-cover opacity-[0.18] grayscale-[0.2]"
          style={{
            maskImage: 'radial-gradient(circle at center, black 40%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 70%)'
          }}
        />
      </div>

      {/* Ghost Avatar (Recipient) */}
      {(valentine.recipient_type === 'community' || (valentine.recipient_type === 'user' && valentine.recipient_avatar_url)) && (
        <div
          className="absolute z-0 pointer-events-none"
          style={{
            left: `${Math.round((scaledLayout.recipientAvatar.x + paddingOffset + scaledLayout.recipientAvatar.width / 2) - (scaledLayout.recipientAvatar.width * 3.1 / 2))}px`,
            top: `${Math.round((scaledLayout.recipientAvatar.y + paddingOffset + scaledLayout.recipientAvatar.height / 2) - (scaledLayout.recipientAvatar.height * 3.1 / 2))}px`,
            width: `${Math.round(scaledLayout.recipientAvatar.width * 3.1)}px`,
            height: `${Math.round(scaledLayout.recipientAvatar.height * 3.1)}px`
          }}
        >
          <img
            src={recipientAvatar}
            alt=""
            className="w-full h-full rounded-full object-cover opacity-[0.18] grayscale-[0.2]"
            style={{
              maskImage: 'radial-gradient(circle at center, black 40%, transparent 70%)',
              WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 70%)'
            }}
          />
        </div>
      )}
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={`relative w-full max-w-[650px] mx-auto aspect-square ${scale === null ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
      style={{
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        imageRendering: 'auto',
        filter: scale !== null
          ? isOwn
            ? isMobileDevice
              ? `drop-shadow(0 0 12px rgba(139, 92, 246, 0.5))`
              : `drop-shadow(0 0 40px rgba(139, 92, 246, 0.6)) drop-shadow(0 0 80px rgba(139, 92, 246, 0.3))`
            : isForMe
              ? isMobileDevice
                ? `drop-shadow(0 0 10px rgba(236, 72, 153, 0.4))`
                : `drop-shadow(0 0 35px rgba(236, 72, 153, 0.5)) drop-shadow(0 0 70px rgba(236, 72, 153, 0.25))`
              : isMobileDevice
                ? `drop-shadow(0 0 6px ${rarity.valentine?.glow || rarity.glow})`
                : `drop-shadow(0 0 18px ${rarity.valentine?.glow || rarity.glow})`
          : 'none'
      }}
    >
      {/* Ambient rarity-colored glow behind every card */}
      {scale !== null && !isOwn && !isForMe && !isMobileDevice && (
        <div
          className="absolute inset-[-8%] z-[-1] pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, ${rarity.valentine?.glow || rarity.glow} 0%, transparent 60%)`,
            opacity: 0.15,
            filter: 'blur(12px)',
          }}
        />
      )}

      {/* Pulsing purple glow for the current user's own valentines (FROM ME) */}
      {isOwn && scale !== null && (
        isMobileDevice ? (
          <div
            className="absolute inset-[-6%] z-[-1] pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at center, rgba(139, 92, 246, 0.35) 0%, transparent 70%)`,
            }}
          />
        ) : (
          <>
            <div
              className="absolute inset-[-20%] z-[-1] pointer-events-none animate-pulse"
              style={{
                background: `radial-gradient(ellipse at center, rgba(139, 92, 246, 0.6) 0%, rgba(139, 92, 246, 0.25) 30%, rgba(168, 85, 247, 0.08) 55%, transparent 75%)`,
                animationDuration: '2.5s',
                filter: 'blur(10px)',
              }}
            />
            <div
              className="absolute inset-[-10%] z-[-1] pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at center, rgba(139, 92, 246, 0.4) 0%, rgba(168, 85, 247, 0.15) 40%, transparent 70%)`,
                filter: 'blur(5px)',
              }}
            />
          </>
        )
      )}

      {/* Pink glow for valentines sent TO the current user (TO ME) */}
      {isForMe && !isOwn && scale !== null && (
        isMobileDevice ? (
          <div
            className="absolute inset-[-6%] z-[-1] pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at center, rgba(236, 72, 153, 0.3) 0%, transparent 70%)`,
            }}
          />
        ) : (
          <>
            <div
              className="absolute inset-[-18%] z-[-1] pointer-events-none animate-pulse"
              style={{
                background: `radial-gradient(ellipse at center, rgba(236, 72, 153, 0.5) 0%, rgba(236, 72, 153, 0.2) 30%, rgba(219, 39, 119, 0.06) 55%, transparent 75%)`,
                animationDuration: '3s',
                filter: 'blur(10px)',
              }}
            />
            <div
              className="absolute inset-[-8%] z-[-1] pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at center, rgba(236, 72, 153, 0.3) 0%, rgba(219, 39, 119, 0.1) 40%, transparent 70%)`,
                filter: 'blur(5px)',
              }}
            />
          </>
        )
      )}

      {/* "From me" / "To me" badge */}
      {(isOwn || isForMe) && scale !== null && (
        <div
          className={`absolute z-[30] flex items-center gap-1.5 rounded-full ${isMobileDevice ? '' : 'backdrop-blur-xl'}`}
          style={{
            bottom: `${Math.round(14 * (scale || 1))}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: `${Math.max(3, Math.round(5 * (scale || 1)))}px ${Math.max(8, Math.round(14 * (scale || 1)))}px`,
            background: isOwn ? 'rgba(139, 92, 246, 0.4)' : 'rgba(236, 72, 153, 0.4)',
            border: `1.5px solid ${isOwn ? 'rgba(167, 139, 250, 0.6)' : 'rgba(244, 114, 182, 0.6)'}`,
            boxShadow: `0 0 16px ${isOwn ? 'rgba(139, 92, 246, 0.4)' : 'rgba(236, 72, 153, 0.4)'}, 0 0 4px ${isOwn ? 'rgba(139, 92, 246, 0.2)' : 'rgba(236, 72, 153, 0.2)'} inset`,
          }}
        >
          <Heart
            style={{
              width: `${Math.max(10, Math.round(14 * (scale || 1)))}px`,
              height: `${Math.max(10, Math.round(14 * (scale || 1)))}px`,
            }}
            className={isOwn ? 'text-purple-200 fill-purple-300/60' : 'text-pink-200 fill-pink-300/60'}
          />
          <span
            className={`font-mono font-bold uppercase tracking-[0.2em] ${isOwn ? 'text-purple-100' : 'text-pink-100'}`}
            style={{ fontSize: `${Math.max(8, Math.round(11 * (scale || 1)))}px` }}
          >
            {isOwn ? 'From me' : 'To me'}
          </span>
        </div>
      )}
      <HeartContainer
        glowColor={rarity.glow}
        valentineStyle={rarity.valentine}
        maskedChildren={maskedContent}
        showShadow={showShadow}
      >
        {/* Faint Heart Watermark */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: 'url(/heart1.png)',
            backgroundSize: '85%',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
          }}
        />

        {/* Absolute positioned layout */}
        <div className="w-full h-full relative">

          {/* Avatar (Sender) */}
          <div
            className="absolute z-10"
            style={{
              left: `${scaledLayout.avatar.x}px`,
              top: `${scaledLayout.avatar.y}px`,
              width: `${scaledLayout.avatar.width}px`,
              height: `${scaledLayout.avatar.height}px`
            }}
          >
            <div className="w-full h-full rounded-full overflow-hidden border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)] bg-black/20">
              <img
                src={valentine.sender_avatar_url}
                alt={valentine.sender_display_name}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Rarity Icon Accent */}
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${rarity.bgSolid} ${rarity.text} flex items-center justify-center border border-white/20 backdrop-blur-md shadow-lg`}>
              <rarity.icon className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Username (Sender) */}
          <div
            className="absolute z-10 p-2"
            style={{
              left: `${scaledLayout.username.x}px`,
              top: `${scaledLayout.username.y}px`,
              width: `${scaledLayout.username.width}px`,
              height: `${scaledLayout.username.height}px`,
              fontSize: `${scaledLayout.username.fontSize}px`
            }}
          >
            <div className="text-white font-bold truncate leading-tight">{valentine.sender_display_name}</div>
            <div
              className="font-mono uppercase tracking-wider truncate"
              style={{
                fontSize: `${(scaledLayout.username.fontSize || 10) * 0.7}px`,
                color: getRoleColor(valentine.sender_role || ''),
                textShadow: `0 0 8px ${getRoleColor(valentine.sender_role || '')}44`
              }}
            >
              {valentine.sender_role || 'ROLE'}
            </div>
          </div>

          {/* Recipient Avatar */}
          {(valentine.recipient_type === 'community' || (valentine.recipient_type === 'user' && valentine.recipient_avatar_url)) && (
            <div
              className="absolute z-10"
              style={{
                left: `${scaledLayout.recipientAvatar.x}px`,
                top: `${scaledLayout.recipientAvatar.y}px`,
                width: `${scaledLayout.recipientAvatar.width}px`,
                height: `${scaledLayout.recipientAvatar.height}px`
              }}
            >
              <div className="w-full h-full rounded-full overflow-hidden border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)] bg-black/20">
                <img
                  src={recipientAvatar}
                  alt={valentine.recipient_display_name || 'community'}
                  className="w-full h-full object-cover opacity-80"
                />
              </div>
            </div>
          )}

          {/* Recipient Username */}
          <div
            className="absolute z-10"
            style={{
              left: `${scaledLayout.recipientUsername.x}px`,
              top: `${scaledLayout.recipientUsername.y}px`,
              width: `${scaledLayout.recipientUsername.width}px`,
              height: `${scaledLayout.recipientUsername.height}px`,
              fontSize: `${scaledLayout.recipientUsername.fontSize}px`,
              textAlign: 'right'
            }}
          >
            <div className="text-white font-bold truncate leading-tight">
              {valentine.recipient_type === 'community' ? 'community' : valentine.recipient_display_name}
            </div>
            <div
              className="font-mono uppercase tracking-wider truncate"
              style={{
                fontSize: `${(scaledLayout.recipientUsername.fontSize || 10) * 0.7}px`,
                color: valentine.recipient_type === 'community' ? '#8B5CF6' : getRoleColor(valentine.recipient_role || ''),
                textShadow: `0 0 8px ${valentine.recipient_type === 'community' ? '#8B5CF6' : getRoleColor(valentine.recipient_role || '')}22`,
                opacity: 0.8
              }}
            >
              {valentine.recipient_type === 'community' ? 'MAGICBLOCK' : (valentine.recipient_role || 'ROLE')}
            </div>
          </div>


          {/* Message with decorative frame */}
          <div
            className="absolute z-10"
            style={{
              left: `${scaledLayout.message.x}px`,
              top: `${scaledLayout.message.y}px`,
              width: `${scaledLayout.message.width}px`,
              height: `${scaledLayout.message.height}px`,
            }}
          >
            {/* Glassmorphism Background for Message */}
            <div
              className="absolute inset-0 rounded-lg backdrop-blur-[2px] border border-white/5 shadow-inner"
              style={{ background: rarity.bgSolid }}
            />

            {/* Decorative frame corners - Refined Designer Corners */}
            <div
              className="absolute -top-1 -left-1 w-4 h-4 border-l border-t rounded-tl-sm opacity-80"
              style={{ borderColor: rarity.valentine?.frameColor, filter: `drop-shadow(0 0 3px ${rarity.valentine?.frameGlow})` }}
            />
            <div
              className="absolute -top-1 -right-1 w-4 h-4 border-r border-t rounded-tr-sm opacity-80"
              style={{ borderColor: rarity.valentine?.frameColor, filter: `drop-shadow(0 0 3px ${rarity.valentine?.frameGlow})` }}
            />
            <div
              className="absolute -bottom-1 -left-1 w-4 h-4 border-l border-b rounded-bl-sm opacity-80"
              style={{ borderColor: rarity.valentine?.frameColor, filter: `drop-shadow(0 0 3px ${rarity.valentine?.frameGlow})` }}
            />
            <div
              className="absolute -bottom-1 -right-1 w-4 h-4 border-r border-b rounded-br-sm opacity-80"
              style={{ borderColor: rarity.valentine?.frameColor, filter: `drop-shadow(0 0 3px ${rarity.valentine?.frameGlow})` }}
            />

            {/* Sub-corners for more "designer" feel */}
            <div className="absolute top-1 left-1 w-1.5 h-1.5 border-l border-t border-white/5 opacity-50" />
            <div className="absolute top-1 right-1 w-1.5 h-1.5 border-r border-t border-white/5 opacity-50" />
            <div className="absolute bottom-1 left-1 w-1.5 h-1.5 border-l border-b border-white/5 opacity-50" />
            <div className="absolute bottom-1 right-1 w-1.5 h-1.5 border-r border-b border-white/5 opacity-50" />

            {/* Message text - Upgraded Typography with Auto-scaling */}
            <div
              className="w-full h-full flex items-center justify-center relative z-10 overflow-hidden"
              style={{ fontSize: `${scaledLayout.message.fontSize}px` }}
            >
              <div
                className="leading-tight text-center overflow-visible w-full px-4 tracking-tight"
                style={{
                  color: rarity.valentine?.frameColor ? `${rarity.valentine.frameColor}ee` : '#ffffff',
                  textShadow: `0 0 15px ${rarity.valentine?.frameGlow || 'rgba(255,255,255,0.2)'}`,
                  letterSpacing: '-0.02em',
                  fontSize: '1em',
                  opacity: 0 // Start hidden during calculation
                }}
              >
                <div
                  className="block w-full font-sync font-bold break-all whitespace-pre-wrap"
                  ref={(el) => {
                    if (el) {
                      const textWrapper = el.parentElement;
                      const container = textWrapper?.parentElement;
                      if (container) {
                        const maxHeight = container.clientHeight - 8;
                        const maxWidth = container.clientWidth - 16;
                        let currentFontSize = scaledLayout.message.fontSize || 22;

                        // Iterative resize to fit
                        container.style.fontSize = `${currentFontSize}px`;
                        while ((el.scrollHeight > maxHeight || el.scrollWidth > maxWidth) && currentFontSize > 7) {
                          currentFontSize -= 0.5;
                          container.style.fontSize = `${currentFontSize}px`;
                        }
                        // Reveal when ready
                        textWrapper.style.opacity = '1';
                      }
                    }
                  }}
                >
                  {valentine.message_text}
                </div>
              </div>
            </div>
          </div>

          {/* Love Note Label - MOVED AFTER MESSAGE FOR Z-LAYERING */}
          <div
            className="absolute z-20"
            style={{
              left: `${scaledLayout.loveNote.x}px`,
              top: `${scaledLayout.loveNote.y}px`,
              width: `${scaledLayout.loveNote.width}px`,
              height: `${scaledLayout.loveNote.height}px`,
              fontSize: `${scaledLayout.loveNote.fontSize}px`
            }}
          >
            <div className="flex items-center gap-2 justify-center">
              {/* Left decorative line */}
              <div
                className="flex-1 h-[1.5px] bg-gradient-to-r from-transparent"
                style={{
                  backgroundColor: rarity.valentine?.frameColor || 'rgba(192, 132, 252, 0.5)',
                  boxShadow: `0 0 ${Math.max(0.4, 3 * (scale || 1))}px ${rarity.valentine?.frameGlow}`
                }}
              />

              {/* Star decoration */}
              <span className="text-[10px]" style={{ color: rarity.valentine?.frameColor, filter: `drop-shadow(0 0 ${Math.max(0.4, 2 * (scale || 1))}px ${rarity.valentine?.frameGlow})` }}>✦</span>

              {/* Label text */}
              <div
                className="font-bold uppercase tracking-[0.2em] whitespace-nowrap"
                style={{
                  color: rarity.valentine?.frameColor,
                  textShadow: `0 0 ${Math.max(0.5, 3.5 * (scale || 1))}px ${rarity.valentine?.frameGlow}`
                }}
              >
                Love Note
              </div>

              {/* Star decoration */}
              <span className="text-[10px]" style={{ color: rarity.valentine?.frameColor, filter: `drop-shadow(0 0 ${Math.max(0.4, 2 * (scale || 1))}px ${rarity.valentine?.frameGlow})` }}>✦</span>

              {/* Right decorative line */}
              <div
                className="flex-1 h-[1.5px] bg-gradient-to-l from-transparent"
                style={{
                  backgroundColor: rarity.valentine?.frameColor || 'rgba(244, 114, 182, 0.5)',
                  boxShadow: `0 0 ${Math.max(0.4, 3 * (scale || 1))}px ${rarity.valentine?.frameGlow}`
                }}
              />
            </div>
          </div>

          {/* FINE-LINE DECORATIVE DETAILS - "The Designer Perimeter" */}
          <div className="absolute inset-0 pointer-events-none opacity-40">
            {/* Top Ticks */}
            <div className="absolute top-[2%] left-1/2 -translate-x-1/2 flex gap-4">
              {[1, 2, 3].map(i => (
                <div key={`t-${i}`} className="w-[1px] h-2 bg-white/20" style={{ boxShadow: `0 0 5px ${rarity.valentine?.frameGlow}` }} />
              ))}
            </div>
            {/* Bottom Ticks */}
            <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 flex gap-4">
              {[1, 2, 3].map(i => (
                <div key={`b-${i}`} className="w-[1px] h-2 bg-white/20" style={{ boxShadow: `0 0 5px ${rarity.valentine?.frameGlow}` }} />
              ))}
            </div>
            {/* Side Ornate Lines */}
            <div
              className="absolute top-[15%] bottom-[25%] left-[2%] w-[1.5px] opacity-30"
              style={{
                background: `linear-gradient(to bottom, transparent, ${rarity.valentine?.frameColor}, transparent)`,
                boxShadow: `0 0 10px ${rarity.valentine?.frameGlow}`
              }}
            />
            <div
              className="absolute top-[15%] bottom-[25%] right-[2%] w-[1.5px] opacity-30"
              style={{
                background: `linear-gradient(to bottom, transparent, ${rarity.valentine?.frameColor}, transparent)`,
                boxShadow: `0 0 10px ${rarity.valentine?.frameGlow}`
              }}
            />
          </div>

          {/* FROM (left bottom) */}
          <div
            className="absolute z-10"
            style={{
              left: `${scaledLayout.fromLabel.x}px`,
              top: `${scaledLayout.fromLabel.y}px`,
              width: `${scaledLayout.fromLabel.width}px`,
              height: `${scaledLayout.fromLabel.height}px`,
              fontSize: `${scaledLayout.fromLabel.fontSize}px`,
              transform: `rotate(${layout.fromLabel.rotation || 0}deg)`,
              transformOrigin: 'left center'
            }}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-white/40 font-mono italic tracking-[0.2em] uppercase" style={{ fontSize: `${(scaledLayout.fromLabel.fontSize || 9) * 0.75}px` }}>from</span>
              <span className={`${rarity.accent} font-bold tracking-tight`} style={{ textShadow: `0 0 10px ${rarity.valentine?.frameGlow}` }}>@{valentine.sender_username}</span>
            </div>
          </div>

          {/* TO (right bottom) */}
          <div
            className="absolute z-10"
            style={{
              left: `${scaledLayout.toLabel.x}px`,
              top: `${scaledLayout.toLabel.y}px`,
              width: `${scaledLayout.toLabel.width}px`,
              height: `${scaledLayout.toLabel.height}px`,
              fontSize: `${scaledLayout.toLabel.fontSize}px`,
              transform: `rotate(${layout.toLabel.rotation || 0}deg)`,
              transformOrigin: 'right center'
            }}
          >
            <div className="flex items-center gap-1.5 justify-end">
              <span className="text-white/40 font-mono italic tracking-[0.2em] uppercase" style={{ fontSize: `${(scaledLayout.toLabel.fontSize || 9) * 0.75}px` }}>to</span>
              <span className={`${rarity.accent} font-bold tracking-tight text-right`} style={{ textShadow: `0 0 10px ${rarity.valentine?.frameGlow}` }}>{recipientText}</span>
            </div>
          </div>
        </div>
      </HeartContainer >
    </div >
  );
};

export default ValentineCard;
