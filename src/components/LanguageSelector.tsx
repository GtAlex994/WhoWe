"use client";

import { useState } from "react";
import { LANGUAGES, PROFICIENCY_LEVELS, type UserLanguage, type ProficiencyLevel } from "@/lib/languages";

type PendingLanguage = { language: string; proficiency: ProficiencyLevel | null };

type LanguageSelectorProps = {
  defaultLanguages?: UserLanguage[];
  /** Called with only the languages that have an explicitly-chosen proficiency. */
  onSelect?: (languages: UserLanguage[]) => void;
};

export function LanguageSelector({ defaultLanguages = [], onSelect }: LanguageSelectorProps) {
  const [languages, setLanguages] = useState<PendingLanguage[]>(defaultLanguages);
  const [search, setSearch] = useState("");

  const availableLanguages = LANGUAGES.filter(
    (lang) => !languages.some((l) => l.language === lang) && lang.toLowerCase().includes(search.toLowerCase()),
  );

  const emit = (next: PendingLanguage[]) => {
    setLanguages(next);
    onSelect?.(next.filter((l): l is UserLanguage => l.proficiency !== null));
  };

  const addLanguage = (language: string) => {
    // No silent default — the user must explicitly pick a proficiency below.
    emit([...languages, { language, proficiency: null }]);
    setSearch("");
  };

  const removeLanguage = (language: string) => {
    emit(languages.filter((l) => l.language !== language));
  };

  const updateProficiency = (language: string, proficiency: ProficiencyLevel) => {
    emit(languages.map((l) => (l.language === language ? { ...l, proficiency } : l)));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Add a language</label>
        <input
          type="text"
          placeholder="Search languages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none text-sm"
        />

        {search && availableLanguages.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {availableLanguages.slice(0, 5).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => addLanguage(lang)}
                className="px-3 py-1 text-sm rounded-md border-2 border-foreground bg-surface shadow-[2px_2px_0_0_var(--foreground)] hover:bg-surface-muted hover:shadow-[3px_3px_0_0_var(--foreground)] hover:-translate-x-px hover:-translate-y-px transition-all"
              >
                + {lang}
              </button>
            ))}
          </div>
        )}
      </div>

      {languages.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium">Your languages ({languages.length})</p>
          {languages.map((lang) => (
            <div key={lang.language} className="flex flex-col gap-2 p-3 rounded-lg border-2 border-foreground shadow-[2px_2px_0_0_var(--foreground)]">
              <div className="flex items-center justify-between">
                <p className="font-medium">{lang.language}</p>
                <button
                  type="button"
                  onClick={() => removeLanguage(lang.language)}
                  className="text-xs text-[#8c2f2f] hover:text-foreground font-medium"
                >
                  Remove
                </button>
              </div>
              {lang.proficiency === null && (
                <p className="text-xs text-[#8c2f2f]">Choose how comfortable you are with this language</p>
              )}
              <div className="flex flex-wrap gap-2" role="group" aria-label={`Proficiency in ${lang.language}`}>
                {PROFICIENCY_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    aria-pressed={lang.proficiency === level}
                    onClick={() => updateProficiency(lang.language, level)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-md border-2 border-foreground text-foreground transition-all ${
                      lang.proficiency === level
                        ? "bg-primary text-primary-foreground shadow-[1px_1px_0_0_var(--foreground)] translate-x-[1px] translate-y-[1px]"
                        : "bg-surface shadow-[2px_2px_0_0_var(--foreground)] hover:shadow-[3px_3px_0_0_var(--foreground)] hover:-translate-x-px hover:-translate-y-px"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <input
        type="hidden"
        name="languages"
        value={JSON.stringify(languages.filter((l) => l.proficiency !== null))}
      />
    </div>
  );
}
