import requests
from bs4 import BeautifulSoup
import json
import re
import os

def scrape_fmkorea():
    url = "https://www.fmkorea.com/hotdeal"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
        'Referer': 'https://www.fmkorea.com/'
    }
    deals = []
    try:
        response = requests.get(url, headers=headers)
        soup = BeautifulSoup(response.text, 'html.parser')
        items = soup.select('div.fm_best_widget > ul > li')
        
        for item in items:
            title_node = item.select_one('h3.title > a')
            if not title_node: continue
            
            title_text = title_node.get_text(strip=True)
            title_text = re.sub(r'\[\d+\]$', '', title_text) 
            
            link = "https://www.fmkorea.com" + title_node['href']
            
            # Image (Lazy load support)
            img_node = item.select_one('img.thumb')
            img_url = ""
            if img_node:
                img_url = img_node.get('data-original') or img_node.get('data-src') or img_node.get('src') or ""
                if "transparent.gif" in img_url:
                    img_url = img_node.get('data-original') or img_node.get('data-src') or ""
                if img_url.startswith('//'):
                    img_url = "https:" + img_url
            
            if not img_url or "transparent.gif" in img_url:
                img_url = "https://via.placeholder.com/150/f1f5f9/4f46e5?text=FM"

            # Category
            cat_node = item.select_one('span.category > a')
            category = cat_node.get_text(strip=True).replace('/', '') if cat_node else "기타"
            
            # Price
            price = "가격 정보 없음"
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
                "img": img_url,
                "source": "FM Korea",
                "category": category,
                "isViral": any(word in title_text for word in ["역대급", "혜택가", "지림", "대박"]),
                "date": "오늘"
            })
    except Exception as e:
        print(f"FM Korea Scrape Error: {e}")
    return deals[:12]

def scrape_ppomppu():
    url = "https://www.ppomppu.co.kr/zboard/zboard.php?id=ppomppu"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
    }
    deals = []
    try:
        response = requests.get(url, headers=headers)
        # Try different decoding if EUC-KR fails
        try:
            content = response.content.decode('euc-kr')
        except:
            content = response.text
            
        soup = BeautifulSoup(content, 'html.parser')
        
        # Ppomppu items are in <tr> with class list0 or list1
        rows = soup.select('tr.list0, tr.list1')
        
        for row in rows:
            # Skip notice items (usually have 'notice' in img src or specific text)
            if row.select_one('img[src*="notice"]'): continue
            
            title_a = row.select_one('a.baseList-title')
            if not title_a: continue
            
            title_text = title_a.get_text(strip=True)
            title_text = re.sub(r'\[\d+\]$', '', title_text)
            
            link = "https://www.ppomppu.co.kr/zboard/" + title_a['href']
            
            # Image
            img_node = row.select_one('.baseList-thumb img')
            img_url = ""
            if img_node:
                img_url = img_node.get('src') or ""
                if img_url.startswith('//'): img_url = "https:" + img_url
            
            if not img_url:
                img_url = "https://via.placeholder.com/150/f1f5f9/4f46e5?text=PP"

            # Category
            cat_node = row.select_one('span.baseList-c')
            category = cat_node.get_text(strip=True).strip('[]') if cat_node else "기타"
            
            # Price
            price_match = re.search(r'\(([^)]+)\)', title_text)
            price = price_match.group(1) if price_match else "가격 확인"
            
            deals.append({
                "title": title_text,
                "price": price,
                "link": link,
                "img": img_url,
                "source": "Ppomppu",
                "category": category,
                "isViral": False,
                "date": "오늘"
            })
            if len(deals) >= 12: break
    except Exception as e:
        print(f"Ppomppu Scrape Error: {e}")
    return deals

