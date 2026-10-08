/** A sticker model: coordinates and outward normals are exact integers. */
export type Vector = [number, number, number]
export type Face = 'U' | 'R' | 'F' | 'D' | 'L' | 'B'
export type TurnFace = Face | 'M' | 'E' | 'S' | 'x' | 'y' | 'z' | 'r' | 'l' | 'u' | 'd' | 'f' | 'b'
export type Move = `${TurnFace}${'' | "'" | '2'}`
export interface Sticker { id: string; color: Face; position: Vector; normal: Vector }
export type CubeState = Sticker[]
export interface TurnDefinition { axis: 0 | 1 | 2; layers: number[]; direction: 1 | -1; turns: number }

export const FACE_COLORS: Record<Face, string> = {
  U: '#ffffff', R: '#e52332', F: '#00a651', D: '#ffdf00', L: '#ff8200', B: '#075be8',
}
/** Rotate the standard white-top scheme around the front axis, preserving its handedness. */
export const YELLOW_TOP_COLORS: Record<Face, string> = { ...FACE_COLORS, U: FACE_COLORS.D, D: FACE_COLORS.U, R: FACE_COLORS.L, L: FACE_COLORS.R }
export const FACE_NAMES: Record<Face, string> = { U: 'Up', R: 'Right', F: 'Front', D: 'Down', L: 'Left', B: 'Back' }
const FACE_NORMALS: Record<Face, Vector> = { U: [0, 1, 0], R: [1, 0, 0], F: [0, 0, 1], D: [0, -1, 0], L: [-1, 0, 0], B: [0, 0, -1] }
const DEFINITIONS: Record<TurnFace, Omit<TurnDefinition, 'turns'>> = {
  U: { axis: 1, layers: [1], direction: -1 }, D: { axis: 1, layers: [-1], direction: 1 },
  R: { axis: 0, layers: [1], direction: -1 }, L: { axis: 0, layers: [-1], direction: 1 },
  F: { axis: 2, layers: [1], direction: -1 }, B: { axis: 2, layers: [-1], direction: 1 },
  M: { axis: 0, layers: [0], direction: 1 }, E: { axis: 1, layers: [0], direction: 1 },
  S: { axis: 2, layers: [0], direction: -1 },
  x: { axis: 0, layers: [-1, 0, 1], direction: -1 }, y: { axis: 1, layers: [-1, 0, 1], direction: -1 }, z: { axis: 2, layers: [-1, 0, 1], direction: -1 },
  r: { axis: 0, layers: [0, 1], direction: -1 }, l: { axis: 0, layers: [-1, 0], direction: 1 },
  u: { axis: 1, layers: [0, 1], direction: -1 }, d: { axis: 1, layers: [-1, 0], direction: 1 },
  f: { axis: 2, layers: [0, 1], direction: -1 }, b: { axis: 2, layers: [-1, 0], direction: 1 },
}

export function createSolvedCube(): CubeState {
  return (Object.keys(FACE_NORMALS) as Face[]).flatMap((face) => {
    const normal = FACE_NORMALS[face]
    const axis = normal.findIndex((value) => value !== 0)
    const otherAxes = [0, 1, 2].filter((value) => value !== axis)
    const stickers: Sticker[] = []
    for (let row = -1; row <= 1; row++) for (let column = -1; column <= 1; column++) {
      const position: Vector = [...normal]
      position[otherAxes[0]] = row
      position[otherAxes[1]] = column
      stickers.push({ id: `${face}${row + 1}${column + 1}`, color: face, position, normal: [...normal] })
    }
    return stickers
  })
}

/** Stable sticker identities for the cubies a CFOP exercise asks you to track. */
export function trainingTargetStickerIds(focus: 'cross' | 'f2l'): Set<string> {
  return new Set(createSolvedCube().filter(({ position: [x, y, z] }) => focus === 'f2l'
    ? x === 1 && z === 1 && (y === -1 || y === 0)
    : y === -1 && Math.abs(x) + Math.abs(y) + Math.abs(z) === 2).map(({ id }) => id))
}

export function parseAlgorithm(algorithm: string): Move[] {
  const normalized = algorithm.trim().replace(/[′’]/g, "'").replace(/([URFDLB])w/g, (_, face: string) => face.toLowerCase())
  if (!normalized) return []
  return normalized.split(/\s+/).map((token) => {
    if (!/^[URFDLBMESxyzurfdlb](?:2|')?$/.test(token)) throw new Error(`Unknown move “${token}”. Use moves such as R, U', or F2 separated by spaces.`)
    return token as Move
  })
}

export function turnDefinition(move: Move): TurnDefinition {
  return { ...DEFINITIONS[move[0] as TurnFace], direction: (DEFINITIONS[move[0] as TurnFace].direction * (move.endsWith("'") ? -1 : 1)) as 1 | -1, turns: move.endsWith('2') ? 2 : 1 }
}

function rotateVector(vector: Vector, axis: number, direction: number): Vector {
  const [x, y, z] = vector
  const result: Vector = axis === 0 ? [x, -direction * z, direction * y]
    : axis === 1 ? [direction * z, y, -direction * x] : [-direction * y, direction * x, z]
  return result.map((value) => value === 0 ? 0 : value) as Vector
}

export function applyMove(state: CubeState, move: Move): CubeState {
  const { axis, layers, direction, turns } = turnDefinition(move)
  return state.map((sticker) => {
    if (!layers.includes(sticker.position[axis])) return sticker
    let position: Vector = [...sticker.position]
    let normal: Vector = [...sticker.normal]
    for (let count = 0; count < turns; count++) {
      position = rotateVector(position, axis, direction)
      normal = rotateVector(normal, axis, direction)
    }
    return { ...sticker, position, normal }
  })
}

export function applyAlgorithm(state: CubeState, algorithm: string | Move[]): CubeState {
  return (typeof algorithm === 'string' ? parseAlgorithm(algorithm) : algorithm).reduce(applyMove, state)
}

export function inverseMove(move: Move): Move {
  return move.endsWith('2') ? move : move.endsWith("'") ? move[0] as Move : `${move}'` as Move
}

export function invertAlgorithm(algorithm: string | Move[]): Move[] {
  return [...(typeof algorithm === 'string' ? parseAlgorithm(algorithm) : algorithm)].reverse().map(inverseMove)
}

export function isCubeSolved(state: CubeState): boolean {
  const faces = new Map<string, Face>()
  return state.every((sticker) => {
    const key = sticker.normal.join(',')
    const existing = faces.get(key)
    if (existing && existing !== sticker.color) return false
    faces.set(key, sticker.color)
    return true
  })
}

/** Training scramble, generated locally; this is not a WCA random-state scramble. */
export function generateScramble(length = 20, random: () => number = Math.random): Move[] {
  const faces: Face[] = ['U', 'R', 'F', 'D', 'L', 'B']
  const suffixes = ['', "'", '2']
  const result: Move[] = []
  for (let index = 0; index < length; index++) {
    const previous = result.at(-1)
    const candidates = faces.filter((face) => !previous || DEFINITIONS[face].axis !== DEFINITIONS[previous[0] as Face].axis)
    const face = candidates[Math.floor(random() * candidates.length)]
    result.push(`${face}${suffixes[Math.floor(random() * 3)]}` as Move)
  }
  return result
}
