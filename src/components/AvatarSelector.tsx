"use client";

import { useState } from "react";
import Image from "next/image";
import { AVATAR_STYLES, getAvatarUrl, type AvatarStyle } from "@/lib/avatars";

type AvatarSelectorProps = {
  seed: string;
  onSelect?: (style: AvatarStyle) => void;
  defaultStyle?: AvatarStyle;
};

export function AvatarSelector({ seed, onSelect, defaultStyle = "avataaars" }: AvatarSelectorProps) {
  const [selected, setSelected] = useState<AvatarStyle>(defaultStyle);

  const handleSelect = (style: AvatarStyle) => {
    setSelected(style);
    onSelect?.(style);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Click to preview different avatar styles</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {AVATAR_STYLES.map((style) => (
          <button
            key={style.id}
            type="button"
            onClick={() => handleSelect(style.id)}
            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
              selected === style.id
                ? "border-primary bg-primary/10"
                : "border-foreground/20 hover:border-foreground/40"
            }`}
          >
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-surface flex items-center justify-center">
              <Image
                src={getAvatarUrl(seed, style.id)}
                alt={`${style.label} avatar`}
                width={80}
                height={80}
                unoptimized
              />
            </div>
            <span className="text-xs font-medium">{style.label}</span>
          </button>
        ))}
      </div>
      <input type="hidden" name="avatarStyle" value={selected} />
    </div>
  );
}
