// SelfRegisterPortal.jsx - Customer Self-Service Online Registration & Waiver Portal
import React, { useState, useEffect, useRef } from "react";
import { getDb, saveDb } from "../db/mockDb";
import { getBookingFromFirebase, addPassengerToFirebaseBooking, updateBookingInFirebase, isFirebaseConfigured } from "../db/firebaseSync";
import { ShieldCheck, User, Globe2, Phone, CalendarRange, CheckCircle2, AlertTriangle, ArrowRight, Ship, Camera, RefreshCw, X } from "lucide-react";

const calculateAge = (dobString) => {
  if (!dobString) return "";
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return "";
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : 0;
};

const getDobInputVal = (dob) => {
  if (!dob) return "";
  const parts = dob.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dob;
};

// Translations matching the requested fields
const TRANSLATIONS = {
  la: {
    welcome: "ຍິນດີຕ້ອນຮັບສູ່ ຕາດຟານ ລ່ອງແກ່ງ",
    title: "ລົງທະບຽນລູກຄ້າ & ໃບຍິນຍອມ",
    sub: "ກະລຸນາກອກຂໍ້ມູນ ແລະ ຍອມຮັບເງື່ອນໄຂກ່ອນຂຶ້ນເຮືອ",
    enterCode: "ປ້ອນລະຫັດກຸ່ມ (Group Code)",
    search: "ຄົ້ນຫາ",
    invalidCode: "ລະຫັດກຸ່ມບໍ່ຖືກຕ້ອງ ຫຼື ບໍ່ພົບຂໍ້ມູນ. ກະລຸນາຖາມແຄຊເຊຍ.",
    acceptTerms: "ຂ້ອຍໄດ້ອ່ານ ແລະ ຍອມຮັບຂໍ້ກຳນົດ ແລະ ເງື່ອນໄຂການໃຊ້ບໍລິການ",
    termsTitle: "ຂໍ້ກຳນົດ ແລະ ເງື່ອນໄຂການໃຊ້ບໍລິການ",
    termsText1: "ຂ້າພະເຈົ້າໄດ້ຮັບຊາບ ແລະ ຍອມຮັບວ່າກິດຈະກຳທ່ອງທ່ຽວທາງນ້ຳ ແລະ ກິດຈະກຳຜະຈົນໄພອາດມີຄວາມສ່ຽງຈາກສະພາບອາກາດ, ການເດີນທາງ, ອຸບັດຕິເຫດ, ການບາດເຈັບ ຫຼື ເຫດສຸດວິໄສອື່ນໆ ທີ່ອາດເກີດຂຶ້ນໄດ້.",
    termsText2: "ຂ້າພະເຈົ້າຍິນຍອມປະຕິບັດຕາມຄຳແນະນຳຂອງພະນັກງານ, ໄກ້ດ ແລະ ເຈົ້າໜ້າທີ່ທຸກປະການ ເພື່ອຄວາມປອດໄພຕະຫຼອດໄລຍະເວລາການໃຊ້ບໍລິການ.",
    termsText3: "ຂ້າພະເຈົ້າຮັບຊາບ ແລະ ຍອມຮັບຄວາມສ່ຽງທີ່ອາດເກີດຂຶ້ນຈາກກິດຈະກຳ ແລະ ຈະບໍ່ຮຽກຮ້ອງຄ່າເສຍຫາຍໃດໆ ຈາກບໍລິສັດ, ພະນັກງານ ຫຼື ຜູ້ກ່ຽວຂ້ອງ ໃນກໍລະນີທີ່ເກີດເຫດສຸດວິໄສ, ອຸບັດຕິເຫດ ຫຼື ເຫດການທີ່ຢູ່ນອກເໜືອການຄວບຄຸມຂອງບໍລິສັດ.",
    cancelPolicyTitle: "ນະໂຍບາຍການຍົກເລີກ",
    cancelText1: "• ເມື່ອເລີ່ມກິດຈະກຳແລ້ວ, ບໍ່ມີການຄືນເງິນທຸກກໍລະນີ.",
    cancelText2: "• ລູກຄ້າທີ່ບໍ່ມາຕາມເວລານັດໝາຍ, ບໍ່ມີການຄືນເງິນ.",
    cancelText3: "• ການຍົກເລີກຫຼັງຈາກຢືນຢັນການຈອງແລ້ວ, ບໍ່ມີການຄືນເງິນ.",
    passengerTitle: "ຜູ້ໂດຍສານຄົນທີ",
    pFirstName: "ຊື່ແທ້ (First Name)",
    pFirstNamePlh: "ຊື່ພາສາອັງກິດ (ເຊັ່ນ: Somchai)",
    pLastName: "ນາມສະກຸນ (Last Name)",
    pLastNamePlh: "ນາມສະກຸນພາສາອັງກິດ (ເຊັ່ນ: Saetang)",
    pNation: "ສັນຊາດ",
    pNationPlh: "ສັນຊາດ (ເຊັ່ນ: Thai, Lao, American)",
    pGender: "ເພດ",
    pGenderPlh: "ເລືອກເພດ",
    gMale: "ຊາຍ",
    gFemale: "ຍິງ",
    gOther: "ອື່ນໆ",
    pPhone: "ເບີໂທຕິດຕໍ່",
    pPhonePlh: "ເບີໂທລະສັບ",
    pAge: "ອາຍຸ",
    pAgePlh: "ອາຍຸ (ປີ)",
    pDob: "ວັນເດືອນປີເກີດ (DOB)",
    pEmergencyName: "ຊື່ຜູ້ຕິດຕໍ່ສຸກເສີນ",
    pEmergencyNamePlh: "ຊື່ ແລະ ນາມສະກຸນ (ເຊັ່ນ: Somphone Lao)",
    pEmergencyRelation: "ຄວາມສຳພັນ",
    pEmergencyRelationPlh: "ພໍ່, ແມ່, ໝູ່, ແຟນ...",
    pEmergencyPhone: "ເບີໂທສຸກເສີນ",
    pEmergencyPhonePlh: "ເບີໂທສຸກເສີນ",
    submit: "ສົ່ງຂໍ້ມູນລົງທະບຽນ",
    successTitle: "ລົງທະບຽນສຳເລັດແລ້ວ!",
    successSub: "ຂໍ້ມູນຂອງທ່ານໄດ້ຖືກສົ່ງເຂົ້າລະບົບແລ້ວ. ສະຖານະປ່ຽນເປັນ 'ພ້ອມຊຳລະເງິນ'. ກະລຸນາແຈ້ງແຄຊເຊຍເພື່ອດຳເນີນການຕໍ່. ຂໍຂອບໃຈ!",
    groupCode: "ລະຫັດກຸ່ມ:",
    paxCount: "ຈຳນວນລູກຄ້າ:",
    alertMissing: "ກະລຸນາກອກຂໍ້ມູນໃຫ້ຄົບຖ້ວນທຸກຄົນ (ຊື່, ນາມສະກຸນ, ສັນຊາດ, ວັນເກີດ, ເພດ, ເບີໂທລະສັບ ແລະ ຂໍ້ມູນຕິດຕໍ່ສຸກເສີນ)",
    ocrProcessing: "ກຳລັງປະມວນຜົນ OCR...",
    ocrReviewTitle: "ກວດສອບຂໍ້ມູນຈາກເອກະສານ",
    ocrReviewSub: "ກະລຸນາກວດສອບ ແລະ ປັບປຸງຂໍ້ມູນໃຫ້ຖືກຕ້ອງກ່ອນດຳເນີນການຕໍ່",
    confirmAndSelfie: "ຢືນຢັນຂໍ້ມູນ & ໄປຖ່າຍຮູບຕໍ່ ➔",
    captureDocBtn: "📷 ຖ່າຍຮູບເອກະສານ",
    captureFaceBtn: "📷 ຖ່າຍຮູບໃບໜ້າ",
    ocrProfileSelectLabel: "💡 ທົດລອງປ້ອນຂໍ້ມູນຕົວຢ່າງ (Demo Profile):",
    unscanned: "ຍັງບໍ່ທັນສະແກນເອກະສານ / Unscanned",
    idCard: "ບັດປະຊາຊົນ / National ID",
    dayPlh: "ວັນ / Day",
    monthPlh: "ເດືອນ / Mo",
    yearPlh: "ປີ / Year",
    ocrReadSuccess: "🟢 ອ່ານຂໍ້ມູນສຳເລັດ / Read Successful",
    ocrReadFail: "🔴 ອ່ານຂໍ້ມູນບໍ່ສຳເລັດ / Read Unsuccessful",
    scanTitleDocId: "ສະແກນ ບັດປະຊາຊົນ / Scan ID Card",
    scanTitleDocPassport: "ສະແກນ ພາດສະປອດ / Scan Passport",
    scanTitleProcessing: "⚙️ ກຳລັງປະມວນຜົນ OCR... / Processing OCR...",
    scanTitleFace: "📷 ຖ່າຍຮູບໃບໜ້າ / Take Selfie",
    scanDescDoc: "ວາງເອກະສານໃຫ້ຢູ່ໃນຂອບ ແລະ ປັບແສງສະຫວ່າງໃຫ້ເໝາະສົມ / Place document inside frame",
    scanDescProcessing: "ກຳລັງສະແກນ ແລະ ປະມວນຜົນຂໍ້ມູນເອກະສານດ້ວຍລະບົບ OCR...",
    scanDescFace: "ເບິ່ງກົງມາຍັງໜ້າຈໍເພື່ອບັນທຶກພາບຖ່າຍຢືນຢັນຕົວຕົນ",
    cameraAccessing: "ກຳລັງເປີດກ້ອງ... / Accessing Camera...",
    alertCameraError: "ບໍ່ສາມາດເປີດກ້ອງໄດ້ ກະລຸນາອະນຸຍາດສິດການນຳໃຊ້ກ້ອງໃນບຣາວເຊີຂອງທ່ານ / Cannot open camera. Please allow camera permissions.",
    alertMrzNotFound: "ບໍ່ພົບຂໍ້ມູນ MRZ ຫຼື ພາບຖ່າຍບໍ່ຊັດເຈນ ກະລຸນາປັບມຸມຖ່າຍພາບໃຫ້ກົງຕາມຄຳແນະນຳ ຫຼື ປ້ອນຂໍ້ມູນດ້ວຍຕົນເອງ / Could not detect MRZ or photo is blurry.",
    alertOcrError: "ລະບົບ OCR ບໍ່ພ້ອມໃຊ້ງານຊົ່ວຄາວ ກະລຸນາປ້ອນຂໍ້ມູນດ້ວຍຕົນເອງ / OCR Engine is temporarily unavailable. Please enter details manually.",
    signatureLabel: "ລາຍເຊັນລູກຄ້າ / Customer Signature",
    clearBtn: "ລຶບລາຍເຊັນ",
    alertSignatureRequired: "ກະລຸນາເຊັນຊື່ຂອງທ່ານກ່ອນສົ່ງຂໍ້ມູນ"
  },
  en: {
    welcome: "Welcome to TADFANE RAFTING",
    title: "Passenger Registration & Liability Waiver",
    sub: "Please fill in passenger details and accept the safety terms before boarding.",
    enterCode: "Enter Group Code",
    search: "Search Code",
    invalidCode: "Group Code is invalid or not found. Please contact the cashier.",
    acceptCheckbox: "I have read and accept the terms and conditions of service",
    termsTitle: "Terms & Conditions of Service",
    termsText1: "I acknowledge and agree that water activities and adventure tourism may involve inherent risks, including weather conditions, travel, accidents, injuries, or other force majeure events.",
    termsText2: "I agree to comply with all safety instructions from staff, guides, and officers at all times for my safety during the service.",
    termsText3: "I understand the risks associated with the activities and waive any claims for damages against the company, employees, or related parties in case of accidents, force majeure, or events beyond the company's control.",
    cancelPolicyTitle: "Cancellation Policy",
    cancelText1: "• Once the activity has commenced, no refunds will be issued under any circumstances.",
    cancelText2: "• No-shows at the scheduled appointment time will not be refunded.",
    cancelText3: "• Cancellations made after booking confirmation are non-refundable.",
    passengerTitle: "Passenger #",
    pFirstName: "First Name",
    pFirstNamePlh: "e.g. Jane",
    pLastName: "Last Name",
    pLastNamePlh: "e.g. Smith",
    pNation: "Nationality",
    pNationPlh: "e.g. Thai, American, German",
    pGender: "Gender",
    pGenderPlh: "Select Gender",
    gMale: "Male",
    gFemale: "Female",
    gOther: "Other",
    pPhone: "Phone Number",
    pPhonePlh: "Contact phone number",
    pAge: "Age",
    pAgePlh: "Age in years",
    pDob: "Date of Birth (DOB)",
    pEmergencyName: "Emergency Contact Name",
    pEmergencyNamePlh: "Full Name (e.g. Somphone Lao)",
    pEmergencyRelation: "Relationship",
    pEmergencyRelationPlh: "Father, Mother, Spouse, Friend...",
    pEmergencyPhone: "Emergency Contact Phone",
    pEmergencyPhonePlh: "Emergency phone number",
    submit: "Submit Registration",
    successTitle: "Registration Successful!",
    successSub: "Your details have been submitted. Status updated to Ready to Checkout. Please notify the ticketing cashier to proceed. Thank you!",
    groupCode: "Group Code:",
    paxCount: "Total Passengers:",
    alertMissing: "Please fill in all required fields for all passengers (First Name, Last Name, Nationality, Date of Birth, Gender, Phone, and Emergency Contact details)",
    ocrProcessing: "Processing OCR...",
    ocrReviewTitle: "Review OCR Document Details",
    ocrReviewSub: "Please review and correct the read information before proceeding.",
    confirmAndSelfie: "Confirm & Proceed to Selfie ➔",
    captureDocBtn: "📷 Capture Document",
    captureFaceBtn: "📷 Capture Face",
    ocrProfileSelectLabel: "💡 Select Demo Profile to Auto-Fill:",
    unscanned: "Unscanned",
    idCard: "National ID",
    dayPlh: "Day",
    monthPlh: "Month",
    yearPlh: "Year",
    ocrReadSuccess: "🟢 Read Successful",
    ocrReadFail: "🔴 Read Unsuccessful",
    scanTitleDocId: "Scan ID Card",
    scanTitleDocPassport: "Scan Passport",
    scanTitleProcessing: "Processing OCR...",
    scanTitleFace: "Take Selfie",
    scanDescDoc: "Place the document inside the frame with proper lighting.",
    scanDescProcessing: "Scanning and processing document details via OCR...",
    scanDescFace: "Look directly at the screen to capture confirmation photo.",
    cameraAccessing: "Accessing Camera...",
    alertCameraError: "Cannot open camera. Please allow camera permissions in your browser.",
    alertMrzNotFound: "Could not detect MRZ or photo is blurry. Please check guide or enter details manually.",
    alertOcrError: "OCR Engine is temporarily unavailable. Please enter details manually.",
    signatureLabel: "Customer Signature",
    clearBtn: "Clear Signature",
    alertSignatureRequired: "Please sign your signature before submitting"
  },
  th: {
    welcome: "ยินดีต้อนรับสู่ ตาดฟาน ล่องแก่ง",
    title: "ลงทะเบียนลูกค้า & ใบยินยอม",
    sub: "กรุณากรอกข้อมูลและยอมรับเงื่อนไขก่อนขึ้นเรือ",
    enterCode: "ป้อนรหัสกลุ่ม (Group Code)",
    search: "ค้นหา",
    invalidCode: "รหัสกลุ่มไม่ถูกต้องหรือไม่พบข้อมูล กรุณาถามแคชเชียร์",
    acceptTerms: "ฉันได้อ่านและยอมรับข้อกำหนดและเงื่อนไขการใช้บริการ",
    acceptCheckbox: "ฉันได้อ่านและยอมรับข้อกำหนดและเงื่อนไขการใช้บริการ",
    termsTitle: "ข้อกำหนดและเงื่อนไขการใช้บริการ",
    termsText1: "ข้าพเจ้าได้รับทราบและยอมรับว่ากิจกรรมท่องเที่ยวทางน้ำและกิจกรรมผจญภัยอาจมีความเสี่ยงจากสภาพอากาศ, การเดินทาง, อุบัติเหตุ, การบาดเจ็บ หรือเหตุสุดวิสัยอื่นๆ ที่อาจเกิดขึ้นได้",
    termsText2: "ข้าพเจ้ายินยอมปฏิบัติตามคำแนะนำของพนักงาน, ไกด์ และเจ้าหน้าที่ทุกประการ เพื่อความปลอดภัยตลอดระยะเวลาการใช้บริการ",
    termsText3: "ข้าพเจ้ารับทราบและยอมรับความเสี่ยงที่อาจเกิดขึ้นจากกิจกรรม และจะไม่เรียกร้องค่าเสียหายใดๆ จากบริษัท, พนักงาน หรือผู้เกี่ยวข้อง ในกรณีที่เกิดเหตุสุดวิสัย, อุบัติเหตุ หรือเหตุการณ์ที่อยู่นอกเหนือการควบคุมของบริษัท",
    cancelPolicyTitle: "นโยบายการยกเลิก",
    cancelText1: "• เมื่อเริ่มกิจกรรมแล้ว ไม่มีคืนเงินทุกกรณี",
    cancelText2: "• ลูกค้าที่ไม่มาตามเวลานัดหมาย ไม่คืนเงิน",
    cancelText3: "• การยกเลิกหลังจากยืนยันการจองแล้ว ไม่คืนเงิน",
    passengerTitle: "ผู้โดยสารคนที่",
    pFirstName: "ชื่อจริง (First Name)",
    pFirstNamePlh: "ชื่อจริงภาษาอังกฤษ (เช่น Somchai)",
    pLastName: "นามสกุล (Last Name)",
    pLastNamePlh: "นามสกุลภาษาอังกฤษ (เช่น Saetang)",
    pNation: "สัญชาติ",
    pNationPlh: "สัญชาติ (เช่น Thai, Lao, American)",
    pGender: "เพศ",
    pGenderPlh: "เลือกเพศ",
    gMale: "ชาย",
    gFemale: "หญิง",
    gOther: "อื่นๆ",
    pPhone: "เบอร์โทรติดต่อ",
    pPhonePlh: "เบอร์โทรศัพท์",
    pAge: "อายุ",
    pAgePlh: "อายุ (ปี)",
    pDob: "วันเดือนปีเกิด (DOB)",
    pEmergencyName: "ชื่อผู้ติดต่อฉุกเฉิน",
    pEmergencyNamePlh: "ชื่อและนามสกุล (เช่น Somphone Lao)",
    pEmergencyRelation: "ความสัมพันธ์",
    pEmergencyRelationPlh: "พ่อ, แม่, เพื่อน, แฟน...",
    pEmergencyPhone: "เบอร์โทรฉุกเฉิน",
    pEmergencyPhonePlh: "เบอร์โทรฉุกเฉิน",
    submit: "ส่งข้อมูลลงทะเบียน",
    successTitle: "ลงทะเบียนสำเร็จแล้ว!",
    successSub: "ข้อมูลของคุณได้ถูกส่งเข้าระบบแล้ว สถานะเปลี่ยนเป็น 'พร้อมชำระเงิน' กรุณาแจ้งแคชเชียร์เพื่อดำเนินการต่อ ขอขอบพระคุณ!",
    groupCode: "รหัสกลุ่ม:",
    paxCount: "จำนวนลูกค้า:",
    alertMissing: "กรุณากรอกข้อมูลให้ครบถ้วนทุกคน (ชื่อ, นามสกุล, สัญชาติ, วันเกิด, เพศ, เบอร์โทรศัพท์ และข้อมูลติดต่อฉุกเฉิน)",
    ocrProcessing: "กำลังประมวลผล OCR...",
    ocrReviewTitle: "ตรวจสอบข้อมูลจากเอกสาร",
    ocrReviewSub: "กรุณาตรวจสอบและปรับปรุงข้อมูลให้ถูกต้องก่อนดำเนินการต่อ",
    confirmAndSelfie: "ยืนยันข้อมูล & ไปถ่ายภาพต่อ ➔",
    captureDocBtn: "📷 ถ่ายภาพเอกสาร",
    captureFaceBtn: "📷 ถ่ายภาพใบหน้า",
    ocrProfileSelectLabel: "💡 ทดลองป้อนข้อมูลตัวอย่าง (Demo Profile):",
    unscanned: "ยังไม่ได้สแกนเอกสาร / Unscanned",
    idCard: "บัตรประชาชน / National ID",
    dayPlh: "วัน / Day",
    monthPlh: "เดือน / Mo",
    yearPlh: "ปี / Year",
    ocrReadSuccess: "🟢 อ่านข้อมูลสำเร็จ / Read Successful",
    ocrReadFail: "🔴 อ่านข้อมูลไม่สำเร็จ / Read Unsuccessful",
    scanTitleDocId: "สแกนบัตรประชาชน / Scan ID Card",
    scanTitleDocPassport: "สแกนพาสปอร์ต / Scan Passport",
    scanTitleProcessing: "⚙️ กำลังประมวลผล OCR... / Processing OCR...",
    scanTitleFace: "📷 ถ่ายภาพใบหน้า / Take Selfie",
    scanDescDoc: "วางเอกสารให้อยู่ในกรอบและปรับแสงสว่างให้เหมาะสม / Place document inside frame",
    scanDescProcessing: "กำลังสแกนและประมวลผลข้อมูลเอกสารด้วยระบบ OCR...",
    scanDescFace: "มองตรงมายังหน้าจอเพื่อบันทึกภาพถ่ายยืนยันตัวตน",
    cameraAccessing: "กำลังเปิดกล้อง... / Accessing Camera...",
    alertCameraError: "ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตสิทธิ์การใช้งานกล้องในบราวเซอร์ของคุณ / Cannot open camera. Please allow camera permissions.",
    alertMrzNotFound: "ไม่พบข้อมูล MRZ หรือภาพถ่ายไม่ชัดเจน กรุณาปรับมุมถ่ายภาพให้ตรงตามคำแนะนำ หรือป้อนข้อมูลด้วยตนเอง / Could not detect MRZ or photo is blurry.",
    alertOcrError: "ระบบ OCR ไม่พร้อมใช้งานชั่วคราว กรุณาป้อนข้อมูลด้วยตนเอง / OCR Engine is temporarily unavailable. Please enter details manually.",
    signatureLabel: "ลายเซ็นลูกค้า / Customer Signature",
    clearBtn: "ล้างลายเซ็น",
    alertSignatureRequired: "กรุณาเซ็นชื่อของคุณก่อนส่งข้อมูล"
  }
};

