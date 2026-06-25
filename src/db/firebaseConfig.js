// Firebase Configuration
// Replace with your Firebase project config from Firebase Console
// Instructions: https://console.firebase.google.com/
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBupZpt-tIPPbFfxj6lKpF_RMVKY9O0jLg",
  authDomain: "tadfane-pos.firebaseapp.com",
  projectId: "tadfane-pos",
  storageBucket: "tadfane-pos.firebasestorage.app",
  messagingSenderId: "1090397329641",
  appId: "1:1090397329641:web:d4877465425f590e803878"
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
