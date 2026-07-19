// PrintFallback.jsx - Dedicated high-fidelity print viewer for standalone/iOS PWA mode fallback.
import React, { useEffect, useState } from "react";
import { getDb } from "../db/mockDb";
import { formatLAK, formatTHB, formatUSD } from "../utils/helpers";
import { QRCodeSVG } from "qrcode.react";

const formatLocalDate = (dateStr) => {
  if (!dateStr) return "-";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
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
    discount: "Discount:",
    debt: "Outstanding Debt:",
    netTotal: "NET TOTAL:",
    actualPaid: "ACTUALLY PAID:"
  },
  la: {
    billNumber: "ເລກທີບິນ:",
    date: "ວັນເວລາ:",
    payment: "ການຊຳລະ:",
    agent: "ຕົວແທນ:",
    passengers: "ຜູ້ໂດຍສານ:",
    paxUnit: "ຄົນ",
    driver: "ຄົນຂັບລົດ:",
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
    discount: "ສ່ວນຫຼຸດ:",
    debt: "ຄ້າງຊຳລະ:",
    netTotal: "ຍອດສຸທິ:",
    actualPaid: "ຈ່າຍຕົວຈิง:",
  }
};

const getGenderLabel = (g, lang) => {
  if (!g) return "-";
  const lower = g.toLowerCase();
  if (lower.includes("male") || lower === "ชาย" || lower === "ຊາຍ" || lower === "m") {
    return lang === "en" ? "M" : "ຊາຍ";
  }
  if (lower.includes("female") || lower === "หญิง" || lower === "ຍິງ" || lower === "f") {
    return lang === "en" ? "F" : "ຍິງ";
  }
  return g;
};

