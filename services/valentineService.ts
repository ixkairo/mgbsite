import { supabase } from './supabaseClient';
import { User } from '../types';
import { computeMagicianScores } from '../utils/magicianScore';

export interface ValentineData {
  id?: string;
  sender_username: string;
  sender_avatar_url: string;
  sender_display_name: string;
  sender_discord_username?: string;
  sender_role?: string;
  recipient_type: 'community' | 'user';
  recipient_username?: string;
  recipient_display_name?: string;
  recipient_avatar_url?: string;
  recipient_role?: string;
  sender_roles_raw?: string;
  recipient_roles_raw?: string;
  sender_score?: number;
  rarity_tier?: string;
  message_text: string;
  created_at?: string;
  updated_at?: string;
}

export const fetchAllValentines = async (): Promise<ValentineData[]> => {
  try {
    // 1. Fetch all valentines
    const { data: valentines, error: vError } = await supabase
      .from('valentines')
      .select('*')
      .order('created_at', { ascending: false });

    if (vError) {
      console.warn('Failed to fetch valentines:', vError.message);
      return [];
    }

    // 2. Fetch all users to calculate live magician scores
    const { data: userData, error: uError } = await supabase
      .from('users')
      .select('*');

    if (uError) {
      console.warn('Failed to fetch users for enrichment:', uError.message);
      return (valentines || []) as ValentineData[];
    }

    // 3. Compute live scores
    const scoredUsers = computeMagicianScores(userData as User[]);
    const userMap = new Map<string, any>();
    scoredUsers.forEach(u => userMap.set(u.username.toLowerCase(), u));

    // 4. Enrich valentines with live data
    const enrichedValentines = (valentines || []).map((v: any) => {
      const sender = userMap.get(v.sender_username.toLowerCase());
      if (sender) {
        return {
          ...v,
          sender_score: sender.magicianScore,
          sender_roles_raw: sender.discrod_roles, // typo preserved from types.ts
          sender_role: sender.discrod_roles ? sender.discrod_roles.split(/[,\-|]/)[0].trim() : v.sender_role
        };
      }
      return v;
    });

    return enrichedValentines as ValentineData[];
  } catch (err) {
    console.error('Valentine fetch error:', err);
    return [];
  }
};

export const saveValentine = async (valentine: ValentineData): Promise<boolean> => {
  try {
    const { id, sender_role, recipient_role, sender_score, rarity_tier, sender_roles_raw, recipient_roles_raw, ...dataToSave } = valentine;

    if (id) {
      // Update existing
      const { error } = await supabase
        .from('valentines')
        .update({
          ...dataToSave,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Update failed:', error.message);
        return false;
      }
    } else {
      // Check limit before insert
      const existing = await fetchValentinesBySender(valentine.sender_username);
      if (existing.length >= 5) {
        console.error('Valentine limit reached for user');
        return false;
      }

      // Insert new
      const { error } = await supabase
        .from('valentines')
        .insert({
          ...dataToSave,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Insert failed:', error.message);
        return false;
      }
    }

    return true;
  } catch (err) {
    console.error('Valentine save error:', err);
    return false;
  }
};

export const fetchValentinesBySender = async (senderUsername: string): Promise<ValentineData[]> => {
  try {
    const { data, error } = await supabase
      .from('valentines')
      .select('*')
      .eq('sender_username', senderUsername)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data as ValentineData[];
  } catch {
    return [];
  }
};
