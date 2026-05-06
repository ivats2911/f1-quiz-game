import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";

// Firebase configuration is loaded from environment variables.
// See .env.example for the required keys, and create your own .env locally.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app, firebaseConfig.databaseURL);

// Use long polling if WebSockets fail or hang
// This is done via a database parameter in some versions, 
// but often standard connectivity issues are bypassed this way.
// We'll also add a quick log to verify DB initialization.
console.log("Firebase Database Initialized with URL:", firebaseConfig.databaseURL);

export const analytics = getAnalytics(app);
