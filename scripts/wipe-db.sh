#!/bin/bash

# WARNING: This script permanently deletes ALL data from Firestore
# Only use this in development environments!

set -e

echo "⚠️  WARNING: This will PERMANENTLY DELETE ALL DATA from Firestore!"
echo ""
echo "Press Ctrl+C to cancel, or wait 5 seconds to continue..."
sleep 5

echo ""
echo "🗑️  Starting database wipe..."
echo ""

# Delete events collection and all subcollections
echo "Deleting events..."
firebase firestore:delete --recursive -y events 2>/dev/null || echo "⚠️  No events found or error deleting events"

# Delete users collection
echo "Deleting users..."
firebase firestore:delete -y users 2>/dev/null || echo "⚠️  No users found or error deleting users"

# Delete usernames collection
echo "Deleting usernames..."
firebase firestore:delete -y usernames 2>/dev/null || echo "⚠️  No usernames found or error deleting usernames"

# Delete OTP codes collection
echo "Deleting OTP codes..."
firebase firestore:delete -y otpCodes 2>/dev/null || echo "⚠️  No OTP codes found or error deleting OTP codes"

echo ""
echo "✅ Database wipe complete! The app is ready for fresh data."
echo ""
