// app.js

// ------------------------------------------------------------------------------------------------
// 📌 1. Firebase Imports
// ------------------------------------------------------------------------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getAuth, 
    signOut, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    addDoc, 
    collection, 
    onSnapshot, 
    query, 
    serverTimestamp, 
    updateDoc, 
    orderBy, 
    deleteDoc,
    where // เพิ่ม where สำหรับการ Query ที่ซับซ้อนขึ้น
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";


// ------------------------------------------------------------------------------------------------
// 📌 2. Global Variables & Firebase Setup
// ------------------------------------------------------------------------------------------------
let app, db, auth;
let unsubscribeFromTransactions = null;
let unsubscribeFromGoal = null;
let confirmCallback = null;
let currentUser = null; 
let currentBalance = 0; // ยอดคงเหลือปัจจุบัน
const GOAL_DOC_ID = 'user_goal'; // Document ID สำหรับเก็บเป้าหมาย

// Firebase Configuration (กรุณาใช้ค่า config ของคุณ)
const firebaseConfig = {
  apiKey: "AIzaSyC6d1_FmSvfrnhpqFxdKrg-bleCVC5XkUM",
  authDomain: "app-math-465713.firebaseapp.com",
  projectId: "app-math-465713",
  storageBucket: "app-math-465713.firebasestorage.app",
  messagingSenderId: "896330929514",
  appId: "1:896330929514:web:f2aa9442ab19a3f7574113",
  measurementId: "G-8H400D8BHL"
};

// Initialize Firebase App, Auth, and Firestore
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("Firebase initialized successfully.");
} catch (error) {
    console.error("Firebase initialization error:", error);
}


// ------------------------------------------------------------------------------------------------
// 📌 3. Utility & Modal Functions (ส่วนช่วยในการแสดงผลและยืนยัน)
// ------------------------------------------------------------------------------------------------

/**
 * แสดง Modal ข้อความแจ้งเตือนหรือข้อผิดพลาด
 * @param {string} title - หัวข้อ Modal
 * @param {string} message - ข้อความรายละเอียด
 * @param {boolean} isError - กำหนดว่าเป็นข้อผิดพลาดหรือไม่
 */
function showModal(title, message, isError = false) {
    const modal = document.getElementById('message-modal');
    if (!modal) return; // ป้องกัน Error ถ้า Modal ไม่มีในหน้านั้น
    
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

/**
 * แสดง Modal ยืนยันการกระทำ
 * @param {string} title - หัวข้อ Modal
 * @param {string} message - ข้อความรายละเอียด
 * @param {function} callback - ฟังก์ชันที่จะถูกเรียกเมื่อผู้ใช้กดยืนยัน
 */
function showConfirmationModal(title, message, callback) {
    const modal = document.getElementById('confirmation-modal');
    if (!modal) return;
    
    document.getElementById('confirmation-title').textContent = title;
    document.getElementById('confirmation-message').textContent = message;
    confirmCallback = callback;
    modal.style.display = 'flex';
}

function hideConfirmationModal() {
    document.getElementById('confirmation-modal').style.display = 'none';
    confirmCallback = null;
}


// ------------------------------------------------------------------------------------------------
// 📌 4. Goal Management Functions (เกี่ยวกับหน้า about.html)
// ------------------------------------------------------------------------------------------------

/**
 * ฟังก์ชันสำหรับจัดการการแสดงผล UI ของเป้าหมาย
 * @param {object | null} goal - ข้อมูลเป้าหมายจาก Firestore หรือ null
 */
function renderGoalUI(goal) {
    const displayContainer = document.getElementById('goal-display-container'); 
    const formContainer = document.getElementById('goal-form-container');
    const goalForm = document.getElementById('goal-form');
    const progressBar = document.getElementById('progress-bar'); 
    
    if (!displayContainer || !formContainer || !goalForm) return;

    if (!goal) {
        // ไม่มีเป้าหมาย, แสดงฟอร์มสร้างเป้าหมาย
        displayContainer.classList.add('hidden');
        formContainer.classList.remove('hidden');
        goalForm.reset(); 
        delete goalForm.dataset.docId; 
        delete goalForm.dataset.isEdit; 
        document.getElementById('goal-form-title').textContent = 'สร้างเป้าหมายใหม่';
        document.getElementById('goal-submit-btn').textContent = 'บันทึกเป้าหมาย';
        return;
    }

    // มีเป้าหมาย, แสดงรายละเอียด
    displayContainer.classList.remove('hidden');
    formContainer.classList.add('hidden');
    
    document.getElementById('display-goal-name').textContent = goal.name;
    document.getElementById('display-target-amount').textContent = goal.targetAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 });
    document.getElementById('display-current-amount').textContent = goal.currentAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 });

    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    
    if (progressBar) {
        progressBar.style.width = `${Math.min(progress, 100)}%`;
        // อัปเดตสีของ ProgressBar ตามความคืบหน้า
        progressBar.classList.remove('bg-red-500', 'bg-yellow-500', 'bg-green-500');
        if (progress < 50) {
            progressBar.classList.add('bg-red-500');
        } else if (progress < 100) {
            progressBar.classList.add('bg-yellow-500');
        } else {
            progressBar.classList.add('bg-green-500');
        }
    }
    document.getElementById('display-progress-percent').textContent = `${Math.min(progress, 100).toFixed(1)}%`;

    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
    document.getElementById('display-remaining-amount').textContent = remaining.toLocaleString('th-TH', { minimumFractionDigits: 2 });
    
    // ผูกปุ่มแก้ไข (Edit Button) - การแก้ไขที่สำคัญเพื่อให้ทำงาน
    const editBtn = document.getElementById('edit-goal-btn');
    if (editBtn) {
        editBtn.onclick = null; 
        editBtn.onclick = () => {
            console.log('✅ EDIT BUTTON CLICKED. Calling editGoal with data:', goal); 
            editGoal(goal);
        }; 
    }
}

