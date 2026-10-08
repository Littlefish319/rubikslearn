import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { Check, ChevronLeft, ChevronRight, Hand, Pause, Play, RotateCcw, Shuffle, Undo2 } from 'lucide-react'
import { applyAlgorithm, applyMove, createSolvedCube, FACE_COLORS, FACE_NAMES, generateScramble, inverseMove, invertAlgorithm, isCubeSolved, parseAlgorithm, trainingTargetStickerIds, turnDefinition, type CubeState, type Face, type Move, type Sticker, type Vector } from '../lib/cube'
import './CubeTrainer.css'

export interface CubeTrainerProps {
  /** Decorative, draggable cube without the training controls. */
  compact?: boolean
  /** Prepares the inverse setup, so playing this algorithm solves the case. */
  algorithm?: string
  /** One guided turn at a time, with the move translated into plain language. */
  coach?: boolean
  /** Algorithm cases use the usual CFOP grip: white down, yellow up. */
  orientation?: 'white-top' | 'yellow-top'
  /** Track the cubies being trained while leaving other colors visible. */
  focus?: 'cross' | 'f2l' | 'oll' | 'pll'
}

type PlaybackSpeed = 'slow' | 'normal' | 'fast'
const TURN_DURATION: Record<PlaybackSpeed, number> = { slow: 720, normal: 360, fast: 170 }
const YELLOW_TOP_COLORS: Record<Face, string> = { ...FACE_COLORS, U: FACE_COLORS.D, D: FACE_COLORS.U }

function describeMove(move: Move) {
  const face = move[0]
  const direction = move.endsWith('2') ? 'half a turn (180°)' : move.endsWith("'") ? 'counterclockwise' : 'clockwise'
  const faces: Record<string, string> = { U: 'top', R: 'right', F: 'front', D: 'bottom', L: 'left', B: 'back' }
  if (faces[face]) return { action: `Turn the ${faces[face]} face ${direction}.`, detail: `Judge the direction while looking straight at the ${faces[face]} face. Keep the rest of the cube still.` }
  if (faces[face.toUpperCase()]) return { action: `Turn the ${faces[face.toUpperCase()]} two layers ${direction}.`, detail: 'A lowercase letter is a wide turn: move the outer face and its neighboring middle layer together.' }
  const slices: Record<string, string> = { M: 'middle vertical slice, in the direction of a left-face turn', E: 'middle horizontal slice, in the direction of a bottom-face turn', S: 'middle depth slice, in the direction of a front-face turn' }
  if (slices[face]) return { action: `Turn the ${slices[face]}${move.endsWith('2') ? ', twice' : move.endsWith("'") ? ', reversed' : ''}.`, detail: 'Only the middle layer moves. The two outside layers stay still.' }
  const rotations: Record<string, string> = { x: 'right', y: 'top', z: 'front' }
  return { action: `Rotate the whole cube ${direction}, as if turning its ${rotations[face]} face.`, detail: 'This changes your grip. Move the whole cube, then read later face letters from the new orientation.' }
}

interface CubeView {
  animate: (move: Move, current: CubeState, next: CubeState) => Promise<void>
  sync: (state: CubeState) => void
  resetView: () => void
  setHighlight: (enabled: boolean) => void
}

function stickerShape(half = 0.416, radius = 0.075) {
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
  return shape
}

function makeStickerGeometry() {
  return new THREE.ShapeGeometry(stickerShape(), 6)
}

