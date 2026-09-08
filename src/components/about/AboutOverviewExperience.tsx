import {
  MotionConfig,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react'
import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'

import { OptimizedImage } from '../common/OptimizedImage'
import '../../styles/about-overview.css'

const EASE_OUT = [0.16, 1, 0.3, 1] as const

const facts = [
  { caption: 'FOUNDED IN SEOUL', label: '2014' },
  { caption: 'CHOIR & ACADEMY', label: 'YOUTH' },
  { caption: 'LISTEN · LEARN · SING', label: 'MOTET' },
] as const

const spiritValues = [
  {
    body: '음악 작품과 가사를 이해하고, 듣기·발성·앙상블로 예술적 역량을 키웁니다.',
    english: 'MUSICAL ARTISTRY',
    number: '01',
    title: '음악적 역량과 예술성',
  },
  {
    body: '기독교 정신과 교회음악의 전통 위에서 지성·인성·영성의 조화를 추구합니다.',
    english: 'SACRED IDEAL',
    number: '02',
    title: '교회음악의 바른 이상',
  },
  {
    body: '공동체 훈련으로 사회성과 자신감, 리더십을 기르고 서로를 존중합니다.',
    english: 'ONE COMMUNITY',
    number: '03',
    title: '함께 부르는 공동체',
  },
  {
    body: '정기연주회, 캠프, 봉사, 해외 비전투어로 예술적 성장과 세계시민의식을 키웁니다.',
    english: 'NEXT GENERATION',
    number: '04',
    title: '다음 세대 교육',
  },
] as const

const learningSteps = [
  {
    body: '발성과 악보 읽기로 자신의 소리와 기초를 익힙니다.',
    english: 'BREATHE',
    number: '01',
    title: '호흡',
  },
  {
    body: '상대 파트와 작품을 들으며 해석과 균형을 배웁니다.',
    english: 'LISTEN',
    number: '02',
    title: '듣기',
  },
  {
    body: '공동체 훈련으로 사회성·자신감·리더십을 기릅니다.',
    english: 'HARMONIZE',
    number: '03',
    title: '앙상블',
  },
  {
    body: '초청·봉사연주로 위로와 희망을 전하고 이웃을 섬깁니다.',
    english: 'SHARE',
    number: '04',
    title: '나눔',
  },
] as const

const programs = [
  { body: '음악적 역량과 예술적 성장', number: '01', title: '정기연주회' },
  { body: '정체성·사회성·자신감·리더십', number: '02', title: '수련·뮤직캠프' },
  { body: '위로와 희망을 전하고 이웃을 섬김', number: '03', title: '초청·봉사연주' },
  { body: '문화적 다양성과 세계시민의식', number: '04', title: '해외 비전투어' },
  { body: '방송·드라마 촬영·음원 녹음', number: '05', title: '특별활동' },
] as const

type RevealProps = {
  children: ReactNode
  className?: string
  delay?: number
}

function RevealBlock({ children, className, delay = 0 }: RevealProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 22 }}
      transition={{ delay, duration: 0.7, ease: EASE_OUT }}
      viewport={{ amount: 0.18, once: true }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
    >
      {children}
    </motion.div>
  )
}

function EditorialLabel({
  children,
  number,
  secondary,
}: {
  children: ReactNode
  number?: string
  secondary?: string
}) {
  return (
    <div className="about-overview__label">
      <p>{number ? `${number}  /  ` : ''}{children}</p>
      {secondary ? <span>{secondary}</span> : null}
    </div>
  )
}