/**
 * ฟังก์ชันสำหรับสลับไปหน้าฟอร์มแก้ไขเป้าหมาย และนำข้อมูลเดิมมาแสดง
 * @param {object} goalData - ข้อมูลเป้าหมายปัจจุบัน
 */
function editGoal(goalData) {
    console.log('➡️ Entering editGoal function. Switching UI.'); 

    const displayContainer = document.getElementById('goal-display-container'); 
    const formContainer = document.getElementById('goal-form-container');
    const goalForm = document.getElementById('goal-form');
    
    if (!displayContainer || !formContainer || !goalForm) return;

    // 1. นำข้อมูลที่มีอยู่มาใส่ในช่องกรอก
    document.getElementById('goal-name').value = goalData?.name || '';
    document.getElementById('target-amount').value = goalData?.targetAmount || 0;
    document.getElementById('current-amount').value = goalData?.currentAmount || 0;

    // 2. กำหนด docId และ isEdit flag 
    goalForm.dataset.docId = GOAL_DOC_ID; 
    goalForm.dataset.isEdit = 'true';

    // 3. เปลี่ยนข้อความปุ่มและหัวข้อ
    document.getElementById('goal-form-title').textContent = 'แก้ไขเป้าหมาย';
    document.getElementById('goal-submit-btn').textContent = 'บันทึกการแก้ไข';

    // 4. สลับ UI
    displayContainer.classList.add('hidden');
    formContainer.classList.remove('hidden');
}


/**
 * บันทึกหรืออัปเดตเป้าหมาย
 * @param {Event} event - Event จากการ Submit Form
 */
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
    if (currentAmount < 0) {
        showModal('ข้อผิดพลาด', 'ยอดเงินเริ่มต้นต้องไม่ติดลบ', true);
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
        // ใช้ setDoc + merge: true เพื่ออัปเดตหรือสร้างใหม่
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

/**
 * ลบเป้าหมาย
 */
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


/**
 * เริ่มต้น Listener เพื่อติดตามการเปลี่ยนแปลงของเป้าหมายแบบเรียลไทม์
 */
function startGoalListener() {
    if (!currentUser) return;
    if (unsubscribeFromGoal) unsubscribeFromGoal(); // หยุด listener เดิมหากมี

    const goalRef = doc(db, 'users', currentUser.uid, 'goals', GOAL_DOC_ID);
    
    unsubscribeFromGoal = onSnapshot(goalRef, (doc) => {
        if (doc.exists()) {
            const goalData = {
                id: doc.id,
                ...doc.data()
            };
            renderGoalUI(goalData);
        } else {
            renderGoalUI(null); // ไม่มีเป้าหมาย, แสดงหน้าฟอร์มสร้างเป้าหมาย
        }
    }, (error) => {
        console.error("Error listening to goal changes: ", error);
    });
}


// ------------------------------------------------------------------------------------------------
// 📌 5. Transaction Management Functions (เกี่ยวกับหน้า index.html)
// ------------------------------------------------------------------------------------------------

/**
 * อัปเดตยอดเงินที่เก็บได้ใน Goal (เรียกใช้หลังการบันทึก/ลบ Transaction)
 * @param {number} amountChange - จำนวนเงินที่เปลี่ยนแปลง (บวกสำหรับรายรับ, ลบสำหรับรายจ่าย)
 */
async function updateGoalProgress(amountChange) {
    if (!currentUser) return;

    try {
        const goalRef = doc(db, 'users', currentUser.uid, 'goals', GOAL_DOC_ID);
        const goalSnap = await getDoc(goalRef);

        if (goalSnap.exists()) {
            const currentAmount = goalSnap.data().currentAmount || 0;
            const newCurrentAmount = Math.max(0, currentAmount + amountChange); // ไม่ให้ติดลบ
            
            await updateDoc(goalRef, {
                currentAmount: newCurrentAmount,
                updatedAt: serverTimestamp()
            });
            console.log(`Goal progress updated: ${currentAmount} -> ${newCurrentAmount}`);
        }
    } catch (error) {
        console.error("Error updating goal progress:", error);
    }
}


/**
 * บันทึกรายการรายรับ/รายจ่ายใหม่
 * @param {Event} event - Event จากการ Submit Form
 */
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
        
        // อัปเดต Goal Progress
        const amountChange = type === 'income' ? amount : -amount;
        await updateGoalProgress(amountChange); 
        
    } catch (error) {
        console.error("Error adding document: ", error);
        showModal('ข้อผิดพลาด', 'ไม่สามารถบันทึกรายการได้', true);
    }
}

