import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { ACTIVITIES } from "@/lib/interests";
import { ProfileEditor } from "@/components/ProfileEditor";
import { ActivitiesForm } from "./activities-form";

export default async function EditActivitiesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const currentActivities = Array.isArray(user.activities) ? user.activities : [];

  return (
    <ProfileEditor
      title="I'm Up For"
      description="What would you actually like to do with other people? Select activities you'd genuinely join."
    >
      <ActivitiesForm activities={ACTIVITIES} defaultActivities={currentActivities} />
    </ProfileEditor>
  );
}
