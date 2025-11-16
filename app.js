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
    let currentPage = window.location.pathname.split("/").pop() || 'index.html';
    if(currentPage.endsWith('.html')) {
        currentPage = currentPage.slice(0, -5);
    }
    if (currentPage === '') {
        currentPage = 'index';
    }

    const userInfoDiv = document.getElementById('userInfo');
    const userInfoMobileDiv = document.getElementById('userInfoMobile');

    if (user) {
        // --- User is Logged In ---
        
        // 1. Handle Page Redirection
        if (currentPage === 'login') {
            window.location.replace('index.html');
            return;
        }
        
        // 2. Update Navbar UI (This now runs on ALL pages)
        const userDoc = await getDoc(doc(db, 'artifacts', appId, 'users', user.uid));
        const username = userDoc.exists() ? userDoc.data().username : user.email;

        const commonUserInfoHTML = `
            <span class="text-gray-700">${username || user.email}</span>
            <button id="logoutButton" class="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600">
                ออกจากระบบ
            </button>
        `;
        
        if (userInfoDiv) userInfoDiv.innerHTML = commonUserInfoHTML;
        if (userInfoMobileDiv) userInfoMobileDiv.innerHTML = commonUserInfoHTML;

        // 3. Add Logout Listeners
        document.querySelectorAll('#logoutButton').forEach(button => {
            button.addEventListener('click', () => {
                auth.signOut().then(() => {
                    window.location.href = 'login.html';
                });
            });
        });

    } else {
        // --- User is Logged Out ---
        
        // 1. Update Navbar UI
        const loginLink = '<a href="login.html" class="text-blue-600 hover:underline">เข้าสู่ระบบ</a>';
        if (userInfoDiv) userInfoDiv.innerHTML = loginLink;
        if (userInfoMobileDiv) userInfoMobileDiv.innerHTML = loginLink;

        // 2. Handle Page Redirection
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
    // --- Global Modal Listeners ---
    document.getElementById('confirm-cancel-btn')?.addEventListener('click', hideConfirmationModal);
    document.getElementById('confirm-action-btn')?.addEventListener('click', () => {
        if (typeof confirmCallback === 'function') {
            confirmCallback();
        }
        hideConfirmationModal();
    });

    // --- Global Mobile Menu Toggle ---
    const mobileMenuButton = document.getElementById('mobileMenuButton');
    const mobileMenu = document.getElementById('mobileMenu');
    mobileMenuButton?.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });

    // --- Page Identification ---
    let currentPage = window.location.pathname.split("/").pop() || 'index';
    if(currentPage.endsWith('.html')) {
        currentPage = currentPage.slice(0, -5);
    }
    if (currentPage === '') {
        currentPage = 'index';
    }
    
    // (Nav Highlighting ถูกย้ายไปทำในตัว HTML ด้วย aria-current แล้ว)
    
    // --- Page Routing ---
    if (currentPage === 'index') {
        initHomePage();
    } 
    else if (currentPage === 'login') {
        initLoginPage();
    } 
    else if (currentPage === 'invest') {
        initInvestPage();
    }
    else if (currentPage === 'about') {
        // ==========================================================
        // GOALS PAGE LOGIC (about.html) - CORRECTED
        // ==========================================================

        // --- หา ID ที่ถูกต้องตาม about.html ---
        const addGoalBtn = document.getElementById('addGoalBtn'); // แก้ไข
        const addGoalModal = document.getElementById('addGoalModal');
        const closeAddGoalModalBtn = document.getElementById('closeAddGoalModalBtn');
        const addGoalForm = document.getElementById('addGoalForm');
        const goalsGrid = document.getElementById('goalsGrid'); // แก้ไข

        const addSavingModal = document.getElementById('addSavingModal');
        const closeAddSavingModalBtn = document.getElementById('closeAddSavingModalBtn');
        const addSavingForm = document.getElementById('addSavingForm');
        const savingModalGoalName = document.getElementById('savingModalGoalName');
        const savingGoalIdInput = document.getElementById('savingGoalId');
        const savingAmountInput = document.getElementById('savingAmount');
        
        // --- Modal ยืนยันการลบ (จาก about.html) ---
        const confirmationModal = document.getElementById('confirmationModal');
        const cancelBtn = document.getElementById('cancelBtn');

        // --- Modal Toggle Functions ---
        const openModal = (modal) => {
            if (modal) modal.classList.remove('hidden');
        };
        const closeModal = (modal) => {
            if (modal) modal.classList.add('hidden');
        };

        // --- สั่งให้ปุ่มทำงาน ---
        if (addGoalBtn) { // แก้ไข
            addGoalBtn.addEventListener('click', () => openModal(addGoalModal));
        }
        if (closeAddGoalModalBtn) {
            closeAddGoalModalBtn.addEventListener('click', () => closeModal(addGoalModal));
        }
        if (closeAddSavingModalBtn) {
            closeAddSavingModalBtn.addEventListener('click', () => closeModal(addSavingModal));
        }
        // (เพิ่ม) ปุ่มยกเลิกในหน้าต่างยืนยัน
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => closeModal(confirmationModal));
        }


        // --- Save New Goal ---
        // --- Save New Goal ---
        if (addGoalForm) {
            addGoalForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (!auth.currentUser) return;

                const goalName = document.getElementById('goalName').value;
                const targetAmount = parseFloat(document.getElementById('targetAmount').value);
                const initialAmount = parseFloat(document.getElementById('initialAmount').value);

                if (targetAmount <= initialAmount) {
                    alert("จำนวนเงินเป้าหมายต้องมากกว่าเงินออมเริ่มต้น");
                    return;
                }

                try {
                    //
                    // V V V V V V V V V V V V V V V V V V
                    //
                    //     จุดที่แก้ไข: ลบ import บรรทัดนี้ทิ้งไป
                    //     เพราะเรา import ไว้ที่ต้นไฟล์แล้ว
                    //
                    // ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^
                    //

                    // ใช้ addDoc, collection, serverTimestamp จากที่ import ไว้ด้านบน
                    await addDoc(collection(db, 'goals'), {
                        userId: auth.currentUser.uid,
                        name: goalName,
                        target: targetAmount,
                        current: initialAmount,
                        createdAt: serverTimestamp() // <--- ใช้งานได้เลย
                    });
                    
                    addGoalForm.reset();
                    closeModal(addGoalModal);

                } catch (error) {
                    console.error("Error adding goal: ", error);
                    alert("เกิดข้อผิดพลาดในการบันทึกเป้าหมาย");
                }
            });
        }

        // --- Save Additional Saving (Log) ---
        if (addSavingForm) {
            addSavingForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const goalId = savingGoalIdInput.value;
                const amount = parseFloat(savingAmountInput.value);

                if (!goalId || !amount || amount <= 0) {
                    alert("ข้อมูลไม่ถูกต้อง");
                    return;
                }
                
                const { doc, collection, addDoc, updateDoc, increment, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
                const goalRef = doc(db, 'goals', goalId);
                const savingsLogRef = collection(goalRef, 'savingsLog');

                try {
                    await addDoc(savingsLogRef, {
                        amount: amount,
                        date: serverTimestamp()
                    });
                    await updateDoc(goalRef, {
                        current: increment(amount)
                    });
                    addSavingForm.reset();
                    closeModal(addSavingModal);
                } catch (error) {
                    console.error("Error logging saving: ", error);
                    alert("เกิดข้อผิดพลาดในการบันทึกการออม");
                }
            });
        }

        // --- (เพิ่ม) ฟังก์ชันลบเป้าหมาย ---
        const deleteGoal = async (goalId) => {
            if (!auth.currentUser || !goalId) return;
            try {
               const { doc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
               // หมายเหตุ: การลบเอกสารหลัก จะไม่ลบ subcollection (savingsLog)
               // แต่ในแอปนี้ เราจะไม่แสดงผล log ถ้า goal หายไปแล้ว ก็ถือว่าเพียงพอ
               await deleteDoc(doc(db, 'goals', goalId));
            } catch (error) {
               console.error("Error deleting goal: ", error);
               alert("เกิดข้อผิดพลาดในการลบเป้าหมาย");
            }
       };

        // --- Fetch and Render Goals ---
        const fetchAndRenderGoals = (userId) => {
            (async () => {
                
                const q = query(collection(db, 'goals'), where('userId', '==', userId), orderBy('createdAt', 'desc'));

                onSnapshot(q, (querySnapshot) => {
                    if (querySnapshot.empty) {
                        if(goalsGrid) goalsGrid.innerHTML = '<p class="text-gray-500 text-center col-span-full">ยังไม่มีเป้าหมาย ลองเพิ่มเลย!</p>'; // แก้ไข
                        return;
                    }
                    
                    if(goalsGrid) goalsGrid.innerHTML = ''; // แก้ไข

                    querySnapshot.forEach(async (goalDoc) => {
                        const goal = goalDoc.data();
                        goal.id = goalDoc.id;

                        const savingsLogRef = collection(db, 'goals', goal.id, 'savingsLog');
                        const logQuery = query(savingsLogRef, orderBy('date', 'asc'));
                        const logSnapshot = await getDocs(logQuery);

                        const savingsLog = logSnapshot.docs.map(d => d.data());
                        
                        const goalCard = createGoalCard(goal, savingsLog);
                        if(goalsGrid) goalsGrid.appendChild(goalCard); // แก้ไข
                    });
                });
            })();
        };

        // --- Create Goal Card HTML ---
        const createGoalCard = (goal, savingsLog) => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-lg shadow-md p-6 relative';

            const { daysRemaining, dailyRate } = calculateEstimatedDays(goal, savingsLog);

            const percentage = Math.min((goal.current / goal.target) * 100, 100).toFixed(2);
            const amountRemaining = Math.max(0, goal.target - goal.current);

            card.innerHTML = `
                <button data-id="${goal.id}" data-name="${goal.name}" class="delete-goal-btn absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors">
                    <i class="fas fa-trash-alt"></i>
                </button>

                <h3 class="text-xl font-semibold text-gray-800 mb-2">${goal.name}</h3>
                <div class="mb-3">
                    <div class="flex justify-between text-sm text-gray-600 mb-1">
                        <span>ออมแล้ว ${percentage}%</span>
                        <span>${goal.current.toLocaleString()} / ${goal.target.toLocaleString()} บาท</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-4">
                        <div class="bg-gradient-to-r from-blue-400 to-blue-600 h-4 rounded-full" style="width: ${percentage}%"></div>
                    </div>
                    <p class="text-sm text-gray-500 mt-1">ขาดอีก ${amountRemaining.toLocaleString()} บาท</p>
                </div>
                <div class="bg-gray-50 p-3 rounded-md mb-4">
                    <h4 class="font-semibold text-center text-blue-800">ประมาณการ</h4>
                    ${dailyRate > 0 ? `
                        <p class="text-sm text-center text-gray-700">ออมเฉลี่ยวันละ ${dailyRate.toLocaleString()} บาท</p>
                        <p class="text-lg font-bold text-center text-blue-600">จะครบใน ${daysRemaining} วัน</p>
                    ` : `
                        <p class="text-sm text-center text-gray-500">เริ่มบันทึกการออมเพื่อดูประมาณการ</p>
                    `}
                </div>
                <button data-id="${goal.id}" data-name="${goal.name}" class="add-saving-btn w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-300">
                    <i class="fas fa-piggy-bank mr-2"></i>บันทึกการออมเพิ่ม
                </button>
            `;

            // ปุ่ม "บันทึกการออมเพิ่ม"
            card.querySelector('.add-saving-btn').addEventListener('click', (e) => {
                const button = e.currentTarget;
                if(savingModalGoalName) savingModalGoalName.textContent = `เป้าหมาย: ${button.dataset.name}`;
                if(savingGoalIdInput) savingGoalIdInput.value = button.dataset.id;
                openModal(addSavingModal);
            });
            
            // (เพิ่ม) ปุ่ม "ลบเป้าหมาย"
            card.querySelector('.delete-goal-btn').addEventListener('click', (e) => {
                 const button = e.currentTarget;
                 const goalId = button.dataset.id;
                 const goalName = button.dataset.name;
                 
                 const confirmModal = document.getElementById('confirmationModal');
                 const confirmTitle = document.getElementById('confirmationTitle');
                 const confirmMsg = document.getElementById('confirmationMessage');
                 const confirmBtn = document.getElementById('confirmBtn');
                 
                 if(confirmTitle) confirmTitle.textContent = "ยืนยันการลบเป้าหมาย";
                 if(confirmMsg) confirmMsg.textContent = `คุณแน่ใจหรือไม่ว่าต้องการลบเป้าหมาย "${goalName}"? ข้อมูลการออมของเป้าหมายนี้จะหายไปทั้งหมด`;
                 
                 // เราต้องใช้วิธีนี้เพื่อลบ event listener เก่าที่อาจติดมา
                 const newConfirmBtn = confirmBtn.cloneNode(true);
                 confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
                 
                 newConfirmBtn.addEventListener('click', () => {
                    deleteGoal(goalId);
                    closeModal(confirmModal);
                 }, { once: true }); // ให้ทำงานแค่ครั้งเดียว
                 
                 openModal(confirmModal);
            });

            return card;
        };

        // --- Calculation Logic ---
        const calculateEstimatedDays = (goal, savingsLog) => {
            if (savingsLog.length === 0 || !savingsLog[0].date) {
                return { daysRemaining: "N/A", dailyRate: 0 };
            }
            const firstSaveDate = savingsLog[0].date.toDate();
            const today = new Date();
            const timeDiff = today.getTime() - firstSaveDate.getTime();
            const daysPassed = Math.max(1, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
            const totalLoggedAmount = savingsLog.reduce((sum, log) => sum + log.amount, 0);
            const dailyRate = totalLoggedAmount / daysPassed;
            const amountRemaining = goal.target - goal.current;
            if (dailyRate <= 0 || amountRemaining <= 0) {
                return { daysRemaining: 0, dailyRate: dailyRate.toFixed(2) };
            }
            const daysRemaining = Math.ceil(amountRemaining / dailyRate);
            return { daysRemaining, dailyRate: dailyRate.toFixed(2) };
        };

        // --- Auth State Change (for this page) ---
        // เราต้องเช็ค user ก่อนที่จะ fetch-goal
        if(auth.currentUser){
            fetchAndRenderGoals(auth.currentUser.uid);
        }

    }})