import { FadeIn } from "@/components/FadeIn";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 flex flex-col gap-8">
      <FadeIn>
        <h1 className="text-4xl font-semibold tracking-tight">Privacy on WhoWe</h1>
        <p className="text-muted mt-4 text-lg">A plain-language summary of how your profile information is used.</p>
      </FadeIn>

      <div className="space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="font-semibold text-base mb-2">Location</h2>
          <p className="text-muted">
            We use your general area to show nearby events and recommendations. Your exact coordinates are never
            shown to other members — only your city, or suburb and city, depending on the display setting you
            choose. You can change this setting or your location at any time from your profile.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-base mb-2">Your name and username</h2>
          <p className="text-muted">
            Your full name is private and only used for account identification — other members see your username
            instead. Your username is public and cannot be changed once set.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-base mb-2">Interests, activities, and languages</h2>
          <p className="text-muted">
            These are shown on your public profile and used to power recommendations. You can edit them any time.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-base mb-2">Things you&apos;d rather avoid</h2>
          <p className="text-muted">
            Never shown publicly — used only to avoid recommending plans that aren&apos;t for you.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-base mb-2">Social preferences and goals</h2>
          <p className="text-muted">
            Used to improve recommendations. Not shown on your public profile.
          </p>
        </section>
      </div>
    </div>
  );
}
