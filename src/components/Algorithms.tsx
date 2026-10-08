import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, Bookmark, Check, ChevronRight, Copy, Lightbulb, RotateCcw, Search, Sparkles, Target } from 'lucide-react';
import { algorithmDiagram, algorithms, invertAlgorithm, isInCategory, type Algorithm, type AlgorithmCategory } from '../data/algorithms';
import { FACE_COLORS, parseAlgorithm, type Face } from '../lib/cube';
import CubeTrainer from './CubeTrainer';
import './Algorithms.css';

const bookmarkKey = 'cubiq-bookmarks';
const repetitionKey = 'cubiq-algorithm-reps';
const categories: Array<'All algorithms' | AlgorithmCategory> = ['Full PLL', '2-look OLL', '2-look PLL', 'Foundations', 'All algorithms'];
const diagramColors: Record<Face, string> = { ...FACE_COLORS, U: FACE_COLORS.D, D: FACE_COLORS.U };
const diagramColorNames: Record<Face, string> = { U: 'yellow', D: 'white', F: 'green', R: 'red', B: 'blue', L: 'orange' };
const sideNames = { F: 'Front', R: 'Right', B: 'Back', L: 'Left' };
const diagrams = new Map(algorithms.map(algorithm => [algorithm.id, algorithmDiagram(algorithm)]));

function readBookmarks(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(bookmarkKey) || '[]');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string' && algorithms.some(algorithm => algorithm.id === id)) : [];
  } catch { return []; }
}

function readRepetitions(): Record<string, number> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(repetitionKey) || '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, number] => typeof entry[1] === 'number' && Number.isSafeInteger(entry[1]) && entry[1] >= 0));
  } catch { return {}; }
}

function Pattern({ algorithm, large = false }: { algorithm: Algorithm; large?: boolean }) {
  if (!algorithm.topPattern) return <div className={`alg-trigger-icon${large ? ' alg-trigger-icon-large' : ''}`} aria-hidden="true"><RotateCcw size={large ? 35 : 23} strokeWidth={1.6} /></div>;
  if (algorithm.pllCase) return <div className={`alg-pll-mini${large ? ' alg-pll-mini-large' : ''}`} aria-label={`Exact side colors for ${algorithm.pllCase} PLL. Yellow stays on top.`} role="img">
    {Object.entries(diagrams.get(algorithm.id)!.sides).map(([face, colors]) => <div key={face}><small>{face}</small>{colors.map((color, index) => <span key={index} style={{ background: diagramColors[color] }} />)}</div>)}
  </div>;
  return <div className={`alg-pattern${large ? ' alg-pattern-large' : ''}`} aria-label="Yellow sticker positions on the top face. The front edge is at the bottom." role="img">
    {diagrams.get(algorithm.id)!.top.map((sticker, index) => <span key={index} className={sticker === 'U' ? 'alg-yellow' : ''} />)}
  </div>;
}

function RecognitionDiagram({ algorithm }: { algorithm: Algorithm }) {
  const diagram = diagrams.get(algorithm.id)!;
  return <div className="alg-recognition-diagram">
    <div className="alg-section-label">EXACT CASE · YELLOW ON TOP</div>
    <div className="alg-side-strips">{(Object.keys(sideNames) as Array<keyof typeof sideNames>).map(face => <div className="alg-side-face" key={face}>
      <span>{sideNames[face]}</span>
      <div role="img" aria-label={`${sideNames[face]} top row: ${diagram.sides[face].map(color => diagramColorNames[color]).join(', ')}`}>
        {diagram.sides[face].map((color, index) => <span key={index} style={{ background: diagramColors[color] }} title={diagramColorNames[color]} />)}
      </div>
      <small><i className="alg-center-color" style={{ background: diagramColors[face] }} />{diagramColorNames[face]} center</small>
    </div>)}</div>
    <p>{algorithm.pllCase ? 'Every PLL has a solid yellow top. Recognize the side colors: headlights = matching corner stickers; a block = neighboring stickers of the same color.' : 'Check the side stickers too: Sune/Anti-Sune and H/Pi cannot be distinguished by the yellow top alone.'} Read each strip left to right while facing that side.</p>
  </div>;
}

