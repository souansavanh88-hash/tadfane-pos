// OperatingExpenses.jsx - Manual Expense Tracker & Monthly Statement
import React, { useState, useEffect } from "react";
import { getDb, addCustomExpense, deleteCustomExpense } from "../db/mockDb";
import { formatLAK } from "../utils/helpers";
import { Plus, Trash2, Printer, Calendar, DollarSign } from "lucide-react";

export default function OperatingExpenses() {
  const [db, setDb] = useState(getDb());
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  // New expense form states
  const [expDate, setExpDate] = useState(new Date().toISOString().split("T")[0]);
  const [expCategory, setExpCategory] = useState("Utilities");
  const [expDescription, setExpDescription] = useState("");
  const [expAmount, setExpAmount] = useState("");

  useEffect(() => {
    const handleDbUpdate = () => {
      setDb(getDb());
    };
    window.addEventListener("db-update", handleDbUpdate);
    return () => window.removeEventListener("db-update", handleDbUpdate);
  }, []);

  const handleSaveExpense = (e) => {
    e.preventDefault();
    if (!expAmount || isNaN(expAmount) || parseFloat(expAmount) <= 0) {
      alert("ກະລຸນາປ້ອນຈຳນວນເງິນທີ່ຖືກຕ້ອງ / Please enter a valid amount");
      return;
    }
    if (!expDescription.trim()) {
      alert("ກະລຸນາປ້ອນລາຍລະອຽດ / Please enter a description");
      return;
    }

    addCustomExpense({
      date: expDate,
      category: expCategory,
      description: expDescription.trim(),
      amount: parseFloat(expAmount)
    });

    // Reset form
    setExpDescription("");
    setExpAmount("");
  };

  const handleDeleteExpense = (id) => {
    if (confirm("ທ່ານຕ້ອງການລຶບລາຍຈ່າຍນີ້ແມ່ນບໍ່? / Are you sure you want to delete this expense?")) {
      deleteCustomExpense(id);
    }
  };

  const triggerPrintExpenses = () => {
    // Force synchronous layout reflow
    const forceReflow = document.body.offsetHeight;
    window.print();
  };

  // Computations for the selected month
  const monthStr = selectedMonth;

  // 1. Filtered Custom Expenses
  const filteredCustom = (db.customExpenses || []).filter(exp => exp.date.startsWith(monthStr));
  const totalCustom = filteredCustom.reduce((sum, exp) => sum + exp.amount, 0);

  // 2. Filtered Trips for fuel, maintenance, and crew allowances
  const monthTrips = db.trips.filter(t => t.date.startsWith(monthStr) && (t.status === "completed" || t.status === "dispatched"));
  
  const FUEL_RATE = 150000;
  const MAINT_RATE = 30000;
  const totalFuel = monthTrips.length * FUEL_RATE;
  const totalMaint = monthTrips.length * MAINT_RATE;

  // 3. Crew Trip Wages (Guides, Captains, Drivers)
  let totalCrewTripWages = 0;
  let guideWages = 0;
  let captainWages = 0;
  let driverWages = 0;

  monthTrips.forEach(trip => {
    if (trip.guideIds) {
      trip.guideIds.forEach(gid => {
        const emp = db.employees.find(e => e.id === gid);
        if (emp) {
          totalCrewTripWages += emp.tripRate;
          guideWages += emp.tripRate;
        }
      });
    }
    const tripCaptainIds = trip.captainIds || (trip.captainId ? [trip.captainId] : []);
    tripCaptainIds.forEach(cid => {
      const emp = db.employees.find(e => e.id === cid);
      if (emp) {
        totalCrewTripWages += emp.tripRate;
        captainWages += emp.tripRate;
      }
    });
    if (trip.driverIds) {
      trip.driverIds.forEach(did => {
        const emp = db.employees.find(e => e.id === did);
        if (emp) {
          totalCrewTripWages += emp.tripRate;
          driverWages += emp.tripRate;
        }
      });
    }
  });

  // 4. Prorated Salaries (monthly permanent staff payroll)
  const totalBaseSalaries = db.employees.filter(e => e.type === "permanent").reduce((sum, e) => sum + e.salary, 0);

  // 5. Office Rent
  const OFFICE_RENT_MONTHLY = 1200000;

  // 6. Commissions
  let monthCommissions = 0;
  const monthCusts = db.customers.filter(c => c.checkInDate.startsWith(monthStr));
  monthCusts.forEach(c => {
    if (c.partnerId) {
      const partner = db.partners.find(p => p.id === c.partnerId);
      if (partner) monthCommissions += partner.commissionRate;
    }
  });

  const totalOperatingExpenses = totalCustom + totalFuel + totalMaint + totalCrewTripWages + totalBaseSalaries + OFFICE_RENT_MONTHLY + monthCommissions;

  return (
    <div>
      <div className="no-print">
      {/* Title */}
      <div className="page-header no-print" style={{ marginBottom: "1.5rem" }}>
        <div className="page-title">
          <h1>ລາຍຈ່າຍຂອງກິດຈະກຳ (Operating Expenses)</h1>
          <p>ຈັດການລາຍຈ່າຍທົ່ວໄປ ແລະ ຕິດຕາມລາຍຈ່າຍດຳເນີນງານທັງໝົດປະຈຳເດືອນ</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--bg-secondary)", padding: "4px 12px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            <Calendar size={16} />
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)} 
              style={{ border: "none", background: "none", color: "var(--text-primary)", fontSize: "0.875rem", fontWeight: "600", outline: "none" }}
            />
          </div>
          <button className="btn btn-primary" onClick={triggerPrintExpenses}>
            <Printer size={16} style={{ marginRight: "4px" }} />
            ພິມໃບບິນລາຍຈ່າຍ (Print Expenses)
          </button>
        </div>
      </div>

      <div className="dashboard-sections-grid no-print" style={{ marginBottom: "2rem" }}>
        
        {/* Expense logger form */}
        <div className="card">
          <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Plus size={20} color="var(--primary)" />
            ເພີ່ມລາຍຈ່າຍໃໝ່ / New Expense Entry
          </h2>
          <form onSubmit={handleSaveExpense} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)" }}>ວັນທີ / Date:</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={expDate} 
                  onChange={(e) => setExpDate(e.target.value)} 
                  required
                />
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)" }}>ໝວດໝູ່ / Category:</label>
                <select 
                  className="form-control" 
                  value={expCategory} 
                  onChange={(e) => setExpCategory(e.target.value)}
                >
                  <option value="Utilities">Utilities (ຄ່ານ້ຳ/ໄຟ/ເນັດ)</option>
                  <option value="Supplies">Supplies (ຊື້ເຄື່ອງໃຊ້/ເຄື່ອງດື່ມ)</option>
                  <option value="Boat Repair">Boat Repair (ຄ່າຊ່ອມເຮືອ)</option>
                  <option value="Marketing">Marketing (ການຕະຫຼາດ)</option>
                  <option value="Office Rent">Office Rent (ຄ່າເຊົ່າ)</option>
                  <option value="Food & Drinks">Food & Drinks (ອາຫານ/ເຄື່ອງດື່ມ)</option>
                  <option value="Extra Fuel">Extra Fuel (ນ້ຳມັນເສີມ)</option>
                  <option value="Miscellaneous">Miscellaneous (ອື່ນໆ)</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)" }}>ຍອດເງິນ / Amount (LAK):</label>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="250,000 LAK"
                  value={expAmount} 
                  onChange={(e) => setExpAmount(e.target.value)} 
                  required
                />
              </div>
              <div style={{ flex: 2, display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)" }}>ຄຳອະທિບາຍ / Description:</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="ຊື້ກາເຟ ແລະ ນ້ຳດື່ມຫ້ອງການ"
                  value={expDescription} 
                  onChange={(e) => setExpDescription(e.target.value)} 
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: "8px", alignSelf: "flex-end", padding: "8px 24px" }}>
              ບັນທຶກลາຍຈ່າຍ / Save Expense
            </button>
          </form>
        </div>

        {/* List of custom expenses */}
        <div className="card">
          <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "1.25rem" }}>
            ລາຍການລາຍຈ່າຍເພີ່ມເຕີມ / Manual Expenses List
          </h2>
          <div style={{ maxHeight: "250px", overflowY: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>ວັນທີ / Date</th>
                  <th>ໝວດໝູ່ / Category</th>
                  <th>ຄຳອະທિບາຍ / Description</th>
                  <th style={{ textAlign: "right" }}>ຍອດເງິນ / Amount</th>
                  <th style={{ textAlign: "center" }}>ລຶບ</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustom.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)" }}>
                      ບໍ່ມີລາຍການລາຍຈ່າຍໃນເດືອນນີ້ / No manual entries.
                    </td>
                  </tr>
                ) : (
                  filteredCustom.map(exp => (
                    <tr key={exp.id}>
                      <td>{exp.date}</td>
                      <td><span className="badge badge-warning">{exp.category}</span></td>
                      <td>{exp.description}</td>
                      <td style={{ textAlign: "right", fontWeight: "bold", color: "var(--danger)" }}>-{formatLAK(exp.amount)}</td>
                      <td style={{ textAlign: "center" }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: "4px 8px", color: "var(--danger)" }}
                          onClick={() => handleDeleteExpense(exp.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Monthly operational statement block */}
      <div className="card no-print" style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <DollarSign size={20} color="var(--primary)" />
          ສະຫຼຸບລາຍຈ່າຍດຳເນີນງານປະຈຳເດືອນ / Operational Expenses Statement
        </h2>
        
        <table>
          <thead>
            <tr>
              <th>ລາຍການລາຍຈ່າຍ / Expense Category</th>
              <th>ລາຍລະອຽດ / Calculation Details</th>
              <th style={{ textAlign: "right" }}>ຍອດເງິນລວມ / Monthly Amount (LAK)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>ເງິນເດືອນພະນັກງານປະຈຳ (Base Salaries)</strong></td>
              <td>ເງິນເດືອນພື້ນຖານພະນັກງານທັງໝົດໃນລະບົບ (ເດືອນ)</td>
              <td style={{ textAlign: "right", fontWeight: "bold" }}>-{formatLAK(totalBaseSalaries)}</td>
            </tr>
            <tr>
              <td>ຄ່າທ່ຽວໄກ້ດທັງໝົດ (Guide Trip Allowances)</td>
              <td>ຄ່າທ່ຽວຂອງໄກ້ດທີ່ອອກທັງໝົດໃນເດືອນ</td>
              <td style={{ textAlign: "right" }}>-{formatLAK(guideWages)}</td>
            </tr>
            <tr>
              <td>ຄ່າທ່ຽວກັປຕັນທັງໝົດ (Captain Trip Allowances)</td>
              <td>ຄ່າທ່ຽວຂອງກັປຕັນທີ່ອອກທັງໝົດໃນເດືອນ</td>
              <td style={{ textAlign: "right" }}>-{formatLAK(captainWages)}</td>
            </tr>
            <tr>
              <td>ຄ່າທ່ຽວຄົນຂັບລົດທັງໝົດ (Driver Trip Allowances)</td>
              <td>ຄ່າທ່ຽວຂອງຄົນຂັບລົດທີ່ອອກທັງໝົດໃນເດືອນ</td>
              <td style={{ textAlign: "right" }}>-{formatLAK(driverWages)}</td>
            </tr>
            <tr>
              <td><strong>ຄ່ານ້ຳມັນເຊື້ອໄຟເຮືອ (Boat Fuel Expenses)</strong></td>
              <td>{monthTrips.length} ທ່ຽວ * 150,000 LAK / ທ່ຽວ</td>
              <td style={{ textAlign: "right", fontWeight: "bold" }}>-{formatLAK(totalFuel)}</td>
            </tr>
            <tr>
              <td>ຄ່າຊ່ອມບຳລຸງ ແລະ ສຶກຫຼໍເຮືອ (Boat Wear & Tear Expenses)</td>
              <td>{monthTrips.length} ທ່ຽວ * 30,000 LAK / ທ່ຽວ</td>
              <td style={{ textAlign: "right" }}>-{formatLAK(totalMaint)}</td>
            </tr>
            <tr>
              <td>ຄ່າເຊົ່າຫ້ອງການຄົງທີ່ (Fixed Office Rent)</td>
              <td>ຄ່າເຊົ່າຫ້ອງການປະຈຳເດືອນຄົງທີ່</td>
              <td style={{ textAlign: "right" }}>-{formatLAK(OFFICE_RENT_MONTHLY)}</td>
            </tr>
            <tr>
              <td>ຄ່າຄອມມິດຊັນເອເຈນສະສົມ (Agent Commissions Expense)</td>
              <td>ຄອມມິດຊັນ referrals ຂອງເອເຈນທັງໝົດໃນເດືອນ</td>
              <td style={{ textAlign: "right" }}>-{formatLAK(monthCommissions)}</td>
            </tr>
            <tr>
              <td><strong>ລາຍຈ່າຍອື່ນໆຄີມືເພີ່ມເຕີມ (Manual Expenses Added)</strong></td>
              <td>ຄ່ານ້ຳ, ຄ່າໄຟ, ອຸປະກອນ, ແລະ ລາຍຈ່າຍອື່ນໆ</td>
              <td style={{ textAlign: "right", fontWeight: "bold" }}>-{formatLAK(totalCustom)}</td>
            </tr>
            <tr style={{ background: "var(--bg-tertiary)", fontWeight: "bold", fontSize: "1.1rem" }}>
              <td colSpan="2">ລວມລາຍຈ่ายທັງໝົດ / TOTAL OPERATING EXPENSES</td>
              <td style={{ textAlign: "right", color: "var(--danger)" }}>-{formatLAK(totalOperatingExpenses)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      </div>

      {/* --------------------- HIGH FIDELITY PRINTABLE STATEMENT --------------------- */}
      <div className="printable-area">
        <div className="dashboard-print">
          <div style={{ textAlign: "center", marginBottom: "20px", borderBottom: "2px solid #000", paddingBottom: "10px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "bold" }}>ໃບບິນລາຍຈ່າຍປະຈຳເດືອນ / MONTHLY EXPENSE STATEMENT</h2>
            <p style={{ fontSize: "12px", color: "#666" }}>TADFANE RAFTING / ຕາດຟານ ລ່ອງແກ່ງ - ACCOUNTING DEPARTMENT</p>
            <p style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
              <strong>ປະຈຳເດືອນ / Period:</strong> {selectedMonth} | <strong>ພິມວັນທີ / Printed:</strong> {new Date().toLocaleString()}
            </p>
          </div>

          <h3 style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "8px" }}>1. ສະຫຼຸບລາຍຈ່າຍດຳເນີນງານ / Operational Summary</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "25px" }}>
            <thead>
              <tr style={{ background: "#e2e8f0" }}>
                <th style={{ border: "1px solid #000", padding: "6px", textAlign: "left" }}>ລາຍການລາຍຈ່າຍ / Expense Category</th>
                <th style={{ border: "1px solid #000", padding: "6px", textAlign: "left" }}>%ລາຍລະອຽດ / Calculation Details</th>
                <th style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>ຍອດເງິນ / Amount LAK</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: "1px solid #000", padding: "6px" }}>ເງິນເດືອນພະນັກງານປະຈຳ (Base Salaries)</td>
                <td style={{ border: "1px solid #000", padding: "6px" }}>\ເງິນເດືອນພື້ນຖານພະນັກງານທັງໝົດໃນລະບົບ</td>
                <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>-{formatLAK(totalBaseSalaries)}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "6px" }}>ຄ່າທ່ຽວໄກ້ດທັງໝົດ (Guide Trip Allowances)</td>
                <td style={{ border: "1px solid #000", padding: "6px" }}>ຄ່າທ່ຽວຂອງໄກ້ດທັງໝົດໃນເດືອນ</td>
                <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>-{formatLAK(guideWages)}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "6px" }}>ຄ່າທ່ຽວກັປຕັນທັງໝົດ (Captain Trip Allowances)</td>
                <td style={{ border: "1px solid #000", padding: "6px" }}>ຄ່າທ່ຽວຂອງກັປຕັນທັງໝົດໃນເດືອນ</td>
                <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>-{formatLAK(captainWages)}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "6px" }}>ຄ່າທ່ຽວຄົນຂັບລົດທັງໝົດ (Driver Trip Allowances)</td>
                <td style={{ border: "1px solid #000", padding: "6px" }}>ຄ່າທ່ຽວຂອງຄົນຂັບລົດທັງໝົດໃນເດືອນ</td>
                <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>-{formatLAK(driverWages)}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "6px", fontWeight: "bold" }}>ຄ່ານ້ຳມັນເຊື້ອໄຟເຮືອ (Boat Fuel Expenses)</td>
                <td style={{ border: "1px solid #000", padding: "6px" }}>{monthTrips.length} ທ່ຽວ * 150,000 LAK / ທ່ຽວ</td>
                <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right", fontWeight: "bold" }}>-{formatLAK(totalFuel)}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "6px" }}>ຄ່າຊ່ອມບຳລຸງ ແລະ ສຶກຫຼໍເຮືອ (Boat Wear & Tear)</td>
                <td style={{ border: "1px solid #000", padding: "6px" }}>{monthTrips.length} ທ່ຽວ * 30,000 LAK / ທ່ຽວ</td>
                <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>-{formatLAK(totalMaint)}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "6px" }}>ຄ່າເຊົ່າຫ້ອງການຄົງທີ່ (Fixed Office Rent)</td>
                <td style={{ border: "1px solid #000", padding: "6px" }}>ຄ່າເຊົ່າຫ້ອງການປະຈຳເດືອນຄົງທີ່</td>
                <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>-{formatLAK(OFFICE_RENT_MONTHLY)}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "6px" }}>ຄ່າຄອມມິດຊັນເອເຈນສະສົມ (Agent Commissions)</td>
                <td style={{ border: "1px solid #000", padding: "6px" }}>ຄອມມິດຊັນ referrals ຂອງເອເຈນທັງໝົດ</td>
                <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>-{formatLAK(monthCommissions)}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "6px", fontWeight: "bold" }}>ລາຍຈ່າຍອື່ນໆຄີມືເພີ່ມເຕີມ (Manual Expenses Added)</td>
                <td style={{ border: "1px solid #000", padding: "6px" }}>ຄ່ານ້ຳ, ຄ່າໄຟ, ອຸປະກອນ, ແລະ ລາຍຈ່າຍອື່ນໆ</td>
                <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right", fontWeight: "bold" }}>-{formatLAK(totalCustom)}</td>
              </tr>
              <tr style={{ background: "#cbd5e1", fontWeight: "bold" }}>
                <td style={{ border: "1px solid #000", padding: "6px" }} colSpan="2">ລວມລາຍຈ່າຍທັງໝົດ / TOTAL OPERATING EXPENSES</td>
                <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right", color: "red" }}>-{formatLAK(totalOperatingExpenses)}</td>
              </tr>
            </tbody>
          </table>

          <h3 style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "8px", marginTop: "20px" }}>2. ລາຍການລາຍຈ່າຍເພີ່ມເຕີມ / Itemized Manual Expenses</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#e2e8f0" }}>
                <th style={{ border: "1px solid #000", padding: "6px", textAlign: "left" }}>ວັນທີ / Date</th>
                <th style={{ border: "1px solid #000", padding: "6px", textAlign: "left" }}>ໝວດໝູ່ / Category</th>
                <th style={{ border: "1px solid #000", padding: "6px", textAlign: "left" }}>ຄຳອະທິບາຍ / Description</th>
                <th style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>ຍອດເງິນ / Amount LAK</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustom.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ border: "1px solid #000", padding: "10px", textAlign: "center", color: "#666" }}>ບໍ່ມີລາຍການ / No records.</td>
                </tr>
              ) : (
                filteredCustom.map(exp => (
                  <tr key={exp.id}>
                    <td style={{ border: "1px solid #000", padding: "6px" }}>{exp.date}</td>
                    <td style={{ border: "1px solid #000", padding: "6px" }}>{exp.category}</td>
                    <td style={{ border: "1px solid #000", padding: "6px" }}>{exp.description}</td>
                    <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right", fontWeight: "bold", color: "red" }}>-{formatLAK(exp.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
