from __future__ import annotations

import csv
from collections import Counter, defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "sources-a.csv"
OUTPUT = ROOT / "decision-sources-a.csv"
SUMMARY = ROOT / "decision-sources-a-summary.md"


PATTERNS = {
    "partial-visible": (
        "carousel", "slider", "horizontal", "parallax", "infinite", "circular", "wavy", "gallery", "scroll gallery",
    ),
    "hidden-offstage": (
        "slideshow", "page transition", "flip transition", "mask", "clip", "aperture", "off-canvas", "offstage",
    ),
    "center-only-fade": (
        "fade", "crossfade", "dissolve", "opacity", "blur", "shader", "reveal transition",
    ),
    "layered-stack": (
        "layered", "layer", "stack", "3d", "depth", "perspective", "cube", "tube", "projection", "spatial", "immersive",
    ),
}


PROFILE = {
    "partial-visible": {
        "interaction": "중앙 활성 템플릿은 완전 노출하고 좌우 비활성 템플릿의 일부를 남겨 다음·이전 방향을 예고",
        "clarity": "4/5",
        "motion_cost": "중간 — 3개 항목의 위치·스케일·가림 상태를 동기화해야 함",
        "accessibility_risk": "중간 — 비활성 복제본을 inert/aria-hidden 처리하고 중앙 항목만 포커스 가능해야 함",
        "SMYC_fit": "5/5",
        "verdict": "채택",
    },
    "hidden-offstage": {
        "interaction": "활성 템플릿 외 항목은 개구부 밖 또는 마스크 뒤에 완전히 숨기고 전환 시에만 진입",
        "clarity": "4/5",
        "motion_cost": "중간 — 오프스테이지 위치와 마스크 경계의 동기화 필요",
        "accessibility_risk": "중간 — 숨은 항목의 포커스·읽기 순서를 명시적으로 제거해야 함",
        "SMYC_fit": "2/5",
        "verdict": "조건부 배제",
    },
    "center-only-fade": {
        "interaction": "중앙 프레임 한 곳에서 콘텐츠를 교체하며 비활성 항목은 opacity로 제거",
        "clarity": "5/5",
        "motion_cost": "낮음 — opacity와 짧은 위치 보정만 필요",
        "accessibility_risk": "낮음 — DOM 활성 상태와 aria-live만 정리하면 됨",
        "SMYC_fit": "3/5",
        "verdict": "보조안",
    },
    "layered-stack": {
        "interaction": "템플릿을 Z축·크기·그림자로 중첩하고 중앙 항목을 전면으로 승격",
        "clarity": "3/5",
        "motion_cost": "높음 — 공유 원근, Z순서, 그림자, 전면 가리개를 함께 보간해야 함",
        "accessibility_risk": "높음 — 겹친 비활성 항목이 시각·키보드 순서를 혼란시킬 수 있음",
        "SMYC_fit": "4/5",
        "verdict": "조건부 채택",
    },
    "other": {
        "interaction": "공개 근거에서 비활성 캐러셀 항목의 노출 방식을 확정할 수 없음",
        "clarity": "1/5",
        "motion_cost": "판단 불가",
        "accessibility_risk": "판단 불가",
        "SMYC_fit": "1/5",
        "verdict": "배제",
    },
}


def classify(row: dict[str, str]) -> tuple[str, str, list[str]]:
    title = row.get("title", "")
    text = " ".join((title, row.get("observable_pattern", ""), row.get("evidence", ""))).lower()
    title_lower = title.lower()

    direct_hits: dict[str, list[str]] = {
        key: [token for token in tokens if token in title_lower]
        for key, tokens in PATTERNS.items()
    }
    indirect_hits: dict[str, list[str]] = {
        key: [token for token in tokens if token in text]
        for key, tokens in PATTERNS.items()
    }

    # 제목에 노출 방식이 직접 나타나는 경우를 최우선으로 사용한다.
    if direct_hits["center-only-fade"]:
        return "center-only-fade", "높음", direct_hits["center-only-fade"]
    if direct_hits["hidden-offstage"]:
        return "hidden-offstage", "높음", direct_hits["hidden-offstage"]
    if direct_hits["partial-visible"]:
        return "partial-visible", "높음", direct_hits["partial-visible"]
    if direct_hits["layered-stack"]:
        return "layered-stack", "높음", direct_hits["layered-stack"]

    # Awwwards 메타나 Codrops 초록에만 단서가 있는 경우는 중간 신뢰도로 제한한다.
    if row.get("decision") == "배제":
        return "other", "낮음", []
    if indirect_hits["center-only-fade"]:
        return "center-only-fade", "중간", indirect_hits["center-only-fade"]
    if indirect_hits["hidden-offstage"]:
        return "hidden-offstage", "중간", indirect_hits["hidden-offstage"]
    if indirect_hits["partial-visible"]:
        return "partial-visible", "중간", indirect_hits["partial-visible"]
    if indirect_hits["layered-stack"]:
        return "layered-stack", "중간", indirect_hits["layered-stack"]
    return "other", "낮음", []


