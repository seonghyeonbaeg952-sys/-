import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'

import type { GalleryImage, Poster, VideoItem } from '../../types/content'
import { EmptyState } from '../common/EmptyState'
import { TransitionLink } from '../common/TransitionLink'
import { ImageTile } from './ImageTile'

type ArchivePageStackProps = {
  buttonLabel: string
  collapseLabel?: string
  description: string
  emptyDescription?: string
  emptyTitle?: string
  eyebrow: string
  expandLabel?: string
  images: GalleryImage[]
  posters?: Poster[]
  title?: string
  videos?: VideoItem[]
}

type ArchiveKind = 'PHOTO' | 'POSTER' | 'VIDEO'
type ArchivePlacement = 'photo' | 'poster' | 'video'

type ArchivePreviewItem = {
  alt: string
  fallbackSrcs?: string[]
  href: string
  id: string
  kind: ArchiveKind
  src: string
  title: string
  year: string | null
}

type MaterialRecord = {
  item: ArchivePreviewItem
  placement: ArchivePlacement
}

type StageInfo = {
  code: string
  copy: string
  index: number
}

const ARCHIVE_DURATION = 3600

const stageInfo: StageInfo[] = [
  {
    code: '00 LATENT',
    copy: '세 기록의 표면과 비율을 준비합니다',
    index: 0,
  },
  {
    code: '01 EXPOSURE',
    copy: '빛이 종이와 이미지의 경계를 통과합니다',
    index: 1,
  },
  {
    code: '02 REGISTER',
    copy: '사진·포스터·영상의 고유 비율을 맞춥니다',
    index: 2,
  },
  {
    code: '03 ARCHIVE',
    copy: '한 번의 무대가 세 가지 시간으로 남았습니다',
    index: 3,
  },
]

const focusCopy: Record<ArchivePlacement, string> = {
  photo: '사진은 함께 있던 빛과 표정을 붙잡습니다.',
  poster: '포스터는 공연 전, 사람들을 같은 시간과 장소로 부릅니다.',
  video: '영상은 마지막 음 이후에도 호흡과 움직임을 이어갑니다.',
}

const materialLabels: Record<ArchivePlacement, string> = {
  photo: 'Still image · original ratio',
  poster: 'Printed matter · original ratio',
  video: 'Moving image · original ratio',
}

const recordSpecs: Record<
  ArchivePlacement,
  { dx: number; dy: number; offset: number; restingRotation: number; startRotation: number }
> = {
  photo: {
    dx: -20,
    dy: 15,
    offset: 0.05,
    restingRotation: -0.35,
    startRotation: -1.6,
  },
  poster: {
    dx: 19,
    dy: -20,
    offset: 0.13,
    restingRotation: 0.72,
    startRotation: 2.5,
  },
  video: {
    dx: 24,
    dy: 17,
    offset: 0.21,
    restingRotation: -0.58,
    startRotation: -2.1,
  },
}

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value))
}

function mix(start: number, end: number, progress: number) {
  return start + (end - start) * progress
}

function easeOut(progress: number) {
  return 1 - Math.pow(1 - clamp(progress), 4)
}

function easeInOut(progress: number) {
  return progress < 0.5
    ? 8 * progress * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 4) / 2
}

function smooth(start: number, end: number, value: number) {
  const progress = clamp((value - start) / (end - start))
  return progress * progress * (3 - 2 * progress)
}

function spring(progress: number) {
  const value = clamp(progress)
  return 1 - Math.exp(-7.2 * value) * Math.cos(10.5 * value)
}

function localProgress(progress: number, offset: number) {
  return clamp((progress - offset) / 0.47)
}

function getStageInfo(progress: number) {
  if (progress < 0.22) return stageInfo[0]
  if (progress < 0.58) return stageInfo[1]
  if (progress < 0.88) return stageInfo[2]
  return stageInfo[3]
}

function extractArchiveYear(...values: Array<string | undefined>) {
  for (const value of values) {
    const match = value?.match(/(?:19|20)\d{2}/)
    if (match) return match[0]
  }

  return null
}

