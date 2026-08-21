"use server";

import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/firebase-admin";
import { getCurrentUser } from "@/lib/session";
import { getUserByUsername } from "@/lib/users-server";
import { blockDocRef } from "@/lib/moderation";
import { REPORT_CATEGORIES } from "@/lib/moderation-constants";

async function resolveTarget(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");

  const targetUsername = String(formData.get("targetUsername") ?? "");
  const target = targetUsername ? await getUserByUsername(targetUsername) : null;
  if (!target || target.id === user.id) throw new Error("Invalid member");

  return { user, target };
}

export async function blockUser(formData: FormData) {
  const { user, target } = await resolveTarget(formData);

  await blockDocRef(user.id, target.id).set({
    blockerId: user.id,
    blockedId: target.id,
    createdAt: FieldValue.serverTimestamp(),
  });

  revalidatePath("/profile/[username]", "page");
  revalidatePath("/profile/blocked");
}

export async function unblockUser(formData: FormData) {
  const { user, target } = await resolveTarget(formData);

  await blockDocRef(user.id, target.id).delete();

  revalidatePath("/profile/[username]", "page");
  revalidatePath("/profile/blocked");
}

export async function reportUser(formData: FormData) {
  const { user, target } = await resolveTarget(formData);

  const category = String(formData.get("category") ?? "");
  const context = String(formData.get("context") ?? "").trim().slice(0, 1000);
  if (!REPORT_CATEGORIES.includes(category)) throw new Error("Choose a reason for the report.");

  await db.collection("reports").add({
    reporterId: user.id,
    targetType: "user",
    targetId: target.id,
    category,
    context: context || null,
    status: "open",
    createdAt: FieldValue.serverTimestamp(),
  });
}
