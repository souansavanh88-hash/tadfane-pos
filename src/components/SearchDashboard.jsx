// SearchDashboard.jsx - Global Search Panel
import React, { useState, useEffect } from "react";
import { getDb } from "../db/mockDb";
import { formatLAK, getStatusLabel } from "../utils/helpers";
import { useLanguage } from "../utils/LanguageContext";
import { Search, User, FileText, Ship, Printer, Phone, Compass } from "lucide-react";

export default function SearchDashboard({ onSelectTrip, onSelectCustomer }) {
  const { lang, t } = useLanguage();
  const [db, setDb] = useState(getDb());
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState({
    customers: [],
    trips: [],
    bookings: []
  });
  const [selectedItem, setSelectedItem] = useState(null); // item details modal helper

  useEffect(() => {
    setDb(getDb());
  }, []);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (!query.trim()) {
      setResults({ customers: [], trips: [], bookings: [] });
      return;
    }

    const q = query.toLowerCase();

    // 1. Search Customers
    const filteredCustomers = db.customers.filter(c => 
      c.name.toLowerCase().includes(q) ||
      c.passport.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.hotel && c.hotel.toLowerCase().includes(q))
    );

    // 2. Search Trips / Receipts
    const filteredTrips = db.trips.filter(t => {
      const billId = t.id.replace("TRIP", "BILL").toLowerCase();
      const tripId = t.id.toLowerCase();
      const boat = db.boats.find(b => b.id === t.boatId);
      const boatName = boat ? boat.name.toLowerCase() : "";

      return billId.includes(q) || tripId.includes(q) || boatName.includes(q);
    });

    // 3. Search bookings
    const filteredBookings = db.bookings.filter(b => 
      b.id.toLowerCase().includes(q) ||
      (b.partnerName && b.partnerName.toLowerCase().includes(q))
    );

    setResults({
      customers: filteredCustomers,
      trips: filteredTrips,
      bookings: filteredBookings
    });
  };

  const showDetail = (type, item) => {
    setSelectedItem({ type, data: item });
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>{t("global_search_title", "ຄົ້ນຫາຂໍ້ມູນທັງໝົດ / Global Search")}</h1>
          <p>ຄົ້ນຫາລູກຄ້າ, ເລກໃບບິນ, ເລກທີພາສປອດ, ເບີໂທລະສັບ ຫຼື ສະແກນ QR ບຸກກິ້ງ</p>
        </div>
      </div>

      {/* Main Search Input */}
      <div className="card" style={{ marginBottom: "2rem" }}>
        <div className="search-container">
          <Search size={20} className="search-icon-pos" />
          <input 
            type="text" 
            className="search-input" 
            placeholder={t("search_placeholder", "ຄົ້ນຫາ: ຊື່ລູກຄ້າ, ເລກພາສປອດ, ເບີໂທ, ເລກບິນ... / Search customer, bill, passport...")}
            value={searchQuery}
            onChange={handleSearch}
            autoFocus
          />
        </div>
      </div>

      {/* Grid of Results */}
      {searchQuery.trim() ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
          
          {/* Left panel: Result listing */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            {/* Customers list */}
            <div className="card">
              <h3 style={{ fontSize: "1.1rem", marginBottom: "0.75rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "5px" }}>
                <User size={18} color="var(--primary)" />
                {t("customer_results", "ຜົນການຄົ້ນຫາລູກຄ້າ")} ({results.customers.length})
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {results.customers.length === 0 ? (
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{t("no_customer_found", "ບໍ່ພົບຂໍ້ມູນລູກຄ້າ / No customers found")}</span>
                ) : (
                  results.customers.map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => showDetail("customer", c)}
                      style={{ padding: "0.75rem", background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "8px", cursor: "pointer" }}
                    >
                      <div style={{ fontWeight: "600", color: "var(--text-primary)" }}>{c.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        Passport: {c.passport} | {t("phone_label", "ເບີໂທ / Phone")}: {c.phone}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Trips / Receipts list */}
            <div className="card">
              <h3 style={{ fontSize: "1.1rem", marginBottom: "0.75rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "5px" }}>
                <Ship size={18} color="var(--primary)" />
                {t("trip_results", "ທ່ຽວເຮືອ & ໃບບິນ")} ({results.trips.length})
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {results.trips.length === 0 ? (
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{t("no_trips_found", "ບໍ່ພົບຂໍ້ມູນທ່ຽວເຮືອ/ໃບບິນ / No trips or bills found")}</span>
                ) : (
                  results.trips.map(t => {
                    const boat = db.boats.find(b => b.id === t.boatId);
                    return (
                      <div 
                        key={t.id} 
                        onClick={() => showDetail("trip", t)}
                        style={{ padding: "0.75rem", background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "8px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                      >
                        <div>
                          <div style={{ fontWeight: "600", color: "var(--text-primary)" }}>
                            {boat ? boat.name : `Boat ${t.boatId}`} - {t.customerIds.length} Pax
                          </div>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                            ID: {t.id} | Bill: {t.id.replace("TRIP", "BILL")}
                          </span>
                        </div>
                        <span className="badge badge-success">{getStatusLabel(t.status, t)}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* Right panel: Detail Showcase */}
          <div>
            {selectedItem ? (
              <div className="card" style={{ border: "1px solid var(--primary)" }}>
                {selectedItem.type === "customer" && (
                  <div>
                    <h3 style={{ fontSize: "1.2rem", color: "var(--text-primary)", marginBottom: "1rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
                      {t("passenger_details", "ລາຍລະອຽດຜູ້ໂດຍສານ / Passenger Details")}
                    </h3>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      <div><strong>{t("name_label", "ຊື່ / Name")}:</strong> <span style={{ color: "var(--text-primary)", fontSize: "1rem", fontWeight: "bold" }}>{selectedItem.data.name}</span></div>
                      <div><strong>Passport:</strong> {selectedItem.data.passport}</div>
                      <div><strong>{t("phone_label", "ເບີໂທລະສັບ / Phone")}:</strong> {selectedItem.data.phone}</div>
                      <div><strong>{t("hotel_label", "ໂຮງແຮມ / Hotel")}:</strong> {selectedItem.data.hotel || "-"}</div>
                      <div><strong>{t("emergency_contact", "ຕິດຕໍ່ສຸກເສີນ / Emergency")}:</strong> {selectedItem.data.emergencyName} ({selectedItem.data.emergencyPhone || "-"})</div>
                      <div>
                        <strong>{t("boat_status", "ສະຖານະເຮືອ / Boat Status")}:</strong> 
                        <span className={`badge ${selectedItem.data.status === "completed" ? "badge-success" : "badge-warning"}`} style={{ marginLeft: "5px" }}>
                          {getStatusLabel(selectedItem.data.status, t)}
                        </span>
                      </div>

                      {/* Photo Capture Preview */}
                      {selectedItem.data.passportPhoto && (
                        <div style={{ marginTop: "1rem" }}>
                          <div><strong>{t("passport_ocr_photo", "ພາບຖ່າຍພາສປອດ / Passport Photo")}:</strong></div>
                          <img src={selectedItem.data.passportPhoto} alt="Passport Scan" style={{ width: "100%", borderRadius: "8px", border: "1px solid var(--border-color)", marginTop: "5px" }} />
                        </div>
                      )}

                      {/* Signature Capture Preview */}
                      {selectedItem.data.signature && (
                        <div style={{ marginTop: "1rem" }}>
                          <div><strong>{t("waiver_signature", "ລາຍເຊັນຮັບປະກັນ / Waiver Signature")}:</strong></div>
                          <div style={{ background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "5px", display: "inline-block", marginTop: "5px" }}>
                            <img src={selectedItem.data.signature} alt="Waiver Signature" style={{ height: "60px", maxWidth: "200px" }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedItem.type === "trip" && (
                  <div>
                    <h3 style={{ fontSize: "1.2rem", color: "var(--text-primary)", marginBottom: "1rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>{t("trip_details", "ລາຍລະອຽດທ່ຽວເຮືອ / Trip Details")}</span>
                      <span style={{ fontSize: "0.85rem", color: "var(--primary)" }}>{selectedItem.data.id}</span>
                    </h3>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      <div><strong>{t("date_label", "ວັນທີເດີນທາງ / Date")}:</strong> {selectedItem.data.date} <strong>{t("time_label", "ເວລາ / Time")}:</strong> {selectedItem.data.time}</div>
                      <div>
                        <strong>{t("boat_label", "ເຮືອ / Boat")}:</strong> {db.boats.find(b => b.id === selectedItem.data.boatId)?.name}
                      </div>
                      <div>
                        <strong>{t("guides_label", "ໄກດ໌ / Guides")}:</strong> {selectedItem.data.guideIds.map(gid => db.employees.find(e => e.id === gid)?.name).join(", ")}
                      </div>
                      <div>
                        <strong>{t("driver", "ຄົນຂັບ / Driver")}:</strong> {selectedItem.data.driverIds && selectedItem.data.driverIds.length > 0 ? selectedItem.data.driverIds.map(did => db.employees.find(e => e.id === did)?.name).join(", ") : "-"}
                      </div>
                      <div>
                        <strong>{t("all_passengers", "ຜູ້ໂດຍສານທັງໝົດ")} ({selectedItem.data.customerIds.length} {t("pax_unit", "ຄົນ")}):</strong>
                        <ul style={{ paddingLeft: "1.25rem", marginTop: "5px" }}>
                          {selectedItem.data.customerIds.map(cid => (
                            <li key={cid}>{db.customers.find(c => c.id === cid)?.name}</li>
                          ))}
                        </ul>
                      </div>

                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.5rem", borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                        <button 
                          className="btn btn-primary"
                          style={{ flex: 1, padding: "8px", fontSize: "0.8rem" }}
                          onClick={() => onSelectTrip(selectedItem.data.id)}
                        >
                          <Printer size={14} /> {t("print_bill_manifest", "ພິມໃບບິນ & ໃບລາຍຊື່ / Print Bill & Manifest")}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="card" style={{ height: "100%", borderStyle: "dashed", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                <Compass size={48} style={{ opacity: 0.2, marginBottom: "0.5rem" }} />
                {t("select_search_item_preview", "ກະລຸນາເລືອກລາຍການດ້ານຊ້າຍເພື່ອເບິ່ງລາຍລະອຽດ / Select a search result to view details")} <br />
                
              </div>
            )}
          </div>

        </div>
      ) : (
        <div className="card" style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>
          <Search size={48} style={{ opacity: 0.2, marginBottom: "0.5rem" }} />
          {t("start_typing_search", "ເລີ່ມພິມເພື່ອຄົ້ນຫາຂໍ້ມູນລູກຄ້າ, ທ່ຽວເຮືອ, ໃບບິນ... / Start typing to search...")} <br />
          
        </div>
      )}
    </div>
  );
}
