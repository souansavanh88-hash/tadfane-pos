// CheckInTickets.jsx - Direct Ticket Sales & POS Terminal
import React from "react";
import QRBooking from "./QRBooking";

export default function CheckInTickets({ currentUser, preloadedBookingId, clearPreloadedBooking }) {
  return (
    <QRBooking 
      currentUser={currentUser} 
      preloadedBookingId={preloadedBookingId} 
      clearPreloadedBooking={clearPreloadedBooking} 
    />
  );
}
