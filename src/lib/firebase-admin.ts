import { cert, getApps, getApp, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Local dev has no ambient Google credentials, so it needs an explicit
// service account key. On Firebase App Hosting the backend already runs as
// a service account with project access, so Application Default Credentials
// (no explicit `credential`) picks that up automatically.
const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const app = getApps().length
  ? getApp()
  : initializeApp(raw ? { credential: cert(JSON.parse(raw)) } : {});

export const db = getFirestore(app);
export const auth = getAuth(app);
