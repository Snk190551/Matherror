// app.js

// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, addDoc, collection, onSnapshot, query, serverTimestamp, updateDoc, orderBy, deleteDoc, where } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- Global Variables & Firebase Setup ---
let app, db, auth;
let unsubscribeFromTransactions = null;
let unsubscribeFromGoal = null;
let confirmCallback = null;
let currentUser = null; 
const GOAL_DOC_ID = 'user_goal'; 
let currentBalance = 0; // เพิ่มตัวแปร global สำหรับยอดคงเหลือ

const firebaseConfig = {
  // กรุณาใช้ค่า config ของคุณ
  apiKey: "AIzaSyC6d1_FmSvfrnhpqfxdKrg-bleCVC5XkUM",
  authDomain: "app-math-465713.firebaseapp.com",
  projectId: "app-math-465713",
  storageBucket: "app-math-465713.firebasestorage.app",
  messagingSenderId: "896330929514",
  appId: "1:896330929514:web:f2aa9442ab19ac405c93c1"
};

// Initialize Firebase
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (error) {
    console.error("Firebase initialization error:", error);
}

// --- Utility Functions ---

function showModal(title, message, isError = false) {
    const modal = document.getElementById('message-modal');
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-message').textContent = message;
    
    const titleElement = document.getElementById('modal-title');
    titleElement.classList.remove('text-red-600', 'text-green-600');
    if (isError) {
        titleElement.classList.add('text-red-600');
    } else {
        titleElement.classList.add('text-green-600');
    }

    modal.style.display = 'flex';
}

function hideModal() {
    document.getElementById('message-modal').style.display = 'none';
}

function showConfirmationModal(title, message, callback) {
    const modal = document.getElementById('confirmation-modal');
    document.getElementById('confirmation-title').textContent = title;
    document.getElementById('confirmation-message').textContent = message;
    confirmCallback = callback;
    modal.style.display = 'flex';
}

function hideConfirmationModal() {
    document.getElementById('confirmation-modal').style.display = 'none';
    confirmCallback = null;
}

// --- Goal Management Functions ---

/// ฟังก์ชันสำหรับจัดการการแสดงผล UI ของเป้าหมาย
function renderGoalUI(goal) {
    const displayContainer = document.getElementById('goal-display-container'); 
    const formContainer = document.getElementById('goal-form-container');
    const goalForm = document.getElementById('goal-form');
    const progressBar = document.getElementById('progress-bar'); 

    if (!goal) {
        // ไม่มีเป้าหมาย, แสดงฟอร์มสร้างเป้าหมาย
        displayContainer?.classList.add('hidden');
        formContainer?.classList.remove('hidden');
        goalForm?.reset(); 
        delete goalForm?.dataset.docId; 
        delete goalForm?.dataset.isEdit; 
        document.getElementById('goal-form-title').textContent = 'สร้างเป้าหมายใหม่';
        document.getElementById('goal-submit-btn').textContent = 'บันทึกเป้าหมาย';
        return;
    }

    // มีเป้าหมาย, แสดงรายละเอียด
    displayContainer?.classList.remove('hidden');
    formContainer?.classList.add('hidden');
    
    document.getElementById('display-goal-name').textContent = goal.name;
    document.getElementById('display-target-amount').textContent = goal.targetAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 });
    document.getElementById('display-current-amount').textContent = goal.currentAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 });

    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    
    if (progressBar) {
        progressBar.style.width = `${Math.min(progress, 100)}%`;
    }
    document.getElementById('display-progress-percent').textContent = `${Math.min(progress, 100).toFixed(1)}%`;

    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
    document.getElementById('display-remaining-amount').textContent = remaining.toLocaleString('th-TH', { minimumFractionDigits: 2 });
    
    // --- ส่วนสำคัญ: ผูกปุ่มแก้ไข (Edit Button) ---
    const editBtn = document.getElementById('edit-goal-btn');
    if (editBtn) {
        editBtn.onclick = null; 
        editBtn.onclick = () => {
            console.log('✅ EDIT BUTTON CLICKED. Calling editGoal with data:', goal); 
            editGoal(goal);
        }; 
    }
}

