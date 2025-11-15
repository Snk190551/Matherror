// app.js

// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, addDoc, collection, onSnapshot, query, serverTimestamp, updateDoc, orderBy, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- Global Variables & Firebase Setup ---
let app, db, auth;
let unsubscribeFromTransactions = null;
let confirmCallback = null;

const GOAL_DOC_ID = 'user_goal'; // Document ID for the single goal per user

const firebaseConfig = {
  apiKey: "AIzaSyC6d1_FmSvfrnhpqFxdKrg-bleCVC5XkUM",
  authDomain: "app-math-465713.firebaseapp.com",
  projectId: "app-math-465713",
  storageBucket: "app-math-465713.firebasestorage.app",
  messagingSenderId: "896330929514",
  appId: "1:896330929514:web:f2aa9442ab19a3f7574113",
  measurementId: "G-8H400D8BHL"
};
const appId = firebaseConfig.projectId;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
}
catch (error) {
    console.error("Firebase initialization failed:", error);
}

// --- Modal Functions ---
window.showModal = function(title, message) {
    const modal = document.getElementById('message-modal');
    if (modal) {
        modal.querySelector('#modal-title').textContent = title;
        modal.querySelector('#modal-message').textContent = message;
        modal.style.display = 'flex';
    }
};
window.hideModal = function() {
    const modal = document.getElementById('message-modal');
    if (modal) modal.style.display = 'none';
};
function showConfirmationModal(title, message, onConfirm) {
    const modal = document.getElementById('confirmation-modal');
    if (modal) {
        modal.querySelector('#confirmation-title').textContent = title;
        modal.querySelector('#confirmation-message').textContent = message;
        confirmCallback = onConfirm;
        modal.style.display = 'flex';
    }
}
function hideConfirmationModal() {
    const modal = document.getElementById('confirmation-modal');
    if (modal) {
        modal.style.display = 'none';
        confirmCallback = null;
    }
}

// --- Investment News Data (Curated List) ---
const investmentNews = [
    {
        title: "ช่วงคืน 3 ส.ค. 68 เกิด “ลูกไฟสีเขียวใหญ่บนฟ้า” หลายพื้นที่ในไทย อาจเป็น “ดาวตกชนิดระเบิด”",
        imageUrl: "https://d3dyak49qszsk5.cloudfront.net/040868_738c0b412a.jpg",
        linkUrl: "https://www.thaipbs.or.th/now/content/2984",
        source: "ข่าว"
    },
    {
        title: "ราคาทองวันนี้ ปรับลง 50 บาท รีบตัดสินใจ \"ควรซื้อหรือขาย\"",
        imageUrl: "https://placehold.co/600x400/FACC15/000000?text=ราคาทอง",
        linkUrl: "https://www.thairath.co.th/money/investment/golds/2791888",
        source: "Thairath Money"
    },
    {
        title: "เจาะ 5 หุ้นลิสซิ่ง กำไรฟื้นเด่นน่าลงทุน",
        imageUrl: "https://placehold.co/600x400/2563EB/FFFFFF?text=หุ้นลิสซิ่ง",
        linkUrl: "https://www.bangkokbiznews.com/finance/investment/1131189",
        source: "กรุงเทพธุรกิจ"
    },
    {
        title: "รู้จัก 5 เรื่องต้องระวัง ลงทุน 'หุ้นกู้' อย่างไรไม่ให้พลาด",
        imageUrl: "https://placehold.co/600x400/9333EA/FFFFFF?text=หุ้นกู้",
        linkUrl: "https://www.thairath.co.th/money/investment/stocks/2791928",
        source: "Thairath Money"
    },
    {
        title: "Bitcoin Halving คืออะไร? ทำไมนักลงทุนทั่วโลกจับตา",
        imageUrl: "https://placehold.co/600x400/F97316/FFFFFF?text=Bitcoin",
        linkUrl: "https://brandinside.asia/what-is-bitcoin-halving-why-investor-watch/",
        source: "Brand Inside"
    },
    {
        title: "ทิศทางตลาดอสังหาฯ ครึ่งปีหลัง คอนโดฯ กลางเมืองยังน่าสน",
        imageUrl: "https://placehold.co/600x400/0891B2/FFFFFF?text=คอนโด",
        linkUrl: "https://www.bangkokbiznews.com/property/1109968",
        source: "กรุงเทพธุรกิจ"
    },
    {
        title: "มือใหม่เริ่มลงทุนกองทุนรวมอย่างไร? รวมขั้นตอนง่ายๆ",
        imageUrl: "https://placehold.co/600x400/65A30D/FFFFFF?text=มือใหม่ลงทุน",
        linkUrl: "https://www.moneybuffalo.in.th/investment/how-to-start-invest-in-mutual-fund",
        source: "Money Buffalo"
    },
    {
        title: "ต่างชาติแห่ลงทุน EEC ยอดทะลุเป้าหมาย โอกาสโตต่อเนื่อง",
        imageUrl: "https://placehold.co/600x400/BE185D/FFFFFF?text=EEC",
        linkUrl: "https://www.prachachat.net/economy/news-1533036",
        source: "ประชาชาติธุรกิจ"
    }
];


