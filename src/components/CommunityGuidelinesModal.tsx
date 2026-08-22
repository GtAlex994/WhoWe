"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { COMMUNITY_GUIDELINES } from "@/lib/community-guidelines";

type CommunityGuidelinesModalProps = {
  open: boolean;
  onClose: () => void;
};

export function CommunityGuidelinesModal({ open, onClose }: CommunityGuidelinesModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close community guidelines"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div className="relative w-full max-w-lg max-h-[85vh] bg-background border-2 border-foreground rounded-lg flex flex-col shadow-[4px_4px_0_0_var(--foreground)]">
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-foreground shrink-0">
          <h2 className="font-display font-semibold text-lg">Community guidelines</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-md border-2 border-foreground bg-surface hover:bg-background shadow-[2px_2px_0_0_var(--foreground)] hover:shadow-[1px_1px_0_0_var(--foreground)] hover:translate-x-px hover:translate-y-px transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          <p className="text-sm text-muted">
            Meeting new people is the whole point of WhoWe. Here&apos;s how we try to make that feel safe and
            respectful for everyone.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {COMMUNITY_GUIDELINES.map((p) => (
              <div key={p.title} className="bg-surface border-2 border-foreground rounded-lg px-4 py-3">
                <div className="font-display font-semibold text-sm">{p.title}</div>
                <p className="text-xs text-muted mt-1.5 leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted">
            WhoWe is an early prototype. In-app reporting, blocking, and identity verification aren&apos;t live yet.
            Treat every meetup with the same caution you&apos;d use meeting anyone new online.
          </p>
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
