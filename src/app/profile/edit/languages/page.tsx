import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { LANGUAGES, PROFICIENCY_LEVELS } from "@/lib/languages";
import { ProfileEditor } from "@/components/ProfileEditor";
import { LanguagesForm } from "./languages-form";

export default async function EditLanguagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const currentLanguages = Array.isArray(user.languages) ? user.languages : [];

  return (
    <ProfileEditor
      title="Languages"
      description="Let others know what languages you speak and your proficiency level."
    >
      <LanguagesForm
        languages={LANGUAGES}
        proficiencies={PROFICIENCY_LEVELS}
        defaultLanguages={currentLanguages}
      />
    </ProfileEditor>
  );
}