/**
 * ลบรายการรายรับ/รายจ่าย
 * @param {string} docId - ID ของเอกสาร Transaction ที่ต้องการลบ
 */
async function deleteTransaction(docId) {
    if (!currentUser) return;
    try {
        // ต้องดึงข้อมูลรายการก่อนลบเพื่ออัปเดต Goal Progress ให้ถูกต้อง
        const transactionRef = doc(db, 'users', currentUser.uid, 'transactions', docId);
        const transactionSnap = await getDoc(transactionRef);
        
        if (!transactionSnap.exists()) {
            showModal('ข้อผิดพลาด', 'ไม่พบรายการที่ต้องการลบ', true);
            return;
        }

        const transactionData = transactionSnap.data();
        const { amount, type } = transactionData;
        
        await deleteDoc(transactionRef);
        showModal('สำเร็จ', 'ลบรายการเรียบร้อยแล้ว');

        // อัปเดต Goal Progress โดยการย้อนกลับรายการ
        const amountChange = type === 'income' ? -amount : amount; // รายรับที่ถูกลบต้องลบออกจาก Goal, รายจ่ายที่ถูกลบต้องเพิ่มกลับเข้า Goal
        await updateGoalProgress(amountChange);
        
    } catch (error) {
        console.error("Error deleting document: ", error);
        showModal('ข้อผิดพลาด', 'ไม่สามารถลบรายการได้', true);
    }
}

/**
 * แสดงรายการธุรกรรมทั้งหมดบนหน้าจอ
 * @param {Array<object>} transactions - รายการธุรกรรม
 */
function renderTransactionsList(transactions) {
    const listContainer = document.getElementById('transactions-list');
    const totalIncomeElement = document.getElementById('total-income');
    const totalExpenseElement = document.getElementById('total-expense');
    const balanceElement = document.getElementById('current-balance');

    if (!listContainer || !totalIncomeElement || !totalExpenseElement || !balanceElement) return;

    listContainer.innerHTML = ''; 
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

        // การจัดการ Timestamp ให้เป็นรูปแบบวันที่ที่อ่านง่าย
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
                'คุณแน่ใจหรือไม่ที่จะลบรายการนี้? ยอดคงเหลือและเป้าหมายจะถูกปรับปรุง',
                () => {
                    deleteTransaction(docId);
                }
            );
        });
    });
}

/**
 * เริ่มต้น Listener เพื่อติดตามการเปลี่ยนแปลงของรายการแบบเรียลไทม์
 */
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


// ------------------------------------------------------------------------------------------------
// 📌 6. User Management Functions (เกี่ยวกับหน้า login.html)
// ------------------------------------------------------------------------------------------------

/**
 * ลงทะเบียนผู้ใช้ใหม่
 * @param {Event} event - Event จากการ Submit Form
 */
async function registerUser(event) {
    event.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const username = document.getElementById('register-username').value;
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // บันทึกข้อมูลผู้ใช้เพิ่มเติม
        await setDoc(doc(db, "users", user.uid), {
            username: username,
            email: email,
            createdAt: serverTimestamp()
        });
        showModal('สำเร็จ', 'ลงทะเบียนสำเร็จ! เข้าสู่ระบบแล้ว');
    } catch (error) {
        console.error("Registration error:", error);
        showModal('ข้อผิดพลาด', 'ลงทะเบียนไม่สำเร็จ: ' + error.message, true);
    }
}

/**
 * เข้าสู่ระบบผู้ใช้
 * @param {Event} event - Event จากการ Submit Form
 */
