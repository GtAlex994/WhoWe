#!/usr/bin/env node

/**
 * Wipe Firestore database using REST API
 * Requires FIREBASE_PROJECT_ID and FIREBASE_DATABASE_ID env vars
 */

import fs from 'fs';
import path from 'path';

// Load environment variables
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!projectId) {
  console.error('ERROR: NEXT_PUBLIC_FIREBASE_PROJECT_ID not found in environment');
  process.exit(1);
}

const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

async function deleteCollection(collectionName) {
  try {
    console.log(`🗑️  Deleting ${collectionName} collection...`);

    const response = await fetch(`${baseUrl}/${collectionName}`);
    const data = await response.json();

    if (!data.documents || data.documents.length === 0) {
      console.log(`✓ ${collectionName} is empty`);
      return;
    }

    let deleted = 0;
    for (const doc of data.documents) {
      const docName = doc.name;
      await fetch(docName, { method: 'DELETE' });
      deleted++;
    }

    console.log(`✓ Deleted ${deleted} documents from ${collectionName}`);
  } catch (error) {
    console.error(`❌ Error deleting ${collectionName}:`, error.message);
  }
}

async function deleteEventsRecursive() {
  try {
    console.log(`🗑️  Deleting events and subcollections...`);

    const response = await fetch(`${baseUrl}/events`);
    const data = await response.json();

    if (!data.documents || data.documents.length === 0) {
      console.log(`✓ Events collection is empty`);
      return;
    }

    let deleted = 0;
    for (const eventDoc of data.documents) {
      const eventId = eventDoc.name.split('/').pop();

      // Delete subcollections
      for (const subCollection of ['attendees', 'ratings', 'messages']) {
        const subResponse = await fetch(`${baseUrl}/events/${eventId}/${subCollection}`);
        const subData = await subResponse.json();

        if (subData.documents) {
          for (const subDoc of subData.documents) {
            await fetch(subDoc.name, { method: 'DELETE' });
          }
        }
      }

      // Delete event
      await fetch(eventDoc.name, { method: 'DELETE' });
      deleted++;
    }

    console.log(`✓ Deleted ${deleted} events with all subcollections`);
  } catch (error) {
    console.error(`❌ Error deleting events:`, error.message);
  }
}

async function wipeDatabase() {
  console.log('\n⚠️  WARNING: This will permanently delete ALL data!\n');

  try {
    await deleteEventsRecursive();
    await deleteCollection('users');
    await deleteCollection('usernames');
    await deleteCollection('otpCodes');

    console.log('\n✅ Database wipe complete! The app is ready for fresh data.\n');
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

wipeDatabase().then(() => process.exit(0));
