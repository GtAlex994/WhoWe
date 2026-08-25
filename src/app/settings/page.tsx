import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getUserEventStats } from "@/lib/events";
import { deleteAccount, signOut, updateNotificationPreference } from "@/app/actions";
import { updateTrustedContact, removeTrustedContact } from "@/app/profile-actions";
import { FadeIn } from "@/components/FadeIn";
import { Button } from "@/components/Button";
import { LocationPermission } from "@/components/LocationPermission";

const PRINCIPLES = [
  {
    title: "Always meet in public places",
    body: "Every event on WhoWe should be held somewhere public and populated: a restaurant, cafe, park, or venue. Never a private home on a first meetup.",
  },
  {
    title: "Trust your instincts",
    body: "If something about an event or a person feels off, don't go. You can back out of an event you've joined at any time.",
  },
  {
    title: "Tell someone your plans",
    body: "Before heading to a meetup with people you haven't met before, let a friend or family member know where you're going and with whom.",
  },
  {
    title: "Reliability over reviews",
    body: "Instead of open-ended public reviews of people, which can be misused to harass, we're building a simple reliability signal based on whether people show up to what they join.",
  },
];

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const stats = await getUserEventStats(user.id);

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
              We don&apos;t have email delivery connected yet. This just saves your preference
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

        <FadeIn delay={0.18}>
          <h2 className="text-sm font-medium mb-3 uppercase tracking-wide text-muted">Safety</h2>
          <p className="text-muted text-sm mb-4">
            Meeting new people is the whole point. Here&apos;s how we try to make that
            feel safe.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PRINCIPLES.map((p) => (
              <div
                key={p.title}
                className="bg-surface border-2 border-foreground rounded-lg px-4 py-3.5 shadow-[3px_3px_0_0_var(--foreground)]"
              >
                <div className="font-display text-base font-semibold">{p.title}</div>
                <p className="text-sm text-muted mt-1.5 leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted mt-3">
            WhoWe is an early prototype. Identity verification isn&apos;t live yet. Treat
            every meetup with the same caution you&apos;d use meeting anyone new online.
          </p>
          <Link href="/profile/blocked" className="text-sm text-primary hover:underline mt-3 inline-block">
            Manage blocked members →
          </Link>
        </FadeIn>

        <FadeIn delay={0.2}>
          <h2 className="text-sm font-medium mb-1 uppercase tracking-wide text-muted">Trusted contact</h2>
          <p className="text-muted text-sm mb-4">
            Optional, private — never available to hosts, never used for marketing. Only used if you enable
            per-event check-in/missed-check-out notifications, or if you trigger &quot;I need help&quot; in Safety
            Mode.
          </p>
          {user.trustedContact ? (
            <div className="border-2 border-foreground rounded-md p-4 mb-4 max-w-sm">
              <p className="text-sm font-medium">{user.trustedContact.name}</p>
              <p className="text-sm text-muted">{user.trustedContact.email}</p>
              {user.trustedContact.relationship && (
                <p className="text-xs text-muted mt-1">{user.trustedContact.relationship}</p>
              )}
              <form action={removeTrustedContact} className="mt-3">
                <Button type="submit" variant="secondary" className="text-xs px-3 py-1.5">
                  Remove
                </Button>
              </form>
            </div>
          ) : (
            <p className="text-sm text-muted mb-4">No trusted contact set.</p>
          )}
          <form action={updateTrustedContact} className="flex flex-col gap-3 max-w-sm">
            <input
              name="name"
              placeholder="Name"
              defaultValue={user.trustedContact?.name ?? ""}
              required
              className="border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none text-sm"
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              defaultValue={user.trustedContact?.email ?? ""}
              required
              className="border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none text-sm"
            />
            <input
              name="relationship"
              placeholder="Relationship (optional)"
              defaultValue={user.trustedContact?.relationship ?? ""}
              className="border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none text-sm"
            />
            <Button type="submit" variant="secondary" className="text-sm w-fit">
              {user.trustedContact ? "Update" : "Save"} trusted contact
            </Button>
          </form>
        </FadeIn>

        <FadeIn delay={0.22} className="border-t-2 border-border pt-6">
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
              <span className="text-2xl font-display font-semibold">{stats.eventsHosted}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted">Attending</span>
              <span className="text-2xl font-display font-semibold">{stats.eventsJoined}</span>
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
