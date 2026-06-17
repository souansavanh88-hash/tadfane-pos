// Firebase Configuration
// Replace with your Firebase project config from Firebase Console
// Instructions: https://console.firebase.google.com/
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDwn6XlvXcqMwJwYOoaxy_-Qey5FEsVSh8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "pos-system-30a0e.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "pos-system-30a0e",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "pos-system-30a0e.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "12543679140",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:12543679140:web:ac99f16d5f56239a10e431"
};

let app = null;
export let fireDb = null;

try {
  if (firebaseConfig.apiKey !== "PASTE_YOUR_API_KEY_HERE" && firebaseConfig.apiKey !== "") {
    app = initializeApp(firebaseConfig);
    fireDb = getFirestore(app);
    console.log("[Firebase] Initialized successfully");
  } else {
    console.warn("[Firebase] Config is missing. Skipping initialization.");
  }
} catch (err) {
  console.warn("[Firebase] Failed to initialize:", err);
}
