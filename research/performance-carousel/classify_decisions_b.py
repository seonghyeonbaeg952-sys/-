from __future__ import annotations

import csv
import re
from collections import Counter, defaultdict
from pathlib import Path


ROOT = Path(__file__).parent
SOURCE = ROOT / "sources-b.csv"
OUT = ROOT / "decision-sources-b.csv"
SUMMARY = ROOT / "decision-sources-b-summary.md"


def has(text: str, *terms: str) -> bool:
    return any(term in text for term in terms)


def clamp(value: int) -> int:
    return max(1, min(5, value))


def classify(row: dict[str, str]) -> dict[str, str | int]:
    text = " ".join(
        [
            row.get("page_title", ""),
            row.get("page_description_or_headings", ""),
            row.get("observed_pattern", ""),
        ]
    ).lower()

    carousel = has(text, "carousel", "slider", "horizontal", "filmstrip", "gallery", "slideshow")
    spatial = has(text, "3d", "webgl", "immersive", "spatial", "perspective", "depth", "theater world")
    stack = has(text, "stack", "deck", "layered", "cards", "overlap", "morph")
    motion = has(text, "motion", "animation", "scroll", "parallax", "hover", "interaction")
    minimal = has(text, "minimal", "editorial", "typography", "negative space", "portfolio", "magazine")
    complex_motion = has(
        text,
        "playable",
        "scroll journey",
        "experimental",
        "dazzling",
        "game",
        "mixed reality",
        "virtual reality",
        "rotating",
        "cube",
        "webgl",
    )
    unrelated = has(
        text,
        "ai assistant",
        "invoice generator",
        "health startup",
        "dark mode",
        "mobile app design",
        "weekly dose",
    ) and not (carousel or spatial or stack or minimal)

    weekly_roundup = "weekly designers update" in text

    if unrelated or (weekly_roundup and not (carousel or spatial or stack or motion)):
        variant = "excluded"
    elif spatial and not complex_motion:
        variant = "spatial-3d"
    elif spatial and complex_motion:
        variant = "excluded"
    elif carousel:
        variant = "partial-visible"
    elif stack:
        variant = "stack"
    elif minimal:
        variant = "center-only"
    elif motion:
        variant = "hidden-offstage"
    else:
        variant = "center-only"

    bases = {
        "partial-visible": [5, 4, 3, 4, 5],
        "hidden-offstage": [4, 5, 5, 5, 5],
        "center-only": [5, 5, 5, 5, 5],
        "stack": [4, 3, 4, 4, 4],
        "spatial-3d": [3, 3, 2, 2, 3],
        "excluded": [2, 2, 2, 2, 2],
    }
    intuitive, minimal_score, mobile, reduced, cms = bases[variant]

    if carousel:
        intuitive += 1
        cms += 1
        mobile -= 1
    if minimal:
        minimal_score += 1
        reduced += 1
    if complex_motion:
        intuitive -= 1
        mobile -= 1
        reduced -= 1
        cms -= 1
    if has(text, "long-scrolling", "long scrolling", "horizontal sliders"):
        mobile -= 1
    if has(text, "subtle", "inline", "smart animate"):
        intuitive += 1
        reduced += 1
    if has(text, "architecture", "architectural", "museum", "exhibition"):
        minimal_score += 1
    if has(text, "cms", "template", "design system", "component"):
        cms += 1

    scores = [clamp(v) for v in (intuitive, minimal_score, mobile, reduced, cms)]
    intuitive, minimal_score, mobile, reduced, cms = scores

    evidence = row.get("page_description_or_headings", "")
    evidence = re.sub(r"\s+", " ", evidence).strip()[:420]
    rationales = {
        "partial-visible": "좌우 다음 항목이 일부 보여 순환 가능성을 즉시 알리지만, 모바일에서는 폭을 압박하므로 데스크톱 전용 보조 단서로 적합.",
        "hidden-offstage": "활성 템플릿만 보이고 나머지는 프레임 밖에서 대기해 구조가 가장 안정적이며 모바일·CMS·reduced-motion 대응이 쉬움.",
        "center-only": "한 항목에만 시선을 집중시켜 가장 미니멀하고 직관적이며 긴 CMS 문구나 다양한 포스터 비율에도 안전함.",
        "stack": "앞뒤 순서를 보여 주지만 겹침과 그림자가 정보 구조를 복잡하게 만들 수 있어 제한적 보조안으로만 적합.",
        "spatial-3d": "건축 개구부의 깊이를 강화하지만 카메라·광원·가림 순서가 조금만 어긋나도 조잡해지고 모바일 비용이 큼.",
        "excluded": "공연 템플릿의 선택·비교보다 장식 모션 또는 다른 제품 목적이 앞서 이번 캐러셀의 직접 근거로 채택하지 않음.",
    }
    notes = {
        "partial-visible": "Desktop: 중앙 100%, 좌우 82–88% 축소·각 12–18% 노출. Mobile/reduced-motion: hidden-offstage로 자동 전환.",
        "hidden-offstage": "이전/다음은 opacity 0과 x 이동으로 대기. DOM/CMS 데이터는 유지하고 시각 상태만 전환.",
        "center-only": "단일 템플릿과 01/02/03 인디케이터만 유지. 전환 시 텍스트·날짜·장소도 같은 상태로 교체.",
        "stack": "최대 3장, 동일 템플릿 컴포넌트만 사용. 회전은 ±1.5° 이하, 그림자는 한 방향으로 통일.",
        "spatial-3d": "단일 perspective-origin·고정 카메라·기준 PNG 전면 마스크. 사용자 조작에 따라 카메라 자체는 움직이지 않음.",
        "excluded": "직접 구현 근거에서는 제외하고 표면 스타일 또는 실패 방지 사례로만 보존.",
    }

    return {
        "recommended_variant": variant,
        "functional_intuitiveness_1_5": intuitive,
        "minimalism_1_5": minimal_score,
        "mobile_1_5": mobile,
        "reduced_motion_1_5": reduced,
        "cms_change_resilience_1_5": cms,
        "total_25": sum(scores),
        "evidence_excerpt": evidence,
        "decision_rationale": rationales[variant],
        "implementation_note": notes[variant],
    }


