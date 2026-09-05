import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

let parsedConfig = {};
try {
  if (typeof window !== "undefined" && window.__firebase_config) {
    parsedConfig = JSON.parse(window.__firebase_config);
  }
} catch (e) {
  console.warn("Could not parse window.__firebase_config, falling back to env variables:", e);
}

const firebaseConfig = {
  apiKey: (parsedConfig.apiKey && !parsedConfig.apiKey.startsWith("%VITE_"))
    ? parsedConfig.apiKey 
    : import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: (parsedConfig.authDomain && !parsedConfig.authDomain.startsWith("%VITE_"))
    ? parsedConfig.authDomain 
    : import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: (parsedConfig.projectId && !parsedConfig.projectId.startsWith("%VITE_"))
    ? parsedConfig.projectId 
    : import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: (parsedConfig.storageBucket && !parsedConfig.storageBucket.startsWith("%VITE_"))
    ? parsedConfig.storageBucket 
    : import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: (parsedConfig.messagingSenderId && !parsedConfig.messagingSenderId.startsWith("%VITE_"))
    ? parsedConfig.messagingSenderId 
    : import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: (parsedConfig.appId && !parsedConfig.appId.startsWith("%VITE_"))
    ? parsedConfig.appId 
    : import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: (parsedConfig.measurementId && !parsedConfig.measurementId.startsWith("%VITE_"))
    ? parsedConfig.measurementId 
    : import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export const appId = (typeof window !== "undefined" && window.__app_id && !window.__app_id.startsWith("%VITE_"))
  ? window.__app_id 
  : (import.meta.env.VITE_APP_ID || "univ-quiz-pro-v1");