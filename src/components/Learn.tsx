import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronDown, ChevronRight, Clock3, Eye, Flag, Layers3, Lightbulb, Play, RotateCcw, Target, Trophy, Zap } from 'lucide-react'
import { lessons, type Lesson } from '../data/curriculum'
import { invertAlgorithm } from '../lib/cube'
import CubeTrainer from './CubeTrainer'
import './Learn.css'

type LearnProps = { initialLessonId?: string; onProgressChange?: () => void }
const stages = [
  { name: 'Cross', letter: 'C', subtitle: '4 edges on the bottom', id: 'cfop-cross', icon: Target },
  { name: 'F2L', letter: 'F', subtitle: '4 corner + edge pairs', id: 'cfop-f2l', icon: Layers3 },
  { name: 'OLL', letter: 'O', subtitle: 'Make the top one color', id: 'cfop-oll', icon: Eye },
  { name: 'PLL', letter: 'P', subtitle: 'Put the last pieces home', id: 'cfop-pll', icon: Flag },
]
function readProgress(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem('cubiq-progress') || '[]')
    return Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string' && lessons.some(l => l.id === id)))] : []
  } catch { return [] }
}
function StageVisual({ lesson }: { lesson: Lesson }) {
  const stage = lesson.stage || 'Start'
  return <div className={`learn-stage-visual learn-stage-visual-${stage.toLowerCase()}`} aria-hidden="true"><div className="learn-stage-tiles">{Array.from({ length: 9 }, (_, i) => <i key={i} className={(stage === 'Cross' ? [1, 3, 4, 5, 7].includes(i) : stage === 'OLL' || stage === 'PLL' ? true : [4, 5, 7, 8].includes(i)) ? 'lit' : ''} />)}</div><strong>{stage === 'Start' || stage === 'Speed' ? 'CFOP' : stage}</strong><span>{stage === 'Cross' ? 'PLAN → EXECUTE' : stage === 'F2L' ? 'FIND → PAIR → INSERT' : stage === 'OLL' ? 'RECOGNIZE → ORIENT' : stage === 'PLL' ? 'RECOGNIZE → PERMUTE' : 'UNDERSTAND → PRACTICE'}</span></div>
}
export default function Learn({ initialLessonId, onProgressChange }: LearnProps) {
  const initial = lessons.find(l => l.id === initialLessonId) || lessons.find(l => l.track === 'cfop' && !readProgress().includes(l.id)) || lessons[0]
  const [completed, setCompleted] = useState(readProgress)
  const [selectedId, setSelectedId] = useState(initial.id)
  const [track, setTrack] = useState<'cfop' | 'basics'>(initial.track)
  const [step, setStep] = useState(0)
  const [answer, setAnswer] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [showLessonList, setShowLessonList] = useState(false)
  const lesson = lessons.find(l => l.id === selectedId) || initial
  const trackLessons = lessons.filter(l => l.track === track)
  const lessonIndex = trackLessons.findIndex(l => l.id === lesson.id)
  const isQuiz = step === lesson.steps.length
  const currentStep = lesson.steps[Math.min(step, lesson.steps.length - 1)]
  const isCorrect = checked && answer === lesson.quiz.answer
  const trackComplete = trackLessons.filter(l => completed.includes(l.id)).length
  function selectLesson(id: string) {
    const next = lessons.find(l => l.id === id)
    if (!next) return
    setSelectedId(id); setTrack(next.track); setStep(0); setAnswer(null); setChecked(false); setSaveError(false); setShowLessonList(false)
  }
  useEffect(() => { if (initialLessonId && lessons.some(l => l.id === initialLessonId)) selectLesson(initialLessonId) }, [initialLessonId])
  useEffect(() => {
    const sync = () => setCompleted(readProgress())
    window.addEventListener('cubiq-data-change', sync); window.addEventListener('storage', sync)
    return () => { window.removeEventListener('cubiq-data-change', sync); window.removeEventListener('storage', sync) }
  }, [])
  function changeStep(index: number) { setStep(index); setAnswer(null); setChecked(false) }
  function changeTrack(next: 'cfop' | 'basics') {
    const first = lessons.find(l => l.track === next && !completed.includes(l.id)) || lessons.find(l => l.track === next)
    if (first) selectLesson(first.id)
  }
  function checkAnswer() {
    if (answer === null) return
    setChecked(true)
    if (answer !== lesson.quiz.answer) return
    const next = [...new Set([...readProgress(), lesson.id])]
    setCompleted(next)
    try { localStorage.setItem('cubiq-progress', JSON.stringify(next)); setSaveError(false); window.dispatchEvent(new CustomEvent('cubiq-data-change')); onProgressChange?.() } catch { setSaveError(true) }
  }
  return <div className="learn-page">
    <header className="learn-page-header"><div><div className="learn-eyebrow"><Zap size={14} /> THE COMPETITIVE METHOD</div><h1>CFOP. One move at a time<span>.</span></h1><p>The method used by many world-class speedcubers. Learn the decisions, then train the speed.</p></div><div className="learn-progress-summary"><strong>{trackComplete}<span> / {trackLessons.length}</span></strong><small>{track === 'cfop' ? 'CFOP' : 'optional'} lessons completed</small><div className="learn-progress-track"><span style={{ width: `${trackComplete / Math.max(1, trackLessons.length) * 100}%` }} /></div></div></header>
    <div className="learn-track-switch" aria-label="Learning track"><button className={track === 'cfop' ? 'is-active' : ''} aria-pressed={track === 'cfop'} onClick={() => changeTrack('cfop')}><Trophy size={15} /> CFOP speed path <span>START HERE</span></button><button className={track === 'basics' ? 'is-active' : ''} aria-pressed={track === 'basics'} onClick={() => changeTrack('basics')}><BookOpen size={15} /> Cube basics <span>OPTIONAL</span></button></div>
    <div className="learn-method-roadmap" aria-label="The four stages of CFOP">{stages.map(({ name, letter, subtitle, id, icon: Icon }, i) => <button key={id} className={lesson.stage === name ? 'is-current' : ''} onClick={() => selectLesson(id)}><span className="learn-method-letter">{letter}</span><div><strong>{name}<Icon size={14} /></strong><small>{subtitle}</small></div>{i < 3 && <ChevronRight className="learn-method-arrow" size={15} />}</button>)}</div>
    <div className="learn-layout">
      <aside className={`learn-sidebar ${showLessonList ? 'is-open' : ''}`}><button className="learn-mobile-list" onClick={() => setShowLessonList(!showLessonList)} aria-expanded={showLessonList}><span>{track === 'cfop' ? 'Your CFOP speed path' : 'Optional cube basics'}</span><ChevronDown size={17} /></button><div className="learn-lesson-list"><div className="learn-sidebar-label">{track === 'cfop' ? 'BUILD YOUR COMPETITIVE SOLVE' : 'OPTIONAL REFRESHERS'}</div>{trackLessons.map((item, i) => <button key={item.id} className={`learn-lesson-item ${item.id === lesson.id ? 'is-active' : ''} ${completed.includes(item.id) ? 'is-complete' : ''}`} onClick={() => selectLesson(item.id)} aria-current={item.id === lesson.id ? 'step' : undefined}><span className="learn-lesson-number">{completed.includes(item.id) ? <Check size={14} /> : String(i + 1).padStart(2, '0')}</span><span className="learn-lesson-label"><strong>{item.title}</strong><small>{item.stage || item.category} <span>·</span> {item.duration}</small></span>{item.id === lesson.id && <ChevronRight size={14} />}</button>)}</div><div className="learn-sidebar-tip"><Lightbulb size={17} /><div><strong>Elite method. Clear practice.</strong><p>Cross → four F2L pairs → OLL → PLL. Every lesson improves one part of that solve.</p><a href="https://www.cubeskills.com/tutorials" target="_blank" rel="noreferrer">CubeSkills video tutorials <ArrowRight size={12} /></a></div></div></aside>
      <section className="learn-workspace" aria-label={lesson.title}>
        <div className="learn-lesson-hero"><div className="learn-hero-copy"><div className="learn-hero-meta"><span>LESSON {String(lessonIndex + 1).padStart(2, '0')}</span><span className="learn-level-pill">{lesson.stage || lesson.level}</span></div><h2>{lesson.title}</h2><p>{lesson.description}</p><div className="learn-hero-details"><span><Clock3 size={13} /> {lesson.duration}</span><span><Target size={13} /> {lesson.category}</span>{completed.includes(lesson.id) && <span className="learn-completed-label"><CheckCircle2 size={13} /> Completed</span>}</div></div><StageVisual lesson={lesson} /></div>
        <div className="learn-step-progress" aria-label="Lesson steps">{lesson.steps.map((item, i) => <button key={item.title} className={i === step ? 'is-current' : i < step ? 'is-past' : ''} onClick={() => changeStep(i)} aria-label={`Step ${i + 1}: ${item.title}`} aria-current={i === step ? 'step' : undefined}><span /><small>{i + 1}</small></button>)}<button className={isQuiz ? 'is-current' : ''} onClick={() => changeStep(lesson.steps.length)} aria-label="Knowledge check" aria-current={isQuiz ? 'step' : undefined}><span /><small><Check size={11} /></small></button></div>
        {!isQuiz ? <div className={`learn-step-workspace ${currentStep.algorithm ? 'has-demo' : ''}`} key={`${lesson.id}-${step}`}><article className="learn-content-card"><div className="learn-content-kicker">ONE SKILL · STEP {step + 1} OF {lesson.steps.length}</div><h3>{currentStep.algorithm ? 'Set up. Spot it. Solve it.' : currentStep.title}</h3>{!currentStep.algorithm && <div className="learn-body">{currentStep.body.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}</div>}<div className="learn-coaching-cards">
          {currentStep.setup && <div className="learn-coaching-card"><span className="learn-coaching-number">1</span><div><strong>Set up your cube</strong><p>{currentStep.setup}</p></div></div>}
          {currentStep.watch && <div className="learn-coaching-card"><span className="learn-coaching-number">2</span><div><strong>Look for this</strong><p>{currentStep.watch}</p></div></div>}
          {currentStep.action && <div className="learn-coaching-card"><span className="learn-coaching-number">{currentStep.watch ? '3' : '2'}</span><div><strong>Make your move</strong><p>{currentStep.action}</p></div></div>}
          {currentStep.check && <div className="learn-coaching-card learn-success-check"><CheckCircle2 size={18} /><div><strong>You got it when…</strong><p>{currentStep.check}</p></div></div>}
        </div>{currentStep.drill && <div className="learn-drill"><span><Target size={16} /> YOUR PRACTICE REP</span><p>{currentStep.drill}</p></div>}{!currentStep.drill && !currentStep.algorithm && <div className="learn-practice-note"><Lightbulb size={16} /><p>Try this on your physical cube. Read the setup before starting a sequence.</p></div>}{lesson.id === 'cfop-full-pll' && <a className="learn-resource-link" href="#algorithms" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Practice all 21 PLL cases <ArrowRight size={15} /></a>}{lesson.id === 'cfop-full-oll' && <a className="learn-resource-link" href="https://jperm.net/algs/oll" target="_blank" rel="noreferrer">Open the full 57-case OLL reference <ArrowRight size={15} /></a>}</article>
          {currentStep.algorithm ? <section className="learn-demo" aria-label="Animated lesson example"><div className="learn-demo-intro"><div className="learn-content-kicker">ONE SKILL · STEP {step + 1} OF {lesson.steps.length}</div><h3>{currentStep.title}</h3><p>{currentStep.body}</p></div><div className="learn-demo-heading"><span><Play size={13} /> WATCH IT. STEP THROUGH IT. TRY IT.</span><span>PREPARED PRACTICE CASE</span></div><CubeTrainer algorithm={currentStep.algorithm} coach orientation="yellow-top" focus={lesson.stage === 'Cross' ? 'cross' : lesson.stage === 'F2L' ? 'f2l' : undefined} /><details className="learn-demo-setup"><summary><RotateCcw size={13} /> Set up the same case on a physical cube <ChevronDown size={13} /></summary><p>Start with a solved cube, yellow up and green in front. Make these setup moves, then follow the demo above.</p><code>{invertAlgorithm(currentStep.algorithm).join(' ').replaceAll("'", '′')}</code><small>This demonstrates one exact case. In a real solve, match the piece positions before using the sequence.</small></details></section> : <section className="learn-no-demo"><span className="learn-demo-heading"><Eye size={15} /> UNDERSTAND THE TARGET</span><StageVisual lesson={lesson} /><div className="learn-orientation-guide"><span><i className="learn-swatch-yellow" /> Yellow on top</span><span><i className="learn-swatch-white" /> White underneath</span><span><i className="learn-swatch-green" /> Green faces you for demos</span></div><p>{lesson.stage === 'Cross' ? 'The cross belongs underneath. Check the side colors too: each edge must match its side center.' : lesson.stage === 'F2L' ? 'Each pair contains one white corner and the edge with its two side colors. They belong in the same slot.' : lesson.stage === 'OLL' ? 'Orient means turn the last-layer pieces so the top becomes one color. Side colors are solved in PLL.' : lesson.stage === 'PLL' ? 'Permute means move pieces to their correct locations while keeping the top color facing upward.' : 'CFOP combines planning, piece pairing, case recognition, and practiced turns. Build one skill at a time.'}</p></section>}
          <div className="learn-step-navigation"><button className="learn-button-secondary" onClick={() => changeStep(step - 1)} disabled={step === 0}><ArrowLeft size={15} /> Previous</button><span>Practice first. Continue when the setup makes sense.</span><button className="learn-button-primary" onClick={() => changeStep(step + 1)}>{step === lesson.steps.length - 1 ? 'Knowledge check' : 'Next step'}<ArrowRight size={15} /></button></div>
        </div> : <article className="learn-content-card learn-quiz"><div className="learn-content-kicker">CHECK THE DECISION BEHIND THE MOVES</div><h3>{lesson.quiz.question}</h3><p className="learn-quiz-intro">Understanding the case helps you recognize it faster next time.</p><div className="learn-quiz-options" role="group" aria-label="Answer options">{lesson.quiz.options.map((option, i) => <button key={option} className={`${answer === i ? 'is-selected' : ''} ${checked && answer === i ? isCorrect ? 'is-correct' : 'is-incorrect' : ''}`} aria-pressed={answer === i} onClick={() => { setAnswer(i); setChecked(false) }} disabled={isCorrect}><span className="learn-option-letter">{isCorrect && answer === i ? <Check size={14} /> : String.fromCharCode(65 + i)}</span>{option}</button>)}</div>{checked && <div className={`learn-quiz-feedback ${isCorrect ? 'is-correct' : ''}`} role="status"><strong>{isCorrect ? 'Correct. You understand the next decision.' : 'Try again. Here’s the clue.'}</strong><p>{lesson.quiz.explanation}</p>{saveError && <p>Your browser could not save this result. It is available for this visit only.</p>}</div>}<div className="learn-step-navigation"><button className="learn-button-secondary" onClick={() => changeStep(lesson.steps.length - 1)}><ArrowLeft size={15} /> Review</button>{isCorrect ? <button className="learn-button-primary" onClick={() => selectLesson(trackLessons[(lessonIndex + 1) % trackLessons.length].id)}>{lessonIndex < trackLessons.length - 1 ? 'Next lesson' : 'Revisit the path'}<ArrowRight size={15} /></button> : <button className="learn-button-primary" onClick={checkAnswer} disabled={answer === null}>Check answer<Check size={15} /></button>}</div></article>}
        <footer className="learn-workspace-footer"><span><BookOpen size={13} /> Lesson checks track understanding. Physical practice builds speed.</span><button onClick={() => changeStep(0)}><RotateCcw size={12} /> Restart lesson</button></footer>
      </section>
    </div>
  </div>
}
