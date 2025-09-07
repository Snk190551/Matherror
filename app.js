// app.js

// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, addDoc, collection, onSnapshot, query, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- Global Variables & Firebase Setup ---
let app, db, auth;
// !!! สำคัญ: กรุณากรอกข้อมูล Firebase ของคุณที่นี่ !!!
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
const appId = firebaseConfig.projectId || 'default-app-id'; // ใช้ projectId เป็น appId

// Initialize Firebase
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (error) {
    console.error("Firebase initialization failed:", error);
    // แสดงข้อความบนหน้าจอหาก Firebase ตั้งค่าไม่ถูกต้อง
    document.body.innerHTML = `<div class="text-red-500 text-center p-8">Firebase configuration is missing or invalid. Please check your app.js file.</div>`;
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

// Function to handle Home page logic
function initHomePage() {
    const transactionForm = document.getElementById('transaction-form');
    if (!transactionForm) return;

    const inflationRateInput = document.getElementById('inflation-rate');
    let transactions = [];

    function listenForTransactions() {
        if (!auth.currentUser) return;
        const transactionsCollectionRef = collection(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'transactions');
        onSnapshot(query(transactionsCollectionRef), (snapshot) => {
            transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderTransactions();
        });
    }

    function renderTransactions() {
        // ... (โค้ดส่วนนี้เหมือนเดิม) ...
    }

    transactionForm.addEventListener('submit', async (event) => {
        // ... (โค้ดส่วนนี้เหมือนเดิม) ...
    });

    inflationRateInput.addEventListener('input', renderTransactions);
    document.getElementById('date').valueAsDate = new Date();
    listenForTransactions();
}

// Function to handle Login/Register page logic
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
            // onAuthStateChanged จะจัดการ redirect เอง
        } catch (error) {
            showModal("เข้าสู่ระบบไม่สำเร็จ", "อีเมลหรือรหัสผ่านไม่ถูกต้อง โปรดลองอีกครั้ง");
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
            await setDoc(doc(db, 'artifacts', appId, 'users', user.uid), { username, email, createdAt: serverTimestamp() });
            showModal("สำเร็จ", "สมัครสมาชิกเรียบร้อยแล้ว! กรุณาเข้าสู่ระบบด้วยข้อมูลใหม่ของคุณ");
            loginContainer.classList.remove('hidden');
            registerContainer.classList.add('hidden');
            registerForm.reset(); // เคลียร์ฟอร์มหลังสมัคร
        } catch (error) {
            showModal("สมัครสมาชิกล้มเหลว", "อาจเป็นเพราะอีเมลนี้ถูกใช้ไปแล้ว หรือรหัสผ่านสั้นเกินไป");
        }
    });

    showLoginBtn.addEventListener('click', (e) => { e.preventDefault(); loginContainer.classList.remove('hidden'); registerContainer.classList.add('hidden'); });
    showRegisterBtn.addEventListener('click', (e) => { e.preventDefault(); registerContainer.classList.remove('hidden'); loginContainer.classList.add('hidden'); });
}

// Function to handle About page logic
function initAboutPage() {
    const logoutBtn = document.getElementById('logout-btn');
    if (!logoutBtn) return;
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            // onAuthStateChanged จะจัดการ redirect ไปหน้า login
        } catch (error) {
            showModal("เกิดข้อผิดพลาด", "ไม่สามารถออกจากระบบได้ โปรดลองอีกครั้ง");
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
        // --- ผู้ใช้เข้าสู่ระบบแล้ว ---
        if (currentPage === loginPage) {
            window.location.replace('index.html'); // ถ้าอยู่หน้า login ให้ไปหน้าแรก
            return;
        }

        // ดึงข้อมูลผู้ใช้มาแสดงผล
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
        // --- ผู้ใช้ยังไม่ได้เข้าสู่ระบบ ---
        if (protectedPages.includes(currentPage)) {
            window.location.replace(loginPage); // ถ้าพยายามเข้าหน้าป้องกัน ให้ไปหน้า login
        }
    }
});

// --- Initialize Page ---
document.addEventListener('DOMContentLoaded', () => {
    if (!auth) return; // หยุดการทำงานถ้า Firebase ไม่พร้อม
    setActiveNav();
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    if (currentPage === 'index.html') initHomePage();
    else if (currentPage === 'login.html') initLoginPage();
    else if (currentPage === 'about.html') initAboutPage();
});