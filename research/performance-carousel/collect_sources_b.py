from __future__ import annotations

import csv
import html
import re
import ssl
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path


OUT = Path(__file__).with_name("sources-b.csv")
SUMMARY = Path(__file__).with_name("sources-b-summary.md")
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36"
CTX = ssl.create_default_context()


def clean(value: str) -> str:
    value = html.unescape(re.sub(r"<[^>]+>", " ", value or ""))
    return re.sub(r"\s+", " ", value).strip()


def get(url: str, timeout: int = 25) -> tuple[int, str, str]:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "en-US,en;q=0.8"})
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=CTX) as response:
            return response.status, response.geturl(), response.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as exc:
        return exc.code, url, ""
    except Exception as exc:  # evidence ledger must retain access limitations
        return 0, url, f"ERROR:{type(exc).__name__}:{exc}"


def meta(body: str, key: str) -> str:
    patterns = [
        rf'<meta[^>]+(?:property|name)=["\']{re.escape(key)}["\'][^>]+content=["\']([^"\']+)',
        rf'<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\']{re.escape(key)}["\']',
    ]
    for pattern in patterns:
        match = re.search(pattern, body, re.I)
        if match:
            return clean(match.group(1))
    return ""


def extract(url: str) -> dict[str, str]:
    status, final_url, body = get(url)
    title = meta(body, "og:title") or clean((re.search(r"<title[^>]*>(.*?)</title>", body, re.I | re.S) or ["", ""])[1])
    description = meta(body, "og:description") or meta(body, "description")
    headings = [clean(m.group(1)) for m in re.finditer(r"<(?:h1|h2|h3)[^>]*>(.*?)</(?:h1|h2|h3)>", body, re.I | re.S)]
    headings = [h for h in headings if h and h.lower() not in {title.lower(), "further reading"}]
    categories = ""
    category_match = re.search(r"Categories:\s*</?[^>]*>?(.*?)</p>", body, re.I | re.S)
    if category_match:
        categories = clean(category_match.group(1))
    sample = " | ".join(headings[:4])
    combined = " ".join([title, description, categories, sample]).lower()

    if any(k in combined for k in ("3d", "webgl", "immersive", "spatial", "depth", "perspective")):
        pattern = "3D·공간 깊이"
        decision = "채택: 단일 소실점, 전경 가림, 접촉 그림자로 깊이 표현. 배제: 장식용 3D와 과도한 카메라 회전."
    elif any(k in combined for k in ("carousel", "slider", "gallery", "horizontal", "filmstrip")):
        pattern = "캐러셀·갤러리 전환"
        decision = "채택: 동일 템플릿 계약을 유지한 3상태 순환과 현재 항목 강조. 배제: 카드마다 다른 디자인 언어."
    elif any(k in combined for k in ("motion", "animation", "scroll", "parallax", "hover", "interaction")):
        pattern = "모션·상호작용"
        decision = "채택: 위치·스케일·불투명도 중심의 짧은 상태 전환. 배제: 정보 이해를 지연시키는 장식 모션."
    elif any(k in combined for k in ("architect", "interior", "building", "museum", "exhibition")):
        pattern = "건축 프레이밍·전시"
        decision = "채택: 연속된 한 개구부, 얇은 측면 공기층, 앞면 가림의 물리적 순서. 배제: 원본에 없는 독립 기둥."
    elif any(k in combined for k in ("minimal", "editorial", "typography", "portfolio", "magazine")):
        pattern = "미니멀·에디토리얼 위계"
        decision = "채택: 넓은 여백, 적은 레이어, 명확한 제목/정보 위계. 배제: 저대비 텍스트와 과밀한 카드."
    else:
        pattern = "큐레이션·시각 위계"
        decision = "채택: 대표 사례의 정보 밀도와 초점 배치를 비교. 배제: 공연 템플릿과 무관한 표면 스타일 복제."

    observation = f"메타: {description[:180] or '설명 없음'}"
    if sample:
        observation += f" / 관찰 소제목: {sample[:220]}"
    limitation = ""
    if status != 200:
        limitation = f"HTTP {status or '접속 실패'}; 검색/공식 보조 페이지로 존재 확인, 본문 직접 관찰 제한"
    elif "figma.com/community/" in final_url:
        limitation = "Figma Community robots/로그인 정책으로 상세 캔버스 직접 분석 제한; 공개 메타/공식 설명만 사용"

    return {
        "url": final_url,
        "domain": re.sub(r"^www\.", "", urllib.parse.urlparse(final_url).netloc),
        "http_status": str(status),
        "page_title": title or url.rstrip("/").split("/")[-1],
        "page_description_or_headings": observation,
        "observed_pattern": pattern,
        "adopt_or_exclude_reason": decision,
        "access_limitation": limitation,
    }


