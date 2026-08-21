// Seeds a handful of realistic users, events, and event-chat threads for
// local testing and demoing. Safe to run against the live project (creates
// new Firebase Auth users + Firestore docs; doesn't touch existing data).
//
// Run once against the live project:
//   node scripts/seed-dev-data.mjs
// (locally, .env's FIREBASE_SERVICE_ACCOUNT_KEY is picked up automatically)
//
// To remove everything this script created, see scripts/wipe-db.js or
// delete the printed user/event ids manually via the Firebase console.

import { readFileSync } from "fs";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  }
  const envText = readFileSync(new URL("../.env", import.meta.url), "utf8");
  const match = envText.match(/FIREBASE_SERVICE_ACCOUNT_KEY='(.+)'/s);
  if (!match) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY not found in .env or environment");
  return JSON.parse(match[1]);
}

const app = initializeApp({ credential: cert(loadServiceAccount()) });
const db = getFirestore(app);
const auth = getAuth(app);

// --- Avatar generation (mirrors src/lib/avatars.ts) -----------------------

const AVATAAARS_TOP = {
  male: ["shortFlat", "shortRound", "shortWaved", "shortCurly", "sides", "theCaesar", "theCaesarAndSidePart", "shaggy", "shaggyMullet", "shavedSides"],
  female: ["bigHair", "bob", "bun", "curly", "curvy", "dreads", "frida", "frizzle", "fro", "froBand", "longButNotTooLong", "miaWallace", "straight01", "straight02", "straightAndStrand"],
};
const AVATAAARS_FACIAL_HAIR = ["beardLight", "beardMajestic", "beardMedium", "moustacheFancy", "moustacheMagnum"];
const AVATAAARS_ACCESSORIES = ["eyepatch", "kurt", "prescription01", "prescription02", "round", "sunglasses", "wayfarers"];
const AVATAAARS_CLOTHES = ["blazerAndShirt", "blazerAndSweater", "collarAndSweater", "graphicShirt", "hoodie", "overall", "shirtCrewNeck", "shirtScoopNeck", "shirtVNeck"];
const AVATAAARS_HAIR_COLORS = ["#a55728", "#2c1b18", "#b58143", "#d6b370", "#724133", "#4a312c", "#f59797", "#ecdcbf", "#c93305", "#e8e1e1"];
const AVATAAARS_SKIN_TONES = ["#614335", "#d08b5b", "#ae5d29", "#edb98a", "#ffdbb4", "#fd9841", "#f8d25c"];
const AVATAAARS_CLOTHES_COLORS = ["#262e33", "#65c9ff", "#5199e4", "#25557c", "#e6e6e6", "#929598", "#3c4f5c", "#b1e2ff", "#a7ffc4", "#ffafb9", "#ffffb1", "#ff488e", "#ff5c5c", "#ffffff"];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAvatar(gender, seed) {
  return {
    style: "avataaars",
    seed,
    top: pick(AVATAAARS_TOP[gender]),
    hairColor: pick(AVATAAARS_HAIR_COLORS),
    skinColor: pick(AVATAAARS_SKIN_TONES),
    facialHair: gender === "male" && Math.random() < 0.4 ? pick(AVATAAARS_FACIAL_HAIR) : "none",
    accessories: Math.random() < 0.3 ? pick(AVATAAARS_ACCESSORIES) : "none",
    clothes: pick(AVATAAARS_CLOTHES),
    clothesColor: pick(AVATAAARS_CLOTHES_COLORS),
  };
}

function generateUserId() {
  return String(Math.floor(1000000 + Math.random() * 9000000));
}

// --- Seed user definitions --------------------------------------------------

