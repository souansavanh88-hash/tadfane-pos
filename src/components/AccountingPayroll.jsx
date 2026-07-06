// AccountingPayroll.jsx - Consolidated Accounting & Operating Expenses Dashboard
import React, { useState, useEffect } from "react";
import { flushSync } from "react-dom";
import PayrollManager from "./PayrollManager";
import Reports from "./Reports";
import CommissionTracker from "./CommissionTracker";
import { getDb, saveDb, addCustomExpense, deleteCustomExpense, approveExpense, rejectExpense } from "../db/mockDb";
import { formatLAK, formatTHB, getLocalDateStr } from "../utils/helpers";
import { useLanguage } from "../utils/LanguageContext";
import { 
  Users, BarChart3, Coins, ArrowLeft, ArrowRight, Wallet, Printer, 
  Calendar, DollarSign, Plus, Trash2, CheckCircle2, XCircle, FileText, ArrowUpRight, ArrowDownRight, ShieldCheck, AlertTriangle
} from "lucide-react";

export default function AccountingPayroll({ currentUser }) {
  const { lang, t } = useLanguage();
  const [db, setDb] = useState(getDb());
  const [printTemplate, setPrintTemplate] = useState(null); // 'statement', 'summary', or null
  const [activeTab, setActiveTab] = useState("income"); // income, expenses, pl, reports, payroll_manager, commission_manager
  
  // Date & Period Filter States
  const localDateStr = getLocalDateStr();
  const [selectedDate, setSelectedDate] = useState(localDateStr);
  const [selectedMonth, setSelectedMonth] = useState(localDateStr.slice(0, 7)); // YYYY-MM
  const [summaryMonth, setSummaryMonth] = useState(localDateStr.slice(0, 7)); // YYYY-MM
  const [selectedYear, setSelectedYear] = useState(localDateStr.slice(0, 4));
  const [incomeFilterType, setIncomeFilterType] = useState("month"); // day, month, year
  const [plFilterType, setPlFilterType] = useState("month"); // day, month, year

  // Expense Logger form states
  const [expDate, setExpDate] = useState(getLocalDateStr());
  const [expCategory, setExpCategory] = useState("Fuel");
  const [expDescription, setExpDescription] = useState("");
  const [expAmount, setExpAmount] = useState("");

  // Sync DB on real-time storage events
  useEffect(() => {
    const handleDbUpdate = () => {
      setDb(getDb());
    };
    window.addEventListener("db-update", handleDbUpdate);
    return () => window.removeEventListener("db-update", handleDbUpdate);
  }, []);

  const thresholdLimit = db.settings.expenseApprovalLimit || 500000;

  // Permissions checks
  const canAddExpense = currentUser.role === "owner" || currentUser.role === "admin" || currentUser.permissions?.["accounting-payroll"]?.add;
  const canApproveExpense = currentUser.role === "owner" || currentUser.role === "admin" || currentUser.permissions?.["accounting-payroll"]?.approve;
  const canDeleteExpense = currentUser.role === "owner" || currentUser.role === "admin" || currentUser.permissions?.["accounting-payroll"]?.delete;

  // Retrieve responsible employees for accounting
  const accountingAssignees = (db.users || []).filter(u => u.responsibilities?.accounting);

  // Submit new expense handler
  const handleSaveExpense = (e) => {
    e.preventDefault();
    if (!expAmount || isNaN(expAmount) || parseFloat(expAmount) <= 0) {
      alert(lang === "en" ? "Please enter a valid amount" : "ກະລຸນາກອກຈຳນວນເງິນທີ່ຖືກຕ້ອງ");
      return;
    }
    if (!expDescription.trim()) {
      alert(lang === "en" ? "Please enter a description" : "ກະລຸນາກອກລາຍລະອຽດ");
      return;
    }

    const amountVal = parseFloat(expAmount);
    const isOwner = currentUser.role === "owner" || currentUser.role === "admin";
    // Owners auto-approve their entries. Others submit as pending.
    const initialStatus = isOwner ? "Approved" : "Pending Approval";

    addCustomExpense({
      date: expDate,
      category: expCategory,
      description: expDescription.trim(),
      amount: amountVal,
      status: initialStatus,
      addedBy: currentUser.name,
      approvedBy: isOwner ? currentUser.name : null,
      approvedAt: isOwner ? new Date().toISOString() : null
    });

    setExpDescription("");
    setExpAmount("");
    alert(isOwner ? (lang === "en" ? "Expense recorded and approved!" : "ບັນທຶກ ແລະ ອະນຸມັດລາຍຈ່າຍຮຽບຮ້ອຍແລ້ວ!") : (lang === "en" ? "Expense recorded! Sent to manager." : "ບັນທຶກລາຍຈ່າຍຮຽບຮ້ອຍ! ສົ່ງຄຳຂໍອະນຸມັດໄປຍັງຜູ້ຈັດການ"));
    window.dispatchEvent(new Event("db-update"));
  };

  // Delete expense handler
  const handleDeleteExpense = (id) => {
    if (!canDeleteExpense) {
      alert(lang === "en" ? "Permission denied to delete expenses" : "ທ່ານບໍ່ມີສິດໃນການລຶບລາຍຈ່າຍ");
      return;
    }
    if (confirm(lang === "en" ? "Are you sure you want to delete this expense?" : "ທ່ານຕ້ອງການລຶບລາຍຈ່າຍນີ້ແມ່ນບໍ່?")) {
      deleteCustomExpense(id);
      window.dispatchEvent(new Event("db-update"));
    }
  };

  // Approve expense handler
  const handleApproveExpense = (id, amount) => {
    if (!canApproveExpense) {
      alert(lang === "en" ? "Permission denied to approve expenses" : "ທ່ານບໍ່ມີສິດໃນການອະນຸມັດລາຍຈ່າຍ");
      return;
    }
    
    // Enforce Manager threshold limit
    const isOwner = currentUser.role === "owner" || currentUser.role === "admin";
    if (!isOwner && amount >= thresholdLimit) {
      alert(lang === "en" ? `Cannot approve: Amount ${formatLAK(amount)} LAK exceeds your limit (${formatLAK(thresholdLimit)} LAK). Only Owner can approve.` : `ບໍ່ສາມາດອະນຸມັດໄດ້: ຍອດເງິນ ${formatLAK(amount)} LAK ເກີນວົງເງິນຂອງທ່ານ (${formatLAK(thresholdLimit)} LAK). ຕ້ອງໃຫ້ Owner ເປັນຜູ້ອະນຸມັດ.`);
      return;
    }

    approveExpense(id, currentUser.name);
    alert(lang === "en" ? "Expense approved successfully!" : "ອະນຸມັດລາຍຈ່າຍຮຽບຮ້ອຍແລ້ວ!");
    window.dispatchEvent(new Event("db-update"));
  };

  // Reject expense handler
  const handleRejectExpense = (id) => {
    if (!canApproveExpense) {
      alert(lang === "en" ? "Permission denied" : "ທ່ານບໍ່ມີສິດອະນຸມັດ/ປະຕິເສດລາຍຈ່າຍ");
      return;
    }
    if (confirm(lang === "en" ? "Are you sure you want to reject this expense?" : "ທ່ານຕ້ອງການປະຕິເສດລາຍຈ່າຍນີ້ແມ່ນບໍ່?")) {
      rejectExpense(id);
      alert(lang === "en" ? "Expense request rejected." : "ປະຕິເສດຄຳຂໍຮຽບຮ້ອຍແລ້ວ");
      window.dispatchEvent(new Event("db-update"));
    }
  };

  // Calculations for INCOME tab
  const getIncomeDataForPeriod = (filterType, dateVal) => {
    let bookings = [];
    if (filterType === "day") {
      bookings = (db.bookings || []).filter(b => b.date === dateVal && b.status !== "ຍົກເລີກ");
    } else if (filterType === "month") {
      bookings = (db.bookings || []).filter(b => b.date && b.date.startsWith(dateVal) && b.status !== "ຍົກເລີກ");
    } else if (filterType === "year") {
      bookings = (db.bookings || []).filter(b => b.date && b.date.startsWith(dateVal) && b.status !== "ຍົກເລີກ");
    }

    let boatIncome = 0;
    let rappellingIncome = 0;
    let otherIncome = 0;

    bookings.forEach(b => {
      if (b.serviceId === "SRV-001" || b.serviceId === "SRV-002" || b.serviceId === "SRV-003") {
        boatIncome += b.pricePaidLAK;
      } else if (b.serviceId === "SRV-004") {
        rappellingIncome += b.pricePaidLAK;
      } else {
        otherIncome += b.pricePaidLAK;
      }
    });

    return { bookings, boatIncome, rappellingIncome, otherIncome, total: boatIncome + rappellingIncome + otherIncome };
  };

  // Calculations for EXPENSES tab and P&L
  const getExpensesDataForPeriod = (filterType, dateVal) => {
    // 1. Approved Custom Expenses
    const approvedCustom = (db.customExpenses || []).filter(exp => {
      if (!exp.date || exp.status !== "Approved") return false;
      if (filterType === "day") return exp.date === dateVal;
      return exp.date.startsWith(dateVal);
    });
    const totalCustom = approvedCustom.reduce((sum, exp) => sum + exp.amount, 0);

    // Categories mapping for manual custom expenses
    const categoryCustomTotals = {
      fuel: approvedCustom.filter(e => e.category === "Fuel").reduce((sum, e) => sum + e.amount, 0),
      staffMeals: approvedCustom.filter(e => e.category === "Staff Meals").reduce((sum, e) => sum + e.amount, 0),
      electricity: approvedCustom.filter(e => e.category === "Electricity").reduce((sum, e) => sum + e.amount, 0),
      water: approvedCustom.filter(e => e.category === "Water").reduce((sum, e) => sum + e.amount, 0),
      phoneInternet: approvedCustom.filter(e => e.category === "Phone/Internet").reduce((sum, e) => sum + e.amount, 0),
      vehicleRepair: approvedCustom.filter(e => e.category === "Vehicle Repair").reduce((sum, e) => sum + e.amount, 0),
      boatRepair: approvedCustom.filter(e => e.category === "Boat Repair").reduce((sum, e) => sum + e.amount, 0),
      equipmentRepair: approvedCustom.filter(e => e.category === "Equipment Repair").reduce((sum, e) => sum + e.amount, 0),
      marketing: approvedCustom.filter(e => e.category === "Marketing").reduce((sum, e) => sum + e.amount, 0),
      taxes: approvedCustom.filter(e => e.category === "Taxes").reduce((sum, e) => sum + e.amount, 0),
      duties: approvedCustom.filter(e => e.category === "Duties").reduce((sum, e) => sum + e.amount, 0),
      rent: approvedCustom.filter(e => e.category === "Rent").reduce((sum, e) => sum + e.amount, 0),
      misc: approvedCustom.filter(e => e.category === "Miscellaneous").reduce((sum, e) => sum + e.amount, 0),
    };

    // 2. Filtered Trips for fuel, maintenance, and crew allowances
    const periodTrips = (db.trips || []).filter(t => {
      if (!t.date || (t.status !== "completed" && t.status !== "dispatched")) return false;
      if (filterType === "day") return t.date === dateVal;
      return t.date.startsWith(dateVal);
    });
    
    const FUEL_RATE = 150000;
    const MAINT_RATE = 30000;
    const totalFuelCost = periodTrips.length * FUEL_RATE;
    const totalMaintCost = periodTrips.length * MAINT_RATE;

    // 3. Crew Trip Wages (aligned with PayrollManager.jsx formulas)
    let totalCrewTripWages = 0;
    let guideWages = 0;
    let captainWages = 0;
    let driverWages = 0;

    periodTrips.forEach(trip => {
      if (trip.guideIds) {
        trip.guideIds.forEach(gid => {
          const emp = db.employees.find(e => e.id === gid);
          if (emp) {
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
            }
            totalCrewTripWages += payout;
            guideWages += payout;
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
            const payout = emp.tripRate !== undefined ? emp.tripRate : 100000;
            totalCrewTripWages += payout;
            driverWages += payout;
          }
        });
      }
    });

    // 4. Base Salaries (Prorated for Daily, Full for Monthly, Yearly = Monthly * 12)
    const baseSalariesMonthlyTotal = db.employees.filter(e => e.type === "permanent").reduce((sum, e) => sum + e.salary, 0);
    let totalBaseSalaries = 0;
    if (filterType === "day") {
      totalBaseSalaries = baseSalariesMonthlyTotal / 30;
    } else if (filterType === "month") {
      totalBaseSalaries = baseSalariesMonthlyTotal;
    } else if (filterType === "year") {
      totalBaseSalaries = baseSalariesMonthlyTotal * 12;
    }

    // 5. Office Rent (Prorated for Daily, Full for Monthly, Yearly = Monthly * 12)
    const OFFICE_RENT_MONTHLY = 1200000;
    let officeRent = 0;
    if (filterType === "day") {
      officeRent = OFFICE_RENT_MONTHLY / 30;
    } else if (filterType === "month") {
      officeRent = OFFICE_RENT_MONTHLY;
    } else if (filterType === "year") {
      officeRent = OFFICE_RENT_MONTHLY * 12;
    }

    // 6. Agent Commissions
    let totalCommissions = 0;
    const periodCusts = (db.customers || []).filter(c => {
      if (!c.checkInDate) return false;
      if (filterType === "day") return c.checkInDate === dateVal;
      return c.checkInDate.startsWith(dateVal);
    });
    periodCusts.forEach(c => {
      if (c.partnerId) {
        const partner = db.partners.find(p => p.id === c.partnerId);
        if (partner) totalCommissions += partner.commissionRate;
      }
    });

    const total = totalCustom + totalFuelCost + totalMaintCost + totalCrewTripWages + totalBaseSalaries + officeRent + totalCommissions;

    return {
      approvedCustom,
      totalCustom,
      totalFuelCost,
      totalMaintCost,
      guideWages,
      captainWages,
      driverWages,
      totalCrewTripWages,
      totalBaseSalaries,
      officeRent,
      totalCommissions,
      total,
      categoryCustomTotals
    };
  };

  // Income summary variables (default to incomeFilterType date/month/year selector)
  const incomeDetails = getIncomeDataForPeriod(
    incomeFilterType,
    incomeFilterType === "day" ? selectedDate : (incomeFilterType === "month" ? selectedMonth : selectedYear)
  );

  // Expenses summary variables (for monthly statement printouts)
  const expenseDetails = getExpensesDataForPeriod("month", selectedMonth);

  // Profit & Loss period variables
  const plIncomeDetails = getIncomeDataForPeriod(
    plFilterType,
    plFilterType === "day" ? selectedDate : (plFilterType === "month" ? selectedMonth : selectedYear)
  );
  const plExpenseDetails = getExpensesDataForPeriod(
    plFilterType,
    plFilterType === "day" ? selectedDate : (plFilterType === "month" ? selectedMonth : selectedYear)
  );

  // Trigger Print Statement
  const handlePrintStatement = () => {
    flushSync(() => {
      setPrintTemplate("statement");
    });

    const handleAfterPrint = () => {
      setPrintTemplate(null);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
    window.addEventListener("afterprint", handleAfterPrint);

    setTimeout(() => {
      window.print();
    }, 150);

    setTimeout(() => {
      setPrintTemplate(null);
    }, 5000);
  };

  // Helper label CSS styles
  const inputStyle = {
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid var(--border-color)",
    background: "var(--bg-primary)",
    color: "var(--text-primary)",
    outline: "none",
    width: "100%",
    fontSize: "0.85rem"
  };

  const labelStyle = {
    fontSize: "0.75rem",
    fontWeight: "700",
    color: "var(--text-secondary)",
    marginBottom: "4px",
    display: "block"
  };

  const getAvailableSummaryMonths = () => {
    const months = new Set();
    
    // Add months from trips
    if (db.trips) {
      db.trips.forEach(t => {
        if (t.date) {
          months.add(t.date.substring(0, 7));
        }
      });
    }
    
    // Add months from customer checkins
    if (db.customers) {
      db.customers.forEach(c => {
        if (c.checkInDate) {
          months.add(c.checkInDate.substring(0, 7));
        }
      });
    }
    
    // Add current month in case DB is empty
    months.add(new Date().toISOString().substring(0, 7));
    
    // Sort descending (latest months first)
    return Array.from(months).sort().reverse();
  };

  const calculateMonthlySummaryData = (month) => {
    // 1. Employees calculations
    const employeeDetails = (db.employees || []).map(emp => {
      // Find matching trips for this employee in this month
      const monthlyTrips = (db.trips || []).filter(trip => {
        const isCompleted = trip.status === "completed" || trip.status === "dispatched";
        const matchesMonth = trip.date && trip.date.substring(0, 7) === month;
        if (!isCompleted || !matchesMonth) return false;

        const isGuide = trip.guideIds && trip.guideIds.includes(emp.id);
        const isCaptain = (trip.captainIds && trip.captainIds.includes(emp.id)) || (trip.captainId === emp.id);
        const isDriver = trip.driverIds && trip.driverIds.includes(emp.id);

        return isGuide || isCaptain || isDriver;
      });

      let tripPay = 0;
      monthlyTrips.forEach(trip => {
        const isGuide = trip.guideIds && trip.guideIds.includes(emp.id);
        const isCaptain = (trip.captainIds && trip.captainIds.includes(emp.id)) || (trip.captainId === emp.id);
        const isDriver = trip.driverIds && trip.driverIds.includes(emp.id);

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
        tripPay += payout;
      });

      const isFreelance = emp.type === "freelance";
      const baseSalary = isFreelance ? 0 : (emp.salary || 0);
      const dailyWagePay = (emp.dailyWage || 0) * (emp.daysWorked !== undefined ? emp.daysWorked : 26);
      const otherPay = (emp.bonus || 0) + (emp.commission || 0) + (emp.ot || 0);
      const totalPayout = baseSalary + dailyWagePay + tripPay + otherPay;

      return {
        ...emp,
        tripCount: monthlyTrips.length,
        tripPay,
        baseSalary,
        dailyWagePay,
        otherPay,
        totalPayout
      };
    });

    const totalEmployeePayout = employeeDetails.reduce((sum, emp) => sum + emp.totalPayout, 0);

    // 2. Agents calculations (Referrals)
    const agentDetails = (db.partners || []).map(partner => {
      // Find matching customers referred in this month
      const monthlyCustomers = (db.customers || []).filter(c => {
        const matchesPartner = c.partnerId === partner.id;
        const matchesMonth = c.checkInDate && c.checkInDate.substring(0, 7) === month;
        // Filter out cancelled bookings
        if (c.bookingId) {
          const bk = db.bookings.find(b => b.id === c.bookingId);
          if (bk && bk.status === "ยกเลิก") return false;
        }
        return matchesPartner && matchesMonth;
      });

      const paxCount = monthlyCustomers.length;
      const totalCommission = paxCount * (partner.commissionRate || 0);

      return {
        ...partner,
        paxCount,
        totalCommission
      };
    });

    const totalAgentCommissions = agentDetails.reduce((sum, partner) => sum + partner.totalCommission, 0);

    return {
      employeeDetails,
      totalEmployeePayout,
      agentDetails,
      totalAgentCommissions,
      grandTotal: totalEmployeePayout + totalAgentCommissions
    };
  };

  const triggerPrintMonthlySummary = () => {
    flushSync(() => {
      setPrintTemplate("summary");
    });

    const handleAfterPrint = () => {
      setPrintTemplate(null);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
    window.addEventListener("afterprint", handleAfterPrint);

    setTimeout(() => {
      window.print();
    }, 150);

    setTimeout(() => {
      setPrintTemplate(null);
    }, 5000);
  };

  return (
    <div className="fade-in">
      <div className="no-print">
        {/* Top Header */}
      <div className="page-header no-print" style={{ marginBottom: "1.5rem" }}>
        <div className="page-title">
          <h1>📊 ລະບົບບັນຊີ ແລະ ລາຍຈ່າຍ / Accounting & Expenses Portal</h1>
          <p>{t("accounting_sub", "ລວມລະບົບບັນທຶກລາຍຮັບ-ລາຍຈ່າຍ, ຈັດການເງິນເດືອນ ແລະ ການອະນຸມັດວົງເງິນ")}</p>
        </div>
      </div>

      {/* Task Assignee banner */}
      <div className="no-print" style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "20px", background: "rgba(15, 118, 110, 0.05)", border: "1px solid rgba(15, 118, 110, 0.15)", padding: "10px 14px", borderRadius: "10px" }}>
        <ShieldCheck size={18} color="#0f766e" />
        <span style={{ fontSize: "0.8rem", color: "#0f766e", fontWeight: "700" }}>
          🛡️ ຜູ້ຮັບຜິດຊອບງານບັນຊີ (Accounting Team):
        </span>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {accountingAssignees.length === 0 ? (
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>{t("unassigned", "ຍັງບໍ່ໄດ້ກຳນົດ / Unassigned")}</span>
          ) : (
            accountingAssignees.map(u => (
              <span key={u.id} style={{ background: "#0f766e", color: "#ffffff", padding: "2px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "600" }}>
                {u.name}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Sub tabs selector menu */}
      <div className="no-print" style={{ 
        display: "flex", 
        gap: "10px", 
        borderBottom: "1px solid var(--border-color)", 
        paddingBottom: "1px", 
        marginBottom: "1.5rem",
        overflowX: "auto",
        whiteSpace: "nowrap",
        flexShrink: 0,
        scrollbarWidth: "thin"
      }}>
        <button 
          onClick={() => setActiveTab("income")}
          style={{
            padding: "10px 16px",
            border: "none",
            background: "none",
            borderBottom: activeTab === "income" ? "3px solid var(--primary)" : "3px solid transparent",
            color: activeTab === "income" ? "var(--primary)" : "var(--text-muted)",
            fontWeight: "700",
            fontSize: "0.9rem",
            cursor: "pointer",
            flexShrink: 0
          }}
        >
          💰 {t("tab_income", "ລາຍຮັບ / Income")}
        </button>
        <button 
          onClick={() => setActiveTab("expenses")}
          style={{
            padding: "10px 16px",
            border: "none",
            background: "none",
            borderBottom: activeTab === "expenses" ? "3px solid var(--primary)" : "3px solid transparent",
            color: activeTab === "expenses" ? "var(--primary)" : "var(--text-muted)",
            fontWeight: "700",
            fontSize: "0.9rem",
            cursor: "pointer",
            flexShrink: 0
          }}
        >
          💸 {t("tab_expenses", "ລາຍຈ່າຍ / Expenses")}
        </button>
        <button 
          onClick={() => setActiveTab("pl")}
          style={{
            padding: "10px 16px",
            border: "none",
            background: "none",
            borderBottom: activeTab === "pl" ? "3px solid var(--primary)" : "3px solid transparent",
            color: activeTab === "pl" ? "var(--primary)" : "var(--text-muted)",
            fontWeight: "700",
            fontSize: "0.9rem",
            cursor: "pointer",
            flexShrink: 0
          }}
        >
          📈 {t("tab_pl", "ກຳໄລ-ຂາດທຶນ / Profit & Loss")}
        </button>
        <button 
          onClick={() => setActiveTab("reports")}
          style={{
            padding: "10px 16px",
            border: "none",
            background: "none",
            borderBottom: activeTab === "reports" ? "3px solid var(--primary)" : "3px solid transparent",
            color: activeTab === "reports" ? "var(--primary)" : "var(--text-muted)",
            fontWeight: "700",
            fontSize: "0.9rem",
            cursor: "pointer",
            flexShrink: 0
          }}
        >
          📊 {t("tab_reports", "ລາຍງານ / Reports")}
        </button>
        <button 
          onClick={() => setActiveTab("monthly_summary")}
          style={{
            padding: "10px 16px",
            border: "none",
            background: "none",
            borderBottom: activeTab === "monthly_summary" ? "3px solid var(--primary)" : "3px solid transparent",
            color: activeTab === "monthly_summary" ? "var(--primary)" : "var(--text-muted)",
            fontWeight: "700",
            fontSize: "0.9rem",
            cursor: "pointer",
            flexShrink: 0
          }}
        >
          📅 {t("tab_monthly_summary", "ສະຫຼຸບລາຍເດືອນ / Monthly Summary")}
        </button>
        <button 
          onClick={() => setActiveTab("payroll_manager")}
          style={{
            padding: "10px 16px",
            border: "none",
            background: "none",
            borderBottom: activeTab === "payroll_manager" ? "3px solid var(--primary)" : "3px solid transparent",
            color: activeTab === "payroll_manager" ? "var(--primary)" : "var(--text-muted)",
            fontWeight: "700",
            fontSize: "0.9rem",
            cursor: "pointer",
            flexShrink: 0
          }}
        >
          👥 {t("tab_payroll_manager", "ເງິນເດືອນພະນັກງານ / Staff & Payroll")}
        </button>
        <button 
          onClick={() => setActiveTab("commission_manager")}
          style={{
            padding: "10px 16px",
            border: "none",
            background: "none",
            borderBottom: activeTab === "commission_manager" ? "3px solid var(--primary)" : "3px solid transparent",
            color: activeTab === "commission_manager" ? "var(--primary)" : "var(--text-muted)",
            fontWeight: "700",
            fontSize: "0.9rem",
            cursor: "pointer",
            flexShrink: 0
          }}
        >
          🪙 {t("tab_commission_manager", "ຄ່າຄອມເອເຈນ / Agent Commissions")}
        </button>
      </div>

      {/* RENDER ACTIVE TAB CONTENT */}

      {/* --- TAB 1: INCOME --- */}
      {activeTab === "income" && (
        <div className="fade-in no-print">
          {/* Filters */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "1.5rem", background: "var(--bg-secondary)", padding: "12px 16px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <select 
                value={incomeFilterType}
                onChange={(e) => setIncomeFilterType(e.target.value)}
                style={{ ...inputStyle, width: "120px" }}
              >
                <option value="day">{t("daily", "ລາຍວັນ / Daily")}</option>
                <option value="month">{t("monthly", "ລາຍເດືອນ / Monthly")}</option>
                <option value="year">{t("yearly", "ລາຍປີ / Yearly")}</option>
              </select>

              {incomeFilterType === "day" && (
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ ...inputStyle, width: "160px" }} />
              )}
              {incomeFilterType === "month" && (
                <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ ...inputStyle, width: "160px" }} />
              )}
              {incomeFilterType === "year" && (
                <input type="number" min="2020" max="2100" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ ...inputStyle, width: "100px" }} />
              )}
            </div>

            <button className="btn btn-secondary" onClick={() => setActiveTab("commission_manager")} style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "4px" }}>
              <Coins size={16} /> {t("check_agent_commissions", "ກວດສອບຄ່າຄອມເອເຈນ / Agent Commissions")}
            </button>
          </div>

          {/* Metrics Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "15px", marginBottom: "1.5rem" }}>
            <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", background: "var(--bg-secondary)", borderLeft: "4px solid #0284c7" }}>
              <div>
                <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-secondary)" }}>{t("boat_income", "ລາຍຮັບລ່ອງເຮືອ / Boat Income")}</div>
                <strong style={{ fontSize: "1.2rem", color: "#0284c7", display: "block", marginTop: "4px" }}>{formatLAK(incomeDetails.boatIncome)} LAK</strong>
              </div>
            </div>
            <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", background: "var(--bg-secondary)", borderLeft: "4px solid #6366f1" }}>
              <div>
                <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-secondary)" }}>{t("rappelling_income", "ລາຍຮັບໂລ້ຍຕົວນ້ຳຕົກ / Waterfall Rappelling")}</div>
                <strong style={{ fontSize: "1.2rem", color: "#6366f1", display: "block", marginTop: "4px" }}>{formatLAK(incomeDetails.rappellingIncome)} LAK</strong>
              </div>
            </div>
            <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", background: "var(--bg-secondary)", borderLeft: "4px solid #f59e0b" }}>
              <div>
                <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-secondary)" }}>{t("other_income_card", "ລາຍຮັບກິດຈະກຳອື່ນ / Adventure Boat & Extras")}</div>
                <strong style={{ fontSize: "1.2rem", color: "#f59e0b", display: "block", marginTop: "4px" }}>{formatLAK(incomeDetails.otherIncome)} LAK</strong>
              </div>
            </div>
            <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", background: "var(--bg-secondary)", borderLeft: "4px solid #10b981" }}>
              <div>
                <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-secondary)" }}>ລາຍຮັບລວມທັງໝົດ / Total Period Revenue</div>
                <strong style={{ fontSize: "1.3rem", color: "#10b981", display: "block", marginTop: "4px" }}>{formatLAK(incomeDetails.total)} LAK</strong>
              </div>
            </div>
          </div>

          {/* Bookings Transactions List */}
          <div className="card">
            <h2 style={{ fontSize: "1.1rem", color: "var(--text-primary)", marginBottom: "1rem" }}>
              {t("received_transactions_title", "ລາຍການທຸລະກຳຮັບເງິນ / Received Sales Transactions Grid")} ({incomeDetails.bookings.length} {t("bills_unit", "ບິນ")})
            </h2>
            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>{t("date", "ວັນທີ / Date")}</th>
                    <th>ລະຫັດບິນ / Bill ID</th>
                    <th>{t("cust_name_header", "ຊື່ລູກຄ້າ / Customer Name")}</th>
                    <th>ຈຳນວນ / Pax</th>
                    <th>ປະເພດການບໍລິການ / Activity Service</th>
                    <th>ວິທີຊຳລະ / Method</th>
                    <th style={{ textAlign: "right" }}>ຍອດເງິນ / Paid LAK</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeDetails.bookings.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                        ບໍ່ມີລາຍການຮັບເງິນໃນໄລຍະເວລານີ້ / No sales transactions found.
                      </td>
                    </tr>
                  ) : (
                    incomeDetails.bookings.map(b => (
                      <tr key={b.id}>
                        <td>{b.date} {b.time}</td>
                        <td style={{ fontWeight: "700" }}>{b.billNumber || b.id}</td>
                        <td>{b.passengers && b.passengers[0] ? b.passengers[0].name : (b.partnerName || "Walk-In")}</td>
                        <td>{b.paxCount} {t("pax_unit", "ຄົນ")}</td>
                        <td>
                          {b.serviceId === "SRV-004" && "🧗 "}{b.serviceId === "SRV-005" && "🚤 "}{b.serviceName}
                        </td>
                        <td>
                          <span className={`badge ${b.paymentMethod === "bank" ? "badge-success" : "badge-warning"}`}>
                             {b.paymentMethod === "bank" ? "🏦 " + t("payment_bank", "ໂອນເງິນ / Transfer") : "💵 " + t("payment_cash", "ເງິນສົດ / Cash")}
                          </span>
                        </td>
                        <td style={{ textAlign: "right", fontWeight: "800", color: "var(--primary)" }}>
                          {formatLAK(b.pricePaidLAK)} LAK
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: EXPENSES --- */}
      {activeTab === "expenses" && (
        <div className="fade-in no-print">
          {/* Header Month filter */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "1.5rem", background: "var(--bg-secondary)", padding: "12px 16px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Calendar size={16} />
              <input 
                type="month" 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)} 
                style={{ ...inputStyle, width: "160px", border: "none", background: "none", color: "var(--text-primary)", fontWeight: "600" }}
              />
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn btn-secondary" onClick={() => setActiveTab("payroll_manager")} style={{ fontSize: "0.85rem" }}>
                👥 {t("run_payroll", "ຈັດການເງິນເດືອນ / Run Payroll")}
              </button>
              <button className="btn btn-primary" onClick={handlePrintStatement} style={{ fontSize: "0.85rem" }}>
                <Printer size={16} style={{ marginRight: "4px" }} /> {t("print_statement", "ພິມໃບລາຍຈ່າຍ / Print")}
              </button>
            </div>
          </div>

          {/* Pending Approval Section */}
          {canApproveExpense && (
            <div className="card" style={{ marginBottom: "1.5rem", border: "1.5px solid #f59e0b", background: "rgba(245, 158, 11, 0.02)" }}>
              <h2 style={{ fontSize: "1.1rem", color: "#d97706", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "6px" }}>
                <AlertTriangle size={20} color="#f59e0b" />
                {t("pending_approval", "ລາຍການລໍຖ້າການອະນຸມັດ / Pending Approval")}
              </h2>
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>{t("date", "ວັນທີ / Date")}</th>
                      <th>{t("category", "ໝວດໝູ່ / Category")}</th>
                      <th>ຄຳອະທિບາຍ / Description</th>
                      <th>ຜູ້ບັນທຶກ / Entered By</th>
                      <th style={{ textAlign: "right" }}>{t("amount_title", "ຍອດເງິນ / Amount")}</th>
                      <th style={{ textAlign: "center" }}>ຈັດການ / Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {db.customExpenses && db.customExpenses.filter(e => e.status === "Pending Approval").length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                          {t("no_pending_expenses", "ບໍ່ມີລາຍການລາຍຈ່າຍລໍຖ້າອະນຸມັດ / No pending expenses.")}
                        </td>
                      </tr>
                    ) : (
                      db.customExpenses.filter(e => e.status === "Pending Approval").map(exp => (
                        <tr key={exp.id}>
                          <td>{exp.date}</td>
                          <td><span className="badge badge-warning">{exp.category}</span></td>
                          <td>{exp.description}</td>
                          <td>{exp.addedBy || "Unknown Staff"}</td>
                          <td style={{ textAlign: "right", fontWeight: "bold", color: "var(--danger)" }}>
                            {formatLAK(exp.amount)} LAK
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                              <button 
                                className="btn btn-success" 
                                style={{ padding: "4px 10px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "2px" }}
                                onClick={() => handleApproveExpense(exp.id, exp.amount)}
                              >
                                <CheckCircle2 size={12} /> {t("approve_btn", "ອະນຸມັດ / Approve")}
                              </button>
                              <button 
                                className="btn btn-danger" 
                                style={{ padding: "4px 10px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "2px" }}
                                onClick={() => handleRejectExpense(exp.id)}
                              >
                                <XCircle size={12} /> {t("reject_btn", "ປະຕິເສດ / Reject")}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Form and list grid */}
          <div className="dashboard-sections-grid" style={{ marginBottom: "1.5rem" }}>
            
            {/* Form logger */}
            <div className="card">
              <h2 style={{ fontSize: "1.1rem", color: "var(--text-primary)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "5px" }}>
                <Plus size={18} color="var(--primary)" />
                ບັນທຶກລາຍຈ່າຍໃໝ່ / Record Operating Expense
              </h2>
              {canAddExpense ? (
                <form onSubmit={handleSaveExpense} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={labelStyle}>{t("date", "ວັນທີ / Date")}</label>
                      <input type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} style={inputStyle} required />
                    </div>
                    <div>
                      <label style={labelStyle}>{t("category", "ໝວດໝູ່ / Category")}</label>
                      <select value={expCategory} onChange={(e) => setExpCategory(e.target.value)} style={inputStyle}>
                        <option value="Utilities">Utilities (ຄ່ານ້ຳ/ໄຟ/ເນັດ)</option>
                        <option value="Supplies">Supplies (ຊື້ເຄື່ອງໃຊ້/ເຄື່ອງດື່ມ)</option>
                        <option value="Boat Repair">Boat Repair (ຄ່າຊ່おມເຮືອ)</option>
                        <option value="Marketing">Marketing (ການຕະຫຼາດ)</option>
                        <option value="Office Rent">Office Rent (ຄ່າເຊົ່າ)</option>
                        <option value="Food & Drinks">Food & Drinks (ອາຫານ/ເຄື່ອງດື່ມ)</option>
                        <option value="Extra Fuel">Extra Fuel (ນ້ຳມັນເສີມ)</option>
                        <option value="Miscellaneous">Miscellaneous (ອື່ນໆ)</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "10px" }}>
                    <div>
                      <label style={labelStyle}>ຍອດເງິນ / Amount (LAK)</label>
                      <input type="number" placeholder="250,000 LAK" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} style={inputStyle} required />
                    </div>
                    <div>
                      <label style={labelStyle}>ຄຳອະທິບາຍ / Description</label>
                      <input type="text" placeholder={t("exp_placeholder", "ຊື້ອາຫານສຳລັບຕ້ອນຮັບລູກຄ້າ / e.g. Buy food for reception")} value={expDescription} onChange={(e) => setExpDescription(e.target.value)} style={inputStyle} required />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ padding: "10px 24px", alignSelf: "flex-end", marginTop: "6px" }}>
                    {t("save_expense", "ບັນທຶກລາຍຈ່າຍ")}
                  </button>
                </form>
              ) : (
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", background: "var(--bg-secondary)", borderRadius: "8px" }}>
                  {t("no_permission_expense", "ທ່ານບໍ່ຍีສິດໃນການບັນທຶກລາຍຈ່າຍ / Permission Denied")}
                </div>
              )}
            </div>

            {/* Approved manual list */}
            <div className="card">
              <h2 style={{ fontSize: "1.1rem", color: "var(--text-primary)", marginBottom: "1rem" }}>
                ລາຍການລາຍຈ່າຍອື່ນໆ / General Expenses Statement List
              </h2>
              <div style={{ maxHeight: "250px", overflowY: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>ວັນທີ</th>
                      <th>ໝວດໝູ່</th>
                      <th>ຄຳອະທິບາຍ</th>
                      <th style={{ textAlign: "right" }}>Amount</th>
                      <th style={{ textAlign: "center" }}>ລຶບ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseDetails.approvedCustom.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: "center", padding: "1rem", color: "var(--text-muted)" }}>
                          {t("no_records", "ບໍ່ມີຂໍ້ມູນ.")}
                        </td>
                      </tr>
                    ) : (
                      expenseDetails.approvedCustom.map(exp => (
                        <tr key={exp.id}>
                          <td>{exp.date}</td>
                          <td><span className="badge badge-warning">{exp.category}</span></td>
                          <td>{exp.description}</td>
                          <td style={{ textAlign: "right", fontWeight: "bold", color: "var(--danger)" }}>
                            -{formatLAK(exp.amount)}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: "4px 8px", color: "var(--danger)" }}
                              onClick={() => handleDeleteExpense(exp.id)}
                              disabled={!canDeleteExpense}
                            >
                              <Trash2 size={12} />
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

          {/* Operational Statement table */}
          <div className="card">
            <h2 style={{ fontSize: "1.1rem", color: "var(--text-primary)", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FileText size={18} color="var(--primary)" />
              ສະຫຼຸບລາຍຈ່າຍດຳເນີນງານທັງໝົດ / Total Operational Expenses Statement
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
                  <td>{t("base_salaries_desc", "ເງິນເດືອນພະນັກງານປະຈຳທັງໝົດໃນລະບົບ")}</td>
                  <td style={{ textAlign: "right", fontWeight: "bold" }}>-{formatLAK(expenseDetails.totalBaseSalaries)}</td>
                </tr>
                <tr>
                  <td>{t("guide_wages_label", "ຄ່າທ່ຽວໄກ້ດລວມ / Guide Allowances")}</td>
                  <td>{t("guide_wages_desc", "ຄ່າ allowance ໄກ້ດນຳທ່ຽວອອກເຮືອ")}</td>
                  <td style={{ textAlign: "right" }}>-{formatLAK(expenseDetails.guideWages)}</td>
                </tr>
                <tr>
                  <td>{t("captain_wages_label", "ຄ່າທ່ຽວກັບຕັນລວມ / Captain Allowances")}</td>
                  <td>{t("captain_wages_desc", "ຄ່າ allowance ກັບຕັນເຮືອນຳທ່ຽວ")}</td>
                  <td style={{ textAlign: "right" }}>-{formatLAK(expenseDetails.captainWages)}</td>
                </tr>
                <tr>
                  <td>{t("driver_wages_label", "ຄ່າທ່ຽວຄົນຂັບລົດລວມ / Driver Allowances")}</td>
                  <td>{t("driver_wages_desc", "ຄ່າ allowance ຄົນຂັບລົດຮັບສົ່ງ")}</td>
                  <td style={{ textAlign: "right" }}>-{formatLAK(expenseDetails.driverWages)}</td>
                </tr>
                <tr>
                  <td><strong>{t("fuel_expenses_label", "ຄ່ານ້ຳມັນເຊື້ອໄຟ / Fuel Expenses")}</strong></td>
                  <td>{t("fuel_expenses_desc", "ຄ່ານ້ຳມັນລົດ/ເຮືອ ຕາມຈຳນວນຮອບ")}</td>
                  <td style={{ textAlign: "right", fontWeight: "bold" }}>-{formatLAK(expenseDetails.totalFuelCost)}</td>
                </tr>
                <tr>
                  <td>{t("maint_expenses_label", "ຄ່າບຳລຸງຮັກສາ / Wear & Tear Expenses")}</td>
                  <td>{t("maint_expenses_desc", "ຄ່າຊ່ອມແຊມ/ບຳລຸງຮັກສາລົດ-ເຮືອ")}</td>
                  <td style={{ textAlign: "right" }}>-{formatLAK(expenseDetails.totalMaintCost)}</td>
                </tr>
                <tr>
                  <td>{t("rent_expenses_label", "ຄ່າເຊົ່າຫ້ອງການ / Office Rent")}</td>
                  <td>{t("rent_expenses_desc", "ຄ່າເຊົ່າຫ້ອງการປະຈຳເດືອນ")}</td>
                  <td style={{ textAlign: "right" }}>-{formatLAK(expenseDetails.officeRent)}</td>
                </tr>
                <tr>
                  <td>{t("commissions_expenses_label", "ຄ່າຄອມມິດຊັນເອເຈນ / Agent Commissions")}</td>
                  <td>{t("commissions_expenses_desc", "ສ່ວນແບ່ງຄອມມິດຊັນ referrals")}</td>
                  <td style={{ textAlign: "right" }}>-{formatLAK(expenseDetails.totalCommissions)}</td>
                </tr>
                <tr>
                  <td><strong>{t("general_expenses_label", "ຄ່າໃຊ້ຈ່າຍທົ່ວໄປ / General Approved Expenses")}</strong></td>
                  <td>{t("general_expenses_desc", "ຄ່ານ້ຳ, ຄ່າໄຟ ແລະ ຄ່າໃຊ້ຈ່າຍອື່ນໆ")}</td>
                  <td style={{ textAlign: "right", fontWeight: "bold" }}>-{formatLAK(expenseDetails.totalCustom)}</td>
                </tr>
                <tr style={{ background: "var(--bg-tertiary)", fontWeight: "bold", fontSize: "1.05rem" }}>
                  <td>{t("total_operating_expenses", "ລວມລາຍຈ່າຍທັງໝົດ / Total Approved Expenses")}</td>
                  <td>{t("total_operating_desc", "ລາຍຈ່າຍທັງໝົດທີ່ໄດ້ຮັບການອະນຸມັດ")}</td>
                  <td style={{ textAlign: "right", color: "var(--danger)" }}>-{formatLAK(expenseDetails.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 3: PROFIT & LOSS --- */}
      {activeTab === "pl" && (
        <div className="fade-in no-print">
          {/* Day/Month/Year selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.5rem", background: "var(--bg-secondary)", padding: "12px 16px", borderRadius: "10px", border: "1px solid var(--border-color)", width: "fit-content" }}>
            <Calendar size={16} />
            <select 
              value={plFilterType}
              onChange={(e) => setPlFilterType(e.target.value)}
              style={{ ...inputStyle, width: "120px" }}
            >
              <option value="day">{t("daily", "ລາຍວັນ / Daily")}</option>
              <option value="month">{t("monthly", "ລາຍເດືອນ / Monthly")}</option>
              <option value="year">{t("yearly", "ລາຍປີ / Yearly")}</option>
            </select>

            {plFilterType === "day" && (
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ ...inputStyle, width: "160px" }} />
            )}
            {plFilterType === "month" && (
              <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ ...inputStyle, width: "160px" }} />
            )}
            {plFilterType === "year" && (
              <input type="number" min="2020" max="2100" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ ...inputStyle, width: "100px" }} />
            )}
          </div>

          {/* Cards metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "2rem" }}>
            <div className="card" style={{ padding: "2rem", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-secondary)", borderBottom: "4px solid #10b981" }}>
              <div>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: "600" }}>{t("total_income", "ລາຍຮັບລວມ / Total Income")}</span>
                <strong style={{ fontSize: "1.8rem", color: "#10b981", display: "block", marginTop: "8px" }}>+{formatLAK(plIncomeDetails.total)} LAK</strong>
              </div>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(16, 185, 129, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981" }}>
                <ArrowUpRight size={24} />
              </div>
            </div>
            <div className="card" style={{ padding: "2rem", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-secondary)", borderBottom: "4px solid #ef4444" }}>
              <div>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: "600" }}>{t("total_expenses_label", "ລາຍຈ່າຍລວມ / Total Expenses")}</span>
                <strong style={{ fontSize: "1.8rem", color: "#ef4444", display: "block", marginTop: "8px" }}>-{formatLAK(plExpenseDetails.total)} LAK</strong>
              </div>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(239, 68, 68, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444" }}>
                <ArrowDownRight size={24} />
              </div>
            </div>
            {/* Net profit card */}
            <div className="card" style={{ 
              padding: "2rem", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between", 
              background: "var(--bg-secondary)", 
              borderBottom: (plIncomeDetails.total - plExpenseDetails.total) >= 0 ? "4px solid #0f766e" : "4px solid #d97706" 
            }}>
              <div>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: "600" }}>{t("net_profit", "ກຳໄລສຸດທິ / Net Profit")}</span>
                <strong style={{ fontSize: "1.8rem", color: (plIncomeDetails.total - plExpenseDetails.total) >= 0 ? "#0f766e" : "#d97706", display: "block", marginTop: "8px" }}>
                  {formatLAK(plIncomeDetails.total - plExpenseDetails.total)} LAK
                </strong>
              </div>
              <div style={{ 
                width: "48px", 
                height: "48px", 
                borderRadius: "50%", 
                background: (plIncomeDetails.total - plExpenseDetails.total) >= 0 ? "rgba(15, 118, 110, 0.1)" : "rgba(217, 119, 6, 0.1)", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                color: (plIncomeDetails.total - plExpenseDetails.total) >= 0 ? "#0f766e" : "#d97706" 
              }}>
                <DollarSign size={24} />
              </div>
            </div>
          </div>

          {/* Ledger block */}
          <div className="card">
            <h2 style={{ fontSize: "1.1rem", marginBottom: "1.25rem", color: "var(--text-primary)" }}>
              {t("pl_ledger_title", "ສະໝຸດບັນຊີກຳໄລ-ຂາດທຶນປະຈຳເດືອນ / Monthly Profit & Loss Statement Ledger")}
            </h2>
            <table>
              <thead>
                <tr style={{ background: "var(--bg-tertiary)" }}>
                  <th>{t("transaction_type_header", "ປະເພດລາຍການ / Item Type")}</th>
                  <th>{t("calc_details_header", "ລາຍລະອຽດການຄຳນວນ / Calculation Details")}</th>
                  <th style={{ textAlign: "right" }}>{t("revenue_header", "ລາຍຮັບ (LAK) / Revenue")}</th>
                  <th style={{ textAlign: "right" }}>{t("expense_header", "ລາຍຈ່າຍ (LAK) / Expenses")}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>{t("boat_income_label", "ລາຍຮັບລ່ອງເຮືອທ່ອງທ່ຽວ / Boat Income")}</strong></td>
                  <td>{t("boat_income_desc", "ປີ້ຜູ້ໃຫຍ່, ເດັກນ້ອຍ ແລະ ຄ່າບໍລິການເຮືອນຳທ່ຽວທັງໝົດ / All ticket sales and boat services")}</td>
                  <td style={{ textAlign: "right", color: "var(--primary)", fontWeight: "bold" }}>+{formatLAK(plIncomeDetails.boatIncome)}</td>
                  <td style={{ textAlign: "right" }}>0</td>
                </tr>
                <tr>
                  <td><strong>{t("rappelling_income_label", "ລາຍຮັບກິດຈະກຳໂລ້ຍຕົວ / Waterfall Rappelling Income")}</strong></td>
                  <td>{t("rappelling_income_desc", "ລາຍຮັບໂລ້ຍຕົວນ້ຳຕົກ / Waterfall Rappelling Revenue")}</td>
                  <td style={{ textAlign: "right", color: "var(--primary)", fontWeight: "bold" }}>+{formatLAK(plIncomeDetails.rappellingIncome)}</td>
                  <td style={{ textAlign: "right" }}>0</td>
                </tr>
                <tr>
                  <td><strong>{t("other_activities_income_label", "ລາຍຮັບກິດຈະກຳຜະຈົນໄພອື່ນ / Other Activities")}</strong></td>
                  <td>{t("other_activities_desc", "ເຮືອຜະຈົນໄພ ແລະ ລາຍການເສີມອື່ນໆ / Adventure Boat & Extras")}</td>
                  <td style={{ textAlign: "right", color: "var(--primary)", fontWeight: "bold" }}>+{formatLAK(plIncomeDetails.otherIncome)}</td>
                  <td style={{ textAlign: "right" }}>0</td>
                </tr>
                <tr>
                  <td>{t("salaries_label", "ເງินເດືອນພະນັກງານ / Staff Salaries")}</td>
                  <td>{t("salaries_desc", "ພະນັກງານປະຈຳຫ້ອງການ ແລະ ສ່ວນກາງ / Permanent office staff")}</td>
                  <td style={{ textAlign: "right" }}>0</td>
                  <td style={{ textAlign: "right", color: "var(--danger)" }}>-{formatLAK(plExpenseDetails.totalBaseSalaries)}</td>
                </tr>
                <tr>
                  <td>{t("fuel_maint_label", "ຄ່ານ້ຳມັນ & ຄ່າບຳລຸງເຮືອ / Fuel & Maint")}</td>
                  <td>{t("fuel_maint_desc", "ຄ່ານ້ຳມັນເຊື້ອໄຟ ແລະ ຄ່າເສື່ອມສະພາບຈາກຈຳນວນຮອບເຮືອແລ່ນ / Boat fuel & wear per trip")}</td>
                  <td style={{ textAlign: "right" }}>0</td>
                  <td style={{ textAlign: "right", color: "var(--danger)" }}>-{formatLAK(plExpenseDetails.totalFuelCost + plExpenseDetails.totalMaintCost)}</td>
                </tr>
                <tr>
                  <td>{t("crew_wages_label", "ຄ່າ allowance ຄົນຂັບ ແລະ ໄກ້ດ / Crew Trip Allowances")}</td>
                  <td>{t("crew_wages_desc", "ຄ່າທ່ຽວຂອງໄກ້ດ, ກັບຕັນ ແລະ ຄົນຂັບລົດປະຈຳຮອບ / Trip wages for crew")}</td>
                  <td style={{ textAlign: "right" }}>0</td>
                  <td style={{ textAlign: "right", color: "var(--danger)" }}>-{formatLAK(plExpenseDetails.totalCrewTripWages)}</td>
                </tr>
                <tr>
                  <td>{t("rent_commissions_label", "ຄ່າเชົ່າ & ຄ່າຄອມມິດຊັນເອເຈນ / Rent & Commissions")}</td>
                  <td>{t("rent_commissions_desc", "ຄ່າເຊົ່າຫ້ອງການປະຈຳເດືອນ ແລະ ສ່ວນແບ່ງເອເຈນ / Rent and agent commissions")}</td>
                  <td style={{ textAlign: "right" }}>0</td>
                  <td style={{ textAlign: "right", color: "var(--danger)" }}>-{formatLAK(plExpenseDetails.officeRent + plExpenseDetails.totalCommissions)}</td>
                </tr>
                <tr>
                  <td>{t("general_expenses_label", "ຄ່າໃຊ້ຈ่ายທົ່ວໄປອື່ນໆ / General Custom Expenses")}</td>
                  <td>{t("general_expenses_desc", "ຄ່ານ້ຳ, ຄ່າໄຟ, ອຸປະກອນເບັດເຕັລດ (ສະເພາະທີ່ອະນຸມັດແລ້ວ) / Utilities & office supplies")}</td>
                  <td style={{ textAlign: "right" }}>0</td>
                  <td style={{ textAlign: "right", color: "var(--danger)" }}>-{formatLAK(plExpenseDetails.totalCustom)}</td>
                </tr>
                <tr style={{ background: "var(--bg-tertiary)", fontWeight: "bold", fontSize: "1.05rem" }}>
                  <td>{t("summary_totals_label", "ຍອດລວມສຸດທິ / Summary Totals")}</td>
                  <td>{t("summary_totals_desc", "ກຳໄລສຸດທິຄິດຈາກ (ລາຍຮັບລວມ - ລາຍຈ່າຍທີ່ອະນຸມັດແล້ວ) / Net profit statement")}</td>
                  <td style={{ textAlign: "right", color: "var(--primary)" }}>+{formatLAK(plIncomeDetails.total)}</td>
                  <td style={{ textAlign: "right", color: "var(--danger)" }}>-{formatLAK(plExpenseDetails.total)}</td>
                </tr>
                <tr style={{ background: "rgba(15, 118, 110, 0.08)", fontWeight: "bold", fontSize: "1.1rem" }}>
                  <td colSpan="2"><strong>{t("net_profit_statement", "ກຳໄລສຸດທິ / Net Statement Profit")}</strong></td>
                  <td colSpan="2" style={{ textAlign: "right", color: (plIncomeDetails.total - plExpenseDetails.total) >= 0 ? "#0f766e" : "#d97706" }}>
                    {formatLAK(plIncomeDetails.total - plExpenseDetails.total)} LAK
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 4: REPORTS --- */}
      {activeTab === "reports" && (
        <div className="fade-in">
          <Reports />
        </div>
      )}

      {/* --- TAB 5: MONTHLY SUMMARY --- */}
      {activeTab === "monthly_summary" && (() => {
        const months = getAvailableSummaryMonths();
        const data = calculateMonthlySummaryData(summaryMonth);

        return (
          <div className="fade-in no-print">
            {/* Filters and Print Button */}
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              gap: "10px", 
              marginBottom: "1.5rem", 
              background: "var(--bg-secondary)", 
              padding: "12px 16px", 
              borderRadius: "10px", 
              border: "1px solid var(--border-color)",
              flexWrap: "wrap"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--text-primary)" }}>
                  📅 {t("select_month_label", "ເລືອກເດືອນ / Select Month")}:
                </label>
                <select
                  value={summaryMonth}
                  onChange={(e) => setSummaryMonth(e.target.value)}
                  style={{ ...inputStyle, width: "180px", cursor: "pointer" }}
                >
                  {months.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <button 
                className="btn btn-primary" 
                onClick={triggerPrintMonthlySummary} 
                style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}
              >
                <Printer size={16} /> {t("print_monthly_summary", "ພິມສະຫຼຸບປະຈຳເດືອນ / Print")}
              </button>
            </div>

            {/* Metrics cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "15px", marginBottom: "1.5rem" }}>
              <div className="card" style={{ padding: "16px", background: "var(--bg-secondary)", borderLeft: "4px solid #ef4444" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-secondary)" }}>
                  💵 {t("total_employee_payout", "ລວມຈ່າຍພະນັກງານທັງໝົດ / Total Employee Payout")}
                </div>
                <strong style={{ fontSize: "1.3rem", color: "#ef4444", display: "block", marginTop: "4px" }}>
                  {formatLAK(data.totalEmployeePayout)} LAK
                </strong>
              </div>
              <div className="card" style={{ padding: "16px", background: "var(--bg-secondary)", borderLeft: "4px solid #f59e0b" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-secondary)" }}>
                  🪙 {t("total_agent_commissions", "ລວມຄ່າຄອມເອເຈນທັງໝົດ / Total Agent Commissions")}
                </div>
                <strong style={{ fontSize: "1.3rem", color: "#f59e0b", display: "block", marginTop: "4px" }}>
                  {formatLAK(data.totalAgentCommissions)} LAK
                </strong>
              </div>
              <div className="card" style={{ padding: "16px", background: "var(--bg-secondary)", borderLeft: "4px solid #10b981" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-secondary)" }}>
                  💼 {t("monthly_grand_total", "ລວມລາຍຈ່າຍທັງໝົດປະຈຳເດືອນ / Monthly Grand Total")}
                </div>
                <strong style={{ fontSize: "1.4rem", color: "#10b981", display: "block", marginTop: "4px" }}>
                  {formatLAK(data.grandTotal)} LAK
                </strong>
              </div>
            </div>

            {/* Employee Earnings Table */}
            <div className="card" style={{ marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.1rem", color: "var(--text-primary)", marginBottom: "1rem" }}>
                👥 {t("employee_earnings_section", "ລາຍຮັບພະນັກງານປະຈຳເດືອນ / Employee Monthly Earnings")}
              </h2>
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>{t("employee_name_header", "ຊື່ພະນັກງານ / Employee Name")}</th>
                      <th>{t("role", "ບົດບາດ / Role")}</th>
                      <th>{t("type", "ປະເພດ / Type")}</th>
                      <th style={{ textAlign: "right" }}>{t("base_salary_col", "ເງິນເດືອນ / Base Salary")}</th>
                      <th style={{ textAlign: "center" }}>{t("days_worked_col", "ວັນເຮັດວຽກ / Days")}</th>
                      <th style={{ textAlign: "right" }}>{t("daily_wages_col", "ຄ່າແຮງລາຍວັນ / Daily Wage")}</th>
                      <th style={{ textAlign: "center" }}>{t("trips", "ຈຳນວນທ່ຽວ / Trips")}</th>
                      <th style={{ textAlign: "right" }}>{t("trip_wages_col", "ຄ່າທ່ຽວ / Trip wages")}</th>
                      <th style={{ textAlign: "right" }}>{t("bonus_ot_comm_col", "ໂບນັດ/OT/ຄອມ / Other Pay")}</th>
                      <th style={{ textAlign: "right" }}>{t("total_earnings_col", "ລາຍຮັບທັງໝົດ / Total")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.employeeDetails.length === 0 ? (
                      <tr>
                        <td colSpan="10" style={{ textAlign: "center", color: "var(--text-muted)" }}>
                          No employee payroll records.
                        </td>
                      </tr>
                    ) : (
                      data.employeeDetails.map(emp => (
                        <tr key={emp.id}>
                          <td style={{ fontWeight: "700" }}>{emp.name}</td>
                          <td>
                            <span className="badge badge-secondary">
                              {emp.role === "guide" ? "🧭 Guide" : emp.role === "captain" ? "⚓ Captain" : emp.role === "driver" ? "🚗 Driver" : emp.role}
                            </span>
                          </td>
                          <td>{emp.type === "permanent" ? "💼 Staff" : "⏳ Temporary"}</td>
                          <td style={{ textAlign: "right" }}>{formatLAK(emp.baseSalary)}</td>
                          <td style={{ textAlign: "center" }}>{emp.daysWorked || 0}</td>
                          <td style={{ textAlign: "right" }}>{formatLAK(emp.dailyWagePay)}</td>
                          <td style={{ textAlign: "center", fontWeight: "700" }}>{emp.tripCount}</td>
                          <td style={{ textAlign: "right" }}>{formatLAK(emp.tripPay)}</td>
                          <td style={{ textAlign: "right" }}>{formatLAK(emp.otherPay)}</td>
                          <td style={{ textAlign: "right", fontWeight: "800", color: "var(--primary)" }}>
                            {formatLAK(emp.totalPayout)} LAK
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Agent Commissions Table */}
            <div className="card">
              <h2 style={{ fontSize: "1.1rem", color: "var(--text-primary)", marginBottom: "1rem" }}>
                🪙 {t("agent_commissions_section", "ຄ່າຄອมມິດຊັນເອເຈນປະຈຳເດືອນ / Agent Referral Commissions")}
              </h2>
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>{t("partner_name", "ຊື່ອີເຈນ / Partner Name")}</th>
                      <th>{t("partner_type", "ປະເພດ / Type")}</th>
                      <th style={{ textAlign: "right" }}>{t("commission_rate", "ເລດຄ່າຄອມ / Rate")}</th>
                      <th style={{ textAlign: "center" }}>{t("referred_pax", "ຈຳນວນຄົນ / Pax")}</th>
                      <th style={{ textAlign: "right" }}>{t("total_commission", "ยອດເງິນຄອມ / Total Commission")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.agentDetails.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: "center", color: "var(--text-muted)" }}>
                          No agent referral records.
                        </td>
                      </tr>
                    ) : (
                      data.agentDetails.map(partner => (
                        <tr key={partner.id}>
                          <td style={{ fontWeight: "700" }}>{partner.name}</td>
                          <td>
                            <span className="badge badge-primary">
                              {partner.type === "agent" ? "💼 Agent" : partner.type === "company" ? "🏢 Company" : "🧭 Guide"}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>{formatLAK(partner.commissionRate)} / pax</td>
                          <td style={{ textAlign: "center", fontWeight: "700" }}>{partner.paxCount}</td>
                          <td style={{ textAlign: "right", fontWeight: "800", color: "var(--secondary)" }}>
                            {formatLAK(partner.totalCommission)} LAK
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* --- TAB 6: STAFF PAYROLL MANAGER --- */}
      {activeTab === "payroll_manager" && (
        <div className="fade-in no-print">
          <PayrollManager />
        </div>
      )}

      {/* --- TAB 7: COMMISSION TRACKER --- */}
      {activeTab === "commission_manager" && (
        <div className="fade-in no-print">
          <CommissionTracker />
        </div>
      )}

      {/* --- TAB 5: MONTHLY SUMMARY --- */}
      {activeTab === "monthly_summary" && (() => {
        const months = getAvailableSummaryMonths();
        const data = calculateMonthlySummaryData(summaryMonth);

        return (
          <div className="fade-in no-print">
            {/* Filters and Print Button */}
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              gap: "10px", 
              marginBottom: "1.5rem", 
              background: "var(--bg-secondary)", 
              padding: "12px 16px", 
              borderRadius: "10px", 
              border: "1px solid var(--border-color)",
              flexWrap: "wrap"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--text-primary)" }}>
                  📅 {t("select_month_label", "ເລືອກເດືອນ / Select Month")}:
                </label>
                <select
                  value={summaryMonth}
                  onChange={(e) => setSummaryMonth(e.target.value)}
                  style={{ ...inputStyle, width: "180px", cursor: "pointer" }}
                >
                  {months.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <button 
                className="btn btn-primary" 
                onClick={triggerPrintMonthlySummary} 
                style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}
              >
                <Printer size={16} /> {t("print_monthly_summary", "ພິມສະຫຼຸບປະຈຳເດືອນ / Print")}
              </button>
            </div>

            {/* Metrics cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "15px", marginBottom: "1.5rem" }}>
              <div className="card" style={{ padding: "16px", background: "var(--bg-secondary)", borderLeft: "4px solid #ef4444" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-secondary)" }}>
                  💵 {t("total_employee_payout", "ລວມຈ່າຍພະນັກງານທັງໝົດ / Total Employee Payout")}
                </div>
                <strong style={{ fontSize: "1.3rem", color: "#ef4444", display: "block", marginTop: "4px" }}>
                  {formatLAK(data.totalEmployeePayout)} LAK
                </strong>
              </div>
              <div className="card" style={{ padding: "16px", background: "var(--bg-secondary)", borderLeft: "4px solid #f59e0b" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-secondary)" }}>
                  🪙 {t("total_agent_commissions", "ລວມຄ່າຄອມເອເຈນທັງໝົດ / Total Agent Commissions")}
                </div>
                <strong style={{ fontSize: "1.3rem", color: "#f59e0b", display: "block", marginTop: "4px" }}>
                  {formatLAK(data.totalAgentCommissions)} LAK
                </strong>
              </div>
              <div className="card" style={{ padding: "16px", background: "var(--bg-secondary)", borderLeft: "4px solid #10b981" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-secondary)" }}>
                  💼 {t("monthly_grand_total", "ລວມລາຍຈ່າຍທັງໝົດປະຈຳເດືອນ / Monthly Grand Total")}
                </div>
                <strong style={{ fontSize: "1.4rem", color: "#10b981", display: "block", marginTop: "4px" }}>
                  {formatLAK(data.grandTotal)} LAK
                </strong>
              </div>
            </div>

            {/* Employee Earnings Table */}
            <div className="card" style={{ marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.1rem", color: "var(--text-primary)", marginBottom: "1rem" }}>
                👥 {t("employee_earnings_section", "ລາຍຮັບພະນັກງານປະຈຳເດືອນ / Employee Monthly Earnings")}
              </h2>
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>{t("employee_name_header", "ชື່ພະນັກງານ / Employee Name")}</th>
                      <th>{t("role", "ບົດບາດ / Role")}</th>
                      <th>{t("type", "ປະເພດ / Type")}</th>
                      <th style={{ textAlign: "right" }}>{t("base_salary_col", "ເງິນເດືອນ / Base Salary")}</th>
                      <th style={{ textAlign: "center" }}>{t("days_worked_col", "ວັນເຮັດວຽກ / Days")}</th>
                      <th style={{ textAlign: "right" }}>{t("daily_wages_col", "ຄ່າແຮງລາຍວັນ / Daily Wage")}</th>
                      <th style={{ textAlign: "center" }}>{t("trips", "ຈຳນວນທ່ຽວ / Trips")}</th>
                      <th style={{ textAlign: "right" }}>{t("trip_wages_col", "ຄ່າທ່ຽວ / Trip wages")}</th>
                      <th style={{ textAlign: "right" }}>{t("bonus_ot_comm_col", "ໂບນັດ/OT/ຄອມ / Other Pay")}</th>
                      <th style={{ textAlign: "right" }}>{t("total_earnings_col", "ລາຍຮັບທັງໝົດ / Total")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.employeeDetails.length === 0 ? (
                      <tr>
                        <td colSpan="10" style={{ textAlign: "center", color: "var(--text-muted)" }}>
                          No employee payroll records.
                        </td>
                      </tr>
                    ) : (
                      data.employeeDetails.map(emp => (
                        <tr key={emp.id}>
                          <td style={{ fontWeight: "700" }}>{emp.name}</td>
                          <td>
                            <span className="badge badge-secondary">
                              {emp.role === "guide" ? "🧭 Guide" : emp.role === "captain" ? "⚓ Captain" : emp.role === "driver" ? "🚗 Driver" : emp.role}
                            </span>
                          </td>
                          <td>{emp.type === "permanent" ? "💼 Staff" : "⏳ Temporary"}</td>
                          <td style={{ textAlign: "right" }}>{formatLAK(emp.baseSalary)}</td>
                          <td style={{ textAlign: "center" }}>{emp.daysWorked || 0}</td>
                          <td style={{ textAlign: "right" }}>{formatLAK(emp.dailyWagePay)}</td>
                          <td style={{ textAlign: "center", fontWeight: "700" }}>{emp.tripCount}</td>
                          <td style={{ textAlign: "right" }}>{formatLAK(emp.tripPay)}</td>
                          <td style={{ textAlign: "right" }}>{formatLAK(emp.otherPay)}</td>
                          <td style={{ textAlign: "right", fontWeight: "800", color: "var(--primary)" }}>
                            {formatLAK(emp.totalPayout)} LAK
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Agent Commissions Table */}
            <div className="card">
              <h2 style={{ fontSize: "1.1rem", color: "var(--text-primary)", marginBottom: "1rem" }}>
                🪙 {t("agent_commissions_section", "ຄ່າຄອມມິດຊັນເອເຈນປະຈຳເດືອນ / Agent Referral Commissions")}
              </h2>
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>{t("partner_name", "ຊື່ອີເຈນ / Partner Name")}</th>
                      <th>{t("partner_type", "ປະເພດ / Type")}</th>
                      <th style={{ textAlign: "right" }}>{t("commission_rate", "ເລດຄ່າຄອມ / Rate")}</th>
                      <th style={{ textAlign: "center" }}>{t("referred_pax", "ຈຳນວນຄົນ / Pax")}</th>
                      <th style={{ textAlign: "right" }}>{t("total_commission", "ຍອດເງິນຄອມ / Total Commission")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.agentDetails.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: "center", color: "var(--text-muted)" }}>
                          No agent referral records.
                        </td>
                      </tr>
                    ) : (
                      data.agentDetails.map(partner => (
                        <tr key={partner.id}>
                          <td style={{ fontWeight: "700" }}>{partner.name}</td>
                          <td>
                            <span className="badge badge-primary">
                              {partner.type === "agent" ? "💼 Agent" : partner.type === "company" ? "🏢 Company" : "🧭 Guide"}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>{formatLAK(partner.commissionRate)} / pax</td>
                          <td style={{ textAlign: "center", fontWeight: "700" }}>{partner.paxCount}</td>
                          <td style={{ textAlign: "right", fontWeight: "800", color: "var(--secondary)" }}>
                            {formatLAK(partner.totalCommission)} LAK
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* --- TAB 6: STAFF PAYROLL MANAGER --- */}
      {activeTab === "payroll_manager" && (
        <div className="fade-in no-print">
          <PayrollManager />
        </div>
      )}

      {/* --- TAB 7: COMMISSION TRACKER --- */}
      {activeTab === "commission_manager" && (
        <div className="fade-in no-print">
          <CommissionTracker />
        </div>
      )}

      </div>
      {/* --------------------- HIGH FIDELITY PRINTABLE STATEMENT (EXPENSES MONTHLY PRINT OUT OVERLAY) --------------------- */}
      <div className="printable-area">
        {printTemplate === "statement" && (
          <div className="dashboard-print">
          <div style={{ textAlign: "center", marginBottom: "20px", borderBottom: "2px solid #000", paddingBottom: "10px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "bold" }}>ໃບບິນລາຍຈ່າຍປະຈຳເດືອນ / MONTHLY OPERATING EXPENSE STATEMENT</h2>
            <p style={{ fontSize: "12px", color: "#666" }}>TADFANE RAFTING / ຕາດຟານ ລ່ອງແກ່ງ BOAT TRIP MANAGER</p>
            <p style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
              <strong>ປະຈຳເດືອນ / Period:</strong> {selectedMonth} | <strong>ພິມວັນທີ / Printed:</strong> {new Date().toLocaleString()}
            </p>
          </div>

          <h3 style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "8px" }}>1. ສະຫຼຸບລາຍຈ່າຍດຳເນີນງານ / Operational Expense Summary</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "25px" }}>
            <thead>
              <tr style={{ background: "#cbd5e1" }}>
                <th style={{ border: "1px solid #000", padding: "6px", textAlign: "left" }}>ລາຍການລາຍຈ່າຍ / Expense Category</th>
                <th style={{ border: "1px solid #000", padding: "6px", textAlign: "left" }}>ລາຍລະອຽດ / Calculation Details</th>
                <th style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>ຍອດເງິນ / Amount LAK</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: "1px solid #000", padding: "6px" }}>ເງິນເດືອນພະນັກງານປະຈຳ (Base Salaries)</td>
                <td style={{ border: "1px solid #000", padding: "6px" }}>ເງິນເດືອນພື້ນຖານພະນັກງານທັງໝົດໃນລະບົບ</td>
                <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>-{formatLAK(expenseDetails.totalBaseSalaries)}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "6px" }}>ຄ່າທ່ຽວໄກ້ດທັງໝົດ (Guide Allowances)</td>
                <td style={{ border: "1px solid #000", padding: "6px" }}>ຄ່າທ່ຽວຂອງໄກ້ດທັງໝົດໃນເດືອນ</td>
                <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>-{formatLAK(expenseDetails.guideWages)}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "6px" }}>ຄ່າທ່ຽວກັປຕັນທັງໝົດ (Captain Allowances)</td>
                <td style={{ border: "1px solid #000", padding: "6px" }}>ຄ່າທ່ຽວຂອງກັປຕັນທັງໝົດໃນເດືອນ</td>
                <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>-{formatLAK(expenseDetails.captainWages)}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "6px" }}>ຄ່າທ່ຽວຄົນຂັບລົດທັງໝົດ (Driver Allowances)</td>
                <td style={{ border: "1px solid #000", padding: "6px" }}>ຄ່າທ່ຽວຂອງຄົນຂັບລົດທັງໝົດໃນເດືອນ</td>
                <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>-{formatLAK(expenseDetails.driverWages)}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "6px", fontWeight: "bold" }}>ຄ່ານ້ຳມັນເຊື້ອໄຟເຮືອ (Boat Fuel Expenses)</td>
                <td style={{ border: "1px solid #000", padding: "6px" }}>ຄ່ານ້ຳມັນເຊື້ອໄຟຕາມຈຳນວນທ່ຽວເຮືອແລ່ນ</td>
                <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right", fontWeight: "bold" }}>-{formatLAK(expenseDetails.totalFuelCost)}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "6px" }}>ຄ່າຊ່ອມບຳລຸງ ແລະ ສຶກຫຼໍເຮືອ (Boat Wear & Tear)</td>
                <td style={{ border: "1px solid #000", padding: "6px" }}>ຄ່າບຳລຸງຮັກສາເຮືອຕາມຈຳນວນທ່ຽວ</td>
                <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>-{formatLAK(expenseDetails.totalMaintCost)}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "6px" }}>ຄ່າເຊົ່າຫ້ອງການຄົງທີ່ (Office Rent)</td>
                <td style={{ border: "1px solid #000", padding: "6px" }}>ຄ່າເຊົ່າຫ້ອງການປະຈຳເດືອນຄົງທີ່</td>
                <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>-{formatLAK(expenseDetails.officeRent)}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "6px" }}>ຄ່າຄອມມິດຊັນເອເຈນສະສົມ (Agent Commissions)</td>
                <td style={{ border: "1px solid #000", padding: "6px" }}>ສ່ວນແບ່ງ ແລະ ຄ່າຄອມມິດຊັນ referrals ຂອງເອເຈນ</td>
                <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>-{formatLAK(expenseDetails.totalCommissions)}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "6px", fontWeight: "bold" }}>ລາຍຈ່າຍອື່ນໆຄີມືເພີ່ມເຕີມ (Manual Approved Expenses)</td>
                <td style={{ border: "1px solid #000", padding: "6px" }}>ຄ່ານ້ຳ, ຄ່າໄຟ, ອຸປະກອນ, ແລະ ລາຍຈ່າຍອື່ນໆ</td>
                <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right", fontWeight: "bold" }}>-{formatLAK(expenseDetails.totalCustom)}</td>
              </tr>
              <tr style={{ background: "#cbd5e1", fontWeight: "bold" }}>
                <td style={{ border: "1px solid #000", padding: "6px" }} colSpan="2">ລວມລາຍຈ່າຍທັງໝົດ / TOTAL APPROVED OPERATING EXPENSES</td>
                <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right", color: "red" }}>-{formatLAK(expenseDetails.total)}</td>
              </tr>
            </tbody>
          </table>

          <h3 style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "8px", marginTop: "20px" }}>2. ລາຍການລາຍຈ່າຍທົ່ວໄປທີ່ໄດ້ຮັບອະນຸມັດ / Approved General Expenses</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#cbd5e1" }}>
                <th style={{ border: "1px solid #000", padding: "6px", textAlign: "left" }}>{t("date", "ວັນທີ / Date")}</th>
                <th style={{ border: "1px solid #000", padding: "6px", textAlign: "left" }}>{t("category", "ໝວດໝູ່ / Category")}</th>
                <th style={{ border: "1px solid #000", padding: "6px", textAlign: "left" }}>ຄຳອະທິບາຍ / Description</th>
                <th style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>ຍອດເງິນ / Amount LAK</th>
              </tr>
            </thead>
            <tbody>
              {expenseDetails.approvedCustom.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ border: "1px solid #000", padding: "10px", textAlign: "center", color: "#666" }}>ບໍ່ມີລາຍການ / No manual approved records.</td>
                </tr>
              ) : (
                expenseDetails.approvedCustom.map(exp => (
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
        )}

        {/* --------------------- MONTHLY SUMMARY PRINT OUT OVERLAY --------------------- */}
        {printTemplate === "summary" && (() => {
          const data = calculateMonthlySummaryData(summaryMonth);
          return (
            <div className="monthly-summary-print" style={{ padding: "10mm" }}>
              <div style={{ textAlign: "center", marginBottom: "20px", borderBottom: "2px solid #000", paddingBottom: "10px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: "bold" }}>ໃບສະຫຼຸບລາຍຮັບພະນັກງານ ແລະ ຄ່າຄອມເອເຈນ ປະຈຳເດືອນ</h2>
                <h3 style={{ fontSize: "14px", fontWeight: "bold", margin: "4px 0" }}>MONTHLY EARNINGS SUMMARY REPORT</h3>
                <p style={{ fontSize: "12px", color: "#666" }}>TADFANE RAFTING / ຕາດຟານ ລ່ອງແກ່ງ</p>
                <p style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                  <strong>ປະຈຳເດືອນ / Month Period:</strong> {summaryMonth} | <strong>ພິມວັນທີ / Printed:</strong> {new Date().toLocaleString()}
                </p>
              </div>

              {/* Summary table */}
              <h4 style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "6px" }}>ສະຫຼຸບຍອດລວມ / Financial Payout Summary</h4>
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
                <tbody>
                  <tr>
                    <td style={{ border: "1px solid #000", padding: "6px", fontWeight: "bold" }}>ລວມຈ່າຍພະນັກງານທັງໝົດ / Total Employee Payout:</td>
                    <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right", fontWeight: "bold" }}>{formatLAK(data.totalEmployeePayout)} LAK</td>
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #000", padding: "6px", fontWeight: "bold" }}>ລວມຄ່າຄອມເອເຈນທັງໝົດ / Total Agent Commissions:</td>
                    <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right", fontWeight: "bold" }}>{formatLAK(data.totalAgentCommissions)} LAK</td>
                  </tr>
                  <tr style={{ background: "#cbd5e1" }}>
                    <td style={{ border: "1px solid #000", padding: "6px", fontWeight: "bold" }}>ລວມລາຍຈ່າຍປະຈຳເດືອນທັງໝົດ / Monthly Grand Total:</td>
                    <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right", fontWeight: "bold" }}>{formatLAK(data.grandTotal)} LAK</td>
                  </tr>
                </tbody>
              </table>

              {/* Employee table */}
              <h4 style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "6px" }}>ລາຍຮັບພະນັກງານປະຈຳເດືອນ / Employee Monthly Earnings Ledger</h4>
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
                <thead>
                  <tr style={{ background: "#cbd5e1" }}>
                    <th style={{ border: "1px solid #000", padding: "6px", textAlign: "left" }}>ຊື່ພະນັກງານ / Name</th>
                    <th style={{ border: "1px solid #000", padding: "6px", textAlign: "left" }}>ບົດບາດ / Role</th>
                    <th style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>ເງິນເດືອນ / Base</th>
                    <th style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>ວັນ / Days</th>
                    <th style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>ຄ່າແຮງ / Daily</th>
                    <th style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>ທ່ຽວ / Trips</th>
                    <th style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>ຄ່າທ່ຽວ / Trip Pay</th>
                    <th style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>ອື່นໆ / Other</th>
                    <th style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>ຍອດລວມ / Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.employeeDetails.map(emp => (
                    <tr key={emp.id}>
                      <td style={{ border: "1px solid #000", padding: "6px" }}>{emp.name}</td>
                      <td style={{ border: "1px solid #000", padding: "6px" }}>{emp.role}</td>
                      <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>{formatLAK(emp.baseSalary)}</td>
                      <td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>{emp.daysWorked || 0}</td>
                      <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>{formatLAK(emp.dailyWagePay)}</td>
                      <td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>{emp.tripCount}</td>
                      <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>{formatLAK(emp.tripPay)}</td>
                      <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>{formatLAK(emp.otherPay)}</td>
                      <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right", fontWeight: "bold" }}>{formatLAK(emp.totalPayout)}</td>
                    </tr>
                  ))}
                  <tr style={{ background: "#cbd5e1", fontWeight: "bold" }}>
                    <td colSpan="8" style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>ລວມຈ່າຍພະນັກງານທັງໝົດ / Total Employee Payout:</td>
                    <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>{formatLAK(data.totalEmployeePayout)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Agent table */}
              <h4 style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "6px" }}>ຄ່າຄອມມິດຊັນເອເຈນປະຈຳເດືອນ / Agent Commissions Ledger</h4>
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px" }}>
                <thead>
                  <tr style={{ background: "#cbd5e1" }}>
                    <th style={{ border: "1px solid #000", padding: "6px", textAlign: "left" }}>ຊື່ອີເຈນ / Partner Name</th>
                    <th style={{ border: "1px solid #000", padding: "6px", textAlign: "left" }}>ປະເພດ / Type</th>
                    <th style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>ເລດຄ່າຄອມ / Rate</th>
                    <th style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>ຈຳນວນຄົນ / Pax</th>
                    <th style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>ຍອດເງິນຄອມ / Total Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {data.agentDetails.map(partner => (
                    <tr key={partner.id}>
                      <td style={{ border: "1px solid #000", padding: "6px" }}>{partner.name}</td>
                      <td style={{ border: "1px solid #000", padding: "6px" }}>{partner.type}</td>
                      <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>{formatLAK(partner.commissionRate)} / pax</td>
                      <td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>{partner.paxCount}</td>
                      <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right", fontWeight: "bold" }}>{formatLAK(partner.totalCommission)}</td>
                    </tr>
                  ))}
                  <tr style={{ background: "#cbd5e1", fontWeight: "bold" }}>
                    <td colSpan="4" style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>ລວມຄ່າຄອມເອເຈນທັງໝົດ / Total Agent Commissions:</td>
                    <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>{formatLAK(data.totalAgentCommissions)}</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ marginTop: "40px", display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                <div>
                  Prepared by: _______________________<br />
                  Accountant / ເຈົ້າໜ້າທີ່ບັນຊີ
                </div>
                <div>
                  Approved by: _______________________<br />
                  Director / ຜູ້ອຳນວຍການ
                </div>
              </div>
            </div>
          );
        })()}
      </div>

    </div>
  );
}
