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

        if (userEmailDisplay) {
            userEmailDisplay.innerText = user.email || 'ผู้ใช้';
        }
        if (userProfilePicture && user.picture) {
            userProfilePicture.innerHTML = `<img src="${user.picture}" alt="Profile Picture">`;
        }
        setupAIChat(); // เรียกใช้ฟังก์ชันตั้งค่า AI Chat เมื่อหน้า home โหลด
    }
  }
}

// ฟังก์ชันสำหรับออกจากระบบ
function logout() {
  sessionStorage.removeItem("loggedInUser");
  if (google.accounts.id) {
    google.accounts.id.disableAutoSelect(); // สำหรับ Google Sign-In
  }
  window.location.href = "index.html"; // Redirect ไปหน้า login
}

// ฟังก์ชันสำหรับแสดง Custom Alert/Confirm Modal
function showCustomModal(title, message, isConfirm = false, onConfirm = null, onCancel = null) {
    const modal = document.getElementById('customAlertModal');
    const modalTitle = document.getElementById('customAlertTitle');
    const modalMessage = document.getElementById('customAlertMessage');
    const okButton = document.getElementById('customAlertOkButton');
    const cancelButton = document.getElementById('customAlertCancelButton');

    modalTitle.innerText = title;
    modalMessage.innerText = message;

    okButton.onclick = () => {
        modal.style.display = 'none';
        if (onConfirm) onConfirm();
    };

    if (isConfirm) {
        cancelButton.style.display = 'inline-block';
        cancelButton.onclick = () => {
            modal.style.display = 'none';
            if (onCancel) onCancel();
        };
    } else {
        cancelButton.style.display = 'none';
    }

    modal.style.display = 'flex'; // ใช้ flex เพื่อจัดกลาง
}

// Override alert และ confirm
window.alert = function(message) {
    showCustomModal('แจ้งเตือน', message);
};

window.confirm = function(message) {
    return new Promise((resolve) => {
        showCustomModal('ยืนยัน', message, true, () => resolve(true), () => resolve(false));
    });
};


// --- ฟังก์ชันการจัดการ UI และแท็บ ---

// ฟังก์ชันสำหรับสลับแท็บ
function showTab(tabName) {
  // ซ่อนทุกแท็บ
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  // ลบ active class ออกจากปุ่มทุกปุ่ม
  document.querySelectorAll('.tab-button').forEach(button => {
    button.classList.remove('active');
  });

  // แสดงแท็บที่เลือก
  document.getElementById(`${tabName}-tab`).classList.add('active');
  // เพิ่ม active class ให้กับปุ่มที่เลือก
  document.querySelector(`.tab-button[onclick="showTab('${tabName}')"]`).classList.add('active');

  // อัปเดตชื่อ Header ตามแท็บ
  const headerTitle = document.querySelector('.app-header .header-title');
  switch (tabName) {
    case 'overview':
      headerTitle.innerText = 'ภาพรวม';
      loadOverviewData(); // โหลดข้อมูลภาพรวมเมื่อกลับมาแท็บนี้
      break;
    case 'items':
      headerTitle.innerText = 'รายการ';
      loadTransactions(); // โหลดรายการเมื่อเข้าแท็บนี้
      break;
    case 'data':
      headerTitle.innerText = 'AI Chat'; // เปลี่ยนชื่อ Header สำหรับแท็บ AI Chat
      break;
    case 'summary':
      headerTitle.innerText = 'สรุป';
      // โหลดข้อมูลสรุปเริ่มต้นเมื่อเข้าแท็บนี้
      loadSummaryData(document.querySelector('.summary-period-selector .period-button.active').dataset.period);
      break;
    case 'menu':
      headerTitle.innerText = 'เมนู';
      break;
    default:
      headerTitle.innerText = 'แอปจัดการรายจ่าย';
  }
}

// --- ฟังก์ชันการจัดการข้อมูล (Mock/Backend) ---

