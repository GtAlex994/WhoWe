// Client-safe: no firebase-admin import here, since this is imported directly
// by client components (unlike src/lib/chat.ts, which is server-only).
export const REACTION_EMOJI = ["👍", "👎", "❤️", "😂", "😮"] as const;

export type ReactionSummary = { emoji: string; count: number; mine: boolean };
