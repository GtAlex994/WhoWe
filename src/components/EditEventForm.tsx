"use client";

import { useState } from "react";
import { updateEvent } from "@/app/actions";
import { CATEGORIES } from "@/lib/categories";
import { GENDER_POLICIES, GENDER_POLICY_LABELS } from "@/lib/event-policies";
import { Button } from "@/components/Button";
import { LocationInput } from "@/components/LocationInput";
import type { EventDTO } from "@/lib/events";

function toLocalDateTimeValue(date: Date) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function EditEventForm({ event }: { event: EventDTO }) {
  const [isPaid, setIsPaid] = useState(!event.isFree);

  return (
    <form action={updateEvent.bind(null, event.id)} className="flex flex-col gap-4">
      <div>
        <label className="text-sm font-medium block mb-1">Title</label>
        <input
          name="title"
          required
          defaultValue={event.title}
          className="w-full border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none"
        />
      </div>

      <div>
        <label className="text-sm font-medium block mb-1">Description</label>
        <textarea
          name="description"
          required
          rows={3}
          defaultValue={event.description}
          className="w-full border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none resize-none"
        />
      </div>

      <div>
        <label className="text-sm font-medium block mb-1">
          Location <span className="text-muted font-normal">(public place)</span>
        </label>
        <LocationInput defaultValue={event.location} defaultLat={event.latitude} defaultLon={event.longitude} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium block mb-1">Category</label>
          <select
            name="category"
            required
            defaultValue={event.category}
            className="w-full border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Date & time goes last: iPadOS Safari's inline datetime-local picker
            expands past the input's own width, so nothing can sit to its right. */}
        <div>
          <label className="text-sm font-medium block mb-1">Date & time</label>
          <input
            type="datetime-local"
            name="startsAt"
            required
            defaultValue={toLocalDateTimeValue(event.startsAt)}
            className="w-full border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium block mb-1">Who can join</label>
        <select
          name="genderPolicy"
          defaultValue={event.genderPolicy}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium block mb-1">
            Min people <span className="text-muted font-normal">(optional)</span>
          </label>
          <input
            type="number"
            name="minAttendees"
            min={1}
            defaultValue={event.minAttendees ?? ""}
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
            defaultValue={event.maxAttendees ?? ""}
            placeholder="No limit"
            className="w-full border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none"
          />
        </div>
      </div>

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
                defaultValue={event.price ?? ""}
                placeholder="15"
                className="w-full border-2 border-foreground bg-surface rounded-md pl-7 pr-4 py-2.5 outline-none"
              />
            </div>
          </div>
        )}
      </div>

      <Button type="submit" variant="primary" className="w-full mt-2">
        Save changes
      </Button>
    </form>
  );
}
