import { User } from '../types';
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