function Introduction() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const prefersReducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    offset: ['start start', 'end start'],
    target: sectionRef,
  })
  const imageY = useTransform(scrollYProgress, [0, 1], [0, 22])

  return (
    <section
      aria-labelledby="about-overview-title"
      className="about-overview__intro"
      id="overview"
      ref={sectionRef}
    >
      <div className="about-overview__shell about-overview__intro-stage">
        <div className="about-overview__intro-copy">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
            transition={{ duration: 0.58, ease: EASE_OUT }}
          >
            <EditorialLabel secondary="MAKING VOICES MATTER">
              ABOUT SMYC
            </EditorialLabel>
          </motion.div>

          <h1 id="about-overview-title">
            <span className="about-overview__title-mask">
              <motion.span
                animate={{ opacity: 1, y: 0 }}
                initial={prefersReducedMotion ? false : { opacity: 0, y: '105%' }}
                transition={{ delay: 0.06, duration: 0.82, ease: EASE_OUT }}
              >
                청소년의 목소리로
              </motion.span>
            </span>
            <span className="about-overview__title-mask">
              <motion.span
                animate={{ opacity: 1, y: 0 }}
                initial={prefersReducedMotion ? false : { opacity: 0, y: '105%' }}
                transition={{ delay: 0.12, duration: 0.82, ease: EASE_OUT }}
              >
                세상과 이웃을
              </motion.span>
            </span>
            <span className="about-overview__title-mask about-overview__title-focus">
              <motion.span
                animate={{ opacity: 1, y: 0 }}
                initial={prefersReducedMotion ? false : { opacity: 0, y: '105%' }}
                transition={{ delay: 0.18, duration: 0.82, ease: EASE_OUT }}
              >
                <strong>이어</strong> <em>갑니다.</em>
              </motion.span>
            </span>
          </h1>

          <motion.p
            animate={{ opacity: 1, y: 0 }}
            className="about-overview__intro-body"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            transition={{ delay: 0.3, duration: 0.66, ease: EASE_OUT }}
          >
            2014년 서울모테트합창단이 음악재단을 설립하며 청소년아카데미 산하에
            창단했습니다. 정기연주회, 뮤직캠프, 초청·봉사연주, 해외 비전투어를 통해
            음악적 역량과 공동체성, 세계시민의식을 함께 기릅니다.
          </motion.p>

          <motion.dl
            animate={{ opacity: 1, y: 0 }}
            className="about-overview__facts"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
            transition={{ delay: 0.4, duration: 0.62, ease: EASE_OUT }}
          >
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.caption}</dd>
              </div>
            ))}
          </motion.dl>
          <span aria-hidden="true" className="about-overview__voices">VOICES</span>
        </div>

        <motion.figure
          animate={{ opacity: 1, y: 0 }}
          className="about-overview__intro-figure"
          initial={prefersReducedMotion ? false : { opacity: 0.55, y: 18 }}
          style={{ y: prefersReducedMotion ? 0 : imageY }}
          transition={{ delay: 0.1, duration: 0.96, ease: EASE_OUT }}
        >
          <OptimizedImage
            alt="2018년 유럽 비전투어에 참여한 서울모테트청소년합창단 단체 사진"
            className="about-overview__intro-image"
            fallbackVariant="gallery"
            imageClassName="about-overview__image-media"
            loading="eager"
            priority
            sizes="(max-width: 767px) calc(100vw - 40px), (max-width: 1099px) 46vw, 568px"
            src="/images/about/smyc-europe-2018.webp"
          />
          <span aria-hidden="true" className="about-overview__photo-accent" />
          <figcaption className="about-overview__glass-caption">
            <span>SEOUL MOTET YOUTH CHOIR</span>
            <strong>서로 다른 목소리가<br />하나의 공동체가 됩니다.</strong>
          </figcaption>
          <div className="about-overview__tour-badge">
            <strong>2018</strong>
            <span>EUROPE TOUR</span>
          </div>
        </motion.figure>

        <p className="about-overview__intro-lyric">
          생명의 노래&nbsp;&nbsp;·&nbsp;&nbsp;섬김의 노래&nbsp;&nbsp;·&nbsp;&nbsp;희망의 노래
        </p>
        <span aria-hidden="true" className="about-overview__bottom-rule" />
      </div>
    </section>
  )
}

function FoundingStory() {
  return (
    <section aria-labelledby="about-founding-title" className="about-overview__founding" id="founding">
      <div className="about-overview__shell about-overview__founding-stage">
        <RevealBlock className="about-overview__founding-heading">
          <EditorialLabel>WHY WE BEGAN</EditorialLabel>
          <h2 id="about-founding-title">
            합창음악의 위대한 힘으로,<br />
            사람과 사회를 세웁니다.
          </h2>
        </RevealBlock>

        <RevealBlock className="about-overview__founding-visual">
          <figure>
            <OptimizedImage
              alt="서울모테트청소년합창단 제1회 정기연주회 무대"
              className="about-overview__founding-image"
              fallbackVariant="gallery"
              imageClassName="about-overview__image-media"
              sizes="(max-width: 767px) calc(100vw - 40px), (max-width: 1099px) 54vw, 736px"
              src="/images/about/smyc-first-concert.webp"
            />
            <span aria-hidden="true" className="about-overview__photo-accent" />
            <figcaption className="about-overview__archive-caption">
              <span>ARCHIVE / FIRST CONCERT</span>
              <strong>제1회 정기연주회<br />함께 세운 첫 무대</strong>
            </figcaption>
          </figure>
        </RevealBlock>

        <RevealBlock className="about-overview__founding-copy" delay={0.08}>
          <p className="about-overview__founding-year">2014</p>
          <span aria-hidden="true" className="about-overview__year-rule" />
          <h3>교회음악의 바른 이상을<br />다음 세대에게.</h3>
          <p className="about-overview__founding-body">
            서울모테트음악재단 설립 25주년과 재단 설립을 기념하여 창단되었습니다.
            청소년들이 정통 합창음악을 통해 음악적 역량과 인성을 키우며, 이웃과
            사회에 나눔과 사랑을 실천하는 인재로 성장하도록 돕는 것이 출발점이었습니다.
          </p>
          <blockquote>
            <span aria-hidden="true">“</span>
            음악의 참된 의미와 가치를 배우며,<br />
            이웃을 향한 나눔과 사랑을 실천합니다.
          </blockquote>
        </RevealBlock>

        <div className="about-overview__founding-meta">
          <span>SEOUL MOTET MUSIC FOUNDATION · YOUTH ACADEMY</span>
          <strong>2018 EUROPE&nbsp;&nbsp;/&nbsp;&nbsp;2020 NETFLIX&nbsp;&nbsp;/&nbsp;&nbsp;2023 tvN&nbsp;&nbsp;/&nbsp;&nbsp;2025 EUROPE</strong>
        </div>
      </div>
    </section>
  )
}

