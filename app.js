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
    
    // Note: totalSaved here is currentAmount - initialAmount
    const remainingAmountToSave = targetAmount - initialAmount;
    let avgDailySaving = 0;
    let attainmentDate = { arithmetic: 'คำนวณไม่ได้', geometric: 'คำนวณไม่ได้', avgDaily: 0 };
    
    if (daysPassed > 0 && totalSaved > 0) {
        avgDailySaving = totalSaved / daysPassed;
        attainmentDate.avgDaily = avgDailySaving;

        // 1. Arithmetic Progression (Fixed saving per day)
        // Days to complete remaining balance from NOW: (Target - Current) / AvgDaily
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

// ฟังก์ชันสำหรับจัดการการแสดงผล UI ของเป้าหมาย
// app.js
// แทนที่ฟังก์ชัน renderGoalUI เก่าทั้งก้อนด้วยอันนี้

// app.js
// แทนที่ฟังก์ชัน renderGoalUI เก่าทั้งก้อนด้วยอันนี้

function renderGoalUI(goal) {
    const displayContainer = document.getElementById('goal-display-container');
    const formContainer = document.getElementById('goal-form-container');
    const goalForm = document.getElementById('goal-form');

    // [การแก้ไข] เราต้องดึงคอนเทนเนอร์หลักทั้งหมดมาควบคุม
    const goalStatusContainer = document.getElementById('goal-status-container');
    const saveMoneyContainer = document.getElementById('save-money-container');

    if (!goal) {
        // ไม่มีเป้าหมาย, แสดงฟอร์มสร้างเป้าหมาย
        
        // [การแก้ไข] สั่งแสดง/ซ่อนให้ครบทุกส่วน
        if (goalStatusContainer) goalStatusContainer.classList.remove('hidden'); // แสดงกรอบหลัก
        if (saveMoneyContainer) saveMoneyContainer.classList.add('hidden'); // ซ่อนส่วนออมเงิน
        displayContainer.classList.add('hidden'); // ซ่อนส่วนแสดงผล
        formContainer.classList.remove('hidden'); // แสดงฟอร์ม
        
        goalForm.reset();
        delete goalForm.dataset.docId; 
        delete goalForm.dataset.isEdit; 
        document.getElementById('goal-submit-btn').textContent = 'สร้างเป้าหมาย';
        return;
    }

    // มีเป้าหมาย, แสดงรายละเอียด
    if (goalStatusContainer) goalStatusContainer.classList.remove('hidden'); // แสดงกรอบหลัก
    if (saveMoneyContainer) saveMoneyContainer.classList.remove('hidden'); // แสดงส่วนออมเงิน
    displayContainer.classList.remove('hidden'); // แสดงส่วนแสดงผล
    formContainer.classList.add('hidden'); // ซ่อนฟอร์ม
    
    // --- (ส่วนที่เหลือคือโค้ดเดิมของคุณ ทำงานถูกต้องอยู่แล้ว) ---
    document.getElementById('display-goal-name').textContent = goal.name;
    document.getElementById('display-target-amount').textContent = goal.targetAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 });
    document.getElementById('display-current-amount').textContent = goal.currentAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 });

    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    const progressBar = document.getElementById('goal-progress-bar');
    progressBar.style.width = `${Math.min(progress, 100)}%`;
    progressBar.textContent = `${Math.min(progress, 100).toFixed(0)}%`;
    progressBar.setAttribute('aria-valuenow', Math.min(progress, 100).toFixed(0));

    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
    document.getElementById('display-remaining-amount').textContent = remaining.toLocaleString('th-TH', { minimumFractionDigits: 2 });
    
    const dateCreated = goal.createdAt ? new Date(goal.createdAt.toDate()) : null;
    const initialAmount = goal.initialAmount || 0;
    const totalSaved = goal.currentAmount - initialAmount;
    
    let attainment = { arithmetic: 'คำนวณไม่ได้', geometric: 'คำนวณไม่ได้', avgDaily: 0 };
    
    if (dateCreated) {
        const daysPassed = (new Date() - dateCreated) / (1000 * 60 * 60 * 24);
        
        if (daysPassed > 0.01) { 
            attainment = calculateAttainmentDate(initialAmount, goal.targetAmount, daysPassed, totalSaved);
        } else {
            attainment.arithmetic = "เริ่มการคำนวณในวันถัดไป";
            attainment.geometric = "เริ่มการคำนวณในวันถัดไป";
        }
    } else {
        attainment.arithmetic = "ไม่พบวันที่เริ่มต้น/ยอดเริ่มต้น";
        attainment.geometric = "ไม่พบวันที่เริ่มต้น/ยอดเริ่มต้น";
    }

    const avgDailyEl = document.getElementById('display-avg-daily');
    const resultArithmeticEl = document.getElementById('result-arithmetic');
    const resultGeometricEl = document.getElementById('result-geometric');
    
    if (avgDailyEl) avgDailyEl.textContent = attainment.avgDaily.toLocaleString('th-TH', { maximumFractionDigits: 2 });
    if (resultArithmeticEl) resultArithmeticEl.textContent = attainment.arithmetic;
    if (resultGeometricEl) resultGeometricEl.textContent = attainment.geometric;

    const editBtn = document.getElementById('edit-goal-btn');
    if (editBtn) {
        editBtn.onclick = null; 
        editBtn.onclick = () => editGoal(goal); 
    }
}

