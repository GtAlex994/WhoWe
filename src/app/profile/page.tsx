import Link from "next/link";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { FadeIn } from "@/components/FadeIn";
import { Button } from "@/components/Button";
import { StarRating } from "@/components/StarRating";
import { getHostRatings } from "@/lib/ratings";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const hostRatings = await getHostRatings([user.id]);
  const myHostRating = hostRatings[user.id];

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-10 py-10">
      <FadeIn>
        <div className="flex items-start justify-between gap-4">
          <div className="h-20 w-20 rounded-full bg-accent-soft text-accent border-2 border-foreground flex items-center justify-center text-3xl font-display font-semibold">
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

        <div className="mt-4">
          <h1 className="text-3xl font-semibold tracking-tight">{user.name}</h1>
          {user.username && <p className="text-muted text-sm">@{user.username}</p>}
          {myHostRating ? (
            <div className="mt-1.5">
              <StarRating avg={myHostRating.avg} count={myHostRating.count} />
              <div className="text-xs text-muted mt-0.5">as a host</div>
            </div>
          ) : (
            <p className="text-xs text-muted mt-1.5 italic">No hosting ratings yet.</p>
          )}
          {user.locationVerifiedAt && (
            <p className="text-xs text-accent mt-1.5">
              📍 Location verified{user.locationLabel ? ` near ${user.locationLabel}` : ""}
            </p>
          )}
          {user.bio ? (
            <p className="text-muted mt-2">{user.bio}</p>
          ) : (
            <p className="text-muted mt-2 italic">No bio yet.</p>
          )}
        </div>

        {(user.interests || user.dislikes) && (
          <div className="flex flex-col gap-2 mt-4">
            {user.interests && (
              <div className="flex flex-wrap gap-1.5">
                {user.interests.split(",").map((tag) => (
                  <span
                    key={tag}
                    className="text-xs rounded-full border-2 border-foreground bg-primary text-primary-foreground px-2.5 py-0.5"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {user.dislikes && (
              <div className="flex flex-wrap gap-1.5">
                {user.dislikes.split(",").map((tag) => (
                  <span
                    key={tag}
                    className="text-xs rounded-full border-2 border-border text-muted px-2.5 py-0.5"
                  >
                    not {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 mt-6">
          <Link href="/profile/edit">
            <Button variant="secondary">Edit profile</Button>
          </Link>
          <Link href="/my-events">
            <Button variant="secondary">My events</Button>
          </Link>
        </div>
      </FadeIn>
    </div>
  );
}
