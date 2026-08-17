import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { signOut } from "@/app/actions";
import { FadeIn } from "@/components/FadeIn";
import { Button } from "@/components/Button";
import { calculateProfileCompletion } from "@/lib/users";

function formatDate(date: Date | null): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}

function calculateAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

interface ProfilePageProps {
  params: Promise<{ username?: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const resolvedParams = await params;
  const isOtherUserProfile = !!resolvedParams?.username;

  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/sign-in");

  // For now, show own profile. Later can fetch other user by username
  const user = currentUser;
  const isOwnProfile = true;

  const profileCompletion = calculateProfileCompletion(user);
  const age = calculateAge(user.dateOfBirth);

  return (
    <div className="w-full pb-20 lg:pb-0">
      {/* Profile Header */}
      <FadeIn>
        <div className="border-b-2 border-foreground">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-8">
            {/* Avatar and Header */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="h-24 w-24 rounded-full bg-accent-soft text-accent border-2 border-foreground flex items-center justify-center text-3xl font-display font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-semibold tracking-tight">{user.name}</h1>
                    {user.username && <p className="text-muted text-sm mt-0.5">@{user.username}</p>}
                  </div>
                  {isOwnProfile && (
                    <Link href="/profile/edit" className="text-sm text-primary underline hover:text-primary/80">
                      Edit
                    </Link>
                  )}
                </div>

                {/* Location and age */}
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted">
                  {user.locationLabel && (
                    <span>📍 {user.locationLabel}</span>
                  )}
                  {age && <span>· {age} years old</span>}
                </div>

                {/* Verification badges */}
                <div className="mt-3 flex flex-wrap gap-3 text-xs">
                  {user.emailVerifiedAt && (
                    <span className="flex items-center gap-1">
                      <span>✓</span> Email verified
                    </span>
                  )}
                  <span className="text-muted">Member since {formatDate(user.createdAt)}</span>
                </div>

                {/* Bio */}
                {user.bio ? (
                  <p className="text-muted mt-3">{user.bio}</p>
                ) : isOwnProfile ? (
                  <p className="text-muted mt-3 text-sm italic">
                    No bio yet.{" "}
                    <Link href="/profile/edit" className="text-primary underline">
                      Add bio
                    </Link>
                  </p>
                ) : null}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mt-8">
              <div className="border-2 border-foreground rounded-md p-4 text-center">
                <div className="text-2xl font-semibold">{user.eventsAttended}</div>
                <div className="text-xs text-muted mt-1">Events joined</div>
              </div>
              <div className="border-2 border-foreground rounded-md p-4 text-center">
                <div className="text-2xl font-semibold">{user.eventsHosted}</div>
                <div className="text-xs text-muted mt-1">Events hosted</div>
              </div>
              <div className="border-2 border-foreground rounded-md p-4 text-center">
                <div className="text-2xl font-semibold">—</div>
                <div className="text-xs text-muted mt-1">Would meet again</div>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Profile Completion */}
      {isOwnProfile && (
        <FadeIn delay={0.05}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-8 border-b-2 border-foreground">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-20 w-20 rounded-full border-4 border-primary">
                  <div className="text-center">
                    <div className="text-xl font-bold">{profileCompletion}%</div>
                    <div className="text-xs text-muted mt-0.5">complete</div>
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <h2 className="font-semibold">Your profile · {profileCompletion}% complete</h2>
                {profileCompletion === 100 ? (
                  <p className="text-sm text-muted mt-1">✓ Profile complete</p>
                ) : (
                  <>
                    <p className="text-sm text-muted mt-1">
                      Add your availability and social style to get better matches.
                    </p>
                    <Link
                      href="/profile/edit"
                      className="text-sm text-primary font-medium mt-3 inline-block underline hover:text-primary/80"
                    >
                      Complete profile →
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </FadeIn>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-8">
        {/* My Interests */}
        <FadeIn delay={0.1}>
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">❤️ My interests</h2>
              {isOwnProfile && (
                <Link href="/profile/edit" className="text-sm text-primary underline hover:text-primary/80">
                  Edit
                </Link>
              )}
            </div>

            {user.interests && Array.isArray(user.interests) && user.interests.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {user.interests.slice(0, 6).map((interest: string) => (
                  <span
                    key={interest}
                    className="text-sm rounded-full border-2 border-foreground bg-primary text-primary-foreground px-3 py-1"
                  >
                    {interest}
                  </span>
                ))}
                {user.interests.length > 6 && (
                  <button className="text-sm rounded-full border-2 border-foreground px-3 py-1 text-muted hover:text-foreground">
                    +{user.interests.length - 6} more
                  </button>
                )}
              </div>
            ) : isOwnProfile ? (
              <div className="border-2 border-foreground rounded-md p-4 text-center">
                <p className="text-sm text-muted mb-3">Tell us what you're into to improve your matches.</p>
                <Link href="/profile/edit" className="text-sm text-primary underline">
                  Add interests
                </Link>
              </div>
            ) : null}
          </section>
        </FadeIn>

        {/* I'm Up For */}
        <FadeIn delay={0.12}>
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">⚡ I'm up for</h2>
              {isOwnProfile && (
                <Link href="/profile/edit" className="text-sm text-primary underline hover:text-primary/80">
                  Edit
                </Link>
              )}
            </div>

            {user.activities && Array.isArray(user.activities) && user.activities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {user.activities.slice(0, 5).map((activity: string) => (
                  <span
                    key={activity}
                    className="text-sm rounded-full border-2 border-foreground px-3 py-1"
                  >
                    {activity}
                  </span>
                ))}
                {user.activities.length > 5 && (
                  <button className="text-sm rounded-full border-2 border-foreground px-3 py-1 text-muted hover:text-foreground">
                    +{user.activities.length - 5} more
                  </button>
                )}
              </div>
            ) : isOwnProfile ? (
              <div className="border-2 border-foreground rounded-md p-4 text-center">
                <p className="text-sm text-muted mb-3">What would you actually like to do with other people?</p>
                <Link href="/profile/edit" className="text-sm text-primary underline">
                  Add activities
                </Link>
              </div>
            ) : null}
          </section>
        </FadeIn>

        {/* Languages */}
        <FadeIn delay={0.14}>
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">🗣️ Languages</h2>
              {isOwnProfile && (
                <Link href="/profile/edit" className="text-sm text-primary underline hover:text-primary/80">
                  Edit
                </Link>
              )}
            </div>

            {user.languages && Array.isArray(user.languages) && user.languages.length > 0 ? (
              <div className="space-y-2 divide-y-2 divide-foreground">
                {user.languages.map((lang: any, idx: number) => (
                  <div key={`${lang.language}-${idx}`} className="flex items-center justify-between py-2">
                    <span className="text-sm">{lang.language}</span>
                    <span className="text-xs text-muted capitalize">{lang.proficiency}</span>
                  </div>
                ))}
              </div>
            ) : isOwnProfile ? (
              <div className="border-2 border-foreground rounded-md p-4 text-center">
                <p className="text-sm text-muted mb-3">Add the languages you speak.</p>
                <Link href="/profile/edit" className="text-sm text-primary underline">
                  Add language
                </Link>
              </div>
            ) : null}
          </section>
        </FadeIn>

        {/* My Social Style */}
        <FadeIn delay={0.16}>
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">👥 My social style</h2>
              {isOwnProfile && (
                <Link href="/profile/edit" className="text-sm text-primary underline hover:text-primary/80">
                  Edit
                </Link>
              )}
            </div>

            {user.socialStyle && (user.socialStyle.personality || user.socialStyle.groupSize || user.socialStyle.pace || user.socialStyle.planning) ? (
              <div className="border-2 border-foreground rounded-md p-4 space-y-3">
                {user.socialStyle.groupSize && (
                  <div className="flex items-center justify-between pb-3 border-b-2 border-foreground last:border-0 last:pb-0">
                    <span className="text-sm text-muted">Group size</span>
                    <span className="text-sm capitalize">{user.socialStyle.groupSize} people</span>
                  </div>
                )}
                {user.socialStyle.planning && (
                  <div className="flex items-center justify-between pb-3 border-b-2 border-foreground last:border-0 last:pb-0">
                    <span className="text-sm text-muted">Planning style</span>
                    <span className="text-sm capitalize">{user.socialStyle.planning}</span>
                  </div>
                )}
                {user.socialStyle.pace && (
                  <div className="flex items-center justify-between pb-3 border-b-2 border-foreground last:border-0 last:pb-0">
                    <span className="text-sm text-muted">Activity vibe</span>
                    <span className="text-sm capitalize">{user.socialStyle.pace}</span>
                  </div>
                )}
                {user.socialStyle.personality && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">Personality</span>
                    <span className="text-sm capitalize">{user.socialStyle.personality}</span>
                  </div>
                )}
              </div>
            ) : isOwnProfile ? (
              <div className="border-2 border-foreground rounded-md p-4 text-center">
                <p className="text-sm text-muted mb-3">Tell us how you like to socialise.</p>
                <Link href="/profile/edit" className="text-sm text-primary underline">
                  Set preferences
                </Link>
              </div>
            ) : null}
          </section>
        </FadeIn>

        {/* What I'm Looking For */}
        <FadeIn delay={0.18}>
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">🔎 What I'm looking for</h2>
              {isOwnProfile && (
                <Link href="/profile/edit" className="text-sm text-primary underline hover:text-primary/80">
                  Edit
                </Link>
              )}
            </div>

            {user.lookingFor && Array.isArray(user.lookingFor) && user.lookingFor.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {user.lookingFor.map((item: string) => (
                  <span key={item} className="text-sm rounded-full border-2 border-foreground bg-surface px-3 py-1">
                    {item}
                  </span>
                ))}
              </div>
            ) : isOwnProfile ? (
              <div className="border-2 border-foreground rounded-md p-4 text-center">
                <p className="text-sm text-muted mb-3">Help others understand what you're looking for.</p>
                <Link href="/profile/edit" className="text-sm text-primary underline">
                  Set goals
                </Link>
              </div>
            ) : null}
          </section>
        </FadeIn>

        {/* WhoWe Activity */}
        <FadeIn delay={0.2}>
          <section className="mb-8 border-t-2 border-foreground pt-8">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">🛡️ WhoWe activity</h2>
            <div className="border-2 border-foreground rounded-md p-4 space-y-3">
              {user.emailVerifiedAt && (
                <div className="flex items-center justify-between pb-3 border-b-2 border-foreground">
                  <span className="text-sm">✓ Email verified</span>
                  <span className="text-xs text-muted">Yes</span>
                </div>
              )}
              <div className="flex items-center justify-between pb-3 border-b-2 border-foreground">
                <span className="text-sm">Phone verified</span>
                <span className="text-xs text-muted">No</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b-2 border-foreground">
                <span className="text-sm">Events attended</span>
                <span className="text-sm font-medium">{user.eventsAttended}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b-2 border-foreground">
                <span className="text-sm">Events hosted</span>
                <span className="text-sm font-medium">{user.eventsHosted}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Would meet again</span>
                <span className="text-sm font-medium">—</span>
              </div>
            </div>
          </section>
        </FadeIn>

        {/* Account & Settings */}
        {isOwnProfile && (
          <FadeIn delay={0.22}>
            <section className="mb-8 border-t-2 border-foreground pt-8">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">⚙️ Account & settings</h2>
              <div className="border-2 border-foreground rounded-md p-4 space-y-2">
                <Link href="/profile/edit" className="block py-2 text-sm hover:text-primary transition-colors">
                  Edit profile →
                </Link>
                <Link href="/settings" className="block py-2 text-sm border-t-2 border-foreground hover:text-primary transition-colors">
                  Settings →
                </Link>
              </div>

              {/* Log Out */}
              <form action={signOut} className="mt-6">
                <Button
                  type="submit"
                  variant="secondary"
                  className="w-full flex items-center justify-center gap-2 text-red-600 hover:text-red-700"
                >
                  <LogOut size={16} />
                  Log out
                </Button>
              </form>
            </section>
          </FadeIn>
        )}
      </div>
    </div>
  );
}
