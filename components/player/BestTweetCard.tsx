import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { Tweet } from '@/types';
import { normalizeTwitterCdnUrl } from './UnifiedPlayerCard';

interface BestTweetCardProps {
  tweet: Tweet;
}

const numberFormatter = new Intl.NumberFormat('en-US');

const BestTweetCard: React.FC<BestTweetCardProps> = ({ tweet }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="relative rounded-2xl border border-white/10 bg-white/[0.07] backdrop-blur-md overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
    >
      <div className="absolute inset-0 bg-white/[0.02] opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row">
        {/* Tweet Image Preview */}
        <div className="relative w-full md:w-1/2 h-64 md:h-auto bg-white/[0.03] border-b md:border-b-0 md:border-r border-white/10 overflow-hidden">
          {tweet.imageUrl ? (
            <img
              src={normalizeTwitterCdnUrl(tweet.imageUrl) || ''}
              alt="Tweet preview"
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white/20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </div>
                <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/20">
                  No preview available
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tweet Content */}
        <div className="flex-1 p-6 md:p-8">
          <h3 className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/40 mb-4">
            Most popular tweet
          </h3>

          <p className="text-sm md:text-base text-white/80 mb-6 leading-relaxed line-clamp-3">
            {tweet.text}
          </p>

          {/* Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="flex flex-col">
              <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-white/20 mb-1">
                Likes
              </span>
              <span className="text-lg font-mono font-bold text-white">
                {numberFormatter.format(tweet.likes)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-white/20 mb-1">
                RTs
              </span>
              <span className="text-lg font-mono font-bold text-white">
                {numberFormatter.format(tweet.retweets)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-white/20 mb-1">
                Replies
              </span>
              <span className="text-lg font-mono font-bold text-white">
                {numberFormatter.format(tweet.replies)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-white/20 mb-1">
                Views
              </span>
              <span className="text-lg font-mono font-bold text-white">
                {numberFormatter.format(tweet.views)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-white/20 mb-1">
                Quotes
              </span>
              <span className="text-lg font-mono font-bold text-white">
                {numberFormatter.format(tweet.quotes)}
              </span>
            </div>
          </div>

          {/* CTA Button */}
          <a
            href={tweet.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/[0.07] border border-white/20 text-[10px] font-bold uppercase tracking-[0.3em] text-white transition-all duration-300 hover:bg-white/[0.12] hover:border-mb-purple/60 hover:text-mb-purple hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] pointer-events-auto backdrop-blur-md"
          >
            Open Tweet
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </motion.div>
  );
};

export default BestTweetCard;
