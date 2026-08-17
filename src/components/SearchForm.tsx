"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/Button";

const CATEGORIES = [
  "Food & Drink",
  "Movies & Shows",
  "Outdoors",
  "Games",
  "Music",
  "Sports",
  "Books & Learning",
  "Arts & Culture",
  "Other",
];

export function SearchForm({
  q,
  category,
  sortNear,
  hasUserLocation,
}: {
  q?: string;
  category?: string;
  sortNear?: boolean;
  hasUserLocation?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const otherParams = new URLSearchParams();
  if (q) otherParams.set("q", q);
  if (category) otherParams.set("category", category);
  otherParams.set("sort", "soonest");

  const nearParams = new URLSearchParams();
  if (q) nearParams.set("q", q);
  if (category) nearParams.set("category", category);
  nearParams.set("sort", "near");

  return (
    <div className="flex flex-col gap-3">
      <div className="hidden sm:flex flex-col sm:flex-row gap-3">
        <form className="flex flex-col sm:flex-row gap-3 flex-1" action="/">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search events, e.g. &quot;dinner&quot; or &quot;movie&quot;"
            className="flex-1 border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none"
          />
          <select
            name="category"
            defaultValue={category ?? ""}
            className="border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
      </div>

      <div className="sm:hidden flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="p-2 border-2 border-foreground rounded-md hover:bg-surface-muted"
          aria-label="Toggle search"
        >
          <Search size={20} />
        </button>
        {open && (
          <form className="flex-1 flex gap-2" action="/">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search events"
              className="flex-1 border-2 border-foreground bg-surface rounded-md px-3 py-2 outline-none text-sm"
              autoFocus
            />
            <Button type="submit" variant="secondary" className="px-3 py-2 text-sm">
              Go
            </Button>
          </form>
        )}
      </div>

      {hasUserLocation && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted">Sort:</span>
          <Link
            href={`/?${otherParams.toString()}`}
            className={!sortNear ? "text-foreground font-medium" : "text-muted hover:text-foreground"}
          >
            Soonest
          </Link>
          <span className="text-border">·</span>
          <Link
            href={`/?${nearParams.toString()}`}
            className={sortNear ? "text-foreground font-medium" : "text-muted hover:text-foreground"}
          >
            Nearest
          </Link>
        </div>
      )}
    </div>
  );
}
