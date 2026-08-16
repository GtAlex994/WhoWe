import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { FadeIn } from "@/components/FadeIn";
import { CreateEventForm } from "@/components/CreateEventForm";

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
          <CreateEventForm />
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
