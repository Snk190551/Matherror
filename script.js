// Element SDK Configuration
const defaultConfig = {
    hero_title: "ระบบบันทึกรายรับรายจ่าย + ข่าวการลงทุน + คำนวณเงินเฟ้อแบบอัตโนมัติ",
    hero_subtitle: "จัดการการเงินส่วนตัวอย่างมืออาชีพ ติดตามรายรับรายจ่าย วางแผนเป้าหมายการออม และอัปเดตข่าวการลงทุนแบบเรียลไทม์",
    company_name: "FinTrack",
    background_color: "#f9fafb",
    primary_color: "#0f766e",
    secondary_color: "#1e40af",
    text_color: "#1f2937",
    accent_color: "#10b981"
};

async function onConfigChange(config) {
    const heroTitle = document.getElementById('hero-title');
    const heroSubtitle = document.getElementById('hero-subtitle');
    const companyName = document.getElementById('company-name');
    const footerCompanyName = document.getElementById('footer-company-name');

    if (heroTitle) heroTitle.textContent = config.hero_title || defaultConfig.hero_title;
    if (heroSubtitle) heroSubtitle.textContent = config.hero_subtitle || defaultConfig.hero_subtitle;
    if (companyName) companyName.textContent = config.company_name || defaultConfig.company_name;
    if (footerCompanyName) footerCompanyName.textContent = config.company_name || defaultConfig.company_name;

    document.body.style.backgroundColor = config.background_color || defaultConfig.background_color;

    const primaryColor = config.primary_color || defaultConfig.primary_color;
    const accentColor = config.accent_color || defaultConfig.accent_color;

    document.documentElement.style.setProperty('--primary-color', primaryColor);
    document.documentElement.style.setProperty('--accent-color', accentColor);
}

function mapToCapabilities(config) {
    return {
        recolorables: [
            {
                get: () => config.background_color || defaultConfig.background_color,
                set: (value) => {
                    if (window.elementSdk) {
                        window.elementSdk.setConfig({ background_color: value });
                    }
                }
            },
            {
                get: () => config.primary_color || defaultConfig.primary_color,
                set: (value) => {
                    if (window.elementSdk) {
                        window.elementSdk.setConfig({ primary_color: value });
                    }
                }
            },
            {
                get: () => config.text_color || defaultConfig.text_color,
                set: (value) => {
                    if (window.elementSdk) {
                        window.elementSdk.setConfig({ text_color: value });
                    }
                }
            },
            {
                get: () => config.accent_color || defaultConfig.accent_color,
                set: (value) => {
                    if (window.elementSdk) {
                        window.elementSdk.setConfig({ accent_color: value });
                    }
                }
            }
        ],
        borderables: [],
        fontEditable: undefined,
        fontSizeable: undefined
    };
}

function mapToEditPanelValues(config) {
    return new Map([
        ["hero_title", config.hero_title || defaultConfig.hero_title],
        ["hero_subtitle", config.hero_subtitle || defaultConfig.hero_subtitle],
        ["company_name", config.company_name || defaultConfig.company_name]
    ]);
}

// Initialize Element SDK
if (window.elementSdk) {
    window.elementSdk.init({
        defaultConfig,
        onConfigChange,
        mapToCapabilities,
        mapToEditPanelValues
    });
}

// ===== REAL-TIME MARKET DATA SIMULATION =====

let marketData = {
    set: { value: 1425.50, change: 8.50, percent: 0.60 },
    btc: { value: 68450, change: 2.5 },
    eth: { value: 3820, change: 1.8 },
    gold: { value: 36250, change: -0.3 }
};

function updateMarketData() {
    // SET Index
    const setChange = (Math.random() - 0.5) * 5;
    marketData.set.value += setChange;
    marketData.set.change += setChange;
    marketData.set.percent = (marketData.set.change / (marketData.set.value - marketData.set.change)) * 100;

    const setIndexEl = document.getElementById('set-index');
    if (setIndexEl) {
        setIndexEl.textContent = marketData.set.value.toFixed(2);
        const setChangeElem = document.getElementById('set-change');
        const setColor = marketData.set.change >= 0 ? 'text-green-600' : 'text-red-600';
        const setSign = marketData.set.change >= 0 ? '+' : '';
        setChangeElem.innerHTML = `<span class="${setColor}">${setSign}${marketData.set.change.toFixed(2)} (${setSign}${marketData.set.percent.toFixed(2)}%)</span>`;
    }

    // Bitcoin
    const btcChange = (Math.random() - 0.5) * 1000;
    marketData.btc.value += btcChange;
    marketData.btc.change = ((btcChange / marketData.btc.value) * 100);

    const btcPriceEl = document.getElementById('btc-price');
    if (btcPriceEl) {
        btcPriceEl.textContent = '$' + marketData.btc.value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        const btcChangeElem = document.getElementById('btc-change');
        const btcColor = marketData.btc.change >= 0 ? 'text-green-600' : 'text-red-600';
        const btcSign = marketData.btc.change >= 0 ? '+' : '';
        btcChangeElem.innerHTML = `<span class="${btcColor}">${btcSign}${marketData.btc.change.toFixed(1)}%</span>`;
    }

    // Ethereum
    const ethChange = (Math.random() - 0.5) * 100;
    marketData.eth.value += ethChange;
    marketData.eth.change = ((ethChange / marketData.eth.value) * 100);

    const ethPriceEl = document.getElementById('eth-price');
    if (ethPriceEl) {
        ethPriceEl.textContent = '$' + marketData.eth.value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        const ethChangeElem = document.getElementById('eth-change');
        const ethColor = marketData.eth.change >= 0 ? 'text-green-600' : 'text-red-600';
        const ethSign = marketData.eth.change >= 0 ? '+' : '';
        ethChangeElem.innerHTML = `<span class="${ethColor}">${ethSign}${marketData.eth.change.toFixed(1)}%</span>`;
    }

    // Gold
    const goldChange = (Math.random() - 0.5) * 50;
    marketData.gold.value += goldChange;
    marketData.gold.change = ((goldChange / marketData.gold.value) * 100);

    const goldPriceEl = document.getElementById('gold-price');
    if (goldPriceEl) {
        goldPriceEl.textContent = marketData.gold.value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        const goldChangeElem = document.getElementById('gold-change');
        const goldColor = marketData.gold.change >= 0 ? 'text-green-600' : 'text-red-600';
        const goldSign = marketData.gold.change >= 0 ? '+' : '';
        goldChangeElem.innerHTML = `<span class="${goldColor}">${goldSign}${marketData.gold.change.toFixed(1)}%</span>`;
    }
}

// Update market data every 3 seconds
setInterval(updateMarketData, 3000);

// ===== NEWS DATA AND FUNCTIONS =====

