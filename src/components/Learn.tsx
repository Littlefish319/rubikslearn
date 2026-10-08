import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronRight, Clock3, Lightbulb, RotateCcw, Sparkles, Target } from 'lucide-react'
import { lessons } from '../data/curriculum'
import './Learn.css'

type LearnProps = { initialLessonId?: string; onProgressChange?: () => void }

function readProgress(): string[] {
  try {
    const saved = JSON.parse(localStorage.getItem('cubiq-progress') || '[]')
    return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string' && lessons.some(lesson => lesson.id === id)) : []
  } catch { return [] }
}

const ollPatterns: Record<number, number[]> = {
  2: [1, 3, 4, 5, 6, 7], 3: [1, 2, 3, 4, 5, 7],
  4: [1, 3, 4, 5, 7], 5: [1, 3, 4, 5, 7],
  6: [0, 1, 2, 3, 4, 5, 7], 7: [1, 2, 3, 4, 5, 7, 8],
  8: [1, 2, 3, 4, 5, 6, 7],
}

function CubeDiagram({ lessonId, step }: { lessonId: string; step: number }) {
  const isOll = lessonId === 'two-look-oll' && step > 1
  const isCross = ['white-cross', 'yellow-cross', 'yellow-edges'].includes(lessonId)
  const highlighted = isOll ? ollPatterns[step] : isCross ? [1, 3, 4, 5, 7] : [0, 1, 2, 3, 4, 5, 6, 7, 8]
  const faceColor = lessonId === 'white-cross' || lessonId === 'white-corners' ? '#ffffff' : '#efd363'

  if (isOll || isCross) return (
    <figure className="learn-diagram learn-diagram-top" aria-label={isOll ? 'Yellow stickers on the top face for this case; use the text to check side stickers too.' : 'Target cross pattern: center and four edge stickers'}>
      <span className="learn-diagram-back">BACK</span>
      <div className="learn-face-grid">
        {Array.from({ length: 9 }, (_, i) => <span key={i} style={{ background: highlighted?.includes(i) ? faceColor : '#c9cec1' }}>{i === 4 ? (faceColor === '#ffffff' ? 'W' : 'Y') : ''}</span>)}
      </div>
      <span className="learn-diagram-front">FRONT · YOU</span>
      <figcaption>{isOll ? 'Top view · check side clues below' : 'Target pattern · corners ignored'}</figcaption>
    </figure>
  )

  return (
    <figure className="learn-diagram learn-diagram-cube" aria-label="Illustration of a solved cube with yellow top, green front, and orange right faces">
      <svg viewBox="0 0 210 195" role="img" aria-hidden="true">
        <defs>
          <pattern id="learn-top-tiles" width="29" height="29" patternUnits="userSpaceOnUse"><rect x="2" y="2" width="25" height="25" rx="3" fill="#efd363" /></pattern>
          <pattern id="learn-front-tiles" width="29" height="29" patternUnits="userSpaceOnUse"><rect x="2" y="2" width="25" height="25" rx="3" fill="#93ad82" /></pattern>
          <pattern id="learn-right-tiles" width="29" height="29" patternUnits="userSpaceOnUse"><rect x="2" y="2" width="25" height="25" rx="3" fill="#f5825e" /></pattern>
        </defs>
        <ellipse cx="105" cy="174" rx="63" ry="9" fill="#26372b" opacity=".08" />
        <g stroke="#36483b" strokeWidth="2" strokeLinejoin="round">
          <path d="M105 17 180 60 105 103 30 60Z" fill="#36483b" />
          <path d="M30 60 105 103 105 173 30 130Z" fill="#36483b" />
          <path d="M105 103 180 60 180 130 105 173Z" fill="#36483b" />
        </g>
        <rect width="87" height="87" fill="url(#learn-top-tiles)" transform="matrix(.862 -.494 .862 .494 30 60)" />
        <rect width="87" height="87" fill="url(#learn-front-tiles)" transform="matrix(.862 .494 0 .805 30 60)" />
        <rect width="87" height="87" fill="url(#learn-right-tiles)" transform="matrix(.862 -.494 0 .805 105 103)" />
      </svg>
      <figcaption>Keep a real cube within reach.</figcaption>
    </figure>
  )
}

