"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { updateBasicProfile } from "@/app/profile-actions";
import { Button } from "@/components/Button";
import { ColorInitialsAvatar } from "@/components/ColorInitialsAvatar";
import { getAvatarUrl, type AvatarStyle } from "@/lib/avatars";
import type { UserDTO } from "@/lib/users";

export function BasicProfileForm({ user }: { user: UserDTO }) {
  const router = useRouter();

  return (
    <form action={updateBasicProfile} className="flex flex-col gap-6">
      {/* Avatar Display */}
      <div>
        {user.avatar?.style === "color-initials" ? (
          <ColorInitialsAvatar initials={user.name.charAt(0).toUpperCase()} color={user.avatar.seed} className="h-20 w-20 text-2xl" />
        ) : user.avatar ? (
          <Image
            src={getAvatarUrl(user.avatar.seed, user.avatar.style as Exclude<AvatarStyle, "color-initials">)}
            alt=""
            width={80}
            height={80}
            unoptimized
            className="h-20 w-20 rounded-full border-2 border-foreground"
          />
        ) : (
          <div className="h-20 w-20 rounded-full bg-accent-soft text-accent border-2 border-foreground flex items-center justify-center text-2xl font-display font-semibold">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        <p className="text-xs text-muted mt-2">
          Avatar is chosen during onboarding.
        </p>
      </div>

      {/* Name */}
      <div>
        <label htmlFor="name" className="text-sm font-medium block mb-2">
          Display Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={user.name}
          maxLength={100}
          className="w-full border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none"
          placeholder="Your display name"
        />
        <p className="text-xs text-muted mt-1">
          Private — only you will see this. Other members will know you by your username.
        </p>
      </div>

      {/* Username */}
      <div>
        <label htmlFor="username" className="text-sm font-medium block mb-2">
          Username
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">@</span>
          <div className="flex-1 px-4 py-2.5 bg-surface rounded-md border-2 border-foreground border-dashed text-sm">
            {user.username}
          </div>
        </div>
        <p className="text-xs text-muted mt-1">Your username is permanent and appears on your public profile</p>
      </div>

      {/* Location */}
      <div>
        <label htmlFor="locationLabel" className="text-sm font-medium block mb-2">
          City / Approximate Location
        </label>
        <input
          id="locationLabel"
          name="locationLabel"
          type="text"
          defaultValue={user.locationLabel ?? ""}
          maxLength={100}
          className="w-full border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none"
          placeholder="e.g., Adelaide, SA or Melbourne"
        />
        <p className="text-xs text-muted mt-1">Your approximate location helps others find local events</p>
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="bio" className="text-sm font-medium block mb-2">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          maxLength={500}
          rows={4}
          defaultValue={user.bio ?? ""}
          className="w-full border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none resize-none"
          placeholder="Tell others about yourself, your interests, and what you're looking for"
        />
        <p className="text-xs text-muted mt-1">Maximum 500 characters</p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-4">
        <Button type="submit" variant="primary">
          Save changes
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
