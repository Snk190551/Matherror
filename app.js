// app.js

// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, addDoc, collection, onSnapshot, query, serverTimestamp, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- Global Variables & Firebase Setup ---
let app, db, auth;
let unsubscribeFromTransactions = null; // ตัวแปรสำหรับหยุดการดักฟังข้อมูลเมื่อไม่จำเป็น

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
} catch (error) {
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
}
window.hideModal = function() {
    const modal = document.getElementById('message-modal');
    if (modal) modal.style.display = 'none';
}

// --- Core App Functions ---

/**
 * ฟังก์ชันสำหรับวาดหน้าจอใหม่ทั้งหมด (ประวัติและยอดสรุป)
 * @param {Array} transactions - อาร์เรย์ของข้อมูลรายการที่จะแสดง
 */
function renderTransactionsUI(transactions = []) {
    const listEl = document.getElementById('transactions-list');
    const incomeEl = document.getElementById('total-income');
    const expenseEl = document.getElementById('total-expense');
    const balanceEl = document.getElementById('total-balance');
    const inflationRateInput = document.getElementById('inflation-rate');

    if (!listEl || !incomeEl || !expenseEl || !balanceEl) return;

    listEl.innerHTML = '';
    let totalIncome = 0, totalExpense = 0;
    const inflationRate = parseFloat(inflationRateInput?.value || 3.0) / 100;
    const currentDate = new Date();

    transactions.forEach(tx => {
        const txDate = new Date(tx.date);
        const diffYears = (currentDate - txDate) / (1000 * 60 * 60 * 24 * 365.25);
        const adjustedAmount = tx.amount * Math.pow(1 + inflationRate, diffYears);

        if (tx.type === 'income') totalIncome += adjustedAmount;
        else totalExpense += adjustedAmount;

        const typeClass = tx.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
        const sign = tx.type === 'income' ? '+' : '-';
        const itemDiv = document.createElement('div');
        itemDiv.className = `flex justify-between items-center p-4 rounded-xl shadow-sm mb-2 ${typeClass}`;
        itemDiv.innerHTML = `
            <div class="flex items-center space-x-4">
                <span class="text-xl font-bold">${sign}</span>
                <div>
                    <div class="text-lg font-semibold">${tx.category}</div>
                    <div class="text-sm text-gray-500">${new Date(tx.date).toLocaleDateString('th-TH')}</div>
                </div>
            </div>
            <div class="text-right">
                <div class="font-bold text-lg">${tx.amount.toLocaleString('th-TH', { maximumFractionDigits: 2 })} บาท</div>
                <div class="text-xs text-gray-400 mt-1">(มูลค่าปัจจุบัน: ${adjustedAmount.toLocaleString('th-TH', { maximumFractionDigits: 2 })} บาท)</div>
            </div>`;
        listEl.appendChild(itemDiv);
    });

    const totalBalance = totalIncome - totalExpense;
    incomeEl.textContent = `${totalIncome.toLocaleString('th-TH', { maximumFractionDigits: 2 })} บาท`;
    expenseEl.textContent = `${totalExpense.toLocaleString('th-TH', { maximumFractionDigits: 2 })} บาท`;
    balanceEl.textContent = `${totalBalance.toLocaleString('th-TH', { maximumFractionDigits: 2 })} บาท`;
}

/**
 * เริ่มการดักฟังข้อมูลธุรกรรมแบบ Real-time
 */
function startTransactionListener() {
    if (unsubscribeFromTransactions) unsubscribeFromTransactions(); // หยุดการดักฟังของเก่า (ถ้ามี)

    if (auth.currentUser) {
        const transactionsRef = collection(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'transactions');
        const q = query(transactionsRef, orderBy('date', 'desc')); // เรียงข้อมูลจากใหม่ไปเก่า

        unsubscribeFromTransactions = onSnapshot(q, (snapshot) => {
            const transactionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderTransactionsUI(transactionsData);
        });
    } else {
        renderTransactionsUI([]); // ถ้าไม่มีผู้ใช้ ให้ล้างหน้าจอ
    }
}

// --- Page Initialization Functions ---

function initHomePage() {
    const transactionForm = document.getElementById('transaction-form');
    const inflationRateInput = document.getElementById('inflation-rate');

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

    inflationRateInput?.addEventListener('input', () => startTransactionListener());
    
    // ตั้งค่าวันที่เริ่มต้น
    const dateInput = document.getElementById('date');
    if (dateInput) dateInput.valueAsDate = new Date();

    // เริ่มดักฟังข้อมูล
    startTransactionListener();
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
    document.getElementById('logout-btn')?.addEventListener('click', () => signOut(auth));
}

// --- Main Controller & Auth Observer ---

