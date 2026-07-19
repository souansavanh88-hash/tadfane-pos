// Dashboard.jsx - Main Dashboard View
import React, { useEffect, useState } from "react";
import { useLanguage } from "../utils/LanguageContext";
import { getDb } from "../db/mockDb";
import { formatLAK, formatTHB, formatUSD, formatDate, getLocalDateStr } from "../utils/helpers";
import { 
  Users, 
  CircleDollarSign, 
  CalendarCheck, 
  Ship, 
  Percent, 
  UserCheck, 
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Car
} from "lucide-react";

export default function Dashboard({ setActiveTab, onSelectTrip, onViewBill, userRole }) {
  const { lang, t } = useLanguage();
  const [db, setDb] = useState(getDb());
  const [activeModal, setActiveModal] = useState(null);
  const localDateStr = getLocalDateStr();
  const [conStartMonth, setConStartMonth] = useState(localDateStr.slice(0, 7));
  const [conEndMonth, setConEndMonth] = useState(localDateStr.slice(0, 7));
  const [conAccountType, setConAccountType] = useState("all");
  const [hideInactiveDays, setHideInactiveDays] = useState(true);
  const [modalDate, setModalDate] = useState(localDateStr);
  const [modalMonth, setModalMonth] = useState(localDateStr.slice(0, 7));
  const [stats, setStats] = useState({
    paxToday: 0,
    revToday: 0,
    revMonth: 0,
    tripsCount: 0,
    commissionsDue: 0,
    guidePayDue: 0,
    driverPayDue: 0,
    expensesToday: 0,
    expensesMonth: 0,
    monthlySalaries: 0,
    cashToday: 0,
    transferToday: 0,
    cardToday: 0,
    debtToday: 0,
    discountToday: 0,
    billsToday: 0,
    guideCommissionsMonth: 0,
    driverWagesMonth: 0
  });

  useEffect(() => {
    const handleDbUpdate = () => {
      const data = getDb();
      setDb(data);
      calculateStats(data);
    };
    handleDbUpdate();
    window.addEventListener("db-update", handleDbUpdate);
    return () => window.removeEventListener("db-update", handleDbUpdate);
  }, []);

  const calculateStats = (database) => {
    const todayStr = getLocalDateStr();
    const monthStr = todayStr.slice(0, 7); // YYYY-MM
    
    // O(1) lookup maps to prevent browser freezing
    const validBookingsMap = new Map();
    const bookingPricesMap = new Map();
    
    (database.bookings || []).forEach(b => {
      if (b.status !== "ยกเลิก" && b.status !== "ຍົກເລີກ") {
        validBookingsMap.set(b.id, true);
        if (b.groupId) validBookingsMap.set(b.groupId, true);
        bookingPricesMap.set(b.id, (b.pricePaidLAK || 0) / (b.paxCount || 1));
      }
    });

    const filterValidCustomer = (c) => {
      if (c.bookingId && validBookingsMap.has(c.bookingId)) return true;
      if (c.groupId && validBookingsMap.has(c.groupId)) return true;
      return !c.bookingId && !c.groupId; // walk-in
    };

    // 1. Today's customers
    const todayCusts = (database.customers || []).filter(c => c.checkInDate === todayStr && filterValidCustomer(c));
    const paxToday = todayCusts.length;

    // 2. Revenue (Assuming basePriceLAK for walk-ins, and specific paid price for bookings)
    const basePrice = database.settings?.basePriceLAK || 250000;
    
    const calculateCustomerRev = (cust) => {
      if (cust.bookingId && bookingPricesMap.has(cust.bookingId)) {
        return bookingPricesMap.get(cust.bookingId);
      }
      return basePrice;
    };

    const revToday = todayCusts.reduce((sum, c) => sum + calculateCustomerRev(c), 0);
    
    const monthCusts = (database.customers || []).filter(c => c.checkInDate && c.checkInDate.startsWith(monthStr) && filterValidCustomer(c));
    const revMonth = monthCusts.reduce((sum, c) => sum + calculateCustomerRev(c), 0);

    // 3. Trips today
    const todayTrips = database.trips.filter(t => t.date === todayStr);
    const tripsCount = todayTrips.length;

    // 4. Today's bookings/bills count
    const todayBookings = database.bookings.filter(b => b.date === todayStr && b.status !== "ยกเลิก" && b.status !== "ຍົກເລີກ");
    const billsToday = todayBookings.length;

    // 5. Cash vs Transfer vs Card Payment breakdown today + Debt tracking
    const getBookingNetRevPerPax = (bk) => {
      const net = bk.netPriceLAK !== undefined ? bk.netPriceLAK : bk.pricePaidLAK;
      return net / (bk.paxCount || 1);
    };

    const cashToday = todayCusts.reduce((sum, c) => {
      if (c.bookingId) {
        const bk = database.bookings.find(b => b.id === c.bookingId);
        if (bk && (bk.paymentMethod === "cash" || !bk.paymentMethod)) {
          return sum + getBookingNetRevPerPax(bk);
        }
      }
      return sum;
    }, 0);

    const transferToday = todayCusts.reduce((sum, c) => {
      if (c.bookingId) {
        const bk = database.bookings.find(b => b.id === c.bookingId);
        if (bk && (bk.paymentMethod === "transfer" || bk.paymentMethod === "qr" || bk.paymentMethod === "bank")) {
          return sum + getBookingNetRevPerPax(bk);
        }
      }
      return sum;
    }, 0);

    const cardToday = todayCusts.reduce((sum, c) => {
      if (c.bookingId) {
        const bk = database.bookings.find(b => b.id === c.bookingId);
        if (bk && bk.paymentMethod === "card") {
          return sum + getBookingNetRevPerPax(bk);
        }
      }
      return sum;
    }, 0);

    const debtToday = todayBookings.reduce((sum, bk) => sum + (bk.debtLAK || 0), 0);
    const discountToday = todayBookings.reduce((sum, bk) => sum + (bk.discountLAK || 0), 0);

    // 6. Partner commissions today vs month
    let commissionsDue = 0;
    database.customers.forEach(cust => {
      if (cust.partnerId) {
        const partner = database.partners.find(p => p.id === cust.partnerId);
        if (partner) {
          commissionsDue += partner.commissionRate;
        }
      }
    });

    let todayCommissions = 0;
    todayCusts.forEach(c => {
      if (c.partnerId) {
        const partner = database.partners.find(p => p.id === c.partnerId);
        if (partner) todayCommissions += partner.commissionRate;
      }
    });

    let monthCommissions = 0;
    monthCusts.forEach(c => {
      if (c.partnerId) {
        const partner = database.partners.find(p => p.id === c.partnerId);
        if (partner) monthCommissions += partner.commissionRate;
      }
    });

    // 7. Crew trip wages today vs month (Aligned with guide tourRate / raftingRate / specialRate)
    let todayCrewWages = 0;
    let guidePayDue = 0;
    let driverPayDue = 0;
    let guideCommissionsMonth = 0;
    let driverWagesMonth = 0;
    let monthCrewWages = 0;

    const completedOrDispatchedTripsToday = database.trips.filter(t => t.date === todayStr && (t.status === "completed" || t.status === "dispatched"));
    completedOrDispatchedTripsToday.forEach(trip => {
      if (trip.guideIds) {
        trip.guideIds.forEach(gid => {
          const emp = database.employees.find(e => e.id === gid);
          if (emp) {
            let payout = emp.tripRate || 50000;
            if (emp.role === "guide") {
              let baseRate = (emp.tourRate !== undefined && emp.tourRate > 0) ? emp.tourRate : 100000;
              if (trip.bookingId) {
                const bk = database.bookings.find(b => b.id === trip.bookingId);
                if (bk && (bk.serviceId === "SRV-001" || bk.serviceId === "SRV-002" || bk.serviceId === "SRV-005")) {
                  baseRate = (emp.raftingRate !== undefined && emp.raftingRate > 0) ? emp.raftingRate : 150000;
                }
              }
              payout = baseRate + (emp.specialRate || 0);
            }
            todayCrewWages += payout;
            guidePayDue += payout;
          }
        });
      }
      const tripCaptainIds = trip.captainIds || (trip.captainId ? [trip.captainId] : []);
      tripCaptainIds.forEach(cid => {
        const emp = database.employees.find(e => e.id === cid);
        if (emp) todayCrewWages += emp.tripRate;
      });
      if (trip.driverIds) {
        trip.driverIds.forEach(did => {
          const emp = database.employees.find(e => e.id === did);
          if (emp) {
            const payout = (emp.tripRate !== undefined && emp.tripRate > 0) ? emp.tripRate : 100000;
            todayCrewWages += payout;
            driverPayDue += payout;
          }
        });
      }
    });

    const monthTrips = database.trips.filter(t => t.date && t.date.startsWith(monthStr) && (t.status === "completed" || t.status === "dispatched"));
    monthTrips.forEach(trip => {
      if (trip.guideIds) {
        trip.guideIds.forEach(gid => {
          const emp = database.employees.find(e => e.id === gid);
          if (emp) {
            let payout = emp.tripRate || 50000;
            if (emp.role === "guide") {
              let baseRate = (emp.tourRate !== undefined && emp.tourRate > 0) ? emp.tourRate : 100000;
              if (trip.bookingId) {
                const bk = database.bookings.find(b => b.id === trip.bookingId);
                if (bk && (bk.serviceId === "SRV-001" || bk.serviceId === "SRV-002" || bk.serviceId === "SRV-005")) {
                  baseRate = (emp.raftingRate !== undefined && emp.raftingRate > 0) ? emp.raftingRate : 150000;
                }
              }
              payout = baseRate + (emp.specialRate || 0);
            }
            monthCrewWages += payout;
            guideCommissionsMonth += payout;
          }
        });
      }
      const tripCaptainIds = trip.captainIds || (trip.captainId ? [trip.captainId] : []);
      tripCaptainIds.forEach(cid => {
        const emp = database.employees.find(e => e.id === cid);
        if (emp) monthCrewWages += emp.tripRate;
      });
      if (trip.driverIds) {
        trip.driverIds.forEach(did => {
          const emp = database.employees.find(e => e.id === did);
          if (emp) {
            const payout = (emp.tripRate !== undefined && emp.tripRate > 0) ? emp.tripRate : 100000;
            monthCrewWages += payout;
            driverWagesMonth += payout;
          }
        });
      }
    });

    // 8. Monthly Salaries (including daily wages, OT, commissions, and bonuses)
    const monthlySalaries = database.employees.reduce((sum, e) => {
      const isFreelance = e.type === "freelance";
      const salaryAmt = isFreelance ? 0 : (e.salary || 0);
      const dailyWagePay = (e.dailyWage || 0) * (e.daysWorked !== undefined ? e.daysWorked : 26);
      const otPay = e.ot || 0;
      const commissionPay = e.commission || 0;
      const bonusPay = e.bonus || 0;
      return sum + salaryAmt + dailyWagePay + otPay + commissionPay + bonusPay;
    }, 0);

    // 9. Rent & Salaries (Today prorated)
    const todayFuelMaint = completedOrDispatchedTripsToday.length * (150000 + 30000);
    const todayRent = 1200000 / 30;
    const todaySalaries = monthlySalaries / 30;

    // 10. Rent & Salaries (Month)
    const monthFuelMaint = monthTrips.length * (150000 + 30000);
    const monthRent = 1200000;

    // 11. Custom Expenses Today vs Month
    const approvedCustomToday = database.customExpenses.filter(e => e.date === todayStr && e.status === "Approved").reduce((sum, e) => sum + e.amount, 0);
    const approvedCustomMonth = database.customExpenses.filter(e => e.date && e.date.startsWith(monthStr) && e.status === "Approved").reduce((sum, e) => sum + e.amount, 0);

    const expensesToday = approvedCustomToday + todayCommissions + todayCrewWages + todayFuelMaint + todayRent + todaySalaries;
    const expensesMonth = approvedCustomMonth + monthCommissions + monthCrewWages + monthFuelMaint + monthRent + monthlySalaries;

    setStats({
      paxToday,
      revToday,
      revMonth,
      tripsCount,
      commissionsDue,
      guidePayDue,
      driverPayDue,
      monthlySalaries,
      expensesToday,
      expensesMonth,
      cashToday,
      transferToday,
      cardToday,
      debtToday,
      discountToday,
      billsToday,
      guideCommissionsMonth,
      driverWagesMonth
    });
  };

  const getConsolidatedLedger = () => {
    if (!conStartMonth || !conEndMonth) return [];

    const startYear = parseInt(conStartMonth.split("-")[0]);
    const startMonth = parseInt(conStartMonth.split("-")[1]);
    const endYear = parseInt(conEndMonth.split("-")[0]);
    const endMonth = parseInt(conEndMonth.split("-")[1]);

    const startDate = new Date(startYear, startMonth - 1, 1);
    const endDate = new Date(endYear, endMonth, 0); // last day of end month

    const ledger = [];
    const basePrice = db.settings.basePriceLAK;
    const totalBaseSalaries = db.employees.filter(e => e.type === "permanent").reduce((sum, e) => sum + e.salary, 0);

    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split("T")[0];

      // Pax and Revenue
      const dayCusts = db.customers.filter(c => {
        if (c.checkInDate !== dateStr) return false;
        const bk = db.bookings?.find(b => b.id === c.bookingId || b.groupId === c.groupId);
        return bk ? bk.status !== "ยกเลิก" : true;
      });
      const pax = dayCusts.length;

      const revenue = dayCusts.reduce((sum, c) => {
        if (c.bookingId) {
          const bk = db.bookings.find(b => b.id === c.bookingId);
          if (bk) return sum + (bk.pricePaidLAK / (bk.paxCount || 1));
        }
        return sum + basePrice;
      }, 0);

      // Commissions
      let commissions = 0;
      dayCusts.forEach(c => {
        if (c.partnerId) {
          const partner = db.partners.find(p => p.id === c.partnerId);
          if (partner) commissions += partner.commissionRate;
        }
      });

      // Crew Pay
      let crewPay = 0;
      const dayTrips = db.trips.filter(t => t.date === dateStr && (t.status === "completed" || t.status === "dispatched"));
      dayTrips.forEach(trip => {
        if (trip.guideIds) {
          trip.guideIds.forEach(gid => {
            const emp = db.employees.find(e => e.id === gid);
            if (emp) crewPay += emp.tripRate;
          });
        }
        const tripCaptainIds = trip.captainIds || (trip.captainId ? [trip.captainId] : []);
        tripCaptainIds.forEach(cid => {
          const emp = db.employees.find(e => e.id === cid);
          if (emp) crewPay += emp.tripRate;
        });
        if (trip.driverIds) {
          trip.driverIds.forEach(did => {
            const emp = db.employees.find(e => e.id === did);
            if (emp) crewPay += emp.tripRate;
          });
        }
      });

      // Salaries prorated
      const salaries = totalBaseSalaries / 30;

      // Operations (Fuel + Maintenance + Office rent prorated)
      const operations = (dayTrips.length * (150000 + 30000)) + (1200000 / 30);

      const totalExpenses = commissions + crewPay + salaries + operations;
      const netProfit = revenue - totalExpenses;

      ledger.push({
        date: dateStr,
        pax,
        revenue,
        commissions,
        crewPay,
        salaries,
        operations,
        totalExpenses,
        netProfit
      });

      current.setDate(current.getDate() + 1);
    }

    return ledger;
  };

  const exchangeRates = db.settings;
  const isFinanceVisible = userRole === "admin" || userRole === "accounting" || userRole === "owner";

  // Active boat deployments
  const activeTrips = db.trips.filter(t => t.status === "dispatched");

  const getSystemAlerts = () => {
    const alerts = [];
    const todayStr = getLocalDateStr();
    
    // 1. Ready bookings count
    const readyBks = (db.bookings || []).filter(
      b => b.status === "พร้อมชำระเงิน / พร้อมพิมพ์" ||
           b.status === "รอชำระเงิน" ||
           b.status === "พร้อมชำระเงิน" ||
           b.status === "รอຊຳລະເງິນ" ||
           b.status === "กรอกข้อมูลเรียบร้อย"
    );
    if (readyBks.length > 0) {
      alerts.push(`⚠️ ລູກຄ້າລໍຖ້າຊຳລະເງິນ ${readyBks.length} ບິນ / ${readyBks.length} Bills Pending Payment`);
    }
    
    // 2. Boat capacity alert
    const todayDispatchedTrips = (db.trips || []).filter(t => t.date === todayStr && t.status === "dispatched");
    todayDispatchedTrips.forEach(trip => {
      const boat = db.boats.find(b => b.id === trip.boatId);
      if (boat) {
        const paxCount = trip.customerIds.length;
        const remaining = boat.capacity - paxCount;
        if (remaining <= 2 && remaining > 0) {
          alerts.push(`⚠️ ${boat.name} ໃກ້ຈະເຕັມແລ້ວ (ເຫຼືອ ${remaining} ບ່ອນ) / ${boat.name} is almost full (${remaining} seats left)`);
        }
      }
    });

    // 3. Time slot capacity alert
    const slots = {};
    (db.bookings || []).filter(b => b.date === todayStr && b.status !== "ยกเลิก" && b.status !== "ຍົກເລີກ").forEach(b => {
      slots[b.time] = (slots[b.time] || 0) + b.paxCount;
    });
    Object.keys(slots).forEach(time => {
      const maxSlotCapacity = 12; // 2 boats
      const current = slots[time];
      const left = maxSlotCapacity - current;
      if (left <= 3 && left > 0) {
        alerts.push(`⚠️ ຮອບເວລາ ${time} ເຫຼືອທີ່ວ່າງ ${left} ຄົນ / Time slot ${time} has only ${left} seats left`);
      }
    });

    return alerts;
  };

  const systemAlerts = getSystemAlerts();

  const get7DayChartData = () => {
    const data = [];
    const basePrice = db.settings?.basePriceLAK || 250000;
    
    // Create map of booking prices for quick lookup
    const bookingPricesMap = new Map();
    (db.bookings || []).forEach(b => {
      if (b.status !== "ยกเลิก" && b.status !== "ຍົກເລີກ") {
        bookingPricesMap.set(b.id, (b.pricePaidLAK || 0) / (b.paxCount || 1));
      }
    });

    const validBookingsMap = new Map();
    (db.bookings || []).forEach(b => {
      if (b.status !== "ยกเลิก" && b.status !== "ຍົກເລີກ") {
        validBookingsMap.set(b.id, true);
        if (b.groupId) validBookingsMap.set(b.groupId, true);
      }
    });

    const filterValidCustomer = (c) => {
      if (c.bookingId && validBookingsMap.has(c.bookingId)) return true;
      if (c.groupId && validBookingsMap.has(c.groupId)) return true;
      return !c.bookingId && !c.groupId;
    };

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      
      const dayCusts = (db.customers || []).filter(c => c.checkInDate === dateStr && filterValidCustomer(c));
      const pax = dayCusts.length;
      
      const revenue = dayCusts.reduce((sum, c) => {
        if (c.bookingId && bookingPricesMap.has(c.bookingId)) {
          return sum + bookingPricesMap.get(c.bookingId);
        }
        return sum + basePrice;
      }, 0);

      // Label as DD/MM
      const label = dateStr.slice(8, 10) + "/" + dateStr.slice(5, 7);
      data.push({ dateStr, label, pax, revenue });
    }
    return data;
  };

  const chartData = get7DayChartData();

  return (
    <div>
      <div className="no-print">
        <div className="page-header">
        <div className="page-title">
          <h1>{t("dashboard_title", "ແຜງຄວບຄຸມ")}</h1>
          <p>ພາບລວມການດຳເນີນງານປະຈຳວัน ແລະ ລາຍຮັບເຮືອທ່ອງທ່ຽວ</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }} className="no-print">
          {(userRole === "admin" || userRole === "sales") && (
            <button className="btn btn-primary" onClick={() => setActiveTab("checkin-tickets")}>
              Check-In ໃໝ່
            </button>
          )}
        </div>
      </div>

      {/* Warnings Banner */}
      {systemAlerts.length > 0 && (
        <div style={{
          background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
          border: "1.5px solid #f59e0b",
          color: "#b45309",
          padding: "14px 20px",
          borderRadius: "12px",
          marginBottom: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          boxShadow: "0 2px 6px rgba(245, 158, 11, 0.08)"
        }}>
          <strong style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>🔔 ແຈ້ງເຕືອນລະບົບ / System Alerts ({systemAlerts.length}):</span>
          </strong>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.8rem", fontWeight: "600" }}>
            {systemAlerts.map((alertText, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span>•</span>
                <span>{alertText}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Executive Financial Dashboard (Visible only to Admin/Owner/Accounting) */}
      {isFinanceVisible && (
        <div style={{
          background: "linear-gradient(135deg, var(--primary) 0%, #0d9488 100%)",
          color: "#ffffff",
          padding: "24px",
          borderRadius: "16px",
          marginBottom: "1.5rem",
          boxShadow: "0 10px 25px -5px rgba(13, 148, 136, 0.15)",
          display: "flex",
          flexDirection: "column",
          gap: "20px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.15)", paddingBottom: "12px" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#ffffff", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              👑 แผงบริหารสำหรับผู้บริหาร / Executive Owner & Financial Dashboard
            </h2>
            <span style={{ fontSize: "0.75rem", background: "rgba(255, 255, 255, 0.2)", padding: "4px 10px", borderRadius: "20px", fontWeight: "700" }}>
              Owner/Admin View
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
            {/* Today's Stats */}
            <div style={{ background: "rgba(255, 255, 255, 0.08)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <h3 style={{ fontSize: "0.85rem", fontWeight: "700", color: "rgba(255, 255, 255, 0.8)", marginBottom: "12px", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: "4px" }}>
                🎯 การเงินวันนี้ / Today's Financials
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                <div>
                  <span style={{ fontSize: "0.7rem", color: "rgba(255, 255, 255, 0.7)" }}>รายรับ / Revenue</span>
                  <div style={{ fontSize: "1.05rem", fontWeight: "800" }}>{formatLAK(stats.revToday)}</div>
                </div>
                <div>
                  <span style={{ fontSize: "0.7rem", color: "rgba(255, 255, 255, 0.7)" }}>รายจ่าย / Expenses</span>
                  <div style={{ fontSize: "1.05rem", fontWeight: "800", color: "#fecdd3" }}>-{formatLAK(stats.expensesToday)}</div>
                </div>
                <div>
                  <span style={{ fontSize: "0.7rem", color: "rgba(255, 255, 255, 0.7)" }}>กำไร / Net Profit</span>
                  <div style={{ fontSize: "1.05rem", fontWeight: "800", color: (stats.revToday - stats.expensesToday) >= 0 ? "#a7f3d0" : "#fecdd3" }}>
                    {formatLAK(stats.revToday - stats.expensesToday)}
                  </div>
                </div>
              </div>
            </div>

            {/* Month's Stats */}
            <div style={{ background: "rgba(255, 255, 255, 0.08)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <h3 style={{ fontSize: "0.85rem", fontWeight: "700", color: "rgba(255, 255, 255, 0.8)", marginBottom: "12px", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: "4px" }}>
                📅 การเงินเดือนนี้ / Month's Financials
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                <div>
                  <span style={{ fontSize: "0.7rem", color: "rgba(255, 255, 255, 0.7)" }}>รายรับ / Revenue</span>
                  <div style={{ fontSize: "1.05rem", fontWeight: "800" }}>{formatLAK(stats.revMonth)}</div>
                </div>
                <div>
                  <span style={{ fontSize: "0.7rem", color: "rgba(255, 255, 255, 0.7)" }}>รายจ่าย / Expenses</span>
                  <div style={{ fontSize: "1.05rem", fontWeight: "800", color: "#fecdd3" }}>-{formatLAK(stats.expensesMonth)}</div>
                </div>
                <div>
                  <span style={{ fontSize: "0.7rem", color: "rgba(255, 255, 255, 0.7)" }}>กำไร / Net Profit</span>
                  <div style={{ fontSize: "1.05rem", fontWeight: "800", color: (stats.revMonth - stats.expensesMonth) >= 0 ? "#a7f3d0" : "#fecdd3" }}>
                    {formatLAK(stats.revMonth - stats.expensesMonth)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown Summary Section */}
          <div style={{ background: "rgba(0, 0, 0, 0.12)", padding: "12px 16px", borderRadius: "10px", display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.85)" }}>
            <div>
              💼 <strong>ค่าคอมมิชชันสะสม / Guide Commissions:</strong> <span style={{ color: "#ffffff", fontWeight: "700" }}>{formatLAK(stats.guideCommissionsMonth)}</span>
            </div>
            <div>
              🚐 <strong>ค่าแรงคนขับรถ / Driver Wages:</strong> <span style={{ color: "#ffffff", fontWeight: "700" }}>{formatLAK(stats.driverWagesMonth)}</span>
            </div>
            <div>
              👥 <strong>เงินเดือนพนักงาน / Staff Salaries:</strong> <span style={{ color: "#ffffff", fontWeight: "700" }}>{formatLAK(stats.monthlySalaries)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="metrics-grid">
        {/* 1. Passengers Today */}
        <div 
          className="metric-card" 
          style={{ cursor: "pointer", borderLeft: "4px solid #3b82f6" }}
          onClick={() => setActiveModal("paxToday")}
        >
          <div className="metric-icon" style={{ fontSize: "2rem", background: "rgba(59, 130, 246, 0.1)", padding: "10px", borderRadius: "14px" }}>
            👥
          </div>
          <div className="metric-info">
            <h3 style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-secondary)" }}>{t("passengers_today", "ລູກຄ້າວັນນີ້")}</h3>
            <div className="metric-value" style={{ fontSize: "1.6rem" }}>{stats.paxToday} ຄົນ (Pax)</div>
            <div className="metric-subvalue">ລົງທະບຽນທັງໝົດໃນມື້ນີ້</div>
          </div>
        </div>

        {/* 2. Bills Today */}
        <div 
          className="metric-card"
          style={{ cursor: "pointer", borderLeft: "4px solid #f97316" }}
          onClick={() => setActiveTab("checkin-tickets")}
        >
          <div className="metric-icon" style={{ fontSize: "2rem", background: "rgba(249, 117, 22, 0.1)", padding: "10px", borderRadius: "14px" }}>
            🎫
          </div>
          <div className="metric-info">
            <h3 style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-secondary)" }}>{t("total_bills_today", "ບິນທັງໝົດວັນນີ້")}</h3>
            <div className="metric-value" style={{ fontSize: "1.6rem" }}>{stats.billsToday} ບິນ (Bills)</div>
            <div className="metric-subvalue">ບິນທີ່ເປີດຂາຍວັນນີ້</div>
          </div>
        </div>

        {/* 3. Trips Today */}
        <div 
          className="metric-card"
          style={{ cursor: "pointer", borderLeft: "4px solid #06b6d4" }}
          onClick={() => setActiveModal("tripsToday")}
        >
          <div className="metric-icon" style={{ fontSize: "2rem", background: "rgba(6, 182, 212, 0.1)", padding: "10px", borderRadius: "14px" }}>
            🚤
          </div>
          <div className="metric-info">
            <h3 style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-secondary)" }}>ທ່ຽວເຮືອວັນນີ້ / TRIPS TODAY</h3>
            <div className="metric-value" style={{ fontSize: "1.6rem" }}>{stats.tripsCount} ທ່ຽວ (Trips)</div>
            <div className="metric-subvalue">
              ກຳລັງເດີນທາງ: {activeTrips.length} ທ່ຽວ
            </div>
          </div>
        </div>

        {/* 4. Revenue Today (Admin/Accounting Only) */}
        <div 
          className="metric-card"
          style={{ cursor: isFinanceVisible ? "pointer" : "default", borderLeft: "4px solid #10b981" }}
          onClick={() => isFinanceVisible && setActiveModal("revToday")}
        >
          <div className="metric-icon" style={{ fontSize: "2rem", background: "rgba(16, 185, 129, 0.1)", padding: "10px", borderRadius: "14px" }}>
            💰
          </div>
          <div className="metric-info" style={{ width: "100%" }}>
            <h3 style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-secondary)" }}>{t("revenue_today", "ລາຍຮັບວັນນີ້")}</h3>
            <div className="metric-value" style={{ fontSize: "1.5rem" }}>
              {isFinanceVisible ? formatLAK(stats.revToday) : "🔒 ສະເພາະຝ່າຍບັນຊີ"}
            </div>
            {isFinanceVisible ? (
              <div style={{ marginTop: "6px", display: "flex", flexDirection: "column", gap: "2px", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span>💵 <strong>{t("cash_label", "ເງິນສົດ")} (Cash):</strong></span>
                  <span>{formatLAK(stats.cashToday)}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span>📱 <strong>{t("transfer_label", "ໂອນ")} (Transfer):</strong></span>
                  <span>{formatLAK(stats.transferToday)}</span>
                </div>
                {stats.cardToday > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span>💳 <strong>{t("card_label", "ບັດ")} (Card):</strong></span>
                    <span>{formatLAK(stats.cardToday)}</span>
                  </div>
                )}
                {stats.discountToday > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#e11d48" }}>
                    <span>🏷️ <strong>{t("discount_label", "ສ່ວນຫຼຸດ")}:</strong></span>
                    <span>-{formatLAK(stats.discountToday)}</span>
                  </div>
                )}
                {stats.debtToday > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#ea580c" }}>
                    <span>⚠️ <strong>{t("debt_label", "ຄ້າງຊຳລະ")}:</strong></span>
                    <span>{formatLAK(stats.debtToday)}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="metric-subvalue">Restricted</div>
            )}
          </div>
        </div>

        {/* 5. Revenue Month (Admin/Accounting Only) */}
        <div 
          className="metric-card"
          style={{ cursor: isFinanceVisible ? "pointer" : "default", borderLeft: "4px solid #10b981" }}
          onClick={() => isFinanceVisible && setActiveModal("revMonth")}
        >
          <div className="metric-icon" style={{ fontSize: "2rem", background: "rgba(16, 185, 129, 0.1)", padding: "10px", borderRadius: "14px" }}>
            📈
          </div>
          <div className="metric-info">
            <h3 style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-secondary)" }}>{t("revenue_month", "ລາຍຮັບເດືອນນີ້")}</h3>
            <div className="metric-value" style={{ fontSize: "1.5rem" }}>
              {isFinanceVisible ? formatLAK(stats.revMonth) : "🔒 ສະເພາະຝ່າຍບັນຊີ"}
            </div>
            <div className="metric-subvalue">
              {isFinanceVisible ? (
                `≈ ${formatTHB(stats.revMonth / exchangeRates.rateTHB)}`
              ) : (
                "Restricted"
              )}
            </div>
          </div>
        </div>

        {/* 6. Guide Wages (Admin/Accounting Only) */}
        <div 
          className="metric-card"
          style={{ cursor: isFinanceVisible ? "pointer" : "default", borderLeft: "4px solid #84cc16" }}
          onClick={() => isFinanceVisible && setActiveModal("guidePay")}
        >
          <div className="metric-icon" style={{ fontSize: "2rem", background: "rgba(132, 204, 22, 0.1)", padding: "10px", borderRadius: "14px" }}>
            🧑🌾
          </div>
          <div className="metric-info">
            <h3 style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-secondary)" }}>{t("guide_wages", "ຄ່າທ່ຽວໄກ້ດ")}</h3>
            <div className="metric-value" style={{ fontSize: "1.5rem" }}>
              {isFinanceVisible ? formatLAK(stats.guidePayDue) : "🔒 ສະເພາະບັນຊີ"}
            </div>
            <div className="metric-subvalue">
              {isFinanceVisible ? "ຄ່າທ່ຽວຂອງໄກ້ດທັງໝົດ" : "Restricted"}
            </div>
          </div>
        </div>

        {/* 7. Driver Wages (Admin/Accounting Only) */}
        <div 
          className="metric-card"
          style={{ cursor: isFinanceVisible ? "pointer" : "default", borderLeft: "4px solid #6b7280" }}
          onClick={() => isFinanceVisible && setActiveModal("driverPay")}
        >
          <div className="metric-icon" style={{ fontSize: "2rem", background: "rgba(107, 114, 128, 0.1)", padding: "10px", borderRadius: "14px" }}>
            🚐
          </div>
          <div className="metric-info">
            <h3 style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-secondary)" }}>{t("driver_wages", "ຄ່າທ່ຽວຄົນຂັບລົດ")}</h3>
            <div className="metric-value" style={{ fontSize: "1.5rem" }}>
              {isFinanceVisible ? formatLAK(stats.driverPayDue) : "🔒 ສະເພາະບັນຊີ"}
            </div>
            <div className="metric-subvalue">
              {isFinanceVisible ? "ຄ່າທ່ຽວຂອງຄົນຂັບລົດທັງໝົດ" : "Restricted"}
            </div>
          </div>
        </div>

        {/* 8. Consolidated Report (Admin/Accounting Only) */}
        <div 
          className="metric-card"
          style={{ cursor: isFinanceVisible ? "pointer" : "default", borderLeft: "4px solid #eab308" }}
          onClick={() => isFinanceVisible && setActiveModal("consolidatedReport")}
        >
          <div className="metric-icon" style={{ fontSize: "2rem", background: "rgba(234, 179, 8, 0.1)", padding: "10px", borderRadius: "14px" }}>
            📊
          </div>
          <div className="metric-info">
            <h3 style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-secondary)" }}>{t("consolidated_report", "ສະຫຼຸບຂໍ້ມູນທັງໝົດ")}</h3>
            <div className="metric-value" style={{ fontSize: "1.3rem" }}>
              {isFinanceVisible ? "ເບິ່ງລາຍງານລວມ" : "🔒 ສະເພາະບັນຊີ"}
            </div>
            <div className="metric-subvalue">
              {isFinanceVisible ? "ລາຍຮັບ-ລາຍຈ່າຍ ທັງໝົດ" : "🔒 ສະເພາະຜູ້ບໍລິຫານ / Owner Only"}
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Performance Analytics Chart (Admin/Owner/Accounting Only) */}
      {isFinanceVisible && (
        <div className="card" style={{ padding: "24px", marginBottom: "1.5rem", borderRadius: "16px", background: "white", border: "1px solid var(--border-color)", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: "750", marginBottom: "1.5rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
            📈 ວິເຄາະແນວໂນ້ມລາຍຮັບ ແລະ ຈຳນວນລູກຄ້າ 7 ວັນຫຼ້າສຸດ (7-Day Sales & Pax Performance)
          </h2>
          
          <div style={{ display: "flex", gap: "16px", marginBottom: "16px", fontSize: "0.8rem", fontWeight: "600", color: "var(--text-secondary)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: "linear-gradient(to bottom, #0f766e, #2dd4bf)" }} />
              <span>ລາຍຮັບ (Daily Revenue)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "0.85rem" }}>👥</span>
              <span>ຈຳນວນລູກຄ້າ (Pax Count)</span>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: "500px", padding: "10px" }}>
              <svg viewBox="0 0 600 200" width="100%" height="200" style={{ overflow: "visible" }}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0f766e" />
                    <stop offset="100%" stopColor="#2dd4bf" />
                  </linearGradient>
                </defs>
                {/* Grid Lines */}
                <line x1="40" y1="30" x2="580" y2="30" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="40" y1="80" x2="580" y2="80" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="40" y1="130" x2="580" y2="130" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="40" y1="170" x2="580" y2="170" stroke="#cbd5e1" strokeWidth="1.5" />
                
                {(() => {
                  const maxRev = Math.max(...chartData.map(d => d.revenue), 1000000);
                  return chartData.map((d, idx) => {
                    const x = 50 + idx * 75;
                    const barHeight = (d.revenue / maxRev) * 120; // max height of 120px
                    const y = 170 - barHeight;
                    const formattedRev = d.revenue >= 1000000 
                      ? (d.revenue / 1000000).toFixed(1) + "M" 
                      : (d.revenue >= 1000 ? (d.revenue / 1000).toFixed(0) + "k" : d.revenue);
                    
                    return (
                      <g key={idx}>
                        {/* Bar */}
                        <rect
                          x={x}
                          y={y}
                          width="35"
                          height={barHeight}
                          rx="6"
                          fill="url(#barGrad)"
                          style={{ transition: "all 0.3s ease" }}
                        />
                        {/* Revenue Label */}
                        <text
                          x={x + 17.5}
                          y={y - 8}
                          textAnchor="middle"
                          style={{ fontSize: "0.68rem", fontWeight: "750", fill: "#0f766e" }}
                        >
                          {d.revenue > 0 ? formattedRev : ""}
                        </text>
                        {/* Pax Label */}
                        {d.pax > 0 && (
                          <text
                            x={x + 17.5}
                            y={y + 16}
                            textAnchor="middle"
                            style={{ fontSize: "0.65rem", fontWeight: "700", fill: "white" }}
                          >
                            {d.pax}
                          </text>
                        )}
                        {/* X Axis Label */}
                        <text
                          x={x + 17.5}
                          y="188"
                          textAnchor="middle"
                          style={{ fontSize: "0.7rem", fontWeight: "600", fill: "#64748b" }}
                        >
                          {d.label}
                        </text>
                      </g>
                    );
                  });
                })()}
              </svg>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-sections-grid">
        
        {/* Boat Status Section */}
        <div className="card">
          <h2 style={{ fontSize: "1.25rem", marginBottom: "1.25rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Ship size={20} color="var(--primary)" />
            ສະຖານະເຮືອວັນນີ້ (Boat Live Deployment)
          </h2>
          
          <div className="dashboard-boat-grid">
            {db.boats.map(boat => {
              const trip = activeTrips.find(t => t.boatId === boat.id);
              const paxCount = trip ? trip.customerIds.length : 0;
              const statusLabel = boat.status === "busy" ? "Busy (ທ່ຽວຢູ່)" : "Ready (ຫວ່າງ)";
              const badgeClass = boat.status === "busy" ? "badge badge-warning" : "badge badge-success";
 
              return (
                <div 
                  key={boat.id} 
                  className={`dashboard-boat-card ${boat.status}`}
                  style={{
                    cursor: "default"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                    <span style={{ fontWeight: "700", color: "var(--text-primary)", fontSize: "0.95rem" }}>{boat.name}</span>
                    <span className={badgeClass}>{statusLabel}</span>
                  </div>
                  
                  {/* Seat visualizer inside card */}
                  <div style={{ display: "flex", gap: "5px", margin: "12px 0" }}>
                    {[...Array(boat.capacity)].map((_, i) => (
                      <div 
                        key={i} 
                        style={{
                          flex: 1,
                          height: "12px",
                          borderRadius: "4px",
                          backgroundColor: i < paxCount ? "var(--primary)" : "#e2e8f0",
                          border: "1px solid var(--border-color)",
                          boxShadow: i < paxCount ? "0 1px 3px rgba(15, 118, 110, 0.2)" : "none"
                        }}
                      />
                    ))}
                  </div>
 
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-secondary)", alignItems: "center" }}>
                    <span style={{ fontWeight: 500 }}>ບ່ອນນັ່ງວ່າງ: {boat.capacity - paxCount}/6</span>
                    {boat.status === "busy" && (
                      <span style={{ color: "var(--primary)", display: "flex", alignItems: "center", gap: "2px", fontSize: "0.75rem", fontWeight: 600 }}>
                        ເບິ່ງລາຍຊື່ <ArrowUpRight size={12} />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
 
        {/* Live Trip Manifest Queue */}
        <div className="card">
          <h2 style={{ fontSize: "1.25rem", marginBottom: "1.25rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CalendarCheck size={20} color="var(--primary)" />
            ທ່ຽວເຮືອຫຼ້າສຸດ (Recent Trips)
          </h2>
          <div className="dashboard-trips-list">
            {db.trips.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                ຍັງບໍ່ມີການຈັດເຮືອໃນວັນນີ້
              </div>
            ) : (
              db.trips.slice(-5).reverse().map(trip => {
                const boat = db.boats.find(b => b.id === trip.boatId);
                const guideNames = trip.guideIds.map(gid => {
                  const emp = db.employees.find(e => e.id === gid);
                  return emp ? emp.name.split(" ")[0] : "";
                }).join(", ");
 
                return (
                  <div 
                    key={trip.id}
                    onClick={() => {
                      if (userRole === "admin" || userRole === "dispatcher") {
                        onSelectTrip(trip.id);
                      }
                    }}
                    className="dashboard-trip-item"
                    style={{
                      cursor: (userRole === "admin" || userRole === "dispatcher") ? "pointer" : "default",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.925rem" }}>
                        {boat ? boat.name : `Boat ${trip.boatId}`} - {trip.customerIds.length} ຄົນ (Pax)
                      </div>
                      <div style={{ fontSize: "0.775rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                        **ໄກ້ດ:** {guideNames}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span className={`badge ${
                        trip.status === "completed" ? "badge-success" : 
                        trip.status === "cancelled" ? "badge-danger" : "badge-warning"
                      }`}>
                        {trip.status}
                      </span>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
                        {trip.time}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
 
      </div>
      </div>
      {/* --------------------- DASHBOARD INTERACTIVE DETAILS MODALS --------------------- */}
      {activeModal && (() => {
        let title = "";
        let headerRow = null;
        let rows = [];

        const todayStr = getLocalDateStr();
        const monthStr = todayStr.slice(0, 7);
        const basePrice = db.settings.basePriceLAK;

        const getCustRev = (cust) => {
          if (cust.bookingId) {
            const bk = db.bookings.find(b => b.id === cust.bookingId);
            if (bk) return bk.pricePaidLAK / (bk.paxCount || 1);
          }
          return basePrice;
        };

        const getCustPaymentMethod = (cust) => {
          if (cust.bookingId) {
            const bk = db.bookings.find(b => b.id === cust.bookingId);
            if (bk) return bk.paymentMethod || "QR / Transfer";
          }
          return "Cash (LAK)";
        };

        if (activeModal === "paxToday") {
          title = `ລາຍຊື່ລູກຄ້າປະຈຳວັນທີ ${modalDate} / Customers Today`;
          headerRow = (
            <tr>
              <th>ລະຫັດ / ID</th>
              <th>ຊື່ລູກຄ້າ / Name</th>
              <th>Passport</th>
              <th>ໂຮງແຮມ / Hotel</th>
              <th>ຜູ້ນຳມາ / Agent</th>
              <th>ສະຖານະ / Status</th>
            </tr>
          );
          const todayCusts = db.customers.filter(c => {
            if (c.checkInDate !== modalDate) return false;
            const bk = db.bookings?.find(b => b.id === c.bookingId || b.groupId === c.groupId);
            return bk ? bk.status !== "ยกเลิก" : true;
          });
          rows = todayCusts.map(c => {
            const partner = db.partners.find(p => p.id === c.partnerId);
            return (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td style={{ fontWeight: "600" }}>{c.name}</td>
                <td>{c.passport || "-"}</td>
                <td>{c.hotel || "-"}</td>
                <td>{partner ? partner.name : "Walk-in (ທົ່ວໄປ)"}</td>
                <td>
                  <span className={`badge ${c.status === "completed" ? "badge-success" : "badge-warning"}`}>
                    {c.status}
                  </span>
                </td>
              </tr>
            );
          });
        } 
        
        else if (activeModal === "revToday") {
          title = `ລາຍລະອຽດລາຍຮັບປະຈຳວັນທີ ${modalDate} / Revenue Today Breakdown`;
          headerRow = (
            <tr>
              <th>ຊື່ລູກຄ້າ / Customer</th>
              <th>ຮອງຮັບໂດຍ / Booking ID</th>
              <th>{t("payment_method_col", "ຊ່ອງທາງການຊຳລະ / Payment")}</th>
              <th style={{ textAlign: "right" }}>ຍອດເງິນ / Amount</th>
            </tr>
          );
          const todayCusts = db.customers.filter(c => {
            if (c.checkInDate !== modalDate) return false;
            const bk = db.bookings?.find(b => b.id === c.bookingId || b.groupId === c.groupId);
            return bk ? bk.status !== "ยกเลิก" : true;
          });
          rows = todayCusts.map(c => (
            <tr key={c.id}>
              <td style={{ fontWeight: "600" }}>{c.name}</td>
              <td>{c.bookingId || "Walk-in"}</td>
              <td>{getCustPaymentMethod(c)}</td>
              <td style={{ textAlign: "right", fontWeight: "bold", color: "var(--success)" }}>{formatLAK(getCustRev(c))}</td>
            </tr>
          ));
        }

        else if (activeModal === "revMonth") {
          title = `ລາຍລະອຽດລາຍຮັບປະຈຳເດືອນ ${modalMonth} / Monthly Revenue Breakdown`;
          headerRow = (
            <tr>
              <th>ວັນທີ / Date</th>
              <th>ຊື່ລູກຄ້າ / Customer</th>
              <th>ຊ່องທາງ / Payment</th>
              <th style={{ textAlign: "right" }}>ຍອດເງິນ / Amount</th>
            </tr>
          );
          const monthCusts = db.customers.filter(c => {
            if (!c.checkInDate || !c.checkInDate.startsWith(modalMonth)) return false;
            const bk = db.bookings?.find(b => b.id === c.bookingId || b.groupId === c.groupId);
            return bk ? bk.status !== "ยกเลิก" : true;
          });
          rows = monthCusts.map(c => (
            <tr key={c.id}>
              <td>{formatDate(c.checkInDate)}</td>
              <td style={{ fontWeight: "600" }}>{c.name}</td>
              <td>{getCustPaymentMethod(c)}</td>
              <td style={{ textAlign: "right", fontWeight: "bold", color: "var(--success)" }}>{formatLAK(getCustRev(c))}</td>
            </tr>
          ));
        }

        else if (activeModal === "tripsToday") {
          title = `ທ່ຽວເຮືອປະຈຳວັນທີ ${modalDate} / Trips Dispatched Today`;
          headerRow = (
            <tr>
              <th>ຮອບເວລາ / Time</th>
              <th>ເຮືອ / Boat</th>
              <th>ກັປຕັນ / Captain</th>
              <th>ໄກ້ດ / Guide</th>
              <th>ຄົນຂັບ / Driver</th>
              <th style={{ textAlign: "center" }}>ຈຳນວນຄົນ / Pax</th>
              <th>ສະຖານະ</th>
            </tr>
          );
          const todayTrips = db.trips.filter(t => t.date === modalDate);
          rows = todayTrips.map(trip => {
            const boatNames = [];
            const tripBoatIds = trip.boatIds || (trip.boatId ? [trip.boatId] : []);
            tripBoatIds.forEach(bid => {
              const b = db.boats.find(boat => boat.id === bid);
              if (b) boatNames.push(b.name.split(" / ")[0]);
            });

            const captainNames = [];
            const tripCaptainIds = trip.captainIds || (trip.captainId ? [trip.captainId] : []);
            tripCaptainIds.forEach(cid => {
              const e = db.employees.find(emp => emp.id === cid);
              if (e) captainNames.push(e.name.split(" ")[0]);
            });

            const guideNames = [];
            if (trip.guideIds) {
              trip.guideIds.forEach(gid => {
                const e = db.employees.find(emp => emp.id === gid);
                if (e) guideNames.push(e.name.split(" ")[0]);
              });
            }

            const driverNames = [];
            if (trip.driverIds) {
              trip.driverIds.forEach(did => {
                const e = db.employees.find(emp => emp.id === did);
                if (e) driverNames.push(e.name.split(" ")[0]);
              });
            }

            return (
              <tr key={trip.id}>
                <td><strong>{trip.time}</strong></td>
                <td>{boatNames.join(", ")}</td>
                <td>{captainNames.join(", ")}</td>
                <td>{guideNames.join(", ") || "-"}</td>
                <td>{driverNames.join(", ") || "-"}</td>
                <td style={{ textAlign: "center" }}><strong>{trip.customerIds.length} ຄົນ</strong></td>
                <td>
                  <span className={`badge ${
                    trip.status === "completed" ? "badge-success" : 
                    trip.status === "cancelled" ? "badge-danger" : "badge-warning"
                  }`}>
                    {trip.status}
                  </span>
                </td>
              </tr>
            );
          });
        }

        else if (activeModal === "commission") {
          title = `ຄອມມິດຊັນສະສົມປະຈຳເດືອນ ${modalMonth} / Accumulated Commissions Breakdown`;
          headerRow = (
            <tr>
              <th>ຊື່ຄູ່ຄ້າ / Partner</th>
              <th>ຊື່ລູກຄ້າ / Customer</th>
              <th>ວັນທີ / Date</th>
              <th style={{ textAlign: "right" }}>ຄ່າຄອມ / Rate</th>
            </tr>
          );
          const referrals = db.customers.filter(c => {
            if (!c.partnerId || !c.checkInDate || !c.checkInDate.startsWith(modalMonth)) return false;
            const bk = db.bookings?.find(b => b.id === c.bookingId || b.groupId === c.groupId);
            return bk ? bk.status !== "ยกเลิก" : true;
          });
          rows = referrals.map(c => {
            const partner = db.partners.find(p => p.id === c.partnerId);
            return (
              <tr key={c.id}>
                <td style={{ fontWeight: "600" }}>{partner ? partner.name : "-"}</td>
                <td>{c.name}</td>
                <td>{c.checkInDate ? formatDate(c.checkInDate) : "-"}</td>
                <td style={{ textAlign: "right", fontWeight: "bold", color: "var(--success)" }}>
                  {partner ? formatLAK(partner.commissionRate) : "-"}
                </td>
              </tr>
            );
          });
        }

        else if (activeModal === "guidePay") {
          title = `ລາຍລະອຽດເງິນທ່ຽວໄກ້ດປະຈຳເດືອນ ${modalMonth} / Guide Trip Allowance Breakdown`;
          headerRow = (
            <tr>
              <th>ວັນທີ / Date</th>
              <th>ຮອບ / Time</th>
              <th>ໄກ້ດນຳທ່ຽວ / Guide Name</th>
              <th style={{ textAlign: "right" }}>ຄ່າທ່ຽວ / Trip Rate</th>
            </tr>
          );
          const payLogs = [];
          db.trips.forEach(trip => {
            if (trip.date && trip.date.startsWith(modalMonth) && (trip.status === "completed" || trip.status === "dispatched")) {
              trip.guideIds.forEach(gid => {
                const emp = db.employees.find(e => e.id === gid);
                if (emp && emp.role === "guide") {
                  payLogs.push({
                    tripId: trip.id,
                    date: trip.date,
                    time: trip.time,
                    guideName: emp.name,
                    rate: emp.tripRate
                  });
                }
              });
            }
          });
          rows = payLogs.map((log, idx) => (
            <tr key={idx}>
              <td>{formatDate(log.date)}</td>
              <td>{log.time}</td>
              <td style={{ fontWeight: "600" }}>{log.guideName}</td>
              <td style={{ textAlign: "right", fontWeight: "bold", color: "var(--success)" }}>{formatLAK(log.rate)}</td>
            </tr>
          ));
        }

        else if (activeModal === "driverPay") {
          title = `ລາຍລະອຽດເງິນທ່ຽວຄົນຂັບລົດປະຈຳເດືອນ ${modalMonth} / Driver Trip Allowance Breakdown`;
          headerRow = (
            <tr>
              <th>ວັນທີ / Date</th>
              <th>ຮອບ / Time</th>
              <th>ຄົນຂับລົດ / Driver Name</th>
              <th style={{ textAlign: "right" }}>ຄ່າທ່ຽວ / Trip Rate</th>
            </tr>
          );
          const payLogs = [];
          db.trips.forEach(trip => {
            if (trip.date && trip.date.startsWith(modalMonth) && (trip.status === "completed" || trip.status === "dispatched")) {
              if (trip.driverIds) {
                trip.driverIds.forEach(did => {
                  const emp = db.employees.find(e => e.id === did);
                  if (emp && emp.role === "driver") {
                    payLogs.push({
                      tripId: trip.id,
                      date: trip.date,
                      time: trip.time,
                      driverName: emp.name,
                      rate: emp.tripRate
                    });
                  }
                });
              }
            }
          });
          rows = payLogs.map((log, idx) => (
            <tr key={idx}>
              <td>{formatDate(log.date)}</td>
              <td>{log.time}</td>
              <td style={{ fontWeight: "600" }}>{log.driverName}</td>
              <td style={{ textAlign: "right", fontWeight: "bold", color: "var(--success)" }}>{formatLAK(log.rate)}</td>
            </tr>
          ));
        }

        else if (activeModal === "employeeSalaries") {
          title = "ລາຍລະອຽດເງິນເດືອນພື້ນຖານພະນັກງານ / Employee Base Salaries";
          headerRow = (
            <tr>
              <th>ລະຫັດ / ID</th>
              <th>ຊື່ພະນັກງານ / Employee Name</th>
              <th>ຕຳແໜ່ງ / Role</th>
              <th>ປະເພດ / Type</th>
              <th>ສະຖານະ / Status</th>
              <th style={{ textAlign: "right" }}>ເງິນເດືອນພື້ນຖານ / Base Salary</th>
            </tr>
          );
          
          const permEmployees = db.employees.filter(e => e.type === "permanent");
          rows = permEmployees.map(e => (
            <tr key={e.id}>
              <td>{e.id}</td>
              <td style={{ fontWeight: "600" }}>{e.name}</td>
              <td style={{ textTransform: "capitalize" }}>{e.role}</td>
              <td style={{ textTransform: "capitalize" }}>{e.type}</td>
              <td>
                <span className={`badge ${e.status === "active" ? "badge-success" : "badge-danger"}`}>
                  {e.status}
                </span>
              </td>
              <td style={{ textAlign: "right", fontWeight: "bold", color: "var(--success)" }}>{formatLAK(e.salary)}</td>
            </tr>
          ));
          
          rows.push(
            <tr key="totals" style={{ fontWeight: "bold", background: "var(--bg-primary)" }}>
              <td colSpan="5">ລວມເງິນເດືອນພື້ນຖານທັງໝົດ / TOTAL BASE PAYROLL</td>
              <td style={{ textAlign: "right", color: "var(--success)" }}>{formatLAK(stats.monthlySalaries)}</td>
            </tr>
          );
        }

        else if (activeModal === "expensesToday") {
          title = `ລາຍຈ່າຍປະຈຳວັນທີ ${modalDate} / Expenses Today Breakdown`;
          headerRow = (
            <tr>
              <th>ລາຍການ / Expense Category</th>
              <th style={{ textAlign: "right" }}>ຍອດເງິນ / Amount</th>
            </tr>
          );

          let todayCom = 0;
          const todayCusts = db.customers.filter(c => {
            if (c.checkInDate !== modalDate) return false;
            const bk = db.bookings?.find(b => b.id === c.bookingId || b.groupId === c.groupId);
            return bk ? bk.status !== "ยกเลิก" : true;
          });
          todayCusts.forEach(c => {
            if (c.partnerId) {
              const partner = db.partners.find(p => p.id === c.partnerId);
              if (partner) todayCom += partner.commissionRate;
            }
          });

          let todayCrew = 0;
          const todayTrips = db.trips.filter(t => t.date === modalDate && (t.status === "completed" || t.status === "dispatched"));
          todayTrips.forEach(trip => {
            if (trip.guideIds) {
              trip.guideIds.forEach(gid => {
                const emp = db.employees.find(e => e.id === gid);
                if (emp) todayCrew += emp.tripRate;
              });
            }
            const tripCaptainIds = trip.captainIds || (trip.captainId ? [trip.captainId] : []);
            tripCaptainIds.forEach(cid => {
              const emp = db.employees.find(e => e.id === cid);
              if (emp) todayCrew += emp.tripRate;
            });
            if (trip.driverIds) {
              trip.driverIds.forEach(did => {
                const emp = db.employees.find(e => e.id === did);
                if (emp) todayCrew += emp.tripRate;
              });
            }
          });

          const todayFuel = todayTrips.length * 150000;
          const todayMaint = todayTrips.length * 30000;
          const todayRent = 1200000 / 30;
          const todaySalaries = stats.monthlySalaries / 30;
          const totalExpensesOnDate = todayCom + todayCrew + todayFuel + todayMaint + todayRent + todaySalaries;

          const expenseItems = [
            { label: "ຄ່າຄອມມິດຊັນເອເຈນສະສົມມື້ນີ້ (Commissions Today)", amount: todayCom },
            { label: "ຄ່າທ່ຽວພະນັກງານທັງໝົດມື້ນີ້ (Crew Trip Allowances Today)", amount: todayCrew },
            { label: "ຄ່ານ້ຳມັນເຊື້ອໄຟເຮືອ (Boat Fuel Expenses - 150,000 / trip)", amount: todayFuel },
            { label: "ຄ່າຊ່ອມບຳລຸງເຮືອ (Boat Maintenance Expenses - 30,000 / trip)", amount: todayMaint },
            { label: "ຄ່າເຊ່າຫ້ອງການປັນສ່ວນມື້ນີ້ (Prorated Office Rent - 1.2M / month)", amount: todayRent },
            { label: "ຄ່າຈ່າຍເງິນເດືອນພະນັກງານປັນສ່ວນມື້ນີ້ (Prorated Salaries - 1 day share)", amount: todaySalaries },
          ];

          rows = expenseItems.map((item, idx) => (
            <tr key={idx}>
              <td>{item.label}</td>
              <td style={{ textAlign: "right", fontWeight: "bold", color: item.amount > 0 ? "var(--danger)" : "var(--text-secondary)" }}>
                -{formatLAK(item.amount)}
              </td>
            </tr>
          ));

          rows.push(
            <tr key="totals" style={{ fontWeight: "bold", background: "var(--bg-primary)" }}>
              <td>ລວມລາຍຈ່າຍມື້ນີ້ທັງໝົດ / TOTAL EXPENSES TODAY</td>
              <td style={{ textAlign: "right", color: "var(--danger)" }}>-{formatLAK(totalExpensesOnDate)}</td>
            </tr>
          );
        }

        else if (activeModal === "consolidatedReport") {
          const ledger = getConsolidatedLedger();
          const filteredLedger = hideInactiveDays 
            ? ledger.filter(item => item.pax > 0 || item.revenue > 0 || item.totalExpenses > (1200000/30) + (stats.monthlySalaries/30)) 
            : ledger;

          if (conAccountType === "all") {
            title = "ລາຍງານສະຫຼຸບຂໍ້ມູນລາຍຮັບ-ລາຍຈ່າຍ / Consolidated Ledger Report";
            headerRow = (
              <tr>
                <th>ວັນທີ / Date</th>
                <th style={{ textAlign: "center" }}>{t("customer_col", "ລູກຄ້າ / Pax")}</th>
                <th style={{ textAlign: "right" }}>ລາຍຮັບ / Revenue</th>
                <th style={{ textAlign: "right" }}>ຄ່າຄອມ / Commissions</th>
                <th style={{ textAlign: "right" }}>ຄ່າທ່ຽວ / Crew Pay</th>
                <th style={{ textAlign: "right" }}>ເງິນເດືອນ / Salaries</th>
                <th style={{ textAlign: "right" }}>ລາຍຈ່າຍອື່ນໆ / Operations</th>
                <th style={{ textAlign: "right" }}>ກຳໄລສຸດທິ / Net Profit</th>
              </tr>
            );

            rows = filteredLedger.map((item) => (
              <tr key={item.date}>
                <td>{formatDate(item.date)}</td>
                <td style={{ textAlign: "center" }}>{item.pax} {t("pax_unit", "ຄົນ")}</td>
                <td style={{ textAlign: "right", color: "var(--success)", fontWeight: "600" }}>{formatLAK(item.revenue)}</td>
                <td style={{ textAlign: "right", color: "var(--danger)" }}>-{formatLAK(item.commissions)}</td>
                <td style={{ textAlign: "right", color: "var(--danger)" }}>-{formatLAK(item.crewPay)}</td>
                <td style={{ textAlign: "right", color: "var(--text-muted)" }}>-{formatLAK(item.salaries)}</td>
                <td style={{ textAlign: "right", color: "var(--text-muted)" }}>-{formatLAK(item.operations)}</td>
                <td style={{ 
                  textAlign: "right", 
                  fontWeight: "bold", 
                  color: item.netProfit >= 0 ? "var(--success)" : "var(--danger)" 
                }}>
                  {item.netProfit >= 0 ? "+" : ""}{formatLAK(item.netProfit)}
                </td>
              </tr>
            ));

            const totalPax = filteredLedger.reduce((sum, i) => sum + i.pax, 0);
            const totalRevenue = filteredLedger.reduce((sum, i) => sum + i.revenue, 0);
            const totalCommissions = filteredLedger.reduce((sum, i) => sum + i.commissions, 0);
            const totalCrewPay = filteredLedger.reduce((sum, i) => sum + i.crewPay, 0);
            const totalSalaries = filteredLedger.reduce((sum, i) => sum + i.salaries, 0);
            const totalOperations = filteredLedger.reduce((sum, i) => sum + i.operations, 0);
            const totalNetProfit = filteredLedger.reduce((sum, i) => sum + i.netProfit, 0);

            rows.push(
              <tr key="totals" style={{ fontWeight: "bold", background: "var(--bg-primary)" }}>
                <td>ລວມທັງໝົດ / TOTALS</td>
                <td style={{ textAlign: "center" }}>{totalPax} ຄົນ</td>
                <td style={{ textAlign: "right", color: "var(--success)" }}>{formatLAK(totalRevenue)}</td>
                <td style={{ textAlign: "right", color: "var(--danger)" }}>-{formatLAK(totalCommissions)}</td>
                <td style={{ textAlign: "right", color: "var(--danger)" }}>-{formatLAK(totalCrewPay)}</td>
                <td style={{ textAlign: "right" }}>-{formatLAK(totalSalaries)}</td>
                <td style={{ textAlign: "right" }}>-{formatLAK(totalOperations)}</td>
                <td style={{ textAlign: "right", color: totalNetProfit >= 0 ? "var(--success)" : "var(--danger)" }}>
                  {totalNetProfit >= 0 ? "+" : ""}{formatLAK(totalNetProfit)}
                </td>
              </tr>
            );
          } else if (conAccountType === "revenue") {
            title = "ລາຍງານສະຫຼຸບຂໍ້ມູນລາຍຮັບ / Revenue Report";
            headerRow = (
              <tr>
                <th>ວັນທີ / Date</th>
                <th style={{ textAlign: "center" }}>ລູກຄ້າ / Pax</th>
                <th style={{ textAlign: "right" }}>ລາຍຮັບ / Revenue</th>
              </tr>
            );
            rows = filteredLedger.map((item) => (
              <tr key={item.date}>
                <td>{formatDate(item.date)}</td>
                <td style={{ textAlign: "center" }}>{item.pax} ຄົນ</td>
                <td style={{ textAlign: "right", color: "var(--success)", fontWeight: "600" }}>{formatLAK(item.revenue)}</td>
              </tr>
            ));
            const totalPax = filteredLedger.reduce((sum, i) => sum + i.pax, 0);
            const totalRevenue = filteredLedger.reduce((sum, i) => sum + i.revenue, 0);
            rows.push(
              <tr key="totals" style={{ fontWeight: "bold", background: "var(--bg-primary)" }}>
                <td>ລວມທັງໝົດ / TOTALS</td>
                <td style={{ textAlign: "center" }}>{totalPax} ຄົນ</td>
                <td style={{ textAlign: "right", color: "var(--success)" }}>{formatLAK(totalRevenue)}</td>
              </tr>
            );
          } else if (conAccountType === "commission") {
            title = "ລາຍງານສະຫຼຸບຄ່າຄອມມິດຊັນ / Commissions Report";
            headerRow = (
              <tr>
                <th>ວັນທີ / Date</th>
                <th style={{ textAlign: "center" }}>ລູกຄ້າ / Pax</th>
                <th style={{ textAlign: "right" }}>ຄ່າຄອມ / Commissions</th>
              </tr>
            );
            rows = filteredLedger.map((item) => (
              <tr key={item.date}>
                <td>{formatDate(item.date)}</td>
                <td style={{ textAlign: "center" }}>{item.pax} ຄົນ</td>
                <td style={{ textAlign: "right", color: "var(--danger)", fontWeight: "600" }}>-{formatLAK(item.commissions)}</td>
              </tr>
            ));
            const totalPax = filteredLedger.reduce((sum, i) => sum + i.pax, 0);
            const totalCommissions = filteredLedger.reduce((sum, i) => sum + i.commissions, 0);
            rows.push(
              <tr key="totals" style={{ fontWeight: "bold", background: "var(--bg-primary)" }}>
                <td>ລວມທັງໝົດ / TOTALS</td>
                <td style={{ textAlign: "center" }}>{totalPax} ຄົນ</td>
                <td style={{ textAlign: "right", color: "var(--danger)" }}>-{formatLAK(totalCommissions)}</td>
              </tr>
            );
          } else if (conAccountType === "crewPay") {
            title = "ລາຍງານສະຫຼຸບຄ່າທ່ຽວພະນັກງານ / Crew Trip Pay Report";
            headerRow = (
              <tr>
                <th>ວັນທີ / Date</th>
                <th style={{ textAlign: "right" }}>ຄ່າທ່ຽວ / Crew Trip Pay</th>
              </tr>
            );
            rows = filteredLedger.map((item) => (
              <tr key={item.date}>
                <td>{formatDate(item.date)}</td>
                <td style={{ textAlign: "right", color: "var(--danger)", fontWeight: "600" }}>-{formatLAK(item.crewPay)}</td>
              </tr>
            ));
            const totalCrewPay = filteredLedger.reduce((sum, i) => sum + i.crewPay, 0);
            rows.push(
              <tr key="totals" style={{ fontWeight: "bold", background: "var(--bg-primary)" }}>
                <td>ລວມທັງໝົດ / TOTALS</td>
                <td style={{ textAlign: "right", color: "var(--danger)" }}>-{formatLAK(totalCrewPay)}</td>
              </tr>
            );
          } else if (conAccountType === "salary") {
            title = "ລາຍງານສະຫຼຸບເງິນເດືອນພະນັກງານ / Employee Salaries Report";
            headerRow = (
              <tr>
                <th>ວັນທີ / Date</th>
                <th style={{ textAlign: "right" }}>ເງິນເດືອນ / Employee Salaries</th>
              </tr>
            );
            rows = filteredLedger.map((item) => (
              <tr key={item.date}>
                <td>{formatDate(item.date)}</td>
                <td style={{ textAlign: "right", color: "var(--text-muted)", fontWeight: "600" }}>-{formatLAK(item.salaries)}</td>
              </tr>
            ));
            const totalSalaries = filteredLedger.reduce((sum, i) => sum + i.salaries, 0);
            rows.push(
              <tr key="totals" style={{ fontWeight: "bold", background: "var(--bg-primary)" }}>
                <td>ລວມທັງໝົດ / TOTALS</td>
                <td style={{ textAlign: "right" }}>-{formatLAK(totalSalaries)}</td>
              </tr>
            );
          } else if (conAccountType === "operations") {
            title = "ລາຍງານສະຫຼຸບລາຍຈ່າຍດຳເນີນງານ / Operational Expenses Report";
            headerRow = (
              <tr>
                <th>ວັນທີ / Date</th>
                <th style={{ textAlign: "right" }}>ລາຍຈ່າຍ / Operations Expense</th>
              </tr>
            );
            rows = filteredLedger.map((item) => (
              <tr key={item.date}>
                <td>{formatDate(item.date)}</td>
                <td style={{ textAlign: "right", color: "var(--text-muted)", fontWeight: "600" }}>-{formatLAK(item.operations)}</td>
              </tr>
            ));
            const totalOperations = filteredLedger.reduce((sum, i) => sum + i.operations, 0);
            rows.push(
              <tr key="totals" style={{ fontWeight: "bold", background: "var(--bg-primary)" }}>
                <td>ລວມທັງໝົດ / TOTALS</td>
                <td style={{ textAlign: "right" }}>-{formatLAK(totalOperations)}</td>
              </tr>
            );
          }
        }

        const triggerPrint = () => {
          // Force synchronous layout reflow
          const forceReflow = document.body.offsetHeight;
          window.print();
        };

        return (
          <>
            <div className="modal-overlay no-print">
              <div className="modal-content" style={{ maxWidth: "850px" }}>
                <div className="modal-header">
                  <h3 style={{ fontSize: "1.25rem", color: "var(--text-primary)" }}>{title}</h3>
                  <button className="btn btn-secondary" style={{ padding: "4px 8px" }} onClick={() => setActiveModal(null)}>
                    X
                  </button>
                </div>
                <div className="modal-body" style={{ maxHeight: "60vh", overflowY: "auto" }}>
                  {/* Daily metrics date picker */}
                  {["paxToday", "revToday", "tripsToday", "expensesToday"].includes(activeModal) && (
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "15px", padding: "8px 12px", background: "var(--bg-primary)", borderRadius: "6px", border: "1px solid var(--border-color)", width: "fit-content" }} className="no-print">
                      <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-secondary)" }}>ເລືອກວັນທີ / Date:</label>
                      <input 
                        type="date" 
                        value={modalDate} 
                        onChange={(e) => setModalDate(e.target.value)} 
                        style={{ padding: "5px 10px", borderRadius: "4px", border: "1px solid var(--border-color)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: "0.85rem", fontWeight: "500" }}
                      />
                    </div>
                  )}

                  {/* Monthly metrics month picker */}
                  {["revMonth", "commission", "guidePay", "driverPay"].includes(activeModal) && (
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "15px", padding: "8px 12px", background: "var(--bg-primary)", borderRadius: "6px", border: "1px solid var(--border-color)", width: "fit-content" }} className="no-print">
                      <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-secondary)" }}>ເລືອກເດືອນ / Month:</label>
                      <input 
                        type="month" 
                        value={modalMonth} 
                        onChange={(e) => setModalMonth(e.target.value)} 
                        style={{ padding: "5px 10px", borderRadius: "4px", border: "1px solid var(--border-color)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: "0.85rem", fontWeight: "500" }}
                      />
                    </div>
                  )}

                  {activeModal === "consolidatedReport" && (
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "15px", padding: "10px", background: "var(--bg-primary)", borderRadius: "6px", border: "1px solid var(--border-color)", alignItems: "center" }} className="no-print">
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)" }}>ເລືອກບັນຊີ / Category:</label>
                        <select 
                          value={conAccountType} 
                          onChange={(e) => setConAccountType(e.target.value)}
                          style={{ padding: "6px 12px", borderRadius: "4px", border: "1px solid var(--border-color)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: "0.85rem", fontWeight: "500", minWidth: "180px" }}
                        >
                          <option value="all">ທັງໝົດ / All Accounts</option>
                          <option value="revenue">ລາຍຮັບ / Revenue</option>
                          <option value="commission">ຄ່າຄອม / Commissions</option>
                          <option value="crewPay">ຄ່າທ່ຽວພະນັກງານ / Crew Trip Pay</option>
                          <option value="salary">ເງິນເດືອນ / Employee Salaries</option>
                          <option value="operations">ລາຍຈ່າຍດຳເນີນງານ / Operating Expenses</option>
                        </select>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)" }}>ເລີ່ມເດືອນ / Start Month:</label>
                        <input 
                          type="month" 
                          value={conStartMonth} 
                          onChange={(e) => setConStartMonth(e.target.value)}
                          style={{ padding: "5px 10px", borderRadius: "4px", border: "1px solid var(--border-color)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: "0.85rem", fontWeight: "500" }}
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)" }}>ຫາເດືອນ / End Month:</label>
                        <input 
                          type="month" 
                          value={conEndMonth} 
                          onChange={(e) => setConEndMonth(e.target.value)}
                          style={{ padding: "5px 10px", borderRadius: "4px", border: "1px solid var(--border-color)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: "0.85rem", fontWeight: "500" }}
                        />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "16px", marginLeft: "10px" }}>
                        <input 
                          type="checkbox" 
                          id="hideInactive"
                          checked={hideInactiveDays} 
                          onChange={(e) => setHideInactiveDays(e.target.checked)}
                          style={{ width: "16px", height: "16px", cursor: "pointer" }}
                        />
                        <label htmlFor="hideInactive" style={{ fontSize: "0.825rem", cursor: "pointer", fontWeight: "500", color: "var(--text-primary)" }}>ຊ່ອນວັນທີ່ບໍ່ມີການເຄື່ອນໄຫວ / Hide inactive days</label>
                      </div>
                    </div>
                  )}
                  <table>
                    <thead>{headerRow}</thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr>
                          <td colSpan="10" style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                            ບໍ່ມີຂໍ້ມູນໃນຂະນະນີ້ / No logs found.
                          </td>
                        </tr>
                      ) : rows}
                    </tbody>
                  </table>
                </div>
                <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between" }}>
                  <button className="btn btn-primary" onClick={triggerPrint}>
                    ພິມລາຍງານ / Print
                  </button>
                  <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>
                    ປິດ / Close
                  </button>
                </div>
              </div>
            </div>

            {/* Printable Area for Dashboard Metric Details */}
            <div className="printable-area">
              <div className="dashboard-print">
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                  <h2 style={{ fontSize: "20px", fontWeight: "bold" }}>ລາຍງານລາຍລະອຽດແຜງຄວບຄຸມ / Dashboard Details Report</h2>
                  <p style={{ fontSize: "12px", color: "#666" }}>ພิມວັນທີ / Printed: {new Date().toLocaleString()}</p>
                </div>
                
                <h3 style={{ fontSize: "16px", marginBottom: "15px", borderBottom: "2px solid #000", paddingBottom: "5px" }}>
                  {title}
                </h3>
                
                <table>
                  <thead>{headerRow}</thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan="10" style={{ textAlign: "center", padding: "20px" }}>
                          ບໍ່ມີຂໍ້ມູນ / No data.
                        </td>
                      </tr>
                    ) : rows}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}
