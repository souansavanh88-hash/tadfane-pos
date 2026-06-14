// mockDb.js - Client-Side Local Database with LocalStorage persistence

const SEED_DATA = {
  settings: {
    basePriceLAK: 250000, // 250,000 LAK per head
    rateTHB: 620,         // 1 THB = 620 LAK
    rateUSD: 21500,       // 1 USD = 21,500 LAK
    expenseApprovalLimit: 500000, // 500,000 LAK default limit for manager approval
    logo: "/tadfane_logo.jpg"
  },
  services: [
    { id: "SRV-001", name: "ລ່ອງເຮືອ / Adult Boat Ride", price: 250000, priceTier1: 250000, priceTier1Type: "pax", priceTier2: 230000, priceTier2Type: "pax", priceTier3: 200000, priceTier3Type: "pax", currency: "LAK", status: "active" },
    { id: "SRV-002", name: "ປີ້ເດັກນ້ອຍ / Child Ticket", price: 120000, priceTier1: 120000, priceTier1Type: "pax", priceTier2: 120000, priceTier2Type: "pax", priceTier3: 120000, priceTier3Type: "pax", currency: "LAK", status: "active" },
    { id: "SRV-003", name: "ບໍລິການເສີມ / Extra Service", price: 50000, priceTier1: 50000, priceTier1Type: "pax", priceTier2: 50000, priceTier2Type: "pax", priceTier3: 50000, priceTier3Type: "pax", currency: "LAK", status: "active" },
    { id: "SRV-004", name: "🧗 Waterfall Rappelling (ໂຣຍຕົວນ້ຳຕົກ)", price: 1580, priceTier1: 1580, priceTier1Type: "pax", priceTier2: 1580, priceTier2Type: "pax", priceTier3: 1120, priceTier3Type: "pax", currency: "THB", status: "active" },
    { id: "SRV-005", name: "🚤 Adventure Boat (ລ່ອງເຮືອຜະຈົນໄພ)", price: 1900, priceTier1: 1900, priceTier1Type: "flat", priceTier2: 1900, priceTier2Type: "flat", priceTier3: 780, priceTier3Type: "pax", currency: "THB", status: "active" }
  ],
  boats: [
    { id: 1, name: "ເຮືອ 1 / Boat 1", capacity: 6, status: "available" },
    { id: 2, name: "ເຮືອ 2 / Boat 2", capacity: 6, status: "available" },
    { id: 3, name: "ເຮືອ 3 / Boat 3", capacity: 6, status: "available" },
    { id: 4, name: "ເຮືອ 4 / Boat 4", capacity: 6, status: "available" },
    { id: 5, name: "ເຮືອ 5 / Boat 5", capacity: 6, status: "available" },
    { id: 6, name: "ເຮືອ 6 / Boat 6", capacity: 6, status: "available" },
    { id: 7, name: "ເຮືອ 7 / Boat 7", capacity: 6, status: "available" },
    { id: 8, name: "ເຮືອ 8 / Boat 8", capacity: 6, status: "available" },
    { id: 9, name: "ເຮືອ 9 / Boat 9", capacity: 6, status: "available" },
    { id: 10, name: "ເຮືອ 10 / Boat 10", capacity: 6, status: "available" },
  ],
  employees: [
    { id: "EMP-001", name: "ສົມພົງ ລາວດີ (Somphong)", role: "guide", type: "permanent", status: "active", salary: 2500000, tripRate: 50000, bonus: 0 },
    { id: "EMP-002", name: "ບຸນມີ ໄຊຍະເສນ (Bounmy)", role: "guide", type: "permanent", status: "active", salary: 2500000, tripRate: 50000, bonus: 0 },
    { id: "EMP-003", name: "ແກ້ວ ມະນີວົງ (Keo)", role: "guide", type: "freelance", status: "active", salary: 0, tripRate: 70000, bonus: 0 }, // Freelance OT guide
    { id: "EMP-004", name: "ຄຳ ສຸວັນນະດີ (Kham)", role: "guide", type: "freelance", status: "active", salary: 0, tripRate: 70000, bonus: 0 }, // Freelance OT guide
    { id: "EMP-005", name: "ດາວ ເລີດວິໄລ (Dao)", role: "guide", type: "permanent", status: "active", salary: 2500000, tripRate: 50000, bonus: 0 },
    { id: "EMP-006", name: "ຈັນທອນ ແສງແກ້ວ (Chan)", role: "guide", type: "permanent", status: "active", salary: 2500000, tripRate: 50000, bonus: 0 },
    { id: "EMP-007", name: "ສົມບັດ ສີຫາລາດ (Sombath)", role: "captain", type: "permanent", status: "active", salary: 3000000, tripRate: 40000, bonus: 0 },
    { id: "EMP-008", name: "ທອງສຸກ ປ້ອງສີ (Thongsouk)", role: "captain", type: "freelance", status: "active", salary: 0, tripRate: 60000, bonus: 0 }, // Freelance Captain
    { id: "EMP-013", name: "ສົມສັກ ແກ້ວມະນີ (Somsack)", role: "captain", type: "permanent", status: "active", salary: 3000000, tripRate: 40000, bonus: 0 },
    { id: "EMP-009", name: "ຈັນຍາ ກິ່ງແກ້ວ (Chanya)", role: "staff", type: "permanent", status: "active", salary: 2200000, tripRate: 0, bonus: 0 },
    { id: "EMP-010", name: "ສົມຈິດ ວົງສາ (Somchit)", role: "driver", type: "permanent", status: "active", salary: 1800000, tripRate: 30000, bonus: 0 },
    { id: "EMP-011", name: "ບຸນຕາ ແສງທອງ (Bounta)", role: "driver", type: "permanent", status: "active", salary: 1800000, tripRate: 30000, bonus: 0 },
    { id: "EMP-012", name: "ສອນໄຊ ວິໄລສັກ (Sonesay)", role: "driver", type: "freelance", status: "active", salary: 0, tripRate: 50000, bonus: 0 },
    { id: "EMP-014", name: "ນ້ອຍ (Noy)", role: "driver", type: "freelance", status: "active", salary: 0, tripRate: 50000, bonus: 0 },
    { id: "EMP-015", name: "ຄຳ (Kham)", role: "driver", type: "freelance", status: "active", salary: 0, tripRate: 50000, bonus: 0 },
  ],
  partners: [
    { id: "PTN-000", name: "Walk In (ລູກຄ້າທົ່ວໄປ)", type: "agent", commissionRate: 0, contact: "" },
    { id: "PTN-001", name: "Hotel A (ເອເຈນ ໂຮງແຮມ A)", type: "agent", commissionRate: 40000, contact: "+856 20 5551234" },
    { id: "PTN-002", name: "Agoda (ເອເຈນ ອະໂກດາ)", type: "agent", commissionRate: 30000, contact: "+856 20 7779876" },
    { id: "PTN-003", name: "Local Agent (ເອເຈນ ທ້ອງຖິ່ນ)", type: "agent", commissionRate: 50000, contact: "+856 20 9993333" },
    { id: "PTN-004", name: "Noy (ເອເຈນ ນ້ອຍ)", type: "agent", commissionRate: 40000, contact: "+856 20 5551234" },
    { id: "PTN-005", name: "Seng (ເອເຈນ ແສງ)", type: "agent", commissionRate: 35000, contact: "+856 20 8882222" }
  ],
  customers: [],
  bookings: [],
  trips: [],
  users: [
    {
      id: "USR-001",
      email: "admin@tadfane.com",
      password: "admin123",
      name: "Somchai (Owner)",
      role: "owner",
      permissions: {
        dashboard: { view: true, add: true, edit: true, approve: true, delete: true },
        "checkin-tickets": { view: true, add: true, edit: true, approve: true, delete: true },
        "accounting-payroll": { view: true, add: true, edit: true, approve: true, delete: true },
        settings: { view: true, add: true, edit: true, approve: true, delete: true }
      },
      responsibilities: { accounting: true, tickets: true, crew_dispatch: true }
    },
    {
      id: "USR-002",
      email: "cashier@tadfane.com",
      password: "cashier123",
      name: "Naree (Cashier)",
      role: "cashier",
      permissions: {
        dashboard: { view: false, add: false, edit: false, approve: false, delete: false },
        "checkin-tickets": { view: true, add: true, edit: false, approve: false, delete: false },
        "accounting-payroll": { view: false, add: false, edit: false, approve: false, delete: false },
        settings: { view: false, add: false, edit: false, approve: false, delete: false }
      },
      responsibilities: { accounting: false, tickets: true, crew_dispatch: false }
    },
    {
      id: "USR-003",
      email: "accounting@tadfane.com",
      password: "accounting123",
      name: "Bounmy (Accountant)",
      role: "accounting",
      permissions: {
        dashboard: { view: true, add: false, edit: false, approve: false, delete: false },
        "checkin-tickets": { view: false, add: false, edit: false, approve: false, delete: false },
        "accounting-payroll": { view: true, add: true, edit: true, approve: false, delete: false },
        settings: { view: false, add: false, edit: false, approve: false, delete: false }
      },
      responsibilities: { accounting: true, tickets: false, crew_dispatch: false }
    },
    {
      id: "USR-004",
      email: "dispatcher@tadfane.com",
      password: "dispatcher123",
      name: "Kham (Dispatcher)",
      role: "tour_operation",
      permissions: {
        dashboard: { view: true, add: false, edit: false, approve: false, delete: false },
        "checkin-tickets": { view: true, add: false, edit: true, approve: false, delete: false },
        "accounting-payroll": { view: false, add: false, edit: false, approve: false, delete: false },
        settings: { view: false, add: false, edit: false, approve: false, delete: false }
      },

      responsibilities: { accounting: false, tickets: false, crew_dispatch: true }
    }
  ],
  customExpenses: []
};

