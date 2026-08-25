import { createHash } from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase-admin";

// Append-only safeguarding audit trail: report lifecycle, admin actions on
// reports, Safety Mode start/stop/help requests, and check-out-reminder
// escalation all write here. Each entry links to the previous one via a
// SHA-256 hash chain (see computeEntryHash/verifyAuditChain) — editing or
// deleting a past entry breaks every hash after it, so tampering is
// detectable even though nothing here prevents a Firestore admin from doing
// it (this is tamper-EVIDENT, not tamper-PROOF; real prevention needs
// infra-level controls — IAM restrictions, a separate write-only service
// account — that are an ops decision outside this codebase).
//
// Access control: like every other collection in this app, there are no
// Firestore security rules for this — firestore.rules denies all direct
// client access, and every read here goes through requireAdmin() at the
// call site (see /admin/audit-log).

export type AuditAction =
  | "report_created"
  | "report_auto_flagged"
  | "report_viewed"
  | "report_resolved"
  | "report_reopened"
  | "safety_mode_started"
  | "safety_mode_stopped"
  | "safety_help_requested"
  | "checkout_reminder_sent"
  | "trusted_contact_notified";

export type AuditLogEntry = {
  id: string;
  caseId: string | null;
  action: AuditAction;
  actorId: string | null;
  subjectId: string | null;
  detail: string | null;
  createdAtMs: number;
  createdAt: Date;
  prevHash: string;
  hash: string;
};

export const AUDIT_GENESIS_HASH = "0".repeat(64);

type HashInput = {
  caseId: string | null;
  action: AuditAction;
  actorId: string | null;
  subjectId: string | null;
  detail: string | null;
  createdAtMs: number;
};

export function computeEntryHash(prevHash: string, fields: HashInput): string {
  const payload = JSON.stringify({ prevHash, ...fields });
  return createHash("sha256").update(payload).digest("hex");
}

/**
 * Appends one entry, serialized through a transaction against a single
 * "chain head" doc — a hash chain is only meaningful if appends can't race,
 * so this intentionally does NOT parallelize with other audit writes.
 */
export async function appendAuditLog(entry: {
  caseId: string | null;
  action: AuditAction;
  actorId: string | null;
  subjectId: string | null;
  detail?: string | null;
}): Promise<void> {
  const headRef = db.doc("auditLogMeta/chainHead");
  const entryRef = db.collection("auditLog").doc();

  await db.runTransaction(async (tx) => {
    const headSnap = await tx.get(headRef);
    const prevHash = headSnap.exists ? (headSnap.data()!.hash as string) : AUDIT_GENESIS_HASH;
    const createdAtMs = Date.now();
    const fields: HashInput = {
      caseId: entry.caseId,
      action: entry.action,
      actorId: entry.actorId,
      subjectId: entry.subjectId,
      detail: entry.detail ?? null,
      createdAtMs,
    };
    const hash = computeEntryHash(prevHash, fields);

    tx.set(entryRef, { ...fields, createdAt: FieldValue.serverTimestamp(), prevHash, hash });
    tx.set(headRef, { hash, entryId: entryRef.id, updatedAt: FieldValue.serverTimestamp() });
  });
}

export async function listAuditLog(limit = 500): Promise<AuditLogEntry[]> {
  const snap = await db.collection("auditLog").orderBy("createdAtMs", "asc").limit(limit).get();
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      caseId: data.caseId ?? null,
      action: data.action,
      actorId: data.actorId ?? null,
      subjectId: data.subjectId ?? null,
      detail: data.detail ?? null,
      createdAtMs: data.createdAtMs,
      createdAt: data.createdAt?.toDate() ?? new Date(0),
      prevHash: data.prevHash,
      hash: data.hash,
    };
  });
}

/** Recomputes the chain from entries in ascending createdAtMs order and confirms nothing was altered. */
export function verifyAuditChain(entries: AuditLogEntry[]): { valid: boolean; brokenAtIndex: number | null } {
  let expectedPrev = AUDIT_GENESIS_HASH;
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (e.prevHash !== expectedPrev) return { valid: false, brokenAtIndex: i };
    const recomputed = computeEntryHash(expectedPrev, {
      caseId: e.caseId,
      action: e.action,
      actorId: e.actorId,
      subjectId: e.subjectId,
      detail: e.detail,
      createdAtMs: e.createdAtMs,
    });
    if (recomputed !== e.hash) return { valid: false, brokenAtIndex: i };
    expectedPrev = e.hash;
  }
  return { valid: true, brokenAtIndex: null };
}
