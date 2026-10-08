import { applyAlgorithm, createSolvedCube, invertAlgorithm as invertMoves, type Face } from '../lib/cube';

export type AlgorithmCategory = 'Foundations' | '2-look OLL' | '2-look PLL' | 'Full PLL';

export interface Algorithm {
  id: string;
  name: string;
  nickname: string;
  category: AlgorithmCategory;
  notation: string;
  recognition: string;
  setup: string;
  tip: string;
  goal: string;
  /** The standard PLL case name, used to identify the complete 21-case set. */
  pllCase?: string;
  /** Also useful in the two-look transition to full CFOP. */
  twoLookBridge?: boolean;
  /** Exact yellow-up face after applying the inverse algorithm to a solved cube.
   * Rows run back to front; columns run left to right. Y means yellow. */
  topPattern?: string;
}

export function invertAlgorithm(notation: string): string {
  return invertMoves(notation).join(' ');
}

/** Exact sticker colors in the practice case, viewed with U (yellow) on top.
 * Side strips are each read left to right while looking directly at that face. */
export function algorithmDiagram(algorithm: Algorithm): { top: Face[]; sides: Record<'F' | 'R' | 'B' | 'L', Face[]> } {
  const state = applyAlgorithm(createSolvedCube(), invertMoves(algorithm.notation));
  const colorAt = (position: number[], normal: number[]): Face => {
    const sticker = state.find(item => item.position.every((value, i) => value === position[i]) && item.normal.every((value, i) => value === normal[i]));
    if (!sticker) throw new Error('Missing sticker in algorithm diagram');
    return sticker.color;
  };
  const columns = [-1, 0, 1];
  return {
    top: columns.flatMap(z => columns.map(x => colorAt([x, 1, z], [0, 1, 0]))),
    sides: {
      F: columns.map(x => colorAt([x, 1, 1], [0, 0, 1])),
      R: columns.map(z => colorAt([1, 1, -z], [1, 0, 0])),
      B: columns.map(x => colorAt([-x, 1, -1], [0, 0, -1])),
      L: columns.map(z => colorAt([-1, 1, z], [-1, 0, 0])),
    },
  };
}

export function isInCategory(algorithm: Algorithm, category: AlgorithmCategory): boolean {
  return category === '2-look PLL' ? algorithm.twoLookBridge === true : algorithm.category === category;
}

