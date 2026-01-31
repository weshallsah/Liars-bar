/**
 * Utility functions for formatting display values
 *
 * Pure functions with no side effects
 */

/**
 * Shorten a Solana address for display
 * @example shortenAddress("7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU") // "7xKX...gAsU"
 */
export function shortenAddress(address: string, chars = 4): string {
  if (!address || address.length < chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Format SOL balance with specified decimals
 * @example formatBalance(1.23456, 2) // "1.23"
 */
export function formatBalance(balance: number | null, decimals = 2): string {
  if (balance === null || isNaN(balance)) return "0.00";
  return balance.toFixed(decimals);
}

/**
 * Format table ID for display
 * @example formatTableId("12345678abcdefgh") // "1234-5678"
 */
export function formatTableId(tableId: string, segments = 2, segmentLength = 4): string {
  if (!tableId) return "";

  const formatted: string[] = [];
  for (let i = 0; i < segments; i++) {
    const start = i * segmentLength;
    const segment = tableId.slice(start, start + segmentLength);
    if (segment) formatted.push(segment.toUpperCase());
  }

  return formatted.join("-");
}

/**
 * Format a timestamp to relative time
 * @example formatRelativeTime(Date.now() - 60000) // "1 minute ago"
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return "Just now";
}

/**
 * Pluralize a word based on count
 * @example pluralize(1, "player") // "player"
 * @example pluralize(2, "player") // "players"
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return singular;
  return plural || `${singular}s`;
}
