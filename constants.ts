
import { User } from './types';

export const APP_CONFIG = {
  MARQUEE_TEXT: "Powering connections through MagicBlock /// Keep pushing /// Keep sharing /// Keep building ///",
  UPDATE_INTERVAL_MS: 5000,
};

// Helper to generate consistent mock data
const generateMockUsers = () => {
  const prefixes = ['Neon', 'Cyber', 'Null', 'Void', 'Chain', 'Block', 'Ether', 'Solar', 'Lunar', 'Data', 'Glitch', 'Flux', 'Quant', 'Synapse', 'Vector', 'Pixel', 'Net', 'Grid', 'Core', 'Mech'];
  const suffixes = ['Ryder', 'Phantom', 'Wizard', 'Ninja', 'Miner', 'Artist', 'Linker', 'Builder', 'Surfer', 'Runner', 'Walker', 'Ghost', 'Master', 'Zero', 'One', 'Ops', 'Dev', 'Punk', 'Mind', 'Soul'];

  const users = [];

  for (let i = 0; i < 40; i++) {
    const prefix = prefixes[i % prefixes.length];
    const suffix = suffixes[Math.floor(i / 2) % suffixes.length]; // Mix it up
    const username = `${prefix}${suffix}`;

    // Generate weighted random stats
    const tier = Math.random();
    let baseViews, baseLikes, baseRTs, basePosts, baseReplies, baseQuotes;

    if (tier > 0.95) { // Superstars
      baseViews = 15000 + Math.random() * 20000;
      baseLikes = 3000 + Math.random() * 5000;
      baseRTs = 500 + Math.random() * 1000;
      basePosts = 80 + Math.random() * 120;
      baseReplies = 150 + Math.random() * 300;
      baseQuotes = 50 + Math.random() * 150;
    } else if (tier > 0.7) { // Mid-tier
      baseViews = 5000 + Math.random() * 8000;
      baseLikes = 800 + Math.random() * 1500;
      baseRTs = 100 + Math.random() * 300;
      basePosts = 20 + Math.random() * 60;
      baseReplies = 40 + Math.random() * 100;
      baseQuotes = 15 + Math.random() * 45;
    } else { // Normies
      baseViews = 500 + Math.random() * 3000;
      baseLikes = 50 + Math.random() * 500;
      baseRTs = 10 + Math.random() * 80;
      basePosts = 2 + Math.random() * 18;
      baseReplies = 5 + Math.random() * 35;
      baseQuotes = 2 + Math.random() * 12;
    }

    users.push({
      id: `${i + 1}`,
      username: username,
      handle: `@${username.toLowerCase()}_${Math.floor(Math.random() * 999)}`,
      avatarUrl: `https://picsum.photos/seed/${username}/200`,
      stats: {
        views: Math.floor(baseViews),
        likes: Math.floor(baseLikes),
        retweets: Math.floor(baseRTs),
        posts: Math.floor(basePosts),
        replies: Math.floor(baseReplies),
        quotes: Math.floor(baseQuotes)
      }
    });
  }
  return users;
};

export const MOCK_USERS_RAW = generateMockUsers();