// ฟังก์ชันสำหรับสลับการแสดงผลจากสถานะเป้าหมายไปเป็นฟอร์มแก้ไข
function showGoalEditForm(goalData) {
    const goalStatusContainer = document.getElementById('goal-status-container');
    const goalFormContainer = document.getElementById('goal-form-container');
    const saveMoneyContainer = document.getElementById('save-money-container');

    // 1. สลับ UI: ซ่อนสถานะ, แสดงฟอร์ม
    goalStatusContainer?.classList.add('hidden');
    saveMoneyContainer?.classList.add('hidden');
    goalFormContainer?.classList.remove('hidden');

    // 2. ตั้งชื่อฟอร์ม/ปุ่มให้เป็น "แก้ไข"
    document.getElementById('goal-form-title').textContent = 'แก้ไขเป้าหมาย';
    document.getElementById('goal-submit-btn').textContent = 'บันทึกการแก้ไข';
    
    // (ข้อมูลในฟอร์มถูก Pre-fill แล้วโดย renderGoalUI)
    // แต่เพื่อความปลอดภัย ให้แน่ใจว่า ID ถูกตั้งค่าใน input field
    document.getElementById('goal-id').value = goalData.id; 
}


function startGoalListener() {
    const user = auth.currentUser;
    if (!user) return;

    // นี่คือการอ้างอิงไปยัง "ไฟล์" เป้าหมายไฟล์เดียวของเรา
    const goalRef = doc(db, "users", user.uid, "goal", GOAL_DOC_ID);

    // เราจะใช้ onSnapshot เพื่อ "ดักฟัง" การเปลี่ยนแปลงที่ "ไฟล์" นี้
    const unsubscribe = onSnapshot(goalRef, (docSnap) => {
        if (docSnap.exists()) {
            // ถ้าไฟล์มีอยู่, ส่งข้อมูลไปวาดหน้าจอ
            renderGoalUI({ id: docSnap.id, ...docSnap.data() });
        } else {
            // ถ้าไฟล์ไม่มี (เช่น ผู้ใช้ใหม่)
            renderGoalUI(null); 
        }
    }, (error) => {
        console.error("Error listening to goal:", error);
        showModal('ข้อผิดพลาด', 'ไม่สามารถดึงข้อมูลเป้าหมายได้');
    });

    // (เราจะเก็บ unsubscribe ไว้ เผื่อต้องใช้ตอน logout)
}