// --- Core App Functions ---
async function setInflationRate() {
    const inflationInput = document.getElementById('inflation-rate');
    const inflationStatus = document.getElementById('inflation-status');

    if (!inflationInput || !inflationStatus) return;

    inflationStatus.textContent = 'กำลังโหลดข้อมูล...';

    try {
        await new Promise(resolve => setTimeout(resolve, 500));
        const recentInflationRate = -0.72;
        const dataYear = 2024;
        inflationInput.value = recentInflationRate.toFixed(2);
        inflationStatus.textContent = `ข้อมูลอ้างอิงปี ${dataYear}`;
    } catch (error) {
        console.error('Error setting inflation rate:', error);
        inflationStatus.textContent = 'เกิดข้อผิดพลาด';
        inflationInput.value = '3.0';
    } finally {
        startTransactionListener();
    }
}
async function handleDeleteTransaction(transactionId) {
    if (!auth.currentUser || !transactionId) return;
    try {
        const transactionRef = doc(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'transactions', transactionId);
        await deleteDoc(transactionRef);
        showModal("สำเร็จ", "ลบรายการเรียบร้อยแล้ว");
    } catch (error) {
        console.error("Error deleting document: ", error);
        showModal("ข้อผิดพลาด", "ไม่สามารถลบรายการได้");
    }
}
function renderTransactionsUI(transactions = []) {
    const listEl = document.getElementById('transactions-list');
    const incomeEl = document.getElementById('total-income');
    const expenseEl = document.getElementById('total-expense');
    const balanceEl = document.getElementById('total-balance');
    const inflationRateInput = document.getElementById('inflation-rate');

    if (!listEl || !incomeEl || !expenseEl || !balanceEl) return;

    listEl.innerHTML = '';
    let totalIncome = 0, totalExpense = 0;
    const inflationRate = parseFloat(inflationRateInput?.value ||-0.72) / 100;
    const currentDate = new Date();

    transactions.forEach(tx => {
        const txDate = new Date(tx.date);
        const diffYears = (currentDate - txDate) / (1000 * 60 * 60 * 24 * 365.25);
        const adjustedAmount = tx.amount * Math.pow(1 + inflationRate, diffYears);

        if (tx.type === 'income') totalIncome += adjustedAmount;
        else totalExpense += adjustedAmount;

        const typeClass = tx.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
        const sign = tx.type === 'income' ? '+' : '-';
        const deleteButton = `<button data-id="${tx.id}" class="delete-btn text-red-400 hover:text-red-600 p-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/><path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/></svg></button>`;
        const itemDiv = document.createElement('div');
        itemDiv.className = `flex justify-between items-center p-4 rounded-xl shadow-sm mb-2 ${typeClass}`;
        itemDiv.innerHTML = `
            <div class="flex items-center space-x-4">
                ${deleteButton}
                <div>
                    <div class="text-lg font-semibold">${tx.category}</div>
                    <div class="text-sm text-gray-500">${new Date(tx.date).toLocaleDateString('th-TH')}</div>
                </div>
            </div>
            <div class="text-right">
                <div class="font-bold text-lg">${tx.amount.toLocaleString('th-TH', { maximumFractionDigits: 2 })} บาท</div>
               <div class="text-xs text-gray-400 mt-1">(มูลค่าเงินใน1ปีข้างหน้า: ${adjustedAmount.toLocaleString('th-TH', { maximumFractionDigits: 2 })} บาท)</div>
            </div>`;
        listEl.appendChild(itemDiv);
    });

    const totalBalance = totalIncome - totalExpense;
    incomeEl.textContent = `${totalIncome.toLocaleString('th-TH', { maximumFractionDigits: 2 })} บาท`;
    expenseEl.textContent = `${totalExpense.toLocaleString('th-TH', { maximumFractionDigits: 2 })} บาท`;
    balanceEl.textContent = `${totalBalance.toLocaleString('th-TH', { maximumFractionDigits: 2 })} บาท`;
}

