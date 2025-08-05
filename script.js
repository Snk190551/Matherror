// URL Backend ของคุณ (จาก Render)
const BACKEND_URL = 'https://my-backend-server-2kup.onrender.com'; // **ตรวจสอบให้แน่ใจว่าเป็น URL ล่าสุดของคุณ**

// --- ฟังก์ชันการจัดการผู้ใช้และ UI ---

// ฟังก์ชันสำหรับตรวจสอบสถานะการเข้าสู่ระบบ
function checkLogin() {
  const user = sessionStorage.getItem("loggedInUser");

  if (!user) {
    // ถ้ายังไม่ได้ล็อกอินและพยายามเข้าหน้า home.html หรือ admin.html
    // admin.html จะถูก Redirect โดยตัวมันเอง (ดู admin.html)
    if (window.location.pathname.endsWith("home.html") || window.location.pathname.endsWith("admin.html")) {
      window.location.href = "index.html"; // Redirect ไปหน้า login
    }
  } else {
    // ถ้าล็อกอินแล้วและพยายามเข้าหน้า index.html
    if (window.location.pathname.endsWith("index.html")) {
      window.location.href = "home.html"; // Redirect ไปหน้า home
    }
    // สำหรับหน้า home.html (ตอนนี้เป็นแอปจัดการรายจ่าย)
    // โหลดข้อมูลเมื่อผู้ใช้ล็อกอินสำเร็จและอยู่ในหน้า home.html
    if (window.location.pathname.endsWith("home.html")) {
        loadTransactions(); // โหลดรายการธุรกรรมเมื่อเข้าสู่ระบบ
    }
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

  // โหลดข้อมูลเมื่อสลับไปยังแท็บ "รายการ"
  if (tabId === 'items') {
      loadTransactions();
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

// --- ฟังก์ชันสำหรับจัดการข้อมูลรายรับ-รายจ่าย ---

// ฟังก์ชันสำหรับโหลดรายการธุรกรรมจาก Backend
async function loadTransactions() {
    const userId = sessionStorage.getItem("loggedInUser");
    const itemsListDiv = document.querySelector('.daily-items-list'); // div ที่จะแสดงรายการ

    if (!userId || !itemsListDiv) {
        return;
    }

    itemsListDiv.innerHTML = '<p style="text-align: center; color: #666;">กำลังโหลดรายการ...</p>';

    try {
        const response = await fetch(`${BACKEND_URL}/api/transactions/${userId}`);
        const transactions = await response.json();

        if (response.ok) {
            if (transactions.length === 0) {
                itemsListDiv.innerHTML = '<p style="text-align: center; color: #666;">ยังไม่มีรายการ</p>';
                return;
            }

            // จัดกลุ่มรายการตามวันที่
            const groupedTransactions = transactions.reduce((groups, transaction) => {
                const date = new Date(transaction.date).toLocaleDateString('th-TH', {
                    day: 'numeric', month: 'long', year: 'numeric'
                });
                if (!groups[date]) {
                    groups[date] = [];
                }
                groups[date].push(transaction);
                return groups;
            }, {});

            itemsListDiv.innerHTML = ''; // เคลียร์เนื้อหาเก่า

            for (const date in groupedTransactions) {
                const dateGroupDiv = document.createElement('div');
                dateGroupDiv.classList.add('date-group');
                dateGroupDiv.innerHTML = `
                    <span class="date-header">${date}</span>
                    <span class="item-count">${groupedTransactions[date].length} รายการ</span>
                    <div class="item-cards"></div>
                `;
                const itemCardsContainer = dateGroupDiv.querySelector('.item-cards');

                groupedTransactions[date].forEach(transaction => {
                    const iconSvg = getCategoryIcon(transaction.category); // ฟังก์ชันสำหรับดึง SVG icon
                    const typeClass = transaction.type === 'expense' ? 'expense' : 'income';
                    const displayAmount = transaction.type === 'expense' ? `▾ ${transaction.amount.toLocaleString()}` : `▴ ${transaction.amount.toLocaleString()}`;
                    const time = new Date(transaction.date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

                    const itemCardHtml = `
                        <div class="item-card">
                            <div class="item-icon-wrapper ${typeClass}">
                                ${iconSvg}
                            </div>
                            <div class="item-details">
                                <span class="item-category">${transaction.category}</span>
                                <span class="item-amount ${typeClass}">${displayAmount}</span>
                                <span class="item-time">${time}</span>
                            </div>
                        </div>
                    `;
                    itemCardsContainer.innerHTML += itemCardHtml;
                });
                itemsListDiv.appendChild(dateGroupDiv);
            }

        } else {
            itemsListDiv.innerHTML = `<p style="text-align: center; color: red;">เกิดข้อผิดพลาดในการโหลดรายการ: ${transactions.message || 'Unknown error'}</p>`;
        }
    } catch (error) {
        console.error('Error fetching transactions:', error);
        itemsListDiv.innerHTML = '<p style="text-align: center; color: red;">ไม่สามารถเชื่อมต่อกับ Backend เพื่อโหลดรายการได้</p>';
    }
}

// ฟังก์ชันสำหรับเพิ่มรายการใหม่ (จะเปิด Modal ในอนาคต)
function addNewTransaction() {
    alert('ฟังก์ชันเพิ่มรายการใหม่จะมาในเร็วๆ นี้!');
    // ในอนาคตจะเปิด Modal หรือหน้าฟอร์มสำหรับกรอกข้อมูล
    // และเรียก API POST /api/transactions
}

// Helper function เพื่อดึง SVG icon ตามหมวดหมู่ (ตัวอย่าง)
function getCategoryIcon(category) {
    // คุณสามารถเพิ่ม icon สำหรับหมวดหมู่ต่างๆ ได้ที่นี่
    // ใช้ Lucide Icons (https://lucide.dev/) หรือ Font Awesome
    switch (category) {
        case 'อาหาร': return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-utensils"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15v2a2 2 0 0 1-2 2H7"/><path d="M15 15v7"/></svg>`;
        case 'เดินทาง': return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-car"><path d="M19 17H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2Z"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>`;
        case 'บันเทิง': return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-music"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
        case 'เงินเดือน': return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-wallet"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h12a2 2 0 0 1 0 4H5a2 2 0 0 0 0 4h12c.78 0 1.53.39 2 1m0 0v2a1 1 0 0 1-1 1H5a2 2 0 0 1 0-4h12a2 2 0 0 0 0-4H5a2 2 0 0 0 0-4h12V7m-3 0V4m0 8v-2m0 8v-2"/></svg>`;
        case 'คืนเงิน': return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-receipt-text"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2h-2zm-2 0h-2c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h2V2zm18 0v20h2c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2h-2zM8 8h8M8 12h8M8 16h6"/></svg>`;
        case 'สัตว์เลี้ยง': return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bone"><path d="M17 10c.8 0 1.6.3 2.2.9C20.4 11.8 21 12.6 21 13.5c0 .8-.3 1.6-.9 2.2-.6.6-1.4.9-2.2.9-.8 0-1.6-.3-2.2-.9-.6-.6-.9-1.4-.9-2.2 0-.8.3-1.6.9-2.2.6-.6 1.4-.9 2.2-.9z"/><path d="M7 14c-.8 0-1.6-.3-2.2-.9C3.6 12.2 3 11.4 3 10.5c0-.8.3-1.6.9-2.2.6-.6 1.4-.9 2.2-.9.8 0 1.6.3 2.2.9.6.6.9 1.4.9 2.2 0 .8-.3 1.6-.9 2.2-.6.6-1.4.9-2.2.9z"/><path d="M10.5 13.5 13.5 10.5"/></svg>`;
        default: return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-tag"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414L19 21l3-3L5.414 2.586z"/><circle cx="9" cy="9" r="2"/></svg>`; // ไอคอนเริ่มต้น
    }
}

// เรียก showTab('overview') เมื่อโหลดหน้า home.html ครั้งแรก
document.addEventListener('DOMContentLoaded', () => {
  // ตรวจสอบว่าอยู่ใน home.html ก่อนเรียก showTab
  if (window.location.pathname.endsWith("home.html")) {
    showTab('overview');
  }
});

// กำหนดให้ปุ่ม FAB (Floating Action Button) เรียกฟังก์ชัน addNewTransaction
document.querySelector('.fab').onclick = addNewTransaction;