async function loginUser(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        // Auth state listener จะจัดการการเปลี่ยนหน้า
    } catch (error) {
        console.error("Login error:", error);
        showModal('ข้อผิดพลาด', 'เข้าสู่ระบบไม่สำเร็จ: ' + error.message, true);
    }
}

/**
 * ออกจากระบบผู้ใช้
 */
async function logoutUser() {
    try {
        // หยุด Listener ทั้งหมดก่อนออกจากระบบเพื่อป้องกัน Error
        if (unsubscribeFromTransactions) unsubscribeFromTransactions();
        if (unsubscribeFromGoal) unsubscribeFromGoal();
        
        await signOut(auth);
        window.location.replace('login.html');
    } catch (error) {
        console.error("Error logging out: ", error);
        showModal('ข้อผิดพลาด', 'ไม่สามารถออกจากระบบได้', true);
    }
}


// ------------------------------------------------------------------------------------------------
// 📌 7. Initialization Functions (ผูก Event Listeners ตามหน้าต่างๆ)
// ------------------------------------------------------------------------------------------------

function initLoginPage() {
    document.getElementById('login-form')?.addEventListener('submit', loginUser);
    document.getElementById('register-form')?.addEventListener('submit', registerUser);
    
    // ปุ่มสลับหน้า Login/Register
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
    // ผูกปุ่ม Logout สำหรับหน้านี้ (ถ้ามี)
    document.getElementById('logout-btn-about')?.addEventListener('click', logoutUser); 
}

function initInvestPage() {
    // ฟังก์ชันนี้ไว้สำหรับผูก Event Listener ของหน้า invest.html (ถ้ามี)
    console.log("Initializing Invest Page...");
    document.getElementById('logout-btn-invest')?.addEventListener('click', logoutUser);
    
    // *** คุณสามารถเพิ่มฟังก์ชันการคำนวณการลงทุน การแสดงผล หรือ Listener อื่นๆ ในส่วนนี้ ***
}


// ------------------------------------------------------------------------------------------------
// 📌 8. Auth State Listener & Entry Point
// ------------------------------------------------------------------------------------------------

// ติดตามสถานะการเข้าสู่ระบบ
onAuthStateChanged(auth, (user) => {
    let currentPage = window.location.pathname.split("/").pop();
    if(currentPage === '') currentPage = 'index.html';
    
    // ตรวจสอบสถานะผู้ใช้
    if (user) {
        currentUser = user;
        console.log("User is logged in:", user.uid);
        
        // Redirect จากหน้า Login ไปหน้าหลัก
        if (currentPage === 'login.html') {
            window.location.replace('index.html');
        } 
        
        // เริ่ม Listener ตามหน้าปัจจุบัน
        if (currentPage === 'about.html') {
            startGoalListener();
        } else if (currentPage === 'index.html') {
            startTransactionListener(); 
        }
    } else {
        currentUser = null;
        console.log("User is logged out.");
        
        // หากไม่อยู่ในหน้า Login ให้ Redirect ไปหน้า Login
        if (currentPage !== 'login.html') {
            // Unsubscribe listeners 
            if (unsubscribeFromTransactions) unsubscribeFromTransactions();
            if (unsubscribeFromGoal) unsubscribeFromGoal();
            window.location.replace('login.html');
        }
        
        // หากอยู่ในหน้า About แต่ไม่มีผู้ใช้
        if (currentPage === 'about.html') {
             renderGoalUI(null); 
        }
    }
});


// เมื่อ DOM โหลดเสร็จสมบูรณ์
document.addEventListener('DOMContentLoaded', () => {
    // ผูก Event สำหรับ Modal ยืนยัน
    document.getElementById('confirm-cancel-btn')?.addEventListener('click', hideConfirmationModal);
    document.getElementById('confirm-action-btn')?.addEventListener('click', () => {
        if (typeof confirmCallback === 'function') {
            confirmCallback();
        }
        hideConfirmationModal();
    });

    // ผูก Event สำหรับ Modal ข้อความ
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
        if (linkHref === currentPage || (currentPage === 'index.html' && linkHref === 'index.html')) {
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
        initInvestPage();
    }
});

// โค้ดนี้มีความยาวประมาณ 500 บรรทัด เมื่อรวมกับความคิดเห็นและโครงสร้างที่สมบูรณ์แล้ว
// หากโค้ดต้นฉบับของคุณมีความซับซ้อนกว่านี้มาก
// คุณสามารถเพิ่มฟังก์ชันสำหรับจัดการข้อมูลเฉพาะทางในหน้า Invest หรือการจัดการ User Profile เพิ่มเติมได้