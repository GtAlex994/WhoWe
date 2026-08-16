"use client";

import { useState } from "react";
import { createEvent } from "@/app/actions";
import { CATEGORIES } from "@/lib/categories";
import { Button } from "@/components/Button";
import { LocationInput } from "@/components/LocationInput";

function defaultStartsAt() {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function CreateEventForm() {
  const [mode, setMode] = useState<"standard" | "wild">("standard");

  return (
    <form action={createEvent} className="flex flex-col gap-4">
      <input type="hidden" name="mode" value={mode} />

      <div className="flex gap-1 p-1 bg-surface-muted border-2 border-foreground rounded-md w-fit">
        <button
          type="button"
          onClick={() => setMode("standard")}
          className={`px-4 py-1.5 rounded text-sm font-medium cursor-pointer ${
            mode === "standard" ? "bg-primary text-primary-foreground" : "text-muted"
          }`}
        >
          Standard
        </button>
        <button
          type="button"
          onClick={() => setMode("wild")}
          className={`px-4 py-1.5 rounded text-sm font-medium cursor-pointer ${
            mode === "wild" ? "bg-primary text-primary-foreground" : "text-muted"
          }`}
        >
          Wild
        </button>
      </div>

      {mode === "wild" && (
        <p className="text-sm text-muted -mt-1">
          Skip the details — say where and when, and we&apos;ll randomly invite people
          nearby until your spot count is filled. A good way to meet people outside your
          usual circle.
        </p>
      )}

      {mode === "standard" && (
        <>
          <div>
            <label className="text-sm font-medium block mb-1">Title</label>
            <input
              name="title"
              required
              placeholder="Dinner at the new Thai place"
              className="w-full border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Description</label>
            <textarea
              name="description"
              required
              rows={3}
              placeholder="A few details — what to expect, who it's for, anything to bring."
              className="w-full border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none resize-none"
            />
          </div>
        </>
      )}

      <div>
        <label className="text-sm font-medium block mb-1">
          Location <span className="text-muted font-normal">(public place)</span>
        </label>
        <LocationInput />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium block mb-1">Date & time</label>
          <input
            type="datetime-local"
            name="startsAt"
            required
            defaultValue={defaultStartsAt()}
            className="w-full border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none"
          />
        </div>

        {mode === "standard" ? (
          <div>
            <label className="text-sm font-medium block mb-1">Category</label>
            <select
              name="category"
              required
              defaultValue={CATEGORIES[0]}
              className="w-full border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="text-sm font-medium block mb-1">Number of people</label>
            <input
              type="number"
              name="targetHeadcount"
              required
              min={2}
              max={12}
              defaultValue={4}
              className="w-full border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none"
            />
          </div>
        )}
      </div>

      <Button type="submit" variant="primary" className="w-full mt-2">
        {mode === "wild" ? "Create Wild event" : "Create event"}
      </Button>
    </form>
  );
}
