// app.js - 핵심 비즈니스 로직 및 뷰 컨트롤러 (v1.3)

document.addEventListener('DOMContentLoaded', () => {

    // --- 이모지 스마트 매핑 사전 (100종 이상으로 대폭 확장) ---
    const ITEM_EMOJI_MAP = {
        // [정육/수산]
        '삼겹살': '🥩', '고기': '🥩', '소고기': '🥩', '한우': '🥩', '돼지': '🥩', '닭': '🍗', '치킨': '🍗',
        '스테이크': '🥩', '갈비': '🍖', '베이컨': '🥓', '햄': '🍖', '소시지': '🌭', '오리': '🦆',
        '고등어': '🐟', '갈치': '🐟', '연어': '🍣', '참치': '🐟', '회': '🍣', '새우': '🦐', '게': '🦀', '오징어': '🦑', '어묵': '🍢',

        // [유제품/알류]
        '우유': '🥛', '두유': '🥛', '요거트': '🍦', '치즈': '🧀', '버터': '🧈',
        '계란': '🥚', '달걀': '🥚', '메추리알': '🥚',

        // [과일]
        '사과': '🍎', '바나나': '🍌', '포도': '🍇', '과일': '🍉', '수박': '🍉', '딸기': '🍓', '메론': '🍈',
        '참외': '🍈', '복숭아': '🍑', '망고': '🥭', '파인애플': '🍍', '토마토': '🍅', '귤': '🍊', '오렌지': '🍊',

        // [채소]
        '오이': '🥒', '가시오이': '🥒', '양파': '🧅', '마늘': '🧄', '당근': '🥕', '고추': '🌶️', '채소': '🥬', '야채': '🥬',
        '상추': '🥬', '깻잎': '🍃', '배추': '🥬', '무': '🥕', '브로콜리': '🥦', '감자': '🥔', '고구마': '🍠', '옥수수': '🌽',
        '버섯': '🍄', '시금치': '🥬', '콩나물': '🌱', '대파': '🌱', '쪽파': '🌱', '부추': '🌱',

        // [반찬/간편식]
        '김치': '🌶️', '깍두기': '🌶️', '두부': '⬜', '유부': '🍱', '만두': '🥟', '피자': '🍕',
        '라면': '🍜', '신라면': '🍜', '짜파게티': '🍜', '국수': '🍜', '파스타': '🍝', '스파게티': '🍝',
        '햇반': '🍚', '쌀': '🍚', '잡곡': '🌾', '김': '🍱', '미역': '🌿',

        // [간식/음료]
        '초코': '🍫', '과자': '🍪', '아이스크림': '🍦', '젤리': '🍮', '사탕': '🍭', '껌': '🍬',
        '콜라': '🥤', '사이다': '🥤', '제로': '🥤', '음료': '🥤', '탄산': '🥤',
        '생수': '💧', '물': '💧', '삼다수': '💧', '음료수': '🧃', '주스': '🧃',
        '커피': '☕', '캡슐': '☕', '차': '🍵', '녹차': '🍵', '홍차': '🍵',
        '빵': '🍞', '베이글': '🥯', '케이크': '🍰', '샌드위치': '🥪',

        // [생활용품]
        '화장지': '🧻', '휴지': '🧻', '물티슈': '🧻', '키친타월': '🧻',
        '샴푸': '🧴', '린스': '🧴', '로션': '🧴', '컨디셔너': '🧴', '바디워시': '🧼', '비누': '🧼',
        '세제': '🧼', '세탁세제': '🧺', '섬유유연제': '🌸', '주방세제': '🧽', '락스': '🧪',
        '치약': '🪥', '칫솔': '🪥', '가글': '🧪', '면도기': '🪒',
        '영양제': '💊', '비타민': '💊', '루테인': '💊', '유산균': '💊', '오메가3': '💊',
        '생리대': '🩸', '기저귀': '👶', '수건': '🧖‍♀️', '타월': '🧖‍♀️',
        '건전지': '🔋', '배터리': '🔋', '멀티탭': '🔌', '전구': '💡',

        // [가전/디지털]
        '가전': '📺', '노트북': '💻', '컴퓨터': '💻', '청소기': '🧹', '선풍기': '🌬️', '에어컨': '❄️', '냉장고': '🧊',
        '모니터': '🖥️', '마우스': '🖱️', '키보드': '⌨️', '아이폰': '📱', '갤럭시': '📱', '패드': '平板',

        // [의류/패션]
        '의류': '👕', '티셔츠': '👕', '바지': '👖', '슬랙스': '👖', '신발': '👟', '운동화': '👟', '양말': '🧦', '모자': '🧢',
        '속옷': '👙', '셔츠': '👔', '원피스': '👗', '자켓': '🧥', '코트': '🧥'
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

    // 편집 모드 상태
    let isInventoryEditMode = false;
    let isShoppingEditMode = false;

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
            // 카테고리 탭 영역에서 시작된 터치는 무시 (스와이프 뷰 전환 방지)
            if (e.target.closest('.category-tabs')) return;

            touchStartX = e.changedTouches[0].clientX;
            touchStartY = e.changedTouches[0].clientY;
        }, { passive: true });

        document.addEventListener('touchend', e => {
            // 카테고리 탭 영역에서 끝난 터치도 무시
            if (e.target.closest('.category-tabs')) return;

            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;

            // 횡방향 이동 거리가 종방향보다 크고 일정 임계값(80px) 이상일 때만 전환
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
            // 캐시 방지를 위해 타임스탬프 쿼리 추가
            const response = await fetch(`https://myhomeshopping-a9724-default-rtdb.firebaseio.com/deals.json?_t=${Date.now()}`);
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

            // 브랜드별 플레이스홀더 데이터 (v1.4)
            const brandConfig = {
                'Ppomppu': { bg: 'bg-ppomppu', emoji: '🛒' },
                'Clien': { bg: 'bg-clien', emoji: '💻' },
                'FM Korea': { bg: 'bg-fmkorea', emoji: '🔥' },
                'Eomisae': { bg: 'bg-eomisae', emoji: '🐦' }
            };
            const config = brandConfig[deal.source] || { bg: '', emoji: '📦' };

            // 클리앙이나 이미지가 없는 경우 처음부터 브랜드 박스 표시
            let imgHtml = '';
            if (deal.source === 'Clien' || !deal.img || deal.img.includes('placeholder')) {
                imgHtml = `<div class="brand-placeholder ${config.bg}">${config.emoji}</div>`;
            } else {
                imgHtml = `<img src="${deal.img}" class="deal-img" onerror="window.handleImageError(this, '${deal.source}')">`;
            }

            const card = `
                <a href="${deal.link}" target="_blank" class="deal-card">
                    ${imgHtml}
                    <div class="deal-info">
                        <div class="deal-meta">
                            <div><span class="deal-source">${deal.source}</span> <span class="deal-cat">${deal.category || '기타'}</span></div>
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

    // 이미지 로딩 실패 시 브랜드 플레이스홀더로 교체 (v1.4)
    window.handleImageError = function (img, source) {
        const brandConfig = {
            'Ppomppu': { bg: 'bg-ppomppu', emoji: '🛒' },
            'Clien': { bg: 'bg-clien', emoji: '💻' },
            'FM Korea': { bg: 'bg-fmkorea', emoji: '🔥' },
            'Eomisae': { bg: 'bg-eomisae', emoji: '🐦' }
        };
        const config = brandConfig[source] || { bg: '', emoji: '📦' };

        const parent = img.parentElement;
        const placeholder = document.createElement('div');
        placeholder.className = `brand-placeholder ${config.bg}`;
        placeholder.innerText = config.emoji;

        if (parent) {
            parent.replaceChild(placeholder, img);
        }
    };

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
                    <div class="inventory-left" style="gap:12px;">
                        <div class="emoji-icon">${emoji}</div>
                        <span class="item-name">${item.name}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                        ${isInventoryEditMode ? `
                            <button class="btn-move" onclick="moveInventoryItem(${index}, -1)"><i class="fa-solid fa-arrow-up"></i></button>
                            <button class="btn-move" onclick="moveInventoryItem(${index}, 1)"><i class="fa-solid fa-arrow-down"></i></button>
                        ` : ''}
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

    window.moveInventoryItem = function (index, direction) {
        if (index + direction < 0 || index + direction >= inventory.length) return;
        const temp = inventory[index];
        inventory[index] = inventory[index + direction];
        inventory[index + direction] = temp;
        syncDB('inventory');
        renderInventory();
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
            const badgeClass = item.source === "직접 입력" ? "badge-manual" : "badge-auto";
            const style = item.purchased ? "text-decoration: line-through; color: var(--text-sub); opacity: 0.6;" : "";
            const icon = item.purchased ? "fa-solid fa-check-circle" : "fa-regular fa-circle";
            const html = `
                <li class="list-item" style="${style}">
                    <div style="display:flex; align-items:center; gap:12px; cursor:pointer; flex:1;" onclick="appToggleShopping(${index})">
                        <i class="${icon}" style="color:${item.purchased ? 'var(--text-sub)' : 'var(--primary-color)'}; font-size:1.3rem;"></i>
                        <div style="display:flex; flex-direction:column; gap:4px;">
                            <span class="item-name" style="margin:0;">${item.name}</span>
                            <span class="shopping-badge ${badgeClass}">${item.source}</span>
                        </div>
                    </div>
                    <div style="display:flex; align-items:center;">
                        ${isShoppingEditMode ? `
                            <button class="btn-move" onclick="moveShoppingItem(${index}, -1)"><i class="fa-solid fa-arrow-up"></i></button>
                            <button class="btn-move" onclick="moveShoppingItem(${index}, 1)"><i class="fa-solid fa-arrow-down"></i></button>
                        ` : ''}
                        <button onclick="appDeleteShopping(${index})" style="background:none; border:none; color:var(--text-sub); margin-left:8px; padding:4px;"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </li>
            `;
            ul.insertAdjacentHTML('beforeend', html);
        });
    }

    window.appToggleShopping = function (index) {
        shoppingList[index].purchased = !shoppingList[index].purchased;

        // 체크된(구매 완료) 항목은 하단으로, 미완료는 상단으로 자동 정렬
        shoppingList.sort((a, b) => {
            if (a.purchased === b.purchased) return 0;
            return a.purchased ? 1 : -1;
        });

        syncDB('shoppingList');
        renderShopping();
    };

    window.appDeleteShopping = function (index) {
        shoppingList.splice(index, 1);
        syncDB('shoppingList');
        renderShopping();
    };

    window.moveShoppingItem = function (index, direction) {
        if (index + direction < 0 || index + direction >= shoppingList.length) return;
        const temp = shoppingList[index];
        shoppingList[index] = shoppingList[index + direction];
        shoppingList[index + direction] = temp;
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
            // 부분 일치도 허용
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

        document.getElementById('btn-edit-inventory').addEventListener('click', (e) => {
            isInventoryEditMode = !isInventoryEditMode;
            e.currentTarget.innerHTML = isInventoryEditMode ? `<i class="fa-solid fa-check"></i> 완료` : `<i class="fa-solid fa-pen"></i> 편집`;
            renderInventory();
        });

        document.getElementById('btn-edit-shopping').addEventListener('click', (e) => {
            isShoppingEditMode = !isShoppingEditMode;
            e.currentTarget.innerHTML = isShoppingEditMode ? `<i class="fa-solid fa-check"></i> 완료` : `<i class="fa-solid fa-pen"></i> 편집`;
            renderShopping();
        });

        fetchAndRenderDeals();
        renderInventory();
        renderShopping();
        renderKeywords();
        switchTab('view-home');
    }

    init();

});
