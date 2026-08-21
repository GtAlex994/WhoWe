"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateAvatar } from "@/app/profile-actions";
import { Button } from "@/components/Button";
import { SingleChoice } from "@/components/SingleChoice";
import { AvatarBuilder } from "@/components/AvatarBuilder";
import { AVATAR_GENDERS, AVATAAARS_TOP, randomAvataaarsFeatures, type AvatarGender, type AvataaarsFeatures } from "@/lib/avatars";
import type { UserDTO } from "@/lib/users";

const GENDER_LABELS = AVATAR_GENDERS.map((g) => g.label);

function resolveInitialFeatures(user: UserDTO, gender: AvatarGender): AvataaarsFeatures {
  const avatar = user.avatar;
  if (avatar?.top && avatar.hairColor && avatar.skinColor && avatar.clothes && avatar.clothesColor) {
    return {
      seed: avatar.seed,
      top: avatar.top,
      hairColor: avatar.hairColor,
      skinColor: avatar.skinColor,
      facialHair: avatar.facialHair ?? "none",
      accessories: avatar.accessories ?? "none",
      clothes: avatar.clothes,
      clothesColor: avatar.clothesColor,
    };
  }
  return randomAvataaarsFeatures(gender);
}

export function AvatarEditForm({ user }: { user: UserDTO }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [gender, setGender] = useState<AvatarGender>(user.gender ?? "male");
  const [features, setFeatures] = useState<AvataaarsFeatures>(() => resolveInitialFeatures(user, user.gender ?? "male"));
  const [error, setError] = useState<string | null>(null);

  const handleGenderChange = (label: string) => {
    const newGender = (AVATAR_GENDERS.find((g) => g.label === label)?.id ?? "male") as AvatarGender;
    setGender(newGender);
    setFeatures((prev) => ({
      ...prev,
      top: AVATAAARS_TOP[newGender].includes(prev.top) ? prev.top : AVATAAARS_TOP[newGender][0],
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("gender", gender);
        formData.set("seed", features.seed);
        formData.set("top", features.top);
        formData.set("hairColor", features.hairColor);
        formData.set("skinColor", features.skinColor);
        formData.set("facialHair", features.facialHair);
        formData.set("accessories", features.accessories);
        formData.set("clothes", features.clothes);
        formData.set("clothesColor", features.clothesColor);
        await updateAvatar(formData);
        router.push("/profile");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save avatar");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      <SingleChoice
        label="Gender"
        hint="Determines which hairstyle options are available."
        options={GENDER_LABELS}
        value={AVATAR_GENDERS.find((g) => g.id === gender)?.label ?? null}
        onChange={handleGenderChange}
        required
      />

      <AvatarBuilder gender={gender} value={features} onChange={setFeatures} />

      <div className="flex flex-wrap gap-3 pt-4 border-t-2 border-foreground">
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? "Saving..." : "Save avatar"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
