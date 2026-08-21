import Image from "next/image";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getUserByUsername } from "@/lib/users-server";
import { toPublicProfile } from "@/lib/users";
import { FadeIn } from "@/components/FadeIn";
import { resolveAvatarSrc } from "@/lib/avatars";
import { ColorInitialsAvatar } from "@/components/ColorInitialsAvatar";
import { ProfileActions } from "@/components/ProfileActions";
import { getBlockStatus } from "@/lib/moderation";
import { unblockUser } from "@/app/moderation-actions";
import { Button } from "@/components/Button";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}

interface PublicProfilePageProps {
  params: Promise<{ username: string }>;
}

// The public view of another member's profile. Unlike /profile (always the
// signed-in user's own, full-precision view), everything rendered here comes
// through toPublicProfile() — no exact location, no dislikes/social
// preferences/goals, no private `name` field.
export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { username } = await params;

  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/sign-in");

  if (currentUser.username === username) {
    redirect("/profile");
  }

  const targetUser = await getUserByUsername(username);
  if (!targetUser) notFound();

  const blockStatus = await getBlockStatus(currentUser.id, targetUser.id);
  if (blockStatus === "blockedByTarget") notFound();

  if (blockStatus === "blockedByViewer") {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">You&apos;ve blocked this member</h1>
        <p className="text-muted mt-2">Their profile, events, and messages are hidden from you.</p>
        <form action={unblockUser} className="mt-6 inline-block">
          <input type="hidden" name="targetUsername" value={targetUser.username ?? username} />
          <Button type="submit" variant="secondary">
            Unblock
          </Button>
        </form>
      </div>
    );
  }

  const profile = toPublicProfile(targetUser);

  return (
    <div className="w-full pb-20 lg:pb-0">
      <FadeIn>
        <div className="border-b-2 border-foreground">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-8">
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                {profile.avatar?.style === "color-initials" ? (
                  <ColorInitialsAvatar
                    initials={(profile.username ?? "?").charAt(0).toUpperCase()}
                    color={profile.avatar.seed}
                    className="h-24 w-24 text-3xl"
                  />
                ) : profile.avatar ? (
                  <Image
                    src={resolveAvatarSrc(profile.avatar, profile.gender)}
                    alt=""
                    width={96}
                    height={96}
                    unoptimized
                    className="h-24 w-24 rounded-full border-2 border-foreground"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-accent-soft text-accent border-2 border-foreground flex items-center justify-center text-3xl font-display font-semibold">
                    {(profile.username ?? "?").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <h1 className="text-3xl font-semibold tracking-tight">@{profile.username}</h1>
                  <ProfileActions targetUsername={profile.username ?? username} />
                </div>

                <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted">
                  {profile.locationLabel && <span>📍 {profile.locationLabel}</span>}
                </div>

                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
                  <span>Member since {formatDate(profile.createdAt)}</span>
                </div>

                {profile.bio && <p className="text-muted mt-3">{profile.bio}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-8">
              <div className="border-2 border-foreground rounded-md p-4 text-center shadow-[2px_2px_0_0_var(--foreground)]">
                <div className="text-2xl font-semibold">{profile.eventsAttended}</div>
                <div className="text-xs text-muted mt-1">Events joined</div>
              </div>
              <div className="border-2 border-foreground rounded-md p-4 text-center shadow-[2px_2px_0_0_var(--foreground)]">
                <div className="text-2xl font-semibold">{profile.eventsHosted}</div>
                <div className="text-xs text-muted mt-1">Events hosted</div>
              </div>
              <div className="border-2 border-foreground rounded-md p-4 text-center shadow-[2px_2px_0_0_var(--foreground)]">
                <div className="text-2xl font-semibold">
                  {profile.hostRatingAvg != null ? profile.hostRatingAvg.toFixed(1) : "—"}
                </div>
                <div className="text-xs text-muted mt-1">Host rating</div>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-8">
        {profile.interests.length > 0 && (
          <section>
            <h2 className="font-display text-lg font-semibold mb-4">❤️ Interests</h2>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <span key={interest} className="text-sm rounded-md border-2 border-foreground bg-primary text-primary-foreground px-3 py-1 shadow-[2px_2px_0_0_var(--foreground)]">
                  {interest}
                </span>
              ))}
            </div>
          </section>
        )}

        {profile.activities.length > 0 && (
          <section>
            <h2 className="font-display text-lg font-semibold mb-4">⚡ Up for</h2>
            <div className="flex flex-wrap gap-2">
              {profile.activities.map((activity) => (
                <span key={activity} className="text-sm rounded-md border-2 border-foreground px-3 py-1 shadow-[2px_2px_0_0_var(--foreground)]">
                  {activity}
                </span>
              ))}
            </div>
          </section>
        )}

        {profile.languages.length > 0 && (
          <section>
            <h2 className="font-display text-lg font-semibold mb-4">🗣️ Languages</h2>
            <div className="space-y-2 divide-y-2 divide-foreground">
              {profile.languages.map((lang, idx) => (
                <div key={`${lang.language}-${idx}`} className="flex items-center justify-between py-2">
                  <span className="text-sm">{lang.language}</span>
                  <span className="text-xs text-muted capitalize">{lang.proficiency}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
