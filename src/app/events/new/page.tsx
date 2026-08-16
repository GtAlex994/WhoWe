import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { createEvent } from "@/app/actions";
import { CATEGORIES } from "@/lib/categories";
import { FadeIn } from "@/components/FadeIn";
import { Button } from "@/components/Button";
import { LocationInput } from "@/components/LocationInput";

function defaultStartsAt() {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

const TIPS = [
  "Pick a place that's genuinely public — a business with staff and other customers around, not a private residence.",
  "Say what to expect. A clear description helps the right people find and join.",
  "Small is good. A dinner for 4 or a hike for 6 is easier to actually pull off than a huge open invite.",
];

export default async function NewEventPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-10 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
      <div className="flex flex-col gap-6 max-w-xl">
        <FadeIn>
          <h1 className="text-4xl font-semibold tracking-tight">Create an event</h1>
          <p className="text-muted mt-1.5">
            Keep it simple — what, where, when. For everyone&apos;s safety, use a
            public place.
          </p>
        </FadeIn>

        <FadeIn delay={0.08}>
          <form action={createEvent} className="flex flex-col gap-4">
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
            </div>

            <Button type="submit" variant="primary" className="w-full mt-2">
              Create event
            </Button>
          </form>
        </FadeIn>
      </div>

      <FadeIn delay={0.14} className="hidden lg:block">
        <div className="bg-accent-soft border-2 border-accent/30 rounded-lg p-6 sticky top-24">
          <div className="font-display text-lg font-semibold text-accent">Good events are specific</div>
          <ul className="mt-4 flex flex-col gap-4">
            {TIPS.map((tip) => (
              <li key={tip} className="text-sm text-foreground/70 flex gap-2">
                <span className="text-accent">—</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </FadeIn>
    </div>
  );
}
