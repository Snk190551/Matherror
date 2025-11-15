// app.js

// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, addDoc, collection, onSnapshot, query, serverTimestamp, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- Global Variables & Firebase Setup ---
let app, db, auth;
let unsubscribeFromTransactions = null;
let unsubscribeFromGoals = null; // New unsubscribe for goals
let confirmCallback = null;

const firebaseConfig = {
  apiKey: "AIzaSyC6d1_FmSvfrnhpqFxdKrg-bleCVC5XkUM",
  authDomain: "app-math-465713.firebaseapp.com",
  projectId: "app-math-465713",
  storageBucket: "app-math-465713.firebasestorage.app",
  messagingSenderId: "896330929514",
  appId: "1:896330929514:web:f2aa9442ab19a3f7574113",
  measurementId: "G-8H400D84V2"
};

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Initialize Firebase App
try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
} catch (error) {
    console.error("Firebase initialization error:", error);
}

// Global modal handlers
const showModal = (title, message) => {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-message').textContent = message;
    document.getElementById('message-modal').style.display = 'flex';
};

const hideModal = () => {
    document.getElementById('message-modal').style.display = 'none';
};
window.hideModal = hideModal; // Make it globally accessible for the button onclick

const showConfirmationModal = (title, message, callback) => {
    document.getElementById('confirmation-title').textContent = title;
    document.getElementById('confirmation-message').textContent = message;
    confirmCallback = callback;
    document.getElementById('confirmation-modal').style.display = 'flex';
};

const hideConfirmationModal = () => {
    document.getElementById('confirmation-modal').style.display = 'none';
    confirmCallback = null;
};

// --- Firestore Reference Helpers ---

const getTransactionCollectionRef = (userId) => {
    return collection(db, `artifacts/${appId}/users/${userId}/transactions`);
};

const getGoalCollectionRef = (userId) => {
    return collection(db, `artifacts/${appId}/users/${userId}/goals`);
};

// --- AUTHENTICATION Handlers ---

const loginUser = async (email, password) => {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        showModal('สำเร็จ', 'เข้าสู่ระบบสำเร็จ! กำลังนำทาง...');
        setTimeout(() => { window.location.replace('index.html'); }, 1500);
    } catch (error) {
        console.error("Login error:", error);
        showModal('เกิดข้อผิดพลาด', 'เข้าสู่ระบบไม่สำเร็จ: ' + error.message);
    }
};

const registerUser = async (email, password, username) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: username });

        // Save username to Firestore for later reference
        const userDocRef = doc(db, `artifacts/${appId}/users/${userCredential.user.uid}/profile/info`);
        await setDoc(userDocRef, {
            username: username,
            email: email,
            createdAt: serverTimestamp()
        });

        showModal('สำเร็จ', `สมัครสมาชิกสำเร็จในชื่อ ${username}! กำลังนำทาง...`);
        setTimeout(() => { window.location.replace('index.html'); }, 1500);

    } catch (error) {
        console.error("Registration error:", error);
        showModal('เกิดข้อผิดพลาด', 'สมัครสมาชิกไม่สำเร็จ: ' + error.message);
    }
};

const logoutUser = async () => {
    showConfirmationModal('ยืนยันการออกจากระบบ', 'คุณต้องการออกจากระบบใช่หรือไม่?', async () => {
        try {
            if (unsubscribeFromTransactions) {
                unsubscribeFromTransactions();
            }
            if (unsubscribeFromGoals) { // Unsubscribe from goals
                unsubscribeFromGoals();
            }
            await signOut(auth);
            // Redirect will happen via onAuthStateChanged listener
        } catch (error) {
            console.error("Logout error:", error);
            showModal('เกิดข้อผิดพลาด', 'ออกจากระบบไม่สำเร็จ: ' + error.message);
        }
    });
};

// --- Transaction Handlers (Index Page) ---

