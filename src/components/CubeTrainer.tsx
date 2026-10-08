import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { Check, ChevronRight, Hand, Play, RotateCcw, Shuffle, Undo2 } from 'lucide-react'
import { applyAlgorithm, applyMove, createSolvedCube, FACE_COLORS, FACE_NAMES, generateScramble, inverseMove, invertAlgorithm, isCubeSolved, parseAlgorithm, turnDefinition, type CubeState, type Face, type Move, type Sticker, type Vector } from '../lib/cube'
import './CubeTrainer.css'

export interface CubeTrainerProps {
  /** Decorative, draggable cube without the training controls. */
  compact?: boolean
  /** Prepares the inverse setup, so playing this algorithm solves the case. */
  algorithm?: string
}

interface CubeView {
  animate: (move: Move, current: CubeState, next: CubeState) => Promise<void>
  sync: (state: CubeState) => void
  resetView: () => void
}

function makeStickerGeometry() {
  const half = 0.416
  const radius = 0.075
  const shape = new THREE.Shape()
  shape.moveTo(-half + radius, -half)
  shape.lineTo(half - radius, -half)
  shape.quadraticCurveTo(half, -half, half, -half + radius)
  shape.lineTo(half, half - radius)
  shape.quadraticCurveTo(half, half, half - radius, half)
  shape.lineTo(-half + radius, half)
  shape.quadraticCurveTo(-half, half, -half, half - radius)
  shape.lineTo(-half, -half + radius)
  shape.quadraticCurveTo(-half, -half, -half + radius, -half)
  return new THREE.ShapeGeometry(shape, 6)
}

function initialCube(algorithm?: string) {
  try { return algorithm ? applyAlgorithm(createSolvedCube(), invertAlgorithm(algorithm)) : createSolvedCube() }
  catch { return createSolvedCube() }
}

function netOrder(face: Face, sticker: Sticker) {
  const [x, y, z] = sticker.position
  if (face === 'U') return (z + 1) * 3 + x + 1
  if (face === 'D') return (1 - z) * 3 + x + 1
  const column = face === 'F' ? x : face === 'R' ? -z : face === 'B' ? -x : z
  return (1 - y) * 3 + column + 1
}

