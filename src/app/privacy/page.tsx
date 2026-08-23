import Link from "next/link";
import { FadeIn } from "@/components/FadeIn";

const PROFILE_DATA = [
  {
    title: "Location",
    body: "We use your general area to show nearby events and recommendations. Your exact coordinates are never shown to other members — only your city, or suburb and city, depending on the display setting you choose. You can change this setting or your location at any time from your profile.",
  },
  {
    title: "Your name, birthdate, and username",
    body: "Your full name and birthdate are private and used only for account identification and confirming you meet our minimum age requirement — other members see your username instead. Your username is public and cannot be changed once set.",
  },
  {
    title: "Interests, activities, and languages",
    body: "These are shown on your public profile and used to power recommendations. You can edit them any time.",
  },
  {
    title: "Things you'd rather avoid",
    body: "Never shown publicly — used only to avoid recommending plans that aren't for you.",
  },
  {
    title: "Social preferences and goals",
    body: "Used to improve recommendations and matching. Not shown on your public profile.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 flex flex-col gap-8">
      <FadeIn>
        <h1 className="text-4xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="text-muted mt-4 text-lg">
          What we collect, why, who we share it with, and the controls you have over it.
        </p>
      </FadeIn>

      <div className="space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="font-semibold text-base mb-2">What&apos;s on your profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {PROFILE_DATA.map((p) => (
              <div key={p.title} className="bg-surface border-2 border-foreground rounded-lg px-4 py-3">
                <div className="font-medium text-sm">{p.title}</div>
                <p className="text-xs text-muted mt-1.5 leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">Account and activity data</h2>
          <p className="text-muted">
            We also store the events you create, join, or rate; your chat messages within an event; and your
            block and report history, so the service works and so we can act on safety reports. Your email
            address is used to sign you in and, if you keep email notifications on, to send account-related
            messages — we don&apos;t sell or share it with advertisers.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">Who we share data with</h2>
          <p className="text-muted">
            We use a small number of service providers to run WhoWe: Google Firebase for authentication, database,
            and hosting, and Resend for transactional email delivery. These providers process data on our behalf
            under their own security and privacy commitments — we don&apos;t sell your data to anyone, and we
            don&apos;t share it with advertisers.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">How long we keep it</h2>
          <p className="text-muted">
            We keep your account data for as long as your account is active. If you delete your account, your
            profile, events you host, and your participation records are permanently removed within a short
            time — see &quot;Your rights&quot; below for how to do this.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">Your rights</h2>
          <p className="text-muted">
            You can view and edit most of your profile data any time from your account. You can permanently
            delete your account and associated data from{" "}
            <Link href="/settings" className="text-primary hover:underline">
              Settings
            </Link>
            . If you&apos;d like a copy of your data or have another privacy request, reach out through the
            contact details on your account settings page.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">Cookies</h2>
          <p className="text-muted">
            We use a single essential cookie to keep you signed in. We don&apos;t use advertising or
            cross-site tracking cookies.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">Children&apos;s privacy</h2>
          <p className="text-muted">
            WhoWe is intended for people 18 and older and is not directed at children. We don&apos;t knowingly
            collect data from anyone under 18.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">Changes to this policy</h2>
          <p className="text-muted">
            If we make a material change to how we handle your data, we&apos;ll make a reasonable effort to let
            members know before it takes effect.
          </p>
        </section>
      </div>
    </div>
  );
}