function startTransactionListener() {
    if (unsubscribeFromTransactions) unsubscribeFromTransactions();
    if (auth.currentUser) {
        const transactionsRef = collection(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'transactions');
        const q = query(transactionsRef, orderBy('date', 'desc'));
        unsubscribeFromTransactions = onSnapshot(q, (snapshot) => {
            const transactionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderTransactionsUI(transactionsData);
        });
    } else {
        renderTransactionsUI([]);
    }
}

// --- Goal Functions for about.html ---

/**
 * Calculates the predicted goal attainment date based on average daily savings.
 * @param {number} initialAmount - The starting amount when the goal was created.
 * @param {number} targetAmount - The final target amount.
 * @param {number} daysPassed - The number of days since the goal was created.
 * @param {number} totalSaved - The total amount saved since the goal was created (current - initial).
 */
function calculateAttainmentDate(initialAmount, targetAmount, daysPassed, totalSaved) {
    if (targetAmount <= initialAmount) return { arithmetic: "บรรลุเป้าหมายแล้ว!", geometric: "บรรลุเป้าหมายแล้ว!", avgDaily: 0 };
    
    const remainingAmount = targetAmount - initialAmount;
    let avgDailySaving = 0;
    let attainmentDate = { arithmetic: 'คำนวณไม่ได้', geometric: 'คำนวณไม่ได้', avgDaily: 0 };
    
    if (daysPassed > 0 && totalSaved > 0) {
        avgDailySaving = totalSaved / daysPassed;
        attainmentDate.avgDaily = avgDailySaving;

        // 1. Arithmetic Progression (Fixed saving per day)
        const daysToComplete = (targetAmount - (initialAmount + totalSaved)) / avgDailySaving;
        const completionDate = new Date();
        completionDate.setDate(completionDate.getDate() + Math.ceil(daysToComplete));
        attainmentDate.arithmetic = completionDate.toLocaleDateString('th-TH', { dateStyle: 'long' });
        
        // 2. Geometric Approximation (Assume 5% faster due to compound/growth effect for simple display)
        const daysGeometric = daysToComplete / 1.05; 
        const completionDateGeometric = new Date();
        completionDateGeometric.setDate(completionDateGeometric.getDate() + Math.ceil(daysGeometric));
        attainmentDate.geometric = completionDateGeometric.toLocaleDateString('th-TH', { dateStyle: 'long' });

    } else if (daysPassed > 0 && totalSaved === 0) {
        attainmentDate.avgDaily = 0;
        attainmentDate.arithmetic = "ยังไม่มีการบันทึกเงินออม";
        attainmentDate.geometric = "ยังไม่มีการบันทึกเงินออม";
    } else {
        attainmentDate.avgDaily = 0;
        attainmentDate.arithmetic = "ยังไม่มีการบันทึกเงินออม";
        attainmentDate.geometric = "ยังไม่มีการบันทึกเงินออม";
    }
    
    return attainmentDate;
}

