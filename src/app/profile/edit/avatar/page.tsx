import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { ProfileEditor } from "@/components/ProfileEditor";
import { AvatarEditForm } from "./avatar-edit-form";

export default async function EditAvatarPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  return (
    <ProfileEditor title="My Avatar" description="Choose how you'd like to appear to other members.">
      <AvatarEditForm user={user} />
    </ProfileEditor>
  );
}
