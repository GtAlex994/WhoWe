"use client";

import { useState } from "react";
import { LANGUAGES, PROFICIENCY_LEVELS, type UserLanguage } from "@/lib/languages";

type LanguageSelectorProps = {
  defaultLanguages?: UserLanguage[];
  onSelect?: (languages: UserLanguage[]) => void;
};

export function LanguageSelector({ defaultLanguages = [], onSelect }: LanguageSelectorProps) {
  const [languages, setLanguages] = useState<UserLanguage[]>(defaultLanguages);
  const [search, setSearch] = useState("");

  const availableLanguages = LANGUAGES.filter(
    (lang) => !languages.some((l) => l.language === lang) && lang.toLowerCase().includes(search.toLowerCase()),
  );

  const addLanguage = (language: string) => {
    const newLanguages = [...languages, { language, proficiency: "Conversational" as const }];
    setLanguages(newLanguages);
    onSelect?.(newLanguages);
    setSearch("");
  };

  const removeLanguage = (language: string) => {
    const newLanguages = languages.filter((l) => l.language !== language);
    setLanguages(newLanguages);
    onSelect?.(newLanguages);
  };

  const updateProficiency = (language: string, proficiency: (typeof PROFICIENCY_LEVELS)[number]) => {
    const newLanguages = languages.map((l) => (l.language === language ? { ...l, proficiency } : l));
    setLanguages(newLanguages);
    onSelect?.(newLanguages);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Add a language</label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search languages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none text-sm"
          />
        </div>

        {search && availableLanguages.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {availableLanguages.slice(0, 5).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => addLanguage(lang)}
                className="px-3 py-1 text-sm rounded-full border-2 border-foreground bg-surface hover:bg-surface-muted"
              >
                + {lang}
              </button>
            ))}
          </div>
        )}
      </div>

      {languages.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium">Your languages</p>
          {languages.map((lang) => (
            <div key={lang.language} className="flex items-center gap-3 p-3 rounded-lg border-2 border-foreground/20">
              <div className="flex-1">
                <p className="font-medium">{lang.language}</p>
              </div>
              <select
                value={lang.proficiency}
                onChange={(e) => updateProficiency(lang.language, e.target.value as (typeof PROFICIENCY_LEVELS)[number])}
                className="text-sm border-2 border-foreground rounded px-2 py-1 bg-surface outline-none"
              >
                {PROFICIENCY_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeLanguage(lang.language)}
                className="text-sm text-[#8c2f2f] hover:text-foreground font-medium"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <input type="hidden" name="languages" value={JSON.stringify(languages)} />
    </div>
  );
}