/**
 * Renders the goal status or the creation form based on the goal data.
 * @param {object|null} goal - The goal object from Firestore, or null if no goal exists.
 */
function renderGoalUI(goal) {
    const goalStatusContainer = document.getElementById('goal-status-container');
    const goalFormContainer = document.getElementById('goal-form-container');
    const saveMoneyContainer = document.getElementById('save-money-container'); 

    if (!goal) {
        // No goal exists: Show form, hide status
        goalStatusContainer?.classList.add('hidden');
        goalFormContainer?.classList.remove('hidden');
        document.getElementById('goal-form-title').textContent = 'สร้างเป้าหมายใหม่';
        document.getElementById('goal-submit-btn').textContent = 'บันทึกเป้าหมาย';
        document.getElementById('goal-id').value = '';
        document.getElementById('goal-form')?.reset();
        saveMoneyContainer?.classList.add('hidden'); 
        return;
    }
    
    // Goal exists: Hide form, show status
    goalFormContainer?.classList.add('hidden');
    goalStatusContainer?.classList.remove('hidden');
    saveMoneyContainer?.classList.remove('hidden'); 

    const target = goal.targetAmount || 0;
    let current = goal.currentAmount || 0;

    // Check if the current amount is greater than the target amount (goal reached)
    if (current > target) {
        current = target; // Ensure progress bar doesn't exceed 100% easily
    }
    
    // Handle date calculation for prediction
    const createdDate = goal.createdAt?.toDate ? goal.createdAt.toDate() : new Date();
    // Calculate days passed since creation until now
    const now = new Date();
    // Calculate days passed, must be at least 1 day if goal exists, or 0 if same day
    const daysPassed = Math.max(0, Math.ceil((now - createdDate) / (1000 * 60 * 60 * 24)));
    const totalSaved = (goal.currentAmount || 0) - (goal.initialAmount || 0);

    const remaining = Math.max(0, target - (goal.currentAmount || 0));
    const percent = target > 0 ? Math.min(100, (goal.currentAmount / target) * 100) : 0;
    const attainment = calculateAttainmentDate(goal.initialAmount || 0, target, daysPassed, totalSaved);

    // Update Display Elements
    document.getElementById('display-goal-name').textContent = goal.name || 'ไม่มีชื่อเป้าหมาย';
    document.getElementById('display-target-amount').textContent = target.toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท';
    document.getElementById('display-current-amount').textContent = (goal.currentAmount || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท';
    document.getElementById('display-remaining-amount').textContent = remaining.toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท';
    document.getElementById('display-progress-percent').textContent = percent.toFixed(2) + '%';
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) progressBar.style.width = `${percent}%`;

    // Update Prediction Results
    document.getElementById('display-avg-daily').textContent = attainment.avgDaily.toLocaleString('th-TH', { maximumFractionDigits: 2 });
    document.getElementById('result-arithmetic').textContent = attainment.arithmetic;
    document.getElementById('result-geometric').textContent = attainment.geometric;

    // Pre-fill form for editing (hidden state)
    document.getElementById('goal-id').value = GOAL_DOC_ID; 
    document.getElementById('goal-name').value = goal.name || '';
    document.getElementById('target-amount').value = target.toFixed(2);
    document.getElementById('current-amount').value = (goal.currentAmount || 0).toFixed(2);
}

function startGoalListener() {
    if (!auth.currentUser) return;

    // แก้ไขตรงนี้: เปลี่ยน Collection จาก 'goals' เป็น 'goal' (เอกพจน์)
    const goalRef = doc(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'goal', GOAL_DOC_ID);
    
    onSnapshot(goalRef, (docSnap) => {
        if (docSnap.exists()) {
            renderGoalUI({ id: docSnap.id, ...docSnap.data() });
        } else {
            renderGoalUI(null);
        }
    });
}

