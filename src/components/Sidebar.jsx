// Sidebar.jsx - Streamlined Navigation menu with 11 custom visual menus
import React from "react";
import { Anchor, LogOut } from "lucide-react";
import { getDb } from "../db/mockDb";
import { useLanguage } from "../utils/LanguageContext";

export default function Sidebar({ activeTab, setActiveTab, currentUser, onLogout }) {
  const { lang, setLang, t } = useLanguage();

  const menuItems = [
    { id: "dashboard", label: t("dashboard", "ໜ້າຫຼັກ"), icon: "🏠", color: "#10b981", bg: "rgba(16, 185, 129, 0.12)", permId: "dashboard" },
    { id: "checkin-tickets", label: t("ticket_sales", "ຂາຍປີ້"), icon: "🎫", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.12)", permId: "checkin-tickets" },
    { id: "manifest", label: t("trips_manifest", "ລາຍການຖ້ຽວ"), icon: "📅", color: "#f97316", bg: "rgba(249, 115, 22, 0.12)", permId: "checkin-tickets" },
    { id: "online-register", label: t("customer_registration", "ລົງທະບຽນລູກຄ້າ"), icon: "👥", color: "#0ea5e9", bg: "rgba(14, 165, 233, 0.12)", permId: "checkin-tickets" },
    { id: "commissions", label: t("commissions", "ຄ່າຄອມເອເຈນ"), icon: "🤝", color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.12)", permId: "accounting-payroll" },
    { id: "guides", label: t("guides_live", "ຕິດຕາມໄກດ໌"), icon: "🧑🌾", color: "#84cc16", bg: "rgba(132, 204, 22, 0.12)", permId: "checkin-tickets" },
    { id: "drivers", label: t("drivers_live", "ຕິດຕາມຄົນຂັບ"), icon: "🚐", color: "#6b7280", bg: "rgba(107, 114, 128, 0.12)", permId: "checkin-tickets" },
    { id: "boats", label: t("boats_live", "ຕິດຕາມເຮືອ"), icon: "🚤", color: "#06b6d4", bg: "rgba(6, 182, 212, 0.12)", permId: "checkin-tickets" },
    { id: "reports", label: t("reports", "ລາຍງານ"), icon: "📊", color: "#eab308", bg: "rgba(234, 179, 8, 0.12)", permId: "accounting-payroll" },
    { id: "accounting-payroll", label: t("financials", "ການເງິນ"), icon: "💵", color: "#15803d", bg: "rgba(21, 128, 61, 0.12)", permId: "accounting-payroll" },
    { id: "settings", label: t("settings", "ຕັ້ງຄ່າ"), icon: "⚙️", color: "#4b5563", bg: "rgba(75, 85, 99, 0.12)", permId: "settings" },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (!currentUser) return false;
    // Dynamic permission check with owner/admin absolute fallback
    if (currentUser.role === "owner" || currentUser.role === "admin") return true;
    return currentUser.permissions?.[item.permId]?.view === true;
  });

  const db = getDb();
  const logo = db.settings.logo;

  return (
    <div className="sidebar-container" style={{ display: "flex", flexDirection: "column", height: "100%", width: "280px" }}>
      <div className="sidebar-header" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "15px", alignItems: "center" }}>
        {logo ? (
          <img src={logo} alt="Logo" style={{ maxHeight: "35px", maxWidth: "45px", objectFit: "contain", borderRadius: "4px" }} />
        ) : (
          <Anchor size={28} color="#10b981" />
        )}
        <div className="sidebar-logo-text">
          <span className="brand-name">{t("brand_name", "TADFANE RAFTING")}</span>
          <span className="brand-sub">{t("brand_sub", "Rafting Trip Manager")}</span>
        </div>

      </div>

      {/* Logged-In User Profile Info Widget */}
      {currentUser && (
        <div className="sidebar-role-selector-container" style={{ display: "flex", flexDirection: "column", gap: "6px", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "12px 1.25rem", marginBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#0f766e", display: "flex", alignItems: "center", justifyCenter: "center", fontSize: "0.85rem", fontWeight: "700", color: "#ffffff", justifyContent: "center" }}>
              {currentUser.name.charAt(0)}
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{ fontWeight: "700", fontSize: "0.85rem", color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {currentUser.name}
              </div>
              <div style={{ fontSize: "0.65rem", color: "#a7f3d0", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.5px" }}>
                {currentUser.role === "owner" && "👑 Owner"}
                {currentUser.role === "admin" && "👑 Admin"}
                {currentUser.role === "sales" && "💰 Cashier / Sales"}
                {currentUser.role === "cashier" && "💰 Cashier"}
                {currentUser.role === "accounting" && "📊 Accountant"}
                {currentUser.role === "dispatcher" && "⚓ Dispatcher"}
                {currentUser.role === "tour_operation" && "⚓ Tour Op"}
              </div>
            </div>
          </div>
          <button 
            type="button"
            onClick={onLogout}
            style={{ 
              width: "100%", 
              padding: "6px", 
              borderRadius: "8px", 
              background: "rgba(239, 68, 68, 0.12)", 
              border: "1px solid rgba(239, 68, 68, 0.2)", 
              color: "#fca5a5", 
              fontSize: "0.75rem", 
              fontWeight: "600",
              cursor: "pointer", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              gap: "4px",
              marginTop: "4px"
            }}
          >
            <LogOut size={12} /> {t("logout", "ອອກຈາກລະບົບ (Log Out)")}
          </button>

        </div>
      )}

      <nav className="sidebar-nav" style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1, overflowY: "auto", padding: "0 0.85rem" }}>
        {filteredMenuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`sidebar-btn ${isActive ? "active" : ""}`}
              style={{
                background: isActive ? `linear-gradient(135deg, ${item.color} 0%, rgba(13, 148, 136, 0.9) 100%)` : "transparent",
                borderLeft: `4px solid ${item.color}`,
                paddingLeft: isActive ? "1.25rem" : "0.75rem",
                color: isActive ? "#ffffff" : "#a7f3d0",
                display: "flex",
                alignItems: "center",
                width: "100%",
                padding: "8px 12px",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.25s ease"
              }}
            >
              <span style={{ 
                fontSize: "1.1rem", 
                marginRight: "10px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: isActive ? "rgba(255,255,255,0.22)" : item.bg,
                boxShadow: isActive ? "none" : "inset 0 1px 3px rgba(0,0,0,0.05)"
              }}>
                {item.icon}
              </span>
              <span style={{ fontSize: "0.825rem", fontWeight: isActive ? "700" : "600", transition: "color 0.2s" }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer" style={{ padding: "15px 1.5rem 15px", borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: "auto" }}>
        <div className="sidebar-footer-version" style={{ fontSize: "0.7rem", color: "#64748b" }}>Version 3.0.0 (Visual POS)</div>
        <div className="sidebar-footer-lang" style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px" }}>
          <button 
            type="button"
            onClick={() => setLang("en")} 
            style={{
              background: lang === "en" ? "#10b981" : "rgba(255,255,255,0.08)",
              color: lang === "en" ? "#ffffff" : "#94a3b8",
              border: "none",
              borderRadius: "4px",
              padding: "4px 8px",
              fontSize: "0.75rem",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            EN
          </button>
          <span style={{ color: "rgba(255,255,255,0.15)", fontSize: "0.75rem" }}>/</span>
          <button 
            type="button"
            onClick={() => setLang("la")} 
            style={{
              background: lang === "la" ? "#10b981" : "rgba(255,255,255,0.08)",
              color: lang === "la" ? "#ffffff" : "#94a3b8",
              border: "none",
              borderRadius: "4px",
              padding: "4px 8px",
              fontSize: "0.75rem",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            ລາວ
          </button>
        </div>
      </div>

    </div>
  );
}