// ฟังก์ชันสำหรับบันทึก/แก้ไขเป้าหมาย
async function handleGoalFormSubmit(e) {
    e.preventDefault();
    
    const isEdit = e.target.dataset.isEdit === 'true';
    const user = auth.currentUser;
    if (!user) {
        showModal('ข้อผิดพลาด', 'กรุณาเข้าสู่ระบบอีกครั้งเพื่อบันทึกเป้าหมาย (เซสชันการล็อกอินอาจหมดอายุ)');
        setTimeout(() => {
            window.location.replace('login.html');
        }, 2000); 
        return;
    }

    const goalName = document.getElementById('goal-name').value;
    const targetAmount = parseFloat(document.getElementById('target-amount').value);
    const currentAmount = parseFloat(document.getElementById('current-amount').value);
    const goalForm = document.getElementById('goal-form');
    const docId = goalForm.dataset.docId || GOAL_DOC_ID; 
    const dataToSave = {
        name: goalName,
        targetAmount: targetAmount,
        currentAmount: currentAmount,
        updatedAt: serverTimestamp()
    };

if (!isEdit) {
        dataToSave.createdAt = serverTimestamp(); // <-- เพิ่มวันที่สร้าง
        dataToSave.initialAmount = currentAmount; // <-- เพิ่มยอดเริ่มต้น (คือยอดปัจจุบันตอนที่สร้าง)
    }

    // สร้าง docRef ไว้ใช้ซ้ำ
    const goalRef = doc(db, "users", user.uid, "goal", docId);

    try {
        if (isEdit) {
            await updateDoc(goalRef, dataToSave);
        } else {
            // (ใช้ setDoc กับ merge: true จะปลอดภัยกว่า)
            await setDoc(goalRef, dataToSave, { merge: true });
        }

        // 3. ค่อยแสดง Modal
        showModal("สำเร็จ!", isEdit ? "อัปเดตเป้าหมายเรียบร้อยแล้ว" : "สร้างเป้าหมายใหม่สำเร็จ!");

        // 4. รีเซ็ตฟอร์ม (โค้ดเดิม)
        e.target.reset(); 
        delete e.target.dataset.isEdit;
        delete e.target.dataset.docId;

    } catch (error) {
        // ... (โค้ด catch block เหมือนเดิม) ...
    }


    if (targetAmount <= 0) {
        showModal('ข้อผิดพลาด', 'ยอดเงินเป้าหมายต้องมากกว่า 0');
        return;
    }
    if (currentAmount < 0) {
        showModal('ข้อผิดพลาด', 'ยอดเงินเริ่มต้นต้องไม่เป็นค่าติดลบ');
        return;
    }

    // Determine if it is a new creation (to set initialAmount/createdAt)
    const isCreatingNew = docId === GOAL_DOC_ID && !goalForm.dataset.isEdit;

    try {
        // Path การบันทึกที่ถูกต้อง (Collection 'goal')
        const goalRef = doc(db, 'artifacts', firebaseConfig.appId, 'users', user.uid, 'goal', docId);

        let goalData = {
            name: goalName,
            targetAmount: targetAmount,
            currentAmount: currentAmount,
            updatedAt: serverTimestamp()
        };

        // **Logic เพิ่มเติม: บันทึก initialAmount และ createdAt เมื่อสร้างใหม่เท่านั้น**
        if (isCreatingNew) {
            goalData.initialAmount = currentAmount;
            goalData.createdAt = serverTimestamp();
        }

        await setDoc(goalRef, goalData, { merge: true }); 

        showModal("สำเร็จ!", isEdit ? "อัปเดตเป้าหมายเรียบร้อยแล้ว" : "สร้างเป้าหมายใหม่สำเร็จ!");

        e.target.reset(); 
        e.target.dataset.isEdit = 'false';
        delete e.target.dataset.docId;
        delete goalForm.dataset.isEdit; 

    } catch (error) {
        console.error('Error saving goal:', error);
        // **โค้ดแก้ไข: แสดง error code หรือ message เพื่อช่วย Debug**
        const errorMessage = error.code ? `${error.code}: ${error.message}` : error.message;
        showModal('ข้อผิดพลาด', `ไม่สามารถบันทึกเป้าหมายได้: ${errorMessage}`);
    }
}

