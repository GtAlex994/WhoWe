import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { ProfileEditor } from "@/components/ProfileEditor";
import { HabitsForm } from "./habits-form";

export default async function EditHabitsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  return (
    <ProfileEditor
      title="Habits & Dietary"
      description="Private — only used to match you with compatible events and never shown on your profile. Choose 'Prefer not to say' for anything you'd rather skip."
    >
      <HabitsForm user={user} />
    </ProfileEditor>
  );
}
