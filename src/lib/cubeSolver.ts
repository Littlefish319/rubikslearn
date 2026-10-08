import Cube from '../vendor/cubejs/solve.js'
import { inverseMove, parseAlgorithm, type Move } from './cube'
import { INPUT_FACES, validateFacelets } from './cubeInput'

export type CubeSolution = { algorithm: string; moves: Move[]; phaseBoundary: number; optimal: boolean }
const moves = INPUT_FACES.flatMap(face => [face, `${face}2`, `${face}'`] as Move[])
let solverReady = false
let solvedNeighborhood: Map<string, Move[]> | undefined

function neighborhood(facelets: string): Map<string, Move[]> {
  const visited = new Map<string, Move[]>([[facelets, []]])
  let layer = [{ cube: Cube.fromString(facelets), path: [] as Move[] }]
  for (let depth = 0; depth < 2; depth++) {
    const nextLayer: typeof layer = []
    for (const { cube, path } of layer) for (const move of moves) {
      if (path.at(-1)?.[0] === move[0]) continue
      const next = cube.clone().move(move)
      const key = next.asString()
      if (visited.has(key)) continue
      const nextPath = [...path, move]
      visited.set(key, nextPath)
      nextLayer.push({ cube: next, path: nextPath })
    }
    layer = nextLayer
  }
  return visited
}

/** Bidirectional breadth-first search proves the minimum for positions within four turns. */
export function shortestNearbySolution(facelets: string): Move[] | null {
  solvedNeighborhood ??= neighborhood(new Cube().asString())
  let best: Move[] | null = null
  for (const [position, path] of neighborhood(facelets)) {
    const fromSolved = solvedNeighborhood.get(position)
    if (!fromSolved) continue
    const candidate = [...path, ...[...fromSolved].reverse().map(inverseMove)]
    if (!best || candidate.length < best.length) best = candidate
  }
  return best
}

export function solutionPhaseBoundary(facelets: string, solution: Move[]): number {
  const cube = Cube.fromString(facelets)
  for (let i = 0; i <= solution.length; i++) {
    const state = cube.toJSON()
    const inGroup = state.co.every(n => n === 0) && state.eo.every(n => n === 0) && state.ep.slice(8).every(n => n >= 8)
    if (inGroup && solution.slice(i).every(move => move[0] === 'U' || move[0] === 'D' || move.endsWith('2'))) return i
    if (solution[i]) cube.move(solution[i])
  }
  return solution.length
}

export function solveFacelets(facelets: string, onStatus?: (status: 'initializing' | 'searching') => void): CubeSolution {
  const validation = validateFacelets(facelets)
  if (!validation.valid) throw new Error(validation.issues[0].message)
  const nearby = shortestNearbySolution(facelets)
  let solution: Move[]
  if (nearby !== null) solution = nearby
  else {
    if (!solverReady) { onStatus?.('initializing'); Cube.initSolver(); solverReady = true }
    onStatus?.('searching')
    solution = parseAlgorithm(Cube.fromString(facelets).solve(22))
  }
  if (!Cube.fromString(facelets).move(solution.join(' ')).isSolved()) throw new Error('The solution could not be verified. Please try again.')
  return { algorithm: solution.join(' '), moves: solution, phaseBoundary: solutionPhaseBoundary(facelets, solution), optimal: nearby !== null }
}
