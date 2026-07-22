import { useEffect, useState } from "react";

const voices = ["SOPRANO", "ALTO", "TENOR", "BASS"];
const FLUTTER_PAGE_COUNT = 12;

function clamp(value) {
  return Math.min(1, Math.max(0, value));
}

function smoothstep(edgeStart, edgeEnd, value) {
  const progress = clamp((value - edgeStart) / (edgeEnd - edgeStart));
  return progress * progress * (3 - 2 * progress);
}

function easeInOut(value) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function easeOutBack(value) {
  const overshoot = 1.22;
  const shifted = value - 1;
  return 1 + (overshoot + 1) * Math.pow(shifted, 3) + overshoot * Math.pow(shifted, 2);
}

function getFlutterPageStyle(progress, index) {
  const start = 0.19 + index * 0.036;
  const end = start + 0.29;
  const localRaw = clamp((progress - start) / (end - start));
  const local = easeInOut(localRaw);
  const arc = Math.sin(localRaw * Math.PI);
  const near = progress > start - 0.025 && progress < end + 0.055;
  const fade = 1 - smoothstep(0.72, 0.86, progress);

  return {
    "--page-paper": index % 2 === 0 ? "#fffdf9" : "#fbf3e9",
    filter: `drop-shadow(${(arc * 13).toFixed(2)}px 16px 24px rgb(53 21 42 / ${(0.08 + arc * 0.18).toFixed(3)}))`,
    opacity: near ? fade : 0,
    transform: `rotateY(${(-179 * local).toFixed(2)}deg) translateZ(${(24 + arc * 48).toFixed(2)}px) rotateZ(${(arc * -1.6).toFixed(2)}deg)`,
    zIndex: progress < start ? 18 + FLUTTER_PAGE_COUNT - index : 34 + index,
  };
}

function useScoreTimeline(runKey) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const fixedProgressParam = new URLSearchParams(window.location.search).get("progress");
    const fixedProgress = fixedProgressParam === null ? Number.NaN : Number(fixedProgressParam);

    if (Number.isFinite(fixedProgress)) {
      setProgress(clamp(fixedProgress));
      return undefined;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setProgress(1);
      return undefined;
    }

    let frame = 0;
    const duration = 3200;
    const startedAt = performance.now();

    const animate = (frameTime) => {
      const timelineProgress = clamp((frameTime - startedAt) / duration);
      setProgress(easeInOut(timelineProgress));

      if (timelineProgress < 1) {
        frame = window.requestAnimationFrame(animate);
      }
    };

    setProgress(0);
    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [runKey]);

  return progress;
}

function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <a className="brand" href="#score-stage" aria-label="서울모테트청소년합창단 홈">
          <img src="/assets/smyc-logo-transparent.png" alt="서울모테트청소년합창단" />
        </a>
        <nav className="desktop-nav" aria-label="주요 메뉴">
          <a className="is-active" href="#score-stage">홈</a>
          <a href="#score-stage">합창단 정신</a>
          <a href="#score-stage">합창단 소개</a>
          <a href="#score-stage">공연·소식</a>
          <a href="#score-stage">갤러리</a>
          <a href="#score-stage">입단 안내</a>
          <a href="#score-stage">후원·문의</a>
        </nav>
        <a className="join-link" href="#score-stage">입단 안내</a>
        <a className="mobile-menu" href="#score-stage">메뉴</a>
      </div>
    </header>
  );
}

function OpeningBook({ progress }) {
  return (
    <div className="opening-book" aria-hidden="true">
      <div className="opening-book__spread">
        <div className="opening-book__paper opening-book__paper--left">
          <span>VOICE</span>
          <strong>S · A</strong>
        </div>
        <div className="opening-book__paper opening-book__paper--right">
          <span>VOICE</span>
          <strong>T · B</strong>
        </div>
      </div>
      <span className="opening-book__crease" />
      <div className="opening-book__cover">
        <div>
          <p>SMYC SCORE</p>
          <strong>함께 부르는<br />우리의 노래</strong>
          <small>SEOUL MOTET YOUTH CHOIR</small>
        </div>
      </div>
      {Array.from({ length: FLUTTER_PAGE_COUNT }, (_, pageIndex) => (
        <span
          className="turning-page"
          key={pageIndex}
          style={getFlutterPageStyle(progress, pageIndex)}
        >
          <span className="turning-page__face turning-page__face--front">
            <img src="/assets/wide-m-staff-transparent.png" alt="" />
          </span>
          <span className="turning-page__face turning-page__face--back">
            <img src="/assets/wide-m-staff-transparent.png" alt="" />
          </span>
        </span>
      ))}
    </div>
  );
}

