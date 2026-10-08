import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown, Copy, Eraser, LoaderCircle, RotateCcw, Shuffle } from 'lucide-react'
import { applyAlgorithm, createSolvedCube, isCubeSolved, type CubeState, type Face } from '../lib/cube'
import { blankCubeEntry, CUBE_COLORS, cubeStateToFacelets, entryFromFacelets, entryToFacelets, INPUT_FACES, validateFacelets, type CubeEntry, type CubeInputIssue } from '../lib/cubeInput'
import type { CubeSolution } from '../lib/cubeSolver'
import CubeTrainer from './CubeTrainer'
import './CubeSolver.css'

const storageKey = 'cubiq-cube-entry'
const names: Record<Face, string> = { U: 'Top', R: 'Right', F: 'Front', D: 'Bottom', L: 'Left', B: 'Back' }
const entryOrder: Face[] = ['F', 'R', 'B', 'L', 'U', 'D']
const neighbors: Record<Face, { top: Face; right: Face; bottom: Face; left: Face }> = {
  U: { top: 'B', right: 'R', bottom: 'F', left: 'L' },
  F: { top: 'U', right: 'R', bottom: 'D', left: 'L' },
  R: { top: 'U', right: 'B', bottom: 'D', left: 'F' },
  B: { top: 'U', right: 'L', bottom: 'D', left: 'R' },
  L: { top: 'U', right: 'F', bottom: 'D', left: 'B' },
  D: { top: 'F', right: 'R', bottom: 'B', left: 'L' },
}
const exampleScramble = "R U2 F' L2 D B2 R' U F2 D' L B' U2 R2 F D2 L' U' B R2"

function readEntry(): CubeEntry {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey) || 'null')
    if (value && typeof value === 'object' && INPUT_FACES.every(face => {
      const cells = (value as CubeEntry)[face]
      return Array.isArray(cells) && cells.length === 9 && cells[4] === face && cells.every(color => color === null || INPUT_FACES.includes(color))
    })) return value as CubeEntry
  } catch { /* An incomplete or old save can be replaced safely. */ }
  return blankCubeEntry()
}

type Result = { id: number; facelets: string; state: CubeState; solution: CubeSolution }
type WorkerReply = { id: number } & ({ type: 'result'; solution: CubeSolution } | { type: 'status'; status: string } | { type: 'error'; message: string })

