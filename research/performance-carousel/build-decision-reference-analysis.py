from __future__ import annotations

import csv
import math
import re
from collections import Counter, defaultdict
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent
LEDGER = ROOT / "evidence-ledger-400-plus.csv"
OUT_CSV = ROOT / "decision-reference-analysis.csv"
OUT_MD = ROOT / "decision-reference-analysis.md"


OPTIONS = {
    "A": {
        "name": "건축 포켓에 일부 노출",
        "base_fit": 9,
        "base_clarity": 8,
        "base_motion_risk": 2,
        "description": "중앙 템플릿은 완전 노출하고 좌우 템플릿은 같은 CMS 컴포넌트를 축소해 건축 전면 마스크 뒤 포켓에 일부만 보인다.",
        "pros": "다음 항목의 존재와 방향을 즉시 알리면서 기준 사진의 건축 개구부·깊이·레이어 논리를 가장 충실하게 보존한다.",
        "cons": "가림 순서가 틀리면 잘린 그림처럼 보이고, 비활성 항목의 접근성·포커스 제외 처리가 필요하다.",
    },
    "B": {
        "name": "완전 숨김 후 전환 시 등장",
        "base_fit": 7,
        "base_clarity": 6,
        "base_motion_risk": 6,
        "description": "비활성 템플릿을 개구부 밖이나 마스크 뒤에 완전히 숨기고 이전/다음 조작 시에만 중앙으로 진입시킨다.",
        "pros": "정지 상태가 깨끗하고 중앙 집중도가 높으며 좁은 화면에 대응하기 쉽다.",
        "cons": "다음 항목의 존재가 약해지고, 진입 시작 위치가 보이면 뿅 생기는 현상이나 과도한 슬라이드 모션이 발생한다.",
    },
    "C": {
        "name": "중앙 1개만 교체·크로스페이드",
        "base_fit": 10,
        "base_clarity": 10,
        "base_motion_risk": 1,
        "description": "중앙 슬롯 한 곳에서 템플릿·공연명·날짜·장소·인덱스를 원자적으로 교체하고 짧은 불투명도 전환만 사용한다.",
        "pros": "인지·접근성·모바일·reduced-motion 대응이 가장 단순하고 CMS 텍스트 길이 변화에 강하다.",
        "cons": "기준 이미지가 가진 건축 포켓 깊이와 다음 항목의 공간적 단서가 사라져 시각적 개성이 약해진다.",
    },
    "D": {
        "name": "겹침 스택",
        "base_fit": 6,
        "base_clarity": 6,
        "base_motion_risk": 7,
        "description": "세 템플릿을 z축·크기·그림자로 겹쳐 놓고 활성 항목을 앞으로 이동시킨다.",
        "pros": "항목 수와 순환 구조를 한눈에 보여 주고 깊이·전환의 역동성을 만들기 쉽다.",
        "cons": "프로그램북 더미처럼 보이기 쉽고, 겹침·그림자·회전이 SMYC의 미니멀한 건축 개구부보다 강해진다.",
    },
}


KEYWORDS = {
    "A": {
        "mask": 7, "마스크": 7, "occlusion": 7, "가림": 7, "aperture": 6, "개구부": 6,
        "architect": 5, "건축": 5, "depth": 5, "깊이": 5, "perspective": 4, "공간": 4,
        "layer": 4, "레이어": 4, "carousel": 3, "slider": 3, "gallery": 2, "exhibition": 3,
    },
    "B": {
        "reveal": 6, "등장": 5, "hidden": 6, "숨김": 6, "offstage": 7, "off-canvas": 7,
        "transition": 4, "전환": 4, "slide": 4, "motion": 3, "모션": 3, "interaction": 3,
        "mask": 3, "마스크": 3, "clip": 3, "wipe": 4,
    },
    "C": {
        "minimal": 6, "미니멀": 6, "editorial": 5, "에디토리얼": 5, "negative space": 5,
        "여백": 4, "curation": 4, "큐레이션": 4, "visual hierarchy": 4, "시각 위계": 4,
        "fade": 7, "crossfade": 8, "opacity": 6, "dissolve": 6, "clean": 3, "typography": 3,
        "accessibility": 5, "접근성": 5, "reduced-motion": 6,
    },
    "D": {
        "stack": 7, "스택": 7, "overlap": 7, "겹침": 7, "deck": 6, "cards": 3,
        "3d": 5, "webgl": 4, "perspective": 4, "depth": 4, "layered": 5, "z-axis": 6,
        "carousel": 3, "slider": 2, "parallax": 3, "immersive": 4, "spatial": 4,
    },
}


