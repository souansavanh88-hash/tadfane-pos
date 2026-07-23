// SettingsPanel.jsx - System Settings Management
import React, { useState, useEffect } from "react";
import { getDb, saveDb, resetDb, purgeTestData } from "../db/mockDb";
import { pushToFirebase, forcePushToFirebase } from "../db/firebaseIntegration";
import { clearAllBookingsFromFirebase } from "../db/firebaseSync";
import { formatLAK } from "../utils/helpers";
import { useLanguage } from "../utils/LanguageContext";
import { Settings, Save, RefreshCw, AlertTriangle, Users, Shield, Trash2, Plus, Cloud } from "lucide-react";

const DEFAULT_PERMISSIONS_BY_ROLE = {
  owner: {
    dashboard: { view: true, add: true, edit: true, approve: true, delete: true },
    "checkin-tickets": { view: true, add: true, edit: true, approve: true, delete: true },
    "accounting-payroll": { view: true, add: true, edit: true, approve: true, delete: true },
    settings: { view: true, add: true, edit: true, approve: true, delete: true }
  },
  manager: {
    dashboard: { view: true, add: false, edit: false, approve: true, delete: false },
    "checkin-tickets": { view: true, add: true, edit: true, approve: false, delete: false },
    "accounting-payroll": { view: true, add: false, edit: false, approve: true, delete: false },
    settings: { view: true, add: false, edit: false, approve: false, delete: false }
  },
  accounting: {
    dashboard: { view: true, add: false, edit: false, approve: false, delete: false },
    "checkin-tickets": { view: false, add: false, edit: false, approve: false, delete: false },
    "accounting-payroll": { view: true, add: true, edit: true, approve: false, delete: false },
    settings: { view: false, add: false, edit: false, approve: false, delete: false }
  },
  cashier: {
    dashboard: { view: false, add: false, edit: false, approve: false, delete: false },
    "checkin-tickets": { view: true, add: true, edit: false, approve: false, delete: false },
    "accounting-payroll": { view: false, add: false, edit: false, approve: false, delete: false },
    settings: { view: false, add: false, edit: false, approve: false, delete: false }
  },
  tour_operation: {
    dashboard: { view: true, add: false, edit: false, approve: false, delete: false },
    "checkin-tickets": { view: true, add: false, edit: true, approve: false, delete: false },
    "accounting-payroll": { view: false, add: false, edit: false, approve: false, delete: false },
    settings: { view: false, add: false, edit: false, approve: false, delete: false }
  }
};

const DEFAULT_RESPONSIBILITIES_BY_ROLE = {
  owner: { accounting: true, tickets: true, crew_dispatch: true },
  manager: { accounting: false, tickets: false, crew_dispatch: false },
  accounting: { accounting: true, tickets: false, crew_dispatch: false },
  cashier: { accounting: false, tickets: true, crew_dispatch: false },
  tour_operation: { accounting: false, tickets: false, crew_dispatch: true }
};


