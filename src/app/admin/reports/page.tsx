import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/firebase-admin";
import { getCurrentUser } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";
import { getUsersByIds } from "@/lib/users-server";
import { resolveReport, reopenReport } from "@/app/admin-actions";
import { appendAuditLog } from "@/lib/audit-log";
import { FadeIn } from "@/components/FadeIn";
import { Button } from "@/components/Button";
import type { UserDTO } from "@/lib/users";

type Report = {
  id: string;
  reporterId: string | null;
  targetType: string;
  targetId: string;
  category: string;
  context: string | null;
  status: "open" | "resolved";
  createdAt: Date | null;
  source: "user" | "auto";
  severity: string | null;
};

function formatDate(date: Date | null) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function ReportCard({ report, users }: { report: Report; users: Record<string, UserDTO> }) {
  const reporter = report.reporterId ? users[report.reporterId] : null;
  const target = users[report.targetId];

  return (
    <div className="border-2 border-foreground rounded-lg p-4 bg-surface shadow-[2px_2px_0_0_var(--foreground)] space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-primary">{report.category}</span>
        <span className="text-xs text-muted">{formatDate(report.createdAt)}</span>
      </div>
      {report.source === "auto" ? (
        <p className="text-sm">
          <span className="text-muted">Auto-flagged message from</span>{" "}
          {target ? <span className="font-medium">@{target.username}</span> : <span className="italic text-muted">deleted user</span>}
          {report.severity && (
            <span
              className={`ml-2 text-xs font-medium uppercase ${report.severity === "high" ? "text-[#8c2f2f]" : "text-muted"}`}
            >
              {report.severity} severity
            </span>
          )}
        </p>
      ) : (
        <p className="text-sm">
          <span className="text-muted">Reported:</span>{" "}
          {target ? <span className="font-medium">@{target.username}</span> : <span className="italic text-muted">deleted user</span>}{" "}
          <span className="text-muted">by</span>{" "}
          {reporter ? <span className="font-medium">@{reporter.username}</span> : <span className="italic text-muted">deleted user</span>}
        </p>
      )}
      {report.context && <p className="text-sm text-muted whitespace-pre-wrap">{report.context}</p>}
      <form action={report.status === "open" ? resolveReport : reopenReport}>
        <input type="hidden" name="reportId" value={report.id} />
        <Button
          type="submit"
          variant={report.status === "open" ? "primary" : "secondary"}
          className="text-xs px-3 py-1.5 mt-1"
        >
          {report.status === "open" ? "Mark resolved" : "Reopen"}
        </Button>
      </form>
    </div>
  );
}

export default async function AdminReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!isAdminEmail(user.email)) redirect("/");

  await appendAuditLog({ caseId: null, action: "report_viewed", actorId: user.id, subjectId: null });

  const snap = await db.collection("reports").orderBy("createdAt", "desc").limit(200).get();
  const reports: Report[] = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      reporterId: data.reporterId ?? null,
      targetType: data.targetType,
      targetId: data.targetId,
      category: data.category,
      context: data.context ?? null,
      status: data.status === "resolved" ? "resolved" : "open",
      createdAt: data.createdAt?.toDate() ?? null,
      source: data.source === "auto" ? "auto" : "user",
      severity: data.severity ?? null,
    };
  });

  const userIds = Array.from(new Set(reports.flatMap((r) => [r.reporterId, r.targetId]).filter((id): id is string => !!id)));
  const users = await getUsersByIds(userIds);

  const openReports = reports.filter((r) => r.status === "open");
  const resolvedReports = reports.filter((r) => r.status === "resolved");

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-10 py-10 flex flex-col gap-8">
      <FadeIn>
        <h1 className="text-3xl font-semibold tracking-tight">Reports</h1>
        <p className="text-muted mt-1.5">
          {openReports.length} open · {resolvedReports.length} resolved
        </p>
        <Link href="/admin/audit-log" className="text-sm text-primary hover:underline mt-1.5 inline-block">
          View safeguarding audit log →
        </Link>
      </FadeIn>

      <div className="space-y-3">
        {openReports.length === 0 ? (
          <p className="text-sm text-muted">No open reports.</p>
        ) : (
          openReports.map((r) => <ReportCard key={r.id} report={r} users={users} />)
        )}
      </div>

      {resolvedReports.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted mb-3 uppercase tracking-wide">Resolved</h2>
          <div className="space-y-3">
            {resolvedReports.map((r) => (
              <ReportCard key={r.id} report={r} users={users} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
