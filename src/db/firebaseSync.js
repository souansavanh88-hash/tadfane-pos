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
  serverTimestamp 
} from "firebase/firestore";

const DB_DOC_ID = "main_database";
const DB_COLLECTION = "pos_data";
const REG_COLLECTION = "registrations";

// ============================================================
// CASHIER SIDE: Save entire DB to Firebase (called from saveDb)
// ============================================================
export const syncDbToFirebase = async (dbData) => {
  if (!isFirebaseConfigured()) return false;
  try {
    // Remove large binary data (face photos) before syncing to save bandwidth
    const cleanData = JSON.parse(JSON.stringify(dbData));
    if (cleanData.bookings) {
      cleanData.bookings = cleanData.bookings.map(b => {
        if (b.passengers) {
          b.passengers = b.passengers.map(p => ({
            ...p,
            facePhoto: p.facePhoto ? "[photo]" : ""
          }));
        }
        return b;
      });
    }
    cleanData._updatedAt = new Date().toISOString();
    
    await setDoc(doc(fireDb, DB_COLLECTION, DB_DOC_ID), cleanData);
    console.log("[Firebase] DB synced to cloud successfully");
    return true;
  } catch (err) {
    console.warn("[Firebase] Failed to sync DB to cloud:", err);
    return false;
  }
};

// ============================================================
// CUSTOMER SIDE: Get booking by groupId from Firebase
// ============================================================
export const getBookingFromFirebase = async (groupId) => {
  if (!isFirebaseConfigured()) return null;
  try {
    const docRef = doc(fireDb, DB_COLLECTION, DB_DOC_ID);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const cleanCode = groupId.trim().toUpperCase();
      const booking = (data.bookings || []).find(
        b => b.groupId === cleanCode && b.status !== "ยกเลิก"
      );
      return booking || null;
    }
    return null;
  } catch (err) {
    console.warn("[Firebase] Failed to get booking from cloud:", err);
    return null;
  }
};

// ============================================================
// CUSTOMER SIDE: Save registration to Firebase
// ============================================================
export const saveRegistrationToFirebase = async (groupId, bookingId, passengerData) => {
  if (!isFirebaseConfigured()) return false;
  try {
    // Save to registrations collection
    const regData = {
      groupId: groupId,
      bookingId: bookingId,
      passenger: {
        ...passengerData,
        facePhoto: passengerData.facePhoto ? "[photo]" : ""
      },
      registeredAt: new Date().toISOString(),
      _serverTimestamp: serverTimestamp()
    };
    
    await addDoc(collection(fireDb, REG_COLLECTION), regData);
    console.log("[Firebase] Registration saved to cloud successfully");

    // Also update the booking in the main DB
    const docRef = doc(fireDb, DB_COLLECTION, DB_DOC_ID);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const cleanCode = groupId.trim().toUpperCase();
      const bookingIndex = (data.bookings || []).findIndex(
        b => b.groupId === cleanCode && b.status !== "ยกเลิก"
      );
      
      if (bookingIndex !== -1) {
        const booking = data.bookings[bookingIndex];
        const currentPassengers = booking.passengers || [];
        const updatedPassengers = [...currentPassengers, {
          ...passengerData,
          facePhoto: passengerData.facePhoto ? "[photo]" : ""
        }];
        const isFull = updatedPassengers.length >= booking.paxCount;
        
        data.bookings[bookingIndex] = {
          ...booking,
          status: isFull ? "กรอกข้อมูลเรียบร้อย" : "กำลังกรอกข้อมูล",
          passengers: updatedPassengers
        };
        data._updatedAt = new Date().toISOString();
        
        await setDoc(docRef, data);
        console.log("[Firebase] Booking updated in cloud DB");
      }
    }
    
    return true;
  } catch (err) {
    console.warn("[Firebase] Failed to save registration:", err);
    return false;
  }
};

// ============================================================
// CASHIER SIDE: Listen for real-time DB changes from Firebase
// ============================================================
export const listenToFirebaseDb = (callback) => {
  if (!isFirebaseConfigured()) return null;
  try {
    const docRef = doc(fireDb, DB_COLLECTION, DB_DOC_ID);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("[Firebase] Real-time DB update received");
        callback(data);
      }
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
// Check if Firebase is properly configured (not placeholder)
// ============================================================
export const isFirebaseConfigured = () => {
  try {
    // If the fireDb was created without errors, Firebase is configured
    return fireDb !== null && fireDb !== undefined;
  } catch (err) {
    return false;
  }
};
