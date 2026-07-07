// TicketManifest.jsx - Receipt and Passenger Manifest printable system
import React, { useState, useEffect } from "react";
import { flushSync } from "react-dom";
import { useLanguage } from "../utils/LanguageContext";

const formatLocalDate = (dateStr) => {
  if (!dateStr) return "-";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};
import { getDb } from "../db/mockDb";
import { formatLAK, formatTHB, formatUSD } from "../utils/helpers";
import { QRCodeSVG } from "qrcode.react";
import { Printer, ArrowLeft, Receipt, ClipboardList, Ticket } from "lucide-react";

export default function TicketManifest({ activeTripId, onBack }) {
  const { lang, t } = useLanguage();
  const [db, setDb] = useState(getDb());
  const [selectedTripId, setSelectedTripId] = useState(activeTripId || "");
  const [previewTab, setPreviewTab] = useState("receipt"); // receipt, individual
  const [printTemplate, setPrintTemplate] = useState(null); // 'receipt', 'manifest', 'tickets', or null

  useEffect(() => {
    const handleDbUpdate = () => {
      setDb(getDb());
    };
    handleDbUpdate();
    window.addEventListener("db-update", handleDbUpdate);
    return () => window.removeEventListener("db-update", handleDbUpdate);
  }, []);

  useEffect(() => {
    if (activeTripId) {
      setSelectedTripId(activeTripId);
    }
  }, [activeTripId]);

  const trips = db.trips;
  const currentTrip = db.trips.find(t => t.id === selectedTripId);

  // Print controllers
  const triggerPrint = (mode) => {
    flushSync(() => {
      setPrintTemplate(mode);
    });

    const handleAfterPrint = () => {
      setTimeout(() => {
        setPrintTemplate(null);
      }, 1000);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
    window.addEventListener("afterprint", handleAfterPrint);

    // Force synchronous layout reflow then wait for DOM paint
    const forceReflow = document.body.offsetHeight;

    setTimeout(() => {
      window.print();
    }, 300);

    setTimeout(() => {
      setPrintTemplate(null);
    }, 5000);
  };

  // Compute receipt variables if trip is selected
  let paxCount = 0;
  let basePrice = db.settings.basePriceLAK;
  let totalLAK = 0;
  let exchangeRates = db.settings;
  let tripBoat = null;
  let tripCaptain = null;
  let tripGuides = [];
  let tripDrivers = [];
  let tripCustomers = [];
  let tripPartner = null;

  let tripBoats = [];
  let tripCaptains = [];

  if (currentTrip) {
    tripBoats = currentTrip.boatIds 
      ? currentTrip.boatIds.map(bid => db.boats.find(b => b.id === bid)).filter(Boolean)
      : [db.boats.find(b => b.id === currentTrip.boatId)].filter(Boolean);
    tripCaptains = currentTrip.captainIds
      ? currentTrip.captainIds.map(cid => db.employees.find(e => e.id === cid)).filter(Boolean)
      : [db.employees.find(e => e.id === currentTrip.captainId)].filter(Boolean);
    tripBoat = tripBoats.length > 0 ? { name: tripBoats.map(b => b.name).join(", ") } : null;
    tripCaptain = tripCaptains.length > 0 ? { name: tripCaptains.map(c => c.name).join(", ") } : null;
    tripGuides = currentTrip.guideIds.map(gid => db.employees.find(e => e.id === gid)).filter(Boolean);
    tripDrivers = currentTrip.driverIds
      ? currentTrip.driverIds.map(did => db.employees.find(e => e.id === did)).filter(Boolean)
      : [];
    tripCustomers = currentTrip.customerIds.map(cid => db.customers.find(c => c.id === cid)).filter(Boolean);
    paxCount = tripCustomers.length;
    
    // Total price calculations
    totalLAK = paxCount * basePrice;

    if (currentTrip.bookingId) {
      const booking = db.bookings.find(b => b.id === currentTrip.bookingId);
      if (booking) {
        tripPartner = db.partners.find(p => p.id === booking.partnerId);
      }
    }
  }

  return (
    <div>
      <div className="no-print">
        <div className="page-header no-print">
        <div className="page-title" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {onBack && (
            <button className="btn btn-secondary" style={{ padding: "6px" }} onClick={onBack}>
              <ArrowLeft size={16} />
            </button>
          )}
          <div>
            <h1>Ticket & Manifest (ໃບບິນ ແລະ ບັນຊີລາຍຊື່)</h1>
            <p>ພິມໃບບິນຮັບເງິນ ແລະ ບັນຊີລາຍຊື່ຜູ້ໂດຍສານປະຈຳເຮືອ</p>
          </div>
        </div>
      </div>

      {/* Select Trip Panel - No Print */}
      <div className="card no-print" style={{ marginBottom: "1.5rem" }}>
        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
          {t("select_trip_doc", "ເລືອກທ່ຽວເຮືອເພື່ອສະແດງເອກະສານ / Select Boat Trip:")}
        </label>
        <select 
          className="form-control"
          value={selectedTripId}
          onChange={(e) => {
            setSelectedTripId(e.target.value);
            setPreviewTab("receipt"); // default back
          }}
        >
          <option value="">-- {t("select_trip_option", "ເລືອກທ່ຽວເຮືອ (Select a Trip)")} --</option>
          {trips.map(t => {
            const boat = db.boats.find(b => b.id === t.boatId);
            return (
              <option key={t.id} value={t.id}>
                {formatLocalDate(t.date)} {t.time} | {boat ? boat.name : `Boat ${t.boatId}`} ({t.customerIds.length} Pax) - [{t.status}]
              </option>
            );
          })}
        </select>
      </div>

      {currentTrip ? (
        <div className="no-print" style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "2rem" }}>
          
          {/* 1. Ticket/Receipt Screen Preview Card */}
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            
            {/* Tab selection for Group Bill vs Individual Ticket */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>
              <div style={{ display: "flex", gap: "4px" }}>
                <button
                  type="button"
                  className={`btn ${previewTab === "receipt" ? "btn-primary" : "btn-secondary"}`}
                  style={{ padding: "5px 10px", fontSize: "0.75rem" }}
                  onClick={() => setPreviewTab("receipt")}
                >
                  <Receipt size={14} /> {t("group_bill", "ບິນລວມກຸ່ມ / Group Bill")}
                </button>
                <button
                  type="button"
                  className={`btn ${previewTab === "individual" ? "btn-primary" : "btn-secondary"}`}
                  style={{ padding: "5px 10px", fontSize: "0.75rem" }}
                  onClick={() => setPreviewTab("individual")}
                >
                  <Ticket size={14} /> {t("individual_ticket", "ປີ້ແຍກຄົນ / Individual Tickets")} ({paxCount})
                </button>
              </div>
              
              <button 
                className="btn btn-success" 
                style={{ padding: "5px 10px", fontSize: "0.75rem" }} 
                onClick={() => triggerPrint(previewTab === "receipt" ? "receipt" : "tickets")}
              >
                <Printer size={14} /> {t("print_label", "ພິມ / Print")}
              </button>
            </div>

            {/* Render selected preview tab */}
            {previewTab === "receipt" ? (
              /* Group Receipt Preview */
              <div style={receiptPreviewStyle}>
                <div style={{ textAlign: "center", borderBottom: "1px dashed #000", paddingBottom: "10px", marginBottom: "10px" }}>
                  <h4 style={{ margin: 0, fontWeight: "900", fontSize: "16px" }}>TADFANE RAFTING</h4>
                  <h5 style={{ margin: "2px 0 0 0", fontWeight: "900", fontSize: "13px" }}>ຕາດຟານ ລ່ອງແກ່ງ</h5>
                  <p style={{ fontSize: "10px", margin: "2px 0 0 0" }}>Vang Vieng / Luang Prabang, Laos</p>
                  <p style={{ fontSize: "10px", margin: "2px 0 0 0" }}>Tel: +856 20 555-9000</p>
                </div>

                <div style={{ fontSize: "11px", marginBottom: "8px" }}>
                  <div><strong>Bill No:</strong> {currentTrip.id.replace("TRIP", "BILL")}</div>
                  <div><strong>Date/Time:</strong> {formatLocalDate(currentTrip.date)} {currentTrip.time}</div>
                  <div><strong>Boat:</strong> {tripBoat ? tripBoat.name : `Boat ${currentTrip.boatId}`}</div>
                  <div><strong>{t("passengers", "ຜູ້ໂດຍສານ / Passengers")}:</strong> {paxCount} {t("pax_unit", "ຄົນ (Pax)")}</div>
                  {tripGuides.length > 0 && <div><strong>Guides:</strong> {tripGuides.map(g => g.name.split(" ")[0]).join(", ")}</div>}
                  {tripDrivers.length > 0 && <div><strong>Driver:</strong> {tripDrivers.map(d => d.name.split(" ")[0]).join(", ")}</div>}
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", marginBottom: "10px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #000" }}>
                      <th style={{ textTransform: "none", color: "#000", background: "none", padding: "4px 0", fontSize: "11px" }}>Description</th>
                      <th style={{ textTransform: "none", color: "#000", background: "none", padding: "4px 0", textAlign: "right", fontSize: "11px" }}>Qty</th>
                      <th style={{ textTransform: "none", color: "#000", background: "none", padding: "4px 0", textAlign: "right", fontSize: "11px" }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: "4px 0", border: "none", color: "#000" }}>{t("boat_ticket", "ປີ້ເຮືອ / Boat Ticket")}</td>
                      <td style={{ padding: "4px 0", border: "none", textAlign: "right", color: "#000" }}>{paxCount}</td>
                      <td style={{ padding: "4px 0", border: "none", textAlign: "right", color: "#000" }}>{formatLAK(totalLAK)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Passenger Names List on screen receipt */}
                <div style={{ fontSize: "10px", margin: "10px 0", borderTop: "1px dashed #ccc", paddingTop: "8px", color: "#333" }}>
                  <strong style={{ color: "#000" }}>{t("passengers_list", "ລາຍຊື່ຜູ້ໂດຍສານ / Passenger List")} ({paxCount} {t("pax_unit", "ຄົນ / Pax")}):</strong>
                  <div style={{ paddingLeft: "5px", marginTop: "2px" }}>
                    {tripCustomers.map((c, i) => (
                      <div key={c.id || i}>{i + 1}. {c.name} {c.passport ? `(${c.passport})` : ""}</div>
                    ))}
                  </div>
                </div>

                <div style={{ borderTop: "1px dashed #000", paddingTop: "8px", fontSize: "11px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
                    <span>TOTAL LAK:</span>
                    <span>{formatLAK(totalLAK)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#333", fontSize: "10px", marginTop: "2px" }}>
                    <span>Equiv THB:</span>
                    <span>{formatTHB(totalLAK / exchangeRates.rateTHB)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#333", fontSize: "10px" }}>
                    <span>Equiv USD:</span>
                    <span>{formatUSD(totalLAK / exchangeRates.rateUSD)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#333", fontSize: "10px", marginTop: "2px", borderTop: "1px dashed #000", paddingTop: "2px" }}>
                    <span>Payment Method:</span>
                    <span style={{ fontWeight: "bold" }}>
                      {currentTrip.paymentMethod === "cash" ? "Cash (ເງິນສົດ)" : currentTrip.paymentMethod === "transfer" ? "Bank Transfer (ໂອນເງິນ)" : currentTrip.paymentMethod === "card" ? "Credit Card (ບັດເຄຣດິດ)" : "Cash"}
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: "15px", textAlign: "center", borderTop: "1px dashed #000", paddingTop: "10px" }}>
                  <div style={{ background: "#fff", padding: "5px", display: "inline-block", borderRadius: "4px" }}>
                    <QRCodeSVG value={currentTrip.id} size={70} />
                  </div>
                  <p style={{ fontSize: "9px", margin: "5px 0 0 0" }}>{t("thank_you", "ຂອບໃຈທີ່ໃຊ້ບໍລິການ / THANK YOU")}</p>
                  <p style={{ fontSize: "8px", margin: "2px 0 0 0", color: "#666" }}>Scan QR to verify Trip</p>
                </div>
              </div>
            ) : (
              /* Individual Boarding Passes Preview */
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "430px", overflowY: "auto", padding: "8px", background: "var(--bg-tertiary)", borderRadius: "8px" }}>
                {tripCustomers.map((cust) => (
                  <div key={cust.id} style={individualTicketPreviewStyle}>
                    <div style={{ textAlign: "center", borderBottom: "1px dashed #000", paddingBottom: "6px", marginBottom: "6px" }}>
                      <h4 style={{ margin: 0, fontWeight: "900", fontSize: "13px", color: "#000" }}>TADFANE RAFTING</h4>
                      <h5 style={{ margin: "2px 0 0 0", fontWeight: "900", fontSize: "11px", color: "#000" }}>ຕາດຟານ ລ່ອງແກ່ງ</h5>
                      <span style={{ fontSize: "8px", color: "#555", fontWeight: "bold", letterSpacing: "0.5px" }}>BOARDING PASS / ບັດຂຶ້ນເຮືອ</span>
                    </div>

                    <div style={{ fontSize: "9px", color: "#000", lineHeight: "1.4" }}>
                      <div><strong>Ticket No:</strong> TKT-{cust.id}</div>
                      <div><strong>Passenger Name:</strong> {cust.name}</div>
                      <div><strong>Passport/ID:</strong> {cust.passport}</div>
                      <div><strong>Phone:</strong> {cust.phone || "-"}</div>
                      <div><strong>Hotel:</strong> {cust.hotel || "-"}</div>
                      <div><strong>Assigned Boat:</strong> {tripBoat ? tripBoat.name : "Boat"}</div>
                      <div><strong>Crew:</strong> {tripCaptain ? tripCaptain.name : "Captain"} (Capt) & {tripGuides.map(g => g.name.split(" ")[0]).join("/")}{tripDrivers.length > 0 ? ` & Driver: ${tripDrivers.map(d => d.name.split(" ")[0]).join("/")}` : ""}</div>
                      <div><strong>Date/Time:</strong> {formatLocalDate(currentTrip.date)} {currentTrip.time}</div>
                      <div style={{ borderTop: "1px dashed #cbd5e1", marginTop: "4px", paddingTop: "4px" }}>
                        <strong>Price:</strong> {formatLAK(basePrice)} | {formatTHB(basePrice / exchangeRates.rateTHB)}
                      </div>
                    </div>

                    {cust.signature && (
                      <div style={{ marginTop: "6px", borderTop: "1px dashed #cbd5e1", paddingTop: "4px", textAlign: "center" }}>
                        <span style={{ fontSize: "8px", color: "#777", display: "block" }}>Waiver Signature:</span>
                        <img src={cust.signature} alt="Sig" style={{ height: "18px", display: "block", margin: "2px auto 0 auto" }} />
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "center", marginTop: "6px" }}>
                      <QRCodeSVG value={cust.id} size={42} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Passenger Manifest Screen Preview */}
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ color: "#f8fafc", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "6px" }}>
                <ClipboardList size={18} color="var(--primary)" />
                {t("passenger_manifest_title", "ໃບສະແດງລາຍຊື່ຜູ້ໂດຍສານ / Passenger Manifest")}
              </h3>
              <button 
                className="btn btn-success" 
                style={{ padding: "5px 10px", fontSize: "0.75rem" }} 
                onClick={() => triggerPrint("manifest")}
              >
                <Printer size={14} /> {t("print_label", "ພິມ / Print")}
              </button>
            </div>

            {/* Manifest Preview */}
            <div style={manifestPreviewStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #000", paddingBottom: "10px", marginBottom: "15px" }}>
                <div>
                  <h2 style={{ fontSize: "16px", fontWeight: "bold", margin: 0 }}>PASSENGER MANIFEST / ບັນຊີລາຍຊື່ຜູ້ໂດຍສານ</h2>
                  <span style={{ fontSize: "11px" }}>TADFANE RAFTING AUTHORITY</span>
                </div>
                <div style={{ textAlign: "right", fontSize: "11px" }}>
                  <div><strong>Trip ID:</strong> {currentTrip.id}</div>
                  <div><strong>Date:</strong> {formatLocalDate(currentTrip.date)} | <strong>Time:</strong> {currentTrip.time}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "11px", marginBottom: "15px" }}>
                <div>
                  <strong>Yacht/Boat (ເຮືອ):</strong> {tripBoat ? tripBoat.name : `Boat ${currentTrip.boatId}`} (Max 6 pax)<br />
                  <strong>Captain (ກັປຕັນ):</strong> {tripCaptain ? tripCaptain.name : "Unassigned"}<br />
                  <strong>Guides Assigned (ໄກ້ດ):</strong> {tripGuides.map(g => g.name).join(" & ") || "Unassigned"}<br />
                  <strong>Driver (ຄົນຂັບລົດ):</strong> {tripDrivers.map(d => d.name).join(" & ") || "Unassigned"}
                </div>
                <div style={{ textAlign: "right" }}>
                  <strong>{t("total_passengers", "ຜູ້ໂດຍສານທັງໝົດ / Total Passengers")}:</strong> {paxCount} / 6 {t("pax_unit", "ຄົນ")}
                </div>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                <thead>
                  <tr style={{ background: "#e2e8f0" }}>
                    <th style={{ padding: "6px", border: "1px solid #000", color: "#000", background: "none", fontSize: "11px", fontWeight: "bold" }}>No</th>
                    <th style={{ padding: "6px", border: "1px solid #000", color: "#000", background: "none", fontSize: "11px", fontWeight: "bold" }}>Passenger Name</th>
                    <th style={{ padding: "6px", border: "1px solid #000", color: "#000", background: "none", fontSize: "11px", fontWeight: "bold" }}>Passport / ID</th>
                    <th style={{ padding: "6px", border: "1px solid #000", color: "#000", background: "none", fontSize: "11px", fontWeight: "bold" }}>Phone</th>
                    <th style={{ padding: "6px", border: "1px solid #000", color: "#000", background: "none", fontSize: "11px", fontWeight: "bold" }}>Hotel</th>
                    <th style={{ padding: "6px", border: "1px solid #000", color: "#000", background: "none", fontSize: "11px", fontWeight: "bold" }}>Emergency contact</th>
                    <th style={{ padding: "6px", border: "1px solid #000", color: "#000", background: "none", fontSize: "11px", fontWeight: "bold" }}>Signature</th>
                  </tr>
                </thead>
                <tbody>
                  {tripCustomers.map((cust, index) => (
                    <tr key={cust.id}>
                      <td style={{ padding: "6px", border: "1px solid #000", color: "#000", textAlign: "center" }}>{index + 1}</td>
                      <td style={{ padding: "6px", border: "1px solid #000", color: "#000" }}>{cust.name}</td>
                      <td style={{ padding: "6px", border: "1px solid #000", color: "#000" }}>{cust.passport}</td>
                      <td style={{ padding: "6px", border: "1px solid #000", color: "#000" }}>{cust.phone}</td>
                      <td style={{ padding: "6px", border: "1px solid #000", color: "#000" }}>{cust.hotel || "-"}</td>
                      <td style={{ padding: "6px", border: "1px solid #000", color: "#000" }}>
                        {cust.emergencyName} ({cust.emergencyPhone || "-"})
                      </td>
                      <td style={{ padding: "2px 6px", border: "1px solid #000", color: "#000", textAlign: "center" }}>
                        {cust.signature ? (
                          <img src={cust.signature} alt="Sig" style={{ height: "25px", maxWidth: "80px", display: "block", margin: "0 auto" }} />
                        ) : (
                          <span style={{ color: "#999", fontSize: "9px" }}>No signature</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {/* Fill empty seats */}
                  {Array.from({ length: 6 - paxCount }).map((_, i) => (
                    <tr key={`empty-${i}`}>
                      <td style={{ padding: "6px", border: "1px solid #000", color: "#999", textAlign: "center" }}>{paxCount + i + 1}</td>
                      <td style={{ padding: "6px", border: "1px solid #000", color: "#999" }}>- Empty seat -</td>
                      <td style={{ padding: "6px", border: "1px solid #000", color: "#999" }}>-</td>
                      <td style={{ padding: "6px", border: "1px solid #000", color: "#999" }}>-</td>
                      <td style={{ padding: "6px", border: "1px solid #000", color: "#999" }}>-</td>
                      <td style={{ padding: "6px", border: "1px solid #000", color: "#999" }}>-</td>
                      <td style={{ padding: "6px", border: "1px solid #000", color: "#999" }}>-</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: "20px", display: "grid", gridTemplateColumns: currentTrip.agentSignature ? "1fr 1fr 1fr" : "1fr 1fr", gap: "10px", fontSize: "10px" }}>
                <div>
                  Dispatched by: _______________________<br />
                  Counter Officer
                </div>
                {currentTrip.agentSignature && (
                  <div style={{ textAlign: "center" }}>
                    Agent Representative Signature:<br />
                    <img 
                      src={currentTrip.agentSignature} 
                      alt="Agent Signature" 
                      style={{ height: "30px", borderBottom: "1px solid #000", paddingBottom: "2px", display: "block", margin: "5px auto 0 auto" }} 
                    />
                    <span style={{ fontSize: "9px", color: "#666" }}>
                      {tripPartner ? tripPartner.name : "Agent Partner"}
                    </span>
                  </div>
                )}
                <div style={{ textAlign: "right" }}>
                  Captain Signature: _______________________<br />
                  {tripCaptain ? tripCaptain.name : "Captain"}
                </div>
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="card" style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
          <ClipboardList size={48} style={{ opacity: 0.3, marginBottom: "0.5rem" }} />
          {t("select_trip_preview", "ກະລຸນາເລືອກທ່ຽວເຮືອດ້ານເທິງເພື່ອສະແດງເອກະສານ / Select a trip to preview")}
          (Please select a trip above to preview documents)
        </div>
      )}
      </div>

      {/* ---------------- HIDDEN PRINTABLE DOMS (Only Visible to @media print) ---------------- */}
      {currentTrip && printTemplate && (
        <div className="printable-area">
          
          {/* 1. Epson Thermal Receipt Print Container (Group Bill) */}
          {printTemplate === "receipt" && (
            <div className="receipt-print" style={{ color: "#000000", fontFamily: "monospace", fontSize: "14px", width: "260px", margin: "0 auto", padding: "12px", lineHeight: "1.5", fontWeight: "700" }}>
            <div style={{ textAlign: "center", borderBottom: "2px dashed #000000", paddingBottom: "8px", marginBottom: "8px" }}>
              <h4 style={{ margin: 0, fontWeight: "900", fontSize: "18px", color: "#000" }}>TADFANE RAFTING</h4>
              <h5 style={{ margin: "2px 0 0 0", fontWeight: "900", fontSize: "14px", color: "#000" }}>ຕາດຟານ ລ່ອງແກ່ງ</h5>
              <p style={{ fontSize: "11px", margin: "2px 0", fontWeight: "bold" }}>Vang Vieng, Laos</p>
              <p style={{ fontSize: "11px", margin: "1px 0", fontWeight: "bold" }}>Tel: +856 20 555-9000</p>
            </div>

            <div style={{ fontSize: "10px", marginBottom: "5px" }}>
              <div><strong>Bill Number:</strong> {currentTrip.id.replace("TRIP", "BILL")}</div>
              <div><strong>Date:</strong> {formatLocalDate(currentTrip.date)} {currentTrip.time}</div>
              <div><strong>Boat:</strong> {tripBoat ? tripBoat.name : `Boat ${currentTrip.boatId}`}</div>
              <div><strong>Passengers:</strong> {paxCount} pax</div>
              {tripGuides.length > 0 && <div><strong>Guides:</strong> {tripGuides.map(g => g.name.split(" ")[0]).join(", ")}</div>}
              {tripDrivers.length > 0 && <div><strong>Driver:</strong> {tripDrivers.map(d => d.name.split(" ")[0]).join(", ")}</div>}
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px", marginBottom: "5px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #000" }}>
                  <th style={{ color: "#000", background: "none", padding: "2px 0", fontSize: "10px" }}>Item</th>
                  <th style={{ color: "#000", background: "none", padding: "2px 0", textAlign: "right", fontSize: "10px" }}>Qty</th>
                  <th style={{ color: "#000", background: "none", padding: "2px 0", textAlign: "right", fontSize: "10px" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: "2px 0", color: "#000" }}>Boat Ticket</td>
                  <td style={{ padding: "2px 0", textAlign: "right", color: "#000" }}>{paxCount}</td>
                  <td style={{ padding: "2px 0", textAlign: "right", color: "#000" }}>{formatLAK(totalLAK)}</td>
                </tr>
              </tbody>
            </table>

            {/* Passenger Names List on printed receipt */}
            <div style={{ fontSize: "9px", margin: "5px 0", borderTop: "1px dashed #000", paddingTop: "5px", textAlign: "left" }}>
              <strong>PASSENGERS ({paxCount}):</strong>
              <div style={{ paddingLeft: "5px", marginTop: "2px" }}>
                {tripCustomers.map((c, i) => (
                  <div key={c.id || i}>{i + 1}. {c.name} {c.passport ? `(${c.passport})` : ""}</div>
                ))}
              </div>
            </div>

            <div style={{ borderTop: "2px dashed #000000", paddingTop: "6px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "900", fontSize: "17px", borderTop: "2px solid #000000", paddingTop: "4px" }}>
                <span>TOTAL:</span>
                <span>{formatLAK(totalLAK)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", marginTop: "1px" }}>
                <span>THB:</span>
                <span>{formatTHB(totalLAK / exchangeRates.rateTHB)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px" }}>
                <span>USD:</span>
                <span>{formatUSD(totalLAK / exchangeRates.rateUSD)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", marginTop: "1px", borderTop: "1px dashed #000", paddingTop: "1px" }}>
                <span>PAYMENT:</span>
                <span style={{ fontWeight: "bold" }}>
                  {currentTrip.paymentMethod === "cash" ? "CASH" : currentTrip.paymentMethod === "transfer" ? "TRANSFER" : currentTrip.paymentMethod === "card" ? "CARD" : "CASH"}
                </span>
              </div>
            </div>

            <div style={{ marginTop: "10px", textAlign: "center", borderTop: "1px dashed #000", paddingTop: "5px" }}>
              <div style={{ background: "#fff", padding: "3px", display: "inline-block" }}>
                <QRCodeSVG value={currentTrip.id} size={60} />
              </div>
              <p style={{ fontSize: "8px", margin: "3px 0 0 0" }}>{t("thank_you_short", "ຂອບໃຈ / THANK YOU")}</p>
            </div>
          </div>
          )}

          {/* 2. Individual Boarding Passes (TKT per passenger) print wrapper */}
          {printTemplate === "tickets" && (
            <div className="individual-tickets-print" style={{ color: "#000" }}>
            {tripCustomers.map((cust) => (
              <div key={cust.id} className="individual-ticket">
                <div style={{ textAlign: "center", borderBottom: "1px dashed #000", paddingBottom: "6px", marginBottom: "8px" }}>
                  <h4 style={{ margin: 0, fontWeight: "900", fontSize: "16px", color: "#000000" }}>TADFANE RAFTING</h4>
                  <h5 style={{ margin: "2px 0 0 0", fontWeight: "900", fontSize: "13px", color: "#000000" }}>ຕາດຟານ ລ່ອງແກ່ງ</h5>
                  <span style={{ fontSize: "9px", color: "#333", fontWeight: "bold", letterSpacing: "0.5px" }}>BOARDING PASS / ບັດຂຶ້ນເຮືອ</span>
                </div>

                <div style={{ fontSize: "10px", marginBottom: "8px", lineHeight: "1.4" }}>
                  <div><strong>Ticket No:</strong> TKT-{cust.id}</div>
                  <div><strong>Passenger:</strong> {cust.name}</div>
                  <div><strong>Passport:</strong> {cust.passport}</div>
                  <div><strong>Phone:</strong> {cust.phone || "-"}</div>
                  <div><strong>Hotel:</strong> {cust.hotel || "-"}</div>
                  <div><strong>Emergency:</strong> {cust.emergencyName} ({cust.emergencyPhone || "-"})</div>
                  <div style={{ borderTop: "1px dashed #000", margin: "4px 0", paddingTop: "4px" }}>
                    <strong>Boat/Seat:</strong> {tripBoat ? tripBoat.name : "Boat"} | Max 6 seats
                  </div>
                  <div><strong>Captain:</strong> {tripCaptain ? tripCaptain.name : "Unassigned"}</div>
                  <div><strong>Guides:</strong> {tripGuides.map(g => g.name).join(" & ") || "Unassigned"}</div>
                  <div><strong>Driver:</strong> {tripDrivers.map(d => d.name).join(" & ") || "Unassigned"}</div>
                  <div><strong>Date/Time:</strong> {formatLocalDate(currentTrip.date)} {currentTrip.time}</div>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px", marginBottom: "5px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #000" }}>
                      <th style={{ color: "#000", background: "none", padding: "2px 0", fontSize: "9px" }}>Fare Description</th>
                      <th style={{ color: "#000", background: "none", padding: "2px 0", textAlign: "right", fontSize: "9px" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: "2px 0" }}>1x {t("boat_ride_insurance", "ລ່ອງເຮືອ (ລວມປະກັນໄພ) / Boat Ride & Insurance")}</td>
                      <td style={{ padding: "2px 0", textAlign: "right" }}>{formatLAK(basePrice)}</td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ borderTop: "1px dashed #000", paddingTop: "4px", fontSize: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
                    <span>FARE LAK:</span>
                    <span>{formatLAK(basePrice)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px" }}>
                    <span>FARE THB:</span>
                    <span>{formatTHB(basePrice / exchangeRates.rateTHB)}</span>
                  </div>
                </div>

                {cust.signature && (
                  <div style={{ marginTop: "10px", borderTop: "1px dashed #000", paddingTop: "6px", textAlign: "center" }}>
                    <span style={{ fontSize: "8px", color: "#444", display: "block" }}>Passenger Waiver Signature:</span>
                    <img src={cust.signature} alt="Sig" style={{ height: "22px", display: "block", margin: "4px auto 0 auto" }} />
                  </div>
                )}

                <div style={{ marginTop: "12px", textAlign: "center" }}>
                  <div style={{ background: "#fff", padding: "3px", display: "inline-block", border: "1px solid #000" }}>
                    <QRCodeSVG value={cust.id} size={55} />
                  </div>
                  <p style={{ fontSize: "8px", margin: "4px 0 0 0", fontWeight: "bold" }}>HAVE A SAFE TRIP / ຂໍໃຫ້ເດີນທາງປອດໄພ</p>
                </div>
              </div>
            ))}
          </div>
          )}

          {/* 3. A4 Landscape Manifest Print Container */}
          {printTemplate === "manifest" && (
            <div className="manifest-print" style={{ color: "#000" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #000", paddingBottom: "10px", marginBottom: "15px" }}>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>PASSENGER MANIFEST / ບັນຊີລາຍຊື່ຜູ້ໂດຍສານ</h2>
                <span style={{ fontSize: "11px" }}>TADFANE RAFTING AUTHORITY</span>
              </div>
              <div style={{ textAlign: "right", fontSize: "11px" }}>
                <div><strong>Trip ID:</strong> {currentTrip.id}</div>
                <div><strong>Date:</strong> {formatLocalDate(currentTrip.date)} | <strong>Time:</strong> {currentTrip.time}</div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "15px" }}>
              <div>
                <strong>Boat:</strong> {tripBoat ? tripBoat.name : `Boat ${currentTrip.boatId}`}<br />
                <strong>Captain:</strong> {tripCaptain ? tripCaptain.name : "Unassigned"}<br />
                <strong>Guides:</strong> {tripGuides.map(g => g.name).join(" & ") || "Unassigned"}<br />
                <strong>Driver:</strong> {tripDrivers.map(d => d.name).join(" & ") || "Unassigned"}
              </div>
              <div style={{ textAlign: "right" }}>
                <strong>Total Passengers:</strong> {paxCount} / 6
              </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ border: "1px solid #000", color: "#000", padding: "5px", background: "#f1f5f9" }}>No</th>
                  <th style={{ border: "1px solid #000", color: "#000", padding: "5px", background: "#f1f5f9" }}>Passenger Name</th>
                  <th style={{ border: "1px solid #000", color: "#000", padding: "5px", background: "#f1f5f9" }}>Passport / ID</th>
                  <th style={{ border: "1px solid #000", color: "#000", padding: "5px", background: "#f1f5f9" }}>Phone</th>
                  <th style={{ border: "1px solid #000", color: "#000", padding: "5px", background: "#f1f5f9" }}>Hotel</th>
                  <th style={{ border: "1px solid #000", color: "#000", padding: "5px", background: "#f1f5f9" }}>Emergency contact</th>
                  <th style={{ border: "1px solid #000", color: "#000", padding: "5px", background: "#f1f5f9" }}>Signature</th>
                </tr>
              </thead>
              <tbody>
                {tripCustomers.map((cust, index) => (
                  <tr key={cust.id}>
                    <td style={{ border: "1px solid #000", color: "#000", padding: "5px", textAlign: "center" }}>{index + 1}</td>
                    <td style={{ border: "1px solid #000", color: "#000", padding: "5px" }}>{cust.name}</td>
                    <td style={{ border: "1px solid #000", color: "#000", padding: "5px" }}>{cust.passport}</td>
                    <td style={{ border: "1px solid #000", color: "#000", padding: "5px" }}>{cust.phone}</td>
                    <td style={{ border: "1px solid #000", color: "#000", padding: "5px" }}>{cust.hotel || "-"}</td>
                    <td style={{ border: "1px solid #000", color: "#000", padding: "5px" }}>
                      {cust.emergencyName} ({cust.emergencyPhone || "-"})
                    </td>
                    <td style={{ border: "1px solid #000", color: "#000", padding: "2px 5px", textAlign: "center" }}>
                      {cust.signature ? (
                        <img src={cust.signature} alt="Sig" style={{ height: "20px", display: "block", margin: "0 auto" }} />
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
                {Array.from({ length: 6 - paxCount }).map((_, i) => (
                  <tr key={`empty-${i}`}>
                    <td style={{ border: "1px solid #000", color: "#666", padding: "5px", textAlign: "center" }}>{paxCount + i + 1}</td>
                    <td style={{ border: "1px solid #000", color: "#666", padding: "5px" }}>- Empty seat -</td>
                    <td style={{ border: "1px solid #000", color: "#666", padding: "5px" }}>-</td>
                    <td style={{ border: "1px solid #000", color: "#666", padding: "5px" }}>-</td>
                    <td style={{ border: "1px solid #000", color: "#666", padding: "5px" }}>-</td>
                    <td style={{ border: "1px solid #000", color: "#666", padding: "5px" }}>-</td>
                    <td style={{ border: "1px solid #000", color: "#666", padding: "5px" }}>-</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: "30px", display: "grid", gridTemplateColumns: currentTrip.agentSignature ? "1fr 1fr 1fr" : "1fr 1fr", gap: "15px", fontSize: "11px" }}>
              <div>
                Dispatched by: _______________________<br />
                Counter Officer
              </div>
              {currentTrip.agentSignature && (
                <div style={{ textAlign: "center" }}>
                  Agent Representative Signature:<br />
                  <img 
                    src={currentTrip.agentSignature} 
                    alt="Agent Signature" 
                    style={{ height: "35px", borderBottom: "1px solid #000", paddingBottom: "2px", display: "block", margin: "5px auto 0 auto" }} 
                  />
                  <span style={{ fontSize: "9px", color: "#333" }}>
                    {tripPartner ? tripPartner.name : "Agent Partner"}
                  </span>
                </div>
              )}
              <div style={{ textAlign: "right" }}>
                Captain Signature: _______________________<br />
                {tripCaptain ? tripCaptain.name : "Captain"}
            </div>
          </div>
        </div>
        )}

        </div>
      )}
    </div>
  );
}

// Preview styling variables
const receiptPreviewStyle = {
  background: "#fff",
  color: "#000",
  padding: "15px",
  borderRadius: "8px",
  boxShadow: "inset 0 0 10px rgba(0,0,0,0.1)",
  fontFamily: "monospace",
  lineHeight: "1.4",
  width: "100%",
  maxWidth: "280px",
  margin: "0 auto"
};

const individualTicketPreviewStyle = {
  background: "#ffffff",
  border: "1px dashed #cbd5e1",
  borderRadius: "8px",
  padding: "15px",
  fontFamily: "monospace",
  lineHeight: "1.4",
  width: "100%",
  maxWidth: "280px",
  margin: "0 auto",
  boxShadow: "var(--shadow-sm)"
};

const manifestPreviewStyle = {
  background: "#fff",
  color: "#000",
  padding: "20px",
  borderRadius: "8px",
  boxShadow: "inset 0 0 10px rgba(0,0,0,0.1)",
  overflowX: "auto"
};
