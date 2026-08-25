// Legacy values — some accounts may still have one of these from before the
// avatar system was simplified to Avataaars-only. Kept only so old data still
// renders; the picker no longer offers them.
export type AvatarStyle = "avataaars" | "adventurer" | "pixel-art" | "color-initials";

export const AVATAR_GENDERS = [
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
  { id: "unicorn", label: "Unicorn" },
] as const;

export type AvatarGender = (typeof AVATAR_GENDERS)[number]["id"];

// Every hairstyle is available regardless of the identity gender selected —
// avatar customization is deliberately independent of gender, so this is a
// flat list, not split/gated by gender the way it used to be.
export const AVATAAARS_TOP: string[] = [
  "shortFlat",
  "shortRound",
  "shortWaved",
  "shortCurly",
  "sides",
  "theCaesar",
  "theCaesarAndSidePart",
  "shaggy",
  "shaggyMullet",
  "shavedSides",
  "bigHair",
  "bob",
  "bun",
  "curly",
  "curvy",
  "dreads",
  "dreads01",
  "dreads02",
  "frida",
  "frizzle",
  "fro",
  "froBand",
  "longButNotTooLong",
  "miaWallace",
  "straight01",
  "straight02",
  "straightAndStrand",
];

export const AVATAAARS_TOP_LABELS: Record<string, string> = {
  shortFlat: "Short & flat",
  shortRound: "Short & round",
  shortWaved: "Short & waved",
  shortCurly: "Short & curly",
  sides: "Buzzed sides",
  theCaesar: "Caesar cut",
  theCaesarAndSidePart: "Caesar (side part)",
  shaggy: "Shaggy",
  shaggyMullet: "Shaggy mullet",
  shavedSides: "Shaved sides",
  bigHair: "Big hair",
  bob: "Bob",
  bun: "Bun",
  curly: "Curly",
  curvy: "Curvy",
  dreads: "Dreads",
  dreads01: "Dreads (style 1)",
  dreads02: "Dreads (style 2)",
  frida: "Frida braid",
  frizzle: "Frizzy",
  fro: "Afro",
  froBand: "Afro with band",
  longButNotTooLong: "Medium length",
  miaWallace: "Bob with bangs",
  straight01: "Straight (style 1)",
  straight02: "Straight (style 2)",
  straightAndStrand: "Straight with strand",
};

export const AVATAAARS_FACIAL_HAIR = ["beardLight", "beardMajestic", "beardMedium", "moustacheFancy", "moustacheMagnum"];
export const AVATAAARS_FACIAL_HAIR_LABELS: Record<string, string> = {
  beardLight: "Light beard",
  beardMajestic: "Full beard",
  beardMedium: "Medium beard",
  moustacheFancy: "Fancy moustache",
  moustacheMagnum: "Moustache",
};

export const AVATAAARS_ACCESSORIES = ["eyepatch", "kurt", "prescription01", "prescription02", "round", "sunglasses", "wayfarers"];
export const AVATAAARS_ACCESSORIES_LABELS: Record<string, string> = {
  eyepatch: "Eyepatch",
  kurt: "Round tinted",
  prescription01: "Glasses (round)",
  prescription02: "Glasses (square)",
  round: "Round glasses",
  sunglasses: "Sunglasses",
  wayfarers: "Wayfarers",
};

export const AVATAAARS_CLOTHES = [
  "blazerAndShirt",
  "blazerAndSweater",
  "collarAndSweater",
  "graphicShirt",
  "hoodie",
  "overall",
  "shirtCrewNeck",
  "shirtScoopNeck",
  "shirtVNeck",
];
export const AVATAAARS_CLOTHES_LABELS: Record<string, string> = {
  blazerAndShirt: "Blazer & shirt",
  blazerAndSweater: "Blazer & sweater",
  collarAndSweater: "Collar & sweater",
  graphicShirt: "Graphic tee",
  hoodie: "Hoodie",
  overall: "Overalls",
  shirtCrewNeck: "Crew neck",
  shirtScoopNeck: "Scoop neck",
  shirtVNeck: "V-neck",
};

