// app.js

// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, addDoc, collection, onSnapshot, query, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- Global Variables & Firebase Setup ---
let app, db, auth;

// ใช้ Firebase Config ที่คุณหามาได้
const firebaseConfig = {
  apiKey: "AIzaSyC6d1_FmSvfrnhpqFxdKrg-bleCVC5XkUM",
  authDomain: "app-math-465713.firebaseapp.com",
  projectId: "app-math-465713",
  storageBucket: "app-math-465713.firebasestorage.app",
  messagingSenderId: "896330929514",
  appId: "1:896330929514:web:f2aa9442ab19a3f7574113",
  measurementId: "G-8H400D8BHL"
};

// ใช้ projectId เป็น appId สำหรับการอ้างอิง collection
const appId = firebaseConfig.projectId;

// Initialize Firebase
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("Firebase initialized successfully.");
} catch (error) {
    console.error("Firebase initialization failed:", error);
    showModal("ข้อผิดพลาด", "Firebase ไม่ได้ถูกตั้งค่า. โปรดตรวจสอบการตั้งค่าแอปพลิเคชัน.");
}

// --- Modal Functions ---
const messageModal = document.getElementById('message-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');

window.showModal = function(title, message) {
    if (modalTitle && modalMessage && messageModal) {
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        messageModal.style.display = 'flex';
    }
}

window.hideModal = function() {
    if (messageModal) {
        messageModal.style.display = 'none';
    }
}

// --- Page Specific Logic ---

function initHomePage() {
    const transactionForm = document.getElementById('transaction-form');
    if (!transactionForm) return;

    const inflationRateInput = document.getElementById('inflation-rate');
    let transactions = [];

    function listenForTransactions() {
        if (!auth.currentUser) {
            transactions = [];
            renderTransactions(); // Clear display if logged out
            return;
        }
        const transactionsCollectionRef = collection(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'transactions');
        onSnapshot(query(transactionsCollectionRef), (snapshot) => {
            transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderTransactions();
        });
    }

    function renderTransactions() {
        const transactionsList = document.getElementById('transactions-list');
        const totalIncomeEl = document.getElementById('total-income');
        const totalExpenseEl = document.getElementById('total-expense');
        const totalBalanceEl = document.getElementById('total-balance');

        if (!transactionsList || !totalIncomeEl || !totalExpenseEl || !totalBalanceEl) return;

        transactionsList.innerHTML = '';
        let totalIncome = 0, totalExpense = 0;
        const inflationRate = parseFloat(inflationRateInput.value) / 100 || 0;
        const currentDate = new Date();

        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        transactions.forEach(transaction => {
            const transactionDate = new Date(transaction.date);
            const diffTime = Math.abs(currentDate - transactionDate);
            const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
            const adjustedAmount = transaction.amount * Math.pow(1 + inflationRate, diffYears);

            if (transaction.type === 'income') totalIncome += adjustedAmount;
            else totalExpense += adjustedAmount;

            const typeClass = transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
            const sign = transaction.type === 'income' ? '+' : '-';

            const itemDiv = document.createElement('div');
            itemDiv.className = `flex justify-between items-center p-4 rounded-xl shadow-sm mb-2 ${typeClass}`;
            itemDiv.innerHTML = `
                <div class="flex items-center space-x-4">
                    <span class="text-xl font-bold">${sign}</span>
                    <div>
                        <div class="text-lg font-semibold">${transaction.category}</div>
                        <div class="text-sm text-gray-500">${new Date(transaction.date).toLocaleDateString('th-TH')}</div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="font-bold text-lg">${transaction.amount.toLocaleString('th-TH', { maximumFractionDigits: 2 })} บาท</div>
                    <div class="text-xs text-gray-400 mt-1">(มูลค่าปัจจุบัน: ${adjustedAmount.toLocaleString('th-TH', { maximumFractionDigits: 2 })} บาท)</div>
                </div>`;
            transactionsList.appendChild(itemDiv);
        });

        const totalBalance = totalIncome - totalExpense;
        totalIncomeEl.textContent = `${totalIncome.toLocaleString('th-TH', { maximumFractionDigits: 2 })} บาท`;
        totalExpenseEl.textContent = `${totalExpense.toLocaleString('th-TH', { maximumFractionDigits: 2 })} บาท`;
        totalBalanceEl.textContent = `${totalBalance.toLocaleString('th-TH', { maximumFractionDigits: 2 })} บาท`;
    }
    
    transactionForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!auth.currentUser) {
            showModal("ข้อผิดพลาด", "ไม่สามารถบันทึกรายการได้ โปรดเข้าสู่ระบบก่อน");
            return;
        }

        const newTransaction = {
            date: document.getElementById('date').value,
            type: document.getElementById('type').value,
            category: document.getElementById('category').value,
            amount: parseFloat(document.getElementById('amount').value),
            createdAt: serverTimestamp()
        };

        try {
            const transactionsCollectionRef = collection(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'transactions');
            await addDoc(transactionsCollectionRef, newTransaction);
            showModal("สำเร็จ", "บันทึกรายการสำเร็จ!");
            transactionForm.reset();
            document.getElementById('date').value = new Date().toISOString().split('T')[0];
        } catch (e) {
            console.error("Error adding document: ", e);
            showModal("ข้อผิดพลาด", "ไม่สามารถบันทึกรายการได้ โปรดลองอีกครั้ง");
        }
    });

    inflationRateInput.addEventListener('input', renderTransactions);
    document.getElementById('date').value = new Date().toISOString().split('T')[0];
    listenForTransactions();
}

