"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { AvatarBuilder } from "@/components/AvatarBuilder";
import type { AvataaarsFeatures } from "@/lib/avatars";

type AvatarPersonalizePanelProps = {
  open: boolean;
  onClose: () => void;
  value: AvataaarsFeatures;
  onChange: (features: AvataaarsFeatures) => void;
};

export function AvatarPersonalizePanel({ open, onClose, value, onChange }: AvatarPersonalizePanelProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close avatar personalization"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div className="relative w-full sm:w-[440px] h-full bg-background border-l-2 border-foreground flex flex-col shadow-[-4px_0_0_0_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-foreground shrink-0">
          <h2 className="font-display font-semibold text-lg">Personalize your avatar</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-md border-2 border-foreground bg-surface hover:bg-background shadow-[2px_2px_0_0_var(--foreground)] hover:shadow-[1px_1px_0_0_var(--foreground)] hover:translate-x-px hover:translate-y-px transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <AvatarBuilder value={value} onChange={onChange} />
        </div>

        <div className="px-5 py-4 border-t-2 border-foreground shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full text-sm font-medium px-4 py-2.5 rounded-md border-2 border-foreground bg-primary text-primary-foreground shadow-[2px_2px_0_0_var(--foreground)] hover:shadow-[1px_1px_0_0_var(--foreground)] hover:translate-x-px hover:translate-y-px transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
