import { fireDb } from "./firebaseConfig";
import { doc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";

const POS_DATA_DOC = "pos_main/data_v2";

// Keep track of the last time we received an update from cloud
// so we don't overwrite our own writes with older local data
let lastSyncTime = 0;
let isPushing = false;

export const startFirebaseSync = (onDataReceived) => {
  if (!fireDb) {
    console.warn("[Firebase Sync] No fireDb found, skipping sync.");
    return null;
  }

  console.log("[Firebase Sync] Starting real-time listener...");
  const docRef = doc(fireDb, POS_DATA_DOC);
  
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      console.log("[Firebase Sync] Received data from cloud");
      
      // Update our local sync timestamp
      lastSyncTime = Date.now();
      
      if (data.dbState) {
        onDataReceived(data.dbState);
      }
    } else {
      console.log("[Firebase Sync] No data found on cloud yet.");
    }
  }, (err) => {
    console.error("[Firebase Sync] Error listening to data:", err);
  });
};

export const pushToFirebase = async (dbState) => {
  if (!fireDb) return false;
  if (isPushing) return false;
  
  isPushing = true;
  try {
    const docRef = doc(fireDb, POS_DATA_DOC);
    await setDoc(docRef, {
      dbState: dbState,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    isPushing = false;
    return true;
  } catch (err) {
    console.error("[Firebase Sync] Failed to push data:", err);
    isPushing = false;
    return false;
  }
};

// Force push - bypasses all guards, throws real errors for debugging
export const forcePushToFirebase = async (dbState) => {
  if (!fireDb) {
    throw new Error("Firebase not initialized! fireDb is null. Check firebaseConfig.js");
  }

  const docRef = doc(fireDb, POS_DATA_DOC);
  await setDoc(docRef, {
    dbState: dbState,
    updatedAt: serverTimestamp()
  }, { merge: true });
  
  return true;
};