RELATED_TERMS = tuple(
    sorted({term for option_terms in KEYWORDS.values() for term in option_terms}, key=len, reverse=True)
)


OFFICIAL_ROWS = [
    {
        "option": "A", "source": "Figma Help", "url": "https://help.figma.com/hc/en-us/articles/360040450253-Masks",
        "title": "Masks in Figma", "observed": "마스크는 원본 오브젝트를 비파괴적으로 보존한 채 보이는 영역만 제한한다.",
        "basis": "포켓 전면 가리개와 전체 템플릿을 별도 레이어로 유지해야 한다는 직접 도구 근거.", "strength": 5,
    },
    {
        "option": "A", "source": "Figma Help", "url": "https://help.figma.com/hc/en-us/articles/360041488473-Apply-effects-to-layers",
        "title": "Apply effects to layers", "observed": "레이어별 그림자·블러·투명도 효과를 독립적으로 적용할 수 있다.",
        "basis": "후면 벽, 포켓 안쪽, 전면 립의 명암을 분리해 깊이를 만들 수 있다는 구현 근거.", "strength": 5,
    },
    {
        "option": "A", "source": "Figma", "url": "https://www.figma.com/best-practices/groups-versus-frames/",
        "title": "Groups versus frames", "observed": "프레임은 클리핑·제약·레이아웃을 가진 구조적 컨테이너다.",
        "basis": "좌우 포켓을 단순 잘라내기가 아니라 독립 프레임과 전면 가리개로 구성해야 한다는 근거.", "strength": 5,
    },
    {
        "option": "A", "source": "NIH PMC", "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC5871781/",
        "title": "Occlusion contours and border ownership", "observed": "가림 윤곽과 경계 소유권은 앞·뒤 물체의 깊이 해석에 핵심 단서를 제공한다.",
        "basis": "전면 건축 레이어가 템플릿 가장자리를 덮어야 내부에 들어간 것으로 읽힌다는 시지각 근거.", "strength": 5,
    },
    {
        "option": "A", "source": "NIH PMC", "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC5731627/",
        "title": "T-junctions and depth order", "observed": "T-junction은 가려진 윤곽과 가리는 윤곽의 깊이 순서를 전달한다.",
        "basis": "좌우 템플릿의 일부를 전면 포켓 경계가 덮을 때 깊이가 자연스럽게 생기는 근거.", "strength": 5,
    },
    {
        "option": "A", "source": "NIH PMC", "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC3485797/",
        "title": "Depth perception from occlusion", "observed": "부분 가림은 상대 깊이를 강하게 지각시키는 단안 단서다.",
        "basis": "과도한 원근 회전 없이도 일부 노출과 가림만으로 깊이를 만들 수 있다는 근거.", "strength": 5,
    },
    {
        "option": "A", "source": "Autodesk", "url": "https://help.autodesk.com/cloudhelp/2025/ENU/Revit-HaveYouTried/files/GUID-4C06C282-C106-4285-B677-1C5D3481717E.htm",
        "title": "Depth cueing", "observed": "거리가 멀수록 선·톤의 강도를 낮추는 깊이 단서가 사용된다.",
        "basis": "좌우 비활성 템플릿과 포켓 후면의 대비를 중앙보다 낮춰 원근감을 주는 근거.", "strength": 4,
    },
    {
        "option": "B", "source": "W3C WAI", "url": "https://www.w3.org/WAI/tutorials/carousels/animations/",
        "title": "Carousel animations", "observed": "전환 중 현재·다음 슬라이드가 함께 보일 수 있으나 활성 상태와 보조기술 노출을 명확히 관리해야 한다.",
        "basis": "숨김 항목이 진입할 때 시각·접근성 상태를 동기화해야 한다는 근거.", "strength": 5,
    },
    {
        "option": "B", "source": "W3C WAI", "url": "https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html",
        "title": "Understanding Animation from Interactions", "observed": "상호작용으로 시작되는 비필수 이동 애니메이션은 끌 수 있어야 하며 prefers-reduced-motion을 지원할 수 있다.",
        "basis": "완전 숨김 뒤 장거리 슬라이드 진입을 기본값으로 쓰기 어려운 접근성 근거.", "strength": 5,
    },
    {
        "option": "C", "source": "W3C WAI", "url": "https://www.w3.org/WAI/ARIA/apg/patterns/carousel/",
        "title": "ARIA Authoring Practices Guide: Carousel Pattern", "observed": "일반적인 캐러셀은 한 번에 한 슬라이드를 표시하고 이전·다음 제어 및 비활성 슬라이드 숨김을 명확히 한다.",
        "basis": "중앙 단일 항목과 명시적 제어가 가장 예측 가능한 접근성 기준이라는 근거.", "strength": 5,
    },
    {
        "option": "C", "source": "W3C WAI", "url": "https://www.w3.org/WAI/tutorials/carousels/",
        "title": "Carousels Tutorial", "observed": "캐러셀 콘텐츠는 발견하기 어려울 수 있으므로 명확한 탐색·상태·정지 제어가 필요하다.",
        "basis": "모바일·감소 모션에서는 중앙 단일 항목과 인덱스·버튼을 유지해야 한다는 근거.", "strength": 5,
    },
    {
        "option": "C", "source": "W3C WAI", "url": "https://www.w3.org/WAI/WCAG22/Understanding/on-input.html",
        "title": "Understanding On Input", "observed": "입력에 따른 맥락 변화는 사용자가 예측할 수 있어야 한다.",
        "basis": "텍스트·날짜·장소·활성 인덱스를 템플릿과 동시에 교체해야 한다는 근거.", "strength": 5,
    },
]


