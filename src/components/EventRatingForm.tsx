"use client";

import { useState } from "react";
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
  const [hover, setHover] = useState(0);
  const display = hover || score;

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="score" value={score} />
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setScore(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            className="text-2xl leading-none cursor-pointer px-0.5"
          >
            <span className={n <= display ? "text-primary" : "text-border"}>★</span>
          </button>
        ))}
      </div>
      <textarea
        name="comment"
        rows={2}
        defaultValue={defaultComment}
        placeholder="Optional — how did it go?"
        className="w-full border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none resize-none"
      />
      <Button
        type="submit"
        variant="secondary"
        disabled={score === 0}
        className="self-start disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {defaultScore ? "Update rating" : "Submit rating"}
      </Button>
    </form>
  );
}
