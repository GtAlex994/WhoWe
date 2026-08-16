import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { FadeIn } from "@/components/FadeIn";
import { StaggerList, StaggerItem } from "@/components/StaggerList";
import { Button } from "@/components/Button";
import { Squiggle } from "@/components/Squiggle";

const PRINCIPLES = [
  {
    title: "Always meet in public places",
    body: "Every event on WhoWe should be held somewhere public and populated: a restaurant, cafe, park, or venue. Never a private home on a first meetup.",
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
    body: "Instead of open-ended public reviews of people, which can be misused to harass, we're building a simple reliability signal based on whether people show up to what they join.",
  },
];

export default async function OnboardingSafetyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 flex flex-col gap-8">
      <FadeIn>
        <h1 className="text-4xl font-semibold tracking-tight inline-block relative">
          One more thing
          <Squiggle className="absolute -bottom-2 left-0 w-40 h-3" />
        </h1>
        <p className="text-muted mt-4 text-lg">
          Meeting new people is the whole point. Here&apos;s how we try to make that
          feel safe.
        </p>
      </FadeIn>

      <StaggerList className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PRINCIPLES.map((p) => (
          <StaggerItem
            key={p.title}
            className="bg-surface border-2 border-foreground rounded-lg px-5 py-4 shadow-[3px_3px_0_0_var(--foreground)]"
          >
            <div className="font-display text-lg font-semibold">{p.title}</div>
            <p className="text-sm text-muted mt-2 leading-relaxed">{p.body}</p>
          </StaggerItem>
        ))}
      </StaggerList>

      <FadeIn delay={0.2}>
        <Link href="/">
          <Button variant="primary">Got it, continue</Button>
        </Link>
      </FadeIn>
    </div>
  );
}