const saveTransaction = async (description, type, category, amount) => {
    const user = auth.currentUser;
    if (!user) {
        showModal('ข้อผิดพลาด', 'โปรดเข้าสู่ระบบก่อน');
        return;
    }

    try {
        await addDoc(getTransactionCollectionRef(user.uid), {
            description,
            type,
            category,
            amount: parseFloat(amount),
            createdAt: serverTimestamp()
        });
        showModal('สำเร็จ', 'บันทึกรายการสำเร็จ');
        document.getElementById('transaction-form').reset();
    } catch (error) {
        console.error("Error saving transaction:", error);
        showModal('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกรายการได้: ' + error.message);
    }
};

const deleteTransaction = async (id) => {
    const user = auth.currentUser;
    if (!user) return;

    showConfirmationModal('ยืนยันการลบ', 'คุณต้องการลบรายการนี้ใช่หรือไม่?', async () => {
        try {
            const docRef = doc(getTransactionCollectionRef(user.uid), id);
            await deleteDoc(docRef);
            showModal('สำเร็จ', 'ลบรายการสำเร็จ');
        } catch (error) {
            console.error("Error deleting document:", error);
            showModal('เกิดข้อผิดพลาด', 'ไม่สามารถลบรายการได้: ' + error.message);
        }
    });
};

const renderTransactionsUI = (transactions) => {
    const list = document.getElementById('transactions-list');
    const balanceEl = document.getElementById('current-balance');
    const incomeEl = document.getElementById('total-income');
    const expenseEl = document.getElementById('total-expense');

    if (!list || !balanceEl) return;

    list.innerHTML = '';
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(t => {
        const amount = t.amount;
        const isIncome = t.type === 'income';

        if (isIncome) {
            totalIncome += amount;
        } else {
            totalExpense += amount;
        }

        const date = t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString('th-TH') : 'N/A';

        const listItem = document.createElement('div');
        listItem.className = `p-3 rounded-xl shadow-sm mb-2 flex justify-between items-center ${isIncome ? 'bg-green-50 border-l-4 border-green-500' : 'bg-red-50 border-l-4 border-red-500'}`;
        listItem.innerHTML = `
            <div class="flex-1 min-w-0">
                <p class="font-semibold text-gray-800 truncate">${t.description}</p>
                <p class="text-xs text-gray-500 mt-1">ประเภท: ${isIncome ? 'รายรับ' : 'รายจ่าย'} | หมวดหมู่: ${t.category}</p>
            </div>
            <div class="text-right ml-4">
                <p class="font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}">${amount.toLocaleString('th-TH')} บาท</p>
                <p class="text-xs text-gray-500">${date}</p>
            </div>
            <button data-id="${t.id}" class="delete-btn ml-3 p-1 text-red-500 hover:text-red-700 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 10-2 0v6a1 1 0 102 0V8z" clip-rule="evenodd" />
                </svg>
            </button>
        `;
        list.appendChild(listItem);
    });

    const currentBalance = totalIncome - totalExpense;
    balanceEl.textContent = `${currentBalance.toLocaleString('th-TH')} บาท`;
    balanceEl.className = `text-4xl font-extrabold ${currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`;
    incomeEl.textContent = `+${totalIncome.toLocaleString('th-TH')} บาท`;
    expenseEl.textContent = `-${totalExpense.toLocaleString('th-TH')} บาท`;

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            deleteTransaction(id);
        });
    });
};

const initHomePage = () => {
    const transactionForm = document.getElementById('transaction-form');

    if (transactionForm) {
        transactionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const description = document.getElementById('description').value;
            const type = document.getElementById('type').value;
            const category = document.getElementById('category').value;
            const amount = document.getElementById('amount').value;
            
            if (description && type && category && amount) {
                 saveTransaction(description, type, category, amount);
            } else {
                 showModal('ข้อมูลไม่ครบถ้วน', 'โปรดกรอกข้อมูลทุกช่องให้ครบ');
            }
        });
    }

    onAuthStateChanged(auth, (user) => {
        if (user) {
            if (unsubscribeFromTransactions) {
                unsubscribeFromTransactions(); // Clean up old listener
            }
            // Real-time listener for transactions, ordered by creation time
            const q = query(getTransactionCollectionRef(user.uid), orderBy("createdAt", "desc"));
            unsubscribeFromTransactions = onSnapshot(q, (querySnapshot) => {
                const transactions = [];
                querySnapshot.forEach((doc) => {
                    transactions.push({ id: doc.id, ...doc.data() });
                });
                renderTransactionsUI(transactions);
            }, (error) => {
                console.error("Error listening to transactions:", error);
                showModal('ข้อผิดพลาด', 'ไม่สามารถโหลดรายการธุรกรรมได้');
            });
        } else {
            // User logged out
            if (unsubscribeFromTransactions) {
                unsubscribeFromTransactions();
            }
            renderTransactionsUI([]);
            window.location.replace('login.html');
        }
    });
};

