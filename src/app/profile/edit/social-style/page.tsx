import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { ProfileEditor } from "@/components/ProfileEditor";
import { SocialStyleForm } from "./social-style-form";

const GROUP_SIZES = ["2–3 people", "4–6 people", "7–10 people", "10+ people", "No preference"];
const PLANNING_STYLES = ["Spontaneous", "Few days ahead", "Well planned", "No preference"];
const ACTIVITY_VIBES = ["Relaxed", "Social", "Active", "Adventurous", "No preference"];
const PERSONALITIES = ["Introvert", "Somewhere in-between", "Extrovert", "No preference"];

export default async function EditSocialStylePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  return (
    <ProfileEditor
      title="My Social Style"
      description="Help others understand how you like to spend time together. This improves event recommendations."
    >
      <SocialStyleForm
        user={user}
        groupSizes={GROUP_SIZES}
        planningStyles={PLANNING_STYLES}
        activityVibes={ACTIVITY_VIBES}
        personalities={PERSONALITIES}
      />
    </ProfileEditor>
  );
}
