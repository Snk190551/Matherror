// URL Backend ของคุณ (จาก Render)
const BACKEND_URL = 'https://my-backend-server-2kup.onrender.com'; // **ตรวจสอบให้แน่ใจว่าเป็น URL ล่าสุดของคุณ**

// --- ฟังก์ชันการจัดการผู้ใช้และ UI ---

// ฟังก์ชันสำหรับตรวจสอบสถานะการเข้าสู่ระบบ
function checkLogin() {
  const userJson = sessionStorage.getItem("loggedInUser"); // เปลี่ยนเป็น userJson เพราะจะเก็บเป็น JSON string

  if (!userJson) {
    // ถ้ายังไม่ได้ล็อกอินและพยายามเข้าหน้า home.html หรือ admin.html
    if (window.location.pathname.endsWith("home.html") || window.location.pathname.endsWith("admin.html")) {
      window.location.href = "index.html"; // Redirect ไปหน้า login
    }
  } else {
    const user = JSON.parse(userJson); // แปลง JSON string กลับเป็น Object

    // ถ้าล็อกอินแล้วและพยายามเข้าหน้า index.html
    if (window.location.pathname.endsWith("index.html")) {
      window.location.href = "home.html"; // Redirect ไปหน้า home
    }
    // สำหรับหน้า home.html (ตอนนี้เป็นแอปจัดการรายจ่าย)
    // โหลดข้อมูลภาพรวมเมื่อผู้ใช้ล็อกอินสำเร็จ
    if (window.location.pathname.endsWith("home.html")) {
        loadOverviewData();
        // อัปเดตชื่ออีเมลและรูปโปรไฟล์ใน UI
        const userEmailDisplay = document.getElementById('userEmailDisplay');
        const userProfilePicture = document.getElementById('userProfilePicture');

        if (userEmailDisplay && user.email) {
            userEmailDisplay.innerText = user.email;
        }
        if (userProfilePicture && user.picture) {
            // สร้าง img element และใส่รูปโปรไฟล์
            const img = document.createElement('img');
            img.src = user.picture;
            img.alt = 'User Profile Picture';
            // ลบ SVG icon เดิมออกก่อน
            userProfilePicture.innerHTML = '';
            userProfilePicture.appendChild(img);
        } else if (userProfilePicture) {
            // ถ้าไม่มีรูปโปรไฟล์ ให้แสดง SVG icon เดิม
            userProfilePicture.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
        }
    }
}

// ฟังก์ชันสำหรับออกจากระบบ
function logout() {
  sessionStorage.removeItem("loggedInUser");
  // ลบข้อมูลรูปโปรไฟล์และอีเมลจาก UI เมื่อ logout
  const userEmailDisplay = document.getElementById('userEmailDisplay');
  const userProfilePicture = document.getElementById('userProfilePicture');
  if (userEmailDisplay) {
      userEmailDisplay.innerText = 'My Account 1'; // คืนค่าเริ่มต้น
  }
  if (userProfilePicture) {
      // คืนค่าเป็น SVG icon fallback
      userProfilePicture.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
  }

  if (google.accounts.id) {
    google.accounts.id.disableAutoSelect(); // สำหรับ Google Sign-In
  }
  window.location.href = "index.html";
}

// ฟังก์ชันสำหรับสลับแท็บใน UI ของแอปจัดการรายจ่าย
function showTab(tabId) {
  console.log(`Switching to tab: ${tabId}`); // เพิ่ม console log เพื่อ debug

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
      case 'data': headerTitle.innerText = 'ข้อมูล'; break; // สลับตำแหน่ง
      case 'summary': headerTitle.innerText = 'สรุป'; loadSummaryData('month'); break; // สลับตำแหน่ง & โหลดสรุปรายเดือนเริ่มต้น
      case 'menu': headerTitle.innerText = 'เมนู'; break;
      default: headerTitle.innerText = 'แอปจัดการรายจ่าย';
    }
  }

  // โหลดข้อมูลเมื่อสลับไปยังแท็บที่เกี่ยวข้อง
  if (tabId === 'items') {
      loadTransactions();
  } else if (tabId === 'overview') {
      loadOverviewData();
  } else if (tabId === 'summary') {
      loadSummaryData(document.querySelector('.summary-period-selector .period-button.active')?.dataset.period || 'month');
  }
}

