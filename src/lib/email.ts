import { Resend } from "resend";

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