function sortByDisplayOrder<T extends { display_order: number }>(items: T[]) {
  return [...items].sort(
    (first, second) => first.display_order - second.display_order,
  )
}

function buildArchiveCollections(
  images: GalleryImage[],
  videos: VideoItem[],
  posters: Poster[],
) {
  const photos: ArchivePreviewItem[] = sortByDisplayOrder(images)
    .filter((image) => image.is_visible && image.image_url.trim())
    .map((image) => ({
      alt: image.image_alt || image.title,
      href: '/gallery?tab=photos',
      id: `photo-${image.id}`,
      kind: 'PHOTO',
      src: image.image_url,
      title: image.title,
      year: extractArchiveYear(image.taken_at, image.created_at, image.title),
    }))

  const posterItems: ArchivePreviewItem[] = sortByDisplayOrder(posters)
    .filter((poster) => poster.is_visible && poster.image_url.trim())
    .map((poster) => ({
      alt: `${poster.title} 포스터`,
      href: '/gallery?tab=posters',
      id: `poster-${poster.id}`,
      kind: 'POSTER',
      src: poster.image_url,
      title: poster.title,
      year: extractArchiveYear(
        poster.concert_date,
        poster.created_at,
        poster.title,
      ),
    }))

  const videoItems: ArchivePreviewItem[] = sortByDisplayOrder(videos)
    .filter((video) => video.is_visible && video.thumbnail_url.trim())
    .map((video) => ({
      alt: `${video.title} 영상 썸네일`,
      fallbackSrcs: video.thumbnail_fallback_urls,
      href: '/gallery?tab=videos',
      id: `video-${video.id}`,
      kind: 'VIDEO',
      src: video.thumbnail_url,
      title: video.title,
      year: extractArchiveYear(video.created_at, video.title),
    }))

  return { photos, posters: posterItems, videos: videoItems }
}

function prefersReducedArchiveMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

class ArchiveEmulsionRenderer {
  readonly ready: Promise<boolean>
  pointer: [number, number] = [0, 0]
  private canvas: HTMLCanvasElement
  private focus = 0
  private gl: WebGLRenderingContext | null = null
  private image: HTMLImageElement
  private imageResolution: [number, number] = [1, 1]
  private program: WebGLProgram | null = null
  private progress = 0
  private record: HTMLButtonElement
  private resizeObserver: ResizeObserver | null = null
  private uniforms: Record<string, WebGLUniformLocation | null> = {}

  constructor(record: HTMLButtonElement) {
    const canvas = record.querySelector<HTMLCanvasElement>('canvas')
    const image = record.querySelector<HTMLImageElement>('img')
    if (!canvas || !image) {
      throw new Error('Archive emulsion media is incomplete.')
    }

    this.record = record
    this.canvas = canvas
    this.image = image
    this.ready = this.initialize()
  }

