
export interface User {
  username: string;
  display_name: string;
  avatar_url: string;
  posts_count: number;
  likes_total: number;
  replies_total: number;
  retweets_total: number;
  quotes_total: number;
  views_total: number;
  last_updated: string;

  // New DB Fields
  discord_username: string | null;
  discrod_roles: string | null; // Note typo in DB: discrod_roles
  discord_messages: number | null;
  discord_mgb_joined_date: string | null;
  days_in_mgb: number | null;
  best_post: string | null;
  best_post_text: string | null;

  // UI ONLY FIELDS
  stable_rank?: number;
  magicianScore?: number;
}

export interface LeaderboardData {
  lastUpdated: string;
  users: User[];
}

export interface DiscordRole {
  id: string;
  name: string;
  color?: string;
}

export interface Player {
  discordId: string;
  discordUsername: string;
  twitterUsername?: string;
  displayName: string;
  avatarUrl: string;
  roles: DiscordRole[];
  posts_count: number;
  views_total: number;
  likes_total: number;
  replies_total: number;
  retweets_total: number;
  quotes_total: number;
  magicianScore?: number;
  discord_messages_count?: number;
  discord_joined_at?: string;
  days_in_mgb?: number;
  best_post?: string | null;
  best_post_text?: string | null;
  rank?: number;
}

export interface Tweet {
  id: string;
  tweetId: string;
  text: string;
  imageUrl?: string;
  likes: number;
  retweets: number;
  replies: number;
  views: number;
  quotes: number;
  url: string;
  createdAt: string;
}
