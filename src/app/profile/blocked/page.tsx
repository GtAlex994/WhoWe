import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getBlockedByUser } from "@/lib/moderation";
import { getUsersByIds } from "@/lib/users-server";
import { unblockUser } from "@/app/moderation-actions";
import { ProfileEditor } from "@/components/ProfileEditor";
import { Button } from "@/components/Button";
import { resolveAvatarSrc } from "@/lib/avatars";
import { ColorInitialsAvatar } from "@/components/ColorInitialsAvatar";

export default async function BlockedUsersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const blocked = await getBlockedByUser(user.id);
  const usersById = await getUsersByIds(blocked.map((b) => b.id));

  return (
    <ProfileEditor
      title="Blocked members"
      description="They can't view your profile or contact you, and you won't see them either."
    >
      {blocked.length === 0 ? (
        <p className="text-sm text-muted">You haven&apos;t blocked anyone.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {blocked.map(({ id }) => {
            const blockedUser = usersById[id];
            if (!blockedUser) return null;
            return (
              <div
                key={id}
                className="flex items-center gap-4 border-2 border-foreground rounded-md p-4 shadow-[2px_2px_0_0_var(--foreground)]"
              >
                <div className="flex-shrink-0">
                  {blockedUser.avatar?.style === "color-initials" ? (
                    <ColorInitialsAvatar
                      initials={(blockedUser.username ?? "?").charAt(0).toUpperCase()}
                      color={blockedUser.avatar.seed}
                      className="h-12 w-12 text-lg"
                    />
                  ) : blockedUser.avatar ? (
                    <Image
                      src={resolveAvatarSrc(blockedUser.avatar, blockedUser.gender)}
                      alt=""
                      width={48}
                      height={48}
                      unoptimized
                      className="h-12 w-12 rounded-full border-2 border-foreground"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-accent-soft text-accent border-2 border-foreground flex items-center justify-center text-lg font-display font-semibold">
                      {(blockedUser.username ?? "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">@{blockedUser.username}</p>
                </div>
                <form action={unblockUser}>
                  <input type="hidden" name="targetUsername" value={blockedUser.username ?? ""} />
                  <Button type="submit" variant="secondary" className="text-sm px-3 py-1.5">
                    Unblock
                  </Button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </ProfileEditor>
  );
}