// ฟังก์ชันสำหรับ Google Sign-In
function handleCredentialResponse(response) {
  if (response && response.credential) {
    const profile = parseJwt(response.credential);
    console.log("ID: " + profile.sub);
    console.log('Full Name: ' + profile.name);
    console.log('Email: ' + profile.email);
    console.log('Picture: ' + profile.picture); // เพิ่ม log สำหรับรูปโปรไฟล์

    // เก็บข้อมูล profile ทั้งหมดเป็น JSON string
    sessionStorage.setItem("loggedInUser", JSON.stringify(profile));
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
    const itemsListDiv = document.querySelector('.daily-items-list');

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
                const date = new Date(transaction.date).toISOString().split('T')[0]; // YYYY-MM-DD
                if (!groups[date]) {
                    groups[date] = [];
                }
                groups[date].push(transaction);
                return groups;
            }, {});

            itemsListDiv.innerHTML = ''; // เคลียร์เนื้อหาเก่า

            // เรียงลำดับวันที่จากใหม่ไปเก่า
            const sortedDates = Object.keys(groupedTransactions).sort((a, b) => {
                return new Date(b) - new Date(a);
            });

            sortedDates.forEach(dateString => {
                const displayDate = new Date(dateString).toLocaleDateString('th-TH', {
                    day: 'numeric', month: 'long', year: 'numeric'
                });

                const dateGroupDiv = document.createElement('div');
                dateGroupDiv.classList.add('date-group');
                dateGroupDiv.innerHTML = `
                    <span class="date-header">${displayDate}</span>
                    <span class="item-count">${groupedTransactions[dateString].length} รายการ</span>
                    <div class="item-cards"></div>
                `;
                const itemCardsContainer = dateGroupDiv.querySelector('.item-cards');

                // เรียงลำดับรายการภายในวันจากใหม่ไปเก่า
                groupedTransactions[dateString].sort((a, b) => {
                    return new Date(b.date) - new Date(a.date);
                }).forEach(transaction => {
                    const iconSvg = getCategoryIcon(transaction.category);
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
                            <div class="item-actions">
                                <button class="item-action-button" onclick="editTransaction('${transaction.id}')">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-edit-3"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                                </button>
                                <button class="item-action-button" onclick="confirmDeleteTransaction('${transaction.id}')">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                </button>
                            </div>
                        </div>
                    `;
                    itemCardsContainer.innerHTML += itemCardHtml;
                });
                itemsListDiv.appendChild(dateGroupDiv);
            });

        } else {
            itemsListDiv.innerHTML = `<p style="text-align: center; color: red;">เกิดข้อผิดพลาดในการโหลดรายการ: ${transactions.message || 'Unknown error'}</p>`;
        }
    } catch (error) {
        console.error('Error fetching transactions:', error);
        itemsListDiv.innerHTML = '<p style="text-align: center; color: red;">ไม่สามารถเชื่อมต่อกับ Backend เพื่อโหลดรายการได้</p>';
    }
}

// ฟังก์ชันสำหรับโหลดข้อมูลภาพรวม (Overview)
async function loadOverviewData() {
    const userId = sessionStorage.getItem("loggedInUser");
    if (!userId) {
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/api/transactions/${userId}`);
        const transactions = await response.json();

        if (response.ok) {
            let totalCash = 0;
            let totalBankAccount = 0;
            let totalReceivable = 0;
            let totalDebt = 0;
            let totalCreditCard = 0;
            let todayItemsCount = 0;
            let todayIncome = 0;
            let todayExpense = 0;

            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

            transactions.forEach(t => {
                // คำนวณยอดคงเหลือตามบัญชี
                const amount = parseFloat(t.amount); // ตรวจสอบให้แน่ใจว่าเป็นตัวเลข
                if (t.account === 'เงินสด') {
                    totalCash += (t.type === 'income' ? amount : -amount);
                } else if (t.account === 'บัญชีธนาคาร') {
                    totalBankAccount += (t.type === 'income' ? amount : -amount);
                } else if (t.account === 'ค้างรับ') {
                    totalReceivable += amount;
                } else if (t.account === 'หนี้สิน') {
                    totalDebt += amount;
                } else if (t.account === 'บัตรเครดิต') {
                    totalCreditCard += (t.type === 'expense' ? amount : -amount);
                }

                // คำนวณรายการและรายรับ/รายจ่ายของวันนี้
                const transactionDate = new Date(t.date).toISOString().split('T')[0];
                if (transactionDate === today) {
                    todayItemsCount++;
                    if (t.type === 'income') {
                        todayIncome += amount;
                    } else if (t.type === 'expense') {
                        todayExpense += amount;
                    }
                }
            });

            // อัปเดต UI ของ Account Summary Card
            document.getElementById('overviewCashBalance').innerText = totalCash.toLocaleString();
            document.getElementById('overviewBankBalance').innerText = totalBankAccount.toLocaleString();
            document.getElementById('overviewReceivable').innerText = totalReceivable.toLocaleString();
            document.getElementById('overviewDebt').innerText = totalDebt.toLocaleString();
            document.getElementById('overviewCreditCard').innerText = totalCreditCard.toLocaleString();

            const totalCashBank = totalCash + totalBankAccount;
            document.getElementById('overviewCashBankTotal').innerText = totalCashBank.toLocaleString();

            const overallTotal = totalCash + totalBankAccount + totalReceivable - totalDebt - totalCreditCard;
            const overallTotalElement = document.getElementById('overviewOverallTotal');
            overallTotalElement.innerText = overallTotal.toLocaleString();
            if (overallTotal < 0) {
                overallTotalElement.classList.add('debt');
            } else {
                overallTotalElement.classList.remove('debt');
            }

            // อัปเดต UI ของ Today Summary
            document.getElementById('todayItemsCount').innerText = todayItemsCount.toLocaleString();
            document.getElementById('todayIncome').innerText = todayIncome.toLocaleString();
            document.getElementById('todayExpense').innerText = todayExpense.toLocaleString();

            // อัปเดตจำนวนวันและรายการทั้งหมด
            const firstTransactionDate = transactions.length > 0 ? new Date(transactions[transactions.length - 1].date) : new Date();
            const daysSinceFirstTransaction = Math.floor((new Date() - firstTransactionDate) / (1000 * 60 * 60 * 24));
            document.getElementById('overviewDaysCount').innerText = `${daysSinceFirstTransaction} วัน`;
            document.getElementById('overviewItemsCount').innerText = `${transactions.length} รายการ`;

        } else {
            console.error('Error loading overview data:', transactions.message || 'Unknown error');
        }
    } catch (error) {
        console.error('Error fetching overview data:', error);
    }
}

// ฟังก์ชันสำหรับโหลดข้อมูลสรุป (Summary)
async function loadSummaryData(period = 'month') {
    const userId = sessionStorage.getItem("loggedInUser");
    if (!userId) {
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/api/transactions/${userId}`);
        const transactions = await response.json();

        if (response.ok) {
            let filteredTransactions = [];
            const now = new Date();

            // กรองข้อมูลตามช่วงเวลา
            if (period === 'day') {
                const today = now.toISOString().split('T')[0];
                filteredTransactions = transactions.filter(t => new Date(t.date).toISOString().split('T')[0] === today);
            } else if (period === 'week') {
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday of current week
                startOfWeek.setHours(0, 0, 0, 0);

                const endOfWeek = new Date(now);
                endOfWeek.setDate(now.getDate() - now.getDay() + 6); // Saturday of current week
                endOfWeek.setHours(23, 59, 59, 999);

                filteredTransactions = transactions.filter(t => {
                    const tDate = new Date(t.date);
                    return tDate >= startOfWeek && tDate <= endOfWeek;
                });
            } else if (period === 'month') {
                filteredTransactions = transactions.filter(t => {
                    const tDate = new Date(t.date);
                    return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
                });
            } else if (period === 'year') {
                filteredTransactions = transactions.filter(t => new Date(t.date).getFullYear() === now.getFullYear());
            }

            let netIncome = 0;
            let netExpense = 0;
            const expenseCategories = {};
            const incomeCategories = {};

            filteredTransactions.forEach(t => {
                const amount = parseFloat(t.amount);
                if (t.type === 'income') {
                    netIncome += amount;
                    incomeCategories[t.category] = (incomeCategories[t.category] || 0) + amount;
                } else if (t.type === 'expense') {
                    netExpense += amount;
                    expenseCategories[t.category] = (expenseCategories[t.category] || 0) + amount;
                }
            });

            const summaryBalance = netIncome - netExpense;

            // อัปเดต UI สรุปยอด
            document.getElementById('summaryNetIncome').innerText = netIncome.toLocaleString();
            document.getElementById('summaryNetExpense').innerText = netExpense.toLocaleString();
            const summaryBalanceElement = document.getElementById('summaryBalance');
            summaryBalanceElement.innerText = summaryBalance.toLocaleString();
            if (summaryBalance < 0) {
                summaryBalanceElement.classList.add('debt');
            } else {
                summaryBalanceElement.classList.remove('debt');
            }

            // อัปเดต UI แยกตามหมวดหมู่ (รายจ่าย)
            const expenseBreakdownDiv = document.getElementById('expenseCategoryBreakdown');
            expenseBreakdownDiv.innerHTML = '';
            if (Object.keys(expenseCategories).length === 0) {
                expenseBreakdownDiv.innerHTML = '<p style="text-align: center; color: #666;">ยังไม่มีรายจ่ายสำหรับช่วงเวลานี้</p>';
            } else {
                // เรียงตามจำนวนเงินจากมากไปน้อย
                Object.entries(expenseCategories).sort(([, a], [, b]) => b - a).forEach(([category, amount]) => {
                    const itemDiv = document.createElement('div');
                    itemDiv.classList.add('category-item');
                    itemDiv.innerHTML = `
                        <span class="category-name">${category}</span>
                        <span class="category-amount expense">▾ ${amount.toLocaleString()}</span>
                    `;
                    expenseBreakdownDiv.appendChild(itemDiv);
                });
            }

            // อัปเดต UI แยกตามหมวดหมู่ (รายรับ)
            const incomeBreakdownDiv = document.getElementById('incomeCategoryBreakdown');
            incomeBreakdownDiv.innerHTML = '';
            if (Object.keys(incomeCategories).length === 0) {
                incomeBreakdownDiv.innerHTML = '<p style="text-align: center; color: #666;">ยังไม่มีรายรับสำหรับช่วงเวลานี้</p>';
            } else {
                // เรียงตามจำนวนเงินจากมากไปน้อย
                Object.entries(incomeCategories).sort(([, a], [, b]) => b - a).forEach(([category, amount]) => {
                    const itemDiv = document.createElement('div');
                    itemDiv.classList.add('category-item');
                    itemDiv.innerHTML = `
                        <span class="category-name">${category}</span>
                        <span class="category-amount income">▴ ${amount.toLocaleString()}</span>
                    `;
                    incomeBreakdownDiv.appendChild(itemDiv);
                });
            }

            // อัปเดตปุ่มช่วงเวลาที่ active
            document.querySelectorAll('.summary-period-selector .period-button').forEach(button => {
                button.classList.remove('active');
            });
            document.querySelector(`.summary-period-selector .period-button[data-period="${period}"]`).classList.add('active');


        } else {
            console.error('Error loading summary data:', transactions.message || 'Unknown error');
        }
    } catch (error) {
        console.error('Error fetching summary data:', error);
    }
}


// --- ฟังก์ชันสำหรับจัดการ Modal เพิ่ม/แก้ไขรายการ ---

// ฟังก์ชันเปิด Modal (สำหรับเพิ่มรายการใหม่)
function addNewTransaction() {
    const modal = document.getElementById('transactionModal');
    document.getElementById('modalTitle').innerText = 'เพิ่มรายการใหม่';
    document.getElementById('transactionId').value = ''; // เคลียร์ ID สำหรับรายการใหม่
    document.getElementById('transactionForm').reset(); // รีเซ็ตฟอร์ม
    
    // ตั้งค่าเริ่มต้น
    document.getElementById('transactionDate').valueAsDate = new Date();
    document.getElementById('selectedType').value = 'expense';
    document.getElementById('typeExpense').classList.add('active');
    document.getElementById('typeIncome').classList.remove('active');

    modal.style.display = 'flex'; // แสดง Modal
}

// ฟังก์ชันเปิด Modal (สำหรับแก้ไขรายการ)
async function editTransaction(transactionId) {
    const userId = sessionStorage.getItem("loggedInUser");
    if (!userId) {
        alert('โปรดเข้าสู่ระบบก่อนแก้ไขรายการ');
        return;
    }

    try {
        // ดึงรายการทั้งหมดเพื่อหาข้อมูลของ transactionId ที่ต้องการแก้ไข
        const response = await fetch(`${BACKEND_URL}/api/transactions/${userId}`);
        const transactions = await response.json();
        if (!response.ok) {
            alert(transactions.message || 'ไม่สามารถดึงข้อมูลรายการเพื่อแก้ไขได้');
            return;
        }

        const transactionToEdit = transactions.find(t => t.id === transactionId);
        if (!transactionToEdit) {
            alert('ไม่พบรายการที่ต้องการแก้ไข');
            return;
        }

        // เติมข้อมูลลงในฟอร์ม
        document.getElementById('modalTitle').innerText = 'แก้ไขรายการ';
        document.getElementById('transactionId').value = transactionToEdit.id;
        document.getElementById('transactionAmount').value = transactionToEdit.amount;
        document.getElementById('transactionCategory').value = transactionToEdit.category;
        document.getElementById('transactionAccount').value = transactionToEdit.account;
        // แปลง Date object เป็น YYYY-MM-DD สำหรับ input type="date"
        document.getElementById('transactionDate').value = new Date(transactionToEdit.date).toISOString().split('T')[0];
        document.getElementById('transactionDescription').value = transactionToEdit.description;

        // ตั้งค่าปุ่มประเภท
        document.getElementById('selectedType').value = transactionToEdit.type;
        if (transactionToEdit.type === 'expense') {
            document.getElementById('typeExpense').classList.add('active');
            document.getElementById('typeIncome').classList.remove('active');
        } else {
            document.getElementById('typeIncome').classList.add('active');
            document.getElementById('typeExpense').classList.remove('active');
        }

        document.getElementById('transactionModal').style.display = 'flex'; // แสดง Modal
    } catch (error) {
        console.error('Error loading transaction for edit:', error);
        alert('เกิดข้อผิดพลาดในการโหลดข้อมูลเพื่อแก้ไข');
    }
}

// ฟังก์ชันปิด Modal
function closeTransactionModal() {
    const modal = document.getElementById('transactionModal');
    modal.style.display = 'none'; // ซ่อน Modal
    document.getElementById('transactionForm').reset(); // รีเซ็ตฟอร์ม
}

// ฟังก์ชันยืนยันการลบรายการ (ใช้ Modal แทน alert ในอนาคต)
function confirmDeleteTransaction(transactionId) {
    // แทนที่ด้วย Modal ยืนยันที่สวยงามกว่านี้ในอนาคต
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?')) {
        deleteTransaction(transactionId);
    }
}

// ฟังก์ชันลบรายการ
async function deleteTransaction(transactionId) {
    const userId = sessionStorage.getItem("loggedInUser");
    if (!userId) {
        alert('โปรดเข้าสู่ระบบก่อนลบรายการ');
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/api/transactions/${transactionId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: userId }) // ส่ง userId ไปด้วยเพื่อยืนยันสิทธิ์
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message || 'ลบรายการสำเร็จ!');
            // โหลดข้อมูลใหม่หลังจากลบสำเร็จ
            loadOverviewData();
            loadTransactions();
            loadSummaryData(document.querySelector('.summary-period-selector .period-button.active').dataset.period);
        } else {
            alert(data.message || 'เกิดข้อผิดพลาดในการลบรายการ. โปรดลองใหม่อีกครั้ง.');
        }
    } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('ไม่สามารถเชื่อมต่อกับ Backend เพื่อลบรายการได้');
    }
}


// Helper function เพื่อดึง SVG icon ตามหมวดหมู่
function getCategoryIcon(category) {
    switch (category) {
        case 'อาหาร': return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-utensils"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15v2a2 2 0 0 1-2 2H7"/><path d="M15 15v7"/></svg>`;
        case 'เดินทาง': return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-car"><path d="M19 17H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2Z"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>`;
        case 'บันเทิง': return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-music"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
        case 'เงินเดือน': return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-wallet"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h12a2 2 0 0 1 0 4H5a2 2 0 0 0 0 4h12c.78 0 1.53.39 2 1m0 0v2a1 1 0 0 1-1 1H5a2 2 0 0 1 0-4h12a2 2 0 0 0 0-4H5a2 2 0 0 0 0-4h12V7m-3 0V4m0 8v-2m0 8v-2"/></svg>`;
        case 'คืนเงิน': return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-receipt-text"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2h-2zm-2 0h-2c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h2V2zm18 0v20h2c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2h-2zM8 8h8M8 12h8M8 16h6"/></svg>`;
        case 'สัตว์เลี้ยง': return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bone"><path d="M17 10c.8 0 1.6.3 2.2.9C20.4 11.8 21 12.6 21 13.5c0 .8-.3 1.6-.9 2.2-.6.6-1.4.9-2.2.9-.8 0-1.6-.3-2.2-.9-.6-.6-.9-1.4-.9-2.2 0-.8.3-1.6.9-2.2.6-.6 1.4-.9 2.2-.9z"/><path d="M7 14c-.8 0-1.6-.3-2.2-.9C3.6 12.2 3 11.4 3 10.5c0-.8.3-1.6.9-2.2.6-.6 1.4-.9 2.2-.9.8 0 1.6.3 2.2.9.6.6.9 1.4.9 2.2 0 .8-.3 1.6-.9 2.2-.6.6-1.4.9-2.2.9z"/><path d="M10.5 13.5 13.5 10.5"/></svg>`;
        case 'ของใช้': return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shopping-bag"><path d="M6 2L3 7v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-3-5Z"/><path d="M3 7h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`;
        case 'บริการ': return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.78 1.22a2 2 0 0 0 .73 2.73l.04.02a2 2 0 0 1 .97 1.95v.44a2 2 0 0 1-.97 1.95l-.04.02a2 2 0 0 0-.73 2.73l.78 1.22a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.78-1.22a2 2 0 0 0-.73-2.73l-.04-.02a2 2 0 0 1-.97-1.95v-.44a2 2 0 0 1 .97-1.95l.04-.02a2 2 0 0 0 .73-2.73l-.78-1.22a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`;
        case 'ที่พัก': return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-home"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
        case 'ถูกยืม': return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-hand-coins"><path d="M11 11V2h3l3 3v2"/><path d="M17 11V2h3l3 3v2"/><path d="M2 12c.5 0 1 .5 1 1v2c0 .5-.5 1-1 1H1c-.5 0-1-.5-1-1v-2c0-.5.5-1 1-1h1zm10 0c.5 0 1 .5 1 1v2c0 .5-.5 1-1 1h-1c-.5 0-1-.5-1-1v-2c0-.5.5-1 1-1h1z"/><path d="M19 12c.5 0 1 .5 1 1v2c0 .5-.5 1-1 1h-1c-.5 0-1-.5-1-1v-2c0-.5.5-1 1-1h1z"/><path d="M12 15h1c.5 0 1 .5 1 1v2c0 .5-.5 1-1 1h-1c-.5 0-1-.5-1-1v-2c0-.5.5-1 1-1z"/><path d="M19 15h1c.5 0 1 .5 1 1v2c0 .5-.5 1-1 1h-1c-.5 0-1-.5-1-1v-2c0-.5.5-1 1-1z"/><path d="M21 15h1c.5 0 1 .5 1 1v2c0 .5-.5 1-1 1h-1c-.5 0-1-.5-1-1v-2c0-.5.5-1 1-1z"/><path d="M12 18h1c.5 0 1 .5 1 1v2c0 .5-.5 1-1 1h-1c-.5 0-1-.5-1-1v-2c0-.5.5-1 1-1z"/><path d="M19 18h1c.5 0 1 .5 1 1v2c0 .5-.5 1-1 1h-1c-.5 0-1-.5-1-1v-2c0-.5.5-1 1-1z"/><path d="M21 18h1c.5 0 1 .5 1 1v2c0 .5-.5 1-1 1h-1c-.5 0-1-.5-1-1v-2c0-.5.5-1 1-1z"/><path d="M12 21h1c.5 0 1 .5 1 1v2c0 .5-.5 1-1 1h-1c-.5 0-1-.5-1-1v-2c0-.5.5-1 1-1z"/><path d="M19 21h1c.5 0 1 .5 1 1v2c0 .5-.5 1-1 1h-1c-.5 0-1-.5-1-1v-2c0-.5.5-1 1-1z"/><path d="M21 21h1c.5 0 1 .5 1 1v2c0 .5-.5 1-1 1h-1c-.5 0-1-.5-1-1v-2c0-.5.5-1 1-1z"/></svg>`;
        case 'ค่ารักษา': return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart-pulse"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.2 12.8H2"/><path d="M22 12.8h-1.2"/><path d="M12.8 21.2V22"/><path d="M12.8 2v-1.2"/><path d="M10 10h.01"/><path d="M14 14h.01"/></svg>`;
        case 'บริจาค': return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-hand-heart"><path d="M11 11V2h3l3 3v2"/><path d="M17 11V2h3l3 3v2"/><path d="M2 12c.5 0 1 .5 1 1v2c0 .5-.5 1-1 1H1c-.5 0-1-.5-1-1v-2c0-.5.5-1 1-1h1zm10 0c.5 0 1 .5 1 1v2c0 .5-.5 1-1 1h-1c-.5 0-1-.5-1-1v-2c0-.5.5-1 1-1h1z"/><path d="M19 12c.5 0 1 .5 1 1v2c0 .5-.5 1-1 1h-1c-.5 0-1-.5-1-1v-2c0-.5.5-1 1-1h1z"/><path d="M12 15h1c.5 0 1 .5 1 1v2c0 .5-.5 1-1 1h-1c-.5 0-1-.5-1-1v-2c0-.5.5-1 1-1z"/><path d="M19 15h1c.5 0 1 .5 1 1v2c0 .5-.5 1-1 1h-1c-.5 0-1-.5-1-1v-2c0-.5.5-1 1-1z"/><path d="M21 15h1c.5 0 1 .5 1 1v2c0 .5-.5 1-1 1h-1c-.5 0-1-.5-1-1v-2c0-.5.5-1 1-1z"/><path d="M12 18h1c.5 0 1 .5 1 1v2c0 .5-.5 1-1 1h-1c-.5 0-1-.5-1-1v-2c0-.5.5-1 1-1z"/><path d="M19 18h1c.5 0 1 .5 1 1v2c0 .5-.5 1-1 1h-1c-.5 0-1-.5-1-1v-2c0-.5.5-1 1-1z"/><path d="M21 18h1c.5 0 1 .5 1 1v2c0 .5-.5 1-1 1h-1c-.5 0-1-.5-1-1v-2c0-.5.5-1 1-1z"/><path d="M12 21h1c.5 0 1 .5 1 1v2c0 .5-.5 1-1 1h-1c-.5 0-1-.5-1-1v-2c0-.5.5-1 1-1z"/><path d="M19 21h1c.5 0 1 .5 1 1v2c0 .5-.5 1-1 1h-1c-.5 0-1-.5-1-1v-2c0-.5.5-1 1-1z"/><path d="M21 21h1c.5 0 1 .5 1 1v2c0 .5-.5 1-1 1h-1c-.5 0-1-.5-1-1v-2c0-.5.5-1 1-1z"/></svg>`;
        case 'การศึกษา': return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-book-open"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`;
        case 'คนรัก': return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`;
        case 'เสื้อผ้า': return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shirt"><path d="M20.38 3.46L16 2a4 4 0 0 1-4 4V2H8a4 4 0 0 0-4 4v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5l-.26-.33a1 1 0 0 0-.07-.08Z"/></svg>`;
        case 'เครื่องสำอาง': return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-brush"><path d="M9.61 15.9l-6.93 6.92a2.12 2.12 0 0 1-3-3L6.69 12.99"/><path d="M12.5 5.2a2.12 2.12 0 0 1 3 3L9.61 15.9"/><path d="M17.6 15.8L22 11.4a2.12 2.12 0 0 0 0-3L19.6 5.4a2.12 2.12 0 0 0-3 0L12.5 12.5"/><path d="M7 17l-5 5"/><path d="M14 10l-2-2"/></svg>`;
        case 'เครื่องประดับ': return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-gem"><path d="M6 3h12l3 6-9 12-9-12z"/><path d="M12 15L3 6h18z"/></svg>`;
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
// กำหนดให้ปุ่ม "เพิ่มรายการ" ใน Today Summary เรียกฟังก์ชัน addNewTransaction
document.querySelector('.today-summary .add-item-button').onclick = addNewTransaction;
// กำหนดให้ปุ่มปิด Modal ทำงาน
document.querySelector('.modal .close-button').onclick = closeTransactionModal;

// ... (ภายในฟังก์ชัน showTab) ...
  const backButton = document.getElementById('backButton');
  if (backButton) {
      if (tabId === 'overview') {
          backButton.style.visibility = 'hidden'; // ซ่อนปุ่มย้อนกลับในหน้าภาพรวม
      } else {
          backButton.style.visibility = 'visible'; // แสดงปุ่มย้อนกลับในหน้าอื่น
      }
  }


// Logic สำหรับปุ่มสลับประเภท (รายจ่าย/รายรับ) ใน Modal
document.addEventListener('DOMContentLoaded', () => {
    const typeExpenseButton = document.getElementById('typeExpense');
    const typeIncomeButton = document.getElementById('typeIncome');
    const selectedTypeInput = document.getElementById('selectedType');
    const transactionForm = document.getElementById('transactionForm');

    if (typeExpenseButton) {
        typeExpenseButton.addEventListener('click', () => {
            typeExpenseButton.classList.add('active');
            typeIncomeButton.classList.remove('active');
            selectedTypeInput.value = 'expense';
        });
    }

    if (typeIncomeButton) {
        typeIncomeButton.addEventListener('click', () => {
            typeIncomeButton.classList.add('active');
            typeExpenseButton.classList.remove('active');
            selectedTypeInput.value = 'income';
        });
    }

    // เมื่อฟอร์มถูก Submit
    if (transactionForm) {
        transactionForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // ป้องกันการ Submit ฟอร์มแบบปกติ

            const userId = sessionStorage.getItem("loggedInUser");
            if (!userId) {
                alert('โปรดเข้าสู่ระบบก่อนบันทึกรายการ');
                return;
            }

            const transactionId = document.getElementById('transactionId').value; // มีค่าเมื่อแก้ไข
            const amount = document.getElementById('transactionAmount').value;
            const category = document.getElementById('transactionCategory').value;
            const type = document.getElementById('selectedType').value;
            const date = document.getElementById('transactionDate').value;
            const description = document.getElementById('transactionDescription').value;
            const account = document.getElementById('transactionAccount').value;

            if (!amount || !category || !type || !date || !account) {
                alert('โปรดกรอกข้อมูลที่จำเป็นให้ครบถ้วน (จำนวนเงิน, หมวดหมู่, บัญชี, วันที่)');
                return;
            }

            const method = transactionId ? 'PUT' : 'POST';
            const url = transactionId ? `${BACKEND_URL}/api/transactions/${transactionId}` : `${BACKEND_URL}/api/transactions`;

            try {
                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId,
                        amount: parseFloat(amount),
                        category,
                        type,
                        date,
                        description,
                        account
                    }),
                });

                const data = await response.json();

                if (response.ok) {
                    alert(data.message || 'บันทึกรายการสำเร็จ!');
                    closeTransactionModal(); // ปิด Modal
                    // โหลดข้อมูลใหม่หลังจากเพิ่ม/แก้ไขสำเร็จ
                    loadOverviewData();
                    loadTransactions();
                    // ตรวจสอบว่าแท็บสรุป active อยู่หรือไม่ก่อนโหลดข้อมูลสรุป
                    if (document.getElementById('summary-tab').classList.contains('active')) {
                        loadSummaryData(document.querySelector('.summary-period-selector .period-button.active').dataset.period);
                    }
                } else {
                    alert(data.message || 'เกิดข้อผิดพลาดในการบันทึกรายการ. โปรดลองใหม่อีกครั้ง.');
                }
            } catch (error) {
                console.error('Error saving transaction:', error);
                alert('ไม่สามารถเชื่อมต่อกับ Backend เพื่อบันทึกรายการได้');
            }
        });
    }

    // Logic สำหรับปุ่มเลือกช่วงเวลาในแท็บสรุป
    document.querySelectorAll('.summary-period-selector .period-button').forEach(button => {
        button.addEventListener('click', function() {
            const period = this.dataset.period;
            loadSummaryData(period);
        });
    });
});

// ปิด Modal เมื่อคลิกนอก Modal
window.onclick = function(event) {
    const modal = document.getElementById('transactionModal');
    if (event.target == modal) {
        closeTransactionModal();
    }
}