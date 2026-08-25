import { NextRequest, NextResponse } from "next/server";
import { runCheckoutReminderSweep } from "@/lib/safety";

// Not wired to any schedule by this codebase — an external scheduler (Cloud
// Scheduler, cron-job.org, a GitHub Actions cron workflow, etc.) needs to be
// configured to hit this endpoint periodically (every 30-60 minutes is
// reasonable given the 4h/2h thresholds in safety.ts) with the CRON_SECRET
// below. That's a one-time ops step outside this repo; nothing here claims
// check-out reminders are live until that's done.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("CRON_SECRET is not set; refusing to run the checkout-reminder sweep.");
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const provided = request.nextUrl.searchParams.get("secret") ?? request.headers.get("x-cron-secret");
  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runCheckoutReminderSweep();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Checkout-reminder sweep failed:", error);
    return NextResponse.json({ error: "Sweep failed" }, { status: 500 });
  }
}
