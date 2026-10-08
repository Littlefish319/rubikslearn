import { describe, expect, it } from 'vitest'
import { lessons } from './curriculum'
import { applyAlgorithm, createSolvedCube, invertAlgorithm, type CubeState, type Vector } from '../lib/cube'

const solved = createSolvedCube()
const sameVector = (left: Vector, right: Vector) => left.every((value, index) => value === right[index])
const pieceIds = (position: Vector) => solved.filter((sticker) => sameVector(sticker.position, position)).map((sticker) => sticker.id)
const piece = (state: CubeState, home: Vector) => state.filter((sticker) => pieceIds(home).includes(sticker.id))
const prepare = (algorithm: string) => applyAlgorithm(solved, invertAlgorithm(algorithm))
const signature = (state: CubeState, ids: string[]) => state.filter((sticker) => ids.includes(sticker.id))
  .map((sticker) => `${sticker.position}/${sticker.normal}`).sort().join('|')
const algorithmsFor = (id: string) => lessons.find((lesson) => lesson.id === id)!.steps
  .flatMap((step) => step.algorithm ? [step.algorithm] : [])

function expectUnchanged(state: CubeState, ids: string[]) {
  for (const id of ids) expect(state.find((sticker) => sticker.id === id)).toEqual(solved.find((sticker) => sticker.id === id))
}

const crossIds = solved.filter((sticker) => sticker.position[1] === -1
  && sticker.position.filter((coordinate) => coordinate !== 0).length === 2).map((sticker) => sticker.id)
const f2lIds = solved.filter((sticker) => sticker.position[1] < 1).map((sticker) => sticker.id)
const targetIds = [...pieceIds([1, -1, 1]), ...pieceIds([1, 0, 1])]

