from __future__ import annotations

import csv
import html
import json
import re
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path


ROOT = Path(__file__).resolve().parent
OUT = ROOT / "sources-a.csv"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/138 Safari/537.36"

SEED_CODROPS = [
    "https://tympanus.net/codrops/css_reference/perspective/",
    "https://tympanus.net/codrops/?p=21765",
    "https://tympanus.net/codrops/css_reference/transform/",
    "https://tympanus.net/codrops/2013/02/27/image-techniques-for-creating-depth-in-web-design/",
    "https://tympanus.net/codrops/2011/01/03/parallax-slider/",
    "https://tympanus.net/codrops/2012/04/30/fluid-css3-slideshow-with-parallax-effect/",
]

GROUPS = {
    "공유 원근·깊이": ("perspective", "depth", "spatial", "3d", "webgl", "three.js", "immersive", "architecture", "architectural"),
    "레이어·마스크": ("layer", "layered", "overlay", "mask", "clip", "clipping", "aperture", "reveal", "window"),
    "캐러셀·순환": ("carousel", "slider", "slideshow", "gallery", "infinite", "loop", "horizontal"),
    "모션·전환": ("animation", "motion", "transition", "scroll", "interaction", "interactive", "gsap", "flip", "parallax"),
    "미니멀·편집": ("minimal", "editorial", "portfolio", "grid", "typography", "clean", "quiet"),
    "성능·접근성": ("performance", "accessible", "accessibility", "reduced motion", "prefers-reduced-motion"),
}


def fetch(url: str, timeout: int = 15) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html,application/json"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                return response.read().decode("utf-8", errors="replace")
        except Exception:
            if attempt == 2:
                return ""
            time.sleep(0.5 * (attempt + 1))
    return ""


def clean_markup(value: str) -> str:
    value = re.sub(r"<[^>]+>", " ", value)
    value = html.unescape(value)
    return re.sub(r"\s+", " ", value).strip()


def meta_value(page: str, field: str) -> str:
    patterns = [
        rf'<meta[^>]+(?:name|property)=["\']{re.escape(field)}["\'][^>]+content=["\']([^"\']*)',
        rf'<meta[^>]+content=["\']([^"\']*)["\'][^>]+(?:name|property)=["\']{re.escape(field)}["\']',
    ]
    for pattern in patterns:
        match = re.search(pattern, page, flags=re.I | re.S)
        if match:
            return clean_markup(match.group(1))
    return ""


def page_title(page: str, fallback: str) -> str:
    match = re.search(r"<title[^>]*>(.*?)</title>", page, flags=re.I | re.S)
    return clean_markup(match.group(1)) if match else fallback


def classify(title: str, description: str, body: str = "", basis: str = "개별 페이지의 title·meta·공개 본문") -> tuple[str, str, str, str]:
    haystack = f"{title} {description} {body[:80000]}".lower()
    patterns: list[str] = []
    hits: list[str] = []
    for label, words in GROUPS.items():
        group_hits = [word for word in words if word in haystack]
        if group_hits:
            patterns.append(label)
            hits.extend(group_hits[:4])

    evidence = basis + "에서 확인된 키워드: " + (", ".join(dict.fromkeys(hits)) if hits else "관련 기술 키워드 없음")
    strong = {"공유 원근·깊이", "레이어·마스크", "캐러셀·순환", "모션·전환"}
    if strong.intersection(patterns):
        decision = "채택"
        reason = "건축 개구부의 깊이, 전후 레이어 가림, 3개 템플릿 순환 또는 상태 전환 설계에 직접 적용 가능"
    elif "미니멀·편집" in patterns:
        decision = "보조 채택"
        reason = "깊이 구조의 직접 근거는 약하지만 여백·타이포·정보 위계 참고에 사용"
    else:
        decision = "배제"
        reason = "공개 페이지에서 개구부·레이어·캐러셀·마스크와 직접 연결되는 관찰 근거가 부족"
    return " | ".join(patterns) if patterns else "직접 관련 패턴 미확인", evidence, decision, reason


