import requests
from bs4 import BeautifulSoup
import json
import re
import os
from datetime import datetime, timedelta

import time
import random

def get_category(title):
    """제목을 분석하여 카테고리 자동 분류 (생활용품 제거 -> 기타로 통합)"""
    title = title.lower()
    
    # 1. 먹거리(Food & Drink)
    food_brands = ['cj', 'cj제일제당', '비비고', '농심', '오뚜기', '풀무원', '대상', '청정원', '동원', '동원f&b', '오리온', '초코파이', '삼양식품', '매일', '매일유업', '남양유업', '빙그레', '롯데제과', '롯데푸드', '크라운제과', '해태']
    food_keywords = ['과일', '채소', '정육', '수산', '계란', '라면', '신라면', '진라면', '햇반', '생수', '물', '커피', '우유', '주스', '냉동', '밀키트', '간편식', '도시락', '과자', '빵', '스낵', '시리얼', '영양제', '건강식품', '고기', '음료', '식품', '쌀', '김치', '만두', '참치', '스팸', '치킨', '피자', '음식', '한우', '삼겹살', '콜라', '사이다', '제로', '초코', '아이스크림', '볶음밥', '돼지', '닭', '소스', '케찹', '즙', '마늘', '양파', '목살', '샐러드', '프로틴', '단백질', '활기력', '알룰로스', '홍삼', '간식', '젤리', '육포', '견과', '만두']

    # 2. 가전(Electronics)
    elec_brands = ['삼성', '삼성전자', '비스포크', '갤럭시', 'lg', 'lg전자', '오브제', 'sk매직', '위니아', '쿠쿠', '쿠첸', '다이슨', '발뮤다', '애플', '아이폰', '아이패드', '맥북', '에어팟']
    elec_keywords = ['냉장고', '세탁기', '에어컨', 'tv', '모니터', '청소기', '공기청정기', '드라이기', '밥솥', '전자레인지', '정수기', '인덕션', '전기레인지', '컴퓨터', '노트북', '태블릿', '스마트폰', '스마트워치', '이어폰', '헤드폰', '스피커', '충전기', '공유기', '프린터', '에어프라이어', '폰', '워치', '패드', '가전', '키보드', '마우스', '닌텐도', '스위치', '플레이스테이션']

    # 3. 의류(Fashion)
    fashion_brands = ['나이키', '아디다스', '푸마', '뉴발란스', '뉴발', '언더아머', '휠라', '노스페이스', '몽클레르', '파타고니아', '아크테릭스', '아식스', '살로몬', '반스', '칼하트', '무신사', '지오다노', '탑텐', '스파오', '잭니클라우스', 'LF', '헤지스']
    fashion_keywords = ['티셔츠', '셔츠', '니트', '맨투맨', '후드', '원피스', '스커트', '바지', '슬랙스', '청바지', '코트', '패딩', '자켓', '속옷', '양말', '레깅스', '운동화', '구두', '샌들', '슬리퍼', '가방', '모자', '안경', '선글라스', '액세서리', '쥬얼리', '시계', '옷', '신발', '잡화', '언더웨어', '스니커즈', '조거', '반팔', '바람막이', '팬티', '브라', '벨트', '지갑', '의류', '패션', '아우터', '트레이닝', '가디건', '숏패딩', '롱패딩']

    # 4. 생활용품(Living) -> '기타'로 통합을 위한 키워드 유지
    living_brands = ['유한킴벌리', '깨끗한나라', '하기스', '마미포코', '페브리즈', '락앤락', '코렐', '테팔', '해피콜']
    living_keywords = ['세제', '섬유유연제', '휴지', '화장지', '물티슈', '샴푸', '린스', '바디워시', '치약', '칫솔', '비누', '생리대', '기저귀', '수건', '이불', '베개', '프라이팬', '후라이팬', '냄비', '접시', '수납함', '멀티탭', '스탠드', '주방', '마스크', '트리트먼트', '디퓨저', '로션', '크림', '선크림', '건전지', '의자', '책상']

    # 5. 기타 특화 브랜드/키워드
    other_pet = ['로얄캐닌', '오리젠', '내추럴발란스', 'anf']
    other_leisure = ['데카트론', '콜맨', '스노우피크', '타이틀리스트', '캠핑']
    other_stationery = ['모나미', '3m', '포스트잇']
    other_services = ['구글플레이', '넷플릭스', '멜론', '지니', '카카오', '네이버', '기프티콘', '이용권', '쿠폰', '상품권']

    # --- 복합 조건 판별 로직 ---
    # 우선순위: 1. 명시적 대괄호 태그 -> 2. 먹거리 -> 3. 가전 -> 4. 의류 -> 5. 최종 기타
    if '[식품]' in title or '[먹거리]' in title: return '식품'
    if '[가전]' in title or '[디지털]' in title: return '가전제품'
    if '[패션]' in title or '[의류]' in title: return '의류'
    if '[생활]' in title: return '기타' # 생활 태그도 기타로 분류

    if any(b in title for b in food_brands) or any(k in title for k in food_keywords):
        return '식품'
        
    if any(b in title for b in elec_brands) or any(k in title for k in elec_keywords):
        return '가전제품'
        
    if any(b in title for b in fashion_brands) or any(k in title for k in fashion_keywords):
        return '의류'
        
    # 생활용품 브랜드/키워드 매칭 시에도 '기타' 반환 (사령관님 명령)
    if any(b in title for b in living_brands) or any(k in title for k in living_keywords):
        return '기타'
        
    return '기타'

