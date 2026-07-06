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
  orderBy,
  deleteDoc
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

// ============================================================
// SYSTEM/CASHIER SIDE: Clear all bookings documents from Firestore
// ============================================================
export const clearAllBookingsFromFirebase = async () => {
  if (!isFirebaseConfigured()) return false;
  try {
    const q = query(collection(fireDb, BOOKINGS_COLLECTION));
    const querySnapshot = await getDocs(q);
    
    const deletePromises = [];
    querySnapshot.forEach((document) => {
      const docRef = doc(fireDb, BOOKINGS_COLLECTION, document.id);
      deletePromises.push(deleteDoc(docRef));
    });
    
    await Promise.all(deletePromises);
    console.log(`[Firebase] Successfully deleted ${querySnapshot.size} booking documents.`);
    return true;
  } catch (err) {
    console.error("[Firebase] Failed to clear bookings collection:", err);
    throw err;
  }
};

const EMPLOYEE_REG_COLLECTION = "pos_employee_registrations";

// ============================================================
// EMPLOYEE SIDE: Add employee registration to Firebase
// ============================================================
export const addEmployeeRegistrationToFirebase = async (empData) => {
  if (!isFirebaseConfigured()) return null;
  try {
    const docRef = await addDoc(collection(fireDb, EMPLOYEE_REG_COLLECTION), {
      ...empData,
      createdAt: new Date().toISOString(),
      _serverTimestamp: serverTimestamp()
    });
    console.log("[Firebase] Employee registration added successfully:", docRef.id);
    return docRef.id;
  } catch (err) {
    console.error("[Firebase] Failed to add employee registration:", err);
    throw err;
  }
};

// ============================================================
// CASHIER SIDE: Listen for incoming employee registrations
// ============================================================
export const listenToEmployeeRegistrations = (callback) => {
  if (!isFirebaseConfigured()) return null;
  try {
    const q = query(collection(fireDb, EMPLOYEE_REG_COLLECTION));
    return onSnapshot(q, (snapshot) => {
      const registrations = [];
      snapshot.forEach((doc) => {
        registrations.push({ id: doc.id, ...doc.data() });
      });
      callback(registrations);
    }, (err) => {
      console.warn("[Firebase] Employee listener error:", err);
    });
  } catch (err) {
    console.warn("[Firebase] Failed to set up employee listener:", err);
    return null;
  }
};

// ============================================================
// CASHIER SIDE: Delete employee registration after processing
// ============================================================
export const deleteEmployeeRegistrationFromFirebase = async (regId) => {
  if (!isFirebaseConfigured()) return false;
  try {
    const docRef = doc(fireDb, EMPLOYEE_REG_COLLECTION, regId);
    await deleteDoc(docRef);
    console.log(`[Firebase] Deleted employee registration ${regId}`);
    return true;
  } catch (err) {
    console.error(`[Firebase] Failed to delete registration ${regId}:`, err);
    return false;
  }
};