function ScoreStage({ animationKey, onReplay, onAction }) {
  const progress = useScoreTimeline(animationKey);
  const bookOpen = smoothstep(0.02, 0.3, progress);
  const paperReveal = smoothstep(0.7, 0.88, progress);
  const headlineReveal = smoothstep(0.79, 0.91, progress);
  const legendReveal = smoothstep(0.84, 0.94, progress);
  const staffReveal = smoothstep(0.82, 0.955, progress);
  const summaryReveal = smoothstep(0.91, 0.975, progress);
  const actionsReveal = smoothstep(0.945, 0.995, progress);
  const periodReveal = smoothstep(0.92, 0.985, progress);
  const headlineBack = easeOutBack(headlineReveal);
  const actionsReady = actionsReveal > 0.9;
  const scoreStyle = {
    "--book-open": bookOpen.toFixed(4),
    "--book-fade": (1 - smoothstep(0.72, 0.88, progress)).toFixed(4),
    "--cover-opacity": (1 - smoothstep(0.22, 0.42, progress)).toFixed(4),
    "--paper-reveal": paperReveal.toFixed(4),
    "--headline-reveal": headlineReveal.toFixed(4),
    "--headline-y": `${((1 - headlineReveal) * 24).toFixed(2)}px`,
    "--headline-scale": (0.955 + headlineBack * 0.045).toFixed(4),
    "--headline-blur": `${((1 - headlineReveal) * 5).toFixed(2)}px`,
    "--legend-reveal": legendReveal.toFixed(4),
    "--staff-reveal": staffReveal.toFixed(4),
    "--summary-reveal": summaryReveal.toFixed(4),
    "--actions-reveal": actionsReveal.toFixed(4),
    "--period-reveal": periodReveal.toFixed(4),
  };

  return (
    <section className="score-stage" id="score-stage" aria-labelledby="score-title">
      <img className="stage-paper" src="/assets/single-paper-background.png" alt="" aria-hidden="true" />
      <button className="replay-button" type="button" onClick={onReplay}>
        연출 다시 보기
      </button>

      <div className="score-canvas" style={scoreStyle}>
        <OpeningBook progress={progress} />

        <div className="final-score">
          <h1 id="score-title">
            <span>서로 다른 목소리로,</span>
            <span>같은 음악을 완성합니다<span className="headline-period">.</span></span>
          </h1>

          <div className="voice-legend" aria-label="합창 성부">
            {voices.map((voice) => <span key={voice}>{voice}</span>)}
          </div>

          <img className="wide-staff" src="/assets/wide-m-staff-transparent.png" alt="" aria-hidden="true" />

          <p className="score-summary">
            체계적인 앙상블 교육과<br />
            정기 연습·공연을 통해 음악으로 함께 성장합니다.
          </p>

          <div className="score-actions">
            <button className="primary-action" type="button" disabled={!actionsReady} onClick={() => onAction("activity")}>
              우리의 활동 보기
            </button>
            <button className="secondary-action" type="button" disabled={!actionsReady} onClick={() => onAction("concert")}>
              공연과 소식 <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function App() {
  const [animationKey, setAnimationKey] = useState(0);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleAction = (type) => {
    setToast(
      type === "activity"
        ? "실제 적용 시 합창단 활동·갤러리 화면으로 연결됩니다."
        : "실제 적용 시 공연 일정과 소식 화면으로 연결됩니다.",
    );
  };

  return (
    <div className="prototype-shell">
      <Header />
      <main>
        <ScoreStage
          animationKey={animationKey}
          onAction={handleAction}
          onReplay={() => setAnimationKey((value) => value + 1)}
        />
      </main>
      <div className={`sample-toast${toast ? " is-visible" : ""}`} role="status" aria-live="polite">
        {toast}
      </div>
    </div>
  );
}