export default function Algorithms() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<(typeof categories)[number]>('Full PLL');
  const [savedOnly, setSavedOnly] = useState(false);
  const [bookmarks, setBookmarks] = useState(readBookmarks);
  const [repetitions, setRepetitions] = useState(readRepetitions);
  const [selectedId, setSelectedId] = useState('t-perm');
  const [notice, setNotice] = useState('');
  const [storageWarning, setStorageWarning] = useState('');
  const detailRef = useRef<HTMLElement>(null);
  const visibleAlgorithms = useMemo(() => {
    const search = query.trim().toLowerCase();
    const matchesName = (algorithm: Algorithm) => algorithm.name.toLowerCase() === search || algorithm.pllCase?.toLowerCase() === search;
    const exactName = search.length > 0 && algorithms.some(matchesName);
    return algorithms.filter(algorithm => {
      const haystack = `${algorithm.name} ${algorithm.nickname} ${algorithm.category} ${algorithm.notation} ${algorithm.recognition}`.toLowerCase();
      return (category === 'All algorithms' || isInCategory(algorithm, category))
        && (!savedOnly || bookmarks.includes(algorithm.id))
        && (exactName ? matchesName(algorithm) : search.split(/\s+/).every(term => haystack.includes(term)));
    });
  }, [query, category, savedOnly, bookmarks]);
  const selected = algorithms.find(algorithm => algorithm.id === selectedId) || algorithms[0];
  const selectedRepetitions = repetitions[selected.id] || 0;
  const totalRepetitions = Object.values(repetitions).reduce((sum, count) => sum + count, 0);

  useEffect(() => {
    if (visibleAlgorithms.length && !visibleAlgorithms.some(algorithm => algorithm.id === selectedId)) setSelectedId(visibleAlgorithms[0].id);
  }, [visibleAlgorithms, selectedId]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function toggleBookmark(id: string) {
    const next = bookmarks.includes(id) ? bookmarks.filter(saved => saved !== id) : [...bookmarks, id];
    setBookmarks(next);
    try { localStorage.setItem(bookmarkKey, JSON.stringify(next)); }
    catch { setStorageWarning('Browser storage is unavailable. Your practice will stay here until this page closes.'); }
  }

  function recordRepetition() {
    const next = { ...repetitions, [selected.id]: selectedRepetitions + 1 };
    setRepetitions(next);
    try {
      localStorage.setItem(repetitionKey, JSON.stringify(next));
      const today = new Date();
      const day = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const existing = JSON.parse(localStorage.getItem('cubiq-activity') || '[]');
      const activity = Array.isArray(existing) && existing.every(item => typeof item === 'string') ? existing : [];
      if (!activity.includes(day)) localStorage.setItem('cubiq-activity', JSON.stringify([...activity, day]));
      window.dispatchEvent(new CustomEvent('cubiq-data-change'));
    }
    catch { setStorageWarning('Browser storage is unavailable. Your practice will stay here until this page closes.'); }
    setNotice(`Repetition logged for ${selected.name}.`);
  }

  function selectAlgorithm(id: string) {
    setSelectedId(id);
    setNotice('');
    if (window.matchMedia('(max-width: 760px)').matches) {
      window.requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  }

  async function copyAlgorithm() {
    try {
      await navigator.clipboard.writeText(selected.notation);
      setNotice('Algorithm copied.');
    } catch {
      setNotice('Copy is unavailable here. You can select and copy the notation above.');
    }
  }

  return <div className="alg-page">
    <header className="alg-page-heading">
      <div>
        <div className="alg-eyebrow"><span /> CFOP · COMPETITION METHOD</div>
        <h1>Your full PLL toolkit<span>.</span></h1>
        <p>All 21 PLL cases: place the last-layer corners and edges in one look.</p>
      </div>
      <div className="alg-library-summary">
        <span className="alg-summary-icon"><Bookmark size={21} /></span>
        <div><strong>{bookmarks.length} saved <span> / {algorithms.length} algorithms</span></strong><small>{totalRepetitions} {totalRepetitions === 1 ? 'repetition' : 'repetitions'} logged by you</small></div>
      </div>
    </header>

    <details className="alg-method-context alg-context-details"><summary>CFOP and OLL coverage <ChevronRight size={18} /></summary><div><strong>Learn the elite method in stages.</strong><p>Full PLL is one part of CFOP: Cross → F2L → OLL → PLL. Learn a few cases well, add recognition and finger tricks, then grow the set. The 9 OLL algorithms here are a two-look bridge; full OLL has 57 cases and is the next milestone.</p><a href="#learn">Follow the CFOP training path <ArrowRight size={15} /></a></div></details>

    <div className="alg-search-row">
      <label className="alg-search"><Search size={18} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Find an algorithm, pattern, or move…" aria-label="Search algorithms" />{query && <button onClick={() => setQuery('')} type="button" aria-label="Clear search">×</button>}</label>
      <button className={`alg-saved-filter${savedOnly ? ' alg-is-selected' : ''}`} type="button" aria-pressed={savedOnly} onClick={() => setSavedOnly(!savedOnly)}><Bookmark size={16} fill={savedOnly ? 'currentColor' : 'none'} />Saved <span>{bookmarks.length}</span></button>
    </div>

    <div className="alg-filter-row" aria-label="Algorithm categories">
      {categories.map(item => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)} className={category === item ? 'alg-filter-active' : ''}>{item}<span>{item === 'All algorithms' ? algorithms.length : algorithms.filter(algorithm => isInCategory(algorithm, item)).length}</span></button>)}
    </div>
    {category === '2-look PLL' && <p className="alg-bridge-note">Transition set: first place the corners with T or Y, then solve the edges with Ua, Ub, H or Z. The same six algorithms belong to full PLL; this filter helps you learn them first.</p>}
    {category === '2-look OLL' && <p className="alg-bridge-note">Transition set: orient the yellow edges first, then the corners. These 9 algorithms cover two-look OLL; they are not the complete 57-case, one-look OLL set.</p>}

    <div className="alg-layout">
      <section className="alg-library" aria-label="Algorithm library">
        <div className="alg-results-label"><span>{visibleAlgorithms.length} {visibleAlgorithms.length === 1 ? 'algorithm' : 'algorithms'}</span><span>Select one to explore <ArrowDown size={13} /></span></div>
        <div className="alg-card-grid">
          {visibleAlgorithms.map(algorithm => <article key={algorithm.id} className={`alg-card${selected.id === algorithm.id ? ' alg-card-active' : ''}`}>
            <button className="alg-card-main" onClick={() => selectAlgorithm(algorithm.id)} aria-pressed={selected.id === algorithm.id} type="button">
              <div className="alg-card-top"><Pattern algorithm={algorithm} /><span className={`alg-category-tag alg-category-${algorithm.category === 'Foundations' ? 'foundation' : algorithm.category === '2-look OLL' ? 'oll' : 'pll'}`}>{algorithm.category}</span></div>
              <h2>{algorithm.name}</h2><p>{algorithm.nickname}</p>
              <div className="alg-card-bottom"><span title="Notation steps, including whole-cube rotations where used">{parseAlgorithm(algorithm.notation).length} steps</span><span>{repetitions[algorithm.id] ? `${repetitions[algorithm.id]} reps` : 'Learn this case'}<ArrowRight size={15} /></span></div>
            </button>
            <button type="button" className={`alg-card-bookmark${bookmarks.includes(algorithm.id) ? ' alg-bookmarked' : ''}`} aria-label={`${bookmarks.includes(algorithm.id) ? 'Unsave' : 'Save'} ${algorithm.name}`} aria-pressed={bookmarks.includes(algorithm.id)} onClick={() => toggleBookmark(algorithm.id)}><Bookmark size={16} fill={bookmarks.includes(algorithm.id) ? 'currentColor' : 'none'} /></button>
          </article>)}
        </div>
        {!visibleAlgorithms.length && <div className="alg-empty"><Search size={28} /><h2>{savedOnly && !bookmarks.length ? 'Build your own playbook.' : 'No matching moves yet.'}</h2><p>{savedOnly && !bookmarks.length ? 'Tap the bookmark on an algorithm to keep it close for your next practice.' : 'Try a different search or explore another collection.'}</p><button type="button" onClick={() => { setQuery(''); setCategory('All algorithms'); setSavedOnly(false); }}>Explore all algorithms <ArrowRight size={16} /></button></div>}
        <details className="alg-learning-details"><summary>Move notation help <ChevronRight size={18} /></summary><div className="alg-notation-note"><Lightbulb size={18} /><p><strong>Read the moves.</strong> R = right, L = left, U = top, D = bottom, F = front, B = back. Clockwise means looking straight at the face you turn. <strong>′</strong> = counterclockwise; <strong>2</strong> = a half turn. <strong>x / y</strong> rotate the whole cube like R / U; lowercase <strong>r</strong> turns the right two layers; <strong>M</strong> turns the middle slice in the same direction as L.</p></div></details>
      </section>

      <aside className="alg-detail" ref={detailRef} aria-label={`${selected.name} practice`}>
        <div className="alg-detail-heading"><div className="alg-eyebrow">ON THE PRACTICE MAT</div><button type="button" className={`alg-detail-save${bookmarks.includes(selected.id) ? ' alg-bookmarked' : ''}`} onClick={() => toggleBookmark(selected.id)} aria-label={`${bookmarks.includes(selected.id) ? 'Unsave' : 'Save'} ${selected.name}`} aria-pressed={bookmarks.includes(selected.id)}><Bookmark size={18} fill={bookmarks.includes(selected.id) ? 'currentColor' : 'none'} /></button></div>
        <div className="alg-detail-title"><div><h2>{selected.name}</h2><p>{selected.goal}</p></div><Pattern algorithm={selected} large /></div>
        <div className="alg-cube-wrap"><CubeTrainer key={selected.id} algorithm={selected.notation} compact coach /></div>
        <details className="alg-learning-details"><summary>Case recognition & algorithm <ChevronRight size={18} /></summary>
        {selected.topPattern && <RecognitionDiagram algorithm={selected} />}
        <div className="alg-notation-block"><div className="alg-section-label"><span>THE ALGORITHM</span><button type="button" onClick={copyAlgorithm} aria-label={`Copy ${selected.name} algorithm`}><Copy size={13} /> Copy</button></div><div className="alg-notation" aria-label={selected.notation}>{selected.notation.split(' ').map((move, index) => <span key={`${selected.id}-${index}`}>{move.replace("'", '′')}</span>)}</div></div>
        <div className="alg-instructions">
          <section><h3><Search size={15} /> Spot the pattern</h3><p>{selected.recognition}</p></section>
          <section><h3><Target size={15} /> Hold it like this</h3><p>{selected.setup}</p></section>
        </div>
        <div className="alg-coach-tip"><Sparkles size={18} /><p>{selected.tip}</p></div>
        {selected.pllCase && <p className="alg-variant-note">This is one valid variant for {selected.pllCase}. <a href="https://speedcubedb.com/a/3x3/PLL" target="_blank" rel="noreferrer">Compare other finger-trick variants ↗</a></p>}
        </details>
        <details className="alg-exact-setup"><summary>Set up this exact case on your cube <ChevronRight size={15} /></summary><p>Start solved with yellow on top. Keep the front face fixed and apply this inverse sequence. Then practice the algorithm above to return to solved.</p><code>{invertAlgorithm(selected.notation).replaceAll("'", '′')}</code></details>
        <div className="alg-practice-log"><div><strong>{selectedRepetitions}<span> reps</span></strong><small>Logged by you · saved on this device</small></div><button type="button" onClick={recordRepetition}><Check size={16} /> Log a repetition</button></div>
        <p className="alg-feedback" role="status" aria-live="polite">{notice || 'Practice on your cube, then log each completed repetition.'}</p>
      </aside>
    </div>
    {storageWarning && <p className="alg-storage-warning" role="alert">{storageWarning}</p>}
  </div>;
}