// ฟังก์ชันสำหรับบันทึก/แก้ไขเป้าหมาย
async function handleGoalFormSubmit(e) {
    e.preventDefault();
    if (!auth.currentUser) return showModal("ข้อผิดพลาด", "โปรดเข้าสู่ระบบก่อนบันทึกเป้าหมาย");

    const isEditing = document.getElementById('goal-id').value;
    const goalName = document.getElementById('goal-name').value.trim();
    const targetAmount = parseFloat(document.getElementById('target-amount').value);
    const currentAmount = parseFloat(document.getElementById('current-amount').value);

    if (targetAmount < 0.01 || currentAmount < 0) return showModal("ข้อผิดพลาด", "ยอดเงินเป้าหมายต้องมากกว่า 0.01 และยอดเงินเริ่มต้นต้องไม่ติดลบ");

    const goalRef = doc(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'goals', GOAL_DOC_ID);
    
    try {
        if (isEditing) {
            // Editing existing goal (update)
            // ใช้ updateDoc เพื่ออัปเดตเฉพาะ field ที่เปลี่ยนแปลง
            await updateDoc(goalRef, { 
                name: goalName,
                targetAmount: targetAmount,
                currentAmount: currentAmount,
                updatedAt: serverTimestamp() // อัปเดต timestamp
            });
            showModal("สำเร็จ", "แก้ไขเป้าหมายเรียบร้อยแล้ว");
        } else {
            // Creating new goal (set)
            await setDoc(goalRef, {
                name: goalName,
                targetAmount: targetAmount,
                currentAmount: currentAmount,
                initialAmount: currentAmount, // initialAmount is the amount when the goal was first set
                createdAt: serverTimestamp()
            });
            showModal("สำเร็จ", "สร้างเป้าหมายเรียบร้อยแล้ว");
        }
    } catch (error) {
        console.error("Error saving goal: ", error);
        showModal("ข้อผิดพลาด", "ไม่สามารถบันทึกเป้าหมายได้");
    }
}

// ฟังก์ชันสำหรับบันทึกเงินออมเพิ่มเติม
async function handleSaveMoney(e) {
    e.preventDefault();
    if (!auth.currentUser) return showModal("ข้อผิดพลาด", "โปรดเข้าสู่ระบบก่อนบันทึกเงินออม");
    
    const saveAmountInput = document.getElementById('save-amount');
    const saveAmount = parseFloat(saveAmountInput.value);

    if (saveAmount <= 0 || isNaN(saveAmount)) return showModal("ข้อผิดพลาด", "โปรดระบุจำนวนเงินออมที่ถูกต้อง");

    const goalRef = doc(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'goals', GOAL_DOC_ID);
    try {
        const goalDoc = await getDoc(goalRef);
        if (!goalDoc.exists()) {
            saveAmountInput.value = '';
            return showModal("ข้อผิดพลาด", "คุณยังไม่ได้สร้างเป้าหมาย");
        }
        
        const currentAmount = goalDoc.data().currentAmount || 0;
        const newAmount = currentAmount + saveAmount;

        await updateDoc(goalRef, {
            currentAmount: newAmount,
            updatedAt: serverTimestamp()
        });

        showModal("สำเร็จ", `บันทึกเงินออม ${saveAmount.toLocaleString('th-TH', { maximumFractionDigits: 2 })} บาทเรียบร้อยแล้ว`);
        saveAmountInput.value = '';
    } catch (error) {
        console.error("Error saving money: ", error);
        showModal("ข้อผิดพลาด", "ไม่สามารถบันทึกเงินออมได้");
    }
}