def scrape_arcalive():
    url = "https://arca.live/b/hotdeal"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
    }
    deals = []
    try:
        response = requests.get(url, headers=headers)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 아카라이브 핫딜 게시판 리스트
        items = soup.select('a.vrow:not(.notice)')
        
        for item in items:
            title_node = item.select_one('.title')
            if not title_node: continue
            
            title_text = title_node.get_text(strip=True)
            # 카테고리 태그 텍스트 지우기 (예: [PC/하드웨어])
            cat_node = item.select_one('.badge')
            category = "기타"
            if cat_node:
                category = cat_node.get_text(strip=True)
                title_text = title_text.replace(category, '').strip()
            
            # 가격 추출 로직 (보통 제목 안에 있음)
            price = "확인필요"
            price_match = re.search(r'\(([\d,]+원)\)', title_text)
            if price_match:
                price = price_match.group(1)
            else:
                 price_match = re.search(r'([\d,]+원)', title_text)
                 if price_match: price = price_match.group(1)

            link = "https://arca.live" + item['href']
            
            deals.append({
                "title": title_text,
                "price": price,
                "link": link,
                "img": "https://via.placeholder.com/150/ff9900/ffffff?text=ARCA", # 보수적 이미지
                "source": "Arcalive",
                "category": category,
                "isViral": False,
                "date": "오늘"
            })
            if len(deals) >= 15: break
            
    except Exception as e:
        print(f"Arcalive Scrape Error: {e}")
    return deals

def scrape_eomisae():
    url = "https://eomisae.co.kr/os"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    deals = []
    try:
        response = requests.get(url, headers=headers)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        items = soup.select('li.clear[class*="cx"]') # 어미새 리스트 구조
        
        for item in items:
            title_node = item.select_one('a.hx')
            if not title_node: continue
            
            title_text = title_node.get_text(strip=True)
            link = "https://eomisae.co.kr" + title_node['href']
            
            price = "확인필요"
            
            deals.append({
                "title": title_text,
                "price": price,
                "link": link,
                "img": "https://via.placeholder.com/150/222222/ffffff?text=EOMI",
                "source": "Eomisae",
                "category": "패션",
                "isViral": "품절" in title_text or "막차" in title_text,
                "date": "오늘"
            })
            if len(deals) >= 10: break
    except Exception as e:
         print(f"Eomisae Scrape Error: {e}")
    return deals


def main():
    print("수집 엔진 가동 중 (이미지 정밀 파싱)...")
    all_deals = []
    
    # 뽐뿌 수집
    try:
        ppomppu_deals = scrape_ppomppu()
        all_deals.extend(ppomppu_deals)
        print(f"Ppomppu: {len(ppomppu_deals)}개")
    except Exception as e: 
        print(f"Ppomppu skip: {e}")
    
    # FM코리아 수집
    try:
        fm_deals = scrape_fmkorea()
        all_deals.extend(fm_deals)
        print(f"FM Korea: {len(fm_deals)}개")
    except Exception as e:
        print(f"FM Korea skip: {e}")
    
    # 아카라이브 수집
    try:
        arca_deals = scrape_arcalive()
        all_deals.extend(arca_deals)
        print(f"Arcalive: {len(arca_deals)}개")
    except Exception as e:
        print(f"Arca skip: {e}")
    
    # 어미새 수집
    try:
        eomi_deals = scrape_eomisae()
        all_deals.extend(eomi_deals)
        print(f"Eomisae: {len(eomi_deals)}개")
    except Exception as e:
        print(f"Eomi skip: {e}")
    
    # 1. 로컬 백업 저장
    with open('data.json', 'w', encoding='utf-8') as f:
        json.dump(all_deals, f, ensure_ascii=False, indent=2)
    
    # 2. Firebase 실시간 업로드 (스마트폰 앱 연동용)
    FIREBASE_URL = "https://myhomeshopping-a9724-default-rtdb.firebaseio.com/deals.json"
    try:
        print("Firebase 데이터베이스 동기화 중...")
        response = requests.put(FIREBASE_URL, json=all_deals)
        if response.status_code == 200:
            print("🎉 Firebase 업로드 완료! 스마트폰에서도 조회가 가능합니다.")
        else:
            print(f"Firebase 업로드 실패: {response.status_code}")
    except Exception as e:
        print(f"Firebase 통신 오류: {e}")

    print(f"모든 수집 완료 (총 {len(all_deals)}개)")

if __name__ == "__main__":
    main()
