import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { updateProfile } from "@/app/actions";
import { CATEGORIES } from "@/lib/categories";
import { FadeIn } from "@/components/FadeIn";
import { Button } from "@/components/Button";
import { ChipMultiSelect } from "@/components/ChipMultiSelect";

export default async function EditProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const currentInterests = user.interests ? user.interests.split(",") : [];
  const currentDislikes = user.dislikes ? user.dislikes.split(",") : [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 flex flex-col gap-8">
      <FadeIn>
        <h1 className="text-4xl font-semibold tracking-tight">Edit profile</h1>
        <p className="text-muted mt-1.5">
          This is what other people see when they visit your profile.
        </p>
      </FadeIn>

      <FadeIn delay={0.06}>
        <form action={updateProfile} className="flex flex-col gap-6">
          <div>
            <label className="text-sm font-medium block mb-1">Name</label>
            <input
              name="name"
              required
              defaultValue={user.name}
              className="w-full border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none max-w-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Username</label>
            <input
              name="username"
              required
              defaultValue={user.username ?? ""}
              pattern="[a-z0-9_]+"
              className="w-full border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none max-w-xs"
            />
            <p className="text-xs text-muted mt-1">Lowercase letters, numbers, and underscores only.</p>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Bio</label>
            <textarea
              name="bio"
              rows={3}
              defaultValue={user.bio ?? ""}
              placeholder="What are you into? What kind of events do you like joining?"
              className="w-full border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none resize-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">What are you into?</label>
            <ChipMultiSelect name="interests" options={CATEGORIES} defaultValue={currentInterests} />
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Not really your thing?</label>
            <ChipMultiSelect name="dislikes" options={CATEGORIES} defaultValue={currentDislikes} />
          </div>

          <Button type="submit" variant="primary" className="self-start">
            Save changes
          </Button>
        </form>
      </FadeIn>
    </div>
  );
}
