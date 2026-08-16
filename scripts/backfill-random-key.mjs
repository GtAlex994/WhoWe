// One-off script: sets randomKey on any existing users/{uid} doc that's
// missing it. Needed because Wild-event candidate selection queries
// `users` ordered by `randomKey`, and Firestore excludes docs that don't
// have the queried field at all.
//
// Run once against the live project:
//   FIREBASE_SERVICE_ACCOUNT_KEY=... node scripts/backfill-random-key.mjs
// (locally, .env's FIREBASE_SERVICE_ACCOUNT_KEY is picked up automatically
// via the same value already in your .env file)

import { readFileSync } from "fs";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

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

const snap = await db.collection("users").get();
let updated = 0;

for (const doc of snap.docs) {
  if (typeof doc.data().randomKey !== "number") {
    await doc.ref.update({ randomKey: Math.random() });
    updated++;
  }
}

console.log(`Backfilled randomKey on ${updated} of ${snap.size} user(s).`);
