// Mock user data (สามารถเชื่อมกับ localStorage หรือ backend ได้ในอนาคต)
const users = {
  "test@example.com": "1234"
};

// Login
function loginUser() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (users[email] && users[email] === password) {
    sessionStorage.setItem("userEmail", email);
    alert("เข้าสู่ระบบสำเร็จ!");
    window.location.href = "about.html";
  } else {
    alert("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
  }
}

// Register
function registerUser() {
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;

  users[email] = password;
  alert("สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ");
  window.location.href = "login.html";
}

// Session check
function checkSession() {
  const email = sessionStorage.getItem("userEmail");
  if (!email) {
    window.location.href = "login.html";
  } else {
    const hour = new Date().getHours();
    let timeGreeting = "สวัสดี";
    if (hour < 12) timeGreeting = "สวัสดีตอนเช้า";
    else if (hour < 18) timeGreeting = "สวัสดีตอนบ่าย";
    else timeGreeting = "สวัสดีตอนเย็น";

    document.getElementById("greeting").innerText = `${timeGreeting}, คุณ ${email} 👋`;
  }
}

// Logout
function logoutUser() {
  sessionStorage.removeItem("userEmail");
  alert("ออกจากระบบแล้ว");
  window.location.href = "login.html";
}

function loginUser() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const storedPassword = localStorage.getItem(email);
  if (storedPassword && storedPassword === password) {
    sessionStorage.setItem("userEmail", email);
    window.location.href = "about.html";
  } else {
    alert("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
  }
}
