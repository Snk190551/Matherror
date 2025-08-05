// URL Backend ของคุณ (จาก Render)
const BACKEND_URL = 'https://my-backend-server-2kup.onrender.com'; // **ตรวจสอบให้แน่ใจว่าเป็น URL ล่าสุดของคุณ**

// --- ฟังก์ชันการจัดการผู้ใช้ (ไม่มี Admin และเครื่องคิดเลขแล้ว) ---

// ฟังก์ชันสำหรับตรวจสอบสถานะการเข้าสู่ระบบ (ถูกเรียกเมื่อโหลดหน้า home.html และ admin.html)
function checkLogin() {
  const user = sessionStorage.getItem("loggedInUser"); // ดึงชื่อผู้ใช้ที่ล็อกอินอยู่จาก sessionStorage

  if (!user) {
    // ถ้ายังไม่ได้ล็อกอินและพยายามเข้าหน้า home.html หรือ admin.html
    // admin.html จะถูก Redirect โดยตัวมันเอง (ดู admin.html)
    if (window.location.pathname.endsWith("home.html")) {
      window.location.href = "index.html"; // Redirect ไปหน้า login
    }
  } else {
    // ถ้าล็อกอินแล้วและพยายามเข้าหน้า index.html
    if (window.location.pathname.endsWith("index.html")) {
      window.location.href = "home.html"; // Redirect ไปหน้า home
    }
    // สำหรับหน้า home.html เพื่อแสดงข้อความต้อนรับ (ถ้ามี)
    const welcomeMsg = document.getElementById("welcome-msg");
    if (welcomeMsg) {
      welcomeMsg.innerText = `ยินดีต้อนรับ, ${user}!`; // แสดงอีเมลของผู้ใช้ที่ล็อกอิน
    }
  }
}

// ฟังก์ชันสำหรับออกจากระบบ
function logout() {
  sessionStorage.removeItem("loggedInUser"); // ลบข้อมูลผู้ใช้จาก sessionStorage
  // สำหรับ Google Sign-In ควรเรียก signOut ด้วย
  if (google.accounts.id) {
    google.accounts.id.disableAutoSelect(); // ปิดการเลือกบัญชีอัตโนมัติ
  }
  window.location.href = "index.html"; // Redirect ไปหน้า login
}

// --- ส่วนสำหรับ Google Sign-In ---
// ฟังก์ชันนี้จะถูกเรียกโดย Google Sign-In Library เมื่อผู้ใช้ล็อกอินด้วย Google สำเร็จ
function handleCredentialResponse(response) {
  if (response && response.credential) {
    // Decode JWT token เพื่อดึงข้อมูลผู้ใช้จาก Google
    const profile = parseJwt(response.credential);
    console.log("ID: " + profile.sub);
    console.log('Full Name: ' + profile.name);
    console.log('Email: ' + profile.email);

    // เก็บอีเมลของผู้ใช้ Google ลงใน sessionStorage และ Redirect ไปหน้า home
    sessionStorage.setItem("loggedInUser", profile.email);
    window.location.href = "home.html"; // Redirect ไปหน้า home (หน้าต้อนรับ)
  } else {
    console.error("Google Sign-In failed or no credential received.");
  }
}

// Helper function เพื่อถอดรหัส JWT (สำหรับ Frontend Demonstration เท่านั้น)
// **คำเตือน:** ในแอปพลิเคชันจริง ควรตรวจสอบ JWT บน Backend Server ที่ปลอดภัยเสมอ
function parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
};
