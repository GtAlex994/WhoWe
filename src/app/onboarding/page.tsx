import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { completeOnboarding, skipOnboarding } from "@/app/actions";
import { CATEGORIES } from "@/lib/categories";
import { FadeIn } from "@/components/FadeIn";
import { Button } from "@/components/Button";
import { ChipMultiSelect } from "@/components/ChipMultiSelect";
import { LocationPermission } from "@/components/LocationPermission";

function suggestUsername(user: { username: string | null; email: string | null; name: string }) {
  if (user.username) return user.username;
  const base = (user.email?.split("@")[0] ?? user.name)
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
  return base || `user${Math.floor(1000 + Math.random() * 9000)}`;
}

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.onboardingCompletedAt) redirect("/profile");

  const suggestedUsername = suggestUsername(user);
  const currentInterests = user.interests ? user.interests.split(",") : [];
  const currentDislikes = user.dislikes ? user.dislikes.split(",") : [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 flex flex-col gap-10">
      <FadeIn className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">Set up your profile</h1>
          <p className="text-muted mt-1.5">
            Takes a minute, or skip it entirely and fill it in later.
          </p>
        </div>
        <form action={skipOnboarding}>
          <button type="submit" className="text-sm text-muted hover:text-foreground cursor-pointer shrink-0">
            Skip for now
          </button>
        </form>
      </FadeIn>

      <FadeIn delay={0.06}>
        <form action={completeOnboarding} className="flex flex-col gap-8">
          <div>
            <label className="text-sm font-medium block mb-1">Username</label>
            <input
              name="username"
              required
              defaultValue={suggestedUsername}
              pattern="[a-z0-9_]+"
              className="w-full border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none max-w-xs"
            />
            <p className="text-xs text-muted mt-1">Lowercase letters, numbers, and underscores only.</p>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">
              What are you into? <span className="text-muted font-normal">(pick a few)</span>
            </label>
            <ChipMultiSelect name="interests" options={CATEGORIES} defaultValue={currentInterests} />
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">
              Not really your thing? <span className="text-muted font-normal">(optional)</span>
            </label>
            <ChipMultiSelect name="dislikes" options={CATEGORIES} defaultValue={currentDislikes} />
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">
              Your location <span className="text-muted font-normal">(optional, helps show events near you)</span>
            </label>
            <LocationPermission initialLabel={user.locationLabel} />
          </div>

          <Button type="submit" variant="primary" className="self-start">
            Finish setup
          </Button>
        </form>
      </FadeIn>
    </div>
  );
}
