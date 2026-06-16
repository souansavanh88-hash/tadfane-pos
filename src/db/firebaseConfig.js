// Firebase Configuration
// Replace with your Firebase project config from Firebase Console
// Instructions: https://console.firebase.google.com/
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY_HERE",
  authDomain: "PASTE_YOUR_AUTH_DOMAIN_HERE",
  projectId: "PASTE_YOUR_PROJECT_ID_HERE",
  storageBucket: "PASTE_YOUR_STORAGE_BUCKET_HERE",
  messagingSenderId: "PASTE_YOUR_SENDER_ID_HERE",
  appId: "PASTE_YOUR_APP_ID_HERE"
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
