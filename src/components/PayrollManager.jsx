// PayrollManager.jsx - Employee payroll ledger and employee settings
import React, { useState, useEffect } from "react";
import { getDb, saveDb, clearAllEmployees } from "../db/mockDb";
import { formatLAK } from "../utils/helpers";
import { useLanguage } from "../utils/LanguageContext";
import { Plus, Award, CreditCard, Trash2, Printer } from "lucide-react";

export default function PayrollManager() {
  const { lang, t } = useLanguage();
  const [db, setDb] = useState(getDb());

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

  const [editingEmpId, setEditingEmpId] = useState("");
  const [empBankAccount, setEmpBankAccount] = useState("");
  const [selectedEmpDetails, setSelectedEmpDetails] = useState(null);
  const [editBonusEmpId, setEditBonusEmpId] = useState("");
  const [bonusValue, setBonusValue] = useState(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState("");

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
    setEditingEmpId("");
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
              specialRate: finalSpecialRate
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
        bonus: 0
      };

      updatedDb.employees.push(newEmp);
      alert("ເພີ່ມຂໍ້ມູນພະນັກງານສຳເລັດ! / Employee registered!");
    }

    saveDb(updatedDb);
    resetEmployeeForm();
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
            let baseRate = emp.tourRate !== undefined ? emp.tourRate : 100000;
            if (trip.bookingId) {
              const bk = db.bookings.find(b => b.id === trip.bookingId);
              if (bk && (bk.serviceId === "SRV-001" || bk.serviceId === "SRV-002" || bk.serviceId === "SRV-005")) {
                baseRate = emp.raftingRate !== undefined ? emp.raftingRate : 150000;
              }
            }
            payout = baseRate + (emp.specialRate || 0);
          } else if (emp.role === "driver") {
            payout = emp.tripRate !== undefined ? emp.tripRate : 100000;
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
    const totalPayout = salaryAmt + dailyWagePay + tripPay + (emp.bonus || 0) + (emp.commission || 0) + (emp.ot || 0);

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
    const originalClass = document.body.className;
    document.body.classList.add("print-payslip-mode");
    setTimeout(() => {
      window.print();
      document.body.className = originalClass;
    }, 100);
  };

  const triggerPrintPayroll = () => {
    const originalClass = document.body.className;
    document.body.classList.add("print-payroll-mode");
    setTimeout(() => {
      window.print();
      document.body.className = originalClass;
    }, 100);
  };

  let grandBaseSalary = 0;
  let grandTripCount = 0;
  let grandTripPay = 0;
  let grandBonus = 0;
  let grandTotal = 0;
  let grandDailyWagePay = 0;
  let grandOTPay = 0;
  let grandCommission = 0;

  db.employees.forEach(emp => {
    const calc = calculatePayout(emp);
    grandBaseSalary += emp.type === "freelance" ? 0 : emp.salary;
    grandTripCount += calc.tripCount;
    grandTripPay += calc.tripPay;
    grandBonus += emp.bonus || 0;
    grandTotal += calc.totalPayout;
    
    // Add additional grand totals computation
    grandDailyWagePay += (emp.dailyWage || 0) * (emp.daysWorked !== undefined ? emp.daysWorked : 26);
    grandOTPay += emp.ot || 0;
    grandCommission += emp.commission || 0;
  });

  return (
    <div>
      <div className="page-header no-print">
        <div className="page-title">
          <h1>{t("payroll_manager_title", "ບັນຊີພະນັກງານ & ເງິນເດືອນ (Employee & Payroll)")}</h1>
          <p>{t("payroll_manager_sub", "ຄຸ້ມຄອງຂໍ້ມູນພະນັກງານ, ໄລ່ເງິນຄ່າທ່ຽວ ແລະ ຄິດໄລ່ເງິນເດືອນ")}</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className="btn btn-danger"
            style={{ fontSize: "0.85rem" }}
            onClick={() => {
              clearAllEmployees();
              refreshState();
            }}
          >
            🗑️ ລ້າງພະນັກງານທັງໝົດ / Clear All Employees
          </button>
          <button className="btn btn-primary" onClick={triggerPrintPayroll}>
            <Printer size={16} /> {t("print_payroll_summary", "ພິມສະຫຼຸບໃບເງິນເດືອນລວມ / Print Summary")}
          </button>
        </div>
      </div>

      <div className="no-print" style={{ display: "grid", gridTemplateColumns: "minmax(0, 2.5fr) minmax(0, 1fr)", gap: "2rem", alignItems: "start" }}>
        <div className="card">
          <h2 style={{ fontSize: "1.25rem", marginBottom: "1.25rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CreditCard size={20} color="var(--primary)" />
            {t("payroll_ledger_title", "ລາຍຊື່ພະນັກງານ & ບັນຊີເງິນເດືອນ / Payroll Ledger")}
          </h2>

          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>ພະນັກງານ / ຕຳແໜ່ງ</th>
                  <th>ປະເພດ</th>
                  <th>ເງິນເດືອນພື້ນຖານ</th>
                  <th>ຈຳນວນທ່ຽວ</th>
                  <th>ເງິນທ່ຽວ (OT)</th>
                  <th>ໂບນັດ</th>
                  <th>ລວມສຸດທິ</th>
                  <th>ຈັດການ</th>
                </tr>
              </thead>
              <tbody>
                {db.employees.map(emp => {
                  const calc = calculatePayout(emp);
                  const roleLabel =
                    emp.role === "guide" ? " ໄກ້ດນຳທ່ຽວ" :
                    emp.role === "captain" ? " ກັປຕັນເຮືອ" :
                    emp.role === "driver" ? " ພະນັກງານຂັບລົດ" :
                    " ພະນັກງານຕ້ອນຮັບ";

                  const typeLabel = emp.type === "freelance" ? "ອິດສະຫຼະ (OT)" : "ປະຈຳ";
                  const typeBadge = emp.type === "freelance" ? "badge badge-warning" : "badge badge-success";

                  return (
                    <tr key={emp.id}>
                      <td>
                        <div style={{ fontWeight: "600", color: "var(--text-primary)" }}>{emp.name}</div>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{roleLabel}</span>
                      </td>
                      <td><span className={typeBadge}>{typeLabel}</span></td>
                      <td>
                        {emp.type === "freelance" ? "0 ₭ (ບໍ່ມີເງິນເດືອນ)" : formatLAK(emp.salary)}
                        {emp.dailyWage > 0 && (
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                            {formatLAK(emp.dailyWage)}/ວັນ ({emp.daysWorked || 26} ວັນ)
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span className="badge badge-success" style={{ padding: "3px 8px" }}>{calc.tripCount} ທ່ຽວ</span>
                      </td>
                      <td>
                        <div>{formatLAK(calc.tripPay)}</div>
                        {(emp.ot > 0 || emp.commission > 0) && (
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                            {emp.ot > 0 && <div>OT: +{formatLAK(emp.ot)}</div>}
                            {emp.commission > 0 && <div>Comm: +{formatLAK(emp.commission)}</div>}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <span>{formatLAK(emp.bonus || 0)}</span>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: "2px 6px", fontSize: "0.7rem", background: "var(--bg-tertiary)" }}
                            onClick={() => {
                              setEditBonusEmpId(emp.id);
                              setBonusValue(emp.bonus || 0);
                            }}
                          >
                            ໂບນັດ
                          </button>
                        </div>
                      </td>
                      <td style={{ fontWeight: "bold", color: "var(--primary)" }}>{formatLAK(calc.totalPayout)}</td>
                      <td>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: "4px 8px", fontSize: "0.75rem", background: "var(--bg-tertiary)" }}
                            onClick={() => setSelectedEmpDetails(emp)}
                          >
                            ລາຍລະອຽດ
                          </button>
                          <button
                            className="btn btn-success"
                            style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                            onClick={() => handleTriggerPayout(emp)}
                          >
                            ຈ່າຍ
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: "4px 8px", fontSize: "0.75rem" }}
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
                            }}
                          >
                            ແກ້ໄຂ
                          </button>
                          
                          {deleteConfirmId === emp.id ? (
                            <button
                              className="btn btn-danger"
                              style={{ padding: "4px 8px", fontSize: "0.7rem", fontWeight: "bold", background: "#ef4444" }}
                              onClick={() => {
                                const updatedDb = { ...db };
                                updatedDb.employees = updatedDb.employees.filter(e => e.id !== emp.id);
                                saveDb(updatedDb);
                                refreshState();
                                setDeleteConfirmId("");
                              }}
                            >
                              ยืนยันลบ / Confirm
                            </button>
                          ) : (
                            <button 
                              className="btn btn-danger" 
                              style={{ padding: "4px" }} 
                              onClick={() => {
                                setDeleteConfirmId(emp.id);
                                // Auto-reset confirmation state after 4 seconds
                                setTimeout(() => setDeleteConfirmId(""), 4000);
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {editBonusEmpId ? (
            <div className="card" style={{ borderColor: "var(--warning)", background: "var(--warning-light)" }}>
              <h3 style={{ fontSize: "1.1rem", color: "var(--warning)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "5px" }}>
                <Award size={18} />
                {t("add_bonus_title", "ປ້ອນໂບນັດພິເສດ / Add Bonus")}
              </h3>
              <form onSubmit={handleUpdateBonus}>
                <div className="form-group">
                  <label>{t("employee_colon", "ພະນັກງານ:")} {db.employees.find(e => e.id === editBonusEmpId)?.name}</label>
                  <input
                    type="number"
                    className="form-control"
                    value={bonusValue}
                    onChange={(e) => setBonusValue(e.target.value)}
                    min="0"
                    required
                  />
                </div>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                  <button type="submit" className="btn btn-warning" style={{ flex: 1 }}>บันทึก / Save</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setEditBonusEmpId("")}>
                    {t("cancel_btn", "ຍົກເລີກ / Cancel")}
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          <div className="card">
            <h2 style={{ fontSize: "1.25rem", marginBottom: "1.25rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Plus size={20} color="var(--primary)" />
              {editingEmpId ? "ແກ້ໄຂຂໍ້ມູນພະນັກງານ / Edit Employee" : "ເພີ່ມພະນັກງານໃໝ່ / Add Employee"}
            </h2>

            <form onSubmit={handleSaveEmployee}>
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

              <div className="form-row">
                <div className="form-group">
                  <label>{t("role_label", "ບົດບາດໜ້າທີ່ / Role")}</label>
                  <select
                    className="form-control"
                    value={empRole}
                    onChange={(e) => {
                      const role = e.target.value;
                      setEmpRole(role);
                      if (role === "staff") setTripRate(0);
                      else if (role === "driver") setTripRate(100000);
                      else setTripRate(50000);
                    }}
                  >
                    <option value="guide">ໄກ້ດນຳທ່ຽວ (Tour Guide)</option>
                    <option value="captain">ກັປຕັນເຮືອ (Boat Captain)</option>
                    <option value="driver">ພະນັກງານຂັບລົດ (Driver)</option>
                    <option value="staff">ພະນັກງານຕ້ອນຮັບ (Staff)</option>
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

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, marginTop: "0.5rem" }}>
                  <Plus size={16} /> {editingEmpId ? "ບັນທຶກການແກ້ໄຂ / Save Changes" : "ບັນທຶກພະນັກງານ / Save Employee"}
                </button>
                {editingEmpId && (
                  <button type="button" className="btn btn-secondary" style={{ marginTop: "0.5rem" }} onClick={resetEmployeeForm}>
                    {t("cancel_btn", "ຍົກເລີກ / Cancel")}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

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
                      {emp.type === "freelance" ? "0 ₭" : formatLAK(emp.salary)}
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

        {selectedEmpDetails && (() => {
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