function Spirit() {
  const prefersReducedMotion = useReducedMotion()
  const [activeSpiritIndex, setActiveSpiritIndex] = useState(0)
  const spiritButtonRefs = useRef<Array<HTMLButtonElement | null>>([])

  const handleSpiritKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    let nextIndex: number | null = null

    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % spiritValues.length
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + spiritValues.length) % spiritValues.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = spiritValues.length - 1
    }

    if (nextIndex === null) return

    event.preventDefault()
    setActiveSpiritIndex(nextIndex)
    spiritButtonRefs.current[nextIndex]?.focus()
  }

  return (
    <section aria-labelledby="about-spirit-title" className="about-overview__spirit-wrap" id="spirit">
      <div className="about-overview__shell about-overview__spirit-stage">
        <div className="about-overview__spirit-copy">
          <EditorialLabel>OUR SPIRIT</EditorialLabel>
          <RevealBlock>
            <h2 aria-label="음악의 참된 의미와 가치를 배웁니다." id="about-spirit-title">
              음악의 참된 의미와
              <span>가치를 <em>배웁니다.</em></span>
            </h2>
            <p className="about-overview__spirit-body">
              합창음악을 통해 지성·인성·영성의 조화를 이루고, 스스로를 공동체와
              사회의 구성원으로 인식하도록 돕습니다. 음악은 개인의 기량을 넘어
              이웃을 향한 위로와 희망, 나눔과 사랑으로 이어집니다.
            </p>
            <p className="about-overview__spirit-lyric">
              삶에 지친 영혼을 치유하는 생명의 노래,<br />
              세상과 이웃을 향한 섬김과 희망의 노래.
            </p>
          </RevealBlock>
          <span aria-hidden="true" className="about-overview__one-voice">ONE VOICE</span>
        </div>

        <div aria-label="합창단이 중요하게 여기는 네 가지 가치" className="about-overview__spirit-values">
          {spiritValues.map((value, index) => {
            const isActive = activeSpiritIndex === index

            return (
              <motion.button
                aria-pressed={isActive}
                className={isActive ? 'is-active' : undefined}
                initial={prefersReducedMotion ? false : { opacity: 0, x: 20 }}
                key={value.number}
                onClick={() => setActiveSpiritIndex(index)}
                onKeyDown={(event) => handleSpiritKeyDown(event, index)}
                ref={(element) => {
                  spiritButtonRefs.current[index] = element
                }}
                transition={{ delay: index * 0.055, duration: 0.58, ease: EASE_OUT }}
                type="button"
                viewport={{ amount: 0.35, once: true }}
                whileInView={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
              >
                <span>{value.number}</span>
                <div>
                  <h3>{value.title}</h3>
                  <em>{value.english}</em>
                  <p>{value.body}</p>
                </div>
              </motion.button>
            )
          })}
        </div>

        <div className="about-overview__spirit-footer">
          <p>LISTEN&nbsp;&nbsp;·&nbsp;&nbsp;RESPECT&nbsp;&nbsp;·&nbsp;&nbsp;HARMONIZE&nbsp;&nbsp;·&nbsp;&nbsp;SHARE</p>
          <blockquote>“나의 노래를 가르쳐 부르게 하라”&nbsp;&nbsp;·&nbsp;&nbsp;신 31:19</blockquote>
        </div>
      </div>
      <div className="about-overview__shell about-overview__spirit-outro">
        <p>한 사람의 성장을 넘어, 함께 살아가는 태도를 배웁니다.</p>
        <span>MUSIC BECOMES CHARACTER.</span>
      </div>
    </section>
  )
}

