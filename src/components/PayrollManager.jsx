// PayrollManager.jsx - Employee payroll ledger and employee settings
import React, { useState, useEffect } from "react";
import { flushSync } from "react-dom";
import { getDb, saveDb, clearAllEmployees } from "../db/mockDb";
import { formatLAK } from "../utils/helpers";
import { useLanguage } from "../utils/LanguageContext";
import { Plus, Award, CreditCard, Trash2, Printer, QrCode, X, Copy, ExternalLink, CheckCircle, Edit3 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function PayrollManager() {
  const { lang, t } = useLanguage();
  const [db, setDb] = useState(getDb());
  const [printTemplate, setPrintTemplate] = useState(null); // 'payroll', 'payslip', or null
  const [showQrModal, setShowQrModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const [empName, setEmpName] = useState("");
  const [empRole, setEmpRole] = useState("guide");
  const [empType, setEmpType] = useState("permanent");
  const [baseSalary, setBaseSalary] = useState(2500000);
  const [tripRate, setTripRate] = useState(50000);
  const [empPhone, setEmpPhone] = useState("");
  const [empHireDate, setEmpHireDate] = useState(new Date().toISOString().split("T")[0]);
  const [empStatus, setEmpStatus] = useState("active");
  const [empDailyWage, setEmpDailyWage] = useState(0);
  const [empCommission, setEmpCommission] = useState(0);
  const [empOT, setEmpOT] = useState(0);
  const [empDaysWorked, setEmpDaysWorked] = useState(26);
  const [tourRate, setTourRate] = useState(100000);
  const [raftingRate, setRaftingRate] = useState(150000);
  const [specialRate, setSpecialRate] = useState(50000);
  
  // New employee states
  const [empAddress, setEmpAddress] = useState("");
  const [empEmergencyContactName, setEmpEmergencyContactName] = useState("");
  const [empEmergencyContactPhone, setEmpEmergencyContactPhone] = useState("");
  const [empEmergencyRelationship, setEmpEmergencyRelationship] = useState("");
  const [empFacePhoto, setEmpFacePhoto] = useState("");
  const [empAllowance, setEmpAllowance] = useState(0);

  const [editingEmpId, setEditingEmpId] = useState("");
  const [empBankAccount, setEmpBankAccount] = useState("");
  const [selectedEmpDetails, setSelectedEmpDetails] = useState(null);
  const [editBonusEmpId, setEditBonusEmpId] = useState("");
  const [bonusValue, setBonusValue] = useState(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState("");
  const [showAddEditModal, setShowAddEditModal] = useState(false);

  useEffect(() => {
    const handleDbUpdate = () => setDb(getDb());
    handleDbUpdate();
    window.addEventListener("db-update", handleDbUpdate);
    return () => window.removeEventListener("db-update", handleDbUpdate);
  }, []);

  const refreshState = () => setDb(getDb());

  const resetEmployeeForm = () => {
    setEmpName("");
    setEmpRole("guide");
    setEmpType("permanent");
    setBaseSalary(2500000);
    setTripRate(50000);
    setEmpPhone("");
    setEmpBankAccount("");
    setEmpHireDate(new Date().toISOString().split("T")[0]);
    setEmpStatus("active");
    setEmpDailyWage(0);
    setEmpCommission(0);
    setEmpOT(0);
    setEmpDaysWorked(26);
    setTourRate(100000);
    setRaftingRate(150000);
    setSpecialRate(50000);
    setEmpAddress("");
    setEmpEmergencyContactName("");
    setEmpEmergencyContactPhone("");
    setEmpEmergencyRelationship("");
    setEmpFacePhoto("");
    setEmpAllowance(0);
    setEditingEmpId("");
  };

  const handleAdminPhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 200;
        const MAX_HEIGHT = 200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
        setEmpFacePhoto(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEmployee = (e) => {
    e.preventDefault();
    if (!empName) return;

    const updatedDb = { ...db };
    const finalSalary = parseInt(baseSalary) || 0;
    const finalTripRate = parseInt(tripRate) || 0;
    const finalDailyWage = parseInt(empDailyWage) || 0;
    const finalCommission = parseInt(empCommission) || 0;
    const finalOT = parseInt(empOT) || 0;
    const finalDaysWorked = parseInt(empDaysWorked) === 0 ? 0 : (parseInt(empDaysWorked) || 26);
    const finalTourRate = parseInt(tourRate) || 0;
    const finalRaftingRate = parseInt(raftingRate) || 0;
    const finalSpecialRate = parseInt(specialRate) || 0;
    const finalAllowance = parseInt(empAllowance) || 0;

    if (editingEmpId) {
      updatedDb.employees = updatedDb.employees.map(emp =>
        emp.id === editingEmpId
          ? {
              ...emp,
              name: empName,
              role: empRole,
              type: empType,
              salary: finalSalary,
              tripRate: finalTripRate,
              phone: empPhone,
              bankAccount: empBankAccount,
              hireDate: empHireDate,
              status: empStatus,
              dailyWage: finalDailyWage,
              commission: finalCommission,
              ot: finalOT,
              daysWorked: finalDaysWorked,
              tourRate: finalTourRate,
              raftingRate: finalRaftingRate,
              specialRate: finalSpecialRate,
              allowance: finalAllowance,
              address: empAddress.trim(),
              emergencyContactName: empEmergencyContactName.trim(),
              emergencyContactPhone: empEmergencyContactPhone.trim(),
              emergencyRelationship: empEmergencyRelationship.trim(),
              facePhoto: empFacePhoto
            }
          : emp
      );
      alert("ອັບເດດຂໍ້ມູນພະນັກງານສຳເລັດ! / Employee updated!");
    } else {
      const maxIdNum = db.employees.reduce((max, emp) => {
        const match = emp.id.match(/EMP-(\d+)/);
        if (match) {
          const num = parseInt(match[1]);
          return num > max ? num : max;
        }
        return max;
      }, 0);

      const newEmp = {
        id: `EMP-${String(maxIdNum + 1).padStart(3, "0")}`,
        name: empName,
        role: empRole,
        type: empType,
        status: empStatus,
        salary: finalSalary,
        tripRate: finalTripRate,
        phone: empPhone,
        bankAccount: empBankAccount,
        hireDate: empHireDate,
        dailyWage: finalDailyWage,
        commission: finalCommission,
        ot: finalOT,
        daysWorked: finalDaysWorked,
        tourRate: finalTourRate,
        raftingRate: finalRaftingRate,
        specialRate: finalSpecialRate,
        allowance: finalAllowance,
        address: empAddress.trim(),
        emergencyContactName: empEmergencyContactName.trim(),
        emergencyContactPhone: empEmergencyContactPhone.trim(),
        emergencyRelationship: empEmergencyRelationship.trim(),
        facePhoto: empFacePhoto,
        bonus: 0
      };

      updatedDb.employees.push(newEmp);
      alert("ເພີ່ມຂໍ້ມູນພະນັກງານສຳເລັດ! / Employee registered!");
    }

    saveDb(updatedDb);
    resetEmployeeForm();
    setShowAddEditModal(false);
    refreshState();
  };

  const handleDeleteEmployee = (id) => {
    if (window.confirm("ທ່ານຕ້ອງການລົບຂໍ້ມູນພະນັກງານຄົນນີ້ແທ້ບໍ? / Delete employee?")) {
      const updatedDb = { ...db };
      updatedDb.employees = updatedDb.employees.filter(e => e.id !== id);
      saveDb(updatedDb);
      refreshState();
    }
  };

  const handleUpdateBonus = (e) => {
    e.preventDefault();
    if (!editBonusEmpId) return;

    const updatedDb = { ...db };
    const emp = updatedDb.employees.find(e => e.id === editBonusEmpId);
    if (emp) {
      emp.bonus = parseInt(bonusValue) || 0;
      saveDb(updatedDb);
      alert(lang === "en" ? "Bonus updated successfully!" : "ອັບເດດໂບນັດພະນັກງານສຳເລັດ!");
      setEditBonusEmpId("");
      setBonusValue(0);
      refreshState();
    }
  };

  const calculatePayout = (emp) => {
    let tripCount = 0;
    const tripsDetail = [];

    db.trips.forEach(trip => {
      if (trip.status === "completed" || trip.status === "dispatched") {
        const isGuide = trip.guideIds && trip.guideIds.includes(emp.id);
        const isCaptain = (trip.captainIds && trip.captainIds.includes(emp.id)) || (trip.captainId === emp.id);
        const isDriver = trip.driverIds && trip.driverIds.includes(emp.id);

        if (isGuide || isCaptain || isDriver) {
          tripCount++;

          let roleInTrip = "";
          if (isGuide) roleInTrip = "ໄກ້ດ (Guide)";
          else if (isCaptain) roleInTrip = "ກັປຕັນ (Captain)";
          else if (isDriver) roleInTrip = "ຄົນຂັບລົດ (Driver)";

          const boatNames = [];
          const tripBoatIds = trip.boatIds || (trip.boatId ? [trip.boatId] : []);
          tripBoatIds.forEach(bid => {
            const b = db.boats.find(boat => boat.id === bid);
            if (b) boatNames.push(b.name);
          });

          let payout = emp.tripRate || 50000;
          if (emp.role === "guide") {
            let baseRate = (emp.tourRate !== undefined && emp.tourRate > 0) ? emp.tourRate : 100000;
            if (trip.bookingId) {
              const bk = db.bookings.find(b => b.id === trip.bookingId);
              if (bk && (bk.serviceId === "SRV-001" || bk.serviceId === "SRV-002" || bk.serviceId === "SRV-005")) {
                baseRate = (emp.raftingRate !== undefined && emp.raftingRate > 0) ? emp.raftingRate : 150000;
              }
            }
            payout = baseRate + (emp.specialRate || 0);
          } else if (emp.role === "driver") {
            payout = (emp.tripRate !== undefined && emp.tripRate > 0) ? emp.tripRate : 100000;
          }

          tripsDetail.push({
            id: trip.id,
            date: trip.date,
            time: trip.time,
            boatName: boatNames.join(", ") || "N/A",
            role: roleInTrip,
            payout
          });
        }
      }
    });

     const isFreelance = emp.type === "freelance";
    const tripPay = tripsDetail.reduce((sum, td) => sum + td.payout, 0);
    const salaryAmt = isFreelance ? 0 : emp.salary;
    const dailyWagePay = (emp.dailyWage || 0) * (emp.daysWorked !== undefined ? emp.daysWorked : 26);
    const allowanceAmt = isFreelance ? 0 : (emp.allowance || 0);
    const totalPayout = salaryAmt + dailyWagePay + allowanceAmt + tripPay + (emp.bonus || 0) + (emp.commission || 0) + (emp.ot || 0);

    return { tripCount, tripPay, totalPayout, tripsDetail };
  };

  const handleTriggerPayout = (emp) => {
    const calc = calculatePayout(emp);
    const message = lang === "en"
      ? `Confirm payout of ${formatLAK(calc.totalPayout)} LAK to ${emp.name}?`
      : `ຢືນຢັນການຈ່າຍເງິນໃຫ້ ${emp.name} ຈຳນວນເງິນລວມ ${formatLAK(calc.totalPayout)} ແມ່ນບໍ?`;

    if (window.confirm(message)) {
      const updatedDb = { ...db };
      const dbEmp = updatedDb.employees.find(e => e.id === emp.id);
      if (dbEmp) {
        dbEmp.bonus = 0;
        saveDb(updatedDb);
      }
      alert(lang === "en" ? "Payout completed! Payslip printed." : "ຈ່າຍເງິນສຳເລັດ! ພິມໃບບິນເງິນເດືອນສຳເລັດ");
      refreshState();
    }
  };

  const triggerPrintPayslip = () => {
    flushSync(() => {
      setPrintTemplate("payslip");
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
    }, 60000); // 60s safety timeout to prevent early clearing on slow browsers
  };

  const triggerPrintPayroll = () => {
    flushSync(() => {
      setPrintTemplate("payroll");
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
    }, 60000); // 60s safety timeout to prevent early clearing on slow browsers
  };

  const handlePrintIndividual = (emp) => {
    setSelectedEmpDetails(emp);
    setTimeout(() => {
      triggerPrintPayslip();
    }, 150);
  };

  let grandBaseSalary = 0;
  let grandTripCount = 0;
  let grandTripPay = 0;
  let grandBonus = 0;
  let grandTotal = 0;
  let grandDailyWagePay = 0;
  let grandOTPay = 0;
  let grandCommission = 0;
  let grandAllowance = 0;

  db.employees.forEach(emp => {
    const calc = calculatePayout(emp);
    grandBaseSalary += emp.type === "freelance" ? 0 : emp.salary;
    grandTripCount += calc.tripCount;
    grandTripPay += calc.tripPay;
    grandBonus += emp.bonus || 0;
    grandTotal += calc.totalPayout;
    grandAllowance += emp.type === "freelance" ? 0 : (emp.allowance || 0);
    
    // Add additional grand totals computation
    grandDailyWagePay += (emp.dailyWage || 0) * (emp.daysWorked !== undefined ? emp.daysWorked : 26);
    grandOTPay += emp.ot || 0;
    grandCommission += emp.commission || 0;
  });

  return (
    <div>
      <div className="no-print">
        {/* Premium Page Header styled exactly like the screenshot */}
        <div className="page-header no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "12px" }}>
          <div className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.8rem" }}>👥</span>
            <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--text-primary)", margin: 0 }}>
              {t("payroll_manager_title", "ພະນັກງານ / Employees")}
            </h1>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className="btn"
              style={{ fontSize: "0.85rem", background: "white", color: "#1e293b", border: "1px solid #cbd5e1", display: "flex", alignItems: "center", gap: "6px", fontWeight: "600", padding: "8px 14px", borderRadius: "6px" }}
              onClick={() => setShowQrModal(true)}
            >
              📱 {t("create_employee_qr", "ສ້າງ QR Code ຮັບພະນັກງານ")}
            </button>
            <button 
              className="btn"
              style={{ fontSize: "0.85rem", background: "white", color: "#1e293b", border: "1px solid #cbd5e1", display: "flex", alignItems: "center", gap: "6px", fontWeight: "600", padding: "8px 14px", borderRadius: "6px" }}
              onClick={triggerPrintPayroll}
            >
              🖨️ {t("print_all_reports", "ພິມລາຍງານທັງໝົດ")}
            </button>
            <button 
              className="btn btn-primary" 
              style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px", background: "var(--primary)", border: "none", fontWeight: "600", padding: "8px 14px", borderRadius: "6px", color: "white" }}
              onClick={() => {
                resetEmployeeForm();
                setShowAddEditModal(true);
              }}
            >
              + {t("add_employee_btn", "ເພີ່ມພະນັກງານ")}
            </button>
          </div>
        </div>

        {/* Aggregate Summary Info Cards (Collapsible or compact grid) */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
          marginBottom: "20px"
        }}>
          <div className="card" style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "4px", border: "1px solid var(--border-color)", background: "var(--bg-secondary)" }}>
            <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontWeight: "600" }}>ເງິນເດືອນພື້ນຖານລວມ</span>
            <span style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--text-primary)" }}>{formatLAK(grandBaseSalary)}</span>
          </div>
          {grandAllowance > 0 && (
            <div className="card" style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "4px", border: "1px solid var(--border-color)", background: "var(--bg-secondary)" }}>
              <span style={{ fontSize: "0.72rem", color: "#0f766e", fontWeight: "600" }}>ເງິນປະຈຳຕຳແໜ່ງລວມ</span>
              <span style={{ fontSize: "1.1rem", fontWeight: "800", color: "#0f766e" }}>{formatLAK(grandAllowance)}</span>
            </div>
          )}
          <div className="card" style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "4px", border: "1px solid var(--border-color)", background: "var(--bg-secondary)" }}>
            <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontWeight: "600" }}>ຈຳນວນທ່ຽວ / ເງິນທ່ຽວລວມ</span>
            <span style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--text-primary)" }}>{grandTripCount} ທ່ຽວ ({formatLAK(grandTripPay)})</span>
          </div>
          <div className="card" style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "4px", border: "1px solid var(--border-color)", background: "var(--bg-secondary)" }}>
            <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontWeight: "600" }}>ໂບນັດ / ລາຍຈ່າຍລວມທັງໝົດ</span>
            <span style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--primary)" }}>{formatLAK(grandTotal)}</span>
          </div>
        </div>

        {/* Screen View: Grid of Employee Profile Cards matching the screenshot */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "20px",
          marginBottom: "30px"
        }}>
          {db.employees.map(emp => {
            const calc = calculatePayout(emp);
            
            let roleColor = "#0f766e";
            let roleBg = "rgba(15, 118, 110, 0.1)";
            let roleLabel = emp.role || "staff";
            
            if (emp.role === "guide") {
              roleColor = "#0284c7";
              roleBg = "rgba(2, 132, 199, 0.1)";
            } else if (emp.role === "captain") {
              roleColor = "#7c3aed";
              roleBg = "rgba(124, 58, 237, 0.1)";
            } else if (emp.role === "driver") {
              roleColor = "#ea580c";
              roleBg = "rgba(234, 88, 12, 0.1)";
            } else if (emp.role === "cashier") {
              roleColor = "#059669";
              roleBg = "rgba(5, 150, 105, 0.1)";
            } else if (emp.role === "waiter") {
              roleColor = "#db2777";
              roleBg = "rgba(219, 39, 119, 0.1)";
            } else if (emp.role === "office") {
              roleColor = "#2563eb";
              roleBg = "rgba(37, 99, 235, 0.1)";
            }

            const initials = (emp.name || "U").charAt(0);

            return (
              <div className="card" key={emp.id} style={{
                display: "flex",
                flexDirection: "column",
                padding: "20px",
                borderRadius: "16px",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)",
                background: "white",
                border: "1px solid var(--border-color)",
                position: "relative",
                gap: "14px"
              }}>
                {/* Avatar & Name & Role Badge & Actions */}
                <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                  {/* Photo container */}
                  <div style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    background: "#0f766e",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.3rem",
                    fontWeight: "800",
                    color: "#ffffff",
                    border: "2px solid #f1f5f9",
                    flexShrink: 0
                  }}>
                    {emp.facePhoto ? (
                      <img src={emp.facePhoto} alt={emp.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      initials
                    )}
                  </div>

                  {/* Name & Role Badge */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      fontSize: "1.1rem",
                      fontWeight: "750",
                      color: "var(--text-primary)",
                      margin: 0,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      lineHeight: "1.2"
                    }}>
                      {emp.name}
                    </h3>
                    <span style={{
                      display: "inline-block",
                      fontSize: "0.72rem",
                      fontWeight: "700",
                      color: roleColor,
                      background: roleBg,
                      padding: "2px 8px",
                      borderRadius: "6px",
                      marginTop: "5px",
                      letterSpacing: "0.5px"
                    }}>
                      {roleLabel}
                    </span>
                  </div>

                  {/* Actions Header Group */}
                  <div style={{ display: "flex", gap: "4px", alignSelf: "flex-start" }}>
                    {/* Print Payslip */}
                    <button 
                      className="btn" 
                      style={{
                        padding: "6px",
                        background: "transparent",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        color: "#64748b",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: "auto"
                      }}
                      onClick={() => handlePrintIndividual(emp)}
                      title="Print Payslip"
                    >
                      <Printer size={14} />
                    </button>

                    {/* Edit Employee */}
                    <button 
                      className="btn" 
                      style={{
                        padding: "6px",
                        background: "transparent",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        color: "#64748b",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: "auto"
                      }}
                      onClick={() => {
                        setEditingEmpId(emp.id);
                        setEmpName(emp.name);
                        setEmpRole(emp.role);
                        setEmpType(emp.type || "permanent");
                        setBaseSalary(emp.salary || 0);
                        setTripRate(emp.tripRate || 0);
                        setEmpPhone(emp.phone || "");
                        setEmpBankAccount(emp.bankAccount || "");
                        setEmpHireDate(emp.hireDate || "2025-01-01");
                        setEmpStatus(emp.status || "active");
                        setEmpDailyWage(emp.dailyWage || 0);
                        setEmpCommission(emp.commission || 0);
                        setEmpOT(emp.ot || 0);
                        setEmpDaysWorked(emp.daysWorked !== undefined ? emp.daysWorked : 26);
                        setTourRate(emp.tourRate || 100000);
                        setRaftingRate(emp.raftingRate || 150000);
                        setSpecialRate(emp.specialRate || 50000);
                        setEmpAddress(emp.address || "");
                        setEmpEmergencyContactName(emp.emergencyContactName || "");
                        setEmpEmergencyContactPhone(emp.emergencyContactPhone || "");
                        setEmpEmergencyRelationship(emp.emergencyRelationship || "");
                        setEmpFacePhoto(emp.facePhoto || "");
                        setEmpAllowance(emp.allowance || 0);
                        setShowAddEditModal(true);
                      }}
                      title="Edit Profile"
                    >
                      <Edit3 size={14} />
                    </button>

                    {/* Delete Employee */}
                    {deleteConfirmId === emp.id ? (
                      <button
                        className="btn btn-danger"
                        style={{ padding: "4px 8px", fontSize: "0.68rem", fontWeight: "bold", background: "#ef4444", border: "none", minWidth: "auto" }}
                        onClick={() => {
                          const updatedDb = { ...db };
                          updatedDb.employees = updatedDb.employees.filter(e => e.id !== emp.id);
                          saveDb(updatedDb);
                          refreshState();
                          setDeleteConfirmId("");
                        }}
                      >
                        Confirm
                      </button>
                    ) : (
                      <button 
                        className="btn" 
                        style={{
                          padding: "6px",
                          background: "transparent",
                          border: "1px solid #fee2e2",
                          borderRadius: "6px",
                          color: "#ef4444",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minWidth: "auto"
                        }}
                        onClick={() => {
                          setDeleteConfirmId(emp.id);
                          setTimeout(() => setDeleteConfirmId(""), 4000);
                        }}
                        title="Delete Profile"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Salary breakdown details */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem", color: "var(--text-secondary)" }}>
                    <span>ເງິນເດືອນ (Gross):</span>
                    <span style={{ fontWeight: "600", color: "#1e293b" }}>{emp.type === "freelance" ? "0 ₭" : formatLAK(emp.salary)}</span>
                  </div>
                  {emp.allowance > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem", color: "#0284c7" }}>
                      <span>ເງິນປະຈຳຕຳແໜ່ງ:</span>
                      <span style={{ fontWeight: "700" }}>+ {formatLAK(emp.allowance)}</span>
                    </div>
                  )}
                  
                  {/* Net payout row */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.92rem",
                    color: "#0f766e",
                    background: "rgba(16, 185, 129, 0.08)",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    fontWeight: "800"
                  }}>
                    <span>ເງິນເດືອນຮັບຈິງ (Net):</span>
                    <span>{formatLAK(calc.totalPayout)}</span>
                  </div>
                </div>

                {/* Contact info list with icons */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.82rem", color: "#475569", margin: "4px 0" }}>
                  {emp.phone && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>📞</span>
                      <span>{emp.phone}</span>
                    </div>
                  )}
                  {emp.bankAccount && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>🏦</span>
                      <span style={{ fontWeight: "600", color: "#0f766e" }}>{emp.bankAccount}</span>
                    </div>
                  )}
                  {emp.address && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>🏠</span>
                      <span>{emp.address}</span>
                    </div>
                  )}
                </div>

                {/* Emergency Contact block */}
                {(emp.emergencyContactName || emp.emergencyContactPhone) && (
                  <div style={{
                    background: "rgba(239, 68, 68, 0.04)",
                    border: "1px dashed rgba(239, 68, 68, 0.15)",
                    borderRadius: "10px",
                    padding: "10px 12px",
                    fontSize: "0.8rem",
                    color: "#b91c1c",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    marginTop: "auto"
                  }}>
                    <div style={{ fontWeight: "750", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>🚨</span> ຕິດຕໍ່ສຸກເສີນ
                    </div>
                    <div style={{ fontWeight: "600", paddingLeft: "2px" }}>
                      {emp.emergencyContactName} {emp.emergencyRelationship ? `(${emp.emergencyRelationship})` : ""}
                    </div>
                    {emp.emergencyContactPhone && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", opacity: 0.95, paddingLeft: "2px" }}>
                        <span>📞</span> {emp.emergencyContactPhone}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Bonus Modal */}
      {editBonusEmpId && (
        <div className="modal-overlay no-print" style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0, 0, 0, 0.4)", backdropFilter: "blur(4px)",
          display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1010
        }}>
          <div className="card" style={{ maxWidth: "420px", width: "100%", padding: "24px" }}>
            <h3 style={{ fontSize: "1.1rem", color: "var(--warning)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "5px" }}>
              <Award size={18} />
              {t("add_bonus_title", "ປ້ອນໂບນັດພິເສດ / Add Bonus")}
            </h3>
            <form onSubmit={handleUpdateBonus}>
              <div className="form-group">
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                  {t("employee_colon", "ພະນັກງານ:")} {db.employees.find(e => e.id === editBonusEmpId)?.name}
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={bonusValue}
                  onChange={(e) => setBonusValue(e.target.value)}
                  min="0"
                  required
                />
              </div>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.25rem" }}>
                <button type="submit" className="btn btn-warning" style={{ flex: 1 }}>บันทึก / Save</button>
                <button type="button" className="btn btn-secondary" onClick={() => setEditBonusEmpId("")}>
                  {t("cancel_btn", "ຍົກເລີກ / Cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Employee Form Modal Backdrop */}
      {showAddEditModal && (
        <div className="modal-overlay no-print" style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(4px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
          padding: "20px",
          boxSizing: "border-box"
        }}>
          <div className="card" style={{
            maxWidth: "600px",
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "28px 24px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            position: "relative"
          }}>
            <button 
              type="button" 
              onClick={() => {
                setShowAddEditModal(false);
                resetEmployeeForm();
              }}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "transparent",
                border: "none",
                fontSize: "1.35rem",
                cursor: "pointer",
                color: "var(--text-secondary)",
                padding: "4px"
              }}
            >
              ✕
            </button>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "1.5rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Plus size={20} color="var(--primary)" />
              {editingEmpId ? "ແກ້ໄຂຂໍ້ມູນພະນັກງານ / Edit Employee" : "ເພີ່ມພະນັກງານໃໝ່ / Add Employee"}
            </h2>

            <form onSubmit={handleSaveEmployee}>
              {/* Photo Selector */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "20px" }}>
                <div 
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    border: "2px dashed var(--border-color)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    overflow: "hidden",
                    position: "relative",
                    background: "var(--bg-tertiary)"
                  }}
                  onClick={() => document.getElementById("admin-photo-upload").click()}
                >
                  {empFacePhoto ? (
                    <img src={empFacePhoto} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ textAlign: "center", padding: "4px", color: "var(--text-secondary)" }}>
                      <span style={{ fontSize: "1.3rem" }}>📷</span>
                      <div style={{ fontSize: "0.6rem", marginTop: "2px", fontWeight: "600" }}>ຮູບພະນັກງານ</div>
                    </div>
                  )}
                </div>
                <input 
                  id="admin-photo-upload"
                  type="file" 
                  accept="image/*" 
                  onChange={handleAdminPhotoChange}
                  style={{ display: "none" }}
                />
              </div>

              <div className="form-group">
                <label>{t("employee_name_label", "ຊື່ ແລະ ນາມສະກຸນ / Employee Name")} *</label>
                <input type="text" className="form-control" value={empName} onChange={(e) => setEmpName(e.target.value)} placeholder="ຕົວຢ່າງ: ສົມດີ ມີໄຊ" required />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>ເບີໂທ / Phone</label>
                  <input type="text" className="form-control" value={empPhone} onChange={(e) => setEmpPhone(e.target.value)} placeholder="e.g. +856 20 555-9000" />
                </div>
                <div className="form-group">
                  <label>ວັນທີເລີ່ມວຽກ / Hire Date</label>
                  <input type="date" className="form-control" value={empHireDate} onChange={(e) => setEmpHireDate(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label>{t("bank_account_label", "ເລກບັນຊີ / Bank Account")}</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={empBankAccount} 
                  onChange={(e) => setEmpBankAccount(e.target.value)} 
                  placeholder={t("bank_account_placeholder", "ທະນາຄານ ແລະ ເລກບັນຊີ (e.g. BCEL: 160-12-00-123456-001)")} 
                />
              </div>

              <div className="form-group">
                <label>ທີ່ຢູ່ປະຈຸບັນ / Current Address</label>
                <input type="text" className="form-control" value={empAddress} onChange={(e) => setEmpAddress(e.target.value)} placeholder="ບ້ານ, ເມືອງ, ແຂວງ" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t("role_label", "ບົດບາດໜ້າທີ່ / Role")}</label>
                  <select
                    className="form-control"
                    value={empRole}
                    onChange={(e) => {
                      const role = e.target.value;
                      setEmpRole(role);
                      if (role === "staff" || role === "cashier" || role === "waiter" || role === "office") setTripRate(0);
                      else if (role === "driver") setTripRate(100000);
                      else setTripRate(50000);
                    }}
                  >
                    <option value="guide">ໄກ້ດນຳທ່ຽວ (Tour Guide)</option>
                    <option value="captain">ກັປຕັນເຮືອ (Boat Captain)</option>
                    <option value="driver">ພະນັກງານຂັບລົດ (Driver)</option>
                    <option value="cashier">ພະນັກງານເກັບເງິນ (Cashier)</option>
                    <option value="waiter">ພະນັກງານເສີບ (Waiter)</option>
                    <option value="staff">ພະນັກງານທົ່ວໄປ (Staff)</option>
                    <option value="office">ພະນັກງານຫ້ອງການ (Office)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>{t("employee_type_label", "ປະເພດພະນັກງານ / Type")}</label>
                  <select
                    className="form-control"
                    value={empType}
                    onChange={(e) => {
                      const type = e.target.value;
                      setEmpType(type);
                      setBaseSalary(type === "freelance" ? 0 : 2500000);
                    }}
                  >
                    <option value="permanent">ພະນັກງານປະຈຳ (Permanent)</option>
                    <option value="freelance">ພະນັກງານອິດສະຫຼະ/OT (Freelance)</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>ສະຖານະການເຮັດວຽກ / Status</label>
                  <select className="form-control" value={empStatus} onChange={(e) => setEmpStatus(e.target.value)}>
                    <option value="active">Active (ກຳລັງເຮັດວຽກ)</option>
                    <option value="inactive">Inactive (ຢຸດວຽກ)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>ຄ່າຄອມມິດຊັນສະສົມ / Commission (LAK)</label>
                  <input type="number" className="form-control" value={empCommission} onChange={(e) => setEmpCommission(e.target.value)} min="0" step="10000" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>ຄ່າແຮງງານລາຍວັນ / Daily Wage (LAK/Day)</label>
                  <input type="number" className="form-control" value={empDailyWage} onChange={(e) => setEmpDailyWage(e.target.value)} min="0" step="10000" />
                </div>
                <div className="form-group">
                  <label>ຈຳນວນວັນເຮັດວຽກ / Days Worked</label>
                  <input type="number" className="form-control" value={empDaysWorked} onChange={(e) => setEmpDaysWorked(e.target.value)} min="0" max="31" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>ຄ່າລ່ວງເວລາ (OT) / Overtime Pay (LAK)</label>
                  <input type="number" className="form-control" value={empOT} onChange={(e) => setEmpOT(e.target.value)} min="0" step="10000" />
                </div>
                <div className="form-group">
                  <label>ເງິນປະຈຳຕຳແໜ່ງ / Allowance (LAK)</label>
                  <input type="number" className="form-control" value={empAllowance} onChange={(e) => setEmpAllowance(e.target.value)} min="0" step="50000" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>ເງິນເດືອນປະຈຳ / Base Salary (LAK)</label>
                  <input type="number" className="form-control" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} min="0" step="100000" required />
                </div>
                <div className="form-group">
                  <label>{t("trip_fee_label", "ຄ່າທ່ຽວ (OT) / Trip Fee (LAK)")}</label>
                  <input type="number" className="form-control" value={tripRate} onChange={(e) => setTripRate(e.target.value)} min="0" step="5000" required />
                </div>
              </div>

              {empRole === "guide" && (
                <div style={{ background: "rgba(15, 118, 110, 0.05)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(15, 118, 110, 0.15)", marginBottom: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#0f766e" }}>⚙️ ຕັ້ງຄ່າອັດຕາເງິນພິເສດໄກ້ດ / Guide Payout Rates</span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                    <div>
                      <label style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>ຄ່າພາທ່ຽວຕໍ່ຮອບ / Tour Rate</label>
                      <input type="number" className="form-control" value={tourRate} onChange={(e) => setTourRate(e.target.value)} min="0" step="5000" />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>ຄ່າລ່ອງແກ່ງຕໍ່ຮອບ / Rafting Rate</label>
                      <input type="number" className="form-control" value={raftingRate} onChange={(e) => setRaftingRate(e.target.value)} min="0" step="5000" />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>ຄ່າພິເສດ / Special Rate</label>
                      <input type="number" className="form-control" value={specialRate} onChange={(e) => setSpecialRate(e.target.value)} min="0" step="5000" />
                    </div>
                  </div>
                </div>
              )}

              {/* Emergency Contact Group */}
              <div style={{ background: "rgba(239, 68, 68, 0.03)", padding: "12px", borderRadius: "8px", border: "1px dashed rgba(239, 68, 68, 0.2)", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#b91c1c" }}>🚨 ຕິດຕໍ່ສຸກເສີນ / Emergency Contact</span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>
                    <label style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>ຊື່ຜູ້ຕິດຕໍ່ສຸກເສີນ / Name</label>
                    <input type="text" className="form-control" value={empEmergencyContactName} onChange={(e) => setEmpEmergencyContactName(e.target.value)} placeholder="ຕົວຢ່າງ: ສົມປອງ" />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>ພົວພັນເປັນ / Relationship</label>
                    <input type="text" className="form-control" value={empEmergencyRelationship} onChange={(e) => setEmpEmergencyRelationship(e.target.value)} placeholder="ເຊັ່ນ: ພໍ່, ແມ່, ສາມີ" />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>ເບີໂທສຸກເສີນ / Phone</label>
                  <input type="tel" className="form-control" value={empEmergencyContactPhone} onChange={(e) => setEmpEmergencyContactPhone(e.target.value)} placeholder="e.g. 020 555-XXXX" />
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingEmpId ? "ບັນທຶກການແກ້ໄຂ / Save Changes" : "ບັນທຶກພະນັກງານ / Save Employee"}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowAddEditModal(false);
                    resetEmployeeForm();
                  }}
                >
                  {t("cancel_btn", "ຍົກເລີກ / Cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQrModal && (
        <div className="modal-overlay no-print">
          <div className="modal-content" style={{ maxWidth: "480px", textAlign: "center", padding: "24px" }}>
            <div className="modal-header" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "12px", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "1.25rem", color: "var(--text-primary)", fontWeight: "bold" }}>
                QR Code ລົງທະບຽນພະນັກງານ
              </h3>
              <button 
                className="btn btn-secondary" 
                style={{ padding: "4px 8px", background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem" }} 
                onClick={() => setShowQrModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                ໃຫ້ພະນັກງານສະແກນ QR Code ນີ້ ເພື່ອກອກຂໍ້ມູນປະຫວັດ (ຊື່, ເບີໂທ, ຕຳແໜ່ງ, ບັນຊີທະນາຄານ) ເຂົ້າໃນລະບົບດ້ວຍຕົນເອງ
              </p>
              
              <div style={{
                background: "white",
                padding: "20px",
                borderRadius: "16px",
                border: "1px solid var(--border-color)",
                boxShadow: "var(--shadow-sm)",
                display: "inline-block"
              }}>
                <QRCodeSVG 
                  value={(() => {
                    const host = localStorage.getItem("pos_custom_host_url") || window.location.origin;
                    return `${host}/register-employee`;
                  })()}
                  size={220}
                />
              </div>

              <div style={{ width: "100%", display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  className="btn"
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    background: copied ? "var(--success)" : "var(--bg-tertiary)",
                    color: copied ? "white" : "var(--text-primary)",
                    border: "1px solid var(--border-color)",
                    fontWeight: "600",
                    fontSize: "0.9rem"
                  }}
                  onClick={() => {
                    const host = localStorage.getItem("pos_custom_host_url") || window.location.origin;
                    navigator.clipboard.writeText(`${host}/register-employee`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                  {copied ? "ຄັດລອກແລ້ວ!" : "ຄັດລອກລິ້ງ / Copy Link"}
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    fontSize: "0.9rem"
                  }}
                  onClick={() => {
                    const host = localStorage.getItem("pos_custom_host_url") || window.location.origin;
                    window.open(`${host}/register-employee`, "_blank");
                  }}
                >
                  <ExternalLink size={16} />
                  ທົດລອງເປີດ / Open Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedEmpDetails && (() => {
        const emp = selectedEmpDetails;
        const calc = calculatePayout(emp);
        const roleLabel =
          emp.role === "guide" ? "ໄກ້ດນຳທ່ຽວ (Tour Guide)" :
          emp.role === "captain" ? "ກັປຕັນເຮືອ (Boat Captain)" :
          emp.role === "driver" ? "ພະນັກງານຂັບລົດ (Driver)" :
          "ພະນັກງານຕ້ອນຮັບ (Staff)";

        return (
          <div className="modal-overlay no-print">
            <div className="modal-content" style={{ maxWidth: "800px" }}>
              <div className="modal-header">
                <h3 style={{ fontSize: "1.25rem", color: "var(--text-primary)" }}>
                  ລາຍລະອຽດລາຍໄດ້ພະນັກງານ / Employee Earnings Detail
                </h3>
                <button className="btn btn-secondary" style={{ padding: "4px 8px" }} onClick={() => setSelectedEmpDetails(null)}>
                  X
                </button>
              </div>

              <div className="modal-body">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px", background: "var(--bg-tertiary)", padding: "15px", borderRadius: "12px" }}>
                  <div><strong>ຊື່ພະນັກງານ / Name:</strong> {emp.name}</div>
                  <div><strong>ຕຳແໜ່ງ / Role:</strong> {roleLabel}</div>
                  <div><strong>ປະເພດ / Type:</strong> {emp.type === "freelance" ? "ພະນັກງານອິດສະຫຼະ (Freelance)" : "ພະນັກງານປະຈຳ (Permanent)"}</div>
                  <div><strong>ອັດຕາຄ່າທ່ຽວ / Trip Rate:</strong> {formatLAK(emp.tripRate)} / ທ່ຽວ</div>
                  <div style={{ gridColumn: "span 2" }}><strong>ເລກບັນຊີ / Bank Account:</strong> {emp.bankAccount || "-"}</div>
                </div>

                <div style={{ background: "var(--primary-light)", padding: "15px", borderRadius: "12px", border: "1px solid var(--border-color-glow)", marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span>ເງິນເດືອນພື້ນຖານ / Base Salary:</span>
                    <strong>{emp.type === "freelance" ? "0 ₭" : formatLAK(emp.salary)}</strong>
                  </div>

                  {emp.dailyWage > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span>ຄ່າແຮງງານລາຍວັນ / Daily Wage Pay ({emp.daysWorked || 26} ວັນ):</span>
                      <strong>{formatLAK((emp.dailyWage || 0) * (emp.daysWorked || 26))} ({formatLAK(emp.dailyWage)}/ວັນ)</strong>
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span>ລວມເງິນຄ່າທ່ຽວ ({calc.tripCount} ທ່ຽວ) / Total Trip Fee:</span>
                    <strong>{formatLAK(calc.tripPay)}</strong>
                  </div>

                  {emp.ot > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span>ຄ່າລ່ວງເວລາ (OT) / Overtime Pay:</span>
                      <strong>{formatLAK(emp.ot)}</strong>
                    </div>
                  )}

                  {emp.commission > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span>ຄ່າຄອມມິດຊັນ / Commission:</span>
                      <strong>{formatLAK(emp.commission)}</strong>
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span>ໂບນັດພິເສດ / Special Bonus:</span>
                    <strong>{formatLAK(emp.bonus || 0)}</strong>
                  </div>

                  <div style={{ borderTop: "2px solid var(--primary)", paddingTop: "8px", marginTop: "8px", display: "flex", justifyContent: "space-between", fontSize: "1.1rem" }}>
                    <span style={{ color: "var(--primary)", fontWeight: "bold" }}>ຍອດລວມສຸດທິ / Grand Total:</span>
                    <strong style={{ color: "var(--primary)" }}>{formatLAK(calc.totalPayout)}</strong>
                  </div>
                </div>

                <h4 style={{ fontSize: "1.05rem", marginBottom: "10px", color: "var(--text-primary)" }}>
                  ປະຫວັດການອອກທ່ຽວ / Trip Logs
                </h4>

                <div style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid var(--border-color)", borderRadius: "8px", marginBottom: "20px" }}>
                  <table style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th>ວັນທີ / Date</th>
                        <th>ເວລາ / Time</th>
                        <th>ເຮືອ / Boat</th>
                        <th>ບົດບາດ / Role</th>
                        <th style={{ textAlign: "right" }}>ຄ່າທ່ຽວ / Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calc.tripsDetail.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: "center", color: "var(--text-muted)" }}>
                            ບໍ່ມີປະຫວັດການອອກທ່ຽວໃນເດືອນນີ້ / No trips logged.
                          </td>
                        </tr>
                      ) : (
                        calc.tripsDetail.map((trip, idx) => (
                          <tr key={idx}>
                            <td>{trip.date}</td>
                            <td>{trip.time}</td>
                            <td>{trip.boatName}</td>
                            <td>{trip.role}</td>
                            <td style={{ textAlign: "right" }}>{formatLAK(trip.payout)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-primary" onClick={triggerPrintPayslip}>
                  {t("print_payslip", "ພິມໃບສະຫຼຸບເງິນເດືອນ / Print Payslip")}
                </button>
                <button className="btn btn-secondary" onClick={() => setSelectedEmpDetails(null)}>
                  ປິດ / Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="printable-area">
        {printTemplate === "payroll" && (
          <div className="payroll-print">
          <div style={{ textAlign: "center", borderBottom: "2px solid #000", paddingBottom: "10px", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>ລາຍງານສະຫຼຸບເງິນເດືອນ ແລະ ໂອທີພະນັກງານ / MONTHLY PAYROLL</h2>
            <span style={{ fontSize: "11px" }}>TADFANE RAFTING / ຕາດຟານ ລ່ອງແກ່ງ - ACCOUNTING DEPARTMENT</span>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
            <thead>
              <tr style={{ background: "#e2e8f0" }}>
                <th style={{ border: "1px solid #000", padding: "6px", textAlign: "left" }}>ລະຫັດ</th>
                <th style={{ border: "1px solid #000", padding: "6px", textAlign: "left" }}>ຊື່ ແລະ ນາມສະກຸນ</th>
                <th style={{ border: "1px solid #000", padding: "6px", textAlign: "left" }}>ຕຳແໜ່ງ</th>
                <th style={{ border: "1px solid #000", padding: "6px", textAlign: "left" }}>ປະເພດ</th>
                <th style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>ເງິນເດືອນພື້ນຖານ</th>
                <th style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>ຈຳນວນທ່ຽວ</th>
                <th style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>ເງິນທ່ຽວ (OT)</th>
                <th style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>ໂບນັດພິເສດ</th>
                <th style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>ຍອດລວມສຸດທິ (LAK)</th>
              </tr>
            </thead>
            <tbody>
              {db.employees.map(emp => {
                const calc = calculatePayout(emp);
                const roleLabel =
                  emp.role === "guide" ? "ໄກ້ດນຳທ່ຽວ" :
                  emp.role === "captain" ? "ກັປຕັນເຮືອ" :
                  emp.role === "driver" ? "ພະນັກງານຂັບລົດ" :
                  "ພະນັກງານຕ້ອນຮັບ";
                return (
                  <tr key={emp.id}>
                    <td style={{ border: "1px solid #000", padding: "6px" }}>{emp.id}</td>
                    <td style={{ border: "1px solid #000", padding: "6px", fontWeight: "bold" }}>{emp.name}</td>
                    <td style={{ border: "1px solid #000", padding: "6px" }}>{roleLabel}</td>
                    <td style={{ border: "1px solid #000", padding: "6px" }}>{emp.type === "freelance" ? "ອິດສະຫຼະ (OT)" : "ປະຈຳ"}</td>
                    <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>
                      {emp.type === "freelance" ? "0 ₭" : (
                        <div>
                          {formatLAK(emp.salary)}
                          {emp.allowance > 0 && (
                            <div style={{ fontSize: "8.5px", color: "#0f766e", fontWeight: "600" }}>
                              +{formatLAK(emp.allowance)} (ຕຳແໜ່ງ)
                            </div>
                          )}
                        </div>
                      )}
                      {emp.dailyWage > 0 && (
                        <div style={{ fontSize: "8px", color: "#64748b", marginTop: "2px" }}>
                          {formatLAK(emp.dailyWage)}/ວັນ ({emp.daysWorked || 26} ວັນ)
                        </div>
                      )}
                    </td>
                    <td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>{calc.tripCount}</td>
                    <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>
                      {formatLAK(calc.tripPay)}
                      {(emp.ot > 0 || emp.commission > 0) && (
                        <div style={{ fontSize: "8px", color: "#64748b", marginTop: "2px" }}>
                          {emp.ot > 0 && `OT: +${formatLAK(emp.ot)}`} {emp.commission > 0 && `Comm: +${formatLAK(emp.commission)}`}
                        </div>
                      )}
                    </td>
                    <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>{formatLAK(emp.bonus || 0)}</td>
                    <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right", fontWeight: "bold" }}>{formatLAK(calc.totalPayout)}</td>
                  </tr>
                );
              })}
              <tr style={{ background: "#e2e8f0", fontWeight: "bold" }}>
                <td colSpan="4" style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>ຍອດລວມທັງໝົດ (Grand Total)</td>
                <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>
                  {formatLAK(grandBaseSalary)}
                  {grandAllowance > 0 && (
                    <div style={{ fontSize: "8.5px", color: "#0f766e" }}>
                      +{formatLAK(grandAllowance)} (ຕຳແໜ່ງ)
                    </div>
                  )}
                  {grandDailyWagePay > 0 && (
                    <div style={{ fontSize: "8px", color: "#64748b", marginTop: "2px" }}>
                      ລາຍວັນ: {formatLAK(grandDailyWagePay)}
                    </div>
                  )}
                </td>
                <td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>{grandTripCount}</td>
                <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>
                  {formatLAK(grandTripPay)}
                  {(grandOTPay > 0 || grandCommission > 0) && (
                    <div style={{ fontSize: "8px", color: "#64748b", marginTop: "2px" }}>
                      {grandOTPay > 0 && `OT: +${formatLAK(grandOTPay)}`} {grandCommission > 0 && ` Comm: +${formatLAK(grandCommission)}`}
                    </div>
                  )}
                </td>
                <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>{formatLAK(grandBonus)}</td>
                <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right", color: "var(--primary)" }}>{formatLAK(grandTotal)}</td>
              </tr>
            </tbody>
          </table>
          </div>
        )}

        {printTemplate === "payslip" && selectedEmpDetails && (() => {
          const emp = selectedEmpDetails;
          const calc = calculatePayout(emp);
          const roleLabel =
            emp.role === "guide" ? "ໄກ້ດນຳທ່ຽວ" :
            emp.role === "captain" ? "ກັປຕັນເຮືອ" :
            emp.role === "driver" ? "ພະນັກງານຂັບລົດ" :
            "ພະນັກງານຕ້ອນຮັບ";

          return (
            <div className="payslip-print">
              <div style={{ textAlign: "center", borderBottom: "2px solid #000", paddingBottom: "10px", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "16px", fontWeight: "bold", margin: 0 }}>ໃບສະຫຼຸບລາຍຮັບພະນັກງານລາຍບຸກຄົນ / INDIVIDUAL PAYSLIP</h2>
                <span style={{ fontSize: "11px" }}>TADFANE RAFTING / ຕາດຟານ ລ່ອງແກ່ງ - ACCOUNTING DEPARTMENT</span>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", marginBottom: "20px" }}>
                <tbody>
                  <tr>
                    <td style={{ border: "1px solid #000", padding: "6px", fontWeight: "bold", width: "25%", background: "#f8fafc" }}>ລະຫັດພະນັກງານ / ID:</td>
                    <td style={{ border: "1px solid #000", padding: "6px", width: "25%" }}>{emp.id}</td>
                    <td style={{ border: "1px solid #000", padding: "6px", fontWeight: "bold", width: "25%", background: "#f8fafc" }}>ຊື່ ແລະ ນາມສະກຸນ / Name:</td>
                    <td style={{ border: "1px solid #000", padding: "6px", width: "25%" }}>{emp.name}</td>
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #000", padding: "6px", fontWeight: "bold", background: "#f8fafc" }}>ຕຳແໜ່ງ / Role:</td>
                    <td style={{ border: "1px solid #000", padding: "6px" }}>{roleLabel}</td>
                    <td style={{ border: "1px solid #000", padding: "6px", fontWeight: "bold", background: "#f8fafc" }}>ປະເພດພະນັກງານ / Type:</td>
                    <td style={{ border: "1px solid #000", padding: "6px" }}>{emp.type === "freelance" ? "ອິດສະຫຼະ (OT)" : "ປະຈຳ"}</td>
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #000", padding: "6px", fontWeight: "bold", background: "#f8fafc" }}>ເລກບັນຊີ / Bank Account:</td>
                    <td colSpan="3" style={{ border: "1px solid #000", padding: "6px" }}>{emp.bankAccount || "-"}</td>
                  </tr>
                </tbody>
              </table>

              <h3 style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}>ສະຫຼຸບຍອດເງິນ / Earnings Summary</h3>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", marginBottom: "30px" }}>
                <tbody>
                  <tr>
                    <td style={{ border: "1px solid #000", padding: "6px", width: "75%" }}>{t("base_salary_label", "ເງິນເດືອນພື້ນຖານ / Base Salary")}:</td>
                    <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>{emp.type === "freelance" ? "0 ₭" : formatLAK(emp.salary)}</td>
                  </tr>
                  {emp.allowance > 0 && (
                    <tr>
                      <td style={{ border: "1px solid #000", padding: "6px" }}>ເງິນປະຈຳຕຳແໜ່ງ / Position Allowance:</td>
                      <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>{formatLAK(emp.allowance)}</td>
                    </tr>
                  )}
                  {emp.dailyWage > 0 && (
                    <tr>
                      <td style={{ border: "1px solid #000", padding: "6px" }}>ຄ່າແຮງງານລາຍວັນ / Daily Wage Pay ({emp.daysWorked || 26} ວັນ):</td>
                      <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>{formatLAK((emp.dailyWage || 0) * (emp.daysWorked || 26))}</td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ border: "1px solid #000", padding: "6px" }}>ຄ່າທ່ຽວສະຫຼຸບ ({calc.tripCount} ທ່ຽວ) / Total Trip Fee:</td>
                    <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>{formatLAK(calc.tripPay)}</td>
                  </tr>
                  {emp.ot > 0 && (
                    <tr>
                      <td style={{ border: "1px solid #000", padding: "6px" }}>ຄ່າລ່ວງເວລາ (OT) / Overtime Pay:</td>
                      <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>{formatLAK(emp.ot)}</td>
                    </tr>
                  )}
                  {emp.commission > 0 && (
                    <tr>
                      <td style={{ border: "1px solid #000", padding: "6px" }}>ຄ່າຄອມມິດຊັນ / Commission:</td>
                      <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>{formatLAK(emp.commission)}</td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ border: "1px solid #000", padding: "6px" }}>ໂບນັດພິເສດ / Special Bonus:</td>
                    <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>{formatLAK(emp.bonus || 0)}</td>
                  </tr>
                  <tr style={{ background: "#e2e8f0", fontWeight: "bold" }}>
                    <td style={{ border: "1px solid #000", padding: "6px" }}>ຍອດຈ່າຍສຸດທິ / Net Payout:</td>
                    <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>{formatLAK(calc.totalPayout)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>
    </div>
  );
}