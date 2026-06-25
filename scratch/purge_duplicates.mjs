import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBupZpt-tIPPbFfxj6lKpF_RMVKY9O0jLg",
  authDomain: "tadfane-pos.firebaseapp.com",
  projectId: "tadfane-pos",
  storageBucket: "tadfane-pos.firebasestorage.app",
  messagingSenderId: "1090397329641",
  appId: "1:1090397329641:web:d4877465425f590e803878"
};

const app = initializeApp(firebaseConfig);
const fireDb = getFirestore(app);

async function clean() {
  const docRef = doc(fireDb, "pos_main/data");
  console.log("Fetching cloud data...");
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    console.log("No data found.");
    return;
  }
  
  const data = snap.data();
  if (!data.dbState) return;
  
  const db = data.dbState;
  const custCount = db.customers ? db.customers.length : 0;
  console.log("Total customers before:", custCount);
  
  if (db.customers) {
    // Deduplicate by ID
    const seen = new Set();
    db.customers = db.customers.filter(c => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
    
    console.log("Total customers after:", db.customers.length);
  }
  
  await setDoc(docRef, { dbState: db }, { merge: true });
  console.log("Cleaned data pushed to cloud.");
  process.exit(0);
}

clean().catch(console.error);