/// ฟังก์ชันสำหรับสลับไปหน้าฟอร์มแก้ไข
function editGoal(goalData) {
    console.log('➡️ Entering editGoal function. Switching UI.'); 

    const displayContainer = document.getElementById('goal-display-container'); 
    const formContainer = document.getElementById('goal-form-container');
    const goalForm = document.getElementById('goal-form');

    // 1. นำข้อมูลที่มีอยู่มาใส่ในช่องกรอก 
    document.getElementById('goal-name').value = goalData?.name || '';
    document.getElementById('target-amount').value = goalData?.targetAmount || 0;
    document.getElementById('current-amount').value = goalData?.currentAmount || 0;

    // 2. กำหนด docId และ isEdit flag 
    goalForm.dataset.docId = goalData?.id || '';
    goalForm.dataset.isEdit = 'true';

    // 3. เปลี่ยนข้อความปุ่ม
    document.getElementById('goal-form-title').textContent = 'แก้ไขเป้าหมาย';
    document.getElementById('goal-submit-btn').textContent = 'บันทึกการแก้ไข';

    // 4. สลับ UI
    displayContainer?.classList.add('hidden');
    formContainer?.classList.remove('hidden');
    
    console.log('✅ UI Switch Attempted. Display Container Hidden:', displayContainer?.classList.contains('hidden'));
}

async function saveGoal(event) {
    event.preventDefault();
    if (!currentUser) {
        showModal('ข้อผิดพลาด', 'กรุณาเข้าสู่ระบบก่อน', true);
        return;
    }

    const goalForm = document.getElementById('goal-form');
    const isEdit = goalForm.dataset.isEdit === 'true';
    const docId = GOAL_DOC_ID; 

    const goalName = document.getElementById('goal-name').value;
    const targetAmount = parseFloat(document.getElementById('target-amount').value);
    const currentAmount = parseFloat(document.getElementById('current-amount').value);

    if (targetAmount <= 0) {
        showModal('ข้อผิดพลาด', 'ยอดเงินเป้าหมายต้องมากกว่า 0', true);
        return;
    }

    const goalData = {
        name: goalName,
        targetAmount: targetAmount,
        currentAmount: currentAmount,
        userId: currentUser.uid,
        updatedAt: serverTimestamp()
    };
    
    if (!isEdit) {
         goalData.createdAt = serverTimestamp();
    }

    try {
        const goalRef = doc(db, 'users', currentUser.uid, 'goals', docId);
        await setDoc(goalRef, goalData, { merge: true });

        showModal('สำเร็จ', isEdit ? 'บันทึกการแก้ไขเป้าหมายเรียบร้อยแล้ว' : 'สร้างเป้าหมายใหม่เรียบร้อยแล้ว');
        goalForm.reset();
        delete goalForm.dataset.docId; 
        delete goalForm.dataset.isEdit;
        
    } catch (error) {
        console.error("Error saving goal: ", error);
        showModal('ข้อผิดพลาด', 'ไม่สามารถบันทึกเป้าหมายได้', true);
    }
}

function startGoalListener() {
    if (!currentUser) return;
    if (unsubscribeFromGoal) unsubscribeFromGoal(); // หยุด listener เดิม
    
    const goalRef = doc(db, 'users', currentUser.uid, 'goals', GOAL_DOC_ID);
    
    unsubscribeFromGoal = onSnapshot(goalRef, (doc) => {
        if (doc.exists()) {
            const goalData = {
                id: doc.id,
                ...doc.data()
            };
            renderGoalUI(goalData);
        } else {
            renderGoalUI(null); 
        }
    }, (error) => {
        console.error("Error listening to goal changes: ", error);
    });
}

async function deleteGoal() {
    if (!currentUser) return;
    try {
        const goalRef = doc(db, 'users', currentUser.uid, 'goals', GOAL_DOC_ID);
        await deleteDoc(goalRef);
        showModal('สำเร็จ', 'ลบเป้าหมายเรียบร้อยแล้ว');
    } catch (error) {
        console.error("Error deleting goal: ", error);
        showModal('ข้อผิดพลาด', 'ไม่สามารถลบเป้าหมายได้', true);
    }
}


// --- Transaction Management Functions ---

async function saveTransaction(event) {
    event.preventDefault();
    if (!currentUser) {
        showModal('ข้อผิดพลาด', 'กรุณาเข้าสู่ระบบก่อน', true);
        return;
    }

    const transactionForm = document.getElementById('transaction-form');
    const description = document.getElementById('description').value;
    const type = document.getElementById('type').value;
    const category = document.getElementById('category').value;
    const amount = parseFloat(document.getElementById('amount').value);

    if (amount <= 0 || isNaN(amount)) {
        showModal('ข้อผิดพลาด', 'จำนวนเงินต้องมากกว่า 0', true);
        return;
    }

    const transactionData = {
        description: description,
        type: type,
        category: category,
        amount: amount,
        timestamp: serverTimestamp(),
        userId: currentUser.uid
    };

    try {
        await addDoc(collection(db, 'users', currentUser.uid, 'transactions'), transactionData);
        showModal('สำเร็จ', 'บันทึกรายการเรียบร้อยแล้ว');
        transactionForm.reset();
    } catch (error) {
        console.error("Error adding document: ", error);
        showModal('ข้อผิดพลาด', 'ไม่สามารถบันทึกรายการได้', true);
    }
}