function makeTargetRingGeometry() {
  const ring = stickerShape()
  ring.holes.push(stickerShape(0.369, 0.052))
  return new THREE.ShapeGeometry(ring, 6)
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

export default function CubeTrainer({ compact = false, algorithm, coach = false, orientation = algorithm || coach ? 'yellow-top' : 'white-top', focus }: CubeTrainerProps) {
  const caseAlgorithm = algorithm ?? (coach ? "R U R' U'" : undefined)
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<CubeView | null>(null)
  const stateRef = useRef<CubeState>(initialCube(caseAlgorithm))
  const mountedRef = useRef(true)
  const runningRef = useRef(false)
  const runEpoch = useRef(0)
  const pauseRef = useRef(false)
  const stepRef = useRef(0)
  const speedRef = useRef<PlaybackSpeed>(coach ? 'slow' : 'normal')
  const highlightRef = useRef(true)
  const [cubeState, setCubeState] = useState<CubeState>(stateRef.current)
  const [history, setHistory] = useState<Move[]>([])
  const [inverse, setInverse] = useState(false)
  const [busy, setBusy] = useState(false)
  const [currentMove, setCurrentMove] = useState('')
  const [error, setError] = useState('')
  const [webglAvailable, setWebglAvailable] = useState(true)
  const [completedMoves, setCompletedMoves] = useState(0)
  const [activeStep, setActiveStep] = useState<number | null>(null)
  const [pauseRequested, setPauseRequested] = useState(false)
  const [speed, setSpeed] = useState<PlaybackSpeed>(speedRef.current)
  const [highlightTargets, setHighlightTargets] = useState(true)
  const targetStickerIds = useMemo(() => coach && (focus === 'cross' || focus === 'f2l') ? trainingTargetStickerIds(focus) : new Set<string>(), [coach, focus])
  const hasTargets = targetStickerIds.size > 0
  const algorithmMoves = useMemo(() => { try { return parseAlgorithm(algorithm ?? "R U R' U'") } catch { return [] } }, [algorithm])
  const palette = orientation === 'yellow-top' ? YELLOW_TOP_COLORS : FACE_COLORS
  const focusIndex = activeStep ?? completedMoves
  const focusMove = algorithmMoves[focusIndex]
  const moveDescription = focusMove ? describeMove(focusMove) : null
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
    const stickerMaterials = Object.fromEntries(Object.entries(palette).map(([face, color]) => [face, new THREE.MeshStandardMaterial({ color, roughness: 0.65 })])) as Record<Face, THREE.MeshStandardMaterial>
    const dimmedMaterials = Object.fromEntries(Object.entries(palette).map(([face, color]) => [face, new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.64), roughness: 0.65 })])) as Record<Face, THREE.MeshStandardMaterial>
    const targetRingGeometry = makeTargetRingGeometry()
    const targetRingMaterial = new THREE.MeshBasicMaterial({ color: '#8b4dd5', depthWrite: false })
    const targetRings: THREE.Mesh[] = []
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
      if (targetStickerIds.has(sticker.id)) {
        const ring = new THREE.Mesh(targetRingGeometry, targetRingMaterial)
        ring.position.z = 0.006
        mesh.add(ring)
        targetRings.push(ring)
      }
    }
    const setHighlight = (enabled: boolean) => {
      targetRings.forEach((ring) => { ring.visible = enabled })
      for (const sticker of stateRef.current) {
        stickers.get(sticker.id)!.material = enabled && targetStickerIds.size > 0 && !targetStickerIds.has(sticker.id) ? dimmedMaterials[sticker.color] : stickerMaterials[sticker.color]
      }
    }
    setHighlight(highlightRef.current)
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
      setHighlight,
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
        animation = { start: performance.now(), duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : TURN_DURATION[speedRef.current] * turns, angle: direction * turns * Math.PI / 2, axis, pivot, meshes, next, done: resolve }
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
      Object.values(dimmedMaterials).forEach((material) => material.dispose())
      targetRingGeometry.dispose()
      targetRingMaterial.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [compact, orientation, targetStickerIds])

  useEffect(() => {
    highlightRef.current = highlightTargets
    viewRef.current?.setHighlight(highlightTargets)
  }, [highlightTargets])

  useEffect(() => {
    runEpoch.current++
    runningRef.current = false
    pauseRef.current = false
    stepRef.current = 0
    setBusy(false)
    setPauseRequested(false)
    setCompletedMoves(0)
    setActiveStep(null)
    setCurrentMove('')
    const state = initialCube(caseAlgorithm)
    stateRef.current = state
    setCubeState(state)
    setHistory([])
    setError('')
    viewRef.current?.sync(state)
  }, [caseAlgorithm, coach, orientation, focus])

  async function runMoves(moves: Move[], undo = false, guidedDirection?: 1 | -1) {
    if (runningRef.current || !moves.length) return
    runningRef.current = true
    pauseRef.current = false
    setPauseRequested(false)
    const epoch = runEpoch.current
    setBusy(true)
    setError('')
    try {
      for (const move of moves) {
        if (!mountedRef.current || epoch !== runEpoch.current || pauseRef.current) break
        setCurrentMove(move)
        if (guidedDirection) setActiveStep(stepRef.current + (guidedDirection === -1 ? -1 : 0))
        const current = stateRef.current
        const next = applyMove(current, move)
        if (viewRef.current) await viewRef.current.animate(move, current, next)
        else if (coach) await new Promise<void>((resolve) => window.setTimeout(resolve, TURN_DURATION[speedRef.current]))
        if (!mountedRef.current || epoch !== runEpoch.current) break
        stateRef.current = next
        setCubeState(next)
        setHistory((previous) => undo ? previous.slice(0, -1) : [...previous, move])
        if (guidedDirection) {
          stepRef.current += guidedDirection
          setCompletedMoves(stepRef.current)
        }
      }
    } finally {
      if (epoch === runEpoch.current) runningRef.current = false
      if (mountedRef.current && epoch === runEpoch.current) {
        setBusy(false)
        setPauseRequested(false)
        setCurrentMove('')
        setActiveStep(null)
      }
    }
  }

  function reset() {
    if (runningRef.current) return
    const state = initialCube(caseAlgorithm)
    stateRef.current = state
    setCubeState(state)
    setHistory([])
    stepRef.current = 0
    setCompletedMoves(0)
    setActiveStep(null)
    setError('')
    viewRef.current?.sync(state)
    viewRef.current?.resetView()
  }

  function runAlgorithm() {
    try {
      if (algorithm) reset()
      void runMoves(parseAlgorithm(algorithm ?? "R U R' U'"))
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'This algorithm could not be read.') }
  }

  function playCoach(replay = false) {
    if (runningRef.current) return
    if (replay) reset()
    void runMoves(algorithmMoves.slice(stepRef.current), false, 1)
  }

  function pauseCoach() {
    pauseRef.current = true
    setPauseRequested(true)
  }

  function changeSpeed(value: PlaybackSpeed) {
    speedRef.current = value
    setSpeed(value)
  }

  return (
    <div className={`cube-trainer${compact ? ' cube-trainer--compact' : ''}${coach ? ' cube-trainer--coach' : ''}${compact && algorithm ? ' cube-trainer--compact-case' : ''}`}>
      <div className="cube-stage">
        {!compact && <div className="cube-stage-topline"><span className={`cube-state-label${solved ? ' cube-state-label--solved' : ''}`}>{solved ? <Check size={13} /> : <span className="cube-status-dot" />}{solved ? 'Solved state' : 'Practice in progress'}</span><button className="cube-view-reset" onClick={() => viewRef.current?.resetView()} aria-label="Reset cube viewing angle"><RotateCcw size={15} /></button></div>}
        <div className="cube-canvas" ref={containerRef} />
        {!webglAvailable && <div className="cube-fallback"><div className="cube-net">{(['U', 'L', 'F', 'R', 'B', 'D'] as Face[]).map((face) => <div key={face} className={`cube-net-face cube-net-face--${face}`} aria-label={`${FACE_NAMES[face]} face`}>{cubeState.filter((sticker) => sticker.normal.join() === ({ U: '0,1,0', D: '0,-1,0', R: '1,0,0', L: '-1,0,0', F: '0,0,1', B: '0,0,-1' }[face])).sort((a, b) => netOrder(face, a) - netOrder(face, b)).map((sticker) => <i key={sticker.id} className={hasTargets && highlightTargets ? targetStickerIds.has(sticker.id) ? 'cube-target-sticker' : 'cube-muted-sticker' : undefined} style={{ background: palette[sticker.color] }} />)}</div>)}</div><span>3D is unavailable in this browser. All moves still work in this 2D view.</span></div>}
        {!compact && <div className="cube-stage-hint"><Hand size={14} /> Drag to explore <span>•</span> Start grip: {orientation === 'yellow-top' ? 'yellow' : 'white'} top, green front</div>}
        {!compact && currentMove && <div className="cube-active-move" aria-live="polite">{currentMove}</div>}
      </div>
      {coach && <div className="cube-coach-controls cube-controls">
        <div className="cube-controls-heading"><div><span className="cube-eyebrow">GUIDED ALGORITHM</span><h3>One turn at a time.</h3></div><span className="cube-coach-count">{completedMoves} / {algorithmMoves.length}</span></div>
        <p className="cube-coach-grip"><i style={{ background: palette.U }} />{orientation === 'yellow-top' ? 'Yellow' : 'White'} on top <span>·</span><i style={{ background: palette.F }} />Green toward you</p>
        {hasTargets && <div className="cube-target-guide"><label><input type="checkbox" checked={highlightTargets} onChange={(event) => setHighlightTargets(event.target.checked)} />{focus === 'f2l' ? 'Highlight target pair' : 'Highlight cross edges'}</label><p><i />Target: {focus === 'f2l' ? 'front-right corner + edge' : `four ${orientation === 'yellow-top' ? 'white' : 'yellow'} cross edges`}</p><small>The violet border follows these pieces through every turn.</small></div>}
        <div className="cube-coach-moves" aria-label="Algorithm move progress">{algorithmMoves.map((move, index) => <span key={`${index}-${move}`} aria-current={index === focusIndex ? 'step' : undefined} className={`${index < completedMoves ? 'is-complete ' : ''}${index === focusIndex ? 'is-current' : ''}`}><small>{index + 1}</small>{move}</span>)}</div>
        <div className="cube-coach-instruction" aria-live="polite">
          {focusMove && moveDescription ? <><span className="cube-coach-letter">{focusMove}</span><div><span className="cube-eyebrow">MOVE {focusIndex + 1}</span><h4>{moveDescription.action}</h4><p>{moveDescription.detail}</p></div></> : <><span className="cube-coach-letter"><Check size={25} /></span><div><span className="cube-eyebrow">SEQUENCE COMPLETE</span><h4>{solved ? 'You solved this practice case.' : 'All moves complete.'}</h4><p>Replay it slowly, then try the sequence on your own cube.</p></div></>}
        </div>
        <div className="cube-coach-step-buttons"><button disabled={busy || completedMoves === 0} onClick={() => void runMoves([inverseMove(algorithmMoves[completedMoves - 1])], true, -1)}><ChevronLeft size={16} /> Previous move</button><button disabled={busy || completedMoves >= algorithmMoves.length} onClick={() => void runMoves([algorithmMoves[completedMoves]], false, 1)}>Next move <ChevronRight size={16} /></button></div>
        <div className="cube-coach-playback"><button disabled={pauseRequested || !algorithmMoves.length || (!busy && completedMoves === algorithmMoves.length)} onClick={() => busy ? pauseCoach() : playCoach()}>{busy ? <Pause size={15} /> : <Play size={15} />}{pauseRequested ? 'Pausing…' : busy ? 'Pause' : completedMoves === algorithmMoves.length ? 'Complete' : completedMoves ? 'Play remaining' : 'Play all'}</button><button disabled={busy || !algorithmMoves.length} onClick={() => playCoach(true)}><RotateCcw size={15} /> Replay</button><button disabled={busy} onClick={reset}><Undo2 size={15} /> Reset case</button></div>
        <label className="cube-coach-speed">Playback speed<select value={speed} onChange={(event) => changeSpeed(event.target.value as PlaybackSpeed)}><option value="slow">Slow — learn the turn</option><option value="normal">Normal — follow along</option><option value="fast">Fast — review the sequence</option></select></label>
        <p className="cube-coach-note">The simulator starts from the exact setup for this sequence. On a real cube, use the setup shown in the lesson first.</p>
        {error && <p className="cube-error" role="alert">{error}</p>}
      </div>}
      {compact && algorithm && !coach && <div className="cube-compact-controls"><p>Start grip: {orientation === 'yellow-top' ? 'yellow' : 'white'} top · green front</p><div><button disabled={busy} onClick={runAlgorithm}><Play size={14} />{busy ? 'Playing…' : 'Play algorithm'}</button><button disabled={busy} onClick={reset}><RotateCcw size={14} />Set up case</button></div>{currentMove && <span aria-live="polite">Current turn: {currentMove}</span>}{error && <p className="cube-error" role="alert">{error}</p>}</div>}
      {!compact && !coach && <div className="cube-controls">
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