export default function Learn({ initialLessonId, onProgressChange }: LearnProps) {
  const [completed, setCompleted] = useState<string[]>(readProgress)
  const [selectedId, setSelectedId] = useState(() => initialLessonId && lessons.some(l => l.id === initialLessonId) ? initialLessonId : lessons.find(l => !readProgress().includes(l.id))?.id || lessons[0].id)
  const [filter, setFilter] = useState<'All lessons' | 'Beginner' | 'CFOP & speed'>('All lessons')
  const [step, setStep] = useState(0)
  const [answer, setAnswer] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [showLessonList, setShowLessonList] = useState(false)
  const lesson = lessons.find(item => item.id === selectedId) || lessons[0]
  const lessonIndex = lessons.indexOf(lesson)
  const isQuiz = step === lesson.steps.length
  const currentStep = lesson.steps[Math.min(step, lesson.steps.length - 1)]
  const isCorrect = checked && answer === lesson.quiz.answer

  useEffect(() => {
    if (initialLessonId && lessons.some(item => item.id === initialLessonId)) {
      setSelectedId(initialLessonId); setStep(0); setAnswer(null); setChecked(false)
    }
  }, [initialLessonId])

  useEffect(() => {
    const sync = () => setCompleted(readProgress())
    window.addEventListener('cubiq-data-change', sync)
    window.addEventListener('storage', sync)
    return () => { window.removeEventListener('cubiq-data-change', sync); window.removeEventListener('storage', sync) }
  }, [])

  function selectLesson(id: string) {
    setSelectedId(id); setStep(0); setAnswer(null); setChecked(false); setSaveError(false); setShowLessonList(false)
  }

  function checkAnswer() {
    if (answer === null) return
    setChecked(true)
    if (answer === lesson.quiz.answer) {
      const next = Array.from(new Set([...readProgress(), lesson.id]))
      setCompleted(next)
      try {
        localStorage.setItem('cubiq-progress', JSON.stringify(next))
        setSaveError(false)
        window.dispatchEvent(new CustomEvent('cubiq-data-change'))
        onProgressChange?.()
      } catch { setSaveError(true) }
    }
  }

  const visibleLessons = lessons.filter(item => filter === 'All lessons' || (filter === 'Beginner' ? item.level === 'Beginner' : item.level !== 'Beginner'))

  return (
    <div className="learn-page">
      <header className="learn-page-header">
        <div><div className="learn-eyebrow"><BookOpen size={14} /> THE LEARNING PATH</div><h1>Great solves start here<span>.</span></h1><p>From your first turn to your next breakthrough. One skill at a time.</p></div>
        <div className="learn-progress-summary"><span><strong>{completed.length}</strong> / {lessons.length}</span><small>lessons completed</small><div className="learn-progress-track"><span style={{ width: `${completed.length / lessons.length * 100}%` }} /></div></div>
      </header>

      <div className="learn-filters" aria-label="Filter lessons">{(['All lessons', 'Beginner', 'CFOP & speed'] as const).map(value => <button type="button" key={value} className={filter === value ? 'is-active' : ''} onClick={() => setFilter(value)} aria-pressed={filter === value}>{value}</button>)}</div>

      <div className="learn-layout">
        <aside className={`learn-sidebar ${showLessonList ? 'is-open' : ''}`}>
          <button className="learn-mobile-list" onClick={() => setShowLessonList(!showLessonList)} aria-expanded={showLessonList}><span>Your learning path</span><ChevronRight size={18} /></button>
          <div className="learn-lesson-list"><div className="learn-sidebar-label">YOUR NEXT CHAPTER</div>{visibleLessons.map(item => {
            const index = lessons.indexOf(item)
            const isDone = completed.includes(item.id)
            return <button type="button" key={item.id} className={`learn-lesson-item ${item.id === lesson.id ? 'is-active' : ''} ${isDone ? 'is-complete' : ''}`} onClick={() => selectLesson(item.id)} aria-current={item.id === lesson.id ? 'step' : undefined}><span className="learn-lesson-number">{isDone ? <Check size={15} /> : String(index + 1).padStart(2, '0')}</span><span className="learn-lesson-label"><strong>{item.title}</strong><small>{item.duration} <span>·</span> {item.level}</small></span>{item.id === lesson.id && <ChevronRight className="learn-current-arrow" size={15} />}</button>
          })}</div>
          <div className="learn-sidebar-tip"><Sparkles size={19} /><div><strong>Consistency beats rushing.</strong><p>Ten focused minutes today is a good place to start.</p></div></div>
        </aside>

        <section className="learn-workspace" aria-label={lesson.title}>
          <div className="learn-lesson-hero">
            <div className="learn-hero-copy"><div className="learn-hero-meta"><span>LESSON {String(lessonIndex + 1).padStart(2, '0')}</span><span className="learn-level-pill">{lesson.level}</span></div><h2>{lesson.title}</h2><p>{lesson.description}</p><div className="learn-hero-details"><span><Clock3 size={14} /> {lesson.duration}</span><span><Target size={14} /> {lesson.category}</span>{completed.includes(lesson.id) && <span className="learn-completed-label"><CheckCircle2 size={14} /> Completed</span>}</div></div>
            <CubeDiagram lessonId={lesson.id} step={step} />
          </div>

          <div className="learn-step-progress" aria-label="Lesson steps">{lesson.steps.map((item, index) => <button type="button" key={item.title} className={index === step ? 'is-current' : index < step ? 'is-past' : ''} onClick={() => setStep(index)} aria-label={`Step ${index + 1}: ${item.title}`} aria-current={index === step ? 'step' : undefined}><span /></button>)}<button type="button" className={isQuiz ? 'is-current' : ''} onClick={() => setStep(lesson.steps.length)} aria-label="Knowledge check" aria-current={isQuiz ? 'step' : undefined}><span /></button></div>

          {!isQuiz ? <article className="learn-content-card" key={`${lesson.id}-${step}`}>
            <div className="learn-content-kicker">STEP {String(step + 1).padStart(2, '0')} OF {String(lesson.steps.length).padStart(2, '0')}</div>
            <h3>{currentStep.title}</h3>
            <div className="learn-body">{currentStep.body.split('\n\n').map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
            {currentStep.algorithm && <div className="learn-algorithm"><span>YOUR MOVE SEQUENCE</span><code>{currentStep.algorithm}</code><small>Read left to right. A prime (′) reverses the turn; 2 means a half-turn.</small></div>}
            <div className="learn-practice-note"><Lightbulb size={18} /><p>Try this with your cube before moving on. You can revisit any step.</p></div>
            <div className="learn-step-navigation"><button className="learn-button-secondary" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}><ArrowLeft size={16} /> Previous</button><span>{step + 1} / {lesson.steps.length}</span><button className="learn-button-primary" onClick={() => { setStep(step + 1); setAnswer(null); setChecked(false) }}>{step === lesson.steps.length - 1 ? 'Check your knowledge' : 'Next step'}<ArrowRight size={16} /></button></div>
          </article> : <article className="learn-content-card learn-quiz" key={`${lesson.id}-quiz`}>
            <div className="learn-content-kicker">A QUICK KNOWLEDGE CHECK</div><h3>{lesson.quiz.question}</h3><p className="learn-quiz-intro">One question to lock in what you learned.</p>
            <div className="learn-quiz-options" role="group" aria-label="Answer options">{lesson.quiz.options.map((option, index) => <button type="button" key={option} className={`${answer === index ? 'is-selected' : ''} ${checked && answer === index ? isCorrect ? 'is-correct' : 'is-incorrect' : ''}`} aria-pressed={answer === index} onClick={() => { setAnswer(index); setChecked(false) }} disabled={isCorrect}><span className="learn-option-letter">{checked && answer === index && isCorrect ? <Check size={15} /> : String.fromCharCode(65 + index)}</span><span>{option}</span></button>)}</div>
            {checked && <div className={`learn-quiz-feedback ${isCorrect ? 'is-correct' : ''}`} role="status"><strong>{isCorrect ? '1 / 1 — You’ve got it. Lesson complete!' : '0 / 1 — Take another look.'}</strong><p>{lesson.quiz.explanation}</p>{saveError && <p>Your browser could not save this result. Progress is available for this visit only.</p>}</div>}
            <div className="learn-step-navigation"><button className="learn-button-secondary" onClick={() => setStep(lesson.steps.length - 1)}><ArrowLeft size={16} /> Review lesson</button>{isCorrect ? <button className="learn-button-primary" onClick={() => selectLesson(lessons[(lessonIndex + 1) % lessons.length].id)}>{lessonIndex < lessons.length - 1 ? 'Next lesson' : 'Revisit foundations'}<ArrowRight size={16} /></button> : <button className="learn-button-primary" onClick={checkAnswer} disabled={answer === null}>{checked ? 'Check again' : 'Check answer'}<Check size={16} /></button>}</div>
          </article>}

          <footer className="learn-workspace-footer"><span><BookOpen size={14} /> Learn it. Try it. Make it yours.</span><button onClick={() => { setStep(0); setAnswer(null); setChecked(false) }}><RotateCcw size={13} /> Restart lesson</button></footer>
        </section>
      </div>
    </div>
  )
}
