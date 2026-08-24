import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { ProfileEditor } from "@/components/ProfileEditor";
import { PhoneForm } from "./phone-form";

export default async function EditPhonePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  return (
    <ProfileEditor
      title="Phone verification"
      description="Verifying your phone number adds a trust badge to your profile."
    >
      <PhoneForm currentPhone={user.phone} verified={!!user.phoneVerifiedAt} />
    </ProfileEditor>
  );
}
