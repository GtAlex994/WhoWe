// Structured, private-by-default matching fields. Previously smoking/vaping/
// drinking existed only as freeform Lifestyle interest chips, which meant no
// personal-status-vs-tolerance distinction, no way to express a hard
// deal-breaker, and no dietary/allergy information at all.

export const SMOKING_STATUS: string[] = ["Never", "Occasionally", "Regularly", "Prefer not to say"];
export const SMOKING_TOLERANCE: string[] = [
  "Comfortable around smoking",
  "Outdoors only",
  "No preference",
  "Prefer smoke-free",
  "Not comfortable around smoking",
];

export const ALCOHOL_FREQUENCY: string[] = ["Never", "Occasionally", "Socially", "Regularly", "Prefer not to say"];
export const ALCOHOL_EVENT_PREFERENCE: string[] = [
  "Alcohol-free only",
  "Prefer alcohol-free",
  "No preference",
  "Comfortable where alcohol is present",
];

export const DIETARY_PATTERNS: string[] = [
  "No specific preference",
  "Vegetarian",
  "Vegan",
  "Pescatarian",
  "Halal",
  "Kosher",
  "Gluten-free",
  "Dairy-free",
  "Other",
];
