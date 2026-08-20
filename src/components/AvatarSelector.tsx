"use client";

import { useState } from "react";
import Image from "next/image";
import { AVATAR_STYLES, AVATAR_COLORS, getAvatarUrl, type AvatarStyle } from "@/lib/avatars";
import { ColorInitialsAvatar } from "@/components/ColorInitialsAvatar";

type AvatarSelectorProps = {
  seed: string;
  onSelect?: (style: AvatarStyle, seed: string) => void;
  defaultStyle?: AvatarStyle;
  /** Initials shown in the "Initials" style preview — usually derived from the display name. */
  initials?: string;
};

const illustratedStyles = AVATAR_STYLES.filter((s) => s.id !== "color-initials");

export function AvatarSelector({
  seed: initialSeed,
  onSelect,
  defaultStyle = "avataaars",
  initials = "?",
}: AvatarSelectorProps) {
  const [selected, setSelected] = useState<AvatarStyle>(defaultStyle);
  const [seeds, setSeeds] = useState<Record<AvatarStyle, string>>({
    avataaars: initialSeed,
    adventurer: initialSeed,
    "pixel-art": initialSeed,
    "color-initials": AVATAR_COLORS[0],
  });

  const handleSelect = (style: AvatarStyle) => {
    setSelected(style);
    onSelect?.(style, seeds[style]);
  };

  const handleRandomize = (style: Exclude<AvatarStyle, "color-initials">) => {
    const newSeed = Math.random().toString(36).substring(7);
    setSeeds((prev) => ({ ...prev, [style]: newSeed }));
    if (selected === style) onSelect?.(style, newSeed);
  };

  const handleColorPick = (color: string) => {
    setSeeds((prev) => ({ ...prev, "color-initials": color }));
    if (selected === "color-initials") onSelect?.("color-initials", color);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Choose how you&apos;d like to appear to other members.</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {illustratedStyles.map((style) => (
          <div
            key={style.id}
            className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-foreground transition-all ${
              selected === style.id
                ? "bg-primary/10 shadow-[1px_1px_0_0_var(--foreground)] translate-x-[1px] translate-y-[1px]"
                : "bg-surface shadow-[2px_2px_0_0_var(--foreground)] hover:shadow-[3px_3px_0_0_var(--foreground)] hover:-translate-x-px hover:-translate-y-px"
            }`}
          >
            <button
              type="button"
              onClick={() => handleSelect(style.id)}
              aria-pressed={selected === style.id}
              className="w-full flex flex-col items-center gap-2"
            >
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface flex items-center justify-center">
                <Image
                  src={getAvatarUrl(seeds[style.id], style.id as Exclude<AvatarStyle, "color-initials">)}
                  alt={`${style.label} avatar option`}
                  width={64}
                  height={64}
                  unoptimized
                />
              </div>
              <span className="text-xs font-medium">{style.label}</span>
            </button>
            <button
              type="button"
              onClick={() => handleRandomize(style.id as Exclude<AvatarStyle, "color-initials">)}
              className="text-xs text-muted hover:text-foreground underline"
            >
              Randomize
            </button>
          </div>
        ))}

        {/* Initials with selectable color */}
        <div
          className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-foreground transition-all ${
            selected === "color-initials"
              ? "bg-primary/10 shadow-[1px_1px_0_0_var(--foreground)] translate-x-[1px] translate-y-[1px]"
              : "bg-surface shadow-[2px_2px_0_0_var(--foreground)] hover:shadow-[3px_3px_0_0_var(--foreground)] hover:-translate-x-px hover:-translate-y-px"
          }`}
        >
          <button
            type="button"
            onClick={() => handleSelect("color-initials")}
            aria-pressed={selected === "color-initials"}
            className="w-full flex flex-col items-center gap-2"
          >
            <ColorInitialsAvatar initials={initials} color={seeds["color-initials"]} className="w-16 h-16 text-xl" />
            <span className="text-xs font-medium">Initials</span>
          </button>
          <div className="flex flex-wrap justify-center gap-1.5" role="group" aria-label="Initials avatar color">
            {AVATAR_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => handleColorPick(color)}
                aria-label={`Use color ${color}`}
                aria-pressed={seeds["color-initials"] === color}
                style={{ backgroundColor: color }}
                className={`w-5 h-5 rounded-full border-2 ${
                  seeds["color-initials"] === color ? "border-foreground" : "border-transparent"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
      <input type="hidden" name="avatarStyle" value={selected} />
      <input type="hidden" name="avatarSeed" value={seeds[selected]} />
    </div>
  );
}
