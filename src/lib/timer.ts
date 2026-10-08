export type Penalty = 'none' | '+2' | 'DNF'

export interface Solve {
  id: string
  time: number
  penalty: Penalty
  scramble: string
  date: string
}

export const SOLVES_STORAGE_KEY = 'cubiq-solves'

const faces = ['U', 'D', 'R', 'L', 'F', 'B'] as const
const modifiers = ['', "'", '2'] as const
const axis = { U: 0, D: 0, R: 1, L: 1, F: 2, B: 2 }

/** A random-move practice scramble, not an official random-state scramble. */
export function generateScramble(length = 20, random = Math.random): string {
  const moves: string[] = []
  let previousAxis = -1
  for (let index = 0; index < length; index += 1) {
    const options = faces.filter(face => axis[face] !== previousAxis)
    const face = options[Math.floor(random() * options.length)]
    moves.push(face + modifiers[Math.floor(random() * modifiers.length)])
    previousAxis = axis[face]
  }
  return moves.join(' ')
}

export function effectiveTime(solve: Pick<Solve, 'time' | 'penalty'>): number {
  return solve.penalty === 'DNF' ? Infinity : solve.time + (solve.penalty === '+2' ? 2000 : 0)
}

export function getInspectionPenalty(elapsed: number): Penalty {
  if (elapsed > 17_000) return 'DNF'
  if (elapsed > 15_000) return '+2'
  return 'none'
}

export function formatTime(milliseconds: number | null, precision = 2): string {
  if (milliseconds === null) return '—'
  if (!Number.isFinite(milliseconds)) return 'DNF'
  const divisor = 10 ** precision
  const total = Math.floor(Math.max(0, milliseconds) / (1000 / divisor))
  const minutes = Math.floor(total / (60 * divisor))
  const seconds = (total % (60 * divisor)) / divisor
  return minutes > 0
    ? `${minutes}:${seconds.toFixed(precision).padStart(3 + precision, '0')}`
    : seconds.toFixed(precision)
}

/** Records are newest first. WCA averages discard the best and worst 5%, rounded up. */
export function averageOf(solves: Solve[], count: 5 | 12): number | null {
  if (solves.length < count) return null
  const times = solves.slice(0, count).map(effectiveTime).sort((a, b) => a - b)
  const trim = Math.ceil(count * 0.05)
  const countedTimes = times.slice(trim, count - trim)
  if (countedTimes.some(time => !Number.isFinite(time))) return Infinity
  return countedTimes.reduce((sum, time) => sum + time, 0) / countedTimes.length
}

export function getSessionStats(solves: Solve[]) {
  const successful = solves.map(effectiveTime).filter(Number.isFinite)
  return {
    count: solves.length,
    best: successful.length ? Math.min(...successful) : null,
    mean: successful.length ? successful.reduce((sum, time) => sum + time, 0) / successful.length : null,
    ao5: averageOf(solves, 5),
    ao12: averageOf(solves, 12),
  }
}

/** Ignores malformed records without inventing sample history. */
export function parseSolves(value: string | null): Solve[] {
  if (!value) return []
  try {
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((record): record is Solve =>
      record !== null && typeof record === 'object' &&
      typeof record.id === 'string' &&
      typeof record.time === 'number' && Number.isFinite(record.time) && record.time >= 0 &&
      ['none', '+2', 'DNF'].includes(record.penalty) &&
      typeof record.scramble === 'string' &&
      typeof record.date === 'string' && Number.isFinite(Date.parse(record.date)),
    )
  } catch {
    return []
  }
}

export function readSavedSolves(): Solve[] {
  try {
    return parseSolves(window.localStorage.getItem(SOLVES_STORAGE_KEY))
  } catch {
    return []
  }
}
