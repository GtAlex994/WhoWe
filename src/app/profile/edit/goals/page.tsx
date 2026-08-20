import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { ProfileEditor } from "@/components/ProfileEditor";
import { GOALS } from "@/lib/social";
import { GoalsForm } from "./goals-form";

export default async function EditGoalsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const currentGoals = Array.isArray(user.lookingFor) ? user.lookingFor : [];

  return (
    <ProfileEditor
      title="What I'm Looking For"
      description="Help others understand your goals. This helps connect you with like-minded people."
    >
      <GoalsForm goals={GOALS} defaultGoals={currentGoals} />
    </ProfileEditor>
  );
}
