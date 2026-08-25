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
    title: "Gender",
    body: "Self-declared, not independently verified. Used to determine eligibility for gender-restricted events and to show a privacy-preserving group-composition summary (like \"Mostly female\") once an event has enough attendees to protect anonymity. Never shown on your profile or to other members individually.",
  },
  {
    title: "Interests, activities, and languages",
    body: "These are shown on your public profile and used to power recommendations. You can edit them any time.",
  },
  {
    title: "Smoking, drinking, and dietary preferences",
    body: "Private — never shown on your profile or to other members. Used only to match you with compatible events.",
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
          <h2 className="font-semibold text-base mb-2">Safety Mode location data</h2>
          <p className="text-muted">
            Safety Mode is optional and off by default. If you turn it on for an event, we privately record your
            approximate location every few minutes while it&apos;s active, so we can offer a check-out reminder
            and an &quot;I need help&quot; option. This location is never shown to the event host or other
            attendees. It&apos;s deleted immediately when you check out, or automatically within about 48 hours
            if you don&apos;t. Turning it off stops recording and deletes the stored location right away. Safety
            Mode does not guarantee monitoring or emergency assistance — browser location updates are best-effort
            and can stop if you close the tab or lock your device.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">Trusted contact</h2>
          <p className="text-muted">
            If you choose to add a trusted contact, we store their name and email address so we can notify them
            when you explicitly ask us to — for example, when you check in to a specific event, or if you miss
            checking out and don&apos;t respond. We only contact them for an event where you&apos;ve turned that
            on. We don&apos;t use their information for anything else, and they&apos;re never shown who else is
            attending or any other details about the event.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">Automated message screening</h2>
          <p className="text-muted">
            Messages you send in event chats are automatically screened for shared contact information (phone
            numbers, emails, social handles), off-platform invitations, and a small set of clearly unsafe phrases
            before they&apos;re sent. This is automated pattern-matching, not a person reading your messages in
            real time. Messages that are blocked or flagged as higher risk are logged for our safety team to
            review.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">Safeguarding records</h2>
          <p className="text-muted">
            When a message is blocked, a report is filed, or Safety Mode&apos;s &quot;I need help&quot; is used,
            we keep an internal safety record of what happened and what action was taken, so we can review
            patterns, respond to appeals, and meet legal obligations. This is kept separately from your regular
            account data and is only accessible to authorized safety staff.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">Who we share data with</h2>
          <p className="text-muted">
            We use a small number of service providers to run WhoWe: Google Firebase for authentication, database,
            and hosting; Resend for transactional email delivery; and ClickSend for phone-number verification by
            text message. These providers process data on our behalf under their own security and privacy
            commitments — we don&apos;t sell your data to anyone, and we don&apos;t share it with advertisers.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">How long we keep it</h2>
          <p className="text-muted">
            We keep your account data for as long as your account is active. If you delete your account, your
            profile, events you host, and your participation records are permanently removed within a short
            time — see &quot;Your rights&quot; below for how to do this. Safety Mode location data follows the
            shorter retention window described above regardless of your account status, and safeguarding records
            are retained separately for as long as needed for safety review and legal obligations.
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
