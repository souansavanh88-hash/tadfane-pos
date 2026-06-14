// LiveStatusBoard.jsx - Visual Status Board for Guides, Drivers, and Boats
import React, { useState, useEffect } from "react";
import { getDb, saveDb } from "../db/mockDb";
import { Ship, Users, Car, Check, RefreshCw, PowerOff, ShieldAlert } from "lucide-react";
import { useLanguage } from "../utils/LanguageContext";

export default function LiveStatusBoard({ type }) {
  const { lang, t } = useLanguage();
  const [db, setDb] = useState(getDb());
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const handleDbUpdate = () => {
      setDb(getDb());
    };
    window.addEventListener("db-update", handleDbUpdate);
    return () => window.removeEventListener("db-update", handleDbUpdate);
  }, []);

  // Refresh clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = new Date().toISOString().split("T")[0];
  
  // Find active trips today (status is dispatched/active)
  const activeTrips = (db.trips || []).filter(t => t.date === todayStr && t.status === "dispatched");

  // Determine if a guide/captain is currently busy on an active trip
  const isEmployeeBusy = (empId) => {
    return activeTrips.some(t => t.guideIds?.includes(empId) || t.captainIds?.includes(empId) || t.driverIds?.includes(empId));
  };

  // Determine if a boat is currently busy on an active trip
  const isBoatBusy = (boatId) => {
    return activeTrips.some(t => t.boatId === parseInt(boatId) || t.boatIds?.includes(parseInt(boatId)));
  };

  // Update employee status (duty status)
  const handleUpdateEmployeeStatus = (empId, newStatus) => {
    const currentDb = getDb();
    currentDb.employees = currentDb.employees.map(emp => {
      if (emp.id === empId) {
        return { 
          ...emp, 
          dutyStatus: newStatus,
          // Sync with primary status if off-duty/inactive
          status: newStatus === "off-duty" ? "inactive" : "active" 
        };
      }
      return emp;
    });
    saveDb(currentDb);
    setDb(currentDb);
    window.dispatchEvent(new Event("db-update"));
  };

  // Update boat status
  const handleUpdateBoatStatus = (boatId, newStatus) => {
    const currentDb = getDb();
    currentDb.boats = currentDb.boats.map(b => {
      if (b.id === boatId) {
        return { 
          ...b, 
          status: newStatus 
        };
      }
      return b;
    });
    saveDb(currentDb);
    setDb(currentDb);
    window.dispatchEvent(new Event("db-update"));
  };

  // Render Guides Status Board
  if (type === "guides") {
    const guidesAndCaptains = (db.employees || []).filter(e => e.role === "guide" || e.role === "captain");
    
    return (
      <div>
        <div className="page-header">
          <div className="page-title">
            <h1 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              🧑🌾 ສະຖານະໄກ້ດ ແລະ ກັບຕັນ / Guides & Captains Live Status
            </h1>
            <p>ເບິ່ງລາຍຊື່ໄກ້ດນຳທ່ຽວ ແລະ ກັບຕັນເຮືອ, ຈັດການສະຖານະການເຮັດວຽກປະຈຳວັນ</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
          {guidesAndCaptains.map(emp => {
            const isBusy = isEmployeeBusy(emp.id);
            // Auto resolve status
            let currentStatus = emp.dutyStatus || (emp.status === "inactive" ? "off-duty" : "available");
            if (isBusy) currentStatus = "busy";

            const cardBorderColor = 
              currentStatus === "busy" ? "#3b82f6" : 
              currentStatus === "off-duty" ? "#ef4444" : "#10b981";

            const statusBgColor = 
              currentStatus === "busy" ? "rgba(59, 130, 246, 0.15)" : 
              currentStatus === "off-duty" ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)";

            const statusColor = 
              currentStatus === "busy" ? "#2563eb" : 
              currentStatus === "off-duty" ? "#dc2626" : "#059669";

            const statusText = 
              currentStatus === "busy" ? "🔵 ກຳລັງນຳທ່ຽວ (Busy)" : 
              currentStatus === "off-duty" ? "🔴 ຢຸດງານ (Off Duty)" : "🟢 ຫວ່າງ (Available)";

            return (
              <div 
                key={emp.id} 
                className="card" 
                style={{ 
                  borderTop: `5px solid ${cardBorderColor}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                  padding: "1.25rem",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  cursor: "default"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700" }}>{emp.name}</h3>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "600" }}>
                      {emp.role === "captain" ? "👨‍✈️ ກັບຕັນ / Captain" : "🧑🌾 ໄກ້ດ / Tour Guide"} ({emp.type})
                    </span>
                  </div>
                  <div style={{ fontSize: "2rem" }}>
                    {emp.role === "captain" ? "👨‍✈️" : "🧑🌾"}
                  </div>
                </div>

                {/* Status Indicator */}
                <div style={{ 
                  background: statusBgColor, 
                  color: statusColor, 
                  padding: "8px 12px", 
                  borderRadius: "8px", 
                  fontSize: "0.85rem", 
                  fontWeight: "bold",
                  textAlign: "center"
                }}>
                  {statusText}
                </div>

                {/* Status Toggle Actions */}
                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "10px", marginTop: "auto" }}>
                  <label style={{ fontSize: "0.7rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                    ປ່ຽນສະຖານະ / Toggle Status:
                  </label>
                  <div style={{ display: "flex", gap: "5px" }}>
                    <button
                      onClick={() => handleUpdateEmployeeStatus(emp.id, "available")}
                      disabled={isBusy}
                      style={{
                        flex: 1,
                        fontSize: "0.7rem",
                        padding: "6px 0",
                        borderRadius: "6px",
                        border: "1px solid #10b981",
                        background: currentStatus === "available" ? "#10b981" : "transparent",
                        color: currentStatus === "available" ? "#ffffff" : "#059669",
                        fontWeight: "bold",
                        cursor: isBusy ? "not-allowed" : "pointer",
                        opacity: isBusy ? 0.5 : 1
                      }}
                    >
                      {t("available_short", "ຫວ່າງ")}
                    </button>
                    <button
                      onClick={() => handleUpdateEmployeeStatus(emp.id, "off-duty")}
                      disabled={isBusy}
                      style={{
                        flex: 1,
                        fontSize: "0.7rem",
                        padding: "6px 0",
                        borderRadius: "6px",
                        border: "1px solid #ef4444",
                        background: currentStatus === "off-duty" ? "#ef4444" : "transparent",
                        color: currentStatus === "off-duty" ? "#ffffff" : "#dc2626",
                        fontWeight: "bold",
                        cursor: isBusy ? "not-allowed" : "pointer",
                        opacity: isBusy ? 0.5 : 1
                      }}
                    >
                      {t("off_duty_short", "ຢຸດງານ")}
                    </button>
                  </div>
                  {isBusy && (
                    <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "4px", display: "block", textAlign: "center" }}>
                      🔒 ລັອກສະຖານະເນື່ອງຈາກກຳລັງເດີນທ່ຽວເຮືອ
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Render Drivers Status Board
  if (type === "drivers") {
    const drivers = (db.employees || []).filter(e => e.role === "driver");

    return (
      <div>
        <div className="page-header">
          <div className="page-title">
            <h1 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              🚐 ສະຖານະຄົນຂັບລົດ / Drivers Live Status
            </h1>
            <p>ເບິ່ງລາຍຊື່ຄົນຂັບລົດຮັບສົ່ງ, ຈັດການສະຖານະການເຮັດວຽກປະຈຳວັນ</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
          {drivers.map(emp => {
            const isBusy = isEmployeeBusy(emp.id);
            // Auto resolve status
            let currentStatus = emp.dutyStatus || (emp.status === "inactive" ? "off-duty" : "available");
            if (isBusy) currentStatus = "busy";

            const cardBorderColor = 
              currentStatus === "busy" ? "#3b82f6" : 
              currentStatus === "off-duty" ? "#ef4444" : "#10b981";

            const statusBgColor = 
              currentStatus === "busy" ? "rgba(59, 130, 246, 0.15)" : 
              currentStatus === "off-duty" ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)";

            const statusColor = 
              currentStatus === "busy" ? "#2563eb" : 
              currentStatus === "off-duty" ? "#dc2626" : "#059669";

            const statusText = 
              currentStatus === "busy" ? "🔵 ກຳລັງຂັບລົດ (Busy)" : 
              currentStatus === "off-duty" ? "🔴 ບໍ່ພ້ອມ (Off Duty)" : "🟢 ພ້ອມໃຊ້ງານ (Available)";

            return (
              <div 
                key={emp.id} 
                className="card" 
                style={{ 
                  borderTop: `5px solid ${cardBorderColor}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                  padding: "1.25rem",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  cursor: "default"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700" }}>{emp.name}</h3>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "600" }}>
                      🚐 ຄົນຂັບລົດ / Transfer Driver ({emp.type})
                    </span>
                  </div>
                  <div style={{ fontSize: "2rem" }}>
                    🚐
                  </div>
                </div>

                {/* Status Indicator */}
                <div style={{ 
                  background: statusBgColor, 
                  color: statusColor, 
                  padding: "8px 12px", 
                  borderRadius: "8px", 
                  fontSize: "0.85rem", 
                  fontWeight: "bold",
                  textAlign: "center"
                }}>
                  {statusText}
                </div>

                {/* Status Toggle Actions */}
                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "10px", marginTop: "auto" }}>
                  <label style={{ fontSize: "0.7rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                    ປ່ຽນສະຖານະ / Toggle Status:
                  </label>
                  <div style={{ display: "flex", gap: "5px" }}>
                    <button
                      onClick={() => handleUpdateEmployeeStatus(emp.id, "available")}
                      disabled={isBusy}
                      style={{
                        flex: 1,
                        fontSize: "0.7rem",
                        padding: "6px 0",
                        borderRadius: "6px",
                        border: "1px solid #10b981",
                        background: currentStatus === "available" ? "#10b981" : "transparent",
                        color: currentStatus === "available" ? "#ffffff" : "#059669",
                        fontWeight: "bold",
                        cursor: isBusy ? "not-allowed" : "pointer",
                        opacity: isBusy ? 0.5 : 1
                      }}
                    >
                      {t("ready_short", "ພ້ອມໃຊ້")}
                    </button>
                    <button
                      onClick={() => handleUpdateEmployeeStatus(emp.id, "off-duty")}
                      disabled={isBusy}
                      style={{
                        flex: 1,
                        fontSize: "0.7rem",
                        padding: "6px 0",
                        borderRadius: "6px",
                        border: "1px solid #ef4444",
                        background: currentStatus === "off-duty" ? "#ef4444" : "transparent",
                        color: currentStatus === "off-duty" ? "#ffffff" : "#dc2626",
                        fontWeight: "bold",
                        cursor: isBusy ? "not-allowed" : "pointer",
                        opacity: isBusy ? 0.5 : 1
                      }}
                    >
                      {t("not_ready_short", "ບໍ່ພ້ອມ")}
                    </button>
                  </div>
                  {isBusy && (
                    <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "4px", display: "block", textAlign: "center" }}>
                      🔒 ລັອກສະຖານະເນື່ອງຈາກກຳລັງຂັບລົດຮັບສົ່ງ
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Render Boats Status Board
  if (type === "boats") {
    const boatsList = db.boats || [];

    return (
      <div>
        <div className="page-header">
          <div className="page-title">
            <h1 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              🚤 ສະຖານະເຮືອ / Boats Live Status
            </h1>
            <p>ຈັດການສະຖານະເຮືອທ່ອງທ່ຽວ, ຕັ້ງຄ່າການບຳລຸງຮັກສາ ຫຼື ພ້ອມອອກທ່ຽວ</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
          {boatsList.map(boat => {
            const isBusy = isBoatBusy(boat.id);
            // Auto resolve status
            let currentStatus = boat.status || "available";
            if (isBusy) currentStatus = "busy";

            const cardBorderColor = 
              currentStatus === "busy" ? "#3b82f6" : 
              currentStatus === "maintenance" ? "#f97316" : 
              currentStatus === "inactive" ? "#ef4444" : "#10b981";

            const statusBgColor = 
              currentStatus === "busy" ? "rgba(59, 130, 246, 0.15)" : 
              currentStatus === "maintenance" ? "rgba(249, 115, 22, 0.15)" : 
              currentStatus === "inactive" ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)";

            const statusColor = 
              currentStatus === "busy" ? "#2563eb" : 
              currentStatus === "maintenance" ? "#ea580c" : 
              currentStatus === "inactive" ? "#dc2626" : "#059669";

            const statusText = 
              currentStatus === "busy" ? "🔵 ກຳລັງໃຊ້ງານ (Busy)" : 
              currentStatus === "maintenance" ? "🟠 ລໍຊ້ອມ (Maintenance)" : 
              currentStatus === "inactive" ? "🔴 ປິດໃຊ້ງານ (Disabled)" : "🟢 ພ້ອມອອກ (Available)";

            return (
              <div 
                key={boat.id} 
                className="card" 
                style={{ 
                  borderTop: `5px solid ${cardBorderColor}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                  padding: "1.25rem",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  cursor: "default"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700" }}>{boat.name}</h3>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "600" }}>
                      🚤 ເຮືອທ່ອງທ່ຽວ / River Cruise (ຈຸ {boat.capacity} ຄົນ)
                    </span>
                  </div>
                  <div style={{ fontSize: "2rem" }}>
                    🚤
                  </div>
                </div>

                {/* Status Indicator */}
                <div style={{ 
                  background: statusBgColor, 
                  color: statusColor, 
                  padding: "8px 12px", 
                  borderRadius: "8px", 
                  fontSize: "0.85rem", 
                  fontWeight: "bold",
                  textAlign: "center"
                }}>
                  {statusText}
                </div>

                {/* Status Toggle Actions */}
                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "10px", marginTop: "auto" }}>
                  <label style={{ fontSize: "0.7rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                    ປ່ຽນສະຖານະ / Toggle Status:
                  </label>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button
                      onClick={() => handleUpdateBoatStatus(boat.id, "available")}
                      disabled={isBusy}
                      style={{
                        flex: 1,
                        fontSize: "0.65rem",
                        padding: "6px 0",
                        borderRadius: "6px",
                        border: "1px solid #10b981",
                        background: currentStatus === "available" ? "#10b981" : "transparent",
                        color: currentStatus === "available" ? "#ffffff" : "#059669",
                        fontWeight: "bold",
                        cursor: isBusy ? "not-allowed" : "pointer",
                        opacity: isBusy ? 0.5 : 1
                      }}
                    >
                      {t("ready_to_depart_short", "ພ້ອມອອກ")}
                    </button>
                    <button
                      onClick={() => handleUpdateBoatStatus(boat.id, "maintenance")}
                      disabled={isBusy}
                      style={{
                        flex: 1,
                        fontSize: "0.65rem",
                        padding: "6px 0",
                        borderRadius: "6px",
                        border: "1px solid #f97316",
                        background: currentStatus === "maintenance" ? "#f97316" : "transparent",
                        color: currentStatus === "maintenance" ? "#ffffff" : "#ea580c",
                        fontWeight: "bold",
                        cursor: isBusy ? "not-allowed" : "pointer",
                        opacity: isBusy ? 0.5 : 1
                      }}
                    >
                      {t("maintenance_short", "ລໍຊ້ອມ")}
                    </button>
                    <button
                      onClick={() => handleUpdateBoatStatus(boat.id, "inactive")}
                      disabled={isBusy}
                      style={{
                        flex: 1,
                        fontSize: "0.65rem",
                        padding: "6px 0",
                        borderRadius: "6px",
                        border: "1px solid #ef4444",
                        background: currentStatus === "inactive" ? "#ef4444" : "transparent",
                        color: currentStatus === "inactive" ? "#ffffff" : "#dc2626",
                        fontWeight: "bold",
                        cursor: isBusy ? "not-allowed" : "pointer",
                        opacity: isBusy ? 0.5 : 1
                      }}
                    >
                      {t("disabled_short", "ປິດໃຊ້")}
                    </button>
                  </div>
                  {isBusy && (
                    <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "4px", display: "block", textAlign: "center" }}>
                      🔒 ລັອກສະຖານະເນື່ອງຈາກເຮືອກຳລັງແລ່ນນຳທ່ຽວຢູ່
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