export default function PrintFallback() {
  const [db] = useState(getDb());
  const params = new URLSearchParams(window.location.search);
  const printParam = params.get("print");
  const idParam = params.get("id");
  const groupIdParam = params.get("groupId");
  const lang = params.get("lang") || "la";
  const isReprint = params.get("reprint") === "true" || params.get("duplicate") === "true";

  const dbBooking = db.bookings?.find(b => b.id === idParam);
  const loadedBooking = dbBooking || (idParam ? {
    id: idParam,
    groupId: groupIdParam || "",
    partnerId: params.get("partnerId") || "",
    paxCount: parseInt(params.get("paxCount")) || 0,
    passengers: []
  } : null);

  const getDriverName = (id) => {
    const dr = db.drivers?.find(d => d.id === id);
    return dr ? `${dr.name} (${dr.phone || "-"})` : id;
  };

  const getGuideName = (id) => {
    const gd = db.guides?.find(g => g.id === id);
    return gd ? gd.name : id;
  };

  const getBoatName = (id) => {
    const bt = db.boats?.find(b => b.id === id);
    return bt ? bt.name : id;
  };

  const getSelfRegUrl = (groupId, partnerId, paxCount, bookingId) => {
    const customHostUrl = localStorage.getItem("pos_custom_host_url") || "";
    let baseUrl = customHostUrl.trim() || window.location.origin;
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    let url = `${baseUrl}/register?`;
    if (bookingId) {
      url += `bookingId=${bookingId}&`;
    }
    url += `groupId=${groupId}`;
    if (paxCount) {
      url += `&pax=${paxCount}`;
    }
    return url;
  };

  // Trigger print and auto close
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
      const closeTimer = setTimeout(() => {
        try {
          window.close();
        } catch (e) {
          console.warn("Unable to close tab:", e);
        }
      }, 1000);
      return () => clearTimeout(closeTimer);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleManualPrint = () => {
    window.print();
  };

  if (!printParam) {
    return <div style={{ padding: "20px", textAlign: "center" }}>No print target specified.</div>;
  }

  const rt = receiptTranslations[lang] || receiptTranslations.la;

  return (
    <div style={{ background: "#ffffff", color: "#000000", minHeight: "100vh", padding: "10px 10px 40px 10px", boxSizing: "border-box" }}>
      <style>{`
        @media print {
          body > #root {
            visibility: visible !important;
            display: block !important;
          }
          .no-print {
            display: none !important;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
      
      {/* Screen action bar (hidden during print) */}
      <div className="no-print" style={{
        maxWidth: "400px",
        margin: "0 auto 20px auto",
        padding: "15px",
        background: "#f8fafc",
        border: "1px solid #cbd5e1",
        borderRadius: "12px",
        textAlign: "center",
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
      }}>
        <h4 style={{ margin: "0 0 10px 0", color: "#0f766e" }}>🖨️ ລະບົບພິມບິນ / Printing Terminal</h4>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button
            onClick={handleManualPrint}
            style={{
              padding: "10px 16px",
              background: "#0f766e",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "0.9rem"
            }}
          >
            ພິມບິນ / Click to Print
          </button>
          <button
            onClick={() => window.close()}
            style={{
              padding: "10px 16px",
              background: "#cbd5e1",
              color: "#1e293b",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "0.9rem"
            }}
          >
            ປິດ / Close
          </button>
        </div>
      </div>

      {/* RENDER RECEIPT */}
      {printParam === "receipt" && loadedBooking && (
        <div style={{ maxWidth: "320px", margin: "0 auto", padding: "12px", border: "1px solid #e2e8f0", fontFamily: "monospace", fontSize: "16px", lineHeight: "1.5", fontWeight: "700" }}>
          {isReprint && (
            <div style={{ border: "2px solid #000000", padding: "4px 8px", marginBottom: "12px", fontWeight: "900", textTransform: "uppercase", fontSize: "14px", letterSpacing: "1px", background: "#ffffff", color: "#000000", textAlign: "center" }}>
              *** ພິມຄືນໃຫມ່ / REPRINT ***
            </div>
          )}
          <div style={{ textAlign: "center", borderBottom: "2px dashed #000000", paddingBottom: "8px", marginBottom: "8px" }}>
            {db.settings.logo && (
              <img src={db.settings.logo} alt="Logo" style={{ maxHeight: "80px", maxWidth: "220px", objectFit: "contain", marginBottom: "8px" }} />
            )}
            <h3 style={{ margin: "4px 0 0 0", fontWeight: "900", fontSize: "20px", color: "#000000", letterSpacing: "1px" }}>{db.settings.shopName || "TADFANE RAFTING"}</h3>
            {db.settings.shopNameLao && <h4 style={{ margin: "2px 0 0 0", fontWeight: "900", fontSize: "16px", color: "#000000" }}>{db.settings.shopNameLao}</h4>}
            <p style={{ fontSize: "12px", margin: "4px 0 2px 0", fontWeight: "bold" }}>{lang === "en" ? (db.settings.shopAddress || "Vang Vieng, Laos") : (db.settings.shopAddressLao || db.settings.shopAddress || rt.address)}</p>
            <p style={{ fontSize: "12px", margin: "0", fontWeight: "bold" }}>Tel: {db.settings.shopTel || "+856 20 555-9000"}</p>
            {db.settings.shopTaxId && <p style={{ fontSize: "11px", margin: "2px 0 0 0", fontWeight: "bold" }}>Tax ID: {db.settings.shopTaxId}</p>}
            {db.settings.shopExtra && <p style={{ fontSize: "11px", margin: "2px 0 0 0", fontWeight: "bold" }}>{db.settings.shopExtra}</p>}
          </div>

          <div style={{ fontSize: "15px", marginBottom: "6px", lineHeight: "1.5" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>{rt.billNumber}</strong>
              <span>{loadedBooking.billNumber}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>{rt.date}</strong>
              <span>{formatLocalDate(loadedBooking.date)} {loadedBooking.time}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>{rt.payment}</strong>
              <span>
                {loadedBooking.paymentMethod === "cash"
                  ? rt.cash
                  : loadedBooking.paymentMethod === "transfer"
                  ? rt.transfer
                  : loadedBooking.paymentMethod === "card"
                  ? rt.card
                  : loadedBooking.paymentMethod?.toUpperCase()}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>{rt.agent}</strong>
              <span>{loadedBooking.partnerName}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>{rt.passengers}</strong>
              <span>{loadedBooking.paxCount} {rt.paxUnit}</span>
            </div>
            
            <div style={{ borderTop: "2px dashed #000000", margin: "6px 0" }}></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>{rt.driver}</strong>
              <span>
                {(() => {
                  const driversNames = loadedBooking.driverIds && loadedBooking.driverIds.length > 0
                    ? loadedBooking.driverIds.map(id => getDriverName(id).split(" (")[1]?.replace(")", "") || getDriverName(id).split(" ")[0]).join(", ")
                    : (loadedBooking.driverId ? getDriverName(loadedBooking.driverId) : rt.unassigned);
                  const vehCount = loadedBooking.vehicleCount !== undefined ? loadedBooking.vehicleCount : 1;
                  return `${driversNames} (รถ: ${vehCount} คัน)`;
                })()}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>{rt.guides}</strong>
              <span>{loadedBooking.guideIds?.map(gId => getGuideName(gId).split(" ")[0]).join(" & ") || rt.unassigned}</span>
            </div>
            
            <div style={{ borderTop: "2px dotted #000000", margin: "4px 0", paddingTop: "4px" }}>
              <strong>{rt.boats}</strong>
            </div>
            {loadedBooking.assignedBoats && loadedBooking.assignedBoats.length > 0 ? (
              <>
                {loadedBooking.assignedBoats.map((ab, index) => (
                  <div key={index} style={{ paddingLeft: "6px", fontSize: "12px", fontWeight: "700", display: "flex", justifyContent: "space-between" }}>
                    <span>{rt.boatLabel} {index + 1}: {getBoatName(ab.boatId)}</span>
                    <span>({ab.paxCount} {rt.paxUnit})</span>
                  </div>
                ))}
                <div style={{ paddingLeft: "6px", fontSize: "12px", fontWeight: "700", borderTop: "1px dashed #000000", marginTop: "2px", paddingTop: "2px", display: "flex", justifyContent: "space-between" }}>
                  <strong>จำนวนเรือ / Boats:</strong>
                  <span>{loadedBooking.boatCount !== undefined ? loadedBooking.boatCount : loadedBooking.assignedBoats.length} ລຳ / Boats</span>
                </div>
              </>
            ) : (
              <div style={{ paddingLeft: "6px", fontSize: "12px" }}>{rt.unassigned}</div>
            )}
          </div>

          <div style={{ borderTop: "2px dashed #000000", margin: "6px 0" }}></div>
          <div style={{ fontSize: "14px", marginBottom: "6px" }}>
            <div style={{ fontWeight: "900", marginBottom: "4px" }}>
              {rt.passengerListHeader} ({loadedBooking.paxCount} {rt.paxUnit}):
            </div>
            {loadedBooking.passengers && loadedBooking.passengers.length > 0 ? (
              loadedBooking.passengers.map((pax, idx) => (
                <div key={idx} style={{ paddingLeft: "6px", fontWeight: "700", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                  <span style={{ flex: 1, wordBreak: "break-word", whiteSpace: "normal", textAlign: "left" }}>
                    {idx + 1}. {pax?.name || "N/A"}
                  </span>
                  <span style={{ whiteSpace: "nowrap", textAlign: "right" }}>
                    ({pax?.age || "-"} {rt.ageUnit} | {getGenderLabel(pax?.gender, lang)} | {pax?.nationality || "-"})
                  </span>
                </div>
              ))
            ) : (
              <div style={{ paddingLeft: "6px", fontStyle: "italic", color: "#000000" }}>
                {rt.waitingReg}
              </div>
            )}
          </div>

          <div style={{ borderTop: "2px dashed #000000", margin: "6px 0" }}></div>
          <div style={{ fontSize: "15px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", fontWeight: "700" }}>
              <span style={{ flex: 1, wordBreak: "break-word", whiteSpace: "normal", textAlign: "left" }}>
                {loadedBooking.serviceName} x{loadedBooking.paxCount}:
              </span>
              <span style={{ whiteSpace: "nowrap", textAlign: "right" }}>
                {formatLAK(loadedBooking.pricePaidLAK)} LAK
              </span>
            </div>
            {(loadedBooking.discountLAK || 0) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "700", fontSize: "14px", marginTop: "4px" }}>
                <span>{rt.discount}</span>
                <span>-{formatLAK(loadedBooking.discountLAK)} LAK</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", fontWeight: "900", fontSize: "20px", marginTop: "8px", borderTop: "2px solid #000000", paddingTop: "6px" }}>
              <span style={{ flex: 1, textAlign: "left" }}>{(loadedBooking.discountLAK || 0) > 0 || (loadedBooking.debtLAK || 0) > 0 ? rt.netTotal : rt.total}</span>
              <span style={{ whiteSpace: "nowrap", textAlign: "right" }}>
                {formatLAK((loadedBooking.netPriceLAK !== undefined ? loadedBooking.netPriceLAK : loadedBooking.pricePaidLAK))} LAK
              </span>
            </div>
            {(loadedBooking.debtLAK || 0) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "700", fontSize: "14px", marginTop: "4px", borderTop: "1px dotted #000000", paddingTop: "4px" }}>
                <span>⚠️ {rt.debt}</span>
                <span>-{formatLAK(loadedBooking.debtLAK)} LAK</span>
              </div>
            )}
            {((loadedBooking.discountLAK || 0) > 0 || (loadedBooking.debtLAK || 0) > 0) && (
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "900", fontSize: "18px", marginTop: "6px", borderTop: "2px solid #000000", paddingTop: "6px" }}>
                <span>{rt.actualPaid}</span>
                <span>{formatLAK(loadedBooking.paidLAK !== undefined ? loadedBooking.paidLAK : loadedBooking.pricePaidLAK)} LAK</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", marginTop: "6px", fontWeight: "700" }}>
              <span>THB:</span>
              <span>{formatTHB((loadedBooking.netPriceLAK !== undefined ? loadedBooking.netPriceLAK : loadedBooking.pricePaidLAK) / db.settings.rateTHB)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", fontWeight: "700" }}>
              <span>USD:</span>
              <span>{formatUSD((loadedBooking.netPriceLAK !== undefined ? loadedBooking.netPriceLAK : loadedBooking.pricePaidLAK) / db.settings.rateUSD)}</span>
            </div>
          </div>

          <div style={{ marginTop: "20px", textAlign: "center", borderTop: "2px dashed #000000", paddingTop: "8px" }}>
            <p style={{ fontSize: "14px", margin: "0", fontWeight: "900", color: "#000000" }}>{rt.thankYou}</p>
          </div>
        </div>
      )}

      {/* RENDER QR SLIP */}
      {printParam === "qr_slip" && loadedBooking && (
        <div style={{ maxWidth: "260px", margin: "0 auto", padding: "12px", border: "1px solid #cbd5e1", borderRadius: "8px", textAlign: "center", fontFamily: "monospace", lineHeight: "1.5" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "900", color: "#000000", margin: "0" }}>{db.settings.shopName || "TADFANE RAFTING"}</h3>
          {db.settings.shopNameLao && <h4 style={{ fontSize: "13px", fontWeight: "800", color: "#000000", margin: "2px 0 0 0" }}>{db.settings.shopNameLao}</h4>}
          <p style={{ fontWeight: "bold", fontSize: "11px", margin: "6px 0 6px 0", color: "#000000" }}>ບິນລົງທະບຽນລູກຄ້າ / Register Slip</p>
          
          <div style={{ display: "inline-block", padding: "10px", background: "#ffffff", border: "1px solid #000000", borderRadius: "8px", margin: "10px 0" }}>
            <QRCodeSVG value={getSelfRegUrl(loadedBooking.groupId, loadedBooking.partnerId, loadedBooking.paxCount, loadedBooking.id)} size={150} includeMargin={true} />
          </div>

          <div style={{ border: "2px dashed #000000", borderRadius: "6px", padding: "8px", margin: "8px 0", background: "#ffffff" }}>
            <span style={{ fontSize: "11px", fontWeight: "bold", display: "block" }}>ລະຫັດກຸ່ມ / Group Code</span>
            <span style={{ fontSize: "20px", fontWeight: "800", letterSpacing: "1px", display: "block" }}>{loadedBooking.groupId}</span>
          </div>

          <div style={{ textAlign: "left", fontSize: "11px", background: "#f1f5f9", padding: "8px 12px", borderRadius: "8px", marginTop: "10px", border: "1px solid #cbd5e1", fontWeight: "700" }}>
            <strong>1. ສະແກນ QR Code / Scan QR</strong><br />
            Scan QR code with your phone camera.<br />
            <strong>2. ກອກຂໍ້ມູນ / Enter Details</strong><br />
            Fill in name, nationality, gender, age, phone and submit.
          </div>

          <div style={{ marginTop: "15px", fontSize: "11px", fontStyle: "italic", borderTop: "1px dashed #000000", paddingTop: "6px", fontWeight: "700" }}>
            Thank you / ຂໍຂອບໃຈ
          </div>
        </div>
      )}

      {/* RENDER QR SIGN STANDEE */}
      {printParam === "qr_sign" && (
        <div style={{ maxWidth: "500px", margin: "0 auto", border: "1px solid #cbd5e1", padding: "40px", borderRadius: "12px", textAlign: "center", fontFamily: "sans-serif", color: "#000000" }}>
          <h1 style={{ fontWeight: "900", fontSize: "2.4rem", color: "#000000", margin: "0 0 5px 0" }}>{db.settings.shopName || "TADFANE RAFTING"}</h1>
          {db.settings.shopNameLao && <h2 style={{ fontWeight: "900", fontSize: "1.8rem", color: "#000000", margin: "0 0 15px 0" }}>{db.settings.shopNameLao}</h2>}
          <h3 style={{ fontSize: "1.3rem", color: "#475569", marginBottom: "1.5rem" }}>ລົງທະບຽນຜູ້ໂດຍສານ / Customer Registration</h3>
          
          <div style={{ margin: "25px 0", display: "flex", justifyContent: "center" }}>
            {loadedBooking ? (
              <QRCodeSVG value={getSelfRegUrl(loadedBooking.groupId, loadedBooking.partnerId, loadedBooking.paxCount, loadedBooking.id)} size={280} includeMargin={true} />
            ) : (
              <QRCodeSVG value={`${window.location.origin}/register?groupId=${groupIdParam}`} size={280} includeMargin={true} />
            )}
          </div>

          <div style={{ fontSize: "1.3rem", fontWeight: "900", margin: "20px 0", color: "#000000" }}>
            Group Code / ລະຫັດກຸ່ມ: <span style={{ textDecoration: "underline" }}>{loadedBooking?.groupId || groupIdParam}</span>
          </div>

          <div style={{ textAlign: "left", maxWidth: "440px", margin: "0 auto", fontSize: "0.95rem", lineHeight: "1.6", fontWeight: "700" }}>
            <p>1. Scan the QR Code using your mobile phone camera.</p>
            <p>2. Agree to safety rules & terms.</p>
            <p>3. Enter name, nationality, age, gender, phone details and submit.</p>
            <p>4. Please notify cashier after submit.</p>
          </div>
        </div>
      )}

    </div>
  );
}
