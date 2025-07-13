// กำหนด URL ของ Backend Server ของคุณที่ Deploy บน Render
const BACKEND_URL = 'https://my-backend-server-2kup.onrender.com'; // **สำคัญ: ตรวจสอบให้แน่ใจว่าเป็น URL ล่าสุดและถูกต้องของคุณ**

// ฟังก์ชันสำหรับลงทะเบียนผู้ใช้ใหม่
async function register(event) {
  event.preventDefault(); // ป้องกันการ Submit ฟอร์มแบบปกติ (ซึ่งจะทำให้หน้าโหลดใหม่)
  const username = document.getElementById("reg-username").value;
  const email = document.getElementById("reg-email").value; // ดึงค่าอีเมล
  const password = document.getElementById("reg-password").value;
  const message = document.getElementById("reg-message"); // Element สำหรับแสดงข้อความสถานะ

  // ตรวจสอบความยาวรหัสผ่านใน Frontend ก่อนส่งไป Backend
  if (password.length < 6) {
      message.style.color = "red";
      message.innerText = "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร.";
      return false; // หยุดฟังก์ชัน
  }

  try {
    // ส่งข้อมูลการลงทะเบียนไปยัง Backend API
    const response = await fetch(`${BACKEND_URL}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // ระบุว่าข้อมูลที่ส่งเป็น JSON
      },
      body: JSON.stringify({ username, email, password }), // แปลงข้อมูลเป็น JSON string
    });

    const data = await response.json(); // แปลง Response จาก Backend เป็น JSON object

    if (response.ok) { // ถ้า Server ตอบกลับสถานะ OK (200-299)
      message.style.color = "green";
      message.innerText = data.message || "สมัครสมาชิกสำเร็จ! โปรดเข้าสู่ระบบ"; // แสดงข้อความสำเร็จ
      // หากต้องการให้ redirect ไปหน้า login อัตโนมัติหลังจากสมัครสำเร็จ
      // setTimeout(() => {
      //   window.location.href = "index.html";
      // }, 2000);
    } else { // ถ้า Server ตอบกลับข้อผิดพลาด (เช่น 400, 409, 500)
      message.style.color = "red";
      message.innerText = data.message || "สมัครสมาชิกไม่สำเร็จ. ลองใหม่อีกครั้ง."; // แสดงข้อความผิดพลาด
    }
  } catch (error) {
    console.error('Error during registration:', error); // แสดงข้อผิดพลาดใน Console
    message.style.color = "red";
    message.innerText = "เกิดข้อผิดพลาดในการเชื่อมต่อ. โปรดลองใหม่อีกครั้ง.";
  }
  return false; // ป้องกันการ Submit ฟอร์มแบบปกติอีกครั้ง
}

// ฟังก์ชันสำหรับเข้าสู่ระบบ
async function login(event) {
  event.preventDefault();
  const username = document.getElementById("username").value; // สามารถเป็น username หรือ email ก็ได้
  const password = document.getElementById("password").value;
  const message = document.getElementById("message");

  try {
    // ส่งข้อมูลการเข้าสู่ระบบไปยัง Backend API
    const response = await fetch(`${BACKEND_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) { // ถ้าเข้าสู่ระบบสำเร็จ
      sessionStorage.setItem("loggedInUser", data.username); // เก็บ username ไว้ใน sessionStorage (จะหายไปเมื่อปิด Tab/Browser)
      window.location.href = "home.html"; // Redirect ไปหน้า home
    } else { // ถ้าเข้าสู่ระบบไม่สำเร็จ
      message.style.color = "red";
      message.innerText = data.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง";
    }
  } catch (error) {
    console.error('Error during login:', error);
    message.style.color = "red";
    message.innerText = "เกิดข้อผิดพลาดในการเชื่อมต่อ. โปรดลองใหม่อีกครั้ง.";
  }
  return false;
}

// ฟังก์ชันสำหรับตรวจสอบสถานะการเข้าสู่ระบบ (ถูกเรียกเมื่อโหลดหน้า home.html และ admin.html)
function checkLogin() {
  const user = sessionStorage.getItem("loggedInUser"); // ดึงชื่อผู้ใช้ที่ล็อกอินอยู่จาก sessionStorage

  if (!user) {
    // ถ้ายังไม่ได้ล็อกอินและพยายามเข้าหน้า home.html หรือ admin.html
    if (window.location.pathname.endsWith("home.html") || window.location.pathname.endsWith("admin.html")) {
      window.location.href = "index.html"; // Redirect ไปหน้า login
    }
  } else {
    // ถ้าล็อกอินแล้วและพยายามเข้าหน้า index.html
    if (window.location.pathname.endsWith("index.html")) {
      window.location.href = "home.html"; // Redirect ไปหน้า home
    }
    // สำหรับหน้า home.html เพื่อแสดงชื่อผู้ใช้
    const welcomeMsg = document.getElementById("welcome-msg");
    if (welcomeMsg) {
      welcomeMsg.innerText = `ยินดีต้อนรับ, ${user}!`;
    }
  }
}

// ฟังก์ชันสำหรับออกจากระบบ
function logout() {
  sessionStorage.removeItem("loggedInUser"); // ลบข้อมูลผู้ใช้จาก sessionStorage
  window.location.href = "index.html"; // Redirect ไปหน้า login
}

// ฟังก์ชันสำหรับแสดงรายการผู้ใช้ในหน้า Admin (ดึงข้อมูลจาก Backend)
async function loadUsers() {
  const userListDiv = document.getElementById("user-list");
  if (!userListDiv) return; // ออกจากฟังก์ชันถ้าไม่มี Element นี้ (เช่น ไม่ได้อยู่ในหน้า admin.html)

  userListDiv.innerHTML = "<h3>ผู้ใช้ทั้งหมด:</h3><p>กำลังโหลดผู้ใช้...</p>"; // แสดงสถานะกำลังโหลด

  try {
    // ส่ง Request ไปยัง Backend API เพื่อดึงข้อมูลผู้ใช้ทั้งหมด
    const response = await fetch(`${BACKEND_URL}/api/admin/users`);
    const users = await response.json(); // แปลง Response เป็น JSON (ซึ่งคือ Array ของผู้ใช้)

    if (response.ok) {
      if (users.length === 0) {
        userListDiv.innerHTML = "<h3>ผู้ใช้ทั้งหมด:</h3><p>ยังไม่มีผู้ใช้ในระบบ</p>";
      } else {
        const ul = document.createElement("ul");
        users.forEach(user => {
          const li = document.createElement("li");
          li.innerHTML = `
            <strong>ชื่อผู้ใช้:</strong> ${user.username} -
            <strong>อีเมล:</strong> ${user.email}
            <button onclick="deleteUser('${user.username}')">ลบ</button>
          `;
          ul.appendChild(li);
        });
        userListDiv.innerHTML = "<h3>ผู้ใช้ทั้งหมด:</h3>";
        userListDiv.appendChild(ul);
      }
    } else {
      userListDiv.innerHTML = `<h3>ผู้ใช้ทั้งหมด:</h3><p style="color:red;">เกิดข้อผิดพลาดในการโหลดผู้ใช้: ${users.message || 'Unknown error'}</p>`;
    }
  } catch (error) {
    console.error('Error loading users:', error);
    userListDiv.innerHTML = `<h3>ผู้ใช้ทั้งหมด:</h3><p style="color:red;">เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อโหลดผู้ใช้.</p>`;
  }
}

// ฟังก์ชันสำหรับลบผู้ใช้ (สำหรับ Admin - ส่ง Request ไป Backend)
async function deleteUser(usernameToDelete) {
  // แสดง Pop-up ยืนยันการลบ
  if (confirm(`คุณแน่ใจหรือไม่ที่จะลบผู้ใช้ "${usernameToDelete}"?`)) {
    try {
      // ส่ง Request ไปยัง Backend API เพื่อลบผู้ใช้
      const response = await fetch(`${BACKEND_URL}/api/admin/delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: usernameToDelete }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message || `ลบผู้ใช้ ${usernameToDelete} สำเร็จแล้ว.`); // แสดงข้อความสำเร็จ
        loadUsers(); // โหลดรายการผู้ใช้ใหม่หลังจากลบ
      } else {
        alert(data.message || `เกิดข้อผิดพลาดในการลบผู้ใช้ ${usernameToDelete}.`); // แสดงข้อความผิดพลาด
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อลบผู้ใช้.');
    }
  }
}

// ฟังก์ชันสำหรับกลับไปหน้า Home
function backToHome() {
  window.location.href = "home.html";
}

// ฟังก์ชันสำหรับส่งคำขอรีเซ็ตรหัสผ่าน (Step 1: ตรวจสอบอีเมลและส่งลิงก์)
async function verifyUsername(event) {
  event.preventDefault();
  const email = document.getElementById("reset-email").value;
  const message = document.getElementById("reset-message");

  try {
    // ส่งอีเมลไปยัง Backend เพื่อเริ่มกระบวนการลืมรหัสผ่าน
    const response = await fetch(`${BACKEND_URL}/api/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email }),
    });

    const data = await response.json();

    if (response.ok) {
      // ไม่ว่าจะเจอหรือไม่เจออีเมล ควรให้ข้อความเป็นกลางเพื่อความปลอดภัย
      message.style.color = "lightgreen";
      message.innerText = data.message || "หากอีเมลนี้มีอยู่ในระบบ ลิงก์สำหรับรีเซ็ตรหัสผ่านได้ถูกส่งไปแล้วค่ะ";
      // ซ่อนฟอร์มกรอกอีเมล เพราะต้องรอคลิกลิงก์ในอีเมล
      document.getElementById("request-reset-form").style.display = "none";
    } else {
      message.style.color = "red";
      message.innerText = data.message || "เกิดข้อผิดพลาดในการร้องขอรีเซ็ตรหัสผ่าน";
    }
  } catch (error) {
    console.error('Error during verifyUsername (forgot password):', error);
    message.style.color = "red";
    message.innerText = "เกิดข้อผิดพลาดในการเชื่อมต่อ. โปรดลองใหม่อีกครั้ง.";
  }
}

