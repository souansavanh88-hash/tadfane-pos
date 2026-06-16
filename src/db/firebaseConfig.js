// Firebase Configuration
// Replace with your Firebase project config from Firebase Console
// Instructions: https://console.firebase.google.com/
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDwn6XlvXcqMwJwYOoaxy_-Qey5FEsVSh8",
  authDomain: "pos-system-30a0e.firebaseapp.com",
  projectId: "pos-system-30a0e",
  storageBucket: "pos-system-30a0e.firebasestorage.app",
  messagingSenderId: "12543679140",
  appId: "1:12543679140:web:ac99f16d5f56239a10e431"
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
