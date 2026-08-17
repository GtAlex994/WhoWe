import Link from "next/link";
import { redirect } from "next/navigation";
import { Settings, LogOut } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { signOut } from "@/app/actions";
import { FadeIn } from "@/components/FadeIn";
import { Button } from "@/components/Button";
import { StarRating } from "@/components/StarRating";
import { getHostRatings } from "@/lib/ratings";
import { calculateProfileCompletion } from "@/lib/users";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const hostRatings = await getHostRatings([user.id]);
  const myHostRating = hostRatings[user.id];
  const profileCompletion = calculateProfileCompletion(user);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-10">
      <div className="grid gap-10 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2">
          <FadeIn>
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-6 border-b-2 border-foreground">
              <div className="h-24 w-24 rounded-full bg-accent-soft text-accent border-2 border-foreground flex items-center justify-center text-4xl font-display font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <Link
                href="/settings"
                aria-label="Settings"
                className="text-muted hover:text-foreground border-2 border-foreground rounded-md p-2"
              >
                <Settings size={20} />
              </Link>
            </div>

            {/* User info */}
            <div className="mt-6">
              <h1 className="text-3xl font-semibold tracking-tight">{user.name}</h1>
              {user.username && <p className="text-muted text-sm">@{user.username}</p>}

              {user.locationVerifiedAt && (
                <p className="text-sm text-muted mt-2">
                  📍 {user.locationLabel || "Location verified"}
                </p>
              )}

              {user.bio ? (
                <p className="text-muted mt-3">{user.bio}</p>
              ) : (
                <p className="text-muted mt-3 italic text-sm">No bio yet. <Link href="/profile/edit" className="text-primary underline">Add bio</Link></p>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-8">
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

            {/* Profile completion */}
            <div className="mt-8 border-2 border-foreground rounded-md p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-24 w-24 rounded-full border-4 border-primary relative">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{profileCompletion}%</div>
                      <div className="text-xs text-muted">complete</div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold">Your profile - {profileCompletion}% complete</h3>
                  <p className="text-sm text-muted mt-1">
                    {profileCompletion < 100
                      ? "Add your availability and social style to get better matches."
                      : "Your profile is complete! Keep it updated for best matches."}
                  </p>
                  {profileCompletion < 100 && (
                    <Link href="/profile/edit" className="text-primary text-sm font-medium mt-2 inline-block underline">
                      Complete profile →
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Interests */}
            {user.interests && Array.isArray(user.interests) && user.interests.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">❤️ My interests</h3>
                  <Link href="/profile/edit" className="text-primary text-sm underline">Edit</Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  {user.interests.map((tag: string) => (
                    <span
                      key={tag}
                      className="text-sm rounded-full border-2 border-foreground bg-primary text-primary-foreground px-3 py-1"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Activities */}
            {user.activities && Array.isArray(user.activities) && user.activities.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">⚡ I&apos;m up for</h3>
                  <Link href="/profile/edit" className="text-primary text-sm underline">Edit</Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  {user.activities.map((tag: string) => (
                    <span
                      key={tag}
                      className="text-sm rounded-full border-2 border-foreground px-3 py-1"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {user.languages && Array.isArray(user.languages) && user.languages.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">🗣️ Languages</h3>
                  <Link href="/profile/edit" className="text-primary text-sm underline">Edit</Link>
                </div>
                <div className="space-y-2">
                  {user.languages.map((lang: any) => (
                    <div key={lang.code} className="flex items-center justify-between border-b-2 border-foreground pb-2 last:border-0">
                      <span className="text-sm">{lang.name}</span>
                      <span className="text-xs text-muted capitalize">{lang.proficiency}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rating */}
            {myHostRating && (
              <div className="mt-8">
                <div className="border-2 border-foreground rounded-md p-4">
                  <h3 className="font-semibold mb-3">⭐ Host Rating</h3>
                  <StarRating avg={myHostRating.avg} count={myHostRating.count} />
                  <p className="text-xs text-muted mt-2">{myHostRating.count} people rated your events</p>
                </div>
              </div>
            )}
          </FadeIn>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <FadeIn delay={0.1}>
            {/* Social style */}
            {(user.socialStyle.personality || user.socialStyle.groupSize || user.socialStyle.pace || user.socialStyle.planning) && (
              <div className="border-2 border-foreground rounded-md p-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">My social style</h3>
                  <Link href="/profile/edit" className="text-primary text-xs underline">Edit</Link>
                </div>
                <div className="space-y-3 text-sm">
                  {user.socialStyle.personality && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted">Personality</span>
                      <span className="capitalize bg-surface px-2 py-1 rounded text-xs">{user.socialStyle.personality}</span>
                    </div>
                  )}
                  {user.socialStyle.groupSize && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted">Group size</span>
                      <span className="capitalize bg-surface px-2 py-1 rounded text-xs">{user.socialStyle.groupSize}</span>
                    </div>
                  )}
                  {user.socialStyle.pace && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted">Activity vibe</span>
                      <span className="capitalize bg-surface px-2 py-1 rounded text-xs">{user.socialStyle.pace}</span>
                    </div>
                  )}
                  {user.socialStyle.planning && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted">Planning style</span>
                      <span className="capitalize bg-surface px-2 py-1 rounded text-xs">{user.socialStyle.planning}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Looking for */}
            {user.lookingFor && Array.isArray(user.lookingFor) && user.lookingFor.length > 0 && (
              <div className="border-2 border-foreground rounded-md p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">What I&apos;m looking for</h3>
                  <Link href="/profile/edit" className="text-primary text-xs underline">Edit</Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  {user.lookingFor.map((tag: string) => (
                    <span key={tag} className="text-xs rounded-full border-2 border-foreground bg-surface px-2.5 py-1">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Account & settings */}
            <div className="border-2 border-foreground rounded-md p-4 mb-6">
              <h3 className="font-semibold mb-3">Account & settings</h3>
              <div className="space-y-2">
                <Link href="/profile/edit" className="block text-sm hover:text-primary transition-colors">
                  Edit profile →
                </Link>
                <Link href="/settings" className="block text-sm hover:text-primary transition-colors">
                  Settings →
                </Link>
              </div>
            </div>

            {/* Sign out */}
            <form action={signOut}>
              <Button type="submit" variant="secondary" className="w-full flex items-center justify-center gap-2 text-red-600 hover:text-red-700">
                <LogOut size={16} />
                Log out
              </Button>
            </form>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
