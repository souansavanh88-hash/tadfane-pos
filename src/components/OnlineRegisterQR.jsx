// OnlineRegisterQR.jsx - Customer Self-Service QR Generator & Live Group Status Board
import React, { useState, useEffect } from "react";
import { getDb, saveDb } from "../db/mockDb";
import { useLanguage } from "../utils/LanguageContext";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, ExternalLink, Copy, CheckCircle, Users, ArrowRight, Landmark, Printer, X, Check } from "lucide-react";
import { formatLAK } from "../utils/helpers";

export default function OnlineRegisterQR({ setActiveTab, setPreloadedBookingId }) {
  const { lang, t } = useLanguage();
  const [db, setDb] = useState(getDb());
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [paxCount, setPaxCount] = useState(1);
  const [copied, setCopied] = useState(false);
  const [customHostUrl, setCustomHostUrl] = useState(localStorage.getItem("pos_custom_host_url") || "");
  const [modalBooking, setModalBooking] = useState(null);
  const [printBooking, setPrintBooking] = useState(null);
  const [isPrintLoading, setIsPrintLoading] = useState(false);

  // Sync DB updates
  useEffect(() => {
    const handleDbUpdate = () => {
      setDb(getDb());
    };
    handleDbUpdate();
    window.addEventListener("db-update", handleDbUpdate);
    return () => window.removeEventListener("db-update", handleDbUpdate);
  }, []);

  const getSelfRegUrl = () => {
    const origin = customHostUrl.trim() || window.location.origin;
    const pathname = window.location.pathname;
    let url = `${origin}${pathname}?mode=self-register&paxCount=${paxCount}`;
    if (selectedPartnerId) {
      url += `&partnerId=${selectedPartnerId}`;
    }
    return url;
  };

  const getSelfRegUrlForBooking = (bk) => {
    const origin = customHostUrl.trim() || window.location.origin;
    const pathname = window.location.pathname;
    let url = `${origin}${pathname}?mode=self-register&groupId=${bk.groupId}&paxCount=${bk.paxCount}`;
    if (bk.partnerId) {
      url += `&partnerId=${bk.partnerId}`;
    }
    return url;
  };

  const handleCopyLink = () => {
    const url = getSelfRegUrl();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenTest = () => {
    const url = getSelfRegUrl();
    window.open(url, "_blank");
  };

  const triggerQrSignPrint = () => {
    setIsPrintLoading(true);
    const originalClass = document.body.className;
    document.body.classList.add("print-qr-sign-mode");
    setTimeout(() => {
      window.print();
      document.body.className = originalClass;
      setIsPrintLoading(false);
    }, 800);
  };

  const handlePrintBookingQrSign = (bk) => {
    setPrintBooking(bk);
    setIsPrintLoading(true);
    const originalClass = document.body.className;
    document.body.classList.add("print-qr-sign-mode");
    setTimeout(() => {
      window.print();
      document.body.className = originalClass;
      setPrintBooking(null);
      setIsPrintLoading(false);
    }, 800);
  };

  const handleSetReadyToPay = (bk) => {
    const currentDb = getDb();
    currentDb.bookings = currentDb.bookings.map(b => 
      b.id === bk.id ? { ...b, status: "พร้อมชำระเงิน" } : b
    );
    saveDb(currentDb);
    setDb(currentDb);
  };

  const handleOpenInPos = (bk) => {
    if (setPreloadedBookingId) {
      setPreloadedBookingId(bk.id);
    }
    if (setActiveTab) {
      setActiveTab("checkin-tickets");
    }
  };

  const selfRegUrl = getSelfRegUrl();
  const selectedPartner = db.partners.find(p => p.id === selectedPartnerId);

  // Filter bookings in the registration pipeline today
  const todayStr = new Date().toISOString().split("T")[0];
  const registrationPipeline = (db.bookings || []).filter(b => 
    b.status === "รอลูกค้ากรอกข้อมูล" ||
    b.status === "ยังไม่กรอกข้อมูล" ||
    b.status === "กำลังกรอกข้อมูล" ||
    b.status === "กรอกข้อมูลเรียบร้อย" ||
    b.status === "พร้อมชำระเงิน" ||
    b.status === "พร้อมชำระเงิน / พร้อมพิมพ์" ||
    b.date === todayStr
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case "รอลูกค้ากรอกข้อมูล":
      case "ยังไม่กรอกข้อมูล":
        return (
          <span style={{
            background: "rgba(100, 116, 139, 0.12)",
            color: "#64748b",
            border: "1px solid rgba(100, 116, 139, 0.25)",
            padding: "4px 8px",
            borderRadius: "20px",
            fontSize: "0.725rem",
            fontWeight: "bold"
          }}>
            {lang === "en" ? "⏳ Not Filled" : "⏳ ຍັງບໍ່ໄດ້ກອກຂໍ້ມູນ (Not Filled)"}
          </span>
        );
      case "กำลังกรอกข้อมูล":
        return (
          <span style={{
            background: "rgba(249, 115, 22, 0.12)",
            color: "#d97706",
            border: "1px solid rgba(249, 115, 22, 0.25)",
            padding: "4px 8px",
            borderRadius: "20px",
            fontSize: "0.725rem",
            fontWeight: "bold",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            animation: "pulse-badge 1.5s infinite"
          }}>
            <style>{`
              @keyframes pulse-badge {
                0% { opacity: 0.7; }
                50% { opacity: 1; }
                100% { opacity: 0.7; }
              }
            `}</style>
            {lang === "en" ? "📝 Filling..." : "📝 ກຳລັງກອກຂໍ້ມູນ (Filling...)"}
          </span>
        );
      case "กรอกข้อมูลเรียบร้อย":
        return (
          <span style={{
            background: "rgba(139, 92, 246, 0.12)",
            color: "#7c3aed",
            border: "1px solid rgba(139, 92, 246, 0.25)",
            padding: "4px 8px",
            borderRadius: "20px",
            fontSize: "0.725rem",
            fontWeight: "bold"
          }}>
            {lang === "en" ? "✍️ Filled" : "✍️ ກອກຂໍ້ມູນສຳເລັດ (Filled)"}
          </span>
        );
      case "พร้อมชำระเงิน":
      case "พร้อมชำระเงิน / พร้อมพิมพ์":
        return (
          <span style={{
            background: "rgba(16, 185, 129, 0.12)",
            color: "#10b981",
            border: "1px solid rgba(16, 185, 129, 0.25)",
            padding: "4px 8px",
            borderRadius: "20px",
            fontSize: "0.725rem",
            fontWeight: "bold"
          }}>
            {lang === "en" ? "💵 Ready to Pay" : "💵 ພ້ອມຊຳລະເງິນ (Ready to Pay)"}
          </span>
        );
      default:
        // Checked out / Paid statuses
        return (
          <span style={{
            background: "rgba(21, 128, 61, 0.12)",
            color: "#15803d",
            border: "1px solid rgba(21, 128, 61, 0.25)",
            padding: "4px 8px",
            borderRadius: "20px",
            fontSize: "0.725rem",
            fontWeight: "bold"
          }}>
            {lang === "en" ? "✅ Billed" : "✅ ອອກບິນແລ້ວ (Billed)"}
          </span>
        );
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>ຈັດການລົງທະບຽນລູກຄ້າ / Customer Registration Management</h1>
          <p>ສ້າງຄິວອາກວດຄົນເຂົ້າ ແລະ ຕິດຕາມສະຖານະການລົງທະບຽນດ້ວຍຕົນເອງຂອງລູກຄ້າ</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "2rem" }}>
        
        {/* Left Pane: QR Generator Control card */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px", margin: 0 }}>
            <QrCode size={20} color="var(--primary)" />
            ຕັ້ງຄ່າຄິວອາຮັບລູກຄ້າ / Setup Self-Register QR
          </h2>

          <div className="form-group">
            <label style={{ fontWeight: "700", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              ລະບຸບໍລິສັດທົວຜູ້ນຳພາ / Select Tour Partner (Optional)
            </label>
            <select 
              className="form-control"
              value={selectedPartnerId}
              onChange={(e) => setSelectedPartnerId(e.target.value)}
              style={{ marginTop: "4px" }}
            >
              <option value="">-- ລູກຄ້າທົ່ວໄປ (Walk-in / No Agent) --</option>
              {db.partners.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
              ))}
            </select>
          </div>

          {/* Group Size Selector */}
          <div className="form-group">
            <label style={{ fontWeight: "700", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              ຈຳນວນຄົນໃນກຸ່ມ / Group Size (Passengers)
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ padding: "4px 10px", minWidth: "36px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center" }}
                onClick={() => setPaxCount(prev => Math.max(1, prev - 1))}
              >
                -
              </button>
              <span style={{ fontSize: "1rem", fontWeight: "bold", width: "30px", textAlign: "center", color: "var(--text-primary)" }}>
                {paxCount}
              </span>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ padding: "4px 10px", minWidth: "36px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center" }}
                onClick={() => setPaxCount(prev => prev + 1)}
              >
                +
              </button>
            </div>
          </div>

          {/* Server Configuration Input */}
          <div style={{ background: "var(--bg-secondary)", padding: "12px", borderRadius: "10px", border: "1px solid var(--border-color)", marginTop: "0.25rem" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-primary)", display: "block", marginBottom: "6px" }}>
              ⚙️ ຕັ້ງຄ່າທີ່ຢູ່ Server (Config Server IP / Tunnel URL):
            </label>
            <input 
              type="text"
              className="form-control"
              value={customHostUrl}
              onChange={(e) => {
                const val = e.target.value;
                setCustomHostUrl(val);
                localStorage.setItem("pos_custom_host_url", val);
                window.dispatchEvent(new Event("db-update"));
              }}
              placeholder={lang === "en" ? "e.g. https://jskgq-183-182-116-23.free.pinggy.net or http://192.168.1.100:5173" : "ຕົວຢ່າງ: https://jskgq-183-182-116-23.free.pinggy.net ຫຼື http://192.168.1.100:5173"}
              style={{ fontSize: "0.8rem", padding: "6px 10px", height: "34px", width: "100%", boxSizing: "border-box" }}
            />
            <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
              {customHostUrl 
                ? "✓ ໃຊ້ທີ່ຢູ່ກຳນົດເອງໃນ QR ລະຫັດ" 
                : `ກຳລັງໃຊ້ທີ່ຢູ່ເລີ່ມຕົ້ນ: ${window.location.origin}`
              }
            </span>
            
            {/* Localhost Warning Banner */}
            {(window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && !customHostUrl && (
              <div style={{ marginTop: "8px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#ef4444", padding: "8px 10px", borderRadius: "6px", fontSize: "0.7rem", lineHeight: "1.3" }}>
                <strong>⚠️ ຄຳເຕືອນ (Warning):</strong> ເຈົ້າກຳລັງໃຊ້ 'localhost'. ໂທລະສັບຈະບໍ່ສາມາດສະແກນ QR ນີ້ໄດ້. ກະລຸນາກອກທີ່ຢູ່ IP ຫຼື ລິ້ງອຸໂມງ (Tunnel) ຂອງເຄື່ອງເຈົ້າຢູ່ຂ້າງເທິງນີ້!
              </div>
            )}
          </div>

          {/* Large dynamic QR Code Display */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "1.25rem", background: "var(--bg-tertiary)", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
            <div style={{ background: "#ffffff", padding: "10px", borderRadius: "8px", boxShadow: "var(--shadow-md)" }}>
              <QRCodeSVG value={selfRegUrl} size={160} includeMargin={true} />
            </div>
            
            <div style={{ textAlign: "center", marginTop: "1rem" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "var(--text-primary)" }}>
                {selectedPartnerId ? `${selectedPartner.name} QR Code` : "Walk-in Self-Register QR"}
              </span>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
                ໃຫ້ລູກຄ້າສະແກນ QR ນີ້ເພື່ອລົງທະບຽນ ແລະ ເຊັນຍິນຍອມ (Group of {paxCount})
              </p>
            </div>
          </div>

          {/* Action links */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn btn-secondary" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", fontSize: "0.75rem", padding: "8px" }} onClick={handleCopyLink}>
              <Copy size={14} /> {copied ? (lang === "en" ? "Copied!" : "ຄັດລອກແລ້ວ!") : (lang === "en" ? "Copy Link" : "ຄັດລອກລິງກ໌")}
            </button>

            <button className="btn btn-secondary" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", fontSize: "0.75rem", padding: "8px" }} onClick={triggerQrSignPrint}>
              <Printer size={14} /> ພິມໃບຕັ້ງໂຕະ
            </button>
            
            <button className="btn btn-primary" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", fontSize: "0.75rem", padding: "8px" }} onClick={handleOpenTest}>
              <ExternalLink size={14} /> ທົດລອງ Kiosk
            </button>
          </div>

        </div>

        {/* Right Pane: Live Registration Status Board */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem" }}>
            <h2 style={{ fontSize: "1.2rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px", margin: 0 }}>
              <Users size={20} color="var(--primary)" />
              ຕິດຕາມການລົງທະບຽນລູກຄ້າ / Registration Tracker Board ({registrationPipeline.length} groups)
            </h2>
            <span style={{ fontSize: "0.7rem", color: "var(--success)", background: "var(--success-light)", padding: "2px 8px", borderRadius: "20px", fontWeight: "bold" }}>
              ● Live Sync
            </span>
          </div>

          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>
            ລາຍຊື່ກຸ່ມລູກຄ້າທີ່ກຳລັງລົງທະບຽນ ຫຼື ພ້ອມຊຳລະເງິນ. ຂໍ້ມູນຈະອັບເດດອັດຕະໂນມັດເມື່ອລູກຄ້າກອກຂໍ້ມູນສຳເລັດ.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "550px", overflowY: "auto", marginTop: "0.5rem" }}>
            {registrationPipeline.length === 0 ? (
              <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-muted)", border: "2px dashed var(--border-color)", borderRadius: "8px" }}>
                <Users size={36} style={{ opacity: 0.3, marginBottom: "0.5rem" }} />
                <p style={{ fontSize: "0.85rem", margin: 0 }}>ຍັງບໍ່ມີກຸ່ມລູກຄ້າລົງທະບຽນໃນລະບົບວັນນີ້</p>
              </div>
            ) : (
              registrationPipeline.map((bk) => {
                const isPendingFill = bk.status === "รอลูกค้ากรอกข้อมูล" || bk.status === "ยังไม่กรอกข้อมูล" || bk.status === "กำลังกรอกข้อมูล";
                const isReadyToPay = bk.status === "พร้อมชำระเงิน" || bk.status === "พร้อมชำระเงิน / พร้อมพิมพ์" || bk.status === "รอชำระเงิน";
                const isFilled = bk.status === "กรอกข้อมูลเรียบร้อย";
                
                return (
                  <div 
                    key={bk.id} 
                    style={{
                      background: "var(--bg-primary)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "10px",
                      padding: "1rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--primary)" }}>{bk.groupId}</span>
                          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                            ({bk.paxCount} pax) - {bk.serviceName?.split(" ")[0]}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                          ເວລາສ້າງ: {new Date(bk.createdAt || "").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} | ຜ່ານທົວ: {bk.partnerName || "Walk-in"}
                        </div>
                      </div>
                      
                      <div>
                        {getStatusBadge(bk.status)}
                      </div>
                    </div>

                    {/* Passenger names display */}
                    {bk.passengers && bk.passengers.length > 0 && (
                      <div style={{ background: "var(--bg-secondary)", padding: "8px 12px", borderRadius: "8px", fontSize: "0.775rem", border: "1px solid var(--border-color)" }}>
                        <strong style={{ color: "var(--text-primary)" }}>ລາຍຊື່ລູກຄ້າ: </strong>
                        <span style={{ color: "var(--text-secondary)" }}>
                          {bk.passengers.map(p => `${p.name} (${p.nationality})`).join(", ")}
                        </span>
                      </div>
                    )}

                    {/* Actions Row */}
                    <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                      {/* Show QR Action */}
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: "6px 12px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "4px" }}
                        onClick={() => setModalBooking(bk)}
                        title="ສະແດງ QR ໃຫ້ລູກຄ້າສະແກນ / Show QR Modal"
                      >
                        <QrCode size={13} /> ສະແດງ QR
                      </button>

                      {/* Print QR Standee Action */}
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: "6px 12px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "4px" }}
                        onClick={() => handlePrintBookingQrSign(bk)}
                        title="ພິມໃບຕັ້ງໂຕະສຳລັບກຸ່ມນີ້ / Print tabletop standee"
                      >
                        <Printer size={13} /> ພິມປ້າຍ QR
                      </button>

                      {/* Mark as Ready Action */}
                      {isFilled && (
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: "6px 12px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "4px", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.2)" }}
                          onClick={() => handleSetReadyToPay(bk)}
                        >
                          ✓ ພ້ອມຊຳລະເງິນ
                        </button>
                      )}

                      {/* Open in POS Action */}
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: "6px 12px", fontSize: "0.75rem", marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px" }}
                        onClick={() => handleOpenInPos(bk)}
                      >
                        ⇌ ເປີດບິນ POS <ArrowRight size={13} />
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>

      {/* Show QR Modal Overlay */}
      {modalBooking && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(4px)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}>
          <div className="card" style={{
            width: "100%",
            maxWidth: "400px",
            maxHeight: "90vh",
            overflowY: "auto",
            background: "#ffffff",
            borderRadius: "16px",
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.5rem",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)",
            position: "relative"
          }}>
            <button 
              onClick={() => setModalBooking(null)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "none",
                border: "none",
                fontSize: "1.5rem",
                cursor: "pointer",
                color: "#64748b"
              }}
            >
              ✕
            </button>
            <div style={{ textAlign: "center" }}>
              <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "800", color: "#0f172a" }}>
                ສະແກນລົງທະບຽນ / Scan to Register
              </h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                ກຸ່ມ / Group: <strong>{modalBooking.groupId}</strong> ({modalBooking.paxCount} pax)
              </p>
            </div>
            
            <div style={{ background: "#ffffff", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
              <QRCodeSVG value={getSelfRegUrlForBooking(modalBooking)} size={220} includeMargin={true} />
            </div>

            <div style={{ textAlign: "center", width: "100%" }}>
              <span style={{ fontSize: "0.75rem", color: "#64748b", wordBreak: "break-all", background: "#f8fafc", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", display: "block" }}>
                {getSelfRegUrlForBooking(modalBooking)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- HIDDEN PRINTABLE SIGN STANDEE ---------------- */}
      <div className="printable-area">
        <div className="qr-sign-print">
          {db.settings.logo ? (
            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
              <img src={db.settings.logo} alt="Logo" style={{ maxHeight: "80px", maxWidth: "240px", objectFit: "contain" }} />
            </div>
          ) : (
            <h1>TADFANE RAFTING / ຕາດຟານ ລ່ອງແກ່ງ</h1>
          )}
          <h2>ລົງທະບຽນຜູ້ໂດຍສານ / Customer Registration</h2>
          
          <div className="qr-container">
            <QRCodeSVG value={printBooking ? getSelfRegUrlForBooking(printBooking) : selfRegUrl} size={280} includeMargin={true} />
          </div>

          <div className="steps-container">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-text">
                <strong>ສະແກນ QR Code / Scan QR Code</strong><br />
                ສະແດງ QR Code ດ້ວຍມືຖືຂອງທ່ານ ເພື່ອກອກຂໍ້ມູນລົງທະບຽນ<br />
                
                Scan the QR Code using your mobile phone camera.
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-text">
                <strong>ປ້ອນລາຍລະອຽດ & ລະຫັດກຸ່ມ / Enter Details & Group Code</strong><br />
                ກອກຂໍ້ມູນສະມາຊິກ ແລະ ປ້ອນ <strong>ລະຫັດກຸ່ມ (Group Code)</strong> ທີ່ສະແດງຢູ່ໜ້າຈໍເຄົາເຕີ<br />
                
                Fill in passenger details and enter the <strong>Group Code</strong> shown on the cashier's screen.
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-text">
                <strong>ແຈ້ງພະນັກງານ / Inform Cashier</strong><br />
                ແຈ້ງພະນັກງານຂາຍປີ້ ເພື່ອດຶງຂໍ້ມູນຂອງທ່ານເຂົ້າລະບົບອັດຕະໂນມັດ<br />
                
                Inform the ticketing staff to retrieve your check-in profile.
              </div>
            </div>
          </div>
          
          <div style={{ marginTop: "1.5rem", border: "2px dashed #cbd5e1", borderRadius: "8px", padding: "10px 15px", display: "inline-block", textAlign: "left", backgroundColor: "#f8fafc" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#64748b" }}>ລະຫັດກຸ່ມ / Group Code:</span>
            <div style={{ fontSize: "1.5rem", fontWeight: "800", marginTop: "5px", color: "#000000" }}>
              {printBooking ? printBooking.groupId : "_______________"}
            </div>
            <span style={{ fontSize: "0.7rem", color: "#94a3b8", display: "block", marginTop: "4px" }}>
              {printBooking ? "(ສະແກນເພື່ອລົງທະບຽນກຸ່ມນີ້ / Scan to register for this group)" : "(ພະນັກງານຂຽນລະຫັດໃສ່ນີ້ / Staff write code here)"}
            </span>
          </div>

          {(printBooking ? printBooking.partnerName : selectedPartnerId) && (
            <div style={{ marginTop: "1.5rem", fontSize: "0.85rem", color: "#64748b", fontWeight: "bold" }}>
              Tour Partner Agent: {printBooking ? printBooking.partnerName : selectedPartner.name}
            </div>
          )}
        </div>
      </div>
      {isPrintLoading && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.85)",
          zIndex: 999999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "15px",
          color: "#ffffff"
        }} className="no-print">
          <div style={{
            width: "50px",
            height: "50px",
            border: "5px solid rgba(255, 255, 255, 0.3)",
            borderTop: "5px solid #10b981",
            borderRadius: "50%",
            animation: "spin 1s linear infinite"
          }}></div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
            {lang === "en" ? "Generating Print Preview..." : "กำลังสร้างหน้ารวมคิวอาร์สำหรับพิมพ์..."}
          </div>
        </div>
      )}
    </div>
  );
}