const USERS = [
  {
    name: "Jamie Chen", username: "jamiec", gender: "male",
    bio: "New to Adelaide, keen to explore the beaches and meet new people.",
    location: { label: "Glenelg, South Australia, Australia", lat: -34.9803, lng: 138.5145 },
    interests: ["Surfing", "Swimming", "Volleyball"], activities: ["Beach", "Coffee", "Swimming"],
    languages: [{ language: "English", proficiency: "Native" }, { language: "Mandarin", proficiency: "Conversational" }],
    socialStyle: { groupSize: "4–6 people", planning: "Spontaneous", pace: ["Active", "Social"], personality: "Extrovert" },
    lookingFor: ["Make new friends", "Explore the city"],
  },
  {
    name: "Priya Natarajan", username: "priyan", gender: "female",
    bio: "Foodie and bookworm. Always up for trying a new cafe.",
    location: { label: "Norwood, South Australia, Australia", lat: -34.9166, lng: 138.6335 },
    interests: ["Yoga", "Climbing", "Pilates"], activities: ["Coffee", "Restaurants", "Markets"],
    languages: [{ language: "English", proficiency: "Fluent" }, { language: "Hindi", proficiency: "Native" }],
    socialStyle: { groupSize: "2–3 people", planning: "Well planned", pace: ["Relaxed"], personality: "Introvert" },
    lookingFor: ["Find people with shared interests", "Language exchange"],
  },
  {
    name: "Marcus Webb", username: "marcusw", gender: "male",
    bio: "Weekend hiker and amateur photographer.",
    location: { label: "Unley, South Australia, Australia", lat: -34.95, lng: 138.6076 },
    interests: ["Hiking", "Cycling", "Fishing"], activities: ["Hiking", "Photography", "Road Trips"],
    languages: [{ language: "English", proficiency: "Native" }],
    socialStyle: { groupSize: "7–10 people", planning: "Few days ahead", pace: ["Adventurous", "Active"], personality: "Somewhere in-between" },
    lookingFor: ["Try new activities", "Build a regular social circle"],
  },
  {
    name: "Sofia Ricci", username: "sofiar", gender: "female",
    bio: "Board game nerd and trivia night regular.",
    location: { label: "Prospect, South Australia, Australia", lat: -34.8791, lng: 138.592 },
    interests: ["Martial Arts", "Boxing", "Tennis"], activities: ["Board Games", "Gaming", "Movies"],
    languages: [{ language: "English", proficiency: "Fluent" }, { language: "Italian", proficiency: "Native" }],
    socialStyle: { groupSize: "4–6 people", planning: "Spontaneous", pace: ["Social"], personality: "Extrovert" },
    lookingFor: ["Join casual local plans", "Attend small-group events"],
  },
  {
    name: "David Okafor", username: "davido", gender: "male",
    bio: "Runner training for my first marathon.",
    location: { label: "Burnside, South Australia, Australia", lat: -34.9394, lng: 138.6367 },
    interests: ["Running", "Cricket", "Basketball"], activities: ["Gym", "Sports", "Walking"],
    languages: [{ language: "English", proficiency: "Native" }],
    socialStyle: { groupSize: "2–3 people", planning: "Well planned", pace: ["Active"], personality: "Somewhere in-between" },
    lookingFor: ["Make new friends"],
  },
  {
    name: "Grace Kim", username: "gracek", gender: "female",
    bio: "Music lover, always at the next gig.",
    location: { label: "Henley Beach, South Australia, Australia", lat: -34.9158, lng: 138.4953 },
    interests: ["Swimming", "Golf", "Pilates"], activities: ["Concerts", "Nightlife", "Shopping"],
    languages: [{ language: "English", proficiency: "Fluent" }, { language: "Korean", proficiency: "Native" }],
    socialStyle: { groupSize: "10+ people", planning: "Spontaneous", pace: ["Social", "Adventurous"], personality: "Extrovert" },
    lookingFor: ["Explore the city", "Try new activities"],
  },
  {
    name: "Ethan Brooks", username: "ethanb", gender: "male",
    bio: "Cooking enthusiast, host of the occasional dinner party.",
    location: { label: "North Adelaide, South Australia, Australia", lat: -34.9058, lng: 138.5959 },
    interests: ["Golf", "Fishing", "Cycling"], activities: ["Cooking", "Restaurants", "Travel"],
    languages: [{ language: "English", proficiency: "Native" }, { language: "French", proficiency: "Learning" }],
    socialStyle: { groupSize: "4–6 people", planning: "Well planned", pace: ["Relaxed"], personality: "Introvert" },
    lookingFor: ["Host events", "Find people with shared interests"],
  },
  {
    name: "Nadia Farouk", username: "nadiaf", gender: "female",
    bio: "Language exchange enthusiast, learning Spanish.",
    location: { label: "Adelaide, South Australia, Australia", lat: -34.9285, lng: 138.6007 },
    interests: ["Yoga", "Climbing", "Swimming"], activities: ["Yoga", "Travel", "Markets"],
    languages: [{ language: "English", proficiency: "Fluent" }, { language: "Arabic", proficiency: "Native" }, { language: "Spanish", proficiency: "Learning" }],
    socialStyle: { groupSize: "2–3 people", planning: "Few days ahead", pace: ["Relaxed", "Social"], personality: "Somewhere in-between" },
    lookingFor: ["Language exchange", "Make new friends"],
  },
];