// ฟังก์ชันสำหรับโหลดข้อมูลภาพรวม (สมมติ)
async function loadOverviewData() {
    const user = JSON.parse(sessionStorage.getItem("loggedInUser"));
    if (!user || !user.id) {
        console.error("User not logged in or user ID not found.");
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/transactions/overview/${user.id}`);
        const data = await response.json();

        if (response.ok) {
            document.getElementById('overviewDaysCount').innerText = `${data.daysCount} วัน`;
            document.getElementById('overviewItemsCount').innerText = `${data.itemsCount} รายการ`;
            document.getElementById('overviewCashBalance').innerText = data.cashBalance.toFixed(2);
            document.getElementById('overviewBankBalance').innerText = data.bankBalance.toFixed(2);
            document.getElementById('overviewReceivable').innerText = data.receivable.toFixed(2);
            document.getElementById('overviewDebt').innerText = data.debt.toFixed(2);
            document.getElementById('overviewCreditCard').innerText = data.creditCard.toFixed(2);
            document.getElementById('overviewCashBankTotal').innerText = (data.cashBalance + data.bankBalance).toFixed(2);
            document.getElementById('overviewOverallTotal').innerText = data.overallTotal.toFixed(2);

            document.getElementById('todayItemsCount').innerText = data.todaySummary.itemsCount;
            document.getElementById('todayIncome').innerText = data.todaySummary.income.toFixed(2);
            document.getElementById('todayExpense').innerText = data.todaySummary.expense.toFixed(2);
        } else {
            console.error('Failed to load overview data:', data.message);
        }
    } catch (error) {
        console.error('Error fetching overview data:', error);
    }
}

// ฟังก์ชันสำหรับโหลดรายการธุรกรรม
async function loadTransactions() {
    const user = JSON.parse(sessionStorage.getItem("loggedInUser"));
    if (!user || !user.id) {
        console.error("User not logged in or user ID not found.");
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/transactions/${user.id}`);
        const data = await response.json();

        const dailyItemsList = document.querySelector('.daily-items-list');
        dailyItemsList.innerHTML = ''; // Clear existing items

        if (response.ok && data.transactions.length > 0) {
            // Group transactions by date
            const groupedTransactions = data.transactions.reduce((acc, transaction) => {
                const date = transaction.date; // Assuming date is already in YYYY-MM-DD format
                if (!acc[date]) {
                    acc[date] = [];
                }
                acc[date].push(transaction);
                return acc;
            }, {});

            // Sort dates in descending order
            const sortedDates = Object.keys(groupedTransactions).sort((a, b) => new Date(b) - new Date(a));

            sortedDates.forEach(date => {
                const transactionsOnDate = groupedTransactions[date];
                let dailyIncome = 0;
                let dailyExpense = 0;

                transactionsOnDate.forEach(t => {
                    if (t.type === 'รายรับ') {
                        dailyIncome += t.amount;
                    } else if (t.type === 'รายจ่าย') {
                        dailyExpense += t.amount;
                    }
                });

                const netAmount = dailyIncome - dailyExpense;
                const netClass = netAmount < 0 ? 'expense' : 'income'; // Apply 'expense' class if net is negative

                const dailySection = document.createElement('div');
                dailySection.classList.add('daily-section');
                dailySection.innerHTML = `
                    <div class="daily-header">
                        <h4>${formatDateForDisplay(date)}</h4>
                        <span class="daily-summary-amount ${netClass}">${netAmount.toFixed(2)}</span>
                    </div>
                    <div class="transactions-on-date">
                        <!-- Transactions will be appended here -->
                    </div>
                `;
                const transactionsContainer = dailySection.querySelector('.transactions-on-date');

                // Sort transactions within each day by creation time (or any relevant timestamp)
                transactionsOnDate.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Assuming 'timestamp' field

                transactionsOnDate.forEach(transaction => {
                    const transactionItem = document.createElement('div');
                    transactionItem.classList.add('transaction-item');
                    transactionItem.innerHTML = `
                        <div class="transaction-icon">
                            <!-- Icon based on category or type -->
                            ${getCategoryIcon(transaction.category)}
                        </div>
                        <div class="transaction-details">
                            <div class="transaction-category">${transaction.category} (${transaction.account})</div>
                            <div class="transaction-description">${transaction.description || 'ไม่มีคำอธิบาย'}</div>
                        </div>
                        <div class="transaction-amount ${transaction.type === 'รายรับ' ? 'income' : 'expense'}">
                            ${transaction.type === 'รายรับ' ? '+' : '-'} ${transaction.amount.toFixed(2)}
                        </div>
                    `;
                    transactionItem.addEventListener('click', () => editTransaction(transaction));
                    transactionsContainer.appendChild(transactionItem);
                });
                dailyItemsList.appendChild(dailySection);
            });
        } else {
            dailyItemsList.innerHTML = '<p style="text-align: center; color: #666;">ยังไม่มีรายการธุรกรรม.</p>';
        }
    } catch (error) {
        console.error('Error fetching transactions:', error);
        dailyItemsList.innerHTML = '<p style="text-align: center; color: #e74c3c;">ไม่สามารถโหลดรายการธุรกรรมได้.</p>';
    }
}