const DB_KEY = "pos_boat_db";

// In-memory fallback if localStorage is blocked (e.g. mobile Safari private mode or WebView)
let memoryDb = null;

const safeGetItem = (key) => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn("localStorage.getItem blocked:", e);
    return null;
  }
};

const safeSetItem = (key, val) => {
  try {
    localStorage.setItem(key, val);
  } catch (e) {
    console.warn("localStorage.setItem blocked:", e);
  }
};

export const migrateDb = (parsed) => {
  let migrated = false;

  // Automatically merge missing seed employees (like drivers) into parsed list
  if (parsed.employees && Array.isArray(parsed.employees)) {
    SEED_DATA.employees.forEach(se => {
      if (!parsed.employees.some(pe => pe.id === se.id)) {
        parsed.employees.push(se);
        migrated = true;
      }
    });

    // Populate missing fields for all employees
    parsed.employees = parsed.employees.map(e => {
      let updated = false;
      if (e.tourRate === undefined) {
        e.tourRate = e.role === "guide" ? (e.tripRate || 100000) : 0;
        updated = true;
      }
      if (e.raftingRate === undefined) {
        e.raftingRate = e.role === "guide" ? 150000 : 0;
        updated = true;
      }
      if (e.specialRate === undefined) {
        e.specialRate = e.role === "guide" ? 50000 : 0;
        updated = true;
      }
      if (e.phone === undefined) {
        e.phone = "";
        updated = true;
      }
      if (e.hireDate === undefined) {
        e.hireDate = "2025-01-01";
        updated = true;
      }
      if (e.dailyWage === undefined) {
        e.dailyWage = 0;
        updated = true;
      }
      if (e.commission === undefined) {
        e.commission = 0;
        updated = true;
      }
      if (e.ot === undefined) {
        e.ot = 0;
        updated = true;
      }
      if (e.daysWorked === undefined) {
        e.daysWorked = 26;
        updated = true;
      }
      if (updated) migrated = true;
      return e;
    });
  }

  // Automatically merge missing boats (like boats 7 to 10) into parsed list
  if (parsed.boats && Array.isArray(parsed.boats)) {
    SEED_DATA.boats.forEach(sb => {
      if (!parsed.boats.some(pb => pb.id === sb.id)) {
        parsed.boats.push(sb);
        migrated = true;
      }
    });
  }

  // Automatically merge missing seed services into parsed list
  if (parsed.services && Array.isArray(parsed.services)) {
    SEED_DATA.services.forEach(ss => {
      if (!parsed.services.some(ps => ps.id === ss.id)) {
        parsed.services.push(ss);
        migrated = true;
      }
    });
  }

  // Automatically migrate services to support tiered pricing and flat/pax type flags
  if (parsed.services && Array.isArray(parsed.services)) {
    parsed.services = parsed.services.map(s => {
      if (s.priceTier1 === undefined) {
        migrated = true;
        if (s.id === "SRV-001") {
          s.priceTier1 = 250000;
          s.priceTier2 = 230000;
          s.priceTier3 = 200000;
        } else {
          s.priceTier1 = s.price || 0;
          s.priceTier2 = s.price || 0;
          s.priceTier3 = s.price || 0;
        }
      }
      if (s.currency === undefined) {
        migrated = true;
        s.currency = s.id === "SRV-004" || s.id === "SRV-005" ? "THB" : "LAK";
      }
      if (s.priceTier1Type === undefined) {
        migrated = true;
        s.priceTier1Type = s.id === "SRV-005" ? "flat" : "pax";
        s.priceTier2Type = s.id === "SRV-005" ? "flat" : "pax";
        s.priceTier3Type = "pax";
      }
      return s;
    });
  }

  // Automatically reset partners list if it contains old company-based partners
  if (parsed.partners && parsed.partners.some(p => p.name.includes("Lao Travel Discovery"))) {
    parsed.partners = SEED_DATA.partners;
    migrated = true;
  }

  // Automatically migrate settings to support expenseApprovalLimit and logo
  if (parsed.settings) {
    if (parsed.settings.expenseApprovalLimit === undefined) {
      parsed.settings.expenseApprovalLimit = 500000;
      migrated = true;
    }
    if (parsed.settings.logo === undefined || parsed.settings.logo === null || parsed.settings.logo === "") {
      parsed.settings.logo = "/tadfane_logo.jpg";
      migrated = true;
    }
  }

  // Automatically migrate users to include permissions, responsibilities, and map legacy roles
  if (parsed.users && Array.isArray(parsed.users)) {
    parsed.users = parsed.users.map(u => {
      // Map legacy roles
      let updatedRole = u.role;
      if (u.role === "admin") updatedRole = "owner";
      if (u.role === "sales") updatedRole = "cashier";
      if (u.role === "dispatcher") updatedRole = "tour_operation";
      
      if (updatedRole !== u.role) {
        u.role = updatedRole;
        migrated = true;
      }

      // Rebrand email domain to @tadfane.com
      if (u.email && u.email.endsWith("@mekong.com")) {
        u.email = u.email.replace("@mekong.com", "@tadfane.com");
        migrated = true;
      }


      // Set default permissions if missing, or merge missing modules
      if (!u.permissions) {
        u.permissions = {};
        migrated = true;
      }

      const defaultPerms = {
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

      const roleKey = u.role || "cashier";
      const defaultRolePerms = defaultPerms[roleKey] || defaultPerms.cashier;

      const modules = ["dashboard", "checkin-tickets", "accounting-payroll", "settings"];
      modules.forEach(mod => {
        if (!u.permissions[mod]) {
          u.permissions[mod] = { ...defaultRolePerms[mod] };
          migrated = true;
        } else {
          // Check and merge sub-permissions
          const subKeys = ["view", "add", "edit", "approve", "delete"];
          subKeys.forEach(sk => {
            if (u.permissions[mod][sk] === undefined) {
              u.permissions[mod][sk] = defaultRolePerms[mod][sk];
              migrated = true;
            }
          });
        }
      });

      // Set default responsibilities if missing
      if (!u.responsibilities) {
        migrated = true;
        u.responsibilities = {
          accounting: u.role === "owner" || u.role === "accounting",
          tickets: u.role === "owner" || u.role === "cashier",
          crew_dispatch: u.role === "owner" || u.role === "tour_operation"
        };
      }

      return u;
    });
  }

  // Automatically migrate custom expenses to include status and default to "Approved" for legacy entries
  if (parsed.customExpenses && Array.isArray(parsed.customExpenses)) {
    parsed.customExpenses = parsed.customExpenses.map(e => {
      if (!e.status) {
        migrated = true;
        e.status = "Approved"; // Legacy expenses are pre-approved
        e.approvedBy = "Somchai (Owner)";
        e.approvedAt = e.date + "T12:00:00.000Z";
      }
      return e;
    });
  }

  return migrated;
};

export const getDb = () => {
  const data = safeGetItem(DB_KEY);
  if (!data) {
    if (memoryDb) return memoryDb;
    memoryDb = JSON.parse(JSON.stringify(SEED_DATA));
    safeSetItem(DB_KEY, JSON.stringify(SEED_DATA));
    return memoryDb;
  }
  try {
    const parsed = JSON.parse(data);

    const migrated = migrateDb(parsed);
    if (migrated) {
      safeSetItem(DB_KEY, JSON.stringify(parsed));
    }

    const merged = { ...SEED_DATA };
    Object.keys(SEED_DATA).forEach(key => {
      merged[key] = (parsed[key] !== undefined && parsed[key] !== null) ? parsed[key] : SEED_DATA[key];
      if (Array.isArray(SEED_DATA[key]) && !Array.isArray(merged[key])) {
        merged[key] = SEED_DATA[key];
      }
    });
    memoryDb = merged;
    return merged;
  } catch (e) {
    console.error("DB parsing error, resetting to seed data", e);
    if (!memoryDb) {
      memoryDb = JSON.parse(JSON.stringify(SEED_DATA));
    }
    safeSetItem(DB_KEY, JSON.stringify(SEED_DATA));
    return memoryDb;
  }
};

const syncTripsWithBookings = (db) => {
  if (!db.bookings) return;
  
  // Clean up customers created by sync from previous runs to avoid growing indefinitely
  db.customers = db.customers.filter(c => !c.id.startsWith("CUST-BK-"));

  db.trips = db.bookings
    .filter(b => b.status !== "ยกเลิก" && (
      b.status === "ชำระเงินแล้ว / ออกบิลแล้ว" || 
      b.status === "ชำระแล้ว" || 
      b.status === "ออกบิลแล้ว" || 
      b.status === "ออกเรือแล้ว" || 
      b.status === "เสร็จสิ้น" || 
      b.status === "พร้อมชำระเงิน / พร้อมพิมพ์" || 
      b.status === "พร้อมชำระเงิน" || 
      b.status === "กรอกข้อมูลเรียบร้อย" || 
      b.status === "รอชำระเงิน" ||
      b.guideId || b.captainId || b.driverId || b.boatId || 
      (b.assignedBoats && b.assignedBoats.length > 0) || 
      (b.guideIds && b.guideIds.length > 0)
    ))
    .flatMap((b, bIdx) => {
      const customerIds = [];
      
      if (b.passengers && Array.isArray(b.passengers)) {
        b.passengers.forEach((p, idx) => {
          const custId = `CUST-${b.id}-${idx}`;
          customerIds.push(custId);
          
          db.customers.push({
            id: custId,
            name: p.name || `${p.firstName || ""} ${p.lastName || ""}`.trim() || "Guest",
            firstName: p.firstName || "",
            lastName: p.lastName || "",
            nationality: p.nationality,
            gender: p.gender || "",
            phone: p.phone,
            age: p.age ? parseInt(p.age) : null,
            dob: p.dob || "",
            docExpiry: "",
            docNumber: "",
            emergencyName: p.emergencyName || "",
            emergencyRelation: p.emergencyRelation || "",
            emergencyPhone: p.emergencyPhone || "",
            facePhoto: p.facePhoto || "",
            groupId: b.groupId,
            bookingId: b.id,
            status: (b.status === "ชำระเงินแล้ว / ออกบิลแล้ว" || b.status === "ชำระแล้ว" || b.status === "ออกบิลแล้ว" || b.status === "ออกเรือแล้ว" || b.status === "เสร็จสิ้น") ? "completed" : "assigned",
            checkInDate: b.date
          });
        });
      }

      // If the booking has multiple boats assigned, multiplex them into separate trips!
      const boats = b.assignedBoats && Array.isArray(b.assignedBoats) && b.assignedBoats.length > 0
        ? b.assignedBoats
        : [{ boatId: b.boatId || null, guideId: b.guideId || (b.guideIds && b.guideIds[0]) || null, paxCount: b.paxCount }];

      const captains = db.employees ? db.employees.filter(e => e.role === "captain" && e.status === "active") : [];

      return boats.map((boatInfo, boatIdx) => {
        const tripId = `TRIP-${(b.id || "").replace("BK-", "")}-${boatIdx}`;
        const parsedBoatId = boatInfo.boatId ? parseInt(boatInfo.boatId) : null;
        
        // Auto-assign Captain from active captains registry since Captain is removed from cashier inputs
        let assignedCaptainId = b.captainId || null;
        if (!assignedCaptainId && captains.length > 0) {
          assignedCaptainId = captains[(bIdx + boatIdx) % captains.length].id;
        }

        return {
          id: tripId,
          date: b.date,
          time: b.time,
          boatId: parsedBoatId,
          boatIds: parsedBoatId ? [parsedBoatId] : [],
          captainId: assignedCaptainId,
          captainIds: assignedCaptainId ? [assignedCaptainId] : [],
          guideIds: boatInfo.guideId ? [boatInfo.guideId] : (b.guideIds || []),
          driverIds: b.driverId ? [b.driverId] : [],
          customerIds: customerIds,
          bookingId: b.id,
          status: b.status === "เสร็จสิ้น" ? "completed" : "dispatched",
          createdAt: b.createdAt || new Date().toISOString(),
          paymentMethod: b.paymentMethod || "cash",
          pricePaidLAK: boatIdx === 0 ? (b.pricePaidLAK || 0) : 0 // revenue is reported on the first trip to prevent double counting
        };
      });
    });
};

export const saveDb = (db) => {
  try {
    syncTripsWithBookings(db);
  } catch (err) {
    console.error("Trip sync failed:", err);
  }
  
  memoryDb = db;
  safeSetItem(DB_KEY, JSON.stringify(db));
  

  try {
    window.dispatchEvent(new Event("db-update"));
  } catch (e) {}
};

export const resetDb = () => {
  memoryDb = JSON.parse(JSON.stringify(SEED_DATA));
  safeSetItem(DB_KEY, JSON.stringify(SEED_DATA));
  return memoryDb;
};

// Create customer
export const addCustomer = (customer) => {
  const db = getDb();
  const newCustomer = {
    ...customer,
    id: customer.id || `CUST-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    checkInDate: customer.checkInDate || new Date().toISOString().split("T")[0],
    status: customer.status || "pending"
  };
  db.customers.push(newCustomer);
  saveDb(db);
  return newCustomer;
};

// Create booking
export const addBooking = (booking) => {
  const db = getDb();
  const newBooking = {
    ...booking,
    id: booking.id || `BK-${1000 + db.bookings.length + 1}`,
    status: booking.status || "รอลูกค้ากรอกข้อมูล",
    createdAt: new Date().toISOString()
  };
  db.bookings.push(newBooking);
  saveDb(db);
  return newBooking;
};

// Dispatch Boat Trip
export const createTrip = (tripData) => {
  const db = getDb();
  
  // Register any passenger objects that aren't already in the database
  const customerIds = [];
  if (tripData.customers && Array.isArray(tripData.customers)) {
    tripData.customers.forEach(cust => {
      if (typeof cust === "string") {
        customerIds.push(cust);
      } else if (cust && typeof cust === "object") {
        if (cust.id) {
          // Update existing customer in db
          db.customers = db.customers.map(c => 
            c.id === cust.id 
              ? { ...c, name: cust.name, status: "assigned", bookingId: tripData.bookingId || c.bookingId }
              : c
          );
          customerIds.push(cust.id);
        } else {
          // Create new placeholder customer
          const newCust = {
            id: `CUST-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            name: cust.name,
            passport: cust.passport || "",
            phone: cust.phone || "",
            hotel: cust.hotel || "",
            partnerId: tripData.partnerId || null,
            bookingId: tripData.bookingId || null,
            status: "assigned",
            checkInDate: tripData.date || new Date().toISOString().split("T")[0]
          };
          db.customers.push(newCust);
          customerIds.push(newCust.id);
        }
      }
    });
  } else if (tripData.customerIds && Array.isArray(tripData.customerIds)) {
    customerIds.push(...tripData.customerIds);
  }

  const boatIds = tripData.boatIds || (tripData.boatId ? [parseInt(tripData.boatId)] : []);
  const captainIds = tripData.captainIds || (tripData.captainId ? [tripData.captainId] : []);

  const newTrip = {
    id: `TRIP-${1000 + db.trips.length + 1}`,
    date: tripData.date || new Date().toISOString().split("T")[0],
    time: tripData.time || new Date().toTimeString().split(" ")[0].slice(0, 5),
    boatId: boatIds[0] || parseInt(tripData.boatId),
    boatIds: boatIds,
    captainId: captainIds[0] || tripData.captainId,
    captainIds: captainIds,
    guideIds: tripData.guideIds,
    driverIds: tripData.driverIds || [],
    customerIds: customerIds,
    bookingId: tripData.bookingId || null,
    agentSignature: tripData.agentSignature || null,
    status: "dispatched",
    createdAt: new Date().toISOString(),
    paymentMethod: tripData.paymentMethod || "cash",
    pricePaidLAK: tripData.pricePaidLAK || 0
  };

  db.boats = db.boats.map(b => boatIds.includes(b.id) ? { ...b, status: "busy" } : b);
  db.customers = db.customers.map(c => 
    newTrip.customerIds.includes(c.id) ? { ...c, status: "assigned" } : c
  );

  // If a booking is associated, mark it as assigned/ready to depart and update payment details
  if (tripData.bookingId) {
    db.bookings = db.bookings.map(b => b.id === tripData.bookingId ? { ...b, status: "READY_TO_DEPART", paymentMethod: tripData.paymentMethod || b.paymentMethod } : b);
  }

  db.trips.push(newTrip);
  saveDb(db);
  return newTrip;
};

