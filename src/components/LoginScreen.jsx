// LoginScreen.jsx - Premium Authentication Portal for POS system
import React, { useState } from "react";
import { getDb } from "../db/mockDb";
import { Lock, Mail, Anchor, ArrowRight, ShieldAlert } from "lucide-react";
import { useLanguage } from "../utils/LanguageContext";


export default function LoginScreen({ onLoginSuccess }) {
  const { lang, setLang, t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const db = getDb();

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    setError("");

    const matchedUser = db.users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
    );

    if (matchedUser) {
      onLoginSuccess(matchedUser);
    } else {
      setError(t("login_error", "ອີເມວ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ!"));
    }
  };

  const handleQuickLogin = (testUser) => {
    setEmail(testUser.email);
    setPassword(testUser.password);
    
    // Auto submit
    const matchedUser = db.users.find(
      (u) => u.email === testUser.email && u.password === testUser.password
    );
    if (matchedUser) {
      onLoginSuccess(matchedUser);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={loginCardStyle}>
        
        {/* Language Selector */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem", gap: "8px" }}>
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

        {/* Logo and Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            ...logoWrapperStyle,
            background: db.settings.logo ? "transparent" : logoWrapperStyle.background,
            boxShadow: db.settings.logo ? "none" : logoWrapperStyle.boxShadow
          }}>
            {db.settings.logo ? (
              <img src={db.settings.logo} alt="Logo" style={{ maxHeight: "70px", maxWidth: "120px", objectFit: "contain" }} />
            ) : (
              <Anchor size={36} color="#ffffff" />
            )}
          </div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#ffffff", margin: "10px 0 2px 0", letterSpacing: "0.5px" }}>
            {t("brand_name", "TADFANE RAFTING")}
          </h2>
          <p style={{ color: "#a7f3d0", fontSize: "0.85rem", margin: 0, opacity: 0.9 }}>
            {t("system_sub", "ລະບົບຈັດການການລ່ອງແກ່ງ ແລະ ບັນຊີພະນັກງານ")}
          </p>
        </div>

        {/* Error alert banner */}
        {error && (
          <div style={errorBannerStyle}>
            <ShieldAlert size={18} />
            <span style={{ fontSize: "0.85rem" }}>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={labelStyle}>{t("login_email_label", "ອີເມວພະນັກງານ / Email Address")}</label>
            <div style={inputWrapperStyle}>
              <Mail size={18} color="#10b981" style={{ marginLeft: "12px" }} />
              <input 
                type="email" 
                placeholder="example@tadfane.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={labelStyle}>{t("login_password_label", "ລະຫັດຜ່ານ / Password")}</label>
            <div style={inputWrapperStyle}>
              <Lock size={18} color="#10b981" style={{ marginLeft: "12px" }} />
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
          </div>

          <button type="submit" style={submitButtonStyle}>
            {t("login_btn", "ເຂົ້າສູ່ລະບົບ / Sign In")} <ArrowRight size={18} />
          </button>
        </form>

        {/* Divider */}
        <div style={dividerStyle}>
          <span style={dividerTextStyle}>{t("demo_accounts", "ບັນຊີທົດລອງໃຊ້ງານ / Quick Test Accounts")}</span>
        </div>

        {/* Quick select buttons */}
        <div style={quickDeckStyle}>
          {db.users.map((usr) => (
            <button 
              key={usr.id} 
              type="button" 
              onClick={() => handleQuickLogin(usr)}
              style={quickBtnStyle}
              title={`Email: ${usr.email} / PW: ${usr.password}`}
            >
              <div style={{ fontWeight: "700", color: "#10b981" }}>
                {(usr.role === "owner" || usr.role === "admin") && `👑 ${lang === "en" ? "Owner / Admin" : "ເຈົ້າຂອງ / ຜູ້ດູແລ"}`}
                {(usr.role === "cashier" || usr.role === "sales") && `💰 ${lang === "en" ? "Cashier" : "ແຄຊເຊຍ (ຂາຍປີ້)"}`}
                {usr.role === "accounting" && `📊 ${lang === "en" ? "Accountant" : "ນັກບັນຊີ"}`}
                {(usr.role === "tour_operation" || usr.role === "dispatcher") && `⚓ ${lang === "en" ? "Dispatcher" : "ຜູ້ປ່ອຍເຮືອ"}`}
                {usr.role === "manager" && `💼 ${lang === "en" ? "Manager" : "ຜູ້ຈັດการ"}`}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "2px" }}>
                {usr.email}
              </div>
            </button>
          ))}
        </div>


      </div>
    </div>
  );
}

// Styling definitions
const containerStyle = {
  minHeight: "100vh",
  width: "100vw",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "radial-gradient(circle at 10% 20%, #064e3b 0%, #022c22 90%)",
  fontFamily: "'Outfit', 'Inter', sans-serif",
  padding: "1.5rem"
};

const loginCardStyle = {
  background: "rgba(15, 23, 42, 0.45)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  borderRadius: "24px",
  padding: "2.5rem",
  width: "100%",
  maxWidth: "460px",
  boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
};

const logoWrapperStyle = {
  background: "linear-gradient(135deg, #10b981 0%, #047857 100%)",
  width: "70px",
  height: "70px",
  borderRadius: "20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto",
  boxShadow: "0 8px 16px rgba(16, 185, 129, 0.25)"
};

const errorBannerStyle = {
  background: "rgba(239, 68, 68, 0.15)",
  border: "1px solid rgba(239, 68, 68, 0.3)",
  color: "#fca5a5",
  padding: "10px 14px",
  borderRadius: "12px",
  marginBottom: "1.5rem",
  display: "flex",
  alignItems: "center",
  gap: "8px"
};

const labelStyle = {
  fontSize: "0.8rem",
  fontWeight: "600",
  color: "#a7f3d0",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const inputWrapperStyle = {
  background: "rgba(15, 23, 42, 0.6)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  transition: "border-color 0.2s"
};

const inputStyle = {
  background: "none",
  border: "none",
  outline: "none",
  color: "#ffffff",
  padding: "12px",
  fontSize: "0.95rem",
  width: "100%",
  fontFamily: "inherit"
};

const submitButtonStyle = {
  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  color: "#ffffff",
  fontWeight: "700",
  padding: "14px",
  borderRadius: "12px",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  fontSize: "1rem",
  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)",
  transition: "all 0.2s ease",
  marginTop: "0.5rem"
};

const dividerStyle = {
  position: "relative",
  textAlign: "center",
  margin: "2rem 0 1.5rem 0"
};

const dividerTextStyle = {
  background: "#0c1916", // match background color blend
  padding: "0 10px",
  fontSize: "0.75rem",
  color: "#94a3b8",
  fontWeight: "600"
};

const quickDeckStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "0.75rem"
};

const quickBtnStyle = {
  background: "rgba(255, 255, 255, 0.03)",
  border: "1px solid rgba(255, 255, 255, 0.05)",
  borderRadius: "12px",
  padding: "10px",
  textAlign: "left",
  cursor: "pointer",
  transition: "all 0.2s ease"
};
