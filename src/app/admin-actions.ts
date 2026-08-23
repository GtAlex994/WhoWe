"use server";

import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/firebase-admin";
import { getCurrentUser } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";

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

  revalidatePath("/admin/reports");
}

export async function reopenReport(formData: FormData) {
  await requireAdmin();
  const reportId = String(formData.get("reportId") ?? "");
  if (!reportId) throw new Error("Missing report id");

  await db.doc(`reports/${reportId}`).update({
    status: "open",
    resolvedAt: FieldValue.delete(),
    resolvedBy: FieldValue.delete(),
  });

  revalidatePath("/admin/reports");
}
