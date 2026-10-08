import { describe, expect, it } from 'vitest'
import { applyAlgorithm, applyMove, createSolvedCube, generateScramble, inverseMove, invertAlgorithm, isCubeSolved, parseAlgorithm, trainingTargetStickerIds, type Move } from './cube'

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
  it.each([
    ['F2L right insertion', "U R U' R'"],
    ['OLL sune', "R U R' U R U2 R'"],
    ['PLL T permutation', "R U R' U' R' F R2 U' R' U' R U R' F'"],
    ['PLL H permutation with slice turns', 'M2 U M2 U2 M2 U M2'],
    ['PLL A permutation with a grip rotation', "x R' U R' D2 R U' R' D2 R2 x'"],
    ['OLL with wide turns', "r U R' U' r' F R F'"],
  ])('%s: its exact inverse setup supports next, previous, and replay', (_, notation) => {
    const solved = createSolvedCube()
    const moves = parseAlgorithm(notation)
    const setup = applyAlgorithm(solved, invertAlgorithm(moves))
    expect(isCubeSolved(setup)).toBe(false)
    let current = setup
    for (let step = 0; step < moves.length; step++) {
      const before = current
      const after = applyMove(before, moves[step])
      // Returning one guided step must restore exactly the state before it.
      expect(applyMove(after, inverseMove(moves[step]))).toEqual(before)
      // A paused sequence resumes from the remaining moves without resetting.
      expect(applyAlgorithm(after, moves.slice(step + 1))).toEqual(solved)
      current = after
    }
    expect(current).toEqual(solved)
    expect(applyAlgorithm(setup, moves)).toEqual(solved)
  })
  it('tracks the five stickers on the front-right F2L corner and edge through every turn', () => {
    const ids = trainingTargetStickerIds('f2l')
    expect(ids.size).toBe(5)
    const solved = createSolvedCube()
    const selected = solved.filter(sticker => ids.has(sticker.id))
    expect(new Set(selected.map(sticker => sticker.position.join(',')))).toEqual(new Set(['1,-1,1', '1,0,1']))
    expect(selected.filter(sticker => sticker.color === 'D')).toHaveLength(1)
    let current = applyAlgorithm(solved, invertAlgorithm("U R U' R'"))
    for (const move of parseAlgorithm("U R U' R'")) {
      current = applyMove(current, move)
      const targets = current.filter(sticker => ids.has(sticker.id))
      expect(targets).toHaveLength(5)
      expect(new Set(targets.map(sticker => sticker.position.join(','))).size).toBe(2)
    }
  })
  it('tracks eight stickers on exactly the four down-cross edge cubies', () => {
    const ids = trainingTargetStickerIds('cross')
    expect(ids.size).toBe(8)
    const selected = createSolvedCube().filter(sticker => ids.has(sticker.id))
    expect(new Set(selected.map(sticker => sticker.position.join(',')))).toEqual(new Set(['0,-1,1', '1,-1,0', '0,-1,-1', '-1,-1,0']))
    expect(selected.filter(sticker => sticker.color === 'D')).toHaveLength(4)
    const mixed = applyAlgorithm(createSolvedCube(), "R U F' D2 L B")
    expect(mixed.filter(sticker => ids.has(sticker.id))).toHaveLength(8)
  })
})
