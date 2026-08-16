import { FadeIn } from "@/components/FadeIn";
import { StaggerList, StaggerItem } from "@/components/StaggerList";
import { Squiggle } from "@/components/Squiggle";

const PRINCIPLES = [
  {
    title: "Always meet in public places",
    body: "Every event on WhoWe should be held somewhere public and populated — a restaurant, cafe, park, or venue. Never a private home on a first meetup.",
  },
  {
    title: "Trust your instincts",
    body: "If something about an event or a person feels off, don't go. You can back out of an event you've joined at any time.",
  },
  {
    title: "Tell someone your plans",
    body: "Before heading to a meetup with people you haven't met before, let a friend or family member know where you're going and with whom.",
  },
  {
    title: "Reliability over reviews",
    body: "Instead of open-ended public reviews of people — which can be misused to harass — we're building a simple reliability signal based on whether people show up to what they join.",
  },
];

export default function SafetyPage() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-10 flex flex-col gap-10">
      <FadeIn>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight inline-block relative">
          Safety at WhoWe
          <Squiggle className="absolute -bottom-2 left-0 w-48 h-3" />
        </h1>
        <p className="text-muted mt-4 text-lg max-w-2xl">
          Meeting new people is the whole point — here&apos;s how we try to make that
          feel safe.
        </p>
      </FadeIn>

      <StaggerList className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PRINCIPLES.map((p) => (
          <StaggerItem
            key={p.title}
            className="bg-surface border-2 border-foreground rounded-lg px-6 py-5 shadow-[3px_3px_0_0_var(--foreground)]"
          >
            <div className="font-display text-lg font-semibold">{p.title}</div>
            <p className="text-sm text-muted mt-2 leading-relaxed">{p.body}</p>
          </StaggerItem>
        ))}
      </StaggerList>

      <FadeIn delay={0.2} className="bg-accent-soft border-2 border-accent rounded-lg px-6 py-5 max-w-3xl">
        <div className="font-display text-lg font-semibold text-accent">
          Reporting &amp; verification — coming soon
        </div>
        <p className="text-sm text-foreground/70 mt-2 leading-relaxed">
          WhoWe is an early prototype. In-app reporting, blocking, and identity
          verification aren&apos;t live yet — treat every meetup with the same
          caution you&apos;d use meeting anyone new online, and use the tips above
          in the meantime.
        </p>
      </FadeIn>
    </div>
  );
}
