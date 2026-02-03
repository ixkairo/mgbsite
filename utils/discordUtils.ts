/**
 * Extracts Discord user ID from input string.
 * Supports formats: <@123>, <@!123>, or plain username
 * @param input - Discord mention or username string
 * @returns Discord user ID if found, null otherwise
 */
export function extractDiscordUserId(input: string): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  // Try to match Discord mention format: <@123> or <@!123>
  const mentionMatch = input.match(/<@!?(\d+)>/);
  if (mentionMatch) {
    return mentionMatch[1];
  }

  // If no mention format found, treat as username (for future mapping)
  // For now, return null to indicate it needs to be looked up by username
  return null;
}

/**
 * Normalizes Discord username input (removes @ prefix if present)
 */
export function normalizeDiscordUsername(input: string): string {
  return input.trim().replace(/^@/, '');
}
