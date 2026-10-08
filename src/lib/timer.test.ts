import { describe, expect, it } from 'vitest'
import { averageOf, effectiveTime, formatTime, generateScramble, getInspectionPenalty, getSessionStats, parseSolves, type Penalty, type Solve } from './timer'

const solve = (time: number, penalty: Penalty = 'none'): Solve => ({
  id: String(time), time, penalty, scramble: 'R U', date: '2026-10-08T00:00:00.000Z',
})

describe('competition-style averages', () => {
  it('drops the best and worst times for ao5, including a single DNF as the worst', () => {
    expect(averageOf([10, 20, 30, 40, 50].map(time => solve(time * 1000)), 5)).toBe(30_000)
    expect(averageOf([solve(10_000), solve(20_000), solve(30_000), solve(40_000), solve(50_000, 'DNF')], 5)).toBe(30_000)
  })

  it('returns DNF with two DNFs, and waits for enough solves', () => {
    expect(averageOf([solve(10_000, 'DNF'), solve(20_000, 'DNF'), solve(30_000), solve(40_000), solve(50_000)], 5)).toBe(Infinity)
    expect(averageOf([solve(10_000)], 5)).toBeNull()
  })

  it('uses only the latest twelve solves and drops one at each end', () => {
    const records = Array.from({ length: 12 }, (_, index) => solve((index + 1) * 1000))
    expect(averageOf([...records, solve(999_000)], 12)).toBe(6500)
  })

  it('applies +2 before ordering and averaging', () => {
    expect(effectiveTime(solve(10_000, '+2'))).toBe(12_000)
    expect(averageOf([solve(1000), solve(2000, '+2'), solve(3000), solve(5000), solve(8000)], 5)).toBe(4000)
  })

  it('excludes DNFs from successful-solve session mean and best', () => {
    expect(getSessionStats([solve(1000), solve(2000, '+2'), solve(500, 'DNF')])).toEqual({ count: 3, best: 1000, mean: 2500, ao5: null, ao12: null })
    expect(getSessionStats([]).best).toBeNull()
  })
})

describe('timer and storage helpers', () => {
  it('applies inspection penalties after, not at, the 15 and 17 second boundaries', () => {
    expect(getInspectionPenalty(14_999)).toBe('none')
    expect(getInspectionPenalty(15_000)).toBe('none')
    expect(getInspectionPenalty(15_001)).toBe('+2')
    expect(getInspectionPenalty(16_999)).toBe('+2')
    expect(getInspectionPenalty(17_000)).toBe('+2')
    expect(getInspectionPenalty(17_001)).toBe('DNF')
  })

  it('formats centiseconds without rounding a solve down across a minute', () => {
    expect(formatTime(59_999)).toBe('59.99')
    expect(formatTime(61_230)).toBe('1:01.23')
    expect(formatTime(Infinity)).toBe('DNF')
    expect(formatTime(null)).toBe('—')
  })

  it('generates twenty legal moves without consecutive turns on the same axis', () => {
    const axes: Record<string, number> = { U: 0, D: 0, R: 1, L: 1, F: 2, B: 2 }
    const moves = generateScramble().split(' ')
    expect(moves).toHaveLength(20)
    moves.forEach((move, index) => {
      expect(move).toMatch(/^[UDRLFB](?:2|')?$/)
      if (index > 0) expect(axes[move[0]]).not.toBe(axes[moves[index - 1][0]])
    })
  })

  it('rejects broken persisted data and retains valid solve records', () => {
    expect(parseSolves('{bad')).toEqual([])
    expect(parseSolves('{}')).toEqual([])
    expect(parseSolves(JSON.stringify([solve(1000), null, { ...solve(3000), time: -1 }, { ...solve(4000), penalty: 'invalid' }]))).toEqual([solve(1000)])
  })
})
