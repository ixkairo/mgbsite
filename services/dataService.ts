import { User, Tweet } from '../types';
import { supabase } from './supabaseClient';

export const fetchLeaderboardData = async (): Promise<User[]> => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('posts_count', { ascending: false });

        if (error) {
            console.warn('Leaderboard sync interrupted:', error.message);
            return [];
        }

        if (!data) return [];

        return data as User[];
    } catch (err) {
        console.warn('Network sync failure');
        return [];
    }
};

/**
 * Fetches the TOP 15 users from EACH category and merges them into a unique list.
 * Categories: posts_count, views_total, likes_total, replies_total
 */
export const fetchCarouselUsers = async (): Promise<User[]> => {
    try {
        const categories = [
            'posts_count',
            'views_total',
            'likes_total',
            'replies_total'
        ];

        // Execute queries in parallel for efficiency
        const results = await Promise.all(
            categories.map(cat =>
                supabase
                    .from('users')
                    .select('*')
                    .order(cat, { ascending: false })
                    .limit(15)
            )
        );

        const allUsers: User[] = [];
        results.forEach(({ data, error }) => {
            if (error) {
                console.warn('Error fetching category subset:', error.message);
            } else if (data) {
                allUsers.push(...(data as User[]));
            }
        });

        // Deduplicate by username
        const uniqueUsersMap = new Map<string, User>();
        allUsers.forEach(user => {
            if (!uniqueUsersMap.has(user.username)) {
                uniqueUsersMap.set(user.username, user);
            }
        });

        return Array.from(uniqueUsersMap.values());
    } catch (err) {
        console.warn('Carousel data sync failure');
        return [];
    }
};
// Fallback search for specific user
export const findUserByIdentifier = async (identifier: string): Promise<User | null> => {
    try {
        // Sanitize input to prevent query syntax errors
        const safeId = identifier.replace(/[^\w\d_@.-]/g, '');
        if (!safeId) return null;

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .or(`username.ilike.${safeId},discord_username.ilike.${safeId},display_name.ilike.%${safeId}%`)
            .limit(1)
            .single();

        if (error) return null;
        return data as User;
    } catch {
        return null;
    }
};

/**
 * Fetches a single tweet record by its URL.
 */
export const fetchTweetByUrl = async (tweetUrl: string): Promise<Tweet | null> => {
    try {
        const { data, error } = await supabase
            .from('tweets')
            .select('*')
            .eq('tweet_url', tweetUrl)
            .limit(1)
            .single();

        if (error) return null;

        // Map DB record to Tweet interface
        return {
            id: data.id,
            tweetId: data.tweet_url.match(/\/status\/(\d+)/)?.[1] || '',
            text: data.text || '',
            imageUrl: data.tweet_media_url,
            likes: data.likes || 0,
            retweets: data.retweets || 0,
            replies: data.replies || 0,
            views: data.views || 0,
            quotes: data.quotes || 0,
            url: data.tweet_url,
            createdAt: data.last_updated // Using last_updated as creation date since it's the closest we have
        } as Tweet;
    } catch {
        return null;
    }
};
