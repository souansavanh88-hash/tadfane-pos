import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBupZpt-tIPPbFfxj6lKpF_RMVKY9O0jLg",
  projectId: "tadfane-pos",
};
const app = initializeApp(firebaseConfig);
const fireDb = getFirestore(app);

async function check() {
  const collRef = collection(fireDb, "pos_bookings");
  const snap = await getDocs(collRef);
  console.log("pos_bookings count:", snap.size);
  if (snap.size > 0) {
    console.log("First booking:", snap.docs[0].data());
  }
  process.exit(0);
}
check().catch(console.error);
