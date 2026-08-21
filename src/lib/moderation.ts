import { db } from "@/lib/firebase-admin";

export type BlockStatus = "none" | "blockedByViewer" | "blockedByTarget";

function blockDocId(blockerId: string, blockedId: string) {
  return `${blockerId}_${blockedId}`;
}

export function blockDocRef(blockerId: string, blockedId: string) {
  return db.doc(`blocks/${blockDocId(blockerId, blockedId)}`);
}

/** Resolves the block relationship between a viewer and a profile they're looking at. */
export async function getBlockStatus(viewerId: string, targetId: string): Promise<BlockStatus> {
  if (viewerId === targetId) return "none";

  const [viewerBlockedTarget, targetBlockedViewer] = await Promise.all([
    blockDocRef(viewerId, targetId).get(),
    blockDocRef(targetId, viewerId).get(),
  ]);
  if (viewerBlockedTarget.exists) return "blockedByViewer";
  if (targetBlockedViewer.exists) return "blockedByTarget";
  return "none";
}

/** IDs with any block relationship (either direction) with `userId` — for excluding from matching/discovery. */
export async function getBlockedUserIds(userId: string): Promise<Set<string>> {
  const [asBlocker, asBlocked] = await Promise.all([
    db.collection("blocks").where("blockerId", "==", userId).get(),
    db.collection("blocks").where("blockedId", "==", userId).get(),
  ]);
  const ids = new Set<string>();
  asBlocker.docs.forEach((d) => ids.add(d.data().blockedId));
  asBlocked.docs.forEach((d) => ids.add(d.data().blockerId));
  return ids;
}

export async function getBlockedByUser(userId: string): Promise<{ id: string; blockedAt: Date }[]> {
  const snap = await db.collection("blocks").where("blockerId", "==", userId).get();
  return snap.docs
    .map((d) => ({ id: d.data().blockedId as string, blockedAt: d.data().createdAt?.toDate() ?? new Date(0) }))
    .sort((a, b) => b.blockedAt.getTime() - a.blockedAt.getTime());
}
