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

  const currentInterests = Array.isArray(user.interests) ? user.interests : [];
  const currentDislikes = user.dislikes ? (typeof user.dislikes === "string" ? user.dislikes.split(",") : user.dislikes) : [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 flex flex-col gap-8">
      <FadeIn>
        <h1 className="text-4xl font-semibold tracking-tight">Edit profile</h1>
        <p className="text-muted mt-1.5">
          Your name is private. Other users will only see your username.
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
            <div className="flex items-center gap-2 max-w-xs">
              <input
                type="text"
                disabled
                defaultValue={user.username ?? ""}
                className="flex-1 border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none opacity-60 cursor-not-allowed"
              />
              <span className="text-xl">@</span>
            </div>
            <p className="text-xs text-muted mt-1">Cannot be changed after setup. Choose wisely!</p>
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