const MOCK_FACE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23cbd5e1" stroke="%2394a3b8" stroke-width="2"/><circle cx="50" cy="40" r="20" fill="%23475569"/><path d="M20 80 C20 60, 80 60, 80 80 Z" fill="%23475569"/></svg>`;

const MOCK_OCR_PROFILES = [
  {
    label: "Somchai Saetang (Thailand 🇹🇭)",
    firstName: "Somchai",
    lastName: "Saetang",
    nationality: "Thai",
    docNumber: "TH9928345",
    dob: "1994-06-15",
    gender: "male",
    phone: "+66812345678",
    age: 32
  },
  {
    label: "John Doe (United States 🇺🇸)",
    firstName: "John",
    lastName: "Doe",
    nationality: "American",
    docNumber: "US5069281",
    dob: "1988-11-23",
    gender: "male",
    phone: "+15551234567",
    age: 38
  },
  {
    label: "Anna Schmidt (Germany 🇩🇪)",
    firstName: "Anna",
    lastName: "Schmidt",
    nationality: "German",
    docNumber: "DE4489201",
    dob: "1997-03-08",
    gender: "female",
    phone: "+491761234567",
    age: 29
  },
  {
    label: "Keo Manyvong (Laos 🇱🇦)",
    firstName: "Keo",
    lastName: "Manyvong",
    nationality: "Lao",
    docNumber: "LA123456",
    dob: "2000-09-12",
    gender: "female",
    phone: "+856205551234",
    age: 25
  }
];