def collect_awwwards(limit: int = 70) -> list[dict[str, str]]:
    slugs: list[str] = []
    for page_no in range(1, 8):
        url = "https://www.awwwards.com/websites/" if page_no == 1 else f"https://www.awwwards.com/websites/?page={page_no}"
        page = fetch(url)
        for slug in re.findall(r'href=["\'](?:https://www\.awwwards\.com)?(/sites/[^"\'#?]+)', page, flags=re.I):
            if slug not in slugs:
                slugs.append(slug)
        if len(slugs) >= limit:
            break

    def build_row(slug: str) -> dict[str, str]:
        url = urllib.parse.urljoin("https://www.awwwards.com", slug)
        page = fetch(url)
        title = page_title(page, slug.rsplit("/", 1)[-1].replace("-", " ").title())
        description = meta_value(page, "description") or meta_value(page, "og:description")
        pattern, evidence, decision, reason = classify(
            title,
            description,
            basis="Awwwards 개별 사례 페이지의 title·meta description",
        )
        return {
            "source": "Awwwards",
            "domain": "awwwards.com",
            "url": url,
            "title": title,
            "observable_pattern": pattern,
            "evidence": evidence,
            "decision": decision,
            "reason": reason,
            "verification": "개별 사례 페이지 본문 수신 성공" if page else "목록 링크 확인·개별 페이지 수신 실패",
        }

    with ThreadPoolExecutor(max_workers=16) as executor:
        return list(executor.map(build_row, slugs[:limit]))


def collect_codrops(limit: int = 90) -> list[dict[str, str]]:
    items: list[dict[str, str]] = []
    seen: set[str] = set()
    for page_no in range(1, 4):
        endpoint = f"https://tympanus.net/codrops/wp-json/wp/v2/posts?per_page=100&page={page_no}&_fields=link,title,excerpt"
        raw = fetch(endpoint)
        try:
            payload = json.loads(raw)
        except Exception:
            payload = []
        if not isinstance(payload, list):
            continue
        for post in payload:
            url = post.get("link", "")
            if not url or url in seen:
                continue
            seen.add(url)
            title = clean_markup(post.get("title", {}).get("rendered", ""))
            description = clean_markup(post.get("excerpt", {}).get("rendered", ""))
            pattern, evidence, decision, reason = classify(title, description, basis="Codrops 공식 WordPress API 제목·초록")
            score = sum(token in pattern for token in ("깊이", "레이어", "캐러셀", "모션"))
            items.append({
                "source": "Codrops",
                "domain": "tympanus.net",
                "url": url,
                "title": title,
                "observable_pattern": pattern,
                "evidence": evidence,
                "decision": decision,
                "reason": reason,
                "verification": "Codrops 공식 API 항목 확인",
                "_score": str(score),
            })

    for url in SEED_CODROPS:
        if url in seen:
            continue
        page = fetch(url)
        title = page_title(page, url.rstrip("/").rsplit("/", 1)[-1].replace("-", " ").title())
        description = meta_value(page, "description") or meta_value(page, "og:description")
        pattern, evidence, decision, reason = classify(title, description, page)
        items.append({
            "source": "Codrops",
            "domain": "tympanus.net",
            "url": url,
            "title": title,
            "observable_pattern": pattern,
            "evidence": evidence,
            "decision": decision,
            "reason": reason,
            "verification": "개별 문서 페이지 본문 수신 성공" if page else "시드 URL 확인·본문 수신 실패",
            "_score": "9",
        })

    items.sort(key=lambda item: (int(item.get("_score", "0")), item["decision"] == "채택"), reverse=True)
    for item in items:
        item.pop("_score", None)
    return items[:limit]


def main() -> None:
    rows = collect_awwwards(70) + collect_codrops(90)
    unique: list[dict[str, str]] = []
    seen: set[str] = set()
    for row in rows:
        normalized = row["url"].rstrip("/")
        if normalized in seen:
            continue
        seen.add(normalized)
        unique.append(row)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    fields = ["id", "source", "domain", "url", "title", "observable_pattern", "evidence", "decision", "reason", "verification"]
    with OUT.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for index, row in enumerate(unique, start=1):
            writer.writerow({"id": index, **row})
    print(f"wrote {len(unique)} unique sources to {OUT}")


if __name__ == "__main__":
    main()