async function deleteTransaction(docId) {
    if (!currentUser) return;
    try {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'transactions', docId));
        showModal('สำเร็จ', 'ลบรายการเรียบร้อยแล้ว');
    } catch (error) {
        console.error("Error deleting document: ", error);
        showModal('ข้อผิดพลาด', 'ไม่สามารถลบรายการได้', true);
    }
}

function renderTransactionsList(transactions) {
    const listContainer = document.getElementById('transactions-list');
    const totalIncomeElement = document.getElementById('total-income');
    const totalExpenseElement = document.getElementById('total-expense');
    const balanceElement = document.getElementById('current-balance');

    listContainer.innerHTML = ''; // Clear previous list
    let totalIncome = 0;
    let totalExpense = 0;

    if (transactions.length === 0) {
        listContainer.innerHTML = '<p class="text-center text-gray-500 py-4">ไม่มีรายการในขณะนี้</p>';
    }

    transactions.forEach(transaction => {
        const isIncome = transaction.type === 'income';
        const sign = isIncome ? '+' : '-';
        const colorClass = isIncome ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';

        if (isIncome) {
            totalIncome += transaction.amount;
        } else {
            totalExpense += transaction.amount;
        }

        const date = transaction.timestamp ? new Date(transaction.timestamp.toDate()).toLocaleDateString('th-TH') : 'N/A';

        const listItem = document.createElement('div');
        listItem.className = `flex justify-between items-center p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors rounded-xl`;
        listItem.innerHTML = `
            <div class="flex-1 min-w-0">
                <p class="text-gray-800 font-semibold truncate">${transaction.description}</p>
                <p class="text-sm text-gray-500">${date} - ${transaction.category}</p>
            </div>
            <div class="text-right ml-4">
                <p class="font-bold ${colorClass} py-1 px-3 rounded-full text-sm">
                    ${sign} ${transaction.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </p>
            </div>
            <button class="ml-4 text-red-400 hover:text-red-600 transition-colors delete-btn" data-doc-id="${transaction.id}">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
            </button>
        `;
        listContainer.appendChild(listItem);
    });

    currentBalance = totalIncome - totalExpense;
    totalIncomeElement.textContent = totalIncome.toLocaleString('th-TH', { minimumFractionDigits: 2 });
    totalExpenseElement.textContent = totalExpense.toLocaleString('th-TH', { minimumFractionDigits: 2 });
    balanceElement.textContent = currentBalance.toLocaleString('th-TH', { minimumFractionDigits: 2 });
    
    // ตั้งค่าสีของยอดคงเหลือ
    balanceElement.classList.remove('text-green-600', 'text-red-600', 'text-gray-800');
    if (currentBalance > 0) {
        balanceElement.classList.add('text-green-600');
    } else if (currentBalance < 0) {
        balanceElement.classList.add('text-red-600');
    } else {
        balanceElement.classList.add('text-gray-800');
    }

    // ผูก Event Listener สำหรับปุ่มลบ
    listContainer.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const docId = e.currentTarget.dataset.docId;
            showConfirmationModal(
                'ยืนยันการลบรายการ',
                'คุณแน่ใจหรือไม่ที่จะลบรายการนี้? รายการที่ถูกลบจะไม่สามารถกู้คืนได้',
                () => {
                    deleteTransaction(docId);
                }
            );
        });
    });
}

function startTransactionListener() {
    if (!currentUser) return;
    if (unsubscribeFromTransactions) unsubscribeFromTransactions(); // หยุด listener เดิม

    // Query เพื่อดึงรายการ Transaction ทั้งหมด โดยเรียงลำดับจากล่าสุดไปเก่าสุด
    const transactionsRef = collection(db, 'users', currentUser.uid, 'transactions');
    const q = query(transactionsRef, orderBy('timestamp', 'desc'));

    unsubscribeFromTransactions = onSnapshot(q, (snapshot) => {
        const transactions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        renderTransactionsList(transactions);
    }, (error) => {
        console.error("Error listening to transactions: ", error);
    });
}

// --- User Management Functions ---

async function registerUser(event) {
    event.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const username = document.getElementById('register-username').value;
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await setDoc(doc(db, "users", user.uid), {
            username: username,
            email: email,
            createdAt: serverTimestamp()
        });
        showModal('สำเร็จ', 'ลงทะเบียนสำเร็จ! เข้าสู่ระบบแล้ว');
    } catch (error) {
        showModal('ข้อผิดพลาด', 'ลงทะเบียนไม่สำเร็จ: ' + error.message, true);
    }
}