// Complete Boat Trip
export const completeTrip = (tripId) => {
  const db = getDb();
  const trip = db.trips.find(t => t.id === tripId);
  if (!trip) return;

  trip.status = "completed";
  const tripBoatIds = trip.boatIds || (trip.boatId ? [trip.boatId] : []);
  db.boats = db.boats.map(b => tripBoatIds.includes(b.id) ? { ...b, status: "available" } : b);
  db.customers = db.customers.map(c => 
    trip.customerIds.includes(c.id) ? { ...c, status: "completed" } : c
  );
  
  saveDb(db);
  return trip;
};

// Cancel Boat Trip
export const cancelTrip = (tripId) => {
  const db = getDb();
  const trip = db.trips.find(t => t.id === tripId);
  if (!trip) return;

  trip.status = "cancelled";
  const tripBoatIds = trip.boatIds || (trip.boatId ? [trip.boatId] : []);
  db.boats = db.boats.map(b => tripBoatIds.includes(b.id) ? { ...b, status: "available" } : b);
  db.customers = db.customers.map(c => 
    trip.customerIds.includes(c.id) ? { ...c, status: "pending" } : c
  );

  saveDb(db);
  return trip;
};

// Add Custom Expense
export const addCustomExpense = (expense) => {
  const db = getDb();
  const newExp = {
    ...expense,
    id: `EXP-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  };
  db.customExpenses = db.customExpenses || [];
  db.customExpenses.push(newExp);
  saveDb(db);
  return newExp;
};

// Delete Custom Expense
export const deleteCustomExpense = (id) => {
  const db = getDb();
  db.customExpenses = db.customExpenses || [];
  db.customExpenses = db.customExpenses.filter(e => e.id !== id);
  saveDb(db);
};

// Approve Custom Expense
export const approveExpense = (id, userName) => {
  const db = getDb();
  db.customExpenses = db.customExpenses || [];
  db.customExpenses = db.customExpenses.map(e => 
    e.id === id 
      ? { ...e, status: "Approved", approvedBy: userName, approvedAt: new Date().toISOString() } 
      : e
  );
  saveDb(db);
};

// Reject Custom Expense
export const rejectExpense = (id) => {
  const db = getDb();
  db.customExpenses = db.customExpenses || [];
  db.customExpenses = db.customExpenses.map(e => 
    e.id === id 
      ? { ...e, status: "Rejected" } 
      : e
  );
  saveDb(db);
};

// Purge Test Data
export const purgeTestData = () => {
  const db = getDb();
  db.bookings = [];
  db.customers = [];
  db.trips = [];
  db.customExpenses = [];
  if (db.boats && Array.isArray(db.boats)) {
    db.boats = db.boats.map(b => ({ ...b, status: "available" }));
  }
  saveDb(db);
};
