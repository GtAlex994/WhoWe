export const CATEGORIES = [
  "Food & Drink",
  "Movies & Shows",
  "Outdoors",
  "Games",
  "Music",
  "Sports",
  "Books & Learning",
  "Arts & Culture",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_COLORS: Record<string, string> = {
  "Food & Drink": "#bc4b2c",
  "Movies & Shows": "#6b4c9a",
  Outdoors: "#2f5d50",
  Games: "#2461a6",
  Music: "#a23e6b",
  Sports: "#b5892b",
  "Books & Learning": "#3e7c7b",
  "Arts & Culture": "#8e4585",
  Other: "#6b6459",
  Wild: "#c22b6b",
};

export function categoryColor(category: string) {
  return CATEGORY_COLORS[category as Category] ?? CATEGORY_COLORS.Other;
}