// Helper function to format date for display (e.g., "วันนี้", "เมื่อวาน", "1 ม.ค. 2568")
function formatDateForDisplay(dateString) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const targetDate = new Date(dateString);

    if (targetDate.toDateString() === today.toDateString()) {
        return 'วันนี้';
    } else if (targetDate.toDateString() === yesterday.toDateString()) {
        return 'เมื่อวาน';
    } else {
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return targetDate.toLocaleDateString('th-TH', options);
    }
}

// Helper function to get category icon (you can expand this)
function getCategoryIcon(category) {
    // You can use different SVG icons or emojis based on category
    switch (category) {
        case 'อาหาร': return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-soup"><path d="M12 21V3"/><path d="M15 16a6 6 0 0 0-6 0"/><path d="M10 12h4"/><path d="M12 3a4 4 0 0 0-4 4v2a4 4 0 0 0 4 4h0a4 4 0 0 0 4-4V7a4 4 0 0 0-4-4Z"/></svg>';
        case 'เดินทาง': return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-car"><path d="M19 17H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2Z"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>';
        case 'เงินเดือน': return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-wallet"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h12a2 2 0 0 1 0 4H5a2 2 0 0 0 0 4h12a2 2 0 0 0 2-2v-3"/><path d="M10 12h.01"/></svg>';
        case 'ช้อปปิ้ง': return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shopping-bag"><path d="M6 2L3 7v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-3-5Z"/><path d="M3 7h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>';
        case 'บันเทิง': return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-gamepad"><path d="M6 12H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2"/><path d="M18 12h2a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-2"/><path d="M12 18V20a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2"/><path d="M12 6V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v2"/><path d="M12 10h.01"/><path d="M12 14h.01"/></svg>';
        default: return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle"><circle cx="12" cy="12" r="10"/></svg>'; // Generic circle
    }
}


// ฟังก์ชันสำหรับเปิด Modal เพิ่ม/แก้ไขรายการ
function addNewTransaction(transaction = null) {
    const modal = document.getElementById('transactionModal');
    const form = document.getElementById('transactionForm');

    // Reset form
    form.reset();
    document.getElementById('transactionId').value = '';

    if (transaction) {
        // Populate form for editing
        document.getElementById('transactionId').value = transaction.id;
        document.getElementById('transactionType').value = transaction.type;
        document.getElementById('transactionAmount').value = transaction.amount;
        document.getElementById('transactionCategory').value = transaction.category;
        document.getElementById('transactionAccount').value = transaction.account;
        document.getElementById('transactionDate').value = transaction.date;
        document.getElementById('transactionDescription').value = transaction.description;
    } else {
        // Set default date to today for new transactions
        document.getElementById('transactionDate').valueAsDate = new Date();
    }

    modal.style.display = 'flex'; // ใช้ flex เพื่อจัดกลาง
}

// ฟังก์ชันสำหรับแก้ไขรายการ
function editTransaction(transaction) {
    addNewTransaction(transaction); // ใช้ฟังก์ชันเดิมเพื่อ populate form
}

// ฟังก์ชันสำหรับปิด Modal
function closeTransactionModal() {
    document.getElementById('transactionModal').style.display = 'none';
}