// ฟังก์ชันสำหรับเปิดฟอร์มพร้อมข้อมูลเดิมเพื่อแก้ไข

function editGoal(goalData) {
    const formContainer = document.getElementById('goal-form-container');
    const goalForm = document.getElementById('goal-form');
    
    // [แก้ไข] ดึง Element ที่ต้องซ่อนให้ถูกต้อง
    const displayContainer = document.getElementById('goal-display-container'); // << ซ่อนอันนี้
    const saveMoneyContainer = document.getElementById('save-money-container'); // << และซ่อนอันนี้

    // 1. นำข้อมูลที่มีอยู่มาใส่ในช่องกรอก
    document.getElementById('goal-name').value = goalData.name;
    document.getElementById('target-amount').value = goalData.targetAmount;
    document.getElementById('current-amount').value = goalData.currentAmount;

    // 2. กำหนด docId และ isEdit flag
    goalForm.dataset.docId = goalData.id;
    goalForm.dataset.isEdit = 'true';

    // 3. เปลี่ยนข้อความปุ่ม
    document.getElementById('goal-submit-btn').textContent = 'บันทึกการแก้ไข';

    // 4. [แก้ไข] ซ่อนส่วนแสดงผล (display) และส่วนออมเงิน (save)
    //    และแสดงฟอร์มแก้ไข (form)
    if (displayContainer) displayContainer.classList.add('hidden');
    if (saveMoneyContainer) saveMoneyContainer.classList.add('hidden');
    
    // เราจะไม่ซ่อน goal-status-container เพราะฟอร์มอยู่ในนั้น
    formContainer.classList.remove('hidden'); // << แสดงฟอร์ม
}

// New function for handling money saving in about.html
async function handleSaveMoney(e) {
    e.preventDefault();
    
    const user = auth.currentUser;
    if (!user) {
        showModal('ข้อผิดพลาด', 'กรุณาเข้าสู่ระบบอีกครั้งเพื่อบันทึกเงินออม');
        return;
    }

    const saveAmountInput = document.getElementById('save-amount');
    let saveAmount = parseFloat(saveAmountInput.value);

    // *** ส่วนที่เพิ่มเพื่อบังคับปัดเศษทศนิยมไม่เกิน 2 ตำแหน่ง ***
    if (isNaN(saveAmount) || saveAmount <= 0) {
        showModal('ข้อผิดพลาด', 'จำนวนเงินที่ออมต้องเป็นตัวเลขและมากกว่า 0');
        return;
    }
    
    // ปัดเศษตัวเลขให้เหลือทศนิยม 2 ตำแหน่ง
    saveAmount = Math.round(saveAmount * 100) / 100;
    // *************************************************************

    try {
        const goalRef = doc(db, 'artifacts', appId, 'users', user.uid, 'goal', GOAL_DOC_ID);
        const docSnap = await getDoc(goalRef);
        
        if (!docSnap.exists()) {
            showModal('ข้อผิดพลาด', 'ไม่พบเป้าหมายทางการเงิน กรุณาสร้างเป้าหมายก่อน');
            return;
        }

        const goalData = docSnap.data();
        const newCurrentAmount = (goalData.currentAmount || 0) + saveAmount;

        await updateDoc(goalRef, {
            currentAmount: newCurrentAmount,
            updatedAt: serverTimestamp()
        });

        showModal('สำเร็จ', `บันทึกเงินออม ${saveAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท เรียบร้อยแล้ว`);
        saveAmountInput.value = ''; // ล้างค่าในช่องกรอก
        
    } catch (error) {
        console.error('Error saving money:', error);
        // **โค้ดแก้ไข: แสดง error code หรือ message เพื่อช่วย Debug**
        const errorMessage = error.code ? `${error.code}: ${error.message}` : error.message;
        showModal('ข้อผิดพลาด', `ไม่สามารถบันทึกเงินออมได้: ${errorMessage}`);
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
            // *** FIX: Changed 'goals' to 'goal' collection path ***
            const goalRef = doc(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'goal', GOAL_DOC_ID);
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