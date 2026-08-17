import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export default async function EditProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  // Redirect to the basic editor
  redirect("/profile/edit/basic");
}