const newsDatabase = [
    {
        category: 'stocks',
        icon: 'fa-chart-line',
        gradient: 'from-green-400 to-teal-600',
        badge: '📈 หุ้น',
        badgeColor: 'bg-green-100 text-green-700',
        title: 'ตลาดหุ้นไทยปิดบวก 8.5 จุด แตะระดับ 1,425 จุด',
        description: 'ดัชนีตลาดหลักทรัพย์แห่งประเทศไทยปิดการซื้อขายในแนวโน้มบวก จากแรงซื้อหุ้นกลุ่มพลังงานและธนาคาร',
        time: '2 ชั่วโมงที่แล้ว',
        image: 'https://images.unsplash.com/photo-1611974765270-ca1258634369?w=600&auto=format&fit=crop&q=60',
        url: 'https://www.set.or.th/th/home'
    },
    {
        category: 'crypto',
        icon: 'fa-bitcoin',
        gradient: 'from-orange-400 to-yellow-600',
        badge: '💎 คริปโต',
        badgeColor: 'bg-orange-100 text-orange-700',
        title: 'Bitcoin ทะลุ $70,000 อีกครั้ง หลังข่าวดี ETF',
        description: 'ราคา Bitcoin พุ่งแรงทะลุระดับ 70,000 ดอลลาร์สหรัฐ ตามกระแสข่าวดีจากการอนุมัติ ETF ใหม่',
        time: '3 ชั่วโมงที่แล้ว',
        image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=600&auto=format&fit=crop&q=60',
        url: 'https://coinmarketcap.com/currencies/bitcoin/'
    },
    {
        category: 'economy',
        icon: 'fa-globe',
        gradient: 'from-blue-400 to-indigo-600',
        badge: '🌍 เศรษฐกิจ',
        badgeColor: 'bg-blue-100 text-blue-700',
        title: 'ธนาคารกลางสหรัฐคงอัตราดอกเบี้ยนโยบาย',
        description: 'เฟดประกาศคงอัตราดอกเบี้ยนโยบายที่ระดับ 5.25-5.50% พร้อมส่งสัญญาณอาจปรับลดในไตรมาสถัดไป',
        time: '5 ชั่วโมงที่แล้ว',
        image: 'https://images.unsplash.com/photo-1526304640152-d4619684e484?w=600&auto=format&fit=crop&q=60',
        url: 'https://www.federalreserve.gov/'
    },
    {
        category: 'funds',
        icon: 'fa-briefcase',
        gradient: 'from-purple-400 to-pink-600',
        badge: '💰 กองทุน',
        badgeColor: 'bg-purple-100 text-purple-700',
        title: 'กองทุน RMF ยอดขายทะลุ 50,000 ล้านบาท',
        description: 'นักลงทุนแห่ซื้อกองทุน RMF เพื่อลดหย่อนภาษี ยอดขายสะสมในปีนี้ทะลุ 50,000 ล้านบาท',
        time: '6 ชั่วโมงที่แล้ว',
        image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&auto=format&fit=crop&q=60',
        url: 'https://www.google.com/search?q=RMF+fund'
    },
    {
        category: 'stocks',
        icon: 'fa-chart-line',
        gradient: 'from-red-400 to-pink-600',
        badge: '📈 หุ้น',
        badgeColor: 'bg-red-100 text-red-700',
        title: 'หุ้นเทคโนโลยีสหรัฐฯ ฟื้นตัว นำโดย Apple และ Microsoft',
        description: 'หุ้นกลุ่มเทคโนโลยีในตลาดสหรัฐฯ ปรับตัวขึ้นแรง โดยเฉพาะ Apple และ Microsoft หลังผลประกอบการดี',
        time: '8 ชั่วโมงที่แล้ว',
        image: 'https://images.unsplash.com/photo-1611974765270-ca1258634369?w=600&auto=format&fit=crop&q=60',
        url: 'https://finance.yahoo.com/'
    },
    {
        category: 'crypto',
        icon: 'fa-coins',
        gradient: 'from-teal-400 to-cyan-600',
        badge: '💎 คริปโต',
        badgeColor: 'bg-teal-100 text-teal-700',
        title: 'Ethereum อัปเกรดสำเร็จ ค่าธรรมเนียมลดลง 40%',
        description: 'เครือข่าย Ethereum อัปเกรดเวอร์ชันใหม่สำเร็จ ทำให้ค่าธรรมเนียมการทำธุรกรรมลดลงอย่างมีนัยสำคัญ',
        time: '10 ชั่วโมงที่แล้ว',
        image: 'https://images.unsplash.com/photo-1622630998477-20aa696fa4f8?w=600&auto=format&fit=crop&q=60',
        url: 'https://ethereum.org/en/'
    },
    {
        category: 'economy',
        icon: 'fa-building-columns',
        gradient: 'from-indigo-400 to-purple-600',
        badge: '🌍 เศรษฐกิจ',
        badgeColor: 'bg-indigo-100 text-indigo-700',
        title: 'IMF คาดการณ์เศรษฐกิจโลกเติบโต 3.2% ในปี 2567',
        description: 'กองทุนการเงินระหว่างประเทศคาดว่าเศรษฐกิจโลกจะเติบโต 3.2% โดยเอเชียเป็นกลไกสำคัญ',
        time: '12 ชั่วโมงที่แล้ว',
        image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=60',
        url: 'https://www.imf.org/en/Home'
    },
    {
        category: 'funds',
        icon: 'fa-chart-pie',
        gradient: 'from-pink-400 to-rose-600',
        badge: '💰 กองทุน',
        badgeColor: 'bg-pink-100 text-pink-700',
        title: 'กองทุนหุ้นไทยให้ผลตอบแทนเฉลี่ย 12% ใน 6 เดือนแรก',
        description: 'กองทุนรวมหุ้นไทยมีผลการดำเนินงานดี โดยเฉลี่ยให้ผลตอบแทน 12% ในช่วง 6 เดือนแรกของปี',
        time: '14 ชั่วโมงที่แล้ว',
        image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=60',
        url: 'https://www.morningstarthailand.com/'
    },
    {
        category: 'stocks',
        icon: 'fa-industry',
        gradient: 'from-cyan-400 to-blue-600',
        badge: '📈 หุ้น',
        badgeColor: 'bg-cyan-100 text-cyan-700',
        title: 'หุ้นพลังงานไทยผงาดขึ้นแรง หลังราคาน้ำมันปรับตัวสูง',
        description: 'หุ้นกลุ่มพลังงานของไทยปรับตัวขึ้นสูงตามราคาน้ำมันดิบที่เพิ่มขึ้น นำโดย PTT และ PTTEP',
        time: '16 ชั่วโมงที่แล้ว',
        image: 'https://images.unsplash.com/photo-1518458028785-8fbcd101ebb9?w=600&auto=format&fit=crop&q=60',
        url: 'https://www.pttplc.com/'
    }
];

let currentNewsFilter = 'all';

function renderNews(filter = 'all') {
    currentNewsFilter = filter;
    const newsGrid = document.getElementById('news-grid');
    if (!newsGrid) return;

    const filteredNews = filter === 'all' ? newsDatabase : newsDatabase.filter(news => news.category === filter);

    newsGrid.innerHTML = filteredNews.map(news => `
    <article class="news-card card-hover animate-fade-in flex flex-col h-full bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
      <a href="${news.url}" target="_blank" class="block h-48 overflow-hidden relative group bg-gray-100">
        <img src="${news.image}" alt="${news.title}" 
             class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
             onerror="this.style.display='none'; this.nextElementSibling.nextElementSibling.style.display='flex'">
        <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>
        
        <!-- Fallback if image fails -->
        <div class="hidden w-full h-full bg-gradient-to-br ${news.gradient} flex items-center justify-center absolute inset-0 z-0">
             <i class="fas ${news.icon} text-white text-6xl opacity-80"></i>
        </div>
      </a>
      <div class="p-6 flex-1 flex flex-col">
        <div class="flex items-center space-x-2 mb-3">
          <span class="category-badge ${news.badgeColor}">${news.badge}</span>
          <span class="text-xs text-gray-500 flex items-center"><i class="far fa-clock mr-1"></i> ${news.time}</span>
        </div>
        <h3 class="text-lg font-bold text-gray-800 mb-2 line-clamp-2 hover:text-indigo-600 transition-colors">
          <a href="${news.url}" target="_blank">${news.title}</a>
        </h3>
        <p class="text-sm text-gray-600 mb-4 line-clamp-3 flex-1">
          ${news.description}
        </p>
        <a href="${news.url}" target="_blank" class="text-indigo-600 font-semibold hover:text-indigo-800 flex items-center mt-auto text-sm group">
          อ่านต่อที่นี่ <i class="fas fa-arrow-right ml-2 transition-transform group-hover:translate-x-1"></i>
        </a>
      </div>
    </article>
  `).join('');

    updateNewsTime();
}

