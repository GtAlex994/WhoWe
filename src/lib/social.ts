export const GROUP_SIZES: string[] = ["2–3 people", "4–6 people", "7–10 people", "10+ people", "No preference"];
export const PLANNING_STYLES: string[] = ["Spontaneous", "Few days ahead", "Well planned", "No preference"];
export const ACTIVITY_VIBES: string[] = ["Relaxed", "Social", "Active", "Adventurous", "No preference"];
export const PERSONALITIES: string[] = ["Introvert", "Somewhere in-between", "Extrovert", "No preference"];

export const GOALS: string[] = [
  "Make new friends",
  "Find people with shared interests",
  "Join casual local plans",
  "Explore the city",
  "Try new activities",
  "Build a regular social circle",
  "Attend small-group events",
  "Host events",
  "Language exchange",
];

// Onboarding requires an explicit group size, so "No preference" (only sensible
// when editing later) is excluded from the required control.
export const REQUIRED_GROUP_SIZES = GROUP_SIZES.filter((size) => size !== "No preference");
