// Reports.jsx - Business Reports & Profit/Loss Ledger
import React, { useState, useEffect } from "react";
import { useLanguage } from "../utils/LanguageContext";
import { getDb } from "../db/mockDb";
import { formatLAK, formatTHB, formatUSD, getLocalDateStr } from "../utils/helpers";
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";

export default function Reports() {
  const { lang, t } = useLanguage();
  const [db, setDb] = useState(getDb());
  const [reportType, setReportType] = useState("daily"); // daily, monthly, yearly
  const localDateStr = getLocalDateStr();
  const [selectedDate, setSelectedDate] = useState(localDateStr);
  const [selectedMonth, setSelectedMonth] = useState(localDateStr.slice(0, 7)); // YYYY-MM
  const [selectedYear, setSelectedYear] = useState(localDateStr.slice(0, 4));

  // Trigger P&L report print
  const triggerPrintReports = () => {
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleExportCSV = () => {
    const plData = calculatePL();
    let csvContent = "\uFEFF";
    
    // Title
    csvContent += `Report Type,${reportType.toUpperCase()}\n`;
    if (reportType === "daily") {
      csvContent += `Selected Date,${selectedDate}\n`;
    } else if (reportType === "monthly") {
      csvContent += `Selected Month,${selectedMonth}\n`;
    } else if (reportType === "yearly") {
      csvContent += `Selected Year,${selectedYear}\n`;
    }
    csvContent += "\n";

    // Summary Section
    csvContent += "Financial Summary Metric,Amount (LAK)\n";
    csvContent += `Gross Revenue,${plData.grossRevenue}\n`;
    csvContent += `Total Commissions (Agent/Partner),${plData.totalCommissions}\n`;
    csvContent += `Total Employee Payroll & Wages,${plData.totalEmployeePayroll}\n`;
    csvContent += `Fuel Cost,${plData.totalFuelCost}\n`;
    csvContent += `Maintenance Cost,${plData.totalMaintCost}\n`;
    csvContent += `Office Rent / Fixed Costs,${plData.fixedCosts}\n`;
    csvContent += `Custom/Manual Approved Expenses,${plData.totalCustomExpenses}\n`;
    csvContent += `Total Expenses,${plData.totalExpenses}\n`;
    csvContent += `Net Profit,${plData.netProfit}\n`;
    csvContent += "\n";

    // Demographics Breakdown: Nationalities
    csvContent += "Demographics: Nationality,Count\n";
    plData.demographics.nationalities.forEach(n => {
      csvContent += `"${n.name}",${n.count}\n`;
    });
    csvContent += "\n";

    // Demographics Breakdown: Activities
    csvContent += "Demographics: Activity/Service,Count\n";
    plData.demographics.activities.forEach(a => {
      csvContent += `"${a.name}",${a.count}\n`;
    });
    csvContent += "\n";

    // Demographics Breakdown: Sources
    csvContent += "Demographics: Booking Source (Agent/Direct),Count\n";
    plData.demographics.sources.forEach(s => {
      csvContent += `"${s.name}",${s.count}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `financial_report_${reportType}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Simulated operational rates (can be managed in settings later)
  const FUEL_COST_PER_TRIP = 150000; // 150,000 LAK for fuel per boat trip
  const MAINT_COST_PER_TRIP = 30000; // 30,000 LAK boat wear & tear per trip
  const OFFICE_RENT_MONTHLY = 1200000; // 1.2M LAK monthly rent

  useEffect(() => {
    const handleDbUpdate = () => {
      setDb(getDb());
    };
    window.addEventListener("db-update", handleDbUpdate);
    return () => window.removeEventListener("db-update", handleDbUpdate);
  }, []);

  // Filter lists based on selected report parameters
  const getFilteredData = () => {
    let trips = [];
    let customers = [];

    const todayStr = selectedDate;
    const monthStr = selectedMonth;
    const yearStr = selectedYear;

    const filterValidCustomer = (c) => {
      const bk = db.bookings?.find(b => b.id === c.bookingId || b.groupId === c.groupId);
      return bk ? (bk.status !== "ยกเลิก" && bk.status !== "cancelled") : true;
    };

    if (reportType === "daily") {
      trips = db.trips.filter(t => t.date === todayStr && (t.status === "completed" || t.status === "dispatched"));
      customers = db.customers.filter(c => c.checkInDate === todayStr && filterValidCustomer(c));
    } else if (reportType === "monthly") {
      trips = db.trips.filter(t => t.date && t.date.startsWith(monthStr) && (t.status === "completed" || t.status === "dispatched"));
      customers = db.customers.filter(c => c.checkInDate && c.checkInDate.startsWith(monthStr) && filterValidCustomer(c));
    } else if (reportType === "yearly") {
      trips = db.trips.filter(t => t.date && t.date.startsWith(yearStr) && (t.status === "completed" || t.status === "dispatched"));
      customers = db.customers.filter(c => c.checkInDate && c.checkInDate.startsWith(yearStr) && filterValidCustomer(c));
    }

    return { trips, customers };
  };

  const calculatePL = () => {
    const { trips, customers } = getFilteredData();
    const basePrice = (db.settings && db.settings.basePriceLAK) || 250000;

    // 1. Gross Revenue
    const grossRevenue = customers.reduce((sum, c) => {
      if (c.bookingId && db.bookings) {
        const bk = db.bookings.find(b => b.id === c.bookingId);
        if (bk) {
          const pax = bk.paxCount || 1;
          const paid = bk.pricePaidLAK || 0;
          return sum + (paid / pax);
        }
      }
      return sum + basePrice;
    }, 0);

    // 2. Partner Disbursements (Commissions & Sales)
    const partnerMap = {};
    db.partners.forEach(p => {
      partnerMap[p.id] = {
        partnerId: p.id,
        name: p.name,
        type: p.type,
        paxCount: 0,
        commission: 0,
        commissionRate: p.commissionRate,
        totalSales: 0
      };
    });

    // Determine bookings in period to compute total sales for each partner
    let periodBookings = [];
    if (reportType === "daily") {
      periodBookings = db.bookings.filter(b => b.date === selectedDate);
    } else if (reportType === "monthly") {
      periodBookings = db.bookings.filter(b => b.date && b.date.startsWith(selectedMonth));
    } else {
      periodBookings = db.bookings.filter(b => b.date && b.date.startsWith(selectedYear));
    }

    periodBookings.forEach(b => {
      const pid = b.partnerId || "PTN-000";
      if (partnerMap[pid]) {
        partnerMap[pid].totalSales += b.pricePaidLAK;
      }
    });

    customers.forEach(cust => {
      const pid = cust.partnerId || "PTN-000";
      if (partnerMap[pid]) {
        partnerMap[pid].paxCount += 1;
        partnerMap[pid].commission += partnerMap[pid].commissionRate;
      }
    });

    const partnerDisbursements = Object.values(partnerMap).filter(p => p.paxCount > 0 || p.totalSales > 0);
    const totalCommissions = partnerDisbursements.reduce((sum, p) => sum + p.commission, 0);

    // 3. Employee Disbursements (Payroll & Trips)
    const employeeDisbursements = db.employees.map(emp => {
      // Base salary proration
      let baseSalary = 0;
      if (emp.type === "permanent") {
        if (reportType === "daily") {
          baseSalary = emp.salary / 30;
        } else if (reportType === "monthly") {
          baseSalary = emp.salary;
        } else if (reportType === "yearly") {
          baseSalary = emp.salary * 12;
        }
      }

      // Count actual trips and passenger counts
      let tripCount = 0;
      let passengerCount = 0;
      trips.forEach(trip => {
        const isGuide = trip.guideIds && trip.guideIds.includes(emp.id);
        const isCaptain = (trip.captainIds && trip.captainIds.includes(emp.id)) || (trip.captainId === emp.id);
        const isDriver = trip.driverIds && trip.driverIds.includes(emp.id);
        if (isGuide || isCaptain || isDriver) {
          tripCount++;
          passengerCount += (trip.customerIds || []).length;
        }
      });

      const tripPay = tripCount * emp.tripRate;

      // Bonus proration
      let bonus = 0;
      if (emp.bonus > 0) {
        if (reportType === "daily") {
          bonus = emp.bonus / 30;
        } else if (reportType === "monthly") {
          bonus = emp.bonus;
        } else if (reportType === "yearly") {
          bonus = emp.bonus * 12;
        }
      }

      const total = baseSalary + tripPay + bonus;

      return {
        employeeId: emp.id,
        name: emp.name,
        role: emp.role,
        type: emp.type,
        baseSalary,
        tripCount,
        passengerCount,
        tripPay,
        bonus,
        total
      };
    }).filter(emp => emp.total > 0 || emp.tripCount > 0);

    const totalEmployeePayroll = employeeDisbursements.reduce((sum, emp) => sum + emp.total, 0);

    // 4. Operations: Fuel + Maintenance
    const totalFuelCost = trips.length * FUEL_COST_PER_TRIP;
    const totalMaintCost = trips.length * MAINT_COST_PER_TRIP;

    // 5. Fixed Costs
    let fixedCosts = 0;
    if (reportType === "daily") {
      fixedCosts = OFFICE_RENT_MONTHLY / 30;
    } else if (reportType === "monthly") {
      fixedCosts = OFFICE_RENT_MONTHLY;
    } else {
      fixedCosts = OFFICE_RENT_MONTHLY * 12;
    }

    // 6. Custom/Manual Expenses
    const periodCustomExpenses = (db.customExpenses || []).filter(exp => {
      if (exp.status !== "Approved") return false;
      if (reportType === "daily") return exp.date === selectedDate;
      if (reportType === "monthly") return exp.date && exp.date.startsWith(selectedMonth);
      return exp.date && exp.date.startsWith(selectedYear);
    });
    const totalCustomExpenses = periodCustomExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    const totalExpenses = totalCommissions + totalEmployeePayroll + totalFuelCost + totalMaintCost + fixedCosts + totalCustomExpenses;
    const netProfit = grossRevenue - totalExpenses;

    // Demographics Breakdown
    const nationalities = {};
    const activities = {};
    const sources = {};

    customers.forEach(c => {
      // 1. Nationality
      const nat = (c.nationality || "ບໍ່ລະບຸ / Unspecified").trim();
      nationalities[nat] = (nationalities[nat] || 0) + 1;

      // 2. Activity / Service
      const bk = db.bookings?.find(b => b.id === c.bookingId || b.groupId === c.groupId);
      let act = "ລ່ອງເຮືອ / Adult Boat Ride"; // default
      if (bk) {
        const srv = db.services?.find(s => s.id === bk.serviceId);
        if (srv) {
          act = srv.name;
        } else if (bk.serviceName) {
          act = bk.serviceName;
        }
      }
      activities[act] = (activities[act] || 0) + 1;

      // 3. Source (Agent or Walk-in)
      let src = "มาเอง / Direct (Walk-in)";
      if (bk && bk.partnerId && bk.partnerId !== "PTN-000") {
        src = bk.partnerName || "Agent (ເອເຈນ)";
      }
      sources[src] = (sources[src] || 0) + 1;
    });

    const sortedNationalities = Object.keys(nationalities)
      .map(name => ({ name, count: nationalities[name] }))
      .sort((a, b) => b.count - a.count);

    const sortedActivities = Object.keys(activities)
      .map(name => ({ name, count: activities[name] }))
      .sort((a, b) => b.count - a.count);

    const sortedSources = Object.keys(sources)
      .map(name => ({ name, count: sources[name] }))
      .sort((a, b) => b.count - a.count);

    // Payment Method Breakdown & Currency Breakdown
    let cashRevenue = 0, transferRevenue = 0, cardRevenue = 0;
    let cashBills = 0, transferBills = 0, cardBills = 0;
    let lakRevenue = 0, thbRevenue = 0, usdRevenue = 0;
    let lakBills = 0, thbBills = 0, usdBills = 0;
    const rateTHB = db.settings.rateTHB || 700;
    const rateUSD = db.settings.rateUSD || 21500;
    let totalDiscount = 0, totalDebt = 0;

    const activePeriodBookings = periodBookings.filter(bk => bk.status !== "cancelled");
    activePeriodBookings.forEach(bk => {
      const rev = bk.netPriceLAK !== undefined ? bk.netPriceLAK : bk.pricePaidLAK;
      const pm = bk.paymentMethod || "";
      if (pm === "card") {
        cardRevenue += rev || 0;
        cardBills += 1;
      } else if (pm === "transfer" || pm === "qr" || pm === "bank") {
        transferRevenue += rev || 0;
        transferBills += 1;
      } else {
        // cash or unspecified
        cashRevenue += rev || 0;
        cashBills += 1;
      }

      // Currency Breakdown
      const cur = bk.paymentCurrency || "LAK";
      if (cur === "THB") {
        thbRevenue += rev || 0;
        thbBills += 1;
      } else if (cur === "USD") {
        usdRevenue += rev || 0;
        usdBills += 1;
      } else {
        lakRevenue += rev || 0;
        lakBills += 1;
      }

      totalDiscount += bk.discountLAK || 0;
      totalDebt += bk.debtLAK || 0;
    });

    return {
      tripsCount: trips.length,
      paxCount: customers.length,
      grossRevenue,
      totalCommissions,
      totalEmployeePayroll,
      totalFuelCost,
      totalMaintCost,
      fixedCosts,
      totalCustomExpenses,
      totalExpenses,
      netProfit,
      partnerDisbursements,
      employeeDisbursements,
      periodCustomExpenses,
      cashRevenue,
      transferRevenue,
      cardRevenue,
      cashBills,
      transferBills,
      cardBills,
      lakRevenue,
      thbRevenue,
      usdRevenue,
      lakBills,
      thbBills,
      usdBills,
      rateTHB,
      rateUSD,
      totalDiscount,
      totalDebt,
      demographics: {
        nationalities: sortedNationalities,
        activities: sortedActivities,
        sources: sortedSources
      }
    };
  };

  const pl = calculatePL();

  // Percentage calculations for bar chart representation
  const expensePercentage = pl.grossRevenue > 0 ? Math.min(100, (pl.totalExpenses / pl.grossRevenue) * 100) : 0;
  const profitPercentage = pl.grossRevenue > 0 ? Math.max(0, 100 - expensePercentage) : 0;

  return (
    <div>
      <div className="no-print">
        <div className="page-header no-print">
        <div className="page-title">
          <h1>Business Reports & Profit & Loss (ລາຍງານ ແລະ ກໍາໄລ-ຂາດທຶນ)</h1>
          <p>ກວດສອບລາຍຮັບ, ລາຍຈ່າຍ, ແລະ ກໍາໄລສຸດທິ ປະຈຳວັນ, ປະຈຳເດືອນ ຫຼື ປະຈຳປີ</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            Export to CSV
          </button>
          <button className="btn btn-primary" onClick={triggerPrintReports}>
            ພິມລາຍງານກຳໄລ-ຂາດທຶນ (Print P&L Report V3.1)
          </button>
        </div>
      </div>

      {/* Filter Options */}
      <div className="card" style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
          
          <div className="tabs-container" style={{ border: "none", margin: 0 }}>
            <button className={`tab-btn ${reportType === "daily" ? "active" : ""}`} onClick={() => setReportType("daily")}>
              {t("daily", "ລາຍວັນ / Daily")}
            </button>
            <button className={`tab-btn ${reportType === "monthly" ? "active" : ""}`} onClick={() => setReportType("monthly")}>
              {t("monthly", "ລາຍເດືອນ / Monthly")}
            </button>
            <button className={`tab-btn ${reportType === "yearly" ? "active" : ""}`} onClick={() => setReportType("yearly")}>
              {t("yearly", "ລາຍປີ / Yearly")}
            </button>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <Calendar size={18} color="var(--primary)" />
            {reportType === "daily" && (
              <input type="date" className="form-control" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            )}
            {reportType === "monthly" && (
              <input type="month" className="form-control" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
            )}
            {reportType === "yearly" && (
              <select className="form-control" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            )}
          </div>

        </div>
      </div>

      {/* Net profit widget summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
        <div className="card" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div className="metric-icon blue" style={{ fontSize: "1.5rem" }}><DollarSign size={24} /></div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{t("gross_revenue_label", "ລາຍຮັບລວມ / Gross Revenue")}</div>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{formatLAK(pl.grossRevenue)}</div>
          </div>
        </div>

        <div className="card" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div className="metric-icon red" style={{ fontSize: "1.5rem" }}><TrendingDown size={24} /></div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{t("total_expenses_label", "ລາຍຈ່າຍລວມ / Total Expenses")}</div>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--danger)" }}>-{formatLAK(pl.totalExpenses)}</div>
          </div>
        </div>

        <div className="card" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div className={`metric-icon ${pl.netProfit >= 0 ? "green" : "red"}`} style={{ fontSize: "1.5rem" }}>
            {pl.netProfit >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{t("net_profit_label", "ກຳໄລສຸດທິ / Net Profit")}</div>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: pl.netProfit >= 0 ? "var(--success)" : "var(--danger)" }}>
              {formatLAK(pl.netProfit)}
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-sections-grid" style={{ marginTop: 0 }}>
        
        {/* Graphical P&L Breakdown */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "5px" }}>
            <BarChart3 size={20} color="var(--primary)" />
            {t("profit_structure", "ໂຄງສ້າງກຳໄລ / Profit Margin Structure")}
          </h2>
          
          {pl.grossRevenue > 0 ? (
            <div>
              {/* CSS Stacked Bar graph representation */}
              <div style={{ display: "flex", height: "36px", width: "100%", borderRadius: "8px", overflow: "hidden", margin: "1rem 0" }}>
                <div style={{ width: `${Math.max(10, profitPercentage)}%`, backgroundColor: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontWeight: "bold", fontSize: "0.85rem" }}>
                  {profitPercentage.toFixed(0)}% {t("profit", "ກຳໄລ / Profit")}
                </div>
                <div style={{ width: `${Math.max(10, expensePercentage)}%`, backgroundColor: "var(--danger)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "bold", fontSize: "0.85rem" }}>
                  {expensePercentage.toFixed(0)}% {t("expenses", "ລາຍຈ່າຍ / Expenses")}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                <span>{t("net_profit_ratio", "ອັດຕາສ່ວນກຳໄລສຸດທິ")}: {profitPercentage.toFixed(1)}%</span>
                <span>{t("expenses_ratio", "ອັດຕາສ່ວນລາຍຈ່າຍ")}: {expensePercentage.toFixed(1)}%</span>
              </div>
            </div>
          ) : (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              {t("no_margin_data", "ບໍ່ມີຂໍ້ມູນທາງການເງິນໃນໄລຍະເວລານີ້ / No data available")}
            </div>
          )}

          {/* P&L Statement Details Table */}
          <div style={{ marginTop: "1rem" }}>
            <h3 style={{ fontSize: "1.05rem", color: "var(--text-primary)", marginBottom: "0.75rem" }}>{t("pl_statement_detailed", "ບັນຊີລາຍຮັບ-ລາຍຈ່າຍຢ່າງລະອຽດ / Profit & Loss Statement")}</h3>
            <table style={{ marginTop: 0 }}>
              <thead>
                <tr>
                  <th>{t("itemized_statement", "ລາຍການບັນຊີ / Itemized Statement")}</th>
                  <th style={{ textAlign: "right" }}>{t("total_amount_lak", "ຍອດລວມເງິນ (LAK) / Total (LAK)")}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>{t("ticket_revenues", "ລາຍຮັບຈາກການຂາຍປີ້ / Ticket Revenues")}</strong></td>
                  <td style={{ textAlign: "right", color: "var(--success)", fontWeight: "600" }}>{formatLAK(pl.grossRevenue)}</td>
                </tr>
                <tr>
                  <td>{t("commissions_expense", "ຄ່າຄອມມິດຊັນເອເຈນສະສົມ / Commissions Expense")}</td>
                  <td style={{ textAlign: "right", color: "var(--danger)" }}>-{formatLAK(pl.totalCommissions)}</td>
                </tr>
                <tr>
                  <td>{t("employee_payroll_allowances", "ລາຍຈ່າຍຄ່າແຮງ ແລະ ເງິນເດືອນພະນັກງານ / Payroll & Allowances")}</td>
                  <td style={{ textAlign: "right", color: "var(--danger)" }}>-{formatLAK(pl.totalEmployeePayroll)}</td>
                </tr>
                <tr>
                  <td>{t("boat_fuel_cost", "ຄ່ານ້ຳມັນເຊື້ອໄຟເຮືອ / Boat Fuel Cost")}</td>
                  <td style={{ textAlign: "right", color: "var(--danger)" }}>-{formatLAK(pl.totalFuelCost)}</td>
                </tr>
                <tr>
                  <td>{t("boat_wear_tear", "ຄ່າຊ້ອມບຳລຸງເຮືອ / Wear & Tear")}</td>
                  <td style={{ textAlign: "right", color: "var(--danger)" }}>-{formatLAK(pl.totalMaintCost)}</td>
                </tr>
                <tr>
                  <td>{t("fixed_office_costs", "ຄ່າເຊົ່າຫ້ອງການ ແລະ ຄ່າໃຊ້ຈ່າຍຄົງທີ່ / Fixed Costs")}</td>
                  <td style={{ textAlign: "right", color: "var(--danger)" }}>-{formatLAK(pl.fixedCosts)}</td>
                </tr>
                <tr>
                  <td>{t("other_custom_expenses", "ລາຍຈ່າຍທົ່ວໄປ/ອື່ນໆ / Other Custom Expenses")}</td>
                  <td style={{ textAlign: "right", color: "var(--danger)" }}>-{formatLAK(pl.totalCustomExpenses)}</td>
                </tr>
                <tr style={{ borderTop: "2px solid var(--border-color)", background: "var(--bg-tertiary)" }}>
                  <td><strong>{t("net_income", "ກຳໄລສຸດທິ / Net Income")}</strong></td>
                  <td style={{ textAlign: "right", color: pl.netProfit >= 0 ? "var(--success)" : "var(--danger)", fontWeight: "bold", fontSize: "1.1rem" }}>
                    {formatLAK(pl.netProfit)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Method Breakdown Table */}
        <div className="card" style={{ marginTop: "20px" }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: "1.1rem", color: "var(--primary)", display: "flex", alignItems: "center", gap: "8px" }}>
            💳 {t("payment_breakdown_title", "ສະຫຼຸບຊ່ອງທາງຊຳລະ / Payment Breakdown")}
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>{t("payment_method_col", "ຊ່ອງທາງ / Method")}</th>
                  <th style={{ textAlign: "center" }}>{t("bill_count_label", "ບິນ / Bills")}</th>
                  <th style={{ textAlign: "right" }}>{t("revenue_label", "ລາຍຮັບ / Revenue")} (LAK)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>💵 {t("cash_label", "ເງິນສົດ / Cash")}</td>
                  <td style={{ textAlign: "center" }}>{pl.cashBills}</td>
                  <td style={{ textAlign: "right", fontWeight: "700" }}>{formatLAK(pl.cashRevenue)}</td>
                </tr>
                <tr>
                  <td>📱 {t("transfer_label", "ໂອນ / Transfer")}</td>
                  <td style={{ textAlign: "center" }}>{pl.transferBills}</td>
                  <td style={{ textAlign: "right", fontWeight: "700" }}>{formatLAK(pl.transferRevenue)}</td>
                </tr>
                <tr>
                  <td>💳 {t("card_label", "ບັດ / Card")}</td>
                  <td style={{ textAlign: "center" }}>{pl.cardBills}</td>
                  <td style={{ textAlign: "right", fontWeight: "700" }}>{formatLAK(pl.cardRevenue)}</td>
                </tr>
                <tr style={{ borderTop: "2px solid var(--border-color)", fontWeight: "900" }}>
                  <td>{t("total_label", "ລວມ / Total")}</td>
                  <td style={{ textAlign: "center" }}>{pl.cashBills + pl.transferBills + pl.cardBills}</td>
                  <td style={{ textAlign: "right" }}>{formatLAK(pl.cashRevenue + pl.transferRevenue + pl.cardRevenue)}</td>
                </tr>
                {pl.totalDiscount > 0 && (
                  <tr style={{ color: "#e11d48" }}>
                    <td colSpan="2">🏷️ {t("total_discount_label", "ສ່ວນຫຼຸດລວມ / Total Discounts")}</td>
                    <td style={{ textAlign: "right", fontWeight: "700" }}>-{formatLAK(pl.totalDiscount)}</td>
                  </tr>
                )}
                {pl.totalDebt > 0 && (
                  <tr style={{ color: "#ea580c" }}>
                    <td colSpan="2">⚠️ {t("total_debt_label", "ຄ້າງຊຳລະລວມ / Outstanding Debt")}</td>
                    <td style={{ textAlign: "right", fontWeight: "700" }}>{formatLAK(pl.totalDebt)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Revenue Currency Breakdown Table */}
        <div className="card" style={{ marginTop: "20px" }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: "1.1rem", color: "var(--primary)", display: "flex", alignItems: "center", gap: "8px" }}>
            💵 {t("currency_breakdown_title", "ສະຫຼຸບລາຍຮັບແຍກຕາມສະກຸນເງິນ / Revenue by Currency")}
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>{t("currency_col", "ສະກຸນເງິນ / Currency")}</th>
                  <th style={{ textAlign: "center" }}>{t("bill_count_label", "ບິນ / Bills")}</th>
                  <th style={{ textAlign: "right" }}>{t("collected_amount_col", "ຍອດເງິນທີ່ເກັບໄດ້ / Collected Amount")}</th>
                  <th style={{ textAlign: "right" }}>{t("equivalent_lak_col", "ມູນຄ່າທຽบເທົ່າ (LAK)")}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>₭ LAK (ກີບ / กีบ)</td>
                  <td style={{ textAlign: "center" }}>{pl.lakBills}</td>
                  <td style={{ textAlign: "right", fontWeight: "700" }}>{formatLAK(pl.lakRevenue)}</td>
                  <td style={{ textAlign: "right", fontWeight: "700", color: "var(--success)" }}>{formatLAK(pl.lakRevenue)}</td>
                </tr>
                <tr>
                  <td>฿ THB (ບາດ / บาท)</td>
                  <td style={{ textAlign: "center" }}>{pl.thbBills}</td>
                  <td style={{ textAlign: "right", fontWeight: "700" }}>฿{formatTHB(pl.thbRevenue / pl.rateTHB)}</td>
                  <td style={{ textAlign: "right", fontWeight: "700", color: "var(--success)" }}>{formatLAK(pl.thbRevenue)}</td>
                </tr>
                <tr>
                  <td>$ USD (ໂດລາ / ดอลลาร์)</td>
                  <td style={{ textAlign: "center" }}>{pl.usdBills}</td>
                  <td style={{ textAlign: "right", fontWeight: "700" }}>{formatUSD(pl.usdRevenue / pl.rateUSD)}</td>
                  <td style={{ textAlign: "right", fontWeight: "700", color: "var(--success)" }}>{formatLAK(pl.usdRevenue)}</td>
                </tr>
                <tr style={{ borderTop: "2px solid var(--border-color)", fontWeight: "900" }}>
                  <td>{t("total_label", "ລວມ / Total")}</td>
                  <td style={{ textAlign: "center" }}>{pl.lakBills + pl.thbBills + pl.usdBills}</td>
                  <td style={{ textAlign: "right" }}>-</td>
                  <td style={{ textAlign: "right", color: "var(--primary)" }}>{formatLAK(pl.lakRevenue + pl.thbRevenue + pl.usdRevenue)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "8px", fontStyle: "italic" }}>
            * {t("exchange_rates_used", "อัตราแลกเปลี่ยนอ้างอิง:")} 1 THB = {pl.rateTHB} LAK | 1 USD = {pl.rateUSD} LAK
          </div>
        </div>

        {/* Operating metrics side pane */}
        <div className="card">
          <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "1rem" }}>{t("operational_kpis", "ຕົວຊີ້ວັດການດຳເນີນງານ / Operational KPIs")}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            
            <div style={{ padding: "0.85rem", background: "var(--bg-primary)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{t("total_trips_run", "ຈຳນວນທ່ຽວເຮືອທີ່ອອກ / Total Dispatched Trips")}</div>
              <div style={{ fontSize: "1.3rem", fontWeight: "bold", marginTop: "0.25rem" }}>{pl.tripsCount} {t("trips_unit", "ທ່ຽວ / Trips")}</div>
            </div>

            <div style={{ padding: "0.85rem", background: "var(--bg-primary)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{t("total_boarding_pax", "ຜູ້ໂດຍສານສະສົມ / Total Boarding Pax")}</div>
              <div style={{ fontSize: "1.3rem", fontWeight: "bold", marginTop: "0.25rem" }}>{pl.paxCount} {t("pax_unit", "ຄົນ / Pax")}</div>
            </div>

            <div style={{ padding: "0.85rem", background: "var(--bg-primary)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{t("average_passenger_revenue", "ລາຍຮັບສະເລ່ຍຕໍ່ຄົນ / Average Passenger Revenue")}</div>
              <div style={{ fontSize: "1.3rem", fontWeight: "bold", marginTop: "0.25rem", color: "var(--primary)" }}>
                {pl.paxCount > 0 ? formatLAK(pl.grossRevenue / pl.paxCount) : formatLAK(0)}
              </div>
            </div>

            <div style={{ padding: "0.85rem", background: "var(--bg-primary)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{t("average_fuel_cost_trip", "ຕົ້ນທຶນນ້ຳມັນສະເລ່ຍຕໍ່ທ່ຽວ / Fuel Cost per Trip")}</div>
              <div style={{ fontSize: "1rem", fontWeight: "600", marginTop: "0.25rem", color: "var(--text-muted)" }}>
                {formatLAK(FUEL_COST_PER_TRIP)}
              </div>
            </div>
            
          </div>
        </div>

      </div>

      {/* Disbursements Breakdown Details */}
      <div className="card no-print" style={{ marginTop: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "1.5rem" }}>
          ສະຫຼຸບລາຍຈ່າຍແຍກຕາມບຸກຄົນ / Disbursements Breakdown Details
        </h2>

        <div className="disbursements-grid">
          
          {/* Partner Commissions Summary */}
          <div>
            <h3 style={{ fontSize: "1rem", color: "var(--primary)", marginBottom: "0.75rem" }}>
              1. ຄ່າຄອມມິດຊັນເອເຈນ / Partner Commissions Summary
            </h3>
            <div style={{ overflowX: "auto", border: "1px solid var(--border-color)", borderRadius: "8px" }}>
              <table style={{ margin: 0, fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th>ຊື່ຄູ່ຄ້າ / Partner</th>
                    <th>ຈຳນວນຄົນ / Pax</th>
                    <th>ຍອດຂາຍ / Sales</th>
                    <th style={{ textAlign: "right" }}>ລວມຄ່າຄອມ / Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {pl.partnerDisbursements.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: "center", color: "var(--text-muted)", padding: "15px" }}>ບໍ່ມີລາຍການ / No records</td>
                    </tr>
                  ) : (
                    pl.partnerDisbursements.map((p, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: "600" }}>{p.name}</td>
                        <td>{p.paxCount} ຄົນ</td>
                        <td>{formatLAK(p.totalSales)}</td>
                        <td style={{ textAlign: "right", fontWeight: "bold", color: "var(--success)" }}>{formatLAK(p.commission)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Employee Earnings Summary */}
          <div>
            <h3 style={{ fontSize: "1rem", color: "var(--primary)", marginBottom: "0.75rem" }}>
              2. ລາຍໄດ້ຂອງພະນັກງານ / Employee Earnings Summary
            </h3>
            <div style={{ overflowX: "auto", border: "1px solid var(--border-color)", borderRadius: "8px" }}>
              <table style={{ margin: 0, fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th>ຊື່ພະນັກງານ / Employee</th>
                    <th>ເງິນເດືອນ / Base</th>
                    <th>ຈຳນວນທ່ຽວ / Trips</th>
                    <th>ຈຳນວນລູກຄ້າ / Guided Pax</th>
                  <th style={{ border: "1px solid #000", padding: "5px", textAlign: "right" }}>{t("trip_pay_col", "ເງິນທ່ຽວ / Trip Pay")}</th>
                    <th>ໂບນັດ / Bonus</th>
                    <th style={{ textAlign: "right" }}>ລວມ / Total</th>
                  </tr>
                </thead>
                <tbody>
                  {pl.employeeDisbursements.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", color: "var(--text-muted)", padding: "15px" }}>ບໍ່ມີລາຍການ / No records</td>
                    </tr>
                  ) : (
                    pl.employeeDisbursements.map((emp, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: "600" }}>
                          {emp.name}
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "capitalize" }}>
                            {emp.role === "guide" ? "ໄກ້ດ" : emp.role === "captain" ? "ກັປຕັນ" : emp.role === "driver" ? "ຄົນຂັບລົດ" : "ພະນັກງານ"}
                          </div>
                        </td>
                        <td>{formatLAK(emp.baseSalary)}</td>
                        <td style={{ textAlign: "center" }}>{emp.tripCount} {t("trips_unit", "ທ່ຽວ / Trips")}</td>
                        <td style={{ textAlign: "center" }}>{emp.passengerCount} {t("pax_unit", "ຄົນ / Pax")}</td>
                        <td>{formatLAK(emp.tripPay)}</td>
                        <td>{formatLAK(emp.bonus)}</td>
                        <td style={{ textAlign: "right", fontWeight: "bold", color: "var(--primary)" }}>{formatLAK(emp.total)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Custom/Other Expenses Summary */}
          <div className="full-width-grid-col" style={{ marginTop: "1.5rem" }}>
            <h3 style={{ fontSize: "1rem", color: "var(--primary)", marginBottom: "0.75rem" }}>
              3. ລາຍຈ່າຍທົ່ວໄປ/ອື່ນໆ (Other Custom Expenses Details)
            </h3>
            <div style={{ overflowX: "auto", border: "1px solid var(--border-color)", borderRadius: "8px" }}>
              <table style={{ margin: 0, fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th>ວັນທີ / Date</th>
                    <th>ໝວດໝູ່ / Category</th>
                    <th>ຄຳອະທິບາຍ / Description</th>
                    <th style={{ textAlign: "right" }}>ຍອດເງິນ / Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {pl.periodCustomExpenses && pl.periodCustomExpenses.length > 0 ? (
                    pl.periodCustomExpenses.map((exp, idx) => (
                      <tr key={idx}>
                        <td>{exp.date}</td>
                        <td style={{ fontWeight: "600" }}>{exp.category}</td>
                        <td>{exp.description}</td>
                        <td style={{ textAlign: "right", fontWeight: "bold", color: "var(--danger)" }}>-{formatLAK(exp.amount)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: "center", color: "var(--text-muted)", padding: "15px" }}>ບໍ່ມີລາຍຈ່າຍອື່ນໆໃນໄລຍະເວລານີ້ / No entries</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Passenger Demographics Breakdown */}
          <div style={{ flex: "1 1 100%", marginTop: "2rem" }}>
            <h3 style={{ fontSize: "1.1rem", color: "var(--primary)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "8px" }}>
              📊 4. ສະຖິຕິຜູ້ໂດຍສານ / Passenger Demographics Breakdown
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
              
              {/* Nationality Breakdown */}
              <div style={{ border: "1px solid var(--border-color)", borderRadius: "8px", background: "var(--card-bg, #ffffff)", padding: "1rem" }}>
                <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "0.9rem", color: "var(--text-primary)", borderBottom: "1.5px solid var(--border-color)", paddingBottom: "6px" }}>
                  🗺️ ແຍກຕາມສັນຊາດ (By Nationality)
                </h4>
                <table style={{ margin: 0, fontSize: "0.8rem", width: "100%" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th style={{ padding: "6px" }}>ສັນຊາດ / Nationality</th>
                      <th style={{ padding: "6px", textAlign: "right" }}>ຈຳນວນ / Pax</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pl.demographics.nationalities.length === 0 ? (
                      <tr><td colSpan="2" style={{ textAlign: "center", color: "var(--text-muted)", padding: "8px" }}>ບໍ່ມີຂໍ້ມູນ / No data</td></tr>
                    ) : (
                      pl.demographics.nationalities.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ padding: "6px", fontWeight: "600" }}>{item.name}</td>
                          <td style={{ padding: "6px", textAlign: "right", fontWeight: "700" }}>{item.count}</td>
                        </tr>
                      ))
                    )}
                    <tr style={{ background: "#f1f5f9", fontWeight: "bold" }}>
                      <td style={{ padding: "6px" }}>ຍອດລວມທັງໝົດ / Total</td>
                      <td style={{ padding: "6px", textAlign: "right", color: "var(--primary)" }}>{pl.paxCount}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Activity Breakdown */}
              <div style={{ border: "1px solid var(--border-color)", borderRadius: "8px", background: "var(--card-bg, #ffffff)", padding: "1rem" }}>
                <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "0.9rem", color: "var(--text-primary)", borderBottom: "1.5px solid var(--border-color)", paddingBottom: "6px" }}>
                  🛶 ແຍກຕາມກິດຈະກຳ (By Activity/Service)
                </h4>
                <table style={{ margin: 0, fontSize: "0.8rem", width: "100%" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th style={{ padding: "6px" }}>ກິດຈະກຳ / Service</th>
                      <th style={{ padding: "6px", textAlign: "right" }}>ຈຳນວນ / Pax</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pl.demographics.activities.length === 0 ? (
                      <tr><td colSpan="2" style={{ textAlign: "center", color: "var(--text-muted)", padding: "8px" }}>ບໍ່ມີຂໍ້ມູນ / No data</td></tr>
                    ) : (
                      pl.demographics.activities.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ padding: "6px", fontWeight: "600" }}>{item.name.split(" / ")[0]}</td>
                          <td style={{ padding: "6px", textAlign: "right", fontWeight: "700" }}>{item.count}</td>
                        </tr>
                      ))
                    )}
                    <tr style={{ background: "#f1f5f9", fontWeight: "bold" }}>
                      <td style={{ padding: "6px" }}>ຍອດລວມທັງໝົດ / Total</td>
                      <td style={{ padding: "6px", textAlign: "right", color: "var(--primary)" }}>{pl.paxCount}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Source Breakdown */}
              <div style={{ border: "1px solid var(--border-color)", borderRadius: "8px", background: "var(--card-bg, #ffffff)", padding: "1rem" }}>
                <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "0.9rem", color: "var(--text-primary)", borderBottom: "1.5px solid var(--border-color)", paddingBottom: "6px" }}>
                  🔌 ແຍกຕາມແຫຼ່ງທີ່ມາ (By Referral Source)
                </h4>
                <table style={{ margin: 0, fontSize: "0.8rem", width: "100%" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th style={{ padding: "6px" }}>ແຫຼ່ງທີ່ມາ / Agent</th>
                      <th style={{ padding: "6px", textAlign: "right" }}>ຈຳນວນ / Pax</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pl.demographics.sources.length === 0 ? (
                      <tr><td colSpan="2" style={{ textAlign: "center", color: "var(--text-muted)", padding: "8px" }}>ບໍ່ມີຂໍ້ມູນ / No data</td></tr>
                    ) : (
                      pl.demographics.sources.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ padding: "6px", fontWeight: "600" }}>{item.name}</td>
                          <td style={{ padding: "6px", textAlign: "right", fontWeight: "700" }}>{item.count}</td>
                        </tr>
                      ))
                    )}
                    <tr style={{ background: "#f1f5f9", fontWeight: "bold" }}>
                      <td style={{ padding: "6px" }}>ຍອດລວມທັງໝົດ / Total</td>
                      <td style={{ padding: "6px", textAlign: "right", color: "var(--primary)" }}>{pl.paxCount}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>
          </div>

          {/* 5. Passenger Register List (Step 12, part 6) */}
          <div style={{ flex: "1 1 100%", marginTop: "1.5rem" }}>
            <h3 style={{ fontSize: "1rem", color: "var(--primary)", marginBottom: "0.75rem" }}>
              5. ລາຍຊື່ລູກຄ້າທັງໝົດ / Passenger Details Audit List
            </h3>
            <div style={{ overflowX: "auto", border: "1px solid var(--border-color)", borderRadius: "8px" }}>
              <table style={{ margin: 0, fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th>ຊື່ລູກຄ້າ / Full Name</th>
                    <th>ສັນຊາດ / Nationality</th>
                    <th>ເບີໂທ / Phone</th>
                    <th>ອາຍຸ / Age</th>
                    <th>ລະຫັດກຸ່ມ / Group Code</th>
                    <th>ວັນທີ / Date</th>
                    <th>ແຫຼ່ງທີ່ມາ / Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const { customers } = getFilteredData();
                    if (!customers || customers.length === 0) {
                      return (
                        <tr>
                          <td colSpan="7" style={{ textAlign: "center", color: "var(--text-muted)", padding: "15px" }}>
                            ບໍ່ມີລາຍການລູກຄ້າໃນໄລຍະເວລານີ້ / No passenger records
                          </td>
                        </tr>
                      );
                    }
                    return customers.map((c, idx) => {
                      const bk = db.bookings.find(b => b.id === c.bookingId || b.groupId === c.groupId);
                      return (
                        <tr key={c.id || idx}>
                          <td style={{ fontWeight: "600" }}>{c.name}</td>
                          <td>{c.nationality || "-"}</td>
                          <td>{c.phone || "-"}</td>
                          <td>{c.age || "-"}</td>
                          <td style={{ fontWeight: "700", color: "var(--primary)" }}>{c.groupId}</td>
                          <td>{c.checkInDate}</td>
                          <td>{bk ? bk.partnerName : "Walk-in"}</td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
      </div>
      
      {/* --------------------- HIDDEN PRINTABLE PROFIT & LOSS REPORT --------------------- */}
      <div className="printable-area">
        <div className="reports-print">
          <div style={{ textAlign: "center", borderBottom: "2px solid #000", paddingBottom: "10px", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "bold", margin: 0 }}>ລາຍງານກຳໄລ - ຂາດທຶນ / PROFIT & LOSS STATEMENT</h2>
            <span style={{ fontSize: "11px" }}>TADFANE RAFTING / ຕາດຟານ ລ່ອງແກ່ງ - ACCOUNTING DEPARTMENT</span>
          </div>

          <div style={{ marginBottom: "15px", fontSize: "11px" }}>
            <strong>ປະເພດລາຍງານ / Report Type:</strong> {reportType === "daily" ? "ລາຍວັນ (Daily)" : reportType === "monthly" ? "ລາຍເດືອນ (Monthly)" : "ລາຍປີ (Yearly)"}<br />
            <strong>ປະຈຳວັນທີ/ເດືອນ/ປີ / Period:</strong> {reportType === "daily" ? selectedDate : reportType === "monthly" ? selectedMonth : selectedYear}
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", marginBottom: "25px" }}>
            <thead>
              <tr style={{ background: "#e2e8f0" }}>
                <th style={{ border: "1px solid #000", padding: "8px", textAlign: "left" }}>ລາຍການ / Description</th>
                <th style={{ border: "1px solid #000", padding: "8px", textAlign: "right" }}>ຍອດລວມ (LAK)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: "1px solid #000", padding: "8px", fontWeight: "bold" }}>ລາຍຮັບຈາກການຂາຍປີ້ (Ticket Revenues)</td>
                <td style={{ border: "1px solid #000", padding: "8px", textAlign: "right", color: "green", fontWeight: "bold" }}>{formatLAK(pl.grossRevenue)}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "8px" }}>ຄ່າຄອມມິດຊັນເອເຈນສະສົມ (Agent Commissions Expense)</td>
                <td style={{ border: "1px solid #000", padding: "8px", textAlign: "right", color: "red" }}>-{formatLAK(pl.totalCommissions)}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "8px" }}>ຄ່າຈ່າຍແລະເງິນເດືອນພະນັກງານ (Employee Payroll Expenses)</td>
                <td style={{ border: "1px solid #000", padding: "8px", textAlign: "right", color: "red" }}>-{formatLAK(pl.totalEmployeePayroll)}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "8px" }}>ຄ່ານ້ຳມັນເຊື້ອໄຟເຮືອ (Boat Fuel Expenses)</td>
                <td style={{ border: "1px solid #000", padding: "8px", textAlign: "right", color: "red" }}>-{formatLAK(pl.totalFuelCost)}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "8px" }}>ຄ່າຊ່ອມບຳລຸງເຮືອ (Wear & Tear Expenses)</td>
                <td style={{ border: "1px solid #000", padding: "8px", textAlign: "right", color: "red" }}>-{formatLAK(pl.totalMaintCost)}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "8px" }}>ຄ່າເຊົ່າຫ້ອງການ ແລະ ຄ່າໃຊ້ຈ່າຍຄົງທີ່ (Fixed Costs)</td>
                <td style={{ border: "1px solid #000", padding: "8px", textAlign: "right", color: "red" }}>-{formatLAK(pl.fixedCosts)}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "8px" }}>ລາຍຈ່າຍທົ່ວໄປ/ອື່ນໆ (Other Custom Expenses)</td>
                <td style={{ border: "1px solid #000", padding: "8px", textAlign: "right", color: "red" }}>-{formatLAK(pl.totalCustomExpenses)}</td>
              </tr>
              <tr style={{ background: "#cbd5e1", fontWeight: "bold" }}>
                <td style={{ border: "1px solid #000", padding: "8px" }}>ກຳໄລສຸດທິ / Net Income</td>
                <td style={{ border: "1px solid #000", padding: "8px", textAlign: "right", color: pl.netProfit >= 0 ? "green" : "red", fontSize: "12px" }}>
                  {formatLAK(pl.netProfit)}
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: "15px", fontSize: "11px" }}>
            <strong>ສະຖິຕິການດຳເນີນງານ / Operational Stats:</strong><br />
            - ຈຳນວນທ່ຽວເຮືອທີ່ອອກ (Trips Run): {pl.tripsCount} ທ່ຽວ<br />
            - ຈຳນວນລູກຄ້າສະສົມ (Pax Count): {pl.paxCount} ຄົນ
          </div>

          {/* Printable Disbursements Breakdown */}
          <div style={{ marginTop: "25px" }}>
            <h3 style={{ fontSize: "12px", fontWeight: "bold", borderBottom: "1px solid #000", paddingBottom: "5px", marginBottom: "10px" }}>
              ລາຍລະອຽດການຈ່າຍຄ່າຄອມມິດຊັນເອເຈນ / Agent Commissions Breakdown
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px", marginBottom: "15px" }}>
              <thead>
                <tr style={{ background: "#e2e8f0" }}>
                  <th style={{ border: "1px solid #000", padding: "5px", textAlign: "left" }}>ຊື່ຄູ່ຄ້າ / Partner</th>
                  <th style={{ border: "1px solid #000", padding: "5px", textAlign: "left" }}>ປະເພດ / Type</th>
                  <th style={{ border: "1px solid #000", padding: "5px", textAlign: "center" }}>ຈຳນວນ / Pax</th>
                  <th style={{ border: "1px solid #000", padding: "5px", textAlign: "right" }}>ລວມຄ່າຄອມ / Commission (LAK)</th>
                </tr>
              </thead>
              <tbody>
                {pl.partnerDisbursements.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ border: "1px solid #000", padding: "5px", textAlign: "center" }}>ບໍ່ມີລາຍການ / No records</td>
                  </tr>
                ) : (
                  pl.partnerDisbursements.map((p, idx) => (
                    <tr key={idx}>
                      <td style={{ border: "1px solid #000", padding: "5px" }}>{p.name}</td>
                      <td style={{ border: "1px solid #000", padding: "5px" }}>{p.type === "company" ? "ບໍລິສັດ" : "ເອເຈນ"}</td>
                      <td style={{ border: "1px solid #000", padding: "5px", textAlign: "center" }}>{p.paxCount}</td>
                      <td style={{ border: "1px solid #000", padding: "5px", textAlign: "right", fontWeight: "bold" }}>{formatLAK(p.commission)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <h3 style={{ fontSize: "12px", fontWeight: "bold", borderBottom: "1px solid #000", paddingBottom: "5px", marginBottom: "10px", marginTop: "20px" }}>
              ລາຍລະອຽດລາຍໄດ້ພະນັກງານ / Employee Payroll Breakdown
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
              <thead>
                <tr style={{ background: "#e2e8f0" }}>
                  <th style={{ border: "1px solid #000", padding: "5px", textAlign: "left" }}>ຊື່ພະນັກງານ / Employee</th>
                  <th style={{ border: "1px solid #000", padding: "5px", textAlign: "right" }}>ເງິນເດືອນ / Base</th>
                  <th style={{ border: "1px solid #000", padding: "5px", textAlign: "center" }}>ຈຳນວນທ່ຽວ / Trips</th>
                  <th style={{ border: "1px solid #000", padding: "5px", textAlign: "right" }}>ເງິນທ່ຽວ / Trip Pay</th>
                  <th style={{ border: "1px solid #000", padding: "5px", textAlign: "right" }}>ໂບນັດ / Bonus</th>
                  <th style={{ border: "1px solid #000", padding: "5px", textAlign: "right" }}>ຍອດລວມ / Total (LAK)</th>
                </tr>
              </thead>
              <tbody>
                {pl.employeeDisbursements.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ border: "1px solid #000", padding: "5px", textAlign: "center" }}>ບໍ່ມີລາຍການ / No records</td>
                  </tr>
                ) : (
                  pl.employeeDisbursements.map((emp, idx) => (
                    <tr key={idx}>
                      <td style={{ border: "1px solid #000", padding: "5px" }}>{emp.name} ({emp.role})</td>
                      <td style={{ border: "1px solid #000", padding: "5px", textAlign: "right" }}>{formatLAK(emp.baseSalary)}</td>
                      <td style={{ border: "1px solid #000", padding: "5px", textAlign: "center" }}>{emp.tripCount}</td>
                      <td style={{ border: "1px solid #000", padding: "5px", textAlign: "right" }}>{formatLAK(emp.tripPay)}</td>
                      <td style={{ border: "1px solid #000", padding: "5px", textAlign: "right" }}>{formatLAK(emp.bonus)}</td>
                      <td style={{ border: "1px solid #000", padding: "5px", textAlign: "right", fontWeight: "bold" }}>{formatLAK(emp.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <h3 style={{ fontSize: "12px", fontWeight: "bold", borderBottom: "1px solid #000", paddingBottom: "5px", marginBottom: "10px", marginTop: "20px" }}>
              ລາຍຈ່າຍທົ່ວໄປ/ອື່ນໆ / Other Custom Expenses Breakdown
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
              <thead>
                <tr style={{ background: "#e2e8f0" }}>
                  <th style={{ border: "1px solid #000", padding: "5px", textAlign: "left" }}>ວັນທີ / Date</th>
                  <th style={{ border: "1px solid #000", padding: "5px", textAlign: "left" }}>ໝວດໝູ່ / Category</th>
                  <th style={{ border: "1px solid #000", padding: "5px", textAlign: "left" }}>ຄຳອະທິບາຍ / Description</th>
                  <th style={{ border: "1px solid #000", padding: "5px", textAlign: "right" }}>ຍອດເງິນ / Amount (LAK)</th>
                </tr>
              </thead>
              <tbody>
                {pl.periodCustomExpenses && pl.periodCustomExpenses.length > 0 ? (
                  pl.periodCustomExpenses.map((exp, idx) => (
                    <tr key={idx}>
                      <td style={{ border: "1px solid #000", padding: "5px" }}>{exp.date}</td>
                      <td style={{ border: "1px solid #000", padding: "5px" }}>{exp.category}</td>
                      <td style={{ border: "1px solid #000", padding: "5px" }}>{exp.description}</td>
                      <td style={{ border: "1px solid #000", padding: "5px", textAlign: "right", color: "red" }}>-{formatLAK(exp.amount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ border: "1px solid #000", padding: "5px", textAlign: "center" }}>ບໍ່ມີລາຍຈ່າຍອື່ນໆ / No entries</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Printable Demographics Breakdown */}
            <h3 style={{ fontSize: "12px", fontWeight: "bold", borderBottom: "1px solid #000", paddingBottom: "5px", marginBottom: "10px", marginTop: "20px" }}>
              ສະຖິຕິຜູ້ໂດຍສານແຍກປະເພດ / Passenger Demographics Breakdown
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "20px" }}>
              {/* Nationalities */}
              <div style={{ border: "1px solid #000", padding: "5px" }}>
                <div style={{ fontWeight: "bold", fontSize: "9px", borderBottom: "1px solid #000", marginBottom: "5px" }}>ສັນຊາດ / Nationalities</div>
                <table style={{ width: "100%", fontSize: "8px", borderCollapse: "collapse" }}>
                  <tbody>
                    {pl.demographics.nationalities.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.name}</td>
                        <td style={{ textAlign: "right", fontWeight: "bold" }}>{item.count}</td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: "bold", borderTop: "1px solid #000" }}>
                      <td>ລວມ / Total</td>
                      <td style={{ textAlign: "right" }}>{pl.paxCount}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Activities */}
              <div style={{ border: "1px solid #000", padding: "5px" }}>
                <div style={{ fontWeight: "bold", fontSize: "9px", borderBottom: "1px solid #000", marginBottom: "5px" }}>ກິດຈະກຳ / Activities</div>
                <table style={{ width: "100%", fontSize: "8px", borderCollapse: "collapse" }}>
                  <tbody>
                    {pl.demographics.activities.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.name.split(" / ")[0]}</td>
                        <td style={{ textAlign: "right", fontWeight: "bold" }}>{item.count}</td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: "bold", borderTop: "1px solid #000" }}>
                      <td>ລວມ / Total</td>
                      <td style={{ textAlign: "right" }}>{pl.paxCount}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Sources */}
              <div style={{ border: "1px solid #000", padding: "5px" }}>
                <div style={{ fontWeight: "bold", fontSize: "9px", borderBottom: "1px solid #000", marginBottom: "5px" }}>ແຫຼ່ງທີ່ມາ / Sources</div>
                <table style={{ width: "100%", fontSize: "8px", borderCollapse: "collapse" }}>
                  <tbody>
                    {pl.demographics.sources.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.name}</td>
                        <td style={{ textAlign: "right", fontWeight: "bold" }}>{item.count}</td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: "bold", borderTop: "1px solid #000" }}>
                      <td>ລວມ / Total</td>
                      <td style={{ textAlign: "right" }}>{pl.paxCount}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "40px", display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
            <div>
              Prepared by: _______________________<br />
              Accountant / ເຈົ້າໜ້າທີ່ບັນຊີ
            </div>
            <div style={{ textAlign: "right" }}>
              Approved by: _______________________<br />
              General Manager / ຜູ້ຈັດການທົ່ວໄປ
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
