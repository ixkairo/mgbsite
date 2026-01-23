
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

const UserCard: React.FC<UserCardProps> = ({ user, position, variant = 'compact', activeSortKey }) => {
  const [imgError, setImgError] = useState(false);

  const formatValue = (val: number) => {
    return numberFormatter.format(val);
  };

  const getStatValueStyle = (key: string) => {
    if (activeSortKey === key) {
      return 'text-mb-purple font-black scale-110 drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]';
    }
    return 'text-white/70 font-bold';
  };

  const statsList = [
    { key: 'posts_count', label: 'Posts' },
    { key: 'views_total', label: 'Views' },
    { key: 'likes_total', label: 'Likes' },
    { key: 'replies_total', label: 'Replies' },
    { key: 'retweets_total', label: 'RTs' },
    { key: 'quotes_total', label: 'Quotes' }
  ];

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

    return (
      <a
        href={profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`group relative rounded-2xl py-2 px-1 sm:px-3 md:py-4 md:px-8 flex flex-col md:flex-row md:items-center md:justify-between transition-all duration-500 block cursor-pointer backdrop-blur-md overflow-hidden border ${getTopHighlight()}`}
      >
        <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <div className="flex items-center gap-2 md:gap-8 relative z-10 max-w-full md:max-w-[40%] pointer-events-none">
          <div className="flex-shrink-0 w-8 text-center">
            <span className={`font-mono font-bold text-[10px] md:text-xl block transition-all duration-300 ${getRankTextStyle()} group-hover:text-white`}>
              {position < 10 ? `0${position}` : position}
            </span>
          </div>
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <div className="relative flex-shrink-0 w-6 h-6 md:w-12 md:h-12">
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
              <h3 title={primaryName} className={`font-black text-[10px] md:text-[14px] tracking-tight uppercase truncate transition-colors ${position === 1 ? 'text-white' : 'text-white/80 group-hover:text-white group-hover:drop-shadow-[0_0_8px_#fff]'}`}>
                {primaryName}
              </h3>
              <p className="text-white/30 text-[7px] md:text-[9px] font-mono truncate uppercase tracking-[0.25em] group-hover:text-white/60 transition-colors">
                {secondaryName}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap md:flex-nowrap items-center justify-center md:justify-end gap-x-2 gap-y-1 md:gap-8 relative z-10 pointer-events-none mt-2 md:mt-0">
          {statsList.map(({ key, label }) => (
            <div key={key} className="text-right min-w-[40px] md:min-w-[65px] flex flex-col items-center md:items-end">
              <div className={`text-[6px] md:text-[8px] font-mono uppercase tracking-widest mb-0.5 md:mb-1 transition-colors ${activeSortKey === key ? 'text-mb-purple/60' : 'text-white/10 group-hover:text-white/40'}`}>
                {label}
              </div>
              <span className={`font-mono text-[9px] md:text-[14px] transition-all duration-300 origin-right ${getStatValueStyle(key)} group-hover:text-white`}>
                {formatValue(user[key as keyof User] as number)}
              </span>
            </div>
          ))}
        </div>
        <div className="absolute left-10 right-10 bottom-0 h-[1.5px] bg-white scale-x-0 group-hover:scale-x-100 transition-transform origin-center duration-500 rounded-full shadow-[0_0_15px_#fff] z-10" />
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

  return (
    <a
      href={profileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`relative p-8 pt-10 flex flex-col items-center text-center border rounded-[2.5rem] transition-all duration-500 hover:bg-white/[0.18] hover:border-white/80 hover:shadow-[0_0_70px_rgba(255,255,255,0.4)] backdrop-blur-md group overflow-hidden block cursor-pointer ${getHeroStyles()}`}
    >
      <div className="absolute inset-0 bg-white/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full flex justify-between items-start p-6 z-20 pointer-events-none">
        <div className="flex flex-col items-start">
          <span className={`font-mono text-[9px] uppercase tracking-[0.3em] mb-1 ${position === 1 ? 'text-mb-purple font-bold' : 'text-white/30'} group-hover:text-white/60 transition-colors`}>
            Rank
          </span>
          <div className="flex items-baseline gap-1">
            <span className={`font-sync font-black text-4xl leading-none italic ${getHeroRankTextStyle()} group-hover:text-white group-hover:drop-shadow-[0_0_15px_#fff] transition-all`}>
              {position < 10 ? `0${position}` : position}
            </span>
          </div>
        </div>
        <div className={`p-2 rounded-full border border-white/10 backdrop-blur-md transition-all duration-500 ${position === 1 ? 'bg-mb-purple/20 shadow-[0_0_20px_rgba(139,92,246,0.4)] group-hover:bg-white/20 group-hover:shadow-[0_0_30px_#fff]' : 'bg-white/5 group-hover:bg-white/20'}`}>
          {position === 1 && <Crown className="w-5 h-5 text-mb-purple group-hover:text-white transition-colors" />}
          {position === 2 && <Trophy className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />}
          {position === 3 && <Medal className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />}
        </div>
      </div>
      <div className={`absolute -bottom-8 -right-8 text-[180px] leading-none font-sync font-black opacity-[0.02] group-hover:opacity-[0.05] select-none pointer-events-none rotate-0 text-white transition-opacity duration-500`}>
        {position}
      </div>
      <div className="mt-8 mb-6 relative z-10 group-hover:scale-105 transition-transform duration-500 pointer-events-none">
        <div className="relative inline-block w-24 h-24 md:w-32 md:h-32">
          {position === 1 && (
            <>
              <div className="absolute -inset-4 rounded-full border border-mb-purple/30 animate-[spin_8s_linear_infinite] group-hover:border-white/30" />
              <div className="absolute -inset-4 rounded-full border border-white/10 animate-[spin_12s_linear_infinite_reverse]" />
            </>
          )}
          <div className={`w-full h-full p-1.5 rounded-full border-2 ${position === 1 ? 'border-mb-purple shadow-[0_0_30px_rgba(139,92,246,0.4)]' : 'border-white/20'} transition-all duration-500 group-hover:border-white group-hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] relative bg-black/40 overflow-hidden`}>
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
      <div className="mb-8 relative z-10 w-full px-4 pointer-events-none">
        <h3 title={primaryName} className={`text-white font-black text-2xl md:text-3xl tracking-tighter uppercase mb-2 group-hover:scale-105 group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all duration-500 truncate ${position === 1 ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]' : ''}`}>
          {primaryName}
        </h3>
        <div className="flex items-center justify-center gap-2">
          <span className={`h-[1px] w-8 transition-colors duration-500 ${position === 1 ? 'bg-mb-purple' : 'bg-white/20'} group-hover:bg-white`} />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white group-hover:text-white transition-colors duration-500">
            MAGICBLOCK CHAD
          </p>
          <span className={`h-[1px] w-8 transition-colors duration-500 ${position === 1 ? 'bg-mb-purple' : 'bg-white/20'} group-hover:bg-white`} />
        </div>
      </div>
      <div className="w-full grid grid-cols-3 gap-y-6 gap-x-2 pt-6 border-t border-white/10 group-hover:border-white/40 transition-colors duration-500 relative z-10 bg-black/20 group-hover:bg-black/40 -mx-8 px-8 pb-4 pointer-events-none rounded-2xl">
        {statsList.map(({ key, label }) => (
          <div key={key} className="flex flex-col items-center">
            <p className={`text-[8px] uppercase font-bold tracking-[0.3em] mb-1 transition-colors duration-500 ${activeSortKey === key ? 'text-mb-purple' : 'text-white/20 group-hover:text-white/60'}`}>{label}</p>
            <p className={`font-mono font-bold text-lg tracking-tight transition-all duration-500 ${getStatValueStyle(key)} group-hover:text-white`}>
              {formatValue(user[key as keyof User] as number)}
            </p>
          </div>
        ))}
      </div>
    </a>
  );
};

export default UserCard;