const forceDigits = (str) => {
  return str
    .replace(/O/g, '0')
    .replace(/I/g, '1')
    .replace(/L/g, '1')
    .replace(/Z/g, '2')
    .replace(/B/g, '8')
    .replace(/S/g, '5')
    .replace(/G/g, '6')
    .replace(/T/g, '7')
    .replace(/[^0-9]/g, '0');
};

const forceLetters = (str) => {
  return str
    .replace(/0/g, 'O')
    .replace(/1/g, 'I')
    .replace(/2/g, 'Z')
    .replace(/8/g, 'B')
    .replace(/5/g, 'S')
    .replace(/[^A-Z<]/g, '<');
};

export function parseMRZ(text) {
  if (!text) return null;
  
  const lines = text.split('\n')
    .map(line => line.replace(/\s+/g, '').toUpperCase())
    .filter(line => line.length >= 25);
  
  console.log("MRZ Raw Lines:", lines);

  let mrzLines = lines.filter(l => l.includes('<') && l.length >= 35 && l.length <= 48);

  if (mrzLines.length < 2) {
    mrzLines = lines.filter(l => l.length >= 40 && l.length <= 46);
  }

  if (mrzLines.length < 2) {
    return null;
  }

  let line1 = mrzLines.find(l => l.startsWith('P') || l.includes('<<'));
  let line2 = mrzLines.find(l => l !== line1 && (/\d/.test(l) || l.includes('<')));

  if (!line1 || !line2) {
    line1 = mrzLines[0];
    line2 = mrzLines[1];
  }

  const cleanLine = (str) => {
    let clean = str.replace(/[^A-Z0-9<]/g, '<');
    if (clean.length < 44) {
      return clean.padEnd(44, '<');
    }
    return clean.slice(0, 44);
  };

  const l1 = cleanLine(line1);
  const l2 = cleanLine(line2);

  console.log("Standardized MRZ Line 1:", l1);
  console.log("Standardized MRZ Line 2:", l2);

  try {
    const nameStr = l1.slice(5);
    const nameParts = nameStr.split('<<');
    const lastName = nameParts[0] ? nameParts[0].replace(/</g, ' ').trim() : "";
    const firstName = nameParts[1] ? nameParts[1].split('<')[0].replace(/</g, ' ').trim() : "";

    const docNumber = l2.slice(0, 9).replace(/</g, '').trim();

    const rawNation = l2.slice(10, 13);
    const nationLetters = forceLetters(rawNation);
    const mapCountry = (code) => {
      const mapping = {
        'THA': 'Thai',
        'LAO': 'Lao',
        'USA': 'American',
        'GBR': 'British',
        'DEU': 'German',
        'FRA': 'French',
        'JPN': 'Japanese',
        'CHN': 'Chinese',
        'KOR': 'Korean',
        'VNM': 'Vietnamese',
        'KHM': 'Cambodian'
      };
      return mapping[code] || code;
    };
    const nationality = mapCountry(nationLetters);

    const rawDob = l2.slice(13, 19);
    const dobDigits = forceDigits(rawDob);
    let dob = "";
    let age = "";
    if (dobDigits.length === 6) {
      const yy = parseInt(dobDigits.slice(0, 2));
      const mm = dobDigits.slice(2, 4);
      const dd = dobDigits.slice(4, 6);
      const currentYear = new Date().getFullYear() % 100;
      const century = (yy > currentYear + 10) ? "19" : "20";
      dob = `${century}${dobDigits.slice(0, 2)}-${mm}-${dd}`;
      
      const birthDate = new Date(dob);
      if (!isNaN(birthDate.getTime())) {
        const ageDiff = Date.now() - birthDate.getTime();
        const ageDate = new Date(ageDiff);
        age = Math.abs(ageDate.getUTCFullYear() - 1970);
      }
    }

    const rawGender = l2.charAt(20);
    let gender = "other";
    if (rawGender === 'M' || rawGender === '1') gender = "male";
    else if (rawGender === 'F' || rawGender === '0') gender = "female";

    const rawExpiry = l2.slice(21, 27);
    const expiryDigits = forceDigits(rawExpiry);
    let expiry = "";
    if (expiryDigits.length === 6) {
      const mm = expiryDigits.slice(2, 4);
      const dd = expiryDigits.slice(4, 6);
      expiry = `20${expiryDigits.slice(0, 2)}-${mm}-${dd}`;
    }

    return {
      firstName,
      lastName,
      docNumber,
      nationality,
      dob,
      gender,
      age,
      expiry
    };
  } catch (err) {
    console.error("MRZ parsing failed:", err);
    return null;
  }
}

