import requests
from bs4 import BeautifulSoup
import json
import re
import os
from datetime import datetime, timedelta

import time
import random

def get_category(title):
    """제목을 분석하여 카테고리 자동 분류 (정밀도 대폭 업그레이드)"""
    title = title.lower()
    mapping = {
        '식품': ['우유', '물', '생수', '햇반', '라면', '커피', '고기', '과자', '음료', '식품', '쌀', '김치', '만두', '참치', '스팸', '계란', '치킨', '피자', '음식', '과일', '한우', '삼겹살', '콜라', '사이다', '제로', '초코', '아이스크림', '볶음밥', '냉동', '돼지', '닭', '소스', '케찹', '즙', '마늘', '양파'],
        '가전': ['노트북', 'tv', '청소기', '에어프라이어', '모니터', '폰', '갤럭시', '아이폰', '워치', '패드', '컴퓨터', '가전', '냉장고', '키보드', '마우스', '이어폰', '에어팟', '태블릿', '닌텐도', '스위치', '플레이스테이션', '공기청정기', '에어컨', '선풍기'],
        '의류': ['옷', '티셔츠', '바지', '청바지', '나이키', '아디다스', '신발', '양말', '패딩', '코트', '운동화', '잡화', '맨투맨', '슬랙스', '자켓', '니트', '언더웨어', '스니커즈', '조거', '반팔', '바람막이', '뉴발란스', '뉴발', '아식스', '살로몬', '반스', '아크테릭스', '칼하트'],
        '생활': ['화장지', '세제', '샴푸', '칫솔', '치약', '비누', '후라이팬', '냄비', '주방', '물티슈', '마스크', '생리대', '수건', '바디워시', '트리트먼트', '디퓨저', '캠핑', '로션', '크림', '선크림', '영양제', '비타민', '루테인', '유산균', '휴지', '건전지', '의자', '책상']
    }
    
    for cat, keywords in mapping.items():
        if any(kw in title for kw in keywords):
            return cat
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
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
        # 뽐ppu 구조 변경 대응: .baseList-title 클래스를 가진 a 태그를 먼저 찾음
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
    # 인기정보(fs), 패션정보(os), 기타정보(rt)
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
            
            # 어미새 최신 글은 .card_el 형태의 그리드로 나열되어 있음
            cards = soup.select('.card_el')
            count = 0
            
            for card in cards:
                # 제목 및 링크 추출: a.pjax 태그 내부 텍스트 사용
                title = ""
                link = ""
                title_nodes = card.select('a.pjax')
                for node in title_nodes:
                    if 'tt_cm' not in node.get('class', []) and 'hx' not in node.get('class', []):
                        title = node.text.strip()
                        link = "https://eomisae.co.kr" + node.get('href', '')
                        break
                
                if not title: continue
                
                # 이미지 추출: 썸네일 이미지가 이미 그리드에 제공됨
                img_tag = card.select_one('img')
                img_url = img_tag.get('src') if img_tag else ""
                
                # 대체 이미지 처리 / 경로 변환
                if img_url == "" or "/images/sub.png" in img_url:
                    img_url = "https://via.placeholder.com/96x96/747cfd/ffffff?text=Eomisae"
                elif img_url.startswith('//'):
                    img_url = "https:" + img_url
                elif img_url.startswith('/'):
                    img_url = "https://eomisae.co.kr" + img_url
                
                deals.append({
                    "title": f"[{info_type}] {title}",
                    "price": "확인", # 핫딜 게시판 성격상 가격은 본문에 포함되어 있음
                    "link": link,
                    "img": img_url,
                    "source": "Eomisae",
                    "category": get_category(title),
                    "timestamp": datetime.now().isoformat()
                })
                count += 1
                if count >= 15: break # 각 게시판당 최신 15개씩(총 45개)
                
        except Exception as e:
            print(f"Eomisae Error ({info_type}): {e}")
            
    return deals

def scrape_arcalive():
    url = "https://arca.live/b/hotdeal"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    deals = []
    try:
        response = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')
        items = soup.select('a.vrow:not(.notice)')
        
        for item in items:
            title_node = item.select_one('.title')
            if not title_node: continue
            title_text = title_node.get_text(strip=True)
            link = "https://arca.live" + item['href']
            
            deals.append({
                "title": title_text,
                "price": "확인",
                "link": link,
                "img": "https://via.placeholder.com/150?text=ARCA",
                "source": "Arcalive",
                "category": get_category(title_text),
                "timestamp": datetime.now().isoformat()
            })
            if len(deals) >= 20: break
    except Exception as e:
        print(f"Arcalive Error: {e}")
    return deals

# --- 3. 메인 실행부 ---

def main():
    print("[INFO] 수집 엔진 가동 (4대 사이트 + 카테고리 자동 분류)")
    
    # 환경변수에서 Firebase DB 기본 URL을 가져오고 결합 오류 방지
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
        ("Ppomppu", scrape_ppomppu),
        ("FM Korea", scrape_fmkorea),
        ("Arcalive", scrape_arcalive),
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
    combined = list({deal['title']: deal for deal in (old_data + all_deals)}.values())
    
    # 48시간 지난 데이터 삭제
    final_deals = clean_old_deals(combined, days=2)
    print(f"[CLEAN] 최신성 유지 완료. 최종 {len(final_deals)}개 준비됨.")
    
    # 분류 통계
    stats = {}
    for d in final_deals:
        cat = d.get('category', '기타')
        stats[cat] = stats.get(cat, 0) + 1
    
    print("\n[REPORT] 카테고리 자동 분류 결과")
    for cat in ['식품', '가전', '의류', '생활', '기타']:
        print(f" - {cat}: {stats.get(cat, 0)}개")

    # Firebase 업로드
    try:
        print("\n[SYNC] Firebase 동기화 중...")
        response = requests.put(FIREBASE_URL, json=final_deals, timeout=20)
        if response.status_code == 200:
            print("[SUCCESS] 모든 데이터와 카테고리가 업데이트되었습니다.")
        else:
            print(f"[ERROR] 상태코드: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] 통신 오류: {e}")

if __name__ == "__main__":
    main()
