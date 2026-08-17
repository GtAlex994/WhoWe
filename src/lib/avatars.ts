export const AVATAR_STYLES = [
  { id: "avataaars", label: "Avataaars" },
  { id: "adventurer", label: "Adventurer" },
  { id: "pixel-art", label: "Pixel Art" },
  { id: "initials", label: "Initials" },
] as const;

export type AvatarStyle = (typeof AVATAR_STYLES)[number]["id"];

export function getAvatarUrl(seed: string, style: AvatarStyle = "avataaars"): string {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&scale=80`;
}
