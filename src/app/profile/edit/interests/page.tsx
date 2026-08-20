import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { INTEREST_CATEGORIES } from "@/lib/interests";
import { ProfileEditor } from "@/components/ProfileEditor";
import { InterestsForm } from "./interests-form";

export default async function EditInterestsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const currentInterests = Array.isArray(user.interests) ? user.interests : [];
  const currentDislikes = Array.isArray(user.dislikes) ? user.dislikes : [];

  return (
    <ProfileEditor
      title="My Interests"
      description="Help us understand what you enjoy. This helps match you with people who share similar interests."
    >
      <InterestsForm
        categories={INTEREST_CATEGORIES}
        defaultInterests={currentInterests}
        defaultDislikes={currentDislikes}
      />
    </ProfileEditor>
  );
}
