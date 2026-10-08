export type Lesson = {
  id: string
  title: string
  description: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  duration: string
  category: string
  steps: { title: string; body: string; algorithm?: string }[]
  quiz: { question: string; options: string[]; answer: number; explanation: string }
}

export const lessons: Lesson[] = [
  {
    id: 'meet-your-cube', title: 'Meet your cube', description: 'A little understanding. A lot less guessing.',
    level: 'Beginner', duration: '4 min', category: 'Foundations',
    steps: [
      { title: 'Six centers are your compass', body: 'Pick up a standard 3×3 cube. Each face has a center with one color. Centers define which color belongs on that face: a white sticker belongs around the white center, regardless of how you hold the cube.\n\nOn a standard color scheme, white is opposite yellow, blue opposite green, and red opposite orange. Check your own cube before starting; its colors may differ.' },
      { title: 'Pieces move together', body: 'There are 12 edges with two stickers each and 8 corners with three stickers each. You cannot move one sticker by itself. The white–red edge always stays white–red.\n\nFind that edge, then find a white–red–blue corner. Its three centers tell you the corner’s one correct home. A solved white face alone does not mean the first layer is solved: its side stickers must match their centers too.' },
      { title: 'Your first route to a solve', body: 'We will build a white cross, finish the white corners, insert the middle edges, then solve the yellow layer. Keep white on the bottom from the corner lesson onward.\n\nPractice: scramble your cube with 15 gentle turns. Find all four white edges without trying to solve them. Then point to the centers that define each edge’s home. Accuracy comes before speed.' },
    ],
    quiz: { question: 'Which pieces tell you the correct color of each face?', options: ['The corner pieces', 'The center pieces', 'Whichever stickers are already together'], answer: 1, explanation: 'Centers define the faces. Edges and corners are solved relative to them.' },
  },
  {
    id: 'cube-notation', title: 'Speak cube', description: 'Read any algorithm, one turn at a time.',
    level: 'Beginner', duration: '5 min', category: 'Foundations',
    steps: [
      { title: 'Give each face a name', body: 'Hold the cube in one fixed position. U = Up, D = Down, R = Right, L = Left, F = Front, B = Back. These letters name positions relative to you, not colors.\n\nTurning a face moves only that outer layer. Do not rotate the whole cube unless the instruction says to. A cube rotation changes which color is at the front.' },
      { title: 'Clockwise means looking at that face', body: 'R means turn the right face 90° clockwise as if you were looking directly at the right face. R′ (written R\' in algorithms) means 90° counterclockwise. R2 means 180° in either direction. The same rules apply to every face.\n\nPractice R followed by R\'. The cube should return exactly to its starting state. Then try U U U U and F2 F2.', algorithm: "R R'   U U U U   F2 F2" },
      { title: 'Learn your first four-move trigger', body: 'Keep the same front face throughout. Read from left to right: right clockwise, top clockwise, right counterclockwise, top counterclockwise.\n\nRepeat this complete sequence six times on a solved cube. It returns to solved. This is a useful turn-reading exercise, not a general solution for any scramble.', algorithm: "R U R' U'" },
      { title: 'Know the extra symbols', body: 'Later, lowercase r means turn the right two layers together; lowercase f means the front two layers together. M is the middle slice between L and R, turning in the same direction as L. M\' reverses it.\n\nTo reverse an algorithm, reverse the order of the moves and invert each move. For example, the inverse of R U is U\' R\'. A 2 stays a 2. This lets you set up a practice case from a solved cube.' },
    ],
    quiz: { question: 'What does U2 mean?', options: ['Turn the top face 180°', 'Turn the top two layers 90°', 'Turn the top face counterclockwise 90°'], answer: 0, explanation: 'A 2 is a half-turn of the named layer. Lowercase letters, such as r, indicate wide turns.' },
  },
  {
    id: 'white-cross', title: 'Build the white cross', description: 'Your first four pieces, in the right homes.',
    level: 'Beginner', duration: '8 min', category: 'First solve',
    steps: [
      { title: 'Start with a daisy', body: 'Hold the yellow center on top. Move the four white edge stickers around it to make a daisy. Ignore white corners.\n\nIf a white edge sticker faces outward in the middle layer, turn the side face it can travel around to bring the white sticker to U. Before lifting an edge, turn U so its destination around the yellow center is empty; this protects petals you already made.' },
      { title: 'Find the remaining petals', body: 'A white sticker facing down can be brought straight up with a half-turn of its side face. First move any petal above that face out of the way with U.\n\nIf a white edge is in the top or bottom layer but its white sticker faces sideways, turn that side face a quarter-turn to put the edge into the middle layer. Then use the previous step to lift it into an empty top position. Work on one white edge at a time; the other colors need not match yet.' },
      { title: 'Match, then send it down', body: 'With yellow still on top, choose a white petal. Turn U until its side sticker matches the center directly below it. Turn that matching side face 180°. Its white sticker moves to the bottom, correctly matched to its side center.\n\nRepeat for each petal. Only use U to align the next petal, then a half-turn of its matching side. You will finish with a white cross on the bottom.' },
      { title: 'Check all four side matches', body: 'Look underneath: four white edges surround the white center. Look around the sides: each edge’s other sticker matches its adjacent center. Both conditions are required.\n\nPractice three crosses without a timer. Say each edge’s two colors before moving it. Later you can skip the daisy and plan edges directly into the bottom cross, but the daisy is a reliable first stepping stone.' },
    ],
    quiz: { question: 'A white cross is complete when…', options: ['There are four white stickers around any center', 'The white face has no other colors', 'White edges surround white, and their side colors match all four side centers'], answer: 2, explanation: 'A cross is four correctly positioned edges, including their side-color matches.' },
  },
  {
    id: 'white-corners', title: 'Finish your first layer', description: 'Give every white corner a home.',
    level: 'Beginner', duration: '8 min', category: 'First solve',
    steps: [
      { title: 'White stays on the bottom', body: 'Keep white down and yellow up. Find a white corner in the top layer. Its other two colors identify its bottom slot between the matching side centers.\n\nRotate the whole cube around its vertical axis so that this slot is at the front-right. Turn U until the corner is directly above it at the top-front-right. Its white sticker can face in any direction.' },
      { title: 'Insert with the right-hand trigger', body: 'From that exact setup, repeat the full four-move sequence until the corner sits in the bottom-front-right slot with white down and both side colors matching. Check only after each complete sequence; this normally takes 1, 3, or 5 repetitions.\n\nThen rotate the whole cube to bring the next target slot to front-right and repeat. The already solved corners and cross return correctly after each completed insertion.', algorithm: "R U R' U'" },
      { title: 'Rescue a corner from the bottom', body: 'If a white corner is trapped in the wrong bottom slot, or in the correct slot but twisted, rotate that slot to bottom-front-right. Do the four-move trigger once to lift it into the top layer.\n\nNow locate the corner again, set up its correct home at front-right, and follow the insertion step. Do not twist a corner by hand.', algorithm: "R U R' U'" },
      { title: 'Check a layer, not just a face', body: 'All nine stickers on the bottom should be white. The bottom row of every side should also match that side’s center. If white is complete but a side row is mismatched, that corner belongs in a different slot.\n\nPractice: solve the first layer three times. Pause before every insertion to point to the two side centers that define the corner’s destination.' },
    ],
    quiz: { question: 'Before using the repeated right-hand trigger, where should the target corner and its home be?', options: ['Corner at top-front-right, correct home directly below', 'Corner anywhere in the top layer', 'Correct home at bottom-back-left'], answer: 0, explanation: 'The setup is essential: the target corner must sit directly above its home at the front-right.' },
  },
  {
    id: 'middle-layer', title: 'Solve the middle layer', description: 'Two insertions unlock the next four edges.',
    level: 'Beginner', duration: '10 min', category: 'First solve',
    steps: [
      { title: 'Choose an edge without yellow', body: 'Keep white down. In the top layer, find an edge with no yellow sticker. Turn U until its outward-facing sticker matches a side center, then rotate the whole cube to make that side your front. The edge is now at top-front.\n\nLook at the edge’s upward-facing sticker. If its color matches the right center, insert right. If it matches the left center, insert left.' },
      { title: 'Insert to the right', body: 'Prerequisite: the top-front edge’s front sticker matches the front center, and its top sticker matches the right center. Keep the same front throughout all eight moves.\n\nThis moves that edge into the front-right middle slot while restoring your first layer.', algorithm: "U R U' R' U' F' U F" },
      { title: 'Insert to the left', body: 'Prerequisite: the top-front edge’s front sticker matches the front center, and its top sticker matches the left center. Keep the same front throughout the sequence.\n\nRepeat the search-and-insert process until all four middle edges match their two centers.', algorithm: "U' L' U L U F U' F'" },
      { title: 'Fix a trapped or flipped edge', body: 'If all top edges contain yellow but the middle is unsolved, a non-yellow edge is in a wrong slot or flipped in place. Put that slot at front-right and perform the right insertion with any top edge. This ejects the trapped edge into the top layer.\n\nLocate the ejected edge, align it with its center, and insert it correctly. Your bottom two layers are complete when the bottom two rows on every side match their centers.' },
    ],
    quiz: { question: 'Your top-front edge matches the front center, and its top color matches the left center. Which insertion do you need?', options: ['Right insertion', 'Left insertion', 'A top half-turn only'], answer: 1, explanation: 'The top sticker identifies the destination side. Here the edge belongs in the front-left slot.' },
  },
  {
    id: 'yellow-cross', title: 'Make the yellow cross', description: 'Read a dot, an elbow, or a line.',
    level: 'Beginner', duration: '6 min', category: 'Last layer',
    steps: [
      { title: 'Look only at yellow edges', body: 'Keep yellow on top and the first two layers solved. Ignore the top corners for now. The top yellow edges form a dot, an L, a line, or a cross.\n\nOne or three yellow edges facing up cannot occur on a normally scrambled, correctly assembled cube at this stage. Recheck your first two layers and how you counted.' },
      { title: 'Turn a line into a cross', body: 'Use U to put the two upward-facing yellow edges at top-left and top-right: a horizontal line across the top. Perform the six moves below.\n\nIf you already have a yellow cross, skip this algorithm. The cross’s side colors do not need to match their centers yet.', algorithm: "F R U R' U' F'" },
      { title: 'Handle an L or a dot', body: 'For an L, use U to place its yellow edge arms at top-back and top-left. Perform the same algorithm once, inspect the new line, orient it left-to-right, and repeat.\n\nFor a dot, perform it once from any front to create an L. Set up that L and follow the instructions above. Inspect and reorient between repetitions.', algorithm: "F R U R' U' F'" },
    ],
    quiz: { question: 'How should you hold the yellow line before this algorithm?', options: ['Front-to-back across the top', 'On the bottom face', 'Left-to-right across the top'], answer: 2, explanation: 'The yellow line must run from the top-left edge to the top-right edge.' },
  },
  {
    id: 'yellow-edges', title: 'Match the yellow edges', description: 'Move the cross into its final position.',
    level: 'Beginner', duration: '7 min', category: 'Last layer',
    steps: [
      { title: 'Find two side matches', body: 'With yellow up, turn U and inspect the four side stickers of the yellow cross. Find a U position with at least two edges matching their side centers. If all four match, this stage is already done.\n\nCount edge stickers only, not corners. The bottom two layers must remain solved.' },
      { title: 'Two adjacent matches', body: 'If the two matching edges are adjacent, rotate the whole cube so they are at the back and right. The mismatched edges are now front and left.\n\nPerform the algorithm including its final U. It swaps the front and left top edges while keeping the back and right edges in place. It may move or twist yellow corners; that is expected.', algorithm: "R U R' U R U2 R' U" },
      { title: 'Two opposite matches', body: 'If the matching edges are opposite each other, perform the algorithm once from any front. Then try U turns again until two adjacent edges match. Rotate the whole cube to put those matches at back and right, and perform it again.\n\nFinish only when all four yellow edges’ side stickers match their centers. You are solving positions here, not just yellow stickers.', algorithm: "R U R' U R U2 R' U" },
    ],
    quiz: { question: 'With two adjacent matching edges, where do you hold them for this algorithm?', options: ['Front and left', 'Back and right', 'Front and back'], answer: 1, explanation: 'Back and right stay fixed. The algorithm exchanges the front and left edges.' },
  },
  {
    id: 'yellow-corner-positions', title: 'Place the last four corners', description: 'Right location first. Right twist next.',
    level: 'Beginner', duration: '7 min', category: 'Last layer',
    steps: [
      { title: 'A correct location can still look twisted', body: 'A corner is in its correct location when its three sticker colors match the three centers surrounding that position, even if yellow faces sideways.\n\nInspect all four top corners. Do not use U turns now: your yellow edges already match. If every corner is in the right location, continue to the next lesson.' },
      { title: 'Keep one corner at the front-right', body: 'If exactly one corner is in the correct location, rotate the entire cube to put it at top-front-right. Keep yellow up.\n\nPerform the sequence below. It keeps that corner in place and cycles the other three. Inspect their locations and repeat once more if necessary, without turning U between repetitions.', algorithm: "U R U' L' U R' U' L" },
      { title: 'If no corner is correctly placed', body: 'Perform the same sequence once with any front. Inspect again: you will now have at least one correctly located corner. Rotate the whole cube to put a correct corner at top-front-right, then use the previous step.\n\nAt the end, every corner’s set of colors belongs between its surrounding centers. Yellow stickers may still point sideways.', algorithm: "U R U' L' U R' U' L" },
    ],
    quiz: { question: 'What makes a corner correctly located during this stage?', options: ['Yellow must face up', 'Its three colors match the three surrounding centers', 'It is next to any matching sticker'], answer: 1, explanation: 'Position and orientation are different. A corner can be in the correct slot but still need twisting.' },
  },
  {
    id: 'finish-your-solve', title: 'Your first solved cube', description: 'A careful final sequence. A big first win.',
    level: 'Beginner', duration: '8 min', category: 'Last layer',
    steps: [
      { title: 'Lock in your grip', body: 'Start with all edges solved and all corners in their correct locations. Keep yellow up. Rotate the whole cube now to put an incorrectly oriented yellow corner at top-front-right.\n\nFrom this point until all corners are oriented, keep the same front face. The lower layers will temporarily look scrambled. Continue the full procedure; do not repair them between corners.' },
      { title: 'Orient one corner', body: 'Repeat the four-move sequence below until the top-front-right corner has yellow facing up. An unsolved corner needs two or four full repetitions.\n\nAlways finish all four moves, including the final D, before checking. Do not stop halfway through a sequence when yellow first appears on top.', algorithm: "R' D' R D" },
      { title: 'Bring the next corner with U only', body: 'Turn only U to bring another incorrectly oriented top corner to top-front-right. Do not rotate the whole cube. Repeat the same four-move sequence until its yellow sticker faces up.\n\nSkip already oriented corners using U. Continue until all four are yellow on top. The temporary lower-layer disruption resolves when every corner is finished.', algorithm: "R' D' R D" },
      { title: 'Align the top and celebrate', body: 'Finally turn U until the side colors line up. Your cube should be solved. If the bottom is still disrupted, the usual causes are rotating the whole cube between corners, missing the final D, or starting before all corners were in their correct slots.\n\nPractice another complete solve with the lessons open. A reliable, understood solve is the foundation of speed. You do not need to race yet.' },
    ],
    quiz: { question: 'Between corner twists, how do you bring the next unsolved corner to top-front-right?', options: ['Rotate the whole cube', 'Turn only the U layer', 'Turn the bottom face'], answer: 1, explanation: 'Keep the same front throughout. U moves the next corner into the working position while preserving the cancellation that restores the lower layers.' },
  },
  {
    id: 'intuitive-f2l', title: 'Think in pairs: intuitive F2L', description: 'Solve a corner and its edge together.',
    level: 'Intermediate', duration: '12 min', category: 'CFOP',
    steps: [
      { title: 'Replace two stages with one', body: 'CFOP means Cross, First Two Layers, Orientation of the Last Layer, Permutation of the Last Layer. F2L solves each white corner together with its matching middle edge into one slot.\n\nStart after a solved white cross. Find a white corner and the edge sharing its two non-white colors. Their home is between those two side centers. Begin untimed: your first F2L solves may be slower than the beginner method.' },
      { title: 'Learn a verified right-slot insertion', body: 'Use a solved cube to build a case: keep white down and perform R U\' R\'. That is the inverse of the insertion below and lifts a connected corner–edge pair into the top layer. Inspect how its two colors form matching blocks.\n\nNow do the insertion below to restore the front-right slot. Repeat until you can predict where both pieces move. This is one prepared case, not an algorithm for every F2L situation.', algorithm: "R U R'" },
      { title: 'Learn the mirrored front-slot insertion', body: 'From a solved cube, set up a second connected-pair case with F\' U F. Watch the corner and edge together, then reverse that setup using the insertion below.\n\nBoth drills target the same front-right slot from different top positions. In a real solve, use U to place a connected pair at a position you recognize, then insert it without disturbing completed slots.', algorithm: "F' U' F" },
      { title: 'Explore instead of memorizing blindly', body: 'For an unpaired case, put the target slot at front-right. Track the corner and edge while opening that empty slot with R or F\', moving U, and closing it again. A useful idea is to hide one piece temporarily in the empty slot, move the other with U, then bring the hidden piece back to connect them.\n\nThis is an exploration drill, not a complete 41-case solution chart. If you cannot pair a case yet, use the white-corner and middle-edge lessons to finish that slot. Add one understood F2L case at a time while keeping the rest of your solve reliable.' },
      { title: 'Measure the habit that matters', body: 'Practice five untimed first-two-layer solves. Before inserting a pair, name its slot and point to both pieces. Try to reduce unnecessary cube rotations while keeping turns relaxed.\n\nDo not chase a fast single yet. Compare your average over a consistent set of solves, and notice whether pauses between pairs are getting shorter.' },
    ],
    quiz: { question: 'What does an F2L pair consist of?', options: ['Any two yellow edges', 'A white corner and its matching middle-layer edge', 'Two neighboring centers'], answer: 1, explanation: 'A corner and the edge with the same two side colors can be paired and inserted together to solve an F2L slot.' },
  },
  {
    id: 'two-look-oll', title: 'Two-look OLL', description: 'Orient edges, then recognize seven corner cases.',
    level: 'Intermediate', duration: '18 min', category: 'CFOP',
    steps: [
      { title: 'Two decisions to a yellow face', body: 'Start with the first two layers solved and yellow up. First orient the four yellow edges; then choose one of seven corner algorithms. Corner positions are irrelevant during OLL.\n\nFor every case below, top-front means the row nearest you and top-back means the row farthest away. Rotate U to match the exact yellow sticker pattern, including the side-sticker clues. Learn one case at a time. To generate a case, apply the inverse of its algorithm to a solved cube.' },
      { title: 'Look one: yellow edges', body: 'Line: hold the yellow edge line left-to-right and do F R U R\' U\' F\'.\n\nL: hold its yellow edge arms at front and right and do f R U R\' U\' f\'. Here lowercase f turns the front TWO layers together.\n\nDot: with no upward-facing yellow edges, do the full combined sequence below from any front, without a setup turn between its two halves. If you already have a cross, skip this look.', algorithm: "F R U R' U' F' f R U R' U' f'" },
      { title: 'Sune: one corner up', body: 'Setup: the only upward-facing yellow corner is top-front-left. At top-front-right, the yellow sticker faces FRONT. The other two side-facing yellow stickers face right at back-right, and back at back-left.\n\nMatch all these clues; one corner up alone is not enough to distinguish Sune from anti-Sune.', algorithm: "R U R' U R U2 R'" },
      { title: 'Anti-Sune: the other one-corner case', body: 'Setup: the only upward-facing yellow corner is top-back-right. At top-front-right, the yellow sticker faces RIGHT. The front-left yellow sticker faces front, and the back-left yellow sticker faces left.\n\nKeep that orientation through the sequence.', algorithm: "R U2 R' U' R U' R'" },
      { title: 'H: no corners up, two headlights', body: 'Setup: no yellow corner faces up. Both yellow corner stickers on the front face point toward you, and both on the back face point backward. These two-sticker pairs are often called headlights.\n\nThe yellow edge cross remains on top.', algorithm: "R U2 R' U' R U R' U' R U' R'" },
      { title: 'Pi: no corners up, one headlight pair', body: 'Setup: no yellow corner faces up. The two LEFT-side corner stickers are yellow. The front-right corner’s yellow sticker faces front; the back-right corner’s yellow sticker faces back.\n\nThis separates Pi from H: the two yellow stickers on the right side do not form a pair.', algorithm: "R U2 R2 U' R2 U' R2 U2 R" },
      { title: 'U: two corners up at the back', body: 'Setup: the two back corners have yellow on top. The two front corners have yellow facing FRONT, forming a front headlight pair.\n\nThis algorithm uses D turns. Turn only the bottom layer for D; keep the whole cube in the same grip.', algorithm: "R2 D R' U2 R D' R' U2 R'" },
      { title: 'T: two corners up on the right', body: 'Setup: both right corners have yellow on top. On the left, the front-left corner’s yellow sticker faces front, and the back-left corner’s yellow sticker faces back.\n\nLowercase r turns the right two layers together. R turns only the outer right layer; they are different moves.', algorithm: "r U R' U' r' F R F'" },
      { title: 'L: two diagonal corners up', body: 'Setup: yellow faces up at top-front-left and top-back-right. At top-front-right, yellow faces front. At top-back-left, yellow faces LEFT.\n\nAfter the correct case algorithm, all nine top stickers are yellow and your first two layers stay solved. The side stickers may still be permuted; that is the next lesson.', algorithm: "F' r U R' U' r' F R" },
    ],
    quiz: { question: 'What must be checked before selecting a one-corner-up OLL algorithm?', options: ['Only the number of yellow corners on top', 'The top pattern and the directions of the side-facing yellow stickers', 'Whether every top edge already matches its side center'], answer: 1, explanation: 'Sune and anti-Sune both have one corner up. Their side-facing yellow stickers distinguish the cases and correct setup.' },
  },
  {
    id: 'two-look-pll', title: 'Two-look PLL', description: 'Finish with corner swaps, then edge cycles.',
    level: 'Intermediate', duration: '18 min', category: 'CFOP',
    steps: [
      { title: 'Two decisions to solved', body: 'Start with a fully yellow top and solved first two layers. First put the top corners in their correct positions, then permute the edges. A final U alignment is called AUF: adjustment of the upper face.\n\nHeadlights means the two top corner stickers on one side face are the same color. Ignore that face’s middle edge sticker while recognizing corners.' },
      { title: 'Adjacent corner swap: T permutation', body: 'If there is exactly one headlight pair, turn U until that pair matches its side center. Rotate the whole cube so the matching pair is on the LEFT. The two right corners need to exchange places.\n\nPerform T below. It swaps those right corners and two edges. If every side already has matching corner pairs, align U and skip the corner step.', algorithm: "R U R' U' R' F R2 U' R' U' R U R' F'" },
      { title: 'Diagonal corner swap: Y permutation', body: 'If there are no headlights on any side, the corners need a diagonal swap. Use Y below from any front, then turn U until all four corners match their centers.\n\nCheck corners alone. Edges are allowed to remain misplaced; solve them in the next look.', algorithm: "F R U' R' U' R U R' F' R U R' U' R' F R F'" },
      { title: 'Ua: three-edge cycle', body: 'With all corners aligned, find the one solved top edge and rotate the whole cube so it is at the BACK. For this Ua algorithm, the current FRONT edge belongs on the RIGHT, the current RIGHT edge belongs on the LEFT, and the current LEFT edge belongs at the FRONT.\n\nJudge an edge’s destination by its side color and the corresponding center. If the cycle goes the other way, use Ub in the next step.', algorithm: "R U' R U R U R U' R' U' R2" },
      { title: 'Ub: the reverse three-edge cycle', body: 'Keep the one solved edge at the BACK. For this Ub algorithm, the current FRONT edge belongs on the LEFT, the LEFT edge belongs on the RIGHT, and the RIGHT edge belongs at the FRONT.\n\nUa and Ub preserve the corners and the back edge. If all edges already match, your cube is solved.', algorithm: "R2 U R U R' U' R' U' R' U R'" },
      { title: 'H: opposite edges exchange', body: 'If no edge is solved, compare their destinations. For H, front and back edges need to exchange, and left and right edges need to exchange. Any front works.\n\nM is the middle slice between L and R, turning like L. M2 is a half-turn of just that middle slice. Practice the slice notation before trying this algorithm at speed.', algorithm: "M2 U M2 U2 M2 U M2" },
      { title: 'Z: neighboring edges exchange', body: 'The remaining edge case is two adjacent swaps. Rotate the whole cube so the FRONT and RIGHT edges need to exchange, and the BACK and LEFT edges need to exchange.\n\nUse the algorithm below, including its final U2 alignment. M\' is a quarter-turn of the middle slice opposite to L. If slice turns are new, a slower valid fallback is to apply Ua once, locate the resulting solved edge, then finish with the matching Ua or Ub case.', algorithm: "M2 U M2 U M' U2 M2 U2 M' U2" },
      { title: 'Build a recognition habit', body: 'Practice one case by applying its inverse to a solved cube, identifying its setup, and solving it. Then mix cases. Read the side stickers before starting an algorithm; guessing an algorithm and inspecting afterward trains the wrong habit.\n\nTwo-look OLL and two-look PLL are a practical bridge. Full PLL has 21 cases and full OLL has 57, but reliable recognition and smooth F2L remain valuable long before learning them all.' },
    ],
    quiz: { question: 'For the Ua and Ub algorithms taught here, where must the one solved top edge be?', options: ['At the front', 'At the left', 'At the back'], answer: 2, explanation: 'Both listed U permutations keep the back edge fixed and cycle the front, right, and left edges.' },
  },
  {
    id: 'lookahead-lab', title: 'Less pause. More flow.', description: 'Train the habits behind consistent speed.',
    level: 'Advanced', duration: '10 min', category: 'Deliberate practice',
    steps: [
      { title: 'Slow turns, continuous decisions', body: 'During F2L, turn at a speed where you can track another unsolved pair while finishing the current pair. If you lose pieces, slow down. A metronome around one turn per second can make pauses obvious, but it is optional.\n\nDo five untimed solves aiming for continuous movement. This is a lookahead drill, not an instruction to force every solve to be slow forever.' },
      { title: 'Plan a cross before starting', body: 'Use inspection to identify the four cross edges. Plan one or two edges first, then gradually plan all four. Execute your plan and verify every side match.\n\nWhen a planned cross is reliable, try executing it without looking, only during practice and only as far as your plan goes. Reopen your eyes to inspect the result. Predicting the full cross takes time.' },
      { title: 'Separate turning from recognition', body: 'Choose one algorithm. Do five accurate repetitions with relaxed finger turns, then five trials where you must recognize its case before executing. Compare whether your delay is recognition, recall, or turning.\n\nStop if your hands hurt. Short, focused sessions with breaks build better habits than repeated rushed solves.' },
      { title: 'Use averages with honest penalties', body: 'For a WCA-style average of 5, remove the fastest and slowest result and average the remaining three. A +2 adds two seconds before ranking; one DNF is discarded as the worst result, while two DNFs make the average DNF.\n\nCompare like-for-like sessions with the same puzzle and method. Record a note about one recurring pause, then choose tomorrow’s drill from that evidence. A single personal best is exciting; a repeatable average shows progress.' },
      { title: 'Build a sustainable practice loop', body: 'Try 5 minutes of cross planning, 10 minutes of slow F2L, 5 minutes of one last-layer case, and a short timed session. Adjust this to your experience and available time.\n\nCompetition readiness also means learning official rules, inspection, penalties, and equipment procedures. This app supports practice; it cannot guarantee a title or replace official WCA regulations and in-person competition experience.' },
    ],
    quiz: { question: 'What is the purpose of deliberately slower F2L practice?', options: ['To maximize turns per second immediately', 'To track the next pieces and reduce pauses', 'To avoid planning your cross'], answer: 1, explanation: 'Controlled turning frees attention to locate the next pair. The goal is better decisions and fewer pauses.' },
  },
]
