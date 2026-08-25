import { describe, it, expect } from "vitest";
import { computeEntryHash, verifyAuditChain, AUDIT_GENESIS_HASH, type AuditLogEntry } from "./audit-log";

function buildChain(
  actions: Array<{ action: AuditLogEntry["action"]; actorId: string | null; subjectId: string | null }>,
): AuditLogEntry[] {
  const entries: AuditLogEntry[] = [];
  let prevHash = AUDIT_GENESIS_HASH;
  let ms = 1_700_000_000_000;
  for (const a of actions) {
    const fields = { caseId: "case-1", action: a.action, actorId: a.actorId, subjectId: a.subjectId, detail: null, createdAtMs: ms };
    const hash = computeEntryHash(prevHash, fields);
    entries.push({ id: `entry-${ms}`, createdAt: new Date(ms), ...fields, prevHash, hash });
    prevHash = hash;
    ms += 1000;
  }
  return entries;
}

describe("verifyAuditChain", () => {
  it("accepts an untouched chain", () => {
    const chain = buildChain([
      { action: "report_created", actorId: "user-1", subjectId: "user-2" },
      { action: "report_viewed", actorId: "admin-1", subjectId: null },
      { action: "report_resolved", actorId: "admin-1", subjectId: null },
    ]);
    expect(verifyAuditChain(chain)).toEqual({ valid: true, brokenAtIndex: null });
  });

  it("accepts an empty chain", () => {
    expect(verifyAuditChain([])).toEqual({ valid: true, brokenAtIndex: null });
  });

  it("detects a tampered field in an old entry", () => {
    const chain = buildChain([
      { action: "report_created", actorId: "user-1", subjectId: "user-2" },
      { action: "report_resolved", actorId: "admin-1", subjectId: null },
    ]);
    // Someone edits history — e.g. changing who actually resolved it —
    // without recomputing hashes.
    chain[0] = { ...chain[0], actorId: "someone-else" };
    const result = verifyAuditChain(chain);
    expect(result.valid).toBe(false);
    expect(result.brokenAtIndex).toBe(0);
  });

  it("detects a deleted entry (chain gap)", () => {
    const chain = buildChain([
      { action: "report_created", actorId: "user-1", subjectId: "user-2" },
      { action: "report_viewed", actorId: "admin-1", subjectId: null },
      { action: "report_resolved", actorId: "admin-1", subjectId: null },
    ]);
    const withGap = [chain[0], chain[2]]; // middle entry silently removed
    const result = verifyAuditChain(withGap);
    expect(result.valid).toBe(false);
    expect(result.brokenAtIndex).toBe(1);
  });

  it("detects a hash forged to match a tampered field", () => {
    const chain = buildChain([{ action: "safety_help_requested", actorId: "user-1", subjectId: "user-1" }]);
    // Tamper the field AND recompute a self-consistent-looking hash from
    // wrong prevHash bookkeeping (simulates a sloppy forgery attempt).
    chain[0] = { ...chain[0], action: "report_viewed", hash: "deadbeef".repeat(8) };
    expect(verifyAuditChain(chain).valid).toBe(false);
  });
});
