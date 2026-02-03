
import React, { useState } from 'react';
import { User } from '../types';
import { Trophy, Crown, Medal } from 'lucide-react';

interface UserCardProps {
  user: User;
  position: number;
  variant?: 'hero' | 'compact';
  activeSortKey?: string;
}

const numberFormatter = new Intl.NumberFormat('en-US');

const formatCompact = (val: number): string => {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
  return val.toString();
};

const UserCard: React.FC<UserCardProps> = ({ user, position, variant = 'compact', activeSortKey }) => {
  const [imgError, setImgError] = useState(false);

  const formatValue = (val: number, key?: string) => {
    if (key === 'magician_score') {
      return val.toFixed(1);
    }
    return formatCompact(val);
  };

  const getStatValueStyle = (key: string) => {
    if (activeSortKey === key) {
      return 'text-mb-purple font-black scale-110 drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]';
    }
    return 'text-white/70 font-bold';
  };

  const statsList = [
    { key: 'magician_score', label: 'M-Score' },
    { key: 'posts_count', label: 'Posts' },
    { key: 'views_total', label: 'Views' },
    { key: 'likes_total', label: 'Likes' },
    { key: 'replies_total', label: 'Replies' },
    { key: 'retweets_total', label: 'RTs' },
    { key: 'quotes_total', label: 'Quotes' }
  ];

  // Get primary metric based on active sort
  const getPrimaryMetric = () => {
    if (activeSortKey === 'magician_score' || !activeSortKey) {
      return { key: 'magician_score', label: 'Magician Score', value: user.magicianScore };
    }
    const stat = statsList.find(s => s.key === activeSortKey);
    if (stat) {
      return { key: stat.key, label: stat.label, value: user[stat.key as keyof User] as number };
    }
    return { key: 'magician_score', label: 'Magician Score', value: user.magicianScore };
  };

  // 6 metrics including quotes
  const getMetricsRow = () => {
    return [
      { key: 'posts_count', label: 'Posts', value: user.posts_count },
      { key: 'views_total', label: 'Views', value: user.views_total },
      { key: 'likes_total', label: 'Likes', value: user.likes_total },
      { key: 'replies_total', label: 'Replies', value: user.replies_total },
      { key: 'retweets_total', label: 'RTs', value: user.retweets_total },
      { key: 'quotes_total', label: 'Quotes', value: user.quotes_total },
    ];
  };

  // Identifiers
  const primaryName = user.display_name || user.username;
  const secondaryName = `@${user.username}`;
  const profileUrl = `https://x.com/${user.username}`;

  if (variant === 'compact') {
    const getTopHighlight = () => {
      if (position === 1) return 'bg-mb-purple/[0.1] border-mb-purple/50 shadow-[0_0_40px_rgba(139,92,246,0.25)] ring-1 ring-mb-purple/30 hover:bg-mb-purple/[0.15] hover:shadow-[0_0_50px_rgba(255,255,255,0.2)]';
      if (position === 2) return 'bg-white/[0.09] border-white/30 shadow-[0_0_25px_rgba(255,255,255,0.15)] hover:bg-white/[0.12] hover:shadow-[0_0_40px_rgba(255,255,255,0.25)]';
      if (position === 3) return 'bg-white/[0.07] border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.08)] hover:bg-white/[0.1] hover:shadow-[0_0_35px_rgba(255,255,255,0.2)]';
      return 'bg-white/[0.06] border-white/10 shadow-[0_0_10px_rgba(255,255,255,0.02)] hover:bg-white/[0.08] hover:border-white/30 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]';
    };

    const getRankTextStyle = () => {
      if (position === 1) return 'text-mb-purple drop-shadow-[0_0_10px_rgba(139,92,246,0.8)] scale-110';
      if (position === 2) return 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]';
      if (position === 3) return 'text-white/90 drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]';
      return 'text-white/40 drop-shadow-[0_0_2px_rgba(255,255,255,0.1)]';
    };

    const getRankIndicatorColor = () => {
      if (position === 1) return 'bg-mb-purple shadow-[0_0_10px_rgba(139,92,246,1)]';
      if (position === 2) return 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]';
      if (position === 3) return 'bg-white/60 shadow-[0_0_5px_rgba(255,255,255,0.4)]';
      return 'bg-white/20';
    };

    const metricsRow = getMetricsRow();
    const isMagicianActive = activeSortKey === 'magician_score' || !activeSortKey;
    const magicianScore = user.magicianScore ?? 0;

    return (
      <a
        href={profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`group relative rounded-2xl py-3 px-4 md:py-4 md:px-6 transition-all duration-500 block cursor-pointer backdrop-blur-md overflow-hidden border ${getTopHighlight()}`}
      >
        <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <div className="relative z-10 pointer-events-none">
          {/* Mobile: Two clean rows to prevent overlap */}
          <div className="md:hidden">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 text-center">
                <span className={`font-mono font-bold text-xs block transition-all ${getRankTextStyle()} group-hover:text-white`}>
                  {position < 10 ? `0${position}` : position}
                </span>
              </div>

              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="relative flex-shrink-0 w-10 h-10">
                  {!imgError ? (
                    <img
                      src={user.avatar_url}
                      alt=""
                      onError={() => setImgError(true)}
                      className={`w-full h-full rounded-full group-hover:brightness-125 transition-all duration-500 border border-white/10 shadow-lg object-cover ${position === 1 ? 'ring-2 ring-mb-purple/30' : ''}`}
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                      <div className="w-1/3 h-1/3 rounded-full bg-white/10" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <h3 title={primaryName} className={`font-black text-sm tracking-tight uppercase truncate transition-colors ${position === 1 ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>
                    {primaryName}
                  </h3>
                  <p className="text-white/30 text-[8px] font-mono truncate uppercase tracking-[0.1em] group-hover:text-white/50 transition-colors">
                    {secondaryName}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span className={`text-[7px] font-mono uppercase tracking-wider transition-colors ${isMagicianActive ? 'text-mb-purple/80' : 'text-white/30'}`}>
                  M-Score
                </span>
                <span className={`text-lg font-mono font-black transition-all tabular-nums ${isMagicianActive ? 'text-mb-purple drop-shadow-[0_0_10px_rgba(139,92,246,0.7)]' : 'text-white/70'} group-hover:text-white`}>
                  {magicianScore.toFixed(1)}
                </span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {metricsRow.map(({ key, label, value }) => {
                const isActive = activeSortKey === key;
                return (
                  <div key={key} className="flex flex-col items-center rounded-xl border border-white/5 bg-black/20 py-1.5 px-1">
                    <span className={`text-[7px] font-mono uppercase tracking-wide transition-colors ${isActive ? 'text-mb-purple/80' : 'text-white/25'}`}>
                      {label}
                    </span>
                    <span className={`text-[11px] font-mono font-bold transition-colors tabular-nums ${isActive ? 'text-mb-purple' : 'text-white/60'} group-hover:text-white/80`}>
                      {formatValue(value, key)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Desktop: Keep original single-row layout */}
          <div className="hidden md:flex items-center gap-5">
            <div className="flex-shrink-0 w-8 text-center">
              <span className={`font-mono font-bold text-base block transition-all ${getRankTextStyle()} group-hover:text-white`}>
                {position < 10 ? `0${position}` : position}
              </span>
            </div>

            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex-shrink-0 w-11 h-11">
                {!imgError ? (
                  <img
                    src={user.avatar_url}
                    alt=""
                    onError={() => setImgError(true)}
                    className={`w-full h-full rounded-full group-hover:brightness-125 transition-all duration-500 border border-white/10 shadow-lg object-cover ${position === 1 ? 'ring-2 ring-mb-purple/30' : ''}`}
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <div className="w-1/3 h-1/3 rounded-full bg-white/10" />
                  </div>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <h3 title={primaryName} className={`font-black text-sm tracking-tight uppercase truncate transition-colors ${position === 1 ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>
                  {primaryName}
                </h3>
                <p className="text-white/30 text-[9px] font-mono truncate uppercase tracking-[0.1em] group-hover:text-white/50 transition-colors">
                  {secondaryName}
                </p>
              </div>
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-6 flex-shrink-0">
              <div className="flex flex-col items-end">
                <span className={`text-[8px] font-mono uppercase tracking-wider transition-colors ${isMagicianActive ? 'text-mb-purple/80' : 'text-white/30'}`}>
                  M-Score
                </span>
                <span className={`text-xl font-mono font-black transition-all tabular-nums ${isMagicianActive ? 'text-mb-purple drop-shadow-[0_0_10px_rgba(139,92,246,0.7)]' : 'text-white/70'} group-hover:text-white`}>
                  {magicianScore.toFixed(1)}
                </span>
              </div>

              <div className="flex items-center gap-4">
                {metricsRow.map(({ key, label, value }) => {
                  const isActive = activeSortKey === key;
                  return (
                    <div key={key} className="flex flex-col items-center min-w-[50px]">
                      <span className={`text-[8px] font-mono uppercase tracking-wide transition-colors ${isActive ? 'text-mb-purple/80' : 'text-white/25'}`}>
                        {label}
                      </span>
                      <span className={`text-xs font-mono font-bold transition-colors tabular-nums ${isActive ? 'text-mb-purple' : 'text-white/50'} group-hover:text-white/80`}>
                        {formatValue(value, key)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="absolute left-4 right-4 bottom-0 h-[1px] bg-white scale-x-0 group-hover:scale-x-100 transition-transform origin-center duration-500 rounded-full shadow-[0_0_12px_#fff] z-10" />
      </a>
    );
  }

  const getHeroStyles = () => {
    switch (position) {
      case 1:
        return "bg-gradient-to-b from-white/[0.18] to-white/[0.06] border-white/60 shadow-[0_0_90px_rgba(139,92,246,0.25)] ring-1 ring-white/40 hover:from-white/[0.22] hover:shadow-[0_0_100px_rgba(255,255,255,0.4)]";
      case 2:
        return "bg-gradient-to-b from-white/[0.14] to-white/[0.05] border-white/40 shadow-[0_0_60px_rgba(255,255,255,0.15)] hover:from-white/[0.18] hover:shadow-[0_0_70px_rgba(255,255,255,0.3)]";
      case 3:
        return "bg-gradient-to-b from-white/[0.10] to-white/[0.03] border-white/25 shadow-[0_0_40px_rgba(255,255,255,0.08)] hover:from-white/[0.14] hover:shadow-[0_0_50px_rgba(255,255,255,0.25)]";
      default:
        return "bg-white/[0.05] border-white/10";
    }
  };

  const getHeroRankTextStyle = () => {
    if (position === 1) return 'text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]';
    if (position === 2) return 'text-white/90 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]';
    if (position === 3) return 'text-white/80 drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]';
    return 'text-white/70';
  };

  const metricsRow = getMetricsRow();
  const isMagicianActive = activeSortKey === 'magician_score' || !activeSortKey;
  const magicianScore = user.magicianScore ?? 0;

  return (
    <a
      href={profileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`relative p-6 pt-8 flex flex-col items-center text-center border rounded-[2rem] transition-all duration-500 hover:bg-white/[0.18] hover:border-white/80 hover:shadow-[0_0_70px_rgba(255,255,255,0.4)] backdrop-blur-md group overflow-hidden block cursor-pointer ${getHeroStyles()}`}
    >
      <div className="absolute inset-0 bg-white/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full flex justify-between items-start p-5 z-20 pointer-events-none">
        <div className="flex flex-col items-start">
          <span className={`font-mono text-[8px] uppercase tracking-[0.3em] mb-1 ${position === 1 ? 'text-mb-purple font-bold' : 'text-white/30'} group-hover:text-white/60 transition-colors`}>
            Rank
          </span>
          <div className="flex items-baseline gap-1">
            <span className={`font-sync font-black text-3xl leading-none italic ${getHeroRankTextStyle()} group-hover:text-white group-hover:drop-shadow-[0_0_15px_#fff] transition-all`}>
              {position < 10 ? `0${position}` : position}
            </span>
          </div>
        </div>
        <div className={`p-1.5 rounded-full border border-white/10 backdrop-blur-md transition-all duration-500 ${position === 1 ? 'bg-mb-purple/20 shadow-[0_0_20px_rgba(139,92,246,0.4)] group-hover:bg-white/20 group-hover:shadow-[0_0_30px_#fff]' : 'bg-white/5 group-hover:bg-white/20'}`}>
          {position === 1 && <Crown className="w-4 h-4 text-mb-purple group-hover:text-white transition-colors" />}
          {position === 2 && <Trophy className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />}
          {position === 3 && <Medal className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />}
        </div>
      </div>

      <div className="mt-6 mb-4 relative z-10 group-hover:scale-105 transition-transform duration-500 pointer-events-none">
        <div className="relative inline-block w-20 h-20 md:w-24 md:h-24">
          {position === 1 && (
            <>
              <div className="absolute -inset-3 rounded-full border border-mb-purple/30 animate-[spin_8s_linear_infinite] group-hover:border-white/30" />
              <div className="absolute -inset-3 rounded-full border border-white/10 animate-[spin_12s_linear_infinite_reverse]" />
            </>
          )}
          <div className={`w-full h-full p-1 rounded-full border-2 ${position === 1 ? 'border-mb-purple shadow-[0_0_30px_rgba(139,92,246,0.4)]' : 'border-white/20'} transition-all duration-500 group-hover:border-white group-hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] relative bg-black/40 overflow-hidden`}>
            {!imgError ? (
              <img
                src={user.avatar_url}
                alt=""
                onError={() => setImgError(true)}
                className="w-full h-full rounded-full group-hover:brightness-110 transition-all duration-700 object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-white/5 flex items-center justify-center">
                <div className="w-1/3 h-1/3 rounded-full bg-white/10" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Name - Now appears first */}
      <div className="mb-2 relative z-10 w-full px-2 pointer-events-none">
        <h3 title={primaryName} className={`text-white font-black text-xl md:text-2xl tracking-tighter uppercase mb-1 group-hover:scale-105 group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all duration-500 truncate ${position === 1 ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]' : ''}`}>
          {primaryName}
        </h3>
        <div className="flex items-center justify-center gap-2">
          <span className={`h-[1px] w-6 transition-colors duration-500 ${position === 1 ? 'bg-mb-purple' : 'bg-white/20'} group-hover:bg-white`} />
          <p className="text-[9px] font-black uppercase tracking-[0.35em] text-white/60 group-hover:text-white transition-colors duration-500">
            MAGICBLOCK CHAD
          </p>
          <span className={`h-[1px] w-6 transition-colors duration-500 ${position === 1 ? 'bg-mb-purple' : 'bg-white/20'} group-hover:bg-white`} />
        </div>
      </div>

      {/* Magician Score - Now appears second */}
      <div className="mb-4 relative z-10 pointer-events-none">
        <span className={`text-[7px] font-mono uppercase tracking-[0.4em] mb-1 block transition-colors ${isMagicianActive ? 'text-mb-purple/80' : 'text-white/40'}`}>
          Magician Score
        </span>
        <span className={`text-3xl md:text-4xl font-mono font-black transition-all block tabular-nums ${isMagicianActive ? 'text-mb-purple drop-shadow-[0_0_16px_rgba(139,92,246,0.8)]' : 'text-white/70'} group-hover:text-white`}>
          {magicianScore.toFixed(1)}
        </span>
      </div>

      {/* 6 Metrics - 2 rows (3 + 3) - Mobile optimized */}
      <div className="w-full grid grid-cols-3 gap-x-2 gap-y-3 md:gap-x-6 md:gap-y-4 pt-3 md:pt-4 border-t border-white/10 group-hover:border-white/40 transition-colors duration-500 relative z-10 bg-black/20 group-hover:bg-black/40 -mx-4 md:-mx-6 px-2 md:px-6 pb-3 md:pb-4 pointer-events-none rounded-xl">
        {metricsRow.map(({ key, label, value }) => {
          const isActive = activeSortKey === key;
          return (
            <div key={key} className="flex flex-col items-center gap-0.5 md:gap-1.5">
              <p className={`text-[7px] md:text-[8px] uppercase font-bold tracking-wide transition-colors ${isActive ? 'text-mb-purple/80' : 'text-white/25'}`}>
                {label}
              </p>
              <p className={`font-mono font-bold text-sm md:text-base transition-colors tabular-nums ${isActive ? 'text-mb-purple' : 'text-white/60'} group-hover:text-white`}>
                {formatValue(value, key)}
              </p>
            </div>
          );
        })}
      </div>
    </a>
  );
};

export default React.memo(UserCard);
