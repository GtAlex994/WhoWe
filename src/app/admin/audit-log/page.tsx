import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";
import { getUsersByIds } from "@/lib/users-server";
import { listAuditLog, verifyAuditChain, type AuditLogEntry } from "@/lib/audit-log";
import { FadeIn } from "@/components/FadeIn";
import type { UserDTO } from "@/lib/users";

const ACTION_LABELS: Record<AuditLogEntry["action"], string> = {
  report_created: "Report filed",
  report_auto_flagged: "Auto-flagged by Communication Safety Shield",
  report_viewed: "Report queue viewed",
  report_resolved: "Report resolved",
  report_reopened: "Report reopened",
  safety_mode_started: "Safety Mode started",
  safety_mode_stopped: "Safety Mode stopped",
  safety_help_requested: "\"I need help\" triggered",
  checkout_reminder_sent: "Check-out reminder sent",
  trusted_contact_notified: "Trusted contact notified",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "medium" }).format(date);
}

function personLabel(id: string | null, users: Record<string, UserDTO>) {
  if (!id) return "System";
  const u = users[id];
  return u?.username ? `@${u.username}` : id.slice(0, 8);
}

export default async function AdminAuditLogPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!isAdminEmail(user.email)) redirect("/");

  const entries = await listAuditLog();
  const verification = verifyAuditChain(entries);

  const userIds = Array.from(
    new Set(entries.flatMap((e) => [e.actorId, e.subjectId]).filter((id): id is string => !!id)),
  );
  const users = await getUsersByIds(userIds);

  const reversed = [...entries].reverse();

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-10 flex flex-col gap-8">
      <FadeIn>
        <Link href="/admin/reports" className="text-sm text-primary hover:underline">
          ← Reports queue
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight mt-2">Safeguarding audit log</h1>
        <p className="text-muted mt-1.5">
          Append-only record of report activity, Safety Mode events, and check-out escalation.
          {entries.length} entries.
        </p>
        <div
          className={`mt-4 inline-flex items-center gap-2 text-sm font-medium rounded-md border-2 px-3 py-1.5 ${
            verification.valid ? "border-accent text-accent" : "border-[#8c2f2f] text-[#8c2f2f]"
          }`}
        >
          {verification.valid
            ? "✓ Chain verified — no entries altered or missing"
            : `✗ Chain broken at entry ${verification.brokenAtIndex} — history may have been altered`}
        </div>
      </FadeIn>

      <FadeIn delay={0.06}>
        <div className="space-y-2">
          {reversed.length === 0 ? (
            <p className="text-sm text-muted">No audit entries yet.</p>
          ) : (
            reversed.map((e) => (
              <div key={e.id} className="border-2 border-foreground rounded-lg p-3 bg-surface text-sm">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-medium">{ACTION_LABELS[e.action] ?? e.action}</span>
                  <span className="text-xs text-muted">{formatDate(e.createdAt)}</span>
                </div>
                <div className="text-muted mt-1">
                  {e.actorId && <span>by {personLabel(e.actorId, users)}</span>}
                  {e.subjectId && <span> · about {personLabel(e.subjectId, users)}</span>}
                  {e.caseId && <span> · case {e.caseId.slice(0, 8)}</span>}
                </div>
                {e.detail && <div className="text-xs text-muted mt-1">{e.detail}</div>}
                <div className="text-[10px] text-muted/70 mt-1.5 font-mono truncate">hash {e.hash}</div>
              </div>
            ))
          )}
        </div>
      </FadeIn>
    </div>
  );
}
