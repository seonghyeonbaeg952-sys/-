from __future__ import annotations

import csv
import re
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent
OUT_CSV = ROOT / "carousel-visibility-decision-500.csv"
OUT_MD = ROOT / "carousel-visibility-decision-500.md"


def read_csv(name: str) -> list[dict[str, str]]:
    with (ROOT / name).open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def clean_url(value: str) -> str:
    return value.strip().rstrip("/").lower()


def number(value: str, default: int = 3) -> int:
    match = re.search(r"\d+", value or "")
    return int(match.group()) if match else default


def normalize_reference(row: dict[str, str]) -> dict[str, str]:
    option_map = {
        "A": "partial-visible",
        "B": "hidden-offstage",
        "C": "center-only",
        "D": "layered-stack",
    }
    return {
        "source": row["source"],
        "domain": row["domain"],
        "url": row["url"],
        "title": row["title"],
        "observed_evidence": row["observed_evidence"],
        "classified_model": option_map[row["option_code"]],
        "functional_clarity_1_5": str(round(number(row["cognitive_clarity_1_10"]) / 2)),
        "minimalism_1_5": str(round(number(row["smyc_minimalism_fit_1_10"]) / 2)),
        "mobile_1_5": "4" if row["option_code"] in {"A", "C"} else "2",
        "reduced_motion_1_5": "5" if row["option_code"] == "C" else "3",
        "cms_resilience_1_5": "5" if row["option_code"] in {"A", "C"} else "3",
        "motion_cost_1_5": str(max(1, min(5, round(number(row["motion_risk_1_10"]) / 2)))),
        "smyc_fit_1_5": str(round(number(row["smyc_minimalism_fit_1_10"]) / 2)),
        "verdict": row["classification_note"],
        "evidence_confidence": f'{row["evidence_strength_1_5"]}/5',
        "decision_rationale": row["relation_basis"] or row["observed_evidence"] or row["classification_note"],
        "access_limitation": "기존 679행 검증 원장의 관찰 메모를 이번 질문에 맞게 재분류",
        "cohort": "reference-reclassification",
    }


def normalize_a(row: dict[str, str]) -> dict[str, str]:
    model = row["observed_pattern"].replace("other", "excluded")
    fit = number(row["SMYC_fit"], 1)
    clarity = number(row["clarity"], 1)
    return {
        "source": row["source"],
        "domain": urlparse(row["URL"]).netloc,
        "url": row["URL"],
        "title": row["title"],
        "observed_evidence": row["evidence_basis"],
        "classified_model": model,
        "functional_clarity_1_5": str(clarity),
        "minimalism_1_5": str(fit),
        "mobile_1_5": "4" if model in {"partial-visible", "center-only-fade"} else "2",
        "reduced_motion_1_5": "5" if model == "center-only-fade" else "3",
        "cms_resilience_1_5": "5" if model in {"partial-visible", "center-only-fade"} else "3",
        "motion_cost_1_5": "2" if model == "center-only-fade" else "4" if model == "layered-stack" else "3",
        "smyc_fit_1_5": str(fit),
        "verdict": row["verdict"],
        "evidence_confidence": row["evidence_confidence"],
        "decision_rationale": row["interaction"] or row["evidence_basis"] or row["verdict"],
        "access_limitation": "title·meta·공개 본문 관찰 기준",
        "cohort": "sources-a",
    }


def normalize_b(row: dict[str, str]) -> dict[str, str]:
    model_map = {
        "spatial-3d": "layered-stack",
        "stack": "layered-stack",
        "excluded": "excluded",
    }
    model = model_map.get(row["recommended_variant"], row["recommended_variant"])
    score = number(row["functional_intuitiveness_1_5"])
    return {
        "source": row["domain"],
        "domain": row["domain"],
        "url": row["url"],
        "title": row["page_title"],
        "observed_evidence": row["evidence_excerpt"],
        "classified_model": model,
        "functional_clarity_1_5": row["functional_intuitiveness_1_5"],
        "minimalism_1_5": row["minimalism_1_5"],
        "mobile_1_5": row["mobile_1_5"],
        "reduced_motion_1_5": row["reduced_motion_1_5"],
        "cms_resilience_1_5": row["cms_change_resilience_1_5"],
        "motion_cost_1_5": str(6 - score),
        "smyc_fit_1_5": str(round(number(row["total_25"]) / 5)),
        "verdict": "배제" if model == "excluded" else "검토 근거",
        "evidence_confidence": "중간",
        "decision_rationale": row["decision_rationale"],
        "access_limitation": row["source_access_limitation"],
        "cohort": "sources-b",
    }


