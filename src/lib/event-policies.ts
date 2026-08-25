// Split out from events.ts so client components (event creation/edit forms)
// can import these constants without pulling in firebase-admin — events.ts
// imports the Firestore admin SDK at module scope, which breaks the browser
// bundle if any client component imports from it, even just for a constant.

// Standard-event-only (Wild events are always "open" — they match randomly
// nearby, gender restriction there would need changes to pickWildCandidates
// itself, out of scope here).
export const GENDER_POLICIES = ["open", "female-only", "male-only", "unicorn-only"] as const;
export type GenderPolicy = (typeof GENDER_POLICIES)[number];

export const GENDER_POLICY_LABELS: Record<GenderPolicy, string> = {
  open: "Open to everyone",
  "female-only": "Female-only",
  "male-only": "Male-only",
  "unicorn-only": "Unicorn-only",
};

export const GENDER_POLICY_REQUIRED_GENDER: Record<Exclude<GenderPolicy, "open">, string> = {
  "female-only": "female",
  "male-only": "male",
  "unicorn-only": "unicorn",
};
