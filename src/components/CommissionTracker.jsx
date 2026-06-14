// CommissionTracker.jsx - Commission Calculator and Partner ledger
import React, { useState, useEffect } from "react";
import { getDb, saveDb } from "../db/mockDb";
import { formatLAK } from "../utils/helpers";
import { useLanguage } from "../utils/LanguageContext";
import { Coins, Plus, Trash2, Edit2, X, Calendar } from "lucide-react";

export default function CommissionTracker() {
  const { lang, t } = useLanguage();
  const [db, setDb] = useState(getDb());
  
  // Find trip details for a specific customer
  const getCustomerTripDetails = (customerId) => {
    const trip = db.trips.find(t => t.customerIds && t.customerIds.includes(customerId));
    if (!trip) {
      return { boatName: "N/A", captainNames: "N/A", guideNames: "N/A", driverNames: "N/A", date: "N/A" };
    }

    // Boat names
    const boatNames = [];
    const tripBoatIds = trip.boatIds || (trip.boatId ? [trip.boatId] : []);
    tripBoatIds.forEach(bid => {
      const b = db.boats.find(boat => boat.id === bid);
      if (b) boatNames.push(b.name);
    });

    // Captain names
    const captainNames = [];
    const tripCaptainIds = trip.captainIds || (trip.captainId ? [trip.captainId] : []);
    tripCaptainIds.forEach(cid => {
      const e = db.employees.find(emp => emp.id === cid);
      if (e) captainNames.push(e.name.split(" (")[0]);
    });

    // Guide names
    const guideNames = [];
    if (trip.guideIds) {
      trip.guideIds.forEach(gid => {
        const e = db.employees.find(emp => emp.id === gid);
        if (e) guideNames.push(e.name.split(" (")[0]);
      });
    }

    // Driver names
    const driverNames = [];
    if (trip.driverIds) {
      trip.driverIds.forEach(did => {
        const e = db.employees.find(emp => emp.id === did);
        if (e) driverNames.push(e.name.split(" (")[0]);
      });
    }

    return {
      date: trip.date,
      boatName: boatNames.join(", ") || "N/A",
      captainNames: captainNames.join(", ") || "N/A",
      guideNames: guideNames.join(", ") || "N/A",
      driverNames: driverNames.join(", ") || "N/A"
    };
  };

  // Trigger partner statement print
  const triggerPrintCommission = () => {
    const originalClass = document.body.className;
    document.body.classList.add("print-commission-mode");
    setTimeout(() => {
      window.print();
      document.body.className = originalClass;
    }, 100);
  };

  const [partnerName, setPartnerName] = useState("");
  const [partnerType, setPartnerType] = useState("company"); // company, agent, guide
  const [commissionRate, setCommissionRate] = useState(40000); // default LAK
  const [contact, setContact] = useState("");
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  
  // Edit & Filter states
  const [editingPartnerId, setEditingPartnerId] = useState("");
  const [selectedMonthFilter, setSelectedMonthFilter] = useState("");

  useEffect(() => {
    const handleDbUpdate = () => {
      setDb(getDb());
    };
    window.addEventListener("db-update", handleDbUpdate);
    return () => window.removeEventListener("db-update", handleDbUpdate);
  }, []);

  const refreshState = () => {
    setDb(getDb());
  };

  const handleSavePartner = (e) => {
    e.preventDefault();
    if (!partnerName) return;

    const updatedDb = { ...db };

    if (editingPartnerId) {
      // Edit Mode
      updatedDb.partners = updatedDb.partners.map(p => 
        p.id === editingPartnerId 
          ? { 
              ...p, 
              name: partnerName, 
              type: partnerType, 
              commissionRate: parseInt(commissionRate), 
              contact 
            }
          : p
      );
      alert("ອັບເດດຂໍ້ມູນຄູ່ຄ້າສຳເລັດ! / Partner updated successfully!");
    } else {
      // Add Mode
      const maxIdNum = db.partners.reduce((max, p) => {
        const match = p.id.match(/PTN-(\d+)/);
        if (match) {
          const num = parseInt(match[1]);
          return num > max ? num : max;
        }
        return max;
      }, 0);
      const newId = `PTN-${String(maxIdNum + 1).padStart(3, "0")}`;

      const newPartner = {
        id: newId,
        name: partnerName,
        type: partnerType,
        commissionRate: parseInt(commissionRate),
        contact
      };
      updatedDb.partners.push(newPartner);
      alert("ເພີ່ມບໍລິສັດຄູ່ຄ້າສຳເລັດ! / Partner added successfully!");
    }

    saveDb(updatedDb);
    setPartnerName("");
    setContact("");
    setCommissionRate(40000);
    setEditingPartnerId("");
    refreshState();
  };

  const handleCancelEdit = () => {
    setPartnerName("");
    setContact("");
    setCommissionRate(40000);
    setEditingPartnerId("");
  };

  const handleDeletePartner = (id) => {
    if (window.confirm("ທ່ານຕ້ອງການລົບຄູ່ຄ້ານີ້ແທ້ບໍ? / Delete partner?")) {
      const updatedDb = { ...db };
      updatedDb.partners = updatedDb.partners.filter(p => p.id !== id);
      if (selectedPartnerId === id) {
        setSelectedPartnerId("");
        setSelectedMonthFilter("");
      }
      saveDb(updatedDb);
      refreshState();
    }
  };

  // Calculate overall stats for a partner
  const getPartnerStats = (partner) => {
    const customerList = db.customers.filter(c => c.partnerId === partner.id);
    const totalPax = customerList.length;
    const totalEarned = totalPax * partner.commissionRate;
    
    return {
      paxCount: totalPax,
      totalCommission: totalEarned,
      customers: customerList
    };
  };

  // Format month YYYY-MM into friendly Thai / English display
  const formatMonthKey = (monthKey) => {
    if (!monthKey) return "";
    const [year, month] = monthKey.split("-");
    const monthNames = {
      "01": "ມັງກອນ (Jan)",
      "02": "ກຸມພາ (Feb)",
      "03": "ມີນາ (Mar)",
      "04": "ເມສາ (Apr)",
      "05": "ພຶດສະພາ (May)",
      "06": "ມິຖຸນາ (Jun)",
      "07": "ກໍລະກົດ (Jul)",
      "08": "ສິງຫາ (Aug)",
      "09": "ກັນຍາ (Sep)",
      "10": "ຕຸລາ (Oct)",
      "11": "ພະຈິກ (Nov)",
      "12": "ທັນວາ (Dec)"
    };
    const yrThai = parseInt(year) + 543; // BE year
    return lang === "en" ? `${monthNames[month] || month} ${year}` : `${monthNames[month] || month} ${year} (ພ.ສ. ${yrThai})`;
  };

  // Group referrals by month
  const getPartnerMonthlyGroups = (partner) => {
    if (!partner) return {};
    const customers = db.customers.filter(c => c.partnerId === partner.id);
    const groups = {}; // "YYYY-MM" -> { paxCount: 0, commission: 0, customers: [] }

    customers.forEach(c => {
      const monthKey = c.checkInDate ? c.checkInDate.substring(0, 7) : new Date().toISOString().substring(0, 7);
      if (!groups[monthKey]) {
        groups[monthKey] = {
          paxCount: 0,
          commission: 0,
          customers: []
        };
      }
      groups[monthKey].paxCount += 1;
      groups[monthKey].commission += partner.commissionRate;
      groups[monthKey].customers.push(c);
    });

    return groups;
  };

  const activePartnerData = selectedPartnerId 
    ? db.partners.find(p => p.id === selectedPartnerId) 
    : null;

  const activeStats = activePartnerData ? getPartnerStats(activePartnerData) : null;
  const monthlyGroups = activePartnerData ? getPartnerMonthlyGroups(activePartnerData) : {};
  const monthKeys = Object.keys(monthlyGroups).sort().reverse(); // Show latest months first

  // Filtered referrals list for the selected partner
  const getFilteredReferrals = () => {
    if (!activeStats) return [];
    if (!selectedMonthFilter) return activeStats.customers;
    return activeStats.customers.filter(c => {
      const cMonth = c.checkInDate ? c.checkInDate.substring(0, 7) : "";
      return cMonth === selectedMonthFilter;
    });
  };

  const filteredReferrals = getFilteredReferrals();



  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Partner Commission (ລະບົບຄ່າຄອມມິດຊັນຄູ່ຄ້າ)</h1>
          <p>ຈັດການຂໍ້ມູນ ແລະ ກວດສອບລາຍງານຄ່າຄອມມິດຊັນຂອງ ບໍລິສັດທົວ, ເອເຈນ ແລະ ໄກ້ດນຳທ່ຽວ</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "2rem" }}>
        
        {/* Commission Summary Table */}
        <div className="card">
          <h2 style={{ fontSize: "1.25rem", marginBottom: "1.25rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Coins size={20} color="var(--primary)" />
            {t("commission_report", "ລາຍງານຄ່າຄອມມິດຊັນສະສົມ / Commission Report")}
          </h2>

          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>{t("partner_name_col", "ຊື່ຄູ່ຄ້າ / Partner")}</th>
                  <th>{t("type_col", "ປະເພດ / Type")}</th>
                  <th>{t("rate_col", "ອັດຕາຄ່າຫົວ / Rate")}</th>
                  <th>{t("pax_count_col", "ຜູ້ໂດຍສານສະສົມ / Passengers")}</th>
                  <th>{t("comm_due_col", "ຍອດເງິນຄອມ / Commission")}</th>
                  <th>{t("action_col", "ຈັດການ / Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {db.partners.map(partner => {
                  const stats = getPartnerStats(partner);
                  const typeLabel = 
                    partner.type === "company" ? t("type_company", "ບໍລິສັດທົວ") : 
                    partner.type === "agent" ? t("type_agent", "ເອເຈນ") : t("type_guide", "<b>ໄກ້ດແນະນຳ</b>");

                  return (
                    <tr 
                      key={partner.id}
                      style={{ cursor: "pointer", background: selectedPartnerId === partner.id ? "var(--primary-light)" : "transparent" }}
                      onClick={() => {
                        setSelectedPartnerId(partner.id);
                        setSelectedMonthFilter(""); // Reset month filter when changing partner
                      }}
                    >
                      <td style={{ fontWeight: "600", color: "var(--text-primary)" }}>{partner.name}</td>
                      <td>
                        <span className={`badge ${
                          partner.type === "company" ? "badge-success" : 
                          partner.type === "agent" ? "badge-warning" : "badge-danger"
                        }`}>
                          {typeLabel}
                        </span>
                      </td>
                      <td>{formatLAK(partner.commissionRate)}/pax</td>
                      <td>{stats.paxCount} {t("pax_unit", "ຄົນ (Pax)")}</td>
                      <td style={{ fontWeight: "bold", color: "var(--primary)" }}>{formatLAK(stats.totalCommission)}</td>
                      <td>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button 
                            className="btn btn-secondary"
                            style={{ padding: "4px 8px", fontSize: "0.75rem", background: "var(--bg-tertiary)" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPartnerId(partner.id);
                              setSelectedMonthFilter("");
                            }}
                          >
                            ລາຍລະອຽດ
                          </button>
                          <button 
                            className="btn btn-secondary"
                            style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingPartnerId(partner.id);
                              setPartnerName(partner.name);
                              setPartnerType(partner.type);
                              setCommissionRate(partner.commissionRate);
                              setContact(partner.contact || "");
                            }}
                          >
                            {t("edit_label", "ແກ້ໄຂ")}
                          </button>
                          <button 
                            className="btn btn-danger"
                            style={{ padding: "4px", borderRadius: "4px" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePartner(partner.id);
                            }}
                          >
                            <Trash2 size={14} />
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

        {/* Right Pane: Details or Create Partner Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Detail Panel for Selected Partner */}
          {activePartnerData && activeStats ? (
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem", marginBottom: "1rem" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: "bold", textTransform: "uppercase" }}>{t("partner_details", "ລາຍລະອຽດຄູ່ຄ້າ")}</span>
                  <h3 style={{ color: "var(--text-primary)", fontSize: "1.3rem", marginTop: "2px" }}>{activePartnerData.name}</h3>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <button className="btn btn-primary" style={{ padding: "4px 8px", fontSize: "0.75rem" }} onClick={() => triggerPrintCommission()}>
                    ພິມລາຍງານ (Print)
                  </button>
                  <button className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "0.75rem" }} onClick={() => { setSelectedPartnerId(""); setSelectedMonthFilter(""); }}>
                    ປິດໜ້ານີ້
                  </button>
                </div>
              </div>

              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", background: "var(--bg-tertiary)", padding: "10px", borderRadius: "8px" }}>
                <div><strong>{t("contact_label", "ຕິດຕໍ່")}:</strong> {activePartnerData.contact || "-"}</div>
                <div><strong>{t("rate_pax", "ເລດຄ່າຄອມ")}:</strong> {formatLAK(activePartnerData.commissionRate)}/pax</div>
                <div><strong>{t("total_referred", "ລວມຜູ້ແນະນຳທັງໝົດ")}:</strong> {activeStats.paxCount} {t("pax_unit", "ຄົນ")}</div>
                <div><strong>{t("total_commission", "ຍอดເງິນສະສົມທັງໝົດ")}:</strong> <span style={{ color: "var(--success)", fontWeight: "bold" }}>{formatLAK(activeStats.totalCommission)}</span></div>
              </div>

              {/* Monthly breakdown cards - Click to filter */}
              <h4 style={{ fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "6px" }}>
                <Calendar size={16} color="var(--primary)" />
                {t("monthly_summary", "ສະຫຼຸບຍອດລາຍເດືອນ / Monthly Summary")}
              </h4>
              
              {monthKeys.length === 0 ? (
                <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", border: "1px dashed var(--border-color)", borderRadius: "8px", marginBottom: "1.5rem" }}>
                  {t("no_monthly_history", "ຍັງບໍ່ມີປະຫວັດການສົ່ງຍອດລູກຄ້າລາຍເດືອນ.")}
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))", gap: "0.5rem", marginBottom: "1.5rem" }}>
                  {monthKeys.map(mKey => {
                    const g = monthlyGroups[mKey];
                    const isActive = selectedMonthFilter === mKey;
                    return (
                      <button
                        key={mKey}
                        type="button"
                        onClick={() => setSelectedMonthFilter(isActive ? "" : mKey)}
                        style={{
                          padding: "0.75rem 0.5rem",
                          borderRadius: "8px",
                          border: "1px solid",
                          borderColor: isActive ? "var(--primary)" : "var(--border-color)",
                          background: isActive ? "var(--primary-light)" : "var(--bg-secondary)",
                          color: isActive ? "var(--primary)" : "var(--text-primary)",
                          textAlign: "center",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        <div style={{ fontSize: "0.75rem", fontWeight: "600", marginBottom: "4px" }}>
                          {formatMonthKey(mKey)}
                        </div>
                        <div style={{ fontSize: "1.15rem", fontWeight: "800", color: isActive ? "var(--primary)" : "var(--text-primary)" }}>
                          {g.paxCount} ຄົນ
                        </div>
                        <div style={{ fontSize: "0.75rem", color: isActive ? "var(--primary)" : "var(--success)", fontWeight: "600", marginTop: "2px" }}>
                          {formatLAK(g.commission)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Referrals list header with filters indicator */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <h4 style={{ fontSize: "0.95rem", color: "var(--text-primary)", margin: 0 }}>
                  {selectedMonthFilter 
                    ? `${t("referrals_monthly_title", "ລາຍຊື່ແນະນຳປະຈຳເດືອນ")}: ${formatMonthKey(selectedMonthFilter)}`
                    : t("referrals_all_title", "ລາຍຊື່ລູກຄ້າແນະນຳທັງໝົດ (All Referrals)")
                  }
                </h4>
                {selectedMonthFilter && (
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: "2px 6px", fontSize: "0.7rem", color: "var(--danger)" }}
                    onClick={() => setSelectedMonthFilter("")}
                  >
                    {t("clear_filter", "ລ້າງການກັ່ນຕອງ / Clear Filter")}
                  </button>
                )}
              </div>

              <div style={{ overflowX: "auto", border: "1px solid var(--border-color)", borderRadius: "8px", background: "var(--bg-primary)", maxHeight: "250px" }}>
                <table style={{ margin: 0, fontSize: "0.85rem" }}>
                  <thead>
                    <tr>
                      <th>ວັນທີ (Date)</th>
                      <th>ລູກຄ້າ (Pax Name)</th>
                      <th>ເຮືອ (Boat)</th>
                      <th>ກັປຕັນ (Captain)</th>
                      <th>ໄກ້ດ (Guide)</th>
                      <th>ຄົນຂັບ (Driver)</th>
                      <th style={{ textAlign: "right" }}>ຄ່າຄອມ (Earn)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReferrals.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                          ບໍ່ມີລາຍຊື່ລູກຄ້າ / No referrals found
                        </td>
                      </tr>
                    ) : (
                      filteredReferrals.map((c) => {
                        const tripInfo = getCustomerTripDetails(c.id);
                        return (
                          <tr key={c.id}>
                            <td>{c.checkInDate || tripInfo.date}</td>
                            <td>
                              <div style={{ fontWeight: "600" }}>{c.name}</div>
                              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{c.passport}</span>
                            </td>
                            <td>{tripInfo.boatName}</td>
                            <td>{tripInfo.captainNames}</td>
                            <td>{tripInfo.guideNames}</td>
                            <td>{tripInfo.driverNames}</td>
                            <td style={{ textAlign: "right", fontWeight: "bold", color: "var(--success)" }}>
                              {formatLAK(activePartnerData.commissionRate)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {/* Add / Edit Partner Form */}
          <div className="card" style={{ borderColor: editingPartnerId ? "var(--primary)" : "" }}>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "1.25rem", color: "var(--text-primary)" }}>
              {editingPartnerId ? t("edit_partner", "ແກ້ໄຂຂໍ້ມູນຄູ່ຄ້າ / Edit Partner") : t("add_partner", "ເພີ່ມບໍລິສັດຄູ່ຄ້າ / Add New Partner")}
            </h2>
            <form onSubmit={handleSavePartner}>
              <div className="form-group">
                <label>{t("partner_name_field", "ຊື່ອີເຈນ / ບໍລິສັດທົວ (Partner Name) *")}</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  placeholder={t("partner_name_placeholder", "ຕົວຢ່າງ: ບໍລິສັດ ຕາດຟານ ດີດຄັຟເວີຣี ຈຳກັດ")}
                  required 
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t("partner_type_field", "ປະເພດ (Type)")}</label>
                  <select 
                    className="form-control"
                    value={partnerType}
                    onChange={(e) => setPartnerType(e.target.value)}
                  >
                    <option value="company">{t("type_company", "ບໍລິສັດທົວ")} (Tour Company)</option>
                    <option value="agent">{t("type_agent", "ເອເຈນ")} (Agent)</option>
                    <option value="guide">{t("type_guide", "ໄກ້ດ")} (Guide)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>{t("commission_rate_field", "ຄ່າຄອມຕໍ່ຫົວ / Rate (LAK) *")}</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    min="0"
                    step="5000"
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{t("contact_info_field", "ເບີຕິດຕໍ່ / ລາຍລະອຽด (Contact Info)")}</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder={t("contact_info_placeholder", "ເບີໂທລະສັບ ຫຼື ອີເມວ")}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "1rem" }}>
                <button type="submit" className="btn btn-primary">
                  {editingPartnerId ? t("update_partner_btn", "ອັບເດດຄູ່ຄ້າ / Update") : t("add_partner_btn", "ເພີ່ມຄູ່ຄ້າ / Add Partner")}
                </button>
                {editingPartnerId && (
                  <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>
                    {t("cancel_partner_btn", "ຍົກເລີກ / Cancel")}
                  </button>
                )}
              </div>
            </form>
          </div>

        </div>
      </div>
      {/* --------------------- HIDDEN PRINTABLE PARTNER COMMISSION REPORT --------------------- */}
      <div className="printable-area">
        {activePartnerData && activeStats && (() => {
          const partner = activePartnerData;
          const commissionRate = partner.commissionRate;
          const totalEarned = filteredReferrals.length * commissionRate;
          
          return (
            <div className="commission-print">
              <div style={{ textAlign: "center", borderBottom: "2px solid #000", paddingBottom: "10px", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "16px", fontWeight: "bold", margin: 0 }}>ລາຍງານຄ່າຄອມມິດຊັນຄູ່ຄ້າ / PARTNER COMMISSION INVOICE</h2>
                <span style={{ fontSize: "11px" }}>TADFANE RAFTING / ຕາດຟານ ລ່ອງແກ່ງ - ACCOUNTING DEPARTMENT</span>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", marginBottom: "20px" }}>
                <tbody>
                  <tr>
                    <td style={{ border: "1px solid #000", padding: "6px", fontWeight: "bold", width: "25%", background: "#f8fafc" }}>ຊື່ຄູ່ຄ້າ / Partner Name:</td>
                    <td style={{ border: "1px solid #000", padding: "6px", width: "25%" }}>{partner.name}</td>
                    <td style={{ border: "1px solid #000", padding: "6px", fontWeight: "bold", width: "25%", background: "#f8fafc" }}>ປະເພດ / Partner Type:</td>
                    <td style={{ border: "1px solid #000", padding: "6px", width: "25%" }}>
                      {partner.type === "company" ? "ບໍລິສັດທົວ" : partner.type === "agent" ? "ເອເຈນ" : "ໄກ້ດແນະນຳ"}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #000", padding: "6px", fontWeight: "bold", background: "#f8fafc" }}>ຂໍ້ມູນຕິດຕໍ່ / Contact:</td>
                    <td style={{ border: "1px solid #000", padding: "6px" }}>{partner.contact || "-"}</td>
                    <td style={{ border: "1px solid #000", padding: "6px", fontWeight: "bold", background: "#f8fafc" }}>ອັດຕາຄ່າຄອມ / Rate:</td>
                    <td style={{ border: "1px solid #000", padding: "6px" }}>{formatLAK(commissionRate)} / ຄົນ</td>
                  </tr>
                </tbody>
              </table>

              <h3 style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}>
                {selectedMonthFilter 
                  ? `ລາຍລະອຽດແນະນຳລູກຄ້າ ປະຈຳເດືອນ: ${formatMonthKey(selectedMonthFilter)}`
                  : "ລາຍລະອຽດແນະນຳລູກຄ້າທັງໝົດ (All Referrals Detail)"
                }
              </h3>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px", marginBottom: "25px" }}>
                <thead>
                  <tr style={{ background: "#e2e8f0" }}>
                    <th style={{ border: "1px solid #000", padding: "6px", textAlign: "left" }}>ວັນທີ / Date</th>
                    <th style={{ border: "1px solid #000", padding: "6px", textAlign: "left" }}>ຊື່ລູກຄ້າ / Pax Name</th>
                    <th style={{ border: "1px solid #000", padding: "6px", textAlign: "left" }}>ເຮືອ / Boat</th>
                    <th style={{ border: "1px solid #000", padding: "6px", textAlign: "left" }}>ກັປຕັນ / Captain</th>
                    <th style={{ border: "1px solid #000", padding: "6px", textAlign: "left" }}>ໄກ້ດ / Guide</th>
                    <th style={{ border: "1px solid #000", padding: "6px", textAlign: "left" }}>ຄົນຂັບ / Driver</th>
                    <th style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>ຄ່າຄອມ / Comm</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReferrals.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>ບໍ່ມີລາຍຊື່ລູກຄ້າ / No customer records.</td>
                    </tr>
                  ) : (
                    filteredReferrals.map((c) => {
                      const tripInfo = getCustomerTripDetails(c.id);
                      return (
                        <tr key={c.id}>
                          <td style={{ border: "1px solid #000", padding: "6px" }}>{c.checkInDate || tripInfo.date}</td>
                          <td style={{ border: "1px solid #000", padding: "6px", fontWeight: "bold" }}>
                            {c.name} <span style={{ fontSize: "8px", fontWeight: "normal", color: "#666" }}>({c.passport})</span>
                          </td>
                          <td style={{ border: "1px solid #000", padding: "6px" }}>{tripInfo.boatName}</td>
                          <td style={{ border: "1px solid #000", padding: "6px" }}>{tripInfo.captainNames}</td>
                          <td style={{ border: "1px solid #000", padding: "6px" }}>{tripInfo.guideNames}</td>
                          <td style={{ border: "1px solid #000", padding: "6px" }}>{tripInfo.driverNames}</td>
                          <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right", fontWeight: "bold" }}>{formatLAK(commissionRate)}</td>
                        </tr>
                      );
                    })
                  )}
                  <tr style={{ background: "#e2e8f0", fontWeight: "bold" }}>
                    <td colSpan="6" style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>ຍອດລວມສຸດທິ ({filteredReferrals.length} ຄົນ) / Grand Total</td>
                    <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>{formatLAK(totalEarned)}</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ marginTop: "40px", display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                <div>
                  Prepared by: _______________________<br />
                  Accountant / ເຈົ້າໜ້າທີ່ບັນຊີ
                </div>
                <div style={{ textAlign: "right" }}>
                  Approved by: _______________________<br />
                  Partner Signature / ລາຍເຊັນຄູ່ຄ້າ
                </div>
              </div>
            </div>
          );
        })()}
      </div>
      {/* --------------------- HIDDEN PRINTABLE PARTNER COMMISSION STATEMENT --------------------- */}
      <div className="printable-area">
        {activePartnerData && activeStats && (
          <div className="commission-print">
            <div style={{ textAlign: "center", borderBottom: "2px solid #000", paddingBottom: "10px", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>ໃບສະຫຼຸບຄ່າຄອມມິດຊັນຄູ່ຄ້າ / PARTNER COMMISSION STATEMENT</h2>
              <span style={{ fontSize: "11px" }}>TADFANE RAFTING / ຕາດຟານ ລ່ອງແກ່ງ - ACCOUNTING DEPARTMENT</span>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", marginBottom: "20px" }}>
              <tbody>
                <tr>
                  <td style={{ border: "1px solid #000", padding: "6px", fontWeight: "bold", width: "25%", background: "#f8fafc" }}>ລະຫັດຄູ່ຄ້າ / Partner ID:</td>
                  <td style={{ border: "1px solid #000", padding: "6px", width: "25%" }}>{activePartnerData.id}</td>
                  <td style={{ border: "1px solid #000", padding: "6px", fontWeight: "bold", width: "25%", background: "#f8fafc" }}>ຊື່ຄູ່ຄ້າ / Partner Name:</td>
                  <td style={{ border: "1px solid #000", padding: "6px", width: "25%" }}>{activePartnerData.name}</td>
                </tr>
                <tr>
                  <td style={{ border: "1px solid #000", padding: "6px", fontWeight: "bold", background: "#f8fafc" }}>ປະເພດ / Partner Type:</td>
                  <td style={{ border: "1px solid #000", padding: "6px" }}>
                    {activePartnerData.type === "company" ? "ບໍລິສັດທົວ (Tour Company)" : 
                     activePartnerData.type === "agent" ? "ເອເຈນ (Agent)" : "ໄກ້ດ (Guide Referral)"}
                  </td>
                  <td style={{ border: "1px solid #000", padding: "6px", fontWeight: "bold", background: "#f8fafc" }}>ລາຍລະອຽດຕິດຕໍ່ / Contact:</td>
                  <td style={{ border: "1px solid #000", padding: "6px" }}>{activePartnerData.contact || "-"}</td>
                </tr>
                <tr>
                  <td style={{ border: "1px solid #000", padding: "6px", fontWeight: "bold", background: "#f8fafc" }}>ອັດຕາຄ່າຄອມ / Rate:</td>
                  <td style={{ border: "1px solid #000", padding: "6px" }}>{formatLAK(activePartnerData.commissionRate)} / ຄົນ (Pax)</td>
                  <td style={{ border: "1px solid #000", padding: "6px", fontWeight: "bold", background: "#f8fafc" }}>ໄລຍະເວລາກັ່ນຕອງ / Period:</td>
                  <td style={{ border: "1px solid #000", padding: "6px" }}>{selectedMonthFilter ? formatMonthKey(selectedMonthFilter) : "ທັງໝົດ (All History)"}</td>
                </tr>
              </tbody>
            </table>

            <h3 style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}>ລາຍຊື່ລູກຄ້າແນະນຳຢ່າງລະອຽດ / Itemized Referral Logs</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px", marginBottom: "30px" }}>
              <thead>
                <tr style={{ background: "#e2e8f0" }}>
                  <th style={{ border: "1px solid #000", padding: "6px", textAlign: "left" }}>ວັນທີ / Date</th>
                  <th style={{ border: "1px solid #000", padding: "6px", textAlign: "left" }}>ຊື່ລູກຄ້າ / Customer Name</th>
                  <th style={{ border: "1px solid #000", padding: "6px", textAlign: "left" }}>ເຮືອ / Boat</th>
                  <th style={{ border: "1px solid #000", padding: "6px", textAlign: "left" }}>ກັປຕັນ / Captain</th>
                  <th style={{ border: "1px solid #000", padding: "6px", textAlign: "left" }}>ໄກ້ດ / Guide</th>
                  <th style={{ border: "1px solid #000", padding: "6px", textAlign: "left" }}>ຄົນຂັບລົດ / Driver</th>
                  <th style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>ສະຖານະ / Status</th>
                  <th style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>ຄ່າຄອມ / Commission</th>
                </tr>
              </thead>
              <tbody>
                {filteredReferrals.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>ບໍ່ມີຂໍ້ມູນລູກຄ້າແນະນຳ / No referred customers.</td>
                  </tr>
                ) : (
                  filteredReferrals.map((c) => {
                    const tripInfo = getCustomerTripDetails(c.id);
                    return (
                      <tr key={c.id}>
                        <td style={{ border: "1px solid #000", padding: "6px" }}>{c.checkInDate}</td>
                        <td style={{ border: "1px solid #000", padding: "6px", fontWeight: "bold" }}>{c.name}</td>
                        <td style={{ border: "1px solid #000", padding: "6px" }}>{tripInfo.boatName}</td>
                        <td style={{ border: "1px solid #000", padding: "6px" }}>{tripInfo.captainNames}</td>
                        <td style={{ border: "1px solid #000", padding: "6px" }}>{tripInfo.guideNames}</td>
                        <td style={{ border: "1px solid #000", padding: "6px" }}>{tripInfo.driverNames}</td>
                        <td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>{c.status === "completed" ? "Completed" : "Pending"}</td>
                        <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right", fontWeight: "bold" }}>{formatLAK(activePartnerData.commissionRate)}</td>
                      </tr>
                    );
                  })
                )}
                <tr style={{ background: "#e2e8f0", fontWeight: "bold" }}>
                  <td colSpan="7" style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>ຍອດລວມຄ່າຄອມມິດຊັນທັງໝົດ / Total Commission Due</td>
                  <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>
                    {formatLAK(filteredReferrals.length * activePartnerData.commissionRate)}
                  </td>
                </tr>
              </tbody>
            </table>

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
        )}
      </div>
    </div>
  );
}