async function loginUser(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        // Auth state listener จะจัดการการเปลี่ยนหน้า
    } catch (error) {
        showModal('ข้อผิดพลาด', 'เข้าสู่ระบบไม่สำเร็จ: ' + error.message, true);
    }
}

async function logoutUser() {
    try {
        if (unsubscribeFromTransactions) unsubscribeFromTransactions();
        if (unsubscribeFromGoal) unsubscribeFromGoal();
        await signOut(auth);
        window.location.replace('login.html');
    } catch (error) {
        console.error("Error logging out: ", error);
        showModal('ข้อผิดพลาด', 'ไม่สามารถออกจากระบบได้', true);
    }
}

// --- Initialization Functions ---

function initLoginPage() {
    document.getElementById('login-form')?.addEventListener('submit', loginUser);
    document.getElementById('register-form')?.addEventListener('submit', registerUser);
    document.getElementById('show-register-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-container').classList.add('hidden');
        document.getElementById('register-container').classList.remove('hidden');
    });
    document.getElementById('show-login-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('register-container').classList.add('hidden');
        document.getElementById('login-container').classList.remove('hidden');
    });
}

function initHomePage() {
    document.getElementById('transaction-form')?.addEventListener('submit', saveTransaction);
    document.getElementById('logout-btn')?.addEventListener('click', logoutUser);
}

function initAboutPage() {
    const goalForm = document.getElementById('goal-form');
    if (goalForm) {
        goalForm.addEventListener('submit', saveGoal);
    }
    
    const deleteGoalBtn = document.getElementById('delete-goal-btn');
    if (deleteGoalBtn) {
        deleteGoalBtn.onclick = () => {
            showConfirmationModal(
                'ยืนยันการลบเป้าหมาย',
                'คุณแน่ใจหรือไม่ที่จะลบเป้าหมายนี้? ข้อมูลเป้าหมายจะถูกลบออกทั้งหมด',
                () => {
                    deleteGoal();
                }
            );
        };
    }
    document.getElementById('logout-btn-about')?.addEventListener('click', logoutUser); // ถ้ามีปุ่ม logout ในหน้านี้
}

// --- Auth State Listener ---
onAuthStateChanged(auth, (user) => {
    let currentPage = window.location.pathname.split("/").pop();
    if(currentPage === '') currentPage = 'index.html';

    if (user) {
        currentUser = user;
        if (currentPage === 'login.html') {
            window.location.replace('index.html');
        } else if (currentPage === 'about.html') {
            startGoalListener();
        } else if (currentPage === 'index.html') {
            startTransactionListener(); 
        }
    } else {
        currentUser = null;
        if (currentPage !== 'login.html') {
            // Unsubscribe listeners when user logs out/is not logged in
            if (unsubscribeFromTransactions) unsubscribeFromTransactions();
            if (unsubscribeFromGoal) unsubscribeFromGoal();
            window.location.replace('login.html');
        }
    }
});

// --- Entry Point ---
document.addEventListener('DOMContentLoaded', () => {
    // Listener สำหรับ Modal ยืนยัน
    document.getElementById('confirm-cancel-btn')?.addEventListener('click', hideConfirmationModal);
    document.getElementById('confirm-action-btn')?.addEventListener('click', () => {
        if (typeof confirmCallback === 'function') {
            confirmCallback();
        }
        hideConfirmationModal();
    });

    // Listener สำหรับ Modal ข้อความ
    document.getElementById('message-modal')?.addEventListener('click', (e) => {
        if(e.target.id === 'message-modal') {
            hideModal();
        }
    });
    
    document.getElementById('modal-ok-btn')?.addEventListener('click', hideModal);


    let currentPage = window.location.pathname.split("/").pop() || 'index.html';
    
    // ตั้งค่า active nav bar
    document.querySelectorAll('nav a').forEach(link => {
        const linkHref = link.getAttribute('href');
        if (linkHref.includes(currentPage)) {
            link.classList.add('active-nav');
        } else {
            link.classList.remove('active-nav');
        }
    });
    
    // เรียกฟังก์ชัน init ตามหน้าปัจจุบัน
    if (currentPage === 'index.html' || currentPage === 'index') {
        initHomePage(); 
    } else if (currentPage === 'login.html') {
        initLoginPage();
    } else if (currentPage === 'about.html') {
        initAboutPage(); 
    } else if (currentPage === 'invest.html') {
        // initInvestPage(); // หากมีฟังก์ชันนี้
        document.getElementById('logout-btn-invest')?.addEventListener('click', logoutUser);
    }
});