export default function SettingsPanel({ currentUser }) {
  const { lang, t } = useLanguage();
  const [db, setDb] = useState(getDb());
  const [basePrice, setBasePrice] = useState(0);
  const [rateTHB, setRateTHB] = useState(0);
  const [rateUSD, setRateUSD] = useState(0);
  const [expenseApprovalLimit, setExpenseApprovalLimit] = useState(500000);
  const [customHostUrl, setCustomHostUrl] = useState(localStorage.getItem("pos_custom_host_url") || "");
  const [logo, setLogo] = useState(null);

  // Shop / Receipt info
  const [shopName, setShopName] = useState("");
  const [shopNameLao, setShopNameLao] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [shopAddressLao, setShopAddressLao] = useState("");
  const [shopTel, setShopTel] = useState("");
  const [shopTaxId, setShopTaxId] = useState("");
  const [shopExtra, setShopExtra] = useState("");

  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  
  // Expanded user permissions panel state
  const [selectedUserId, setSelectedUserId] = useState(null);
  // Add Staff form states
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addRole, setAddRole] = useState("cashier");

  // Form states for service tiered price management
  const [newServiceName, setNewServiceName] = useState("");
  const [newCurrency, setNewCurrency] = useState("LAK");
  const [newTier1, setNewTier1] = useState(0);
  const [newTier1Type, setNewTier1Type] = useState("pax");
  const [newTier2, setNewTier2] = useState(0);
  const [newTier2Type, setNewTier2Type] = useState("pax");
  const [newTier3, setNewTier3] = useState(0);
  const [newTier3Type, setNewTier3Type] = useState("pax");
  const [editingServiceId, setEditingServiceId] = useState(null);

  useEffect(() => {
    const data = getDb();
    setDb(data);
    setBasePrice(data.settings.basePriceLAK);
    setRateTHB(data.settings.rateTHB);
    setRateUSD(data.settings.rateUSD);
    setExpenseApprovalLimit(data.settings.expenseApprovalLimit || 500000);
    setLogo(data.settings.logo || null);
    setShopName(data.settings.shopName || "");
    setShopNameLao(data.settings.shopNameLao || "");
    setShopAddress(data.settings.shopAddress || "");
    setShopAddressLao(data.settings.shopAddressLao || "");
    setShopTel(data.settings.shopTel || "");
    setShopTaxId(data.settings.shopTaxId || "");
    setShopExtra(data.settings.shopExtra || "");
    setUsers(data.users || []);
    setServices(data.services || []);
  }, []);

  const handleSaveService = (e) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    let updatedServices;
    if (editingServiceId) {
      updatedServices = services.map(s => 
        s.id === editingServiceId 
          ? { 
              ...s, 
              name: newServiceName, 
              currency: newCurrency,
              priceTier1: parseInt(newTier1) || 0, 
              priceTier1Type: newTier1Type,
              priceTier2: parseInt(newTier2) || 0, 
              priceTier2Type: newTier2Type,
              priceTier3: parseInt(newTier3) || 0,
              priceTier3Type: newTier3Type,
              price: parseInt(newTier1) || 0
            } 
          : s
      );
      alert(lang === "en" ? "Activity updated successfully!" : "ແກ້ໄຂກິດຈະກຳວຼບວ໋ອຫແລ້ວ!");
    } else {
      const newId = `SRV-00${services.length + 1}`;
      const newSrv = {
        id: newId,
        name: newServiceName,
        currency: newCurrency,
        priceTier1: parseInt(newTier1) || 0,
        priceTier1Type: newTier1Type,
        priceTier2: parseInt(newTier2) || 0,
        priceTier2Type: newTier2Type,
        priceTier3: parseInt(newTier3) || 0,
        priceTier3Type: newTier3Type,
        price: parseInt(newTier1) || 0,
        status: "active"
      };
      updatedServices = [...services, newSrv];
    alert(lang === "en" ? "New activity added successfully!" : "ເພີ່ມກິດຈະກຳໃໝ່ຮຽບຮ້ອຍແລ້ວ!");
    }

    setServices(updatedServices);
    const updatedDb = { ...db, services: updatedServices };
    saveDb(updatedDb);
    setDb(updatedDb);

    setNewServiceName("");
    setNewCurrency("LAK");
    setNewTier1(0);
    setNewTier1Type("pax");
    setNewTier2(0);
    setNewTier2Type("pax");
    setNewTier3(0);
    setNewTier3Type("pax");
    setEditingServiceId(null);
  };

  const handleToggleServiceStatus = (id) => {
    const updatedServices = services.map(s => 
      s.id === id ? { ...s, status: s.status === "active" ? "inactive" : "active" } : s
    );
    setServices(updatedServices);
    const updatedDb = { ...db, services: updatedServices };
    saveDb(updatedDb);
    setDb(updatedDb);
  };

  const handleDeleteService = (id) => {
    if (!window.confirm(lang === "en" ? "Are you sure you want to delete this activity?" : "ທ່ານຕ້ອງການລຶບກິດຈະກຳນີ້ແມ່ນບໍ່?")) return;
    const updatedServices = services.filter(s => s.id !== id);
    setServices(updatedServices);
    const updatedDb = { ...db, services: updatedServices };
    saveDb(updatedDb);
    setDb(updatedDb);
    alert(lang === "en" ? "Activity deleted successfully!" : "ລົບກິດຈະກຳສຳເລັດແລ້ວ!");
  };

  const handleEditClick = (srv) => {
    setEditingServiceId(srv.id);
    setNewServiceName(srv.name);
    setNewCurrency(srv.currency || "LAK");
    setNewTier1(srv.priceTier1 || srv.price || 0);
    setNewTier1Type(srv.priceTier1Type || "pax");
    setNewTier2(srv.priceTier2 || srv.price || 0);
    setNewTier2Type(srv.priceTier2Type || "pax");
    setNewTier3(srv.priceTier3 || srv.price || 0);
    setNewTier3Type(srv.priceTier3Type || "pax");
  };

  const handleUpdateUser = (id, field, value) => {
    const updatedUsers = users.map(u => u.id === id ? { ...u, [field]: value } : u);
    setUsers(updatedUsers);
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!addName.trim() || !addEmail.trim() || !addPassword.trim()) {
    alert(lang === "en" ? "Please fill in all fields." : "ກະລຸນາກອກຂໍ້ມູນໃຫ້ຄົບຖ້ວນ.");
      return;
    }
    if (users.some(u => u.email.toLowerCase() === addEmail.toLowerCase().trim())) {
    alert(lang === "en" ? "This email is already registered." : "ອີເມວນີ້ຖືກໃຊ້ງານແລ້ວ.");
      return;
    }
    const newId = `USR-${Date.now()}`;
    const newUser = {
      id: newId,
      name: addName.trim(),
      email: addEmail.toLowerCase().trim(),
      password: addPassword.trim(),
      role: addRole,
      permissions: JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS_BY_ROLE[addRole] || DEFAULT_PERMISSIONS_BY_ROLE.cashier)),
      responsibilities: JSON.parse(JSON.stringify(DEFAULT_RESPONSIBILITIES_BY_ROLE[addRole] || DEFAULT_RESPONSIBILITIES_BY_ROLE.cashier))
    };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    setAddName("");
    setAddEmail("");
    setAddPassword("");
    setAddRole("cashier");
    alert(lang === "en" ? "User added successfully! (Click Save Accounts below to commit)" : "ເພີ່ມບັນຊີຜູ້ໃຊ້ພະນັກງານຮຽບຮ້ອຍ! (ກົດບັນທຶກບັນຊີດ້ານລຸ່ມເພື່ອບັນທຶກ)");
  };

  const handleDeleteUser = (id) => {
    if (id === currentUser.id) {
    alert(lang === "en" ? "You cannot delete your own account." : "ທ່ານບໍ່ສາມາດລຶບບັນຊີຂອງຕົນເອງໄດ້.");
      return;
    }
    if (!window.confirm(lang === "en" ? "Are you sure you want to delete this user?" : "ທ່ານຕ້ອງການລຶບບັນຊີຜູ້ໃຊ້ນີ້ແມ່ນບໍ່?")) return;
    const updatedUsers = users.filter(u => u.id !== id);
    setUsers(updatedUsers);
    if (selectedUserId === id) {
      setSelectedUserId(null);
    }
    alert(lang === "en" ? "User deleted successfully! (Click Save Accounts below to commit)" : "ລົບບັນຊີສຳເລັດ! (ກົດບັນທຶກບັນຊີດ້ານລຸ່ມເພື່ອບັນທຶກ)");
  };

  const handleRoleChange = (id, newRole) => {
    if (id === currentUser.id) {
    alert(lang === "en" ? "You cannot change your own role to prevent lockout." : "ທ່ານບໍ່ສາມາດປ່ຽນບົດບາດຂອງລີນເງໄດ້ ເພື່ອປ້ອງກັນການລັອກລະບົບ.");
      return;
    }
    const updatedUsers = users.map(u => {
      if (u.id === id) {
    if (window.confirm(lang === "en" ? "Reset permissions to default for new role?" : "ທ່ານຕ້ອງການຣີເຊັດສິດການເຂົ້າໃຊ້ງານເປັນຄ່າເລີ່ມຕົ້ນຂອງບົດບາດໃໝ່ນີ້ແມ່ນບໍ່?")) {
          return {
            ...u,
            role: newRole,
            permissions: JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS_BY_ROLE[newRole] || DEFAULT_PERMISSIONS_BY_ROLE.cashier)),
            responsibilities: JSON.parse(JSON.stringify(DEFAULT_RESPONSIBILITIES_BY_ROLE[newRole] || DEFAULT_RESPONSIBILITIES_BY_ROLE.cashier))
          };
        } else {
          return { ...u, role: newRole };
        }
      }
      return u;
    });
    setUsers(updatedUsers);
  };

  const handleTogglePermission = (userId, moduleId, actionKey) => {
    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        const perms = { ...u.permissions };
        if (!perms[moduleId]) perms[moduleId] = { view: false, add: false, edit: false, approve: false, delete: false };
        perms[moduleId] = {
          ...perms[moduleId],
          [actionKey]: !perms[moduleId][actionKey]
        };
        return { ...u, permissions: perms };
      }
      return u;
    });
    setUsers(updatedUsers);
  };

  const handleToggleResponsibility = (userId, taskKey) => {
    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        const resps = { ...u.responsibilities };
        if (!resps) {
          u.responsibilities = { accounting: false, tickets: false, crew_dispatch: false };
        }
        return {
          ...u,
          responsibilities: {
            ...u.responsibilities,
            [taskKey]: !u.responsibilities[taskKey]
          }
        };
      }
      return u;
    });
    setUsers(updatedUsers);
  };

  const handleSaveUsers = (e) => {
    e.preventDefault();
    const updatedDb = { ...db, users };
    saveDb(updatedDb);
    setDb(updatedDb);
    alert(lang === "en" ? "User accounts and permissions updated successfully!" : "ບັນທຶກຂໍ້ມູນບັນຊີຜູ້ໃຊ້ ແລະ ສິດພະນັກງານຮຽບຮ້ອຍ!");
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();

    const updatedDb = { ...db };
    updatedDb.settings = {
      ...updatedDb.settings,
      basePriceLAK: parseInt(basePrice),
      rateTHB: parseFloat(rateTHB),
      rateUSD: parseFloat(rateUSD),
      expenseApprovalLimit: parseInt(expenseApprovalLimit) || 500000,
      shopName: shopName.trim() || "TADFANE RAFTING",
      shopNameLao: shopNameLao.trim(),
      shopAddress: shopAddress.trim(),
      shopAddressLao: shopAddressLao.trim(),
      shopTel: shopTel.trim(),
      shopTaxId: shopTaxId.trim(),
      shopExtra: shopExtra.trim()
    };

    saveDb(updatedDb);
    setDb(updatedDb);
    localStorage.setItem("pos_custom_host_url", customHostUrl.trim());
    window.dispatchEvent(new Event("db-update"));
    alert(lang === "en" ? "System settings updated successfully!" : "ບັນທຶກການຕັ້ງຄ່າລະບົບຮຽບຮ້ອຍ!");
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match("image.*")) {
    alert(lang === "en" ? "Please select an image file only." : "ກະລຸນາເລືອກໄຟລ໌ຮູບພາບເທົ່ານັ້ນ.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target.result;
      setLogo(base64String);

      const updatedDb = { ...db };
      updatedDb.settings = {
        ...updatedDb.settings,
        logo: base64String
      };
      saveDb(updatedDb);
      setDb(updatedDb);
      window.dispatchEvent(new Event("db-update"));
    alert(lang === "en" ? "Logo uploaded successfully!" : "ອັບໂຫລດໂລໂກ້ສຳເລັດແລ້ວ!");
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    if (window.confirm(lang === "en" ? "Reset to default logo?" : "ທ່ານຕ້ອງການຣີເຊັດກັບໄປໃຊ້ໂລໂກ້ເລີ່ມຕົ້ນແມ່ນບໍ່?")) {
      setLogo(null);
      const updatedDb = { ...db };
      updatedDb.settings = {
        ...updatedDb.settings,
        logo: null
      };
      saveDb(updatedDb);
      setDb(updatedDb);
      window.dispatchEvent(new Event("db-update"));
    alert(lang === "en" ? "Logo reset successfully." : "ຣີເຊັດໂລໂກ້ຮຽບຮ້ອຍແລ້ວ.");
    }
  };

  const handleResetSystem = async () => {
    if (window.confirm(lang === "en" ? "Warning: All bookings, customers, and manifest history will be deleted and reset. Confirm reset?" : "ຄຳເຕືອນ: ຂໍ້ມູນການຈອງ, ລູກຄ້າ ແລະ ປະຫວັດການທ່ອງທ່ຽວທັງໝົດຈະຖືກລຶບ ແລະ ຣີເຊັດກັບເປັນຄ່າເລີ່ມຕົ້ນ. ຢືນຢັນການຣີເຊັດລະບົບແມ່ນບໍ່?")) {
      const reseted = resetDb();
      setDb(reseted);
      setBasePrice(reseted.settings.basePriceLAK);
      setRateTHB(reseted.settings.rateTHB);
      setRateUSD(reseted.settings.rateUSD);
      
      try {
        await forcePushToFirebase(reseted);
      } catch (err) {
        console.error("Failed to push reset to firebase", err);
      }
      
      alert(lang === "en" ? "System database reset successful." : "ຣີເຊັດລະບົບຮຽບຮ້ອຍແລ້ວ.");
      window.location.reload();
    }
  };

  const handleRestoreBackup = () => {
    if (window.confirm("🚨 ທ່ານຕ້ອງການກູ້ຄືນຂໍ້ມູນສຳຮອງໃນເຄື່ອງນີ້ແມ່ນບໍ່? (Are you sure you want to restore the local backup? This will overwrite the current data and push it to the cloud.)")) {
      const backupRaw = localStorage.getItem("pos_local_db_backup");
      if (backupRaw) {
        try {
          const backupDb = JSON.parse(backupRaw);
          saveDb(backupDb);
          setDb(backupDb);
          alert("✅ กู้คืนข้อมูลสำเร็จแล้ว! (Restore successful!)");
          window.location.reload();
        } catch (e) {
          alert("❌ เกิดข้อผิดพลาดในการอ่านไฟล์สำรอง (Backup file is corrupted)");
        }
      } else {
        alert("⚠️ ไม่พบข้อมูลสำรองในเครื่องนี้ (No local backup found on this device)");
      }
    }
  };

  const handleForceSync = async () => {
    if (window.confirm("ທ່ານຕ້ອງການອັບໂຫຼດຂໍ້ມູນໃນເຄື່ອງນີ້ຂຶ້ນ Cloud (Firebase) ແມ່ນບໍ່? (Upload local data to Cloud?)")) {
      const currentDb = getDb();
      try {
        const { forcePushToFirebase } = await import("../db/firebaseIntegration");
        await forcePushToFirebase(currentDb);
        alert("✅ ອັບໂຫຼດຂໍ້ມູນຂຶ້ນ Cloud ສຳເລັດແລ້ວ! (Successfully migrated data to Cloud)");
      } catch (err) {
        alert("❌ Error: " + err.message + "\n\nCode: " + (err.code || "unknown"));
        console.error("Force sync error:", err);
      }
    }
  };

  const handleForcePullCloud = () => {
    if (window.confirm(lang === "en" ? "Force pull database from Cloud? This will delete local cache on this device and load the latest data from the Cloud." : "🚨 ທ່ານຕ້ອງການດຶງຂໍ້ມູນຫຼ້າສຸດຈາກ Cloud ແມ່ນບໍ່? ການດຳເນີນການນີ້ຈະລຶບຂໍ້ມູນແຄຊໃນເຄື່ອງນີ້ ແລະ ດຶງຂໍ້ມູນຫຼ້າສຸດຈາກ Cloud ມາແທນທີ່.")) {
      localStorage.removeItem("pos_tadfane_db");
      localStorage.removeItem("pos_local_db_backup");
      window.location.reload();
    }
  };

  const handlePurgeTestData = async () => {
    if (window.confirm(lang === "en" ? "Are you sure you want to clear all sales data? (Agents, employees, and settings will not be deleted)" : "ທ່ານຕ້ອງການລຶບຂໍ້ມູນການຂາຍທັງໝົດແມ່ນບໍ່? (ເອເຈນ, ພະນັກງານ ແລະ ການຕັ້ງຄ່າຈະບໍ່ຖືກລຶບ)")) {
      purgeTestData();
      const data = getDb();
      setDb(data);
      
      try {
        await forcePushToFirebase(data);
        await clearAllBookingsFromFirebase();
      } catch (err) {
        console.error("Failed to push purge to firebase", err);
      }

      alert(lang === "en" ? "Test data purged successfully!" : "ລ້າງຂໍ້ມູນການທົດລອງຮຽບຮ້ອຍແລ້ວ!");
      window.location.reload();
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>System Settings (ການຕັ້ງຄ່າລະບົບ)</h1>
          <p>ກຳນົດຄ່າລາຄາປີ້, ອັດຕາແລກປ່ຽນເງິນຕາ, ຂໍ້ມູນເຮືອ ແລະ ຈັດການຖານຂໍ້ມູນ</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "2rem" }}>
        
        {/* Core Prices and Currencies */}
        <div className="card">
          <h2 style={{ fontSize: "1.25rem", marginBottom: "1.5rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "5px" }}>
            <Settings size={20} color="var(--primary)" />
            {t("price_exchange_settings", "ຕັ້ງຄ່າລາຄາ & ອັດຕາແລກປ່ຽນ / Price & Exchange settings")}
          </h2>

          <form onSubmit={handleSaveSettings}>



            <div className="form-row" style={{ marginTop: "1rem" }}>
              <div className="form-group">
                <label>{t("rate_thb_label", "ອັດຕາແລກປ່ຽນເງિનບາດ (1 THB = X LAK)")}</label>
                <input 
                  type="number"
                  className="form-control"
                  value={rateTHB}
                  onChange={(e) => setRateTHB(e.target.value)}
                  min="0"
                  step="1"
                  required
                  
                />
              </div>

              <div className="form-group">
                <label>{t("rate_usd_label", "ອັດຕາແລກປ່ຽນເງિનໂດລາ (1 USD = X LAK)")}</label>
                <input 
                  type="number"
                  className="form-control"
                  value={rateUSD}
                  onChange={(e) => setRateUSD(e.target.value)}
                  min="0"
                  step="1"
                  required
                  
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: "1rem" }}>
              <label>{t("manager_approval_limit_label", "ເກນການອະນຸມັດລາຍຈ່າຍສູງສຸດສຳລັບຜູ້ຈັດການ (LAK) / Manager Expense Approval Limit")}</label>
              <input 
                type="number"
                className="form-control"
                value={expenseApprovalLimit}
                onChange={(e) => setExpenseApprovalLimit(e.target.value)}
                min="0"
                step="1"
                required
                
              />
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem", display: "block" }}>
                {t("manager_limit_desc", "ຈຳນວນເງິນສູງສຸດທີ່ຜູ້ຈັດການສາມາດອະນຸມັດໄດ້ (ຖ້າເກີນນີ້ຕ້ອງໃຫ້ເຈົ້າຂອງຮ້ານອະນຸມັດ):")} <strong>{formatLAK(expenseApprovalLimit)}</strong>
              </span>
            </div>

            <div className="form-group" style={{ marginTop: "1rem" }}>
              <label>{t("server_host_url_label", "ລິ້ງເຄື່ອງແມ່ຂ່າຍສຳລັບສະແກນ QR / Server Host URL")}</label>
              <input 
                type="text"
                className="form-control"
                value={customHostUrl}
                onChange={(e) => setCustomHostUrl(e.target.value)}
                placeholder={t("empty_for_auto", "ປ່ອຍວ່າງເພື່ອໃຊ້ອັດຕະໂນມັດ / Leave blank for auto")}
                
              />
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem", display: "block" }}>
                {t("server_host_url_desc", "ລະບຸ IP ຫຼື Domain ຂອງເຄື່ອງເຊີບເວີເພື່ອໃຫ້ໂທລະສັບຂອງລູກຄ້າສະແກນເຂົ້າລິ້ງກອກຂໍ້ມູນໄດ້ຜ່ານ Wi-Fi")}
              </span>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1.5rem" }}>
                <Save size={16} /> {t("save_settings", "ບັນທຶກການຕັ້ງຄ່າ / Save Settings")}
              </button>
          </form>
        </div>

        {/* Receipt / Bill Settings */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "1.5rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "5px" }}>
            🧾 {t("receipt_settings_title", "ຕັ້ງຄ່າໃບບິນ / Receipt & Bill Settings")}
          </h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
            {t("receipt_settings_desc", "ຂໍ້ມູນເຫຼົ່ານີ້ຈະແສດງໃນໃບບິນ/ໃບເສັດທຸກໃບ / This info appears on every bill & receipt")}
          </p>

          <form onSubmit={handleSaveSettings}>
            <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label>{t("shop_name_en", "ຊື່ຮ້ານ (EN) / Shop Name (English)")} *</label>
                <input 
                  type="text"
                  className="form-control"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="TADFANE RAFTING"
                  
                />
              </div>
              <div className="form-group">
                <label>{t("shop_name_lao", "ຊື່ຮ້ານ (ລາວ) / Shop Name (Lao)")}</label>
                <input 
                  type="text"
                  className="form-control"
                  value={shopNameLao}
                  onChange={(e) => setShopNameLao(e.target.value)}
                  placeholder="ຕາດຟານ ລ່ອງແກ່ງ"
                  
                />
              </div>
            </div>

            <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
              <div className="form-group">
                <label>{t("shop_address_en", "ທີ່ຢູ່ (EN) / Address (English)")}</label>
                <input 
                  type="text"
                  className="form-control"
                  value={shopAddress}
                  onChange={(e) => setShopAddress(e.target.value)}
                  placeholder="Vang Vieng, Laos"
                  
                />
              </div>
              <div className="form-group">
                <label>{t("shop_address_lao", "ທີ່ຢູ່ (ລາວ) / Address (Lao)")}</label>
                <input 
                  type="text"
                  className="form-control"
                  value={shopAddressLao}
                  onChange={(e) => setShopAddressLao(e.target.value)}
                  placeholder="ວັງວຽງ, ປະເທດລາວ"
                  
                />
              </div>
            </div>

            <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
              <div className="form-group">
                <label>{t("shop_tel", "ເບີໂທລະສັບ / Phone Number")}</label>
                <input 
                  type="text"
                  className="form-control"
                  value={shopTel}
                  onChange={(e) => setShopTel(e.target.value)}
                  placeholder="+856 20 555-9000"
                  
                />
              </div>
              <div className="form-group">
                <label>{t("shop_tax_id", "ເລກປະຈຳຕົວຜູ້ເສຍອາກອນ / Tax ID")}</label>
                <input 
                  type="text"
                  className="form-control"
                  value={shopTaxId}
                  onChange={(e) => setShopTaxId(e.target.value)}
                  placeholder="(Optional)"
                  
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: "1rem" }}>
              <label>{t("shop_extra_info", "ຂໍ້ມູນເພີ່ມເຕີມ / Extra Info (shown on receipt)")}</label>
              <input 
                type="text"
                className="form-control"
                value={shopExtra}
                onChange={(e) => setShopExtra(e.target.value)}
                placeholder={t("shop_extra_placeholder", "ເຊັ່ນ: ເປີດ 8:00-17:00 / e.g. Open 8AM-5PM")}
                
              />
            </div>

            {/* Receipt Preview */}
            <div style={{ marginTop: "1.5rem", padding: "16px", background: "#fff", border: "2px dashed #cbd5e1", borderRadius: "10px", textAlign: "center", fontFamily: "monospace", color: "#000" }}>
              <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginBottom: "8px", fontFamily: "inherit" }}>👁️ {t("receipt_preview", "ຕົວຢ່າງໃບບິນ / Receipt Preview")}</div>
              {logo && <img src={logo} alt="Logo" style={{ maxHeight: "50px", maxWidth: "140px", objectFit: "contain", marginBottom: "6px" }} />}
              <div style={{ fontWeight: "900", fontSize: "1.1rem" }}>{shopName || "SHOP NAME"}</div>
              {shopNameLao && <div style={{ fontWeight: "900", fontSize: "0.95rem" }}>{shopNameLao}</div>}
              {(shopAddress || shopAddressLao) && <div style={{ fontSize: "0.75rem", marginTop: "2px" }}>{lang === "en" ? shopAddress : shopAddressLao || shopAddress}</div>}
              {shopTel && <div style={{ fontSize: "0.75rem" }}>Tel: {shopTel}</div>}
              {shopTaxId && <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Tax ID: {shopTaxId}</div>}
              {shopExtra && <div style={{ fontSize: "0.7rem", color: "#64748b" }}>{shopExtra}</div>}
              <div style={{ borderTop: "2px dashed #000", marginTop: "8px", paddingTop: "4px", fontSize: "0.7rem" }}>- - - - - - -</div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }}>
                <Save size={16} /> {t("save_receipt_settings", "ບັນທຶກຂໍ້ມູນໃບບິນ / Save Receipt Settings")}
              </button>
          </form>
        </div>

        {/* Database Roster Info & System Reset */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Logo Uploader Panel */}
          <div className="card">
            <h3 style={{ fontSize: "1.15rem", color: "var(--text-primary)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
              🖼️ {t("branding_logo", "ໂລໂກ້ແບຣນຂອງລະບົບ / Branding Logo")}
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "1.25rem", lineHeight: "1.4" }}>
              {t("upload_logo_desc", "ອັບໂຫລດພາບໂລໂກ້ຂອງທ່ານ (PNG/JPG) ເພື່ອສະແດງເທິງເມນູ, ໜ້າຈໍເຂົ້າສູ່ລະບົບ, ບິນພິມ ແລະ ໜ້າລົງທະບຽນລູກຄ້າ")}
            </p>
            
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "15px", padding: "15px", border: "2px dashed var(--border-color)", borderRadius: "12px", background: "var(--bg-primary)" }}>
              {logo ? (
                <img src={logo} alt="Branding Logo" style={{ maxHeight: "80px", maxWidth: "100%", objectFit: "contain", borderRadius: "8px" }} />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "var(--text-muted)", gap: "8px" }}>
                  <span style={{ fontSize: "2.5rem" }}>🚢</span>
                  <span style={{ fontSize: "0.8rem", fontWeight: "600" }}>{t("no_custom_logo", "ບໍ່ມີໂລໂກ້ຄັດຕອມ (ໃຊ້ຮູບເຮືອເລີ່ມຕົ້ນ)")}</span>
                </div>
              )}

              {(true) && (
                <div style={{ display: "flex", gap: "10px", width: "100%", justifyContent: "center" }}>
                  <label className="btn btn-primary" style={{ padding: "8px 16px", fontSize: "0.85rem", cursor: "pointer", display: "inline-flex", gap: "6px" }}>
                    {t("upload_logo_btn", "ອັບໂຫລດໂລໂກ້ / Upload Logo")}
                    <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: "none" }} />
                  </label>

                  {logo && (
                    <button type="button" className="btn btn-secondary" style={{ padding: "8px 16px", fontSize: "0.85rem", background: "#fee2e2", color: "#991b1b", borderColor: "#fecaca" }} onClick={handleResetLogo}>
                      {t("reset_logo_btn", "ຣີເຊັດໂລໂກ້ / Reset")}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Boats Registry Info */}
          <div className="card">
            <h3 style={{ fontSize: "1.15rem", color: "var(--text-primary)", marginBottom: "1rem" }}>{t("active_fleet", "ທະບຽນເຮືອນຳທ່ຽວ (Active Fleet)")}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {db.boats.map(boat => (
                <div 
                  key={boat.id} 
                  style={{
                    padding: "0.6rem 0.75rem",
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.85rem",
                    color: "var(--text-secondary)"
                  }}
                >
                  <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>{boat.name}</span>
                  <span>{t("boat_capacity", "ຄວາມຈຸບ່ອນນັ່ງ:")} {boat.capacity} {t("pax_per_boat", "ຄົນ/ລຳ")}</span>
                </div>
              ))}
            </div>
          </div>



        </div>

      </div>

      {/* User Accounts Management Section */}
      <div className="card" style={{ marginTop: "2rem", padding: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "1.5rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>
          <Users size={20} color="var(--primary)" />
          {t("staff_accounts_mgmt", "ຕັ້ງຄ່າບັນຊີຜູ້ໃຊ້ພະນັກງານ / Staff Accounts Management")}
        </h2>
        
        {false ? (
          <div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
              {t("owner_access_only", "ເຂົ້າເຖິງສະເພາະເຈົ້າຂອງຮ້ານ (Owner Access Only)")}
            </p>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-color)", textAlign: "left" }}>
                  <th style={{ padding: "12px 10px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>{t("employee_name_header", "ຊື່ພະນັກງານ / Name")}</th>
                  <th style={{ padding: "12px 10px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>{t("email_header", "ອີເມວ / Email")}</th>
                  <th style={{ padding: "12px 10px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>{t("role_header", "ບົດບາດ / Role")}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((usr) => (
                  <tr key={usr.id} style={{ borderBottom: "1px solid var(--border-color)", height: "45px" }}>
                    <td style={{ padding: "10px", fontSize: "0.85rem", color: "var(--text-primary)" }}>{usr.name}</td>
                    <td style={{ padding: "10px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>{usr.email}</td>
                    <td style={{ padding: "10px", fontSize: "0.85rem", fontWeight: "600", color: "var(--primary)" }}>
                      {usr.role === "owner" && "👑 Owner"}
                      {usr.role === "manager" && "💼 Manager"}
                      {usr.role === "accounting" && "📊 Accounting"}
                      {usr.role === "cashier" && "💰 Cashier"}
                      {usr.role === "tour_operation" && "⚓ Tour Dispatcher"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "2rem" }}>
              {/* Left Column: Add New Staff Form */}
              <div style={{ borderRight: "1px solid var(--border-color)", paddingRight: "1.5rem" }}>
                <h3 style={{ fontSize: "1rem", color: "var(--text-primary)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Plus size={16} color="var(--primary)" />
                  {t("add_staff_title", "ເພີ່ມພະນັກງານໃໝ່ / Add New Staff")}
                </h3>
                <form onSubmit={handleAddUser} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div className="form-group">
                    <label style={{ fontSize: "0.8rem", fontWeight: "700" }}>{t("employee_full_name", "ຊື່ພະນັກງານ / Full Name")}</label>
                    <input 
                      type="text"
                      className="form-control"
                      value={addName}
                      onChange={(e) => setAddName(e.target.value)}
                      placeholder={t("placeholder_staff_name", "ສົມດີ ມີໄຊ / e.g. Somdee Meexay")}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: "0.8rem", fontWeight: "700" }}>{t("login_email", "ຊື່ເຂົ້າໃຊ້ງານ / Username")}</label>
                    <input 
                      type="text"
                      className="form-control"
                      value={addEmail}
                      onChange={(e) => setAddEmail(e.target.value)}
                      placeholder="somjai"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: "0.8rem", fontWeight: "700" }}>{t("password", "ລະຫັດຜ່ານ / Password")}</label>
                    <input 
                      type="text"
                      className="form-control"
                      value={addPassword}
                      onChange={(e) => setAddPassword(e.target.value)}
                      placeholder={t("min_characters", "ຢ່າງໜ້ອຍ 6 ຕົວອັກສອນ / Min 6 characters")}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: "0.8rem", fontWeight: "700" }}>{t("primary_role", "ບົດບາດຫຼັກ / Primary Role")}</label>
                    <select
                      className="form-control"
                      value={addRole}
                      onChange={(e) => setAddRole(e.target.value)}
                      style={{ width: "100%" }}
                    >
                      <option value="cashier">Cashier ({t("role_cashier", "ພະນັກງານຂາຍປີ້")})</option>
                      <option value="accounting">Accounting ({t("role_accounting", "ພະນັກງານບັນຊີ")})</option>
                      <option value="tour_operation">Tour Operation ({t("role_dispatcher", "ພະນັກງານປ່ອຍເຮືອ")})</option>
                      <option value="manager">Manager ({t("role_manager", "ຜູ້ຈັດການ")})</option>
                      <option value="owner">Owner ({t("role_owner", "ເຈົ້າຂອງຮ້ານ")})</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "6px" }}>
                    {t("add_account_btn", "ເພີ່ມບັນຊີ / Add Account")}
                  </button>
                </form>
              </div>

              {/* Right Column: Staff Roster & Config */}
              <div>
                <h3 style={{ fontSize: "1rem", color: "var(--text-primary)", marginBottom: "1rem" }}>
                  {t("staff_roster_title", "ລາຍຊື່ບັນຊີຜູ້ໃຊ້ພະນັກງານທັງໝົດ / Active Staff Roster")}
                </h3>
                <form onSubmit={handleSaveUsers}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
                      <thead>
                        <tr style={{ borderBottom: "2px solid var(--border-color)", textAlign: "left" }}>
                          <th style={{ padding: "8px 5px", fontSize: "0.8rem", color: "var(--text-secondary)" }}>{t("role_header", "ບົດບາດ / Role")}</th>
                          <th style={{ padding: "8px 5px", fontSize: "0.8rem", color: "var(--text-secondary)" }}>{t("employee_name_header", "ຊື່ພະນັກງານ / Name")}</th>
                          <th style={{ padding: "8px 5px", fontSize: "0.8rem", color: "var(--text-secondary)" }}>{t("email_header", "ຊື່ເຂົ້າໃຊ້ / Username")}</th>
                          <th style={{ padding: "8px 5px", fontSize: "0.8rem", color: "var(--text-secondary)" }}>{t("password", "ລະຫັດຜ່ານ / Password")}</th>
                          <th style={{ padding: "8px 5px", fontSize: "0.8rem", color: "var(--text-secondary)", textAlign: "center" }}>{t("permissions_header", "ຈັດການສິດ / Permissions")}</th>
                          <th style={{ padding: "8px 5px", fontSize: "0.8rem", color: "var(--text-secondary)", textAlign: "center" }}>{t("delete_header", "ລຶບ / Del")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((usr) => (
                          <tr key={usr.id} style={{ borderBottom: "1px solid var(--border-color)", height: "55px" }}>
                            <td style={{ padding: "6px 5px" }}>
                              <select
                                className="form-control"
                                style={{ padding: "3px 6px", fontSize: "0.8rem", borderRadius: "4px" }}
                                value={usr.role}
                                onChange={(e) => handleRoleChange(usr.id, e.target.value)}
                              >
                                <option value="owner">Owner</option>
                                <option value="manager">Manager</option>
                                <option value="accounting">Accounting</option>
                                <option value="cashier">Cashier</option>
                                <option value="tour_operation">Dispatcher</option>
                              </select>
                            </td>
                            <td style={{ padding: "6px 5px" }}>
                              <input 
                                type="text" 
                                className="form-control" 
                                style={{ padding: "4px 8px", fontSize: "0.8rem", borderRadius: "4px" }}
                                value={usr.name}
                                onChange={(e) => handleUpdateUser(usr.id, "name", e.target.value)}
                                required
                              />
                            </td>
                            <td style={{ padding: "6px 5px" }}>
                              <input 
                                type="text" 
                                className="form-control" 
                                style={{ padding: "4px 8px", fontSize: "0.8rem", borderRadius: "4px" }}
                                value={usr.email}
                                onChange={(e) => handleUpdateUser(usr.id, "email", e.target.value)}
                                required
                              />
                            </td>
                            <td style={{ padding: "6px 5px" }}>
                              <input 
                                type="text" 
                                className="form-control" 
                                style={{ padding: "4px 8px", fontSize: "0.8rem", borderRadius: "4px", fontFamily: "monospace" }}
                                value={usr.password}
                                onChange={(e) => handleUpdateUser(usr.id, "password", e.target.value)}
                                required
                              />
                            </td>
                            <td style={{ padding: "6px 5px", textAlign: "center" }}>
                              <button
                                type="button"
                                className="btn"
                                style={{
                                  padding: "4px 8px",
                                  fontSize: "0.75rem",
                                  background: selectedUserId === usr.id ? "var(--primary)" : "var(--bg-secondary)",
                                  color: selectedUserId === usr.id ? "#ffffff" : "var(--text-primary)",
                                  border: "1px solid var(--border-color)",
                                  borderRadius: "6px"
                                }}
                                onClick={() => setSelectedUserId(selectedUserId === usr.id ? null : usr.id)}
                              >
                                <Shield size={12} style={{ marginRight: "2px", display: "inline" }} />
                                {selectedUserId === usr.id ? t("setting_permissions", "ກຳລັງຕັ້ງຄ່າ") : t("set_permissions", "ຕັ້ງຄ່າສິດ")}
                              </button>
                            </td>
                            <td style={{ padding: "6px 5px", textAlign: "center" }}>
                              <button
                                type="button"
                                className="btn btn-danger"
                                style={{ padding: "4px 6px", borderRadius: "4px" }}
                                onClick={() => handleDeleteUser(usr.id)}
                                disabled={usr.id === currentUser?.id}
                              >
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.25rem" }}>
                    <button type="submit" className="btn btn-primary" style={{ padding: "10px 20px" }}>
                      <Save size={16} /> {t("save_all_accounts", "ບັນທຶກຂໍ້ມູນບັນຊີທັງໝົດ / Save Accounts")}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Granular Permission Grid & Task Responsibilities Expander Section */}
            {selectedUserId && (() => {
              const selectedUser = users.find(u => u.id === selectedUserId);
              if (!selectedUser) return null;

              const modules = [
                { id: "dashboard", label: t("dashboard_label", "ໜ້າຫຼັກ / Dashboard") },
                { id: "checkin-tickets", label: t("ticket_sales_pos", "ຂາຍປີ້ ແລະ ອອກບິນ / Ticket Sales & POS") },
                { id: "accounting-payroll", label: t("accounting_expenses", "ບັນຊີ ແລະ ລາຍຈ່າຍ / Accounting & Expenses") },
                { id: "settings", label: t("settings", "ຕັ້ງຄ່າ / Settings") }
              ];
              const actions = [
                { key: "view", label: t("view_perm", "ເບິ່ງ (View)") },
                { key: "add", label: t("add_perm", "ເພີ່ມ (Add)") },
                { key: "edit", label: t("edit_perm", "ແກ້ໄຂ (Edit)") },
                { key: "approve", label: t("approve_perm", "ອະນຸມັດ (Approve)") },
                { key: "delete", label: t("delete_perm", "ລຶບ (Delete)") }
              ];
              const tasksList = [
                { key: "accounting", label: t("accounting_responsibility", "ງານບັນຊີ (Accounting)") },
                { key: "tickets", label: t("tickets_responsibility", "ງານຂາຍປີ້ (Ticket Sales)") },
                { key: "crew_dispatch", label: t("dispatch_responsibility", "ງານຈັດເຮືອ/ຈັດໄກ້ດ (Crew Dispatch)") }
              ];

              return (
                <div style={{ marginTop: "2rem", padding: "1.5rem", background: "rgba(16, 185, 129, 0.02)", border: "1px solid var(--border-color)", borderRadius: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>
                    <h3 style={{ fontSize: "1.1rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Shield size={18} color="var(--primary)" />
                      {t("set_perm_for_staff", "ຕັ້ງຄ່າສິດ ແລະ ໜ້າທີ່ສຳລັບພະນັກງານ:")} <span style={{ color: "var(--primary)", fontWeight: "bold" }}>{selectedUser.name}</span> ({t("role_header", "ບົດບາດ")}: {selectedUser.role})
                    </h3>
                    <button 
                      type="button" 
                      className="btn" 
                      style={{ background: "var(--border-color)", color: "var(--text-primary)", padding: "4px 10px", fontSize: "0.8rem" }}
                      onClick={() => setSelectedUserId(null)}
                    >
                      {t("close_config", "ປິດສ່ວນນີ້ / Close Config")}
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem" }}>
                    {/* Permission Grid Matrix */}
                    <div>
                      <h4 style={{ fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: "1rem", fontWeight: "700" }}>
                        {t("permissions_matrix", "ສິດການເຂົ້າໃຊ້ງານແຕ່ລະເມນູ / Permissions Matrix")}
                      </h4>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                        <thead>
                          <tr style={{ borderBottom: "2px solid var(--border-color)", textAlign: "left" }}>
                            <th style={{ padding: "8px", color: "var(--text-secondary)" }}>{t("module_menu", "ເມນູລະບົບ / Module")}</th>
                            {actions.map(act => (
                              <th key={act.key} style={{ padding: "8px", textAlign: "center", color: "var(--text-secondary)" }}>{act.label}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {modules.map(mod => {
                            const modPermissions = selectedUser.permissions?.[mod.id] || { view: false, add: false, edit: false, approve: false, delete: false };
                            return (
                              <tr key={mod.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                                <td style={{ padding: "10px 8px", fontWeight: "600", color: "var(--text-primary)" }}>{mod.label}</td>
                                {actions.map(act => (
                                  <td key={act.key} style={{ padding: "10px 8px", textAlign: "center" }}>
                                    <input 
                                      type="checkbox"
                                      checked={!!modPermissions[act.key]}
                                      onChange={() => handleTogglePermission(selectedUser.id, mod.id, act.key)}
                                      style={{ width: "16px", height: "16px", cursor: "pointer" }}
                                    />
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Task Responsibilities Checkboxes */}
                    <div style={{ borderLeft: "1px solid var(--border-color)", paddingLeft: "1.5rem" }}>
                      <h4 style={{ fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: "1rem", fontWeight: "700" }}>
                        {t("responsibilities_title", "ໜ້າທີ່ຄວາມຮັບຜິດຊອບ / Responsibilities")}
                      </h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "1rem" }}>
                        {tasksList.map(task => {
                          const isAssigned = !!selectedUser.responsibilities?.[task.key];
                          return (
                            <label 
                              key={task.key}
                              style={{ 
                                display: "flex", 
                                alignItems: "center", 
                                gap: "10px", 
                                padding: "10px", 
                                background: isAssigned ? "rgba(16, 185, 129, 0.05)" : "var(--bg-secondary)", 
                                border: "1px solid", 
                                borderColor: isAssigned ? "var(--primary)" : "var(--border-color)", 
                                borderRadius: "8px", 
                                cursor: "pointer", 
                                fontSize: "0.85rem",
                                color: "var(--text-primary)",
                                fontWeight: isAssigned ? "600" : "normal"
                              }}
                            >
                              <input 
                                type="checkbox"
                                checked={isAssigned}
                                onChange={() => handleToggleResponsibility(selectedUser.id, task.key)}
                                style={{ width: "16px", height: "16px", cursor: "pointer" }}
                              />
                              {task.label}
                            </label>
                          );
                        })}
                      </div>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "1.25rem", lineHeight: "1.4" }}>
                        {t("responsibilities_desc", "ພະນັກງານທີ່ມີໜ້າທີ່ຮັບຜິດຊອບວຽກໃດ ຈະປາກົດຊື່ເທິງແຖບຜູ້ຮັບຜິດຊອບໃນໜ້ານັ້ນໆຂອງລະບົບ")}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: "1.5rem", borderTop: "1px solid var(--border-color)", paddingTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginRight: "1rem", alignSelf: "center" }}>
                      * {t("save_accounts_warning", "ຕ້ອງກົດປຸ່ມ 'ບັນທຶກຂໍ້ມູນບັນຊີທັງໝົດ' ດ້ານເທິງເພື່ອບັນທຶກສິດລົງຖານຂໍ້ມູນ")}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* ຈັດການກິດຈະກຳ ແລະ ລາຄາ / Manage Activities & Pricing */}
      <div className="card" style={{ marginTop: "2rem", padding: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "1.5rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>
          <Settings size={20} color="var(--primary)" />
          {t("manage_activities_title", "ຈັດການກິດຈະກຳ ແລະ ລາຄາ / Manage Activities & Pricing")}
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "2rem" }}>
          {/* Form to Add / Edit */}
          <div>
            <h3 style={{ fontSize: "1rem", color: "var(--text-primary)", marginBottom: "1rem" }}>
              {editingServiceId ? t("edit_activity_title", "ແກ້ໄຂກິດຈະກຳ / Edit Activity") : t("add_activity_title", "ເພີ່ມກິດຈະກຳໃໝ່ / Add New Activity")}
            </h3>
            <form onSubmit={handleSaveService} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="form-group">
                <label style={{ fontSize: "0.85rem", fontWeight: "700" }}>{t("activity_name_label", "ຊື່ກິດຈະກຳ / Activity Name")}</label>
                <input 
                  type="text"
                  className="form-control"
                  placeholder={t("activity_placeholder", "Boat Ride 30 Mins")}
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: "0.85rem", fontWeight: "700" }}>{t("activity_currency_label", "ສະກຸນເງິນຫຼັກ / Currency")}</label>
                <select 
                  className="form-control"
                  value={newCurrency}
                  onChange={(e) => setNewCurrency(e.target.value)}
                  style={{ width: "100%" }}
                >
                  <option value="LAK">LAK ({t("currency_lak", "ກີບ")})</option>
                  <option value="THB">THB ({t("currency_thb", "ບາດ")})</option>
                </select>
              </div>

              {/* Tier 1 Pricing */}
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "10px", borderTop: "1px solid var(--border-color)", paddingTop: "10px" }}>
                <div className="form-group">
                  <label style={{ fontSize: "0.75rem", fontWeight: "700" }}>{t("tier1_price_label", "ລາຄາ 1 ຄົນ / Tier 1 Price")}</label>
                  <input 
                    type="number"
                    className="form-control"
                    value={newTier1}
                    onChange={(e) => setNewTier1(e.target.value)}
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: "0.75rem", fontWeight: "700" }}>{t("calc_format_label", "ຮູບແບບ / Calculation")}</label>
                  <select
                    className="form-control"
                    value={newTier1Type}
                    onChange={(e) => setNewTier1Type(e.target.value)}
                  >
                    <option value="pax">{t("per_pax", "ຕໍ່ຄົນ / Per Pax")}</option>
                    <option value="flat">{t("flat_rate", "ເໝົາລຳ / Flat Rate")}</option>
                  </select>
                </div>
              </div>

              {/* Tier 2 Pricing */}
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "10px" }}>
                <div className="form-group">
                  <label style={{ fontSize: "0.75rem", fontWeight: "700" }}>{t("tier2_price_label", "ລາຄາ 2 ຄົນ / Tier 2 Price")}</label>
                  <input 
                    type="number"
                    className="form-control"
                    value={newTier2}
                    onChange={(e) => setNewTier2(e.target.value)}
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: "0.75rem", fontWeight: "700" }}>{t("calc_format_label", "ຮູບແບບ / Calculation")}</label>
                  <select
                    className="form-control"
                    value={newTier2Type}
                    onChange={(e) => setNewTier2Type(e.target.value)}
                  >
                    <option value="pax">{t("per_pax", "ຕໍ່ຄົນ / Per Pax")}</option>
                    <option value="flat">{t("flat_rate", "ເໝົາລຳ / Flat Rate")}</option>
                  </select>
                </div>
              </div>

              {/* Tier 3 Pricing */}
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "10px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>
                <div className="form-group">
                  <label style={{ fontSize: "0.75rem", fontWeight: "700" }}>{t("tier3_price_label", "ລາຄາ 3+ ຄົນ / Tier 3 Price")}</label>
                  <input 
                    type="number"
                    className="form-control"
                    value={newTier3}
                    onChange={(e) => setNewTier3(e.target.value)}
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: "0.75rem", fontWeight: "700" }}>{t("calc_format_label", "ຮູບແບບ / Calculation")}</label>
                  <select
                    className="form-control"
                    value={newTier3Type}
                    onChange={(e) => setNewTier3Type(e.target.value)}
                  >
                    <option value="pax">{t("per_pax", "ຕໍ່ຄົນ / Per Pax")}</option>
                    <option value="flat">{t("flat_rate", "ເໝົາລຳ / Flat Rate")}</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: "10px" }}>
                  {editingServiceId ? t("update_activity", "ບັນທຶກການແກ້ໄຂ / Update Activity") : t("add_activity", "ເພີ່ມກິດຈະກຳ / Add Activity")}
                </button>
                {editingServiceId && (
                  <button 
                    type="button" 
                    className="btn" 
                    style={{ background: "#64748b", color: "#ffffff", padding: "10px 15px" }}
                    onClick={() => {
                      setEditingServiceId(null);
                      setNewServiceName("");
                      setNewCurrency("LAK");
                      setNewTier1(0);
                      setNewTier1Type("pax");
                      setNewTier2(0);
                      setNewTier2Type("pax");
                      setNewTier3(0);
                      setNewTier3Type("pax");
                    }}
                  >
                    {t("cancel_btn", "ຍົກເລີກ / Cancel")}
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Activities List Table */}
          <div>
            <h3 style={{ fontSize: "1rem", color: "var(--text-primary)", marginBottom: "1rem" }}>
              {t("services_list_title", "ລາຍການກິດຈະກຳທັງໝົດ / Active Services List")}
            </h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border-color)", textAlign: "left" }}>
                    <th style={{ padding: "8px" }}>{t("service_id", "ລະຫັດ / ID")}</th>
                    <th style={{ padding: "8px" }}>{t("activity_name", "ກິດຈະກຳ / Name")}</th>
                    <th style={{ padding: "8px", textAlign: "right" }}>{t("tier1", "1 ຄົນ (Tier 1)")}</th>
                    <th style={{ padding: "8px", textAlign: "right" }}>{t("tier2", "2 ຄົນ (Tier 2)")}</th>
                    <th style={{ padding: "8px", textAlign: "right" }}>{t("tier3", "3+ ຄົນ (Tier 3)")}</th>
                    <th style={{ padding: "8px", textAlign: "center" }}>{t("status", "ສະຖານະ / Status")}</th>
                    <th style={{ padding: "8px", textAlign: "center" }}>{t("action", "ຈັດການ / Action")}</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((srv) => {
                    const formatServiceRate = (price, type, currency) => {
                      const formattedPrice = currency === "THB" ? `${price.toLocaleString()} THB` : formatLAK(price);
                      const typeText = type === "flat" ? t("flat_rate", "ເໝົາລຳ") : t("per_pax", "ຕໍ່ຄົນ");
                      return `${formattedPrice} (${typeText})`;
                    };

                    return (
                      <tr key={srv.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <td style={{ padding: "8px", fontWeight: "bold" }}>{srv.id}</td>
                        <td style={{ padding: "8px" }}>{srv.name}</td>
                        <td style={{ padding: "8px", textAlign: "right" }}>{formatServiceRate(srv.priceTier1 || srv.price || 0, srv.priceTier1Type || "pax", srv.currency || "LAK")}</td>
                        <td style={{ padding: "8px", textAlign: "right" }}>{formatServiceRate(srv.priceTier2 || srv.price || 0, srv.priceTier2Type || "pax", srv.currency || "LAK")}</td>
                        <td style={{ padding: "8px", textAlign: "right" }}>{formatServiceRate(srv.priceTier3 || srv.price || 0, srv.priceTier3Type || "pax", srv.currency || "LAK")}</td>
                        <td style={{ padding: "8px", textAlign: "center" }}>
                          <button
                            type="button"
                            onClick={() => handleToggleServiceStatus(srv.id)}
                            style={{
                              padding: "2px 8px",
                              borderRadius: "12px",
                              border: "none",
                              background: srv.status === "active" ? "#d1fae5" : "#fee2e2",
                              color: srv.status === "active" ? "#065f46" : "#991b1b",
                              fontSize: "0.75rem",
                              fontWeight: "bold",
                              cursor: "pointer"
                            }}
                          >
                            {srv.status === "active" ? t("active", "ເປີດໃຊ້ງານ") : t("inactive", "ປິດໃຊ້ງານ")}
                          </button>
                        </td>
                        <td style={{ padding: "8px", textAlign: "center" }}>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ padding: "2px 6px", fontSize: "0.75rem" }}
                              onClick={() => handleEditClick(srv)}
                            >
                              {t("edit_label", "ແກ້ໄຂ")}
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger"
                              style={{ padding: "2px 6px", fontSize: "0.75rem" }}
                              onClick={() => handleDeleteService(srv.id)}
                            >
                              {t("delete_label", "ລຶບ")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