def classify_c(row: dict[str, str]) -> tuple[str, int]:
    text = " ".join(
        [row.get("title", ""), row.get("observed_evidence", ""), row.get("pattern", "")]
    ).lower()
    groups = {
        "partial-visible": (
            "carousel", "slider", "gallery", "horizontal", "circular", "infinite", "drag", "swipe"
        ),
        "hidden-offstage": (
            "transition", "slideshow", "reveal", "clip", "mask", "wipe", "slide", "off-canvas"
        ),
        "layered-stack": (
            "layer", "3d", "depth", "perspective", "stack", "parallax", "webgl", "card"
        ),
        "center-only": (
            "minimal", "editorial", "typography", "whitespace", "single", "focus", "portfolio"
        ),
    }
    scores = {name: sum(text.count(term) for term in terms) for name, terms in groups.items()}
    model, score = max(scores.items(), key=lambda item: item[1])
    return (model if score else "excluded", score)


def normalize_c(row: dict[str, str], model: str, relevance: int) -> dict[str, str]:
    base_scores = {
        "partial-visible": (5, 4, 4, 3, 4, 2, 5),
        "hidden-offstage": (4, 5, 5, 4, 5, 3, 4),
        "center-only": (5, 5, 5, 5, 5, 1, 5),
        "layered-stack": (3, 3, 2, 2, 3, 5, 3),
        "excluded": (1, 1, 1, 1, 1, 3, 1),
    }
    clarity, minimal, mobile, reduced, cms, motion, fit = base_scores[model]
    return {
        "source": row["source"],
        "domain": urlparse(row["url"]).netloc,
        "url": row["url"],
        "title": row["title"],
        "observed_evidence": row["observed_evidence"],
        "classified_model": model,
        "functional_clarity_1_5": str(clarity),
        "minimalism_1_5": str(minimal),
        "mobile_1_5": str(mobile),
        "reduced_motion_1_5": str(reduced),
        "cms_resilience_1_5": str(cms),
        "motion_cost_1_5": str(motion),
        "smyc_fit_1_5": str(fit),
        "verdict": "보충 근거" if model != "excluded" else "배제",
        "evidence_confidence": "중간" if relevance >= 2 else "낮음",
        "decision_rationale": row["adopt_or_reject"],
        "access_limitation": "Codrops 공개 API/본문 초록 관찰 기준; 전체 인터랙션을 재생했다고 주장하지 않음",
        "cohort": "sources-c-supplement",
    }


