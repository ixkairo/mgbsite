import React from 'react';
import { motion } from 'framer-motion';
import { Player } from '@/types';
import { normalizeTwitterCdnUrl } from './UnifiedPlayerCard';

interface PlayerHeaderCardProps {
  player: Player;
}

const PlayerHeaderCard: React.FC<PlayerHeaderCardProps> = ({ player }) => {
  const hasMagicianScore = player.magicianScore !== undefined && player.magicianScore !== null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="relative rounded-2xl border border-white/10 bg-white/[0.07] backdrop-blur-md p-8 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
    >
      <div className="absolute inset-0 bg-white/[0.02] opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl" />

      <div className="relative z-10 flex flex-col items-center text-center gap-6">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-2 border-white/20 bg-white/5 p-1 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <img
              src={normalizeTwitterCdnUrl(player.avatarUrl) || ''}
              alt={player.displayName}
              className="w-full h-full rounded-full object-cover"
              crossOrigin="anonymous"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.displayName)}&background=8B5CF6&color=fff&size=128`;
              }}
            />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-mb-purple border-2 border-black shadow-[0_0_10px_rgba(139,92,246,0.6)] flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0 w-full">
          <h2 className="text-2xl md:text-3xl font-sync font-bold tracking-tighter uppercase text-white mb-2 truncate">
            {player.displayName}
          </h2>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40 mb-4">
            Discord member
          </p>

          {/* Magician Score */}
          {hasMagicianScore && (
            <div className="flex flex-col items-center gap-2 mb-4 pb-4 border-b border-white/10">
              <span className="text-[8px] font-mono uppercase tracking-[0.4em] text-mb-purple/70">
                Magician Score
              </span>
              <span className="text-4xl font-mono font-black text-mb-purple drop-shadow-[0_0_15px_rgba(139,92,246,0.7)] tabular-nums">
                {player.magicianScore.toFixed(1)}
              </span>
            </div>
          )}

          {/* Role Badges */}
          {player.roles && player.roles.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {player.roles.map((role) => (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + parseInt(role.id) * 0.05 }}
                  className="px-3 py-1 rounded-full bg-white/[0.07] border border-white/20 text-[9px] font-mono uppercase tracking-[0.2em] text-white/70 backdrop-blur-sm hover:border-mb-purple/60 hover:text-mb-purple transition-all duration-300"
                  style={{
                    borderColor: role.color ? `${role.color}40` : undefined,
                  }}
                >
                  {role.name}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default PlayerHeaderCard;
