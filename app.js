// app.js - 핵심 비즈니스 로직 및 뷰 컨트롤러

document.addEventListener('DOMContentLoaded', () => {

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
    const navButtons = document.querySelectorAll('.nav-item');
    const viewSections = document.querySelectorAll('.view-section');

    function switchView(targetId) {
        // 모든 뷰 숨김 및 버튼 비활성화
        viewSections.forEach(sec => sec.classList.remove('active'));
        navButtons.forEach(btn => btn.classList.remove('active'));

        // 타겟 뷰 표시 및 버튼 활성화
        document.getElementById(targetId).classList.add('active');
        document.querySelector(`[data-target="${targetId}"]`).classList.add('active');
    }

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            switchView(target);
        });
    });

    // --- 3. 데이터 렌더링 함수 ---

    // 3.1 핫딜 피드 렌더링 (Firebase에서 직접 로드)
    async function fetchAndRenderDeals() {
        const feedContainer = document.querySelector('.feed-container');
        try {
            // 이제 로컬 data.json이 아니라 Firebase 주소에서 가져옵니다.
            const FIREBASE_DEALS_URL = "https://myhomeshopping-a9724-default-rtdb.firebaseio.com/deals.json";

            const response = await fetch(FIREBASE_DEALS_URL);
            if (!response.ok) throw new Error("서버 데이터 로드 실패");

            let deals = await response.json();
            if (!deals) {
                feedContainer.innerHTML = `<div class="empty-state">아직 수집된 핫딜이 없습니다. 컴퓨터에서 스크래퍼를 실행해주세요!</div>`;
                return;
            }

            // 키워드에 맞는 핫딜을 위로 정렬
            deals.sort((a, b) => {
                const aMatched = keywords.some(kw => a.title.includes(kw)) ? 1 : 0;
                const bMatched = keywords.some(kw => b.title.includes(kw)) ? 1 : 0;
                return bMatched - aMatched;
            });

            feedContainer.innerHTML = '';

            deals.forEach(deal => {
                const isMatched = keywords.some(kw => deal.title.includes(kw));
                const matchedHtml = isMatched ? `<span style="color:var(--accent-red); font-size:0.7rem;">🔥 키워드 적중!</span>` : '';

                const card = `
                    <a href="${deal.link}" target="_blank" class="deal-card">
                        <img src="${deal.img}" class="deal-img" alt="상품 이미지" onerror="this.src='https://via.placeholder.com/480x180/eee/999?text=No+Image'">
                        <div class="deal-info">
                            <div>
                                <span class="deal-source">${deal.source}</span>
                                ${matchedHtml}
                            </div>
                            <h3 class="deal-title">${deal.title}</h3>
                            <div class="deal-price">${deal.price}</div>
                        </div>
                    </a>
                `;
                feedContainer.insertAdjacentHTML('beforeend', card);
            });

        } catch (error) {
            console.error(error);
            feedContainer.innerHTML = `<div class="empty-state">데이터를 불러오지 못했습니다.</div>`;
        }
    }

    // 3.2 냉장고 렌더링
    function renderInventory() {
        const listDiv = document.querySelector('.inventory-list');
        listDiv.innerHTML = '';

        inventory.forEach((item, index) => {
            const btnClass = item.status === 'enough' ? 'status-enough' : 'status-low';
            const btnText = item.status === 'enough' ? '여유' : '부족 !';

            const html = `
                <div class="list-item">
                    <div class="inventory-left">
                        <img src="${item.img}" class="inventory-thumbnail">
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

    // "장보기 완료! 🛒" 버튼: 구매 완료(purchased:true) 된 것들만 일괄 삭제
    document.querySelector('.btn-complete-mode').addEventListener('click', () => {
        const initialLen = shoppingList.length;
        shoppingList = shoppingList.filter(item => !item.purchased);

        if (initialLen > shoppingList.length) {
            syncDB('shoppingList');
            alert("장보기 목록이 정리되었습니다! 수고하셨습니다 🛒");
            renderShopping();
        } else {
            alert("완료 체크된 항목이 없습니다.");
        }
    });

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

    // --- 4. 초기 구동 ---
    fetchAndRenderDeals();
    renderInventory();
    renderShopping();
    renderKeywords();

});
