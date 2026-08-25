import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react'
import {
  type KeyboardEvent,
  type MutableRefObject,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Link } from 'react-router'

import type { AboutSectionRow } from '../../types/cms'
import type { GalleryImage } from '../../types/content'
import { OptimizedImage } from '../common/OptimizedImage'
import '../../styles/about-overview.css'

const EASE_OUT = [0.16, 1, 0.3, 1] as const

const identityPrinciples = [
  {
    body: '각자의 소리를 정확하게 다듬고 음악의 깊이를 배웁니다.',
    title: '음악성',
  },
  {
    body: '서로의 목소리를 들으며 함께 책임지는 태도를 익힙니다.',
    title: '공동체',
  },
  {
    body: '연습과 무대의 경험을 통해 자신만의 가능성을 발견합니다.',
    title: '성장',
  },
] as const

const practiceSteps = [
  {
    body: '나보다 먼저 옆 사람의 소리와 전체의 균형을 듣습니다.',
    label: '듣기',
    title: '서로의 소리를 먼저 듣습니다.',
  },
  {
    body: '호흡과 발음, 음정과 표현을 반복하며 하나의 방향을 만듭니다.',
    label: '다듬기',
    title: '다름을 지우지 않고 정교하게 맞춥니다.',
  },
  {
    body: '연습에서 쌓은 신뢰를 관객과 나누는 공연으로 완성합니다.',
    label: '무대',
    title: '함께 만든 울림을 무대에 전합니다.',
  },
] as const

const peopleLinks = [
  {
    english: 'CONDUCTOR',
    href: '/about?section=conductor',
    korean: '지휘자 소개',
    supporting: '음악적 방향과 교육의 흐름',
  },
  {
    english: 'ACCOMPANIST',
    href: '/about?section=accompanist',
    korean: '반주자 소개',
    supporting: '연습과 무대를 함께 세우는 동행',
  },
  {
    english: 'MEMBERS',
    href: '/about?section=members',
    korean: '단원 소개',
    supporting: '서로 다른 목소리가 이루는 공동체',
  },
] as const

type AboutOverviewExperienceProps = {
  affiliation: string
  foundedYear: number
  galleryImages: GalleryImage[]
  introSummary: string
  sections: AboutSectionRow[]
}

function getImage(
  galleryImages: GalleryImage[],
  index: number,
  fallbackSrc: string,
  fallbackAlt: string,
) {
  const image = galleryImages.filter((item) => item.image_url.trim())[index]

  return {
    alt: image?.title?.trim() || fallbackAlt,
    caption: image?.description?.trim() || image?.title?.trim() || fallbackAlt,
    fallbackSrc,
    src: image?.image_url?.trim() || fallbackSrc,
  }
}

function getSectionCopy(
  sections: AboutSectionRow[],
  sectionKey: string,
  fallbackTitle: string,
  fallbackContent: string,
) {
  const section = sections.find((item) => item.section_key === sectionKey)

  return {
    content: section?.content?.trim() || fallbackContent,
    title: section?.title?.trim() || fallbackTitle,
  }
}

function moveTabFocus(
  event: KeyboardEvent<HTMLButtonElement>,
  currentIndex: number,
  count: number,
  setActiveIndex: (index: number) => void,
  refs: MutableRefObject<Array<HTMLButtonElement | null>>,
) {
  let nextIndex: number

  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    nextIndex = (currentIndex + 1) % count
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    nextIndex = (currentIndex - 1 + count) % count
  } else if (event.key === 'Home') {
    nextIndex = 0
  } else if (event.key === 'End') {
    nextIndex = count - 1
  } else {
    return
  }

  event.preventDefault()
  setActiveIndex(nextIndex)
  refs.current[nextIndex]?.focus()
}