export const algorithms: Algorithm[] = [
  {
    id: 'right-trigger', name: 'Right trigger', nickname: 'Your first building block', category: 'Foundations',
    notation: "R U R' U'",
    recognition: 'A four-move finger-trick drill. It is a building block inside many algorithms, rather than a solution to every corner case.',
    setup: 'Keep the same face toward you. Start slowly with your right hand; turn U with your right index finger.',
    tip: 'On a solved cube, six repetitions return the cube to its starting state. Aim for four deliberate moves before adding speed.',
    goal: 'Build a relaxed, repeatable right-hand trigger.',
  },
  {
    id: 'left-trigger', name: 'Left trigger', nickname: 'Give both hands a turn', category: 'Foundations',
    notation: "L' U' L U",
    recognition: 'The mirror of the right trigger. Practice it as a movement drill so left-side inserts feel familiar.',
    setup: 'Keep the front face fixed. Use your left index finger to push or pull U′; choose the grip that feels comfortable.',
    tip: 'Six repetitions on a solved cube return to the starting state. Smooth left-hand turns make F2L more flexible.',
    goal: 'Build control with your left hand.',
  },
  {
    id: 'sledgehammer', name: 'Sledgehammer', nickname: 'A useful little shortcut', category: 'Foundations',
    notation: "R' F R F'",
    recognition: 'A four-move trigger found in F2L and last-layer algorithms. Which pieces it solves depends on their starting positions.',
    setup: 'Hold the same front face throughout. First follow the four turns individually, then connect them into one motion.',
    tip: 'Notice the front-right slot during the sequence. Avoid squeezing the cube while changing between R and F turns.',
    goal: 'Get comfortable connecting right and front turns.',
  },
  {
    id: 'oll-line', name: 'Yellow line', nickname: 'The first look: edges', category: '2-look OLL',
    notation: "F R U R' U' F'", topPattern: '..YYYY..Y',
    recognition: 'With the first two layers solved and yellow up, the yellow edge stickers form a straight line. Ignore the corners for this step.',
    setup: 'Hold the line horizontally, from left to right. Run the algorithm once to form the yellow cross.',
    tip: 'For a dot case (no yellow edges pointing up), do this once, then recognize and orient the resulting L case.',
    goal: 'Orient the last-layer edges without disturbing the first two layers.',
  },
  {
    id: 'oll-elbow', name: 'Yellow elbow', nickname: 'Turn the L into a cross', category: '2-look OLL',
    notation: "F U R U' R' F'", topPattern: 'YY.YY.Y..',
    recognition: 'Yellow edges form an L around the center. The corner stickers do not matter yet.',
    setup: 'Hold the two yellow edge stickers at the back and left of the top face. Perform the sequence once.',
    tip: 'This is the reverse turn order inside the front-face sandwich compared with the line algorithm.',
    goal: 'Finish orienting the yellow cross.',
  },
  {
    id: 'sune', name: 'Sune', nickname: 'Meet the famous fish', category: '2-look OLL',
    notation: "R U R' U R U2 R'", topPattern: '.Y.YYYYY.',
    recognition: 'The yellow cross is complete. Exactly one corner has yellow on top; the other three twist in the Sune direction.',
    setup: 'Put the yellow-up corner at front-left. The front-right corner must show its yellow sticker on the front face. If it shows yellow on the right instead, use Anti-Sune with its own orientation.',
    tip: 'Feel the rhythm: right trigger opening, another U, then R U2 R′. Keep your grip relaxed through the double turn.',
    goal: 'Orient the Sune corner case.',
  },
  {
    id: 'anti-sune', name: 'Anti-Sune', nickname: 'The fish, in reverse', category: '2-look OLL',
    notation: "R U2 R' U' R U' R'", topPattern: '.YYYYY.Y.',
    recognition: 'The yellow cross is complete and one corner points yellow up, with the opposite twist direction to Sune.',
    setup: 'Put the yellow-up corner at back-right. The front-left corner should show yellow on the front face.',
    tip: 'Anti-Sune is the inverse of Sune. Compare their exact practice setups to learn the difference from the side stickers.',
    goal: 'Recognize and orient the mirrored fish case.',
  },
  {
    id: 'oll-headlights', name: 'Headlights', nickname: 'Two corners, one pair', category: '2-look OLL',
    notation: "R2 D R' U2 R D' R' U2 R'", topPattern: 'YYYYYY.Y.',
    recognition: 'The yellow cross is complete. Two adjacent corners point yellow up; the other two yellow stickers make a pair of headlights on one side face.',
    setup: 'Hold the yellow headlights toward you, on the front face. The two yellow-up corners will be at the back.',
    tip: 'The D and D′ moves temporarily move the bottom layer. Keep the cube orientation fixed and finish the whole sequence.',
    goal: 'Orient the U-shaped corner case.',
  },
  {
    id: 'oll-chameleon', name: 'Chameleon', nickname: 'Two corners, split sides', category: '2-look OLL',
    notation: "R U R' U' L' U R U' R' L", topPattern: '.YYYYY.YY',
    recognition: 'The yellow cross is complete and two adjacent corners point yellow up. The other yellow stickers point to opposite side faces rather than forming headlights.',
    setup: 'Hold the two yellow-up corners on the right. The other yellow corner stickers should be on the front and back faces, on the left side.',
    tip: 'After the first right trigger, leave L′ open until the final L. Track the sequence in three small chunks.',
    goal: 'Orient the T-shaped corner case.',
  },
  {
    id: 'oll-bowtie', name: 'Bow tie', nickname: 'A diagonal connection', category: '2-look OLL',
    notation: "R U2 R D R' U2 R D' R2", topPattern: 'YY.YYY.YY',
    recognition: 'The yellow cross is complete and two diagonally opposite corners point yellow up.',
    setup: 'Hold the yellow-up corners at back-left and front-right. The front-left corner should show yellow on the front, and back-right should show yellow on the right.',
    tip: 'Use the exact setup below to check the orientation. The final R2 restores the right face after the D-layer sequence.',
    goal: 'Orient the diagonal corner case.',
  },
  {
    id: 'oll-h', name: 'Double headlights', nickname: 'The H corner case', category: '2-look OLL',
    notation: "R U R' U R U' R' U R U2 R'", topPattern: '.Y.YYY.Y.',
    recognition: 'The yellow cross is complete but no corners point yellow up. Yellow corner headlights appear on two opposite side faces.',
    setup: 'Hold those two yellow pairs on the left and right faces. There should be no yellow corner stickers facing front or back.',
    tip: 'All four yellow corners must be on the left and right faces before starting. This separates H from the Pi case.',
    goal: 'Orient the four twisted corners in the H case.',
  },
  {
    id: 'oll-pi', name: 'Pi case', nickname: 'One pair, four corners', category: '2-look OLL',
    notation: "R U2 R2 U' R2 U' R2 U2 R", topPattern: '.Y.YYY.Y.',
    recognition: 'The yellow cross is complete with no corners pointing yellow up. Only one side face has a yellow corner pair.',
    setup: 'Hold the yellow headlights on the left face. The two remaining yellow corner stickers face front and back on the right side.',
    tip: 'The top view looks like H, so check the side stickers. Count the three middle R2 turns to keep your place.',
    goal: 'Orient the four twisted corners in the Pi case.',
  },
  {
    id: 't-perm', name: 'T permutation', nickname: 'Adjacent corner and edge swap', category: 'Full PLL', pllCase: 'T', twoLookBridge: true,
    notation: "R U R' U' R' F R2 U' R' U' R U R' F'", topPattern: 'YYYYYYYYY',
    recognition: 'Yellow is fully oriented. The left face has matching corner stickers (headlights); two adjacent corners and two opposite edges exchange places. Check all four side strips below to confirm the full case.',
    setup: 'Put the matching corner pair on the left and match the side-strip diagram. If using this only for the two-look corner step, finish the edges afterward.',
    tip: 'Learn it as three chunks: R U R′ U′ · R′ F R2 U′ R′ U′ · R U R′ F′. In full PLL, recognize corners and edges together.',
    goal: 'Solve the T case in one algorithm.',
  },
  {
    id: 'y-perm', name: 'Y permutation', nickname: 'Diagonal corner and adjacent edge swap', category: 'Full PLL', pllCase: 'Y', twoLookBridge: true,
    notation: "F R U' R' U' R U R' F' R U R' U' R' F R F'", topPattern: 'YYYYYYYYY',
    recognition: 'Yellow is fully oriented. There are no matching corner pairs, and two neighboring edges swap along with diagonal corners. Distinguish it from N, V and E using the side-strip diagram.',
    setup: 'Keep yellow on top. Match the front, right, back and left strips below before starting; the full PLL case needs this exact orientation.',
    tip: 'The first chunk is F R U′ R′ U′ R U R′ F′; the second is R U R′ U′ R′ F R F′. It also works as the diagonal-corner step in two-look PLL.',
    goal: 'Solve the Y case in one algorithm.',
  },
  {
    id: 'ua-perm', name: 'Ua permutation', nickname: 'Cycle the final three edges', category: 'Full PLL', pllCase: 'Ua', twoLookBridge: true,
    notation: "R U' R U R U R U' R' U' R2", topPattern: 'YYYYYYYYY',
    recognition: 'Yellow is complete and all corners match their side centers. One upper edge is solved; the other three need a cycle.',
    setup: 'Put the solved edge at the back by rotating the whole cube. Use Ua when the front edge belongs on the right, the right edge belongs on the left, and the left edge belongs at the front.',
    tip: 'If the cycle runs the other way, use Ub. If no edge is solved (H or Z), perform a U-perm once, then recognize the remaining three-edge cycle.',
    goal: 'Finish the last-layer edge cycle.',
  },
  {
    id: 'ub-perm', name: 'Ub permutation', nickname: 'Take the other way around', category: 'Full PLL', pllCase: 'Ub', twoLookBridge: true,
    notation: "R2 U R U R' U' R' U' R' U R'", topPattern: 'YYYYYYYYY',
    recognition: 'All last-layer corners are solved. Three upper edges need to move in the opposite direction to Ua.',
    setup: 'Rotate the whole cube to put the solved edge at the back. Use Ub when the front edge belongs on the left, the left edge belongs on the right, and the right edge belongs at the front.',
    tip: 'Ua and Ub are inverses. Learn the destination of the front edge to tell them apart without memorizing “clockwise.”',
    goal: 'Finish the reverse last-layer edge cycle.',
  },
  ...([
    {
      pllCase: 'Aa', notation: "x R' U R' D2 R U' R' D2 R2 x'",
      nickname: 'Three corners, one direction',
      recognition: 'All four edges are in place. Three corners need a cycle; one corner is already solved. Compare the three side stickers against the strips below to separate Aa from Ab.',
      tip: 'x means rotate the entire cube like an R turn; x′ restores your starting view. Keep the two D2 turns deliberate.',
    },
    {
      pllCase: 'Ab', notation: "x R2 D2 R U R' D2 R U' R x'",
      nickname: 'Three corners, the reverse direction',
      recognition: 'All four edges are in place, with three corners cycling opposite to Aa. Use the solved corner and the side strips to choose the direction.',
      tip: 'This is the inverse of Aa. Learn the destination of a corner rather than guessing from the yellow top, which is identical for every PLL.',
    },
    {
      pllCase: 'E', notation: "x' R U' R' D R U R' D' R U R' D R U' R' D' x",
      nickname: 'All four corners trade places',
      recognition: 'The edges are solved and no corner headlights appear. Two pairs of corners swap. Check the front strip carefully to avoid choosing the wrong orientation.',
      tip: 'After x′, work in four R–U–R′ chunks separated by D or D′. The final x returns yellow to the top.',
    },
    {
      pllCase: 'F', notation: "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R",
      nickname: 'Opposite edges, neighboring corners',
      recognition: 'Two adjacent corners and two opposite edges swap. Unlike T, the matching corner pair and edge blocks sit in a different arrangement; use the exact side strips.',
      tip: 'Break the sequence after R′ U′ F′ and after the first F R2. Accuracy with the first front turn matters more than racing the whole sequence.',
    },
    {
      pllCase: 'Ga', notation: "R2 U R' U R' U' R U' R2 D U' R' U R D'",
      nickname: 'G family: corner and edge cycles',
      recognition: 'Three corners and three edges cycle. Find the headlights and the adjacent two-sticker block, then match their locations to the side strips. That relationship separates the four G cases.',
      tip: 'Keep yellow up through the whole sequence. D and D′ move only the bottom layer; they are not whole-cube rotations.',
    },
    {
      pllCase: 'Gb', notation: "R' U' R U D' R2 U R' U R U' R U' R2 D",
      nickname: 'G family: reverse of Ga',
      recognition: 'The headlights and one two-sticker block identify this G case. Ga and Gb have different cycle directions even when the yellow face looks the same.',
      tip: 'Gb reverses Ga. Start with R′ U′ R U, then treat the D′ to D portion as one controlled chunk.',
    },
    {
      pllCase: 'Gc', notation: "R2 U' R U' R U R' U R2 D' U R U' R' D",
      nickname: 'G family: the mirrored cycle',
      recognition: 'Find the headlights and the neighboring two-sticker block. Their arrangement mirrors Ga; check all four strips before committing.',
      tip: 'Pair every opening D′ with the closing D. Train Ga/Gc recognition separately from executing the moves.',
    },
    {
      pllCase: 'Gd', notation: "R U R' U' D R2 U' R U' R' U R' U R2 D'",
      nickname: 'G family: reverse of Gc',
      recognition: 'A corner cycle and an edge cycle happen together. Locate the headlights and block using the diagram; do not identify G cases from the top face.',
      tip: 'Gd is the inverse of Gc. Start with a right trigger, then keep your grip through the D to D′ section.',
    },
    {
      pllCase: 'H', notation: 'M2 U M2 U2 M2 U M2', twoLookBridge: true,
      nickname: 'Swap both pairs of opposite edges',
      recognition: 'All corners match their centers. The front edge belongs at the back and the left edge belongs on the right: both pairs of opposite edges swap.',
      tip: 'M is the middle slice between L and R, turned in the same direction as L. M2 is a half turn; use your ring finger if it feels comfortable.',
    },
    {
      pllCase: 'Ja', notation: "x R2 F R F' R U2 r' U r U2 x'",
      nickname: 'A neighboring corner and edge pair',
      recognition: 'Two adjacent corners and two adjacent edges swap. Find the solved side and the short color block, then match the strips to distinguish Ja from Jb.',
      tip: 'Lowercase r turns the right two layers together. x rotates the whole cube. Step through the demo before trying this grip on a physical cube.',
    },
    {
      pllCase: 'Jb', notation: "R U R' F' R U R' U' R' F R2 U' R' U'",
      nickname: 'The fast right-hand J case',
      recognition: 'Two neighboring corners and two neighboring edges exchange places. A complete side and a two-sticker block make it recognizable; use the orientation below.',
      tip: 'Think R U R′ F′ · R U R′ U′ · R′ F R2 U′ R′ U′. Smooth front turns make this a strong early full-PLL algorithm.',
    },
    {
      pllCase: 'Na', notation: "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'",
      nickname: 'Diagonal corners and opposite edges',
      recognition: 'No corner headlights appear. Diagonal corners and opposite edges exchange places, making repeating two-sticker blocks. Match the strips to distinguish Na from Nb.',
      tip: 'This longer variant uses familiar right-hand triggers and a Jb-like middle chunk. Build accuracy in chunks before timing it.',
    },
    {
      pllCase: 'Nb', notation: "R' U R U' R' F' U' F R U R' F R' F' R U' R",
      nickname: 'The other diagonal N swap',
      recognition: 'Diagonal corners and opposite edges swap, with the blocks arranged opposite to Na. Yellow remains complete; inspect the side colors.',
      tip: 'Keep the front face fixed and watch the F′ U′ F and F R′ F′ chunks. Do not substitute Na just because both look like an N.',
    },
    {
      pllCase: 'Ra', notation: "R U' R' U' R U R D R' U' R D' R' U2 R'",
      nickname: 'Neighboring corners and edges, R family',
      recognition: 'Two adjacent corners and two adjacent edges swap. A pair of headlights plus a two-sticker block separates R from J; match the exact arrangement below.',
      tip: 'Open with R U′ R′ U′, and close the temporary D turn with D′ before the final U2 R′.',
    },
    {
      pllCase: 'Rb', notation: "R2 F R U R U' R' F' R U2 R' U2 R",
      nickname: 'The mirrored R case',
      recognition: 'Look for the headlights and neighboring block. Their locations mirror Ra, so inspect the side strips instead of using only the corner pair.',
      tip: 'The two U2 turns at the end are separate beats. Keep F and F′ clean to avoid catching a layer.',
    },
    {
      pllCase: 'V', notation: "R' U R' U' y R' F' R2 U' R' U R' F R F y'",
      nickname: 'Diagonal corners, neighboring edges',
      recognition: 'Diagonal corners and two adjacent edges swap. Two matching blocks distinguish V from the other diagonal-corner cases; compare the strips below.',
      tip: 'y rotates the entire cube like a U turn; y′ at the end restores the view. First rehearse the rotation slowly so the following front turns make sense.',
    },
    {
      pllCase: 'Z', notation: "M2 U M2 U M' U2 M2 U2 M' U2", twoLookBridge: true,
      nickname: 'Swap two neighboring edge pairs',
      recognition: 'All corners match their centers. Two pairs of adjacent edges trade places, unlike H which swaps opposite edges.',
      tip: 'M′ turns the middle slice opposite to L. Practice the M2–U combinations slowly; keep track of the final U2 instead of stopping early.',
    },
  ] as Array<{ pllCase: string; notation: string; nickname: string; recognition: string; tip: string; twoLookBridge?: boolean }>).map(caseData => ({
    ...caseData,
    id: `${caseData.pllCase.toLowerCase()}-perm`,
    name: `${caseData.pllCase} permutation`,
    category: 'Full PLL' as const,
    topPattern: 'YYYYYYYYY',
    setup: 'Yellow stays on top. Turn U until the four side strips match the diagram; rotate your whole cube if needed. Each strip is viewed straight at that face, from left to right.',
    goal: `Solve the ${caseData.pllCase} case in one algorithm, then align the top layer if needed.`,
  })),
];
