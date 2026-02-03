import { Player, Tweet } from '@/types';

/**
 * Mock player data for development/testing
 * TODO: Replace with Supabase query to fetch player by Discord username
 */
export const mockPlayer: Player = {
  discordId: '123456789012345678',
  discordUsername: 'testuser',
  twitterUsername: 'testuser_x',
  displayName: 'Test User',
  avatarUrl: 'https://cdn.discordapp.com/avatars/123456789012345678/abcdef123456.png',
  roles: [
    { id: '1', name: 'Developer', color: '#8B5CF6' },
    { id: '2', name: 'Contributor', color: '#3B82F6' },
    { id: '3', name: 'Member', color: '#10B981' },
  ],
  posts_count: 42,
  magicianScore: 35,
  views_total: 125000,
  likes_total: 3500,
  replies_total: 890,
  retweets_total: 1200,
  quotes_total: 340,
  discord_messages_count: 1250,
  discord_joined_at: '2023-11-20T14:30:00Z',
  days_in_mgb: 74,
  best_post: 'https://x.com/testuser/status/1234567890123456789',
  best_post_text: 'Just shipped an amazing feature! 🚀 Check it out and let me know what you think.'
};

/**
 * Mock tweet data for development/testing
 * TODO: Replace with Supabase query to fetch best tweet from tweets table
 */
export const mockTweet: Tweet = {
  id: 'tweet-1',
  tweetId: '1234567890123456789',
  text: 'Just shipped an amazing feature! 🚀 Check it out and let me know what you think.',
  imageUrl: 'https://picsum.photos/400/800?random=1',
  likes: 1250,
  retweets: 340,
  replies: 89,
  views: 45000,
  quotes: 12,
  url: 'https://x.com/testuser/status/1234567890123456789',
  createdAt: '2024-01-15T10:30:00Z',
};

/**
 * Simulates API delay for loading states
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