function filterNews(category) {
    // Update button states
    document.querySelectorAll('.news-category-btn').forEach(btn => {
        if (btn.dataset.category === category) {
            btn.classList.remove('bg-gray-100', 'text-gray-700');
            btn.classList.add('bg-teal-600', 'text-white');
        } else {
            btn.classList.remove('bg-teal-600', 'text-white');
            btn.classList.add('bg-gray-100', 'text-gray-700');
        }
    });

    renderNews(category);
}

function refreshNews() {
    const btn = document.getElementById('refresh-news-btn');
    const icon = btn.querySelector('i');

    // Add spinning animation
    icon.classList.add('spinning');
    btn.disabled = true;

    // Simulate refresh
    setTimeout(() => {
        // Shuffle news randomly
        newsDatabase.sort(() => Math.random() - 0.5);
        renderNews(currentNewsFilter);

        icon.classList.remove('spinning');
        btn.disabled = false;

        // Show toast message
        showToast('อัปเดตข่าวเรียบร้อย!');
    }, 1000);
}

function updateNewsTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    const timeEl = document.getElementById('news-update-time');
    if (timeEl) {
        timeEl.textContent = `(อัปเดต ${timeString} น.)`;
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-8 right-8 bg-teal-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-fade-in';
    toast.innerHTML = `<i class="fas fa-check-circle mr-2"></i>${message}`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// ===== INFLATION RATE DATA FROM BOT API =====

let cachedInflationRate = null;

async function fetchInflationRate() {
    try {
        // Use mock data with realistic simulation
        const currentDate = new Date();
        const month = currentDate.getMonth();

        // Realistic Thai CPI data (varies by month)
        const inflationRates = [2.41, 2.38, 2.45, 2.52, 2.48, 2.41, 2.39, 2.44, 2.50, 2.46, 2.43, 2.40];
        const rate = inflationRates[month] + (Math.random() * 0.1 - 0.05);

        cachedInflationRate = parseFloat(rate.toFixed(2));

        // Update UI
        const rateDisplay = document.getElementById('inflation-rate-display');
        const rateInput = document.getElementById('inflation-rate');
        const updateDate = document.getElementById('inflation-update-date');

        if (rateDisplay) rateDisplay.textContent = cachedInflationRate + '%';
        if (rateInput) rateInput.value = cachedInflationRate;

        // Update date
        const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        const dateString = `${monthNames[month]} ${currentDate.getFullYear() + 543}`;
        if (updateDate) updateDate.textContent = `อัปเดต: ${dateString}`;

    } catch (error) {
        console.error('Error fetching inflation rate:', error);
        // Fallback to default rate
        cachedInflationRate = 2.41;
        const rateDisplay = document.getElementById('inflation-rate-display');
        const rateInput = document.getElementById('inflation-rate');
        if (rateDisplay) rateDisplay.textContent = cachedInflationRate + '%';
        if (rateInput) rateInput.value = cachedInflationRate;
    }
}

// Navigation
function navigateTo(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + sectionId) {
            link.classList.add('active');
        }
    });
}

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Update active nav link on scroll
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const scrollY = window.scrollY;

    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');

        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === '#' + sectionId) {
                    link.classList.add('active');
                }
            });
        }
    });
});

// Modal Functions
// ==========================================
// Google Sheets Authentication System
// ==========================================

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz0iZeLie5m180xEntfWyW3yHgPFcNkJjCY2zfZs9MIyJtukjgFLeYlZPv0Kh8dMhpF/exec';
let currentUser = null;

// JSONP Helper function to bypass CORS
function callGoogleScript(params, callback) {
    const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
    window[callbackName] = function (data) {
        delete window[callbackName];
        document.body.removeChild(script);
        callback(data);
    };

    const script = document.createElement('script');

    // Construct URL with parameters
    const queryString = Object.keys(params)
        .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
        .join('&');

    script.src = `${GOOGLE_SCRIPT_URL}?callback=${callbackName}&${queryString}`;
    document.body.appendChild(script);
}

// Check for saved user session
function checkSession() {
    const savedUser = localStorage.getItem('fintrack_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUserUI();
    }
}

function updateUserUI() {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const heroBtn = document.getElementById('hero-cta-btn');
    const userNameDisplay = document.getElementById('user-name-display');
    const userAvatar = document.getElementById('user-avatar');

    if (currentUser) {
        // User is logged in
        if (authButtons) authButtons.classList.add('hidden');
        if (userMenu) {
            userMenu.classList.remove('hidden');
            // Update user info if elements exist
            if (userNameDisplay) userNameDisplay.textContent = currentUser.name || 'User';
            if (userAvatar) userAvatar.textContent = (currentUser.name || 'U').charAt(0).toUpperCase();
        }

        // Update Hero Button
        if (heroBtn) {
            heroBtn.innerHTML = '<i class="fas fa-rocket mr-2"></i>เริ่มใช้งาน';
            heroBtn.onclick = () => navigateTo('dashboard');
        }
    } else {
        // User is logged out
        if (authButtons) authButtons.classList.remove('hidden');
        if (userMenu) userMenu.classList.add('hidden');

        // Reset Hero Button
        if (heroBtn) {
            heroBtn.innerHTML = '<i class="fas fa-rocket mr-2"></i>เริ่มต้นใช้งานฟรี';
            heroBtn.onclick = showRegister;
        }
    }
}

function handleLogout() {
    if (confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
        currentUser = null;
        localStorage.removeItem('fintrack_user');
        updateUserUI();
        loadFinancialData(); // Reload to show demo data
        showToast('ออกจากระบบเรียบร้อยแล้ว');
        setTimeout(startDemoMode, 1500);
    }
}

// Modal Functions
function showLogin() {
    closeModals();
    document.getElementById('login-modal').classList.remove('hidden');
    document.getElementById('login-modal').classList.add('flex');
}

function showRegister() {
    closeModals();
    document.getElementById('register-modal').classList.remove('hidden');
    document.getElementById('register-modal').classList.add('flex');
}

function closeModals() {
    const loginModal = document.getElementById('login-modal');
    const registerModal = document.getElementById('register-modal');

    if (loginModal) {
        loginModal.classList.add('hidden');
        loginModal.classList.remove('flex');
    }
    if (registerModal) {
        registerModal.classList.add('hidden');
        registerModal.classList.remove('flex');
    }
    const analysisModal = document.getElementById('analysis-modal');
    if (analysisModal) {
        analysisModal.classList.add('hidden');
        analysisModal.classList.remove('flex');
    }
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;

    // Loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>กำลังเข้าสู่ระบบ...';

    callGoogleScript({
        action: 'login',
        email: email,
        password: password
    }, function (response) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;

        if (response.success) {
            // Login Success
            currentUser = response.user;
            localStorage.setItem('fintrack_user', JSON.stringify(currentUser));

            stopDemoMode(); // Stop demo on login
            closeModals();
            updateUserUI();
            loadFinancialData(); // Reload data for the logged-in user
            showToast(`ยินดีต้อนรับ, ${currentUser.name}!`);
            navigateTo('dashboard');
        } else {
            // Login Failed
            alert(response.message || 'เข้าสู่ระบบไม่สำเร็จ');
        }
    });
}