// --- Goal Handlers (About/Goals Page) ---

const saveGoal = async (goalId, name, targetAmount, currentAmount) => {
    const user = auth.currentUser;
    if (!user) {
        showModal('ข้อผิดพลาด', 'โปรดเข้าสู่ระบบก่อน');
        return;
    }

    try {
        const goalData = {
            name,
            targetAmount: parseFloat(targetAmount),
            currentAmount: parseFloat(currentAmount),
            updatedAt: serverTimestamp()
        };

        if (goalId) {
            // Update existing goal
            const docRef = doc(getGoalCollectionRef(user.uid), goalId);
            await updateDoc(docRef, goalData);
            showModal('สำเร็จ', 'อัปเดตเป้าหมายสำเร็จ');
        } else {
            // Add new goal
            await addDoc(getGoalCollectionRef(user.uid), {
                ...goalData,
                createdAt: serverTimestamp()
            });
            showModal('สำเร็จ', 'บันทึกเป้าหมายใหม่สำเร็จ');
        }
        document.getElementById('goal-form').reset();
        document.getElementById('goal-submit-btn').textContent = 'สร้างเป้าหมาย';
        document.getElementById('goal-form').dataset.goalId = '';
    } catch (error) {
        console.error("Error saving goal:", error);
        showModal('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกเป้าหมายได้: ' + error.message);
    }
};

const deleteGoal = (goalId) => {
    const user = auth.currentUser;
    if (!user) return;

    showConfirmationModal('ยืนยันการลบเป้าหมาย', 'คุณต้องการลบเป้าหมายนี้ใช่หรือไม่? ข้อมูลทั้งหมดจะถูกลบ', async () => {
        try {
            const docRef = doc(getGoalCollectionRef(user.uid), goalId);
            await deleteDoc(docRef);
            showModal('สำเร็จ', 'ลบเป้าหมายสำเร็จ');
        } catch (error) {
            console.error("Error deleting goal:", error);
            showModal('เกิดข้อผิดพลาด', 'ไม่สามารถลบเป้าหมายได้: ' + error.message);
        }
    });
};

const updateGoalProgress = (goalId, currentAmount) => {
    const user = auth.currentUser;
    if (!user) return;

    showConfirmationModal('ยืนยันการอัปเดต', `คุณต้องการอัปเดตยอดเงินปัจจุบันเป็น ${parseFloat(currentAmount).toLocaleString('th-TH')} บาท ใช่หรือไม่?`, async () => {
        try {
            const docRef = doc(getGoalCollectionRef(user.uid), goalId);
            await updateDoc(docRef, {
                currentAmount: parseFloat(currentAmount),
                updatedAt: serverTimestamp()
            });
            showModal('สำเร็จ', 'อัปเดตยอดเงินปัจจุบันสำเร็จ');
        } catch (error) {
            console.error("Error updating goal progress:", error);
            showModal('เกิดข้อผิดพลาด', 'ไม่สามารถอัปเดตยอดเงินได้: ' + error.message);
        }
    });
};

