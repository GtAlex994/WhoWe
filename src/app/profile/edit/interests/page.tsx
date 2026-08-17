import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { CATEGORIES } from "@/lib/categories";
import { updateInterests } from "@/app/profile-actions";
import { ProfileEditor } from "@/components/ProfileEditor";
import { InterestsForm } from "./interests-form";

export default async function EditInterestsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const currentInterests = Array.isArray(user.interests) ? user.interests : [];
  const currentDislikes = Array.isArray(user.dislikes)
    ? user.dislikes
    : user.dislikes
      ? String(user.dislikes).split(",").map((s) => s.trim())
      : [];

  return (
    <ProfileEditor
      title="My Interests"
      description="Help us understand what you enjoy. This helps match you with people who share similar interests."
    >
      <InterestsForm
        categories={CATEGORIES as unknown as string[]}
        defaultInterests={currentInterests}
        defaultDislikes={currentDislikes}
      />
    </ProfileEditor>
  );
}