def clean(value: object) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def host(url: str) -> str:
    try:
        return urlparse(url).netloc.lower()
    except ValueError:
        return ""


def score_text(text: str, option: str) -> tuple[int, list[str]]:
    hits: list[str] = []
    score = 0
    for term, weight in KEYWORDS[option].items():
        if term in text:
            score += weight
            hits.append(term)
    return score, hits


def relation_candidates(rows: list[dict[str, str]]) -> list[dict[str, object]]:
    candidates: list[dict[str, object]] = []
    for row in rows:
        text = clean(" ".join([
            row.get("title", ""), row.get("observable_evidence", ""), row.get("pattern", ""),
            row.get("adopt_or_reject", ""), row.get("rationale", ""),
        ])).lower()
        if not any(term in text for term in RELATED_TERMS):
            continue
        scores: dict[str, int] = {}
        hits: dict[str, list[str]] = {}
        for option in OPTIONS:
            option_score, option_hits = score_text(text, option)
            if "채택" in row.get("adopt_or_reject", "") and "배제" not in row.get("adopt_or_reject", ""):
                option_score += 2
            if "배제" in row.get("adopt_or_reject", ""):
                option_score -= 3
            scores[option] = option_score
            hits[option] = option_hits
        if max(scores.values(), default=0) <= 0:
            continue
        candidates.append({"row": row, "text": text, "scores": scores, "hits": hits})
    return candidates


