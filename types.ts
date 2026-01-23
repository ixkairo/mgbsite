
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
  // UI ONLY FIELDS
  stable_rank?: number;
}

export interface LeaderboardData {
  lastUpdated: string;
  users: User[];
}
