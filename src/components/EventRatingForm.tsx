"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/Button";

export function EventRatingForm({
  action,
  defaultScore = 0,
  defaultComment = "",
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaultScore?: number;
  defaultComment?: string;
}) {
  const [score, setScore] = useState(defaultScore);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="score" value={score} />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setScore(1)}
          aria-label="Thumbs up"
          className={`flex items-center gap-1.5 px-3 py-2 rounded-md border-2 transition-colors ${
            score === 1
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-surface border-foreground hover:bg-surface-muted"
          }`}
        >
          <ThumbsUp size={20} />
          <span className="text-sm font-medium">Good</span>
        </button>
        <button
          type="button"
          onClick={() => setScore(-1)}
          aria-label="Thumbs down"
          className={`flex items-center gap-1.5 px-3 py-2 rounded-md border-2 transition-colors ${
            score === -1
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-surface border-foreground hover:bg-surface-muted"
          }`}
        >
          <ThumbsDown size={20} />
          <span className="text-sm font-medium">Not for me</span>
        </button>
      </div>
      <textarea
        name="comment"
        rows={2}
        defaultValue={defaultComment}
        placeholder="Optional: how did it go?"
        className="w-full border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none resize-none"
      />
      <Button
        type="submit"
        variant="secondary"
        disabled={score === 0}
        className="self-start disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {defaultScore ? "Update" : "Submit"}
      </Button>
    </form>
  );
}
