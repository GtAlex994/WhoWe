import { FadeIn } from "@/components/FadeIn";
import { COMMUNITY_GUIDELINES } from "@/lib/community-guidelines";

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
        {COMMUNITY_GUIDELINES.map((p) => (
          <div key={p.title} className="bg-surface border-2 border-foreground rounded-lg px-5 py-4">
            <div className="font-display text-lg font-semibold">{p.title}</div>
            <p className="text-sm text-muted mt-2 leading-relaxed">{p.body}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted">
        WhoWe is an early prototype and identity verification isn&apos;t live yet. You can report or block another
        member from their profile at any time. Treat every meetup with the same caution you&apos;d use meeting
        anyone new online.
      </p>
    </div>
  );
}
