// QRBooking.jsx - Cashier POS Terminal (Staff Assignment & QR Scanner Updates)
import React, { useState, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { useLanguage } from "../utils/LanguageContext";
import { getDb, addBooking, saveDb, saveDbLocally, purgeTestData } from "../db/mockDb";
import { fireDb } from "../db/firebaseConfig";
import { isFirebaseConfigured, getBookingFromFirebase, listenToAllBookings, addBookingToFirebase, updateBookingInFirebase, clearAllBookingsFromFirebase } from "../db/firebaseSync";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { formatLAK, formatTHB, formatUSD, generateBillId, getStatusLabel } from "../utils/helpers";
import { 
  Printer, Ticket, CreditCard, Wallet, Banknote, Clock, Users, Plus, Minus, 
  Ship, Check, Calendar, QrCode, ExternalLink, RefreshCw, AlertTriangle, UserCheck, ShieldAlert, X, Scan, Settings 
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Html5QrcodeScanner } from "html5-qrcode";

const formatLocalDate = (dateStr) => {
  if (!dateStr) return "-";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

const calculateAge = (dobString) => {
  if (!dobString) return "";
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return "";
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : 0;
};

const getDobInputVal = (dob) => {
  if (!dob) return "";
  const parts = dob.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dob;
};

const receiptTranslations = {
  en: {
    billNumber: "Bill Number:",
    date: "Date:",
    payment: "Payment:",
    agent: "Agent:",
    passengers: "Passengers:",
    paxUnit: "Pax",
    driver: "Driver:",
    guides: "Guides:",
    boats: "Boats:",
    boatLabel: "Boat",
    unassigned: "Unassigned",
    passengerListHeader: "PASSENGERS",
    noRegistered: "Waiting for Passenger Registration",
    total: "TOTAL:",
    thankYou: "THANK YOU",
    cash: "CASH",
    transfer: "TRANSFER",
    card: "CARD",
    ageUnit: "yrs",
    waitingReg: "Waiting for Passenger Registration",
    tel: "Tel: +856 20 555-9000",
    address: "Vang Vieng, Laos",
    unassignedShort: "Unassigned",
    posBillPreview: "POS Bill Preview",
    billId: "Bill ID",
    group: "Group",
    source: "Source:",
    tripSlot: "Trip Slot:",
    service: "Service:",
    paxCountLabel: "Pax Count:",
    passengerListPreview: "Passenger List:",
    boatTickets: "Boat Tickets:",
    totalLAK: "Total LAK:",
    paymentMethodLabel: "Payment Method",
    checkoutBtn: "Checkout & Print",
    reprintBtn: "Reprint Bill Receipt",
    dispatchBtn: "Dispatch",
    completeBtn: "Complete Trip",
    cancelBtn: "Cancel Bill",
    auditLogsTitle: "Audit Logs:",
    editLabel: "Edit",
    discount: "Discount:",
    debt: "Outstanding Debt:",
    netTotal: "NET TOTAL:",
    actualPaid: "ACTUALLY PAID:",
    subtotal: "Subtotal:",
    discountLabel: "Discount",
    debtLabel: "Debt / Credit"
  },
  la: {
    billNumber: "ເລກທີບິນ:",
    date: "ວັນເວລາ:",
    payment: "ການຊຳລະ:",
    agent: "ຕົວແທນ:",
    passengers: "ຜູ້ໂດຍສານ:",
    paxUnit: "ຄົນ",
    driver: "ຄົນຂับລົດ:",
    guides: "ໄກ້ດ:",
    boats: "ເຮືອ:",
    boatLabel: "ເຮືອລຳທີ",
    unassigned: "ຍັງບໍ່ໄດ້ກຳນົດ",
    passengerListHeader: "ລາຍຊື່ຜູ້ໂດຍສານ",
    noRegistered: "ລໍຖ້າລົງທະບຽນຜູ້ໂດຍສານ",
    total: "ຍອດລວມທັງໝົດ:",
    thankYou: "ຂໍຂອບໃຈ",
    cash: "ເງິນສົດ",
    transfer: "ໂອນເງິນ",
    card: "ບັດ",
    ageUnit: "ປີ",
    waitingReg: "ລໍຖ້າລົງທະບຽນຜູ້ໂດຍສານ",
    tel: "ໂທ: +856 20 555-9000",
    address: "ວັງວຽງ, ປະເທດລາວ",
    unassignedShort: "ບໍ່ມີ",
    posBillPreview: "ບິນຮັບເງິນ (ຕົວຢ່າງ)",
    billId: "ເລກບິນ",
    group: "ກຸ່ມ",
    source: "ແຫຼ່ງທີ່ມາ:",
    tripSlot: "ວັນເວລາ:",
    service: "ບໍລິການ:",
    paxCountLabel: "ຈຳນວນ:",
    passengerListPreview: "ລາຍຊື່ຜູ້ໂດຍສານ:",
    boatTickets: "ປີ້ເຮືອ:",
    totalLAK: "ຍອດລວມ LAK:",
    paymentMethodLabel: "ຊ່ອງທາງການຊຳລະ",
    checkoutBtn: "ຢືນຢັນການຊຳລະ & ພິມບິນ",
    reprintBtn: "ພິມບິນອີກຄັ້ງ",
    dispatchBtn: "ປ່ອຍເຮືອ",
    completeBtn: "ສຳເລັດທຣິບ",
    cancelBtn: "ຍົກເລີກບິນ",
    auditLogsTitle: "ປະຫວັດການແກ້ໄຂບິນ:",
    editLabel: "ແກ້ໄຂ",
    discount: "ສ່ວນຫຼຸດ:",
    debt: "ຄ້າງຊຳລະ:",
    netTotal: "ຍອດສຸທິ:",
    actualPaid: "ຈ່າຍຕົວຈິງ:",
    subtotal: "ຍອດລວມ:",
    discountLabel: "ສ່ວນຫຼຸດ",
    debtLabel: "ຄ້າງຊຳລະ"
  }
};

const getGenderLabel = (g, lang) => {
  if (!g) return "-";
  const lower = g.toLowerCase();
  if (lower.includes("male") || lower === "ชาย" || lower === "ຊາຍ" || lower === "m") {
    return lang === "en" ? "M" : "ຊາຍ";
  }
  if (lower.includes("female") || lower === "หญิง" || lower === "ຍิง" || lower === "f") {
    return lang === "en" ? "F" : "ຍິງ";
  }
  return g;
};

export default function QRBooking({ currentUser, preloadedBookingId, clearPreloadedBooking }) {
  const { lang, t } = useLanguage();
  const [db, setDb] = useState(getDb());
  const [firebaseBookings, setFirebaseBookings] = useState([]);

  const handleDobInputChange = (index, val) => {
    let clean = val.replace(/[^0-9]/g, "");
    if (clean.length > 8) clean = clean.slice(0, 8);
    
    let formatted = clean;
    if (clean.length > 2 && clean.length <= 4) {
      formatted = clean.slice(0, 2) + "/" + clean.slice(2);
    } else if (clean.length > 4) {
      formatted = clean.slice(0, 2) + "/" + clean.slice(2, 4) + "/" + clean.slice(4);
    }
    
    setEditPassengers(prev =>
      prev.map((p, idx) => {
        if (idx === index) {
          const updated = { ...p, dobInput: formatted };
          if (clean.length === 8) {
            const dd = clean.slice(0, 2);
            const mm = clean.slice(2, 4);
            const yyyy = clean.slice(4, 8);
            
            const dateStr = `${yyyy}-${mm}-${dd}`;
            const testDate = new Date(dateStr);
            if (!isNaN(testDate.getTime()) && testDate.getFullYear() === parseInt(yyyy)) {
              updated.dob = dateStr;
              updated.age = calculateAge(dateStr);
            }
          }
          return updated;
        }
        return p;
      })
    );
  };

  const handleDobSelectChange = (index, part, val) => {
    setEditPassengers(prev =>
      prev.map((p, idx) => {
        if (idx === index) {
          let currentDob = p.dob || "";
          let parts = currentDob.split("-");
          if (parts.length !== 3) {
            parts = ["", "", ""];
          }
          
          if (part === "year") parts[0] = val;
          if (part === "month") parts[1] = val;
          if (part === "day") parts[2] = val;
          
          const newDob = parts.join("-");
          const updated = { ...p };
          
          if (parts[0] && parts[1] && parts[2]) {
            updated.dob = newDob;
            updated.dobInput = `${parts[2]}/${parts[1]}/${parts[0]}`;
            updated.age = calculateAge(newDob);
          } else {
            updated.dob = newDob;
            const dStr = parts[2] || "__";
            const mStr = parts[1] || "__";
            const yStr = parts[0] || "____";
            updated.dobInput = `${dStr}/${mStr}/${yStr}`;
          }
          return updated;
        }
        return p;
      })
    );
  };
  
  const ticketAssignees = db.users?.filter(u => u.responsibilities?.tickets).map(u => u.name) || [];
  const dispatchAssignees = db.users?.filter(u => u.responsibilities?.crew_dispatch).map(u => u.name) || [];
  
  const canEdit = currentUser?.role === "owner" || currentUser?.role === "admin" || currentUser?.permissions?.["checkin-tickets"]?.edit === true;
  const canDelete = (currentUser?.role === "owner" || currentUser?.role === "admin" || currentUser?.permissions?.["checkin-tickets"]?.delete === true) && currentUser?.role !== "cashier";
  
  // Create / Edit Form State
  const [partnerId, setPartnerId] = useState(""); // empty = Walk In
  const [paxCount, setPaxCount] = useState(1);
  const [date, setDate] = useState(() => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - (offset * 60 * 1000));
    return local.toISOString().split("T")[0];
  });
  const [time, setTime] = useState(() => {
    const d = new Date();
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${hours}:${mins}`;
  });
  const [isDateManual, setIsDateManual] = useState(false);
  const [isTimeManual, setIsTimeManual] = useState(false);
  // Loaded Booking State for Checkout / Crew assignment
  const [loadedBooking, setLoadedBooking] = useState(null);
  const [qrShowModalBooking, setQrShowModalBooking] = useState(null);

  // Auto-update Date & Time in the background every 10 seconds (only if in creating-mode and not manually modified)
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentCurrency, setPaymentCurrency] = useState("LAK");
  
  useEffect(() => {
    if (loadedBooking) return;
    const interval = setInterval(() => {
      const d = new Date();
      if (!isDateManual) {
        const offset = d.getTimezoneOffset();
        const local = new Date(d.getTime() - (offset * 60 * 1000));
        setDate(local.toISOString().split("T")[0]);
      }
      if (!isTimeManual) {
        const hours = String(d.getHours()).padStart(2, "0");
        const mins = String(d.getMinutes()).padStart(2, "0");
        setTime(`${hours}:${mins}`);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [loadedBooking, isDateManual, isTimeManual]);

  const [selectedServiceId, setSelectedServiceId] = useState("SRV-004");
  const [selectedTier, setSelectedTier] = useState("tier1"); // "tier1" or "tier3"
  const [customPricePerPax, setCustomPricePerPax] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountMode, setDiscountMode] = useState("lak"); // "lak" or "percent"
  const [debtAmount, setDebtAmount] = useState(0);
  const [isAdvanceBooking, setIsAdvanceBooking] = useState(false);
  const [advanceDeposit, setAdvanceDeposit] = useState(0);
  const [advanceDiscount, setAdvanceDiscount] = useState(0);
  
  // Crew assignment form state (loaded from booking)
  const [selectedGuideIds, setSelectedGuideIds] = useState([]); // Multiple guides
  const [selectedBoatIds, setSelectedBoatIds] = useState([]); // Multiple boat IDs (selected cards)
  const [assignedDriverId, setAssignedDriverId] = useState("");
  const [selectedDriverIds, setSelectedDriverIds] = useState([]); // Multiple driver IDs
  const [vehicleCount, setVehicleCount] = useState(1);
  const [boatCount, setBoatCount] = useState(1);

  // Edit Control States
  const [isEditingPaidBill, setIsEditingPaidBill] = useState(false);
  const [isManageBillOpen, setIsManageBillOpen] = useState(false);
  const [manageBillTab, setManageBillTab] = useState("details");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editPaxCount, setEditPaxCount] = useState(1);
  const [editServiceId, setEditServiceId] = useState("");
  const [editTier, setEditTier] = useState("tier1");
  const [editCustomPrice, setEditCustomPrice] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState("cash");
  const [editNotes, setEditNotes] = useState("");
  const [editPassengers, setEditPassengers] = useState([]);
  
  // Registration code & QR print helper state
  const [registrationGroupId, setRegistrationGroupId] = useState("REG-" + Math.floor(1000 + Math.random() * 9000));
  const [customHostUrl, setCustomHostUrl] = useState(localStorage.getItem("pos_custom_host_url") || "");
  const [billNumber, setBillNumber] = useState(generateBillId());
  const [activeNotification, setActiveNotification] = useState(null);

  // Scanner Modal state
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [manualScanCode, setManualScanCode] = useState("");
  const scannerRef = useRef(null);

  // Time clock
  const [currentTimeStr, setCurrentTimeStr] = useState("");
  const [isPrintLoading, setIsPrintLoading] = useState(false);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);

  // 1. Clock interval
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      setCurrentTimeStr(`${hh}:${mm}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 10000);
    return () => clearInterval(interval);
  }, []);

  // Auto-save form draft to localStorage
  useEffect(() => {
    if (!loadedBooking) {
      const draft = {
        partnerId,
        paxCount,
        date,
        time,
        selectedServiceId,
        selectedTier,
        customPricePerPax,
        paymentMethod,
        paymentCurrency,
        discountAmount,
        debtAmount,
        registrationGroupId,
        billNumber
      };
      localStorage.setItem("pos_pos_booking_draft", JSON.stringify(draft));
    }
  }, [
    partnerId,
    paxCount,
    date,
    time,
    selectedServiceId,
    selectedTier,
    customPricePerPax,
    paymentMethod,
    paymentCurrency,
    registrationGroupId,
    billNumber,
    loadedBooking
  ]);

  // Restore draft from localStorage on mount
  const [printTemplate, setPrintTemplate] = useState(null); // 'receipt', 'qr_slip', 'qr_sign', or null

  useEffect(() => {
    const draftStr = localStorage.getItem("pos_pos_booking_draft");
    if (draftStr) {
      try {
        const draft = JSON.parse(draftStr);
        if (draft) {
          if (draft.partnerId !== undefined) setPartnerId(draft.partnerId);
          if (draft.paxCount !== undefined) setPaxCount(draft.paxCount);
          
          // Only restore date/time if it matches today's date to avoid stale data
          const todayStr = new Date().toISOString().split("T")[0];
          if (draft.date === todayStr) {
            if (draft.date !== undefined) {
              setDate(draft.date);
              setIsDateManual(true);
            }
            if (draft.time !== undefined) {
              setTime(draft.time);
              setIsTimeManual(true);
            }
          }
          
          if (draft.selectedServiceId !== undefined) setSelectedServiceId(draft.selectedServiceId);
          if (draft.selectedTier !== undefined) setSelectedTier(draft.selectedTier);
          if (draft.customPricePerPax !== undefined) setCustomPricePerPax(draft.customPricePerPax);
          if (draft.paymentMethod !== undefined) setPaymentMethod(draft.paymentMethod);
          if (draft.paymentCurrency !== undefined) setPaymentCurrency(draft.paymentCurrency);
          if (draft.discountAmount !== undefined) setDiscountAmount(draft.discountAmount);
          if (draft.debtAmount !== undefined) setDebtAmount(draft.debtAmount);
          if (draft.registrationGroupId !== undefined) setRegistrationGroupId(draft.registrationGroupId);
          if (draft.billNumber !== undefined) setBillNumber(draft.billNumber);
        }
      } catch (e) {
        console.error("Failed to restore booking draft", e);
      }
    }
  }, []);

  // Sync Manage Bill modal states with loadedBooking
  useEffect(() => {
    if (isManageBillOpen && loadedBooking) {
      setEditDate(loadedBooking.date || "");
      setEditTime(loadedBooking.time || "");
      setEditPaxCount(loadedBooking.paxCount || 1);
      setEditServiceId(loadedBooking.serviceId || loadedBooking.selectedServiceId || "SRV-001");
      setEditTier(loadedBooking.selectedTier || "tier1");
      setEditCustomPrice(loadedBooking.customPricePerPax || "");
      setEditPaymentMethod(loadedBooking.paymentMethod || "cash");
      setEditNotes(loadedBooking.notes || "");
      setEditPassengers(loadedBooking.passengers ? JSON.parse(JSON.stringify(loadedBooking.passengers)) : []);
      setManageBillTab("details");
    }
  }, [isManageBillOpen, loadedBooking]);

  // 2. Load DB & listen to real-time storage updates
  useEffect(() => {
    const handleDbUpdate = () => {
      const data = getDb();
      setDb(data);
      setCustomHostUrl(localStorage.getItem("pos_custom_host_url") || "");
    };
    handleDbUpdate();
    window.addEventListener("db-update", handleDbUpdate);
    return () => window.removeEventListener("db-update", handleDbUpdate);
  }, []);

  // 2a. Listen to Firebase Bookings
  useEffect(() => {
    const unsubscribe = listenToAllBookings((bookings) => {
      setFirebaseBookings(bookings);
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // 2b. Sync loaded booking with latest Firebase data
  useEffect(() => {
    if (loadedBooking) {
      const latest = firebaseBookings.find(b => b.id === loadedBooking.id);
      if (latest && JSON.stringify(latest) !== JSON.stringify(loadedBooking)) {
        setLoadedBooking(latest);
      }
    }
  }, [firebaseBookings, loadedBooking]);

  // 2b. Automatically update selectedTier when paxCount or selectedServiceId changes
  useEffect(() => {
    const autoTier = paxCount >= 3 ? "tier3" : "tier1";
    setSelectedTier(autoTier);
  }, [paxCount, selectedServiceId]);

  // 2c. Auto-load preloadedBookingId from props if navigating from Customer Registration
  useEffect(() => {
    if (preloadedBookingId) {
      const found = firebaseBookings.find(b => b.id === preloadedBookingId);
      if (found) {
        handleLoadBooking(found);
      }
      if (clearPreloadedBooking) {
        clearPreloadedBooking();
      }
    }
  }, [preloadedBookingId]);

  // Play Double Chime
  const playDoubleChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      
      const playNote = (time, freq, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.15, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + duration);
      };
      
      playNote(now, 523.25, 0.4); // C5
      playNote(now + 0.15, 659.25, 0.5); // E5
    } catch (e) {
      console.warn("Chime playback failed", e);
    }
  };

  // 3. Real-time background polling for ready/registered bookings to play chime
  useEffect(() => {
    const notifiedBookings = new Set();
    const pollInterval = setInterval(() => {
      const currentDb = getDb();
      const readyBks = (currentDb.bookings || []).filter(
        b => b.status === "พร้อมชำระเงิน / พร้อมพิมพ์" ||
             b.status === "พร้อมชำระเงิน" ||
             b.status === "รอชำระเงิน" ||
             b.status === "รອຊຳລະເງິນ" ||
             b.status === "กรอกข้อมูลเรียบร้อย"
      );

      readyBks.forEach(bk => {
        if (!notifiedBookings.has(bk.id)) {
          notifiedBookings.add(bk.id);
          playDoubleChime();
          setActiveNotification({
            id: bk.id,
            groupId: bk.groupId,
            message: `🔔 ລູກຄ້າກອກຂໍ້ມູນສຳເລັດແລ້ວ! ລະຫັດກຸ່ມ: ${bk.groupId} (${bk.partnerName || "Walk-in"})`
          });
        }
      });
    }, 2000);

    return () => clearInterval(pollInterval);
  }, []);

  // HTML5 QR Code Scanner Mounting Hook
  useEffect(() => {
    if (!showScannerModal) return;
    
    // Give DOM time to render the reader element
    const timer = setTimeout(() => {
      const onScanSuccess = (decodedText) => {
        handleProcessDecodedText(decodedText);
      };
      
      const onScanError = (err) => {
        // Silent error
      };
      
      const scanner = new Html5QrcodeScanner("reader", { 
        fps: 10, 
        qrbox: { width: 250, height: 250 } 
      });
      scanner.render(onScanSuccess, onScanError);
      scannerRef.current = scanner;
    }, 300);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.warn("Error clearing scanner:", err));
        scannerRef.current = null;
      }
    };
  }, [showScannerModal]);

  // Process manual or scanned code
  const handleProcessDecodedText = async (text) => {
    let code = text.trim();
    if (code.includes("groupId=")) {
      try {
        const urlObj = new URL(code);
        code = urlObj.searchParams.get("groupId") || code;
      } catch (e) {}
    }
    
    code = code.trim().toUpperCase();
    let found = firebaseBookings.find(
      b => b.groupId === code || b.id === code || b.billNumber === code
    );
    
    if (!found && isFirebaseConfigured()) {
      try {
        // Try to fetch from Firebase Cloud if not found in local memory
        const cloudBk = await getBookingFromFirebase(code);
        if (cloudBk) {
          found = cloudBk;
        }
      } catch (err) {
        console.warn("Firebase scanned booking lookup error:", err);
      }
    }
    
    if (found) {
      handleLoadBooking(found);
      setShowScannerModal(false);
      setManualScanCode("");
      playDoubleChime();
    } else {
      alert(`ไม่พบข้อมูลบิลสำหรับรหัส: ${code} / Booking not found for: ${code}`);
    }
  };

  const handleManualScanSubmit = (e) => {
    e.preventDefault();
    if (manualScanCode.trim()) {
      handleProcessDecodedText(manualScanCode);
    }
  };

  // Get standard price helper (ignores overrides, returns seed rates)
  const getStandardPrice = (serviceId, count) => {
    if (serviceId === "SRV-004") {
      return count >= 3 ? 1120 : 1580;
    } else if (serviceId === "SRV-005") {
      return count >= 3 ? 780 : 1900;
    }
    const service = db.services?.find(s => s.id === serviceId) || db.services?.[0];
    if (service) {
      if (count >= 3) return service.priceTier3 || service.price;
      return service.priceTier1 || service.price;
    }
    return 250000;
  };

  // Get tiered price helper based on passenger count and service currency/type selection
  const getSelectedPricingDetails = (serviceId, tier, count, customPrice = "") => {
    const rateTHB = db.settings.rateTHB || 620;
    const hasCustom = customPrice !== "";
    const customVal = hasCustom ? parseFloat(customPrice) : 0;
    
    if (serviceId === "SRV-004") { // Waterfall Rappelling
      const priceTHB = hasCustom ? customVal : (tier === "tier1" ? 1580 : 1120);
      const totalTHB = priceTHB * count;
      return {
        totalLAK: totalTHB * rateTHB,
        pricePerPaxLAK: priceTHB * rateTHB,
        rawPrice: priceTHB,
        rawTotal: totalTHB,
        currency: "THB",
        isFlat: false
      };
    } else if (serviceId === "SRV-005") { // Adventure Boat
      if (tier === "tier1") {
        const priceTHB = hasCustom ? customVal : 1900;
        const totalTHB = priceTHB;
        return {
          totalLAK: totalTHB * rateTHB,
          pricePerPaxLAK: (priceTHB / (count || 1)) * rateTHB,
          rawPrice: priceTHB,
          rawTotal: totalTHB,
          currency: "THB",
          isFlat: true
        };
      } else {
        const priceTHB = hasCustom ? customVal : 780;
        const totalTHB = priceTHB * count;
        return {
          totalLAK: totalTHB * rateTHB,
          pricePerPaxLAK: priceTHB * rateTHB,
          rawPrice: priceTHB,
          rawTotal: totalTHB,
          currency: "THB",
          isFlat: false
        };
      }
    } else {
      const service = db.services.find(s => s.id === serviceId) || db.services[0];
      
      // Determine base price based on selected tier
      let defaultPrice = service.price || 250000;
      if (tier === "tier3") {
        defaultPrice = service.priceTier3 || defaultPrice;
      } else if (tier === "tier2") {
        defaultPrice = service.priceTier2 || defaultPrice;
      } else {
        defaultPrice = service.priceTier1 || defaultPrice;
      }

      const basePrice = hasCustom ? customVal : defaultPrice;
      const isTHB = service.currency === "THB";
      const isFlat = service.priceTier1Type === "flat";
      
      const total = isFlat ? basePrice : (basePrice * count);
      
      return {
        totalLAK: isTHB ? total * rateTHB : total,
        pricePerPaxLAK: isTHB 
          ? (isFlat ? (basePrice / (count || 1)) * rateTHB : basePrice * rateTHB)
          : (isFlat ? (basePrice / (count || 1)) : basePrice),
        rawPrice: basePrice,
        rawTotal: total,
        currency: service.currency || "LAK",
        isFlat: isFlat
      };
    }
  };

  // Get current selected service
  const currentService = db.services.find(s => s.id === selectedServiceId) || db.services[0];
  const isBoatTrip = selectedServiceId === "SRV-001" || selectedServiceId === "SRV-005" || 
                     (currentService && (currentService.name.toLowerCase().includes("boat") || currentService.name.includes("เรืອ") || currentService.name.includes("ເຮືອ")));
  const pricingDetails = getSelectedPricingDetails(selectedServiceId, selectedTier, paxCount, customPricePerPax);
  const totalPriceLAK = pricingDetails.totalLAK;
  const defaultPrice = pricingDetails.rawPrice;
  const activePricePerPax = customPricePerPax !== "" ? parseFloat(customPricePerPax) : defaultPrice;

  // Compute actual discount in LAK (supports both fixed LAK and percentage modes)
  const computedDiscountLAK = discountMode === "percent"
    ? Math.round((totalPriceLAK * Math.min(discountAmount, 100)) / 100)
    : discountAmount;

  const getSelfRegUrl = (grpId, bookingPartnerId = null, bookingPaxCount = null, bookingId = null) => {
    let baseUrl = customHostUrl.trim() || window.location.origin;
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
    let url = `${baseUrl}/register?_t=${Date.now()}&`;
    
    const bid = bookingId || (loadedBooking ? loadedBooking.id : null);
    if (bid) {
      url += `bookingId=${bid}&`;
    }
    
    url += `groupId=${grpId || registrationGroupId}`;
    
    const pCount = bookingPaxCount || paxCount;
    if (pCount) {
      url += `&pax=${pCount}`;
    }
    
    return url;
  };

  const getPrintUrl = (templateType, booking) => {
    let baseUrl = window.location.origin;
    return `${baseUrl}/?print=${templateType}&id=${booking.id}&lang=${lang}&groupId=${booking.groupId || ''}&paxCount=${booking.paxCount || 0}&partnerId=${booking.partnerId || ''}`;
  };

  // Universal print helper using hidden isolated iframe - prevents popup blockers and media style leakage
  const printViaIframe = (templateType, overrideBooking = null, onComplete = null) => {
    try {
      // Fix: Filter out React event objects
      const activeBooking = (overrideBooking && typeof overrideBooking === 'object' && overrideBooking.id)
        ? overrideBooking
        : loadedBooking;

      if (!activeBooking) return;

      const isStandalone = !!(window.navigator && window.navigator.standalone) || window.matchMedia('(display-mode: standalone)').matches;
      if (isStandalone) {
        const printUrl = getPrintUrl(templateType, activeBooking);
        const win = window.open(printUrl, '_blank');
        if (!win) {
          window.location.href = printUrl;
        }
        return;
      }

      // If activeBooking is different from current loadedBooking, load it to render the QR code in the DOM
      if (!loadedBooking || loadedBooking.id !== activeBooking.id) {
        flushSync(() => {
          setLoadedBooking(activeBooking);
        });
      }

      setIsPrintLoading(true);

      const runPrint = (currentBooking) => {
        try {
            // Get QR SVGs dynamically from rendered hidden SVG elements
            const qrSignSvg = document.querySelector('#print-qr-svg-sign-node svg')?.outerHTML || '';
            const qrSlipSvg = document.querySelector('#print-qr-svg-slip-node svg')?.outerHTML || '';

            const rt = receiptTranslations[lang] || receiptTranslations.la;

            let contentHtml = '';

            if (templateType === 'receipt') {
              const driversNames = currentBooking.driverIds && currentBooking.driverIds.length > 0
                ? currentBooking.driverIds.map(id => getDriverName(id).split(" (")[1]?.replace(")", "") || getDriverName(id).split(" ")[0]).join(", ")
                : (currentBooking.driverId ? getDriverName(currentBooking.driverId) : rt.unassigned);
              const vehCount = currentBooking.vehicleCount !== undefined ? currentBooking.vehicleCount : 1;
              const driverStr = `${driversNames} (รถ: ${vehCount} คัน)`;
              const guideStr = currentBooking.guideIds?.map(gId => getGuideName(gId).split(" ")[0]).join(" & ") || rt.unassigned;

              let boatsHtml = '';
              if (currentBooking.assignedBoats && currentBooking.assignedBoats.length > 0) {
                boatsHtml = currentBooking.assignedBoats.map((ab, index) => `
                  <div style="padding-left: 6px; font-size: 12px; font-weight: 700; display: flex; justify-content: space-between; margin-bottom: 2px;">
                    <span>${rt.boatLabel} ${index + 1}: ${getBoatName(ab.boatId)}</span>
                    <span>(${ab.paxCount} ${rt.paxUnit})</span>
                  </div>
                `).join('') + `
                  <div style="padding-left: 6px; font-size: 12px; font-weight: 700; border-top: 1px dashed #000000; margin-top: 4px; padding-top: 4px; display: flex; justify-content: space-between;">
                    <strong>จำนวนเรือ / Boats:</strong>
                    <span>${currentBooking.boatCount !== undefined ? currentBooking.boatCount : currentBooking.assignedBoats.length} ລຳ / Boats</span>
                  </div>
                `;
              } else {
                boatsHtml = `<div style="padding-left: 6px; font-size: 12px;">${rt.unassigned}</div>`;
              }

              let passengersHtml = '';
              if (currentBooking.passengers && currentBooking.passengers.length > 0) {
                passengersHtml = currentBooking.passengers.map((pax, idx) => `
                  <div style="padding-left: 6px; font-weight: 700; display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 2px; font-size: 13px;">
                    <span style="flex: 1; word-break: break-word; white-space: normal; text-align: left;">
                      ${idx + 1}. ${pax?.name || "N/A"}
                    </span>
                    <span style="white-space: nowrap; text-align: right;">
                      (${pax?.age || "-"} ${rt.ageUnit} | ${getGenderLabel(pax?.gender, lang)} | ${pax?.nationality || "-"})
                    </span>
                  </div>
                `).join('');
              } else {
                passengersHtml = `<div style="padding-left: 6px; font-style: italic; color: #000000; font-size: 13px;">${rt.waitingReg}</div>`;
              }

              contentHtml = `
                <div style="color: #000000; font-family: monospace; font-size: 14px; width: 100%; box-sizing: border-box; padding: 8px; line-height: 1.4; font-weight: 700;">
                  <div style="text-align: center; border-bottom: 2px dashed #000000; padding-bottom: 8px; margin-bottom: 8px;">
                    ${db.settings.logo ? `<img src="${db.settings.logo}" alt="Logo" style="max-height: 80px; max-width: 220px; object-fit: contain; margin-bottom: 8px;" />` : ''}
                    <h3 style="margin: 4px 0 0 0; font-weight: 900; font-size: 18px; color: #000000; letter-spacing: 1px;">${db.settings.shopName || "TADFANE RAFTING"}</h3>
                    ${db.settings.shopNameLao ? `<h4 style="margin: 2px 0 0 0; font-weight: 900; font-size: 15px; color: #000000;">${db.settings.shopNameLao}</h4>` : ''}
                    <p style="font-size: 12px; margin: 4px 0 2px 0; font-weight: bold;">${lang === "en" ? (db.settings.shopAddress || "Vang Vieng, Laos") : (db.settings.shopAddressLao || db.settings.shopAddress || rt.address)}</p>
                    <p style="font-size: 12px; margin: 0; font-weight: bold;">Tel: ${db.settings.shopTel || "+856 20 555-9000"}</p>
                    ${db.settings.shopTaxId ? `<p style="font-size: 11px; margin: 2px 0 0 0; font-weight: bold;">Tax ID: ${db.settings.shopTaxId}</p>` : ''}
                    ${db.settings.shopExtra ? `<p style="font-size: 11px; margin: 2px 0 0 0; font-weight: bold;">${db.settings.shopExtra}</p>` : ''}
                  </div>

                  <div style="font-size: 14px; margin-bottom: 6px;">
                    <div style="display: flex; justify-content: space-between;">
                      <strong>${rt.billNumber}</strong>
                      <span>${currentBooking.billNumber}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                      <strong>${rt.date}</strong>
                      <span>${formatLocalDate(currentBooking.date)} ${currentBooking.time}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                      <strong>${rt.payment}</strong>
                      <span>
                        ${currentBooking.paymentMethod === "cash"
                          ? rt.cash
                          : currentBooking.paymentMethod === "transfer"
                          ? rt.transfer
                          : currentBooking.paymentMethod === "card"
                          ? rt.card
                          : currentBooking.paymentMethod?.toUpperCase()}
                      </span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                      <strong>${rt.agent}</strong>
                      <span>${currentBooking.partnerName}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                      <strong>${rt.passengers}</strong>
                      <span>${currentBooking.paxCount} ${rt.paxUnit}</span>
                    </div>

                    <div style="border-top: 2px dashed #000000; margin: 6px 0;"></div>
                    <div style="display: flex; justify-content: space-between;">
                      <strong>${rt.driver}</strong>
                      <span>${driverStr}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                      <strong>${rt.guides}</strong>
                      <span>${guideStr}</span>
                    </div>

                    <div style="border-top: 2px dotted #000000; margin: 4px 0; padding-top: 4px;">
                      <strong>${rt.boats}</strong>
                    </div>
                    ${boatsHtml}
                  </div>

                  <div style="border-top: 2px dashed #000000; margin: 6px 0;"></div>
                  <div style="font-size: 13px; margin-bottom: 6px;">
                    <div style="font-weight: 900; margin-bottom: 4px; font-size: 14px;">
                      ${rt.passengerListHeader} (${currentBooking.paxCount} ${rt.paxUnit}):
                    </div>
                    ${passengersHtml}
                  </div>

                  <div style="border-top: 2px dashed #000000; margin: 6px 0;"></div>
                  <div style="font-size: 14px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; font-weight: 700;">
                      <span style="flex: 1; word-break: break-word; white-space: normal; text-align: left;">
                        ${currentBooking.serviceName} x${currentBooking.paxCount}:
                      </span>
                      <span style="white-space: nowrap; text-align: right;">
                        ${formatLAK(currentBooking.pricePaidLAK)} LAK
                      </span>
                    </div>
                    ${(currentBooking.discountLAK || 0) > 0 ? (() => {
                      const pctStr = currentBooking.discountPercent 
                        ? `(${currentBooking.discountPercent}%)` 
                        : (currentBooking.discountType === "percent" 
                          ? `(${Math.round((currentBooking.discountLAK / currentBooking.pricePaidLAK) * 100)}%)`
                          : "");
                      return `
                        <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 13px; margin-top: 4px;">
                          <span>${rt.discount} ${pctStr}</span>
                          <span>-${formatLAK(currentBooking.discountLAK)} LAK</span>
                        </div>
                      `;
                    })() : ''}
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; font-weight: 900; font-size: 18px; margin-top: 8px; border-top: 2px solid #000000; padding-top: 6px;">
                      <span style="flex: 1; text-align: left;">${(currentBooking.discountLAK || 0) > 0 || (currentBooking.debtLAK || 0) > 0 ? rt.netTotal : rt.total}</span>
                      <span style="white-space: nowrap; text-align: right;">
                        ${formatLAK((currentBooking.netPriceLAK !== undefined ? currentBooking.netPriceLAK : currentBooking.pricePaidLAK))} LAK
                      </span>
                    </div>
                    ${(currentBooking.debtLAK || 0) > 0 ? `
                      <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 13px; margin-top: 4px; border-top: 1px dotted #000000; padding-top: 4px;">
                        <span>⚠️ ${rt.debt}</span>
                        <span>-${formatLAK(currentBooking.debtLAK)} LAK</span>
                      </div>
                    ` : ''}
                    ${((currentBooking.discountLAK || 0) > 0 || (currentBooking.debtLAK || 0) > 0) ? `
                      <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 16px; margin-top: 6px; border-top: 2px solid #000000; padding-top: 6px;">
                        <span>${rt.actualPaid}</span>
                        <span>${formatLAK(currentBooking.paidLAK !== undefined ? currentBooking.paidLAK : currentBooking.pricePaidLAK)} LAK</span>
                      </div>
                    ` : ''}
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; margin-top: 6px; font-weight: 700; border-top: 1px dotted #000000; padding-top: 4px;">
                      <span>THB:</span>
                      <span>${formatTHB((currentBooking.netPriceLAK !== undefined ? currentBooking.netPriceLAK : currentBooking.pricePaidLAK) / db.settings.rateTHB)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: 700;">
                      <span>USD:</span>
                      <span>${formatUSD((currentBooking.netPriceLAK !== undefined ? currentBooking.netPriceLAK : currentBooking.pricePaidLAK) / db.settings.rateUSD)}</span>
                    </div>
                  </div>

                  <div style="margin-top: 20px; text-align: center; border-top: 2px dashed #000000; padding-top: 8px;">
                    <p style="font-size: 13px; margin: 0; font-weight: 900; color: #000000;">${rt.thankYou}</p>
                  </div>
                </div>
              `;
            } else if (templateType === 'qr_sign') {
              contentHtml = `
                <div style="color: #000000; text-align: center; padding: 20px; font-family: sans-serif;">
                  <h1 style="font-weight: 900; font-size: 2.2rem; color: #000000; margin: 0 0 5px 0;">${db.settings.shopName || "TADFANE RAFTING"}</h1>
                  ${db.settings.shopNameLao ? `<h2 style="font-weight: 900; font-size: 1.6rem; color: #000000; margin: 0 0 15px 0;">${db.settings.shopNameLao}</h2>` : ''}
                  <h3 style="font-size: 1.2rem; color: #475569; margin-bottom: 1.5rem;">ລົງທະບຽນຜູ້ໂດຍສານ / Customer Registration</h3>
                  
                  <div style="margin: 20px 0; display: flex; justify-content: center;">
                    ${qrSignSvg}
                  </div>

                  <div style="font-size: 1.2rem; font-weight: 900; margin: 20px 0; color: #000000;">
                    Group Code / ລະຫັດກຸ່ມ: <span style="text-decoration: underline;">${currentBooking?.groupId || registrationGroupId}</span>
                  </div>

                  <div style="text-align: left; max-width: 440px; margin: 0 auto; font-size: 0.9rem; line-height: 1.6; font-weight: 700;">
                    <p>1. Scan the QR Code using your mobile phone camera.</p>
                    <p>2. Agree to safety rules & terms.</p>
                    <p>3. Enter name, nationality, age, gender, phone details and submit.</p>
                    <p>4. Please notify cashier after submit.</p>
                  </div>
                </div>
              `;
            } else if (templateType === 'qr_slip') {
              contentHtml = `
                <div style="color: #000000; width: 100%; box-sizing: border-box; padding: 8px; text-align: center; font-family: monospace; line-height: 1.4; font-weight: 700;">
                  <h3 style="font-size: 15px; font-weight: 900; color: #000000; margin: 0;">${db.settings.shopName || "TADFANE RAFTING"}</h3>
                  ${db.settings.shopNameLao ? `<h4 style="font-size: 13px; font-weight: 800; color: #000000; margin: 2px 0 0 0;">${db.settings.shopNameLao}</h4>` : ''}
                  <p style="font-weight: bold; font-size: 11px; margin: 6px 0; color: #000000;">ບິນລົງທະບຽນລູກຄ້າ / Register Slip</p>
                  
                  <div style="display: inline-block; padding: 10px; background: #ffffff; border: 1px solid #000000; border-radius: 8px; margin: 8px 0;">
                    ${qrSlipSvg}
                  </div>

                  <div style="border: 2px dashed #000000; border-radius: 6px; padding: 8px; margin: 8px 0; background: #ffffff;">
                    <span style="font-size: 11px; font-weight: bold; display: block;">ລະຫັດກຸ່ມ / Group Code</span>
                    <span style="font-size: 20px; font-weight: 800; letter-spacing: 1px; display: block;">${currentBooking.groupId}</span>
                  </div>

                  <div style="text-align: left; font-size: 11px; background: #f1f5f9; padding: 8px 12px; border-radius: 8px; margin-top: 10px; border: 1px solid #cbd5e1;">
                    <strong>1. ສະແກນ QR Code / Scan QR</strong><br />
                    Scan QR code with your phone camera.<br />
                    <strong>2. ກອກຂໍ້ມູນ / Enter Details</strong><br />
                    Fill in name, nationality, gender, age, phone and submit.
                  </div>

                  <div style="margin-top: 15px; font-size: 11px; font-style: italic; border-top: 1px dashed #000000; padding-top: 6px;">
                    Thank you / ຂໍຂອບໃຈ
                  </div>
                </div>
              `;
            }

            // Define temporary styles to inject for printing
            let styleHtml = '';
            if (templateType === 'qr_sign') {
              styleHtml = `
                @media print {
                  @page {
                    size: A4 portrait !important;
                    margin: 10mm !important;
                  }
                  html, body {
                    width: 100% !important;
                    max-width: 100% !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    background: #ffffff !important;
                    color: #000000 !important;
                    overflow: visible !important;
                  }
                  body > #root {
                    display: none !important;
                  }
                  body > #print-receipt-portal {
                    display: block !important;
                    visibility: visible !important;
                    width: 100% !important;
                    margin: 0 !important;
                    padding: 0 !important;
                  }
                  #print-receipt-portal svg {
                    display: block !important;
                    margin: 0 auto !important;
                    max-width: 100% !important;
                    height: auto !important;
                  }
                }
                @media screen {
                  #print-receipt-portal {
                    display: none !important;
                  }
                }
              `;
            } else {
              // receipt or qr_slip (standard 80mm/58mm thermal receipt printer)
              styleHtml = `
                @media print {
                  @page {
                    size: 80mm auto !important;
                    margin: 0 !important;
                  }
                  html, body {
                    width: 80mm !important;
                    max-width: 80mm !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    background: #ffffff !important;
                    color: #000000 !important;
                    overflow: visible !important;
                  }
                  body > #root {
                    display: none !important;
                  }
                  body > #print-receipt-portal {
                    width: 80mm !important;
                    max-width: 80mm !important;
                    margin: 0 !important;
                    padding: 4px 6px !important; /* safe margins for thermal print head */
                    box-sizing: border-box !important;
                    display: block !important;
                    visibility: visible !important;
                    background: #ffffff !important;
                    color: #000000 !important;
                  }
                  #print-receipt-portal svg {
                    display: block !important;
                    margin: 6px auto !important;
                    max-width: 80% !important;
                    height: auto !important;
                  }
                }
                @media screen {
                  #print-receipt-portal {
                    display: none !important;
                  }
                }
              `;
            }

            // Remove any existing portal or custom style element first
            document.getElementById('print-receipt-portal')?.remove();
            document.getElementById('print-receipt-style')?.remove();

            // 1. Create and inject style element to override page layout
            const styleEl = document.createElement('style');
            styleEl.id = 'print-receipt-style';
            styleEl.innerHTML = styleHtml;
            document.head.appendChild(styleEl);

            // 2. Create and inject portal div on the main body
            const portal = document.createElement('div');
            portal.id = 'print-receipt-portal';
            portal.className = 'printable-area';
            portal.innerHTML = contentHtml;
            document.body.appendChild(portal);

            // Force DOM layout reflow
            const _reflow = portal.offsetHeight;

            // Trigger print dialog synchronously (safari user gesture friendly)
            window.focus();
            window.print();
            
            // Asynchronous-safe cleanup: keep DOM elements alive while Safari print sheet renders
            const cleanup = () => {
              try {
                if (portal.parentNode) portal.remove();
                if (styleEl.parentNode) styleEl.remove();
              } catch (e) {}
              setIsPrintLoading(false);
              if (onComplete) {
                onComplete();
              }
            };

            window.addEventListener('afterprint', cleanup, { once: true });
            setTimeout(cleanup, 15000); // 15 seconds safety timeout
          } catch (runErr) {
            alert("Error in runPrint: " + runErr.message + "\nStack: " + runErr.stack);
            setIsPrintLoading(false);
          }
      };

      runPrint(activeBooking);
    } catch (err) {
      alert("Error in printViaIframe: " + err.message + "\nStack: " + err.stack);
    }
  };

  const triggerReceiptPrint = (overrideBooking = null, onComplete = null) => printViaIframe('receipt', overrideBooking, onComplete);
  const triggerQrSlipPrint = (overrideBooking = null, onComplete = null) => printViaIframe('qr_slip', overrideBooking, onComplete);

  const resetForm = () => {
    setPartnerId("");
    setPaxCount(1);
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - (offset * 60 * 1000));
    setDate(local.toISOString().split("T")[0]);
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    setTime(`${hours}:${mins}`);
    setIsDateManual(false);
    setIsTimeManual(false);
    setSelectedServiceId("SRV-004");
    setSelectedTier("tier1");
    setCustomPricePerPax("");
    setDiscountAmount(0);
    setDiscountMode("lak");
    setDebtAmount(0);
    setPaymentMethod("cash");
    setPaymentCurrency("LAK");
    setLoadedBooking(null);
    setIsAdvanceBooking(false);
    setAdvanceDeposit(0);
    setAdvanceDiscount(0);
  };

  // Handles creating a new booking in "registering"
  const handleCreateBooking = async (e) => {
    if (e) e.preventDefault();
    if (isCreatingBooking) return;
    setIsCreatingBooking(true);

    try {
      const currentDb = getDb();
      const isAgent = partnerId !== "";
      const partnerObj = currentDb.partners.find(p => p.id === partnerId);
      const sourceName = isAgent ? partnerObj?.name : "Walk-in (ລູກຄ້າທົ່ວໄປ)";

      // Generate a unique ID synchronously so we can print without async block
      const uniqueId = `BK-${Date.now()}`;

      const newBooking = {
        id: uniqueId,
        partnerId: partnerId || null,
        partnerName: sourceName,
        bookingSource: isAgent ? "agent" : "walk-in",
        paxCount: parseInt(paxCount),
        date,
        time,
        serviceId: selectedServiceId,
        serviceName: currentService.name,
        pricePerPax: activePricePerPax,
        pricePaidLAK: totalPriceLAK,
        discountLAK: isAdvanceBooking ? advanceDiscount : computedDiscountLAK,
        discountType: isAdvanceBooking ? "lak" : discountMode,
        discountPercent: isAdvanceBooking ? 0 : (discountMode === "percent" ? discountAmount : 0),
        netPriceLAK: isAdvanceBooking ? (totalPriceLAK - advanceDiscount) : (totalPriceLAK - computedDiscountLAK),
        debtLAK: isAdvanceBooking ? Math.max(0, totalPriceLAK - advanceDiscount - advanceDeposit) : debtAmount,
        paidLAK: isAdvanceBooking ? advanceDeposit : ((totalPriceLAK - computedDiscountLAK) - debtAmount),
        paymentMethod,
        paymentCurrency,
        billNumber,
        status: isAdvanceBooking ? "advance_booking" : "registering", // Enforce standard status
        paymentStatus: isAdvanceBooking 
          ? (advanceDeposit >= (totalPriceLAK - advanceDiscount) ? "paid" : (advanceDeposit > 0 ? "partially_paid" : "unpaid")) 
          : "pending",
        groupId: registrationGroupId,
        passengers: [],
        auditLogs: [],
        guideIds: [],
        assignedBoats: [],
        driverId: "",
      };

      // Save to Firebase (with a 3-second timeout fallback to prevent blocking if network is slow/offline)
      try {
        await Promise.race([
          addBookingToFirebase(newBooking),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Firebase save timeout (3s)")), 3000))
        ]);
        console.log("[POS] Saved to Firebase successfully");
      } catch (fbErr) {
        console.warn("[POS] Firebase save failed or timed out. Proceeding to print offline.", fbErr);
      }

      // Synchronously update React state before printing to ensure DOM is flushed
      flushSync(() => {
        setLoadedBooking(newBooking);
      });

      // Trigger print asynchronously and reset form after print preview is closed
      const printFn = isAdvanceBooking ? triggerReceiptPrint : triggerQrSlipPrint;
      printFn(newBooking, () => {
        // Generate new group ID and bill number for next customer
        setRegistrationGroupId("REG-" + Math.floor(1000 + Math.random() * 9000));
        setBillNumber(generateBillId());

        // Reset form and clear loading status
        resetForm();
        setIsCreatingBooking(false);
      });
    } catch (err) {
      alert("Error in handleCreateBooking: " + err.message + "\nStack: " + err.stack);
      setIsCreatingBooking(false);
    }
  };

  // Loads a booking to details pane
  const handleLoadBooking = (bk) => {
    setLoadedBooking(bk);
    setPartnerId(bk.partnerId || "");
    setPaxCount(bk.paxCount);
    setDate(bk.date);
    setTime(bk.time);
    const srvId = bk.serviceId || "SRV-004";
    setSelectedServiceId(srvId);

    // Determine if custom price or standard price
    const stdPrice = getStandardPrice(srvId, bk.paxCount);
    if (Math.abs(bk.pricePerPax - stdPrice) < 0.01) {
      setCustomPricePerPax("");
    } else {
      setCustomPricePerPax(bk.pricePerPax.toString());
    }

    // Determine loaded tier from original price per pax (or fallback to paxCount)
    if (srvId === "SRV-004") {
      if (Math.abs(bk.pricePerPax - 1120) < 10) {
        setSelectedTier("tier3");
      } else if (Math.abs(bk.pricePerPax - 1580) < 10) {
        setSelectedTier("tier1");
      } else {
        setSelectedTier(bk.paxCount >= 3 ? "tier3" : "tier1");
      }
    } else if (srvId === "SRV-005") {
      if (Math.abs(bk.pricePerPax - 780) < 10) {
        setSelectedTier("tier3");
      } else if (Math.abs(bk.pricePerPax - 1900) < 10) {
        setSelectedTier("tier1");
      } else {
        setSelectedTier(bk.paxCount >= 3 ? "tier3" : "tier1");
      }
    } else {
      setSelectedTier("tier1");
    }
    setPaymentMethod(bk.paymentMethod || "cash");
    const discMode = bk.discountType || "lak";
    setDiscountMode(discMode);
    setDiscountAmount(discMode === "percent" ? (bk.discountPercent || 0) : (bk.discountLAK || 0));
    setDebtAmount(bk.debtLAK || 0);
    
    // Load assigned crew
    setSelectedGuideIds(bk.guideIds || (bk.guideId ? [bk.guideId] : []));
    const loadedBoats = bk.assignedBoats || (bk.boatId ? [{ boatId: bk.boatId }] : []);
    setSelectedBoatIds(loadedBoats.map(b => parseInt(b.boatId)).filter(id => !isNaN(id)));
    setAssignedDriverId(bk.driverId || "");

    const drivers = bk.driverIds || (bk.driverId ? [bk.driverId] : []);
    setSelectedDriverIds(drivers);
    setVehicleCount(bk.vehicleCount !== undefined ? bk.vehicleCount : Math.max(1, drivers.length));
    setBoatCount(bk.boatCount !== undefined ? bk.boatCount : Math.max(1, loadedBoats.length));

    setIsEditingPaidBill(false);
  };

  // Helper to check if a guide is busy on a given date (excluding current booking)
  const isGuideBusyOnDate = (guideId, date, currentBookingId) => {
    return (db.bookings || []).some(b => 
      b.id !== currentBookingId &&
      b.date === date && 
      b.status !== "ยกเลิก" && 
      b.guideIds && 
      b.guideIds.includes(guideId)
    );
  };

  // Helper to check if a boat is busy on a given date (excluding current booking)
  const isBoatBusyOnDate = (boatId, date, currentBookingId) => {
    return (db.bookings || []).some(b => 
      b.id !== currentBookingId &&
      b.date === date && 
      b.status !== "ยกเลิก" && 
      b.assignedBoats && 
      b.assignedBoats.some(ab => parseInt(ab.boatId) === parseInt(boatId))
    );
  };

  // Helper to check if a driver is busy on a given date (excluding current booking)
  const isDriverBusyOnDate = (driverId, date, currentBookingId) => {
    return (db.bookings || []).some(b => 
      b.id !== currentBookingId &&
      b.date === date && 
      b.status !== "ยกเลิก" && 
      b.driverId === driverId
    );
  };

  // Auto-distribute passengers and guides across selected boats for compatibility sync
  const getComputedAssignedBoats = (boatIds, guideIds, totalPax) => {
    if (!boatIds || boatIds.length === 0) return [];
    return boatIds.map((bid, idx) => {
      // Rotate selected guides across selected boats, or leave empty if no guide selected
      const guideIdForBoat = guideIds && guideIds.length > 0 ? guideIds[idx % guideIds.length] : "";
      
      // Distribute passenger count as equally as possible
      const basePax = Math.floor(totalPax / boatIds.length);
      const remainder = totalPax % boatIds.length;
      const boatPaxCount = basePax + (idx < remainder ? 1 : 0);

      return {
        boatId: bid,
        guideId: guideIdForBoat,
        paxCount: boatPaxCount
      };
    });
  };

  const getInitials = (name) => {
    if (!name) return "";
    if (name.includes("(")) {
      const match = name.match(/\(([^)]+)\)/);
      if (match && match[1]) {
        return match[1].slice(0, 2).toUpperCase();
      }
    }
    const parts = name.split(" ");
    return parts[0].slice(0, 2).toUpperCase();
  };

  const getAvatarBgColor = (id) => {
    const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = ["#0f766e", "#1d4ed8", "#6d28d9", "#b45309", "#be185d", "#0369a1", "#047857"];
    return colors[hash % colors.length];
  };

  const getGuideName = (id) => db.employees?.find(e => e.id === id)?.name || "Unassigned";
  const getDriverName = (id) => db.employees?.find(e => e.id === id)?.name || "Unassigned";
  const getBoatName = (id) => db.boats?.find(b => b.id === id)?.name || "Unassigned";
  const handleAddNewDriver = () => {
    const name = window.prompt("ກະລຸນາລະບຸຊື່ຄົນຂັບລົດ / Please enter driver name:");
    if (!name || !name.trim()) return;

    const currentDb = getDb();
    const newDriver = {
      id: `EMP-${Date.now()}`,
      name: name.trim(),
      role: "driver",
      type: "freelance",
      status: "active",
      salary: 0,
      tripRate: 50000,
      bonus: 0
    };

    currentDb.employees = [...(currentDb.employees || []), newDriver];
    saveDb(currentDb);
    setDb(currentDb);
    setAssignedDriverId(newDriver.id);
    setSelectedDriverIds(prev => {
      const next = [...prev, newDriver.id];
      setVehicleCount(next.length);
      return next;
    });
  };

  // Save staff assignment directly to booking
  const handleSaveCrew = () => {
    if (!loadedBooking) return;
    const currentDb = getDb();

    const computedBoats = isBoatTrip 
      ? getComputedAssignedBoats(selectedBoatIds, selectedGuideIds, loadedBooking.paxCount)
      : [];

    currentDb.bookings = currentDb.bookings.map(b => {
      if (b.id === loadedBooking.id) {
        const updated = {
          ...b,
          guideIds: selectedGuideIds,
          assignedBoats: computedBoats,
          driverId: selectedDriverIds[0] || null,
          driverIds: selectedDriverIds,
          vehicleCount: vehicleCount,
          boatCount: boatCount,
          // Legacy properties mapping for single guides/boats compat
          guideId: selectedGuideIds[0] || null,
          boatId: computedBoats[0]?.boatId ? parseInt(computedBoats[0].boatId) : null
        };
        // Keep state in sync
        setLoadedBooking(updated);
        return updated;
      }
      return b;
    });

    saveDbLocally(currentDb);
    setDb(currentDb);
    alert("ບัນทึกข้ອมูลจัດพນักงาນเรີยບร้ອยแล้ว / Crew updated successfully!");
  };

  // Checkout and Print receipt
  const handleCheckoutAndPrint = async () => {
    if (!loadedBooking) return;

    const d = new Date();
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - (offset * 60 * 1000));
    const currentDateStr = local.toISOString().split("T")[0];
    const currentHours = String(d.getHours()).padStart(2, "0");
    const currentMins = String(d.getMinutes()).padStart(2, "0");
    const currentTimeStr = `${currentHours}:${currentMins}`;

    const computedBoats = isBoatTrip
      ? getComputedAssignedBoats(selectedBoatIds, selectedGuideIds, loadedBooking.paxCount)
      : [];

    const updates = {
      status: "completed",
      paymentStatus: "paid",
      paymentMethod: paymentMethod,
      paymentCurrency: paymentCurrency,
      discountLAK: computedDiscountLAK,
      discountType: discountMode,
      discountPercent: discountMode === "percent" ? discountAmount : 0,
      netPriceLAK: (loadedBooking.pricePaidLAK || totalPriceLAK) - computedDiscountLAK,
      debtLAK: debtAmount,
      paidLAK: ((loadedBooking.pricePaidLAK || totalPriceLAK) - computedDiscountLAK) - debtAmount,
      guideIds: selectedGuideIds,
      assignedBoats: computedBoats,
      driverId: selectedDriverIds[0] || null,
      driverIds: selectedDriverIds,
      vehicleCount: vehicleCount,
      boatCount: boatCount,
      date: currentDateStr,
      time: currentTimeStr,
      // Legacy mappings
      guideId: selectedGuideIds[0] || null,
      boatId: computedBoats[0]?.boatId ? parseInt(computedBoats[0].boatId) : null,
      paidAt: new Date().toISOString()
    };

    // Synchronously update local database and state before printing to ensure DOM is flushed
    flushSync(() => {
      setLoadedBooking({ ...loadedBooking, ...updates });
      const currentDb = getDb();
      currentDb.bookings = currentDb.bookings.map(b => b.id === loadedBooking.id ? { ...b, ...updates } : b);
      saveDbLocally(currentDb);
      setDb(currentDb);
    });

    window.dispatchEvent(new Event("db-update"));

    // Trigger print synchronously to preserve user gesture context
    triggerReceiptPrint();
    
    // Sync to cloud asynchronously in the background
    updateBookingInFirebase(loadedBooking.id, updates).catch(err => {
      alert("Failed to checkout in cloud");
    });
  };

  // Unlock paid bill for editing
  const handleUnlockPaidBill = () => {
    setIsEditingPaidBill(true);
  };

  // Save edits to a paid bill (logs cashier name and timestamp)
  const handleSaveEditsPaidBill = async () => {
    if (!loadedBooking) return;

    const logEntry = {
      updatedBy: currentUser?.name || "Unknown Cashier",
      updatedAt: new Date().toISOString(),
      oldPax: loadedBooking.paxCount,
      newPax: parseInt(paxCount),
      oldPrice: loadedBooking.pricePaidLAK,
      newPrice: totalPriceLAK
    };

    const updates = {
      paxCount: parseInt(paxCount),
      pricePerPax: activePricePerPax,
      pricePaidLAK: totalPriceLAK,
      discountLAK: computedDiscountLAK,
      discountType: discountMode,
      discountPercent: discountMode === "percent" ? discountAmount : 0,
      netPriceLAK: totalPriceLAK - computedDiscountLAK,
      debtLAK: debtAmount,
      paidLAK: (totalPriceLAK - computedDiscountLAK) - debtAmount,
      date,
      time,
      serviceId: selectedServiceId,
      serviceName: currentService.name,
      paymentMethod,
      auditLogs: [...(loadedBooking.auditLogs || []), logEntry]
    };

    try {
      await updateBookingInFirebase(loadedBooking.id, updates);
      setIsEditingPaidBill(false);
      alert("ບัນทึกการแก้ไขแลະບัນทึกปรະวัตິการตรวจสອບสำเร็จ! / Bill updated & logged!");
    } catch (err) {
      alert("Failed to update bill in cloud");
    }
  };

  // Cancel Booking
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("คุณต้ອงการยกเลิกບິลນີ้ใช่หรืອไม่? / Are you sure you want to cancel this bill?")) return;
    
    try {
      await updateBookingInFirebase(bookingId, { status: "cancelled" });
      if (loadedBooking?.id === bookingId) {
        setLoadedBooking(null);
      }
    } catch (err) {
      alert("Failed to cancel booking in cloud");
    }
  };

  // Purge test customer and booking data
  const handlePurgeData = async () => {
    const confirmMsg = lang === "en" 
      ? "Warning: This will delete all bookings, registered customers, trip manifests, and custom expenses. Basic settings, agents, and staff will be kept. Proceed?" 
      : "ຄຳເຕືອນ: ນີ້ຈະລຶບຂໍ້ມູນການຈອງ, ຜູ້ໂດຍສານທີ່ລົງທະບຽນ, ປະຫວັດການເດີນເຮືອ ແລະ ຄ່າໃຊ້ຈ่ายທັງໝົດ. ຂໍ້ມູນພື້ນຖານອື່ນໆຈະຍັງຄົງຢູ່. ຕ້ອງການດຳເນີນການຕໍ່ແມ່ນບໍ່?";
    
    if (window.confirm(confirmMsg)) {
      purgeTestData();
      const updatedDb = getDb();
      setDb(updatedDb);
      setLoadedBooking(null);
      try {
        await clearAllBookingsFromFirebase();
      } catch (err) {
        console.error("Failed to clear bookings from firebase:", err);
      }
      alert(lang === "en" ? "All customer and booking data has been reset!" : "ລຶບຂໍ້ມູນການຈອງ ແລະ ຜູ້ໂດຍສານທັງໝົດຮຽບຮ້ອຍແລ້ວ!");
      window.location.reload();
    }
  };

  // Dispatch Boat
  const handleDispatchBoat = async (bookingId) => {
    try {
      await updateBookingInFirebase(bookingId, { status: "dispatched" });
    } catch (err) {
      alert("Failed to update status in cloud");
    }
  };

  // Complete Trip
  const handleCompleteTrip = async (bookingId) => {
    try {
      await updateBookingInFirebase(bookingId, { status: "completed" });
    } catch (err) {
      alert("Failed to update status in cloud");
    }
  };

  // Reset form
  const handleResetForm = () => {
    setLoadedBooking(null);
    setPartnerId("");
    setPaxCount(1);
    setSelectedServiceId("SRV-001");
    setCustomPricePerPax("");
    setSelectedGuideIds([]);
    setSelectedBoatIds([]);
    setAssignedDriverId("");
    setIsEditingPaidBill(false);
    
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - (offset * 60 * 1000));
    setDate(local.toISOString().split("T")[0]);
    
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    setTime(`${hours}:${mins}`);
    
    setIsDateManual(false);
    setIsTimeManual(false);
    
    setRegistrationGroupId("REG-" + Math.floor(1000 + Math.random() * 9000));
    setBillNumber(generateBillId());
    try {
      localStorage.removeItem("pos_pos_booking_draft");
    } catch (e) {}
  };

  // Filter list of bookings for queues from Firebase
  const registeringBookings = firebaseBookings.filter(b => b.status === "registering");
  
  const readyBookings = firebaseBookings.filter(b => b.status === "ready_to_checkout");

  const completedBookings = firebaseBookings.filter(b => 
    b.status === "completed" || 
    b.status === "dispatched" || 
    b.status === "เสร็จสิ้น"
  );
  
  // Queue 1: กำลังลงทะเบียน
  // Lock status check
  const isLocked = loadedBooking && 
                   (loadedBooking.status === "ready_to_checkout" || 
                    loadedBooking.status === "completed" || 
                    loadedBooking.status === "dispatched" || 
                    loadedBooking.status === "cancelled" ||
                    loadedBooking.status === "เสร็จสิ้น") && 
                   !isEditingPaidBill;

  const isPaidStatus = loadedBooking && (
    loadedBooking.status === "completed" ||
    loadedBooking.status === "dispatched" ||
    loadedBooking.status === "เสร็จสิ้น"
  );

  const getSystemAlerts = () => {
    const alerts = [];
    const todayStr = new Date().toISOString().split("T")[0];
    
    // 1. Ready bookings count
    const readyBks = (db.bookings || []).filter(
      b => b.status === "พร้อมชำระเงิน / พร้อมพิมพ์" ||
           b.status === "รอชำระเงิน" ||
           b.status === "พร้อมชำระเงิน" ||
           b.status === "รອຊຳລະເງິນ" ||
           b.status === "กรอกข้อมูลเรียบร้อย"
    );
    if (readyBks.length > 0) {
      alerts.push(`⚠️ ລູກຄ້າລໍຖ້າຊຳລະເງິນ ${readyBks.length} ບິນ / ${readyBks.length} Bills Pending Payment`);
    }
    
    // 2. Boat capacity alert
    const todayDispatchedTrips = (db.trips || []).filter(t => t.date === todayStr && t.status === "dispatched");
    todayDispatchedTrips.forEach(trip => {
      const boat = db.boats.find(b => b.id === trip.boatId);
      if (boat) {
        const paxCount = trip.customerIds.length;
        const remaining = boat.capacity - paxCount;
        if (remaining <= 2 && remaining > 0) {
          alerts.push(`⚠️ ${boat.name} ໃກ້ຈະເຕັມແລ້ວ (ເຫຼືອ ${remaining} ບ່ອນ) / ${boat.name} is almost full (${remaining} seats left)`);
        }
      }
    });

    // 3. Time slot capacity alert
    const slots = {};
    (db.bookings || []).filter(b => b.date === todayStr && b.status !== "ยกเลิก" && b.status !== "ຍົกເລີກ").forEach(b => {
      slots[b.time] = (slots[b.time] || 0) + b.paxCount;
    });
    Object.keys(slots).forEach(time => {
      const maxSlotCapacity = 12; // 2 boats
      const current = slots[time];
      const left = maxSlotCapacity - current;
      if (left <= 3 && left > 0) {
        alerts.push(`⚠️ ຮອບເວລາ ${time} ເຫຼືອທີ່ວ່າງ ${left} ຄົນ / Time slot ${time} has only ${left} seats left`);
      }
    });

    return alerts;
  };

  const systemAlerts = getSystemAlerts();

  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px", color: "var(--text-primary)" }}>
      <div className="no-print" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Print Loading Overlay */}
        {isPrintLoading && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(15, 23, 42, 0.85)",
          backdropFilter: "blur(8px)",
          zIndex: 999999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem"
        }}>
          <style>{`
            @keyframes print-spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <div style={{
            width: "50px",
            height: "50px",
            border: "5px solid rgba(255, 255, 255, 0.2)",
            borderTop: "5px solid #10b981",
            borderRadius: "50%",
            animation: "print-spin 1s linear infinite"
          }}></div>
          <div style={{ color: "#ffffff", fontWeight: "bold", fontSize: "1.2rem", textAlign: "center", fontFamily: "inherit" }}>
            {lang === "en" ? "Preparing Receipt..." : "ກຳລັງກຽມພິມບິນ... / Preparing Receipt..."}
          </div>
        </div>
      )}
      {/* Top action row containing scan QR button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
        <div style={{ fontSize: "1.1rem", fontWeight: "800", display: "flex", alignItems: "center", gap: "6px" }}>
          <span>Ticket Sales POS Terminal</span>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", background: "rgba(16, 185, 129, 0.15)", padding: "2px 8px", borderRadius: "10px", color: "#10b981" }}>
            🟢 Live Sync
          </span>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {(currentUser?.role === "owner" || currentUser?.role === "admin") && (
            <button
              onClick={handlePurgeData}
              style={{ padding: "12px 20px", borderRadius: "10px", background: "#be123c", border: "none", color: "#ffffff", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.95rem", boxShadow: "0 4px 12px rgba(190, 18, 60, 0.25)", transition: "all 0.2s ease" }}
            >
              🧹 {lang === "en" ? "Reset Customer Data" : "ລ້າງຂໍ້ມູນລູກຄ້າ"}
            </button>
          )}
          <button
            onClick={() => setShowScannerModal(true)}
            style={{ padding: "12px 24px", borderRadius: "10px", background: "#0f766e", border: "none", color: "#ffffff", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.95rem", boxShadow: "0 4px 12px rgba(15, 118, 110, 0.25)", transition: "all 0.2s ease" }}
          >
            <Scan size={20} />
            <span>ສແກນ QR Code / Scan QR</span>
          </button>
        </div>
      </div>

      {/* Warnings Banner */}
      {systemAlerts.length > 0 && (
        <div style={{
          background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
          border: "1.5px solid #f59e0b",
          color: "#b45309",
          padding: "14px 20px",
          borderRadius: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          boxShadow: "0 2px 6px rgba(245, 158, 11, 0.08)"
        }}>
          <strong style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>🔔 ແຈ້ງເຕືອນລະບົບ / System Alerts ({systemAlerts.length}):</span>
          </strong>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.8rem", fontWeight: "600" }}>
            {systemAlerts.map((alertText, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span>•</span>
                <span>{alertText}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alert banner for passenger registration alerts */}
      {activeNotification && (
        <div style={{
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          color: "#ffffff",
          padding: "14px 20px",
          borderRadius: "10px",
          boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span style={{ fontWeight: "700" }}>{activeNotification.message}</span>
          <button 
            onClick={() => {
              const bk = bookings.find(b => b.id === activeNotification.id);
              if (bk) handleLoadBooking(bk);
              setActiveNotification(null);
            }}
            style={{ background: "#ffffff", color: "#047857", border: "none", padding: "6px 12px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}
          >
            ເປີດເບິ່ງ / View
          </button>
        </div>
      )}

      {/* Main Grid split */}
      <div style={posGridStyle}>
        
        {/* Left Column: Form Panel */}
        <div className="card shadow-lg" style={{ display: "flex", flexDirection: "column", gap: "15px", padding: "20px", background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>
            <h3 style={{ margin: 0, fontWeight: "800", color: "var(--primary)", display: "flex", alignItems: "center", gap: "8px" }}>
              {db.settings.logo ? (
                <img src={db.settings.logo} alt="Logo" style={{ maxHeight: "24px", maxWidth: "45px", objectFit: "contain" }} />
              ) : (
                <Ship size={24} />
              )}
              {loadedBooking ? `ລາຍລະອຽດບິນ: ${loadedBooking.id}` : "ສ້າງບິນໃໝ່ (New Ticket)"}
            </h3>
            {loadedBooking && (
              <button 
                onClick={handleResetForm} 
                style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#fca5a5", padding: "4px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold" }}
              >
                ລ້າງຟອມ / Reset
              </button>
            )}
          </div>

          {ticketAssignees.length > 0 && (
            <div style={{
              background: "rgba(15, 118, 110, 0.05)",
              border: "1px solid rgba(15, 118, 110, 0.2)",
              borderRadius: "8px",
              padding: "8px 12px",
              fontSize: "0.8rem",
              color: "#0f766e",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}>
              <Users size={14} />
              <span>{t("ticket_sales_assignee", "ຜູ້ຮັບຜິດຊອບງານຂາຍປີ້ / Ticket Sales")}: <strong>{ticketAssignees.join(", ")}</strong></span>
            </div>
          )}

          <form onSubmit={handleCreateBooking} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Agent Select Button Grid */}
            <div>
              <label style={fieldLabelStyle}>ແຫຼ່ງທີ່ມາ / Tour Partner Agent</label>
              <div style={agentBtnGridStyle}>
                <button
                  type="button"
                  onClick={() => !isLocked && setPartnerId("")}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                    padding: "10px",
                    borderRadius: "12px",
                    cursor: isLocked ? "not-allowed" : "pointer",
                    border: partnerId === "" ? "2px solid #10b981" : "1.5px solid #cbd5e1",
                    background: partnerId === "" ? "#d1fae5" : "#ffffff",
                    color: "#0f172a",
                    boxShadow: partnerId === "" ? "0 4px 12px rgba(16, 185, 129, 0.2)" : "0 2px 4px rgba(0,0,0,0.02)",
                    transition: "all 0.2s ease",
                    outline: "none"
                  }}
                  disabled={isLocked}
                >
                  <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: partnerId === "" ? "rgba(16, 185, 129, 0.2)" : "rgba(15, 118, 110, 0.06)",
                    color: partnerId === "" ? "#047857" : "#0f766e",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.1rem"
                  }}>
                    👤
                  </div>
                  <span style={{ fontSize: "0.8rem", fontWeight: "700", textAlign: "center" }}>{t("walk_in_card", "ລູກຄ້າທົ່ວໄປ (Walk In)")}</span>
                </button>
                {db.partners.filter(p => p.id !== "PTN-000").map(p => {
                  const isSelected = partnerId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => !isLocked && setPartnerId(p.id)}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "6px",
                        padding: "10px",
                        borderRadius: "12px",
                        cursor: isLocked ? "not-allowed" : "pointer",
                        border: isSelected ? "2px solid #10b981" : "1.5px solid #cbd5e1",
                        background: isSelected ? "#d1fae5" : "#ffffff",
                        color: "#0f172a",
                        boxShadow: isSelected ? "0 4px 12px rgba(16, 185, 129, 0.2)" : "0 2px 4px rgba(0,0,0,0.02)",
                        transition: "all 0.2s ease",
                        outline: "none"
                      }}
                      disabled={isLocked}
                    >
                      <div style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: isSelected ? "rgba(16, 185, 129, 0.2)" : "rgba(15, 118, 110, 0.06)",
                        color: isSelected ? "#047857" : "#0f766e",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.1rem"
                      }}>
                        👤
                      </div>
                      <span style={{ fontSize: "0.8rem", fontWeight: "700", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
                        {p.name.split(" ")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time and Date Selector */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={fieldLabelStyle}>ວັນທີເດີນທາງ / Date</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={(e) => {
                    if (!isLocked) {
                      setDate(e.target.value);
                      setIsDateManual(true);
                    }
                  }} 
                  style={inputStyle} 
                  required
                  disabled={isLocked}
                />
              </div>
              <div>
                <label style={fieldLabelStyle}>ຮອບເວລາ / Time Slot</label>
                <input 
                  type="time" 
                  value={time} 
                  onChange={(e) => {
                    if (!isLocked) {
                      setTime(e.target.value);
                      setIsTimeManual(true);
                    }
                  }} 
                  style={inputStyle} 
                  required
                  disabled={isLocked}
                />
              </div>
            </div>

            {/* Advance Booking Checkbox and inputs */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              margin: "5px 0",
              background: isAdvanceBooking ? "rgba(59, 130, 246, 0.06)" : "transparent",
              border: isAdvanceBooking ? "1px solid rgba(59, 130, 246, 0.2)" : "1px dashed var(--border-color)",
              padding: "12px",
              borderRadius: "10px",
              transition: "all 0.2s ease"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="checkbox"
                  id="isAdvanceBooking"
                  checked={isAdvanceBooking}
                  onChange={(e) => {
                    setIsAdvanceBooking(e.target.checked);
                    if (!e.target.checked) {
                      setAdvanceDeposit(0);
                      setAdvanceDiscount(0);
                    }
                  }}
                  style={{ width: "16px", height: "16px", cursor: "pointer" }}
                  disabled={isLocked}
                />
                <label htmlFor="isAdvanceBooking" style={{ fontWeight: "800", fontSize: "0.8rem", color: isAdvanceBooking ? "#3b82f6" : "var(--text-muted)", cursor: "pointer", userSelect: "none" }}>
                  📅 ຈອງລ່ວງໜ້າ (ມີເງິນມັດຈຳ) / Advance Booking with Deposit
                </label>
              </div>

              {isAdvanceBooking && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "5px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: "bold" }}>ມັດຈຳແລ້ວ / Deposit Paid (LAK)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0 LAK"
                        value={advanceDeposit || ""}
                        onChange={(e) => setAdvanceDeposit(Math.max(0, parseInt(e.target.value) || 0))}
                        style={inputStyle}
                        disabled={isLocked}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: "bold" }}>ສ່ວນຫຼຸດ / Discount (LAK)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0 LAK"
                        value={advanceDiscount || ""}
                        onChange={(e) => setAdvanceDiscount(Math.max(0, parseInt(e.target.value) || 0))}
                        style={inputStyle}
                        disabled={isLocked}
                      />
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: "800", color: "#0ea5e9", background: "rgba(14, 165, 233, 0.08)", padding: "6px 10px", borderRadius: "6px" }}>
                    <span>ຍອດຄ້າງຊຳລະ / Balance Due:</span>
                    <span>{formatLAK(Math.max(0, totalPriceLAK - advanceDiscount - advanceDeposit))} LAK</span>
                  </div>
                </div>
              )}
            </div>

            {/* Service selection blocks */}
            <div style={{ marginBottom: "15px" }}>
              <label style={{ ...fieldLabelStyle, marginBottom: "8px", display: "block" }}>ປະເພດການບໍລິການ / Activity Service</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px" }}>
                {(db.services || []).filter(s => s.status === "active").map(srv => {
                  const isSelected = selectedServiceId === srv.id;
                  let emoji = "🎟️";
                  if (srv.name.toLowerCase().includes("boat") || srv.name.includes("ເຮືອ")) emoji = "🚤";
                  else if (srv.name.toLowerCase().includes("rap") || srv.name.includes("🧗")) emoji = "🧗";
                  else if (srv.name.toLowerCase().includes("hik") || srv.name.includes("ເດີນ") || srv.name.includes("🥾")) emoji = "🥾";
                  else if (srv.name.toLowerCase().includes("zip") || srv.name.includes("ສະລິງ")) emoji = "🧗";
                  
                  const p1 = srv.priceTier1 || srv.price || 0;
                  const p3 = srv.priceTier3 || srv.price || 0;
                  const isFlat = srv.priceTier1Type === "flat";
                  const unit = isFlat ? (lang === "en" ? "round" : "ຮອບ") : (lang === "en" ? "pax" : "ທ່ານ");
                  
                  return (
                    <div 
                      key={srv.id}
                      style={{
                        border: isSelected ? "2px solid #10b981" : "1.5px solid #cbd5e1",
                        borderRadius: "12px",
                        padding: "12px",
                        background: isSelected ? "#e6fbf1" : "#ffffff",
                        boxShadow: isSelected ? "0 4px 12px rgba(16, 185, 129, 0.15)" : "0 2px 4px rgba(0,0,0,0.02)",
                        transition: "all 0.2s ease",
                        cursor: isLocked ? "not-allowed" : "pointer"
                      }}
                      onClick={() => {
                        if (!isLocked) {
                          setSelectedServiceId(srv.id);
                          setSelectedTier(paxCount >= 3 ? "tier3" : "tier1");
                          setCustomPricePerPax("");
                        }
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "800", color: "#0f766e", fontSize: "0.9rem", marginBottom: "10px" }}>
                        <span>{emoji}</span>
                        <span style={{ whiteSpace: "normal", wordBreak: "break-word" }}>{srv.name}</span>
                      </div>
                      
                      {/* Price Options */}
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        <div style={{ marginBottom: "4px" }}>
                          <strong>{lang === "en" ? "1-2 Pax:" : "1-2 ທ່ານ:"}</strong> {p1.toLocaleString()} {srv.currency}/{unit}
                        </div>
                        {p3 !== p1 && (
                          <div>
                            <strong>{lang === "en" ? "3+ Pax:" : "3 ທ່ານຂຶ້ນໄປ:"}</strong> {p3.toLocaleString()} {srv.currency}/{unit}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pax Count & Price controls */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "10px" }}>
              <div>
                <label style={fieldLabelStyle}>ຈຳນວນລູກຄ້າ / Passengers</label>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => !isLocked && setPaxCount(Math.max(1, paxCount - 1))}
                    style={paxCountBtnStyle}
                    disabled={isLocked}
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    value={paxCount}
                    onChange={(e) => !isLocked && setPaxCount(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{ ...inputStyle, textAlign: "center", flex: 1, margin: "0 5px" }}
                    min="1"
                    disabled={isLocked}
                  />
                  <button
                    type="button"
                    onClick={() => !isLocked && setPaxCount(paxCount + 1)}
                    style={paxCountBtnStyle}
                    disabled={isLocked}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              <div>
                <label style={fieldLabelStyle}>
                  {pricingDetails.isFlat
                    ? `ລາຄາເໝົາ / Flat Rate (${pricingDetails.currency})`
                    : `ລາຄາຕໍ່ຫົວ / Price per Pax (${pricingDetails.currency})`}
                </label>
                <input
                  type="number"
                  placeholder={defaultPrice.toString()}
                  value={customPricePerPax}
                  onChange={(e) => !isLocked && setCustomPricePerPax(e.target.value)}
                  style={inputStyle}
                  disabled={isLocked || !canEdit}
                />
              </div>
            </div>

            {/* Total Display */}
            <div style={{ marginTop: "10px", padding: "12px", background: "var(--bg-secondary)", borderRadius: "8px", border: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--text-muted)" }}>ລວມທັງໝົດ / Total Price</span>
              <strong style={{ fontSize: "1.3rem", color: "var(--primary)" }}>{formatLAK(totalPriceLAK)} LAK</strong>
            </div>

            {/* Group code display (pre-creation) */}
            {!loadedBooking && (
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "10px", alignItems: "center", marginTop: "5px" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Group Code: <strong>{registrationGroupId}</strong><br />
                  Bill ID: <strong>{billNumber}</strong>
                </div>
                <button
                  type="submit"
                  disabled={isCreatingBooking}
                  style={{
                    padding: "14px 20px",
                    borderRadius: "10px",
                    background: isCreatingBooking ? "#6b7280" : "#10b981",
                    border: "none",
                    color: "#fff",
                    fontWeight: "800",
                    fontSize: "0.95rem",
                    cursor: isCreatingBooking ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: isCreatingBooking ? "none" : "0 4px 12px rgba(16, 185, 129, 0.25)",
                    transition: "all 0.2s ease",
                    opacity: isCreatingBooking ? 0.8 : 1
                  }}
                >
                  {isCreatingBooking ? (
                    <>
                      <RefreshCw size={20} style={{ animation: "spin 1s linear infinite" }} />
                      <span>⏳ ກຳລັງສ້າງບິນ ກະລຸນາລໍຖ້າ... / Creating Booking...</span>
                    </>
                  ) : (
                    <>
                      <QrCode size={20} />
                      <span>➕ ສ້າງບິນ & ພິມ QR / Create Booking & Print QR</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Edit / Audit Controls on Paid/Locked Bills */}
            {loadedBooking && isPaidStatus && !isEditingPaidBill && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "5px" }}>
                <div style={{ padding: "8px 12px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <UserCheck size={16} color="#10b981" />
                  <span style={{ fontSize: "0.8rem", color: "#10b981", fontWeight: "bold" }}>{t("paid_bill_indicator", "ບິນນີ້ຊຳລະເງິນແລ້ວ / Paid Bill")}</span>
                </div>
                {canEdit && (
                  <button
                    type="button"
                    onClick={handleUnlockPaidBill}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "#b45309", border: "none", color: "#fff", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                  >
                    <AlertTriangle size={18} />
                    <span>{t("edit_bill_audit_req", "ແກ້ໄຂບິນ / Edit Bill (ຕ້ອງກວດສອບ)")}</span>
                  </button>
                )}
              </div>
            )}

            {/* Save Edits button when editing paid bill */}
            {isEditingPaidBill && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "5px", padding: "10px", background: "rgba(180, 83, 9, 0.05)", border: "1px solid rgba(180, 83, 9, 0.2)", borderRadius: "8px" }}>
                <div style={{ fontSize: "0.85rem", color: "#fca5a5", display: "flex", alignItems: "center", gap: "6px" }}>
                  <ShieldAlert size={16} />
                  <span>{t("edit_paid_bill_audit", "ກຳລັງແກ້ໄຂຂໍ້ມູນບິນທີ່ຈ່າຍເງິນແລ້ວ (Audit Logger Active)")}</span>
                </div>
                <button
                  type="button"
                  onClick={handleSaveEditsPaidBill}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "#059669", border: "none", color: "#fff", fontWeight: "bold", cursor: "pointer" }}
                >
                  {t("save_edits_btn", "ບັນທຶກການແກ້ໄຂ / Save Edits")}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingPaidBill(false)}
                  style={{ width: "100%", padding: "6px", borderRadius: "8px", background: "transparent", border: "1px solid var(--border-color)", color: "var(--text-muted)", fontSize: "0.8rem", cursor: "pointer" }}
                >
                  {t("cancel_edits_btn", "ຍົກເລີກການແກ້ໄຂ / Cancel Edits")}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Right Column: Queues & Bill Details Preview */}
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          
          {/* QUEUE 0: จองล่วงหน้า / Advance Bookings Queue */}
          {(() => {
            const advanceBookings = firebaseBookings.filter(b => b.status === "advance_booking");
            return (
              <div className="card" style={{ padding: "15px", border: "1.5px solid #3b82f6", background: "rgba(59, 130, 246, 0.03)", borderRadius: "10px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "800", color: "#3b82f6", display: "flex", alignItems: "center", gap: "6px", marginBottom: "5px" }}>
                  📅 0. {t("advance_bookings_title", "ຈອງລ່ວງໜ້າ / Advance Bookings")} ({advanceBookings.length})
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "140px", overflowY: "auto" }}>
                  {advanceBookings.length === 0 ? (
                    <div style={{ fontStyle: "italic", fontSize: "0.8rem", color: "var(--text-muted)", padding: "10px", textAlign: "center" }}>
                      {t("no_advance_bookings", "ບໍ່ມີລາຍການຈອງລ່ວງໜ້າ / No advance bookings")}
                    </div>
                  ) : (
                    advanceBookings.map(bk => (
                      <div key={bk.id} style={queueCardStyle}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong style={{ fontSize: "0.9rem", color: "#3b82f6" }}>{bk.id}</strong>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "5px" }}>
                            ({bk.partnerName?.split(" ")[0] || "Walk-In"}) - {bk.paxCount} pax
                          </span>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            🕒 ວັນທີ: {bk.date} ({bk.time}) - {bk.serviceName}
                          </div>
                          <div style={{ fontSize: "0.7rem", color: "#0f766e", marginTop: "2px", fontWeight: "bold" }}>
                            💵 ມັດຈຳ: {formatLAK(bk.paidLAK)} / ຄ້າງຊຳລະ: {formatLAK(bk.debtLAK)} LAK
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                          <button
                            type="button"
                            onClick={() => {
                              setQrShowModalBooking(bk);
                            }}
                            style={queueActionBtnStyle("#3b82f6")}
                            title={t("show_qr_screen", "ສະແດງ QR ເທິງຈໍ / Show QR on Screen")}
                          >
                            <QrCode size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              flushSync(() => {
                                setLoadedBooking(bk);
                                setRegistrationGroupId(bk.groupId);
                              });
                              triggerQrSlipPrint();
                            }}
                            style={queueActionBtnStyle("#0d9488")}
                            title={t("print_qr_slip", "ພິມໃບ QR / Print QR Slip")}
                          >
                            <Printer size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLoadBooking(bk)}
                            style={queueActionBtnStyle("var(--primary)")}
                          >
                            {t("load_btn", "ໂຫລດ / Load")}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })()}
          
          {/* QUEUE 1: กำลังลงทะเบียน / Registering Queue */}
          <div className="card" style={{ padding: "15px", border: "1.5px dashed #0284c7", background: "rgba(2, 132, 199, 0.03)", borderRadius: "10px" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: "800", color: "#0284c7", display: "flex", alignItems: "center", gap: "6px", marginBottom: "5px" }}>
              ⏳ 1. {t("registering_queue", "ກຳລັງລົງທະບຽນ / Registering Queue")} ({registeringBookings.length})
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "140px", overflowY: "auto" }}>
              {registeringBookings.length === 0 ? (
                <div style={{ fontStyle: "italic", fontSize: "0.8rem", color: "var(--text-muted)", padding: "10px", textAlign: "center" }}>
                  {t("no_groups_registering", "ບໍ່ມີກຸ່ມກຳລັງລົງທະບຽນ / No registering groups")}
                </div>
              ) : (
                registeringBookings.map(bk => (
                  <div key={bk.id} style={queueCardStyle}>
                    <div>
                      <strong style={{ fontSize: "0.9rem", color: "var(--primary)" }}>{bk.groupId}</strong>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "5px" }}>
                        ({bk.partnerName?.split(" ")[0]}) - {bk.paxCount} pax
                      </span>
                      <div style={{ fontSize: "0.7rem", color: "#0284c7", marginTop: "2px", fontWeight: "bold" }}>
                        {t("status_label", "ສະຖານະ / Status")}: {getStatusLabel(bk.status, t)} ({bk.passengers ? bk.passengers.length : 0}/{bk.paxCount} registered)
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "5px" }}>
                      <button
                        onClick={() => {
                          setQrShowModalBooking(bk);
                        }}
                        style={queueActionBtnStyle("#0284c7")}
                        title={t("show_qr_screen", "ສະແດງ QR ເທິງຈໍ / Show QR on Screen")}
                      >
                        <QrCode size={14} />
                      </button>
                      <button
                        onClick={() => {
                          flushSync(() => {
                            setLoadedBooking(bk);
                            setRegistrationGroupId(bk.groupId);
                          });
                          triggerQrSlipPrint();
                        }}
                        style={queueActionBtnStyle("#0d9488")}
                        title={t("print_qr_slip", "ພິມໃບ QR / Print QR Slip")}
                      >
                        <Printer size={14} />
                      </button>
                      <button
                        onClick={() => handleLoadBooking(bk)}
                        style={queueActionBtnStyle("var(--primary)")}
                      >
                        {t("load_btn", "ໂຫລດ / Load")}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* QUEUE 2: พร้อมชำระเงิน / Ready to Checkout Queue */}
          <div className="card" style={{ padding: "15px", border: "1.5px solid #10b981", background: "rgba(16, 185, 129, 0.03)", borderRadius: "10px" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: "800", color: "#10b981", display: "flex", alignItems: "center", gap: "6px", marginBottom: "5px" }}>
              🟢 2. {t("ready_checkout_queue", "ພ້ອມຊຳລະເງິນ / Ready to Checkout")} ({readyBookings.length})
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "140px", overflowY: "auto" }}>
              {readyBookings.length === 0 ? (
                <div style={{ fontStyle: "italic", fontSize: "0.8rem", color: "var(--text-muted)", padding: "10px", textAlign: "center" }}>
                  {t("no_ready_groups", "ບໍ່ມີກຸ່ມທີ່ພ້ອມຊຳລະເງິນ / No ready groups")}
                </div>
              ) : (
                readyBookings.map(bk => (
                  <div key={bk.id} style={queueCardStyle}>
                    <div>
                      <strong style={{ fontSize: "0.9rem", color: "#10b981" }}>{bk.groupId}</strong>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "5px" }}>
                        ({bk.partnerName?.split(" ")[0]}) - {bk.paxCount} pax
                      </span>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-primary)", marginTop: "2px" }}>
                        {t("passengers_label", "ຜູ້ໂດຍສານ / Passengers")}: {bk.passengers?.map(p => p?.name || "").filter(Boolean).join(", ")}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <button
                        onClick={() => handleLoadBooking(bk)}
                        style={queueActionBtnStyle("var(--primary)")}
                      >
                        {t("open_details", "ເປີດລາຍລະອຽດ / Details")}
                      </button>
                      <button
                        onClick={() => {
                          flushSync(() => {
                            setLoadedBooking(bk);
                          });
                          triggerReceiptPrint();
                        }}
                        style={queueActionBtnStyle("#3b82f6")}
                      >
                        <Printer size={14} style={{ marginRight: "4px" }} />
                        {t("print_bill", "ພິມບິນ / Print")}
                      </button>
                      <button
                        onClick={() => {
                          handleLoadBooking(bk);
                          // Scroll to payment or just let them checkout via the loaded view
                        }}
                        style={queueActionBtnStyle("#15803d")}
                      >
                        <Banknote size={14} style={{ marginRight: "4px" }} />
                        {t("pay_btn", "ຊຳລະເງິນ / Pay")}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* POS Bill Receipt Preview Panel */}
          {loadedBooking && (() => {
            const rt = receiptTranslations[lang] || receiptTranslations.la;
            return (
              <div className="receipt-paper card shadow-lg" style={{ padding: "20px", background: "#ffffff", color: "#000000", border: "1px solid #cbd5e1", borderRadius: "10px" }}>
                {/* Receipt Header */}
                <div style={{ position: "relative", borderBottom: "1px dashed #000000", paddingBottom: "10px", marginBottom: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setIsManageBillOpen(true)}
                    style={{
                      position: "absolute",
                      right: "0px",
                      top: "0px",
                      background: "rgba(15, 118, 110, 0.1)",
                      border: "1px solid #0f766e",
                      color: "#0f766e",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                    title={t("manage_bill_desc", "ຈັດການໃບບິນ / Manage Bill")}
                  >
                    ⚙️ {rt.editLabel}
                  </button>
                  <div style={{ textAlign: "center" }}>
                    {db.settings.logo && (
                      <img src={db.settings.logo} alt="Logo" style={{ maxHeight: "60px", maxWidth: "160px", objectFit: "contain", marginBottom: "8px" }} />
                    )}
                    <div style={{ fontWeight: "900", fontSize: "1.3rem", letterSpacing: "1px", color: "#000000" }}>{db.settings.shopName || "TADFANE RAFTING"}</div>
                    {db.settings.shopNameLao && <div style={{ fontWeight: "900", fontSize: "1.1rem", color: "#000000", marginTop: "2px" }}>{db.settings.shopNameLao}</div>}
                    <div style={{ fontSize: "0.85rem", color: "#64748b", textTransform: "uppercase", marginTop: "4px", fontWeight: "700" }}>
                      {rt.posBillPreview}
                    </div>
                    <div style={{ fontSize: "0.8rem", marginTop: "8px", border: "1px solid #000000", display: "inline-block", padding: "4px 10px", borderRadius: "6px", color: "#000000", fontWeight: "bold" }}>
                      {rt.billId}: {loadedBooking.billNumber} | {rt.group}: {loadedBooking.groupId}
                    </div>
                  </div>
                </div>

                {/* Booking Stats / Info */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "1rem", color: "#000000" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", borderBottom: "1px dotted #cbd5e1", paddingBottom: "4px" }}>
                    <span style={{ color: "#475569" }}>{rt.source}</span>
                    <span style={{ fontWeight: "700", textAlign: "right", wordBreak: "break-word" }}>{loadedBooking.partnerName}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", borderBottom: "1px dotted #cbd5e1", paddingBottom: "4px" }}>
                    <span style={{ color: "#475569" }}>{rt.date}</span>
                    <span style={{ fontWeight: "600", textAlign: "right" }}>{formatLocalDate(loadedBooking.date)} | {loadedBooking.time} ນ.</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", borderBottom: "1px dotted #cbd5e1", paddingBottom: "4px" }}>
                    <span style={{ color: "#475569" }}>{rt.service}</span>
                    <span style={{ fontWeight: "700", textAlign: "right", wordBreak: "break-word" }}>{loadedBooking.serviceName}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", borderBottom: "1px dotted #cbd5e1", paddingBottom: "4px" }}>
                    <span style={{ color: "#475569" }}>{rt.passengers}</span>
                    <span style={{ fontWeight: "700", textAlign: "right" }}>{loadedBooking.paxCount} {rt.paxUnit}</span>
                  </div>
                </div>

                {/* Passengers lists */}
                <div style={{ borderTop: "1px dashed #000000", marginTop: "10px", paddingTop: "8px", color: "#000000" }}>
                  <div style={{ fontSize: "0.95rem", fontWeight: "bold", marginBottom: "4px" }}>{rt.passengerListPreview}</div>
                  <div style={{ maxHeight: "110px", overflowY: "auto", fontSize: "0.95rem", display: "flex", flexDirection: "column", gap: "4px" }}>
                    {loadedBooking.passengers && loadedBooking.passengers.length > 0 ? (
                      loadedBooking.passengers.map((p, idx) => (
                        <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "2px", borderBottom: "1px dotted #e2e8f0", paddingBottom: "4px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                            <span style={{ flex: 1, wordBreak: "break-word" }}>{idx + 1}. {p?.name || "N/A"}</span>
                            <span style={{ color: "#475569", whiteSpace: "nowrap" }}>
                              ({p?.age || "-"} {rt.ageUnit} | {getGenderLabel(p?.gender, lang)} | {p?.nationality || "-"} | {p?.phone || "-"})
                            </span>
                          </div>
                          {p?.signature && (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingLeft: "15px", marginTop: "2px" }}>
                              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>✍️ {lang === "en" ? "Signature" : lang === "la" ? "ລາຍເຊັນ" : "ลายเซ็น"}:</span>
                              <img src={p.signature} alt="signature" style={{ maxHeight: "28px", maxWidth: "100px", objectFit: "contain", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "4px", padding: "1px" }} />
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div style={{ fontStyle: "italic", color: "#ef4444", fontWeight: "700" }}>
                        ⚠️ {rt.waitingReg}
                      </div>
                    )}
                  </div>
                </div>

              {/* Staff Assignments Form Section */}
              <div style={{ borderTop: "1.5px solid #e2e8f0", marginTop: "15px", paddingTop: "15px", color: "#000000", display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "#0f766e", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Ship size={20} />
                  <span>⚓ {t("staff_boat_assignments", "ຈັດພະນັກງານ ແລະ ເຮືອ / Staff & Boat Assignments")}</span>
                </div>

                {dispatchAssignees.length > 0 && (
                  <div style={{
                    background: "rgba(16, 185, 129, 0.05)",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    fontSize: "0.8rem",
                    color: "#10b981",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}>
                    <Users size={14} />
                    <span>{t("tour_dispatch_assignee", "ຜູ້ຮັບຜິດຊອບຈັດໄກ້ດ / Tour Dispatch")}: <strong>{dispatchAssignees.join(", ")}</strong></span>
                  </div>
                )}
                
                {/* 1. Multiple Tour Guides */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: "800", color: "#475569" }}>
                    1. Tour Guide ({t("select_multiple_guides", "ເລືອກໄດ້ຫຼາຍກວ່າ 1 ຄົນ")})
                  </label>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                    gap: "10px",
                    marginTop: "6px"
                  }}>
                    {db.employees.filter(emp => emp.role === "guide").map(g => {
                      const isSelected = selectedGuideIds.includes(g.id);

                      const handleCardClick = () => {
                        setSelectedGuideIds(prev => 
                          prev.includes(g.id) ? prev.filter(id => id !== g.id) : [...prev, g.id]
                        );
                      };

                      const nickname = g.name;

                      return (
                        <div 
                          key={g.id}
                          onClick={handleCardClick}
                          style={{
                            border: isSelected ? "2px solid #10b981" : "1.5px solid #cbd5e1",
                            borderRadius: "10px",
                            padding: "8px 12px",
                            cursor: "pointer",
                            background: isSelected ? "#d1fae5" : "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            userSelect: "none",
                            transition: "all 0.15s ease",
                            color: "#0f172a"
                          }}
                        >
                          <span style={{ fontSize: "1rem" }}>👤</span>
                          <span style={{ fontSize: "0.85rem", fontWeight: "700" }}>{nickname}</span>
                          {isSelected && <span style={{ marginLeft: "auto", color: "#047857", fontWeight: "bold" }}>✓</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Tour Driver */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", borderTop: "1px solid #e2e8f0", paddingTop: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: "800", color: "#475569" }}>
                      2. Driver / ຄົນຂັບລົດ ({t("select_multiple_drivers", "ເລືອກໄດ້ຫຼາຍກວ່າ 1 ຄົນ")})
                    </label>
                    <button
                      type="button"
                      onClick={handleAddNewDriver}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#0f766e",
                        fontSize: "0.8rem",
                        fontWeight: "800",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      + Add Driver / ເພີ່ມຄົນຂັບລົດ
                    </button>
                  </div>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                    gap: "10px",
                    marginTop: "6px"
                  }}>
                    {db.employees.filter(emp => emp.role === "driver").map(d => {
                      const isSelected = selectedDriverIds.includes(d.id);

                      const handleCardClick = () => {
                        let nextDrivers;
                        if (selectedDriverIds.includes(d.id)) {
                          nextDrivers = selectedDriverIds.filter(id => id !== d.id);
                        } else {
                          nextDrivers = [...selectedDriverIds, d.id];
                        }
                        setSelectedDriverIds(nextDrivers);
                        setVehicleCount(nextDrivers.length || 1);
                      };

                      const nickname = d.name;

                      return (
                        <div 
                          key={d.id}
                          onClick={handleCardClick}
                          style={{
                            border: isSelected ? "2px solid #10b981" : "1.5px solid #cbd5e1",
                            borderRadius: "10px",
                            padding: "8px 12px",
                            cursor: "pointer",
                            background: isSelected ? "#d1fae5" : "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            userSelect: "none",
                            transition: "all 0.15s ease",
                            color: "#0f172a"
                          }}
                        >
                          <span style={{ fontSize: "1rem" }}>🚐</span>
                          <span style={{ fontSize: "0.85rem", fontWeight: "700" }}>{nickname}</span>
                          {isSelected && <span style={{ marginLeft: "auto", color: "#047857", fontWeight: "bold" }}>✓</span>}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "10px" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "#475569" }}>
                      {t("actual_vehicles", "จำนวนรถที่ใช้จริง / Actual Vehicles")}:
                    </label>
                    <input 
                      type="number"
                      min="1"
                      value={vehicleCount}
                      onChange={(e) => setVehicleCount(Math.max(1, parseInt(e.target.value) || 1))}
                      style={{
                        padding: "8px 12px",
                        border: "1.5px solid #cbd5e1",
                        borderRadius: "8px",
                        fontSize: "0.9rem",
                        width: "100%",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                </div>

                {isBoatTrip && (
                  <>
                    {/* 3. Multiple Boats */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", borderTop: "1px solid #e2e8f0", paddingTop: "12px" }}>
                      <label style={{ fontSize: "0.85rem", fontWeight: "800", color: "#475569" }}>
                        3. Boat ({t("select_multiple_boats", "ເລືອກໄດ້ຫຼາຍກວ່າ 1 ລຳ")})
                      </label>
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(75px, 1fr))",
                        gap: "8px",
                        marginTop: "6px"
                      }}>
                        {db.boats.map(b => {
                          const isSelected = selectedBoatIds.includes(b.id);

                          const handleCardClick = () => {
                            setSelectedBoatIds(prev => {
                              const next = prev.includes(b.id) ? prev.filter(id => id !== b.id) : [...prev, b.id];
                              setBoatCount(next.length || 1);
                              return next;
                            });
                          };

                          const boatNum = b.name.match(/\d+/) ? b.name.match(/\d+/)[0].padStart(2, "0") : b.name;

                          return (
                            <div 
                              key={b.id}
                              onClick={handleCardClick}
                              style={{
                                border: isSelected ? "2px solid #10b981" : "1.5px solid #cbd5e1",
                                borderRadius: "10px",
                                padding: "8px",
                                cursor: "pointer",
                                background: isSelected ? "#d1fae5" : "#ffffff",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                userSelect: "none",
                                transition: "all 0.15s ease",
                                color: "#0f172a",
                                justifyContent: "center"
                              }}
                            >
                              <span style={{ fontSize: "0.95rem" }}>🚤</span>
                              <span style={{ fontSize: "0.85rem", fontWeight: "700" }}>{boatNum}</span>
                              {isSelected && <span style={{ color: "#047857", fontWeight: "bold", fontSize: "0.75rem" }}>✓</span>}
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "10px" }}>
                        <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "#475569" }}>
                          {t("actual_boats", "จำนวนเรือที่ใช้จริง / Actual Boats")}:
                        </label>
                        <input 
                          type="number"
                          min="1"
                          value={boatCount}
                          onChange={(e) => setBoatCount(Math.max(1, parseInt(e.target.value) || 1))}
                          style={{
                            padding: "8px 12px",
                            border: "1.5px solid #cbd5e1",
                            borderRadius: "8px",
                            fontSize: "0.9rem",
                            width: "100%",
                            boxSizing: "border-box"
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="button"
                  onClick={handleSaveCrew}
                  style={{ width: "100%", padding: "14px 20px", border: "none", background: "#0f766e", color: "#ffffff", borderRadius: "10px", fontWeight: "800", cursor: "pointer", fontSize: "0.95rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 4px 10px rgba(15, 118, 110, 0.2)", transition: "all 0.2s" }}
                >
                  <Check size={18} />
                  <span>{t("save_assignments", "ບັນທຶກການຈັດພະນັກງານ / Save Assignments")}</span>
                </button>
              </div>
              <div style={{ borderTop: "1.5px solid #000000", marginTop: "12px", paddingTop: "8px", color: "#000000" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", borderBottom: "1px dotted #cbd5e1", paddingBottom: "4px", fontSize: "1.05rem" }}>
                  <span>{rt.boatTickets}</span>
                  <span style={{ fontWeight: "700" }}>{formatLAK(loadedBooking.pricePaidLAK)} LAK</span>
                </div>
                {/* Discount line */}
                {computedDiscountLAK > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem", color: "#e11d48", marginTop: "4px" }}>
                    <span>{rt.discount} {discountMode === "percent" ? `(${discountAmount}%)` : ""}</span>
                    <span style={{ fontWeight: "700" }}>-{formatLAK(computedDiscountLAK)} LAK</span>
                  </div>
                )}
                {/* Net total */}
                {(() => {
                  const netTotalLAK = loadedBooking.pricePaidLAK - computedDiscountLAK;
                  const actualPaidLAK = netTotalLAK - debtAmount;
                  const rateTHB = db.settings.rateTHB || 700;
                  const rateUSD = db.settings.rateUSD || 21500;

                  const netTotalTHB = netTotalLAK / rateTHB;
                  const netTotalUSD = netTotalLAK / rateUSD;

                  const actualPaidTHB = actualPaidLAK / rateTHB;
                  const actualPaidUSD = actualPaidLAK / rateUSD;

                  let netLabel = computedDiscountLAK > 0 || debtAmount > 0 ? rt.netTotal : rt.totalLAK;
                  let netValueStr = `${formatLAK(netTotalLAK)} LAK`;
                  let netSubs = (
                    <>
                      <span>≈ {formatTHB(netTotalTHB)} THB</span>
                      <span>≈ {formatUSD(netTotalUSD)} USD</span>
                    </>
                  );

                  if (paymentCurrency === "THB") {
                    netLabel = lang === "en" ? "Total THB:" : lang === "la" ? "ຍອດລວມ THB:" : "ยอดรวม THB:";
                    netValueStr = `฿${formatTHB(netTotalTHB)} THB`;
                    netSubs = (
                      <>
                        <span>≈ {formatLAK(netTotalLAK)} LAK</span>
                        <span>≈ {formatUSD(netTotalUSD)} USD</span>
                      </>
                    );
                  } else if (paymentCurrency === "USD") {
                    netLabel = lang === "en" ? "Total USD:" : lang === "la" ? "ຍອດລວມ USD:" : "ยอดรวม USD:";
                    netValueStr = `${formatUSD(netTotalUSD)} USD`;
                    netSubs = (
                      <>
                        <span>≈ {formatLAK(netTotalLAK)} LAK</span>
                        <span>≈ {formatTHB(netTotalTHB)} THB</span>
                      </>
                    );
                  }

                  let actualLabel = rt.actualPaid;
                  let actualValueStr = `${formatLAK(actualPaidLAK)} LAK`;
                  let actualSubs = (
                    <>
                      <span>≈ {formatTHB(actualPaidTHB)} THB</span>
                      <span>≈ {formatUSD(actualPaidUSD)} USD</span>
                    </>
                  );

                  if (paymentCurrency === "THB") {
                    actualLabel = lang === "en" ? "Actual Paid THB:" : lang === "la" ? "ຈ່າຍຕົວຈິງ THB:" : "จ่ายจริง THB:";
                    actualValueStr = `฿${formatTHB(actualPaidTHB)} THB`;
                    actualSubs = (
                      <>
                        <span>≈ {formatLAK(actualPaidLAK)} LAK</span>
                        <span>≈ {formatUSD(actualPaidUSD)} USD</span>
                      </>
                    );
                  } else if (paymentCurrency === "USD") {
                    actualLabel = lang === "en" ? "Actual Paid USD:" : lang === "la" ? "ຈ່າຍຕົວຈິງ USD:" : "จ่ายจริง USD:";
                    actualValueStr = `${formatUSD(actualPaidUSD)} USD`;
                    actualSubs = (
                      <>
                        <span>≈ {formatLAK(actualPaidLAK)} LAK</span>
                        <span>≈ {formatTHB(actualPaidTHB)} THB</span>
                      </>
                    );
                  }

                  const hasDiscountOrDebt = computedDiscountLAK > 0 || debtAmount > 0;

                  return (
                    <>
                      {/* Main Display for Net Total */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "6px" }}>
                        <span style={{ fontWeight: "bold", fontSize: "1.05rem" }}>{netLabel}</span>
                        <span style={{ fontWeight: "900", fontSize: "1.5rem", color: "#0f766e" }}>{netValueStr}</span>
                      </div>
                      
                      {/* Show equivalents for Net Total if there is no discount/debt */}
                      {!hasDiscountOrDebt && (
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "#475569", marginTop: "4px" }}>
                          {netSubs}
                        </div>
                      )}

                      {/* Debt line */}
                      {debtAmount > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem", color: "#ea580c", marginTop: "4px", borderTop: "1px dotted #cbd5e1", paddingTop: "4px" }}>
                          <span>⚠️ {rt.debt}</span>
                          <span style={{ fontWeight: "700" }}>-{formatLAK(debtAmount)} LAK</span>
                        </div>
                      )}

                      {/* Actual paid (if discount or debt) */}
                      {hasDiscountOrDebt && (
                        <>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "6px", borderTop: "2px solid #000000", paddingTop: "4px" }}>
                            <span style={{ fontWeight: "900", fontSize: "1.05rem" }}>{actualLabel}</span>
                            <span style={{ fontWeight: "900", fontSize: "1.5rem", color: "#15803d" }}>{actualValueStr}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "#475569", marginTop: "4px" }}>
                            {actualSubs}
                          </div>
                        </>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Payment Method Selector & Checkout Actions */}
              {!isPaidStatus ? (
                <div style={{ borderTop: "1px dashed #000000", marginTop: "12px", paddingTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {loadedBooking && loadedBooking.status === "advance_booking" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "8px", background: "rgba(59, 130, 246, 0.06)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
                      <span style={{ fontSize: "0.8rem", color: "#1e40af", fontWeight: "bold", textAlign: "center", display: "block" }}>
                        📅 ບິນຈອງລ່ວງໜ້າ / Advance Booking Ticket
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          if (window.confirm("ທ່ານຕ້ອງການເຊັກອິນ ແລະ ຍ້າຍກຸ່ມນີ້ໄປຄິວລົງທະບຽນແມ່ນບໍ່? / Transition to Passenger Check-In?")) {
                            try {
                              const updates = { status: "registering" };
                              await updateBookingInFirebase(loadedBooking.id, updates);
                              const currentDb = getDb();
                              currentDb.bookings = currentDb.bookings.map(b => b.id === loadedBooking.id ? { ...b, ...updates } : b);
                              saveDbLocally(currentDb);
                              setLoadedBooking({ ...loadedBooking, ...updates });
                              alert("ເຊັກອິນສຳເລັດ! ກະລຸນາໃຫ້ລູກຄ້າສະແກນ QR ລົງທະບຽນ / Checked in successfully!");
                            } catch (err) {
                              alert("Failed to check in");
                            }
                          }
                        }}
                        style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "#3b82f6", border: "none", color: "#fff", fontWeight: "800", fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", boxShadow: "0 4px 10px rgba(59, 130, 246, 0.2)", outline: "none" }}
                      >
                        📥 ເຂົ້າຮ່ວມ & ລົງທະບຽນ / Check In & Register
                      </button>
                    </div>
                  )}
                  {/* Discount & Debt Inputs */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <div>
                      <label style={receiptFieldLabelStyle}>{rt.discountLabel}</label>
                      <div style={{ display: "flex", gap: "4px" }}>
                        <input
                          type="number"
                          min="0"
                          max={discountMode === "percent" ? 100 : undefined}
                          value={discountAmount || ""}
                          onChange={(e) => setDiscountAmount(Math.max(0, parseInt(e.target.value) || 0))}
                          placeholder="0"
                          style={{ flex: 1, height: "34px", borderRadius: "6px 0 0 6px", border: "1px solid #cbd5e1", background: "#fff", color: "#000", padding: "0 8px", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
                        />
                        <button
                          onClick={() => { setDiscountMode(discountMode === "lak" ? "percent" : "lak"); setDiscountAmount(0); }}
                          style={{ padding: "0 10px", height: "34px", borderRadius: "0 6px 6px 0", border: "1px solid #cbd5e1", borderLeft: "none", background: discountMode === "percent" ? "#3b82f6" : "#f1f5f9", color: discountMode === "percent" ? "#fff" : "#334155", fontWeight: "800", fontSize: "0.8rem", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s ease" }}
                        >
                          {discountMode === "percent" ? "%" : "LAK"}
                        </button>
                      </div>
                      {discountMode === "percent" && discountAmount > 0 && (
                        <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "2px" }}>
                          = {formatLAK(computedDiscountLAK)} LAK
                        </div>
                      )}
                    </div>
                    <div>
                      <label style={receiptFieldLabelStyle}>{rt.debtLabel} (LAK)</label>
                      <input
                        type="number"
                        min="0"
                        value={debtAmount || ""}
                        onChange={(e) => setDebtAmount(Math.max(0, parseInt(e.target.value) || 0))}
                        placeholder="0"
                        style={{ width: "100%", height: "34px", borderRadius: "6px", border: "1px solid #ea580c", background: "#fff7ed", color: "#000", padding: "0 8px", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <label style={receiptFieldLabelStyle}>{t("received_currency", "ສະກຸນເງິນທີ່ຮັບ / Received Currency")}</label>
                      <div style={{ display: "flex", gap: "5px" }}>
                        {["LAK", "THB", "USD"].map(cur => (
                          <button
                            key={cur}
                            onClick={() => setPaymentCurrency(cur)}
                            style={paymentCurrency === cur ? activePaymentBtnStyle : inactivePaymentBtnStyle}
                          >
                            {cur === "LAK" ? "₭" : cur === "THB" ? "฿" : "$"} {cur}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={receiptFieldLabelStyle}>{rt.paymentMethodLabel}</label>
                      <div style={{ display: "flex", gap: "5px" }}>
                      <button
                        onClick={() => setPaymentMethod("cash")}
                        style={paymentMethod === "cash" ? activePaymentBtnStyle : inactivePaymentBtnStyle}
                      >
                        <Banknote size={14} /> ເງິນສົດ
                      </button>
                      <button
                        onClick={() => setPaymentMethod("transfer")}
                        style={paymentMethod === "transfer" ? activePaymentBtnStyle : inactivePaymentBtnStyle}
                      >
                        <Wallet size={14} /> ໂອນເງິນ
                      </button>
                      <button
                        onClick={() => setPaymentMethod("card")}
                        style={paymentMethod === "card" ? activePaymentBtnStyle : inactivePaymentBtnStyle}
                      >
                        <CreditCard size={14} /> ບັດ
                      </button>
                    </div>
                    </div>
                  </div>
                  <button
                    onClick={handleCheckoutAndPrint}
                    style={{ width: "100%", padding: "16px 20px", borderRadius: "10px", background: "#15803d", border: "none", color: "#fff", fontWeight: "800", fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "8px", boxShadow: "0 4px 12px rgba(21, 128, 61, 0.3)", transition: "all 0.2s ease" }}
                  >
                    <Printer size={20} />
                    <span>💵 {rt.checkoutBtn}</span>
                  </button>
                </div>
              ) : (
                <div style={{ borderTop: "1px dashed #000000", marginTop: "12px", paddingTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <button
                    onClick={() => triggerReceiptPrint()}
                    style={{ width: "100%", padding: "14px 20px", borderRadius: "10px", background: "#3b82f6", border: "none", color: "#fff", fontWeight: "800", fontSize: "0.95rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 4px 12px rgba(59, 130, 246, 0.25)", transition: "all 0.2s ease" }}
                  >
                    <Printer size={18} />
                    <span>🖨️ {rt.reprintBtn}</span>
                  </button>

                  {/* Manage / Edit Bill button */}
                  <button
                    onClick={() => setIsManageBillOpen(true)}
                    style={{ width: "100%", padding: "12px 20px", borderRadius: "10px", background: "#b45309", border: "none", color: "#fff", fontWeight: "800", fontSize: "0.95rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 4px 12px rgba(180, 83, 9, 0.25)", transition: "all 0.2s ease" }}
                  >
                    <Settings size={18} />
                    <span>📝 {t("manage_bill_btn", "ຈັດການບິນ / Manage Bill")}</span>
                  </button>
                  
                  {(loadedBooking.status === "ชำระแล้ว" || loadedBooking.status === "ชำระเงินแล้ว / ออกบิลแล้ว") && (
                    <button
                      onClick={() => handleDispatchBoat(loadedBooking.id)}
                      style={{ width: "100%", padding: "14px 20px", borderRadius: "10px", background: "#2563eb", border: "none", color: "#fff", fontWeight: "800", fontSize: "0.95rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)", transition: "all 0.2s ease" }}
                    >
                      <span>{rt.dispatchBtn}</span>
                    </button>
                  )}
 
                  {loadedBooking.status === "ออกเรือแล้ว" && (
                    <button
                      onClick={() => handleCompleteTrip(loadedBooking.id)}
                      style={{ width: "100%", padding: "14px 20px", borderRadius: "10px", background: "#6b7280", border: "none", color: "#fff", fontWeight: "800", fontSize: "0.95rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 4px 12px rgba(107, 114, 128, 0.25)", transition: "all 0.2s ease" }}
                    >
                      <span>{rt.completeBtn}</span>
                    </button>
                  )}
 
                  {(!isPaidStatus ? canDelete : (currentUser?.role === "owner" || currentUser?.role === "admin")) && (
                    <button
                      onClick={() => handleCancelBooking(loadedBooking.id)}
                      style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "#ef4444", border: "none", color: "#fff", fontWeight: "bold", fontSize: "0.85rem", cursor: "pointer", marginTop: "4px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                    >
                      <span>{rt.cancelBtn}</span>
                    </button>
                  )}
 
                  {/* Audit Logs list inside POS receipt */}
                  {loadedBooking.auditLogs && loadedBooking.auditLogs.length > 0 && (
                    <div style={{ marginTop: "10px", padding: "8px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.7rem", color: "#475569" }}>
                      <div style={{ fontWeight: "bold", color: "#b45309", marginBottom: "4px" }}>{rt.auditLogsTitle}</div>
                      {loadedBooking.auditLogs.map((log, idx) => (
                        <div key={idx} style={{ borderBottom: "1px dashed #e2e8f0", paddingBottom: "2px", marginBottom: "2px" }}>
                          - {new Date(log.updatedAt).toLocaleString()}: {log.updatedBy} {lang === "en" ? "Edit bill" : "ແກ້ໄຂບິນ"} (Pax: {log.oldPax} → {log.newPax})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

          {/* History/Paid list for reprint / history */}
          <div className="card" style={{ padding: "15px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: "800", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              📜 ບິນທີ່ອອກແລ້ວ / Recent Checked-out Bills ({completedBookings.length})
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "140px", overflowY: "auto" }}>
              {completedBookings.slice().reverse().map(bk => (
                <div key={bk.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-secondary)", padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--border-color)", fontSize: "0.8rem" }}>
                  <div>
                    <strong>{bk.billNumber}</strong> ({bk.partnerName?.split(" ")[0]}) - {bk.paxCount} {t("pax_unit", "ຄົນ")}
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                      Guides: {bk.guideIds?.map(gid => getGuideName(gid).split(" ")[0]).join(", ") || "None"} | 
                      Boats: {bk.assignedBoats?.map(ab => getBoatName(ab.boatId).split(" ")[0]).join(", ") || "None"}
                    </div>
                  </div>
                  <button
                    onClick={() => handleLoadBooking(bk)}
                    style={{ padding: "3px 8px", background: "rgba(71, 85, 105, 0.15)", border: "none", color: "var(--text-primary)", borderRadius: "4px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "bold" }}
                  >
                    {t("open_bill_btn", "ເປີດບິນ / Open")}
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* ---------------- MANAGE BILL MODAL OVERLAY ---------------- */}
      {isManageBillOpen && loadedBooking && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(8px)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}>
          <div style={{
            background: "#ffffff",
            width: "100%",
            maxWidth: "780px",
            height: "90vh",
            maxHeight: "750px",
            borderRadius: "20px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            display: "flex",
            flexDirection: "column",
            color: "#0f172a",
            overflow: "hidden",
            animation: "scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
          }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: "1px solid #cbd5e1" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <strong style={{ fontSize: "1.2rem", color: "#0f766e" }}>⚙️ t("manage_bill_desc", "ຈັດການໃບບິນ / Manage Bill") Details</strong>
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{t("edit_bill_desc", "ແກ້ໄຂລາຍລະອຽດ, ຈັດພະນັກງານ ແລະ ຂໍ້ມູນຜູ້ໂດຍສານ")} ID: {loadedBooking.billNumber}</span>
              </div>
              <button 
                onClick={() => setIsManageBillOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Tab selector */}
            <div style={{ display: "flex", background: "#f8fafc", borderBottom: "1px solid #cbd5e1", padding: "0 16px" }}>
              <button
                type="button"
                onClick={() => setManageBillTab("details")}
                style={{
                  padding: "14px 20px",
                  background: "transparent",
                  border: "none",
                  borderBottom: manageBillTab === "details" ? "3px solid #0f766e" : "3px solid transparent",
                  color: manageBillTab === "details" ? "#0f766e" : "#64748b",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "0.9rem"
                }}
              >
                {t("bill_details_tab", "ລາຍລະອຽດບິນ / Bill Details")}
              </button>
              <button
                type="button"
                onClick={() => setManageBillTab("passengers")}
                style={{
                  padding: "14px 20px",
                  background: "transparent",
                  border: "none",
                  borderBottom: manageBillTab === "passengers" ? "3px solid #0f766e" : "3px solid transparent",
                  color: manageBillTab === "passengers" ? "#0f766e" : "#64748b",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "0.9rem"
                }}
              >
                {t("passengers_tab", "ລາຍຊື່ຜູ້ໂດຍສານ")} ({editPaxCount})
              </button>
              <button
                type="button"
                onClick={() => setManageBillTab("logs")}
                style={{
                  padding: "14px 20px",
                  background: "transparent",
                  border: "none",
                  borderBottom: manageBillTab === "logs" ? "3px solid #0f766e" : "3px solid transparent",
                  color: manageBillTab === "logs" ? "#0f766e" : "#64748b",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "0.9rem"
                }}
              >
                {t("audit_logs_tab", "ປະຫວັດການແກ້ໄຂ / Audit Logs")} ({loadedBooking.auditLogs?.length || 0})
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
              {manageBillTab === "details" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "#475569" }}>{t("date_label", "ວັນທີເດີນທາງ")}</label>
                      <input 
                        type="date"
                        className="form-control"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "#475569" }}>{t("time_label", "ຮອບເວລາ")}</label>
                      <input 
                        type="time"
                        className="form-control"
                        value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "#475569" }}>{t("pax_count_label", "ຈຳນວນຄົນ")}</label>
                      <input 
                        type="number"
                        className="form-control"
                        value={editPaxCount}
                        onChange={(e) => {
                          const newCount = Math.max(1, parseInt(e.target.value) || 1);
                          setEditPaxCount(newCount);
                          
                          // Dynamically align passengers array length
                          setEditPassengers(prev => {
                            const updated = [...prev];
                            if (newCount < updated.length) {
                              return updated.slice(0, newCount);
                            } else if (newCount > updated.length) {
                              const diff = newCount - updated.length;
                              for (let i = 0; i < diff; i++) {
                                updated.push({
                                  firstName: "",
                                  lastName: "",
                                  docNumber: "",
                                  nationality: "",
                                  gender: "",
                                  phone: "",
                                  age: "",
                                  dob: "",
                                  docExpiry: "",
                                  facePhoto: ""
                                });
                              }
                            }
                            return updated;
                          });
                        }}
                        min="1"
                        required
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "#475569" }}>{t("service_label", "ກິດຈະກຳ / ບໍລິການ")}</label>
                      <select 
                        className="form-control"
                        value={editServiceId}
                        onChange={(e) => setEditServiceId(e.target.value)}
                        required
                      >
                        {db.services?.filter(s => s.status === "active").map(srv => (
                          <option key={srv.id} value={srv.id}>{srv.name} ({srv.currency})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "#475569" }}>{t("price_tier_label", "ລະດັບລາຄາ / Price Tier")}</label>
                      <select 
                        className="form-control"
                        value={editTier}
                        onChange={(e) => setEditTier(e.target.value)}
                      >
                        <option value="tier1">{t("price_tier1", "ລາຄາເລີ່ມຕົ້ນ (Tier 1 / Flat)")}</option>
                        <option value="tier3">{t("price_tier3", "ລາຄາໂປຣໂມຊັ່ນ/ກຸ່ມໃຫຍ່ (Tier 3)")}</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "#475569" }}>{t("custom_price_label", "ລາຄາຕັ້ງເອງ / Custom Price")}</label>
                      <input 
                        type="number"
                        className="form-control"
                        placeholder={t("custom_price_placeholder", "ປະວ່າງໄວ້ເພື່ອໃຊ້ລາຄາເລີ່ມຕົ້ນ")}
                        value={editCustomPrice}
                        onChange={(e) => setEditCustomPrice(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "#475569" }}>{t("payment_method_label", "ວິທີການຊຳລະເງິນ")}</label>
                      <select 
                        className="form-control"
                        value={editPaymentMethod}
                        onChange={(e) => setEditPaymentMethod(e.target.value)}
                        required
                      >
                        <option value="cash">{t("cash_payment", "ເງິນສົດ / Cash (LAK)")}</option>
                        <option value="qr">{t("qr_payment", "ແກນ QR / Bank QR Transfer")}</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "#475569" }}>{t("notes", "ບັນທຶກ / Notes")}</label>
                    <textarea 
                      className="form-control"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder={t("notes_placeholder", "ໝາຍເຫດເພີ່ມເຕີມ...")}
                      rows="3"
                    />
                  </div>

                  {/* Pricing feedback widget */}
                  {(() => {
                    const priceDetails = getSelectedPricingDetails(editServiceId, editTier, editPaxCount, editCustomPrice);
                    return (
                      <div style={{ padding: "16px", background: "rgba(15, 118, 110, 0.05)", border: "1px solid #cbd5e1", borderRadius: "10px", marginTop: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "700" }}>
                          <span>{t("recalculated_total", "ລາຄາສຸດທິໃໝ່ / Recalculated Total:")}</span>
                          <span style={{ color: "#0f766e", fontSize: "1.1rem" }}>{formatLAK(priceDetails.totalLAK)} LAK</span>
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>
                          ({priceDetails.rawPrice.toLocaleString()} {priceDetails.currency} {priceDetails.isFlat ? t("flat_rate", "ເໝົາລຳ") : t("per_pax", "ຕໍ່ຄົນ")})
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {manageBillTab === "passengers" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {Array.from({ length: editPaxCount }).map((_, idx) => {
                    const pax = editPassengers[idx] || {
                      firstName: "",
                      lastName: "",
                      docNumber: "",
                      nationality: "",
                      gender: "",
                      phone: "",
                      age: "",
                      dob: "",
                      docExpiry: "",
                      emergencyName: "",
                      emergencyRelation: "",
                      emergencyPhone: "",
                      facePhoto: ""
                    };

                    const handlePaxChange = (field, val) => {
                      setEditPassengers(prev => {
                        const copy = [...prev];
                        if (!copy[idx]) copy[idx] = {};
                        copy[idx] = { ...copy[idx], [field]: val };
                        return copy;
                      });
                    };

                    return (
                      <div key={idx} style={{ padding: "16px", border: "1px solid #e2e8f0", borderRadius: "12px", background: "#f8fafc" }}>
                        <div style={{ fontWeight: "700", fontSize: "0.95rem", color: "#0f766e", marginBottom: "12px", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px" }}>
                          👤 {t("passenger_number", "ຜູ້ໂດຍສານຄົນທີ")} {idx + 1} / Passenger #{idx + 1}
                        </div>
                        
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: "0.75rem", fontWeight: "700" }}>{t("first_name_label", "ຊື່ແທ້ (EN) / First Name")}</label>
                            <input 
                              type="text"
                              className="form-control"
                              style={{ padding: "6px 10px", fontSize: "0.85rem" }}
                              value={pax.firstName || ""}
                              onChange={(e) => handlePaxChange("firstName", e.target.value)}
                              placeholder="Somchai"
                            />
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: "0.75rem", fontWeight: "700" }}>{t("last_name_label", "ນາມສະກຸນ (EN) / Last Name")}</label>
                            <input 
                              type="text"
                              className="form-control"
                              style={{ padding: "6px 10px", fontSize: "0.85rem" }}
                              value={pax.lastName || ""}
                              onChange={(e) => handlePaxChange("lastName", e.target.value)}
                              placeholder="Saetang"
                            />
                          </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "12px" }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: "0.75rem", fontWeight: "700" }}>{t("nationality_label", "ສັນຊາດ / Nationality")}</label>
                            <input 
                              type="text"
                              className="form-control"
                              style={{ padding: "6px 10px", fontSize: "0.85rem" }}
                              value={pax.nationality || ""}
                              onChange={(e) => handlePaxChange("nationality", e.target.value)}
                              placeholder="TH, LA, US..."
                            />
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: "0.75rem", fontWeight: "700" }}>{t("dob_label", "ວັນເກີດ / DOB (DD/MM/YYYY)")}</label>
                            <input 
                              type="text"
                              className="form-control"
                              style={{ padding: "6px 10px", fontSize: "0.85rem" }}
                              placeholder="DD/MM/YYYY"
                              value={pax.dobInput || getDobInputVal(pax.dob)}
                              onChange={(e) => handleDobInputChange(idx, e.target.value)}
                            />
                            
                            {/* Dropdowns helper */}
                            <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
                              <select
                                style={{ flex: 1, height: "24px", fontSize: "0.7rem", borderRadius: "4px", border: "1px solid #cbd5e1", padding: 0 }}
                                value={pax.dob ? pax.dob.split("-")[2] : ""}
                                onChange={(e) => handleDobSelectChange(idx, "day", e.target.value)}
                              >
                                <option value="">{t("day", "ວັນ / Day")}</option>
                                {Array.from({ length: 31 }, (_, i) => {
                                  const d = String(i + 1).padStart(2, "0");
                                  return <option key={d} value={d}>{d}</option>;
                                })}
                              </select>
                              
                              <select
                                style={{ flex: 1.2, height: "24px", fontSize: "0.7rem", borderRadius: "4px", border: "1px solid #cbd5e1", padding: 0 }}
                                value={pax.dob ? pax.dob.split("-")[1] : ""}
                                onChange={(e) => handleDobSelectChange(idx, "month", e.target.value)}
                              >
                                <option value="">{t("month", "ເດືອນ / Mo")}</option>
                                {Array.from({ length: 12 }, (_, i) => {
                                  const m = String(i + 1).padStart(2, "0");
                                  return <option key={m} value={m}>{m}</option>;
                                })}
                              </select>
                              
                              <select
                                style={{ flex: 1.5, height: "24px", fontSize: "0.7rem", borderRadius: "4px", border: "1px solid #cbd5e1", padding: 0 }}
                                value={pax.dob ? pax.dob.split("-")[0] : ""}
                                onChange={(e) => handleDobSelectChange(idx, "year", e.target.value)}
                              >
                                <option value="">{t("year", "ປີ / Year")}</option>
                                {Array.from({ length: 100 }, (_, i) => {
                                  const y = String(new Date().getFullYear() - i);
                                  return <option key={y} value={y}>{y}</option>;
                                })}
                              </select>
                            </div>
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: "0.75rem", fontWeight: "700" }}>{t("gender_label", "ເພດ / Gender")}</label>
                            <select 
                              className="form-control"
                              style={{ padding: "6px 10px", fontSize: "0.85rem" }}
                              value={pax.gender || ""}
                              onChange={(e) => handlePaxChange("gender", e.target.value)}
                            >
                              <option value="">{t("select", "ເລືອກ / Select")}</option>
                              <option value="Male">{t("male", "ຊາຍ / Male")}</option>
                              <option value="Female">{t("female", "ຍິງ / Female")}</option>
                              <option value="Other">{t("other", "ອື່ນໆ / Other")}</option>
                            </select>
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: "0.75rem", fontWeight: "700" }}>{t("phone_label", "ເບີໂທຕິດຕໍ່ / Phone")}</label>
                            <input 
                              type="text"
                              className="form-control"
                              style={{ padding: "6px 10px", fontSize: "0.85rem" }}
                              value={pax.phone || ""}
                              onChange={(e) => handlePaxChange("phone", e.target.value)}
                              placeholder="+66..."
                            />
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: "0.75rem", fontWeight: "700" }}>{t("age_label", "ອາຍຸ / Age")}</label>
                            <input 
                              type="number"
                              className="form-control"
                              style={{ padding: "6px 10px", fontSize: "0.85rem" }}
                              value={pax.age || ""}
                              onChange={(e) => handlePaxChange("age", e.target.value)}
                              placeholder={t("years_placeholder", "ປີ (Years)")}
                            />
                          </div>
                        </div>

                        {/* Emergency Contact */}
                        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr 1.2fr", gap: "12px", marginTop: "12px", borderTop: "1px dashed #cbd5e1", paddingTop: "12px" }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: "0.75rem", fontWeight: "700" }}>{t("emergency_name_label", "ຊື່ຜູ້ຕິດຕໍ່ສຸກເສີນ / Emergency Name")}</label>
                            <input 
                              type="text"
                              className="form-control"
                              style={{ padding: "6px 10px", fontSize: "0.85rem" }}
                              value={pax.emergencyName || ""}
                              onChange={(e) => handlePaxChange("emergencyName", e.target.value)}
                              placeholder="Name"
                            />
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: "0.75rem", fontWeight: "700" }}>{t("emergency_relation_label", "ຄວາມສຳພັນ / Relation")}</label>
                            <input 
                              type="text"
                              className="form-control"
                              style={{ padding: "6px 10px", fontSize: "0.85rem" }}
                              value={pax.emergencyRelation || ""}
                              onChange={(e) => handlePaxChange("emergencyRelation", e.target.value)}
                              placeholder="Relation"
                            />
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: "0.75rem", fontWeight: "700" }}>{t("emergency_phone_label", "ເບີໂທສຸກເສີນ / Emergency Phone")}</label>
                            <input 
                              type="text"
                              className="form-control"
                              style={{ padding: "6px 10px", fontSize: "0.85rem" }}
                              value={pax.emergencyPhone || ""}
                              onChange={(e) => handlePaxChange("emergencyPhone", e.target.value)}
                              placeholder="Phone number"
                            />
                          </div>
                        </div>

                        {pax.facePhoto && (
                          <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "0.75rem", fontWeight: "700" }}>{t("selfie_label", "ຮູບຖ່າຍໃບໜ້າ / Selfie:")}</span>
                            <img src={pax.facePhoto} alt="Selfie" style={{ height: "40px", width: "40px", objectFit: "cover", borderRadius: "50%", border: "1px solid #cbd5e1" }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {manageBillTab === "logs" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {loadedBooking.auditLogs && loadedBooking.auditLogs.length > 0 ? (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                      <thead>
                        <tr style={{ borderBottom: "2px solid #cbd5e1", textAlign: "left", color: "#64748b" }}>
                          <th style={{ padding: "10px" }}>{t("time_label", "ເວລາ / Time")}</th>
                          <th style={{ padding: "10px" }}>{t("operator_label", "ຜູ້ດຳເນີນງານ / Operator")}</th>
                          <th style={{ padding: "10px" }}>{t("pax_change_label", "ການປ່ຽນແປງຈຳນວນຄົນ / Pax Change")}</th>
                          <th style={{ padding: "10px" }}>{t("details_label", "ລາຍລະອຽດ / Details")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadedBooking.auditLogs.map((log, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid #e2e8f0" }}>
                            <td style={{ padding: "10px" }}>{new Date(log.updatedAt).toLocaleString()}</td>
                            <td style={{ padding: "10px", fontWeight: "600" }}>{log.updatedBy}</td>
                            <td style={{ padding: "10px" }}>{log.oldPax} ➔ {log.newPax}</td>
                            <td style={{ padding: "10px", color: "#475569" }}>
                              {log.details || (lang === "en" ? `Edit details (Old: ${log.oldPax} pax, New: ${log.newPax} pax)` : `ແກ້ໄຂລາຍລະອຽດບິນ (ເກົ່າ: ${log.oldPax} ຄົນ, ໃໝ່: ${log.newPax} ຄົນ)`)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                      <span style={{ fontSize: "2rem" }}>📜</span>
                      <p style={{ marginTop: "10px", fontSize: "0.9rem" }}>{t("no_edits_logged", "ບໍ່ມີປະຫວັດການແກ້ໄຂບິນ / No edits logged for this bill.")}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 24px", borderTop: "1px solid #cbd5e1", background: "#f8fafc" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => {
                    triggerReceiptPrint();
                  }}
                  className="btn btn-secondary"
                  style={{ padding: "10px 16px", fontSize: "0.85rem" }}
                >
                  🖨️ {t("reprint_bill_btn", "ພິມໃບບິນ / Reprint Bill")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerQrSlipPrint();
                  }}
                  className="btn btn-secondary"
                  style={{ padding: "10px 16px", fontSize: "0.85rem" }}
                >
                  📱 {t("reprint_qr_btn", "ພິມສລິບ QR / Reprint QR")}
                </button>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(t("confirm_cancel_bill", "ທ່ານຕ້ອງການຍົກເລີກບິນນີ້ແມ່ນຫຼືບໍ່? / Cancel this bill?"))) {
                        handleCancelBooking(loadedBooking.id);
                        setIsManageBillOpen(false);
                      }
                    }}
                    className="btn btn-danger"
                    style={{ padding: "10px 16px", fontSize: "0.85rem", background: "#ef4444" }}
                  >
                    ❌ {t("cancel_bill", "ຍົກເລີກບິນ / Cancel Bill")}
                  </button>
                )}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setIsManageBillOpen(false)}
                  className="btn btn-secondary"
                  style={{ padding: "10px 20px", fontSize: "0.85rem" }}
                >
                  {t("close_label", "ປິດ / Close")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const priceDetails = getSelectedPricingDetails(editServiceId, editTier, editPaxCount, editCustomPrice);
                    const newLog = {
                      updatedAt: new Date().toISOString(),
                      updatedBy: currentUser?.name || "Unknown Staff",
                      oldPax: loadedBooking.paxCount,
                      newPax: editPaxCount,
                      details: (lang === "en" ? `Edit details (Price: ${formatLAK(priceDetails.totalLAK)})` : `ແກ້ໄຂລາຍລະອຽດບິນ (ລາຄາ: ${formatLAK(priceDetails.totalLAK)})`)
                    };
                    const updatedLogs = [...(loadedBooking.auditLogs || []), newLog];

                    const updatedBooking = {
                      ...loadedBooking,
                      date: editDate,
                      time: editTime,
                      paxCount: editPaxCount,
                      selectedServiceId: editServiceId,
                      serviceId: editServiceId,
                      serviceName: db.services.find(s => s.id === editServiceId)?.name || loadedBooking.serviceName,
                      selectedTier: editTier,
                      customPricePerPax: editCustomPrice,
                      pricePaidLAK: priceDetails.totalLAK,
                      discountLAK: loadedBooking.discountLAK || 0,
                      netPriceLAK: priceDetails.totalLAK - (loadedBooking.discountLAK || 0),
                      debtLAK: loadedBooking.debtLAK || 0,
                      paidLAK: (priceDetails.totalLAK - (loadedBooking.discountLAK || 0)) - (loadedBooking.debtLAK || 0),
                      paymentMethod: editPaymentMethod,
                      notes: editNotes,
                      passengers: editPassengers.map(p => ({
                        ...p,
                        name: `${p.firstName || ""} ${p.lastName || ""}`.trim()
                      })),
                      auditLogs: updatedLogs
                    };

                    const currentDb = getDb();
                    currentDb.bookings = currentDb.bookings.map(b => b.id === loadedBooking.id ? updatedBooking : b);
                    saveDbLocally(currentDb);
                    setDb(currentDb);
                    setLoadedBooking(updatedBooking);
                    setIsManageBillOpen(false);
                    alert(t("bill_edits_saved_alert", "ບັນທຶກການແກ້ໄຂບິນສຳເລັດແລ້ວ! / Bill edits saved successfully!"));
                  }}
                  className="btn btn-success"
                  style={{ padding: "10px 24px", fontSize: "0.85rem" }}
                >
                  💾 {t("save_changes", "ບັນທຶກການແກ້ໄຂ / Save Changes")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- HARDWARE / COMPUTER CAMERA QR CODE SCANNER MODAL ---------------- */}
      {showScannerModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(5px)",
          zIndex: 99999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "15px"
        }}>
          <div style={{
            background: "#ffffff",
            width: "100%",
            maxWidth: "460px",
            borderRadius: "16px",
            padding: "20px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            color: "#000000"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>
              <strong style={{ fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "6px", color: "#0f766e" }}>
                <Scan size={20} /> {t("scan_qr_btn", "ສະແກນ QR Code / QR Scanner")}
              </strong>
              <button 
                onClick={() => setShowScannerModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Video Reader Element for html5-qrcode */}
            <div id="reader" style={{ width: "100%", background: "#f8fafc", borderRadius: "8px", overflow: "hidden", border: "1px solid #cbd5e1" }}></div>

            {/* Manual Text Input / USB Hardware Barcode scanner support */}
            <form onSubmit={handleManualScanSubmit} style={{ display: "flex", flexDirection: "column", gap: "5px", borderTop: "1px solid #e2e8f0", paddingTop: "15px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#475569" }}>
                {t("enter_code_manually", "ປ້ອນລະຫັດກຸ່ມ ຫຼື ສະແກນຜ່ານສາຍ USB / Enter Group Code Manually")}
              </label>
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  type="text"
                  placeholder={t("group_code_placeholder", "ເຊັ່ນ: REG-1234 ຫຼື BK-1002")}
                  value={manualScanCode}
                  onChange={(e) => setManualScanCode(e.target.value)}
                  style={{ flex: 1, height: "36px", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "0 10px", outline: "none", fontSize: "0.85rem", textTransform: "uppercase" }}
                  autoFocus
                />
                <button
                  type="submit"
                  style={{ padding: "0 15px", borderRadius: "6px", background: "#0f766e", color: "#ffffff", border: "none", fontWeight: "bold", cursor: "pointer", fontSize: "0.85rem" }}
                >
                  {t("open_bill_btn", "ເປີດບິນ / Open")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>

      {/* Hidden QR nodes for iframe printing extraction */}
      {loadedBooking && (
        <div style={{ display: "none" }} aria-hidden="true" className="no-print">
          <div id="print-qr-svg-sign-node">
            <QRCodeSVG 
              value={getSelfRegUrl(loadedBooking.groupId, loadedBooking.partnerId, loadedBooking.paxCount, loadedBooking.id)} 
              size={280} 
              includeMargin={true} 
            />
          </div>
          <div id="print-qr-svg-slip-node">
            <QRCodeSVG 
              value={getSelfRegUrl(loadedBooking.groupId, loadedBooking.partnerId, loadedBooking.paxCount, loadedBooking.id)} 
              size={150} 
              includeMargin={true} 
            />
          </div>
        </div>
      )}
{/* ---------------- SCREEN QR DISPLAY MODAL (Show QR to Customer at Counter) ---------------- */}
      {qrShowModalBooking && (
        <div className="no-print" style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(5px)",
          zIndex: 99999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "15px"
        }}>
          <div style={{
            background: "var(--bg-card, #ffffff)",
            border: "1px solid var(--border-color, #cbd5e1)",
            width: "100%",
            maxWidth: "460px",
            maxHeight: "90vh",
            overflowY: "auto",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
            color: "var(--text-primary, #000000)"
          }}>
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", borderBottom: "1px solid var(--border-color, #e2e8f0)", paddingBottom: "12px" }}>
              <strong style={{ fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "8px", color: "var(--primary, #0f766e)" }}>
                <QrCode size={24} /> ສະແກນລົງທະບຽນ / Scan to Register
              </strong>
              <button 
                onClick={() => setQrShowModalBooking(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted, #64748b)" }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Group Code Info Card */}
            <div style={{
              width: "100%",
              background: "linear-gradient(135deg, rgba(15, 118, 110, 0.1) 0%, rgba(2, 132, 199, 0.1) 100%)",
              border: "1px solid var(--border-color, #cbd5e1)",
              borderRadius: "12px",
              padding: "12px 20px",
              textAlign: "center"
            }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted, #64748b)", textTransform: "uppercase", fontWeight: "bold", letterSpacing: "0.5px" }}>
                ລະຫັດກຸ່ມ / Group Code
              </span>
              <div style={{ fontSize: "2rem", fontWeight: "900", color: "var(--primary, #0f766e)", letterSpacing: "1px", margin: "4px 0" }}>
                {qrShowModalBooking.groupId}
              </div>
              <span style={{ fontSize: "0.9rem", color: "var(--text-primary)", fontWeight: "600" }}>
                {qrShowModalBooking.partnerName || "Walk-in"} &bull; {qrShowModalBooking.paxCount} pax
              </span>
            </div>

            {/* QR Code */}
            <div style={{
              background: "#ffffff",
              padding: "16px",
              borderRadius: "12px",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              border: "1px solid #cbd5e1",
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}>
              <QRCodeSVG value={getSelfRegUrl(qrShowModalBooking.groupId, qrShowModalBooking.partnerId, qrShowModalBooking.paxCount, qrShowModalBooking.id)} size={260} includeMargin={true} />
            </div>

            {/* Display the URL text under the QR code */}
            <div style={{
              fontSize: "0.8rem",
              wordBreak: "break-all",
              color: "#334155",
              background: "#f1f5f9",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontFamily: "monospace",
              textAlign: "center",
              width: "100%",
              fontWeight: "600"
            }}>
              {getSelfRegUrl(qrShowModalBooking.groupId, qrShowModalBooking.partnerId, qrShowModalBooking.paxCount, qrShowModalBooking.id)}
            </div>

            {/* Instructions */}
            <div style={{
              fontSize: "0.85rem",
              textAlign: "left",
              width: "100%",
              background: "var(--bg-secondary, #f8fafc)",
              padding: "12px 16px",
              borderRadius: "10px",
              border: "1px solid var(--border-color, #cbd5e1)",
              lineHeight: "1.5"
            }}>
              <strong style={{ color: "var(--primary, #0f766e)", display: "block", marginBottom: "4px" }}>
                {t("customer_instructions", "ຄຳແນະນຳສຳລັບລູກຄ້າ / Instructions:")}
              </strong>
              {t("inst_step1", "1. ເປີດກ້ອງມືຖືສະແກນ QR Code ນີ້ / 1. Open mobile camera to scan this QR Code")}<br />
              {t("inst_step2", "2. ກົດຍອມຮັບເງື່ອນໄຂຄວາມປອດໄພ / 2. Accept safety terms")}<br />
              {t("inst_step3", "3. ກອກຂໍ້ມູນສ່ວນຕົວໃຫ້ຄົບຖ້ວນທຸກຄົນ ແລ້ວກົດບັນທຶກ / 3. Fill details and save")}
            </div>

            {/* Close Button */}
            <button
              onClick={() => setQrShowModalBooking(null)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                background: "var(--primary, #0f766e)",
                border: "none",
                color: "#ffffff",
                fontWeight: "800",
                cursor: "pointer",
                textAlign: "center",
                boxShadow: "0 4px 12px rgba(15, 118, 110, 0.2)"
              }}
            >
              {t("close_screen", "ປິດໜ້າຈໍນີ້ / Close")}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// Layout design styling objects
const posGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1.1fr",
  gap: "20px"
};

const fieldLabelStyle = {
  fontSize: "0.8rem",
  fontWeight: "700",
  color: "var(--text-muted)",
  marginBottom: "4px",
  display: "block"
};

const receiptFieldLabelStyle = {
  fontSize: "0.7rem",
  fontWeight: "700",
  color: "#475569",
  marginBottom: "2px",
  display: "block"
};

const inputStyle = {
  width: "100%",
  height: "38px",
  borderRadius: "8px",
  border: "1px solid var(--border-color)",
  background: "var(--bg-secondary)",
  color: "var(--text-primary)",
  padding: "0 10px",
  fontSize: "0.85rem",
  outline: "none",
  boxSizing: "border-box"
};

const receiptSelectStyle = {
  width: "100%",
  height: "32px",
  borderRadius: "6px",
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#000000",
  padding: "0 5px",
  fontSize: "0.8rem",
  outline: "none",
  boxSizing: "border-box"
};

const paxCountBtnStyle = {
  width: "36px",
  height: "36px",
  borderRadius: "8px",
  border: "1px solid var(--border-color)",
  background: "var(--bg-secondary)",
  color: "var(--text-primary)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
};

const agentBtnGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(95px, 1fr))",
  gap: "10px",
  marginTop: "6px"
};

const activeAgentBtnStyle = {
  padding: "8px 5px",
  borderRadius: "8px",
  background: "#0f766e",
  border: "none",
  color: "#ffffff",
  fontWeight: "bold",
  fontSize: "0.8rem",
  cursor: "pointer",
  textAlign: "center"
};

const inactiveAgentBtnStyle = {
  padding: "8px 5px",
  borderRadius: "8px",
  background: "var(--bg-secondary)",
  border: "1px solid var(--border-color)",
  color: "var(--text-muted)",
  fontSize: "0.8rem",
  cursor: "pointer",
  textAlign: "center"
};

const activePaymentBtnStyle = {
  flex: 1,
  padding: "8px",
  borderRadius: "6px",
  background: "#0f766e",
  border: "none",
  color: "#ffffff",
  fontWeight: "bold",
  fontSize: "0.8rem",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "4px"
};

const inactivePaymentBtnStyle = {
  flex: 1,
  padding: "8px",
  borderRadius: "6px",
  background: "#ffffff",
  border: "1px solid #cbd5e1",
  color: "#475569",
  fontSize: "0.8rem",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "4px"
};

const queueCardStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: "var(--bg-secondary)",
  padding: "8px 12px",
  borderRadius: "8px",
  border: "1px solid var(--border-color)"
};

const queueActionBtnStyle = (color) => ({
  padding: "4px 8px",
  borderRadius: "6px",
  background: color,
  border: "none",
  color: "#ffffff",
  fontWeight: "bold",
  fontSize: "0.75rem",
  cursor: "pointer"
});

const receiptLineItemStyle = {
  display: "flex",
  justifyContent: "space-between",
  borderBottom: "1px dotted #e2e8f0",
  paddingBottom: "3px"
};
