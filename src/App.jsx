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
import { migrateDb } from "./db/mockDb";
import { useLanguage } from "./utils/LanguageContext";
import ErrorBoundary from "./components/ErrorBoundary";


export default function App() {
  const { lang, t } = useLanguage();
  const [activeTab, setActiveTab] = useState("dashboard");

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
  const isSelfRegister = params.get("mode") === "self-register";
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

    // Firebase Real-time Sync (if configured)
    let unsubscribeFirebase = null;
    try {
      // Need to import listenToFirebaseDb dynamically or at the top
      // We'll just dispatch the event when Firebase updates
      import("./db/firebaseSync").then(({ listenToFirebaseDb }) => {
        unsubscribeFirebase = listenToFirebaseDb((newData) => {
          if (newData && active) {
            const currentLocalRaw = localStorage.getItem("pos_boat_db");
            if (currentLocalRaw !== JSON.stringify(newData)) {
              localStorage.setItem("pos_boat_db", JSON.stringify(newData));
              window.dispatchEvent(new Event("db-update"));
            }
          }
        });
      }).catch(err => console.warn("Firebase sync module not loaded:", err));
    } catch (e) {
      console.warn(e);
    }

    // Initial sync
    pollServerDb();

    // Poll every 3000ms
    const interval = setInterval(pollServerDb, 3000);

    return () => {
      active = false;
      clearInterval(interval);
      if (unsubscribeFirebase) {
        unsubscribeFirebase();
      }
    };
  }, []);

  
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