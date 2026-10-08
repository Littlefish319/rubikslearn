import Cube from '../vendor/cubejs/cube.js'
import { createSolvedCube, FACE_COLORS, type CubeState, type Face, type Sticker } from './cube'

export const INPUT_FACES: Face[] = ['U', 'R', 'F', 'D', 'L', 'B']
export const CUBE_COLORS: Record<Face, { name: string; hex: string }> = {
  U: { name: 'Yellow', hex: FACE_COLORS.D }, R: { name: 'Orange', hex: FACE_COLORS.L },
  F: { name: 'Green', hex: FACE_COLORS.F }, D: { name: 'White', hex: FACE_COLORS.U },
  L: { name: 'Red', hex: FACE_COLORS.R }, B: { name: 'Blue', hex: FACE_COLORS.B },
}
export type CubeEntry = Record<Face, Array<Face | null>>
export type CubeInputIssue = { message: string; indices: number[] }
export type CubeValidation = { valid: true; state: CubeState } | { valid: false; issues: CubeInputIssue[] }

export function blankCubeEntry(): CubeEntry {
  return Object.fromEntries(INPUT_FACES.map(face => [face, Array.from({ length: 9 }, (_, i) => i === 4 ? face : null)])) as CubeEntry
}
export function entryToFacelets(entry: CubeEntry): string {
  return INPUT_FACES.map(face => entry[face].map(color => color ?? '?').join('')).join('')
}
export function entryFromFacelets(facelets: string): CubeEntry {
  return Object.fromEntries(INPUT_FACES.map((face, i) => [face, facelets.slice(i * 9, i * 9 + 9).split('').map(color => INPUT_FACES.includes(color as Face) ? color as Face : null)])) as CubeEntry
}
export function faceletIndex(sticker: Sticker): number {
  const [x, y, z] = sticker.position
  const [nx, ny, nz] = sticker.normal
  const face: Face = ny === 1 ? 'U' : nx === 1 ? 'R' : nz === 1 ? 'F' : ny === -1 ? 'D' : nx === -1 ? 'L' : 'B'
  const cell = face === 'U' ? (z + 1) * 3 + x + 1
    : face === 'D' ? (1 - z) * 3 + x + 1
    : (1 - y) * 3 + (face === 'F' ? x : face === 'R' ? -z : face === 'B' ? -x : z) + 1
  return INPUT_FACES.indexOf(face) * 9 + cell
}
export function cubeStateToFacelets(state: CubeState): string {
  const facelets = Array<string>(54)
  state.forEach(sticker => { facelets[faceletIndex(sticker)] = sticker.color })
  return facelets.join('')
}
export function faceletsToCubeState(facelets: string): CubeState {
  return createSolvedCube().map(sticker => ({ ...sticker, color: facelets[faceletIndex(sticker)] as Face }))
}

const geometry = createSolvedCube()
const cubies = new Map<string, Sticker[]>()
geometry.forEach(sticker => {
  const key = sticker.position.join(',')
  cubies.set(key, [...cubies.get(key) ?? [], sticker])
})
const pieces = [...cubies.values()].filter(stickers => stickers.length > 1)
const expectedPieces = new Set(pieces.map(stickers => stickers.map(s => s.color).sort().join('')))
function parity(permutation: number[]): number {
  let inversions = 0
  for (let i = 0; i < permutation.length; i++) for (let j = i + 1; j < permutation.length; j++) if (permutation[i] > permutation[j]) inversions++
  return inversions % 2
}

/** Reject wrong colors, duplicate pieces, mirrored corners and physically impossible states. */
export function validateFacelets(facelets: string): CubeValidation {
  const issue = (message: string, indices: number[] = []): CubeValidation => ({ valid: false, issues: [{ message, indices }] })
  if (facelets.length !== 54) return issue('Enter all 54 stickers: nine on each of the six faces.')
  const missing = [...facelets].flatMap((color, i) => !INPUT_FACES.includes(color as Face) ? [i] : [])
  if (missing.length) return issue(`Fill the ${missing.length} remaining ${missing.length === 1 ? 'sticker' : 'stickers'} before solving.`, missing)
  const centers = INPUT_FACES.flatMap((face, i) => facelets[i * 9 + 4] !== face ? [i * 9 + 4] : [])
  if (centers.length) return issue('The center colors must match the selected faces. Recheck your yellow-top, green-front grip.', centers)
  const countIssues = INPUT_FACES.flatMap(face => {
    const indices = [...facelets].flatMap((color, i) => color === face ? [i] : [])
    return indices.length === 9 ? [] : [{ message: `${CUBE_COLORS[face].name} appears ${indices.length} times. Each color needs exactly nine stickers.`, indices }]
  })
  if (countIssues.length) return { valid: false, issues: countIssues }
  const seenPieces = new Set<string>()
  for (const stickers of pieces) {
    const indices = stickers.map(faceletIndex)
    const colors = indices.map(i => facelets[i]).sort().join('')
    if (!expectedPieces.has(colors)) return issue(`A ${stickers.length === 3 ? 'corner' : 'edge'} has a color combination that cannot exist. Recheck the marked stickers and face orientation.`, indices)
    if (seenPieces.has(colors)) return issue('The same piece appears twice. Recheck the marked stickers and the way you copied each face.', indices)
    seenPieces.add(colors)
  }
  const cube = Cube.fromString(facelets)
  if (cube.asString() !== facelets) return issue('A corner has its colors reversed. Recheck face orientation and the three stickers of each corner.')
  const state = cube.toJSON()
  if (state.co.reduce((sum, n) => sum + n, 0) % 3 !== 0) return issue('One or more corners are twisted inconsistently. Recheck your corner colors; this position cannot be made by normal turns.')
  if (state.eo.reduce((sum, n) => sum + n, 0) % 2 !== 0) return issue('An edge is flipped inconsistently. Recheck your edge colors; this position cannot be made by normal turns.')
  if (parity(state.cp) !== parity(state.ep)) return issue('The corner and edge positions do not match a legal scramble. Recheck all six faces for swapped stickers.')
  return { valid: true, state: faceletsToCubeState(facelets) }
}