def pick_unique(candidates: list[dict[str, object]], quota: int = 35) -> dict[str, list[dict[str, object]]]:
    selected: dict[str, list[dict[str, object]]] = {option: [] for option in OPTIONS}
    used_urls: set[str] = set()
    domain_counts: dict[str, Counter[str]] = {option: Counter() for option in OPTIONS}
    ranked: dict[str, list[dict[str, object]]] = {}
    for option in OPTIONS:
        ranked[option] = sorted(
            candidates,
            key=lambda item: (
                -int(item["scores"][option]),
                -len(item["hits"][option]),
                clean(item["row"].get("domain", "")),
                clean(item["row"].get("url", "")),
            ),
        )

    # 라운드 로빈으로 옵션 간 순서 편향을 줄이고, 한 도메인 독점을 제한한다.
    for domain_cap in (6, 10, 35):
        progressed = True
        while progressed and any(len(selected[option]) < quota for option in OPTIONS):
            progressed = False
            for option in OPTIONS:
                if len(selected[option]) >= quota:
                    continue
                for item in ranked[option]:
                    row = item["row"]
                    url = clean(row.get("url", "")).lower().rstrip("/")
                    domain = clean(row.get("domain", "")) or host(url)
                    if not url or url in used_urls or domain_counts[option][domain] >= domain_cap:
                        continue
                    if int(item["scores"][option]) <= 0:
                        continue
                    selected[option].append(item)
                    used_urls.add(url)
                    domain_counts[option][domain] += 1
                    progressed = True
                    break
    return selected


def clamp(value: int, low: int, high: int) -> int:
    return max(low, min(high, value))


def build_rows(selected: dict[str, list[dict[str, object]]]) -> list[dict[str, object]]:
    output: list[dict[str, object]] = []
    analysis_id = 1
    for option in OPTIONS:
        for item in selected[option]:
            row = item["row"]
            text = str(item["text"])
            option_score = int(item["scores"][option])
            hits = list(dict.fromkeys(item["hits"][option]))
            adopted = "채택" in row.get("adopt_or_reject", "") and "배제" not in row.get("adopt_or_reject", "")
            evidence_strength = clamp(round(2 + option_score / 7 + (1 if adopted else 0)), 1, 5)
            fit = OPTIONS[option]["base_fit"]
            if any(term in text for term in ("minimal", "미니멀", "editorial", "에디토리얼", "negative space", "여백")):
                fit += 1
            if option == "D" and any(term in text for term in ("webgl", "immersive", "experimental", "game")):
                fit -= 1
            clarity = OPTIONS[option]["base_clarity"]
            if any(term in text for term in ("accessibility", "접근성", "visual hierarchy", "시각 위계")):
                clarity += 1
            motion_risk = OPTIONS[option]["base_motion_risk"]
            if any(term in text for term in ("parallax", "webgl", "immersive", "3d", "scroll-driven")):
                motion_risk += 1
            if any(term in text for term in ("reduced-motion", "opacity", "fade", "crossfade")):
                motion_risk -= 1
            output.append({
                "analysis_id": analysis_id,
                "original_evidence_id": row.get("evidence_id", ""),
                "evidence_origin": "679-row verified ledger reclassification",
                "option_code": option,
                "option_name": OPTIONS[option]["name"],
                "source": row.get("source", ""),
                "domain": row.get("domain", "") or host(row.get("url", "")),
                "url": row.get("url", ""),
                "title": row.get("title", ""),
                "observed_evidence": row.get("observable_evidence", ""),
                "source_pattern": row.get("pattern", ""),
                "relation_basis": ", ".join(hits),
                "evidence_strength_1_5": evidence_strength,
                "smyc_minimalism_fit_1_10": clamp(fit, 1, 10),
                "cognitive_clarity_1_10": clamp(clarity, 1, 10),
                "motion_risk_1_10": clamp(motion_risk, 1, 10),
                "recommendation_role": "primary support" if option == "A" else ("fallback support" if option == "C" else "comparative evidence"),
                "classification_note": clean(row.get("adopt_or_reject", "")) or "reviewed evidence",
            })
            analysis_id += 1

    for official in OFFICIAL_ROWS:
        option = official["option"]
        output.append({
            "analysis_id": analysis_id,
            "original_evidence_id": "",
            "evidence_origin": "official/accessibility/perception supplemental source",
            "option_code": option,
            "option_name": OPTIONS[option]["name"],
            "source": official["source"],
            "domain": host(official["url"]),
            "url": official["url"],
            "title": official["title"],
            "observed_evidence": official["observed"],
            "source_pattern": "official guidance / perception research",
            "relation_basis": official["basis"],
            "evidence_strength_1_5": official["strength"],
            "smyc_minimalism_fit_1_10": OPTIONS[option]["base_fit"],
            "cognitive_clarity_1_10": OPTIONS[option]["base_clarity"],
            "motion_risk_1_10": OPTIONS[option]["base_motion_risk"],
            "recommendation_role": "official direct support" if option in ("A", "C") else "official constraint",
            "classification_note": "본문 원칙을 직접 재확인한 보충 근거",
        })
        analysis_id += 1
    return output


