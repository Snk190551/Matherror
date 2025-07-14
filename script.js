// URL Backend ของคุณ (จาก Render)
const BACKEND_URL = 'https://my-backend-server-2kup.onrender.com'; // **ตรวจสอบให้แน่ใจว่าเป็น URL ล่าสุดของคุณ**

// --- ตัวแปรสำหรับเครื่องคิดเลข ---
let displayValue = '0'; // ค่าที่แสดงบนหน้าจอเครื่องคิดเลข
let firstOperand = null; // ตัวเลขตัวแรกของการคำนวณ
let operator = null; // ตัวดำเนินการ (+, -, *, /)
let waitingForSecondOperand = false; // สถานะว่ากำลังรอตัวเลขตัวที่สองหรือไม่

// ฟังก์ชันสำหรับอัปเดตหน้าจอแสดงผลของเครื่องคิดเลข
function updateDisplay() {
  const display = document.getElementById('display');
  if (display) {
    display.innerText = displayValue;
  }
}

// ฟังก์ชันสำหรับเพิ่มตัวเลขลงในหน้าจอแสดงผล
function appendNumber(number) {
  if (waitingForSecondOperand === true) {
    displayValue = number;
    waitingForSecondOperand = false;
  } else {
    // ป้องกันการใส่จุดทศนิยมซ้ำ
    if (number === '.' && displayValue.includes('.')) {
      return;
    }
    // ถ้าค่าปัจจุบันเป็น '0' และไม่ใช่จุดทศนิยม ให้แทนที่ด้วยตัวเลขใหม่
    // ไม่อย่างนั้นให้ต่อท้าย
    displayValue = displayValue === '0' && number !== '.' ? number : displayValue + number;
  }
  updateDisplay();
}

// ฟังก์ชันสำหรับเพิ่มตัวดำเนินการ
function appendOperator(nextOperator) {
  const inputValue = parseFloat(displayValue);

  if (operator && waitingForSecondOperand) {
    operator = nextOperator; // ถ้าเปลี่ยนตัวดำเนินการกลางคัน
    return;
  }

  if (firstOperand === null) {
    firstOperand = inputValue;
  } else if (operator) {
    const result = performCalculation[operator](firstOperand, inputValue);
    displayValue = String(result);
    firstOperand = result;
  }

  waitingForSecondOperand = true;
  operator = nextOperator;
  updateDisplay();
}

// วัตถุสำหรับเก็บฟังก์ชันการคำนวณ
const performCalculation = {
  '/': (first, second) => first / second,
  '*': (first, second) => first * second,
  '+': (first, second) => first + second,
  '-': (first, second) => first - second,
};

// ฟังก์ชันสำหรับคำนวณผลลัพธ์
function calculateResult() {
  if (firstOperand === null || operator === null) {
    return; // ไม่มีอะไรให้คำนวณ
  }

  const inputValue = parseFloat(displayValue);
  let result = performCalculation[operator](firstOperand, inputValue);

  // จัดการกับผลลัพธ์ที่เป็นทศนิยมยาวๆ
  displayValue = String(parseFloat(result.toFixed(7))); // จำกัดทศนิยม 7 ตำแหน่ง

  firstOperand = null;
  operator = null;
  waitingForSecondOperand = false;
  updateDisplay();
}

// ฟังก์ชันสำหรับเคลียร์หน้าจอและรีเซ็ตค่า
function clearDisplay() {
  displayValue = '0';
  firstOperand = null;
  operator = null;
  waitingForSecondOperand = false;
  updateDisplay();
}

// --- ฟังก์ชันการจัดการผู้ใช้ (ยังคงอยู่) ---

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
    // สำหรับหน้า home.html เพื่อแสดงชื่อผู้ใช้ (ตอนนี้เป็นเครื่องคิดเลข)
    const welcomeMsg = document.getElementById("welcome-msg");
    if (welcomeMsg) {
      // สามารถเปลี่ยนข้อความต้อนรับได้หากต้องการ
      // welcomeMsg.innerText = `ยินดีต้อนรับ, ${user}!`;
    }
    // อัปเดตหน้าจอเครื่องคิดเลขเมื่อโหลดหน้า
    updateDisplay();
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

// แสดงรายการผู้ใช้ในหน้า admin (ดึงจาก Backend)
async function loadUsers() {
  const userListDiv = document.getElementById("user-list");
  if (!userListDiv) return;

  userListDiv.innerHTML = "<h3>ผู้ใช้ทั้งหมด:</h3><p>กำลังโหลดผู้ใช้...</p>";

  try {
    const response = await fetch(`${BACKEND_URL}/api/admin/users`);
    const users = await response.json();

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
async function deleteUser(usernameToDelete) {
  if (confirm(`คุณแน่ใจหรือไม่ที่จะลบผู้ใช้ "${usernameToDelete}"?`)) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: usernameToDelete }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message || `ลบผู้ใช้ ${usernameToDelete} สำเร็จแล้ว.`);
        loadUsers();
      } else {
        alert(data.message || `เกิดข้อผิดพลาดในการลบผู้ใช้ ${usernameToDelete}.`);
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
    const profile = parseJwt(response.credential);
    console.log("ID: " + profile.sub);
    console.log('Full Name: ' + profile.name);
    console.log('Email: ' + profile.email);

    sessionStorage.setItem("loggedInUser", profile.email);
    window.location.href = "home.html"; // Redirect ไปหน้า home (เครื่องคิดเลข)
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
