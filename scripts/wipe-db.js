#!/usr/bin/env node

/**
 * WARNING: This script permanently deletes ALL data from Firestore.
 * Only use this in development environments!
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';
import * as path from 'path';

const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('ERROR: firebase-service-account.json not found');
  console.error('This file is required for database access');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();
const auth = getAuth();

async function deleteAllUsers() {
  console.log('🗑️  Deleting all users from Firestore...');
  const usersSnapshot = await db.collection('users').get();

  for (const doc of usersSnapshot.docs) {
    await doc.ref.delete();
  }

  console.log(`✓ Deleted ${usersSnapshot.size} user documents`);
}

async function deleteAllEvents() {
  console.log('🗑️  Deleting all events and related data...');
  const eventsSnapshot = await db.collection('events').get();

  for (const eventDoc of eventsSnapshot.docs) {
    // Delete subcollections
    const collections = ['attendees', 'ratings', 'messages'];

    for (const collName of collections) {
      const subSnapshot = await eventDoc.ref.collection(collName).get();
      for (const subDoc of subSnapshot.docs) {
        await subDoc.ref.delete();
      }
    }

    // Delete event document
    await eventDoc.ref.delete();
  }

  console.log(`✓ Deleted ${eventsSnapshot.size} events and all subcollections`);
}

async function deleteCollection(collectionName) {
  console.log(`🗑️  Deleting ${collectionName} collection...`);
  const snapshot = await db.collection(collectionName).get();

  for (const doc of snapshot.docs) {
    await doc.ref.delete();
  }

  console.log(`✓ Deleted ${snapshot.size} documents from ${collectionName}`);
}

async function deleteAllAuthUsers() {
  console.log('🗑️  Deleting all users from Firebase Auth...');
  let deleted = 0;

  try {
    let result = await auth.listUsers(1000);

    while (result.users.length > 0) {
      const uids = result.users.map(user => user.uid);
      await auth.deleteUsers(uids);
      deleted += uids.length;
      console.log(`✓ Deleted ${deleted} Auth users so far...`);

      if (result.pageToken) {
        result = await auth.listUsers(1000, result.pageToken);
      } else {
        break;
      }
    }
  } catch (error) {
    console.warn('⚠️  Could not delete Auth users (may require additional permissions)');
    console.warn('   Error:', error.message);
  }

  console.log(`✓ Deleted ${deleted} Auth users total`);
}

async function wipeDatabase() {
  console.log('\n⚠️  WARNING: This will permanently delete ALL data!\n');

  try {
    await deleteAllAuthUsers();
    await deleteAllEvents();
    await deleteAllUsers();
    await deleteCollection('usernames');
    await deleteCollection('otpCodes');

    console.log('\n✅ Database wipe complete! The app is ready for fresh data.\n');
  } catch (error) {
    console.error('❌ Error during database wipe:', error);
    process.exit(1);
  }
}

wipeDatabase().then(() => process.exit(0));