export default function SelfRegisterPortal() {
  const handleDobInputChange = (val) => {
    let clean = val.replace(/[^0-9]/g, "");
    if (clean.length > 8) clean = clean.slice(0, 8);
    
    let formatted = clean;
    if (clean.length > 2 && clean.length <= 4) {
      formatted = clean.slice(0, 2) + "/" + clean.slice(2);
    } else if (clean.length > 4) {
      formatted = clean.slice(0, 2) + "/" + clean.slice(2, 4) + "/" + clean.slice(4);
    }
    
    setPassenger(prev => {
      const updated = { ...prev, dobInput: formatted };
      if (clean.length === 8) {
        const dd = clean.slice(0, 2);
        const mm = clean.slice(2, 4);
        const yyyy = clean.slice(4, 8);
        
        const dateStr = `${yyyy}-${mm}-${dd}`;
        const testDate = new Date(dateStr);
        if (!isNaN(testDate.getTime()) && testDate.getFullYear() === parseInt(yyyy)) {
          updated.dob = dateStr;
          updated.age = calculateAge(dateStr);
        }
      }
      return updated;
    });
  };

  const handleDobSelectChange = (part, val) => {
    setPassenger(prev => {
      let currentDob = prev.dob || "";
      let parts = currentDob.split("-");
      if (parts.length !== 3) {
        parts = ["", "", ""];
      }
      
      if (part === "year") parts[0] = val;
      if (part === "month") parts[1] = val;
      if (part === "day") parts[2] = val;
      
      const newDob = parts.join("-");
      const updated = { ...prev };
      
      if (parts[0] && parts[1] && parts[2]) {
        updated.dob = newDob;
        updated.dobInput = `${parts[2]}/${parts[1]}/${parts[0]}`;
        updated.age = calculateAge(newDob);
      } else {
        updated.dob = newDob;
        const dStr = parts[2] || "__";
        const mStr = parts[1] || "__";
        const yStr = parts[0] || "____";
        updated.dobInput = `${dStr}/${mStr}/${yStr}`;
      }
      return updated;
    });
  };

  const handleOcrDobInputChange = (val) => {
    let clean = val.replace(/[^0-9]/g, "");
    if (clean.length > 8) clean = clean.slice(0, 8);
    
    let formatted = clean;
    if (clean.length > 2 && clean.length <= 4) {
      formatted = clean.slice(0, 2) + "/" + clean.slice(2);
    } else if (clean.length > 4) {
      formatted = clean.slice(0, 2) + "/" + clean.slice(2, 4) + "/" + clean.slice(4);
    }
    
    const updated = { ...ocrReviewData, dobInput: formatted };
    if (clean.length === 8) {
      const dd = clean.slice(0, 2);
      const mm = clean.slice(2, 4);
      const yyyy = clean.slice(4, 8);
      
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const testDate = new Date(dateStr);
      if (!isNaN(testDate.getTime()) && testDate.getFullYear() === parseInt(yyyy)) {
        updated.dob = dateStr;
        updated.age = calculateAge(dateStr);
      }
    }
    setOcrReviewData(updated);
  };

  const handleOcrDobSelectChange = (part, val) => {
    let currentDob = ocrReviewData.dob || "";
    let parts = currentDob.split("-");
    if (parts.length !== 3) {
      parts = ["", "", ""];
    }
    
    if (part === "year") parts[0] = val;
    if (part === "month") parts[1] = val;
    if (part === "day") parts[2] = val;
    
    const newDob = parts.join("-");
    const updated = { ...ocrReviewData };
    
    if (parts[0] && parts[1] && parts[2]) {
      updated.dob = newDob;
      updated.dobInput = `${parts[2]}/${parts[1]}/${parts[0]}`;
      updated.age = calculateAge(newDob);
    } else {
      updated.dob = newDob;
      const dStr = parts[2] || "__";
      const mStr = parts[1] || "__";
      const yStr = parts[0] || "____";
      updated.dobInput = `${dStr}/${mStr}/${yStr}`;
    }
    setOcrReviewData(updated);
  };

  const [lang, setLang] = useState("la"); // default to Lao
  const [db, setDb] = useState(getDb());
  
  // URL parameter parsing
  const params = new URLSearchParams(window.location.search);
  const initialGroupId = params.get("groupId") || "";
  const urlPaxCount = parseInt(params.get("pax")) || 0;
  const urlBookingId = params.get("bookingId") || params.get("bid") || "";

  // State controls
  const [groupIdInput, setGroupIdInput] = useState(initialGroupId);
  const [activeGroupId, setActiveGroupId] = useState(initialGroupId);
  const [booking, setBooking] = useState(null);
  const isTripDeparted = booking && (booking.status === "ออกเรือแล้ว" || booking.status === "เสร็จสิ้น");
  const [lookupError, setLookupError] = useState(false);
  const [hasAcceptedWaiver, setHasAcceptedWaiver] = useState(false);
  const [passenger, setPassenger] = useState({
    firstName: "",
    lastName: "",
    docNumber: "",
    nationality: "",
    gender: "",
    dob: "",
    dobInput: "",
    docExpiry: "",
    phone: "",
    age: "",
    emergencyName: "",
    emergencyRelation: "",
    emergencyPhone: "",
    facePhoto: ""
  });
  const [regSuccess, setRegSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Scanner Modal state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerPaxIndex, setScannerPaxIndex] = useState(0);
  const [scannerType, setScannerType] = useState("passport"); // "passport" or "idcard"
  const [scannerStep, setScannerStep] = useState("doc"); // "doc" | "ocr_processing" | "ocr_review" | "face"
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedDocPhoto, setCapturedDocPhoto] = useState("");
  const [ocrStatus, setOcrStatus] = useState(""); // "", "success", "fail"
  const [ocrReviewData, setOcrReviewData] = useState({
    firstName: "",
    lastName: "",
    docNumber: "",
    nationality: "",
    dob: "",
    docExpiry: "",
    gender: "",
    phone: "",
    age: ""
  });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const t = TRANSLATIONS[lang];

  // Signature canvas states & handlers
  const sigCanvasRef = useRef(null);
  const [isSigned, setIsSigned] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  const getCoordinates = (e) => {
    if (!sigCanvasRef.current) return { x: 0, y: 0 };
    const canvas = sigCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    // Scale coordinate points based on actual rendering dimensions vs internal canvas resolution
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing || !sigCanvasRef.current) return;
    e.preventDefault();
    const coords = getCoordinates(e);
    const canvas = sigCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.lineTo(coords.x, coords.y);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    setIsSigned(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsSigned(false);
  };

  // Listen for database updates in real-time
  useEffect(() => {
    const handleDbUpdate = () => {
      setDb(getDb());
    };
    window.addEventListener("db-update", handleDbUpdate);
    return () => window.removeEventListener("db-update", handleDbUpdate);
  }, []);

  // Auto-save draft effect removed in single passenger registration mode

  // Lookup booking: Firebase first (works on Vercel), then local server, then URL fallback
  useEffect(() => {
    if (!activeGroupId) {
      setBooking(null);
      setLookupError(false);
      return;
    }

    let isMounted = true;
    
    const lookupBooking = async (attempt = 1) => {
      if (attempt === 1) {
        setIsLoading(true);
        setLookupError(false);
      }

      const cleanCode = activeGroupId.trim().toUpperCase();
      let foundBooking = null;

      // STRATEGY 1: Try Firebase Cloud first (primary for Vercel)
      if (!foundBooking && isFirebaseConfigured()) {
        foundBooking = await getBookingFromFirebase(cleanCode);
        if (foundBooking) {
          console.log("[Firebase] Booking found in cloud:", foundBooking.groupId);
        }
      }

      // STRATEGY 2: Try local server /api/db (works on localhost)
      if (!foundBooking) {
        try {
          const response = await fetch("/api/db?t=" + Date.now(), {
            headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" }
          });
          if (response.ok && isMounted) {
            const data = await response.json();
            if (data && data.bookings) {
              localStorage.setItem("pos_boat_db", JSON.stringify(data));
              window.dispatchEvent(new Event("db-update"));
              foundBooking = (data.bookings || []).find(
                b => b.groupId === cleanCode && b.status !== "ยกเลิก"
              );
            }
          }
        } catch (err) {
          console.warn("Direct DB sync failed (expected on Vercel production):", err);
        }
      }

      // STRATEGY 3: Try local localStorage
      if (!foundBooking) {
        const currentDb = getDb();
        foundBooking = (currentDb.bookings || []).find(
          b => b.groupId === cleanCode && b.status !== "ยกเลิก"
        );
      }

      if (!isMounted) return;

      // FALLBACK: If no booking found and we have paxCount from URL, create a virtual booking
      if (!foundBooking && urlPaxCount > 0) {
        foundBooking = {
          id: urlBookingId || ("VIRTUAL-" + cleanCode),
          groupId: cleanCode,
          paxCount: urlPaxCount,
          partnerId: params.get("partnerId") || "",
          status: "กำลังกรอกข้อมูล",
          passengers: [],
          isVirtual: true
        };
      }

      if (foundBooking) {
        if (foundBooking.status === "รอลูกค้ากรอกข้อมูล" || foundBooking.status === "ยังไม่กรอกข้อมูล") {
          foundBooking.status = "กำลังกรอกข้อมูล";
          if (!foundBooking.isVirtual) {
            const currentDb = getDb();
            currentDb.bookings = currentDb.bookings.map(b =>
              b.id === foundBooking.id ? { ...b, status: "กำลังกรอกข้อมูล" } : b
            );
            saveDb(currentDb);
            setDb(currentDb);
          }
        }

        if (isMounted) {
          setBooking(foundBooking);
          setLookupError(false);
          setIsLoading(false);
          
          // Reset passenger state when a new booking is loaded
          setPassenger({
            firstName: "",
            lastName: "",
            docNumber: "",
            nationality: "",
            gender: "",
            dob: "",
            dobInput: "",
            docExpiry: "",
            phone: "",
            age: "",
            emergencyName: "",
            emergencyRelation: "",
            emergencyPhone: "",
            facePhoto: ""
          });
      }
    } else {
        if (attempt < 3) {
          setTimeout(() => {
            if (isMounted) lookupBooking(attempt + 1);
          }, 1500);
        } else {
          if (isMounted) {
            setBooking(null);
            setLookupError(true);
            setIsLoading(false);
          }
        }
      }
    };

    lookupBooking();

    return () => {
      isMounted = false;
    };
  }, [activeGroupId]);

  const handleSearchCode = (e) => {
    e.preventDefault();
    setActiveGroupId(groupIdInput.trim().toUpperCase());
  };

  const handlePassengerFieldChange = (field, value) => {
    setPassenger(prev => ({ ...prev, [field]: value }));
  };

  // Scanner controls
  const openScanner = (idx, type) => {
    setScannerPaxIndex(idx);
    setScannerType(type);
    setScannerStep("doc");
    setCapturedDocPhoto("");
    setOcrReviewData({
      firstName: "",
      lastName: "",
      docNumber: "",
      nationality: "",
      dob: "",
      docExpiry: "",
      gender: "male",
      phone: "",
      age: ""
    });
    setIsScannerOpen(true);
    setTimeout(() => {
      startCamera(false); // environment camera
    }, 150);
  };

  const startCamera = async (isSelfie = false) => {
    stopCamera();
    try {
      const constraints = {
        video: {
          facingMode: isSelfie ? "user" : "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };
      
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstErr) {
        console.warn("First camera constraint failed, trying basic video fallback...", firstErr);
        // Fallback to basic video constraint if ideal resolution/facingMode fails
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: isSelfie ? "user" : "environment" }, 
          audio: false 
        });
      }
      
      setCameraStream(stream);
      // Wait a microtask to ensure videoRef is bound
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(err => console.warn("Video play failed:", err));
        }
      }, 50);
    } catch (err) {
      console.error("SelfRegisterPortal: Camera capture failed completely:", err);
      // Alert only if it fails completely, but still set stream to null so placeholder runs
      alert(t.alertCameraError);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      try {
        cameraStream.getTracks().forEach(track => track.stop());
      } catch (e) {}
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleOcrSimulation = (profileIndex) => {
    const profile = MOCK_OCR_PROFILES[profileIndex];
    if (!profile) return;

    setOcrReviewData({
      firstName: profile.firstName,
      lastName: profile.lastName,
      docNumber: profile.docNumber,
      nationality: profile.nationality,
      dob: profile.dob,
      gender: profile.gender,
      phone: profile.phone,
      age: profile.age
    });
  };

  const handleCaptureDocPhoto = async () => {
    let capturedImg = "";

    if (videoRef.current && canvasRef.current) {
      try {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        
        // Use a much smaller resolution to prevent Out Of Memory (OOM) crashes on mobile devices!
        let width = video.videoWidth || 1280;
        let height = video.videoHeight || 720;
        
        // Scale down to max 640px width/height to drastically save RAM!
        const maxDim = 640;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.floor((height / width) * maxDim);
            width = maxDim;
          } else {
            width = Math.floor((width / height) * maxDim);
            height = maxDim;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, width, height);
        // Use very low quality jpeg just for UI preview
        capturedImg = canvas.toDataURL("image/jpeg", 0.4);
      } catch (err) {
        console.warn("SelfRegisterPortal: Document canvas capture failed:", err);
      }
    }

    if (!capturedImg) {
      capturedImg = MOCK_FACE_SVG;
    }

    setCapturedDocPhoto(capturedImg);
    stopCamera(); // Stop camera stream while showing OCR processing and review screen
    
    // Switch to processing animation step
    setScannerStep("ocr_processing");
    
    try {
      // Import tesseract.js dynamically to speed up initial bundle load
      const Tesseract = (await import("tesseract.js")).default;
      
      // Perform OCR by passing the canvas element directly to avoid base64 memory spike!
      const imageToOcr = canvasRef.current || capturedImg;
      const result = await Tesseract.recognize(imageToOcr, "eng");
      const text = result?.data?.text || "";
      console.log("OCR Extracted text:", text);
      
      // Parse MRZ lines
      const parsedData = parseMRZ(text);
      
      if (parsedData) {
        setOcrStatus("success");
        setOcrReviewData({
          firstName: parsedData.firstName,
          lastName: parsedData.lastName,
          docNumber: parsedData.docNumber,
          nationality: parsedData.nationality,
          dob: parsedData.dob,
          docExpiry: parsedData.expiry || "",
          gender: parsedData.gender,
          phone: "",
          age: parsedData.age || ""
        });
      } else {
        // OCR succeeded but couldn't locate MRZ lines (blurry/incorrect crop)
        console.warn("MRZ lines not found in OCR text");
        setOcrStatus("fail");
        alert(t.alertMrzNotFound);
        setOcrReviewData({
          firstName: "",
          lastName: "",
          docNumber: "",
          nationality: "",
          dob: "",
          docExpiry: "",
          gender: "male",
          phone: "",
          age: ""
        });
      }
    } catch (err) {
      console.error("OCR execution error:", err);
      setOcrStatus("fail");
      alert(t.alertOcrError);
      setOcrReviewData({
        firstName: "",
        lastName: "",
        docNumber: "",
        nationality: "",
        dob: "",
        docExpiry: "",
        gender: "male",
        phone: "",
        age: ""
      });
    } finally {
      setScannerStep("ocr_review");
    }
  };

  const handleConfirmOcrDetails = () => {
    // Save reviewed fields to the passenger state
    setPassenger(prev => ({
      ...prev,
      firstName: ocrReviewData.firstName,
      lastName: ocrReviewData.lastName,
      docNumber: "",
      nationality: ocrReviewData.nationality,
      dob: ocrReviewData.dob,
      dobInput: ocrReviewData.dobInput || (ocrReviewData.dob ? `${ocrReviewData.dob.split("-")[2]}/${ocrReviewData.dob.split("-")[1]}/${ocrReviewData.dob.split("-")[0]}` : ""),
      docExpiry: "",
      gender: ocrReviewData.gender,
      phone: ocrReviewData.phone,
      age: ocrReviewData.age
    }));
    
    // Switch to face selfie capture step
    setScannerStep("face");
    setTimeout(() => {
      startCamera(true); // User-facing camera (front camera)
    }, 150);
  };

  const handleCaptureFace = () => {
    let capturedImg = MOCK_FACE_SVG;

    if (videoRef.current && canvasRef.current) {
      try {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        
        // Capture a square face thumbnail
        const size = Math.min(video.videoWidth || 480, video.videoHeight || 480);
        canvas.width = 300;
        canvas.height = 300;
        const ctx = canvas.getContext("2d");
        
        const sx = ((video.videoWidth || 480) - size) / 2;
        const sy = ((video.videoHeight || 480) - size) / 2;
        ctx.drawImage(video, sx, sy, size, size, 0, 0, 300, 300);

        capturedImg = canvas.toDataURL("image/jpeg", 0.85);
      } catch (err) {
        console.warn("SelfRegisterPortal: Face canvas capture failed, using fallback silhouette:", err);
      }
    }

    setPassenger(prev => ({
      ...prev,
      facePhoto: capturedImg
    }));

    stopCamera();
    setIsScannerOpen(false);
  };

  const closeScanner = () => {
    stopCamera();
    setIsScannerOpen(false);
  };

  const handleFileUploadDoc = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target.result;
      setCapturedDocPhoto(dataUrl);
      stopCamera();
      setScannerStep("ocr_processing");
      
      try {
        const Tesseract = (await import("tesseract.js")).default;
        const result = await Tesseract.recognize(dataUrl, "eng");
        const text = result?.data?.text || "";
        console.log("OCR Extracted text (Uploaded File):", text);
        
        const parsedData = parseMRZ(text);
        if (parsedData) {
          setOcrStatus("success");
          setOcrReviewData({
            firstName: parsedData.firstName,
            lastName: parsedData.lastName,
            docNumber: parsedData.docNumber,
            nationality: parsedData.nationality,
            dob: parsedData.dob,
            docExpiry: parsedData.expiry || "",
            gender: parsedData.gender,
            phone: "",
            age: parsedData.age || ""
          });
        } else {
          console.warn("MRZ not found in uploaded file OCR");
          setOcrStatus("fail");
          alert(t.alertMrzNotFound || "MRZ not detected. Please check or enter details manually.");
          setOcrReviewData({
            firstName: "",
            lastName: "",
            docNumber: "",
            nationality: "",
            dob: "",
            docExpiry: "",
            gender: "male",
            phone: "",
            age: ""
          });
        }
      } catch (err) {
        console.error("OCR upload error:", err);
        setOcrStatus("fail");
        alert(t.alertOcrError || "OCR Error. Please enter details manually.");
        setOcrReviewData({
          firstName: "",
          lastName: "",
          docNumber: "",
          nationality: "",
          dob: "",
          docExpiry: "",
          gender: "male",
          phone: "",
          age: ""
        });
      } finally {
        setScannerStep("ocr_review");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileUploadFace = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      
      setPassenger(prev => ({
        ...prev,
        facePhoto: dataUrl
      }));
      
      stopCamera();
      setIsScannerOpen(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitRegistration = async (e) => {
    e.preventDefault();

    // Validate signature is present
    if (!isSigned) {
      alert(t.alertSignatureRequired);
      return;
    }

    // Validate: Single passenger details
    const p = passenger;
    if (!p.firstName?.trim() || !p.lastName?.trim() || !p.nationality?.trim() || !p.gender || !p.phone?.trim() || !p.dob || !p.emergencyName?.trim() || !p.emergencyRelation?.trim() || !p.emergencyPhone?.trim()) {
      alert(t.alertMissing);
      return;
    }

    if (!navigator.onLine) {
      alert("ไม่สามารถเชื่อมต่ออินเทอร์เน็ตได้ กรุณาตรวจสอบสัญญาณเน็ตของคุณ / No internet connection. Please check your network.");
      return;
    }

    setIsLoading(true);

    try {
      // Capture signature data url
      let signatureBase64 = "";
      if (sigCanvasRef.current) {
        signatureBase64 = sigCanvasRef.current.toDataURL("image/png");
      }

      const newPassenger = {
        ...passenger,
        name: `${p.firstName} ${p.lastName}`.trim(),
        registeredAt: new Date().toISOString(),
        signature: signatureBase64
      };

      if (!isFirebaseConfigured()) {
        throw new Error("ระบบเซิร์ฟเวอร์ยังไม่ได้เชื่อมต่อ (Firebase Not Configured) กรุณาติดต่อพนักงาน");
      }

      // Add to Firebase directly
      const success = await addPassengerToFirebaseBooking(booking.id, newPassenger);
      if (!success) {
        throw new Error("บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      }
      
      console.log("Registered via pure Firebase:", success);

      // Check if pax is fulfilled and transition status
      const updatedPassengersCount = (booking.passengers?.length || 0) + 1;
      if (updatedPassengersCount >= booking.paxCount && booking.status === "registering") {
        await updateBookingInFirebase(booking.id, { status: "ready_to_checkout" });
        console.log("Pax full, auto-transitioned to ready_to_checkout");
      }

      setRegSuccess(true);
    } catch (err) {
      console.error("Error during registration submit:", err);
      alert(`การลงทะเบียนล้มเหลว: ${err.message}\nกรุณาตรวจสอบอินเทอร์เน็ตหรือติดต่อพนักงานแคชเชียร์`);
    } finally {
      setIsLoading(false);
    }
  };

  // Success view
  if (regSuccess) {
    return (
      <div style={containerStyle}>
        <div style={successCardStyle}>
          {db.settings.logo && (
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <img src={db.settings.logo} alt="Logo" style={{ maxHeight: "50px", maxWidth: "120px", objectFit: "contain" }} />
            </div>
          )}
          <div style={successIconWrapperStyle}>
            <CheckCircle2 size={48} color="#047857" />
          </div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#0f172a", margin: "1rem 0" }}>
            {t.successTitle}
          </h2>
          <p style={{ fontSize: "0.95rem", color: "#475569", lineHeight: "1.6", marginBottom: "1.5rem" }}>
            {t.successSub}
          </p>
          <div style={badgeContainerStyle}>
            <div>{t.groupCode} <strong>{activeGroupId.toUpperCase()}</strong></div>
            <div style={{ marginTop: "4px" }}>{t.paxCount} <strong>{booking?.paxCount} pax</strong></div>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: "100%", padding: "12px", marginTop: "1rem", borderRadius: "10px", background: "#0f766e", border: "none", color: "#ffffff", fontWeight: "bold", cursor: "pointer" }}
            onClick={() => {
              setRegSuccess(false);
              setHasAcceptedWaiver(false);
              setBooking(null);
              setActiveGroupId("");
              setGroupIdInput("");
            }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Debug Panel (Temporary) */}
      <div style={{ background: "#000", color: "#0f0", padding: "10px", margin: "10px 0", borderRadius: "8px", fontFamily: "monospace", fontSize: "12px", textAlign: "left", whiteSpace: "pre-wrap" }}>
        <strong>DEBUG PANEL</strong><br/>
        Firebase connected: {isFirebaseConfigured() ? "true" : "false"}<br/>
        bookingId: {booking?.id || "N/A"}<br/>
        groupId: {booking?.groupId || activeGroupId || "N/A"}<br/>
        pax: {booking?.paxCount || "N/A"}<br/>
        registeredCount: {booking?.registeredCount || 0}<br/>
        status: {booking?.status || "N/A"}<br/>
        paymentStatus: {booking?.paymentStatus || "N/A"}<br/>
        last error: {lookupError ? "lookup failed" : "None"}<br/>
      </div>

      {/* Language Switcher */}
      <div style={langBarContainerStyle}>
        <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "700" }}>LANG</span>
        <div style={{ display: "flex", gap: "6px" }}>
          <button onClick={() => setLang("la")} style={langBtnStyle(lang === "la")}>🇱🇦 ລາວ</button>
          <button onClick={() => setLang("en")} style={langBtnStyle(lang === "en")}>🇬🇧 EN</button>
          <button onClick={() => setLang("th")} style={langBtnStyle(lang === "th")}>🇹🇭 ไทย</button>
        </div>
      </div>


      {/* Main Registration Card */}
      <div style={cardStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", marginBottom: "0.5rem" }}>
            {db.settings.logo ? (
              <img src={db.settings.logo} alt="Logo" style={{ maxHeight: "35px", maxWidth: "80px", objectFit: "contain" }} />
            ) : (
              <Ship size={28} color="#0f766e" />
            )}
            <h1 style={{ fontSize: "1.5rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>
              {lang === "en" ? "TADFANE RAFTING" : lang === "th" ? "ตาดฟาน ล่องแก่ง" : "ຕາດຟານ ລ່ອງແກ່ງ"}
            </h1>

          </div>
          <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>
            {t.welcome} - {t.title}
          </p>
        </div>

        {/* Step 1: Search / Lookup Registration Code if booking is not loaded */}
        {!booking ? (
          isLoading ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
              <div style={{
                width: "40px",
                height: "40px",
                border: "4px solid rgba(15, 118, 110, 0.1)",
                borderTop: "4px solid #0f766e",
                borderRadius: "50%",
                margin: "0 auto 1.25rem auto",
                animation: "spin 1s linear infinite"
              }}></div>
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
              <div style={{ fontSize: "0.9rem", color: "#475569", fontWeight: "700" }}>
                {lang === "la" && "ກຳລັງກວດສອບ ແລະ ຊິ້ງຂໍ້ມູນ... / Connecting..."}
                {lang === "en" && "Searching and syncing details... / Connecting..."}
                {lang === "th" && "กำลังตรวจสอบและซิงค์ข้อมูล... / Connecting..."}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSearchCode} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ textAlign: "center", padding: "1rem 0" }}>
                <AlertTriangle size={32} color="#b45309" style={{ margin: "0 auto 0.75rem auto" }} />
                <div style={{ fontSize: "0.9rem", color: "#475569", fontWeight: "600", marginBottom: "0.5rem" }}>
                  {t.enterCode}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    className="form-control"
                    style={{ flex: 1, textTransform: "uppercase", textAlign: "center", fontWeight: "800", height: "42px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontSize: "16px" }}
                    value={groupIdInput}
                    onChange={(e) => setGroupIdInput(e.target.value)}
                    placeholder="e.g. REG-3244"
                    required
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ padding: "0 16px", borderRadius: "8px", background: "#0f766e", border: "none", color: "#fff", fontWeight: "bold", cursor: "pointer" }}
                  >
                    {t.search}
                  </button>
                </div>
                {lookupError && (
                  <div style={{ color: "#be123c", fontSize: "0.8rem", marginTop: "8px", fontWeight: "600" }}>
                    {t.invalidCode}
                  </div>
                )}
              </div>
            </form>
          )
        ) : (
          /* Booking Found! Proceed to Registration Flow */
          <div>
            {/* Group details header with registration progress */}
            <div style={{ background: "#f1f5f9", padding: "12px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", marginBottom: "1.25rem", fontSize: "0.85rem", color: "#475569" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span>{t.groupCode} <strong>{activeGroupId.toUpperCase()}</strong></span>
                <span>{t.paxCount} <strong>{booking.paxCount} Pax</strong></span>
              </div>
              <div style={{ borderTop: "1px solid #cbd5e1", paddingTop: "6px", display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: "bold" }}>
                <span style={{ color: "#0f766e" }}>
                  {lang === "en" && "Registration Progress:"}
                  {lang === "la" && "ຄວາມຄືບໜ້າການລົງທະບຽນ:"}
                  {lang === "th" && "ความคืบหน้าการลงทะเบียน:"}
                </span>
                <span style={{ color: "#0f766e" }}>
                  {(booking.passengers || []).length} / {booking.paxCount} {lang === "en" ? "Registered" : lang === "la" ? "ຄົນ" : "คน"}
                </span>
              </div>
            </div>

            {isTripDeparted ? (
              <div style={{
                padding: "2.5rem 1.5rem",
                textAlign: "center",
                background: "#fef2f2",
                borderRadius: "14px",
                border: "2px solid #fee2e2",
                color: "#be123c",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
              }}>
                <AlertTriangle size={48} color="#be123c" />
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "800" }}>
                  {lang === "en" ? "Registration Locked" : lang === "la" ? "ປິດການລົງທະບຽນ" : "ปิดการลงทะเบียน"}
                </h3>
                <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: "1.5", fontWeight: "600" }}>
                  {lang === "en" 
                    ? "This trip has already departed or completed. Customer self-registration is closed." 
                    : lang === "la" 
                    ? "ທ່ຽວນີ້ໄດ້ອອກເດີນທາງ ຫຼື ສຳເລັດແລ້ວ. ປິດການລົງທະບຽນລູກຄ້າໃໝ່." 
                    : "เที่ยวนี้ได้ออกเดินทางหรือเสร็จสิ้นแล้ว ระบบปิดการลงทะเบียนลูกค้าใหม่"}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setHasAcceptedWaiver(false);
                    setBooking(null);
                    setActiveGroupId("");
                    setGroupIdInput("");
                  }}
                  style={{
                    marginTop: "12px",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    background: "#be123c",
                    border: "none",
                    color: "#ffffff",
                    fontWeight: "bold",
                    cursor: "pointer"
                  }}
                >
                  {lang === "en" ? "Back" : lang === "la" ? "ກັບຄືນ" : "ย้อนกลับ"}
                </button>
              </div>
            ) : (
              <>

            {/* Step 3: Waiver Agreement Conditions */}
            <div style={{ border: "1px solid #cbd5e1", borderRadius: "14px", padding: "16px", background: "#ffffff", marginBottom: "1.25rem", boxShadow: "0 2px 5px rgba(0,0,0,0.02)" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: "800", color: "#0f766e", display: "flex", alignItems: "center", gap: "6px", margin: "0 0 12px 0", borderBottom: "2px solid #0f766e", paddingBottom: "6px" }}>
                <ShieldCheck size={20} />
                {t.termsTitle}
              </h3>
              
              {/* Terms list */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.8rem", color: "#334155", lineHeight: "1.5", marginBottom: "1.25rem", textAlign: "justify" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                  <span style={{ color: "#0f766e", fontWeight: "bold" }}>1.</span>
                  <span>{t.termsText1}</span>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                  <span style={{ color: "#0f766e", fontWeight: "bold" }}>2.</span>
                  <span>{t.termsText2}</span>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                  <span style={{ color: "#0f766e", fontWeight: "bold" }}>3.</span>
                  <span>{t.termsText3}</span>
                </div>
              </div>

              {/* Cancellation Policy */}
              <h3 style={{ fontSize: "0.85rem", fontWeight: "800", color: "#be123c", display: "flex", alignItems: "center", gap: "6px", margin: "0 0 10px 0", borderBottom: "1.5px solid #be123c", paddingBottom: "4px" }}>
                ⚠️ {t.cancelPolicyTitle}
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.8rem", color: "#475569", lineHeight: "1.4", marginBottom: "1.25rem", textAlign: "left" }}>
                <div>{t.cancelText1}</div>
                <div>{t.cancelText2}</div>
                <div>{t.cancelText3}</div>
              </div>

              {/* Acceptance checkbox */}
              <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.85rem", fontWeight: "800", color: "#0f766e", cursor: "pointer", borderTop: "1px solid #e2e8f0", paddingTop: "12px", marginTop: "10px" }}>
                <input
                  type="checkbox"
                  id="accept-terms-checkbox"
                  disabled={(booking.passengers || []).length >= booking.paxCount}
                  checked={hasAcceptedWaiver}
                  onChange={(e) => setHasAcceptedWaiver(e.target.checked)}
                  style={{ width: "20px", height: "20px", accentColor: "#0f766e", cursor: "pointer" }}
                />
                <span>{t.acceptCheckbox}</span>
              </label>
            </div>

            {/* Step 4: Single Passenger Form Input (Visible only when accepted terms) */}
            {!hasAcceptedWaiver ? (
              <div style={{ padding: "2rem 1rem", textAlign: "center", background: "#f8fafc", borderRadius: "12px", border: "2px dashed #cbd5e1", color: "#64748b", fontSize: "0.85rem", fontWeight: "600" }}>
                🔒 {lang === "la" && "ກະລຸນາຍອມຮັບເງື່ອນໄຂການໃຊ້ບໍລິການເພື່ອປົດລັອກການກອກຂໍ້ມູນ"}
                {lang === "en" && "Please accept the safety terms above to unlock details form."}
                {lang === "th" && "กรุณายอมรับเงื่อนไขการใช้บริการเพื่อปลดล็อกการกรอกข้อมูล"}
              </div>
            ) : (() => {
              const isGroupFull = (booking.passengers || []).length >= booking.paxCount;
              return (
                <form 
                  onSubmit={handleSubmitRegistration} 
                  style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    gap: "1.25rem", 
                    touchAction: "manipulation", 
                    overflowX: "hidden" 
                  }}
                >
                  {isGroupFull && (
                    <div style={{
                      padding: "1rem",
                      background: "#fef2f2",
                      border: "1px solid #fee2e2",
                      borderRadius: "8px",
                      color: "#be123c",
                      fontWeight: "bold",
                      fontSize: "0.85rem",
                      textAlign: "center"
                    }}>
                      {lang === "en" 
                        ? `⚠️ This group registration is already full (${booking.paxCount} pax).`
                        : lang === "la" 
                        ? `⚠️ ກຸ່ມນີ້ໄດ້ລົງທະບຽນຄົບຈຳນວນແລ້ວ (${booking.paxCount} ຄົນ).`
                        : `⚠️ กลุ่มนี้ได้ลงทะเบียนครบจำนวนแล้ว (${booking.paxCount} คน)`}
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", paddingBottom: "1rem" }}>
                    <div
                      style={{
                        border: "1px solid #cbd5e1",
                        borderRadius: "12px",
                        padding: "16px",
                        background: "#ffffff",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                      }}
                    >
                      {/* Passenger Header + Scan Buttons */}
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px dashed #cbd5e1", paddingBottom: "10px" }}>
                        <div style={{ position: "relative" }}>
                          <img 
                            src={passenger.facePhoto || MOCK_FACE_SVG} 
                            alt="Face" 
                            style={{ width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover", border: "2px solid #0f766e", background: "#f1f5f9" }} 
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: "0.85rem", fontWeight: "800", color: "#0f766e" }}>
                            👤 {lang === "en" ? "Passenger Details" : lang === "la" ? "ຂໍ້ມູນຜູ້ໂດຍສານ" : "ข้อมูลผู้โดยสาร"}
                          </span>
                          <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
                            {passenger.firstName ? `${passenger.firstName} ${passenger.lastName}` : t.unscanned}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button 
                            type="button" 
                            disabled={isGroupFull}
                            className="btn btn-secondary" 
                            style={{ padding: "4px 8px", fontSize: "0.7rem", display: "flex", alignItems: "center", gap: "4px", height: "30px", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", background: "#f8fafc" }}
                            onClick={() => openScanner(0, "passport")}
                          >
                            📷 Passport
                          </button>
                          <button 
                            type="button" 
                            disabled={isGroupFull}
                            className="btn btn-secondary" 
                            style={{ padding: "4px 8px", fontSize: "0.7rem", display: "flex", alignItems: "center", gap: "4px", height: "30px", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", background: "#f8fafc" }}
                            onClick={() => openScanner(0, "idcard")}
                          >
                            📷 {t.idCard}
                          </button>
                        </div>
                      </div>

                      {/* Name fields */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <label style={{ fontSize: "0.75rem", fontWeight: "700", color: "#475569" }}>
                            {t.pFirstName} <span style={{ color: "#be123c" }}>*</span>
                          </label>
                          <input
                            type="text"
                            required
                            disabled={isGroupFull}
                            className="form-control"
                            style={{ height: "42px", borderRadius: "6px", border: "1px solid #cbd5e1", padding: "0 10px", fontSize: "16px", outline: "none" }}
                            placeholder={t.pFirstNamePlh}
                            value={passenger.firstName || ""}
                            onChange={(e) => handlePassengerFieldChange("firstName", e.target.value)}
                          />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <label style={{ fontSize: "0.75rem", fontWeight: "700", color: "#475569" }}>
                            {t.pLastName} <span style={{ color: "#be123c" }}>*</span>
                          </label>
                          <input
                            type="text"
                            required
                            disabled={isGroupFull}
                            className="form-control"
                            style={{ height: "42px", borderRadius: "6px", border: "1px solid #cbd5e1", padding: "0 10px", fontSize: "16px", outline: "none" }}
                            placeholder={t.pLastNamePlh}
                            value={passenger.lastName || ""}
                            onChange={(e) => handlePassengerFieldChange("lastName", e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Nationality */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <label style={{ fontSize: "0.75rem", fontWeight: "700", color: "#475569" }}>
                          {t.pNation} <span style={{ color: "#be123c" }}>*</span>
                        </label>
                        <input
                          type="text"
                          required
                          disabled={isGroupFull}
                          className="form-control"
                          style={{ height: "42px", borderRadius: "6px", border: "1px solid #cbd5e1", padding: "0 10px", fontSize: "16px", outline: "none" }}
                          placeholder={t.pNationPlh}
                          value={passenger.nationality || ""}
                          onChange={(e) => handlePassengerFieldChange("nationality", e.target.value)}
                        />
                      </div>

                      {/* Date of Birth & Gender */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <label style={{ fontSize: "0.75rem", fontWeight: "700", color: "#475569" }}>
                            {t.pDob} (DD/MM/YYYY) <span style={{ color: "#be123c" }}>*</span>
                          </label>
                          <input
                            type="text"
                            required
                            disabled={isGroupFull}
                            className="form-control"
                            style={{ height: "42px", borderRadius: "6px", border: "1px solid #cbd5e1", padding: "0 10px", fontSize: "16px", outline: "none" }}
                            placeholder="DD/MM/YYYY"
                            value={passenger.dobInput || getDobInputVal(passenger.dob)}
                            onChange={(e) => handleDobInputChange(e.target.value)}
                          />
                          
                          {/* Dropdowns selector helper */}
                          <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
                            <select
                              disabled={isGroupFull}
                              style={{ flex: 1, height: "30px", fontSize: "16px", borderRadius: "4px", border: "1px solid #cbd5e1", padding: 0 }}
                              value={passenger.dob ? passenger.dob.split("-")[2] : ""}
                              onChange={(e) => handleDobSelectChange("day", e.target.value)}
                            >
                              <option value="">{t.dayPlh}</option>
                              {Array.from({ length: 31 }, (_, i) => {
                                const d = String(i + 1).padStart(2, "0");
                                return <option key={d} value={d}>{d}</option>;
                              })}
                            </select>
                            
                            <select
                              disabled={isGroupFull}
                              style={{ flex: 1.2, height: "30px", fontSize: "16px", borderRadius: "4px", border: "1px solid #cbd5e1", padding: 0 }}
                              value={passenger.dob ? passenger.dob.split("-")[1] : ""}
                              onChange={(e) => handleDobSelectChange("month", e.target.value)}
                            >
                              <option value="">{t.monthPlh}</option>
                              {Array.from({ length: 12 }, (_, i) => {
                                const m = String(i + 1).padStart(2, "0");
                                return <option key={m} value={m}>{m}</option>;
                              })}
                            </select>
                            
                            <select
                              disabled={isGroupFull}
                              style={{ flex: 1.5, height: "30px", fontSize: "16px", borderRadius: "4px", border: "1px solid #cbd5e1", padding: 0 }}
                              value={passenger.dob ? passenger.dob.split("-")[0] : ""}
                              onChange={(e) => handleDobSelectChange("year", e.target.value)}
                            >
                              <option value="">{t.yearPlh}</option>
                              {Array.from({ length: 100 }, (_, i) => {
                                const y = String(new Date().getFullYear() - i);
                                return <option key={y} value={y}>{y}</option>;
                              })}
                            </select>
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <label style={{ fontSize: "0.75rem", fontWeight: "700", color: "#475569" }}>
                            {t.pGender} <span style={{ color: "#be123c" }}>*</span>
                          </label>
                          <select
                            required
                            disabled={isGroupFull}
                            style={{ height: "42px", borderRadius: "6px", border: "1px solid #cbd5e1", padding: "0 6px", fontSize: "16px", outline: "none", background: "#ffffff" }}
                            value={passenger.gender || ""}
                            onChange={(e) => handlePassengerFieldChange("gender", e.target.value)}
                          >
                            <option value="">-- {t.pGenderPlh} --</option>
                            <option value="male">{t.gMale}</option>
                            <option value="female">{t.gFemale}</option>
                            <option value="other">{t.gOther}</option>
                          </select>
                        </div>
                      </div>

                      {/* Phone & Age */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <label style={{ fontSize: "0.75rem", fontWeight: "700", color: "#475569" }}>
                            {t.pPhone} <span style={{ color: "#be123c" }}>*</span>
                          </label>
                          <input
                            type="text"
                            required
                            disabled={isGroupFull}
                            className="form-control"
                            style={{ height: "42px", borderRadius: "6px", border: "1px solid #cbd5e1", padding: "0 10px", fontSize: "16px", outline: "none" }}
                            placeholder={t.pPhonePlh}
                            value={passenger.phone || ""}
                            onChange={(e) => handlePassengerFieldChange("phone", e.target.value)}
                          />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <label style={{ fontSize: "0.75rem", fontWeight: "700", color: "#475569" }}>
                            {t.pAge} <span style={{ color: "#be123c" }}>*</span>
                          </label>
                          <input
                            type="number"
                            required
                            disabled={isGroupFull}
                            min="1"
                            max="120"
                            className="form-control"
                            style={{ height: "42px", borderRadius: "6px", border: "1px solid #cbd5e1", padding: "0 10px", fontSize: "16px", outline: "none" }}
                            placeholder="Age"
                            value={passenger.age || ""}
                            onChange={(e) => handlePassengerFieldChange("age", e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Emergency Contact Section */}
                      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr 1.2fr", gap: "10px", borderTop: "1px dashed #cbd5e1", paddingTop: "10px", marginTop: "4px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <label style={{ fontSize: "0.75rem", fontWeight: "700", color: "#475569" }}>
                            {t.pEmergencyName} <span style={{ color: "#be123c" }}>*</span>
                          </label>
                          <input
                            type="text"
                            required
                            disabled={isGroupFull}
                            className="form-control"
                            style={{ height: "42px", borderRadius: "6px", border: "1px solid #cbd5e1", padding: "0 10px", fontSize: "16px", outline: "none" }}
                            placeholder={t.pEmergencyNamePlh}
                            value={passenger.emergencyName || ""}
                            onChange={(e) => handlePassengerFieldChange("emergencyName", e.target.value)}
                          />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <label style={{ fontSize: "0.75rem", fontWeight: "700", color: "#475569" }}>
                            {t.pEmergencyRelation} <span style={{ color: "#be123c" }}>*</span>
                          </label>
                          <input
                            type="text"
                            required
                            disabled={isGroupFull}
                            className="form-control"
                            style={{ height: "42px", borderRadius: "6px", border: "1px solid #cbd5e1", padding: "0 10px", fontSize: "16px", outline: "none" }}
                            placeholder={t.pEmergencyRelationPlh}
                            value={passenger.emergencyRelation || ""}
                            onChange={(e) => handlePassengerFieldChange("emergencyRelation", e.target.value)}
                          />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <label style={{ fontSize: "0.75rem", fontWeight: "700", color: "#475569" }}>
                            {t.pEmergencyPhone} <span style={{ color: "#be123c" }}>*</span>
                          </label>
                          <input
                            type="text"
                            required
                            disabled={isGroupFull}
                            className="form-control"
                            style={{ height: "42px", borderRadius: "6px", border: "1px solid #cbd5e1", padding: "0 10px", fontSize: "16px", outline: "none" }}
                            placeholder={t.pEmergencyPhonePlh}
                            value={passenger.emergencyPhone || ""}
                            onChange={(e) => handlePassengerFieldChange("emergencyPhone", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Signature Section */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "15px", marginBottom: "15px" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "#334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>{t.signatureLabel} <span style={{ color: "#be123c" }}>*</span></span>
                      {isSigned && (
                        <button
                          type="button"
                          onClick={clearSignature}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#e11d48",
                            fontSize: "0.75rem",
                            fontWeight: "600",
                            cursor: "pointer",
                            padding: "0"
                          }}
                        >
                          🔄 {t.clearBtn}
                        </button>
                      )}
                    </label>
                    <div style={{ border: "2px dashed #cbd5e1", borderRadius: "8px", overflow: "hidden", background: "#f8fafc", position: "relative" }}>
                      <canvas
                        ref={sigCanvasRef}
                        width={500}
                        height={180}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        style={{
                          width: "100%",
                          height: "150px",
                          display: "block",
                          touchAction: "none"
                        }}
                      />
                    </div>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={isGroupFull}
                    className="btn btn-primary"
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "#0f766e", border: "none", color: "#fff", fontWeight: "bold", fontSize: "0.95rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "6px" }}
                  >
                    <CheckCircle2 size={16} />
                    <span>{t.submit}</span>
                  </button>
                </form>
              );
            })()}
            </>
            )}
          </div>
        )}
      </div>

      {/* DOCUMENT SCANNER & FACE PHOTO CAPTURE MODAL OVERLAY */}
      {isScannerOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(15, 23, 42, 0.85)",
          backdropFilter: "blur(6px)",
          zIndex: 99999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          boxSizing: "border-box"
        }}>
          <div style={{
            width: "100%",
            maxWidth: "420px",
            background: "#ffffff",
            borderRadius: "16px",
            padding: "1.25rem",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: "1rem"
          }}>
            {/* Close Button */}
            <button 
              onClick={closeScanner}
              style={{ position: "absolute", top: "12px", right: "12px", background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#64748b" }}
            >
              ✕
            </button>

            {/* OCR Status Banner */}
            {scannerStep === "ocr_review" && (
              <div style={{ 
                padding: "8px 12px", 
                borderRadius: "8px", 
                textAlign: "center", 
                fontWeight: "bold",
                fontSize: "0.85rem",
                background: ocrStatus === "success" ? "#ecfdf5" : "#fef2f2",
                color: ocrStatus === "success" ? "#065f46" : "#991b1b",
                border: ocrStatus === "success" ? "1px solid #a7f3d0" : "1px solid #fecaca",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px"
              }}>
                {ocrStatus === "success" ? t.ocrReadSuccess : t.ocrReadFail}
              </div>
            )}
            {/* Modal Title */}
            <div style={{ textAlign: "center", paddingRight: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>
                {scannerStep === "doc" && `📷 ${scannerType === "passport" ? t.scanTitleDocPassport : t.scanTitleDocId}`}
                {scannerStep === "ocr_processing" && "⚙️ Processing OCR..."}
                {scannerStep === "ocr_review" && `📋 ${t.ocrReviewTitle}`}
                {scannerStep === "face" && `📷 ${t.scanTitleFace}`}
              </h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: "#64748b" }}>
                {scannerStep === "doc" && t.scanDescDoc}
                {scannerStep === "ocr_processing" && t.scanDescProcessing}
                {scannerStep === "ocr_review" && t.ocrReviewSub}
                {scannerStep === "face" && t.scanDescFace}
              </p>
            </div>

            {/* Camera Viewport / OCR Review Area */}
            <div style={{
              position: "relative",
              width: "100%",
              height: scannerStep === "ocr_review" ? "auto" : "260px",
              background: "#0f172a",
              borderRadius: "12px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #cbd5e1"
            }}>
              {/* 1. Live video stream (only for doc and face steps) */}
              {(scannerStep === "doc" || scannerStep === "face") && (
                <>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    style={{ 
                      width: "100%", 
                      height: "100%", 
                      objectFit: "cover",
                      display: cameraStream ? "block" : "none"
                    }} 
                  />
                  
                  {!cameraStream && (
                    /* Animated Camera Loader/Fallback if camera not open yet */
                    <div style={{ textAlign: "center", color: "#94a3b8", display: "flex", flexDirection: "column", gap: "10px", padding: "1.5rem" }}>
                      <div style={{
                        width: "30px",
                        height: "30px",
                        border: "3px solid rgba(255, 255, 255, 0.2)",
                        borderTop: "3px solid #10b981",
                        borderRadius: "50%",
                        margin: "0 auto",
                        animation: "spin 1s linear infinite"
                      }} />
                      <span style={{ fontSize: "0.8rem", fontWeight: "600" }}>
                        {t.cameraAccessing}
                      </span>
                    </div>
                  )}

                  {/* Viewport HUD Overlays */}
                  {scannerStep === "doc" && cameraStream && (
                    /* Document bounding box frame */
                    <div style={{
                      position: "absolute",
                      width: "80%",
                      height: "55%",
                      border: "2px dashed #10b981",
                      borderRadius: "8px",
                      boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.45)",
                      pointerEvents: "none"
                    }}>
                      <div style={{ position: "absolute", bottom: "-20px", width: "100%", textAlign: "center", color: "#10b981", fontSize: "0.65rem", fontWeight: "bold" }}>
                        ALIGN DOCUMENT HERE
                      </div>
                    </div>
                  )}

                  {scannerStep === "face" && cameraStream && (
                    /* Face guide oval overlay */
                    <div style={{
                      position: "absolute",
                      width: "160px",
                      height: "200px",
                      border: "2px dashed #0ea5e9",
                      borderRadius: "50%",
                      boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.45)",
                      pointerEvents: "none"
                    }}>
                      <div style={{ position: "absolute", bottom: "-20px", width: "100%", textAlign: "center", color: "#0ea5e9", fontSize: "0.65rem", fontWeight: "bold" }}>
                        FIT FACE IN OVAL
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* 2. Processing Screen */}
              {scannerStep === "ocr_processing" && (
                <div style={{ position: "relative", width: "100%", height: "260px", overflow: "hidden", display: "flex", alignItems: "center", justifyCenter: "center", justifyContent: "center" }}>
                  <img 
                    src={capturedDocPhoto} 
                    alt="Captured Doc" 
                    style={{ width: "100%", height: "100%", objectFit: "contain", opacity: 0.6 }} 
                  />
                  {/* Laser line */}
                  <div style={{
                    position: "absolute",
                    left: 0,
                    width: "100%",
                    height: "3px",
                    background: "#10b981",
                    boxShadow: "0 0 10px 3px #10b981",
                    animation: "scanLine 1.5s ease-in-out infinite"
                  }} />
                  <style>{`
                    @keyframes scanLine {
                      0% { top: 5%; }
                      50% { top: 95%; }
                      100% { top: 5%; }
                    }
                  `}</style>
                  {/* Loading spinner */}
                  <div style={{
                    position: "absolute",
                    bottom: "20px",
                    background: "rgba(15, 23, 42, 0.85)",
                    padding: "8px 16px",
                    borderRadius: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    border: "1px solid #10b981"
                  }}>
                    <div style={{
                      width: "14px",
                      height: "14px",
                      border: "2px solid rgba(16, 185, 129, 0.2)",
                      borderTop: "2px solid #10b981",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite"
                    }} />
                    <span style={{ fontSize: "0.75rem", color: "#ffffff", fontWeight: "bold" }}>
                      {t.ocrProcessing}
                    </span>
                  </div>
                </div>
              )}

              {/* 3. Review Screen */}
              {scannerStep === "ocr_review" && (
                <div style={{ width: "100%", background: "#ffffff", padding: "12px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "12px" }}>
                  {/* Document Thumbnail Preview */}
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", background: "#f8fafc", padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                    <img 
                      src={capturedDocPhoto} 
                      alt="Captured doc" 
                      style={{ width: "60px", height: "45px", objectFit: "cover", borderRadius: "4px", border: "1px solid #94a3b8" }} 
                    />
                    <div>
                      <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "#0f766e", textAlign: "left" }}>
                        📸 Document Photo Captured
                      </div>
                      <div style={{ fontSize: "0.65rem", color: "#64748b", textAlign: "left" }}>
                        OCR system auto-filled fields below. Please check.
                      </div>
                    </div>
                  </div>

                  {/* Form Fields Grid */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "200px", overflowY: "auto", textAlign: "left" }}>
                    {/* First/Last Name */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                        <label style={{ fontSize: "0.7rem", fontWeight: "700", color: "#475569" }}>{t.pFirstName}</label>
                        <input 
                          type="text" 
                          value={ocrReviewData.firstName} 
                          onChange={(e) => setOcrReviewData({...ocrReviewData, firstName: e.target.value})}
                          style={{ height: "32px", borderRadius: "6px", border: "1px solid #cbd5e1", padding: "0 8px", fontSize: "0.8rem", outline: "none", color: "#334155" }}
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                        <label style={{ fontSize: "0.7rem", fontWeight: "700", color: "#475569" }}>{t.pLastName}</label>
                        <input 
                          type="text" 
                          value={ocrReviewData.lastName} 
                          onChange={(e) => setOcrReviewData({...ocrReviewData, lastName: e.target.value})}
                          style={{ height: "32px", borderRadius: "6px", border: "1px solid #cbd5e1", padding: "0 8px", fontSize: "0.8rem", outline: "none", color: "#334155" }}
                        />
                      </div>
                    </div>

                    {/* Nationality */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                      <label style={{ fontSize: "0.7rem", fontWeight: "700", color: "#475569" }}>{t.pNation}</label>
                      <input 
                        type="text" 
                        value={ocrReviewData.nationality} 
                        onChange={(e) => setOcrReviewData({...ocrReviewData, nationality: e.target.value})}
                        style={{ height: "32px", borderRadius: "6px", border: "1px solid #cbd5e1", padding: "0 8px", fontSize: "0.8rem", outline: "none", color: "#334155" }}
                      />
                    </div>

                    {/* Date of Birth / Gender */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                        <label style={{ fontSize: "0.7rem", fontWeight: "700", color: "#475569" }}>{t.pDob} (DD/MM/YYYY)</label>
                        <input 
                          type="text" 
                          placeholder="DD/MM/YYYY"
                          value={ocrReviewData.dobInput || getDobInputVal(ocrReviewData.dob)} 
                          onChange={(e) => handleOcrDobInputChange(e.target.value)}
                          style={{ height: "32px", borderRadius: "6px", border: "1px solid #cbd5e1", padding: "0 8px", fontSize: "0.8rem", outline: "none", color: "#334155" }}
                        />
                        
                        {/* Dropdowns helper */}
                        <div style={{ display: "flex", gap: "2px", marginTop: "2px" }}>
                          <select
                            style={{ flex: 1, height: "20px", fontSize: "0.6rem", borderRadius: "4px", border: "1px solid #cbd5e1", padding: 0 }}
                            value={ocrReviewData.dob ? ocrReviewData.dob.split("-")[2] : ""}
                            onChange={(e) => handleOcrDobSelectChange("day", e.target.value)}
                          >
                            <option value="">Day</option>
                            {Array.from({ length: 31 }, (_, i) => {
                              const d = String(i + 1).padStart(2, "0");
                              return <option key={d} value={d}>{d}</option>;
                            })}
                          </select>
                          
                          <select
                            style={{ flex: 1, height: "20px", fontSize: "0.6rem", borderRadius: "4px", border: "1px solid #cbd5e1", padding: 0 }}
                            value={ocrReviewData.dob ? ocrReviewData.dob.split("-")[1] : ""}
                            onChange={(e) => handleOcrDobSelectChange("month", e.target.value)}
                          >
                            <option value="">Mo</option>
                            {Array.from({ length: 12 }, (_, i) => {
                              const m = String(i + 1).padStart(2, "0");
                              return <option key={m} value={m}>{m}</option>;
                            })}
                          </select>
                          
                          <select
                            style={{ flex: 1.2, height: "20px", fontSize: "0.6rem", borderRadius: "4px", border: "1px solid #cbd5e1", padding: 0 }}
                            value={ocrReviewData.dob ? ocrReviewData.dob.split("-")[0] : ""}
                            onChange={(e) => handleOcrDobSelectChange("year", e.target.value)}
                          >
                            <option value="">Year</option>
                            {Array.from({ length: 100 }, (_, i) => {
                              const y = String(new Date().getFullYear() - i);
                              return <option key={y} value={y}>{y}</option>;
                            })}
                          </select>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                        <label style={{ fontSize: "0.7rem", fontWeight: "700", color: "#475569" }}>{t.pGender}</label>
                        <select 
                          value={ocrReviewData.gender} 
                          onChange={(e) => setOcrReviewData({...ocrReviewData, gender: e.target.value})}
                          style={{ height: "32px", borderRadius: "6px", border: "1px solid #cbd5e1", padding: "0 8px", fontSize: "0.8rem", outline: "none", background: "#fff", color: "#334155" }}
                        >
                          <option value="male">{t.gMale}</option>
                          <option value="female">{t.gFemale}</option>
                          <option value="other">{t.gOther}</option>
                        </select>
                      </div>
                    </div>

                    {/* Phone / Age */}
                    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "8px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                        <label style={{ fontSize: "0.7rem", fontWeight: "700", color: "#475569" }}>{t.pPhone}</label>
                        <input 
                          type="text" 
                          value={ocrReviewData.phone} 
                          onChange={(e) => setOcrReviewData({...ocrReviewData, phone: e.target.value})}
                          style={{ height: "32px", borderRadius: "6px", border: "1px solid #cbd5e1", padding: "0 8px", fontSize: "0.8rem", outline: "none", color: "#334155" }}
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                        <label style={{ fontSize: "0.7rem", fontWeight: "700", color: "#475569" }}>{t.pAge}</label>
                        <input 
                          type="number" 
                          value={ocrReviewData.age} 
                          onChange={(e) => setOcrReviewData({...ocrReviewData, age: e.target.value})}
                          style={{ height: "32px", borderRadius: "6px", border: "1px solid #cbd5e1", padding: "0 8px", fontSize: "0.8rem", outline: "none", color: "#334155" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Simulated Canvas drawer (hidden) */}
            <canvas ref={canvasRef} style={{ display: "none" }} />

            {/* Capture & Confirmation controls */}
            <div style={{ display: "flex", gap: "8px" }}>
              {scannerStep !== "ocr_processing" && (
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f1f5f9", cursor: "pointer", fontWeight: "bold" }}
                  onClick={closeScanner}
                >
                  Cancel
                </button>
              )}

              {scannerStep === "doc" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1.5 }}>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "#0f766e", border: "none", color: "#fff", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
                    onClick={handleCaptureDocPhoto}
                    disabled={!cameraStream}
                  >
                    {t.captureDocBtn}
                  </button>
                  <label 
                    className="btn btn-secondary" 
                    style={{ 
                      width: "100%", 
                      padding: "8px", 
                      borderRadius: "8px", 
                      border: "1px dashed #0f766e", 
                      background: "rgba(15, 118, 110, 0.05)", 
                      color: "#0f766e", 
                      fontWeight: "bold", 
                      cursor: "pointer", 
                      textAlign: "center", 
                      fontSize: "0.85rem",
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      gap: "4px",
                      boxSizing: "border-box"
                    }}
                  >
                    📂 {lang === "en" ? "Upload/Take Photo" : lang === "la" ? "ອັບໂຫລດ/ຖ່າຍຮູບ" : "อัปโหลด/ถ่ายรูป"}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileUploadDoc} 
                      style={{ display: "none" }} 
                    />
                  </label>
                </div>
              )}

              {scannerStep === "ocr_processing" && (
                <div style={{ width: "100%", textAlign: "center", color: "#64748b", fontSize: "0.8rem", fontWeight: "bold", padding: "10px 0" }}>
                  Please wait... processing image
                </div>
              )}

              {scannerStep === "ocr_review" && (
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  style={{ flex: 1.5, padding: "14px", borderRadius: "10px", background: "#10b981", border: "none", color: "#fff", fontWeight: "bold", fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
                  onClick={handleConfirmOcrDetails}
                >
                  {t.confirmAndSelfie}
                </button>
              )}

              {scannerStep === "face" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1.5 }}>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    style={{ width: "100%", padding: "14px", borderRadius: "10px", background: "#0ea5e9", border: "none", color: "#fff", fontWeight: "bold", fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
                    onClick={handleCaptureFace}
                    disabled={!cameraStream}
                  >
                    {t.captureFaceBtn}
                  </button>
                  <label 
                    className="btn btn-secondary" 
                    style={{ 
                      width: "100%", 
                      padding: "8px", 
                      borderRadius: "8px", 
                      border: "1px dashed #0ea5e9", 
                      background: "rgba(14, 165, 233, 0.05)", 
                      color: "#0ea5e9", 
                      fontWeight: "bold", 
                      cursor: "pointer", 
                      textAlign: "center", 
                      fontSize: "0.85rem",
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      gap: "4px",
                      boxSizing: "border-box"
                    }}
                  >
                    📂 {lang === "en" ? "Upload/Take Selfie" : lang === "la" ? "ອັບໂຫລດ/ຖ່າຍຮູບຕົນເອງ" : "อัปโหลด/ถ่ายเซลฟี่"}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileUploadFace} 
                      style={{ display: "none" }} 
                    />
                  </label>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// Inline Mobile-First Styles
const containerStyle = {
  background: "#f1f5f9",
  minHeight: "100vh",
  width: "100vw",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "12px",
  overflowY: "auto",
  boxSizing: "border-box"
};

const cardStyle = {
  width: "100%",
  maxWidth: "450px",
  background: "#ffffff",
  border: "1px solid #cbd5e1",
  borderRadius: "16px",
  padding: "1.25rem",
  boxShadow: "0 4px 10px rgba(15, 23, 42, 0.05)",
  boxSizing: "border-box"
};

const headerStyle = {
  textAlign: "center",
  marginBottom: "1.25rem",
  borderBottom: "1px solid #e2e8f0",
  paddingBottom: "1rem"
};

const langBarContainerStyle = {
  width: "100%",
  maxWidth: "450px",
  background: "#ffffff",
  padding: "8px 12px",
  borderRadius: "10px",
  boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
  border: "1px solid #cbd5e1",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "10px",
  boxSizing: "border-box"
};

const langBtnStyle = (isActive) => ({
  background: isActive ? "#0f766e" : "transparent",
  color: isActive ? "#ffffff" : "#475569",
  border: isActive ? "none" : "1px solid #cbd5e1",
  padding: "4px 8px",
  borderRadius: "6px",
  fontSize: "0.75rem",
  fontWeight: "600",
  cursor: "pointer",
  transition: "all 0.15s ease"
});

const successCardStyle = {
  width: "100%",
  maxWidth: "400px",
  background: "#ffffff",
  border: "1px solid #cbd5e1",
  borderRadius: "20px",
  padding: "2.5rem 1.5rem",
  textAlign: "center",
  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)",
  boxSizing: "border-box",
  marginTop: "2rem"
};

const successIconWrapperStyle = {
  width: "80px",
  height: "80px",
  borderRadius: "50%",
  background: "#ecfdf5",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto 1rem auto"
};

const badgeContainerStyle = {
  background: "rgba(15, 118, 110, 0.08)",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid rgba(15, 118, 110, 0.2)",
  fontSize: "0.85rem",
  color: "#0f766e",
  marginBottom: "1.5rem",
  display: "inline-block",
  textAlign: "left",
  width: "100%",
  boxSizing: "border-box"
};
