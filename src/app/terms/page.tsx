import { FadeIn } from "@/components/FadeIn";

const SECTIONS = [
  {
    title: "1. Who this agreement is with",
    body: "These Terms of Service (\"Terms\") govern your use of WhoWe (\"WhoWe\", \"we\", \"us\"), a platform for organizing and joining small, real-world meetups. By creating an account or using WhoWe, you agree to these Terms and to our Privacy Policy.",
  },
  {
    title: "2. Eligibility",
    body: "You must be at least 18 years old to create a WhoWe account. By registering, you confirm that you meet this requirement and that the birthdate you provide is accurate. We may suspend or remove accounts that we believe belong to someone under this age.",
  },
  {
    title: "3. Your account",
    body: "You're responsible for the activity on your account and for keeping your sign-in access secure. Your display name is private; other members know you by your username. Don't impersonate another person, create a fake profile, or maintain more than one account.",
  },
  {
    title: "4. Self-declared information and gender-restricted events",
    body: "Gender and other personal attributes you provide are self-declared and are not independently verified by WhoWe. Some events may be restricted to a specific gender; eligibility for those events relies entirely on what you've declared. Misrepresenting this information to join a restricted event is a violation of these Terms and may result in removal from the event and suspension of your account.",
  },
  {
    title: "5. Real-world meetups — read this carefully",
    body: "WhoWe helps you find and organize in-person events with people you may not know. We do not perform background checks, verify identities, or screen members or events. You are solely responsible for your own safety and judgment when deciding whether to attend, host, or continue participating in any event. Follow the practices in our Community Guidelines — meet in public places, tell someone your plans, and trust your instincts. WhoWe is not involved in and has no control over what happens at an event, and is not responsible for the conduct of any member, online or in person.",
  },
  {
    title: "6. Optional safety features",
    body: "WhoWe offers optional tools — including Safety Mode and trusted-contact notifications — that can privately record your approximate location during an event or notify a contact you choose. These features are off by default, best-effort, and depend on your device and browser staying active and connected. They do not guarantee monitoring, notification delivery, or emergency assistance, and WhoWe does not contact emergency services on your behalf under any circumstance. If you're in danger, contact emergency services directly.",
  },
  {
    title: "7. Acceptable use",
    body: "Don't use WhoWe to harass, threaten, or endanger others; post spam, fraudulent listings, or illegal content; scrape or misuse other members' data; or interfere with the operation of the service. We can remove content, cancel events, or suspend or terminate accounts that violate these Terms or our Community Guidelines, with or without notice.",
  },
  {
    title: "8. Reporting and blocking",
    body: "If you feel unsafe or encounter behavior that violates these Terms, use the in-app report and block tools, or contact us directly. Blocking limits what a blocked member can see of you and, where noted, what events you're matched into together — it does not retroactively remove you from an event or conversation you already share. Reports are reviewed by our team; we can't guarantee a specific outcome or timeline, but every report is read. Messages you send may be automatically screened for shared contact information and clearly unsafe content before sending, as described in our Privacy Policy.",
  },
  {
    title: "9. Content you post",
    body: "You keep ownership of the content you post (profile info, event listings, messages, ratings). By posting it, you give WhoWe a license to display and distribute it as needed to operate the service — for example, showing your event to other members. Don't post content you don't have the right to share.",
  },
  {
    title: "10. Service \"as is\"",
    body: "WhoWe is an early-stage product and is provided \"as is\" without warranties of any kind, express or implied. We don't guarantee the service will be uninterrupted, error-free, or secure, and features may change or be removed as the product evolves.",
  },
  {
    title: "11. Limitation of liability",
    body: "To the fullest extent permitted by law, WhoWe and its team are not liable for any indirect, incidental, or consequential damages arising from your use of the service, or for the actions of any member at an event or elsewhere. This includes, without limitation, any injury, loss, or dispute arising from an in-person meetup organized through WhoWe.",
  },
  {
    title: "12. Ending your account",
    body: "You can delete your account at any time from Settings — this permanently removes your profile, your events, and your participation records. We may suspend or terminate accounts that violate these Terms.",
  },
  {
    title: "13. Changes to these Terms",
    body: "We may update these Terms as WhoWe evolves. If we make a material change, we'll make a reasonable effort to let members know before it takes effect. Continuing to use WhoWe after a change means you accept the updated Terms.",
  },
  {
    title: "14. Contact",
    body: "Questions about these Terms? Reach out through the contact details on your account settings page.",
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 flex flex-col gap-8">
      <FadeIn>
        <h1 className="text-4xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="text-muted mt-4 text-lg">
          The agreement between you and WhoWe. Please read it, especially the section on real-world meetups.
        </p>
      </FadeIn>

      <div className="space-y-6 text-sm leading-relaxed">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="font-semibold text-base mb-2">{s.title}</h2>
            <p className="text-muted">{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
