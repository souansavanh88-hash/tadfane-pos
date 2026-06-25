import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBupZpt-tIPPbFfxj6lKpF_RMVKY9O0jLg",
  projectId: "tadfane-pos",
};
const app = initializeApp(firebaseConfig);
const fireDb = getFirestore(app);

async function check() {
  const docRef = doc(fireDb, "pos_main/data");
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;
  const db = snap.data().dbState;
  
  console.log("Bookings:", db.bookings ? db.bookings.length : 0);
  console.log("Customers:", db.customers ? db.customers.length : 0);
  console.log("Trips:", db.trips ? db.trips.length : 0);
  process.exit(0);
}
check();
