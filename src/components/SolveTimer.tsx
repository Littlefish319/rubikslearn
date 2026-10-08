import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowDown, Check, ChevronDown, Copy, Flag, Keyboard, RotateCcw, Shuffle, Timer, Trash2, Trophy, X } from 'lucide-react'
import { effectiveTime, formatTime, generateScramble, getInspectionPenalty, getSessionStats, readSavedSolves, SOLVES_STORAGE_KEY, type Penalty, type Solve } from '../lib/timer'
import './SolveTimer.css'

type Phase = 'idle' | 'inspection' | 'running'
type Hold = 'none' | 'holding' | 'ready'

export default function SolveTimer({ onSolvesChange }: { onSolvesChange?: () => void }) {
  const [solves, setSolves] = useState<Solve[]>(readSavedSolves)
  const solvesRef = useRef(solves)
  const [scramble, setScramble] = useState(generateScramble)
  const [phase, setPhaseState] = useState<Phase>('idle')
  const phaseRef = useRef<Phase>('idle')
  const [hold, setHoldState] = useState<Hold>('none')
  const holdRef = useRef<Hold>('none')
  const holdTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const spaceDown = useRef(false)
  const startTime = useRef(0)
  const inspectionTime = useRef(0)
  const runPenalty = useRef<Penalty>('none')
  const [inspection, setInspection] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [inspectionElapsed, setInspectionElapsed] = useState(0)
  const [lastSolveId, setLastSolveId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [copied, setCopied] = useState(false)
  const [storageError, setStorageError] = useState(false)
  const stats = getSessionStats(solves)
  const selected = solves.find(solve => solve.id === selectedId)
  const lastSolve = solves.find(solve => solve.id === lastSolveId)

  const setPhase = useCallback((next: Phase) => {
    phaseRef.current = next
    setPhaseState(next)
  }, [])

  const setHold = useCallback((next: Hold) => {
    holdRef.current = next
    setHoldState(next)
  }, [])

  const saveSolves = useCallback((next: Solve[]) => {
    solvesRef.current = next
    setSolves(next)
    try {
      localStorage.setItem(SOLVES_STORAGE_KEY, JSON.stringify(next))
      setStorageError(false)
      window.dispatchEvent(new CustomEvent('cubiq-data-change'))
    } catch {
      setStorageError(true)
    }
    onSolvesChange?.()
  }, [onSolvesChange])

  const clearHold = useCallback(() => {
    clearTimeout(holdTimeout.current)
    setHold('none')
  }, [setHold])

  const startRun = useCallback(() => {
    runPenalty.current = phaseRef.current === 'inspection'
      ? getInspectionPenalty(performance.now() - inspectionTime.current)
      : 'none'
    clearHold()
    setElapsed(0)
    startTime.current = performance.now()
    setPhase('running')
  }, [clearHold, setPhase])

  const startOrInspect = useCallback(() => {
    if (phaseRef.current === 'inspection') {
      startRun()
    } else if (inspection) {
      clearHold()
      inspectionTime.current = performance.now()
      setInspectionElapsed(0)
      setPhase('inspection')
    } else {
      startRun()
    }
  }, [clearHold, inspection, setPhase, startRun])

  const stopRun = useCallback(() => {
    if (phaseRef.current !== 'running') return
    const time = Math.max(0, performance.now() - startTime.current)
    const solve: Solve = { id: crypto.randomUUID(), time, penalty: runPenalty.current, scramble, date: new Date().toISOString() }
    setElapsed(time)
    setLastSolveId(solve.id)
    setSelectedId(null)
    setPhase('idle')
    clearHold()
    saveSolves([solve, ...solvesRef.current])
    setScramble(generateScramble())
  }, [clearHold, saveSolves, scramble, setPhase])

  const beginHold = useCallback(() => {
    if (holdRef.current !== 'none' || phaseRef.current === 'running') return
    setHold('holding')
    holdTimeout.current = setTimeout(() => setHold('ready'), 300)
  }, [setHold])

  const releaseHold = useCallback(() => {
    const ready = holdRef.current === 'ready'
    clearHold()
    if (ready) startOrInspect()
  }, [clearHold, startOrInspect])

  useEffect(() => {
    if (phase === 'idle') return
    let frame = 0
    const tick = () => {
      if (phase === 'running') setElapsed(performance.now() - startTime.current)
      else setInspectionElapsed(performance.now() - inspectionTime.current)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [phase])

  useEffect(() => {
    const isInput = (target: EventTarget | null) => target instanceof HTMLElement && (
      target.isContentEditable || Boolean(target.closest('input, textarea, select, a, [role="dialog"], button:not([data-timer-control])'))
    )
    const keyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || isInput(event.target)) return
      if (phaseRef.current === 'running' && (event.key.length === 1 || event.key === 'Enter' || event.key === 'Escape')) {
        event.preventDefault()
        stopRun()
        return
      }
      if (event.code !== 'Space') return
      event.preventDefault()
      spaceDown.current = true
      beginHold()
    }
    const keyUp = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || !spaceDown.current) return
      event.preventDefault()
      spaceDown.current = false
      releaseHold()
    }
    const blur = () => { spaceDown.current = false; clearHold() }
    window.addEventListener('keydown', keyDown)
    window.addEventListener('keyup', keyUp)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', keyDown)
      window.removeEventListener('keyup', keyUp)
      window.removeEventListener('blur', blur)
      clearTimeout(holdTimeout.current)
    }
  }, [beginHold, clearHold, releaseHold, stopRun])

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === SOLVES_STORAGE_KEY) {
        const next = readSavedSolves()
        solvesRef.current = next
        setSolves(next)
      }
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  const editPenalty = (penalty: Penalty) => {
    saveSolves(solvesRef.current.map(solve => solve.id === selectedId ? { ...solve, penalty } : solve))
  }

  const deleteSelected = () => {
    if (!selectedId) return
    saveSolves(solvesRef.current.filter(solve => solve.id !== selectedId))
    if (lastSolveId === selectedId) { setLastSolveId(null); setElapsed(0) }
    setSelectedId(null)
  }

  const inspectionPenalty = getInspectionPenalty(inspectionElapsed)
  const displayTime = phase === 'inspection'
    ? inspectionPenalty === 'none' ? String(Math.max(0, Math.ceil((15_000 - inspectionElapsed) / 1000))) : inspectionPenalty
    : formatTime(phase === 'idle' && lastSolve ? effectiveTime(lastSolve) : elapsed)
  const status = hold === 'ready' ? 'Ready. Release to go.'
    : hold === 'holding' ? 'Hold a little longer…'
      : phase === 'running' ? 'Find your flow. Press a key or tap to stop.'
        : phase === 'inspection' ? 'Inspect your cube. Hold and release to start.'
          : 'Hold space, then release to start'
  const busy = phase !== 'idle' || hold !== 'none'

  return (
    <div className="timer-page">
      <div className="timer-heading">
        <div><span className="timer-eyebrow">THE PRACTICE ROOM</span><h1>Every solve counts<span>.</span></h1><p>Build your rhythm. Beat your best. One turn at a time.</p></div>
        <div className="timer-mode"><span className="timer-mode-dot" />3 × 3 × 3 <span className="timer-mode-caption">Free practice</span></div>
      </div>

      <section className="timer-arena" aria-label="Solve timer">
        <div className="timer-scramble-top">
          <span className="timer-small-label"><Shuffle size={14} /> YOUR NEXT SCRAMBLE</span>
          <div className="timer-scramble-actions">
            <button type="button" className="timer-icon-button" disabled={busy} aria-label={copied ? 'Scramble copied' : 'Copy scramble'} onClick={async () => {
              try { await navigator.clipboard.writeText(scramble); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { setCopied(false) }
            }}>{copied ? <Check size={16} /> : <Copy size={16} />}</button>
            <button type="button" className="timer-refresh" disabled={busy} onClick={() => { setScramble(generateScramble()); setCopied(false) }}><RotateCcw size={14} /> New scramble</button>
          </div>
        </div>
        <p className="timer-scramble" aria-label="Scramble moves">{scramble}</p>
        <p className="timer-scramble-note">Random-move training scramble · Hold your cube with white on top and green in front.</p>

        <div className="timer-clock-space">
          <div className={`timer-state-label ${phase === 'running' ? 'timer-state-active' : ''}`}><span />{phase === 'inspection' ? 'INSPECTION' : phase === 'running' ? 'SOLVING' : lastSolve ? 'NICE WORK. GO AGAIN.' : 'MAKE YOUR NEXT MOVE'}</div>
          <button
            type="button"
            data-timer-control
            className={`timer-clock timer-clock-${hold} ${phase === 'inspection' && inspectionPenalty !== 'none' ? 'timer-clock-overtime' : ''}`}
            aria-label={phase === 'running' ? 'Stop solve timer' : phase === 'inspection' ? 'Start solve after inspection' : 'Hold for 300 milliseconds and release to begin'}
            onPointerDown={event => {
              if (event.button !== 0) return
              event.preventDefault()
              event.currentTarget.setPointerCapture(event.pointerId)
              if (phaseRef.current === 'running') stopRun()
              else beginHold()
            }}
            onPointerUp={releaseHold}
            onPointerCancel={clearHold}
            onClick={event => {
              // Keyboard and assistive-technology clicks have no pointer click count.
              if (event.detail === 0) phaseRef.current === 'running' ? stopRun() : startOrInspect()
            }}
          >{displayTime}<span className="timer-unit">{phase === 'inspection' ? inspectionPenalty === 'none' ? 'sec' : '' : displayTime === 'DNF' ? '' : 's'}</span></button>
          <p className={`timer-instruction ${hold === 'ready' ? 'timer-instruction-ready' : ''}`} aria-live="polite"><Keyboard size={17} />{status}</p>
          {phase === 'idle' && lastSolve?.penalty === '+2' && <p className="timer-penalty-note">Includes a +2 second penalty</p>}
          {phase === 'running' && runPenalty.current !== 'none' && <p className="timer-penalty-note">Inspection penalty: {runPenalty.current}</p>}
        </div>

        <div className="timer-arena-footer">
          <label className="timer-inspection-toggle"><input type="checkbox" checked={inspection} disabled={busy} onChange={event => setInspection(event.target.checked)} /><span className="timer-switch" aria-hidden="true" /><span>15-second inspection</span></label>
          <div className="timer-direct-actions">
            {phase === 'inspection' && <button className="timer-cancel-button" type="button" onClick={() => { clearHold(); setPhase('idle'); setInspectionElapsed(0) }}>Cancel</button>}
            <button type="button" className={`timer-start-button ${phase === 'running' ? 'timer-stop-button' : ''}`} onClick={() => phaseRef.current === 'running' ? stopRun() : startOrInspect()}><Timer size={16} />{phase === 'running' ? 'Stop timer' : phase === 'inspection' ? 'Start solve' : inspection ? 'Start inspection' : 'Start timer'}</button>
          </div>
        </div>
      </section>

      <div className="timer-stats" aria-label="Session statistics">
        {[{ label: 'PERSONAL BEST', value: stats.best, icon: <Trophy size={16} />, accent: true, hint: 'Your fastest successful solve' }, { label: 'AVERAGE OF 5', value: stats.ao5, icon: <ArrowDown size={16} />, hint: 'Latest 5 · fastest and slowest removed' }, { label: 'AVERAGE OF 12', value: stats.ao12, icon: <ArrowDown size={16} />, hint: 'Latest 12 · fastest and slowest removed' }, { label: 'SESSION MEAN', value: stats.mean, icon: <Flag size={16} />, hint: 'All successful solves · includes +2' }].map(stat => (
          <div className={`timer-stat ${stat.accent ? 'timer-stat-highlight' : ''}`} key={stat.label} title={stat.hint}><span className="timer-stat-label">{stat.label}{stat.icon}</span><strong>{formatTime(stat.value)}<small>{stat.value !== null && Number.isFinite(stat.value) ? 's' : ''}</small></strong><span className="timer-stat-hint">{stat.value === null ? stat.label === 'AVERAGE OF 5' ? `${Math.max(0, 5 - solves.length)} more solves to unlock` : stat.label === 'AVERAGE OF 12' ? `${Math.max(0, 12 - solves.length)} more solves to unlock` : 'Your story starts here' : stat.hint}</span></div>
        ))}
      </div>

      <section className="timer-history">
        <div className="timer-history-heading"><div><h2>Your session <span>{solves.length} {solves.length === 1 ? 'solve' : 'solves'}</span></h2><p>Small improvements add up to big breakthroughs.</p></div><span className="timer-save-note"><span /> Saved on this device</span></div>
        {storageError && <p className="timer-storage-error" role="alert">Your browser could not save these results. Keep this tab open to retain this session.</p>}
        {solves.length === 0 ? (
          <div className="timer-empty"><div className="timer-empty-icon"><Timer size={25} strokeWidth={1.5} /></div><h3>Your first time is your starting line.</h3><p>Scramble your cube, take a breath, and start your first solve.<br />Your times and averages will appear right here.</p></div>
        ) : (
          <>
            <div className="timer-history-grid" role="list" aria-label="Recorded solves">
              {(showAll ? solves : solves.slice(0, 12)).map((solve, index) => <button type="button" role="listitem" key={solve.id} className={`timer-history-item ${selectedId === solve.id ? 'timer-history-item-selected' : ''} ${stats.best === effectiveTime(solve) ? 'timer-history-item-best' : ''}`} onClick={() => setSelectedId(selectedId === solve.id ? null : solve.id)} aria-label={`Solve ${solves.length - index}: ${formatTime(effectiveTime(solve))}${solve.penalty === '+2' ? ', plus 2 penalty' : ''}. Edit result.`}><span className="timer-solve-index">{String(solves.length - index).padStart(2, '0')}</span><strong>{formatTime(effectiveTime(solve))}</strong>{solve.penalty === '+2' ? <span className="timer-history-penalty">+2</span> : stats.best === effectiveTime(solve) ? <Trophy size={13} /> : <ChevronDown size={13} />}</button>)}
            </div>
            {selected && <div className="timer-solve-details"><div className="timer-details-heading"><span>Solve details · {new Date(selected.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span><button type="button" className="timer-icon-button" aria-label="Close solve details" onClick={() => setSelectedId(null)}><X size={16} /></button></div><p className="timer-details-scramble">{selected.scramble}</p><div className="timer-details-bottom"><span>Raw time <strong>{formatTime(selected.time)}</strong></span><div className="timer-penalty-controls" aria-label="Solve penalty">{(['none', '+2', 'DNF'] as Penalty[]).map(penalty => <button type="button" key={penalty} aria-pressed={selected.penalty === penalty} onClick={() => editPenalty(penalty)}>{penalty === 'none' ? 'No penalty' : penalty}</button>)}</div><button className="timer-delete-button" type="button" onClick={deleteSelected}><Trash2 size={14} />Delete solve</button></div></div>}
            {solves.length > 12 && <button type="button" className="timer-show-all" onClick={() => setShowAll(!showAll)}>{showAll ? 'Show recent solves' : `Show all ${solves.length} solves`}<ChevronDown size={15} /></button>}
          </>
        )}
        <div className="timer-history-note"><span>PRO TIP</span>Consistent, smooth turns beat rushed moves. Accuracy first. Speed follows.</div>
      </section>
    </div>
  )
}
