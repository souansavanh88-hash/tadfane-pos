// App.jsx - Main Application Orchestrator (Streamlined Version)
import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import CheckInTickets from "./components/CheckInTickets";
import AccountingPayroll from "./components/AccountingPayroll";
import OperatingExpenses from "./components/OperatingExpenses";
import SettingsPanel from "./components/SettingsPanel";
import SelfRegisterPortal from "./components/SelfRegisterPortal";
import LoginScreen from "./components/LoginScreen";
import TicketManifest from "./components/TicketManifest";
import OnlineRegisterQR from "./components/OnlineRegisterQR";
import CommissionTracker from "./components/CommissionTracker";
import Reports from "./components/Reports";
import LiveStatusBoard from "./components/LiveStatusBoard";
import { migrateDb, getDb, saveDb } from "./db/mockDb";
import { useLanguage } from "./utils/LanguageContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { isFirebaseConfigured } from "./db/firebaseSync";


export default function App() {
  const { lang, t } = useLanguage();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [tunnelUrl, setTunnelUrl] = useState(localStorage.getItem("pos_custom_host_url") || "");

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("pos_current_user");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [targetPrintTripId, setTargetPrintTripId] = useState("");
  const [selectedTripId, setSelectedTripId] = useState("");
  const [preloadedBookingId, setPreloadedBookingId] = useState(null);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [warningTimeLeft, setWarningTimeLeft] = useState(60);

  // Check if we are in customer self-registration portal mode
  const params = new URLSearchParams(window.location.search);
  const isSelfRegister = window.location.pathname === "/register" || params.get("mode") === "self-register";
  const partnerIdParam = params.get("partnerId") || "";

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem("pos_current_user", JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
    if (user.role === "owner" || user.role === "admin") {
      setActiveTab("dashboard");
      return;
    }
    const availableTabs = [
      "dashboard", "checkin-tickets", "manifest", "online-register", 
      "commissions", "guides", "drivers", "boats", "reports", 
      "accounting-payroll", "settings"
    ];
    const fallback = availableTabs.find(tab => {
      const pId = getTabPermId(tab);
      return user.permissions?.[pId]?.view;
    });
    if (fallback) {
      setActiveTab(fallback);
    } else {
      setActiveTab("checkin-tickets");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem("pos_current_user");
    } catch (e) {
      console.error(e);
    }
  };

  // Inactivity timeout logic (30 minutes logout, 29 minutes warning)
  useEffect(() => {
    if (!currentUser) {
      setShowTimeoutWarning(false);
      return;
    }

    let warningTimeout;
    let countdownInterval;

    const resetInactivityTimer = () => {
      if (warningTimeout) clearTimeout(warningTimeout);
      if (countdownInterval) clearInterval(countdownInterval);

      setShowTimeoutWarning(false);
      setWarningTimeLeft(60);

      // 29 minutes of inactivity triggers warning (29 * 60 * 1000 ms)
      warningTimeout = setTimeout(() => {
        setShowTimeoutWarning(true);
        let timeLeft = 60;
        setWarningTimeLeft(timeLeft);

        countdownInterval = setInterval(() => {
          timeLeft -= 1;
          if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            handleLogout();
          } else {
            setWarningTimeLeft(timeLeft);
          }
        }, 1000);
      }, 29 * 60 * 1000);
    };

    const events = ["mousemove", "mousedown", "keypress", "click", "scroll", "touchstart"];
    events.forEach((event) => {
      window.addEventListener(event, resetInactivityTimer);
    });

    resetInactivityTimer();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetInactivityTimer);
      });
      if (warningTimeout) clearTimeout(warningTimeout);
      if (countdownInterval) clearInterval(countdownInterval);
    };
  }, [currentUser]);

  // Listening to storage events to sync other tabs in real-time
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "pos_boat_db") {
        window.dispatchEvent(new Event("db-update"));
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // Auto-detect public Cloudflare tunnel host if running locally
    fetch("/host-ip.json?t=" + Date.now())
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("No host-ip.json");
      })
      .then(data => {
        if (data && data.hostIp) {
          const currentHost = localStorage.getItem("pos_custom_host_url");
          if (currentHost !== data.hostIp) {
            console.log("[Tunnel] Auto-updating custom host URL to:", data.hostIp);
            localStorage.setItem("pos_custom_host_url", data.hostIp);
            setTunnelUrl(data.hostIp);
            window.dispatchEvent(new Event("db-update"));
          } else {
            setTunnelUrl(data.hostIp);
          }
        }
      })
      .catch(err => {
        // Safe to ignore on standalone/static Vercel deployments
      });

    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Periodically fetch database from server to keep POS cashier in sync with customer registrations
  useEffect(() => {
    let active = true;
    const pollServerDb = async () => {
      try {
        const response = await fetch("/api/db?t=" + Date.now(), {
          headers: {
            "Cache-Control": "no-cache",
            "Pragma": "no-cache"
          }
        });
        if (response.ok && active) {
          const data = await response.json();
          if (data && data.bookings) {
            const currentLocalRaw = localStorage.getItem("pos_boat_db");
            if (currentLocalRaw !== JSON.stringify(data)) {
              localStorage.setItem("pos_boat_db", JSON.stringify(data));
              window.dispatchEvent(new Event("db-update"));
            }
          }
        }
      } catch (err) {
        console.warn("Background server DB sync failed:", err);
      }
    };

    // Firebase Real-time Sync (Obsolete)
    // Handled locally in QRBooking.jsx now.

    // Initial sync
    pollServerDb();

    // Poll every 3000ms
    const interval = setInterval(pollServerDb, 3000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // ---------------------------------------------------
  // (Obsolete) listenToRegistrations removed because we now use real-time listeners in QRBooking.jsx


  
  // Route helper to jump to details
  const handleSelectTrip = (tripId) => {
    setSelectedTripId(tripId);
    setActiveTab("manifest");
  };

  const handleClearPrintTripId = () => {
    setTargetPrintTripId("");
  };

  // Helper to map UI tabs to their primary database permission ID
  const getTabPermId = (tab) => {
    const maps = {
      manifest: "checkin-tickets",
      "online-register": "checkin-tickets",
      commissions: "accounting-payroll",
      guides: "checkin-tickets",
      drivers: "checkin-tickets",
      boats: "checkin-tickets",
      reports: "accounting-payroll"
    };
    return maps[tab] || tab;
  };

  // Enforce tab permissions dynamically in real-time
  useEffect(() => {
    if (!currentUser) return;
    const availableTabs = [
      "dashboard", "checkin-tickets", "manifest", "online-register", 
      "commissions", "guides", "drivers", "boats", "reports", 
      "accounting-payroll", "settings"
    ];
    
    // Owner/Admin has bypass access
    if (currentUser.role === "owner" || currentUser.role === "admin") return;
    
    const permId = getTabPermId(activeTab);
    const isAllowed = currentUser.permissions?.[permId]?.view;
    if (!isAllowed) {
      const fallback = availableTabs.find(tab => {
        const pId = getTabPermId(tab);
        return currentUser.permissions?.[pId]?.view;
      });
      if (fallback) {
        setActiveTab(fallback);
      } else {
        setCurrentUser(null); // Force log out if no tabs are allowed
      }
    }
  }, [activeTab, currentUser]);


  if (isSelfRegister) {
    return (
      <ErrorBoundary>
        <SelfRegisterPortal initialPartnerId={partnerIdParam} />
      </ErrorBoundary>
    );
  }

  // If not logged in, render the login screen
  if (!currentUser) {
    return (
      <ErrorBoundary>
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </ErrorBoundary>
    );
  }

  // Render active module
  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <Dashboard 
            setActiveTab={setActiveTab} 
            onSelectTrip={handleSelectTrip} 
            currentUser={currentUser}
            userRole={currentUser.role}
          />
        );
      case "checkin-tickets":
        return (
          <CheckInTickets 
            currentUser={currentUser} 
            preloadedBookingId={preloadedBookingId}
            clearPreloadedBooking={() => setPreloadedBookingId(null)}
          />
        );
      case "manifest":
        return <TicketManifest activeTripId={selectedTripId} onBack={() => {
          setSelectedTripId("");
          setActiveTab("dashboard");
        }} />;
      case "online-register":
        return (
          <OnlineRegisterQR 
            setActiveTab={setActiveTab}
            setPreloadedBookingId={setPreloadedBookingId}
          />
        );
      case "commissions":
        return <CommissionTracker />;
      case "guides":
        return <LiveStatusBoard type="guides" />;
      case "drivers":
        return <LiveStatusBoard type="drivers" />;
      case "boats":
        return <LiveStatusBoard type="boats" />;
      case "reports":
        return <Reports />;
      case "accounting-payroll":
        return <AccountingPayroll currentUser={currentUser} />;
      case "settings":
        return <SettingsPanel currentUser={currentUser} />;
      default:
        return (
          <Dashboard 
            setActiveTab={setActiveTab} 
            onSelectTrip={handleSelectTrip} 
            currentUser={currentUser}
            userRole={currentUser.role}
          />
        );
    }
  };

  const isProductionWeb = typeof window !== "undefined" && 
    window.location.hostname !== "localhost" && 
    window.location.hostname !== "127.0.0.1" && 
    !window.location.hostname.startsWith("192.168.") && 
    !window.location.hostname.endsWith(".trycloudflare.com");
  
  const showSyncWarning = isProductionWeb && !isFirebaseConfigured();

  return (
    <ErrorBoundary>
      <div className="app-container">
        {/* Navigation Sidebar */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          currentUser={currentUser} 
          onLogout={handleLogout} 
        />

        {/* Main Viewport */}
        <main className="main-content">
          {showSyncWarning && (
            <div style={{
              background: "#fffbeb",
              borderLeft: "4px solid #d97706",
              padding: "16px 20px",
              marginBottom: "20px",
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              color: "#78350f"
            }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <span style={{ fontSize: "1.25rem", marginTop: "-2px" }}>⚠️</span>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "0.95rem", fontWeight: "700" }}>
                    คำเตือน: ระบบไม่ได้เชื่อมต่อคลาวด์ (Firebase) / Cloud DB Offline
                  </h4>
                  <p style={{ margin: "0 0 12px 0", fontSize: "0.85rem", lineHeight: "1.5" }}>
                    ขณะนี้คุณใช้งานผ่านลิงก์ Vercel ซึ่งไม่สามารถเชื่อมต่อฐานข้อมูลได้โดยตรง ข้อมูลที่ลูกค้าสแกนและลงทะเบียนบนมือถือ<b>จะไม่ส่งเข้ามาที่คอมพิวเตอร์เครื่องนี้</b>!
                  </p>
                  {tunnelUrl ? (
                    <div style={{ background: "#ffffff", padding: "12px 16px", borderRadius: "6px", border: "1px solid #fcd34d", display: "inline-block" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: "600" }}>👉 กรุณาเข้าใช้งานผ่านลิงก์เซิร์ฟเวอร์หลักของร้าน (เครื่องแคชเชียร์):</span><br />
                      <a href={tunnelUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.95rem", color: "#b45309", fontWeight: "700", textDecoration: "underline", wordBreak: "break-all" }}>
                        {tunnelUrl}
                      </a>
                    </div>
                  ) : (
                    <p style={{ margin: "0", fontSize: "0.85rem", fontWeight: "600" }}>
                      👉 โปรดเปิดระบบและรันผ่านเซิร์ฟเวอร์แคชเชียร์ (Localhost/Cloudflare Tunnel) เพื่อให้ระบบสแกนและซิงก์ทำงานได้สมบูรณ์
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          {renderTabContent()}
        </main>

        {/* Inactivity Warning Banner Overlay */}
        {showTimeoutWarning && (
          <div style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: "#ffffff",
            border: "2px solid #e11d48",
            borderRadius: "16px",
            padding: "20px 24px",
            boxShadow: "0 20px 40px -10px rgba(15, 23, 42, 0.3)",
            zIndex: 10000,
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            maxWidth: "360px",
            color: "#0f172a",
            animation: "scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: "700", fontSize: "1.1rem", color: "#e11d48" }}>
              <span style={{ fontSize: "1.35rem" }}>⏳</span>
              <span>{t("inactivity_warning_title", "ແຈ້ງເຕືອນໝົດເວລາໃຊ້ງານ")}</span>
            </div>
            <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: "1.5", color: "#475569" }}>
              {lang === "en" 
                ? "You have been inactive for 29 minutes. You will be logged out in " 
                : "ທ່ານບໍ່ມີການເຄື່ອນໄຫວເປັນເວລາ 29 ນາທີ. ລະບົບຈະອອກຈາກລະບົບໃນອີກ "}
              <strong style={{ color: "#e11d48", fontSize: "1.1rem" }}>{warningTimeLeft}</strong>
              {lang === "en" ? " seconds." : " ວິນາທີ."}
            </p>
            <button 
              onClick={() => {
                // Trigger click event on window to reset the timer
                window.dispatchEvent(new Event("click"));
              }}
              style={{
                background: "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)",
                color: "#ffffff",
                border: "none",
                padding: "10px 16px",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: "700",
                fontSize: "0.95rem",
                boxShadow: "0 4px 12px rgba(15, 118, 110, 0.2)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(15, 118, 110, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(15, 118, 110, 0.2)";
              }}>
              {lang === "en" ? "Stay Logged In" : "ສືບຕໍ່ໃຊ້ງານ"}
            </button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}