onAuthStateChanged(auth, async (user) => {
    const protectedPages = ['', 'index.html', 'about.html', 'invest.html'];
    const loginPage = 'login.html';
    let currentPage = window.location.pathname.split("/").pop();

    if (user) {
        // ถ้าผู้ใช้ล็อกอินแล้ว แต่ยังอยู่หน้า login ให้ redirect
        if (currentPage === loginPage) {
            window.location.replace('index.html');
            return;
        }
        
        // อัปเดตข้อมูลผู้ใช้บนหน้า about
        const userDoc = await getDoc(doc(db, 'artifacts', appId, 'users', user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            const userGreeting = document.getElementById('user-greeting');
            const userIdDisplay = document.getElementById('user-id-display');
            if (userGreeting) userGreeting.textContent = userData.username || user.email;
            if (userIdDisplay) userIdDisplay.textContent = user.uid;
        }

        // ถ้าอยู่หน้า Home ให้เริ่มดักฟังข้อมูล
        if (protectedPages.includes(currentPage)) {
            startTransactionListener();
        }

    } else {
        // ถ้าผู้ใช้ไม่ได้ล็อกอิน และพยายามเข้าหน้าป้องกัน ให้ redirect
        if (protectedPages.includes(currentPage)) {
            if (unsubscribeFromTransactions) unsubscribeFromTransactions(); // หยุดดักฟัง
            renderTransactionsUI([]); // เคลียร์หน้าจอ
            window.location.replace(loginPage);
        }
    }
});

// --- Entry Point ---
document.addEventListener('DOMContentLoaded', () => {
    let currentPage = window.location.pathname.split("/").pop();
    
    // ตั้งค่า Active Nav
    document.querySelectorAll('nav a').forEach(link => {
        const linkPage = link.getAttribute('href').split('/').pop();
        if (linkPage === currentPage || (currentPage === '' && linkPage === 'index.html')) {
            link.classList.add('active-nav');
        }
    });

    // เรียกใช้ฟังก์ชัน init สำหรับหน้านั้นๆ
    if (currentPage === '' || currentPage === 'index.html') initHomePage();
    else if (currentPage === 'login.html') initLoginPage();
    else if (currentPage === 'about.html') initAboutPage();
});

// app.js

// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, addDoc, collection, onSnapshot, query, serverTimestamp, updateDoc, orderBy, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- Global Variables & Firebase Setup ---
let app, db, auth;
let unsubscribeFromTransactions = null;
let confirmCallback = null;

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
} catch (error) {
    console.error("Firebase initialization failed:", error);
}

// --- Modal Functions ---
window.showModal = function(title, message) { /* ... no changes ... */ };
window.hideModal = function() { /* ... no changes ... */ };
function showConfirmationModal(title, message, onConfirm) { /* ... no changes ... */ }
function hideConfirmationModal() { /* ... no changes ... */ }

/**
 * ดึงข้อมูลอัตราเงินเฟ้อจริงจาก API ของธนาคารโลก (World Bank)
 */
async function fetchAndUpdateInflationRate() {
    const inflationInput = document.getElementById('inflation-rate');
    const inflationStatus = document.getElementById('inflation-status');

    if (!inflationInput || !inflationStatus) return;

    inflationStatus.textContent = 'กำลังโหลดข้อมูล...';

    // API URL สำหรับดึงอัตราเงินเฟ้อ (CPI) ล่าสุดของประเทศไทยจากธนาคารโลก
    // API นี้เป็นสาธารณะ ไม่ต้องใช้ Key และไม่มีปัญหา CORS
    const worldBankApiUrl = 'https://api.worldbank.org/v2/country/THA/indicator/FP.CPI.TOTL.ZG?format=json&per_page=1';

    try {
        const response = await fetch(worldBankApiUrl);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        
        // ข้อมูลจะซ้อนกันอยู่ เราต้องดึงค่าที่ถูกต้องออกมา
        const latestDataPoint = data[1][0];
        const latestInflationRate = latestDataPoint.value;
        const latestYear = latestDataPoint.date;

        if (latestInflationRate !== null) {
            inflationInput.value = latestInflationRate.toFixed(2); // แสดงผลทศนิยม 2 ตำแหน่ง
            inflationStatus.textContent = `ข้อมูลปี ${latestYear}`;
        } else {
            throw new Error('Inflation data not available');
        }

    } catch (error) {
        console.error('Failed to fetch inflation rate:', error);
        inflationStatus.textContent = 'เกิดข้อผิดพลาด';
        // หากดึงข้อมูลล้มเหลว ให้ใช้ค่าเริ่มต้นไปก่อน
        inflationInput.value = '3.0'; 
    } finally {
        // ไม่ว่าผลจะเป็นอย่างไร ให้คำนวณหน้าจอใหม่อีกครั้งเสมอ
        startTransactionListener();
    }
}


// --- Core App Functions ---
async function handleDeleteTransaction(transactionId) { /* ... no changes ... */ }
function renderTransactionsUI(transactions = []) { /* ... no changes ... */ }
function startTransactionListener() { /* ... no changes ... */ }

// --- Page Initialization Functions ---
function initHomePage() {
    const transactionForm = document.getElementById('transaction-form');
    const transactionsListContainer = document.getElementById('transactions-list');

    transactionForm?.addEventListener('submit', async (e) => { /* ... no changes ... */ });
    
    transactionsListContainer?.addEventListener('click', (e) => { /* ... no changes ... */ });

    const dateInput = document.getElementById('date');
    if (dateInput) dateInput.valueAsDate = new Date();
    
    // เรียกใช้ฟังก์ชันดึงข้อมูลจริง ซึ่งจะไปสั่งให้วาดหน้าจอใหม่อีกที
    fetchAndUpdateInflationRate(); 
}

function initLoginPage() { /* ... no changes ... */ }
function initAboutPage() { /* ... no changes ... */ }

// --- Main Controller & Auth Observer ---
onAuthStateChanged(auth, async (user) => { /* ... no changes ... */ });

// --- Entry Point ---
document.addEventListener('DOMContentLoaded', () => { /* ... no changes ... */ });

