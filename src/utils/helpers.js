// helpers.js - Utility formatters and helper functions

// Format numbers as Lao Kip (₭)
export const formatLAK = (amount) => {
  return new Intl.NumberFormat("lo-LA", {
    style: "currency",
    currency: "LAK",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace("LAK", "₭").trim();
};

// Format numbers as Thai Baht (฿)
export const formatTHB = (amount) => {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount).replace("THB", "฿").trim();
};

// Format numbers as US Dollar ($)
export const formatUSD = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Convert custom currencies to LAK
export const toLAK = (amount, fromCurrency, rates) => {
  const num = parseFloat(amount) || 0;
  if (fromCurrency === "THB") {
    return num * (rates.rateTHB || 620);
  }
  if (fromCurrency === "USD") {
    return num * (rates.rateUSD || 21500);
  }
  return num; // Already LAK
};

// Convert LAK to target currency
export const fromLAK = (lakAmount, toCurrency, rates) => {
  const num = parseFloat(lakAmount) || 0;
  if (toCurrency === "THB") {
    return num / (rates.rateTHB || 620);
  }
  if (toCurrency === "USD") {
    return num / (rates.rateUSD || 21500);
  }
  return num; // Already LAK
};

// Format ISO date string into readable local format (e.g. 09/06/2026)
export const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const parts = String(dateStr).split("-");
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Format date and time
export const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return "-";
  const date = new Date(dateTimeStr);
  if (isNaN(date.getTime())) return dateTimeStr;
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

// Generate a random customer receipt or bill number
export const generateBillId = () => {
  return `BILL-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
};

// Translate internal database statuses to bilingual / local labels
export const getStatusLabel = (status, t) => {
  if (!status) return "";
  const s = status.toLowerCase();
  if (s.includes("รอลูกค้า") || s.includes("ยังไม่กรอก") || s.includes("กำลังกรอก") || s.includes("กำลังลงทะเบียน")) {
    return t("status_registering", "ລົງທະບຽນ / Registering");
  }
  if (s.includes("พร้อมชำระ") || s.includes("รอชำระ") || s.includes("รอຊຳລະ") || s.includes("เรียบร้อย")) {
    return t("status_pending", "ລໍຖ້າຊຳລະເງິນ / Pending Checkout");
  }
  if (s.includes("ชำระ") || s.includes("ออกบิล")) {
    return t("status_checkedin", "ພ້ອມເດີນທາງ / Ready for Dispatch");
  }
  if (s.includes("ออกเรือ")) {
    return t("status_dispatched", "ກຳລັງເດີນທາງ / Dispatched");
  }
  if (s.includes("เสร็จสิ้น") || s.includes("completed")) {
    return t("status_completed", "ສຳເລັດແລ້ວ / Completed");
  }
  if (s.includes("ยกเลิก") || s.includes("ຍົກເລີກ") || s.includes("cancel")) {
    return t("status_cancelled", "ຍົກເລີກ / Cancelled");
  }
  return status;
};
