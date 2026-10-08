export type CubieState = { center: number[]; cp: number[]; co: number[]; ep: number[]; eo: number[] }
export default class Cube {
  constructor(state?: CubieState)
  static fromString(facelets: string): Cube
  static initSolver(): void
  static inverse(algorithm: string): string
  asString(): string
  toJSON(): CubieState
  move(algorithm: string): this
  clone(): Cube
  isSolved(): boolean
  solve(maxDepth?: number): string
}