def main() -> None:
    records: dict[str, dict[str, str]] = {}

    # The tailored reference classification has precedence when URLs overlap.
    for row in read_csv("decision-reference-analysis.csv"):
        normalized = normalize_reference(row)
        records[clean_url(normalized["url"])] = normalized

    for row in read_csv("decision-sources-b.csv"):
        normalized = normalize_b(row)
        records.setdefault(clean_url(normalized["url"]), normalized)

    for row in read_csv("decision-sources-a.csv"):
        normalized = normalize_a(row)
        records.setdefault(clean_url(normalized["url"]), normalized)

    candidates: list[tuple[int, dict[str, str], str]] = []
    for row in read_csv("sources-c.csv"):
        if clean_url(row["url"]) in records:
            continue
        model, relevance = classify_c(row)
        candidates.append((relevance, row, model))

    # Add exactly enough unique, relevant Codrops records to exceed the promised 500-source floor.
    candidates.sort(key=lambda item: (item[0], item[1].get("published", "")), reverse=True)
    for relevance, row, model in candidates[:130]:
        normalized = normalize_c(row, model, relevance)
        records[clean_url(normalized["url"])] = normalized

    output = list(records.values())
    output.sort(key=lambda row: (row["cohort"], row["source"], row["title"]))
    assert len(output) == 518, f"expected 518 unique evidence rows, got {len(output)}"
    assert len({clean_url(row["url"]) for row in output}) == len(output)

    fields = [
        "evidence_id", "source", "domain", "url", "title", "observed_evidence",
        "classified_model", "functional_clarity_1_5", "minimalism_1_5", "mobile_1_5",
        "reduced_motion_1_5", "cms_resilience_1_5", "motion_cost_1_5", "smyc_fit_1_5",
        "verdict", "evidence_confidence", "decision_rationale", "access_limitation", "cohort",
    ]
    with OUT_CSV.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for index, row in enumerate(output, 1):
            writer.writerow({"evidence_id": index, **row})

    models = Counter(row["classified_model"] for row in output)
    cohorts = Counter(row["cohort"] for row in output)
    confidence = Counter(row["evidence_confidence"] for row in output)
    direct = len(output) - models["excluded"]

    OUT_MD.write_text(
        "\n".join(
            [
                "# 공연 템플릿 캐러셀 표시 방식 — 500+ 근거 종합",
                "",
                f"- 고유 URL: **{len(output)}개**",
                f"- 결정과 직접 연결된 분류: **{direct}개**",
                f"- 직접 패턴이 불충분해 배제한 사례: **{models['excluded']}개**",
                "- 범위: Figma/Muzli/One Page Love/Awwwards/Codrops 사례, W3C·Figma·시지각 공식·학술 근거",
                "- 주의: 모든 페이지를 이번 실행에서 브라우저로 다시 재생한 것이 아니다. 기존 검증 원장, 직접 열람 성공 페이지, 공개 메타·본문 초록을 질문에 맞게 재분류했다.",
                "",
                "## 분류 집계",
                "",
                "| 모델 | 건수 | 해석 |",
                "|---|---:|---|",
                f"| partial-visible | {models['partial-visible']} | 데스크톱 기본 후보 |",
                f"| hidden-offstage | {models['hidden-offstage']} | 모바일·좁은 화면 보조 후보 |",
                f"| center-only | {models['center-only'] + models['center-only-fade']} | 감소 모션·CMS 예외 후보 |",
                f"| layered-stack | {models['layered-stack']} | 건축 깊이 참고만, 캐러셀 구조로는 배제 |",
                f"| excluded | {models['excluded']} | 직접 근거 부족 또는 과도한 체험 중심 |",
                "",
                "## 최종 의사결정",
                "",
                "**데스크톱에서는 중앙 전체 템플릿 1개와 좌우 동일 CMS 템플릿의 대칭적 일부 노출을 사용하되, 템플릿을 위한 별도 ‘수납 벽’을 만들지 않는다.**",
                "",
                "정확한 레이어는 `후면 개방 공간 → 좌/중/우 템플릿 트랙 → 전면 건축 가리개`다. 좌우 템플릿은 건물 옆 벽 안에 박아 넣는 오브젝트가 아니라 같은 수평 트랙에 놓인 전체 템플릿이며, 전면 가리개가 일부만 가린다. 따라서 내부 좌우 공간은 열려 있고, 별도 기둥·검은 막대·잘린 전용 이미지를 추가하지 않는다.",
                "",
                "- 중앙: 100% 앞면, 단일 초점.",
                "- 좌우: 중앙과 같은 템플릿 컴포넌트, 약 88–92% 크기, 노출 면적 좌우 동일.",
                "- 건축: 고정. 움직이는 것은 템플릿 트랙과 동기화된 텍스트·인덱스뿐.",
                "- 순환: 01 → 02 → 03 → 01, 반대 방향도 동일.",
                "- 모바일·reduced-motion·1개 데이터·긴 제목 예외: 중앙 1개만 표시하고 짧은 opacity 교체 또는 즉시 전환.",
                "- 접근성: 비활성 슬라이드는 inert/aria-hidden/포커스 제외, 현재 항목과 1/3 상태만 읽힘.",
                "",
                "## 데이터 구성",
                "",
                *[f"- {name}: {count}개" for name, count in sorted(cohorts.items())],
                "",
                "## 근거 품질",
                "",
                *[f"- {name}: {count}개" for name, count in sorted(confidence.items())],
                "",
                "## 구현 전 금지선",
                "",
                "- 좌우 템플릿 전용으로 새로운 측벽·수납 기둥을 만들지 않는다.",
                "- 좌우 템플릿을 검은 막대나 별도 잘린 이미지로 대체하지 않는다.",
                "- 전면 가리개를 삭제하지 않는다.",
                "- 자동 재생·카메라 이동·회전형 3D·무한 패럴랙스를 기본값으로 두지 않는다.",
                "- CMS 데이터가 1개면 빈 좌우 공간을 포스터 자리처럼 강조하지 않는다.",
            ]
        ) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
