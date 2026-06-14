// CustomerRegistration.jsx - Streamlined Tour Group Registration & Dispatch Panel
import React, { useState, useRef, useEffect } from "react";
import { getDb, addCustomer, createTrip } from "../db/mockDb";
import { formatLAK } from "../utils/helpers";
import { useLanguage } from "../utils/LanguageContext";
import { Camera, RefreshCw, PenTool, CheckCircle, Search, ArrowLeft, ArrowRight, Check, Ship, Users, UserCheck } from "lucide-react";

export default function CustomerRegistration() {
  const { lang, t } = useLanguage();
  const [db, setDb] = useState(getDb());
  const [regMode, setRegMode] = useState("group"); // group, individual
  const [regSuccess, setRegSuccess] = useState(false);

  // --- GROUP REGISTRATION STATE ---
  const [groupPartnerId, setGroupPartnerId] = useState(""); // empty = Walk-in
  const [groupPaxCount, setGroupPaxCount] = useState(1);
  const [selectedBoatId, setSelectedBoatId] = useState("");
  const [selectedCaptainId, setSelectedCaptainId] = useState("");
  const [selectedGuide1, setSelectedGuide1] = useState("");
  const [selectedGuide2, setSelectedGuide2] = useState("");
  const [hasGroupSignature, setHasGroupSignature] = useState(false);
  const groupCanvasRef = useRef(null);
  const isGroupDrawing = useRef(false);

  // --- INDIVIDUAL REGISTRATION STATE (Existing Wizard) ---
  const [step, setStep] = useState(1); // 1: Scan, 2: Form, 3: Waiver & Sign
  const [fullName, setFullName] = useState("");
  const [passport, setPassport] = useState("");
  const [phone, setPhone] = useState("");
  const [hotel, setHotel] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [individualPartnerId, setIndividualPartnerId] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [passportPhotoData, setPassportPhotoData] = useState(null);
  const [qrInput, setQrInput] = useState("");
  const [showQrBox, setShowQrBox] = useState(false);
  const [hasIndivSignature, setHasIndivSignature] = useState(false);
  const indivCanvasRef = useRef(null);
  const isIndivDrawing = useRef(false);

  // Load database and listen to updates
  useEffect(() => {
    const handleDbUpdate = () => {
      setDb(getDb());
    };
    window.addEventListener("db-update", handleDbUpdate);
    return () => window.removeEventListener("db-update", handleDbUpdate);
  }, []);

  useEffect(() => {
    setDb(getDb());
    // Auto-select first available items for group registration convenience
    const data = getDb();
    const availableBoat = data.boats.find(b => b.status === "available");
    if (availableBoat && !selectedBoatId) {
      setSelectedBoatId(availableBoat.id.toString());
    }
    const captains = data.employees.filter(e => e.role === "captain" && e.status === "active");
    if (captains.length > 0 && !selectedCaptainId) {
      setSelectedCaptainId(captains[0].id);
    }
    const guides = data.employees.filter(e => e.role === "guide" && e.status === "active");
    if (guides.length >= 2) {
      if (!selectedGuide1) setSelectedGuide1(guides[0].id);
      if (!selectedGuide2) setSelectedGuide2(guides[1].id);
    }
  }, [regMode]);

  // Initialize Canvas for Signatures
  useEffect(() => {
    if (regMode === "group" && groupCanvasRef.current) {
      initCanvas(groupCanvasRef.current);
      setHasGroupSignature(false);
    } else if (regMode === "individual" && step === 3 && indivCanvasRef.current) {
      initCanvas(indivCanvasRef.current);
      setHasIndivSignature(false);
    }
  }, [regMode, step]);

  const initCanvas = (canvas) => {
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Drawing Event Handlers
  const startDrawing = (e, isGroup) => {
    if (isGroup) {
      isGroupDrawing.current = true;
      draw(e, groupCanvasRef.current, isGroupDrawing.current, () => setHasGroupSignature(true));
    } else {
      isIndivDrawing.current = true;
      draw(e, indivCanvasRef.current, isIndivDrawing.current, () => setHasIndivSignature(true));
    }
  };

  const stopDrawing = (isGroup) => {
    if (isGroup) {
      isGroupDrawing.current = false;
      if (groupCanvasRef.current) groupCanvasRef.current.getContext("2d").beginPath();
    } else {
      isIndivDrawing.current = false;
      if (indivCanvasRef.current) indivCanvasRef.current.getContext("2d").beginPath();
    }
  };

  const draw = (e, canvas, isDrawingFlag, setSignatureFlag) => {
    if (!isDrawingFlag || !canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    setSignatureFlag();
  };

  const clearCanvas = (canvas, setSignatureFlag) => {
    initCanvas(canvas);
    setSignatureFlag(false);
  };

  // --- SUBMIT GROUP TOUR DISPATCH ---
  const handleGroupSubmit = (e) => {
    e.preventDefault();

    if (!selectedBoatId) {
      alert({lang === "en" ? "Please select a boat!" : "ກະລຸນາເລືອກເຮືອນຳທ່ຽວ!"});
      return;
    }
    if (!selectedCaptainId) {
      alert({lang === "en" ? "Please select a captain!" : "ກະລຸນາເລືອກກັປຕັນເຮືອ!"});
      return;
    }
    if (!selectedGuide1 || !selectedGuide2) {
      alert({lang === "en" ? "Please select 2 guides!" : "ກະລຸນາເລືອກໄກ້ດນຳທ່ຽວໃຫ້ຄົບ 2 ຄົນ!"});
      return;
    }
    if (selectedGuide1 === selectedGuide2) {
      alert({lang === "en" ? "Guides must be different individuals!" : "ໄກ້ດນຳທ່ຽວ 2 ຄົນຕ້ອງບໍ່ຊ້ຳກັນ!"});
      return;
    }
    if (!hasGroupSignature) {
      alert({lang === "en" ? "Agent signature required!" : "ກະລຸນາເຊັນຊື່ຕົວແທນເພື່ອຢືນຢັນການປ່ອຍເຮືອ!"});
      return;
    }

    const canvas = groupCanvasRef.current;
    const agentSignature = canvas ? canvas.toDataURL("image/png") : "";

    // Auto-create mock passenger list for database registry
    const mockPassengers = [];
    const partner = db.partners.find(p => p.id === groupPartnerId);
    const partnerName = partner ? partner.name : ({lang === "en" ? "Walk-in (General)" : "Walk-in (ທົ່ວໄປ)"});

    for (let i = 1; i <= groupPaxCount; i++) {
      mockPassengers.push({
        id: `CUST-${Date.now()}-${i}`,
        name: `Guest ${i} (${partnerName.split(" ")[0]})`,
        passport: `GRP-${Date.now().toString().substring(8)}-${i}`,
        phone: partner?.contact || "",
        hotel: "Tour Group",
        emergencyName: "Agency tour guide",
        emergencyPhone: partner?.contact || ""
      });
    }

    // Call DB to dispatch trip
    createTrip({
      boatId: parseInt(selectedBoatId),
      captainId: selectedCaptainId,
      guideIds: [selectedGuide1, selectedGuide2],
      customers: mockPassengers,
      partnerId: groupPartnerId || null,
      agentSignature,
      date: new Date().toISOString().split("T")[0],
      time: "09:00"
    });

    setRegSuccess(true);
    alert({lang === "en" ? "Check-in & Dispatched successfully!" : "ລົງທະບຽນກຸ່ມທົວ ແລະ ປ່ອຍເຮືອເດີນທາງສຳເລັດ!"});
    
    // Reset Group Form
    setTimeout(() => {
      setRegSuccess(false);
      setGroupPartnerId("");
      setGroupPaxCount(1);
      clearCanvas(groupCanvasRef.current, setHasGroupSignature);
    }, 1500);
  };

  // --- SUBMIT INDIVIDUAL PASSENGER ---
  const handleIndivSubmit = (e) => {
    e.preventDefault();

    if (!fullName || !passport) {
      alert({lang === "en" ? "Please complete passenger info!" : "ກະລຸນາກອກຂໍ້ມູນສ່ວນຕົວໃນຂັ້ນຕອນທີ 2 ໃຫ້ຄົບຖ້ວນ!"});
      setStep(2);
      return;
    }
    if (!hasIndivSignature) {
      alert({lang === "en" ? "Signature required!" : "ກະລຸນາເຊັນຊື່ຍອມຮັບເງື່ອນໄຂຄວາມປອດໄພ!"});
      return;
    }

    const canvas = indivCanvasRef.current;
    const signatureImage = canvas ? canvas.toDataURL("image/png") : "";

    const newCustomer = {
      name: fullName,
      passport,
      phone,
      hotel,
      emergencyName,
      emergencyPhone,
      partnerId: individualPartnerId || null,
      bookingId: bookingId || null,
      passportPhoto: passportPhotoData,
      signature: signatureImage,
      waiverSigned: true
    };

    addCustomer(newCustomer);
    
    setRegSuccess(true);
    setTimeout(() => {
      setRegSuccess(false);
      // Reset Form fields
      setFullName("");
      setPassport("");
      setPhone("");
      setHotel("");
      setEmergencyName("");
      setEmergencyPhone("");
      setIndividualPartnerId("");
      setBookingId("");
      setPassportPhotoData(null);
      setStep(1);
    }, 2000);
  };

  // --- OCR / QR Mock loaders ---
  const triggerPassportMock = () => {
    const mockNames = ["David Miller", "Somsak Rakthai", "Anousone Keobounmy", "John Doe", "Atsushi Tanaka"];
    const mockPassports = ["P09432123", "P12838842", "ID90234123", "P33829103"];
    const randomName = mockNames[Math.floor(Math.random() * mockNames.length)];
    const randomPassport = mockPassports[Math.floor(Math.random() * mockPassports.length)];

    setFullName(randomName);
    setPassport(randomPassport);
    setPassportPhotoData(`data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%231e293b" rx="10"/><text x="20" y="40" fill="%2310b981" font-family="sans-serif" font-weight="bold" font-size="16">PASSPORT MOCK</text><text x="120" y="100" fill="%23f8fafc" font-family="sans-serif" font-size="12">NAME: ${randomName}</text><text x="120" y="125" fill="%2394a3b8" font-family="sans-serif" font-size="12">NO: ${randomPassport}</text></svg>`);
    
    setTimeout(() => setStep(2), 600);
  };

  const loadMockBooking = (bk) => {
    setBookingId(bk.id);
    setIndividualPartnerId(bk.partnerId || "");
    setStep(2);
  };

  // Constants lists from DB
  const boats = db.boats.filter(b => b.status === "available");
  const captains = db.employees.filter(e => e.role === "captain" && e.status === "active");
  const guides = db.employees.filter(e => e.role === "guide" && e.status === "active");

  return (
    <div>
      
      {/* HEADER TABS: Group check-in vs Individual check-in */}
      <div className="page-header no-print" style={{ marginBottom: "1.5rem" }}>
        <div className="page-title">
          <h1>📝 {t("customer_registration", "ລະບົບລົງທະບຽນລູກຄ້າ / Customer Check-In Desk")}</h1>
          <p>{lang === "en" ? "Register and dispatch tour groups quickly at the counter." : "ລົງທະບຽນຮັບຮອງລູກຄ້າອອກທົວເຮືອໜ້າຮ້ານຢ່າງວ່ອງໄວ"}</p>
        </div>

        {/* Sub Mode Selector */}
        <div className="tabs-container" style={{ margin: 0, border: "none" }}>
          <button 
            className={`tab-btn ${regMode === "group" ? "active" : ""}`} 
            onClick={() => setRegMode("group")}
            style={{ fontWeight: "700" }}
          >
            👥 {lang === "en" ? "Group Tour / Agent Registration" : "ລົງທະບຽນກຸ່ມທົວ / ເອເຈນ (Group Tour)"}
          </button>
          <button 
            className={`tab-btn ${regMode === "individual" ? "active" : ""}`} 
            onClick={() => setRegMode("individual")}
            style={{ fontWeight: "700" }}
          >
            👤 {lang === "en" ? "Individual Check-In" : "ລົງທະບຽນລູກຄ້າດ່ຽວ (Individual Check-In)"}
          </button>
        </div>
      </div>

      {regSuccess && (
        <div className="card" style={{ background: "var(--success-light)", borderColor: "var(--success)", padding: "1rem", color: "var(--success)", fontWeight: "600", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
          <CheckCircle size={24} /> {lang === "en" ? "Registration Completed Successfully! / Success!" : "ດຳເນີນການສຳເລັດຮຽບຮ້ອຍ! / Success!"}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 👥 MODE A: TOUR GROUP & AGENT REGISTRATION (Simplified Dashboard) */}
      {/* ========================================================================= */}
      {regMode === "group" && (
        <form onSubmit={handleGroupSubmit} style={groupGridStyle}>
          
          {/* Left panel: Pickers */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            
            {/* 1. Select Tour Agent */}
            <div className="card" style={{ padding: "1.25rem" }}>
              <label style={formSectionHeaderStyle}>1. {lang === "en" ? "Tour Company / Agent (Tour Agent)" : "ບໍລິສັດທົວ / ເອເຈນ (Tour Agent)"}</label>
              <div style={agentCardGridStyle}>
                <button
                  type="button"
                  onClick={() => setGroupPartnerId("")}
                  style={groupPartnerId === "" ? activeAgentBtnStyle : inactiveAgentBtnStyle}
                >
                  🚶‍♂️ {t("walkin_label", "ລູກຄ້າທົ່ວໄປ (Walk-in)")}
                </button>
                {db.partners.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setGroupPartnerId(p.id)}
                    style={groupPartnerId === p.id ? activeAgentBtnStyle : inactiveAgentBtnStyle}
                  >
                    💼 {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Select Guides for Boat */}
            <div className="card" style={{ padding: "1.25rem" }}>
              <label style={formSectionHeaderStyle}>2. {lang === "en" ? "Assign Captain & 2 Tour Guides (Staff)" : "ມອບໝາຍກັປຕັນ ແລະ ໄກ້ດນຳທ່ຽວ 2 ຄົນ (Staff)"}</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "0.75rem" }}>
                
                <div className="form-group">
                  <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{t("guide_number", "ໄກ້ດຄົນທີ") + " 1 (Guide 1)"}</label>
                  <select 
                    className="form-control" 
                    value={selectedGuide1}
                    onChange={(e) => setSelectedGuide1(e.target.value)}
                    required
                  >
                    <option value="">-- {lang === "en" ? "Select First Guide" : "ເລືອກໄກ້ດຄົນທຳອິດ"} --</option>
                    {guides.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{t("guide_number", "ໄກ້ດຄົນທີ") + " 2 (Guide 2)"}</label>
                  <select 
                    className="form-control" 
                    value={selectedGuide2}
                    onChange={(e) => setSelectedGuide2(e.target.value)}
                    required
                  >
                    <option value="">-- {lang === "en" ? "Select Second Guide" : "ເລືອກໄກ້ດຄົນທີສອງ"} --</option>
                    {guides.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                
                <div className="form-group">
                  <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{lang === "en" ? "Tour Boat / Yacht (Boat)" : "ເຮືອນຳທ່ຽວ / Yacht (Boat)"}</label>
                  <select
                    className="form-control"
                    value={selectedBoatId}
                    onChange={(e) => setSelectedBoatId(e.target.value)}
                    required
                  >
                    <option value="">-- {lang === "en" ? "Select Available Boat" : "ເລືອກເຮືອຫວ່າງ"} --</option>
                    {db.boats.map(b => (
                      <option key={b.id} value={b.id} disabled={b.status === "busy"}>
                        {b.name} {b.status === "busy" ? `[${lang === "en" ? "Busy" : "ບໍ່ຫວ່າງ"}]` : `[${lang === "en" ? "Ready" : "ຫວ່າງ"}]`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{lang === "en" ? "Captain" : "ກັປຕັນເຮືອ / Captain"}</label>
                  <select
                    className="form-control"
                    value={selectedCaptainId}
                    onChange={(e) => setSelectedCaptainId(e.target.value)}
                    required
                  >
                    <option value="">-- {lang === "en" ? "Select Captain" : "ເລືອກກັປຕັນ"} --</option>
                    {captains.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

              </div>
            </div>

            {/* 3. Passenger Count */}
            <div className="card" style={{ padding: "1.25rem" }}>
              <label style={formSectionHeaderStyle}>3. {lang === "en" ? "Number of Guests in this Trip" : "ຈຳນວນລູກຄ້າໃນທຣິບນີ້ / Guest count"}</label>
              <div style={paxButtonRowStyle}>
                {[1, 2, 3, 4, 5, 6].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setGroupPaxCount(num)}
                    style={groupPaxCount === num ? activePaxBtnStyle : inactivePaxBtnStyle}
                  >
                    {num} {t("pax_unit", "ຄົນ (Pax)")}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right panel: Sign & Dispatch */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            
            <div className="card" style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <label style={formSectionHeaderStyle}>✍️ {lang === "en" ? "Confirmation Signature" : "ລາຍເຊັນຢືນຢັນປ່ອຍເຮືອ / Confirmation Signature"}</label>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "4px 0 1rem 0" }}>
                  {lang === "en" ? "Guides or partners must sign to assume safety responsibility before dispatching." : "ໃຫ້ໄກ້ດຫຼືຕົວແທນພາດເນີລົງຊື່ເຊັນຍິນຍອມຄວາມຮັບຜິດຊອບກ່ອນປ່ອຍເຮືອເດີນທາງ"}
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                    onClick={() => clearCanvas(groupCanvasRef.current, setHasGroupSignature)}
                  >
                    {lang === "en" ? "Clear" : "ລ້າງໜ້າຈໍ / Clear"}
                  </button>
                </div>
                
                <div style={{ border: "2px dashed var(--border-color)", background: "#ffffff", borderRadius: "10px", overflow: "hidden" }}>
                  <canvas
                    ref={groupCanvasRef}
                    width={360}
                    height={180}
                    onMouseDown={(e) => startDrawing(e, true)}
                    onMouseUp={() => stopDrawing(true)}
                    onMouseLeave={() => stopDrawing(true)}
                    onMouseMove={(e) => draw(e, groupCanvasRef.current, isGroupDrawing.current, () => setHasGroupSignature(true))}
                    onTouchStart={(e) => startDrawing(e, true)}
                    onTouchEnd={() => stopDrawing(true)}
                    onTouchMove={(e) => draw(e, groupCanvasRef.current, isGroupDrawing.current, () => setHasGroupSignature(true))}
                    style={{ display: "block", cursor: "crosshair" }}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-success" 
                style={{ width: "100%", padding: "12px", fontWeight: "800", fontSize: "1rem", marginTop: "1.5rem" }}
              >
                <Ship size={18} /> {lang === "en" ? "Confirm Check-In & Dispatch" : "ຢືນຢັນບັນທຶກປ່ອຍເຮືอ / Check-In & Dispatch"}
              </button>

            </div>

          </div>

        </form>
      )}

      {/* ========================================================================= */}
      {/* 👤 MODE B: INDIVIDUAL REGISTRATION (Existing 3-step wizard) */}
      {/* ========================================================================= */}
      {regMode === "individual" && (
        <div>
          {/* Stepper Indicators */}
          <div className="wizard-stepper no-print">
            <button className={`wizard-step ${step === 1 ? "active" : step > 1 ? "completed" : ""}`} onClick={() => setStep(1)}>
              <div className="wizard-step-circle">{step > 1 ? <Check size={18} /> : "1"}</div>
              <span className="wizard-step-label">{lang === "en" ? "Scan Passport" : "ສະແກນພາດສະປອດ / Scan Passport"}</span>
            </button>
            <button className={`wizard-step ${step === 2 ? "active" : step > 2 ? "completed" : ""}`} onClick={() => fullName && passport && setStep(2)}>
              <div className="wizard-step-circle">{step > 2 ? <Check size={18} /> : "2"}</div>
              <span className="wizard-step-label">{lang === "en" ? "Passenger Info" : "ຂໍ້ມູນລູກທົວ / Passenger Info"}</span>
            </button>
            <button className={`wizard-step ${step === 3 ? "active" : ""}`} onClick={() => fullName && passport && setStep(3)}>
              <div className="wizard-step-circle">3</div>
              <span className="wizard-step-label">{lang === "en" ? "Safety Waiver Signature" : "ເຊັນຢືນຢັນຮັບປະກັນ / Signature"}</span>
            </button>
          </div>

          <div className="wizard-content">
            {step === 1 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "2rem" }}>
                <div className="card">
                  <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem", color: "var(--text-primary)" }}>{lang === "en" ? "Simulate Ticket Scan" : "ຈຳລອງສະແກນປີ້ (Simulate Scan)"}</h2>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>{lang === "en" ? "Retrieve booking info automatically" : "ดຶงข้อมูลการจองเพื่อความสะดวก"}</p>
                  
                  <button type="button" className="btn btn-secondary" style={{ width: "100%", marginBottom: "1rem" }} onClick={() => setShowQrBox(!showQrBox)}>
                    {showQrBox ? ({lang === "en" ? "Hide Camera" : "ຊ່ອນກ້ອງສະແກນ"}) : ({lang === "en" ? "Scan QR Code" : "ເປີດກ້ອງສະແກນ QR"})}
                  </button>

                  {showQrBox && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <input type="text" className="form-control" placeholder={lang === "en" ? "Paste booking code..." : "ວາງລະຫັດບຸກກິ້ງການຈອງ..."} value={qrInput} onChange={(e) => setQrInput(e.target.value)} />
                      <button className="btn btn-primary" onClick={handleIndivSubmit}>{lang === "en" ? "Load Ticket" : "ໂຫລດປີ້"}</button>
                    </div>
                  )}

                  <div style={{ marginTop: "1rem", borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                    <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "700" }}>{lang === "en" ? "Bookings pending registration:" : "ຄິວການຈອງທີ່ລໍຖ້າລົງທະບຽນ:"}</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
                      {db.bookings.map(bk => (
                        <button key={bk.id} type="button" className="btn btn-secondary" style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }} onClick={() => loadMockBooking(bk)}>
                          <span>🎫 {bk.id} ({bk.paxCount} Pax)</span>
                          <span style={{ color: "var(--primary)" }}>{lang === "en" ? "Load" : "ໂຫລດ / Load"}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "260px" }}>
                  <h2 style={{ fontSize: "1.1rem", color: "var(--text-primary)" }}>{lang === "en" ? "Scan Passport" : "ສະແກນພາດສະປອດ / Scan Passport"} (Passport Auto-OCR)</h2>
                  
                  {passportPhotoData ? (
                    <div>
                      <img src={passportPhotoData} alt="Passport" style={{ width: "100%", borderRadius: "8px", border: "1px solid var(--border-color)", marginBottom: "10px" }} />
                      <button type="button" className="btn btn-secondary" style={{ width: "100%" }} onClick={() => setPassportPhotoData(null)}>{lang === "en" ? "Scan Again" : "ສະແກນໃໝ່ / Scan Again"}</button>
                    </div>
                  ) : (
                    <div className="passport-camera-container" style={{ flex: 1 }}>
                      <Camera size={40} color="rgba(255,255,255,0.15)" />
                      <button type="button" className="btn btn-primary" style={{ position: "absolute", bottom: "10px" }} onClick={triggerPassportMock}>
                        {lang === "en" ? "Simulate OCR Scan" : "ຈຳລອງການຖ່າຍຮູບ / Simulate OCR"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="card" style={{ maxWidth: "680px", margin: "0 auto" }}>
                <h2 style={{ fontSize: "1.2rem", marginBottom: "1rem", color: "var(--text-primary)" }}>{lang === "en" ? "Enter Passenger Details" : "ກອກປະຫວັດສ່ວນຕົວລູກຄ້າ"}</h2>
                
                <div className="form-group">
                  <label>{lang === "en" ? "Full Passenger Name *" : "ຊື່ເຕັມຜູ້ໂດຍສານ *"}</label>
                  <input type="text" className="form-control" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>{lang === "en" ? "Passport Number / ID *" : "ເລກທີພາດສະປອດ / ID *"}</label>
                    <input type="text" className="form-control" value={passport} onChange={(e) => setPassport(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>{lang === "en" ? "Contact Phone *" : "ເບີໂທຕິດຕໍ່ *"}</label>
                    <input type="text" className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                  </div>
                </div>

                <div className="form-group">
                  <label>{lang === "en" ? "Hotel / Resort" : "ໂຮງແຮມທີ່ພັກ / Hotel"}</label>
                  <input type="text" className="form-control" value={hotel} onChange={(e) => setHotel(e.target.value)} />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>{lang === "en" ? "Emergency Contact Name" : "ຜູ້ຕິດຕໍ່ກໍລະນີສຸກເສີນ"}</label>
                    <input type="text" className="form-control" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>{lang === "en" ? "Emergency Phone Number" : "ເບີໂທຕິດຕໍ່ສຸກເສີນ"}</label>
                    <input type="text" className="form-control" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem" }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>{lang === "en" ? "Back" : "ຍ້อนກັບ / Back"}</button>
                  <button type="button" className="btn btn-primary" disabled={!fullName || !passport} onClick={() => setStep(3)}>{lang === "en" ? "Next" : "ຖັດໄປ / Next"}</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <form onSubmit={handleIndivSubmit} className="card" style={{ maxWidth: "600px", margin: "0 auto" }}>
                <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "var(--text-primary)" }}>{lang === "en" ? "Safety Waiver & Signature" : "ຂໍ້ຕົກລົງຄວາມປອດໄພ ແລະ ລາຍເຊັນ"}</h2>
                <div className="waiver-terms-box" style={{ fontSize: "0.8rem", maxHeight: "100px", overflowY: "auto", marginBottom: "1rem", background: "var(--bg-secondary)", padding: "10px", borderRadius: "8px" }}>
                  {lang === "en" ? "I hereby agree to follow all safety regulations of the rafting company and acknowledge that water activities involve inherent risks. I assume full responsibility for my own safety and property." : "ຂ້າພະເຈົ້າຍິນຍອມປະຕິບັດຕາມກົດລະບຽບຮັກສາຄວາມປອດໄພທຸກປະການ ແລະ ຍອມຮັບວ່າກິດຈະກຳທາງນ້ຳອາດມີຄວາມສ່ຽງ. ຂ້າພະເຈົ້າຍິນຍອມຮັບຄວາມສ່ຽງທີ່ອາດເກີດຂຶ້ນຕໍ່ຮ່າງກາຍ ແລະ ຊັບສິນດ້ວຍຕົນເອງ"}
                </div>

                <div className="form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <label style={{ fontWeight: "700" }}>{lang === "en" ? "Passenger Signature *" : "ລາຍເຊັນຜູ້ໂດຍສານ *"}</label>
                    <button type="button" className="btn btn-secondary" style={{ padding: "2px 8px", fontSize: "0.75rem" }} onClick={() => clearCanvas(indivCanvasRef.current, setHasIndivSignature)}>{lang === "en" ? "Clear Signature" : "ລ້າງໜ້າຈໍ / Clear"}</button>
                  </div>
                  <div style={{ border: "2px dashed var(--border-color)", background: "#ffffff", borderRadius: "8px", overflow: "hidden" }}>
                    <canvas 
                      ref={indivCanvasRef}
                      width={540}
                      height={160}
                      onMouseDown={(e) => startDrawing(e, false)}
                      onMouseUp={() => stopDrawing(false)}
                      onMouseLeave={() => stopDrawing(false)}
                      onMouseMove={(e) => draw(e, indivCanvasRef.current, isIndivDrawing.current, () => setHasIndivSignature(true))}
                      onTouchStart={(e) => startDrawing(e, false)}
                      onTouchEnd={() => stopDrawing(false)}
                      onTouchMove={(e) => draw(e, indivCanvasRef.current, isIndivDrawing.current, () => setHasIndivSignature(true))}
                      style={{ display: "block", cursor: "crosshair" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem" }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>{lang === "en" ? "Back" : "ຍ້ອນກັບ / Back"}</button>
                  <button type="submit" className="btn btn-success" disabled={!hasIndivSignature}>{lang === "en" ? "Complete Registration" : "ລົງທະບຽນສຳເລັດ / Register"}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

// Styling definitions for Group Quick Check-In Layout
const groupGridStyle = {
  display: "grid",
  gridTemplateColumns: "1.4fr 1fr",
  gap: "1.5rem",
  marginTop: "1rem"
};

const formSectionHeaderStyle = {
  fontSize: "0.85rem",
  fontWeight: "700",
  color: "#ffffff",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  display: "flex",
  alignItems: "center",
  gap: "6px"
};

const agentCardGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "0.5rem",
  marginTop: "0.75rem"
};

const activeAgentBtnStyle = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "2px solid var(--primary)",
  background: "rgba(16, 185, 129, 0.12)",
  color: "#ffffff",
  fontWeight: "700",
  fontSize: "0.85rem",
  cursor: "pointer",
  textAlign: "left"
};

const inactiveAgentBtnStyle = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid var(--border-color)",
  background: "var(--bg-secondary)",
  color: "var(--text-secondary)",
  fontWeight: "600",
  fontSize: "0.85rem",
  cursor: "pointer",
  textAlign: "left"
};

const paxButtonRowStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(6, 1fr)",
  gap: "0.5rem",
  marginTop: "0.75rem"
};

const activePaxBtnStyle = {
  padding: "10px 0",
  borderRadius: "8px",
  border: "none",
  background: "var(--primary)",
  color: "#ffffff",
  fontWeight: "700",
  fontSize: "0.85rem",
  cursor: "pointer"
};

const inactivePaxBtnStyle = {
  padding: "10px 0",
  borderRadius: "8px",
  border: "1px solid var(--border-color)",
  background: "var(--bg-secondary)",
  color: "var(--text-secondary)",
  fontWeight: "600",
  fontSize: "0.85rem",
  cursor: "pointer"
};