async function createSeedUser(def) {
  const email = `${def.username}.seed@example.com`;
  let uid;
  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
    console.log(`User ${def.username} already exists (${uid}), reusing.`);
  } catch {
    const created = await auth.createUser({ email, emailVerified: true, displayName: def.name });
    uid = created.uid;
  }

  const userId = generateUserId();
  const avatar = randomAvatar(def.gender, Math.random().toString(36).slice(2, 8));

  await db.doc(`users/${uid}`).set({
    name: def.name,
    email,
    username: def.username,
    userId,
    avatar,
    gender: def.gender,
    bio: def.bio,
    locationLabel: def.location.label,
    locationLat: def.location.lat,
    locationLng: def.location.lng,
    locationPrecision: "suburb-and-city",
    locationVerifiedAt: FieldValue.serverTimestamp(),
    interests: def.interests,
    activities: def.activities,
    dislikes: [],
    languages: def.languages,
    socialStyle: {
      groupSize: def.socialStyle.groupSize,
      planning: def.socialStyle.planning,
      pace: def.socialStyle.pace,
      personality: def.socialStyle.personality,
    },
    lookingFor: def.lookingFor,
    matchingPreferences: {
      ageRange: null,
      maxDistance: 50,
      groupSize: null,
      preferredLanguages: def.languages.map((l) => l.language),
      eventTypes: [],
    },
    onboardingConsent: {
      termsAcceptedAt: FieldValue.serverTimestamp(),
      safetyAcknowledgedAt: FieldValue.serverTimestamp(),
    },
    onboardingCompletedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
    notifyEmail: true,
    randomKey: Math.random(),
    hostRatingSum: 0,
    hostRatingCount: 0,
    eventsAttended: Math.floor(Math.random() * 5),
    eventsHosted: Math.floor(Math.random() * 3),
  }, { merge: true });

  await db.doc(`usernames/${def.username}`).set({ uid });
  await db.doc(`userIds/${userId}`).set({ uid });

  console.log(`Seeded user @${def.username} (${uid})`);
  return { uid, ...def };
}

// --- Main -------------------------------------------------------------------

