// app.js - 핵심 비즈니스 로직 및 뷰 컨트롤러 (v1.2)

document.addEventListener('DOMContentLoaded', () => {

    // --- 이모지 스마트 매핑 사전 ---
    const ITEM_EMOJI_MAP = {
        '삼겹살': '🥩', '고기': '🥩', '소고기': '🥩', '한우': '🥩', '돼지': '🥩', '닭': '🍗', '치킨': '🍗',
        '우유': '🥛', '두유': '🥛',
        '계란': '🥚', '달걀': '🥚',
        '사과': '🍎', '바나나': '🍌', '포도': '🍇', '과일': '🍉',
        '오이': '🥒', '가시오이': '🥒', '양파': '🧅', '마늘': '🧄', '당근': '🥕', '고추': '🌶️', '채소': '🥬', '야채': '🥬',
        '김치': '🌶️',
        '만두': '🥟', '피자': '🍕',
        '라면': '🍜', '신라면': '🍜', '짜파게티': '🍜',
        '햇반': '🍚', '쌀': '🍚',
        '초코': '🍫', '과자': '🍪', '아이스크림': '🍦',
        '콜라': '🥤', '사이다': '🥤', '제로': '🥤', '음료': '🥤',
        '생수': '💧', '물': '💧', '삼다수': '💧',
        '커피': '☕',
        '빵': '🍞',
        '화장지': '🧻', '휴지': '🧻',
        '물티슈': '🧻',
        '샴푸': '🧴', '로션': '🧴', '바디워시': '🧼', '비누': '🧼', '세제': '🧼',
        '치약': '🪥', '칫솔': '🪥',
        '영양제': '💊', '비타민': '💊', '루테인': '💊', '유산균': '💊',
        '건전지': '🔋',
        '마스크': '😷'
    };

    function getEmojiForName(name) {
        for (const [key, emoji] of Object.entries(ITEM_EMOJI_MAP)) {
            if (name.includes(key)) return emoji;
        }
        return null;
    }

    // --- 1. 전역 변수 및 Firebase 설정 ---
    let FAMILY_CODE = localStorage.getItem('familyCode') || "jangbogi77";

    const firebaseConfig = {
        databaseURL: "https://myhomeshopping-a9724-default-rtdb.firebaseio.com/"
    };
    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();

    let keywords = [];
    let shoppingList = [];
    let inventory = [];

    // [중요] Firebase 실시간 리스너
    db.ref(`families/${FAMILY_CODE}/keywords`).on('value', (snapshot) => {
        const data = snapshot.val();
        keywords = data ? (Array.isArray(data) ? data : Object.values(data)) : [];
        renderKeywords();
        if (typeof fetchAndRenderDeals === 'function') fetchAndRenderDeals();
    });

    db.ref(`families/${FAMILY_CODE}/shoppingList`).on('value', (snapshot) => {
        const data = snapshot.val();
        shoppingList = data ? Object.values(data) : [];
        renderShopping();
    });

    db.ref(`families/${FAMILY_CODE}/inventory`).on('value', (snapshot) => {
        const data = snapshot.val();
        inventory = data || [
            { id: "milk", name: "서울우유 1L", status: "enough" },
            { id: "water", name: "삼다수 2L", status: "low" },
            { id: "ramen", name: "신라면", status: "enough" }
        ];
        renderInventory();
    });

    function syncDB(type) {
        if (type === 'keywords') db.ref(`families/${FAMILY_CODE}/keywords`).set(keywords);
        if (type === 'shoppingList') db.ref(`families/${FAMILY_CODE}/shoppingList`).set(shoppingList);
        if (type === 'inventory') db.ref(`families/${FAMILY_CODE}/inventory`).set(inventory);
    }

    // --- 2. 하단 네비게이션 및 스와이프 로직 ---
    const VIEW_ORDER = ['view-home', 'view-inventory', 'view-shopping', 'view-keywords'];

    function switchTab(targetId) {
        const navButtons = document.querySelectorAll('.nav-item');
        const viewSections = document.querySelectorAll('.view-section');

        viewSections.forEach(sec => sec.classList.remove('active'));
        navButtons.forEach(b => b.classList.remove('active'));

        const targetView = document.getElementById(targetId);
        if (targetView) targetView.classList.add('active');

        const activeNav = document.querySelector(`[data-target="${targetId}"]`);
        if (activeNav) activeNav.classList.add('active');

        window.scrollTo(0, 0);
    }

    function setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.onclick = function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('data-target');
                if (targetId) switchTab(targetId);
            };
        });
    }

    function setupSwipe() {
        let touchStartX = 0;
        let touchStartY = 0;

        document.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].clientX;
            touchStartY = e.changedTouches[0].clientY;
        }, { passive: true });

        document.addEventListener('touchend', e => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;

            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 80) {
                const modal = document.getElementById('settings-modal');
                if (modal && modal.style.display === 'flex') return;

                const currentActiveView = document.querySelector('.view-section.active');
                if (!currentActiveView) return;

                const currentIndex = VIEW_ORDER.indexOf(currentActiveView.id);
                let nextIndex = currentIndex;

                if (dx < 0) nextIndex = Math.min(currentIndex + 1, VIEW_ORDER.length - 1);
                else nextIndex = Math.max(currentIndex - 1, 0);

                if (nextIndex !== currentIndex) {
                    switchTab(VIEW_ORDER[nextIndex]);
                    showToast(`${dx < 0 ? '👉' : '👈'} 화면 이동`);
                }
            }
        }, { passive: true });
    }

    // --- 3. 데이터 렌더링 및 비즈니스 로직 ---
    let allDealsData = [];

    async function fetchAndRenderDeals() {
        const feedContainer = document.querySelector('.feed-container');
        try {
            const response = await fetch("https://myhomeshopping-a9724-default-rtdb.firebaseio.com/deals.json");
            if (!response.ok) throw new Error("서버 데이터 로드 실패");

            let deals = await response.json();
            if (!deals) {
                feedContainer.innerHTML = `<div class="empty-state">아직 수집된 핫딜이 없습니다.</div>`;
                return;
            }

            deals.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
            allDealsData = deals;

            if (deals.length > 0 && deals[0].timestamp) {
                document.getElementById('last-update-time').innerText = new Date(deals[0].timestamp).toLocaleString('ko-KR');
            }
            renderFilteredDeals();
        } catch (error) {
            feedContainer.innerHTML = `<div class="empty-state">데이터를 불러오지 못했습니다.</div>`;
        }
    }

    function renderFilteredDeals() {
        const feedContainer = document.querySelector('.feed-container');
        feedContainer.innerHTML = '';
        const activeCatBtn = document.querySelector('.cat-btn.active');
        const currentCat = activeCatBtn ? activeCatBtn.getAttribute('data-cat') : '전체';

        let targetDeals = (currentCat === '전체') ? allDealsData : allDealsData.filter(d => (d.category || '기타') === currentCat);

        targetDeals.sort((a, b) => {
            const aMatched = keywords.some(kw => a.title.includes(kw)) ? 1 : 0;
            const bMatched = keywords.some(kw => b.title.includes(kw)) ? 1 : 0;
            return bMatched - aMatched;
        });

        if (targetDeals.length === 0) {
            feedContainer.innerHTML = `<div class="empty-state">해당 카테고리의 핫딜이 없습니다.</div>`;
            return;
        }

        targetDeals.forEach(deal => {
            const isMatched = keywords.some(kw => deal.title.includes(kw));
            const matchedHtml = isMatched ? `<span style="color:var(--accent-red);">🔥 키워드</span>` : '';

            let timeString = '방금 전';
            if (deal.timestamp) {
                const diffMs = new Date() - new Date(deal.timestamp);
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMins / 60);
                const diffDays = Math.floor(diffHours / 24);
                if (diffDays > 0) timeString = `${diffDays}일 전`;
                else if (diffHours > 0) timeString = `${diffHours}시간 전`;
                else if (diffMins > 0) timeString = `${diffMins}분 전`;
            }

            const card = `
                <a href="${deal.link}" target="_blank" class="deal-card">
                    <img src="${deal.img}" class="deal-img" onerror="this.src='https://via.placeholder.com/96x96/eee/999?text=No+Image'">
                    <div class="deal-info">
                        <div class="deal-meta">
                            <div><span class="deal-source">${deal.source}</span> <span class="deal-cat">${deal.category || '기트'}</span></div>
                            ${matchedHtml}
                        </div>
                        <h3 class="deal-title">${deal.title}</h3>
                        <div class="deal-bottom">
                            <div class="deal-price">${deal.price}</div>
                            <div class="deal-time"><i class="fa-regular fa-clock"></i> ${timeString}</div>
                        </div>
                    </div>
                </a>
            `;
            feedContainer.insertAdjacentHTML('beforeend', card);
        });
    }

    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderFilteredDeals();
        });
    });

    // --- 냉장고 관리 ---
    function renderInventory() {
        const listDiv = document.querySelector('.inventory-list');
        listDiv.innerHTML = '';
        inventory.forEach((item, index) => {
            const btnClass = item.status === 'enough' ? 'status-enough' : 'status-low';
            const btnText = item.status === 'enough' ? '여유' : '부족 !';
            const emoji = getEmojiForName(item.name) || '📦';

            const html = `
                <div class="list-item">
                    <div class="inventory-left">
                        <div class="emoji-icon">${emoji}</div>
                        <span class="item-name">${item.name}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <button class="status-toggle ${btnClass}" onclick="appToggleInventory(${index})">${btnText}</button>
                        <button onclick="appDeleteInventory(${index})" style="background:none; border:none; color:var(--text-sub);"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </div>
            `;
            listDiv.insertAdjacentHTML('beforeend', html);
        });
    }

    window.appToggleInventory = function (index) {
        const item = inventory[index];
        item.status = item.status === 'enough' ? 'low' : 'enough';
        if (item.status === 'low') {
            const exists = shoppingList.find(s => s.name.includes(item.name) && !s.purchased);
            if (!exists) {
                shoppingList.push({ id: Date.now(), name: item.name, source: "냉장고 부족", purchased: false });
                syncDB('shoppingList');
                showToast(`'${item.name}' 항목이 장보기 목록에 추가되었습니다.`);
            }
        }
        syncDB('inventory');
        renderInventory();
    };

    window.appDeleteInventory = function (index) {
        const name = inventory[index].name;
        inventory.splice(index, 1);
        syncDB('inventory');
        renderInventory();
        showToast(`'${name}' 삭제됨`);
    };

    document.getElementById('add-inventory-item-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('new-inventory-input');
        const name = input.value.trim();
        if (!name) return;
        inventory.push({ id: Date.now(), name: name, status: "enough" });
        syncDB('inventory');
        input.value = '';
        renderInventory();
        showToast(`'${name}' 냉장고 추가`);
    });

    // --- 장보기 관리 ---
    function renderShopping() {
        const ul = document.querySelector('.shopping-list');
        ul.innerHTML = '';
        shoppingList.forEach((item, index) => {
            const style = item.purchased ? "text-decoration: line-through; color: var(--text-sub);" : "";
            const icon = item.purchased ? "fa-solid fa-check-circle" : "fa-regular fa-circle";
            const html = `
                <li class="list-item" style="${style}">
                    <div style="display:flex; align-items:center; gap:10px;" onclick="appToggleShopping(${index})">
                        <i class="${icon}" style="color:${item.purchased ? 'var(--text-sub)' : 'var(--primary-color)'}; font-size:1.2rem;"></i>
                        <span class="item-name">${item.name} <small style="color:#aaa;">(${item.source})</small></span>
                    </div>
                    <button onclick="appDeleteShopping(${index})" style="background:none; border:none; color:var(--text-sub);"><i class="fa-solid fa-xmark"></i></button>
                </li>
            `;
            ul.insertAdjacentHTML('beforeend', html);
        });
    }

    window.appToggleShopping = function (index) {
        shoppingList[index].purchased = !shoppingList[index].purchased;
        syncDB('shoppingList');
        renderShopping();
    };

    window.appDeleteShopping = function (index) {
        shoppingList.splice(index, 1);
        syncDB('shoppingList');
        renderShopping();
    };

    document.getElementById('add-shopping-item-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('new-item-input');
        const name = input.value.trim();
        if (!name) return;
        shoppingList.push({ id: Date.now(), name: name, source: "직접 입력", purchased: false });
        syncDB('shoppingList');
        input.value = '';
        renderShopping();
    });

    document.querySelector('.btn-complete-mode').addEventListener('click', () => {
        const completed = shoppingList.filter(s => s.purchased);
        completed.forEach(buy => {
            // 부분 일치도 허용 (예: 장바구니 "우유" -> 냉장고 "서울우유 1L")
            const inv = inventory.find(i => i.name.includes(buy.name) || buy.name.includes(i.name));
            if (inv) inv.status = 'enough';
        });
        shoppingList = shoppingList.filter(s => !s.purchased);
        syncDB('inventory');
        syncDB('shoppingList');
        renderInventory();
        renderShopping();
        showToast(completed.length > 0 ? "장보기 완료! 냉장고 업데이트됨" : "체크된 항목이 없습니다.");
    });

    // --- 키워드 관리 ---
    function renderKeywords() {
        const container = document.querySelector('.keyword-chips-container');
        container.innerHTML = '';
        keywords.forEach((kw, index) => {
            container.insertAdjacentHTML('beforeend', `
                <div style="display:inline-flex; align-items:center; background:white; padding:8px 12px; border-radius:20px; border:1px solid var(--border-color); margin:5px;">
                    <span style="font-weight:700; color:var(--primary-color);">${kw}</span>
                    <i class="fa-solid fa-xmark" style="margin-left:8px; color:#ccc; cursor:pointer;" onclick="appDeleteKeyword(${index})"></i>
                </div>
            `);
        });
    }

    window.appDeleteKeyword = function (index) {
        const kw = keywords[index];
        keywords.splice(index, 1);
        syncDB('keywords');
        renderKeywords();
        fetchAndRenderDeals();
        showToast(`'${kw}' 키워드 삭제`);
    };

    document.getElementById('add-keyword-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('new-keyword-input');
        const name = input.value.trim();
        if (!name || keywords.includes(name)) return;
        keywords.push(name);
        syncDB('keywords');
        input.value = '';
        renderKeywords();
        fetchAndRenderDeals();
        showToast(`'${name}' 등록 완료`);
    });

    // --- 유틸리티 ---
    let toastTimeout;
    function showToast(msg) {
        const el = document.getElementById('toast-message');
        if (!el) return;
        el.textContent = msg;
        el.classList.remove('toast-hidden');
        el.classList.add('toast-show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            el.classList.remove('toast-show');
            el.classList.add('toast-hidden');
        }, 2000);
    }

    function setupSettingsModal() {
        const modal = document.getElementById('settings-modal');
        const codeInput = document.getElementById('family-code-input');

        document.getElementById('header-settings').onclick = () => {
            if (codeInput) codeInput.value = FAMILY_CODE;
            modal.style.display = 'flex';
        };
        document.querySelector('.btn-close-modal').onclick = () => modal.style.display = 'none';
        modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

        document.getElementById('btn-manual-sync').onclick = async function () {
            this.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 최신화...`;
            await fetchAndRenderDeals();
            showToast("최신 데이터 동기화 완료");
            this.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i> 수동으로 최신화 확인`;
        };

        document.getElementById('btn-save-code').onclick = () => {
            const newCode = codeInput ? codeInput.value.trim() : "";
            if (newCode && newCode !== FAMILY_CODE) {
                FAMILY_CODE = newCode;
                localStorage.setItem('familyCode', newCode);
                showToast("가족 코드 변경됨. 동기화를 위해 재시작합니다.");
                setTimeout(() => location.reload(), 1500);
            } else {
                showToast(newCode ? "가족 코드가 동일합니다." : "코드를 입력하세요.");
            }
        };
    }

    function init() {
        setupNavigation();
        setupSwipe();
        setupSettingsModal();
        fetchAndRenderDeals();
        renderInventory();
        renderShopping();
        renderKeywords();
        switchTab('view-home');
    }

    init();

});
