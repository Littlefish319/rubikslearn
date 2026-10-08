export type AlgorithmCategory = 'Foundations' | '2-look OLL' | '2-look PLL';

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
  /** Exact yellow-up face after applying the inverse algorithm to a solved cube.
   * Rows run back to front; columns run left to right. Y means yellow. */
  topPattern?: string;
}

export function invertAlgorithm(notation: string): string {
  return notation.trim().split(/\s+/).reverse().map(move =>
    move.endsWith('2') ? move : move.endsWith("'") ? move.slice(0, -1) : `${move}'`,
  ).join(' ');
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
    id: 't-perm', name: 'T permutation', nickname: 'Put adjacent corners in place', category: '2-look PLL',
    notation: "R U R' U' R' F R2 U' R' U' R U R' F'", topPattern: 'YYYYYYYYY',
    recognition: 'The yellow face is complete. For the corner-permutation step, look for one pair of matching corner side stickers (headlights); ignore the edges.',
    setup: 'Put the matching corner pair on the left. This swaps the two right-side corners and also swaps two edges. Align U afterward so the corners match the side centers.',
    tip: 'The same algorithm is also a full PLL case when the edge permutation matches. Here it is used as the first look to place the corners.',
    goal: 'Place the last-layer corners before solving the edges.',
  },
  {
    id: 'y-perm', name: 'Y permutation', nickname: 'Connect the diagonal corners', category: '2-look PLL',
    notation: "F R U' R' U' R U R' F' R U R' U' R' F R F'", topPattern: 'YYYYYYYYY',
    recognition: 'The yellow face is complete but there are no matching corner side-sticker pairs on any face. The corner permutation is diagonal.',
    setup: 'Use any top-layer orientation for this corner step. Run the algorithm, then turn U to align the corners with the side centers. The edges are solved in the next look.',
    tip: 'The complete Y case also swaps two edges. During two-look PLL, focus on positioning the corners first.',
    goal: 'Resolve the diagonal corner swap.',
  },
  {
    id: 'ua-perm', name: 'Ua permutation', nickname: 'Cycle the final three edges', category: '2-look PLL',
    notation: "R U' R U R U R U' R' U' R2", topPattern: 'YYYYYYYYY',
    recognition: 'Yellow is complete and all corners match their side centers. One upper edge is solved; the other three need a cycle.',
    setup: 'Put the solved edge at the back by rotating the whole cube. Use Ua when the front edge belongs on the right, the right edge belongs on the left, and the left edge belongs at the front.',
    tip: 'If the cycle runs the other way, use Ub. If no edge is solved (H or Z), perform a U-perm once, then recognize the remaining three-edge cycle.',
    goal: 'Finish the last-layer edge cycle.',
  },
  {
    id: 'ub-perm', name: 'Ub permutation', nickname: 'Take the other way around', category: '2-look PLL',
    notation: "R2 U R U R' U' R' U' R' U R'", topPattern: 'YYYYYYYYY',
    recognition: 'All last-layer corners are solved. Three upper edges need to move in the opposite direction to Ua.',
    setup: 'Rotate the whole cube to put the solved edge at the back. Use Ub when the front edge belongs on the left, the left edge belongs on the right, and the right edge belongs at the front.',
    tip: 'Ua and Ub are inverses. Learn the destination of the front edge to tell them apart without memorizing “clockwise.”',
    goal: 'Finish the reverse last-layer edge cycle.',
  },
];