// --- Page Initialization Functions ---
function initHomePage() {
    const transactionForm = document.getElementById('transaction-form');
    const transactionsListContainer = document.getElementById('transactions-list');

    transactionForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!auth.currentUser) return showModal("ข้อผิดพลาด", "โปรดเข้าสู่ระบบก่อนบันทึกรายการ");
        try {
            const transactionsRef = collection(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'transactions');
            await addDoc(transactionsRef, {
                date: document.getElementById('date').value,
                type: document.getElementById('type').value,
                category: document.getElementById('category').value,
                amount: parseFloat(document.getElementById('amount').value),
                createdAt: serverTimestamp()
            });
            showModal("สำเร็จ", "บันทึกรายการเรียบร้อยแล้ว");
            transactionForm.reset();
            document.getElementById('date').valueAsDate = new Date();
        } catch (error) {
            showModal("ข้อผิดพลาด", "ไม่สามารถบันทึกรายการได้");
        }
    });
    
    transactionsListContainer?.addEventListener('click', (e) => {
        const deleteButton = e.target.closest('.delete-btn');
        if (deleteButton) {
            const transactionId = deleteButton.dataset.id;
            showConfirmationModal('ยืนยันการลบ', 'คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?', () => {
                handleDeleteTransaction(transactionId);
            });
        }
    });

    const dateInput = document.getElementById('date');
    if (dateInput) dateInput.valueAsDate = new Date();
    
    setInflationRate();
}

function initLoginPage() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showLoginBtn = document.getElementById('show-login-btn');
    const showRegisterBtn = document.getElementById('show-register-btn');
    const loginContainer = document.getElementById('login-container');
    const registerContainer = document.getElementById('register-container');

    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, document.getElementById('login-email').value, document.getElementById('login-password').value);
        } catch (error) {
            showModal("เข้าสู่ระบบล้มเหลว", "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        }
    });

    registerForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const username = document.getElementById('register-username').value;
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const userDocRef = doc(db, 'artifacts', appId, 'users', userCredential.user.uid);
            await setDoc(userDocRef, { username, email, createdAt: serverTimestamp() });
            showModal("สำเร็จ", "สมัครสมาชิกเรียบร้อยแล้ว กรุณาเข้าสู่ระบบ");
            loginContainer.classList.remove('hidden');
            registerContainer.classList.add('hidden');
        } catch (error) {
            showModal("สมัครสมาชิกล้มเหลว", "อีเมลนี้อาจถูกใช้ไปแล้ว หรือรหัสผ่านสั้นเกินไป");
        }
    });

    showLoginBtn?.addEventListener('click', (e) => { e.preventDefault(); loginContainer.classList.remove('hidden'); registerContainer.classList.add('hidden'); });
    showRegisterBtn?.addEventListener('click', (e) => { e.preventDefault(); registerContainer.classList.remove('hidden'); loginContainer.classList.add('hidden'); });
}

function initAboutPage() {
    const logoutBtn = document.getElementById('logout-btn');
    const goalForm = document.getElementById('goal-form');
    const saveMoneyForm = document.getElementById('save-money-form');
    const editGoalBtn = document.getElementById('edit-goal-btn');
    const resetGoalBtn = document.getElementById('reset-goal-btn');

    // Authentication & Logout
    logoutBtn?.addEventListener('click', () => signOut(auth));

    // Goal Management
    goalForm?.addEventListener('submit', handleGoalFormSubmit);
    saveMoneyForm?.addEventListener('submit', handleSaveMoney);

    // Edit Goal Button
    editGoalBtn?.addEventListener('click', () => {
        document.getElementById('goal-status-container')?.classList.add('hidden');
        document.getElementById('goal-form-container')?.classList.remove('hidden');
        document.getElementById('goal-form-title').textContent = 'แก้ไขเป้าหมาย';
        document.getElementById('goal-submit-btn').textContent = 'บันทึกการแก้ไข';
    });

    // Reset/Delete Goal Button
    resetGoalBtn?.addEventListener('click', () => {
        showConfirmationModal('ยืนยันการลบเป้าหมาย', 'คุณแน่ใจหรือไม่ว่าต้องการลบเป้าหมายนี้? (ข้อมูลจะหายไปทั้งหมด)', async () => {
            if (!auth.currentUser) return;
            // Delete the goal document
            const goalRef = doc(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'goals', GOAL_DOC_ID);
            try {
                await deleteDoc(goalRef);
                showModal("สำเร็จ", "ลบเป้าหมายเรียบร้อยแล้ว");
                // The onSnapshot listener will catch the deletion and call renderGoalUI(null)
            } catch (error) {
                console.error("Error deleting goal: ", error);
                showModal("ข้อผิดพลาด", "ไม่สามารถลบเป้าหมายได้");
            }
        });
    });

    // Start listening for real-time goal updates
    startGoalListener();
}