// ฟังก์ชันสำหรับตั้งรหัสผ่านใหม่ (ถูกเรียกเมื่อกดปุ่ม "ตั้งรหัสผ่านใหม่" ในฟอร์ม set-new-password-form)
async function resetPassword(event) {
    event.preventDefault();
    // ดึง Token จาก URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    // ดึงรหัสผ่านใหม่และยืนยันรหัสผ่านใหม่
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const resetMessage = document.getElementById('reset-message');

    // ตรวจสอบความยาวรหัสผ่านใหม่
    if (newPassword.length < 6) {
        resetMessage.style.color = 'red';
        resetMessage.innerText = 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร.';
        return;
    }
    // ตรวจสอบว่ารหัสผ่านใหม่ตรงกันหรือไม่
    if (newPassword !== confirmPassword) {
        resetMessage.style.color = 'red';
        resetMessage.innerText = 'รหัสผ่านใหม่ไม่ตรงกัน';
        return;
    }

    // ตรวจสอบว่ามี Token หรือไม่
    if (!token) {
        resetMessage.style.color = 'red';
        resetMessage.innerText = 'ไม่พบ Token สำหรับรีเซ็ตรหัสผ่าน';
        return;
    }

    try {
        // ส่ง Token และรหัสผ่านใหม่ไปยัง Backend API
        const response = await fetch(`${BACKEND_URL}/api/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token, newPassword }),
        });

        const data = await response.json();

        if (response.ok) {
            resetMessage.style.color = 'green';
            resetMessage.innerText = data.message || 'รีเซ็ตรหัสผ่านสำเร็จ! คุณสามารถเข้าสู่ระบบได้แล้ว';
            document.getElementById('set-new-password-form').style.display = 'none'; // ซ่อนฟอร์ม
            // Redirect ไปหน้า login หลังจากนั้นไม่กี่วินาที
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 3000);
        } else {
            resetMessage.style.color = 'red';
            resetMessage.innerText = data.message || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน. Token ไม่ถูกต้องหรือหมดอายุ.';
        }
    } catch (error) {
        console.error('Error during password reset:', error);
        resetMessage.style.color = 'red';
        resetMessage.innerText = 'เกิดข้อผิดพลาดในการเชื่อมต่อ. โปรดลองใหม่อีกครั้ง.';
    }
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
    // **หมายเหตุ:** ในแอปพลิเคชันจริง ควรมีการส่งข้อมูลนี้ไป Backend เพื่อจัดการผู้ใช้ Google ในฐานข้อมูลของคุณด้วย
    sessionStorage.setItem("loggedInUser", profile.email);
    window.location.href = "home.html";
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
