"use client";

import { useState } from "react";
import Image from "next/image";
import { AVATAR_STYLES, getAvatarUrl, type AvatarStyle } from "@/lib/avatars";

type AvatarSelectorProps = {
  seed: string;
  onSelect?: (style: AvatarStyle, seed: string) => void;
  defaultStyle?: AvatarStyle;
};

export function AvatarSelector({ seed: initialSeed, onSelect, defaultStyle = "avataaars" }: AvatarSelectorProps) {
  const [selected, setSelected] = useState<AvatarStyle>(defaultStyle);
  const [seeds, setSeeds] = useState<Record<AvatarStyle, string>>({
    avataaars: initialSeed,
    adventurer: initialSeed,
    "pixel-art": initialSeed,
    initials: initialSeed,
  });

  const handleSelect = (style: AvatarStyle) => {
    setSelected(style);
    onSelect?.(style, seeds[style]);
  };

  const handleRandomize = (style: AvatarStyle) => {
    const newSeed = Math.random().toString(36).substring(7);
    setSeeds((prev) => ({ ...prev, [style]: newSeed }));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Pick a style, randomize if you want</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {AVATAR_STYLES.map((style) => (
          <div
            key={style.id}
            className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
              selected === style.id
                ? "border-primary bg-primary/10"
                : "border-foreground/20 hover:border-foreground/40"
            }`}
          >
            <button
              type="button"
              onClick={() => handleSelect(style.id)}
              className="w-full flex flex-col items-center gap-2"
            >
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface flex items-center justify-center">
                <Image
                  src={getAvatarUrl(seeds[style.id as AvatarStyle], style.id as AvatarStyle)}
                  alt={`${style.label} avatar`}
                  width={64}
                  height={64}
                  unoptimized
                />
              </div>
              <span className="text-xs font-medium">{style.label}</span>
            </button>
            <button
              type="button"
              onClick={() => handleRandomize(style.id as AvatarStyle)}
              className="text-xs text-muted hover:text-foreground underline"
            >
              Randomize
            </button>
          </div>
        ))}
      </div>
      <input type="hidden" name="avatarStyle" value={selected} />
      <input type="hidden" name="avatarSeed" value={seeds[selected]} />
    </div>
  );
}
