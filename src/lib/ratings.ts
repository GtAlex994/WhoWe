import { getUsersByIds } from "@/lib/users-server";

export type RatingSummary = { avg: number; count: number };

export async function getHostRatings(creatorIds: string[]): Promise<Record<string, RatingSummary>> {
  const users = await getUsersByIds(creatorIds);

  const result: Record<string, RatingSummary> = {};
  for (const [id, user] of Object.entries(users)) {
    if (user.hostRatingCount > 0) {
      result[id] = { avg: user.hostRatingSum / user.hostRatingCount, count: user.hostRatingCount };
    }
  }
  return result;
}

export function summarizeRatings(scores: number[]): RatingSummary | null {
  if (scores.length === 0) return null;
  return { avg: scores.reduce((a, b) => a + b, 0) / scores.length, count: scores.length };
}
