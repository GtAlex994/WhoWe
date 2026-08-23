"use client";

import { updateEvent } from "@/app/actions";
import { CATEGORIES } from "@/lib/categories";
import { Button } from "@/components/Button";
import { LocationInput } from "@/components/LocationInput";
import type { EventDTO } from "@/lib/events";

function toLocalDateTimeValue(date: Date) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function EditEventForm({ event }: { event: EventDTO }) {
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
          <label className="text-sm font-medium block mb-1">Date & time</label>
          <input
            type="datetime-local"
            name="startsAt"
            required
            defaultValue={toLocalDateTimeValue(event.startsAt)}
            className="w-full border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none"
          />
        </div>

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
      </div>

      <Button type="submit" variant="primary" className="w-full mt-2">
        Save changes
      </Button>
    </form>
  );
}
