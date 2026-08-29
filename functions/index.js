const { onDestroyed } = require("firebase-functions/v2/auth");
const { getFirestore } = require("firebase-admin/firestore");
const { initializeApp } = require("firebase-admin/app");

initializeApp();

exports.ondestroyed = onDestroyed(async (event) => {
  const uid = event.data.uid;
  const db = getFirestore();
  
  // Use the default document app ID path "univ-quiz-pro-v1"
  const docRef = db.doc(`artifacts/univ-quiz-pro-v1/users/${uid}`);
  
  try {
    await docRef.delete();
    console.log(`Successfully deleted Firestore profile for user: ${uid}`);
  } catch (error) {
    console.error(`Error deleting Firestore profile for user ${uid}:`, error);
  }
});
