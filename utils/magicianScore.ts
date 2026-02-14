import { User, Player } from '@/types';
import { getRarityConfig } from './rarity';

interface UserWithScore extends User {
  magicianScore: number;
}

interface PlayerWithScore extends Player {
  magicianScore: number;
}

/**
 * Computes Magician Score with activity soft bonus.
 * Formula:
 * - reach = log1p(views)
 * - quality = log1p(likes + 2*replies)
 * - consistency = log1p(posts)
 * - Normalize each component across dataset (0..1)
 * - base = 0.45*reachN + 0.40*qualityN + 0.15*consistencyN
 * - activity = min(1, posts/8)
 * - finalScore = 100 * (0.85*base + 0.15*base*activity)
 * - Clamp to [0, 100]
 */
export function computeMagicianScores(users: User[]): UserWithScore[] {
  if (users.length === 0) return [];

  // Step 1: Compute raw components for each user
  const components = users.map(user => {
    const reach = Math.log1p(user.views_total);
    const quality = Math.log1p(user.likes_total + 2 * user.replies_total);
    const consistency = Math.log1p(user.posts_count);

    return { user, reach, quality, consistency };
  });

  // Step 2: Find max values for normalization
  const maxReach = Math.max(...components.map(c => c.reach), 0);
  const maxQuality = Math.max(...components.map(c => c.quality), 0);
  const maxConsistency = Math.max(...components.map(c => c.consistency), 0);

  // Step 3: Normalize and compute final scores
  return components.map(({ user, reach, quality, consistency }) => {
    const reachN = maxReach > 0 ? reach / maxReach : 0;
    const qualityN = maxQuality > 0 ? quality / maxQuality : 0;
    const consistencyN = maxConsistency > 0 ? consistency / maxConsistency : 0;

    const base = 0.45 * reachN + 0.40 * qualityN + 0.15 * consistencyN;
    const activity = Math.min(1, user.posts_count / 8);
    const rawScore = 100 * (0.85 * base + 0.15 * base * activity);
    const magicianScore = Math.max(0, Math.min(100, rawScore));

    return {
      ...user,
      magicianScore: Number(magicianScore.toFixed(1))
    };
  });
}

/**
 * Computes Magician Score for a single player using the same normalization approach.
 * If normalizationContext is provided, uses those max values; otherwise returns a score based on raw values.
 */
export function computePlayerMagicianScore(
  player: Player,
  normalizationContext?: { maxReach: number; maxQuality: number; maxConsistency: number }
): PlayerWithScore {
  const reach = Math.log1p(player.views_total);
  const quality = Math.log1p(player.likes_total + 2 * player.replies_total);
  const consistency = Math.log1p(player.posts_count);

  let magicianScore: number;

  if (normalizationContext) {
    const { maxReach, maxQuality, maxConsistency } = normalizationContext;
    const reachN = maxReach > 0 ? reach / maxReach : 0;
    const qualityN = maxQuality > 0 ? quality / maxQuality : 0;
    const consistencyN = maxConsistency > 0 ? consistency / maxConsistency : 0;

    const base = 0.45 * reachN + 0.40 * qualityN + 0.15 * consistencyN;
    const activity = Math.min(1, player.posts_count / 8);
    const rawScore = 100 * (0.85 * base + 0.15 * base * activity);
    magicianScore = Math.max(0, Math.min(100, rawScore));
  } else {
    // Fallback: Use raw components without normalization (for standalone player view)
    const base = 0.45 * reach + 0.40 * quality + 0.15 * consistency;
    const activity = Math.min(1, player.posts_count / 8);
    const rawScore = 0.85 * base + 0.15 * base * activity;
    magicianScore = Math.max(0, Math.min(100, rawScore));
  }

  return {
    ...player,
    magicianScore: Number(magicianScore.toFixed(1))
  };
}

/**
 * Returns the "best" role for a user.
 * Prioritizes Discord roles (if available) then falls back to Magician Tier.
 */
export function getBestRole(user: User): string {
  // If we have discrod_roles string, the first one is the best one (as per user request)
  if (user.discrod_roles) {
    // Split by comma, dash, or pipe, take first part and trim
    const roles = user.discrod_roles.split(/[,\-|]/).map(r => r.trim());
    if (roles.length > 0 && roles[0]) {
      return roles[0];
    }
  }

  const score = user.magicianScore ?? 0;
  const rarity = getRarityConfig(score, [], user.username);
  return rarity.tier;
}
