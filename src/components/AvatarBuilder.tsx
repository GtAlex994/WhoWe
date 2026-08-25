"use client";

import Image from "next/image";
import {
  AVATAAARS_TOP,
  AVATAAARS_TOP_LABELS,
  AVATAAARS_FACIAL_HAIR,
  AVATAAARS_FACIAL_HAIR_LABELS,
  AVATAAARS_ACCESSORIES,
  AVATAAARS_ACCESSORIES_LABELS,
  AVATAAARS_CLOTHES,
  AVATAAARS_CLOTHES_LABELS,
  AVATAAARS_HAIR_COLORS,
  AVATAAARS_SKIN_TONES,
  AVATAAARS_CLOTHES_COLORS,
  buildAvataaarsUrl,
  randomAvataaarsFeatures,
  type AvataaarsFeatures,
} from "@/lib/avatars";
import { SingleChoice } from "@/components/SingleChoice";

type AvatarBuilderProps = {
  value: AvataaarsFeatures;
  onChange: (features: AvataaarsFeatures) => void;
};

function FeatureChoice({
  label,
  hint,
  ids,
  labels,
  includeNone,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  ids: string[];
  labels: Record<string, string>;
  includeNone?: boolean;
  value: string;
  onChange: (id: string) => void;
}) {
  const options = [...(includeNone ? ["None"] : []), ...ids.map((id) => labels[id])];
  const displayValue = value === "none" ? "None" : (labels[value] ?? null);

  return (
    <SingleChoice
      label={label}
      hint={hint}
      options={options}
      value={displayValue}
      onChange={(picked) => {
        if (picked === "None") return onChange("none");
        const id = ids.find((candidate) => labels[candidate] === picked);
        if (id) onChange(id);
      }}
      required
    />
  );
}

function ColorSwatches({ label, colors, value, onChange }: { label: string; colors: string[]; value: string; onChange: (hex: string) => void }) {
  return (
    <div>
      <p className="text-sm font-medium mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            aria-label={`Use color ${color}`}
            aria-pressed={value === color}
            style={{ backgroundColor: color }}
            className={`w-7 h-7 rounded-full border-2 ${value === color ? "border-foreground" : "border-transparent"}`}
          />
        ))}
      </div>
    </div>
  );
}

export function AvatarBuilder({ value, onChange }: AvatarBuilderProps) {
  const patch = (features: Partial<AvataaarsFeatures>) => onChange({ ...value, ...features });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-surface border-2 border-foreground shrink-0">
          <Image src={buildAvataaarsUrl(value)} alt="Avatar preview" width={96} height={96} unoptimized />
        </div>
        <button
          type="button"
          onClick={() => onChange(randomAvataaarsFeatures())}
          className="text-sm text-muted hover:text-foreground underline"
        >
          Shuffle look
        </button>
      </div>

      <FeatureChoice
        label="Hairstyle"
        hint="Every style is available, regardless of gender."
        ids={AVATAAARS_TOP}
        labels={AVATAAARS_TOP_LABELS}
        value={value.top}
        onChange={(top) => patch({ top })}
      />
      <ColorSwatches label="Hair color" colors={AVATAAARS_HAIR_COLORS} value={value.hairColor} onChange={(hairColor) => patch({ hairColor })} />
      <ColorSwatches label="Skin tone" colors={AVATAAARS_SKIN_TONES} value={value.skinColor} onChange={(skinColor) => patch({ skinColor })} />
      <FeatureChoice
        label="Facial hair"
        hint="Optional."
        ids={AVATAAARS_FACIAL_HAIR}
        labels={AVATAAARS_FACIAL_HAIR_LABELS}
        includeNone
        value={value.facialHair}
        onChange={(facialHair) => patch({ facialHair })}
      />
      <FeatureChoice
        label="Accessories"
        hint="Optional."
        ids={AVATAAARS_ACCESSORIES}
        labels={AVATAAARS_ACCESSORIES_LABELS}
        includeNone
        value={value.accessories}
        onChange={(accessories) => patch({ accessories })}
      />
      <FeatureChoice
        label="Clothes"
        hint=""
        ids={AVATAAARS_CLOTHES}
        labels={AVATAAARS_CLOTHES_LABELS}
        value={value.clothes}
        onChange={(clothes) => patch({ clothes })}
      />
      <ColorSwatches
        label="Clothes color"
        colors={AVATAAARS_CLOTHES_COLORS}
        value={value.clothesColor}
        onChange={(clothesColor) => patch({ clothesColor })}
      />
    </div>
  );
}