export default function CubeTrainer({ compact = false, algorithm }: CubeTrainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<CubeView | null>(null)
  const stateRef = useRef<CubeState>(initialCube(algorithm))
  const mountedRef = useRef(true)
  const runningRef = useRef(false)
  const runEpoch = useRef(0)
  const [cubeState, setCubeState] = useState<CubeState>(stateRef.current)
  const [history, setHistory] = useState<Move[]>([])
  const [inverse, setInverse] = useState(false)
  const [busy, setBusy] = useState(false)
  const [currentMove, setCurrentMove] = useState('')
  const [error, setError] = useState('')
  const [webglAvailable, setWebglAvailable] = useState(true)
  const solved = isCubeSolved(cubeState)

  useEffect(() => {
    mountedRef.current = true
    const container = containerRef.current
    if (!container) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
    } catch {
      setWebglAvailable(false)
      return () => { mountedRef.current = false }
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.setAttribute('aria-label', 'Interactive three-dimensional Rubik’s cube. Drag to rotate the view.')
    renderer.domElement.setAttribute('role', 'img')
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-3, 3, 3, -3, 0.1, 100)
    camera.position.set(5.3, 4.4, 7)
    camera.lookAt(0, 0, 0)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.enablePan = false
    controls.enableZoom = false
    controls.rotateSpeed = 0.65
    controls.saveState()
    scene.add(new THREE.AmbientLight(0xffffff, 2.2))
    const sunlight = new THREE.DirectionalLight(0xffffff, 3.1)
    sunlight.position.set(-3, 7, 8)
    scene.add(sunlight)
    const fill = new THREE.DirectionalLight(0xffffff, 0.9)
    fill.position.set(6, 3, -3)
    scene.add(fill)
    const root = new THREE.Group()
    scene.add(root)

    const bodyGeometry = new RoundedBoxGeometry(0.976, 0.976, 0.976, 3, 0.058)
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: '#262c25', roughness: 0.48, metalness: 0.08 })
    const stickerGeometry = makeStickerGeometry()
    const stickerMaterials = Object.fromEntries(Object.entries(FACE_COLORS).map(([face, color]) => [face, new THREE.MeshStandardMaterial({ color, roughness: 0.65 })])) as Record<Face, THREE.MeshStandardMaterial>
    const bodies: { mesh: THREE.Mesh; position: Vector }[] = []
    for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
      if (x === 0 && y === 0 && z === 0) continue
      const mesh = new THREE.Mesh(bodyGeometry, bodyMaterial)
      mesh.position.set(x, y, z)
      root.add(mesh)
      bodies.push({ mesh, position: [x, y, z] })
    }
    const stickers = new Map<string, THREE.Mesh>()
    for (const sticker of stateRef.current) {
      const mesh = new THREE.Mesh(stickerGeometry, stickerMaterials[sticker.color])
      stickers.set(sticker.id, mesh)
      root.add(mesh)
    }
    const forward = new THREE.Vector3(0, 0, 1)
    const sync = (state: CubeState) => {
      bodies.forEach(({ mesh, position }) => {
        mesh.position.set(...position)
        mesh.quaternion.identity()
      })
      for (const sticker of state) {
        const mesh = stickers.get(sticker.id)!
        const normal = new THREE.Vector3(...sticker.normal)
        mesh.position.set(...sticker.position).addScaledVector(normal, 0.493)
        mesh.quaternion.setFromUnitVectors(forward, normal)
      }
    }
    sync(stateRef.current)

    let animation: { start: number; duration: number; angle: number; axis: number; pivot: THREE.Group; meshes: THREE.Mesh[]; next: CubeState; done: () => void } | null = null
    viewRef.current = {
      sync: (state) => {
        if (animation) {
          const cancelled = animation
          cancelled.meshes.forEach((mesh) => root.attach(mesh))
          root.remove(cancelled.pivot)
          animation = null
          cancelled.done()
        }
        sync(state)
      },
      resetView: () => { controls.reset() },
      animate: (move, current, next) => new Promise<void>((resolve) => {
        const { axis, layers, direction, turns } = turnDefinition(move)
        const pivot = new THREE.Group()
        root.add(pivot)
        const meshes = [
          ...bodies.filter(({ position }) => layers.includes(position[axis])).map(({ mesh }) => mesh),
          ...current.filter((sticker) => layers.includes(sticker.position[axis])).map((sticker) => stickers.get(sticker.id)!),
        ]
        root.updateMatrixWorld(true)
        meshes.forEach((mesh) => pivot.attach(mesh))
        animation = { start: performance.now(), duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 230 * turns, angle: direction * turns * Math.PI / 2, axis, pivot, meshes, next, done: resolve }
      }),
    }

    const resize = () => {
      const width = container.clientWidth
      const height = container.clientHeight
      if (!width || !height) return
      renderer.setSize(width, height)
      const aspect = width / height
      const half = compact ? 2.75 : 2.9
      camera.left = -half * Math.max(aspect, 1)
      camera.right = half * Math.max(aspect, 1)
      camera.top = half * Math.max(1 / aspect, 1)
      camera.bottom = -half * Math.max(1 / aspect, 1)
      camera.updateProjectionMatrix()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    resize()
    let frame = 0
    let visible = true
    const visibilityObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting })
    visibilityObserver.observe(container)
    const render = (now: number) => {
      frame = requestAnimationFrame(render)
      if (!visible && !animation) return
      if (animation) {
        const progress = Math.min((now - animation.start) / animation.duration, 1)
        const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2
        animation.pivot.rotation.set(0, 0, 0)
        if (animation.axis === 0) animation.pivot.rotation.x = animation.angle * eased
        else if (animation.axis === 1) animation.pivot.rotation.y = animation.angle * eased
        else animation.pivot.rotation.z = animation.angle * eased
        if (progress === 1) {
          const finished = animation
          finished.meshes.forEach((mesh) => root.attach(mesh))
          root.remove(finished.pivot)
          sync(finished.next)
          animation = null
          finished.done()
        }
      }
      controls.update()
      renderer.render(scene, camera)
    }
    frame = requestAnimationFrame(render)
    return () => {
      mountedRef.current = false
      runEpoch.current++
      viewRef.current = null
      cancelAnimationFrame(frame)
      observer.disconnect()
      visibilityObserver.disconnect()
      controls.dispose()
      animation?.done()
      bodyGeometry.dispose()
      stickerGeometry.dispose()
      bodyMaterial.dispose()
      Object.values(stickerMaterials).forEach((material) => material.dispose())
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [compact])

  useEffect(() => {
    runEpoch.current++
    runningRef.current = false
    setBusy(false)
    setCurrentMove('')
    const state = initialCube(algorithm)
    stateRef.current = state
    setCubeState(state)
    setHistory([])
    setError('')
    viewRef.current?.sync(state)
  }, [algorithm])

  async function runMoves(moves: Move[], undo = false) {
    if (runningRef.current || !moves.length) return
    runningRef.current = true
    const epoch = runEpoch.current
    setBusy(true)
    setError('')
    try {
      for (const move of moves) {
        if (!mountedRef.current || epoch !== runEpoch.current) break
        setCurrentMove(move)
        const current = stateRef.current
        const next = applyMove(current, move)
        await viewRef.current?.animate(move, current, next)
        if (!mountedRef.current || epoch !== runEpoch.current) break
        stateRef.current = next
        setCubeState(next)
        setHistory((previous) => undo ? previous.slice(0, -1) : [...previous, move])
      }
    } finally {
      if (epoch === runEpoch.current) runningRef.current = false
      if (mountedRef.current && epoch === runEpoch.current) {
        setBusy(false)
        setCurrentMove('')
      }
    }
  }

  function reset() {
    if (runningRef.current) return
    const state = initialCube(algorithm)
    stateRef.current = state
    setCubeState(state)
    setHistory([])
    setError('')
    viewRef.current?.sync(state)
    viewRef.current?.resetView()
  }

  function runAlgorithm() {
    try { void runMoves(parseAlgorithm(algorithm ?? "R U R' U'")) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'This algorithm could not be read.') }
  }

  return (
    <div className={`cube-trainer${compact ? ' cube-trainer--compact' : ''}`}>
      <div className="cube-stage">
        {!compact && <div className="cube-stage-topline"><span className={`cube-state-label${solved ? ' cube-state-label--solved' : ''}`}>{solved ? <Check size={13} /> : <span className="cube-status-dot" />}{solved ? 'Solved state' : 'Practice in progress'}</span><button className="cube-view-reset" onClick={() => viewRef.current?.resetView()} aria-label="Reset cube viewing angle"><RotateCcw size={15} /></button></div>}
        <div className="cube-canvas" ref={containerRef} />
        {!webglAvailable && <div className="cube-fallback"><div className="cube-net">{(['U', 'L', 'F', 'R', 'B', 'D'] as Face[]).map((face) => <div key={face} className={`cube-net-face cube-net-face--${face}`} aria-label={`${FACE_NAMES[face]} face`}>{cubeState.filter((sticker) => sticker.normal.join() === ({ U: '0,1,0', D: '0,-1,0', R: '1,0,0', L: '-1,0,0', F: '0,0,1', B: '0,0,-1' }[face])).sort((a, b) => netOrder(face, a) - netOrder(face, b)).map((sticker) => <i key={sticker.id} style={{ background: FACE_COLORS[sticker.color] }} />)}</div>)}</div><span>3D is unavailable in this browser. All moves still work in this 2D view.</span></div>}
        {!compact && <div className="cube-stage-hint"><Hand size={14} /> Drag to explore every side <span>•</span> <span className="cube-front-indicator" /> Green is the front</div>}
        {!compact && currentMove && <div className="cube-active-move" aria-live="polite">{currentMove}</div>}
      </div>
      {!compact && <div className="cube-controls">
        <div className="cube-controls-heading"><div><span className="cube-eyebrow">YOUR MOVE</span><h3>Get a feel for the cube.</h3></div><button className={`cube-prime-toggle${inverse ? ' cube-prime-toggle--active' : ''}`} aria-pressed={inverse} onClick={() => setInverse(!inverse)} disabled={busy}>Prime <span>′</span></button></div>
        <p className="cube-explanation">Each letter turns one face. {inverse ? 'Prime (′) means counterclockwise.' : 'Turn clockwise as if you’re looking straight at that face.'}</p>
        <div className="cube-face-buttons">{(['U', 'R', 'F', 'D', 'L', 'B'] as Face[]).map((face) => <button key={face} disabled={busy} onClick={() => void runMoves([`${face}${inverse ? "'" : ''}` as Move])} aria-label={`Turn ${FACE_NAMES[face].toLowerCase()} face ${inverse ? 'counterclockwise' : 'clockwise'}`}><span>{face}{inverse ? '′' : ''}</span><small>{FACE_NAMES[face]}</small></button>)}</div>
        <div className="cube-action-buttons"><button disabled={busy} onClick={() => void runMoves(generateScramble())}><Shuffle size={15} /> Scramble</button><button disabled={busy || !history.length} onClick={() => void runMoves([inverseMove(history[history.length - 1])], true)}><Undo2 size={15} /> Undo</button><button disabled={busy} onClick={reset}><RotateCcw size={15} /> {algorithm ? 'Set up case' : 'Reset'}</button></div>
        <div className="cube-algorithm-demo"><div><span className="cube-eyebrow">{algorithm ? 'ALGORITHM PREVIEW' : 'TRY YOUR FIRST PATTERN'}</span><code>{algorithm ?? "R U R′ U′"}</code></div><button onClick={runAlgorithm} disabled={busy} aria-label="Run algorithm"><Play size={14} fill="currentColor" /> {busy ? 'Playing…' : 'Play'}</button></div>
        <div className="cube-move-history"><span>Move history <b>{history.length}</b></span><div aria-live="polite">{history.length ? history.slice(-18).map((move, index) => <code key={`${history.length - Math.min(history.length, 18) + index}`}>{move}</code>) : <span className="cube-history-placeholder">Your practice starts with one move <ChevronRight size={13} /></span>}</div></div>
        {error && <p className="cube-error" role="alert">{error}</p>}
      </div>}
    </div>
  )
}