async function main() {
  const CURRENT_USER_UID = "LZZS9EywXdSfuAFXyBtwv04RrMC3"; // Testy Tester — the signed-in dev account

  const seeded = [];
  for (const def of USERS) {
    seeded.push(await createSeedUser(def));
  }
  const byUsername = Object.fromEntries(seeded.map((u) => [u.username, u]));

  const now = Date.now();
  const days = (n) => new Date(now + n * 24 * 60 * 60 * 1000);

  const EVENTS = [
    {
      title: "Sunset Beach Volleyball", category: "Sports",
      description: "Casual beach volleyball at Glenelg, all skill levels welcome. Bring water and sunscreen.",
      location: "Glenelg Beach, South Australia", latitude: -34.9803, longitude: 138.5145,
      startsAt: days(3), creatorUsername: "jamiec",
      attendeeUsernames: ["davido", "gracek"], includeCurrentUser: true,
      chat: [
        { from: "jamiec", text: "Looking forward to this! Weather's meant to be great." },
        { from: "davido", text: "Same, bringing a spare ball just in case." },
        { from: "current", text: "Count me in, first time playing beach volleyball!" },
        { from: "gracek", text: "No worries, we'll keep it casual 🙂" },
      ],
    },
    {
      title: "Trivia Night at The Exeter", category: "Games",
      description: "Team trivia, we'll split into groups on the night. Prizes for the winning table.",
      location: "The Exeter Hotel, Adelaide", latitude: -34.9218, longitude: 138.6068,
      startsAt: days(5), creatorUsername: "sofiar",
      attendeeUsernames: ["marcusw", "nadiaf"], includeCurrentUser: true,
      chat: [
        { from: "sofiar", text: "Doors open at 7, trivia starts at 7:30!" },
        { from: "current", text: "What's our team name going to be?" },
        { from: "nadiaf", text: "Quiztopher Nolan?" },
        { from: "marcusw", text: "Haha, sold." },
      ],
    },
    {
      title: "Morning Hike - Waterfall Gully", category: "Outdoors",
      description: "Early hike up to Mount Lofty via Waterfall Gully. Moderate difficulty, ~2 hours.",
      location: "Waterfall Gully, Adelaide", latitude: -34.965, longitude: 138.68,
      startsAt: days(7), creatorUsername: "marcusw",
      attendeeUsernames: ["ethanb", "priyan"], includeCurrentUser: false,
      chat: [],
    },
    {
      title: "Book Club: Monthly Meetup", category: "Books & Learning",
      description: "This month we're discussing our latest pick over coffee. New members welcome.",
      location: "Matilda Bookshop Cafe, Norwood", latitude: -34.9166, longitude: 138.6335,
      startsAt: days(10), creatorUsername: "priyan",
      attendeeUsernames: ["nadiaf", "gracek"], includeCurrentUser: false,
      chat: [],
    },
    {
      title: "Dinner Party: Italian Night", category: "Food & Drink",
      description: "A relaxed group dinner, home-style Italian menu. Let me know any dietary needs.",
      location: "La Trattoria, Adelaide", latitude: -34.9235, longitude: 138.598,
      startsAt: days(12), creatorUsername: "ethanb",
      attendeeUsernames: ["jamiec", "sofiar", "davido"], includeCurrentUser: true,
      chat: [
        { from: "ethanb", text: "Menu's set, focaccia and a slow-cooked ragu. Let me know about allergies." },
        { from: "current", text: "Sounds amazing, no allergies here!" },
        { from: "sofiar", text: "Can't wait, been ages since good Italian." },
      ],
    },
    {
      title: "Coffee & Board Games", category: "Games",
      description: "Chill afternoon with coffee and a rotating stack of board games. Drop in any time.",
      location: "The Rev Coffee, Adelaide", latitude: -34.926, longitude: 138.6015,
      startsAt: days(4), creatorUsername: "current",
      attendeeUsernames: ["sofiar", "priyan", "gracek"], includeCurrentUser: true,
      chat: [
        { from: "current", text: "I'll bring Catan and a couple of card games." },
        { from: "priyan", text: "I can bring Codenames if people are up for it." },
        { from: "gracek", text: "Yes please, love that one." },
      ],
    },
    {
      title: "Sunday Park Run", category: "Sports",
      description: "Easy 5k loop around Rymill Park, followed by coffee. All paces welcome.",
      location: "Rymill Park, Adelaide", latitude: -34.9211, longitude: 138.6099,
      startsAt: days(-2), creatorUsername: "current",
      attendeeUsernames: ["davido", "jamiec", "marcusw"], includeCurrentUser: true,
      chat: [],
    },
  ];

  for (const evt of EVENTS) {
    const creatorUid = evt.creatorUsername === "current" ? CURRENT_USER_UID : byUsername[evt.creatorUsername].uid;

    const eventRef = db.collection("events").doc();
    const attendeeUids = evt.attendeeUsernames.map((u) => byUsername[u].uid);
    if (evt.includeCurrentUser && evt.creatorUsername !== "current") attendeeUids.push(CURRENT_USER_UID);

    const allAttendeeUids = [creatorUid, ...attendeeUids];

    await eventRef.set({
      title: evt.title,
      description: evt.description,
      location: evt.location,
      latitude: evt.latitude,
      longitude: evt.longitude,
      startsAt: evt.startsAt,
      category: evt.category,
      creatorId: creatorUid,
      createdAt: FieldValue.serverTimestamp(),
      attendeeCount: allAttendeeUids.length,
      ratingSum: 0,
      ratingCount: 0,
      isWild: false,
    });

    await Promise.all(
      allAttendeeUids.map((uid) =>
        eventRef.collection("attendees").doc(uid).set({
          userId: uid,
          status: "joined",
          joinedAt: FieldValue.serverTimestamp(),
          eventTitle: evt.title,
          eventStartsAt: evt.startsAt,
          eventCategory: evt.category,
          eventCreatorId: creatorUid,
        }),
      ),
    );

    if (evt.chat.length > 0) {
      let t = evt.startsAt.getTime() - 2 * 24 * 60 * 60 * 1000;
      for (const msg of evt.chat) {
        const senderId = msg.from === "current" ? CURRENT_USER_UID : byUsername[msg.from].uid;
        const senderName = msg.from === "current" ? "Testy Tester" : byUsername[msg.from].name;
        await eventRef.collection("messages").add({
          senderId,
          senderName,
          content: msg.text,
          createdAt: new Date(t),
        });
        t += 15 * 60 * 1000; // stagger messages 15 min apart
      }
    }

    console.log(`Seeded event "${evt.title}" (${eventRef.id}) with ${allAttendeeUids.length} attendees, ${evt.chat.length} messages`);
  }

  console.log("\nDone. Seeded", seeded.length, "users and", EVENTS.length, "events.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
