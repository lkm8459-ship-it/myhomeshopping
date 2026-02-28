// app.js - 핵심 비즈니스 로직 및 뷰 컨트롤러

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
    const FAMILY_CODE = "jangbogi77"; // 우리 가족 데이터 식별용 코드

    // 🔥 Firebase 초기화 (제공해주신 URL 사용)
    const firebaseConfig = {
        databaseURL: "https://myhomeshopping-a9724-default-rtdb.firebaseio.com/"
    };
    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();

    // 상태 변수 (실시간 반영을 위해 let으로 선언)
    let keywords = [];
    let shoppingList = [];
    let inventory = [];

    // [중요] Firebase 실시간 리스너 설정
    // 키워드 데이터 동기화
    db.ref(`families/${FAMILY_CODE}/keywords`).on('value', (snapshot) => {
        const data = snapshot.val();
        keywords = data || ["우유", "생수", "휴지", "라면"]; // 데이터 없으면 초기값
        renderKeywords();
        if (typeof fetchAndRenderDeals === 'function') fetchAndRenderDeals();
    });

    // 장보기 리스트 동기화
    db.ref(`families/${FAMILY_CODE}/shoppingList`).on('value', (snapshot) => {
        const data = snapshot.val();
        // Firebase는 배열 저장 시 인덱스가 깨질 수 있으므로 객체형태를 배열로 변환
        shoppingList = data ? Object.values(data) : [];
        renderShopping();
    });

    // 냉장고 현황 동기화
    db.ref(`families/${FAMILY_CODE}/inventory`).on('value', (snapshot) => {
        const data = snapshot.val();
        inventory = data || [
            { id: "milk", name: "서울우유 1L", status: "enough", img: "https://via.placeholder.com/40" },
            { id: "water", name: "삼다수 2L", status: "low", img: "https://via.placeholder.com/40" },
            { id: "ramen", name: "신라면", status: "enough", img: "https://via.placeholder.com/40" }
        ];
        renderInventory();
    });

    // 데이터 업데이트 도우미 함수 (Firebase에 직접 저장)
    function syncDB(type) {
        if (type === 'keywords') db.ref(`families/${FAMILY_CODE}/keywords`).set(keywords);
        if (type === 'shoppingList') db.ref(`families/${FAMILY_CODE}/shoppingList`).set(shoppingList);
        if (type === 'inventory') db.ref(`families/${FAMILY_CODE}/inventory`).set(inventory);
    }

    // --- 2. 하단 네비게이션 탭 라우팅 (SPA) ---
    function setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-item');
        const viewSections = document.querySelectorAll('.view-section');

        // 직접 이벤트 바인딩 (강력한 onclick 주입)
        navButtons.forEach(btn => {
            btn.onclick = function (e) {
                e.preventDefault();
                e.stopPropagation();

                const targetId = this.getAttribute('data-target');
                console.log("Nav Button Clicked! Target:", targetId);

                if (!targetId) return;

                // 모든 뷰 숨김 및 버튼 비활성화
                viewSections.forEach(sec => sec.classList.remove('active'));
                navButtons.forEach(b => b.classList.remove('active'));

                // 타겟 뷰 표시 및 버튼 활성화
                const targetView = document.getElementById(targetId);
                if (targetView) targetView.classList.add('active');
                this.classList.add('active');
            };
        });
    }

    // --- 2.2 좌우 스와이프 탭 이동 (Touch Swipe) ---
    /*
    let touchStartX = 0;
    let touchEndX = 0;
    const viewOrder = ['view-home', 'view-inventory', 'view-shopping', 'view-keywords'];

    const mainContent = document.getElementById('main-content');

    mainContent.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    mainContent.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        // ... (생략) 스와이프 로직이 클릭 이벤트를 훔치는지 확인하기 위해 임시 비활성화
    }
    */

    // --- 3. 데이터 렌더링 함수 ---

    // 전역 핫딜 데이터 캐시
    let allDealsData = [];

    // 3.1 핫딜 피드 불러오기
    async function fetchAndRenderDeals() {
        const feedContainer = document.querySelector('.feed-container');
        try {
            const FIREBASE_DEALS_URL = "https://myhomeshopping-a9724-default-rtdb.firebaseio.com/deals.json";

            const response = await fetch(FIREBASE_DEALS_URL);
            if (!response.ok) throw new Error("서버 데이터 로드 실패");

            let deals = await response.json();
            if (!deals) {
                feedContainer.innerHTML = `<div class="empty-state">아직 수집된 핫딜이 없습니다. 컴퓨터에서 스크래퍼를 실행해주세요!</div>`;
                return;
            }

            // 최신순 (타임스탬프 역순) 정렬 기본 설정
            deals.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
            allDealsData = deals;

            // 마지막 수집 시간 업데이트 (설정 모달용)
            if (deals.length > 0 && deals[0].timestamp) {
                const lastTime = new Date(deals[0].timestamp);
                document.getElementById('last-update-time').innerText = lastTime.toLocaleString('ko-KR');
            }

            // 현재 선택된 탭 기준으로 초기 렌더링
            renderFilteredDeals();

        } catch (error) {
            console.error(error);
            feedContainer.innerHTML = `<div class="empty-state">데이터를 불러오지 못했습니다.</div>`;
        }
    }

    // 3.1.2 선택된 카테고리에 맞춰 필터링 및 화면 그리기
    function renderFilteredDeals() {
        const feedContainer = document.querySelector('.feed-container');
        feedContainer.innerHTML = '';

        const activeCatBtn = document.querySelector('.cat-btn.active');
        const currentCat = activeCatBtn ? activeCatBtn.getAttribute('data-cat') : '전체';

        let targetDeals = allDealsData;
        if (currentCat !== '전체') {
            targetDeals = allDealsData.filter(d => (d.category || '기타') === currentCat);
        }

        // 키워드 설정이 있다면 위로 정렬
        targetDeals.sort((a, b) => {
            const aMatched = keywords.some(kw => a.title.includes(kw)) ? 1 : 0;
            const bMatched = keywords.some(kw => b.title.includes(kw)) ? 1 : 0;
            return bMatched - aMatched; // 1이면 위로
        });

        if (targetDeals.length === 0) {
            feedContainer.innerHTML = `<div class="empty-state">해당 카테고리의 핫딜이 없습니다.</div>`;
            return;
        }

        targetDeals.forEach(deal => {
            const isMatched = keywords.some(kw => deal.title.includes(kw));
            const matchedHtml = isMatched ? `<span style="color:var(--accent-red);">🔥 직구/키워드</span>` : '';

            // 경과 시간 계산
            let timeString = '';
            if (deal.timestamp) {
                const diffMs = new Date() - new Date(deal.timestamp);
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMins / 60);
                const diffDays = Math.floor(diffHours / 24);

                if (diffDays > 0) timeString = `${diffDays}일 전`;
                else if (diffHours > 0) timeString = `${diffHours}시간 전`;
                else if (diffMins > 0) timeString = `${diffMins}분 전`;
                else timeString = '방금 전';
            }

            const catLabel = deal.category || '기타';

            const card = `
                <a href="${deal.link}" target="_blank" class="deal-card">
                    <img src="${deal.img}" class="deal-img" alt="${catLabel}" onerror="this.src='https://via.placeholder.com/96x96/eee/999?text=No+Image'">
                    <div class="deal-info">
                        <div>
                            <div class="deal-meta">
                                <div>
                                    <span class="deal-source">${deal.source}</span>
                                    <span class="deal-cat">${catLabel}</span>
                                </div>
                                ${matchedHtml}
                            </div>
                            <h3 class="deal-title">${deal.title}</h3>
                        </div>
                        <div class="deal-bottom">
                            <div class="deal-price">${deal.price}</div>
                            <div class="deal-time">${timeString ? '<i class="fa-regular fa-clock"></i> ' + timeString : ''}</div>
                        </div>
                    </div>
                </a>
            `;
            feedContainer.insertAdjacentHTML('beforeend', card);
        });
    }

    // 카테고리 탭 클릭 이벤트 설정
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderFilteredDeals();
        });
    });

    // 3.2 냉장고 렌더링
    function renderInventory() {
        const listDiv = document.querySelector('.inventory-list');
        listDiv.innerHTML = '';

        inventory.forEach((item, index) => {
            const btnClass = item.status === 'enough' ? 'status-enough' : 'status-low';
            const btnText = item.status === 'enough' ? '여유' : '부족 !';

            // 이미지 혹은 이모지 표시
            let iconHtml = '';
            const emoji = getEmojiForName(item.name);
            if (emoji) {
                iconHtml = `<div class="emoji-icon">${emoji}</div>`;
            } else if (item.img) {
                iconHtml = `<img src="${item.img}" class="inventory-thumbnail" onerror="this.src='https://via.placeholder.com/48?text=X'">`;
            } else {
                iconHtml = `<div class="emoji-icon">📦</div>`; // 기본 상자 이모지
            }

            const html = `
                <div class="list-item">
                    <div class="inventory-left">
                        ${iconHtml}
                        <span class="item-name">${item.name}</span>
                    </div>
                    <button class="status-toggle ${btnClass}" data-index="${index}">${btnText}</button>
                </div>
            `;
            listDiv.insertAdjacentHTML('beforeend', html);
        });

        // 토글 이벤트 연결
        document.querySelectorAll('.status-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.target.getAttribute('data-index');
                toggleInventoryStatus(idx);
            });
        });
    }

    // 3.3 스마트 연동 액션 (냉장고 상태 토글)
    function toggleInventoryStatus(index) {
        const item = inventory[index];
        // 상태 반전
        item.status = item.status === 'enough' ? 'low' : 'enough';

        // 만약 부족해졌다면?! -> 장보기 리스트로 자동 추가!
        if (item.status === 'low') {
            // 이미 장보기 리스트에 있는지 확인 (간단히 이름으로 매칭)
            const exists = shoppingList.find(s => s.name.includes(item.name) && !s.purchased);
            if (!exists) {
                shoppingList.push({
                    id: Date.now(),
                    name: item.name,
                    source: "냉장고 부족",
                    purchased: false
                });
                syncDB('shoppingList');
                renderShopping(); // 장보기 리스트 다시 그리기
                alert(`'${item.name}' 항목이 장보기 목록에 자동 추가되었습니다!`);
            }
        }

        syncDB('inventory');
        // 다시 그리기
        renderInventory();
    }

    // 3.4 장보기 리스트 렌더링
    function renderShopping() {
        const ul = document.querySelector('.shopping-list');
        ul.innerHTML = '';

        shoppingList.forEach((item, index) => {
            // 구매 완료면 취소선 (간단한 스타일)
            const style = item.purchased ? "text-decoration: line-through; color: var(--text-sub);" : "";
            const icon = item.purchased ? "fa-solid fa-check-circle" : "fa-regular fa-circle";
            const color = item.purchased ? "var(--text-sub)" : "var(--primary-color)";

            const html = `
                <li class="list-item" style="${style}">
                    <div style="display:flex; align-items:center; gap:10px;" onclick="appToggleShopping(${index})">
                        <i class="${icon}" style="color:${color}; font-size:1.2rem;"></i>
                        <span class="item-name">${item.name} <small style="color:#aaa; font-weight:normal;">(${item.source})</small></span>
                    </div>
                    <button onclick="appDeleteShopping(${index})" style="background:none; border:none; color:var(--text-sub);"><i class="fa-solid fa-xmark"></i></button>
                </li>
            `;
            ul.insertAdjacentHTML('beforeend', html);
        });
    }

    // 장보기 구매 토글 (인라인 onclick 용도 - 실제 구동을 위해 전역 연결)
    window.appToggleShopping = function (index) {
        shoppingList[index].purchased = !shoppingList[index].purchased;
        syncDB('shoppingList');
        renderShopping();
    };

    // 장보기 개별 삭제
    window.appDeleteShopping = function (index) {
        shoppingList.splice(index, 1);
        syncDB('shoppingList');
        renderShopping();
    };

    // 장보기 품목 직접 추가 로직
    document.getElementById('add-shopping-item-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('new-item-input');
        if (!input.value.trim()) return;

        shoppingList.push({
            id: Date.now(),
            name: input.value.trim(),
            source: "직접 입력",
            purchased: false
        });

        syncDB('shoppingList');
        input.value = '';
        renderShopping();
    });

    // "장보기 완료! 🛒" 버튼: 구매 완료(purchased:true) 된 것들만 일괄 삭제 및 냉장고 동기화
    document.querySelector('.btn-complete-mode').addEventListener('click', () => {
        const initialLen = shoppingList.length;

        // 장보기 완료된 항목들을 찾아서 냉장고에 롤백 (이름으로 대조)
        const completedItems = shoppingList.filter(item => item.purchased);
        completedItems.forEach(buyItem => {
            const invItem = inventory.find(inv => inv.name === buyItem.name);
            if (invItem && invItem.status === 'low') {
                invItem.status = 'enough';
            }
        });

        // 남은 리스트만 필터링
        shoppingList = shoppingList.filter(item => !item.purchased);

        if (initialLen > shoppingList.length) {
            syncDB('inventory');    // 롤백된 냉장고 상태 저장
            syncDB('shoppingList'); // 장보기 정리 내역 저장
            showToast("장보기 완료! 냉장고 상태도 업데이트 되었습니다. 🛒");
            renderInventory(); // 냉장고 리스트 재랜더링
            renderShopping();  // 장바구니 재랜더링
        } else {
            showToast("완료 체크된 항목이 없습니다.");
        }
    });

    // 토스트 알림 함수
    let toastTimeout;
    function showToast(message) {
        const toastEl = document.getElementById('toast-message');
        if (!toastEl) return;

        toastEl.textContent = message;
        toastEl.classList.remove('toast-hidden');
        toastEl.classList.add('toast-show');

        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toastEl.classList.remove('toast-show');
            toastEl.classList.add('toast-hidden');
        }, 3000);
    }

    // 3.5 키워드 렌더링
    function renderKeywords() {
        const container = document.querySelector('.keyword-chips-container');
        container.innerHTML = '';

        keywords.forEach((kw, index) => {
            // CSS 파일에 정의되지 않았지만 인라인으로 칩 설계
            const chip = `
                <div style="display:inline-flex; align-items:center; background:white; padding:8px 12px; border-radius:20px; border:1px solid var(--border-color); margin:5px; box-shadow:var(--shadow-sm);">
                    <span style="font-weight:700; color:var(--primary-color);">${kw}</span>
                    <i class="fa-solid fa-xmark" style="margin-left:8px; color:#ccc; cursor:pointer;" onclick="appDeleteKeyword(${index})"></i>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', chip);
        });
    }

    window.appDeleteKeyword = function (index) {
        keywords.splice(index, 1);
        syncDB('keywords');
        renderKeywords();
        fetchAndRenderDeals();
    };

    document.getElementById('add-keyword-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('new-keyword-input');
        if (!input.value.trim()) return;

        if (!keywords.includes(input.value.trim())) {
            keywords.push(input.value.trim());
            syncDB('keywords');
            renderKeywords();
            fetchAndRenderDeals();
        }
        input.value = '';
    });

    // --- 5. 설정 모달 및 테마 기능 ---
    function setupSettingsModal() {
        const modal = document.getElementById('settings-modal');
        const btnOpen = document.getElementById('header-settings');
        const btnClose = document.querySelector('.btn-close-modal');

        // 열기
        if (btnOpen && modal) {
            btnOpen.addEventListener('click', () => {
                modal.style.display = 'flex';
            });
        }

        // 닫기
        if (btnClose && modal) {
            btnClose.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }

        // 모달 바깥 배경 클릭 시 닫기
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.style.display = 'none';
            });
        }

        // 수동 최신화 확인
        const btnManualSync = document.getElementById('btn-manual-sync');
        if (btnManualSync) {
            btnManualSync.addEventListener('click', () => {
                btnManualSync.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 확인 중...`;
                fetchAndRenderDeals().then(() => {
                    setTimeout(() => {
                        btnManualSync.innerHTML = `<i class="fa-solid fa-check"></i> 동기화 완료`;
                        setTimeout(() => {
                            btnManualSync.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i> 수동으로 최신화 확인`;
                        }, 2000);
                    }, 500);
                });
            });
        }

        // 가족코드 저장
        const btnSaveCode = document.getElementById('btn-save-code');
        if (btnSaveCode) {
            btnSaveCode.addEventListener('click', () => {
                alert('가족 코드가 저장되었습니다. (추후 DB 동기화 지원 예정)');
            });
        }
    }

    // --- 6. 초기 구동 ---
    function init() {
        setupNavigation();
        setupSettingsModal();
        fetchAndRenderDeals();
        renderInventory();
        renderShopping();
        renderKeywords();

        // 초기 홈화면 활성화
        const viewSections = document.querySelectorAll('.view-section');
        const navButtons = document.querySelectorAll('.nav-item');
        viewSections.forEach(sec => sec.classList.remove('active'));
        navButtons.forEach(b => b.classList.remove('active'));

        document.getElementById('view-home').classList.add('active');
        document.querySelector('[data-target="view-home"]').classList.add('active');
    }

    // 앱 시작
    init();

});
