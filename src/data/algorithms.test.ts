import { describe, expect, it } from 'vitest';
import { algorithmDiagram, algorithms, invertAlgorithm, isInCategory } from './algorithms';
import { applyAlgorithm, createSolvedCube, isCubeSolved, parseAlgorithm, type CubeState } from '../lib/cube';

const solved = createSolvedCube();
const pll = algorithms.filter(algorithm => algorithm.category === 'Full PLL');

/** Recognize a permutation independently of its chosen top alignment and y view. */
function canonicalPermutation(state: CubeState): string {
  const candidates: string[] = [];
  for (let top = 0; top < 4; top++) for (let view = 0; view < 4; view++) {
    const transformed = applyAlgorithm(state, [...Array(top).fill('U'), ...Array(view).fill('y')].join(' '));
    const centers = transformed.filter(sticker => sticker.position.filter(value => value !== 0).length === 1);
    const colorsByPosition = new Map(centers.map(sticker => [sticker.normal.join(','), sticker.color]));
    const normalByColor = new Map(centers.map(sticker => [sticker.color, sticker.normal.join(',')]));
    const signature = transformed.map(sticker => `${sticker.position.join(',')}/${sticker.normal.join(',')}:${normalByColor.get(sticker.color)}`).sort().join('|');
    expect(colorsByPosition.size).toBe(6);
    candidates.push(signature);
  }
  return candidates.sort()[0];
}

describe('complete CFOP PLL library', () => {
  it('contains the 21 standard named PLL cases without renaming existing bookmarks', () => {
    expect(pll.map(algorithm => algorithm.pllCase).sort()).toEqual(['Aa', 'Ab', 'E', 'F', 'Ga', 'Gb', 'Gc', 'Gd', 'H', 'Ja', 'Jb', 'Na', 'Nb', 'Ra', 'Rb', 'T', 'Ua', 'Ub', 'V', 'Y', 'Z'].sort());
    expect(new Set(algorithms.map(algorithm => algorithm.id)).size).toBe(algorithms.length);
    expect(['t-perm', 'y-perm', 'ua-perm', 'ub-perm'].every(id => pll.some(algorithm => algorithm.id === id))).toBe(true);
  });

  it.each(pll)('$name is a legal last-layer permutation and its practice case returns to solved', algorithm => {
    expect(parseAlgorithm(algorithm.notation).length).toBeGreaterThan(0);
    const practice = applyAlgorithm(solved, invertAlgorithm(algorithm.notation));
    for (const original of solved.filter(sticker => sticker.position[1] < 1)) {
      const actual = practice.find(sticker => sticker.id === original.id)!;
      expect(actual.position, `F2L position of ${original.id}`).toEqual(original.position);
      expect(actual.normal, `F2L orientation of ${original.id}`).toEqual(original.normal);
    }
    expect(practice.filter(sticker => sticker.normal[1] === 1).every(sticker => sticker.color === 'U')).toBe(true);
    expect(isCubeSolved(practice)).toBe(false);
    expect(isCubeSolved(applyAlgorithm(practice, algorithm.notation))).toBe(true);
    const diagram = algorithmDiagram(algorithm);
    expect(diagram.top).toEqual(Array(9).fill('U'));
    expect(Object.values(diagram.sides).flat().every(color => color !== 'U' && color !== 'D')).toBe(true);
  });

  it('represents 21 different permutations after ignoring AUF and whole-cube y views', () => {
    const signatures = pll.map(algorithm => canonicalPermutation(applyAlgorithm(solved, invertAlgorithm(algorithm.notation))));
    expect(new Set(signatures).size).toBe(21);
  });

  it.each([['Aa', 'Ab'], ['Ga', 'Gb'], ['Gc', 'Gd'], ['Ua', 'Ub']])('%s and %s have the expected opposite permutation directions', (forward, reverse) => {
    const first = pll.find(algorithm => algorithm.pllCase === forward)!;
    const second = pll.find(algorithm => algorithm.pllCase === reverse)!;
    expect(applyAlgorithm(applyAlgorithm(solved, first.notation), second.notation)).toEqual(solved);
  });

  it('draws the Ua side colors in the correct front/right/back/left viewing order', () => {
    const diagram = algorithmDiagram(pll.find(algorithm => algorithm.pllCase === 'Ua')!);
    expect(diagram.sides).toEqual({ F: ['F', 'R', 'F'], R: ['R', 'L', 'R'], B: ['B', 'B', 'B'], L: ['L', 'F', 'L'] });
  });

  it('keeps the six two-look PLL bridge algorithms selectable alongside the complete set', () => {
    expect(algorithms.filter(algorithm => isInCategory(algorithm, '2-look PLL')).map(algorithm => algorithm.pllCase).sort()).toEqual(['H', 'T', 'Ua', 'Ub', 'Y', 'Z']);
    expect(algorithms.filter(algorithm => isInCategory(algorithm, '2-look OLL'))).toHaveLength(9);
  });
});
