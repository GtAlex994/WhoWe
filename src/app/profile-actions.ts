"use server";

import { redirect } from "next/navigation";
import { getCurrentUser, clearCurrentUser } from "@/lib/session";
import { db } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";
import { sanitizeUsername, reserveUsername } from "@/lib/users";

export async function updateBasicProfile(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required");

  const bio = String(formData.get("bio") ?? "").trim();
  const locationLabel = String(formData.get("locationLabel") ?? "").trim();

  const userRef = db.doc(`users/${user.id}`);
  await userRef.update({
    name,
    bio: bio || null,
    locationLabel: locationLabel || null,
  });

  revalidatePath("/profile");
  redirect("/profile");
}

export async function updateInterests(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const interestsRaw = formData.get("interests");
  const dislikesRaw = formData.get("dislikes");

  const interests = interestsRaw ? String(interestsRaw).trim().split(",").filter(Boolean) : [];
  const dislikes = dislikesRaw ? String(dislikesRaw).trim().split(",").filter(Boolean) : [];

  const userRef = db.doc(`users/${user.id}`);
  await userRef.update({
    interests: interests.length > 0 ? interests : null,
    dislikes: dislikes.length > 0 ? dislikes : null,
  });

  revalidatePath("/profile");
  redirect("/profile");
}

export async function updateActivities(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const activitiesRaw = formData.get("activities");
  const activities = activitiesRaw ? String(activitiesRaw).trim().split(",").filter(Boolean) : [];

  const userRef = db.doc(`users/${user.id}`);
  await userRef.update({
    activities: activities.length > 0 ? activities : null,
  });

  revalidatePath("/profile");
  redirect("/profile");
}

export async function updateLanguages(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const languagesRaw = formData.get("languages");
  let languages: Array<{ language: string; proficiency: string }> = [];

  if (languagesRaw) {
    try {
      languages = JSON.parse(String(languagesRaw));
    } catch (e) {
      throw new Error("Invalid languages format");
    }
  }

  const userRef = db.doc(`users/${user.id}`);
  await userRef.update({
    languages: languages.length > 0 ? languages : null,
  });

  revalidatePath("/profile");
  redirect("/profile");
}

export async function updateSocialStyle(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const groupSize = formData.get("groupSize");
  const planning = formData.get("planning");
  const pace = formData.get("pace");
  const personality = formData.get("personality");
  const availability = formData.get("availability");

  const userRef = db.doc(`users/${user.id}`);
  await userRef.update({
    "socialStyle.groupSize": groupSize || null,
    "socialStyle.planning": planning || null,
    "socialStyle.pace": pace || null,
    "socialStyle.personality": personality || null,
    availability: availability ? String(availability).trim().split(",").filter(Boolean) : null,
  });

  revalidatePath("/profile");
  redirect("/profile");
}

export async function updateGoals(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const goalsRaw = formData.get("lookingFor");
  const goals = goalsRaw ? String(goalsRaw).trim().split(",").filter(Boolean) : [];

  const userRef = db.doc(`users/${user.id}`);
  await userRef.update({
    lookingFor: goals.length > 0 ? goals : null,
  });

  revalidatePath("/profile");
  redirect("/profile");
}
