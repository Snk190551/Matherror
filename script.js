// URL Backend ของคุณ (จาก Render)
const BACKEND_URL = 'https://my-backend-server-2kup.onrender.com'; // **ตรวจสอบให้แน่ใจว่าเป็น URL ล่าสุดของคุณ**

// ฟังก์ชันสำหรับตรวจสอบสถานะการเข้าสู่ระบบ
function checkLogin() {
  const user = sessionStorage.getItem("loggedInUser");

  if (!user) {
    // ถ้ายังไม่ได้ล็อกอินและพยายามเข้าหน้า home.html หรือ admin.html
    // admin.html จะถูก Redirect โดยตัวมันเอง (ดู admin.html)
    if (window.location.pathname.endsWith("home.html") || window.location.pathname.endsWith("admin.html")) {
      window.location.href = "index.html";
    }
  } else {
    // ถ้าล็อกอินแล้วและพยายามเข้าหน้า index.html
    if (window.location.pathname.endsWith("index.html")) {
      window.location.href = "home.html";
    }
    // สำหรับหน้า home.html (ตอนนี้เป็นแอปจัดการรายจ่าย)
    // สามารถแสดงชื่อผู้ใช้ได้ถ้าต้องการในอนาคต (เช่นในเมนูด้านข้าง)
    // const welcomeMsg = document.getElementById("welcome-msg");
    // if (welcomeMsg) {
    //   welcomeMsg.innerText = `ยินดีต้อนรับ, ${user}!`;
    // }
  }
}

// ฟังก์ชันสำหรับออกจากระบบ
function logout() {
  sessionStorage.removeItem("loggedInUser");
  if (google.accounts.id) {
    google.accounts.id.disableAutoSelect();
  }
  window.location.href = "index.html";
}

// ฟังก์ชันสำหรับสลับแท็บใน UI ของแอปจัดการรายจ่าย
function showTab(tabId) {
  // ซ่อนทุกแท็บ
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  // แสดงแท็บที่เลือก
  const selectedTab = document.getElementById(tabId + '-tab');
  if (selectedTab) {
    selectedTab.classList.add('active');
  }

  // อัปเดตสถานะปุ่มแท็บด้านบน (ถ้ามี)
  document.querySelectorAll('.tab-button').forEach(button => {
    button.classList.remove('active');
  });
  const topButton = document.querySelector(`.tab-button[onclick="showTab('${tabId}')"]`);
  if (topButton) {
      topButton.classList.add('active');
  }

  // อัปเดตสถานะปุ่มนำทางด้านล่าง
  document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
    item.classList.remove('active');
  });
  const bottomNavItem = document.querySelector(`.bottom-nav .nav-item[onclick="showTab('${tabId}')"]`);
  if (bottomNavItem) {
      bottomNavItem.classList.add('active');
  }

  // อัปเดตชื่อหัวข้อด้านบน
  const headerTitle = document.querySelector('.app-header .header-title');
  if (headerTitle) {
    switch (tabId) {
      case 'overview': headerTitle.innerText = 'ภาพรวม'; break;
      case 'items': headerTitle.innerText = 'รายการของฉัน'; break;
      case 'summary': headerTitle.innerText = 'สรุป'; break;
      case 'data': headerTitle.innerText = 'ข้อมูล'; break;
      case 'menu': headerTitle.innerText = 'เมนู'; break;
      default: headerTitle.innerText = 'แอปจัดการรายจ่าย';
    }
  }
}

// ฟังก์ชันสำหรับ Google Sign-In
function handleCredentialResponse(response) {
  if (response && response.credential) {
    const profile = parseJwt(response.credential);
    console.log("ID: " + profile.sub);
    console.log('Full Name: ' + profile.name);
    console.log('Email: ' + profile.email);

    sessionStorage.setItem("loggedInUser", profile.email);
    window.location.href = "home.html";
  } else {
    console.error("Google Sign-In failed or no credential received.");
  }
}

// Helper function เพื่อถอดรหัส JWT
function parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
};

// เรียก showTab('overview') เมื่อโหลดหน้า home.html ครั้งแรก
document.addEventListener('DOMContentLoaded', () => {
  // ตรวจสอบว่าอยู่ใน home.html ก่อนเรียก showTab
  if (window.location.pathname.endsWith("home.html")) {
    showTab('overview');
  }
});