def clean_old_deals(deals, days=2):
    """지정한 날짜(기본 2일)가 지난 데이터 삭제"""
    threshold = datetime.now() - timedelta(days=days)
    cleaned = []
    seen_titles = set()
    for deal in deals:
        if deal['title'] in seen_titles: continue
        try:
            deal_time = datetime.fromisoformat(deal.get('timestamp', '2000-01-01T00:00:00'))
            if deal_time > threshold:
                cleaned.append(deal)
                seen_titles.add(deal['title'])
        except:
            cleaned.append(deal)
            seen_titles.add(deal['title'])
    return cleaned

# --- 2. 사이트별 스크래퍼 ---

def scrape_fmkorea():
    url = "https://www.fmkorea.com/hotdeal"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }
    deals = []
    try:
        response = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')
        items = soup.select('div.fm_best_widget > ul > li')
        
        for item in items:
            title_node = item.select_one('h3.title > a')
            if not title_node: continue
            
            title_text = title_node.get_text(strip=True)
            title_text = re.sub(r'\[\d+\]$', '', title_text) 
            link = "https://www.fmkorea.com" + title_node['href']
            
            img_node = item.select_one('img.thumb')
            img_url = ""
            if img_node:
                img_url = img_node.get('data-original') or img_node.get('data-src') or img_node.get('src') or ""
                if img_url.startswith('//'): img_url = "https:" + img_url
            
            price = "확인"
            info_div = item.select_one('div.hotdeal_info')
            if info_div:
                for span in info_div.find_all('span'):
                    if '가격:' in span.get_text():
                        astrong = span.select_one('a.strong')
                        if astrong: price = astrong.get_text(strip=True)
                        break
            
            deals.append({
                "title": title_text,
                "price": price,
                "link": link,
                "img": img_url if img_url else "https://via.placeholder.com/150?text=No+Image",
                "source": "FM Korea",
                "category": get_category(title_text),
                "timestamp": datetime.now().isoformat()
            })
    except Exception as e:
        print(f"FM Korea Error: {e}")
    return deals[:20]

def scrape_ppomppu():
    url = "https://www.ppomppu.co.kr/zboard/zboard.php?id=ppomppu"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    deals = []
    try:
        response = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.content, 'html.parser', from_encoding='euc-kr')
        title_nodes = soup.select('.baseList-title')
        
        for title_a in title_nodes:
            row = title_a.find_parent('tr')
            if not row or row.select_one('img[src*="notice"]'): continue
            
            title_text = title_a.get_text(strip=True)
            link = "https://www.ppomppu.co.kr/zboard/" + title_a['href']
            img_node = row.select_one('.baseList-thumb img')
            img_url = img_node.get('src') if img_node else ""
            if img_url.startswith('//'): img_url = "https:" + img_url
            
            price_match = re.search(r'\(([^)]+)\)', title_text)
            price = price_match.group(1) if price_match else "확인"
            
            deals.append({
                "title": title_text,
                "price": price,
                "link": link,
                "img": img_url,
                "source": "Ppomppu",
                "category": get_category(title_text),
                "timestamp": datetime.now().isoformat()
            })
            if len(deals) >= 20: break
    except Exception as e:
        print(f"Ppomppu Error: {e}")
    return deals

