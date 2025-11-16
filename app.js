// app.js

// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, addDoc, collection, onSnapshot, query, serverTimestamp, updateDoc, orderBy, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- Global Variables & Firebase Setup ---
let app, db, auth;
let unsubscribeFromTransactions = null;
let confirmCallback = null;
let currentUser = null; // เพิ่มตัวแปร global สำหรับเก็บ user
const GOAL_DOC_ID = 'user_goal'; // Document ID สำหรับเป้าหมายเดียวต่อผู้ใช้

const firebaseConfig = {
    // ใช้ค่า config ของคุณ
  apiKey: "AIzaSyC6d1_FmSvfrnhpqFxdKrg-bleCVC5XkUM",
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
    
    // ตั้งค่าสีตามประเภทข้อความ (Error/Success)
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
        // ล้าง Listener เดิมออกก่อน
        editBtn.onclick = null; 
        
        // ผูกฟังก์ชัน editGoal โดยส่งข้อมูล goal ปัจจุบันเข้าไป พร้อม Log Debug
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

    // 1. นำข้อมูลที่มีอยู่มาใส่ในช่องกรอก (ใช้ ?. เพื่อป้องกัน Error เงียบ)
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
    const docId = isEdit ? GOAL_DOC_ID : GOAL_DOC_ID; // เป้าหมายใช้ ID เดียวกันเสมอ

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
    
    // ตั้งค่า initial value สำหรับการสร้างใหม่เท่านั้น
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

    const goalRef = doc(db, 'users', currentUser.uid, 'goals', GOAL_DOC_ID);
    
    onSnapshot(goalRef, (doc) => {
        if (doc.exists()) {
            const goalData = {
                id: doc.id,
                ...doc.data()
            };
            renderGoalUI(goalData);
        } else {
            renderGoalUI(null); // แสดง UI สำหรับสร้างเป้าหมายใหม่
        }
    }, (error) => {
        console.error("Error listening to goal changes: ", error);
    });
}


// --- Transaction Management Functions (ย่อส่วน) ---

// ... (ส่วน Transaction Management, initHomePage, saveTransaction, renderTransactionsList, deleteTransaction อยู่ตรงนี้) ...

// --- User Management Functions ---

async function registerUser(event) {
    event.preventDefault();
    // ... (logic สำหรับ registerUser) ...
}

async function loginUser(event) {
    event.preventDefault();
    // ... (logic สำหรับ loginUser) ...
}

async function logoutUser() {
    // ... (logic สำหรับ logoutUser) ...
}

function initLoginPage() {
    // ... (logic สำหรับ initLoginPage) ...
}

function initHomePage() {
    // ... (logic สำหรับ initHomePage) ...
}

function initAboutPage() {
    // เพิ่ม Listener สำหรับฟอร์มเป้าหมาย
    const goalForm = document.getElementById('goal-form');
    if (goalForm) {
        goalForm.addEventListener('submit', saveGoal);
    }

    // ลบปุ่มแก้ไขเป้าหมายเดิมออก (ถ้ามี) เพราะเราจะผูกใหม่ใน renderGoalUI
    // const editGoalBtn = document.getElementById('edit-goal-btn');
    // if (editGoalBtn) {
    //     editGoalBtn.onclick = () => editGoal(); 
    // }
    
    // เพิ่ม Listener สำหรับปุ่มลบ
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


// --- Auth State Listener ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        // Check if the current page requires a logged-in user
        let currentPage = window.location.pathname.split("/").pop();
        if (currentPage === 'login.html' || currentPage === 'register.html') {
            window.location.replace('index.html');
        } else if (currentPage === 'about.html') {
            startGoalListener();
        } else if (currentPage === 'index.html' || currentPage === 'index') {
            // startTransactionListener(); // ต้องมีฟังก์ชันนี้
        }
    } else {
        currentUser = null;
        // If the user is not logged in and not on the login/register page, redirect to login
        let currentPage = window.location.pathname.split("/").pop();
        if (currentPage !== 'login.html') {
            // window.location.replace('login.html');
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

    let currentPage = window.location.pathname.split("/").pop() || 'index';
    if(currentPage.endsWith('.html')) {
        currentPage = currentPage.slice(0, -5);
    }
     if (currentPage === '') {
        currentPage = 'index';
    }
    
    // ตั้งค่า active nav bar
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
    
    // เรียกฟังก์ชัน init ตามหน้าปัจจุบัน
    if (currentPage === 'index') {
        // initHomePage(); // ต้องมีฟังก์ชันนี้
    } else if (currentPage === 'login') {
        // initLoginPage(); // ต้องมีฟังก์ชันนี้
    } else if (currentPage === 'about') {
        initAboutPage(); 
    }
    // เพิ่ม else if สำหรับ 'invest' ถ้ามีฟังก์ชัน initInvestPage()
});