function Hero({
  affiliation,
  foundedYear,
  heroImage,
}: {
  affiliation: string
  foundedYear: number
  heroImage: ReturnType<typeof getImage>
}) {
  const reducedMotion = useReducedMotion()

  return (
    <section aria-labelledby="about-overview-title" className="about-overview__hero">
      <div aria-hidden="true" className="about-overview__hero-word">
        ABOUT
      </div>
      <div className="about-overview__shell about-overview__hero-grid">
        <div className="about-overview__hero-copy">
          <motion.p
            animate={{ opacity: 1, y: 0 }}
            className="about-overview__eyebrow"
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            transition={{ duration: 0.44, ease: EASE_OUT }}
          >
            SEOUL MOTET YOUTH CHOIR
          </motion.p>
          <h1 id="about-overview-title">
            <span className="about-overview__title-mask">
              <motion.span
                animate={{ opacity: 1, y: 0 }}
                initial={reducedMotion ? false : { opacity: 0, y: '105%' }}
                transition={{ delay: 0.08, duration: 0.82, ease: EASE_OUT }}
              >
                청소년의 목소리로
              </motion.span>
            </span>
            <span className="about-overview__title-mask">
              <motion.span
                animate={{ opacity: 1, y: 0 }}
                initial={reducedMotion ? false : { opacity: 0, y: '105%' }}
                transition={{ delay: 0.15, duration: 0.82, ease: EASE_OUT }}
              >
                전하는 <em>깊은 울림</em>
              </motion.span>
            </span>
          </h1>
          <motion.p
            animate={{ opacity: 1, y: 0 }}
            className="about-overview__hero-lead"
            initial={reducedMotion ? false : { opacity: 0, y: 18 }}
            transition={{ delay: 0.28, duration: 0.66, ease: EASE_OUT }}
          >
            서로의 목소리를 듣고, 음악의 가치와 함께하는 마음을 배우는 청소년 합창단입니다.
          </motion.p>
        </div>

        <motion.figure
          animate={{ clipPath: 'inset(0% 0% 0% 0%)', opacity: 1 }}
          className="about-overview__hero-figure"
          initial={
            reducedMotion
              ? false
              : { clipPath: 'inset(0% 0% 100% 0%)', opacity: 0.55 }
          }
          transition={{ delay: 0.12, duration: 0.94, ease: EASE_OUT }}
        >
          <OptimizedImage
            alt={heroImage.alt}
            className="about-overview__hero-image"
            fallbackSrcs={[heroImage.fallbackSrc]}
            fallbackVariant="hero"
            imageClassName="about-overview__image-media"
            loading="eager"
            priority
            sizes="(max-width: 767px) calc(100vw - 40px), (max-width: 1100px) 56vw, 520px"
            src={heroImage.src}
          />
          <figcaption className="about-overview__hero-caption">
            <span>{affiliation}</span>
            <strong>{foundedYear} 창단</strong>
          </figcaption>
        </motion.figure>
      </div>
    </section>
  )
}