function initInvestPage() {
    const newsGrid = document.getElementById('news-grid');
    if (!newsGrid) return;

    newsGrid.innerHTML = ''; // Clear any previous message

    investmentNews.forEach(news => {
        const card = document.createElement('a');
        card.href = news.linkUrl;
        card.target = "_blank";
        card.rel = "noopener noreferrer";
        card.className = "block bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden group";

        card.innerHTML = `
            <div class="relative">
                <img src="${news.imageUrl}" alt="${news.title}" class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300">
                <div class="absolute bottom-0 left-0 bg-black bg-opacity-50 text-white p-2 text-xs">${news.source}</div>
            </div>
            <div class="p-4">
                <h3 class="font-bold text-lg text-gray-800 group-hover:text-blue-600 transition-colors duration-300">${news.title}</h3>
            </div>
        `;
        newsGrid.appendChild(card);
    });
}


// --- Main Controller & Auth Observer ---
onAuthStateChanged(auth, async (user) => {
    const protectedPages = ['', 'index.html', 'about.html', 'invest.html'];
    const loginPage = 'login.html';
    let currentPage = window.location.pathname.split("/").pop() || 'index.html';
    if(currentPage.endsWith('.html')) {
        currentPage = currentPage.slice(0, -5);
    }
     if (currentPage === '') {
        currentPage = 'index';
    }


    if (user) {
        if (currentPage === 'login') {
            window.location.replace('index.html');
            return;
        }
        
        const userDoc = await getDoc(doc(db, 'artifacts', appId, 'users', user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            const userGreeting = document.getElementById('user-greeting');
            if (userGreeting) userGreeting.textContent = userData.username || user.email;
        }

    } else {
        const protectedPageNames = ['index', 'about', 'invest'];
        if (protectedPageNames.includes(currentPage)) {
            if (unsubscribeFromTransactions) unsubscribeFromTransactions();
            renderTransactionsUI([]);
            window.location.replace('login.html');
        }
    }
});

// --- Entry Point ---
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('confirm-cancel-btn')?.addEventListener('click', hideConfirmationModal);
    document.getElementById('confirm-action-btn')?.addEventListener('click', () => {
        if (typeof confirmCallback === 'function') {
            confirmCallback();
        }
        hideConfirmationModal();
    });

    let currentPage = window.location.pathname.split("/").pop() || 'index';
    if(currentPage.endsWith('.html')) {
        currentPage = currentPage.slice(0, -5);
    }
     if (currentPage === '') {
        currentPage = 'index';
    }
    
    document.querySelectorAll('nav a').forEach(link => {
        let linkPage = link.getAttribute('href').split('/').pop() || 'index';
        if(linkPage.endsWith('.html')) {
            linkPage = linkPage.slice(0, -5);
        }
        if (linkPage === '') {
            linkPage = 'index';
        }
        
        if (linkPage === currentPage) {
            link.classList.add('active-nav');
        }
    });
    
    if (currentPage === 'index') {
        initHomePage();
    } else if (currentPage === 'login') {
        initLoginPage();
    } else if (currentPage === 'about') {
        initAboutPage(); // This is the updated function for goal management
    } else if (currentPage === 'invest') {
        initInvestPage();
    }
});