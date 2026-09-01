"use client";

import { useState } from "react";
import { createEvent } from "@/app/actions";
import { CATEGORIES } from "@/lib/categories";
import { GENDER_POLICIES, GENDER_POLICY_LABELS } from "@/lib/event-policies";
import { Button } from "@/components/Button";
import { LocationInput } from "@/components/LocationInput";

function defaultStartsAt() {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function CreateEventForm() {
  const [mode, setMode] = useState<"standard" | "wild">("standard");
  const [isPaid, setIsPaid] = useState(false);

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
          Skip the details, say where and when, and we&apos;ll randomly invite people
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
              placeholder="A few details: what to expect, who it's for, anything to bring."
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

        {/* Date & time goes last: iPadOS Safari's inline datetime-local picker
            expands past the input's own width, so nothing can sit to its right. */}
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
      </div>

      {mode === "standard" && (
        <div>
          <label className="text-sm font-medium block mb-1">Who can join</label>
          <select
            name="genderPolicy"
            defaultValue="open"
            className="w-full border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none"
          >
            {GENDER_POLICIES.map((p) => (
              <option key={p} value={p}>
                {GENDER_POLICY_LABELS[p]}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted mt-1">
            Gender is self-declared by each member, not independently verified.
          </p>
        </div>
      )}

      {mode === "standard" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">
              Min people <span className="text-muted font-normal">(optional)</span>
            </label>
            <input
              type="number"
              name="minAttendees"
              min={1}
              placeholder="No minimum"
              className="w-full border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">
              Max people <span className="text-muted font-normal">(optional)</span>
            </label>
            <input
              type="number"
              name="maxAttendees"
              min={1}
              placeholder="No limit"
              className="w-full border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none"
            />
          </div>
        </div>
      )}

      <div>
        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer w-fit">
          <input
            type="checkbox"
            name="isPaid"
            checked={isPaid}
            onChange={(e) => setIsPaid(e.target.checked)}
          />
          This event costs money
        </label>
        {isPaid && (
          <div className="mt-2 max-w-[160px]">
            <label className="text-sm font-medium block mb-1">Price per person</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">$</span>
              <input
                type="number"
                name="price"
                required={isPaid}
                min={0.01}
                step={0.01}
                placeholder="15"
                className="w-full border-2 border-foreground bg-surface rounded-md pl-7 pr-4 py-2.5 outline-none"
              />
            </div>
          </div>
        )}
      </div>

      <Button type="submit" variant="primary" className="w-full mt-2">
        {mode === "wild" ? "Create Wild event" : "Create event"}
      </Button>
    </form>
  );
}
