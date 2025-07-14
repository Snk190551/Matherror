// URL Backend ของคุณ (จาก Render)
const BACKEND_URL = 'https://my-backend-server-2kup.onrender.com'; // **ตรวจสอบให้แน่ใจว่าเป็น URL ล่าสุดของคุณ**

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
  // สำหรับ Google Sign-In ควรเรียก signOut ด้วย
  if (google.accounts.id) {
    google.accounts.id.disableAutoSelect(); // ปิดการเลือกบัญชีอัตโนมัติ
    // google.accounts.id.revoke(sessionStorage.getItem("googleIdToken"), done => {
    //   console.log('consent revoked', done);
    // }); // หากต้องการยกเลิกการอนุญาตจริงๆ (อาจไม่จำเป็นสำหรับทุกกรณี)
  }
  window.location.href = "index.html"; // Redirect ไปหน้า login
}

// แสดงรายการผู้ใช้ในหน้า admin (ดึงจาก Backend)
// ฟังก์ชันนี้ยังคงอยู่ เพราะ Admin ยังคงจัดการผู้ใช้ที่อาจถูกสร้างขึ้นมาก่อน หรือในอนาคตอาจมีผู้ใช้ที่สร้างผ่าน Google
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

// ลบผู้ใช้ (สำหรับ Admin - ส่ง Request ไป Backend)
// ฟังก์ชันนี้ยังคงอยู่เพื่อให้ Admin สามารถลบผู้ใช้ได้
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