const renderGoalsUI = (goals) => {
    const goalsList = document.getElementById('goals-list');
    if (!goalsList) return;

    goalsList.innerHTML = '';

    if (goals.length === 0) {
        goalsList.innerHTML = '<p class="text-center text-gray-500 mt-8">ยังไม่มีเป้าหมายการออมเงิน ลองสร้างเป้าหมายแรกของคุณ!</p>';
        return;
    }

    goals.forEach(goal => {
        const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
        const remaining = goal.targetAmount - goal.currentAmount;
        const isCompleted = goal.currentAmount >= goal.targetAmount;

        const listItem = document.createElement('div');
        listItem.className = 'bg-white p-5 rounded-xl shadow-md mb-4 border border-gray-100';
        listItem.innerHTML = `
            <h3 class="text-xl font-bold text-gray-800 mb-2">${goal.name} ${isCompleted ? '<span class="text-sm bg-yellow-400 text-gray-800 px-2 py-0.5 rounded-full">สำเร็จ!</span>' : ''}</h3>
            
            <div class="mb-4">
                <div class="flex justify-between text-sm text-gray-600 mb-1">
                    <span>${goal.currentAmount.toLocaleString('th-TH')} บาท</span>
                    <span class="font-semibold text-blue-600">${goal.targetAmount.toLocaleString('th-TH')} บาท</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2.5">
                    <div class="bg-blue-500 h-2.5 rounded-full transition-all duration-500" style="width: ${progress}%"></div>
                </div>
                <p class="text-xs text-gray-500 mt-1">ความคืบหน้า: ${progress.toFixed(2)}%</p>
            </div>

            <p class="text-sm text-gray-700 font-medium mb-4">ยอดเงินที่ต้องเก็บเพิ่ม: <span class="${remaining > 0 ? 'text-red-500' : 'text-green-500'}">${Math.max(0, remaining).toLocaleString('th-TH')} บาท</span></p>
            
            <div class="flex flex-col space-y-2 md:space-y-0 md:flex-row md:space-x-2">
                <button data-id="${goal.id}" data-name="${goal.name}" data-target="${goal.targetAmount}" data-current="${goal.currentAmount}" class="edit-goal-btn flex-1 bg-yellow-500 text-white text-sm font-bold py-2 px-3 rounded-xl hover:bg-yellow-600 transition-colors">แก้ไข</button>
                <button data-id="${goal.id}" class="delete-goal-btn flex-1 bg-red-500 text-white text-sm font-bold py-2 px-3 rounded-xl hover:bg-red-600 transition-colors">ลบ</button>
                <button data-id="${goal.id}" data-current="${goal.currentAmount}" class="update-progress-btn flex-1 bg-green-500 text-white text-sm font-bold py-2 px-3 rounded-xl hover:bg-green-600 transition-colors">อัปเดตยอดเงิน</button>
            </div>
        `;
        goalsList.appendChild(listItem);
    });

    // Attach event listeners after rendering
    document.querySelectorAll('.edit-goal-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            const name = e.currentTarget.dataset.name;
            const target = e.currentTarget.dataset.target;
            const current = e.currentTarget.dataset.current;

            // Populate form for editing
            document.getElementById('goal-name').value = name;
            document.getElementById('target-amount').value = target;
            document.getElementById('current-amount').value = current;
            document.getElementById('goal-submit-btn').textContent = 'บันทึกการแก้ไข';
            document.getElementById('goal-form').dataset.goalId = id;
            document.getElementById('goal-form-section').scrollIntoView({ behavior: 'smooth' });
        });
    });

    document.querySelectorAll('.delete-goal-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            deleteGoal(id);
        });
    });

    document.querySelectorAll('.update-progress-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            const currentAmount = prompt('โปรดกรอกยอดเงินปัจจุบันทั้งหมด (บาท):', e.currentTarget.dataset.current);
            if (currentAmount !== null && !isNaN(parseFloat(currentAmount))) {
                updateGoalProgress(id, currentAmount);
            } else if (currentAmount !== null) {
                showModal('ข้อผิดพลาด', 'โปรดกรอกจำนวนเงินที่ถูกต้อง');
            }
        });
    });
};


