const {
  chromium,
} = require('C:/Users/seong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')

const exactParagraphOne =
  '2014년 서울모테트음악재단 설립과 함께 창단된 서울모테트청소년합창단을 지도하고 있는 지휘자 김형수는 지난 35년 동안 서울모테트합창단(프로단체) 단원 겸 수석 부지휘자로 활동해 왔으며  특별히 미래 사회와 음악계를 이끌어 갈 다음 세대를 위한 창조적인 대한으로 모테트 음악재단 산하에 설립된 청소년 아카데미와 청소년합창단을 교육하고 있다.'
const exactParagraphTwo =
  '학부에서는 성악을, 대학원에서 지휘(합창)를 공부하였고 Midwest University 교회음악 박사과정을 취득했다. 또한 교회음악의 성경적 이해와 연구를 위해 신대원에서 신학(M.Div)을 졸업하고 해오름교회, 길교회 음악목사를 역임하였으며, 침신대학교, 남부대학교대학원, 동양대학교, 백석문화대학, 남부대학교 대학원에서 강사를 역임하였다.'

const viewports = [
  { height: 900, name: 'desktop', width: 1536 },
  { height: 1024, name: 'tablet', width: 768 },
  { height: 844, name: 'mobile', width: 390 },
]

async function run() {
  const browser = await chromium.launch({ headless: true })
  const results = []

  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport })
    const runtimeErrors = []
    page.on('console', (message) => {
      if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`)
    })
    page.on('pageerror', (error) => runtimeErrors.push(`pageerror: ${error.message}`))

    await page.goto('http://127.0.0.1:5175/about?section=conductor', {
      waitUntil: 'networkidle',
    })
    await page.locator('.conductor-profile__document').waitFor({ state: 'visible' })
    await page.evaluate(() => document.fonts.ready)

    const state = await page.evaluate(
      ({ expectedOne, expectedTwo }) => {
        const profile = document.querySelector('.conductor-profile')
        const media = document.querySelector('.conductor-profile__media')
        const portrait = document.querySelector('.conductor-profile__portrait-matte')
        const performance = document.querySelector('.conductor-profile__performance')
        const biography = document.querySelector('.conductor-profile__biography')
        const paragraphs = [...document.querySelectorAll('.conductor-profile__biography > p')]
        const images = [...document.querySelectorAll('.conductor-profile__media img')]
        const roleItems = [...document.querySelectorAll('.conductor-profile__current li')]
        const tabLinks = [...document.querySelectorAll('.about-overview-nav a')]
        const profileText = profile?.textContent ?? ''

        return {
          biographyFont: biography ? getComputedStyle(biography).fontFamily : null,
          exactParagraphOne: paragraphs[0]?.textContent === expectedOne,
          exactParagraphTwo: paragraphs[1]?.textContent === expectedTwo,
          globalHorizontalOverflow:
            document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          imageCount: images.length,
          imagesLoaded: images.every((image) => image.complete && image.naturalWidth > 0),
          mediaWidth: media?.getBoundingClientRect().width ?? 0,
          performanceWiderThanPortrait:
            (performance?.getBoundingClientRect().width ?? 0) >
            (portrait?.getBoundingClientRect().width ?? 0),
          profileSectionCount: profile?.querySelectorAll('section').length ?? 0,
          roleCount: roleItems.length,
          roleConjunctionMerged: roleItems.some((item) =>
            item.textContent?.includes(
              '(재)서울모테트음악재단 상임이사 겸 서울모테트합창단 수석부지휘자',
            ),
          ),
          tabMinimumHeight: Math.min(
            ...tabLinks.map((link) => link.getBoundingClientRect().height),
          ),
          textIncludesBoth: profileText.includes(expectedOne) && profileText.includes(expectedTwo),
        }
      },
      { expectedOne: exactParagraphOne, expectedTwo: exactParagraphTwo },
    )

    results.push({ runtimeErrors, state, viewport })
    await page.close()
  }

  console.log(JSON.stringify(results, null, 2))
  await browser.close()

  const failed = results.some(({ runtimeErrors, state }) =>
    runtimeErrors.length > 0 ||
    state.globalHorizontalOverflow ||
    !state.exactParagraphOne ||
    !state.exactParagraphTwo ||
    !state.imagesLoaded ||
    state.imageCount !== 2 ||
    !state.performanceWiderThanPortrait ||
    state.profileSectionCount !== 1 ||
    state.roleCount !== 4 ||
    !state.roleConjunctionMerged ||
    state.tabMinimumHeight < 44 ||
    !state.textIncludesBoth,
  )

  if (failed) process.exitCode = 1
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
