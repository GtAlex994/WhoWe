"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { updateBasicProfile } from "@/app/profile-actions";
import { Button } from "@/components/Button";
import { ColorInitialsAvatar } from "@/components/ColorInitialsAvatar";
import { LocationSearchInput } from "@/components/LocationSearchInput";
import { LocationConsentButton } from "@/components/LocationConsentButton";
import { resolveAvatarSrc } from "@/lib/avatars";
import type { UserDTO } from "@/lib/users";

export function BasicProfileForm({ user }: { user: UserDTO }) {
  const router = useRouter();
  const [locationLabel, setLocationLabel] = useState(user.locationLabel ?? "");
  const [locationLat, setLocationLat] = useState<number | null>(user.locationLat);
  const [locationLng, setLocationLng] = useState<number | null>(user.locationLng);

  return (
    <form action={updateBasicProfile} className="flex flex-col gap-6">
      {/* Avatar Display */}
      <div>
        {user.avatar?.style === "color-initials" ? (
          <ColorInitialsAvatar initials={user.name.charAt(0).toUpperCase()} color={user.avatar.seed} className="h-20 w-20 text-2xl" />
        ) : user.avatar ? (
          <Image
            src={resolveAvatarSrc(user.avatar)}
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
        <Link href="/profile/edit/avatar" className="block text-xs text-primary underline hover:text-primary/80 mt-2">
          Edit avatar
        </Link>
      </div>

      {/* Name */}
      <div>
        <label htmlFor="name" className="text-sm font-medium block mb-2">
          Full name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={user.name}
          maxLength={100}
          className="w-full border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none"
          placeholder="Your full name"
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
        <input type="hidden" name="locationLabel" value={locationLabel} />
        <input type="hidden" name="latitude" value={locationLat ?? ""} />
        <input type="hidden" name="longitude" value={locationLng ?? ""} />
        <LocationSearchInput
          id="locationLabel"
          value={locationLabel}
          onChange={(value) => {
            setLocationLabel(value);
            setLocationLat(null);
            setLocationLng(null);
          }}
          onSelect={(label, lat, lng) => {
            setLocationLabel(label);
            setLocationLat(lat);
            setLocationLng(lng);
          }}
          placeholder="e.g., Adelaide, SA or Melbourne"
        />
        <p className="text-xs text-muted mt-1 mb-3">Your approximate location helps others find local events</p>
        <LocationConsentButton
          compact
          onLocated={(label, lat, lng) => {
            setLocationLabel(label);
            setLocationLat(lat);
            setLocationLng(lng);
          }}
        />
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