export default function CubeSolver() {
  const [entry, setEntry] = useState(readEntry)
  const [face, setFace] = useState<Face>('F')
  const [brush, setBrush] = useState<Face | null>('F')
  const [issues, setIssues] = useState<CubeInputIssue[]>([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [searchStatus, setSearchStatus] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [completed, setCompleted] = useState(0)
  const [liveState, setLiveState] = useState<CubeState | null>(null)
  const worker = useRef<Worker | null>(null)
  const request = useRef(0)
  const player = useRef<HTMLElement>(null)
  const facelets = entryToFacelets(entry)
  const filled = [...facelets].filter(color => color !== '?').length - 6
  const colorCounts = Object.fromEntries(INPUT_FACES.map(color => [color, [...facelets].filter(cell => cell === color).length])) as Record<Face, number>
  const marked = new Set(issues.flatMap(issue => issue.indices))
  const activeFaceIndex = entryOrder.indexOf(face)
  const completedFaces = entryOrder.filter(side => entry[side].every(Boolean)).length

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(entry)) } catch { /* Entry remains usable for this visit. */ }
  }, [entry])
  useEffect(() => () => { request.current++; worker.current?.terminate() }, [])
  useEffect(() => { if (result) player.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }) }, [result])

  const handleStep = useCallback((count: number, state: CubeState) => { setCompleted(count); setLiveState(state) }, [])
  function chooseFace(next: Face) { setFace(next); setBrush(next) }
  function paint(index: number) {
    if (index === 4 || busy) return
    setEntry(previous => ({ ...previous, [face]: previous[face].map((color, i) => i === index ? brush : color) }))
    setIssues([]); setError(''); setNotice('')
  }
  function cancelSearch() {
    request.current++; worker.current?.terminate(); worker.current = null
    setBusy(false); setSearchStatus('')
  }
  function clearEntry() {
    cancelSearch(); setResult(null); setEntry(blankCubeEntry()); chooseFace('F'); setIssues([]); setError(''); setNotice('')
  }
  function loadExample() {
    setEntry(entryFromFacelets(cubeStateToFacelets(applyAlgorithm(createSolvedCube(), exampleScramble))))
    chooseFace('F'); setResult(null); setIssues([]); setError(''); setNotice('Example cube loaded. Copy your own stickers when you are ready.')
  }
  function findSolution() {
    if (busy) return
    const validation = validateFacelets(facelets)
    setNotice(''); setError('')
    if (!validation.valid) {
      setIssues(validation.issues)
      const index = validation.issues[0].indices[0]
      if (index !== undefined) chooseFace(INPUT_FACES[Math.floor(index / 9)])
      return
    }
    setIssues([]); setBusy(true); setSearchStatus('Finding a short route…')
    const id = ++request.current
    try {
      worker.current ??= new Worker(new URL('../workers/solver.worker.ts', import.meta.url), { type: 'module' })
      worker.current.onmessage = (event: MessageEvent<WorkerReply>) => {
        const reply = event.data
        if (reply.id !== request.current) return
        if (reply.type === 'status') { setSearchStatus(reply.status === 'initializing' ? 'Preparing your first solve. You can still use the screen.' : 'Finding a short route…'); return }
        setBusy(false); setSearchStatus('')
        if (reply.type === 'error') { setError(reply.message); return }
        if (!isCubeSolved(applyAlgorithm(validation.state, reply.solution.moves))) { setError('The route did not match your entered cube. Recheck the stickers and try again.'); return }
        setCompleted(0); setLiveState(validation.state)
        setResult({ id, facelets, state: validation.state, solution: reply.solution })
      }
      worker.current.onerror = () => { cancelSearch(); setError('The solver could not start. Try again or reload this page; your entered stickers are saved.') }
      worker.current.postMessage({ id, facelets })
    } catch { cancelSearch(); setError('The solver could not start in this browser. Your entered stickers are saved.') }
  }
  async function copyRoute() {
    if (!result) return
    try { await navigator.clipboard.writeText(result.solution.algorithm); setNotice('Route copied.') }
    catch { setNotice('Select the moves below to copy the route.') }
  }

  const moves = result?.solution.moves ?? []
  const finished = !!result && completed === moves.length && !!liveState && isCubeSolved(liveState)
  const boundary = result?.solution.phaseBoundary ?? 0
  const phaseName = finished ? 'Solved' : result?.solution.optimal ? 'Follow the short route' : completed < boundary ? 'Prepare the pieces' : 'Put every piece home'
  const phaseGoal = finished ? 'All six faces are complete. Your physical cube should match the example.'
    : result?.solution.optimal ? 'Follow each turn in order. This route uses the fewest turns for your position.'
      : completed < boundary ? 'Turn the corners and edges the right way around, and bring the four middle edges into their layer.'
        : 'Move the prepared pieces to their matching centers, using top/bottom turns and side half-turns.'

  return <div className="solver-page">
    <header className="solver-heading"><h1>Solve your cube.</h1><p>Enter your stickers. Get a short route. Follow one slow turn at a time.</p></header>
    <ol className="solver-journey" aria-label="Your cube solving plan"><li className={!result ? 'is-current' : 'is-done'}><span>1</span><strong>Enter 6 faces</strong></li><li className={busy ? 'is-current' : result ? 'is-done' : ''}><span>2</span><strong>Find a route</strong></li><li className={result ? 'is-current' : ''}><span>3</span><strong>Follow the moves</strong></li></ol>

    {!result ? <>
      <div className="solver-grip"><strong>Start here</strong><span><i style={{ background: CUBE_COLORS.U.hex }} />Yellow on top</span><span><i style={{ background: CUBE_COLORS.F.hex }} />Green in front</span><span><i style={{ background: CUBE_COLORS.R.hex }} />Orange on the right</span></div>
      <nav className="solver-face-tabs" aria-label="Choose a cube face">{entryOrder.map((side, i) => <button key={side} disabled={busy} aria-pressed={face === side} className={face === side ? 'is-active' : ''} onClick={() => chooseFace(side)}><i style={{ background: CUBE_COLORS[side].hex }} /><span>{i + 1}. {names[side]}</span>{entry[side].every(Boolean) && <Check size={17} />}</button>)}</nav>
      <div className="solver-entry-layout">
        <section className="solver-face-editor" aria-label={`${names[face]} face entry`}>
          <div className="solver-face-heading"><div><h2>{names[face]} face</h2><p>{CUBE_COLORS[face].name} center · face {activeFaceIndex + 1} of 6</p></div><strong>{entry[face].filter(Boolean).length - 1} / 8</strong></div>
          <p className="solver-entry-help">Choose a color, then tap its stickers. The center stays fixed.</p>
          <div className="solver-color-palette" aria-label="Sticker colors">{INPUT_FACES.map(color => <button key={color} disabled={busy} aria-pressed={brush === color} className={brush === color ? 'is-selected' : ''} onClick={() => setBrush(color)} aria-label={`Paint ${CUBE_COLORS[color].name.toLowerCase()}`}><i style={{ background: CUBE_COLORS[color].hex }} /><span>{CUBE_COLORS[color].name}<small className={colorCounts[color] > 9 ? 'is-over' : ''}>{colorCounts[color]} / 9</small></span></button>)}<button className="solver-erase" disabled={busy} aria-pressed={brush === null} onClick={() => setBrush(null)}><Eraser size={18} />Erase</button></div>
          <div className="solver-face-guide"><span className="solver-neighbor-top">{CUBE_COLORS[neighbors[face].top].name} side above</span><span className="solver-neighbor-left">{CUBE_COLORS[neighbors[face].left].name}<br />side</span><div className="solver-sticker-grid">{entry[face].map((color, i) => <button key={i} disabled={i === 4 || busy} className={`${color ? 'is-filled' : 'is-empty'} ${marked.has(INPUT_FACES.indexOf(face) * 9 + i) ? 'is-marked' : ''}`} style={color ? { background: CUBE_COLORS[color].hex } : undefined} onClick={() => paint(i)} aria-label={`${names[face]} row ${Math.floor(i / 3) + 1} column ${i % 3 + 1}: ${color ? CUBE_COLORS[color].name.toLowerCase() : 'unfilled'}${i === 4 ? ', fixed center' : ''}`}>{i === 4 ? <span style={{ color: face === 'R' || face === 'B' ? '#fff' : '#161b17' }}>center</span> : !color ? '+' : null}</button>)}</div><span className="solver-neighbor-right">{CUBE_COLORS[neighbors[face].right].name}<br />side</span><span className="solver-neighbor-bottom">{CUBE_COLORS[neighbors[face].bottom].name} side below</span></div>
          <p className="solver-face-orientation">Look straight at this face. Match the neighboring side labels before copying its rows.</p>
          <div className="solver-face-navigation"><button disabled={busy || activeFaceIndex === 0} onClick={() => chooseFace(entryOrder[activeFaceIndex - 1])}><ArrowLeft size={18} />Previous face</button><button disabled={busy || activeFaceIndex === 5} onClick={() => chooseFace(entryOrder[activeFaceIndex + 1])}>Next face<ArrowRight size={18} /></button></div>
        </section>
        <aside className="solver-entry-review">
          <h2>Your entered cube</h2><p>{completedFaces} of 6 faces filled · {filled} of 48 stickers entered</p>
          <div className="solver-mini-faces">{entryOrder.map(side => <button key={side} disabled={busy} onClick={() => chooseFace(side)} aria-label={`Review ${names[side].toLowerCase()} face`}><span>{names[side]}</span><div>{entry[side].map((color, i) => <i key={i} className={!color ? 'is-empty' : ''} style={color ? { background: CUBE_COLORS[color].hex } : undefined} />)}</div></button>)}</div>
          <p className="solver-review-hint">Check the top and back faces carefully. Their row direction matters.</p>
          {issues.length > 0 && <div className="solver-errors" role="alert">{issues.map(issue => <p key={issue.message}>{issue.message}</p>)}</div>}
          {error && <p className="solver-errors" role="alert">{error}</p>}
          {busy ? <div className="solver-search-status" role="status"><LoaderCircle size={24} /><p>{searchStatus}</p><button onClick={cancelSearch}>Cancel</button></div> : <button className="solver-primary" onClick={findSolution}>Find short solution<ArrowRight size={20} /></button>}
          <div className="solver-entry-actions"><button disabled={busy} onClick={loadExample}><Shuffle size={18} />Try example cube</button><button disabled={busy} onClick={clearEntry}><RotateCcw size={18} />Clear stickers</button></div>
          <small>Saved on this device. The solver runs in your browser.</small>
        </aside>
      </div>
    </> : <section className="solver-result" ref={player} aria-label="Solution for your entered cube">
      <div className="solver-result-heading"><div><h2>{moves.length ? `${moves.length}-turn solution` : 'Your cube is already solved'}</h2><p>{result.solution.optimal ? 'Fewest-turn route for this position.' : 'A short route. The absolute fewest turns are not guaranteed.'}</p></div><button className="solver-edit" onClick={() => { setResult(null); setNotice(''); setIssues([]) }}><ArrowLeft size={18} />Edit my cube</button></div>
      <div className="solver-solve-goal"><div><strong>{phaseName}</strong><p>{phaseGoal}</p></div><span>{completed} / {moves.length} turns</span></div>
      {!result.solution.optimal && <ol className="solver-phases" aria-label="Purpose of the solution steps">{boundary > 0 && <li className={completed < boundary ? 'is-current' : 'is-done'}><strong>1. Prepare the pieces</strong><span>Turns 1–{boundary}</span></li>}{boundary < moves.length && <li className={completed >= boundary && !finished ? 'is-current' : finished ? 'is-done' : ''}><strong>{boundary > 0 ? '2' : '1'}. Put pieces home</strong><span>Turns {boundary + 1}–{moves.length}</span></li>}<li className={finished ? 'is-current' : ''}><strong><CheckCircle2 size={18} />Solved</strong><span>Six matching faces</span></li></ol>}
      <CubeTrainer key={result.id} initialState={result.state} algorithm={result.solution.algorithm} coach orientation="yellow-top" onStepChange={handleStep} solvedMessage="Your cube is solved." />
      <p className="solver-follow-note">Keep the same grip as the model. Press <strong>Next move</strong>, copy the turn, then press it again when you are ready.</p>
      <details className="solver-route-details"><summary>Full route and explanation<ChevronDown size={20} /></summary><div><p>{result.solution.optimal ? 'This position is within four turns of solved. The solver checks all shorter routes to find the fewest turns.' : 'This route uses Kociemba’s two-phase method: prepare piece orientations and the middle slice, then finish the piece positions. Some turns temporarily disturb pieces that look solved.'} A half-turn such as R2 counts as one turn.</p><code>{result.solution.algorithm.replaceAll("'", '′') || 'No turns needed.'}</code>{moves.length > 0 && <button onClick={copyRoute}><Copy size={18} />Copy route</button>}<p>To build competition technique, practice the <a href="#learn">CFOP lessons</a> too.</p></div></details>
      {finished && <div className="solver-finished" role="status"><CheckCircle2 size={24} /><div><strong>All six faces solved.</strong><p>Check your physical cube matches. You can replay this route with Reset case.</p></div><button onClick={clearEntry}>Enter another cube<ArrowRight size={18} /></button></div>}
    </section>}
    {notice && <p className="solver-notice" role="status">{notice}</p>}
  </div>
}