const initGoalsPage = () => {
    const goalForm = document.getElementById('goal-form');

    if (goalForm) {
        goalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const goalId = goalForm.dataset.goalId || null;
            const name = document.getElementById('goal-name').value;
            const targetAmount = document.getElementById('target-amount').value;
            const currentAmount = document.getElementById('current-amount').value;
            
            if (name && targetAmount && currentAmount && parseFloat(targetAmount) > 0) {
                 saveGoal(goalId, name, targetAmount, currentAmount);
            } else {
                 showModal('ข้อมูลไม่ถูกต้อง', 'โปรดกรอกข้อมูลให้ครบถ้วนและยอดเงินเป้าหมายต้องมากกว่า 0');
            }
        });
    }

    onAuthStateChanged(auth, (user) => {
        if (user) {
            if (unsubscribeFromGoals) {
                unsubscribeFromGoals(); // Clean up old listener
            }
            // Real-time listener for goals, ordered by creation time
            const q = query(getGoalCollectionRef(user.uid));
            unsubscribeFromGoals = onSnapshot(q, (querySnapshot) => {
                const goals = [];
                querySnapshot.forEach((doc) => {
                    goals.push({ id: doc.id, ...doc.data() });
                });
                renderGoalsUI(goals);
            }, (error) => {
                console.error("Error listening to goals:", error);
                showModal('ข้อผิดพลาด', 'ไม่สามารถโหลดเป้าหมายได้');
            });
        } else {
            // User logged out
            if (unsubscribeFromGoals) {
                unsubscribeFromGoals();
            }
            renderGoalsUI([]);
            window.location.replace('login.html');
        }
    });
};

// --- Login Page Handler ---

const initLoginPage = () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterBtn = document.getElementById('show-register-btn');
    const showLoginBtn = document.getElementById('show-login-btn');
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            loginUser(email, password);
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const username = document.getElementById('register-username').value;
            registerUser(email, password, username);
        });
    }

    if (showRegisterBtn && showLoginBtn && loginSection && registerSection) {
        showRegisterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loginSection.classList.add('hidden');
            registerSection.classList.remove('hidden');
        });

        showLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            registerSection.classList.add('hidden');
            loginSection.classList.remove('hidden');
        });
    }
};

// --- Entry Point ---
document.addEventListener('DOMContentLoaded', () => {
    // Global Confirmation Modal Setup
    document.getElementById('confirm-cancel-btn')?.addEventListener('click', hideConfirmationModal);
    document.getElementById('confirm-action-btn')?.addEventListener('click', () => {
        if (typeof confirmCallback === 'function') {
            confirmCallback();
        }
        hideConfirmationModal();
    });

    let currentPage = window.location.pathname.split("/").pop() || 'index.html';
    if(currentPage.endsWith('.html')) {
        currentPage = currentPage.slice(0, -5); // 'index'
    } else if (currentPage === '') {
        currentPage = 'index';
    }
    
    // Set active navigation link based on current page
    document.querySelectorAll('nav a').forEach(link => {
        let linkPage = link.getAttribute('href').split('/').pop() || 'index.html';
        if(linkPage.endsWith('.html')) {
            linkPage = linkPage.slice(0, -5);
        } else if (linkPage === '') {
            linkPage = 'index';
        }
        
        if (linkPage === currentPage) {
            link.classList.add('active-nav');
        }
    });
    
    // Initialize page-specific logic
    if (currentPage === 'index') {
        initHomePage();
    } else if (currentPage === 'login') {
        initLoginPage();
    } else if (currentPage === 'about') { // about.html is now the Goals page
        initGoalsPage();
    } else if (currentPage === 'invest') {
        // initInvestPage(); // Placeholder for future investment logic
        onAuthStateChanged(auth, (user) => {
             if (!user) {
                window.location.replace('login.html');
            }
        });
    }

    // Attempt to sign in with custom token for Canvas environment
    const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

    if (initialAuthToken && auth) {
        signInWithCustomToken(auth, initialAuthToken).catch(error => {
            console.error("Firebase Custom Token Sign-In Error:", error);
            // Fallback to anonymous sign-in if custom token fails
            signInAnonymously(auth).catch(anonError => {
                 console.error("Firebase Anonymous Sign-In Error:", anonError);
            });
        });
    }
});