// ฟังก์ชันสำหรับโหลดข้อมูลสรุป
async function loadSummaryData(period) {
    const user = JSON.parse(sessionStorage.getItem("loggedInUser"));
    if (!user || !user.id) {
        console.error("User not logged in or user ID not found.");
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/transactions/summary/${user.id}?period=${period}`);
        const data = await response.json();

        if (response.ok) {
            document.getElementById('summaryNetIncome').innerText = data.netIncome.toFixed(2);
            document.getElementById('summaryNetExpense').innerText = data.netExpense.toFixed(2);
            document.getElementById('summaryBalance').innerText = data.balance.toFixed(2);

            const expenseBreakdown = document.getElementById('expenseCategoryBreakdown');
            expenseBreakdown.innerHTML = '';
            if (Object.keys(data.expenseBreakdown).length > 0) {
                for (const category in data.expenseBreakdown) {
                    const item = document.createElement('div');
                    item.classList.add('category-item');
                    item.innerHTML = `
                        <span class="category-name">${category}</span>
                        <span class="category-amount expense">${data.expenseBreakdown[category].toFixed(2)}</span>
                    `;
                    expenseBreakdown.appendChild(item);
                }
            } else {
                expenseBreakdown.innerHTML = '<p style="text-align: center; color: #666;">ยังไม่มีรายจ่ายในหมวดหมู่นี้.</p>';
            }

            const incomeBreakdown = document.getElementById('incomeCategoryBreakdown');
            incomeBreakdown.innerHTML = '';
            if (Object.keys(data.incomeBreakdown).length > 0) {
                for (const category in data.incomeBreakdown) {
                    const item = document.createElement('div');
                    item.classList.add('category-item');
                    item.innerHTML = `
                        <span class="category-name">${category}</span>
                        <span class="category-amount income">${data.incomeBreakdown[category].toFixed(2)}</span>
                    `;
                    incomeBreakdown.appendChild(item);
                }
            } else {
                incomeBreakdown.innerHTML = '<p style="text-align: center; color: #666;">ยังไม่มีรายรับในหมวดหมู่นี้.</p>';
            }

            // Update active period button
            document.querySelectorAll('.summary-period-selector .period-button').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector(`.summary-period-selector .period-button[data-period="${period}"]`).classList.add('active');

        } else {
            console.error('Failed to load summary data:', data.message);
            document.getElementById('summaryNetIncome').innerText = '0.00';
            document.getElementById('summaryNetExpense').innerText = '0.00';
            document.getElementById('summaryBalance').innerText = '0.00';
            document.getElementById('expenseCategoryBreakdown').innerHTML = '<p style="text-align: center; color: #666;">ไม่สามารถโหลดข้อมูลสรุปได้.</p>';
            document.getElementById('incomeCategoryBreakdown').innerHTML = '<p style="text-align: center; color: #666;">ไม่สามารถโหลดข้อมูลสรุปได้.</p>';
        }
    } catch (error) {
        console.error('Error fetching summary data:', error);
        document.getElementById('summaryNetIncome').innerText = '0.00';
        document.getElementById('summaryNetExpense').innerText = '0.00';
        document.getElementById('summaryBalance').innerText = '0.00';
        document.getElementById('expenseCategoryBreakdown').innerHTML = '<p style="text-align: center; color: #e74c3c;">ไม่สามารถเชื่อมต่อกับ Backend เพื่อโหลดข้อมูลสรุปได้.</p>';
        document.getElementById('incomeCategoryBreakdown').innerHTML = '<p style="text-align: center; color: #e74c3c;">ไม่สามารถเชื่อมต่อกับ Backend เพื่อโหลดข้อมูลสรุปได้.</p>';
    }
}


// --- AI Chatbot Functions ---
let chatHistory = [{ role: "model", parts: [{ text: "สวัสดีค่ะ! มีอะไรให้ช่วยไหมคะ?" }] }]; // เก็บประวัติการสนทนา

function setupAIChat() {
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendButton');
    const chatMessages = document.getElementById('chatMessages');

    // Clear initial AI message if it's the only one and not the default
    if (chatHistory.length === 1 && chatHistory[0].parts[0].text === "สวัสดีค่ะ! มีอะไรให้ช่วยไหมคะ?") {
        // Do nothing, keep the initial message
    } else {
        // If there's existing history, render it
        renderChatHistory();
    }


    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Scroll to bottom when chat is opened
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function renderChatHistory() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = ''; // Clear current messages

    chatHistory.forEach(msg => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', msg.role === 'user' ? 'user-message' : 'ai-message');
        messageElement.innerHTML = `<div class="message-bubble">${msg.parts[0].text}</div>`;
        chatMessages.appendChild(messageElement);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to the latest message
}

async function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const userMessageText = chatInput.value.trim();

    if (userMessageText === '') {
        return;
    }

    // Add user message to UI
    const userMessageElement = document.createElement('div');
    userMessageElement.classList.add('chat-message', 'user-message');
    userMessageElement.innerHTML = `<div class="message-bubble">${userMessageText}</div>`;
    chatMessages.appendChild(userMessageElement);

    // Add user message to chat history
    chatHistory.push({ role: "user", parts: [{ text: userMessageText }] });

    chatInput.value = ''; // Clear input field
    chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom

    loadingIndicator.style.display = 'flex'; // Show loading indicator

    try {
        const payload = { contents: chatHistory };
        const apiKey = ""; // Canvas will automatically provide the API key
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        let response;
        let result;
        let retries = 0;
        const maxRetries = 5;
        const initialDelay = 1000; // 1 second

        while (retries < maxRetries) {
            try {
                response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.status === 429) { // Too Many Requests
                    retries++;
                    const delay = initialDelay * Math.pow(2, retries - 1);
                    console.warn(`Too many requests. Retrying in ${delay / 1000} seconds... (Attempt ${retries}/${maxRetries})`);
                    await new Promise(res => setTimeout(res, delay));
                    continue; // Try fetching again
                }

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`API error: ${response.status} ${response.statusText} - ${errorData.error.message}`);
                }

                result = await response.json();
                break; // Success, exit loop
            } catch (error) {
                if (retries < maxRetries - 1) {
                    retries++;
                    const delay = initialDelay * Math.pow(2, retries - 1);
                    console.error(`Fetch error: ${error.message}. Retrying in ${delay / 1000} seconds... (Attempt ${retries}/${maxRetries})`);
                    await new Promise(res => setTimeout(res, delay));
                } else {
                    throw error; // Re-throw if max retries reached
                }
            }
        }

        if (!result) {
            throw new Error("No response from AI after multiple retries.");
        }

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const aiResponseText = result.candidates[0].content.parts[0].text;

            // Add AI message to UI
            const aiMessageElement = document.createElement('div');
            aiMessageElement.classList.add('chat-message', 'ai-message');
            aiMessageElement.innerHTML = `<div class="message-bubble">${aiResponseText}</div>`;
            chatMessages.appendChild(aiMessageElement);

            // Add AI message to chat history
            chatHistory.push({ role: "model", parts: [{ text: aiResponseText }] });

        } else {
            console.error('Unexpected AI response structure:', result);
            const errorMessageElement = document.createElement('div');
            errorMessageElement.classList.add('chat-message', 'ai-message');
            errorMessageElement.innerHTML = `<div class="message-bubble">ขออภัยค่ะ ไม่สามารถรับคำตอบจาก AI ได้ในขณะนี้.</div>`;
            chatMessages.appendChild(errorMessageElement);
            chatHistory.push({ role: "model", parts: [{ text: "ขออภัยค่ะ ไม่สามารถรับคำตอบจาก AI ได้ในขณะนี้." }] });
        }
    } catch (error) {
        console.error('Error sending message to AI:', error);
        const errorMessageElement = document.createElement('div');
        errorMessageElement.classList.add('chat-message', 'ai-message');
        errorMessageElement.innerHTML = `<div class="message-bubble">เกิดข้อผิดพลาดในการเชื่อมต่อ AI: ${error.message}.</div>`;
        chatMessages.appendChild(errorMessageElement);
        chatHistory.push({ role: "model", parts: [{ text: `เกิดข้อผิดพลาดในการเชื่อมต่อ AI: ${error.message}.` }] });
    } finally {
        loadingIndicator.style.display = 'none'; // Hide loading indicator
        chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom again
    }
}


// Event listener for when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Attach event listener for transaction form submission
    const transactionForm = document.getElementById('transactionForm');
    if (transactionForm) {
        transactionForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default form submission

            const transactionId = document.getElementById('transactionId').value;
            const type = document.getElementById('transactionType').value;
            const amount = parseFloat(document.getElementById('transactionAmount').value);
            const category = document.getElementById('transactionCategory').value;
            const account = document.getElementById('transactionAccount').value;
            const date = document.getElementById('transactionDate').value;
            const description = document.getElementById('transactionDescription').value;
            const user = JSON.parse(sessionStorage.getItem("loggedInUser"));

            if (!user || !user.id) {
                alert('ไม่พบข้อมูลผู้ใช้. กรุณาเข้าสู่ระบบใหม่.');
                return;
            }

            const transactionData = {
                id: transactionId, // Will be empty string for new transactions
                userId: user.id,
                type,
                amount,
                category,
                account,
                date,
                description,
                timestamp: new Date().toISOString() // Add timestamp for sorting
            };

            const url = transactionId ? `${BACKEND_URL}/transactions/${transactionId}` : `${BACKEND_URL}/transactions`;
            const method = transactionId ? 'PUT' : 'POST';

            try {
                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(transactionData),
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
    const customAlertModal = document.getElementById('customAlertModal');
    if (event.target == modal) {
        closeTransactionModal();
    }
    if (event.target == customAlertModal) {
        customAlertModal.style.display = 'none';
    }
}
