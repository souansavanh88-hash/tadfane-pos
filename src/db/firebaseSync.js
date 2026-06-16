// firebaseSync.js - Firebase Firestore sync utilities for POS
// Handles real-time syncing between cashier computer and customer mobile phones

import { fireDb } from "./firebaseConfig";
import { 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  orderBy
} from "firebase/firestore";

const BOOKINGS_COLLECTION = "pos_bookings";

// ============================================================
// Check if Firebase is properly configured
// ============================================================
export const isFirebaseConfigured = () => {
  try {
    return fireDb !== null && fireDb !== undefined;
  } catch (err) {
    return false;
  }
};

// ============================================================
// CASHIER SIDE: Add a new booking to Firebase
// ============================================================
export const addBookingToFirebase = async (bookingData) => {
  if (!isFirebaseConfigured()) return null;
  try {
    const docData = {
      ...bookingData,
      createdAt: new Date().toISOString(),
      _serverTimestamp: serverTimestamp()
    };
    
    // Use the bookingId as the document ID if provided, else let Firestore auto-generate
    let docRef;
    if (bookingData.id) {
      docRef = doc(fireDb, BOOKINGS_COLLECTION, bookingData.id);
      await setDoc(docRef, docData);
    } else {
      docRef = await addDoc(collection(fireDb, BOOKINGS_COLLECTION), docData);
    }
    console.log("[Firebase] Booking added to cloud successfully:", docRef.id);
    return docRef.id;
  } catch (err) {
    console.error("[Firebase] Failed to add booking:", err);
    throw err;
  }
};

// ============================================================
// CASHIER/CUSTOMER SIDE: Update an existing booking
// ============================================================
export const updateBookingInFirebase = async (bookingId, updates) => {
  if (!isFirebaseConfigured()) return false;
  try {
    const docRef = doc(fireDb, BOOKINGS_COLLECTION, bookingId);
    
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString(),
      _serverUpdatedAt: serverTimestamp()
    };
    
    await updateDoc(docRef, updateData);
    console.log(`[Firebase] Booking ${bookingId} updated successfully`);
    return true;
  } catch (err) {
    console.error(`[Firebase] Failed to update booking ${bookingId}:`, err);
    return false;
  }
};

// ============================================================
// CASHIER SIDE: Listen for real-time DB changes (All Bookings)
// ============================================================
export const listenToAllBookings = (callback) => {
  if (!isFirebaseConfigured()) return null;
  try {
    const q = query(collection(fireDb, BOOKINGS_COLLECTION));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bookings = [];
      snapshot.forEach((doc) => {
        bookings.push({ id: doc.id, ...doc.data() });
      });
      // Sort by createdAt descending
      bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      console.log("[Firebase] Real-time bookings update received:", bookings.length);
      callback(bookings);
    }, (err) => {
      console.warn("[Firebase] Real-time listener error:", err);
    });
    return unsubscribe;
  } catch (err) {
    console.warn("[Firebase] Failed to set up real-time listener:", err);
    return null;
  }
};

// ============================================================
// CUSTOMER SIDE: Get booking by groupId from Firebase
// ============================================================
export const getBookingFromFirebase = async (groupId) => {
  if (!isFirebaseConfigured()) return null;
  try {
    const cleanCode = groupId.trim().toUpperCase();
    const q = query(
      collection(fireDb, BOOKINGS_COLLECTION),
      where("groupId", "==", cleanCode)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Find the first one that is not cancelled
      const bookingDoc = querySnapshot.docs.find(doc => doc.data().status !== "ยกเลิก" && doc.data().status !== "cancelled");
      if (bookingDoc) {
        return { id: bookingDoc.id, ...bookingDoc.data() };
      }
    }
    return null;
  } catch (err) {
    console.warn("[Firebase] Failed to get booking from cloud:", err);
    return null;
  }
};

// ============================================================
// CUSTOMER SIDE: Add passenger to booking (Registration)
// ============================================================
export const addPassengerToFirebaseBooking = async (bookingId, passengerData) => {
  if (!isFirebaseConfigured()) return false;
  try {
    const docRef = doc(fireDb, BOOKINGS_COLLECTION, bookingId);
    
    // Add registered timestamp and photo flag
    const processedPassenger = {
      ...passengerData,
      registeredAt: new Date().toISOString(),
      facePhoto: passengerData.facePhoto ? "[photo]" : ""
    };
    
    await updateDoc(docRef, {
      passengers: arrayUnion(processedPassenger),
      updatedAt: new Date().toISOString(),
      _serverUpdatedAt: serverTimestamp()
    });
    
    console.log("[Firebase] Passenger added to booking successfully");
    return true;
  } catch (err) {
    console.error("[Firebase] Failed to add passenger:", err);
    throw err;
  }
};