function initLoginPage() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    if (!loginForm || !registerForm) return;

    const showLoginBtn = document.getElementById('show-login-btn');
    const showRegisterBtn = document.getElementById('show-register-btn');
    const loginContainer = document.getElementById('login-container');
    const registerContainer = document.getElementById('register-container');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, document.getElementById('login-email').value, document.getElementById('login-password').value);
        } catch (error) {
            showModal("ข้อผิดพลาดในการเข้าสู่ระบบ", "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const username = document.getElementById('register-username').value;
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid);
            await setDoc(userDocRef, { username, email, createdAt: serverTimestamp() });
            showModal("สำเร็จ", "สมัครสมาชิกเรียบร้อยแล้ว โปรดเข้าสู่ระบบ");
            loginContainer.classList.remove('hidden');
            registerContainer.classList.add('hidden');
        } catch (error) {
            showModal("ข้อผิดพลาดในการสมัครสมาชิก", "ไม่สามารถสมัครสมาชิกได้ โปรดลองใหม่อีกครั้ง");
        }
    });

    showLoginBtn.addEventListener('click', (e) => { e.preventDefault(); loginContainer.classList.remove('hidden'); registerContainer.classList.add('hidden'); });
    showRegisterBtn.addEventListener('click', (e) => { e.preventDefault(); registerContainer.classList.remove('hidden'); loginContainer.classList.add('hidden'); });
}

function initAboutPage() {
    const logoutBtn = document.getElementById('logout-btn');
    if (!logoutBtn) return;
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
        } catch (error) {
            showModal("ข้อผิดพลาด", "ไม่สามารถออกจากระบบได้ โปรดลองอีกครั้ง");
        }
    });
}

// --- Main App Logic & Auth Handling ---

function setActiveNav() {
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    document.getElementById('nav-home')?.classList.toggle('active-nav', currentPage === 'index.html');
    document.getElementById('nav-invest')?.classList.toggle('active-nav', currentPage === 'invest.html');
    document.getElementById('nav-about')?.classList.toggle('active-nav', currentPage === 'about.html');
}

onAuthStateChanged(auth, async (user) => {
    const protectedPages = ['index.html', 'about.html', 'invest.html'];
    const loginPage = 'login.html';
    const currentPage = window.location.pathname.split("/").pop() || "index.html";

    if (user) {
        if (currentPage === loginPage) {
            window.location.replace('index.html');
            return;
        }
        const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const userGreeting = document.getElementById('user-greeting');
            const userIdDisplay = document.getElementById('user-id-display');
            if (userGreeting) userGreeting.textContent = userData.username || user.email;
            if (userIdDisplay) userIdDisplay.textContent = user.uid;
        }
    } else {
        if (protectedPages.includes(currentPage)) {
            window.location.replace(loginPage);
        }
    }
});

// --- Initialize Page ---
document.addEventListener('DOMContentLoaded', () => {
    if (!auth) return;
    setActiveNav();
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    if (currentPage === 'index.html') initHomePage();
    else if (currentPage === 'login.html') initLoginPage();
    else if (currentPage === 'about.html') initAboutPage();
});
