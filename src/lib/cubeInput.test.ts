import Cube from '../vendor/cubejs/cube.js'
import { describe, expect, it } from 'vitest'
import { applyAlgorithm, createSolvedCube, isCubeSolved } from './cube'
import { blankCubeEntry, cubeStateToFacelets, entryFromFacelets, entryToFacelets, faceletsToCubeState, INPUT_FACES, validateFacelets } from './cubeInput'

const solved = new Cube().asString()
describe('real cube color entry', () => {
  it('keeps centers fixed and requires the 48 non-center stickers', () => {
    const entry = blankCubeEntry()
    expect(INPUT_FACES.every(face => entry[face][4] === face)).toBe(true)
    const result = validateFacelets(entryToFacelets(entry))
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.issues[0].indices).toHaveLength(48)
  })
  it('matches the solver face orientation for every outer turn, including back and bottom', () => {
    for (const face of INPUT_FACES) for (const suffix of ['', "'", '2']) {
      const algorithm = `${face}${suffix}`
      const actual = cubeStateToFacelets(applyAlgorithm(createSolvedCube(), algorithm))
      expect(actual, algorithm).toBe(new Cube().move(algorithm).asString())
      expect(validateFacelets(actual).valid).toBe(true)
    }
  })
  it('round trips a full mixed scramble through entry and the exact displayed state', () => {
    const input = new Cube().move("R U2 F' D L2 B R2 D' F2 U L' B2").asString()
    expect(entryToFacelets(entryFromFacelets(input))).toBe(input)
    expect(cubeStateToFacelets(faceletsToCubeState(input))).toBe(input)
    expect(isCubeSolved(faceletsToCubeState(solved))).toBe(true)
  })
  it('rejects incorrect color totals', () => {
    const result = validateFacelets('R' + solved.slice(1))
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.issues.some(issue => issue.message.includes('exactly nine'))).toBe(true)
  })
  it('rejects a single flipped edge even though all nine color counts are correct', () => {
    const input = solved.split(''); [input[5], input[10]] = [input[10], input[5]]
    const result = validateFacelets(input.join(''))
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.issues[0].message).toContain('flipped')
  })
  it('rejects a single twisted corner', () => {
    const input = solved.split(''); [input[8], input[9], input[20]] = [input[9], input[20], input[8]]
    const result = validateFacelets(input.join(''))
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.issues[0].message).toContain('twisted')
  })
  it('rejects mirrored corner colors', () => {
    const input = solved.split(''); [input[9], input[20]] = [input[20], input[9]]
    const result = validateFacelets(input.join(''))
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.issues[0].message).toContain('reversed')
  })
  it('rejects swapping two edges without also swapping two corners', () => {
    const input = solved.split(''); [input[10], input[19]] = [input[19], input[10]]
    const result = validateFacelets(input.join(''))
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.issues[0].message).toContain('legal scramble')
  })
})