def scrape_eomisae():
    targets = {
        "https://eomisae.co.kr/fs": "인기",
        "https://eomisae.co.kr/os": "패션",
        "https://eomisae.co.kr/rt": "기타"
    }
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    deals = []
    
    for url, info_type in targets.items():
        try:
            response = requests.get(url, headers=headers, timeout=10)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            cards = soup.select('.card_el')
            count = 0
            
            for card in cards:
                title = ""
                link = ""
                title_nodes = card.select('a.pjax')
                for node in title_nodes:
                    if 'tt_cm' not in node.get('class', []) and 'hx' not in node.get('class', []):
                        title = node.text.strip()
                        link = "https://eomisae.co.kr" + node.get('href', '')
                        break
                
                if not title: continue
                
                img_tag = card.select_one('img')
                img_url = img_tag.get('src') if img_tag else ""
                
                if img_url == "" or "/images/sub.png" in img_url:
                    img_url = "https://via.placeholder.com/96x96/747cfd/ffffff?text=Eomisae"
                elif img_url.startswith('//'):
                    img_url = "https:" + img_url
                elif img_url.startswith('/'):
                    img_url = "https://eomisae.co.kr" + img_url
                
                tagged_title = f"[{info_type}] {title}"
                deals.append({
                    "title": tagged_title,
                    "price": "확인", 
                    "link": link,
                    "img": img_url,
                    "source": "Eomisae",
                    "category": get_category(tagged_title),
                    "timestamp": datetime.now().isoformat()
                })
                count += 1
                if count >= 15: break
                
        except Exception as e:
            print(f"Eomisae Error ({info_type}): {e}")
            
    return deals

def scrape_clien():
    url = "https://www.clien.net/service/board/sold"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    deals = []
    try:
        response = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')
        items = soup.select('div.list_item.symph_row')
        
        for item in items:
            title_node = item.select_one('span.subject_fixed')
            if not title_node: continue
            title_text = title_node.get_text(strip=True)
            link_node = item.select_one('a.list_subject')
            link = "https://www.clien.net" + link_node['href'] if link_node else ""
            
            deals.append({
                "title": title_text,
                "price": "확인",
                "link": link,
                "img": "https://via.placeholder.com/150/D4A373/FFFFFF?text=Clien",
                "source": "Clien",
                "category": get_category(title_text),
                "timestamp": datetime.now().isoformat()
            })
            if len(deals) >= 20: break
    except Exception as e:
        print(f"Clien Error: {e}")
    return deals

# --- 3. 메인 실행부 ---

def main():
    print("[INFO] 수집 엔진 가동 (사이트 + 카테고리 4종 체제)")
    
    base_url = os.environ.get("FIREBASE_URL", "https://myhomeshopping-a9724-default-rtdb.firebaseio.com/")
    FIREBASE_URL = base_url.rstrip("/") + "/deals.json"
    
    try:
        response = requests.get(FIREBASE_URL, timeout=10)
        old_data = response.json() if response.status_code == 200 else []
        if not isinstance(old_data, list): old_data = []
        print(f"[INFO] 기존 데이터 {len(old_data)}개 로드됨.")
    except:
        old_data = []

    all_deals = []
    scrapers = [
        ("Clien", scrape_clien),
        ("Ppomppu", scrape_ppomppu),
        ("FM Korea", scrape_fmkorea),
        ("Eomisae", scrape_eomisae)
    ]
    
    for name, func in scrapers:
        print(f"[SEARCH] {name} 수집 중...")
        try:
            deals = func()
            print(f"   -> {len(deals)}개 발견")
            all_deals.extend(deals)
        except Exception as e:
            print(f"   -> {name} 실패: {e}")
    
    # 데이터 병합 및 중복 제거
    combined = list({deal['title'][:12]: deal for deal in (old_data + all_deals)}.values())
    
    # 48시간 지난 데이터 삭제
    final_deals = clean_old_deals(combined, days=2)
    print(f"[CLEAN] 최신성 유지 완료. 최종 {len(final_deals)}개 준비됨.")
    
    # 분류 통계
    stats = {}
    for d in final_deals:
        cat = d.get('category', '기타')
        stats[cat] = stats.get(cat, 0) + 1
    
    print("\n[REPORT] 카테고리 자동 분류 결과")
    for cat in ['식품', '가전제품', '의류', '기타']:
        print(f" - {cat}: {stats.get(cat, 0)}개")

    # Firebase 업로드
    try:
        print("\n[SYNC] Firebase 동기화 중...")
        response = requests.put(FIREBASE_URL, json=final_deals, timeout=20)
        if response.status_code == 200:
            print("[SUCCESS] 모든 데이터가 업데이트되었습니다.")
        else:
            print(f"[ERROR] 상태코드: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] 통신 오류: {e}")

if __name__ == "__main__":
    main()
