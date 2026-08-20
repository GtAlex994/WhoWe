#!/usr/bin/env node

/**
 * WARNING: This script permanently deletes ALL users from Firebase
 * Run with: node scripts/delete-all-users.js
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import admin from "firebase-admin";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  readFileSync(path.join(__dirname, "../firebase-service-account.json"), "utf8"),
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();
const db = admin.firestore();

async function deleteAllUsers() {
  console.log("🚨 Starting deletion of ALL Firebase users...\n");

  let deletedCount = 0;
  let totalCount = 0;

  try {
    // Get all users from Firebase Auth (paginated)
    let pageToken;
    do {
      const result = await auth.listUsers(1000, pageToken);
      totalCount += result.users.length;

      console.log(`Processing ${result.users.length} users...`);

      for (const user of result.users) {
        try {
          // Delete from Firestore
          await db.doc(`users/${user.uid}`).delete();

          // Delete from Firebase Auth
          await auth.deleteUser(user.uid);

          deletedCount++;
          process.stdout.write(`\rDeleted: ${deletedCount}/${totalCount}`);
        } catch (error) {
          console.error(`\nError deleting user ${user.uid}:`, error.message);
        }
      }

      pageToken = result.pageToken;
    } while (pageToken);

    console.log(`\n\n✅ Successfully deleted ${deletedCount} users from Firebase\n`);
  } catch (error) {
    console.error("\n❌ Error during deletion:", error.message);
    process.exit(1);
  }

  process.exit(0);
}

deleteAllUsers();
