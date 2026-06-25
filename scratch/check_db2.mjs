import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBupZpt-tIPPbFfxj6lKpF_RMVKY9O0jLg",
  authDomain: "tadfane-pos.firebaseapp.com",
  projectId: "tadfane-pos",
  storageBucket: "tadfane-pos.firebasestorage.app",
  messagingSenderId: "1090397329641",
  appId: "1:1090397329641:web:d4877465425f590e803878",
  measurementId: "G-DD28DDF0Q7"
};
const app = initializeApp(firebaseConfig);
const fireDb = getFirestore(app);

async function check() {
  const docRef = doc(fireDb, "pos_main/data");
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    console.log("NO SNAPSHOT EXISTS!");
    return;
  }
  const data = snap.data();
  console.log("Keys in data:", Object.keys(data));
  if (data.dbState) {
    console.log("Keys in dbState:", Object.keys(data.dbState));
    console.log("Bookings:", data.dbState.bookings?.length);
    console.log("Customers:", data.dbState.customers?.length);
  }
  process.exit(0);
}
check();