  private compileShader(type: number, source: string) {
    const gl = this.gl
    if (!gl) throw new Error('WebGL is unavailable.')
    const shader = gl.createShader(type)
    if (!shader) throw new Error('Unable to create archive shader.')
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader) || 'Archive shader failed.'
      gl.deleteShader(shader)
      throw new Error(message)
    }
    return shader
  }

  private async initialize() {
    try {
      if (!this.image.complete) await this.image.decode()
      const gl = this.canvas.getContext('webgl', {
        alpha: false,
        antialias: false,
        preserveDrawingBuffer: false,
        powerPreference: 'high-performance',
      })
      if (!gl || !this.image.naturalWidth || !this.image.naturalHeight) {
        return false
      }
      this.gl = gl
      this.imageResolution = [this.image.naturalWidth, this.image.naturalHeight]

      const vertexSource = `
        attribute vec2 aPosition;
        varying vec2 vUv;
        void main() {
          vUv = aPosition * .5 + .5;
          gl_Position = vec4(aPosition, 0., 1.);
        }
      `
      const fragmentSource = `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D uTexture;
        uniform vec2 uResolution;
        uniform vec2 uImageResolution;
        uniform float uProgress;
        uniform float uTime;
        uniform vec2 uPointer;
        uniform float uFocus;

        float hash(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3. - 2. * f);
          return mix(
            mix(hash(i), hash(i + vec2(1., 0.)), f.x),
            mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x),
            f.y
          );
        }

        vec3 sampleContained(vec2 uv, out float inside) {
          float screenRatio = uResolution.x / uResolution.y;
          float imageRatio = uImageResolution.x / uImageResolution.y;
          vec2 scale = screenRatio > imageRatio
            ? vec2(imageRatio / screenRatio, 1.)
            : vec2(1., screenRatio / imageRatio);
          vec2 imageUv = (uv - .5) / scale + .5;
          imageUv += uPointer * vec2(.006, -.004) * (.35 + .65 * uFocus);
          inside = step(0., imageUv.x) * step(imageUv.x, 1.)
            * step(0., imageUv.y) * step(imageUv.y, 1.);
          return texture2D(uTexture, clamp(imageUv, 0., 1.)).rgb;
        }

        void main() {
          vec2 uv = vUv;
          float inside = 0.;
          vec3 sourceColor = sampleContained(uv, inside);
          float luminance = dot(sourceColor, vec3(.299, .587, .114));
          vec3 paper = vec3(.925, .898, .858);
          vec3 latent = mix(paper, vec3(.16, .09, .13) + luminance * .29, .68);
          float broad = noise(uv * vec2(4.2, 3.2) + vec2(0., uTime * .012));
          float fine = noise(uv * vec2(43., 36.) + vec2(uTime * .01, 0.));
          float edge = uProgress * 1.32 - .16;
          float threshold = uv.x + (broad - .5) * .11 + (fine - .5) * .025;
          float reveal = 1. - smoothstep(edge - .045, edge + .105, threshold);
          float silverEdge = exp(-pow((threshold - edge) / .025, 2.))
            * smoothstep(.04, .18, uProgress)
            * (1. - smoothstep(.84, 1., uProgress));
          vec3 developed = sourceColor * vec3(1.025, .998, .985);
          vec3 color = mix(latent, developed, reveal);
          color += vec3(1., .37, .13) * silverEdge * .11;
          color *= 1. + (fine - .5) * .026;
          color = mix(color, color * 1.035, uFocus * .32);
          color = mix(paper, color, inside);
          gl_FragColor = vec4(color, 1.);
        }
      `

      const program = gl.createProgram()
      if (!program) return false
      const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexSource)
      const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentSource)
      gl.attachShader(program, vertexShader)
      gl.attachShader(program, fragmentShader)
      gl.linkProgram(program)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || 'Archive shader link failed.')
      }
      this.program = program
      gl.useProgram(program)

      const buffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW,
      )
      const position = gl.getAttribLocation(program, 'aPosition')
      gl.enableVertexAttribArray(position)
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

      const texture = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        this.image,
      )

      ;[
        'uResolution',
        'uImageResolution',
        'uProgress',
        'uTime',
        'uPointer',
        'uFocus',
      ].forEach((name) => {
        this.uniforms[name] = gl.getUniformLocation(program, name)
      })
      gl.uniform1i(gl.getUniformLocation(program, 'uTexture'), 0)
      gl.uniform2f(
        this.uniforms.uImageResolution,
        this.imageResolution[0],
        this.imageResolution[1],
      )

      this.record.classList.add('webgl-ready')
      this.resizeObserver = new ResizeObserver(() => this.resize())
      this.resizeObserver.observe(this.canvas)
      this.resize()
      return true
    } catch {
      this.record.classList.remove('webgl-ready')
      return false
    }
  }

  private resize() {
    const gl = this.gl
    if (!gl) return
    const bounds = this.canvas.getBoundingClientRect()
    const density = Math.min(window.devicePixelRatio || 1, 1.75)
    const width = Math.max(2, Math.round(bounds.width * density))
    const height = Math.max(2, Math.round(bounds.height * density))
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width
      this.canvas.height = height
      gl.viewport(0, 0, width, height)
    }
    this.draw()
  }

  set(
    progress: number,
    pointer: [number, number] = this.pointer,
    focus = this.focus,
    time = performance.now() / 1000,
  ) {
    this.progress = progress
    this.pointer = pointer
    this.focus = focus
    this.draw(time)
  }

  private draw(time = 0) {
    const gl = this.gl
    const program = this.program
    if (!gl || !program) return
    gl.useProgram(program)
    gl.uniform2f(
      this.uniforms.uResolution,
      this.canvas.width,
      this.canvas.height,
    )
    gl.uniform1f(this.uniforms.uProgress, this.progress)
    gl.uniform1f(this.uniforms.uTime, time)
    gl.uniform2f(this.uniforms.uPointer, this.pointer[0], this.pointer[1])
    gl.uniform1f(this.uniforms.uFocus, this.focus)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }

  destroy() {
    this.resizeObserver?.disconnect()
    this.record.classList.remove('webgl-ready')
    const extension = this.gl?.getExtension('WEBGL_lose_context')
    extension?.loseContext()
  }
}

