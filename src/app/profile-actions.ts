"use server";

import { redirect } from "next/navigation";
import { getCurrentUser, clearCurrentUser } from "@/lib/session";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { isValidMaxDistance } from "@/lib/users";

export async function updateBasicProfile(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required");

  const bio = String(formData.get("bio") ?? "").trim();
  const locationLabel = String(formData.get("locationLabel") ?? "").trim();
  const latRaw = formData.get("latitude");
  const lngRaw = formData.get("longitude");
  const locationLat = latRaw ? Number(latRaw) : null;
  const locationLng = lngRaw ? Number(lngRaw) : null;
  const hasCoords = Number.isFinite(locationLat) && Number.isFinite(locationLng);

  const userRef = db.doc(`users/${user.id}`);
  await userRef.update({
    name,
    bio: bio || null,
    locationLabel: locationLabel || null,
    locationLat: hasCoords ? locationLat : null,
    locationLng: hasCoords ? locationLng : null,
    ...(hasCoords ? { locationVerifiedAt: FieldValue.serverTimestamp() } : {}),
  });

  revalidatePath("/profile");
  redirect("/profile");
}

export async function updateAvatar(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const seed = formData.get("seed");
  const top = formData.get("top");
  const hairColor = formData.get("hairColor");
  const skinColor = formData.get("skinColor");
  const facialHair = formData.get("facialHair");
  const accessories = formData.get("accessories");
  const clothes = formData.get("clothes");
  const clothesColor = formData.get("clothesColor");

  if (!seed || !top || !hairColor || !skinColor || !clothes || !clothesColor) {
    throw new Error("Missing avatar fields.");
  }

  const userRef = db.doc(`users/${user.id}`);
  await userRef.update({
    avatar: {
      style: "avataaars",
      seed: String(seed),
      top: String(top),
      hairColor: String(hairColor),
      skinColor: String(skinColor),
      facialHair: facialHair ? String(facialHair) : "none",
      accessories: accessories ? String(accessories) : "none",
      clothes: String(clothes),
      clothesColor: String(clothesColor),
    },
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

  if (interests.some((i) => dislikes.includes(i))) {
    throw new Error("Something can't be both an interest and something you'd rather avoid.");
  }

  const userRef = db.doc(`users/${user.id}`);
  await userRef.update({
    interests: interests.length > 0 ? interests : null,
    dislikes,
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
  const paceRaw = formData.get("pace");
  const pace = paceRaw ? String(paceRaw).trim().split(",").filter(Boolean) : [];
  const personality = formData.get("personality");
  const availability = formData.get("availability");

  const userRef = db.doc(`users/${user.id}`);
  await userRef.update({
    "socialStyle.groupSize": groupSize || null,
    "socialStyle.planning": planning || null,
    "socialStyle.pace": pace,
    "socialStyle.personality": personality || null,
    availability: availability ? String(availability).trim().split(",").filter(Boolean) : null,
  });

  revalidatePath("/profile");
  redirect("/profile");
}

export async function updateMaxDistance(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const maxDistance = Number(formData.get("maxDistance"));
  if (!isValidMaxDistance(maxDistance)) {
    throw new Error("Search radius must be between 5 and 200 km.");
  }

  const userRef = db.doc(`users/${user.id}`);
  await userRef.update({ "matchingPreferences.maxDistance": maxDistance });

  revalidatePath("/profile");
  redirect("/profile");
}

const TRUSTED_CONTACT_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function updateTrustedContact(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const relationship = String(formData.get("relationship") ?? "").trim();

  if (!name) throw new Error("Enter your trusted contact's name.");
  if (!TRUSTED_CONTACT_EMAIL_RE.test(email)) throw new Error("Enter a valid email address for your trusted contact.");

  const userRef = db.doc(`users/${user.id}`);
  await userRef.update({
    trustedContact: { name, email, relationship: relationship || null },
  });

  revalidatePath("/settings");
  redirect("/settings");
}

export async function removeTrustedContact() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const userRef = db.doc(`users/${user.id}`);
  await userRef.update({ trustedContact: null });

  revalidatePath("/settings");
  redirect("/settings");
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

export async function updateHabits(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const smokingStatus = formData.get("smokingStatus");
  const smokingTolerance = formData.get("smokingTolerance");
  const vapingStatus = formData.get("vapingStatus");
  const vapingTolerance = formData.get("vapingTolerance");
  const alcoholFrequency = formData.get("alcoholFrequency");
  const alcoholEventPreference = formData.get("alcoholEventPreference");
  const dietaryPattern = formData.get("dietaryPattern");
  const allergies = String(formData.get("allergies") ?? "").trim();

  const userRef = db.doc(`users/${user.id}`);
  await userRef.update({
    habits: {
      smoking: { status: smokingStatus || null, tolerance: smokingTolerance || null },
      vaping: { status: vapingStatus || null, tolerance: vapingTolerance || null },
      alcohol: { frequency: alcoholFrequency || null, eventPreference: alcoholEventPreference || null },
    },
    dietary: {
      pattern: dietaryPattern || null,
      allergies: allergies || null,
    },
  });

  revalidatePath("/profile");
  redirect("/profile");
}
