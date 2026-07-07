import React, { useState } from "react";
import { addEmployeeRegistrationToFirebase } from "../db/firebaseSync";
import { User, Phone, Briefcase, Landmark, MapPin, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";

export default function SelfRegisterEmployeePortal() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("crew");
  const [type, setType] = useState("daily");
  const [bankAccount, setBankAccount] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [emergencyRelationship, setEmergencyRelationship] = useState("");
  const [facePhoto, setFacePhoto] = useState("");
  const [note, setNote] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 200;
        const MAX_HEIGHT = 200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
        setFacePhoto(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("ກະລຸນາກອກຊື່ ແລະ ນາມສະກຸນ / Please enter name and surname");
      return;
    }
    if (!phone.trim()) {
      setError("ກະລຸນາກອກເບີໂທລະສັບ / Please enter phone number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formattedBankDetails = bankAccount.trim();
      const employeeData = {
        name: name.trim(),
        phone: phone.trim(),
        role,
        type,
        bankAccount: formattedBankDetails,
        address: address.trim(),
        emergencyContactName: emergencyContactName.trim(),
        emergencyContactPhone: emergencyContactPhone.trim(),
        emergencyRelationship: emergencyRelationship.trim(),
        facePhoto: facePhoto,
        note: note.trim()
      };

      await addEmployeeRegistrationToFirebase(employeeData);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ / Failed to submit registration");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        fontFamily: "var(--font-sans)"
      }}>
        <div className="card" style={{
          maxWidth: "480px",
          width: "100%",
          padding: "40px 30px",
          textAlign: "center",
          boxShadow: "var(--shadow-lg)",
          borderRadius: "var(--border-radius)",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-color)"
        }}>
          <div style={{
            display: "inline-flex",
            justifyContent: "center",
            alignItems: "center",
            width: "72px",
            height: "72px",
            background: "rgba(4, 120, 87, 0.1)",
            borderRadius: "50%",
            color: "var(--success)",
            marginBottom: "24px"
          }}>
            <CheckCircle size={40} />
          </div>
          <h2 style={{ fontSize: "1.5rem", color: "var(--text-primary)", marginBottom: "12px", fontWeight: "700" }}>
            ລົງທະບຽນພະນັກງານສຳເລັດ!
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: "1.6", marginBottom: "24px" }}>
            ข้อมูลประวัติของคุณถูกส่งเข้าระบบเรียบร้อยแล้ว กรุณาแจ้งผู้จัดการหรือแอดมินเพื่อกำหนดเงินเดือน อัตราค่าจ้าง และอนุมัติบัญชีเข้าทำงาน
          </p>
          <div style={{
            borderTop: "1px solid var(--border-color)",
            paddingTop: "20px",
            fontSize: "0.85rem",
            color: "var(--text-muted)"
          }}>
            Tadfane Rafting POS System
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(at 0% 0%, rgba(204, 251, 241, 0.1) 0px, transparent 50%), var(--bg-primary)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      fontFamily: "var(--font-sans)"
    }}>
      <div className="card" style={{
        maxWidth: "540px",
        width: "100%",
        boxShadow: "var(--shadow-lg)",
        borderRadius: "var(--border-radius)",
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
        overflow: "hidden"
      }}>
        {/* Header decoration */}
        <div style={{
          background: "linear-gradient(135deg, var(--primary) 0%, #0d9488 100%)",
          padding: "30px 24px",
          color: "white",
          textAlign: "center"
        }}>
          <h1 style={{ fontSize: "1.4rem", fontWeight: "700", marginBottom: "8px" }}>
            ລົງທະບຽນປະຫວັດພະນັກງານ
          </h1>
          <p style={{ fontSize: "0.85rem", opacity: "0.9" }}>
            Employee Profile Registration Form
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
          {error && (
            <div style={{
              background: "var(--danger-light)",
              border: "1px solid rgba(190, 18, 60, 0.2)",
              color: "var(--danger)",
              borderRadius: "8px",
              padding: "12px 16px",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "20px"
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Profile Photo Uploader */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "20px" }}>
            <div 
              style={{
                width: "90px",
                height: "90px",
                borderRadius: "50%",
                border: "2px dashed var(--border-color)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                overflow: "hidden",
                position: "relative",
                background: "var(--bg-tertiary)",
                transition: "all 0.2s"
              }}
              onClick={() => document.getElementById("photo-upload").click()}
            >
              {facePhoto ? (
                <img src={facePhoto} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ textAlign: "center", padding: "8px", color: "var(--text-secondary)" }}>
                  <span style={{ fontSize: "1.5rem" }}>📷</span>
                  <div style={{ fontSize: "0.7rem", marginTop: "2px", fontWeight: "600" }}>ຮູບພະນັກງານ</div>
                  <div style={{ fontSize: "0.55rem", opacity: 0.7 }}>Tap to Upload</div>
                </div>
              )}
            </div>
            <input 
              id="photo-upload"
              type="file" 
              accept="image/*" 
              onChange={handlePhotoChange}
              style={{ display: "none" }}
            />
          </div>

          {/* Name */}
          <div style={{ marginBottom: "18px" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px" }}>
              ຊື່ ແລະ ນາມສະກຸນ / Full Name *
            </label>
            <div style={{ position: "relative" }}>
              <User size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="ຕົວຢ່າງ: ສົມດີ ມີໄຊ"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 36px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  outline: "none",
                  fontSize: "0.95rem"
                }}
              />
            </div>
          </div>

          {/* Phone */}
          <div style={{ marginBottom: "18px" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px" }}>
              ເບີໂທຕິດຕໍ່ / Phone Number *
            </label>
            <div style={{ position: "relative" }}>
              <Phone size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="tel"
                placeholder="e.g. +856 20 555-9000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 36px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  outline: "none",
                  fontSize: "0.95rem"
                }}
              />
            </div>
          </div>

          {/* Row for Role and Type */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "18px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px" }}>
                ຕຳແໜ່ງ / Position *
              </label>
              <div style={{ position: "relative" }}>
                <Briefcase size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 36px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    background: "white",
                    outline: "none",
                    fontSize: "0.9rem"
                  }}
                >
                  <option value="crew">ພະນັກງານທົ່ວໄປ / Crew</option>
                  <option value="captain">ຄົນຂັບເຮືອ / Boat Driver</option>
                  <option value="guide">ໄກ້ດນຳທ່ຽວ / Tour Guide</option>
                  <option value="office">ພະນັກງານຫ້ອງການ / Office</option>
                  <option value="other">ອື່ນໆ / Other</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px" }}>
                ປະເພດການຈ່າຍ / Payment Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  background: "white",
                  outline: "none",
                  fontSize: "0.9rem"
                }}
              >
                <option value="daily">ລາຍວັນ / Daily Wage</option>
                <option value="salary">ເງິນເດືອນ / Monthly Salary</option>
                <option value="trip">ລາຍທ່ຽວ / Trip-based</option>
              </select>
            </div>
          </div>

          {/* Bank Account */}
          <div style={{ marginBottom: "18px" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px" }}>
              ຂໍ້ມູນບັນຊີທະນາຄານ / Bank Account Details *
            </label>
            <div style={{ position: "relative" }}>
              <Landmark size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="ເຊັ່ນ: BCEL 160-12-00-XXXXX Somdee"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 36px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  outline: "none",
                  fontSize: "0.95rem"
                }}
              />
            </div>
          </div>

          {/* Current Address */}
          <div style={{ marginBottom: "18px" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px" }}>
              ທີ່ຢູ່ປະຈຸບັນ / Current Address
            </label>
            <div style={{ position: "relative" }}>
              <MapPin size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }} />
              <textarea
                placeholder="ບ້ານ, ເມືອງ, ແຂວງ"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 36px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  outline: "none",
                  fontSize: "0.95rem",
                  resize: "none"
                }}
              />
            </div>
          </div>

          {/* Emergency Contact Group */}
          <div style={{
            background: "var(--bg-tertiary)",
            borderRadius: "8px",
            padding: "14px",
            marginBottom: "20px",
            border: "1px dashed var(--border-color)"
          }}>
            <h3 style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "10px" }}>
              📢 ຜູ້ຕິດຕໍ່ສຸກເສີນ / Emergency Contact
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <input
                  type="text"
                  placeholder="ຊື່ຜູ້ຕິດຕໍ່ສຸກເສີນ / Name"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color)",
                    outline: "none",
                    fontSize: "0.85rem"
                  }}
                />
                <input
                  type="text"
                  placeholder="ພົວພັນເປັນ (ເຊັ່ນ: ພໍ່, ແມ່, ສາມີ) / Relation"
                  value={emergencyRelationship}
                  onChange={(e) => setEmergencyRelationship(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color)",
                    outline: "none",
                    fontSize: "0.85rem"
                  }}
                />
              </div>
              <input
                type="tel"
                placeholder="ເບີໂທສຸກເສີນ / Phone"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-color)",
                  outline: "none",
                  fontSize: "0.85rem"
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              background: "var(--primary)",
              color: "white",
              fontWeight: "bold",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
              fontSize: "0.95rem"
            }}
          >
            {loading ? "ກຳລັງສົ່ງຂໍ້ມູນ..." : "ສົ່ງຂໍ້ມູນປະຫວັດພະນັກງານ"} <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