describe('CFOP lesson cases match their instructions', () => {
  it('demonstrates an aligned top cross edge and a one-turn middle insertion', () => {
    const halfTurn = prepare('F2')
    const edge = piece(halfTurn, [0, -1, 1])
    expect(edge.every((sticker) => sameVector(sticker.position, [0, 1, 1]))).toBe(true)
    expect(edge.find((sticker) => sticker.color === 'D')!.normal).toEqual([0, 1, 0])
    expect(edge.find((sticker) => sticker.color === 'F')!.normal).toEqual([0, 0, 1])
    expectUnchanged(halfTurn, crossIds.filter((id) => !pieceIds([0, -1, 1]).includes(id)))

    const quarterTurn = prepare('F')
    const middleEdge = piece(quarterTurn, [0, -1, 1])
    expect(middleEdge.every((sticker) => sameVector(sticker.position, [1, 0, 1]))).toBe(true)
    expect(middleEdge.find((sticker) => sticker.color === 'D')!.normal).toEqual([1, 0, 0])
    expectUnchanged(quarterTurn, crossIds.filter((id) => !pieceIds([0, -1, 1]).includes(id)))
  })

  it('lifts a mismatched middle cross edge and restores the other three cross pieces', () => {
    const initial = prepare("F' U F L2")
    const target = piece(initial, [-1, -1, 0])
    expect(target.every((sticker) => sameVector(sticker.position, [1, 0, 1]))).toBe(true)
    expect(target.find((sticker) => sticker.color === 'D')!.normal).toEqual([1, 0, 0])
    const lifted = applyAlgorithm(initial, "F' U F")
    expect(piece(lifted, [-1, -1, 0]).find((sticker) => sticker.color === 'D')!.normal).toEqual([0, 1, 0])
    expect(piece(lifted, [-1, -1, 0])[0].position).toEqual([-1, 1, 0])
    expectUnchanged(lifted, crossIds.filter((id) => !pieceIds([-1, -1, 0]).includes(id)))
  })

  it('reorients the stated sideways top cross edge without moving solved cross edges', () => {
    const initial = prepare("F R U' R' F' B2")
    const target = piece(initial, [0, -1, -1])
    expect(target.every((sticker) => sameVector(sticker.position, [0, 1, 1]))).toBe(true)
    expect(target.find((sticker) => sticker.color === 'D')!.normal).toEqual([0, 0, 1])
    const lifted = applyAlgorithm(initial, "F R U' R' F'")
    expect(piece(lifted, [0, -1, -1])[0].position).toEqual([0, 1, -1])
    expect(piece(lifted, [0, -1, -1]).find((sticker) => sticker.color === 'D')!.normal).toEqual([0, 1, 0])
    expectUnchanged(lifted, crossIds.filter((id) => !pieceIds([0, -1, -1]).includes(id)))
  })

  it('starts the connected-pair insertion with two genuinely adjoining, matching pieces', () => {
    const initial = prepare("R U2 R'")
    const corner = piece(initial, [1, -1, 1])
    const edge = piece(initial, [1, 0, 1])
    expect(corner[0].position).toEqual([-1, 1, -1])
    expect(edge[0].position).toEqual([-1, 1, 0])
    for (const color of ['F', 'R']) {
      expect(corner.find((sticker) => sticker.color === color)!.normal)
        .toEqual(edge.find((sticker) => sticker.color === color)!.normal)
    }
    expectUnchanged(initial, f2lIds.filter((id) => !targetIds.includes(id)))
  })

  it('forms the white-up pair at the stated three-move boundary', () => {
    const initial = prepare("R U R' U2 R U2 R'")
    expect(piece(initial, [1, -1, 1])[0].position).toEqual([-1, 1, -1])
    expect(piece(initial, [1, -1, 1]).find((sticker) => sticker.color === 'D')!.normal).toEqual([0, 1, 0])
    expect(piece(initial, [1, 0, 1])[0].position).toEqual([1, 1, 0])
    const joined = applyAlgorithm(initial, "R U R'")
    expect(piece(joined, [1, -1, 1])[0].position).toEqual([1, 1, 1])
    expect(piece(joined, [1, 0, 1])[0].position).toEqual([1, 1, 0])
    for (const color of ['F', 'R']) {
      expect(piece(joined, [1, -1, 1]).find((sticker) => sticker.color === color)!.normal)
        .toEqual(piece(joined, [1, 0, 1]).find((sticker) => sticker.color === color)!.normal)
    }
    expectUnchanged(initial, f2lIds.filter((id) => !targetIds.includes(id)))
    expectUnchanged(joined, f2lIds.filter((id) => !targetIds.includes(id)))
  })

  it('the longer sideways-pair learning route is equivalent to its stated optimized route', () => {
    expect(applyAlgorithm(solved, "R U' R' R U2 R'")).toEqual(applyAlgorithm(solved, "R U R'"))
    const initial = prepare("R U' R' R U2 R'")
    expect(piece(initial, [1, -1, 1])[0].position).toEqual([1, 1, 1])
    expect(piece(initial, [1, -1, 1]).find((sticker) => sticker.color === 'D')!.normal).toEqual([1, 0, 0])
    expect(piece(initial, [1, 0, 1])[0].position).toEqual([0, 1, -1])
    const joined = applyAlgorithm(initial, "R U' R'")
    expect(piece(joined, [1, -1, 1])[0].position).toEqual([-1, 1, -1])
    expect(piece(joined, [1, 0, 1])[0].position).toEqual([-1, 1, 0])
    expectUnchanged(joined, f2lIds.filter((id) => !targetIds.includes(id)))
  })

  it('the three edge OLL cases cover all seven unsolved edge-orientation patterns under U rotation', () => {
    const edgeIds = solved.filter((sticker) => sticker.color === 'U'
      && sticker.position.filter((coordinate) => coordinate !== 0).length === 2).map((sticker) => sticker.id)
    const patterns = new Set<string>()
    for (const algorithm of algorithmsFor('cfop-oll').slice(0, 3)) {
      const initial = prepare(algorithm)
      expectUnchanged(initial, f2lIds)
      for (const rotation of ['', 'U', 'U2', "U'"]) patterns.add(signature(applyAlgorithm(initial, rotation), edgeIds))
    }
    expect(patterns.has(signature(solved, edgeIds))).toBe(false)
    expect(patterns.size).toBe(7)
  })

  it('the seven corner OLL cases cover all 26 unsolved corner orientations with yellow edges already up', () => {
    const cornerIds = solved.filter((sticker) => sticker.color === 'U'
      && sticker.position.filter((coordinate) => coordinate !== 0).length === 3).map((sticker) => sticker.id)
    const edgeIds = solved.filter((sticker) => sticker.color === 'U'
      && sticker.position.filter((coordinate) => coordinate !== 0).length === 2).map((sticker) => sticker.id)
    const patterns = new Set<string>()
    for (const algorithm of algorithmsFor('cfop-oll').slice(3)) {
      const initial = prepare(algorithm)
      expectUnchanged(initial, f2lIds)
      expect(signature(initial, edgeIds)).toEqual(signature(solved, edgeIds))
      for (const rotation of ['', 'U', 'U2', "U'"]) patterns.add(signature(applyAlgorithm(initial, rotation), cornerIds))
    }
    expect(patterns.has(signature(solved, cornerIds))).toBe(false)
    expect(patterns.size).toBe(26)
  })
})