// Swatches straight from DiceBear's avataaars color schema.
export const AVATAAARS_HAIR_COLORS = ["#a55728", "#2c1b18", "#b58143", "#d6b370", "#724133", "#4a312c", "#f59797", "#ecdcbf", "#c93305", "#e8e1e1"];
export const AVATAAARS_SKIN_TONES = ["#614335", "#d08b5b", "#ae5d29", "#edb98a", "#ffdbb4", "#fd9841", "#f8d25c"];
export const AVATAAARS_CLOTHES_COLORS = [
  "#262e33",
  "#65c9ff",
  "#5199e4",
  "#25557c",
  "#e6e6e6",
  "#929598",
  "#3c4f5c",
  "#b1e2ff",
  "#a7ffc4",
  "#ffafb9",
  "#ffffb1",
  "#ff488e",
  "#ff5c5c",
  "#ffffff",
];

export type AvataaarsFeatures = {
  seed: string;
  top: string;
  hairColor: string;
  skinColor: string;
  /** "none" or one of AVATAAARS_FACIAL_HAIR */
  facialHair: string;
  /** "none" or one of AVATAAARS_ACCESSORIES */
  accessories: string;
  clothes: string;
  clothesColor: string;
};

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomAvataaarsFeatures(seed: string = Math.random().toString(36).substring(7)): AvataaarsFeatures {
  return {
    seed,
    top: pick(AVATAAARS_TOP),
    hairColor: pick(AVATAAARS_HAIR_COLORS),
    skinColor: pick(AVATAAARS_SKIN_TONES),
    facialHair: Math.random() < 0.35 ? pick(AVATAAARS_FACIAL_HAIR) : "none",
    accessories: Math.random() < 0.3 ? pick(AVATAAARS_ACCESSORIES) : "none",
    clothes: pick(AVATAAARS_CLOTHES),
    clothesColor: pick(AVATAAARS_CLOTHES_COLORS),
  };
}

export function buildAvataaarsUrl(features: AvataaarsFeatures): string {
  const stripHash = (hex: string) => hex.replace("#", "");
  const params = new URLSearchParams({
    seed: features.seed,
    scale: "80",
    top: features.top,
    hairColor: stripHash(features.hairColor),
    skinColor: stripHash(features.skinColor),
    // DiceBear's avataaars schema calls this query param "clothing", not
    // "clothes" — the internal field/type is still named `clothes`
    // throughout this app, only the wire param sent to the API differs.
    // Using the wrong key doesn't error, it's just silently ignored, which
    // is why picking a different clothing item never changed the preview.
    clothing: features.clothes,
    clothesColor: stripHash(features.clothesColor),
  });

  if (features.facialHair === "none") {
    params.set("facialHairProbability", "0");
  } else {
    params.set("facialHairProbability", "100");
    params.set("facialHair", features.facialHair);
    params.set("facialHairColor", stripHash(features.hairColor));
  }

  if (features.accessories === "none") {
    params.set("accessoriesProbability", "0");
  } else {
    params.set("accessoriesProbability", "100");
    params.set("accessories", features.accessories);
  }

  return `https://api.dicebear.com/9.x/avataaars/svg?${params.toString()}`;
}

/** Renders a legacy (pre-feature-picker) avatar — style is always "avataaars" for new accounts. */
export function getAvatarUrl(seed: string, style: Exclude<AvatarStyle, "color-initials"> = "avataaars"): string {
  const params = new URLSearchParams({ seed, scale: "80" });
  if (style === "avataaars") {
    params.set("top", AVATAAARS_TOP.join(","));
    params.set("facialHairProbability", "20");
  }
  return `https://api.dicebear.com/9.x/${style}/svg?${params.toString()}`;
}

type StoredAvatar = {
  style: string;
  seed: string;
  top?: string;
  hairColor?: string;
  skinColor?: string;
  facialHair?: string;
  accessories?: string;
  clothes?: string;
  clothesColor?: string;
};

/** Resolves a stored avatar (new feature-picker shape, or legacy random-seed shape) to an image URL. */
export function resolveAvatarSrc(avatar: StoredAvatar): string {
  if (avatar.top && avatar.hairColor && avatar.skinColor && avatar.clothes && avatar.clothesColor) {
    return buildAvataaarsUrl({
      seed: avatar.seed,
      top: avatar.top,
      hairColor: avatar.hairColor,
      skinColor: avatar.skinColor,
      facialHair: avatar.facialHair ?? "none",
      accessories: avatar.accessories ?? "none",
      clothes: avatar.clothes,
      clothesColor: avatar.clothesColor,
    });
  }
  return getAvatarUrl(avatar.seed, avatar.style as Exclude<AvatarStyle, "color-initials">);
}
