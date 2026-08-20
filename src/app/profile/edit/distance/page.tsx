import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { ProfileEditor } from "@/components/ProfileEditor";
import { DistanceForm } from "./distance-form";

export default async function EditDistancePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  return (
    <ProfileEditor
      title="Search radius"
      description="How far you're willing to travel for events. This only affects which events you see — it's never shown on your profile."
    >
      <DistanceForm defaultMaxDistance={user.matchingPreferences.maxDistance ?? 50} />
    </ProfileEditor>
  );
}
