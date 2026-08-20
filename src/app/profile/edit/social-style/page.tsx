import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { ProfileEditor } from "@/components/ProfileEditor";
import { GROUP_SIZES, PLANNING_STYLES, ACTIVITY_VIBES, PERSONALITIES } from "@/lib/social";
import { SocialStyleForm } from "./social-style-form";

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
