import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { ProfileEditor } from "@/components/ProfileEditor";
import { BasicProfileForm } from "./basic-profile-form";

export default async function EditBasicPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  return (
    <ProfileEditor
      title="Basic Profile"
      description="Update your name, username, location, and bio. Your name is private—others see your username only."
    >
      <BasicProfileForm user={user} />
    </ProfileEditor>
  );
}