def main() -> None:
    with SOURCE.open("r", encoding="utf-8-sig", newline="") as handle:
        sources = list(csv.DictReader(handle))

    results: list[dict[str, str]] = []
    for row in sources:
        pattern, confidence, hits = classify(row)
        profile = PROFILE[pattern]
        results.append({
            "id": row["id"],
            "source": row["source"],
            "title": row["title"],
            "URL": row["url"],
            "observed_pattern": pattern,
            "interaction": profile["interaction"],
            "clarity": profile["clarity"],
            "motion_cost": profile["motion_cost"],
            "accessibility_risk": profile["accessibility_risk"],
            "SMYC_fit": profile["SMYC_fit"],
            "verdict": profile["verdict"],
            "evidence_confidence": confidence,
            "evidence_terms": ", ".join(dict.fromkeys(hits)) if hits else "직접 단서 없음",
            "evidence_basis": row["evidence"],
        })

    fields = list(results[0].keys())
    with OUTPUT.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(results)

    pattern_counts = Counter(row["observed_pattern"] for row in results)
    verdict_counts = Counter(row["verdict"] for row in results)
    confidence_counts = Counter(row["evidence_confidence"] for row in results)
    representatives: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in results:
        if len(representatives[row["observed_pattern"]]) >= 4:
            continue
        if row["evidence_confidence"] == "높음" or row["observed_pattern"] == "other":
            representatives[row["observed_pattern"]].append(row)

    lines = [
        "# 공연 템플릿 캐러셀 비활성 항목 표현 방식 재분류",
        "",
        f"- 분석 행: **{len(results)}개** (고유 URL {len({row['URL'] for row in results})}개)",
        "- 입력 원장: `sources-a.csv`의 Awwwards 개별 사례 70개 + Codrops 문서·사례 90개",
        "- 분류 방식: 공개 페이지 제목, 메타 설명, Codrops 공식 API 초록에 나타난 직접 단어를 우선하고, 근거가 부족한 항목은 `other`로 배제",
        "- 주의: 이 원장은 대량 근거 분류이며, 모든 외부 라이브 사이트를 동일 브라우저에서 조작한 사용성 시험으로 과장하지 않습니다.",
        "",
        "## 패턴 집계",
        "",
        "| 패턴 | 수 | SMYC 판단 |",
        "|---|---:|---|",
    ]
    for pattern in ("partial-visible", "hidden-offstage", "center-only-fade", "layered-stack", "other"):
        lines.append(f"| {pattern} | {pattern_counts[pattern]} | {PROFILE[pattern]['verdict']} · 적합도 {PROFILE[pattern]['SMYC_fit']} |")

    lines.extend(["", "## 판정 및 근거 신뢰도", "", "### 판정"])
    for key, value in verdict_counts.most_common():
        lines.append(f"- {key}: {value}개")
    lines.append("")
    lines.append("### 근거 신뢰도")
    for key, value in confidence_counts.most_common():
        lines.append(f"- {key}: {value}개")

    lines.extend([
        "",
        "## SMYC 최종 선택",
        "",
        "**`partial-visible`을 기본으로 채택하고 `layered-stack`은 건축 깊이 표현에만 제한적으로 결합합니다.**",
        "",
        "- 중앙 템플릿 1개는 완전한 앞면으로 표시합니다.",
        "- 좌우 템플릿은 같은 CMS 템플릿 컴포넌트를 사용하되, 전면 파사드 마스크 뒤에서 동일 면적만 보이게 합니다.",
        "- 좌우 항목은 약 88~92% 스케일과 약한 명암만 적용해 깊이를 주고, 과도한 회전·3D 왜곡은 사용하지 않습니다.",
        "- 자동 회전은 사용하지 않고, 이전/다음 버튼과 현재 `1 / 3` 상태를 항상 표시합니다.",
        "- 비활성 항목은 `inert`, `aria-hidden=true`, 포커스 제외; 중앙 항목과 외부 설명만 접근성 트리에 남깁니다.",
        "- `prefers-reduced-motion: reduce`에서는 이동 대신 짧은 상태 교체 또는 무전환으로 축소합니다.",
        "",
        "부분 노출은 다음 콘텐츠가 있다는 정보 냄새를 제공하면서도, 기준 이미지가 요구하는 ‘건축물 내부 양측 공간’과 ‘전면 가리개 뒤 템플릿’ 구조를 그대로 설명할 수 있습니다. 다만 자동 전환이나 여러 겹의 Z축 중첩은 가독성과 키보드 순서를 해치므로 배제합니다.",
        "",
        "## 접근성·모션 판단 기준",
        "",
        "- [W3C WAI Carousels Tutorial](https://www.w3.org/WAI/tutorials/carousels/): 이동을 멈출 수 있어야 하고, 키보드 조작과 명확한 컨트롤이 필요합니다.",
        "- [W3C Design System content slider](https://design-system.w3.org/components/slider.html): 한 번에 한 활성 슬라이드와 명시적 컨트롤을 기본 구조로 사용합니다.",
        "- [MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion): 운영체제 모션 감소 설정에 맞춘 대체 전환이 필요합니다.",
        "- [WebAIM Animation and Carousels](https://webaim.org/techniques/carousels/): 캐러셀은 접근성 장벽이 될 수 있으므로 재생·정지와 이전·다음 제어가 핵심입니다.",
        "- [Smashing Magazine carousel UX](https://www.smashingmagazine.com/2022/04/designing-better-carousel-ux/): 마지막 항목 일부 노출이나 페이드 같은 단서가 추가 콘텐츠의 발견 가능성을 높입니다.",
        "",
        "## 대표 사례",
        "",
    ])

    for pattern in ("partial-visible", "hidden-offstage", "center-only-fade", "layered-stack", "other"):
        lines.append(f"### {pattern}")
        chosen = representatives.get(pattern, [])
        if not chosen:
            lines.append("- 높은 신뢰도의 직접 제목 근거 없음; 원장에서는 중간 또는 낮은 신뢰도로만 분류")
        else:
            for row in chosen:
                lines.append(
                    f"- [{row['title']}]({row['URL']}) — 단서: `{row['evidence_terms']}`; 판정: {row['verdict']}"
                )
        lines.append("")

    SUMMARY.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {len(results)} rows to {OUTPUT}")
    print("patterns:", dict(pattern_counts))
    print("verdicts:", dict(verdict_counts))


if __name__ == "__main__":
    main()