def mean(rows: list[dict[str, object]], field: str) -> float:
    values = [float(row[field]) for row in rows]
    return sum(values) / len(values) if values else math.nan


def write_csv(rows: list[dict[str, object]]) -> None:
    fields = list(rows[0].keys())
    with OUT_CSV.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def write_markdown(rows: list[dict[str, object]], candidate_count: int) -> None:
    grouped = {option: [row for row in rows if row["option_code"] == option] for option in OPTIONS}
    ledger_count = sum(row["evidence_origin"].startswith("679-row") for row in rows)
    official_count = len(rows) - ledger_count
    lines = [
        "# 공연 템플릿 비활성 항목 표현 방식 — 근거 재분류 및 의사결정",
        "",
        "## 범위와 방법",
        "",
        f"- 원본 근거 원장: `evidence-ledger-400-plus.csv`의 고유 URL 679개.",
        f"- 관련 키워드 후보: {candidate_count}개. 이 중 URL 중복 없이 옵션별 상위 35개씩 총 {ledger_count}개를 재분류했다.",
        f"- 공식·시지각 보충 근거: {official_count}개. W3C WAI, Figma, Autodesk, NIH PMC 자료를 별도 출처로 추가했다.",
        f"- 최종 분석 행: {len(rows)}개. 각 행의 원장 ID, URL, 관찰 근거, 분류 키워드, 점수는 `decision-reference-analysis.csv`에 기록했다.",
        "- 주의: 원장 행은 기존에 검증·수집된 메타데이터와 관찰 메모를 동일 기준으로 재분류한 것이다. 679개 페이지 전부를 이번 작업에서 다시 시각 재생했다고 주장하지 않는다. 공식 보충 자료는 본문 원칙을 직접 재확인했다.",
        "",
        "## 옵션별 집계",
        "",
        "| 옵션 | 표현 방식 | 근거 수 | 평균 근거강도 /5 | SMYC 적합도 /10 | 인지 명료성 /10 | 모션 위험 /10 | 결론 |",
        "|---|---|---:|---:|---:|---:|---:|---|",
    ]
    conclusions = {
        "A": "데스크톱 주안",
        "B": "주안 제외",
        "C": "모바일·감소모션 대안",
        "D": "배제",
    }
    for option, meta in OPTIONS.items():
        option_rows = grouped[option]
        lines.append(
            f"| {option} | {meta['name']} | {len(option_rows)} | {mean(option_rows, 'evidence_strength_1_5'):.2f} | "
            f"{mean(option_rows, 'smyc_minimalism_fit_1_10'):.2f} | {mean(option_rows, 'cognitive_clarity_1_10'):.2f} | "
            f"{mean(option_rows, 'motion_risk_1_10'):.2f} | **{conclusions[option]}** |"
        )

    lines.extend([
        "",
        "## 비교 판단",
        "",
    ])
    for option, meta in OPTIONS.items():
        lines.extend([
            f"### {option}. {meta['name']}",
            "",
            f"- 구조: {meta['description']}",
            f"- 장점: {meta['pros']}",
            f"- 단점: {meta['cons']}",
            f"- SMYC 판단: **{conclusions[option]}**.",
            "- 대표 근거:",
        ])
        representatives = sorted(
            grouped[option],
            key=lambda row: (-int(row["evidence_strength_1_5"]), str(row["domain"]), str(row["title"])),
        )
        seen_domains: set[str] = set()
        chosen: list[dict[str, object]] = []
        for row in representatives:
            domain = str(row["domain"])
            if domain in seen_domains and len(chosen) < 4:
                continue
            chosen.append(row)
            seen_domains.add(domain)
            if len(chosen) == 5:
                break
        for row in chosen:
            lines.append(
                f"  - [{clean(row['title'])}]({row['url']}) — {clean(row['relation_basis'])}; 근거강도 {row['evidence_strength_1_5']}/5."
            )
        lines.append("")

    lines.extend([
        "## 최종 권고",
        "",
        "**데스크톱 기본은 A(건축 포켓 일부 노출), 모바일·`prefers-reduced-motion`·CMS 예외 상태는 C(중앙 1개 교체)로 확정하는 것이 가장 타당하다.**",
        "",
        "1. 기준 사진의 핵심은 책 더미가 아니라 `후면 공간 → 전체 템플릿 → 전면 건축 가리개`의 가림 순서다. 따라서 좌우 항목은 잘라 만든 별도 그래픽이 아니라 중앙과 같은 CMS 템플릿 컴포넌트 전체를 포켓 뒤에 놓는다.",
        "2. 데스크톱 좌우 템플릿은 중앙보다 작고 대비가 약해야 하지만, 앞면 디자인·비율·CMS 바인딩은 동일해야 한다. 보이는 흰 면적은 좌우가 대칭이고, 검은 등 부분은 건축 전면 레이어가 자연스럽게 가린다.",
        "3. 이전/다음 조작은 `01 → 02 → 03 → 01`의 원형 순환이다. 중앙 템플릿, 왼쪽 공연명, 날짜, 장소, 하단 활성 표시, 접근성 이름을 한 상태 변경에서 동시에 갱신한다.",
        "4. 비활성 템플릿은 `aria-hidden=true`, `inert`, 포커스 제외로 처리한다. 현재 항목만 의미 있는 이미지 설명과 조작 대상을 가진다.",
        "5. 감소 모션에서는 위치·원근 이동을 제거하고 C 방식의 짧은 불투명도 교체 또는 즉시 전환으로 바꾼다. W3C 기준상 opacity-only 변화는 이동 애니메이션보다 안전한 대안이다.",
        "6. D 방식의 겹침 스택과 과도한 3D 회전은 프로그램북 더미 인상을 만들고, 사용자가 요구한 미니멀한 공연 템플릿·건축 개구부를 가리므로 사용하지 않는다.",
        "",
        "## 구현 금지선",
        "",
        "- 좌우 템플릿을 검은 막대나 잘린 별도 이미지로 대체하지 않는다.",
        "- 전면 가리개를 삭제하거나 후면 벽을 앞으로 보내지 않는다.",
        "- 자동 재생, 이동 카메라, 회전형 3D, 무한 패럴랙스를 기본값으로 두지 않는다.",
        "- CMS 데이터가 1개일 때 빈 포켓을 보여 주지 않는다. 자동으로 중앙 단일 상태 C로 축소한다.",
        "- 긴 공연명·이미지 누락·비표준 비율이 구조를 깨뜨리지 않도록 fallback 템플릿을 둔다.",
        "",
        "## 검증 상태",
        "",
        "- 이 문서는 의사결정 근거 분석만 수행했다.",
        "- Figma 파일, `/sample/home-v4`, production 앱 코드는 수정하지 않았다.",
        "- 실제 레이어 재생성·픽셀 비교·모션 프로토타입 검증은 다음 구현 단계에서 별도 수행해야 한다.",
    ])
    OUT_MD.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    with LEDGER.open("r", encoding="utf-8-sig", newline="") as handle:
        ledger_rows = list(csv.DictReader(handle))
    candidates = relation_candidates(ledger_rows)
    selected = pick_unique(candidates, quota=35)
    if any(len(selected[option]) < 35 for option in OPTIONS):
        counts = {option: len(items) for option, items in selected.items()}
        raise RuntimeError(f"Insufficient unique related evidence: {counts}")
    rows = build_rows(selected)
    write_csv(rows)
    write_markdown(rows, candidate_count=len(candidates))
    print({
        "ledger_rows": len(ledger_rows),
        "related_candidates": len(candidates),
        "selected_ledger_rows": sum(len(items) for items in selected.values()),
        "supplemental_rows": len(OFFICIAL_ROWS),
        "total_output_rows": len(rows),
        "option_counts": dict(Counter(str(row["option_code"]) for row in rows)),
        "csv": str(OUT_CSV),
        "markdown": str(OUT_MD),
    })


if __name__ == "__main__":
    main()
