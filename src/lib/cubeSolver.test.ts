import Cube from '../vendor/cubejs/cube.js'
import { describe, expect, it } from 'vitest'
import { applyAlgorithm, isCubeSolved } from './cube'
import { faceletsToCubeState } from './cubeInput'
import { shortestNearbySolution, solveFacelets } from './cubeSolver'

describe('short solutions for the entered cube', () => {
  it('finds the proven fewest turns for simple positions and treats a half-turn as one move', () => {
    for (const [scramble, count] of [['', 0], ['R', 1], ['U2', 1], ["B' D2", 2], ["R U F'", 3], ['R U R\' U\'', 4]] as const) {
      const facelets = new Cube().move(scramble).asString()
      const result = solveFacelets(facelets)
      expect(result.optimal).toBe(true)
      expect(result.moves.length).toBe(count)
      expect(isCubeSolved(applyAlgorithm(faceletsToCubeState(facelets), result.moves))).toBe(true)
    }
  })
  it('returns no shallow solution for a mixed 20-turn scramble', () => {
    const facelets = new Cube().move("R U2 F' L2 D B2 R' U F2 D' L B' U2 R2 F D2 L' U' B R2").asString()
    expect(shortestNearbySolution(facelets)).toBeNull()
  })
  it('solves actual general scrambles with at most 22 turns and verifies both independent cube models', () => {
    for (const scramble of ["R U2 F' L2 D B2 R' U F2 D' L B' U2 R2 F D2 L' U' B R2", "B2 D' R F2 U' L2 F D2 B' R2 U F' D L' B U2 R' F2 D2 L"]) {
      const facelets = new Cube().move(scramble).asString()
      const result = solveFacelets(facelets)
      expect(result.optimal).toBe(false)
      expect(result.moves.length).toBeLessThanOrEqual(22)
      expect(new Cube().move(scramble).move(result.algorithm).isSolved()).toBe(true)
      expect(isCubeSolved(applyAlgorithm(faceletsToCubeState(facelets), result.moves))).toBe(true)
      const phaseOne = Cube.fromString(facelets).move(result.moves.slice(0, result.phaseBoundary).join(' ')).toJSON()
      expect(phaseOne.co.every(n => n === 0) && phaseOne.eo.every(n => n === 0)).toBe(true)
      expect(phaseOne.ep.slice(8).every(n => n >= 8)).toBe(true)
    }
  }, 30000)
  it('rejects incomplete input instead of searching an invalid cube', () => {
    expect(() => solveFacelets('?'.repeat(54))).toThrow('remaining')
  })
})
