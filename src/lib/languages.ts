export const LANGUAGES = [
  "English",
  "Italian",
  "Spanish",
  "French",
  "German",
  "Portuguese",
  "Mandarin",
  "Cantonese",
  "Japanese",
  "Korean",
  "Arabic",
  "Hindi",
  "Punjabi",
  "Vietnamese",
  "Thai",
  "Greek",
  "Russian",
  "Polish",
  "Dutch",
  "Swedish",
  "Turkish",
  "Hebrew",
  "Indonesian",
  "Tagalog",
];

export const PROFICIENCY_LEVELS = ["Learning", "Conversational", "Fluent", "Native"] as const;
export type ProficiencyLevel = (typeof PROFICIENCY_LEVELS)[number];

export type UserLanguage = {
  language: string;
  proficiency: ProficiencyLevel;
};
