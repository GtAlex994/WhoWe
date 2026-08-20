import { FadeIn } from "@/components/FadeIn";

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
    title: "Protect personal information",
    body: "Take your time sharing personal details until you've built some trust with someone.",
  },
  {
    title: "In an emergency",
    body: "If you're ever in immediate danger, contact local emergency services first.",
  },
];

export default function CommunityGuidelinesPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 flex flex-col gap-8">
      <FadeIn>
        <h1 className="text-4xl font-semibold tracking-tight">Community guidelines</h1>
        <p className="text-muted mt-4 text-lg">
          Meeting new people is the whole point of WhoWe. Here&apos;s how we try to make that feel safe and respectful
          for everyone.
        </p>
      </FadeIn>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PRINCIPLES.map((p) => (
          <div key={p.title} className="bg-surface border-2 border-foreground rounded-lg px-5 py-4">
            <div className="font-display text-lg font-semibold">{p.title}</div>
            <p className="text-sm text-muted mt-2 leading-relaxed">{p.body}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted">
        WhoWe is an early prototype. In-app reporting, blocking, and identity verification aren&apos;t live yet.
        Treat every meetup with the same caution you&apos;d use meeting anyone new online.
      </p>
    </div>
  );
}
