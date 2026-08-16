import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/firebase-admin";
import { getCurrentUser } from "@/lib/session";
import { deleteAccount, signOut, updateNotificationPreference } from "@/app/actions";
import { FadeIn } from "@/components/FadeIn";
import { Button } from "@/components/Button";
import { LocationPermission } from "@/components/LocationPermission";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const [hostingCountSnap, attendingCountSnap] = await Promise.all([
    db.collection("events").where("creatorId", "==", user.id).count().get(),
    db.collectionGroup("attendees").where("userId", "==", user.id).count().get(),
  ]);
  const hostingCount = hostingCountSnap.data().count;
  const attendingCount = attendingCountSnap.data().count;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-10 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
      <div className="flex flex-col gap-10 max-w-xl">
        <FadeIn>
          <h1 className="text-4xl font-semibold tracking-tight">Settings</h1>
          <p className="text-muted mt-1.5">Manage your account and how WhoWe works for you.</p>
        </FadeIn>

        <FadeIn delay={0.06}>
          <h2 className="text-sm font-medium mb-3 uppercase tracking-wide text-muted">Account</h2>
          <div className="flex flex-col gap-3">
            <div>
              <div className="text-sm text-muted">Signed in as</div>
              <div className="font-medium">{user.email}</div>
            </div>
            <Link href="/profile/edit" className="text-sm text-primary hover:underline w-fit">
              Edit your profile →
            </Link>
            <form action={signOut} className="mt-1">
              <Button type="submit" variant="secondary">
                Switch user
              </Button>
            </form>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h2 className="text-sm font-medium mb-3 uppercase tracking-wide text-muted">Notifications</h2>
          <form action={updateNotificationPreference} className="flex flex-col gap-4 items-start">
            <label className="inline-flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                name="notifyEmail"
                defaultChecked={user.notifyEmail}
                className="peer sr-only"
              />
              <span className="w-11 h-6 shrink-0 rounded-full border-2 border-foreground bg-surface peer-checked:bg-primary transition-colors flex items-center px-0.5 justify-start peer-checked:justify-end">
                <span className="h-4 w-4 rounded-full bg-foreground" />
              </span>
              <span className="text-sm">
                Email reminders before events you&apos;re attending
              </span>
            </label>
            <p className="text-xs text-muted -mt-2">
              We don&apos;t have email delivery connected yet — this just saves your preference
              for when we do.
            </p>
            <Button type="submit" variant="secondary" className="text-sm">
              Save
            </Button>
          </form>
        </FadeIn>

        <FadeIn delay={0.14}>
          <h2 className="text-sm font-medium mb-3 uppercase tracking-wide text-muted">Location</h2>
          <LocationPermission initialLabel={user.locationLabel} />
        </FadeIn>

        <FadeIn delay={0.18} className="border-t-2 border-border pt-6">
          <h2 className="text-sm font-medium mb-1 text-[#8c2f2f]">Danger zone</h2>
          <p className="text-sm text-muted mb-3">
            Permanently delete your profile, hosted events, and RSVPs. This can&apos;t be
            undone.
          </p>
          <form action={deleteAccount}>
            <Button type="submit" variant="danger">
              Delete my account
            </Button>
          </form>
        </FadeIn>
      </div>

      <FadeIn delay={0.1} className="hidden lg:block">
        <div className="bg-surface border-2 border-foreground rounded-lg p-6 shadow-[3px_3px_0_0_var(--foreground)] sticky top-24">
          <div className="font-display text-lg font-semibold">Your activity</div>
          <div className="flex flex-col gap-3 mt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted">Hosting</span>
              <span className="text-2xl font-display font-semibold">{hostingCount}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted">Attending</span>
              <span className="text-2xl font-display font-semibold">{attendingCount}</span>
            </div>
          </div>
          <Link href="/profile" className="inline-block text-sm text-primary hover:underline mt-5">
            View full profile →
          </Link>
        </div>
      </FadeIn>
    </div>
  );
}
