"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateLanguages } from "@/app/profile-actions";
import { Button } from "@/components/Button";
import { X } from "lucide-react";

interface Language {
  language: string;
  proficiency: string;
}

interface LanguagesFormProps {
  languages: string[];
  proficiencies: readonly string[];
  defaultLanguages: Language[];
}

export function LanguagesForm({
  languages,
  proficiencies,
  defaultLanguages,
}: LanguagesFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [languagesList, setLanguagesList] = useState<Language[]>(defaultLanguages);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedProficiency, setSelectedProficiency] = useState<string>(proficiencies[0] as string);
  const [error, setError] = useState<string | null>(null);

  const usedLanguages = new Set(languagesList.map((l) => l.language));
  const availableLanguages = languages.filter((lang) => !usedLanguages.has(lang));

  const handleAddLanguage = () => {
    if (!selectedLanguage) {
      setError("Please select a language");
      return;
    }
    if (usedLanguages.has(selectedLanguage)) {
      setError("This language is already added");
      return;
    }
    setLanguagesList([
      ...languagesList,
      { language: selectedLanguage, proficiency: selectedProficiency },
    ]);
    setSelectedLanguage("");
    setSelectedProficiency(proficiencies[0] as string);
    setError(null);
  };

  const handleRemoveLanguage = (index: number) => {
    setLanguagesList(languagesList.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (languagesList.length === 0) {
      setError("Please add at least one language");
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("languages", JSON.stringify(languagesList));
        await updateLanguages(formData);
        router.push("/profile");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save languages");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Add new language section */}
      <div className="border-2 border-foreground rounded-md p-4">
        <h3 className="font-medium mb-4">Add a language</h3>
        <div className="flex flex-col gap-3">
          <div>
            <label htmlFor="language" className="text-sm font-medium block mb-2">
              Language
            </label>
            <select
              id="language"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none"
            >
              <option value="">Select a language</option>
              {availableLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="proficiency" className="text-sm font-medium block mb-2">
              Proficiency
            </label>
            <select
              id="proficiency"
              value={selectedProficiency}
              onChange={(e) => setSelectedProficiency(e.target.value)}
              className="w-full border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none"
            >
              {proficiencies.map((prof) => (
                <option key={prof} value={prof}>
                  {prof}
                </option>
              ))}
            </select>
          </div>

          <Button type="button" variant="secondary" onClick={handleAddLanguage} className="self-start">
            Add language
          </Button>
        </div>
      </div>

      {/* Languages list */}
      {languagesList.length > 0 && (
        <div className="border-2 border-foreground rounded-md p-4">
          <h3 className="font-medium mb-4">Your languages</h3>
          <div className="space-y-2">
            {languagesList.map((lang, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-surface rounded border-2 border-foreground"
              >
                <div>
                  <div className="font-medium text-sm">{lang.language}</div>
                  <div className="text-xs text-muted">{lang.proficiency}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveLanguage(index)}
                  className="text-muted hover:text-foreground transition-colors p-2"
                  aria-label={`Remove ${lang.language}`}
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {languagesList.length === 0 && (
        <p className="text-sm text-muted italic py-4">No languages added yet</p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-4 border-t-2 border-foreground">
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? "Saving..." : "Save languages"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
