import React from 'react';
import { motion } from 'framer-motion';
import { Player } from '@/types';

interface PlayerStatsGridProps {
  player: Player;
}

const numberFormatter = new Intl.NumberFormat('en-US');

const PlayerStatsGrid: React.FC<PlayerStatsGridProps> = ({ player }) => {
  const stats = [
    { key: 'posts_count', label: 'Posts', value: player.posts_count },
    { key: 'views_total', label: 'Views', value: player.views_total },
    { key: 'likes_total', label: 'Likes', value: player.likes_total },
    { key: 'replies_total', label: 'Replies', value: player.replies_total },
    { key: 'retweets_total', label: 'RTs', value: player.retweets_total },
    { key: 'quotes_total', label: 'Quotes', value: player.quotes_total },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="relative rounded-2xl border border-white/10 bg-white/[0.07] backdrop-blur-md p-8 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
    >
      <div className="absolute inset-0 bg-white/[0.02] opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl" />
      
      <div className="relative z-10">
        <h3 className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/40 mb-6">
          Leaderboard Stats
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {stats.map((stat, index) => {
            const displayValue = numberFormatter.format(stat.value);

            return (
              <motion.div
                key={stat.key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="relative p-5 rounded-xl border border-white/5 bg-white/[0.03] backdrop-blur-sm hover:border-white/20 hover:bg-white/[0.05] transition-all duration-300 group"
              >
                <div className="absolute inset-0 bg-mb-purple/0 group-hover:bg-mb-purple/5 transition-colors duration-300 rounded-xl" />
                <div className="relative z-10 flex flex-col gap-2">
                  <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/30 group-hover:text-white/50 transition-colors">
                    {stat.label}
                  </p>
                  <p className="text-2xl md:text-3xl font-mono font-bold text-white group-hover:text-mb-purple transition-colors duration-300 tabular-nums">
                    {displayValue}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default PlayerStatsGrid;
