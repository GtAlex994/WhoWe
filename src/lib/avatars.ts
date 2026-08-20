export const AVATAR_STYLES = [
  { id: "avataaars", label: "Avataaars" },
  { id: "adventurer", label: "Adventurer" },
  { id: "pixel-art", label: "Pixel Art" },
  { id: "color-initials", label: "Initials" },
] as const;

export type AvatarStyle = (typeof AVATAR_STYLES)[number]["id"];

// Pre-vetted colors with guaranteed contrast against white initials text.
export const AVATAR_COLORS = [
  "#bc4b2c",
  "#2f5d50",
  "#2461a6",
  "#a23e6b",
  "#6b4c9a",
  "#3e7c7b",
  "#8e4585",
  "#b5892b",
];

export function getAvatarUrl(seed: string, style: Exclude<AvatarStyle, "color-initials"> = "avataaars"): string {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&scale=80`;
}