function Identity({
  introSummary,
  mission,
}: {
  introSummary: string
  mission: string
}) {
  return (
    <section aria-labelledby="about-identity-title" className="about-overview__identity">
      <motion.div
        aria-hidden="true"
        className="about-overview__ghost-word"
        initial={{ opacity: 0, x: -70 }}
        transition={{ duration: 0.9, ease: EASE_OUT }}
        viewport={{ amount: 0.3, once: true }}
        whileInView={{ opacity: 1, x: 0 }}
      >
        WHO WE ARE
      </motion.div>
      <div className="about-overview__shell">
        <motion.div
          className="about-overview__identity-heading"
          initial={{ opacity: 0, y: 36 }}
          transition={{ duration: 0.72, ease: EASE_OUT }}
          viewport={{ amount: 0.45, once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <h2 id="about-identity-title">
            한 사람의 목소리가
            <span>공동체의 울림이 되는 곳.</span>
          </h2>
          <p>{introSummary}</p>
        </motion.div>

        <motion.p
          className="about-overview__mission"
          initial={{ opacity: 0, x: 48 }}
          transition={{ delay: 0.08, duration: 0.72, ease: EASE_OUT }}
          viewport={{ amount: 0.45, once: true }}
          whileInView={{ opacity: 1, x: 0 }}
        >
          {mission}
        </motion.p>

        <div className="about-overview__principles">
          {identityPrinciples.map((principle, index) => (
            <motion.article
              initial={{ opacity: 0, y: 24 }}
              key={principle.title}
              transition={{ delay: index * 0.07, duration: 0.58, ease: EASE_OUT }}
              viewport={{ amount: 0.5, once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <h3>{principle.title}</h3>
              <p>{principle.body}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}

function Practice({ practiceImage }: { practiceImage: ReturnType<typeof getImage> }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([])
  const sectionRef = useRef<HTMLElement | null>(null)
  const reducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    offset: ['start end', 'end start'],
    target: sectionRef,
  })
  const imageScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.02, 1, 1.025])
  const activeStep = practiceSteps[activeIndex]

  return (
    <section
      aria-labelledby="about-practice-title"
      className="about-overview__practice"
      ref={sectionRef}
    >
      <div className="about-overview__shell about-overview__practice-grid">
        <motion.figure
          className="about-overview__practice-figure"
          initial={{ clipPath: 'inset(10% 0% 0% 0%)', opacity: 0 }}
          style={{ scale: reducedMotion ? 1 : imageScale }}
          transition={{ duration: 0.86, ease: EASE_OUT }}
          viewport={{ amount: 0.28, once: true }}
          whileInView={{ clipPath: 'inset(0% 0% 0% 0%)', opacity: 1 }}
        >
          <OptimizedImage
            alt={practiceImage.alt}
            className="about-overview__practice-image"
            fallbackSrcs={[practiceImage.fallbackSrc]}
            fallbackVariant="gallery"
            imageClassName="about-overview__image-media"
            sizes="(max-width: 899px) calc(100vw - 40px), 58vw"
            src={practiceImage.src}
          />
          <figcaption>{practiceImage.caption}</figcaption>
        </motion.figure>

        <div className="about-overview__practice-copy">
          <h2 id="about-practice-title">
            함께 듣고,
            <span>함께 다듬고,</span>
            하나의 무대를 만듭니다.
          </h2>
          <div
            aria-label="합창 연습의 세 가지 과정"
            className="about-overview__practice-tabs"
            role="tablist"
          >
            {practiceSteps.map((step, index) => (
              <button
                aria-controls="about-practice-panel"
                aria-selected={activeIndex === index}
                key={step.label}
                onClick={() => setActiveIndex(index)}
                onKeyDown={(event) =>
                  moveTabFocus(
                    event,
                    index,
                    practiceSteps.length,
                    setActiveIndex,
                    buttonRefs,
                  )
                }
                ref={(node) => {
                  buttonRefs.current[index] = node
                }}
                role="tab"
                tabIndex={activeIndex === index ? 0 : -1}
                type="button"
              >
                {step.label}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.article
              animate={{ opacity: 1, x: 0 }}
              className="about-overview__practice-panel"
              exit={{ opacity: 0, x: -24 }}
              id="about-practice-panel"
              initial={{ opacity: 0, x: 34 }}
              key={activeStep.label}
              role="tabpanel"
              transition={{ duration: 0.48, ease: EASE_OUT }}
            >
              <h3>{activeStep.title}</h3>
              <p>{activeStep.body}</p>
            </motion.article>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

function Formation({ sections }: { sections: AboutSectionRow[] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([])
  const visibleSections = sections.slice(0, 4)
  const activeSection = visibleSections[activeIndex]

  if (!activeSection) {
    return null
  }

  return (
    <section aria-labelledby="about-formation-title" className="about-overview__formation">
      <div className="about-overview__shell about-overview__formation-grid">
        <div className="about-overview__formation-lineage">
          <p>OUR FORMATION</p>
          <h2 id="about-formation-title">
            <span>FOUNDATION</span>
            <span>ACADEMY</span>
            <strong>CHOIR</strong>
          </h2>
          <div className="about-overview__lineage-korean" aria-label="소속 기관 구조">
            <span>서울모테트음악재단</span>
            <span>청소년아카데미</span>
            <strong>서울모테트청소년합창단</strong>
          </div>
        </div>

        <div className="about-overview__formation-content">
          <div
            aria-label="합창단 소개 항목"
            className="about-overview__formation-tabs"
            role="tablist"
          >
            {visibleSections.map((section, index) => (
              <button
                aria-controls="about-formation-panel"
                aria-selected={activeIndex === index}
                key={section.id}
                onClick={() => setActiveIndex(index)}
                onKeyDown={(event) =>
                  moveTabFocus(
                    event,
                    index,
                    visibleSections.length,
                    setActiveIndex,
                    buttonRefs,
                  )
                }
                ref={(node) => {
                  buttonRefs.current[index] = node
                }}
                role="tab"
                tabIndex={activeIndex === index ? 0 : -1}
                type="button"
              >
                {section.title || section.section_key}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.article
              animate={{ opacity: 1, y: 0 }}
              className="about-overview__formation-panel"
              exit={{ opacity: 0, y: -18 }}
              id="about-formation-panel"
              initial={{ opacity: 0, y: 22 }}
              key={activeSection.id}
              role="tabpanel"
              transition={{ duration: 0.52, ease: EASE_OUT }}
            >
              <h3>{activeSection.title || activeSection.section_key}</h3>
              <p>{activeSection.content}</p>
            </motion.article>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

function People() {
  return (
    <section aria-labelledby="about-people-title" className="about-overview__people">
      <div className="about-overview__shell">
        <div className="about-overview__people-heading">
          <h2 id="about-people-title">
            각자의 역할이
            <span>하나의 앙상블을 만듭니다.</span>
          </h2>
          <p>PEOPLE OF THE CHOIR</p>
        </div>
        <nav aria-label="합창단 구성원 소개" className="about-overview__people-links">
          {peopleLinks.map((item, index) => (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              key={item.href}
              transition={{ delay: index * 0.06, duration: 0.58, ease: EASE_OUT }}
              viewport={{ amount: 0.55, once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <Link to={item.href}>
                <span className="about-overview__people-english">{item.english}</span>
                <strong>{item.korean}</strong>
                <span className="about-overview__people-supporting">{item.supporting}</span>
                <span className="about-overview__people-action">소개 보기</span>
              </Link>
            </motion.div>
          ))}
        </nav>
      </div>
    </section>
  )
}

function Closing() {
  return (
    <section aria-labelledby="about-closing-title" className="about-overview__closing">
      <motion.img
        alt=""
        aria-hidden="true"
        className="about-overview__closing-symbol"
        initial={{ opacity: 0, rotate: -4, scale: 0.88 }}
        src="/images/brand/smyc-symbol-vector.svg"
        transition={{ duration: 0.84, ease: EASE_OUT }}
        viewport={{ amount: 0.45, once: true }}
        whileInView={{ opacity: 1, rotate: 0, scale: 1 }}
      />
      <div className="about-overview__shell about-overview__closing-grid">
        <div>
          <p>MORE THAN A CHOIR</p>
          <h2 id="about-closing-title">
            다음 목소리를
            <span>함께 만듭니다.</span>
          </h2>
        </div>
        <div className="about-overview__closing-copy">
          <p>
            음악을 배우는 시간을 넘어, 서로의 목소리를 듣고 함께 성장하는 경험을 시작합니다.
          </p>
          <div className="about-overview__closing-actions">
            <Link className="about-overview__button about-overview__button--primary" to="/join">
              입단 안내
            </Link>
            <Link className="about-overview__button about-overview__button--secondary" to="/spirit">
              합창단 정신
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export function AboutOverviewExperience({
  affiliation,
  foundedYear,
  galleryImages,
  introSummary,
  sections,
}: AboutOverviewExperienceProps) {
  const heroImage = useMemo(
    () =>
      getImage(
        galleryImages,
        0,
        '/images/home-v6/hero-performance.jpg',
        '지휘자와 함께 노래하는 서울모테트청소년합창단',
      ),
    [galleryImages],
  )
  const practiceImage = useMemo(
    () =>
      getImage(
        galleryImages,
        1,
        '/images/home-v6/practice-rehearsal.jpg',
        '함께 앉아 호흡을 맞추는 서울모테트청소년합창단 연습 장면',
      ),
    [galleryImages],
  )
  const mission = getSectionCopy(
    sections,
    'mission',
    '음악의 가치와 꿈',
    '청소년들이 함께 노래하며 음악의 참된 의미와 가치를 배우고, 음악을 통해 이웃을 향한 나눔과 사랑을 실천하도록 돕습니다.',
  )

  return (
    <MotionConfig reducedMotion="user">
      <div className="about-overview">
        <Hero
          affiliation={affiliation}
          foundedYear={foundedYear}
          heroImage={heroImage}
        />
        <Identity introSummary={introSummary} mission={mission.content} />
        <Practice practiceImage={practiceImage} />
        <Formation sections={sections} />
        <People />
        <Closing />
      </div>
    </MotionConfig>
  )
}