function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;

    if (password !== confirm) {
        alert('รหัสผ่านไม่ตรงกัน');
        return;
    }

    // Loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>กำลังสมัครสมาชิก...';

    callGoogleScript({
        action: 'register',
        name: name,
        email: email,
        password: password
    }, function (response) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;

        if (response.success) {
            // Register Success
            closeModals();
            showToast('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ');
            setTimeout(() => showLogin(), 1000);
        } else {
            // Register Failed
            alert(response.message || 'สมัครสมาชิกไม่สำเร็จ');
        }
    });
}

// ==========================================
// Transaction & Goal Management System (Persistent)
// ==========================================

let transactions = [];
let goals = [];

// Load initial data
// Load initial data
function loadFinancialData() {
    if (currentUser) {
        // User Mode: Load user-specific data
        const userKey = `fintrack_data_${currentUser.email}`;
        const savedData = localStorage.getItem(userKey);

        if (savedData) {
            const parsed = JSON.parse(savedData);
            transactions = parsed.transactions || [];
            goals = parsed.goals || [];
        } else {
            // New user: Start empty
            transactions = [];
            goals = [];
        }
    } else {
        // Demo Mode: Load demo data (reset on refresh or keep separate demo storage? 
        // User asked to "show example", implying a static or reset state is fine, 
        // but let's allow interaction without saving to user storage)

        // Let's reset to default demo data every time for "Example Mode" as requested.

        const next10Years = new Date().getFullYear() + 10;
        const deadlineDate = `${next10Years}-12-31`;

        transactions = [
            { id: 1, date: '2024-06-15', type: 'income', category: 'salary', amount: 25000, note: 'เงินเดือนประจำเดือน' },
            { id: 2, date: '2024-06-14', type: 'expense', category: 'food', amount: 350, note: 'ค่าอาหารกลางวัน' },
            { id: 3, date: '2024-06-13', type: 'expense', category: 'transport', amount: 800, note: 'ค่าน้ำมัน' },
            { id: 4, date: '2024-06-12', type: 'income', category: 'business', amount: 8500, note: 'รายได้จากฟรีแลนซ์' },
            { id: 5, date: '2024-06-11', type: 'expense', category: 'bills', amount: 1200, note: 'ค่าไฟฟ้า-ประปา' }
        ];

        goals = [
            { id: 1, title: 'ซื้อรถยนต์', target: 500000, current: 325000, deadline: deadlineDate, icon: '🚗' },
            { id: 2, title: 'เที่ยวญี่ปุ่น', target: 80000, current: 33600, deadline: deadlineDate, icon: '✈️' },
            { id: 3, title: 'บ้านเดี่ยวหรู', target: 8000000, current: 100000, deadline: deadlineDate, icon: '🏠' }
        ];
    }

    renderTransactions();
    renderGoals();
    renderInterestRates(); // Updated: Render interest rates
    initChart(); // Updated: Initialize chart
    updateDashboard();
}

// Save data
function saveData() {
    if (currentUser) {
        // Save to user-specific storage
        const userKey = `fintrack_data_${currentUser.email}`;
        const dataToSave = {
            transactions: transactions,
            goals: goals
        };
        localStorage.setItem(userKey, JSON.stringify(dataToSave));
    } else {
        // In Demo Mode, we don't save to persistent user storage.
        // We could save to a temp key if we wanted persistence across reloads for demo,
        // but "Example Mode" usually implies a showcase. 
        // For now, changes in Demo Mode are ephemeral (lost on reload), which fits "Example".
    }
    updateDashboard();
}

// Transaction Functions
function toggleTransactionForm() {
    const form = document.getElementById('transaction-form');
    if (form) form.classList.toggle('hidden');
}

function handleAddTransaction(e) {
    e.preventDefault();

    const type = document.getElementById('trans-type').value;
    const category = document.getElementById('trans-category').value;
    const amount = parseFloat(document.getElementById('trans-amount').value);
    const date = document.getElementById('trans-date').value;
    const note = document.getElementById('trans-note').value;

    if (!amount || amount <= 0) {
        alert('กรุณาระบุจำนวนเงินที่ถูกต้อง');
        return;
    }

    const transaction = {
        id: Date.now(),
        type,
        category,
        amount,
        date,
        note
    };

    transactions.unshift(transaction);
    saveData();
    renderTransactions();

    // Show success message
    const form = e.target;
    const successMsg = document.createElement('div');
    successMsg.className = 'mt-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-center';
    successMsg.innerHTML = '<i class="fas fa-check-circle mr-2"></i>บันทึกรายการสำเร็จ!';
    form.appendChild(successMsg);

    setTimeout(() => {
        successMsg.remove();
        form.reset();
        toggleTransactionForm();
    }, 2000);
}