function Education() {
  const sequenceRef = useRef<HTMLDivElement | null>(null)
  const prefersReducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    offset: ['start 0.78', 'end 0.34'],
    target: sequenceRef,
  })
  const progressClip = useTransform(scrollYProgress, [0, 1], ['inset(0 0 100% 0)', 'inset(0 0 0% 0)'])

  return (
    <section aria-labelledby="about-education-title" className="about-overview__education" id="education">
      <div className="about-overview__shell about-overview__education-stage">
        <RevealBlock className="about-overview__education-heading">
          <EditorialLabel>HOW WE LEARN</EditorialLabel>
          <h2 id="about-education-title">
            잘 부르는 기술보다
            <span>함께 듣는 태도를.</span>
          </h2>
        </RevealBlock>
        <p className="about-overview__learning-script">Learning<br />by Listening</p>

        <RevealBlock className="about-overview__education-visual">
          <figure>
            <OptimizedImage
              alt="지휘자와 단원들이 함께 악보를 살피는 서울모테트청소년합창단 리허설"
              className="about-overview__education-image"
              fallbackVariant="gallery"
              imageClassName="about-overview__image-media"
              sizes="(max-width: 767px) calc(100vw - 40px), (max-width: 1099px) 56vw, 716px"
              src="/images/about/smyc-rehearsal.webp"
            />
            <span aria-hidden="true" className="about-overview__photo-accent" />
            <figcaption className="about-overview__practice-caption">
              <span>PRACTICE / LISTENING FIRST</span>
              <strong>서로를 듣는 순간부터<br />앙상블은 시작됩니다.</strong>
            </figcaption>
          </figure>
        </RevealBlock>

        <div className="about-overview__learning-sequence" ref={sequenceRef}>
          <div aria-hidden="true" className="about-overview__journey-curve">
            <img alt="" src="/images/about/learning-journey-curve.svg" />
            <motion.img
              alt=""
              className="about-overview__journey-progress"
              src="/images/about/learning-journey-curve.svg"
              style={{ clipPath: prefersReducedMotion ? 'inset(0 0 0% 0)' : progressClip }}
            />
          </div>
          <ol>
            {learningSteps.map((step, index) => (
              <motion.li
                initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
                key={step.number}
                transition={{ delay: index * 0.06, duration: 0.56, ease: EASE_OUT }}
                viewport={{ amount: 0.5, once: true }}
                whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              >
                <span>{step.number}</span>
                <div>
                  <h3>{step.title}</h3>
                  <em>{step.english}</em>
                  <p>{step.body}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>

        <div className="about-overview__education-statement">
          <RevealBlock>
            <h3>합창은 발성, 악보 읽기, 협업 태도를<br />함께 배우는 교육입니다.</h3>
          </RevealBlock>
          <RevealBlock delay={0.08}>
            <p>
              정기연주회로 예술적 성장을, 수련·뮤직캠프로 공동체성과 리더십을,
              해외 비전투어로 문화 다양성에 대한 존중과 세계시민의식을 배웁니다.
            </p>
            <span>BREATHE&nbsp;&nbsp;·&nbsp;&nbsp;LISTEN&nbsp;&nbsp;·&nbsp;&nbsp;HARMONIZE&nbsp;&nbsp;·&nbsp;&nbsp;SHARE</span>
          </RevealBlock>
        </div>

        <div className="about-overview__programs">
          <p>PROGRAMS IN PRACTICE</p>
          <h3>무대와 삶으로 이어지는 다섯 가지 교육</h3>
          <div className="about-overview__program-grid">
            {programs.map((program, index) => (
              <motion.article
                className={index === 0 ? 'is-active' : undefined}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
                key={program.number}
                transition={{ delay: index * 0.045, duration: 0.54, ease: EASE_OUT }}
                viewport={{ amount: 0.45, once: true }}
                whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              >
                <span>{program.number}</span>
                <h4>{program.title}</h4>
                <p>{program.body}</p>
              </motion.article>
            ))}
          </div>
        </div>
        <span aria-hidden="true" className="about-overview__education-accent" />
      </div>
    </section>
  )
}

export function AboutOverviewExperience() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="about-overview">
        <Introduction />
        <FoundingStory />
        <Spirit />
        <Education />
      </div>
    </MotionConfig>
  )
}