function ArchiveMedia({
  item,
  placement,
  priority = false,
}: {
  item: ArchivePreviewItem
  placement: ArchivePlacement
  priority?: boolean
}) {
  return (
    <ImageTile
      alt={item.alt}
      className="record__asset"
      crossOrigin="anonymous"
      fallbackSrcs={item.fallbackSrcs}
      fallbackVariant={placement === 'poster' ? 'poster' : 'gallery'}
      imgClassName="record__image"
      objectFit="contain"
      priority={priority}
      sizes={
        placement === 'photo'
          ? '(min-width: 1280px) 34vw, 40vw'
          : '(min-width: 1280px) 20vw, 24vw'
      }
      src={item.src}
      transform={
        item.kind === 'VIDEO'
          ? undefined
          : {
              quality: item.kind === 'PHOTO' ? 82 : 86,
              resize: 'contain',
              width: 1200,
              widths: [480, 760, 960, 1200],
            }
      }
    >
      <canvas aria-hidden="true" />
    </ImageTile>
  )
}

export function ArchivePageStack({
  buttonLabel,
  description,
  emptyDescription = '현재 공개된 사진 기록이 없습니다.',
  emptyTitle = '공개된 사진 기록이 없습니다',
  eyebrow,
  images,
  posters = [],
  videos = [],
}: ArchivePageStackProps) {
  const initialReducedMotion = prefersReducedArchiveMotion()
  const [reducedMotion, setReducedMotion] = useState(initialReducedMotion)
  const [isRunning, setIsRunning] = useState(false)
  const [selectedRecord, setSelectedRecord] =
    useState<ArchivePlacement | null>(null)
  const [currentStage, setCurrentStage] = useState<StageInfo>(stageInfo[0])
  const [liveText, setLiveText] = useState('기록 섹션이 준비되었습니다.')
  const sectionRef = useRef<HTMLElement>(null)
  const visualRef = useRef<HTMLDivElement>(null)
  const apparatusRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef(0)
  const progressRef = useRef(0)
  const hasAutoPlayedRef = useRef(false)
  const triggerTimerRef = useRef<number | null>(null)
  const stageIndexRef = useRef(0)
  const selectedRecordRef = useRef<ArchivePlacement | null>(null)
  const recordWrapRefs = useRef(
    new Map<ArchivePlacement, HTMLDivElement>(),
  )
  const recordRefs = useRef(
    new Map<ArchivePlacement, HTMLButtonElement>(),
  )
  const rendererRefs = useRef(
    new Map<ArchivePlacement, ArchiveEmulsionRenderer>(),
  )

  const archive = useMemo(
    () => buildArchiveCollections(images, videos, posters),
    [images, posters, videos],
  )
  const primaryPhoto = archive.photos[0]
  const primaryYear =
    primaryPhoto?.year ?? new Date().getFullYear().toString()

  const records = useMemo<MaterialRecord[]>(() => {
    if (!primaryPhoto) return []

    return [
      { item: primaryPhoto, placement: 'photo' },
      {
        item: archive.posters[0] ?? archive.photos[1] ?? primaryPhoto,
        placement: 'poster',
      },
      {
        item: archive.videos[0] ?? archive.photos[2] ?? primaryPhoto,
        placement: 'video',
      },
    ]
  }, [archive.photos, archive.posters, archive.videos, primaryPhoto])

  const setProgress = useCallback((value: number, announce = false) => {
    const section = sectionRef.current
    if (!section) return

    const progress = clamp(value)
    progressRef.current = progress
    section.style.setProperty('--motion', progress.toFixed(4))

    const copyReveal = 0.72 + 0.28 * easeOut(clamp(progress / 0.34))
    section.style.setProperty('--copy-reveal', copyReveal.toFixed(4))
    section.style.setProperty(
      '--type-rule',
      smooth(0.32, 0.73, progress).toFixed(4),
    )

    const sweep = easeInOut(clamp((progress - 0.04) / 0.68))
    section.style.setProperty(
      '--sweep-x',
      `${mix(-24, 112, sweep).toFixed(2)}%`,
    )
    section.style.setProperty(
      '--sweep-opacity',
      `${smooth(0.03, 0.16, progress) * (1 - smooth(0.73, 0.9, progress))}`,
    )
    section.style.setProperty(
      '--edge-opacity',
      `${smooth(0.08, 0.17, progress) * (1 - smooth(0.69, 0.83, progress))}`,
    )
    section.style.setProperty(
      '--mark-opacity',
      smooth(0.76, 0.98, progress).toFixed(4),
    )

    const nextStage = getStageInfo(progress)
    if (stageIndexRef.current !== nextStage.index) {
      stageIndexRef.current = nextStage.index
      setCurrentStage(nextStage)
      setLiveText(nextStage.copy)
    }

    records.forEach(({ placement }) => {
      const wrap = recordWrapRefs.current.get(placement)
      const record = recordRefs.current.get(placement)
      if (!wrap || !record) return

      const specification = recordSpecs[placement]
      const movement = spring(
        clamp((progress - specification.offset) / 0.62),
      )
      const settle =
        1 +
        Math.sin(clamp((progress - 0.45) / 0.38) * Math.PI) *
          0.012 *
          (1 - smooth(0.74, 0.94, progress))
      const reveal = localProgress(progress, specification.offset)

      wrap.style.setProperty(
        '--motion-x',
        `${mix(specification.dx, 0, movement).toFixed(2)}px`,
      )
      wrap.style.setProperty(
        '--motion-y',
        `${mix(specification.dy, 0, movement).toFixed(2)}px`,
      )
      wrap.style.setProperty(
        '--motion-r',
        `${mix(
          specification.startRotation,
          specification.restingRotation,
          movement,
        ).toFixed(3)}deg`,
      )
      wrap.style.setProperty('--motion-s', settle.toFixed(4))
      record.style.setProperty('--fallback-reveal', reveal.toFixed(4))
      record.style.setProperty(
        '--fallback-mask-left',
        `${(reveal * 100).toFixed(2)}%`,
      )
      record.style.setProperty(
        '--edge-w',
        `${(smooth(0.34, 0.74, reveal) * 100).toFixed(1)}%`,
      )
      record.style.setProperty(
        '--edge-h',
        `${(smooth(0.48, 0.84, reveal) * 100).toFixed(1)}%`,
      )
      record.style.setProperty(
        '--edge-alpha',
        (
          smooth(0.2, 0.38, reveal) *
          (1 - smooth(0.82, 1, reveal)) *
          0.72
        ).toFixed(3),
      )
      record.style.setProperty(
        '--label-opacity',
        smooth(0.56, 0.88, reveal).toFixed(3),
      )
      const renderer = rendererRefs.current.get(placement)
      renderer?.set(
        reveal,
        renderer.pointer,
        selectedRecordRef.current === placement ? 1 : 0,
      )
    })

    if (announce) setLiveText(nextStage.copy)
  }, [records])

  const stopAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    setIsRunning(false)
  }, [])

  const startSequence = useCallback(() => {
    if (!primaryPhoto || hasAutoPlayedRef.current) return

    hasAutoPlayedRef.current = true
    setSelectedRecord(null)

    if (reducedMotion) {
      setProgress(1, true)
      setCurrentStage(stageInfo[3])
      stageIndexRef.current = 3
      return
    }

    setIsRunning(true)
    setLiveText('세 기록의 표면을 한 흐름으로 펼칩니다.')
    startTimeRef.current = performance.now()

    const tick = (now: number) => {
      const progress = (now - startTimeRef.current) / ARCHIVE_DURATION
      if (progress >= 1) {
        setProgress(1, true)
        setCurrentStage(stageInfo[3])
        stageIndexRef.current = 3
        stopAnimation()
        return
      }

      setProgress(progress)
      animationFrameRef.current = window.requestAnimationFrame(tick)
    }

    animationFrameRef.current = window.requestAnimationFrame(tick)
  }, [primaryPhoto, reducedMotion, setProgress, stopAnimation])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setProgress(reducedMotion ? 1 : 0)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [reducedMotion, setProgress])

  useEffect(() => {
    const renderers = new Map<ArchivePlacement, ArchiveEmulsionRenderer>()

    records.forEach(({ placement }) => {
      const record = recordRefs.current.get(placement)
      if (!record) return
      try {
        renderers.set(placement, new ArchiveEmulsionRenderer(record))
      } catch {
        record.classList.remove('webgl-ready')
      }
    })

    rendererRefs.current = renderers
    Promise.all([...renderers.values()].map((renderer) => renderer.ready)).finally(
      () => setProgress(progressRef.current),
    )

    return () => {
      renderers.forEach((renderer) => renderer.destroy())
      rendererRefs.current = new Map()
    }
  }, [records, setProgress])

  useEffect(() => {
    selectedRecordRef.current = selectedRecord
    rendererRefs.current.forEach((renderer, placement) => {
      renderer.set(
        progressRef.current,
        renderer.pointer,
        selectedRecord === placement ? 1 : 0,
      )
    })
  }, [selectedRecord])

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => {
      setReducedMotion(query.matches)
      if (query.matches) {
        stopAnimation()
        hasAutoPlayedRef.current = true
        setProgress(1, true)
        setCurrentStage(stageInfo[3])
        stageIndexRef.current = 3
      }
    }

    query.addEventListener('change', updatePreference)
    return () => query.removeEventListener('change', updatePreference)
  }, [setProgress, stopAnimation])

  useEffect(() => {
    const section = sectionRef.current
    if (!section || !primaryPhoto || reducedMotion || hasAutoPlayedRef.current) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        const sufficientlyVisible =
          entry.isIntersecting &&
          entry.intersectionRatio >= 0.28 &&
          entry.boundingClientRect.top < window.innerHeight * 0.78

        if (!sufficientlyVisible) {
          if (triggerTimerRef.current !== null) {
            window.clearTimeout(triggerTimerRef.current)
            triggerTimerRef.current = null
          }
          return
        }

        if (triggerTimerRef.current === null) {
          triggerTimerRef.current = window.setTimeout(() => {
            triggerTimerRef.current = null
            startSequence()
            observer.disconnect()
          }, 140)
        }
      },
      {
        rootMargin: '8% 0px -10% 0px',
        threshold: [0, 0.18, 0.28, 0.42, 0.6],
      },
    )

    observer.observe(section)
    return () => {
      observer.disconnect()
      if (triggerTimerRef.current !== null) {
        window.clearTimeout(triggerTimerRef.current)
        triggerTimerRef.current = null
      }
    }
  }, [primaryPhoto, reducedMotion, startSequence])

  useEffect(
    () => () => {
      stopAnimation()
      if (triggerTimerRef.current !== null) {
        window.clearTimeout(triggerTimerRef.current)
      }
    },
    [stopAnimation],
  )

  useEffect(() => {
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedRecord(null)
    }
    window.addEventListener('keydown', closeWithEscape)
    return () => window.removeEventListener('keydown', closeWithEscape)
  }, [])

  const handleVisualPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (reducedMotion) return
    const visual = visualRef.current
    const apparatus = apparatusRef.current
    const section = sectionRef.current
    if (!visual || !apparatus || !section) return

    const bounds = visual.getBoundingClientRect()
    const x = clamp((event.clientX - bounds.left) / bounds.width)
    const y = clamp((event.clientY - bounds.top) / bounds.height)
    apparatus.style.setProperty('--local-light-x', `${(x * 100).toFixed(1)}%`)
    apparatus.style.setProperty('--local-light-y', `${(y * 100).toFixed(1)}%`)
    section.style.setProperty('--light-x', `${mix(58, 80, x).toFixed(1)}%`)
    section.style.setProperty('--light-y', `${mix(18, 40, y).toFixed(1)}%`)
    section.style.setProperty('--light-x-num', mix(58, 80, x).toFixed(1))
  }

  const resetVisualPointer = () => {
    apparatusRef.current?.style.setProperty('--local-light-x', '62%')
    apparatusRef.current?.style.setProperty('--local-light-y', '30%')
    sectionRef.current?.style.setProperty('--light-x', '72%')
    sectionRef.current?.style.setProperty('--light-y', '24%')
  }

  const handleRecordPointerMove = (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    if (reducedMotion || isRunning) return
    const record = event.currentTarget
    const bounds = record.getBoundingClientRect()
    const x = clamp((event.clientX - bounds.left) / bounds.width)
    const y = clamp((event.clientY - bounds.top) / bounds.height)
    record.style.setProperty('--tilt-x', `${((0.5 - y) * 3.2).toFixed(2)}deg`)
    record.style.setProperty('--tilt-y', `${((x - 0.5) * 3.8).toFixed(2)}deg`)
    record.style.setProperty('--spec-x', `${(x * 100).toFixed(1)}%`)
    record.style.setProperty('--spec-opacity', '0.48')
    const placement = record.dataset.id as ArchivePlacement
    rendererRefs.current
      .get(placement)
      ?.set(
        localProgress(progressRef.current, recordSpecs[placement].offset),
        [(x - 0.5) * 2, (y - 0.5) * 2],
        selectedRecord === placement ? 1 : 0,
      )
  }

  const resetRecordPointer = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const record = event.currentTarget
    record.style.setProperty('--tilt-x', '0deg')
    record.style.setProperty('--tilt-y', '0deg')
    record.style.setProperty('--spec-opacity', '0')
    const placement = record.dataset.id as ArchivePlacement
    rendererRefs.current
      .get(placement)
      ?.set(
        localProgress(progressRef.current, recordSpecs[placement].offset),
        [0, 0],
        selectedRecord === placement ? 1 : 0,
      )
  }

  if (!primaryPhoto) {
    return <EmptyState description={emptyDescription} title={emptyTitle} />
  }

  return (
    <section
      aria-busy={isRunning}
      aria-label={`${eyebrow} 기록 모션그래픽`}
      className={`archive archive-exposure${
        selectedRecord ? ' is-focused' : ''
      }${isRunning ? ' is-running' : ''}`}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
      ref={sectionRef}
    >
      <div aria-hidden="true" className="archive__topline">
        <span>Archive material study · {primaryYear}</span>
        <span>Photo / Poster / Video</span>
      </div>

      <div className="archive__layout">
        <div className="archive__copy">
          <span aria-hidden="true" className="archive__ghost-year">
            {primaryYear}
          </span>
          <p className="archive__eyebrow">{eyebrow} · Material 01</p>
          <span className="archive__year">{primaryYear}</span>
          <h2 className="archive__title">
            <span className="archive__title-line">
              <span>한 번의 무대는</span>
            </span>
            <span className="archive__title-line">
              <span className="archive__title-emphasis">세 가지 기록으로</span>
            </span>
            <span className="archive__title-line">
              <span>오래 남습니다</span>
            </span>
          </h2>
          <p className="archive__body">
            <strong>
              사진은 순간을 붙잡고, 포스터는 사람을 부르며, 영상은 마지막
              음 이후의 시간을 이어갑니다.
            </strong>{' '}
            {description}
          </p>
          <dl className="archive__meta">
            <div>
              <dt>Collection</dt>
              <dd>Seoul Motet Youth Choir</dd>
            </div>
            <div>
              <dt>Material</dt>
              <dd>Photo · Poster · Video / original ratio</dd>
            </div>
            <div>
              <dt>Archive no.</dt>
              <dd>SMY—{primaryYear} / 001–003</dd>
            </div>
          </dl>
          <p aria-live="polite" className="archive__focus-copy">
            {selectedRecord ? focusCopy[selectedRecord] : ''}
          </p>
          <div className="archive__actions">
            <TransitionLink className="archive__secondary" to="/gallery">
              <span>{buttonLabel}</span>
              <span aria-hidden="true">↗</span>
            </TransitionLink>
          </div>
        </div>

        <div
          className="archive__visual"
          onPointerLeave={resetVisualPointer}
          onPointerMove={handleVisualPointerMove}
          ref={visualRef}
        >
          <div
            className="apparatus"
            data-selected={selectedRecord ?? undefined}
            ref={apparatusRef}
          >
            <div aria-hidden="true" className="apparatus__head">
              <span>SMY / Archive material system</span>
              <span>03 — 03</span>
            </div>
            <div aria-hidden="true" className="apparatus__surface" />
            <div aria-hidden="true" className="exposure-field" />
            <div aria-label="사진, 포스터, 영상 기록" className="records">
              {records.map(({ item, placement }, index) => (
                <div
                  className={`record-wrap record-wrap--${placement}`}
                  data-record={placement}
                  key={`${item.id}-${placement}`}
                  ref={(node) => {
                    if (node) recordWrapRefs.current.set(placement, node)
                    else recordWrapRefs.current.delete(placement)
                  }}
                >
                  <button
                    aria-label={`${item.title} ${
                      placement === 'photo'
                        ? '사진'
                        : placement === 'poster'
                          ? '포스터'
                          : '영상'
                    } 기록 자세히 보기`}
                    aria-pressed={selectedRecord === placement}
                    className={`record${
                      selectedRecord === placement ? ' is-selected' : ''
                    }`}
                    data-id={placement}
                    onClick={() => {
                      if (isRunning) return
                      setSelectedRecord((current) =>
                        current === placement ? null : placement,
                      )
                    }}
                    onPointerLeave={resetRecordPointer}
                    onPointerMove={handleRecordPointerMove}
                    ref={(node) => {
                      if (node) recordRefs.current.set(placement, node)
                      else recordRefs.current.delete(placement)
                    }}
                    type="button"
                  >
                    <span className="record__media">
                      <ArchiveMedia
                        item={item}
                        placement={placement}
                        priority={index === 0}
                      />
                      {placement === 'video' ? (
                        <span aria-hidden="true" className="record__play">
                          ▶
                        </span>
                      ) : null}
                    </span>
                    <span className="record__medium-tag">
                      {materialLabels[placement]}
                    </span>
                    <span aria-hidden="true" className="record__edge" />
                    <span className="record__caption">
                      <b>
                        {String(index + 1).padStart(2, '0')} /{' '}
                        {placement === 'photo'
                          ? '사진'
                          : placement === 'poster'
                            ? '포스터'
                            : '영상'}
                      </b>
                      <small>{item.title}</small>
                    </span>
                  </button>
                </div>
              ))}
            </div>
            <span aria-hidden="true" className="archive-mark">
              one stage · three durations
            </span>
            <button
              aria-label="기록 확대 닫기"
              className="archive__close"
              onClick={() => setSelectedRecord(null)}
              type="button"
            >
              ×
            </button>
            <div aria-hidden="true" className="apparatus__foot">
              <span>Material registration / continuous exposure</span>
              <span>SMY — {primaryYear}</span>
            </div>
          </div>
        </div>
      </div>

      <div aria-hidden="true" className="archive__footer">
        <span>{currentStage.code}</span>
        <div className="archive__timeline">
          <span className="archive__track" />
          <span className="archive__fill" />
          <span className="archive__nodes">
            {[0, 1, 2].map((index) => (
              <i
                className={currentStage.index >= index ? 'is-active' : undefined}
                key={index}
              />
            ))}
          </span>
        </div>
        <span className="archive__footer-copy">{currentStage.copy}</span>
      </div>

      <p aria-live="polite" className="sr-only">
        {liveText}
      </p>
    </section>
  )
}