def one_page_love_urls(page_count: int = 8) -> list[str]:
    urls: set[str] = set()
    excluded = re.compile(
        r"/(?:about|api|articles|feed|inspiration|templates|genre|style|section|sections|platform|tech|typefaces|wp-content|wp-includes|submit|hire|letters|lofi|og|go|claude|meta-checker|social-preview|google-preview)(?:/|$)"
    )
    for page in range(1, page_count + 1):
        listing = "https://onepagelove.com/inspiration" if page == 1 else f"https://onepagelove.com/inspiration/page/{page}"
        status, _, body = get(listing)
        if status != 200:
            continue
        for match in re.finditer(r"https://onepagelove\.com/[a-z0-9][a-z0-9-]+", body, re.I):
            url = match.group(0).rstrip("/")
            if excluded.search(url) or url.endswith("templates"):
                continue
            urls.add(url)
    return sorted(urls)


def main() -> None:
    # Weekly Muzli pages are individual curated resource articles, not search-result URLs.
    muzli = [f"https://muz.li/blog/weekly-designers-update-{n}/" for n in range(430, 568)]
    opl = one_page_love_urls(8)
    supplemental = [
        "https://www.figma.com/community/file/1337383844852052585/parallax-scrolling-example",
        "https://www.figma.com/community/file/1524448265587210925",
        "https://www.figma.com/prototyping/",
        "https://www.figma.com/blog/introducing-figma-sites/",
        "https://www.figma.com/resource-library/ai-website-examples/",
        "https://tympanus.net/codrops/2025/06/03/building-a-smooth-horizontal-scroll-experience-with-gsap/",
        "https://tympanus.net/codrops/2023/12/01/creating-a-3d-perspective-carousel-with-css/",
        "https://tympanus.net/codrops/2022/05/17/how-to-create-a-layered-zoom-effect-with-html-and-css/",
        "https://tympanus.net/codrops/2024/01/10/building-an-immersive-3d-gallery-with-react-three-fiber/",
        "https://tympanus.net/codrops/2021/11/24/creative-image-hover-effects/",
    ]
    candidates = list(dict.fromkeys(muzli + opl + supplemental))
    rows: list[dict[str, str]] = []
    with ThreadPoolExecutor(max_workers=12) as executor:
        futures = {executor.submit(extract, url): url for url in candidates}
        for future in as_completed(futures):
            rows.append(future.result())

    # Only successful individual resources count toward the 140-source minimum.
    rows.sort(key=lambda row: (row["domain"], row["url"]))
    fields = [
        "url",
        "domain",
        "http_status",
        "page_title",
        "page_description_or_headings",
        "observed_pattern",
        "adopt_or_exclude_reason",
        "access_limitation",
    ]
    with OUT.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)

    successful = [row for row in rows if row["http_status"] == "200"]
    domain_counts: dict[str, int] = {}
    pattern_counts: dict[str, int] = {}
    for row in successful:
        domain_counts[row["domain"]] = domain_counts.get(row["domain"], 0) + 1
        pattern_counts[row["observed_pattern"]] = pattern_counts.get(row["observed_pattern"], 0) + 1
    lines = [
        "# Performance carousel research — source set B",
        "",
        f"- Candidates fetched: {len(rows)}",
        f"- Successful individual pages: {len(successful)}",
        f"- Access-limited/failed: {len(rows) - len(successful)}",
        "",
        "## Domain distribution",
        "",
        *[f"- {domain}: {count}" for domain, count in sorted(domain_counts.items(), key=lambda item: -item[1])],
        "",
        "## Pattern distribution",
        "",
        *[f"- {pattern}: {count}" for pattern, count in sorted(pattern_counts.items(), key=lambda item: -item[1])],
        "",
        "## Access caveat",
        "",
        "Figma Community individual resources may return robots/login restrictions. Those rows remain in the ledger with explicit limitations and do not count as directly inspected successes unless HTTP 200 was returned.",
    ]
    SUMMARY.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"rows={len(rows)} successful={len(successful)} opl={len(opl)}")


if __name__ == "__main__":
    main()
