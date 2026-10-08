import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronDown, RotateCcw, Trophy } from 'lucide-react'
import { lessons } from '../data/curriculum'
import { invertAlgorithm } from '../lib/cube'
import CubeTrainer from './CubeTrainer'
import './Learn.css'

type LearnProps = { initialLessonId?: string; onProgressChange?: () => void }
const stages = [
  { name: 'Cross', id: 'cfop-cross' },
  { name: 'F2L', id: 'cfop-f2l' },
  { name: 'OLL', id: 'cfop-oll' },
  { name: 'PLL', id: 'cfop-pll' },
]
function readProgress(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem('cubiq-progress') || '[]')
    return Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string' && lessons.some(l => l.id === id)))] : []
  } catch { return [] }
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
  const lessonNavigation = useRef<HTMLDetailsElement>(null)
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
    setSelectedId(id); setTrack(next.track); setStep(0); setAnswer(null); setChecked(false); setSaveError(false)
    if (lessonNavigation.current) lessonNavigation.current.open = false
  }
  useEffect(() => { if (initialLessonId && lessons.some(l => l.id === initialLessonId)) selectLesson(initialLessonId) }, [initialLessonId])
  useEffect(() => {
    const sync = () => setCompleted(readProgress())
    window.addEventListener('cubiq-data-change', sync); window.addEventListener('storage', sync)
    return () => { window.removeEventListener('cubiq-data-change', sync); window.removeEventListener('storage', sync) }
  }, [])
  function changeStep(index: number) { setStep(index); setAnswer(null); setChecked(false); if (lessonNavigation.current) lessonNavigation.current.open = false }
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
    <header className="learn-page-header">
      <h1>{track === 'cfop' ? 'CFOP practice' : 'Cube basics'}</h1>
      <span className="learn-progress-summary">{trackComplete} of {trackLessons.length} lessons complete</span>
    </header>
    <details className="learn-navigation-disclosure" ref={lessonNavigation}>
      <summary><span>{lesson.title}</span><span>Change lesson <ChevronDown size={20} /></span></summary>
      <div className="learn-navigation">
      <div className="learn-track-switch" aria-label="Learning track">
        <button className={track === 'cfop' ? 'is-active' : ''} aria-pressed={track === 'cfop'} onClick={() => changeTrack('cfop')}><Trophy size={18} /> CFOP</button>
        <button className={track === 'basics' ? 'is-active' : ''} aria-pressed={track === 'basics'} onClick={() => changeTrack('basics')}><BookOpen size={18} /> Optional basics</button>
      </div>
      {track === 'cfop' && <nav className="learn-method-roadmap" aria-label="The four stages of CFOP">{stages.map(({ name, id }, i) => <button key={id} className={lesson.stage === name ? 'is-current' : ''} aria-current={lesson.stage === name ? 'step' : undefined} onClick={() => selectLesson(id)}><span>{i + 1}</span>{name}</button>)}</nav>}
      <label className="learn-lesson-picker"><span>Lesson</span><select aria-label="Lesson" value={lesson.id} onChange={event => selectLesson(event.target.value)}>{trackLessons.map((item, i) => <option key={item.id} value={item.id}>{i + 1}. {item.title}{completed.includes(item.id) ? ' ✓' : ''}</option>)}</select></label>
      <nav className="learn-step-progress" aria-label="Lesson steps">{lesson.steps.map((item, i) => <button key={item.title} className={i === step ? 'is-current' : ''} onClick={() => changeStep(i)} aria-label={`Step ${i + 1}: ${item.title}`} aria-current={i === step ? 'step' : undefined}>{i + 1}</button>)}<button className={`learn-check-step ${isQuiz ? 'is-current' : ''}`} onClick={() => changeStep(lesson.steps.length)} aria-label="Knowledge check" aria-current={isQuiz ? 'step' : undefined}><Check size={18} /><span>Check</span></button></nav>
      </div>
    </details>

    <section className="learn-workspace" aria-label={lesson.title}>

      {!isQuiz ? <div className="learn-step-workspace" key={`${lesson.id}-${step}`}>
        <header className="learn-exercise-heading"><h2>{currentStep.title}</h2><div className="learn-body">{(currentStep.algorithm ? [currentStep.watch || 'Press Next move once, then make the same turn on your cube.'] : currentStep.body.split('\n\n')).map((paragraph, i) => <p key={i}>{paragraph}</p>)}</div></header>

        {currentStep.algorithm ? <section className="learn-demo" aria-label="Animated lesson example">
          <CubeTrainer algorithm={currentStep.algorithm} coach orientation="yellow-top" focus={lesson.stage === 'Cross' ? 'cross' : lesson.stage === 'F2L' ? 'f2l' : undefined} />
          <details className="learn-demo-setup">
            <summary><RotateCcw size={20} /><span>Set up this case on your real cube</span><ChevronDown size={20} /></summary>
            <div className="learn-disclosure-content">
              <p>Start solved. Hold <strong>yellow on top</strong> and <strong>green toward you</strong>. Follow these setup moves to match the demo:</p>
              <code aria-label="Physical cube setup moves">{invertAlgorithm(currentStep.algorithm).join(' ').replaceAll("'", '′')}</code>
              {currentStep.setup && <p>{currentStep.setup}</p>}
              <p>Keep the same grip, then use <strong>Next move</strong> to solve alongside the cube.</p>
            </div>
          </details>
        </section> : <div className="learn-practice-task">
          {currentStep.setup && <p><strong>Start here</strong>{currentStep.setup}</p>}
          {currentStep.action && <p><strong>Try it</strong>{currentStep.action}</p>}
          {currentStep.watch && <p><strong>Look for</strong>{currentStep.watch}</p>}
        </div>}

        {currentStep.check && <div className="learn-success-check"><CheckCircle2 size={22} /><p><strong>Check your result:</strong> {currentStep.check}</p></div>}
        {(currentStep.algorithm || currentStep.drill || lesson.id === 'cfop-full-pll' || lesson.id === 'cfop-full-oll') && <details className="learn-practice-details">
          <summary><span>More guidance & practice</span><ChevronDown size={20} /></summary>
          <div className="learn-disclosure-content">
            {currentStep.algorithm && currentStep.body.split('\n\n').map((paragraph, i) => <p key={i}>{paragraph}</p>)}
            {currentStep.algorithm && currentStep.action && <p><strong>Try:</strong> {currentStep.action}</p>}
            {currentStep.drill && <p><strong>Practice:</strong> {currentStep.drill}</p>}
            {lesson.id === 'cfop-full-pll' && <a className="learn-resource-link" href="#algorithms" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Practice all 21 PLL cases <ArrowRight size={18} /></a>}
            {lesson.id === 'cfop-full-oll' && <a className="learn-resource-link" href="https://jperm.net/algs/oll" target="_blank" rel="noreferrer">Full 57-case OLL reference <ArrowRight size={18} /></a>}
          </div>
        </details>}
        <div className="learn-step-navigation"><button className="learn-button-secondary" onClick={() => changeStep(step - 1)} disabled={step === 0}><ArrowLeft size={18} />Previous step</button><button className="learn-button-primary" onClick={() => changeStep(step + 1)}>{step === lesson.steps.length - 1 ? 'Knowledge check' : 'Next lesson step'}<ArrowRight size={18} /></button></div>
      </div> : <article className="learn-quiz">
        <h2>{lesson.quiz.question}</h2>
        <div className="learn-quiz-options" role="group" aria-label="Answer options">{lesson.quiz.options.map((option, i) => <button key={option} className={`${answer === i ? 'is-selected' : ''} ${checked && answer === i ? isCorrect ? 'is-correct' : 'is-incorrect' : ''}`} aria-pressed={answer === i} onClick={() => { setAnswer(i); setChecked(false) }} disabled={isCorrect}><span className="learn-option-letter">{isCorrect && answer === i ? <Check size={18} /> : String.fromCharCode(65 + i)}</span>{option}</button>)}</div>
        {checked && <div className={`learn-quiz-feedback ${isCorrect ? 'is-correct' : ''}`} role="status"><strong>{isCorrect ? 'Correct.' : 'Try again.'}</strong><p>{lesson.quiz.explanation}</p>{saveError && <p>Your browser could not save this result. It is available for this visit only.</p>}</div>}
        <div className="learn-step-navigation"><button className="learn-button-secondary" onClick={() => changeStep(lesson.steps.length - 1)}><ArrowLeft size={18} />Review</button>{isCorrect ? <button className="learn-button-primary" onClick={() => selectLesson(trackLessons[(lessonIndex + 1) % trackLessons.length].id)}>{lessonIndex < trackLessons.length - 1 ? 'Next lesson' : 'Revisit lessons'}<ArrowRight size={18} /></button> : <button className="learn-button-primary" onClick={checkAnswer} disabled={answer === null}>Check answer<Check size={18} /></button>}</div>
      </article>}
      <footer className="learn-workspace-footer"><button onClick={() => changeStep(0)}><RotateCcw size={17} />Restart lesson</button></footer>
    </section>
  </div>
}
