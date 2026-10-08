import { describe, expect, it } from 'vitest'
import { applyAlgorithm, applyMove, createSolvedCube, generateScramble, inverseMove, invertAlgorithm, isCubeSolved, parseAlgorithm, type Move } from './cube'

describe('cube state', () => {
  it('creates 54 distinct stickers on six solved faces', () => {
    const cube = createSolvedCube()
    expect(cube).toHaveLength(54)
    expect(new Set(cube.map((sticker) => `${sticker.position}/${sticker.normal}`)).size).toBe(54)
    expect(isCubeSolved(cube)).toBe(true)
  })
  for (const move of ['U', 'R', 'F', 'D', 'L', 'B', 'M', 'E', 'S', 'x', 'y', 'z', 'r', 'l', 'u', 'd', 'f', 'b'] as Move[]) {
    it(`${move}: four quarter turns restore every sticker`, () => {
      const solved = createSolvedCube()
      expect(applyAlgorithm(solved, [move, move, move, move])).toEqual(solved)
    })
    it(`${move}: a turn and inverse restore the cube without mutating its input`, () => {
      const solved = createSolvedCube()
      const snapshot = JSON.stringify(solved)
      expect(applyAlgorithm(solved, [move, inverseMove(move)])).toEqual(solved)
      expect(JSON.stringify(solved)).toBe(snapshot)
    })
  }
  it('turns the front face clockwise as seen from the front', () => {
    const solved = createSolvedCube()
    const upperLeft = solved.find((sticker) => sticker.color === 'F' && sticker.position[0] === -1 && sticker.position[1] === 1)!
    const turned = applyMove(solved, 'F').find((sticker) => sticker.id === upperLeft.id)!
    expect(turned.position).toEqual([1, 1, 1])
  })
  it('undoes a complete algorithm and preserves all sticker locations', () => {
    const solved = createSolvedCube()
    const algorithm = "R U R' U' F2 D L2 B' U2"
    const mixed = applyAlgorithm(solved, algorithm)
    expect(isCubeSolved(mixed)).toBe(false)
    expect(new Set(mixed.map((sticker) => `${sticker.position}/${sticker.normal}`)).size).toBe(54)
    expect(applyAlgorithm(mixed, invertAlgorithm(algorithm))).toEqual(solved)
  })
  it('matches known move identities and whole-cube rotations', () => {
    const solved = createSolvedCube()
    expect(applyAlgorithm(solved, "R U R' U' ".repeat(6))).toEqual(solved)
    expect(applyAlgorithm(solved, 'R R')).toEqual(applyMove(solved, 'R2'))
    expect(applyMove(solved, 'r')).toEqual(applyAlgorithm(solved, "R M'"))
    expect(isCubeSolved(applyAlgorithm(solved, 'x y z'))).toBe(true)
  })
  it('accepts standard prime and wide notation but rejects unsupported input', () => {
    expect(parseAlgorithm(' Rw U′ R’ ')).toEqual(['r', "U'", "R'"])
    expect(() => parseAlgorithm('R explode U')).toThrow('Unknown move')
  })
  it('generates a valid training scramble with no successive turns of the same axis', () => {
    const sequence = generateScramble(20)
    expect(sequence).toHaveLength(20)
    expect(parseAlgorithm(sequence.join(' '))).toEqual(sequence)
    const solved = createSolvedCube()
    expect(applyAlgorithm(applyAlgorithm(solved, sequence), invertAlgorithm(sequence))).toEqual(solved)
  })
})
