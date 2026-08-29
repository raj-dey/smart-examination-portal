import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the serviceAccountKey.json at the root
const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error("\n❌ Error: serviceAccountKey.json not found in the project root!");
  console.error("👉 Please download your service account private key from Firebase Console -> Project Settings -> Service Accounts, rename it to 'serviceAccountKey.json', and save it in the root folder of this project.");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

// Match this with the appId from your project configuration
const appId = "univ-quiz-pro-v1";

async function runCleanup() {
  console.log("--------------------------------------------------");
  console.log("🚀 Starting Uni-Quiz-Pro User Cleanup Process...");
  console.log("--------------------------------------------------");

  // 1. Fetch all users from Firebase Authentication
  console.log("📥 Fetching active user accounts from Firebase Authentication...");
  const authUsers = new Set();
  let nextPageToken;
  
  try {
    do {
      const listUsersResult = await auth.listUsers(1000, nextPageToken);
      listUsersResult.users.forEach((userRecord) => {
        authUsers.add(userRecord.uid);
      });
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);
  } catch (error) {
    console.error("❌ Failed to fetch users from Firebase Auth:", error.message);
    process.exit(1);
  }

  console.log(`✅ Found ${authUsers.size} active user(s) in Authentication.`);

  // 2. Fetch all user profile documents from Firestore database
  console.log("📥 Fetching user profiles from Firestore Database...");
  let snapshot;
  try {
    const usersRef = db.collection('artifacts').doc(appId).collection('users');
    snapshot = await usersRef.get();
  } catch (error) {
    console.error("❌ Failed to fetch user documents from Firestore:", error.message);
    process.exit(1);
  }

  console.log(`✅ Found ${snapshot.size} user profile(s) in Firestore.`);

  // 3. Find and delete orphaned user profiles
  let deletedCount = 0;
  console.log("🔍 Reconciling database records with authentication records...");
  
  for (const doc of snapshot.docs) {
    const uid = doc.id;
    if (!authUsers.has(uid)) {
      const name = doc.data().name || "Unnamed User";
      const role = doc.data().role || "student";
      console.log(`🗑️  Orphaned profile found - UID: ${uid} | Name: "${name}" | Role: "${role}". Deleting from Firestore...`);
      try {
        await doc.ref.delete();
        deletedCount++;
      } catch (error) {
        console.error(`❌ Failed to delete document for UID ${uid}:`, error.message);
      }
    }
  }

  console.log("--------------------------------------------------");
  console.log(`🎉 Cleanup complete! Successfully deleted ${deletedCount} orphaned user profile(s).`);
  console.log("--------------------------------------------------");
}

runCleanup().catch(console.error);