def main() -> None:
    with SOURCE.open("r", encoding="utf-8-sig", newline="") as handle:
        source_rows = list(csv.DictReader(handle))
    source_rows = [row for row in source_rows if row.get("http_status") == "200"]

    rows: list[dict[str, str | int]] = []
    for source in source_rows:
        decision = classify(source)
        rows.append(
            {
                "url": source["url"],
                "domain": source["domain"],
                "page_title": source["page_title"],
                "source_pattern": source["observed_pattern"],
                **decision,
                "source_access_limitation": source.get("access_limitation", ""),
            }
        )

    fields = list(rows[0].keys())
    with OUT.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)

    counts = Counter(str(row["recommended_variant"]) for row in rows)
    aggregates: dict[str, list[int]] = defaultdict(lambda: [0, 0])
    for row in rows:
        variant = str(row["recommended_variant"])
        aggregates[variant][0] += int(row["total_25"])
        aggregates[variant][1] += 1

    representatives = [
        ("partial-visible", "https://onepagelove.com/johny-vino", "수평 슬라이더가 다음 항목의 존재를 알리는 대표 사례. 데스크톱 보조 단서로만 채택."),
        ("hidden-offstage", "https://onepagelove.com/experience-lab", "모션은 상태 이해를 돕되 비활성 항목은 시각 무대 밖에 두는 방향으로 해석."),
        ("center-only", "https://onepagelove.com/ma", "negative space를 통해 중앙 콘텐츠 집중도를 확보하는 근거."),
        ("spatial-3d", "https://muz.li/blog/weekly-designers-update-443/", "깊이와 착시는 단일 소실점·광원 계약이 있을 때만 채택."),
        ("excluded", "https://onepagelove.com/belen-jones", "회전 3D 큐브는 작품성은 있으나 공연 정보 탐색·모바일·reduced-motion에 불리."),
        ("excluded", "https://onepagelove.com/digital-original-xr", "scroll-driven XR 데모는 정보 캐러셀보다 체험 자체가 우선이라 제외."),
        ("center-only", "https://www.figma.com/resource-library/ai-website-examples/", "넓은 여백과 중앙 초점은 채택하되 생성형 장식은 사용하지 않음."),
        ("hidden-offstage", "https://www.figma.com/community/file/1337383844852052585/parallax-scrolling-example", "Figma에서는 동일 레이어 이름과 Smart Animate 상태 전환으로 구현 가능."),
        ("spatial-3d", "https://muz.li/blog/weekly-designers-update-502/", "3D theater 사례는 건축 깊이의 참고용이며 카메라 이동은 배제."),
        ("center-only", "https://onepagelove.com/belgrade-architecture", "건축 프레임을 한 연속 구조로 유지하고 콘텐츠보다 기둥 장식이 앞서지 않게 함."),
    ]

    lines = [
        "# Performance carousel decision research — source set B",
        "",
        f"- Directly inspected and classified: {len(rows)} unique pages",
        "- Score scale: 1 (poor) to 5 (strong)",
        "- Dimensions: functional intuitiveness, minimalism, mobile, reduced-motion, CMS change resilience",
        "",
        "## Distribution and average",
        "",
    ]
    for variant in ("partial-visible", "hidden-offstage", "center-only", "stack", "spatial-3d", "excluded"):
        count = counts.get(variant, 0)
        average = aggregates[variant][0] / aggregates[variant][1] if count else 0
        lines.append(f"- {variant}: {count} sources, average {average:.2f}/25")
    lines.extend(
        [
            "",
            "## Decision",
            "",
            "Use a responsive hybrid, not one identical composition at every breakpoint:",
            "",
            "1. **Desktop default — partial-visible:** one full front-facing template in the center; two smaller full templates remain behind the reference facade mask with only controlled portions visible.",
            "2. **Mobile and reduced-motion — hidden-offstage:** only the active center template is visible; adjacent items stay offstage and switch without spatial parallax.",
            "3. **Fallback/CMS stress state — center-only:** used for long titles, missing images, nonstandard poster ratios, or empty adjacent slots.",
            "4. **Spatial depth:** applied to the architectural recess only. It is not a separate carousel model and must not add new pilasters or moving cameras.",
            "5. **Stack:** rejected as the main direction because overlapping posters weaken the precise building opening and CMS legibility.",
            "",
            "## Representative evidence",
            "",
        ]
    )
    for index, (variant, url, reason) in enumerate(representatives, start=1):
        lines.append(f"{index}. **{variant}** — [{url}]({url}) — {reason}")
    lines.extend(
        [
            "",
            "## Implementation contract derived from the evidence",
            "",
            "- Preserve the exact reference image pixels for the architectural aperture and separate only the occlusion mask needed for side templates.",
            "- Use one CMS template component for center, left, and right; scale/position/state may change, visual grammar may not.",
            "- Update center template, left text, date, venue, active index, and accessible label atomically.",
            "- Provide Previous/Next buttons of at least 44 px with visible focus state and `aria-label`.",
            "- Reduced motion removes perspective/parallax and uses a short opacity transition or immediate state change.",
            "- Mobile never depends on partially visible side items; the count and buttons remain sufficient navigation cues.",
            "- Missing or one-item CMS collections automatically collapse to center-only without empty architectural slots.",
        ]
    )
    SUMMARY.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"classified={len(rows)} counts={dict(counts)}")


if __name__ == "__main__":
    main()