function deleteTransaction(id) {
    if (confirm('ต้องการลบรายการนี้ใช่หรือไม่?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveData();
        renderTransactions();
    }
}

function renderTransactions() {
    const tbody = document.querySelector('tbody.divide-y');
    if (!tbody) return;

    if (transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                    ยังไม่มีรายการบันทึก
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = transactions.map(t => {
        const isIncome = t.type === 'income';
        const colorClass = isIncome ? 'text-green-600' : 'text-red-600';
        const bgClass = isIncome ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
        const sign = isIncome ? '+' : '-';

        // Format date
        const dateObj = new Date(t.date);
        const dateStr = dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

        return `
        <tr class="transaction-item">
          <td class="px-6 py-4 text-sm text-gray-600">${dateStr}</td>
          <td class="px-6 py-4"><span class="category-badge ${bgClass}">${getCategoryName(t.category)}</span></td>
          <td class="px-6 py-4 text-sm text-gray-800">${t.note || '-'}</td>
          <td class="px-6 py-4 text-right ${colorClass} font-semibold">${sign}฿${t.amount.toLocaleString()}</td>
          <td class="px-6 py-4 text-center">
            <button onclick="deleteTransaction(${t.id})" class="text-red-600 hover:text-red-800 mx-1"> <i class="fas fa-trash"></i> </button>
          </td>
        </tr>
        `;
    }).join('');
}

function getCategoryName(category) {
    const names = {
        salary: '💰 เงินเดือน',
        food: '🍜 อาหาร',
        transport: '🚗 เดินทาง',
        shopping: '🛍️ ช้อปปิ้ง',
        bills: '📄 ค่าบิล',
        business: '💼 ธุรกิจ',
        other: '📦 อื่นๆ'
    };
    return names[category] || category;
}

// Goal Functions
function toggleGoalForm() {
    const form = document.getElementById('goal-form');
    if (form) form.classList.toggle('hidden');
}

function handleAddGoal(e) {
    e.preventDefault();

    const title = document.getElementById('goal-name').value;
    const target = parseFloat(document.getElementById('goal-target').value);
    const current = parseFloat(document.getElementById('goal-current').value) || 0;
    const deadline = document.getElementById('goal-deadline').value;
    const icon = document.getElementById('goal-icon').value;

    const goal = {
        id: Date.now(),
        title,
        target,
        current,
        deadline,
        icon
    };

    goals.push(goal);
    saveData();
    renderGoals();

    const form = e.target;
    const successMsg = document.createElement('div');
    successMsg.className = 'mt-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-center';
    successMsg.innerHTML = '<i class="fas fa-check-circle mr-2"></i>สร้างเป้าหมายสำเร็จ!';
    form.appendChild(successMsg);

    setTimeout(() => {
        successMsg.remove();
        form.reset();
        toggleGoalForm();
    }, 2000);
}

function deleteGoal(id) {
    if (confirm('ต้องการลบเป้าหมายนี้ใช่หรือไม่?')) {
        goals = goals.filter(g => g.id !== id);
        saveData();
        renderGoals();
    }
}

function renderGoals() {
    const container = document.getElementById('goals-grid');
    if (!container) return;

    if (goals.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-300">
                <div class="text-6xl mb-4">🎯</div>
                <h3 class="text-xl font-bold text-gray-600 mb-2">ยังไม่มีเป้าหมาย</h3>
                <p class="text-gray-500 mb-6">เริ่มต้นสร้างเป้าหมายทางการเงินของคุณวันนี้</p>
                <button class="btn-secondary" onclick="toggleGoalForm()">สร้างเป้าหมายแรก</button>
            </div>
        `;
        return;
    }

    container.innerHTML = goals.map(g => {
        const percent = Math.min(100, (g.current / g.target) * 100);
        const remaining = g.target - g.current;

        // Determine color based on progress
        let colorClass = 'teal';
        if (percent < 30) colorClass = 'red';
        else if (percent < 70) colorClass = 'blue';
        else colorClass = 'green';

        return `
        <div class="goal-card card-hover relative group">
           <button onclick="deleteGoal(${g.id})" class="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100">
                <i class="fas fa-trash-alt"></i>
            </button>
           <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-3"><span class="text-3xl">${g.icon}</span>
             <h3 class="text-lg font-bold text-gray-800">${g.title}</h3>
            </div>
           </div>
           <div class="mb-4">
            <div class="flex justify-between text-sm mb-2"><span class="text-gray-600">ความคืบหน้า</span> <span class="font-bold text-${colorClass}-600">${percent.toFixed(1)}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
             <div class="progress-bar bg-gradient-to-r from-${colorClass}-500 to-${colorClass}-600 h-3 rounded-full" style="width: ${percent}%;"></div>
            </div>
           </div>
           <div class="space-y-2">
            <div class="flex justify-between text-sm"><span class="text-gray-600">เป้าหมาย</span> <span class="font-semibold text-gray-800">฿${g.target.toLocaleString()}</span>
            </div>
            <div class="flex justify-between text-sm"><span class="text-gray-600">เก็บแล้ว</span> <span class="font-semibold text-${colorClass}-600">฿${g.current.toLocaleString()}</span>
            </div>
            <div class="flex justify-between text-sm"><span class="text-gray-600">เหลืออีก</span> <span class="font-semibold text-orange-600">฿${remaining.toLocaleString()}</span>
            </div>
           </div>
            <div class="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                <div class="text-xs text-gray-500"><span>กำหนดเวลา: ${new Date(g.deadline).toLocaleDateString('th-TH')}</span></div>
                <button onclick="showGoalAnalysis(${g.id})" class="text-indigo-600 hover:text-indigo-800 text-sm font-semibold flex items-center">
                    <i class="fas fa-chart-line mr-1"></i> วิเคราะห์
                </button>
            </div>
        </div>
        `;
    }).join('');
}

// ===== FINANCIAL ANALYSIS =====

function calculateMonthlyStats() {
    if (!transactions.length) return { avgIncome: 0, avgExpense: 0, avgSavings: 0, volatility: 0 };

    // Group by month YYYY-MM
    const monthlyData = {};

    transactions.forEach(t => {
        const date = new Date(t.date);
        const key = `${date.getFullYear()}-${date.getMonth()}`;

        if (!monthlyData[key]) monthlyData[key] = { income: 0, expense: 0 };

        if (t.type === 'income') monthlyData[key].income += t.amount;
        if (t.type === 'expense') monthlyData[key].expense += t.amount;
    });

    const months = Object.values(monthlyData);
    if (!months.length) return { avgIncome: 0, avgExpense: 0, avgSavings: 0, volatility: 0 };

    const totalIncome = months.reduce((sum, m) => sum + m.income, 0);
    const totalExpense = months.reduce((sum, m) => sum + m.expense, 0);
    const avgIncome = totalIncome / months.length;
    const avgExpense = totalExpense / months.length;
    const avgSavings = avgIncome - avgExpense;

    // Calculate Volatility (Standard Deviation of Savings)
    const variance = months.reduce((sum, m) => {
        const savings = m.income - m.expense;
        return sum + Math.pow(savings - avgSavings, 2);
    }, 0) / months.length;

    const volatility = Math.sqrt(variance);

    return { avgIncome, avgExpense, avgSavings, volatility };
}

function calculateGoalFeasibility(goalId) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return null;

    const stats = calculateMonthlyStats();

    // Time remaining (months)
    const today = new Date();
    const deadline = new Date(goal.deadline);
    const monthsRemaining = (deadline.getFullYear() - today.getFullYear()) * 12 + (deadline.getMonth() - today.getMonth());

    if (monthsRemaining <= 0) return { success: false, probability: 0, message: "เลยกำหนดเวลาแล้ว" };

    // Inflation adjustment
    const annualInflation = cachedInflationRate || 2.5; // percent
    const monthlyInflation = annualInflation / 12 / 100;

    // Future Value of the Target (Cost increases over time)
    // FV = PV * (1 + r)^n
    const inflationAdjustedTarget = goal.target * Math.pow(1 + monthlyInflation, monthsRemaining);

    // Required Monthly Savings
    const amountNeeded = inflationAdjustedTarget - goal.current;
    if (amountNeeded <= 0) return { success: true, probability: 100, adjustedTarget: goal.target, avgSavings: stats.avgSavings, message: "บรรลุเป้าหมายแล้ว" };

    const requiredMonthlySavings = amountNeeded / monthsRemaining;

    // Probability Calculation (Z-Score)
    // Z = (AvgSavings - Required) / Volatility
    // Using a simplified probability model
    let probability;
    if (stats.volatility === 0) {
        probability = stats.avgSavings >= requiredMonthlySavings ? 100 : 0;
    } else {
        // Simple approximation for demonstration: 
        // If Avg > Required, prob > 50%. If Avg < Required, prob < 50%.
        // We use a sigmoid-like mapping or just simple Z-score logic if available.
        // Let's use a simple ratio for better UX understanding:
        const ratio = stats.avgSavings / requiredMonthlySavings;
        if (ratio >= 1.5) probability = 95; // Very safe
        else if (ratio >= 1.2) probability = 90;
        else if (ratio >= 1.0) probability = 80;
        else if (ratio >= 0.8) probability = 60; // Risky
        else if (ratio >= 0.5) probability = 40;
        else probability = 20; // Very unlikely

        // Adjust for volatility (higher volatility reduces confidence)
        if (stats.volatility > stats.avgSavings * 0.5) probability -= 10;
        if (probability < 0) probability = 0;
        if (probability > 100) probability = 100;
    }

    return {
        probability,
        inflationAdjustedTarget,
        requiredMonthlySavings,
        avgSavings: stats.avgSavings,
        monthsRemaining,
        annualInflation,
        suggestions: generateSuggestions(probability, requiredMonthlySavings, stats)
    };
}

function generateSuggestions(probability, required, stats) {
    const suggestions = [];

    if (probability < 60) {
        suggestions.push(`โอกาสสำเร็จต่ำ (${probability}%) ควรปรับแผนการเงินด่วน`);

        const deficit = required - stats.avgSavings;
        if (deficit > 0) {
            suggestions.push(`คุณต้องออมเพิ่มอีกประมาณ ฿${deficit.toFixed(0)} ต่อเดือน`);
            suggestions.push(`ลองหารายได้เสริมหรือลดรายจ่ายที่ไม่จำเป็น`);
        }

        // Expense reduction suggestion
        const reducePercent = 10;
        const potentialSave = stats.avgExpense * (reducePercent / 100);
        suggestions.push(`ถ้าลดรายจ่ายลง ${reducePercent}% จะมีเงินเหลือเก็บเพิ่ม ฿${potentialSave.toFixed(0)}`);

        suggestions.push(`พิจารณาขยายเวลาเป้าหมายออกไปอีกสักหน่อย`);
    } else if (probability < 80) {
        suggestions.push(`มีความเสี่ยงเล็กน้อย พยายามรักษาวินัยการออม`);
        suggestions.push(`ลดการทานอาหารนอกบ้านหรือช้อปปิ้งเพื่อความมั่นใจ`);
    } else {
        suggestions.push(`แผนการเงินยอดเยี่ยม! รักษามาตรฐานนี้ไว้`);
        suggestions.push(`พิจารณานำเงินส่วนเกินไปลงทุนเพิ่มผลตอบแทน`);
    }

    return suggestions;
}

function showGoalAnalysis(goalId) {
    // Ensure ID is comparable (parse if needed, though usually numbers)
    const goal = goals.find(g => g.id == goalId);
    if (!goal) {
        console.error("Goal not found:", goalId);
        return;
    }

    const result = calculateGoalFeasibility(goal.id);
    if (!result) return;

    // Update UI
    document.getElementById('analysis-title').textContent = `วิเคราะห์: ${goal.title}`;

    // Animate Circle
    const circle = document.getElementById('probability-circle');
    const radius = 56;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (result.probability / 100) * circumference;

    circle.style.strokeDashoffset = circumference; // Reset
    setTimeout(() => {
        circle.style.strokeDashoffset = offset;
    }, 100);

    // Color coding
    let color = 'text-red-500';
    let strokeColor = '#ef4444';
    if (result.probability >= 80) { color = 'text-green-500'; strokeColor = '#10b981'; }
    else if (result.probability >= 60) { color = 'text-yellow-500'; strokeColor = '#eab308'; }

    circle.style.color = strokeColor;

    const percentEl = document.getElementById('analysis-percent');
    percentEl.textContent = `${result.probability.toFixed(0)}%`;
    percentEl.className = `text-3xl font-bold ${color}`;

    const statusEl = document.getElementById('analysis-status');
    statusEl.textContent = result.probability >= 60 ? "เป็นไปได้สูง" : "ควรปรับปรุงแผน";
    statusEl.className = `text-sm font-medium mt-2 ${color}`;

    // Stats
    document.getElementById('analysis-inflation-rate').textContent = `${result.annualInflation}%`;
    document.getElementById('analysis-real-target').textContent = `฿${result.inflationAdjustedTarget.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`;
    document.getElementById('analysis-avg-savings').textContent = `฿${result.avgSavings.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`;

    // Suggestions
    const suggestionsList = document.getElementById('suggestion-list');
    const suggestionsContainer = document.getElementById('analysis-suggestions');

    if (result.probability < 100) {
        suggestionsList.innerHTML = result.suggestions.map(s => `<li>${s}</li>`).join('');
        suggestionsContainer.classList.remove('hidden');
    } else {
        suggestionsContainer.classList.add('hidden');
    }

    // Show Modal
    const modal = document.getElementById('analysis-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

// ===== DEMO MODE =====
let demoInterval;
let demoActive = false;

function startDemoMode() {
    if (currentUser || demoActive) return;

    demoActive = true;
    console.log("Starting Live Demo Mode...");
    showToast("เริ่มโหมดตัวอย่าง: จำลองข้อมูลเรียลไทม์...");

    // Visual indicator for Demo Mode
    const demoBadge = document.createElement('div');
    demoBadge.id = 'demo-badge';
    demoBadge.className = 'fixed top-24 right-4 bg-teal-600 text-white px-4 py-2 rounded-full shadow-lg z-40 animate-pulse flex items-center';
    demoBadge.innerHTML = '<span class="w-3 h-3 bg-red-400 rounded-full mr-2"></span> Mode: Live Simulation';
    document.body.appendChild(demoBadge);

    // Initial dummy data filling to make it look active immediately
    if (transactions.length < 5) {
        // ... (Optional: add some base data if empty)
    }

    demoInterval = setInterval(() => {
        if (!demoActive) {
            clearInterval(demoInterval);
            return;
        }

        // Simulate random transaction
        generateRandomTransaction();

    }, 2000); // New transaction every 2 seconds

    // Stop demo on user interaction logic (Optional: maybe keep it running until login? User said "when open web... show change")
    // If it's a simulation, maybe we DON'T stop on scroll? 
    // "Stop on interaction" was for the TOUR. 
    // For "Live Simulation", it's better to keep running until they try to Login or Register.
    // However, if they try to Add Transaction manually, it might conflict. 
    // Let's stop if they click "Login" or "Add Transaction".

    document.addEventListener('click', (e) => {
        // Stop if user tries to interact with forms or auth
        if (e.target.closest('#auth-buttons') || e.target.closest('.btn-primary')) {
            // stopDemoMode(); // Optional: decide if we want to stop
        }
    });
}

function stopDemoMode() {
    if (!demoActive) return;
    demoActive = false;
    clearInterval(demoInterval);
    const badge = document.getElementById('demo-badge');
    if (badge) badge.remove();
    console.log("Demo Mode Stopped");
}

function generateRandomTransaction() {
    const types = ['expense', 'expense', 'expense', 'income']; // More expenses than income
    const type = types[Math.floor(Math.random() * types.length)];

    let category, amount, note, icon;


    if (type === 'expense') {
        // Safety Check: Don't allow negative balance
        // Calculate current balance first
        const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const currentBalance = totalIncome - totalExpense;

        // If balance is already very low, force income to keep demo running smoothly
        if (currentBalance < 1500) {
            type = 'income';
        } else {
            const expenses = [
                { c: 'food', a: [100, 300, 500, 1000], n: ['กินข้าว', 'กาแฟ', 'บุฟเฟต์', 'ซื้อของสด'], i: '🍜' },
                { c: 'transport', a: [50, 100, 500, 1200], n: ['วินมอไซค์', 'BTS', 'เติมน้ำมัน', 'Grab'], i: '🚗' },
                { c: 'shopping', a: [200, 1000, 3000], n: ['ซื้อเสื้อผ้า', 'ของใช้ในบ้าน', 'Gadget'], i: '🛍️' },
                { c: 'bills', a: [500, 2000], n: ['ค่าน้ำ', 'ค่าไฟ'], i: '📄' }
            ];
            const item = expenses[Math.floor(Math.random() * expenses.length)];
            category = item.c;

            // Try to pick an amount
            let possibleAmount = item.a[Math.floor(Math.random() * item.a.length)];

            // If random amount exceeds balance, try to scale it down or just switch to income if too small
            if (possibleAmount > currentBalance) {
                if (currentBalance > 100) {
                    possibleAmount = Math.floor(currentBalance * 0.8); // 80% of remaining balance
                } else {
                    type = 'income';
                }
            }

            if (type === 'expense') {
                amount = possibleAmount;
                note = item.n[Math.floor(Math.random() * item.n.length)] + ' (Demo)';
            }
        }
    }

    // Double check if type changed above
    if (type === 'income') {
        category = 'business';
        amount = Math.floor(Math.random() * 5000) + 1000;
        note = 'รายได้เสริม (Demo)';
    }

    const daysBack = Math.floor(Math.random() * 60); // Random date within last 60 days
    const date = new Date();
    date.setDate(date.getDate() - daysBack);

    const transaction = {
        id: Date.now(),
        type,
        category,
        amount,
        date: date.toISOString().split('T')[0],
        note
    };

    // Add to top
    transactions.unshift(transaction);
    // Keep list manageable
    if (transactions.length > 20) transactions.pop();

    // Render & Update
    renderTransactions(); // This will show the new row
    updateDashboard(); // Updates graph and totals

    // Toast for the new item
    showMiniToast(`${type === 'income' ? '+' : '-'}฿${amount.toLocaleString()} ${note}`);
}

function showMiniToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-24 right-8 bg-white/90 text-gray-800 px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in text-sm border border-gray-100 flex items-center';
    toast.innerHTML = `<span class="w-2 h-2 bg-teal-500 rounded-full mr-2"></span> ${msg}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

const expensePieChartConfig = {
    labels: ['อาหาร', 'เดินทาง', 'ค่าบิล', 'ช้อปปิ้ง', 'อื่นๆ'],
    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899']
};

function toggleFormula() {
    const info = document.getElementById('formula-info');
    if (info) info.classList.toggle('hidden');
}

function updatePieChart() {
    if (!expensePieChart) return;

    const categories = {
        'food': 0, 'transport': 0, 'bills': 0, 'shopping': 0, 'other': 0
    };

    transactions.filter(t => t.type === 'expense').forEach(t => {
        if (categories[t.category] !== undefined) {
            categories[t.category] += t.amount;
        } else {
            categories['other'] += t.amount;
        }
    });

    expensePieChart.data.datasets[0].data = [
        categories['food'], categories['transport'], categories['bills'], categories['shopping'], categories['other']
    ];
    expensePieChart.update();
}

function updateDashboard() {
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;

    // Update Dashboard Cards
    // Note: The user template has specific structure for these cards.
    // I need to target them by content or structure if they don't have IDs.
    // Looking at the template:
    // Card 1: Income (Green icon)
    // Card 2: Expense (Red icon)
    // Card 3: Balance (Blue icon)

    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length >= 3) {
        // Income
        statCards[0].querySelector('.text-3xl').textContent = `฿${totalIncome.toLocaleString()}`;

        // Expense
        statCards[1].querySelector('.text-3xl').textContent = `฿${totalExpense.toLocaleString()}`;

        // Balance
        statCards[2].querySelector('.text-3xl').textContent = `฿${balance.toLocaleString()}`;
    }

    // Update Chart if it exists
    if (typeof updateChart === 'function') {
        updateChart(currentChartPeriod);
    }

    // Update Pie Chart
    if (typeof updatePieChart === 'function') {
        updatePieChart();
    }

    // Sync Goals with Balance (User Request: update collected amount according to remaining balance)
    // We assume 'Balance' represents the total available savings for these goals.
    let goalsUpdated = false;
    goals.forEach(g => {
        if (g.current !== balance) {
            g.current = balance;
            goalsUpdated = true;
        }
    });

    if (goalsUpdated) {
        renderGoals();
        saveData(); // Persist the updated values
    }
}

// ===== INTEREST RATES FEATURE =====
const interestRatesData = [
    { bank: 'KBANK', name: 'ธนาคารกสิกรไทย', color: '#138f2d', saving: 0.25, fixed3m: 0.95, fixed12m: 1.35, icon: 'K', logo: 'KBANK.jpg' },
    { bank: 'SCB', name: 'ไทยพาณิชย์', color: '#4e2583', saving: 0.25, fixed3m: 0.90, fixed12m: 1.40, icon: 'S', logo: 'SCB.png' },
    { bank: 'BBL', name: 'กรุงเทพ', color: '#1e4598', saving: 0.25, fixed3m: 0.95, fixed12m: 1.35, icon: 'B', logo: 'BBL.webp' },
    { bank: 'KTB', name: 'กรุงไทย', color: '#1ba5e1', saving: 0.25, fixed3m: 0.92, fixed12m: 1.30, icon: 'K', logo: 'KTB.webp' },
    { bank: 'TTB', name: 'ทหารไทยธนชาต', color: '#002d63', saving: 0.25, fixed3m: 1.00, fixed12m: 1.45, icon: 'T', logo: 'TTB.webp' },
    { bank: 'GSB', name: 'ออมสิน', color: '#eb198d', saving: 0.30, fixed3m: 1.05, fixed12m: 1.50, icon: 'G', logo: 'GSB.webp' }
];

function renderInterestRates() {
    const container = document.getElementById('interest-rates-grid');
    if (!container) return;

    // Get current total balance for calculation preview
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const currentBalance = Math.max(0, totalIncome - totalExpense);

    container.innerHTML = interestRatesData.map(bank => `
        <div class="bg-white rounded-2xl p-6 shadow-soft hover:shadow-lg transition-all border-t-4 group relative" style="border-color: ${bank.color}">
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center space-x-3">
                    <div class="w-12 h-12 rounded-full flex items-center justify-center bg-white shadow-sm border overflow-hidden">
                        <img src="${bank.logo}" alt="${bank.bank}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
                        <div class="w-full h-full items-center justify-center text-white font-bold hidden" style="background-color: ${bank.color}">${bank.icon}</div>
                    </div>
                    <div>
                        <h4 class="font-bold text-gray-800">${bank.bank}</h4>
                        <p class="text-xs text-gray-500">${bank.name}</p>
                    </div>
                </div>
                <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">ต่อปี</span>
            </div>
            <div class="space-y-3 mb-4">
                <div class="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span class="text-sm text-gray-600">ออมทรัพย์</span>
                    <span class="font-bold text-teal-600">${bank.saving.toFixed(2)}%</span>
                </div>
                <div class="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span class="text-sm text-gray-600">ฝากประจำ 3 ด.</span>
                    <span class="font-bold text-blue-600">${bank.fixed3m.toFixed(2)}%</span>
                </div>
                <div class="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span class="text-sm text-gray-600">ฝากประจำ 12 ด.</span>
                    <span class="font-bold text-purple-600">${bank.fixed12m.toFixed(2)}%</span>
                </div>
            </div>
            <button onclick="calculateBankInterest('${bank.bank}', ${bank.fixed12m}, ${currentBalance})" class="w-full py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition font-medium text-sm flex items-center justify-center">
                <i class="fas fa-calculator mr-2"></i> คำนวณดอกเบี้ย (12 ด.)
            </button>
        </div>
    `).join('');
}

function calculateBankInterest(bankName, rate, balance) {
    if (balance <= 0) {
        showToast('ยอดเงินคงเหลือของคุณเป็น 0 ไม่สามารถคำนวณได้');
        return;
    }

    // Simple Interest Formula: Interest = P * r * t (t=1 year)
    const interest = balance * (rate / 100);
    const total = balance + interest;

    // Create a custom modal or just use alert for simplicity, or reusing the Analysis Modal structure?
    // Let's use a nice Alert/Toast combo or manipulate the DOM.
    // Since we don't have a generic modal ready, let's inject a temporary one.

    const modalHtml = `
    <div id="interest-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] px-4 animate-fade-in">
        <div class="bg-white rounded-3xl max-w-sm w-full p-6 relative shadow-2xl">
            <button onclick="document.getElementById('interest-modal').remove()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><i class="fas fa-times"></i></button>
            <div class="text-center mb-6">
                <div class="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                    <i class="fas fa-coins"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-800">ผลตอบแทน ${bankName}</h3>
                <p class="text-gray-500 text-sm">คํานวณจากยอดคงเหลือ ฿${balance.toLocaleString()}</p>
            </div>
            <div class="space-y-4 bg-gray-50 p-4 rounded-xl">
                 <div class="flex justify-between">
                    <span class="text-gray-600">อัตราดอกเบี้ย</span>
                    <span class="font-bold text-gray-800">${rate}%</span>
                 </div>
                 <div class="flex justify-between">
                    <span class="text-gray-600">ดอกเบี้ยที่ได้รับ</span>
                    <span class="font-bold text-green-600">+฿${interest.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                 </div>
                 <div class="pt-3 border-t border-gray-200 flex justify-between items-center">
                    <span class="font-bold text-gray-800">ยอดรวมสุทธิ</span>
                    <span class="font-bold text-indigo-600 text-lg">฿${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                 </div>
            </div>
             <button onclick="document.getElementById('interest-modal').remove()" class="w-full mt-6 btn-primary py-3 rounded-xl">ตกลง</button>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// ===== CHART.JS DASHBOARD =====
let expenseChart = null;
let expensePieChart = null; // New Pie Chart
let currentChartPeriod = 'weekly'; // 'weekly' or 'monthly'

function initChart() {
    const ctx = document.getElementById('expenseChart');
    if (!ctx) return;

    // Destroy existing chart if any
    if (expenseChart) {
        expenseChart.destroy();
    }

    expenseChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'รายรับ',
                    data: [],
                    backgroundColor: '#10b981',
                    borderRadius: 4,
                },
                {
                    label: 'รายจ่าย',
                    data: [],
                    backgroundColor: '#f87171',
                    borderRadius: 4,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += '฿' + context.parsed.y.toLocaleString();
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#f3f4f6'
                    },
                    ticks: {
                        callback: function (value) {
                            return '฿' + value.toLocaleString(); // Compact display could use 'k' suffix
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });

    initPieChart();
    updateChart(currentChartPeriod);
}

function initPieChart() {
    const ctx = document.getElementById('expensePieChart');
    if (!ctx) return;

    expensePieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['อาหาร', 'เดินทาง', 'ค่าบิล', 'ช้อปปิ้ง', 'อื่นๆ'],
            datasets: [{
                data: [0, 0, 0, 0, 0],
                backgroundColor: [
                    '#10b981', // green - food
                    '#3b82f6', // blue - transport
                    '#f59e0b', // yellow - bills
                    '#8b5cf6', // purple - shopping
                    '#ec4899', // pink - other
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: { family: "'Prompt', sans-serif" }
                    }
                }
            },
            cutout: '70%'
        }
    });
}

function updateChart(period) {
    currentChartPeriod = period;

    // Update active button state
    // Update active button state
    const btnWeekly = document.getElementById('btn-weekly');
    const btnMonthly = document.getElementById('btn-monthly');

    if (btnWeekly) btnWeekly.className = period === 'weekly' ? 'px-3 py-1 text-xs rounded-md font-medium transition-all bg-white shadow-sm text-teal-700' : 'px-3 py-1 text-xs rounded-md font-medium transition-all text-gray-500 hover:text-gray-700';
    if (btnMonthly) btnMonthly.className = period === 'monthly' ? 'px-3 py-1 text-xs rounded-md font-medium transition-all bg-white shadow-sm text-teal-700' : 'px-3 py-1 text-xs rounded-md font-medium transition-all text-gray-500 hover:text-gray-700';

    if (!expenseChart) return;

    // Process Data
    const data = processChartData(period);

    expenseChart.data.labels = data.labels;
    expenseChart.data.datasets[0].data = data.income;
    expenseChart.data.datasets[1].data = data.expense;

    expenseChart.update();
}

function processChartData(period) {
    const labels = [];
    const incomeData = [];
    const expenseData = [];
    const today = new Date(); // Use today as reference

    if (period === 'daily') {
        // Last 7 days
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayName = d.toLocaleDateString('th-TH', { weekday: 'short' });

            labels.push(dayName);

            const income = transactions.filter(t => t.date === dateStr && t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const expense = transactions.filter(t => t.date === dateStr && t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

            incomeData.push(income);
            expenseData.push(expense);
        }
    } else if (period === 'weekly') {
        // Last 4 weeks
        for (let i = 3; i >= 0; i--) {
            const end = new Date(today);
            end.setDate(today.getDate() - (i * 7)); // End of this week chunk

            const start = new Date(end);
            start.setDate(end.getDate() - 6); // Start of this week chunk (7 days ago)

            // Normalize dates to start of day for comparison
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);

            labels.push(`สัปดาห์ที่ ${4 - i}`); // Simplified label

            let incomeSum = 0;
            let expenseSum = 0;

            transactions.forEach(t => {
                const tDate = new Date(t.date);
                // Compare logic (inclusive)
                if (tDate >= start && tDate <= end) {
                    if (t.type === 'income') incomeSum += t.amount;
                    if (t.type === 'expense') expenseSum += t.amount;
                }
            });

            incomeData.push(incomeSum);
            expenseData.push(expenseSum);
        }
    } else if (period === 'monthly') {
        const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        // Last 6 Months
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today);
            d.setMonth(today.getMonth() - i);
            d.setDate(1);

            const monthIndex = d.getMonth();
            const year = d.getFullYear();

            labels.push(`${months[monthIndex]} ${year + 543}`); // Thai Short Month + Year

            const income = transactions.filter(t => {
                const tDate = new Date(t.date);
                return tDate.getMonth() === monthIndex && tDate.getFullYear() === year && t.type === 'income';
            }).reduce((sum, t) => sum + t.amount, 0);

            const expense = transactions.filter(t => {
                const tDate = new Date(t.date);
                return tDate.getMonth() === monthIndex && tDate.getFullYear() === year && t.type === 'expense';
            }).reduce((sum, t) => sum + t.amount, 0);

            incomeData.push(income);
            expenseData.push(expense);
        }
    }

    return { labels, income: incomeData, expense: expenseData };
}

// Initial update for Interest Rates on load (in case loadFinancialData isn't called immediately for some reason)
document.addEventListener('DOMContentLoaded', () => {
    // ... existing listeners ...
    // Add specific listener for refresh
    setTimeout(renderInterestRates, 100);
});


// Inflation Calculator
function calculateInflation(e) {
    e.preventDefault();

    const currentAmount = parseFloat(document.getElementById('current-amount').value);
    const inflationRate = parseFloat(document.getElementById('inflation-rate').value) / 100;
    const years = parseInt(document.getElementById('years').value);

    // Formula: Future Value = Current Value / (1 + inflation rate) ^ years
    const futureValue = currentAmount / Math.pow(1 + inflationRate, years);
    const decreaseAmount = currentAmount - futureValue;
    const decreasePercent = ((decreaseAmount / currentAmount) * 100).toFixed(2);

    // Display result
    document.getElementById('future-value').textContent = '฿' + futureValue.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('decrease-amount').textContent = '฿' + decreaseAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('decrease-percent').textContent = decreasePercent + '%';

    const adviceText = `เงิน ${currentAmount.toLocaleString('th-TH')} บาท ในวันนี้ จะมีมูลค่าเทียบเท่า ${futureValue.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท ใน ${years} ปีข้างหน้า คุณควรลงทุนให้ได้ผลตอบแทนมากกว่า ${(inflationRate * 100).toFixed(2)}% ต่อปี เพื่อรักษามูลค่าเงิน`;
    document.getElementById('advice-text').textContent = adviceText;

    document.getElementById('inflation-result').classList.remove('hidden');

    // Scroll to result
    document.getElementById('inflation-result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    renderNews();
    fetchInflationRate();
    checkSession(); // Check if user is already logged in

    // Start Demo Mode if not logged in (after a delay)
    if (!currentUser) {
        setTimeout(startDemoMode, 5000);
    }

    loadFinancialData(); // Load persistent data

    // Update news time every minute
    setInterval(updateNewsTime, 60000);

    // Update inflation rate every 1 hour
    setInterval(fetchInflationRate, 3600000);

    // Set today's date as default for date inputs
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('trans-date');
    if (dateInput) {
        dateInput.value = today;
    }

    // Inflation Calculator Event Listener
    const inflationForm = document.getElementById('inflation-form');
    if (inflationForm) {
        inflationForm.addEventListener('submit', calculateInflation);
    }
});