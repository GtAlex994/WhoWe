import { Resend } from "resend";

// Every email template in this app interpolates user-controlled strings
// (event titles, locations, usernames) directly into the html body — escape
// them at the interpolation site with this before embedding. Matters most
// for values that end up in an email sent to someone who never signed up
// for WhoWe at all (a trusted contact): an event host fully controls their
// event's title, so an unescaped title is a live HTML-injection/phishing
// vector into a stranger's inbox, not just a cosmetic issue.
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Best-effort notification sending: logs and swallows failures rather than
// throwing, since a notification email should never break the action (join,
// invite, ...) that triggered it.
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  if (!resendApiKey) {
    console.error("RESEND_API_KEY is not set; skipping email:", subject);
    return;
  }

  try {
    const resend = new Resend(resendApiKey);
    const result = await resend.emails.send({
      from: "WhoWe <noreply@whowe.live>",
      to,
      subject,
      html,
    });
    if (result.error) {
      console.error("Resend API error:", result.error);
    }
  } catch (error) {
    console.error("Failed to send email:", error);
  }
}
