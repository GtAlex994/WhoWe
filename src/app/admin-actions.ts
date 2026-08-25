"use server";

import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/firebase-admin";
import { getCurrentUser } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";
import { appendAuditLog } from "@/lib/audit-log";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !isAdminEmail(user.email)) throw new Error("Not authorized");
  return user;
}

export async function resolveReport(formData: FormData) {
  const admin = await requireAdmin();
  const reportId = String(formData.get("reportId") ?? "");
  if (!reportId) throw new Error("Missing report id");

  await db.doc(`reports/${reportId}`).update({
    status: "resolved",
    resolvedAt: FieldValue.serverTimestamp(),
    resolvedBy: admin.id,
  });
  await appendAuditLog({ caseId: reportId, action: "report_resolved", actorId: admin.id, subjectId: null });

  revalidatePath("/admin/reports");
}

export async function reopenReport(formData: FormData) {
  const admin = await requireAdmin();
  const reportId = String(formData.get("reportId") ?? "");
  if (!reportId) throw new Error("Missing report id");

  await db.doc(`reports/${reportId}`).update({
    status: "open",
    resolvedAt: FieldValue.delete(),
    resolvedBy: FieldValue.delete(),
  });
  await appendAuditLog({ caseId: reportId, action: "report_reopened", actorId: admin.id, subjectId: null });

  revalidatePath("/admin/reports");
}
